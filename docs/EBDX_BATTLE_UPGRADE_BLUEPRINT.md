# KẾ HOẠCH NÂNG CẤP ĐẠO DIỄN HOẠT ẢNH & MÔI TRƯỜNG CHIẾN ĐẤU CHUẨN 1:1 THEO ELITE BATTLE: DX (BẢO TOÀN 100% GIAO DIỆN UI TỰ THIẾT KẾ)

> **Tài liệu Tham chiếu Kiến trúc & Đạo diễn Hoạt ảnh**  
> **Nguồn gốc đối chiếu**: `Data/PluginScripts.rxdata` — _Elite Battle: DX (EBDX v1.4.7.1) by Luka S.J._ trong _Pokemon Reunion EX Trilogy 4.2_.  
> **Mục tiêu**: Xóa bỏ hoàn toàn cơ chế hoạt ảnh 2D tĩnh đơn điệu (chỉ bắn thẳng hoặc hiện tại chỗ), nâng cấp toàn bộ hệ thống hiệu ứng VFX, sàn đấu, camera động và động lực học Pokémon đạt chuẩn điện ảnh như bản gốc của tác giả; **BẢO TOÀN NGUYÊN VẸN 100% GIAO DIỆN NGƯỜI DÙNG (UI/HUD/WindowSkin)** là thiết kế và chất xám riêng của User.

---

## 1. TỔNG QUAN HIỆN TRẠNG & NGUYÊN NHÂN "CHƯA GIỐNG CỦA TÁC GIẢ"

### 1.1. Hiện trạng trên Web Client hiện tại:

- **Khung nhìn cố định (Static 2D Viewport)**: Canvas luôn ở góc nhìn phẳng, 2 Pokémon đặt cố định tại tọa độ `(128, 224)` (User) và `(384, 96)` (Target).
- **Mô thức chiêu thức đơn điệu (Two Monotonous Archetypes)**:
  1. _Đạn đạo tuyến tính_: Sprite di chuyển thẳng hàng từ A sang B theo đường chéo.
  2. _Hiện ảnh tại chỗ_: Sprite móng vuốt/nắm đấm/vết cắn hiện đè trực tiếp lên mục tiêu B.
- **Pokémon bất động**: Người đánh và người nhận đòn đứng im như pho tượng, không có phản lực nén/dãn, chồm tới hay rung lắc chấn động khi trúng đòn.
- **Sàn đấu sáng trưng thiếu chiều sâu**: Không có hiệu ứng làm tối nền (`backdrop dimming`) hay làm mờ hậu cảnh (`defocus`), khiến các hạt hiệu ứng bị chìm và rời rạc.

### 1.2. Bản chất thật sự của EBDX (Luka S.J.):

- Trong mã nguồn gốc Ruby RGSS, EBDX **không phải là hoạt ảnh cel khung hình tĩnh**, mà là **Hệ thống Mô phỏng Điện ảnh 3D bằng Thuật toán Động thời gian thực (Real-time Procedural Physics & Camera Engine)**.
- Mọi chiêu thức là một kịch bản phối hợp nhịp nhàng giữa: **Góc quay Camera Vector**, **Độ tối nền sàn đấu**, **Chuyển động thể xác Pokémon**, **Quỹ đạo hạt toán học (Toán lượng giác)** và **Âm thanh hòa âm tiếng kêu loài**.

---

## 2. KIẾN TRÚC MÔI TRƯỜNG CHIẾN ĐẤU & CAMERA ĐỘNG 3D

```
+-------------------------------------------------------------------------+
|                              VIEWPORT CANVAS                            |
|                                                                         |
|  [TẦNG 1: FAR BACKDROP] -> Bầu trời / Phong cảnh xa (Parallax Tilt)    |
|  [TẦNG 2: 3D FLOOR]     -> Sàn đấu nghiêng phối cảnh 3D (Depth Scale)   |
|  [TẦNG 3: BASE CIRCLES] -> Bệ đứng của Pokémon (User Base / Enemy Base) |
|  [TẦNG 4: BACKDROP DIM] -> fp["bg"] Phủ màu tối theo hệ (Tím/Đỏ/Đen)   |
|  [TẦNG 5: USER BATTLER] -> Pokémon phe ta (Lunge, Squash, Tone, Shake)  |
|  [TẦNG 6: FX BEHIND]    -> Hạt hiệu ứng tầng sau (Priority 0, 2)       |
|  [TẦNG 7: TARGET BATTLER]-> Pokémon đối thủ (Recoil, Shake, Tone)       |
|  [TẦNG 8: FX ABOVE]     -> Hạt hiệu ứng tầng trước (Priority 1)        |
|  [TẦNG 9: CAMERA VECTOR]-> Điều khiển Zoom In/Out, Pan, Tilt, Recoil    |
|  [TẦNG 10: CUSTOM UI]   -> BẢO TOÀN 100% GIAO DIỆN RIÊNG CỦA USER       |
+-------------------------------------------------------------------------+
```

### 2.1. Hệ thống Camera Vector 3D (`class Vector`):

- Trong EBDX (`[000] Scripts/Battle Modifiers/Math Functions.rb`), camera được định nghĩa bởi vector 6 chiều: `[x, y, scale, angle, zoom1, zoom2]`.
- **3 Chế độ Camera cần tích hợp vào Web**:
  1. **Idle Breathing Sway (Camera thở nhẹ nhàng)**: Khi đang chờ lệnh, camera đung đưa nhẹ qua lại theo hàm `Math.sin(time * 0.05)`, tạo cảm giác sàn đấu sống động như quay flycam.
  2. **Attack Zoom & Focus**:
     - _Pha Tụ Lực_: Camera zoom nhanh 1.25x vào Pokémon phe ta (`@vector.set(userVector)`).
     - _Pha Bay Đòn_: Camera lia mượt mà (smooth pan interpolation) từ User sang Target.
     - _Pha Va Chạm (Impact)_: Camera phóng sát vào mặt đối thủ (`@vector.set(targetVector)`), rung chấn động theo lực đòn đánh.
  3. **Impact Screen Recoil**: Toàn bộ khung cảnh giật nảy ngược hướng tấn công khi đòn đánh chí mạng kết liễu.

### 2.2. Lớp Phủ Nền Khí Quyển (`Atmosphere Dimming - fp["bg"]`):

- Trong EBDX, hơn **90% chiêu thức** tạo ra một lớp phủ toàn màn hình:
  - Hệ Tối / Cắn (`Bite`, `Crunch`, `Dark Pulse`): Phủ màu tím thẫm `Color.new(66, 60, 81)`.
  - Hệ Lửa (`Ember`, `Fire Blast`, `Flamethrower`): Phủ màu đỏ than hồng `Color.new(130, 52, 42)`.
  - Hệ Điện / Vũ Trụ (`Electro Ball`, `Shadow Ball`, `Close Combat`): Phủ màu đen tuyền `Color.black`.
  - Sóng địa hình (`Terrains`): Phủ màu trắng tinh khôi chớp sáng rồi mờ dần.
- **Cơ chế triển khai**: Thêm thuộc tính `backdropDim` vào `timing-events.ts` với các pha:
  - _Fade in (12 frame đầu)_: Độ mờ tăng từ `0` đến `180`.
  - _Sustain (Pha nổ)_: Giữ nền tối làm nổi bật ánh sáng hạt hiệu ứng.
  - _Fade out (6 frame cuối)_: Trả lại độ sáng tự nhiên cho sàn đấu.

---

## 3. PHÂN TÍCH 6 HÌNH THÁI ĐẠO DIỄN HOẠT ẢNH CHIÊU THỨC (CHOREOGRAPHY ARCHETYPES)

Để thoát khỏi cơ chế "bắn thẳng hoặc hiện tại chỗ", toàn bộ 386 chiêu thức của EBDX phải được phân loại và xây dựng theo **6 Hình Thái Đạo Diễn Không Gian**:

```
=============================================================================
                  6 HÌNH THÁI ĐẠO DIỄN HOẠT ẢNH TRONG EBDX
=============================================================================

[1. FIELD-WIDE SWEEP]        [2. BATTLER DISPLACEMENT]     [3. VERTICAL 2-PHASE]
  Sóng/Bão tràn toàn cảnh       Pokémon tốc biến/phân thân     Trồi lên & Lặn xuống
  (Surf, Blizzard, Earthq.)     (Quick Attack, Feint Att.)     (Dig, Fly, Dive, Bounce)
       ~~~~~~~~~>                    [User] -----> [Target]             ^ |
  =====================              (Z-dash, Backstab)                 | v

-----------------------------------------------------------------------------

[4. CENTRIPETAL SPIRAL]      [5. OMNI-DIRECTIONAL FLURRY]  [6. BALLISTIC ARC]
  Xoáy hút hướng tâm 360°       Loạn đả đa điểm 360°           Cầu vồng parabol / Rơi
  (Shadow Ball, Energy Ball)    (Close Combat, Cross Chop)     (Sludge Bomb, Draco Met.)
         \  |  /                         \   /                          .---.
        --- O ---                       --- X ---                      /     \
         /  |  \                         /   \                        v       v
```

### 3.1. Hình Thái 1: Quét Tràn Toàn Cảnh Chiến Trường (Field-Wide Sweeps & Surges)

- **Chiêu tiêu biểu**: `SURF`, `BLIZZARD`, `HEATWAVE`, `EARTHQUAKE`, `PETALDANCE`, `SLUDGEWAVE`.
- **Kịch bản đạo diễn**:
  - Đòn đánh xuất phát từ **ngoài rìa màn hình** (`x: -200, y: 800` với Player; `x: 900, y: -550` với Enemy).
  - Con sóng/cơn bão lướt xiên chéo với vận tốc vector (`moveX = 15, moveY = -7`), quét tràn ngập toàn bộ màn hình.
  - Khi lướt qua mục tiêu, bọt nước/mảnh băng bắn tung tóe đa điểm, sàn đấu rung lắc theo trục Y.

### 3.2. Hình Thái 2: Động Lực Thể Xác & Dịch Chuyển Tức Thời (Battler Displacement & Teleportation)

- **Chiêu tiêu biểu**: `QUICKATTACK`, `EXTREMESPEED`, `FEINTATTACK`, `SHADOWSNEAK`, `ACROBATICS`, `UTURN`.
- **Kịch bản đạo diễn**:
  - **Pokémon tự chuyển động**: Không có hạt đạn nào bay đi.
  - Pokémon phe ta rung lắc tốc độ cao (`shake = 30`), tạo vệt ảnh ảo (Afterimages) lao vụt qua màn hình.
  - Trong `Feint Attack / Shadow Sneak`: Pokémon biến mất khỏi vị trí ban đầu (`opacity = 0`), sàn đấu tối đen, Pokémon xuất hiện bất thình lình **sau lưng mục tiêu** tung đòn rồi lộn nhào trở lại vị trí cũ.

### 3.3. Hình Thái 3: Động Lực Trục Dọc 2 Giai Đoạn (Vertical 2-Phase Dynamics)

- **Chiêu tiêu biểu**: `DIG`, `FLY`, `BOUNCE`, `DIVE`, `SKYDROP`.
- **Kịch bản đạo diễn**:
  - Tách làm 2 pha hoàn chỉnh theo biến `@hitNum`:
    - _Pha 1 (Lặn/Bay)_:
      - `Dig`: Mặt đất nứt ra, đất đá văng tung tóe, Pokémon thu nhỏ và thụt lùi xuống hố sâu biến mất.
      - `Fly`: Pokémon vỗ cánh bay vút lên khỏi cạnh trên canvas, bóng đổ mờ dần.
    - _Pha 2 (Tập kích)_:
      - Đất dưới chân đối thủ nứt toác, chấn động dữ dội trồi thẳng từ dưới lên hất văng mục tiêu.
      - Hoặc Pokémon từ đỉnh trời bổ nhào xuống với tốc độ chóng mặt.

### 3.4. Hình Thái 4: Xoáy Hút Hướng Tâm 360° (Centripetal Spiral Convergence)

- **Chiêu tiêu biểu**: `SHADOWBALL`, `ENERGYBALL`, `ELECTROBALL`, `FOCUSBLAST`, `CALMMIND`.
- **Kịch bản đạo diễn**:
  - **Pha Tụ Lực (Charge/Gather)**: Điểm tâm `(cx, cy)` được xác định ở khoảng giữa 2 bên. 16–32 hạt năng lượng xoay tròn theo hàm lượng giác `Math.cos(angle)`, bị hút xoáy từ ngoài rìa không gian vào tâm theo đường xoắn ốc (Fibonacci Spiral).
  - Quả cầu năng lượng ở tâm phình to dần và xoay tít (`angle += 8`).
  - **Pha Phóng Đòn (Discharge)**: Quả cầu giải phóng toàn bộ động năng, lao vút vào đối thủ và nổ tung thành các mảnh vỡ phát quang.

### 3.5. Hình Thái 5: Loạn Đả Đa Góc & Trảm Kích Đối Xứng (Omni-Directional Flurry & Cross-Cut)

- **Chiêu tiêu biểu**: `CLOSECOMBAT`, `CROSSCHOP`, `CROSSPOISON`, `XSCISSOR`, `FURYCUTTER`.
- **Kịch bản đạo diễn**:
  - Trong `Close Combat`: Nền phụ cuộn tốc độ cao (`ScrollingSprite speed = 64`) tạo cảm giác không gian biến dạng. **96 tia chấn động** xuất hiện ngẫu nhiên từ mọi góc độ 360° (`randCircleCord(r)`), đấm liên hoàn từ trên, dưới, trái, phải dồn dập vào mục tiêu.
  - Trong `Cross Chop / X-Scissor`: Hai đường trảm kiếm xuất phát từ 2 góc chéo đối diện ngoài màn hình, lướt xuyên chéo qua nhau tạo thành chữ X cắt ngang thân đối thủ.

### 3.6. Hình Thái 6: Quỹ Đạo Cầu Vồng Parabol & Thiên Thạch Rơi (Ballistic Arc & Aerial Bombardment)

- **Chiêu tiêu biểu**: `EGGBOMB`, `SLUDGEBOMB`, `ROCKSLIDE`, `STONEEDGE`, `DRACOMETEOR`, `METEORMASH`.
- **Kịch bản đạo diễn**:
  - Quả bom/tảng đá được hất bổng lên trời theo **đường cong Parabol**:
    $$y(t) = y_0 + v_y \cdot t + \frac{1}{2} g \cdot t^2$$
  - Vật thể bay vút lên khỏi tầm mắt camera, sau đó rơi chúc xuống đầu đối phương với gia tốc trọng trường ngày càng nhanh, va đập nát vụn khi chạm đất.
  - Trong `Draco Meteor`: Bắn chùm sáng lên mây trời, sau đó hàng loạt thiên thạch lao từ đỉnh màn hình cắm thẳng xuống đất nổ tung khói lửa.

---

## 4. VẬT LÝ BIẾN DẠNG & PHẢN LỰC POKÉMON (BATTLER SPRITE DYNAMICS)

Trong EBDX, Pokémon không phải là tấm ảnh bất động, mà có các thuộc tính biến dạng vật lý sau:

1. **Squash & Stretch (Co nén & Giãn nở cơ học)**:
   - Khi chuẩn bị phóng đòn: `userSprite.zoom_y -= 0.1`, `userSprite.zoom_x += 0.1` (nén người xuống đất lấy đà).
   - Khi bật nhảy phóng đi: `userSprite.zoom_y += 0.2`, `userSprite.zoom_x -= 0.1` (thân mình duỗi dài theo hướng chuyển động).
2. **Impact Recoil & Shake (Rung lắc chấn động)**:
   - Khi trúng đòn: `targetSprite.shake(intensity, frames)`.
   - Mục tiêu bị giật lùi về sau theo hướng lực đánh, sau đó nảy lò xo trở lại vị trí gốc.
3. **Tone Shifting (Biến đổi sắc độ trúng thương)**:
   - Khi bị thiêu đốt, đông đá hay trúng độc: Sprite đổi sắc độ phủ màu (`tone.set(r, g, b, gray)`).
   - Khi bị siết chặt trong `Bite/Crunch`: Mục tiêu tối sạm đi (`tone.all -= 12.8`), nhăn nhó vì đau đớn.

---

## 5. NGUYÊN TẮC BẤT DI BẤT DỊCH: BẢO TOÀN 100% GIAO DIỆN UI TÙY BIẾN RIÊNG CỦA USER

> [!IMPORTANT]
> **Ranh giới cốt lõi (Strict Architectural Boundary)**:
> - **Giao diện người dùng (User Interface - UI)**: DataBoxes, thanh máu/HP, EXP bar, bảng thông số, Menu Command (Fight/Bag/Pokemon/Run), Fight Menu, bố cục nút bấm, WindowSkin, Font chữ... **LÀ THIẾT KẾ & CHẤT XÁM ĐỘC QUYỀN CỦA BẠN**.
> - **TUYỆT ĐỐI KHÔNG CHẠM VÀO UI**: Toàn bộ hệ sinh thái UI hiện tại được **bảo toàn nguyên vẹn 100%**, không chỉnh sửa, không thay thế, không can thiệp.
> - **PHẠM VI NÂNG CẤP CHỈ NẰM Ở HIỆU ỨNG (FX / ANIMATION / CAMERA / SÀN ĐẤU)**: Toàn bộ quá trình nâng cấp chỉ diễn ra ở tầng dưới (Layer bên dưới UI) bao gồm: Hiệu ứng hoạt ảnh, Quỹ đạo bay 6 hình thái, Camera Vector zoom/pan, Lớp phủ tối sàn đấu `fp["bg"]`, Vật lý rung lắc/co giãn của Pokémon và Hòa âm tiếng kêu loài.

---

## 6. HÒA ÂM TIẾNG KÊU POKÉMON & ÂM THANH ĐA TẦNG (AUDIO SCAPING)

- **Tiếng gầm loài (Species Cry Layering)**:
  - Trong các chiêu như `Roar`, `Hyper Voice`, `Echoed Voice`, `Encore`, `Bug Buzz`: Tự động tải file âm thanh tiếng kêu đặc thù `Audio/SE/Cries/${species}.ogg` của Pokémon đang tham chiến.
  - Hòa âm tiếng gầm đè lên tiếng chấn động của chiêu thức tạo cảm giác mãnh thú thực sự phát động công kích.
- **Biến thiên cao độ thời gian thực (Dynamic Pitch Modulation)**:
  - Khi đòn đánh tích năng lượng càng lớn, cao độ âm thanh tăng dần (`pitch: 80 -> 100 -> 120`).

---

## 7. LỘ TRÌNH TRIỂN KHAI THEO TỪNG PHA (PHASED ROADMAP)

| Giai đoạn | Hạng mục công việc chính                                                                                                                                                                                                            | Kết quả đầu ra mong đợi                                                                                                              |
| :-------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| **Pha 1** | **Xây dựng Core Môi Trường & Camera Vector**<br>- Tích hợp `CameraVectorManager` vào `BattleRenderer`.<br>- Bổ sung `BackdropDimmer` (`fp["bg"]`) vào `TimingEventManager`.<br>- Thêm cơ chế `BattlerShake` & `SquashStretch`.      | Sàn đấu bắt đầu có chiều sâu tối nền, camera biết zoom/pan, Pokémon biết rung lắc khi trúng đòn (Giao diện UI của User giữ nguyên). |
| **Pha 2** | **Bộ Điều Khiển Quỹ Đạo Đạo Diễn (Trajectory Engine)**<br>- Xây dựng 6 thuật toán quỹ đạo: Parabolic, Centripetal Spiral, Field Sweep, Displacement.<br>- Cho phép đòn đánh xuất phát từ ngoài màn hình hoặc ném cầu vồng.          | Xóa bỏ vĩnh viễn hiện tượng "chỉ bay thẳng hoặc hiện tại chỗ". Các chiêu Surf, Shadow Ball, Sludge Bomb có hình thái đúng 100%.      |
| **Pha 3** | **Hòa Âm Tiếng Kêu Pokémon & Phối Khí Đa Tầng**<br>- Tích hợp `Audio/SE/Cries/${species}` cho các move âm thanh/gầm rú.<br>- Dynamic pitch modulation theo gia tốc đòn đánh.                                                        | Âm thanh sống động, có tiếng kêu uy lực của chính loài Pokémon đang xuất chiêu.                                                      |
| **Pha 4** | **Re-authoring Toàn Diện 386 Chiêu Thức Chuẩn 1:1**<br>- Áp dụng 6 hình thái đạo diễn và âm thanh tiếng gầm loài cho toàn bộ thư viện chiêu thức Reunion 4.2.<br>- Đảm bảo hoạt ảnh hiển thị hoàn hảo bên dưới UI tùy biến riêng. | Toàn bộ các trận chiến đạt chuẩn 100% điện ảnh EBDX mà vẫn giữ trọn vẹn 100% thiết kế UI độc quyền của User.                         |

---

_Tài liệu này đóng vai trò kim chỉ nam kiến trúc (Master Blueprint) để toàn bộ đội ngũ lập trình và AI căn cứ thực hiện từng bước nâng cấp hiệu ứng chuẩn xác, bảo toàn tuyệt đối chất xám giao diện của bạn và bám sát 100% tinh hoa hoạt ảnh của tác giả Luka S.J._
