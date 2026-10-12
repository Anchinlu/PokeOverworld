# Kế hoạch triển khai Battle Animation

## 1. Mục tiêu

Thay thế hệ thống VFX hiện tại đang phát sprite sheet tuần tự bằng hệ thống animation theo timeline, có khả năng tái sử dụng dữ liệu từ:

```text
E:\Pokemon spries\Pokemon Reunion EX Trilogy 4.2
```

Nguồn tham chiếu chính:

- `Data/PkmnAnimations.rxdata`: dữ liệu timeline animation.
- `Data/move2anim.dat`: mapping move tới animation.
- `Data/animationmap.ebdx`: animation mặc định theo hệ/category.
- `Graphics/Animations/*`: sprite sheet và asset hiệu ứng.

Mục tiêu đầu tiên là hiển thị đúng hiệu ứng của move trong battle. Logic sát thương, status, Ability và target selection không được trộn vào animation player.

## 2. Nguyên tắc bắt buộc

1. Không đọc trực tiếp file `.rxdata`, `.dat` hoặc Ruby Marshal trong runtime TypeScript.
2. Không dùng `totalFrames` tuần tự để đại diện cho mọi animation.
3. Không hardcode đường dẫn ảnh trong battle rule hoặc animation class.
4. Không dùng số lần gọi `requestAnimationFrame` để tính thời gian animation.
5. Animation phải chạy theo elapsed time/delta time, ổn định ở 60Hz, 120Hz và 144Hz.
6. Một move chỉ có một nguồn mapping chính thức.
7. Animation không được tự quyết định sát thương hoặc trạng thái chiến đấu.
8. Asset từ dự án nguồn phải được giữ thông tin credit và kiểm tra quyền tái phân phối trước khi phát hành.

## 3. Kiến trúc đích

```text
Move ID
  ↓
BattleAnimationRegistry
  ↓
AnimationDefinition
  ↓
AnimationPlayer
  ├── CelRenderer
  ├── CoordinateTransformer
  ├── LayerManager
  ├── TimingEventPlayer
  └── AssetResolver
```

### 3.1. Shared animation types

Tạo module dùng chung tại:

```text
apps/web/src/battle/animation/types.ts
```

Các kiểu dữ liệu tối thiểu:

```ts
type AnimationFocus = 'user' | 'target' | 'both' | 'screen';

interface AnimationCel {
  pattern: number;
  x: number;
  y: number;
  zoomX: number;
  zoomY: number;
  angle: number;
  mirror: boolean;
  opacity: number;
  blendMode: 'normal' | 'additive' | 'multiply';
  visible: boolean;
  priority: number;
  focus: AnimationFocus;
}

interface AnimationFrame {
  cels: AnimationCel[];
}

interface AnimationTimingEvent {
  frame: number;
  type: 'sound' | 'flash' | 'background' | 'foreground';
  payload: Record<string, string | number | boolean>;
}

interface BattleAnimationDefinition {
  id: string;
  moveId: string;
  opponentVariant?: string;
  fps: number;
  frames: AnimationFrame[];
  timings: AnimationTimingEvent[];
}
```

### 3.2. Atlas metadata

Tạo metadata riêng cho mỗi sprite sheet:

```text
packages/game-data/animation-atlas.json
```

Metadata phải khai báo:

- `assetKey`.
- Kích thước ảnh.
- Kích thước cell.
- Số cột/hàng.
- Frame hợp lệ.
- Các frame có alpha thực.
- Clip hoặc pattern được phép sử dụng.

Không giả định tất cả ảnh đều là lưới 5 cột x 192px. Các file như `Tackle_B.png`, `Growl.png` và `More2.png` cần metadata riêng.

## 4. Data conversion pipeline

Tạo tool chuyển đổi ngoài runtime tại:

```text
scripts/animation/import-source-animations.*
```

Tool phải chuyển:

```text
PkmnAnimations.rxdata → packages/game-data/animations/*.json
move2anim.dat         → packages/game-data/move-animation-map.json
animationmap.ebdx     → packages/game-data/animation-fallbacks.json
```

Nếu không thể chạy Ruby Marshal trực tiếp trong Node, sử dụng một trong hai phương án:

1. Export JSON từ animation editor của dự án nguồn.
2. Dùng một converter riêng có runtime Ruby tương thích để xuất JSON một lần.

Không đưa Ruby runtime hoặc file Marshal vào bundle frontend.

### 4.1. Quy tắc mapping

- Chuẩn hóa `TACKLE` thành `tackle`.
- Chuẩn hóa `FIREPUNCH` thành `fire_punch` theo convention hiện tại.
- Giữ mapping `Move` và `OppMove` riêng.
- Giữ `hitNum` cho các move multi-hit.
- Nếu move không có animation riêng, fallback theo type/category.
- Fallback cuối cùng là `tackle`.

## 5. Runtime Animation Player

Tạo các module:

```text
apps/web/src/battle/animation/
├── types.ts
├── animation-registry.ts
├── animation-player.ts
├── cel-renderer.ts
├── coordinate-transformer.ts
├── layer-manager.ts
├── timing-events.ts
├── animation-assets.ts
└── index.ts
```

### 5.1. AnimationPlayer

API đề xuất:

```ts
interface BattleAnimationPlayer {
  play(request: BattleAnimationRequest): BattleAnimationInstance;
  update(dtMs: number): void;
  isPlaying(): boolean;
  stop(): void;
}
```

Player phải:

- Tính frame từ `elapsedMs * fps`.
- Không phụ thuộc FPS của màn hình.
- Cho phép nhiều cel cùng frame.
- Hỗ trợ user, target, both và screen focus.
- Mirror đúng khi animation được dùng bởi enemy.
- Áp dụng layer priority trước/sau battler.
- Hỗ trợ opacity, scale, angle, blend mode và flash.
- Phát timing event đúng frame.
- Dispose toàn bộ sprite tạm và bitmap khi kết thúc.

### 5.2. Coordinate transform

Coordinate transform phải chuyển được từ hệ tọa độ chuẩn của nguồn sang vị trí battler thực tế:

```text
source user/target focus
        ↓
actual player/enemy battler position
        ↓
canvas coordinates
```

Không gắn cứng tọa độ player/enemy vào từng move.

## 6. Registry và Asset Resolution

Mở rộng Asset Registry hiện tại để animation dùng key ổn định:

```ts
ANIMATION_ASSETS.get('animation.ancient_power');
ANIMATION_ASSETS.get('animation.fire');
ANIMATION_ASSETS.get('animation.shadow_ball');
```

Không cho phép module battle gọi trực tiếp:

```ts
'/Graphics/Animations/Flames.png'
```

`BattleAnimationRegistry` là nguồn mapping duy nhất. Không tiếp tục duy trì song song mapping trong:

- `move-vfx.ts`.
- `move-animation-manager.ts`.
- `custom-animations/index.ts`.

Các custom animation hiện tại phải được chuyển thành adapter tạm thời hoặc chuyển dần sang timeline JSON.

## 7. Thứ tự triển khai

### Phase 0 — Baseline và CI gate

- Xác nhận `typecheck`, test, lint và format pass.
- Chụp lại danh sách move đang có animation.
- Không bắt đầu migration nếu working tree chưa có checkpoint.

### Phase 1 — Data model và validator

- Tạo types.
- Tạo atlas metadata.
- Tạo schema validator.
- Kiểm tra asset tồn tại.
- Kiểm tra pattern không vượt giới hạn ảnh.
- Kiểm tra frame không trỏ vào ô trống.

### Phase 2 — Converter và registry

- Export `PkmnAnimations` thành JSON.
- Import `move2anim`.
- Import fallback theo type/category.
- Chuẩn hóa move ID.
- Viết test mapping.

### Phase 3 — Runtime player

- Implement player theo elapsed time.
- Implement cel renderer.
- Implement focus/transform/mirror.
- Implement layer và timing events.
- Tích hợp battle screen.

### Phase 4 — Batch animation ưu tiên

Chuyển trước các move thường gặp:

```text
tackle, scratch, quick_attack, slash,
ember, flamethrower, fire_blast,
water_gun, surf, hydro_pump, water_pulse,
thunder_shock, thunderbolt, thunder,
ice_beam, shadow_ball, bite, crunch,
fake_out, iron_head, x_scissor,
ancient_power, dragon_claw, psychic
```

### Phase 5 — Mở rộng toàn bộ nguồn

- Chuyển toàn bộ 212 move có animation riêng.
- Chuyển 18 `OppMove` variant.
- Bổ sung multi-hit và alternate hit frame.
- Bổ sung animation fallback theo type/category.

### Phase 6 — Xóa hệ thống cũ

Chỉ xóa `move-vfx.ts` và custom animation cũ sau khi:

- Registry mới bao phủ toàn bộ move.
- Không còn caller cũ.
- Visual gallery pass.
- Test battle và build pass.

## 8. Kiểm thử bắt buộc

### Unit tests

- Mapping move tới animation.
- Mapping enemy tới `OppMove`.
- Fallback theo hệ/category.
- Frame index hợp lệ.
- Atlas dimensions hợp lệ.
- Elapsed time không phụ thuộc FPS.
- Animation kết thúc và dispose đúng.
- Multi-hit dùng đúng hit frame.

### Integration tests

- Player dùng move có animation riêng.
- Enemy dùng animation mirror.
- Animation không làm thay đổi damage/status.
- Animation không khóa battle khi asset lỗi.
- Battle tiếp tục được sau khi animation kết thúc.

### Visual QA

Tạo debug gallery có:

- Danh sách move.
- Nút play/replay.
- Chọn player/enemy side.
- Hiển thị frame hiện tại.
- Hiển thị pattern/cel đang dùng.
- Hiển thị bounding box và focus point.
- Hiển thị asset key và animation ID.

## 9. Tiêu chí nghiệm thu

Hoàn thành khi:

- Có ít nhất 212 move được mapping từ nguồn hoặc có fallback hợp lệ.
- 18 `OppMove` variant hoạt động đúng khi enemy sử dụng move.
- Không còn hardcode animation path trong battle runtime.
- Không còn phát frame tuần tự mù từ `0` đến `totalFrames`.
- Animation ổn định trên 60/120/144Hz.
- Không làm thay đổi kết quả damage, status, Ability hoặc turn order.
- Validator phát hiện được asset thiếu, frame vượt bounds và clip rỗng.
- Test, lint, format và production build pass sạch.
- Có debug gallery để nghiệm thu trực quan.

## 10. Phạm vi không làm trong phase đầu

- Không thay đổi damage formula.
- Không thay đổi status engine.
- Không thay đổi Ability engine.
- Không thêm move mới vào database.
- Không đưa toàn bộ Ruby engine vào Tauri/frontend.
- Không tối ưu bundle trước khi animation registry hoạt động ổn định.

## 11. Checklist giao việc cho dev

- [ ] Tạo checkpoint trước migration.
- [ ] Tạo animation types.
- [ ] Tạo atlas metadata và validator.
- [ ] Export source animation data sang JSON.
- [ ] Tạo mapping registry duy nhất.
- [ ] Implement elapsed-time animation player.
- [ ] Implement cel/layer/focus/mirror.
- [ ] Migrate batch move ưu tiên.
- [ ] Tạo visual debug gallery.
- [ ] Chạy test và visual QA.
- [ ] Migrate toàn bộ 212 move.
- [ ] Xóa legacy mapping sau khi nghiệm thu.
