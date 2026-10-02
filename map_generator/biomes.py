"""
Biome Configuration and Resolver Module
Defines ecosystem biomes, tree color palettes, and environmental conditions.
"""

from typing import Dict, Any

BIOME_MIXED = "mixed"
BIOME_ROUTE = "route"
BIOME_COASTAL = "coastal"
BIOME_AUTUMN = "autumn"
BIOME_FOREST = "forest"

AVAILABLE_BIOMES = [BIOME_MIXED, BIOME_ROUTE, BIOME_COASTAL, BIOME_AUTUMN, BIOME_FOREST]

BIOME_CONFIGS: Dict[str, Dict[str, Any]] = {
    BIOME_MIXED: {
        "name": "Mixed Route & Coastal Cove",
        "has_beach": True,
        "has_road": True,
        "default_tree": "vibrant",
        "description": "Standard route featuring meadows, winding dirt roads, and a coastal sandy cove."
    },
    BIOME_ROUTE: {
        "name": "Inland Forest Route",
        "has_beach": False,
        "has_road": True,
        "default_tree": "vibrant",
        "description": "Dense inland forest path with deep green woodland trees."
    },
    BIOME_COASTAL: {
        "name": "Coastal Shoreline",
        "has_beach": True,
        "has_road": True,
        "default_tree": "coastal",
        "description": "Seaside route with coastal teal trees along the sandy beach."
    },
    BIOME_AUTUMN: {
        "name": "Autumn Ochre Valley",
        "has_beach": False,
        "has_road": True,
        "default_tree": "autumn",
        "description": "Golden autumn woodland with ochre trees and country roads."
    },
    BIOME_FOREST: {
        "name": "Deep Forest Sanctuary",
        "has_beach": False,
        "has_road": True,
        "default_tree": "deep",
        "description": "Dense, shaded forest with deep emerald foliage."
    }
}


def resolve_tree_type(biome: str, root_c: int, root_r: int, rows: int, near_beach: bool, rng_val: float) -> str:
    """Determines tree color/species according to ecosystem geography rules."""
    if near_beach:
        return "coastal"
    if biome == BIOME_AUTUMN or (biome == BIOME_MIXED and root_c < 6 and root_r > rows - 6):
        return "autumn"
    if biome == BIOME_FOREST:
        return "deep"
    if biome == BIOME_ROUTE:
        return "deep" if rng_val < 0.4 else "vibrant"
    return "vibrant" if rng_val < 0.75 else "autumn"
