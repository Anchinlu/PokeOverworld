"""
Beach & Coastline Autotile Generation Module
Generates smooth slope-limited coastlines and resolves 13-tile autotiles without edge fallthroughs.
"""

import math
import random
from typing import List, Tuple
from .terrain import TERRAIN_BEACH, TerrainGrid
from .tiles import TILE_IDS


def generate_beach(
    cols: int,
    rows: int,
    rng: random.Random,
    terrain_grid: TerrainGrid
) -> Tuple[List[List[bool]], List[Tuple[int, int, str, int]]]:
    """
    Generates a continuous, smooth coastline along the eastern edge of the map.
    Enforces |b[r] - b[r-1]| <= 1 slope constraint for 100% seamless 3x3 autotile connectivity.
    Returns:
        sand_mask: 2D boolean grid (True where beach sand exists).
        tile_placements: List of (col, row, tile_key, tile_id).
    """
    coast_start_col = cols - rng.randint(8, 11)
    cove_depth = rng.randint(2, 4)
    cove_center_row = rows // 2 + rng.randint(-2, 2)

    # 1. Calculate base curve
    b_list = []
    for r in range(rows):
        shift = int(round(math.cos((r - cove_center_row) / (rows / 2.5)) * cove_depth))
        b = max(5, min(cols - 2, coast_start_col - shift))
        b_list.append(b)

    # 2. Forward and backward smoothing: |b[r] - b[r-1]| <= 1
    for r in range(1, rows):
        if b_list[r] > b_list[r - 1] + 1:
            b_list[r] = b_list[r - 1] + 1
        elif b_list[r] < b_list[r - 1] - 1:
            b_list[r] = b_list[r - 1] - 1

    for r in range(rows - 2, -1, -1):
        if b_list[r] > b_list[r + 1] + 1:
            b_list[r] = b_list[r + 1] + 1
        elif b_list[r] < b_list[r + 1] - 1:
            b_list[r] = b_list[r + 1] - 1

    # 3. Mark sand mask & terrain grid
    sand_mask = [[False for _ in range(cols)] for _ in range(rows)]
    for r in range(rows):
        for c in range(b_list[r], cols):
            sand_mask[r][c] = True
            terrain_grid.set_terrain(c, r, TERRAIN_BEACH)

    # 4. Solve 13-tile autotile matching
    tile_placements = []
    for r in range(rows):
        for c in range(cols):
            if not sand_mask[r][c]:
                continue

            # Continuous boundary conditions for off-map borders (North, South, East)
            n  = sand_mask[r - 1][c] if r > 0 else True
            s  = sand_mask[r + 1][c] if r < rows - 1 else True
            w  = sand_mask[r][c - 1] if c > 0 else False
            e  = sand_mask[r][c + 1] if c < cols - 1 else True
            nw = sand_mask[r - 1][c - 1] if (r > 0 and c > 0) else (sand_mask[0][c] if r == 0 else False)
            ne = sand_mask[r - 1][c + 1] if (r > 0 and c < cols - 1) else True
            sw = sand_mask[r + 1][c - 1] if (r < rows - 1 and c > 0) else (sand_mask[rows - 1][c] if r == rows - 1 else False)
            se = sand_mask[r + 1][c + 1] if (r < rows - 1 and c < cols - 1) else True

            tile_key = "pure"
            if not n and not w:   tile_key = "tl"
            elif not n and not e: tile_key = "tr"
            elif not s and not w: tile_key = "bl"
            elif not s and not e: tile_key = "br"
            elif not n:           tile_key = "top"
            elif not s:           tile_key = "bot"
            elif not w:           tile_key = "left"
            elif not e:           tile_key = "right"
            elif n and s and w and e:
                if not nw:   tile_key = "in_tl"
                elif not ne: tile_key = "in_tr"
                elif not sw: tile_key = "in_bl"
                elif not se: tile_key = "in_br"
                else:        tile_key = "pure"

            tid = TILE_IDS[f"sand_{tile_key}"]
            terrain_grid.set_tile_id(c, r, tid)
            tile_placements.append((c, r, tile_key, tid))

    return sand_mask, tile_placements
