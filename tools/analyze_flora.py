import os
from PIL import Image
import numpy as np

src_dir = 'tools/sources/snow'

def check_flora(name, num_cols):
    p = os.path.join(src_dir, name)
    im = Image.open(p).convert("RGBA")
    arr = np.array(im)
    print(f"=== {name} Flora (32x64) ===")
    for c in range(num_cols):
        col = arr[:, c*32:(c+1)*32]
        op = np.sum(col[:, :, 3] > 0)
        # Check if bottom has ground snow baked in:
        bottom_row = col[60:64, :]
        bottom_snow = np.sum((bottom_row[:, :, 0] == 237) & (bottom_row[:, :, 1] == 248) & (bottom_row[:, :, 2] == 249))
        print(f"  Col {c}: non-zero alpha={op} px, bottom snow={bottom_snow} px")

check_flora("biến thể thực vật vùng băng tuyết.png", 8)
check_flora("biến thể thực vật vùng băng tuyết 2.png", 4)
