"""
Extracts and generates the Autumn Forest boundary grass fringe autotiles (12 pieces)
and tall grass animation strips (160x32) from user uploaded assets.
"""
import os
import shutil
from PIL import Image
import numpy as np

WORKSPACE = r"e:\Pokemon"
SRC_AUTUMN = os.path.join(WORKSPACE, "tools", "sources", "autumn")
OUT_AUTUMN = os.path.join(WORKSPACE, "apps", "web", "public", "assets", "biomes", "autumn")

os.makedirs(SRC_AUTUMN, exist_ok=True)
os.makedirs(OUT_AUTUMN, exist_ok=True)

USER_FRINGE = r"C:\Users\lctan\.gemini\antigravity-ide\brain\28934db1-dbb4-4737-a6e5-aab9f990170c\.user_uploaded\media_1792649550800.png"
USER_TALL_GRASS = r"C:\Users\lctan\.gemini\antigravity-ide\brain\28934db1-dbb4-4737-a6e5-aab9f990170c\.user_uploaded\media_1792649562306.png"

# 1. Archive originals into tools/sources/autumn
shutil.copy2(USER_FRINGE, os.path.join(SRC_AUTUMN, "ground_autumn_fringe_template.png"))
shutil.copy2(USER_TALL_GRASS, os.path.join(SRC_AUTUMN, "tall_grass_autumn_strip_source.png"))
print("Archived source assets to tools/sources/autumn")

# 2. Process Tall Grass
shutil.copy2(USER_TALL_GRASS, os.path.join(OUT_AUTUMN, "tall_grass_autumn.png"))
shutil.copy2(USER_TALL_GRASS, os.path.join(OUT_AUTUMN, "tall_grass_autumn_strip.png"))
print("Saved tall_grass_autumn.png and tall_grass_autumn_strip.png")

# 3. Process Boundary Fringe Autotiles
fringe_im = Image.open(USER_FRINGE).convert("RGBA")
fringe_arr = np.array(fringe_im)

pure_path = os.path.join(OUT_AUTUMN, "ground_autumn_pure.png")
pure_arr = np.array(Image.open(pure_path).convert("RGBA"))

BROWN = np.array([176, 118, 62, 255], dtype=np.uint8)

# In the 96x96 user hollow square template:
# (1, 0) top edge of inner cutout -> autumn is North, meadow is South -> 'bot'
edge_bot = fringe_arr[0:32, 32:64]

# (1, 2) bottom edge of inner cutout -> meadow is North, autumn is South -> 'top'
edge_top = fringe_arr[64:96, 32:64]

# (0, 1) left edge of inner cutout -> autumn is West, meadow is East -> 'right'
edge_right = fringe_arr[32:64, 0:32]

# (2, 1) right edge of inner cutout -> meadow is West, autumn is East -> 'left'
edge_left = fringe_arr[32:64, 64:96]

# Inner corners from user template:
# (0, 0) cutout is at South-East -> 'in_br'
in_br = fringe_arr[0:32, 0:32]

# (2, 0) cutout is at South-West -> 'in_bl'
in_bl = fringe_arr[0:32, 64:96]

# (0, 2) cutout is at North-East -> 'in_tr'
in_tr = fringe_arr[64:96, 0:32]

# (2, 2) cutout is at North-West -> 'in_tl'
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
            tl[y, x] = BROWN
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
            tr[y, x] = BROWN
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
            bl[y, x] = BROWN
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
            br[y, x] = BROWN
        else:
            br[y, x] = pure_arr[y, x]
br[:, 0] = edge_bot[:, 31]
br[0, :] = edge_right[31, :]

tiles = {
    "ground_autumn_top.png": edge_top,
    "ground_autumn_bot.png": edge_bot,
    "ground_autumn_left.png": edge_left,
    "ground_autumn_right.png": edge_right,
    "ground_autumn_tl.png": tl,
    "ground_autumn_tr.png": tr,
    "ground_autumn_bl.png": bl,
    "ground_autumn_br.png": br,
    "ground_autumn_in_tl.png": in_tl,
    "ground_autumn_in_tr.png": in_tr,
    "ground_autumn_in_bl.png": in_bl,
    "ground_autumn_in_br.png": in_br,
}

for name, tile in tiles.items():
    out_path = os.path.join(OUT_AUTUMN, name)
    Image.fromarray(tile).save(out_path)
    print(f"Saved {name} (size: {tile.shape[1]}x{tile.shape[0]})")

print("All 12 autotile pieces and 2 tall grass assets generated successfully!")
