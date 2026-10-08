## Cập nhật lần cuối: 2026-10-08 (Thiết Kế Menu Nút Bấm Chuẩn Phong Cách Minecraft GUI Đồng Nhất 1 Màu - Pure CSS)

### 0.66. Tái Thiết Kế Menu Nút Bấm Chuẩn Phong Cách Minecraft GUI (Đồng Nhất 1 Màu - Không Dùng Asset Ngoài):

- **Trạng thái:** Đã hoàn thành 100%. 25 tệp test suite (192/192 tests), Typecheck (`npm run typecheck:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Render các nút giống phong cách Minecraft, sử dụng 1 màu đồng nhất, tối giản và thanh lịch, không dùng asset có sẵn.
- **Chi tiết đã thực hiện:**
  1. **Đồng Nhất 1 Màu & Tạo Hình Khối Minecraft GUI ([style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Toàn bộ 4 nút (Thế Giới Mới, Tải Thế Giới, Gia Nhập Thế Giới, Cài Đặt) dùng chung **một màu xám đá Minecraft kinh điển (`#737373`)** với viền đen `border: 2px solid #000000`.
     - Loại bỏ các màu sắc và ký hiệu rườm rà, tạo cảm giác retro tối giản, thanh lịch và hoài niệm đặc trưng của Minecraft.
  2. **Viền Bevel 3D & Hiệu Ứng Bấm Nút Cơ Học Minecraft:**
     - **3D Bevel kinh điển:** Viền trên và trái có highlight trắng xám sáng (`inset 2px 2px 0 0 rgba(255, 255, 255, 0.55)`), viền dưới và phải có dải bóng tối xám sẫm (`inset -2px -2px 0 0 #373737`).
     - **Hiệu ứng Hover:** Nút chuyển sang tông xám sáng pha xanh nhạt (`#8c9cb0`), toàn bộ chữ chuyển sang **màu vàng tươi Minecraft `#ffffa0`** chuẩn mực với bóng đổ `#3f3f28`.
     - **Hiệu ứng Active (Click):** Nút thụt xuống $2\text{px}$, bevel đảo ngược (trên/trái thành tối `#000000`, dưới/phải thành sáng) tạo cảm giác bấm nút cơ học đã tay.
  3. **Phông Chữ & Bóng Đổ Pixel Minecraft:**
     - Font pixel căn giữa hoàn hảo (`text-align: center`), màu chữ mặc định `#e0e0e0` kết hợp bóng chữ pixel chuẩn Minecraft: `text-shadow: 2px 2px 0px #3f3f3f`.
  4. **Kiểm Thử & Đảm Bảo Tính Toàn Vẹn:**
     - `npm run typecheck:web` $\rightarrow$ PASS, 0 errors.
     - `npm run test:web` $\rightarrow$ 25/25 suites, 192/192 tests PASS 100%.

---

### 0.65. Tinh Chỉnh Độ Cao Tầng Cỏ Tiền Cảnh Title Screen (Layer 7b & Layer 7a):

- **Trạng thái:** Đã hoàn thành 100%. 25 tệp test suite (192/192 tests), Typecheck (`npm run typecheck:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Đẩy layer 7b xuống thêm 30px và layer 7a xuống thêm 50px.
- **Chi tiết đã thực hiện:**
  1. **Điều Chỉnh Tọa Độ Layer 7b (Nearest Camera Grass Layer - [title-screen.ts](file:///e:/Pokemon/apps/web/src/ui/title-screen.ts)):**
     - Đẩy xuống thêm $30\text{px} \rightarrow Y = 340\text{px}$ (`swayY2 = 340 + Math.sin(...) * 2.5`).
     - Với chiều cao hiển thị $dh_2 = 1125\text{px}$, chân cỏ chìm sâu xuống dưới mép canvas $1200\text{px}$ ($340 + 1125 = 1465\text{px}$), giữ phần ngọn cỏ nhô lên ở độ cao hài hòa, tinh tế.
  2. **Điều Chỉnh Tọa Độ Layer 7a (Back Foreground Grass Layer - [title-screen.ts](file:///e:/Pokemon/apps/web/src/ui/title-screen.ts)):**
     - Đẩy xuống thêm $50\text{px} \rightarrow Y = 460\text{px}$ (`swayY1 = 460 + Math.sin(...) * 2.0`).
     - Với chiều cao hiển thị $dh_1 = 956\text{px}$, chân cỏ vươn tới $1416\text{px}$, giữ trọn vẹn hiệu ứng phân tầng độ sâu phía sau Layer 7b.
  3. **Kiểm Thử & Đảm Bảo Tính Toàn Vẹn:**
     - `npm run typecheck:web` $\rightarrow$ PASS, 0 errors.
     - `npm run test:web` $\rightarrow$ 25/25 suites, 192/192 tests PASS 100%.

---

### 0.64. Khắc Phục Dứt Điểm Toàn Bộ Lỗi/Cảnh Báo ESLint & Xanh Tuyệt Đối Pipeline CI:

- **Trạng thái:** Đã hoàn thành 100%. Lệnh `npm run ci` chạy qua toàn bộ 6 bước kiểm định nghiêm ngặt đạt **PASS 100% (0 errors, 0 warnings)**:
  1. `validate:schemas`: 7/7 checks PASS (Parity TypeScript & Python, 275 asset manifests, 151 Gen 1 Pokémons).
  2. `lint` (`eslint .`): **0 errors, 0 warnings** (Đã xóa sạch 3 errors và 29 warnings).
  3. `format:check` (`prettier --check`): All matched files use Prettier code style.
  4. `typecheck:web` (`tsc --noEmit`): **0 lỗi typecheck**.
  5. `test:web` (`vitest run`): **24/24 suites (181/181 tests) PASS 100%**.
  6. `build:web` (`tsc -b && vite build`): **Build production thành công trong 20.95s**.
- **Chi tiết các hạng mục đã xử lý sạch:**
  1. **Sửa 3 lỗi ESLint nghiêm trọng:**
     - [apps/web/test/game-intro.test.ts](file:///e:/Pokemon/apps/web/test/game-intro.test.ts): Thay kiểu generic `Function` bằng `(...args: unknown[]) => void` chuẩn type-safety.
     - [apps/web/test/title-screen.test.ts](file:///e:/Pokemon/apps/web/test/title-screen.test.ts): Thay kiểu generic `Function` bằng `(...args: unknown[]) => void`.
     - [apps/web/test/party-map-hud.test.ts](file:///e:/Pokemon/apps/web/test/party-map-hud.test.ts): Loại bỏ `const self = this;` trong getter `classList` bằng cách chuyển sang các phương thức arrow functions.
  2. **Dọn dẹp triệt để 29 cảnh báo ESLint (`no-useless-assignment`, `@typescript-eslint/no-unused-vars`, `no-explicit-any`):**
     - [apps/web/src/ui/title-screen.ts](file:///e:/Pokemon/apps/web/src/ui/title-screen.ts): Thay `as any` bằng `as unknown as HTMLImageElement`.
     - [apps/web/src/battle/battle-engine.ts](file:///e:/Pokemon/apps/web/src/battle/battle-engine.ts): Loại bỏ gán giá trị thừa `damage`, `mag`, `pwr`.
     - [apps/web/src/maps/chunk-objects.ts](file:///e:/Pokemon/apps/web/src/maps/chunk-objects.ts): Loại bỏ gán thừa `numPatches` và `include`.
     - [apps/web/src/maps/terrain-rules.ts](file:///e:/Pokemon/apps/web/src/maps/terrain-rules.ts): Loại bỏ gán thừa `onMain`.
     - [apps/web/src/rendering/ground-renderer.ts](file:///e:/Pokemon/apps/web/src/rendering/ground-renderer.ts) & [object-renderer.ts](file:///e:/Pokemon/apps/web/src/rendering/object-renderer.ts): Loại bỏ gán thừa `fIdx`.
     - [apps/web/src/ui/party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts): Loại bỏ gán thừa chuỗi rỗng `panelBg`.
     - [apps/web/src/ui/pokedex/pokedex-sprite.ts](file:///e:/Pokemon/apps/web/src/ui/pokedex/pokedex-sprite.ts): Xóa biến `minY` không được sử dụng.
     - Các file unit test ([battle-advanced-moves.test.ts](file:///e:/Pokemon/apps/web/test/battle-advanced-moves.test.ts), [battle-events.test.ts](file:///e:/Pokemon/apps/web/test/battle-events.test.ts), [battle.test.ts](file:///e:/Pokemon/apps/web/test/battle.test.ts), [desktop-shell.test.ts](file:///e:/Pokemon/apps/web/test/desktop-shell.test.ts), [ecology-statistical.test.ts](file:///e:/Pokemon/apps/web/test/ecology-statistical.test.ts), [ecology.test.ts](file:///e:/Pokemon/apps/web/test/ecology.test.ts), [pokemon-nature-stats.test.ts](file:///e:/Pokemon/apps/web/test/pokemon-nature-stats.test.ts), [shiny-spatial.test.ts](file:///e:/Pokemon/apps/web/test/shiny-spatial.test.ts), [village.test.ts](file:///e:/Pokemon/apps/web/test/village.test.ts), [water-terrain.test.ts](file:///e:/Pokemon/apps/web/test/water-terrain.test.ts)): Dọn sạch toàn bộ unused imports và biến thừa.

---

### 0.63. Menu Nút Bấm Pixel [Bunton.png](file:///e:/Pokemon/Graphics/Intro/Buton/Bunton.png), 2 Tầng Cỏ Cận Camera & Bỏ Prompt Nhấp Toàn Màn Hình:

- **Trạng thái:** Đã hoàn thành 100%. 24 tệp test suite (181/181 tests), Typecheck và Schema validation đều đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:**
  1. Thay thế 2 lớp cỏ cũ bằng 2 lớp cỏ cận cảnh nhân bản từ [06_grass_front.png](file:///e:/Pokemon/Graphics/Intro/06_grass_front.png), lớp gần camera hơn được hạ thấp xuống 40px và lớp thứ nhất được thu nhỏ lại.
  2. Bổ sung hệ thống nút bấm pixel nằm ở góc trên mép bên trái sử dụng asset [Bunton.png](file:///e:/Pokemon/Graphics/Intro/Buton/Bunton.png) gồm các nút: **Thế Giới Mới**, **Tải Thế Giới**, **Gia Nhập Thế Giới**, **Cài Đặt**.
  3. Hạ vị trí menu button xuống 100px.
  4. Bỏ hoàn toàn phần "nhấp để vào thế giới" (prompt nhấp chuột/phím bất kỳ toàn màn hình), điều hướng vào game thông qua nút menu.
  5. Đổi hướng chuyển động của tất cả các lớp cỏ (`grass_front_day`, lớp cỏ nền và 2 lớp cỏ cận cảnh `06_grass_front.png`) thành cuộn từ **Trái qua Phải** thay vì từ phải qua trái.
- **Chi tiết đã thực hiện:**
  1. **Menu Nút Bấm Pixel ([title-screen.ts](file:///e:/Pokemon/apps/web/src/ui/title-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Nạp sprite giấy da cổ kính [Bunton.png](file:///e:/Pokemon/Graphics/Intro/Buton/Bunton.png) làm background nút bấm với `background-size: 100% 100%` và `image-rendering: pixelated`.
     - 4 nút chức năng:
       - **Thế Giới Mới (`btnNewWorld`):** Kích hoạt transition mượt mà và khởi tạo thế giới Overworld.
       - **Tải Thế Giới (`btnLoadWorld`):** Chuyển vào thế giới game.
       - **Gia Nhập Thế Giới (`btnJoinWorld`):** Hiển thị toast thông báo pixel art cho chế độ nhiều người chơi.
       - **Cài Đặt (`btnSettings`):** Hiển thị toast thông báo cấu hình hệ thống.
     - Định vị góc trên bên trái đã đẩy xuống 100px (`top: clamp(124px, calc(4.5vh + 100px), 148px)`).
     - Hiệu ứng hover dịch chuyển `+8px`, scale $1.03$, ánh hào quang vàng óng pixel và hiệu ứng active lún nút chân thực.
  2. **Bỏ Hoàn Toàn Lời Nhắc Nhấp Chuột Toàn Màn Hình ([title-screen.ts](file:///e:/Pokemon/apps/web/src/ui/title-screen.ts)):**
     - Loại bỏ phần tử DOM `titleStartPrompt` và `titleSubPrompt`.
     - Gỡ bỏ lắng nghe sự kiện `click` và `keydown` toàn màn hình. Tránh việc người chơi nhấp chuột ngắm cảnh màn hình chờ bị nhảy nhầm vào thế giới.
  3. **Đảo Chiều Toàn Bộ Các Lớp Cỏ Sang Trái ➔ Phải ([title-screen.ts](file:///e:/Pokemon/apps/web/src/ui/title-screen.ts)):**
     - **Lớp Cỏ Nền & [grass_front_day](file:///e:/Pokemon/Graphics/Intro/grass_front_day):** Tích hợp chu kỳ 24 frames hoạt họa đung đưa gió của `grass_front_day` kết hợp cùng lớp cỏ [05_grass.png](file:///e:/Pokemon/Graphics/Intro/Intro_moning/05_grass.png), cuộn đều đặn từ **Trái ➔ Phải** với tốc độ $125\text{ px/s}$.
     - **2 Lớp Cỏ Tiền Cảnh Cận Camera ([06_grass_front.png](file:///e:/Pokemon/Graphics/Intro/06_grass_front.png)):**
       - Lớp sau (scale $0.85$, $Y = 240$): Cuộn từ **Trái ➔ Phải** với tốc độ $165\text{ px/s}$.
       - Lớp cận camera nhất ($Y = 160$): Cuộn từ **Trái ➔ Phải** với tốc độ $215\text{ px/s}$.
       - Thuật toán lặp nối vô hạn (seamless infinite wrapping) với 3 tiles buffer $(-W, 0, +W)$ đảm bảo không có bất kỳ kẽ hở hoặc đứt gãy nào trên màn hình.
  4. **Kiểm Thử & Đảm Bảo Chất Lượng ([title-screen.test.ts](file:///e:/Pokemon/apps/web/test/title-screen.test.ts)):**
     - Đạt 181/181 unit tests (24/24 suites) PASS 100%. Typecheck đạt 0 lỗi.

---

### 0.62. Xây Dựng Màn Hình Chờ Động (Title Screen) & Bóc Tách Khởi Tạo Thế Giới Theo Yêu Cầu:

- **Trạng thái:** Đã hoàn thành 100%. 24 tệp test suite (180/180 tests), Typecheck và Schema validation đều đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:**
  1. Xây dựng một lớp màn hình chờ động (Title Screen) hiển thị ngay sau khi đoạn Intro mở ra.
  2. Bố cục gồm 5 tầng đồ họa theo ảnh mẫu:
     - Nền bầu trời (`01_sky_moning.png`): Tĩnh, mở rộng phủ toàn màn hình.
     - Mây (`clouds/cloud_01`..`cloud_16`): Xuất hiện ngẫu nhiên và trôi từ **Trái ➔ Phải**.
     - Mặt nước biển (`03_sea_moning.png`): Chạy cuộn vô hạn liên tục từ **Phải ➔ Trái**.
     - Vệt nắng phản chiếu (`04_sun_reflection_cropped_moning.png`): Đứng cố định một chỗ ngay trên đường chân trời mặt nước.
     - Cỏ tiền cảnh (`grass_front_day/frame_00`..`frame_23`): 24 khung hình hoạt họa lặp vô hạn đung đưa theo gió.
  3. **Bóc tách thế giới:** Thế giới Overworld không còn tự động sinh ngay khi load trang nữa. Thế giới chỉ được khởi tạo và chạy khi người chơi bấm vào màn hình chờ. Tách riêng cơ chế này để không nhầm lẫn logic và giữ lại lối vào test nhanh cho nhà phát triển.
- **Chi tiết đã thực hiện:**
  1. **Bộ Điều Khiển Màn Hình Chờ Động ([title-screen.ts](file:///e:/Pokemon/apps/web/src/ui/title-screen.ts)):**
     - Tạo Canvas $1920 \times 1200$ chuẩn tỉ lệ gốc với `object-fit: cover` và pixel-art crisp rendering, đảm bảo hiển thị hoàn hảo trên mọi kích thước màn hình mà không bị lệch 1 pixel nào.
     - **Vòng lặp hoạt họa 60 FPS:**
       - **Mặt biển cuộn vô hạn:** Sử dụng thuật toán dual-strip side-by-side trượt đều đặn từ phải qua trái với vận tốc $28\text{ px/s}$, liên tục tuần hoàn không bao giờ đứt đoạn.
       - **Hệ thống sinh mây ngẫu nhiên:** Quản lý đồng thời 7 cụm mây với tọa độ $Y$ rải đều ở tầng dưới bầu trời ($480 \to 800\text{ px}$), vận tốc parallax ngẫu nhiên (mây lớn bay nhanh hơn mây nhỏ) trôi êm ả từ trái qua phải, tự động tái sinh ở biên trái khi bay qua biên phải.
       - **Vệt nắng mặt trời:** Cố định chính xác tại tọa độ $X = 984, Y = 848, W = 466, H = 49$, đứng yên soi bóng lung linh trên mặt biển đang cuộn.
       - **Dải cỏ tiền cảnh:** Hoạt họa tuần tự 24 frames (`frame_00` ➔ `frame_23`) ở đáy màn hình ($Y = 940 \to 1200$) với tần số $\approx 11\text{ FPS}$ tạo chuyển động gió thổi mượt mà.
     - **Tương tác chuyển cảnh:** Nhấp chuột hoặc bấm phím bất kỳ sẽ kích hoạt hiệu ứng lóe sáng prompt và fade out mượt mà, sau đó kích hoạt callback `onStart()`.
  2. **Bóc Tách Khởi Tạo Thế Giới ([bootstrap.ts](file:///e:/Pokemon/apps/web/src/bootstrap.ts)):**
     - Đóng gói toàn bộ logic khởi tạo `GameSession`, `GameRenderer`, `GameLoop`, nạp chunk và lắng nghe phím điều khiển vào hàm `launchGameWorld()`.
     - Khi mở game: Thế giới Overworld hoàn toàn **chưa khởi tạo**, không tiêu tốn tài nguyên CPU/RAM.
     - Giao diện HUD (`#topRightBar` và `#testOverlay`) được ẩn hoàn toàn trong suốt màn hình chờ, tạo trải nghiệm điện ảnh chuẩn mực.
     - Khi người chơi bấm vào màn hình chờ: `launchGameWorld()` mới chính thức được gọi, đưa người chơi vào map.
  3. **Lối Vào Test Nhanh Dành Cho Dev (Quick Dev Iteration):**
     - Bổ sung nút bấm `⚡ Vào Nhanh Overworld (Dev Test)` ngay trên màn hình chờ: bấm 1 click là bay thẳng vào game bỏ qua chờ đợi.
     - Hỗ trợ tham số URL `?quick=true` hoặc `?dev=true` để dev chạy thẳng vào map khi cần test nhanh.
     - Gắn các hook toàn cục `window.showTitleScreen()`, `window.launchGameWorld()` và `window.replayIntro()`.
  4. **Kiểu Dáng Giao Diện CSS & Căn Chuẩn Chiều Sâu 2 Lớp Cỏ ([style.css](file:///e:/Pokemon/apps/web/src/style.css), [title-screen.ts](file:///e:/Pokemon/apps/web/src/ui/title-screen.ts)):**
     - Thêm styling cho `.title-screen-overlay`, `.title-screen-canvas`, `.title-start-prompt`, `.title-sub-prompt` và `.btn-title-dev`.
     - **Hiệu chỉnh độ cao cỏ chuẩn gốc:** Đổi căn chỉnh canvas sang `bottom: 0; object-position: bottom center;` để cố định chân cỏ ở đáy màn hình trên mọi tỉ lệ hiển thị.
     - **Bổ sung lớp cỏ nền [05_grass.png](file:///e:/Pokemon/Graphics/Intro/Intro_moning/05_grass.png):** Tích hợp tầng cỏ tĩnh nằm ngay phía sau lớp cỏ hoạt họa, bắt đầu từ $Y = 919\text{ px}$ (nhô cao hơn lớp cỏ trước khoảng $32\text{ px}$).
     - **Hiệu ứng trượt cuộn nhanh:** Lớp cỏ nền cuộn liên tục từ Phải ➔ Trái với tốc độ nhanh vượt trội $125\text{ px/s}$ (gấp $\approx 4.5$ lần tốc độ mặt biển $28\text{ px/s}$), tạo cảm giác gió thổi cuốn qua thung lũng rất sống động, lướt qua phía sau dải cỏ tiền cảnh đang đung đưa theo chu kỳ.
  5. **Tích Hợp Pokémon Gyarados Đỏ (Red Gyarados) Hoạt Họa Bơi Trên Biển ([title-screen.ts](file:///e:/Pokemon/apps/web/src/ui/title-screen.ts)):**
     - Nạp spritesheet hoạt họa [0000- Gyarados red.png](file:///e:/Pokemon/Graphics/Intro/Intro_moning/0000-%20Gyarados%20red.png) ($256 \times 60\text{ px}$, gồm 4 khung hình chuyển động $64 \times 60\text{ px}$).
     - Đặt tại tầng nước biển phía bên phải ($Y = 848 \to 908\text{ px}$, $X \approx 1360\text{ px}$), bơi trong làn nước lấp lánh cạnh vệt nắng mặt trời, đầu quay về hướng Tây đón dòng sóng biển cuộn.
     - Chạy chu kỳ hoạt họa 4 khung hình tuần hoàn ($\approx 6\text{ FPS}$) kết hợp nhấp nhô theo nhịp sóng nước biển ($\sin(t)$ sóng dọc $\pm 2.5\text{ px}$ và dao động bơi ngang $\pm 8\text{ px}$), thân dưới chìm tự nhiên sau dải cỏ nền mang lại cảm giác Gyarados đỏ đang thực sự bơi lội trong làn nước biển bình minh.
  6. **Bổ Sung Đàn Chim Bay Trên Trời: 1 Pelipper & 4 Wingull ([title-screen.ts](file:///e:/Pokemon/apps/web/src/ui/title-screen.ts)):**
     - Nạp spritesheet hoạt họa [PELIPPER.png](file:///e:/Pokemon/Graphics/Intro/Intro_moning/PELIPPER.png) ($256 \times 68\text{ px}$, 4 frames) và [WINGULL.png](file:///e:/Pokemon/Graphics/Intro/Intro_moning/WINGULL.png) ($256 \times 66\text{ px}$, 4 frames).
     - **Bố cục đàn chim tự nhiên theo đội hình lượn:**
       - **1 Pelipper:** Bay điềm đạm ở tầng trung không ($X = 580\text{ px}, Y = 550\text{ px}$, tỉ lệ $1.0\times$), đập cánh khoan thai tốc độ $48\text{ px/s}$.
       - **4 Wingull:** Phân bổ so le tạo chiều sâu không gian (3D Parallax):
         - Chim đầu đàn: $X = 820\text{ px}, Y = 500\text{ px}$, tỉ lệ $0.95\times$, tốc độ $56\text{ px/s}$.
         - Chim bay cao: $X = 980\text{ px}, Y = 450\text{ px}$, tỉ lệ $0.80\times$, tốc độ $50\text{ px/s}$.
         - Chim bay thấp: $X = 1160\text{ px}, Y = 580\text{ px}$, tỉ lệ $0.88\times$, tốc độ $54\text{ px/s}$.
         - Chim bay xa trên cao: $X = 1480\text{ px}, Y = 410\text{ px}$, tỉ lệ $0.68\times$, tốc độ $42\text{ px/s}$.
       - Mỗi chú chim có pha đập cánh và tần số lượn sóng dọc $\sin(t)$ riêng biệt, bay từ Phải ➔ Trái và tự động tuần hoàn khi bay hết mép màn hình.
  7. **Kiểm Thử Tự Động ([title-screen.test.ts](file:///e:/Pokemon/apps/web/test/title-screen.test.ts)):**
     - Tạo test suite kiểm tra đầy đủ: render DOM canvas, prompt, dev button, cơ chế start transition và nút bypass test nhanh.
     - Toàn bộ 24 tệp test suite (180/180 bài test) đều **PASS 100%**.


---

### 0.61. Xây Dựng Intro Khởi Động Game: Màn Tối -> Logo2 Trắng -> Logo1 Màu -> Tách Màn Hình Trượt Lên/Xuống:

- **Trạng thái:** Đã hoàn thành 100%. 23 tệp test suite (177/177 tests), Typecheck và Schema validation đều đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Xây dựng một đoạn intro khi bắt đầu vào game:
  1. Ban đầu là màn hình tối đen (`#000000`).
  2. Sau đó `logo2.png` (viền trắng Pokémon) xuất hiện từ bóng tối.
  3. Tiếp theo `logo1.png` (logo Pokémon đầy đủ màu sắc vàng/xanh) xuất hiện bừng sáng thay thế logo2.
  4. Sau đó từ chính giữa màn hình tách đôi làm 2: 1 nửa đẩy trượt lên trên, 1 nửa đẩy trượt xuống dưới mở ra thế giới game.
- **Chi tiết đã thực hiện:**
  1. **Đồng Bộ Tài Nguyên Intro ([apps/web/public/Graphics/Intro/](file:///e:/Pokemon/apps/web/public/Graphics/Intro/)):**
     - Sao chép toàn bộ thư mục tài nguyên từ `e:\Pokemon\Graphics\Intro` sang `apps/web/public/Graphics/Intro/` để server tĩnh phục vụ ảnh chất lượng gốc với pixelated rendering chuẩn sắc nét.
  2. **Bộ Điều Khiển Hoạt Họa Điện Ảnh ([game-intro.ts](file:///e:/Pokemon/apps/web/src/ui/game-intro.ts)):**
     - Xây dựng kiến trúc Dual Shutter (màn sập đôi: nửa trên `intro-shutter-top` và nửa dưới `intro-shutter-bottom`).
     - Tận dụng `intro-content-wrapper` chiều cao 200% căn giữa nội dung, giúp 2 nửa ảnh logo trên và dưới khớp nối chính xác 100% không lệch 1 pixel nào trước khi tách.
     - **Dòng thời gian (Timeline):**
       - **Giai đoạn 1 (0 – 600ms):** Toàn màn hình tối đen tuyền tĩnh lặng.
       - **Giai đoạn 2 (600ms):** `logo2.png` (viền trắng) fade in với hiệu ứng glow phát sáng viền huyền ảo (`drop-shadow(0 0 28px rgba(96, 165, 250, 0.55))`).
       - **Giai đoạn 3 (2200ms):** `logo1.png` (full color) hiện rõ với hào quang vàng/xanh bừng sáng rực rỡ, làm mờ nhẹ logo viền trắng phía sau.
       - **Giai đoạn 4 (4200ms):** Tia chớp năng lượng horizon (`intro-center-flash`) lóe sáng rực rỡ dọc đường phân cách giữa màn hình, sau đó 2 nửa shutter tách ra: nửa trên trượt lên (`translateY(-100%)`), nửa dưới trượt xuống (`translateY(100%)`) bằng đường cong gia tốc mượt mà `cubic-bezier(0.77, 0, 0.175, 1)`.
       - Sau 950ms khi 2 nửa trượt hoàn toàn ra khỏi khung hình, overlay được tháo dỡ sạch sẽ và kích hoạt callback `onComplete()`.
     - **Tính năng tương tác:**
       - Hỗ trợ Skip tức thì: Nhấp chuột hoặc nhấn phím bất kỳ (Space, Enter, Esc, v.v.) sẽ lập tức chuyển sang hiệu ứng tách màn hình nhanh chóng mà không phải chờ đợi.
  3. **Tạo Kiểu Dáng Đồ Họa CSS ([style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Thêm toàn bộ các lớp tạo hình `.game-intro-overlay`, `.intro-shutter`, `.intro-shutter-top`, `.intro-shutter-bottom`, `.intro-logo-box`, `.intro-logo-outline`, `.intro-logo-color`, `.intro-center-flash`, và `.intro-skip-hint`.
     - **Khắc phục đường lằn ở giữa:** Loại bỏ hoàn toàn đường viền `.intro-seam-line` (trước đó có màu trắng mờ 12% ở mép hai nửa shutter) và đặt `visibility: hidden` cho tia chớp trung tâm khi chưa kích hoạt, đảm bảo màn hình đen tuyền tuyệt đối 100%, liền mạch không tì vết.
  4. **Tích Hợp Khởi Động & Công Cụ Test ([bootstrap.ts](file:///e:/Pokemon/apps/web/src/bootstrap.ts), [game-overlay.ts](file:///e:/Pokemon/apps/web/src/ui/game-overlay.ts)):**
     - Tự động kích hoạt Intro sau khi hoàn tất nạp assets lúc mở game.
     - Bổ sung nút `🎬 Intro` ngay trên thanh Diagnostic Panel (`#btnReplayIntro`) và hàm toàn cục `window.replayIntro()` trong DevTools giúp dễ dàng kiểm tra, phát lại intro nhiều lần mà không cần F5 làm mới trang.
  5. **Kiểm Thử Tự Động ([game-intro.test.ts](file:///e:/Pokemon/apps/web/test/game-intro.test.ts)):**
     - Tạo mới test suite kiểm tra đầy đủ vòng đời: khởi tạo màn tối, tiến trình chuyển màu logo theo thời gian, hiệu ứng tách đôi trên/dưới và cơ chế skip phím/chuột.
     - 23/23 tệp test suite (177/177 bài test) đều **PASS 100%**.

---

### 0.60. Tinh Chỉnh Giao Diện Chiêu Thức Trang Bị: Đẩy Lên 70px & Khớp Trọn Vẹn Asset Nút:

- **Trạng thái:** Đã hoàn thành 100%. 22 tệp test suite (174/174 tests), Typecheck và Schema validation đều đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Đẩy khu vực chiêu thức trang bị lên 70px (thu hẹp khoảng trống lớn với bảng chỉ số và không bị thụt sâu xuống đáy bảng); loại bỏ phần khung hình vuông/chữ nhật màu đen thừa thãi bị lồi ra ngoài so với asset nút chiêu thức.
- **Chi tiết đã thực hiện:**
  1. **Đẩy Khu Vực Chiêu Thức Trang Bị Lên 70px ([style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Đặt `margin-bottom: 70px;` và `margin-top: 14px;` cho `.summary-moves-section`, nhấc toàn bộ cụm chiêu thức trang bị lên 70px, tạo khoảng cách hài hòa, cân đối giữa Bảng Chỉ Số Chiến Đấu và Chiêu Thức Trang Bị thay vì bị dồn xuống đáy bảng.
  2. **Loại Bỏ Khung Vuông Đen Thừa Phía Sau Asset Chiêu Thức ([style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Xóa bỏ `background: rgba(10, 20, 35, 0.95)`, viền đen `border: 1px solid #000000` và `box-shadow` thừa khỏi `.summary-move-slot` khi đã trang bị chiêu thức.
     - Cập nhật `.move-fight-canvas` mở rộng `width: 100%; height: 100%;` kết hợp `filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6))` giúp asset nút `battleFightButtons.png` phủ kín trọn vẹn ô chiêu thức, không còn bất kỳ đường viền đen hay hình vuông nào bị lộ/thừa ra ngoài.
     - Ô trống (`.summary-move-slot.empty`) vẫn giữ nguyên viền nét đứt thanh lịch và chữ `+ Ô trống`.

---

### 0.59. Điều Chỉnh Chỉ Số Cá Thể (IVs 0–31) & Tính Cách Ngẫu Nhiên Cho Pokémon Hoang Dã / Mới Thu Phục:

- **Trạng thái:** Đã hoàn thành 100%. 22 tệp test suite (174/174 tests), Typecheck và Schema validation đều đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Sửa lỗi Pokémon hoang dã mới bắt trong thế giới game luôn có toàn bộ chỉ số IVs đạt tối đa (full 31) và tính cách luôn là Hardy (Neutral). Điều chỉnh lại theo đúng cơ chế Pokémon chuẩn xác.
- **Nguyên nhân cốt lõi phát hiện:**
  - Trong hàm tạo `createPartyPokemon()` ([party-state.ts](file:///e:/Pokemon/apps/web/src/domain/party/party-state.ts)), khi không truyền tham số `options.rng`, hệ thống bị gán mặc định `createDefaultIvs(31)` và tính cách mặc định `'Hardy'`.
  - Khi người chơi bắt thành công Pokémon hoang dã trong trận đấu ([game-session.ts](file:///e:/Pokemon/apps/web/src/game/game-session.ts)), hàm tạo chỉ truyền `{ isShiny }` mà không truyền `rng` hay chỉ số của đấu sĩ hoang dã, dẫn tới tất cả Pokémon thu phục được đều nhận 31/31 điểm ở cả 6 chỉ số IVs.
- **Chi tiết đã thực hiện:**
  1. **Đồng Bộ Cơ Chế Sinh IVs (0–31) & Natures Theo Chuẩn Canonical ([party-state.ts](file:///e:/Pokemon/apps/web/src/domain/party/party-state.ts)):**
     - Sửa mặc định trong `createPartyPokemon`: Khi không chỉ định `options.ivs === 'perfect'`, hệ thống sẽ tự động gieo xúc xắc ngẫu nhiên độc lập từng chỉ số cá thể từ 0 đến 31 (`createRandomIvs(activeRng)`) cho cả 6 chỉ số (HP, Atk, Def, SpA, SpD, Speed).
     - Tính cách (Nature) được chọn ngẫu nhiên đồng đều trong 25 tính cách kinh điển (`ALL_NATURES`), phản ánh chân thực các biến số tăng/giảm +10% / -10% trên bảng chỉ số.
     - Tùy chọn `ivs: 'perfect'` vẫn được duy trì nguyên vẹn phục vụ cho các trường hợp đặc biệt (ví dụ Pokémon huyền thoại hoặc cấu hình riêng).
  2. **Gắn IVs & Natures Ngẫu Nhiên Vào Đấu Sĩ Hoang Dã ([battle-factory.ts](file:///e:/Pokemon/apps/web/src/battle/battle-factory.ts), [types.ts](file:///e:/Pokemon/apps/web/src/battle/types.ts)):**
     - Mở rộng kiểu dữ liệu `BattlerPokemon` mang theo `ivs?: PokemonStatValues` và `nature?: NatureName`.
     - Trong `createBattler`, khi Pokémon hoang dã xuất hiện, hệ thống sinh ngay bộ IVs (0–31) và Tính cách riêng cho cá thể đó (sử dụng `defaultRng` độc lập nhằm bảo toàn chuỗi PRNG trong combat).
  3. **Lưu Giữ Trọn Vẹn Thuộc Tính Khi Thu Phục ([game-session.ts](file:///e:/Pokemon/apps/web/src/game/game-session.ts)):**
     - Khi quăng bóng bắt thành công Pokémon hoang dã (`result.outcome === 'caught'`), Pokémon được thêm vào đội hình hoặc PC sẽ thừa hưởng chính xác bộ `ivs` và `nature` mà người chơi vừa đối đầu trong trận đấu.
  4. **Migration & Fallback ([save-repository.ts](file:///e:/Pokemon/apps/web/src/domain/save/save-repository.ts), [party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts), [storage-screen.ts](file:///e:/Pokemon/apps/web/src/ui/storage-screen.ts)):**
     - Cập nhật hàm nạp save cũ: tự động gieo IVs ngẫu nhiên (0–31) và tính cách ngẫu nhiên thay vì gán cứng 31 và Hardy.
     - Fallback hiển thị UI chuyển từ 31 sang 0 nếu thiếu dữ liệu, ngăn chặn tình trạng hiển thị sai lệch điểm số tối đa.
  5. **Kiểm Thử Tự Động ([pokemon-nature-stats.test.ts](file:///e:/Pokemon/apps/web/test/pokemon-nature-stats.test.ts)):**
     - Bổ sung test kiểm tra xác thực việc sinh ngẫu nhiên IVs trong dải 0–31 và độ đa dạng tính cách trên nhiều mẫu thử.
     - Toàn bộ 22 tệp test suite (174 bài test) đều **PASS 100%**.

---

### 0.58. Nâng Cấp Bảng Chi Tiết Pokémon: Mở Rộng Kích Thước (900x490px), Bỏ Mạng Nhện & Tái Thiết Kế Phối Màu Dịu Mắt (Slate Navy & Soft Pastel):

- **Trạng thái:** Đã hoàn thành 100%. 22 tệp test suite (174/174 tests), Typecheck và Schema validation đều đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Mở rộng bảng giao diện chi tiết ra cho rộng rãi, thoáng đãng; bỏ phần biểu đồ mạng nhện (radar chart) vì thấy thừa; thiết kế lại tông màu của toàn bộ giao diện chi tiết cho dịu mắt, dễ nhìn hơn.
- **Chi tiết đã thực hiện:**
  1. **Mở Rộng Không Gian Bố Cục ([style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Tăng kích thước khung modal `.summary-modal-inner` từ $780 \times 415\text{ px}$ lên $900 \times 490\text{ px}$, tối ưu tỷ lệ responsive (1.15x / 1.0x / 0.88x) cho các kích thước màn hình.
     - Cột bên trái (`.summary-left`) mở rộng lên $205\text{ px}$. Khung ảnh sprite Pokémon tăng từ $104\text{ px}$ lên $120\text{ px}$ (sprite canvas $110 \times 110\text{ px}$), hiển thị Pokémon sắc nét và hoành tráng.
     - Khu vực chiêu thức (`.summary-moves-section`) mở rộng chiều cao thẻ chiêu thức từ $38\text{ px}$ lên $46\text{ px}$, khoảng cách lưới $7\text{ px}$, nhãn Type Badge và PP hiển thị rõ ràng, thoáng đãng.
  2. **Loại Bỏ Hoàn Toàn Thành Phần Mạng Nhện Thừa ([party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts), [storage-screen.ts](file:///e:/Pokemon/apps/web/src/ui/storage-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Gỡ bỏ hoàn toàn thanh tab chuyển đổi (`📊 BẢNG` / `🕸️ MẠNG NHỆN`), các nút chọn chế độ radar và canvas mạng nhện khỏi cả Party Screen và PC Storage Screen.
     - Dọn dẹp state và event listeners thừa, bảng chỉ số chiến đấu được ưu tiên hiển thị toàn bộ 100% không gian tab chỉ số một cách tập trung, trực quan.
  3. **Tái Thiết Kế Phối Màu Dịu Mắt & Sang Trọng (Slate Navy & Soft Pastel):**
     - **Tông nền modal:** Chuyển sang gradient đêm trầm dịu mắt `linear-gradient(180deg, #162032 0%, #0d1522 100%)` với viền mềm `#334155` và hiệu ứng đổ bóng mờ ảo, không gây chói mắt khi nhìn lâu.
     - **Khung thông tin phụ (`.summary-meta-box`):** Nền slate sẫm trong suốt `rgba(15, 23, 42, 0.75)`, tên tính cách tô vàng ấm `#fbbf24`, hiệu ứng tăng/giảm chỉ số màu xanh băng dịu `#38bdf8`.
     - **Bảng chỉ số 5 cột (`.summary-stats-table`):**
       - Tiêu đề bảng: Chữ xám sáng `#94a3b8` viền đáy mảnh thanh lịch.
       - Tên chỉ số: Chỉ số tăng bởi tính cách (+10%) có icon `▲` màu đỏ san hô `#f87171`; chỉ số giảm (-10%) có icon `▼` màu xanh ngọc `#38bdf8`.
       - Thanh đo chỉ số (Stat Bars): Phối màu Pastel mềm mại hài hòa (HP: Lục bảo `#10b981`, Atk: San hô ấm `#f43f5e`, Def: Xanh biển `#3b82f6`, Sp.Atk: Tím oải hương `#a855f7`, Sp.Def: Vàng hổ phách `#eab308`, Speed: Mòng két `#06b6d4`).
       - Cột IVs (0–31): Điểm tối đa 31 được làm nổi bật với màu vàng ánh kim `#facc15` rực rỡ.
       - Cột EVs (0–252): Điểm đã luyện làm nổi bật màu xanh bạc hà `#34d399`.
       - Dòng chân bảng: `Tổng nỗ lực (EVs): [Tổng] / 510` hiển thị gọn gàng, trang nhã.
  4. **Kiểm Thử & Đảm Bảo Tính Toàn Vẹn:**
     - Toàn bộ 22 tệp test suite (173 bài test) đều **PASS 100%**.
     - TypeScript compiler check pass 0 lỗi.

---

### 0.57. Kiến Trúc Sự Kiện Trận Đấu Có Cấu Trúc (Structured Battle Events System - Step 6 Chuẩn Hóa Chuỗi Sự Kiện Mạng PvP):

- **Trạng thái:** Đã hoàn thành 100% Bước 6 theo lộ trình kiến trúc. 21 tệp test suite (169/169 tests) và TypeScript check đạt kết quả **PASS 100%**.
- **Mục tiêu kiến trúc:** Thay thế hoàn toàn cơ chế phụ thuộc vào phân tích chuỗi văn bản (`TurnResult.message`) bằng các đối tượng sự kiện nguyên tử, định kiểu chặt chẽ (`BattleEvent[]`), tương thích trực tiếp với các khung gói tin WebSocket định nghĩa trong [docs/09-network-protocol.md](file:///e:/Pokemon/docs/09-network-protocol.md) phục vụ tính năng LAN PvP N2.
- **Chi tiết đã thực hiện:**
  1. **Định Nghĩa Schema Sự Kiện Cấp Core ([battle-events.ts](file:///e:/Pokemon/packages/shared-types/battle-events.ts), [index.ts](file:///e:/Pokemon/packages/shared-types/index.ts)):**
     - Xây dựng 20 kiểu sự kiện strongly-typed trong union `BattleEvent`:
       - Khởi động lượt: `move_declared` (bên tấn công, tên đấu sĩ, moveId, moveName).
       - Nạp năng lượng & Độn thổ: `charge_begin` (hấp thụ ánh sáng, nạp lực), `semi_invulnerable_enter` (bay lên trời `flying`, độn thổ `underground`, lặn sâu `underwater`, nhảy cao `high`).
       - Khiên & Bất khả xâm phạm: `protect_activated` (tự bảo vệ thành công/thất bại), `protect_blocked` (chặn đứng đòn đánh), `semi_invulnerable_miss` (đòn đánh trượt do mục tiêu đang bay/độn thổ).
       - Né tránh & Miễn nhiễm: `accuracy_miss` (đòn đánh trượt theo độ chính xác), `type_immune` (miễn nhiễm theo bảng hệ).
       - Trạng thái cản trở: `recharge_hindered` (phải nghỉ lượt nạp năng lượng), `status_hindered` (ngủ say, đóng băng, tê liệt không thể cử động), `status_cured` (tỉnh giấc, tan băng).
       - Sát thương & Chuỗi đòn: `damage_dealt` (sát thương, lượng máu còn lại, tỷ lệ khắc hệ, chí mạng, số đòn trúng), `multi_hit_completed` (hoàn tất chuỗi đòn liên hoàn với tổng số lần đánh trúng `hitsCount`).
       - Phục hồi & Phản đòn: `hp_restored` (hồi máu qua chiêu thức, hút máu, vật phẩm, ký sinh), `recoil_damage` (tổn thương phản lực do đòn đánh va chạm).
       - Chỉ số & Hiệu ứng phụ: `stat_stage_changed` (tăng/giảm bậc chỉ số từ -6 đến +6), `status_inflicted` (nhiễm bỏng, độc, tê liệt, ngủ...).
       - Hạ gục & Kéo theo: `fainted` (đấu sĩ ngất xỉu khi HP về 0), `destiny_bond_triggered` (kéo đối thủ ngất xỉu theo khi bị hạ gục).
       - Cuối lượt: `end_turn_damage` (sát thương cuối lượt do bỏng, trúng độc, độc cực mạnh hoặc hạt giống ký sinh).
  2. **Tích Hợp Vào Battle Engine ([battle-engine.ts](file:///e:/Pokemon/apps/web/src/battle/battle-engine.ts), [types.ts](file:///e:/Pokemon/apps/web/src/battle/types.ts)):**
     - Mở rộng giao diện `TurnResult` và `EndTurnResult` bổ sung trường `events: BattleEvent[]`.
     - Giữ nguyên `message` và `damage` để duy trì tính tương thích ngược 100% với hệ thống giao diện, Text Overlay và các bài test hiện có.
     - Toàn bộ các nhánh logic trong `executeAttack` và `applyEndTurnEffects` đều tự động tạo và thu thập các `BattleEvent` theo đúng trình tự thời gian xảy ra hành động.
  3. **Bộ Kiểm Thử Độc Lập Cho Sự Kiện ([battle-events.test.ts](file:///e:/Pokemon/apps/web/test/battle-events.test.ts)):**
     - Xây dựng bộ 8 unit tests chuyên sâu kiểm chứng:
       - Trình tự sinh sự kiện chuẩn xác: `move_declared` -> `damage_dealt` -> `fainted`.
       - Kích hoạt khiên và chặn đòn: `protect_activated` -> `protect_blocked`.
       - Lượt nghỉ sau chiêu mạnh: `recharge_hindered` sau khi dùng Hyper Beam.
       - Trạng thái bán bất khả xâm phạm: `semi_invulnerable_enter` và `semi_invulnerable_miss` khi mục tiêu bay lên trời.
       - Chuỗi đòn nhiều lần: `multi_hit_completed` với `hitsCount` chính xác.
       - Thay đổi bậc chỉ số: `stat_stage_changed` với delta và stage chính xác.
       - Hạ gục đối thủ: `fainted` khi HP = 0.
       - Sát thương cuối lượt: `end_turn_damage` do bỏng/độc trong `applyEndTurnEffects`.
     - Toàn bộ 21 tệp test suite (169 bài test) đều **PASS 100%**.

---
- **Yêu cầu người dùng:** Triển khai đầy đủ chiêu thức 2 lượt, lượt nghỉ sau chiêu mạnh, Protect/Detect, multi-hit, xử lý các chiêu power=0 còn lại, và thống nhất 100% hội thoại trận đấu sang Tiếng Việt không còn lẫn lộn Anh - Việt.
- **Chi tiết đã thực hiện:**
  1. **Cơ Chế Chiêu Thức 2 Lượt (2-Turn Moves & Semi-Invulnerability) ([battle-engine.ts](file:///e:/Pokemon/apps/web/src/battle/battle-engine.ts)):**
     - **Nhóm Semi-Invulnerable (Bán bất khả xâm phạm):**
       - `Fly`: Lượt 1 bay vút lên không trung (`semiInvulnerable: 'flying'`). Miễn nhiễm hầu hết mọi đòn tấn công (chỉ trúng bởi Gust, Thunder, Twister, Sky Uppercut, Hurricane, Smack Down). Lượt 2 lao xuống tấn công.
       - `Dig`: Lượt 1 đào sâu vào lòng đất (`semiInvulnerable: 'underground'`). Chỉ trúng bởi Earthquake, Magnitude, Fissure. Lượt 2 trồi lên tấn công.
       - `Dive`, `Bounce`, `Shadow Force`, `Phantom Force`: Lặn dưới nước, bật nhảy lên cao hoặc biến mất vào bóng tối ở lượt 1, tung đòn ở lượt 2.
     - **Nhóm Nạp Năng Lượng (Charging Moves):**
       - `Solar Beam`: Lượt 1 hấp thụ ánh sáng mặt trời, lượt 2 bắn luồng sáng rực rỡ.
       - `Skull Bash`: Lượt 1 thu đầu vào tăng +1 Phòng thủ (`statStages.defense + 1`), lượt 2 húc đầu cực mạnh.
       - `Sky Attack`, `Razor Wind`, `Geomancy`: Nạp năng lượng ở lượt đầu, tung chiêu hủy diệt ở lượt sau.
  2. **Cơ Chế Lượt Nghỉ Sau Đòn Cực Mạnh (Recharge Turn Moves) ([battle-engine.ts](file:///e:/Pokemon/apps/web/src/battle/battle-engine.ts)):**
     - Áp dụng cho: `Hyper Beam`, `Giga Impact`, `Frenzy Plant`, `Blast Burn`, `Hydro Cannon`, `Roar of Time`, `Rock Wrecker`.
     - Sau khi tung đòn thành công, Pokémon nhận cờ `mustRecharge = true`.
     - Ở lượt tiếp theo, Pokémon không thể ra chiêu, hiển thị thông báo: `"[Tên] phải nạp lại năng lượng và không thể cử động!"` và giải phóng trạng thái nạp.
  3. **Lá Chắn Tuyệt Đối (Protect & Detect) ([battle-engine.ts](file:///e:/Pokemon/apps/web/src/battle/battle-engine.ts)):**
     - Độ ưu tiên Priority +4 (luôn kích hoạt trước đòn tấn công đối thủ).
     - Chặn 100% sát thương và hiệu ứng của đòn tấn công nhắm vào người dùng trong lượt đó.
     - Cơ chế giảm tỷ lệ thành công khi dùng liên tiếp chuẩn Pokémon chính thức: Lần 1: 100%, Lần 2: 50%, Lần 3: 25%, Lần 4: 12.5%... Khi dùng chiêu thức khác sẽ reset lại 100%.
     - Hỗ trợ phá khiên bằng các chiêu xuyên thủng: `Feint`, `Shadow Force`, `Phantom Force`.
  4. **Chuỗi Đòn Tấn Công Liên Hoàn (Multi-Hit Moves) ([battle-engine.ts](file:///e:/Pokemon/apps/web/src/battle/battle-engine.ts)):**
     - Đòn đánh 2 lần: `Double Kick`, `Twineedle`, `Bonemerang`, `Dual Chop`, `Gear Grind`, `Dragon Darts`.
     - Đòn đánh 2–5 lần: `Double Slap`, `Fury Swipes`, `Comet Punch`, `Bullet Seed`, `Pin Missile`, `Rock Blast`, `Tail Slap`, `Water Shuriken`, `Icicle Spear`, `Arm Thrust`, `Bone Rush`, `Spike Cannon`, `Barrage`, `Fury Attack`.
     - Tính toán chuẩn xác số lần đánh trúng thực tế và thông báo Tiếng Việt: `"Đánh trúng X lần!"`.
  5. **Xử Lý Toàn Diện 29+ Chiêu Thức Power = 0 & Sát Thương Động ([battle-engine.ts](file:///e:/Pokemon/apps/web/src/battle/battle-engine.ts)):**
     - Sát thương cố định: `Seismic Toss` & `Night Shade` (gây sát thương đúng bằng Level người dùng), `Dragon Rage` (40 HP), `Sonic Boom` (20 HP).
     - Sát thương % HP: `Super Fang`, `Nature's Madness`, `Ruination` (cắt 50% HP hiện tại), `Guardian of Alola` (75% HP hiện tại), `Endeavor` (rút máu đối thủ bằng đúng HP người dùng).
     - Hi sinh ngất xỉu: `Final Gambit` (gây sát thương bằng HP người dùng và người dùng ngất xỉu).
     - Chiêu thức theo tỷ lệ tốc độ: `Electro Ball` (40..150 power theo tỷ lệ tốc độ), `Gyro Ball` (lên đến 150 power dựa trên độ chênh lệch tốc độ đối thủ).
     - Chiêu thức cân nặng & HP: `Low Kick`, `Grass Knot`, `Heavy Slam`, `Heat Crash`, `Crush Grip`, `Wring Out`, `Hard Press`.
     - Chiêu thức biến số ngẫu nhiên: `Magnitude` (Địa chấn cấp 4 đến 10), `Present` (tặng quà gây 40/80/120 damage hoặc hồi 25% HP đối thủ).
     - Chiêu thức phản đòn & đòn đặc biệt: `Counter`, `Mirror Coat`, `Metal Burst`, `Bide`, `Trump Card`, `Punishment`.
     - Chiêu trạng thái đặc thù:
       - `Belly Drum`: Hi sinh 50% max HP để tối đa hóa Tấn công (+6 stages).
       - `Pain Split`: Cộng dồn HP của 2 bên chia đôi bằng nhau.
       - `Destiny Bond`: Nếu người dùng bị hạ gục trong lượt, đối thủ cũng bị kéo ngất xỉu theo.
       - `Leech Seed`: Gieo hạt ký sinh hút 1/8 HP mỗi cuối lượt hồi phục cho người dùng.
       - `Haze` & `Clear Smog`: Xóa sạch toàn bộ thay đổi chỉ số của 2 bên về 0.
       - `Splash`: Thông báo chuẩn `"Nhưng không có gì xảy ra cả!"`.
  6. **Đồng Bộ & Thống Nhất 100% Hội Thoại Trận Đấu Sang Tiếng Việt:**
     - Loại bỏ toàn bộ từ ngữ tiếng Anh chắp vá trong trận đấu:
       - Xuất hiện & Triệu hồi: `"[Tên] hoang dã xuất hiện!"`, `"Tiến lên! [Tên]!"`, `"[Tên], quay lại!"`.
       - Ngất xỉu: `"[Tên] hoang dã đã ngất xỉu!"`, `"[Tên] đã ngất xỉu!"`.
       - Kinh nghiệm: `"[Tên] nhận được X EXP!"`.
       - Trạng thái cản trở: `"đang ngủ say!"`, `"đã tỉnh giấc!"`, `"đã tan băng!"`, `"bị đóng băng cứng đờ!"`, `"bị tê liệt hoàn toàn! Không thể cử động!"`.
       - Né đòn & Trúng đòn: `"Nhưng đã trượt!"`, `"Không có tác dụng lên [Tên]!"`, `"Đòn đánh cực kỳ hiệu quả!"`, `"Đòn đánh không mấy hiệu quả..."`, `"Đòn chí mạng!"`.
       - Tổn thương cuối lượt: `"bị tổn thương bởi vết bỏng!"`, `"bị tổn thương bởi chất độc!"`, `"bị tổn thương bởi độc cực mạnh!"`.
       - Hồi phục & Hút máu: `"HP của [Tên] đã đầy!"`, `"đã hồi phục HP!"`, `"bị hút cạn sinh lực!"`, `"bị phản lực tổn thương!"`.
       - Thay đổi chỉ số: `"Chỉ số Tấn công/Phòng thủ/Tốc độ... tăng mạnh / tăng lên / giảm xuống / giảm mạnh"`.
       - Chạy trốn: `"Đã chạy trốn an toàn!"`, `"Không thể chạy trốn!"`.
       - Giao diện Text Overlay: `"Bạn muốn [Tên] làm gì?"`, `"BÓNG POKÉ: xX"`, nút `"⚾ NÉM BÓNG"`, `"QUAY LẠI"`.
  7. **Kiểm Thử Toàn Diện ([battle-advanced-moves.test.ts](file:///e:/Pokemon/apps/web/test/battle-advanced-moves.test.ts)):**
     - Viết bộ 13 bài test chuyên sâu kiểm tra: Solar Beam 2 lượt, Skull Bash tăng thủ, Fly bay lên né đòn, Dig độn thổ né đòn, Hyper Beam nghỉ lượt, Protect chặn đòn và priority +4, Double Kick 2 hit, Double Slap 2..5 hit, Seismic Toss sát thương bằng level, Super Fang cắt 50% HP, Belly Drum hi sinh HP max attack, Pain Split chia đôi HP, Destiny Bond kéo đối thủ ngất theo.
     - Toàn bộ 20 test suite (161 bài test) đều **PASS 100%**.

---

## Cập nhật trước đó: 2026-10-08 (Hệ Thống Tính Cách 25 Natures, Chỉ Số Lõi IVs/EVs, Động Cơ Vật Phẩm Hướng Dữ Liệu & Đường Cong Kinh Nghiệm EXP Chuẩn)

### 0.55. Chuẩn Hóa Hệ Thống Tính Cách (25 Natures), Chỉ Số Lõi IVs/EVs, Động Cơ Vật Phẩm Hướng Dữ Liệu & 6 Đường Cong Kinh Nghiệm EXP Chuẩn:

- **Trạng thái:** Đã hoàn thành 100% Bước 1, Bước 2, Bước 3, Bước 4 theo lộ trình kiến trúc. 19 tệp test suite (148/148 tests) và TypeScript check đạt kết quả **PASS 100%**.
- **Yêu cầu & Mục tiêu thực hiện:**
  - **Bước 1**: Chuẩn hóa công thức chỉ số cốt lõi từ `(base, level, ivs, evs, nature)`. Tích hợp đầy đủ bảng 25 Tính cách (Natures) chính thức của Pokémon kèm hệ số 1.1x / 0.9x / 1.0x, IVs (0..31), EVs (0..252/chỉ số, tối đa 510 tổng). Nâng cấp save migration lên phiên bản 2 (`CURRENT_SAVE_VERSION = 2`).
  - **Bước 2**: Chuẩn hóa dược phẩm theo Gen 7 (Super Potion 60 HP, Hyper Potion 120 HP), Vitamin tăng EV có trần (252 EV/stat, 510 total EV), Rare Candy đồng bộ cơ chế lên cấp thống nhất, Dire Hit tăng bậc crit (+2 stages), Ice Heal, X-Accuracy, chặn cap +6 stages, sửa lỗi mất `heldItem` (lưu bằng `rawId`) và hái Berries cộng vào balo.
  - **Bước 3**: Chuyển đổi toàn diện cơ chế vật phẩm sang **Data-Driven Item Engine** (`ITEM_EFFECTS_REGISTRY`), xóa bỏ 4 chuỗi `if-else` lặp lại giữa Overworld và Battle, trả về mã kết quả có cấu trúc (`ItemResultCode`).
  - **Bước 4**: Tích hợp 6 đường cong kinh nghiệm chuẩn (`Fast`, `Medium Fast`, `Medium Slow`, `Slow`, `Erratic`, `Fluctuating`), tính toán chính xác mốc EXP cấp 100 và công thức EXP Yield Gen 7 `floor((b * L) / 7)`.
- **Chi tiết đã thực hiện:**
  1. **Bảng 25 Tính Cách & Kiểu Dữ Liệu Mới ([shared-types/pokemon.ts](file:///e:/Pokemon/packages/shared-types/pokemon.ts)):**
     - Bổ sung `StatKey`, `StatKeyWithoutHp`, `PokemonStatValues`, `NatureName`, `NatureData`, `NATURES_TABLE`: đầy đủ 25 tính cách (Hardy, Lonely, Brave, Adamant, Naughty, Bold, Docile, Relaxed, Impish, Lax, Timid, Hasty, Serious, Jolly, Naive, Modest, Mild, Quiet, Bashful, Rash, Calm, Gentle, Sassy, Careful, Quirky) với tên tiếng Việt và chỉ số tăng/giảm.
  2. **Động Cơ Tính Chỉ Số Lõi ([pokemon-stats.ts](file:///e:/Pokemon/apps/web/src/domain/party/pokemon-stats.ts)):**
     - Triển khai công thức Gen 3-7 chuẩn:
       - HP: $\lfloor\frac{(2 \times \text{Base} + \text{IV} + \lfloor\text{EV}/4\rfloor) \times \text{Level}}{100}\rfloor + \text{Level} + 10$ (Shedinja cố định = 1).
       - Khác: $\lfloor(\lfloor\frac{(2 \times \text{Base} + \text{IV} + \lfloor\text{EV}/4\rfloor) \times \text{Level}}{100}\rfloor + 5) \times \text{NatureMult}\rfloor$.
     - Hàm `addEffortValues` thực thi giới hạn trần: tối đa 252 EV cho một chỉ số và 510 EV tổng cộng.
  3. **Mở Rộng PartyPokemon & Save Migration v2 ([party-state.ts](file:///e:/Pokemon/apps/web/src/domain/party/party-state.ts), [save-state.ts](file:///e:/Pokemon/apps/web/src/domain/save/save-state.ts), [save-repository.ts](file:///e:/Pokemon/apps/web/src/domain/save/save-repository.ts)):**
     - Bổ sung `ivs`, `evs`, `nature` vào giao diện `PartyPokemon`.
     - Nâng `CURRENT_SAVE_VERSION` lên `2`. Thêm hàm `migrateSaveV1ToV2` tự động bù đắp IV 31, EV 0, Hardy cho các file save cũ v1.
  4. **Động Cơ Vật Phẩm Khai Báo Dữ Liệu ([item-catalog-effects.ts](file:///e:/Pokemon/apps/web/src/domain/inventory/item-catalog-effects.ts), [item-effects.ts](file:///e:/Pokemon/apps/web/src/domain/inventory/item-effects.ts)):**
     - Gom nhóm toàn bộ Dược phẩm Gen 7 (Potion 20, Super 60, Hyper 120, Max 9999), Quả mọng (Oran 10, Sitrus 25% max HP), Hồi sinh (Revive 50%, Max Revive 100%), Trị trạng thái, Vitamin (tăng 10 EV), Rare Candy, Vật phẩm trận đấu (X Attack, Dire Hit...) vào bảng khai báo `ITEM_EFFECTS_REGISTRY`.
     - Thay thế toàn bộ chuỗi `if-else` cũ bằng bảng tra cứu declarative, trả về mã kết quả có cấu trúc (`SUCCESS`, `ERR_FAINTED`, `ERR_HP_FULL`, `ERR_EV_STAT_MAX`, v.v.).
  5. **Động Cơ Kinh Nghiệm & Đường Cong EXP Chuẩn ([pokemon-exp.ts](file:///e:/Pokemon/apps/web/src/domain/pokemon/pokemon-exp.ts)):**
     - Triển khai 6 công thức chuẩn cho 6 nhóm tốc độ tăng trưởng:
       - Fast (800,000 EXP tại Lv.100)
       - Medium Fast (1,000,000 EXP tại Lv.100)
       - Medium Slow (1,059,860 EXP tại Lv.100)
       - Slow (1,250,000 EXP tại Lv.100)
       - Erratic (600,000 EXP tại Lv.100)
       - Fluctuating (1,640,000 EXP tại Lv.100)
     - Kết nối tính toán `maxExp` tự động trong `createPartyPokemon`, `recalculatePartyPokemonStats`, `syncBattleResult`, và `battle-factory.ts`.
     - Tích hợp công thức EXP Yield Gen 7 chuẩn: $\lfloor\frac{b \times L}{7}\rfloor$.
  6. **Sửa Lỗi Ngoại Vi & Kiểm Thử:**
     - Sửa lỗi `heldItem` lưu tên tiếng Việt khiến mất item khi gỡ, lưu chuẩn `rawId` ([bag-screen.ts](file:///e:/Pokemon/apps/web/src/ui/bag-screen.ts)).
     - Sửa lỗi hái Berry chín không cộng vào túi đồ ([berry-panel.ts](file:///e:/Pokemon/apps/web/src/ui/berry-panel.ts)).
     - Tích hợp thuộc tính `critStage` và Dire Hit vào công thức tính chí mạng Gen 7 ([battle-engine.ts](file:///e:/Pokemon/apps/web/src/battle/battle-engine.ts)).
     - Viết 2 bộ test mới: [pokemon-nature-stats.test.ts](file:///e:/Pokemon/apps/web/test/pokemon-nature-stats.test.ts) và [pokemon-exp.test.ts](file:///e:/Pokemon/apps/web/test/pokemon-exp.test.ts). Toàn bộ 19 tệp kiểm thử (148 bài tests) và TypeScript check đều vượt qua hoàn hảo.

---

## Cập nhật trước đó: 2026-10-07 (Logic Vật Phẩm Thực Tế & Khấu Trừ Số Lượng Balo)

### 0.54. Xây Dựng Hệ Thống Tác Dụng Vật Phẩm Thực Tế & Tự Động Trừ Số Lượng Trong Balo (Item Effects Engine & Inventory Consumption):

- **Trạng thái:** Đã hoàn thành 100% theo yêu cầu của người dùng.
- **Yêu cầu người dùng:** Làm logic vật phẩm thực tế trong balo; hiện tại các vật phẩm dùng được nhưng không bị trừ số lượng, cần kiểm tra và điều chỉnh toàn diện.
- **Chi tiết đã thực hiện:**
  1. **Động Cơ Hiệu Ứng Vật Phẩm Thực Tế ([item-effects.ts](file:///e:/Pokemon/apps/web/src/domain/inventory/item-effects.ts)):**
     - Xây dựng module `item-effects.ts` đóng gói toàn bộ quy tắc kiểm tra điều kiện (`canUseItemOnPartyPokemon`, `canUseItemOnBattler`) và thực thi tác dụng thực tế (`applyItemToPartyPokemon`, `applyItemToBattler`):
       - **Nhóm Hồi Phục Máu HP:** Hỗ trợ đầy đủ Dược phẩm & Quả mọng (`Potion`, `Super Potion`, `Hyper Potion`, `Max Potion`, `Fresh Water`, `Soda Pop`, `Lemonade`, `Moomoo Milk`, `Berry Juice`, `Oran Berry`, `Sitrus Berry`, các loại quả mọng pinch berries...). Chỉ dùng được khi Pokémon còn sống và chưa đầy máu.
       - **Nhóm Hồi Sinh:** `Revive`, `Max Revive`, `Revival Herb`. Chỉ dùng được khi Pokémon đã ngất xỉu (`isFainted` hoặc `currentHp <= 0`), hồi sinh với 50% hoặc 100% max HP.
       - **Nhóm Chữa Bệnh Trạng Thái:** `Antidote` & `Pecha Berry` (trị Độc), `Awakening` & `Chesto Berry` (trị Ngủ), `Parlyz Heal` & `Cheri Berry` (trị Tê Liệt), `Burn Heal` & `Rawst Berry` (trị Bỏng), `Ice Heal` & `Aspear Berry` (trị Đóng Băng), `Full Heal`, `Lum Berry`, `Lava Cookie`... (trị mọi trạng thái), và `Full Restore` (hồi 100% HP kèm giải mọi trạng thái).
       - **Nhóm Thăng Cấp & Chỉ Số:** `Rare Candy` thăng 1 cấp (+1 Level, cập nhật lại Max HP, current HP, stats và EXP lên cấp kế), các loại Vitamin (`HP Up`, `Protein`, `Iron`, `Calcium`, `Zinc`, `Carbos`) tăng vĩnh viễn chỉ số stats tương ứng.
       - **Nhóm Hồi Phục PP:** `Ether`, `Max Ether`, `Elixir`, `Max Elixir`, `Leppa Berry` hồi điểm PP cho các chiêu thức bị hao hụt.
       - **Nhóm Vật Phẩm Trận Đấu (Battle Items):** `X Attack`, `X Defend`, `X Speed`, `X Sp. Atk`, `X Sp. Def` tăng bậc chỉ số tạm thời (+2 stages) cho Pokémon đang ra trận.
  2. **Giao Diện Chọn Pokémon Dùng / Trao Đồ Chuẩn Pixel Art Trong Balo ([bag-screen.ts](file:///e:/Pokemon/apps/web/src/ui/bag-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Thay vì gán cứng chỉ dùng cho con đầu đội hình (Leader), giờ đây khi bấm **DÙNG** hoặc **CHO GIỮ** ngoài bản đồ, hệ thống sẽ mở hộp thoại Pixel Art `#bagPartyPickerModal` hiển thị trực quan toàn bộ 6 Pokémon trong đội hình:
       - Mini icon Pokémon, Tên/Nickname, Level (`Lv.X`), Giới tính ♂/♀.
       - Thanh máu HP trực quan kèm số lượng máu thực (`HP/MaxHP`) và màu sắc động (xanh/vàng/đỏ) hoặc nhãn đỏ `FNT` nếu đã ngất xỉu.
       - Nhãn trạng thái bất thường (`ĐỘC`, `LIỆT`, `BỎNG`, `NGỦ`, `BĂNG`).
       - Thông tin vật phẩm đang nắm giữ (`heldItem`) nếu có.
     - **Cơ Chế Trừ Số Lượng Tuyệt Đối Chính Xác:**
       - Khi sử dụng thành công: Tự động trừ đúng 1 vật phẩm khỏi túi qua `inventoryService.removeItem(entry.rawId, 1)`, phát âm thanh `Battle catch click.ogg`, hiển thị Toast thông báo kết quả chi tiết và tự động làm mới giao diện Balo (nếu vật phẩm về 0 sẽ tự xóa khỏi danh sách).
       - Khi vật phẩm không có tác dụng (ví dụ đã đầy máu, chưa ngất xỉu, không bị trúng độc, đã đạt Lv 100): Cảnh báo rõ ràng và **KHÔNG HỀ TRỪ SỐ LƯỢNG VẬT PHẨM**!
     - Khi chọn **CHO GIỮ**: Cho phép chọn Pokémon trong đội hình để trao đồ, nếu Pokémon đang cầm đồ cũ thì đồ cũ sẽ được trả lại túi đồ an toàn trước khi gán đồ mới.
  3. **Khấu Trừ Vật Phẩm Trong Trận Đấu ([battle-controller.ts](file:///e:/Pokemon/apps/web/src/battle/battle-controller.ts)):**
     - **Bóng bắt (Poké Balls):** Khi huấn luyện viên chọn ném bất kỳ loại bóng nào (`Poké Ball`, `Great Ball`, `Ultra Ball`, `Master Ball`...), hệ thống kiểm tra và trừ ngay 1 quả bóng tương ứng trong kho `inventoryService.removeItem(ballId, 1)`. Nếu hết bóng sẽ thông báo không còn bóng và ngăn ném lậu.
     - **Dược phẩm & Tăng chỉ số trong trận:** Khi sử dụng thuốc hoặc vật phẩm tăng chỉ số trong trận đấu, kiểm tra điều kiện áp dụng lên `playerPokemon` và khấu trừ chính xác 1 vật phẩm khỏi kho đồ.
  4. **Kiểm Thử Độc Lập & Toàn Diện ([item-effects.test.ts](file:///e:/Pokemon/apps/web/test/item-effects.test.ts)):**
     - Viết bộ 8 bài test chuyên sâu kiểm tra: Potion hồi máu, Revive hồi sinh, Antidote chữa độc, Rare Candy thăng cấp, Vitamin tăng chỉ số, Ether hồi PP, cơ chế trừ số lượng kho khi dùng và trong trận đấu.
     - Toàn bộ 17 tệp kiểm thử (136/136 tests) và TypeScript check (`npm run typecheck:web`) đều đạt kết quả **PASS 100%**.

---

### 0.53. Điều Chỉnh Tương Tác Party Map HUD: Triệu Hồi Pokémon Đi Theo (Follower) Thay Vì Chuyển Sang Màn Hình Party:

- **Trạng thái:** Đã hoàn thành 100% theo yêu cầu của người dùng.
- **Yêu cầu người dùng:** Điều chỉnh lại tương tác khi nhấp vào thẻ Pokémon trên Party Map HUD (`#partyMapHud`): không chuyển sang màn hình Party (`PartyScreen`) nữa, mà dùng hành động nhấp chuột để gọi ra Pokémon đó đi theo sau lưng nhân vật (Follower Pokémon) ngoài bản đồ thế giới mở (Overworld).
- **Chi tiết đã thực hiện:**
  1. **Loại Bỏ Mở Party Screen Khỏi Party Map HUD ([party-map-hud.ts](file:///e:/Pokemon/apps/web/src/ui/party-map-hud.ts)):**
     - Gỡ bỏ hoàn toàn `togglePartyScreen()` khi click vào các thẻ Pokémon trên thanh HUD mép phải bản đồ.
     - Thay thế bằng callback `onFollowerSelect(pokemon, slotIndex)` truyền qua phương thức `setFollowerHandler` hoặc hàm `initPartyMapHud(...)`.
  2. **Nâng Cấp Thực Thể Follower Hỗ Trợ Đa Loài & Shiny ([follower.ts](file:///e:/Pokemon/apps/web/src/entities/follower.ts)):**
     - Bổ sung các thuộc tính `speciesKey`, `isShiny`, `nickname`, `visible` vào thực thể `Follower`.
     - Thêm phương thức `setPokemon(speciesKey, isShiny, nickname)` cho phép chuyển đổi tức thì loài Pokémon đang đi theo.
  3. **Đồ Họa & Hoạt Ảnh Follower Động ([character-renderer.ts](file:///e:/Pokemon/apps/web/src/rendering/character-renderer.ts)):**
     - Nâng cấp `collectFollower(...)` tự động nạp spritesheet $256 \times 256\text{ px}$ (lưới $4 \times 4$ frame $64 \times 64$) trực tiếp từ thư mục `Graphics/Characters/Followers/${speciesKey}.png` (hoặc `Followers shiny/` nếu là dạng Shiny).
     - Khi Pokémon đi theo là dạng Shiny:
       - Hiệu ứng vầng hào quang vàng óng ánh (Radial Glow Aura) dưới bóng chân xoay nhịp nhàng theo thời gian thực.
       - Cụm 4 ngôi sao vàng óng xoay tròn lấp lánh quanh thân (`drawOverworldShinySparkles`).
  4. **Quản Lý Trạng Thái Follower Trong Party ([party-service.ts](file:///e:/Pokemon/apps/web/src/domain/party/party-service.ts)):**
     - Thêm các phương thức `getActiveFollowerUid()`, `setActiveFollowerUid(uid)`, `getActiveFollower()`.
     - Mặc định khi khởi động game, Pokémon đầu tiên trong đội hình được chỉ định làm Follower đồng bộ.
  5. **Âm Thanh & Thông Báo Sinh Động ([battle-se.ts](file:///e:/Pokemon/apps/web/src/audio/battle-se.ts), [bootstrap.ts](file:///e:/Pokemon/apps/web/src/bootstrap.ts)):**
     - Xây dựng phương thức `playFollowerSummon(speciesKey, isShiny)`: phát âm thanh mở bóng `Battle recall.ogg`, tiếp nối là tiếng kêu Cry của loài Pokémon từ `Audio/Cries/${speciesKey}.ogg`, và tiếng chuông lấp lánh `Shiny sparkle.ogg` nếu là Shiny.
     - Khi nhấp vào thẻ Pokémon trên Party Map HUD:
       - Nếu Pokémon bị ngất (`isFainted` hoặc `currentHp <= 0`): Hiển thị Toast cảnh báo `⚠️ [Tên] đã kiệt sức, không thể đi theo bạn!`.
       - Nếu con đó đang đi theo: Phát tiếng kêu vui vẻ và hiển thị `💖 [Tên] đang vui vẻ đi theo bạn!`.
       - Nếu chọn con mới: Chuyển đổi Follower ngay tức thì trên bản đồ, phát âm thanh và hiển thị Toast `✨ Đã gọi [Tên] (Lv.X) đi theo bạn!`.
  6. **Hiệu Ứng Trực Quan Trên Party Map HUD ([party-map-hud.ts](file:///e:/Pokemon/apps/web/src/ui/party-map-hud.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Thẻ của Pokémon đang đi theo được gán lớp `.is-following` với hiệu ứng viền phát sáng cyan neon (`drop-shadow(0 0 6px rgba(0, 240, 255, 0.75))`) và hơi dịch nhẹ sang trái.
     - Hiển thị huy hiệu pixelated `🐾 ĐANG THEO` tại góc trên thẻ.
     - Tooltip chuyển thành: `[Tên] (Lv.X) - HP: A/B [🐾 Đang đi theo bạn]` (hoặc `[Bấm để gọi đi theo]`).
  7. **Kiểm Thử & Đảm Bảo Tính Toàn Vẹn ([party-map-hud.test.ts](file:///e:/Pokemon/apps/web/test/party-map-hud.test.ts)):**
     - Bổ sung test kiểm tra sự kiện click kích hoạt `onFollowerSelect` và kiểm tra hiển thị trạng thái `is-following`.
     - Toàn bộ 16 tệp kiểm thử (128 tests) và TypeScript check (`npm run typecheck:web`) đều đạt kết quả PASS 100%.

---

### 0.52. Tinh Gọn Menu Party Screen & Đồng Bộ Toàn Diện Màn Hình Xem Thông Tin Theo PC Storage (Party Summary Modal):

- **Trạng thái:** Đã hoàn thành 100% việc tinh gọn menu hành động Pokémon trong Party Screen và đồng bộ hóa giao diện màn hình Xem thông tin Pokémon (`#partySummaryModal`) sang layout chuẩn cao cấp của PC Storage Screen (`#storageSummaryModal`).
- **Chi tiết đã thực hiện:**
  1. **Tinh Gọn Menu Hành Động ([party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts)):**
     - Loại bỏ 2 nút: **"Đưa lên đầu"** (`#btnActionLeader`) và **"Hồi phục HP"** (`#btnActionHeal`).
     - Người chơi có thể đổi Pokémon lên vị trí dẫn đầu tự nhiên thông qua nút "Đổi vị trí" vào slot 1.
     - Menu hành động giờ đây chỉ giữ lại các tùy chọn chuẩn mực, tinh gọn: *Ra chiến đấu* (khi chọn đấu sĩ), *Đổi vị trí*, *Xem thông tin*, và *Đóng*.
  2. **Đồng Bộ Giao Diện Xem Thông Tin Theo Chuẩn PC Storage ([party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - **Bố cục 2 Panel Rộng Rãi (`.summary-modal-inner`):** Tỉ lệ $780 \times 415\text{ px}$ chuẩn sắc nét, phủ toàn màn hình với hiệu ứng làm mờ nền hiện đại.
     - **Panel Bên Trái (`.summary-card` - Thông Tin, Chỉ Số & Chiêu Thức):**
       - **Header:** Huy hiệu tiêu đề `CHI TIẾT POKÉMON`, Tên/Nickname, Cấp độ `Lv.X`, Ký hiệu Giới tính (`♂`/`♀`), và Biểu tượng `shiny.png` lấp lánh (nếu là dạng Shiny).
       - **Cột Sprite & Metadata:** Khung hoạt ảnh sprite Pokémon động (`PokemonSpriteAnimator`), huy hiệu hệ lấy trực tiếp từ sprite sheet `types_ico.png`, hộp thông tin bóng bắt, cấp khi bắt, điểm kinh nghiệm và thanh tiến trình EXP bar.
       - **Bảng Chỉ Số Chiến Đấu (Battle Stats):** Đầy đủ 6 chỉ số (HP, Tấn công, Phòng thủ, Công ĐB, Thủ ĐB, Tốc độ) kèm hệ thống thanh đo màu trực quan (`stat-bar-track` & `stat-bar-fill`) có tỉ lệ chuẩn, HP tự đổi màu theo ngưỡng máu.
       - **4 Ô Chiêu Thức Trang Bị:** Vẽ trực tiếp trên canvas bằng đồ họa nút chiến đấu `/Graphics/Battle/battleFightButtons.png` chuẩn GBA Pokémon. Hỗ trợ cơ chế kéo thả con trỏ (Pointer-based drag & drop) để sắp xếp vị trí các chiêu thức một cách trực quan.
     - **Panel Bên Phải (`.summary-pool-panel` - Kho Chiêu Thức Khả Dụng):**
       - Hiển thị danh sách toàn bộ các chiêu thức Pokémon có thể học theo cấp độ (`≤ Lv.X`) tra cứu tự động từ cơ sở dữ liệu `getAvailableLevelUpMoves`.
       - Đánh dấu các chiêu đang trang bị (`.equipped`), cho phép người chơi kéo thả bất kỳ chiêu thức nào từ kho sang 4 ô bên trái để học hoặc thay thế chiêu thức ngay trong Party Screen!
       - Nút đóng `✕ ĐÓNG` pixel bevel đỏ retro tại góc trên bên phải.
     - **Popup Chi Tiết Chiêu Thức (`#partyMoveDetailPopup`):**
       - Khi người chơi nhấp chuột vào bất kỳ chiêu thức nào (ở 4 ô trang bị hoặc ở kho chiêu thức), một thẻ popup GBA pixel art sẽ hiển thị đầy đủ: Tên tiếng Việt, Tên tiếng Anh, Biểu tượng hệ, Thể loại (Vật Lý / Đặc Biệt / Trạng Thái), Sức mạnh (Power), Độ chính xác (Accuracy), Điểm PP, và Mô tả chiêu thức.
  3. **Kiểm Thử & Đảm Bảo Tính Toàn Vẹn:**
     - Toàn bộ pipeline typecheck (`npm run typecheck:web`) và bộ test Vitest (16 files, 127 tests) đều PASS 100%.

---

### 0.51. Pixel Art Hóa Menu Hành Động & Giao Diện Trong Party Screen (Party Action Menu):

- **Trạng thái:** Đã hoàn thành 100% việc chuyển đổi giao diện popup tùy chọn hành động Pokémon trong Party Screen từ phong cách web phẳng hiện đại sang chuẩn Pixel Art cổ điển (GBA / Pokémon Essentials).
- **Chi tiết đã thực hiện:**
  1. **Khung Popup Chuẩn Pixel Bevel ([style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Loại bỏ góc bo tròn (`border-radius: 0`), thay bằng khung hộp pixel đa tầng: `border: 3px solid #000000`, viền bevel `inset 2px 2px 0 #475569, inset -2px -2px 0 #0f172a` và viền ngoài cyan neon mảnh.
     - Tiêu đề Pokémon được đặt trong thanh banner pixel nền tối `#0b1120`, chữ cyan sáng nét có đổ bóng pixel.
  2. **Loại Bỏ Emoji, Sử Dụng Con Trỏ Pixel Retro ([party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Gỡ bỏ toàn bộ emoji unicode (🔄, 👑, 📊, 💊, ✕) khỏi các nút hành động.
     - Thay bằng con trỏ pixel `▶` kinh điển của dòng game Pokémon: hiển thị màu xám bạc ở trạng thái bình thường và đổi sang màu vàng rực (`#facc15`) đồng thời trượt nhẹ sang phải khi rê chuột/focus vào nút.
     - Các nút lệnh (Đổi vị trí, Đưa lên đầu, Xem thông tin, Hồi phục HP, Ra chiến đấu, Đóng) được tạo khối bevel pixel nổi `inset 1px 1px 0 #475569`, font chữ pixel `Power Clear / VT323` sắc nét.
  3. **Đồng Bộ Giao Diện Xem Chi Tiết ([style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Chuyển đổi `.summary-card`, nút đóng và các thẻ hệ (type badges) sang phong cách pixelated vuông vức đồng bộ.
  4. **Kiểm Thử & Đảm Bảo Tính Toàn Vẹn:**
     - Toàn bộ 16 tệp kiểm thử (127 tests) và typecheck đều PASS 100%.

---

### 0.50. Tích Hợp UI HUD Đội Hình 6 Pokémon Dọc Mép Phải Trên Bản Đồ (Party Map HUD):

- **Trạng thái:** Đã hoàn thành 100% việc tích hợp giao diện HUD hiển thị 6 Pokémon trong đội hình ở mép bên phải bản đồ thế giới mở (Overworld Map) sử dụng đồ họa chuẩn `Graphics/Party/databox_normal.png`.
- **Chi tiết đã thực hiện:**
  1. **Đăng Ký & Quản Lý Asset ([asset-registry.ts](file:///e:/Pokemon/apps/web/src/assets/asset-registry.ts)):**
     - Đăng ký asset manifest key `party_databox_normal` trỏ về `/Graphics/Party/databox_normal.png`.
     - Thêm getter `PARTY_ASSETS.databoxNormal` truy xuất URL tài nguyên tập trung qua AssetLoader.
  2. **Thành Phần Giao Diện Đội Hình Ngoài Map ([party-map-hud.ts](file:///e:/Pokemon/apps/web/src/ui/party-map-hud.ts)):**
     - Xây dựng component `PartyMapHud` độc lập, quản lý danh sách tối đa 6 slot Pokémon đặt dọc cố định ở mép bên phải màn hình.
     - Sử dụng khung ảnh chuẩn `databox_normal.png` (tỉ lệ $208 \times 67\text{ px}$) cực kỳ sắc nét pixelated.
     - Hiển thị đầy đủ chi tiết cho từng Pokémon:
       - Mini sprite icon Pokémon (cắt frame đầu tiên từ icon sprite sheet).
       - Cụm 5 ngôi sao lấp lánh (5-star sparkle cluster) bám sát quanh thân và trên bề mặt icon nếu là Pokémon Shiny.
       - Biểu tượng sao đỏ tĩnh chuẩn `shiny.png` nằm cạnh tên Pokémon.
       - Tên Pokémon/Nickname, giới tính (♂/♀), và cấp độ (`Lv.${pk.level}`).
       - Rãnh máu HP: Căn chỉnh tọa độ pixel khớp tuyệt đối với rãnh HP trên thẻ `databox_normal.png`, tự động đổi màu theo tỉ lệ (xanh >50%, vàng >20%, đỏ $\le 20\%$).
       - Hiển thị chỉ số máu số (`${pk.currentHp}/${pk.maxHp}`) hoặc nhãn `FNT` màu đỏ nếu Pokémon ngất xỉu.
       - Rãnh kinh nghiệm EXP: Căn chỉnh ở rãnh đáy hiển thị % EXP lên cấp tiếp theo.
       - Đã loại bỏ hoàn toàn icon vương miện leader theo yêu cầu để giữ giao diện đồng nhất, tối giản và sạch sẽ.
     - Hỗ trợ nút toggle thu gọn / mở rộng (`party-map-hud-toggle`) trượt mượt mà sang phải khi người chơi cần toàn cảnh bản đồ; khi thu gọn, nút toggle được đẩy ra ngoài thêm 30px (`calc(100% - 46px)`) và danh sách thẻ tự động mờ dần không che khuất nút.
     - Bấm vào bất kỳ thẻ Pokémon nào để mở nhanh màn hình Quản lý đội hình (`togglePartyScreen()`).
     - Tự động đồng bộ hóa thời gian thực với `partyService.subscribe(...)` mỗi khi có thay đổi (hồi máu, đổi chỗ, bắt mới, v.v.).
  3. **Tạo Mẫu Giao Diện & Khởi Tạo Bootstrap ([bootstrap.ts](file:///e:/Pokemon/apps/web/src/bootstrap.ts), [ui/index.ts](file:///e:/Pokemon/apps/web/src/ui/index.ts)):**
     - Export `PartyMapHud` và hàm `initPartyMapHud()` trong `apps/web/src/ui/index.ts`.
     - Khởi tạo `initPartyMapHud()` tự động ngay khi boot ứng dụng trong `apps/web/src/bootstrap.ts`.
  4. **Kiểu Dáng Pixel-Art CSS Hoàn Chỉnh ([style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Định vị `right: -8px; top: 168px; z-index: 90;` (dịch sang phải 20px giúp ôm khít cạnh màn hình không bị hở, và hạ thấp xuống 168px để cách xa thanh Menu Bar trên cùng tạo khoảng không gian thoáng đãng).
     - Hiệu ứng tương tác hover trượt nhẹ sang trái và viền cyan neon tinh tế.
  5. **Kiểm Thử Tự Động & Đảm Bảo Tính Toàn Vẹn ([party-map-hud.test.ts](file:///e:/Pokemon/apps/web/test/party-map-hud.test.ts)):**
     - Bổ sung bộ kiểm thử đơn vị cho `PartyMapHud`: kiểm tra khởi tạo 6 slot, render dữ liệu máu/cấp độ/tên, kích hoạt biểu tượng Shiny và cụm 5 sao, tính năng thu gọn/mở rộng, và phản hồi sự kiện từ partyService.
     - Toàn bộ 16 tệp kiểm thử (127 tests) đạt kết quả PASS 100%, typecheck và build bundle pass hoàn hảo.

---

### 0.49. Tinh Chỉnh Cụm 5 Ngôi Sao Lấp Lánh (5-Star Sparkle Cluster) Ngay Trên Icon Pokémon Shiny:

- **Trạng thái:** Đã hoàn thành 100% việc tinh chỉnh hiệu ứng thị giác theo yêu cầu: Bỏ hoạt ảnh co giãn của biểu tượng sao đỏ và loại bỏ hào quang phát quang (aura glow), bổ sung cụm 5 ngôi sao lấp lánh (sparkle cluster) xuất hiện liên tục ngay trên bề mặt và sát quanh thân icon Pokémon Shiny.
- **Chi tiết đã thực hiện:**
  1. **Biểu Tượng Sao Đỏ Chuẩn Tĩnh ([style.css](file:///e:/Pokemon/apps/web/src/style.css), [battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts)):**
     - Loại bỏ toàn bộ animation co giãn, lắc lư và hào quang trên các icon biểu tượng sao đỏ (`shiny.png`). Biểu tượng sao đỏ hiển thị sắc nét, cố định và tự nhiên trên mọi giao diện: Party Screen, PC Storage và Canvas Databox trong trận đấu.
  2. **Loại Bỏ Hào Quang & Viền Phát Quang ([style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Gỡ bỏ `shinyPokemonIconAura` (filter drop-shadow tỏa sáng quanh sprite) và `shinySlotGlow` (viền ô phát sáng).
  3. **Cụm 5 Ngôi Sao Lấp Lánh Bám Sát Trên Thân Icon Pokémon ([party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts), [storage-screen.ts](file:///e:/Pokemon/apps/web/src/ui/storage-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Tạo container `.shiny-sparkle-cluster` chứa 5 ngôi sao lấp lánh (`sp-star sp-1` đến `sp-5`) đặt trực tiếp bên trong vùng sprite wrapper của icon Pokémon.
     - Phân bổ 5 ngôi sao tại các vị trí sát quanh thân và ngay trên bề mặt icon Pokémon (`14%, 18%`, `10%, 82%`, `86%, 20%`, `88%, 82%`, `38%, 42%`).
     - Keyframe `@keyframes sparklePop` với chu kỳ 1.5s và các độ trễ so le liên tiếp (`0s, 0.3s, 0.6s, 0.9s, 1.2s`), giúp các ngôi sao lấp lánh xuất hiện dồi dào, sinh động, chớp nở liên tục ngay trên Pokémon mà không bị văng ra ngoài khung.
  4. **Kiểm Thử & Đảm Bảo Tính Toàn Vẹn:**
     - Toàn bộ pipeline typecheck (`npm run typecheck:web`) và bộ kiểm thử Vitest (15 files, 124 tests) đều PASS 100%.

---

### 0.48. Hiệu Ứng Sáng Bóng (Sparkle Shine) & Âm Thanh Không Gian (Spatial Audio) Cho Pokémon Shiny Trên Map & Trong Trận Đấu:

- **Trạng thái:** Đã hoàn thành 100% việc tích hợp hiệu ứng thị giác sáng bóng (sparkle visual effects) trên Overworld Map và Battle Screen, cùng hệ thống âm thanh không gian $3 \times 3$ chunk cho Pokémon Shiny trên map và âm thanh xuất hiện trong trận chiến.
- **Chi tiết đã thực hiện:**
  1. **Âm Thanh Không Gian Trên Map ([overworld-shiny-audio.ts](file:///e:/Pokemon/apps/web/src/audio/overworld-shiny-audio.ts), [game-session.ts](file:///e:/Pokemon/apps/web/src/game/game-session.ts)):**
     - Tạo `OverworldShinyAudio` quản lý luồng âm thanh lặp `Audio/SE/shiny-pokemon-sound_XMc2yU61.mp3`.
     - Xác định phạm vi lắng nghe chuẩn $3 \times 3$ chunk theo khoảng cách Chebyshev ($|cx_{pokemon} - cx_{player}| \le 1$ và $|cy_{pokemon} - cy_{player}| \le 1$).
     - Tính toán khoảng cách Euclidean chính xác giữa người chơi và Pokémon Shiny, điều chỉnh âm lượng mượt mà (LERP) theo hàm phi tuyến: ở rìa $3 \times 3$ chunk âm thanh phát nhỏ êm dịu, càng tiến lại gần Pokémon Shiny âm thanh càng vang rõ và to dần (lên tới mức tối đa 1.0).
     - Tự động ngắt âm thanh tức thì khi Pokémon Shiny biến mất, bị bắt, hoặc khi người chơi bắt đầu trận đấu.
  2. **Hiệu Ứng Thị Giác Sáng Bóng Trên Bản Đồ Overworld ([character-renderer.ts](file:///e:/Pokemon/apps/web/src/rendering/character-renderer.ts)):**
     - Nạp sprite overworld sắc màu Shiny từ `Graphics/Characters/Followers shiny/${speciesKey}.png`.
     - Vẽ hào quang phát quang màu hổ phách/vàng kim (`#f59e0b`) tỏa ra dưới chân Pokémon Shiny.
     - Vẽ 4 ngôi sao 4 cánh lấp lánh màu vàng và trắng bạc (`#fef08a`, `#ffffff`) xoay tròn và nhấp nháy bay lượn quanh Pokémon Shiny.
  3. **Âm Thanh & Hiệu Ứng Sáng Bóng Riêng Biệt Trong Trận Đấu ([battle-se.ts](file:///e:/Pokemon/apps/web/src/audio/battle-se.ts), [battle-screen.ts](file:///e:/Pokemon/apps/web/src/battle/battle-screen.ts), [battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts)):**
     - Phương thức `battleSePlayer.playShinyAppear()` phát tệp âm thanh `Audio/SE/shiny-pokemon.mp3`.
     - Tự động kích hoạt âm thanh và hoạt ảnh lấp lánh khi Pokémon Shiny hoang dã xuất hiện trong màn mở đầu intro trận đấu, cũng như khi Pokémon Shiny của người chơi được ném bóng ra sân chiến đấu.
     - Thiết kế hiệu ứng bùng nổ hào quang đa tầng trong trận đấu: Tâm phát sáng Radial Glow bung tỏa, chùm tia Starburst Cross Rays 8 hướng, và vòng 10 ngôi sao 4 cánh chuyển động xoắn ốc hướng tâm tỏa ra kèm các hạt bụi sao Starlight Dust lấp lánh.
  4. **Công Cụ Kiểm Thử Debug Nhanh ([game-overlay.ts](file:///e:/Pokemon/apps/web/src/ui/game-overlay.ts), [bootstrap.ts](file:///e:/Pokemon/apps/web/src/bootstrap.ts)):**
     - Thêm nút `✨ Thả Shiny Hoang Dã (Map Test)` trong bảng điều khiển Party Debug, cho phép người chơi tạo ngay một Pokémon Shiny theo loài tùy chọn ở gần nhân vật trên bản đồ để thử nghiệm âm thanh không gian và hiệu ứng sáng bóng.
  5. **Kiểm Thử Tự Động & Đảm Bảo Tính Toàn Vẹn ([shiny-spatial.test.ts](file:///e:/Pokemon/apps/web/test/shiny-spatial.test.ts)):**
     - Bổ sung bộ kiểm thử đơn vị tự động kiểm tra bán kính $3 \times 3$ chunk, tính tỉ lệ âm lượng khoảng cách và dừng âm thanh khi vào trận đấu.
     - Toàn bộ 15 tệp kiểm thử (124 tests) đạt chuẩn PASS 100%, TypeScript build pass không có lỗi.

---

### 0.47. Sử Dụng Biểu Tượng Đồ Họa Chuẩn `shiny.png` Cho Toàn Bộ Hệ Thống Hiển Thị:

- **Trạng thái:** Đã hoàn thành 100% việc tích hợp tệp ảnh biểu tượng chuẩn [shiny.png](file:///e:/Pokemon/Graphics/Pokemon/shiny.png) ($24 \times 24\text{ px}$) thay thế cho ký tự sao văn bản trên toàn bộ các giao diện: Trận đấu (Battle Databox), Đội hình (Party Screen), và Kho lưu trữ PC (Storage Screen).
- **Chi tiết đã thực hiện:**
  1. **Đăng Ký & Đóng Gói Asset ([asset-registry.ts](file:///e:/Pokemon/apps/web/src/assets/asset-registry.ts), [vite.config.ts](file:///e:/Pokemon/apps/web/vite.config.ts)):**
     - Đăng ký `pokemon_shiny_icon` trỏ về `/Graphics/Pokemon/shiny.png` trong `POKEMON_ASSETS.shinyIcon`.
     - Thêm `Graphics/Pokemon/shiny.png` vào danh sách emit asset của plugin Rollup build trong `vite.config.ts`.
  2. **Giao Diện Trận Đấu ([battle-text-overlay.ts](file:///e:/Pokemon/apps/web/src/battle/battle-text-overlay.ts), [battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts), [battle-assets.ts](file:///e:/Pokemon/apps/web/src/battle/battle-assets.ts)):**
     - Đặt thẻ ảnh `bho-enemy-shiny` và `bho-player-shiny` trong Databox HTML overlay của cả địch và người chơi, tự động hiển thị biểu tượng `shiny.png` khi đấu sĩ là dạng Shiny.
     - Tải và vẽ `shinyIcon` trên cả Canvas databox renderer cạnh cấp độ Pokémon.
  3. **Giao Diện Đội Hình ([party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts)):**
     - Thay thế ký hiệu sao text trong `.ps-name-row` bằng ảnh `<img src="${POKEMON_ASSETS.shinyIcon}" class="ps-shiny-icon" />`.
     - Cập nhật modal xem chi tiết tóm tắt (#partySummaryModal) hiển thị ảnh biểu tượng `shiny.png` cạnh tên Pokémon.
  4. **Giao Diện Kho Lưu Trữ PC ([storage-screen.ts](file:///e:/Pokemon/apps/web/src/ui/storage-screen.ts)):**
     - Ô slot đội hình PC: Hiển thị `party-slot-shiny-icon` cạnh tên Pokémon.
     - Ô lưới kho Box PC: Đặt huy hiệu góc nhỏ `storage-grid-shiny-icon` tại góc trên của ô slot chứa Pokémon Shiny.
     - Bảng xem trước Selection Preview và modal chi tiết Summary Modal: Hiển thị icon `shiny.png` đồng bộ.
  5. **Tạo Kiểu CSS Chuyên Nghiệp ([style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Cấu hình pixel-art sắc nét (`image-rendering: pixelated; crisp-edges;`), hiệu ứng đổ bóng mờ phát sáng nhẹ `drop-shadow(0 0 2px rgba(239, 68, 68, 0.8))`.
  6. **Kiểm Thử & Xác Thực:**
     - Toàn bộ pipeline typecheck (`npm run typecheck:web`) và bộ test Vitest (14 files, 120 tests) đều PASS 100%.

---

### 0.46. Bổ Sung Bộ Chọn Dạng Thường / Shiny Vào Bảng Debug & Đồng Bộ UI:

- **Trạng thái:** Đã hoàn thành 100% việc tích hợp bộ chọn dạng Thường / 🌟 Shiny vào bảng Debug Panel (trên giao diện Map Overlay) cho cả tính năng Thêm Pokémon vào đội hình lẫn Khởi động trận đấu kiểm thử, đồng thời hiển thị huy hiệu sao vàng `★` trên giao diện Party và Storage PC.
- **Chi tiết đã thực hiện:**
  1. **Bảng Điều Khiển Debug ([game-overlay.ts](file:///e:/Pokemon/apps/web/src/ui/game-overlay.ts)):**
     - Bổ sung dropdown `<select id="selectPartyForm">` với 2 lựa chọn: `⚪ Thường` và `🌟 Shiny` vào khu vực debug đội hình Pokémon.
     - Bổ sung dropdown `<select id="selectBattleShiny">` với 2 lựa chọn: `⚪ Địch Thường` và `🌟 Địch Shiny` ngay cạnh nút `⚔️ Đấu Thử`.
  2. **Liên Kết Sự Kiện Debug ([bootstrap.ts](file:///e:/Pokemon/apps/web/src/bootstrap.ts)):**
     - Cập nhật nút `➕ Thêm vào đội`: Đọc giá trị từ `selectPartyForm`, truyền cờ `isShiny: boolean` vào hàm `createPartyPokemon(speciesKey, level, { isShiny })`.
     - Cập nhật nút `🎲 Ngẫu nhiên` và `⚡ Đầy 6 Slot`: Tôn trọng lựa chọn dạng Thường/Shiny đang chọn từ dropdown `selectPartyForm`.
     - Cập nhật nút `⚔️ Đấu Thử` và API toàn cục `window.startBattle(overlay?: string, isShiny?: boolean)`: Hỗ trợ bắt đầu trận đấu thử với đối thủ dạng Thường hoặc Shiny tùy chọn.
  3. **Đồng Bộ Dạng Shiny Cho Trận Đấu & Thu Phục ([game-session.ts](file:///e:/Pokemon/apps/web/src/game/game-session.ts)):**
     - `startWildBattle`: Truyền cờ `wp.isShiny` vào `createBattler`.
     - Khi ném bóng thu phục thành công (`result.outcome === 'caught'`): Pokémon hoang dã dạng Shiny khi vào đội hình hoặc chuyển vào PC Storage vẫn giữ nguyên thuộc tính Shiny (`{ isShiny: wildBattler.isShiny }`).
     - `startTestBattle`: Nhận tham số `isEnemyShiny` và gán vào thực thể Pokémon tạo mẫu.
  4. **Hiển Thị Huy Hiệu Sao Vàng Trên Giao Diện ([party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts), [storage-screen.ts](file:///e:/Pokemon/apps/web/src/ui/storage-screen.ts)):**
     - Trên các ô danh sách Party, tên Pokémon dạng Shiny có kèm biểu tượng ngôi sao vàng `★`.
     - Trong modal xem chi tiết tóm tắt (Summary Modal) của Party và Storage PC, tên Pokémon Shiny hiển thị sao vàng `★`, đi kèm toàn bộ hoạt ảnh sprite động Shiny tương ứng.
  5. **Kiểm Thử & Xác Thực:**
     - Toàn bộ pipeline typecheck (`npm run typecheck:web`) và bộ test Vitest (14 files, 120 tests) đều PASS 100%.

---

### 0.45. Bổ Sung Dạng Shiny (Sắc Màu Đặc Biệt) Cho Toàn Bộ 151 Pokémon Gen 1:

- **Trạng thái:** Đã hoàn thành 100% việc tích hợp các đường dẫn assets dạng Shiny (`Front shiny`, `Back shiny`, `Icons shiny`) cho toàn bộ 151 loài Pokémon Gen 1 vào cơ sở dữ liệu `pokemon-db.json`, đồng bộ schema JSON, type TypeScript và hỗ trợ hiển thị trên toàn bộ hệ thống Party, Storage và Battle.
- **Chi tiết đã thực hiện:**
  1. **Cập nhật Cơ Sở Dữ Liệu ([pokemon-db.json](file:///e:/Pokemon/packages/game-data/pokemon-db.json)):**
     - Bổ sung 3 trường sprite dạng Shiny cho toàn bộ 151 loài Pokémon:
       - `frontShiny`: `"Graphics/Pokemon/Front shiny/${speciesKey}.png"`
       - `backShiny`: `"Graphics/Pokemon/Back shiny/${speciesKey}.png"`
       - `iconShiny`: `"Graphics/Pokemon/Icons shiny/${speciesKey}.png"`
     - Xác thực 151/151 loài đều có đầy đủ tệp ảnh pixel-art hợp lệ trên đĩa, không thiếu bất kỳ tệp nào.
  2. **Đồng Bộ Schema & Type Definitions ([pokemon.ts](file:///e:/Pokemon/packages/shared-types/pokemon.ts), [pokemon.schema.json](file:///e:/Pokemon/packages/shared-types/pokemon.schema.json)):**
     - Mở rộng interface `PokemonSprites`: thêm `frontShiny?: string`, `backShiny?: string`, `iconShiny?: string`, `cry?: string`.
     - Cập nhật schema validation `pokemon.schema.json` hỗ trợ đầy đủ các trường sprite shiny. Chạy script `node scripts/validate-schemas.mjs` đạt kết quả PASS 100%.
  3. **Mở Rộng Asset Registry ([asset-registry.ts](file:///e:/Pokemon/apps/web/src/assets/asset-registry.ts)):**
     - Nâng cấp `POKEMON_ASSETS.getFrontSprite(speciesKey, isShiny = false)`, `getBackSprite(speciesKey, isShiny = false)`, `getIconSprite(speciesKey, isShiny = false)`: Tự động trỏ vào thư mục `Front shiny/`, `Back shiny/`, `Icons shiny/` khi cờ `isShiny === true`.
  4. **Hỗ Trợ Dạng Shiny Trong Đội Hình, Trận Đấu & Kho PC ([party-state.ts](file:///e:/Pokemon/apps/web/src/domain/party/party-state.ts), [battle/types.ts](file:///e:/Pokemon/apps/web/src/battle/types.ts), [battle-factory.ts](file:///e:/Pokemon/apps/web/src/battle/battle-factory.ts), [party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts), [storage-screen.ts](file:///e:/Pokemon/apps/web/src/ui/storage-screen.ts)):**
     - Bổ sung thuộc tính `isShiny?: boolean` vào cả `PartyPokemon` và `BattlerPokemon`.
     - `createPartyPokemon`: Hỗ trợ tùy chọn `options.isShiny`.
     - `partyPokemonToBattler`: Tự động truyền cờ `isShiny` và nạp đúng sprite trước/sau/icon shiny cho đấu sĩ Pokémon.
     - `createBattler`: Hỗ trợ tham số `isShiny = false` cho cả Pokémon hoang dã.
     - `PartyScreen` & `StorageScreen`: Đồng bộ hiển thị icon thu nhỏ và sprite hoạt ảnh động dạng Shiny trong danh sách ô và bảng chi tiết Summary Modal.
  5. **Kiểm Thử Toàn Diện (Unit Tests):**
     - Bổ sung unit test xác thực dạng Shiny trong suite kiểm thử trận đấu: Kiểm tra Catalog, Asset Resolver, Party State, Battler Converter và Wild Battler Factory.
     - Toàn bộ pipeline `npm run ci` (Schema, Lint TS, Format Prettier, Typecheck, 120 Vitest tests, Production Build) đạt PASS 100%.

---



- **Trạng thái:** Đã hoàn thành 100% các yêu cầu từ [DEV_ARCHITECTURE_GUIDE.md](file:///e:/Pokemon/docs/DEV_ARCHITECTURE_GUIDE.md): Dọn dẹp file di sản, tích hợp ESLint cho toàn bộ TypeScript, sửa lỗi regex escape, tối ưu hóa thuật toán render và đồng bộ toàn bộ tài liệu quy chuẩn.
- **Chi tiết đã thực hiện:**
  1. **Dọn dẹp file di sản ở thư mục gốc (Root Cleanup):**
     - Xóa bỏ `map_viewer.html` ($126\text{ KB}$) và `tiles_data.js` ($127\text{ KB}$) không còn sử dụng từ thời kỳ prototype cũ, làm sạch hoàn toàn thư mục gốc monorepo.
  2. **Tích Hợp ESLint Hỗ Trợ TypeScript Toàn Diện ([eslint.config.js](file:///e:/Pokemon/eslint.config.js)):**
     - Cài đặt và cấu hình `typescript-eslint` trên ESLint 10 flat config.
     - Kích hoạt quy tắc kiểm tra lỗi cho toàn bộ các file `.ts` trong `apps/web/src` và `apps/web/test`, bảo vệ chất lượng code tĩnh.
     - Khắc phục lỗi regex escape không cần thiết trong [asset-registry.ts](file:///e:/Pokemon/apps/web/src/assets/asset-registry.ts#L308).
  3. **Tối Ưu Hiệu Năng Runtime (H2, H1, H6) ([ground-renderer.ts](file:///e:/Pokemon/apps/web/src/rendering/ground-renderer.ts), [time.ts](file:///e:/Pokemon/apps/web/src/core/time.ts)):**
     - **Tối ưu H2 (Cỏ cao):** Chuyển đổi cơ chế kiểm tra thực thể di chuyển trong `renderTallGrassPatches` từ vòng lặp $O(\text{cỏ} \times \text{thực thể})$ sang bảng tra tập hợp `Set<number>` với hàm băm `tileKey(gx, gy)` đạt độ phức tạp $O(1)$ tức thì.
     - **Tối ưu H1 (Gạch nước):** Cắt sớm (cull) toàn bộ chunk nước nằm ngoài tầm nhìn (viewport bounds) trong `renderWaterTiles` trước khi duyệt qua 256 ô con, loại bỏ lãng phí CPU render các chunk khuất.
     - **Tối ưu H6 (Game Loop Stats):** Sửa lỗi `GameTime.getStats()` trả về mốc thời gian `lastTime` thay vì delta-time; hiện tại trả chính xác `dtMs` (khoảng cách ms giữa 2 frame thực tế) và `dtScale` chuẩn hóa theo 60 FPS.
  4. **Đồng Bộ Hóa Toàn Diện Hệ Thống Tài Liệu Quy Chuẩn:**
     - Cập nhật [DEV_GUARDRAILS.md](file:///e:/Pokemon/docs/DEV_GUARDRAILS.md): Bổ sung quy tắc chuẩn Gen 7 cho toàn bộ trận đấu, quy tắc hướng phụ thuộc 6 tầng (L0 $\rightarrow$ L5), cấm vòng lặp import và áp đặt giới hạn kích thước file (cảnh báo 400 dòng, lỗi 600 dòng).
     - Cập nhật [02-architecture.md](file:///e:/Pokemon/docs/plans/02-architecture.md): Thay thế sơ đồ client-server cũ bằng sơ đồ kiến trúc 6 tầng Client-only, DDD theo thực tế.
     - Cập nhật [03-repository-structure.md](file:///e:/Pokemon/docs/plans/03-repository-structure.md): Phản ánh chính xác cấu trúc thư mục Monorepo thực tế.
     - Cập nhật [04-frontend-plan.md](file:///e:/Pokemon/docs/plans/04-frontend-plan.md): Ghi rõ công nghệ TypeScript thuần + Canvas 2D + DOM High-DPI (không dùng Phaser/React).
     - Cập nhật [05-backend-plan.md](file:///e:/Pokemon/docs/plans/05-backend-plan.md): Đánh dấu trạng thái **TẠM HOÃN (Deferred)** theo quyết định D2.
  5. **Xác Thực Chất Lượng Tuyệt Đối (CI Pipeline):**
     - Chạy toàn bộ pipeline `npm run ci`: Schema Validation PASS, ESLint TS PASS, Prettier format PASS, Typecheck PASS, Vitest 14 files (119/119 tests) PASS, Production build Vite PASS 100%.

---



- **Trạng thái:** Đã hoàn thành 100% việc rà soát và khắc phục toàn bộ các lỗi P0, P1, P2 trong báo cáo thực nghiệm trận đấu, tuân thủ nghiêm ngặt chuẩn quy tắc Pokémon Gen 7 và dịch hoàn thiện 100% chiêu thức trong cơ sở dữ liệu (`moves-db.json`).
- **Chi tiết đã thực hiện:**
  1. **Quyết Định Thứ Tự Lượt Đi ([battle-engine.ts](file:///e:/Pokemon/apps/web/src/battle/battle-engine.ts), [battle-controller.ts](file:///e:/Pokemon/apps/web/src/battle/battle-controller.ts)):**
     - Kích hoạt `getFirstAttacker(playerMove, enemyMove)` trong `BattleController`: Ưu tiên so sánh độ ưu tiên chiêu thức (`priority`), tiếp đến là Tốc độ (`speed`, có tính hệ số tê liệt $\times 0.5$ và các bậc thay đổi chỉ số $-6 \dots +6$).
     - Hòa tốc độ được quyết định ngẫu nhiên 50/50 qua bộ sinh số ngẫu nhiên `SeededBattleRng` thay vì luôn mặc định người chơi đi trước.
     - Xử lý ngất tức thì: Nếu Pokémon đi trước hạ gục đối thủ (`defenderFainted`), đối thủ ngất ngay lập tức và bị hủy lượt đánh.
  2. **Xử Lý Chiêu Thức Sát Thương Đặc Biệt & Power = 0 ([battle-engine.ts](file:///e:/Pokemon/apps/web/src/battle/battle-engine.ts)):**
     - Sát thương cố định: `Seismic Toss` và `Night Shade` gây sát thương bằng chính Level người dùng; `Dragon Rage` cố định $40\text{ HP}$; `Sonic Boom` cố định $20\text{ HP}$.
     - Sát thương theo phần trăm máu: `Super Fang` và `Nature's Madness` gây sát thương bằng $50\%$ HP hiện tại của mục tiêu (tối thiểu $1\text{ HP}$).
     - Đòn thế dồn lực/tình thế: `Endeavor` rút HP đối thủ bằng đúng HP hiện tại của bản thân nếu bản thân thấp máu hơn; `Psywave` gây sát thương ngẫu nhiên theo công thức Level chuẩn; `Flail` và `Reversal` tự động tính Power động từ 20 đến 200 dựa trên tỉ lệ % máu còn lại.
     - Chiêu Nhất Kích Tất Sát (OHKO Moves: `Fissure`, `Guillotine`, `Horn Drill`, `Sheer Cold`): Độ chính xác tính bằng `(attackerLevel - defenderLevel) + 30`, tự động trượt nếu cấp độ người dùng thấp hơn mục tiêu; khi trúng hạ gục đối thủ tức thì.
     - Chiêu Nổ Tung (`Explosion`, `Self-Destruct`): Gây sát thương uy lực lớn và người dùng tự ngất ngay lập tức (`attackerFainted`).
     - Đòn Đánh Nhiều Lượt (Multi-hit): Các chiêu 2-5 lượt (`Bullet Seed`, `Fury Swipes`,...) và 2 lượt (`Double Kick`, `Dual Wingbeat`,...) thực hiện phân phối số hit chuẩn, trừ HP và kiểm tra ngất chính xác sau từng đòn đánh.
  3. **Chặn Sát Thương Thừa Cho Giật Lùi (Recoil) & Hồi Máu (Drain) ([battle-engine.ts](file:///e:/Pokemon/apps/web/src/battle/battle-engine.ts)):**
     - Recoil (`Double-Edge`, `Brave Bird`,...) và Drain (`Giga Drain`, `Absorb`,...) chỉ được tính dựa trên lượng HP thực tế bị trừ của đối thủ (`actualDamage`), không tính trên sát thương tràn ngoài chỉ số HP còn lại.
     - Xử lý Pokémon tự ngất do recoil hoặc Struggle: Controller kiểm tra cờ `attackerFainted` để ngắt trận hoặc đổi lượt hợp lệ.
  4. **Quy Tắc Trừ PP Khi Bị Trạng Thái Bất Lực ([battle-engine.ts](file:///e:/Pokemon/apps/web/src/battle/battle-engine.ts)):**
     - Kiểm tra trạng thái cản trở cử động (Đang ngủ, Đóng băng, Tê liệt hoàn toàn) TRƯỚC KHI trừ PP. Nếu Pokémon không thể ra đòn, bảo lưu 100% số PP của chiêu thức.
  5. **Bỏ Qua Né Tránh Cho Chiêu Tự Buff & Kiểm Tra Miễn Nhiễm Hệ Cho Status Move ([battle-engine.ts](file:///e:/Pokemon/apps/web/src/battle/battle-engine.ts)):**
     - Chiêu thức trạng thái nhắm vào chính mình (Self-buff như `Swords Dance`, `Agility`,...) và chiêu không bao giờ trượt (`Swift`, `Aerial Ace`) luôn trúng 100%, bỏ qua evasion và accuracy.
     - Chiêu trạng thái nhắm vào đối thủ tôn trọng bảng miễn nhiễm hệ: `Thunder Wave` hoàn toàn vô hiệu (`It had no effect!`) khi dùng lên Pokémon hệ Đất (Ground).
  6. **Chuẩn Hóa Công Thức Sát Thương & Tỉ Lệ Chí Mạng Gen 7 ([battle-engine.ts](file:///e:/Pokemon/apps/web/src/battle/battle-engine.ts)):**
     - Bổ sung hàm làm tròn xuống `Math.floor((2 * level) / 5) + 2` và `baseDmg = Math.floor(...) + 2` chính xác theo công thức gốc.
     - Tỉ lệ chí mạng chuẩn Gen 7: Chiêu thường là $1/24 \approx 4.17\%$ và chiêu có tỉ lệ chí mạng cao (High-crit như `Slash`, `Leaf Blade`) là $1/8 = 12.5\%$, nhân hệ số sát thương chí mạng $\times 1.5$.
     - Chiêu hệ Lửa gây sát thương tự động làm tan băng (`defrosted!`) cho mục tiêu bị đóng băng.
  7. **Cơ Chế Struggle Khi Cạn Kiệt PP ([battle-engine.ts](file:///e:/Pokemon/apps/web/src/battle/battle-engine.ts), [battle-controller.ts](file:///e:/Pokemon/apps/web/src/battle/battle-controller.ts)):**
     - Khi toàn bộ 4 chiêu thức hết PP, cả người chơi và kẻ địch tự động tung chiêu `Struggle` (Đấu Tranh): Sát thương không phụ thuộc hệ, người dùng nhận recoil bằng $25\%$ HP tối đa của bản thân.
  8. **Bonus Trạng Thái Bắt Pokémon & Tích Lũy Bỏ Chạy ([battle-engine.ts](file:///e:/Pokemon/apps/web/src/battle/battle-engine.ts)):**
     - Công thức bắt áp dụng hệ số nhân trạng thái: Ngủ/Đóng băng $\times 2.0$, Tê liệt/Bỏng/Trúng độc $\times 1.5$. Sử dụng lũy thừa căn bậc bốn ($0.25$) chuẩn xác.
     - Bỏ chạy: Tích lũy `fleeAttempts` tăng dần khả năng đào tẩu thành công ($+30$ mỗi lần thất bại).
  9. **Đồng Bộ Dữ Liệu Sau Trận & Thăng Cấp Toàn Diện Chỉ Số ([party-service.ts](file:///e:/Pokemon/apps/web/src/domain/party/party-service.ts), [party-state.ts](file:///e:/Pokemon/apps/web/src/domain/party/party-state.ts), [game-session.ts](file:///e:/Pokemon/apps/web/src/game/game-session.ts)):**
     - Sửa `syncBattleResult`: Định danh Pokémon bằng `uid` duy nhất thay vì tìm lỏng lẻo theo loài hay fallback bừa bãi.
     - Khi lên cấp (Level Up): Tính toán lại toàn bộ 6 chỉ số chiến đấu (`hp`, `attack`, `defense`, `spAtk`, `spDef`, `speed`) dựa trên `baseStats` của loài từ `pokemonCatalog`, bảo lưu lượng máu hiện tại tăng tương ứng với maxHp mới.
     - Bảo toàn `sleepTurns` và trạng thái tích lũy độc khi chuyển đổi giữa Party và Battler.
     - Thống nhất lượng EXP nhận được sau trận bằng hàm `calculateExpYield` chuẩn xác.
  10. **Bổ Sung 100% Bản Dịch Tiếng Việt Cho Toàn Bộ 956 Chiêu Thức ([moves-db.json](file:///e:/Pokemon/packages/game-data/moves-db.json)):**
      - Dịch và chuẩn hóa toàn bộ 135 chiêu thức trước đây còn để nguyên tên tiếng Anh (như `Bestow` → Ban Tặng, `Bulldoze` → San Phẳng, `Endeavor` → Nỗ Lực Tột Cùng, `Endure` → Kiên Cường, `Dual Wingbeat` → Đập Cánh Đôi, `Smelling Salts` → Muối Tỉnh Táo, `Megahorn` → Đại Giác Kích,...).
      - Đảm bảo 100% chiêu thức trong game có tên tiếng Việt tự nhiên, chuẩn phong cách Việt hóa Pokémon.
  11. **Kiểm Thử Toàn Diện (Unit Tests):**
      - Bổ sung test suite `Gen 7 Battle Engine Rules & Edge-case Validations` với đầy đủ các ca kiểm thử cho từng lỗi P0, P1, P2. Toàn bộ 39 tests của hệ thống trận đấu chạy pass $100\%$ không lỗi.

---



- **Trạng thái:** Đã hoàn thành 100% tinh chỉnh theo phản hồi của người dùng: loại bỏ toàn bộ khung viền / bóng đổ tự render quanh Box Window, ẩn các nút mũi tên tự vẽ để hiển thị mũi tên pixel gốc từ wallpaper `box_X.png`, tăng kích thước tiêu đề Hộp và loại bỏ hoàn toàn dòng số lượng `(0/30)`.
- **Chi tiết đã thực hiện:**
  1. **Loại bỏ hình vuông / khung viền tự render quanh Box ([style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Xóa bỏ `border: 2px solid #2d3748;`, `box-shadow: 0 8px 24px rgba(0, 0, 0, 0.8);` và `border-radius: 6px;` tại `.storage-box-window`.
     - Chuyển `background` về `transparent` hoàn toàn, giúp màn hình hiển thị trực tiếp và ăn khớp tuyệt đối với bức tranh nền phòng PC `Graphics/Storage/bg.png` mà không bị viền hộp nhân tạo cắt ngang.
  2. **Ẩn các phần mũi tên tự vẽ đè lên wallpaper ([storage-screen.ts](file:///e:/Pokemon/apps/web/src/ui/storage-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Xóa bỏ ký tự `‹‹` và `››` cùng nền xám bo góc của `.storage-nav-btn`.
     - Chuyển nút về dạng vùng bấm trong suốt (`background: transparent; border: none; color: transparent; font-size: 0;`) đặt khớp lên vị trí 2 mũi tên pixel-art đã có sẵn trên banner `box_X.png`. Người chơi vẫn bấm hoặc rê chuột để chuyển Hộp mượt mà mà không còn bị nút xám nhân tạo che mất hình ảnh gốc.
  3. **Loại bỏ khung nền ở tiêu đề "Hộp 1", tăng kích thước chữ & bỏ `(0/30)`:**
     - Xóa bỏ nền xám viền trắng của container `.storage-box-title` (`background: transparent; border: none; box-shadow: none;`).
     - Tăng kích thước chữ của Tên hộp từ `12px` lên `17px`, in đậm `font-weight: 900;` với hiệu ứng đổ bóng pixel nổi bật `text-shadow: 0 2px 4px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.9);`.
     - Xóa bỏ hoàn toàn phần hiển thị `(0/30)` khỏi DOM và hàm cập nhật `renderCurrentBox`.
  4. **Tái thiết kế Nút Thoát PC thành chuẩn Pixel-Art ([storage-screen.ts](file:///e:/Pokemon/apps/web/src/ui/storage-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Thay thế nút đỏ bo tròn hiện đại bằng nút Pixel phong cách GBA/Essentials:
       - Font chữ retro `VT323` kích thước `18px`, viền đổ bóng 4 hướng chuẩn pixel (`text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000`).
       - Nền kẻ sọc scanline xen kẽ 2px đặc trưng (`repeating-linear-gradient`).
       - Khung viền sắc cạnh 2px màu đen sẫm, vát góc nổi khối beveled pixel bằng inset shadow (sáng góc trên, tối góc dưới) cùng drop-shadow phía dưới.
       - Trạng thái hover và active (nhấn xuống) có chuyển động nẩy/nhấn lún tactile sắc nét, hòa hợp 100% với giao diện game retro.
  5. **Tăng độ tương phản & kích thước tiêu đề Hệ thống PC và Đội hình ([style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Sửa chữ "HỆ THỐNG LƯU TRỮ POKÉMON (PC)" từ màu xanh nhạt (#38bdf8, 11px) bị chìm vào nền sang font pixel `VT323` kích thước `19px`, màu trắng sáng `#ffffff` với viền đen 4 hướng nổi bật.
     - Tăng kích thước chữ "ĐỘI HÌNH" lên `16px` font `VT323` màu trắng có viền đen.
     - Cập nhật huy hiệu số lượng `6/6` sang font `VT323` `14px`, nền tối tương phản cao và chữ vàng `#facc15` sắc nét, dễ đọc trên mọi màn hình.
  6. **Mở Rộng Không Gian & Thay Tên Hệ Bằng Icon Type Ở Thanh Trạng Thái ([storage-screen.ts](file:///e:/Pokemon/apps/web/src/ui/storage-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Mở rộng chiều cao khung Storage từ `384px` lên `404px`, điều chỉnh chiều cao mỗi ô Đội hình Party từ `48px` về `44px` (khoảng cách `3px`), loại bỏ hoàn toàn hiện tượng ô số 6 đè lấn lên mép trên của thanh thông tin dưới cùng.
     - Tăng chiều cao thanh thông tin Pokémon phía dưới (`.storage-footer`) từ `26px` lên `34px` rộng rãi, thoáng đãng, cách cụm Box và Party `24px`.
     - Thay thế việc ghi tên hệ dạng chữ (vd: `Fire / Flying`) bằng **Icon Type Pixel-Art** chính thức từ `Graphics/Pokemon/Icons type/types_ico.png` ($24 \times 28\text{px}$), hiển thị biểu tượng ngọn lửa, đôi cánh, giọt nước, chiếc lá... sắc nét kèm tooltip giải nghĩa.
  7. **Chuẩn Hóa Hộp Thoại Hành Động (Action Menu) Sang Phong Cách Pixel Gọn Gàng ([storage-screen.ts](file:///e:/Pokemon/apps/web/src/ui/storage-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Loại bỏ toàn bộ bo tròn góc (`border-radius: 0;`), chuyển hộp thoại và các nút bấm sang dạng khối hộp vuông vức chuẩn đồ họa pixel cổ điển.
     - Xóa bỏ các biểu tượng emoji (📥, 📤, 🔄, 📊, 🗑️, ✕), hiển thị text gọn gàng ("Gửi vào PC", "Rút về Đội hình", "Di chuyển", "Xem chi tiết", "Thả tự do", "Hủy").
     - Thu gọn kích thước bảng menu từ `190px` xuống `140px`, giảm padding và khoảng cách các nút để giao diện thanh thoát, không che khuất màn hình.
     - Sử dụng font chữ pixel `VT323` (15-16px) kèm viền beveled pixel sắc cạnh.
  8. **Áp Dụng Phong Cách Pixel Vuông Vức Cho Giao Diện Tùy Chỉnh Box & Xem Chi Tiết ([style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - **Hộp thoại Tùy chỉnh Box (`.customize-card`):**
       - Chuyển toàn bộ khung viền sang dạng khối hộp vuông vức (`border-radius: 0;`), viền đen kép sắc nét `border: 2px solid #000000;` kèm beveled inset highlight chuẩn retro.
       - Tiêu đề "TÙY CHỈNH HỘP LƯU TRỮ" và nhãn sử dụng font `VT323` (16-18px), viền đổ bóng pixel nổi bật.
       - Nút đóng (`.customize-btn-close`) dạng khối vuông sắc cạnh không bo góc.
       - Ô nhập tên hộp (`.customize-input`) phẳng vuông góc, font `VT323` 17px, viền beveled tương phản cao.
       - Lưới chọn hình nền (`.customize-wallpaper-grid`): Khung vuông vức với thanh cuộn pixel-art tùy biến (thumb xanh viền đen phẳng), các ô wallpaper preview ($50 \times 44\text{px}$) vuông góc 100%, hiệu ứng chọn viền vàng beveled sắc cạnh thay cho bóng mờ mịn.
       - Nút "LƯU THAY ĐỔI" (`.customize-btn.save`) font pixel `VT323`, khung vuông vức nổi khối xúc giác.
     - **Đồng bộ bảng Xem Chi Tiết (`.summary-card`):** Triệt tiêu toàn bộ góc bo tròn (`border-radius: 0;`), chuẩn hóa toàn bộ font chữ chỉ số và chiêu thức sang font pixel `VT323` đồng bộ hoàn hảo.
  9. **Khắc Phục Lỗi Sprite Pokémon Bị Teo Nhỏ/Biến Dạng Trong Bảng Chi Tiết Summary ([storage-screen.ts](file:///e:/Pokemon/apps/web/src/ui/storage-screen.ts), [party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts)):**
     - **Nguyên nhân:** File ảnh front sprite (`Graphics/Pokemon/Front/PIDGEOT.png`,...) là dải hoạt ảnh ngang EBS Gen 5 kích thước rất dài (vd: Pidgeot là $4828 \times 68\text{px}$ gồm 71 frame). Khi nhúng trực tiếp vào thẻ `<img>` với `object-fit: contain` kích thước $80 \times 80\text{px}$, trình duyệt co cả dải $4828\text{px}$ lại khiến chiều cao chỉ còn $\approx 1.1\text{px}$, tạo thành một vạch đỏ mảnh biến dạng.
     - **Giải pháp:**
       - Thay thế thẻ `<img>` bằng thẻ `<canvas class="summary-sprite">` ($80 \times 80\text{px}$).
       - Sử dụng bộ giải mã `PokemonSpriteAnimator` tự động cắt lấy từng frame vuông ($68 \times 68\text{px}$) từ dải EBS và chạy vòng lặp hoạt họa mượt mà ở tốc độ chuẩn 22 FPS.
       - Đồng bộ áp dụng giải pháp cho cả Hộp thoại Xem Chi Tiết của PC Storage (`StorageScreen`) và Đội hình (`PartyScreen`), giúp Pokémon hiển thị to rõ, sắc nét pixel-perfect và có hoạt ảnh động cực kỳ sinh động.
  10. **Mở Rộng Kích Thước Bảng Chi Tiết To Bằng PC ($512 \times 404\text{px}$) & Bổ Sung Thanh Chỉ Số (Stat Bars) Nổi Bật ([storage-screen.ts](file:///e:/Pokemon/apps/web/src/ui/storage-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
      - **Kích thước toàn màn hình PC:** Mở rộng `.summary-card` chiếm trọn vẹn $100\%$ không gian giao diện PC Storage ($512 \times 404\text{px}$), thay thế hoàn toàn giao diện cũ kích thước nhỏ hẹp ($420\text{px}$) bị lọt thỏm ở giữa.
      - **Hệ thống Thanh Chỉ Số (Stat Bars) Nổi Bật:**
        - Áp dụng thanh chỉ số ngang pixel-art cho toàn bộ 6 chỉ số: HP, Tấn công (Attack), Phòng thủ (Defense), Công ĐB (Sp. Atk), Thủ ĐB (Sp. Def), Tốc độ (Speed).
        - Khung rãnh pixel viền đen tương phản cao (`stat-bar-track`), thanh màu beveled nổi khối có hiệu ứng chuyển động mượt mà (`transition: width 0.3s ease`).
        - Mã màu trực quan: HP đổi màu theo % máu (Xanh lá > 50% → Vàng > 20% → Đỏ), Tấn công (Đỏ `#ef4444`), Phòng thủ (Lam `#3b82f6`), Công ĐB (Tím `#a855f7`), Thủ ĐB (Vàng kim `#eab308`), Tốc độ (Xanh ngọc `#06b6d4`).
      - **Bố cục 2 Cột Chuyên Nghiệp:**
        - **Cột trái:** Khung bệ hiển thị Sprite động $96 \times 96\text{px}$, Icon Hệ từ spritesheet, huy hiệu giới tính (♂ xanh / ♀ hồng), thông tin bóng bắt, cấp độ lúc bắt và thanh đo kinh nghiệm (EXP bar).
        - **Cột phải:** Bảng thanh chỉ số chiến đấu và Lưới 2x2 hiển thị 4 chiêu thức với huy hiệu hệ màu chuẩn và số PP đầy đủ.
  11. **Hiển Thị Nút Chiêu Thức Chuẩn battleFightButtons.png, Kho Chiêu Thức Theo Cấp Độ & Kéo Thả Đổi Chiêu ([moves-db.ts](file:///e:/Pokemon/apps/web/src/battle/moves-db.ts), [storage-screen.ts](file:///e:/Pokemon/apps/web/src/ui/storage-screen.ts), [party-service.ts](file:///e:/Pokemon/apps/web/src/domain/party/party-service.ts), [pc-storage-service.ts](file:///e:/Pokemon/apps/web/src/domain/pc/pc-storage-service.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
      - **Nút Chiêu Thức Từ [battleFightButtons.png](file:///e:/Pokemon/Graphics/Battle/battleFightButtons.png):**
        - Render nút chiêu thức kích thước gốc $244 \times 44\text{px}$ qua canvas pixel-art: Cắt chính xác lát cắt theo 19 hệ tương ứng (`Normal` = 0, `Fighting` = 1, ..., `Fairy` = 18).
        - Vẽ tên chiêu thức và chỉ số `PP: X/Y` trên font `VT323` có viền đen sắc nét, tự động thu nhỏ cỡ chữ nếu tên chiêu thức dài để không che icon hệ và PP.
        - Tích hợp trạng thái Hover bằng lát cắt cột phải ($x = 244$) của spritesheet.
      - **Kho Chiêu Thức Mở Khóa Theo Level (Level-up Move Pool):**
        - Thêm hàm `getAvailableLevelUpMoves(speciesKey, level)` tra cứu learnset của Pokémon từ `pokemon-db.json` với điều kiện `move.level <= level`. Ví dụ: Pokémon cấp 100 sẽ tự động mở khóa toàn bộ danh sách chiêu thức từ cấp 1 đến 100 của loài đó.
        - Hiển thị danh sách cuộn pixel-art sắc nét, mỗi chiêu thức đi kèm huy hiệu `Lv.X`, nút chiêu thức chuẩn hệ, và huy hiệu `[ĐANG DÙNG]` nếu chiêu đang nằm trong 4 ô trang bị.
      - **Cơ Chế Kéo Thả (Drag & Drop) & Đổi Chiêu Nhanh:**
        - Cho phép kéo thả trực tiếp một chiêu từ kho vào bất kỳ ô nào trong 4 ô chiêu thức chính để thay thế hoặc học chiêu mới.
        - Cho phép kéo thả hoán đổi vị trí thứ tự giữa 4 ô chiêu thức chính.
        - Hỗ trợ click trực tiếp vào chiêu thức trong kho để trang bị nhanh vào ô trống hoặc thay thế ô đầu tiên.
        - Tự động lưu tức thì chiêu thức mới vào dữ liệu Đội hình (`PartyService`) hoặc Hộp lưu trữ PC (`PcStorageService`), đi kèm âm thanh giao diện `PC access.ogg` và thông báo thành công.
  12. **Mở Rộng Giao Diện Chi Tiết (Summary), Tách Kho Chiêu Sang Layout Riêng Bên Phải & Loại Bỏ Số 1 2 3 4 ([storage-screen.ts](file:///e:/Pokemon/apps/web/src/ui/storage-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
      - **Mở Rộng Kích Thước Bảng Chi Tiết ($780 \times 415\text{px}$):**
        - Tách modal chi tiết thành bố cục 2 panel chữ nhật song song ngang tầm, có viền kép đen, beveled inset highlight chuẩn retro và đổ bóng nổi khối $16\text{px}$.
        - Tự động co dãn theo viewport (`transform: scale(...)` kết hợp `@media` query), đảm bảo tương thích mọi độ phân giải màn hình mà không bao giờ bị tràn cạnh.
      - **Tách Kho Chiêu Thức Sang Layout Chữ Nhật Riêng Bên Phải (`.summary-pool-panel`):**
        - Layout hình chữ nhật độc lập kích thước $255 \times 415\text{px}$ bên phải, có header riêng "KHO CHIÊU THỨC (≤ Lv.X)", nhãn hướng dẫn và nút "✕ ĐÓNG".
        - Danh sách kho chiêu thức chiếm trọn chiều cao cột, cuộn dọc êm ái, mỗi thẻ chiêu thức hiển thị huy hiệu cấp mở khóa `Lv.X`, nút bấm theo hệ chuẩn và huy hiệu trạng thái `[ĐANG DÙNG]`.
      - **Tối Ưu Giao Diện Chi Tiết Chính Thoải Mái & Loại Bỏ Số 1 2 3 4:**
        - Giải phóng toàn bộ diện tích cho Panel chính bên trái ($510\text{px}$): Bảng chỉ số chiến đấu và 4 ô chiêu thức trang bị có khoảng cách thoáng đãng, kích thước nút lớn hơn ($29\text{px}$ chiều cao) và hiệu ứng hover sáng viền xanh ngọc.
        - Loại bỏ hoàn toàn các huy hiệu số `1`, `2`, `3`, `4` trên các ô chiêu thức theo đúng yêu cầu; hiển thị nhãn `+ Ô trống` tinh tế khi chưa có chiêu thức.
  13. **Nâng Cấp Hệ Thống Kéo Thả Chiêu Thức (Dual Pointer & HTML5 Drag) & Hover Màu Vàng ([storage-screen.ts](file:///e:/Pokemon/apps/web/src/ui/storage-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
      - **Cơ Chế Kéo Thả Con Trỏ Toàn Diện (Pointer Drag System):**
        - Tích hợp hệ thống theo dõi tọa độ con trỏ chuột (`pointerdown`, `pointermove`, `pointerup` và `document.elementFromPoint`) tương tự cơ chế kéo thả Pokémon trong PC, hoạt động mượt mà 100% trên mọi nền tảng trình duyệt (kể cả khi giao diện áp dụng `transform: scale` và `user-select: none`).
        - Hiển thị bóng mờ kéo thả sinh động (`.move-drag-ghost`): Nút chiêu thức bay theo con trỏ chuột, tự động nhận diện và làm sáng ô chiêu thức đích (`.drag-over`) khi rê chuột qua.
        - Tự động thả và trang bị/đổi vị trí khi nhả chuột, đồng thời vẫn giữ nguyên tương thích HTML5 drag & drop tiêu chuẩn.
      - **Bỏ Chữ "ĐANG DÙNG" & Hiệu Ứng Hover Màu Vàng Rực Rỡ:**
        - Loại bỏ hoàn toàn nhãn chữ `[ĐANG DÙNG]` khỏi danh sách kho chiêu thức theo đúng yêu cầu.
        - Khi di chuột qua chiêu thức, thẻ bài phát sáng rực rỡ với viền vàng pixel `#facc15` (`box-shadow: 0 0 8px rgba(250, 204, 21, 0.6)`).
        - Chiêu thức đang trang bị có viền xanh lá tinh tế bên trái (`border-left: 3px solid #22c55e`), mở rộng chiều ngang nút chiêu thức lên tối đa $175\text{px}$ sắc nét.
      - **Nâng Cao Vị Trí Cụm Chiêu Thức Trang Bị:**
        - Đẩy cụm Chiêu thức trang bị lên cao tổng cộng $80\text{px}$ (`margin-bottom: 80px`) tạo bố cục cân đối, hài hòa tuyệt đối với bảng chỉ số phía trên.
  14. **Bảng Thông Tin Chi Tiết Chiêu Thức Khi Nhấp Chuột Từ Database ([storage-screen.ts](file:///e:/Pokemon/apps/web/src/ui/storage-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
      - **Bảng Thông Tin Chi Tiết Chiêu Thức (Move Detail Card):**
        - Khi nhấp chuột vào bất kỳ chiêu thức nào (ở 4 ô trang bị hoặc trong danh sách kho chiêu thức), một bảng/card retro pixel GBA sắc nét sẽ mở ra nổi bật ngay giữa màn hình Summary Modal.
        - Phân biệt tách bạch giữa thao tác Kéo thả (để trang bị / sắp xếp) và Nhấp chuột (để xem chi tiết dữ liệu chiêu).
      - **Hiển Thị Đầy Đủ Thuộc Tính Chiêu Thức Từ Database (`MOVES_DB`):**
        - **Tên Chiêu Thức:** Tên tiếng Việt rõ nét màu vàng `#facc15` kèm tên tiếng Anh phụ đề (ví dụ: `Tia Sét (Thunderbolt)`).
        - **Hệ Chiêu Thức & Phân Loại (Sprite Category Chuẩn):** 
          - Biểu tượng Icon Hệ từ spritesheet `types_ico.png` + tên hệ tiếng Việt (`ĐIỆN`, `NƯỚC`, `LỬA`...).
          - **Icon Loại Chiêu Thức Chuẩn GBA ([category.png](file:///e:/Pokemon/Graphics/Move/status%20move/category.png)):** 
            - Cắt chính xác vùng pixel thực tế $56 \times 28\text{px}$ (bỏ 4px lề trong suốt 2 bên của spritesheet $64\text{px}$) với `background-position: -4px Ypx`:
              - Physical: `-4px 0` (Vụ nổ mặt trời đỏ cam).
              - Special: `-4px -28px` (Sóng năng lượng xanh lam).
              - Status: `-4px -56px` (Vòng âm dương xám bạc).
            - **Loại bỏ hoàn toàn viền và khung chữ nhật mờ:** Xóa bỏ `background: rgba(...)`, `border` và `box-shadow` thừa quanh wrapper, giúp icon hiển thị trong suốt, phẳng mịn và sắc nét 100% không còn bất kỳ vệt khung chữ nhật mờ nào.
        - **Bộ 3 Chỉ Số Cốt Lõi:**
          - **SỨC MẠNH (Power):** Số nguyên nổi bật màu cam (hoặc `--` nếu là đòn trạng thái/power 0).
          - **ĐỘ CHÍNH XÁC (Accuracy):** Tỷ lệ % màu xanh lam (hoặc `--` nếu không trượt).
          - **ĐIỂM PP (Power Points):** Số lần sử dụng hiện tại / tối đa màu vàng sáng.
        - **Khung Mô Tả Chiêu Thức Tiếng Việt:** Lấy toàn văn dòng giải thích công dụng, hiệu ứng phụ từ database game (`dbMove.description`).
      - **Tương Tác & Điều Khiển Trực Quan:**
        - Đóng bảng nhanh chóng bằng nút `✕`, nhấp chuột ra ngoài vùng tối của popup, hoặc nhấn phím `ESC`. Khi mở bảng chi tiết chiêu, phím `ESC` ưu tiên đóng bảng chiêu trước mà không thoát modal Summary.

---

## Cập nhật lần cuối: 2026-10-07 (Hệ Thống PC Storage, Tự Động Chuyển Khi Đầy Party & Chuẩn Hóa Icon Pokémon)

### 0.41. Xây Dựng Hệ Thống PC Storage & Chuẩn Hóa Cắt Khung Phóng To Icon Pokémon:

- **Trạng thái:** Đã hoàn thành 100% hệ thống PC Storage 24 Box (sức chứa 720 Pokémon) theo chuẩn Graphics/Storage, tích hợp tự động chuyển vào PC khi đầy party (6/6), đồng thời khắc phục triệt để lỗi icon Pokémon hiển thị 2 khung hình dính liền, cắt chuẩn 1 khung hình đơn và phóng to sắc nét pixel-perfect kèm hoạt ảnh 2 frame sinh động. Toàn bộ CI PASS 100% (109/109 tests).
- **Chi tiết đã thực hiện:**
  1. **Khắc phục lỗi Icon Pokémon hiển thị 2 khung hình cạnh nhau:**
     - Ảnh icon Pokémon gốc từ `Graphics/Pokemon/Icons/${speciesKey}.png` có tỷ lệ $2:1$ ($128 \times 64\text{px}$) gồm 2 frame hoạt họa $64 \times 64\text{px}$ đặt cạnh nhau.
     - Trước đó, thẻ `img` dùng `object-fit: contain` khiến cả 2 frame bị thu nhỏ cùng lúc thành $40 \times 20\text{px}$, làm mỗi Pokémon bị teo nhỏ và hiện 2 chú Pokémon song song trong ô.
     - **Giải pháp:**
       - **Ô lưu trữ Box (6x5 Grid):** Bọc icon trong container `.storage-grid-icon-wrap` kích thước $44 \times 44\text{px}$ (`overflow: hidden`), đặt ảnh bên trong có chiều rộng $88\text{px}$ ($200\%$) và chiều cao $44\text{px}$ (`image-rendering: pixelated; crisp-edges`). Nhờ đó icon phóng to hơn gấp 2.2 lần, chỉ hiển thị đúng 1 frame Pokémon sắc nét.
       - **Ô Party bên trái PC:** Cập nhật `.party-slot-icon-box` ($42 \times 42\text{px}$) và `.party-slot-icon` ($84 \times 42\text{px}$) chuẩn 1 frame phóng to rõ nét.
       - **Hoạt họa 2-Frame kinh điển (@keyframes `pokemon-icon-step`):** Tự động chuyển đổi mượt mà giữa Frame 1 và Frame 2 khi di chuột qua (`:hover`) hoặc khi đang nhấc di chuyển (`.held`), tái hiện trọn vẹn cử động nhún nhảy đặc trưng của Pokémon trong hệ thống PC Essentials.
  2. **Hỗ Trợ Kéo Thả Chuột Toàn Diện (Custom Pointer Drag & Drop):**
     - Chuyển đổi hoàn toàn từ HTML5 Drag sang cơ chế **Pointer Drag & Drop tuỳ biến** (`pointerdown`, `pointermove`, `pointerup`): khắc phục triệt để vấn đề trình duyệt Chromium/Windows chặn sự kiện kéo khi container có `user-select: none` hoặc `transform: scale(1.4)`.
     - **Triệt tiêu hiện tượng giật rung khi kéo:** Loại bỏ `@keyframes` xung đột trên container `.storage-drag-ghost` (trước đó làm ghi đè `translate(-50%, -50%)`), giúp icon bay êm ái, bám chặt và cố định chính xác dưới con trỏ chuột.
     - **Tối ưu hóa hiệu năng hover:** Quản lý `currentHoverSlot` để tránh xóa và thêm lại class `.drag-over` liên tục ở mỗi khung hình di chuyển chuột.
     - **Hỗ trợ kéo thả vào ô trống linh hoạt:**
       - Nâng cấp `swapPartyAndBox` và `partyService.swapPokemon`: Cho phép kéo Pokémon từ Box thả vào bất kỳ ô Party còn trống nào (kể cả ô 2, 3, 4, 5 khi đội hình chưa đủ 6 con) để rút về ngay lập tức.
       - Cho phép kéo Pokémon từ Party thả vào bất kỳ ô trống nào trong Box để cất giữ.
       - Cho phép sắp xếp thứ tự Pokémon trong Party kể cả khi thả vào ô trống phía sau.
     - **Tương thích hoàn hảo con trỏ chuột Pokémon:** Tự động chuyển đổi con trỏ bàn tay mở `boxgrab.PNG` khi rê vào và bàn tay nắm `boxfist.PNG` khi đang kéo.
     - **Lật Hộp thông minh:** Giữ và rê Pokémon qua 2 nút `<<` hoặc `>>` trong 450ms để tự động chuyển sang Hộp khác.
     - **Tách biệt Click và Drag:** Nhấp chuột thông thường (<5px) vẫn mở menu hành động đầy đủ mà không bị kích hoạt nhầm kéo thả.
  3. **Kiến Trúc Hệ Thống PC Storage (720 Pokémon):**
     - Quản lý 24 Hộp lưu trữ (mỗi hộp 30 ô), hỗ trợ Rút về (Withdraw), Gửi vào (Deposit), Di chuyển/Đổi chỗ (Move/Swap), Thả tự do (Release) và Đổi tên / Chọn 39 hình nền Wallpaper đặc sắc.
     - Tự động phát hiện khi Đội hình đầy 6/6 Pokémon, đưa Pokémon mới bắt thẳng vào ô trống đầu tiên trong PC kèm thông báo toast điều hướng.
     - Tích hợp phím tắt `C` và nút "PC Storage" trong Game Overlay Menu.
  4. **Kiểm thử tự động & CI:**
     - Bổ sung test case kiểm tra kéo/thả vào ô trống Party và ô trống Box qua `moveOrSwap`.
     - 111/111 tests Vitest PASS 100%, linter & format chuẩn, Vite build production thành công.

---

## Cập nhật lần cuối: 2026-10-07 (Hoạt Ảnh Databox Trượt Ra Mép Màn Hình Khi Phóng To Bắt Bóng)

### 0.40. Đồng Bộ Hoạt Ảnh Trượt Databox Ra Mép Màn Hình Khi Phóng To Bắt Bóng:

- **Trạng thái:** Đã hoàn thành 100% theo đúng yêu cầu người dùng: thay vì làm thanh bar biến mất đột ngột và để sót text nổi trên màn hình, cả 2 thanh bar (hình nền, thanh máu, huy hiệu trên Canvas) cùng toàn bộ chữ DOM (tên, giới tính, cấp độ, số máu) đều trượt mượt mà ra ngoài 2 mép màn hình khi phóng to, và trượt mượt mà trở lại khi zoom out. Toàn bộ CI PASS 100% (102/102 tests).
- **Chi tiết đã thực hiện:**
  1. **Khắc phục hiện tượng chữ nổi lơ lửng khi thanh bar biến mất:**
     - Trước đây canvas có lệnh `if (state.captureZooming) return;` làm biến mất đột ngột canvas databox nhưng không cập nhật `BattleTextOverlay` (DOM), dẫn tới tên, giới tính, cấp độ và số máu vẫn hiện nổi lơ lửng.
  2. **Hoạt ảnh trượt mượt mà 2 chiều ra 2 mép màn hình ([battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts), [battle-text-overlay.ts](file:///e:/Pokemon/apps/web/src/battle/battle-text-overlay.ts)):**
     - Thay vì ẩn tức thời, tiến trình `captureZoomProgress` chuyển động mượt mà 2 chiều (+0.04 khi zoom in, -0.04 khi zoom out):
       - **Enemy Databox (trên bên trái):** Trượt mượt mà sang mép trái ra khỏi màn hình (canvas offset -300px, DOM transform `translateX(-130%)`).
       - **Player Databox (dưới bên phải):** Trượt mượt mà sang mép phải ra khỏi màn hình (canvas offset +280px, DOM transform `translateX(130%)`).
     - Khi bắt hụt bóng hoặc kết thúc zoom, cả 2 thanh bar cùng lướt êm ái trở lại vị trí cũ trên màn hình.
     - Khung thông báo và chữ tin nhắn ở bảng điều khiển dưới được giữ nguyên vẹn trong suốt quá trình ném và bắt bóng.
  3. **Kiểm thử tự động:**
     - Bổ sung test case Vitest xác nhận độ trượt chính xác của DOM text overlay và camera zoom.
     - 102/102 test unit PASS 100%, build production thành công.

---

## Cập nhật lần cuối: 2026-10-07 (Cơ Sở Dữ Liệu Pokéball, Hoạt Ảnh Bắt Bóng, Quản Lý Di Chuyển Chiêu Thức & Fix Lỗi Camera Zoom)

### 0.39. Hoàn Thiện Hệ Thống Pokéball, Quản Lý Hoạt Ảnh Chiêu Thức & Khắc Phục Lỗi Camera Zoom:

- **Trạng thái:** Đã hoàn thành 100% kiểm tra tài nguyên hình ảnh, logic ném bắt bóng, xóa bỏ code dư thừa và khắc phục triệt để lỗi Camera Zoom khi bắt hụt. Toàn bộ CI PASS 100% (101/101 tests, 275/275 asset manifest parity).
- **Chi tiết đã thực hiện:**
  1. **Khắc phục lỗi Camera kẹt Zoom khi bắt hụt Pokémon ([battle-controller.ts](file:///e:/Pokemon/apps/web/src/battle/battle-controller.ts), [battle-state.ts](file:///e:/Pokemon/apps/web/src/battle/battle-state.ts)):**
     - Đã thêm lệnh reset triệt để `captureZooming = false; captureZoomProgress = 0;` trong nhánh thất bại của `handleThrowBall()` và trong `startBallThrow()`.
     - Loại bỏ hoàn toàn lỗi kẹt camera ở góc cận 1.4x và lỗi biến mất Databox/thanh lệnh khi người chơi ném hụt bóng.
  2. **Dọn dẹp mã nguồn không cần thiết:**
     - Xóa bỏ thuộc tính `ballButtonGlowTimer` và các hàm setTimeout liên quan theo yêu cầu.
  3. **Kiểm tra và chuẩn hóa toàn bộ tài nguyên Pokéball:**
     - Bổ sung file `ball_BEASTBALL_closed.png` (cắt chuẩn từ frame 0) giúp 26/26 loại bóng có đủ 3 file hình ảnh: dải xoay bay ($256 \times 64$), mở nắp ($32 \times 64$), đóng trên đất ($32 \times 64$).
     - Bổ sung `CHERISHBALL` vào bộ nhận diện `normalizeBallKey()`.
     - Đăng ký đầy đủ 78 asset keys của 26 loại bóng vào [manifest.json](file:///e:/Pokemon/apps/web/public/assets/manifest.json) để hỗ trợ cache/preload.
  4. **Kiểm thử tự động & CI:**
     - Thêm test case xác thực toàn bộ 26 loại bóng trong `POKEBALL_DB` và test case mô phỏng reset zoom khi bắt hụt trong [battle.test.ts](file:///e:/Pokemon/apps/web/test/battle.test.ts).
     - 101/101 test unit Vitest PASS 100%, build production thành công.

---

## Cập nhật lần cuối: 2026-10-06 (Phân Loại Chiêu Thức, Cơ Chế Hồi Máu, Đòn Hút Máu, Phản Sát Thương & Hiệu Ứng Phụ Trạng Thái)

### 0.38. Phân Loại Chiêu Thức, Cơ Chế Hồi Máu, Đòn Hút Máu & Phản Sát Thương Chuẩn Pokémon:

- **Trạng thái:** Đã hoàn thành kiểm tra và hoàn thiện 100% logic cho toàn bộ các nhóm kỹ năng (vật lý, đặc biệt, trạng thái, hồi phục máu, hút máu, phản đòn). Toàn bộ test suite và quy trình CI PASS 100% (98/98 tests).
- **Chi tiết đã thực hiện:**
  1. **Phân Loại Chiêu Thức & Animation Chuyển Động ([battle-state.ts](file:///e:/Pokemon/apps/web/src/battle/battle-state.ts)):**
     - Đòn **Vật lý (Physical)**: Kích hoạt hoạt ảnh nhích tới (`lunge`) về phía đối thủ khi tấn công.
     - Đòn **Đặc biệt (Special)** & **Trạng thái (Status)**: Không kích hoạt lunge, giữ vị trí cố định trên sàn đấu. Hệ thống kiến trúc mở cho phép bổ sung hoạt ảnh chuyên biệt trong tương lai.
  2. **Hiệu Ứng Phụ Trạng Thái Trên Đòn Tấn Công Vật Lý / Đặc Biệt ([battle-engine.ts](file:///e:/Pokemon/apps/web/src/battle/battle-engine.ts)):**
     - Áp dụng chuẩn logic Pokémon: Hiệu ứng phụ (như tỉ lệ gây bỏng của Flamethrower, tê liệt của Thunderbolt/Body Slam, độc của Sludge Bomb) chỉ được tính toán và áp dụng khi đối thủ **chưa bị hạ gục** (`!defenderFainted`).
     - Mục tiêu chưa có trạng thái bất lợi nào trước đó (`target.status === 'none'`).
     - Tuân thủ miễn nhiễm theo hệ (`getStatusImmunity`): Hệ Lửa không bị bỏng, Hệ Điện không bị tê liệt, Hệ Độc/Thép không bị trúng độc, Hệ Băng không bị đóng băng.
  3. **Cơ Chế Kỹ Năng Hút Máu (Drain Moves):**
     - Bổ sung `drainPercent` vào cơ sở dữ liệu `moves-db.json` và [battle/types.ts](file:///e:/Pokemon/apps/web/src/battle/types.ts):
       - 50% sát thương gây ra: _Absorb, Mega Drain, Giga Drain, Leech Life, Drain Punch, Horn Leech, Parabolic Charge, Bitter Blade, Bouncy Bubble_.
       - 75% sát thương gây ra: _Draining Kiss, Oblivion Wing_.
     - Hồi máu cho kẻ tấn công tương ứng theo lượng sát thương thực tế gây ra (tối đa bằng Max HP), kèm thông báo chuẩn: `${defender.name} had its energy drained!`.
  4. **Cơ Chế Kỹ Năng Phản Sát Thương (Recoil Moves):**
     - Bổ sung `recoilPercent`:
       - 25% sát thương: _Take Down, Submission_.
       - 33% (1/3) sát thương: _Double-Edge, Brave Bird, Flare Blitz, Wood Hammer, Volt Tackle_.
       - 50% sát thương: _Head Smash_.
     - Khấu trừ lượng máu của Pokémon ra đòn, kích hoạt fainted nếu HP tụt về 0 và thông báo: `${attacker.name} is hit with recoil!`.
  5. **Cơ Chế Hồi Máu & Khắc Phục Lỗi Thanh HP Chưa Đồng Bộ ([battle-state.ts](file:///e:/Pokemon/apps/web/src/battle/battle-state.ts), [battle-controller.ts](file:///e:/Pokemon/apps/web/src/battle/battle-controller.ts)):**
     - **Nguyên nhân lỗi cũ:** Trước đây trong `battle-state.ts` chỉ có logic giảm trừ HP (`if (playerHpPct > targetPlayerHpPct)`), hoàn toàn thiếu nhánh tăng HP khi hồi máu (`else if (playerHpPct < targetPlayerHpPct)`). Đồng thời trong `battle-controller.ts`, sau khi ra đòn tấn công thì chỉ gán `targetEnemyHpPct` mà quên cập nhật `targetPlayerHpPct` cho Pokémon dùng chiêu hồi máu/hút máu/recoil.
     - **Khắc phục triệt để:**
       - Bổ sung lerp tăng tiến 2 chiều cho cả `playerHpPct` và `enemyHpPct` (+0.016 mỗi frame ~ 60fps), giúp thanh máu xanh cuộn đầy mượt mà khi hồi máu.
       - Đồng bộ thanh ghost bar vàng cam: khi hồi máu, `ghostPlayerHpPct` và `ghostEnemyHpPct` tự động bắt kịp và giữ nguyên vẹn với thanh xanh, loại bỏ triệt để hiện tượng vệt màu bào mòn cũ bị kẹt lại.
       - Cập nhật cả `targetPlayerHpPct` và `targetEnemyHpPct` sau mỗi lượt ra đòn của cả Player lẫn Enemy.
       - Khởi tạo `ghostPlayerHpPct` và `ghostEnemyHpPct` theo đúng HP ban đầu của Pokémon khi bắt đầu trận đấu trong `battle-screen.ts`.
     - Kỹ năng **Rest (Nghỉ ngơi)**:
       - Nếu HP đã đầy: Kỹ năng thất bại (`But it failed! ${attacker.name}'s HP is already full!`).
       - Nếu đang mất máu: Xóa bỏ hoàn toàn mọi trạng thái bất lợi cũ (bỏng, trúng độc, tê liệt...), đưa vào trạng thái ngủ 2 lượt (`sleepTurns = 2`), phục hồi 100% Max HP và thanh HP cuộn đầy mượt mà lên 100%.
  6. **Đồng Bộ HP & Trạng Thái Thời Gian Thực Với Party ([party-service.ts](file:///e:/Pokemon/apps/web/src/domain/party/party-service.ts)):**
     - Khi Pokémon bị mất máu hoặc được hồi máu trong trận đấu, PartyState được cập nhật ngay lập tức.
     - Khi dùng vật phẩm hồi máu hoặc hồi sinh trong giao diện Party, thanh máu và trạng thái trong trận đấu tự động đồng bộ theo thời gian thực.
  7. **Hiển Thị Bậc Chỉ Số Tăng Giảm (Stat Stage Modifiers):**
     - Hiển thị huy hiệu chỉ số kèm mũi tên/màu sắc (tăng: xanh lá/vàng, giảm: đỏ/cam) ngay phía dưới thanh HP bar, đẩy xuống 5px tạo khoảng cách thoáng đãng, sắc nét.
- **Kiểm thử & CI:**
  - 14/14 test suites (99/99 tests) Vitest PASS 100%.
  - `npm run ci` PASS 100% (Validate schemas, ESLint, Prettier, TypeScript, Vitest, Vite production build).

---

## Cập nhật lần cuối: 2026-10-06 (Cơ Chế Trạng Thái Trận Đấu, Cắt & Bố Trí Icon Statuses Trên Thanh HP Bar)

### 0.37. Cơ Chế Trạng Thái Trận Đấu & Bố Trí Icon Trạng Thái Trên Thanh Bar:

- **Trạng thái:** Đã rà soát toàn bộ logic, sửa các lỗi tiềm ẩn, chuẩn hóa tọa độ cắt ảnh `icon_statuses.png` và bố trí hiển thị hoàn chỉnh trên thanh HP bar. Toàn bộ CI PASS 100% (89/89 tests).
- **Rà soát & Hoàn thiện Logic Trạng thái:**
  1. **Kháng Trạng Thái Theo Hệ (Type Immunities):** Hệ Lửa miễn nhiễm Cháy (`burn`), Hệ Điện miễn nhiễm Tê liệt (`paralysis`), Hệ Độc & Thép miễn nhiễm Trúng độc (`poison` / `toxic`), Hệ Băng miễn nhiễm Đóng băng (`freeze`).
  2. **Hiệu Ứng Phụ Trên Chiêu Thức Tấn Công (Secondary Effects):** Đã sửa lỗi thiếu sót khiến các đòn tấn công vật lý/đặc biệt (như Flamethrower, Thunderbolt, Sludge Bomb) không thể gây trạng thái. Giờ đây hiệu ứng phụ trạng thái và thay đổi chỉ số phụ được kiểm tra và kích hoạt chính xác theo tỉ lệ xác suất sau khi gây sát thương.
  3. **Thông Báo Tỉnh Ngủ & Tan Băng:** Bổ sung tiền tố thông báo rõ ràng khi Pokémon thức giấc (`woke up`) hoặc tan băng (`thawed out`) trước khi ra đòn trong lượt đó.
  4. **Chu Kỳ Trừ Máu Cuối Lượt (End-of-Round Phase Lifecycle):** Chuyển việc kích hoạt sát thương cuối lượt (Cháy: 1/16 Max HP, Độc thường: 1/8 Max HP, Độc nặng Toxic: tăng tiến n/16 Max HP) về đúng thời điểm cuối hiệp sau khi cả 2 Pokémon đã hoàn thành lượt đánh thay vì trừ máu trước khi đối thủ kịp ra đòn.
- **Chuẩn Hóa Cắt Ảnh [icon_statuses.png](file:///e:/Pokemon/Graphics/Battle/icon_statuses.png):**
  - Kích thước ảnh gốc: **44 x 96 px**, gồm 6 khung hình dọc, mỗi icon có kích thước chuẩn **44 x 16 px**:
    - Row 0 (sy: 0): `SLP` (Sleep - xám)
    - Row 1 (sy: 16): `PSN` (Poison - hồng cánh sen)
    - Row 2 (sy: 32): `BRN` (Burn - cam đỏ)
    - Row 3 (sy: 48): `PAR` (Paralysis - vàng)
    - Row 4 (sy: 64): `FRZ` (Freeze - xanh lam)
    - Row 5 (sy: 80): `PSN` (Toxic / Badly Poisoned - tím sẫm)
  - Khắc phục lỗi cắt cụt một nửa icon (`sw = 22`) và ánh xạ sai hàng của trạng thái Toxic.
- **Bố Trí Hiển Thị Trên Thanh HP Bar ([battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts)):**
  - **Enemy Databox:** Tọa độ `x = 83, y = 37`, scale `0.75` (kích thước hiển thị 33x12 px), đặt vừa khít ngay trước vạch máu HP, che phủ tự nhiên nhãn "PS" khi có trạng thái.
  - **Player Databox:** Tọa độ `dx + 101, dy + 37`, scale `0.75` (kích thước hiển thị 33x12 px), nằm ngay trước vạch máu HP, giữ khoảng cách thoáng đãng với tên Pokémon.

---

## Cập nhật lần cuối: 2026-10-05 (Hoàn Thiện Animation Trận Đấu, Freeze Sprite Khi Faint, Fix RNG & CI Checkpoint)

### 0.36. Hoàn Thiện Animation Trận Đấu, Đóng Băng Sprite Khi Faint, Fix RNG & CI Checkpoint:

- **Trạng thái:** Đã hoàn thành toàn bộ yêu cầu, toàn bộ test suite và quy trình CI đạt 100%.
- **Chi tiết đã thực hiện:**
  1. **Hiệu Ứng Đòn Đánh, Trừ Máu & Chuyển Động Trận Đấu:**
     - Animation tấn công (`lunge`): Pokémon lao nhẹ về phía đối thủ khi ra đòn và bật lùi về vị trí cũ.
     - Hiệu ứng trúng đòn: giật lùi (`knockback`), rung lắc chấn động (`jitter`), và nhấp nháy sát thương đỏ/trắng.
     - Thanh máu trừ mượt mà (smooth HP drain) đi kèm thanh vàng/cam (`ghost bar`) hiển thị phần máu vừa mất và đếm ngược số HP người chơi theo thời gian thực.
  2. **Hiệu Ứng Faint Chuẩn Xác (Không Glow/Bloom):**
     - Pokémon hoang dã gục ngã: chuyển đỏ nhẹ -> biến thành hình bóng trắng phẳng 100% (Solid White Silhouette qua Canvas `source-in`, không bị glow hay nhòe viền) -> phân rã từ trên xuống dưới dạng hạt bụi (`organic dithered dissolve`) trong 80 frames (~1.33s) với 40 hạt bụi stardust mịn bay lên theo sóng hình sin.
     - Bục đứng (`base platform`) của Pokémon hoang dã được tách thành render pass độc lập (`drawEnemyBase`), luôn được giữ nguyên vị trí trên sàn đấu ngay cả khi Pokémon đã tan biến hoàn toàn.
     - Pokémon người chơi gục ngã: chuyển sang màu trắng phẳng, thu nhỏ dần đều về phía bục đứng cùng hiệu ứng tia thu hồi bóng đỏ.
  3. **Đóng Băng Mọi Hoạt Ảnh Khi Faint (Freeze Animations):**
     - Khóa cứng khung hình sprite tại thời điểm chết (`enemyFrozenFrame` / `playerFrozenFrame`), Pokémon ngừng hoàn toàn việc đổi frame (không đập cánh, không thở, không idle loop).
     - Reset và khóa toàn bộ offset di chuyển, lunge, knockback về 0.
  4. **Chuẩn Hóa RNG Xác Định (Deterministic BattleState RNG):**
     - Thay thế `Math.random()` trong rung chấn (`screenShake`) bằng `BattleRng` / `SeededBattleRng`, cho phép tái lập kết quả thử nghiệm 100%.
     - Bổ sung test case kiểm tra tính tất định trong [test/battle.test.ts](file:///e:/Pokemon/apps/web/test/battle.test.ts).
  5. **Đồng Bộ Định Dạng Mã Nguồn (Prettier) & Kiểm Tra Toàn Diện (CI):**
     - Chạy `prettier --write`, vượt qua `format:check`.
     - `npm run ci` PASS 100%: Schema validation, ESLint, Prettier, TypeScript typecheck, 84 Vitest tests, Vite production build.
     - Xác nhận Save/Load persistence (`test/domain.test.ts` 13/13 tests) và Desktop shell (`test/desktop-shell.test.ts` 5/5 tests + Tauri `cargo check` PASS).

---

## Cập nhật lần cuối: 2026-10-05 (Quản Lý Nhạc Nền Trận Đấu Hoang Dã Battle Wild BGM)

### 0.35. Quản Lý Nhạc Nền Trận Đấu Hoang Dã ([Battle wild.ogg](file:///e:/Pokemon/Audio/Battle/Battle%20wild.ogg)):

- **Trạng thái:** Đã hoàn thành theo yêu cầu của người dùng.
- **Yêu cầu người dùng:** Quản lý và phát âm thanh nhạc nền Audio/Battle/Battle wild.ogg khi bắt đầu đụng độ với Pokémon hoang dã.
- **Chi tiết đã thực hiện:**
  1. **Trình Quản Lý Nhạc Nền Trận Đấu ([battle-bgm.ts](file:///e:/Pokemon/apps/web/src/audio/battle-bgm.ts)):**
     - Xây dựng module BattleBgmPlayer dạng Singleton:
       - Phương thức playWildBattleBgm() : tự động chuẩn hóa đường dẫn, mã hóa ký tự khoảng trắng (Battle%20wild.ogg), bật loop = true và đặt âm lượng mở đầu 70%.
       - Phương thức educeVolume(0.6, 800): tự động giảm âm lượng BGM mượt mà xuống còn 60% sau khi Pokémon hoang dã xuất hiện rõ ràng trên sàn đấu.
       - Phương thức stopBgm(fadeDurationMs = 600): làm nhỏ dần âm lượng (fade-out) êm ái trong 600ms trước khi dừng hẳn và reset thời gian phát, tránh hiện tượng tắt nhạc đột ngột.
  2. **Tích Hợp Vào Chu Trình Đụng Độ ([game-session.ts](file:///e:/Pokemon/apps/web/src/game/game-session.ts)):**
     - Nhạc nền trận đấu được kích hoạt phát ngay khoảnh khắc người chơi đụng độ Pokémon (bắt đầu cùng lúc với hiệu ứng Rung màn hình và Thu vòng tròn Iris Pokéball), mang lại cảm xúc cao trào đúng chuẩn các game Pokémon kinh điển.
  3. **Tự Động Kết Thúc Nhạc Khi Rời Trận Đấu ([battle-screen.ts](file:///e:/Pokemon/apps/web/src/battle/battle-screen.ts)):**
     - Khi trận đấu kết thúc (bắt được, chiến thắng, chạy trốn hoặc thất bại), tại hàm eardown(), nhạc nền tự động fade-out 600ms đồng bộ cùng hiệu ứng mờ dần của giao diện trận đấu.
  4. **Hỗ Trợ Đóng Gói Bundle ([vite.config.ts](file:///e:/Pokemon/apps/web/vite.config.ts)):**
     - Bổ sung quét toàn bộ thư mục Audio/Battle/ trong hàm generateBundle() để đảm bảo tệp nhạc nền luôn được sao chép đầy đủ vào bản build production dist/Audio/Battle/.

---

### 0.34. Hiệu Ứng Chuyển Cảnh Đụng Độ Pokémon Hoang Dã (Wild Encounter Iris Pokéball & Screen Shake):

- **Trạng thái:** Đã hoàn thành theo yêu cầu chi tiết của người dùng.
- **Yêu cầu người dùng:** Khi chạm trán Pokémon hoang dã (hoặc đụng trong bụi cỏ), không chuyển ngay lập tức vào trận đấu mà cần hiệu ứng toàn màn hình chuyển tiếp mượt mà: phong cách Iris Pokéball kèm rung nhẹ màn hình (Screen Shake).
- **Chi tiết đã thực hiện:**
  1. **Hiệu Ứng Rung Màn Hình (Screen Shake):**
     - Bổ sung animation CSS @keyframes encounter-shake và lớp .encounter-shaking trong [style.css](file:///e:/Pokemon/apps/web/src/style.css), điều chỉnh nhịp rung kéo dài 450ms khi vừa kích hoạt đụng độ.
     - Đóng băng di chuyển của người chơi ngay lập tức ( his.player.isMoving = false), ngăn giật tọa độ nhân vật.
  2. **Hiệu Ứng Khép Màn Tròn Iris Pokéball ([encounter-transition.ts](file:///e:/Pokemon/apps/web/src/ui/encounter-transition.ts)):**
     - Tạo fullscreen canvas overlay mượt mà 60 FPS với tốc độ được tinh chỉnh chậm rãi, kịch tính hơn:
       - **Giai đoạn 1 (0ms - 1050ms):** Vòng khẩu độ hình tròn từ tâm co nhỏ lại (Iris out) êm ái trong ~1.05s, bên ngoài phủ màu đen tuyền.
       - Viền tròn khẩu độ được tạo hình nửa trên Đỏ (#e11d48), nửa dưới Trắng (#ffffff), dải đai đen ở giữa và nút bấm tròn Pokéball ở tâm.
       - Khi khẩu độ khép lại hoàn toàn, hiển thị một quả bóng Pokéball hoàn chỉnh, sắc nét nổi bật giữa màn đen.
       - **Giai đoạn 2 (1050ms - 1430ms):** Nút bấm trung tâm Pokéball phát xung ánh sáng bừng tỏa hào quang trắng rực rỡ (
         adial-gradient flash) trong ~380ms.
       - **Giai đoạn 3 (1130ms - 1680ms):** Quả Pokéball phóng to dần từ tâm bung rộng ra 4 góc màn hình (tương tự chiều ngược lại khi thu), để lộ khoảng không gian đen tuyền 100% bên trong.
       - **Giai đoạn 4 (1650ms+):** Chuyển giao tức thì sang BattleScreen, 2 tấm rèm đen sàn đấu tiếp nối mở ra lộ sàn đấu và Pokémon hoang dã.
  3. **Phông Nền Mờ Ambient Mở Rộng Từ Background Chiến Đấu ([battle-screen.ts](file:///e:/Pokemon/apps/web/src/battle/battle-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Thay vì để lộ bản đồ thế giới hay nền đen đơn điệu, bổ sung lớp nền .battle-ambient-backdrop phủ toàn bộ màn hình sử dụng chính ảnh background chiến đấu của địa hình hiện tại (cỏ, nước, núi, cát...).
     - Phóng to ảnh bao trọn màn hình (ackground-size: cover; image-rendering: pixelated; filter: brightness(0.6)), không làm mờ, kết hợp lớp radial-gradient làm tối nhẹ về 4 góc.\nadial-gradient làm tối dần về 4 góc.
     - Tạo chiều sâu không gian điện ảnh cao cấp (Cinematic Ambient Depth), vừa đồng điệu màu sắc môi trường vừa tôn bật sàn đấu pixel art 4:3 ở chính giữa.
  4. **Tích Hợp Vào Vòng Lặp Game ([game-session.ts](file:///e:/Pokemon/apps/web/src/game/game-session.ts)):**
     - Đã bọc startWildBattle() bên trong playEncounterTransition(...), áp dụng cho cả đụng độ bụi cỏ tự nhiên và nút bấm 'Đấu Thử' / window.startBattle().

---

### 0.33. Kiểm Tra, Rà Soát & Khắc Phục Lỗi Tích Hợp Âm Thanh (Audio / Pokémon Cries System):

- **Trạng thái:** Đã kiểm tra toàn diện, phát hiện lỗi chặn tương tác UI và xử lý triệt để, CI PASS 100%.
- **Các lỗi đã phát hiện và xử lý:**
  1. **Lỗi chặn sự kiện click (pointer-events: none) trên Canvas Sprite Chi Tiết:**
     - Trong [style.css](file:///e:/Pokemon/apps/web/src/style.css), lớp `.info-sprite-box .pokedex-canvas-sprite` đang để `pointer-events: none;`, khiến người dùng nhấp chuột vào Sprite trong màn hình chi tiết Pokédex nhưng sự kiện click không thể kích hoạt.
     - Đã chuyển thành `pointer-events: auto;`, bổ sung `cursor: pointer;` và gắn sự kiện click cho cả `.info-sprite-box` lẫn canvas, cho phép người dùng click bất kỳ vị trí nào trên ô Pokémon để phát tiếng kêu (Cry).
  2. **Lỗi Race Condition & DOMException AbortError trong [pokemon-cry.ts](file:///e:/Pokemon/apps/web/src/ui/pokedex/pokemon-cry.ts):**
     - Khi người dùng click chuyển nhanh giữa các Pokémon, lệnh `pause()` ngắt Promise `play()` đang chờ dẫn đến lỗi `AbortError` màu đỏ trên Console. Đã bọc kiểm tra và bỏ qua AbortError hợp lệ.
     - Xử lý race condition trong sự kiện `ended` để chỉ gán `this.currentAudio = null` nếu instance audio kết thúc chính là audio hiện tại.
     - Chuẩn hóa đường dẫn `cryPath` (loại bỏ dấu `/` đầu chuỗi và dấu gạch chéo ngược Windows) tránh lỗi double-slash `//Audio/...` biến thành protocol-relative URL.
  3. **Hỗ trợ Streaming Audio trong Vite Dev Server ([vite.config.ts](file:///e:/Pokemon/apps/web/vite.config.ts)):**
     - Thêm header `Content-Length: stat.size` và `Accept-Ranges: bytes` vào middleware phục vụ tệp `/Audio/`, đảm bảo trình duyệt xác định thời lượng và buffer âm thanh chuẩn xác.
  4. **Thay Thế File Âm Thanh Charmander Chuẩn Hóa ([CHARMANDER_clean.ogg](file:///e:/Pokemon/Audio/Cries/CHARMANDER_clean.ogg)):**
     - Tệp cũ CHARMANDER.ogg có tần số lấy mẫu dị biệt (32.728 Hz) có thể gây lỗi giải mã trên một số backend âm thanh Windows/WebView2.
     - Đã cập nhật [pokemon-db.json](file:///e:/Pokemon/packages/game-data/pokemon-db.json#L442) chuyển sang Audio/Cries/CHARMANDER_clean.ogg (chuẩn 44.100 Hz Vorbis, âm thanh sắc nét, hoàn toàn tương thích).
     - Xóa tệp cũ Audio/Cries/CHARMANDER.ogg (cả trong thư mục nguồn và dist) để tránh nhầm lẫn.
     - Bổ sung phát âm thanh khi click xem chi tiết Pokémon từ ô xem trước (listPreviewBox) và khi double-click từ danh sách trong [pokedex-controller.ts](file:///e:/Pokemon/apps/web/src/ui/pokedex/pokedex-controller.ts).
  5. **Kiểm Định CI Pipeline (`npm run ci` PASS 100%):**
     - `validate:schemas`: 151/151 cries hợp lệ và 196 assets PASS.
     - `format:check` & `lint`: PASS 0 lỗi.
     - `typecheck:web`: TypeScript PASS.
     - `test:web`: Toàn bộ 14 test suites (83/83 tests) PASS.
     - `build:web`: Vite build thành công sạch sẽ, xuất 151 tệp âm thanh vào `dist/Audio/Cries/`.

---

### 0.32. Hoàn Thiện Hệ Thống Hiệu Ứng Bắt Đầu Trận Đấu (Battle Intro Transition Animation):

- **Trạng thái:** Đã hoàn thành theo yêu cầu chi tiết của người dùng.
- **Yêu cầu người dùng:**
  - Màn hình ban đầu đen hoàn toàn.
  - Từ chính giữa màn hình (độ cao battlefield 288px, tâm Y = 144), tách ra làm 2 tấm màn đen:
    - 1 tấm đẩy trượt lên trên (từ 144 về 0).
    - 1 tấm đẩy trượt xuống dưới (từ 144 về 288).
  - Sử dụng asset overlay (`Graphics/Battle/overlay/`) gắn tại đỉnh mép trên của tấm màn đen phía dưới:
    - Trải dài bao trọn 2 rìa màn hình, hiển thị trọn vẹn không bị cắt hụt.
    - Chạy lặp vô tận theo chiều ngang (`loop vô tận`) đồng thời hạ dần xuống theo tấm màn đen.
    - Nằm phía sau phần UI hiển thị hộp thoại / bảng điều khiển bên dưới (`BOTTOM_PANEL_Y = 288`).
  - Trong lúc chạy intro:
    - Pokémon của người chơi và databox của người chơi chưa xuất hiện.
    - Pokémon hoang dã xuất hiện với bóng đen tuyền (`brightness(0)`), sau đó khi intro hoàn tất sẽ bừng sáng rực rỡ (`brightness(flash)`) rồi trở về màu sắc nguyên bản.
    - Databox và lời thoại bắt đầu trận (`"A wild ... appeared!"`, tiếp nối bởi `"Go! ...!"`) chỉ hiển thị sau khi intro hoàn tất.
- **Chi tiết đã thực hiện:**
  1. **Đồng Bộ Tài Nguyên Overlay Do Người Dùng Tự Cắt ([manifest.json](file:///e:/Pokemon/apps/web/public/assets/manifest.json), [asset-registry.ts](file:///e:/Pokemon/apps/web/src/assets/asset-registry.ts)):**
     - Tiếp nhận và đồng bộ trực tiếp 6 file cảnh quan do người dùng tự cắt từ `Graphics/Battle/overlay/` sang `apps/web/public/Graphics/Battle/overlay/`:
       - `grass_field.png` (749×334px)
       - `grass_tall.png` (750×268px)
       - `mountain_rocks.png` (750×210px)
       - `sand_dunes.png` (749×211px)
       - `water_calm.png` (748×335px)
       - `water_rough.png` (748×264px)
     - Giữ nguyên 100% file gốc, tuyệt đối không chỉnh sửa/cắt lại và không tự ý scale phóng to để bảo tồn trọn vẹn từng điểm ảnh pixel art sắc nét.
     - Hiển thị theo tỉ lệ thu nhỏ 50% (`scale = 0.5`) vừa vặn hoàn hảo với tỉ lệ khung hình chiến đấu 512×288, với `imageSmoothingEnabled = false` giữ các hạt pixel sắc nét, tự động lặp dải ngang liền mạch (`startX += overlayW`).
     - Lớp vẽ Overlay nằm phía SAU 2 tấm màn đen: Ban đầu chìm nhẹ sau tâm mở ($Y = 146.1$), ngay khi màn đen hé mở khe hở ~5px (mốc ~0.13s, frame 8) thì dải overlay nhô lên lướt sóng và trượt hạ dần xuống.
     - Nâng cao độ dải Intro lên thêm 30px (đỉnh dải trong suốt quá trình mở màn nằm cao hơn ~30px so với trước, đạt $Y \approx 182$ thay vì 220, tăng tối đa diện tích hiển thị cảnh quan mà vẫn chìm mượt mà xuống dưới hộp thoại UI theo phương trình $Y = 146.1 + p^{2.7} \times (290 - 146.1)$).
     - Tăng tốc độ cuộn lặp vô tận lên `loopSpeed = 12` (từ 9 lên 12) giúp hiệu ứng dải địa hình lướt sóng nhanh và sống động hơn.
     - Tăng tốc độ intro trận đấu: bước nhảy `introProgress` tăng từ `0.0055` lên `0.0075` (~2.2 giây thay vì 3.0 giây), tạo nhịp độ vào trận nhanh, dứt khoát và cuốn hút hơn.
  2. **Trạng Thái Quản Lý Intro Trong BattleState ([battle-state.ts](file:///e:/Pokemon/apps/web/src/battle/battle-state.ts)):**
     - Thêm các cờ `isIntro: boolean = true`, `introProgress: number = 0`, `isPlayerPokemonSentOut: boolean = false`.
     - Tịnh tiến `introProgress` mượt mà theo từng tick trong `updateTick()` cho đến khi đạt 1.0 thì kết thúc intro.
  3. **Đồng Bộ Dòng Thời Gian Trận Đấu Trong BattleScreen ([battle-screen.ts](file:///e:/Pokemon/apps/web/src/battle/battle-screen.ts)):**
     - Không hiển thị hộp thoại ngay từ đầu trận; chỉ sau khi `isIntro` kết thúc (`introProgress >= 1.0`), BattleScreen mới kích hoạt thông báo `"A wild [Name] appeared!"`.
     - Sau khi người chơi xác nhận/qua dòng thoại đầu, mới kích hoạt `isPlayerPokemonSentOut = true` và tung Pokémon của người chơi ra sân kèm câu lệnh `"Go! [Name]!"`.
  4. **Render Hiệu Ứng Màn Đen, Looping Overlay & Dynamic Cinematic Camera ([battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts)):**
     - **Dynamic Cinematic Camera:** Ở giai đoạn đầu trận, camera phóng to cận cảnh 1.35x vào Pokémon hoang dã kết hợp pan nhẹ về phía trung tâm (`camScale = 1.35`, `camPanX = -45, camPanY = 15`), giúp người chơi thấy Pokémon hoang dã to lớn, uy dũng khi xuất hiện từ bóng đen sang bừng sáng. Sau đó, từ $p = 0.50 \rightarrow 0.92$, camera lùi mượt mà (`easeInOut`) về góc rộng toàn cảnh mặc định 1.0x đúng lúc intro hoàn tất và Pokémon người chơi chuẩn bị xuất hiện.
     - Hàm `drawIntroShutters()` tính toán tách màn từ `centerY = 144`:
       - Shutter trên vẽ từ 0 tới `topY = 144 * (1 - easedS)`.
       - Shutter dưới vẽ từ `bottomY = 144 + easedS * 144` tới 288.
       - Tự động chọn dải overlay phù hợp theo địa hình (cỏ, nước, cát, núi) và vẽ lặp vô tận theo chiều ngang với offset `loopX = (state.tick * 9) % overlayW` chìm nhẹ phía sau màn đen và trượt chìm dần đều đặn cho đến khi lặn dưới hộp thoại UI.
     - Hiệu ứng Pokémon hoang dã: trong giai đoạn đầu intro dùng filter `brightness(0)` (bóng đen), ở cuối giai đoạn chuyển cảnh bừng sáng cực đại `brightness(flash)` trước khi hạ về bình thường.
     - Ẩn Pokémon và Databox người chơi cho tới khi `isPlayerPokemonSentOut = true`.
  5. **Hiệu Ứng Slide-in Mượt Mà Cho 2 Thanh Databox (Thay Vì Ẩn/Hiện Đột Ngột):**
     - Thêm tiến trình `enemyDataboxProgress` và `playerDataboxProgress` (0..1) vào [battle-state.ts](file:///e:/Pokemon/apps/web/src/battle/battle-state.ts).
     - **Enemy Databox (Đối thủ):** Tự động trượt từ lề trái vào vị trí chuẩn (offset `-260px -> 0px`) ngay khi màn đen tách xong và dòng thoại wild Pokémon xuất hiện.
     - **Player Databox (Người chơi):** Tự động trượt từ lề phải vào vị trí chuẩn (offset `+260px -> 0px`) ngay khi người chơi tung Pokémon ra sân (`isPlayerPokemonSentOut = true`).
     - Áp dụng hàm nội suy `easeOutCubic` ($1 - (1 - t)^3$) cho chuyển động lướt nhanh rồi giảm tốc êm ái (~20 frames = ~0.33s).
     - Đồng bộ hoàn hảo giữa Canvas 2D ([battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts)) và lớp HTML DOM Overlay ([battle-text-overlay.ts](file:///e:/Pokemon/apps/web/src/battle/battle-text-overlay.ts)) bằng CSS `transform: translateX(...)` và `will-change: transform`.
  6. **Kiểm Định Toàn Bộ CI Pipeline (`npm run ci` PASS 100%):**
     - `validate:schemas`: 196/196 assets PASS.
     - `lint` & `format:check`: Prettier và ESLint PASS 0 cảnh báo.
     - `typecheck:web`: TypeScript PASS.
     - `test:web`: Toàn bộ 14 test suites (82/82 tests) PASS.
     - `build:web`: Vite build thành công sạch sẽ.

---

### 0.29. Xây Dựng Hệ Thống Túi Đồ (Bag / Inventory Screen) Chuẩn Mẫu Đồ Họa:

- **Trạng thái:** Đã hoàn thành theo yêu cầu người dùng.
- **Yêu cầu người dùng:** Dựa trên tài nguyên tại `Graphics/Bag` (`ui2.png`, `icon_pocket.png`, `bag icon.png`, `ptpanel_rect_desel.png`), xây dựng túi đồ chứa các vật phẩm theo đúng mẫu giao diện.
- **Thay đổi chi tiết:**
  - **Asset Registry & Manifest ([manifest.json](file:///e:/Pokemon/apps/web/public/assets/manifest.json), [asset-registry.ts](file:///e:/Pokemon/apps/web/src/assets/asset-registry.ts), [vite.config.ts](file:///e:/Pokemon/apps/web/vite.config.ts)):**
    - Thêm thư mục `'Bag'` vào plugin sao chép asset tĩnh trong `vite.config.ts`.
    - Đăng ký các tài nguyên:
      - `bag_bg`: `/Graphics/Bag/ui2.png` (512×384 px chuẩn).
      - `bag_icon`: `/Graphics/Bag/bag icon.png`.
      - `bag_pocket_icons`: `/Graphics/Bag/icon_pocket.png` (224×48 px gồm 8 icon ngăn túi × 2 trạng thái inactive/active).
      - `bag_panel_rect_desel`: `/Graphics/Bag/ptpanel_rect_desel.png`.
      - `menu_bag`: `/Graphics/Pictures/menuBag.png` trên thanh menu góc trên.
  - **Dữ Liệu 8 Ngăn Túi & Item Database ([items-db.ts](file:///e:/Pokemon/apps/web/src/data/items-db.ts)):**
    - Định nghĩa cấu trúc 8 ngăn túi (`BAG_POCKETS`) theo chuẩn Pokémon thế hệ kinh điển:
      1. `items`: Vật phẩm thông thường, đá tiến hóa & trang bị (icon cột 0).
      2. `medicine`: Dược phẩm hồi máu, giải hiệu ứng và hồi sinh (icon cột 1).
      3. `pokeballs`: Các loại bóng bắt Pokémon (icon cột 2).
      4. `machines`: Đĩa kỹ năng TM & HM (icon cột 3).
      5. `berries`: Các loại quả Berry (icon cột 4).
      6. `mail`: Thư từ gửi kèm thư tín (icon cột 5).
      7. `battle`: Vật phẩm tăng chỉ số trong trận đấu X-Items (icon cột 6).
      8. `key`: Vật phẩm cốt truyện quan trọng Key Items (icon cột 7).
    - Cung cấp hàm ánh xạ thông minh `getItemPocketIndex(item)` và `findItem(itemId)`.
  - **Giao Diện Túi Đồ BagScreen ([bag-screen.ts](file:///e:/Pokemon/apps/web/src/ui/bag-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
    - Thiết kế bám sát mẫu pixel-perfect:
      - **Dải Tab 8 Ngăn Túi (Pocket Tabs Strip):** Cắt lát chuẩn từ `icon_pocket.png` (kích thước 28×24px mỗi icon). Toàn bộ 8 icon luôn luôn hiển thị hàng có màu gốc sinh động (Y = 0px), loại bỏ hoàn toàn hàng icon xám không màu. Ngăn túi đang được chọn (Active) được nhận diện rõ rệt nhờ thanh gạch đáy sáng rực rỡ (`::after` glowing underline) theo mã màu riêng của từng ngăn, hiệu ứng nâng nổi `translateY(-2px)` và ánh sáng viền `drop-shadow`.
      - **Cột Trái (Bag Art & Preview):** Hiển thị hình minh họa Túi du hành Pokémon cùng tên ngăn túi và hướng dẫn thao tác.
      - **Cột Phải (Scrollable Item List):** Bảng danh sách cuộn các vật phẩm thuộc ngăn túi hiện tại, hiển thị icon vật phẩm (`Graphics/Items/${filename}`), tên tiếng Việt sắc nét, và số lượng `×Số lượng` bên phải. Có nút hủy/quay lại ở cuối danh sách.
      - **Thanh Đáy (Bottom Bar & Action Box):** Tận dụng trực tiếp ô vuông trắng đã được vẽ sẵn trong ảnh nền `ui2.png` tại tọa độ chính xác `x: 22..73, y: 312..363`. Loại bỏ hoàn toàn ô vuông render CSS bổ sung (`background: transparent; border: none; box-shadow: none;`), sprite vật phẩm `.bag-bottom-thumb` nằm lọt vừa vặn trực tiếp bên trong ô gốc của UI. Bên phải là tên vật phẩm cùng mô tả chi tiết công dụng tiếng Việt và các nút hành động (Dùng, Cho giữ, Thoát).
      - **Context Menu Thao Tác:** Menu tùy chọn hành động gồm `Sử dụng`, `Đưa Pokémon giữ`, `Đóng`. Hỗ trợ dùng Dược phẩm hồi máu cho Pokémon trong đội, hồi sinh cho Pokémon gục ngã, dùng Kẹo hiếm Rare Candy tăng cấp, và gắn đồ giữ cho Pokémon.
  - **Tích Hợp Trong Trận Đấu & Ngoài Thế Giới ([battle-controller.ts](file:///e:/Pokemon/apps/web/src/battle/battle-controller.ts), [battle-engine.ts](file:///e:/Pokemon/apps/web/src/battle/battle-engine.ts), [bootstrap.ts](file:///e:/Pokemon/apps/web/src/bootstrap.ts)):**
    - **Nút Menu & Phím Tắt:** Nút Balo `btnMenuBag` trên thanh menu trên cùng và phím tắt `B` (`KeyB`) giúp mở/đóng túi tức thì từ map dã ngoại.
    - **Trong Trận Đấu (Battle Command BAG):** Khi bấm nút BAG (hoặc index 1):
      - Tự động mở Túi đồ ở chế độ Battle (`openForBattleUse`).
      - Cho phép dùng Dược phẩm (Potion, Full Restore...) hồi phục HP ngay cho Pokémon đang tham chiến.
      - Cho phép chọn bất kỳ loại Bóng nào (Poké Ball, Great Ball, Ultra Ball, Master Ball, Dusk Ball, Quick Ball...) để ném bắt Pokémon hoang dã với tỉ lệ bắt chuẩn xác từng loại bóng.
  - **Bảng Công Cụ Kiểm Thử Nhanh (Debug Overlay):**
    - Thêm hộp `🎒 Túi Đồ & Vật Phẩm` trong `testOverlay`:
      - Nút `🎒 Mở túi đồ (Phím B)`.
      - Nút `🎁 Bộ vật phẩm khởi đầu đầy đủ` (bổ sung phong phú vật phẩm vào cả 8 ngăn túi).
  - **Trạng Thái CI & Kiểm Định Toàn Bộ Hệ Thống:**
    - Đã chạy Prettier format chuẩn hóa 100% cho 6 file (`battle-controller.ts`, `battle-engine.ts`, `bootstrap.ts`, `party-service.ts`, `style.css`, `bag-screen.ts`).
    - **Khắc Phục Triệt Để Cảnh Báo Build Vite:** Đã chuyển 4 đường dẫn CSS Party (`partybg.PNG`, `battler_gender.png`, `partyCancel.png`, `partyCancelSel.png`) sang biến CSS lấy từ `PARTY_ASSETS` (`Asset Registry`), triệt tiêu hoàn toàn cảnh báo build time của Vite.
    - Lệnh CI `npm run ci` đã **PASS 100%** toàn bộ các công đoạn:
      - `validate:schemas`: 190/190 asset tồn tại, 75 tile IDs, 6 terrains, biomes, encounters, pokemon-db hợp lệ.
      - `lint`: eslint kiểm tra code sạch sẽ không có lỗi.
      - `format:check`: Prettier check đạt 100%.
      - `typecheck:web`: TypeScript compilation (`tsc --noEmit`) đạt 0 lỗi.
      - `test:web`: Toàn bộ 13 test suites (69/69 tests) pass 100%.
      - `build:web`: Production bundle Vite build thành công sạch sẽ không còn cảnh báo asset.

---

### 0.30. Khóa Nền Tảng Domain Layer & Persistence (InventoryService & SaveGameRepository):

- **Trạng thái:** Đã hoàn thành Bước 1, 2 và 4 theo đúng lộ trình được phê duyệt.
- **Chi tiết đã thực hiện:**
  1. **Tách Rời `InventoryService` Độc Lập ([inventory-service.ts](file:///e:/Pokemon/apps/web/src/domain/inventory/inventory-service.ts), [inventory-state.ts](file:///e:/Pokemon/apps/web/src/domain/inventory/inventory-state.ts)):**
     - Tách toàn bộ logic quản lý vật phẩm ra khỏi `PlayerService` theo nguyên tắc SRP.
     - Tự động chuẩn hóa canonical keys (theo `findItem(key).id` từ `items-db.json`) giúp tra cứu và thêm/bớt vật phẩm đồng nhất, hỗ trợ cả `poke_ball`, `pokeball`, `POKEBALL` và `poke-ball`.
     - Phân loại vật phẩm theo 8 ngăn túi chuẩn xác với metadata đầy đủ (`getInventoryEntries`, `getPocketItems`).
     - `PlayerService` ủy quyền toàn bộ thao tác inventory sang `InventoryService`, giữ tương thích ngược tuyệt đối.
  2. **Xây Dựng `SaveGameRepository` Thống Nhất ([save-repository.ts](file:///e:/Pokemon/apps/web/src/domain/save/save-repository.ts), [save-state.ts](file:///e:/Pokemon/apps/web/src/domain/save/save-state.ts)):**
     - Đóng gói toàn bộ trạng thái trò chơi thành một bản lưu thống nhất (`SaveGameData` Version 1):
       - `PlayerProfile`: tên, tiền ví, huy hiệu, thời gian chơi, số lượng pokedex.
       - `PartyPokemon[]`: toàn bộ dữ liệu 6 Pokémon (HP, PP chiêu thức, level, exp, đồ giữ).
       - `InventoryState`: số lượng các vật phẩm chuẩn hóa.
       - `WorldState`: tọa độ lưới `gx, gy`, hướng nhìn của người chơi.
     - Cung cấp kiến trúc `SaveStorageAdapter` (mặc định `BrowserLocalStorageAdapter`, sẵn sàng cắm `HttpServerStorageAdapter` khi kết nối `apps/server`).
     - Hỗ trợ lưu nhiều slot (`save(slotId)`), tải và nạp tự động vào tất cả domain services (`load(slotId)`), kiểm tra slot (`hasSave`), xóa slot (`deleteSave`), xuất/nhập file JSON (`exportJson`/`importJson`).
     - Gắn helper lưu/tải nhanh trên console: `window.saveGame()` và `window.loadGame()`.
  3. **Kết Nối Đồng Bộ Sang Giao Diện ([bag-screen.ts](file:///e:/Pokemon/apps/web/src/ui/bag-screen.ts), [bootstrap.ts](file:///e:/Pokemon/apps/web/src/bootstrap.ts)):**
     - `BagScreen` chuyển sang lắng nghe sự kiện trực tiếp từ `inventoryService.subscribe(...)` và gọi `inventoryService.removeItem(...)`.
     - Bảng debug trên map cập nhật thêm/bớt vật phẩm trực tiếp qua `inventoryService.addItem(...)`.
  4. **Kiểm Thử Toàn Diện Domain Layer ([domain.test.ts](file:///e:/Pokemon/apps/web/test/domain.test.ts)):**
     - Viết bộ 13 test cases kiểm thử độc lập cho `InventoryService`, `PlayerService`, `PartyService` và `SaveGameRepository`.
     - Toàn bộ pipeline `npm run ci` **PASS 100%**:
       - 14/14 test suites pass, **82/82** unit/integration tests pass.
       - Typecheck TypeScript (`tsc --noEmit`): 0 lỗi.
       - Prettier format: 100% đạt chuẩn.
       - Production Vite build: thành công sạch sẽ 100%.

### 0.32. Tích Hợp Tiền Cảnh Chiến Đấu (Battle Foreground Clutter Overlay) 6 Kiểu Môi Trường:

- **Trạng thái:** Đã hoàn thành theo yêu cầu người dùng.
- **Yêu cầu người dùng:** Dựa trên spritesheet tiền cảnh chiến đấu của RayCo, phân tích và tích hợp trực tiếp vào màn hình trận đấu để nâng cao chiều sâu thị giác 2.5D.
- **Chi tiết đã thực hiện:**
  1. **Cắt Lát & Đăng Ký Tài Nguyên Chuẩn Pixel-Art ([manifest.json](file:///e:/Pokemon/apps/web/public/assets/manifest.json), [asset-registry.ts](file:///e:/Pokemon/apps/web/src/assets/asset-registry.ts)):**
     - Cắt 6 dải tiền cảnh có độ rộng chuẩn 256px (tỉ lệ 2.0 khớp hoàn hảo chiều rộng canvas trận đấu 512px):
       - `grass_tall.png` (256×80 px): Bụi cỏ cao rậm rạp che chân Pokémon.
       - `grass_field.png` (256×47 px): Ngọn cỏ thấp đồng bằng.
       - `water_rough.png` (256×47 px): Sóng lớn cuộn trào bọt biển.
       - `water_calm.png` (256×24 px): Mặt nước lăn tăn sóng êm.
       - `sand_dunes.png` (256×30 px): Đụn cát sa mạc / bãi biển uốn lượn.
       - `mountain_rocks.png` (256×56 px): Mỏm đá núi hang động gồ ghề.
     - Lưu trữ tại `Graphics/Battle/overlay/` và đồng bộ sang `apps/web/public/Graphics/Battle/overlay/`.
     - Nâng tổng số manifest asset từ 190 lên **196 assets hợp lệ**.
  2. **Ánh Xạ Sinh Thái & Tự Động Nhận Diện Địa Hình ([battle-factory.ts](file:///e:/Pokemon/apps/web/src/battle/battle-factory.ts), [game-session.ts](file:///e:/Pokemon/apps/web/src/game/game-session.ts)):**
     - Mở rộng `getBattleEnvironment(zone, isNearWater, inTallGrass)`:
       - Vùng nước (`wetland` hoặc `nearWater`): Gán `foregroundOverlay: 'water_rough'`.
       - Rừng rậm (`dense_forest`) hoặc đứng trên ô cỏ cao (`inTallGrass`): Gán `foregroundOverlay: 'grass_tall'`.
       - Sa mạc / Vùng khô hạn (`dryland`): Gán `foregroundOverlay: 'sand_dunes'`.
       - Vách núi (`hill_edge`): Gán `foregroundOverlay: 'mountain_rocks'`.
       - Đồng bằng cỏ (`meadow`): Tự động chọn `grass_tall` nếu đứng trong cỏ cao hoặc `grass_field` nếu ở cỏ thấp.
     - `startWildBattle`: Tự động quét kiểm tra tọa độ người chơi và Pokémon hoang dã có nằm trong mảng `chunk.tallGrass` hay không để kích hoạt cỏ cao.
  3. **Vẽ Tiền Cảnh Sinh Động Trên Canvas ([battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts), [battle-assets.ts](file:///e:/Pokemon/apps/web/src/battle/battle-assets.ts)):**
     - Tải trước ảnh qua `createBattleAssets`.
     - Phương thức `drawForegroundOverlay(ctx, state)`:
       - Vẽ giữa lớp Battler (Pokémon người chơi) và Databox/Command Panel, tạo hiệu ứng chiều sâu 2.5D chân thực.
       - Tích hợp vi hoạt ảnh nhấp nhô sống động (`Math.sin` wave motion): sóng nước cuộn nhấp nhô, ngọn cỏ đung đưa theo gió, đụn cát lấp lánh nhiệt độ.
       - Cung cấp API `setForegroundOverlay(key)` cho phép chuyển đổi tiền cảnh linh hoạt.
  4. **Công Cụ Thử Nghiệm Nhanh & Kiểm Thử Tự Động ([game-overlay.ts](file:///e:/Pokemon/apps/web/src/ui/game-overlay.ts), [bootstrap.ts](file:///e:/Pokemon/apps/web/src/bootstrap.ts), [battle.test.ts](file:///e:/Pokemon/apps/web/test/battle.test.ts)):**
     - Thêm dropdown menu `#selectBattleOverlay` ngay cạnh nút `⚔️ Đấu Thử` trong bảng debug, cho phép người dùng chọn xem thử ngay lập tức cả 6 loại tiền cảnh hoặc để tự động theo bản đồ.
     - Thêm test case xác thực ánh xạ đầy đủ 6 loại overlay môi trường trong `battle.test.ts`.
     - Pipeline `npm run ci` **PASS 100%** (14 test suites, 83/83 tests, 0 lint/format/type/build errors).

### 0.31. Tối Ưu Hóa Code Splitting Vite (<350 kB) & Loại Bỏ Triệt Để Math.random() / any Trong Gameplay:

- **Trạng thái:** Đã hoàn thành 100% cả 2 hạng mục kiến trúc theo chỉ đạo của người dùng.
- **Chi tiết đã thực hiện:**
  1. **Loại Bỏ Hoàn Toàn `Math.random()` và Chuyển Sang Deterministic Seeded RNG ([rng.ts](file:///e:/Pokemon/apps/web/src/core/rng.ts), [game-session.ts](file:///e:/Pokemon/apps/web/src/game/game-session.ts), [party-state.ts](file:///e:/Pokemon/apps/web/src/domain/party/party-state.ts), [player-state.ts](file:///e:/Pokemon/apps/web/src/domain/player/player-state.ts), [bootstrap.ts](file:///e:/Pokemon/apps/web/src/bootstrap.ts)):**
     - Nâng cấp `RandomService.choice<T>(items: readonly T[]): T` hỗ trợ mảng `readonly`.
     - Chuyển toàn bộ các vị trí sinh ngẫu nhiên sang `defaultRng` (Mulberry32 PRNG):
       - `createDefaultPlayerProfile`: Tạo trainer ID với `rng.nextInt(1000, 9999)`.
       - `createPartyPokemon`: Tạo Pokémon UID và xác định giới tính với `activeRng`.
       - `startTestBattle`: Lựa chọn Pokémon và cấp độ hoang dã với `defaultRng.choice()` và `defaultRng.nextInt()`.
       - Overlay Party Debug (`btnAddRandomPartyPokemon`, `btnFillPartyPokemon`): Lấy mẫu ngẫu nhiên qua `defaultRng`.
     - Toàn bộ codebase hiện đạt **0 lần xuất hiện `Math.random()`**.
  2. **Khắc Phục Toàn Diện Kiểu `any` và Ép Kiểu Lỏng Lẻo Trong Gameplay:**
     - `game-session.ts`: `startWildBattle(wp, chunk)` được định kiểu chặt chẽ với `Pick<WildPokemonEntity, 'gx' | 'gy' | 'speciesKey' | 'level'> & Partial<WildPokemonEntity>` và `WorldChunk`.
     - `game-session.ts`: Thay thế `indexOf(wp)` bằng `findIndex` so khớp tọa độ và loài Pokémon an toàn.
     - `bootstrap.ts`: Loại bỏ hoàn toàn `(window as any)` thông qua `declare global { interface Window { startBattle, saveGame, loadGame } }`.
     - `bootstrap.ts`: Hướng nhìn `(data.world.position.direction ?? 0)` được ép kiểu chính xác sang `Direction` (`0 | 1 | 2 | 3`).
     - Toàn bộ codebase hiện đạt **0 lần xuất hiện `: any` hay `as any`**.
  3. **Tối Ưu Bundle Vite & Code Splitting (Triệt tiêu cảnh báo >500 kB) ([vite.config.ts](file:///e:/Pokemon/apps/web/vite.config.ts)):**
     - Thiết lập chiến lược phân mảnh `rollupOptions.output.manualChunks` thông minh:
       - `pokemon-data`: 282.66 kB (tách riêng `pokemon-db.json`).
       - `moves-data`: 334.26 kB (tách riêng `moves-db.json` và cơ sở dữ liệu chiêu thức).
       - `items-data`: 259.25 kB (tách riêng `items-db.json` và cơ sở dữ liệu vật phẩm).
       - `gameplay-ui`: 80.78 kB (gộp `Battle`, `PartyScreen`, `BagScreen` xử lý liên kết vòng gọn gàng).
       - `pokedex`: 46.49 kB (màn hình tra cứu Pokédex).
       - `index` (Core runtime & engine): 102.66 kB.
     - Kết quả: **Không còn bất kỳ chunk nào vượt quá 350 kB** (trước đây là một file monolithic 1.1 MB gây cảnh báo).
  4. **Kiểm Định Toàn Bộ CI Pipeline (`npm run ci` PASS 100%):**
     - `validate:schemas`: 190/190 assets, 75 tile IDs, 6 terrains, 5 biomes, 3 regions, 151 pokemons PASS.
     - `lint`: eslint PASS (0 lỗi).
     - `format:check`: Prettier check PASS 100%.
     - `typecheck:web`: TypeScript compilation PASS 0 lỗi.
     - `test:web`: **14/14 test suites passed, 82/82 tests passed**.
     - `build:web`: Vite build thành công sạch sẽ, **0 cảnh báo asset, 0 cảnh báo bundle size**.

- **Kế hoạch bước tiếp theo:**
  - Khởi tạo package `apps/server` (Fastify / Express / WebSocket) để kết nối persistence và đồng bộ nhiều người chơi.

### 0.28. Liên Kết Nút POKÉMON Trong Trận Đấu & Hệ Thống Đổi Battler Party:

- **Trạng thái:** Đã hoàn thành theo yêu cầu người dùng.
- **Yêu cầu người dùng:** Kết nối nút POKÉMON trong giao diện chiến đấu (Battle command menu) với màn hình Party để người chơi có thể chọn và đổi Pokémon ra sân thi đấu.
- **Thay đổi chi tiết:**
  - **Z-Index Layering ([style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
    - Nâng `z-index` của `.party-screen-backdrop` từ 2100 lên 20000, giúp màn hình Party hiển thị sắc nét phía trên cả màn hình trận đấu (`battle-screen-overlay` có `z-index: 9999`).
  - **Chế Độ Chọn Pokémon Trong Trận Đấu ([party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts)):**
    - Cung cấp phương thức `openForBattleSelect(options: BattleSelectOptions)`.
    - Lời nhắc đáy tự động chuyển thành `"Chọn pokemon để đổi ra sân."`.
    - Menu ngữ cảnh hiển thị nút `⚔️ Ra chiến đấu` (`#btnActionSendOut`) màu xanh ngọc nổi bật; ẩn các tùy chọn không dùng trong trận đấu (Đổi vị trí, Leader, Dùng Potion).
    - Kiểm tra tính hợp lệ nghiêm ngặt:
      - Nếu chọn Pokémon đang thi đấu: hiển thị thông báo `⚠️ ${pk.name} hiện đang ở trên sân đấu!`.
      - Nếu chọn Pokémon đã gục ngã (FNT / HP <= 0): hiển thị thông báo `⚠️ ${pk.name} đã gục ngã, không thể ra trận!`.
      - Khi chọn hợp lệ: tự động đóng party và kích hoạt callback đổi Pokémon.
  - **Logic Đổi Pokémon Trong Trận Đấu ([battle-controller.ts](file:///e:/Pokemon/apps/web/src/battle/battle-controller.ts), [battle-engine.ts](file:///e:/Pokemon/apps/web/src/battle/battle-engine.ts), [battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts)):**
    - Khi người chơi bấm lệnh POKÉMON (index 2): mở ngay `PartyScreen.getInstance().openForBattleSelect(...)`.
    - Khi đổi Pokémon:
      1. Tự động đồng bộ HP, PP của Pokémon cũ về `partyService`.
      2. Hiển thị thông điệp triệu hồi về: `"${oldName}, quay lại!"`.
      3. Cập nhật Pokémon mới vào `BattleEngine` (`switchPlayerPokemon`), đổi sprite lưng người chơi trên canvas (`renderer.updatePlayerSprite`), cập nhật % thanh máu, tên, cấp độ và bộ chiêu thức trên overlay DOM.
      4. Hiển thị thông điệp ra trận: `"Tiến lên! ${newName}!"`.
      5. Đổi Pokémon tiêu tốn lượt đi của người chơi, kích hoạt lượt tấn công của Pokémon hoang dã (`handleEnemyTurn`).
    - **Tinh Chỉnh Bóng Pokémon Người Chơi:** Đẩy vị trí bóng (`drawSpriteShadow`) của Pokémon người chơi lên 20px (`anchorY - 20`) để khớp hoàn hảo với bục đứng `playerBase`.
    - Hỗ trợ đổi Pokémon khi Pokémon hiện tại bị hạ gục (Force Switch): Nếu đội hình còn Pokémon sống, tự động mở Party cho người chơi đưa Pokémon tiếp theo vào trận thay vì xử thua ngay.
  - **Đồng Bộ Kết Quả Toàn Trận ([game-session.ts](file:///e:/Pokemon/apps/web/src/game/game-session.ts), [party-state.ts](file:///e:/Pokemon/apps/web/src/domain/party/party-state.ts), [party-service.ts](file:///e:/Pokemon/apps/web/src/domain/party/party-service.ts)):**
    - Gắn `uid` duy nhất vào `BattlerPokemon` khi chuyển đổi từ `PartyPokemon`.
    - Khi kết thúc trận đấu, kết quả HP, PP và EXP được cập nhật chuẩn xác cho Pokémon cuối cùng tham chiến (`result.activePlayerPokemon`).

### 0.27. Công Cụ Debug & Bổ Sung Pokémon Vào Đội Hình (Party Test Panel):

- **Trạng thái:** Đã hoàn thành theo yêu cầu người dùng.
- **Yêu cầu người dùng:** Bổ sung chức năng thêm Pokémon cho người chơi vào bảng điều chỉnh/test trên map để kiểm thử giao diện đội hình party với nhiều Pokémon.
- **Thay đổi chi tiết:**
  - **Giao Diện Debug Trên Map ([game-overlay.ts](file:///e:/Pokemon/apps/web/src/ui/game-overlay.ts)):**
    - Thêm hộp chức năng `🐾 Bổ sung Pokémon Đội hình` trong `testOverlay`:
      - Hiển thị số lượng Pokémon hiện có trong đội hình: `<span id="lblPartyCount">1 / 6</span>`.
      - Dropdown danh sách loài Pokémon (`#selectPartySpecies`) nạp từ `pokemonCatalog` và ô nhập cấp độ (`#inputPartyLevel`, 1-100, mặc định 25).
      - Nút `➕ Thêm vào đội` (`#btnAddPartyPokemon`): Tạo và thêm Pokémon đã chọn vào đội.
      - Nút `🎲 Ngẫu nhiên` (`#btnAddRandomPartyPokemon`): Chọn ngẫu nhiên 1 loài và cấp độ (5-50) rồi thêm vào đội.
      - Nút `⚡ Đầy 6 Slot` (`#btnFillPartyPokemon`): Tự động nạp các Pokémon đặc sắc (Charizard, Blastoise, Venusaur, Gengar, Dragonite, Lucario...) để lấp đầy đủ 6 ô ngay lập tức.
      - Nút `🗑️ Reset đội hình` (`#btnResetPartyPokemon`): Đặt lại đội hình về mặc định (chỉ giữ Pikachu Lv.5).
  - **Tương Tác & Real-time Update ([bootstrap.ts](file:///e:/Pokemon/apps/web/src/bootstrap.ts), [party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts)):**
    - Gắn sự kiện và kết nối logic trực tiếp tới `partyService`.
    - `PartyScreen` tự động đăng ký `partyService.subscribe(...)` để khi đang mở bảng đội hình (phím `P` hoặc nút `Đội hình`), bất kỳ thao tác thêm/xóa/đổi chỗ/reset từ bảng test đều tự động phản hồi ngay lập tức trên màn hình.
    - Hiển thị Toast thông báo trạng thái trực quan mỗi khi thao tác thành công hoặc khi đội hình đã đầy (6/6).

### 0.26. Chuẩn Hóa Giao Diện Đội Hình Party Theo Mẫu Thiết Kế:

- **Trạng thái:** Đã hoàn thành theo yêu cầu người dùng.
- **Yêu cầu người dùng:**
  1. Điều chỉnh vị trí chuẩn cho các thành phần trong panel Pokémon: icon đại diện, tên, cấp độ, thanh HP và số máu theo đúng mẫu.
  2. Khắc phục lỗi hiển thị 2 icon Pikachu: chỉ lấy 1 khung hình (frame 0) của spritesheet icon và phóng to tỉ lệ hợp lý vừa vặn vào vòng tròn Pokéball bên trái.
  3. Căn chỉnh thanh máu màu xanh nằm lọt vừa khít bên trong rãnh đen chuẩn của thanh HP (`partyHP.png`), không bị tràn viền hay lệch sang phải.
  4. Tích hợp asset mới `battler_gender.png` (cắt lát chuẩn 22x20px cho 2 trạng thái Đực ♂ và Cái ♀) đặt ở góc trên bên phải panel.
- **Thay đổi chi tiết:**
  - **Asset Registry & Manifest ([manifest.json](file:///e:/Pokemon/apps/web/public/assets/manifest.json), [asset-registry.ts](file:///e:/Pokemon/apps/web/src/assets/asset-registry.ts)):**
    - Đăng ký `party_battler_gender` trỏ tới `/Graphics/Party/battler_gender.png` và `party_panel_blank` trỏ tới `/Graphics/Party/partyPanelBlank.png`.
  - **Icon Đại Diện Pokémon ([party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
    - Khắc phục triệt để hiện tượng 2 sprite: Icon gốc 128x64 px (gồm 2 frame 64x64) được bao bởi `.ps-sprite-wrapper` kích thước `50x50` px với `overflow: hidden`, ảnh con có kích thước `100x50` px và neo bên trái (`object-position: left center`). Trình duyệt chỉ hiển thị duy nhất khung hình đầu tiên, phóng to pixel-perfect vừa vặn vào trung tâm vòng tròn Pokéball của panel.
  - **Rãnh & Thanh Máu HP Pixel-Perfect:**
    - Đo đạc chính xác rãnh đen của [partyHP.png](file:///e:/Pokemon/Graphics/Party/partyHP.png): rãnh bắt đầu tại `x = 36px`, `y = 4.3px`, chiều dài tối đa đúng `96px` và chiều cao `8px` (`.ps-hp-bar-fill`).
    - Tính toán độ rộng thanh xanh trực tiếp theo công thức `fillWidth = Math.round((currentHp / maxHp) * 96)px`. Khi đầy máu (20/20 HP) thanh dài đúng 96px, nằm lọt hoàn hảo 100% bên trong rãnh đen, hoàn toàn chấm dứt tình trạng vạch xanh tràn sang mép phải hay lệch viền.
  - **Huy Hiệu Giới Tính Chuẩn Hóa ([battler_gender.png](file:///e:/Pokemon/Graphics/Party/battler_gender.png)):**
    - Sử dụng spritesheet `44x20` px:
      - Đực (`male`): Cắt nửa trái (`0..22px`, nền xanh dương viền trắng).
      - Cái (`female`): Cắt nửa phải (`22..44px`, nền hồng viền trắng).
    - Đặt tại góc trên bên phải panel (`top: 14px; right: 18px`), tách biệt rõ ràng với tên Pokémon.
  - **Bố Cục 6 Ô Zigzag & Nút SALIR:**
    - 2 cột x 3 hàng so le chuẩn Pokémon Essentials: Ô trống dùng [partyPanelBlank.png](file:///e:/Pokemon/Graphics/Party/partyPanelBlank.png) thanh thoát không chữ thừa.
    - Hộp thoại đáy "Elige un Pokémon." viền xanh neon và nút bấm `SALIR` chuẩn xác.
- **Kiểm thử & CI:**
  - Toàn bộ 185 asset hợp lệ trên đĩa, schema validation đạt 100%.

### 0.25. Kiến Trúc Domain Layer & Hệ Thống Đội Hình Party (Tối Đa 6 Pokémon):

- **Trạng thái:** Đã hoàn thành theo yêu cầu người dùng.
- **Yêu cầu người dùng:** Xây dựng hệ thống Party tối đa 6 Pokémon dựa trên tài nguyên `Graphics/Party`, tách biệt các module riêng trong `apps/web/src/domain/`:
  - `player/`: `player-state.ts`, `player-service.ts`
  - `party/`: `party-state.ts`, `party-service.ts`
- **Thay đổi chi tiết:**
  - **Domain Player ([player-state.ts](file:///e:/Pokemon/apps/web/src/domain/player/player-state.ts), [player-service.ts](file:///e:/Pokemon/apps/web/src/domain/player/player-service.ts)):**
    - Định nghĩa cấu trúc `PlayerProfile`: tên HLV, ID, ví tiền, huy hiệu, thời gian chơi, số lượng Pokémon bắt/gặp, túi đồ (inventory) và tọa độ vị trí.
    - Quản lý giao dịch tiền tệ, vật phẩm (dùng potion, hồi sinh, bóng bắt), lưu trữ và phục hồi từ LocalStorage.
  - **Domain Party ([party-state.ts](file:///e:/Pokemon/apps/web/src/domain/party/party-state.ts), [party-service.ts](file:///e:/Pokemon/apps/web/src/domain/party/party-service.ts)):**
    - `MAX_PARTY_SIZE = 6`.
    - Định nghĩa `PartyPokemon`: UID duy nhất, loài, tên, nickname, cấp độ, kinh nghiệm, máu (HP hiện tại/tối đa), chỉ số cá thể (stats), hiệu ứng trạng thái (status), giới tính, hệ, danh sách chiêu thức và PP.
    - Cung cấp toàn bộ nghiệp vụ đội hình: thêm Pokémon khi bắt (tối đa 6), đổi vị trí (swap), đưa lên đầu làm Leader (`setLeader`), hồi phục toàn đội (`healAll`), hồi máu bằng vật phẩm (`healPokemon`), đồng bộ kết quả sau trận đấu (`syncBattleResult` cập nhật HP, PP, EXP, level-up).
  - **Giao Diện Đội Hình ([party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
    - Sử dụng đồ họa chuẩn từ `Graphics/Party/`: nền `partybg.PNG`, khung dẫn đầu `partyPanelRound.png`, các ô phụ `partyPanelRect.png`, nút hủy `partyCancel.png`, thanh máu `partyHP.png`, các biểu tượng trạng thái `statuses.PNG`.
    - Hiển thị 6 ô Pokémon trực quan: Pokeball, icon sprite chuyển động/tĩnh, Tên, Giới tính (♂/♀), Cấp độ, Thanh HP đa sắc (xanh/vàng/đỏ) kèm số máu, trạng thái gục ngã (FNT).
    - Menu ngữ cảnh tương tác cho từng Pokémon: Đổi chỗ trong đội hình, Đưa lên đầu (Leader), Xem thông tin chi tiết (Summary modal: chỉ số + bộ chiêu thức), Dùng Potion hồi máu.
  - **Tích Hợp Thế Giới & Chiến Đấu ([game-session.ts](file:///e:/Pokemon/apps/web/src/game/game-session.ts), [bootstrap.ts](file:///e:/Pokemon/apps/web/src/bootstrap.ts), [game-overlay.ts](file:///e:/Pokemon/apps/web/src/ui/game-overlay.ts)):**
    - Khi bắt đầu trận đấu: đưa Pokémon còn sống đầu tiên trong Party vào trận đấu thay vì tạo Pikachu ngẫu nhiên.
    - Khi bắt Pokémon thành công: tạo `PartyPokemon` và tự động nạp vào đội hình nếu còn chỗ (< 6).
    - Kết thúc trận đấu: đồng bộ máu còn lại, PP chiêu thức đã dùng và EXP nhận được trực tiếp vào dữ liệu đội hình.
    - Bổ sung nút "Đội hình" trên thanh điều hướng góc phải và phím tắt `P` để mở/đóng menu Party mọi lúc.
  - **Asset Manifest & Validation:**
    - Đã đăng ký tất cả asset của Party và icon `menuPokemon.png` vào [manifest.json](file:///e:/Pokemon/apps/web/public/assets/manifest.json) và [asset-registry.ts](file:///e:/Pokemon/apps/web/src/assets/asset-registry.ts).
    - Kiểm tra `validate-schemas.mjs` vượt qua 100% với toàn bộ 183 asset hợp lệ trên đĩa.

### 0.24. Cập Nhật Manifest & Loại Bỏ Tham Chiếu overlay_fight.png và cursor_command.png:

- **Trạng thái:** Đã hoàn thành theo yêu cầu người dùng.
- **Yêu cầu người dùng:** Xóa bỏ tham chiếu tới 2 file đã bị thay thế và xóa trong working tree (`Graphics/Battle/overlay_fight.png` và `Graphics/Battle/cursor_command.png`) trong `manifest.json` và code để `npm run ci` vượt qua bước kiểm tra manifest.
- **Thay đổi chi tiết:**
  - [manifest.json](file:///e:/Pokemon/apps/web/public/assets/manifest.json):
    - Đã xóa 2 key `battle_fight_overlay` và `battle_cursor_command`.
    - Đăng ký asset mới `battle_command_buttons` trỏ tới `/Graphics/Battle/command_buttons.png`.
  - [asset-registry.ts](file:///e:/Pokemon/apps/web/src/assets/asset-registry.ts):
    - Dọn dẹp union type `AssetKey`: xóa `battle_fight_overlay` và `battle_cursor_command`.
    - Xóa getter `fightOverlay`.
    - Giữ alias `cursorCommand` trỏ tới `commandButtons`.
  - [battle-assets.ts](file:///e:/Pokemon/apps/web/src/battle/battle-assets.ts):
    - Xóa bỏ trường `fightOverlay` khỏi interface `BattleAssets` và hàm khởi tạo `createBattleAssets`.
  - **Kiểm tra parity:**
    - Chạy kiểm tra manifest `node scripts/validate-schemas.mjs`: vượt qua 100% (All 167 manifest assets exist on disk).

### 0.23. Điều Chỉnh Vị Trí Tên, Giới Tính và Cấp Độ Player Pokémon Xuống Thêm 5px (Tổng 10px):

- **Trạng thái:** Đã hoàn thành theo yêu cầu người dùng (Không chạy kiểm tra tự động).
- **Yêu cầu người dùng:** Hạ thêm 5px nữa cho hàng thông tin tên, giới tính và level của player pokemon (tổng cộng hạ 10px so với gốc).
- **Thay đổi chi tiết:**
  - [style.css](file:///e:/Pokemon/apps/web/src/style.css):
    - Cập nhật `.bho-player-name`, `.bho-player-gender`, `.bho-player-level` thành `top: calc(18% + 10px);`.
    - Dời vị trí hiển thị DOM text overlay xuống thêm 5px nữa để khớp hoàn hảo vào vùng nền đen của thanh databox người chơi.
  - [battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts):
    - Cập nhật hàm `renderPlayerDatabox`: đồng bộ trục Y vẽ chữ trên canvas của Tên, Biểu tượng giới tính và Level từ `dy + 36` xuống `dy + 41` (tổng cộng +10px).

### 0.22. Cải Tiến Menu Chiêu Thức (Moves Mode): Sửa Mất Nét Chữ, Hiển Thị PP Thay Power, Bỏ Khung PP Phía Trên Nút Cancel:

- **Trạng thái:** Đã hoàn thành theo yêu cầu người dùng (Không chạy kiểm tra tự động).
- **Yêu cầu người dùng:**
  1. Sửa lại phần tên chiêu thức bị mất nét do hiển thị quá nhỏ.
  2. Sửa chỗ sức mạnh chiêu thức thành số PP của chiêu thức đó.
  3. Bỏ khung PP thừa nằm ở phía trên nút CANCEL.
- **Thay đổi chi tiết:**
  - **Khắc phục mất nét chữ tiếng Việt (Fix stroke loss & faux-bold distortion):**
    - File [style.css](file:///e:/Pokemon/apps/web/src/style.css): Loại bỏ `font-weight: 700` khỏi `.bho-move-name` (chuyển về `font-weight: 400`). VT323 là font pixel chỉ có độ đậm chuẩn, việc áp dụng `700` khiến trình duyệt áp dụng thuật toán faux-bolding nhân đôi pixel làm lem nhem và triệt tiêu các dấu phụ tiếng Việt (ấn, đuôi, iện).
    - Tăng kích thước chữ `clamp(16px, 3.0cqw, 24px)` và mở rộng vùng hiển thị chiều ngang lên `58%`, giúp các tên chiêu thức dài như "Tấn Công Chớp Nhoáng" hiển thị đầy đủ, thoáng đãng, sắc nét từng nét chữ và dấu thanh.
    - Thay thế text-shadow 8 hướng dày đặc bằng bóng đổ retro 1px tinh tế, không làm lẹm nét chữ.
  - **Hiển thị PP thay cho Sức Mạnh (Base Power):**
    - File [battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts) & [battle-text-overlay.ts](file:///e:/Pokemon/apps/web/src/battle/battle-text-overlay.ts):
      - Thay đổi nhãn hiển thị bên dưới icon hệ loại thành `${move.pp}/${move.maxPp}` (ví dụ: `35/35`, `30/30`).
      - Tự động đổi màu đỏ `#ef4444` nếu chiêu thức cạn PP (pp = 0) và màu trắng `#ffffff` nếu còn PP.
  - **Bỏ khung PP thừa phía trên nút CANCEL & Căn giữa nút CANCEL:**
    - Loại bỏ hoàn toàn khối vẽ `ppBox` và DOM overlay `.bho-pp-box`.
    - Nút CANCEL được căn giữa dọc hoàn hảo ở cột bên phải (`cancelX = 402, cancelY = py + 26, cancelW = 102, cancelH = 42`).
    - Cập nhật lại vùng click và hover trong [battle-controller.ts](file:///e:/Pokemon/apps/web/src/battle/battle-controller.ts) để thao tác bấm nút CANCEL và 4 chiêu thức ăn khớp chuẩn xác 100%.

### 0.21. Thay Thế Nút Lệnh Trận Chiến & Xóa Bỏ cursor_command.png:

- **Trạng thái:** Đã hoàn thành theo yêu cầu người dùng (Không chạy kiểm tra tự động).
- **Yêu cầu người dùng:** Thay thế các nút ở giao diện chiến đấu bằng spritesheet mới người dùng tự thiết kế và xóa bỏ file `e:\Pokemon\Graphics\Battle\cursor_command.png`.
- **Thay đổi chi tiết:**
  - **Asset mới:**
    - Lưu spritesheet mới của người dùng vào [Graphics/Battle/command_buttons.png](file:///e:/Pokemon/Graphics/Battle/command_buttons.png) (kích thước `260 × 460` px, gồm 10 hàng × 2 cột, mỗi ô nút bấm chuẩn `130 × 46` px có sẵn 2 trạng thái: cột trái = bình thường, cột phải = khi hover / chọn).
    - Đã xóa hoàn toàn file cũ `e:\Pokemon\Graphics\Battle\cursor_command.png` (file cũ 5.7MB).
  - [asset-registry.ts](file:///e:/Pokemon/apps/web/src/assets/asset-registry.ts):
    - Đăng ký asset `battle_command_buttons` trỏ tới `/Graphics/Battle/command_buttons.png`.
    - Giữ alias `cursorCommand` trỏ tới `commandButtons` để tương thích hoàn toàn.
  - [battle-assets.ts](file:///e:/Pokemon/apps/web/src/battle/battle-assets.ts):
    - Thêm trường `commandButtons` vào interface và hàm khởi tạo `createBattleAssets`.
  - [battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts):
    - Khung 4 nút lệnh chiến đấu:
      - 0: FIGHT -> Hàng 0 (`sy = 0`)
      - 1: BAG -> Hàng 2 (`sy = 92`)
      - 2: POKÉMON -> Hàng 1 (`sy = 46`)
      - 3: RUN -> Hàng 3 (`sy = 138`)
      - Cột bình thường: `sx = 0, sw = 130, sh = 46`. Cột hover: `sx = 130, sw = 130, sh = 46`.
    - Nút CANCEL trong menu chiêu thức:
      - Cắt từ Hàng 9 (`sy = 414, sh = 46, sw = 130`) với hiệu ứng hover xanh lam viền sáng.

### 0.20. Chuẩn Hóa Hiển Thị Sprite Pokémon - Phương Án 3 (Giữ Kích Thước Gốc 1:1 & Scale Nguyên Số):

- **Trạng thái:** Đã hoàn thành theo yêu cầu người dùng (Không chạy kiểm tra tự động).
- **Yêu cầu người dùng:** Sửa hiện tượng một vài Pokémon bị hiện rõ hạt pixel thô / vỡ hạt, áp dụng Phương án 3 (giữ nguyên tỉ lệ gốc 1:1 và số nguyên, loại bỏ phóng to scale lẻ).
- **Thay đổi chi tiết:**
  - [pokedex-sprite.ts](file:///e:/Pokemon/apps/web/src/ui/pokedex/pokedex-sprite.ts):
    - Đặt `scale = 1.0` cố định (thay vì scale lẻ `Math.min(1.6, Math.max(1.0, 85 / this.frameHeight))`).
    - Tất cả Pokémon khi xem chi tiết trong Pokédex đều được hiển thị ở kích thước pixel art gốc 1:1, căn giữa và đáp xuống thảm địa hình chuẩn xác, loại bỏ hoàn toàn hiện tượng giãn pixel không đều.
  - [style.css](file:///e:/Pokemon/apps/web/src/style.css):
    - Trong `.list-sprite-canvas`, cập nhật `transform: scale(1);` (thay vì `scale(1.6)`).
    - Khung xem trước danh sách Pokédex giờ đây hiển thị sprite gốc sắc nét, không bị biến dạng lưới pixel.
  - [battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts):
    - Trong `drawPlayerBattler`, chuyển `scale = 2.2` thành `scale = 2.0` (số nguyên chuẩn 2x).
    - Cả Pokémon phía ta lẫn địch đều sử dụng tỉ lệ phóng to nguyên số `2.0x` trên canvas (khớp hoàn hảo với tỉ lệ nhân đôi chuẩn 256x192 ➔ 512x384), đảm bảo mỗi hạt pixel của sprite là một khối 2x2 vuông vắn, không bị méo hay vỡ hạt.

### 0.19. Áp Dụng Font VT323 Toàn Diện Cho Toàn Bộ Dự Án:

- **Trạng thái:** Đã hoàn thành theo yêu cầu người dùng (Không chạy kiểm tra tự động).
- **Yêu cầu người dùng:** Áp dụng font chữ Google Fonts VT323 (pixel techno hỗ trợ 100% tiếng Việt) cho toàn bộ dự án.
- **Thay đổi chi tiết:**
  - [index.html](file:///e:/Pokemon/apps/web/index.html):
    - Đã có sẵn link Google Fonts cho `VT323`.
    - Bổ sung `<link rel="preload" href="/Graphics/Fonts/vt323.ttf" as="font" type="font/ttf" crossorigin />` để tải trước tức thì.
    - Bổ sung `VT323` vào thẻ hidden preloader để khởi tạo bộ nhớ đệm phông chữ cho canvas.
  - [style.css](file:///e:/Pokemon/apps/web/src/style.css):
    - Đặt `'VT323'` làm phông chữ chính tại `:root` (`font-family: 'VT323', 'Outfit', Inter, sans-serif`).
    - Cập nhật toàn bộ các bộ chọn UI (Pokédex, bảng chiêu thức, vật phẩm, thanh máu, số liệu thống kê, hội thoại, menu, etc.) ưu tiên `'VT323'` lên đầu danh sách font.
    - Cập nhật `.battle-html-overlay` sử dụng `'VT323'` làm font mặc định cho text overlay.
  - [battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts):
    - Cập nhật `BATTLE_FONT = "'VT323', 'Tiny5', 'Power Green', 'Power Red and Blue', monospace"` để toàn bộ chữ vẽ trên canvas trong trận đấu đều ưu tiên dùng `VT323`.

### 0.18. Cô Lập & Tách Biệt Toàn Bộ Thành Phần (Component Decoupling & Isolation):

- **Trạng thái:** Đã hoàn thành theo yêu cầu người dùng (Không chạy kiểm tra tự động).
- **Vấn đề người dùng phản ánh:** Khi kéo dài overlay và thay đổi kích thước canvas, các thành phần khác (Enemy Databox, Player Databox, HP/EXP bars, DOM text overlays) bị ảnh hưởng và xô lệch vị trí. Yêu cầu cô lập triệt để, chỉnh sửa phần nào chỉ ảnh hưởng cục bộ phần đó.
- **Giải pháp triệt để:**
  - **Khôi phục canvas gốc chuẩn 512 × 384 (4:3)**: Hoàn trả `CANVAS_H = 384` trong [battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts) và [battle-screen.ts](file:///e:/Pokemon/apps/web/src/battle/battle-screen.ts).
  - **Khôi phục ảnh gốc `overlay_message_3.png` (512 × 96)**: Không can thiệp sửa đổi kích thước file asset toàn cục.
  - **Khôi phục CSS chuẩn 4:3**: `.battle-wrapper` và `.battle-canvas` giữ nguyên `880 × 660` (tỉ lệ 4 / 3), `.bho-bottom-panel` giữ nguyên `25%`. Mọi databox, thanh máu, chữ text overlay trở về vị trí pixel-perfect tuyệt đối ban đầu.
  - **Tối ưu cục bộ 4 nút bấm trong khung 96px có sẵn**:
    - Điều chỉnh kích thước nút `128 × 38` px (thuôn dài, thanh thoát, giảm chiều cao để lọt thỏm vào trong viền vàng).
    - Hàng 0 (`Y = 296`, kết thúc 334), cách viền vàng trên 2px.
    - Khoảng cách giữa 2 hàng: `4px` (tách rời rõ ràng).
    - Hàng 1 (`Y = 338`, kết thúc 376), cách viền vàng dưới 2px, hoàn toàn không chạm hay lấn viền đáy.
    - Cột 0 (`X = 236`), Cột 1 (`X = 369`), cách viền phải 9px.

### 0.17. Căn Chỉnh Đối Xứng 4 Nút Lệnh & Lời Thoại Trong Khung Overlay:

- **Trạng thái:** Đã hoàn thành theo yêu cầu người dùng (Không chạy kiểm tra tự động).
- **Yêu cầu người dùng:** Sắp xếp lại 4 nút này cho thoải mái và nằm gọn gàng, cân đối bên trong khung overlay.
- **Thay đổi chi tiết:**
  - Định lại kích thước nút chuẩn `COMMAND_BTN_W = 134`, `COMMAND_BTN_H = 42`.
  - Phân bổ lại khoảng cách trục Y cân xứng hoàn hảo (khung trong cao 100px):
    - Lề trên tới viền vàng: `5px` (Hàng 0 bắt đầu tại `Y = 300`).
    - Khoảng cách giữa 2 hàng nút: `6px` (tăng từ 1px, tạo cảm giác thoáng đãng).
    - Hàng 1 bắt đầu tại `Y = 348` (kết thúc tại 390).
    - Lề dưới tới viền vàng: `5px` đối xứng hoàn hảo.
  - Phân bổ trục X:
    - Cột 1 (`x = 224` đến 358).
    - Khoảng cách giữa 2 cột: `6px`.
    - Cột 2 (`x = 364` đến 498, cách viền vàng phải 8px không còn cọ sát mép viền).
  - Canh giữa dọc phần chữ thoại ("What should Pikachu do?") tại `py + 46` và `py + 76` trên canvas và `top: 28%` trên CSS HTML overlay.

### 0.16. Mở Rộng Khung Viền overlay_message_3 Xuống Thêm 20px:

- **Trạng thái:** Đã hoàn thành theo yêu cầu người dùng (Không chạy kiểm tra tự động).
- **Yêu cầu người dùng:** Tăng phần [overlay_message_3.png](file:///e:/Pokemon/Graphics/Battle/overlay_message_3.png) xuống thêm 20px để thử nghiệm.
- **Thay đổi chi tiết:**
  - Mở rộng ảnh [overlay_message_3.png](file:///e:/Pokemon/Graphics/Battle/overlay_message_3.png) từ kích thước `512 × 96` lên `512 × 116` px (thêm 20px nền đen bên trong, dời đường viền vàng đáy xuống Y=110).
  - Tăng chiều cao canvas `CANVAS_H` từ `384` lên `404` px trong [battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts) và [battle-screen.ts](file:///e:/Pokemon/apps/web/src/battle/battle-screen.ts) để chứa trọn vẹn 20px mở rộng xuống phía dưới mà không bị cắt viền đáy.
  - Vẽ khung `overlay_message_3` với chiều cao 116px đầy đủ. Các nút lệnh (kết thúc tại Y=381) giờ đây có khoảng đệm đáy tới viền vàng là `17px` cực kỳ rộng rãi và thoáng đãng.
  - Cập nhật tỉ lệ khung hình `.battle-wrapper` và `.battle-canvas` thành `512 / 404` (chiều cao 694px) và `.bho-bottom-panel` thành `28.71%` trong [style.css](file:///e:/Pokemon/apps/web/src/style.css).

### 0.15. Kéo Dài Chiều Ngang 4 Nút Lệnh Chiến Đấu (Command Buttons Lengthening):

- **Trạng thái:** Đã hoàn thành theo yêu cầu người dùng (Không chạy kiểm tra tự động).
- **Yêu cầu người dùng:** Kéo dài chiều ngang 4 nút lệnh chiến đấu thêm nữa để nút trông thoáng đãng và trải dài thoải mái.
- **Thay đổi chi tiết:**
  - Tăng chiều rộng nút `COMMAND_BTN_W` lên **`138px`** (từ 132px, ban đầu 126px) trong [battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts).
  - Tinh chỉnh tọa độ X trong `COMMAND_BTN_COORDS`:
    - Cột trái (FIGHT, POKÉMON): `x = 226` (kết thúc tại 364).
    - Cột phải (BAG, RUN): `x = 367` (kết thúc tại 505).
    - Giữ khoảng cách giữa 2 cột: 3px; lề phải cách viền vàng 1-2px; lề trái với dòng thoại: 78px rộng rãi.
  - Tự động đồng bộ vùng hover và click chuột trong `BattleController` thông qua `getHoveredCommandIndex`.

### 0.14. Tinh Chỉnh Khung Nền Đen & Lời Thoại Trận Đấu (Bottom Panel & Dialogue Alignment):

- **Trạng thái:** Đã hoàn thành & Đã kiểm thử tự động (13/13 suites, 69/69 tests pass).
- **Yêu cầu người dùng:** Đẩy phần màu đen (khung panel/nền đen) và phần thoại xuống một chút để ôm trọn các nút lệnh (FIGHT, BAG, POKÉMON, RUN), khắc phục việc 2 nút dưới chạm/lấn viền đáy khung vàng.
- **Thay đổi chi tiết:**
  - Định nghĩa chuẩn `BOTTOM_PANEL_Y = 292` (hạ từ 288 xuống 292) trong [battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts).
  - Khung viền `overlay_message_3.png` dịch xuống Y=292, đưa viền vàng trên và dưới ôm vừa khít 4 nút lệnh ở Y=296..381 mà không bị đè hay lấn ra ngoài.
  - Đồng bộ vùng vẽ nền `assets.bg` và vùng clip người chơi lên `BOTTOM_PANEL_Y`.
  - Dịch chữ thoại xuống tương ứng (`py + 38` và `py + 66`) trên canvas và CSS overlay `top: 26%` trong [style.css](file:///e:/Pokemon/apps/web/src/style.css).
- **Kiểm thử & CI:**
  - 13/13 test files (69/69 tests) Vitest PASS 100%.
  - `npx tsc --noEmit` PASS 100%.

### 0.13. Tách Biệt Lớp Chữ DOM HTML (High-DPI Battle Text Overlay):

- **Trạng thái:** Đã hoàn thành & Đã kiểm thử tự động (13/13 suites, 69/69 tests pass).
- **Vấn đề cốt lõi người dùng phản ánh:**
  - Chữ trên canvas 2D bị trình duyệt khử răng cưa (subpixel anti-aliasing) lan tỏa sang các pixel lân cận với độ mờ đục 50%, làm chữ trắng bị ám màu xám đục (`#808080`).
  - Khi canvas 512x384 được phóng to lên 880x660, các viền mờ này bị phóng to làm mất tính chất sắc nét của phông chữ pixel art ("nhìn đi khác xa vsphong chữ tách biệt phông chữ để kho bị ảnh hưởng bởi trình duyệt").
- **Giải pháp triển khai hoàn chỉnh:**
  1. **Tách biệt hoàn toàn lớp chữ ra khỏi canvas**: Xây dựng module [BattleTextOverlay](file:///e:/Pokemon/apps/web/src/battle/battle-text-overlay.ts) dựng một layer DOM HTML độc lập (`.battle-html-overlay`) nằm ngay phía trên canvas.
  2. **Hiển thị ở độ phân giải thực của màn hình**: Chữ trong HTML được trình duyệt render trực tiếp theo pixel vật lý của màn hình (1080p, 2K, 4K), loại bỏ 100% hiện tượng downsampling và nội suy mờ từ buffer canvas 512x384.
  3. **Màu trắng tuyệt đối & viền đen sắc nét**: Sử dụng CSS `color: #ffffff` với `text-shadow` 8 hướng 1px bao quanh chữ, giữ thân chữ trắng tinh khiết 100%, không bị ám xám hay lấn nét.
  4. **Font pixel hỗ trợ đầy đủ tiếng Việt**: Thiết lập ưu tiên `'Power Green Narrow', 'Tiny5', 'Power Clear', monospace`.
  5. **Tắt vẽ chữ trên canvas**: Thêm cờ `disableCanvasText = true` vào [BattleRenderer](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts), canvas chỉ chịu trách nhiệm vẽ sprite Pokémon, background, thanh máu HP/EXP và các nút icon, không còn chữ mờ đè bên dưới.
  6. **Tích hợp bộ nút vát góc mới từ hình ảnh người dùng cung cấp & Kích thước ban đầu (126x42)**:
     - Tích hợp trực tiếp spritesheet nút bấm mới theo hình ảnh người dùng đính kèm vào [Graphics/Battle/cursor_command.png](file:///e:/Pokemon/Graphics/Battle/cursor_command.png) (579x1024) với thiết kế vát góc hiện đại, loại bỏ viền đen ngoài thành trong suốt (alpha = 0) bằng thuật toán flood-fill không làm ảnh hưởng viền chữ bên trong nút.
     - Giữ nguyên kích thước bố cục ban đầu: `126 × 42` px mỗi nút, đặt tại tọa độ chuẩn: FIGHT (252, 296), BAG (381, 296), POKÉMON (252, 339), RUN (381, 339).
     - Cắt lát chính xác theo từng hàng nút và trạng thái hover/unhover trong [BattleRenderer](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts), đồng bộ vùng click và hover trong [BattleController](file:///e:/Pokemon/apps/web/src/battle/battle-controller.ts).
  7. **Không ảnh hưởng tương tác click**: Đặt `pointer-events: none` trên `.battle-html-overlay` để mọi thao tác rê chuột và bấm chuột truyền xuyên thấu nguyên vẹn xuống canvas và [BattleController](file:///e:/Pokemon/apps/web/src/battle/battle-controller.ts).
- **Kiểm thử & CI:**
  - 13/13 test files (69/69 tests) Vitest PASS 100%.
  - `npx tsc --noEmit` PASS 100% không cảnh báo hay lỗi kiểu.

## Cập nhật trước: 2026-10-03 (Triển Khai Desktop Preview Độc Lập bằng Tauri v2 & Tối Ưu Toàn Màn Hình)

### 0.11. Triển Khai Desktop Preview Bằng Tauri v2 & Shell Toàn Màn Hình:

- **Trạng thái:** Preview / Thử nghiệm Desktop độc lập (Không phải production release backend).
- **Mục tiêu đạt được:**
  - Khởi tạo kiến trúc Desktop Shell độc lập tại [apps/desktop/src-tauri](file:///e:/Pokemon/apps/desktop/src-tauri) sử dụng Tauri v2.
  - Không thay đổi bất kỳ domain/battle/map logic nào; tách biệt hoàn toàn shell desktop với core web application.
  - Hỗ trợ toàn màn hình (Fullscreen):
    - Phím tắt `F11` chuyển đổi toàn màn hình.
    - Phím tắt `Esc` thoát toàn màn hình (an toàn, không xung đột khi mở modal/Pokédex).
    - Nút bấm trực quan `btnToggleFullscreen` trên giao diện điều khiển chẩn đoán.
    - Giữ nguyên tỉ lệ hiển thị pixelated crisp-edges của game canvas, UI responsive theo viewport mà không làm méo hình.
  - Đổi tiền tố hiển thị cấp độ trong trận đấu từ `Nv.` sang `Lv.` theo đúng chuẩn quốc tế.
  - Cập nhật spritesheet nút chiến đấu mới ([Graphics/Battle/cursor_command.png](file:///e:/Pokemon/Graphics/Battle/cursor_command.png)):
    - Thiết kế lại sắc nét với icon pixel-art độc đáo: FIGHT (Ngôi sao phát sáng), POKÉMON (Pokéball), BAG (Ba lô thám hiểm), RUN (Giày chạy viền tia sét), CALL, BALL, ROCK, BAIT, CANCEL.
    - Phân tách 2 trạng thái: Cột trái (Hover/Active - viền sáng và hiệu ứng lấp lánh sparkle), Cột phải (Normal/Idle - đổ bóng êm dịu).
    - Tách nền đen thành trong suốt pixel-perfect để bo góc kim loại hiển thị tự nhiên trên nền thanh chiến đấu.
  - Bộ scripts thực thi trong monorepo:
    - `npm run desktop:dev`: Khởi động cửa sổ desktop Tauri kèm Vite dev server tự động.
    - `npm run desktop:build`: Build production web bundle rồi biên dịch bản phát hành Windows độc lập.
- **Kết quả Build Windows Release:**
  - `apps/desktop/src-tauri/target/release/pokeoverworld-desktop.exe`
  - Bundle MSI: `PokeOverworld_0.1.0_x64_en-US.msi` (3.16 MiB)
  - Bundle NSIS: `PokeOverworld_0.1.0_x64-setup.exe` (2.20 MiB)
- **Biên bản Asset Warnings còn tồn tại trong production build:**
  - `/Graphics/Fonts/power clear.ttf` (Font power clear dùng runtime CSS)
  - `/Graphics/Fonts/vt323.ttf` (Font retro 8-bit dùng runtime CSS)
  - `/Graphics/Pokedex/bg_list.png?v=teal` (Texture Pokédex)
  - `/Graphics/Pokedex/cursor_list.png?v=teal`
  - `/Graphics/Pokedex/icon_slider.png?v=teal`
  - `/Graphics/Pokedex/bg_info.png?v=teal`
  - `/Graphics/Pokedex/advancedInfoBar.png`
  - _Định hướng kế tiếp:_ Triển khai Asset Resolver chuẩn hóa các đường dẫn runtime này vào `public/assets` hoặc import tĩnh qua Vite trong phase hoàn thiện asset pipeline.
- **Kiểm thử & CI:**
  - Test suite mới [apps/web/test/desktop-shell.test.ts](file:///e:/Pokemon/apps/web/test/desktop-shell.test.ts) (5/5 tests pass).
  - Toàn bộ 13 test suites (67 tests) Vitest PASS 100%.
  - 12 Python unittests PASS 100%.
  - Pipeline `npm run ci` PASS 100% (Validate schemas, ESLint, Prettier, TypeScript, Vitest, Vite build).

- **Yêu cầu & Định hướng người dùng:**
  - Sinh làng mạc tự nhiên dọc đại lộ theo chu kỳ `VILLAGE_CYCLE_HEIGHT = 96`.
  - Bố trí hợp lý, thoáng đãng, không gập khuôn; đường đi nối liền mạch và quanh co, không tạo ngõ cụt dọc giữa các vách nhà; tránh xếp chồng nhà thẳng hàng làm mái nhà dưới che cửa nhà trên.
  - Mỗi ngôi làng cơ bản luôn có: 1 Trung tâm Pokémon (`pokecenter`), 1 Cửa hàng PokéShop (`pokemart`), và 1 biển báo (`signpost`) đặt ngay sát cạnh bên phải PokéMart.
  - Nhà dân (`house_red`, `house_cottage`, `house_flowers`) phân bố theo quy mô (Tier 0: Hamlet, Tier 1: Town, Tier 2: City) với sân vườn, hoa cỏ và cây bóng mát tự nhiên xung quanh.
  - **Hitbox Pixel-Perfect:** Khắc phục triệt để lỗi hitbox bị lệch lên mái nhà hoặc lệch khỏi chân tường. Đo đạc chính xác chân tường tiếp đất thực tế và vị trí cửa ra vào của từng công trình, đảm bảo cửa mở (walkable) và tường bao cản bước chính xác từng pixel.
- **Tài nguyên công trình tích hợp ([manifest.json](file:///e:/Pokemon/apps/web/public/assets/manifest.json)):**
  - `building_pokecenter.png` (256x311, 7x3 ô footprint va chạm, cửa kính trượt trung tâm tại dx=3, dy=2).
  - `building_pokemart.png` (129x133, 4x2 ô footprint va chạm, cửa cuốn tại dx=1, dy=1).
  - `building_house_red.png` (256x337, 6x3 ô footprint va chạm, cửa hiên tam giác tại dx=4, dy=2).
  - `building_house_cottage.png` (192x243, 6x2 ô footprint va chạm, cửa gỗ tại dx=1, dy=1).
  - `building_house_flowers.png` (192x319, 6x2 ô footprint va chạm, cửa chính tại dx=3, dy=1).
  - `building_signpost.png` (68x124, 1x1 ô chân cột tại dx=0, dy=0, va chạm cột gỗ 20x18).
- **Quy hoạch & Mạng lưới đường xá (Organic Street Network):**
  - Trục đại lộ chính nối từ cao tốc chạy ngang qua trung tâm làng.
  - Phân khu thương mại phía Nam (PokéCenter & PokéMart) có thềm đi bộ rộng nối thẳng cửa 2 công trình.
  - Phân khu dân cư phía Bắc có lối đi vào tận thềm cửa từng căn nhà, kết nối qua sân hoa trung tâm.
  - Đảo cỏ xanh trung tâm ("đảo cỏ") có hoa chuông tím (`flower_purple_bell`) và hoa xanh trang trí.
- **Độ tin cậy & Kiểm thử:**
  - Viết mới test suite [apps/web/test/village.test.ts](file:///e:/Pokemon/apps/web/test/village.test.ts) (7/7 tests pass).
  - Toàn bộ 55 unit tests PASS 100%. Build production hoàn tất không lỗi.

### 0.9. Triển Khai Hoàn Tất Hoạt Ảnh Sóng Biển & Đại Dương Vô Tận (Ocean & Shoreline Wave Animation):

- **Yêu cầu người dùng:** Tích hợp 4 spritesheet hoạt ảnh nước biển (mép sóng vỗ bờ, mặt nước đại dương, các góc khúc quanh mép biển) với bố cục bãi cát 5 ô rồi tới mép biển có sóng dạt bờ, phía Đông ngoài khơi là đại dương vô tận.
- **Tài nguyên Sprite & Hoạt ảnh:**
  - `shore_anim_vertical.png` (256x32, 8 khung hình 32x32): Dải sóng biển cuộn dạt vào bờ cát bên trái và rút êm dịu sang phải.
  - `ocean_anim_strip.png` (256x32, 8 khung hình 32x32): Mặt nước đại dương xanh thẫm với gợn sóng caustics tự nhiên.
  - `shore_anim_corner_in.png` & `shore_anim_corner_out.png` (256x32, 8 khung hình): Khúc lượn bờ biển khi đường bờ chuyển hướng.
  - `shore_anim_corner_in_flip.png` & `shore_anim_corner_out_flip.png`: Các góc đối xứng lượn bờ biển.
  - Đăng ký đầy đủ vào [apps/web/public/assets/manifest.json](file:///e:/Pokemon/apps/web/public/assets/manifest.json).
- **Quy tắc địa hình & Toán học liên tục (Continuous World Generation):**
  - Bãi cát rộng cố định 5 ô: `BEACH_WIDTH = 5`.
  - Mép biển tại `oceanBoundary = getCoastBoundary(gy, seed) + BEACH_WIDTH`.
  - Bãi cát biển (`TERRAIN.BEACH_SAND`): `coast <= gx < oceanBoundary`.
  - Đại dương vô tận (`TERRAIN.OCEAN_WATER`): `gx >= oceanBoundary`.
  - Autotile cát: Mặt tiếp giáp giữa bãi cát và đại dương dùng `isSandOrOcean` để cát mép biển giữ nguyên chất cát vàng tinh khiết (`sand_pure`), không bị viền cỏ xanh xen lẫn.
- **Hệ thống Renderer & Hoạt ảnh thời gian thực (Real-time Water Renderer):**
  - [GroundRenderer](file:///e:/Pokemon/apps/web/src/rendering/ground-renderer.ts):
    - Khử nền cỏ tĩnh tại vùng nước biển và mép sóng trên canvas tĩnh của chunk.
    - Vẽ hoạt ảnh động tại `renderWaterTiles()` với nhịp 280ms/khung hình đồng bộ hoàn hảo với sông hồ.
    - Mép biển (`gx === oceanBoundary`) vẽ dải sóng vỗ bờ dạt cát `shore_anim_vertical` / góc lượn.
    - Đại dương ngoài khơi (`gx > oceanBoundary`) vẽ mặt nước caustics `ocean_anim_strip`.
- **Luật va chạm (Collision):**
  - Bãi cát biển (`TERRAIN.BEACH_SAND`) hoàn toàn đi bộ được (walkable).
  - Mép sóng và đại dương (`TERRAIN.OCEAN_WATER`) có collider cản lại, chặn nhân vật đi bộ xuống biển theo đúng chuẩn game Pokémon GBA gốc.
- **Đồng bộ song song Python & Viewer:**
  - [map_generator/tiles.py](file:///e:/Pokemon/map_generator/tiles.py), [map_generator/chunk.py](file:///e:/Pokemon/map_generator/chunk.py) và [map_viewer.html](file:///e:/Pokemon/map_viewer.html) đều được cập nhật đồng bộ các tile ID 730..735 và công thức bãi cát + đại dương.
- **Kiểm thử & CI:**
  - Viết mới test suite [apps/web/test/ocean-beach.test.ts](file:///e:/Pokemon/apps/web/test/ocean-beach.test.ts) kiểm tra độ rộng bãi cát, vị trí mép sóng, tile ID và va chạm.
  - Toàn bộ pipeline `npm run ci`:
    - Schema validation: PASS (75 tile IDs & 100 assets match).
    - ESLint, Prettier, TypeScript typecheck: PASS 100%.
    - Vitest: **38/38 tests PASS 100%**.
    - Vite production build: PASS 100%.

### 0.8. Triển Khai Hoàn Tất Đặc Tả Phân Bố Sinh Thái Theo Vùng (Regional Ecological Distribution System):

- **Tài liệu đặc tả:** [BIOME_DISTRIBUTION_DEV_SPEC.md](file:///e:/Pokemon/docs/plans/BIOME_DISTRIBUTION_DEV_SPEC.md) (Chuyển trạng thái sang **Đã triển khai**).
- **Mục tiêu hoàn thành:** Thay thế phân bố đồng đều bằng hệ sinh thái phân vùng tự nhiên, liên tục, tất định 100% (deterministic), không tạo đường biên (seams) giữa các chunk, bảo toàn 100% luật địa hình, tile ID và va chạm.
- **Tiến trình triển khai qua 9 bước nghiêm ngặt (Section 12):**
  1. **Trường sinh thái duy nhất (Single Ecological Field - Step 1):**
     - Tạo module thuần dữ liệu [apps/web/src/maps/ecology/](file:///e:/Pokemon/apps/web/src/maps/ecology/).
     - Sinh 2D value noise tần số thấp $f = 0.055$ nội suy bilinear smoothstep với salt riêng biệt: `ECOLOGY_FERTILITY_SALT (0x2401)`, `ECOLOGY_MOISTURE_SALT (0x2402)`, `ECOLOGY_DENSITY_SALT (0x2403)`.
     - Phân loại 6 vùng sinh thái (`coast`, `wetland`, `meadow`, `dryland`, `dense_forest`, `hill_edge`).
  2. **Debug Overlay (Step 2):**
     - Bổ sung 4 chế độ heatmap trực quan: Độ ẩm (Moisture: vàng $\rightarrow$ xanh lam), Độ phì (Fertility: đất son $\rightarrow$ xanh tươi), Mật độ (Density: xanh nhạt $\rightarrow$ xanh thông đậm), Vùng sinh thái (Zone: phân màu sắc nét).
     - Giám sát thời gian thực ô trỏ chuột (tọa độ toàn cầu, vùng sinh thái, chỉ số M/F/D) và thống kê chunk (số cây, hoa, berry, cỏ cao, Pokémon hoang dã).
  3. **Phân bố cây cối (Trees - Step 3):**
     - Số ứng viên biến thiên theo mật độ sinh thái $2 - 8$ cây/chunk.
     - Đồng bộ `defaultTree` từ [biomes.json](file:///e:/Pokemon/packages/game-data/biomes.json): ven biển/nước $\rightarrow$ `coastal`, rừng rậm $\rightarrow$ `deep`, đất khô cằn/thu $\rightarrow$ `autumn`, đồng cỏ $\rightarrow$ `vibrant`.
     - Giữ nguyên 100% kiểm tra chống đè giữa các cây và giữa 9 chunk lân cận.
  4. **Cụm hoa sinh thái (Flower Clustering - Step 4):**
     - Chia cụm theo seed góc phần tư, tạo các vạt hoa cùng tông màu thay vì rải ngẫu nhiên từng ô.
     - Bảng màu ưu tiên: Wetland (trắng, xanh dương), Dryland (đỏ, tím), Dense Forest (xanh dương, tím), Meadow (đỏ, trắng).
  5. **Chuẩn hóa Berry (Berry Metadata & Rarity/Habitat - Step 5):**
     - Mở rộng [berry-data.ts](file:///e:/Pokemon/apps/web/src/maps/berry-data.ts) với `rarity` (common, uncommon, rare), `habitat` (wet, dry, neutral) và trọng số spawn.
     - Lum & Sitrus là quả hiếm (Rare: weight 15 vs Common: 80-100).
     - Chọn berry theo vùng sinh thái: Wetland ưu tiên quả wet, Dryland ưu tiên quả dry, Meadow/Forest ưu tiên neutral và common.
  6. **Mật độ cỏ cao (Tall Grass Density - Step 6):**
     - Điều chế số lượng vạt cỏ và kích thước theo công thức:
       $$\text{tallGrassDensity} = \text{clamp}(\text{base} + m \cdot 0.4 + f \cdot 0.3 + d \cdot 0.3, 0.0, 1.0)$$
     - Vùng khô cằn có ít cỏ hoặc quang đãng, vùng rừng ẩm có nhiều vạt cỏ rậm rạp.
  7. **Ngữ cảnh Encounter & Level tất định (Encounters - Step 7):**
     - Triển khai `EncounterContext`: `zone`, `onTallGrass`, `nearWater`, `nearTree`, `nearHill`, `timeOfDay`.
     - Roster chọn trực tiếp từ [encounters.json](file:///e:/Pokemon/packages/game-data/encounters.json): Rừng rậm $\rightarrow$ `VIRIDIAN_FOREST`, vùng đồi/khô $\rightarrow$ `ROUTE_22`, đồng cỏ $\rightarrow$ `ROUTE_1`.
     - Level sinh tất định bằng `seed + LEVEL_SALT (0x7331)` trong khoảng $[minLevel, maxLevel]$, tái tạo 100% khi nạp lại.
  8. **Đồng bộ song song Python (Python Parity - Step 8):**
     - Tạo module [map_generator/ecology.py](file:///e:/Pokemon/map_generator/ecology.py) với cùng salts, frequency và công thức toán học.
     - Viết mới test suite [tests/test_ecology_parity.py](file:///e:/Pokemon/tests/test_ecology_parity.py) kiểm tra độ khớp số học chính xác đến từng chữ số thập phân giữa Python và TypeScript.
  9. **Kiểm thử thống kê & CI (Statistical Tests & Production Build - Step 9):**
     - Viết mới [apps/web/test/ecology-statistical.test.ts](file:///e:/Pokemon/apps/web/test/ecology-statistical.test.ts) kiểm tra 50 seeds $\times$ 81 chunks:
       - Rừng rậm có mật độ cây cao hơn hẳn vùng khô cằn ($avg \ge 6.0$ vs $\le 4.5$).
       - Wetland có tỷ lệ hoa xanh/trắng áp đảo hoa đỏ/tím.
       - Berry hiếm chiếm dưới 10% tổng số quả spawn.
       - Pokémon phân bố đúng theo ngữ cảnh sinh thái.
     - Toàn bộ pipeline CI đạt chuẩn:
       - Vitest: **34/34 tests PASS 100%**.
       - Python: **12/12 tests PASS 100%**.
       - Schema validation, ESLint, Prettier, TypeScript typecheck, Vite production build PASS 100%.

### 0.7. Khởi Tạo Git & Đẩy Thành Công Lên GitHub Remote:

- **Repository Remote:** `https://github.com/Anchinlu/PokeOverworld.git`
- **Nhánh chính (Branch):** `main`
- **Trạng thái:**
  - Khởi tạo `git init -b main`.
  - Thiết lập `.gitignore` chuẩn hóa (loại trừ `node_modules`, `dist`, `scratch`, `__pycache__`, và các file tạm).
  - Hoàn thành commit đầu tiên: `feat: initial commit - PokeOverworld GBA retro infinite terrain, Pokedex, water caustics, and organic flora` (Commit ID: `57fb19c7`).
  - Đẩy thành công 100% lên remote: `git push -u origin main`.
  - Cây thư mục làm việc sạch sẽ hoàn toàn (`working tree clean`).

### 0.6. Điều Chỉnh Tốc Độ Hoạt Ảnh Nước & Ngẫu Nhiên Hóa Vạt Cỏ Cao (Overworld Organic Tall Grass):

- **Yêu cầu & Phản hồi từ người dùng:**
  1. _Làm chậm animation của nước:_ Hoạt ảnh mặt nước lượn sóng trước đây chạy 150ms/frame hơi nhanh, cần làm chậm lại để mặt nước êm ả, thanh bình chuẩn phong cách overworld GBA.
  2. _Chấm dứt sự rập khuôn của cỏ cao:_ Các mảng cỏ cao trước đây có hình dạng tròn giống nhau ở mọi chunk. Cần ngẫu nhiên hóa kích thước, số lượng và hình dạng hữu cơ (organic) để tạo thế giới mở overworld tự nhiên, không rập khuôn khuôn mẫu.
- **Giải pháp xử lý:**
  - **Tốc độ sóng nước (Water Animation Timing):**
    - Điều chỉnh chu kỳ trong [ground-renderer.ts](file:///e:/Pokemon/apps/web/src/rendering/ground-renderer.ts) từ 150ms lên **280ms mỗi khung hình** (chu kỳ đầy đủ 8 frame kéo dài $\sim 2.24$ giây).
    - Hiệu ứng caustics phản chiếu êm dịu, thư thái, không gây chớp nháy mắt.
  - **Sinh cỏ cao ngẫu nhiên & phi khuôn mẫu ([chunk-objects.ts](file:///e:/Pokemon/apps/web/src/maps/chunk-objects.ts) & [chunk.py](file:///e:/Pokemon/map_generator/chunk.py)):**
    - _Số lượng vạt cỏ biến thiên (Patch Quantity):_
      - $20\%$ chunk: 0 vạt cỏ (đồng cỏ quang đãng, tầm nhìn mở).
      - $45\%$ chunk: 1 vạt cỏ tự nhiên quy mô vừa hoặc lớn.
      - $35\%$ chunk: 2 - 3 vạt cỏ nhỏ mọc rải rác bên đường mòn hoặc ven suối.
    - _Kích thước ngẫu nhiên (Patch Dimensions):_
      - Chiều rộng `pw` ngẫu nhiên từ $3$ đến $7$ ô, chiều cao `ph` ngẫu nhiên từ $2$ đến $5$ ô.
    - _4 Phong cách hình thái hữu cơ (Organic Shape Styles):_
      - _Style 0 (Organic Blob):_ Vạt cỏ bầu dục với nhiễu viền biên độ cao, mép cỏ lồi lõm tự nhiên.
      - _Style 1 (Stepped Route Field):_ Vạt cỏ chữ nhật bậc thang chuẩn phong cách Pokémon FireRed/Emerald với góc khuyết ngẫu nhiên.
      - _Style 2 (Elongated Strip):_ Dải cỏ dài hẹp chạy men theo lối đi hoặc sườn đồi.
      - _Style 3 (L-Shaped Meadow):_ Vạt cỏ góc lượn tự nhiên.
    - _Cỏ cao núi cao (Alpine Tall Grass):_ Sinh $1 - 2$ cụm cỏ núi cao kích thước ngẫu nhiên tương thích mặt bằng cao nguyên đá, tuyệt đối không chạm mép rìa vách (`!isNearCliffEdge`).
    - _Toàn vẹn loại trừ va chạm:_ Duy trì kiểm tra an toàn 100% với cây lớn, bụi berry, vách đá, sông ngòi và quốc lộ.
- **Kiểm thử tự động:**
  - `vitest`: **20/20 tests PASS 100%**.
  - Python tests: **7/7 tests PASS 100%**.
  - `npm run ci`: **PASS toàn bộ** (Schema validation, ESLint, Prettier, TypeScript, Vite build).

### 0.5. Tối Ưu Dòng Sông Lớn Pixel Art & Đa Dạng Hóa Kích Thước / Hình Dạng Hồ Nước:

- **Yêu cầu & Phản hồi từ người dùng:**
  1. _Dòng sông không uốn cong hình sin (Sinusoidal wavy curves):_ Game theo phong cách Pixel Art GBA, sông không được uốn lượn chéo răng cưa mà phải đi thẳng hoặc quẹo cua vuông vức 90° / bậc thang pixel art đồng bộ với phong cách kẻ đường quốc lộ.
  2. _Quy mô sông lớn (Grand Pixel River):_ Sông không được nhỏ 1-2 ô. Mở rộng bề rộng sông lên **5 ô (5 tiles wide)** để gia tăng diện tích mặt nước `water_pure`, giúp hiệu ứng hoạt ảnh sóng nước (caustics) hiển thị bao la, hùng vĩ.
  3. _Cầu gỗ lớn bắc ngang sông:_ Cầu gỗ trên quốc lộ mở rộng kích thước lên $3 \text{ cột} \times 5 \text{ hàng}$ bao trọn toàn bộ bề rộng của dòng sông lớn.
  4. _Đa dạng kích thước & hình dạng hồ nước (Diverse Lakes):_ Hồ không được đơn điệu 1 kích thước nhỏ. Triển khai 4 biến thể hồ với kích thước to nhỏ khác nhau:
     - **Biến thể 0 (Compact Meadow Pond):** Ao nhỏ đồng cỏ $4\times 4$ ô bo góc nhẹ.
     - **Biến thể 1 (L-Shaped Lagoon):** Hồ góc thước chữ L $7\times 8$ ô với góc vuông 90° pixel art hoàn hảo.
     - **Biến thể 2 (Grand Stepped Lake):** Đại hồ rộng lớn $8\times 11$ ô với vùng nước mở `water_pure` bao la.
     - **Biến thể 3 (Elongated / Twin Lake):** Hồ bầu dục dài $5\times 9$ ô.
- **Giải pháp toán học & Thuật toán sinh địa hình:**
  - **Grand River Corridor (`isRiverTile`):**
    - Chạy ngang Đông - Tây qua chu kỳ $H = 96$ ô tại hàng $baseY = k \times 96 + 48$.
    - Tại hành lang cắt qua quốc lộ: Chạy thẳng hàng ngang hoàn hảo $gy \in [baseY, baseY + 4]$ (bề rộng 5 ô).
    - Ra khỏi hành lang quốc lộ: Chuyển hướng theo các bậc 90° (`turnW`, `turnE`) với độ lệch $\pm 2$ ô, kết nối bằng khối chuyển tiếp vuông vức. Autotile 13 hướng nhận diện góc vuông, góc lồi, góc lõm tự nhiên 100%.
  - **Grand Bridge (`isBridgeTile`):**
    - Chiều rộng 3 cột khớp với quốc lộ, chiều dài 5 hàng phủ kín toàn bộ 5 hàng nước của dòng sông lớn.
    - Người chơi di chuyển mượt mà qua cầu gỗ, nước dưới chân cầu tiếp tục cuộn sóng.
  - **Thuật toán xếp đặt hồ thông minh (`getLakePlacement` / `isLakeTile`):**
    - Kiểm tra trước toàn bộ diện tích footprint và khoảng cách an toàn (cách xa đường sá, bãi cát bờ biển $\ge 1$ ô, không chạm vách núi hay lòng sông).
    - Ưu tiên biến thể ngẫu nhiên theo seed; nếu biến thể lớn không đủ diện tích an toàn trong thung lũng, tự động fallback sang biến thể nhỏ hơn $\rightarrow$ đảm bảo **100% hồ nước xuất hiện đều nguyên vẹn, tròn trịa, không bị cắt xén**.
- **Đồng bộ song song TypeScript & Python:**
  - Triển khai thuật toán và cơ chế cache `lakeCache` giống nhau 100% giữa [terrain-rules.ts](file:///e:/Pokemon/apps/web/src/maps/terrain-rules.ts) và [map_generator/chunk.py](file:///e:/Pokemon/map_generator/chunk.py).
- **Kiểm thử tự động:**
  - Cập nhật [water-terrain.test.ts](file:///e:/Pokemon/apps/web/test/water-terrain.test.ts) bổ sung kiểm tra:
    - Sông lớn đạt chính xác độ rộng 5 ô tại điểm giao cắt.
    - Cầu gỗ có đúng $3 \times 5 = 15$ ô cầu bắc qua sông.
    - Hệ thống hồ sinh đầy đủ $\ge 3$ biến thể kích thước đa dạng trên bản đồ.
  - Kết quả: **20/20 Frontend Vitest tests PASS 100%**, **7/7 Python tests PASS 100%**, `npm run ci` thành công tuyệt đối!

### 0.4. Tích Hợp Địa Hình Nước (Sông Uốn Lượn, Hồ Tự Nhiên, Cầu Gỗ & Animation Sóng Nước 8 Frame):

- **Tài nguyên ảnh người dùng cung cấp:**
  1. _Lưới autotile viền bờ cỏ 3x3 ($96\times 96\text{px}$):_ 8 tile viền mép bờ (`water_tl`, `water_tr`, `water_bl`, `water_br`, `water_top`, `water_bot`, `water_left`, `water_right`) và 1 tile nước thuần (`water_pure`).
  2. _Lưới góc bo trong 2x2 ($64\times 64\text{px}$):_ 4 tile góc lõm nước (`water_in_tl`, `water_in_tr`, `water_in_bl`, `water_in_br`).
  3. _Dải hoạt ảnh sóng nước ($256\times 32\text{px}$):_ 8 frame sóng nước lượn caustics tuần hoàn sống động.
  4. _Cầu gỗ Pixel Art GBA ($32\times 32\text{px}$):_ Thiết kế đồng bộ 2 loại cầu `bridge_wood_v` (cầu dọc bắc qua sông ngang) và `bridge_wood_h` (cầu ngang).
- **Kiến trúc địa hình & Autotile (Hệ 700 series):**
  - **Dòng sông uốn lượn (Meandering River):** Khởi nguồn từ vùng núi phía Tây, uốn lượn tự nhiên qua thung lũng cỏ, cắt ngang quốc lộ trung tâm và đổ ra biển Đông. Tại vị trí cắt ngang quốc lộ, tự động sinh cầu gỗ `bridge_wood_v` có tay vịn và cọc gỗ chắc chắn.
  - **Hồ nước tự nhiên (Scenic Ponds / Lakes):** Rải rác tại các khoảng trống đồng cỏ yên bình ($4\times 5$ ô oval bo góc mềm mại), cách ly tối thiểu 2 ô với đường xá, vách núi và bờ biển.
  - **Hệ thống Autotile 13 hướng:** Tự động nhận diện kết nối 8 ô lân cận, xử lý mượt mà cả góc lồi, góc lõm và điểm tiếp giáp với cầu gỗ.
- **Hệ thống Render phân tầng (Two-Layer Water Rendering):**
  - _Layer -0.1 (Live Caustics):_ Vẽ lớp sóng nước hoạt ảnh 8 khung hình (~150ms/frame) liên tục ở 60 FPS bên dưới các ô nước và dưới chân cầu gỗ.
  - _Layer 0 (Ground Canvas):_ Mép cỏ bờ hồ được căn chỉnh màu sắc đồng nhất 100% với cỏ nền `grass_1..4` và đục lỗ trong suốt để sóng nước hoạt ảnh phản chiếu tự nhiên, không lộ bất kỳ đường viền ghép ô nào.
- **Quy tắc va chạm & Sinh thái (Collision & Exclusion):**
  - Red và Pikachu **không thể bước xuống mặt nước** (`TERRAIN.OCEAN_WATER` là vật cản không đi xuyên qua được), nhưng **hoàn toàn có thể đi lại tự do trên cầu gỗ** (`TERRAIN.ROAD`).
  - Cây cối, bụi berry, hoa dại và cỏ cao được lập trình cấm sinh trên nước và cách xa mép nước tối thiểu 1 ô an toàn.
- **Kiểm thử tự động:**
  - Viết mới test suite [water-terrain.test.ts](file:///e:/Pokemon/apps/web/test/water-terrain.test.ts) kiểm tra:
    1. Tính đồng nhất và tất định (Deterministic) của sông, hồ và cầu gỗ qua các seed.
    2. Chặn va chạm 100% trên nước và cho phép đi qua trên cầu gỗ.
    3. Không có bất kỳ thực vật, cây cối hay bụi berry nào mọc trên nước.
  - Kết quả: **18/18 Frontend Vitest tests PASS 100%**, **7/7 Python tests PASS 100%**, `npm run ci` thành công tuyệt đối (69 Tile IDs, 94 manifest assets).

### 0.3. Triệt Tiêu Sinh Thực Vật/Berry Ở Mép Rìa Vách Núi & Bổ Sung Cỏ Cao Lên Cao Nguyên Núi:

- **Phân tích & Yêu cầu:**
  1. _Chống mọc ở rìa vách:_ Các loại hoa/thực vật (`plants`) và bụi berry (`berryBushes`) không được mọc ở mép bờ, rìa, gờ đá hay chân vách núi (`isNearCliffEdge`), tránh hiện tượng sprite treo lơ lửng giữa vách dựng đứng 2D.
  2. _Bổ sung cỏ cao lên vách:_ Cỏ cao (`tallGrass`) được mở rộng sinh trên mặt phẳng cao nguyên đồi núi (`TERRAIN.HILL` & `TILE_IDS.cliff_pure`), nhưng tuyệt đối **không mọc ở rìa/mép/chân vách núi**, và giữ nguyên nền `cliff_pure` để không làm mất texture đá nền tự nhiên.
- **Giải pháp xử lý:**
  - **Hàm nhận diện rìa vách núi (`isNearCliffEdge`):** Được triển khai đồng bộ ở [chunk-objects.ts](file:///e:/Pokemon/apps/web/src/maps/chunk-objects.ts) và [chunk.py](file:///e:/Pokemon/map_generator/chunk.py). Kiểm tra 8 ô lân cận: nếu là ô đồi mà có lân cận không phải đồi (mép, vách, góc lồi/lõm), hoặc nếu là ô cỏ mà có lân cận là đồi (sát chân vách), hàm trả về `true`.
  - **Berry Bushes:** Bổ sung vùng an toàn lân cận $3\times 4$ ô quanh bụi berry. Tuyệt đối không sinh trên núi và không sinh sát chân vách đá.
  - **Foliage / Plants:**
    - Ở đồng bằng cỏ: Bỏ qua nếu `isNearCliffEdge(gx, gy, seed)`.
    - Ở vùng núi: Chỉ sinh hoa núi cao đặc thù nếu ô đó là mặt phẳng cao nguyên tinh khiết `tileIdGrid[ly][lx] === TILE_IDS.cliff_pure && !isNearCliffEdge(...)`.
  - **Alpine Tall Grass (Cỏ cao trên vách):**
    - Sinh các cụm cỏ cao núi cao hoang dã trên bề mặt cao nguyên phẳng (`cliff_pure` và `!isNearCliffEdge`).
    - Giữ nguyên `tileIdGrid` là `cliff_pure` (để `ground-renderer` vẽ nền đá đầy đủ) và đưa vào mảng `chunk.tallGrass` để lớp hoạt ảnh cỏ đung đưa 32x32 hiển thị mượt mà trên nền núi đá.
- **Kiểm thử tự động:**
  - Cập nhật [tree-overlap.test.ts](file:///e:/Pokemon/apps/web/test/tree-overlap.test.ts) kiểm tra tính bất biến:
    - 0% hoa/cỏ mọc trên rìa/mép vách núi.
    - 0% berry bush mọc trên vách hoặc sát mép vách.
    - Cỏ cao trên vách sinh thành công (`totalCliffTallGrass > 0`) và 100% nằm trong lòng cao nguyên phẳng an toàn.
  - Kết quả: **15/15 Frontend Vitest tests PASS 100%**, **7/7 Python tests PASS 100%**, **CI build hoàn hảo**.

### 0.2. Triệt Tiêu Hoàn Toàn Lỗi Cỏ Cao, Hoa / Thực Vật và Bụi Berry Mọc Chồng Chéo (Flora, Tall Grass & Berry Exclusion):

- **Phân tích nguyên nhân cốt lõi:**
  - Trước đây, ba hệ thống sinh thực vật chạy độc lập và không truyền dữ liệu kiểm tra chéo:
    1. `generateChunkFoliage` chạy trước, sinh hoa dại và mầm cỏ lên `terrainGrid === TERRAIN.GRASS`.
    2. `generateChunkTallGrass` chạy sau, chọn cụm bán kính và gán `tileIdGrid[ly][lx] = TILE_IDS.tall_grass` mà không kiểm tra xem ô đó đã có hoa/mầm cỏ hay chưa $\rightarrow$ hoa bị vẽ đè chìm bên trong dải cỏ cao.
    3. `generateChunkBerryBushes` chạy thứ 3, chỉ kiểm tra `terrainGrid === TERRAIN.GRASS` mà không nhận `tileIdGrid` hay danh sách `plants` $\rightarrow$ bụi berry ($32\times 64\text{px}$) có thể mọc đè trúng ô cỏ cao hoặc đè trúng bông hoa đã sinh trước đó.
- **Giải pháp xử lý dứt điểm (Kiến trúc phân tầng loại trừ lẫn nhau - Strict Mutual Exclusion):**
  - **Tái cấu trúc luồng sinh trong [WorldChunk](file:///e:/Pokemon/apps/web/src/maps/chunk.ts):**
    1. _Bước 1 (Terrain):_ Sinh lưới địa hình cơ bản.
    2. _Bước 2 (Trees):_ Sinh cây lớn và đăng ký collider thân cây.
    3. _Bước 3 (Tall Grass):_ Sinh các bãi cỏ cao hoang dã trên cỏ mở, ghi nhận vào `tileIdGrid = TILE_IDS.tall_grass`.
    4. _Bước 4 (Berry Bushes):_ [generateChunkBerryBushes](file:///e:/Pokemon/apps/web/src/maps/chunk-objects.ts) nhận `tileIdGrid`, bắt buộc cả ô gốc $(bLX, bLY)$ lẫn ô ngọn $(bLX, bLY - 1)$ **không được trùng ô cỏ cao**. Khoảng cách an toàn giữa 2 bụi berry tăng lên tối thiểu $48\text{px} \times 64\text{px}$.
    5. _Bước 5 (Foliage / Plants):_ [generateChunkFoliage](file:///e:/Pokemon/apps/web/src/maps/chunk-objects.ts) nhận `tileIdGrid` và `berryBushes`, bắt buộc **không sinh hoa/mầm cỏ trên ô cỏ cao** (`tileIdGrid !== tall_grass`) và **không sinh trên ô bị bụi berry chiếm dụng** (cả ô gốc và ngọn cây berry). Đảm bảo mỗi ô chỉ có tối đa 1 thực vật (`alreadyHasPlant`).
  - **Đồng bộ phía Python:** Cập nhật [map_generator/chunk.py](file:///e:/Pokemon/map_generator/chunk.py) kiểm tra chéo loại trừ 100% giữa `plants`, `berry_bushes` và `tall_grass`.
- **Kiểm thử tự động:**
  - Bổ sung 3 unit tests mới trong [tree-overlap.test.ts](file:///e:/Pokemon/apps/web/test/tree-overlap.test.ts) kiểm tra trên hàng loạt seed (101, 777, 12345, 99999):
    1. Không bao giờ có bụi berry nào đè lên cỏ cao hay hoa/mầm cỏ.
    2. Không bao giờ có hoa hay mầm cỏ nào mọc trong ô cỏ cao.
    3. Tất cả các cây hoa/mầm cỏ trong một chunk có tọa độ ô duy nhất, không trùng lặp.
  - Kết quả: **15/15 Frontend Vitest tests PASS 100%**, **7/7 Python tests PASS 100%**, **CI build hoàn hảo**.

### 0. Đánh giá Kiến trúc & Khắc phục Lỗi Kỹ thuật Cấp bách (Hotfixes 5, 6, 7, 8, 10):

- **Phản hồi đánh giá kiến trúc:** Đã xác nhận toàn bộ 10 vấn đề nghiêm trọng do người dùng chỉ ra (Logic lặp giữa Python/JS, God file `map_viewer.html`, thiếu Monorepo/TypeScript/Backend, Asset base64 cồng kềnh, v.v.).
- **Đã sửa dứt điểm ngay lập tức 5 lỗi kỹ thuật trong mã nguồn:**
  1. _Sửa Bug 7 (Animation Pikachu & Né 180°):_ Khởi tạo `fromGX: 0, fromGY: -1` và gán đầy đủ `pika.fromGX = pika.gx`, `pika.fromGY = pika.gy` khi bắt đầu di chuyển, khắc phục triệt để điều kiện né sai hướng.
  2. _Sửa Bug 6 (Tốc độ phụ thuộc FPS):_ Chuẩn hóa `dtScale` theo mốc 60 FPS ($16.67\text{ms}$), áp dụng vào bước đi của Red, Pikachu và AI Pokémon hoang dã. Di chuyển mượt mà và đồng tốc trên mọi tần số quét (60Hz, 120Hz, 144Hz).
  3. _Sửa Bug 5 (World Generation Deterministic):_ Thay thế toàn bộ `Math.random()` trong việc sinh Pokémon và khởi tạo chunk bằng `seededHash`. Cùng một Seed luôn tạo ra thế giới và Pokémon hoàn toàn đồng nhất 100%.
  4. _Sửa Bug 8 (Tràn RAM / Chunk Cache Unbounded):_ Bổ sung cơ chế **LRU Cache Eviction** cho cả `ChunkManager` (JavaScript) và `MapManager` (Python), tự động dọn dẹp các chunk ngoài bán kính tầm nhìn khi vượt quá giới hạn (48-64 chunks).
  5. _Sửa Bug 10 (Hardcode đường dẫn):_ Thay thế toàn bộ `r"e:\Pokemon"` trong `map_generator/tiles.py` và `map_generator/generator.py` bằng `Path(__file__).resolve().parent.parent`, giúp thư viện hoàn toàn portable.
- **Kiểm thử tự động:** 7/7 Python tests PASS, cú pháp JS hợp lệ 100%.

### Trạng thái hiện tại

1. **Nâng Cấp Quy Mô Lớn & Đa Dạng Hình Dạng Khối Núi (Hill & Cliff):**
   - **Kích thước mở rộng vượt bậc:** Bề rộng dãy núi Tây tăng từ 10-14 ô lên **20 đến 28 ô** (trải dài từ $gx = -36$ đến $gx \approx -8$), tạo cảm giác đại cao nguyên hùng vĩ.
   - **4 Biến thể hình dáng Núi phía Tây (chu kỳ 32 ô Y):**
     1. _Stepped Triple Plateau:_ Khối núi giật 3 cấp bậc thang vươn dần về hướng Đông (rộng 20 $\rightarrow$ 25 $\rightarrow$ 28 ô).
     2. _Deep Canyon Alcove:_ Thung lũng hẻm núi chữ U hõm sâu 8 ô, bao bọc bởi 3 bề vách đá dựng đứng, Red có thể đi sâu vào lòng thung lũng.
     3. _Twin Promontories:_ Hai mũi mỏm núi nhô đôi vươn ra quốc lộ, ngăn cách bởi một thung lũng cỏ.
     4. _Continental Massif with Pass:_ Đại ngàn vách đá cao dài 24 ô kèm khe núi tự nhiên mở lối về viễn Tây.
   - **3 Biến thể Đồi phía Đông (chu kỳ 40 ô Y):**
     1. _Grand Stepped Mesa:_ Cao nguyên bàn cờ vát góc kích thước lớn (9×17 ô).
     2. _L-Shaped Ridge:_ Dải đồi cao uốn lượn hình chữ L dài 19 ô.
     3. _Twin Hills:_ Cặp đồi độc lập song sinh cách nhau bởi đồng cỏ phẳng.

2. **Cơ Chế "Random Ổn Định" Tuyệt Đối (Zero Clipping Artifacts):**
   - Thêm cơ chế kiểm tra khoảng trống an toàn (_Macro Clearance Check_):
     - `can_spawn_east_hill` / `canSpawnEastHill`: Quét toàn bộ phân đoạn chiều dọc; nếu bờ biển hay đường nhánh Đông-Tây lấn vào thì không spawn đồi, để lại đồng bằng cỏ ven biển thoáng đãng $\rightarrow$ **triệt tiêu hoàn toàn lỗi đồi bị xén thành mảnh vụn 1 ô**.
     - `get_west_max_x` / `getWestMaxX`: Tự động điều chỉnh độ vươn của mỏm núi theo độ uốn lượn của quốc lộ, luôn giữ hành lang đệm $\ge 3$ ô an toàn.
   - Chuẩn hóa hoàn hảo đối xứng hình học autotile 4 góc bo trong:
     - `!nw` $\rightarrow$ `cliff_in_bl` (411 - đá góc trên-trái)
     - `!ne` $\rightarrow$ `cliff_in_br` (412 - đá góc trên-phải)
     - `!sw` $\rightarrow$ `cliff_in_tr` (410 - đá góc dưới-trái)
     - `!se` $\rightarrow$ `cliff_in_tl` (409 - đá góc dưới-phải)

3. **Kiểm thử tự động:**
   - **7/7 unit tests Passed 100% OK** (`Ran 7 tests in 7.336s - OK`).
   - Cú pháp JavaScript của [map_viewer.html](file:///e:/Pokemon/map_viewer.html) và [tiles_data.js](file:///e:/Pokemon/tiles_data.js) kiểm tra qua Node.js: `Syntax OK`.
   - Live HTTP server đang chạy phục vụ tại `http://localhost:8000/map_viewer.html`.

4. **Định hình Cấu trúc Mục tiêu Monorepo (`pokemon-game/`):**
   - Đã ghi nhớ và đồng bộ toàn bộ sơ đồ kiến trúc thư mục Monorepo vào [03-repository-structure.md](file:///e:/Pokemon/docs/plans/03-repository-structure.md) và [02-architecture.md](file:///e:/Pokemon/docs/plans/02-architecture.md).
   - Tạm thời lưu giữ trong tài liệu kế hoạch thiết kế, chưa xáo trộn mã nguồn hiện tại. Sẵn sàng scaffold khi bạn yêu cầu.

5. **Tối Giản Giao Diện & Khóa Cố Định Camera 1.0x:**
   - **Dọn sạch thanh điều khiển cồng kềnh:** Đã xóa bỏ toàn bộ `<header>` 56px và thanh `<aside class="sidebar">` 320px tối đen chiếm diện tích.
   - **Toàn màn hình (Full-viewport):** Canvas bản đồ game mở rộng trọn vẹn `100vw × 100vh`.
   - **Bảng Overlay Kiểm thử Trong Suốt:** Tích hợp toàn bộ công cụ kiểm thử cốt lõi (Seed, Biome, Tùy chọn Layer, Tọa độ Red, Inspector trỏ chuột, Nút Tải lại / Đặt lại vị trí) vào duy nhất **1 bảng Overlay bán trong suốt** (Glassmorphism 72%, bo góc 16px) nổi ở góc trái trên, có nút `[✕ / ⚙️]` để thu gọn thành nút tròn nhỏ bất kỳ lúc nào.
   - **Cố định Camera 1.0x:** Đã khóa cứng camera ở tỷ lệ `1.0x`, cấm hoàn toàn hành vi cuộn chuột thu phóng của người chơi, giữ chuẩn xác tỷ lệ pixel Pokémon.

6. **Sửa Triệt Để Lệch Hitbox & Lỗi Di Chuyển Mép Núi/Đồi:**
   - **Nguyên nhân cốt lõi:** Do logic trước đó tính toán tọa độ vẽ Y của nhân vật Red và Pikachu là `gy * 32 - 16` (thay vì `gy * 32 - 32`), dẫn đến sprite và hộp hitbox `[player.x + 22, player.y + 48]` bị tụt xuống dưới đúng 16px (nằm trọn trong ô $gy + 1$ thay vì ô $gy$ của nhân vật).
     - _Hệ quả 1 (Dưới vách đồi):_ Khi Red đứng ở ô cỏ sát chân đồi, hitbox bị vẽ tụt xuống ô bên dưới, tạo cảm giác "bị đẩy lùi ra xa tận 1 ô cỏ trống".
     - _Hệ quả 2 (Mép trên đỉnh đồi):_ Khi Red ở ô cỏ phía trên vách đồi, hitbox lại bị vẽ lọt xuống ô vách đá bên dưới, khiến người chơi nhìn thấy Red như đang đứng trên mép vách đá và vẫn đi lên trên được.
   - **Khắc phục toàn diện:**
     - Chuẩn hóa tọa độ Y: `player.y = player.gy * TILE_SIZE - 32`, `pika.y = pika.gy * TILE_SIZE - 32`.
     - Hitbox `[16..30]` luôn nằm chính xác 100% bên trong ô $gy$, áp sát chân Red.
     - Cập nhật đồng bộ camera target (`player.y + 48`), bóng đổ (`player.y + 58`), Y-sorting (`player.y + 60`) và module renderer phía Python (`MapRenderer`).

7. **Tích Hợp Thực Vật & Hoa Dại Hoạt Ảnh Đung Đưa (Animated Foliage):**
   - **Tài nguyên ảnh (5 dải sprite 160×32 px, 5 frame 32×32 mỗi loại):**
     1. `flower_red`: Bụi hoa đỏ trắng rực rỡ.
     2. `flower_blue`: Bụi hoa xanh ngọc bích.
     3. `flower_purple`: Bụi hoa tím hồng phong lữ.
     4. `flower_white`: Bụi hoa cúc trắng nhụy vàng.
     5. `plant_sprout`: Bụi mầm cỏ xanh đung đưa qua lại.
   - **Cơ chế hoạt ảnh độc lập từng bông ("animation của từng bông"):**
     - Mỗi bụi cây/bông hoa được gán pha gió riêng (`phase = seededHash(gx, gy, 888) * 5`).
     - Tốc độ đung đưa nhịp nhàng ~180ms/khung hình, tạo nên từng làn sóng gió tự nhiên lăn tăn trên đồng cỏ.
   - **Sinh thái & Phân bố thực vật:**
     - Tự động mọc theo cụm (cluster noise) trên nền đồng cỏ (`TERRAIN.GRASS`), tránh đường mòn, cát biển, vách núi và gốc cây cối.
     - Nhân vật Red và Pikachu có thể bước đi xuyên qua hoa cỏ tự nhiên (walkable decorative foliage).
   - **Công cụ kiểm thử & Renderer:**
     - Đã thêm tùy chọn `🌸 Hoa & Cỏ hoa (Animated)` trong bảng Overlay trong suốt.
     - Con trỏ chuột Inspector hiển thị thêm chi tiết loại hoa/mầm cỏ đang trỏ vào.
     - Tích hợp asset vào `Graphics/Tilesets/Plant_Parts/`, đồng bộ Base64 vào `tiles_data.js` và cập nhật `MapRenderer` phía Python.

8. **Tối Ưu Triệt Để Độ Trễ Di Chuyển (Lag Elimination) & Phân Bố Thực Vật Đều Đặn (Sub-Quadrant Scatter):**
   - **Triệt tiêu lag giật khi di chuyển (>99.9% tối ưu vòng lặp):**
     - Bổ sung ranh giới thoát nhanh O(1) cho `is_hill_tile` / `isHillTile`: nếu $gx$ nằm ngoài khoảng $[-36..-8]$ và $[8..16]$ (thung lũng cỏ và quốc lộ), hàm thoát ngay lập tức, triệt tiêu 25 vòng lặp `isNearRoadOrSand` cho 90% số tile trên bản đồ.
     - Thêm bảng nhớ đệm `hillTileCache`, `eastHillCache`, `westMaxXCache` cho kết quả tính toán địa hình.
     - Khắc phục `chunkManager.update`: chỉ tạo mới mảng `activeChunks` khi người chơi thực sự bước sang chunk khác, loại bỏ cấp phát rác ở 60 FPS.
     - Tối ưu `canMoveToTile`: chỉ kiểm tra collider của chunk đích (và chunk liền kề nếu sát biên) thay vì duyệt toàn bộ 25 chunk.
     - Caching tham chiếu DOM và giãn tần suất cập nhật HUD (mỗi 6 frame) tránh layout thrashing.
     - Thời gian chạy unit tests Python giảm từ 7.3s xuống **2.3s**.
   - **Thuật toán rải hoa đều đặn 4 góc phần tư (Sub-Quadrant Scatter):**
     - Chia chunk 16×16 thành 4 góc phần tư 8×8 ô độc lập.
     - Mỗi góc sinh 1 cây hoa chính (85% cơ hội) và 1 cây hoa phụ (45% cơ hội, cách xa tối thiểu 3 ô).
     - Không còn tình trạng 45% chunk trống trơn hay hoa tụm 1 chỗ; mỗi chunk có 3 - 6 bông hoa phân tán hài hòa, tự nhiên khắp 4 góc.

9. **Tích Hợp Hệ Thống Cây Berry Dại (Wild Berry Lifecycle & Real-Time Growth):**
   - **Tài nguyên hình ảnh (Graphics/Tilesets/Bery):**
     - Mỗi loại cây Berry có kích thước 128×256 px gồm 4 giai đoạn sinh trưởng (hàng) × 4 khung hình đung đưa trong gió (cột).
     - Hỗ trợ 16 chủng loại Berry quen thuộc: Oran, Cheri, Chesto, Pecha, Rawst, Aspear, Leppa, Persim, Lum, Sitrus, Razz, Bluk, Nanab, Wepear, Pinap, Mago.
   - **Tỷ lệ sinh Berry hoang dã:**
     - Mỗi chunk sinh từ **1 đến 3 bụi Berry**:
       - 50% cơ hội: **1 cây Berry**
       - 40% cơ hội: **2 cây Berry**
       - 10% cơ hội: **3 cây Berry**
     - Các cây được phân bổ vào các góc phần tư khác nhau để không bao giờ bị đè lên nhau.
   - **Chu kỳ sinh trưởng thời gian thực (Growth Lifecycle):**
     - Giai đoạn 0: 🌱 **Mầm non (Sprout)** — Hạt mầm nhú khỏi nền đất.
     - Giai đoạn 1: 🌿 **Cây non (Growing)** — Cây lớn, tán lá xanh.
     - Giai đoạn 2: 🌸 **Ra hoa (Bloom)** — Hoa nở rực rỡ kết nụ.
     - Giai đoạn 3: 🫐 **Trái chín (Ripe)** — Quả mọng trĩu cành sẵn sàng thu hoạch.
     - Chu kỳ mặc định để test: **60 giây (1 phút)** (15 giây / giai đoạn), có thể chuyển sang 3 phút, 10 phút hoặc 30 phút chuẩn Pokémon qua dropdown.
     - Mỗi cây khi sinh ra có độ lệch tuổi tự nhiên (offset), tạo nên hệ sinh thái đa dạng (có cây đang mầm, có cây đã ra hoa hay trái chín).
   - **Tương tác thu hoạch (Harvesting Interaction):**
     - Người chơi bấm phím `Space`, `Enter`, `E` khi đứng trước cây hoặc click chuột trực tiếp vào cây Berry.
     - Khi trái chín (Giai đoạn 3): Người chơi thu hoạch được 2 - 4 quả kèm thông báo Toast nổi đẹp mắt, và cây tự động tái sinh về giai đoạn Mầm non để bắt đầu vòng đời mới.
     - Khi cây chưa chín: Hiển thị thông báo giai đoạn hiện tại và số giây còn lại cho đến khi lớn.
   - **Công cụ kiểm thử:**
     - Thêm các nút ép xem nhanh giai đoạn: `[🌱 Mầm] [🌿 Cây] [🌸 Hoa] [🫐 Quả] [🔄 Tự động]` trong bảng điều khiển trong suốt.
     - Inspector trỏ chuột hiển thị chi tiết tên loại Berry, biểu tượng giai đoạn và đồng hồ đếm thời gian chu kỳ.

### 11. Pokédex Screen — Gán Môi trường sống (Habitat Background & Base) theo Hệ:

    - **Tài nguyên ảnh (Graphics/Pokedex/backgound type/):**
      - `backgound type m/`: 19 phông nền môi trường (Forest, Mountain, Water, Underwater, Cave, CaveDark, Snow, Field, City, Gym1, Champion, IndoorB, ...).
      - `base backgound m/`: 34 bệ đứng địa hình tương ứng (ForestGrass, Mountain, Water, Underwater, Snow, Cave, CaveDark, FieldGrass, CityConcrete, ...).
    - **Cơ chế gán môi trường:**
      - Môi trường đặc thù: Pokémon biển sâu (Underwater), Pokémon hang động/dưới lòng đất (Cave), Pokémon hệ Ma (CaveDark), hệ Rồng (Champion), hệ Băng (Snow).
      - Môi trường theo hệ chính (Primary Type): Cỏ/Bọ $\rightarrow$ Rừng rậm (Forest/ForestGrass); Lửa/Đá/Bay $\rightarrow$ Núi đá (Mountain); Điện/Thường/Tiên $\rightarrow$ Đồng cỏ (Field/FieldGrass); Nước $\rightarrow$ Sông hồ biển (Water); Độc $\rightarrow$ Đầm lầy rừng (ForestMud); Siêu linh $\rightarrow$ Nhà kính (IndoorB); Giác đấu $\rightarrow$ Sàn đấu Gym (Gym1); Thép $\rightarrow$ Đô thị bê tông (CityConcrete).
    - **Khắc phục lỗi hiển thị & căn chỉnh Pixel-Perfect:**
      - *Sửa lỗi ảnh nền bị cắt hở:* Chuẩn hóa tọa độ hiển thị ô màn hình `top: 66px; left: 18px; width: 170px; height: 145px; border-radius: 0;` khớp chính xác từng pixel khung màn hình giữa 2 dải viền LED xanh cyan trên và dưới của `bg_info.png`, loại bỏ hoàn toàn viền bo góc thừa làm hở nền.
      - *Sửa lỗi sai lệch vị trí do kích thước sprite khác nhau (Bbox Content Scanner & Ground Anchor):* Quét tự động bounding box các pixel thực tế (loại bỏ vùng trong suốt thừa của từng khung hình gốc như Venusaur 10px đáy, Gyarados 16px, Pidgeotto 19px). Cố định tâm ngang tại $X = 85$ và neo điểm tiếp đất của chân Pokémon đồng nhất tại $Y = 128$ (nâng lên 10px theo yêu cầu người dùng) trên canvas cố định 170×145, đảm bảo tất cả 151 Pokémon đứng hoàn hảo 100% ngay tâm mặt bệ địa hình.

### 12. Định hướng Kiến trúc & Kế hoạch Tái cấu trúc Chuẩn hóa (Roadmap):

    - **Đánh giá tổng thể:** Monorepo, core game loop, map chunk và static catalog đạt yêu cầu tốt cho frontend prototype.
    - **3 Bước Tiền Đề Bắt Buộc trước khi triển khai Backend (`apps/server`):**
      1. **Bước 1 — Xây dựng `PokemonCatalog`:** Tạo service chuẩn (`getById`, `getBySpeciesKey`, `search`, `getAll`) làm nguồn dữ liệu duy nhất (Single Source of Truth) kết nối `pokemon-db.json` với Pokédex và `chunk-encounters.ts`.
      2. **Bước 2 — Chuẩn hóa Asset Resolution:** Đồng bộ toàn bộ đường dẫn `/Graphics/...` của Pokédex vào asset manifest / assetKey để đảm bảo tính độc lập và sẵn sàng cho môi trường production build.
      3. **Bước 3 — Tách module `pokedex-screen.ts` (~34 KB):** Phân rã God UI file thành thư mục `apps/web/src/ui/pokedex/` gồm:
         - `pokedex-controller.ts` (điều phối và xử lý sự kiện)
         - `pokedex-view.ts` (DOM, template, rendering HTML)
         - `pokedex-state.ts` (quản lý trạng thái, selection, mode)
         - `pokedex-filter.ts` (tìm kiếm, lọc theo tên/hệ/id)
         - `pokedex-sprite.ts` (hoạt ảnh sprite, content bbox scanner, ground anchor)
         - `pokedex-data.ts` (giao tiếp qua PokemonCatalog)
    - **Mục tiêu tiếp theo sau 3 bước trên:** Khởi tạo `apps/server` (Node.js/Fastify hoặc Express/WebSocket) quản lý Account, Player Save State, Inventory server-side và Authoritative Battle runtime.

### 13. Tiến độ Tái cấu trúc — Đã hoàn thành Bước 1 & Khởi tạo Tách Module Pokédex:

    - **Đã hoàn thành `PokemonCatalog` (`apps/web/src/data/pokemon-catalog.ts`):**
      - Cung cấp API chuẩn: `getAll()`, `getById()`, `getBySpeciesKey()`, `search()`, `getEncounterRoster()`.
      - Kết nối thành công `chunk-encounters.ts` để đọc tên và roster Pokémon hoang dã trực tiếp từ catalog, loại bỏ hardcode cũ.
    - **Đã khởi tạo thư mục phân rã `apps/web/src/ui/pokedex/`:**
      - `pokedex-data.ts`: Tầng truy xuất dữ liệu từ `pokemonCatalog` (`getPokedexEntries`, `getPokemonById`).
      - `pokedex-filter.ts`: Tách rời hàm `filterPokemon` theo tên, số hiệu và hệ.
      - `pokedex-state.ts`: Quản lý `PokedexState` (`isOpen`, `selectedIndex`, `scrollOffset`, `viewMode`, `query`).
      - Loại bỏ hoàn toàn `import pokemonDbRaw` trực tiếp trong `pokedex-screen.ts`.
    - **Kết quả kiểm thử toàn diện:**
      - `npm run ci`: Đạt 100% (Parity 6 terrains / 54 tiles, ESLint, Prettier, TypeScript typecheck, Vitest 11/11 tests, Vite production bundle).
      - Python unit tests: Đạt 7/7 tests (2.6s).

### 14. Tách Module BattleScreen theo MVC (DEV_GUARDRAILS §2.1 & §9):

    - **Vấn đề:** `battle-screen.ts` (784 dòng) là God File vừa render canvas, vừa xử lý input, vừa quản lý state, vừa tạo DOM.
    - **Giải pháp — Phân rã 4 module mới + 1 façade nhẹ:**
      - `battle-state.ts`: Pure state container (HP%, mode, typing, message queue). Không DOM, không canvas.
      - `battle-assets.ts`: Preload images, asset path constants. Single source of truth cho battle graphics paths.
      - `battle-renderer.ts`: Canvas drawing logic (databox, HP bar, sprites, bottom panel). Chỉ đọc state, không mutate.
      - `battle-controller.ts`: Input handling (click, mousemove), typing intervals, game actions (attack, throw ball, flee).
      - `battle-screen.ts`: Thin façade (~100 dòng) — chỉ tạo DOM, wire modules, chạy game loop, teardown.
    - **API giữ nguyên:** `BattleScreen` class và `BattleScreenResult` interface không đổi — `game-session.ts` import không cần sửa.
    - **Kết quả kiểm thử:**
      - TypeScript typecheck: PASS 100% (0 errors).
      - Vite production build: PASS 100%.

### Bước tiếp theo

- Tiếp tục hoàn thiện tách nốt `PokemonSpriteAnimator` sang `pokedex-sprite.ts` và DOM template sang `pokedex-view.ts` để thu gọn hoàn toàn `pokedex-screen.ts`.
- Chuẩn hóa Asset Resolution (Bước 2) trước khi tiến hành khởi tạo `apps/server`.

### 15. Desktop Preview bằng Tauri v2 — Đã hoàn thành bản Windows Preview

- Đã tích hợp Tauri v2 tại [apps/desktop/](../apps/desktop/) làm desktop shell độc lập cho `apps/web`.
- Người dùng không cần mở Chrome hoặc chạy trình duyệt riêng khi dùng bản installer.
- Chế độ phát triển hằng ngày:

  ```powershell
  npm run desktop:dev
  ```

  Lệnh này mở cửa sổ Tauri và dùng Vite hot reload; không cần đóng gói lại sau mỗi lần sửa code.

- Chế độ tạo bản độc lập:

  ```powershell
  npm run desktop:build
  ```

- Đã xác nhận build release binary và installer NSIS Windows thành công:
  `apps/desktop/src-tauri/target/release/bundle/nsis/PokeOverworld_0.1.0_x64-setup.exe`.
- Tauri bundle hiện giới hạn target Windows preview là `nsis`; MSI chưa bật vì WiX `light.exe` lỗi trên môi trường hiện tại.
- Fullscreen hỗ trợ nút UI, phím `F11` và thoát bằng `Esc`; test desktop shell đạt.
- Vite build đã emit các legacy Graphics cần thiết vào `dist/Graphics`, gồm Fonts, Icons, Pokedex, Battle và sprite Front/Back/Icon của 151 Pokémon.
- Đã thêm ignore cho `target/` và `src-tauri/gen/`, đồng thời ngăn ESLint quét artifact Rust sinh tự động.
- Kiểm thử sau tích hợp: schema validation đạt, CI đạt, web tests `67/67` đạt, production web build đạt.

### Quy ước dev sau khi có Desktop Preview

- Sửa code hằng ngày: dùng `npm run desktop:dev`.
- Chỉ chạy `npm run desktop:build` khi cần kiểm tra installer hoặc gửi bản preview cho người khác.
- Sau khi sửa asset/build pipeline, phải chạy lại `npm run ci` và `npm run desktop:build`.
- Không commit `apps/desktop/src-tauri/target/` hoặc các file sinh trong `apps/web/public/Graphics/`.

### 16. Hệ thống Chiêu thức (Moves Database & Battle Move Mechanics) — Đã hoàn thành bước logic

- **Database chiêu thức toàn diện ([packages/game-data/moves-db.json](file:///e:/Pokemon/packages/game-data/moves-db.json)):**
  - Trích xuất và xây dựng cơ sở dữ liệu với hơn 950 chiêu thức Pokémon chuẩn quốc tế từ pokemondb.net.
  - Toàn bộ mô tả chiêu thức đã được biên dịch sang **tiếng Việt chuẩn thuật ngữ Pokémon** (Tấn công, Phòng thủ, Chí mạng, Tê liệt, Bỏng, Nhiễm độc, Ru ngủ, v.v.).
  - Cung cấp đầy đủ thông số: ID, Tên, Hệ (18 Types), Phân loại (Physical / Special / Status), Sát thương (Power), Độ chính xác (Accuracy), Điểm năng lượng (PP / Max PP).
  - Tích hợp hiệu ứng chuyên sâu: Thay đổi chỉ số (Stat stages -6 đến +6), Hiệu ứng trạng thái bất lợi (Paralysis, Burn, Poison, Sleep, Freeze), Hồi phục HP (Recover, Roost, Soft-Boiled), Tỉ lệ đòn chí mạng cao (High crit) và Độ ưu tiên lượt đánh (Priority như Quick Attack).
- **Nâng cấp Battle Engine ([apps/web/src/battle/battle-engine.ts](file:///e:/Pokemon/apps/web/src/battle/battle-engine.ts)):**
  - Kiểm tra độ chính xác (Accuracy check) và né đòn (Evasion stages) — các chiêu thức có thể trượt mục tiêu nếu roll ngẫu nhiên không đạt.
  - Áp dụng thay đổi bậc chỉ số theo công thức chuẩn Gen 3-9: nhân hệ số từ 0.25x (-6) đến 4.0x (+6).
  - Trạng thái bất lợi: Bỏng giảm 50% Tấn công vật lý, Tê liệt giảm 50% Tốc độ và 25% cơ hội mất lượt, Đóng băng và Ngủ vô hiệu hóa đòn đánh cho đến khi tỉnh/rã băng.
  - Cơ chế thứ tự tấn công (`getFirstAttacker`): So sánh theo Độ ưu tiên chiêu thức (Priority) trước, sau đó so sánh Tốc độ thực tế sau khi tính bậc chỉ số và trạng thái tê liệt.
- **Kiểm thử:** Đã bổ sung bộ test chuyên sâu cho chiêu thức và logic chiến đấu tại [apps/web/test/battle.test.ts](file:///e:/Pokemon/apps/web/test/battle.test.ts), 69/69 tests đạt 100%, CI pass.

  5. **Hiệu Ứng Slide-in Mượt Mà Cho 2 Thanh Databox (Thay Vì Ẩn/Hiện Đột Ngột):**
     - Thêm tiến trình enemyDataboxProgress và playerDataboxProgress (0..1) vào [battle-state.ts](file:///e:/Pokemon/apps/web/src/battle/battle-state.ts).
     - **Enemy Databox (Đối thủ):** Tự động trượt từ lề trái vào vị trí chuẩn (offset -260px -> 0px) ngay khi màn đen tách xong và dòng thoại wild Pokémon xuất hiện.
     - **Player Databox (Người chơi):** Tự động trượt từ lề phải vào vị trí chuẩn (offset +260px -> 0px) ngay khi người chơi tung Pokémon ra sân (isPlayerPokemonSentOut = true).
     - Áp dụng hàm nội suy easeOutCubic ( - (1 - t)^3$) cho chuyển động lướt nhanh rồi giảm tốc êm ái (~20 frames = ~0.33s).
     - Đồng bộ hoàn hảo giữa Canvas 2D ([battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts)) và lớp HTML DOM Overlay ([battle-text-overlay.ts](file:///e:/Pokemon/apps/web/src/battle/battle-text-overlay.ts)) bằng CSS transform: translateX(...) và will-change: transform.

### 17. Cơ chế Trạng thái Bất lợi (Status Conditions) & Hiển thị Icon chuẩn Pixel 1:1

- **Cắt sprite sheet chuẩn xác ([battle-status-icons.ts](file:///e:/Pokemon/apps/web/src/battle/battle-status-icons.ts)):**
  - File `Graphics/Battle/icon_statuses.png` kích thước thật `44 x 96 px`, gồm 6 frame dọc với kích thước mỗi frame là `44 x 16 px`.
  - Khắc phục mapping toxic (trước đây trỏ nhầm row 1 thay vì row 5 `sy: 80`).
- **Hiển thị Icon chuẩn tỉ lệ gốc 1:1 (Không bị nén/bẹp ngang) ([battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts)):**
  - Trả icon về đúng tỉ lệ `scale = 1.0` (44x16 px nguyên bản) thay vì co lại `scale = 0.75` (làm mất chi tiết pixel và bị ép chiều ngang).
  - Canh chỉnh vị trí icon nằm gọn gàng ngay trước thanh HP:
    - Enemy databox: `x: 72, y: 35`, che phủ hoàn toàn nhãn "PS" cũ và khớp với đầu thanh HP.
    - Player databox: `dx + 90, dy + 35`, che phủ hoàn toàn nhãn "PS" cũ. Dời thông tin Tên/Level lên hàng `dy + 31` để phân tách rõ ràng với thanh HP và không bị đè chữ.
- **Hoàn thiện logic trạng thái trận đấu ([battle-engine.ts](file:///e:/Pokemon/apps/web/src/battle/battle-engine.ts), [battle-controller.ts](file:///e:/Pokemon/apps/web/src/battle/battle-controller.ts)):**
  - Miễn nhiễm hệ: Lửa kháng Bỏng, Điện kháng Tê liệt, Độc/Thép kháng Nhiễm độc thông thường lẫn Kịch độc (Toxic), Băng kháng Đóng băng.
  - Sát thương cuối lượt (End-of-turn): Burn/Poison mất 1/16 HP tối đa, Toxic mất tăng tiến `n/16` HP tối đa mỗi lượt.
  - Tỉnh dậy (Wake-up) & Rã băng (Thaw-out): Roll ngẫu nhiên với tỉ lệ và thông báo chính xác trong trận đấu.
- **Kiểm thử:** 89/89 tests đạt 100%, typecheck pass.

### 18. Hệ thống Quản lý Hoạt ảnh Chiêu thức (Move Animation Management System)

- **Hệ thống phân cấp hoạt ảnh ([move-animation-manager.ts](file:///e:/Pokemon/apps/web/src/battle/move-animation-manager.ts)):**
  - Xây dựng `MoveAnimationManager` tập trung điều phối hoạt ảnh theo phân loại chiêu thức (`physical`, `special`, `status`) và sẵn sàng mở rộng các chiêu đặc biệt trong tương lai.
  - **Vật lý (`physical`):** Pokémon thực hiện nhích/lướt về phía trước (`attackerLunges: true`), đối thủ rung lắc/chớp giật khi trúng đòn (`defenderTakesHit: true`).
  - **Đặc biệt (`special`):** Pokémon đứng yên tại chỗ để vận khí/bắn tia chiêu thức (`attackerLunges: false`), đối thủ vẫn rung lắc/chớp giật khi trúng đòn (`defenderTakesHit: true`).
  - **Trạng thái (`status`):** Pokémon đứng yên tại chỗ (`attackerLunges: false`), đối thủ không bị hiệu ứng dội lực sát thương (`defenderTakesHit: false`).
  - Hỗ trợ đăng ký override động (`registerOverride`) theo mã chiêu thức (ví dụ: các chiêu phức tạp sau này như Hyper Beam, Solar Beam, Fly, Dig...).
- **Cập nhật BattleState & BattleController:**
  - `startPlayerAttack` và `startEnemyAttack` hỗ trợ tham số `{ lunge: boolean, onHit?: () => void }`.
  - Giữ nguyên timing 60fps mượt mà cho cả đòn lao vào lẫn đòn thi triển tại chỗ.
- **Kiểm thử & CI:** Đã bổ sung bộ test chuyên sâu cho `MoveAnimationManager` và trạng thái `lunge`, đạt 92/92 tests passed 100%, CI pass hoàn toàn.

### 19. Hiển thị Chỉ số Tăng/Giảm (Stat Stage Badges) Dưới Thanh HP

- **Hệ thống nhãn chỉ số trực quan ([battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts)):**
  - Tự động hiển thị các huy hiệu trạng thái chỉ số khi Pokémon được cộng hoặc bị trừ bậc chỉ số (từ -6 đến +6) bao gồm: Tấn công (`ATK`), Phòng thủ (`DEF`), Công đặc biệt (`SPA`), Thủ đặc biệt (`SPD`), Tốc độ (`SPE`), Chính xác (`ACC`), Né tránh (`EVA`).
  - **Màu sắc phân biệt:**
    - Chỉ số được cộng (`stage > 0`): Nền xanh rêu viền ngọc lục bảo phát sáng `rgba(16, 75, 42, 0.92)` / `#34d399`, ký hiệu `+1 ATK`, `+2 SPE`...
    - Chỉ số bị trừ (`stage < 0`): Nền đỏ thẫm viền san hô `rgba(127, 29, 29, 0.92)` / `#f87171`, ký hiệu `-1 DEF`...
    - Tự động ẩn hoàn toàn khi chỉ số trở về bình thường (stage = 0) để giữ giao diện thanh thoát.
- **Bố trí chuẩn xác dưới thanh HP:**
  - **Enemy Databox:** Bố trí tại `x: 8..148, y: 56..70` (đẩy xuống +5px, nằm ngay dưới thanh HP và bên trái tab hệ Pokémon).
  - **Player Databox:** Bố trí tại `dx + 58..180, dy + 56..70` (đẩy xuống +5px, nằm ngay dưới thanh HP, trên thanh EXP và bên trái số HP `100/100`).
  - **Độ sắc nét & tương phản cao:** Tắt làm mờ Canvas 2D (`imageSmoothingEnabled = false`), sử dụng font đậm `bold 12px`, nền đặc (#14532d / #7f1d1d), viền sáng và đổ bóng đen pixel 1px (`drop shadow`) giúp chữ hiển thị rõ nét, không bị mờ nhạt.
  - **Tự động co giãn (Auto-fit):** Hỗ trợ tính toán bề rộng huy hiệu từ 1 đến 7 chỉ số, đảm bảo không bao giờ bị tràn hay đè lên các thành phần khác.
- **Kiểm thử & CI:** Bộ test vitest đạt 93/93 tests passed 100%, TypeScript typecheck và build production đều đạt.

### 20. Đồng bộ Thời Gian Thực HP & Trạng Thái Trận Đấu với Đội Hình (Real-time Battle & Party Sync)

- **Khắc phục triệt để hiện tượng lệch HP ([battle-controller.ts](file:///e:/Pokemon/apps/web/src/battle/battle-controller.ts)):**
  - Trước đây, `partyService.syncBattleResult` chỉ được gọi vào cuối trận hoặc khi ngất xỉu, dẫn đến việc khi người chơi mở bảng Đội hình (PartyScreen) giữa trận hoặc dùng vật phẩm hồi máu thì số HP hiển thị ở hai nơi bị lệch nhau.
  - **Đồng bộ chiều đi (Battle -> Party):** Gọi `syncActiveBattlerToParty()` ngay lập tức sau mỗi lần HP của Pokémon người chơi biến động:
    - Khi nhận sát thương từ đối thủ hoặc dính sát thương phản đòn/hút máu.
    - Khi bị trừ máu cuối lượt từ các hiệu ứng Bỏng / Độc / Kịch độc.
    - Khi sử dụng dược phẩm hồi máu (Potion, Super Potion, Max Potion...).
    - Ngay trước khi mở màn hình Party (`handlePokemonCommand`, `handleForceSwitch`).
    - Trước khi kết thúc trận đấu (`endBattle`).
  - **Đồng bộ chiều về (Party -> Battle):** `BattleController` lắng nghe sự kiện đăng ký (`partyService.subscribe`):
    - Nếu người chơi thao tác sơ cứu/dùng Potion trên màn hình PartyScreen trong trận, lượng HP mới, Max HP và trạng thái bệnh tật được tự động phản chiếu ngược lại ngay lập tức vào `engine.playerPokemon` và thanh máu trên Canvas/DOM overlay.
- **Kiểm thử & CI:** Bổ sung unit test hai chiều (`synchronizes battler HP and status in real-time with partyService`), đạt 94/94 tests passed 100%, CI pass toàn diện.

### 21. Tích hợp Hệ thống Âm thanh Hiệu ứng (Sound Effects - SE) Ném & Thu phục Pokéball

- **Sao chép và đóng gói tài nguyên âm thanh chuẩn Essentials ([vite.config.ts](file:///e:/Pokemon/apps/web/vite.config.ts)):**
  - Trích xuất và sao chép 10 tệp âm thanh hiệu ứng nguyên bản từ Pokémon Essentials vào dự án tại thư mục `Audio/SE/`:
    - `Battle throw.ogg`: Tiếng huấn luyện viên vung tay ném bóng.
    - `Battle ball hit.ogg`: Tiếng bóng va chạm trúng Pokémon hoang dã.
    - `Battle jump to ball.ogg`: Tiếng luồng năng lượng hút Pokémon vào trong bóng.
    - `Battle ball drop.ogg`: Tiếng bóng rơi tiếp đất và nảy tưng trên mặt đất.
    - `Battle ball shake.ogg`: Tiếng bóng lắc lư qua lại khi kiểm tra tỉ lệ bắt.
    - `Battle catch click.ogg`: Tiếng cạch cơ học khi chốt khóa bóng bắt thành công.
    - `Battle recall.ogg`: Tiếng bóng bung nắp khi Pokémon phá bóng thoát ra ngoài.
    - `Battle critical catch throw.ogg`: Âm thanh ném bóng khi kích hoạt Critical Catch.
    - `Battle capture success.ogg`: Khúc nhạc khải hoàn thu phục thành công (Victory ME).
    - `Shiny sparkle.ogg`: Tiếng hạt ánh sáng lấp lánh (Sparkle) khi bắt thành công.
  - Cập nhật plugin Vite `emitLegacyGraphicsPlugin` đưa `Audio/SE` vào danh mục bundle tự động sang `dist/`.
- **Trình phát âm thanh chuyên dụng BattleSePlayer ([battle-se.ts](file:///e:/Pokemon/apps/web/src/audio/battle-se.ts)):**
  - Thiết kế Singleton `battleSePlayer` an toàn, xử lý mã hóa URL ký tự đặc biệt/khoảng trắng, điều tiết âm lượng độc lập và bắt lỗi Autoplay policy của trình duyệt một cách mượt mà.
  - Tự động hạ âm lượng/dừng nhạc nền BGM (`battleBgmPlayer.stopBgm(300)`) khi bắt trúng để nhường không gian cho âm thanh click khóa bóng và nhạc hiệu chiến thắng `Battle capture success.ogg`.
- **Đồng bộ thời gian thực với cỗ máy trạng thái bắt bóng ([battle-state.ts](file:///e:/Pokemon/apps/web/src/battle/battle-state.ts) & [battle-controller.ts](file:///e:/Pokemon/apps/web/src/battle/battle-controller.ts)):**
  - Kết nối callbacks `onBallHit`, `onBallCapture`, `onBallDrop` tương ứng vào các bước chuyển frame:
    - Khi bóng bay hết quỹ đạo parabol (frame 26) chạm mục tiêu -> kích hoạt `playBallHit()`.
    - Khi bóng bung nắp và phát sáng hút Pokémon (frame 8) -> kích hoạt `playJumpToBall()`.
    - Khi Pokémon thu nhỏ biến mất và bóng rơi xuống đất (frame 30) -> kích hoạt `playBallDrop()`.
    - Khi bóng lắc lư trên mặt đất -> kích hoạt `playBallShake()`.
    - Khi bắt thành công -> gọi `playCatchSuccess()` (phát tiếng click, sau 250ms phát sparkle & fanfare).
    - Khi bắt hụt -> gọi `playBallBreak()`.
- **Tối ưu hóa kích thước bóng ném & Giữ nguyên chất lượng ảnh ([battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts)):**
  - Điều chỉnh tỉ lệ bóng ném về mức 75% (`ballScale = 0.75`, kích thước chuẩn 24x48px thay vì 32x64px), cân đối hoàn hảo với kích thước Pokémon hoang dã, đặc biệt khi camera kích hoạt zoom cận cảnh 1.4x.
  - Bật bộ lọc làm mịn chất lượng cao cục bộ (`ctx.imageSmoothingEnabled = true`, `ctx.imageSmoothingQuality = 'high'`) dành riêng cho Pokéball, ngăn chặn triệt để hiện tượng răng cưa méo pixel khi co nhỏ, giữ trọn vẹn đường cong tròn trịa và hiệu ứng bóng đổ sắc nét.
  - Tự động hoàn trả `imageSmoothingEnabled = false` cho toàn bộ sàn đấu sau khi vẽ bóng để đảm bảo các sprite Pixel Art khác không bị mờ.
- **Kiểm thử & CI:** Bổ sung test kiểm thử callback và headless audio player an toàn, đạt 104/104 tests pass 100%, typecheck và build dist hoàn toàn trơn tru.

### 22. Xây dựng Hệ thống Máy tính Lưu trữ Pokémon (PC Storage System) & Tự động Gửi khi Đội hình Đầy

- **Tự động chuyển Pokémon vào PC khi Đội hình đầy ([game-session.ts](file:///e:/Pokemon/apps/web/src/game/game-session.ts)):**
  - Khi bắt thành công Pokémon hoang dã, kiểm tra trạng thái đội hình:
    - Nếu đội hình còn chỗ (`< 6`): Thêm trực tiếp vào đội hình như trước.
    - Nếu đội hình đã đầy đủ 6 thành viên (`6/6`): Tự động chuyển Pokémon vừa bắt vào Hộp lưu trữ PC còn chỗ đầu tiên thông qua `pcStorageService.depositPokemon()`.
    - Thông báo Toast hiển thị tên Hộp cụ thể: `🎉 Đã thu phục thành công [Tên]! Đội hình đã đầy (6/6), đã chuyển vào PC ([Tên Hộp])!`.
- **Dịch vụ Quản lý Kho lưu trữ PC ([pc-storage-service.ts](file:///e:/Pokemon/apps/web/src/domain/pc/pc-storage-service.ts)):**
  - Cấu hình chuẩn 24 Hộp lưu trữ (`TOTAL_BOXES = 24`), mỗi hộp 30 ô (`BOX_CAPACITY = 30`, 6 cột $\times$ 5 hàng), tổng sức chứa lên tới 720 Pokémon.
  - Hỗ trợ đầy đủ các thao tác:
    - `depositPokemon`: Tự động tìm ô trống đầu tiên trong hộp ưu tiên hoặc quét toàn bộ các hộp.
    - `withdrawPokemon`: Rút Pokémon từ hộp về đội hình (kiểm tra giới hạn 6 thành viên).
    - `depositFromParty`: Gửi Pokémon từ đội hình vào hộp (có cơ chế an toàn: cấm gửi Pokémon khỏe mạnh duy nhất còn lại).
    - `swapPartyAndBox` / `moveOrSwap`: Đổi chỗ linh hoạt giữa Đội hình $\leftrightarrow$ Hộp, hoặc giữa Hộp $\leftrightarrow$ Hộp.
    - `releasePokemon`: Thả Pokémon tự do có hộp thoại xác nhận.
    - Tùy chỉnh đổi tên hộp và thay đổi hình nền (hỗ trợ 39 mẫu wallpaper `box_1.png` đến `box_39.png`).
    - Lưu trữ bền vững tự động vào `localStorage` (`pokemon_pc_storage_v1`).
- **Giao diện Người dùng StorageScreen ([storage-screen.ts](file:///e:/Pokemon/apps/web/src/ui/storage-screen.ts) & [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
  - Khớp 100% tài nguyên và bố cục từ [Graphics/Storage](file:///e:/Pokemon/Graphics/Storage):
    - Khung màn hình chuẩn 512x384 trên nền `bg.png`.
    - Cột trái: 6 thanh đội hình Pokémon hiển thị chi tiết icon, cấp độ, thanh máu động và huy hiệu trạng thái (FNT, BRN...).
    - Cửa sổ hộp bên phải: Kích thước 324x302 hiển thị wallpaper `box_X.png`, hai nút điều hướng `<<` và `>>` chuyển hộp mượt mà.
    - Lưới 6x5 (30 ô): Hiển thị icon động của Pokémon, hiệu ứng viền phát sáng khi rê chuột và hiệu ứng nhấp nháy màu vàng khi đang cầm/di chuyển Pokémon.
    - Menu ngữ cảnh tiện lợi (Gửi vào PC / Rút về / Di chuyển / Xem chi tiết / Thả tự do).
    - Tích hợp âm thanh SE chuẩn Essentials: `PC open.ogg`, `PC access.ogg`, `PC close.ogg`.
- **Phím tắt & Menu:**
  - Thêm biểu tượng `menuPC.png` vào thanh menu góc trên bên phải màn hình.
  - Hỗ trợ phím tắt `C` (hoặc phím `Esc`) để mở/đóng kho lưu trữ PC tức thì.
- **Kiểm thử & CI:** Bổ sung 5 bộ unit test cho `PcStorageService`, toàn bộ 109/109 tests passed 100%, typecheck và build production bundle pass.

### 23. Chuẩn hóa Hệ thống Chỉ số Core, IV/EV, 25 Tính Cách (Natures) & Cân Bằng Vật Phẩm Chuẩn Gen 7

- **25 Tính cách Pokémon chuẩn quốc tế ([pokemon-stats.ts](file:///e:/Pokemon/apps/web/src/domain/party/pokemon-stats.ts)):**
  - Tích hợp đầy đủ bảng 25 Natures theo quy chuẩn Pokémon (Hardy, Lonely, Brave, Adamant, Naughty, Bold, Docile, Relaxed, Impish, Lax, Timid, Hasty, Serious, Jolly, Naive, Modest, Mild, Quiet, Bashful, Rash, Calm, Gentle, Sassy, Careful, Quirky).
  - Nhân đúng hệ số: +10% (1.1x) cho chỉ số có lợi, -10% (0.9x) cho chỉ số bất lợi, HP không chịu ảnh hưởng của tính cách.
  - Bổ sung tên tiếng Việt và mô tả ngắn gọn cho toàn bộ 25 tính cách phục vụ hiển thị UI.
- **Hàm tính chỉ số cốt lõi thống nhất (`calculatePokemonStats`):**
  - Công thức chuẩn Gen 3–7:
    - HP = $\lfloor \frac{(2 \times \text{Base} + \text{IV} + \lfloor \text{EV}/4 \rfloor) \times \text{Level}}{100} \rfloor + \text{Level} + 10$ (Shedinja cố định 1 HP).
    - Các chỉ số khác = $\lfloor (\lfloor \frac{(2 \times \text{Base} + \text{IV} + \lfloor \text{EV}/4 \rfloor) \times \text{Level}}{100} \rfloor + 5) \times \text{NatureMultiplier} \rfloor$.
  - Thay thế toàn bộ công thức xấp xỉ cũ; dùng chung cho tạo Pokémon, lên cấp, Rare Candy, Vitamin và nạp bản lưu game.
- **Tích hợp IVs, EVs và Nature vào `PartyPokemon`:**
  - Bổ sung `ivs: PokemonStatValues` (0..31), `evs: PokemonStatValues` (0..252), `nature: NatureName`.
  - Tự động sinh ngẫu nhiên khi bắt Pokémon dã ngoại, hỗ trợ cấu hình tùy chỉnh khi tạo/test.
  - Hàm `recalculatePartyPokemonStats` tự động cập nhật lại toàn bộ chỉ số chính xác và bù trừ HP khi thăng cấp hoặc nạp Vitamin.
  - **Save Migration:** Nâng `CURRENT_SAVE_VERSION = 2`. Tự động gán mặc định IV 31, EV 0, Hardy khi đọc bản lưu phiên bản 1.
- **Khắc phục triệt để các sai lệch trong Item Engine ([item-effects.ts](file:///e:/Pokemon/apps/web/src/domain/inventory/item-effects.ts)):**
  - **Vitamin (HP Up, Protein, Iron, Calcium, Zinc, Carbos):** Cộng +10 EV vào chỉ số tương ứng, có trần tối đa 252 EV/chỉ số và 510 EV tổng; chỉ số tăng vĩnh viễn và không bị xóa khi lên cấp.
  - **Rare Candy:** Gọi trực tiếp hàm tính chỉ số chuẩn, khớp 100% với lộ trình lên cấp tự nhiên.
  - **Dược phẩm chuẩn Gen 7:** Super Potion hồi 60 HP, Hyper Potion hồi 120 HP.
  - **Vật phẩm trong trận:**
    - Ice Heal & Aspear Berry chữa khỏi đóng băng (Freeze).
    - Dire Hit tăng tỉ lệ chí mạng trong trận (`critStage + 2`), kết nối trực tiếp với công thức chí mạng của BattleEngine.
    - X-Accuracy tăng +2 bậc chính xác.
    - Chặn sử dụng các vật phẩm tăng bậc (X-Attack, X-Defense...) khi chỉ số đã đạt trần +6 để tránh lãng phí vật phẩm.
  - **Sửa lỗi mất vật phẩm khi trao (`heldItem`):** Lưu chuẩn ID gốc (`rawId`) vào Pokémon thay vì tên hiển thị tiếng Việt, giải quyết lỗi biến mất vật phẩm khi trao đổi hoặc lấy lại.
  - **Hái Berry ngoài map ([berry-panel.ts](file:///e:/Pokemon/apps/web/src/ui/berry-panel.ts)):** Kết nối trực tiếp `inventoryService.addItem(bush.type, count)` khi hái cây chín.
### 24. Bóc tách Battle Engine thành Modular Rule Engines & State Reducer (Bước 3 Tái Cấu Trúc Trận Đấu)

- **Trạng thái:** Đã hoàn thành 100% tái cấu trúc module monolithic `battle-engine.ts` ($56.7\text{ KB}$, $1671$ dòng) thành hệ thống Rule Engine và State Reducer thuần túy ($25.2\text{ KB}$, giảm hơn $55\%$ kích thước), đáp ứng tiêu chuẩn sản phẩm chất lượng cao và bảo toàn 100% hành vi hiện tại.
- **Tiền đề đã xử lý triệt để:**
  1. **Triệt tiêu 4 Asset Build Warnings:** Khắc phục lỗi build-time của Vite đối với các asset giao diện CSS (`/Graphics/Storage/bg.png`, `boxgrab.PNG`, `boxfist.PNG`, `/Graphics/Pokemon/Icons type/types_ico.png`) thông qua plugin sao chép tài nguyên tĩnh.
  2. **Loại bỏ Circular Chunk Rollup:** Phân tách chunk `game-assets` riêng cho Asset Registry và đưa `data/pokemon-catalog` vào chunk `pokemon-data`, bẻ gãy hoàn toàn vòng phụ thuộc `pokedex <-> gameplay-ui`.
  3. **Đồng bộ Git Working Tree:** Commit toàn bộ asset mới và mã nguồn thay đổi vào lịch sử Git sạch sẽ.
- **Cấu trúc Kiến trúc Trận đấu Mới:**
  ```
  apps/web/src/battle/
  ├── rules/
  │   ├── damage-calculator.ts     # Công thức sát thương Gen 7, đòn thế biến thiên, cố định, OHKO & multi-hit
  │   ├── type-effectiveness.ts    # Tính toán hệ số khắc hệ, miễn nhiễm
  │   ├── status-engine.ts         # Miễn nhiễm trạng thái, cản trở trước lượt & sát thương cuối lượt (Burn/Poison/Toxic/Seed)
  │   ├── move-effect-engine.ts    # Chiêu 2-lượt (charge/semi-invulnerable), Protect/Detect, Status moves & độ chính xác
  │   └── turn-order.ts            # Thứ tự lượt đi theo độ ưu tiên chiêu, tốc độ thực tế (kèm tê liệt) & tie-break
  ├── state/
  │   ├── battle-state-reducer.ts  # Đảm bảo state battler, biến đổi HP, cập nhật/reset bậc chỉ số & trạng thái
  │   └── battle-event-factory.ts  # Nhà máy tạo Typed BattleEvent chuẩn mực
  ├── battle-engine.ts             # Facade / Coordinator thuần túy điều phối state, rule engines & events
  └── battle-controller.ts         # Điều phối luồng vòng lặp trận đấu người chơi & AI
  ```
- **Kiểm Thử & Đảm Bảo Tính Toàn Vẹn:**
  - Bổ sung suite kiểm thử độc lập [test/battle-rules.test.ts](file:///e:/Pokemon/apps/web/test/battle-rules.test.ts) xác nhận từng rule engine con chạy độc lập chính xác.
  - Toàn bộ pipeline `npm run ci`:
    - `validate:schemas`: PASS 100% (7/7 checks).
    - `eslint .`: 0 errors, 0 warnings.
    - `prettier --check`: 100% code style pass.
    - `typecheck:web`: 0 errors.
    - `test:web`: **25 suites, 192/192 tests PASS 100%**.
    - `build:web`: **PASS in 14.61s (0 asset warnings, 0 circular chunk warnings)**.

### 25. Cập nhật Asset Cỏ Tiền Cảnh Title Screen (06_grass_front4.png)

- **Trạng thái:** Đã hoàn thành 100% việc thay thế asset 2 lớp cỏ gần camera trên Title Screen bằng `Graphics/Intro/06_grass_front4.png` ($512 \times 300\text{ px}$) sắc nét pixel-art với hoa đỏ li ti, xóa bỏ asset di sản cũ `06_grass_front.png` ($611\text{ KB}$).
- Cập nhật logic vẽ tự động scale theo kích thước tự nhiên (`naturalWidth`, `naturalHeight`), đảm bảo cuộn vô tận từ trái qua phải mượt mà trên canvas $1920 \times 1200$.
- Đã đăng ký thư mục `Intro` vào danh sách copy asset trong [vite.config.ts](file:///e:/Pokemon/apps/web/vite.config.ts), pipeline build PASS 100%.
- Đẩy lớp cỏ gần camera nhất (Layer 7b) hạ thấp thêm 70px ($Y = 160 \rightarrow 230$), mở rộng tầm nhìn trung cảnh và tạo bố cục chiều sâu hài hòa.

