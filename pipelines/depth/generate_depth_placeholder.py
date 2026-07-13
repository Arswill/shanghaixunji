"""启发式占位深度图生成（无需 GPU/torch），基于亮度+中心权重+高斯模糊。供 2.5D 视差 Shader 开发验证，待 torch 就绪后用 generate_depth.py 重新生成高质量版。"""
import sys, os, glob
import cv2
import numpy as np

def generate_depth(img_path, out_path, size=1024):
    img = cv2.imread(img_path)
    if img is None:
        raise FileNotFoundError(img_path)
    h, w = img.shape[:2]
    scale = size / max(h, w)
    img = cv2.resize(img, (int(w*scale), int(h*scale)))
    h, w = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    depth = (gray - gray.min()) / (gray.max() - gray.min() + 1e-6)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    dist = np.sqrt(((yy-h/2)/(h/2))**2 + ((xx-w/2)/(w/2))**2)
    center_weight = np.clip(1.0 - dist*0.5, 0.5, 1.0)
    depth = depth * 0.6 + center_weight * 0.4
    depth = cv2.GaussianBlur(depth, (0,0), sigmaX=max(w,h)*0.01)
    depth = (depth * 65535).astype(np.uint16)
    cv2.imwrite(out_path, depth)
    return out_path

def batch(input_dir, output_dir, names=None):
    os.makedirs(output_dir, exist_ok=True)
    files = [os.path.join(input_dir, n) for n in names] if names else sorted(glob.glob(os.path.join(input_dir, "*.jpg")))
    count = 0
    for f in files:
        base = os.path.splitext(os.path.basename(f))[0]
        out = os.path.join(output_dir, base + "_depth.png")
        generate_depth(f, out)
        count += 1
        print(f"[{count}] {base} -> {os.path.basename(out)}")
    print(f"Done: {count} depth maps in {output_dir}")

if __name__ == "__main__":
    img_dir = sys.argv[1] if len(sys.argv)>1 else "/mnt/d/VibeCoding/shanghaixunji/apps/web/public/assets/images"
    out_dir = sys.argv[2] if len(sys.argv)>2 else "/mnt/d/VibeCoding/shanghaixunji/apps/web/public/assets/depth"
    names = sys.argv[3:] if len(sys.argv)>3 else None
    batch(img_dir, out_dir, names)