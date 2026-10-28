# Kịch Bản Sự Kiện Mở Đầu: Chạm Trán Tại Cổng Viện Nghiên Cứu Okido (Pallet Town Prologue Event)

> **Mã Sự Kiện**: `EVENT_PALLET_OAK_LAB_GATE_ENCOUNTER`  
> **Trạng Thái**: Bản Thảo Kịch Bản (Story Blueprint) & Quy Chuẩn Kỹ Thuật (Sẵn sàng triển khai theo yêu cầu)  
> **Nhân vật người chơi**: Ash mặc đồ ngủ (`char_ash_pajamas`, chân trần, chưa sở hữu Pokémon)  
> **Bối cảnh**: Cổng và chân bậc thang trước Viện Nghiên Cứu của Giáo sư Oak tại Thị trấn Pallet  

---

## 1. Tổng Quan Bối Cảnh & Động Lực Cốt Truyện

Nối tiếp diễn biến của Bộ 6 Trang Truyện Tranh Dẫn Chuyện:
- **Trang 4**: Red/Ash say sưa xem bản tin giới thiệu 3 Pokémon khởi đầu (Bulbasaur, Charmander, Squirtle) trên tivi.
- **Trang 5**: Bình minh ló rạng trên Pallet Town, chú Dodrio gáy vang và ánh nắng rọi vào phòng đánh thức Ash.
- **Trang 6**: Ash hốt hoảng nhận ra mình đã ngủ quên giờ hẹn! Cậu mặc nguyên bộ đồ ngủ chạy thục mạng qua con đường làng hướng về phía Viện Okido, thấy một đám đông dân làng đã xếp hàng đông đúc từ trước.
- **"SAU LÚC ĐÓ... Tại Thị Trấn Pallet"**: Màn hình mở ra phân cảnh chuyển động thực tế (In-Engine Cutscene) tại khuôn viên trước cổng Viện Okido.

---

## 2. Dàn Nhân Vật & Asset Sprites Sử Dụng

| Nhân vật | Sprite Key | Vị trí ban đầu | Vai trò trong phân cảnh |
| :--- | :--- | :--- | :--- |
| **Ash (Người chơi)** | `char_ash_pajamas` (1024×1024, 4×4 frames) | Chân đường làng phía Nam cổng Lab (`gx: 12, gy: 16`) | Chạy hớt hải, va sầm vào Gary Oak |
| **Gary Oak (Rival Blue)** | `char_rival_blue` (`Graphics/Characters/rival_blue.png`) | Bậc thềm trên của Lab (`gx: 12, gy: 12`) | Vừa nhận xong starter, tự mãn xoay Pokéball |
| **Đội Cổ Vũ Của Gary** | `char_picnicker_f` / `char_school_kid_f` / `cheerleader` | Hai bên thềm bậc thang (`gx: 11..13, gy: 13..14`) | Cầm cờ, hoa cổ vũ, reo hò tung hô Gary |
| **Dân Làng Pallet** | `char_old_man`, `char_flower_girl`, `char_tech_guy`, `char_sea_boy` | Vây quanh sân trước Lab | Tán thưởng, hò reo mừng Gary lên đường |
| **Giáo Sư Oak (Okido)** | `char_oak` (`Graphics/Characters/oak.png`) | Trong cửa chính Lab (`gx: 12, gy: 10`) | Bước ra sau khi đám đông rời đi, mời Ash vào trong |

---

## 3. Diễn Biến Chi Tiết 5 Phân Cảnh (Step-by-Step Script)

### Cảnh 1: Cú Va Chạm Bất Ngờ (The Collision)
- **Hoạt họa**:
  - Máy quay khóa góc nhìn trung tâm tại chân cầu thang Viện Okido.
  - Gary Oak từ từ bước xuống các bậc thang (`direction: 0`, đi chậm đầy tự tin).
  - Ash (`char_ash_pajamas`) chạy hết tốc lực từ phía Nam lao lên bậc thang (`speed: brisk/run`).
- **Khoảnh khắc va chạm**:
  - Tại tọa độ `gx: 12, gy: 13`, Ash và Gary va sầm vào nhau!
  - **Âm thanh**: Phát hiệu ứng va chạm mạnh `Audio/SE/Player bump.ogg`.
  - **Hiệu ứng giật lùi (Knockback)**: Cả hai giật nảy lùi lại 1 ô (Ash lùi xuống `gy: 14`, Gary lùi lên `gy: 12`).
  - **Bong bóng cảm xúc**: Xuất hiện biểu tượng chấm than `!` trên đầu cả Ash và Gary kèm chuông `Audio/SE/Exclaim.ogg`.

---

### Cảnh 2: Gary Chế Giễu & Đội Cổ Vũ Náo Nhiệt (Gary's Taunt)
- **Hội thoại**:
  - **Gary**: *"Này này, đi đứng kiểu gì đấy?!... Ô kìa, chẳng phải là Ash ngủ nướng sao?!"*
  - Gary khoanh tay, nhìn từ đầu đến chân Ash và phá lên cười tự mãn:
  - **Gary**: *"Cậu định mặc nguyên bộ đồ ngủ màu xanh lá này để đi bắt Pokémon đấy à? Buồn cười chết đi được!"*
  - Ash (`activeEmote: 'angry'`) nắm chặt tay bực tức:
  - **Ash**: *"Gary! Cậu đừng có mà đắc ý! Tớ chỉ... lỡ ngủ quên một chút thôi!"*
  - Gary đưa tay rút ra một quả Pokéball sáng loáng, giơ lên trước mặt Ash:
  - **Gary**: *"Muộn một chút? Ha! Chậm một giây thôi cũng đủ để mất cơ hội rồi! Ta đã chọn được con Pokémon tuyệt vời nhất từ Giáo Sư Okido!"*
- **Đội cổ vũ đồng thanh reo hò**:
  - 3 cô gái đội cổ vũ đồng loạt nhảy múa nhún chân:
  - **Đội Cổ Vũ**: *"Gary! Gary! Anh là số một! Huấn luyện viên thiên tài của Pallet Town! Vô địch Kanto! Cố lên anh Garyyy!"*
  - Dân làng xung quanh vỗ tay reo hò rộn rã.

---

### Cảnh 3: Gary Lên Xe Rời Đi & Khoảng Lặng (The Departure)
- **Diễn biến**:
  - Gary quay lưng vẫy tay đầy ngạo nghễ:
  - **Gary**: *"Chúc may mắn nhé Ash! Cố mà nhặt nhạnh chút gì đó còn sót lại... nếu Giáo sư còn thừa thứ gì cho cậu! Tạm biệt!"*
  - Gary dẫn đầu đoàn cổ vũ và đám đông dân làng di chuyển dần về phía đại lộ làng (lối ra phía Nam thị trấn).
  - **Âm thanh**: Tiếng bước chân và tiếng reo hò nhỏ dần (`ambient fade`), rồi tắt hẳn.
  - Sân trước Viện Nghiên Cứu trở lại trạng thái tĩnh lặng. Ash đứng trơ trọi một mình dưới chân bậc thang, thở dài ngậm ngùi (`activeEmote: '...'`).

---

### Cảnh 4: Giáo Sư Okido Bước Ra Từ Lab (Professor Oak Appears)
- **Diễn biến**:
  - Cánh cửa chính của Viện Nghiên Cứu mở ra với âm thanh cổ điển `Audio/SE/Door enter.ogg`.
  - Giáo sư Oak trong chiếc áo blouse trắng quen thuộc bước ra thềm cửa (`direction: 0`).
  - Giáo sư nhìn quanh thấy đám đông đã tản đi hết, thở phào một tiếng:
  - Bỗng nhiên, ánh mắt ông dừng lại ở cậu bé đang đứng cúi gầm mặt ở chân cầu thang.
  - Giáo sư giật mình, trên đầu hiện dấu hỏi `?`:
  - **Giáo Sư Oak**: *"Hử? Đứa trẻ nào đứng đằng kia thế kia... Ơ kìa, Ash đấy à?!"*
  - Giáo sư chậm rãi bước xuống từng bậc thang tiến lại gần Ash.

---

### Cảnh 5: Bên Trong Lab - Bệ Máy Phân Phát Pokémon Khởi Đầu & 3 Quả Cầu Rỗng
- **Background**: Phòng Lab Viện Nghiên Cứu Giáo Sư Okido (`oak_lab_room_bg.png`) chuẩn Retro GBA Pixel Art.
- **Chân Dung Nhân Vật (Bust)**:
  - Thiết kế to lớn hoành tráng ($320 \sim 460$px), hiển thị dịch hẳn sang bên trái (`left: clamp(4px, calc(50% - 530px), 60px)`), nhô cao vươn lên ngoài khung thoại chat Anime Visual Novel.
  - Satoshi: `portrait_ash_empty_ball.png` toát mồ hôi cầm quả cầu rỗng ngỡ ngàng.
  - Giáo Sư Okido: `portrait_oak_lab.png` áo blouse trắng nghiêm nghị.
  - Pikachu: `pikachu_front.png` với khung thoại speaker vàng rực.
- **Bệ Máy Console GBA**:
  - Bệ máy 3 quả Pokéball: Zenigame, Fushigidane, Hitokage.
  - Người chơi tự do click chọn mở quả nào trước tùy ý.
  - Mỗi quả mở ra: Hiệu ứng âm thanh `Battle jump to ball.ogg`, nắp bật mở thành `pokeball_opened_empty.png`, Satoshi thảng thốt và Okido giải thích:
    1. **Zenigame**:
       - Satoshi: *"Cháu đã suy nghĩ hồi lâu rồi và cháu quyết định: Zenigame, tớ chọn cậu! (Quả cầu rỗng) Cái gì?"*
       - Giáo sư Okido: *"Cháu đến muộn quá, con đó được chọn đi rồi."*
    2. **Fushigidane**:
       - Satoshi: *"Thật tồi tệ khi cháu đến muộn. Được rồi, Fushigidane, cậu là của tớ! (Quả cầu rỗng)"*
       - Giáo sư Okido: *"Nếu cháu đến đúng giờ, cháu có thể nhận được nó rồi."*
    3. **Hitokage**:
       - Satoshi: *"Được rồi, vậy cháu lấy Hitokage, tớ chọn cậu! (Quả cầu rỗng)"*
       - Giáo sư Okido: *"Tất cả Pokemon đều được lấy trước rồi, và cháu đã có thể có một con nếu đến sớm."*

---

### Cảnh 6: Quay Lại Phòng Lab Trong Thế Giới Thật (Overworld Interior), Pikachu Xuất Hiện & Màn Giật Điện
- **Chuyển Cảnh**:
  - Ngay sau câu thoại *"Tốt lắm."* của Giáo Sư Okido, modal bệ máy 2D lập tức đóng lại.
  - Người chơi quay lại không gian **Phòng Lab nghiên cứu thế giới thật** (`oak_lab` qua `InteriorManager`):
    - Satoshi (đồ ngủ `char_ash_pajamas`) đứng trước bàn nghiên cứu tại `gx: 7, gy: 7`, mặt hướng Bắc (`direction: 3`).
    - Giáo Sư Okido đứng đối diện tại `gx: 7, gy: 5`, mặt hướng Nam (`direction: 0`).
- **Pikachu Xuất Hiện Trước Mặt Người Chơi Trong Thế Giới Thật**:
  - Sprite Pikachu Overworld (`char_pikachu_overworld.png`) xuất hiện ngay giữa bàn và sàn phòng Lab (`gx: 7, gy: 6`).
  - Âm thanh mở bóng `Battle jump to ball.ogg` và tiếng kêu kinh điển: `Audio/Cries/PIKACHU.ogg`.
  - Pikachu nảy lên (`hopY`), bong bóng `!` (`exclamation`) hiện trên đầu Pikachu và Satoshi.
- **Hội Thoại Thế Giới Thật Chuẩn Retro GBA**:
  - **Pikachu**: *"Pikachu."* (Pikachu nhún nhảy)
  - **Giáo sư Okido**: *"Con Pokemon này gọi là Pikachu."*
  - **Satoshi**: *"Dễ thương quá, nó là tuyệt nhất!"* (Satoshi tim bay `heart`)
  - **Giáo sư Okido**: *"Thật ư?"* (Okido nghi ngại `question`)
- **Màn Giật Điện Kinh Điển (Thunder Shock Zap)**:
  - **Satoshi**: *"Rất vui được gặp cậu, Pikachu! (Bị giật điện) Gì đây?"*
  - **Hiệu ứng giật điện thế giới thật**:
    + Toàn bộ canvas thế giới thật chớp sấm sét vàng - trắng chói lòa liên tục (`screenThunderFlash`).
    + Màn hình canvas rung lắc dữ dội (`canvas-zap-shake`).
    + Âm thanh sấm sét nổ vang rền: `Audio/SE/Anim/Thunder3.ogg`.
    + Satoshi bị giật lùi nảy lên toát mồ hôi.
  - **Giáo sư Okido**: *"Nó là một Pokemon chuột điện. Nó cứ như vậy khi mà bị dọa bởi con người hay bị chạm vào."*
  - **Satoshi**: *"Sao ông không bảo cháu trước?"* (Satoshi toát mồ hôi `sweat`, chuông `Exclaim.ogg`).
- **Pikachu Trở Thành Bạn Đồng Hành (Follower Pokémon)**:
  - Pikachu chính thức đi theo sau Satoshi trong phòng Lab thế giới thật (`Follower` kích hoạt loài `PIKACHU`).
  - Thêm Pikachu Lv 5 vào Party của người chơi.
  - Kích hoạt cờ cốt truyện `received_starter_pikachu = true`.

---

## 4. Kiến Trúc Kỹ Thuật Đã Chuẩn Bị Sẵn Sàng

1. **Sprite Nhân Vật Ash Đồ Ngủ (`char_ash_pajamas`)**:
   - Đã đăng ký vào `apps/web/public/assets/manifest.json`.
   - Đã lưu tại cả `apps/web/public/assets/characters/ash_pajamas.png` và `Graphics/Characters/ash_pajamas.png`.
   - Đã cấu hình bộ giải mã khung hình động (`naturalWidth / 4`, `naturalHeight / 4`) trong cả `CharacterRenderer` và `InteriorManager`.
   - Hỗ trợ đổi trang phục qua thuộc tính `player.spriteKey = 'char_ash_pajamas'`.

2. **Hệ Thống Trạng Thái Sự Kiện (`StoryEventFlags`)**:
   - `flags.pallet_intro_completed`: Đã hoàn thành intro truyện tranh.
   - `flags.pallet_lab_gate_event_done`: Đã kết thúc phân cảnh chạm trán Gary tại cổng.
   - `flags.received_starter_pikachu`: Đã nhận Pikachu trong Lab.
   - `flags.changed_out_of_pajamas`: Đã thay đồ thường phục khi rời khỏi nhà/làng.

3. **Cơ Chế Điều Khiển Cutscene (`CutsceneController`)**:
   - Khóa bàn phím người chơi (`inputLocked: true`).
   - Tự động di chuyển NPC theo lộ trình tọa độ (`moveTo(gx, gy)`).
   - Đồng bộ hộp thoại Retro GBA và biểu cảm xúc (`NPCEmoteBubble`).
