import sys
import tempfile
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0, str(Path(__file__).parent.parent))
from generate_creature_art import CreatureImageRequest, batch_generate

def test_batch_generate_processes_all_creatures():
    creatures = [
        {"id": "bi-fang", "name": "毕方", "art_description": "one-legged crane bird"},
        {"id": "jiu-wei-hu", "name": "九尾狐", "art_description": "nine-tailed fox"},
    ]
    with tempfile.TemporaryDirectory() as tmpdir:
        out_dir = Path(tmpdir)
        with patch('generate_creature_art.generate_one') as mock_gen:
            mock_gen.side_effect = lambda req, d: d / f"{req.creature_id}.webp"
            results = batch_generate(creatures, out_dir)
        assert len(results) == 2

def test_batch_generate_skips_existing_files():
    creatures = [
        {"id": "bi-fang", "name": "毕方", "art_description": "one-legged crane"},
    ]
    with tempfile.TemporaryDirectory() as tmpdir:
        out_dir = Path(tmpdir)
        existing = out_dir / "bi-fang.webp"
        existing.write_bytes(b"existing")
        
        with patch('generate_creature_art.generate_one') as mock_gen:
            results = batch_generate(creatures, out_dir, skip_existing=True)
        mock_gen.assert_not_called()
        assert len(results) == 1

def test_batch_generate_logs_failures():
    creatures = [
        {"id": "good", "name": "好", "art_description": "good creature desc"},
        {"id": "bad", "name": "坏", "art_description": "bad creature desc"},
    ]
    with tempfile.TemporaryDirectory() as tmpdir:
        out_dir = Path(tmpdir)
        failures_log = out_dir / "failures.csv"
        
        def mock_gen(req, d):
            if req.creature_id == "bad":
                raise Exception("API error")
            return d / f"{req.creature_id}.webp"
        
        with patch('generate_creature_art.generate_one', side_effect=mock_gen):
            results = batch_generate(creatures, out_dir, failures_log=failures_log)
        
        assert len(results) == 1
        assert failures_log.exists()
        assert "bad" in failures_log.read_text()
