# BÁO CÁO RÀ SOÁT & KẾ HOẠCH TRIỂN KHAI LOGIC CHIẾN ĐẤU (BATTLE, ABILITY, MOVE, ITEM & POKÉBALL)

Tài liệu này tổng hợp toàn bộ kết quả rà soát đối chiếu giữa **dữ liệu định nghĩa / mô tả** (`packages/game-data/*.json`, bảng mô tả Tiếng Việt trong code) và **logic thực thi thực tế** trong hệ thống chiến đấu (`apps/web/src/battle/**` và `apps/web/src/domain/inventory/**`).

---

## Mục Lục

1. [Tổng quan kiến trúc hiện tại](#1-tổng-quan-kiến-trúc-hiện-tại)
2. [Nhóm 1: Đặc tính Pokémon (Abilities)](#2-nhóm-1-đặc-tính-pokémon-abilities)
   - [2.1. Đã có tên & mô tả trong `ability-engine.ts` nhưng CHƯA có logic](#21-đã-có-tên--mô-tả-trong-ability-enginets-nhưng-chưa-có-logic)
   - [2.2. Đã triển khai MỘT PHẦN (thiếu nhánh phụ hoặc điều kiện)](#22-đã-triển-khai-một-phần-thiếu-nhánh-phụ-hoặc-điều-kiện)
   - [2.3. Đã có logic trong code nhưng THIẾU mô tả Tiếng Việt](#23-đã-có-logic-trong-code-nhưng-thiếu-mô-tả-tiếng-việt)
   - [2.4. Có gán cho Pokémon trong `pokemon-db.json` / `regional-forms.json` nhưng chưa xử lý](#24-có-gán-cho-pokémon-trong-pokemon-dbjson--regional-formsjson-nhưng-chưa-xử-lý)
3. [Nhóm 2: Chiêu thức & Cơ chế Chiến đấu (Moves & Combat Rules)](#3-nhóm-2-chiêu-thức--cơ-chế-chiến-đấu-moves--combat-rules)
   - [3.1. Chiêu thức đang dùng logic tạm (Placeholder / Partial)](#31-chiêu-thức-đang-dùng-logic-tạm-placeholder--partial)
   - [3.2. Chiêu thức thiếu trường dữ liệu trong `moves-db.json`](#32-chiêu-thức-thiếu-trường-dữ-liệu-trong-moves-dbjson)
   - [3.3. Chiêu thức học được / TM có quy tắc đặc biệt chưa cài đặt](#33-chiêu-thức-học-được--tm-có-quy-tắc-đặc-biệt-chưa-cài-đặt)
   - [3.4. Chiêu thức Status học được chưa có nhánh xử lý trong `applyStatusCategoryMove`](#34-chiêu-thức-status-học-được-chưa-có-nhánh-xử-lý-trong-applystatuscategorymove)
4. [Nhóm 3: Vật phẩm & Pokéball (Items & Pokéballs)](#4-nhóm-3-vật-phẩm--pokéball-items--pokéballs)
   - [4.1. Hệ số bắt Pokémon theo điều kiện của Pokéball (`pokeball-db.ts`)](#41-hệ-số-bắt-pokémon-theo-điều-kiện-của-pokéball-pokeball-dbts)
   - [4.2. Vật phẩm sử dụng trong túi đồ (`item-effects.ts`)](#42-vật-phẩm-sử-dụng-trong-túi-đồ-item-effectsts)
   - [4.3. Vật phẩm cầm tay trong trận đấu (`held-item-engine.ts`)](#43-vật-phẩm-cầm-tay-trong-trận-đấu-held-item-enginets)
5. [Nhóm 4: Các cơ chế phụ thuộc vào hệ thống chưa xây dựng (System-Dependent / Blocked)](#5-nhóm-4-các-cơ-chế-phụ-thuộc-vào-hệ-thống-chưa-xây-dựng-system-dependent--blocked)
6. [Lộ trình triển khai đề xuất (Phases) & Tiêu chí nghiệm thu](#6-lộ-trình-triển-khai-đề-xuất-phases--tiêu-chí-nghiệm-thu)

---

## 1. Tổng quan kiến trúc hiện tại

| Thành phần | File phụ trách chính | Vai trò |
|---|---|---|
| Điều phối trận đấu | `apps/web/src/battle/battle-engine.ts` | Luồng lượt đánh, tung chiêu, đổi Pokémon, chạy trốn, kết thúc lượt |
| Điều khiển UI & Bắt Pokémon | `apps/web/src/battle/battle-controller.ts` | Tương tác người chơi, tung Pokéball, dùng Item trong trận, hoạt ảnh |
| Đặc tính (Abilities) | `apps/web/src/battle/rules/ability-engine.ts` | Kích hoạt khi vào sân, tính sát thương, miễn nhiễm, tiếp xúc, cuối lượt |
| Hiệu ứng chiêu thức | `apps/web/src/battle/rules/move-effect-engine.ts` | Kiểm tra chính xác, Protect, Screen, Weather/Terrain, Hazard, Status moves |
| Tính sát thương | `apps/web/src/battle/rules/damage-calculator.ts` | Công thức sát thương Gen V+, STAB, Crit, Multi-hit, biến thiên Base Power |
| Trạng thái bất lợi | `apps/web/src/battle/rules/status-engine.ts` | Burn, Paralysis, Sleep, Poison/Toxic, Freeze, Confusion, Flinch, Leech Seed |
| Vật phẩm cầm tay | `apps/web/src/battle/rules/held-item-engine.ts` | Berry, Choice items, Orb, Sash, Eviolite, Boots, Leftovers, Rocky Helmet |
| Vật phẩm túi đồ | `apps/web/src/domain/inventory/item-effects.ts` | Potion, Status Heal, X-Items, Vitamin, Ability Capsule/Patch, Rare Candy |
| Bóng chứa Pokémon | `apps/web/src/battle/pokeball-db.ts` | Định nghĩa 27 loại bóng và công thức tính tỉ lệ bắt |

---

## 2. Nhóm 1: Đặc tính Pokémon (Abilities)

### 2.1. Đã có tên & mô tả trong `ability-engine.ts` nhưng CHƯA có logic

Các Ability dưới đây đã được khai báo trong `ABILITY_NAMES_VI` và `ABILITY_DESCRIPTIONS_VI` (`apps/web/src/battle/rules/ability-engine.ts` dòng 21–199) nhưng chưa được xử lý hoặc đang bỏ trống trong các hook chiến đấu:

| Ability ID | Tên Tiếng Việt | Mô tả trong code | Hiện trạng trong code | Hướng triển khai chuẩn |
|---|---|---|---|---|
| `cutecharm` | Quyến Rũ | *"30% làm đối thủ mê hoặc khi nhận đòn tiếp xúc."* | Chỉ có trong bảng mô tả (L40, L130). Không có trong `AbilityEngine.onContact()`. | Bổ sung trạng thái volatile `infatuated` (50% không thể ra đòn mỗi lượt nếu khác giới tính) và kích hoạt 30% trong `AbilityEngine.onContact()`. |
| `cursedbody` | Lời Nguyền Xác Thịt | *"30% cơ hội khóa chiêu của đối thủ khi bị đánh trúng."* | Tại `AbilityEngine.onContact()` (L1068–1070) có nhánh `if (ability === 'cursedbody')` nhưng **thân hàm rỗng** (`// Cursed Body actually triggers on any damaging hit...`). | Chuyển kiểm tra sang sau khi nhận sát thương trực tiếp trong `BattleEngine.executeAttack()`: 30% gán `attacker.disabledMove = { moveId: move.id, turnsLeft: 4 }` (nếu chưa bị khóa chiêu). |
| `earlybird` | Chim Dậy Sớm | *"Thức dậy sau giấc ngủ nhanh gấp đôi bình thường."* | `status-engine.ts` (L138–157) luôn trừ `sleepTurns` đi `1` mỗi lượt. | Trong `checkCanAttack()` (`status-engine.ts`), nếu `AbilityEngine.normalizeAbility(pokemon.ability) === 'earlybird'`, giảm `sleepTurns` đi `2` mỗi lượt (tối thiểu về `0`). |
| `runaway` | Bỏ Chạy | *"Luôn luôn chạy trốn thành công khỏi Pokémon hoang dã."* | `BattleEngine.tryFlee()` (`battle-engine.ts` L2161–2172) chỉ xét chênh lệch Speed mà chưa kiểm tra `runaway`. | Đầu hàm `tryFlee()`, nếu Pokémon của người chơi có ability `runaway`, trả về thành công ngay lập tức (bỏ qua khóa chân và kiểm tra Speed). |
| `sandforce` | Lực Lượng Cát | *"Tăng 30% sát thương chiêu Đất, Đá, Thép trong Bão Cát."* | Chưa có trong `getAttackerDamageMultiplier()` và `isWeatherDamageImmune()`. | 1. Thêm `sandforce` vào `isWeatherDamageImmune('sandstorm')`.<br>2. Truyền `environment` vào `getAttackerDamageMultiplier()`: nếu `weather === 'sandstorm'` và `move.type` thuộc `['ground', 'rock', 'steel']`, nhân `1.3`. |
| `icebody` | Thân Băng Giá | *"Hồi phục 1/16 lượng HP tối đa mỗi lượt trong Mưa Đá."* | Chưa có trong `onEndTurn()` / `processEndTurnEffects()` và `isWeatherDamageImmune()`. | 1. Thêm `icebody` vào `isWeatherDamageImmune('hail')`.<br>2. Cuối mỗi lượt khi thời tiết là `hail`, hồi `Math.max(1, Math.floor(maxHp / 16))` HP. |

---

### 2.2. Đã triển khai MỘT PHẦN (thiếu nhánh phụ hoặc điều kiện)

| Ability ID | Phần đã hoạt động | Phần còn thiếu so với mô tả | Vị trí cần cập nhật |
|---|---|---|---|
| `sheerforce` (Lực Lượng Thuần Khiết) | Tăng 1.3x sát thương nếu chiêu có `move.statusEffect` hoặc `move.statChanges` lên đối thủ (`ability-engine.ts` L947–953). | 1. Chưa nhận diện chiêu có hiệu ứng phụ trong `FLINCH_MOVE_CHANCES` và `CONFUSION_MOVE_CHANCES`.<br>2. **Chưa loại bỏ hiệu ứng phụ**: `BattleEngine.executeAttack()` (L1538–1675) vẫn gây Burn/Para/Flinch/giảm chỉ số bình thường.<br>3. Khi chiêu được tăng sát thương bởi `sheerforce`, người dùng cầm `Life Orb` không bị trừ 10% HP phản đòn. | `ability-engine.ts`, `battle-engine.ts` (L1538–1675), `held-item-engine.ts` (L576) |
| `keeneye` (Mắt Sắc Lẹm) | Đã chặn giảm bậc Accuracy của bản thân (`ability-engine.ts` L1362). | Mô tả ghi: *"Ngăn bị giảm độ chính xác và bỏ qua né tránh của đối thủ."* Trong `checkMoveAccuracy()` (`move-effect-engine.ts` L232), chưa bỏ qua bậc Evasion dương (`evaStage > 0`) của mục tiêu. | `move-effect-engine.ts` (L228–240) |
| `serenegrace` (Thiên Ân) | Đã nhân đôi tỉ lệ gây Confusion và Flinch (`battle-engine.ts` L1626, L1655). | Chưa nhân đôi tỉ lệ `move.statusEffect.chance` (L1545) và `move.statChanges[].chance` (L1572) của các đòn tấn công gây sát thương. | `battle-engine.ts` (L1545, L1572) |
| `dryskin` (Da Khô) | Đã hấp thụ chiêu hệ Nước (+25% HP) và nhận 1.25x sát thương hệ Lửa (`ability-engine.ts` L716, L990). | Chưa có hiệu ứng thời tiết cuối lượt: hồi 1/8 HP khi Trời Mưa (`rain`) và mất 1/8 HP khi Nắng Gắt (`harsh_sunlight`). | `environment-damage.ts` hoặc `ability-engine.ts` (`onEndTurn`) |
| `trace` (Sao Chép Năng Lực) | Sao chép tên Ability của đối thủ khi vào sân (`ability-engine.ts` L454–471). | Nếu Ability vừa sao chép cũng là Ability kích hoạt khi vào sân (như `intimidate`, `download`, `drizzle`, `drought`...), hiệu ứng vào sân của Ability mới chưa được gọi nối tiếp. | `ability-engine.ts` (`onSwitchIn` L464) |

---

### 2.3. Đã có logic trong code nhưng THIẾU mô tả Tiếng Việt

Các Ability sau đã được lập trình hoạt động nhưng chưa được thêm vào `ABILITY_NAMES_VI` và `ABILITY_DESCRIPTIONS_VI` trong `apps/web/src/battle/rules/ability-engine.ts`:

- `steadfast` (Kiên Định — Tăng 1 bậc Speed khi bị Flinch, `status-engine.ts` L200)
- `skilllink` (Chuỗi Kỹ Năng — Chiêu đánh nhiều lần luôn đạt số lần tối đa 5 hit, `damage-calculator.ts` L703)
- `serenegrace` (Thiên Ân — Nhân đôi tỉ lệ xảy ra hiệu ứng phụ của chiêu, `battle-engine.ts` L1626)
- `stickyhold` (Bám Dính — Ngăn bị mất hoặc đánh cắp vật phẩm cầm tay, `damage-calculator.ts` L317, `battle-engine.ts` L1776)
- `dryskin` (Da Khô — Hấp thụ chiêu Nước, chịu thêm sát thương Lửa, `ability-engine.ts` L716)
- `surgesurfer` (Lướt Điện — Nhân đôi Speed trên Mặt Sân Điện, `environment-speed.ts` L38)
- `suctioncups` (Giác Hút — Miễn nhiễm bị ép đổi Pokémon khỏi sân, `move-effect-engine.ts` L950)

---

### 2.4. Có gán cho Pokémon trong `pokemon-db.json` / `regional-forms.json` nhưng chưa xử lý

Qua thống kê dữ liệu loài trong `packages/game-data/pokemon-db.json` và `packages/game-data/regional-forms.json`, có **115 Ability** đã được gán cho các loài Pokémon nhưng hiện chưa có nhánh xử lý trong `AbilityEngine`. Dưới đây là danh sách phân nhóm theo mức độ ưu tiên và tần suất xuất hiện:

#### Nhóm Ưu tiên Cao (Tần suất cao & Ảnh hưởng trực tiếp chiến thuật)
| Ability ID | Số loài sở hữu | Công dụng chuẩn cần cài đặt |
|---|---|---|
| `gluttony` | 12 | Ăn Pinch Berry sớm ở mức $\le 50\%$ HP thay vì $\le 25\%$ HP (`held-item-engine.ts`). |
| `magnetpull` / `arenatrap` / `shadowtag` | 10 / 2 / 4 | Ngăn đối thủ chạy trốn hoặc đổi Pokémon (Magnet Pull: hệ Steel; Arena Trap: Pokémon chạm đất; Shadow Tag: mọi Pokémon trừ Ghost/Shadow Tag). |
| `hustle` | 8 | Tăng 1.5x Attack vật lý nhưng giảm 20% Accuracy của các chiêu Physical. |
| `regenerator` | 8 | Hồi phục 1/3 Max HP khi rút lui khỏi sân (`BattleEngine.switchPlayerPokemon` / AI switch). |
| `unnerve` | 7 | Ngăn đối thủ ăn Berry khi Pokémon này đang ở trên sân. |
| `stench` | 7 | Các đòn tấn công gây sát thương có thêm 10% cơ hội làm đối thủ Flinch. |
| `analytic` | 7 | Tăng 1.3x sát thương nếu hành động sau mục tiêu trong lượt đó. |
| `tangledfeet` | 7 | Tăng gấp đôi khả năng né tránh (x2 Evasion) khi đang bị Confusion. |
| `angerpoint` | 6 | Tăng tối đa Attack (+6 bậc) khi nhận đòn Chí mạng (Critical Hit). |
| `poisontouch` | 6 | Khi tung đòn tiếp xúc, có 30% cơ hội gây trúng độc (`poison`) cho mục tiêu. |
| `rivalry` | 6 | Tăng 1.25x sát thương nếu cùng giới tính với mục tiêu; giảm 0.75x nếu khác giới tính. |
| `raindish` | 5 | Hồi 1/16 Max HP cuối mỗi lượt khi trời mưa (`rain`). |
| `weakarmor` | 5 | Khi trúng đòn vật lý: giảm 1 bậc Defense, tăng 2 bậc Speed. |
| `aftermath` | 4 | Khi bị hạ gục bởi đòn tiếp xúc, kẻ tấn công mất 1/4 Max HP. |
| `reckless` | 4 | Tăng 1.2x sát thương cho các chiêu có sát thương phản đòn (recoil) hoặc tự mất HP khi trượt (`high_jump_kick`, `jump_kick`). |
| `hydration` | 4 | Tự động chữa lành mọi trạng thái bất lợi chính ở cuối lượt nếu trời đang mưa (`rain`). |
| `leafguard` | 4 | Miễn nhiễm nhận trạng thái bất lợi chính khi trời nắng gắt (`harsh_sunlight`). |
| `cloudnine` / `airlock` | 4 | Vô hiệu hóa mọi hiệu ứng của thời tiết khi đang ở trên sân. |

#### Nhóm Ưu tiên Trung bình (Tương tác sát thương, xuyên giáp & phòng thủ)
| Ability ID | Số loài sở hữu | Công dụng chuẩn cần cài đặt |
|---|---|---|
| `solarpower` | 3 | Trong Nắng Gắt: tăng 1.5x Sp.Atk nhưng mất 1/8 Max HP cuối mỗi lượt. |
| `tintedlens` | 3 | Nhân đôi sát thương (2x) cho các đòn đánh không hiệu quả (`effectiveness < 1`). |
| `infiltrator` | 3 | Đòn tấn công bỏ qua `Reflect`, `Light Screen`, `Aurora Veil`, `Safeguard`, `Mist` và `Substitute` của đối thủ. |
| `noguard` | 3 | Mọi chiêu thức do Pokémon này tung ra hoặc nhắm vào Pokémon này đều luôn trúng đích (100% Accuracy). |
| `scrappy` | 3 | Cho phép chiêu hệ Normal và Fighting đánh trúng hệ Ghost (với hệ số 1x), đồng thời miễn nhiễm `Intimidate`. |
| `galvanize` / `pixilate` | 3 / 1 | Đổi các chiêu hệ Normal thành hệ Electric (`galvanize`) hoặc Fairy (`pixilate`) và tăng 1.2x sát thương. |
| `marvelscale` | 2 | Tăng 1.5x Defense khi đang mang trạng thái bất lợi chính. |
| `toughclaws` | 2 | Tăng 1.3x sát thương cho mọi đòn đánh tiếp xúc (`isContactMove`). |
| `furcoat` | 2 | Nhân đôi chỉ số Defense vật lý (2x Defense) khi nhận đòn Physical. |
| `magicbounce` | 1 | Phản ngược các chiêu Status gây bất lợi, hạ chỉ số hoặc rải bẫy về phía kẻ tung chiêu. |
| `unaware` | 1 | Bỏ qua mọi bậc tăng/giảm chỉ số của đối thủ khi tính sát thương tấn công hoặc phòng thủ. |
| `unburden` | 1 | Nhân đôi Speed (2x) sau khi sử dụng hoặc bị mất vật phẩm cầm tay. |
| `moldbreaker` | 1 | Bỏ qua các Ability phòng thủ/miễn nhiễm của mục tiêu khi tấn công. |
| `sharpness` | 1 | Tăng 1.5x sát thương cho các chiêu chém (Slicing moves: `slash`, `night_slash`, `psycho_cut`, `leaf_blade`, `air_slash`, `x_scissor`, `sacred_sword`, `aerial_ace`, `fury_cutter`, `razor_leaf`, `solar_blade`, `aqua_cutter`, `ceaseless_edge`...). |
| `imposter` | 1 | Khi vào sân (Ditto), tự động biến hình (`Transform`) thành Pokémon đối diện. |

---

## 3. Nhóm 2: Chiêu thức & Cơ chế Chiến đấu (Moves & Combat Rules)

### 3.1. Chiêu thức đang dùng logic tạm (Placeholder / Partial)

| Chiêu thức | Vị trí hiện tại | Hiện trạng | Logic chuẩn cần hoàn thiện |
|---|---|---|---|
| **Nhóm biến thể Protect**:<br>`spiky_shield`, `baneful_bunker`, `kings_shield`, `obstruct`, `silk_trap`, `burning_bulwark` | `move-effect-engine.ts` (L85–95)<br>`battle-engine.ts` (L701–795) | Tất cả đều được gộp chung vào `PROTECT_MOVE_IDS` và chỉ chặn đòn như `protect` thường. | Lưu loại khiên vào `protectVariant`:<br>- `spiky_shield`: Nếu đối thủ dùng đòn tiếp xúc, gây sát thương bằng 1/8 Max HP của kẻ tấn công.<br>- `baneful_bunker`: Đòn tiếp xúc làm kẻ tấn công bị `poison`.<br>- `burning_bulwark`: Đòn tiếp xúc làm kẻ tấn công bị `burn`.<br>- `kings_shield`: Chỉ chặn đòn gây sát thương; đòn tiếp xúc làm giảm 1 bậc Attack của kẻ tấn công.<br>- `obstruct`: Chỉ chặn đòn gây sát thương; đòn tiếp xúc làm giảm 2 bậc Defense.<br>- `silk_trap`: Chỉ chặn đòn gây sát thương; đòn tiếp xúc làm giảm 1 bậc Speed. |
| `counter`, `mirror_coat`, `metal_burst` | `damage-calculator.ts` (L581–586) | Đang gán cứng `effectivePower = 90` như một đòn tấn công thường. | Theo dõi `lastDamageTakenThisTurn: { amount: number; category: 'Physical' \| 'Special'; fromSide: 'player' \| 'opponent' }`:<br>- `counter` (Priority -5): Phản lại `2 * amount` sát thương cố định nếu vừa nhận đòn `Physical`.<br>- `mirror_coat` (Priority -5): Phản lại `2 * amount` sát thương cố định nếu vừa nhận đòn `Special`.<br>- `metal_burst` (Priority 0): Phản lại `1.5 * amount` sát thương cố định nếu vừa nhận đòn bất kỳ trong lượt. |
| `lunar_dance` | `battle-engine.ts` (L108) | Đã khai báo trong `NON_TARGETING_STATUS_MOVES` cùng `healing_wish` nhưng chưa có nhánh xử lý trong `applyStatusCategoryMove()`. | Giống `healing_wish` (người dùng hy sinh HP về 0, kích hoạt cờ cho Pokémon vào sân kế tiếp), nhưng ngoài việc hồi đầy 100% HP và xóa Status, còn **hồi đầy toàn bộ PP** cho mọi chiêu của Pokémon được đưa vào thay thế. |
| `copycat` | `battle-controller.ts` (L969–974) | Đã có hàm `resolveCopiedMoveAnimation()` ở tầng UI để lấy hoạt ảnh chiêu trước đó, nhưng trong `BattleEngine.executeAttack()` chưa chuyển đổi chiêu thực thi sang `lastMoveUsedInBattle`. | Lưu `this.lastExecutedMove` trong `BattleEngine`. Khi tung `copycat`, lấy chiêu vừa được thực thi gần nhất trên sân (trừ Protect/Copycat/Struggle) và gọi thực thi chiêu đó. |

---

### 3.2. Chiêu thức thiếu trường dữ liệu trong `moves-db.json`

Các chiêu dưới đây có mô tả hiệu ứng rõ ràng trong `packages/game-data/moves-db.json` nhưng bị khuyết trường cấu trúc hoặc rule tương ứng:

1. **Thiếu `statChanges` tăng Né tránh (`evasion`)**:
   - `double_team` (Phân Thân — TM32): Mô tả *"Creates illusory copies to heighten evasiveness"* nhưng chưa có `statChanges: [{ stat: 'evasion', stages: 1, target: 'self', chance: 100 }]`.
   - `minimize` (Thu Nhỏ): Mô tả *"sharply boost its evasiveness"* nhưng chưa có `statChanges: [{ stat: 'evasion', stages: 2, target: 'self', chance: 100 }]`.
2. **Thiếu `statusEffect` gây Ngủ (`sleep`)**:
   - `lovely_kiss`, `grass_whistle`, `dark_void`: Đều là chiêu `Status` gây ngủ nhưng thiếu `"statusEffect": { "condition": "sleep", "chance": 1, "target": "opponent" }` trong `moves-db.json`.
3. **Chiêu luôn Chí mạng (Always Critical Hit)**:
   - `frost_breath`, `storm_throw`, `flower_trick`, `wicked_blow`, `surging_strikes`, `zippy_zap`: Mô tả *"always results in a critical hit"* nhưng trong `damage-calculator.ts` (L624–630) chưa có tập `ALWAYS_CRIT_MOVES`.
4. **Chiêu tự mất HP / Recoil đặc biệt**:
   - `mind_blown`, `steel_beam`, `chloroblast`: Người dùng tự mất 50% Max HP khi tung chiêu.
   - `light_of_ruin`: Phản đòn 50% sát thương gây ra (`recoilPercent: 50`).

---

### 3.3. Chiêu thức học được / TM có quy tắc đặc biệt chưa cài đặt

Rà soát toàn bộ tập chiêu thức mà Pokémon có thể học qua Level-up (`pokemon-db.json`) và danh sách TM (`moves-db.json`), các chiêu có cơ chế đặc thù sau cần được bổ sung vào `damage-calculator.ts` và `battle-engine.ts`:

| Chiêu thức | Loại | Quy tắc chuẩn cần bổ sung |
|---|---|---|
| `false_swipe` (TM54 / TM057) | Physical | Luôn chừa lại tối thiểu `1 HP` cho mục tiêu (`damage = Math.min(damage, defender.currentHp - 1)` nếu `defender.currentHp >= 1`). Rất quan trọng khi đi bắt Pokémon hoang dã! |
| `brick_break` (TM31 / TM058) & `psychic_fangs` (TM063) | Physical | Trước khi tính sát thương, phá hủy hoàn toàn `Reflect`, `Light Screen` và `Aurora Veil` bên sân đối thủ. |
| `hex` (TM029) | Special | Nhân đôi Base Power (65 $\rightarrow$ 130) nếu mục tiêu đang có trạng thái bất lợi chính (`defender.status !== 'none'`). |
| `acrobatics` (TM014 / TM62) | Physical | Nhân đôi Base Power (55 $\rightarrow$ 110) nếu người dùng không cầm vật phẩm (`!attacker.heldItem`). |
| `psyshock` (TM03 / TM054) & `psystrike` | Special | Dùng chỉ số `Sp.Atk` của người tấn công nhưng tính vào chỉ số `Defense` vật lý của mục tiêu thay vì `Sp.Def`. |
| `body_press` (TM089) | Physical | Dùng chỉ số `Defense` (kèm bậc stage Defense) của người tấn công thay cho `Attack` khi tính sát thương. |
| `foul_play` (TM062) | Physical | Dùng chỉ số `Attack` (kèm bậc stage Attack) của **mục tiêu** thay cho `Attack` của người tấn công. |
| `bolt_beak` & `fishious_rend` | Physical | Nhân đôi Base Power (85 $\rightarrow$ 170) nếu người dùng đánh trước mục tiêu trong lượt đó. |
| `payback` & `avalanche` | Physical | Nhân đôi Base Power (50 $\rightarrow$ 100 / 60 $\rightarrow$ 120) nếu người dùng hành động sau hoặc đã nhận sát thương từ mục tiêu trong lượt. |
| `stomping_tantrum` & `temper_flare` | Physical | Nhân đôi Base Power (75 $\rightarrow$ 150) nếu chiêu thức ở lượt liền trước của người dùng bị trượt hoặc thất bại. |
| `lash_out` | Physical | Nhân đôi Base Power (75 $\rightarrow$ 150) nếu người dùng vừa bị giảm chỉ số trong lượt này. |
| `freeze_dry` | Special | Chiêu hệ Ice nhưng **Super Effective (2x)** lên hệ Water (thay vì 0.5x). |
| `flying_press` | Physical | Chiêu hệ Fighting nhưng tính tương khắc hệ kết hợp cả **Fighting lẫn Flying**. |

---

### 3.4. Chiêu thức Status học được chưa có nhánh xử lý trong `applyStatusCategoryMove`

Trong `move-effect-engine.ts` (`applyStatusCategoryMove`), khi một chiêu `category === 'Status'` không có `statusEffect` hay `statChanges` trong JSON và cũng không nằm trong các nhánh `if` hiện tại, hàm sẽ trả về *"Chiêu thức không có tác dụng!"*. Các chiêu học được phổ biến cần bổ sung nhánh xử lý gồm:

| Nhóm hiệu ứng | Danh sách chiêu thức | Logic thực thi |
|---|---|---|
| **Màn chắn & Dọn sân** | `aurora_veil` (TM70), `defog` | - `aurora_veil`: Chỉ dùng được khi đang có `hail`; tạo màn chắn giảm 50% cả sát thương Physical lẫn Special trong 5 lượt (8 lượt nếu cầm `Light Clay`).<br>- `defog`: Giảm 1 bậc Evasion của mục tiêu, xóa toàn bộ Screen bên sân mục tiêu và xóa toàn bộ Entry Hazards + Terrain trên cả hai bên sân. |
| **Lời nguyền & Diệt vong** | `curse` (TM224), `perish_song`, `nightmare`, `destiny_bond` | - `curse`: Nếu người dùng hệ Ghost $\rightarrow$ hy sinh 50% Max HP để nguyền đối thủ mất 1/4 Max HP mỗi lượt; nếu không phải hệ Ghost $\rightarrow$ `-1 Speed`, `+1 Attack`, `+1 Defense`.<br>- `perish_song`: Cả 2 Pokémon trên sân nhận đếm ngược 3 lượt; về 0 sẽ ngất xỉu nếu không đổi ra.<br>- `destiny_bond`: Nếu người dùng bị hạ gục trước lượt hành động kế tiếp, kẻ đánh gục cũng ngất xỉu. |
| **Sao chép & Hoán đổi chỉ số/hệ/kỹ năng** | `psych_up` (TM77/TM203), `power_swap`, `speed_swap`, `heart_swap`, `skill_swap` (TM098), `role_play`, `worry_seed`, `soak`, `reflect_type`, `conversion` | - `psych_up`: Sao chép toàn bộ `statStages` của đối thủ sang bản thân.<br>- `power_swap` / `speed_swap` / `heart_swap`: Hoán đổi các bậc tăng giảm chỉ số tương ứng với đối thủ.<br>- `skill_swap`: Hoán đổi `ability` giữa người dùng và mục tiêu.<br>- `soak`: Đổi hệ của mục tiêu thành thuần `Water` trong trận.<br>- `reflect_type`: Đổi hệ của bản thân giống hệt hệ của mục tiêu. |
| **Hỗ trợ & Điểm huyệt** | `acupressure`, `lock_on`, `mind_reader`, `laser_focus`, `magnet_rise`, `charge` | - `acupressure`: Tăng 2 bậc cho 1 chỉ số ngẫu nhiên chưa đạt +6.<br>- `lock_on` / `mind_reader`: Đòn đánh ở lượt kế tiếp luôn trúng đích.<br>- `laser_focus`: Đòn đánh ở lượt kế tiếp luôn Chí mạng.<br>- `magnet_rise`: Miễn nhiễm hệ Ground trong 5 lượt. |
| **Biến hình & Bắt chước** | `transform`, `mimic`, `mirror_move`, `spite` (TM177), `attract` (TM45), `heal_block`, `embargo` (TM63) | - `transform`: Sao chép stats (trừ HP), moves (5 PP mỗi chiêu), types, ability, statStages của mục tiêu.<br>- `spite`: Trừ 4 PP vào chiêu cuối cùng mục tiêu vừa sử dụng.<br>- `attract`: Gây trạng thái `infatuated` nếu khác giới tính. |

---

## 4. Nhóm 3: Vật phẩm & Pokéball (Items & Pokéballs)

### 4.1. Hệ số bắt Pokémon theo điều kiện của Pokéball (`pokeball-db.ts`)

**Hiện trạng**:
1. Trong `apps/web/src/battle/pokeball-db.ts` (dòng 269–288), hàm `getEffectiveCatchRate()` đang có comment:
   ```ts
   // TODO: Implement special condition checks based on context
   // For now, return base catch rate
   return ball.catchRateModifier;
   ```
2. Trong `apps/web/src/battle/battle-controller.ts` (dòng 1547), hàm `handleThrowBall()` đang gọi `getBaseCatchRate(ballId)` thay vì truyền ngữ cảnh trận đấu vào `getEffectiveCatchRate(ballId, context)`.

**Bảng công thức cần triển khai trong `getEffectiveCatchRate(ballId, context)`**:

| Ball ID | `catchRateModifier` mặc định | Điều kiện kích hoạt đặc biệt | Hệ số thực tế khi thỏa điều kiện |
|---|---|---|---|
| `quick-ball` | `1.0` | Tung ngay ở lượt đầu tiên của trận đấu (`turnCount <= 1`) | **`5.0x`** |
| `timer-ball` | `1.0` | Tăng dần theo số lượt đã qua | `Math.min(4.0, 1 + turnCount * 0.3)` (Tối đa **`4.0x`**) |
| `nest-ball` | `1.0` | Mục tiêu có cấp độ thấp (`targetLevel < 30`) | `Math.max(1.0, (41 - targetLevel) / 10)` (Tối đa **`4.0x`**) |
| `net-ball` | `1.0` | Mục tiêu mang hệ `Water` hoặc `Bug` | **`3.5x`** |
| `dive-ball` | `1.0` | Trận đấu diễn ra trên mặt nước / câu cá (`isWaterTerrain`) | **`3.5x`** |
| `dusk-ball` | `1.0` | Ban đêm hoặc trong hang động (`isNightOrCave`) | **`3.0x`** |
| `dream-ball` | `1.0` | Mục tiêu đang ngủ (`targetStatus === 'sleep'`) | **`4.0x`** |
| `love-ball` | `1.0` | Cùng loài (`speciesId`) và khác giới tính với Pokémon đang đứng sân của người chơi | **`8.0x`** |
| `level-ball` | `1.0` | So sánh `playerLevel` với `targetLevel` | $\ge 4\times$: **`8.0x`**; $\ge 2\times$: **`4.0x`**; $> 1\times$: **`2.0x`** |
| `fast-ball` | `1.0` | Loài mục tiêu có `baseStats.speed >= 100` | **`4.0x`** |
| `repeat-ball` | `1.0` | Loài mục tiêu đã từng được đăng ký `caught` trong Pokédex | **`3.5x`** |
| `heal-ball` | `1.0` | Sau khi bắt thành công | Hồi đầy 100% HP, PP và xóa Status cho Pokémon vừa bắt |
| `luxury-ball` / `friend-ball` | `1.0` | Sau khi bắt thành công | Thiết lập `friendship = 200` (`friend-ball`) hoặc gắn `caughtBall = 'luxury-ball'` |

---

### 4.2. Vật phẩm sử dụng trong túi đồ (`item-effects.ts`)

1. **`ability-capsule` & `ability-patch` (`apps/web/src/domain/inventory/item-effects.ts` L760–767)**:
   - **Hiện trạng**: Nhánh `case 'ability-capsule': case 'ability-patch':` chỉ kiểm tra `if (!pokemon.ability)` rồi trả về `SUCCESS` mà **không hề đổi Ability** của Pokémon, dẫn đến người chơi bị trừ vật phẩm nhưng Ability giữ nguyên.
   - **Hướng sửa**:
     - Tra cứu `speciesData.abilities` từ `pokemon-db.json` (hoặc `regional-forms.json` nếu có `formId`).
     - Với `ability-capsule`: Nếu Pokémon đang ở `primary` và loài có `secondary` khác `primary`, chuyển sang `secondary` (và ngược lại). Nếu loài chỉ có 1 Ability thường hoặc đang dùng `hidden` ability, trả về `ERR_NO_EFFECT` (không tiêu hao item).
     - Với `ability-patch`: Nếu loài có `abilities.hidden` và Pokémon chưa mang `hidden`, chuyển `pokemon.ability = abilities.hidden` và `pokemon.abilitySlot = 'hidden'`.
2. **`guard-spec` (`apps/web/src/domain/inventory/item-catalog-effects.ts` L270–271 & `item-effects.ts` L942–1041)**:
   - **Hiện trạng**: Đã khai báo trong `ITEM_EFFECT_REGISTRY` với `targetScope: 'battler'`, nhưng trong `applyItemToBattler()` chưa có nhánh xử lý cho `'guard-spec'`, khiến việc dùng trong trận trả về `ERR_NO_EFFECT`.
   - **Hướng sửa**: Trong `applyItemToBattler()` và `BattleController.handleUseItem()`, kích hoạt trạng thái `mistTurns = 5` cho phe người chơi (ngăn đối thủ hạ chỉ số trong 5 lượt).

---

### 4.3. Vật phẩm cầm tay trong trận đấu (`held-item-engine.ts`)

| Vật phẩm | Hiện trạng | Hướng hoàn thiện |
|---|---|---|
| `assault-vest` (Áo Giáp Tấn Công) | Đã có tên Tiếng Việt tại `getHeldItemDisplayName()` (`held-item-engine.ts` L57) nhưng chưa có hiệu ứng trong `getStatMultiplier()` và chưa chặn chiêu Status. | 1. Trong `HeldItemEngine.getStatMultiplier()`, nếu `stat === 'spDef'` và cầm `assault-vest`, trả về `1.5`.<br>2. Trong `BattleEngine`, chặn người cầm `assault-vest` chọn/thực thi các chiêu `category === 'Status'` (tương tự `Taunt`). |
| `choice-band`, `choice-specs`, `choice-scarf` | Đã nhân `1.5x` cho `Attack`, `Sp.Atk`, `Speed` tương ứng (`held-item-engine.ts` L483–485), nhưng **chưa khóa chiêu (Choice Lock)**. | Thêm trường `choiceLockedMoveId?: string` trên `BattlePokemon`. Khi Pokémon đang cầm Choice item thực thi chiêu đầu tiên sau khi vào sân, gán `choiceLockedMoveId = move.id`. Chỉ cho phép chọn chiêu đó cho tới khi đổi ra hoặc mất item. |
| `eviolite` (Đá Tiến Hóa) | Đang tăng `1.5x` Defense & Sp.Def cho **mọi** Pokémon cầm nó (`held-item-engine.ts` L486–489). | Kiểm tra dữ liệu loài trong `pokemon-db.json`: chỉ tăng `1.5x` nếu loài đó có `evolutions.length > 0` (chưa ở bậc tiến hóa cuối cùng). |
| Vật phẩm tăng sát thương hệ Fairy (`pixie-plate` / `fairy-feather`) | `TYPE_BOOSTING_ITEMS` (`held-item-engine.ts` L90–108) đã có đủ 17 hệ nhưng thiếu hệ `fairy`. | Thêm `'pixie-plate': 'fairy'` và `'fairy-feather': 'fairy'` vào `TYPE_BOOSTING_ITEMS`. |

---

## 5. Nhóm 4: Các cơ chế phụ thuộc vào hệ thống NPC & Hệ thống ngoài chưa xây dựng (System-Dependent / Blocked)

Một số chiêu thức, Ability, vật phẩm và luật chiến đấu hiện **chưa thể phát huy hết công năng hoặc chưa thể kích hoạt** vì hệ thống nền tảng bên ngoài trận đấu (đặc biệt là **Hệ thống NPC trên bản đồ & NPC Huấn luyện viên**, Đấu đôi, Tiền tệ, Độ thân thiện...) chưa được xây dựng.

Dưới đây là bảng phân tích chi tiết các điểm phụ thuộc để làm cơ sở thiết kế **Hệ thống NPC (NPC System Architecture)**:

### 5.1. Phụ thuộc Hệ thống NPC Huấn luyện viên & Đội hình đối thủ (Trainer Battles & Enemy Party)
- **Hiện trạng hệ thống**:
  - Thế giới hiện tại mới có **Pokémon hoang dã (Wild Pokémon)** (`isWild = true`, chỉ có duy nhất 1 `enemyPokemon`, chưa có `enemyParty: BattlerPokemon[]` hay thực thể NPC Trainer trên bản đồ).
  - Trong `BattleEngine`, biến `isWild` đã được khai báo (`battle-engine.ts` L155), nhưng toàn bộ luồng kết thúc trận, tung bóng, chạy trốn và đổi Pokémon mới chỉ phục vụ đấu hoang dã 1v1.
- **Các quy tắc & cơ chế chiến đấu đang chờ Hệ thống NPC Trainer**:
  1. **Luật Cấm Bắt & Cấm Chạy Trốn trong đấu NPC (`isWild === false`)**:
     - Chặn tung Pokéball trong trận đấu với NPC (*"Không thể bắt Pokémon của Huấn luyện viên khác!"* — bóng bị NPC đánh bật ra).
     - Chặn nút `Run / Bỏ chạy` (kể cả khi có Ability `runaway` hay cầm `smoke-ball` — *"Không thể bỏ chạy khỏi trận đấu với Huấn luyện viên!"*).
  2. **Đội hình nhiều Pokémon của NPC (`enemyParty: BattlerPokemon[]`) & Thanh hiển thị số bóng (Party Ball HUD)**:
     - Khi 1 Pokémon của NPC ngất xỉu (`enemyPokemon.isFainted`), trận đấu **chưa kết thúc** nếu trong `enemyParty` vẫn còn Pokémon sống; NPC sẽ tung Pokémon tiếp theo ra sân và kích hoạt `AbilityEngine.onSwitchIn()` + `applyEntryHazards()`.
     - Kích hoạt tính toán `faintedAlliesCount` thực tế cho phía NPC (phục vụ Ability `supremeoverlord` và chiêu `last_respects`).
     - Hỗ trợ `healing_wish`, `lunar_dance`, `revival_blessing`, `baton_pass`, `u_turn`, `volt_switch`, `parting_shot`, `teleport`, `chilly_reception`, `shed_tail` cho cả phía NPC.
  3. **Bẫy sân đấu (Entry Hazards: `stealth_rock`, `spikes`, `toxic_spikes`, `sticky_web`)**:
     - Logic trong `hazard-engine.ts` đã cài đặt xong, nhưng do đối thủ hoang dã chỉ có 1 Pokémon và không bao giờ đổi Pokémon vào sân (`switchIn`), bẫy rải sang sân đối thủ hiện chưa có cơ hội nổ. Khi có NPC nhiều Pokémon, bẫy sân đấu mới thực sự phát huy giá trị chiến thuật.
  4. **Chiêu thức & Vật phẩm ép đổi Pokémon (`roar`, `whirlwind`, `dragon_tail`, `circle_throw`, `red-card`, `eject-button`, `eject-pack`)**:
     - Trong đấu hoang dã, các chiêu này chỉ kết thúc trận đấu (đuổi Pokémon đi).
     - Trong đấu NPC Trainer, các chiêu này sẽ **kéo ngẫu nhiên 1 Pokémon còn sống khác trong `enemyParty` ra sân** (và ép dẫm Entry Hazards).
  5. **AI Chiến thuật của NPC (Trainer AI & Item Usage)**:
     - AI của NPC biết chủ động đổi Pokémon khi bị khắc hệ nặng hoặc khi bị dính `perish_song` / `curse` / khóa chiêu xấu.
     - Kích hoạt các cơ chế săn đuổi khi đổi quân: chiêu `pursuit` (nhân đôi sát thương khi đối thủ rút lui), Ability `regenerator` (hồi 1/3 HP khi rút lui), `naturalcure` (xóa status khi rút lui), và các Ability khóa chân không cho NPC đổi quân (`magnetpull`, `arenatrap`, `shadowtag`).
     - NPC Trainer cấp cao (Gym Leader, Rival, Boss) có túi vật phẩm riêng (`Full Restore`, `Hyper Potion`, `X Attack`...) để dùng trong lượt thay vì tấn công.

### 5.2. Phụ thuộc Hệ thống NPC Chức năng tại Làng Khởi Đầu & Thế giới (Overworld Functional NPCs)
- **Hiện trạng hệ thống**: Làng Khởi Đầu (`start-village.ts`) đã có đầy đủ công trình kiến trúc (Viện nghiên cứu Tiến sĩ Okido, Nhà Player, Nhà Rival, Chuồng trại chăn nuôi, Nhà dân), nhưng chưa có thực thể NPC tương tác:
  1. **NPC Tiến sĩ Okido (Prof. Oak)**: Sự kiện cốt truyện nhận Starter Pokémon, Pokédex, tặng Pokéball khởi đầu và đánh giá tiến độ Pokédex.
  2. **NPC Đối thủ (Rival)**: Đấu chuỗi trận Trainer Battle theo cấp độ phát triển của người chơi.
  3. **NPC Y tá / Mẹ nhân vật chính (Healer NPC)**: Hồi phục 100% HP, PP và xóa Status cho toàn bộ `partyService` (thay thế hoặc bổ trợ cho thao tác hồi máu tạm).
  4. **NPC Chủ trại chăn nuôi / Daycare (Breeder NPC)**: Giao diện gửi/nhận Pokémon sinh sản trực tiếp tại khu chuồng trại trong làng, tặng Trứng hiếm hoặc vật phẩm chăn nuôi (`everstone`, `destiny-knot`).
  5. **NPC Thương nhân / Cửa hàng (PokéMart Merchant NPC)**: Mua bán Pokéball, Potion, Status Heal, TM, Evolution Stone bằng tiền tệ trong game.
  6. **NPC Dạy chiêu / Nhớ chiêu (Move Tutor & Move Reminder NPC)**: Học lại chiêu cấp thấp hoặc dạy chiêu đặc biệt (như `fire_pledge`, `water_pledge`, `grass_pledge`, `frenzy_plant`, `blast_burn`, `hydro_cannon`, `draco_meteor`).

### 5.3. Phụ thuộc Hệ thống Tiền tệ (PokéDollar) & Phần thưởng sau trận đấu
- **Hiện trạng hệ thống**: Chưa có ví tiền của người chơi (`money`) và chưa có bảng thưởng tiền khi thắng NPC Trainer.
- **Các cơ chế trong Battle đang chờ**:
  1. **Chiêu thức tạo tiền**: `pay_day` (Rải Tiền — rớt số tiền bằng $5 \times \text{Level}$ mỗi lần đánh trúng, nhặt sau khi thắng trận), `happy_hour` (nhân đôi tiền thưởng cuối trận), `make_it_rain` (rải tiền vàng).
  2. **Vật phẩm nhân đôi tiền thưởng**: `amulet-coin` (Đồng Xu Hộ Mệnh) và `luck-incense` — nếu Pokémon cầm vật phẩm này có tham chiến ít nhất 1 lượt, nhân đôi toàn bộ tiền thưởng từ NPC Trainer và `pay_day`.
  3. **Ability nhặt vật phẩm sau trận**: `pickup` (10% cơ hội nhặt được 1 vật phẩm ngẫu nhiên sau khi thắng trận nếu chưa cầm đồ), `honeygather` (nhặt Mật Ong sau trận).

### 5.4. Phụ thuộc Hệ thống Đấu Đôi / Đồng đội đứng cùng sân (Double / Multi Battles — NPC Tag Battle)
- **Hiện trạng hệ thống**: `BattleEngine` hiện được thiết kế cho **Đấu Đơn 1v1** (`playerPokemon` vs `enemyPokemon`).
- **Các cơ chế chưa thể kích hoạt cho đến khi có Đấu Đôi (2v2)**:
  1. **Abilities hỗ trợ đồng đội đứng cạnh**: `healer` (30% chữa status cho đồng đội cuối lượt), `friendguard` (giảm 25% sát thương đồng đội nhận), `telepathy` (miễn nhiễm đòn đánh lan của đồng đội như `earthquake`, `surf`, `discharge`), `battery` (+30% sát thương Special cho đồng đội), `powerspot` (+30% sát thương cho đồng đội), `steelyspirit` (+50% sát thương hệ Steel cho cả bản thân và đồng đội), `plus` / `minus`, `symbiosis`, `hospitality`, `commander`.
  2. **Chiêu thức hỗ trợ / bảo vệ đồng đội**: `helping_hand`, `follow_me`, `rage_powder`, `spotlight`, `wide_guard`, `quick_guard`, `mat_block`, `crafty_shield`, `heal_pulse`, `floral_healing`, `aromatic_mist`, `coaching`, `decorate`, `after_you`, `instruct`, `ally_switch` (hiện chỉ có hiệu ứng lướt đổi chỗ mặt hình ảnh), và combo 2 chiêu Pledge cùng lượt (`fire_pledge` + `water_pledge` + `grass_pledge`).

### 5.5. Phụ thuộc Hệ thống Độ Thân Thiện (Friendship / Happiness)
- **Hiện trạng hệ thống**: `pokemon-db.json` đã có trường `baseFriendship`, nhưng `PartyPokemon` và `BattlerPokemon` chưa lưu trữ trường `friendship` (0–255) và chưa có bộ đếm tăng giảm khi đi bộ / lên cấp / dùng thuốc đắng / ngất xỉu.
- **Các cơ chế đang chờ**:
  1. **Chiêu thức tính sát thương theo Friendship**: `return` (Báo Ân — $\text{Power} = \lfloor \text{Friendship} / 2.5 \rfloor$, tối đa 102), `frustration` (Oán Giận — $\text{Power} = \lfloor (255 - \text{Friendship}) / 2.5 \rfloor$, tối đa 102), `pika_papow`, `veevee_volley`.
  2. **Pokéball & Item liên quan Friendship**: `friend-ball` (đặt Friendship = 200 ngay khi bắt), `luxury-ball` (nhân đôi tốc độ tăng Friendship), `soothe-bell` (Chuông An Ủi — x1.5 điểm Friendship nhận được), nhóm Berry giảm EV tăng Friendship (`pomeg-berry`, `kelpsy-berry`, `qualot-berry`, `hondew-berry`, `grepa-berry`, `tamato-berry`).
  3. **Hiệu ứng chiến đấu theo Friendship cao ($\ge 220$)**: Tự trụ lại 1 HP (tương tự Endure), tự rũ bỏ trạng thái bất lợi cuối lượt, tăng tỉ lệ Critical Hit.

### 5.6. Phụ thuộc Hệ thống Đồ Cầm Tay của Pokémon Hoang Dã (Wild Held Items) & Đồng bộ `weight`/`gender`
- **Hiện trạng hệ thống**:
  1. **Wild Held Items**: Khi `createBattler()` tạo Pokémon hoang dã, trường `heldItem` luôn để trống (`undefined`). Vì vậy các chiêu/Ability như `thief` (Ăn Trộm), `covet`, `trick`, `switcheroo`, `knock_off` (Đánh Rơi), `frisk` (Soi Đồ), `pickpocket`, `magician`, `unnerve`, `compoundeyes` (tăng tỉ lệ Pokémon hoang dã cầm đồ từ 50%/5% lên 60%/20%) hiện chỉ có tác dụng một chiều (đối thủ tác động lên đồ của người chơi, còn người chơi dùng lên Pokémon hoang dã sẽ không lấy được đồ). Khi có **NPC Trainer cầm Held Item chiến thuật** hoặc bổ sung bảng **Wild Held Item**, nhóm chiêu này sẽ hoạt động đủ hai chiều.
  2. **Đồng bộ `weight` và `genderRatio` trong `createBattler()` (`battle-factory.ts`)**: Dữ liệu `weight` và `genderRatio` đã có sẵn trong `pokemon-db.json`, nhưng `createBattler()` và `partyPokemonToBattler()` chưa gán `weight: data.weight` sang `BattlerPokemon`, làm cho `heavy-ball`, `low_kick`, `grass_knot`, `heavy_slam`, `heat_crash` chưa có số liệu cân nặng thực tế để tính. *(Phần này có thể khắc phục ngay trong Phase 1 mà không cần chờ hệ thống mới).*

---

## 6. Lộ trình triển khai đề xuất (Phases) & Tiêu chí nghiệm thu

Để đảm bảo an toàn cho hệ thống chiến đấu và khớp với kế hoạch phát triển NPC của dự án, lộ trình được chia thành **5 Phase**:

### Phase 1: Hoàn thiện Vật phẩm, Pokéball, Đồng bộ `weight`/`gender` & Các Ability đã có mô tả (Dùng ngay cho Wild Battle)
- [ ] **1.1.** Đồng bộ `weight` và `genderRatio` chuẩn từ `pokemon-db.json` vào `createBattler()` và `partyPokemonToBattler()`.
- [ ] **1.2.** Hoàn thiện `getEffectiveCatchRate()` trong `pokeball-db.ts` và truyền đầy đủ `CatchContext` từ `battle-controller.ts` (Quick Ball, Timer Ball, Nest Ball, Net Ball, Dusk Ball, Dive Ball, Dream Ball, Fast Ball, Level Ball, Love Ball, Heavy Ball, Repeat Ball, Heal Ball).
- [ ] **1.3.** Sửa lỗi `ability-capsule`, `ability-patch` và `guard-spec` trong `item-effects.ts` + `battle-controller.ts`.
- [ ] **1.4.** Hoàn thiện `assault-vest`, khóa chiêu `choice-band/specs/scarf`, điều kiện tiến hóa của `eviolite` và bổ sung `fairy` vào `TYPE_BOOSTING_ITEMS` trong `held-item-engine.ts`.
- [ ] **1.5.** Cài đặt đầy đủ 6 Ability đã có mô tả Tiếng Việt (`cutecharm`, `cursedbody`, `earlybird`, `runaway`, `sandforce`, `icebody`) và hoàn thiện phần thiếu của `sheerforce`, `keeneye`, `serenegrace`, `dryskin`, `trace`.
- [ ] **1.6.** Bổ sung tên & mô tả Tiếng Việt cho 7 Ability đã có code (`steadfast`, `skilllink`, `serenegrace`, `stickyhold`, `dryskin`, `surgesurfer`, `suctioncups`).

### Phase 2: Hoàn thiện Cơ chế Chiêu thức Đặc biệt & Dữ liệu `moves-db.json` (Dùng ngay cho 1v1)
- [ ] **2.1.** Cập nhật dữ liệu thiếu trong `moves-db.json` (`double_team`, `minimize`, `lovely_kiss`, `grass_whistle`, `dark_void`).
- [ ] **2.2.** Triển khai các biến thể `Protect` có phản đòn tiếp xúc (`spiky_shield`, `baneful_bunker`, `kings_shield`, `obstruct`, `silk_trap`, `burning_bulwark`).
- [ ] **2.3.** Triển khai cơ chế phản sát thương thực tế cho `counter`, `mirror_coat`, `metal_burst`.
- [ ] **2.4.** Triển khai các quy tắc sát thương đặc biệt: `false_swipe` (chừa 1 HP), `brick_break` / `psychic_fangs` (phá màn chắn), `hex`, `acrobatics`, `psyshock` / `psystrike`, `body_press`, `foul_play`, `bolt_beak` / `fishious_rend`, `payback` / `avalanche`, `freeze_dry`, và nhóm `ALWAYS_CRIT_MOVES`.

### Phase 3: Mở rộng Chiêu thức Status Chiến thuật (`move-effect-engine.ts`)
- [ ] **3.1.** Triển khai `lunar_dance`, `copycat`, `aurora_veil`, `defog`.
- [ ] **3.2.** Triển khai `curse` (nhánh Ghost & nhánh thường), `perish_song`, `destiny_bond`.
- [ ] **3.3.** Triển khai nhóm hoán đổi/sao chép (`psych_up`, `power_swap`, `speed_swap`, `skill_swap`, `soak`, `reflect_type`, `acupressure`, `spite`, `transform`).

### Phase 4: Mở rộng Bộ Ability Phổ biến trong Pokédex (`pokemon-db.json`)
- [ ] **4.1.** Triển khai nhóm Ability tần suất cao: `gluttony`, `magnetpull` / `arenatrap` / `shadowtag`, `hustle`, `regenerator`, `unnerve`, `stench`, `analytic`, `tangledfeet`, `angerpoint`, `poisontouch`, `rivalry`, `raindish`, `weakarmor`, `aftermath`, `reckless`, `hydration`, `leafguard`, `cloudnine`.
- [ ] **4.2.** Triển khai nhóm Ability tương tác nâng cao: `solarpower`, `tintedlens`, `infiltrator`, `noguard`, `scrappy`, `galvanize` / `pixilate`, `marvelscale`, `toughclaws`, `furcoat`, `magicbounce`, `unaware`, `unburden`, `moldbreaker`, `sharpness`, `imposter`.

### Phase 5: Tích hợp Hệ thống NPC, Trainer Battle, Tiền tệ & Friendship (Sau khi xây dựng NPC System)
- [ ] **5.1.** Xây dựng thực thể NPC trên Overworld (Tiến sĩ Okido, Rival, Y tá, Chủ trại chăn nuôi, Thương nhân PokéMart, NPC Huấn luyện viên dọc đường).
- [ ] **5.2.** Mở rộng `BattleEngine` & `BattleController` hỗ trợ `enemyParty: BattlerPokemon[]` (`isWild = false`), cấm bắt/cấm chạy trong đấu Trainer, AI đổi Pokémon, ép đổi Pokémon (`roar`, `whirlwind`, `dragon_tail`, `circle_throw`, `red-card`) kéo quân tiếp theo của NPC vào dẫm bẫy Entry Hazards.
- [ ] **5.3.** Tích hợp Hệ thống Tiền tệ (PokéDollar), thưởng tiền khi thắng NPC, cửa hàng PokéMart và kích hoạt `pay_day`, `happy_hour`, `make_it_rain`, `amulet-coin`, `pickup`.
- [ ] **5.4.** Tích hợp Hệ thống Friendship (`return`, `frustration`, `friend-ball`, `luxury-ball`, `soothe-bell`) và bảng vật phẩm cầm tay tự nhiên cho Pokémon hoang dã / NPC (`thief`, `covet`, `knock_off`, `trick`, `frisk`).
