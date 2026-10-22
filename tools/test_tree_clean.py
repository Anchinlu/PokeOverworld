import os
from PIL import Image
import numpy as np
from collections import deque

p = 'tools/sources/snow/cây vùng băng tuyết.png'
im = Image.open(p).convert("RGBA")
tree0 = im.crop((0, 0, 64, 128))
arr = np.array(tree0)
h, w = arr.shape[:2]

GROUND = {
    (237, 248, 249),
    (211, 239, 250),
    (160, 213, 232),
    (167, 175, 176),
    (147, 168, 176),
    (122, 176, 206),
    (112, 149, 163),
}

visited = np.zeros((h, w), dtype=bool)
q = deque()

# Seeds strictly from bottom row and bottom side borders:
seeds = [(h - 1, x) for x in range(w)]
seeds += [(y, 0) for y in range(64, h)]
seeds += [(y, w - 1) for y in range(64, h)]

for y, x in seeds:
    c = tuple(arr[y, x][:3])
    if c in GROUND:
        visited[y, x] = True
        q.append((y, x))

while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        ny, nx = y + dy, x + dx
        if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
            c = tuple(arr[ny, nx][:3])
            if c in GROUND:
                visited[ny, nx] = True
                q.append((ny, nx))

out = arr.copy()
for y in range(h):
    for x in range(w):
        if visited[y, x]:
            out[y, x] = (0, 0, 0, 0)

res = Image.fromarray(out, "RGBA")
res.save('apps/web/public/assets/biomes/snow/test_cutouts/tree0_perfect.png')
print("Saved tree0_perfect.png successfully!")
