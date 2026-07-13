"""LLM-powered creature extraction from 山海经 text."""
import json
import os
import re
import sys
from pathlib import Path
from pydantic import BaseModel
from extract_prompts import SYSTEM_PROMPT, USER_TEMPLATE


class CreatureCandidate(BaseModel):
    name: str
    original_text: str
    source_hint: str = ""
    scroll: str = ""


class ExtractionResult(BaseModel):
    candidates: list[CreatureCandidate]
    section: str
    scroll: str


# Patterns for identifying creature mentions
CREATURE_PATTERNS = [
    r'有兽焉[^。]*?其名曰(\S+?)[，。]',
    r'有鸟焉[^。]*?其名曰(\S+?)[，。]',
    r'有鱼焉[^。]*?其名曰(\S+?)[，。]',
    r'有蛇焉[^。]*?其名曰(\S+?)[，。]',
    r'其中多(\S+?)[，。]',
    r'名曰(\S+?)，',
]

# Exclusion patterns (plants, minerals, etc.)
EXCLUDE_NAMES = {'文茎', '萆荔', '祝余', '迷榖', '条'}


def extract_creature_name(sentence: str) -> str | None:
    """Extract creature name from a sentence using pattern matching."""
    # Look for "名曰X" pattern
    match = re.search(r'名曰(\S+?)[，。、]', sentence)
    if match:
        name = match.group(1).strip()
        if name and name not in EXCLUDE_NAMES:
            return name
    # Look for "其中多X" pattern
    match = re.search(r'其中多(\S+?)[，。、]', sentence)
    if match:
        name = match.group(1).strip()
        if name and name not in EXCLUDE_NAMES:
            return name
    return None


def extract_source_hint(text: str) -> str:
    """Extract the mountain/river name from the section."""
    match = re.search(r'曰(\S+?之山)', text)
    if match:
        return match.group(1)
    match = re.search(r'曰(\S+?山)', text)
    if match:
        return match.group(1)
    return ""


def split_into_sentences(text: str) -> list[str]:
    """Split Chinese text into sentences."""
    # Split by Chinese period, but keep context
    sentences = re.split(r'(?<=。)', text)
    return [s.strip() for s in sentences if s.strip()]


def find_creature_context(sentences: list[str], name: str) -> str:
    """Find the full context (original_text) for a creature name."""
    context_parts = []
    for i, sent in enumerate(sentences):
        if name in sent:
            # Include the sentence and the one before for context
            start = max(0, i - 1)
            end = min(len(sentences), i + 2)
            context_parts.append(''.join(sentences[start:end]))
    return context_parts[0] if context_parts else ""


def parse_creatures_from_section(text: str, scroll: str = "") -> list[dict]:
    """
    Parse creatures from a section of 山海经 text.

    This is a rule-based parser that serves as a fallback when the LLM is not available.
    In production, this would call qwen-max via DashScope for more accurate extraction.
    """
    if not text or not text.strip():
        return []

    source_hint = extract_source_hint(text)
    sentences = split_into_sentences(text)

    # Find sentences with creature markers
    creature_markers = ['有兽焉', '有鸟焉', '有鱼焉', '有蛇焉', '其中多']
    found_creatures = {}

    for i, sent in enumerate(sentences):
        # Skip sentences about plants
        if any(marker in sent for marker in ['有木焉', '有草焉']):
            continue

        # Check if sentence has a creature marker
        has_marker = any(marker in sent for marker in creature_markers)

        if has_marker:
            name = extract_creature_name(sent)
            if name and name not in found_creatures and name not in EXCLUDE_NAMES:
                original_text = find_creature_context(sentences, name)
                if not original_text:
                    original_text = sent
                found_creatures[name] = {
                    "name": name,
                    "original_text": original_text,
                    "source_hint": source_hint,
                    "scroll": scroll,
                }

    return list(found_creatures.values())


def extract_with_llm(text: str, scroll: str, api_key: str | None = None) -> list[dict] | None:
    """
    Extract creatures using DashScope qwen-max LLM.

    This function calls the actual LLM API. It's separated from parse_creatures_from_section
    so that the rule-based parser can be used as a fallback.

    Returns None when the API call fails or the response is invalid (B4-14).
    """
    import dashscope
    dashscope.api_key = api_key or os.environ.get("DASHSCOPE_API_KEY", "")

    user_prompt = USER_TEMPLATE.format(scroll=scroll, text=text)

    # ── B4-14：调用 API 时捕获网络/SDK 异常 ──
    try:
        rsp = dashscope.Generation.call(
            model="qwen-max",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            result_format="message",
        )
    except Exception as e:
        print(f"[extract_with_llm] 错误：调用 DashScope 失败 - {e}", file=sys.stderr)
        return None

    # ── B4-14：校验 API 响应结构 ──
    if rsp is None:
        print("[extract_with_llm] 错误：API 返回空响应", file=sys.stderr)
        return None

    status_code = getattr(rsp, "status_code", None)
    if status_code is not None and status_code != 200:
        request_id = getattr(rsp, "request_id", "")
        print(
            f"[extract_with_llm] 错误：API 返回状态码 {status_code}"
            f"{f'（request_id={request_id}）' if request_id else ''}",
            file=sys.stderr,
        )
        return None

    output = getattr(rsp, "output", None)
    if output is None:
        print("[extract_with_llm] 错误：API 响应中缺少 output 字段", file=sys.stderr)
        return None

    choices = getattr(output, "choices", None)
    if not choices:
        print("[extract_with_llm] 错误：API 响应中 choices 为空", file=sys.stderr)
        return None

    content = choices[0].message.content
    # Parse JSON from LLM response
    try:
        creatures = json.loads(content)
    except json.JSONDecodeError:
        # Try to extract JSON array from text
        match = re.search(r'\[.*\]', content, re.DOTALL)
        if match:
            try:
                creatures = json.loads(match.group())
            except json.JSONDecodeError:
                print("[extract_with_llm] 错误：无法解析 LLM 返回的 JSON", file=sys.stderr)
                return None
        else:
            print("[extract_with_llm] 错误：LLM 返回内容中未找到 JSON 数组", file=sys.stderr)
            return None

    # Add scroll to each creature
    for c in creatures:
        c["scroll"] = scroll
        if "source_hint" not in c:
            c["source_hint"] = extract_source_hint(text)

    return creatures


def extract_from_file(file_path: Path, scroll: str = "") -> list[dict]:
    """Extract creatures from a text file containing 山海经 text."""
    text = file_path.read_text(encoding="utf-8")
    return parse_creatures_from_section(text, scroll=scroll)


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Usage: python extract_creatures.py <input.txt> <output.json>")
        sys.exit(1)

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])

    text = input_path.read_text(encoding="utf-8")
    creatures = parse_creatures_from_section(text, scroll="山海经")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(creatures, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Extracted {len(creatures)} creatures to {output_path}")
