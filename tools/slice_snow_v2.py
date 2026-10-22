"""Slice Snow Biome assets cleanly, matching the quality of tools/slice_autumn.py.

Key requirements:
1. Pure snow ground ground_snow_pure.png taken from center (32, 32, 64, 64) of đồi cao vùng băng tuyết.png.
2. Boundary fringes ground_snow_* (12 pieces) preserve alpha transparency so meadow grass layer renders underneath!
3. Trees (cây vùng băng tuyết 1 & 2): 8 distinct 64x128 trees, baked snow ground flood-filled away so trunks sit directly on terrain.
4. Flora:
   - Sheet 1 (256x64): 4 cone trees (32x64), 1 wide bush (64x64), 2 ice crystals (32x64).
   - Sheet 2 (128x64): 1 round bush (64x64), 1 diamond shrub (64x64).
   - Bụi cây (64x64): 1 fluffy snow bush.
5. Frozen ice pond / lake autotiles (biến thể đất cỏ vùng băng tuyết bị đóng băng.png):
   - 12 autotile pieces for frozen ponds & lakes.
6. Decals & rocks:
   - Fallen log (64x32), stump (32x32).
   - Rocks: boulder (64x32), pointed rock (32x32), pebbles (32x32).
   - Tall grass: animated strip (160x32).
   - Ground decals & grass tufts.
7. Architecture & roads archived into subfolders without village generation.
"""
import os
import shutil
from collections import deque
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tools", "sources", "snow")
OUT = os.path.join(ROOT, "apps", "web", "public", "assets", "biomes", "snow")
OUT_ARCH = os.path.join(OUT, "architecture")
OUT_ROADS = os.path.join(OUT, "roads")

# Wipe earlier mis-sliced generated files but preserve architecture and roads
for item in os.listdir(OUT):
    p = os.path.join(OUT, item)
    if os.path.isfile(p):
        os.remove(p)
    elif os.path.isdir(p) and item not in ("architecture", "roads"):
        shutil.rmtree(p)

os.makedirs(OUT, exist_ok=True)
os.makedirs(OUT_ARCH, exist_ok=True)
os.makedirs(OUT_ROADS, exist_ok=True)

# Ground palette from the center of đồi cao
SNOW_GROUND = {
    (237, 248, 249),
    (211, 239, 250),
    (160, 213, 232),
    (167, 175, 176),
    (147, 168, 176),
    (122, 176, 206),
    (112, 149, 163),
}

BLUE_OUTLINE = np.array([122, 176, 206, 255], dtype=np.uint8)


def remove_snow_ground_bottom(im, start_y=0, allow_side=True):
    """Flood-fill remove snow ground from bottom and sides without touching tree crown."""
    arr = np.array(im.convert("RGBA"))
    h, w = arr.shape[:2]
    visited = np.zeros((h, w), dtype=bool)
    q = deque()

    seeds = [(h - 1, x) for x in range(w)]
    if allow_side:
        seeds += [(y, 0) for y in range(start_y, h)]
        seeds += [(y, w - 1) for y in range(start_y, h)]

    for y, x in seeds:
        c = tuple(arr[y, x][:3])
        if c in SNOW_GROUND or arr[y, x][3] == 0:
            visited[y, x] = True
            q.append((y, x))

    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                c = tuple(arr[ny, nx][:3])
                if c in SNOW_GROUND or arr[ny, nx][3] == 0:
                    visited[ny, nx] = True
                    q.append((ny, nx))

    out = arr.copy()
    for y in range(h):
        for x in range(w):
            if visited[y, x]:
                out[y, x] = (0, 0, 0, 0)

    return Image.fromarray(out, "RGBA")


def save(img, name):
    target = os.path.join(OUT, name + ".png")
    img.save(target)
    print(f"Saved: {name}.png ({img.width}x{img.height})")


# =========================================================================
# 1. PURE GROUND & HIGH HILL AUTOTILES
# =========================================================================
hill_im = Image.open(os.path.join(SRC, "đồi cao vùng băng tuyết.png")).convert("RGBA")
pure_ground = hill_im.crop((32, 32, 64, 64))
save(pure_ground, "ground_snow_pure")
pure_arr = np.array(pure_ground)

# High hill 3x3 tiles (cliff_snow_* matches TILE_IDS schema 530..542)
cliff_names = [
    ["cliff_snow_tl", "cliff_snow_top", "cliff_snow_tr"],
    ["cliff_snow_left", "cliff_snow_pure", "cliff_snow_right"],
    ["cliff_snow_bl", "cliff_snow_bot", "cliff_snow_br"],
]
for r in range(3):
    for c in range(3):
        tile_crop = hill_im.crop((c * 32, r * 32, (c + 1) * 32, (r + 1) * 32))
        save(tile_crop, cliff_names[r][c])
        # Also alias as hill_snow_*
        save(tile_crop, cliff_names[r][c].replace("cliff_", "hill_"))

# =========================================================================
# Bổ sung đường cong đồi cao vùng băng tuyết: 
# Dùng để bổ sung góc khuyết lõm trong cho autotile đồi cao (không phải vật trang trí)
# =========================================================================
supp_im = Image.open(os.path.join(SRC, "bổ sùng đường cong đồi cao vùng băng tuyết.png")).convert("RGBA")

# Slice 4 authentic inner corners for snow cliffs:
# (0, 0, 32, 32) -> cliff_snow_in_tl (rock at BR)
# (32, 0, 64, 32) -> cliff_snow_in_tr (rock at BL)
# (32, 64, 64, 96) -> cliff_snow_in_bl (rock at TL)
# (0, 64, 32, 96) -> cliff_snow_in_br (rock at TR)
save(supp_im.crop((0, 0, 32, 32)), "cliff_snow_in_tl")
save(supp_im.crop((0, 0, 32, 32)), "hill_snow_in_tl")
save(supp_im.crop((32, 0, 64, 32)), "cliff_snow_in_tr")
save(supp_im.crop((32, 0, 64, 32)), "hill_snow_in_tr")
save(supp_im.crop((32, 64, 64, 96)), "cliff_snow_in_bl")
save(supp_im.crop((32, 64, 64, 96)), "hill_snow_in_bl")
save(supp_im.crop((0, 64, 32, 96)), "cliff_snow_in_br")
save(supp_im.crop((0, 64, 32, 96)), "hill_snow_in_br")


# =========================================================================
# 2. BOUNDARY FRINGE AUTOTILES (Preserve Alpha Transparency!)
# =========================================================================
fringe_im = Image.open(os.path.join(SRC, "cỏ ranh giới vùng băng tuyết.png")).convert("RGBA")
fringe_arr = np.array(fringe_im)

edge_bot = fringe_arr[0:32, 32:64]
edge_top = fringe_arr[64:96, 32:64]
edge_right = fringe_arr[32:64, 0:32]
edge_left = fringe_arr[32:64, 64:96]

in_br = fringe_arr[0:32, 0:32]
in_bl = fringe_arr[0:32, 64:96]
in_tr = fringe_arr[64:96, 0:32]
in_tl = fringe_arr[64:96, 64:96]

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

fringe_tiles = {
    "ground_snow_top": edge_top,
    "ground_snow_bot": edge_bot,
    "ground_snow_left": edge_left,
    "ground_snow_right": edge_right,
    "ground_snow_tl": tl,
    "ground_snow_tr": tr,
    "ground_snow_bl": bl,
    "ground_snow_br": br,
    "ground_snow_in_tl": in_tl,
    "ground_snow_in_tr": in_tr,
    "ground_snow_in_bl": in_bl,
    "ground_snow_in_br": in_br,
}
for name, tile in fringe_tiles.items():
    save(Image.fromarray(tile), name)


# =========================================================================
# 3. FROZEN ICE POND / LAKE AUTOTILES (biến thể đất cỏ vùng băng tuyết bị đóng băng.png)
# =========================================================================
ice_im = Image.open(os.path.join(SRC, "biến thể đất cỏ vùng băng tuyết bị đóng băng.png")).convert("RGBA")
save(ice_im.crop((64, 32, 96, 64)), "ice_snow_pure")
save(ice_im.crop((32, 32, 64, 64)), "ice_snow_top")
save(ice_im.crop((32, 64, 64, 96)), "ice_snow_bot")
save(ice_im.crop((0, 32, 32, 64)), "ice_snow_tl")
save(ice_im.crop((96, 32, 128, 64)), "ice_snow_tr")
save(ice_im.crop((0, 64, 32, 96)), "ice_snow_bl")
save(ice_im.crop((96, 64, 128, 96)), "ice_snow_br")

save(ice_im.crop((0, 48, 32, 80)), "ice_snow_left")
save(ice_im.crop((96, 48, 128, 80)), "ice_snow_right")

pure_ice_arr = np.array(ice_im.crop((64, 32, 96, 64)))
for cname, (west, north) in [("tl", (True, True)), ("tr", (False, True)), ("bl", (True, False)), ("br", (False, False))]:
    in_arr = pure_ice_arr.copy()
    for y in range(32):
        for x in range(32):
            u = (31 - x) if west else x
            v = (31 - y) if north else y
            if u < 10 and v < 10 and (u + v) < 12:
                in_arr[y, x] = pure_arr[y, x]
    save(Image.fromarray(in_arr), f"ice_snow_in_{cname}")

save(ice_im.crop((0, 0, 64, 32)), "ice_snow_patch_medium")
save(ice_im.crop((64, 0, 96, 32)), "ice_snow_patch_small")


# =========================================================================
# 4. LARGE SNOW TREES (64x128) - 8 Variants
# =========================================================================
trees1 = Image.open(os.path.join(SRC, "cây vùng băng tuyết.png")).convert("RGBA")
for i in range(4):
    tree = trees1.crop((i * 64, 0, (i + 1) * 64, 128))
    cleaned = remove_snow_ground_bottom(tree, start_y=64)
    save(cleaned, f"tree_snow_pine_{i+1}")

trees2 = Image.open(os.path.join(SRC, "cây vùng băng tuyết 2.png")).convert("RGBA")
for i in range(4):
    tree = trees2.crop((i * 64, 0, (i + 1) * 64, 128))
    cleaned = remove_snow_ground_bottom(tree, start_y=64)
    save(cleaned, f"tree_snow_spruce_{i+1}")


# =========================================================================
# 5. FLORA & SHRUBS & CRYSTALS
# =========================================================================
flora1 = Image.open(os.path.join(SRC, "biến thể thực vật vùng băng tuyết.png")).convert("RGBA")
for i in range(4):
    cone = flora1.crop((i * 32, 0, (i + 1) * 32, 64))
    cleaned = remove_snow_ground_bottom(cone, start_y=40)
    save(cleaned, f"tree_snow_cone_{i+1}")

bush_wide = flora1.crop((128, 0, 192, 64))
save(remove_snow_ground_bottom(bush_wide, start_y=40), "bush_snow_wide")

crystal_fern = flora1.crop((192, 0, 224, 64))
save(remove_snow_ground_bottom(crystal_fern, start_y=40), "crystal_snow_fern")

crystal_spire = flora1.crop((224, 0, 256, 64))
save(remove_snow_ground_bottom(crystal_spire, start_y=40), "crystal_snow_spire")

flora2 = Image.open(os.path.join(SRC, "biến thể thực vật vùng băng tuyết 2.png")).convert("RGBA")
bush_round = flora2.crop((0, 0, 64, 64))
save(remove_snow_ground_bottom(bush_round, start_y=30), "bush_snow_round")

bush_diamond = flora2.crop((64, 0, 128, 64))
save(remove_snow_ground_bottom(bush_diamond, start_y=30), "bush_snow_diamond")

bush_fluffy = Image.open(os.path.join(SRC, "bụi cây vùng băng tuyết.png")).convert("RGBA")
save(remove_snow_ground_bottom(bush_fluffy, start_y=30), "bush_snow_fluffy")


# =========================================================================
# 6. TALL GRASS ANIMATION STRIP (160x32, 5 frames of 32x32)
# =========================================================================
tall_grass = Image.open(os.path.join(SRC, "cỏ cao vùng băng tuyết.png")).convert("RGBA")
save(tall_grass, "tall_grass_snow")
save(tall_grass, "tall_grass_snow_strip")


# =========================================================================
# 7. LOGS, STUMPS, ROCKS & GROUND DECALS
# =========================================================================
wood_im = Image.open(os.path.join(SRC, "khúc gỗ và thân gỗ bị chặc.png")).convert("RGBA")
log_fallen = wood_im.crop((0, 0, 64, 32))
save(remove_snow_ground_bottom(log_fallen, start_y=0), "log_snow_fallen")

stump = wood_im.crop((64, 0, 96, 32))
save(remove_snow_ground_bottom(stump, start_y=0), "stump_snow")

rocks_im = Image.open(os.path.join(SRC, "đá sỏi vùng băng tuyết.png")).convert("RGBA")
rock_boulder = rocks_im.crop((0, 0, 64, 32))
save(remove_snow_ground_bottom(rock_boulder, start_y=0), "rock_snow_boulder")

rock_pointed = rocks_im.crop((0, 32, 32, 64))
save(remove_snow_ground_bottom(rock_pointed, start_y=0), "rock_snow_pointed")

rock_pebbles = rocks_im.crop((32, 32, 64, 64))
save(remove_snow_ground_bottom(rock_pebbles, start_y=0), "rock_snow_pebbles")

grass_tufts = Image.open(os.path.join(SRC, "biến thể cỏ trang trí vùng băng tuyết.png")).convert("RGBA")
save(remove_snow_ground_bottom(grass_tufts.crop((0, 0, 32, 32)), start_y=0), "decor_snow_grass_1")
save(remove_snow_ground_bottom(grass_tufts.crop((32, 0, 64, 32)), start_y=0), "decor_snow_grass_2")

decals_im = Image.open(os.path.join(SRC, "biến thể trang trí đất vùng băng tuyết.png")).convert("RGBA")
save(remove_snow_ground_bottom(decals_im.crop((0, 0, 32, 32)), start_y=0), "decor_snow_sparkle")
save(remove_snow_ground_bottom(decals_im.crop((32, 0, 64, 32)), start_y=0), "decor_snow_drift")
save(remove_snow_ground_bottom(decals_im.crop((64, 0, 96, 32)), start_y=0), "decor_snow_crack")
save(remove_snow_ground_bottom(decals_im.crop((96, 0, 128, 32)), start_y=0), "decor_snow_flower")
save(remove_snow_ground_bottom(decals_im.crop((128, 0, 160, 32)), start_y=0), "decor_snow_mound")
save(remove_snow_ground_bottom(decals_im.crop((160, 0, 224, 32)), start_y=0), "decor_snow_frost_grass")

# =========================================================================
# 8. ARCHITECTURE & ROADS (Archived safely in subdirectories)
# Cầu vùng băng tuyết là công trình kiến trúc chưa triển khai
# =========================================================================
arch_files = [
    "cầu vùng băng tuyết.png",
    "kiến trúc nhà vùng băng tuyết.png",
    "kiến trúc nhà vùng băng tuyết 3.png",
    "nhà vùng băng tuyết 2.png",
    "nhà vùng băng tuyết 3.png",
    "nhà vùng băng tuyết 4.png",
    "nhà vùng băng tuyêt 5.png",
]
for f in arch_files:
    shutil.copy2(os.path.join(SRC, f), os.path.join(OUT_ARCH, f))

road_files = [
    "đường đi vùng băng tuyết.png",
    "bổ sung đường cong đường đi vùng băng tuyết.png",
]
for f in road_files:
    shutil.copy2(os.path.join(SRC, f), os.path.join(OUT_ROADS, f))

print("\n--- All Snow Biome assets sliced and saved cleanly! ---")
