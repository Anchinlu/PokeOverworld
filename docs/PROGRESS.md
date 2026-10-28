# PokeOverworld - Tài Liệu Tiến Độ Phát Triển Dự Án (Project Progress)

> **Phiên bản hiện tại**: `0.1.0` (Milestone 2.81 Complete - Strict Item-Received Only Toast & Zero Icons Policy)
> **Ngày cập nhật**: `2026-10-26`
> **Tình trạng kiểm thử**: **100% PASS** (TypeScript 0 errors, 853/853 assets valid, 175 species valid, Vitest 27/27 tests pass).
> **Lưu trữ lịch sử**: Mô tả chi tiết từng milestone (đến 2.81) lưu tại [archive/PROGRESS_v2.81_FULL_HISTORY.md](file:///e:/Pokemon/docs/archive/PROGRESS_v2.81_FULL_HISTORY.md); 92 milestone đầu tiên tại [archive/PROGRESS_v1.92_FULL_HISTORY.md](file:///e:/Pokemon/docs/archive/PROGRESS_v1.92_FULL_HISTORY.md).

---

## 1. Tổng Quan Kiến Trúc & Các Hệ Thống Cốt Lõi

> Bảng rút gọn: chỉ giữ tên hệ thống/milestone và trạng thái. Chi tiết kỹ thuật xem bản lưu trữ.

| Hệ thống / Milestone | Trạng thái |
| :--- | :---: |
| **Hệ Thống Toast Thuần Text: Chỉ Áp Dụng Khi Nhận Vật Phẩm, Cấm Tuyệt Đối Mọi Icon Ngoại Lai (Milestone 2.81)** | **Hoàn thiện 100%** (Milestone 2.81 Complete) |
| **Loại Bỏ Triệt Để Unicode Emojis, Chuẩn Hóa Bảng Nhiệm Vụ Thuần Pixel Retro & Mở Khóa Nhiệm Vụ "Ra Ngoài Nói Chuyện Với Mẹ" (Milestone 2.80)** | **Hoàn thiện 100%** (Milestone 2.80 Complete) |
| **Phân Loại Nhiệm Vụ Sự Kiện & Thu Thập, Nhân Vật Tự Đi Đến Vùng Sự Kiện, Bỏ Vòng Vàng & Mũi Tên Chỉ Dẫn (Milestone 2.79)** | **Hoàn thiện 100%** (Milestone 2.79 Complete) |
| **Bảng Nhiệm Vụ Phía Bên Trái & Hệ Thống Dẫn Đường Waypoint GPS Thông Minh (Milestone 2.78)** | **Hoàn thiện 100%** (Milestone 2.78 Complete) |
| **Chuẩn Hóa Hộp Thoại Cutscene Giật Điện Cảnh 7 Thành Phong Cách Pixel Retro GBA (Milestone 2.77)** | **Hoàn thiện 100%** (Milestone 2.77 Complete) |
| **Đưa Thông Báo Nhận Vật Phẩm Lên Mép Trên Giữa Màn Hình & Chuẩn Hóa Hộp Thoại Pixel Retro (Milestone 2.76)** | **Hoàn thiện 100%** (Milestone 2.76 Complete) |
| **Đưa Thông Báo Nhận Vật Phẩm Lên Mép Trên Giữa Màn Hình & Chuẩn Hóa Hộp Thoại Pixel Retro (Milestone 2.76)** | **Hoàn thiện 100%** (Milestone 2.76 Complete) |
| **Giật Điện 100% Trực Tiếp Trên Overworld, Loại Bỏ Hoàn Toàn Hình Ảnh Tự Thêm (Milestone 2.75)** | **Hoàn thiện 100%** (Milestone 2.75 Complete) |
| **Giật Điện 100% Trực Tiếp Trên Overworld, Loại Bỏ Hoàn Toàn Hình Ảnh Tự Thêm (Milestone 2.75)** | **Hoàn thiện 100%** (Milestone 2.75 Complete) |
| **Sửa Lỗi Dân Làng Tàng Hình, Xóa Vật Thể Ghế Đá & Chậu Cây Trước Lab, Tích Hợp 2 Ảnh Mẹ Satoshi Chuẩn Anime 100% (Milestone 2.74)** | **Hoàn thiện 100%** (Milestone 2.74 Complete) |
| **Sửa Lỗi Dân Làng Tàng Hình, Xóa Vật Thể Ghế Đá & Chậu Cây Trước Lab, Tích Hợp 2 Ảnh Mẹ Satoshi Chuẩn Anime 100% (Milestone 2.74)** | **Hoàn thiện 100%** (Milestone 2.74 Complete) |
| **Cảnh 8: Đám Đông & Mẹ Delia Tiễn Lên Đường, Pikachu Đánh Trả Bóng, Màn Giật Điện Toàn Diện & Khoác Trang Phục HLV (Milestone 2.73)** | **Hoàn thiện 100%** (Milestone 2.73 Complete) |
| **Cảnh 8: Đám Đông & Mẹ Delia Tiễn Lên Đường, Pikachu Đánh Trả Bóng, Màn Giật Điện Toàn Diện & Khoác Trang Phục HLV (Milestone 2.73)** | **Hoàn thiện 100%** (Milestone 2.73 Complete) |
| **Ẩn Hoàn Toàn Menu Cứng Cố Định & Sửa Triệt Để Lỗi Lệch Tọa Độ Khi Hover Menu Bánh Xe Tròn (Milestone 2.72)** | **Hoàn thiện 100%** (Milestone 2.72 Complete) |
| **Tích Hợp Hình Ảnh Anime Satoshi & Giáo Sư Okido Cùng Bị Pikachu Giật Điện Trong Cảnh 7 (Milestone 2.71)** | **Hoàn thiện 100%** (Milestone 2.71 Complete) |
| **Cảnh 7: Trao Tặng Pokémon Zukan & Pokéball, Màn Giật Điện Cả Hai & Menu Bánh Xe Tròn (Radial Pie Wheel Menu) (Milestone 2.70)** | **Hoàn thiện 100%** (Milestone 2.70 Complete) |
| **Kiến Trúc Hệ Thống Cốt Truyện Toàn Diện (`apps/web/src/story/`) & Tương Thích Ngược Tuyệt Đối (Milestone 2.69)** | **Hoàn thiện 100%** (Milestone 2.69 Complete) |
| **Đưa Chân Dung Satoshi Áo Ngủ Sang Phải Màn Hình Hướng Vào Trung Tâm (Milestone 2.68)** | **Hoàn thiện 100%** (Milestone 2.68 Complete) |
| **Ghi Đè Đúng Tệp Chân Dung Satoshi Áo Ngủ Đưa Hai Tay Đón Pikachu (Milestone 2.67)** | **Hoàn thiện 100%** (Milestone 2.67 Complete) |
| **Âm Thanh Tiếng Kêu Pikachu Mới (`pikachu.mp3`), Chuyển Cảnh Mượt Mà & Triệt Tiêu Lỗi Kêu 3 Lần (Milestone 2.66)** | **Hoàn thiện 100%** (Milestone 2.66 Complete) |
| **Chân Dung Anime Satoshi Đưa Tay Đón Pikachu Cho Thoại "Dễ thương quá, nó là tuyệt nhất" (Milestone 2.65)** | **Hoàn thiện 100%** (Milestone 2.65 Complete) |
| **Tích Hợp Toàn Diện Spritesheet Bong Bóng Cảm Xúc GBA/NDS Chính Thống (Milestone 2.64)** | **Hoàn thiện 100%** (Milestone 2.64 Complete) |
| **Khắc Phục Lỗi Xuất Hiện 2 Pikachu & Loại Bỏ 100% Trợ Lý / Kỹ Sư Trong Sự Kiện (Milestone 2.63)** | **Hoàn thiện 100%** (Milestone 2.63 Complete) |
| **Tài Liệu Hướng Dẫn Kỹ Thuật Cốt Truyện & Tiến Trình Cốt Truyện Anime (Milestone 2.62)** | **Hoàn thiện 100%** (Milestone 2.62 Complete) |
| **Quay Lại Phòng Lab Overworld (Thế Giới Thật), Quả Cầu Thứ 4 Mở, Ẩn Trợ Lý & Màn Ôm Pikachu Giật Điện (Milestone 2.61)** | **Hoàn thiện 100%** (Milestone 2.61 Complete) |
| **Bệ Máy Chọn Starter Lab Pixel GBA, Chân Dung Dịch Trái & Màn Pikachu Giật Điện (Milestone 2.60)** | **Hoàn thiện 100%** (Milestone 2.60 Complete) |
| **Bệ Máy 3 Quả Cầu Khởi Đầu Tự Do Click Mở & Chân Dung Anime Satoshi - Okido (Milestone 2.59)** | **Hoàn thiện 100%** (Milestone 2.59 Complete) |
| **Giáo Sư Okido & Satoshi Vào Lab & Cảnh 5 Truyện Tranh 3 Quả Cầu Rỗng (Milestone 2.58)** | **Hoàn thiện 100%** (Milestone 2.58 Complete) |
| **Thiết Lập Thời Tiết Sáng Sớm Bình Minh & Bầu Trời Nắng Đẹp Trong Sự Kiện (Milestone 2.57)** | **Hoàn thiện 100%** (Milestone 2.57 Complete) |
| **Bà Con Giải Tán Sau Khi Đoàn Gary Rời Đi & Lời Thoại Đối Thoại Chuẩn Giữa Giáo Sư Okido Và Satoshi (Milestone 2.56)** | **Hoàn thiện 100%** (Milestone 2.56 Complete) |
| **Căn Chỉnh Lưới Player, 3 Cô Gái Cổ Vũ, Đám Đông Dân Làng Cổng Lab & Mở Rộng Dân Làng (Milestone 2.55)** | **Hoàn thiện 100%** (Milestone 2.55 Complete) |
| **Asset Ash Đồ Ngủ Chuẩn, Cảnh 1 Chạy Từ Xa & Lời Thoại Truyện Tranh Anime (Milestone 2.54)** | **Hoàn thiện 100%** (Milestone 2.54 Complete) |
| **Triển Khai Phân Cảnh 1 Đến 4 Sự Kiện Cổng Viện Okido (Milestone 2.53)** | **Hoàn thiện 100%** (Milestone 2.53 Complete) |
| **Animation Ash Đồ Ngủ & Kịch Bản Sự Kiện Cổng Viện Okido (Milestone 2.52)** | **Hoàn thiện 100%** (Milestone 2.52 Complete) |
| **Intro Mở Đầu Khi Tạo Thế Giới: Video Cinematic, Chuyển Cảnh Mượt & Bộ 6 Trang Truyện Tranh (Milestone 2.51)** | **Hoàn thiện 100%** (Milestone 2.51 Complete) |
| **Tích Hợp Bộ 21 Sprite NPC Cốt Truyện, Dịch Vụ & Huấn Luyện Viên Chuẩn GBA (Milestone 2.50)** | **Hoàn thiện 100%** (Milestone 2.50 Complete) |
| **Hệ Thống NPC Dân Làng Ngoài Trời Tại Làng Khởi Đầu & Hộp Thoại Retro (Milestone 2.49)** | **Hoàn thiện 100%** (Milestone 2.49 Complete) |
| **Thay Thế Sprite Mẹ Của Nhân Vật Chính Bằng Tài Nguyên Chuẩn (Milestone 2.48)** | **Hoàn thiện 100%** (Milestone 2.48 Complete) |
| **Dọn Rác Thư Mục Graphics/Characters & Tệp Tạm Dự Án (Milestone 2.47)** | **Hoàn thiện 100%** (Milestone 2.47 Complete) |
| **Nội Thất Nhà Player 1F & 2F Hoàn Toàn Bằng 23 Tài Nguyên Gốc Của Người Dùng (Milestone 2.46)** | **Hoàn thiện 100%** (Milestone 2.46 Complete) |
| **Thanh EXP Động Trong Trận Đấu, Bảng Chỉ Số Khi Lên Cấp & Bộ Âm Thanh Chuẩn (Milestone 2.45)** | **Hoàn thiện 100%** (Milestone 2.45 Complete) |
| **Cân Chỉnh Kích Thước Cây Apricorn Chuẩn Tỷ Lệ & Tăng Độ Hiếm Biome (Milestone 2.44)** | **Hoàn thiện 100%** (Milestone 2.44 Complete) |
| **Hệ Thống InteriorRegistry, Hoạt Họa NPC & Pokémon Đồng Hành Trong Nhà (Milestone 2.43)** | **Hoàn thiện 100%** (Milestone 2.43 Complete) |
| **Giao Diện Chuẩn Retro Pixel Art Cho Hộp Thoại & Modal Cửa (Milestone 2.42)** | **Hoàn thiện 100%** (Milestone 2.42 Complete) |
| **Khép Kín Toàn Diện Hitbox Chân Ngạch Cửa Công Trình (Milestone 2.41)** | **Hoàn thiện 100%** (Milestone 2.41 Complete) |
| **Tái Thiết Toàn Diện Bố Cục Phòng Lab Oak & Khắc Phục Triệt Để Layering (Milestone 2.40)** | **Hoàn thiện 100%** (Milestone 2.40 Complete) |
| **Không Gian Bên Trong Viện Nghiên Cứu Oak & Hộp Thoại Vào Cửa (Milestone 2.39)** | **Hoàn thiện 100%** (Milestone 2.39 Complete) |
| **Biome Đồng Bằng Apricorn & Côn Trùng Chủ Động Khiêu Chiến (Milestone 2.38)** | **Hoàn thiện 100%** (Milestone 2.38 Complete) |
| **Kiến Trúc Sinh Làng Khởi Đầu Thủ Tục & Quỹ Đất 60×60 Kiểu Minecraft (Milestone 2.37)** | **Hoàn thiện 100%** (Milestone 2.37 Complete) |
| **Thời Tiết Bão Tuyết, Nước Hồ/Sông Băng Hoạt Họa & Cẩm Nang Biome (Milestone 2.36)** | **Hoàn thiện 100%** (Milestone 2.36 Complete) |
| **Toàn Diện Tích Hợp Biome Vùng Băng Tuyết Vào Động Cơ Thế Giới (Milestone 2.35)** | **Hoàn thiện 100%** (Milestone 2.35 Complete) |
| **Biểu Tượng Đầu Nhân Vật Red Trên Mini-map & World Map (Milestone 2.34)** | **Hoàn thiện 100%** (Milestone 2.34 Complete) |
| **Cập Nhật Tài Nguyên Hồ & Sông Mùa Thu Chuẩn Nền Đất Biome (Milestone 2.33)** | **Hoàn thiện 100%** (Milestone 2.33 Complete) |
| **Tái Định Vị Mini-map Lên Góc Phải Trên & Chuẩn Hóa Đồ Họa 1-Pixel Art (Milestone 2.32)** | **Hoàn thiện 100%** (Milestone 2.32 Complete) |
| **Bản Đồ Thu Nhỏ Thời Gian Thực (Overworld Mini-map HUD - Milestone 2.31)** | **Hoàn thiện 100%** (Milestone 2.31 Complete) |
| **Chuẩn Hóa Đống Lá Rụng & Decal Mùa Thu Thành Trang Trí Nền Đất (Milestone 2.30)** | **Hoàn thiện 100%** (Milestone 2.30 Complete) |
| **Bổ Sung Sông & Hồ Nước Autotile Cho Biome Mùa Thu (Milestone 2.29)** | **Hoàn thiện 100%** (Milestone 2.29 Complete) |
| **Bổ Sung Cỏ Ranh Giới Autotile & Cỏ Cao Cho Biome Mùa Thu (Milestone 2.28)** | **Hoàn thiện 100%** (Milestone 2.28 Complete) |
| **Toàn Diện Tích Hợp Biome Rừng Mùa Thu Vào Động Cơ Thế Giới (Milestone 2.27)** | **Hoàn thiện 100%** (Milestone 2.27 Complete) |
| **Chuẩn Hóa 84 Tài Nguyên Biome Rừng Mùa Thu & Nền Đất Tâm Đồi Cao (Milestone 2.26)** | **Hoàn thiện 100%** (Milestone 2.26 Complete) |
| **Bão Cát & Hạt Cát Bay Tự Nhiên Cho Sa Mạc (Milestone 2.25)** | **Hoàn thiện 100%** (Milestone 2.25 Complete) |
| **Sương Mù Tím Đen & Khí Quyển Khám Phá Vùng Đất Tối (Milestone 2.24)** | **Hoàn thiện 100%** (Milestone 2.24 Complete) |
| **Tối Ưu & Tăng Tần Suất Hoạt Ảnh Idle Cho Nhân Vật Chính (Milestone 2.23)** | **Hoàn thiện 100%** (Milestone 2.23 Complete) |
| **Hệ Thống Thời Tiết Mưa Rơi Tự Nhiên & Bọt Nước Mặt Đất (Milestone 2.22)** | **Hoàn thiện 100%** (Milestone 2.22 Complete) |
| **Hiệu Ứng Lá Rơi Theo Gió & Chuyển Sắc Theo Thời Gian (Milestone 2.21)** | **Hoàn thiện 100%** (Milestone 2.21 Complete) |
| **Bóng Mây Mặt Đất & Tinh Chỉnh Ánh Sáng Ban Đêm & Hoàng Hôn (Milestone 2.20)** | **Hoàn thiện 100%** (Milestone 2.20 Complete) |
| **Bộ Hồ & Sông Mới 4-Frame Thay Thế Tài Nguyên Cũ (Milestone 2.19)** | **Hoàn thiện 100%** (Milestone 2.19 Complete) |
| **Cỏ Vùng Tối & Khôi Phục Thảm Cỏ Cao Vùng Đất Tối (Milestone 2.18)** | **Hoàn thiện 100%** (Milestone 2.18 Complete) |
| **Chuẩn Hóa Ranh Giới Đa Biome & Khôi Phục Autotile Tự Nhiên (Milestone 2.17)** | **Hoàn thiện 100%** (Milestone 2.17 Complete) |
| **Tích Hợp Biome Sông Hồ Nước Ngọt & Mở Khóa Sinh Vật Thủy Sinh (Milestone 2.16)** | **Hoàn thiện 100%** (Milestone 2.16 Complete) |
| **Hoạt Ảnh Sông & Hồ Mới & Bộ Autotile Bờ Nước Chuẩn Hóa (Milestone 2.15)** | **Hoàn thiện 100%** (Milestone 2.15 Complete) |
| **Lớp Phủ Bọt Sóng & Cát Bo Toàn Diện 2 Góc Bờ Biển (Milestone 2.14)** | **Hoàn thiện 100%** (Milestone 2.14 Complete) |
| **Cỏ Ranh Giới Vùng Tối & Khôi Phục Cây Tối 64x64 Nguyên Vẹn (Milestone 2.13)** | **Hoàn thiện 100%** (Milestone 2.13 Complete) |
| **Nhảy Lên Vách Đá (Phím Space) & Rơi Độ Cao Xuống Vách (Milestone 2.12)** | **Hoàn thiện 100%** (Milestone 2.12 Complete) |
| **Hoạt Ảnh Pokémon Thế Giới Liên Tục & Nhịp Thở Tự Nhiên (Milestone 2.11)** | **Hoàn thiện 100%** (Milestone 2.11 Complete) |
| **Tái Cấu Trúc Thư Mục Tài Nguyên Theo Biome & Phân Hệ (Milestone 2.10)** | **Hoàn thiện 100%** (Milestone 2.10 Complete) |
| **Biome Vùng Đất Tối, Quần Thể Phế Tích & Nghĩa Trang Cổ (Milestone 2.09)** | **Hoàn thiện 100%** (Milestone 2.09 Complete) |
| **Chuẩn Hóa Đồi Cát Sa Mạc & Kích Hoạt Sinh Thái Rừng Thưa (Milestone 2.08)** | **Hoàn thiện 100%** (Milestone 2.08 Complete) |
| **Tích Hợp Biome Sa Mạc & Tài Nguyên Tự Nhiên (Milestone 2.07)** | **Hoàn thiện 100%** (Milestone 2.07 Complete) |
| **Thời Gian Thế Giới, Chu Kỳ Ngày/Đêm & Wildlife Circadian Runtime (Milestone 2.06)** | **Hoàn thiện phần runtime cốt lõi** |
| **Autotiling Bờ Biển 8 Hướng & Ranh Giới Sinh Vật Thủy Sinh (Milestone 2.04)** | **Hoàn thiện 100%** (Milestone 2.04 Complete) |
| **Sinh Thái Pokémon Dưới Nước (Water Wildlife Spawning & Movement)** | **Hoàn thiện 100%** (Milestone 2.03 Complete) |
| **Sprite Overworld Dưới Nước & Bay Lơ Lửng (Swimming & Levitates Sprites)** | **Hoàn thiện 100%** (Milestone 2.02 Complete) |
| **Nâng Cấp Địa Hình Đồng Bằng & Thêm Biến Thể Thực Vật (Terrain & Flora)** | **Hoàn thiện 100%** (Milestone 2.01 Complete) |
| **Thoát Về Màn Hình Chờ (In-Game Menu Exit to Title Screen)** | **Hoàn thiện 100%** (Milestone 2.00 Complete) |
| **Tạo & Tải Thế Giới Đa Slot (New World & Save World Picker)** | **Hoàn thiện 100%** (Milestone 1.99 Complete) |
| **Thế giới mở v3: Thung lũng & Hành lang (World Gen v3)** | **Hoàn thiện 100%** (Milestone 1.98 Complete) |
| **Hoạt Ảnh Idle Nhân Vật (Player Idle Animation)** | **Hoàn thiện 100%** (Milestone 1.97 Complete) |
| **Bản đồ Toàn cảnh Thế giới (World Map System)** | **Hoàn thiện 100%** (Milestone 1.96 Complete) |
| **Hệ thống Sinh vật Hoang dã (Wildlife System)** | **Hoàn thiện 100%** (W1..W8 Complete) |
| **Thế giới mở vô hạn 2D (World Gen v0)** | **Hoàn thiện 100%** (S1..S8 Complete + Shore Wave Autotiling) |
| **Sinh thái & Phân vùng Spatial** | Hoàn thiện 100% |
| **Hệ thống Trận đấu (Battle Engine)** | Hoàn thiện 100% |
| **Lưu trữ & Dữ liệu (Autosave V3)** | Hoàn thiện 100% |
| **Âm thanh (Audio Engine)** | Hoàn thiện 100% |
| **Công cụ Gỡ lỗi (Dev/Bot Tools)** | Hoàn thiện 100% |

### 1.1. Hệ Thống Sinh Vật Hoang Dã (Wildlife W1..W8)

Hoàn thiện. Hướng dẫn: [WILDLIFE_DEV_GUIDE.md](file:///e:/Pokemon/docs/WILDLIFE_DEV_GUIDE.md); chi tiết triển khai xem bản lưu trữ v2.81.

## 2. Tiến Độ Hoạt Ảnh Chiêu Thức (Battle Animations)

Tính đến Milestone 1.92, dự án đã hiện thực hóa và tích hợp thành công **hơn 800 chiêu thức** với hoạt ảnh chuyên biệt, trong đó:

- **312 chiêu thức** được nâng cấp toàn diện chuẩn **1:1 Pokémon Unbreakable Ties 4.1.2** (dải ID `6900..7360+`) với đầy đủ đồ họa `PRAS-*.png`, âm thanh 16-bit 48kHz, đối trọng phe địch `OppMove`, và thuật toán ma trận tọa độ không lệch màn hình.
- **488 chiêu thức** sử dụng hoạt ảnh chuẩn từ Pokémon Reunion EX / Last Chance / Essentials Base (dải ID `1..6899`).

### Bảng Tiến Độ Các Nhóm Chữ Cái:

| Nhóm Chữ         | Số chiêu |        Trạng thái         | Nguồn hoạt ảnh & Ghi chú                                                                                |
| :--------------- | :------: | :-----------------------: | :------------------------------------------------------------------------------------------------------ |
| **Nhóm A -> L**  |   425    |     **Đã hoàn thiện**     | Kế thừa chuẩn Reunion EX, Last Chance và Unbreakable Ties (đã rà soát tọa độ đối thủ OppMove).          |
| **Nhóm M**       |    80    |     **Đã hoàn thiện**     | 100% đạt chuẩn (bao gồm 19 chiêu Gen 8 Max Moves và 15 chiêu Unbreakable Ties 1:1).                     |
| **Nhóm N & O**   |    26    |     **Đã hoàn thiện**     | 100% đạt chuẩn Unbreakable Ties (IDs 6909..6935).                                                       |
| **Nhóm P**       |    62    |     **Đã hoàn thiện**     | 100% đạt chuẩn Unbreakable Ties (IDs 6936..7011).                                                       |
| **Nhóm Q & R**   |    45    |     **Đã hoàn thiện**     | 100% đạt chuẩn Unbreakable Ties (IDs 7012..7069).                                                       |
| **Nhóm S**       |   156    |     **Đã hoàn thiện**     | 100% đạt chuẩn Unbreakable Ties (IDs 7070..7246, 4 đợt import chuyên sâu).                              |
| **Nhóm T**       |    60    |     **Đã hoàn thiện**     | 100% đạt chuẩn (IDs 7247..7338, đã rà soát 2 lượt, sửa lỗi lệch tọa độ $X=-126$ và chuẩn hóa âm thanh). |
| **Nhóm U & V**   |    15    |     **Đã hoàn thiện**     | 100% đạt chuẩn (IDs 7339..7360, khắc phục quỹ đạo U-Turn, chưởng Upper Hand và cắm đòn Vital Throw).    |
| **Nhóm W, Y, Z** |    32    | _Chưa nâng cấp đợt riêng_ | Đang dùng Last Chance cũ, Essentials cũ hoặc Fallback theo hệ.                                          |
| **Nhóm G-Max**   |    33    |   _Chờ thiết kế riêng_    | Tạm thời dùng Fallback theo hệ tương ứng với Max Moves.                                                 |

---

## 3. DANH SÁCH CHI TIẾT CÁC CHIÊU THỨC CHƯA TỐI ƯU HOẠT ẢNH

Dưới đây là thống kê chi tiết toàn bộ các chiêu thức **chưa có hoạt ảnh chuyên biệt tối ưu** (đang dùng hoạt ảnh tạm thời từ bản cũ hoặc cơ chế fallback theo Hệ/Loại chiêu thức). Danh sách này được phân loại rõ ràng để làm cơ sở tra cứu và triển khai tiếp:

### 3.1. Nhóm Chữ W (27 chiêu thức - Chưa triển khai đợt Unbreakable Ties chuyên biệt)

> **Đặc điểm**: Chưa có spritesheet PRAS chuyên biệt, âm thanh chưa resample sang 16-bit 48kHz, và chưa có đối trọng OppMove chuyên biệt cho phe địch.

| ID Chiêu Thức    | Tên Tiếng Việt / Tiếng Anh          |    Hệ    | Phân loại | Tình trạng hiện tại               |
| :--------------- | :---------------------------------- | :------: | :-------: | :-------------------------------- |
| `wake_up_slap`   | Wake-Up Slap (Wake-Up Tát)          | Fighting | physical  | Dùng Last Chance (ID 6676)        |
| `water_gun`      | Water Gun (Súng Nước)               |  Water   |  special  | Dùng Essentials Base (ID 291)     |
| `water_pledge`   | Water Pledge (Lời Thề Nước)         |  Water   |  special  | **Chưa có ID (Fallback theo Hệ)** |
| `water_pulse`    | Water Pulse (Dao Động Sóng Nước)    |  Water   |  special  | Dùng Essentials Base (ID 293)     |
| `water_shuriken` | Water Shuriken (Phi Tiêu Nước)      |  Water   |  special  | Dùng Last Chance (ID 6677)        |
| `water_sport`    | Water Sport (Trò Chơi Dưới Nước)    |  Water   |  status   | Dùng Last Chance (ID 6683)        |
| `water_spout`    | Water Spout (Nước Spout)            |  Water   |  special  | Dùng Last Chance (ID 6684)        |
| `waterfall`      | Waterfall (Thác Nước)               |  Water   | physical  | Dùng Last Chance (ID 6685)        |
| `wave_crash`     | Wave Crash (Cú Va Chạm Sóng)        |  Water   | physical  | **Chưa có ID (Fallback theo Hệ)** |
| `weather_ball`   | Weather Ball (Quả Cầu Thời Tiết)    |  Normal  |  special  | Dùng Last Chance (ID 6686)        |
| `whirlpool`      | Whirlpool (Xoáy Nước)               |  Water   |  special  | Dùng Last Chance (ID 6687)        |
| `whirlwind`      | Whirlwind (Gió Lốc)                 |  Normal  |  status   | Dùng Essentials Base (ID 294)     |
| `wicked_blow`    | Wicked Blow (Đòn Đánh Hiểm Độc)     |   Dark   | physical  | **Chưa có ID (Fallback theo Hệ)** |
| `wicked_torque`  | Wicked Torque (Momen Xoắn Hiểm Ác)  |   Dark   | physical  | **Chưa có ID (Fallback theo Hệ)** |
| `wide_guard`     | Wide Guard (Khiên Bảo Vệ Diện Rộng) |   Rock   |  status   | Dùng Last Chance (ID 6689)        |
| `wild_charge`    | Wild Charge (Xung Kích Hoang Dã)    | Electric | physical  | Dùng Last Chance (ID 6690)        |
| `wildbolt_storm` | Wildbolt Storm (Bão Sét Hoang Dã)   | Electric |  special  | **Chưa có ID (Fallback theo Hệ)** |
| `will_o_wisp`    | Will-O-Wisp (Ngọn Lửa Ma Trơi)      |   Fire   |  status   | Dùng Essentials Base (ID 295)     |
| `wing_attack`    | Wing Attack (Tấn Công Bằng Cánh)    |  Flying  | physical  | Dùng Essentials Base (ID 296)     |
| `wish`           | Wish (Ước Nguyện)                   |  Normal  |  status   | Dùng Last Chance (ID 6691)        |
| `withdraw`       | Withdraw (Rút Đầu)                  |  Water   |  status   | Dùng Last Chance (ID 6692)        |
| `wonder_room`    | Wonder Room (Căn Phòng Kỳ Diệu)     | Psychic  |  status   | Dùng Last Chance (ID 6733)        |
| `wood_hammer`    | Wood Hammer (Búa Gỗ Khổng Lồ)       |  Grass   | physical  | Dùng Last Chance (ID 6693)        |
| `work_up`        | Work Up (Hưng Phấn)                 |  Normal  |  status   | Dùng Last Chance (ID 6694)        |
| `worry_seed`     | Worry Seed (Hạt Giống Lo Âu)        |  Grass   |  status   | Dùng Last Chance (ID 6695)        |
| `wrap`           | Wrap (Quấn Chặt)                    |  Normal  | physical  | Dùng Essentials Base (ID 297)     |
| `wring_out`      | Wring Out (Vắt Kiệt)                |  Normal  |  special  | Dùng Essentials Base (ID 299)     |

### 3.2. Nhóm Chữ Y & Z (5 chiêu thức)

| ID Chiêu Thức  | Tên Tiếng Việt / Tiếng Anh        |    Hệ    | Phân loại | Tình trạng hiện tại               |
| :------------- | :-------------------------------- | :------: | :-------: | :-------------------------------- |
| `yawn`         | Yawn (Ngáp Ngủ)                   |  Normal  |  status   | Dùng Last Chance (ID 6618)        |
| `zap_cannon`   | Zap Cannon (Đại Bác Sấm Sét)      | Electric |  special  | Dùng Essentials Base (ID 301)     |
| `zen_headbutt` | Zen Headbutt (Thiết Đầu Công Zen) | Psychic  | physical  | Dùng Last Chance (ID 6696)        |
| `zing_zap`     | Zing Zap (Điện Giật Tê Tái)       | Electric | physical  | Dùng Last Chance (ID 6724)        |
| `zippy_zap`    | Zippy Zap (Tia Điện Nhanh Lẹ)     | Electric | physical  | **Chưa có ID (Fallback theo Hệ)** |

### 3.3. Nhóm Chiêu Thức G-Max Gigantamax (33 chiêu thức - Chưa có hoạt ảnh riêng)

> **Đặc điểm**: Toàn bộ chiêu thức G-Max của Gen 8 hiện đang tạm thời tự động rơi vào fallback theo Type/Category (chờ thiết kế spritesheet và hiệu ứng đặc trưng cho từng hình thái Gigantamax).

| ID Chiêu Thức      | Tên Tiếng Anh    |    Hệ    | Phân loại | Tình trạng Fallback                  |
| :----------------- | :--------------- | :------: | :-------: | :----------------------------------- |
| `g_max_befuddle`   | G-Max Befuddle   |   Bug    | physical  | Fallback theo Hệ Bug (physical)      |
| `g_max_cannonade`  | G-Max Cannonade  |  Water   | physical  | Fallback theo Hệ Water (physical)    |
| `g_max_centiferno` | G-Max Centiferno |   Fire   | physical  | Fallback theo Hệ Fire (physical)     |
| `g_max_chi_strike` | G-Max Chi Strike | Fighting | physical  | Fallback theo Hệ Fighting (physical) |
| `g_max_cuddle`     | G-Max Cuddle     |  Normal  | physical  | Fallback theo Hệ Normal (physical)   |
| `g_max_depletion`  | G-Max Depletion  |  Dragon  | physical  | Fallback theo Hệ Dragon (physical)   |
| `g_max_drum_solo`  | G-Max Drum Solo  |  Grass   | physical  | Fallback theo Hệ Grass (physical)    |
| `g_max_finale`     | G-Max Finale     |  Fairy   | physical  | Fallback theo Hệ Fairy (physical)    |
| `g_max_fireball`   | G-Max Fireball   |   Fire   | physical  | Fallback theo Hệ Fire (physical)     |
| `g_max_foam_burst` | G-Max Foam Burst |  Water   | physical  | Fallback theo Hệ Water (physical)    |
| `g_max_gold_rush`  | G-Max Gold Rush  |  Normal  | physical  | Fallback theo Hệ Normal (physical)   |
| `g_max_gravitas`   | G-Max Gravitas   | Psychic  | physical  | Fallback theo Hệ Psychic (physical)  |
| `g_max_hydrosnipe` | G-Max Hydrosnipe |  Water   | physical  | Fallback theo Hệ Water (physical)    |
| `g_max_malodor`    | G-Max Malodor    |  Poison  | physical  | Fallback theo Hệ Poison (physical)   |
| `g_max_meltdown`   | G-Max Meltdown   |  Steel   | physical  | Fallback theo Hệ Steel (physical)    |
| `g_max_one_blow`   | G-Max One Blow   |   Dark   | physical  | Fallback theo Hệ Dark (physical)     |
| `g_max_rapid_flow` | G-Max Rapid Flow |  Water   | physical  | Fallback theo Hệ Water (physical)    |
| `g_max_replenish`  | G-Max Replenish  |  Normal  | physical  | Fallback theo Hệ Normal (physical)   |
| `g_max_resonance`  | G-Max Resonance  |   Ice    | physical  | Fallback theo Hệ Ice (physical)      |
| `g_max_sandblast`  | G-Max Sandblast  |  Ground  | physical  | Fallback theo Hệ Ground (physical)   |
| `g_max_smite`      | G-Max Smite      |  Fairy   | physical  | Fallback theo Hệ Fairy (physical)    |
| `g_max_snooze`     | G-Max Snooze     |   Dark   | physical  | Fallback theo Hệ Dark (physical)     |
| `g_max_steelsurge` | G-Max Steelsurge |  Steel   | physical  | Fallback theo Hệ Steel (physical)    |
| `g_max_stonesurge` | G-Max Stonesurge |  Water   | physical  | Fallback theo Hệ Water (physical)    |
| `g_max_stun_shock` | G-Max Stun Shock | Electric | physical  | Fallback theo Hệ Electric (physical) |
| `g_max_sweetness`  | G-Max Sweetness  |  Grass   | physical  | Fallback theo Hệ Grass (physical)    |
| `g_max_tartness`   | G-Max Tartness   |  Grass   | physical  | Fallback theo Hệ Grass (physical)    |
| `g_max_terror`     | G-Max Terror     |  Ghost   | physical  | Fallback theo Hệ Ghost (physical)    |
| `g_max_vine_lash`  | G-Max Vine Lash  |  Grass   | physical  | Fallback theo Hệ Grass (physical)    |
| `g_max_volcalith`  | G-Max Volcalith  |   Rock   | physical  | Fallback theo Hệ Rock (physical)     |
| `g_max_volt_crash` | G-Max Volt Crash | Electric | physical  | Fallback theo Hệ Electric (physical) |
| `g_max_wildfire`   | G-Max Wildfire   |   Fire   | physical  | Fallback theo Hệ Fire (physical)     |
| `g_max_wind_rage`  | G-Max Wind Rage  |  Flying  | physical  | Fallback theo Hệ Flying (physical)   |

### 3.4. Nhóm Chiêu Thức Gen 8/9, Hisui, Let's Go & Z-Moves (116 chiêu thức Chưa Có Hoạt Ảnh Riêng)

> **Đặc điểm**: Các chiêu thức thế hệ mới (Gen 8/9, Hisui, Partner Let's Go, Tuyệt kỹ Z-Move) chưa có trong bộ dữ liệu gốc của Pokémon Essentials / Unbreakable Ties 4.1.2. Hiện đang sử dụng cơ chế Dynamic Fallback thông minh theo Hệ và Loại đòn.

| ID Chiêu Thức                 | Tên Tiếng Anh               |    Hệ    | Phân loại | Tình trạng Fallback        |
| :---------------------------- | :-------------------------- | :------: | :-------: | :------------------------- |
| `10000000_volt_thunderbolt`   | 10,000,000 Volt Thunderbolt | Electric |  special  | Fallback Electric special  |
| `acid_downpour`               | Acid Downpour               |  Poison  | physical  | Fallback Poison physical   |
| `alluring_voice`              | Alluring Voice              |  Fairy   |  special  | Fallback Fairy special     |
| `aqua_cutter`                 | Aqua Cutter                 |  Water   | physical  | Fallback Water physical    |
| `aqua_step`                   | Aqua Step                   |  Water   | physical  | Fallback Water physical    |
| `armor_cannon`                | Armor Cannon                |   Fire   |  special  | Fallback Fire special      |
| `axe_kick`                    | Axe Kick                    | Fighting | physical  | Fallback Fighting physical |
| `baddy_bad`                   | Baddy Bad                   |   Dark   |  special  | Fallback Dark special      |
| `barb_barrage`                | Barb Barrage                |  Poison  | physical  | Fallback Poison physical   |
| `bitter_blade`                | Bitter Blade                |   Fire   | physical  | Fallback Fire physical     |
| `bitter_malice`               | Bitter Malice               |  Ghost   |  special  | Fallback Ghost special     |
| `blazing_torque`              | Blazing Torque              |   Fire   | physical  | Fallback Fire physical     |
| `bleakwind_storm`             | Bleakwind Storm             |  Flying  |  special  | Fallback Flying special    |
| `blood_moon`                  | Blood Moon                  |  Normal  |  special  | Fallback Normal special    |
| `bouncy_bubble`               | Bouncy Bubble               |  Water   |  special  | Fallback Water special     |
| `burning_bulwark`             | Burning Bulwark             |   Fire   |  status   | Fallback Fire status       |
| `buzzy_buzz`                  | Buzzy Buzz                  | Electric |  special  | Fallback Electric special  |
| `ceaseless_edge`              | Ceaseless Edge              |   Dark   | physical  | Fallback Dark physical     |
| `clangorous_soulblaze`        | Clangorous Soulblaze        |  Dragon  |  special  | Fallback Dragon special    |
| `combat_torque`               | Combat Torque               | Fighting | physical  | Fallback Fighting physical |
| `comeuppance`                 | Comeuppance                 |   Dark   | physical  | Fallback Dark physical     |
| `continental_crush`           | Continental Crush           |   Rock   | physical  | Fallback Rock physical     |
| `dire_claw`                   | Dire Claw                   |  Poison  | physical  | Fallback Poison physical   |
| `doodle`                      | Doodle                      |  Normal  |  status   | Fallback Normal status     |
| `double_shock`                | Double Shock                | Electric | physical  | Fallback Electric physical |
| `dragon_cheer`                | Dragon Cheer                |  Dragon  |  status   | Fallback Dragon status     |
| `electro_drift`               | Electro Drift               | Electric |  special  | Fallback Electric special  |
| `electro_shot`                | Electro Shot                | Electric |  special  | Fallback Electric special  |
| `esper_wing`                  | Esper Wing                  | Psychic  |  special  | Fallback Psychic special   |
| `fickle_beam`                 | Fickle Beam                 |  Dragon  |  special  | Fallback Dragon special    |
| `fillet_away`                 | Fillet Away                 |  Normal  |  status   | Fallback Normal status     |
| `floaty_fall`                 | Floaty Fall                 |  Flying  | physical  | Fallback Flying physical   |
| `flower_trick`                | Flower Trick                |  Grass   | physical  | Fallback Grass physical    |
| `freezy_frost`                | Freezy Frost                |   Ice    |  special  | Fallback Ice special       |
| `genesis_supernova`           | Genesis Supernova           | Psychic  |  special  | Fallback Psychic special   |
| `gigaton_hammer`              | Gigaton Hammer              |  Steel   | physical  | Fallback Steel physical    |
| `glaive_rush`                 | Glaive Rush                 |  Dragon  | physical  | Fallback Dragon physical   |
| `glitzy_glow`                 | Glitzy Glow                 | Psychic  |  special  | Fallback Psychic special   |
| `grassy_glide`                | Grassy Glide                |  Grass   | physical  | Fallback Grass physical    |
| `guardian_of_alola`           | Guardian of Alola           |  Fairy   |  special  | Fallback Fairy special     |
| `happy_hour`                  | Happy Hour                  |  Normal  |  status   | Fallback Normal status     |
| `hard_press`                  | Hard Press                  |  Steel   | physical  | Fallback Steel physical    |
| `headlong_rush`               | Headlong Rush               |  Ground  | physical  | Fallback Ground physical   |
| `high_jump_kick`              | High Jump Kick              | Fighting | physical  | Fallback Fighting physical |
| `hold_back`                   | Hold Back                   |  Normal  | physical  | Fallback Normal physical   |
| `hold_hands`                  | Hold Hands                  |  Normal  |  status   | Fallback Normal status     |
| `hurricane`                   | Hurricane                   |  Flying  |  special  | Fallback Flying special    |
| `hydro_steam`                 | Hydro Steam                 |  Water   |  special  | Fallback Water special     |
| `hydro_vortex`                | Hydro Vortex                |  Water   | physical  | Fallback Water physical    |
| `hyper_drill`                 | Hyper Drill                 |  Normal  | physical  | Fallback Normal physical   |
| `hyperspace_fury`             | Hyperspace Fury             |   Dark   | physical  | Fallback Dark physical     |
| `hyperspace_hole`             | Hyperspace Hole             | Psychic  |  special  | Fallback Psychic special   |
| `ice_spinner`                 | Ice Spinner                 |   Ice    | physical  | Fallback Ice physical      |
| `infernal_parade`             | Infernal Parade             |  Ghost   |  special  | Fallback Ghost special     |
| `inferno_overdrive`           | Inferno Overdrive           |   Fire   | physical  | Fallback Fire physical     |
| `ivy_cudgel`                  | Ivy Cudgel                  |  Grass   | physical  | Fallback Grass physical    |
| `kowtow_cleave`               | Kowtow Cleave               |   Dark   | physical  | Fallback Dark physical     |
| `last_respects`               | Last Respects               |  Ghost   | physical  | Fallback Ghost physical    |
| `lets_snuggle_forever`        | Let's Snuggle Forever       |  Fairy   | physical  | Fallback Fairy physical    |
| `light_that_burns_the_sky`    | Light That Burns the Sky    | Psychic  |  special  | Fallback Psychic special   |
| `lumina_crash`                | Lumina Crash                | Psychic  |  special  | Fallback Psychic special   |
| `magic_powder`                | Magic Powder                | Psychic  |  status   | Fallback Psychic status    |
| `magic_room`                  | Magic Room                  | Psychic  |  status   | Fallback Psychic status    |
| `magical_torque`              | Magical Torque              |  Fairy   | physical  | Fallback Fairy physical    |
| `magma_storm`                 | Magma Storm                 |   Fire   |  special  | Fallback Fire special      |
| `magnet_rise`                 | Magnet Rise                 | Electric |  status   | Fallback Electric status   |
| `magnetic_flux`               | Magnetic Flux               | Electric |  status   | Fallback Electric status   |
| `make_it_rain`                | Make It Rain                |  Steel   |  special  | Fallback Steel special     |
| `malicious_moonsault`         | Malicious Moonsault         |   Dark   | physical  | Fallback Dark physical     |
| `malignant_chain`             | Malignant Chain             |  Poison  |  special  | Fallback Poison special    |
| `mat_block`                   | Mat Block                   | Fighting |  status   | Fallback Fighting status   |
| `matcha_gotcha`               | Matcha Gotcha               |  Grass   |  special  | Fallback Grass special     |
| `max_airstream`               | Max Airstream               |  Flying  | physical  | Fallback Flying physical   |
| `max_darkness`                | Max Darkness                |   Dark   | physical  | Fallback Dark physical     |
| `max_flare`                   | Max Flare                   |   Fire   | physical  | Fallback Fire physical     |
| `max_flutterby`               | Max Flutterby               |   Bug    | physical  | Fallback Bug physical      |
| `max_geyser`                  | Max Geyser                  |  Water   | physical  | Fallback Water physical    |
| `max_guard`                   | Max Guard                   |  Normal  |  status   | Fallback Normal status     |
| `max_hailstorm`               | Max Hailstorm               |   Ice    | physical  | Fallback Ice physical      |
| `max_knuckle`                 | Max Knuckle                 | Fighting | physical  | Fallback Fighting physical |
| `max_lightning`               | Max Lightning               | Electric | physical  | Fallback Electric physical |
| `max_mindstorm`               | Max Mindstorm               | Psychic  | physical  | Fallback Psychic physical  |
| `max_ooze`                    | Max Ooze                    |  Poison  | physical  | Fallback Poison physical   |
| `max_overgrowth`              | Max Overgrowth              |  Grass   | physical  | Fallback Grass physical    |
| `max_phantasm`                | Max Phantasm                |  Ghost   | physical  | Fallback Ghost physical    |
| `max_quake`                   | Max Quake                   |  Ground  | physical  | Fallback Ground physical   |
| `max_rockfall`                | Max Rockfall                |   Rock   | physical  | Fallback Rock physical     |
| `max_starfall`                | Max Starfall                |  Fairy   | physical  | Fallback Fairy physical    |
| `max_steelspike`              | Max Steelspike              |  Steel   | physical  | Fallback Steel physical    |
| `max_strike`                  | Max Strike                  |  Normal  | physical  | Fallback Normal physical   |
| `max_wyrmwind`                | Max Wyrmwind                |  Dragon  | physical  | Fallback Dragon physical   |
| `menacing_moonraze_maelstrom` | Menacing Moonraze Maelstrom |  Ghost   |  special  | Fallback Ghost special     |
| `meteor_assault`              | Meteor Assault              | Fighting | physical  | Fallback Fighting physical |
| `meteor_beam`                 | Meteor Beam                 |   Rock   |  special  | Fallback Rock special      |
| `mighty_cleave`               | Mighty Cleave               |   Rock   | physical  | Fallback Rock physical     |
| `mind_blown`                  | Mind Blown                  |   Fire   |  special  | Fallback Fire special      |
| `mirror_move`                 | Mirror Move                 |  Flying  |  status   | Fallback Flying status     |
| `misty_explosion`             | Misty Explosion             |  Fairy   |  special  | Fallback Fairy special     |
| `moongeist_beam`              | Moongeist Beam              |  Ghost   |  special  | Fallback Ghost special     |
| `mortal_spin`                 | Mortal Spin                 |  Poison  | physical  | Fallback Poison physical   |
| `mountain_gale`               | Mountain Gale               |   Ice    | physical  | Fallback Ice physical      |
| `mud_slap`                    | Mud-Slap                    |  Ground  |  special  | Fallback Ground special    |
| `multi_attack`                | Multi-Attack                |  Normal  | physical  | Fallback Normal physical   |
| `mystical_power`              | Mystical Power              | Psychic  |  special  | Fallback Psychic special   |
| `oblivion_wing`               | Oblivion Wing               |  Flying  |  special  | Fallback Flying special    |
| `obstruct`                    | Obstruct                    |   Dark   |  status   | Fallback Dark status       |
| `oceanic_operetta`            | Oceanic Operetta            |  Water   |  special  | Fallback Water special     |
| `octolock`                    | Octolock                    | Fighting |  status   | Fallback Fighting status   |
| `odor_sleuth`                 | Odor Sleuth                 |  Normal  |  status   | Fallback Normal status     |
| `order_up`                    | Order Up                    |  Dragon  | physical  | Fallback Dragon physical   |
| `origin_pulse`                | Origin Pulse                |  Water   |  special  | Fallback Water special     |
| `overdrive`                   | Overdrive                   | Electric |  special  | Fallback Electric special  |
| `pika_papow`                  | Pika Papow                  | Electric |  special  | Fallback Electric special  |
| `population_bomb`             | Population Bomb             |  Normal  | physical  | Fallback Normal physical   |
| `pounce`                      | Pounce                      |   Bug    | physical  | Fallback Bug physical      |
| `power_shift`                 | Power Shift                 |  Normal  |  status   | Fallback Normal status     |

---

## 4. Kế Hoạch & Định Hướng Tiếp Theo

1. **Hoàn tất rà soát hoạt ảnh**: Hiện tại toàn bộ các nhóm chiêu thức từ A đến V đã hoàn thành 100% với 0 lỗi kiểm thử.
2. **Chuyển trọng tâm sang các tính năng gameplay & overworld khác** theo yêu cầu của người dùng (nâng cấp AI chiến đấu, mở rộng bản đồ, tương tác NPC, hệ thống nhiệm vụ, bắt Pokémon, v.v.).
3. **Khi cần tối ưu hoạt ảnh tiếp theo**: Có thể triển khai đợt tiếp theo cho Nhóm Chữ W (27 chiêu) và Nhóm Y/Z để đạt độ bao phủ toàn diện 100% trọn vẹn từ A đến Z.

---

## 5. Milestone 2.70: Cảnh 7 (Nhận Pokédex & Pokéball), Radial Menu & Khóa Bản Đồ

### 5.1. Kịch bản Cảnh 7: Phòng thí nghiệm Oak (`act1.pallet.lab_pokedex`)
- **Nội dung anime**:
  - Giáo sư Okido: *"Đúng nhỉ. Được rồi, cầm lấy những thứ này: một cái Pokemon Zukan và vài quả Pokemon."*
  - Satoshi: *"Cảm ơn ông rất nhiều! (Cả hai cùng bị giật điện)"*
  - Giáo sư Okido: *"Mau cho nó vào trong bóng đi!"*
- **Hiệu ứng & Âm thanh**:
  - Hoạt ảnh giật điện tập thể: Rung lắc màn hình canvas (`canvas-zap-shake`, `lightning-zap`), rung giật chân dung hội thoại (`zap-shake`).
  - Âm thanh SE sấm sét `Thunder3.ogg`, tiếng kêu Pikachu tức giận `pikachu.mp3`, biểu cảm giật mình `exclamation` trên đầu Satoshi và Giáo sư Okido.
- **Phần thưởng & Cờ trạng thái**:
  - Tặng vật phẩm: 5x Pokéball (`poke_ball: 5`).
  - Mở khóa tính năng: `has_pokedex: true`, `pallet_lab_pokedex_received: true`.

### 5.2. Khóa Bản Đồ & Pokédex Khi Chưa Mở Khóa
- **Minimap**: Ẩn hoàn toàn khỏi Overworld khi người chơi chưa nhận Town Map (`!has_town_map`).
- **World Map**: Khóa mở màn hình bản đồ thế giới bằng phím `M` hoặc `N` khi chưa có `has_town_map` và hiển thị toast cảnh báo: `🗺️ Bạn chưa nhận được Bản Đồ Thị Trấn (Town Map)!`.
- **Pokédex**: Ẩn nút Pokédex trên menu bar khi chưa có `has_pokedex`; nhấn phím tắt `Q` sẽ thông báo `📘 Bạn chưa nhận được Pokémon Zukan (Pokédex)!`.
- **Tự động đồng bộ**: Đăng ký `playerService.subscribe` để tự động mở khóa và hiển thị các icon/tính năng ngay khi cờ tiến trình được thiết lập.

### 5.3. Menu Bánh Xe Tròn (Radial Pie Wheel Menu)
- **Cơ chế điều khiển**:
  - Bật / tắt bằng **Nút giữa chuột (Middle Click - `e.button === 1`)** HOẶC **Phím `ESC`**.
  - Tự động chặn sự kiện cuộn trang mặc định của trình duyệt (`e.preventDefault()`).
  - Khóa di chuyển nhân vật trong `GameSession` khi bánh xe menu đang hiển thị.
- **Thiết kế UI/UX hiện đại**:
  - Vòng tròn SVG chia đều $N$ lát cắt (sectors) tính toán góc chính xác theo hình học lượng giác.
  - Mỗi lát cắt có màu sắc đặc trưng, biểu tượng neon phát sáng và hiệu ứng nổi bật khi rê chuột.
  - Trung tâm vòng tròn (Center Hub) hiển thị Pokéball với hiệu ứng xoay và hiển thị thông tin mô tả chi tiết: Biểu tượng, Tiêu đề, Phím tắt, Mô tả tính năng.
  - Âm thanh retro sinh động: `GUI sel cursor.ogg` khi rê chuột, `GUI sel decision.ogg` khi chọn mục, `GUI sel cancel.ogg` khi đóng menu.
- **Tính năng động theo tiến trình**:
  - Tự động lọc các mục chưa mở khóa (Pokédex chỉ xuất hiện khi `has_pokedex`, Bản đồ chỉ xuất hiện khi `has_town_map`).

### 5.4. Kết Quả Kiểm Thử & Parity
- **TypeScript**: `npm run typecheck:web` $\rightarrow$ **0 lỗi**.
- **Unit Tests**:
  - `pallet-prologue-event.test.ts`: **12/12 passed**.
  - `route1-spearow-event.test.ts`: **6/6 passed**.
  - Tổng cộng: **18/18 passed**.
- **Schema & Asset Parity**: `validate-schemas.mjs` $\rightarrow$ **853/853 assets valid**.

