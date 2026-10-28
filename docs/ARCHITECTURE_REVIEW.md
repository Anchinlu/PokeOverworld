# Ghi chú kiến trúc — Registry, Cache, Asset Loading và Water Semantics

> Cập nhật: 2026-10-23

Tài liệu này ghi lại các quyết định và giới hạn cần nhớ sau đợt refactor hệ
thống overworld. Đây là tài liệu tham chiếu trước khi thêm biome, asset hoặc
logic gameplay liên quan đến nước.

## 1. Đã hoàn thành

### Data-driven biome/entity registry

`apps/web/src/maps/biome-entity-registry.ts` là nguồn cấu hình chung cho:

- phân loại tile phục vụ render;
- nền đất dưới cỏ cao;
- decal mặt đất theo biome;
- kích thước, layer, y-sort, collider và animation của plant;
- kích thước, asset và bóng của tree.

Renderer và bộ sinh object không được thêm lại các nhánh `if/else` theo biome
nếu quy tắc có thể khai báo trong registry.

Khi thêm biome mới, ưu tiên cập nhật registry và test registry trước; chỉ sửa
renderer khi xuất hiện một loại layer hoàn toàn mới.

### Cache có giới hạn

Các cache cấp module hiện có giới hạn để không tăng vô hạn khi người chơi đi xa:

| Cache | Giới hạn | Dọn khi đổi world |
|---|---:|---|
| Tree locations | 512 chunk | Có, qua `clearChunkObjectsCache()` |
| Settlement region | 256 vùng | Bounded eviction |
| V4 settlement worlds | 32 world | Bounded eviction |
| Lake placement | 1024 ô lưới | Bounded eviction |

Lưu ý: tree cache có hành vi LRU rõ ràng. Settlement và lake cache hiện chỉ
bounded theo thứ tự chèn (FIFO), chưa phải LRU đầy đủ. Không được mô tả chúng
là LRU nếu chưa thêm thao tác đưa key vừa truy cập lên cuối Map.

### Asset loading hai giai đoạn

`AssetLoader.loadFromManifest(..., { deferBackgroundBiomes: true })`:

1. Chờ nhóm asset critical trước khi mở thế giới.
2. Tải nền asset của `desert`, `dark-land`, `autumn`, `snow`.
3. Khi nhóm nền hoàn tất, thông báo cho `GroundRenderer` để xóa ground cache và
   bake lại texture đã có asset đầy đủ.

Không được giả định `isLoaded()` đồng nghĩa với mọi asset đã hoàn tất khi chế độ
defer đang bật; nó chỉ xác nhận nhóm critical đã sẵn sàng.

### Phân loại tile nước và cầu

Các helper dùng chung trong `packages/game-data/constants.ts` gồm:

- `isFreshwaterTile()`;
- `isBridgeTile()`;
- `isOceanOrShoreTile()`;
- `isAnimatedWaterOrShoreTile()`.

Các helper này giải quyết phân loại tile cho render, animation và autotile.

## 2. Giới hạn còn tồn tại cần nhớ

### `TERRAIN.OCEAN_WATER` vẫn dùng chung cho mọi mặt nước

Trong `chunk-terrain.ts`, đại dương và sông/hồ vẫn cùng nhận
`TERRAIN.OCEAN_WATER`. Vì vậy helper tile không đồng nghĩa với việc gameplay đã
phân biệt được biển, sông và hồ.

Trước khi triển khai câu cá, Pokémon nước, băng hóa hoặc luật bơi riêng, cần
chọn một trong hai hướng:

1. Bổ sung `waterKind: 'ocean' | 'river' | 'lake'` vào `TileData` và/hoặc
   `waterKindGrid`; đây là hướng ưu tiên vì không phá enum terrain hiện tại.
2. Tạo các `TerrainId` nước riêng, chỉ khi chấp nhận cập nhật toàn bộ renderer,
   minimap, collision, debug, test và parity dữ liệu.

Không dùng khoảng `tileId` rải rác trong gameplay để thay thế cho semantic
`waterKind`.

### Registry phải là nguồn duy nhất

Các khoảng tile ID và tiền tố asset còn lại phải được chuyển dần vào registry.
Không tạo thêm bản sao phân loại trong `ground-renderer.ts`, `object-renderer.ts`,
`chunk.ts` hoặc minimap.

### Trạng thái kiểm định hiện tại

- Registry test: 5/5 pass.
- TypeScript typecheck: pass, 0 lỗi.
- ESLint: 0 lỗi nhưng còn 9 warning ở test/script cũ.
- Chưa coi pipeline là “0 warning” cho đến khi xử lý 9 warning này.
- Chưa chạy production build trong đợt nghiệm thu này.

## 3. Thứ tự ưu tiên tiếp theo

1. Giữ registry làm nguồn duy nhất khi thêm biome/object mới.
2. Bổ sung `waterKind` trước các tính năng gameplay nước.
3. Chuẩn hóa settlement/lake cache thành utility LRU chung nếu cần truy cập xa
   thường xuyên.
4. Dọn 9 ESLint warning còn lại rồi mới ghi nhận CI hoàn toàn xanh.

