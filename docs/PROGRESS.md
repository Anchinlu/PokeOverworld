# PokeOverworld - Tài Liệu Tiến Độ Phát Triển Dự Án (Project Progress)

> **Phiên bản hiện tại**: `0.1.0` (Milestone 2.11 Complete - Continuous Overworld Pokémon Animation & Natural Idle Lifelike Cycles)
> **Ngày cập nhật**: `2026-10-19`
> **Tình trạng kiểm thử**: **100% PASS** (81/81 passing suites, 885 unit tests, 0 lỗi TypeScript, 3.234 animations & atlas assets validated, 139 Tile IDs TS/Python parity, 385 manifest assets validated).
> **Lưu trữ lịch sử**: Bản nhật ký chi tiết lịch sử 92 milestones trước đây được lưu trữ tại [docs/archive/PROGRESS_v1.92_FULL_HISTORY.md](file:///e:/Pokemon/docs/archive/PROGRESS_v1.92_FULL_HISTORY.md).

---

## 1. Tổng Quan Kiến Trúc & Các Hệ Thống Cốt Lõi

| Hệ thống                                                                          |                          Trạng thái                           | Điểm nổi bật & Tính năng chính                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| :-------------------------------------------------------------------------------- | :-----------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Hoạt Ảnh Pokémon Thế Giới Liên Tục & Nhịp Thở Tự Nhiên (Milestone 2.11)**       |         **Hoàn thiện 100%** (Milestone 2.11 Complete)         | Nâng cấp toàn diện hoạt ảnh của Pokémon trên bản đồ thế giới (Overworld): **1. Khắc phục triệt để lỗi đông cứng khung hình (Freeze at Frame 0)**: Trước đây, sau khi kết thúc bước đi, toàn bộ Pokémon (hoang dã và Pokémon đồng hành) bị khóa cứng tại frame 0 tĩnh lặng; giờ đây hệ thống kích hoạt chu kỳ nhịp thở & bước dậm nhàn rỗi (Continuous Idle Stepping/Breathing) mượt mà 180ms/frame chu kỳ 4 frame (0 -> 1 -> 2 -> 3 -> 0); **2. Pokémon Đồng Hành (Follower)**: Bổ sung `idleAnimTimer` và `updateIdle(dtScale)` vào `Follower`, khi người chơi đứng yên Pokémon đồng hành (Pikachu, Bulbasaur, Charizard...) vẫn liên tục chuyển động vẫy tai, rung đuôi, nhấp nhổm sống động theo thời gian thực; **3. Pokémon Hoang Dã (Wildlife System)**: Cả 2 hệ thống mô phỏng `wild-pokemon.ts` và `wildlife-simulator.ts` duy trì chu kỳ nhịp thở liên tục khi đứng yên, khử đồng bộ hóa pha chuyển động bằng hash seed (tránh việc cả bầy cử động đều tăm tắp như robot); Pokémon ngủ (`rest_sleep`) giữ nguyên trạng thái ngủ tĩnh lặng tại frame 0 kèm bong bóng 'dots'; **4. Chuyển đổi mượt mà không khựng giật**: Khi chuyển từ di chuyển sang đứng yên và ngược lại, frame hiện tại được kế thừa trực tiếp vào `idleAnimTimer`, triệt tiêu hoàn toàn hiện tượng nhảy frame hoặc giật hình. Đạt 100% 81/81 test suites (885 unit tests, bao gồm 4/4 tests mới trong `test/pokemon-idle-animation.test.ts`), 0 lỗi TypeScript. |
| **Tái Cấu Trúc Thư Mục Tài Nguyên Theo Biome & Phân Hệ (Milestone 2.10)**         |         **Hoàn thiện 100%** (Milestone 2.10 Complete)         | Tái cấu trúc chuẩn hóa toàn diện thư mục tài nguyên `apps/web/public/assets/` theo mô hình phân tầng mô-đun: **1. Phân vùng 219 tệp PNG thành các danh mục độc lập**: `biomes/desert/` (40 tệp cồn cát, cát sa mạc, xương rồng, cây khô, sỏi đá), `biomes/dark-land/` (42 tệp đất tím, vách núi tối, cây u ám, bụi gai, mầm cây 32x96, phế tích & nghĩa trang), `biomes/coastal/` (26 tệp bờ biển sóng vỗ, cây dừa, cát ven biển, đại dương), `biomes/forest/` (4 tệp cây rừng thẳm, thân cây đổ, gốc cây mục), `biomes/autumn/` (2 tệp cây phong đỏ, bụi nón thu), `biomes/meadow/` (3 tệp cây xanh, cụm cỏ xanh), `biomes/shared/` (39 tệp 16 cây Berry, hoa dại, thảm cỏ Tall Grass), `terrain/` (54 tệp vách đồi cỏ thường, đường mòn đất, sông hồ, cầu gỗ, 6 công trình làng), `pokemon/` (8 tệp Red, Pikachu, 5 sprite hoang dã), `ui/` và `system/`; **2. Bảo tồn 100% tính nguyên vẹn mã nguồn**: Toàn bộ asset keys trong TypeScript (`TILE_KEY_BY_ID`, renderers, entity generators) được giữ nguyên vẹn không đổi; chỉ cập nhật ánh xạ đường dẫn vật lý trong `manifest.json`; **3. Thắt chặt kiểm định Parity CI**: Nâng cấp `scripts/validate-schemas.mjs` kiểm tra bắt buộc sự tồn tại của 9 thư mục phân hệ và xác thực tiền tố đường dẫn chuẩn hóa của toàn bộ asset biome; đồng bộ 139 Tile IDs giữa TypeScript và Python; 100% 80/80 test suites pass, 0 lỗi TypeScript. |
| **Biome Vùng Đất Tối, Quần Thể Phế Tích & Nghĩa Trang Cổ (Milestone 2.09)**      |         **Hoàn thiện 100%** (Milestone 2.09 Complete)         | Tích hợp toàn diện Biome Vùng Đất Tối (Dark Land Biome) từ bộ tài nguyên gothic hoang tàn: **1. Cắt lát và chuẩn hóa tài nguyên đồ họa chuẩn xác**: Chuẩn hóa nền đất tối `dark_ground_pure` từ phần không chứa vách đá trong `đất và vùng đồi cao.png` (khớp 100% màu tím violet đồng nhất giữa nền phẳng và đỉnh đồi cao nguyên, không dùng nền bùn đất tối); 13 tile vách núi đá tối (`dark_cliff_pure`, 8 viền ngoài, 4 góc trong); giữ nguyên `dark_sprout` là 1 thực thể mầm cây nguyên vẹn kích thước 32x96 (không cắt vụn làm 3 mảnh) với ySort và collider chân gốc chuẩn xác; 4 loại cây u ám (`tree_dark_large_1`, `tree_dark_large_2`, `tree_dark_dead`, `tree_dark_forest`), 6 loại bụi cây đen (`bush_dark_1..6`), đá chông nhọn (`rock_dark_spires`), và 10 tệp kiến trúc nghĩa trang & tàn tích (`ruin_temple`, `ruin_archway`, `ruin_pillar_tall`, `ruin_pillar_broken`, `ruin_wall_large`, `ruin_wall_vertical`, `fence_cemetery`, `scarecrow_dark`, `tombstone_1`, `tombstone_2`); **2. Thuật toán Công trình Landmark thủ tục**: Thiết lập tỉ lệ xuất hiện vừa phải (35% chunk vùng tối sinh công trình, không bị loãng cũng không bị quá tải), sinh ngẫu nhiên 2 dạng quần thể: **Nghĩa Trang Cổ (Ancient Graveyard)** với bia mộ đá, bù nhìn rách, hàng rào sắt bao quanh và **Đền Thờ Phế Tích Gothic (Ruined Gothic Shrine)** với cổng vòm cổ kính, hàng cột đá đổ vỡ, tường thành rêu phong và điện thờ trung tâm; toàn bộ công trình đều có hộp va chạm (Collider) chuẩn xác ngăn cây cối sinh đè và cản đường nhân vật tự nhiên; **3. Động cơ Autotiling Vùng Tối**: `getDarkGroundTileKey` kết xuất nền tím mượt mà; `getDarkCliffTileKey` (460..472) hỗ trợ cao nguyên đá tối và kết nối cỏ viền fringe khi tiếp giáp đồi cỏ thường; **4. Nhịp sinh học Circadian Wildlife (Psychic vs Ghost)**: Mở khóa môi trường sinh sống `dark_land` trong `species-spawn.json` cho 11 loài: Pokémon hệ Tâm Linh (`Abra`, `Kadabra`, `Mr. Mime`, `Drowzee`, `Hypno`) xuất hiện vào ban ngày (`dawn`, `day`) và hoàng hôn (`dusk`); Pokémon hệ Ma & Cốt tử (`Gastly`, `Haunter`, `Gengar`, `Cubone`, `Marowak`, `Zubat`, `Golbat`) trỗi dậy và hoạt động tích cực vào ban đêm (`dusk`, `night`); **5. Sinh thái & Bản đồ Thế giới**: Nối `world-query-adapter` trả về biome `'dark_land'`, bản đồ hiển thị tooltip `"Vùng đất tối hoang tàn"`, `"Vách núi tối"`, `"Đồi đất tối"` và lớp phủ màu tím thẫm `#2d2538`. Đạt 100% 80/80 test suites (880 unit tests, bao gồm 8/8 tests mới trong `test/dark-land-biome.test.ts`), 0 lỗi TypeScript. |
| **Chuẩn Hóa Đồi Cát Sa Mạc & Kích Hoạt Sinh Thái Rừng Thưa (Milestone 2.08)**     |         **Hoàn thiện 100%** (Milestone 2.08 Complete)         | Tái cấu trúc chuẩn hóa toàn diện Biome Sa Mạc & Sinh thái Rừng Thưa theo phản hồi: **1. Chuẩn hóa Nền Sa Mạc mượt mà**: Toàn bộ bề mặt phẳng sa mạc (`desert_pure`) sử dụng mặt cát vàng mịn, loại bỏ triệt để các nét đất đá/vách đá lởm chởm trên nền phẳng; **2. Tách biệt Đồi Cát Vách Đá (`dune_cliff_*`)**: Cắt lát và tích hợp 13 tile vách cồn cát chuyên biệt (`dune_cliff_pure`, 8 viền ngoài, 4 góc trong) từ dải ID 420..432; vách đá giờ chỉ xuất hiện độc quyền tại các cấu trúc đồi cồn cát nhô cao trong sa mạc; **3. Khắc phục ranh giới cỏ - sa mạc trên đỉnh đồi (Plateau Grass-Desert Boundary Fringe Autotile)**: Trong `autotile.ts` (`getDuneCliffTileKey`), các ô bề mặt bên trong đỉnh đồi cồn cát (`dune_cliff_pure`) khi tiếp giáp với bề mặt đồi cỏ (`cliff_pure`) giờ đây tự động áp dụng bộ autotile cỏ ranh giới (`sand_*` 301..312) với các răng cưa cỏ mềm mại phủ xuống cát thay vì cắt phẳng 90 độ bậc thang thô ráp; **4. Kích hoạt Habitat Rừng Thưa (`light_forest`)**: Thiết lập ngưỡng mật độ cây `LIGHT_FOREST_DENSITY_THRESHOLD = 0.42`, bổ sung vùng `light_forest` vào `EcologyZone` (ưu tiên giữa `dense_forest` và `meadow`), palette hoa & bụi cây tự nhiên riêng; **5. Mở khóa 17 loài Pokémon**: Pikachu, Caterpie, Weedle, Pidgey, Scyther, Venonat, Exeggcute... giờ đây xuất hiện chính xác trong thảm cỏ tall grass của rừng thưa; **6. Bảo tồn kiến trúc 2 tầng Biome/Ecology**: Địa hình (`desert` trong `biomes.json`) quản lý rendering/vách cồn cát, Sinh thái (`dryland` trong `species-spawn.json`) quản lý spawn Pokémon sa mạc (Sandshrew, Diglett). Đạt 100% 79/79 test suites (bao gồm 6/6 tests desert, 4/4 tests light_forest, 9/9 tests ecology). |
| **Tích Hợp Biome Sa Mạc & Tài Nguyên Tự Nhiên (Milestone 2.07)**                  |         **Hoàn thiện 100%** (Milestone 2.07 Complete)         | Tích hợp toàn diện Biome Sa Mạc (Desert Biome) từ 11 tệp tài nguyên đồ họa gốc: **1. Cắt lát và chuẩn hóa 27 tài nguyên đồ họa** vào `apps/web/public/assets/` và đăng ký trong `manifest.json`: 15 tile nền cát sa mạc (`desert_pure`, 8 viền ngoài, 4 góc trong `in_tl`, `in_tr`, `in_bl`, `in_br`, 2 biến thể cát gợn sóng `pure_var1`, `pure_var2`), 5 tệp cây & xương rồng (`tree_dead_1`, `tree_dead_2`, `cactus_large`, `cactus_medium`, `cactus_small`), 5 tệp đá cuội sa mạc (`rock_desert_boulder`, 4 loại sỏi đá cam & xám), 2 tệp thực vật khô cằn (`desert_dry_bush`, `desert_succulent`); **2. Động cơ Autotiling 3x3 Sa Mạc** trong `autotile.ts` (`getDesertTileKey`) khớp nối hoàn hảo viền ngoài trong suốt hòa quyện vào cỏ xanh nền, phân tầng `TERRAIN.DESERT = 6` và dải ID `350..364`; **3. Sinh thế giới thủ tục V3Field**: Tạo vùng cồn cát sa mạc khô hạn ngoài bán kính an toàn ($R > 64$, khử nhiễu hình thái `open/close`), giữ an toàn tuyệt đối cho làng Twinleaf Hamlet; **4. Kết xuất đồ họa sinh động**: `GroundRenderer` vẽ biến thể cát và điểm sỏi đá tự nhiên, đổ bóng elip chân thực; `ObjectRenderer` vẽ cây khô, xương rồng khổng lồ, tảng đá lớn và bụi cỏ sa mạc với ySort chuẩn xác; **5. Sinh thái & Bản đồ**: Nối `world-query-adapter` trả về context `'sand'` và biome `'dryland'` kích hoạt bầy Pokémon sa mạc (Sandshrew, Diglett, Geodude...); Bản đồ thế giới hiện tooltip `"Sa mạc cằn cỗi"`. Đạt 100% 6/6 tests mới trong `test/desert-biome.test.ts`. |
| **Thời Gian Thế Giới, Chu Kỳ Ngày/Đêm & Wildlife Circadian Runtime (Milestone 2.06)** | **Hoàn thiện phần runtime cốt lõi** | Giữ nguyên `WorldClock`, pause stack, 4 phase và ambient overlay; nối `WorldClock -> ChunkManager -> WorldQuery -> Spawn Director` để spawn đọc đúng `dawn/day/dusk/night`; `activeTime` giờ là điều kiện đủ điều kiện xuất hiện, không còn chỉ giảm trọng số; 11 loài Gen 1 ban đầu (`Rattata`, `Raticate`, `Clefairy`, `Zubat`, `Golbat`, `Meowth`, `Persian`, `Gastly`, `Haunter`, `Drowzee`, `Hypno`) hoạt động từ hoàng hôn đến ban đêm; Pokémon ngoài khung giờ chuyển sang `rest_sleep`, hiện dấu ngủ và không bị kích hoạt encounter; khi chuyển phase, các chunk mô phỏng gần người chơi được tái sinh deterministic. Weather overworld và breeding vẫn chưa triển khai. Kiểm thử mới: 3/3 wildlife day/night tests pass. |
| **Autotiling Bờ Biển 8 Hướng & Ranh Giới Sinh Vật Thủy Sinh (Milestone 2.04)**     |         **Hoàn thiện 100%** (Milestone 2.04 Complete)         | Khắc phục triệt để đường cong bờ biển và quy tắc ranh giới sinh vật dưới nước: **1. Khép kín hệ thống Autotiling 8 hướng**: Bổ sung đầy đủ 4 góc trong (`e && s` $\to$ `shore_corner_in_es` 739, `e && n` $\to$ `shore_corner_in_en` 740, `w && s` $\to$ 734, `w && n` $\to$ 732) và 4 góc ngoài lồi (`se` $\to$ `shore_corner_out_se` 741, `ne` $\to$ `shore_corner_out_ne` 742, `sw` $\to$ 735, `nw` $\to$ 733) trong `v0-field.ts`, `v3-field.ts`, kết xuất sóng vỗ xoay ma trận chuẩn xác trong `ground-renderer.ts`, triệt tiêu hoàn toàn góc nhọn bậc thang gãy khúc; **2. Vùng an toàn sinh sản dưới nước (Spawning Buffer Margin)** trong `placement.ts`: Pokémon thủy sinh không sinh sản sát mép nước/bờ biển, yêu cầu bán kính an toàn $\ge 2$ ô cách bờ cạn; **3. Trạng thái mặt đất tại ranh giới (Boundary Ground State)** trong `world-query-adapter.ts`, `grid-mover.ts`, `wildlife-simulator.ts`, `wild-pokemon.ts`, `game-session.ts`: Tile bờ biển (`shore`) được phân loại riêng; khi Pokémon thủy sinh/Follower di chuyển lên ô ranh giới này sẽ tự động chuyển sang trạng thái trên cạn (`isSwimming = false`), hiển thị sprite đứng/đi bộ tự nhiên; khi bơi ra nước sâu sẽ tự động bơi lại (`isSwimming = true`); **4. Kiểm thử**: Đạt 100% 75/75 test suites, 834 unit tests. |
| **Sinh Thái Pokémon Dưới Nước (Water Wildlife Spawning & Movement)**              |         **Hoàn thiện 100%** (Milestone 2.03 Complete)         | Phân loại môi trường sinh thái và mở khóa sinh vật hoang dã dưới nước: **1. Phân loại 3 nhóm**: Biển/Đại dương (`coast`), Sông/Hồ nước ngọt (`wetland`), và Lưỡng cư/Thích nghi cả hai; **2. Mở khóa điểm sinh (Spawning Anchors)** trong `placement.ts`: Cho phép quét và chọn neo đàn trên các ô mặt nước `water_surface`, tạo bầy xung quanh cá thể đầu đàn trên nước; **3. Gán cờ bơi `isSwimming`** trong `spawn-director.ts` & `wild-entity.ts`: Kích hoạt tự động sprite bơi/lơ lửng từ `Swimming Overworld Sprites`; **4. Ranh giới di chuyển AI (AI Water Bounds)** trong `grid-mover.ts` & `wildlife-simulator.ts`: Pokémon thủy sinh chỉ bơi lội tuần tra trong vùng mặt nước, không bơi lên cạn; Pokémon đất liền không bước xuống nước; **5. Kiểm thử**: Đạt 100% 4/4 tests trong `test/wildlife/wildlife-system.test.ts`, 0 lỗi TypeScript. |
| **Sprite Overworld Dưới Nước & Bay Lơ Lửng (Swimming & Levitates Sprites)**       |         **Hoàn thiện 100%** (Milestone 2.02 Complete)         | Tích hợp toàn diện bộ tài nguyên Overworld dạng bơi / lơ lửng trên mặt nước: **1. Chuẩn hóa cấu trúc thư mục** tại `Graphics/Characters/Swimming Overworld Sprites/` với 4 phân mục độc lập (`Swimming`, `Swimming Shiny`, `Levitates`, `Levitates Shiny`), hỗ trợ hơn 1.200+ spritesheet kích thước chuẩn 256x256 (lưới 4x4, 64px); **2. Bổ sung ánh xạ** tương thích hoàn toàn cho Nidoran (`NIDORANfE.png`), đạt **độ phủ 100% (151/151)** Pokémon Gen 1 cho cả dạng thường lẫn Shiny; **3. Khai báo Schema & Kiểu dữ liệu** trong `packages/shared-types/pokemon.ts` (`swimming`, `swimmingShiny`, `followerWater`, `followerWaterShiny`) và `pokemon.schema.json`; **4. Cập nhật Database** `packages/game-data/pokemon-db.json` với đường dẫn tài nguyên chuẩn xác cho 151 loài (130 loài bơi, 21 loài bay/lơ lửng); **5. Nâng cấp bộ kết xuất** `character-renderer.ts`, `follower.ts`, `game-session.ts`: Tự động nhận diện khi Follower / Pokémon hoang dã ở trên mặt nước (`OCEAN_WATER` hoặc tile nước `700..738`) để kết xuất sprite bơi lội/lơ lửng sống động kèm fallback an toàn. |
| **Nâng Cấp Địa Hình Đồng Bằng & Thêm Biến Thể Thực Vật (Terrain & Flora)**        |         **Hoàn thiện 100%** (Milestone 2.01 Complete)         | Nâng cấp toàn diện bộ tài nguyên địa hình từ thư mục đồng bằng: **1. Sao lưu an toàn** 39 file gốc vào `assets/backup_terrain_v0/`; **2. Thay thế 13 tile đường đất (`path_*`)** chuẩn 9-slice bo viền cong mượt và 4 góc bo trong tự nhiên; **3. Thay thế 13 tile đồi vách đá (`cliff_*`)** bằng khối đá tròn xếp tầng đổ bóng phân tầng kèm tảng đá cuội lớn `cliff_boulder`; **4. Thay thế 13 tile bãi cát (`sand_*`)** với nền cát mịn gợn sóng và lớp cỏ ranh giới bổ sung (`fringe_*`) phủ răng cưa tự nhiên nhô tràn xuống bãi cát theo đúng yêu cầu; **5. Bổ sung thêm (không thay thế hoa cũ)** 11 biến thể thực vật mới (`flower_blue_bell`, `flower_white_daisy`, `flower_pink_white`, `flower_scatter_daisy`, `flower_pink_cluster`, `flower_blue_cluster`, `flower_dandelion`, `plant_clover`, `grass_white_dots`, `grass_tuft_single`, `grass_tuft_double`) và 3 chi tiết bãi biển (`sand_grass`, `sand_mound`, `sand_shell`), tích hợp sinh ngẫu nhiên tất định trong `ground-renderer.ts`.                                                                                                                                     |
| **Thoát Về Màn Hình Chờ (In-Game Menu Exit to Title Screen)**              |         **Hoàn thiện 100%** (Milestone 2.00 Complete)         | Nâng cấp nút Thoát `#btnMenuQuit` trên thanh điều hướng góc trên phải (`#topRightBar`): Thay vì chỉ thu gọn overlay gỡ lỗi, nút Thoát giờ đây thực hiện quy trình thoát game an toàn toàn diện: kiểm tra an toàn trận đấu (`session.isBattling`), hộp thoại xác nhận lưu tiến trình, tự động lưu dữ liệu (`window.saveGame()`), đóng toàn bộ các màn hình con (Pokédex, Party, Bag, PC Box, World Map), dừng vòng lặp game (`loop.stop()`), dọn dẹp sạch sẽ toàn bộ lắng nghe sự kiện (`AbortController`), ẩn HUD thế giới (`#topRightBar`, `#partyMapHud`), giải phóng canvas và tái gắn kết màn hình chờ Title Screen (`showTitleScreen`). Đạt 100% 11/11 tests trong `test/title-screen.test.ts`.                                                                                                                                                                                                                                                                                                                                                                       |
| **Tạo & Tải Thế Giới Đa Slot (New World & Save World Picker)**              |         **Hoàn thiện 100%** (Milestone 1.99 Complete)         | Nâng cấp toàn diện 2 nút tương tác cốt lõi trên màn hình chờ Title Screen: **Nút "Thế Giới Mới"** mở Modal Pixel Art chuẩn Minecraft GUI (`#titleNewWorldModal`) với mã sinh Seed ngẫu nhiên (6 chữ số), nút đổi seed `🎲 Đổi Seed` tức thì, dropdown chọn vị trí lưu (`slot_1` .. `slot_4`) kèm cảnh báo ghi đè bản lưu trực quan, huy hiệu engine `World Gen v3 (Thung lũng & Hành lang)`, reset sạch sẽ dịch vụ domain (`Player`, `Party`, `Inventory`, `PC Storage`) và khởi tạo thế giới mới khác biệt hoàn toàn; **Nút "Tải Thế Giới"** mở Modal Tải Bản Lưu (`#titleLoadWorldModal`) tự động truy vấn `saveGameRepository.listSaves()`, hiển thị danh sách thẻ thế giới retro chi tiết (Tên Slot, Seed `#101`, Phiên bản `v3/v2/v1`, Tên HLV, số huy hiệu, tiền, Pokémon đội trưởng & Level, số lượng đội hình & PC, thời gian chơi, thời điểm lưu gần nhất), kèm 2 nút tương tác nhanh `▶️ Vào Thế Giới` và `🗑️ Xóa bản lưu` (kèm xác nhận an toàn). Đạt 100% 11/11 tests trong `test/title-screen.test.ts`.                                                                                                                                                                                 |
| **Thế giới mở v3: Thung lũng & Hành lang (World Gen v3)**                  |         **Hoàn thiện 100%** (Milestone 1.98 Complete)         | Nâng cấp thuật toán sinh thế giới thủ tục `worldGenVersion = 3` (`V3Field`) theo mô hình **Thung lũng bất đối xứng với các hành lang mở tự nhiên (Asymmetric Valley & Organic Corridors)**: Giữ vùng lõi an toàn nhỏ $R=20$ phẳng mượt 100% bao trọn làng Twinleaf Hamlet `(0, 0)` và điểm spawn; méo biên giới bằng noise tần số thấp (loại bỏ hoàn toàn hình tròn đồng tâm của v0); tạo 3 hành lang đất mềm vươn dài (Route 1 Đông Bắc, Rừng & Hồ Tây Nam, Mở rộng Nam Đông Nam) với đường cong uốn lượn tự nhiên và đảm bảo đường đi liên tục; địa hình tự nhiên (cát, nước, đồi) chuyển tiếp sớm hơn từ 80–128 ô; tương thích ngược 100% với save v1/v2; tích hợp lớp phủ chẩn đoán trực quan trên Bản đồ thế giới (Phím V hoặc nút 🧭 V3 Debug) hiển thị tâm lõi, hành lang và chỉ số an toàn khi rê chuột. Đạt 100% 8/8 tests trong `test/world-v3/v3-field.test.ts`.                                                                                                                                                                                                                                                                                                                         |
| **Hoạt Ảnh Idle Nhân Vật (Player Idle Animation)**                         |         **Hoàn thiện 100%** (Milestone 1.97 Complete)         | Tích hợp hệ thống hoạt ảnh nhàn rỗi (Idle Animation) tự nhiên cho nhân vật chính từ spritesheet mới (cột 2: tư thế nhắm mắt/chớp mắt thư giãn). Hành động không lặp lại liên tục mà kích hoạt theo thời gian chờ ngẫu nhiên (3.0s – 7.0s) kết hợp kiểm tra xác suất 50%; hỗ trợ cả nháy mắt đơn (`single blink` 220ms) và nháy mắt kép (`double blink` 360ms); triệt tiêu độ trễ điều khiển (tự động hủy ngay lập tức khi người chơi di chuyển, bước chân chuyển sang chu kỳ đi bộ mượt mà không bị chớp giật). Đạt 100% 8/8 tests trong `test/player-idle.test.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Bản đồ Toàn cảnh Thế giới (World Map System)**                           |         **Hoàn thiện 100%** (Milestone 1.96 Complete)         | Hệ thống bản đồ toàn cảnh thời gian thực kích hoạt khi bấm phím `M` hoặc nhấp nút menu 🗺️ trên thanh điều hướng. Lấy mẫu địa hình thủ tục trực tiếp từ `TerrainField` kết hợp kiến trúc LRU Cache Macro-tile 32×32 ô thế giới, cho phép cuộn kéo pan mượt mà 60 FPS, phóng to thu nhỏ linh hoạt (0.5x – 6.0x) hướng chuẩn tâm con trỏ chuột (zoom-to-cursor), radar xung phát sóng định vị người chơi thời gian thực kèm mũi tên chỉ hướng nhìn và đồng hành Follower, tự động quét và đánh dấu các điểm dân cư/thị trấn (Twinleaf Hamlet tại gốc và các làng theo seed), thẻ HUD hiển thị tọa độ thời gian thực và tra cứu địa hình khi di chuột, bảng chú giải màu sắc sắc nét chuẩn Town Map. Đạt 100% 7/7 tests trong `test/world-map.test.ts`.                                                                                                                                                                                                                                                                                                                         |
| **Hệ thống Sinh vật Hoang dã (Wildlife System)**                           |             **Hoàn thiện 100%** (W1..W8 Complete)             | Kiến trúc mô-đun hóa độc lập `apps/web/src/wildlife/` theo [WILDLIFE_DEV_GUIDE.md](file:///e:/Pokemon/docs/WILDLIFE_DEV_GUIDE.md): Độ hiếm 2 bước (Tier Probability + Affinity), sinh theo bầy đàn (`solo`, `member`, `leader`, `apex`), cấp cơ sở theo khoảng cách khởi đầu $L(d)$, tỉ lệ Shiny chuẩn 1/4096 tất định theo hash seed; Hiển thị cấp trên đầu với `???` đỏ đe dọa cho leader/apex và `Lv.X` cho Pokémon thường; Bộ não Utility AI chấm điểm theo nhu cầu, giác quan, phản ứng đe dọa (flee/warn/chase), nhịp ngày đêm (ngủ ngày, thức khi lại gần $\le 2$ ô), phản ứng thời tiết; Mạng báo động bầy lan truyền trễ 3–8 nhịp, điều hướng lực kéo gắn kết $R \le 3$, phản ứng hậu chiến (bắt/hạ thành viên $\to$ bầy chạy, hạ đầu đàn $\to$ bầy tan); Spatial Hash 4x4, phân tầng LOD (LOD1 $\le 12$, LOD2 $\le 24$, LOD3 đóng băng $> 24$) và kiểm soát ngân sách khung hình $\le 1.5$ms. `WorldChunk` hiện chỉ dùng một pipeline spawn duy nhất từ `apps/web/src/wildlife/`; không triển khai săn mồi hoặc cạnh tranh tài nguyên. Đạt 100% 9/9 test suites (53 tests). |
| **Thế giới mở vô hạn 2D (World Gen v0)**                                   | **Hoàn thiện 100%** (S1..S8 Complete + Shore Wave Autotiling) | Hoàn thành toàn diện 8 bước theo tài liệu [WORLD_GEN_V0_DEV_GUIDE.md](file:///e:/Pokemon/docs/WORLD_GEN_V0_DEV_GUIDE.md): Trừu tượng hóa `TerrainField` đa engine, tương thích ngược 100% thế giới dải (`LegacyStripField`, golden hash `867984b3`), động cơ nhiễu tất định `noise.ts` (không hàm siêu việt, bảo vệ bởi quy tắc ESLint), toán tử hình thái học `morphology.ts`, xuất PNG bản đồ `render-map.ts`, `V0Field` với lục địa 2D tự nhiên, vùng xuất phát an toàn $R_0 = 330$, đồi mảng $\ge 3$ ô cách cát $\ge 2$ ô, làng khởi đầu cố định Twinleaf Hamlet tại gốc `(0, 0)`, đường nội bộ liên thông, Poisson-disk pruning cho các thị trấn cách nhau $\ge 160$ ô, lưu và di trú `worldGenVersion = 2` kèm `startTown`. Tích hợp hệ thống Autotiling sóng bờ biển vỗ bờ sống động (`shore_v`, `shore_corner_in`, `shore_corner_out`, `shore_corner_in_flip`, `shore_corner_out_flip`) chuyển tiếp mượt mà giữa cát và biển. Đạt toàn bộ 9/9 tiêu chí nghiệm thu.                                                                                                            |
| **Sinh thái & Phân vùng Spatial**                                          |                        Hoàn thiện 100%                        | Phân chia Chunk không biên giới (Spatial Partitioning), thuật toán ngăn cây to và bụi Berry đè lên nhau, sinh thái sông hồ, bãi biển, đảo biển, bụi rậm va chạm thực tế.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| **Hệ thống Trận đấu (Battle Engine)**                                      |                        Hoàn thiện 100%                        | Kiến trúc dòng thời gian chuẩn Essentials/EBDX, cơ chế Gen 9 (Terastallization, Volatile statuses, Hazards, Weather indicator, Screens, Trick Room, Substitute, Trapping).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Lưu trữ & Dữ liệu (Autosave V3)**                                        |                        Hoàn thiện 100%                        | Phân vùng Slot chính + Hộp PC, cơ chế tự động sao lưu `.bak` và khôi phục khi tệp chính lỗi, khóa an toàn trong trận (in-battle lock), kiểm soát quota lưu trữ, lưu `worldGenVersion`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Âm thanh (Audio Engine)**                                                |                        Hoàn thiện 100%                        | 100% tệp âm thanh SE hoạt ảnh được chuẩn hóa sang **16-bit 48.000 Hz Stereo PCM** (giải quyết triệt để lỗi câm tiếng do trình duyệt không hỗ trợ 8-bit unsigned PCM), tự động fallback định dạng/thư mục.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Công cụ Gỡ lỗi (Dev/Bot Tools)**                                         |                        Hoàn thiện 100%                        | Remote Bridge & Custom Bot Battler Overlay Cheat Tools, hỗ trợ kiểm thử trận đấu độc lập.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

### 1.1. Chi Tiết Triển Khai Hệ Thống Sinh Vật Hoang Dã (Milestone 1.95 - Wildlife System W1..W8)

Theo hướng dẫn tại [docs/WILDLIFE_DEV_GUIDE.md](file:///e:/Pokemon/docs/WILDLIFE_DEV_GUIDE.md), hệ thống sinh vật hoang dã đã được đóng gói thành mô-đun độc lập `apps/web/src/wildlife/`:

1. **W1 - Mô hình dữ liệu & Tương thích ngược (`model/`)**:
   - `WildEntity` là model runtime duy nhất, hỗ trợ vai trò sinh thái `WildRole` (`solo`, `member`, `leader`, `apex`), bầy đàn `herdId`, giới tính `gender`, và các trạng thái AI `WildState`; được sử dụng trực tiếp bởi `WorldChunk` và `wildlife/`.

2. **W2 - Hiển thị cấp & Chỉ báo đe dọa (`indicators/` & `rendering/wildlife/`)**:
   - `getLevelIndicator(entity, playerRefLevel, opts)`: hàm thuần logic kiểm tra bảng chân trị Section 5.1.
   - Trả về `{ kind: 'unknown_red', text: '???' }` khi đối mặt `leader` hoặc `apex`.
   - Trả về `{ kind: 'level', text: 'Lv.X' }` khi cấp hoang dã thấp hơn cấp người chơi tham chiếu; ẩn khi $\ge$ cấp tham chiếu.
   - `drawWildOverheadIndicator` vẽ pill badge bo góc, hiệu ứng nhịp tim đỏ cảnh báo đe dọa trên canvas.

3. **W3 - Dữ liệu sinh thái Gen 1 (`species-spawn.json`, `spawn-config.json`, `validate-wildlife.mjs`)**:
   - 151 loài Pokémon Gen 1 được phân loại đầy đủ với ái lực theo Biome và TileContext (`tall_grass`, `forest_floor`, `water_surface`, `shore`, `rock`, `sand`, `walkable_ground`).
   - Cờ loại trừ đặc biệt: `legendary`, `mythical`, `starter`, `fossil`, `static`, `no_wild`.
   - Script CI `scripts/validate-wildlife.mjs` bảo đảm tính hợp lệ, đầy đủ của 151 loài, kiểm tra tổng xác suất cấp bằng 1.0 và độ phủ sinh vật hoang dã tại mọi Biome.

4. **W4 - Động cơ sinh sinh vật hai bước (`spawn/`)**:
   - Thuật toán 2 bước chống biến dị phân bố (Bước 1: chọn Tier $0..4$ theo xác suất; Bước 2: chọn loài theo trọng số sinh thái và thời tiết).
   - Mô hình cấp cơ sở theo cự ly $L(d) = \text{clamp}(L_0 + \lfloor d / 120 \rfloor, 2, 60)$. Khống chế trần cấp 5 tại vùng xuất phát an toàn.
   - Tỉ lệ Shiny chuẩn 1/4096 tất định qua `hashWildlife` seed không dùng hàm ngẫu nhiên của trình duyệt.
   - Dựng cấu trúc bầy `composeHerd`: phân phối 1 Leader (+3..+8 cấp) và các Member; xác suất xuất hiện Apex (+10..+20 cấp) ngoài vùng khởi đầu.

5. **W5 - Tập tính & Bộ điều khiển di chuyển ô lưới (`behavior/movement/`, `behavior/profiles/`)**:
   - Chuyển giao toàn bộ 5 hành vi di sản sang `behavior-archetypes.json` (`skittish_bird`, `aggressive_bird`, `curious_rodent`, `slow_bug`, `dormant_cocoon`) cùng các mẫu mới (`herd_grazer`, `territorial_brute`, `nocturnal_flyer`).
   - `grid-mover.ts`: di chuyển nội suy 32px mượt mà với hiệu ứng nhún bước chân tự nhiên (`bobY`), kiểm tra va chạm địa hình không thể đi (`isWalkable`) và tránh đi trùng ô với sinh vật khác.

6. **W6 - Bộ não chấm điểm Utility Brain (`behavior/brain/`, `behavior/schedule/`)**:
   - `utility-brain.ts` & `considerations.ts`: chấm điểm tiện ích liên tục theo nhu cầu (đói, năng lượng, sợ hãi), kích thích từ người chơi, và tính khí của loài.
   - Quán tính trạng thái (`MIN_STATE_DURATION_MS = 600ms`) và biên độ trễ (`HYSTERESIS_MARGIN = 0.15`) triệt tiêu hiện tượng rung lắc/dao động trạng thái.
   - `daily-rhythm.ts`: loài ăn đêm (Nocturnal) ngủ ngày (hiện bong bóng `"z"`), giật mình thức giấc khi người chơi tiến vào phạm vi $\le 2$ ô.
   - `weather-response.ts`: biến đổi tốc độ và độ tích cực khi gặp mưa hoặc bão cát.

7. **W7 - Tương tác xã hội & Mạng báo động bầy (`behavior/social/`, `encounter/`)**:
   - `herd-controller.ts`: gắn kết đàn với bán kính $R_{\text{cohesion}} = 3$ ô, đẩy nhẹ khi quá sát $< 1$ ô.
   - `alarm.ts`: mạng báo động lan truyền độ trễ tỉ lệ khoảng cách (3–8 nhịp mô phỏng).
   - `handleHerdPostBattle`: sau trận đấu, nếu thành viên bị hạ/bắt thì bầy hoảng sợ bỏ chạy; nếu đầu đàn bị hạ thì bầy giải tán thành cá thể đơn lẻ.

8. **W8 - Điều phối WildlifeSimulator & Cổng WildlifeSystem (`wildlife/index.ts`)**:
   - Phân tầng LOD 3 cấp theo cự ly tới người chơi (LOD 1: $\le 12$ ô mô phỏng toàn phần; LOD 2: $\le 24$ ô mô phỏng thưa 6 nhịp; LOD 3: $> 24$ ô đóng băng).
   - Spatial Hash ô 4x4 phục vụ truy vấn vùng lân cận cực nhanh; kiểm soát ngân sách khung hình $\le 1.5$ms cho 200 thực thể.

---

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
