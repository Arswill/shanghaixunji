import json
from pathlib import Path
from generate_tts import build_instruction, dialect_for_province, CreatureTTSRequest

def test_dialect_for_known_province_returns_instruction():
    assert "河南话" in dialect_for_province("河南")

def test_unknown_province_falls_back_to_mandarin():
    assert dialect_for_province("未知省") == "请用普通话表达"

def test_build_instruction_includes_dialect_and_text():
    req = CreatureTTSRequest(creature_id="bi-fang", province="陕西",
                             original_text="有鸟焉，其状如鹤")
    instr = build_instruction(req)
    assert "陕西话" in instr
    assert "有鸟焉" in instr
