import fs from 'node:fs';
const file = 'packages/game-data/moves-db.json';
const database = JSON.parse(fs.readFileSync(file, 'utf8'));
const translations = {
  g_max_cannonade:
    'Chiêu G-Max độc quyền của Blastoise. Gây sát thương cho các hệ không phải Nước trong 4 lượt.',
  g_max_centiferno: 'Chiêu G-Max độc quyền của Centiskorch. Giam giữ đối thủ trong 4–5 lượt.',
  g_max_chi_strike: 'Chiêu G-Max độc quyền của Machamp. Tăng tỷ lệ ra đòn chí mạng.',
  g_max_cuddle: 'Chiêu G-Max độc quyền của Eevee. Khiến đối thủ mê hoặc.',
  g_max_depletion: 'Chiêu G-Max độc quyền của Duraludon. Giảm PP của đối thủ.',
  g_max_drum_solo: 'Chiêu G-Max độc quyền của Rillaboom. Bỏ qua Ability của mục tiêu.',
  g_max_finale: 'Chiêu G-Max độc quyền của Alcremie. Hồi HP cho cả đội của người dùng.',
  g_max_fireball: 'Chiêu G-Max độc quyền của Cinderace. Bỏ qua Ability của mục tiêu.',
  g_max_foam_burst: 'Chiêu G-Max độc quyền của Kingler. Hạ mạnh Tốc độ của các đối thủ.',
  g_max_gold_rush: 'Chiêu G-Max độc quyền của Meowth. Khiến đối thủ bối rối và kiếm thêm tiền.',
  g_max_gravitas: 'Chiêu G-Max độc quyền của Orbeetle. Tạo Trọng lực trong 5 lượt.',
  g_max_hydrosnipe: 'Chiêu G-Max độc quyền của Inteleon. Bỏ qua Ability của mục tiêu.',
  g_max_malodor: 'Chiêu G-Max độc quyền của Garbodor. Đầu độc các đối thủ.',
  g_max_meltdown:
    'Chiêu G-Max độc quyền của Melmetal. Ngăn đối thủ dùng cùng một chiêu hai lần liên tiếp.',
  g_max_one_blow:
    'Chiêu G-Max độc quyền của Urshifu Bách Nhất Kích. Đánh xuyên Max Guard và Protect.',
  g_max_rapid_flow:
    'Chiêu G-Max độc quyền của Urshifu Liên Kích Lưu. Đánh xuyên Max Guard và Protect.',
  g_max_replenish: 'Chiêu G-Max độc quyền của Snorlax. Tái sử dụng Berry.',
  g_max_resonance: 'Chiêu G-Max độc quyền của Lapras. Giảm sát thương trong 5 lượt.',
  g_max_sandblast: 'Chiêu G-Max độc quyền của Sandaconda. Giam giữ đối thủ trong 4–5 lượt.',
  g_max_smite: 'Chiêu G-Max độc quyền của Hatterene. Khiến các đối thủ bối rối.',
  g_max_snooze: 'Chiêu G-Max độc quyền của Grimmsnarl. Khiến các đối thủ buồn ngủ.',
  g_max_steelsurge: 'Chiêu G-Max độc quyền của Copperajah. Thiết lập bẫy Spikes trên sân.',
  g_max_stonesurge: 'Chiêu G-Max độc quyền của Drednaw. Thiết lập bẫy Stealth Rock.',
  g_max_stun_shock: 'Chiêu G-Max độc quyền của Toxtricity. Đầu độc hoặc gây tê liệt các đối thủ.',
  g_max_sweetness:
    'Chiêu G-Max độc quyền của Appletun. Chữa trạng thái bất lợi cho cả đội của người dùng.',
  g_max_tartness: 'Chiêu G-Max độc quyền của Flapple. Giảm Né tránh của các đối thủ.',
  g_max_terror: 'Chiêu G-Max độc quyền của Gengar. Ngăn đối thủ rút khỏi trận.',
  g_max_vine_lash:
    'Chiêu G-Max độc quyền của Venusaur. Gây sát thương cho các hệ không phải Cỏ trong 4 lượt.',
  g_max_volcalith: 'Chiêu G-Max độc quyền của Coalossal. Gây sát thương trong 4 lượt.',
  g_max_volt_crash: 'Chiêu G-Max độc quyền của Pikachu. Gây tê liệt các đối thủ.',
  g_max_wildfire:
    'Chiêu G-Max độc quyền của Charizard. Gây sát thương cho các hệ không phải Lửa trong 4 lượt.',
  g_max_wind_rage: 'Chiêu G-Max độc quyền của Corviknight. Loại bỏ các bẫy trên sân.',
  gastro_acid: 'Vô hiệu hóa Ability của đối thủ.',
  gear_up:
    'Người dùng vận hành bánh răng để tăng Tấn công và Công đặc biệt của đồng đội có Ability Plus hoặc Minus.',
  genesis_supernova: 'Chiêu Z độc quyền của Mew.',
};
let updated = 0;
for (const [id, descriptionVi] of Object.entries(translations)) {
  if (database.moves?.[id] && !database.moves[id].descriptionVi) {
    database.moves[id].descriptionVi = descriptionVi;
    updated++;
  }
}
fs.writeFileSync(file, `${JSON.stringify(database, null, 2)}\n`, 'utf8');
console.log(`Updated offline Vietnamese descriptions: ${updated}`);
