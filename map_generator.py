"""
Pokemon Procedural Map Generator Engine (Root Entry Point & Backward-Compatible Facade)
Delegates to the modularized `map_generator` package.
"""

import sys
from map_generator.terrain import (
    TERRAIN_EMPTY,
    TERRAIN_GRASS,
    TERRAIN_ROAD,
    TERRAIN_BEACH,
    TERRAIN_OCEAN,
    TERRAIN_NAMES,
    TerrainGrid,
)
from map_generator.tiles import TILE_IDS, TileManager
from map_generator.biomes import (
    BIOME_MIXED,
    BIOME_ROUTE,
    BIOME_COASTAL,
    BIOME_AUTUMN,
    BIOME_FOREST,
    AVAILABLE_BIOMES,
)
from map_generator.generator import PokemonMapGenerator
from map_generator.cli import main

if __name__ == "__main__":
    main()
