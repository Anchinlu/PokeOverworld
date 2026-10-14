# Hướng dẫn Dev: Khắc phục sai hướng và lệch vị trí Battle Animation

> Trạng thái: **Tài liệu giao việc — chưa triển khai**
>
> Phạm vi: pipeline animation timeline của 212 move, 18 biến thể `OppMove` và các animation fallback.

## 1. Mục tiêu

Khắc phục các lỗi visual đang quan sát được trong Animation Gallery và Battle Screen:

- Projectile của Player bay ngược hướng hoặc không đi từ người dùng tới mục tiêu.
- Animation của Enemy bị mirror sai.
- Chiêu tự dùng lên bản thân lại hiển thị trên đối phương.
- Một số cel bị đẩy ra ngoài viewport hoặc chỉ còn một phần không chủ ý.
- Animation multi-hit chưa chọn đúng frame/animation cho từng hit.
- Một số pattern vượt quá số ô hợp lệ của sprite sheet.

Logic damage, status, Ability, target selection và turn order không được thay đổi trong task này.

## 2. Kết quả điều tra đã xác nhận

### 2.1. Nguồn tham chiếu

Pipeline nguồn gồm:

```text
Data/PkmnAnimations.rxdata  -> timeline animation
Data/move2anim.dat          -> mapping Move/OppMove
Data/animationmap.ebdx      -> fallback theo type/category
Graphics/Animations         -> sprite sheet animation
```

Đã đối chiếu được:

- 311 timeline animation JSON trong `packages/game-data/animations/`.
- 212 mapping move thông thường.
- 18 mapping `OppMove`.
- 95 atlas metadata.
- 212/212 move có definition tương ứng.

### 2.2. Sai khác quan trọng giữa nguồn và runtime hiện tại

1. **Transform focus `both`**

   Engine nguồn lấy tỷ lệ theo trục X trên đường nối `user -> target`, sau đó đặt cả X và Y lên đường nối đích. Runtime hiện tại đang tính `tx` và `ty` độc lập. Điều này làm các cel có tọa độ lệch khỏi đường tham chiếu bị trôi, bay ngược hoặc rơi ra ngoài màn hình.

2. **Mirror của Enemy**

   Engine nguồn không mirror mọi animation của Enemy một cách vô điều kiện. Nó so sánh hướng của đường nguồn và đường đích, sau đó mới đảo cờ mirror. Runtime hiện tại đang ép mirror cho mọi cel `focus: 'both'` khi `isEnemy`.

3. **`hitNum` chưa đi hết pipeline**

   Kiểu request đã có `hitNum`, nhưng registry/player chưa dùng nó để chọn animation `baseAnimationId + hitNum`. Các chiêu nhiều hit vì vậy có thể lặp sai frame hoặc dùng animation đầu tiên cho mọi hit.

4. **Viewport không đồng nhất**

   Nguồn dùng hệ quy chiếu 512×384. Runtime animation đang có mặc định cao 288 trong khi battle canvas thực tế cao 384 và battle panel bắt đầu ở vùng thấp hơn. Cần phân biệt rõ `canvas coordinate`, `battle viewport` và `panel clip rect`.

5. **Pattern vượt atlas**

   Đã phát hiện các nhóm cần xử lý riêng:

   - `absorb`: pattern vượt giới hạn atlas `leech-seed`.
   - `bubblebeam`: pattern vượt giới hạn atlas `018-Water01`.
   - `stealth_rock`: pattern vượt giới hạn atlas `Rock Tomb`.
   - Các biến thể đối thủ tương ứng cũng phải được kiểm tra.

## 3. Quy tắc kiến trúc bắt buộc

- `animation-registry.ts` là nguồn mapping duy nhất.
- `coordinate-transformer.ts` chỉ làm nhiệm vụ chuyển hệ tọa độ; không biết damage/status.
- `cel-renderer.ts` chỉ vẽ cel; không tự sửa mapping move.
- `animation-player.ts` điều phối timeline và callback; không tự quyết định combat result.
- Không thêm logic đặc biệt rải trong `battle-controller.ts` cho từng move nếu có thể biểu diễn bằng registry/override có kiểm soát.
- Không dùng `Math.random()` cho animation.
- Không clamp âm thầm mọi tọa độ để che lỗi dữ liệu. Phải ghi nhận warning/validation để phân biệt dữ liệu hợp lệ với dữ liệu hỏng.
- Không sửa trực tiếp dữ liệu nguồn `.rxdata`, `.dat` hoặc Ruby runtime trong frontend.
- Không dùng `window`, DOM hoặc UI state trong rule engine.

## 4. Kế hoạch triển khai theo thứ tự

### Bước 0 — Tạo baseline

Trước khi sửa:

1. Tạo checkpoint commit riêng cho animation.
2. Chạy và lưu kết quả:

   ```powershell
   npm run typecheck:web
   npm run lint
   npm run test:web
   npm run build:web
   ```

3. Trong Gallery kiểm tra tối thiểu:

   ```text
   Player: Acid, Energy Ball, Growl, Outrage, Water Gun
   Enemy: cùng danh sách trên
   Self-target: Protect, Swords Dance, Dragon Dance, Reflect
   Multi-hit: Fury Attack hoặc move có hitNum
   ```

Không đánh giá kết quả bằng một ảnh chụp duy nhất; phải kiểm tra cả Player và Enemy.

### Bước 1 — Sửa transform `focus: 'both'`

File chính:

```text
apps/web/src/battle/animation/coordinate-transformer.ts
apps/web/test/battle-timeline-animations.test.ts
```

Thuật toán phải tương đương engine nguồn:

```ts
const sourceDx = src2.x - src1.x;
const progress = sourceDx === 0 ? 0 : (px - src1.x) / sourceDx;

return {
  x: dst1.x + progress * (dst2.x - dst1.x),
  y: dst1.y + progress * (dst2.y - dst1.y),
};
```

Lưu ý:

- `py` không dùng để tính `ty` độc lập đối với `focus: 'both'`.
- Giữ riêng trường hợp `celX === 0 && celY === 0` nếu importer dùng cặp này để biểu diễn cel neo ở user.
- Không clamp `progress` trước khi validator xác định cel đó có phải hiệu ứng screen/ngoài đường bay có chủ đích hay không.
- `focus: 'user'`, `focus: 'target'` và `focus: 'screen'` không được bị thay đổi ngoài phạm vi test hồi quy.

Test bắt buộc:

- Cel nằm đúng trên đường nguồn phải tới đúng vị trí tương ứng trên đường đích.
- Cel có `y` lệch khỏi đường nguồn vẫn dùng cùng tiến độ X.
- Player và Enemy cho cùng một timeline phải đi trên hai hướng đối xứng.
- Không được quay lại lỗi Water Gun/Acid bị bay lên góc trên trái.

### Bước 2 — Sửa quy tắc mirror theo hướng đường bay

File chính:

```text
apps/web/src/battle/animation/cel-renderer.ts
apps/web/src/battle/animation/coordinate-transformer.ts
apps/web/src/battle/animation/animation-player.ts
apps/web/src/battle/animation/animation-gallery.ts
```

Tạo một hàm thuần, ví dụ:

```ts
isDirectionReversed(sourceUser, sourceTarget, actualUser, actualTarget): boolean
```

Quy tắc:

1. Xác định hướng nguồn bằng `sourceUser.x < sourceTarget.x`.
2. Xác định hướng thực tế bằng `actualUser.x < actualTarget.x`.
3. Nếu hai hướng khác nhau thì đảo cờ `cel.mirror`.
4. Nếu hai hướng giống nhau thì giữ nguyên `cel.mirror`.
5. Chỉ áp dụng quy tắc đường bay cho `focus: 'both'`; cel `user`, `target`, `screen` vẫn dùng mirror được author khai báo.

Không dùng điều kiện đơn giản kiểu `isEnemy ? !cel.mirror : cel.mirror` làm nguồn sự thật.

Test bắt buộc:

- Player projectile: hướng từ Player sang Enemy.
- Enemy projectile: cùng timeline được mirror đúng một lần.
- Animation có `cel.mirror = true`: không bị đảo hai lần.
- Animation tự dùng: không bị mirror như projectile.

### Bước 3 — Hoàn thiện `hitNum` cho multi-hit

File chính:

```text
apps/web/src/battle/animation/animation-registry.ts
apps/web/src/battle/animation/animation-player.ts
apps/web/src/battle/animation/types.ts
apps/web/test/battle-timeline-animations.test.ts
```

Yêu cầu API:

```ts
resolveAnimationId(
  moveId: string,
  isEnemy?: boolean,
  moveType?: string,
  moveCategory?: string,
  hitNum?: number
): number;
```

Quy tắc:

- Chọn mapping `OppMove` trước nếu attacker là Enemy.
- Nếu `hitNum > 0` và mapping có chuỗi multi-hit hợp lệ, dùng `baseAnimationId + hitNum` theo quy ước nguồn.
- Nếu animation cộng thêm không tồn tại, fallback về base animation và ghi warning có `moveId`, `hitNum`, `animationId`.
- Không cộng `hitNum` vào animation fallback theo type/category nếu nguồn không định nghĩa chuỗi tương ứng.
- Gallery mặc định dùng `hitNum = 0` nhưng phải có control để kiểm thử hit 1, 2, 3.

### Bước 4 — Chuẩn hóa viewport và clip

File cần rà soát:

```text
apps/web/src/battle/animation/coordinate-transformer.ts
apps/web/src/battle/animation/cel-renderer.ts
apps/web/src/battle/animation/animation-gallery.ts
apps/web/src/battle/battle-renderer.ts
```

Phải định nghĩa rõ:

```ts
interface AnimationViewport {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

Yêu cầu:

- Transform từ hệ 512×384 sang viewport thực tế bằng một nguồn scale duy nhất.
- Render animation trong clip rect của battle viewport; không clip toàn bộ battle UI.
- Không tự động cắt cel chỉ vì bounding box chạm biên; chỉ clip ở lớp canvas.
- Gallery và Battle Screen phải dùng cùng `AnimationViewport`/geometry để kết quả không khác nhau.
- HUD debug phải hiển thị cả tọa độ raw, tọa độ sau transform và bounding box sau scale.

### Bước 5 — Validator atlas và dữ liệu

Mở rộng script validation hiện có hoặc tạo validator chuyên biệt tại:

```text
scripts/animation/
packages/game-data/animation-atlas.json
```

Validator phải báo lỗi rõ:

```text
[pattern-out-of-range]
move=absorb animationId=23 asset=leech-seed pattern=12 maxPattern=11
```

Kiểm tra tối thiểu:

- `pattern >= 0`.
- `pattern < maxPattern` theo metadata thực tế.
- Cell crop không vượt `naturalWidth/naturalHeight`.
- Asset tồn tại và load được.
- Timeline không rỗng ngoài các animation được whitelist là empty.
- Mapping move, OppMove và fallback đều trỏ tới definition hợp lệ.

Xử lý nhóm lỗi hiện tại theo thứ tự:

1. Xác nhận atlas metadata có đúng với file ảnh thật.
2. Nếu dữ liệu nguồn dùng pattern đặc biệt, tạo conversion rule có ghi chú nguồn.
3. Nếu pattern thực sự sai, sửa dữ liệu JSON sinh ra hoặc converter; không che bằng `try/catch` trong renderer.
4. Bổ sung regression test cho `absorb`, `bubblebeam`, `stealth_rock` và OppMove tương ứng.

### Bước 6 — Timing và layer

Không mở rộng scope sang combat logic. Chỉ rà soát:

- `sound` và `flash` được phát đúng frame.
- `background`/`foreground` nếu timeline có dùng phải có handler rõ ràng hoặc được đánh dấu unsupported trong validator.
- `priority` được render nhất quán giữa Gallery và Battle Screen.
- Callback `onHit`/`onComplete` không bị gọi hai lần.
- Khi asset lỗi, battle tiếp tục và callback vẫn hoàn tất.

## 5. Kiểm thử bắt buộc

### Unit test

Tối thiểu phải có các nhóm sau:

| Nhóm | Nội dung |
|---|---|
| Transform | `user`, `target`, `both`, `screen`, điểm lệch đường, điểm 0/0 |
| Mirror | Player, Enemy, mirror authored, self-target |
| Mapping | 212 move, 18 OppMove, fallback |
| Multi-hit | `hitNum` 0/1/2/3, animation thiếu hit variant |
| Atlas | pattern hợp lệ, pattern vượt bounds, asset thiếu |
| Viewport | 512×384, viewport battle thực tế, scale khác nhau |
| Timing | elapsed time, 60/120/144Hz, callback một lần |
| Regression | Acid, Energy Ball, Growl, Outrage, Water Gun, Stealth Rock |

### Visual QA Gallery

Gallery cần bổ sung:

- Hiển thị `rawX/rawY` và `resolvedX/resolvedY`.
- Hiển thị đường nối User → Target.
- Hiển thị hướng mũi tên của projectile.
- Toggle clip rect.
- Chọn attacker Player/Enemy.
- Chọn `hitNum`.
- Nút tải lại definition sau khi sửa JSON.
- Bộ lọc chỉ hiện move có `focus: both` hoặc có pattern lỗi.

### Lệnh kiểm tra

```powershell
npm run typecheck:web
npm run lint
npm run format:check
npm run test:web
npm run build:web
```

Nếu có script animation validator riêng, phải thêm vào `npm run ci`.

## 6. Tiêu chí nghiệm thu

Chỉ đánh dấu hoàn tất khi:

- 212 move vẫn resolve được definition hoặc fallback hợp lệ.
- 18 `OppMove` được chọn đúng khi Enemy tấn công.
- Projectile của Player không bị phun ngược do transform/mirror.
- Enemy không bị mirror hai lần.
- Self-target không bị chuyển sang target của đối phương.
- Không còn cel vô tình xuất hiện ngoài viewport do transform sai.
- Các pattern vượt atlas bị validator phát hiện hoặc đã được xử lý có căn cứ.
- Multi-hit dùng đúng variant khi truyền `hitNum`.
- Gallery và Battle Screen cho cùng kết quả tọa độ/layer.
- Không thay đổi damage, status, Ability, turn order.
- `npm run ci` pass sạch.

## 7. Những việc chưa làm trong tài liệu này

Các mục sau chỉ để backlog, không tự triển khai trong task sửa alignment:

- Bổ sung toàn bộ asset EBDX Moves/Ballburst/Weather còn thiếu.
- Viết lại animation timeline mới cho move không có dữ liệu nguồn.
- Thay đổi công thức sát thương hoặc hiệu ứng status.
- Thêm cơ chế multiplayer/backend authoritative.
- Xóa hẳn custom animation legacy trước khi có visual regression pass.
- Tối ưu bundle tiếp khi chưa giải quyết xong correctness của transform và mirror.

## 8. Báo cáo bắt buộc sau khi dev hoàn thành

Dev cần cập nhật `docs/PROGRESS.md` bằng báo cáo ngắn gồm:

1. File đã thay đổi.
2. Quy tắc transform/mirror đã áp dụng.
3. Số move, OppMove và multi-hit đã kiểm thử.
4. Các pattern/asset còn cảnh báo.
5. Kết quả test, lint, typecheck, build và CI.
6. Danh sách visual case đã mở trong Gallery.
7. Các vấn đề còn lại, nếu có, phải ghi rõ là **chưa triển khai**.

