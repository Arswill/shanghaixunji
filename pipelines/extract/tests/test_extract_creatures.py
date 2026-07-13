import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from extract_creatures import parse_creatures_from_section, CreatureCandidate, ExtractionResult

SAMPLE = "又东三百七十里，曰杻阳之山，其阳多赤金，其阴多白金。有兽焉，其状如马而白首，其文如虎而赤尾，其音如谣，其名曰鹿蜀，佩之宜子孙。怪水出焉，而东流注于宪翼之水。其中多玄龟，其状如龟而鸟首虺尾，其名曰旋龟，其音如判木，佩之不聋，可以为底。"

def test_parse_extracts_lu_shu():
    out = parse_creatures_from_section(SAMPLE, scroll="南山经")
    assert any(c["name"] == "鹿蜀" for c in out)

def test_parse_extracts_xuan_gui():
    out = parse_creatures_from_section(SAMPLE, scroll="南山经")
    assert any(c["name"] == "旋龟" for c in out)

def test_parsed_creature_has_scroll():
    out = parse_creatures_from_section(SAMPLE, scroll="南山经")
    assert all(c["scroll"] == "南山经" for c in out)

def test_parsed_creature_has_source_hint():
    out = parse_creatures_from_section(SAMPLE, scroll="南山经")
    assert all("source_hint" in c for c in out)

def test_parsed_creature_has_original_text():
    out = parse_creatures_from_section(SAMPLE, scroll="南山经")
    for c in out:
        assert len(c["original_text"]) > 0

def test_empty_section_returns_empty_list():
    out = parse_creatures_from_section("", scroll="南山经")
    assert out == []

def test_exclusion_patterns_filter_non_creatures():
    text = "其上有木焉，名曰文茎，其实如枣。有草焉，其状如葵。"
    out = parse_creatures_from_section(text, scroll="西山经")
    # Should not extract plants (木, 草) as creatures
    assert all(c["name"] not in ["文茎"] for c in out)
