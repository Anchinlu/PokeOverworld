"""Slice the Autumn Forest source sheets into correctly-identified sprites.

Sources live in tools/sources/autumn (clean copies of the "rừng mùa thu" folder).
Outputs go to apps/web/public/assets/biomes/autumn.

What each sheet really contains (verified visually + numerically):
  trees_autumn_red.png   256x128  4 trees: red tall 64x120, red small 60x96,
                                  amber tall, amber small  (ground baked in)
  trees_autumn_gold.png  256x128  4 trees: golden/olive tall+small x2
  canopy_autumn_red.png  256x256  16 blocks 64x64 = the BOTTOM HALF (y 64..128)
  canopy_autumn_gold.png          of the 4 trees above, with decorated bases:
                                  row0 small mushrooms, row1 large mushrooms,
                                  row2 berries, row3 ivy.  Column = tree index.
  tree_autumn_giant.png  128x160  one giant maple (single object)
  grass_autumn_1.png     128x64   4 spiky autumn bushes (32x64 each)
  grass_autumn_2.png     128x64   2 big spiky bushes (64x64 each)
  flowers_autumn.png     128x32   4 flower-vine decals (32x32)
  rocks_autumn.png        64x32   2 rock-cluster decals (32x32)
  leaves_fallen_autumn   64x64    ONE fallen-leaf pile (single 64x64 object)
  water_lilies_autumn    64x64    several lily-pad objects (connected comps)
  ground_decor_autumn    256x96   24 cells of 32x32 ground decals
  terrain_autumn_cliffs  256x128  hill mesa 96x128 (x0, baked ground), pit/path
                                  block 64x128 (x96), hill mesa 96x128 with
                                  alpha (x160).  The GROUND tile is the plateau
                                  interior (32,32,32,32) of the hill mesa, exactly
                                  how the other biomes derive their ground.
"""
import json
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from autumn_lib import GROUND, any_bbox, components, opaque_bbox, remove_ground  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = os.path.join(ROOT, "tools", "sources", "autumn")
OUT = os.path.join(ROOT, "apps", "web", "public", "assets", "biomes", "autumn")
PREVIEW = os.path.join(SRC, "_preview")

CATALOG = []  # entries for the test page / future manifest


def load(name):
    return Image.open(os.path.join(SRC, name)).convert("RGBA")


def clear_palette(img):
    """Also clear enclosed exact-ground-colour pixels (decals only)."""
    arr = np.array(img)
    for r, g, b in GROUND:
        m = (arr[:, :, 0] == r) & (arr[:, :, 1] == g) & (arr[:, :, 2] == b) & (arr[:, :, 3] > 0)
        arr[m] = (0, 0, 0, 0)
    return Image.fromarray(arr, "RGBA")


def save(img, name, kind, anchor="bottom"):
    img.save(os.path.join(OUT, name + ".png"))
    CATALOG.append({"key": name, "kind": kind, "w": img.width, "h": img.height, "anchor": anchor})


def main():
    # wipe earlier (mis-sliced) generated files but keep pre-existing assets
    keep = {"tree_autumn.png", "bush_cone_autumn.png"}
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        if f.endswith(".png") and f not in keep:
            os.remove(os.path.join(OUT, f))
    os.makedirs(PREVIEW, exist_ok=True)

    # ---------------- ground + hills ----------------
    terrain = load("terrain_autumn_cliffs.png")
    mesa_alpha = terrain.crop((160, 0, 256, 128))  # already transparent corners
    mesa_baked = terrain.crop((0, 0, 96, 128))
    ground = mesa_baked.crop((32, 32, 64, 64))
    assert {tuple(p[:3]) for p in np.array(ground).reshape(-1, 4)} == GROUND, "ground tile must be pure palette"
    assert list(np.array(ground).ravel()) == list(np.array(mesa_alpha.crop((32, 32, 64, 64))).ravel())
    save(ground, "ground_autumn_pure", "ground", "tile")
    save(mesa_alpha, "hill_autumn_mesa", "hill", "tile")
    pit = remove_ground(terrain.crop((96, 0, 160, 128)))
    save(pit, "hill_autumn_pit_block", "hill", "tile")

    # ---------------- trees + decorated bases ----------------
    tree_cols = [(0, 64), (66, 60), (128, 64), (194, 60)]  # x0,width (measured)
    base_names = ["mushroom_s", "mushroom_l", "berry", "ivy"]
    sheets = [
        ("trees_autumn_red.png", "canopy_autumn_red.png", ["maple_red_tall", "maple_red_small", "maple_amber_tall", "maple_amber_small"]),
        ("trees_autumn_gold.png", "canopy_autumn_gold.png", ["larch_gold_tall", "larch_gold_small", "larch_olive_tall", "larch_olive_small"]),
    ]
    for tsheet, bsheet, names in sheets:
        T = remove_ground(load(tsheet))
        B = clear_palette(remove_ground(load(bsheet)))
        for i, (x0, w) in enumerate(tree_cols):
            tree = T.crop((x0, 0, x0 + w, 128))  # y=120 is the trunk base
            canvas = Image.new("RGBA", (64, 128))
            canvas.alpha_composite(tree, ((64 - w) // 2, 0))
            save(canvas, "tree_" + names[i], "tree")
            bx0 = i * 64
            for r, bname in enumerate(base_names):
                block = B.crop((bx0, r * 64, bx0 + 64, r * 64 + 64))
                var = canvas.copy()
                # tree bottom half (y 64..128) is replaced by the decorated base
                clear = Image.new("RGBA", (64, 64))
                var.paste(clear, (0, 64))
                var.alpha_composite(block, (0, 64))
                save(var, f"tree_{names[i]}_{bname}", "tree")

    # ---------------- giant tree ----------------
    giant = remove_ground(load("tree_autumn_giant.png"))
    save(giant, "tree_autumn_giant", "tree")

    # ---------------- bushes ----------------
    g1 = remove_ground(load("grass_autumn_1.png"))
    for i, n in enumerate(["red", "amber", "tan", "olive"]):
        save(g1.crop((i * 32, 0, i * 32 + 32, 64)), f"bush_spiky_{n}", "bush")
    g2 = remove_ground(load("grass_autumn_2.png"))
    for i, n in enumerate(["red", "amber"]):
        save(g2.crop((i * 64, 0, i * 64 + 64, 64)), f"bush_spiky_big_{n}", "bush")

    # ---------------- flower decals, rocks, leaf pile ----------------
    fl = clear_palette(remove_ground(load("flowers_autumn.png")))
    for i, n in enumerate(["pink", "red", "white", "blue"]):
        save(fl.crop((i * 32, 0, i * 32 + 32, 32)), f"flower_vine_{n}", "decal", "tile")
    rk = clear_palette(remove_ground(load("rocks_autumn.png")))
    for i, n in enumerate(["grey", "brown"]):
        save(rk.crop((i * 32, 0, i * 32 + 32, 32)), f"rocks_{n}_cluster", "decal", "tile")
    leaf = clear_palette(remove_ground(load("leaves_fallen_autumn.png")))
    save(leaf, "leaf_pile_red_big", "decal", "tile")

    # ---------------- lily pads: connected components ----------------
    lily = load("water_lilies_autumn.png")
    boxes = sorted(components(lily, 128), key=lambda b: -(b[2] - b[0]) * (b[3] - b[1]))
    names = ["lotus", "pad_big", "pad_medium", "pad_small_1", "pad_small_2", "pad_small_3"]
    for n, (x0, y0, x1, y1) in zip(names, boxes):
        save(lily.crop((x0 - 1 if x0 else 0, y0 - 1 if y0 else 0, min(64, x1 + 1), min(64, y1 + 1))), f"lily_{n}", "water", "center")

    # ---------------- ground decals (24 cells) ----------------
    decor = clear_palette(remove_ground(load("ground_decor_autumn.png")))
    cell_names = {
        (0, 1): "mushroom_tan", (0, 2): "mushroom_red_cluster", (0, 3): "grass_red_tuft",
        (0, 4): "grass_dry", (0, 5): "flower_white_cluster", (0, 6): "flowerbed_red",
        (0, 7): "flowerbed_red_white", (1, 0): "stump_autumn", (1, 1): "mushroom_red_pair",
        (1, 2): "mushroom_red_single", (1, 3): "flower_orange_patch", (1, 6): "flowerbed_red_pink",
        (1, 7): "flowerbed_red_lilac", (2, 0): "roots_curved_1", (2, 1): "roots_curved_2",
        (2, 2): "grass_red_blue", (2, 3): "grass_red_white", (2, 4): "rock_mossy_pile",
        (2, 5): "leaf_fragments_red", (2, 6): "rock_brown", (2, 7): "leaf_pile_red",
    }
    for (r, c), n in cell_names.items():
        cell = decor.crop((c * 32, r * 32, c * 32 + 32, r * 32 + 32))
        assert any_bbox(cell) is not None, f"decor cell {r},{c} empty"
        save(cell, "decor_" + n, "decal", "tile")

    with open(os.path.join(SRC, "catalog.json"), "w", encoding="utf-8") as f:
        json.dump(CATALOG, f, indent=1)
    print(f"wrote {len(CATALOG)} sprites to {OUT}")


if __name__ == "__main__":
    main()
