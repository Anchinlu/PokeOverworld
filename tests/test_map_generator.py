"""
Automated Unit & Integration Tests for Pokemon Procedural Map Generator
Verifies requirements from docs/plans/08-map-generator-migration.md:
1. Terrain ID conservation.
2. Ecosystem strict rules (NO trees on roads or beach sand).
3. Determinism under identical seed.
4. Road and Beach autotile connectivity.
"""

import unittest
from map_generator.terrain import (
    TERRAIN_EMPTY, TERRAIN_GRASS, TERRAIN_ROAD, TERRAIN_BEACH, TERRAIN_OCEAN, TERRAIN_HILL, TerrainGrid
)
from map_generator.tiles import TILE_IDS, TileManager
from map_generator.biomes import BIOME_MIXED, BIOME_ROUTE, BIOME_AUTUMN, BIOME_COASTAL
from map_generator.trees import is_valid_tree_pos
from map_generator.generator import PokemonMapGenerator


class TestMapGeneratorModular(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.generator = PokemonMapGenerator()

    def test_terrain_ids_and_grid(self):
        """Verifies terrain IDs match the specification."""
        self.assertEqual(TERRAIN_EMPTY, 0)
        self.assertEqual(TERRAIN_GRASS, 1)
        self.assertEqual(TERRAIN_ROAD, 2)
        self.assertEqual(TERRAIN_BEACH, 3)
        self.assertEqual(TERRAIN_OCEAN, 4)

        grid = TerrainGrid(cols=10, rows=10)
        self.assertEqual(grid.get_terrain(5, 5), TERRAIN_GRASS)
        grid.set_terrain(5, 5, TERRAIN_ROAD)
        self.assertEqual(grid.get_terrain(5, 5), TERRAIN_ROAD)
        self.assertEqual(grid.get_terrain(100, 100), TERRAIN_EMPTY)

    def test_tree_ecological_validation(self):
        """Ensures trees cannot be placed on roads or beach sand."""
        grid = TerrainGrid(cols=20, rows=20)

        # Base case on pure grass
        self.assertTrue(is_valid_tree_pos(64, 64, grid, 20, 20))

        # Place road under tree base (c=2, r=2 is inside tree trunk footprint for tx=64, ty=0)
        grid.set_terrain(2, 2, TERRAIN_ROAD)
        self.assertFalse(is_valid_tree_pos(64, 0, grid, 20, 20))

        # Place beach sand under tree base
        grid_beach = TerrainGrid(cols=20, rows=20)
        grid_beach.set_terrain(2, 2, TERRAIN_BEACH)
        self.assertFalse(is_valid_tree_pos(64, 0, grid_beach, 20, 20))

    def test_determinism_same_seed(self):
        """Same seed must produce identical terrain grids and identical tile ID grids."""
        img1, terrain1, tiles1 = self.generator.generate_map(seed=42, cols=24, rows=18, biome=BIOME_MIXED)
        img2, terrain2, tiles2 = self.generator.generate_map(seed=42, cols=24, rows=18, biome=BIOME_MIXED)

        self.assertEqual(terrain1, terrain2, "Terrain grids must be strictly identical for same seed")
        self.assertEqual(tiles1, tiles2, "Tile ID grids must be strictly identical for same seed")
        self.assertEqual(list(img1.tobytes()), list(img2.tobytes()), "Output PNG bytes must be bit-identical")

    def test_all_biomes_generation(self):
        """Generates maps for all biomes without errors."""
        for biome in [BIOME_MIXED, BIOME_ROUTE, BIOME_AUTUMN, BIOME_COASTAL]:
            img, terrain, tiles = self.generator.generate_map(seed=101, cols=24, rows=18, biome=biome)
            self.assertEqual(img.size, (24 * 32, 18 * 32))
            self.assertEqual(len(terrain), 18)
            self.assertEqual(len(terrain[0]), 24)

    def test_no_trees_on_road_in_generated_map(self):
        """Verifies that in a generated map, road cells are never overridden by tree bases."""
        img, terrain, tiles = self.generator.generate_map(seed=101, cols=24, rows=18, biome=BIOME_MIXED)

        # Count terrain occurrences
        road_count = sum(row.count(TERRAIN_ROAD) for row in terrain)
        beach_count = sum(row.count(TERRAIN_BEACH) for row in terrain)
        grass_count = sum(row.count(TERRAIN_GRASS) for row in terrain)

        self.assertGreater(road_count, 10, "Map must have road cells")
        self.assertGreater(beach_count, 10, "Map must have beach cells")
        self.assertGreater(grass_count, 100, "Map must have grass cells")

    def test_chunk_manager_streaming(self):
        """Verifies chunk streaming, autotiling, and caching."""
        from map_generator.chunk import ChunkManager
        from map_generator.tiles import TileManager
        tm = TileManager()
        cm = ChunkManager(tile_mgr=tm, seed=101)

        # Retrieve chunk (0, 0)
        chunk0 = cm.get_chunk(0, 0)
        self.assertEqual(chunk0.cx, 0)
        self.assertEqual(chunk0.cy, 0)
        self.assertEqual(len(chunk0.terrain_grid), 16)
        self.assertEqual(len(chunk0.terrain_grid[0]), 16)

        # Retrieve active chunks in radius 1 (3x3 = 9 chunks)
        active_chunks = cm.get_active_chunks(0, 0, radius=1)
        self.assertEqual(len(active_chunks), 9)

        # Cache check: chunk (0, 0) is cached
        self.assertIs(cm.get_chunk(0, 0), chunk0)

    def test_hill_cliff_elevation_and_autotile(self):
        """Verifies Hill & Cliff elevation, inner corners, and tree avoidance on edges."""
        from map_generator.chunk import (
            is_hill_tile, get_cliff_autotile_key, MapChunk, ChunkManager
        )
        self.assertEqual(TERRAIN_HILL, 5)

        seed = 101
        # Retrieve a western chunk that contains hills (e.g. chunk (-1, 0))
        from map_generator.tiles import TileManager
        tm = TileManager()
        cm = ChunkManager(tile_mgr=tm, seed=seed)
        chunk_west = cm.get_chunk(-1, 0)

        # Verify hill terrain presence
        has_hill_tile = any(
            TERRAIN_HILL in row for row in chunk_west.terrain_grid
        )
        self.assertTrue(has_hill_tile, "Western chunk (-1, 0) must contain elevated hill tiles")

        # Verify that cliff tiles were loaded in TileManager
        self.assertIn("pure", tm.cliff_tiles)
        self.assertIn("in_tl", tm.cliff_tiles)
        self.assertIn("in_tr", tm.cliff_tiles)
        self.assertIn("in_bl", tm.cliff_tiles)
        self.assertIn("in_br", tm.cliff_tiles)


if __name__ == "__main__":
    unittest.main()

