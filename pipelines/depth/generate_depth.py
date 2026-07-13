"""Depth Anything V2 (torch+transformers). GPU inference, high quality. Run after torch installed."""
import sys, os, glob
import numpy as np, cv2

def generate_all(input_dir, output_dir, device=None, model_id="depth-anything/Depth-Anything-V2-Large-hf"):
    import torch
    from transformers import pipeline as hf_pipe
    from PIL import Image
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Loading {model_id} on {device}...")
    pipe = hf_pipe(task="depth-estimation", model=model_id, device=device)
    os.makedirs(output_dir, exist_ok=True)
    files = sorted(glob.glob(os.path.join(input_dir, "*.jpg")))
    for i, f in enumerate(files, 1):
        base = os.path.splitext(os.path.basename(f))[0]
        out = os.path.join(output_dir, base + "_depth.png")
        img = Image.open(f).convert("RGB")
        depth = np.array(pipe(img)["depth"]).astype(np.float32)
        depth = (depth - depth.min()) / (depth.max() - depth.min() + 1e-6)
        cv2.imwrite(out, (depth * 65535).astype(np.uint16))
        print(f"[{i}/{len(files)}] {base}")
    print(f"Done: {len(files)} depth maps on {device}")

if __name__ == "__main__":
    img_dir = sys.argv[1] if len(sys.argv)>1 else "/mnt/d/VibeCoding/shanghaixunji/apps/web/public/assets/images"
    out_dir = sys.argv[2] if len(sys.argv)>2 else "/mnt/d/VibeCoding/shanghaixunji/apps/web/public/assets/depth"
    generate_all(img_dir, out_dir)