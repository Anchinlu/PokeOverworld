import os
from PIL import Image
import numpy as np

p = 'tools/sources/snow/biến thể đất cỏ vùng băng tuyết bị đóng băng.png'
im = Image.open(p).convert("RGBA")
arr = np.array(im)

for r in range(3):
    for c in range(4):
        cell = arr[r*32:(r+1)*32, c*32:(c+1)*32]
        op = np.sum(cell[:, :, 3] > 0)
        if op == 0:
            print(f"Cell r{r} c{c}: EMPTY")
            continue
        # Check border colors
        top_color = cell[0, 16][:3]
        bot_color = cell[31, 16][:3]
        left_color = cell[16, 0][:3]
        right_color = cell[16, 31][:3]
        center_color = cell[16, 16][:3]
        print(f"Cell r{r} c{c}: Center={center_color}, T={top_color}, B={bot_color}, L={left_color}, R={right_color}")
