import os
from PIL import Image
import numpy as np

src_dir = 'tools/sources/snow'

def inspect(name):
    p = os.path.join(src_dir, name)
    im = Image.open(p).convert("RGBA")
    arr = np.array(im)
    print(f"=== {name} ({im.size}) ===")
    # non-zero alpha pixels
    non_zero = arr[arr[:, :, 3] > 0]
    if len(non_zero) > 0:
        unique_colors, counts = np.unique(non_zero[:, :3], axis=0, return_counts=True)
        top_indices = np.argsort(counts)[-8:][::-1]
        print("  Top colors:")
        for idx in top_indices:
            print(f"    RGB {unique_colors[idx]}: {counts[idx]} px")
    print(f"  Alpha min={arr[:, :, 3].min()}, max={arr[:, :, 3].max()}")

inspect("đồi cao vùng băng tuyết.png")
inspect("cỏ ranh giới vùng băng tuyết.png")
inspect("biến thể thực vật vùng băng tuyết.png")
inspect("biến thể thực vật vùng băng tuyết 2.png")
inspect("bụi cây vùng băng tuyết.png")
inspect("cây vùng băng tuyết.png")
inspect("cây vùng băng tuyết 2.png")
inspect("biến thể đất cỏ vùng băng tuyết bị đóng băng.png")
inspect("bổ sùng đường cong đồi cao vùng băng tuyết.png")
inspect("đá sỏi vùng băng tuyết.png")
