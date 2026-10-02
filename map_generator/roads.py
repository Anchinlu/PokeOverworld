"""
Road & Path Generation Module
Generates 3-tile wide winding dirt paths with seamless inner/outer corners and closed end caps.
"""

import random
from typing import List, Tuple
from .terrain import TERRAIN_ROAD, TerrainGrid
from .tiles import TILE_IDS


def generate_road(
    cols: int,
    rows: int,
    rng: random.Random,
    terrain_grid: TerrainGrid,
    sand_mask: List[List[bool]]
) -> Tuple[List[Tuple[int, int, str]], List[Tuple[int, int, str, int]]]:
    """
    Generates a 3-tile wide S-curve dirt road.
    Fixes corner alignment at Turn 2 (left border assigned to left edge) and caps horizontal end.
    Returns:
        road_center_cells: List of (col, row, facing_direction) for player/pika spawning.
        tile_placements: List of (col, row, tile_key, tile_id).
    """
    start_row = rng.randint(4, 6)
    turn1_col = rng.randint(6, 9)
    turn1_row = start_row
    turn2_row = rng.randint(start_row + 4, min(rows - 4, start_row + 7))

    # Calculate road terminus
    max_road_col = cols - 2
    if sand_mask and any(sand_mask[turn2_row]):
        first_sand = sand_mask[turn2_row].index(True)
        max_road_col = max(turn1_col + 4, first_sand - 1)
    end_col = cols if not (sand_mask and any(sand_mask[turn2_row])) else min(cols, max_road_col)

    tile_placements: List[Tuple[int, int, str, int]] = []
    road_center_cells: List[Tuple[int, int, str]] = []

    def set_cell(c: int, r: int, key: str):
        if terrain_grid.in_bounds(c, r):
            tid = TILE_IDS[f"path_{key}"] if key != "pure" else TILE_IDS["dirt_pure"]
            terrain_grid.set_terrain(c, r, TERRAIN_ROAD)
            terrain_grid.set_tile_id(c, r, tid)
            tile_placements.append((c, r, key, tid))

    # --- Seg 1: Horizontal West -> Turn 1 ---
    for c in range(0, turn1_col):
        set_cell(c, turn1_row - 1, "top")
        set_cell(c, turn1_row, "pure")
        set_cell(c, turn1_row + 1, "bot")
        road_center_cells.append((c, turn1_row, "east"))

    # --- Turn 1: West -> South ---
    tc1, tr1 = turn1_col, turn1_row
    set_cell(tc1, tr1 - 1, "top")
    set_cell(tc1 + 1, tr1 - 1, "top")
    set_cell(tc1 + 2, tr1 - 1, "tr")

    set_cell(tc1, tr1, "pure")
    set_cell(tc1 + 1, tr1, "pure")
    set_cell(tc1 + 2, tr1, "right")

    set_cell(tc1, tr1 + 1, "in_bl")
    set_cell(tc1 + 1, tr1 + 1, "pure")
    set_cell(tc1 + 2, tr1 + 1, "right")
    road_center_cells.append((tc1 + 1, tr1, "south"))

    # --- Seg 2: Vertical going South ---
    for r in range(tr1 + 2, turn2_row):
        set_cell(tc1, r, "left")
        set_cell(tc1 + 1, r, "pure")
        set_cell(tc1 + 2, r, "right")
        road_center_cells.append((tc1 + 1, r, "south"))

    # --- Turn 2: South -> East (Outer BL Corner and Inner TR Corner) ---
    tr2 = turn2_row
    set_cell(tc1, tr2 - 1, "left")
    set_cell(tc1 + 1, tr2 - 1, "pure")
    set_cell(tc1 + 2, tr2 - 1, "in_tr")

    set_cell(tc1, tr2, "left")       # CRITICAL FIX: Left border alignment (was 'pure')
    set_cell(tc1 + 1, tr2, "pure")
    set_cell(tc1 + 2, tr2, "pure")

    set_cell(tc1, tr2 + 1, "bl")
    set_cell(tc1 + 1, tr2 + 1, "bot")
    set_cell(tc1 + 2, tr2 + 1, "bot")
    road_center_cells.append((tc1 + 1, tr2, "east"))

    # --- Seg 3: Horizontal going East ---
    actual_end_col = end_col - 1 if end_col < cols else cols
    for c in range(tc1 + 3, actual_end_col):
        set_cell(c, tr2 - 1, "top")
        set_cell(c, tr2, "pure")
        set_cell(c, tr2 + 1, "bot")
        road_center_cells.append((c, tr2, "east"))

    # --- Road End Cap (Smooth closed terminus if ending on grass before map edge) ---
    if end_col < cols and actual_end_col >= tc1 + 3:
        set_cell(actual_end_col, tr2 - 1, "tr")
        set_cell(actual_end_col, tr2, "right")
        set_cell(actual_end_col, tr2 + 1, "br")
        road_center_cells.append((actual_end_col, tr2, "east"))

    return road_center_cells, tile_placements
