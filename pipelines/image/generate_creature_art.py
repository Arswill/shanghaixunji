import os, sys, json
from pathlib import Path

# Ensure the local prompts package is resolvable regardless of where the
# script is imported from (direct execution, pytest from root, etc.).
sys.path.insert(0, str(Path(__file__).parent))

from pydantic import BaseModel
from prompts.prompt_template import TEMPLATE
from prompts.style_negative import NEGATIVE_PROMPT

class CreatureImageRequest(BaseModel):
    creature_id: str
    name: str
    description: str

def build_prompt(req: CreatureImageRequest) -> str:
    return TEMPLATE.format(description=req.description)

def generate_one(req: CreatureImageRequest, out_dir: Path) -> Path:
    import replicate
    # ── B4-16：LoRA 配置说明 ──────────────────────────────────────────
    # 本管线引用自定义 LoRA「shanhaijing_darkfantasy_v1.safetensors」以生成
    # 统一的山海经暗黑奇幻画风。该 LoRA 权重文件不随仓库分发，使用前需：
    #   1. 自行训练或获取该 LoRA（基于 FLUX-1.1-dev 微调，建议 800-2000 步，
    #      数据集为山海经神兽暗黑奇幻风格插图）；
    #   2. 上传至 Replicate 平台（https://replicate.com/create）作为私有模型，
    #      或通过 Replicate 的 LoRA 挂载机制加载已托管权重；
    #   3. 将下方 input 中 "lora" 字段替换为 "你的用户名/模型名:版本号" 格式
    #      的访问标识，或指向已上传的 safetensors 权重 URI。
    # 若暂无 LoRA，可移除 input 中的 "lora" 字段，管线将退回 FLUX 原生画风。
    # ─────────────────────────────────────────────────────────────────
    out = replicate.run(
        "blackforestlabs/flux-1.1-dev",
        input={"prompt": build_prompt(req), "negative_prompt": NEGATIVE_PROMPT,
               "width": 1024, "height": 1024, "num_outputs": 1,
               "guidance_scale": 3.5, "output_format": "jpg",
               "lora": "shanhaijing_darkfantasy_v1.safetensors:0.8"},
    )
    # B4-15：输出 .jpg 以与实际图片资产（assets/images/*.jpg）保持一致
    out_path = out_dir / f"{req.creature_id}.jpg"
    out_path.write_bytes(replicate.download(out[0]))
    return out_path

def batch_generate(creatures: list[dict], out_dir: Path, skip_existing: bool = True, failures_log: Path | None = None) -> list[Path]:
    """Batch generate creature art for multiple creatures.

    Args:
        creatures: List of creature dicts with id, name, art_description
        out_dir: Output directory for image files
        skip_existing: If True, skip creatures whose image file already exists
        failures_log: Optional path to write failure log CSV

    Returns:
        List of successfully generated file paths
    """
    results = []
    failures = []

    for c in creatures:
        req = CreatureImageRequest(
            creature_id=c["id"],
            name=c["name"],
            description=c.get("art_description", c.get("description", ""))
        )
        out_path = out_dir / f"{req.creature_id}.jpg"
        # B4-15：兼容历史 .webp 命名，.jpg 或 .webp 任一存在即跳过
        legacy_path = out_dir / f"{req.creature_id}.webp"

        if skip_existing and (out_path.exists() or legacy_path.exists()):
            print(f"SKIP: {out_path.name} (already exists)")
            results.append(out_path)
            continue

        try:
            path = generate_one(req, out_dir)
            results.append(path)
            print(f"OK: {path.name}")
        except Exception as e:
            print(f"FAIL: {req.creature_id} - {e}")
            failures.append({"creature_id": req.creature_id, "error": str(e)})

    if failures_log and failures:
        import csv
        failures_log.parent.mkdir(parents=True, exist_ok=True)
        with open(failures_log, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=['creature_id', 'error'])
            writer.writeheader()
            writer.writerows(failures)

    return results

if __name__ == "__main__":
    import csv
    creatures = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    out_dir = Path(sys.argv[2]); out_dir.mkdir(parents=True, exist_ok=True)
    failures_log = Path(sys.argv[3]) if len(sys.argv) > 3 else None
    results = batch_generate(creatures, out_dir, skip_existing=True, failures_log=failures_log)
    print(f"\nDone: {len(results)} succeeded")
