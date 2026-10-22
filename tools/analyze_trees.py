import os
from PIL import Image
import numpy as np

src_dir = 'tools/sources/snow'

def check_trees(name):
    p = os.path.join(src_dir, name)
    im = Image.open(p).convert("RGBA")
    arr = np.array(im)
    print(f"=== {name} Trees (64x128 each) ===")
    for c in range(4):
        col = arr[:, c*64:(c+1)*64]
        # Check rows 0..64 (top) vs 64..128 (bottom trunk/ground)
        top = col[0:64, :]
        bot = col[64:128, :]
        snow_px = np.sum((col[:, :, 0] == 237) & (col[:, :, 1] == 248) & (col[:, :, 2] == 249))
        snow_bot = np.sum((bot[:, :, 0] == 237) & (bot[:, :, 1] == 248) & (bot[:, :, 2] == 249))
        print(f"  Tree {c}: total snow={snow_px} px, bottom snow={snow_bot} px, total opaque={np.sum(col[:,:,3]>0)}")

check_trees("cây vùng băng tuyết.png")
check_trees("cây vùng băng tuyết 2.png")
