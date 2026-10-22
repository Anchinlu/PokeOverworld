"""
Tools for Slicing and Extracting Snow Biome Assets.
Extracts:
1. Pure snow ground (from exact center of hill sheet).
2. Snow hill/cliff 15-tile autotile set.
3. Snow boundary fringe autotiles (12-tile set connecting snow and grass).
4. Snow tall grass (32x32) and animated strip (160x32, 5 frames).
5. Frozen ground / ice sheet autotiles (11 tiles).
6. 8 Snow pine/spruce trees (64x128).
7. Big snow bush (64x64).
8. 6 Snow flora / crystal / sapling entities (64x64).
9. 16 Ground layer decals (logs, stumps, rocks, grass tufts, snow ground details).
10. Architecture & Road assets archived into snow/architecture subfolder.
"""

import os
import shutil
import numpy as np
from PIL import Image

WORKSPACE = r"e:\Pokemon"
SRC_SNOW = os.path.join(WORKSPACE, "tools", "sources", "snow")
OUT_SNOW = os.path.join(WORKSPACE, "apps", "web", "public", "assets", "biomes", "snow")
OUT_ARCH = os.path.join(OUT_SNOW, "architecture")
OUT_ROADS = os.path.join(OUT_ARCH, "roads")

os.makedirs(SRC_SNOW, exist_ok=True)
os.makedirs(OUT_SNOW, exist_ok=True)
os.makedirs(OUT_ARCH, exist_ok=True)
os.makedirs(OUT_ROADS, exist_ok=True)

print("--- Step 1: Extract Pure Snow Ground (Center of Hill Sheet) ---")
hill_img = Image.open(os.path.join(SRC_SNOW, "đồi cao vùng băng tuyết.png")).convert("RGBA")
# Exact center is tile at row 1, col 1: (32, 32, 64, 64)
pure_snow_tile = hill_img.crop((32, 32, 64, 64))
pure_snow_path = os.path.join(OUT_SNOW, "ground_snow_pure.png")
pure_snow_tile.save(pure_snow_path)
print(f"Saved {pure_snow_path} (size={pure_snow_tile.size})")

print("--- Step 2: Extract Snow Hill/Cliff Autotiles ---")
hill_inner_img = Image.open(os.path.join(SRC_SNOW, "bổ sùng đường cong đồi cao vùng băng tuyết.png")).convert("RGBA")

# 9 tiles from 96x96 hill sheet
cliff_names_96 = [
    ["cliff_snow_tl", "cliff_snow_top", "cliff_snow_tr"],
    ["cliff_snow_left", "cliff_snow_pure", "cliff_snow_right"],
    ["cliff_snow_bl", "cliff_snow_bot", "cliff_snow_br"]
]
for r in range(3):
    for c in range(3):
        tile_name = cliff_names_96[r][c]
        tile = hill_img.crop((c * 32, r * 32, (c + 1) * 32, (r + 1) * 32))
        tile.save(os.path.join(OUT_SNOW, f"{tile_name}.png"))

# Inner corners and connectors from 64x96 inner curve sheet
inner_cliff_mapping = {
    "cliff_snow_in_tl": (0, 0),
    "cliff_snow_in_tr": (1, 0),
    "cliff_snow_mid_left": (0, 1),
    "cliff_snow_mid_right": (1, 1),
    "cliff_snow_in_br": (0, 2),
    "cliff_snow_in_bl": (1, 2),
}
for name, (c, r) in inner_cliff_mapping.items():
    tile = hill_inner_img.crop((c * 32, r * 32, (c + 1) * 32, (r + 1) * 32))
    tile.save(os.path.join(OUT_SNOW, f"{name}.png"))
print("Saved 15 snow hill/cliff autotiles successfully.")

print("--- Step 3: Extract & Compose Snow Boundary Autotiles (12 Pieces) ---")
# User hollow 96x96 fringe template
fringe_img = Image.open(os.path.join(SRC_SNOW, "cỏ ranh giới vùng băng tuyết.png")).convert("RGBA")
fringe_arr = np.array(fringe_img)
pure_arr = np.array(pure_snow_tile)

# Cutout extraction matching hollow square template:
# (1, 0) top edge -> 'bot'
edge_bot = fringe_arr[0:32, 32:64]
# (1, 2) bottom edge -> 'top'
edge_top = fringe_arr[64:96, 32:64]
# (0, 1) left edge -> 'right'
edge_right = fringe_arr[32:64, 0:32]
# (2, 1) right edge -> 'left'
edge_left = fringe_arr[32:64, 64:96]

# Inner corners from user template:
in_br = fringe_arr[0:32, 0:32]
in_bl = fringe_arr[0:32, 64:96]
in_tr = fringe_arr[64:96, 0:32]
in_tl = fringe_arr[64:96, 64:96]

def overlay_fringe_on_pure(fringe_slice, base_arr):
    out = base_arr.copy()
    mask = fringe_slice[:, :, 3] > 0
    out[mask] = fringe_slice[mask]
    return out

# 4 Cardinal edges
Image.fromarray(overlay_fringe_on_pure(edge_top, pure_arr)).save(os.path.join(OUT_SNOW, "ground_snow_top.png"))
Image.fromarray(overlay_fringe_on_pure(edge_bot, pure_arr)).save(os.path.join(OUT_SNOW, "ground_snow_bot.png"))
Image.fromarray(overlay_fringe_on_pure(edge_left, pure_arr)).save(os.path.join(OUT_SNOW, "ground_snow_left.png"))
Image.fromarray(overlay_fringe_on_pure(edge_right, pure_arr)).save(os.path.join(OUT_SNOW, "ground_snow_right.png"))

# 4 Inner corners
Image.fromarray(overlay_fringe_on_pure(in_tl, pure_arr)).save(os.path.join(OUT_SNOW, "ground_snow_in_tl.png"))
Image.fromarray(overlay_fringe_on_pure(in_tr, pure_arr)).save(os.path.join(OUT_SNOW, "ground_snow_in_tr.png"))
Image.fromarray(overlay_fringe_on_pure(in_bl, pure_arr)).save(os.path.join(OUT_SNOW, "ground_snow_in_bl.png"))
Image.fromarray(overlay_fringe_on_pure(in_br, pure_arr)).save(os.path.join(OUT_SNOW, "ground_snow_in_br.png"))

# 4 Outer corners by combining orthogonal edges
def combine_outer(edge_v, edge_h, base_arr):
    out = base_arr.copy()
    mask_v = edge_v[:, :, 3] > 0
    mask_h = edge_h[:, :, 3] > 0
    out[mask_v] = edge_v[mask_v]
    out[mask_h] = edge_h[mask_h]
    return out

Image.fromarray(combine_outer(edge_top, edge_left, pure_arr)).save(os.path.join(OUT_SNOW, "ground_snow_tl.png"))
Image.fromarray(combine_outer(edge_top, edge_right, pure_arr)).save(os.path.join(OUT_SNOW, "ground_snow_tr.png"))
Image.fromarray(combine_outer(edge_bot, edge_left, pure_arr)).save(os.path.join(OUT_SNOW, "ground_snow_bl.png"))
Image.fromarray(combine_outer(edge_bot, edge_right, pure_arr)).save(os.path.join(OUT_SNOW, "ground_snow_br.png"))
print("Saved 12 snow boundary fringe autotiles successfully.")

print("--- Step 4: Extract Tall Grass & 5-Frame Animated Strip ---")
tall_grass_src = os.path.join(SRC_SNOW, "cỏ cao vùng băng tuyết.png")
shutil.copy2(tall_grass_src, os.path.join(OUT_SNOW, "tall_grass_snow_strip.png"))
tg_img = Image.open(tall_grass_src).convert("RGBA")
tg_idle = tg_img.crop((0, 0, 32, 32))
tg_idle.save(os.path.join(OUT_SNOW, "tall_grass_snow.png"))
print("Saved tall_grass_snow.png (32x32) and tall_grass_snow_strip.png (160x32).")

print("--- Step 5: Extract Frozen Ground / Ice Sheet Tiles (11 Pieces) ---")
ice_sheet_img = Image.open(os.path.join(SRC_SNOW, "biến thể đất cỏ vùng băng tuyết bị đóng băng.png")).convert("RGBA")
ice_tiles = {
    "ice_snow_tl": (0, 0),
    "ice_snow_top": (1, 0),
    "ice_snow_tr": (2, 0),
    "ice_snow_left": (0, 1),
    "ice_snow_pure": (1, 1),
    "ice_snow_pure_var": (2, 1),
    "ice_snow_right": (3, 1),
    "ice_snow_bl": (0, 2),
    "ice_snow_bot_1": (1, 2),
    "ice_snow_bot_2": (2, 2),
    "ice_snow_br": (3, 2)
}
for name, (c, r) in ice_tiles.items():
    tile = ice_sheet_img.crop((c * 32, r * 32, (c + 1) * 32, (r + 1) * 32))
    tile.save(os.path.join(OUT_SNOW, f"{name}.png"))
print("Saved 11 frozen ground / ice sheet tiles successfully.")

print("--- Step 6: Extract 8 Big Snow Trees (64x128) ---")
trees_1 = Image.open(os.path.join(SRC_SNOW, "cây vùng băng tuyết.png")).convert("RGBA")
trees_2 = Image.open(os.path.join(SRC_SNOW, "cây vùng băng tuyết 2.png")).convert("RGBA")

tree_names_1 = [
    "tree_snow_pine_tall_green",
    "tree_snow_pine_medium_green",
    "tree_snow_pine_tall_teal",
    "tree_snow_pine_medium_teal"
]
for i, name in enumerate(tree_names_1):
    tree = trees_1.crop((i * 64, 0, (i + 1) * 64, 128))
    tree.save(os.path.join(OUT_SNOW, f"{name}.png"))

tree_names_2 = [
    "tree_snow_pine_tall_slate",
    "tree_snow_pine_medium_slate",
    "tree_snow_pine_tall_ice",
    "tree_snow_pine_tall_emerald"
]
for i, name in enumerate(tree_names_2):
    tree = trees_2.crop((i * 64, 0, (i + 1) * 64, 128))
    tree.save(os.path.join(OUT_SNOW, f"{name}.png"))
print("Saved 8 big snow trees (64x128) successfully.")

print("--- Step 7: Clean & Extract Big Snow Bush (64x64) ---")
bush_img = Image.open(os.path.join(SRC_SNOW, "bụi cây vùng băng tuyết.png")).convert("RGBA")
# Clean out outer edge baked snow ground
SNOW_COLORS = {(237, 248, 249), (211, 239, 250), (160, 213, 232)}
def clean_baked_snow_ground(im):
    w, h = im.size
    arr = np.array(im)
    # Flood-fill or strip snow ground pixels connected to left and right corners at y >= 32
    visited = np.zeros((h, w), dtype=bool)
    stack = []
    # Seed stack with corner pixels at bottom
    for x in range(w):
        for y in [0, h - 1]:
            if arr[y, x, 3] == 0 or tuple(arr[y, x, :3]) in SNOW_COLORS:
                stack.append((x, y))
                visited[y, x] = True
    for y in range(h):
        for x in [0, w - 1]:
            if not visited[y, x] and (arr[y, x, 3] == 0 or tuple(arr[y, x, :3]) in SNOW_COLORS):
                stack.append((x, y))
                visited[y, x] = True

    while stack:
        cx, cy = stack.pop()
        arr[cy, cx, 3] = 0  # make transparent
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < w and 0 <= ny < h and not visited[ny, nx]:
                if tuple(arr[ny, nx, :3]) in SNOW_COLORS or arr[ny, nx, 3] == 0:
                    visited[ny, nx] = True
                    stack.append((nx, ny))
    return Image.fromarray(arr)

clean_bush = clean_baked_snow_ground(bush_img)
clean_bush.save(os.path.join(OUT_SNOW, "bush_snow_big.png"))
print("Saved clean bush_snow_big.png (64x64).")

print("--- Step 8: Clean & Extract 6 Snow Flora Entities (64x64) ---")
flora_1 = Image.open(os.path.join(SRC_SNOW, "biến thể thực vật vùng băng tuyết.png")).convert("RGBA")
flora_names_1 = [
    "flora_snow_crystal_1",
    "flora_snow_crystal_2",
    "flora_snow_shrub_1",
    "flora_snow_shrub_2"
]
for i, name in enumerate(flora_names_1):
    sub = flora_1.crop((i * 64, 0, (i + 1) * 64, 64))
    cleaned = clean_baked_snow_ground(sub)
    cleaned.save(os.path.join(OUT_SNOW, f"{name}.png"))

flora_2 = Image.open(os.path.join(SRC_SNOW, "biến thể thực vật vùng băng tuyết 2.png")).convert("RGBA")
flora_names_2 = [
    "flora_snow_sapling",
    "flora_snow_boulder"
]
for i, name in enumerate(flora_names_2):
    sub = flora_2.crop((i * 64, 0, (i + 1) * 64, 64))
    cleaned = clean_baked_snow_ground(sub)
    cleaned.save(os.path.join(OUT_SNOW, f"{name}.png"))
print("Saved 6 snow flora entities (64x64) successfully.")

print("--- Step 9: Extract 16 Ground Decals (32x32) ---")
# Stumps and logs
stumps_img = Image.open(os.path.join(SRC_SNOW, "khúc gỗ và thân gỗ bị chặc.png")).convert("RGBA")
stump_names = ["decor_snow_stump_1", "decor_snow_stump_2", "decor_snow_log"]
for i, name in enumerate(stump_names):
    tile = stumps_img.crop((i * 32, 0, (i + 1) * 32, 32))
    tile.save(os.path.join(OUT_SNOW, f"{name}.png"))

# Rocks and boulders
rocks_img = Image.open(os.path.join(SRC_SNOW, "đá sỏi vùng băng tuyết.png")).convert("RGBA")
for r in range(2):
    for c in range(2):
        idx = r * 2 + c + 1
        tile = rocks_img.crop((c * 32, r * 32, (c + 1) * 32, (r + 1) * 32))
        tile.save(os.path.join(OUT_SNOW, f"decor_snow_rock_{idx}.png"))

# Grass tufts
tufts_img = Image.open(os.path.join(SRC_SNOW, "biến thể cỏ trang trí vùng băng tuyết.png")).convert("RGBA")
for c in range(2):
    idx = c + 1
    tile = tufts_img.crop((c * 32, 0, (c + 1) * 32, 32))
    tile.save(os.path.join(OUT_SNOW, f"decor_snow_tuft_{idx}.png"))

# Ground details
ground_decals_img = Image.open(os.path.join(SRC_SNOW, "biến thể trang trí đất vùng băng tuyết.png")).convert("RGBA")
for c in range(7):
    idx = c + 1
    tile = ground_decals_img.crop((c * 32, 0, (c + 1) * 32, 32))
    tile.save(os.path.join(OUT_SNOW, f"decor_snow_ground_{idx}.png"))
print("Saved 16 ground decals (32x32) successfully.")

print("--- Step 10: Archive Architecture & Roads into snow/architecture/ ---")
house_mapping = {
    "snow_house_1.png": "kiến trúc nhà vùng băng tuyết.png",
    "snow_house_2.png": "nhà vùng băng tuyết 2.png",
    "snow_house_3.png": "kiến trúc nhà vùng băng tuyết 3.png",
    "snow_house_4.png": "nhà vùng băng tuyết 3.png",
    "snow_house_5.png": "nhà vùng băng tuyết 4.png",
    "snow_grand_lodge.png": "nhà vùng băng tuyêt 5.png",
    "snow_bridge.png": "cầu vùng băng tuyết.png",
}
for dest, src in house_mapping.items():
    shutil.copy2(os.path.join(SRC_SNOW, src), os.path.join(OUT_ARCH, dest))
print("Archived 7 architecture buildings/bridges to snow/architecture/.")

# Road autotiles into snow/architecture/roads/
road_img = Image.open(os.path.join(SRC_SNOW, "đường đi vùng băng tuyết.png")).convert("RGBA")
road_names_96 = [
    ["path_snow_tl", "path_snow_top", "path_snow_tr"],
    ["path_snow_left", "path_snow_pure", "path_snow_right"],
    ["path_snow_bl", "path_snow_bot", "path_snow_br"]
]
for r in range(3):
    for c in range(3):
        name = road_names_96[r][c]
        tile = road_img.crop((c * 32, r * 32, (c + 1) * 32, (r + 1) * 32))
        tile.save(os.path.join(OUT_ROADS, f"{name}.png"))

road_inner_img = Image.open(os.path.join(SRC_SNOW, "bổ sung đường cong đường đi vùng băng tuyết.png")).convert("RGBA")
inner_road_mapping = {
    "path_snow_in_tl": (0, 0),
    "path_snow_in_tr": (1, 0),
    "path_snow_in_bl": (0, 1),
    "path_snow_in_br": (1, 1),
}
for name, (c, r) in inner_road_mapping.items():
    tile = road_inner_img.crop((c * 32, r * 32, (c + 1) * 32, (r + 1) * 32))
    tile.save(os.path.join(OUT_ROADS, f"{name}.png"))
print("Archived 13 road autotiles to snow/architecture/roads/.")

print("All snow biome assets extracted and cataloged cleanly!")
