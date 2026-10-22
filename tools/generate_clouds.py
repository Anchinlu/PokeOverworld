"""Generate natural seamless cloud shadow assets for the overworld weather system.

Outputs:
  - apps/web/public/assets/weather/cloud_shadow.png: 1024x1024 seamless soft charcoal ground shadow
  - apps/web/public/assets/weather/cloud_sky.png: 1024x1024 seamless soft sky cloud (fallback)
"""
import os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'apps', 'web', 'public', 'assets', 'weather')
os.makedirs(OUT, exist_ok=True)

W, H = 1024, 1024
x = np.linspace(0, 2 * np.pi, W, endpoint=False)
y = np.linspace(0, 2 * np.pi, H, endpoint=False)
X, Y = np.meshgrid(x, y)

# Periodic integer harmonics for 100% mathematical seamlessness
field = np.zeros((H, W), dtype=np.float32)
harmonics = [
    (1, 1, 1.3, 0.4, 1.1),
    (2, 1, 0.9, 2.1, 0.7),
    (1, 2, 0.8, 1.3, 2.4),
    (2, 2, 0.7, 0.8, 1.9),
    (3, 2, 0.5, 2.5, 0.3),
    (2, 3, 0.4, 1.7, 2.8),
    (3, 3, 0.35, 0.2, 1.5),
    (4, 3, 0.25, 2.9, 0.8),
    (3, 4, 0.25, 1.1, 2.2),
    (5, 4, 0.18, 0.6, 1.4),
    (4, 5, 0.18, 2.3, 0.5),
    (6, 6, 0.12, 1.8, 2.7),
    (8, 8, 0.08, 0.5, 1.2),
]

for kx, ky, weight, px, py in harmonics:
    field += weight * (np.sin(kx * X + px) * np.cos(ky * Y + py))

norm = (field - field.min()) / (field.max() - field.min())

# Solid cumulus body with feathered boundary transition
thresh_low = 0.60
thresh_high = 0.68
val = np.clip((norm - thresh_low) / (thresh_high - thresh_low), 0.0, 1.0)
alpha = val * val * (3.0 - 2.0 * val)

# 1. Shadow: warm dark charcoal #141822
rgba_shadow = np.zeros((H, W, 4), dtype=np.uint8)
rgba_shadow[:, :, 0] = 20
rgba_shadow[:, :, 1] = 24
rgba_shadow[:, :, 2] = 34
rgba_shadow[:, :, 3] = (alpha * 255).astype(np.uint8)
Image.fromarray(rgba_shadow, 'RGBA').save(os.path.join(OUT, 'cloud_shadow.png'))

# 2. Sky: soft white
rgba_sky = np.zeros((H, W, 4), dtype=np.uint8)
rgba_sky[:, :, 0] = 255
rgba_sky[:, :, 1] = 255
rgba_sky[:, :, 2] = 255
rgba_sky[:, :, 3] = (alpha * 255).astype(np.uint8)
Image.fromarray(rgba_sky, 'RGBA').save(os.path.join(OUT, 'cloud_sky.png'))

print(f'Successfully generated 1024x1024 solid-body cloud assets in {OUT}')
