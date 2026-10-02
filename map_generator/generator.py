"""
Main Procedural Map Generator Engine
Coordinates the procedural generation pipeline:
Seed -> Terrain grid -> Roads/beach -> Tile selection -> Trees -> Collision -> Render/export
"""

import random
from typing import Tuple, List, Optional
from PIL import Image

from .terrain import TerrainGrid
from .tiles import TileManager
from .biomes import BIOME_MIXED, BIOME_CONFIGS
from .beaches import generate_beach
from .roads import generate_road
from .trees import generate_trees
from .collision import build_tree_colliders
from .renderer import MapRenderer


from pathlib import Path

DEFAULT_PROJECT_ROOT = str(Path(__file__).resolve().parent.parent)


class PokemonMapGenerator:
    """Coordinates procedural generation of seamless Pokemon route maps."""

    def __init__(self, base_dir: Optional[str] = None, tile_size: int = 32):
        self.base_dir = base_dir if base_dir is not None else DEFAULT_PROJECT_ROOT
        self.ts = tile_size
        self.tile_mgr = TileManager(base_dir=self.base_dir, tile_size=tile_size)
        self.renderer = MapRenderer(tile_mgr=self.tile_mgr, tile_size=tile_size)

    def generate_map(
        self,
        seed: Optional[int] = None,
        cols: int = 24,
        rows: int = 18,
        biome: str = BIOME_MIXED,
        has_road: bool = True,
        has_beach: bool = True,
        has_trees: bool = True,
        has_characters: bool = True
    ) -> Tuple[Image.Image, List[List[int]], List[List[int]]]:
        """
        Executes full generation pipeline.
        Returns:
            map_image: PIL Image of the completed map.
            terrain_grid: 2D array of Terrain IDs.
            tile_id_grid: 2D array of Tile IDs.
        """
        if seed is None:
            seed = random.randint(1000, 99999)
        rng = random.Random(seed)

        # 1. Initialize terrain & tile grids
        terrain_grid = TerrainGrid(cols=cols, rows=rows)

        # 2. Layer 0: Base Grass
        map_img = self.renderer.render_base_grass(cols, rows, rng, terrain_grid)

        # 3. Layer 1: Beach Sand (Autotiled)
        sand_mask = []
        if has_beach and BIOME_CONFIGS.get(biome, {}).get("has_beach", True):
            sand_mask, sand_placements = generate_beach(cols, rows, rng, terrain_grid)
            self.renderer.render_sand(map_img, sand_placements)

        # 4. Layer 2: Dirt Road (3-Tile Wide S-Curve)
        road_centers = []
        if has_road and biome != "coastal_only":
            road_centers, road_placements = generate_road(cols, rows, rng, terrain_grid, sand_mask)
            self.renderer.render_road(map_img, road_placements)

        # 5. Layer 3: Ecosystem Trees & Shadows
        tree_placements = []
        if has_trees:
            tree_placements = generate_trees(cols, rows, rng, terrain_grid, self.tile_mgr, biome, self.ts)
            self.renderer.render_tree_shadows(map_img, tree_placements)

        # 6. Layer 4: Characters
        if has_characters and road_centers:
            self.renderer.render_characters(map_img, road_centers)

        # 7. Layer 5: Trees (Y-sorted 2.5D overlap)
        if tree_placements:
            self.renderer.render_trees(map_img, tree_placements)

        return map_img, terrain_grid.grid, terrain_grid.tile_ids
