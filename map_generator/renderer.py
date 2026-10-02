"""
Map Renderer Module
Renders all map layers (Base grass, sand, path, shadows, characters, and 2.5D trees).
"""

from typing import List, Tuple
from PIL import Image, ImageDraw
from .terrain import TerrainGrid
from .tiles import TileManager, TILE_IDS


class MapRenderer:
    """Combines sliced tilesets, autotiled layers, shadows, and entities into PIL Image."""

    def __init__(self, tile_mgr: TileManager, tile_size: int = 32):
        self.tile_mgr = tile_mgr
        self.ts = tile_size

    def render_base_grass(self, cols: int, rows: int, rng, terrain_grid: TerrainGrid) -> Image.Image:
        """Renders 2x2 seamless base grass and scattered tuft variants."""
        map_img = Image.new("RGBA", (cols * self.ts, rows * self.ts))

        for r in range(rows):
            for c in range(cols):
                idx = (r % 2) * 2 + (c % 2)
                map_img.paste(self.tile_mgr.grass_base[idx], (c * self.ts, r * self.ts))
                terrain_grid.set_tile_id(c, r, 101 + idx)

        for r in range(rows):
            for c in range(cols):
                if rng.random() < 0.08:
                    map_img.paste(self.tile_mgr.grass_variant, (c * self.ts, r * self.ts))
                    terrain_grid.set_tile_id(c, r, TILE_IDS["grass_variant"])

        return map_img

    def render_sand(self, map_img: Image.Image, sand_placements: List[Tuple[int, int, str, int]]):
        """Pastes beach sand tiles onto map image."""
        for c, r, tile_key, _ in sand_placements:
            map_img.paste(self.tile_mgr.sand_tiles[tile_key], (c * self.ts, r * self.ts))

    def render_road(self, map_img: Image.Image, road_placements: List[Tuple[int, int, str, int]]):
        """Pastes dirt road tiles onto map image."""
        for c, r, tile_key, _ in road_placements:
            map_img.paste(self.tile_mgr.path_tiles[tile_key], (c * self.ts, r * self.ts))

    def render_tree_shadows(self, map_img: Image.Image, tree_placements: List[Tuple[int, int, Image.Image]]):
        """Draws realistic soft elliptical shadows beneath tree trunks."""
        shadow_layer = Image.new("RGBA", map_img.size, (0, 0, 0, 0))
        s_draw = ImageDraw.Draw(shadow_layer)
        for tx, ty, _ in tree_placements:
            bx = tx + 32
            by = ty + 112
            s_draw.ellipse((bx - 20, by - 8, bx + 20, by + 8), fill=(0, 0, 0, 75))
        map_img.paste(shadow_layer, (0, 0), shadow_layer)

    def render_characters(
        self,
        map_img: Image.Image,
        road_center_cells: List[Tuple[int, int, str]]
    ):
        """Renders Red and follower Pikachu with directional sprite cropping and shadows."""
        if not road_center_cells:
            return

        spot_idx = min(len(road_center_cells) // 3, 5)
        spawn_c, spawn_r, facing = road_center_cells[spot_idx]

        frame_y = 128 if facing == "east" else (0 if facing == "south" else 64)
        char_red = self.tile_mgr.img_red.crop((0, frame_y, 64, frame_y + 64))
        char_pika = self.tile_mgr.img_pika.crop((0, frame_y, 64, frame_y + 64))

        red_x = spawn_c * self.ts - 16
        red_y = spawn_r * self.ts - 32
        pika_x = red_x - 32 if facing == "east" else (red_x if facing == "south" else red_x + 32)
        pika_y = red_y if facing == "east" else (red_y - 32 if facing == "south" else red_y)

        char_shadow = Image.new("RGBA", map_img.size, (0, 0, 0, 0))
        cs_draw = ImageDraw.Draw(char_shadow)
        cs_draw.ellipse((red_x + 32 - 12, red_y + 58 - 6, red_x + 32 + 12, red_y + 58 + 6), fill=(0, 0, 0, 85))
        cs_draw.ellipse((pika_x + 32 - 10, pika_y + 56 - 5, pika_x + 32 + 10, pika_y + 56 + 5), fill=(0, 0, 0, 85))

        map_img.paste(char_shadow, (0, 0), char_shadow)
        map_img.paste(char_pika, (pika_x, pika_y), char_pika)
        map_img.paste(char_red, (red_x, red_y), char_red)

    def render_plants(self, map_img: Image.Image, plant_placements: List[Tuple[int, int, str]]):
        """Pastes decorative wildflower foliage (frame 0) onto grass tiles."""
        for px, py, plant_key in plant_placements:
            if plant_key in self.tile_mgr.plants:
                strip = self.tile_mgr.plants[plant_key]
                f0 = strip.crop((0, 0, self.ts, self.ts))
                map_img.paste(f0, (px, py), f0)

    def render_trees(self, map_img: Image.Image, tree_placements: List[Tuple[int, int, Image.Image]]):
        """Pastes trees in Y-sorted order for correct 2.5D overlap."""
        for tx, ty, tree_img in tree_placements:
            map_img.paste(tree_img, (tx, ty), tree_img)

    def render_berries(self, map_img: Image.Image, berry_placements: List[Tuple[int, int, str, int]]):
        """Pastes wild berry bushes according to their growth stage (0..3)."""
        for bx, by, berry_name, stage in berry_placements:
            if berry_name in self.tile_mgr.berries:
                sheet = self.tile_mgr.berries[berry_name]
                frame = sheet.crop((0, stage * 64, 32, (stage + 1) * 64))
                map_img.paste(frame, (bx, by), frame)

    def render_tall_grass(self, map_img: Image.Image, tall_grass_placements: List[Tuple[int, int]]):
        """Pastes wild Pokémon GBA tall grass tiles onto map image."""
        if hasattr(self.tile_mgr, "tall_grass") and self.tile_mgr.tall_grass:
            f0 = self.tile_mgr.tall_grass.crop((0, 0, self.ts, self.ts))
            for px, py in tall_grass_placements:
                map_img.paste(f0, (px, py), f0)

