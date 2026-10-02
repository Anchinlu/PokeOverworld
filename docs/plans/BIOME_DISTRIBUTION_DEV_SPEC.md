# Đặc tả phân bố sinh thái theo vùng

**Trạng thái:** Kế hoạch, chưa triển khai  
**Đối tượng:** Frontend game runtime, map generator và QA  
**Phạm vi:** Cây, hoa, Berry, cỏ cao và Pokémon hoang dã  
**Không thuộc phạm vi:** Công thức terrain, tile ID, collider rules hiện có và địa hình nền

## 1. Mục tiêu

Thay thế cách sinh vật thể đang phân bố gần như đồng đều bằng một hệ thống sinh thái có tính vùng, nhưng vẫn giữ các yêu cầu nền tảng:

- Cùng `seed` và cùng tọa độ toàn cầu phải sinh ra kết quả giống nhau.
- Chunk sinh độc lập, không tạo đường biên bất thường khi ghép với chunk lân cận.
- Không làm thay đổi terrain generation hoặc các luật loại trừ va chạm hiện tại.
- Một nguồn thông tin vùng được dùng chung bởi cây, hoa, Berry, cỏ cao và encounter.
- Logic chọn dữ liệu không nằm lẫn trong renderer hoặc UI.
- Có thể mở rộng sang biome/region mới mà không phải sửa nhiều nhánh `if`.

## 2. Hiện trạng cần thay đổi

- Cây đang có 6 ứng viên cố định mỗi chunk; loại cây phụ thuộc `randX`, chưa dùng `defaultTree` trong `biomes.json`.
- Hoa được chọn theo xác suất đều trong từng phần tư chunk, chưa tạo cụm màu.
- Berry chỉ dùng 16 loại, chưa phân biệt loại thường/hiếm hoặc điều kiện sinh thái.
- Cỏ cao chưa phản ánh độ ẩm và chưa là điều kiện bắt buộc cho encounter.
- Pokémon đang lấy roster `ROUTE_1`, số lượng 0–2 con/chunk và level luôn bằng `minLevel`.
- `wild-pokemon.ts` còn dùng RNG runtime cho một số hành vi; phần sinh entity phải tiếp tục giữ deterministic.

## 3. Nguyên tắc kiến trúc

### 3.1. Single ecological field

Tạo module thuần dữ liệu tại `apps/web/src/maps/ecology/ecology-field.ts`. Module này là nguồn duy nhất để lấy thông tin vùng:

```ts
export interface EcologySample {
  fertility: number; // 0..1
  moisture: number; // 0..1
  density: number; // 0..1
  elevation: number; // 0..1
  nearWater: boolean;
  nearHill: boolean;
}

export function sampleEcology(gx: number, gy: number, seed: number): EcologySample;
```

Các generator chỉ gọi `sampleEcology`; không tự tạo noise riêng cho cùng mục đích.

### 3.2. Deterministic

- Không dùng `Math.random()` trong quá trình sinh chunk/entity.
- Mọi seed phụ phải có salt riêng, ví dụ `seed + ECOLOGY_MOISTURE_SALT`.
- `performance.now()` và RNG runtime chỉ dùng cho hành vi sau khi entity đã sinh.
- Level, loại sprite, mật độ và stage Berry đều phải tái tạo được từ `(gx, gy, seed, salt)`.

### 3.3. Biên chunk

Noise phải lấy tọa độ toàn cầu `gx/gy`, không lấy chỉ số local `lx/ly`. Luật đọc vùng lân cận phải có bán kính cố định để tránh sai khác tại mép chunk.

## 4. Ecological noise

Dùng value noise deterministic ở tần số thấp:

1. Chuyển `(gx, gy)` sang lattice coordinates bằng frequency cố định.
2. Lấy giá trị bốn điểm lattice bằng `seededHash` với salt riêng.
3. Nội suy bilinear bằng smoothstep.
4. Chuẩn hóa kết quả về `0..1`.

Không dùng `seededHash(gx, gy)` độc lập cho từng ô vì sẽ tạo nhiễu tần số cao, không tạo được cụm.

Đề xuất tham số ban đầu:

```ts
const ECOLOGY_FERTILITY_SALT = 0x2401;
const ECOLOGY_MOISTURE_SALT = 0x2402;
const ECOLOGY_DENSITY_SALT = 0x2403;
const ECOLOGY_FREQUENCY = 0.055;
```

Các hằng số này là tham số cân bằng. Khi đổi phải cập nhật statistical tests.

### 4.1. Profile vùng

```ts
export type EcologyZone =
  | 'coast'
  | 'wetland'
  | 'meadow'
  | 'dryland'
  | 'dense_forest'
  | 'hill_edge';
```

Thứ tự phân loại:

1. Gần nước và terrain hợp lệ → `coast` hoặc `wetland`.
2. Gần hill → `hill_edge`.
3. `density >= 0.68` → `dense_forest`.
4. `moisture <= 0.30` hoặc fertility thấp → `dryland`.
5. Còn lại → `meadow`.

Ngưỡng đặt trong một file config duy nhất.

## 5. Quy tắc cây

- Số ứng viên mục tiêu thay đổi theo `density`, khoảng 2–8 cây/chunk.
- Giữ kiểm tra terrain, collider, khoảng cách cây-cây và kiểm tra 9 chunk lân cận.
- Không thay đổi kích thước collider và các hàm chống overlap trong phase này.
- Gần cát/nước hợp lệ → `coastal`.
- `density >= 0.68` → `deep`.
- Vùng trung tính → `vibrant`.
- `moisture <= 0.30` hoặc fertility thấp → `autumn`.

`defaultTree` trong `biomes.json` phải được nối vào biome/profile hoặc được loại bỏ có chủ đích; không để field có vẻ có tác dụng nhưng runtime không đọc.

## 6. Quy tắc hoa

- Chia chunk thành cụm theo cluster seed, không chọn màu độc lập hoàn toàn từng ô.
- Mỗi vùng chọn 1–2 màu chủ đạo và 0–2 màu phụ.
- `wetland`, gần nước: ưu tiên `flower_white`, `flower_blue`.
- `dryland`: ưu tiên `flower_red`, `flower_purple`.
- `dense_forest`: ưu tiên `flower_blue`, `flower_purple`.
- `meadow`: ưu tiên `flower_red`, `flower_white`.
- Giữ các luật loại trừ tall grass/cliff/water hiện tại.
- Không tạo flower trên ô encounter grass.

## 7. Quy tắc Berry

Đưa metadata spawn vào data layer, đề xuất mở rộng `berry-data.ts`:

```ts
type BerryRarity = 'common' | 'uncommon' | 'rare';
type BerryHabitat = 'wet' | 'dry' | 'neutral';

interface BerrySpawnProfile {
  rarity: BerryRarity;
  habitat: BerryHabitat;
  weight: number;
}
```

- Common: Oran, Cheri, Pecha và các loại tương đương.
- Rare: Lum, Sitrus.
- Các sprite còn lại giữ trong asset/data nhưng chưa bật spawn khi chưa có region profile.
- `wetland/coast`: ưu tiên habitat `wet`.
- `dryland`: ưu tiên habitat `dry`.
- `meadow/forest`: dùng `neutral` và common.
- Rare Berry phải có weight thấp hơn common, không chọn đều.
- Giữ toàn bộ kiểm tra Berry-tree, Berry-Berry và kiểm tra 9 chunk lân cận.

## 8. Cỏ cao và Pokémon hoang dã

### 8.1. Tall grass

Mật độ cỏ cao được tính từ moisture, fertility và density:

```text
tallGrassDensity = clamp(
  baseDensity
  + moisture * moistureWeight
  + fertility * fertilityWeight
  + density * densityWeight,
  minDensity,
  maxDensity
)
```

Cỏ cao không được sinh trên terrain không hợp lệ, road, collider hoặc vùng bị loại trừ hiện tại.

### 8.2. Encounter context

Thay roster cố định bằng context của ô spawn:

```ts
interface EncounterContext {
  zone: EcologyZone;
  onTallGrass: boolean;
  nearWater: boolean;
  nearTree: boolean;
  nearHill: boolean;
  timeOfDay: 'day' | 'night';
}
```

`chunk-encounters.ts` chỉ chọn encounter từ context. Species và rate phải nằm trong `encounters.json` hoặc game-data, không hardcode trong generator.

Encounter thông thường yêu cầu `onTallGrass === true`. Water encounter chỉ bật khi terrain/biome đã hỗ trợ. Nếu chưa có authoritative world clock, dùng mặc định `day` qua feature flag.

### 8.3. Level deterministic

```ts
const levelRoll = seededHash(gx, gy, seed + LEVEL_SALT);
const level = minLevel + Math.floor(levelRoll * (maxLevel - minLevel + 1));
```

Level phải nằm trong inclusive range `[minLevel, maxLevel]` và giống nhau sau khi reload cùng seed.

## 9. Phân chia module đề xuất

```text
apps/web/src/maps/
├── ecology/
│   ├── ecology-field.ts       # value noise và sampleEcology
│   ├── ecology-profile.ts     # zone và ngưỡng
│   └── ecology-config.ts      # constants cân bằng
├── chunk-objects.ts           # điều phối object generators
├── chunk-encounters.ts        # chọn encounter theo context
└── berry-data.ts              # metadata và spawn profile Berry
```

`wild-pokemon.ts` chỉ cập nhật entity runtime, không tự quyết định phân bố map.

## 10. Debug overlay

Thêm các chế độ debug vào debug panel hiện có, tắt mặc định:

- `ecology-moisture`: heatmap xanh → vàng.
- `ecology-fertility`: heatmap thấp → cao.
- `ecology-density`: heatmap thưa → rậm.
- `ecology-zone`: tô màu theo zone.
- Thống kê chunk: số cây, hoa, Berry, tall grass, wild Pokémon.
- Thông tin ô: `gx`, `gy`, seed, zone, moisture, fertility, density.

Debug renderer chỉ đọc dữ liệu đã tính; không được tự tính lại bằng công thức khác.

## 11. Kiểm thử bắt buộc

### Unit tests

- Cùng `(gx, gy, seed)` cho cùng `EcologySample`.
- Đổi seed tạo khác biệt nhưng vẫn nằm trong `0..1`.
- Chunk kề nhau không tạo seam bất thường tại cùng tọa độ global.
- Tree/Berry/flower vẫn tuân thủ collider và overlap constraints.
- Level luôn trong `[minLevel, maxLevel]`.
- Encounter chỉ xuất hiện trên tall grass khi rule yêu cầu.

### Statistical tests

Chạy trên một tập cố định, ví dụ 100 seed × 256 chunk:

- Density trung bình của tree nằm trong khoảng cấu hình.
- `dense_forest` có nhiều cây hơn `dryland`.
- Wetland có tỷ lệ blue/white flower cao hơn red/purple.
- Rare Berry thấp hơn common Berry theo weight.
- Wild Pokémon có phân bố khác nhau giữa các context.

Dùng tolerance, không snapshot từng vị trí cụ thể trừ deterministic regression.

### Parity Python/TypeScript

Nếu Python generator tiếp tục tồn tại:

- Chia sẻ seed salts, frequency, ngưỡng zone và công thức nội suy qua data/config chuẩn.
- Thêm parity test cho `EcologySample` tại một bộ tọa độ cố định.
- Không để Python và TypeScript tự định nghĩa hai bộ threshold khác nhau.

## 12. Trình tự triển khai

1. Tạo ecology noise/profile, chưa đổi output object.
2. Thêm debug overlay để quan sát noise/profile.
3. Chuyển tree generation sang density/type.
4. Chuyển flower clustering.
5. Chuẩn hóa Berry metadata và rarity/habitat.
6. Chuyển tall grass density.
7. Chuyển encounter context và level range.
8. Cập nhật Python parity nếu còn duy trì generator song song.
9. Chạy typecheck, unit test, statistical test, schema validation và production build.

Không gộp tất cả vào một commit. Mỗi bước phải có test và khả năng rollback.

## 13. Tiêu chí nghiệm thu

Feature chỉ hoàn tất khi:

- Không còn roster/type/rarity sinh thái hardcode ngoài config được phê duyệt.
- Cùng seed tái tạo cùng kết quả ở frontend và Python parity sample.
- Không có overlap regression ở tree/Berry/flower.
- Debug overlay hiển thị được vùng và thống kê chunk.
- Statistical tests chứng minh sự khác biệt giữa ít nhất ba loại vùng.
- Typecheck, web tests, schema validation, Python tests và production build đều đạt.
- Tài liệu này chỉ đổi từ **Kế hoạch** sang **Đã triển khai** sau khi các tiêu chí trên đạt.

