"""
Terrain Constants & Grid Management Module
Defines standard Terrain IDs and 2D grid operations.
"""

# --- TERRAIN ID CONSTANTS ---
TERRAIN_EMPTY = 0
TERRAIN_GRASS = 1       # Meadow/land, fertile ground where trees can spawn
TERRAIN_ROAD  = 2       # Dirt road, walked path, strictly NO trees
TERRAIN_BEACH = 3       # Coastal beach sand, strictly NO trees
TERRAIN_OCEAN = 4       # Ocean water (reserved for water expansion)
TERRAIN_HILL  = 5       # Elevated hill / cliff plateau, strictly NO trees on edges

TERRAIN_NAMES = {
    TERRAIN_EMPTY: "Empty",
    TERRAIN_GRASS: "Grass",
    TERRAIN_ROAD:  "Road",
    TERRAIN_BEACH: "Beach Sand",
    TERRAIN_OCEAN: "Ocean Water",
    TERRAIN_HILL:  "Hill / Cliff Plateau",
}


class TerrainGrid:
    """Manages the 2D grid of terrain types and tile IDs."""

    def __init__(self, cols: int, rows: int, default_terrain: int = TERRAIN_GRASS):
        self.cols = cols
        self.rows = rows
        self.grid = [[default_terrain for _ in range(cols)] for _ in range(rows)]
        self.tile_ids = [[0 for _ in range(cols)] for _ in range(rows)]

    def get_terrain(self, c: int, r: int) -> int:
        if 0 <= r < self.rows and 0 <= c < self.cols:
            return self.grid[r][c]
        return TERRAIN_EMPTY

    def set_terrain(self, c: int, r: int, terrain_id: int):
        if 0 <= r < self.rows and 0 <= c < self.cols:
            self.grid[r][c] = terrain_id

    def get_tile_id(self, c: int, r: int) -> int:
        if 0 <= r < self.rows and 0 <= c < self.cols:
            return self.tile_ids[r][c]
        return 0

    def set_tile_id(self, c: int, r: int, tile_id: int):
        if 0 <= r < self.rows and 0 <= c < self.cols:
            self.tile_ids[r][c] = tile_id

    def in_bounds(self, c: int, r: int) -> bool:
        return 0 <= r < self.rows and 0 <= c < self.cols
