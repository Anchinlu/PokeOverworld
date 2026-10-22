# Hướng dẫn Dev: Triển khai Mini-map Overworld

## 1. Mục tiêu

Triển khai mini-map nhỏ cố định trên màn hình overworld, hiển thị khu vực
xung quanh người chơi theo chunk đã khám phá.

Mini-map là một thành phần HUD. Nó không thay thế World Map fullscreen và
không được tạo ra entity, chunk gameplay hoặc logic spawn mới.

Contract dữ liệu đã có tại:

```text
apps/web/src/ui/overworld/minimap/minimap-types.ts
```

## 2. Quy tắc bắt buộc

- Chỉ hiển thị trong overworld.
- Không pause game khi mini-map đang hiển thị.
- Không render toàn bộ lục địa.
- Chunk chưa khám phá phải hiển thị màu đen hoặc màu nền tối.
- Chunk đã khám phá nhưng hiện bị unload vẫn phải hiển thị từ dữ liệu deterministic
  hoặc cache discovery.
- Không gọi `generateChunk()` trong renderer mini-map.
- Không tạo Pokémon, cây, cỏ, berry hoặc collider mới.
- Không chạy `requestAnimationFrame` riêng cho terrain.
- Chỉ marker player/follower được phép cập nhật độc lập với terrain.
- Không sửa logic của `WorldMapScreen` để phục vụ mini-map nếu có thể dùng module
  dùng chung.

## 3. Kiến trúc module

Tạo các file:

```text
apps/web/src/ui/overworld/minimap/
├── minimap-types.ts       # Đã có: contract dữ liệu
├── minimap-state.ts       # State, viewport, enabled/visible
├── minimap-cache.ts       # Cache bitmap hoặc tile samples theo chunk
├── minimap-renderer.ts    # Canvas renderer nhẹ
├── minimap-controller.ts  # Lifecycle và cập nhật theo sự kiện
└── index.ts               # Barrel export
```

### `MinimapState`

State tối thiểu:

```ts
interface MinimapState {
  enabled: boolean;
  visible: boolean;
  zoom: number;
  viewport: MinimapViewport;
  discoveredChunks: ReadonlySet<string>;
}
```

Viewport mặc định nên hiển thị khoảng **5–6 chunk mỗi chiều**, tùy kích thước
màn hình. Không lấy 12 chunk đầy đủ để tránh canvas mini-map quá nặng.

## 4. Nguồn dữ liệu

Ưu tiên dùng các nguồn hiện có:

| Dữ liệu               | Nguồn                              |
| --------------------- | ---------------------------------- |
| Seed                  | `GameSession.seed`                 |
| Vị trí player         | `GameSession.player.gx/gy`         |
| Hướng player          | `GameSession.player.direction`     |
| Vị trí follower       | `GameSession.follower`             |
| Chunk đang load       | `ChunkManager.cache`               |
| Terrain deterministic | `GameSession.field`                |
| Biome                 | `resolveWorldBiome(field, gx, gy)` |
| Màu biome             | `WORLD_MAP_PALETTE`                |
| Settlement            | settlement query hiện có           |

Không dùng `chunkManager.activeChunks` làm dữ liệu duy nhất cho discovery vì
active chunks có thể bị unload.

## 5. Discovery và cache

Tạo key ổn định:

```ts
function chunkKey(cx: number, cy: number): string {
  return `${cx},${cy}`;
}
```

Khi player đi vào chunk mới:

1. Đánh dấu chunk vào `discoveredChunks`.
2. Tạo hoặc lấy bitmap mini-map của chunk.
3. Đưa chunk key vào dirty set.
4. Render lại static layer ở lần cập nhật kế tiếp.

Cache nên có dạng:

```ts
interface MinimapChunkCacheEntry {
  key: string;
  seed: number;
  version: number;
  canvas: HTMLCanvasElement | OffscreenCanvas;
}
```

Nếu chưa có hệ thống save discovery, trước mắt cache chỉ tồn tại trong session.
Không tự ý mở rộng save schema trong task này.

## 6. Render pipeline

Mini-map nên render theo hai lớp:

```text
Static layer
├── discovered chunk terrain
├── biome colors
├── water / ocean / river / lake
├── hill
├── road
└── settlement marker

Dynamic layer
├── player marker
└── follower marker
```

Static layer chỉ vẽ lại khi:

- Player bước sang chunk mới.
- Chunk mới được khám phá.
- Seed/world thay đổi.
- Người chơi đổi setting mini-map.
- Map style/palette thay đổi.

Dynamic layer có thể vẽ lại khi player đổi tile. Không cần redraw terrain.

## 7. Kích thước và pixel art

Khuyến nghị giai đoạn đầu:

- Canvas nội bộ: khoảng `160×160` hoặc `192×192`.
- Mỗi tile: `2–4 px` tùy viewport.
- `imageSmoothingEnabled = false`.
- CSS `image-rendering: pixelated`.
- Không dùng shadow, blur hoặc gradient trong renderer mini-map.

Màu nên lấy từ `WORLD_MAP_PALETTE`, tránh tạo bảng màu thứ hai không đồng bộ
với World Map.

## 8. Controller và lifecycle

`MinimapController` cần có API tối thiểu:

```ts
mount(host: HTMLElement): void;
setVisible(visible: boolean): void;
setEnabled(enabled: boolean): void;
updatePlayer(gx: number, gy: number, direction: number): void;
markChunkDiscovered(cx: number, cy: number): void;
setSession(session: GameSession): void;
destroy(): void;
```

Khi `GameSession` bị destroy hoặc quay về title:

- Dừng marker update.
- Xóa event listener.
- Xóa cache bitmap.
- Xóa DOM node.
- Không giữ tham chiếu tới session cũ.

## 9. Cập nhật theo sự kiện

Không gọi controller từ mọi frame trong `GameLoop` nếu không cần thiết.

Có thể bắt đầu bằng kiểm tra nhẹ theo tile:

```ts
const changed = player.gx !== previousGX || player.gy !== previousGY;
if (changed) {
  minimap.updatePlayer(player.gx, player.gy, player.direction);
}
```

Về sau nên chuyển sang event rõ ràng:

```ts
playerTileChanged;
chunkLoaded;
chunkUnloaded;
worldSeedChanged;
```

## 10. Input

Mini-map không được bắt các phím điều hướng overworld.

Chỉ xử lý các input riêng nếu có yêu cầu:

- Nút bật/tắt mini-map.
- Nút zoom nhỏ/lớn.
- Nút mở World Map fullscreen.

Khi bấm mini-map, có thể mở World Map fullscreen, nhưng không nên biến mini-map
thành một màn hình có pan/drag riêng ở giai đoạn đầu.

## 11. Tích hợp Overworld HUD

Gắn mini-map vào `OverworldHud`, không gắn trực tiếp vào `WorldMapScreen`.

Trạng thái hiển thị:

```text
Title screen       -> hidden
Overworld          -> visible
Battle             -> hidden hoặc giữ ảnh tĩnh tùy thiết kế
World Map fullscreen -> hidden
Evolution          -> hidden
Quit                -> destroy
```

Mini-map không được che:

- Party HUD.
- Top menu.
- Debug panel.
- Toast quan trọng.

## 12. Kiểm thử bắt buộc

Tạo test tại:

```text
apps/web/test/minimap.test.ts
```

Các ca cần kiểm tra:

1. Cùng seed và cùng chunk tạo ra cùng màu terrain.
2. Chunk chưa khám phá không hiển thị terrain.
3. Chunk đã khám phá vẫn hiển thị sau khi chunk gameplay bị unload.
4. Player marker cập nhật khi đổi tile.
5. Follower marker không làm thay đổi static terrain cache.
6. Đổi seed xóa cache của seed cũ.
7. `destroy()` xóa listener và DOM.
8. Mini-map không gọi spawn wildlife hoặc generate gameplay entity.
9. Mini-map không pause `GameLoop`.
10. World Map fullscreen và mini-map không dùng chung trạng thái pan/zoom.

## 13. Tiêu chí nghiệm thu

Dev chỉ hoàn thành khi:

- Mini-map hiển thị đúng vị trí player.
- Terrain đã khám phá giữ nguyên khi player đi xa rồi quay lại.
- Chunk chưa khám phá vẫn tối/đen.
- Không có animation loop riêng chạy khi mini-map bị ẩn.
- FPS overworld không giảm đáng kể khi bật mini-map.
- Không có logic spawn hoặc entity mới phát sinh từ renderer.
- `npm run typecheck:web` pass.
- ESLint và Prettier pass.
- Test mini-map pass.
