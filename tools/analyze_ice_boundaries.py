import os
from PIL import Image
import numpy as np

out_dir = 'apps/web/public/assets/biomes/snow/preview_ice'

def is_snow(rgb):
    return rgb[0] > 220 and rgb[1] > 230 and rgb[2] > 230

for r in range(3):
    for c in range(4):
        fn = f"ice_r{r}_c{c}.png"
        p = os.path.join(out_dir, fn)
        if not os.path.exists(p):
            continue
        arr = np.array(Image.open(p))
        # Top 4 rows
        top_snow = np.mean([is_snow(arr[y, x][:3]) for y in range(4) for x in range(32)])
        # Bot 4 rows
        bot_snow = np.mean([is_snow(arr[y, x][:3]) for y in range(28, 32) for x in range(32)])
        # Left 4 cols
        left_snow = np.mean([is_snow(arr[y, x][:3]) for y in range(32) for x in range(4)])
        # Right 4 cols
        right_snow = np.mean([is_snow(arr[y, x][:3]) for y in range(32) for x in range(28, 32)])
        # Center
        center_snow = np.mean([is_snow(arr[y, x][:3]) for y in range(12, 20) for x in range(12, 20)])
        
        # Corners:
        tl_snow = np.mean([is_snow(arr[y, x][:3]) for y in range(8) for x in range(8)])
        tr_snow = np.mean([is_snow(arr[y, x][:3]) for y in range(8) for x in range(24, 32)])
        bl_snow = np.mean([is_snow(arr[y, x][:3]) for y in range(24, 32) for x in range(8)])
        br_snow = np.mean([is_snow(arr[y, x][:3]) for y in range(24, 32) for x in range(24, 32)])

        print(f"r{r}c{c}: T_snow={top_snow:.2f}, B_snow={bot_snow:.2f}, L_snow={left_snow:.2f}, R_snow={right_snow:.2f}, Center_snow={center_snow:.2f} | TL={tl_snow:.2f}, TR={tr_snow:.2f}, BL={bl_snow:.2f}, BR={br_snow:.2f}")
