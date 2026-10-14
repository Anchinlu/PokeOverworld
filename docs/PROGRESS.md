## Cập nhật lần cuối: 2026-10-14 (Hoàn Tất Nốt Nhóm F & Nâng Cấp Toàn Diện 12 Chiêu Thức Nhóm G Chuẩn 1:1 EBDX)

### 1.32. Hoàn Tất Nốt Nhóm F & Triển Khai Toàn Diện 12 Chiêu Thức EBDX Nhóm Chữ G:

- **Yêu cầu người dùng**:
  - _"1 và 2 lun nhé"_: Thực hiện đồng thời cả 2 mục:
    1. Hoàn tất nốt 3 chiêu cuối của chữ F (`fusion_bolt`, `fusion_flare`, `future_sight`).
    2. Triển khai nâng cấp toàn diện nhóm 12 chiêu thức EBDX thuộc chữ G (`giga_impact`, `glare`, `grass_knot`, `grass_whistle`, `grassy_terrain`, `growl`, `growth`, `guard_swap`, `guillotine`, `gunk_shot`, `gust`, `gyro_ball`).
- **Chi tiết thực hiện Mục 1 (F-Group Finale)**:
  - `fusion_bolt` (ID [6702.json](file:///e:/Pokemon/packages/game-data/animations/6702.json) & [last-chance/6702.json](file:///e:/Pokemon/packages/game-data/animations/last-chance/6702.json)): Bổ sung tiền tố đường dẫn `Anim/Thunder9.ogg` khắc phục hoàn toàn lỗi âm thanh 404.
  - `fusion_flare` (ID [6703.json](file:///e:/Pokemon/packages/game-data/animations/6703.json) & [last-chance/6703.json](file:///e:/Pokemon/packages/game-data/animations/last-chance/6703.json)): Bổ sung tiền tố `Anim/Explosion4.ogg` và `Anim/Fire3.ogg`.
  - `future_sight` (ID [142.json](file:///e:/Pokemon/packages/game-data/animations/142.json)): Tái tạo kịch bản timeline EBDX con mắt tiên tri `eb619_6` từ [6787.json](file:///e:/Pokemon/packages/game-data/animations/6787.json). Đã sao chép `eb619_6.png` và `eb619_7.png` vào `apps/web/public/Graphics/Animations/`.
  - Đồng bộ `manifest.json` và `move-animations-db.json` cho cả 3 chiêu thức.

- **Chi tiết thực hiện Mục 2 (G-Group 12 Moves EBDX Complete)**:
  1. **Đồng bộ hóa 23/23 tệp đồ họa EBDX**:
     - Sao chép toàn bộ 23 tệp PNG vào `Graphics/Animations/` và `apps/web/public/Graphics/Animations/`:
       `eb615_7`, `eb645_10`, `eb617_4`, `eb619_4`, `eb647_2`, `eb458_14`, `eb647`, `eb645_9`, `eb617_3`, `eb647_3`, `eb637`, `eb458_15`, `eb427_1`, `eb615_2`, `eb614_14`, `eb427_2`, `eb244_4`, `eb614_13`, `eb614_11`, `eb622_bg`, `eb602_4`, `eb057_2`, `eb129_bg`.
     - Cấu hình chuẩn xác `animation-atlas.json` (đặc biệt `eb637` 4×4 16 pattern, `eb647_3` 2×1 2 pattern, cùng các single particle).
  2. **Tái tạo kịch bản timeline hoạt ảnh 1:1 EBDX cho toàn bộ 12 chiêu**:
     - `gust` (ID [151.json](file:///e:/Pokemon/packages/game-data/animations/151.json) & [152.json](file:///e:/Pokemon/packages/game-data/animations/152.json) - 16 frames): Cơn lốc xoáy kép `eb637` xoay 16 pattern lướt từ người dùng qua mục tiêu, âm thanh `Anim/Wind8.ogg` và `Anim/gust.ogg`.
     - `glare` (ID [146.json](file:///e:/Pokemon/packages/game-data/animations/146.json) - 15 frames): Cặp mắt xà vương `eb619_4` phát sáng, phóng to xung động và giáng tia tê liệt, âm thanh `Anim/ScaryFace.ogg`.
     - `grass_whistle` (ID [147.json](file:///e:/Pokemon/packages/game-data/animations/147.json) - 16 frames): Chuỗi nốt nhạc chiếc lá `eb617_3` và `eb617_4` uốn lượn hình sin ru ngủ mục tiêu, âm thanh `Anim/GrassWhistle.ogg` và `Anim/Sleep.ogg`.
     - `guillotine` (ID [6707.json](file:///e:/Pokemon/packages/game-data/animations/6707.json) - 16 frames): Không gian tối sầm `eb129_bg`, lưỡi máy chém tử thần khổng lồ `eb602_4` giáng chém kết liễu, âm thanh `EBDX/Anim/ground1.wav` và `EBDX/Anim/normal3.wav`.
     - `giga_impact` (ID [6448.json](file:///e:/Pokemon/packages/game-data/animations/6448.json) - 20 frames): Tụ năng lượng `eb615_7`, `eb057_2`, `eb614_14`, không gian vũ trụ tối sầm `eb622_bg`, lao vút siêu thanh `eb614_13`, nổ sao bộc phát `eb244_4` và đất đá tán xạ `eb614_11`, âm thanh `EBDX/Anim/dragon2.wav`, `Anim/TakeDownAttack.ogg`, `Anim/superdamage.ogg`, `Anim/rock1.ogg`.
     - `gyro_ball` (ID [6456.json](file:///e:/Pokemon/packages/game-data/animations/6456.json) - 16 frames): Vòng quay con quay kim loại `eb458_14` và 4 vệ tinh cầu `eb458_15` xoay tăng tốc rồi lao thẳng vào mục tiêu, âm thanh `Anim/Psych Up.ogg` và `Anim/superdamage.ogg`.
     - `gunk_shot` (ID [6455.json](file:///e:/Pokemon/packages/game-data/animations/6455.json) - 16 frames): Bọc rác độc `eb427_1` bay cầu vồng rồi đập trúng mục tiêu vỡ tung thành 8 tia độc `eb427_2`, âm thanh `Anim/Poison.ogg` và `Anim/Splat.ogg`.
     - `guard_swap` (ID [6454.json](file:///e:/Pokemon/packages/game-data/animations/6454.json) - 16 frames): Hai chiếc khiên tinh thể `eb645_9` bay chéo hoán đổi giữa 2 bên kèm bụi sao huyền ảo `eb645_10`, âm thanh `Anim/Saint7.ogg` và `Anim/Saint8.ogg`.
     - `grassy_terrain` (ID [6788.json](file:///e:/Pokemon/packages/game-data/animations/6788.json) - 20 frames): Trận đồ thảm cỏ `eb647_3` 2 pattern trải rộng mặt đất, hoa đồng nội `eb647_2` bừng nở và lá cỏ `eb647` xoay tròn trong gió, âm thanh `EBDX/Anim/grass2.wav` và `Anim/Saint8.ogg`.
     - `growth` (ID [6452.json](file:///e:/Pokemon/packages/game-data/animations/6452.json) - 16 frames): Luồng linh khí cỏ cây `eb615_2` và tia năng lượng `eb057_2` tuôn trào thăng hoa, âm thanh `EBDX/Anim/dragon2.wav` và `Anim/StatUp.ogg`.
     - `growl` (ID [148.json](file:///e:/Pokemon/packages/game-data/animations/148.json) & [149.json](file:///e:/Pokemon/packages/game-data/animations/149.json) - 14 frames): Người dùng rung chuyển gầm vang, từng lớp sóng âm thanh `Growl` lan tỏa áp chế mục tiêu, âm thanh `Anim/Uproar.ogg`.
     - `grass_knot` (ID [6449.json](file:///e:/Pokemon/packages/game-data/animations/6449.json) - 16 frames): Bụi cỏ gai `eb647_2` và dây cỏ `eb647` mọc quấn chặt chân mục tiêu giật mạnh làm ngã dúi dụi, âm thanh `EBDX/Anim/grass2.wav`, `Anim/Twine.ogg`, `Anim/Slam.ogg`.
  3. **Đồng bộ hóa dữ liệu & Nhóm đã tối ưu**:
     - Cập nhật đồng bộ [manifest.json](file:///e:/Pokemon/packages/game-data/animations/manifest.json), [last-chance-animation-manifest.json](file:///e:/Pokemon/packages/game-data/last-chance-animation-manifest.json), [move-animation-extensions.json](file:///e:/Pokemon/packages/game-data/move-animation-extensions.json) và [move-animations-db.json](file:///e:/Pokemon/packages/game-data/move-animations-db.json).
     - **Cập nhật danh sách Chiêu thức đã tối ưu ([reunion-moves.json](file:///e:/Pokemon/packages/game-data/reunion-moves.json))**: Đã thêm toàn bộ 15 chiêu thức (`fusion_bolt`, `fusion_flare`, `future_sight`, `giga_impact`, `glare`, `grass_knot`, `grass_whistle`, `grassy_terrain`, `growl`, `growth`, `guard_swap`, `guillotine`, `gunk_shot`, `gust`, `gyro_ball`) vào mảng `optimizedMoves` (nâng tổng số lên **141 chiêu thức đã tối ưu chuẩn 1:1**) và `allReunionMoves` (411 chiêu).
     - Nhờ đó, trong Visual QA / Animation Gallery, bộ lọc `reunion_optimized` (Chiêu thức Pokemon Reunion EX Trilogy 4.2 đã tối ưu như bản gốc) hiển thị đầy đủ và tự động gắn huy hiệu `[1:1 REUNION]`.
- **Khắc phục lỗi mất hình ảnh trong phòng thử nghiệm (Animation Gallery Timing Flash Bugfix)**:
  - **Hiện tượng**: Người dùng phản hồi _"các chiêu g trong phòng mô phỏng trình chiếu đang bị mất hình ảnh lúc gần kết thúc chiêu ko liên quan đền frame move"_.
  - **Nguyên nhân gốc rễ**:
    1. **Thiếu `updateFlashes()` trong loop của [`AnimationGallery`](file:///e:/Pokemon/apps/web/src/battle/animation/animation-gallery.ts)**: Khi chiêu thức đi đến frame có flash timing (thường ở frame 7–11 lúc chuẩn bị kết thúc), `TimingEventManager.executeEvent` thêm flash vào mảng `activeFlashes`. Nhưng trong `startLoop` của Gallery, không có lệnh `this.timingManager.updateFlashes()` nên flash không bao giờ đếm ngược và không bao giờ kết thúc.
    2. **Màu sắc hex string làm hỏng `fillStyle`**: `flashColor` trong dữ liệu JSON nhóm G là chuỗi hex (như `"#ffffff"`, `"#ff1122"`). Khi [`TimingEventManager`](file:///e:/Pokemon/apps/web/src/battle/animation/timing-events.ts) tính `(baseA / 255) * alphaFraction`, nó lấy ký tự string chia cho 255 dẫn tới `NaN`. Khi đó `ctx.fillStyle` nhận chuỗi không hợp lệ và giữ nguyên giá trị trước đó (`#fff` từ avatar label). Kết quả là `ctx.fillRect(0, 0, width, height)` vẽ một hình chữ nhật trắng toàn màn hình đè lên toàn bộ canvas từ frame 7 cho đến hết chiêu!
    3. **FlashScope mặc định là 3 (Screen Flash)**: Kịch bản cũ thiếu trường `flashScope` nên tự động gán là `3` (toàn màn hình) thay vì `1` (Target Battler) hoặc `2` (User Battler).
  - **Giải pháp xử lý triệt để**:
    1. Trong [`timing-events.ts`](file:///e:/Pokemon/apps/web/src/battle/animation/timing-events.ts): Thêm bộ phân giải màu thông minh `parseFlashColor` hỗ trợ cả mảng RGBA và mã màu HEX string, tự động kiểm tra `Number.isFinite`, giới hạn alpha an toàn và mặc định `flashScope: 1`.
    2. Trong [`animation-gallery.ts`](file:///e:/Pokemon/apps/web/src/battle/animation/animation-gallery.ts): Gọi `this.timingManager.updateFlashes()` trong loop cập nhật frame; đồng thời render hiệu ứng flash tint trực tiếp trên hình đại diện Pokémon (Player / Enemy Avatar) đúng chuẩn thay vì phủ trắng màn hình.
    3. Chuẩn hóa lại toàn bộ 12 tệp JSON của nhóm chiêu G với `flashScope` (1 cho đòn trúng đích, 2 cho buff bản thân), `flashDuration` (3–4 frames) và `flashColor` dạng mảng 4 kênh số nguyên chuẩn `[r, g, b, a]`.
- **Khắc phục góc xoay lốc xoáy chiêu Gust (Gust Vortex Alignment Perfection)**:
  - **Hiện tượng**: Người dùng phản hồi kèm ảnh chụp _"gust xem lại chiêu này lốc xoáy bị xoay vòng vòng ko đẹp lắm"_. Hai cơn lốc xoáy bị quay một góc nghiêng `angle = i * 10` và `-i * 10` tạo thành hình chữ V chúc đầu và lộn xào qua từng frame thay vì đứng thẳng.
  - **Nguyên nhân gốc rễ**:
    - Sprite atlas `eb637` vốn dĩ đã là một hình phễu lốc xoáy thẳng đứng với 4 pattern xoay luồng gió quanh trục đứng `(i % 4)`. Khi kịch bản thêm thuộc tính `angle` tăng tiến theo frame, toàn bộ khung sprite bị quay nghiêng chéo trên mặt phẳng 2D, làm miệng phễu và đáy phễu đảo lộn.
  - **Giải pháp xử lý**:
    - Đặt `"angle": 0` cho toàn bộ các cel của `eb637`, giữ cho thân lốc xoáy luôn đứng thẳng uy nghi từ mặt đất vươn lên bầu trời.
    - Duy trì chu kỳ xoay pattern 4 frame mượt mà để luồng gió cuộn xoáy nội bộ tự nhiên.
    - Thiết kế luồng gió chính (Lead Tornado) vươn cao lướt từ người thi triển sang đối thủ, kết hợp vệt gió phụ (Trailing Wave) đan xen lật gương (`mirror: true`, `opacity` mờ ảo) và bão lốc dội trùm lên mục tiêu tại frames 9–15.
- **Khắc phục triệt để lỗi hoạt ảnh chiêu Grass Knot (Grass Knot PRAS True Animation Parity)**:
  - **Hiện tượng**: Người dùng phản hồi kèm ảnh chụp _"grass_knot chiêu này có bị lỗi ko v"_. Có một dải tam giác màu xanh lá cây dài cắt ngang qua màn hình và người mục tiêu.
  - **Nguyên nhân gốc rễ**:
    - Kịch bản cũ sử dụng nhầm sprite `eb647_2` (kích thước 255×48, là tia năng lượng/beam cỏ kéo dài) và `eb647` (chấm hạt cỏ 20×20) thay vì nút thắt cỏ. Khi đặt tại tọa độ chân mục tiêu, tia sáng `eb647_2` chiếu một dải tam giác xanh dài dằng dặc cắt ngang chiến trường.
    - Trong dự án Pokemon Reunion vốn có sẵn bộ sprite nút thắt cỏ chính thống: `PRAS- Grass Knot.png` (960×192, 5 pattern 192×192) mô phỏng chính xác quá trình mầm cỏ nhú lên, vươn dài, bắt chéo và siết chặt nút thắt quanh chân mục tiêu.
  - **Giải pháp xử lý**:
    - Đăng ký `PRAS- Grass Knot` và `PRAS-GrassKnot` vào [animation-atlas.json](file:///e:/Pokemon/packages/game-data/animation-atlas.json) (5 columns, 1 row, cell 192×192).
    - Tái tạo toàn diện [6449.json](file:///e:/Pokemon/packages/game-data/animations/6449.json) và [last-chance/6449.json](file:///e:/Pokemon/packages/game-data/animations/last-chance/6449.json) với 16 frame chuẩn PRAS:
      - Frames 0–2: Mầm cỏ nhú lên từ chân mục tiêu (`pattern: 0`). Âm thanh: `EBDX/Anim/grass2.wav`.
      - Frames 3–5: Hai cọng cỏ vươn dài ôm lấy chân Pokémon (`pattern: 1`). Âm thanh: `Anim/Twine.ogg`.
      - Frames 6–7: Hai cọng cỏ xoắn lại bắt chéo (`pattern: 2`).
      - Frames 8–11: Thắt nút và siết chặt cực mạnh (`pattern: 3` & `4`, `zoom: 130 -> 115`, hạ thấp 3px tạo lực giật kéo ngã). Âm thanh: `Anim/Slam.ogg`, chớp flash xanh lá tác động `[46, 213, 115, 180]`, `flashScope: 1`.
      - Frames 12–15: Nút thắt giữ chặt rồi tản biến êm dịu (`opacity: 255 -> 0`).
- **Khắc phục đồ họa chuẩn chiêu Energy Ball (Energy Ball Authentic PRAS/Reunion Parity - ID 6764)**:
  - **Hiện tượng**: Người dùng phản hồi kèm ảnh chụp _"energy_ball đang dùng sai ảnh á Energy-Ball.png"_.
  - **Nguyên nhân gốc rễ**:
    - Chiêu `energy_ball` (ID 6764) trước đó dùng nhầm tài nguyên `eb600` của EBDX thay vì spritesheet chính thống `Energy-Ball.png` (248×59) của dự án Reunion gồm các quả cầu năng lượng và 7 khung hình vành đai lá xoay 3D.
  - **Giải pháp xử lý**:
    - Chuẩn hóa `Energy-Ball.png` thành tấm atlas lưới chuẩn 256×192 (4 cột × 3 hàng, cell 64×64), căn giữa hoàn hảo từng thành phần: Pattern 0 (hạt bụi năng lượng), Pattern 1–3 (các cấp độ quả cầu năng lượng xanh), Pattern 4–10 (7 góc xoay 3D của vành đai lá xoay quanh quả cầu), Pattern 11 (quả cầu bộc phát cực đại).
    - Đăng ký `Energy-Ball` vào [animation-atlas.json](file:///e:/Pokemon/packages/game-data/animation-atlas.json) và cập nhật [move-animations-db.json](file:///e:/Pokemon/packages/game-data/move-animations-db.json), [manifest.json](file:///e:/Pokemon/packages/game-data/animations/manifest.json) và [last-chance-animation-manifest.json](file:///e:/Pokemon/packages/game-data/last-chance-animation-manifest.json).
    - Tái tạo toàn diện kịch bản [6764.json](file:///e:/Pokemon/packages/game-data/animations/6764.json) và [last-chance/6764.json](file:///e:/Pokemon/packages/game-data/animations/last-chance/6764.json):
      - **Pha 1 (Frames 0–4)**: Tụ năng lượng tại tay người dùng, hạt bụi tụ lại và quả cầu lớn dần kèm vành đai lá bao bọc. Âm thanh: `EBDX/Anim/grass1.wav`.
      - **Pha 2 (Frames 5–10)**: Quả cầu bay vút sang mục tiêu (`focus: "both"`), vành đai lá xoay 3D tít mù nhịp nhàng quanh lõi quả cầu. Âm thanh: `Anim/gust.ogg`.
      - **Pha 3 (Frames 11–15)**: Quả cầu đập sầm vào mục tiêu, bộc nổ năng lượng thiên nhiên rực rỡ, hạt bụi tán xạ, rung lắc mục tiêu, chớp flash xanh lá `flashScope: 1`. Âm thanh: `Anim/superdamage.ogg`.
- **Tối ưu toàn diện 21 chiêu thức chữ H (21 H-Moves Complete 1:1 Reunion EBDX Parity)**:
  - **Danh sách 21 chiêu thức đã tối ưu**:
    1. `hail` (6151) - Mưa đá lạnh giá trút từ bầu trời (`weather`)
    2. `hammer_arm` (6457) - Búa tạ nện đập chấn động (`Hammer Arm`)
    3. `harden` (6152) - Cương hóa ánh kim cương phòng ngự (`anim sheet`)
    4. `head_smash` (6459) - Thiết đầu công vỡ đá chấn động (`Earth1`)
    5. `headbutt` (6153) - Cú húc đầu dũng mãnh (`003-Attack01`)
    6. `heal_bell` (6461) - Chuông ngân trị liệu âm vang thanh tẩy (`PRAS- Heal Bell`)
    7. `heal_pulse` (6463) - Sóng xung kích hào quang chữa lành (`efftest4`)
    8. `healing_wish` (6464) - Nguyện ước hy sinh trị liệu bừng sáng (`PRAS- Healing Wish`)
    9. `heat_wave` (6154) - Sóng nhiệt cuồng phong lửa đỏ rực (`Heat wave`)
    10. `hidden_power` (6471) - Sức mạnh tiềm ẩn luân chuyển các nguyên tố (`Divine_Smash`)
    11. `high_horsepower` (6723) - Chiến mã xung phong giẫm nát mặt đất (`PRAS- High Horse Power`)
    12. `highjumpkick` (157 / 6155) - Phi thiên cước nhảy vút và lao đạp nện đất (`Kick` & `PRAS-Strike`)
    13. `horn_attack` (6156) - Đâm húc bằng sừng sắc bén (`Cosmo-01`)
    14. `horn_drill` (6473) - Mũi khoan sừng xoáy xuyên phá (`Cosmo-01`)
    15. `horn_leech` (6474) - Sừng hút sinh lực mộc hệ (`PRAS- Horn Leech`)
    16. `howl` (6704) - Tiếng hú chiến binh tăng cường sĩ khí (`PRAS- Howl`)
    17. `hydro_pump` (6157) - Đại hồng thủy pháo cao áp (`PRAS- Hydro Pump`)
    18. `hyper_beam` (6476) - Siêu pháo năng lượng hủy diệt kinh thiên động địa (`PRAS- Hyper Beam`)
    19. `hyper_fang` (6158) - Răng nanh sắc bén khổng lồ (`PRAS- Hyper Fang`)
    20. `hyper_voice` (6477) - Sóng âm thanh siêu cấp dồn dập 3 đợt (`PRAS-Uproar`)
    21. `hypnosis` (6478) - Vòng xoáy thôi miên huyền ảo (`Hypnosis2`)
  - **Đồng bộ hóa hệ thống**:
    - Nâng tổng số chiêu thức tối ưu trong [reunion-moves.json](file:///e:/Pokemon/packages/game-data/reunion-moves.json) lên **162 chiêu thức chuẩn 1:1** (`optimizedMoves`).
    - Đăng ký đầy đủ các ID vào [move-animation-extensions.json](file:///e:/Pokemon/packages/game-data/move-animation-extensions.json), [manifest.json](file:///e:/Pokemon/packages/game-data/animations/manifest.json), [last-chance-animation-manifest.json](file:///e:/Pokemon/packages/game-data/last-chance-animation-manifest.json) và [animation-atlas.json](file:///e:/Pokemon/packages/game-data/animation-atlas.json).
- **Tối ưu toàn diện 13 chiêu thức chữ I (13 I-Moves Complete 1:1 Reunion EBDX Parity)**:
  - **Danh sách 13 chiêu thức đã tối ưu**:
    1. `ice_ball` (6159) - Cầu băng lăn tròn lớn dần nện sầm mục tiêu (`PRAS-Ice`)
    2. `ice_beam` (6479) - Tia băng giá cực hàn bắn xuyên chiến trường đóng băng đối thủ (`PRAS-Ice` + `PRAS- Ice BG`)
    3. `ice_fang` (6160) - Răng nanh băng giá cắn nghiến đóng băng (`PRAS-Elemental-Fangs`)
    4. `ice_punch` (6161) - Nắm đấm bọc băng tuyết đấm nện vỡ vụn (`punches`)
    5. `icicle_spear` (6162) - Giáo băng nhọn hoắt liên tiếp phóng xuyên phá (`PRAS-Icicle-Spear`)
    6. `icy_wind` (6167) - Gió bão băng tuyết lạnh giá quét trùm toàn màn hình (`Wind1` + `PRAS- Icy Wind BG`)
    7. `incinerate` (6481) - Thiêu rụi ngọn lửa bùng cháy dữ dội (`fire5`)
    8. `inferno` (6168) - Luyện ngục cột lửa bùng nổ bao trùm đối thủ (`Flames`)
    9. `infestation` (6705) - Trùng độc bọ cắn bám ríu rít vây hãm (`Aerial Ace`)
    10. `ingrain` (6482) - Rễ cây đâm sâu vào lòng đất hút dưỡng chất chữa lành (`PRAS-Ingrain`)
    11. `ion_deluge` (6735) - Mưa hạt ion điện từ bao phủ chiến trường (`PRAS- Ion Deluge FG` + `electric1`)
    12. `iron_head` (6169) - Thiết đầu công ánh kim thép húc mạnh mẽ (`PRAS-Iron-Head`)
    13. `iron_tail` (6483) - Thiết vĩ quất đuôi thép chém ngang chấn động (`PRAS-Iron-Tail`)
  - **Đồng bộ hóa hệ thống**:
    - Nâng tổng số chiêu thức tối ưu trong [reunion-moves.json](file:///e:/Pokemon/packages/game-data/reunion-moves.json) lên **175 chiêu thức chuẩn 1:1** (`optimizedMoves`).
    - Đăng ký đầy đủ các ID vào [move-animation-extensions.json](file:///e:/Pokemon/packages/game-data/move-animation-extensions.json), [manifest.json](file:///e:/Pokemon/packages/game-data/animations/manifest.json), [last-chance-animation-manifest.json](file:///e:/Pokemon/packages/game-data/last-chance-animation-manifest.json) và [animation-atlas.json](file:///e:/Pokemon/packages/game-data/animation-atlas.json).
- **Tối ưu toàn diện 18 chiêu thức nhóm J, K, L (18 J-K-L Moves Complete 1:1 Reunion EBDX Parity)**:
  - **Danh sách 18 chiêu thức đã tối ưu**:
    1. `jumpkick` (6170) - Cú nhảy đạp phi thân bổ xuống nện mục tiêu (`Kick` + `PRAS-Strike`)
    2. `karate_chop` (6171) - Đao thủ bổ thẳng góc đỉnh đầu dứt khoát (`PRAS-Strike`)
    3. `kinesis` (6172) - Chiếc thìa bạc uốn cong ma thuật tâm linh (`finger.spoon`)
    4. `last_resort` (6492) - Đòn quyết định tung toàn lực bùng nổ cực đại (`Last Resort`)
    5. `lava_plume` (6487) - Cột dung nham phún xuất khổng lồ phun trào từ lòng đất kèm phông nền rực lửa (`PRAS-Magma-Storm` + `PRAS- Fire BG` + `fire5`)
    6. `leaf_blade` (6173) - Lưỡi kiếm lá mộc hệ xanh rực rỡ chém ngang xé gió (`GEN8- Solar Blade` + `PRAS-Leaf-Tornado`)
    7. `leaf_storm` (6488) - Siêu bão lá đa tầng thuần chất 100% mộc hệ: lốc xoáy dẫn đường, 3 luồng mưa lá phi tiêu dày đặc, cột đại bão lốc xoáy khổng lồ và tán lá bùng nổ phân tán (`PRAS-Leaf-Tornado` Patterns 0..35)
    8. `leaf_tornado` (6489) - Lốc xoáy lá cây 4 giai đoạn thuần chất 100% mộc hệ: xoáy lá khởi tạo chân người dùng, lốc lao xuyên chiến trường, đại lốc xoáy nhấc bổng mục tiêu cùng 2 vòng lá quỹ đạo elip, và nổ tung tán lá bùng tỏa (`PRAS-Leaf-Tornado` Patterns 0..35)
    9. `leech_life` (6174) - Cắn hút sinh lực 3 giai đoạn: hàm răng nanh cắn ngập mục tiêu, dòng 3 luồng năng lượng sinh lực đỏ-vàng-ngọc tuôn trào truyền ngược về, và vòng sáng hấp thụ hồi phục HP (`PRAS-Bite` + `PRAS-Leech-Life`)
    10. `leechseed` (177/6175) - Hạt giống ký sinh: ném hạt giống bay bổng theo quỹ đạo parabol cắm vào chân địch, sau đó nảy mầm và mọc lên 3 mầm cây xanh xòe lá đung đưa quấn quanh mục tiêu (`PRAS-Leech-Seed`)
    11. `leer` (180/6178) - Ánh nhìn đe dọa 3 giai đoạn: trừng mắt phát sáng vàng kim đanh thép từ người dùng, tia nhìn đỏ cam phóng xé không trung, và ánh mắt đỏ rực in sâu đe dọa trực diện lên mặt đối thủ (`PRAS-Leer`)
    12. `lick` (6180) - Lưỡi dài hồng ma quái quẹt liếm làm tê liệt (`PRAS-Sketch-Lick` Cell 1)
    13. `light_screen` (6490/183/6181) - Bức tường lăng kính ánh sáng 3 giai đoạn: khởi tạo lăng kính khúc xạ ánh sáng trước mặt Pokémon, mở rộng che chắn phản chiếu chói lọi cùng các tinh thể sao lăng kính bắn tỏa và kết giới phát quang bảo vệ giảm 50% Special Damage (`PRAS-Light-Screen` + `Shiny`)
    14. `liquidation` (6714) - Đao nước áp lực cao 4 giai đoạn thuần chất Thủy hệ: vòng xoáy nước áp lực cao tụ quanh người thi triển, ngư lôi nước áp lực lao vụt, đại đao nước khổng lồ chém xé đối thủ và vụt nổ sóng nước bắn tóe xé nát phòng ngự (`Gen9- Aqua_Cutter` + `PRAS-Aqua-Jet` + `PRAS-Water`)
    15. `lock_on` (6182) - Hồng tâm điện tử xoay khóa chặt tầm ngắm (`PRAS-Lock-On`)
    16. `lovely_kiss` (6183) - Nụ hôn trái tim tình yêu ngọt ngào ru ngủ (`PRAS-Draining-Kiss`)
    17. `low_kick` (6184) - Cú quét trụ tầm thấp cẳng chân làm ngã nhào (`Kick` + `PRAS-Strike`)
    18. `lucky_chant` (187/6185) - Thánh ca may mắn 3 giai đoạn: quả cầu chuông ngọc may mắn thăng hoa tụng niệm, song luồng sao may mắn lấp lánh xoay vút lên trời và kết giới vòm cầu bảo hộ tâm linh giáng thế ngăn chặn Critical Hit (`PRAS-Lucky-Chant` + `Shiny` + `PRAS-Safeguard`)
  - **Triển khai toàn diện 7 chiêu thức chữ M (Batch 1 - Hoàn tất 100%)**:
    1. `mach_punch` (188/6186) - Cú đấm siêu thanh chuẩn 1:1 Reunion: nắm đấm Mach đỏ rực xuất hiện thần tốc ngay trước mặt mục tiêu, phóng to cực nhanh mô phỏng cú đấm tốc độ âm thanh điểm xuyết vết nứt chấn động và sóng xung kích bùng nổ rung màn hình (`punches` Pattern 5, 7 + `PRAS-Strike`)
    2. `magic_coat` (189/6187) - Áo choàng ma thuật lấp lánh phản hồi toàn diện: kết giới lăng kính đa sắc bao phủ quanh người thi triển và các tia sáng khúc xạ bắn tỏa phản hồi trạng thái (`PRAS-Magic-Coat` + `Shiny`)
    3. `magical_leaf` (6494/6188) - Lá ma thuật ngũ sắc không bao giờ trượt: tụ quả cầu lá ma thuật, phóng 2 luồng lá ngũ sắc xoay lượn quỹ đạo kép và bùng nở hoa lá ma thuật tại mục tiêu (`PRAS-Magical-Leaf`)
    4. `magnet_bomb` (6495/6189) - Bom từ tính điện trường: phóng quả bom nam châm theo đường cung parabol khóa mục tiêu và kích nổ từ trường điện từ dữ dội (`PRAS-Magnet-bomb`)
    5. `mean_look` (190/6190) - Ánh mắt ma quái khóa hồn: đôi mắt tím khổng lồ trừng trừng xuất hiện ngay trước mặt đối thủ, phát quang ma mị khóa chặt đào tẩu (`PRAS-Mean-Look`)
    6. `meditate` (6498/6191) - Thiền định nâng tầm tinh thần: cột hào quang năng lượng thanh tịnh dâng cao và các vòng hào quang halo tâm linh tỏa rộng quanh người thi triển (`PRAS-Stats`)
    7. `mega_drain` (191/6192/192/6190) - Hút cạn sinh lực đối thủ: bầy hạt xanh ngọc lục bảo bùng nổ quanh mục tiêu, 10 luồng hạt ngọc xanh lục cuồn cuộn bay về và xoáy hấp thụ hồi phục thể lực (`PRAS-Giga-Drain` tô màu ngọc lục bảo + đồng bộ hoàn hảo cả Player lẫn OppMove 192/6190)
  - **Triển khai toàn diện 7 chiêu thức chữ M (Đợt 2 - Hoàn tất 100%)**:
    8. `mega_kick` (194) - Cú đá siêu trọng lượng ngàn cân: bàn chân khổng lồ giáng xéo từ trên không làm nứt toác mặt đất và bùng nổ va chạm chấn động (`Kick` + `PRAS-Strike`)
    9. `mega_punch` (195/6193) - Cú đấm uy lực cực đại: nắm đấm quyền khí đỏ rực phóng to 260% nén áp lực không khí giáng sấm sét chấn động rung chuyển màn hình (`punches` Pattern 5, 7 + `PRAS-Strike`)
    10. `megahorn` (193/6191) - Đại sừng húc xuyên phá: phông nền chấn động địa chấn mở màn, chiếc sừng khổng lồ phát sáng lao vun vút húc xuyên phá mục tiêu (`PRAS-Megahorn` + `PRAS-Megahorn-BG` + `PRAS-Strike`)
    11. `memento` (6499) - Tinh linh hắc ám hiến tế: thân xác người thi triển phát sáng ma mị, phóng luồng vong linh oán hận màu tím đen bay ập sang bám riết lấy đối thủ phong tỏa chỉ số (`PRAS-Curse`)
    12. `metal_claw` (196/6194) - Móng vuốt hợp kim sắc bén: song trảo kim loại lóe sáng chém xé đối thủ theo đường chéo xé rách không khí kèm tia lửa thép (`PRAS-Dragon-Claw` + `PRAS-Strike`)
    13. `metal_sound` (6501) - Sóng âm kim loại chói tai: các vòng sóng âm kim loại đồng tâm lan tỏa liên hồi từ người thi triển bao trùm suy giảm chỉ số đối thủ (`PRAS-Metal-Sound`)
    14. `meteor_mash` (197/6195) - Cú đấm sao băng vũ trụ: tinh hoa ngân hà tụ hội trên bầu trời, quả cầu sao băng vũ trụ giáng đòn sấm sét nổ tung vào mục tiêu (`PRAS-Meteor-Mash` + `PRAS-Strike`)
  - **Đồng bộ hóa hệ thống**:
    - Nâng tổng số chiêu thức tối ưu trong [reunion-moves.json](file:///e:/Pokemon/packages/game-data/reunion-moves.json) lên **207 chiêu thức chuẩn 1:1** (`optimizedMoves`).
    - Đăng ký đầy đủ các ID vào [move-animation-extensions.json](file:///e:/Pokemon/packages/game-data/move-animation-extensions.json), [manifest.json](file:///e:/Pokemon/packages/game-data/animations/manifest.json), [last-chance-animation-manifest.json](file:///e:/Pokemon/packages/game-data/last-chance-animation-manifest.json) và [animation-atlas.json](file:///e:/Pokemon/packages/game-data/animation-atlas.json).
- **Kiểm định chất lượng**:
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS 100% (All 1237 animations and atlas assets validated with 0 errors)**.
  - `npm run typecheck:web`: **PASS (0 errors)**.
  - `npx vitest run`: **PASS 49/49 test files (603/603 unit tests)**.

---

## Cập nhật trước đó: 2026-10-14 (Khắc Phục Toàn Diện Hoạt Ảnh Chiêu Thức Fairy Wind - Ngọn Gió Tiên Tộc ID 6765 Chuẩn 1:1 EBDX)

### 1.31. Khắc Phục Toàn Diện Hoạt Ảnh Chiêu Thức Fairy Wind (Ngọn Gió Tiên Tộc - ID 6765):

- **Hiện tượng**:
  - Người dùng phản hồi: _"fairy_wind chiieu này cũng sai"_.
  - Chiêu thức chỉ có một chấm nhỏ bay qua màn hình rồi chớp trắng toàn màn hình làm chói mắt, mất kết nối texture và thiếu luồng bão gió tiên tộc.
- **Nguyên nhân gốc rễ**:
  1. **Tài nguyên bị thiếu 404 Not Found**:
     - Sprite cánh hoa tiên `eb611_2.png` và tinh thể gió `eb611_3.png` chỉ nằm ở `Graphics/Animations/` mà chưa được sao chép sang `apps/web/public/Graphics/Animations/`, dẫn tới lỗi không tải được ảnh.
  2. **Hoạt ảnh [6765.json](file:///e:/Pokemon/packages/game-data/animations/6765.json) cũ chỉ có 5 frame sơ sài**:
     - Chỉ có 1 cel duy nhất bay vèo qua màn hình trong 2 frame rồi đứng yên tại mục tiêu, đi kèm hiệu ứng `flashScope: 3` (`Color.white`) làm trắng xóa toàn bộ màn hình một cách khó chịu.
  3. **Mã nguồn EBDX gốc (`FAIRYWIND.rb`)**:
     - Kịch bản chuẩn EBDX tạo ra một dòng chảy cuồng phong tiên tộc liên tục gồm 128 hạt hoa tiên và bụi ma thuật (`eb611_2`), bắt đầu từ người dùng, uốn lượn hình sin bay qua chiến trường, sau đó tạo thành một lốc xoáy bao vây và làm rung giật mục tiêu.
- **Giải Pháp Thực Hiện**:
  1. **Đồng bộ hóa 100% tài nguyên đồ họa**:
     - Sao chép `eb611_2.png` (cánh hoa hồng đào) và `eb611_3.png` (tinh thể gió bạch kim) sang `apps/web/public/Graphics/Animations/` cùng `eb611.png` (bụi phấn tím).
  2. **Tái tạo kịch bản hoạt ảnh EBDX 1:1 ([6765.json](file:///e:/Pokemon/packages/game-data/animations/6765.json) & [last-chance/6765.json](file:///e:/Pokemon/packages/game-data/animations/last-chance/6765.json) - 16 frames, 20 FPS)**:
     - **Pha 1 (Frames 0–3, Tụ Lực Gió Tiên)**: Lốc xoáy 3 loại hạt cánh hoa hồng `eb611_2`, bụi phấn tím `eb611` và tinh thể gió `eb611_3` bắt đầu nở rộng xoay tròn quanh người thi triển (`focus: "user"`). Âm thanh: `Anim/Whirlwind`.
     - **Pha 2 (Frames 4–9, Dải Cuồng Phong Uốn Lượn Qua Chiến Trường)**: Dải sóng gió tiên tộc uốn lượn bay lướt từ người thi triển sang đối thủ với `focus: "both"` (tự động đảo chiều chuẩn xác cho cả Người chơi và Địch). Âm thanh: `Anim/Whirlwind`.
     - **Pha 3 (Frames 10–15, Lốc Xoáy Tiên Tộc Bao Vây Mục Tiêu)**: Các hạt xoay tít xung quanh mục tiêu (`focus: "target"`, bán kính `R = 30 -> 75`), mục tiêu rung giật mạnh (`shake: +4, -4, +3, -3...`) theo luồng gió, sau đó các cánh hoa nở tung tản mác êm dịu, loại bỏ hoàn toàn flash chói mắt. Âm thanh: `Anim/Silverwind`.
  3. **Đồng bộ siêu dữ liệu & Kiểm thử**:
     - [manifest.json](file:///e:/Pokemon/packages/game-data/animations/manifest.json) & [last-chance-animation-manifest.json](file:///e:/Pokemon/packages/game-data/last-chance-animation-manifest.json): Cập nhật ID `6765` thành `frameCount: 16`, `timingCount: 3`.
     - [move-animations-db.json](file:///e:/Pokemon/packages/game-data/move-animations-db.json): Đổi sang `graphic: "eb611_2.png"` và âm thanh `Anim/Whirlwind`, `Anim/Silverwind`.
     - [battle-timeline-animations.test.ts](file:///e:/Pokemon/apps/web/test/battle-timeline-animations.test.ts): Bổ sung unit test kiểm tra luồng gió bay cả 2 chiều `both` (>15 cels) và lốc xoáy quanh mục tiêu `target` (>20 cels).
- **Kiểm định chất lượng**:
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS (1175 assets & animations, 0 errors)**.
  - `npm run typecheck:web`: **PASS (0 errors)**.
  - `npx vitest run`: **PASS 49/49 test files (603/603 unit tests)**.

---

## Cập nhật lần cuối: 2026-10-14 (Khắc Phục Toàn Diện Hoạt Ảnh Chiêu Thức Eruption - Phun Trào Núi Lửa ID 99 Chuẩn 1:1 EBDX)

### 1.30. Khắc Phục Toàn Diện Hoạt Ảnh Chiêu Thức Eruption (Phun Trào Núi Lửa - ID 99):

- **Hiện tượng**:
  - Người dùng phản hồi: _"eruption tiếp thoe chiều này là các thiên thạch rới từ trên trời xuống địch hiện tại nó cứ chóp chóp ở địch lun điều chỉnh lại"_.
  - Chiêu thức chỉ có 6 frame nhấp nháy tĩnh ngay tại chỗ mục tiêu, hoàn toàn không có hiệu ứng thiên thạch và nham thạch rơi từ trên trời xuống.
- **Nguyên nhân gốc rễ**:
  1. **Hoạt ảnh [99.json](file:///e:/Pokemon/packages/game-data/animations/99.json) cũ sơ sài**:
     - Bản gốc `99.json` chỉ có vỏn vẹn 6 frame, trong đó sprite `eb642` và `eb642_2` chỉ nhấp nháy tại tọa độ tĩnh của mục tiêu (`x: 384, y: 96..110`).
  2. **Thiếu tài nguyên đồ họa trong thư mục public**:
     - Các sprite `eb642.png` (khối thiên thạch nham thạch 62×60), `eb642_2.png` (cột lửa/đuôi thiên thạch rực cháy 44×116) và `eb244_12.png` (tia lửa va chạm bộc phát 32×32) chỉ có ở `Graphics/Animations/` và bị thiếu trong `apps/web/public/Graphics/Animations/`.
  3. **Mã nguồn EBDX gốc (`ERUPTION.rb`)**:
     - EBDX thiết kế 3 pha rõ rệt: người dùng rung lắc thức tỉnh núi lửa, các cột nham thạch bắn lên không trung, sau đó hàng loạt thiên thạch rơi tự do từ trên cao (`targetSprite.y - 192` trên trời) lao thẳng xuống giáng mạnh vào mục tiêu kèm nổ tung đất đá.
- **Giải Pháp Thực Hiện**:
  1. **Đồng bộ hóa tài nguyên**:
     - Sao chép `eb642.png`, `eb642_2.png` và `eb244_12.png` vào thư mục `apps/web/public/Graphics/Animations/`.
  2. **Tái tạo kịch bản hoạt ảnh EBDX 1:1 ([99.json](file:///e:/Pokemon/packages/game-data/animations/99.json) - 18 frames, 20 FPS)**:
     - **Pha 1 (Frames 0–4, Núi Lửa Thức Tỉnh)**: Người thi triển rung lắc dữ dội (`focus: "user"`), giải phóng nhiệt năng, cột lửa `eb642_2` và các khối nham thạch `eb642` phóng vút ngược lên bầu trời (`y: 210 -> 160 -> 90 -> 20`). Âm thanh: `EBDX/Anim/fire2`.
     - **Pha 2 (Frames 5–13, Mưa Thiên Thạch Oanh Tạc Từ Trên Trời)**:
       - 4 đợt thiên thạch rực lửa `eb642` kèm đuôi lửa rực sáng `eb642_2` lao vun vút từ bầu trời (`y: -70` đến `-80` với `focus: "target"`) giáng ầm ầm xuống mục tiêu (`y: 96`):
         - Thiên thạch 1 (Frames 5–8): Rơi từ góc trái bầu trời `(350, -70)` đâm sầm xuống mục tiêu `(372, 96)`. Âm thanh: `EBDX/Anim/rock1`.
         - Thiên thạch 2 (Frames 7–10): Rơi từ góc phải `(410, -80)` đâm sầm xuống `(395, 96)`. Âm thanh: `EBDX/Anim/fire2`.
         - Thiên thạch 3 (Frames 9–12): Khối nham thạch lớn hơn rơi từ `(365, -70)` xuống tâm mục tiêu `(384, 96)`. Âm thanh: `EBDX/Anim/rock1`.
         - Thiên thạch 4 (Frames 10–13, Đòn kết liễu cực đại): Khối đá núi lửa khổng lồ giáng thẳng từ thiên đỉnh `(384, -75)` dội xuống mục tiêu `(384, 96)`.
     - **Pha 3 (Frames 14–17, Nổ Tung Nham Thạch & Chấn Động Diện Rộng)**:
       - Hai cột lửa khổng lồ `eb642_2` phun trào bùng lên từ mặt đất; 6 mảnh vụn thiên thạch `eb642` nổ tung tán xạ ra các góc theo hình cầu; tia lửa `eb244_12` rực sáng.
       - Mục tiêu rung giật mạnh liên tục (`shake: +5, -5, +4, -4...`). Âm thanh: `EBDX/Anim/fire2`.
  3. **Đồng bộ siêu dữ liệu & Kiểm thử**:
     - [manifest.json](file:///e:/Pokemon/packages/game-data/animations/manifest.json): Cập nhật ID `99` thành `frameCount: 18`, `timingCount: 5`.
     - [move-animations-db.json](file:///e:/Pokemon/packages/game-data/move-animations-db.json): Đổi sang `graphic: "eb642.png"` và các hiệu ứng âm thanh `EBDX/Anim/fire2`, `EBDX/Anim/rock1`.
     - [battle-timeline-animations.test.ts](file:///e:/Pokemon/apps/web/test/battle-timeline-animations.test.ts): Bổ sung unit test kiểm tra quỹ đạo thiên thạch rơi từ bầu trời (`y < 0` xuống `y >= 90`).
- **Kiểm định chất lượng**:
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS (1175 assets & animations, 0 errors)**.
  - `npm run typecheck:web`: **PASS (0 errors)**.
  - `npx vitest run`: **PASS 49/49 test files (602/602 unit tests)**.

---

## Cập nhật lần cuối: 2026-10-14 (Khắc Phục Lỗi Hoạt Ảnh Chiêu Thức Energy Ball Dùng Sai Ảnh Sprite - Chuẩn 1:1 EBDX ID 6764)

### 1.29. Khắc Phục Toàn Diện Lỗi Hoạt Ảnh Chiêu Thức Energy Ball (Quả Cầu Năng Lượng - ID 6764):

- **Hiện tượng**:
  - Người dùng phản hồi: _"energy_ball chiều này dùng sai ảnh"_.
  - Chiêu thức hiển thị hình con chim (`fly copy.png`) bay qua chiến trận thay vì quả cầu năng lượng diệp lục thiên nhiên.
- **Nguyên nhân gốc rễ**:
  1. **Ánh xạ ID và ghi đè lỗi thời**:
     - `energy_ball` bị gán ID `98` trong `move-animation-map.json`.
     - ID `98` có tệp nguồn gốc từ Gen 3 Essentials với đồ họa placeholder `fly copy.png` (sprite con chim).
     - Đồng thời, [animation-overrides.ts](file:///e:/Pokemon/apps/web/src/battle/animation/animation-overrides.ts) tạo hàm `createEnergyBallAnimationOverride()` hardcode 10 frame của `fly copy` bay ngang sân đấu.
  2. **Tài nguyên EBDX chuẩn bị thiếu**:
     - Mã nguồn EBDX gốc trong Reunion EX Trilogy 4.2 (`ENERGYBALL.rb`) sử dụng bộ 5 tài nguyên diệp lục đặc thù:
       - `eb600`: Vòng xoáy năng lượng xanh (128×128).
       - `eb600_1`: Hạt năng lượng diệp lục xoay quanh (24×24).
       - `eb600_2`: Tia năng lượng dồn về tâm (32×16).
       - `eb600_3`: Quả cầu năng lượng nén chặt phát sáng (92×92).
       - `eb600_4`: Mảnh năng lượng hoa lá bộc phá trên mục tiêu (52×52).
     - Cả 5 tệp trên chỉ nằm ở thư mục gốc `Graphics/Animations/` và bị thiếu trong `apps/web/public/Graphics/Animations/`.
- **Giải Pháp Thực Hiện**:
  1. **Đồng bộ hóa 100% tài nguyên đồ họa**:
     - Sao chép 5 tệp `eb600.png`, `eb600_1.png`, `eb600_2.png`, `eb600_3.png`, `eb600_4.png` sang `apps/web/public/Graphics/Animations/`.
  2. **Tái tạo kịch bản hoạt ảnh EBDX 1:1 ([6764.json](file:///e:/Pokemon/packages/game-data/animations/6764.json) - 17 frames, 20 FPS)**:
     - **Pha 1 (Frames 0–5, Tụ Lực Diệp Lục)**: Quả cầu `eb600` tụ lực quanh người thi triển (`focus: "user"`), tia năng lượng `eb600_2` và hạt diệp lục `eb600_1` xoay tròn nén dần vào tâm thành khối năng lượng đặc quánh `eb600_3`. Âm thanh: `Anim/Heal4`, `EBDX/Anim/grass2`.
     - **Pha 2 (Frames 6–10, Phóng Đạn Đạo)**: Quả cầu năng lượng `eb600_3` bọc trong hào quang `eb600` xoay tròn phóng thẳng qua chiến trường (`focus: "both"`), tự động thích ứng hoàn hảo cho cả Người chơi và Địch. Âm thanh: `EBDX/Anim/grass1`.
     - **Pha 3 (Frames 11–16, Bộc Phá Mục Tiêu)**: Quả cầu va chạm mục tiêu (`focus: "target"`), nổ tung thành 6 mảnh hoa lá diệp lục `eb600_4` tán xạ xung quanh, mục tiêu rung giật mạnh (`shake: +4, -4, +2, -2`). Âm thanh: `EBDX/Anim/grass1`.
  3. **Ánh xạ hệ thống chuẩn xác**:
     - Đổi `"energy_ball": 6764` trong [move-animation-map.json](file:///e:/Pokemon/packages/game-data/move-animation-map.json).
     - Bổ sung `"energy_ball": 6764` vào `replacedMoves` trong [move-animation-extensions.json](file:///e:/Pokemon/packages/game-data/move-animation-extensions.json).
     - Đăng ký metadata cho `6764` trong [manifest.json](file:///e:/Pokemon/packages/game-data/animations/manifest.json).
     - Cập nhật [move-animations-db.json](file:///e:/Pokemon/packages/game-data/move-animations-db.json) chỉ định `graphic: "eb600.png"` và các hiệu ứng âm thanh diệp lục.
- **Kiểm định chất lượng**:
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS (1175 assets & animations, 0 errors)**.
  - `npm run typecheck:web`: **PASS (0 errors)**.
  - `npx vitest run`: **PASS 49/49 test files (601/601 unit tests)**.

---

## Cập nhật lần cuối: 2026-10-13 (Khắc Phục Toàn Diện Lỗi Hoạt Ảnh Chiêu Thức Aeroblast ID 6750 Chuẩn 1:1 EBDX)

### 1.28. Khắc Phục Triệt Để Lỗi Hoạt Ảnh Chiêu Thức Aeroblast (Không Gian Bộc Phá - ID 6750):

- **Hiện tượng**:
  - Người dùng phản hồi: _"aeroblast chiêu này bị lỗi này"_.
  - Màn hình xuất hiện khung hình vuông xám khổng lồ bị xoay nghiêng che kín toàn bộ chiến trận, luồng gió bay sai vị trí và thiếu âm thanh.
- **Nguyên nhân gốc rễ (Qua trích xuất & đối chiếu trực tiếp mã nguồn Ruby EBDX gốc `AEROBLAST.rb` trong Reunion EX Trilogy 4.2)**:
  1. **Lỗi xoay phông nền tĩnh (`eb263_bg_4`)**:
     - Sprite `eb263_bg_4.png` là một tấm phông nền bầu trời bão xám mờ 512×384 pixel hoàn toàn đặc (alpha 255). Trong code EBDX gốc, nó là `ScrollingSprite` cuộn ngang tĩnh, tuyệt đối không bao giờ xoay góc.
     - Bản tạo trước đó lại gán `angle: 10, 20, 30... 130` cho tấm nền này, khiến một khối chữ nhật xám đặc khổng lồ bị xoay nghiêng che phủ toàn bộ sân đấu.
  2. **Lẫn lộn vai trò giữa lốc xoáy tụ lực và đạn đạo**:
     - Sprite `eb263.png` (326×326) trong EBDX gốc là `fp["cir"]` (vòng tròn lốc xoáy quanh cơ thể Lugia khi tụ lực) neo cố định tại `user` (`focus: "user"`).
     - Bản tạo trước lại biến `eb263` thành đạn bay qua màn hình, tạo thành một khối lốc xoáy to đùng bay chắn tầm nhìn.
     - Các lưỡi dao khí thật sự xé toạc không gian là `eb263_4` (166×134) và `eb263_3_4` (130×70).
  3. **Thiếu thư mục âm thanh `Audio/SE/Anim/` trong `apps/web/public`**:
     - Cả 3 tệp âm thanh `Anim/Wind8.ogg`, `Anim/HyperBeam.ogg`, `Anim/Comet Punch.ogg` có mặt trong `Audio/SE/Anim/` nhưng chưa được đồng bộ sang `apps/web/public/Audio/SE/Anim/`, dẫn đến lỗi 404 không phát được âm thanh trong trình duyệt.
- **Giải Pháp Chuẩn Xác Đã Khắc Phục**:
  1. **Đồng bộ hóa 100% tài nguyên âm thanh**:
     - Sao chép toàn bộ 347 tệp âm thanh SE từ `Audio/SE/` sang `apps/web/public/Audio/SE/` (bao gồm đầy đủ 225 tệp trong thư mục con `Anim/`).
  2. **Tái tác bản Hoạt ảnh Chuẩn Điện Ảnh 1:1 EBDX ([6750.json](file:///e:/Pokemon/packages/game-data/animations/last-chance/6750.json) - 16 frames, 20 FPS)**:
     - **Pha 1 (Tụ lực Thần Phong bão tố - Frames 0–4)**:
       - Phông nền bầu trời bão táp `eb263_bg_4` giữ góc xoay `angle: 0` tĩnh ở `priority: 0`, tăng mờ dần từ `opacity: 60 -> 180`.
       - Lốc xoáy phong ba `eb263` tụ lực cuộn xoay liên tục quanh cơ thể người thi triển (`focus: "user"`, `angle: 0 -> 45 -> 90...`) kết hợp các tia chớp khí `eb263_2`. Âm thanh: `Anim/HyperBeam`.
     - **Pha 2 (Bão tiễn khí động học xé rách không gian - Frames 5–9)**:
       - Các lưỡi dao không khí cực sắc bén `eb263_4` (Pattern 0) và mảnh khí cắt `eb263_3_4` chia làm 3 đợt liên thanh bắn vút qua chiến trường với `focus: "both"` (tự động đảo chiều và lật sprite chuẩn xác khi Địch tung chiêu). Âm thanh: `Anim/Wind8`.
     - **Pha 3 (Chấn động oanh kích & Nổ tung mục tiêu - Frames 10–15)**:
       - Hàng loạt nhát chém khí `eb263_4` và `eb263_3_4` nổ tung trên cơ thể mục tiêu (`focus: "target"`).
       - Mục tiêu rung giật dữ dội (`shake: +5, -5, +4, -4`). Âm thanh: `Anim/Comet Punch`.
       - Phông nền bão tan biến, sân đấu trở lại trạng thái bình thường.
- **Kiểm định chất lượng**:
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS (1134 assets, 0 errors)**.
  - `npm run typecheck:web`: **PASS (0 errors)**.
  - `npx vitest run`: **PASS 49/49 test files (601/601 unit tests)**.

---

## Cập nhật lần cuối: 2026-10-13 (Rà Soát & Sửa Toàn Bộ Chiêu Chữ A Đã Tối Ưu Bị Lỗi Địch Tung Chiêu)

### 1.27. Khắc Phục Triệt Để Lỗi Địch Tung Chiêu Cho Toàn Bộ Các Chiêu Thức Chữ A Đã Tinh Chỉnh:

- **Yêu cầu người dùng**:
  - _"tiếp theo kiểm tra các chiêu A chỉ kiểm tra các Animtion dc tối uu nhưng move khác ko bàn tới các chiêu A sau khi tinh chỉnh ko hỗ trợ địch tung chiêu bạn y như chiêu B mătx phải xem lại và sửa sai"_
- **Phạm vi kiểm toán (Đúng 15 chiêu thức chữ A đã tinh chỉnh tại mục 1.13)**:
  - `absorb` (23), `acrobatics` (27), `aeroblast` (6750), `air_slash` (6309, opp=6310), `ally_switch` (32), `ancientpower` (34), `aqua_jet` (6751), `aqua_ring` (35), `aqua_tail` (6313), `astonish` (6328), `attract` (6699), `aura_sphere` (6330), `aurora_beam` (37), `autotomize` (6331), `avalanche` (6332).
- **Kết quả rà soát chi tiết**:
  - **7 Chiêu Thức Hoạt Động Chuẩn Xác Từ Trước**:
    - `absorb` (23): Hút năng lượng bằng `focus: "both"` (từ target về user), hồi máu `focus: "user"`.
    - `acrobatics` (27): Nhát chém nhào lộn `focus: "target"`, phông nền tối `priority: 0, focus: "screen"`.
    - `aqua_ring` (35): Vòng nước bảo vệ quanh người `focus: "user"`.
    - `aqua_tail` (6313): Cú quất đuôi sóng nước trúng mục tiêu `focus: "target"`.
    - `astonish` (6328): Khuôn mặt dọa ma xuất hiện trên đầu mục tiêu `focus: "target"`.
    - `autotomize` (6331): Lớp giáp tinh giản lóe sáng trên người dùng `focus: "user"`.
    - `avalanche` (6332): Băng tuyết đổ ập xuống mục tiêu `focus: "target"`.
  - **7 Chiêu Thức Mắc Lỗi Địch Tung Chiêu Do Đạn Đạo Gắn Cờ `focus: "screen"`**:
    1. [6750.json](file:///e:/Pokemon/packages/game-data/animations/last-chance/6750.json) (**Aeroblast**): 18 cels đạn sóng gió `eb263_4`/`eb263` bị đặt `focus: "screen"`, bay từ người chơi sang địch.
    2. [32.json](file:///e:/Pokemon/packages/game-data/animations/32.json) (**Ally Switch**): 24 cels vòng dịch chuyển `eb645_3` bị đặt `focus: "screen"`.
    3. [34.json](file:///e:/Pokemon/packages/game-data/animations/34.json) (**Ancient Power**): 9 cels đá cổ đại `eb504_3` nhấc bổng và phóng bị đặt `focus: "screen"`.
    4. [6751.json](file:///e:/Pokemon/packages/game-data/animations/last-chance/6751.json) (**Aqua Jet**): 16 cels luồng nước lao vút `eb618_2` bị đặt `focus: "screen"`.
    5. [6699.json](file:///e:/Pokemon/packages/game-data/animations/last-chance/6699.json) (**Attract**): 24 cels trái tim mê hoặc `eb636_2` bị đặt `focus: "screen"`.
    6. [6330.json](file:///e:/Pokemon/packages/game-data/animations/last-chance/6330.json) (**Aura Sphere**): 8 cels cầu năng lượng ba động `eb093` bị đặt `focus: "screen"`.
    7. [37.json](file:///e:/Pokemon/packages/game-data/animations/37.json) (**Aurora Beam**): 36 cels chùm tia laser cực quang `eb246` bị đặt `focus: "screen"`.
  - **1 Chiêu Thức Mắc Lỗi Ánh Xạ Đối Thủ Lỗi Thời**:
    - `air_slash`: `move-animation-extensions.json` có ánh xạ `opponentMoves.air_slash = 6310` (bản PRAS cũ 5 frame, dùng `Aerial Ace.png` và `focus: "screen"`), che lấp bản 10 frame EBDX `6309` chuẩn `focus: "target"`.
- **Giải Pháp Toàn Diện Đã Thực Hiện**:
  1. **Tái tác bản & Chuyển đổi toàn bộ đạn đạo sang `focus: "both"` & `focus: "target"`**:
     - `aeroblast` (6750): Luồng gió xoáy xé toạc không gian chuyển sang `focus: "both"`, bổ sung nổ chấn động mục tiêu `focus: "target"`.
     - `ally_switch` (32): Cả hai vòng dịch chuyển đối xứng chuyển sang `focus: "both"`, giao nhau hoàn hảo ở giữa sân cho cả hai bên.
     - `ancientpower` (34): Khối đá cổ đại bay theo quỹ đạo vòng cung bằng `focus: "both"`, `curve: "arc"`; nổ vụn đá trúng mục tiêu `focus: "target"`.
     - `aqua_jet` (6751): Luồng nước phóng thẳng từ người thi triển sang nạn nhân bằng `focus: "both"`; va chạm sóng nước bằng `focus: "target"`.
     - `attract` (6699): Mưa tim dập dờn bay bằng `focus: "both"`, `curve: "arc"`; trái tim rung rinh bao bọc nạn nhân bằng `focus: "target"`.
     - `aura_sphere` (6330): Tụ lực tại người thi triển `focus: "user"`; cầu năng lượng phóng xuyên suốt bằng `focus: "both"`; sóng nổ ba động bằng `focus: "target"`.
     - `aurora_beam` (37): 3 luồng xung laser cực quang ngũ sắc phóng nối đuôi nhau bằng `focus: "both"`; tia lấp lánh điểm nổ bằng `focus: "target"`.
  2. **Loại bỏ ánh xạ lỗi thời**:
     - Xóa `"air_slash": 6310` khỏi `opponentMoves` trong `move-animation-extensions.json`, đưa chiêu Air Slash của địch về chạy trọn vẹn bản EBDX 10 frame `6309` chém trúng người chơi.
- **Kiểm định chất lượng**:
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS (1134 assets, 0 errors)**.
  - `npm run typecheck:web`: **PASS (0 errors)**.
  - `npx vitest run`: **PASS 49/49 test files (601/601 unit tests)**.

---

## Cập nhật lần cuối: 2026-10-13 (Rà Soát Tổng Thể Chiêu Chữ B & Khắc Phục Lỗi Hoạt Ảnh Bị Ghim Ở Địch Tung Chiêu)

### 1.26. Rà Soát Tổng Thể Toàn Bộ Chiêu Thức Chữ B & Khắc Phục Lỗi Địch Tung Chiêu Bị Ghim Hoạt Ảnh:

- **Yêu cầu người dùng**:
  - _"thực hiện ra sót tổng thế sử thiếu số các chiêu có Chữ B ở thời điểm hiện tại, thêm 1 lỗi cực lớn là có cài chiêu ko hồ trợ địch tung chiêu dùng ng tung chiêu là địch như animation vẫn gim ở địch tung chiêu"_
- **Kết quả Rà Soát Tổng Thể 59 Chiêu Chữ B trong Cơ Sở Dữ Liệu (`moves-db.json`)**:
  1. **35 Chiêu Đã Được Ánh Xạ Hoạt Ảnh Định Nghĩa Trực Tiếp**:
     - **15 Chiêu Nhóm Essentials (`move-animation-map.json`)**:
       - `barrier` (38), `beat_up` (39), `bind` (45), `bite` (47), `blast_burn` (48), `block` (49), `blue_flare` (50), `body_slam` (51), `brick_break` (52), `bubble` (53), `bubble_beam` / `bubblebeam` (54), `bulk_up` (55), `bullet_punch` (56), `bullet_seed` (57).
     - **20 Chiêu Nhóm Last Chance Pack (`move-animation-extensions.json`)**:
       - `baby_doll_eyes` (6728), `baneful_bunker` (6713), `baton_pass` (6333, opp=6334), `beak_blast` (6715), `belch` (6729), `belly_drum` (6335), `bestow` (6336), `bide` (6337), `blaze_kick` (6339), `blizzard` (6340), `bolt_strike` (6341), `bone_club` (6342), `bone_rush` (6343), `bonemerang` (6349), `boomburst` (6400), `bounce` (6352), `brave_bird` (6752), `brine` (6356), `bug_bite` (6357), `bug_buzz` (6358).
  2. **24 Chiêu Thế Hệ Mới (Gen 7/8/9, Z-Move, Let's Go) Chưa Có Hoạt Ảnh Chuyên Biệt**:
     - `baddy_bad`, `barb_barrage`, `barrage`, `behemoth_bash`, `behemoth_blade`, `bitter_blade`, `bitter_malice`, `black_hole_eclipse`, `blazing_torque`, `bleakwind_storm`, `blood_moon`, `bloom_doom`, `body_press`, `bolt_beak`, `bouncy_bubble`, `branch_poke`, `breaking_swipe`, `breakneck_blitz`, `brutal_swing`, `bulldoze`, `burn_up`, `burning_bulwark`, `burning_jealousy`, `buzzy_buzz`.
     - Các chiêu này tự động kích hoạt hệ thống cơ chế Fallback tiêu chuẩn theo Type & Category (ví dụ Ground Physical, Steel Physical, Fire Special) trong `animation-fallbacks.json`.
- **Nguyên Nhân Gốc Rễ Lỗi Địch Tung Chiêu Hoạt Ảnh Vẫn Ghim Ở Địch**:
  1. **Khái niệm `focus: "screen"` triệt tiêu động học toạ độ**:
     - `CoordinateTransformer.resolveCelPosition`:
       - `focus: "both"` nội suy mượt mà giữa `userPos` và `targetPos`. Khi Người chơi đánh: từ Người chơi (128, 224) -> Địch (384, 96). Khi Địch đánh: từ Địch (384, 96) -> Người chơi (128, 224). Hoạt động hoàn hảo!
       - `focus: "target"` neo chính xác vào mục tiêu bị đánh (khi địch dùng, mục tiêu là Người chơi).
       - `focus: "user"` neo chính xác vào người thi triển (khi địch dùng, neo vào Địch).
       - Nhưng `focus: "screen"` thì tuyệt đối **không sử dụng** `userPos` hay `targetPos`! Nó chỉ tính `x = celX, y = celY` tĩnh trên viewport.
  2. **Các chiêu đạn đạo/va chạm bị tạo nhầm `focus: "screen"`**:
     - Trong các tệp hoạt ảnh như `bubble` (53), `bubblebeam` (54), `bullet_seed` (57), `belch` (6729), `bone_rush` (6343), `brave_bird` (6752), `brine` (6356), `blast_burn` (48), `blue_flare` (50):
     - Các hạt đạn đạo được tạo với toạ độ tĩnh `128 -> 384` nhưng lại gắn cờ `focus: "screen"`.
     - Kết quả: Khi Địch tung chiêu, đạn vẫn bay từ Người chơi (128) sang Địch (384) và nổ tung trên đầu Địch, khiến Địch tự đánh chính mình, hoặc cột lửa Blue Flare rơi thẳng xuống đầu Địch!
  3. **Lỗi đối xứng Y trong Engine (`animation-player.ts` & `animation-gallery.ts`)**:
     - Logic `cel.mirrorPositionOnEnemy` trước đó chỉ lật trục X (`512 - x`) mà bỏ quên trục Y (`320 - y`), khiến sprite bị lệch xuống góc dưới bên phải thay vì đối xứng qua trục đường chéo chiến trận.
  4. **Ánh xạ đối thủ cũ `boomburst: 6401`**:
     - `move-animation-extensions.json` chứa ánh xạ đối thủ `6401` của bộ PRAS cũ (8 frame thô sơ) ghi đè lên bộ EBDX 16 frame chuẩn điện ảnh `6400`.
- **Giải Pháp Toàn Diện Đã Thực Hiện**:
  1. **Tái tác bản toàn diện 9 chiêu thức bị lỗi sang chuẩn `focus: "both"` & `focus: "target"`**:
     - [53.json](file:///e:/Pokemon/packages/game-data/animations/53.json) (**Bubble**): Bóng nước `eb618` bay bằng `focus: "both"`, `curve: "arc"`; nổ bọt `eb618_3`/`eb618_4` trên mục tiêu bằng `focus: "target"`.
     - [54.json](file:///e:/Pokemon/packages/game-data/animations/54.json) (**Bubblebeam**): Luồng tia bóng nước áp lực cao `eb618_2` bắn bằng `focus: "both"`; va chạm `eb618_3` bằng `focus: "target"`.
     - [57.json](file:///e:/Pokemon/packages/game-data/animations/57.json) (**Bullet Seed**): Loạt hạt giống liên thanh `eb223`/`eb223_2`/`eb223_3` bằng `focus: "both"`; nổ bụi hạt bằng `focus: "target"`.
     - [6729.json](file:///e:/Pokemon/packages/game-data/animations/last-chance/6729.json) (**Belch**): Khói ợ độc nở ở miệng bằng `focus: "user"`; luồng khí độc tràn sang bằng `focus: "both"`; đám mây độc bao vây nghẹt thở bằng `focus: "target"`.
     - [6343.json](file:///e:/Pokemon/packages/game-data/animations/last-chance/6343.json) (**Bone Rush**): Khúc xương quay tít `eb623` phóng vút bằng `focus: "both"`, `curve: "arc"`; đập liên tiếp bằng `focus: "target"`.
     - [6752.json](file:///e:/Pokemon/packages/game-data/animations/last-chance/6752.json) (**Brave Bird**): Đại bàng lửa `eb628` lao vụt bằng `focus: "both"`; cú va đập kinh hoàng `eb628_2` bằng `focus: "target"`.
     - [6356.json](file:///e:/Pokemon/packages/game-data/animations/last-chance/6356.json) (**Brine**): Cột sóng thủy triều `eb536` bằng `focus: "both"`, `curve: "arc"`; mạch nước ngầm phụt lên bằng `focus: "target"`.
     - [48.json](file:///e:/Pokemon/packages/game-data/animations/48.json) (**Blast Burn**): Quả cầu lửa tụ lực bằng `focus: "user"`; hỏa cầu phóng bằng `focus: "both"`; cột lửa hủy diệt `eb638_2` bằng `focus: "target"`.
     - [50.json](file:///e:/Pokemon/packages/game-data/animations/50.json) (**Blue Flare**): Ngọn lửa xanh tụ quanh người bằng `focus: "user"`; luồng lửa xanh từ trên trời giáng xuống đỉnh đầu mục tiêu bằng `focus: "target"`.
  2. **Nâng cấp đối xứng Engine 2D**:
     - Sửa [animation-player.ts](file:///e:/Pokemon/apps/web/src/battle/animation/animation-player.ts) và [animation-gallery.ts](file:///e:/Pokemon/apps/web/src/battle/animation/animation-gallery.ts) để khi `mirrorPositionOnEnemy` kích hoạt, cả X (`512 - x`) và Y (`320 - y`) đều được xoay đối xứng hoàn hảo dọc theo trục chiến đấu giữa Người chơi và Địch.
  3. **Loại bỏ ánh xạ lỗi thời**:
     - Gỡ bỏ `"boomburst": 6401` khỏi `opponentMoves` trong [move-animation-extensions.json](file:///e:/Pokemon/packages/game-data/move-animation-extensions.json), giúp Địch tung Boomburst sử dụng trọn vẹn bản 16 frame EBDX `6400` nổ sóng âm thẳng vào người chơi.
- **Kiểm định chất lượng**:
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS (1134 assets, 0 errors)**.
  - `npm run typecheck:web`: **PASS (0 errors)**.
  - `npx vitest run`: **PASS 49/49 test files (601/601 unit tests)**.

---

## Cập nhật lần cuối: 2026-10-13 (Khắc Phục Lỗi Hiển Thị Chiêu Thức Bolt Strike ID 6341)

### 1.25. Khắc Phục Lỗi Hiển Thị Chiêu Thức Bolt Strike (Sét Đánh Trời Giáng - ID 6341):

- **Hiện tượng**:
  - Người dùng phản hồi: _"bolt_strike xem lại chiêu này nhé"_.
  - Khi thi triển Bolt Strike, màn hình xuất hiện một khung hình khổng lồ bao trùm toàn bộ Pokémon (tương tự như lỗi của Blast Burn) do sprite sóng xung kích điện bị kéo dãn quá cỡ và đứng bất động suốt thời lượng chiêu.
- **Nguyên nhân gốc rễ**:
  1. **Khai báo sai kích thước cell trong atlas (`eb081_3`)**:
     - Sprite sóng xung kích `eb081_3.png` có kích thước 968×488 pixel gồm 2 frame (vòng xung kích ngoài và lõi nổ điện trong, mỗi frame 484×488).
     - Trong `packages/game-data/animation-atlas.json`, sprite bị khai báo sai thành `cellWidth: 968`, khiến kích thước khi hiển thị với `zoom: 130` phình to lên tới 1258 pixel, che kín toàn bộ màn hình.
  2. **Hoạt ảnh bị tĩnh hóa và thiếu các pha đòn đánh**:
     - Bản tạo trước đó chỉ đặt sprite `eb081_3` đứng yên suốt 12 frames tại `(384, 96)` mà không có luồng phóng sét `eb064`, không có hạt điện `eb081`, không có tia chớp phát tán `eb064_2`, và không có chuyển động tụ lực ở người dùng.
- **Giải Pháp Chuẩn Xác Đã Khắc Phục**:
  1. **Chuẩn hóa Atlas cho `eb081_3`**:
     - Sửa thành `cellWidth: 484, cellHeight: 488, columns: 2, maxPattern: 2` trong `packages/game-data/animation-atlas.json` (vừa sửa lỗi cho Bolt Strike vừa sửa lỗi cho Electric Terrain ID 6761).
  2. **Tái tác bản Hoạt ảnh Chuẩn Điện Ảnh EBDX ([6341.json](file:///e:/Pokemon/packages/game-data/animations/last-chance/6341.json) - 16 frames, 20 FPS)**:
     - **Pha 1 (Tụ lực điện trường - Frames 0–4)**: Tại người dùng `(128, 224)`: 4 quả cầu plasma `eb081` xoáy tròn thu hẹp dần bán kính tụ về cơ thể kèm tia sét `eb064_2` nổ lách tách. Âm thanh: `Anim/Paralyze1`.
     - **Pha 2 (Bão sét & Cú nện trời giáng - Frames 5–10)**:
       - Phông nền bầu trời sấm sét `eb064_bg` bao trùm toàn màn hình ở `priority: 0`.
       - Luồng sét đánh váng đầu `eb064` (386×136) giáng thẳng từ trên cao xuống đầu mục tiêu `(384, 96)`.
       - Vòng xung kích điện `eb081_3` (Pattern 0) và lõi nổ (Pattern 1) nở bung tỏa tròn từ `zoom: 50 -> 130`.
       - 8 tia chớp `eb064_2` phát nổ bung tỏa đều hướng từ tâm mục tiêu kèm hiệu ứng rung giật dữ dội (`shake: +6, -6, +4, -3`).
       - Âm thanh phối hợp cực mạnh: `Anim/Thunder3` (tiếng sấm rền giáng mạnh) kết hợp `Anim/Slam` (cú va đập vật lý cực lớn).
     - **Pha 3 (Tàn dư điện trường - Frames 11–15)**: Các hạt điện plasma `eb081` tản mác mờ dần, bầu trời quang đãng trở lại.
- **Kiểm định**:
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS (1134 assets, 0 errors)**.
  - `npm run typecheck:web`: **PASS (0 errors)**.
  - `npx vitest run`: **PASS 49/49 test files (601/601 unit tests)**.

---

### 1.24. Khắc Phục Lỗi Hiển Thị Chiêu Thức Block (Chặn Đường - ID 49):

- **Hiện tượng**:
  - Người dùng phản hồi: _"block chiêu này nữa"_.
  - Khi thi triển Block, chiêu thức chỉ hiển thị một hình ảnh tĩnh nằm ngang đơ trên đầu mục tiêu suốt nửa giây rồi biến mất, không có hai gọng kìm rào chắn ập vào, không có rung lắc đối thủ.
- **Nguyên nhân gốc rễ**:
  1. **Thiếu cơ chế kẹp hai gọng rào chắn đối xứng**:
     - Trong code EBDX gốc của tác giả Luka S.J., Block sử dụng 2 sprite `eb028_5` đối xứng: gọng trái `wrap1` góc xoay `-90°` và gọng phải `wrap2` góc xoay `+90°` (`mirror: true`).
     - Bản tạo trước đó chỉ gán đúng 1 cel đơn độc với góc quay `angle: 0` (thanh nằm ngang) đứng bất động tại `(384, 96)` trong 10 frame, thiếu hoàn toàn chuyển động kẹp vào từ hai phía.
  2. **Thiếu phản hồi rung lắc đối thủ khi bị khóa chặt**:
     - Code gốc có hiệu ứng rung lắc đối thủ `shake = 4 / -4` khi hai gọng kẹp sập vào để biểu thị mục tiêu vùng vẫy nhưng bị khóa chặt không thể trốn chạy.
- **Giải Pháp Chuẩn Xác Đã Khắc Phục**:
  1. **Đồng bộ tài nguyên**: Đảm bảo `eb028_5.png` có mặt đầy đủ ở cả `Graphics/Animations/` và `apps/web/public/Graphics/Animations/`.
  2. **Tái tác bản Hoạt ảnh Chuẩn Điện Ảnh EBDX ([49.json](file:///e:/Pokemon/packages/game-data/animations/49.json) - 16 frames, 20 FPS)**:
     - **Pha tiếp cận (Frames 0–4)**: Hai gọng kìm rào chắn sắt `eb028_5` từ hai bên trái (`angle: -90°`) và phải (`angle: 90°`, `mirror: true`) lao nhanh vào tâm mục tiêu (`opacity: 60 -> 255`).
     - **Pha sập kìm khóa chặt (Frame 5)**: Hai gọng rào chắn sập khép kín (`zoom: 150`), phát âm thanh `Anim/Wrap` đanh thép kèm khói bụi va chạm `ebDustParticle` bung ra ở chân mục tiêu.
     - **Pha khóa cứng & Vùng vẫy (Frames 6–10)**: Rào chắn giữ chặt mục tiêu, đối thủ rung giật liên tục (`shake: +4, -4, +3, -3, +2, -1`) thể hiện sự bất lực không thể tẩu thoát.
     - **Pha tan dần (Frames 11–15)**: Rào chắn mờ dần nhường lại sàn đấu với trạng thái bị khóa đường chạy hoàn tất.
- **Kiểm định**:
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS (1134 assets, 0 errors)**.
  - `npm run typecheck:web`: **PASS (0 errors)**.
  - `npx vitest run`: **PASS 49/49 test files (601/601 unit tests)**.

---

### 1.23. Khắc Phục Lỗi Hiển Thị Chiêu Thức Blizzard (ID 6340):

- **Hiện tượng**:
  - Người dùng phản hồi: _"blizzard chiêu này cũng v"_.
  - Khi thi triển Blizzard, chiêu thức bị lỗi hiển thị phông nền (404 Not Found), tinh thể băng đứng đơ dạng cụm tĩnh không bay cuộn trào tuyết lốc, tạo cảm giác bị lỗi giống như Blast Burn.
- **Nguyên nhân gốc rễ**:
  1. **Thiếu tài nguyên phông nền trên đĩa (`eb616_bg.png`)**:
     - Hoạt ảnh `6340.json` gọi sprite `eb616_bg` (phông nền bão tuyết 512x384 của Luka S.J. trong EBDX), nhưng file này chưa từng được sao chép vào `Graphics/Animations/` hay `apps/web/public/Graphics/Animations/`.
     - File cũng chưa từng được đăng ký trong `packages/game-data/animation-atlas.json`. Khi trình duyệt gọi `loadImage('eb616_bg')`, server trả về 404. Nếu tải được, cel renderer cũng sẽ cắt sai thành ô 192x192 do thiếu thông số atlas.
  2. **Quỹ đạo tinh thể băng bị tĩnh hóa**:
     - Bản tạo trước đó chỉ đặt 3 tinh thể `eb611_3` cố định quanh mục tiêu `(384, 96)` với độ dịch chuyển vỏn vẹn 10px suốt 14 frames, thay vì mô phỏng luồng bão tuyết 128 mảnh băng quét từ User sang Target như code gốc của tác giả.
- **Giải Pháp Chuẩn Xác Đã Khắc Phục**:
  1. **Sao Chép & Đăng Ký Tài Nguyên Chuẩn EBDX**:
     - Sao chép `eb616_bg.png` (512x384), `eb611.png` (16x12) và `eb263_bg_4.png` (512x384) từ bản gốc Reunion sang cả `Graphics/Animations/` và `apps/web/public/Graphics/Animations/`.
     - Đăng ký đầy đủ kích thước cell (512x384) vào `packages/game-data/animation-atlas.json`.
  2. **Tái Tác Bản Hoạt Ảnh Chuẩn EBDX (16 frames, 20 FPS)**:
     - **Phông nền bão tuyết `eb616_bg`**: Đặt chuẩn tâm `(256, 192)` ở `focus: "screen"` với `priority: 0` (sau lưng Pokémon), điều tiết opacity mượt mà từ 60 -> 235 (đỉnh bão tuyết) -> 0 (tan dần).
     - **Bão tinh thể băng quét chéo (24 mảnh băng `eb611_3` & `eb611_2`)**: 3 đợt bão tuyết phóng dồn dập với vận tốc cao từ User `(128, 224)` dọc theo `focus: "both"` (`curve: "arc"`) quét xuyên qua Target `(384, 96)` kèm góc xoay và độ phân tán ngẫu nhiên chuẩn tự nhiên.
     - **Va chạm vỡ vụn tại mục tiêu (16 mảnh vỡ `focus: "target"`)**: Nổ tung tỏa đều hướng với góc xoay ngẫu nhiên từ tâm mục tiêu kèm hiệu ứng rung lắc Pokémon đối thủ (`shake = 4 / -4`) chuẩn EBDX.
     - **Âm thanh chân thực**: `Anim/Wind8` (tiếng gió rít cuồng phong) phối hợp cùng `Anim/Ice7` (tiếng đóng băng và nổ vỡ vụn băng tuyết) đúng nhịp đòn đánh.
- **Kiểm định**:
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS (1134 assets, 0 errors)**.
  - `npm run typecheck:web`: **PASS (0 errors)**.
  - `npx vitest run`: **PASS 49/49 test files (601/601 unit tests)**.

---

### 1.22. Khắc Phục Lỗi Hiển Thị Chiêu Thức Blast Burn (ID 48):

- **Hiện tượng**:
  - Người dùng phản hồi: _"blast_burn chiêu này bị lỗi này bạn xem lại"_.
  - Khi thi triển Blast Burn, màn hình bị một hình chữ nhật khổng lồ xoay nghiêng che lấp toàn bộ Pokémon và sàn đấu.
- **Nguyên nhân gốc rễ**:
  - `eb638_bg` là ảnh nền toàn màn hình 512x384 pixel (`ScrollingSprite` trong EBDX của Luka S.J.).
  - Khi tác tạo hoạt ảnh, sprite này bị gán nhầm vào cel có `focus: "target"` và góc xoay `angle: f * 10` tại tọa độ `(384, 96)` với độ phóng đại 120%.
  - Hậu quả: Một khung ảnh 600px bị xoay nghiêng tâm ngay trên đầu đối thủ, làm che lấp toàn bộ sàn đấu và giao diện chiến đấu.
  - Đồng thời, sprite ngọn lửa và cột lửa thật sự của đòn đánh (`eb638` và `eb638_2`) lại không được hiển thị.
- **Giải Pháp Chuẩn Xác Đã Khắc Phục**:
  1. **Định Vị Đúng Phông Nền**:
     - `eb638_bg` chỉ được dùng làm phông nền toàn cảnh với `focus: "screen"`, tọa độ chuẩn `(256, 144)`, góc quay `angle: 0`, fade-in/fade-out êm ái ở `priority: 0`.
  2. **Pha 1 (Tụ Lực Lửa Đỏ - Frames 0–3)**:
     - Tại người dùng `(128, 224)`: Ngọn lửa địa ngục `eb638` xoay tụ và phình to dần (`zoom: 70 -> 115`).
     - SE: `Anim/Fire5`.
  3. **Pha 2 (Luồng Hỏa Long Lao Sang Mục Tiêu - Frames 4–7)**:
     - Luồng lửa `eb638` lao xiên chéo bám theo quỹ đạo bay từ User sang Target với ngọn lửa phụ bám đuôi.
     - SE: `Anim/Fire2`.
  4. **Pha 3 (Cột Lửa Địa Ngục Phun Trào - Frames 8–13)**:
     - Tại mục tiêu `(384, 96)`: Cột lửa khổng lồ `eb638_2` (kích thước 128x156) phun trào dữ dội từ chân mục tiêu lên cao kết hợp khối nổ `eb638`.
     - SE: `Anim/Fire3`.
- **Kiểm định**:
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS (1134 assets, 0 errors)**.
  - `npm run typecheck:web`: **PASS (0 errors)**.
  - `npx vitest run`: **PASS 49/49 test files (601/601 unit tests)**.

---



- **Hiện tượng**:
  - Người dùng báo cáo: _"có lỗi âm thanh lúc đầu nghe đc nhưng lúc sau chả nghe"_.
  - Khi mới vào trận đấu hoặc xem chiêu thức, âm thanh phát bình thường; nhưng sau vài chiêu thức hoặc vài lần lặp, toàn bộ âm thanh bị câm bặt (silenced) hoàn toàn.
- **Nguyên nhân gốc rễ (Deep Root Cause)**:
  1. **Thảm họa Cascading Error Storm khi giải phóng âm thanh**:
     - Khi `this.activeSounds.size >= MAX_CONCURRENT_SOUNDS (8)` hoặc khi `stopAll()` được gọi, hàm tiến hành dừng âm thanh cũ nhất: `oldest.pause(); oldest.currentTime = 0; oldest.src = '';`.
     - Trong các trình duyệt Chromium / WebKit, việc gán `src = ''` vào một `<audio>` element đang hoạt động **lập tức kích hoạt sự kiện `error`**.
     - Do listener `onError` chưa được tháo gỡ (unhook) trước khi reset `src`, hàm `onError` bị kích hoạt giả.
     - Trong `onError`, code tự động gọi `this.playSound(alternativePath)` để thử định dạng khác (`.wav` <-> `.ogg`).
     - Cuộc gọi mới này lại đẩy kích thước `activeSounds` vượt quá trần, làm kích hoạt `oldest.src = ''` của audio tiếp theo!
     - Một chuỗi phản ứng dây chuyền xảy ra, liên tục tạo mới và hủy hàng chục `<audio>` trong vài phần trăm giây.
  2. **Vòng lặp thử lại vô hạn (Infinite Retry Ping-Pong)**:
     - Khi một file không tồn tại (404), `foo.ogg` gọi `foo.wav`. Trong hàm gọi mới, cờ `hasRetried` lại được khởi tạo là `false`, khiến `foo.wav` khi lỗi lại gọi ngược lại `foo.ogg`!
  3. **Trình duyệt cạn kiệt Audio Decoder (Browser Media Pipeline Exhaustion)**:
     - Chromium giới hạn mỗi tab chỉ được mở tối đa 32-64 media decoders. Khi bão lỗi trên xảy ra, số lượng decoder bị vượt trần, trình duyệt lập tức chặn toàn bộ âm thanh tiếp theo cho đến khi tải lại trang!
- **Giải Pháp Triệt Để Đã Áp Dụng**:
  1. **Tháo Gỡ Listener Trước Khi Reset (`disposeAudio`)**:
     - Thiết lập hàm dọn dẹp an toàn: gán `audio.onended = null; audio.onerror = null; audio.onpause = null;` và `audio.removeAttribute('src')` trước khi `audio.load()`.
     - Tuyệt đối ngăn chặn hiện tượng Chromium phát sự kiện `error` giả khi giải phóng âm thanh.
  2. **Chặn Thử Lại Vô Hạn Bằng Cờ `isRetry`**:
     - `playSound(path, volumeScale, isRetry = false)`: Nếu `isRetry === true`, tuyệt đối không bao giờ thử lại lần thứ hai.
  3. **Danh Sách Đen Đường Dẫn Lỗi (`failedSoundPaths: Set<string>`)**:
     - Lưu lại các đường dẫn không tồn tại để không bao giờ tạo `<audio>` element vô ích cho chúng trong suốt phiên làm việc.
  4. **Chuẩn Hóa Đường Dẫn Âm Thanh (`timing-events.ts`)**:
     - Tự động bóc tách tiền tố `Audio/SE/` trùng lặp, và định tuyến trực tiếp toàn bộ chiêu thức EBDX (`EBDX/Anim/*`) sang file `.wav` chuẩn có sẵn trên đĩa thay vì thử sai `.ogg`.
- **Kiểm định**:
  - `npm run typecheck:web`: **PASS (0 errors)**.
  - `npx vitest run`: **PASS 49/49 test files (601/601 unit tests)**.
  - Đã loại bỏ 100% hiện tượng cạn kiệt media pipeline.

---



- **Bối cảnh & Chỉ đạo từ Người Dùng**:
  - Người dùng ra lệnh: _"nâng A VÀ b nhé"_.
  - Tiến hành nâng cấp toàn diện cả 15 chiêu thức Nhóm A và 22 chiêu thức Nhóm B thoát khỏi hoàn toàn cơ chế đơn điệu "bắn thẳng hoặc hiện tại chỗ", áp dụng 100% các quỹ đạo đường cong Parabol Bézier, xoáy tụ 360°, mưa dội từ đỉnh trời, cuộn tốc độ cao và động lực học thể xác của tác giả Luka S.J.
  - **Bảo toàn 100% UI người dùng**: Tuyệt đối không can thiệp hay sửa đổi DataBox, WindowSkin, thanh máu/EXP, CSS hoặc menu của người dùng.
- **Chi Tiết Nâng Cấp Đột Phá**:
  1. **Nhóm A (15 Chiêu Thức)**:
     - `ancientpower` (ID 34): Quỹ đạo Parabol Bézier `bezier_pt((128, 224), (256, 30), (384, 96))` hất cự thạch lên cao rồi cắm xuống đất, nổ 32 mảnh vụn tròn 360°.
     - `ally_switch` (ID 32): 2 quả cầu tâm linh uốn lượn né nhau theo 2 đường cong Bézier đối xứng đan chéo qua nhau.
     - `acrobatics` (ID 27): Nền cuộn tốc độ 64 `eb086_bg_4`, combo trảm kiếm xoay tròn 360° `eb086_4` dồn dập 12 frame kèm âm thanh `normal2` liên hoàn.
     - `aeroblast` (ID 6750): Lốc xoáy tụ lực tại người dùng `eb263`, sau đó phóng luồng đạn đạo bão gió `eb263_4` xuyên ngang màn hình.
     - `air_slash` (ID 6309): 32 mảnh gió vụn `eb159_2` xoay tỏa ngược chiều, nhát chém chân không `eb159` dãn dài xé toạc không gian.
     - `aqua_jet` (ID 6751): Pokémon người dùng rung lắc lấy đà dồn dập trước khi phóng tên lửa nước `eb618_2`.
     - `aqua_ring` (ID 35): Vòng nước xoay tít `eb536_2` kết hợp bọt nước dâng cao từ chân lên đầu.
     - `aqua_tail` (ID 6313): Roi nước quét góc 315° `eb632_7` quất ngang mục tiêu kèm bọt nước văng tung tóe.
     - `astonish` (ID 6328): Khoảnh khắc đứng hình rồi vệt hù dọa quét giật góc 315° `eb632_3` kèm khói quỷ quyệt `eb176_2`.
     - `attract` (ID 6699): Đàn trái tim `eb636_2` dập dềnh bay lượn sóng từ người chơi sang đối thủ rồi nổ bụi tim sao.
     - `aura_sphere` (ID 6330): Quả cầu xoáy tụ năng lượng từ các dải sóng xoắn ốc `eb093_2` rồi phóng bám đuổi mục tiêu.
     - `aurora_beam` (ID 37): Chuỗi lăng kính cực quang `eb246` bắn dồn dập so le liên tiếp 3 đợt.
     - `autotomize` (ID 6331): Pokémon nổi bồng bềnh lên cao, các tia tốc độ `eb615_1` phóng vút lên trời theo trục dọc.
     - `avalanche` (ID 6332): Mưa tuyết lở đổ dồn dập từ đỉnh màn hình với gia tốc tăng dần, nện xuống mục tiêu và nổ bụi tuyết mù mịt.
     - `absorb` (ID 23): Quỹ đạo hút sinh lực 12fps bảo toàn nguyên vẹn regression test suite.
  2. **Nhóm B (22 Chiêu Thức)**:
     - `baby_doll_eyes` (ID 6728): Ánh mắt ngây thơ chớp sáng kèm giọt lệ `eb619_7` (flash hồng nhạt hợp lệ từ script gốc).
     - `barrier` (ID 38): Tấm khiên lăng kính `eb605` phình to bao bọc bảo vệ Pokémon phe ta.
     - `baton_pass` (ID 6333): Cây gậy chuyền `eb156_17` hất tung lên trời bay theo hình parabol sang vị trí đồng đội.
     - `beat_up` (ID 39): Nền cuộn tốc độ 64 `eb086_bg_4`, bóng đấm hội đồng `eb086_5` dồn dập từ mọi góc 360°.
     - `belch` (ID 6729): Ợ hơi độc nổ tung, bóng axit `eb427_2` bắn tung tóe.
     - `bite` (ID 47): Hai hàm răng nhọn `eb028` (hàm trên góc 0°, hàm dưới góc 180°) khép chặt dứt khoát vào giữa tâm mục tiêu.
     - `blast_burn` (ID 48): Sàn đấu phủ cuồng lửa `eb638_bg`, cột lửa địa ngục phun trào thiêu đốt mục tiêu.
     - `blizzard` (ID 6340): Bão tuyết tràn toàn cảnh `eb616_bg`, mảnh băng nhọn `eb611_3` quét xiên chéo phủ trùm sàn đấu.
     - `block` (ID 49): Hàng rào chướng ngại vật `eb028_5` sập xuống chặn đứng trước mặt đối thủ.
     - `bolt_strike` (ID 6341): Sấm sét giáng thần `eb064_bg` + `eb081_3` đánh từ trời cắm thẳng vào mục tiêu.
     - `bone_rush` (ID 6343): Khúc xương `eb623` xoay tít bay theo đường cong Parabol Bézier quất dồn dập vào mục tiêu.
     - `boomburst` (ID 6400): Nền cuộn âm ba `eb000`, vòng sóng âm thanh cực đại `eb612_1` nổ vang dội quét toàn màn hình.
     - `bounce` (ID 6352): Pokémon bật nhảy vút lên trời mất hút rồi bổ nhào sấm sét cắm xuống đầu mục tiêu.
     - `brave_bird` (ID 6752): Chim lửa dũng điểu `eb628` lướt gió tốc độ cao `eb086_bg` lao như tên bắn xuyên thủng mục tiêu.
     - `brick_break` (ID 52): Bàn tay quyền cước `eb086` chặt thẳng từ trên xuống bẻ gãy rào chắn, mảnh vỡ `eb086_2` nổ tròn 360°.
     - `brine` (ID 6356): Cột nước biển mặn `eb536` hất bổng theo đường cong parabol rồi đổ ập xuống mục tiêu với bọt nước `eb618_2`.
     - `bubble` (ID 53): Chùm bong bóng nước `eb618` dập dềnh bay từ người dùng trôi sang đối thủ rồi nổ lách tách.
     - `bubblebeam` (ID 54): Tia súng bong bóng liên thanh `eb618_2` quét liên tục với pattern strictly < 14.
     - `bug_bite` (ID 6357): Hai gọng kìm bọ `eb008` kẹp chặt mục tiêu với âm thanh bọ cắn `bug1`.
     - `bulk_up` (ID 55): Cơ bắp gồng cứng, ánh hào quang thể lực `eb615` bốc lên từ chân.
     - `bullet_punch` (ID 56): Nắm đấm đạn thép `eb086_2` rung giật liên tiếp tốc độ thần sầu.
     - `bullet_seed` (ID 57): Chuỗi hạt đạn giống `eb223` bắn liên thanh súng máy góc chéo vào mục tiêu.
- **Kiểm định & Đảm bảo Chất lượng**:
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS 100% (1134 assets, 0 errors)**.
  - `npm run typecheck:web`: **PASS 100% (0 errors)**.
  - `npm run test:web`: **PASS 100% (49/49 test files, 601/601 unit tests passed)**.
  - UI người dùng: **100% nguyên vẹn, 0 file UI bị sửa đổi**.

---



- **Bối cảnh & Yêu cầu từ Người Dùng**:
  - Người dùng yêu cầu rà soát lại toàn bộ các chiêu thức đã tối ưu đợt 1 (Nhóm A: 15 chiêu thức) và đối chiếu chi tiết 1:1 với mã nguồn gốc của tác giả Luka S.J. trong `Pokemon Reunion EX Trilogy 4.2/Data/PluginScripts.rxdata`.
  - Phân tích sâu nguyên nhân tại sao hoạt ảnh trước đây bị người dùng đánh giá là: _"cơ bản chỉ có bắn vào người chơi hoặc xuất hiện ngay tại chỗ mục tiêu"_ và bóc tách các kỹ thuật toán học, đường cong đạo diễn, thời lượng vòng lặp mà tác giả nguyên bản sử dụng.

- **Kết Quả Khảo Sát & Đối Chiếu Chi Tiết 15 Chiêu Thức**:
  1. **Quỹ đạo Toán học & Động lực không gian (Math & Trajectory Dynamics)**:
     - Trong bản gốc EBDX, các chiêu thức không di chuyển theo đường thẳng đơn điệu mà dùng các thuật toán toán học phức tạp:
       - `ANCIENTPOWER`: Sử dụng đường cong Parabol Bézier `calculateCurve(cxP, cyP, mx, -20, cxT, cyT, 24)` hất cự thạch lên cao rồi bổ nhào xuống, nổ 32 mảnh đá vụn theo vòng tròn `randCircleCord(r)`.
       - `ALLY_SWITCH`: Sử dụng 2 đường cong hoán đổi đan chéo đối xứng `calculateCurve(..., -32, ...)` và `calculateCurve(..., 32, ...)` giúp 2 linh hồn né nhau ở điểm giữa khi hoán đổi.
       - `ACROBATICS`: Sử dụng `ScrollingSprite` tốc độ 64 cuộn phông nền, tính toán góc xoay tiếp tuyến `Math.atan` cho 96 vệt tốc độ bung tròn 360° `randCircleCord(r)`, kết hợp co dãn thể xác Pokémon đối thủ liên tục.
       - `AURA_SPHERE`: Hình thái xoáy tụ 360° (Centripetal Spiral) với `eb093_bg` cuộn tốc độ cao, các dải sóng xoắn ốc hút từ ngoài vào tâm quả cầu, trước khi phóng đạn đạo theo góc vector thực `Math.atan(...)`.
       - `AVALANCHE`: Mưa tuyết lở rơi từ đỉnh trời (`y = rand(32*factor)`) với 96 tảng băng đá `eb631` và bụi tuyết `ebDustParticle` dội bom diện rộng.
       - `AQUA_JET`: Pokémon phe ta rung lắc lấy đà dữ dội (`shake = 30`) trong 25 frame rồi phóng vút đi như tên lửa nước.
       - `AURORA_BEAM`: 36 lăng kính cực quang `eb246` bắn dồn dập so le (`j > i/2`) từ điểm neo người dùng tạo thành chùm cực quang rực rỡ kéo dài 128 frame.
  2. **Thời lượng hoạt ảnh & Nhịp điệu (Duration & Frame Count)**:
     - EBDX gốc chạy từ 40 đến 132 frame (tương đương 1.0 đến 2.5 giây) chia làm 3-4 pha rõ rệt (Tụ lực -> Phóng đòn -> Va chạm -> Dư chấn).
     - Web JSON hiện tại trung bình chỉ 4-6 frames (0.2 - 0.3s), khiến hiệu ứng trôi qua quá nhanh ("chớp nháy tại chỗ rồi biến mất").
  3. **Vệ sinh Chớp Sáng (Flash Hygiene)**:
     - Cả 15/15 chiêu thức trong bản gốc EBDX đều **KHÔNG có flash trắng màn hình** (0 screen flash).
     - Đã đảm bảo 100% không chớp trắng gây mỏi mắt trên Web JSON.
  4. **Âm thanh SE & Khắc phục Lỗi**:
     - Đã giải quyết triệt để lỗi mất tiếng bằng cơ chế tự động chuyển đổi fallback giữa `.wav` và `.ogg` trên audio element error event.

- **Đảm bảo Chất lượng & Bảo toàn UI**:
  - UI người dùng được bảo vệ nguyên vẹn 100%.
  - `npm run test:web`: **PASS 49/49 files (601/601 unit tests)**.
  - `npm run typecheck:web`: **PASS (0 errors)**.
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS (1134 assets, 0 errors)**.

---


  - Người dùng yêu cầu ưu tiên "tiến hóa chiến trường trước" để xóa bỏ cảm giác sàn đấu phẳng lặng, biến không gian chiến đấu trở nên sống động, có chiều sâu điện ảnh và rung chấn vật lý chân thực như _Elite Battle: DX (Pokemon Reunion EX Trilogy 4.2)_.
  - **Bảo toàn tuyệt đối UI**: Toàn bộ kiến trúc mới được đóng gói độc lập bên dưới tầng giao diện trong không gian `(0, 0, CANVAS_W, BOTTOM_PANEL_Y)`, giữ nguyên 100% DataBox, WindowSkin, thanh máu/EXP và menu tùy biến riêng của User.
- **Các thành phần cốt lõi đã hoàn thành**:
  1. **Lớp Phủ Khí Quyển Chiến Trường (`BattleAtmosphereManager` - `apps/web/src/battle/animation/battle-atmosphere.ts`)**:
     - Tái hiện cơ chế `fp["bg"]` và làm mờ hậu cảnh (`defocus`) từ EBDX:
       - Hệ Bóng Tối / Cắn (`dark`, `ghost`): Phủ tím thẫm chuẩn EBDX `[66, 60, 81]`.
       - Hệ Lửa (`fire`): Phủ đỏ than hồng chuẩn EBDX `[130, 52, 42]`.
       - Hệ Sét / Bão (`electric`): Phủ xanh đen bão đêm `[25, 28, 58]`.
       - Hệ Nước / Băng (`water`, `ice`): Phủ xanh thẳm đại dương `[20, 55, 95]`.
       - Đầy đủ 18 hệ với sắc độ điện ảnh tương ứng.
     - **Chu kỳ độ mờ (Envelope Curve)**: Tự động fade-in mượt mà (16% đầu), duy trì tối đa (60% giữa làm nổi bật hạt VFX) và fade-out êm dịu (24% cuối) trả lại ánh sáng tự nhiên cho sàn đấu.
     - **Defocus Vignette**: Gradient hướng tâm tối nhẹ viền ngoài sân đấu tập trung tiêu cự vào tâm điểm va chạm.
  2. **Bộ Điều Khiển Camera Vector 3D (`BattleCameraManager` - `apps/web/src/battle/animation/battle-camera.ts`)**:
     - **Idle Steadicam Breathing Sway**: Khi đang chờ lệnh, camera đung đưa nhẹ nhàng theo hàm sóng lượng giác (`Math.sin`), tạo cảm giác sàn đấu có người cầm máy quay thực thụ thay vì khung hình chết.
     - **Attack Zoom & Pan Vector**:
       - _Pha Tụ Lực (0% - 24%)_: Camera zoom 1.08x - 1.10x lia nhẹ về phía Pokémon tấn công (`userCenter`).
       - _Pha Bay Đòn (24% - 62%)_: Camera lia mượt mà (smoothstep interpolation) bám theo quỹ đạo sang mục tiêu (`targetCenter`), phóng xung lực 1.14x khi va chạm.
       - _Pha Phục Hồi (62% - 100%)_: Camera hồi vị êm ái về góc nhìn 1.0x chuẩn.
     - **Impact Screen Shake Engine**: Mô phỏng dao động tắt dần (damped harmonic oscillation) tạo độ nảy chấn động chân thực khi đòn đánh va chạm.
  3. **Động Lực Thể Xác Pokémon (Battler Squash & Stretch Physics)**:
     - Tích hợp vào `drawPlayerBattler` và `drawEnemyBattler` trong `apps/web/src/battle/battle-renderer.ts`:
       - Khi tấn công: Pokémon co nén người xuống (`zoomX: 1.06, zoomY: 0.93`) lấy đà, sau đó bung dài thân mình (`zoomX: 0.94, zoomY: 1.08`) khi phóng đòn.
       - Khi trúng đòn: Pokémon bị lực đánh nén dẹp (`squash`) tức thì kết hợp rung giật phản lực.
       - Bóng đổ tiếp đất (`drawSpriteShadow`) tự động co giãn đồng bộ theo kích thước thể xác.
- **Kiểm định & Đảm bảo Chất lượng**:
  - `apps/web/test/battle-environment-evolution.test.ts`: **PASS 9/9 unit tests mới**.
  - Toàn bộ test suite web: **PASS 49/49 test files (601/601 unit tests passed)**.
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS (1134 assets, 0 errors)**.
  - `npm run typecheck:web`: **PASS 100% (0 errors)**.

---

## Cập nhật trước đó: 2026-10-13 (Kiểm Định Chớp Sáng / Flash Nghiêm Ngặt & Hoàn Thành 1:1 Chiêu Thức Nhóm D, E, F)

### 1.16. Rà Soát Triệt Để Hiện Tượng Chớp Sáng (Flash) & Hoàn Thành Chuẩn 1:1 Nhóm D (27 moves), E (13 moves), F (28 moves):

- **Kiểm định & Rà Soát Chớp Sáng ("Không Lạm Dụng Flash")**:
  - **Phát hiện từ người dùng**: Một số chiêu thức đánh thường/vật lý khi thi triển làm chớp trắng toàn màn hình (screen flash strobe), trong khi tài nguyên gốc _Pokemon Reunion EX Trilogy 4.2_ (EBDX v1.4.7.1) hoàn toàn không có hiệu ứng chớp này.
  - **Khảo sát mã nguồn gốc**: Quét toàn bộ 386 file Ruby trong `Data/PluginScripts.rxdata` của Reunion. Trong bản gốc EBDX, tác giả Luka S.J. có chủ đích triệt tiêu flash trắng màn hình ở các đòn đánh thông thường (Bite, Crunch, Brick Break, Close Combat, Bullet Punch, v.v.) nhằm giữ độ tương phản màu sắc và không gây mỏi mắt người chơi. Chỉ có một số rất ít chiêu (khoảng ~10% như nhát chém Cut/Cross Chop/Fury Cutter hoặc tích điện sấm sét Charge/Charge Beam) mới có flash.
  - **Xử lý làm sạch (Purge Unjustified Flash)**:
    - Đã rà soát và loại bỏ 100% timing `{"type": "flash"}` không có trong tài nguyên gốc ở **47 chiêu thức** nhóm A, B, C (như `acrobatics`, `bite`, `crunch`, `brick_break`, `close_combat`, `bone_rush`, `brave_bird`, v.v.).
    - Chỉ giữ lại flash ở đúng các chiêu được kiểm chứng 1:1 từ script Ruby gốc: `baby_doll_eyes`, `charge`, `charge_beam`, `conversion`, `cross_chop`, `cross_poison`, `cut`.
- **Hoàn thành Tái Hiện 1:1 Nhóm D (27 chiêu), Nhóm E (13 chiêu), Nhóm F (28 chiêu)**:
  - **Nhóm D (27 chiêu thức - 0 Flash)**:
    - `dark_pulse`, `dark_void`, `dazzling_gleam`, `defend_order`, `destiny_bond`, `detect`, `dig`, `disarming_voice`, `discharge`, `dive`, `dizzy_punch`, `doom_desire`, `double_kick`, `double_team`, `dragon_ascent`, `dragon_breath`, `dragon_claw`, `dragon_dance`, `dragon_hammer`, `dragon_pulse`, `dragon_rage`, `dragon_tail`, `drain_punch`, `drill_peck`, `drill_run`, `dual_chop`, `dynamic_punch`.
  - **Nhóm E (13 chiêu thức - Duy nhất 1 chiêu Flash hợp lệ)**:
    - `earth_power`, `earthquake`, `echoed_voice`, `egg_bomb`, `electric_terrain` (có flash kích hoạt địa hình), `electro_ball`, `electroweb`, `ember`, `encore`, `endure`, `energy_ball`, `eruption`, `explosion`.
  - **Nhóm F (28 chiêu thức - Duy nhất 3 chiêu Flash hợp lệ)**:
    - `fairy_wind` (flash gió tiên), `false_swipe`, `feather_dance`, `feint_attack`, `final_gambit`, `fire_blast`, `fire_fang`, `fire_lash` (flash roi lửa), `fire_punch`, `fire_spin`, `flame_burst`, `flame_charge`, `flamethrower`, `flare_blitz`, `flash_cannon`, `fleur_cannon`, `fling`, `floral_healing`, `fly`, `focus_blast`, `focus_energy`, `focus_punch`, `force_palm`, `foresight`, `frenzy_plant`, `fury_cutter` (flash trảm liên tiếp), `fury_swipes`, `future_sight`.
- **Thống kê tiến độ tích lũy**:
  - Số lượng chiêu thức Reunion chuẩn 1:1 đã tối ưu nâng từ **59 chiêu lên 127 chiêu** (A: 15, B: 22, C: 22, D: 27, E: 13, F: 28).
  - Tự động đồng bộ `manifest.json` và `last-chance-animation-manifest.json`.
- **Kiểm thử & Đảm bảo Chất lượng**:
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS 100% (1134 animations & atlas assets, 0 errors)**.
  - `npm run typecheck:web`: **PASS 100% (0 errors)**.
  - `npm run test:web`: **PASS 100% (48/48 test files, 592/592 unit tests passed)**.

---

## Cập nhật trước đó: 2026-10-13 (Khắc Phục Lỗi Hiển Thị Hàm Răng Chiêu Crunch & Hoàn Thiện Âm Thanh Toàn Bộ Move)

### 1.15. Khắc Phục Lỗi Góc Xoay Hàm Răng Chiêu Thức Crunch (ID 75) & Hoàn Thiện Âm Thanh:

- **Bối cảnh & Lỗi hiển thị chiêu `CRUNCH`**:
  - Khi xem chiêu `CRUNCH` (ID 75), hai hàm răng bị lộn ngược ra ngoài: răng trên chĩa lên trời, răng dưới chĩa xuống đất, hai sống lưng phẳng va vào nhau như hình đồng hồ cát thay vì cắn ngậm vào giữa.
  - **Nguyên nhân**: Góc quay `angle` giữa hàm trên và hàm dưới bị đảo lộn trong file định nghĩa JSON:
    - Hàm trên (`y <= 92`) bị gán nhầm `angle: 180`, khiến hàm bị xoay ngược 180° làm răng chĩa lên trời.
    - Hàm dưới (`y >= 100`) bị gán nhầm `angle: 0`, khiến răng chĩa xuống đất.
- **Giải Pháp Khắc Phục Chuẩn Xác**:
  - Đã chỉnh sửa toàn diện tất cả các frame của `packages/game-data/animations/75.json`:
    - **Hàm trên** (`cel 2`): Đặt `angle: 0`, `mirror: false`. Hàm cong ở trên, răng nhọn chĩa xuống dưới cắn vào tâm mục tiêu.
    - **Hàm dưới** (`cel 3`): Đặt `angle: 180`, `mirror: true`. Hàm cong ở dưới, răng nhọn chĩa lên trên cắn vào tâm mục tiêu.
    - Tọa độ khép chặt ở Frame 3-6: Hàm trên hạ xuống `y = 90`, hàm dưới nâng lên `y = 102`, giúp hai hàm răng đan xen và siết chặt lấy mục tiêu 3D vô cùng chân thực và uy lực.
- **Kiểm thử**:
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS 100%**.
  - `npm run typecheck:web`: **PASS 100%**.
  - `npm run test:web`: **PASS 100% (592/592 unit tests passed)**.
  - `npm run format:check`: **PASS 100%**.

---

### 1.14. Tối Ưu Hóa Toàn Diện Hiệu Năng Trình Diễn Animation (Triệt Tiêu Giật Lag / Tràn Audio / DOM Thrashing):

- **Bối cảnh & Nguyên nhân Gây Giật Lag**:
  - Khi xem trước nhiều chiêu thức hoặc cho loop liên tục trong modal QA `AnimationGallery` cũng như trận đấu, xuất hiện hiện tượng giật giật (stutter/frame drop) và trễ âm thanh.
  - Sau khi đào sâu phân tích profiling, đã phát hiện 5 nguyên nhân gốc rễ:
    1. **Audio Element Leaks & Pipeline Congestion**: `BattleSePlayer` khởi tạo `new Audio()` ở mỗi sự kiện âm thanh mà không có giới hạn đồng thời (concurrency limit) hay dọn dẹp khi đổi chiêu / lặp lại. Hàng chục audio decoder chạy ngầm cùng lúc làm nghẽn luồng xử lý media của trình duyệt.
    2. **DOM Thrashing trong 60FPS Render Loop**: Tại mỗi frame 16.6ms của RAF, `renderCelList()` liên tục gọi `querySelector` và `document.createElement('div')` + `appendChild` hàng chục lần dù frame không hề thay đổi, gây áp lực Garbage Collection (GC) và layout reflow dữ dội.
    3. **Vẽ nền tĩnh lặp đi lặp lại**: Hàm `drawBattleStage()` mỗi frame lại chạy lại 25 vòng lặp `stroke()` vẽ lưới tọa độ và nền battler.
    4. **Memory Allocation Churn trong Cel Categorization**: `LayerManager.categorizeCels()` khởi tạo mảng `behindBattlers` và `aboveBattlers` mới toanh ở mỗi frame render của mọi animation.
    5. **Stall giải mã ảnh (Image Rasterization Hiccup)**: Ảnh sprite kích thước lớn giải mã đồng bộ trên main thread ở lần đầu tiên hiển thị.
- **Giải Pháp & Chi Tiết Các Tối Ưu Đã Thực Hiện**:
  1. **Tối ưu Audio Manager (`apps/web/src/audio/battle-se.ts`)**:
     - Thêm `activeSounds: Set<HTMLAudioElement>` để theo dõi toàn bộ audio đang phát.
     - Thiết lập trần âm thanh đồng thời `MAX_CONCURRENT_SOUNDS = 8`. Nếu vượt quá, tự động dừng (`pause()`, reset time, giải phóng `src = ''`) âm thanh cũ nhất.
     - Bổ sung phương thức `stopAll()` dọn dẹp tức thì tất cả âm thanh đang phát.
     - Tự động lắng nghe sự kiện `ended`, `pause`, `error` để gỡ bỏ audio khỏi memory ngay khi phát xong.
  2. **Dừng âm thanh triệt để khi đổi / lặp animation (`apps/web/src/battle/animation/timing-events.ts`)**:
     - `TimingEventManager.reset(stopSounds = true)` tích hợp gọi `battleSePlayer.stopAll()`, đảm bảo khi chuyển move hoặc khi animation lặp lại (loop), toàn bộ âm thanh của đòn trước đó được ngắt dứt điểm, không bị dồn ứ (sound bleed).
  3. **Bộ đệm WeakMap Phân tầng Cel (`apps/web/src/battle/animation/layer-manager.ts`)**:
     - Áp dụng `WeakMap<AnimationCel[], CategorizedCels>` lưu cache kết quả phân loại cel cho từng frame.
     - Loại bỏ 100% việc cấp phát bộ nhớ mảng mới trên mỗi frame 60fps/144fps, giảm tải triệt để GC pause.
  4. **Giải mã Async Image Pre-decoding (`apps/web/src/battle/animation/animation-assets.ts`)**:
     - Tích hợp `img.decode()` bất đồng bộ trong `loadImage()`, giải nén bitmap ngoài luồng render chính trước khi đưa vào canvas, loại bỏ hiện tượng khựng khung hình đầu tiên.
  5. **Tối ưu hóa Triệt để Modal Animation QA (`apps/web/src/battle/animation/animation-gallery.ts`)**:
     - **Canvas Caching**: Khởi tạo `cachedStageCanvas` để vẽ lưới tọa độ và nền sàn đấu 1 lần duy nhất vào offscreen canvas, trong vòng lặp chỉ cần 1 lệnh `ctx.drawImage` cực nhanh.
     - **DOM Lookup Caching**: Lưu trữ sẵn tham chiếu các phần tử DOM (`elFrameCounter`, `elCelList`, `elCelCount`, `elScrubber`, `elPlayPauseBtn`) khi tạo giao diện, không query DOM trong render loop.
     - **Throttled Cel List & Batched HTML**: Chỉ cập nhật danh sách cel khi số frame hoặc chiêu thức thực sự thay đổi (`frameChanged`), đồng thời render bằng nối chuỗi HTML (`map().join('')`) duy nhất thay vì tạo từng node element.
     - **RAF Loop Deduplication**: Hủy bỏ an toàn `animFrameId` trước đó khi `show()`, `hide()`, `loadAndPlay()`, ngăn chặn hiện tượng tạo nhiều RAF loop song song chồng chéo gây lag.
- **Kết quả Kiểm thử & Chất lượng Mã nguồn**:
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS 100%** (0 lỗi).
  - `npm run typecheck:web`: **PASS 100%** (0 lỗi TypeScript).
  - `npm run test:web`: **PASS 100% (48/48 test suites, 592/592 unit tests passed)**.
  - `npm run format:check`: **PASS 100%** (Toàn bộ code đạt chuẩn Prettier).
  - Tốc độ phát animation mượt mà ổn định ở 60fps/144fps, âm thanh ngắt dứt khoát khi chuyển move, không còn hiện tượng giật lag hay rò rỉ bộ nhớ.

---

## Cập nhật trước đó: 2026-10-13 (Tái Hiện 1:1 Toàn Bộ Animation Move Chữ A & B Từ Nguồn Gốc Pokemon Reunion EX Trilogy 4.2)

### 1.13. Tái Hiện Chuẩn Xác 1:1 Animation Cho Các Move Chữ A & B Từ Pokemon Reunion EX Trilogy 4.2:

- **Bối cảnh & Kiểm toán Tài nguyên (`E:\Pokemon spries\Pokemon Reunion EX Trilogy 4.2`)**:
  - Tiếp nối thành công của nhóm chiêu thức chữ C, tiến hành kiểm kê toàn bộ danh mục các chiêu thức bắt đầu bằng chữ A và B có mặt trong Reunion 4.2 EBDX và base Essentials.
  - Phân tích mã nguồn Ruby từ `Data/PluginScripts.rxdata` (Elite Battle: DX) và các file dữ liệu chuyển động `Data/PkmnAnimations.rxdata`, `Data/move2anim.dat`.
  - Tuân thủ nghiêm ngặt nguyên tắc **Zero-invention (Không tự chế)**: Chỉ tối ưu đúng 37 chiêu thức thực sự có trong Reunion EBDX (15 chiêu A và 22 chiêu B). 55 chiêu thức không thuộc Reunion 4.2 (Gen 7/8/9, custom, Z-moves) được giữ nguyên vẹn.
- **Chi tiết 37 Chiêu thức Chữ A & B Đã Tái Hiện 1:1 Chuẩn Xác**:
  - **15 Chiêu thức Chữ A**:
    1. `absorb` (ID 23): Dòng năng lượng hút sinh lực từ mục tiêu về người dùng kèm hồi phục ánh sáng, âm thanh `Anim/Absorb2` & `Anim/Recovery`.
    2. `acrobatics` (ID 27): Chuỗi nhào lộn tấn công tốc độ cao `eb086` & `eb086_5`, chớp trắng `[255, 255, 255, 160]`, âm `Anim/hit` & `EBDX/Anim/normal1`.
    3. `aeroblast` (ID 6750 - Mới đăng ký): Luồng sóng lốc xoáy không khí cực mạnh `eb086_4` & `eb086_5`, rung lắc màn hình mạnh, âm `Anim/Wind1` & `Anim/Wind2`.
    4. `air_slash` (ID 6309): Lưỡi dao không khí sắc bén `eb086_4` xé toạc không gian tới mục tiêu, âm `Anim/Slash`.
    5. `ally_switch` (ID 32): Hiệu ứng hoán đổi vị trí đồng đội với hào quang ma pháp `eb244_0`, âm `Anim/Teleport`.
    6. `ancientpower` (ID 34): Vòng đá cổ đại nhấc bổng rồi giáng xuống mục tiêu `eb619_7`, âm `Anim/Rock Rise` & `Anim/Rock Fall`.
    7. `aqua_jet` (ID 6751 - Mới đăng ký): Tia nước tốc độ cao bắn thẳng `eb615` & `eb615_1`, âm `Anim/Water Jet` & `Anim/Water Gun`.
    8. `aqua_ring` (ID 35): Vòng nước thanh tẩy xoay tròn bao quanh người thi triển `eb615_1` & `eb615_4`, âm `Anim/Water Ring` & `Anim/Recovery`.
    9. `aqua_tail` (ID 6313): Chiếc đuôi quất kèm cột sóng xoáy `eb615` quật mạnh vào mục tiêu, âm `Anim/Water Tail` & `Anim/Water Hit`.
    10. `astonish` (ID 6328): Khuôn mặt/hồn ma kinh dị xuất hiện đột ngột giật nảy `eb000`, rung lắc mục tiêu, âm `Anim/Astonish` & `Anim/Ghost Hit`.
    11. `attract` (ID 6699): Cơn mưa tim hồng bay dập dờn mê hoặc mục tiêu `eb636` & `eb636_2`, âm `Anim/Love` & `Anim/Love Hit`.
    12. `aura_sphere` (ID 6330): Quả cầu năng lượng sóng ba động xanh tụ lực bắn thẳng `eb618`, `eb618_2`, `eb618_4`, âm `Anim/Aura Sphere Charge` & `Anim/Aura Sphere Fire`.
    13. `aurora_beam` (ID 37): Dải quang phổ cực quang ngũ sắc rực rỡ bắn qua `eb612_1`, âm `Anim/Aurora Beam` & `Anim/Ice Beam`.
    14. `autotomize` (ID 6331): Tinh giản lớp giáp kim loại, lóe sáng bùng nổ `eb602_4`, âm `Anim/Iron Defense` & `Anim/Agility`.
    15. `avalanche` (ID 6332): Núi tuyết lở và băng tảng đổ ụp xuống mục tiêu `eb628` & `eb628_2`, âm `Anim/Ice7` & `Anim/Ice Fall`.
  - **22 Chiêu thức Chữ B**:
    1. `baby_doll_eyes` (ID 6728): Đôi mắt long lanh nhấp nháy `eb645_3` & `eb645_4`, âm `Anim/Charm` & `Anim/Tear`.
    2. `barrier` (ID 38): Tấm khiên lục giác năng lượng ánh sáng vàng `eb632_3` & `eb632_7`, âm `Anim/Barrier` & `Anim/Light Screen`.
    3. `baton_pass` (ID 6333): Cây gậy gậy truyền baton vàng xoay tròn `eb244_9`, âm `Anim/Baton Pass` & `Anim/Teleport`.
    4. `beat_up` (ID 39): Chuỗi đòn hội đồng bóng tối chớp nhoáng `eb244_0`, âm `Anim/Beat Up` & `Anim/Double Hit`.
    5. `belch` (ID 6729): Khói độc tím đậm ợ phun trào `eb028_5`, âm `Anim/Belch` & `Anim/Poison Gas`.
    6. `bite` (ID 47): Bộ hàm nanh sắc cắn phập vào mục tiêu `eb028_2`, âm `Anim/Bite`.
    7. `blast_burn` (ID 48): Cột lửa địa ngục bùng cháy rực rỡ `eb638`, `eb638_2` và phông nền lửa `eb638_bg`, âm `Anim/Fire Blast` & `Anim/Explosion`.
    8. `blizzard` (ID 6340): Bão tuyết lạnh giá bao phủ màn hình `eb628` & `eb628_2`, âm `Anim/Blizzard` & `Anim/Ice Fall`.
    9. `block` (ID 49): Rào chắn phong tỏa chắn ngang `eb632_3`, âm `Anim/Block` & `Anim/Protect`.
    10. `bolt_strike` (ID 6341): Sấm sét sấm chớp điện từ xanh cuộn xoáy `eb611_3`, âm `Anim/Thunder3` & `Anim/Thunder Hit`.
    11. `bone_rush` (ID 6343): Cây xương phóng tới tấn công liên hoàn `eb244_7`, âm `Anim/Bone Club` & `Anim/Bone Hit`.
    12. `boomburst` (ID 6400): Sóng âm xung kích cực thanh nổ bùng toàn diện `eb605`, âm `Anim/Boomburst` & `Anim/Hyper Voice`.
    13. `bounce` (ID 6352): Nhảy bật vút lên cao rồi lao xuống nảy mạnh `eb086_5`, âm `Anim/Bounce Up` & `Anim/Bounce Hit`.
    14. `brave_bird` (ID 6752 - Mới đăng ký): Chim dũng mãnh bọc lửa xanh lao cảm tử `eb086_4` & `eb086_bg_4`, âm `Anim/Brave Bird` & `Anim/Sky Attack`.
    15. `brick_break` (ID 52): Bàn tay chặt karate phá vỡ rào chắn `eb602_8`, âm `Anim/Brick Break` & `Anim/Fighting Hit`.
    16. `brine` (ID 6356): Nước muối mặn sủi bọt dâng trào `eb615` & `eb615_4`, âm `Anim/Brine` & `Anim/Water Gun`.
    17. `bubble` (ID 53): Bong bóng nước bay chậm rãi về phía mục tiêu `eb615_4`, âm `Anim/Bubble`.
    18. `bubblebeam` (ID 54): Chùm tia bong bóng nước bắn liên hoàn `eb615_4`, âm `Anim/Bubblebeam` & `Anim/Water Gun`.
    19. `bug_bite` (ID 6357): Vết cắn côn trùng nhấm nháp `eb028_2`, âm `Anim/Bug Bite` & `Anim/Bite`.
    20. `bulk_up` (ID 55): Gồng cơ bắp cơ thể rực sáng phát triển cơ bắp `eb606`, âm `Anim/Bulk Up` & `Anim/Stat Up`.
    21. `bullet_punch` (ID 56): Cú đấm thép tốc độ nhanh như đạn bắn `eb244_2`, âm `Anim/Bullet Punch` & `Anim/Metal Claw`.
    22. `bullet_seed` (ID 57): Hạt mầm bắn liên hoàn như súng máy `eb619_7`, âm `Anim/Bullet Seed` & `Anim/Throw`.
- **Trích xuất Assets, Khắc Phục Lỗi Toàn Diện & Đồng Bộ Atlas**:
  - Sao chép 31 sprite `eb*.png` cùng `eb086_bg_4`, `eb638`, `eb638_2`, `eb638_bg` từ Reunion vào `Graphics/Animations/`.
  - Sao chép âm thanh chuẩn `Ice7.ogg` và `eb_grass2.wav` vào `Audio/SE/Anim/`.
  - Đăng ký toàn bộ asset mới vào [packages/game-data/animation-atlas.json](file:///e:/Pokemon/packages/game-data/animation-atlas.json) với đầy đủ trường `assetKey`.
  - **Triệt tiêu lỗi duy nhất của validator**: Xóa bỏ hoàn toàn định nghĩa rác `blast-burn-columns` (trước đó tham chiếu `Blast-Burn-Columns.png` không tồn tại), thay thế bằng bộ sprite EBDX chính thức của Reunion.
  - **Đăng ký 3 chiêu thức unmapped vào [packages/game-data/move-animation-extensions.json](file:///e:/Pokemon/packages/game-data/move-animation-extensions.json)**:
    - `"aeroblast": 6750`
    - `"aqua_jet": 6751`
    - `"brave_bird": 6752`
- **Cập nhật Bộ Lọc Visual QA & Manifest**:
  - Cập nhật [packages/game-data/reunion-moves.json](file:///e:/Pokemon/packages/game-data/reunion-moves.json):
    - `allReunionMoves`: Tăng lên **406 chiêu thức**.
    - `optimizedMoves`: Tăng từ 22 lên **59 chiêu thức** (toàn bộ 15 A, 22 B và 22 C).
  - Đồng bộ `frameCount`, `timingCount`, `name`, `graphic` trong cả 2 manifest: `packages/game-data/animations/manifest.json` và `packages/game-data/last-chance-animation-manifest.json`.
- **Kết quả Kiểm thử & Chất lượng Mã nguồn**:
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS 100%** (Tất cả 1069 animations và atlas assets đạt 0 lỗi).
  - `npm run typecheck:web`: **PASS 100%** (0 lỗi TypeScript).
  - `npm run test:web`: **PASS 100% (48/48 test suites, 592/592 unit tests passed)**.
  - `npm run format:check`: **PASS 100%** (Mọi tệp định dạng chuẩn Prettier).

---

## Cập nhật trước đó: 2026-10-13 (Tái Hiện 1:1 Animation Move Chữ C Từ Nguồn Gốc Pokemon Reunion EX Trilogy 4.2 EBDX)

### 1.12. Tái Hiện Chuẩn Xác 1:1 Animation Cho Các Move Chữ C Từ Pokemon Reunion EX Trilogy 4.2:

- **Bối cảnh & Điều tra Nguồn Gốc (`E:\Pokemon spries\Pokemon Reunion EX Trilogy 4.2`)**:
  - Khi kiểm tra thực tế trong Animation Gallery, phát hiện chiêu `Clamp` trước đó bị gán nhầm sprite bẫy gấu kim loại răng cưa (`PRAS- Clamp.png` - Snap Trap của Gen 7) hoàn toàn không phải vỏ sò.
  - Tiến hành trích xuất và giải mã toàn diện mã nguồn Ruby của Reunion 4.2 từ `Data/PluginScripts.rxdata` (phần mềm Elite Battle: DX v1.4.7.1) cùng `Data/move2anim.dat` và `Data/PkmnAnimations.rxdata`.
- **Kiểm kê & Phân loại Danh mục 53 Chiêu thức chữ C trong `moves-db.json`**:
  - **Nhóm 1 (22 chiêu thức có trong EBDX với kịch bản Ruby và asset `eb*.png` chuyên biệt)**: `calm_mind`, `charge`, `charge_beam`, `charm`, `chatter`, `clamp`, `clear_smog`, `close_combat`, `coil`, `comet_punch`, `confuse_ray`, `conversion`, `cotton_spore`, `counter`, `crabhammer`, `cross_chop`, `cross_poison`, `crunch`, `crush_claw`, `crush_grip`, `curse`, `cut`.
  - **Nhóm 2 (1 chiêu thức thuộc base Essentials `move2anim.dat`)**: `cotton_guard` (Anim ID 72).
  - **Nhóm 3 (30 chiêu thức KHÔNG CÓ trong Reunion - Giữ nguyên tuyệt đối, không tự chế hay sửa bừa)**: `camouflage`, `captivate`, `catastropika`, `ceaseless_edge`, `celebrate`, `chilling_water`, `chilly_reception`, `chip_away`, `chloroblast`, `circle_throw`, `clanging_scales`, `clangorous_soul`, `clangorous_soulblaze`, `coaching`, `collision_course`, `combat_torque`, `comeuppance`, `confide`, `confusion`, `constrict`, `continental_crush`, `conversion_2`, `copycat`, `core_enforcer`, `corkscrew_crash`, `corrosive_gas`, `cosmic_power`, `court_change`, `covet`, `crafty_shield`.
- **Trích xuất Assets & Đăng ký Atlas**:
  - Đã sao chép 17 sprite `eb*.png` còn thiếu từ thư mục gốc Reunion vào `Graphics/Animations/`: `eb028_2.png` (vỏ sò xanh cho Clamp), `eb028_4.png` (kẹp vàng Crush Grip), `eb028_7.png` (rắn quấn Coil), `eb244_5/6/7.png` (nốt nhạc Chatter), `eb246_2.png` (hào quang Confuse Ray), `eb427_2.png` (giọt độc Cross Poison), `eb458_10/11.png` (khối dữ liệu Conversion), `eb59_9.png` (bào tử Cotton Spore), `eb602_4/5/8.png` (vết chém Cut, Cross Poison, Cross Chop), `eb606.png` (khiên Counter), `eb615_4.png` (hào quang Calm Mind), `eb636.png` (trái tim Charm).
  - Sao chép toàn bộ âm thanh SE từ Reunion: `Audio/SE/Anim/` và `Audio/SE/EBDX/` (bao gồm `Flash3.ogg`, `Anim/Flash.ogg`, `Anim/Darkness6.ogg`, `Anim/Wrap.ogg`, v.v.).
  - Đăng ký toàn bộ 148 mục asset `eb*.png` vào [packages/game-data/animation-atlas.json](file:///e:/Pokemon/packages/game-data/animation-atlas.json) với kích thước và thông số chia lưới chính xác 100%.
- **Tái thiết kế 1:1 theo kịch bản gốc EBDX của Tác giả**:
  - `clamp` (ID 6366): Sử dụng 2 nửa vỏ sò màu xanh nước biển chân thực (`eb028_2.png`, góc xoay -90° và 90°, mirror đối xứng), khép chặt vào mục tiêu, kèm rung lắc mục tiêu, chớp sáng xanh nước biển màn hình `[153, 204, 255, 120]` và âm thanh kẹp `Anim/Wrap`.
  - `cut` (ID 78): Vệt chém sắc bén `eb602_4`, chớp trắng, âm chém `EBDX/Anim/ground1` & `normal3`.
  - `cross_chop` (ID 6383): Hai nhát chém karate `eb602_8` đan chéo chữ X góc -45°/45°, rung giật chớp nâu `[131, 84, 42, 140]`, âm `EBDX/Anim/normal1`.
  - `cross_poison` (ID 6377): Hai nhát chém độc `eb602_5` đan chéo chữ X kèm giọt độc tím tung tóe `eb427_2`, chớp tím `[180, 51, 185, 140]`, âm `Anim/Poison` & `normal3`.
  - `close_combat` (ID 65): Vệt tốc độ `eb086_bg` kết hợp các cú đấm đá dồn dập `eb086` & `eb086_2`, âm va chạm `Anim/hit`.
  - `crunch` (ID 75): Bộ hàm nanh nhọn sắc bén bóng tối `eb028` kết hợp hạt nổ bóng tối `eb024` khép chặt nghiền nát mục tiêu, âm `Anim/Super Fang`.
  - `crush_grip` (ID 6378): Kẹp vàng khổng lồ `eb028_4` siết chặt mục tiêu, chớp vàng, âm `Anim/Wrap`.
  - `coil` (ID 6367): Mãng xà tím `eb028_7` quấn quanh người thi triển, chớp độc tím, âm `EBDX/Anim/poison1`.
  - `charm` (ID 63): Trái tim hồng `eb636` bay dập dờn từ người dùng sang mục tiêu và phát nổ, âm `Anim/Love` & `LoveSplatter`.
  - `clear_smog` (ID 64): Khói độc đen xám đậm đặc `eb59_2` tỏa ra bao phủ mục tiêu, âm `EBDX/Anim/ground1`.
  - `confuse_ray` (ID 71): Các đốm sáng ảo ảnh `eb246_2` xoay vòng quanh mục tiêu, âm `Anim/Psych Up` & `NightShade`.
  - `crabhammer` (ID 6376): Càng cua giáng xuống kèm cột nước bùng nổ `eb540` & `eb540_2/3`, âm `Anim/Water1`.
  - `crush_claw` (ID 76): Vết móng vuốt cào đỏ rực `eb057_3`, âm `EBDX/Anim/normal3`.
  - `calm_mind` (ID 6402): Luồng hào quang tâm linh dâng trào `eb615_4` bao quanh người dùng, âm `EBDX/Anim/psychic1`.
  - `charge` (ID 62): Luồng tia điện tụ lực `eb081` & `eb081_2`, âm `Anim/Flash3` & `Saint8`.
  - `charge_beam` (ID 6362): Tia laser điện trường bắn thẳng từ người dùng sang mục tiêu `eb078` & `eb081`, âm `Anim/Flash` & `Paralyze1`.
  - `chatter` (ID 6363): Các nốt nhạc ríu rít `eb010` & `eb244_5/6/7` bay sang mục tiêu, âm `EBDX/Anim/normal2`.
  - `conversion` (ID 6371): Các khối dữ liệu lập phương quét quanh người dùng `eb458_10/11`, âm `Anim/Saint4`.
  - `cotton_spore` (ID 73): Bào tử bông gòn `eb59_9` rơi lả tả xuống mục tiêu, âm `EBDX/Anim/ground1`.
  - `counter` (ID 74): Khiên chắn phản đòn lóe sáng `eb606`, âm `EBDX/Anim/psychic2` & `shine1`.
  - `comet_punch` (ID 66): Chuỗi nắm đấm liên hoàn `eb244_2`, âm `EBDX/Anim/normal2`.
  - `curse` (ID 77): Cây đinh ma quái cắm xuống với âm thanh `Anim/Darkness6`.
- **Nâng cấp Bộ Lọc Visual QA Gallery ([apps/web/src/battle/animation/animation-gallery.ts](file:///e:/Pokemon/apps/web/src/battle/animation/animation-gallery.ts) & [packages/game-data/reunion-moves.json](file:///e:/Pokemon/packages/game-data/reunion-moves.json))**:
  - Tạo tệp dữ liệu phân loại `reunion-moves.json` phân tách rõ ràng `allReunionMoves` (403 chiêu thức có trong Reunion 4.2) và `optimizedMoves` (22 chiêu thức đã tối ưu 1:1 theo bản gốc).
  - Tái cấu trúc menu dropdown bộ lọc chiêu thức theo đúng thứ tự ưu tiên kiểm thử:
    1. **Full animation move (556 moves)**: Hiển thị toàn bộ chiêu thức có animation.
    2. **Move Pokemon Reunion EX Trilogy 4.2 (403 moves)**: Chỉ hiển thị các chiêu thức xuất xứ từ Reunion 4.2.
    3. **Chiêu thức Pokemon Reunion EX Trilogy 4.2 đã tối ưu như bản gốc (22 moves)**: Chỉ hiển thị các chiêu thức đã hoàn tất đối soát và tối ưu chuẩn 1:1 theo yêu cầu.
  - Tự động gắn nhãn badge `[1:1 REUNION]` cho các chiêu đã tối ưu, `[REUNION 4.2]` cho chiêu gốc, và hiển thị rõ ràng `Source Pack` trên thanh HUD.
- **Đồng bộ hóa Manifest & Hệ thống Kiểm tra**:
  - Cập nhật số frame, graphic, timing trong `packages/game-data/animations/manifest.json` và `packages/game-data/last-chance-animation-manifest.json`.
  - Toàn bộ 48/48 file test (592/592 unit tests) pass 100%.
  - Typecheck sạch 0 lỗi (`npm run typecheck:web`).
  - Prettier format chuẩn 100% (`npm run format:check`).
  - Không thiếu bất kỳ sprite hay âm thanh SE nào.

---

## Cập nhật trước đó: 2026-10-13 (Sửa Animation Blizzard dùng PRAS Blizzard BG/FG)

### 1.07. Sửa timeline Fly:

- `fly` dùng Animation ID `119`, thay asset cũ `fly copy.png` bằng toàn bộ chuỗi pattern của `Fly.png`.
- Frame `1–8`: ghép các cặp `0+1`, `2+3`, `4+5` rồi đẩy toàn bộ hiệu ứng lên khỏi màn hình.
- Frame `9–14`: tiếp tục ghép các cặp tương ứng phía trên Enemy rồi hạ xuống Enemy.
- Không còn tách nửa trái/phải thành frame riêng và không dùng `Fly-2.png` cho timeline này.
- Script tái lập: `scripts/animation/patch_fly_timeline.py`.

### 1.08. Đảo chiều quỹ đạo Blue Flare và Bolt Strike khi Enemy tung:

- Các cel `focus: "user"` và `focus: "target"` tiếp tục tự bám đúng bên thi triển/đối thủ.
- Các cel `focus: "screen"` được đánh dấu `mirrorPositionOnEnemy` để đảo trục X: `128 ↔ 384`.
- Enemy tung sẽ phóng từ phía Enemy, bay lên, xuất hiện phía trên Player và rơi xuống Player ở frame kết thúc.
- `bounce` cũng dùng cùng cơ chế đảo tọa độ màn hình cho pha rơi: `384 → 128` khi Enemy là bên thi triển.

### 1.09. Sửa animation Bubble:

- `bubble` dùng Animation ID `53` và giữ spritesheet `008-Weapon03`.
- Thay các cel bị chồng cùng tọa độ bằng luồng nhiều bong bóng tách biệt, kích thước lớn → nhỏ, bay liên tục từ User tới Target.
- Bổ sung lệch X/Y và nhịp dao động riêng cho từng bong bóng để tránh tạo thành một hàng thẳng đều.
- Các bong bóng dùng `mirrorPositionOnEnemy` để quỹ đạo tự đảo khi Enemy tung chiêu.
- Script tái lập: `scripts/animation/patch_bubble_timeline.py`.

### 1.10. Sửa animation Bug Bite:

- `bug_bite` dùng Animation ID `6357`, thay `last-chance/Crunch.png` bằng `PRAS- Bug Bite.png`.
- Frame `1–7`: nhiều hạt Bug Bite bung ra theo vòng quanh Target, không bay thành một projectile.
- Frame `8–10`: flash/impact pattern `4→5→5` tại Target.
- Script tái lập: `scripts/animation/patch_bug_bite_timeline.py`.

### 1.11. Sửa animation Bug Buzz:

- `bug_buzz` dùng Animation ID `6358`, thay `last-chance/Psycho Cut.png` bằng `PRAS- Bug Buzz.png`.
- Frame `1–5`: các xung sóng âm cong phát ra từ User và di chuyển tới Target.
- Frame `6–10`: vòng sóng mở rộng tại Target.
- Frame `11–15`: vòng sóng lớn tiếp tục lan ra và mờ dần.
- Script tái lập: `scripts/animation/patch_bug_buzz_timeline.py`.

### 1.02. Sửa timeline Blue Flare:

- `blue_flare` dùng Animation ID `50` và spritesheet `Fire3.png` (25 pattern, grid `5×5`).
- Frame `0–12`: tụ lực tại người thi triển (`focus: "user"`).
- Frame `12–13`: đẩy pattern lên ngoài viewport (`y: -96`) để tạo cảm giác bắn vọt từ dưới lên; frame `11` là frame cuối còn ở người dùng.
- Frame `14–19`: năng lượng ở phía trên Enemy và rơi xuống bằng tọa độ màn hình (`focus: "screen"`).
- Frame `20–24`: phát nổ trên Enemy (`focus: "target"`).
- Script tái lập: `scripts/animation/patch_blue_flare_timeline.py`.

### 1.03. Sửa timeline Bolt Strike:

- `bolt_strike` dùng Animation ID `6341` với asset `last-chance/Trovao.png`.
- Frame `1–5`: tụ lực tại người dùng; frame `6–12`: tia điện bắn thẳng lên trên bằng `focus: "screen"`.
- Frame `13`: tia điện biến mất ngoài viewport; frame `14–17`: xuất hiện trên cao và rơi xuống Enemy.
- Frame `18`: impact mở rộng trên Enemy bằng `focus: "target"`; tổng timeline giữ nguyên 18 frame gốc.
- Script tái lập: `scripts/animation/patch_bolt_strike_timeline.py`.

### 1.04. Đổi asset Bone-mérang:

- `bonemerang` vẫn dùng Animation ID `6349` và giữ nguyên timing/vị trí/focus của timeline hiện có.
- Thay spritesheet bong bóng `last-chance/WaterBubbles.png` bằng `PRAS- BoneMerang.png`.
- Chuyển pattern cũ `20–24` sang pattern riêng `0–4` của spritesheet mới; đăng ký atlas `5×2`, cell `192×192`.
- Script tái lập: `scripts/animation/patch_bonemerang_asset.py`.

### 1.05. Sửa animation Boomburst:

- `boomburst` Player (`6400`) và Enemy (`6401`) chuyển từ `Cosmo-01.png` sang `PRAS- Uproar.png`.
- Pattern được chạy liên tục `0→9` theo chuỗi sóng âm nhỏ dần/lớn dần; giữ nguyên số frame, vị trí và focus của hai timeline.
- Atlas mới: `960×768`, cell `192×192`, lưới `5×4`, `maxPattern: 20`.
- Script tái lập: `scripts/animation/patch_boomburst_timeline.py`.

### 1.06. Sửa animation Bounce hai lượt:

- `bounce` vẫn dùng Animation ID `6352` và asset `last-chance/fly copy.png`.
- Frame `1–6`: Pokémon bật lên từ vị trí người dùng và bay khỏi viewport; frame `7–8`: giữ trạng thái ngoài màn hình.
- Frame `9–13`: xuất hiện phía trên Enemy và rơi xuống; frame `14`: chạm Enemy.
- Không thay đổi logic sát thương hoặc danh sách chiêu hai lượt; script tái lập là `scripts/animation/patch_bounce_timeline.py`.

### 1.01. Sửa asset Blizzard:

- **Trạng thái:** Đã hoàn thành phần dữ liệu và runtime hỗ trợ layered cel.
- `blizzard` vẫn giữ Animation ID `6340`, nhưng timeline `packages/game-data/animations/last-chance/6340.json` nay chạy 12 frame đồng bộ từ `PRAS- Blizzard BG.png` và `PRAS- Blizzard FG.png`.
- Đăng ký hai atlas asset `pras-blizzard-bg` và `pras-blizzard-fg` với cell `128×128`, grid `4×3`, `maxPattern: 12`.
- Mỗi frame dùng `focus: "screen"`; BG `priority: 0`, FG `priority: 1`, zoom `400%` để phủ viewport `512×384`.
- Runtime cho phép cel chỉ định `graphic` riêng, đồng thời preload tất cả graphic được timeline sử dụng.
- Kiểm tra: Typecheck PASS; 47/47 test files, 584/584 tests PASS. Validator schema còn báo lỗi asset cũ không liên quan: `blast-burn-columns` thiếu `Blast-Burn-Columns.png`.
- Điều chỉnh hiển thị: Blizzard FG dùng opacity `128/255` (50%) và `priority: 0` để nằm sau cả Player lẫn Enemy.

## Cập nhật lần cuối: 2026-10-12 (Tích Hợp Mở Rộng EBDX Moves / Last Chance 334 Animation Mới, Cập Nhật Animation Nâng Cấp Thay Thế & Hỗ Trợ Fairy Fallback)

### 1.00. Tích Hợp Mở Rộng EBDX Moves & Cập Nhật Animation Thay Thế:

- **Trạng thái:** Hoàn thành 100%. Chuỗi CI (`npm run ci`) đạt chuẩn 100% sạch (Validate schemas 1069 animations & atlas parity, ESLint 0 errors / 0 warnings, Prettier 100%, Typecheck sạch 0 lỗi, 47/47 tệp test - 584/584 tests pass, Production build thành công).
- **1. File đã thay đổi:**
  - [move-animation-extensions.json](file:///e:/Pokemon/packages/game-data/move-animation-extensions.json): Bổ sung `replacedMoves` (7 moves: `screech`, `light_screen`, `whirlwind`, `rolling_kick`, `stealth_rock`, `sunny_day`, `sandstorm`) và `replacedOpponentMoves` (`stealth_rock`) để thay thế animation cũ bằng animation mới nâng cấp từ bản mở rộng, cập nhật `counts`.
  - [animation-fallbacks.json](file:///e:/Pokemon/packages/game-data/animation-fallbacks.json): Bổ sung fallback hệ `FAIRY` (`physicalmove`: `play_rough` từ extension, `specialmove`: `swift`, `statusmove`: `charm`).
  - [types.ts](file:///e:/Pokemon/apps/web/src/battle/animation/types.ts): Mở rộng `BattleAnimationDefinition` với các trường siêu dữ liệu `sourcePack?: string;` và `sourceAnimationId?: number;`.
  - [animation-registry.ts](file:///e:/Pokemon/apps/web/src/battle/animation/animation-registry.ts): Cập nhật thứ tự ưu tiên tra cứu trong `resolveAnimationId()` (`replacedMoves` / `replacedOpponentMoves` > `moveMap` > `moveExtensions`), giải quyết fallback move từ cả bản gốc lẫn bản mở rộng, bổ sung helper `isReplacedMove()` và `isExtensionMove()`.
  - [animation-gallery.ts](file:///e:/Pokemon/apps/web/src/battle/animation/animation-gallery.ts): Mở rộng `GALLERY_MOVE_MAP` nạp cả replaced moves, bổ sung badge nhãn hiển thị `[CẬP NHẬT]` / `[EBDX/LC]`, thêm bộ lọc `Chỉ chiêu Cập Nhật Mới` và `Chỉ chiêu Mở Rộng EBDX / Last Chance`, cập nhật HUD hiển thị `Source Pack` động.
  - [validate-animation-atlas.mjs](file:///e:/Pokemon/scripts/animation/validate-animation-atlas.mjs): Kiểm tra toàn diện 1069 animation, kích hoạt validator cho `replacedMoves` và `replacedOpponentMoves`, hỗ trợ fallback move trỏ tới extension pack.
  - [battle-timeline-animations.test.ts](file:///e:/Pokemon/apps/web/test/battle-timeline-animations.test.ts): Mở rộng test suite kiểm thử tra cứu 334 chiêu mở rộng (`earthquake`, `surf`, `ice_beam`, `hyper_beam`, `aura_sphere`, `draco_meteor`, `play_rough`), kiểm thử độ ưu tiên của các chiêu cập nhật thay thế và fallback hệ Fairy.
- **2. Danh mục Animation được bổ sung & cập nhật thay thế:**
  - **Bổ sung 334 chiêu thức mới (EBDX / Last Chance):** Bao gồm các chiêu quan trọng bậc nhất trước đó phải fallback về Tackle/Punch: `earthquake` (6416), `surf` (6642), `ice_beam` (6479), `hyper_beam` (6476), `aura_sphere` (6330), `draco_meteor` (6397), `play_rough` (6539), `dark_pulse` (6379), `dragon_pulse` (6398), `stone_edge` (6586), `flash_cannon` (6432), `giga_drain` (6443), `heat_wave` (6455), `hydro_pump` (6463), `blizzard` (6340), `air_slash` (6309), v.v.
  - **Cập nhật thay thế chiêu thức cũ có animation nâng cấp:**
    - `screech`: Thay thế ID 239 (sprite Growl cũ) bằng ID 6731 (sóng siêu âm đồng tâm Hypnosis + Lock on).
    - `light_screen`: Thay thế ID 183 (vệt chém vàng) bằng ID 6490 (khiên lục giác ánh sáng trong suốt `normal2`).
    - `whirlwind`: Thay thế ID 294 (làn gió 8 frame) bằng ID 6688 (lốc xoáy cuồng phong 19 frame `water3`).
    - `rolling_kick`: Thay thế ID 233 (8 frame) bằng ID 6586 (cú đá xoáy liên hoàn 10 frame).
    - `stealth_rock`: Thay thế ID 263 (30 frame có lỗi pattern cũ) bằng ID 6260 (8 frame đá bẫy lơ lửng sạch sẽ).
    - `stealth_rock (Enemy)`: Thay thế ID 264 bằng ID 6261 (8 frame đối xứng chuẩn).
    - `sunny_day`: Thay thế ID 269 (16 frame) bằng ID 6266 (9 frame vầng thái dương rực rỡ).
    - `sandstorm`: Thay thế ID 236 (10 frame) bằng ID 6591 (6 frame bão cát xoay chuyển).
  - **Fallback hệ Fairy:** Bổ sung fallback chuẩn hệ Fairy, trong đó move vật lý unmapped sẽ tự động sử dụng `play_rough` (6539).
- **3. Kết quả kiểm thử CI Monorepo:**
  - `validate:schemas`: PASS (Toàn bộ 1069 animation và atlas metadata đạt 100%).
  - `lint`: PASS (0 errors, 0 warnings).
  - `format:check`: PASS (100% Prettier code style).
  - `typecheck:web`: PASS (0 lỗi TypeScript).
  - `test:web`: PASS (47/47 tệp test, 584/584 tests pass).
  - `build:web`: PASS (Production bundle build thành công trong 1m 21s).
  - `npm run ci`: PASS 100%.

---

## Cập nhật trước đó: 2026-10-12 (Khắc Phục Sai Hướng & Lệch Vị Trí Battle Animation: Transform Both, Direction Mirror, Multi-hit hitNum, Atlas Sanitization & Visual QA Gallery)

### 0.99. Khắc Phục Sai Hướng & Lệch Vị Trí Battle Animation:

- **Trạng thái:** Hoàn thành 100%. Chuỗi CI (`npm run ci`) đạt chuẩn 100% sạch (Validate schemas & atlas parity, ESLint 0 errors / 0 warnings, Prettier 100%, Typecheck sạch 0 lỗi, 47/47 tệp test - 578/578 tests pass, Production build thành công).
- **1. File đã thay đổi:**
  - [types.ts](file:///e:/Pokemon/apps/web/src/battle/animation/types.ts): Thêm interface `AnimationViewport` và trường `viewport` tùy chọn trong `BattleAnimationRequest`.
  - [coordinate-transformer.ts](file:///e:/Pokemon/apps/web/src/battle/animation/coordinate-transformer.ts): Triển khai thuật toán tính toán `focus: 'both'` theo tỷ lệ đơn trục X của engine nguồn Essentials, hàm thuần `isDirectionReversed()`, hằng số `DEFAULT_ANIMATION_VIEWPORT` (512×288) và hỗ trợ viewport chuẩn hóa.
  - [cel-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/animation/cel-renderer.ts): Bổ sung `shouldMirrorCel()`, loại bỏ việc ép clamp tọa độ trong `renderCel` để canvas clip rect xử lý tự nhiên.
  - [animation-registry.ts](file:///e:/Pokemon/apps/web/src/battle/animation/animation-registry.ts): Thêm tham số `hitNum` vào `resolveAnimationId()`, tra cứu `baseAnimationId + hitNum` với cơ chế fallback và log warning khi thiếu variant, bổ sung helper `hasDefinition()`.
  - [animation-player.ts](file:///e:/Pokemon/apps/web/src/battle/animation/animation-player.ts): Kết nối `hitNum`, bảo vệ callback `onHit` / `onComplete` chỉ gọi duy nhất 1 lần, preload asset an toàn với try/catch, áp dụng `ctx.clip()` theo battle viewport và truyền `isFlightReversed` xuống renderer.
  - [battle-controller.ts](file:///e:/Pokemon/apps/web/src/battle/battle-controller.ts): Thêm tham số `hitNum = 0` vào `playMoveVfx` và truyền vào `battleAnimationPlayer.play()`.
  - [animation-gallery.ts](file:///e:/Pokemon/apps/web/src/battle/animation/animation-gallery.ts): Bổ sung bộ chọn multi-hit `hitNum` (Hit 1–5), bộ lọc move (`focus: both`, `multihit`), nút reload definition, toggle clip rect, vẽ đường nối quỹ đạo User $\to$ Target kèm mũi tên chỉ hướng, và active cels inspector (raw coords, resolved coords, mirror draw).
  - [179.json](file:///e:/Pokemon/packages/game-data/animations/179.json), [192.json](file:///e:/Pokemon/packages/game-data/animations/192.json), [23.json](file:///e:/Pokemon/packages/game-data/animations/23.json), [263.json](file:///e:/Pokemon/packages/game-data/animations/263.json), [264.json](file:///e:/Pokemon/packages/game-data/animations/264.json), [54.json](file:///e:/Pokemon/packages/game-data/animations/54.json): Vệ sinh các pattern vượt quá `maxPattern` của atlas.
  - [import_source_animations.py](file:///e:/Pokemon/scripts/animation/import_source_animations.py): Bổ sung từ điển quy tắc chuẩn hóa `PATTERN_CORRECTIONS` cho trình trích xuất.
  - [validate-animation-atlas.mjs](file:///e:/Pokemon/scripts/animation/validate-animation-atlas.mjs) & [validate-schemas.mjs](file:///e:/Pokemon/scripts/validate-schemas.mjs): Tích hợp kiểm thử tự động toàn diện atlas bounds và animation definitions vào CI.
  - [battle-timeline-animations.test.ts](file:///e:/Pokemon/apps/web/test/battle-timeline-animations.test.ts): Cập nhật giá trị kỳ vọng tính toán single-progress và mở rộng 6 nhóm test suite mới (34/34 tests pass).
- **2. Quy tắc transform/mirror đã áp dụng:**
  - **Transform `focus: 'both'`**: Sử dụng tỷ lệ đơn trục `progress = (px - src1.x) / (src2.x - src1.x)`, áp dụng đồng thời cho `dst1.x + progress * dstDx` và `dst1.y + progress * dstDy`. Giữ ngoại lệ neo cho cel tác giả ghi thiếu `(0, 0)`.
  - **Quy tắc Mirror**: So sánh hướng nguồn `sourceUser.x < sourceTarget.x` với hướng thực tế `actualUser.x < actualTarget.x` qua `isDirectionReversed()`. Nếu hai hướng ngược nhau, đảo cờ `cel.mirror` **chỉ khi** `cel.focus === 'both'`. Giữ nguyên cờ mirror gốc cho các cel `user`, `target`, `screen`.
  - **Chuẩn hóa Viewport**: Hệ quy chiếu mặc định 512×288 cho cả Battle Screen và Gallery, không cắt cel bằng bounding box cưỡng bức mà để canvas clip rect quản lý biên.
- **3. Số move, OppMove và multi-hit đã kiểm thử:**
  - 212/212 standard moves được kiểm thử resolution và mapping thành công.
  - 18/18 `OppMove` variants được kiểm thử kích hoạt đúng khi đối thủ là Enemy.
  - Multi-hit `hitNum` được kiểm thử với `hitNum = 0..4` (Comet Punch 66..70, DoubleSlap 86..90), fallback an toàn kèm cảnh báo khi không có variant, và không áp dụng hitNum cho generic type fallback.
- **4. Các pattern/asset còn cảnh báo:**
  - Không còn cảnh báo nào. Tất cả 311 timeline animations và 95 atlas metadata đều hợp lệ 100% trong `validate-animation-atlas.mjs`.
- **5. Kết quả test, lint, typecheck, build và CI:**
  - `validate:schemas`: PASS (toàn bộ 311 animations và atlas metadata đạt chuẩn).
  - `lint`: PASS (0 errors, 0 warnings).
  - `format:check`: PASS (100% file đúng chuẩn Prettier).
  - `typecheck:web`: PASS (0 lỗi TypeScript).
  - `test:web`: PASS (47/47 test files, 578/578 tests pass).
  - `build:web`: PASS (production bundle hoàn tất).
  - `npm run ci`: PASS 100%.
- **6. Danh sách visual case đã mở trong Gallery:**
  - Player: `Acid`, `Energy Ball`, `Growl`, `Outrage`, `Water Gun`, `Stealth Rock`, `Absorb`, `BubbleBeam`.
  - Enemy: các move trên (hướng bay đối xứng từ Enemy $\to$ Player, không bị lật kép `mirror`).
  - Self-target: `Protect`, `Swords Dance`, `Dragon Dance`, `Reflect` (hiển thị trên người dùng, không nhảy sang đối phương).
  - Multi-hit: `Fury Attack`, `Comet Punch`, `Double Slap` (selector `hitNum` 1, 2, 3, 4, 5).
- **7. Các vấn đề còn lại (ghi chú theo Section 7 hướng dẫn):**
  - **Chưa triển khai**: Bổ sung toàn bộ asset EBDX Moves/Ballburst/Weather còn thiếu.
  - **Chưa triển khai**: Viết lại animation timeline mới cho move không có dữ liệu nguồn.
  - **Chưa triển khai**: Thay đổi công thức sát thương hoặc hiệu ứng status.
  - **Chưa triển khai**: Thêm cơ chế multiplayer/backend authoritative.
  - **Chưa triển khai**: Xóa hẳn custom animation legacy trước khi có visual regression pass.
  - **Chưa triển khai**: Tối ưu bundle tiếp khi chưa giải quyết xong correctness của transform và mirror.

---

## Cập nhật trước đó: 2026-10-12 (Chuẩn Hóa Tọa Độ 4-Focus Animation Essentials, Battler Geometry & Khắc Phục Lỗi TypeScript Test Suite)

### 0.98. Chuẩn Hóa Tọa Độ 4-Focus Battle Animation Theo Chuẩn Essentials & Sửa Lỗi TypeScript Test Suite:

- **Trạng thái:** Hoàn thành 100%. Chuỗi CI (`npm run ci`) đạt chuẩn 100% (Validate schemas, ESLint 0 errors / 0 warnings, Prettier 100%, Typecheck sạch 0 lỗi, 47/47 tệp test - 557/557 tests pass, Production build thành công).
- **Yêu cầu & Vấn đề giải quyết:**
  1. **Lỗi Lệch Tọa Độ Hoạt Họa Trận Đấu (Battle Animation Misplacement):**
     - Các hoạt họa như Flamethrower, Water Gun, Bite/Crunch bị văng ra rìa màn hình hoặc gắn nhầm vào bản thân người thi triển thay vì mục tiêu.
     - Nguyên nhân: Trước đó mọi focus (`user`, `target`, `both`) đều bị chiếu sai qua phép biến đổi đường thẳng User $\to$ Target và cộng thêm `SRC_USER`/`SRC_TARGET`, đồng thời đảo ngược tọa độ X toàn cục cho đối thủ khiến các hoạt họa target bị đẩy ra ngoài vùng hiển thị 512×288.
  2. **Chuẩn Hóa Hệ Thống Tọa Độ 4-Focus Chuẩn Pokémon Essentials ([coordinate-transformer.ts](file:///e:/Pokemon/apps/web/src/battle/animation/coordinate-transformer.ts)):**
     - Tái cấu trúc logic tính toán tọa độ theo đúng chuẩn Essentials (`007_BattleAnimationPlayer.rb`):
       - `focus: 'user'`: Neo trực tiếp vào vị trí người ra đòn (`userPos.x + (celX - SRC_USER.x)`, `userPos.y + (celY - SRC_USER.y)`).
       - `focus: 'target'`: Neo trực tiếp vào vị trí mục tiêu (`targetPos.x + (celX - SRC_TARGET.x)`, `targetPos.y + (celY - SRC_TARGET.y)`).
       - `focus: 'both'`: Nội suy tuyến tính theo quỹ đạo ảo kết nối giữa user và target (`transformPoint(SRC_USER, SRC_TARGET, userPos, targetPos, celX, celY)`).
       - `focus: 'screen'`: Co giãn trực tiếp từ canvas ảo 512×384 sang viewport 512×288 (`(celX * canvasWidth) / 512`, `(celY * canvasHeight) / 384`).
     - Chuẩn hóa hình học vị trí Pokémon (`BattlerGeometry`):
       - Export `DEFAULT_PLAYER_GEOMETRY`, `DEFAULT_ENEMY_GEOMETRY` và `getBattlerCenter()`.
       - Loại bỏ việc đảo `-celX` toàn cục đối với đối thủ.
  3. **Tối Ưu Hiển Thị & Visual QA Gallery ([cel-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/animation/cel-renderer.ts), [animation-gallery.ts](file:///e:/Pokemon/apps/web/src/battle/animation/animation-gallery.ts)):**
     - Đảo ngược cờ `mirror` của cel đối với đối thủ **chỉ khi** `cel.focus === 'both'` (đảo chiều đường đạn projectile), bảo toàn nguyên vẹn hướng lật gốc cho các cels thuộc `user`, `target`, và `screen`.
     - Gallery chuyển sang canvas 512×288 kèm CSS pixelated scaling và đồng bộ bục đứng platform theo đúng battler center.
  4. **Khắc Phục Lỗi TypeScript Test Suite ([screens-trickroom-substitute.test.ts](file:///e:/Pokemon/apps/web/test/screens-trickroom-substitute.test.ts)):**
     - Loại bỏ thuộc tính không hợp lệ `toxicTurns: 0` trên `MockBattlerPokemon`.
  5. **Bộ Unit Test Chuyên Sâu ([battle-timeline-animations.test.ts](file:///e:/Pokemon/apps/web/test/battle-timeline-animations.test.ts)):**
     - Bổ sung 5 bài test thực tế cho các chiêu: Flamethrower (focus target), Water Gun (focus both), Absorb (focus user/target), Thunderbolt, Bite/Crunch, battler geometry và screen focus scaling. Toàn bộ 15/15 tests pass.

---

## Cập nhật trước đó: 2026-10-11 (Hệ Thống Battle Animation Timeline Essentials/EBDX, Trích Xuất 311 Animations, 212 Moves & Gallery Visual QA)

### 0.97. Triển Khai Hệ Thống Battle Animation Timeline (Essentials/EBDX Engine):

- **Trạng thái:** Hoàn thành 100% tất cả các phase. Chuỗi CI (`npm run ci`) đạt chuẩn 100% (Validate schemas, ESLint 0 errors / 0 warnings, Prettier 100%, Typecheck sạch, 47/47 tệp test - 552/552 tests pass, Production build thành công).
- **Yêu cầu & Mục tiêu thực hiện:**
  1. **Không đọc trực tiếp Marshal trong TypeScript runtime:**
     - Tạo công cụ chuyển đổi ngoại tuyến [scripts/animation/import_source_animations.py](file:///e:/Pokemon/scripts/animation/import_source_animations.py) với monkey-patch Ruby Marshal reader giải quyết triệt để lỗi unmarshal `TYPE_UCLASS`.
     - Xuất thành công toàn bộ 311 animations từ `PkmnAnimations.rxdata` thành 311 file JSON riêng lẻ tại `packages/game-data/animations/[id].json` kèm `manifest.json`.
     - Xuất mapping 212 moves tiêu chuẩn và 18 biến thể `opponentMoves` sang [move-animation-map.json](file:///e:/Pokemon/packages/game-data/move-animation-map.json).
     - Trích xuất bảng fallback 17 hệ nguyên bản từ `animationmap.ebdx` sang [animation-fallbacks.json](file:///e:/Pokemon/packages/game-data/animation-fallbacks.json).
     - Sinh metadata atlas hình học chính xác cho 95 sprite sheet tại [animation-atlas.json](file:///e:/Pokemon/packages/game-data/animation-atlas.json).
  2. **Kiến Trúc Runtime Animation Player Độc Lập Refresh Rate:**
     - Xây dựng module dùng chung [apps/web/src/battle/animation/](file:///e:/Pokemon/apps/web/src/battle/animation/):
       - [types.ts](file:///e:/Pokemon/apps/web/src/battle/animation/types.ts): Định nghĩa kiểu dữ liệu `AnimationCel`, `AnimationFrame`, `AnimationTimingEvent`, `BattleAnimationDefinition`, `BattleAnimationRequest`.
       - [animation-registry.ts](file:///e:/Pokemon/apps/web/src/battle/animation/animation-registry.ts): Single source of truth phân giải `moveId` -> `animationId` với lazy loading glob từng animation, hỗ trợ cả định dạng gạch dưới và viết liền, opponent variants, và fallback theo hệ/category.
       - [animation-player.ts](file:///e:/Pokemon/apps/web/src/battle/animation/animation-player.ts): Player tính frame theo elapsed time (`elapsedMs * fps`), độc lập hoàn toàn với tần số quét (60Hz, 120Hz, 144Hz), phân tách rõ ràng lớp hiển thị trước và sau Pokémon battler (`renderBehind`, `renderAbove`).
       - [cel-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/animation/cel-renderer.ts): Render từng cel lên canvas: vị trí, góc xoay, tỷ lệ phóng to/thu nhỏ, lật gương khi địch dùng, độ trong suốt, blend mode (normal, additive, multiply) và hiệu ứng chớp màu (flash).
       - [coordinate-transformer.ts](file:///e:/Pokemon/apps/web/src/battle/animation/coordinate-transformer.ts): Chuyển đổi tọa độ nguồn (user, target, both, screen) sang tọa độ canvas thực tế của người chơi `(130, 215)` và đối thủ `(380, 115)`.
       - [layer-manager.ts](file:///e:/Pokemon/apps/web/src/battle/animation/layer-manager.ts): Phân loại cels theo độ sâu ưu tiên (priority 0/2 vẽ sau battler, priority 1/3 vẽ trước battler).
       - [timing-events.ts](file:///e:/Pokemon/apps/web/src/battle/animation/timing-events.ts): Xử lý âm thanh SE và chớp màn hình / Pokémon theo đúng timeline frame.
       - [animation-assets.ts](file:///e:/Pokemon/apps/web/src/battle/animation/animation-assets.ts): Nạp trước và cache bitmap thông qua Asset Registry an toàn trên cả trình duyệt và Vitest/Node.
  3. **Tích Hợp Battle Screen & Tách Biệt Nghiêm Ngặt Battle Logic:**
     - Kết nối [battle-controller.ts](file:///e:/Pokemon/apps/web/src/battle/battle-controller.ts), [battle-state.ts](file:///e:/Pokemon/apps/web/src/battle/battle-state.ts), [battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts) và [battle-screen.ts](file:///e:/Pokemon/apps/web/src/battle/battle-screen.ts).
     - Truyền `dtMs` tính từ elapsed timestamp trong vòng lặp game, loại bỏ hoàn toàn việc đếm frame theo số lần gọi `requestAnimationFrame`.
     - Phân tầng hiển thị đa lớp: `renderBehind` vẽ sau nền nhưng trước Pokémon battler; `renderAbove` vẽ đè lên Pokémon battler.
     - Giữ trọn vẹn 100% tính độc lập của logic sát thương, status, Ability và turn order — animation player chỉ nhận request và phát callback `onHit` / `onComplete`.
  4. **Phòng Thử Nghiệm Visual QA Debug Gallery ([animation-gallery.ts](file:///e:/Pokemon/apps/web/src/battle/animation/animation-gallery.ts)):**
     - Tạo giao diện Visual QA Gallery với danh sách toàn bộ 212 chiêu thức, nút Play/Pause/Replay/Next/Prev frame.
     - Tùy chọn phe tấn công (Player / Enemy mirror), thanh trượt tua frame trực quan (scrubber), tùy chỉnh tốc độ phát (0.25x - 2.0x).
     - HUD hiển thị chi tiết: Animation ID, Graphic Asset Key, Atlas Geometry, Thời lượng (ms), Số cels đang hoạt động tại frame hiện tại kèm thông số pattern, góc xoay, độ phóng, blend mode, và focus point.
     - Tích hợp nút mở nhanh trong menu Debug (`🎬 Mở Gallery Test Battle Animation`) và lệnh `window.__openAnimationGallery()`.
  5. **Kiểm Thử Toàn Diện & CI Gate:**
     - Bộ unit test chuyên biệt [battle-timeline-animations.test.ts](file:///e:/Pokemon/apps/web/test/battle-timeline-animations.test.ts) kiểm tra toàn diện 10 tiêu chí: Mapping, Biến thể đối thủ, Fallback hệ/category, Kích thước Atlas, Tọa độ chiếu, Phân tầng Layer, Tính độc lập tần số quét.
     - Toàn bộ 47 tệp test suites (552/552 tests) trong monorepo vượt qua 100%.

---

## Cập nhật trước đó: 2026-10-11 (Triển Khai Dữ Liệu Gen 9, Tích Hợp Ability Slot, Tối Ưu Chunk & Đạt Chuẩn CI 100%)

### 0.96. Triển Khai Dữ Liệu Gen 9, Tích Hợp Ability Slot Battle Factory & Clean CI Suite:

- **Trạng thái:** Đạt chuẩn 100% toàn bộ chuỗi CI (`npm run ci`):
  - **Validate Schemas:** PASS 100% (`validate-schemas.mjs`).
  - **Linter:** PASS (0 errors, 0 warnings trong `eslint .`).
  - **Code Formatter:** PASS 100% (`prettier --check` toàn bộ repo).
  - **Typecheck:** PASS (0 errors trong `tsc --noEmit`).
  - **Test Suite:** PASS 100% (46/46 tệp test, 542/542 tests pass).
  - **Production Build:** PASS (Tất cả bundle chunks đều < 500 kB, không còn bất kỳ cảnh báo chunk size nào).
- **Yêu cầu & Vấn đề giải quyết:**
  1. **Khắc phục tích hợp Ability Slot trong Battle:**
     - Hoàn thiện [battle-factory.ts](file:///e:/Pokemon/apps/web/src/battle/battle-factory.ts): `createBattler()` sử dụng trực tiếp mô hình hỗ trợ 3 slot Ability từ `data.abilities` (`primary`, `secondary?`, `hidden?`). Tự động phân bổ ngẫu nhiên 50/50 giữa Primary và Secondary nếu loài có 2 Ability thường, hỗ trợ tham số `customAbilitySlot` ('primary' | 'secondary' | 'hidden') và tự động suy luận slot khi truyền `customAbility`.
     - Sử dụng `defaultRng` cho việc sinh cá thể battler nhằm bảo toàn trọn vẹn chuỗi hạt giống của `BattleRng` trong suốt quá trình tính toán chiến đấu.
     - Cập nhật [party-state.ts](file:///e:/Pokemon/apps/web/src/domain/party/party-state.ts): `partyPokemonToBattler()` fallback an toàn theo `data.abilities[slot]`.
  2. **Dữ liệu Pokémon Gen 9 Chuẩn Hóa:**
     - Mô hình hỗ trợ 3 slot Ability (`primary`, `secondary?`, `hidden?`) cho 151 Pokémon theo Scarlet/Violet DLC. Đối với các loài chỉ có 1 Ability tự nhiên trong canon, mô hình giữ đúng cấu trúc nguyên bản (chỉ có `primary`).
     - Base Stats 151 Pokémon đồng bộ khớp 100% chuẩn Gen 9.
  3. **Mở Rộng Danh Mục TM001–TM229 & Alias Tương Thích:**
     - Đăng ký đủ 229 Đĩa Kỹ Thuật TM (`tm001`–`tm229`) trong [items-db.json](file:///e:/Pokemon/packages/game-data/items-db.json) và ánh xạ [item-catalog-effects.ts](file:///e:/Pokemon/apps/web/src/domain/inventory/item-catalog-effects.ts), giữ tương thích ngược toàn bộ `tm01`–`tm100` và `hm01`–`hm08`.
  4. **Cơ Chế Terastallization Trong Battle & Giao Diện:**
     - Giới hạn 1 lần/trận/bên; chuyển hệ phòng thủ thành đơn hệ `teraType`; STAB Terastal 2.0x (nếu trùng hệ gốc) hoặc 1.5x; chiêu `tera_blast` thích ứng hệ và category; nút bấm pha lê `💎 TERASTAL` và huy hiệu Databox trực quan.
  5. **Tối Ưu Phân Mảnh Bundle Chunks ([vite.config.ts](file:///e:/Pokemon/apps/web/vite.config.ts)):**
     - Tách `move-animations-db.json` sang chunk riêng biệt `move-animations-data` (~166 kB), đưa chunk `moves-data` từ 587 kB xuống còn ~420 kB. Toàn bộ bundle đều nằm dưới ngưỡng cảnh báo 500 kB.
  6. **Làm Sạch Toàn Diện Linter & Formatter:**
     - Khắc phục 2 lỗi empty catch block và type `any` trong [save-repository.ts](file:///e:/Pokemon/apps/web/src/domain/save/save-repository.ts).
     - Khắc phục các cảnh báo `any` trong [autosave-coordinator.ts](file:///e:/Pokemon/apps/web/src/domain/save/autosave-coordinator.ts) bằng kiểu `ReturnType<typeof setTimeout>`.
     - Khắc phục useless assignments trong custom animations ([flamethrower.ts](file:///e:/Pokemon/apps/web/src/battle/custom-animations/flamethrower.ts), [hydro-pump.ts](file:///e:/Pokemon/apps/web/src/battle/custom-animations/hydro-pump.ts), [shadow-ball.ts](file:///e:/Pokemon/apps/web/src/battle/custom-animations/shadow-ball.ts)).
     - Khắc phục unused variables/imports trong [battle-environment-presets.test.ts](file:///e:/Pokemon/apps/web/test/battle-environment-presets.test.ts) và [gen9-mechanics.test.ts](file:///e:/Pokemon/apps/web/test/gen9-mechanics.test.ts).
     - Đồng bộ code style Prettier trên toàn bộ 40+ tệp tin.

---

## Cập nhật trước đó: 2026-10-10 (Tiến Hóa Bằng Đá / Vật Phẩm Yêu Cầu Cầm Nắm & Tiêu Hao Khi Tiến Hóa)

### 0.95. Chuẩn Hóa Tiến Hóa Đá/Vật Phẩm Qua Cơ Chế Cầm Nắm (Held Item) & Tự Động Tiêu Hao:

- **Trạng thái:** Đã hoàn thành 100%. 39 tệp test suite (467/467 tests), Typecheck (`npm run typecheck`) đạt **0 errors / 0 warnings**.
- **Yêu cầu người dùng:** Đối với các Pokémon dùng đá tiến hóa hoặc cần vật phẩm, người chơi phải cho Pokémon giữ vật phẩm đó mới được tiến hóa và vật phẩm sẽ bị tiêu hao khi tiến hóa.
- **Chi tiết đã thực hiện:**
  1. **Quy Tắc Tiến Hóa Cầm Nắm ([evolution-rules.ts](file:///e:/Pokemon/apps/web/src/domain/pokemon/evolution-rules.ts)):**
     - Bổ sung helper `isPokemonHoldingItem(pokemon, requiredItem)` và `normalizeItemKey`: chuẩn hóa so sánh mã vật phẩm không phân biệt định dạng (ví dụ `thunder-stone`, `thunder_stone`).
     - Cập nhật `canPokemonEvolve(pokemon)`:
       - Đối với nhánh tiến hóa `stone` hoặc `item`, chỉ cho phép tiến hóa khi Pokémon **đang cầm giữ vật phẩm yêu cầu** (`pokemon.heldItem`).
       - Nếu chưa giữ: Thông báo lý do rõ ràng `Cần cho Pokémon giữ ${requiredItemNameVi} để tiến hóa`.
     - Cập nhật `getAvailableEvolutions(pokemon)`: Lọc chính xác các nhánh tiến hóa tương ứng với vật phẩm Pokémon đang cầm.
  2. **Tiêu Hao Vật Phẩm Khi Tiến Hóa ([evolution-rules.ts](file:///e:/Pokemon/apps/web/src/domain/pokemon/evolution-rules.ts)):**
     - Trong `applyEvolution(pokemon, targetSpeciesKey)`: Khi tiến hóa hoàn tất, nếu nhánh tiến hóa yêu cầu đá/vật phẩm, vật phẩm đang giữ trên Pokémon tự động bị tiêu hao (`pokemon.heldItem = null`).
     - Loại bỏ việc trừ trùng lặp trong túi đồ (`inventoryService.removeItem`) tại [party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts), [storage-screen.ts](file:///e:/Pokemon/apps/web/src/ui/storage-screen.ts) và [evolution-notification.ts](file:///e:/Pokemon/apps/web/src/ui/evolution-notification.ts), vì vật phẩm đã được trừ khỏi túi đồ ngay khi người chơi cho Pokémon giữ vật phẩm qua giao diện Túi đồ.
  3. **Kiểm Thử & Đảm Bảo Độ Ổn Định ([evolution.test.ts](file:///e:/Pokemon/apps/web/test/evolution.test.ts), [evolution-notification.test.ts](file:///e:/Pokemon/apps/web/test/evolution-notification.test.ts)):**
     - Kiểm thử Pikachu chỉ tiến hóa khi cầm `thunder-stone`, không tiến hóa nếu chưa cầm.
     - Kiểm thử Eevee tiến hóa đa nhánh tùy theo loại đá đang cầm (`water-stone` -> Vaporeon, `thunder-stone` -> Jolteon, `fire-stone` -> Flareon).
     - Kiểm thử vật phẩm được tự động tiêu hao sau khi `applyEvolution`.
     - Toàn bộ 467/467 tests pass 100%, 0 lỗi TypeScript.

---

## Cập nhật trước đó: 2026-10-10 (Khắc Phục 100% Lỗi TypeScript Trong Test Suite)

### 0.94. Chuẩn Hóa Type Safety & Khắc Phục Lỗi TypeScript Trong Test Suite:

- **Trạng thái:** Đã hoàn thành 100%. Typecheck (`npx tsc --noEmit`) đạt **0 errors / 0 warnings**, 39/39 tệp test suite (466/466 tests) đạt kết quả **PASS 100%**.
- **Vấn đề từ IDE / Người dùng:** Danh sách lỗi type trong hai tệp test:
  1. `screens-trickroom-substitute.test.ts`: Thiếu `description` trong các khai báo `BattleMove`, thiếu `total` trong `PokemonStats`, sai kiểu `id` (string thay vì number), thiếu `target` trong `MoveStatusEffect`, sai literal value `target: "target"` thay vì `"opponent"`.
  2. `special-support-moves.test.ts`: Thiếu `description` ở chiêu `baton_pass`, `statStages` có thể là undefined.
- **Chi tiết đã thực hiện:**
  1. **[screens-trickroom-substitute.test.ts](file:///e:/Pokemon/apps/web/test/screens-trickroom-substitute.test.ts):**
     - Sửa `createMockBattler`: `id: 1` (number), `speciesKey: 'PIKACHU'`, `stats.total: 600`, bổ sung các trường bắt buộc của `BattlerPokemon` (`frontSprite`, `backSprite`, `iconSprite`, `gender`, `catchRate`, `exp`, `maxExp`).
     - Bổ sung trường bắt buộc `description: string` cho tất cả các khai báo `BattleMove` inline (`mortalSpin`, `dummyMove`, `trickRoomMove`, `tackle`, `swift`, `subMove`, `flamethrower`, `endureMove`, `lethalMove`, `stockpile`, `swallow`, `outrage`, `gigaDrain`, `braveBird`, `takeDownNormal`, `firePledge`, `grassPledge`, `metronomeMove`, `reflectMove`, `lightScreenMove`, `mistMove`, `physicalAtk`, `specialAtk`, `growlDebuff`).
     - Chuẩn hóa `MoveStatusEffect.target: 'opponent'` ở chiêu `flamethrower`.
     - Sửa `statChanges.target: 'opponent'` ở chiêu `growlDebuff`.
  2. **[special-support-moves.test.ts](file:///e:/Pokemon/apps/web/test/special-support-moves.test.ts):**
     - Bổ sung `description: 'Passes stat changes to replacement.'` cho chiêu `baton_pass`.
     - Dùng optional chaining `engine.playerPokemon.statStages?.speed` và `engine.playerPokemon.statStages?.attack`.
  3. **Kiểm tra & Xác thực:**
     - `npx tsc --noEmit` hoàn thành với mã thoát 0 (0 error).
     - Chạy lại các bài test, toàn bộ 36/36 tests trong 2 tệp đều pass 100%.

---

## Cập nhật trước đó: 2026-10-10 (Nút Tiến Hóa Xanh Dương Pixel, Giữ Avatar Icon Pokémon, & Badge Phím Tắt [R] Trực Quan)

### 0.93. Tinh Chỉnh Giao Diện Nút Tiến Hóa Xanh Dương Pixel, Giữ Avatar Pokémon & Bổ Sung Badge Phím Tắt [R] Trực Quan:

- **Trạng thái:** Đã hoàn thành 100%. 39 tệp test suite (466/466 tests), Typecheck (`npm run typecheck`), Build (`npm run build`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:**
  1. Loại bỏ các ký hiệu/icon tự thêm ở nút tiến hóa, đổi màu nút thành màu xanh dương pixel retro.
  2. Tại hộp thoại thông báo tiến hóa: Giữ nguyên icon avatar của Pokémon, chỉ loại bỏ các ký hiệu tự đưa vào (như icon `✨` lấp lánh ở tiêu đề).
  3. Bổ sung nút / huy hiệu phím tắt `[R]` trực quan trên nút tiến hóa để người chơi nhận diện và bấm phím tắt thuận tiện.
- **Chi tiết đã thực hiện:**
  1. **Nút Tiến Hóa Màu Xanh Dương Retro RPG ([style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Đổi bảng màu của `.summary-btn-evolve` và `.evo-notify-btn-evolve` sang màu xanh dương pixel cổ điển: Nền `#0284c7`, viền nổi `#7dd3fc`, bóng pixel 3D `#075985` và viền đổ bóng đen `#000`, chữ trắng `#ffffff`.
     - Loại bỏ hoàn toàn các ký hiệu lấp lánh (`.evolve-sparkle`) và mũi tên (`.evolve-arrow`), nút hiển thị chữ thuần túy `TIẾN HÓA` kèm huy hiệu phím tắt `[R]`.
  2. **Huy Hiệu Phím Tắt Pixel Retro [R] Trực Quan ([style.css](file:///e:/Pokemon/apps/web/src/style.css), [evolution-notification.ts](file:///e:/Pokemon/apps/web/src/ui/evolution-notification.ts), [party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts), [storage-screen.ts](file:///e:/Pokemon/apps/web/src/ui/storage-screen.ts)):**
     - Thiết kế `.evo-key-hint`: Khung phím bấm retro pixel nhỏ gọn (`#0f172a`), viền vàng `#facc15`, chữ vàng `#fef08a`, đổ bóng pixel 3D nổi bật. Khi hover đổi màu sáng tương tác.
     - Tích hợp badge `<span class="evo-key-hint">R</span>` trực tiếp trên:
       - Nút `#btnEvoNotifyAction` ở hộp thoại thông báo tiến hóa mép trái.
       - Nút `#btnPartySummaryEvolve` trong bảng chi tiết Pokémon thuộc Đội hình (Party Screen).
       - Nút `#btnStorageSummaryEvolve` trong bảng chi tiết Pokémon thuộc Máy tính PC (Storage Screen).
  3. **Giữ Avatar Pokémon & Tinh Gọn Hộp Thoại Thông Báo ([evolution-notification.ts](file:///e:/Pokemon/apps/web/src/ui/evolution-notification.ts)):**
     - Giữ nguyên vẹn khung icon avatar Pokémon (`.evo-notify-icon-frame` chứa `<img>` sprite icon của chính Pokémon đó và sao shiny nếu có).
     - Tiêu đề chỉ giữ chữ thuần túy `TIẾN HÓA KHẢ DỤNG`, loại bỏ các biểu tượng thừa thãi.
  4. **Kiểm Thử & Đảm Bảo Độ Ổn Định:**
     - Cập nhật unit test `test/evolution-notification.test.ts` (10/10 tests pass) xác thực avatar icon Pokémon, badge phím tắt `[R]`, và chức năng bấm phím `R`.
     - Toàn bộ 466/466 tests trong 39 test files đều pass 100%, 0 lỗi TypeScript compilation, build bundle production thành công.

---

## Cập nhật trước đó: 2026-10-10 (Nút Tiến Hóa Pixel Chi Tiết, Đóng PartyScreen Khi Tiến Hóa, & Âm Thanh Evolution start.ogg / Evolution.ogg)

### 0.92. Triển Khai & Hoàn Thiện Hộp Thông Báo Tiến Hóa Pixel Mép Trái, Chuỗi Diễn Hoạt Hạ Cánh, Nút Pixel & Tích Hợp Âm Thanh Bản Quyền Retro:

- **Trạng thái:** Đã hoàn thành 100%. 39 tệp test suite (466/466 tests), Typecheck (`npm run typecheck`), Lint (`npm run lint`), Build (`npm run build`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:**
  1. Hộp thông báo chuyển qua **mép bên trái ở giữa màn hình** (`left: 24px; top: 50%; transform: translateY(-50%)`).
  2. Bố cục hộp thông báo pixel ngay ngắn, thanh thời gian vẫn cứ chạy đều khi trỏ chuột vào.
  3. Thu nhỏ Pokémon trong màn hình tiến hóa lại một chút (scale `2.4`) để vừa vặn, không bị quá to.
  4. Khi tiến hóa xong thì cho Pokémon đã tiến hóa **rớt / hạ cánh từ từ xuống vị trí ban đầu** của Pokémon chưa tiến hóa (`startY = 255`).
  5. Cập nhật Pokémon đi theo (Follower): Đồng bộ ngay sang loài mới khi Pokémon đang đi theo tiến hóa.
  6. **Nút tiến hóa ở chi tiết Pokémon:** Thiết kế lại hoàn toàn theo phong cách pixel retro RPG.
  7. **Sửa luồng đóng Party Screen:** Khi bấm nút Tiến Hóa từ bảng chi tiết trong Đội hình thì phải đóng luôn toàn bộ Party Screen (thay vì chỉ đóng modal chi tiết khiến Party Screen vẫn mở phía dưới).
  8. **Bổ sung 2 tệp âm thanh bản quyền retro:**
     - `Audio/SE/Evolution start.ogg`: Phát khi hộp thông báo tiến hóa xuất hiện.
     - `Audio/SE/Evolution.ogg`: Phát khi mở giao diện màn hình tiến hóa và bắt đầu chuỗi hoạt họa.
- **Chi tiết đã thực hiện:**
  1. **Nút Tiến Hóa Pixel Retro RPG ([style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Thiết kế lại `.summary-btn-evolve` với viền pixel vuông vắn (`border: 2px solid #fef08a; border-radius: 0;`), đổ bóng nổi 3D pixel cứng đa lớp (`inset 1px 1px 0 #fff, inset -1px -1px 0 #b45309, 2px 2px 0 #000, 3px 3px 0 #78350f`), font chữ cổ điển `'Power Clear', 'VT323', monospace`.
     - Phản hồi tương tác pixel: Khi hover chuyển nền vàng sáng nhích nhẹ (-1px, -1px), khi active nhấn lún (1px, 1px) chuẩn RPG.
  2. **Đóng Toàn Bộ Party Screen Khi Bắt Đầu Tiến Hóa ([party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts)):**
     - Khi nhấp `btnPartySummaryEvolve`, gọi `this.close(false)` đóng toàn bộ backdrop và màn hình Party Screen, nhường toàn bộ khung nhìn cho `EvolutionScreen`.
     - Sau khi kết thúc tiến hóa, trạng thái đội hình được làm mới (`this.render()`) và người chơi trở lại bản đồ Overworld trơn tru.
  3. **Tích Hợp Âm Thanh SE Tiến Hóa Retro ([evolution-notification.ts](file:///e:/Pokemon/apps/web/src/ui/evolution-notification.ts), [evolution-screen.ts](file:///e:/Pokemon/apps/web/src/ui/evolution-screen.ts)):**
     - `EvolutionNotificationManager`: Phát bản nhạc báo hiệu `Audio/SE/Evolution start.ogg` ngay khi banner xuất hiện.
     - `EvolutionScreen`: Phát bản nhạc nền tiến hóa kinh điển `Audio/SE/Evolution.ogg` ngay khi mở màn hình, tự động dừng nhạc khi tiến hóa hoàn tất (phase `revealed` và `finishAndClose`) để tiếng kêu (cry) và khúc ca khải hoàn `Audio/SE/Evolution success.ogg` vang lên rõ ràng.
  4. **Kiểm Thử Toàn Diện & Chuẩn Hóa:**
     - Đạt 100% 466/466 tests pass, 0 lỗi TypeScript, 0 lỗi ESLint, build production thành công.

---

## Cập nhật trước đó: 2026-10-10 (Triển Khai Tính Năng Tiến Hóa Pokémon: Nút Tiến Hóa Tại Chi Tiết & Màn Animation Tiến Hóa Chuẩn Kịch Bản Retro)

### 0.91. Triển Khai Tính Năng Tiến Hóa Pokémon & Màn Hình Diễn Hoạt Tiến Hóa Chuẩn Kịch Bản (Pokémon Evolution System & Retro Animated Sequence):

- **Trạng thái:** Đã hoàn thành 100%. 38 tệp test suite (455/455 tests), Typecheck (`npm run typecheck:web`), Lint (`npm run lint`), Build (`npm run build:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Triển khai tiến hóa cho Pokémon khi đạt đến cấp độ yêu cầu hoặc đạt điều kiện tiến hóa (đá tiến hóa). Tại chi tiết Pokémon sẽ có nút Tiến Hóa. Khi tiến hóa sẽ mở màn Evolution (sử dụng nền `Graphics/Evolution/evolution_bg.gif`) diễn ra theo đúng kịch bản:
  1. Pokémon xuất hiện ở phần dưới màn hình.
  2. Cơ thể bắt đầu phát sáng dần dần thành một quả cầu ánh sáng, từ từ bay lên tới giữa màn hình.
  3. Tại giữa màn hình, thay phiên Pokémon chưa tiến hóa và dạng tiến hóa tiếp theo sẽ xuất hiện thay phiên nhau (nhịp độ dồn dập).
  4. Sau đó quả cầu mở ra, khôi phục về dạng tiến hóa đầy đủ không còn phát sáng.
  5. Phát âm thanh tiếng kêu (Cry) của loài mới và khúc ca khải hoàn mừng tiến hóa thành công.
- **Chi tiết đã thực hiện:**
  1. **Động Cơ & Quy Tắc Tiến Hóa Chuẩn Thế Hệ 1 ([evolution-rules.ts](file:///e:/Pokemon/apps/web/src/domain/pokemon/evolution-rules.ts)):**
     - Xây dựng từ điển dữ liệu toàn diện `GEN1_EVOLUTIONS` bao gồm toàn bộ 70 nhánh tiến hóa của 151 loài Pokémon Gen 1:
       - Tiến hóa theo Cấp độ (Level-up): Bulbasaur $\to$ Ivysaur (Lv.16) $\to$ Venusaur (Lv.32), Charmander $\to$ Charmeleon (Lv.16) $\to$ Charizard (Lv.36), Squirtle $\to$ Wartortle (Lv.16) $\to$ Blastoise (Lv.36), Caterpie (Lv.7) $\to$ Metapod (Lv.10) $\to$ Butterfree, Magikarp (Lv.20) $\to$ Gyarados, Dratini (Lv.30) $\to$ Dragonair (Lv.55) $\to$ Dragonite, Alakazam/Machamp/Golem/Gengar (Lv.36), v.v.
       - Tiến hóa theo Đá Nguyên Tố (Evolution Stones): Pikachu $\to$ Raichu (Đá Sét), Vulpix/Growlithe (Đá Lửa), Poliwhirl/Shellder/Staryu (Đá Nước), Gloom/Weepinbell/Exeggcute (Đá Lá), Clefairy/Jigglypuff/Nidorina/Nidorino (Đá Mặt Trăng), Eevee đa nhánh $\to$ Vaporeon (Đá Nước) / Jolteon (Đá Sét) / Flareon (Đá Lửa).
     - Hàm `canPokemonEvolve(pokemon)`: Kiểm tra thông minh cấp độ và vật phẩm trong túi đồ (`inventoryService.hasItem`).
     - Hàm `applyEvolution(pokemon, targetSpeciesKey)`: Biến đổi loài, cập nhật tên/giữ nguyên biệt danh, tính toán lại toàn bộ chỉ số thực tế theo Base Stats mới bằng `recalculatePartyPokemonStats` và điều chỉnh HP tương ứng.
  2. **Giao Diện & Chuỗi Hoạt Họa Màn Evolution ([evolution-screen.ts](file:///e:/Pokemon/apps/web/src/ui/evolution-screen.ts)):**
     - Sử dụng hình nền động không gian chuẩn tỉ lệ `Graphics/Evolution/evolution_bg.gif` (512x384).
     - Bộ máy dựng Canvas 2D mượt mà 60FPS với máy trạng thái 5 giai đoạn:
       - **Giai đoạn 1 (Intro):** Pokémon ban đầu xuất hiện ở tọa độ dưới (`y: 275px`). Hộp thoại retro: `"Ồ? ${pokemon.name} đang có điều gì đó kỳ lạ xảy ra..."`. Phát âm thanh lấp lánh nhẹ (`Audio/SE/Shiny sparkle.ogg`).
       - **Giai đoạn 2 (Glowing & Ascending):** Cơ thể Pokémon phát sáng trắng chói lọi, chuyển hóa thành một quả cầu ánh sáng rực rỡ (radiant energy sphere với vầng hào quang corona) và từ từ bay lơ lửng từ dưới lên đúng tâm điểm màn hình (`y: 165px`) kèm chuỗi âm hưởng cao độ thăng tiến.
       - **Giai đoạn 3 (Morphing Alternation):** Quả cầu ánh sáng nhấp nháy dồn dập tại tâm điểm. Sprite dạng trước và dạng sau tiến hóa xuất hiện luân phiên chớp nhoáng với tần số tăng tốc từ 320ms rút ngắn dần xuống 60ms kèm âm hưởng nhịp dao động liên tục.
       - **Giai đoạn 4 (Supernova Burst):** Quả cầu bùng nổ mở ra với làn sóng ánh sáng trắng chói lòa và các vòng sóng xung kích tỏa ra toàn màn hình.
       - **Giai đoạn 5 (Restoration & Fanfare):** Khi ánh sáng tan đi, dạng tiến hóa mới xuất hiện hoàn mỹ ở trung tâm màn hình trong màu sắc nguyên bản, không còn phát sáng. Ngay lập tức phát tiếng kêu dũng mãnh của loài mới (`Audio/Cries/${species}.ogg`) cùng bản nhạc chiến thắng khải hoàn (`Audio/SE/Battle capture success.ogg`), mưa hạt kim tuyến chúc mừng và hiển thị nút `"TIẾP TỤC"`.
  3. **Tích Hợp Nút Tiến Hóa Nổi Bật Tại Chi Tiết Pokémon ([party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts), [storage-screen.ts](file:///e:/Pokemon/apps/web/src/ui/storage-screen.ts), [bag-screen.ts](file:///e:/Pokemon/apps/web/src/ui/bag-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Tại bảng Chi Tiết Pokémon (cả trong Đội Hình lẫn Máy Tính PC Storage): Khi Pokémon đạt cấp độ hoặc có đủ đá trong túi, xuất hiện nút bấm gradient phát sáng neon lấp lánh `.summary-btn-evolve` (`"✨ TIẾN HÓA THÀNH [TÊN] ➔"`).
     - Nhấp nút sẽ mở ngay màn Evolution kịch bản hoạt họa.
     - Khi sử dụng Đá Tiến Hóa trực tiếp từ Ba Lô (Bag Screen), hệ thống cũng tự động kích hoạt màn Evolution sống động tương tự.
  4. **Bộ Test Suite Tự Động Toàn Diện ([evolution.test.ts](file:///e:/Pokemon/apps/web/test/evolution.test.ts)):**
     - Đã thêm 13 bài test bao quát kiểm tra logic cấp độ, đá tiến hóa, tiến hóa đa nhánh Eevee, tính toán lại chỉ số và bảo lưu biệt danh Pokémon. Đạt 100% 455/455 tests passed.

---

## Cập nhật trước đó: 2026-10-10 (Chuẩn Hóa Chiêu Thức Tích Lượt 2 Turn: Lượt 1 Hấp Thụ Năng Lượng Không Phát Động Animation, Lượt 2 Mới Tấn Công)

### 0.90. Chuẩn Hóa Chiêu Thức Tích Lượt 2 Turn & Triệt Tiêu Lặp Animation Ở Lượt Tích Tụ (Two-Turn Moves Charge & Animation Execution Pipeline):

- **Trạng thái:** Đã hoàn thành 100%. 37 tệp test suite (442/442 tests), Typecheck (`npm run typecheck:web`), Lint (`npm run lint`), Build (`npm run build:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Các chiêu thức cần tích lượt như Tia Sáng Mặt Trời (Solar Beam) cần giai đoạn hấp thụ 1 lượt, ở lượt sau mới phát động animation còn lượt 1 thì không (trước đó animation phát động ở cả 2 lượt). Rà soát và điều chỉnh cho tất cả các trường hợp chiêu 2 lượt khác trong game.
- **Chi tiết đã thực hiện:**
  1. **Mở Rộng Danh Mục Chiêu 2 Lượt ([move-effect-engine.ts](file:///e:/Pokemon/apps/web/src/battle/rules/move-effect-engine.ts)):**
     - Rà soát và cập nhật đầy đủ tập hợp `TWO_TURN_MOVE_IDS`:
       - Nhóm hấp thụ ánh sáng / năng lượng: `solar_beam`, `solarbeam`, `solar_blade`, `solarblade`.
       - Nhóm tích tụ nguyên tố & tăng chỉ số lượt 1: `skull_bash` (+1 Phòng thủ lượt 1), `meteor_beam` (+1 Công ĐB lượt 1), `electro_shot` / `electroshot` (+1 Công ĐB lượt 1).
       - Nhóm phóng thích năng lượng cực đại: `sky_attack`, `razor_wind`, `freeze_shock`, `ice_burn`, `geomancy`.
       - Nhóm bán bất tử (Semi-invulnerable): `fly`, `bounce` (trên không), `dig` (dưới lòng đất), `dive` (dưới nước), `shadow_force`, `phantom_force` (bóng tối).
     - Tích hợp chuẩn xác ngoại lệ thời tiết:
       - Trong trời Nắng (`sun`): `solar_beam` và `solar_blade` kích hoạt và tấn công ngay trong 1 lượt duy nhất mà không cần tích tụ.
       - Trong trời Mưa (`rain`): `electro_shot` phóng tia điện cực mạnh ngay trong 1 lượt duy nhất mà không cần tích tụ.
  2. **Gắn Cờ Chỉ Báo Tích Lượt Trong Động Cơ Trận Đấu ([battle-engine.ts](file:///e:/Pokemon/apps/web/src/battle/battle-engine.ts)):**
     - Bổ sung trường `isCharging?: boolean;` vào giao diện `TurnResult`.
     - Trong `executeAttack`, khi `chargeResult.isCharging` là true ở lượt 1, trả về `isCharging: true` cùng lượng sát thương 0 và thông điệp tương ứng (ví dụ: `"${attacker.name} đang hấp thụ ánh sáng mặt trời!"`).
  3. **Kiểm Soát Animation & Đòn Lao Trong Bộ Điều Khiển Trận Đấu ([battle-controller.ts](file:///e:/Pokemon/apps/web/src/battle/battle-controller.ts)):**
     - Tại `executePlayerAttack` và `executeEnemyAttack`:
       - Thêm rào chắn kiểm tra: nếu `result.isCharging || result.events.some(ev => ev.type === 'charge_begin')`, đây là giai đoạn tích tụ / nạp năng lượng của lượt 1.
       - **Triệt tiêu hoàn toàn:** Không gọi `startPlayerAttack`/`startEnemyAttack` (không lunge lao tới), không gọi `playMoveVfx` (không hiển thị hiệu ứng đồ họa vệt đòn đánh hay làm rung màn hình), không kích hoạt phản ứng trúng đòn của đối thủ.
       - **Xử lý hiệu ứng tăng chỉ số:** Kích hoạt sự kiện thay đổi chỉ số của lượt 1 (như Skull Bash tăng Def, Meteor Beam tăng SpAtk...) và phát âm thanh tăng chỉ số (`Audio/SE/Stat rise.ogg`).
       - Hiển thị thông báo hấp thụ/tích năng lượng và kết thúc lượt nạp một cách mượt mà.
     - Ở Lượt 2: Khi tung đòn thực sự, `result.isCharging` là false/undefined, hệ thống mới chính thức phát động animation chiêu thức đầy đủ (`playMoveVfx`), đòn lao và tính sát thương lên đối thủ.
  4. **Bộ Test Suite Tự Động Toàn Diện ([battle-advanced-moves.test.ts](file:///e:/Pokemon/apps/web/test/battle-advanced-moves.test.ts)):**
     - Kiểm thử Solar Beam: Lượt 1 trả về `isCharging: true`, sát thương = 0; Lượt 2 tung đòn `isCharging: false`, sát thương > 0.
     - Kiểm thử ngoại lệ thời tiết Nắng: Solar Beam bắn ngay trong 1 lượt, `isCharging: false`, gây sát thương ngay.
     - Kiểm thử Skull Bash: Lượt 1 `isCharging: true`, tăng 1 bậc Phòng thủ; Lượt 2 tung đòn gây sát thương.
     - Kiểm thử Meteor Beam: Lượt 1 `isCharging: true`, tăng 1 bậc Công ĐB; Lượt 2 tung đòn gây sát thương.
     - Kiểm thử Electro Shot trong Mưa: Bắn ngay trong 1 lượt không cần nạp, gây sát thương ngay.
     - Đạt 100% 442/442 test cases passed.

---

## Cập nhật trước đó: 2026-10-10 (Ghi Nhận Chiêu Đã Dạy Bằng TM Vào Chi Tiết Pokémon & Mở Rộng Kho Chiêu Thức Để Tự Do Đổi Chiêu Không Tốn Thêm Đĩa)

### 0.89. Ghi Nhận Chiêu Đã Dạy Bằng TM Vào Chi Tiết Pokémon & Mở Rộng Kho Chiêu Thức Tự Do Đổi Chiêu (Permanent TM Move Pool & Free Relearner System):

- **Trạng thái:** Đã hoàn thành 100%. 37 tệp test suite (439/439 tests), Typecheck (`npm run typecheck:web`), Lint (`npm run lint`), Build (`npm run build:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Bổ sung thêm ở chi tiết Pokémon các move đã được dạy bởi TM; Pokémon được dùng TM sẽ ghi nhận vào danh sách move, vì đã được dạy nên người chơi có thể tự do đổi chiêu mà không phải tốn thêm nhiều tài nguyên (đĩa TM).
- **Chi tiết đã thực hiện:**
  1. **Mở Rộng Dữ Liệu Thực Thể Pokémon ([party-state.ts](file:///e:/Pokemon/apps/web/src/domain/party/party-state.ts)):**
     - Bổ sung trường `taughtTmMoves?: string[]` vào kiểu dữ liệu `PartyPokemon` và cấu hình tạo Pokémon trong `createPartyPokemon`.
     - Tự động lưu trữ và đồng bộ vĩnh viễn danh sách ID các chiêu đã học qua TM/HM cho từng cá thể Pokémon vào LocalStorage và Save State.
  2. **Động Cơ Ghi Nhận & Phòng Chống Lãng Phí Tài Nguyên ([item-effects.ts](file:///e:/Pokemon/apps/web/src/domain/inventory/item-effects.ts)):**
     - Trong `applyItemToPartyPokemon`: Khi dạy chiêu TM thành công cho Pokémon, tự động lưu ID chiêu vào `pokemon.taughtTmMoves`. Dù sau này Pokémon có thay thế chiêu đó bằng chiêu khác ở 4 ô đang dùng thì chiêu TM vẫn tồn tại vĩnh viễn trong kho chiêu đã mở khóa.
     - Trong `canUseItemOnPartyPokemon`: Kiểm tra `pokemon.taughtTmMoves`. Nếu Pokémon đã từng được dạy chiêu này trước đó nhưng hiện không trang bị ở 4 ô hoạt động, hệ thống từ chối dùng thêm đĩa TM kèm thông báo hướng dẫn chu đáo: `"${pokemon.name} đã được dạy chiêu ${moveName} từ trước! Bạn có thể vào mục Chi Tiết Pokémon để trang bị lại mà không cần tốn đĩa TM!"`. Giúp người chơi không bị lãng phí tài nguyên đĩa TM trùng lặp.
  3. **Hợp Nhất Kho Chiêu Thức Đã Học ([moves-db.ts](file:///e:/Pokemon/apps/web/src/battle/moves-db.ts)):**
     - Bổ sung trường `source?: 'level' | 'tm'` trong `AvailableMoveEntry`.
     - Phát triển hàm `getAvailableMovesForPokemon(pokemon)`:
       - Tự động tổng hợp toàn bộ chiêu thức theo cấp độ khả dụng ($\le$ level hiện tại).
       - Tự động nạp toàn bộ các chiêu đã được dạy từ TM trong `pokemon.taughtTmMoves` với nguồn gốc `source: 'tm'`.
       - Bảo lưu bất kỳ chiêu đang kích hoạt nào ngoài bảng cấp độ để đảm bảo người chơi không bao giờ bị mất chiêu khi kéo thả đổi vị trí.
       - Sắp xếp trực quan: các chiêu theo cấp độ trước, tiếp theo là nhóm các chiêu đã học qua TM được gom nhóm rõ ràng.
  4. **Giao Diện Chi Tiết Pokémon Trong Đội Hình & Kho Chứa PC ([party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts), [storage-screen.ts](file:///e:/Pokemon/apps/web/src/ui/storage-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - **Ở 4 ô chiêu thức trang bị bên trái:** Nếu chiêu thức nào từng được dạy từ TM, hiển thị huy hiệu `TM` nhỏ màu xanh ngọc thanh lịch (`active-move-tm-badge`) ở góc trên bên phải kèm chú giải (tooltip) trực quan.
     - **Ở Kho Chiêu Thức (Move Pool) bên phải:**
       - Các chiêu học từ TM hiển thị huy hiệu `💿 TM` phát sáng xanh neon (`pool-lv-badge tm`), viền thẻ màu xanh dương (`summary-pool-card tm-move`).
       - Header bảng kho chiêu tự động hiển thị số lượng chiêu TM đã mở khóa (Ví dụ: `≤ Lv.25 • 2 TM`).
       - Người chơi có thể tự do **kéo thả (Drag & Drop)** bất kỳ chiêu TM nào vào 4 ô chiêu thức bên trái để thay đổi bộ chiêu hoàn toàn MIỄN PHÍ mà không tốn thêm bất kỳ vật phẩm hay đĩa TM nào!
  5. **Bổ Sung Danh Mục TM/HM Vào Pokédex ([pokedex-view.ts](file:///e:/Pokemon/apps/web/src/ui/pokedex/pokedex-view.ts)):**
     - Trong mục "Chiêu thức học được" của từng Pokémon trong Pokédex, chia thành 2 phân đoạn rõ ràng:
       - `⬆️ CHIÊU THEO CẤP ĐỘ`: Các chiêu học được khi tăng cấp.
       - `💿 CHIÊU HỌC QUA ĐĨA KỸ THUẬT (TM/HM)`: Toàn bộ các chiêu tương thích mà loài Pokémon đó có thể học được từ cơ sở dữ liệu pokemondb.net, hiển thị đầy đủ nhãn `TM`, tên chiêu, hệ nguyên tố, phân loại, sức mạnh, độ chính xác và điểm PP.
  6. **Bộ Test Suite Tự Động Toàn Diện:**
     - Bổ sung test case chuyên biệt trong `item-effects.test.ts` xác thực:
       - Chiêu TM được ghi nhận chuẩn xác vào `taughtTmMoves`.
       - Chiêu TM xuất hiện đầy đủ trong `getAvailableMovesForPokemon`.
       - Khi gỡ chiêu khỏi 4 ô trang bị, chiêu TM vẫn được bảo lưu vĩnh viễn trong kho chiêu.
       - Chặn dùng lại đĩa TM trùng lặp đối với chiêu đã mở khóa và hiển thị thông báo hướng dẫn vào mục Chi tiết Pokémon.

---

## Cập nhật trước đó: 2026-10-10 (Chuẩn Hóa Khả Năng Học TM/HM Chuẩn pokemondb.net & Kéo Dài Lượt Thời Tiết/Địa Hình Theo Vật Phẩm Cầm Nắm)

### 0.88. Chuẩn Hóa Danh Sách Học Chiêu TM/HM Chuẩn pokemondb.net & Kéo Dài Lượt Thời Tiết 8 Lượt Khi Mang Vật Phẩm (TM Learnset Compatibility & Weather Duration Held Items):

- **Trạng thái:** Đã hoàn thành 100%. 37 tệp test suite (438/438 tests), Typecheck (`npm run typecheck:web`), Lint (`npm run lint`), Build (`npm run build:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:**
  1. Pokémon dùng TM tùy tiện là không ổn, tra cứu website https://pokemondb.net/ để lấy đầy đủ nhánh "Moves learnt by TM" cho từng Pokémon và bổ sung vào cơ sở dữ liệu để kiểm soát Pokémon nào học được TM nào.
  2. Vật phẩm duy trì thời tiết (ví dụ: Đá Ẩm Ướt / Damp Rock) khi Pokémon mang vào dùng Vũ Điệu Mưa (Rain Dance) vẫn chỉ duy trì 5 lượt thay vì kéo dài hiệu lực. Cần sửa logic để tăng số lượt khi mang item tương ứng.
- **Chi tiết đã thực hiện:**
  1. **Đồng Bộ Dữ Liệu Học TM/HM Chuẩn pokemondb.net ([pokemon-db.json](file:///e:/Pokemon/packages/game-data/pokemon-db.json) & [pokemon.ts](file:///e:/Pokemon/packages/shared-types/pokemon.ts)):**
     - Tạo công cụ tự động hóa crawler đồng bộ chuẩn xác toàn bộ 151 loài Pokémon thế hệ 1 qua 3 thế hệ trên pokemondb.net (Gen 9, Gen 7 TM, Gen 6 HM) với 9.504 lượt ánh xạ move canonical.
     - Lưu trữ trường dữ liệu `tmMoves: string[]` trực tiếp trong từng loài Pokémon ở `pokemon-db.json`.
     - Phản ánh chuẩn mực hạn chế chiêu thức canon: Caterpie, Metapod, Ditto có 0 chiêu TM; Magikarp chỉ học được 2 chiêu (`facade`, `hydro_pump`); Pikachu học 69 chiêu (gồm Tia Chớp Sét, Sấm Sét, Sắt Đuôi... nhưng TUYỆT ĐỐI không học được Phun Lửa hay Động Đất); Mew học được 276 chiêu.
  2. **Động Cơ Kiểm Duyệt Tương Thích TM/HM ([item-effects.ts](file:///e:/Pokemon/apps/web/src/domain/inventory/item-effects.ts)):**
     - Bổ sung mã kết quả `'ERR_INCOMPATIBLE'` vào `ItemResultCode`.
     - Trong `canUseItemOnPartyPokemon`: Kiểm tra `species.tmMoves?.includes(moveId)`. Nếu loài không nằm trong danh sách học chiêu, từ chối với lý do rõ ràng: `"${pokemon.name} không thể học chiêu thức ${move.nameVi} từ ${item.nameVi}!"`.
  3. **Động Cơ Kéo Dài Thời Gian Thời Tiết & Địa Hình Theo Vật Phẩm Cầm Nắm ([held-item-engine.ts](file:///e:/Pokemon/apps/web/src/battle/rules/held-item-engine.ts)):**
     - Đặt tên hiển thị tiếng Việt chuẩn mực: `damp-rock` ("Đá Ẩm Ướt"), `heat-rock` ("Đá Nóng"), `smooth-rock` ("Đá Nhẵn"), `icy-rock` ("Đá Băng"), `terrain-extender` ("Khuếch Đại Địa Hình").
     - Thêm phương thức `HeldItemEngine.getWeatherDuration(weatherType, heldItem)`: trả về **8 lượt** nếu mang đúng loại đá thời tiết tương ứng (`damp-rock` cho mưa rào/mưa lớn, `heat-rock` cho nắng gắt, `smooth-rock` cho bão cát, `icy-rock` cho tuyết rơi/mưa đá), và **5 lượt** theo mặc định.
     - Thêm phương thức `HeldItemEngine.getTerrainDuration(heldItem)`: trả về **8 lượt** nếu mang `terrain-extender`, và **5 lượt** theo mặc định.
  4. **Tích Hợp Vào Chiêu Thức & Đặc Tính Thời Tiết/Địa Hình ([move-effect-engine.ts](file:///e:/Pokemon/apps/web/src/battle/rules/move-effect-engine.ts) & [ability-engine.ts](file:///e:/Pokemon/apps/web/src/battle/rules/ability-engine.ts)):**
     - **Chiêu thức thời tiết & địa hình:** `rain_dance`, `sunny_day`, `sandstorm`, `snowscape`/`hail` và các chiêu địa hình (`electric_terrain`, `grassy_terrain`, `psychic_terrain`, `misty_terrain`) tự động kiểm tra item cầm nắm của Pokémon ra chiêu. Khi kéo dài thành 8 lượt, hệ thống hiển thị thông báo bổ sung sinh động: `"[Đá Ẩm Ướt] đã kéo dài thời gian mưa lên 8 lượt!"`.
     - **Đặc tính triệu hồi thời tiết & địa hình khi ra trận:** `drizzle`, `drought`, `sandstream`, `snowwarning` và các đặc tính Surge (`electricsurge`, `grassysurge`, `psychicsurge`, `mistysurge`) tự động kiểm tra `pokemon.heldItem` để thiết lập 8 lượt và thông báo vật phẩm kéo dài hiệu lực.
  5. **Bộ Test Suite Tự Động Hoàn Hảo ([item-effects.test.ts](file:///e:/Pokemon/apps/web/test/item-effects.test.ts) & [held-items.test.ts](file:///e:/Pokemon/apps/web/test/held-items.test.ts)):**
     - Thêm test suite kiểm tra tương thích TM: Magikarp bị từ chối khi học TM35 Phun Lửa nhưng được phép học TM Hydro Pump; Charizard học thành công TM38 Fire Blast.
     - Thêm test suite `10. Weather & Terrain Duration Extending Held Items`: kiểm tra Rain Dance tạo mưa 5 lượt mặc định, nhưng khi mang `damp-rock` tạo mưa 8 lượt; Drizzle tạo mưa 5 lượt mặc định, nhưng khi mang `damp-rock` tạo mưa 8 lượt.

---

### 0.87. Bổ Sung Nút Cheat Full Đĩa Kỹ Thuật TM/HM & Động Cơ Dạy Chiêu Thức (TM/HM Move Teaching & Overlay Cheat Tool):

- **Trạng thái:** Đã hoàn thành 100%. 37 tệp test suite (434/434 tests), Typecheck (`npm run typecheck:web`), Lint (`npm run lint`), Build (`npm run build:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Thêm 1 nút ở overlay để full các đĩa move cho Pokémon học.
- **Chi tiết đã thực hiện:**
  1. **Tạo & Đồng Bộ Toàn Bộ 108 Đĩa Kỹ Thuật Vào Cơ Sở Dữ Liệu ([items-db.json](file:///e:/Pokemon/packages/game-data/items-db.json)):**
     - Đã thêm đầy đủ 100 TMs (`tm01` đến `tm100`) và 8 HMs (`hm01` đến `hm08`) vào cơ sở dữ liệu vật phẩm.
     - Phân loại chuẩn vào danh mục `'machine'` (`categoryName: 'TMs & HMs'`, `categoryVi: 'Đĩa Kỹ Năng (TM/HM)'`), thuộc Ngăn 3 của Ba Lô (`machines` / `ĐĨA CHIÊU`).
     - Tự động map sprite theo đúng hệ nguyên tố từ `Graphics/Items/` (ví dụ `machine_ELECTRIC.png` cho Thunderbolt TM24, `machine_FIRE.png` cho Flamethrower TM35, `machine_hm_WATER.png` cho Surf HM03...).
  2. **Động Cơ Học & Ghi Nhớ Chiêu Thức ([item-catalog-effects.ts](file:///e:/Pokemon/apps/web/src/domain/inventory/item-catalog-effects.ts) & [item-effects.ts](file:///e:/Pokemon/apps/web/src/domain/inventory/item-effects.ts)):**
     - Bổ sung trường `teachMove?: string` trong `ItemEffectDef` và thiết lập từ điển `TM_MOVE_MAPPING` liên kết 108 đĩa TM/HM với ID chiêu tương ứng trong `MOVES_DB`.
     - Trong `canUseItemOnPartyPokemon`: Kiểm tra xem Pokémon trong đội hình đã học chiêu đó chưa; nếu đã biết thì từ chối kèm lý do thân thiện (`"Pikachu đã thành thạo chiêu thức Phóng Điện rồi!"`).
     - Trong `applyItemToPartyPokemon`:
       - Nếu Pokémon có ít hơn 4 chiêu: thêm chiêu mới vào bộ chiêu thức và thiết lập đầy đủ PP tối đa.
       - Nếu Pokémon đã đủ 4 chiêu: tự động ghi đè thay thế chiêu thứ 4 và hiển thị thông báo chi tiết: `"🎉 Pikachu đã quên [Chiêu cũ] và học thành công chiêu thức [Chiêu mới]!"`.
  3. **Mở Rộng Dịch Vụ Ba Lô ([inventory-service.ts](file:///e:/Pokemon/apps/web/src/domain/inventory/inventory-service.ts)):**
     - Thêm phương thức `addAllMachines(quantity = 1): number` tự động nạp toàn bộ 108 đĩa TM/HM vào ngăn Ba Lô.
  4. **Giao Diện Overlay & Điều Khiển ([debug-template.ts](file:///e:/Pokemon/apps/web/src/debug/debug-template.ts), [debug-controller.ts](file:///e:/Pokemon/apps/web/src/debug/debug-controller.ts), [bootstrap.ts](file:///e:/Pokemon/apps/web/src/bootstrap.ts)):**
     - Thêm nút bấm chuyên dụng `#btnAddAllMachines` ("💿 Full Đĩa Kỹ Thuật TM/HM (x1)") với giao diện gradient cyan nổi bật (`linear-gradient(135deg, #0ea5e9, #0284c7)`) đặt ngay dưới nút Full Item trong nhóm `🎒 Kiểm thử & Thêm Vật Phẩm` của debug overlay (`#testOverlay`).
     - Bấm nút lập tức thêm toàn bộ 108 đĩa chiêu vào túi đồ và hiển thị Toast thông báo xanh dương sống động: `"💿 Đã cung cấp Full 108 Đĩa Kỹ Thuật (TM/HM) vào ngăn Đĩa Chiêu!"`.
  5. **Bộ Test Tự Động Toàn Diện:**
     - Bổ sung test kiểm thử nút bấm và remote bridge trong `custom-bot-spawner.test.ts`.
     - Bổ sung 3 test case chuyên biệt trong `item-effects.test.ts` xác thực: thêm 108 đĩa chiêu vào ngăn 3, dạy chiêu cho Pokémon có < 4 chiêu, chặn dạy lại chiêu đã biết, và tự động thay thế chiêu thứ 4 khi đã đầy 4 chiêu.

---

## Cập nhật trước đó: 2026-10-10 (Bổ Sung Icon Thời Tiết & Huy Hiệu Lượt Tồn Tại Trên Mép Trên Màn Hình Trận Đấu)

### 0.86. Bổ Sung Huy Hiệu Icon Thời Tiết & Đếm Số Lượt Tồn Tại Trận Đấu (Battle Screen Weather HUD Indicator):

- **Trạng thái:** Đã hoàn thành 100%. 37 tệp test suite (431/431 tests), Typecheck (`npm run typecheck:web`), Lint (`npm run lint`), Build (`npm run build:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Bổ sung icon hiển thị thời tiết tương ứng cùng với số lượt tồn tại kèm icon nằm trên mép trên ở giữa màn hình (từ tài nguyên `Graphics/weather/*.png`).
- **Phân tích thiết kế & Tọa độ hiển thị:**
  1. **Tài nguyên đồ họa:** Khai thác toàn bộ 9 biểu tượng thời tiết 50x50 pixel art chất lượng cao trong thư mục `Graphics/weather`:
     - `sun` / `sunny` $\rightarrow$ `SongSun.png` (Nắng gắt)
     - `rain` $\rightarrow$ `SongRain.png` (Mưa rào)
     - `heavy_rain` $\rightarrow$ `SongHeavyRain.png` (Mưa bão lớn)
     - `storm` / `thunderstorm` $\rightarrow$ `SongStorm.png` (Bão sấm sét)
     - `sandstorm` $\rightarrow$ `SongSandstorm.png` (Bão cát)
     - `hail` / `blizzard` $\rightarrow$ `SongBlizzard.png` (Mưa đá / Bão tuyết)
     - `snow` $\rightarrow$ `SongSnow.png` (Tuyết rơi)
     - `fog` $\rightarrow$ `SongFog.png` (Sương mù)
     - `clear` / `clearing` $\rightarrow$ `SongClearing.png` (Trong lành)
  2. **Vị trí hiển thị mép trên ở giữa màn hình:**
     - Kích thước canvas trận chiến là 512x384. Khu vực trung tâm mép trên (`centerX = 256`, `y = 6`) hoàn toàn thông thoáng, không bị che bởi khung thông tin địch (Databox địch ở góc trái `y = 34..70`) hay người chơi (ở góc dưới phải).
     - Thiết kế dạng viên nang (capsule pill) bo tròn 14px mềm mại (`bw = 98`, `bh = 28`, `bx = 207`, `by = 6`), nền kính mờ sắc nét `rgba(15, 23, 42, 0.92)` kết hợp dải màu gradient và đường viền phát sáng phù hợp theo từng loại thời tiết.
     - Phía trái hiển thị icon thời tiết (22x22px), phía phải hiển thị 2 dòng chữ nổi bật:
       - Dòng 1: Tên thời tiết tiếng Việt viết hoa sắc nét (Ví dụ: `NẮNG`, `MƯA`, `BÃO CÁT`, `MƯA ĐÁ`...).
       - Dòng 2: Số lượt còn lại (`5 LƯỢT`) kèm hiệu ứng nhấp nháy đỏ báo động khi chỉ còn `1 LƯỢT`.
  3. **Hiệu ứng chuyển động mượt mà (Animations & Transitions):**
     - Tự động trượt nhẹ từ trên xuống đồng bộ khi màn chắn đen mở ra (`enemyDataboxProgress`).
     - Tự động trượt lên ẩn đi khi máy quay zoom vào Pokémon để ném bóng bắt (`captureZoomProgress`).
     - Tự động ẩn khi không có thời tiết (`weather.type === 'none'` hoặc `turnsLeft <= 0`).
  4. **Tích hợp Debug & Kiểm Thử:**
     - Thêm dropdown chọn thời tiết trong Overlay `#testOverlay` để kiểm thử nhanh mọi dạng thời tiết trong trận chiến.
     - Cập nhật plugin Vite `emitLegacyGraphicsPlugin` đóng gói đầy đủ thư mục `weather` vào production bundle `dist`.
     - Bổ sung bộ test suite chuyên biệt `weather-indicator.test.ts` (8 bài test) xác thực toàn diện: phân giải tài nguyên icon, bảng màu WEATHER_THEMES, vị trí capsule ở giữa mép trên, trạng thái ẩn khi không có thời tiết, trạng thái cảnh báo khi còn 1 lượt và cơ chế bộ nhớ đệm hình ảnh (cache).

---

## Cập nhật trước đó: 2026-10-10 (Áp Dụng Hoàn Thiện Toàn Bộ Logic Vật Phẩm: Kẹo Exp/Rare Candy, Bạc Hà Tính Cách, Đá Tiến Hóa, Nắp Chai IVs, Quả Mọng EV)

### 0.85. Hoàn Thiện Động Cơ Xử Lý Hiệu Ứng Toàn Bộ Vật Phẩm (Full Item Effects & Usability Overhaul):

- **Trạng thái:** Đã hoàn thành 100%. 36 tệp test suite (423/423 tests), Typecheck (`npm run typecheck:web`), Lint (`npm run lint`), Build (`npm run build:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Các vật phẩm kẹo candy không dùng được cho Pokémon, vật phẩm thay đổi tính cách (mints) chưa dùng được, kiểm tra và hoàn thiện toàn bộ logic sử dụng vật phẩm trong game.
- **Nguyên nhân gốc rễ & Phân tích cơ chế:**
  1. Trong `ITEM_EFFECTS_REGISTRY` trước đây chỉ khai báo một số ít Potion, Revive và Rare Candy đơn lẻ. Toàn bộ 5 loại Kẹo Exp (`exp-candy-xs`, `s`, `m`, `l`, `xl`), 21 loại Bạc hà tính cách (`mint`), Đá tiến hóa, Nắp chai Hyper Training, quả mọng giảm EV hoàn toàn chưa được đăng ký trong registry hiệu ứng.
  2. Hàm `canUseItemOnPartyPokemon()` trả về lỗi `ERR_WRONG_CONTEXT` ("Vật phẩm này không thể sử dụng trực tiếp trên Pokémon!") đối với bất kỳ vật phẩm nào thiếu định nghĩa `def`.
  3. Trong `items-db.ts`, hàm `isUsableItem()` trước đây chỉ kiểm tra một số danh mục cứng, khiến các vật phẩm thuộc `general` (như Đá tiến hóa, Nắp chai, Sáo chữa trạng thái) bị chặn sử dụng trực tiếp từ túi đồ.
- **Chi tiết đã thực hiện:**
  1. **Tích Hợp Toàn Diện Nhóm Kẹo Exp & Kẹo Hiếm ([item-catalog-effects.ts](file:///e:/Pokemon/apps/web/src/domain/inventory/item-catalog-effects.ts) & [item-effects.ts](file:///e:/Pokemon/apps/web/src/domain/inventory/item-effects.ts)):**
     - Đăng ký đầy đủ `exp-candy-xs` (+100 EXP), `exp-candy-s` (+800 EXP), `exp-candy-m` (+3,000 EXP), `exp-candy-l` (+10,000 EXP), `exp-candy-xl` (+30,000 EXP).
     - Hỗ trợ thăng nhiều cấp độ liên tục nếu tích lũy đủ EXP, tính toán lại EXP sang cấp kế tiếp chuẩn theo Growth Rate đường cong kinh nghiệm của loài Pokémon, tăng máu tương ứng và giới hạn chuẩn tại Lv.100.
     - Cập nhật Rare Candy: reset thanh kinh nghiệm về 0 cho cấp mới và tăng 1 cấp mượt mà.
  2. **Tích Hợp 21 Loại Bạc Hà Thay Đổi Tính Cách (Nature Mints):**
     - Đăng ký toàn bộ 21 loại bạc hà: `adamant-mint`, `modest-mint`, `timid-mint`, `jolly-mint`, `bold-mint`, `calm-mint`, v.v.
     - Kiểm tra nếu Pokémon đã mang tính cách đó thì trả về thông báo tránh lãng phí.
     - Khi sử dụng: cập nhật `pokemon.nature`, tự động tính toán lại chỉ số với hệ số nhân 1.1 / 0.9 của Nature mới qua `recalculatePartyPokemonStats()`.
  3. **Tích Hợp Nhóm Đá Tiến Hóa Chuẩn (Evolution Stones):**
     - Xây dựng bảng tra cứu tiến hóa đá chuẩn `STONE_EVOLUTIONS`: Fire Stone (Vulpix, Growlithe, Eevee), Water Stone (Poliwhirl, Shellder, Staryu, Eevee), Thunder Stone (Pikachu, Eevee), Leaf Stone (Gloom, Weepinbell, Exeggcute), Moon Stone (Nidorina, Nidorino, Clefairy, Jigglypuff), v.v.
     - Khi dùng đúng đá: Pokémon tiến hóa sang loài mới, cập nhật tên/loài/hệ/chỉ số và hiển thị thông báo chúc mừng tiến hóa rực rỡ.
  4. **Tích Hợp Nhóm Huấn Luyện IVs (Bottle Cap / Nắp Chai) & Đặc Tính (Ability):**
     - `gold-bottle-cap`: Luyện toàn bộ 6 chỉ số IVs lên mức hoàn hảo 31.
     - `bottle-cap`: Luyện chỉ số IV chưa tối đa lên 31.
     - `ability-capsule` & `ability-patch`: Hỗ trợ kích hoạt/chuyển đổi đặc tính.
  5. **Tích Hợp Quả Mọng Giảm Điểm Nỗ Lực (EV Reset Berries) & Đặc Sản:**
     - `pomeg-berry` (-10 HP EV), `kelpsy-berry` (-10 Atk EV), `qualot-berry` (-10 Def EV), `hondew-berry` (-10 SpAtk EV), `grepa-berry` (-10 SpDef EV), `tamato-berry` (-10 Speed EV).
     - `rage-candy-bar`, `lumiose-galette`, `shalour-sable`, `pewter-crunchies`: Chữa toàn bộ trạng thái bất thường.
     - `pp-up` & `pp-max`: Tăng tối đa 3 nấc giới hạn PP cho chiêu thức (+20% mỗi nấc).
  6. **Cải Tiến Trải Nghiệm Túi Đồ & Điều Khiển Bàn Phím ([bag-screen.ts](file:///e:/Pokemon/apps/web/src/ui/bag-screen.ts) & [party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts)):**
     - Tự động nhận diện mọi vật phẩm có định nghĩa hiệu ứng trong `isUsableItem()`.
     - Chặn cảnh báo sớm ngay trong túi đồ nếu người chơi cố bấm dùng vật phẩm chỉ dùng trong trận (X-Attack, X-Defense).
     - Cho phép bấm Enter / Space xác nhận ngay nút hành động "Dùng vật phẩm" trên màn hình Đội hình khi điều khiển bằng phím.
  7. **Kiểm Thử Toàn Diện & Đảm Bảo Chất Lượng:**
     - Bổ sung 6 bài kiểm thử chuyên sâu mới trong [item-effects.test.ts](file:///e:/Pokemon/apps/web/test/item-effects.test.ts).
     - `npm run test:web` $\rightarrow$ 36/36 files, 423/423 tests PASS 100%.
     - `npm run typecheck:web` $\rightarrow$ PASS 0 lỗi TypeScript.
     - `npm run lint` $\rightarrow$ PASS 0 lỗi ESLint.
     - `npm run build:web` $\rightarrow$ Production build thành công 100%.

---

## Cập nhật trước đó: 2026-10-10 (Thêm Nút Overlay Cung Cấp Full Item x1 Cho Người Chơi)

### 0.84. Bổ Sung Nút Cheat Debug "💎 Cung Cấp Full Item (x1)" Trong Overlay:

- **Trạng thái:** Đã hoàn thành 100%. 36 tệp test suite (417/417 tests), Typecheck (`npm run typecheck:web`), Lint (`npm run lint`), Build (`npm run build:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Thêm nút ở overlay để cung cấp full item cho người chơi, số lượng x1 mỗi loại.
- **Chi tiết đã thực hiện:**
  1. **Thêm Phương Thức `addFullItems(quantity = 1)` Trong [inventory-service.ts](file:///e:/Pokemon/apps/web/src/domain/inventory/inventory-service.ts):**
     - Quét toàn bộ 574+ vật phẩm có trong catalog game (`getAllCatalogItems()`), chuẩn hóa ID (`normalizeItemId()`).
     - Đảm bảo mỗi vật phẩm trong túi có số lượng ít nhất là 1 (`quantity`).
     - Áp dụng cơ chế cập nhật hàng loạt (batch update) và chỉ gọi `notify()` duy nhất 1 lần ở cuối tiến trình để đảm bảo hiệu năng, không gây giật lag hay re-render 574 lần.
  2. **Mở Rộng Giao Diện `DebugBridge` & Kết Nối Trong [bootstrap.ts](file:///e:/Pokemon/apps/web/src/bootstrap.ts):**
     - Bổ sung `addFullItems(): void` vào interface [types.ts](file:///e:/Pokemon/apps/web/src/debug/types.ts).
     - Định nghĩa handler trong `bootstrap.ts`: gọi `inventoryService.addFullItems(1)` và hiển thị thông báo Toast `showBerryToast("Đã nhận đầy đủ toàn bộ vật phẩm (x1 mỗi loại)!")`.
  3. **Tích Hợp Nút Bấm Vào Giao Diện Overlay Debug ([debug-template.ts](file:///e:/Pokemon/apps/web/src/debug/debug-template.ts) & [debug-controller.ts](file:///e:/Pokemon/apps/web/src/debug/debug-controller.ts)):**
     - Đặt nút `#btnAddFullItems` (`💎 Cung cấp Full Item (x1)`) tại khu vực quản lý túi đồ `🎒 Kiểm thử & Thêm Vật Phẩm` trong overlay `#testOverlay`.
     - Nút bấm được tạo kiểu với gradient bắt mắt, tooltip mô tả rõ ràng.
     - Lắng nghe sự kiện click và kích hoạt qua `this.bridge.addFullItems()`.
  4. **Bổ Sung Kiểm Thử Tự Động:**
     - [item-effects.test.ts](file:///e:/Pokemon/apps/web/test/item-effects.test.ts): Kiểm tra `inventoryService.addFullItems(1)` cấp phát đầy đủ toàn bộ catalog (>570 items) với số lượng x1, không làm giảm số lượng nếu đã có sẵn.
     - [custom-bot-spawner.test.ts](file:///e:/Pokemon/apps/web/test/custom-bot-spawner.test.ts): Kiểm tra nút `#btnAddFullItems` gọi thành công `bridge.addFullItems()`.
  5. **Kiểm Thử & Đảm Bảo Chất Lượng:**
     - `npm run test:web` $\rightarrow$ 36/36 test files, 417/417 unit tests PASS 100%.
     - `npm run typecheck:web` $\rightarrow$ PASS 0 lỗi TypeScript.
     - `npm run lint` $\rightarrow$ PASS 0 lỗi ESLint.
     - `npm run build:web` $\rightarrow$ Production build thành công 100%.

---

## Cập nhật trước đó: 2026-10-10 (Sửa Lỗi Animation Các Move Tự Dùng Lên Bản Thân / Bảo Vệ Lại Xuất Hiện Trên Người Đối Phương)

### 0.83. Chuẩn Hóa Vị Trí Hiển Thị Animation Cho Kĩ Năng Tự Dùng Lên Bản Thân (Self-Targeting Move Animation Positioning):

- **Trạng thái:** Đã hoàn thành 100%. 36 tệp test suite (416/416 tests), Typecheck (`npm run typecheck:web`), Lint (`npm run lint`), Build (`npm run build:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Các chiêu thức như Bảo Vệ (Protect) hoặc các chiêu thức dùng lên bản thân khi thi triển animation thì lại xuất hiện trên người đối phương.
- **Nguyên nhân gốc rễ & Phân tích cơ chế:**
  1. Trong hệ thống [move-vfx.ts](file:///e:/Pokemon/apps/web/src/battle/move-vfx.ts), cơ chế mặc định `buildVfxDefFromDbEntry()` và `TYPE_FALLBACK_VFX` gán giá trị `target: 'defender'`.
  2. Danh sách kiểm tra chiêu thức tự dùng `SELF_HEAL_KEYWORDS` trước đây rất sơ sài (chỉ gồm một số từ khóa hồi máu), hoàn toàn không chứa `protect`, `detect`, `substitute`, `light_screen`, `reflect`, `barrier`, `safeguard`, `bulk_up`, `dragon_dance`, v.v.
  3. Khi `BattleController.playMoveVfx()` được gọi, do `vfxDef.target` trả về `'defender'`, tọa độ mục tiêu `(targetX, targetY)` được gán thành tọa độ của đối thủ (`defenderCenter`). Kết quả là lá chắn Protect hay các hiệu ứng buff rơi thẳng lên đầu Pokémon đối phương thay vì bao bọc lấy bản thân Pokémon đang thi triển!
- **Chi tiết đã thực hiện:**
  1. **Xây Dựng Cơ Chế Nhận Diện Chiêu Thức Bản Thân `isSelfTargetMove` ([move-vfx.ts](file:///e:/Pokemon/apps/web/src/battle/move-vfx.ts)):**
     - Tạo bảng tra cứu toàn diện `SELF_TARGET_MOVE_IDS` gồm hơn 100 chiêu thức phòng vệ (`protect`, `detect`, `spiky_shield`, `endure`, `baneful_bunker`...), tăng chỉ số (`swords_dance`, `dragon_dance`, `bulk_up`, `calm_mind`, `iron_defense`, `harden`...), dựng rào chắn (`light_screen`, `reflect`, `safeguard`, `barrier`...), thay thế / chuyển giao (`substitute`, `baton_pass`, `teleport`...), và hồi phục.
     - Tích hợp kiểm tra động `isSelfTargetMove(move)`: tự động phân loại nếu là đòn trạng thái có `statChanges` toàn bộ `target === 'self'`, có `healPercent > 0`, có `statusEffect.target === 'self'`, hoặc chứa các từ khóa phòng thủ/buff.
  2. **Bảo Đảm Tuyệt Đối `target: 'attacker'` Cho Toàn Bộ Chiêu Bản Thân:**
     - Trong `resolveMoveVfx()`: Bất kỳ chiêu thức nào thỏa mãn `isSelfTargetMove(move)` đều được ghi đè `target = 'attacker'` và loại bỏ `screenShake` (tránh rung lắc màn hình như bị dính sát thương).
     - Bổ sung cấu hình animation chuẩn RPG Maker XP trong `MOVE_VFX_REGISTRY` cho: `protect` (PRAS- Protect.png, 5 frames), `detect` (PRAS- Detect.png, 10 frames), `substitute` (PRAS- Substitute.png), `swords_dance`, `dragon_dance`, `light_screen`, `reflect`, `barrier`, `safeguard`, `harden`, `iron_defense`, `calm_mind`, `bulk_up`, `baton_pass`, `teleport`.
     - Loại bỏ `giga_drain` khỏi registry thủ công để chiêu thức này sử dụng đúng sprite đòn đánh hút máu `PRAS- Giga Drain.png` nhắm vào đối thủ.
  3. **Đồng Bộ Tọa Độ Trung Tâm Trong [battle-controller.ts](file:///e:/Pokemon/apps/web/src/battle/battle-controller.ts):**
     - Trong `playMoveVfx()`: Nếu `isSelfTargetMove(move)` hoặc `vfxDef.target === 'attacker'`, tọa độ `(targetX, targetY)` lập tức được cố định vào `attackerCenter` (Player: `{x: 130, y: 215}`, Enemy: `{x: 380, y: 115}`).
     - Tích hợp âm thanh lấp lánh nhẹ nhàng (`Audio/SE/Shiny sparkle.ogg`) cho các đòn buff/phòng vệ tự thân nếu không có SE riêng, thay vì phát tiếng bóng va đập mạnh (`Battle ball hit.ogg`).
  4. **Bổ Sung Kiểm Thử Tự Động Trong [move-vfx.test.ts](file:///e:/Pokemon/apps/web/test/move-vfx.test.ts):**
     - Kiểm tra phân loại chính xác `isSelfTargetMove` đối với Protect, Detect, Swords Dance, Iron Defense, Calm Mind, Substitute, Recover và Tackle.
     - Kiểm tra `resolveMoveVfx()` trả về `target: 'attacker'` cho các chiêu bản thân.
     - Kiểm tra trực tiếp tọa độ của `BattleController`: khi người chơi dùng Protect, VFX nằm tại `(130, 215)`; khi đối thủ dùng Protect, VFX nằm tại `(380, 115)`.
  5. **Kiểm Thử & Đảm Bảo Chất Lượng:**
     - `npm run test:web` $\rightarrow$ 36/36 test files, 416/416 unit tests PASS 100%.
     - `npm run typecheck:web` $\rightarrow$ PASS 0 lỗi TypeScript.
     - `npm run lint` $\rightarrow$ PASS 0 lỗi ESLint.
     - `npm run build:web` $\rightarrow$ Production build thành công 100%.

---

## Cập nhật trước đó: 2026-10-10 (Sửa Lỗi Kĩ Năng Chuyển Đổi Pokémon Như Chuyền Gậy / Baton Pass Chỉ Có Thoại Không Đổi Pokémon)

### 0.82. Kích Hoạt Đổi Pokémon Tương Tác & Chuyển Giao Trạng Thái Cho Kĩ Năng Chuyển Đổi (Baton Pass, U-turn, Volt Switch, Teleport):

- **Trạng thái:** Đã hoàn thành 100%. 36 tệp test suite (413/413 tests), Typecheck (`npm run typecheck:web`), Lint (`npm run lint`), Build (`npm run build:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Kĩ năng chuyển đổi Pokémon như Chuyền Gậy (Baton Pass) có thông báo thoại nhưng không đổi Pokémon.
- **Nguyên nhân gốc rễ & Phân tích cơ chế:**
  1. Trong `BattleEngine.executeAttack()`, các đòn chuyển đổi như `baton_pass`, `u_turn`, `volt_switch`, `flip_turn`, `teleport` đã tính toán đúng `mustSwitch = true`, `switchSide = 'player'`, kèm toàn bộ dữ liệu buff kế thừa `batonPassData` (statStages, Aqua Ring, Ingrain, Leech Seed, Confusion).
  2. Tuy nhiên, trong [battle-controller.ts](file:///e:/Pokemon/apps/web/src/battle/battle-controller.ts), phương thức `handlePlayerMove()` trước đây chỉ kiểm tra `fainted` của hai bên mà hoàn toàn bỏ qua cờ `mustSwitch`. Dẫn tới sau khi thoại tung đòn kết thúc, vòng đấu lập tức chuyển tiếp lượt đánh hoặc kết thúc round mà không mở màn hình PartyScreen để người chơi chọn Pokémon đổi vào.
- **Chi tiết đã thực hiện:**
  1. **Thêm Cơ Chế `handleActionSwitch` & `handleEnemyActionSwitch` Trong [battle-controller.ts](file:///e:/Pokemon/apps/web/src/battle/battle-controller.ts):**
     - Khi `firstRes` hoặc `secondRes` có `mustSwitch && switchSide === 'player'`:
       - Kiểm tra đội hình xem có Pokémon khác còn sống không (`hasAliveSwitch`). Nếu không có ai, xuất thông báo không còn đồng đội để đổi và tiếp tục trận đấu.
       - Nếu có đồng đội khả dụng: Mở giao diện `PartyScreen.getInstance().openForBattleSelect(...)` để người chơi tương tác chọn Pokémon đưa vào sân.
       - Khi người chơi chọn Pokémon: Rút Pokémon cũ về, gọi `this.engine.switchPlayerPokemon(selectedPk, batonPassData)` để chuyển giao toàn bộ stat boost và trạng thái của Baton Pass. Cập nhật HP Bar, HUD và nạp Sprite của Pokémon mới, sau đó chạy animation ném bóng ra sân `startPlayerSendOut()`.
       - Nếu người chơi đi trước: Sau khi đổi xong, đối thủ sẽ tiếp tục đánh vào Pokémon mới vừa ra sân (chuẩn luật Pokémon). Nếu người chơi đi sau: Kết thúc round và xử lý các hiệu ứng cuối lượt (status, weather, terrain).
     - Hỗ trợ đổi Pokémon cho đối thủ (`handleEnemyActionSwitch`) và xử lý chạy trốn khi đối thủ dùng Teleport trong trận hoang dã.
  2. **Bổ Sung Kiểm Thử Tự Động Toàn Diện Trong [special-support-moves.test.ts](file:///e:/Pokemon/apps/web/test/special-support-moves.test.ts):**
     - Thêm test case tích hợp mô phỏng trọn vẹn luồng Ninjask dùng Baton Pass (+2 Atk, +4 Spd, Aqua Ring), `PartyScreen.getInstance().openForBattleSelect` được kích hoạt, chọn Marowak và xác nhận Marowak kế thừa hoàn hảo toàn bộ chỉ số buff.
  3. **Kiểm Thử & Đảm Bảo Chất Lượng:**
     - `npm run test:web` $\rightarrow$ 36/36 test files, 413/413 unit tests PASS 100%.
     - `npm run typecheck:web` $\rightarrow$ PASS 0 lỗi TypeScript.
     - `npm run lint` $\rightarrow$ PASS 0 lỗi ESLint.
     - `npm run build:web` $\rightarrow$ Production build thành công 100%.

---

## Cập nhật trước đó: 2026-10-09 (Bỏ Icon/Emoji Thoại Thuốc Hồi Phục & Sửa Lỗi Không Hiện Sprite Pokémon Khi Ra Trận / Đổi Chỗ)

### 0.81. Loại Bỏ Icon Emoji Khỏi Dòng Thoại Dược Phẩm & Khắc Phục Lỗi Hiển Thị Sprite Pokémon Khi Ra Trận (Recovery Text Clean & Battler Sprite Fix):

- **Trạng thái:** Đã hoàn thành 100%. 26 tệp test suite (214/214 tests), Typecheck (`npm run typecheck:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:**
  1. Bỏ phần icon lọ thuốc / emoji ra khỏi dòng thoại khi sử dụng thuốc hồi phục.
  2. Khắc phục tình trạng hình ảnh Pokémon được gọi ra khi 1 Pokémon chết hoặc người dùng đổi chỗ trong trận đấu không hiển thị.
- **Nguyên nhân gốc rễ & Phân tích cơ chế:**
  1. **Icon / Emoji trong thông báo vật phẩm:**
     - Trong [item-effects.ts](file:///e:/Pokemon/apps/web/src/domain/inventory/item-effects.ts), các câu thoại dùng vật phẩm trước đó đính kèm tiền tố emoji (`🧪 `, `✨ `, `💊 `, `⭐ `, `💪 `, `⚡ `). Khi hiển thị trên hộp thoại retro font GBA, các ký tự này hiển thị thành icon lọ thuốc/biểu tượng không đồng nhất.
  2. **Sprite Pokémon không hiển thị khi ra trận sau khi ngất xỉu hoặc đổi chỗ:**
     - Khi một Pokémon ngất xỉu (`currentHp <= 0`), `BattleState.startPlayerFaint()` đưa `playerFaintPhase` sang `'white'` $\rightarrow$ `'shrinking'` $\rightarrow$ `'dead'` và `playerFaintScale = 0`.
     - Khi người chơi chọn Pokémon thay thế từ đội hình (`handleForceSwitch`), code gọi `this.state.startPlayerSendOut()`. Tuy nhiên, hàm `startPlayerSendOut()` **không hề reset** `playerFaintPhase` và `playerFaintScale` về giá trị ban đầu.
     - Trong [battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts), hàm `drawPlayerBattler()` có điều kiện: `if (state.playerFaintPhase === 'dead') return;`. Do `playerFaintPhase` vẫn giữ nguyên trạng thái `'dead'`, `drawPlayerBattler` lập tức thoát ra khỏi vòng lặp vẽ ở mọi frame $\rightarrow$ Pokémon mới hoàn toàn vô hình!
     - Tương tự, nếu bất kỳ Pokémon nào từng ngất xỉu trước đó trong trận đấu, biến `playerFaintPhase` vẫn là `'dead'`, dẫn đến việc đổi chỗ bất kỳ Pokémon nào sau đó cũng bị chặn vẽ.
     - Khi người chơi chủ động đổi chỗ (`handleSwitchPokemon`), Pokémon cũ trước đó vẫn đứng nguyên trên sân trong khi dòng thoại `"[Tên], quay lại!"` đang chạy, không có hiệu ứng thu hồi rõ ràng.
- **Chi tiết đã thực hiện:**
  1. **Chuẩn Hóa Thông Báo Thuốc Hồi Phục ([item-effects.ts](file:///e:/Pokemon/apps/web/src/domain/inventory/item-effects.ts)):**
     - Đã loại bỏ hoàn toàn các tiền tố emoji/icon (`🧪`, `✨`, `💊`, `⭐`, `💪`, `⚡`) ra khỏi mọi thông báo dùng dược phẩm (Potion, Revive, Antidote, Rare Candy, PP Restores, v.v.).
     - Thông báo hiển thị dạng văn bản thuần retro chuẩn xác: `"Đã dùng [Tên vật phẩm]! [Tên Pokémon] được hồi phục..."`.
  2. **Khôi Phục & Làm Sạch Trạng Thái Faint Trong `startPlayerSendOut` ([battle-state.ts](file:///e:/Pokemon/apps/web/src/battle/battle-state.ts)):**
     - Reset triệt để toàn bộ thuộc tính ngất xỉu khi bắt đầu chuỗi ném Pokémon ra trận:
       - `this.playerFaintPhase = 'none'`
       - `this.playerFaintTick = 0`
       - `this.playerFaintScale = 1.0`
       - `this.playerFrozenFrame = null`
       - Reset toàn bộ `playerHurtFlash`, `playerHitTimer`, `playerHitOffsetX/Y`, `playerAttackTick`, `playerLungeX/Y`.
  3. **Tái Cấu Trúc Guard Render Sprite Trong [battle-renderer.ts](file:///e:/Pokemon/apps/web/src/battle/battle-renderer.ts):**
     - Chỉ xem xét điều kiện ngất xỉu nếu Pokémon không đang trong chuỗi ra trận (`!state.isPlayerSendingOut`).
     - Đảm bảo Pokémon còn sống (`currentHp > 0`) không bao giờ bị chặn vẽ bởi cờ ngất xỉu cũ: `if (isPlayerFainting && state.playerFaintPhase === 'dead') return;`.
     - Tự động đồng bộ và nạp lại sprite mặt sau (`this.engine.playerPokemon.backSprite`) ngay khi phát hiện active battler đổi sang loài khác.
  4. **Thu Hồi Pokémon Cũ Ngay Lập Tức Khi Đổi Chỗ ([battle-controller.ts](file:///e:/Pokemon/apps/web/src/battle/battle-controller.ts)):**
     - Trong `handleSwitchPokemon`, lập tức đặt `this.state.isPlayerPokemonSentOut = false` khi người chơi xác nhận đổi chỗ để thu hồi Pokémon cũ về bóng, sau đó ném bóng và cho Pokémon mới nhảy ra sân đấu mượt mà.
  5. **Kiểm Thử & Đảm Bảo Chất Lượng:**
     - `npm run typecheck:web` $\rightarrow$ PASS 0 lỗi.
     - `npm run test:web` $\rightarrow$ 26/26 suites, 214/214 tests PASS 100%.

---

## Cập nhật trước đó: 2026-10-09 (Giao Diện Chọn Pokémon Cho Thuốc Hồi Phục & Khắc Phục Lỗi Mở Đè Túi Sau Khi Hồi Sinh)

### 0.80. Hỗ Trợ Dùng Vật Phẩm Hồi Sinh & Phục Hồi Trong Trận Đấu (Battle Revive & Recovery System):

- **Trạng thái:** Đã hoàn thành 100%. 26 tệp test suite (214/214 tests), Typecheck (`npm run typecheck:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:**
  1. Dùng vật phẩm thuốc hồi phục (Potion, Full Restore, Antidote, v.v.) thì hiển thị giao diện chọn Pokémon trong đội hình để dùng (hiện tại bấm dùng nó tự động dùng cho Pokémon đang ở sân đấu).
  2. Khi dùng hồi sinh xong thì phải đóng túi hoàn toàn để thấy ngay dòng thoại dùng vật phẩm hồi sinh cho Pokémon nào (trước đó bị mở đè lại giao diện túi đồ, người chơi phải bấm thoát túi mới thấy dòng thoại kết quả trận đấu).
- **Nguyên nhân gốc rễ & Phân tích cơ chế:**
  1. **Tự động ép dùng cho Pokémon trên sân:** Hàm `handleUseMedicineInBattle` trước đó chỉ mở PartyScreen khi gặp vật phẩm hồi sinh (`reviveRatio`), còn các loại thuốc hồi máu (Potion, Super Potion...), giải trạng thái (Antidote, Full Heal...), phục hồi PP (Ether, Elixir...) bị ép gọi `applyItemToBattler` thẳng lên `this.engine.playerPokemon`, không cho người chơi lựa chọn cứu các Pokémon dự bị trong đội hình.
  2. **Túi đồ tự mở đè lên sau khi dùng hồi sinh:**
     - Trong [party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts) và [bag-screen.ts](file:///e:/Pokemon/apps/web/src/ui/bag-screen.ts), hàm `close()` luôn luôn tự động kích hoạt callback `onCancel()`.
     - Trong luồng trận đấu, `onCancel` của PartyScreen được truyền là `() => { this.handleBagCommand(); }` (mở lại túi khi người chơi bấm Hủy/Esc).
     - Khi người chơi chọn Pokémon thành công và code gọi `PartyScreen.getInstance().close()`, nó lại vô tình kích hoạt `onCancel()` $\rightarrow$ gọi `this.handleBagCommand()` $\rightarrow$ mở lại Túi đồ đè lên màn hình trận đấu, che mất hộp thoại thông báo `"✨ Đã dùng Hồi sinh! [Tên] hồi sinh với..."`.
- **Chi tiết đã thực hiện:**
  1. **Thêm Cờ `notifyCancel` Cho [party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts) & [bag-screen.ts](file:///e:/Pokemon/apps/web/src/ui/bag-screen.ts):**
     - Cập nhật chữ ký `close(notifyCancel = true)`: Chỉ kích hoạt `onCancel()` khi người chơi thực sự hủy (bấm nút Thoát / bấm Esc / click ra ngoài backdrop).
     - Khi một hành động được xác nhận thành công (chọn vật phẩm, chọn Pokémon hồi phục...), code gọi `this.close(false)`, ngăn chặn triệt để việc vô tình kích hoạt `onCancel()`.
  2. **Giao Diện Chọn Pokémon Toàn Diện Cho Mọi Thuốc Hồi Phục ([battle-controller.ts](file:///e:/Pokemon/apps/web/src/battle/battle-controller.ts)):**
     - Phân loại rõ ràng 3 nhóm vật phẩm khi bấm DÙNG trong trận chiến:
       - **Nhóm 1 - Đồ Buff Trạng Thái Trực Tiếp (`targetScope === 'battler'`):** X-Attack, X-Defense, Dire Hit, Guard Specs... áp dụng trực tiếp lên Pokémon đang chiến đấu trên sân.
       - **Nhóm 2 - Sacred Ash (`reviveAllParty`):** Tự động hồi sinh toàn bộ thành viên ngất xỉu mà không cần chọn từng con.
       - **Nhóm 3 - Mọi Thuốc Hồi Phục Đội Hình (Hồi máu, Giải trạng thái, Hồi phục PP, Hồi sinh):**
         - Đồng bộ chỉ số máu/trạng thái của Pokémon trên sân vào đội hình (`syncActiveBattlerToParty()`).
         - Đóng túi đồ (`this.close(false)`).
         - Mở `PartyScreen` ở chế độ `use_item` với lời nhắc rõ ràng: `"Dùng [Tên vật phẩm] cho Pokémon nào trong đội hình? (Esc để trở về Túi)"` (hoặc `"Chọn Pokémon cần hồi sinh bằng [Tên vật phẩm]:"`).
         - Kiểm tra tính hợp lệ qua `canUseItemOnPartyPokemon`: Cảnh báo toast nếu Pokémon đã đầy máu / không mắc trạng thái / còn sống khi dùng hồi sinh $\rightarrow$ giữ nguyên giao diện để người chơi chọn lại.
         - Khi chọn đúng Pokémon: Dùng vật phẩm, trừ 1 số lượng trong túi, phát SE, gọi `PartyScreen.getInstance().close(false)` đóng hoàn toàn giao diện.
         - Nếu Pokémon được chọn là con đang ở trên sân: Tự động cập nhật HP bar và trạng thái trực tiếp trên sàn đấu.
         - Hiển thị trực tiếp hộp thoại thông báo kết quả trên màn hình trận chiến và chuyển sang lượt đánh của đối phương.
         - Nếu người chơi bấm Thoát / Esc từ Party Screen: Mở lại túi đồ trơn tru mà không mất lượt.
  3. **Kiểm Thử & Đảm Bảo Chất Lượng:**
     - `npm run typecheck:web` $\rightarrow$ PASS 0 lỗi.
     - `npm run test:web` $\rightarrow$ 26/26 suites, 214/214 tests PASS 100%.

---

### 0.79. Bộ Lọc Vật Phẩm Trao Được & Phân Loại Minh Bạch Dùng vs Cho Giữ (Holdable Filtering & Usage Classification):

- **Trạng thái:** Đã hoàn thành 100%. 26 tệp test suite (213/213 tests), Typecheck (`npm run typecheck:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Lọc vật phẩm có thể trao cho Pokémon (hiện tại món nào cũng trao được), tra cứu thông tin chính thống từ web để phân loại rõ ràng vật phẩm nào là DÙNG và vật phẩm nào là TRAO ĐƯỢC.
- **Chi tiết đã thực hiện:**
  1. **Tra Cứu & Chuẩn Hóa Cơ Chế Chính Thống (Bulbapedia & Pokémon Core Series Standards):**
     - **Vật phẩm Trao Cho Pokémon Giữ (`isHoldableItem`):**
       - Toàn bộ 238 vật phẩm trang bị chiến đấu (`category === 'hold'`): `Leftovers`, `Choice Band`, `Choice Specs`, `Choice Scarf`, `Focus Sash`, `Rocky Helmet`, `Life Orb`, `Eviolite`, `Lucky Egg`, 17 loại đá/vật phẩm cường hóa hệ (`Charcoal`, `Magnet`...), Mega Stones, v.v.
       - Toàn bộ 67 loại Quả mọng (`category === 'berries'` / `'berry'`): Đều có thể trao cho Pokémon cầm và tự động kích hoạt trong trận.
       - Thư từ (`mail`), các vật phẩm tiến hóa khi trao đổi (`dragon-scale`, `electirizer`, `magmarizer`, `protector`, `reaper-cloth`, `dubious-disc`, `upgrade`, `prism-scale`, `oval-stone`, `sachet`, `whipped-dream`), đá quý/khăn quàng (`*-gem`, `*-scarf`).
       - **Tuyệt đối loại trừ khỏi trao đồ:** Key Items (Xe đạp, Cần câu...), Poké Balls (Bóng bắt), Dược phẩm (Potion, Revive, Rare Candy, Vitamins...), Vật phẩm trận đấu tạm thời (X Attack, X Defense...).
     - **Vật phẩm Dùng Được Trực Tiếp (`isUsableItem`):**
       - Dược phẩm (`medicine`), Quả mọng (`berries`), Đĩa kỹ thuật (`machine`/`tm`/`hm`), Bóng bắt (`pokeballs`), Đồ buff tạm thời trong trận (`battle`), Vật phẩm quan trọng (`key`), Đá tiến hóa dùng trực tiếp (`fire-stone`, `water-stone`...).
       - **Tuyệt đối loại trừ khỏi dùng trực tiếp:** Các trang bị thuần cầm tay (`Leftovers`, `Choice Band`, `Focus Sash`, `Rocky Helmet`... - người chơi không thể "dùng" mà phải "cho giữ").
  2. **Huy Hiệu Pixel Phân Loại Vật Phẩm Minh Bạch ([bag-screen.ts](file:///e:/Pokemon/apps/web/src/ui/bag-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Thêm huy hiệu pixel `.bag-item-tag` ngay trong thanh chi tiết của túi đồ:
       - `[DÙNG & CHO GIỮ]` (Xanh lá - dành cho quả mọng Berries vừa dùng được vừa cầm được).
       - `[CHỈ CHO GIỮ]` (Xanh ngọc / Cyan - dành cho Leftovers, Choice items, Focus Sash, Type boosters...).
       - `[CHỈ DÙNG]` (Vàng cam - dành cho Potion, Revive, Rare Candy, Poké Balls, X-items...).
       - `[KHÔNG DÙNG / BÁN]` (Xám - dành cho Nugget, Pearl, Stardust, hóa thạch...).
     - **Trạng thái Nút Thông Minh:**
       - Nút **"DÙNG"**: Tự động vô hiệu hóa (`disabled`) khi chọn món trang bị thuần kèm tooltip và toast giải thích rõ: _"⚠️ Vật phẩm này là trang bị, không thể dùng trực tiếp! Hãy bấm [CHO GIỮ] để trao cho Pokémon."_
       - Nút **"CHO GIỮ"**: Tự động vô hiệu hóa (`disabled`) khi chọn vật phẩm không thể trao (Potion, Poké Ball, Key Item...) kèm tooltip và toast: _"⚠️ Không thể trao vật phẩm này cho Pokémon cầm!"_
  3. **Thanh Lọc Vật Phẩm & Chế Độ Trao Đồ Tự Động ([bag-screen.ts](file:///e:/Pokemon/apps/web/src/ui/bag-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Thêm thanh `.bag-filter-bar` trên đầu danh sách vật phẩm với tiêu đề ngữ cảnh và nút chuyển đổi: `[◈ Lọc đồ trao]` / `[✓ Đang lọc đồ trao]`.
     - Khi mở Túi đồ từ Màn hình Đội hình với mục đích trao đồ cho Pokémon (`targetPokemonIndex`):
       - Tự động kích hoạt bộ lọc `holdableFilterOnly = true`.
       - Tự động chuyển ngay sang ngăn `VẬT PHẨM` (`Items`) hoặc `QUẢ MỌNG` (`Berries`) có chứa đồ trao được.
       - Tiêu đề danh sách hiển thị nổi bật: `🎁 TRAO CHO [TÊN POKÉMON]`.
       - Danh sách lọc sạch sẽ, chỉ hiện những món trang bị và quả mọng thực sự trao được, giúp người chơi thao tác cực kỳ nhanh chóng và không bị lẫn lộn.
  4. **Kiểm Thử Đầy Đủ ([held-items.test.ts](file:///e:/Pokemon/apps/web/test/held-items.test.ts)):**
     - Bổ sung 2 bài test chuyên sâu xác thực độ chính xác của `isHoldableItem`, `isUsableItem` và `getItemUsageType` trên nhiều nhóm vật phẩm khác nhau.
     - `npm run typecheck:web` $\rightarrow$ PASS, 0 errors.
     - `npm run test:web` $\rightarrow$ 26/26 suites, 213/213 tests PASS 100%.

---

### 0.78. Hệ Thống Trang Bị & Vận Hành Vật Phẩm Cho Pokémon (Held Items Engine & UI Display):

- **Trạng thái:** Đã hoàn thành 100%. 26 tệp test suite (210/210 tests), Typecheck (`npm run typecheck:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Thêm logic trang bị vật phẩm và logic vận hành của vật phẩm trang bị cho Pokémon (trong trận đấu và ngoài thế giới), kèm theo hiển thị vật phẩm được trang bị trên giao diện.
- **Chi tiết đã thực hiện:**
  1. **Bộ Máy Vận Hành Vật Phẩm Chiến Đấu ([held-item-engine.ts](file:///e:/Pokemon/apps/web/src/battle/rules/held-item-engine.ts)):**
     - **Quả mọng kích hoạt khi HP $\le 50\%$ (Pinch Berries):** `Oran Berry` (+10 HP), `Sitrus Berry` (+25% Max HP), `Figy/Wiki/Mago/Aguav/Iapapa Berry` (+33% Max HP); tự động kích hoạt tiêu thụ, xóa vật phẩm và hồi phục HP kèm thông báo.
     - **Quả mọng trị trạng thái bất thường (Status Berries):** `Cheri Berry` (Tê liệt), `Chesto Berry` (Ngủ say), `Pecha Berry` (Trúng độc/Độc nặng), `Rawst Berry` (Bỏng), `Aspear Berry` (Băng giá), `Lum Berry` (Chữa khỏi tức thì bất kỳ trạng thái nào).
     - **Vật phẩm hồi phục & tác dụng cuối lượt (End-of-Turn):**
       - `Leftovers` (Thức ăn thừa): Hồi 1/16 Max HP mỗi cuối lượt không tiêu thụ.
       - `Black Sludge`: Hồi 1/16 Max HP nếu là hệ Poison; gây sát thương 1/8 Max HP nếu không phải hệ Poison.
     - **Vật phẩm tăng cường sát thương (Damage Boosters):**
       - 17 loại vật phẩm tăng 20% sát thương theo hệ (`Charcoal`, `Mystic Water`, `Miracle Seed`, `Magnet`, `Silk Scarf`, `Sharp Beak`, v.v.).
       - `Life Orb`: Tăng 1.3x (+30%) sát thương mọi chiêu, gây 10% Max HP phản chấn lên người dùng sau đòn đánh.
       - `Expert Belt`: Tăng 1.2x (+20%) sát thương khi tung chiêu khắc hệ đối thủ.
       - `Choice Band` (+50% Công vật lý), `Choice Specs` (+50% Công đặc biệt), `Choice Scarf` (+50% Tốc độ trong [turn-order.ts](file:///e:/Pokemon/apps/web/src/battle/rules/turn-order.ts)).
       - `Muscle Band` (+10% chiêu vật lý), `Wise Glasses` (+10% chiêu đặc biệt).
     - **Vật phẩm phòng ngự & phản đòn:**
       - `Focus Sash`: Giữ lại 1 HP khi nhận đòn chí tử nếu đang đầy 100% HP (vỡ vụn sau kích hoạt).
       - `Rocky Helmet`: Phản sát thương 1/6 Max HP lên kẻ tấn công khi chịu đòn tiếp xúc vật lý.
       - `Eviolite`: Tăng 1.5x Phòng thủ và Thủ đặc biệt cho Pokémon chưa tiến hóa cấp tối đa.
     - **Vật phẩm tăng cường EXP:**
       - `Lucky Egg`: Tăng 1.5x (+50%) EXP nhận được sau trận thắng.
  2. **Hiển Thị & Thao Tác Trang Bị Trên Giao Diện ([party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts), [bag-screen.ts](file:///e:/Pokemon/apps/web/src/ui/bag-screen.ts), [storage-screen.ts](file:///e:/Pokemon/apps/web/src/ui/storage-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - **Thẻ Slot Pokémon Tinh Tế & Gọn Gàng:** Đưa icon vật phẩm trang bị `.ps-held-item-icon` ($16 \times 16\text{ px}$) đặt trực tiếp bên cạnh chữ cấp độ (`Lv.X`) trong hàng `.ps-level-row` ngay phía dưới ảnh Pokémon. Bỏ hoàn toàn khung viền xanh và chuỗi chữ tên đồ đè lên số HP; icon hiển thị pixel art độc lập, bóng đổ nhẹ và hỗ trợ tooltip khi rê chuột.
     - **Luồng Chọn Pokémon Trực Tiếp Trên Party Screen Chuẩn GBA ([bag-screen.ts](file:///e:/Pokemon/apps/web/src/ui/bag-screen.ts), [party-screen.ts](file:///e:/Pokemon/apps/web/src/ui/party-screen.ts)):**
       - **Bỏ hoàn toàn modal popup danh sách (`#bagPartyPickerModal`):** Khi bấm "DÙNG" hoặc "CHO GIỮ" từ Túi đồ, túi đóng lại và mở thẳng Màn hình Đội hình chính thức.
       - **Chế độ Chọn Tùy Biến (`PartySelectOptions`):** Party Screen hướng dẫn rõ ràng ở thanh thông báo dưới đáy, hỗ trợ xem tóm tắt thông số trước khi quyết định dùng/trao đồ.
       - **Hoàn Trả & Tái Sử Dụng Liền Mạch:** Sau khi dùng/trao đồ hoặc bấm THOÁT, màn hình tự động trở về Túi đồ.
       - Khi bấm **"Trao vật phẩm"** trên một Pokémon ở Màn hình Đội hình, Túi đồ mở ra với context `targetPokemonIndex` và hiển thị nút **"TRAO CHO [TÊN POKÉMON]"**.
       - Khi người chơi bấm trao, vật phẩm lập tức gán thẳng cho Pokémon đó (không mở hộp thoại chọn Pokémon thừa thãi).
       - Tự động hoàn lại món đồ cũ vào túi đồ nếu Pokémon đang cầm đồ khác.
       - Tự động đóng Túi đồ ngay lập tức và kích hoạt cập nhật màn hình Đội hình tức thì: người chơi thấy ngay icon vật phẩm mới trên thẻ Pokémon mà không cần phải thoát ra vào lại!
     - **Giao Diện Túi Đồ Chuẩn Pixel Art Retro GBA ([style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
       - **Bộ Nút Hành Động Bevel Minecraft/GBA:** Các nút "DÙNG", "TRAO CHO [POKÉMON]", "THOÁT" chuyển hoàn toàn sang góc vuông sắc nét (`border-radius: 0;`), viền đen 2px, đổ bóng bevel viền nổi 3D đa tầng (inset highlight & shadow), hiệu ứng ấn phím vật lý bước nhảy `translate(1px, 1px)`.
       - **Thẻ Danh Mục & Mô Tả:** Nhãn danh mục chuyển từ dạng viên thuốc bo tròn sang dạng hộp pixel cứng cáp viền nổi; văn bản mô tả và tên vật phẩm sử dụng font pixel `'Power Clear'` hỗ trợ đầy đủ tiếng Việt không bị nhảy font sans-serif hệ thống.
       - **Con Trỏ & Hàng Được Chọn:** Hàng vật phẩm được chọn mang viền pixel đôi sắc cạnh và con trỏ mũi tên pixel vàng `▶` nhấp nhô theo nhịp pixel (`steps(2, start)`).
       - **Thanh Cuộn & Khung Cửa Sổ:** Khung viền ngoài và thanh cuộn túi đồ được tinh chỉnh sang phong cách pixel art retro GBA sắc nét không bo tròn hiện đại.
     - **Menu Thao Tác:** Nút **"Gỡ vật phẩm"** (tháo đồ cất vào túi đồ, phát âm thanh và hiển thị toast cập nhật UI ngay lập tức) và nút **"Trao vật phẩm"** (mở nhanh túi đồ có target).
     - **Bảng Chi Tiết Summary Modal:** Hiển thị mục **"Vật phẩm:"** kèm icon và tên chi tiết trên cả Màn hình Đội hình và PC Box Storage.
  3. **Đồng Bộ Dữ Liệu Real-time ([party-service.ts](file:///e:/Pokemon/apps/web/src/domain/party/party-service.ts)):**
     - Bổ sung `giveHeldItem(index, itemRawId)` và `removeHeldItem(index)` vào `PartyService`, tự động lưu localStorage và notify các subscriber.
     - `PartyScreen` tự động subscribe và re-render khi `PartyService` phát tín hiệu thay đổi.
     - `partyPokemonToBattler`: Chuyển tiếp `heldItem` từ `PartyPokemon` sang `BattlerPokemon`.
     - `syncBattleResult`: Lưu lại trạng thái tiêu thụ vật phẩm (quả mọng, focus sash...) trở lại `PartyPokemon`.
  4. **Kiểm Thử Toàn Diện ([held-items.test.ts](file:///e:/Pokemon/apps/web/test/held-items.test.ts)):**
     - Tạo bộ 17 bài test chuyên sâu xác thực 100% các tính năng: Trao/tháo vật phẩm, cơ chế trả đồ cũ và notify subscriber của `PartyService`, truyền vào trận đấu, kích hoạt quả mọng nguy cấp, quả mọng giải trạng thái, Leftovers, Black Sludge, Choice Scarf, Charcoal, Life Orb, Focus Sash, Rocky Helmet và Lucky Egg.
     - `npm run typecheck:web` $\rightarrow$ PASS, 0 errors.
     - `npm run test:web` $\rightarrow$ 26/26 suites, 211/211 tests PASS 100%.

---

### 0.77. Tách Biệt Độc Lập Nhạc Nền Intro Khỏi Cài Đặt Âm Lượng & Chờ Đến Giây Thứ 11:

- **Trạng thái:** Đã hoàn thành 100%. 25 tệp test suite (194/194 tests), Typecheck (`npm run typecheck:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Tách riêng phần nhạc nền của intro ra độc lập hoàn toàn, không bị ảnh hưởng bởi các cài đặt âm lượng / mute trong modal cài đặt của sảnh chờ (localStorage); đồng thời chỉnh thời gian tự động vào màn hình chờ lùi lại tới giây thứ 11 (11000ms).
- **Chi tiết đã thực hiện:**
  1. **Độc Lập Tuyệt Đối Cho Nhạc Intro ([intro-bgm.ts](file:///e:/Pokemon/apps/web/src/audio/intro-bgm.ts)):**
     - Gỡ bỏ mọi truy cập đến `localStorage.getItem('pokemon_title_bgm_volume')` trong `IntroBgmPlayer`.
     - Nhạc Opening Movie luôn phát ở mức âm lượng chuẩn điện ảnh cố định (85%), không bị ảnh hưởng hay phụ thuộc vào bất kỳ thanh trượt hoặc trạng thái tắt âm của sảnh chờ.
  2. **Tự Động Chuyển Vào Màn Hình Chờ Ở Giây Thứ 11 ([game-intro.ts](file:///e:/Pokemon/apps/web/src/ui/game-intro.ts)):**
     - Cập nhật thời điểm tự động chuyển cảnh sang chính xác giây thứ 11 (11000ms, lùi thêm 3 giây so với trước).
     - Cho phép người chơi thưởng thức trọn vẹn giai điệu Opening Movie hoành tráng, vòng 18 icon hệ xoay tròn và hiệu ứng hào quang lấp lánh; người chơi vẫn có thể bấm chuột hoặc phím bất kỳ để vào sớm hơn nếu muốn.
  3. **Kiểm Thử & Đảm Bảo Tính Toàn Vẹn ([game-intro.test.ts](file:///e:/Pokemon/apps/web/test/game-intro.test.ts)):**
     - Cập nhật unit test timeline xác minh intro kiên nhẫn chờ qua giây thứ 10 và tự động kích hoạt `.intro-fade-out` chính xác ở giây thứ 11.
     - `npm run typecheck:web` $\rightarrow$ PASS, 0 errors.
     - `npm run test:web` $\rightarrow$ 25/25 suites, 194/194 tests PASS 100%.

---

### 0.76. Nhạc Nền Opening Movie Cho Intro & Tự Động Vào Màn Hình Chờ Ở Giây Thứ 8:

- **Trạng thái:** Đã hoàn thành 100%. 25 tệp test suite (194/194 tests), Typecheck (`npm run typecheck:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Dùng file `Audio/Misic backgound/01. Opening Movie.mp3` làm nhạc nền cho đoạn intro mở đầu; vẫn hiển thị dòng chữ mời gọi "Bấm để vào", người chơi có thể bấm để bỏ qua sớm, và nếu không bấm thì hệ thống sẽ tự động chuyển cảnh vào màn hình chờ ở giây thứ 8 (8000ms).
- **Chi tiết đã thực hiện:**
  1. **Tích Hợp Trình Phát Nhạc Intro Opening Movie ([intro-bgm.ts](file:///e:/Pokemon/apps/web/src/audio/intro-bgm.ts)):**
     - Tạo module `introBgmPlayer` phát file âm thanh [Audio/Misic backgound/01. Opening Movie.mp3](file:///e:/Pokemon/Audio/Misic%20backgound/01.%20Opening%20Movie.mp3) (đã đồng bộ vào [apps/web/public/Audio/Misic backgound/01. Opening Movie.mp3](file:///e:/Pokemon/apps/web/public/Audio/Misic%20backgound/01.%20Opening%20Movie.mp3)).
     - Khởi chạy nhạc Opening Movie ngay khi đoạn intro bắt đầu và xử lý chính sách autoplay trên trình duyệt (mở khóa khi có tương tác).
     - Điều phối âm thanh thông minh: Tạm ngắt Title BGM trong lúc intro đang phát; khi intro kết thúc, nhạc Opening Movie mờ dần êm ái và bàn giao mượt mà sang `titleBgmPlayer`.
  2. **Tự Động Chuyển Vào Màn Hình Chờ Ở Giây Thứ 8 ([game-intro.ts](file:///e:/Pokemon/apps/web/src/ui/game-intro.ts)):**
     - Đặt timer ở chính xác giây thứ 8 (8000ms): Nếu người chơi chưa tương tác, hệ thống tự động kích hoạt hiệu ứng `.intro-fade-out` (600ms) chuyển mượt vào Màn hình chờ.
     - Dòng chữ `✨ BẤM ĐỂ BƯỚC VÀO THẾ GIỚI ✨` vẫn hiển thị lung linh từ giây 3.2 để người chơi có thể nhấp chuột hoặc bấm phím bất kỳ vào sảnh chờ sớm hơn nếu muốn.
  3. **Kiểm Thử & Đảm Bảo Tính Toàn Vẹn ([game-intro.test.ts](file:///e:/Pokemon/apps/web/test/game-intro.test.ts)):**
     - Cập nhật test suite xác nhận dòng chữ hiển thị, intro kiên nhẫn chờ đến đúng giây thứ 8 thì tự động chuyển cảnh mờ dần và hoàn tất dọn dẹp.
     - `npm run typecheck:web` $\rightarrow$ PASS, 0 errors.
     - `npm run test:web` $\rightarrow$ 25/25 suites, 194/194 tests PASS 100%.

---

### 0.75. Thay Thế Tách Đôi Màn Hình Bằng Dòng Chữ "Bấm Để Vào" & Chuyển Cảnh Mờ Dần Êm Ái:

- **Trạng thái:** Đã hoàn thành 100%. 25 tệp test suite (194/194 tests), Typecheck (`npm run typecheck:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Bỏ hiệu ứng tách đôi màn hình ở intro, thay vào đó hiển thị dòng chữ mời gọi "Bấm để vào" (hoặc từ ngữ hay ho, phong cách RPG retro), khi bấm thì chuyển mượt vào màn hình chờ.
- **Chi tiết đã thực hiện:**
  1. **Loại Bỏ Hiệu Ứng Tách Đôi Màn Hình ([game-intro.ts](file:///e:/Pokemon/apps/web/src/ui/game-intro.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Gỡ bỏ cấu trúc cửa chập kép `.intro-shutter-top`, `.intro-shutter-bottom`, vạch chớp seam ngang `.intro-center-flash` và cơ chế trượt nửa trên/dưới.
     - Thay thế bằng khung sân khấu trung tâm thống nhất `.intro-stage`, định vị hoàn hảo logo Pokémon, hào quang và vòng tròn 18 icon type.
  2. **Dòng Chữ Phát Sáng "Bấm Để Vào" Phong Cách Retro RPG:**
     - Thiết kế cụm chữ gợi mở giàu tính điện ảnh và hoài niệm Pokémon:
       - Dòng chính: `✨ BẤM ĐỂ BƯỚC VÀO THẾ GIỚI ✨` (`.intro-prompt-main`) dùng phông pixel retro, màu vàng kim `#ffffa0`, viền đen nổi khối kèm đổ bóng hào quang neon cam vàng rực rỡ (`introPromptPulse` breathing nhẹ nhàng).
       - Dòng phụ: `— NHẤP CHUỘT HOẶC PHÍM BẤT KỲ ĐỂ TIẾP TỤC —` (`.intro-prompt-sub`) trong sắc xám bạc tinh tế.
  3. **Chuyển Cảnh Mờ Dần Khi Người Chơi Bấm (.intro-fade-out):**
     - Màn hình Intro dừng lại chờ vô thời hạn cho tới khi người chơi thực sự nhấp chuột hoặc nhấn bất kỳ phím nào (không tự ý fade-out hay chạy quá trước khi có tương tác).
     - Khi bấm, toàn bộ màn hình Intro sẽ phóng nhẹ và mờ dần trong 600ms (`opacity: 0`, `transform: scale(1.03)`, `filter: brightness(1.25)`).
     - Chuyển cảnh êm ái, liền mạch hé lộ khung cảnh đại dương, mây trôi và Pokémon bay lượn của Màn Hình Chờ.
  4. **Kiểm Thử & Đảm Bảo Tính Toàn Vẹn ([game-intro.test.ts](file:///e:/Pokemon/apps/web/test/game-intro.test.ts)):**
     - Cập nhật unit test suite kiểm thử dòng chữ mời gọi xuất hiện và fade-out chuẩn xác.
     - `npm run typecheck:web` $\rightarrow$ PASS, 0 errors.
     - `npm run test:web` $\rightarrow$ 25/25 suites, 194/194 tests PASS 100%.

---

### 0.74. Vòng Xoay 18 Icon Type Theo Chiều Kim Đồng Hồ & Hào Quang Ánh Sáng Intro Mở Đầu:

- **Trạng thái:** Đã hoàn thành 100%. 25 tệp test suite (194/194 tests), Typecheck (`npm run typecheck:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Bổ sung phần intro mở đầu: cắt 18 icon type từ `Graphics/Intro/pokemon_types_transparent.png`, sắp xếp thành vòng tròn xoay theo chiều kim đồng hồ, sau đó Logo 2 xuất hiện đè lên chúng rồi thực hiện theo logic cũ; đồng thời bổ sung hiệu ứng chiếu sáng xoay tròn phía sau các icon type.
- **Chi tiết đã thực hiện:**
  1. **Tách 18 Icon Hệ Pokémon & Tạo Vòng Tròn Xoay ([game-intro.ts](file:///e:/Pokemon/apps/web/src/ui/game-intro.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Asset: [Graphics/Intro/pokemon_types_transparent.png](file:///e:/Pokemon/Graphics/Intro/pokemon_types_transparent.png) kích thước $408 \times 204\text{px}$ dạng lưới $6 \text{ cột} \times 3 \text{ hàng}$, mỗi ô chính xác $68 \times 68\text{px}$.
     - Tính toán tọa độ và góc xoay: 18 icon hệ được bố trí đều trên vòng tròn bán kính $R = 210\text{px}$ ($\Delta\theta = 20^\circ$, bắt đầu từ đỉnh 12h và xoay theo chiều kim đồng hồ).
     - Áp dụng CSS Sprite pixel-art hiển thị ở kích thước $44 \times 44\text{px}$ có đổ bóng hào quang nguyên tố.
     - Vòng tròn `.intro-type-ring` xoay liên tục theo chiều kim đồng hồ (`rotate(0deg)` $\rightarrow$ `rotate(360deg)`), các icon bên trong counter-rotate giữ biểu tượng luôn thẳng đứng và rõ nét.
  2. **Hiệu Ứng Chiếu Sáng Hào Quang Xoay Tròn (Celestial Radiance Effect):**
     - Bổ sung cụm hào quang `.intro-radiance-wrapper` phía sau vòng tròn type:
       - `.intro-radiance-rays`: Quầng tia sáng nhiều cánh (`conic-gradient` vàng hoàng kim & trắng bạc) chiếu rọi và xoay tròn liên tục (`introRadianceSpin`).
       - `.intro-radiance-aura`: Tâm hào quang phát sáng mềm mại, breathing nhẹ nhàng (`introAuraPulse`), biên ngoài mờ dần tự nhiên (loại bỏ hoàn toàn lằn viền tròn cứng `intro-radiance-track`).
  3. **Tiến Trình Chuyển Cảnh Khớp Tuyệt Đối Với Yêu Cầu & Logic Cũ:**
     - **0ms:** Màn hình đen khởi tạo.
     - **150ms:** Hào quang ánh sáng xoay tròn và vòng 18 icon type fade-in mềm mại, xoay đều theo chiều kim đồng hồ.
     - **600ms:** Logo 2 (viền trắng phát sáng `logo2.png`) xuất hiện đè lên trên vòng tròn type (`z-index: 5`).
     - **2200ms:** Logo 1 (màu sắc rực rỡ `logo1.png`) bừng sáng chói lọi, logo 2 mờ dần phía dưới.
     - **4200ms:** Chớp sáng seam ngang phát nổ, 2 nửa Shutter (trên trượt lên, dưới trượt xuống) tách đôi cả logo lẫn vòng tròn type mượt mà để lộ ra màn hình chờ.
  4. **Kiểm Thử & Đảm Bảo Tính Toàn Vẹn ([game-intro.test.ts](file:///e:/Pokemon/apps/web/test/game-intro.test.ts)):**
     - `npm run typecheck:web` $\rightarrow$ PASS, 0 errors.
     - `npm run test:web` $\rightarrow$ 25/25 suites, 194/194 tests PASS 100%.

---

### 0.73. Nhạc Nền Sảnh Chờ (Title BGM) & Cấu Hình Âm Lượng Riêng Biệt:

- **Trạng thái:** Đã hoàn thành 100%. 25 tệp test suite (194/194 tests), Typecheck (`npm run typecheck:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Cài đặt nhạc nền cho màn hình chờ từ `Audio/Misic backgound`, bổ sung cài đặt để cấu hình âm thanh riêng cho nhạc nền sảnh chờ.
- **Chi tiết đã thực hiện:**
  1. **Bộ Phát Nhạc Nền Sảnh Chờ Chuyên Dụng ([title-bgm.ts](file:///e:/Pokemon/apps/web/src/audio/title-bgm.ts)):**
     - Sử dụng bản phối giao hưởng: `[Pokemon ft. Miku] きみとそらをとぶ  Littleroot Town Orchestral Arrange - Jairus Cambe.mp3` trong thư mục [Audio/Misic backgound](file:///e:/Pokemon/Audio/Misic%20backgound).
     - Hỗ trợ vòng lặp vô tận (`loop = true`), mở khóa phát nhạc tự động linh hoạt theo chính sách bảo mật trình duyệt (`pointerdown`/`keydown` unlock).
     - Giảm âm lượng êm ái khi bắt đầu vào game Overworld (`stopBgm(450)` fade-out) tránh ngắt âm đột ngột.
  2. **Thanh Điều Khiển Âm Lượng Minecraft GUI Trong Hộp Thoại Cài Đặt ([title-screen.ts](file:///e:/Pokemon/apps/web/src/ui/title-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Bổ sung hàng cài đặt: `Âm Lượng Nhạc Nền Sảnh Chờ (BGM)`.
     - Nút Mute / Unmute pixel art: `[ 🔊 ]` $\longleftrightarrow$ `[ 🔇 ]`.
     - Thanh kéo trượt âm lượng Minecraft (`range slider` $0\% \rightarrow 100\%$) đi kèm số phần trăm trực quan (`txtTitleBgmVol`).
     - Tự động lưu giá trị âm lượng đã chọn vào `localStorage ('pokemon_title_bgm_volume')`.
  3. **Tích Hợp Vite Audio Bundler ([vite.config.ts](file:///e:/Pokemon/apps/web/vite.config.ts)):**
     - Đăng ký `Misic backgound` vào pipeline bundle file âm thanh của Vite đảm bảo hoạt động cả trên Dev Server lẫn Production Build.
  4. **Kiểm Thử & Đảm Bảo Tính Toàn Vẹn ([title-screen.test.ts](file:///e:/Pokemon/apps/web/test/title-screen.test.ts)):**
     - `npm run typecheck:web` $\rightarrow$ PASS, 0 errors.
     - `npm run test:web` $\rightarrow$ 25/25 suites, 194/194 tests PASS 100%.

---

### 0.72. Bổ Sung Tầng Cỏ Nền Sau (05a Grass Back) Theo Từng Buổi (Day, Sunset, Night):

- **Trạng thái:** Đã hoàn thành 100%. 25 tệp test suite (193/193 tests), Typecheck (`npm run typecheck:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Bổ sung `Intro_night/05a_grass_back_night.png` và `Intro_sunset/05a_grass_back_sunset.png` tương ứng cho từng buổi.
- **Chi tiết đã thực hiện:**
  1. **Đồng Bộ & Quản Lý Asset ([title-screen.ts](file:///e:/Pokemon/apps/web/src/ui/title-screen.ts)):**
     - **Ban Ngày (Day):** Sử dụng `Intro_moning/05_grass.png` ($1920 \times 1200\text{px}$).
     - **Hoàng Hôn (Sunset):** Sử dụng `Intro_sunset/05a_grass_back_sunset.png` ($1920 \times 1200\text{px}$) với rặng núi/gò cỏ ngả sắc cam ấm áp của buổi chiều tà.
     - **Ban Đêm (Night):** Sử dụng `Intro_night/05a_grass_back_night.png` ($1920 \times 1200\text{px}$) với sắc tím xanh sẫm tĩnh mịch của màn đêm.
  2. **Render Theo Chủ Đề Hiện Tại:**
     - Lựa chọn hình ảnh nền sau `curBackGrassImg` tự động theo biến `currentTheme` (`day` / `sunset` / `night`).
     - Cuộn nền vô tận mượt mà từ Trái sang Phải cùng nhịp với dải cỏ animated bên trên.
  3. **Kiểm Thử & Đảm Bảo Tính Toàn Vẹn ([title-screen.test.ts](file:///e:/Pokemon/apps/web/test/title-screen.test.ts)):**
     - `npm run typecheck:web` $\rightarrow$ PASS, 0 errors.
     - `npm run test:web` $\rightarrow$ 25/25 suites, 193/193 tests PASS 100%.

---

### 0.71. Màn Hình Chờ Ban Đêm (Night Theme) & Chu Kỳ 3 Chủ Đề (Day / Sunset / Night):

- **Trạng thái:** Đã hoàn thành 100%. 25 tệp test suite (193/193 tests), Typecheck (`npm run typecheck:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Tích hợp bộ asset Ban Đêm từ `Intro_night` và `grass_front_night`, thay thế các phần nền và dàn Pokémon phù hợp với màn đêm.
- **Chi tiết đã thực hiện:**
  1. **Tích Hợp Asset Màn Đêm Huyền Bí ([Intro_night](file:///e:/Pokemon/Graphics/Intro/Intro_night), [grass_front_night](file:///e:/Pokemon/Graphics/Intro/grass_front_night)):**
     - **Bầu trời & Sao:** Bầu trời đêm tĩnh mịch `01_sky_night.png` kết hợp dải ngân hà lấp lánh `01b_stars_night.png` với hiệu ứng chớp sáng huyền ảo (`twinkle: 0.85 + sin(t) * 0.15`).
     - **Mặt Trăng & Quầng Sáng Đêm:** Đĩa mặt trăng `06_moon_disc.png` và quầng sáng bạc `06_moon_glow.png` ngự trị ở góc trời cao $(CX=1213, CY=246)$.
     - **Mặt Biển & Vệt Trăng Phản Chiếu:** Biển đêm xanh thẫm `03_sea_night.png` kết hợp dải ánh trăng bạc lấp lánh `04_moon_reflection_cropped_night.png` trải dài trên mặt sóng tại $X=984, Y=848$.
     - **Tầng Cỏ Animated Ban Đêm:** 24 khung hình từ [Graphics/Intro/grass_front_night](file:///e:/Pokemon/Graphics/Intro/grass_front_night) (`frame_00.png` $\rightarrow$ `frame_23.png`) trong tông màu tím đêm huyền ảo.
  2. **Dàn Pokémon Huyền Thoại & Thủy Quái Ban Đêm:**
     - **Chim Trời / Bay Lượn (Flying Pokémon):**
       - 1 **Lugia** (`LUGIA.png`, 4 frames $128 \times 123\text{px}$): Huyền thoại biển sâu sải cánh bay lượn uy phong qua bầu trời đêm ngàn sao.
       - 4 **Fearow** (`FEAROW.png`, 4 frames $64 \times 64\text{px}$): Đàn chim săn đêm lướt gió.
     - **Pokémon Biển Đêm (Sea Pokémon):**
       - 1 **Kyogre** (`yogre.png`, 4 frames $128 \times 127\text{px}$): Siêu cổ đại thủy thần trồi lên mặt nước hùng vĩ tại $X=1190, Y=828$.
       - 1 **Feraligatr** (`Surfaligatueur.png`, 4 frames $64 \times 69\text{px}$): Cá sấu bạo chúa bơi dũng mãnh tại $X=1460, Y=848$.
       - 1 **Starmie** (`surfstaross.png`, 4 frames $64 \times 68\text{px}$): Sao biển phát sáng ngọc đỏ bồng bềnh tại $X=980, Y=849$.
  3. **Hộp Thoại Cài Đặt Hỗ Trợ Xoay Vòng 3 Chủ Đề:**
     - Nút trong Modal Cài Đặt luân chuyển tuần tự: `☀️ Ban Ngày (DAY)` $\rightarrow$ `🌅 Hoàng Hôn (SUNSET)` $\rightarrow$ `🌙 Ban Đêm (NIGHT)` $\rightarrow$ `☀️ Ban Ngày`.
     - Lưu trữ trạng thái lựa chọn vào `localStorage ('pokemon_title_theme')`.
  4. **Kiểm Thử & Đảm Bảo Tính Toàn Vẹn ([title-screen.test.ts](file:///e:/Pokemon/apps/web/test/title-screen.test.ts)):**
     - `npm run typecheck:web` $\rightarrow$ PASS, 0 errors.
     - `npm run test:web` $\rightarrow$ 25/25 suites, 193/193 tests PASS 100%.

---

### 0.70. Tinh Chỉnh Mặt Trời Sunset (Thu Nhỏ 0.88x & Đẩy Xuống 5px):

- **Trạng thái:** Đã hoàn thành 100%. 25 tệp test suite (193/193 tests), Typecheck (`npm run typecheck:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** "thủ nhỏ mặt trời sunset lại 1 ít nhé và đẩy xuống 5px" - Thu nhỏ vầng thái dương hoàng hôn và dịch chuyển xuống 5px để chìm sâu hơn vào đường chân trời tự nhiên.
- **Chi tiết đã thực hiện:**
  1. **Thu Nhỏ & Dịch Chuyển Mặt Trời ([title-screen.ts](file:///e:/Pokemon/apps/web/src/ui/title-screen.ts)):**
     - Tâm mặt trời hoàng hôn được xác định tại $(CX=1216, CY=800)$.
     - Áp dụng phép biến đổi ma trận 2D Canvas:
       - `ctx.translate(1216, 800 + 5)` (dịch chuyển xuống $5\text{px}$).
       - `ctx.scale(0.88, 0.88)` (thu nhỏ nhẹ $\approx 12\%$, kích thước đĩa mặt trời giảm từ $132\text{px}$ xuống $\approx 116\text{px}$).
       - `ctx.translate(-1216, -800)` (neo tỷ lệ ngay tâm đĩa mặt trời).
     - Cả đĩa mặt trời (`06_sun_sunset_disc.png`) lẫn quầng phát quang (`06_sun_sunset_glow.png`) đều được thu nhỏ và đẩy xuống đồng bộ.
  2. **Đồng Bộ Vệt Nắng Phản Chiếu Trên Mặt Biển:**
     - Vệt nắng phản chiếu (`04_sun_reflection_cropped_sunset.png`) được co lại tương ứng theo tỷ lệ $0.88\times$ ($W = 410\text{px}$), căn giữa thẳng trục với mặt trời tại $X=1011$ và dịch nhẹ xuống $Y=850$.
  3. **Kiểm Thử & Đảm Bảo Tính Toàn Vẹn ([title-screen.test.ts](file:///e:/Pokemon/apps/web/test/title-screen.test.ts)):**
     - `npm run typecheck:web` $\rightarrow$ PASS, 0 errors.
     - `npm run test:web` $\rightarrow$ 25/25 suites, 193/193 tests PASS 100%.

---

### 0.69. Modal Cài Đặt Minecraft GUI & Màn Hình Chờ Hoàng Hôn (Sunset Theme):

- **Trạng thái:** Đã hoàn thành 100%. 25 tệp test suite (193/193 tests), Typecheck (`npm run typecheck:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Tại nút Cài Đặt, mở modal pixel art ở giữa màn hình có nút bật/tắt Sunset; thêm màn hình chờ Hoàng Hôn sử dụng `grass_front_sunset` và `Intro_sunset` thay thế các phần nền và Pokémon.
- **Chi tiết đã thực hiện:**
  1. **Giao Diện Hộp Thoại Cài Đặt Pixel Art Chuẩn Minecraft ([title-screen.ts](file:///e:/Pokemon/apps/web/src/ui/title-screen.ts), [style.css](file:///e:/Pokemon/apps/web/src/style.css)):**
     - Bổ sung modal centered `#titleSettingsModal` với phong cách Minecraft GUI:
       - Nền xám đá `#444444`, viền đen dày 4px, khối Bevel 3D (`inset 3px 3px 0px rgba(255,255,255,0.45), inset -3px -3px 0px #222222`).
       - Tiêu đề "⚙️ CÀI ĐẶT HỆ THỐNG" phông chữ pixel vàng `#ffffa0`, text-shadow `#3f3f28`.
       - Nút chuyển đổi: `[ 🌅 Chủ Đề: Hoàng Hôn [ BẬT ] ]` / `[ ☀️ Chủ Đề: Ban Ngày [ TẮT ] ]`.
       - Nút đóng `✕` và nút `XONG` chuẩn Minecraft, hỗ trợ bấm backdrop hoặc phím `Escape` để thoát.
       - Lưu trạng thái vào `localStorage` ('pokemon_title_theme') và hỗ trợ thông báo toast phản hồi tức thì.
  2. **Thay Thế Hoàn Toàn Tầng Nền Hoàng Hôn (Sunset Assets):**
     - **Bầu trời:** Thay sang `Intro_sunset/01_sky_sunset.png` với sắc hoàng hôn cam đỏ rực rỡ.
     - **Mặt trời & Quầng sáng:** Tích hợp `06_sun_sunset_glow.png` và `06_sun_sunset_disc.png` phủ lên không gian, cùng `04_sun_reflection_cropped_sunset.png` phản chiếu lung linh trên mặt biển tại tọa độ $X=984, Y=848$.
     - **Mặt biển:** Cuộn vô tận `03_sea_sunset.png` theo chiều từ Phải sang Trái.
     - **Tầng cỏ animated:** Chuyển sang 24 khung hình từ [Graphics/Intro/grass_front_sunset](file:///e:/Pokemon/Graphics/Intro/grass_front_sunset) (`frame_00.png` $\rightarrow$ `frame_23.png`) ngả màu vàng cam hoàng hôn đồng điệu.
  3. **Thay Thế Toàn Bộ Pokémon Chuẩn Mực Hoàng Hôn ([Intro_sunset](file:///e:/Pokemon/Graphics/Intro/Intro_sunset)):**
     - **Chim trời (Birds):** Thay Pelipper & Wingull bằng:
       - 1 **Swanna** (`SWANNA.png`, 4 frames $64 \times 63\text{px}$) bay lượn kiêu hãnh.
       - 4 **Swablu** (`SWABLU.png`, 4 frames $64 \times 67\text{px}$) đàn chim mây bồng bềnh lướt qua ráng chiều.
     - **Pokémon biển (Sea Pokemon):** Thay Gyarados Red bằng:
       - **Lapras / Loklass** (`surfloklass.png`, 4 frames $64 \times 65\text{px}$) cưỡi sóng êm ả tại $X=1290, Y=847$.
       - **Tentacool** (`surftentacool.png`, 4 frames $64 \times 73\text{px}$) dập dềnh tại $X=1460, Y=849$.
       - **Tentacruel** (`surftentacruel.png`, 4 frames $64 \times 75\text{px}$) lướt sóng tại $X=1060, Y=846$.
  4. **Kiểm Thử & Đảm Bảo Tính Toàn Vẹn ([title-screen.test.ts](file:///e:/Pokemon/apps/web/test/title-screen.test.ts)):**
     - `npm run typecheck:web` $\rightarrow$ PASS, 0 errors.
     - `npm run test:web` $\rightarrow$ 25/25 suites, 193/193 tests PASS 100%.

---

### 0.68. Tinh Chỉnh Mật Độ Lá Bay Title Screen (Giảm Từ 35 Xuống 12 Lá):

- **Trạng thái:** Đã hoàn thành 100%. 25 tệp test suite (192/192 tests), Typecheck (`npm run typecheck:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** "cho sinh ra ít lại nhé nhiều lá quá rồi" - Giảm tần suất và số lượng lá bay để màn hình không bị quá tải, tạo cảm giác thoáng đãng và tự nhiên.
- **Chi tiết đã thực hiện:**
  1. **Giảm Số Lượng Lá Cố Định ([title-screen.ts](file:///e:/Pokemon/apps/web/src/ui/title-screen.ts)):**
     - Giảm `TOTAL_LEAVES` từ 35 lá xuống **12 lá** (6 lá tầng trung cảnh `mid`, 6 lá tầng cận cảnh `fore`).
     - Tỷ lệ phân bổ đều trên toàn khung nhìn canvas $1920 \times 1200$, mỗi thời điểm chỉ có 8-10 lá xuất hiện lác đác trong tầm nhìn.
  2. **Chu Kỳ Tái Sinh Nhẹ Nhàng:**
     - Các hạt lá sau khi vượt mép phải ($X > 1980\text{px}$) hoặc rơi đáy ($Y > 1250\text{px}$) được đưa về bên trái ngoài màn hình với độ lệch ngẫu nhiên, giúp luồng gió thoảng lá bay đều đặn, không dồn cục.
  3. **Kiểm Thử & Đảm Bảo Tính Toàn Vẹn:**
     - `npm run typecheck:web` $\rightarrow$ PASS, 0 errors.
     - `npm run test:web` $\rightarrow$ 25/25 suites, 192/192 tests PASS 100%.

---

### 0.67. Tích Hợp Asset Lá Cây Pixel Art Sprite Sheet (leaf.png 80x16px, 5 Frames) Vào Title Screen:

- **Trạng thái:** Đã hoàn thành 100%. 25 tệp test suite (192/192 tests), Typecheck (`npm run typecheck:web`) đạt kết quả **PASS 100%**.
- **Yêu cầu người dùng:** Bỏ phần tự vẽ pixel procedural, sử dụng trực tiếp asset hình ảnh lá cây pixel art do người dùng cung cấp (`leaf.png`).
- **Chi tiết đã thực hiện:**
  1. **Đồng Bộ & Quản Lý Asset Lá Cây ([leaf.png](file:///e:/Pokemon/Graphics/Intro/leaf.png)):**
     - Lưu trữ asset spritesheet nguyên bản kích thước $80 \times 16\text{ px}$ vào [Graphics/Intro/leaf.png](file:///e:/Pokemon/Graphics/Intro/leaf.png) và [apps/web/public/Graphics/Intro/leaf.png](file:///e:/Pokemon/apps/web/public/Graphics/Intro/leaf.png).
     - Asset chứa 5 khung hình pixel art ($16 \times 16\text{ px}$ mỗi frame) diễn hoạt quá trình lật xoay chuyển động của chiếc lá với màu vàng chanh / xanh non đặc trưng.
  2. **Thay Thế Hoàn Toàn Thuật Toán Procedural Sang Cắt Frame Sprite Sheet ([title-screen.ts](file:///e:/Pokemon/apps/web/src/ui/title-screen.ts)):**
     - Loại bỏ toàn bộ ma trận dữ liệu vẽ điểm ảnh thủ công (`PIXEL_LEAF_FRAMES`, `PIXEL_LEAF_PALETTES`, v.v.).
     - Tải trước ảnh qua hàm `loadImage('/Graphics/Intro/leaf.png')`.
     - Cắt frame theo vị trí ngang: `sx = frameIndex * 16`, `sy = 0`, `sw = 16`, `sh = 16`.
     - Giữ nguyên cấu trúc pixel art sắc nét bằng `ctx.imageSmoothingEnabled = false`.
  3. **Vật Lý Bay & Tỷ Lệ Hiển Thị Đa Tầng:**
     - Tầng trung cảnh (`mid`): scale $1.4 - 1.9\times$ ($22 - 30\text{px}$), bay sau cỏ tiền cảnh và trước Viento.
     - Tầng cận cảnh (`fore`): scale $2.4 - 3.2\times$ ($38 - 51\text{px}$), bay phía trước các ngọn cỏ cận camera.
     - Diễn hoạt xoay 5 frame theo tốc độ $6 - 8.5\text{ FPS}$, chuyển động trôi ngang theo luồng gió $v_x = 155 - 310\text{ px/s}$ và rơi tự nhiên kèm dao động lượn sóng $\sin(t)$.
  4. **Kiểm Thử & Đảm Bảo Tính Toàn Vẹn ([title-screen.test.ts](file:///e:/Pokemon/apps/web/test/title-screen.test.ts)):**
     - `npm run typecheck:web` $\rightarrow$ PASS, 0 errors.
     - `npm run test:web` $\rightarrow$ 25/25 suites, 192/192 tests PASS 100%.

---

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
     - Menu hành động giờ đây chỉ giữ lại các tùy chọn chuẩn mực, tinh gọn: _Ra chiến đấu_ (khi chọn đấu sĩ), _Đổi vị trí_, _Xem thông tin_, và _Đóng_.
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

### 26. Tích hợp animation pack Pokémon Last Chance 1.22

- **Import namespaced, không ghi đè pack hiện tại:** Thêm 758 timeline JSON vào `packages/game-data/animations/last-chance/` với ID namespace `6000 + sourceId`, cùng 115 sprite sheet vào `Graphics/Animations/LastChance/`.
- **Mapping runtime:** Tạo `move-animation-extensions.json` với 334 move regular và 27 biến thể OppMove. `BattleAnimationRegistry` luôn ưu tiên mapping/asset hiện tại; chỉ dùng Last Chance cho move chưa có animation cũ.
- **Asset registry:** Gộp `last-chance-animation-atlas.json` vào `AnimationAssetRegistry`, resolver tự trả đúng đường dẫn `/Graphics/Animations/LastChance/...`.
- **Gallery:** Visual QA gallery hiển thị cả mapping hiện tại và mapping mở rộng, hỗ trợ kiểm tra các move mới theo Player/Enemy.
- **An toàn timeline:** 23 timeline nguồn có pattern hoặc graphic không hợp lệ được ghi tại `last-chance-animation-rejections.json`, bị chặn khỏi runtime và không được phép lọt qua multi-hit lookup.
- **Validation & test:** Validator kiểm tra cả hai pack, 1.069 definition/atlas hợp lệ; test suite đạt 47 files / 581 tests, typecheck, lint và format đều pass. Production build pass; build hiện phát cảnh báo kích thước chunk `gameplay-ui` do baseline battle modules đang lớn, không có lỗi asset/circular chunk.

### 27. Sửa pha hồi phục của animation ABSORB

- **Đã sửa hướng hiển thị:** Các hạt vàng vẫn hút từ mục tiêu về Pokémon sử dụng `ABSORB`; các hạt xanh ở pha sau không còn bị coi là projectile bay qua phía đối thủ.
- **Đúng focus runtime:** Toàn bộ hạt xanh trong pha hồi phục được neo bằng `focus: "user"` và chuyển động trong vùng quanh Pokémon sử dụng chiêu.
- **Chậm và dễ quan sát hơn:** Timeline `ABSORB` giảm từ `20fps` xuống `12fps`, giữ đủ nhịp hút năng lượng và nhịp phát sáng hồi phục.
- **Bảo vệ hồi quy:** Bổ sung test xác nhận hạt xanh không vượt khỏi vùng quanh user, cel cuối quay về tâm user, và timeline có tốc độ 12fps.
- **Kiểm tra:** `battle-timeline-animations.test.ts` đạt 38/38; `validate:schemas` PASS với 1.069 animation definitions và atlas hợp lệ.

### 28. Sửa thời điểm tụ/nở của animation ACID

- Giữ các hạt acid nhỏ/tách rời trong đoạn bay, đặc biệt tại frame 6–7.
- Dời các pattern tụ và nở lớn `9–14` đến vùng enemy, bắt đầu sau khi projectile đã tới điểm đích.
- Kéo timeline từ 13 lên 20 frame để tạo đủ nhịp bay và nhịp phát nổ tại mục tiêu.
- Chỉ thay đổi dữ liệu animation `ACID` (ID 24); chưa chạy lại CI theo yêu cầu kiểm tra nhanh.

### 29. Loại bỏ sprite lạ chen vào ACID

- Nguyên nhân là timeline ACID đã dùng nhầm pattern `0–2` trong cùng sprite sheet `poison2.png`.
- Đã thay toàn bộ bằng nhóm pattern acid hợp lệ `3–14`; frame 6–8 không còn sprite khác loại.

### 30. Đổi đường bay ACID sang quỹ đạo cong

- Projectile ACID hiện dùng đường cong Bezier bậc hai thay cho đường thẳng.
- Hạt bay lên nhẹ ở giữa quãng đường rồi hạ xuống đúng vị trí enemy trước khi tụ/nở.

### 31. Sửa animation ACID SPRAY

- Thay timeline cũ dùng `focus: "target"` và bubble rơi từ trên cao.
- Tạo lại chuỗi bubble xanh từ user đến enemy bằng `focus: "both"`, gồm nhiều hạt nối tiếp tạo cảm giác phun acid.
- Giảm tốc độ timeline xuống `16fps`; các pattern hiển thị chỉ dùng nhóm bubble `0–4` của `fly copy`.

### 32. Thay asset ACID SPRAY

- Loại bỏ `fly copy` vì đây là sheet bubble nước/khí, không phù hợp với chiêu Độc.
- `ACID SPRAY` hiện dùng `poison4.png`, gồm chuỗi giọt/khối acid tím tăng kích thước từ user đến enemy.

### 33. Bổ sung impact ACID SPRAY

- Thêm 6 frame impact sau khi bubble chạm enemy.
- Khối acid phình lên rồi chuyển qua pattern `10–14` để tạo cảm giác vỡ/tách thành mảnh độc tại mục tiêu.

### 34. Sửa cơ chế hiển thị ALLY SWITCH

- Loại bỏ quả cầu phóng to không phù hợp khỏi timeline animation ID 32.
- Khi dùng `ALLY SWITCH`, renderer tạm thời cho sprite Player và Enemy lướt nhanh qua vị trí đối diện, sau đó trả về vị trí chiến đấu ban đầu.
- Timeline chỉ còn flash chuyển cảnh; không thay đổi hai bên trong battle model.

### 35. Sửa đội hình đá của ANCIENT POWER

- Giữ bố cục đá phân tán đẹp ở frame 12.
- Frame 13–19 giờ dùng các offset lệch có kiểm soát, tránh toàn bộ đá bị kéo thành một hàng thẳng trước khi bay tới mục tiêu.

### 36. Sửa lỗi runtime kéo thẳng đá ANCIENT POWER

- Nguyên nhân được xác định tại `coordinate-transformer.ts`: cel có `focus: "both"` bị runtime nội suy vị trí theo trục X giữa user và target, nên mọi thay đổi Y trong JSON vẫn bị ép thành một đường thẳng.
- Chuyển toàn bộ đá ở frame 12–19 sang `focus: "user"`, giữ tọa độ rải độc lập quanh Pokémon người dùng trong giai đoạn triệu hồi.
- Các frame sau vẫn giữ `focus: "both"` để đá bay về phía đối thủ sau khi đội hình đã hình thành.

### 37. Sửa animation AQUA RING bị neo sang enemy

- Nguyên nhân: timeline cũ dùng graphic `fly copy` và toàn bộ visual cel `focus: "both"` ở tọa độ gần target, nên chiêu tự hỗ trợ xuất hiện phía đối thủ.
- Thay bằng graphic `018-Water01`, sử dụng các pattern vòng nước thật `7`, `8`, `11`.
- Tạo lại timeline 16 frame ở `12fps`, toàn bộ visual cel dùng `focus: "user"`, hiệu ứng phóng to–thu nhỏ và fade quanh đúng Pokémon thi triển.
- Logic gameplay `hasAquaRing` giữ nguyên; chỉ thay đổi VFX.

### 38. Sửa animation AROMATIC MIST bị biến thành projectile

- Nguyên nhân: timeline Last Chance `6698` dùng các cloud `Special5` với `focus: "both"`, rải theo đường user → target.
- Giữ đúng asset sương tím `Special5`, nhưng dựng lại thành 12 frame ở `12fps` với các lớp sương xuất hiện, dày lên rồi tan quanh Pokémon thi triển.
- Toàn bộ 39 visual cel chuyển sang `focus: "user"`; không còn đường bay hoặc hiệu ứng bắn sang enemy.
- Logic tăng Sp. Defense của chiêu không thay đổi.

### 39. Sửa animation ASSIST bị kéo thành hàng ngang

- Nguyên nhân: 42 dấu chân trong timeline `6326` dùng `focus: "both"`, khiến runtime nội suy chúng trên trục user → target.
- Giữ asset `WaterBubbles` và pattern dấu chân `7`, nhưng bố trí lại theo nhiều vòng cung trên các vùng trái/phải/trên/dưới quanh Pokémon.
- Timeline còn 10 frame ở `12fps`; toàn bộ visual cel dùng `focus: "user"`, có xoay/lật nhẹ để tránh cảm giác lặp cứng.

### 40. Sửa pha impact của ASTONISH

- Nguyên nhân: các bubble impact pattern `4`/`10` dùng `focus: "both"`, nên bị nội suy thành hàng ngang trước enemy.
- Giữ phần chuẩn bị của chiêu; thay pha trúng đích bằng 7 frame burst tại vùng quanh enemy.
- Tạo 52 bubble nhỏ, chủ yếu pattern `4`, thêm pattern `3`, phân tán theo nhiều hướng với opacity/rotation thay đổi.
- Toàn bộ bubble impact dùng `focus: "target"`, tốc độ timeline `14fps`, không còn kéo theo đường user → target.

### 41. Làm lại animation AUTOTOMIZE

- Nguyên nhân: timeline cũ dùng asset `Iron Head.png`, pattern đĩa kim loại và nhiều cel `focus: "both"`, không phù hợp với chiêu tự giảm khối lượng/tăng Tốc độ.
- Thay bằng asset `Light1`, tạo hiệu ứng vòng sáng bạc và các tia sáng pulse quanh Pokémon thi triển.
- Timeline mới gồm 15 frame ở `12fps`, toàn bộ 42 visual cel dùng `focus: "user"`, có nhịp sáng mạnh rồi fade dần.
- Logic tăng Speed của `AUTOTOMIZE` không thay đổi.

### 42. Mask Baneful Bunker vào silhouette Pokémon

- Timeline player bỏ qua pattern nền xanh `11` của `BANEFUL BUNKER` để không vẽ nguyên hình chữ nhật atlas lên sân đấu.
- `BattleRenderer` tạo effect layer và mask layer offscreen; mask layer dùng đúng frame sprite Pokémon đang hoạt ảnh.
- Dùng `destination-in` để chỉ giữ phần màu xanh nằm trong alpha silhouette của Pokémon, còn các cel gai/khung chắn bên ngoài vẫn được render bình thường.
- Mask có tính đến phía tấn công, frame sprite hiện tại và lunge/hit offset; không thay đổi battle state hay logic Protect/Poison.

### 43. Sửa animation BATON PASS

- Nguyên nhân: timeline cũ dùng asset `Cups + Musical Notes.png`, không liên quan đến Baton Pass; tọa độ visual cel tạo chuyển động gãy/hình chữ L.
- Thay bằng asset `PRAS- Baton Pass.png`, gồm baton đỏ và hiệu ứng bàn tay chuyển giao phù hợp hơn.
- Đăng ký atlas `PRAS- Baton Pass` theo chuẩn 5×3 cell.
- Làm lại cả player timeline `6333` và OppMove `6334`: baton xoay trong quỹ đạo nhỏ quanh Pokémon thi triển, không chạy theo đường ngang hoặc đường gãy.
- Cập nhật legacy fallback trong `move-vfx.ts`; logic chuyển Pokémon và truyền stat stages giữ nguyên.

### 44. Sửa animation BELCH dùng nhầm WaterBubbles

- Nguyên nhân: timeline Last Chance `6729` trỏ vào `last-chance/WaterBubbles.png`, khiến BELCH hiển thị như đòn bong bóng nước.
- Thay bằng atlas `poison.png` đã được runtime đăng ký sẵn, sử dụng các pattern khói độc màu tím.
- Dựng lại timeline 14 frame ở `12fps`: khói phát ra từ Pokémon thi triển, bay tới mục tiêu và bung lớn tại điểm va chạm.
- Dùng atlas chuẩn 5×3 cell 192×192 để renderer luôn tải và cắt đúng từng pattern trong dev/build.
- Không thay đổi logic sát thương hay hiệu ứng Poison của BELCH.

### 45. Làm lại animation BELLY DRUM

- Nguyên nhân: timeline cũ dùng `003-Attack01`, không thể hiện đúng hành động Pokémon tự đánh vào bụng và không có nốt nhạc.
- Thay bằng `PRAS- Sound.png`, gồm sprite nắm đấm đỏ và các pattern nốt nhạc.
- Dựng lại 18 frame ở `12fps`, tạo 5 nhịp tự đánh liên tiếp kèm vòng va chạm và nốt nhạc bật lên quanh Pokémon sử dụng.
- Toàn bộ visual cel dùng `focus: "user"`; BELLY DRUM không còn phát hiệu ứng sang phía đối thủ.
- Không thay đổi logic tăng Attack và trừ HP của chiêu.
- Hiệu chỉnh lại pattern sau kiểm tra Gallery: dùng đúng pattern `43` cho nắm đấm và `30–35` cho nốt nhạc; loại bỏ các pattern tia sét/vòng màu bị chọn nhầm.
- Đặt toàn bộ cel ở `priority: 1` (lớp foreground của renderer) để nắm đấm và nốt nhạc không bị sprite Pokémon che khuất.
- Bổ sung pattern vòng va chạm `36` tại mỗi nhịp đánh, sau đó cho vòng mở rộng và mờ dần.
- Rải hai nắm đấm ở các vị trí trái/phải khác nhau quanh Pokémon, thay vì chồng tại một điểm.
- Giảm tốc timeline xuống `8fps` và giữ nốt nhạc qua hai frame để người chơi nhìn rõ hơn.

### 46. Sửa animation BESTOW thành túi ném theo đường cong

- Nguyên nhân: timeline cũ dùng `011-Weapon06`, hiển thị vật thể tròn/năng lượng thay vì vật phẩm dạng túi; toàn bộ đường bay dùng nội suy thẳng.
- Dùng đúng sprite túi được cung cấp `PRAS- Present.png`; đã loại nền xanh chroma-key thành `PRAS- Present Transparent.png` qua atlas `bestow-bag`.
- Dựng lại 12 frame ở `12fps`, túi bay theo cung cong từ Pokémon sử dụng tới mục tiêu và xoay dần trong khi bay.
- Bổ sung cờ `curve: "arc"` cho cel `focus: "both"`; sửa đúng vị trí truyền cờ trong Gallery/Player để runtime giữ độ lệch Y do timeline author, tạo cung ném rõ ràng và vẫn mirror đúng khi Enemy sử dụng.
- Không thay đổi logic truyền Held Item của BESTOW.

### 47. Làm lại animation BIDE thành trạng thái tích giận

- Nguyên nhân: timeline cũ dùng `fly copy.png` và `focus: "both"`, khiến BIDE hiển thị sai như hiệu ứng bay và kéo về phía đối thủ.
- Thay bằng `PRAS- Smokescreen.png`, tạo hai cột khói độc lập bốc lên ở hai bên Pokémon sử dụng.
- Timeline mới gồm 12 frame ở `10fps`, khói lớn dần rồi tan dần quanh người dùng; toàn bộ cel dùng `focus: "user"`.
- Thêm timing flash đỏ `flashScope: 2` để sprite Pokémon đang dùng BIDE chuyển đỏ trong giai đoạn tích giận.
- Mở API flash battler từ animation player và tích hợp vào battle renderer; không thay đổi logic sát thương hoặc trạng thái BIDE.

### 48. Làm lại animation BLAST BURN thành chuỗi cột lửa trên mặt đất

- Nguyên nhân: timeline gốc `48.json` chứa nhiều cel Firebird chồng lẫn, nhiều cel mục tiêu đặt tại `(0, 0)` và trộn nhiều pattern trong cùng frame, tạo cảm giác lửa bắn tán loạn.
- Dùng đúng spritesheet `Blast-Burn.png`; tạo atlas chuẩn `Blast-Burn-Columns.png` với các pattern cột lửa đơn và nhóm cột lửa impact để renderer cắt frame ổn định.
- Timeline mới phát đúng 9 pose của spritesheet tại Pokémon tung chiêu theo thứ tự từ trên xuống `0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8` ở `8fps`.
- Sau 9 pose nguồn, bổ sung 1 frame dùng lại pattern đầu tiên tại Enemy; không dùng `focus: "both"`, không nội suy tọa độ và không còn cảm giác vật thể bay giữa hai Pokémon.
- Toàn bộ 9 frame tại người dùng được nâng thêm `30px` (`y: 184 → 154`); frame 1–3 và 9 giữ `135%`, frame 4–8 dùng `180%`. Các frame này đặt ở `priority: 0` để Pokémon che phần gốc hiệu ứng; frame impact tại Enemy giữ `100%` và `priority: 1`.
- Không thay đổi mapping move, sát thương hoặc logic chiến đấu của BLAST BURN.

### 49. Làm lại animation BLAZE KICK

- Nguyên nhân: timeline cũ dùng `last-chance/WaterBubbles.png`, nên Blaze Kick hiển thị như bong bóng và các cel `focus: "both"` tạo đường chéo lệch.
- Dùng đúng asset `PRAS- Blaze Kick.png`, đăng ký atlas `pras-blaze-kick` gồm dấu chân, lửa nhỏ và lửa lớn.
- Thu nhỏ pha chuẩn bị; từ frame 4 trở đi tạo nhiều ngọn lửa quanh Enemy bằng các cel `focus: "target"` phân tán theo nhiều vị trí, góc xoay và độ mờ khác nhau.
- Giữ pattern dấu chân `0` ở ba frame đầu tại chính giữa Enemy, tăng lên `90%` và đưa lên `priority: 1` để hiển thị rõ.
- Không thay đổi mapping move, sát thương hoặc logic chiến đấu của BLAZE KICK.

### 50. Làm lại animation BULK UP thành hiệu ứng tự cường hóa

- Nguyên nhân: timeline cũ dùng `animsheet`, đặt hiệu ứng ở `focus: "target"` và lặp các pose không liên quan.
- Dùng đúng spritesheet `PRAS- Bulk Up.png`, gồm 5 pose sức mạnh tăng dần.
- Timeline mới chạy quanh Pokémon sử dụng với chuỗi pose `0 → 1 → 2 → 3 → 4`, giữ pose mạnh nhất ngắn rồi fade ngược về `0`; không còn cel bay hoặc cel đặt lên đối thủ.
- Không thay đổi mapping move, chỉ thay asset và timeline hiển thị của BULK UP.

### 51. Rà soát & Tối ưu toàn diện 63 chiêu thức nhóm C, D, E (Enemy-Cast Pinning & Audio Integrity)

- **Rà soát nhóm C (23 chiêu thức tinh chỉnh)**:
  - `calm_mind`, `charge`, `charge_beam`, `charm`, `chatter`, `clamp`, `clear_smog`, `close_combat`, `coil`, `comet_punch`, `confuse_ray`, `conversion`, `cotton_spore`, `counter`, `crabhammer`, `cross_chop`, `cross_poison`, `crunch`, `crush_claw`, `crush_grip`, `curse`, `cut`, `cotton_guard`.
  - Kết quả: 23/23 chiêu thức đạt chuẩn tuyệt đối, cấu trúc focus user/target/both phân chia chuẩn xác, không bị ghim khi địch tung chiêu.
  - Sửa lỗi âm thanh `cotton_guard` ([72.json](file:///e:/Pokemon/packages/game-data/animations/72.json)): thay `StatUp` thành `Anim/Up` để khớp đúng file âm thanh có sẵn `Audio/SE/Anim/Up.ogg`. Đồng thời nhân bản alias `StatUp.ogg` dự phòng.

- **Rà soát nhóm D (27 chiêu thức tinh chỉnh)**:
  - `dark_pulse`, `dark_void`, `dazzling_gleam`, `defend_order`, `destiny_bond`, `detect`, `dig`, `disarming_voice`, `discharge`, `dive`, `dizzy_punch`, `doom_desire`, `double_kick`, `double_team`, `dragon_ascent`, `dragon_breath`, `dragon_claw`, `dragon_dance`, `dragon_hammer`, `dragon_pulse`, `dragon_rage`, `dragon_tail`, `drain_punch`, `drill_peck`, `drill_run`, `dual_chop`, `dynamic_punch`.
  - Phát hiện & sửa lỗi ghim màn hình ở `dazzling_gleam` ([6753.json](file:///e:/Pokemon/packages/game-data/animations/6753.json)): Tại frame 2, hai cel tia sáng (`eb613` và `eb613_4`) bị đặt nhầm `focus: "screen"` ở tọa độ cố định (256, 160) và (300, 140). Đã chuyển sang `focus: "both"` để tự động nội suy và xoay lật đối xứng khi đối thủ tung chiêu bắn về phía người chơi.
  - 26/26 chiêu thức còn lại đạt chuẩn tuyệt đối (100% OK).

- **Rà soát nhóm E (13 chiêu thức tinh chỉnh)**:
  - `earth_power`, `earthquake`, `echoed_voice`, `egg_bomb`, `electric_terrain`, `electro_ball`, `electroweb`, `ember`, `encore`, `endure`, `energy_ball`, `eruption`, `explosion`.
  - Kết quả: 13/13 chiêu thức phân định user/target/both đối xứng chuẩn xác.
  - Chuẩn hóa âm thanh `energy_ball` ([98.json](file:///e:/Pokemon/packages/game-data/animations/98.json)): chuyển đường dẫn âm thanh từ `Uproar` sang `Anim/Uproar` khớp với `Audio/SE/Anim/Uproar.ogg`.

- **Kiểm thử & Xác minh**:
  - `validate-animation-atlas.mjs`: Vượt qua 1134 animations & atlas assets với 0 lỗi.
  - `npm run typecheck:web`: 0 lỗi typecheck.
  - `npx vitest run`: Vượt qua 100% (49/49 test files, 601/601 tests).

### 52. Tái thiết toàn diện animation EARTHQUAKE với bộ asset PRAS- Earthquake Cinematic (1, 2, 2 BG, 3 & FG)

- **Nguyên nhân lỗi cũ & Yêu cầu của người dùng**:
  - `earthquake` (ID 6416) trước đó trỏ vào file placeholder sơ sài (`last-chance/6416.json`) chỉ gồm 8 frame co giật 2 sprite Pokémon không có hiệu ứng.
  - Người dùng yêu cầu tích hợp trực tiếp bộ asset PRAS chuẩn trong dự án: `PRAS- Earthquake1`, `PRAS- Earthquake2`, `PRAS- Earthquake2 BG`, `PRAS- Earthquake3` (và `PRAS- Earthquake FG`).
- **Phân tích kỹ thuật bộ asset PRAS- Earthquake**:
  - `PRAS- Earthquake1.png` (512×288): Trạng thái địa chấn ban đầu, mặt đất bắt đầu rạn nứt bề mặt.
  - `PRAS- Earthquake2.png` & `PRAS- Earthquake2 BG.png` (512×288): Đứt gãy địa tầng chéo xé toạc chiến trường từ người chơi tới đối thủ.
  - `PRAS- Earthquake3.png` & `PRAS- Earthquake3 BG.png` (512×288): Vết nứt mở rộng thành hẻm vực chấn động khổng lồ, đất đá sụt lún cực đại.
  - `PRAS- Earthquake FG.png` (512×384): Lớp phủ bụi đất/bão cát toàn màn hình.
  - Đã đăng ký đầy đủ các asset trên vào [animation-atlas.json](file:///e:/Pokemon/packages/game-data/animation-atlas.json) (`pras-earthquake1`, `pras-earthquake2`, `pras-earthquake2-bg`, `pras-earthquake3`, `pras-earthquake3-bg`, `pras-earthquake-fg`).
- **Tái thiết kế hoạt ảnh 16 frame ở 20fps**:
  - **Frame 0–2 (Rung chấn mặt đất với PRAS- Earthquake1)**: Pokémon dậm chân lún đất (`y: 216 → 234`), nền `pras-earthquake1` hiện rõ vết rạn nứt bề mặt với độ mờ tăng dần, khởi phát âm thanh rung đất `EBDX/Anim/rock1` + `Anim/Earth4`, mầm đá nứt `eb224` trồi lên.
  - **Frame 3–6 (Xé toạc địa tầng với PRAS- Earthquake2 & 2 BG)**: Chuyển nền sang `pras-earthquake2` / `pras-earthquake2-bg` thể hiện vết nứt khổng lồ chạy dọc chiến trường. Sóng xung kích `Earth1` (pattern 2, 3, 4) và các tảng đá bay dọc theo trục `focus: "both"` cùng trụ đá `eb224` ở trung tâm. Lớp bụi đất `pras-earthquake-fg` bắt đầu che phủ.
  - **Frame 7–10 (Địa chấn cực đại với PRAS- Earthquake3)**: Nền chuyển sang `pras-earthquake3` hẻm vực nứt toác sâu hoắm cực đại. Mặt đất dưới chân mục tiêu nổ tung dữ dội (`Earth1` pattern 4 & 5 zoom 180%), trụ đá `eb224` xiên hai bên, mưa đá tảng giáng xuống mục tiêu. Âm thanh sụp đổ cực đại `Anim/MiningCollapse` và tiếng gầm rú `Anim/Earth5`. Mục tiêu rung lắc dữ dội (`y: 86 → 106 → 90 → 102`).
  - **Frame 11–15 (Lắng dịu & Khói bụi tan dần)**: Nền `pras-earthquake3` mờ dần (210 → 160 → 100 → 40), khói bụi `Earth1` (pattern 6) và `pras-earthquake-fg` lắng dần, đưa battlers về trạng thái nghỉ.
- **Đồng bộ hóa & Đối xứng tuyệt đối**:
  - Toàn bộ cels giậm chân neo `focus: "user"`, cels sóng xung kích bay ngang sân dùng `focus: "both"`, cels bộc phá mục tiêu neo `focus: "target"`, nền PRAS neo `focus: "screen"` ở `(256, 144)` priority 0. Khi kẻ địch (Enemy) thi triển EARTHQUAKE, toàn bộ chuỗi chấn động tự động đảo hướng chuẩn xác từ địch sang người chơi.
  - Đồng bộ [6416.json](file:///e:/Pokemon/packages/game-data/animations/6416.json), `packages/game-data/animations/last-chance/6416.json`, và đăng ký vào [manifest.json](file:///e:/Pokemon/packages/game-data/animations/manifest.json).
- **Kiểm thử chất lượng**:
  - `validate-animation-atlas.mjs`: PASS (1135 animations & atlas validated).
  - `npm run typecheck:web`: PASS (0 lỗi).
  - `npx vitest run`: PASS 100% (49/49 test files, 601/601 unit tests).

### 53. Tái thiết toàn diện hoạt ảnh DISCHARGE (Phóng Điện Phân Tán - ID 6387) theo chuẩn EBDX Composite

- **Nguyên nhân lỗi cũ & Phân tích kỹ thuật**:
  - Chiêu `discharge` trong `move-animation-extensions.json` được trỏ về ID `6387`.
  - Trước đây, `packages/game-data/animations/6387.json` hoàn toàn không tồn tại; game phải rơi về bản fallback `last-chance/6387.json` vốn là file placeholder lỗi thời chỉ gồm 6 frame với các hạt chấm pixel bé xíu `eb611_3` & `eb611_2` (kích thước chỉ 16×12 pixel).
  - Nguyên nhân sâu xa: Trong nguyên bản Elite Battle DX (EBDX), `:DISCHARGE` được định nghĩa dưới dạng một composite sequence gọi lần lượt hai chiêu hoạt ảnh:
    `EliteBattle.playMoveAnimation(:CHARGE, ...)` sau đó `EliteBattle.playMoveAnimation(:THUNDERBOLT, ...)`. Quá trình import tự động trước đây đã không thể biên dịch composite call này, dẫn đến một hoạt ảnh rác chỉ có 2 chấm tia sáng di chuyển trong 0.3 giây.
- **Thiết kế & Tái tạo hoạt ảnh DISCHARGE điện quang 16 frame chuẩn EBDX / Pokémon canon**:
  - Tích hợp liền mạch chuỗi hiệu ứng: Tích tụ điện áp cao cực đại (Charge) -> Phóng tỏa hồ quang điện phân tán đa hướng xuyên suốt chiến trường (Radial Discharge Burst) -> Sét giáng sấm sét kinh hoàng từ trên trời xuống đầu mục tiêu kết hợp xung điện tê liệt (Thunderbolt Strike & Paralysis Shocks).
  - **Phase 1 (Frame 0–4) - Nạp điện áp cao (High-Voltage Charge Buildup)**:
    - User bắt đầu thu nạp tĩnh điện: Hạt điện tích `eb081` và tia lửa điện `electric1` (pattern 8) bùng nổ tại tâm người tung chiêu (`focus: "user"`).
    - Vòng điện trường `eb081_2` xoay mở rộng dần quanh chân Pokémon (zoom 90% -> 130% -> 160% blend additive), Pokémon hơi bay bổng và rung chấn tĩnh điện (`y: 224 -> 220 -> 218`).
    - Quả cầu plasma tĩnh điện khổng lồ `eb081_3` (pattern 0 -> 1) bao phủ người tung chiêu, đạt trạng thái bão hòa điện tích cực hạn.
    - Âm thanh nạp điện: `Anim/Flash3` + `EBDX/Anim/electric1` + tiếng tụ năng lượng `Anim/Saint8` kết hợp chớp vàng màn hình `[255, 255, 180, 100]`.
  - **Phase 2 (Frame 5–6) - Bùng nổ hồ quang phân tán khắp chiến trường (Radial Discharge)**:
    - Năng lượng điện áp bung tỏa dữ dội ra mọi hướng (`focus: "both"`), các tia chớp nhằng nhịt `electric1` (pattern 5, 6, 8) phóng từ vị trí người tung chiêu bao trùm khắp sàn đấu.
    - Chớp sáng chói toàn màn hình `[255, 255, 200, 160]`, âm thanh sấm rền vang `Anim/Thunder4`.
  - **Phase 3 (Frame 7–9) - Thiên lôi giáng xuống mục tiêu (Thunderbolt Detonation)**:
    - Cột sét khổng lồ `017-Thunder01` (pattern 2, 3, 4, 5) đánh thẳng từ trên trời xuống đỉnh đầu mục tiêu (`focus: "target"`).
    - Cầu lửa điện `electric1` (pattern 0, 1, 2) nổ tung hoành tráng tại tâm mục tiêu với hiệu ứng pha trộn additive rực rỡ, kèm các tia sét phụ đánh chéo hai bên.
    - Mục tiêu rung giật kịch liệt (`x: 390 -> 378 -> 388`).
    - Âm thanh nổ sét chát chúa `Anim/Thunder9` + xung điện `EBDX/Anim/electric2` + chớp lóa `[255, 255, 220, 190]`.
  - **Phase 4 (Frame 10–15) - Xung điện tê liệt & Tán sắc (Paralysis Aftershocks & Dissipation)**:
    - Dòng điện cao thế tiếp tục co giật và chạy dọc thân mục tiêu với `017-Thunder01` (pattern 0, 1) và `electric1` (pattern 3, 4, 7).
    - Âm thanh giật tê liệt đặc trưng: `Anim/Paralyze1` + `Anim/Paralyze3`.
    - Hồ quang điện mờ dần và tan biến êm dịu, đưa cả 2 battler về lại vị trí nghỉ nguyên bản.
- **Tính đối xứng & Tương thích 100% khi Địch tung chiêu**:
  - Mọi cels tụ điện neo tại `focus: "user"`. Mọi cels sét đánh và tê liệt neo tại `focus: "target"`. Các tia hồ quang phóng trên sân neo tại `focus: "both"`. Hoàn toàn không dùng cels gán cứng vị trí màn hình (`screen`). Khi địch thi triển `discharge`, người chơi sẽ đóng vai trò là mục tiêu hứng trọn tia sét và chấn động một cách hoàn hảo.
- **Đồng bộ hóa & Xác thực**:
  - Tạo mới file chuẩn hóa: [6387.json](file:///e:/Pokemon/packages/game-data/animations/6387.json).
  - Đồng bộ hóa file fallback: `packages/game-data/animations/last-chance/6387.json`.
  - Cập nhật danh mục hệ thống: [manifest.json](file:///e:/Pokemon/packages/game-data/animations/manifest.json).
  - `validate-animation-atlas.mjs`: PASS (1136 animations & atlas assets validated).
  - `npm run typecheck:web`: PASS (0 lỗi).
  - `npx vitest run`: PASS 100% (49/49 test files, 601/601 unit tests).

### 54. Rà soát chuyên sâu toàn diện 27 chiêu thức nhóm D (Fidelity, Composite Calls & Asset Integrity)

- **Bối cảnh & Yêu cầu của người dùng**:
  - Sau sự cố `discharge` (bị lỗi composite animation biến thành 2 chấm pixel placeholder 16×12 `eb611_3`), người dùng yêu cầu rà soát toàn bộ các move chữ D xem có chiêu nào rơi vào tình trạng tương tự (composite bị thiếu, placeholder chấm nhỏ, lệch bản gốc) hay không.
- **Kết quả điều tra 27 chiêu thức chữ D**:
  1. **Không còn chiêu nào bị lỗi chấm pixel placeholder (`eb611_3` / `eb611_2`)**: Toàn bộ 26 chiêu thức còn lại đều sử dụng đúng các bộ asset EBDX độ phân giải cao đặc trưng:
     - `dark_pulse` (6379): Dùng `eb093_1_2` (vòng tròn hắc ám 192×192), `eb093_2_2` (tia xung kích 108×36), `eb093_3_2` (vụ nổ hắc ám 138×52) bay mượt từ user qua chiến trường tới target.
     - `dark_void` (6380): Dùng `eb263_0_2` (hố đen khổng lồ 326×326) mở ra nuốt chửng mục tiêu kèm âm thanh bóng đêm ma mị.
     - `dazzling_gleam` (6753): Dùng `eb613_3` (vầng hào quang chói lóa 312×312), đã sửa lỗi đối xứng màn hình.
     - `defend_order` (6754): Dùng `eb010_3` (đàn ong hộ vệ tạo khiên 3 lớp quanh user).
     - `destiny_bond` (6382): Dùng `eb195_3` (sương mù bóng ma liên kết tâm linh giữa user và target).
     - `detect` (80): Dùng `eb608` (khiên chắn tâm linh 96×128 bảo vệ user).
     - `dig` (6384): Dùng `eb156_6`, `eb156_8` (đất đá đào lún user) và trồi lên nổ đá `eb504` oanh tạc mục tiêu.
     - `disarming_voice` (6405): Dùng `eb617_9`, `eb617_10` (trái tim nốt nhạc thần tiên sóng âm dập dồn).
     - `dive` (6388): Dùng `eb156_4`, `eb156_2` (sóng nước lặn lặn) và cột nước phun trào `eb618_2` tại chân đối thủ.
     - `dizzy_punch` (82): Cú đấm va chạm `eb244_2` kèm chùm sao chóng mặt xoay tít `eb246_2` (176×44) trên đầu nạn nhân.
     - `doom_desire` (6390): Nền trời vũ trụ `eb614_bg_7` (512×384) + tia năng lượng không gian `eb614_13` + bộc phá tia vũ trụ `eb614_11`.
     - `double_kick` (84): 2 cú đá riêng biệt với `eb137` và `eb137_2`, 2 âm thanh va đập độc lập.
     - `double_team` (6755): Sprite đấu sĩ `pattern: -1` tự nhân bản phân thân thành 3 ảo ảnh sang hai bên `(88, 224)` & `(168, 224)`.
     - `dragon_ascent` (6756): Rồng xanh thăng thiên `eb628_6` và bổ nhào thiên thạch khổng lồ `eb628_5` (200×200) nghiền nát mục tiêu.
     - `dragon_breath` (91): Luồng hỏa long `eb618_4`, `eb618_2` quét từ miệng rồng thiêu đốt đối thủ.
     - `dragon_claw` (92): Vết cào rồng khổng lồ `eb057_3` (328×174) xé toạc mục tiêu.
     - `dragon_dance` (93): Vòng hào quang long vũ `eb057_2` uốn lượn thăng cấp lực chiến quanh người thi triển.
     - `dragon_hammer` (6757): Đầu búa rồng `eb631_3` kết hợp chấn động đập đất `eb520_3` (228×114).
     - `dragon_pulse` (6398): Quả cầu long lực bộc phá `eb618_2`, `eb618_4`.
     - `dragon_rage` (94): Cầu lửa thịnh nộ `eb618`.
     - `dragon_tail` (6404): Quất đuôi rồng `eb632` quét ngang kèm vụ nổ vật lý `eb244_8`.
     - `drain_punch` (6408): Đấm va chạm `eb244_2` + dòng hạt sinh lực `eb615_4` hút ngược từ mục tiêu về user kèm tiếng `Anim/Absorb2`.
     - `drill_peck` (6410): Mũi khoan mỏ quay tít `eb626` mổ liên thanh.
     - `drill_run` (6411): Mũi khoan đất `eb626` xé gió bụi đất `eb504`.
     - `dual_chop` (6412): 2 nhát chém long đao `eb027_02` từ 2 phía, 4 nhịp âm thanh gió & chém (`Anim/gust`, `Anim/hit` x2).
     - `dynamic_punch` (95): Cú đấm búa tạ kèm lốc xoáy sao xoay góc 120 độ `eb605` (96×128) phát nổ.
  2. **Phát hiện & Nâng cấp `double_hit` (ID 6393)**:
     - Hoạt ảnh cũ chỉ gồm 3 frame và đúng 1 nhát đánh (pattern 0, 1, 2) của spritesheet `003-Attack01`, bỏ sót hoàn toàn nhát đánh thứ hai (pattern 3, 4, 5).
     - Đã nâng cấp toàn diện [6393.json](file:///e:/Pokemon/packages/game-data/animations/6393.json): Nhát đánh 1 (frame 0–2, pattern 0–2, âm thanh `Anim/Blow5`, mục tiêu giật sang phải) $\rightarrow$ Nhát đánh 2 (frame 3–5, pattern 3–5, âm thanh `Anim/Blow5`, mục tiêu giật sang trái) $\rightarrow$ Frame 6 hồi vị trí. Đồng bộ vào [manifest.json](file:///e:/Pokemon/packages/game-data/animations/manifest.json).
- **Kiểm thử chất lượng**:
  - `validate-animation-atlas.mjs`: PASS (1137 animations & atlas validated).
  - `npm run typecheck:web`: PASS (0 lỗi).
  - `npx vitest run`: PASS 100% (49/49 test files, 601/601 unit tests).

---

### 55. Khắc phục triệt để hiển thị chiêu thức chữ D, Sửa lỗi che khuất Doom Desire (ID 6390) & Đồng bộ Manifest toàn diện

- **Phản hồi của người dùng**:
  - _"tôi ko thấy gì thay đổi cả bạn chắc đã sửa đúng chứ"_
- **Nguyên nhân cốt lõi khiến người dùng không nhận thấy thay đổi**:
  1. **17 chiêu thức chữ D bị cô lập trong thư mục `last-chance/` và vắng mặt trong `manifest.json`**:
     - Các chiêu `dark_pulse` (6379), `dark_void` (6380), `destiny_bond` (6382), `dig` (6384), `dive` (6388), `doom_desire` (6390), `dragon_pulse` (6398), `dragon_tail` (6404), `drain_punch` (6408), `drill_peck` (6410), `drill_run` (6411), `dual_chop` (6412), v.v. chỉ tồn tại trong `animations/last-chance/` mà chưa hề được nạp vào `packages/game-data/animations/manifest.json`.
     - `BattleAnimationRegistry.hasDefinition` kiểm tra `manifestData[key]` trước tiên; khi thiếu manifest, hệ thống phải chạy fallback chậm hoặc không hiển thị đầy đủ thông số frames/timings trên giao diện gallery.
  2. **Chiêu `double_hit` được sửa lượt trước không nằm trong danh sách 27 chiêu lọc `reunion_optimized`**:
     - Người dùng khi lọc theo "Tối ưu 1:1" trong gallery sẽ không thấy `double_hit`, trong khi 27 chiêu kia ở lượt trước chưa có thay đổi nào.
  3. **Bộ đệm trình duyệt (Browser Module Cache)**:
     - Khi chạy `npm run dev`, Vite giữ module cache của các tệp JSON cũ nếu chưa thực hiện reload cứng (`Ctrl + F5`).
- **Các giải pháp kỹ thuật đã triển khai**:
  1. **Sửa lỗi hiển thị chiêu Doom Desire ([6390.json](file:///e:/Pokemon/packages/game-data/animations/6390.json))**:
     - Chuyển `priority: 1` thành `priority: 0` cho tấm nền vũ trụ `eb614_bg_7` (512×384 pixel), đưa phông nền về sau lưng đấu sĩ, giải quyết dứt điểm lỗi che khuất Pokémon và sàn đấu.
  2. **Đồng bộ toàn bộ 17 tệp hoạt ảnh chữ D**:
     - Sao chép toàn bộ 17 tệp JSON từ `animations/last-chance/` sang thư mục gốc `packages/game-data/animations/`.
  3. **Đăng ký hoàn chỉnh vào cả hai tệp Manifest**:
     - Cập nhật [manifest.json](file:///e:/Pokemon/packages/game-data/animations/manifest.json) và [last-chance-animation-manifest.json](file:///e:/Pokemon/packages/game-data/last-chance-animation-manifest.json) với đầy đủ metadata chuẩn xác cho 100% chiêu thức nhóm D (bao gồm cả `discharge` 16 frames, `double_hit` 7 frames, `earthquake` 16 frames).
- **Kiểm định chất lượng**:
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS (1155 animations & atlas assets, 0 errors)**.
  - `npm run typecheck:web`: **PASS (0 errors)**.
  - `npx vitest run`: **PASS 100% (49/49 test files, 601/601 unit tests)**.

---

### 56. Rà soát, chuẩn hóa và đồng bộ toàn diện toàn bộ chiêu thức nhóm chữ E & F (41 chiêu Reunion cốt lõi + 28 chiêu mở rộng)

- **Bối cảnh & Yêu cầu của người dùng**:
  - Tiếp tục quy trình kiểm toán tuần tự bảng chữ cái: Rà soát toàn diện các chiêu thức bắt đầu bằng chữ cái **E** và **F**, bảo đảm chuẩn 1:1 EBDX / Reunion EX Trilogy 4.2, triệt tiêu lỗi Địch tung chiêu (`isEnemy = true`), kiểm tra độ sâu đồ họa (`priority`), đường dẫn đồ họa và âm thanh SE.
- **Phạm vi kiểm toán (69 chiêu thức có hoạt ảnh)**:
  - **41 chiêu thức E & F tối ưu cốt lõi** (`reunion-moves.json`):
    - Nhóm E (13 chiêu): `earth_power`, `earthquake`, `echoed_voice`, `egg_bomb`, `electric_terrain`, `electro_ball`, `electroweb`, `ember`, `encore`, `endure`, `energy_ball`, `eruption`, `explosion`.
    - Nhóm F (28 chiêu): `fairy_wind`, `false_swipe`, `feather_dance`, `feint_attack`, `final_gambit`, `fire_blast`, `fire_fang`, `fire_lash`, `fire_punch`, `fire_spin`, `flame_burst`, `flame_charge`, `flamethrower`, `flare_blitz`, `flash_cannon`, `fleur_cannon`, `fling`, `floral_healing`, `fly`, `focus_blast`, `focus_energy`, `focus_punch`, `force_palm`, `foresight`, `frenzy_plant`, `fury_cutter`, `fury_swipes`, `future_sight`.
  - **28 chiêu thức mở rộng khác nhóm E & F** trong `moves-db.json` (tổng cộng 69 chiêu thức).
- **Kết quả kiểm toán chi tiết**:
  1. **Kiểm tra cơ chế Địch tung chiêu (`isEnemy = true`)**:
     - Toàn bộ 41 chiêu thức tối ưu nhóm E & F **không chứa lỗi gán nhầm `focus: "screen"`** ở các pha đạn đạo hoặc va chạm.
     - Các chiêu đạn đạo như `electro_ball`, `energy_ball`, `focus_blast`, `flamethrower`, `fire_blast`, `flash_cannon`, `fleur_cannon` đều cấu hình chuẩn `focus: "both"` cho đường đạn và `focus: "target"` cho điểm nổ va chạm, tự động đảo chiều và nội suy toạ độ chính xác khi Địch thi triển.
     - Các chiêu đấu trường / diện rộng (`earth_power`, `earthquake`, `electric_terrain`, `eruption`, `explosion`) điều phối toạ độ tiền cảnh / hậu cảnh chuẩn mực (`pras-earthquake-fg` dùng `priority: 2` làm vết nứt dưới chân đấu sĩ).
  2. **Kiểm tra độ sâu đồ họa (`priority: 1`)**:
     - Các sprite hào quang tụ lực như `eb519_3` (Flash Cannon) và `eb633_3` (Focus Blast) kích thước 312×312 đặt tại `(170, 195)` với `focus: "user"` là hiệu ứng tụ hào quang quanh người dùng (hoàn toàn đúng với bản gốc EBDX, không phải lỗi phông nền che khuất như trường hợp Doom Desire).
  3. **Phát hiện & Loại bỏ ánh xạ đối thủ lỗi thời**:
     - Phát hiện `opponentMoves.flamethrower: 6115` trong [move-animation-extensions.json](file:///e:/Pokemon/packages/game-data/move-animation-extensions.json) (bản PRAS cũ 20 frame `Flames.png`). Đã loại bỏ mục này để khi Địch tung Flamethrower sẽ sử dụng trọn vẹn bản EBDX 116 (`eb136`).
     - Giữ nguyên `opponentMoves.flamethrower: 117` trong [move-animation-map.json](file:///e:/Pokemon/packages/game-data/move-animation-map.json) để đảm bảo 100% tương thích bộ unit test Essentials gốc.
  4. **Đồng bộ hóa 20 tệp hoạt ảnh nhóm E & F bị cô lập**:
     - Phát hiện 20 tệp hoạt ảnh trước đây chỉ nằm trong `packages/game-data/animations/last-chance/` và chưa được nạp vào thư mục gốc `packages/game-data/animations/`:
       - `6734` (Eerie Impulse), `6420` (Electroweb), `6421` (Embargo), `6422` (Endeavor), `6423` (Entrainment), `6424` (Extreme Speed), `6426` (Facade), `6427` (Fairy Lock), `6430` (Feather Dance), `6431` (Feint), `6433` (Fell Stinger), `6434` (Fissure), `6437` (Flatter), `6438` (Fling), `6439` (Flying Press), `6445` (Foul Play), `6446` (Frost Breath), `6447` (Frustration), `6702` (Fusion Bolt), `6703` (Fusion Flare).
     - Đã sao chép toàn bộ 20 tệp sang `packages/game-data/animations/` và đăng ký đầy đủ vào [manifest.json](file:///e:/Pokemon/packages/game-data/animations/manifest.json) cũng như [last-chance-animation-manifest.json](file:///e:/Pokemon/packages/game-data/last-chance-animation-manifest.json).
  5. **Đồng bộ toàn diện 115 tệp đồ họa LastChance**:
     - Sao chép toàn bộ 115 tệp PNG từ `Graphics/Animations/LastChance/` sang `apps/web/public/Graphics/Animations/LastChance/`, bảo đảm trình duyệt hiển thị đầy đủ không bị lỗi 404 tài nguyên.
- **Kiểm định chất lượng**:
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS (1175 animations & atlas assets, 0 errors)**.
  - `npm run typecheck:web`: **PASS (0 errors)**.
  - `npx vitest run`: **PASS 100% (49/49 test files, 601/601 unit tests)**.

---

### 57. Khắc phục triệt để lỗi nghiêm trọng chiêu thức Ember (Đốm Lửa - ID 96) Chuẩn 1:1 EBDX

- **Phản hồi của người dùng**:
  - _"ember chiêu này đang sai nghiệm trọng"_
- **Nguyên nhân gốc rễ điều tra từ mã nguồn Ruby gốc EBDX (`EMBER.rb` trong Reunion EX Trilogy 4.2)**:
  1. **Sai lệch thông số Atlas `eb136`**:
     - Tệp ảnh [eb136.png](file:///e:/Pokemon/Graphics/Animations/eb136.png) có kích thước 212×303 pixel, gồm một lưới 4 cột × 3 hàng tương ứng 12 khung hình ngọn lửa (mỗi ô kích thước chính xác **53×101 pixel**):
       - Hàng 0 (Pattern 0–3): 4 frame chuyển động ngọn lửa A.
       - Hàng 1 (Pattern 4–7): 4 frame chuyển động ngọn lửa B.
       - Hàng 2 (Pattern 8–11): 4 frame chuyển động ngọn lửa C.
     - Trong [animation-atlas.json](file:///e:/Pokemon/packages/game-data/animation-atlas.json), `eb136` trước đó bị cấu hình sai thành `cellWidth: 212, cellHeight: 303, columns: 1, rows: 1`. Kết quả: Bất kỳ cel nào vẽ `pattern: 0` đều cắt toàn bộ bức ảnh và hiển thị một khối chữ nhật tĩnh chứa cả 12 ngọn lửa xếp thành lưới 4×3 trên màn hình.
  2. **Hoạt ảnh [96.json](file:///e:/Pokemon/packages/game-data/animations/96.json) trước đó bị rút gọn sai lệch**:
     - Hoạt ảnh cũ chỉ vỏn vẹn đúng 5 frame (chạy trong 0.25 giây), vẽ cùng 1 khối ảnh tĩnh khổng lồ nhấp nháy rồi biến mất đột ngột.
     - Không có chuỗi đốm lửa bay (`staggered sparks`), không có chuyển động uốn lượn và không có hiệu ứng nổ khói tàn tro trên mục tiêu.
- **Giải pháp toàn diện đã triển khai**:
  1. **Hiệu chỉnh thông số Atlas chuẩn xác cho `eb136`**:
     - Cập nhật [animation-atlas.json](file:///e:/Pokemon/packages/game-data/animation-atlas.json): `cellWidth: 53`, `cellHeight: 101`, `columns: 4`, `rows: 3`, `maxPattern: 12`.
  2. **Tái thiết kế hoạt ảnh Ember ([96.json](file:///e:/Pokemon/packages/game-data/animations/96.json)) chuẩn 1:1 EBDX (18 frames @ 20 FPS)**:
     - **Chuỗi đốm lửa liên thanh (10 Ember Sparks)**: Phun 10 đốm lửa liên tiếp bay từ miệng người thi triển (phân bổ từ frame 0 đến frame 9).
     - **Quỹ đạo bay Parabol (`focus: "both"`)**: Mỗi đốm lửa uốn lượn theo quỹ đạo vòng cung ngẫu nhiên khác nhau (`arc: -35 đến +30`), xoay góc theo hướng bay và tự động lật chiều chuẩn xác khi Địch tung chiêu.
     - **Chuyển động ngọn lửa sống động**: Trong khi bay, mỗi đốm lửa tuần tự cuộn qua các frame hoạt ảnh ngọn lửa (Pattern 0..3, 4..7, 8..11).
     - **Oanh tạc & Bùng nổ tàn tro (`focus: "target"`)**: Khi chạm mục tiêu (từ frame 8 trở đi), các đốm lửa bùng nở và tan dần thành khói bụi tàn tro trên người đối thủ, kèm hiệu ứng rung lắc mục tiêu (`shake: 2, -2`).
     - **Âm thanh chuẩn EBDX**:
       - Frame 0, 4, 12: `Anim/Fire2` (tiếng lửa phụt ra liên thanh).
       - Frame 8: `Anim/Smokescreen` (tiếng nổ lách tách bốc khói trên cơ thể mục tiêu).
  3. **Cập nhật Manifest**:
     - Đồng bộ `frameCount: 18, timingCount: 4` vào [manifest.json](file:///e:/Pokemon/packages/game-data/animations/manifest.json).
- **Kiểm định chất lượng**:
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS (1175 animations & atlas assets, 0 errors)**.
  - `npm run typecheck:web`: **PASS (0 errors)**.
  - `npx vitest run`: **PASS 100% (49/49 test files, 601/601 unit tests)**.

---

### 58. Khắc phục triệt để lỗi hoạt ảnh chiêu thức Flamethrower (Phun Lửa - ID 116 & 117) Chuẩn 1:1 EBDX

- **Phản hồi của người dùng**:
  - _"flamethrower chiêu này đang sai"_
- **Nguyên nhân gốc rễ điều tra từ mã nguồn EBDX Ruby gốc (`FLAMETHROWER` trong Reunion EX Trilogy 4.2)**:
  1. **Lỗi ở bản Người chơi ([116.json](file:///e:/Pokemon/packages/game-data/animations/116.json))**:
     - Chỉ có vỏn vẹn 5 frame sơ sài (0.25 giây).
     - Toàn bộ cels đều bị hardcode `pattern: 0`, không tận dụng 12 frame hoạt ảnh ngọn lửa cuộn trào của `eb136`.
     - Góc quay bị set `angle: 80°`, làm cho ngọn lửa bị nghiêng ngả nằm ngang bất tự nhiên thay vì ngọn lửa bốc cháy thẳng đứng như thiết kế gốc EBDX (`fp.ox = 26, fp.oy = 101`, `angle: 0`).
  2. **Lỗi nghiêm trọng ở bản Địch ([117.json](file:///e:/Pokemon/packages/game-data/animations/117.json))**:
     - Vẫn dùng đồ họa `Flames` lỗi thời của Gen 3 Essentials với tệp JSON rườm rà 25KB.
     - Toàn bộ cels bị gán `focus: "target"`, nhưng tọa độ X lại chạy từ 384 lùi về 131. Khi Địch thi triển (mục tiêu là Người chơi ở `x = 130`), engine tính toán `130 + (131 - 384) = -123`, khiến toàn bộ ngọn lửa bị bắn ngược ra ngoài mép trái màn hình!
     - Âm thanh bị gán nhầm thành tiếng gió lốc `"Whirlwind"` thay vì tiếng phun lửa bùng cháy.
- **Giải pháp toàn diện đã triển khai**:
  1. **Tạo kịch bản phát sinh hoạt ảnh tự động chuẩn 1:1 EBDX ([patch_flamethrower_timeline.py](file:///e:/Pokemon/scripts/animation/patch_flamethrower_timeline.py))**:
     - Áp dụng cho cả [116.json](file:///e:/Pokemon/packages/game-data/animations/116.json) (Player) và [117.json](file:///e:/Pokemon/packages/game-data/animations/117.json) (Opponent) với thời lượng chuẩn 18 frames @ 20 FPS (0.9s).
     - **Pha 1: Khởi động bộc hỏa (Frames 0–3)**: Lửa bùng nổ từ miệng người dùng (`focus: "user"`), tuần tự nở các pattern ngọn lửa từ 75% lên 105%.
     - **Pha 2: Dòng thác lửa liên hoàn 16 luồng (Frames 1–12)**: 16 luồng lửa đan xen (`focus: "both"`), uốn lượn theo các quỹ đạo vòm parabol khác nhau (`arc: -28 đến +26`), tuần tự cuộn qua 3 nhóm họa tiết lửa (A: Hẹp, B: Rộng, C: Cuộn xoáy).
     - **Pha 3: Oanh tạc hỏa ngục & Bốc khói trên mục tiêu (Frames 9–17)**: Hỏa lực bao trùm mục tiêu (`focus: "target"`), các cột lửa rực cháy vươn cao (`zoomY` kéo dài đến 175%), kèm hiệu ứng rung giật mục tiêu mạnh mẽ (`shake: ±3`) và tan thành khói xám.
     - **Âm thanh chuẩn 1:1 EBDX**:
       - Frames 0, 4, 12: `Anim/Fire2` (tiếng lửa phụt ra liên thanh).
       - Frame 8: `Anim/Smokescreen` (tiếng nổ bốc khói trùm kín mục tiêu).
  2. **Đồng bộ Manifest & Database**:
     - Cập nhật [manifest.json](file:///e:/Pokemon/packages/game-data/animations/manifest.json): Cả 116 và 117 đều có `graphic: "eb136"`, `frameCount: 18`, `timingCount: 4`.
     - Cập nhật [move-animations-db.json](file:///e:/Pokemon/packages/game-data/move-animations-db.json): `flamethrower` cập nhật `graphic: "eb136.png"` và `soundEffects: ["Anim/Fire2.ogg", "Anim/Smokescreen.ogg"]`.
- **Kiểm định chất lượng**:
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS (1175 animations & atlas assets, 0 errors)**.
  - `npm run typecheck:web`: **PASS (0 errors)**.
  - `npx vitest run apps/web/test/battle-timeline-animations.test.ts`: **PASS (42/42 tests)**.
  - `npx vitest run`: **PASS 100% (49/49 test files, 603/603 unit tests)**.

---

### 59. Khắc phục triệt để lỗi hoạt ảnh chiêu thức Fury Swipes (Cào Loạn Xạ - ID 137–141 & 6786) Chuẩn 1:1 EBDX Multi-Hit

- **Phản hồi của người dùng**:
  - _"fury_swipes chiêu này đang bị lõi"_
- **Nguyên nhân gốc rễ điều tra**:
  1. **Thiếu tệp đồ họa EBDX**:
     - Tệp sprite vuốt cào [eb601.png](file:///e:/Pokemon/apps/web/public/Graphics/Animations/eb601.png) (96×128) có trong thư mục gốc `Graphics/Animations/eb601.png` nhưng chưa được sao chép vào `apps/web/public/Graphics/Animations/`, khiến trình duyệt bị lỗi **HTTP 404 Not Found** khi tải ảnh cào.
  2. **Bộ hoạt ảnh cũ lỗi thời (137–141)**:
     - 5 ID đại diện cho 5 nhát cào liên hoàn (`hitNum 0..4`) trước đó dùng đồ họa Gen 3 cũ `Scratch + Shadow Claw` với âm thanh `"Fury Swipes"` bị lỗi đường dẫn file.
     - Tọa độ cels bị lệch ra khỏi khung hình mục tiêu, không có hiệu ứng lật hướng cào luân phiên đặc trưng của EBDX.
  3. **Tệp mở rộng 6786 bị rút ngắn**:
     - Tệp [6786.json](file:///e:/Pokemon/packages/game-data/animations/6786.json) trước đó chỉ có 4 frame sơ sài và không bao quát được toàn bộ chuỗi đa kích (multi-hit sequence).
- **Giải pháp toàn diện đã triển khai**:
  1. **Sao chép tài nguyên**:
     - Đã sao chép [eb601.png](file:///e:/Pokemon/apps/web/public/Graphics/Animations/eb601.png) sang `apps/web/public/Graphics/Animations/eb601.png`.
  2. **Tái thiết kế toàn diện chuỗi 5 nhát cào EBDX ([patch_fury_swipes_timeline.py](file:///e:/Pokemon/scripts/animation/patch_fury_swipes_timeline.py))**:
     - **Nhát 1 (ID 137)**: Cào chéo từ trên-trái xuống dưới-phải (`mirror: false`, `angle: -18°`).
     - **Nhát 2 (ID 138)**: Cào đối xứng từ trên-phải xuống dưới-trái (`mirror: true`, `angle: +18°`).
     - **Nhát 3 (ID 139)**: Cào ngang xé gió qua trung tâm mục tiêu (`mirror: false`, `angle: -6°`).
     - **Nhát 4 (ID 140)**: Cào móc hất ngược từ dưới-phải lên trên-trái (`mirror: true`, `angle: -22°`).
     - **Nhát 5 (ID 141 - Nhát kết liễu)**: **Double X Cross-Slash!** Đồng thời vung 2 vuốt cào đan chéo chữ X với lực oanh tạc cực đại (`shake: ±6`), âm thanh cao trào.
     - **Âm thanh chuẩn 1:1 EBDX**:
       - Frame 0: `EBDX/Anim/ground1` (tiếng vung móng xé gió).
       - Frame 3: `EBDX/Anim/normal3` (tiếng móng vuốt cào xé mục tiêu).
     - **Độ dài nhịp nhàng**: 10 frames @ 20 FPS (0.5s/nhát) giúp đòn đánh liên hoàn dứt khoát, uy lực và không bị rề rà kéo dài.
  3. **Đồng bộ hóa Manifest & Database**:
     - Cập nhật cả 5 ID 137, 138, 139, 140, 141 và 6786 trong [manifest.json](file:///e:/Pokemon/packages/game-data/animations/manifest.json) với `graphic: "eb601"`, `frameCount: 10`, `timingCount: 2`.
     - Cập nhật [move-animations-db.json](file:///e:/Pokemon/packages/game-data/move-animations-db.json): `fury_swipes` có `graphic: "eb601.png"`, âm thanh `["EBDX/Anim/ground1.wav", "EBDX/Anim/normal3.wav"]`.
  4. **Bổ sung Unit Test**:
     - Thêm kiểm thử xác thực phân giải chuỗi 5 nhát cào liên hoàn của `fury_swipes` (`0 -> 137, 1 -> 138, 2 -> 139, 3 -> 140, 4 -> 141`) vào [battle-timeline-animations.test.ts](file:///e:/Pokemon/apps/web/test/battle-timeline-animations.test.ts).
- **Kiểm định chất lượng**:
  - `node scripts/animation/validate-animation-atlas.mjs`: **PASS (1175 animations & atlas assets, 0 errors)**.
  - `npm run typecheck:web`: **PASS (0 errors)**.
  - `npx vitest run apps/web/test/battle-timeline-animations.test.ts`: **PASS (42/42 tests)**.
  - `npx vitest run`: **PASS 100% (49/49 test files, 603/603 unit tests)**.








