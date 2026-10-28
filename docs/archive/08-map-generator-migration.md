# 08. Kế hoạch tách map generator

# 08. Kế hoạch tách map generator

## Trạng thái

Đã hoàn thành.

## Mục tiêu

Tách `map_generator.py` nguyên khối thành package `map_generator/` gồm các module chuyên biệt, dễ test, dễ tái sử dụng và bảo đảm tương thích ngược 100%.

## Module đã triển khai

```text
map_generator/
  ├── __init__.py      # Package export (PokemonMapGenerator, Terrain constants, TILE_IDS)
  ├── terrain.py       # Hằng số Terrain ID (1-4) & lớp TerrainGrid
  ├── tiles.py         # Registry TILE_IDS & TileManager nạp asset ảnh
  ├── biomes.py        # Cấu hình 5 biomes (mixed, route, coastal, autumn, forest) & bộ giải màu cây
  ├── roads.py         # Thuật toán sinh đường mòn 3 ô, khớp góc Turn 1, Turn 2 & bo tròn điểm cuối
  ├── beaches.py       # Bờ biển uốn lượn liên tục (|b[r]-b[r-1]| <= 1) & autotile 13 tile chuẩn
  ├── trees.py         # Kiểm tra an toàn sinh thái (cấm mọc trên đường/cát), Barrier Forest, Y-sorting
  ├── collision.py     # Tạo hộp va chạm chân gốc cây (36x26 px) & hàm check_collision
  ├── renderer.py      # Render phân tầng (Cỏ, Cát, Đường, Bóng, Nhân vật, Cây 2.5D)
  ├── generator.py     # Lớp điều phối chính PokemonMapGenerator
  └── cli.py           # Giao diện dòng lệnh argparse & batch generation
```

## Luồng xử lý

```text
Seed -> Terrain grid -> Roads/beach -> Tile selection -> Trees -> Collision -> Render/export
```

## Yêu cầu bảo toàn đã kiểm chứng (100% Passed)

- [x] Bảo toàn toàn bộ bộ mã Terrain ID (`GRASS: 1`, `ROAD: 2`, `BEACH: 3`, `OCEAN: 4`).
- [x] Quy tắc sinh thái: Tuyệt đối không sinh cây trên đường đi (ruột + mép) và bãi cát biển.
- [x] Chuẩn kích thước lưới 32×32 pixel.
- [x] Tính deterministic: Cùng seed cho ra 100% dữ liệu mảng và byte ảnh PNG đồng nhất.
- [x] File `map_generator.py` ở root đóng vai trò Facade tương thích ngược hoàn toàn.
- [x] Bộ unit test tự động tại `tests/test_map_generator.py` (5/5 tests OK).
