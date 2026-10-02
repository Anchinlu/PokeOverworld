"""
Command Line Interface for Pokemon Procedural Map Generator
"""

import os
import sys
import argparse
from PIL import Image

from .generator import PokemonMapGenerator
from .biomes import AVAILABLE_BIOMES


def parse_args():
    parser = argparse.ArgumentParser(description="Pokemon Procedural Map Generator Engine with ID System")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for generation")
    parser.add_argument("--cols", type=int, default=24, help="Map width in tiles (default 24 = 768px)")
    parser.add_argument("--rows", type=int, default=18, help="Map height in tiles (default 18 = 576px)")
    parser.add_argument("--biome", type=str, default="mixed", choices=AVAILABLE_BIOMES, help="Ecosystem biome")
    parser.add_argument("--output", type=str, default=None, help="Output PNG file path")
    return parser.parse_args()


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    args = parse_args()
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    gen = PokemonMapGenerator(base_dir=base_dir)

    if args.output:
        img, _, _ = gen.generate_map(seed=args.seed, cols=args.cols, rows=args.rows, biome=args.biome)
        img.save(args.output)
        print(f"Generated map saved to: {args.output}")
    else:
        seeds = [
            (101, "mixed", "generated_map_seed_101.png", "Mixed Route (Strict Beach Sand ID - No Trees on Sand)"),
            (202, "route", "generated_map_seed_202.png", "Inland Route (Deep Forest + Meadow Path)"),
            (303, "autumn", "generated_map_seed_303.png", "Autumn Valley (Golden Trees + Winding Road)"),
        ]
        for s, b, out_name, desc in seeds:
            out_path = os.path.join(base_dir, out_name)
            out_2x = os.path.join(base_dir, out_name.replace(".png", "_2x.png"))
            img, _, _ = gen.generate_map(seed=s, cols=args.cols, rows=args.rows, biome=b)
            img.save(out_path)
            img.resize((img.width * 2, img.height * 2), Image.NEAREST).save(out_2x)
            print(f"Generated {desc}: {out_path} ({img.width}x{img.height})")


if __name__ == "__main__":
    main()
