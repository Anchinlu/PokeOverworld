"""
Chunk-Based Procedural Map Engine
Manages 16x16 tile chunks with continuous procedural generation,
autotile smoothing across chunk borders, and chunk caching.
"""

import math
from typing import Dict, Tuple, List, Optional
from PIL import Image

from .terrain import TERRAIN_EMPTY, TERRAIN_GRASS, TERRAIN_ROAD, TERRAIN_BEACH, TERRAIN_HILL, TERRAIN_OCEAN, TerrainGrid
from .tiles import TileManager, TILE_IDS
from .biomes import resolve_tree_type
from .collision import build_tree_colliders

CHUNK_SIZE = 16          # 16x16 tiles per chunk
TILE_SIZE = 32           # 32x32 pixels per tile
CHUNK_PIXELS = CHUNK_SIZE * TILE_SIZE  # 512x512 pixels


def seeded_hash(x: int, y: int, seed: int) -> float:
    """Deterministic 2D hash returning float in [0.0, 1.0)."""
    n = (x * 374761393 + y * 668265263 + seed * 962458823) & 0xFFFFFFFF
    n = (n ^ (n >> 13)) * 1274126177 & 0xFFFFFFFF
    return ((n ^ (n >> 16)) & 0xFFFFFFFF) / 4294967296.0


def get_coast_x(gy: int, seed: int) -> int:
    """Computes the continuous Eastern coastline boundary column for row gy."""
    return int(round(18 + math.sin(gy * 0.08 + seed * 0.1) * 6 + math.cos(gy * 0.04) * 3))


def is_sand_tile(gx: int, gy: int, seed: int, has_beach: bool = True) -> bool:
    if not has_beach:
        return False
    return gx >= get_coast_x(gy, seed)


def get_segment_col(k: int, seed: int) -> int:
    """Computes target column for road segment k."""
    s = (seed % 1000) * 0.1
    val = math.sin(k * 0.45 + s) * 4 + math.sin(k * 0.15) * 2
    return int(round(val))


def get_road_center_x(gy: int, seed: int) -> int:
    """Computes the main North-South highway centerline column for row gy."""
    h = 24
    k = math.floor(gy / h)
    yloc = gy - k * h
    xk = get_segment_col(k, seed)
    xk_next = get_segment_col(k + 1, seed)

    if yloc < 18:
        return xk
    elif yloc < 21:
        return int(round((xk + xk_next) / 2))
    else:
        return xk_next


def is_road_tile(gx: int, gy: int, seed: int, has_road: bool = True, has_beach: bool = True) -> bool:
    if not has_road:
        return False
    if is_sand_tile(gx, gy, seed, has_beach):
        return False

    # Main North-South highway with straight corridors and clean 90-degree transitions
    h = 24
    k = math.floor(gy / h)
    yloc = gy - k * h
    xk = get_segment_col(k, seed)
    xk_next = get_segment_col(k + 1, seed)

    on_main = False
    if yloc < 18:
        on_main = abs(gx - xk) <= 1
    elif yloc < 21:
        min_x = min(xk, xk_next) - 1
        max_x = max(xk, xk_next) + 1
        on_main = min_x <= gx <= max_x
    else:
        on_main = abs(gx - xk_next) <= 1

    if on_main:
        return True

    # Connecting East-West cross-routes every 48 rows leading towards the coast
    branch_interval = 48
    branch_row = (gy // branch_interval) * branch_interval + 10
    if abs(gy - branch_row) <= 1:
        branch_start = get_road_center_x(branch_row, seed)
        min_coast = min(
            get_coast_x(branch_row - 1, seed),
            get_coast_x(branch_row, seed),
            get_coast_x(branch_row + 1, seed)
        )
        branch_end = min_coast - 2
        if branch_start <= gx < branch_end:
            return True

    return False


def get_sand_autotile_key(gx: int, gy: int, seed: int, has_beach: bool = True) -> Tuple[str, int]:
    n  = is_sand_tile(gx, gy - 1, seed, has_beach)
    s  = is_sand_tile(gx, gy + 1, seed, has_beach)
    w  = is_sand_tile(gx - 1, gy, seed, has_beach)
    e  = is_sand_tile(gx + 1, gy, seed, has_beach)
    nw = is_sand_tile(gx - 1, gy - 1, seed, has_beach)
    ne = is_sand_tile(gx + 1, gy - 1, seed, has_beach)
    sw = is_sand_tile(gx - 1, gy + 1, seed, has_beach)
    se = is_sand_tile(gx + 1, gy + 1, seed, has_beach)

    key = "pure"
    if not n and not w:   key = "tl"
    elif not n and not e: key = "tr"
    elif not s and not w: key = "bl"
    elif not s and not e: key = "br"
    elif not n:           key = "top"
    elif not s:           key = "bot"
    elif not w:           key = "left"
    elif not e:           key = "right"
    elif n and s and w and e:
        if not nw:   key = "in_tl"
        elif not ne: key = "in_tr"
        elif not sw: key = "in_bl"
        elif not se: key = "in_br"
        else:        key = "pure"

    return key, TILE_IDS[f"sand_{key}"]


def get_road_autotile_key(gx: int, gy: int, seed: int, has_road: bool = True, has_beach: bool = True) -> Tuple[str, int]:
    n  = is_road_tile(gx, gy - 1, seed, has_road, has_beach)
    s  = is_road_tile(gx, gy + 1, seed, has_road, has_beach)
    w  = is_road_tile(gx - 1, gy, seed, has_road, has_beach)
    e  = is_road_tile(gx + 1, gy, seed, has_road, has_beach)
    nw = is_road_tile(gx - 1, gy - 1, seed, has_road, has_beach)
    ne = is_road_tile(gx + 1, gy - 1, seed, has_road, has_beach)
    sw = is_road_tile(gx - 1, gy + 1, seed, has_road, has_beach)
    se = is_road_tile(gx + 1, gy + 1, seed, has_road, has_beach)

    key = "pure"
    if not n and not w:   key = "tl"
    elif not n and not e: key = "tr"
    elif not s and not w: key = "bl"
    elif not s and not e: key = "br"
    elif not n:           key = "top"
    elif not s:           key = "bot"
    elif not w:           key = "left"
    elif not e:           key = "right"
    elif n and s and w and e:
        if not nw:   key = "in_tl"
        elif not ne: key = "in_tr"
        elif not sw: key = "in_bl"
        elif not se: key = "in_br"
        else:        key = "pure"

    tid = TILE_IDS[f"path_{key}"] if key != "pure" else TILE_IDS["dirt_pure"]
    return key, tid


def get_river_base_y(gy: int) -> int:
    h = 96
    k = math.floor(gy / h)
    return k * h + 48


def is_river_tile(gx: int, gy: int, seed: int) -> bool:
    h = 96
    k = math.floor(gy / h)
    base_y = k * h + 48
    if abs(gy - base_y) > 10:
        return False

    road_x = get_road_center_x(base_y, seed)

    # Stepped 90-degree offsets for West and East segments
    r_w = math.floor(seeded_hash(k, 401, seed) * 3)
    off_w = -2 if r_w == 0 else (2 if r_w == 1 else 0)

    r_e = math.floor(seeded_hash(k, 402, seed) * 3)
    off_e = 2 if r_e == 0 else (-2 if r_e == 1 else 0)

    turn_w = road_x - 10
    turn_e = road_x + 9

    # 1. Center crossing: width 5 from base_y to base_y + 4
    if (turn_w + 3) <= gx <= (turn_e - 3):
        return base_y <= gy <= base_y + 4

    # 2. West segment
    if gx <= turn_w:
        y_w = base_y + off_w
        return y_w <= gy <= y_w + 4

    # 3. West 90-degree step transition
    if turn_w < gx < turn_w + 3:
        min_y = min(base_y, base_y + off_w)
        max_y = max(base_y + 4, base_y + off_w + 4)
        return min_y <= gy <= max_y

    # 4. East segment
    if gx >= turn_e:
        y_e = base_y + off_e
        return y_e <= gy <= y_e + 4

    # 5. East 90-degree step transition
    if (turn_e - 3) < gx < turn_e:
        min_y = min(base_y, base_y + off_e)
        max_y = max(base_y + 4, base_y + off_e + 4)
        return min_y <= gy <= max_y

    return False


def is_bridge_tile(gx: int, gy: int, seed: int, has_road: bool = True) -> bool:
    if not has_road:
        return False
    if not is_river_tile(gx, gy, seed):
        return False
    road_x = get_road_center_x(gy, seed)
    return abs(gx - road_x) <= 1


def is_lake_tile_variant(gx: int, gy: int, center_gx: int, center_gy: int, variant: int) -> bool:
    dx = gx - center_gx
    dy = gy - center_gy

    if variant == 0:
        # Variant 0: Compact Meadow Pond (4x4 with shaved corners)
        if -2 <= dx <= 1 and -2 <= dy <= 1:
            if (dx == -2 or dx == 1) and (dy == -2 or dy == 1):
                return False
            return True
    elif variant == 1:
        # Variant 1: L-Shaped Lagoon (7x8 with clean 90-degree bend)
        in_h = (-3 <= dx <= 3) and (0 <= dy <= 3)
        in_v = (-3 <= dx <= 0) and (-4 <= dy <= 3)
        return in_h or in_v
    elif variant == 2:
        # Variant 2: Grand Stepped Lake (8x11 expansive open water)
        if -4 <= dx <= 3 and -5 <= dy <= 5:
            if (dx <= -3 or dx >= 2) and (dy == -5 or dy == 5):
                return False
            return True
    elif variant == 3:
        # Variant 3: Twin / Elongated Lake (5x9 oval lake)
        if -2 <= dx <= 2 and -4 <= dy <= 4:
            if (dx == -2 or dx == 2) and (dy == -4 or dy == 4):
                return False
            return True

    return False


_lake_cache: Dict[Tuple[int, int, bool, bool, bool], Optional[Tuple[int, int, int]]] = {}


def get_lake_placement(
    k: int,
    seed: int,
    has_road: bool = True,
    has_beach: bool = True,
    has_hills: bool = True
) -> Optional[Tuple[int, int, int]]:
    key = (k, seed, has_road, has_beach, has_hills)
    if key in _lake_cache:
        return _lake_cache[key]

    center_gy = k * 64 + 28
    road_x = get_road_center_x(center_gy, seed)

    candidate_cxs = [
        road_x - 5,
        road_x - 6,
        road_x + 6,
        road_x + 5,
        road_x + 7,
        road_x - 7,
    ]

    pref_var = math.floor(seeded_hash(k, 303, seed) * 4)
    variant_priority = [pref_var, (pref_var + 1) % 4, 3, 1, 0]

    for v in variant_priority:
        for cx in candidate_cxs:
            fits = True
            for dy in range(-6, 7):
                for dx in range(-5, 6):
                    if is_lake_tile_variant(cx + dx, center_gy + dy, cx, center_gy, v):
                        gx = cx + dx
                        gy = center_gy + dy
                        if is_river_tile(gx, gy, seed) or is_hill_tile(gx, gy, seed, has_hills, has_road, has_beach):
                            fits = False
                            break
                        if is_near_road_or_sand(gx, gy, seed, has_road, has_beach, dist=1):
                            fits = False
                            break
                if not fits:
                    break
            if fits:
                placement = (cx, center_gy, v)
                _lake_cache[key] = placement
                return placement

    _lake_cache[key] = None
    return None


def is_lake_tile(
    gx: int,
    gy: int,
    seed: int,
    has_road: bool = True,
    has_beach: bool = True,
    has_hills: bool = True
) -> bool:
    h = 64
    k = math.floor(gy / h)
    placement = get_lake_placement(k, seed, has_road, has_beach, has_hills)
    if not placement:
        return False

    return is_lake_tile_variant(gx, gy, placement[0], placement[1], placement[2])


def is_water_tile(gx: int, gy: int, seed: int, has_water: bool = True, has_road: bool = True, has_beach: bool = True, has_hills: bool = True) -> bool:
    if not has_water:
        return False
    if is_bridge_tile(gx, gy, seed, has_road):
        return False
    if is_sand_tile(gx, gy, seed, has_beach):
        return False
    if is_hill_tile(gx, gy, seed, has_hills, has_road, has_beach):
        return False
    return is_river_tile(gx, gy, seed) or is_lake_tile(gx, gy, seed, has_road, has_beach, has_hills)


def is_water_or_bridge(gx: int, gy: int, seed: int, has_water: bool = True, has_road: bool = True, has_beach: bool = True, has_hills: bool = True) -> bool:
    if not has_water:
        return False
    if is_sand_tile(gx, gy, seed, has_beach):
        return False
    if is_hill_tile(gx, gy, seed, has_hills, has_road, has_beach):
        return False
    return is_bridge_tile(gx, gy, seed, has_road) or is_river_tile(gx, gy, seed) or is_lake_tile(gx, gy, seed, has_road, has_beach, has_hills)


def is_near_water(gx: int, gy: int, seed: int, has_water: bool = True, has_road: bool = True, has_beach: bool = True, has_hills: bool = True, dist: int = 1) -> bool:
    for dy in range(-dist, dist + 1):
        for dx in range(-dist, dist + 1):
            if is_water_or_bridge(gx + dx, gy + dy, seed, has_water, has_road, has_beach, has_hills):
                return True
    return False


def get_water_autotile_key(gx: int, gy: int, seed: int, has_water: bool = True, has_road: bool = True, has_beach: bool = True, has_hills: bool = True) -> Tuple[str, int]:
    n  = is_water_or_bridge(gx, gy - 1, seed, has_water, has_road, has_beach, has_hills)
    s  = is_water_or_bridge(gx, gy + 1, seed, has_water, has_road, has_beach, has_hills)
    w  = is_water_or_bridge(gx - 1, gy, seed, has_water, has_road, has_beach, has_hills)
    e  = is_water_or_bridge(gx + 1, gy, seed, has_water, has_road, has_beach, has_hills)
    nw = is_water_or_bridge(gx - 1, gy - 1, seed, has_water, has_road, has_beach, has_hills)
    ne = is_water_or_bridge(gx + 1, gy - 1, seed, has_water, has_road, has_beach, has_hills)
    sw = is_water_or_bridge(gx - 1, gy + 1, seed, has_water, has_road, has_beach, has_hills)
    se = is_water_or_bridge(gx + 1, gy + 1, seed, has_water, has_road, has_beach, has_hills)

    key = "pure"
    if not n and not w:   key = "tl"
    elif not n and not e: key = "tr"
    elif not s and not w: key = "bl"
    elif not s and not e: key = "br"
    elif not n:           key = "top"
    elif not s:           key = "bot"
    elif not w:           key = "left"
    elif not e:           key = "right"
    elif n and s and w and e:
        if not nw:   key = "in_tl"
        elif not ne: key = "in_tr"
        elif not sw: key = "in_bl"
        elif not se: key = "in_br"
        else:        key = "pure"

    tid = TILE_IDS[f"water_{key}"]
    return key, tid





def is_near_road_or_sand(
    gx: int,
    gy: int,
    seed: int,
    has_road: bool = True,
    has_beach: bool = True,
    dist: int = 2
) -> bool:
    for dy in range(-dist, dist + 1):
        for dx in range(-dist, dist + 1):
            if is_road_tile(gx + dx, gy + dy, seed, has_road, has_beach) or is_sand_tile(gx + dx, gy + dy, seed, has_beach):
                return True
    return False


def can_spawn_east_hill(k_e: int, seed: int, has_road: bool = True, has_beach: bool = True) -> bool:
    gy_start = k_e * 40 - 10 + 4
    gy_end   = k_e * 40 - 10 + 28
    for gy in range(gy_start, gy_end + 1):
        for gx in range(7, 16):
            if is_near_road_or_sand(gx, gy, seed, has_road, has_beach, dist=2):
                return False
    return True


def get_west_max_x(k_w: int, seed: int, has_road: bool = True) -> int:
    if not has_road:
        return -8
    gy_start = k_w * 32 + 3
    gy_end   = k_w * 32 + 28
    min_road_x = min(get_road_center_x(gy, seed) - 2 for gy in range(gy_start, gy_end + 1))
    return min(-8, min_road_x - 3)


def is_hill_tile(
    gx: int,
    gy: int,
    seed: int,
    has_hills: bool = True,
    has_road: bool = True,
    has_beach: bool = True
) -> bool:
    if not has_hills:
        return False
    # Fast-exit bounding box: West hills in [-36..-8], East hills in [8..16]
    if not ((-36 <= gx <= -8) or (8 <= gx <= 16)):
        return False
    if is_near_road_or_sand(gx, gy, seed, has_road, has_beach, dist=2):
        return False

    # 1. Western Massive Mountain Range (Macro cycle 32)
    k_w = math.floor(gy / 32)
    yloc_w = gy - k_w * 32
    var_w = int(seeded_hash(k_w, 101, seed) * 4) % 4
    max_reach = get_west_max_x(k_w, seed, has_road)

    in_west = False
    if var_w == 0:
        # Stepped Triple Plateau (width 20 -> 25 -> 28)
        mid_x = min(-11, max_reach - 2)
        top_x = min(-15, mid_x - 4)
        if 3 <= yloc_w <= 8:     in_west = -36 <= gx <= top_x
        elif 9 <= yloc_w <= 18:  in_west = -36 <= gx <= mid_x
        elif 19 <= yloc_w <= 28: in_west = -36 <= gx <= max_reach
    elif var_w == 1:
        # Deep Alcove / Canyon Valley (8 tiles deep cut)
        outer_x = min(-9, max_reach)
        inner_x = outer_x - 8
        if 3 <= yloc_w <= 9:     in_west = -36 <= gx <= outer_x
        elif 10 <= yloc_w <= 19: in_west = -36 <= gx <= inner_x
        elif 20 <= yloc_w <= 28: in_west = -36 <= gx <= outer_x
    elif var_w == 2:
        # Twin Promontories (Two prominent mountain spurs)
        base_x = min(-14, max_reach - 5)
        horn_x = max_reach
        if 3 <= yloc_w <= 4:     in_west = -36 <= gx <= base_x
        elif 5 <= yloc_w <= 11:  in_west = -36 <= gx <= horn_x
        elif 12 <= yloc_w <= 17: in_west = -36 <= gx <= base_x
        elif 18 <= yloc_w <= 24: in_west = -36 <= gx <= horn_x
        elif 25 <= yloc_w <= 28: in_west = -36 <= gx <= base_x
    else:
        # Grand Continental Massif with Mountain Pass
        massif_x = min(-10, max_reach)
        if 3 <= yloc_w <= 26:    in_west = -36 <= gx <= massif_x

    if in_west:
        return True

    # 2. Eastern Hill Formations (Macro cycle 40)
    k_e = math.floor((gy + 10) / 40)
    if can_spawn_east_hill(k_e, seed, has_road, has_beach):
        yloc_e = (gy + 10) - k_e * 40
        var_e = int(seeded_hash(k_e, 202, seed) * 3)
        if var_e == 0:
            # The Grand Stepped Mesa (9x17 tiles)
            if 6 <= yloc_e <= 8:     return 9 <= gx <= 13
            elif 9 <= yloc_e <= 19:  return 8 <= gx <= 14
            elif 20 <= yloc_e <= 22: return 9 <= gx <= 13
        elif var_e == 1:
            # The L-Shaped Ridge (19 tiles tall)
            if 6 <= yloc_e <= 14:    return 8 <= gx <= 12
            elif 15 <= yloc_e <= 24: return 8 <= gx <= 14
        elif var_e == 2:
            # Twin Hills
            if 5 <= yloc_e <= 12:    return 8 <= gx <= 13
            elif 17 <= yloc_e <= 26: return 8 <= gx <= 14

    return False


def get_cliff_autotile_key(
    gx: int,
    gy: int,
    seed: int,
    has_hills: bool = True,
    has_road: bool = True,
    has_beach: bool = True
) -> Tuple[str, int]:
    n  = is_hill_tile(gx, gy - 1, seed, has_hills, has_road, has_beach)
    s  = is_hill_tile(gx, gy + 1, seed, has_hills, has_road, has_beach)
    w  = is_hill_tile(gx - 1, gy, seed, has_hills, has_road, has_beach)
    e  = is_hill_tile(gx + 1, gy, seed, has_hills, has_road, has_beach)
    nw = is_hill_tile(gx - 1, gy - 1, seed, has_hills, has_road, has_beach)
    ne = is_hill_tile(gx + 1, gy - 1, seed, has_hills, has_road, has_beach)
    sw = is_hill_tile(gx - 1, gy + 1, seed, has_hills, has_road, has_beach)
    se = is_hill_tile(gx + 1, gy + 1, seed, has_hills, has_road, has_beach)

    key = "pure"
    if not n and not w:   key = "tl"
    elif not n and not e: key = "tr"
    elif not s and not w: key = "bl"
    elif not s and not e: key = "br"
    elif not n:           key = "top"
    elif not s:           key = "bot"
    elif not w:           key = "left"
    elif not e:           key = "right"
    elif n and s and w and e:
        if not nw:   key = "in_bl"  # Rotated 180 to connect left wall to top edge
        elif not ne: key = "in_br"  # Rotated 180 to connect right wall to top edge
        elif not sw: key = "in_tr"  # BL rock
        elif not se: key = "in_tl"  # BR rock
        else:        key = "pure"

    return key, TILE_IDS[f"cliff_{key}"]


def is_near_cliff_edge(
    gx: int,
    gy: int,
    seed: int,
    has_hills: bool = True,
    has_road: bool = True,
    has_beach: bool = True
) -> bool:
    """Checks whether (gx, gy) is on or directly bordering a cliff edge/rim."""
    is_self_hill = is_hill_tile(gx, gy, seed, has_hills, has_road, has_beach)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            if dx == 0 and dy == 0:
                continue
            is_n_hill = is_hill_tile(gx + dx, gy + dy, seed, has_hills, has_road, has_beach)
            if is_self_hill and not is_n_hill:
                return True
            if not is_self_hill and is_n_hill:
                return True
    return False


class MapChunk:
    """Represents a single 16x16 tile chunk with pre-rendered ground and trees."""

    def __init__(
        self,
        cx: int,
        cy: int,
        seed: int,
        tile_mgr: TileManager,
        biome: str = "mixed",
        has_road: bool = True,
        has_beach: bool = True,
        has_hills: bool = True,
        has_trees: bool = True,
        has_water: bool = True
    ):
        self.cx = cx
        self.cy = cy
        self.seed = seed
        self.tile_mgr = tile_mgr
        self.biome = biome
        self.has_road = has_road
        self.has_beach = has_beach
        self.has_hills = has_hills
        self.has_trees = has_trees
        self.has_water = has_water

        self.terrain_grid = [[TERRAIN_GRASS for _ in range(CHUNK_SIZE)] for _ in range(CHUNK_SIZE)]
        self.tile_id_grid = [[101 for _ in range(CHUNK_SIZE)] for _ in range(CHUNK_SIZE)]
        self.trees: List[Tuple[int, int, Image.Image]] = []
        self.colliders: List[Dict[str, int]] = []
        self.plants: List[Tuple[int, int, str]] = []
        self.berry_bushes: List[Tuple[int, int, str, int]] = []
        self.tall_grass: List[Tuple[int, int]] = []
        self.ground_img = Image.new("RGBA", (CHUNK_PIXELS, CHUNK_PIXELS))

        self.build()

    def build(self):
        start_gx = self.cx * CHUNK_SIZE
        start_gy = self.cy * CHUNK_SIZE

        # 1. Base Layer & Autotiles (Grass, Sand, Road)
        for ly in range(CHUNK_SIZE):
            for lx in range(CHUNK_SIZE):
                gx = start_gx + lx
                gy = start_gy + ly
                px, py = lx * TILE_SIZE, ly * TILE_SIZE

                # 2x2 seamless base grass cycle
                grass_idx = (((gy % 2) + 2) % 2) * 2 + (((gx % 2) + 2) % 2)
                self.ground_img.paste(self.tile_mgr.grass_base[grass_idx], (px, py))

                terrain = TERRAIN_GRASS
                tid = 101 + grass_idx

                # Grass tuft variant
                if seeded_hash(gx, gy, self.seed + 1) < 0.08:
                    self.ground_img.paste(self.tile_mgr.grass_variant, (px, py))
                    tid = TILE_IDS["grass_variant"]

                # Check Sand
                if is_sand_tile(gx, gy, self.seed, self.has_beach):
                    terrain = TERRAIN_BEACH
                    sand_key, sand_tid = get_sand_autotile_key(gx, gy, self.seed, self.has_beach)
                    self.ground_img.paste(self.tile_mgr.sand_tiles[sand_key], (px, py))
                    tid = sand_tid

                # Check Bridge
                elif is_bridge_tile(gx, gy, self.seed, self.has_road):
                    terrain = TERRAIN_ROAD
                    tid = TILE_IDS["bridge_wood_v"]
                    if hasattr(self.tile_mgr, "water_anim_strip") and self.tile_mgr.water_anim_strip:
                        wf = self.tile_mgr.water_anim_strip.crop((0, 0, TILE_SIZE, TILE_SIZE))
                        self.ground_img.paste(wf, (px, py))
                    if "bridge_wood_v" in self.tile_mgr.water_tiles:
                        self.ground_img.alpha_composite(self.tile_mgr.water_tiles["bridge_wood_v"], (px, py))

                # Check Road
                elif is_road_tile(gx, gy, self.seed, self.has_road, self.has_beach):
                    terrain = TERRAIN_ROAD
                    road_key, road_tid = get_road_autotile_key(gx, gy, self.seed, self.has_road, self.has_beach)
                    self.ground_img.paste(self.tile_mgr.path_tiles[road_key], (px, py))
                    tid = road_tid

                # Check Hill / Cliff
                elif is_hill_tile(gx, gy, self.seed, self.has_hills, self.has_road, self.has_beach):
                    terrain = TERRAIN_HILL
                    cliff_key, cliff_tid = get_cliff_autotile_key(gx, gy, self.seed, self.has_hills, self.has_road, self.has_beach)
                    self.ground_img.paste(self.tile_mgr.cliff_tiles[cliff_key], (px, py))
                    tid = cliff_tid

                # Check Water
                elif is_water_tile(gx, gy, self.seed, True, self.has_road, self.has_beach, self.has_hills):
                    terrain = TERRAIN_OCEAN
                    water_key, water_tid = get_water_autotile_key(gx, gy, self.seed, True, self.has_road, self.has_beach, self.has_hills)
                    if hasattr(self.tile_mgr, "water_anim_strip") and self.tile_mgr.water_anim_strip:
                        wf = self.tile_mgr.water_anim_strip.crop((0, 0, TILE_SIZE, TILE_SIZE))
                        self.ground_img.paste(wf, (px, py))
                    if water_key in self.tile_mgr.water_tiles and water_key != "pure":
                        self.ground_img.alpha_composite(self.tile_mgr.water_tiles[water_key], (px, py))
                    tid = water_tid

                self.terrain_grid[ly][lx] = terrain
                self.tile_id_grid[ly][lx] = tid

        # 2. Tree Candidates in this chunk
        if self.has_trees:
            num_candidates = 6
            for i in range(num_candidates):
                rand_x = seeded_hash(self.cx * 100 + i, self.cy * 100 + i, self.seed + 2)
                rand_y = seeded_hash(self.cx * 100 + i, self.cy * 100 + i, self.seed + 3)

                lx = int(rand_x * (CHUNK_SIZE - 2)) + 1
                ly = int(rand_y * (CHUNK_SIZE - 2)) + 1
                gx = start_gx + lx
                gy = start_gy + ly

                tx = gx * TILE_SIZE - 16
                ty = gy * TILE_SIZE - 86

                if self.is_valid_tree_pos(tx, ty):
                    overlaps = False
                    for ex_tx, ex_ty, _ in self.trees:
                        dx = abs(tx - ex_tx)
                        dy = abs(ty - ex_ty)
                        if (dx == 0 and dy < 120) or (dx < 70 and dy < 100):
                            overlaps = True
                            break
                    if overlaps:
                        continue

                    root_c = (tx + 20) // TILE_SIZE
                    root_r = (ty + 112) // TILE_SIZE
                    near_sand = any(
                        is_sand_tile(root_c + dx, root_r + dy, self.seed, self.has_beach)
                        for dx in range(-2, 3) for dy in range(-2, 3)
                    )

                    t_type = resolve_tree_type(self.biome, root_c, root_r, 18, near_sand, rand_x)
                    tree_img = self.tile_mgr.trees[t_type]
                    self.trees.append((tx, ty, tree_img))

            self.colliders = build_tree_colliders(self.trees)

        # 3. Plant Candidates in this chunk (Sub-Quadrant Even Scatter)
        plant_types = ["flower_red", "flower_blue", "flower_purple", "flower_white", "plant_sprout"]
        for q in range(4):
            qlx = (q % 2) * 8
            qly = (q // 2) * 8

            roll1 = seeded_hash(self.cx * 4 + q, self.cy * 4 + q, self.seed + 101)
            if roll1 < 0.85:
                ox1 = 1 + int(seeded_hash(self.cx * 4 + q, self.cy * 4 + q, self.seed + 202) * 6)
                oy1 = 1 + int(seeded_hash(self.cx * 4 + q, self.cy * 4 + q, self.seed + 303) * 6)
                lx1 = qlx + ox1
                ly1 = qly + oy1

                if self.terrain_grid[ly1][lx1] in (TERRAIN_GRASS, TERRAIN_HILL):
                    gx1 = start_gx + lx1
                    gy1 = start_gy + ly1
                    px1 = gx1 * TILE_SIZE
                    py1 = gy1 * TILE_SIZE

                    if is_near_cliff_edge(gx1, gy1, self.seed, self.has_hills, self.has_road, self.has_beach):
                        continue
                    if self.terrain_grid[ly1][lx1] == TERRAIN_HILL and self.tile_id_grid[ly1][lx1] != TILE_IDS["cliff_pure"]:
                        continue

                    under_tree1 = any(
                        px1 + 24 > c["x"] and px1 + 8 < c["x"] + c["w"] and
                        py1 + 28 > c["y"] and py1 + 12 < c["y"] + c["h"]
                        for c in self.colliders
                    )
                    if not under_tree1:
                        t_idx1 = int(seeded_hash(gx1, gy1, self.seed + 404) * 5) % 5
                        self.plants.append((px1, py1, plant_types[t_idx1]))

                        roll2 = seeded_hash(gx1, gy1, self.seed + 505)
                        if roll2 < 0.45:
                            ox2 = (ox1 + 3 + int(seeded_hash(gx1, gy1, self.seed + 606) * 3)) % 7 + 1
                            oy2 = (oy1 + 3 + int(seeded_hash(gx1, gy1, self.seed + 707) * 3)) % 7 + 1
                            lx2 = qlx + ox2
                            ly2 = qly + oy2

                            if self.terrain_grid[ly2][lx2] in (TERRAIN_GRASS, TERRAIN_HILL):
                                gx2 = start_gx + lx2
                                gy2 = start_gy + ly2
                                px2 = gx2 * TILE_SIZE
                                py2 = gy2 * TILE_SIZE

                                if is_near_cliff_edge(gx2, gy2, self.seed, self.has_hills, self.has_road, self.has_beach):
                                    continue
                                if self.terrain_grid[ly2][lx2] == TERRAIN_HILL and self.tile_id_grid[ly2][lx2] != TILE_IDS["cliff_pure"]:
                                    continue

                                under_tree2 = any(
                                    px2 + 24 > c["x"] and px2 + 8 < c["x"] + c["w"] and
                                    py2 + 28 > c["y"] and py2 + 12 < c["y"] + c["h"]
                                    for c in self.colliders
                                )
                                if not under_tree2:
                                    t_idx2 = int(seeded_hash(gx2, gy2, self.seed + 808) * 5) % 5
                                    self.plants.append((px2, py2, plant_types[t_idx2]))

        # 4. Wild Berry Bushes (1 - 3 per chunk: 50% 1 tree, 40% 2 trees, 10% 3 trees)
        if hasattr(self.tile_mgr, "berries") and self.tile_mgr.berries:
            quota_roll = seeded_hash(self.cx, self.cy, self.seed + 999)
            if quota_roll >= 0.90:
                quota = 3
            elif quota_roll >= 0.50:
                quota = 2
            else:
                quota = 1

            b_roster = list(self.tile_mgr.berries.keys())
            quad_order = [0, 1, 2, 3]
            for i in range(len(quad_order) - 1, 0, -1):
                j = int(seeded_hash(self.cx * 10 + i, self.cy * 10 + i, self.seed + 888) * (i + 1))
                quad_order[i], quad_order[j] = quad_order[j], quad_order[i]

            spawned = 0
            for qi in range(4):
                if spawned >= quota:
                    break
                q = quad_order[qi]
                qlx = (q % 2) * 8
                qly = (q // 2) * 8

                ox = 1 + int(seeded_hash(self.cx * 4 + q, self.cy * 4 + q, self.seed + 234) * 6)
                oy = 2 + int(seeded_hash(self.cx * 4 + q, self.cy * 4 + q, self.seed + 345) * 5)
                b_lx = qlx + ox
                b_ly = qly + oy

                if self.terrain_grid[b_ly][b_lx] == TERRAIN_GRASS and self.terrain_grid[b_ly - 1][b_lx] == TERRAIN_GRASS:
                    bgx = start_gx + b_lx
                    bgy = start_gy + b_ly

                    if is_near_cliff_edge(bgx, bgy, self.seed, self.has_hills, self.has_road, self.has_beach):
                        continue
                    if is_near_cliff_edge(bgx, bgy - 1, self.seed, self.has_hills, self.has_road, self.has_beach):
                        continue

                    bpx = bgx * TILE_SIZE
                    bpy = bgy * TILE_SIZE - 32

                    collides = any(
                        bpx + 28 > c["x"] and bpx + 4 < c["x"] + c["w"] and
                        bpy + 60 > c["y"] and bpy + 30 < c["y"] + c["h"]
                        for c in self.colliders
                    ) or any(
                        p[0] == bpx and (p[1] == bpy or p[1] == bpy + 32)
                        for p in self.plants
                    )
                    if not collides:
                        b_idx = int(seeded_hash(bgx, bgy, self.seed + 123) * len(b_roster)) % len(b_roster)
                        b_name = b_roster[b_idx]
                        stage = int(seeded_hash(bgx, bgy, self.seed + 888) * 4) % 4
                        self.berry_bushes.append((bpx, bpy, b_name, stage))
                        self.colliders.append({
                            "x": bpx + 6,
                            "y": bgy * TILE_SIZE + 10,
                            "w": 20,
                            "h": 18,
                            "is_berry": True
                        })
                        spawned += 1

        # 5. Wild Pokémon GBA Tall Grass Patches (Organic & Randomized Overworld Distribution)
        q_roll = seeded_hash(self.cx, self.cy, self.seed + 909)
        num_patches = 0
        if 0.20 <= q_roll < 0.65:
            num_patches = 1
        elif q_roll >= 0.65:
            num_patches = 2 if q_roll < 0.88 else 3

        def try_add_grass_tile(lx: int, ly: int, is_cliff: bool = False) -> bool:
            if lx < 1 or lx >= CHUNK_SIZE - 1 or ly < 1 or ly >= CHUNK_SIZE - 1:
                return False
            gx = start_gx + lx
            gy = start_gy + ly
            px = gx * TILE_SIZE
            py = gy * TILE_SIZE

            if (px, py) in self.tall_grass:
                return False

            if is_cliff:
                if self.terrain_grid[ly][lx] != TERRAIN_HILL or self.tile_id_grid[ly][lx] != TILE_IDS["cliff_pure"]:
                    return False
                if is_near_cliff_edge(gx, gy, self.seed, self.has_hills, self.has_road, self.has_beach):
                    return False
            else:
                if self.terrain_grid[ly][lx] != TERRAIN_GRASS:
                    return False
                if is_near_cliff_edge(gx, gy, self.seed, self.has_hills, self.has_road, self.has_beach):
                    return False
                if is_near_water(gx, gy, self.seed, self.has_water, self.has_road, self.has_beach, self.has_hills, dist=1):
                    return False
                if is_road_tile(gx, gy, self.seed, self.has_road, self.has_beach) or is_sand_tile(gx, gy, self.seed, self.has_beach):
                    return False

            collides = any(
                px + 26 > c["x"] and px + 6 < c["x"] + c["w"] and
                py + 30 > c["y"] and py + 10 < c["y"] + c["h"]
                for c in self.colliders
            ) or any(
                p[0] == px and p[1] == py for p in self.plants
            ) or any(
                b[0] == px and (b[1] == py or b[1] + 32 == py)
                for b in getattr(self, "berry_bushes", [])
            )
            if collides:
                return False

            self.tall_grass.append((px, py))
            if not is_cliff:
                self.tile_id_grid[ly][lx] = TILE_IDS["tall_grass"]
            return True

        for p in range(num_patches):
            p_seed = self.seed + 1010 + p * 137
            ax = 2 + int(seeded_hash(self.cx * 7 + p, self.cy * 7 + p, p_seed + 1) * 11)
            ay = 2 + int(seeded_hash(self.cx * 11 + p, self.cy * 11 + p, p_seed + 2) * 11)
            pw = 3 + int(seeded_hash(self.cx * 13 + p, self.cy * 13 + p, p_seed + 3) * 5)
            ph = 2 + int(seeded_hash(self.cx * 17 + p, self.cy * 17 + p, p_seed + 4) * 4)
            style = int(seeded_hash(self.cx * 19 + p, self.cy * 19 + p, p_seed + 5) * 4)

            rx = max(1.0, pw / 2.0)
            ry = max(1.0, ph / 2.0)
            min_lx = max(1, ax - int(math.ceil(rx)))
            max_lx = min(CHUNK_SIZE - 2, ax + int(math.ceil(rx)))
            min_ly = max(1, ay - int(math.ceil(ry)))
            max_ly = min(CHUNK_SIZE - 2, ay + int(math.ceil(ry)))

            for ly in range(min_ly, max_ly + 1):
                for lx in range(min_lx, max_lx + 1):
                    gx = start_gx + lx
                    gy = start_gy + ly

                    include = False
                    if style == 0:
                        d = ((lx - ax) / rx) ** 2 + ((ly - ay) / ry) ** 2
                        noise = (seeded_hash(gx, gy, p_seed + 9) - 0.5) * 0.6
                        include = d <= (1.0 + noise)
                    elif style == 1:
                        is_edge = lx == min_lx or lx == max_lx or ly == min_ly or ly == max_ly
                        is_corner = (lx == min_lx or lx == max_lx) and (ly == min_ly or ly == max_ly)
                        if is_corner:
                            include = seeded_hash(gx, gy, p_seed + 11) < 0.25
                        elif is_edge:
                            include = seeded_hash(gx, gy, p_seed + 11) < 0.75
                        else:
                            include = True
                    elif style == 2:
                        if pw >= ph:
                            include = abs(ly - ay) <= 1
                        else:
                            include = abs(lx - ax) <= 1
                    else:
                        in_h = min_lx <= lx <= max_lx and ay <= ly <= max_ly
                        in_v = min_lx <= lx <= ax and min_ly <= ly <= max_ly
                        include = (in_h or in_v) and seeded_hash(gx, gy, p_seed + 13) < 0.85

                    if include:
                        try_add_grass_tile(lx, ly, False)

        # 6. Cliff & Mountain Plateau Tall Grass Patches
        if self.has_hills and any(TERRAIN_HILL in row for row in self.terrain_grid):
            cliff_grass_roll = seeded_hash(self.cx, self.cy, self.seed + 1414)
            if cliff_grass_roll < 0.75:
                plateau_cands = []
                for ly in range(1, CHUNK_SIZE - 1):
                    for lx in range(1, CHUNK_SIZE - 1):
                        if (
                            self.terrain_grid[ly][lx] == TERRAIN_HILL and
                            self.tile_id_grid[ly][lx] == TILE_IDS["cliff_pure"]
                        ):
                            gx = start_gx + lx
                            gy = start_gy + ly
                            if not is_near_cliff_edge(gx, gy, self.seed, self.has_hills, self.has_road, self.has_beach):
                                plateau_cands.append((lx, ly, gx, gy))
                if len(plateau_cands) >= 4:
                    num_alpine_patches = 2 if cliff_grass_roll < 0.35 else 1
                    for ap in range(num_alpine_patches):
                        c_idx = int(seeded_hash(self.cx * 9 + ap, self.cy * 9 + ap, self.seed + 1515 + ap * 43) * len(plateau_cands)) % len(plateau_cands)
                        center = plateau_cands[c_idx]
                        rx = 1.5 + seeded_hash(self.cx * 3 + ap, self.cy * 3 + ap, self.seed + 1616) * 1.5
                        ry = 1.2 + seeded_hash(self.cx * 5 + ap, self.cy * 5 + ap, self.seed + 1717) * 1.5

                        min_ly = max(1, center[1] - int(math.ceil(ry)))
                        max_ly = min(CHUNK_SIZE - 2, center[1] + int(math.ceil(ry)))
                        min_lx = max(1, center[0] - int(math.ceil(rx)))
                        max_lx = min(CHUNK_SIZE - 2, center[0] + int(math.ceil(rx)))

                        for ly in range(min_ly, max_ly + 1):
                            for lx in range(min_lx, max_lx + 1):
                                d = ((lx - center[0]) / rx) ** 2 + ((ly - center[1]) / ry) ** 2
                                noise = (seeded_hash(start_gx + lx, start_gy + ly, self.seed + 1818) - 0.5) * 0.5
                                if d <= 1.0 + noise:
                                    try_add_grass_tile(lx, ly, True)

    def is_valid_tree_pos(self, tx: int, ty: int) -> bool:
        """Validates footprint: NO trees on road, beach sand, cliff edges or borders."""
        c_start = (tx + 6) // TILE_SIZE
        c_end   = (tx + 58) // TILE_SIZE
        r_start = (ty + 50) // TILE_SIZE
        r_end   = (ty + 118) // TILE_SIZE

        first_hill = None
        for r in range(r_start, r_end + 1):
            for c in range(c_start, c_end + 1):
                if is_road_tile(c, r, self.seed, self.has_road, self.has_beach):
                    return False
                if is_sand_tile(c, r, self.seed, self.has_beach):
                    return False
                h = is_hill_tile(c, r, self.seed, self.has_hills, self.has_road, self.has_beach)
                if first_hill is None:
                    first_hill = h
                elif h != first_hill:
                    return False
                if h:
                    k, _ = get_cliff_autotile_key(c, r, self.seed, self.has_hills, self.has_road, self.has_beach)
                    if k != "pure":
                        return False

        root_r  = (ty + 112) // TILE_SIZE
        root_c1 = (tx + 18) // TILE_SIZE
        root_c2 = (tx + 46) // TILE_SIZE
        if (is_road_tile(root_c1, root_r, self.seed, self.has_road, self.has_beach) or
            is_sand_tile(root_c1, root_r, self.seed, self.has_beach)):
            return False
        if (is_road_tile(root_c2, root_r, self.seed, self.has_road, self.has_beach) or
            is_sand_tile(root_c2, root_r, self.seed, self.has_beach)):
            return False

        return True


class ChunkManager:
    """Manages active chunks around player with caching."""

    def __init__(
        self,
        tile_mgr: TileManager,
        seed: int = 101,
        biome: str = "mixed",
        has_road: bool = True,
        has_beach: bool = True,
        has_hills: bool = True,
        has_trees: bool = True,
        has_water: bool = True
    ):
        self.tile_mgr = tile_mgr
        self.seed = seed
        self.biome = biome
        self.has_road = has_road
        self.has_beach = has_beach
        self.has_hills = has_hills
        self.has_trees = has_trees
        self.has_water = has_water
        self.chunks: Dict[Tuple[int, int], MapChunk] = {}

    def get_chunk(self, cx: int, cy: int) -> MapChunk:
        key = (cx, cy)
        if key not in self.chunks:
            # LRU Eviction: Giới hạn tối đa 64 chunks trong bộ nhớ (Sửa Bug 8)
            if len(self.chunks) >= 64:
                far_keys = [k for k in self.chunks if abs(k[0] - cx) > 4 or abs(k[1] - cy) > 4]
                for k in far_keys:
                    del self.chunks[k]

            self.chunks[key] = MapChunk(
                cx=cx,
                cy=cy,
                seed=self.seed,
                tile_mgr=self.tile_mgr,
                biome=self.biome,
                has_road=self.has_road,
                has_beach=self.has_beach,
                has_hills=self.has_hills,
                has_trees=self.has_trees,
                has_water=self.has_water
            )
        return self.chunks[key]

    def get_active_chunks(self, center_cx: int, center_cy: int, radius: int = 2) -> List[MapChunk]:
        result = []
        for dy in range(-radius, radius + 1):
            for dx in range(-radius, radius + 1):
                result.append(self.get_chunk(center_cx + dx, center_cy + dy))
        return result
