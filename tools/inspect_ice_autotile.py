import os
from PIL import Image
import numpy as np

p = 'tools/sources/snow/biến thể đất cỏ vùng băng tuyết bị đóng băng.png'
im = Image.open(p).convert("RGBA")
arr = np.array(im)

# Let's inspect the layout of the 11 tiles:
# Cols: 0..3, Rows: 0..2
# Is cols 0..2 rows 0..2 a 3x3 autotile?
# Let's print the 4 corners and 4 edges for each of the 3x3 cells (r0..2, c0..2) and col 3

def describe_cell(r, c):
    cell = arr[r*32:(r+1)*32, c*32:(c+1)*32]
    if np.sum(cell[:, :, 3] > 0) == 0:
        return "EMPTY"
    # Corners: tl, tr, bl, br
    tl = tuple(cell[0, 0][:3])
    tr = tuple(cell[0, 31][:3])
    bl = tuple(cell[31, 0][:3])
    br = tuple(cell[31, 31][:3])
    # Mid-edges:
    top = tuple(cell[0, 15][:3])
    bot = tuple(cell[31, 15][:3])
    left = tuple(cell[15, 0][:3])
    right = tuple(cell[15, 31][:3])
    center = tuple(cell[15, 15][:3])
    return f"c={center}\n    T={top} B={bot} L={left} R={right}\n    TL={tl} TR={tr} BL={bl} BR={br}"

for r in range(3):
    for c in range(4):
        print(f"--- Cell ({r},{c}) ---")
        print("   ", describe_cell(r, c))
