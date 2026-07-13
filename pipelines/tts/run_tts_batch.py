#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
TTS 批量生成脚本 —— 就绪版
用法：
  1. 设置环境变量: $env:DASHSCOPE_API_KEY='你的Key'
  2. 运行: python run_tts_batch.py
  3. 默认输出到 apps/web/public/assets/audio/
  4. 支持断点续传（skip_existing=True）

分级生成策略:
  --tier 1  SSR级 (7只核心神兽, ~300秒)
  --tier 2  全量 (104只, ~520秒)
  --max N   限制生成数量（调试用）
"""
import os
import sys
import json
import time
from pathlib import Path
from datetime import datetime

# 强制设置正确的项目根目录
PROJECT_ROOT = Path(r'd:\VibeCoding\shanghaixunji')

# 添加 TTS 管线路径
sys.path.insert(0, str(PROJECT_ROOT / 'pipelines' / 'tts'))

from generate_tts import batch_synthesize, _get_api_key_or_exit

# 配置
INPUT_JSON = PROJECT_ROOT / 'pipelines' / 'tts' / 'tts_input.json'
AUDIO_DIR = PROJECT_ROOT / 'apps' / 'web' / 'public' / 'assets' / 'audio'
FAILURES_LOG = PROJECT_ROOT / 'pipelines' / 'tts' / 'failures_log.csv'

# SSR 级核心神兽（优先级最高）
SSR_CREATURES = [
    'jiu-wei-hu', 'ying-long', 'qi-lin', 'zhu-que',
    'bi-fang', 'kun-peng', 'tao-tie',
]

def main():
    print("=" * 60)
    print("  山海寻迹 · 方言 TTS 批量生成")
    print(f"  启动时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # 1. 验证 API Key
    print("\n[1/3] 验证 API Key...")
    try:
        _get_api_key_or_exit()
        print("  ✅ DASHSCOPE_API_KEY 已配置")
    except SystemExit:
        print("\n  ❌ 未配置 DASHSCOPE_API_KEY")
        print("  请设置环境变量后重试:")
        print('    PowerShell: $env:DASHSCOPE_API_KEY="sk-..."')
        print("  获取地址: https://dashscope.console.aliyun.com/")
        return 1

    # 2. 加载数据
    print("\n[2/3] 加载神兽数据...")
    creatures = json.loads(INPUT_JSON.read_text(encoding='utf-8'))
    print(f"  ✅ 加载了 {len(creatures)} 只神兽")

    # 按优先级排序: SSR 优先
    creatures.sort(key=lambda c: (
        0 if c['id'] in SSR_CREATURES else 1,
        c['id']
    ))

    ssr_count = sum(1 for c in creatures if c['id'] in SSR_CREATURES)
    print(f"  其中 SSR 级: {ssr_count} 只")

    # 统计已存在的音频
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    existing = set()
    for f in AUDIO_DIR.glob('*.webm'):
        # 格式: {creature_id}__{province}.webm
        existing.add(f.stem.split('__')[0])
    for f in AUDIO_DIR.glob('*.mp3'):
        existing.add(f.stem.split('_')[0])

    # 兼容 _demo 后缀
    for f in AUDIO_DIR.glob('*_demo.*'):
        existing.add(f.stem.replace('_demo', ''))

    needed = [c for c in creatures if c['id'] not in existing]
    print(f"  已有音频: {len(existing)} 只")
    print(f"  待生成: {len(needed)} 只")
    print(f"  预计耗时: ~{len(needed) * 5}s (~{len(needed) * 5 / 60:.0f} 分钟)")

    if not needed:
        print("\n  ✅ 所有音频已生成完毕！")
        return 0

    # 3. 批量生成
    print(f"\n[3/3] 开始生成 {len(needed)} 条方言音频...")
    start_time = time.time()

    results = batch_synthesize(
        creatures=needed,
        out_dir=AUDIO_DIR,
        skip_existing=True,
        failures_log=FAILURES_LOG,
    )

    elapsed = time.time() - start_time
    success = len(results)
    failed = len(needed) - success

    # 汇总
    print("\n" + "=" * 60)
    print(f"  生成完成!")
    print(f"  成功: {success} 条")
    print(f"  失败: {failed} 条")
    print(f"  耗时: {elapsed:.0f}s ({elapsed/60:.1f} 分钟)")
    if failed:
        print(f"  失败日志: {FAILURES_LOG}")
    print(f"  输出目录: {AUDIO_DIR}")
    print("=" * 60)

    return 0 if failed == 0 else 1

if __name__ == '__main__':
    sys.exit(main())
