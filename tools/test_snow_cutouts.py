import os
from PIL import Image
import numpy as np
from snow_lib import remove_snow_ground, clear_snow_palette

src_dir = 'tools/sources/snow'
out_test = 'apps/web/public/assets/biomes/snow/test_cutouts'
os.makedirs(out_test, exist_ok=True)

# Test 1: Tree 0
tree_im = Image.open(os.path.join(src_dir, 'cây vùng băng tuyết.png')).convert("RGBA")
tree0 = tree_im.crop((0, 0, 64, 128))
cleaned_tree0 = remove_snow_ground(tree0, allow_shadow=True)
cleaned_tree0.save(os.path.join(out_test, 'tree0_cleaned.png'))

# Test 2: Wide bush
flora1 = Image.open(os.path.join(src_dir, 'biến thể thực vật vùng băng tuyết.png')).convert("RGBA")
bush_wide = flora1.crop((128, 0, 192, 64))
cleaned_bush = remove_snow_ground(bush_wide, allow_shadow=True)
cleaned_bush.save(os.path.join(out_test, 'bush_wide_cleaned.png'))

# Test 3: Rock 0 (top-left 32x32 of đá sỏi)
rocks = Image.open(os.path.join(src_dir, 'đá sỏi vùng băng tuyết.png')).convert("RGBA")
rock0 = rocks.crop((0, 0, 32, 32))
cleaned_rock0 = remove_snow_ground(rock0, allow_shadow=True)
cleaned_rock0.save(os.path.join(out_test, 'rock0_cleaned.png'))

# Test 4: Log 0 (0..32 of khúc gỗ)
wood = Image.open(os.path.join(src_dir, 'khúc gỗ và thân gỗ bị chặc.png')).convert("RGBA")
log0 = wood.crop((0, 0, 32, 32))
cleaned_log0 = remove_snow_ground(log0, allow_shadow=True)
cleaned_log0.save(os.path.join(out_test, 'log0_cleaned.png'))

print("Saved test cutouts successfully!")
