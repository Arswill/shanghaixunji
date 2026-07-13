"""Depth Map -> Normal Map (Sobel) for 2.5D parallax edge glow."""
import sys, os, glob
import cv2, numpy as np

def depth_to_normal(depth_path, out_path, strength=2.0):
    depth = cv2.imread(depth_path, cv2.IMREAD_UNCHANGED)
    if depth is None: raise FileNotFoundError(depth_path)
    d = depth.astype(np.float32) / (65535.0 if depth.dtype==np.uint16 else 255.0)
    gx = cv2.Sobel(d, cv2.CV_32F, 1, 0, ksize=5)
    gy = cv2.Sobel(d, cv2.CV_32F, 0, 1, ksize=5)
    nx, ny, nz = -gx*strength, -gy*strength, np.ones_like(d)
    norm = np.sqrt(nx**2+ny**2+nz**2)
    nx, ny, nz = nx/norm, ny/norm, nz/norm
    normal = ((np.stack([nx,ny,nz],-1)+1)*127.5).astype(np.uint8)
    cv2.imwrite(out_path, normal); return out_path

def batch(input_dir, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    files = sorted(glob.glob(os.path.join(input_dir, "*_depth.png")))
    for i,f in enumerate(files,1):
        b=os.path.basename(f).replace("_depth.png","")
        depth_to_normal(f, os.path.join(output_dir, b+"_normal.png"))
    print(f"Done: {len(files)} normal maps in {output_dir}")

if __name__=="__main__":
    d=sys.argv[1] if len(sys.argv)>1 else "/mnt/d/VibeCoding/shanghaixunji/apps/web/public/assets/depth"
    n=sys.argv[2] if len(sys.argv)>2 else "/mnt/d/VibeCoding/shanghaixunji/apps/web/public/assets/normal"
    batch(d,n)