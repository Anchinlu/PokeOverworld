"""
Tileset Cropper & Extractor for Pokemon Overworld
Supports automatic extraction of buildings, nature assets, props, and tiles.
"""

import os
import sys
from PIL import Image
import numpy as np

def extract_tileset(image_path: str, output_dir: str, tile_size: int = 32):
    os.makedirs(output_dir, exist_ok=True)
    subdirs = {
        'buildings': os.path.join(output_dir, 'buildings'),
        'nature': os.path.join(output_dir, 'nature'),
        'props': os.path.join(output_dir, 'props'),
        'terrain': os.path.join(output_dir, 'terrain')
    }
    for sd in subdirs.values():
        os.makedirs(sd, exist_ok=True)

    img = Image.open(image_path).convert('RGBA')
    w, h = img.size
    print(f"Loaded image: {image_path} ({w}x{h})")

    # If the image is standard 256px wide (8 columns of 32px or 16 columns of 16px)
    # We can detect connected components or slice standard chunks
    arr = np.array(img)
    alpha = arr[:, :, 3] > 10

    # BFS connected component detection
    visited = np.zeros_like(alpha, dtype=bool)
    components = []

    for y in range(h):
        for x in range(w):
            if alpha[y, x] and not visited[y, x]:
                q = [(y, x)]
                visited[y, x] = True
                min_y, max_y = y, y
                min_x, max_x = x, x
                count = 0
                while q:
                    cy, cx = q.pop()
                    count += 1
                    min_y = min(min_y, cy)
                    max_y = max(max_y, cy)
                    min_x = min(min_x, cx)
                    max_x = max(max_x, cx)
                    for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < h and 0 <= nx < w and alpha[ny, nx] and not visited[ny, nx]:
                            visited[ny, nx] = True
                            q.append((ny, nx))
                if count >= 16:  # ignore tiny noise
                    components.append((min_x, min_y, max_x + 1, max_y + 1, count))

    # Sort components by Y coordinate
    components.sort(key=lambda c: (c[1], c[0]))
    print(f"Identified {len(components)} distinct objects.")

    catalog = []
    for idx, (x1, y1, x2, y2, cnt) in enumerate(components):
        cw = x2 - x1
        ch = y2 - y1
        cropped = img.crop((x1, y1, x2, y2))

        # Categorize by size and position
        if ch >= 60 and cw >= 48:
            cat = 'buildings'
            prefix = 'building'
        elif ch >= 40 and cw <= 48:
            cat = 'nature'
            prefix = 'tree_or_plant'
        elif cw <= 40 and ch <= 40:
            cat = 'props'
            prefix = 'prop'
        else:
            cat = 'props'
            prefix = 'object'

        filename = f"{prefix}_{idx:02d}_{cw}x{ch}.png"
        target_path = os.path.join(subdirs[cat], filename)
        cropped.save(target_path)
        catalog.append({
            'id': idx,
            'category': cat,
            'name': filename,
            'path': target_path,
            'rel_path': f"{cat}/{filename}",
            'width': cw,
            'height': ch,
            'bbox': (x1, y1, x2, y2)
        })

    # Generate an HTML gallery / review page
    html_path = os.path.join(output_dir, 'catalog.html')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write("""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Tileset Asset Extraction Catalog</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #121824; color: #fff; padding: 20px; }
h1 { color: #60a5fa; }
h2 { color: #93c5fd; border-bottom: 1px solid #374151; padding-bottom: 6px; margin-top: 24px; }
.grid { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 12px; }
.card { background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; align-items: center; min-width: 140px; }
.card img { background: repeating-conic-gradient(#2a3447 0% 25%, #1e2638 0% 50%) 50% / 16px 16px; image-rendering: pixelated; border: 1px solid #4b5563; border-radius: 4px; margin-bottom: 8px; max-height: 120px; }
.label { font-size: 12px; color: #9ca3af; text-align: center; }
.size { font-size: 11px; color: #34d399; font-weight: bold; margin-top: 4px; }
</style>
</head>
<body>
<h1>Tileset Asset Extraction Catalog</h1>
<p>Total extracted components: """ + str(len(catalog)) + """</p>
""")
        for cat_name in ['buildings', 'nature', 'props', 'terrain']:
            cat_items = [c for c in catalog if c['category'] == cat_name]
            if cat_items:
                f.write(f"<h2>{cat_name.upper()} ({len(cat_items)})</h2>\n<div class='grid'>\n")
                for item in cat_items:
                    f.write(f"""<div class='card'>
<img src='{item['rel_path']}' alt='{item['name']}'/>
<span class='label'>{item['name']}</span>
<span class='size'>{item['width']}x{item['height']} px</span>
</div>\n""")
                f.write("</div>\n")
        f.write("</body></html>")

    print(f"Extraction complete! Catalog written to {html_path}")
    return catalog

if __name__ == '__main__':
    src = sys.argv[1] if len(sys.argv) > 1 else r'C:\Users\lctan\.gemini\antigravity-ide\brain\531f914a-f71b-4549-bce0-d98504f09da3\.user_uploaded\media_1790988998264.png'
    out = sys.argv[2] if len(sys.argv) > 2 else r'e:\Pokemon\Graphics\Tilesets\Extracted_Assets'
    extract_tileset(src, out)
