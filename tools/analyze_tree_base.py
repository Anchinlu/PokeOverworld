import os
from PIL import Image
import numpy as np

p = 'tools/sources/snow/cây vùng băng tuyết.png'
im = Image.open(p).convert("RGBA")
arr = np.array(im)

# Trunk vs ground vs shadow at tree 0 (x=0..64, y=100..128)
crop = arr[100:128, 0:64]
unique_colors, counts = np.unique(crop.reshape(-1, 4), axis=0, return_counts=True)
print("Tree 0 bottom colors (y=100..128):")
for c, cnt in sorted(zip(unique_colors, counts), key=lambda x: -x[1]):
    print(f"  RGBA {c}: {cnt} px")
