# Hướng dẫn bàn giao Dev phụ: chỉnh sửa Battle Move Animation

## 1. Mục tiêu công việc

Dev phụ chỉ xử lý phần hiển thị animation của move trong Battle Animation Gallery và Battle Screen.

Phạm vi được phép thay đổi:

- Timeline JSON trong `packages/game-data/animations/`.
- Mapping animation trong `packages/game-data/move-animation-map.json` hoặc `move-animation-extensions.json` khi mapping sai.
- Atlas metadata trong `packages/game-data/animation-atlas.json` hoặc `last-chance-animation-atlas.json`.
- Script patch riêng trong `scripts/animation/` để thay đổi có thể lặp lại.
- Tài liệu `docs/PROGRESS.md`.

Không tự ý thay đổi:

- Sát thương, status, Ability, PP hoặc logic battle.
- `battle-engine.ts` chỉ để sửa lỗi animation runtime đã được xác nhận.
- Mapping move nếu chưa kiểm tra timeline và asset nguồn.
- Asset gốc hoặc xóa file ảnh nguồn.

## 2. Các file runtime cần nắm

| File | Trách nhiệm |
|---|---|
| `apps/web/src/battle/animation/animation-registry.ts` | Resolve move thành animation ID và lazy-load timeline |
| `apps/web/src/battle/animation/animation-assets.ts` | Resolve atlas, đường dẫn ảnh và cache ảnh |
| `apps/web/src/battle/animation/coordinate-transformer.ts` | Đổi tọa độ nguồn 512×384 sang battle canvas |
| `apps/web/src/battle/animation/layer-manager.ts` | Chia cel nằm sau/trước Pokémon |
| `apps/web/src/battle/animation/cel-renderer.ts` | Cắt pattern và vẽ cel |
| `apps/web/src/battle/animation/animation-gallery.ts` | Công cụ kiểm tra trực quan từng frame |
| `packages/game-data/animations/last-chance/<id>.json` | Timeline animation của Last Chance |
| `packages/game-data/animation-atlas.json` | Atlas của asset animation chuẩn |
| `packages/game-data/last-chance-animation-atlas.json` | Atlas của asset Last Chance |

## 3. Quy tắc focus bắt buộc

Tọa độ nguồn chuẩn:

- Pokémon người chơi: `(128, 224)`.
- Pokémon đối thủ: `(384, 96)`.
- Canvas nguồn: `512×384`.

| Loại hiệu ứng | `focus` đúng | Ghi chú |
|---|---|---|
| Pokémon tự đánh, tự buff, hồi máu, tăng stat | `user` | Không được dùng `both` |
| Hiệu ứng nổ ngay trên đối thủ | `target` | Không bị kéo thành đường bay |
| Đạn/luồng chiêu bay từ người dùng tới đối thủ | `both` | Runtime nội suy theo trục X; không dùng để rải hiệu ứng |
| Hiệu ứng phủ toàn màn hình | `screen` | Dùng hệ tọa độ viewport |

`focus: "both"` không dùng tọa độ Y độc lập. Runtime lấy tiến độ từ X rồi nội suy cả đường bay. Vì vậy các cel có mục đích phân tán quanh một Pokémon phải dùng `user` hoặc `target`.

## 4. Quy tắc priority

Theo `LayerManager` hiện tại:

- `priority: 0` hoặc `priority: 2`: nằm phía sau Pokémon.
- `priority: 1` hoặc `priority: 3`: nằm phía trước Pokémon.

Nếu bàn tay, nốt nhạc, ánh sáng hoặc status icon phải nhìn thấy trên thân Pokémon, dùng `priority: 1` hoặc `3`.

Đây là lỗi dễ mắc: dùng `priority: 2` cho nắm đấm sẽ khiến Pokémon che mất hiệu ứng.

## 5. Quy trình sửa một move

### Bước 1: Xác định mapping

Tìm move trong:

```text
packages/game-data/move-animation-map.json
packages/game-data/move-animation-extensions.json
```

Nếu move dùng Last Chance, mở timeline tương ứng:

```text
packages/game-data/animations/last-chance/<animationId>.json
```

Kiểm tra cả `graphic`, `pattern`, `focus`, `priority`, `x`, `y`, `zoomX`, `zoomY`.

### Bước 2: Kiểm tra ảnh thật

Không chọn asset chỉ dựa vào tên file. Mở spritesheet và kiểm tra từng cell. Một PNG có thể chứa nhiều loại hiệu ứng khác nhau: nốt nhạc, tia sét, vòng, nắm đấm, bong bóng.

Các file ảnh nằm tại:

```text
apps/web/public/Graphics/Animations/
```

Asset muốn dùng phải có atlas metadata chính xác:

```json
{
  "assetKey": "animation.example",
  "file": "Example.png",
  "width": 960,
  "height": 576,
  "cellWidth": 192,
  "cellHeight": 192,
  "columns": 5,
  "rows": 3,
  "maxPattern": 15
}
```

`pattern` bắt đầu từ `0`. Không dùng pattern vượt quá `maxPattern - 1` hoặc vượt kích thước thật của PNG.

### Bước 3: Chọn cấu trúc timeline

- Chiêu tự tác động: mọi visual cel dùng `focus: "user"`.
- Chiêu bắn: dùng một nhóm cel `both` cho projectile và nhóm `target` cho impact.
- Chiêu có nhiều hạt quanh người dùng: tạo nhiều tọa độ `user`, không dùng `both`.
- Chiêu hỗ trợ: không được tạo projectile nếu mô tả là buff/self-effect.
- Nếu animation quá nhanh, giảm FPS timeline; không thay đổi delta-time toàn engine.

### Bước 4: Dùng script patch

Mỗi chỉnh sửa quan trọng nên có script riêng trong `scripts/animation/`, ví dụ:

```text
scripts/animation/patch_belch_timeline.py
scripts/animation/patch_belly_drum_timeline.py
```

Script phải có thể chạy lại nhiều lần và tạo cùng một kết quả. Không dùng `Math.random()` hoặc dữ liệu ngẫu nhiên.

### Bước 5: Kiểm tra Gallery

Trong Animation Gallery:

1. Chọn đúng move.
2. Kiểm tra Player và Enemy.
3. Bấm `Replay` rồi `Next Frame`.
4. Bật `Bounding Box & Focus`.
5. Kiểm tra frame đầu, frame giữa và frame cuối.
6. Đảm bảo hiệu ứng không ra ngoài viewport.
7. Đảm bảo Enemy không bị mirror sai và self-effect không bay sang Enemy.

## 6. Bài học từ các move đã sửa

### BELCH

- Không dùng `WaterBubbles.png` cho move hệ Poison.
- Dùng atlas `poison` đã đăng ký sẵn để tránh asset bị tàng hình khi build sạch.
- Projectile đi từ `user` tới `target`, impact cuối dùng `target`.

### BELLY DRUM

- Không dùng `003-Attack01` vì không diễn tả tự đánh vào bụng.
- Trong `PRAS- Sound.png`:
  - Pattern `43`: nắm đấm đỏ.
  - Pattern `30–35`: nốt nhạc.
  - Pattern `36` và `42`: vòng màu, không phải nắm đấm.
  - Pattern `40–41`: tia sét, không phải nốt nhạc.
- Nắm đấm và nốt nhạc dùng `focus: "user"` + `priority: 1` để nằm trên Pokémon.

## 7. Checklist trước khi bàn giao

- [ ] Move dùng đúng asset theo ngữ nghĩa.
- [ ] Pattern đã kiểm tra trực tiếp trên spritesheet.
- [ ] Atlas có đúng kích thước PNG, cell, columns, rows.
- [ ] Self-effect chỉ dùng `focus: "user"`.
- [ ] Impact dùng `focus: "target"`.
- [ ] Projectile mới dùng `focus: "both"` có chủ đích.
- [ ] Cel cần nổi trên Pokémon dùng `priority: 1` hoặc `3`.
- [ ] Không có cel vượt viewport hoặc pattern không tồn tại.
- [ ] Không dùng `Math.random()`.
- [ ] Không thay đổi battle logic.
- [ ] JSON parse được và timeline có ít nhất một frame hợp lệ.
- [ ] Đã kiểm tra Player và Enemy trong Gallery.
- [ ] Đã ghi lại nguyên nhân, asset và animation ID trong `docs/PROGRESS.md`.

## 8. Cách báo cáo một move đã sửa

Dev phụ gửi báo cáo theo mẫu:

```text
Move: <tên move>
Animation ID: <id>
Nguyên nhân lỗi: <asset sai / focus sai / priority sai / pattern sai / tọa độ sai>
Asset đã dùng: <file>
Pattern chính: <danh sách pattern>
Focus: <user / target / both / screen>
Priority: <giá trị>
Đã kiểm tra: Player / Enemy / frame đầu / giữa / cuối
Test chạy: <JSON check hoặc test cụ thể>
```

Nếu chưa chắc asset hoặc pattern nào đúng, dừng ở bước phân tích và gửi ảnh/chụp Gallery để xác nhận; không tự ý đổi sang asset ngẫu nhiên.
