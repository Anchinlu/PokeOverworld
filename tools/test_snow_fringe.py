import os
from PIL import Image
import numpy as np

src_dir = 'tools/sources/snow'
out_dir = 'apps/web/public/assets/biomes/snow/test_cutouts/fringe'
os.makedirs(out_dir, exist_ok=True)

# 1. Load pure snow tile
hill = Image.open(os.path.join(src_dir, 'đồi cao vùng băng tuyết.png')).convert("RGBA")
pure_tile = hill.crop((32, 32, 64, 64))
pure_arr = np.array(pure_tile)
pure_tile.save(os.path.join(out_dir, "ground_snow_pure.png"))

# 2. Load fringe template
fringe_im = Image.open(os.path.join(src_dir, 'cỏ ranh giới vùng băng tuyết.png')).convert("RGBA")
fringe_arr = np.array(fringe_im)

BLUE_OUTLINE = np.array([122, 176, 206, 255], dtype=np.uint8)

# Orthogonal edges:
edge_bot = fringe_arr[0:32, 32:64]
edge_top = fringe_arr[64:96, 32:64]
edge_right = fringe_arr[32:64, 0:32]
edge_left = fringe_arr[32:64, 64:96]

# Inner corners:
in_br = fringe_arr[0:32, 0:32]
in_bl = fringe_arr[0:32, 64:96]
in_tr = fringe_arr[64:96, 0:32]
in_tl = fringe_arr[64:96, 64:96]

# Outer corners constructed to seamlessly connect orthogonal edges:
# TL: meets edge_top at col 31, and edge_left at row 31
tl = np.zeros((32, 32, 4), dtype=np.uint8)
for y in range(32):
    for x in range(32):
        dx = 31 - x
        dy = 31 - y
        dist = np.sqrt(dx * dx + dy * dy)
        if dist > 9.5:
            tl[y, x] = [0, 0, 0, 0]
        elif dist > 7.5:
            tl[y, x] = BLUE_OUTLINE
        else:
            tl[y, x] = pure_arr[y, x]
tl[:, 31] = edge_top[:, 0]
tl[31, :] = edge_left[0, :]

# TR: meets edge_top at col 0, and edge_right at row 31
tr = np.zeros((32, 32, 4), dtype=np.uint8)
for y in range(32):
    for x in range(32):
        dx = x / 8.5
        dy = (31 - y) / 10.5
        dist = np.sqrt(dx * dx + dy * dy)
        if dist > 1.05:
            tr[y, x] = [0, 0, 0, 0]
        elif dist > 0.82:
            tr[y, x] = BLUE_OUTLINE
        else:
            tr[y, x] = pure_arr[y, x]
tr[:, 0] = edge_top[:, 31]
tr[31, :] = edge_right[0, :]

# BL: meets edge_bot at col 31, and edge_left at row 0
bl = np.zeros((32, 32, 4), dtype=np.uint8)
for y in range(32):
    for x in range(32):
        dx = (31 - x) / 9.5
        dy = y / 8.5
        dist = np.sqrt(dx * dx + dy * dy)
        if dist > 1.05:
            bl[y, x] = [0, 0, 0, 0]
        elif dist > 0.82:
            bl[y, x] = BLUE_OUTLINE
        else:
            bl[y, x] = pure_arr[y, x]
bl[:, 31] = edge_bot[:, 0]
bl[0, :] = edge_left[31, :]

# BR: meets edge_bot at col 0, and edge_right at row 0
br = np.zeros((32, 32, 4), dtype=np.uint8)
for y in range(32):
    for x in range(32):
        dx = x
        dy = y
        dist = np.sqrt(dx * dx + dy * dy)
        if dist > 9.5:
            br[y, x] = [0, 0, 0, 0]
        elif dist > 7.5:
            br[y, x] = BLUE_OUTLINE
        else:
            br[y, x] = pure_arr[y, x]
br[:, 0] = edge_bot[:, 31]
br[0, :] = edge_right[31, :]

tiles = {
    "ground_snow_top.png": edge_top,
    "ground_snow_bot.png": edge_bot,
    "ground_snow_left.png": edge_left,
    "ground_snow_right.png": edge_right,
    "ground_snow_tl.png": tl,
    "ground_snow_tr.png": tr,
    "ground_snow_bl.png": bl,
    "ground_snow_br.png": br,
    "ground_snow_in_tl.png": in_tl,
    "ground_snow_in_tr.png": in_tr,
    "ground_snow_in_bl.png": in_bl,
    "ground_snow_in_br.png": in_br,
}

for name, tile in tiles.items():
    Image.fromarray(tile).save(os.path.join(out_dir, name))

print("Saved all 12 fringe tiles with transparency!")
