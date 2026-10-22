import os
from PIL import Image
import numpy as np

p = 'tools/sources/snow/cây vùng băng tuyết.png'
im = Image.open(p).convert("RGBA")
arr = np.array(im)

for y in range(0, 128, 16):
    row = arr[y, 0:64]
    alphas = row[:, 3]
    print(f"Row y={y}: min_alpha={alphas.min()}, max_alpha={alphas.max()}, num_opaque={np.sum(alphas == 255)}, border_alpha=({alphas[0]}, {alphas[-1]})")
