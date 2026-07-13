"""CosyVoice V2 方言 TTS 批量生成管线（2026-07 更新）

用法：
  python generate_tts.py <creatures.json> <输出目录> [失败日志.csv]

前置条件：
  1. pip install dashscope pydantic python-dotenv
  2. 设置环境变量 DASHSCOPE_API_KEY

输出格式：{creature_id}__{province}.mp3
"""
import json, os, sys, time
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
DIALECT_MAP = json.loads(Path(__file__).parent.joinpath("dialect_map.json").read_text(encoding="utf-8"))

# CosyVoice V2 API（dashscope.audio.tts_v2.SpeechSynthesizer）
# dialect 通过 instruction 参数控制，不再嵌入 text 中
DEFAULT_VOICE = "longanyang"
MODEL = "cosyvoice-v3-flash"


class CreatureTTSRequest(BaseModel):
    creature_id: str
    province: str
    original_text: str


def dialect_text_prefix(province: str) -> str:
    """方言指令嵌入文本中（CosyVoice 接受自然语言指令）"""
    return DIALECT_MAP.get(province, "请用普通话表达")


def _get_api_key_or_exit() -> str:
    api_key = os.environ.get("DASHSCOPE_API_KEY")
    if not api_key:
        print("错误：未配置 DASHSCOPE_API_KEY。", file=sys.stderr)
        sys.exit(1)
    return api_key


def synthesize_one(req: CreatureTTSRequest, out_dir: Path, retries: int = 2) -> Path:
    """CosyVoice V2：方言指令嵌入文本中"""
    import dashscope
    from dashscope.audio.tts_v2 import SpeechSynthesizer

    dashscope.api_key = _get_api_key_or_exit()
    # 将方言指令嵌入文本（CosyVoice 支持自然语言指令控制方言）
    text = f"{dialect_text_prefix(req.province)}：{req.original_text}"

    last_err = None
    for attempt in range(retries + 1):
        try:
            synthesizer = SpeechSynthesizer(model=MODEL, voice=DEFAULT_VOICE)
            audio = synthesizer.call(text)

            if audio and len(audio) > 0:
                out = out_dir / f"{req.creature_id}__{req.province}.mp3"
                out.write_bytes(audio)
                return out
            else:
                resp = synthesizer.get_response()
                err = resp.get("header", {})
                msg = f"{err.get('error_code','?')}: {err.get('error_message','?')}"
                raise RuntimeError(msg)
        except Exception as e:
            last_err = e
            if attempt < retries:
                time.sleep(2)

    raise RuntimeError(f"{req.creature_id}/{req.province}: {last_err}")


def batch_synthesize(
    creatures: list[dict],
    out_dir: Path,
    skip_existing: bool = True,
    failures_log: Path | None = None,
) -> list[Path]:
    results = []
    failures = []

    for i, c in enumerate(creatures, 1):
        req = CreatureTTSRequest(
            creature_id=c["id"],
            province=c["province"],
            original_text=c["original_text"],
        )
        out_path = out_dir / f"{req.creature_id}__{req.province}.mp3"

        if skip_existing and out_path.exists():
           print(f"[{i}/{len(creatures)}] SKIP: {out_path.name}")
           results.append(out_path)
           continue

        try:
            path = synthesize_one(req, out_dir)
            results.append(path)
            print(f"[{i}/{len(creatures)}] OK: {path.name}")
        except Exception as e:
            print(f"[{i}/{len(creatures)}] FAIL: {req.creature_id} - {e}")
            failures.append({"creature_id": req.creature_id, "province": req.province, "error": str(e)})

    if failures_log and failures:
        import csv
        failures_log.parent.mkdir(parents=True, exist_ok=True)
        with open(failures_log, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["creature_id", "province", "error"])
            writer.writeheader()
            writer.writerows(failures)

    return results


if __name__ == "__main__":
    _get_api_key_or_exit()
    creatures = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out_dir = Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)
    failures_log = Path(sys.argv[3]) if len(sys.argv) > 3 else None
    results = batch_synthesize(creatures, out_dir, skip_existing=True, failures_log=failures_log)
    print(f"\nDone: {len(results)} succeeded")
