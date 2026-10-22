"""Slice the snow lake animation sheet (4 frames x 96px) into per-tile animated strips.

Source sheet: user uploaded media_1792678390685.png (384x128 = 12 cols x 4 rows of 32px):
  frame f occupies cols 3f..3f+2
  rows 1..3          -> 3x3 lake (tl/top/tr, left/pure/right, bl/bot/br)
  row 0, col 3f+2    -> river curve / junction support tile

Output:
  tools/sources/snow/lake_snow_sheet_4frames.png (archived source)
  apps/web/public/assets/biomes/snow/water_snow_*.png: one 128x32 strip (4 frames) per tile.
  Tile keys match TILE_IDS water_snow_* so the renderer can look them up directly.
  Inner (concave) corners are generated procedurally by sampling
  the bank cross-section of the real edge tiles radially around the corner.

Usage: python tools/slice_snow_water.py
"""
import math
import os
import shutil
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_RAW = r"C:\Users\lctan\.gemini\antigravity-ide\brain\2a4ac8e5-1b5a-4a8b-b11b-07f2bcde3eca\.user_uploaded\media_1792678390685.png"
SRC_ARCHIVE_DIR = os.path.join(ROOT, "tools", "sources", "snow")
SRC_ARCHIVE = os.path.join(SRC_ARCHIVE_DIR, "lake_snow_sheet_4frames.png")
OUT = os.path.join(ROOT, "apps", "web", "public", "assets", "biomes", "snow")

os.makedirs(SRC_ARCHIVE_DIR, exist_ok=True)
os.makedirs(OUT, exist_ok=True)

# Archive the source
shutil.copy2(SRC_RAW, SRC_ARCHIVE)
print(f"Archived source sheet to: {SRC_ARCHIVE}")

T = 32
FRAMES = 4
R_EDGE = 20  # px from corner where the bank profile has fully merged into water
sheet = Image.open(SRC_ARCHIVE).convert("RGBA")

names = [
    ["tl", "top", "tr"],
    ["left", "pure", "right"],
    ["bl", "bot", "br"],
]


def strip(cell_col, cell_row):
    s = Image.new("RGBA", (T * FRAMES, T))
    for f in range(FRAMES):
        x = (f * 3 + cell_col) * T
        y = cell_row * T
        s.paste(sheet.crop((x, y, x + T, y + T)), (f * T, 0))
    return s


def save(img, name):
    target = os.path.join(OUT, name + ".png")
    img.save(target)
    print(f"Saved: {name}.png ({img.size[0]}x{img.size[1]})")


tiles = {}
for r in range(3):
    for c in range(3):
        n = names[r][c]
        tiles[n] = strip(c, r + 1)
        save(tiles[n], f"water_snow_{n}")

# river curve / junction support (row 0, col 2 of each 96px frame)
save(strip(2, 0), "water_snow_curve")


def make_inner(corner):
    """Concave corner: land is a quarter disc around the corner of the cell."""
    north, west = corner[0] == "t", corner[1] == "l"
    side = tiles["left" if west else "right"]
    vert = tiles["top" if north else "bot"]
    out = Image.new("RGBA", (T * FRAMES, T))
    for f in range(FRAMES):
        box = (f * T, 0, f * T + T, T)
        P, S, V = tiles["pure"].crop(box).load(), side.crop(box).load(), vert.crop(box).load()
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
    save(make_inner(c), f"water_snow_in_{c}")

print("All snow water animated strips generated successfully!")
