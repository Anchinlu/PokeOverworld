# Gen 9 Data Reference — TM, Base Stats và Ability

> Generated: 2026-10-11
> Scope: 151 Pokémon Kanto đang có trong dự án; luật dữ liệu tham chiếu Pokémon Scarlet/Violet và DLC Gen 9.

## Trạng thái triển khai

| Hạng mục | Trạng thái | Ghi chú |
|---|---|---|
| Roster | Đang giữ 151 Pokémon Gen 1 | Chưa mở rộng sang toàn bộ National Dex Gen 9. |
| Base stats | Có dữ liệu cho 151 Pokémon | Bảng dưới dùng HP, Attack, Defense, Sp. Atk, Sp. Def, Speed. |
| Ability | Đã hoàn thành | Đầy đủ `primary`, `secondary`, `hidden` cho 151 Pokémon và cơ chế chọn slot khi spawn/tạo đội hình. |
| TM catalog | Đã hoàn thành | Đăng ký đầy đủ `tm001`–`tm229` trong database vật phẩm và mapping kỹ năng. |
| Terastallization | Đã hoàn thành | `teraType`, trạng thái Terastallized, nút kích hoạt battle, STAB 2.0x/1.5x, Tera Blast và phòng thủ đơn hệ. |
| TM Machine/crafting | Chưa triển khai | Không yêu cầu trong giai đoạn này (giữ nguyên kho đồ TM trực tiếp). |

## TM001–TM229

`Power`, `Accuracy` và `PP` lấy theo move data Gen 9. Dấu `—` nghĩa là chiêu Status hoặc không áp dụng chỉ số đó. `Kanto 151` là số Pokémon hiện có trong dự án có thể học TM tương ứng theo machine learnset Gen 9.

| TM | Move | Type | Category | Power | Accuracy | PP | Kanto 151 |
|---:|---|---|---|---:|---:|---:|---:|
| TM001 | Take Down | Normal | Physical | 90 | 85 | 20 | 83 |
| TM002 | Charm (Quyến Rũ) | Fairy | Status | — | 100 | 20 | 30 |
| TM003 | Fake Tears | Dark | Status | — | 100 | 20 | 13 |
| TM004 | Agility (Khinh Công) | Psychic | Status | — | — | 30 | 32 |
| TM005 | Mud-Slap | Ground | Special | 20 | 100 | 10 | 26 |
| TM006 | Scary Face | Normal | Status | — | 100 | 10 | 41 |
| TM007 | Protect (Khiên Bảo Vệ) | Normal | Status | — | — | 10 | 97 |
| TM008 | Fire Fang | Fire | Physical | 65 | 95 | 15 | 11 |
| TM009 | Thunder Fang | Electric | Physical | 65 | 95 | 15 | 7 |
| TM010 | Ice Fang | Ice | Physical | 65 | 95 | 15 | 5 |
| TM011 | Water Pulse | Water | Special | 60 | 100 | 20 | 31 |
| TM012 | Low Kick | Fighting | Physical | — | 100 | 20 | 21 |
| TM013 | Acid Spray | Poison | Special | 40 | 100 | 20 | 24 |
| TM014 | Acrobatics (Nhào Lộn) | Flying | Physical | 55 | 100 | 15 | 10 |
| TM015 | Struggle Bug | Bug | Special | 50 | 100 | 20 | 4 |
| TM016 | Psybeam (Tia Tâm Linh) | Psychic | Special | 65 | 100 | 20 | 17 |
| TM017 | Confuse Ray | Ghost | Status | — | 100 | 10 | 20 |
| TM018 | Thief (Trộm Đồ) | Dark | Physical | 60 | 100 | 25 | 58 |
| TM019 | Disarming Voice | Fairy | Special | 40 | — | 15 | 9 |
| TM020 | Trailblaze (Khai Phá Đường Đi) | Grass | Physical | 50 | 100 | 20 | 34 |
| TM021 | Pounce (Chồm Vồ) | Bug | Physical | 50 | 100 | 20 | 10 |
| TM022 | Chilling Water | Water | Special | 50 | 100 | 20 | 34 |
| TM023 | Charge Beam | Electric | Special | 50 | 90 | 10 | 11 |
| TM024 | Fire Spin | Fire | Special | 35 | 85 | 15 | 14 |
| TM025 | Facade (Vờ Mạnh Mẽ) | Normal | Physical | 70 | 100 | 20 | 97 |
| TM026 | Poison Tail | Poison | Physical | 50 | 100 | 25 | 3 |
| TM027 | Aerial Ace | Flying | Physical | 60 | — | 20 | 14 |
| TM028 | Bulldoze (San Phẳng) | Ground | Physical | 60 | 100 | 20 | 31 |
| TM029 | Hex (Bùa Ếm Ma Quái) | Ghost | Special | 65 | 100 | 10 | 12 |
| TM030 | Snarl (Tiếng Gầm Gừ Gắt Gỏng) | Dark | Special | 55 | 95 | 15 | 9 |
| TM031 | Metal Claw | Steel | Physical | 50 | 95 | 35 | 6 |
| TM032 | Swift (Sao Tốc Độ) | Normal | Special | 60 | — | 20 | 63 |
| TM033 | Magical Leaf | Grass | Special | 60 | — | 20 | 15 |
| TM034 | Icy Wind | Ice | Special | 55 | 95 | 15 | 42 |
| TM035 | Mud Shot | Ground | Special | 55 | 95 | 15 | 28 |
| TM036 | Rock Tomb | Rock | Physical | 60 | 95 | 15 | 28 |
| TM037 | Draining Kiss | Fairy | Special | 50 | 100 | 10 | 9 |
| TM038 | Flame Charge | Fire | Physical | 50 | 100 | 20 | 10 |
| TM039 | Low Sweep | Fighting | Physical | 65 | 100 | 20 | 14 |
| TM040 | Air Cutter | Flying | Special | 60 | 95 | 25 | 8 |
| TM041 | Stored Power | Psychic | Special | 20 | 100 | 10 | 18 |
| TM042 | Night Shade | Ghost | Special | — | 100 | 15 | 12 |
| TM043 | Fling (Ném Đồ) | Dark | Physical | — | 100 | 10 | 43 |
| TM044 | Dragon Tail | Dragon | Physical | 60 | 90 | 10 | 9 |
| TM045 | Venoshock (Sốc Độc Tố) | Poison | Special | 65 | 100 | 10 | 23 |
| TM046 | Avalanche (Tuyết Lở) | Ice | Physical | 60 | 100 | 10 | 13 |
| TM047 | Endure (Kiên Cường) | Normal | Status | — | — | 10 | 97 |
| TM048 | Volt Switch | Electric | Special | 70 | 100 | 20 | 10 |
| TM049 | Sunny Day | Fire | Status | — | — | 5 | 75 |
| TM050 | Rain Dance | Water | Status | — | — | 5 | 69 |
| TM051 | Sandstorm (Bão Cát) | Rock | Status | — | — | 10 | 26 |
| TM052 | Snowscape (Cảnh Tuyết Rơi) | Ice | Status | 0 | — | 10 | 12 |
| TM053 | Smart Strike | Steel | Physical | 70 | — | 10 | 8 |
| TM054 | Psyshock (Chấn Động Tâm Linh) | Psychic | Special | 80 | 100 | 10 | 16 |
| TM055 | Dig (Đào Đất) | Ground | Physical | 80 | 100 | 10 | 47 |
| TM056 | Bullet Seed | Grass | Physical | 25 | 100 | 30 | 12 |
| TM057 | False Swipe | Normal | Physical | 40 | 100 | 40 | 12 |
| TM058 | Brick Break | Fighting | Physical | 75 | 100 | 15 | 39 |
| TM059 | Zen Headbutt | Psychic | Physical | 80 | 90 | 15 | 28 |
| TM060 | U-turn | Bug | Physical | 70 | 100 | 20 | 10 |
| TM061 | Shadow Claw | Ghost | Physical | 70 | 100 | 15 | 17 |
| TM062 | Foul Play | Dark | Physical | 95 | 100 | 15 | 18 |
| TM063 | Psychic Fangs | Psychic | Physical | 85 | 100 | 10 | 5 |
| TM064 | Bulk Up | Fighting | Status | — | — | 20 | 8 |
| TM065 | Air Slash | Flying | Special | 75 | 95 | 15 | 7 |
| TM066 | Body Slam | Normal | Physical | 85 | 100 | 15 | 74 |
| TM067 | Fire Punch | Fire | Physical | 75 | 100 | 15 | 28 |
| TM068 | Thunder Punch | Electric | Physical | 75 | 100 | 15 | 30 |
| TM069 | Ice Punch | Ice | Physical | 75 | 100 | 15 | 29 |
| TM070 | Sleep Talk | Normal | Status | — | — | 10 | 97 |
| TM071 | Seed Bomb | Grass | Physical | 80 | 100 | 15 | 19 |
| TM072 | Electro Ball | Electric | Special | — | 100 | 10 | 11 |
| TM073 | Drain Punch | Fighting | Physical | 75 | 100 | 10 | 17 |
| TM074 | Reflect (Phản Chiếu) | Psychic | Status | — | — | 20 | 19 |
| TM075 | Light Screen | Psychic | Status | — | — | 30 | 30 |
| TM076 | Rock Blast | Rock | Physical | 25 | 90 | 10 | 10 |
| TM077 | Waterfall (Thác Nước) | Water | Physical | 80 | 100 | 15 | 20 |
| TM078 | Dragon Claw | Dragon | Physical | 80 | 100 | 15 | 5 |
| TM079 | Dazzling Gleam | Fairy | Special | 80 | 100 | 10 | 14 |
| TM080 | Metronome (Ngón Tay Lắc Lư) | Normal | Status | — | — | 10 | 29 |
| TM081 | Grass Knot | Grass | Special | — | 100 | 20 | 25 |
| TM082 | Thunder Wave | Electric | Status | — | 90 | 20 | 28 |
| TM083 | Poison Jab | Poison | Physical | 80 | 100 | 20 | 26 |
| TM084 | Stomping Tantrum | Ground | Physical | 75 | 100 | 10 | 22 |
| TM085 | Rest (Nghỉ Ngơi) | Psychic | Status | — | — | 5 | 97 |
| TM086 | Rock Slide | Rock | Physical | 75 | 90 | 10 | 28 |
| TM087 | Taunt (Khiêu Khích) | Dark | Status | — | 100 | 20 | 28 |
| TM088 | Swords Dance | Normal | Status | — | — | 20 | 28 |
| TM089 | Body Press | Fighting | Physical | 80 | 100 | 10 | 13 |
| TM090 | Spikes (Rải Bông Gai) | Ground | Status | — | — | 20 | 5 |
| TM091 | Toxic Spikes | Poison | Status | — | — | 20 | 14 |
| TM092 | Imprison (Phong Ấn) | Psychic | Status | — | — | 10 | 17 |
| TM093 | Flash Cannon | Steel | Special | 80 | 100 | 10 | 6 |
| TM094 | Dark Pulse | Dark | Special | 80 | 100 | 15 | 18 |
| TM095 | Leech Life | Bug | Physical | 80 | 100 | 10 | 10 |
| TM096 | Eerie Impulse | Electric | Status | — | 100 | 15 | 11 |
| TM097 | Fly (Bay Lên) | Flying | Physical | 90 | 95 | 15 | 7 |
| TM098 | Skill Swap | Psychic | Status | — | — | 10 | 20 |
| TM099 | Iron Head | Steel | Physical | 80 | 100 | 15 | 13 |
| TM100 | Dragon Dance | Dragon | Status | — | — | 20 | 11 |
| TM101 | Power Gem | Rock | Special | 80 | 100 | 20 | 5 |
| TM102 | Gunk Shot | Poison | Physical | 120 | 80 | 5 | 18 |
| TM103 | Substitute (Thế Thân) | Normal | Status | — | — | 10 | 97 |
| TM104 | Iron Defense | Steel | Status | — | — | 15 | 13 |
| TM105 | X-Scissor | Bug | Physical | 80 | 100 | 15 | 4 |
| TM106 | Drill Run | Ground | Physical | 80 | 95 | 10 | 9 |
| TM107 | Will-O-Wisp | Fire | Status | — | 85 | 15 | 17 |
| TM108 | Crunch (Cắn Nghiền) | Dark | Physical | 80 | 100 | 15 | 13 |
| TM109 | Trick (Hoán Đổi Vật Phẩm) | Psychic | Status | — | 100 | 10 | 14 |
| TM110 | Liquidation (Đao Nước Xẻ Đôi) | Water | Physical | 85 | 100 | 10 | 20 |
| TM111 | Giga Drain | Grass | Special | 75 | 100 | 10 | 23 |
| TM112 | Aura Sphere | Fighting | Special | 80 | — | 20 | 5 |
| TM113 | Tailwind (Thuận Gió) | Flying | Status | — | — | 15 | 8 |
| TM114 | Shadow Ball | Ghost | Special | 80 | 100 | 15 | 28 |
| TM115 | Dragon Pulse | Dragon | Special | 85 | 100 | 10 | 15 |
| TM116 | Stealth Rock | Rock | Status | — | — | 20 | 16 |
| TM117 | Hyper Voice | Normal | Special | 90 | 100 | 10 | 15 |
| TM118 | Heat Wave | Fire | Special | 95 | 90 | 10 | 14 |
| TM119 | Energy Ball | Grass | Special | 90 | 100 | 10 | 22 |
| TM120 | Psychic (Tâm Linh) | Psychic | Special | 90 | 100 | 10 | 27 |
| TM121 | Heavy Slam | Steel | Physical | — | 100 | 10 | 8 |
| TM122 | Encore (Diễn Lại) | Normal | Status | — | 100 | 5 | 28 |
| TM123 | Surf (Lướt Sóng) | Water | Special | 90 | 100 | 15 | 30 |
| TM124 | Ice Spinner | Ice | Physical | 80 | 100 | 15 | 12 |
| TM125 | Flamethrower (Phun Lửa) | Fire | Special | 90 | 100 | 15 | 34 |
| TM126 | Thunderbolt (Phóng Điện) | Electric | Special | 90 | 100 | 15 | 37 |
| TM127 | Play Rough | Fairy | Physical | 90 | 90 | 10 | 12 |
| TM128 | Amnesia (Quên Lãng) | Psychic | Status | — | — | 20 | 19 |
| TM129 | Calm Mind | Psychic | Status | — | — | 20 | 19 |
| TM130 | Helping Hand | Normal | Status | — | — | 20 | 73 |
| TM131 | Pollen Puff | Bug | Special | 90 | 100 | 15 | 3 |
| TM132 | Baton Pass | Normal | Status | — | — | 40 | 21 |
| TM133 | Earth Power | Ground | Special | 90 | 100 | 10 | 15 |
| TM134 | Reversal (Đảo Ngược Cục Diện) | Fighting | Physical | — | 100 | 15 | 17 |
| TM135 | Ice Beam | Ice | Special | 90 | 100 | 10 | 37 |
| TM136 | Electric Terrain | Electric | Status | — | — | 10 | 11 |
| TM137 | Grassy Terrain | Grass | Status | — | — | 10 | 12 |
| TM138 | Psychic Terrain | Psychic | Status | — | — | 10 | 7 |
| TM139 | Misty Terrain | Fairy | Status | — | — | 10 | 5 |
| TM140 | Nasty Plot | Dark | Status | — | — | 20 | 18 |
| TM141 | Fire Blast | Fire | Special | 110 | 85 | 5 | 34 |
| TM142 | Hydro Pump | Water | Special | 110 | 80 | 5 | 26 |
| TM143 | Blizzard (Bão Tuyết) | Ice | Special | 110 | 70 | 5 | 37 |
| TM144 | Fire Pledge | Fire | Special | 80 | 100 | 10 | 4 |
| TM145 | Water Pledge | Water | Special | 80 | 100 | 10 | 4 |
| TM146 | Grass Pledge | Grass | Special | 80 | 100 | 10 | 4 |
| TM147 | Wild Charge | Electric | Physical | 90 | 100 | 15 | 17 |
| TM148 | Sludge Bomb | Poison | Special | 90 | 100 | 10 | 27 |
| TM149 | Earthquake (Động Đất) | Ground | Physical | 100 | 100 | 10 | 31 |
| TM150 | Stone Edge | Rock | Physical | 100 | 80 | 5 | 18 |
| TM151 | Phantom Force | Ghost | Physical | 90 | 100 | 10 | 3 |
| TM152 | Giga Impact | Normal | Physical | 150 | 90 | 5 | 54 |
| TM153 | Blast Burn | Fire | Special | 150 | 90 | 5 | 2 |
| TM154 | Hydro Cannon | Water | Special | 150 | 90 | 5 | 2 |
| TM155 | Frenzy Plant | Grass | Special | 150 | 90 | 5 | 2 |
| TM156 | Outrage (Long Thần Cuồng Nộ) | Dragon | Physical | 120 | 100 | 10 | 18 |
| TM157 | Overheat (Quá Nhiệt Bộc Phá) | Fire | Special | 130 | 90 | 5 | 13 |
| TM158 | Focus Blast | Fighting | Special | 120 | 70 | 5 | 30 |
| TM159 | Leaf Storm | Grass | Special | 130 | 90 | 5 | 12 |
| TM160 | Hurricane (Cuồng Phong) | Flying | Special | 110 | 70 | 10 | 8 |
| TM161 | Trick Room | Psychic | Status | — | — | 5 | 11 |
| TM162 | Bug Buzz | Bug | Special | 90 | 100 | 10 | 4 |
| TM163 | Hyper Beam | Normal | Special | 150 | 90 | 5 | 53 |
| TM164 | Brave Bird | Flying | Physical | 120 | 100 | 15 | 6 |
| TM165 | Flare Blitz | Fire | Physical | 120 | 100 | 15 | 11 |
| TM166 | Thunder (Sấm Sét) | Electric | Special | 110 | 70 | 10 | 36 |
| TM167 | Close Combat | Fighting | Physical | 120 | 100 | 5 | 10 |
| TM168 | Solar Beam | Grass | Special | 120 | 100 | 10 | 27 |
| TM169 | Draco Meteor | Dragon | Special | 130 | 90 | 5 | 4 |
| TM170 | Steel Beam | Steel | Special | 140 | 95 | 5 | 3 |
| TM171 | Tera Blast | Normal | Special | 80 | 100 | 10 | 97 |
| TM172 | Roar (Tiếng Gầm) | Normal | Status | — | — | 20 | 24 |
| TM173 | Charge (Nạp Điện) | Electric | Status | — | — | 20 | 11 |
| TM174 | Haze (Khói Đen) | Ice | Status | — | — | 30 | 30 |
| TM175 | Toxic (Kịch Độc) | Poison | Status | — | 90 | 10 | 25 |
| TM176 | Sand Tomb | Ground | Physical | 35 | 85 | 15 | 5 |
| TM177 | Spite (Oán Hận) | Ghost | Status | — | 100 | 10 | 17 |
| TM178 | Gravity (Trọng Lực) | Psychic | Status | — | — | 5 | 11 |
| TM179 | Smack Down | Rock | Physical | 50 | 100 | 15 | 13 |
| TM180 | Gyro Ball | Steel | Physical | — | 100 | 5 | 17 |
| TM181 | Knock Off | Dark | Physical | 65 | 100 | 20 | 36 |
| TM182 | Bug Bite | Bug | Physical | 60 | 100 | 20 | 6 |
| TM183 | Super Fang | Normal | Physical | — | 90 | 10 | 3 |
| TM184 | Vacuum Wave | Fighting | Special | 40 | 100 | 30 | 8 |
| TM185 | Lunge (Đâm Tới) | Bug | Physical | 80 | 100 | 15 | 11 |
| TM186 | High Horsepower | Ground | Physical | 95 | 95 | 10 | 11 |
| TM187 | Icicle Spear | Ice | Physical | 25 | 100 | 30 | 7 |
| TM188 | Scald (Nước Sôi Bỏng) | Water | Special | 80 | 100 | 15 | 4 |
| TM189 | Heat Crash | Fire | Physical | — | 100 | 10 | 6 |
| TM190 | Solar Blade | Grass | Physical | 125 | 100 | 10 | 2 |
| TM191 | Uproar (Huyên Náo Quấy Nhiễu) | Normal | Special | 90 | 100 | 10 | 22 |
| TM192 | Focus Punch | Fighting | Physical | 150 | 100 | 20 | 37 |
| TM193 | Weather Ball | Normal | Special | 50 | 100 | 10 | 38 |
| TM194 | Grassy Glide | Grass | Physical | 55 | 100 | 20 | 12 |
| TM195 | Burning Jealousy | Fire | Special | 70 | 100 | 5 | 6 |
| TM196 | Flip Turn | Water | Physical | 60 | 100 | 20 | 13 |
| TM197 | Dual Wingbeat | Flying | Physical | 40 | 90 | 10 | 7 |
| TM198 | Poltergeist (Hiện Tượng Ma Quái) | Ghost | Physical | 110 | 90 | 5 | 4 |
| TM199 | Lash Out | Dark | Physical | 75 | 100 | 5 | 11 |
| TM200 | Scale Shot | Dragon | Physical | 25 | 90 | 20 | 9 |
| TM201 | Misty Explosion | Fairy | Special | 100 | 100 | 5 | 5 |
| TM202 | Pain Split | Normal | Status | — | — | 20 | 15 |
| TM203 | Psych Up | Normal | Status | — | — | 10 | 23 |
| TM204 | Double-Edge | Normal | Physical | 120 | 100 | 15 | 63 |
| TM205 | Endeavor (Nỗ Lực Tột Cùng) | Normal | Physical | — | 100 | 5 | 35 |
| TM206 | Petal Blizzard | Grass | Physical | 90 | 100 | 15 | 4 |
| TM207 | Temper Flare | Fire | Physical | 75 | 100 | 10 | 10 |
| TM208 | Whirlpool (Xoáy Nước) | Water | Special | 35 | 85 | 15 | 22 |
| TM209 | Muddy Water | Water | Special | 90 | 85 | 10 | 19 |
| TM210 | Supercell Slam | Electric | Physical | 100 | 95 | 15 | 7 |
| TM211 | Electroweb (Lưới Điện) | Electric | Special | 55 | 95 | 15 | 10 |
| TM212 | Triple Axel | Ice | Physical | 20 | 90 | 10 | 4 |
| TM213 | Coaching (Huấn Luyện) | Fighting | Status | — | — | 10 | 4 |
| TM214 | Sludge Wave | Poison | Special | 95 | 100 | 10 | 18 |
| TM215 | Scorching Sands | Ground | Special | 70 | 100 | 10 | 13 |
| TM216 | Feather Dance | Flying | Status | — | 100 | 15 | 4 |
| TM217 | Future Sight | Psychic | Special | 120 | 100 | 10 | 8 |
| TM218 | Expanding Force | Psychic | Special | 80 | 100 | 10 | 8 |
| TM219 | Skitter Smack | Bug | Physical | 70 | 90 | 10 | 11 |
| TM220 | Meteor Beam | Rock | Special | 120 | 90 | 10 | 4 |
| TM221 | Throat Chop | Dark | Physical | 80 | 100 | 15 | 18 |
| TM222 | Breaking Swipe | Dragon | Physical | 60 | 100 | 15 | 9 |
| TM223 | Metal Sound | Steel | Status | — | 85 | 40 | 8 |
| TM224 | Curse (Lời Nguyền) | Ghost | Status | — | — | 10 | 42 |
| TM225 | Hard Press | Steel | Physical | 0 | 100 | 10 | 4 |
| TM226 | Dragon Cheer | Dragon | Status | 0 | 0 | 15 | 7 |
| TM227 | Alluring Voice | Fairy | Special | 80 | 100 | 10 | 13 |
| TM228 | Psychic Noise | Psychic | Special | 75 | 100 | 10 | 15 |
| TM229 | Upper Hand | Fighting | Physical | 65 | 100 | 15 | 6 |

## Ability của 151 Pokémon (Mô hình hỗ trợ 3 slot)

Slot được quy ước theo dữ liệu Pokémon: `Primary` = slot 1, `Secondary` = slot 2, `Hidden` = slot 3. Lưu ý: Theo canon Pokémon Scarlet/Violet DLC, không phải Pokémon nào cũng có đủ 3 Ability; những loài chỉ có 1 hoặc 2 Ability trong thực tế sẽ chỉ định nghĩa các slot tương ứng (ví dụ: Metapod, Kakuna chỉ có `primary: shed-skin`, Gastly, Haunter chỉ có `primary: levitate`, Mew chỉ có `primary: synchronize`). Đây là tài liệu data reference; việc cho phép đổi Ability trong game vẫn chưa được triển khai.

| # | Pokémon | Base Stats (HP/Atk/Def/SpA/SpD/Spe) | Ability đầy đủ |
|---:|---|---|---|
| 1 | bulbasaur | 45/49/49/65/65/45 | Primary: overgrow; Hidden: chlorophyll |
| 2 | ivysaur | 60/62/63/80/80/60 | Primary: overgrow; Hidden: chlorophyll |
| 3 | venusaur | 80/82/83/100/100/80 | Primary: overgrow; Hidden: chlorophyll |
| 4 | charmander | 39/52/43/60/50/65 | Primary: blaze; Hidden: solar-power |
| 5 | charmeleon | 58/64/58/80/65/80 | Primary: blaze; Hidden: solar-power |
| 6 | charizard | 78/84/78/109/85/100 | Primary: blaze; Hidden: solar-power |
| 7 | squirtle | 44/48/65/50/64/43 | Primary: torrent; Hidden: rain-dish |
| 8 | wartortle | 59/63/80/65/80/58 | Primary: torrent; Hidden: rain-dish |
| 9 | blastoise | 79/83/100/85/105/78 | Primary: torrent; Hidden: rain-dish |
| 10 | caterpie | 45/30/35/20/20/45 | Primary: shield-dust; Hidden: run-away |
| 11 | metapod | 50/20/55/25/25/30 | Primary: shed-skin |
| 12 | butterfree | 60/45/50/90/80/70 | Primary: compound-eyes; Hidden: tinted-lens |
| 13 | weedle | 40/35/30/20/20/50 | Primary: shield-dust; Hidden: run-away |
| 14 | kakuna | 45/25/50/25/25/35 | Primary: shed-skin |
| 15 | beedrill | 65/90/40/45/80/75 | Primary: swarm; Hidden: sniper |
| 16 | pidgey | 40/45/40/35/35/56 | Primary: keen-eye; Secondary: tangled-feet; Hidden: big-pecks |
| 17 | pidgeotto | 63/60/55/50/50/71 | Primary: keen-eye; Secondary: tangled-feet; Hidden: big-pecks |
| 18 | pidgeot | 83/80/75/70/70/101 | Primary: keen-eye; Secondary: tangled-feet; Hidden: big-pecks |
| 19 | rattata | 30/56/35/25/35/72 | Primary: run-away; Secondary: guts; Hidden: hustle |
| 20 | raticate | 55/81/60/50/70/97 | Primary: run-away; Secondary: guts; Hidden: hustle |
| 21 | spearow | 40/60/30/31/31/70 | Primary: keen-eye; Hidden: sniper |
| 22 | fearow | 65/90/65/61/61/100 | Primary: keen-eye; Hidden: sniper |
| 23 | ekans | 35/60/44/40/54/55 | Primary: intimidate; Secondary: shed-skin; Hidden: unnerve |
| 24 | arbok | 60/95/69/65/79/80 | Primary: intimidate; Secondary: shed-skin; Hidden: unnerve |
| 25 | pikachu | 35/55/40/50/50/90 | Primary: static; Hidden: lightning-rod |
| 26 | raichu | 60/90/55/90/80/110 | Primary: static; Hidden: lightning-rod |
| 27 | sandshrew | 50/75/85/20/30/40 | Primary: sand-veil; Hidden: sand-rush |
| 28 | sandslash | 75/100/110/45/55/65 | Primary: sand-veil; Hidden: sand-rush |
| 29 | nidoran-f | 55/47/52/40/40/41 | Primary: poison-point; Secondary: rivalry; Hidden: hustle |
| 30 | nidorina | 70/62/67/55/55/56 | Primary: poison-point; Secondary: rivalry; Hidden: hustle |
| 31 | nidoqueen | 90/92/87/75/85/76 | Primary: poison-point; Secondary: rivalry; Hidden: sheer-force |
| 32 | nidoran-m | 46/57/40/40/40/50 | Primary: poison-point; Secondary: rivalry; Hidden: hustle |
| 33 | nidorino | 61/72/57/55/55/65 | Primary: poison-point; Secondary: rivalry; Hidden: hustle |
| 34 | nidoking | 81/102/77/85/75/85 | Primary: poison-point; Secondary: rivalry; Hidden: sheer-force |
| 35 | clefairy | 70/45/48/60/65/35 | Primary: cute-charm; Secondary: magic-guard; Hidden: friend-guard |
| 36 | clefable | 95/70/73/95/90/60 | Primary: cute-charm; Secondary: magic-guard; Hidden: unaware |
| 37 | vulpix | 38/41/40/50/65/65 | Primary: flash-fire; Hidden: drought |
| 38 | ninetales | 73/76/75/81/100/100 | Primary: flash-fire; Hidden: drought |
| 39 | jigglypuff | 115/45/20/45/25/20 | Primary: cute-charm; Secondary: competitive; Hidden: friend-guard |
| 40 | wigglytuff | 140/70/45/85/50/45 | Primary: cute-charm; Secondary: competitive; Hidden: frisk |
| 41 | zubat | 40/45/35/30/40/55 | Primary: inner-focus; Hidden: infiltrator |
| 42 | golbat | 75/80/70/65/75/90 | Primary: inner-focus; Hidden: infiltrator |
| 43 | oddish | 45/50/55/75/65/30 | Primary: chlorophyll; Hidden: run-away |
| 44 | gloom | 60/65/70/85/75/40 | Primary: chlorophyll; Hidden: stench |
| 45 | vileplume | 75/80/85/110/90/50 | Primary: chlorophyll; Hidden: effect-spore |
| 46 | paras | 35/70/55/45/55/25 | Primary: effect-spore; Secondary: dry-skin; Hidden: damp |
| 47 | parasect | 60/95/80/60/80/30 | Primary: effect-spore; Secondary: dry-skin; Hidden: damp |
| 48 | venonat | 60/55/50/40/55/45 | Primary: compound-eyes; Secondary: tinted-lens; Hidden: run-away |
| 49 | venomoth | 70/65/60/90/75/90 | Primary: shield-dust; Secondary: tinted-lens; Hidden: wonder-skin |
| 50 | diglett | 10/55/25/35/45/95 | Primary: sand-veil; Secondary: arena-trap; Hidden: sand-force |
| 51 | dugtrio | 35/100/50/50/70/120 | Primary: sand-veil; Secondary: arena-trap; Hidden: sand-force |
| 52 | meowth | 40/45/35/40/40/90 | Primary: pickup; Secondary: technician; Hidden: unnerve |
| 53 | persian | 65/70/60/65/65/115 | Primary: limber; Secondary: technician; Hidden: unnerve |
| 54 | psyduck | 50/52/48/65/50/55 | Primary: damp; Secondary: cloud-nine; Hidden: swift-swim |
| 55 | golduck | 80/82/78/95/80/85 | Primary: damp; Secondary: cloud-nine; Hidden: swift-swim |
| 56 | mankey | 40/80/35/35/45/70 | Primary: vital-spirit; Secondary: anger-point; Hidden: defiant |
| 57 | primeape | 65/105/60/60/70/95 | Primary: vital-spirit; Secondary: anger-point; Hidden: defiant |
| 58 | growlithe | 55/70/45/70/50/60 | Primary: intimidate; Secondary: flash-fire; Hidden: justified |
| 59 | arcanine | 90/110/80/100/80/95 | Primary: intimidate; Secondary: flash-fire; Hidden: justified |
| 60 | poliwag | 40/50/40/40/40/90 | Primary: water-absorb; Secondary: damp; Hidden: swift-swim |
| 61 | poliwhirl | 65/65/65/50/50/90 | Primary: water-absorb; Secondary: damp; Hidden: swift-swim |
| 62 | poliwrath | 90/95/95/70/90/70 | Primary: water-absorb; Secondary: damp; Hidden: swift-swim |
| 63 | abra | 25/20/15/105/55/90 | Primary: synchronize; Secondary: inner-focus; Hidden: magic-guard |
| 64 | kadabra | 40/35/30/120/70/105 | Primary: synchronize; Secondary: inner-focus; Hidden: magic-guard |
| 65 | alakazam | 55/50/45/135/95/120 | Primary: synchronize; Secondary: inner-focus; Hidden: magic-guard |
| 66 | machop | 70/80/50/35/35/35 | Primary: guts; Secondary: no-guard; Hidden: steadfast |
| 67 | machoke | 80/100/70/50/60/45 | Primary: guts; Secondary: no-guard; Hidden: steadfast |
| 68 | machamp | 90/130/80/65/85/55 | Primary: guts; Secondary: no-guard; Hidden: steadfast |
| 69 | bellsprout | 50/75/35/70/30/40 | Primary: chlorophyll; Hidden: gluttony |
| 70 | weepinbell | 65/90/50/85/45/55 | Primary: chlorophyll; Hidden: gluttony |
| 71 | victreebel | 80/105/65/100/70/70 | Primary: chlorophyll; Hidden: gluttony |
| 72 | tentacool | 40/40/35/50/100/70 | Primary: clear-body; Secondary: liquid-ooze; Hidden: rain-dish |
| 73 | tentacruel | 80/70/65/80/120/100 | Primary: clear-body; Secondary: liquid-ooze; Hidden: rain-dish |
| 74 | geodude | 40/80/100/30/30/20 | Primary: rock-head; Secondary: sturdy; Hidden: sand-veil |
| 75 | graveler | 55/95/115/45/45/35 | Primary: rock-head; Secondary: sturdy; Hidden: sand-veil |
| 76 | golem | 80/120/130/55/65/45 | Primary: rock-head; Secondary: sturdy; Hidden: sand-veil |
| 77 | ponyta | 50/85/55/65/65/90 | Primary: run-away; Secondary: flash-fire; Hidden: flame-body |
| 78 | rapidash | 65/100/70/80/80/105 | Primary: run-away; Secondary: flash-fire; Hidden: flame-body |
| 79 | slowpoke | 90/65/65/40/40/15 | Primary: oblivious; Secondary: own-tempo; Hidden: regenerator |
| 80 | slowbro | 95/75/110/100/80/30 | Primary: oblivious; Secondary: own-tempo; Hidden: regenerator |
| 81 | magnemite | 25/35/70/95/55/45 | Primary: magnet-pull; Secondary: sturdy; Hidden: analytic |
| 82 | magneton | 50/60/95/120/70/70 | Primary: magnet-pull; Secondary: sturdy; Hidden: analytic |
| 83 | farfetchd | 52/90/55/58/62/60 | Primary: keen-eye; Secondary: inner-focus; Hidden: defiant |
| 84 | doduo | 35/85/45/35/35/75 | Primary: run-away; Secondary: early-bird; Hidden: tangled-feet |
| 85 | dodrio | 60/110/70/60/60/110 | Primary: run-away; Secondary: early-bird; Hidden: tangled-feet |
| 86 | seel | 65/45/55/45/70/45 | Primary: thick-fat; Secondary: hydration; Hidden: ice-body |
| 87 | dewgong | 90/70/80/70/95/70 | Primary: thick-fat; Secondary: hydration; Hidden: ice-body |
| 88 | grimer | 80/80/50/40/50/25 | Primary: stench; Secondary: sticky-hold; Hidden: poison-touch |
| 89 | muk | 105/105/75/65/100/50 | Primary: stench; Secondary: sticky-hold; Hidden: poison-touch |
| 90 | shellder | 30/65/100/45/25/40 | Primary: shell-armor; Secondary: skill-link; Hidden: overcoat |
| 91 | cloyster | 50/95/180/85/45/70 | Primary: shell-armor; Secondary: skill-link; Hidden: overcoat |
| 92 | gastly | 30/35/30/100/35/80 | Primary: levitate |
| 93 | haunter | 45/50/45/115/55/95 | Primary: levitate |
| 94 | gengar | 60/65/60/130/75/110 | Primary: cursed-body |
| 95 | onix | 35/45/160/30/45/70 | Primary: rock-head; Secondary: sturdy; Hidden: weak-armor |
| 96 | drowzee | 60/48/45/43/90/42 | Primary: insomnia; Secondary: forewarn; Hidden: inner-focus |
| 97 | hypno | 85/73/70/73/115/67 | Primary: insomnia; Secondary: forewarn; Hidden: inner-focus |
| 98 | krabby | 30/105/90/25/25/50 | Primary: hyper-cutter; Secondary: shell-armor; Hidden: sheer-force |
| 99 | kingler | 55/130/115/50/50/75 | Primary: hyper-cutter; Secondary: shell-armor; Hidden: sheer-force |
| 100 | voltorb | 40/30/50/55/55/100 | Primary: soundproof; Secondary: static; Hidden: aftermath |
| 101 | electrode | 60/50/70/80/80/150 | Primary: soundproof; Secondary: static; Hidden: aftermath |
| 102 | exeggcute | 60/40/80/60/45/40 | Primary: chlorophyll; Hidden: harvest |
| 103 | exeggutor | 95/95/85/125/75/55 | Primary: chlorophyll; Hidden: harvest |
| 104 | cubone | 50/50/95/40/50/35 | Primary: rock-head; Secondary: lightning-rod; Hidden: battle-armor |
| 105 | marowak | 60/80/110/50/80/45 | Primary: rock-head; Secondary: lightning-rod; Hidden: battle-armor |
| 106 | hitmonlee | 50/120/53/35/110/87 | Primary: limber; Secondary: reckless; Hidden: unburden |
| 107 | hitmonchan | 50/105/79/35/110/76 | Primary: keen-eye; Secondary: iron-fist; Hidden: inner-focus |
| 108 | lickitung | 90/55/75/60/75/30 | Primary: own-tempo; Secondary: oblivious; Hidden: cloud-nine |
| 109 | koffing | 40/65/95/60/45/35 | Primary: levitate; Secondary: neutralizing-gas; Hidden: stench |
| 110 | weezing | 65/90/120/85/70/60 | Primary: levitate; Secondary: neutralizing-gas; Hidden: stench |
| 111 | rhyhorn | 80/85/95/30/30/25 | Primary: lightning-rod; Secondary: rock-head; Hidden: reckless |
| 112 | rhydon | 105/130/120/45/45/40 | Primary: lightning-rod; Secondary: rock-head; Hidden: reckless |
| 113 | chansey | 250/5/5/35/105/50 | Primary: natural-cure; Secondary: serene-grace; Hidden: healer |
| 114 | tangela | 65/55/115/100/40/60 | Primary: chlorophyll; Secondary: leaf-guard; Hidden: regenerator |
| 115 | kangaskhan | 105/95/80/40/80/90 | Primary: early-bird; Secondary: scrappy; Hidden: inner-focus |
| 116 | horsea | 30/40/70/70/25/60 | Primary: swift-swim; Secondary: sniper; Hidden: damp |
| 117 | seadra | 55/65/95/95/45/85 | Primary: poison-point; Secondary: sniper; Hidden: damp |
| 118 | goldeen | 45/67/60/35/50/63 | Primary: swift-swim; Secondary: water-veil; Hidden: lightning-rod |
| 119 | seaking | 80/92/65/65/80/68 | Primary: swift-swim; Secondary: water-veil; Hidden: lightning-rod |
| 120 | staryu | 30/45/55/70/55/85 | Primary: illuminate; Secondary: natural-cure; Hidden: analytic |
| 121 | starmie | 60/75/85/100/85/115 | Primary: illuminate; Secondary: natural-cure; Hidden: analytic |
| 122 | mr-mime | 40/45/65/100/120/90 | Primary: soundproof; Secondary: filter; Hidden: technician |
| 123 | scyther | 70/110/80/55/80/105 | Primary: swarm; Secondary: technician; Hidden: steadfast |
| 124 | jynx | 65/50/35/115/95/95 | Primary: oblivious; Secondary: forewarn; Hidden: dry-skin |
| 125 | electabuzz | 65/83/57/95/85/105 | Primary: static; Hidden: vital-spirit |
| 126 | magmar | 65/95/57/100/85/93 | Primary: flame-body; Hidden: vital-spirit |
| 127 | pinsir | 65/125/100/55/70/85 | Primary: hyper-cutter; Secondary: mold-breaker; Hidden: moxie |
| 128 | tauros | 75/100/95/40/70/110 | Primary: intimidate; Secondary: anger-point; Hidden: sheer-force |
| 129 | magikarp | 20/10/55/15/20/80 | Primary: swift-swim; Hidden: rattled |
| 130 | gyarados | 95/125/79/60/100/81 | Primary: intimidate; Hidden: moxie |
| 131 | lapras | 130/85/80/85/95/60 | Primary: water-absorb; Secondary: shell-armor; Hidden: hydration |
| 132 | ditto | 48/48/48/48/48/48 | Primary: limber; Hidden: imposter |
| 133 | eevee | 55/55/50/45/65/55 | Primary: run-away; Secondary: adaptability; Hidden: anticipation |
| 134 | vaporeon | 130/65/60/110/95/65 | Primary: water-absorb; Hidden: hydration |
| 135 | jolteon | 65/65/60/110/95/130 | Primary: volt-absorb; Hidden: quick-feet |
| 136 | flareon | 65/130/60/95/110/65 | Primary: flash-fire; Hidden: guts |
| 137 | porygon | 65/60/70/85/75/40 | Primary: trace; Secondary: download; Hidden: analytic |
| 138 | omanyte | 35/40/100/90/55/35 | Primary: swift-swim; Secondary: shell-armor; Hidden: weak-armor |
| 139 | omastar | 70/60/125/115/70/55 | Primary: swift-swim; Secondary: shell-armor; Hidden: weak-armor |
| 140 | kabuto | 30/80/90/55/45/55 | Primary: swift-swim; Secondary: battle-armor; Hidden: weak-armor |
| 141 | kabutops | 60/115/105/65/70/80 | Primary: swift-swim; Secondary: battle-armor; Hidden: weak-armor |
| 142 | aerodactyl | 80/105/65/60/75/130 | Primary: rock-head; Secondary: pressure; Hidden: unnerve |
| 143 | snorlax | 160/110/65/65/110/30 | Primary: immunity; Secondary: thick-fat; Hidden: gluttony |
| 144 | articuno | 90/85/100/95/125/85 | Primary: pressure; Hidden: snow-cloak |
| 145 | zapdos | 90/90/85/125/90/100 | Primary: pressure; Hidden: static |
| 146 | moltres | 90/100/90/125/85/90 | Primary: pressure; Hidden: flame-body |
| 147 | dratini | 41/64/45/50/50/50 | Primary: shed-skin; Hidden: marvel-scale |
| 148 | dragonair | 61/84/65/70/70/70 | Primary: shed-skin; Hidden: marvel-scale |
| 149 | dragonite | 91/134/95/100/100/80 | Primary: inner-focus; Hidden: multiscale |
| 150 | mewtwo | 106/110/90/154/90/130 | Primary: pressure; Hidden: unnerve |
| 151 | mew | 100/100/100/100/100/100 | Primary: synchronize |

## Tiến độ thực hiện
- [x] Chuyển item registry và bổ sung đầy đủ `tm001`–`tm229` (giữ tương thích ngược legacy).
- [x] Thiết lập mô hình 3 slot Ability `PokemonSpeciesData.abilities` (`primary`, `secondary`, `hidden`) cho 151 Pokémon.
- [x] Tích hợp phân bổ Ability Slot trong Battle Factory (`createBattler`) và Party State (`partyPokemonToBattler`), bảo toàn sequence của `BattleRng`.
- [x] Thêm `teraType` vào species/party Pokémon và trạng thái Terastallized vào battle state/renderer/controller.
- [x] Cập nhật damage/type calculation cho Tera Blast (đổi hệ, đổi Category physical nếu Atk > SpAtk) và STAB Terastal (2.0x / 1.5x, phòng thủ đơn hệ).
- [x] Kiểm thử toàn diện 11 test case xác thực trong `test/gen9-mechanics.test.ts` (toàn bộ test suite 46 files / 542 tests pass 100%).
- [x] Chuẩn hóa toàn bộ CI pipeline (`npm run ci`): Lint sạch 0 errors/0 warnings, Prettier 100%, Typecheck sạch, và Build tối ưu chunk size < 500 kB.
- [ ] TM Machine crafting recipe, LP và Pokémon material (chưa yêu cầu trong giai đoạn này).

## Nguồn dữ liệu

- [Pokémon Database — Scarlet/Violet TMs](https://pokemondb.net/scarlet-violet/tms)
- [Pokémon Database — Gen 9 learnset](https://pokemondb.net/pokedex/all)
- [PokeAPI data CSV](https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv) dùng để tổng hợp machine, move stats, base stats và Ability slots.
- [Local move database](../packages/game-data/moves-db.json) dùng để bổ sung tên tiếng Việt khi đã có trong dự án.
