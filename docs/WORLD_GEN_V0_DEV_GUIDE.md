# Hướng dẫn triển khai: Thế giới v0 (vô hạn, sinh theo seed)

- **Cơ sở:** mã nguồn tại commit `503fa631`
- **Phạm vi:** `apps/web/src/maps/`, `game/game-session.ts`, `rendering/ground-renderer.ts`, `ai/wild-pokemon.ts`, test và công cụ đi kèm
- **Trạng thái:** đề xuất triển khai. Mọi số liệu tham số là **giá trị khởi điểm**, phải chỉnh bằng công cụ xem bản đồ (bước S3)
- **Quyết định đã chốt:** thế giới **vô hạn** sinh theo seed; nhân vật sinh ra ở một thị trấn khởi đầu cố định theo cốt truyện
- **Quyết định còn mở:** thị trấn khởi đầu có bắt buộc gần biển không (mục 12)

---

## 0. Mục tiêu và phạm vi

### Làm trong v0

Một thế giới hai chiều, vô hạn, mà **đổi seed là đổi hẳn bản đồ** (giống Minecraft), gồm đúng năm thành phần:

| Thành phần | Nguồn hình ảnh và nội dung (đã có) |
|---|---|
| Đồng bằng | Bộ cỏ nền, hoa, cây, cỏ cao |
| Đồi cao | Bộ vách 13 mảnh (`Hill_Cliff_Parts`), `getCliffTileKey` |
| Rừng rậm | Vùng sinh thái `dense_forest`, cây `deep` |
| Làng | Các công trình `pokecenter`, `pokemart`, `house_red`, `house_cottage`, `house_flowers`, `signpost`, ba cấp hamlet/town/city |
| Biển và bãi cát | Tile biển, sóng vỗ bờ, bộ cát 13 mảnh, `BEACH_WIDTH = 5` |

### Không đổi trong v0

- **Asset và sắp xếp hệ sinh thái hiện có được coi là đúng.** Không sửa sprite, không đổi sáu vùng sinh thái (`ecology/`), không đổi bảng gặp Pokémon, không đổi luật chiến đấu.
- Chỉ **thay nguồn quyết định địa hình** (ô nào là biển, cát, đồi, đường, làng); mọi thứ còn lại tiếp tục đọc kết quả đó.

### Ngoài phạm vi v0

Sông chảy từ núi ra biển, hang động, biome mới, cốt truyện và neo cốt truyện, trường độ khó, nhiều tầng độ cao. (Xem kế hoạch overworld tổng thể.)

---

## 1. Các điều bất biến (invariants) để không lỗi địa hình

Mọi thay đổi phải giữ đúng các điều sau; mỗi điều có test ở mục 8.

| # | Bất biến | Hệ quả khi vi phạm |
|---|---|---|
| I1 | **Tất định:** kết quả chỉ phụ thuộc `(gx, gy, seed)`. Không dùng `Date.now()`, `Math.random()`, trạng thái toàn cục thay đổi | Cùng seed ra hai bản đồ khác nhau |
| I2 | **Không phụ thuộc thứ tự sinh chunk:** sinh chunk A rồi B hay B rồi A đều ra cùng kết quả | Đường nối (seam) ở biên chunk, bản đồ khác nhau giữa các lần chơi |
| I3 | **Không dùng hàm siêu việt trong sinh thế giới:** cấm `Math.sin/cos/tan/exp/log/pow/atan2`; chỉ dùng số nguyên, `+ − × ÷`, `floor`, `sqrt` | Hai máy (hoặc hai engine) ra bản đồ lệch nhau ở vài ô biên (D11, chế độ LAN) |
| I4 | **Seed dùng đầy đủ 32 bit:** không còn `seed % 1000` | Đổi seed ít tác động (đo hiện tại: seed 101 và 202 chỉ khác ~17% ô) |
| I5 | **Thứ tự ưu tiên lớp giữ nguyên:** hill → sand → ocean → bridge → road → water → grass (như `generateChunkTerrain`) | Tile chồng lấn, sai viền |
| I6 | **Hình dạng hợp lệ cho autotile:** đồi dày ≥ 3 ô, không có lỗ hoặc nhô 1 ô; không có ô cát mồ côi; đồi không liền kề cát | Vách ghép sai mảnh, viền cát hở |
| I7 | **Mọi thay đổi thuật toán làm đổi kết quả thì tăng `worldGenVersion`;** save cũ vẫn mở bằng thuật toán cũ | Người chơi cũ thấy thế giới đổi dưới chân |
| I8 | **Bản cũ (`legacy`) chạy được và không đổi** cho đến khi v0 qua nghiệm thu | Mất đường lùi |

---

## 2. Kiến trúc: giao diện `TerrainField`

### 2.1 Vấn đề cần giải quyết

`autotile.ts`, `chunk-terrain.ts`, `chunk-objects.ts`, `village-rules.ts`, `ecology/ecology-field.ts`, `ai/wild-pokemon.ts`, `rendering/ground-renderer.ts` và `game-session.ts` đều **gọi thẳng** các hàm của `maps/terrain-rules.ts` (`isHillTile`, `isSandTile`, `isOceanTile`, `isRoadTile`, `isWaterTile`, `isLakeTile`, `isNearWater`, `isNearCliffEdge`, `getRoadCenterX`...), vốn gắn với dải hẹp ở giữa.

> Lưu ý tên: `battle/rules/environment/terrain-rules.ts` là mô-đun **địa hình chiến đấu**, không liên quan, đừng nhầm khi tìm kiếm.

### 2.2 Giao diện đề xuất

```ts
// maps/terrain-field/terrain-field.ts
export interface TerrainField {
  readonly version: number;                 // = worldGenVersion
  isOcean(gx: number, gy: number): boolean;
  isSand(gx: number, gy: number): boolean;
  isHill(gx: number, gy: number): boolean;
  isRoad(gx: number, gy: number): boolean;
  isBridge(gx: number, gy: number): boolean;
  isWater(gx: number, gy: number): boolean;     // v0: chỉ hồ nếu có; không có sông
  isLake(gx: number, gy: number): boolean;
  isNearWater(gx: number, gy: number, radius: number): boolean;
  isNearCliffEdge(gx: number, gy: number): boolean;
  // Vị trí xuất phát của người chơi (thay cho getRoadCenterX(0, seed))
  getSpawn(): { gx: number; gy: number };
}

export function createTerrainField(version: number, seed: number): TerrainField;
```

- `LegacyStripField`: bọc nguyên các hàm hiện có, **không đổi hành vi** (`version = 1`).
- `V0Field`: bản mới (`version = 2`, giá trị phải đối chiếu với giá trị `worldGenVersion` hiện ghi trong `bootstrap.ts`).
- Truyền `field` **tường minh** (constructor), không dùng biến toàn cục: `ChunkManager(seed, field)`, `WorldChunk(..., field)`, `GameSession.field`. Khi `regenerate(seed)` tạo field mới.

### 2.3 Nơi đặt file

```
apps/web/src/maps/terrain-field/
  terrain-field.ts       giao diện + createTerrainField
  legacy-field.ts        bọc terrain-rules hiện có
  v0-field.ts            cài đặt v0
  noise.ts               hash, value noise, fbm (không dùng Math.sin/cos)
  terrain-plan.ts        sinh "cửa sổ" địa hình có lề và bộ nhớ đệm
  morphology.ts          erode / dilate / open / close trên lưới nhị phân
  settlement-sites.ts    điểm làng theo ô vùng
  roads.ts               đường nối làng (A*)
  start-town.ts          tìm thị trấn khởi đầu và vùng khởi đầu
```

(Sau này chuyển nguyên thư mục vào `world/gen/` theo kế hoạch tái cấu trúc.)

### 2.4 Các nơi phải chuyển sang dùng `field`

| File | Hàm đang gọi trực tiếp |
|---|---|
| `maps/chunk-terrain.ts` | `isSandTile, isOceanTile, getOceanTileId, isRoadTile, isHillTile, isBridgeTile, isWaterTile` |
| `maps/autotile.ts` | `isSandTile, isOceanTile, isRoadTile, isHillTile, isWaterOrBridge` (đang đọc hàng xóm trực tiếp) |
| `maps/chunk-objects.ts` | `isSandTile, isRoadTile, isHillTile, isValidTreePosGlobal, isValidPalmTreePosGlobal, isNearWater, isNearCliffEdge, isBridgeTile, isOceanTile, isWaterTile` |
| `maps/village-rules.ts` | `getRoadCenterX, isRiverTile, isLakeTile, isHillTile, isSandTile, isOceanTile, isNearWater` |
| `maps/ecology/ecology-field.ts` | `isNearWater, isHillTile, isNearCliffEdge, isSandTile` |
| `ai/wild-pokemon.ts` | `isRoadTile, isSandTile, isHillTile` |
| `rendering/ground-renderer.ts` | `isLakeTile` |
| `game/game-session.ts` | `isNearWater, getRoadCenterX` |

`isValidTreePosGlobal` và `isValidPalmTreePosGlobal` hiện có các điều kiện theo hình dạng dải cũ; phải **viết lại dựa trên các hàm của `field`** (cây không mọc trên đồi, vách, cát, biển, đường, làng).

---

## 3. Thuật toán v0

### 3.1 Noise (không dùng `Math.sin/cos`)

`maps/noise.ts` hiện chỉ có hàm hash. Thêm nội suy mượt và nhiều tầng:

```ts
// noise.ts (minh họa; số nguyên 32-bit, kết quả tất định)
export function hash2(ix: number, iy: number, seed: number, salt: number): number {
  let h = Math.imul(ix | 0, 0x27d4eb2d) ^ Math.imul(iy | 0, 0x165667b1) ^ Math.imul((seed ^ salt) | 0, 0x9e3779b1);
  h ^= h >>> 15; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;   // [0, 1)
}
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);   // quintic

export function valueNoise2(x: number, y: number, seed: number, salt: number): number {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = fade(x - x0), fy = fade(y - y0);
  const a = hash2(x0, y0, seed, salt),     b = hash2(x0 + 1, y0, seed, salt);
  const c = hash2(x0, y0 + 1, seed, salt), d = hash2(x0 + 1, y0 + 1, seed, salt);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

export function fbm2(x: number, y: number, seed: number, salt: number, octaves = 4): number {
  let amp = 0.5, f = 1, sum = 0, norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise2(x * f, y * f, seed, salt + i * 101);
    norm += amp; amp *= 0.5; f *= 2;
  }
  return sum / norm;                // xấp xỉ [0, 1]
}
```

Mỗi trường dùng một `salt` riêng (đất/biển, độ cao, làng...) để không tương quan. Hash dùng đủ 32 bit của seed (I4).

> Value noise có thể lộ vệt theo lưới ở quy mô lớn. Nếu thấy rõ trên bản đồ, đổi sang gradient noise hoặc xoay/lệch tọa độ giữa các tầng; thay đổi này phải qua công cụ xem bản đồ.

### 3.2 Trường đất và biển

```
C(x, y) = fbm2(x / CONT_SCALE, y / CONT_SCALE, seed, SALT_CONT, 4)
đất nếu  C >= SEA_LEVEL
```

Giá trị khởi điểm: `CONT_SCALE = 400`, `SEA_LEVEL = 0.48`. Để chính các seed khác nhau cho tỉ lệ đất khác nhau chứ không đồng nhất, **không** chuẩn hóa C theo seed.

### 3.3 Trường độ cao và đồi cao

```
E(x, y)  = fbm2(x / ELEV_SCALE, y / ELEV_SCALE, seed, SALT_ELEV, 4)
mask(x,y) = smoothstep(SEA_LEVEL + BEACH_MARGIN, SEA_LEVEL + BEACH_MARGIN + FADE, C)
E'(x, y) = E * mask       // đồi chỉ xuất hiện xa bờ
đồi thô nếu E' >= HILL_T
```

Giá trị khởi điểm: `ELEV_SCALE = 160`, `HILL_T = 0.62`, `BEACH_MARGIN = 0.02`, `FADE = 0.06`.

### 3.4 Cát và bờ biển

Cát = ô **đất** nằm trong bán kính `BEACH_WIDTH` (Chebyshev, hiện là 5) tính từ một ô biển. Tính bằng **giãn nở (dilation)** trên lưới nhị phân, không dò từng ô riêng lẻ (xem 3.6).

### 3.5 Làm sạch hình dạng (morphology)

Chỉ dùng phép toán hình thái **cục bộ** (không dùng flood-fill tính diện tích vì kết quả sẽ phụ thuộc cửa sổ, vi phạm I2):

1. Loại đồi trong vòng 2 ô quanh cát: `hill &= !dilate(sand, 2)` (I6: đồi không liền kề cát).
2. **Opening** bán kính 1 (erode rồi dilate) để xoá mảnh mỏng hơn 3 ô.
3. **Closing** bán kính 1 để lấp lỗ 1 ô.
4. Lặp lại bước loại cát liền kề (vì closing có thể nở ra).

### 3.6 Cửa sổ có lề (window) và bộ nhớ đệm

Các bước trên là toán tử cục bộ có **bán kính phụ thuộc**. Để mọi ô cho kết quả giống nhau bất kể sinh chunk nào trước (I2), mỗi chunk được tính trên một **cửa sổ rộng hơn chunk một lề `MARGIN`**:

```
chunk 16x16  →  cửa sổ (16 + 2*MARGIN) x (16 + 2*MARGIN)
```

Tính `MARGIN` bằng tổng bán kính theo chuỗi phụ thuộc:

| Bước | Bán kính |
|---|---|
| Cát từ biển (`BEACH_WIDTH`) | 5 |
| Loại đồi quanh cát | 2 |
| Opening (erode + dilate) | 2 |
| Closing (dilate + erode) | 2 |
| Autotile đọc hàng xóm | 1 |
| **Tổng** | **12** |

`MARGIN = 12` (giá trị khởi điểm). **Cứ đổi bất kỳ bán kính nào là phải tính lại `MARGIN`**; test cửa sổ (mục 8.2) bắt lỗi nếu sai.

```ts
// terrain-plan.ts (minh họa)
interface TerrainPlan { cx: number; cy: number; cls: Uint8Array /* (16+2M)^2 */ }
// cls: 0 = grass, 1 = sand, 2 = ocean, 3 = hill
function planFor(cx: number, cy: number): TerrainPlan {
  // 1. C, E trên cửa sổ  2. ocean mask  3. sand = dilate(land & near ocean)
  // 4. hill = (E' >= HILL_T) & !dilate(sand, 2)  5. open/close  6. gộp thành cls
}
classAt(gx, gy) → đọc ô nằm trong vùng lõi của plan của chunk chứa (gx, gy)
```

- `isOcean/isSand/isHill` chỉ đọc `classAt` (O(1) sau khi có plan).
- Bộ nhớ đệm plan theo **LRU có giới hạn** (ví dụ 128 plan, mỗi plan khoảng 1,6KB). Khóa dùng số, không dùng chuỗi `` `${cx},${cy}` `` (H3).
- Truy vấn ô sát biên chunk (autotile, wild AI) đọc plan của chunk lân cận, nên **không** đọc dữ liệu `WorldChunk` đã sinh.

### 3.7 Rừng rậm

Giữ nguyên `ecology/` (độ phì, độ ẩm, mật độ, sáu vùng). Chỉ đổi nguồn `isNearWater / isHill / isNearCliffEdge / isSand` sang `field`. Không đặt cây trên đồi, vách, cát, biển, đường, nền làng (các bộ kiểm tra hiện có phải đọc `field`). Các test thống kê hiện có (`ecology-statistical`) có thể lệch ngưỡng vì phân bố gần nước/đồi đã đổi; chỉ chỉnh ngưỡng khi có lý do và ghi lại.

### 3.8 Làng và đường

**Điểm đặt làng:**
1. Chia thế giới thành ô vùng `REGION = 96` (giá trị khởi điểm).
2. Mỗi ô vùng có một điểm ứng viên: tọa độ lệch ngẫu nhiên theo `hash2(rx, ry, seed, SALT_VIL)`, cùng một xác suất xuất hiện (ví dụ 70%).
3. **Nhận điểm** khi toàn bộ vùng chiếm chỗ của làng (khung quanh bố cục, cộng lề 6 ô) thỏa: toàn đất, không cát, không đồi, không sát vách, cách biển ≥ 12 ô. Kiểm bằng `field` nên dùng được trên nhiều chunk.
4. Cấp (hamlet/town/city) chọn theo hash và theo "độ quan trọng" (noise riêng, gần bờ hoặc ngã ba được cộng điểm).
5. **Khoảng cách tối thiểu** giữa hai làng (khởi điểm 160 ô) để không dính nhau khi hai ô vùng kề nhau đều nhận điểm.

**Bố cục:** dùng lại các bộ dựng trong `village-rules.ts`, nhưng đổi đầu vào từ "hàng gốc + tâm đại lộ" sang **điểm neo** (`anchorGX, anchorGY`). Giữ hướng Bắc cố định trong v0 (chưa xoay). Cấu trúc lớn được định nghĩa theo tọa độ toàn cục, mỗi chunk chỉ tra ô của mình.

**Đường nối:** nối mỗi làng với láng giềng gần nhất (cặp sắp theo thứ tự chuẩn hóa để hai ô vùng kề nhau tính ra cùng một đường):
- Dùng A\* 4 hướng trong khung chữ nhật quanh hai điểm, chi phí: cỏ 1, cát 3, rừng rậm 1,5, đồi và biển không đi được.
- Tie-break tất định (ưu tiên theo thứ tự hướng cố định).
- Kết quả là tập ô đường lưu trong bộ nhớ đệm theo cặp; `isRoad` tra tập này.
- Nếu không có đường nối thì không đặt cặp đó (ghi log); riêng cặp **thị trấn khởi đầu ↔ thị trấn thứ hai** là bắt buộc (mục 3.9).

### 3.9 Thị trấn khởi đầu và vùng khởi đầu

Thuật toán `findStartTown(seed, baseField)`:
1. Duyệt các ô vùng theo vòng xoắn từ gốc tọa độ ra ngoài (thứ tự cố định).
2. Với mỗi điểm làng hợp lệ (mục 3.8), chấm điểm: gần gốc, độ phẳng quanh điểm, cách biển hợp lý. Có tham số `startNearCoast` (mục 12).
3. Chọn điểm điểm cao nhất; hòa thì dùng hash seed.
4. Nếu không có ứng viên trong `START_RADIUS` (khởi điểm 2000 ô) thì nới ràng buộc theo thứ tự cố định (ghi log); cuối cùng mới dọn một khoảng đất bằng.

**Vùng khởi đầu được làm dịu** quanh thị trấn (khởi điểm: bán kính `R0 = 120`, `R1 = 300`): trộn độ cao và mật độ rừng về giá trị hiền hòa bằng `w = smoothstep(R0, R1, khoảng cách)`.

> Quy tắc để tránh vòng phụ thuộc: **chỉ làm dịu độ cao `E` và mật độ rừng, tuyệt đối không đổi `C` (đất/biển)**. Như vậy điểm xuất phát chọn trên trường gốc vẫn đúng sau khi làm dịu.

Bảo đảm:
- Thị trấn thứ hai nối bằng đường trong khoảng 300–600 ô (nếu cần, thêm một điểm làng trong dải đó).
- Không có biển hay vách chặn con đường đầu tiên.
- Có cỏ cao gần thị trấn (nhờ sinh thái hiện có) để gặp Pokémon đầu.

### 3.10 Điểm xuất phát và cờ phiên bản

- Thay `getRoadCenterX(0, this.seed)` trong `GameSession` bằng `field.getSpawn()`.
- `worldGenVersion` được ghi vào bản lưu (đã có trường), giá trị v0 là `2`; mở save có `worldGenVersion = 1` thì dùng `LegacyStripField`.
- Lưu cố định `startTown { siteId, gx, gy, name, tier }` vào bản lưu khi tạo thế giới, để đổi thuật toán sau này không làm dịch quê hương của nhân vật.

---

## 4. Các lỗi địa hình dễ gặp và cách chặn

| Lỗi | Nguyên nhân thường gặp | Cách chặn |
|---|---|---|
| Đường nối ở biên chunk | Dùng dữ liệu chunk đã sinh thay vì hàm toàn cục; lề cửa sổ quá nhỏ | Mọi truy vấn đọc `classAt`; test cửa sổ (8.2) |
| Vách ghép sai mảnh, viền cát hở | Đồi mỏng, lỗ 1 ô, đồi liền cát | Opening/closing, loại đồi quanh cát (3.5), test hình dạng (8.3) |
| Ô cát mồ côi giữa đồng | Cát tính theo ngưỡng thay vì theo giãn nở từ biển | Cát luôn dẫn xuất từ mặt nạ biển |
| Làng đè lên biển, đồi hay vách | Chỉ kiểm tâm làng, không kiểm vùng chiếm chỗ | Kiểm toàn vùng có lề (3.8) |
| Đường cắt qua biển hoặc đồi | Đường chữ L thẳng | A\* với đồi/biển không đi được (3.8); test (8.6) |
| Người chơi xuất hiện trong biển hoặc kẹt | Spawn tại gốc tọa độ | `findStartTown` (3.9); test (8.5) |
| Đổi seed nhưng bản đồ gần như cũ | `seed % 1000`, tần số thấp quá nhẹ | I4; test seed (8.4) |
| Hai máy ra bản đồ lệch | `Math.sin/cos` | I3 + quy tắc ESLint (mục 9) |
| Hiệu năng giảm | Tính cả cửa sổ lại nhiều lần | LRU plan, khóa số, đo ở S8 |
| Test cũ vỡ | Test gắn tọa độ dải cũ | Giữ chạy trên `legacy` (mục 8.9) |
| Cây mọc trên vách hoặc cát | `isValidTreePosGlobal` còn logic dải cũ | Viết lại theo `field` (2.4) |
| Pokémon hoang dã đi vào đồi/biển | `wild-pokemon.ts` đọc `isHillTile/isSandTile` cũ | Chuyển sang `field` (2.4) |

---

## 5. Kế hoạch từng bước

Mỗi bước kết thúc bằng một kết quả kiểm chứng được. **Không gộp hai bước vào một commit.** Quy ước cỡ: S nhỏ, M vừa, L lớn.

| Bước | Nội dung | File chính | DoD (điều kiện hoàn thành) | Cỡ |
|---|---|---|---|---|
| **S1** | Giao diện `TerrainField` + `LegacyStripField`; nối `ChunkManager`, `WorldChunk`, `GameSession` qua `field` | `terrain-field/*`, 8 consumer ở 2.4 | Toàn bộ test hiện có pass **không sửa**; hash 400 chunk legacy (seed 101) trước và sau **giống hệt** (golden) | M |
| **S2** | `noise.ts` mượt + `morphology.ts` + test đơn vị | `noise.ts`, `morphology.ts` | Test dải giá trị, tất định, không lộ seam, độ nhạy seed, erode/dilate đúng | S |
| **S3** | Công cụ xuất bản đồ PNG (xem 6) | `scripts/world/render-map.*` | Xuất ảnh 2048×2048 từ seed bất kỳ trong vài giây; dùng làm mốc trước/sau | S |
| **S4** | `V0Field`: đất/biển, cát, đồi + cửa sổ có lề + LRU | `v0-field.ts`, `terrain-plan.ts` | Test bất biến I1–I6 (mục 8.1–8.4) pass với 200 seed | L |
| **S5** | Chuyển nốt consumer sang `field` dùng v0: sinh thái, cây, AI hoang dã, renderer, spawn tạm | 8 consumer ở 2.4 | Không còn import trực tiếp `terrain-rules` ngoài `legacy-field.ts` (lệnh grep) | M |
| **S6** | Làng + đường + thị trấn khởi đầu + vùng khởi đầu | `settlement-sites.ts`, `roads.ts`, `start-town.ts`, `village-rules.ts` | Test 8.5, 8.6 pass với 200 seed | L |
| **S7** | Cờ phiên bản, lưu `startTown`, tạo thế giới mới dùng v0, save cũ mở bằng legacy | `bootstrap.ts`, `save-*`, `game-session.ts` | Mở save cũ ra đúng thế giới cũ; thế giới mới ra v0 | M |
| **S8** | Chỉnh tham số bằng mắt, đo hiệu năng, cập nhật tài liệu | tham số mục 7 | Mục 10 (nghiệm thu) đạt | M |

**Thứ tự bắt buộc:** S1 → S2 → S3 → S4 → S5 → S6 → S7 → S8. S3 nên làm ngay sau S2 để mọi bước sau có hình để so.

---

## 6. Công cụ xuất bản đồ (S3)

- Script Node (chạy bằng `tsx` hoặc build rồi chạy) nhận `--seed`, `--x0 --y0`, `--size`, `--scale` và `--out`.
- Mỗi pixel là một ô (hoặc một khối n×n ô khi phóng xa); tô màu theo lớp: biển xanh sẫm, cát vàng, đồi nâu/xám, đồng bằng xanh lá nhạt, rừng rậm xanh đậm (theo vùng sinh thái), làng đỏ, đường vàng đất, vị trí xuất phát khung sáng.
- Ghi PNG bằng `zlib` có sẵn của Node (hoặc một thư viện PNG nhỏ làm devDependency), không kéo thêm công cụ nặng.
- Dùng cùng công cụ cho `legacy` (`--version 1`) để có ảnh "trước" làm mốc.
- Thêm một chế độ in thống kê: tỉ lệ đất/biển/đồi/cát, số làng, độ dài đường.

---

## 7. Bảng tham số (giá trị khởi điểm, cần chỉnh bằng bản đồ)

| Tham số | Khởi điểm | Ảnh hưởng |
|---|---|---|
| `CONT_SCALE` | 400 ô | Kích thước lục địa/đại dương (to hơn thì mảng đất rộng hơn) |
| `SEA_LEVEL` | 0,48 | Tỉ lệ đất/biển |
| `BEACH_WIDTH` | 5 (đã có) | Độ rộng bãi cát |
| `ELEV_SCALE` | 160 ô | Kích thước các mảng đồi |
| `HILL_T` | 0,62 | Tỉ lệ đồi (cao hơn thì ít đồi) |
| `BEACH_MARGIN`, `FADE` | 0,02 / 0,06 | Đồi cách bờ bao xa |
| Bán kính morphology | 1 | Độ dày tối thiểu của đồi |
| `MARGIN` (lề cửa sổ) | 12 | Phải ≥ tổng bán kính phụ thuộc (3.6) |
| `REGION` | 96 ô | Mật độ làng |
| Khoảng cách làng tối thiểu | 160 ô | Làng không dính nhau |
| `START_RADIUS` | 2000 ô | Phạm vi tìm thị trấn khởi đầu |
| `R0, R1` (làm dịu) | 120, 300 ô | Cỡ vùng khởi đầu hiền hòa |
| Cách biển tối thiểu của làng | 12 ô | Làng không sát bờ |

Mục tiêu tham khảo khi chỉnh: tỉ lệ đất khoảng 40–65% tùy seed (không đồng nhất giữa các seed), đồi khoảng 8–18% diện tích đất, ít nhất vài làng trong bán kính 800 ô quanh khởi đầu. Đây là mục tiêu **cần xác nhận lại bằng bản đồ**, không phải số bắt buộc.

---

## 8. Bộ test bắt buộc

Đặt trong `apps/web/test/world-v0/`. Dùng seed cố định cho test nhanh và quét 200 seed cho test thống kê.

### 8.1 Tất định và thứ tự sinh (I1, I2)
- Cùng seed → hash của 400 chunk giống hệt qua hai lần chạy.
- Sinh các chunk theo thứ tự ngẫu nhiên khác nhau (nhiều hoán vị) → kết quả từng chunk giống nhau.
- Không có `Date.now`, `Math.random` trong thư mục `terrain-field/` (kiểm bằng ESLint).

### 8.2 Cửa sổ và biên chunk
- Tính plan với `MARGIN = 12` và với `MARGIN = 20`: vùng lõi phải **giống hệt** (nếu khác, `MARGIN` quá nhỏ).
- Ô ở biên giữa hai chunk: lớp của ô ở phía này bằng lớp mà plan phía kia báo cho cùng tọa độ.

### 8.3 Hình dạng (I6)
- Không có mảnh đồi mỏng hơn 3 ô, không có lỗ 1 ô trong đồi.
- Mọi ô đồi cách cát ≥ 2 ô.
- Mọi ô cát đều nằm trong `BEACH_WIDTH` của một ô biển (không cát mồ côi).
- Không có ô biển nằm giữa đồng bằng mà không có đường bờ (hồ biển 1 ô).

### 8.4 Seed (I4)
- Hai seed khác nhau cho bản đồ khác nhau (tỉ lệ ô khác trên một vùng 1000×1000 vượt một ngưỡng, ví dụ 40%).
- Seed cách nhau 1000 cũng cho bản đồ khác hẳn (chứng minh bỏ `seed % 1000`).
- Tỉ lệ đất/biển nằm trong khoảng hợp lý với ≥ 95% trong 200 seed và **không** đồng nhất giữa các seed.

### 8.5 Thị trấn khởi đầu
- Với 200 seed: luôn có thị trấn khởi đầu trong `START_RADIUS`.
- Vùng 21×21 quanh điểm xuất phát đi bộ được; thị trấn không dính biển/đồi.
- Thị trấn thứ hai tồn tại và **đường BFS trên lưới đi bộ được** nối hai thị trấn, độ dài trong khoảng cho phép.
- Kết quả không đổi khi sinh chunk theo thứ tự khác.
- Làm dịu không đổi đất/biển: lớp (đất/biển) trước và sau làm dịu giống hệt.

### 8.6 Làng và đường
- Mọi ô trong vùng chiếm chỗ của làng là đất bằng (không cát, đồi, biển).
- Khoảng cách giữa hai làng ≥ khoảng cách tối thiểu.
- Mọi ô đường đi bộ được và không phải đồi/biển; đồ thị đường liên thông theo cặp đã khai báo.

### 8.7 Sinh thái
- Chạy lại `ecology-statistical`, `natural-plants`, `tree-overlap`, `beach-palm-trees` trên v0 (thế giới v0 thay cho dải cũ); chỉnh ngưỡng nếu cần và ghi lý do trong commit.

### 8.8 Hiệu năng
- Trung bình sinh một chunk không vượt quá baseline hiện tại (khoảng 6,7ms trong Node, đo trước khi bắt đầu) cộng 50%; p95 ≤ 20ms. Ngân sách này là **đề xuất**, đo lại trên máy thật.
- Bộ nhớ đệm plan không tăng khi đi lâu (số plan ≤ giới hạn LRU).

### 8.9 Tương thích
- Test cũ gắn tọa độ dải (`village`, `ocean-beach`, `water-terrain`, `collision`, `chunk-boundary`...) chạy với `LegacyStripField`; không xóa.
- Save `worldGenVersion = 1` mở ra đúng thế giới cũ và đúng vị trí.

---

## 9. Quy tắc ESLint và CI cho thư mục sinh thế giới

Thêm cho `apps/web/src/maps/terrain-field/**`:

```js
// eslint.config.js (trích; chỉnh theo cấu hình hiện có)
{
  files: ['apps/web/src/maps/terrain-field/**/*.ts'],
  rules: {
    'no-restricted-properties': ['error',
      { object: 'Math', property: 'sin' },   { object: 'Math', property: 'cos' },
      { object: 'Math', property: 'tan' },   { object: 'Math', property: 'exp' },
      { object: 'Math', property: 'log' },   { object: 'Math', property: 'pow' },
      { object: 'Math', property: 'atan2' }, { object: 'Math', property: 'random' },
      { object: 'Date', property: 'now' },
    ],
    'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }],
  },
},
```

Và quy tắc phụ thuộc (dependency-cruiser): `terrain-field/` **không** import `rendering/`, `ui/`, `battle/`, `domain/`.

CI chạy theo thứ tự hiện có, thêm `test/world-v0/`.

---

## 10. Tiêu chí nghiệm thu v0

- [ ] Đổi seed → bản đồ khác hẳn; cùng seed → giống hệt (ảnh xuất từ công cụ S3 minh chứng với ít nhất 5 seed).
- [ ] Đi theo mọi hướng từ khởi đầu: có đồng bằng, rừng, đồi, biển, làng; không "hết thế giới".
- [ ] Không có seam ở biên chunk, không có vách/cát ghép sai mảnh trên 200 seed (test 8.2–8.3).
- [ ] Mọi seed đều có thị trấn khởi đầu hợp lệ và thị trấn thứ hai nối được.
- [ ] Toàn bộ test hiện có pass trên `legacy`; test mới pass trên v0.
- [ ] Hiệu năng sinh chunk trong ngân sách (8.8).
- [ ] Save cũ mở đúng; save mới ghi `worldGenVersion = 2` và `startTown`.
- [ ] Không còn import trực tiếp `maps/terrain-rules` ngoài `legacy-field.ts`.
- [ ] Không có `Math.sin/cos/...`, `Math.random`, `Date.now` trong `terrain-field/`.

---

## 11. Rủi ro và cách lùi

| Rủi ro | Xử lý |
|---|---|
| Vách xấu hoặc nhiều đồi lẻ | Chỉnh `HILL_T`, bán kính morphology, thêm bước làm mượt; luôn đối chiếu bằng ảnh |
| Value noise lộ vệt lưới | Đổi sang gradient noise hoặc lệch tọa độ giữa các tầng |
| Sinh chunk chậm hơn | LRU plan, tính theo nửa độ phân giải rồi nội suy cho trường chậm, Web Worker (H5) |
| Sinh thái lệch ngưỡng | Chỉnh ngưỡng test có lý do; không đổi cấu hình sinh thái trừ khi phát hiện lỗi thật |
| Vòng phụ thuộc giữa khởi đầu và làm dịu | Quy tắc 3.9 (chỉ làm dịu `E` và mật độ rừng) |
| Cần lùi | Cờ `worldGen: 'legacy'` vẫn chạy; v0 chỉ là mặc định cho thế giới mới sau nghiệm thu |

---

## 12. Cần chốt trước S6

1. **Thị trấn khởi đầu có bắt buộc gần biển không?** (`startNearCoast`)
   - *Có:* người chơi thấy biển sớm; ràng buộc chặt, có thể phải nới ở một số seed.
   - *Không (mặc định đề xuất):* nội địa cũng được; dễ tìm điểm hơn.
2. Kích thước ô vùng (`REGION`) và mật độ làng mong muốn.
3. Có cần xoay bố cục làng theo địa hình ngay ở v0 hay giữ hướng Bắc cố định (đề xuất giữ cố định).

---

## 13. Việc làm sau v0 (không nằm trong tài liệu này)

Sông từ núi ra biển và hồ theo thủy văn; trường khí hậu và nhiều biome; hang động; neo cốt truyện và trường độ khó; tái cấu trúc thư mục `world/gen`, `world/runtime`, cổng `WorldQuery`; Web Worker cho sinh chunk. Xem các tài liệu kế hoạch overworld và hướng dẫn kiến trúc.
