import os
from PIL import Image
import numpy as np

p = 'tools/sources/snow/đá sỏi vùng băng tuyết.png'
im = Image.open(p).convert("RGBA")
arr = np.array(im)

print("Border colors of đá sỏi:")
for y in [0, 63]:
    for x in range(0, 64, 8):
        print(f"y={y}, x={x}: {arr[y, x][:3]}")
for x in [0, 63]:
    for y in range(0, 64, 8):
        print(f"y={y}, x={x}: {arr[y, x][:3]}")
