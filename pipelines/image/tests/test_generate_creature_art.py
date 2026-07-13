import sys
from pathlib import Path
# Add parent to path so we can import modules
sys.path.insert(0, str(Path(__file__).parent.parent))
from generate_creature_art import build_prompt, CreatureImageRequest

def test_build_prompt_includes_creature_description_and_dark_fantasy_style():
    req = CreatureImageRequest(creature_id="bi-fang", name="毕方",
                               description="one-legged crane-like bird, blue body with white markings, red beak")
    p = build_prompt(req)
    assert "毕方" not in p  # English prompt for FLUX
    assert "one-legged crane-like bird" in p
    assert "dark fantasy" in p.lower()
    assert "muted earth tones" in p.lower()

def test_negative_prompt_excludes_ink_wash_and_cute():
    from prompts.style_negative import NEGATIVE_PROMPT
    assert "ink-wash" in NEGATIVE_PROMPT.lower()
    assert "chibi" in NEGATIVE_PROMPT.lower()
