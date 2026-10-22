import os
import sys
from PIL import Image
import numpy as np

src_dir = 'tools/sources/snow'
for fn in sorted(os.listdir(src_dir)):
    p = os.path.join(src_dir, fn)
    if os.path.isfile(p):
        try:
            im = Image.open(p)
            print(f"{fn} -> size: {im.size}, mode: {im.mode}")
        except Exception as e:
            pass
