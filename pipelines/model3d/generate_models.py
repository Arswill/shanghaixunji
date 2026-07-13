#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
混元3D 批量生成神兽 3D 模型
=============================
使用腾讯混元生3D专业版 API (SubmitHunyuanTo3DProJob)，
将 7 只核心神兽的 FLUX 图片批量转换为 LowPoly GLB 模型。

流程：图生3D → LowPoly 拓扑 + PBR 材质 → 下载 GLB → 存入 models/

零 SDK 依赖：直接用 requests + TC3-HMAC-SHA256 签名调用云 API。

前置条件：
  1. 已注册腾讯云账号并实名认证
  2. 已开通「腾讯混元生3D」服务：https://console.cloud.tencent.com/ai3d
  3. 已获取 API 密钥 (SecretId / SecretKey)：https://console.cloud.tencent.com/cam/capi
  4. 安装依赖：pip install requests

用法：
  # PowerShell 设置密钥
  $env:TENCENTCLOUD_SECRET_ID='你的SecretId'
  $env:TENCENTCLOUD_SECRET_KEY='你的SecretKey'

  # 检查环境
  python pipelines/model3d/generate_models.py --check

  # 批量生成全部 7 只
  python pipelines/model3d/generate_models.py

  # 只生成指定神兽
  python pipelines/model3d/generate_models.py --only jiu-wei-hu,ying-long
"""

import os
import sys
import time
import json
import base64
import hashlib
import hmac
import logging
import argparse
from datetime import datetime, timezone
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    import requests
except ImportError:
    print("[ERROR] 缺少 requests 库，请运行：pip install requests")
    sys.exit(1)


# ════════════════════════════════════════════════════════════════════
# 配置
# ════════════════════════════════════════════════════════════════════

PROJECT_ROOT = Path(__file__).resolve().parents[2]
IMAGES_DIR = PROJECT_ROOT / "apps" / "web" / "public" / "assets" / "images"
MODELS_DIR = PROJECT_ROOT / "apps" / "web" / "public" / "assets" / "models"

# 7 只核心神兽（优先级顺序，SSR 级）
CORE_CREATURE_IDS = [
    "jiu-wei-hu", "ying-long", "qi-lin", "zhu-que",
    "bi-fang", "kun-peng", "tao-tie",
]

# 免费额度上限（超出部分跳过）
MAX_QUOTA = 100


def _load_creature_names():
    """从 creatures_verified.json 加载神兽中文名映射。"""
    name_map = {}
    try:
        import json as _json
        data_path = PROJECT_ROOT / "data" / "verified" / "creatures_verified.json"
        with open(data_path, "r", encoding="utf-8") as f:
            data = _json.load(f)
        for item in data:
            cid = item.get("id", "")
            cname = item.get("name", cid)
            name_map[cid] = cname
    except Exception:
        pass
    return name_map


def build_creature_list(limit=None):
    """
    构建神兽列表：7 只核心优先，然后扫描 images 目录补充其余神兽。
    limit: 最多返回多少只（None=全部，默认 MAX_QUOTA=100）。
    """
    if limit is None:
        limit = MAX_QUOTA
    name_map = _load_creature_names()

    # 核心神兽优先
    creatures = [
        {"id": cid, "name": name_map.get(cid, cid), "desc": "核心神兽", "core": True}
        for cid in CORE_CREATURE_IDS
    ]

    # 扫描其余图片
    seen = set(CORE_CREATURE_IDS)
    for img in sorted(IMAGES_DIR.glob("*.jpg")):
        cid = img.stem
        if cid in seen:
            continue
        seen.add(cid)
        creatures.append({
            "id": cid,
            "name": name_map.get(cid, cid),
            "desc": "",
            "core": False,
        })

    return creatures[:limit]


# 默认列表（向后兼容 --only 等逻辑）
CREATURES = build_creature_list()

# API 配置
SERVICE = "ai3d"
HOST = "ai3d.tencentcloudapi.com"
ENDPOINT = f"https://{HOST}"
VERSION = "2025-05-13"
REGION = "ap-guangzhou"
MODEL_VERSION = "3.0"        # 3.0 支持 LowPoly；3.1 不支持
GENERATE_TYPE = "Normal"     # Normal模式（LowPoly太慢>10min，Normal约3min/只）
POLYGON_TYPE = "triangle"    # 三角面
ENABLE_PBR = True            # 生成 PBR 材质
MAX_CONCURRENCY = 3          # API 默认 3 并发
USE_RAPID = False            # 是否使用极速版（更省积分：15 vs 30/只）

# 轮询 & 下载
POLL_INTERVAL_SEC = 5
POLL_TIMEOUT_SEC = 900       # 单任务超时 15 分钟（Normal约3min，留余量）
DOWNLOAD_TIMEOUT_SEC = 180
MAX_MODEL_SIZE_MB = 60       # Normal模式文件较大，警告阈值放宽

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("hunyuan3d")


# ════════════════════════════════════════════════════════════════════
# TC3-HMAC-SHA256 签名 + API 调用
# ════════════════════════════════════════════════════════════════════

def _sha256_hex(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def _hmac_sha256(key: bytes, msg: str) -> bytes:
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()


def call_api(action: str, payload: dict, secret_id: str, secret_key: str) -> dict:
    """
    调用腾讯云 API（TC3-HMAC-SHA256 签名 V3）。
    返回 Response JSON 字典。
    """
    # 1. 时间戳
    now = datetime.now(timezone.utc)
    timestamp = int(now.timestamp())
    date_str = now.strftime("%Y-%m-%d")

    # 2. 请求体
    payload_json = json.dumps(payload)
    body_hash = _sha256_hex(payload_json)

    # 3. 拼接规范请求串 (Canonical Request)
    http_method = "POST"
    canonical_uri = "/"
    canonical_querystring = ""
    canonical_headers = (
        f"content-type:application/json; charset=utf-8\n"
        f"host:{HOST}\n"
        f"x-tc-action:{action.lower()}\n"
    )
    signed_headers = "content-type;host;x-tc-action"
    canonical_request = (
        f"{http_method}\n{canonical_uri}\n{canonical_querystring}\n"
        f"{canonical_headers}\n{signed_headers}\n{body_hash}"
    )

    # 4. 拼接待签名串 (String to Sign)
    algorithm = "TC3-HMAC-SHA256"
    credential_scope = f"{date_str}/{SERVICE}/tc3_request"
    hashed_canonical_request = _sha256_hex(canonical_request)
    string_to_sign = (
        f"{algorithm}\n{timestamp}\n{credential_scope}\n"
        f"{hashed_canonical_request}"
    )

    # 5. 计算签名 (Signature)
    secret_date = _hmac_sha256(("TC3" + secret_key).encode("utf-8"), date_str)
    secret_service = _hmac_sha256(secret_date, SERVICE)
    secret_signing = _hmac_sha256(secret_service, "tc3_request")
    signature = hmac.new(
        secret_signing, string_to_sign.encode("utf-8"), hashlib.sha256
    ).hexdigest()

    # 6. 构建 Authorization 头
    authorization = (
        f"{algorithm} "
        f"Credential={secret_id}/{credential_scope}, "
        f"SignedHeaders={signed_headers}, "
        f"Signature={signature}"
    )

    # 7. 发送请求
    headers = {
        "Authorization": authorization,
        "Content-Type": "application/json; charset=utf-8",
        "Host": HOST,
        "X-TC-Action": action,
        "X-TC-Version": VERSION,
        "X-TC-Timestamp": str(timestamp),
        "X-TC-Region": REGION,
    }

    resp = requests.post(ENDPOINT, headers=headers, data=payload_json, timeout=30)
    resp_json = resp.json()

    # 检查 API 错误
    if "Response" in resp_json and "Error" in resp_json["Response"]:
        err = resp_json["Response"]["Error"]
        raise RuntimeError(f"API错误 [{action}]: {err.get('Code')} - {err.get('Message')}")

    return resp_json.get("Response", resp_json)


# ════════════════════════════════════════════════════════════════════
# 核心业务逻辑
# ════════════════════════════════════════════════════════════════════

def get_credentials():
    """从环境变量读取密钥。"""
    sid = os.environ.get("TENCENTCLOUD_SECRET_ID", "")
    skey = os.environ.get("TENCENTCLOUD_SECRET_KEY", "")
    if not sid or not skey:
        print(
            "[ERROR] 未检测到腾讯云密钥，请设置环境变量：\n"
            "  PowerShell:  $env:TENCENTCLOUD_SECRET_ID='...'; $env:TENCENTCLOUD_SECRET_KEY='...'\n"
            "  CMD:         set TENCENTCLOUD_SECRET_ID=... && set TENCENTCLOUD_SECRET_KEY=...\n"
            "密钥获取：https://console.cloud.tencent.com/cam/capi"
        )
        sys.exit(1)
    return sid, skey


def submit_job(secret_id, secret_key, creature: dict, max_retries: int = 60) -> str:
    """提交生3D任务，返回 JobId。支持专业版和极速版。遇到并发限制自动等待重试。"""
    image_path = IMAGES_DIR / f"{creature['id']}.jpg"
    if not image_path.exists():
        raise FileNotFoundError(f"源图片不存在：{image_path}")

    with open(image_path, "rb") as f:
        img_b64 = base64.b64encode(f.read()).decode("utf-8")

    img_size_mb = len(img_b64) / 1024 / 1024
    if img_size_mb > 6:
        raise ValueError(f"图片 base64 {img_size_mb:.1f}MB 超过 6MB 限制：{image_path}")

    # 极速版 vs 专业版
    if USE_RAPID:
        submit_action = "SubmitHunyuanTo3DRapidJob"
        query_action = "QueryHunyuanTo3DRapidJob"
        payload = {
            "ImageBase64": img_b64,
            "EnablePBR": ENABLE_PBR,
            "ResultFormat": "GLB",
        }
        version_tag = "极速版"
    else:
        submit_action = "SubmitHunyuanTo3DProJob"
        query_action = "QueryHunyuanTo3DProJob"
        payload = {
            "Model": MODEL_VERSION,
            "ImageBase64": img_b64,
            "GenerateType": GENERATE_TYPE,
            "EnablePBR": ENABLE_PBR,
        }
        if GENERATE_TYPE == "LowPoly":
            payload["PolygonType"] = POLYGON_TYPE
        version_tag = f"专业版({GENERATE_TYPE})"

    # 重试：遇到并发限制(JobNumExceeded)或资源不足(ResourceInsufficient)时等待后重试
    for attempt in range(max_retries):
        try:
            resp = call_api(submit_action, payload, secret_id, secret_key)
            job_id = resp.get("JobId")
            if not job_id:
                raise RuntimeError(f"未返回 JobId，响应: {resp}")
            log.info(f"[{creature['name']}] {version_tag}任务已提交 JobId={job_id} (图片 {img_size_mb:.2f}MB)")
            return job_id
        except RuntimeError as e:
            err_str = str(e)
            if "JobNumExceed" in err_str:
                if attempt == 0:
                    log.info(f"[{creature['name']}] 并发已满，排队等待...")
                time.sleep(15)
                continue
            # ResourceInsufficient 不重试，直接抛出
            raise
    raise RuntimeError(f"[{creature['name']}] 提交超时，重试 {max_retries} 次仍失败")


def poll_job(secret_id, secret_key, job_id: str, creature_name: str) -> list:
    """轮询任务状态直到 DONE / FAIL / 超时，返回结果文件列表。"""
    query_action = "QueryHunyuanTo3DRapidJob" if USE_RAPID else "QueryHunyuanTo3DProJob"
    elapsed = 0
    while elapsed < POLL_TIMEOUT_SEC:
        resp = call_api(query_action, {"JobId": job_id}, secret_id, secret_key)
        status = resp.get("Status", "")

        if status == "DONE":
            log.info(f"[{creature_name}] 生成完成 ✓ ({elapsed}s)")
            return resp.get("ResultFile3Ds", [])
        elif status == "FAIL":
            err_code = resp.get("ErrorCode", "unknown")
            err_msg = resp.get("ErrorMessage", "")
            raise RuntimeError(f"[{creature_name}] 任务失败: {err_code} - {err_msg}")
        else:
            if elapsed % 30 == 0:
                log.info(f"[{creature_name}] 状态={status}，已等待 {elapsed}s...")
            time.sleep(POLL_INTERVAL_SEC)
            elapsed += POLL_INTERVAL_SEC

    raise TimeoutError(f"[{creature_name}] 任务超时 ({POLL_TIMEOUT_SEC}s)")


def download_glb(result_files: list, output_path: Path, creature_name: str) -> Path:
    """从结果文件列表中找到 GLB 并下载。"""
    glb_url = None
    for f in result_files:
        if f.get("Type") == "GLB":
            glb_url = f.get("Url")
            break

    if not glb_url:
        available = [f.get("Type") for f in result_files]
        raise RuntimeError(f"[{creature_name}] 结果中未找到 GLB，可用: {available}")

    log.info(f"[{creature_name}] 正在下载 GLB...")
    resp = requests.get(glb_url, timeout=DOWNLOAD_TIMEOUT_SEC, stream=True)
    resp.raise_for_status()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)

    size_mb = output_path.stat().st_size / 1024 / 1024
    if size_mb > MAX_MODEL_SIZE_MB:
        log.warning(f"[{creature_name}] GLB {size_mb:.1f}MB 超 {MAX_MODEL_SIZE_MB}MB，建议 Blender 简化")
    else:
        log.info(f"[{creature_name}] GLB 已保存: {output_path.name} ({size_mb:.2f}MB)")
    return output_path


def process_creature(secret_id, secret_key, creature: dict) -> dict:
    """处理一只神兽：提交 → 轮询 → 下载。"""
    cid = creature["id"]
    cname = creature["name"]
    is_core = creature.get("core", False)
    output_path = MODELS_DIR / f"{cid}.glb"

    # 断点续传
    if output_path.exists():
        size_mb = output_path.stat().st_size / 1024 / 1024
        log.info(f"[{cname}] 已存在，跳过 ({size_mb:.2f}MB)")
        return {"id": cid, "name": cname, "success": True,
                "output": str(output_path), "size_mb": round(size_mb, 2),
                "skipped": True, "core": is_core}

    result = {"id": cid, "name": cname, "success": False,
              "output": None, "error": None, "size_mb": 0, "core": is_core}

    try:
        job_id = submit_job(secret_id, secret_key, creature)
        time.sleep(5)
        result_files = poll_job(secret_id, secret_key, job_id, cname)
        download_glb(result_files, output_path, cname)
        result["success"] = True
        result["output"] = str(output_path)
        result["size_mb"] = round(output_path.stat().st_size / 1024 / 1024, 2)
    except Exception as e:
        result["error"] = str(e)
        log.error(f"[{cname}] {e}")

    return result


# ════════════════════════════════════════════════════════════════════
# 主流程
# ════════════════════════════════════════════════════════════════════

def run_check():
    """仅检查环境，不调用 API。"""
    print("═══ 环境检查 ═══")
    sid = os.environ.get("TENCENTCLOUD_SECRET_ID", "")
    skey = os.environ.get("TENCENTCLOUD_SECRET_KEY", "")
    if sid and skey:
        print(f"  密钥:  ✓ 已配置 (SecretId={sid[:6]}...)")
    else:
        print("  密钥:  ✗ 未配置（设置 TENCENTCLOUD_SECRET_ID / TENCENTCLOUD_SECRET_KEY）")

    all_images = sorted(IMAGES_DIR.glob("*.jpg"))
    print(f"\n  源图片目录: {IMAGES_DIR}")
    print(f"  总图片数: {len(all_images)} 张")
    print(f"  核心神兽: {len(CORE_CREATURE_IDS)} 只 (SSR级)")
    print(f"  免费额度上限: {MAX_QUOTA} 只")

    core_ok = True
    print(f"\n  核心神兽检查:")
    for cid in CORE_CREATURE_IDS:
        p = IMAGES_DIR / f"{cid}.jpg"
        exists = p.exists()
        size = f"{p.stat().st_size / 1024:.0f}KB" if exists else "—"
        mark = "✓" if exists else "✗"
        if not exists:
            core_ok = False
        print(f"    {mark} {cid:14s} ({size})")

    print(f"\n  输出目录: {MODELS_DIR}")
    if MODELS_DIR.exists():
        existing = list(MODELS_DIR.glob("*.glb"))
        print(f"    已有 {len(existing)} 个 GLB")
    else:
        print("    目录尚未创建（运行时自动创建）")

    print(f"\n  requests: ✓ 已安装")
    print(f"  API: {HOST}  区域: {REGION}  版本: {VERSION}")
    print(f"  生成模式: {GENERATE_TYPE} + PBR={ENABLE_PBR} + Model={MODEL_VERSION}")
    print(f"  并发数: {MAX_CONCURRENCY}  签名: TC3-HMAC-SHA256 (无 SDK 依赖)")

    if core_ok and sid and skey:
        print(f"\n  ✅ 环境就绪")
        print(f"     生成7只核心神兽: python pipelines/model3d/generate_models.py --core")
        print(f"     生成全部(≤{MAX_QUOTA}只):  python pipelines/model3d/generate_models.py --all")
    else:
        print("\n  ⚠️  请修复以上问题后再运行")
    return core_ok and bool(sid and skey)


def main():
    parser = argparse.ArgumentParser(description="混元3D 批量生成神兽 3D 模型")
    parser.add_argument("--check", action="store_true", help="仅检查环境")
    parser.add_argument("--core", action="store_true", help="只生成7只核心神兽")
    parser.add_argument("--all", action="store_true", help=f"生成全部神兽(上限{MAX_QUOTA}只)")
    parser.add_argument("--only", type=str, default="", help="只生成指定神兽（逗号分隔 ID）")
    parser.add_argument("--rapid", action="store_true", help="使用极速版(省积分:15/只 vs 30/只,无LowPoly)")
    args = parser.parse_args()

    if args.check:
        sys.exit(0 if run_check() else 1)

    # 切换极速版
    if args.rapid:
        global USE_RAPID
        USE_RAPID = True
        log.info("已切换为极速版模式 (15积分/只)")

    # 筛选目标
    if args.only:
        only_ids = [s.strip() for s in args.only.split(",") if s.strip()]
        all_creatures = build_creature_list(limit=999)
        targets = [c for c in all_creatures if c["id"] in only_ids]
        if not targets:
            print(f"[ERROR] --only 无匹配，可选 ID 见 images/ 目录")
            sys.exit(1)
    elif args.core:
        targets = build_creature_list(limit=7)
    elif args.all:
        targets = build_creature_list(limit=MAX_QUOTA)
    else:
        # 默认生成7只核心
        targets = build_creature_list(limit=7)

    print("╔══════════════════════════════════════════════════════════╗")
    print("║     混元3D 批量生成神兽 3D 模型 (图生3D · LowPoly)      ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print(f"  目标神兽: {len(targets)} 只")
    for i, c in enumerate(targets, 1):
        print(f"    {i}. {c['id']:14s} {c['name']}  — {c['desc']}")
    print(f"  生成模式: {GENERATE_TYPE} + PBR + GLB")
    print(f"  并发数:   {MAX_CONCURRENCY}")
    print(f"  输出目录: {MODELS_DIR}")
    print()

    secret_id, secret_key = get_credentials()
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    results = []
    start_time = time.time()

    with ThreadPoolExecutor(max_workers=MAX_CONCURRENCY) as executor:
        future_map = {
            executor.submit(process_creature, secret_id, secret_key, c): c
            for c in targets
        }
        for future in as_completed(future_map):
            creature = future_map[future]
            try:
                results.append(future.result())
            except Exception as e:
                log.error(f"[{creature['name']}] 未捕获异常: {e}")
                results.append({"id": creature["id"], "name": creature["name"],
                                "success": False, "error": str(e),
                                "output": None, "size_mb": 0})

    elapsed = time.time() - start_time

    # ── 汇总报告 ──────────────────────────────────────────────
    print()
    print("╔══════════════════════════════════════════════════════════╗")
    print("║                    生成结果汇总                          ║")
    print("╠══════════════════════════════════════════════════════════╣")

    success_count = 0
    total_size = 0
    core_success = 0
    for r in sorted(results, key=lambda x: (not x.get("core", False), x["id"])):
        if r["success"]:
            success_count += 1
            total_size += r["size_mb"]
            if r.get("core"):
                core_success += 1
            skip_tag = " (跳过)" if r.get("skipped") else ""
            core_tag = " ★" if r.get("core") else ""
            print(f"  ✓ {r['id']:18s} {r['name']:6s} {r['size_mb']:5.2f}MB{core_tag}{skip_tag}")
        else:
            core_tag = " ★" if r.get("core") else ""
            print(f"  ✗ {r['id']:18s} {r['name']:6s} 失败{core_tag}: {r['error']}")

    print("╠══════════════════════════════════════════════════════════╣")
    print(f"  成功: {success_count}/{len(results)}  "
          f"核心: {core_success}/7  "
          f"总大小: {total_size:.1f}MB  "
          f"平均: {total_size/max(success_count,1):.2f}MB  "
          f"耗时: {elapsed:.0f}s")
    print("╚══════════════════════════════════════════════════════════╝")

    # 保存 JSON 报告
    report_path = MODELS_DIR / "generation_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump({"results": results, "elapsed_sec": round(elapsed, 1),
                   "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")},
                  f, ensure_ascii=False, indent=2)
    print(f"\n  报告已保存: {report_path}")

    if success_count < len(results):
        print(f"\n  ⚠️  {len(results) - success_count} 只失败，重新运行自动续传：")
        print(f"     python pipelines/model3d/generate_models.py")
        sys.exit(1)
    else:
        print(f"\n  ✅ 全部完成！GLB 已保存到 {MODELS_DIR}")
        print(f"     下一步：实现 D-2 的 Creature3DPreview.tsx 组件")


if __name__ == "__main__":
    main()
