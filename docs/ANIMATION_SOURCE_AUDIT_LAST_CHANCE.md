# Audit nguồn Animation — Pokémon Last Chance 1.22

> Trạng thái: **Đã triển khai pack Last Chance namespaced; báo cáo này giữ lại số liệu điều tra gốc để đối chiếu**
>
> Mục tiêu: đối chiếu nguồn `Pokémon Last Chance 1.22` với pipeline animation hiện tại và xác định các move có thể bổ sung an toàn.

## 1. Kết luận ngắn

Nguồn Last Chance có nhiều timeline move hơn nguồn hiện tại và có thể bổ sung đáng kể animation cho database 956 move của dự án. Tuy nhiên:

- Không được dùng trực tiếp các số ID trong `Data/move2anim.dat` vì đây là ID nội bộ của bộ `PBMoves` trong bản hack.
- Phải resolve theo tên `Move:NAME` trong `Data/PkmnAnimations.rxdata`, sau đó chuẩn hóa sang move key của dự án.
- Timeline và sprite sheet phải được xem là một cặp dữ liệu. Không được lấy timeline Last Chance rồi dùng ngẫu nhiên sprite sheet cùng tên của dự án.
- Nguồn có 336 candidate bổ sung đạt kiểm tra cơ bản ở lần audit ban đầu; sau khi kiểm tra lại theo geometry thật của từng atlas, 334 move đã được promote vào runtime pack và 23 timeline nguồn bị loại khỏi mapping vì pattern/graphic không an toàn.
- Chỉ 56 candidate bổ sung dùng sprite sheet có hash trùng với asset hiện tại; đây là nhóm an toàn nhất để thử trước.

## 2. Những file nguồn có liên quan

| File | Vai trò | Kết luận sử dụng |
|---|---|---|
| `Data/PkmnAnimations.rxdata` | Timeline animation dạng Pokémon Essentials | Nguồn chính để import timeline |
| `Data/move2anim.dat` | Mảng ID move → animation ID, gồm regular/OppMove | Chỉ dùng để kiểm tra logic; không dùng trực tiếp làm mapping runtime |
| `Data/Animations.rxdata` | Animation RGSS cũ | Không dùng làm nguồn chính cho timeline hiện tại |
| `Data/Scripts.rxdata` | Script Ruby đã compile | Dùng làm tài liệu tham chiếu thuật toán |
| `Graphics/Animations/*` | Sprite sheet cho timeline | Phải import cùng timeline hoặc xác nhận hash tương thích |
| `Audio/SE/Anim/*` | Âm thanh timing | Chỉ nhập sau khi asset registry có namespace riêng |

## 3. Số liệu đã kiểm tra

### 3.1. Timeline và mapping

- `PkmnAnimations.rxdata`: 758 slot animation.
- Move timeline duy nhất: 572.
- `OppMove` timeline duy nhất: 29.
- Animation common/utility khác: khoảng 151.
- Mapping regular trong `move2anim.dat`: 759 slot index.
- Mapping opponent trong `move2anim.dat`: 564 slot index.

Đối chiếu với dự án:

- Move đang có trong animation map: 212.
- 211/212 move hiện tại có timeline cùng tên trong Last Chance.
- `highjumpkick` là trường hợp lệch tên: nguồn dùng `HIJUMPKICK`/`hijumpkick`.
- 18/18 `OppMove` hiện tại đều có biến thể tương ứng trong nguồn.
- 354 move bổ sung trong Last Chance đồng thời tồn tại trong `moves-db.json` nhưng chưa có trong animation map hiện tại.
- 371 move trong database hiện tại không có timeline trực tiếp trong nguồn này; phần lớn là move Gen 8/Gen 9, Z-Move, G-Max hoặc move custom mới.

### 3.2. Chất lượng candidate bổ sung

Trong 354 move bổ sung:

- 336: timeline có frame, graphic tồn tại và pattern nằm trong atlas hợp lệ.
- 7: timeline có pattern vượt kích thước atlas.
- 11: graphic thiếu hoặc trường graphic rỗng.
- 0: timeline rỗng hoàn toàn trong nhóm candidate bổ sung.

Các candidate lỗi cần giữ trong danh sách chờ xử lý:

```text
Pattern vượt atlas:
brave_bird, heal_block, imprison, seismic_toss,
sheer_cold, sky_drop, substitute

Graphic thiếu/rỗng:
aqua_jet, bulldoze, camouflage, confusion, double_team,
dazzling_gleam, extrasensory, growth, magic_room,
odor_sleuth, role_play
```

Ngoài nhóm bổ sung, `bubblebeam` và `thunder_wave` cũng cần validator xử lý khi đối chiếu lại 212 move hiện tại.

## 4. Trạng thái triển khai thực tế

- Pack timeline: `packages/game-data/animations/last-chance/` — 758 definition JSON, ID namespace `6000 + sourceId`.
- Pack asset: `Graphics/Animations/LastChance/` — 115 sprite sheets, không ghi đè asset hiện tại.
- Mapping bổ sung: `packages/game-data/move-animation-extensions.json` — 334 regular moves và 27 OppMove variants.
- Registry ưu tiên mapping hiện tại; chỉ fallback sang Last Chance khi move chưa có mapping cũ.
- Timeline bị loại được ghi trong `packages/game-data/last-chance-animation-rejections.json`; registry không cho phép chúng được chọn qua multi-hit lookup.
- CI validator kiểm tra cả hai pack và chỉ xác nhận các definition Last Chance đang được mapping là hợp lệ.

## 5. Nhóm nên triển khai trước

### 4.1. Nhóm an toàn nhất — asset byte-identical

Các move dưới đây có timeline nguồn hợp lệ và sprite sheet tương ứng đã có hash trùng asset hiện tại. Có thể dùng làm batch thử nghiệm đầu tiên sau khi hoàn thiện registry import:

```text
arm_thrust, assist, assurance, astonish, baton_pass, belch,
blaze_kick, bone_club, bone_rush, bonemerang, captivate,
clanging_scales, confide, crush_grip, drill_run, electroweb,
fairy_lock, feint, fissure, force_palm, hammer_arm, heal_bell,
heal_block, horn_drill, hydro_cannon, hypnosis, imprison,
knock_off, leaf_storm, leaf_tornado, liquidation, low_sweep,
magical_leaf, milk_drink, mud_bomb, mud_shot, mud_sport,
muddy_water, mudslap, needle_arm, perish_song, petal_blizzard,
power_gem, quash, scald, substitute, surf, switcheroo,
taunt, teeter_dance, torment, toxic_spikes, tri_attack, trick,
wood_hammer, yawn
```

Nên ưu tiên kiểm thử visual trước với:

```text
surf, scald, substitute, leaf_storm, hydro_cannon,
power_gem, hypnosis, toxic_spikes, tri_attack, hammer_arm
```

### 4.2. Nhóm có timeline tốt nhưng phải nhập sprite sheet nguồn

Khoảng 280 candidate còn lại trong nhóm 336 hợp lệ dùng sprite sheet khác hash so với asset hiện tại. Chúng có thể rất hữu ích, nhưng phải nhập theo một pack riêng:

```text
LastChanceAnimationPack/
├── timelines/
├── graphics/
├── audio/
└── manifest.json
```

Không ghi đè file hiện tại có cùng tên. Asset key phải có namespace, ví dụ:

```text
animation.last_chance.surf
animation.last_chance.waterbubbles
```

Sau visual QA mới quyết định asset nào được promote thành asset mặc định.

## 6. Các move bổ sung đáng ưu tiên theo gameplay

Đây là nhóm nên lấy từ Last Chance sau batch an toàn vì giúp phủ các move thường gặp nhưng hiện chưa có timeline riêng:

```text
protect, surf, substitute, scald, hyper_beam, ice_beam,
earthquake, dark_pulse, aura_sphere, dragon_pulse, rock_slide,
rapid_spin, roost, calm_mind, tailwind, focus_punch, giga_impact,
blizzard, solar_beam, psychic_terrain, misty_terrain, protect,
rapid_spin, waterfall, wild_charge, volt_tackle, water_shuriken,
shadow_claw, shadow_punch, shadow_sneak, sacred_sword, stone_edge,
steel_wing, thunder_wave, thunder, flame_charge, flare_blitz
```

Danh sách này chỉ là thứ tự ưu tiên visual; mỗi move vẫn phải qua mapping, atlas validator và kiểm tra Player/Enemy.

## 7. Logic animation trong nguồn cần giữ làm chuẩn

`Data/Scripts.rxdata` chứa các script compile có thể dùng làm reference cho runtime hiện tại:

### 6.1. Resolve Move/OppMove/fallback

Script `PokeBattle_Scene` thực hiện:

1. Nếu Player: lấy regular move animation.
2. Nếu Enemy: ưu tiên `OppMove`, nếu không có thì fallback về regular move.
3. Với multi-hit: dùng `animationId + hitNum`.
4. Nếu không có animation riêng: fallback theo type.
5. Cuối cùng fallback về Tackle.

### 6.2. Transform focus `both`

Script `PokeBattle_AnimationPlayer` dùng đường chuẩn:

```text
source user   = (128, 224)
source target = (384, 96)
```

Điểm cel lấy tiến độ theo trục X trên đường nguồn, sau đó đặt lên đường đích. Không tính X/Y độc lập.

### 6.3. Mirror

Nguồn dùng kiểm tra hướng đường nguồn và đường đích thông qua `isReversed`. Không được mirror mọi animation Enemy một cách vô điều kiện.

### 6.4. Layer

Nguồn có bốn priority:

```text
0 = behind everything
1 = in front of everything
2 = behind focus
3 = above focus
```

Runtime hiện tại phải bảo toàn ý nghĩa này khi phân tách `renderBehind`/`renderAbove`.

### 6.5. Multi-hit

Source battle move truyền `hitnum` xuyên suốt từ move effect → battle scene → animation resolver. Đây là bằng chứng để hoàn thiện `hitNum` trong runtime hiện tại, không phải tạo mapping riêng cho từng hit.

## 8. Không được làm

- Không copy đè toàn bộ `move-animation-map.json` hiện tại bằng `move2anim.dat` của Last Chance.
- Không giả định animation ID 740 của Last Chance là animation ID 740 của Reunion.
- Không dùng `Data/Animations.rxdata` thay cho `PkmnAnimations.rxdata`.
- Không trộn timeline Last Chance với sprite sheet cùng tên nhưng khác hash mà không QA.
- Không coi mọi timeline có tên `Move:*` là hoàn thiện về mặt hình ảnh; phải kiểm tra pattern, focus, asset và hướng Player/Enemy.
- Không đưa script Ruby hoặc `.rxdata` vào runtime frontend/Tauri.

## 9. Kế hoạch nhập dữ liệu đề xuất

### Phase A — Import read-only và manifest

- Tạo converter nhận `sourceRoot` thay vì hardcode đường dẫn.
- Resolve animation theo tên Move/OppMove.
- Ghi `sourceId`, `sourceName`, `sourceGraphic`, `sourcePack` vào metadata.
- Sinh manifest riêng, không ghi đè dữ liệu hiện tại.

### Phase B — Batch 56 asset tương thích

- Import timeline 56 move an toàn.
- Dùng asset registry hiện tại khi hash trùng.
- Bổ sung test mapping và atlas.
- Visual QA Player/Enemy/self-target.

### Phase C — Pack asset khác hash

- Nhập sprite sheet Last Chance theo namespace.
- Chuyển 280 candidate hợp lệ còn lại.
- So sánh hình ảnh trực quan với timeline.
- Chỉ promote asset sau khi pass gallery.

### Phase D — Sửa candidate lỗi

- Xác minh lại atlas metadata.
- Sửa converter hoặc thêm asset thiếu cho 7 pattern lỗi.
- Bổ sung asset/override cho 11 move thiếu graphic.
- Không bỏ qua lỗi bằng clamp trong renderer.

### Phase E — Fallback cho 371 move còn lại

- Dùng fallback type/category có kiểm soát.
- Ưu tiên viết custom timeline cho move phổ biến.
- Các move Gen 8/Gen 9/Z/G-Max cần pack riêng, không ép dùng animation Gen 6/7 nếu hình ảnh sai ngữ nghĩa.

## 10. Tiêu chí nghiệm thu

- Không làm thay đổi mapping 212 move hiện tại nếu chưa có regression approval.
- 18 `OppMove` hiện tại vẫn hoạt động.
- Batch mới resolve được theo tên, không phụ thuộc source numeric ID.
- `hitNum` được truyền đúng cho multi-hit.
- Player và Enemy có hướng/mirror đúng.
- Self-target không bị chuyển sang target đối phương.
- Atlas validator bắt được pattern lỗi.
- Asset khác hash được tách namespace và không ghi đè asset cũ.
- Gallery hiển thị được source pack, animation ID, graphic key và source name.
- `npm run ci` pass sau mỗi batch.

## 11. Kết luận

Nguồn Last Chance nên được dùng như **nguồn bổ sung timeline và reference logic**, không phải thay thế trực tiếp nguồn animation hiện tại. Batch hợp lý nhất là 56 move có asset byte-identical, sau đó mở rộng sang 280 move có timeline hợp lệ nhưng cần import sprite sheet theo namespace. Việc sửa transform/mirror/viewport trong [ANIMATION_ALIGNMENT_FIX_GUIDE.md](ANIMATION_ALIGNMENT_FIX_GUIDE.md) phải hoàn tất trước khi nhập batch lớn.

