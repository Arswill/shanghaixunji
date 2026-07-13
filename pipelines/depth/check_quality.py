"""Depth Map quality check: contrast, size consistency."""
import sys, os, glob
import cv2, numpy as np

def check(depth_dir):
    files = sorted(glob.glob(os.path.join(depth_dir, "*_depth.png")))
    if not files: print("No depth maps found"); return
    issues=0; sizes=set()
    for f in files:
        d=cv2.imread(f, cv2.IMREAD_UNCHANGED)
        if d is None: print(f"[FAIL] {os.path.basename(f)}: unreadable"); issues+=1; continue
        sizes.add(d.shape)
        contrast=(d.max()-d.min())/65535.0; mean=d.mean()/65535.0
        flag=""
        if contrast<0.3: flag+=" LOW_CONTRAST"
        if mean<0.1 or mean>0.9: flag+=" EXTREME_MEAN"
        if flag: print(f"[WARN] {os.path.basename(f)}: c={contrast:.3f} m={mean:.3f}{flag}"); issues+=1
        else: print(f"[OK]   {os.path.basename(f)}: c={contrast:.3f} m={mean:.3f} {d.shape}")
    print(f"Sizes:{sizes} Total:{len(files)} Issues:{issues}")

if __name__=="__main__":
    check(sys.argv[1] if len(sys.argv)>1 else "/mnt/d/VibeCoding/shanghaixunji/apps/web/public/assets/depth")