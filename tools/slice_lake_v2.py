"""Slice the lake animation sheet (4 frames x 96px) into per-tile animated strips.

Source sheet (tools/sources/lake_sheet_4frames.png, 384x128 = 12 cols x 4 rows of 32px):
  frame f occupies cols 3f..3f+2
  rows 1..3          -> 3x3 lake (tl/top/tr, left/pure/right, bl/bot/br)
  row 0, col 3f+2    -> river curve / junction support tile

Output (apps/web/public/assets/terrain/water/): one 128x32 strip (4 frames) per tile.
Tile keys match TILE_IDS water_* so the renderer can look them up directly.
Inner (concave) corners are not in the source; they are generated procedurally by sampling
the bank cross-section of the real edge tiles radially around the corner.

Usage: python tools/slice_lake_v2.py
"""
import math
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'tools', 'sources')
SHEET = os.path.join(SRC, 'lake_sheet_4frames.png')
DEEP = os.path.join(SRC, 'river_curve_deep_src.png')
OUT = os.path.join(ROOT, 'apps', 'web', 'public', 'assets', 'terrain', 'water')
os.makedirs(OUT, exist_ok=True)

T = 32
FRAMES = 4
R_EDGE = 20  # px from corner where the bank profile has fully merged into water
sheet = Image.open(SHEET).convert('RGBA')

names = [
    ['tl', 'top', 'tr'],
    ['left', 'pure', 'right'],
    ['bl', 'bot', 'br'],
]


def strip(cell_col, cell_row):
    s = Image.new('RGBA', (T * FRAMES, T))
    for f in range(FRAMES):
        x = (f * 3 + cell_col) * T
        y = cell_row * T
        s.paste(sheet.crop((x, y, x + T, y + T)), (f * T, 0))
    return s


def save(img, name):
    img.save(os.path.join(OUT, name + '.png'))


tiles = {}
for r in range(3):
    for c in range(3):
        tiles[names[r][c]] = strip(c, r + 1)
        save(tiles[names[r][c]], f'water_{names[r][c]}')

# river curve / junction support (row 0, col 2 of each 96px frame) + static deep variant
save(strip(2, 0), 'river_curve')
save(Image.open(DEEP).convert('RGBA').resize((T, T), Image.LANCZOS), 'river_curve_deep')

# plain grass tiles (static) used by the test page for land cells
for i in range(2):
    save(sheet.crop((i * T, 0, i * T + T, T)), f'grass_{"ab"[i]}')


def make_inner(corner):
    """Concave corner: land is a quarter disc around the corner of the cell."""
    north, west = corner[0] == 't', corner[1] == 'l'
    side = tiles['left' if west else 'right']
    vert = tiles['top' if north else 'bot']
    out = Image.new('RGBA', (T * FRAMES, T))
    for f in range(FRAMES):
        box = (f * T, 0, f * T + T, T)
        P, S, V = tiles['pure'].crop(box).load(), side.crop(box).load(), vert.crop(box).load()
        tile = Image.new('RGBA', (T, T))
        px = tile.load()
        for y in range(T):
            for x in range(T):
                u = x if west else T - 1 - x
                v = y if north else T - 1 - y
                d = math.hypot(u + .5, v + .5)
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


for c in ('tl', 'tr', 'bl', 'br'):
    save(make_inner(c), f'water_in_{c}')

print(sorted(os.listdir(OUT)))
