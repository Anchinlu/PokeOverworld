import os
from PIL import Image
import numpy as np

p = 'tools/sources/snow/biến thể đất cỏ vùng băng tuyết bị đóng băng.png'
im = Image.open(p).convert("RGBA")
arr = np.array(im)

out_dir = 'apps/web/public/assets/biomes/snow/preview_ice'
os.makedirs(out_dir, exist_ok=True)

for r in range(3):
    for c in range(4):
        cell = arr[r*32:(r+1)*32, c*32:(c+1)*32]
        if np.sum(cell[:, :, 3] > 0) > 0:
            Image.fromarray(cell).save(os.path.join(out_dir, f"ice_r{r}_c{c}.png"))

print("Saved preview_ice cells.")
