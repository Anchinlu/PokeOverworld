# Quy tắc phân giải tile Ocean và nước nội địa

## Mục tiêu

Ocean, River và Lake đều là ô nước về mặt gameplay, nhưng **không dùng chung bộ
asset hiển thị**. `isWater()` chỉ trả lời câu hỏi "ô này có phải nước để xử lý
collision/query hay không"; hàm này không được dùng để quyết định tile graphic
trước khi kiểm tra Ocean.

## Phân loại nguồn dữ liệu

| Loại ô | Cờ nguồn | Vai trò | Tile graphic hợp lệ |
|---|---|---|---|
| Ocean | `field.isOcean(gx, gy, hasBeach)` | Biển ngoài khơi và bờ biển | `ocean_water` `730`, bờ biển `731–735` và các tile shoreline được khai báo |
| River/Lake | `field.isWater(...) === true` nhưng `isOcean === false` | Sông, hồ nước nội địa | Bộ nước chung `700–712` |
| River/Lake trong Autumn | `isOcean === false` và biome Autumn | Nước nội địa theo palette mùa thu | Bộ `water_autumn_*`, `750–763` |
| Beach/Sand | `field.isSand(...) === true` | Bờ cát, không phải nước | Bộ sand/beach |

`V4Field.isWater()` hiện có thể trả `true` cho Ocean, River hoặc Lake. Đây là
thiết kế đúng cho logic đi lại và va chạm, nhưng là lý do bắt buộc phải ưu tiên
`isOcean()` khi chọn tile.

## Thứ tự phân giải bắt buộc

Trong `generateChunkTerrain()` của
`apps/web/src/maps/chunk-terrain.ts`, thứ tự tối thiểu phải giữ như sau:

```ts
if (isRoad && !isOcean && !isSand && !isHill && !isWater) {
  // đường hợp lệ trên đất liền
} else if (isHill) {
  // cliff/hill theo biome
} else if (isDesert) {
  // desert ground/cliff
} else if (isDarkLand) {
  // dark land ground/cliff
} else if (isBridge) {
  // bridge
} else if (field.isOcean(gx, gy, hasBeach)) {
  // bắt buộc dùng field.getOceanTileId(...)
} else if (field.isWater(...)) {
  // chỉ còn River/Lake: dùng getWaterTileKey(...)
} else if (isAutumn) {
  // autumn ground
} else if (isSand) {
  // beach sand
} else if (isRoad) {
  // đường làng/đường đồ thị còn lại
}
```

Không được đưa nhánh `field.isWater()` lên trước nhánh Ocean. Làm vậy sẽ khiến
Ocean bị lấy nhầm bộ tile River/Lake vì Ocean cũng thỏa `isWater()`.

## Quy tắc gameplay không thay đổi

- `isWater()` vẫn được dùng cho collision, spawn context nước, kiểm tra đường
  không bắc qua nước và các truy vấn `isNearWater()`.
- Không đổi `isWater()` thành chỉ River/Lake để sửa lỗi graphic; việc đó sẽ làm
  hỏng các hệ thống gameplay đang cần coi Ocean là nước.
- Không đổi `TERRAIN.OCEAN_WATER` chỉ vì River/Lake cũng đang dùng terrain ID
  này. Phân biệt asset phải thực hiện ở `tileId` thông qua `isOcean()`.
- Không cho road, hill, desert, dark land hoặc vegetation ghi đè lên ô Ocean.

## Kiểm tra bắt buộc sau khi chỉnh sửa

Chạy:

```powershell
npm --workspace @pokemon/web run test -- test/ocean-beach.test.ts test/water-terrain.test.ts test/world-v4/v4-field.test.ts
npm run typecheck:web
```

Kỳ vọng:

- Ocean sâu trả `730`.
- Ocean giáp bờ trả một tile shoreline hợp lệ, không lấy `700–712` hoặc
  `750–763`.
- River/Lake vẫn giữ bộ `700–712`.
- Nước nội địa trong Autumn vẫn giữ `750–763`.
- Không sửa ngược hàm `isWater()` chỉ để làm test graphic pass.

