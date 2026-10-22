# Climate-Based World Generation Architecture

## Mục tiêu

Xây dựng một lớp khí hậu địa lý cố định theo `seed`, dùng làm nền tảng quyết định biome, sinh thái, Pokémon hoang dã và tài nguyên môi trường.

Mục tiêu quan trọng nhất là loại bỏ các biên biome vô lý, ví dụ Desert nằm sát Snow mà không có vùng chuyển tiếp. Khí hậu phải ổn định trong suốt vòng đời world; thời tiết và ngày/đêm chỉ là các trạng thái tạm thời, không được thay đổi biome nền.

## Nguyên tắc kiến trúc

```text
Seed
 └─ Macro Landmass
     └─ Climate Field cố định
         ├─ Temperature
         ├─ Moisture
         ├─ Humidity
         ├─ Elevation
         └─ Climate Region
             └─ Biome Resolver
                 ├─ Desert
                 ├─ Snow
                 ├─ Autumn
                 ├─ Dark Land
                 ├─ Meadow
                 ├─ Wetland
                 └─ Transition Biomes
```

Mỗi tầng chỉ chịu trách nhiệm cho một loại quyết định:

- `Landmass`: lục địa, biển, đảo và kết nối địa lý.
- `Climate`: nhiệt độ nền, độ ẩm và vùng khí hậu.
- `Biome`: loại môi trường hiển thị và sinh thái.
- `Terrain`: tile, đồi, sông, hồ và va chạm.
- `Ecology`: cây, cỏ, hoa và Pokémon.
- `Weather`: mưa, tuyết, bão và hiệu ứng tạm thời.

Không cho phép tầng Weather tự thay đổi Climate hoặc Biome.

## Climate cố định và Weather tạm thời

### Climate

Climate được tính từ `seed` và tọa độ thế giới. Cùng một seed luôn trả về cùng một climate sample.

Climate không thay đổi theo:

- Ngày/đêm.
- Mưa hoặc nắng.
- Thời gian người chơi đứng trong khu vực.
- Việc chunk được unload rồi load lại.

### Weather

Weather là trạng thái runtime có thể thay đổi theo thời gian:

- Có thể làm tuyết rơi trong Snow biome.
- Có thể tạo mưa trong Meadow hoặc Forest.
- Có thể thay đổi hiệu ứng, ánh sáng và hành vi Pokémon.

Weather không được biến:

- Desert thành Snow.
- Meadow thành Desert.
- Vùng lạnh thành vùng nóng.

## Climate sample

```ts
interface ClimateSample {
  temperature: number; // 0..1, nhiệt độ nền cố định
  moisture: number; // 0..1, độ ẩm
  humidity: number; // 0..1, độ ẩm không khí
  elevation: number; // 0..1, độ cao tương đối
  climateBand: ClimateBand;
}

type ClimateBand =
  | 'arctic'
  | 'cold'
  | 'temperate'
  | 'warm'
  | 'hot';
```

Nhiệt độ nên được tạo từ hai thành phần:

```text
temperature = macroTemperature * 0.75 + detailTemperature * 0.25
```

Trong đó:

- `macroTemperature` tạo các vùng khí hậu lớn, liền mạch.
- `detailTemperature` chỉ làm mềm biên, không tạo đảo nhiệt nhỏ.
- Có thể bổ sung latitude/độ cao để vùng phía bắc hoặc vùng núi lạnh hơn.

## Dải nhiệt độ chuẩn

| Khoảng | Climate band | Đặc trưng |
|---:|---|---|
| `0.00–0.20` | `arctic` | Băng, tuyết dày, thực vật thưa |
| `0.20–0.38` | `cold` | Snow forest, tundra, rừng lạnh |
| `0.38–0.55` | `temperate` | Meadow, forest, autumn transition |
| `0.55–0.72` | `warm` | Đồng bằng ấm, rừng khô, scrubland |
| `0.72–1.00` | `hot` | Desert, savanna, đất khô |

Các ngưỡng này là cấu hình, không hard-code trong nhiều module.

## Quy tắc chọn biome

Biome chỉ được chọn từ danh sách hợp lệ của climate band hiện tại.

### Desert

Điều kiện đề xuất:

```text
temperature >= 0.68
moisture <= 0.35
```

Desert không được xuất hiện trong `cold` hoặc `arctic`.

### Snow

Điều kiện đề xuất:

```text
temperature <= 0.32
```

Snow có thể có nhiều độ ẩm khác nhau:

- Lạnh + ẩm: Snow forest hoặc vùng tuyết dày.
- Lạnh + khô: Tundra hoặc băng khô.

### Autumn

Autumn ưu tiên vùng `cold` chuyển sang `temperate`, hoặc vùng ôn đới có độ ẩm trung bình.

### Dark Land

Dark Land là biome đặc biệt về hình ảnh và lore. Nó có thể nằm trong vùng lạnh hoặc ôn đới, nhưng phải tôn trọng climate band nền. Dark Land không được tự ý tạo một đảo nhiệt đối lập với khu vực xung quanh.

### Meadow / Forest / Wetland

Đây là các biome nền, được quyết định bởi moisture, density và elevation sau khi climate band đã được xác định.

## Vùng chuyển tiếp

Không cho phép chuyển trực tiếp giữa hai climate đối lập:

```text
Desert → Snow
```

Phải chèn vùng đệm tối thiểu một đến ba macro cells:

```text
Desert
  → Dry Meadow / Scrubland
    → Temperate Meadow
      → Cold Meadow / Taiga
        → Snow
```

Giai đoạn đầu có thể tái sử dụng asset Meadow hoặc Dryland cho vùng đệm. Chưa cần tạo asset biome mới; chỉ cần thay đổi:

- Màu nền.
- Mật độ cỏ.
- Loại cây.
- Danh sách Pokémon.
- Tỷ lệ cát, đất khô và tuyết.

### Quy tắc khoảng cách khí hậu

Biome candidate chỉ hợp lệ nếu:

```text
abs(candidate.temperature - neighbor.temperature) <= MAX_CLIMATE_STEP
```

Nếu chênh lệch vượt ngưỡng, resolver phải chọn transition biome thay vì biome đích.

## Pipeline World Generation mới

### Bước 1: Macro landmass

Giữ nguyên hệ thống tạo lục địa, đại dương, đảo và vùng khởi đầu hiện tại.

### Bước 2: Climate field

Tạo climate ở cấp macro cell hoặc climate cell lớn hơn chunk. Climate cell nên có kích thước khoảng 32–64 tile để tránh texture noise.

Mỗi cell lưu:

- Temperature.
- Moisture.
- Humidity.
- Elevation influence.
- Climate band.

### Bước 3: Climate smoothing

Làm mượt các cell lân cận bằng một hoặc hai vòng majority/blur có trọng số. Không làm mượt xuyên qua đại dương nếu hai khu vực thuộc các landmass khác nhau.

### Bước 4: Biome resolver

Resolver nhận climate sample, địa hình và nước để chọn biome hợp lệ. Đây là nguồn sự thật duy nhất cho:

- Terrain renderer.
- Wildlife spawn.
- Tree/grass/flower generation.
- World map và minimap.

### Bước 5: Terrain detail

Sau khi biome đã ổn định mới sinh:

- Sông và hồ.
- Đồi cao.
- Bãi biển.
- Cây và thực vật.
- Đường và làng.

Chi tiết không được thay đổi climate region.

## Cấu trúc module đề xuất

```text
apps/web/src/maps/climate/
├── climate-types.ts
├── climate-config.ts
├── climate-field.ts
├── climate-resolver.ts
├── climate-transition.ts
└── index.ts
```

`V4TerrainPlan`/World Gen v6 nên lưu các mảng climate đã tính:

```ts
temperature: Uint8Array;
moisture: Uint8Array;
climateBand: Uint8Array;
```

Không nên để mỗi hệ thống tự gọi noise riêng với salt riêng để đoán biome. Điều đó sẽ tạo lại tình trạng lệch giữa renderer, wildlife và ecology.

## Hợp nhất các hệ thống đang tồn tại

Hiện có hai nguồn climate chưa hoàn toàn hợp nhất:

1. `v4-plan.ts` dùng các noise riêng cho Desert, Dark Land, Autumn và Snow.
2. `continent/plan/regions.ts` đã có `heat`, `moisture`, `density` để phân loại region.

Sau khi triển khai Climate Field, `regions.ts` phải đọc climate từ cùng một service hoặc dùng chung hàm `sampleClimate`. Không được giữ hai bộ công thức độc lập.

`ecology-field.ts` cũng nên mở rộng `EcologySample` để nhận climate sample thay vì tự coi moisture/fertility là toàn bộ climate.

## Tương thích phiên bản

Không thay đổi World Gen v5 đang dùng cho save/test hiện tại. Tạo phiên bản mới:

```text
World Gen v6 = Climate-based generation
```

Quy tắc:

- Save v5 tiếp tục load bằng generator v5.
- World mới sử dụng v6.
- Seed cũ chạy trên v6 được xem là một thế giới mới.
- Không cố gắng giữ nguyên tọa độ biome cũ khi chuyển generator.

## Debug và kiểm thử bắt buộc

Thêm debug overlay hiển thị:

- Temperature.
- Moisture.
- Climate band.
- Biome candidate.
- Biome final.
- Transition distance.

Các test cần có:

1. Cùng seed và tọa độ trả về cùng climate.
2. Climate không thay đổi sau unload/load chunk.
3. Desert không được resolve trong climate `cold` hoặc `arctic`.
4. Snow không được resolve trong climate `warm` hoặc `hot`.
5. Không có cặp Desert–Snow kề nhau nếu chưa đi qua transition band.
6. River/lake không làm mất climate của vùng đất xung quanh.
7. Renderer, wildlife và ecology trả về cùng biome tại cùng tọa độ.
8. World Gen v5 vẫn giữ nguyên hành vi cho save cũ.

## Lộ trình triển khai

### Phase 1: Climate model

- Tạo types/config/service.
- Tạo temperature và moisture field deterministic.
- Viết test ổn định theo seed.
- Chưa thay asset hoặc terrain hiện tại.

### Phase 2: Climate debug overlay

- Hiển thị bản đồ nhiệt độ và climate band.
- Kiểm tra nhiều seed.
- Điều chỉnh scale, threshold và độ rộng vùng chuyển tiếp.

### Phase 3: Biome resolver

- Chuyển Desert/Snow/Autumn/Dark Land sang climate eligibility.
- Thêm transition resolver.
- Loại bỏ việc chọn biome bằng các noise độc lập.

### Phase 4: Ecology integration

- Đồng bộ cây, cỏ, vật trang trí và Pokémon với climate + biome.
- Đồng bộ world map/minimap.
- Bổ sung climate influence cho hành vi Pokémon.

### Phase 5: World Gen v6

- Tạo generator version 6.
- Giữ nguyên generator v5 cho save cũ.
- Xuất map nhiều seed để visual QA.

## Tiêu chí hoàn thành

Hệ thống được xem là đạt khi:

- Nhiệt độ nền ổn định theo seed.
- Desert không thể sinh sát Snow nếu không có transition band.
- Biome không bị biến đổi bởi weather hoặc ngày/đêm.
- Renderer, wildlife và ecology dùng cùng một biome resolver.
- Các vùng climate tạo thành basin lớn, không bị chia vụn thành noise texture.
- World v5 cũ vẫn load được.

## Trạng thái triển khai

### Đã hoàn thành

- Phase 1: tạo `Climate Field` deterministic với temperature, moisture, humidity, elevation và climate band.
- Bổ sung kiểm thử tính ổn định theo seed, khoảng giá trị và luật tương thích biome.
- Phase 2 bước đầu: thêm debug overlay `Climate: Nhiệt độ nền` trong Debug Panel.
- Overlay hiển thị gradient nhiệt độ từ lạnh đến nóng mà chưa thay đổi terrain/biome runtime.

### Chưa thay đổi

- World Gen v5 vẫn là pipeline sản xuất hiện tại.
- Các biome hiện tại chưa bị thay thế bằng Climate Resolver.
- Chưa bật transition biome trong bản đồ thực tế.
- Chưa thay đổi save format hoặc world generation version.
