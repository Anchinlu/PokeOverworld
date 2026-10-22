"""Helpers for extracting Snow Biome sprites from the source sheets.

Modeled after autumn_lib.py:
The source sheets have the snow ground baked into the sprites. The ground
uses three colours (from the center of the high hill block: (237, 248, 249),
(211, 239, 250), (160, 213, 232)). By flood-filling from the sheet border
through ground and shadow-like pixels, the ground can be cleanly removed
without leaking into the sprite bodies because of dark/distinct outlines.
"""
from collections import deque
import numpy as np
from PIL import Image

# Exact ground palette from the plateau interior (32, 32, 64, 64) of đồi cao vùng băng tuyết.png
SNOW_GROUND = {
    (237, 248, 249),
    (211, 239, 250),
    (160, 213, 232),
}

# Ground-tinted shadow & edge colors in snow
SNOW_SHADOWS = {
    (167, 175, 176),
    (147, 168, 176),
    (122, 176, 206),
    (112, 149, 163),
    (189, 211, 220),
}


def _is_snow_ground(r, g, b):
    return (r, g, b) in SNOW_GROUND or (r, g, b) in SNOW_SHADOWS


def remove_snow_ground(img, seeds=None, allow_shadow=False, tolerance=15):
    """Return RGBA copy with the baked snow ground removed (flood fill from border).
    
    Ground -> transparent (0, 0, 0, 0).
    When allow_shadow=False, all foliage and body pixels remain 100% opaque.
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
        if _is_snow_ground(r, g, b):
            return True
        # Check near-ground snow tint (very high brightness, pale blue-cyan)
        if r >= 200 and g >= 230 and b >= 240:
            return True
        # Shadow tint under objects on snow
        if allow_shadow and 110 <= r <= 180 and 140 <= g <= 180 and 160 <= b <= 210:
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
            if visited[y, x]:
                out[y, x] = (0, 0, 0, 0)

    return Image.fromarray(out, "RGBA")


def clear_snow_palette(img):
    """Also clear enclosed exact-ground-colour pixels (for flat decals)."""
    arr = np.array(img.convert("RGBA"))
    for r, g, b in SNOW_GROUND:
        m = (arr[:, :, 0] == r) & (arr[:, :, 1] == g) & (arr[:, :, 2] == b) & (arr[:, :, 3] > 0)
        arr[m] = (0, 0, 0, 0)
    return Image.fromarray(arr, "RGBA")


def opaque_bbox(img, min_alpha=200):
    a = np.array(img.convert("RGBA"))[:, :, 3]
    ys, xs = np.where(a >= min_alpha)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max() + 1), int(ys.max() + 1)
