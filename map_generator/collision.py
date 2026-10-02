"""
Collision Management Module
Computes physical bounding boxes for obstacle collision detection (tree trunks, water, boundaries).
"""

from typing import List, Dict, Tuple


def build_tree_colliders(tree_placements: List[Tuple[int, int, any]]) -> List[Dict[str, int]]:
    """
    Builds trunk colliders for all placed trees.
    Collider box is localized to the lower trunk and base: (x + 14, y + 90, w=36, h=26).
    """
    colliders = []
    for tx, ty, _ in tree_placements:
        colliders.append({
            "x": tx + 14,
            "y": ty + 90,
            "w": 36,
            "h": 26,
            "type": "tree_trunk"
        })
    return colliders


def check_collision(x: int, y: int, w: int, h: int, colliders: List[Dict[str, int]]) -> bool:
    """Checks if bounding box (x, y, w, h) intersects with any collider."""
    for c in colliders:
        if (x < c["x"] + c["w"] and
            x + w > c["x"] and
            y < c["y"] + c["h"] and
            y + h > c["y"]):
            return True
    return False
