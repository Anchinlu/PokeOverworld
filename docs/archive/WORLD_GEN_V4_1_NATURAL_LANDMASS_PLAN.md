# World Gen v4.1 — Kế hoạch nâng cấp hình học lục địa tự nhiên

## 1. Mục tiêu

Nâng cấp hình dạng thế giới hiện tại để tạo ra một lục địa tự nhiên hơn:

- Không còn hình tròn hoặc oval quá rõ.
- Không có cạnh vuông do chunk hoặc macro grid.
- Có bờ biển lồi/lõm tự nhiên.
- Có vịnh, bán đảo, eo đất và đảo phụ.
- Các chunk liền kề khớp terrain tuyệt đối.
- Cùng seed vẫn cho cùng một thế giới.

Phạm vi của kế hoạch này chỉ là **địa hình và hình học lục địa**.

Không triển khai trong v4.1:

- Marker, icon hoặc POI trên World Map.
- Đường liên kết giữa các làng.
- Hệ thống nhiệm vụ/NPC.
- Hydrology mô phỏng đầy đủ từ núi về biển.
- Thay đổi logic gameplay của Ocean, River, Lake.

## 2. Quy tắc version và save

### 2.1. Quyết định cho môi trường test hiện tại

Môi trường hiện tại chỉ dùng để test và chưa cần bảo toàn save cũ. Vì vậy profile
`natural-landmass` được đăng ký là World Gen **v5** và trở thành mặc định cho
world mới.

```text
worldGenVersion = 5
```

Tên kỹ thuật `v4.1-natural-landmass` vẫn được giữ trong tài liệu để mô tả
phạm vi nâng cấp, nhưng runtime hiện dùng `worldGenVersion = 5`.

## 3. Hiện trạng cần xử lý

### 3.1. Connected component chưa kiểm soát hoàn toàn terrain cuối

`V4MacroPlan` đã quét và chọn home continent, nhưng `v4-plan.ts` vẫn tạo
`landGrid` từ continuous continental field. Vì vậy component được chọn chưa
hoàn toàn là mask duy nhất quyết định landmass cuối cùng.

### 3.2. Bờ biển bị làm mượt quá mức

Morphology `open/close` đang loại bỏ răng cưa tốt, nhưng có thể làm mất các
vịnh nhỏ, eo đất và bán đảo.

### 3.3. Macro field có xu hướng tạo khối tròn

Một lớp noise ngưỡng duy nhất thường tạo landmass dạng blob. Cần thêm điều
chỉnh bất đối xứng và domain warp nhiều tầng, không dùng hình tròn thủ công.

### 3.4. Sông/hồ chưa phải tiêu chí định hình lục địa

River và Lake hiện được clip vào đất liền. Trong v4.1 chúng không được phép làm
thay đổi landmass chính; chỉ cần giữ biên hợp lệ và không tràn lên Ocean.

## 4. Lộ trình triển khai

## Bước 0 — Đóng băng baseline

### Việc cần làm

- Ghi lại output hiện tại của v4 với các seed đại diện: `101`, `4242`,
  `20261020` và ít nhất 20 seed ngẫu nhiên cố định.
- Xuất ảnh macro map, không cần render chi tiết sprite/object.
- Lưu thống kê:
  - diện tích đất;
  - diện tích biển;
  - diện tích component chính;
  - số component phụ;
  - bounding box;
  - số lần chuyển land/water trên biên.
- Tạo golden hash hoặc snapshot cho v4 cũ.

### Tiêu chí nghiệm thu

- Có baseline để so sánh trước/sau.
- Save cũ vẫn tạo đúng World Gen version cũ.
- Không chỉnh trực tiếp thuật toán v3 hoặc các save legacy.

## Bước 1 — Tách rõ macro landmask và terrain detail

### Việc cần làm

- Xác định `selectedComponent` trong `V4MacroPlan` là nguồn quyết định
  landmass chính.
- Tách hai khái niệm:
  - `macroLandMask`: đất/biển ở quy mô lục địa;
  - `detailTerrain`: đồi, biome, bãi cát và biến dạng cục bộ.
- Không để detail noise tự ý tạo thêm lục địa lớn ngoài macro component.
- Cho phép các component nhỏ được phân loại riêng thành island.

### Tiêu chí nghiệm thu

- Landmass chính liên thông.
- Không xuất hiện mảng đất lớn ngoài component đã chọn.
- Island vẫn có thể xuất hiện nếu nằm trong danh sách component phụ hợp lệ.
- Kết quả không phụ thuộc thứ tự load chunk.

## Bước 2 — Tạo coastline bất đối xứng

### Việc cần làm

- Giữ continuous world-space sampling, không dùng tọa độ chunk để quyết định
  bờ biển.
- Dùng domain warp theo ít nhất hai hướng với biên độ vừa phải.
- Thêm coastal edge noise tần số trung bình để tạo:
  - vịnh;
  - bán đảo;
  - eo đất;
  - bờ biển không đều.
- Không dùng công thức khoảng cách đến `(0, 0)` để tạo bờ biển.

### Tiêu chí nghiệm thu

- Không có cạnh dọc/ngang dài bất thường do grid.
- Không có hình tròn hoàn chỉnh quanh điểm spawn.
- Không tạo răng cưa một tile quá dày.
- Bờ biển liên tục khi đi qua ranh giới chunk.

## Bước 3 — Giảm làm mượt hình thái

### Việc cần làm

- Đánh giá riêng `open` và `close` trong `v4-plan.ts`.
- Giảm bán kính morphology nếu nó xóa mất vịnh hoặc eo đất.
- Chỉ loại bỏ răng cưa nhỏ và lỗ đơn lẻ; không làm tròn toàn bộ coastline.
- Không dùng morphology sau khi đã rasterize từng chunk độc lập.

### Tiêu chí nghiệm thu

- Bờ biển có vùng lõm/lồi rõ ràng.
- Không tạo hồ giả do lỗ nhỏ trong landmask.
- Không có đường cắt tại biên chunk.
- Biên vẫn ổn định khi load chunk theo thứ tự khác nhau.

## Bước 4 — Kiểm soát đảo và biển

### Việc cần làm

- Phân loại component theo diện tích:
  - component lớn: lục địa chính;
  - component vừa: đảo lớn;
  - component nhỏ: đảo phụ hoặc bỏ qua.
- Giữ giới hạn số đảo trong vùng quan sát.
- Không biến mọi mảng đất noise nhỏ thành đảo gameplay.
- Đảm bảo Ocean dùng đúng Ocean tile; River/Lake không được thay thế Ocean.

### Tiêu chí nghiệm thu

- Có thể xuất hiện một số đảo lớn/nhỏ.
- Không có hàng chục mảng đất vụn giống texture noise.
- Đảo không dính giả vào bờ do sai margin hoặc sai connected component.

## Bước 5 — Tách biome khỏi hình học coastline

### Việc cần làm

- Biome chỉ phân vùng trên land đã được xác định.
- Desert, Dark Land, Autumn và Meadow không được tự tạo landmass mới.
- Biome không được tạo dải vuông theo chunk.
- Ranh giới biome dùng noise tần số thấp và edge warp riêng.

### Tiêu chí nghiệm thu

- Biome nằm trong lục địa.
- Biome có vùng lớn liền nhau, không bị chia vụn thành texture noise.
- Desert không tự tạo biển/sông.
- Dark Land không phủ toàn bộ lục địa bằng một mảng tím.

## Bước 6 — QA nhiều seed và kiểm tra trực quan

### Việc cần làm

- Tạo macro renderer cho tối thiểu 100 seed.
- Xuất ảnh ở các kích thước `1024`, `1536` và `2048`.
- Kiểm tra riêng:
  - coastline;
  - đảo;
  - ranh giới chunk;
  - biome lớn;
  - Ocean/River/Lake;
  - vùng starter.
- Chọn một nhóm seed xấu để sửa bằng tham số, không hardcode từng seed.

### Tiêu chí nghiệm thu

- Ít nhất 90% seed có hình dạng lục địa tự nhiên.
- Không seed nào có cạnh vuông rõ ràng trên macro map.
- Không seed nào tạo landmass chính dạng hình tròn hoàn chỉnh.
- Không có lỗi terrain tại biên chunk.
- Cùng seed cho cùng output sau khi reload.

## Bước 7 — Tích hợp runtime và save

### Việc cần làm

- Tích hợp profile `v4.1-natural-landmass` vào world factory.
- Giữ nguyên loader cho V1–V4 cũ.
- Kiểm tra save/load không đổi seed, version và profile.
- Cập nhật World Map/Minimap chỉ đọc terrain đã load, không tự sinh terrain mới.
- Cập nhật `PROGRESS.md` sau khi QA hoàn tất.

### Tiêu chí nghiệm thu

- Save cũ không bị đổi địa hình.
- World mới dùng đúng profile mới.
- Minimap và overworld hiển thị cùng một landmask.
- Không tăng đáng kể thời gian tạo chunk hoặc FPS drop.

## 5. Guardrails cho dev

Không được:

- sửa `isWater()` để giải quyết lỗi hình ảnh Ocean;
- dùng `Math.random()` trong world generation;
- thêm điều kiện riêng cho từng seed;
- tạo coastline bằng hình tròn quanh spawn;
- quyết định land/water dựa trên `cx`, `cy` đơn lẻ;
- để biome hoặc object tự thay đổi landmask;
- sửa thuật toán v3/v2 khi đang làm v4.1;
- xóa migration/save support của các version cũ.

Mọi thay đổi hình học phải nằm ở một trong các tầng:

```text
v4-macro-plan.ts  → chọn component/lục địa/đảo
v4-config.ts      → tham số quy mô và noise
v4-plan.ts        → rasterize land/coast/biome theo world-space
v4-water.ts       → river/lake nằm trên land hợp lệ
```

## 6. Kết luận triển khai

World mới hiện dùng World Gen v5/profile `natural-landmass`. Tiếp tục Bước 3–6
để tinh chỉnh coastline và QA nhiều seed trước khi bổ sung hydrology nâng cao.

