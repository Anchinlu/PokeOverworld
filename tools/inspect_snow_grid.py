import os
from PIL import Image
import numpy as np

src_dir = 'tools/sources/snow'

def inspect_grid(name, cell_w=32, cell_h=32):
    p = os.path.join(src_dir, name)
    im = Image.open(p).convert("RGBA")
    arr = np.array(im)
    w, h = im.size
    cols = w // cell_w
    rows = h // cell_h
    print(f"=== {name} {w}x{h} ({cols} cols x {rows} rows) ===")
    for r in range(rows):
        row_str = []
        for c in range(cols):
            cell = arr[r*cell_h:(r+1)*cell_h, c*cell_w:(c+1)*cell_w]
            opaque_count = np.sum(cell[:, :, 3] > 0)
            fully_opaque = np.sum(cell[:, :, 3] == 255)
            row_str.append(f"c{c}: op={opaque_count}/1024 (full={fully_opaque})")
        print(f"  Row {r}: " + " | ".join(row_str))

inspect_grid("đồi cao vùng băng tuyết.png", 32, 32)
inspect_grid("cỏ ranh giới vùng băng tuyết.png", 32, 32)
inspect_grid("biến thể đất cỏ vùng băng tuyết bị đóng băng.png", 32, 32)
inspect_grid("biến thể thực vật vùng băng tuyết.png", 32, 64)
inspect_grid("biến thể thực vật vùng băng tuyết 2.png", 32, 64)
inspect_grid("đá sỏi vùng băng tuyết.png", 32, 32)
inspect_grid("khúc gỗ và thân gỗ bị chặc.png", 32, 32)
inspect_grid("biến thể cỏ trang trí vùng băng tuyết.png", 32, 32)
inspect_grid("biến thể trang trí đất vùng băng tuyết.png", 32, 32)
