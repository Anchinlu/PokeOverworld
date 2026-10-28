"""Slice Rocky Highland (Biome Đồi Đá) assets cleanly into apps/web/public/assets/biomes/rocky_highland.

Source folder: C:\\Users\\lctan\\Downloads\\Thanh phan the gioi\\đồi đá
Archived to:   tools/sources/rocky_highland

Assets generated:
1. Boundary ground fringe autotiles (ground_rock_* : 570..582):
   - Sliced from 'bổ sung dùng để liên kế ránh giới vs các biome khác.png' (96x96).
   - Outer edges preserve alpha=0 transparency so meadow grass renders underneath.
   - 4 inner corners (ground_rock_in_tl..br) synthesized to match the exact 8..10px border and [112, 107, 98] outline.
2. Standard 1-tier Rocky Cliff autotiles (cliff_rock_* : 585..597):
   - Sliced from 'đồi đá.png' (96x96) + 4 inner corners from 'bổ sung đường công đồi đá.png' (64x160).
   - Player CAN jump onto these 1-tier rocky hills using Space.
3. High Cliff 2-tier autotiles (high_cliff_rock_* : 620..638):
   - Sliced from 'vách đá cao.png' (96x128) + tall wall inner corners from 'bổ sung đường công đồi đá.png' (64x160).
   - Row 0: northern rim (tl, top, tr)
   - Row 1: plateau sides & interior (left, pure, right)
   - Row 2: upper half of 2-tile southern cliff face (bl_upper, bot_upper, br_upper)
   - Row 3: lower half / base of 2-tile southern cliff face (bl, bot, br)
   - Inner corners: in_tl, in_tr, in_bl_upper, in_br_upper, in_bl, in_br
   - Hosts normal wildlife & rock ecosystems on its plateau, but player CANNOT climb/jump onto it (requires future Flying Pokémon mount).
4. Animated Rocky River & Lake water strips (water_rock_* : 785..798):
   - Sliced from 'hồ nc và sông.png' (384x128 = 4 frames of 96x128).
   - Generates 128x32 4-frame strips for pure, top, bot, left, right, tl, tr, bl, br, in_tl, in_tr, in_bl, in_br, curve.
5. Rocks, Pebbles & Stagnant Water Puddles:
   - rock_highland_boulder (64x64 from 'đá trang trí 1.png')
   - rock_highland_1 (32x32 from 'đá đồi cao.png')
   - rock_highland_2 (32x32 from 'đá đồi cao 1.png')
   - rock_highland_small (32x32 from 'đá nhỏ.png')
   - decor_rock_pebbles (32x32 from 'sỏi đồi cao.png')
   - decor_rock_puddle_1..4 (32x32 cells from 'nc ứ động trang trí.png' 64x64)
   - rock_wet_wide (64x32 from 'đá gần nc ứ động.png')
   - rock_wet_tall (32x64 from 'đá gần nước ú động 1.png')
   - rock_wet_small (32x32 from 'đá gàn nước ứ động 2.png')
"""
import math
import os
import shutil
import sys
import numpy as np
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_SRC = r"C:\Users\lctan\Downloads\Thanh phan the gioi\đồi đá"
SRC = os.path.join(ROOT, "tools", "sources", "rocky_highland")
OUT = os.path.join(ROOT, "apps", "web", "public", "assets", "biomes", "rocky_highland")

os.makedirs(SRC, exist_ok=True)
os.makedirs(OUT, exist_ok=True)

# 0. Archive all raw source files if RAW_SRC exists
if os.path.exists(RAW_SRC):
    for fname in os.listdir(RAW_SRC):
        src_path = os.path.join(RAW_SRC, fname)
        if os.path.isfile(src_path):
            shutil.copy2(src_path, os.path.join(SRC, fname))
    print(f"Archived raw sources from {RAW_SRC} to {SRC}")


def save(img: Image.Image, name: str) -> None:
    target = os.path.join(OUT, name + ".png")
    img.save(target)
    print(f"Saved: {name}.png ({img.width}x{img.height})")


# =========================================================================
# 1. BOUNDARY FRINGE AUTOTILES (ground_rock_*)
# =========================================================================
fringe_im = Image.open(
    os.path.join(SRC, "bổ sung dùng để liên kế ránh giới vs các biome khác.png")
).convert("RGBA")
fringe_names = [
    ["ground_rock_tl", "ground_rock_top", "ground_rock_tr"],
    ["ground_rock_left", "ground_rock_pure", "ground_rock_right"],
    ["ground_rock_bl", "ground_rock_bot", "ground_rock_br"],
]
for r in range(3):
    for c in range(3):
        tile_crop = fringe_im.crop((c * 32, r * 32, (c + 1) * 32, (r + 1) * 32))
        save(tile_crop, fringe_names[r][c])

pure_arr = np.array(fringe_im.crop((32, 32, 64, 64)))
top_arr = np.array(fringe_im.crop((32, 0, 64, 32)))
bot_arr = np.array(fringe_im.crop((32, 64, 64, 96)))
left_arr = np.array(fringe_im.crop((0, 32, 32, 64)))
right_arr = np.array(fringe_im.crop((64, 32, 96, 64)))
ROCK_OUTLINE = np.array([112, 107, 98, 255], dtype=np.uint8)

# Synthesize 4 concave inner corners (ground_rock_in_tl..br) with transparent corner notch
for cname, (west, north) in [
    ("tl", (True, True)),
    ("tr", (False, True)),
    ("bl", (True, False)),
    ("br", (False, False)),
]:
    in_arr = pure_arr.copy()
    for y in range(32):
        for x in range(32):
            u = x if west else (31 - x)
            v = y if north else (31 - y)
            dist = math.hypot(u / 9.5, v / 8.5)
            if dist < 0.82:
                in_arr[y, x] = [0, 0, 0, 0]
            elif dist < 1.02:
                in_arr[y, x] = ROCK_OUTLINE
    # Seamlessly match adjacent orthogonal edges
    if north and west:
        in_arr[0, :12] = left_arr[31, :12]
        in_arr[:10, 0] = top_arr[:10, 31]
    elif north and not west:
        in_arr[0, 20:] = right_arr[31, 20:]
        in_arr[:10, 31] = top_arr[:10, 0]
    elif not north and west:
        in_arr[31, :12] = left_arr[0, :12]
        in_arr[22:, 0] = bot_arr[22:, 31]
    else:
        in_arr[31, 20:] = right_arr[0, 20:]
        in_arr[22:, 31] = bot_arr[22:, 0]
    save(Image.fromarray(in_arr, "RGBA"), f"ground_rock_in_{cname}")


# =========================================================================
# 2. STANDARD 1-TIER ROCKY CLIFF AUTOTILES (cliff_rock_*)
# =========================================================================
pure_ground_im = fringe_im.crop((32, 32, 64, 64))

def composite_on_pure_ground(tile_crop: Image.Image) -> Image.Image:
    """Pre-composite cliff tiles over pure rock ground so outer/inner margins
    never expose transparent holes or underlying meadow grass."""
    bg = pure_ground_im.copy()
    bg.alpha_composite(tile_crop)
    return bg

hill_im = Image.open(os.path.join(SRC, "đồi đá.png")).convert("RGBA")
cliff_names = [
    ["cliff_rock_tl", "cliff_rock_top", "cliff_rock_tr"],
    ["cliff_rock_left", "cliff_rock_pure", "cliff_rock_right"],
    ["cliff_rock_bl", "cliff_rock_bot", "cliff_rock_br"],
]
for r in range(3):
    for c in range(3):
        tile_crop = hill_im.crop((c * 32, r * 32, (c + 1) * 32, (r + 1) * 32))
        save(composite_on_pure_ground(tile_crop), cliff_names[r][c])

supp_im = Image.open(os.path.join(SRC, "bổ sung đường công đồi đá.png")).convert("RGBA")

# Northern inner corners (row 0 of supp_im)
save(composite_on_pure_ground(supp_im.crop((0, 0, 32, 32))), "cliff_rock_in_tl")
save(composite_on_pure_ground(supp_im.crop((32, 0, 64, 32))), "cliff_rock_in_tr")

# Southern inner corners for 1-tier cliff:
save(composite_on_pure_ground(supp_im.crop((32, 64, 64, 96))), "cliff_rock_in_bl")
save(composite_on_pure_ground(supp_im.crop((0, 64, 32, 96))), "cliff_rock_in_br")


# =========================================================================
# 3. 2-TIER HIGH CLIFF AUTOTILES (high_cliff_rock_*)
# =========================================================================
high_im = Image.open(os.path.join(SRC, "vách đá cao.png")).convert("RGBA")
high_names = [
    ["high_cliff_rock_tl", "high_cliff_rock_top", "high_cliff_rock_tr"],
    ["high_cliff_rock_left", "high_cliff_rock_pure", "high_cliff_rock_right"],
    ["high_cliff_rock_bl_upper", "high_cliff_rock_bot_upper", "high_cliff_rock_br_upper"],
    ["high_cliff_rock_bl", "high_cliff_rock_bot", "high_cliff_rock_br"],
]
for r in range(4):
    for c in range(3):
        tile_crop = high_im.crop((c * 32, r * 32, (c + 1) * 32, (r + 1) * 32))
        save(composite_on_pure_ground(tile_crop), high_names[r][c])

# Inner corners for 2-tier High Cliff
save(composite_on_pure_ground(supp_im.crop((0, 0, 32, 32))), "high_cliff_rock_in_tl")
save(composite_on_pure_ground(supp_im.crop((32, 0, 64, 32))), "high_cliff_rock_in_tr")
save(composite_on_pure_ground(supp_im.crop((0, 64, 32, 96))), "high_cliff_rock_in_br_upper")
save(composite_on_pure_ground(supp_im.crop((32, 64, 64, 96))), "high_cliff_rock_in_bl_upper")
save(composite_on_pure_ground(supp_im.crop((0, 96, 32, 128))), "high_cliff_rock_in_br")
save(composite_on_pure_ground(supp_im.crop((32, 96, 64, 128))), "high_cliff_rock_in_bl")



# =========================================================================
# 4. ANIMATED ROCKY RIVER & LAKE WATER STRIPS (water_rock_*, 128x32)
# =========================================================================
T = 32
FRAMES = 4
R_EDGE = 20
lake_sheet = Image.open(os.path.join(SRC, "hồ nc và sông.png")).convert("RGBA")

water_names = [
    ["tl", "top", "tr"],
    ["left", "pure", "right"],
    ["bl", "bot", "br"],
]


def make_water_strip(cell_col: int, cell_row: int) -> Image.Image:
    s = Image.new("RGBA", (T * FRAMES, T))
    for f in range(FRAMES):
        x = (f * 3 + cell_col) * T
        y = cell_row * T
        s.paste(lake_sheet.crop((x, y, x + T, y + T)), (f * T, 0))
    return s


water_tiles = {}
for r in range(3):
    for c in range(3):
        n = water_names[r][c]
        water_tiles[n] = make_water_strip(c, r + 1)
        save(water_tiles[n], f"water_rock_{n}")

# River curve / 4-way junction support (row 0, col 2 of each 96px frame)
save(make_water_strip(2, 0), "water_rock_curve")


def make_water_inner(corner: str) -> Image.Image:
    north, west = corner[0] == "t", corner[1] == "l"
    side = water_tiles["left" if west else "right"]
    vert = water_tiles["top" if north else "bot"]
    out = Image.new("RGBA", (T * FRAMES, T))
    for f in range(FRAMES):
        box = (f * T, 0, f * T + T, T)
        P = water_tiles["pure"].crop(box).load()
        S = side.crop(box).load()
        V = vert.crop(box).load()
        tile = Image.new("RGBA", (T, T))
        px = tile.load()
        for y in range(T):
            for x in range(T):
                u = x if west else T - 1 - x
                v = y if north else T - 1 - y
                d = math.hypot(u + 0.5, v + 0.5)
                if d >= R_EDGE:
                    px[x, y] = P[x, y]
                    continue
                k = min(int(d), T - 1)
                if u >= v:
                    px[x, y] = S[k if west else T - 1 - k, y]
                else:
                    px[x, y] = V[x, k if north else T - 1 - k]
        out.paste(tile, (f * T, 0))
    return out


for c in ("tl", "tr", "bl", "br"):
    save(make_water_inner(c), f"water_rock_in_{c}")


# =========================================================================
# 5. ROCKS, PEBBLES & STAGNANT WATER PUDDLES
# =========================================================================
save(
    Image.open(os.path.join(SRC, "đá trang trí 1.png")).convert("RGBA"),
    "rock_highland_boulder",
)
save(
    Image.open(os.path.join(SRC, "đá đồi cao.png")).convert("RGBA"),
    "rock_highland_1",
)
save(
    Image.open(os.path.join(SRC, "đá đồi cao 1.png")).convert("RGBA"),
    "rock_highland_2",
)
save(
    Image.open(os.path.join(SRC, "đá nhỏ.png")).convert("RGBA"),
    "rock_highland_small",
)
save(
    Image.open(os.path.join(SRC, "sỏi đồi cao.png")).convert("RGBA"),
    "decor_rock_pebbles",
)

# Stagnant water puddles (nc ứ động trang trí.png is 64x64: full 64x64 decal + 4 32x32 decals)
puddles_im = Image.open(os.path.join(SRC, "nc ứ động trang trí.png")).convert("RGBA")
save(puddles_im, "decor_rock_puddle_cluster")
puddle_idx = 1
for r in range(2):
    for c in range(2):
        cell = puddles_im.crop((c * 32, r * 32, (c + 1) * 32, (r + 1) * 32))
        save(cell, f"decor_rock_puddle_{puddle_idx}")
        puddle_idx += 1

# Wet rocks near stagnant water / lakes
save(
    Image.open(os.path.join(SRC, "đá gần nc ứ động.png")).convert("RGBA"),
    "rock_wet_wide",
)
save(
    Image.open(os.path.join(SRC, "đá gần nước ú động 1.png")).convert("RGBA"),
    "rock_wet_tall",
)
save(
    Image.open(os.path.join(SRC, "đá gàn nước ứ động 2.png")).convert("RGBA"),
    "rock_wet_small",
)

print("\n--- All Rocky Highland (Biome Đồi Đá) assets sliced and saved cleanly! ---")
