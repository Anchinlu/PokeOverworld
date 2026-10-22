import os
from PIL import Image
import numpy as np

p = 'tools/sources/snow/khúc gỗ và thân gỗ bị chặc.png'
im = Image.open(p).convert("RGBA")
arr = np.array(im)

print("Khúc gỗ size:", im.size)
print("Border colors:")
print("  (0,0):", arr[0,0][:3])
print("  (0,16):", arr[0,16][:3])
print("  (0,32):", arr[0,32][:3])
print("  (31,0):", arr[31,0][:3])
print("  (31,16):", arr[31,16][:3])
