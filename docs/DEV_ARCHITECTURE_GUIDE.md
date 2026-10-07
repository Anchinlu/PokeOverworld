# Hướng dẫn phát triển: Kiến trúc, tổ chức file, tối ưu và định hướng

- **Phạm vi:** dự án PokeOverworld (`apps/web`, `apps/desktop`, `packages/*`)
- **Cơ sở:** mã nguồn tại commit `82bb3e71` (07/10/2026)
- **Trạng thái tài liệu:** đề xuất, chờ chủ dự án duyệt. Mục nào cần quyết định được đánh dấu **[QUYẾT ĐỊNH]**
- **Cách đọc:** mục 1 là định hướng, mục 2–5 là quy tắc và hướng dẫn kỹ thuật, mục 6–7 là công cụ và lộ trình, mục 8 là checklist cho mỗi PR

---

## 1. Định hướng dự án (điều chỉnh)

### 1.1 Hiện trạng thực tế

| Hạng mục | Thực tế trong code | Tài liệu cũ (`docs/plans/02–05`) |
|---|---|---|
| Mô hình | **Client-only**: toàn bộ logic chạy trong trình duyệt hoặc vỏ Tauri | Frontend + backend FastAPI, PostgreSQL, Redis |
| Backend | **Không có** `apps/server`; `apps/` chỉ có `web` và `desktop` | Có `apps/server`, server có thẩm quyền |
| Mạng | Một lệnh `fetch` duy nhất (nạp manifest asset) | REST và WebSocket |
| Lưu game | `localStorage` qua `domain/save`, `party`, `pc`, `player` | PostgreSQL |
| Engine / UI | TypeScript thuần, canvas và DOM | Phaser 3 và React |
| Tauri | Chỉ là vỏ (không có lệnh Rust nào) | — |

Lớp `domain/` là lớp logic **nằm trong frontend**. Nó tách khỏi giao diện tốt nhưng không phải backend.

### 1.2 Quyết định định hướng

| Mã | Quyết định đề xuất | Lý do |
|---|---|---|
| D1 | **Client-only, offline-first** (chơi một mình). Phát hành bản web và bản desktop Tauri | Khớp code hiện tại; chưa có yêu cầu online |
| D2 | **Hoãn backend.** Không tạo `apps/server` cho đến khi có quyết định multiplayer. Giữ logic `domain/` và `battle/rules` thuần để chuyển sang server được nếu cần | Tránh duy trì hai nơi chứa logic |
| D3 | **Chuẩn luật chiến đấu: Gen 7** (bảng hệ Gen 6+, chí mạng ×1,5, bỏng 1/16, tê liệt ×0,5). Ghi vào `DEV_GUARDRAILS.md` | Engine đang trộn Gen 3–7 |
| D4 | **Logic quan trọng chỉ viết bằng TypeScript.** Python chỉ làm công cụ ngoại tuyến, hoặc bỏ bản song song của bộ sinh bản đồ **[QUYẾT ĐỊNH]** | Mỗi thay đổi hiện phải làm hai lần |
| D5 | **Thứ tự ưu tiên:** (1) lỗi chiến đấu P0, (2) nền tảng kiến trúc (bước A, B), (3) hiệu năng lúc chạy, (4) overworld v2 | Overworld tạm hoãn theo yêu cầu; kế hoạch vẫn giữ nguyên |
| D6 | Cập nhật tài liệu cũ (mục 9.3) và dừng ghi đường dẫn cục bộ vào `PROGRESS.md` | Tài liệu đang lệch thực tế |

> Nếu muốn có chế độ online, hãy chốt trước khi bắt đầu bước B. Khi đó D2 đổi thành "chuẩn bị backend" và `battle/rules` phải chạy được ở cả client lẫn server.

---

## 2. Kiến trúc

### 2.1 Các tầng và hướng phụ thuộc

```
L5  ui · game · bootstrap (composition root)
L4  battle/session · rendering
L3  world (maps, chunks, entities, ai) · battle/rules (hàm thuần)
L2  domain (mô hình + service: party, pc, inventory, player, save)
L1  data (catalog, JSON) · packages/shared-types · packages/game-data
L0  core (rng, camera, time)

platform/  audio · localStorage · shell (Tauri): adapter, chỉ được tạo ở L5 và truyền xuống
```

### 2.2 Quy tắc bắt buộc

1. **Chỉ import xuống dưới** (hoặc cùng tầng, cùng module). Cấm import ngược lên.
2. **Cấm vòng import.** Mọi vòng phải bị CI chặn.
3. `domain/` và `battle/rules/` **không được** import `ui/`, `rendering/`, và không dùng trực tiếp `window`, `document`, `localStorage`. Lưu trữ đi qua interface repository, bản triển khai nằm ở `platform/`.
4. **Singleton chỉ được khởi tạo ở composition root** (`bootstrap.ts`) rồi truyền xuống bằng constructor. Các singleton hiện có (`partyService`, `PartyScreen.getInstance()`...) được giữ tạm trong giai đoạn chuyển tiếp; **code mới không được import chúng trực tiếp**.
5. **Mọi ngẫu nhiên đi qua RNG được tiêm vào** (`BattleRng`, `RandomService`). Không dùng `Math.random()` trong luật chơi.
6. **Luật chơi là hàm thuần:** nhận trạng thái và đầu vào, trả kết quả. Phần phát hoạt ảnh, âm thanh, hộp thoại thuộc lớp session hoặc view.
7. **Mô hình dữ liệu dùng chung** (`BattleMove`, `StatusCondition`, `BattlerPokemon`, `PartyPokemon`) nằm ở `domain/model/` hoặc `packages/shared-types`, không nằm trong `battle/`.
8. **Không toạ độ pixel gắn cứng trong controller.** Hit-test thuộc về view (bảng vùng bấm khai báo bằng dữ liệu).

### 2.3 Các vi phạm hiện có (cần sửa dần)

| # | Vi phạm | Vị trí | Cách sửa |
|---|---|---|---|
| V1 | `domain` ↔ `battle` phụ thuộc hai chiều | `domain/party/*`, `domain/pc/*` import `battle/types`, `battle/moves-db`; `battle-controller` import `partyService` | Chuyển mô hình dùng chung vào `domain/model/`; để `battle` phụ thuộc `domain`, không ngược lại |
| V2 | Mô hình domain nằm trong `battle/types.ts` (fan-in 17, cao nhất repo) | `battle/types.ts` | Như V1; để lại `battle/types.ts` re-export tạm thời |
| V3 | `battle` import `ui` | `battle-controller` (PartyScreen, BagScreen), `battle-screen` (pokemon-cry) | Tiêm cổng `openPartySelect`, `openBag`, `playCry` qua constructor |
| V4 | `assets` import `rendering` | `assets/asset-registry.ts` dùng `AssetLoader` | Đặt `AssetLoader` ở `assets/` hoặc `platform/` |
| V5 | Vòng import `terrain-rules` ↔ `village-rules` | `maps/` | Tách hàm dùng chung sang `terrain-primitives.ts` |
| V6 | Singleton toàn cục | `partyService`, `pcStorageService`, `*.getInstance()` | Khởi tạo ở composition root, truyền bằng constructor |
| V7 | Hit-test pixel gắn cứng | `battle-controller.ts` (10 điều kiện `x >= ... && x <= ...`) | Đưa vào bảng vùng bấm trong view |

### 2.4 Cổng (port) mẫu cho battle

```ts
// battle/session/ports.ts
export interface BattleUiPort {
  selectParty(opts: { currentUid?: string }): Promise<PartyPokemon | null>;
  openBag(): Promise<ItemChoice | null>;
  playCry(speciesKey: string): void;
}

export interface BattlePartyPort {
  getParty(): readonly PartyPokemon[];
  syncResult(battler: BattlerPokemon, expGained: number): SyncResult;
}

// Tiêm khi khởi tạo (composition root):
new BattleController({ ui: uiPort, party: partyService, rng: new SeededBattleRng(seed) });
```

---

## 3. Tổ chức file

### 3.1 Cây thư mục đích (`apps/web/src`)

```
core/        rng, camera, time
data/        catalog Pokémon, moves, items
domain/
  model/     PartyPokemon, BattleMove, StatusCondition, ... (mô hình dùng chung)
  party/  pc/  inventory/  player/  save/
battle/
  rules/     engine (hàm thuần), type-chart, catch, exp, level-up
  session/   controller (luồng lượt), ports
  view/      renderer, text-overlay, animation state, bảng vùng bấm
world/       maps (sinh thế giới thuần), chunks, entities, ai
rendering/   ground, object, character, debug
ui/<tính năng>/   view + controller + css riêng (pokedex, storage, party, bag, hud)
platform/    audio, storage (localStorage), shell (Tauri)
bootstrap.ts, main.ts   composition root
```

Quá trình chuyển nên làm từng bước, mỗi bước giữ file cũ re-export để không vỡ import.

### 3.2 Quy ước đặt tên và kích thước

- File dùng `kebab-case.ts`. Hậu tố nói rõ vai trò: `-state`, `-service`, `-rules`, `-view`, `-controller`, `-renderer`, `-db`.
- **Giới hạn kích thước:** cảnh báo ở 400 dòng, lỗi ở 600 dòng; ngoại lệ phải có comment lý do.
- Một file một trách nhiệm. Hàm quá 60 dòng nên được tách.
- Test đặt theo khu vực: `apps/web/test/<khu-vực>/*.test.ts` (hiện đang phẳng 14 file).
- CSS đi cùng tính năng, không dồn vào một `style.css`.

### 3.3 Các file cần tách (theo kích thước hiện tại)

| File | Dòng | Tách thành |
|---|---|---|
| `ui/storage-screen.ts` | 1704 | state, box-view, party-panel, summary-modal, customize-modal, drag-and-drop |
| `battle/battle-renderer.ts` | 1551 | background, sprites, databox, capture-anim, effects |
| `maps/chunk-objects.ts` | 1114 | trees, flowers, berries, tall-grass, plants, exclusion (luật loại trừ dùng chung) |
| `ui/pokedex/pokedex-view.ts` | 947 | theo từng tab |
| `maps/village-rules.ts` | 763 | placement, layout, collision |
| `battle/battle-state.ts` | 730 | animation state tách khỏi state luật |
| `ui/party-screen.ts` | 694 | list, detail, battle-select |
| `maps/terrain-rules.ts` | 661 | coast/sand, hills, lakes, rivers |
| `battle/battle-controller.ts` | 601 | tách input/hit-test khỏi luồng lượt |
| `style.css` | 5631 | `pokedex.css`, `storage.css`, `party.css`, `battle.css`, `bag.css`, `base.css` |

### 3.4 Thư mục gốc và asset

- **Di sản cần xử lý:** `map_viewer.html`, `tiles_data.js` (xoá hoặc lưu trữ ngoài repo chính).
- Gom công cụ Python vào `tools/` (`map_generator/`, `map_generator.py`, `tests/` Python).
- Gom `Graphics/` và `Audio/` vào `assets/`.
- **Tên asset:** không dấu cách, không lỗi chính tả (ví dụ "backgound"), không tiền tố trùng nội dung (`GEN8- ...`).
- **Asset trùng nội dung:** đã tìm thấy 302 nhóm, lãng phí ~12,8MB. Giữ một bản và tham chiếu qua manifest.
- `docs/`: giữ `PROGRESS.md` ở dạng changelog ngắn, ghi quyết định thiết kế vào `docs/adr/NNNN-tên.md`. Không ghi đường dẫn tuyệt đối của máy cá nhân.

---

## 4. Quy ước code

1. **TypeScript strict** (đang có): giữ `noUnusedLocals`, `noUnusedParameters`; không dùng `any`, `@ts-ignore` (hiện là 0).
2. **Luật chơi tách khỏi hiển thị.** `executeAttack` trả `TurnResult`; hoạt ảnh và thông báo suy ra từ kết quả đó.
3. **Mỗi lỗi sửa đi kèm một test tái hiện** (ví dụ chiêu `power = 0`, recoil khi đối thủ sắp ngất, thứ tự lượt).
4. **Dữ liệu tĩnh trong `packages/game-data`**, không rải hằng số công thức trong code UI.
5. **Không đoán đời game trong code.** Mọi hằng số theo Gen 7 (D3) có comment nguồn và nằm ở một file hằng số (`battle/rules/constants.ts`).
6. **UI:** một màn hình gồm `view` (DOM/canvas), `controller` (nối sự kiện với domain), `css` riêng. View không tự tính luật chơi.
7. **Cache có vòng đời.** Cache cấp module phải có điểm xoá rõ ràng (gắn với chunk hoặc `reset(seed)`).

---

## 5. Tối ưu

### 5.1 Build và asset

| Vấn đề | Số liệu đo | Việc làm |
|---|---|---|
| Plugin `emitLegacyGraphicsPlugin` sao chép nguyên thư mục | `dist` = 56MB (Graphics 49MB, Audio 3,3MB, JS/CSS 3MB) | Build theo manifest: chỉ phát hành asset được tham chiếu |
| Asset trùng nội dung | 302 nhóm, ~12,8MB | Loại bản trùng, dùng một đường dẫn |
| Sprite sheet hoạt ảnh chiêu thức nặng | tới ~1,8MB một file (`Fiery`, `EerieSpell`, `Fire3`) | Nạp lười theo chiêu khi dùng lần đầu; thử nén PNG lossless hoặc WebP lossless và kiểm tra bằng mắt |
| Dữ liệu JSON đóng thành JS | `moves-data` 335KB, `pokemon-data` 288KB, `items-data` 259KB (~140KB gzip) | Kiểm tra có nạp lười không; chỉ nạp khi vào màn hình cần |
| CSS một khối | 145KB (32KB gzip) nạp lúc khởi động | Tách theo màn hình, nạp theo nhu cầu |
| Build lỗi trong môi trường sạch | `npm ci` lỗi do lock lệch; `tsc -b` thiếu `@types/node` | Chạy `npm install`, commit lại `package-lock.json` |

### 5.2 Hiệu năng lúc chạy

Các điểm nóng tìm được từ việc đọc code (chưa profile trong trình duyệt):

**H1. `renderWaterTiles`** duyệt 25 chunk × 256 ô mỗi khung hình và gọi `isLakeTile` (tra `Map` khoá chuỗi) cho mỗi ô sông.
→ Cắt theo chunk trước khi duyệt ô; dựng sẵn danh sách ô nước hoạt hoạ (cờ hồ, biến thể bờ) lúc sinh chunk.

**H2. `renderTallGrassPatches`** với mỗi ô cỏ cao lại duyệt toàn bộ Pokémon hoang dã (O(cỏ × Pokémon)).
→ Mỗi khung hình dựng một `Set` các ô đang có thực thể di chuyển rồi tra O(1):

```ts
const tileKey = (gx: number, gy: number): number => gx * 67108864 + gy; // an toàn khi |gy| < 2^25

const moving = new Set<number>();
for (const chunk of chunkManager.activeChunks) {
  for (const wp of chunk.wildPokemon) {
    if (!wp.isMoving) continue;
    moving.add(tileKey(wp.gx, wp.gy));
    moving.add(tileKey(wp.targetGX, wp.targetGY));
  }
}
// khi vẽ cỏ cao:
const wildHere = moving.has(tileKey(tg.gx, tg.gy));
```

**H3. Khoá chuỗi trên đường nóng.** `getChunk` tạo chuỗi `` `${cx},${cy}` `` mỗi lần gọi; các cache cấp module (`hillTileCache`, `eastHillCache`, `westMaxXCache`, `villageCache`, `lakeCache`, `chunkTreeLocsCache`) dùng khoá chuỗi và không bao giờ bị xoá.
→ Dùng khoá số (`cx * 1048576 + cy`) và gắn cache với vòng đời chunk hoặc `reset(seed)`.

**H4. `getTileData`** dùng 3 lần `.find` tuyến tính. Hiện ~3µs/lần (20.000 lần ≈ 60ms), chưa gấp.
→ Lập chỉ mục theo ô cục bộ khi mật độ thực thể tăng.

**H5. Sinh chunk đồng bộ trên luồng chính.** Đo trong Node (không canvas, JIT lạnh): trung bình ~6,7ms/chunk, p95 19ms, tối đa 134ms. Qua biên chunk cần sinh 5 chunk mới (lưới 5×5), tức ~33ms trung bình.
→ Tải trước vòng chunk kế tiếp với ngân sách mỗi khung hình (đề xuất ≤ 3ms, tối đa 1 chunk/khung hình, ưu tiên theo hướng đi). Khi overworld v2 làm sinh chunk nặng hơn, chuyển sang **Web Worker**.

**H6. `GameLoop.getStats()`** trả `dtMs: this.lastTime` (mốc thời gian, không phải độ trễ khung) và `dtScale: 1.0` cố định. Sửa để trả số liệu thật.

### 5.3 Ngân sách hiệu năng đề xuất

| Chỉ số | Mục tiêu đề xuất |
|---|---|
| Thời gian một khung hình | ≤ 16,6ms (60 FPS) trên máy trung bình |
| Công việc sinh chunk trong một khung hình | ≤ 3ms |
| JS gzip khởi động | ≤ 300KB |
| CSS khởi động | ≤ 20KB gzip (phần còn lại nạp theo màn hình) |
| Kích thước `dist` | giảm dần khỏi mức 56MB bằng build theo manifest |

Các mục tiêu là **đề xuất**, cần đo lại trên máy thật rồi chỉnh.

### 5.4 Cách đo

- Dùng `performance.mark/measure` quanh `onUpdate`, `onRender`, `renderWaterTiles`, `renderTallGrassPatches`, sinh chunk.
- Mở rộng HUD debug hiện có để hiện thời gian trung bình và p95 của từng giai đoạn.
- Ghi số đo vào PR khi sửa hiệu năng (trước/sau, cùng seed, cùng vị trí).
- Chỉ tối ưu điểm nào đã đo được; không tối ưu theo cảm tính.

---

## 6. Công cụ và CI

### 6.1 Sửa ngay

- **Lockfile:** chạy `npm install`, commit `package-lock.json` để `npm ci` (CI đang dùng) chạy được.
- **ESLint đang không lint file `.ts`.** Cấu hình hiện chỉ áp dụng cho `*.js/*.mjs`; chạy thử trên `main.ts` nhận cảnh báo "File ignored because no matching configuration". Ví dụ cấu hình (cần chỉnh theo phiên bản thực tế):

```js
// eslint.config.js (trích)
import tseslint from 'typescript-eslint';

export default [
  // ...cấu hình hiện có
  ...tseslint.configs.recommended,
  {
    files: ['apps/web/src/**/*.ts'],
    rules: {
      'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }],
    },
  },
];
```

### 6.2 Khoá ranh giới giữa các lớp

```js
// .dependency-cruiser.cjs (trích)
module.exports = {
  forbidden: [
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
    {
      name: 'domain-no-ui',
      severity: 'error',
      from: { path: '^apps/web/src/domain' },
      to: { path: '^apps/web/src/(ui|rendering)' },
    },
    {
      name: 'battle-rules-pure',
      severity: 'error',
      from: { path: '^apps/web/src/battle/rules' },
      to: { path: '^apps/web/src/(ui|rendering|platform)' },
    },
  ],
};
```

Thêm vào `package.json`: `"deps:check": "depcruise apps/web/src --config .dependency-cruiser.cjs"` và gọi trong `ci`.

### 6.3 Thứ tự bước CI đề xuất

`validate:schemas` → `lint` (có TS) → `deps:check` → `format:check` → `typecheck:web` → `test:web` → `build:web`.

---

## 7. Lộ trình

| Bước | Nội dung | Tiêu chí hoàn thành | Cỡ |
|---|---|---|---|
| **P0 – Chiến đấu** | Sửa nhóm lỗi P0: gọi `getFirstAttacker` trong controller; chiêu damage cố định và OHKO (`power = 0`); chặn recoil/drain theo HP còn lại; xử lý tự ngất vì recoil; lên cấp tính lại toàn bộ chỉ số; thống nhất công thức EXP; `syncBattleResult` khớp theo `uid` | Mỗi lỗi có test tái hiện và pass | M |
| **A** | Sửa lockfile; ESLint cho TS; `max-lines`; `dependency-cruiser`; dọn file di sản ở thư mục gốc; loại asset trùng | CI xanh; `npm ci` chạy được | S |
| **B** | Đưa mô hình dùng chung ra khỏi `battle/`; bỏ `battle → ui` bằng cổng; phá vòng `terrain ↔ village` | `deps:check` không còn vi phạm V1–V5 | M |
| **C** | Tách `style.css` và các file ở mục 3.3 | Không file nào vượt 600 dòng | L |
| **D** | Sửa H1–H3, H6; tải trước chunk theo ngân sách | Số đo trước/sau trong PR; không tụt khung hình khi qua biên chunk | M |
| **E** | Build theo manifest; nạp lười hoạt ảnh chiêu thức; nén asset | `dist` giảm rõ rệt; không thiếu asset | M |
| **F** | Web Worker cho sinh thế giới | Chạy ổn định trước khi bật world gen v2 | M |
| **Sau đó** | Overworld v2 theo kế hoạch đã soạn (lục địa, độ cao, khí hậu, biome, thủy văn, thị trấn) | Theo giai đoạn P0–P7 của kế hoạch overworld | L |

P0 và bước A có thể chạy song song. Bước B và D nên xong **trước** overworld v2, vì `chunk-objects` và `village-rules` vừa là file bị sửa nhiều nhất vừa đang vượt giới hạn kích thước.

---

## 8. Checklist cho mỗi PR

- [ ] Không thêm import ngược tầng; `npm run deps:check` xanh.
- [ ] Không có vòng import mới.
- [ ] Không file nào vượt 400 dòng (hoặc có comment lý do).
- [ ] Luật chơi mới là hàm thuần, ngẫu nhiên đi qua RNG được tiêm vào.
- [ ] Có test cho hành vi mới hoặc lỗi vừa sửa.
- [ ] Không dùng singleton trực tiếp trong code mới.
- [ ] Thay đổi hiệu năng có số đo trước/sau.
- [ ] Asset mới đặt tên không dấu cách, không trùng nội dung asset cũ, đã khai báo trong manifest.
- [ ] `npm run ci` chạy qua cục bộ.

---

## 9. Phụ lục

### 9.1 Số liệu tham chiếu

| Số liệu | Giá trị | Điều kiện |
|---|---|---|
| Test web | 111/111 pass (14 file) | `vitest` tại `82bb3e71` |
| Bundle JS | `index` 154KB (46KB gz), `gameplay-ui` 128KB (35KB gz), `pokedex` 48KB (12KB gz) | `vite build`, sau `npm install` |
| Chunk dữ liệu | `moves` 335KB (58KB gz), `pokemon` 288KB (36KB gz), `items` 259KB (46KB gz) | như trên |
| Thời gian build | ~14 giây | như trên |
| Sinh chunk | trung bình 6,7ms, p95 19ms, tối đa 134ms (120 chunk) | Node, không canvas, JIT lạnh |
| `getTileData` | ~3µs/lần (20.000 lần ≈ 60ms) | Node |
| Fan-in cao nhất | `battle/types.ts` = 17 | đồ thị import tĩnh |

### 9.2 Chưa kiểm chứng

- Chưa profile trong trình duyệt thật (GPU, bộ nhớ ảnh giải mã, thời gian vẽ canvas).
- Chưa kiểm tra các chunk dữ liệu JSON có nạp lười hay nạp ngay lúc khởi động.
- Chưa phân tích asset nào không được tham chiếu (chỉ phát hiện file trùng nội dung).
- Chưa chạy test Python, build Tauri và `npm run ci` đầy đủ.
- Con số sinh chunk đo trong Node chỉ mang tính tham khảo cho phần tính toán, không gồm bước vẽ nền vào canvas.

### 9.3 Tài liệu cần cập nhật theo định hướng này

- `docs/plans/02-architecture.md`: thay sơ đồ có backend bằng kiến trúc client-only ở mục 2.
- `docs/plans/03-repository-structure.md`: cập nhật cây thư mục theo mục 3.
- `docs/plans/04-frontend-plan.md`: ghi rõ không dùng Phaser/React; công nghệ thực tế là TypeScript thuần.
- `docs/plans/05-backend-plan.md`: đánh dấu "hoãn", kèm điều kiện mở lại (D2).
- `docs/DEV_GUARDRAILS.md`: thêm quy tắc mục 2.2, chuẩn Gen 7 (D3) và giới hạn kích thước mục 3.2.
- `docs/PROGRESS.md`: rút gọn, bỏ đường dẫn cục bộ; chuyển quyết định thiết kế sang `docs/adr/`.
