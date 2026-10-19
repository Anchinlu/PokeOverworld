# Hướng dẫn phát triển: Hệ thống sinh vật hoang dã (wildlife)

Phạm vi: độ hiếm theo tỉ lệ bắt, vai trò sinh thái (lẻ, bầy, đầu đàn, apex), hiển thị cấp trên đầu, AI có tập tính, và cách gói tất cả thành **một mô-đun** `wildlife/`.

- **Cơ sở:** mã nguồn tại commit `503fa631`
- **Trạng thái:** đề xuất triển khai. Mọi con số tham số là **giá trị khởi điểm**, phải chỉnh bằng test thống kê và chơi thử
- **Phạm vi nội dung:** chỉ Gen 1 (151 loài) ở giai đoạn này; thiết kế để mở rộng cho các vùng sau
- **Không đổi:** asset, luật chiến đấu, công thức bắt, `encounters.json` (giữ cho điểm cốt truyện)
- **Quyết định còn mở:** mục 13

---

## 1. Hiện trạng đã xác minh trong repo

| Hạng mục | Thực tế |
|---|---|
| Thực thể hoang dã | `WildPokemonEntity` định nghĩa trong `maps/chunk-encounters.ts`: có `level`, `behavior`, `state` (`idle`, `curious`, `fleeing`), `homeGX/GY`, `wanderRadius`, `emote`; **chưa có** vai trò, bầy, nhu cầu |
| Shiny | `chunk-encounters.ts:151`: `seededHash(gx, gy, seed + 9999) < 0.05`, tức **5%** |
| Bảng gặp | `packages/game-data/encounters.json`: `regions` (Viridian Forest, Route 22...), mỗi vùng có `roster[]` gồm `speciesKey, rate, behavior, minLevel, maxLevel` |
| Hành vi | 5 kiểu gắn cứng theo roster: `slow_bug` (2 loài), `dormant_cocoon` (1), `skittish_bird` (3), `aggressive_bird` (2), `curious_rodent` (2) |
| AI | `ai/wild-pokemon.ts` (376 dòng): chuỗi `if (wp.behavior === ...)` theo từng kiểu |
| Hiển thị | `rendering/character-renderer.ts` chỉ vẽ bong bóng cảm xúc (`!`, `?`, `sweat`, `dots`); **không có** cấp trên đầu |
| Dữ liệu loài | `pokemon-db.json` (151 loài) có `catchRate`, `evYield`, `baseFriendship`, `growthRate`, `genderRatio`, `eggGroups`, `types`, `stats`, `ability`; **không có** giai đoạn tiến hóa, môi trường sống, cờ huyền thoại |
| Tiến hóa | Nằm trong `domain/pokemon/evolution-rules.ts` (mã TypeScript, không phải JSON) |

---

## 2. Tỉ lệ bắt và độ hiếm

### 2.1 Vì sao không dùng tỉ lệ bắt một mình

Phân bố `catchRate` của 151 loài (đo từ `pokemon-db.json`):

| Tỉ lệ bắt | Số loài | Ví dụ |
|---|---|---|
| ≥ 190 | 42 | Caterpie, Weedle, Pidgey, Rattata, Pikachu (190) |
| 120–189 | 14 | Metapod, Pidgeotto, Raticate, Clefairy, Machop |
| 60–119 | 32 | Fearow, Arbok, Raichu, Arcanine |
| 25–59 | **59** (trong đó 52 loài đúng bằng 45) | Bulbasaur, Eevee, Dratini, Aerodactyl, **Mew (45)**, Snorlax (25), Chansey (30), Ditto (35) |
| < 25 | 4 | Articuno, Zapdos, Moltres, Mewtwo (3) |

Hệ quả: Mew, Eevee, Bulbasaur và nhiều dạng tiến hóa cuối cùng đều là 45; Pikachu (190) ngang Pidgey trong khi mong muốn là loài ít gặp ở rừng. Vì vậy độ hiếm phải kết hợp thêm **giai đoạn tiến hóa**, **cờ đặc biệt** và **ghi đè thủ công**.

### 2.2 Công thức độ hiếm

```
tierBase  = bandOf(catchRate)                 // 0..4, bảng bên dưới
tierStage = tierBase + stagePenalty(stage)    // giai đoạn 1: +0, 2: +1, 3: +2
tier      = clamp(tierStage + overrideDelta, 0, 4)
```

| Cấp | Tên | Tỉ lệ bắt gốc |
|---|---|---|
| 0 | Thường | ≥ 190 |
| 1 | Ít gặp | 120–189 |
| 2 | Hiếm | 60–119 |
| 3 | Rất hiếm | 25–59 |
| 4 | Cực hiếm | < 25, hoặc bị đẩy lên bởi giai đoạn hoặc ghi đè |

**Cờ đặc biệt** (loại khỏi bảng gặp thường, không có cấp):

| Cờ | Ý nghĩa | Cách xuất hiện |
|---|---|---|
| `legendary` | Articuno, Zapdos, Moltres, Mewtwo | Điểm cố định hoặc sự kiện cốt truyện |
| `mythical` | Mew | Sự kiện, không sinh hoang dã |
| `starter` | Bulbasaur, Charmander, Squirtle (và dòng tiến hóa) | Nhận ở cốt truyện, không hoang dã |
| `fossil` | Kabuto, Omanyte, Aerodactyl... | Hóa thạch/khai quật |
| `static` | Snorlax | Điểm cố định chặn đường |
| `no_wild` | Dạng chỉ có qua tiến hóa đá hoặc trao đổi | Không sinh hoang dã |

**Ghi đè (`rarityDelta`)** dùng cho các ngoại lệ có chủ đích. Ví dụ đề xuất: Pikachu +1 (Thường → Ít gặp); Eevee +0 nhưng hạn chế môi trường (đồng bằng, ít gặp); dạng giai đoạn 3 như Pidgeot, Venusaur không sinh bằng bảng thường mà chỉ qua vai trò **apex** (mục 4).

> Giai đoạn tiến hóa lấy một lần từ `evolution-rules.ts` bằng script sinh dữ liệu, ghi thành trường `stage` trong `species-spawn.json`, rồi **bạn duyệt tay**; không phụ thuộc mã TypeScript lúc chạy.

### 2.3 Chọn loài hai bước

1. **Chọn cấp** theo xác suất mục tiêu (`spawn-config.json`):

| Cấp | Xác suất khởi điểm |
|---|---|
| Thường | 62% |
| Ít gặp | 25% |
| Hiếm | 10% |
| Rất hiếm | 2,5% |
| Cực hiếm | 0,5% |

2. **Chọn loài trong cấp** theo trọng số: `ái lực(biome) × ái lực(bối cảnh ô) × hệ số giờ × hệ số thời tiết`.

Lý do làm hai bước: nếu cộng trọng số trực tiếp thì cảm giác hiếm phụ thuộc số loài có trong từng môi trường (vùng ít loài sẽ biến loài hiếm thành phổ biến). **Dự phòng:** nếu cấp được chọn không có loài hợp lệ ở bối cảnh đó thì thử cấp phổ biến hơn kế tiếp, rồi mới tới cấp hiếm hơn; không bao giờ để trống.

### 2.4 Shiny

- Độc lập với độ hiếm của loài (như game gốc), mặc định **1/4096** (chuẩn Gen 7 đã chọn), cấu hình theo thế giới.
- **Thay giá trị 5% hiện tại** (`chunk-encounters.ts:151`) bằng tham số trong `spawn-config.json`.
- Quyết định shiny tất định theo hash `(seed, chunk, slot)`; nhiều máy cùng thấy một con.

---

## 3. Phân vùng loài theo môi trường

Mỗi loài khai báo **nhiều môi trường sống** với ái lực 0–1, theo biome và bối cảnh ô (`tall_grass`, `forest_floor`, `water_surface`, `shore`, `rock`...). Không để mỗi biome tự liệt kê loài (khó mở rộng sang 11 vùng).

Gợi ý gán cho Gen 1 (bạn duyệt từng loài):

| Nhóm | Ví dụ loài |
|---|---|
| **Rừng, rừng rậm** | Caterpie, Weedle, Kakuna, Metapod, **Pikachu**, Oddish, Paras, Venonat, Bellsprout, Exeggcute; hiếm: Scyther, Pinsir |
| **Đồng bằng** | Pidgey, Rattata, Spearow, Nidoran♀/♂, Mankey, Meowth, Growlithe, Ponyta, Doduo; hiếm: Tauros, Kangaskhan, Eevee |
| **Đồi, núi đá** | Geodude, Machop, Onix, Rhyhorn; Zubat (khi có hang) |
| **Vùng khô** | Sandshrew, Ekans, Diglett, Cubone |
| **Đầm lầy** | Poliwag, Psyduck, Slowpoke, Grimer, Koffing; hiếm: Tangela |
| **Sông, hồ** | Magikarp, Goldeen, Psyduck, Poliwag |
| **Biển, ven biển** | Tentacool, Shellder, Staryu, Krabby, Horsea, Seel; hiếm: Lapras |
| **Điểm đặc biệt** | Snorlax, huyền thoại, Mew, Ditto, hóa thạch |

**Hệ số giờ và thời tiết** (khởi điểm): loài về đêm (Zubat, Oddish, Venonat, Meowth, Gastly) nhân 0,2 ban ngày và 2–3 ban đêm; loài nước nhân lên khi mưa; bọ giảm khi mưa.

---

## 4. Vai trò sinh thái

| Vai trò | Mô tả | Cấp so với cấp cơ sở |
|---|---|---|
| `solo` | Cá thể lẻ | cấp cơ sở ± dao động nhỏ |
| `member` | Thành viên bầy | cấp cơ sở ± dao động nhỏ |
| `leader` | Đầu đàn, cùng loài với bầy | + 3 đến + 8 |
| `apex` | Dạng tiến hóa cuối của dòng | + 10 đến + 20, không thấp hơn cấp tối thiểu của giai đoạn |

### 4.1 Cấp cơ sở

```
baseLevel(d) = clamp(L0 + floor(d / STEP), LMIN, LMAX)
```

`d` là khoảng cách (hoặc độ khó theo đường đi) tới thị trấn khởi đầu. Khởi điểm: `L0 = 3`, `STEP = 120` ô, `LMIN = 2`, `LMAX = 60`. Khi trường độ khó cốt truyện có sẵn thì thay `d` bằng `D`. **Quanh thị trấn khởi đầu (bán kính vùng khởi đầu)** cấp trần là 5 và không có `apex`.

### 4.2 Kích thước nhóm theo tính xã hội của loài

| `social` | Số cá thể | Ghi chú |
|---|---|---|
| `solitary` | 1 | Mặc định |
| `pair` | 2 | |
| `herd` | 3–6 | Có đầu đàn |
| `flock` | 4–8 | Chim; có đầu đàn |

Loài cấp Thường dễ thành bầy hơn loài hiếm (hiếm chủ yếu lẻ).

### 4.2b Quy tắc apex

- Chỉ xét khi bầy hoặc cá thể là loài thuộc một dòng tiến hóa có dạng cuối **sinh được trong bối cảnh đó** (ví dụ bầy Pidgey có thể có Pidgeot apex).
- Xác suất: `pApex = clamp(P0 + K × (difficulty − D0), 0, PMAX)`; khởi điểm `P0 = 0,03`, `PMAX = 0,10`; **bằng 0** nếu `difficulty < D_APEX_MIN` hoặc ở vùng khởi đầu.
- Cấp apex: `baseLevel + U(10, 20)`, nhưng không thấp hơn cấp tối thiểu hợp lệ của loài (ví dụ giai đoạn 3 ≥ 36 nếu tiến hóa theo cấp); nếu không thỏa thì hạ vai trò xuống `leader`.
- Chỉ **một** apex mỗi bầy; apex không nằm trong bảng cấp Cực hiếm của mục 2 (nó được chọn qua vai trò, không qua cấp).

### 4.3 Sinh nhóm (tất định theo seed của chunk)

```
Mỗi chunk:
  1. số nhóm = f(mật độ biome, ngân sách)               // spawn-director
  2. với mỗi nhóm: chọn ô neo hợp lệ (đi được, đúng bối cảnh, cách làng, tách nhóm khác)
  3. chọn cấp (2.3) → chọn loài → lấy kích thước nhóm theo `social`
  4. dựng bầy: đầu đàn (+3..+8), thành viên; thử apex (4.2b)
  5. gán cấp, giới tính, shiny cho từng cá thể
Mọi quyết định dùng hash(seed, cx, cy, slot, salt) — không Math.random, không Date.now
```

Ngân sách khởi điểm: tối đa 8 thực thể mỗi chunk, 25 chunk hoạt động nên không quá 200 thực thể được mô phỏng.

---

## 5. Hiển thị cấp trên đầu

### 5.1 Quy tắc

Gọi `Lp` là **cấp tham chiếu của người chơi** (mục 13: Pokémon dẫn đầu đội hay mạnh nhất, mặc định đề xuất là Pokémon dẫn đầu còn khỏe).

| Điều kiện | Hiển thị |
|---|---|
| Vai trò `leader` hoặc `apex` | `???` màu đỏ |
| Vai trò thường và `level < Lp` | `Lv.X` |
| Vai trò thường và `level ≥ Lp` | Không hiện |

Chi tiết:
- Tùy chọn: nếu `leader` hoặc `apex` có `level ≤ Lp − 10` thì hiện `Lv.X` như thường (tránh `???` gây hiểu nhầm).
- Chỉ vẽ trong bán kính khoảng 7 ô quanh người chơi.
- Cấp thật vẫn nằm trong thực thể; chỉ giao diện che.
- Tín hiệu bổ sung cho cấp cao: sprite lớn hơn một chút, âm thanh cảnh báo; để người chơi không bị bất ngờ khi không thấy cấp.

### 5.2 Giao diện lập trình

```ts
// indicators/level-indicator.ts (thuần, test được không cần canvas)
export type LevelIndicator =
  | { kind: 'level'; text: string }       // "Lv.12"
  | { kind: 'unknown_red'; text: '???' }
  | { kind: 'none' };

export function getLevelIndicator(
  entity: { level: number; role: 'solo' | 'member' | 'leader' | 'apex' },
  playerRefLevel: number,
  opts?: { showLowApexAsLevel?: boolean; lowApexGap?: number },
): LevelIndicator;
```

Bảng chân trị bắt buộc có test (mục 11): 4 vai trò × (thấp hơn, bằng, cao hơn) cấp tham chiếu.

---

## 6. AI có tập tính

### 6.1 Hồ sơ hành vi (dữ liệu, thay cho các nhánh `if`)

```json
{
  "id": "curious_rodent",
  "temperament": "curious",
  "social": "solitary",
  "activity": "diurnal",
  "senses": { "detectRadius": 5, "runNoiseMult": 1.5, "grassStealthMult": 0.6 },
  "needs": { "hungerRate": 0.002, "energyRate": 0.0015 },
  "anchors": ["burrow"],
  "threat": { "fleeBelowRatio": 0.7, "warnAboveRatio": 1.3 },
  "weights": { "wander": 0.3, "forage": 0.3, "rest": 0.15, "curious": 0.2, "alert": 0.05 }
}
```

- `behavior-archetypes.json`: các mẫu chung (`skittish_bird`, `aggressive_bird`, `curious_rodent`, `slow_bug`, `dormant_cocoon` chuyển từ code hiện có, thêm `herd_grazer`, `territorial_brute`, `nocturnal_flyer`, `ambush_predator`...).
- `species-behavior.json`: ghi đè theo loài.
- **Mặc định sinh tự động** từ hệ, nhóm môi trường sống và giai đoạn (ví dụ Bọ: nhút nhát, bầy; Bay: đàn; Gặm nhấm: tò mò), nên không phải viết tay 151 hồ sơ.

### 6.2 Máy trạng thái chấm điểm (utility AI)

Trạng thái: `idle`, `wander`, `forage`, `rest_sleep`, `groom_play`, `alert`, `curious`, `flee`, `territorial`, `chase`, `return_home`.

- Mỗi nhịp tính điểm cho từng trạng thái từ **nhu cầu** (đói, năng lượng, sợ hãi), **kích thích** (khoảng cách người chơi, đi bộ hay chạy, giờ, thời tiết, loài khác) và **trọng số hồ sơ**.
- **Quán tính:** mỗi trạng thái có thời gian tối thiểu để không rung lắc; thêm ngưỡng chuyển (hysteresis).
- Mỗi trạng thái một file nhỏ (≤ 300 dòng), cùng giao diện `enter / update / exit`.

### 6.3 Giác quan và đánh giá đe dọa

```
bán kính phát hiện = detectRadius × (người chơi chạy ? runNoiseMult : 1) × (người chơi trong cỏ cao ? grassStealthMult : 1)
ratio = level_hoang_dã / Lp
ratio < fleeBelowRatio  → bỏ chạy
ratio > warnAboveRatio hoặc role ∈ {leader, apex} → cảnh báo (emote ! đỏ, gầm), rồi giữ lãnh thổ hoặc truy đuổi theo tính khí
ngược lại → theo tính khí (tò mò, bỏ qua, nhút nhát)
```

### 6.4 Hành vi bầy

- Thành viên giữ khoảng cách quanh đầu đàn: kéo về nếu xa hơn `R_COHESION` (khởi điểm 3 ô), đẩy ra nếu sát hơn 1 ô, chọn hướng cùng với đầu đàn.
- Đầu đàn chọn điểm đến trong vùng nhà của bầy.
- **Báo động lan truyền** có độ trễ tỉ lệ khoảng cách (3–8 nhịp).
- Khi người chơi yếu hơn đầu đàn hoặc apex quá nhiều, cả bầy chuyển sang giữ lãnh thổ và cảnh báo trước khi tấn công.
- **Sau trận:** bắt hoặc đánh bại thành viên → phần còn lại bỏ chạy; đầu đàn bị hạ → bầy tan.

### 6.5 Nhịp ngày đêm và thời tiết

- Loài đêm ngủ ban ngày tại điểm neo (hiện dấu "z"), thức dậy nếu người chơi lại gần dưới 2 ô.
- Mưa: bọ trốn, loài nước nổi lên; hệ số theo `weather-response`.
- Phụ thuộc cổng `clock` (giờ trong game) và cổng thời tiết; **không** dùng `Date.now()` trong luật hành vi.

### 6.5b Quan hệ săn mồi (giai đoạn sau)

Bảng nhẹ `predator → prey` (ví dụ chim săn bọ). Chỉ làm khi các phần trước ổn định; không phải điều kiện của bản đầu.

---

## 7. Hiệu năng

- Chỉ mô phỏng thực thể trong các chunk hoạt động.
- **LOD theo khoảng cách tới người chơi:** đầy đủ trong khoảng 12 ô; thưa (mỗi 4–8 nhịp) trong khoảng 24 ô; đóng băng ngoài ngưỡng (giữ nguyên trạng thái).
- Bảng băm không gian (ô 4×4) cho truy vấn hàng xóm.
- Ngân sách khởi điểm: ≤ 1ms mỗi khung hình cho toàn bộ AI hoang dã (đề xuất, cần đo).
- Overlay (cấp trên đầu) chỉ tính cho thực thể trong bán kính hiển thị.
- Không cấp phát mảng mới mỗi khung hình trong vòng lặp nóng.

---

## 8. Kiến trúc mô-đun

### 8.1 Cây thư mục

```
apps/web/src/wildlife/
  index.ts                      WildlifeSystem (cổng công khai)
  model/                        kiểu thuần (WildEntity, Herd, Role, BehaviorProfile, events)
  spawn/                        THUẦN, tất định
    spawn-director.ts  rarity.ts  species-pool.ts  herd-composer.ts
    level-model.ts  shiny.ts  placement.ts
  behavior/                     CHẠY LÚC CHƠI
    profiles/ (profile-registry.ts, default-profile.ts)
    brain/ (utility-brain.ts, considerations.ts, states/*.ts)
    senses/ (perception.ts, threat-assessment.ts)
    social/ (herd-controller.ts, alarm.ts)
    schedule/ (daily-rhythm.ts, weather-response.ts)
    movement/ (grid-mover.ts, steering.ts)
    wildlife-simulator.ts       điều phối, LOD, ngân sách
  indicators/                   level-indicator.ts, threat-cues.ts
  encounter/                    encounter-bridge.ts
  ports/                        world-query.ts, player-query.ts, clock.ts, rng.ts
  data/                         bộ nạp và kiểm tra JSON

apps/web/src/rendering/wildlife/   wild-renderer.ts, wild-overlay.ts
packages/game-data/wildlife/       species-spawn.json, species-behavior.json,
                                   behavior-archetypes.json, spawn-config.json, schema/*.json
apps/web/test/wildlife/            spawn, rarity, herd, indicator, behavior, perf
scripts/validate-wildlife.mjs
scripts/wildlife/derive-species-spawn.mjs   sinh bản nháp species-spawn.json từ pokemon-db + evolution-rules
```

### 8.2 Giao diện công khai

```ts
export interface WildlifeSystem {
  populateChunk(cx: number, cy: number): WildEntity[];       // tất định theo seed
  update(dtMs: number): void;                                  // mô phỏng, có LOD và ngân sách
  getOverlays(viewport: Rect): OverlayModel[];                 // cấp, ???, cảm xúc
  onBattleResolved(entityId: string, outcome: BattleOutcome): void;
}
```

### 8.3 Quy tắc phụ thuộc

| Mô-đun | Được import | Không được import |
|---|---|---|
| `model` | `core` | mọi thứ khác trong `wildlife` |
| `spawn` | `model`, `data`, `ports`, `core/rng` | `behavior`, `rendering`, `ui` |
| `behavior` | `model`, `ports`, `core` | `spawn`, `rendering`, `ui` |
| `indicators` | `model`, `ports/player-query` | `behavior`, `spawn`, `rendering` |
| `encounter` | `model`, `battle` (qua cổng) | nội bộ `behavior` |
| `rendering/wildlife` | `model`, `indicators` | `behavior`, `spawn` |

Mô-đun **không import** `maps/terrain-rules` hay `ChunkManager`; mọi thứ về thế giới qua cổng `WorldQuery` (bản đầu là adapter bọc `ChunkManager`, `TerrainField` khi có, và `sampleEcology`).

### 8.4 Cổng

```ts
interface WorldQuery {
  isWalkable(gx: number, gy: number): boolean;
  contextAt(gx: number, gy: number): TileContext;   // 'tall_grass' | 'forest_floor' | 'water_surface' | 'shore' | 'rock' ...
  biomeAt(gx: number, gy: number): BiomeId;
  difficultyAt(gx: number, gy: number): number;      // khoảng cách tới khởi đầu, sau này là trường độ khó
  timeBand(): 'dawn' | 'day' | 'dusk' | 'night';
  weather(): 'clear' | 'rain' | 'sand' | 'snow' | string;
}
interface PlayerQuery {
  position(): { gx: number; gy: number };
  isRunning(): boolean;
  inTallGrass(): boolean;
  referenceLevel(): number;                          // mục 13
}
```

---

## 9. Dữ liệu và lược đồ

### 9.1 `species-spawn.json` (ví dụ một loài)

```json
{
  "PIKACHU": {
    "stage": 1,
    "flags": [],
    "rarityDelta": 1,
    "social": "pair",
    "habitats": [
      { "biome": "dense_forest", "context": "forest_floor", "affinity": 1.0 },
      { "biome": "light_forest", "context": "tall_grass",   "affinity": 0.6 }
    ],
    "activeTime": ["day", "dusk"],
    "weather": { "rain": 0.7 }
  },
  "PIDGEY": {
    "stage": 1,
    "flags": [],
    "rarityDelta": 0,
    "social": "flock",
    "habitats": [
      { "biome": "meadow", "context": "tall_grass", "affinity": 1.0 }
    ],
    "activeTime": ["dawn", "day", "dusk"],
    "apexSpecies": "PIDGEOT"
  }
}
```

`apexSpecies` chỉ khai báo khi dòng tiến hóa có dạng cuối **tiến hóa theo cấp** và có thể xuất hiện hoang dã dưới vai trò apex (Pidgey → Pidgeot). Pikachu → Raichu tiến hóa bằng đá nên Pikachu **không** có apex.

### 9.2 `spawn-config.json`

```json
{
  "tierProbability": [0.62, 0.25, 0.10, 0.025, 0.005],
  "stagePenalty": [0, 1, 2],
  "shinyOdds": 4096,
  "maxEntitiesPerChunk": 8,
  "groupsPerChunk": { "meadow": [3, 5], "light_forest": [2, 4], "dense_forest": [2, 4], "dryland": [1, 3], "wetland": [2, 3], "coast": [1, 3] },
  "social": { "pair": [2, 2], "herd": [3, 6], "flock": [4, 8] },
  "leaderBonus": [3, 8],
  "apex": { "p0": 0.03, "pMax": 0.10, "levelBonus": [10, 20], "minDifficulty": 0.35 },
  "level": { "l0": 3, "step": 120, "min": 2, "max": 60, "startZoneCap": 5 }
}
```

### 9.3 Kiểm tra dữ liệu (`validate-wildlife.mjs`, chạy trong CI)

- Mọi loài Gen 1 phải có `habitats` hoặc ít nhất một cờ trong (`legendary`, `mythical`, `starter`, `fossil`, `static`, `no_wild`).
- `tierProbability` cộng bằng 1.
- Mỗi cặp (biome, bối cảnh) phải có loài ở **ít nhất cấp Thường** và có đường dự phòng cho các cấp khác.
- `habitats[].biome` và `context` thuộc danh sách hợp lệ của hệ sinh thái.
- `apexSpecies` là loài tồn tại và cùng dòng tiến hóa.
- Mọi `moveId` hoặc `speciesKey` tham chiếu đều tồn tại trong cơ sở dữ liệu.

---

## 10. Kế hoạch triển khai

Mỗi bước kết thúc bằng một kết quả kiểm chứng được; không gộp nhiều bước vào một commit. Cỡ: S nhỏ, M vừa, L lớn.

| Bước | Nội dung | DoD | Cỡ |
|---|---|---|---|
| **W1** | Tạo `wildlife/model` và chuyển `WildPokemonEntity` sang đó (re-export tạm ở `maps/chunk-encounters.ts`) | Toàn bộ test hiện có pass không sửa | S |
| **W2** | `indicators/level-indicator` + `rendering/wildlife/wild-overlay` (vai trò tạm: tất cả `solo`) | Bảng chân trị 5.2 có test; thấy `Lv.X` trên đầu trong game | S |
| **W3** | Script sinh `species-spawn.json` nháp + bạn duyệt + `validate-wildlife.mjs` | CI chạy kiểm tra dữ liệu | M |
| **W4** | `spawn/` (độ hiếm hai bước, mô hình cấp, shiny, bầy, apex, `spawn-director`) thay `generateChunkWildPokemon`; thay 5% shiny | Test thống kê mục 11.1–11.4 pass | L |
| **W5** | Chuyển 5 hành vi cũ thành 5 mẫu trong `behavior-archetypes.json`; tách `grid-mover` | Test mô phỏng so khớp hành vi cũ pass | M |
| **W6** | Bộ não chấm điểm, nhu cầu, giác quan, nhịp ngày đêm | Test hành vi 11.5 pass | L |
| **W7** | Hành vi bầy, báo động, xử lý sau trận | Test 11.6 pass | M |
| **W8** | LOD, ngân sách, đo hiệu năng; xóa `ai/wild-pokemon.ts`; khóa phụ thuộc bằng `dependency-cruiser` | Ngân sách đạt; `deps:check` xanh | M |
| **W9** | Quan hệ săn mồi (tùy chọn, sau) | | M |

**Thứ tự:** W1 → W2 → W3 → W4 → W5 → W6 → W7 → W8. W1–W2 làm được ngay, không phụ thuộc địa hình v0.

---

## 11. Bộ test bắt buộc (`apps/web/test/wildlife/`)

### 11.1 Độ hiếm
- Tính cấp cho cả 151 loài; so với bảng kỳ vọng đã duyệt (bắt buộc: Pikachu = Ít gặp; Pidgeot không sinh thường; Snorlax, huyền thoại và Mew không có trong bảng thường).
- Không loài nào có cờ `legendary/mythical/starter/fossil/static/no_wild` xuất hiện trong mô phỏng spawn.

### 11.2 Phân bố
- Mô phỏng 100.000 lần chọn mỗi (biome, bối cảnh): tỉ lệ từng cấp nằm trong sai số (ví dụ ±1% tuyệt đối với cấp Thường, ±0,3% với cấp Hiếm) so với `tierProbability`.
- Pikachu chỉ xuất hiện ở biome rừng; loài nước không xuất hiện trong cỏ cao nội địa.
- Cấp dự phòng hoạt động khi bối cảnh thiếu loài cấp được chọn (không bao giờ trả rỗng).

### 11.3 Vai trò và cấp
- Mọi bầy có đúng một `leader`; `leader` cao hơn `member` 3–8 cấp.
- `apex` luôn đạt cấp tối thiểu của giai đoạn, cao hơn cấp cơ sở 10–20, không xuất hiện trong bán kính vùng khởi đầu, và không quá một con mỗi bầy.
- Cấp trong vùng khởi đầu không vượt cấp trần.

### 11.4 Shiny và tất định
- Cùng seed, cùng chunk → danh sách thực thể (loài, cấp, vai trò, shiny, vị trí) giống hệt qua hai lần chạy và qua các thứ tự sinh chunk khác nhau.
- Tỉ lệ shiny quan sát hội tụ về `1/shinyOdds` (kiểm trên số mẫu lớn).

### 11.5 Hành vi
- Mô phỏng với RNG có seed và bước thời gian cố định:
  - loài đêm ngủ ban ngày và thức khi người chơi lại gần;
  - con yếu bỏ chạy khi ratio thấp, con mạnh cảnh báo;
  - **không thực thể nào bước vào ô không đi được** (đồi, biển, vách);
  - không dao động vô hạn giữa hai trạng thái (hysteresis);
  - mô phỏng 200 thực thể nằm trong ngân sách khung hình.

### 11.6 Bầy
- Thành viên ở trong bán kính quanh đầu đàn phần lớn thời gian (ví dụ ≥ 90%).
- Báo động lan đúng độ trễ theo khoảng cách.
- Sau khi bắt hoặc hạ thành viên, phần còn lại bỏ chạy; hạ đầu đàn thì bầy tan.

### 11.7 Chỉ báo cấp
- Bảng chân trị 5.1: 4 vai trò × 3 quan hệ cấp; kiểm cả tùy chọn `showLowApexAsLevel`.

---

## 12. Rủi ro

| Rủi ro | Xử lý |
|---|---|
| Độ khó lệch (apex quá mạnh hoặc quá dễ gặp) | Tham số `apex` trong `spawn-config.json`; giới hạn ở vùng khởi đầu; chỉnh bằng test và chơi thử |
| `???` đỏ gây hiểu nhầm | Tùy chọn hiện cấp khi chênh lệch quá lớn; tín hiệu bổ sung (cỡ sprite, âm thanh) |
| AI tốn khung hình | LOD, bảng băm không gian, ngân sách; đo ở W8 |
| Hành vi mới lệch hành vi cũ khi chuyển | W5 có test so khớp trước khi đổi sang bộ não mới |
| Gán môi trường sai cho một số loài | Danh sách duyệt tay trong W3; script chỉ sinh bản nháp |
| Đồng bộ giữa các máy (LAN) | Sprite hoang dã là hiệu ứng riêng mỗi client; cuộc gặp do host quyết định (theo thiết kế LAN); sinh nhóm vẫn tất định theo seed |

---

## 13. Quyết định cần chốt

1. **Cấp tham chiếu người chơi:** Pokémon **dẫn đầu còn khỏe** (đề xuất) hay **mạnh nhất trong đội**.
2. **Vị trí mô-đun:** `src/wildlife/` độc lập (đề xuất, khoảng 30 file và dữ liệu riêng) hay nằm trong `world/entities/` theo cây thế giới.
3. Với vai trò thường mà cấp ≥ cấp tham chiếu: **không hiện gì** (như yêu cầu) hay hiện `?` xám.
4. Với `leader` hoặc `apex` thấp hơn người chơi nhiều: vẫn `???` đỏ hay hiện `Lv.X` (tùy chọn ở 5.1).
5. Thực thể bị bắt hoặc hạ có tái sinh ngay khi tải lại chunk không, hay nhớ trong phiên chơi (không lưu vào save)? Đề xuất nhớ trong phiên.
6. Danh sách loài gán môi trường sống, cờ đặc biệt và `rarityDelta` cho 151 loài (bạn duyệt ở W3).
