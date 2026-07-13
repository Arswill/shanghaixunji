# Depth Map Pipeline

## Files
- generate_depth.py - Depth Anything V2 (torch+transformers, GPU)
- generate_depth_placeholder.py - placeholder (cv2, no torch)
- depth_to_normal.py - Depth to Normal Map (Sobel)
- check_quality.py - quality check
- comfyui_workflow.json - ComfyUI cloud workflow
- requirements.txt - deps

## Usage
python3 generate_depth_placeholder.py img_dir out_dir
python3 generate_depth.py img_dir out_dir
python3 depth_to_normal.py depth_dir normal_dir
python3 check_quality.py depth_dir

## Model
Depth Anything V2 Large: depth-anything/Depth-Anything-V2-Large-hf
Mirror: export HF_ENDPOINT=https://hf-mirror.com