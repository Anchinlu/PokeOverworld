# World Gen v4 – Macro Continent & Archipelago

## Trạng thái

Đã triển khai C0–C5 nền tảng:

- World Gen v3 vẫn được giữ nguyên cho các save cũ.
- Thế giới mới mặc định dùng `worldGenVersion = 4`.
- Địa hình v4 không dùng valley radial quanh `(0, 0)` để tạo toàn bộ lục địa.
- Continental field nhiều tầng gồm macro noise, domain warp và detail noise.
- Macro plan quét các mảng đất liên thông theo seed.
- Lục địa quê hương được chọn theo diện tích và được căn vào vùng lõi khởi đầu.
- Vùng lõi quanh làng chỉ là bảo vệ cục bộ, không phải mặt nạ hình tròn toàn thế giới.
- Bờ biển, đồi, Desert và Dark Land được sinh từ trường địa hình cục bộ.
- `ContinentPlan` và `ContinentService` cung cấp một nguồn dữ liệu macro dùng chung.
- Kế hoạch được cache theo `worldGenVersion + seed`, truy vấn runtime O(1) ở mức macro.
- Home continent được chia thành tối đa 6 region bằng farthest-point sampling.
- Mỗi region có biome chủ đạo, biome phụ, pack nhận diện và bounds macro.
- `ContinentQuery.regionAt()` và `biomeAt()` đã sẵn sàng cho world map/wildlife.
- Mỗi region có hub, làng và ấp theo seed.
- Settlement network chỉ đăng ký vị trí settlement; chưa tạo road liên settlement.
- `ContinentQuery.settlementNear()` và `getRoads()` đã sẵn sàng cho world map.
- `roadMask` hiện được giữ làm contract cho route thế giới tương lai và đang rỗng.
- Settlement C5 được chuyển thành `VillagePlacement` V4, nên building, path,
  collider và garden dùng chung pipeline overworld hiện có.
- `WorldChunk` đã lấy trực tiếp đường/làng C5; V1–V3 vẫn dùng pipeline cũ.

## Mô-đun

```text
apps/web/src/maps/terrain-field/
  v4-config.ts       Tham số và continental field
  v4-macro-plan.ts   Quét component, chọn home continent, source offset
  v4-plan.ts         Sinh chunk terrain từ macro + detail field
  v4-field.ts        TerrainField adapter cho runtime hiện tại
```

## Tương thích save

| Phiên bản | Hành vi |
|---|---|
| V1 | Giữ nguyên thế giới cổ điển |
| V2 | Giữ nguyên V0 |
| V3 | Giữ nguyên valley và corridor cũ |
| V4 | Thế giới mới: lục địa, biển, đảo và bờ tự nhiên |

Không được đổi thuật toán v3 khi sửa v4. Save cũ phải tiếp tục đọc đúng
`worldGenVersion` đã lưu.

## Giới hạn phạm vi hiện tại

C5 mới nối settlement và đường nội bộ vào chunk/overworld; chưa có POI C6,
ExploredMap hoặc adapter riêng cho world-map discovery. Road liên settlement,
cầu qua nước và đường nhánh sẽ chỉ triển khai sau khi có quy tắc route thế giới
riêng, có kiểm tra địa hình và không đi xuyên HILL.

## Kiểm thử đã có

`apps/web/test/world-v4/v4-field.test.ts` kiểm tra:

- factory tạo đúng V4Field;
- lõi khởi đầu không có biển/cát/đồi;
- cùng seed cho cùng macro plan và terrain;
- nhiều seed đều có cả đất và nước;
- truy vấn ở biên chunk không gây lỗi.

## Bước tiếp theo

1. Thêm macro renderer để xem landmass, biển và đảo trên ảnh.
2. Đo 100 seed: tỉ lệ đất, diện tích home continent, component biển/đảo.
3. Chốt ngưỡng `SEA_LEVEL`, `MACRO_SCALE`, `WARP_AMPLITUDE`.
4. Chốt tham số region qua macro renderer.
5. Đo visual QA trong overworld ở các biên chunk và chỉnh độ rộng/độ mềm đường.
6. Triển khai C6 POI và điểm khám phá.
