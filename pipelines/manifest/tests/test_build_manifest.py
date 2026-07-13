import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
from build_manifest import CreatureAsset, build_manifest

def test_build_manifest_links_audio_and_image_paths():
    items = [CreatureAsset(creature_id="bi-fang", province="陕西", has_audio=True, has_image=True, image_ext=".jpg", audio_ext=".webm")]
    m = build_manifest(items, base_url="/assets")
    assert m["bi-fang"]["audio"] == "/assets/audio/bi-fang__陕西.webm"
    assert m["bi-fang"]["image"] == "/assets/images/bi-fang.jpg"

def test_build_manifest_handles_missing_assets():
    items = [CreatureAsset(creature_id="test", province="河南", has_audio=False, has_image=False)]
    m = build_manifest(items, base_url="/assets")
    assert m["test"]["audio"] is None
    assert m["test"]["image"] is None

def test_build_manifest_handles_multiple_creatures():
    items = [
        CreatureAsset(creature_id="bi-fang", province="陕西", has_audio=True, has_image=True, image_ext=".jpg", audio_ext=".webm"),
        CreatureAsset(creature_id="jiu-wei-hu", province="湖南", has_audio=True, has_image=False, audio_ext=".webm"),
    ]
    m = build_manifest(items, base_url="/assets")
    assert len(m) == 2
    assert m["bi-fang"]["image"] == "/assets/images/bi-fang.jpg"
    assert m["jiu-wei-hu"]["image"] is None
    assert m["jiu-wei-hu"]["audio"] == "/assets/audio/jiu-wei-hu__湖南.webm"
