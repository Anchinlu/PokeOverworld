# TIẾN TRÌNH CỐT TRUYỆN & LỘ TRÌNH PHÁT TRIỂN (STORY PROGRESSION ROADMAP)

> **Dự án**: PokeOverworld  
> **Phiên bản hiện tại**: `0.1.0` (Milestone 2.61 Complete)  
> **Nguyên tác cốt truyện**: Anime Pokémon Thế Hệ 1 (Kanto Saga - Hành trình của Satoshi & Pikachu)  
> **Mục tiêu tài liệu**: Giúp Product Owner, Lead Developer và toàn thể đội ngũ phát triển nắm bắt chính xác **Cốt truyện hiện đang ở giai đoạn nào**, **những gì đã hoàn thành 100%**, và **kế hoạch chi tiết cho các phân cảnh tiếp theo**.

---

## 1. Bảng Điều Khiển Tiến Độ (Story Progress Dashboard)

```text
========================================================================================
[ HỒI 1: THỊ TRẤN PALLET - NGÀY KHỞI HÀNH CỦA SATOSHI ] ──► TIẾN ĐỘ: 70% (6/9 PHÂN CẢNH)
========================================================================================
[X] Cảnh 1: Video Cinematic Pokémon League & Bộ 6 Trang Truyện Tranh Anime
[X] Cảnh 2: Bình Minh 06:30 AM, Satoshi Mặc Đồ Ngủ Chạy Đến Viện Nghiên Cứu Okido
[X] Cảnh 3: Chạm Trán Gary Oak & Đội Cổ Vũ, Gary Khoe Starter & Lên Đường Rời Đi
[X] Cảnh 4: Giáo Sư Okido Bước Ra Cửa Lab, Ngạc Nhiên & Mời Satoshi Vào Trong
[X] Cảnh 5: Bệ Máy Khởi Đầu, 3 Quả Pokéball Rỗng & Mở Quả Cầu Thứ 4 Của Pikachu
[X] Cảnh 6: Phòng Lab Thế Giới Thật, Ẩn Trợ Lý, Ôm Pikachu Giật Điện & Bàn Giao Follower ◄◄ [ĐANG Ở ĐÂY]
[ ] Cảnh 7: Giáo Sư Okido Trao Pokédex & 5 Quả Pokéball Khởi Hành
[ ] Cảnh 8: Trở Về Nhà Chào Mẹ Delia, Đổi Sang Trang Phục Huấn Luyện Viên, Nhận Balo & Giày Chạy
[ ] Cảnh 9: Cổng Phía Bắc Pallet Town, Dân Làng Tiễn Biệt & Tiến Bước Ra Route 1
========================================================================================
[ HỒI 2: ROUTE 1 & BẦY CHIM SPEAROW ] ──────────────────► TIẾN ĐỘ: 0% (CHUẨN BỊ KỊCH BẢN)
[ HỒI 3: THÀNH PHỐ VIRIDIAN & TRUNG TÂM POKÉMON ] ──────► TIẾN ĐỘ: 0% (DỰ KIẾN)
[ HỒI 4: RỪNG RẬM VIRIDIAN & CATERPIE / PIDGEOTTO ] ────► TIẾN ĐỘ: 0% (DỰ KIẾN)
[ HỒI 5: THÀNH PHỐ PEWTER & HUY CHƯƠNG ĐẦU TIÊN (BROCK) ] ► TIẾN ĐỘ: 0% (DỰ KIẾN)
========================================================================================
```

---

## 2. Chi Tiết Toàn Bộ Các Hồi Cốt Truyện (Detailed Acts & Scenes)

### HỒI 1: Thị Trấn Pallet — Ngày Khởi Hành Của Satoshi (Pallet Town Arc)
* **Bối cảnh**: Thị trấn Pallet (Pallet Town), Viện Nghiên Cứu Okido (Oak Lab), Nhà của Satoshi (Player House).
* **Nhân vật**: Satoshi (Ash), Giáo Sư Okido (Prof. Oak), Gary Oak (Rival Blue), Đội Cổ Vũ (3 cô gái), Dân Làng Pallet (8 NPC), Mẹ Delia Ketchum.

| Phân Cảnh | Trạng Thái | Mô Tả Diễn Biến | Cờ Cốt Truyện (`StoryFlags`) | Tệp Code Phụ Trách | Asset Sử Dụng |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **Cảnh 1: Intro Mở Đầu & Truyện Tranh** | **Hoàn thành 100%** | Phát video trận đấu Gengar vs Nidorino trên TV CRT cổ điển, chuyển cảnh mượt sang bộ 6 trang truyện tranh: giấc mơ 10 tuổi, mẹ nhắc đi ngủ, bản tin 3 starter, Dodrio gáy sáng và chạy vội trong đồ ngủ. | `pallet_intro_completed = true` | [world-intro-screen.ts](file:///e:/Pokemon/apps/web/src/ui/world-intro-screen.ts) | `intro mửo đầu.mp4`, `trang 1..6.png` |
| **Cảnh 2: Chạy Đến Viện Nghiên Cứu** | **Hoàn thành 100%** | Thế giới thiết lập lúc 06:30 sáng, trời nắng trong (`clear`), ánh sáng bình minh dịu ấm. Satoshi mặc đồ ngủ (`char_ash_pajamas`) hớt hải chạy từ con đường làng phía Nam lên thềm cửa Lab. | `isNewWorld = false` | [pallet-prologue-event.ts](file:///e:/Pokemon/apps/web/src/npc/pallet-prologue-event.ts) | `char_ash_pajamas.png` |
| **Cảnh 3: Chạm Trán Gary & Đội Cổ Vũ** | **Hoàn thành 100%** | Satoshi va chạm nảy lửa với Gary Oak tại thềm cửa (`Player bump.ogg`, knockback 1 ô, chuông `!`). Gary khoanh tay cười chế giễu bộ đồ ngủ, xoay quả Pokéball starter khoe mẽ; 3 cô gái cổ vũ và dân làng reo hò; Gary lên đường về phía Nam; sân trước tĩnh lặng với khoảng lặng ba chấm `•••`. | `pallet_lab_gary_departed = true` | [pallet-prologue-event.ts](file:///e:/Pokemon/apps/web/src/npc/pallet-prologue-event.ts) | `rival_blue.png`, `picnicker_f.png`, `school_kid_f.png`, `chica1.png` |
| **Cảnh 4: Giáo Sư Okido Bước Ra** | **Hoàn thành 100%** | Tiếng cửa mở `Door enter.ogg`, Giáo Sư Okido bước ra thềm ngạc nhiên thấy Satoshi (`?`). Đối thoại 6 lượt chuẩn anime (giải thích 10 tuổi và bộ đồ ngủ). Okido mời Satoshi cùng bước vào bên trong phòng nghiên cứu. | `pallet_lab_oak_outside = false` | [pallet-prologue-event.ts](file:///e:/Pokemon/apps/web/src/npc/pallet-prologue-event.ts) | `oak.png` |
| **Cảnh 5: Bệ Máy Khởi Đầu & Quả Cầu Thứ 4** | **Hoàn thành 100%** | Modal bệ máy console GBA nổi khối. Satoshi tự do click mở 3 quả cầu: Zenigame, Fushigidane, Hitokage đều rỗng tuếch (`pokeball_opened_empty.png`, chân dung Satoshi toát mồ hôi ôm quả bóng rỗng, Okido giải thích). Okido khen *"Tốt lắm."*, xuất hiện quả cầu thứ 4 viền vàng sấm sét. Mở quả cầu thứ 4 kèm tiếng lẫy nắp cơ học `Battle jump to ball.ogg` và tiếng kêu cry `PIKACHU.ogg`. | `pallet_lab_starters_checked = true` | [pallet-prologue-event.ts](file:///e:/Pokemon/apps/web/src/npc/pallet-prologue-event.ts) | `oak_lab_room_bg.png`, `pokeball_closed.png`, `pokeball_opened_empty.png`, `portrait_ash_empty_ball.png`, `portrait_oak_lab.png` |
| **Cảnh 6: Phòng Lab Thế Giới Thật & Ôm Pikachu Giật Điện** | **Hoàn thành 100%** | Chuyển cảnh vào phòng Lab thế giới thực (`oak_lab`). Ẩn 100% nhân viên (`lab_aide` và `lab_scientist`) đảm bảo riêng tư. Ẩn tuyệt đối Follower trong suốt phân cảnh. Satoshi đứng tại `gx: 7, gy: 8`, Okido đối diện `gx: 7, gy: 5`, chú Pikachu DUY NHẤT xuất hiện trên bàn kiểm tra `gx: 7, gy: 6`. Satoshi ôm ấp khen ngợi Pikachu; Pikachu phóng điện giật khét lẹt (chân dung Satoshi ôm Pikachu rung lắc `zap-shake`, canvas rung lắc `canvas-zap-shake`, chớp sấm sét và âm thanh nổ rền vang `Thunder3.ogg`). Kết thúc đối thoại mới dỡ bỏ Pikachu trên bàn, thêm Pikachu Lv 5 vào Party (chống trùng lặp) và kích hoạt Follower Pikachu đi theo sau. | `received_starter_pikachu = true`, `pallet_lab_gate_event_done = true` | [pallet-prologue-event.ts](file:///e:/Pokemon/apps/web/src/npc/pallet-prologue-event.ts), [oak-lab-interior.ts](file:///e:/Pokemon/apps/web/src/interior/oak-lab-interior.ts) | `portrait_ash_hug_pikachu.png`, `char_pikachu_overworld.png`, `Thunder3.ogg`, `PIKACHU.ogg` |
| **Cảnh 7: Nhận Pokédex & 5 Pokéballs** | **Hoàn thành 100%** | Sau khi màn giật điện kết thúc, Giáo Sư Okido trao cho Satoshi cuốn Pokédex bách khoa toàn thư và 5 quả Pokéballs đầu tiên; Satoshi cảm ơn và hai bên tiếp tục bị giật điện té khói; Okido giục cho Pikachu vào bóng; hoàn tất bàn giao Pokédex và kích hoạt cơ chế hiển thị menu/bản đồ linh hoạt. | `pallet_lab_pokedex_received = true`, `has_pokedex = true` | [pallet-prologue-event.ts](file:///e:/Pokemon/apps/web/src/story/acts/act-1-pallet/pallet-prologue-event.ts) | `Mining item get.ogg`, `cutscene_ash_oak_shocked.png` |
| **Cảnh 8: Đám Đông & Mẹ Delia Tiễn Lên Đường, Pikachu Đánh Trả Bóng & Màn Giật Điện Toàn Diện** | **Hoàn thành 100%** | Satoshi bước ra thềm Viện Okido; Đám đông và Mẹ Delia reo hò cổ vũ; Mẹ dặn dò và trao Balo, Giày chạy bộ, Trang phục HLV, Găng tay cao su; Satoshi ném bóng nhưng Pikachu quất đuôi đánh trả bóng lại; Mẹ khen dễ thương và nói Pikachu kỳ cục khiến nó nổi giận phóng điện giật tung tất cả mọi người (Satoshi, Delia, Okido, dân làng lộ xương bốc khói); Okido nhắc găng tay cao su cách điện; Mẹ dặn đi ngủ nhớ mặc pijama; Satoshi chính thức khoác trang phục Huấn Luyện Viên. | `pallet_crowd_mom_farewell_done = true`, `changed_out_of_pajamas = true`, `has_running_shoes = true`, `has_backpack = true`, `has_rubber_gloves = true`, `act1_completed = true` | [pallet-prologue-event.ts](file:///e:/Pokemon/apps/web/src/story/acts/act-1-pallet/pallet-prologue-event.ts) | `portrait_delia_mom.png`, `cutscene_pikachu_shock_crowd.png`, `Thunder3.ogg`, `Item get.ogg` |
| **Cảnh 9: Lên Đường Ra Route 1** | **Sắp thực hiện (In Queue)** | Satoshi và Pikachu bước ra cổng phía Bắc Thị Trấn Pallet. Dân làng tụ tập chúc mừng, vẫy tay chào tạm biệt. Mở khóa rào cản tiến vào Vùng Hoang Dã Route 1. | `left_pallet_town = true`, `story_act = 2` | [start-village.ts](file:///e:/Pokemon/apps/web/src/maps/terrain-field/start-village.ts) | Dân làng Pallet Town |

---

### HỒI 2: Tuyến Đường Số 1 & Bầy Chim Spearow Tấn Công (Route 1 Arc)
* **Bối cảnh**: Tuyến đường Route 1 nối Pallet Town và Viridian City (Đồng cỏ dại, vách đất, ao nước).
* **Nhân vật**: Satoshi, Pikachu, Bầy Spearow, Misty (cô gái câu cá bên suối).

| Phân Cảnh | Trạng Thái | Mô Tả Kịch Bản Anime |
| :--- | :---: | :--- |
| **Cảnh 10: Pikachu Bướng Bỉnh** | *Dự kiến* | Pikachu không chịu vào bóng Pokéball và không chịu nghe lời Satoshi; Satoshi phải dùng sợi dây thừng dắt Pikachu đi trong khi đeo găng tay cao su cách điện. |
| **Cảnh 11: Ném Đá Bắt Pokémon** | *Dự kiến* | Bắt gặp một con Pidgey hoang dã; vì Pikachu không chịu đánh nên Satoshi tự mình ném áo khoác để bắt nhưng bị thổi bay; Satoshi bực mình ném một hòn đá vào bụi rậm. |
| **Cảnh 12: Bầy Spearow Truy Đuổi** | *Dự kiến* | Hòn đá trúng đầu một con Spearow hung dữ; Spearow tức giận kêu ré lên gọi cả bầy hàng chục con lao vào tấn công liên tục mổ vào đầu Satoshi và Pikachu. |
| **Cảnh 13: Mưa Bão & Xe Đạp Của Misty** | *Dự kiến* | Trời đổ mưa giông bão táp; Satoshi ôm chặt Pikachu nhảy xuống sông trôi dạt; gặp Misty đang câu cá; Satoshi mượn vội chiếc xe đạp của Misty chở Pikachu phóng như bay trong mưa tránh bầy Spearow. |
| **Cảnh 14: Cú Sấm Sét Kinh Thiên Động Địa** | *Dự kiến* | Xe đạp bị trượt ngã, bầy Spearow bao vây; Satoshi lấy thân mình che chở cho Pikachu; cảm kích trước tấm lòng của Satoshi, Pikachu lao lên không trung phóng tia Sấm Sét khổng lồ thiêu rụi bầy Spearow. |
| **Cảnh 15: Cầu Vồng Sau Mưa & Chim Huyền Thoại Ho-Oh** | *Dự kiến* | Bầu trời trong xanh trở lại, cầu vồng rực rỡ xuất hiện; một chú chim Pokémon lấp lánh ánh vàng bay ngang qua bầu trời (Ho-Oh); Satoshi và Pikachu kiệt sức dìu nhau hướng về phía Thị Trấn Viridian. |

---

### HỒI 3: Thị Trấn Viridian & Trung Tâm Pokémon Của Y Tá Joy (Viridian City Arc)
* **Bối cảnh**: Thị trấn Viridian, Pokémon Center, Đồn Cảnh Sát.
* **Nhân vật**: Satoshi, Pikachu, Sĩ quan Jenny (`char_officer_jenny`), Y tá Joy (`char_nurse_joy`), Đội Hỏa Tiễn (Jessie, James, Meowth).

| Phân Cảnh | Trạng Thái | Mô Tả Kịch Bản Anime |
| :--- | :---: | :--- |
| **Cảnh 16: Trạm Kiểm Soát Jenny** | *Dự kiến* | Sĩ quan Jenny chặn Satoshi ở cổng vì nghi ngờ là kẻ trộm Pokémon; Satoshi xuất trình Pokédex xác nhận danh tính; Jenny dùng xe môtô cảnh sát chở thẳng đến Pokémon Center. |
| **Cảnh 17: Cấp Cứu Pikachu** | *Dự kiến* | Y tá Joy tiếp nhận Pikachu đưa vào phòng cấp cứu đặc biệt với máy hồi phục 6 Pokéball; Misty đuổi tới đòi bồi thường xe đạp. |
| **Cảnh 18: Đội Hỏa Tiễn Tập Kích** | *Dự kiến* | Jessie, James và Meowth phá thủng trần nhà xuất hiện đọc bài thơ xuất trận; Pikachu đã hồi phục năng lượng cùng bầy Koffing/Ekans giật nổ tung mái nhà đánh bay Đội Hỏa Tiễn lên trời. |

---

### HỒI 4: Rừng Rậm Viridian & Thu Phục Đồng Đội Đầu Tiên (Viridian Forest Arc)
* **Bối cảnh**: Khu rừng rậm Viridian u ám, cây cối rậm rạp.
* **Nhân vật**: Satoshi, Pikachu, Caterpie, Pidgeotto, Chàng Samurai thiếu niên (`char_bug_catcher`).

| Phân Cảnh | Trạng Thái | Mô Tả Kịch Bản Anime |
| :--- | :---: | :--- |
| **Cảnh 19: Bắt Caterpie & Pidgeotto** | *Dự kiến* | Satoshi ném Pokéball thu phục thành công Caterpie (chú Pokémon hoang dã đầu tiên); sau đó dùng Pikachu làm suy yếu để bắt Pidgeotto. |
| **Cảnh 20: Cuộc Chiến Metapod vs Metapod** | *Dự kiến* | Chàng kiếm sĩ Samurai thách đấu Satoshi; trận chiến kinh điển giữa 2 chú Metapod chỉ dùng chiêu Tăng Cứng (`Harden`) không ai chịu thua. |
| **Cảnh 21: Bầy Beedrill Rừng Sâu** | *Dự kiến* | Bầy ong Beedrill khổng lồ tràn ra; Satoshi giải cứu Metapod; Metapod tiến hóa thành Butterfree tuyệt đẹp dùng phấn ngủ giải tán bầy ong. |

---

### HỒI 5: Thành Phố Pewter & Huy Chương Đầu Tiên Của Đạo Quán Đá (Pewter Gym Arc)
* **Bối cảnh**: Thành phố Pewter, Đạo quán Gym Pewter (đá tảng khổng lồ).
* **Nhân vật**: Satoshi, Pikachu, Brock (Thủ lĩnh Gym), Flint (cha của Brock).

| Phân Cảnh | Trạng Thái | Mô Tả Kịch Bản Anime |
| :--- | :---: | :--- |
| **Cảnh 22: Gặp Gỡ Flint** | *Dự kiến* | Satoshi thất bại trước Onix của Brock ở hiệp đầu; gặp người bán đá Flint ở ngoại ô chỉ dẫn cách sạc điện tăng áp cho Pikachu bằng cối xay nước thủy điện. |
| **Cảnh 23: Trận Đấu Gym Nghẹt Thở** | *Dự kiến* | Trận tái đấu; tia sét cực mạnh của Pikachu làm kích hoạt hệ thống chữa cháy phun nước làm Onix bị dẫn điện; Satoshi dừng trận đấu vì không muốn làm hại các em của Brock. |
| **Cảnh 24: Nhận Huy Chương & Brock Gia Nhập** | *Dự kiến* | Cảm phục tấm lòng của Satoshi, Brock trao Huy Chương Đá (Boulder Badge); Brock bàn giao đạo quán cho cha và gia nhập nhóm cùng Satoshi lên đường. |

---

## 3. Bảng Ma Trận Cờ Cốt Truyện (`StoryFlags Registry`)

Bảng tra cứu toàn bộ các khóa cờ trạng thái đang được sử dụng và dự kiến trong mã nguồn:

| Tên Cờ (`Flag Key`) | Kiểu Dữ Liệu | Mặc Định | Mô Tả Ý Nghĩa | Nơi Ghi Nhận |
| :--- | :---: | :---: | :--- | :--- |
| `pallet_intro_completed` | `boolean` | `false` | Người chơi đã xem xong video intro và 6 trang truyện tranh | `WorldIntroScreen` |
| `pallet_lab_gary_departed` | `boolean` | `false` | Gary và đội cổ vũ đã rời đi sau cuộc chạm trán ở cổng | `PalletPrologueEventManager` |
| `pallet_lab_oak_outside` | `boolean` | `true` | Giáo Sư Okido đang đứng ngoài bậc thềm đón Satoshi | `PalletPrologueEventManager` |
| `pallet_lab_starters_checked`| `boolean` | `false` | Đã mở kiểm tra 3 quả Pokéball rỗng trên bệ máy console | `showStarterMachineModal` |
| `received_starter_pikachu` | `boolean` | `false` | Đã hoàn thành màn giật điện và nhận Pikachu làm Follower | `runScene6_RealWorldPikachuLab` |
| `pallet_lab_gate_event_done` | `boolean` | `false` | Đã kết thúc toàn bộ sự kiện mở đầu tại Viện Okido | `PalletPrologueEventManager` |
| `received_pokedex` | `boolean` | `false` | Đã nhận thiết bị Pokédex từ Giáo Sư Okido | *(Cảnh 7 sắp tới)* |
| `received_starter_balls` | `boolean` | `false` | Đã nhận 5 quả Pokéball ban đầu | *(Cảnh 7 sắp tới)* |
| `changed_out_of_pajamas` | `boolean` | `false` | Đã về nhà chào Mẹ và thay trang phục Huấn luyện viên | *(Cảnh 8 sắp tới)* |
| `has_running_shoes` | `boolean` | `false` | Đã nhận Giày chạy bộ (tăng tốc độ di chuyển) | *(Cảnh 8 sắp tới)* |
| `left_pallet_town` | `boolean` | `false` | Đã chính thức bước qua cổng phía Bắc để vào Route 1 | *(Cảnh 9 sắp tới)* |
| `route1_spearow_defeated` | `boolean` | `false` | Pikachu đã tung sấm sét hạ bầy chim Spearow | *(Hồi 2)* |
| `seen_ho_oh` | `boolean` | `false` | Đã chứng kiến chim huyền thoại Ho-Oh bay qua cầu vồng | *(Hồi 2)* |
| `viridian_center_saved` | `boolean` | `false` | Đã đánh bay Đội Hỏa Tiễn bảo vệ Trung Tâm Pokémon | *(Hồi 3)* |
| `caught_first_caterpie` | `boolean` | `false` | Đã thu phục Caterpie trong rừng Viridian | *(Hồi 4)* |
| `pewter_boulder_badge` | `boolean` | `false` | Đã giành được Huy Chương Boulder Badge từ Brock | *(Hồi 5)* |

---

## 4. Bảng Ma Trận Nhiệm Vụ (`Quests Registry`)

| Mã Nhiệm Vụ (`questId`) | Tên Nhiệm Vụ | Stage 0 | Stage 1 | Stage 2 | Stage 3 (Hoàn thành) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `quest_starter_journey` | Khởi Đầu Hành Trình | Thức dậy muộn, chạy đến Lab | Gặp Giáo Sư Okido, nhận Pikachu | Về nhà chào Mẹ, thay trang phục | Bước ra Route 1, bắt đầu cuộc phiêu lưu |
| `quest_oak_parcel` | Kiện Hàng Của Giáo Sư | Chưa nhận | Nhận bưu phẩm tại PokéMart Viridian | Mang kiện hàng về trao cho Okido | Nhận bản đồ thế giới Town Map từ Daisy Oak |
| `quest_pewter_gym` | Thử Thách Đạo Quán Đá | Đến Pewter City | Gặp Flint sạc điện Pikachu | Khiêu chiến Brock tại Đạo quán | Chiến thắng và nhận Boulder Badge |

---

## 5. Danh Mục Tệp Mã Nguồn Cốt Truyện Trọng Yếu

* **Giao diện Mở Đầu & Truyện Tranh**: [apps/web/src/ui/world-intro-screen.ts](file:///e:/Pokemon/apps/web/src/ui/world-intro-screen.ts)
* **Sự Kiện Cổng Lab & Bệ Máy Pikachu**: [apps/web/src/npc/pallet-prologue-event.ts](file:///e:/Pokemon/apps/web/src/npc/pallet-prologue-event.ts)
* **Phòng Lab Thế Giới Thực (Overworld Lab)**: [apps/web/src/interior/rooms/oak-lab-interior.ts](file:///e:/Pokemon/apps/web/src/interior/rooms/oak-lab-interior.ts)
* **Nhà Riêng Của Satoshi (Player House 1F & 2F)**: [apps/web/src/interior/rooms/player-house-interior.ts](file:///e:/Pokemon/apps/web/src/interior/rooms/player-house-interior.ts)
* **Động Cơ Kịch Bản & Cắt Cảnh**: [apps/web/src/npc/cutscene-runner.ts](file:///e:/Pokemon/apps/web/src/npc/cutscene-runner.ts), [apps/web/src/npc/story-script-registry.ts](file:///e:/Pokemon/apps/web/src/npc/story-script-registry.ts)
* **Quản Lý Trạng Thái Cốt Truyện (Domain)**: [apps/web/src/domain/player/player-service.ts](file:///e:/Pokemon/apps/web/src/domain/player/player-service.ts)

---

## 6. Hướng Dẫn Thử Nghiệm & Kiểm Tra Tiến Độ Trực Tiếp

1. **Thử Nghiệm Toàn Bộ Cutscene Khởi Đầu**:
   * Mở trình duyệt tại trang test độc lập: [apps/web/public/pallet-prologue-test.html](file:///e:/Pokemon/apps/web/public/pallet-prologue-test.html).
   * Bấm các nút thử nghiệm tương ứng:
     * *Nút "Cảnh 1: Va Chạm Gary"*: Kiểm tra va chạm và knockback.
     * *Nút "Cảnh 2: Gary Chế Giễu"*: Kiểm tra đội cổ vũ và xoay Pokéball.
     * *Nút "Cảnh 3: Gary Rời Đi"*: Kiểm tra diễu hành và khoảng lặng.
     * *Nút "Cảnh 4: Giáo Sư Oak Ra Cửa"*: Kiểm tra đối thoại 6 lượt.
     * *Nút "Cảnh 5: Bệ Máy Khởi Đầu & Nhận Pikachu"*: Kiểm tra mở 3 bóng rỗng, mở bóng thứ 4 Pikachu, chuyển sang phòng Lab thế giới thực, ẩn trợ lý và màn ôm Pikachu giật điện rung lắc.

2. **Kiểm Tra Trạng Thái Cờ Qua Console Trình Duyệt**:
   ```javascript
   // Kiểm tra người chơi đã nhận Pikachu chưa
   window.playerService.hasFlag('received_starter_pikachu');

   // Kiểm tra sự kiện cổng Lab đã xong chưa
   window.playerService.hasFlag('pallet_lab_gate_event_done');
   ```
