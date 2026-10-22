import json
import os

manifest_path = r"e:\Pokemon\apps\web\public\assets\manifest.json"
snow_dir = r"e:\Pokemon\apps\web\public\assets\biomes\snow"
arch_dir = r"e:\Pokemon\apps\web\public\assets\biomes\snow\architecture"
roads_dir = r"e:\Pokemon\apps\web\public\assets\biomes\snow\roads"

with open(manifest_path, "r", encoding="utf-8") as f:
    manifest = json.load(f)

# Clean out any old/stale snow asset keys
keys_to_delete = [k for k, v in manifest.items() if isinstance(v, str) and v.startswith("/assets/biomes/snow/")]
for k in keys_to_delete:
    del manifest[k]

# 1. Main snow biome assets
for filename in sorted(os.listdir(snow_dir)):
    if filename.endswith(".png"):
        key = filename[:-4]
        rel_path = f"/assets/biomes/snow/{filename}"
        manifest[key] = rel_path

# 2. Snow architecture
if os.path.exists(arch_dir):
    for filename in sorted(os.listdir(arch_dir)):
        if filename.endswith(".png"):
            key = filename[:-4]
            rel_path = f"/assets/biomes/snow/architecture/{filename}"
            manifest[key] = rel_path

# 3. Snow roads
if os.path.exists(roads_dir):
    for filename in sorted(os.listdir(roads_dir)):
        if filename.endswith(".png"):
            key = filename[:-4]
            rel_path = f"/assets/biomes/snow/roads/{filename}"
            manifest[key] = rel_path

with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

print(f"Manifest cleanly updated. Total keys: {len(manifest)}")
