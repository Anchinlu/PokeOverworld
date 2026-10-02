"""
Tree Placement & Ecology Engine
Enforces strict ecosystem rules: NO trees on road, road edge, or beach sand.
"""

import random
from typing import List, Tuple
from PIL import Image
from .terrain import TERRAIN_GRASS, TERRAIN_ROAD, TERRAIN_BEACH, TERRAIN_HILL, TERRAIN_OCEAN, TerrainGrid
from .biomes import resolve_tree_type
from .tiles import TileManager


def is_valid_tree_pos(
    tx: int,
    ty: int,
    terrain_grid: TerrainGrid,
    cols: int,
    rows: int,
    ts: int = 32
) -> bool:
    """
    Validates whether a 64x118 px tree can be placed at (tx, ty).
    STRICT RULES:
    1. Entire trunk, roots, and shadow footprint (tx+6..tx+58, ty+50..ty+118) cannot touch ROAD or BEACH.
    2. Footprint cannot straddle elevation boundaries.
    3. Root anchors must be on fertile ground (GRASS or pure plateau HILL), at the same elevation.
    """
    c_start = max(0, (tx + 6) // ts)
    c_end   = min(cols - 1, (tx + 58) // ts)
    r_start = max(0, (ty + 50) // ts)
    r_end   = min(rows - 1, (ty + 118) // ts)

    root_r = (ty + 112) // ts
    if root_r < 0 or root_r >= rows:
        return False

    first_terrain = None
    for r in range(r_start, r_end + 1):
        for c in range(c_start, c_end + 1):
            t = terrain_grid.get_terrain(c, r)
            if t in (TERRAIN_ROAD, TERRAIN_BEACH, TERRAIN_OCEAN):
                return False
            if first_terrain is None:
                first_terrain = t
            elif (t == TERRAIN_HILL) != (first_terrain == TERRAIN_HILL):
                return False

    # Root anchors check
    root_c1 = (tx + 18) // ts
    root_c2 = (tx + 46) // ts
    if 0 <= root_r < rows and 0 <= root_c1 < cols and 0 <= root_c2 < cols:
        t1 = terrain_grid.get_terrain(root_c1, root_r)
        t2 = terrain_grid.get_terrain(root_c2, root_r)
        if t1 not in (TERRAIN_GRASS, TERRAIN_HILL) or t2 not in (TERRAIN_GRASS, TERRAIN_HILL) or t1 != t2:
            return False
    else:
        return False

    return True


def generate_trees(
    cols: int,
    rows: int,
    rng: random.Random,
    terrain_grid: TerrainGrid,
    tile_mgr: TileManager,
    biome: str,
    ts: int = 32
) -> List[Tuple[int, int, Image.Image]]:
    """
    Generates Northern Barrier Forest and woodland tree clusters with biometric coloring.
    Returns Y-sorted tree placements: List of (tx, ty, tree_image).
    """
    map_w = cols * ts
    tree_placements: List[Tuple[int, int, Image.Image]] = []

    # 1. Northern Barrier Forest (Row 1)
    step_x = 48
    for tx in range(0, map_w + 32, step_x):
        ty = -14 + rng.randint(-4, 4)
        if is_valid_tree_pos(tx, ty, terrain_grid, cols, rows, ts):
            t_type = "deep" if (tx // step_x) % 2 == 0 else "vibrant"
            tree_placements.append((tx, ty, tile_mgr.trees[t_type]))

    # 2. Northern Barrier Forest (Row 2 staggered)
    for tx in range(16, map_w, 64):
        ty = 18 + rng.randint(-4, 4)
        if is_valid_tree_pos(tx, ty, terrain_grid, cols, rows, ts):
            t_type = "vibrant" if rng.random() < 0.6 else "deep"
            tree_placements.append((tx, ty, tile_mgr.trees[t_type]))

    # 3. Meadow & Woodland Tree Clusters
    num_trees = rng.randint(8, 14)
    for _ in range(num_trees):
        tc = rng.randint(1, cols - 3)
        tr = rng.randint(4, rows - 4)
        tx = tc * ts + rng.randint(-8, 8)
        ty = tr * ts - 90 + rng.randint(-6, 6)

        if not is_valid_tree_pos(tx, ty, terrain_grid, cols, rows, ts):
            continue

        # Overlap prevention with already placed trees
        overlaps = False
        for ex_tx, ex_ty, _ in tree_placements:
            dx = abs(tx - ex_tx)
            dy = abs(ty - ex_ty)
            if (dx == 0 and dy < 120) or (dx < 70 and dy < 100):
                overlaps = True
                break
        if overlaps:
            continue

        root_c1 = (tx + 20) // ts
        root_r  = (ty + 112) // ts

        # Near beach check
        near_beach = False
        for dr in range(-2, 3):
            for dc in range(-2, 3):
                nr, nc = root_r + dr, root_c1 + dc
                if terrain_grid.in_bounds(nc, nr) and terrain_grid.get_terrain(nc, nr) == TERRAIN_BEACH:
                    near_beach = True
                    break

        t_type = resolve_tree_type(biome, root_c1, root_r, rows, near_beach, rng.random())
        tree_placements.append((tx, ty, tile_mgr.trees[t_type]))

    # 4. Y-sorting for 2.5D depth
    tree_placements.sort(key=lambda item: item[1] + 112)
    return tree_placements
