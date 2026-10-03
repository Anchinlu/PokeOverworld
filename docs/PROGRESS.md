## Cập nhật lần cuối: 2026-10-03 (Triển Khai Desktop Preview Độc Lập bằng Tauri v2 & Tối Ưu Toàn Màn Hình)

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
  - *Định hướng kế tiếp:* Triển khai Asset Resolver chuẩn hóa các đường dẫn runtime này vào `public/assets` hoặc import tĩnh qua Vite trong phase hoàn thiện asset pipeline.
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
  1. *Làm chậm animation của nước:* Hoạt ảnh mặt nước lượn sóng trước đây chạy 150ms/frame hơi nhanh, cần làm chậm lại để mặt nước êm ả, thanh bình chuẩn phong cách overworld GBA.
  2. *Chấm dứt sự rập khuôn của cỏ cao:* Các mảng cỏ cao trước đây có hình dạng tròn giống nhau ở mọi chunk. Cần ngẫu nhiên hóa kích thước, số lượng và hình dạng hữu cơ (organic) để tạo thế giới mở overworld tự nhiên, không rập khuôn khuôn mẫu.
- **Giải pháp xử lý:**
  - **Tốc độ sóng nước (Water Animation Timing):**
    - Điều chỉnh chu kỳ trong [ground-renderer.ts](file:///e:/Pokemon/apps/web/src/rendering/ground-renderer.ts) từ 150ms lên **280ms mỗi khung hình** (chu kỳ đầy đủ 8 frame kéo dài $\sim 2.24$ giây).
    - Hiệu ứng caustics phản chiếu êm dịu, thư thái, không gây chớp nháy mắt.
  - **Sinh cỏ cao ngẫu nhiên & phi khuôn mẫu ([chunk-objects.ts](file:///e:/Pokemon/apps/web/src/maps/chunk-objects.ts) & [chunk.py](file:///e:/Pokemon/map_generator/chunk.py)):**
    - *Số lượng vạt cỏ biến thiên (Patch Quantity):*
      - $20\%$ chunk: 0 vạt cỏ (đồng cỏ quang đãng, tầm nhìn mở).
      - $45\%$ chunk: 1 vạt cỏ tự nhiên quy mô vừa hoặc lớn.
      - $35\%$ chunk: 2 - 3 vạt cỏ nhỏ mọc rải rác bên đường mòn hoặc ven suối.
    - *Kích thước ngẫu nhiên (Patch Dimensions):*
      - Chiều rộng `pw` ngẫu nhiên từ $3$ đến $7$ ô, chiều cao `ph` ngẫu nhiên từ $2$ đến $5$ ô.
    - *4 Phong cách hình thái hữu cơ (Organic Shape Styles):*
      - *Style 0 (Organic Blob):* Vạt cỏ bầu dục với nhiễu viền biên độ cao, mép cỏ lồi lõm tự nhiên.
      - *Style 1 (Stepped Route Field):* Vạt cỏ chữ nhật bậc thang chuẩn phong cách Pokémon FireRed/Emerald với góc khuyết ngẫu nhiên.
      - *Style 2 (Elongated Strip):* Dải cỏ dài hẹp chạy men theo lối đi hoặc sườn đồi.
      - *Style 3 (L-Shaped Meadow):* Vạt cỏ góc lượn tự nhiên.
    - *Cỏ cao núi cao (Alpine Tall Grass):* Sinh $1 - 2$ cụm cỏ núi cao kích thước ngẫu nhiên tương thích mặt bằng cao nguyên đá, tuyệt đối không chạm mép rìa vách (`!isNearCliffEdge`).
    - *Toàn vẹn loại trừ va chạm:* Duy trì kiểm tra an toàn 100% với cây lớn, bụi berry, vách đá, sông ngòi và quốc lộ.
- **Kiểm thử tự động:**
  - `vitest`: **20/20 tests PASS 100%**.
  - Python tests: **7/7 tests PASS 100%**.
  - `npm run ci`: **PASS toàn bộ** (Schema validation, ESLint, Prettier, TypeScript, Vite build).

### 0.5. Tối Ưu Dòng Sông Lớn Pixel Art & Đa Dạng Hóa Kích Thước / Hình Dạng Hồ Nước:
- **Yêu cầu & Phản hồi từ người dùng:**
  1. *Dòng sông không uốn cong hình sin (Sinusoidal wavy curves):* Game theo phong cách Pixel Art GBA, sông không được uốn lượn chéo răng cưa mà phải đi thẳng hoặc quẹo cua vuông vức 90° / bậc thang pixel art đồng bộ với phong cách kẻ đường quốc lộ.
  2. *Quy mô sông lớn (Grand Pixel River):* Sông không được nhỏ 1-2 ô. Mở rộng bề rộng sông lên **5 ô (5 tiles wide)** để gia tăng diện tích mặt nước `water_pure`, giúp hiệu ứng hoạt ảnh sóng nước (caustics) hiển thị bao la, hùng vĩ.
  3. *Cầu gỗ lớn bắc ngang sông:* Cầu gỗ trên quốc lộ mở rộng kích thước lên $3 \text{ cột} \times 5 \text{ hàng}$ bao trọn toàn bộ bề rộng của dòng sông lớn.
  4. *Đa dạng kích thước & hình dạng hồ nước (Diverse Lakes):* Hồ không được đơn điệu 1 kích thước nhỏ. Triển khai 4 biến thể hồ với kích thước to nhỏ khác nhau:
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
  1. *Lưới autotile viền bờ cỏ 3x3 ($96\times 96\text{px}$):* 8 tile viền mép bờ (`water_tl`, `water_tr`, `water_bl`, `water_br`, `water_top`, `water_bot`, `water_left`, `water_right`) và 1 tile nước thuần (`water_pure`).
  2. *Lưới góc bo trong 2x2 ($64\times 64\text{px}$):* 4 tile góc lõm nước (`water_in_tl`, `water_in_tr`, `water_in_bl`, `water_in_br`).
  3. *Dải hoạt ảnh sóng nước ($256\times 32\text{px}$):* 8 frame sóng nước lượn caustics tuần hoàn sống động.
  4. *Cầu gỗ Pixel Art GBA ($32\times 32\text{px}$):* Thiết kế đồng bộ 2 loại cầu `bridge_wood_v` (cầu dọc bắc qua sông ngang) và `bridge_wood_h` (cầu ngang).
- **Kiến trúc địa hình & Autotile (Hệ 700 series):**
  - **Dòng sông uốn lượn (Meandering River):** Khởi nguồn từ vùng núi phía Tây, uốn lượn tự nhiên qua thung lũng cỏ, cắt ngang quốc lộ trung tâm và đổ ra biển Đông. Tại vị trí cắt ngang quốc lộ, tự động sinh cầu gỗ `bridge_wood_v` có tay vịn và cọc gỗ chắc chắn.
  - **Hồ nước tự nhiên (Scenic Ponds / Lakes):** Rải rác tại các khoảng trống đồng cỏ yên bình ($4\times 5$ ô oval bo góc mềm mại), cách ly tối thiểu 2 ô với đường xá, vách núi và bờ biển.
  - **Hệ thống Autotile 13 hướng:** Tự động nhận diện kết nối 8 ô lân cận, xử lý mượt mà cả góc lồi, góc lõm và điểm tiếp giáp với cầu gỗ.
- **Hệ thống Render phân tầng (Two-Layer Water Rendering):**
  - *Layer -0.1 (Live Caustics):* Vẽ lớp sóng nước hoạt ảnh 8 khung hình (~150ms/frame) liên tục ở 60 FPS bên dưới các ô nước và dưới chân cầu gỗ.
  - *Layer 0 (Ground Canvas):* Mép cỏ bờ hồ được căn chỉnh màu sắc đồng nhất 100% với cỏ nền `grass_1..4` và đục lỗ trong suốt để sóng nước hoạt ảnh phản chiếu tự nhiên, không lộ bất kỳ đường viền ghép ô nào.
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
  1. *Chống mọc ở rìa vách:* Các loại hoa/thực vật (`plants`) và bụi berry (`berryBushes`) không được mọc ở mép bờ, rìa, gờ đá hay chân vách núi (`isNearCliffEdge`), tránh hiện tượng sprite treo lơ lửng giữa vách dựng đứng 2D.
  2. *Bổ sung cỏ cao lên vách:* Cỏ cao (`tallGrass`) được mở rộng sinh trên mặt phẳng cao nguyên đồi núi (`TERRAIN.HILL` & `TILE_IDS.cliff_pure`), nhưng tuyệt đối **không mọc ở rìa/mép/chân vách núi**, và giữ nguyên nền `cliff_pure` để không làm mất texture đá nền tự nhiên.
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
