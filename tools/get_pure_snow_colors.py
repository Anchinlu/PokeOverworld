import os
from PIL import Image
import numpy as np

p = 'tools/sources/snow/đồi cao vùng băng tuyết.png'
im = Image.open(p).convert("RGBA")
arr = np.array(im)
pure_tile = arr[32:64, 32:64]

unique_colors, counts = np.unique(pure_tile[:, :, :3].reshape(-1, 3), axis=0, return_counts=True)
print("Pure snow ground colors (from center of đồi cao):")
for c, cnt in zip(unique_colors, counts):
    print(f"  RGB {c}: {cnt} px ({cnt/1024*100:.1f}%)")
