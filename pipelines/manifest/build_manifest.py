import json
from pathlib import Path
from pydantic import BaseModel

IMAGE_EXTENSIONS = ['.webp', '.jpg', '.jpeg', '.png']
AUDIO_EXTENSIONS = ['.webm', '.mp3', '.wav', '.ogg']

class CreatureAsset(BaseModel):
    creature_id: str
    province: str
    has_audio: bool = False
    has_image: bool = False
    image_ext: str = ""
    audio_ext: str = ""

def build_manifest(items: list[CreatureAsset], base_url: str = "/assets") -> dict:
    """Build a manifest mapping creature_id to audio/image URLs."""
    manifest = {}
    for item in items:
        entry = {
            "audio": f"{base_url}/audio/{item.creature_id}__{item.province}{item.audio_ext}" if item.has_audio else None,
            "image": f"{base_url}/images/{item.creature_id}{item.image_ext}" if item.has_image else None,
        }
        manifest[item.creature_id] = entry
    return manifest

def _find_file(directory: Path, stem: str, extensions: list[str]) -> str | None:
    """Find a file matching the stem with any of the given extensions."""
    for ext in extensions:
        path = directory / f"{stem}{ext}"
        if path.exists():
            return ext
    return None

def scan_assets(creatures_json_path: Path, audio_dir: Path, image_dir: Path) -> list[CreatureAsset]:
    """Scan directories and build CreatureAsset list from creatures data."""
    creatures = json.loads(creatures_json_path.read_text(encoding="utf-8"))
    items = []
    for c in creatures:
        creature_id = c["id"]
        province = c["province"]
        image_ext = _find_file(image_dir, creature_id, IMAGE_EXTENSIONS)
        audio_ext = _find_file(audio_dir, f"{creature_id}__{province}", AUDIO_EXTENSIONS)
        items.append(CreatureAsset(
            creature_id=creature_id,
            province=province,
            has_audio=audio_ext is not None,
            has_image=image_ext is not None,
            image_ext=image_ext or "",
            audio_ext=audio_ext or "",
        ))
    return items

def write_manifest(creatures_json_path: Path, audio_dir: Path, image_dir: Path, output_path: Path, base_url: str = "/assets"):
    """Build and write the manifest JSON file."""
    items = scan_assets(creatures_json_path, audio_dir, image_dir)
    manifest = build_manifest(items, base_url)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    return manifest

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 5:
        print("Usage: python build_manifest.py <creatures.json> <audio_dir> <image_dir> <output.json>")
        sys.exit(1)
    creatures_path = Path(sys.argv[1])
    audio_dir = Path(sys.argv[2])
    image_dir = Path(sys.argv[3])
    output_path = Path(sys.argv[4])
    manifest = write_manifest(creatures_path, audio_dir, image_dir, output_path)
    print(f"Manifest written to {output_path} with {len(manifest)} entries")
