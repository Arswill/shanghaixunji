import sys
import json
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock
sys.path.insert(0, str(Path(__file__).parent.parent))
from generate_tts import CreatureTTSRequest, batch_synthesize

def test_batch_synthesize_processes_all_creatures():
    creatures = [
        {"id": "bi-fang", "province": "陕西", "original_text": "有鸟焉"},
        {"id": "jiu-wei-hu", "province": "湖南", "original_text": "有兽焉"},
    ]
    with tempfile.TemporaryDirectory() as tmpdir:
        out_dir = Path(tmpdir)
        # Mock the synthesize_one function
        with patch('generate_tts.synthesize_one') as mock_synth:
            mock_synth.side_effect = lambda req, d: d / f"{req.creature_id}__{req.province}.webm"
            results = batch_synthesize(creatures, out_dir)
        assert len(results) == 2

def test_batch_synthesize_skips_existing_files():
    creatures = [
        {"id": "bi-fang", "province": "陕西", "original_text": "有鸟焉"},
    ]
    with tempfile.TemporaryDirectory() as tmpdir:
        out_dir = Path(tmpdir)
        # Create the file first
        existing = out_dir / "bi-fang__陕西.webm"
        existing.write_bytes(b"existing")
        
        with patch('generate_tts.synthesize_one') as mock_synth:
            results = batch_synthesize(creatures, out_dir, skip_existing=True)
        # Should not call synth
        mock_synth.assert_not_called()
        assert len(results) == 1

def test_batch_synthesize_logs_failures():
    creatures = [
        {"id": "good", "province": "陕西", "original_text": "text"},
        {"id": "bad", "province": "未知", "original_text": "text"},
    ]
    with tempfile.TemporaryDirectory() as tmpdir:
        out_dir = Path(tmpdir)
        failures_log = out_dir / "failures.csv"
        
        def mock_synth(req, d):
            if req.creature_id == "bad":
                raise Exception("API error")
            return d / f"{req.creature_id}__{req.province}.webm"
        
        with patch('generate_tts.synthesize_one', side_effect=mock_synth):
            results = batch_synthesize(creatures, out_dir, failures_log=failures_log)
        
        assert len(results) == 1  # Only "good" succeeded
        assert failures_log.exists()
        log_content = failures_log.read_text()
        assert "bad" in log_content
