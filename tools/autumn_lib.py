"""Helpers for extracting Autumn Forest sprites from the source sheets.

The source sheets have the golden ground *baked into* the sprites. The ground
uses exactly three colours (taken from the middle of the high-hill block, the
same way the other biomes derive their ground tile), so it can be removed by
flood-filling from the sheet border through ground/shadow-like pixels. Sprite
outlines are dark, so the fill never leaks into the object bodies.
"""
import colorsys
from collections import deque

import numpy as np
from PIL import Image

# Exact ground palette = colours of the plateau interior tile of the hill block.
GROUND = {(225, 170, 85), (234, 185, 91), (219, 159, 83)}
SHADOW_COLOR = (48, 28, 12)
GROUND_V = 0.89  # value of a lit ground pixel


def _is_ground(r, g, b):
    return (r, g, b) in GROUND


def _shadow_alpha(r, g, b):
    """Ground-tinted shadow (same hue/saturation as ground, darker). Returns
    alpha 0..255 for the shadow overlay, or None when not shadow-like."""
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    h *= 360
    if 30 <= h <= 44 and 0.40 <= s <= 0.72 and v < GROUND_V + 0.02:
        return int(max(0.0, min(1.0, (GROUND_V - v) * 1.15)) * 255)
    return None


def remove_ground(img, seeds=None, allow_shadow=False):
    """Return RGBA copy with the baked ground removed (flood fill from border).

    Ground -> transparent.
    When allow_shadow=False (default for trees, bushes, sprites), all foliage and body
    pixels remain 100% opaque, preventing any ghostly translucency.
    """
    im = img.convert("RGBA")
    arr = np.array(im)
    h, w = arr.shape[:2]
    visited = np.zeros((h, w), dtype=bool)
    q = deque()

    def passable(y, x):
        r, g, b, a = arr[y, x]
        if a == 0:
            return True
        if _is_ground(r, g, b):
            return True
        if allow_shadow and _shadow_alpha(r, g, b) is not None:
            return True
        return False

    border = [(0, x) for x in range(w)] + [(h - 1, x) for x in range(w)]
    border += [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)]
    for y, x in (seeds or border):
        if not visited[y, x] and passable(y, x):
            visited[y, x] = True
            q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and passable(ny, nx):
                visited[ny, nx] = True
                q.append((ny, nx))

    out = arr.copy()
    for y in range(h):
        for x in range(w):
            if not visited[y, x]:
                continue
            r, g, b, a = arr[y, x]
            if a == 0 or _is_ground(r, g, b) or not allow_shadow:
                out[y, x] = (0, 0, 0, 0)
            else:
                sa = _shadow_alpha(r, g, b)
                out[y, x] = (*SHADOW_COLOR, sa if sa else 0)
    return Image.fromarray(out, "RGBA")


def opaque_bbox(img, min_alpha=200):
    a = np.array(img.convert("RGBA"))[:, :, 3]
    ys, xs = np.where(a >= min_alpha)
    if len(xs) == 0:
        return None
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def any_bbox(img):
    a = np.array(img.convert("RGBA"))[:, :, 3]
    ys, xs = np.where(a > 0)
    if len(xs) == 0:
        return None
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def components(img, min_alpha=200):
    """Connected components (8-neighbour) of opaque pixels -> list of bboxes."""
    a = np.array(img.convert("RGBA"))[:, :, 3] >= min_alpha
    h, w = a.shape
    seen = np.zeros_like(a, dtype=bool)
    boxes = []
    for sy in range(h):
        for sx in range(w):
            if a[sy, sx] and not seen[sy, sx]:
                q = deque([(sy, sx)])
                seen[sy, sx] = True
                x0 = x1 = sx
                y0 = y1 = sy
                while q:
                    y, x = q.popleft()
                    x0, x1, y0, y1 = min(x0, x), max(x1, x), min(y0, y), max(y1, y)
                    for dy in (-1, 0, 1):
                        for dx in (-1, 0, 1):
                            ny, nx = y + dy, x + dx
                            if 0 <= ny < h and 0 <= nx < w and a[ny, nx] and not seen[ny, nx]:
                                seen[ny, nx] = True
                                q.append((ny, nx))
                boxes.append((x0, y0, x1 + 1, y1 + 1))
    return boxes


def preview_on(img, bg=(234, 185, 91), scale=4):
    base = Image.new("RGBA", img.size, bg + (255,))
    base.alpha_composite(img.convert("RGBA"))
    return base.resize((img.width * scale, img.height * scale), Image.NEAREST)
