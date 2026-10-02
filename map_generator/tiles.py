"""
Tile Registry and Asset Manager Module
Loads 32x32 tilesets, trees, and character sprite sheets.
"""

import os
from typing import Optional
from PIL import Image

# --- TILE ID REGISTRY ---
TILE_IDS = {
    # Grass (100 series)
    "grass_01": 101, "grass_02": 102, "grass_03": 103, "grass_04": 104, "grass_variant": 105,
    # Road (200 series)
    "dirt_pure": 200, "path_top": 201, "path_bot": 202, "path_left": 203, "path_right": 204,
    "path_tl": 205, "path_tr": 206, "path_bl": 207, "path_br": 208,
    "path_in_tl": 209, "path_in_tr": 210, "path_in_bl": 211, "path_in_br": 212,
    # Beach Sand (300 series)
    "sand_pure": 300, "sand_top": 301, "sand_bot": 302, "sand_left": 303, "sand_right": 304,
    "sand_tl": 305, "sand_tr": 306, "sand_bl": 307, "sand_br": 308,
    "sand_in_tl": 309, "sand_in_tr": 310, "sand_in_bl": 311, "sand_in_br": 312,
    # Hill & Cliff (400 series)
    "cliff_pure": 400, "cliff_top": 401, "cliff_bot": 402, "cliff_left": 403, "cliff_right": 404,
    "cliff_tl": 405, "cliff_tr": 406, "cliff_bl": 407, "cliff_br": 408,
    "cliff_in_tl": 409, "cliff_in_tr": 410, "cliff_in_bl": 411, "cliff_in_br": 412,
    # Trees (500 series)
    "tree_autumn": 501, "tree_vibrant": 502, "tree_coastal": 503, "tree_deep": 504,
    # Plants & Flowers (600 series)
    "flower_red": 601, "flower_blue": 602, "flower_purple": 603, "flower_white": 604, "plant_sprout": 605,
    "tall_grass": 610,
    # Water & Bridges (700 series)
    "water_pure": 700, "water_top": 701, "water_bot": 702, "water_left": 703, "water_right": 704,
    "water_tl": 705, "water_tr": 706, "water_bl": 707, "water_br": 708,
    "water_in_tl": 709, "water_in_tr": 710, "water_in_bl": 711, "water_in_br": 712,
    "bridge_wood_h": 720, "bridge_wood_v": 721
}


import os
from pathlib import Path

DEFAULT_PROJECT_ROOT = str(Path(__file__).resolve().parent.parent)

class TileManager:
    """Loads and caches all tileset images and character sprites."""

    def __init__(self, base_dir: Optional[str] = None, tile_size: int = 32):
        self.base_dir = base_dir if base_dir is not None else DEFAULT_PROJECT_ROOT
        self.ts = tile_size

        self.grass_base = []
        self.grass_variant = None
        self.path_tiles = {}
        self.sand_tiles = {}
        self.trees = {}
        self.cliff_tiles = {}
        self.plants = {}
        self.tall_grass = None
        self.img_red = None
        self.img_pika = None

        self.load_assets()

    def load_assets(self):
        # 1. Grass Parts
        g_dir = os.path.join(self.base_dir, "Graphics", "Tilesets", "Grass_Parts")
        self.grass_base = [
            Image.open(os.path.join(g_dir, "grass_01_top_left.png")).convert("RGBA"),
            Image.open(os.path.join(g_dir, "grass_02_top_right.png")).convert("RGBA"),
            Image.open(os.path.join(g_dir, "grass_03_bottom_left.png")).convert("RGBA"),
            Image.open(os.path.join(g_dir, "grass_04_bottom_right.png")).convert("RGBA"),
        ]
        self.grass_variant = Image.open(os.path.join(g_dir, "grass_05_variant.png")).convert("RGBA")

        # 2. Path Parts (13 autotiles)
        p_dir = os.path.join(self.base_dir, "Graphics", "Tilesets", "Path_Parts")
        self.path_tiles = {
            "pure": Image.open(os.path.join(p_dir, "dirt_pure.png")).convert("RGBA"),
            "top": Image.open(os.path.join(p_dir, "path_edge_top.png")).convert("RGBA"),
            "bot": Image.open(os.path.join(p_dir, "path_edge_bottom.png")).convert("RGBA"),
            "left": Image.open(os.path.join(p_dir, "path_edge_left.png")).convert("RGBA"),
            "right": Image.open(os.path.join(p_dir, "path_edge_right.png")).convert("RGBA"),
            "tl": Image.open(os.path.join(p_dir, "path_edge_top_left.png")).convert("RGBA"),
            "tr": Image.open(os.path.join(p_dir, "path_edge_top_right.png")).convert("RGBA"),
            "bl": Image.open(os.path.join(p_dir, "path_edge_bottom_left.png")).convert("RGBA"),
            "br": Image.open(os.path.join(p_dir, "path_edge_bottom_right.png")).convert("RGBA"),
            "in_tl": Image.open(os.path.join(p_dir, "path_inner_corner_top_left.png")).convert("RGBA"),
            "in_tr": Image.open(os.path.join(p_dir, "path_inner_corner_top_right.png")).convert("RGBA"),
            "in_bl": Image.open(os.path.join(p_dir, "path_inner_corner_bottom_left.png")).convert("RGBA"),
            "in_br": Image.open(os.path.join(p_dir, "path_inner_corner_bottom_right.png")).convert("RGBA"),
        }

        # 3. Beach Sand Parts (13 autotiles)
        s_dir = os.path.join(self.base_dir, "Graphics", "Tilesets", "Beach_Sand_Parts")
        self.sand_tiles = {
            "pure": Image.open(os.path.join(s_dir, "sand_pure_center.png")).convert("RGBA"),
            "top": Image.open(os.path.join(s_dir, "sand_edge_top.png")).convert("RGBA"),
            "bot": Image.open(os.path.join(s_dir, "sand_edge_bottom.png")).convert("RGBA"),
            "left": Image.open(os.path.join(s_dir, "sand_edge_left.png")).convert("RGBA"),
            "right": Image.open(os.path.join(s_dir, "sand_edge_right.png")).convert("RGBA"),
            "tl": Image.open(os.path.join(s_dir, "sand_edge_top_left.png")).convert("RGBA"),
            "tr": Image.open(os.path.join(s_dir, "sand_edge_top_right.png")).convert("RGBA"),
            "bl": Image.open(os.path.join(s_dir, "sand_edge_bottom_left.png")).convert("RGBA"),
            "br": Image.open(os.path.join(s_dir, "sand_edge_bottom_right.png")).convert("RGBA"),
            "in_tl": Image.open(os.path.join(s_dir, "sand_inner_corner_top_left.png")).convert("RGBA"),
            "in_tr": Image.open(os.path.join(s_dir, "sand_inner_corner_top_right.png")).convert("RGBA"),
            "in_bl": Image.open(os.path.join(s_dir, "sand_inner_corner_bottom_left.png")).convert("RGBA"),
            "in_br": Image.open(os.path.join(s_dir, "sand_inner_corner_bottom_right.png")).convert("RGBA"),
        }

        # 4. Tree Parts (4 biomes)
        t_dir = os.path.join(self.base_dir, "Graphics", "Tilesets", "Tree_Parts")
        self.trees = {
            "autumn": Image.open(os.path.join(t_dir, "tree_01_autumn_ochre_raw.png")).convert("RGBA"),
            "vibrant": Image.open(os.path.join(t_dir, "tree_02_vibrant_green_raw.png")).convert("RGBA"),
            "coastal": Image.open(os.path.join(t_dir, "tree_03_coastal_teal_raw.png")).convert("RGBA"),
            "deep": Image.open(os.path.join(t_dir, "tree_04_deep_forest_raw.png")).convert("RGBA"),
        }

        # 5. Hill & Cliff Parts (11 tiles)
        c_dir = os.path.join(self.base_dir, "Graphics", "Tilesets", "Hill_Cliff_Parts")
        self.cliff_tiles = {
            "pure": Image.open(os.path.join(c_dir, "cliff_pure.png")).convert("RGBA"),
            "top": Image.open(os.path.join(c_dir, "cliff_edge_top.png")).convert("RGBA"),
            "bot": Image.open(os.path.join(c_dir, "cliff_edge_bottom.png")).convert("RGBA"),
            "left": Image.open(os.path.join(c_dir, "cliff_edge_left.png")).convert("RGBA"),
            "right": Image.open(os.path.join(c_dir, "cliff_edge_right.png")).convert("RGBA"),
            "tl": Image.open(os.path.join(c_dir, "cliff_edge_top_left.png")).convert("RGBA"),
            "tr": Image.open(os.path.join(c_dir, "cliff_edge_top_right.png")).convert("RGBA"),
            "bl": Image.open(os.path.join(c_dir, "cliff_edge_bottom_left.png")).convert("RGBA"),
            "br": Image.open(os.path.join(c_dir, "cliff_edge_bottom_right.png")).convert("RGBA"),
            "in_tl": Image.open(os.path.join(c_dir, "cliff_inner_corner_top_left.png")).convert("RGBA"),
            "in_tr": Image.open(os.path.join(c_dir, "cliff_inner_corner_top_right.png")).convert("RGBA"),
            "in_bl": Image.open(os.path.join(c_dir, "cliff_inner_corner_bottom_left.png")).convert("RGBA"),
            "in_br": Image.open(os.path.join(c_dir, "cliff_inner_corner_bottom_right.png")).convert("RGBA"),
        }

        # 6. Characters
        char_dir = os.path.join(self.base_dir, "Graphics", "Characters")
        self.img_red = Image.open(os.path.join(char_dir, "trchar000.png")).convert("RGBA")
        self.img_pika = Image.open(os.path.join(char_dir, "Followers", "PIKACHU.png")).convert("RGBA")

        # 7. Plants & Flowers (5 animated sprite strips)
        pl_dir = os.path.join(self.base_dir, "Graphics", "Tilesets", "Plant_Parts")
        self.plants = {
            "flower_red": Image.open(os.path.join(pl_dir, "flower_red.png")).convert("RGBA"),
            "plant_sprout": Image.open(os.path.join(pl_dir, "plant_sprout.png")).convert("RGBA"),
            "flower_blue": Image.open(os.path.join(pl_dir, "flower_blue.png")).convert("RGBA"),
            "flower_purple": Image.open(os.path.join(pl_dir, "flower_purple.png")).convert("RGBA"),
            "flower_white": Image.open(os.path.join(pl_dir, "flower_white.png")).convert("RGBA"),
        }

        # 8. Berry Trees (Graphics/Tilesets/Bery)
        b_dir = os.path.join(self.base_dir, "Graphics", "Tilesets", "Bery")
        self.berries = {}
        for b in ["ORANBERRY", "CHERIBERRY", "CHESTOBERRY", "PECHABERRY", "RAWSTBERRY", "ASPEARBERRY", "LEPPABERRY", "PERSIMBERRY", "LUMBERRY", "SITRUSBERRY"]:
            fpath = os.path.join(b_dir, f"berrytree_{b}.png")
            if os.path.exists(fpath):
                self.berries[b] = Image.open(fpath).convert("RGBA")

        # 9. Tall Grass (160x32 RGBA)
        tg_path = os.path.join(pl_dir, "tall_grass.png")
        if os.path.exists(tg_path):
            self.tall_grass = Image.open(tg_path).convert("RGBA")

        # 10. Water Parts & Bridges (Graphics/Tilesets/Water_Parts)
        w_dir = os.path.join(self.base_dir, "Graphics", "Tilesets", "Water_Parts")
        self.water_tiles = {}
        for w_key in ["pure", "top", "bot", "left", "right", "tl", "tr", "bl", "br", "in_tl", "in_tr", "in_bl", "in_br"]:
            wp = os.path.join(w_dir, f"water_{w_key}.png")
            if os.path.exists(wp):
                self.water_tiles[w_key] = Image.open(wp).convert("RGBA")
        for b_key in ["bridge_wood_h", "bridge_wood_v"]:
            bp = os.path.join(w_dir, f"{b_key}.png")
            if os.path.exists(bp):
                self.water_tiles[b_key] = Image.open(bp).convert("RGBA")
        strip_path = os.path.join(w_dir, "water_anim_strip.png")
        if os.path.exists(strip_path):
            self.water_anim_strip = Image.open(strip_path).convert("RGBA")

