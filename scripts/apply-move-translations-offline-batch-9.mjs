import fs from 'node:fs';
const file = 'packages/game-data/moves-db.json';
const database = JSON.parse(fs.readFileSync(file, 'utf8'));
const translations = {
  safeguard: 'Bảo vệ cả đội của người dùng khỏi trạng thái bất lợi.',
  salt_cure: 'Gây sát thương mỗi lượt; Pokémon hệ Thép và Nước chịu ảnh hưởng nặng hơn.',
  sand_attack: 'Hạ Độ chính xác của đối thủ.',
  sand_tomb: 'Giam giữ đối thủ và gây sát thương trong 4–5 lượt.',
  sandsear_storm: 'Có thể làm mục tiêu bị bỏng.',
  sandstorm: 'Tạo bão cát trong 5 lượt.',
  sappy_seed: 'Hút HP của đối thủ vào cuối mỗi lượt.',
  savage_spin_out: 'Chiêu Z hệ Bọ.',
  scale_shot:
    'Tấn công liên tiếp từ 2 đến 5 lần trong một lượt. Tăng Tốc độ nhưng hạ Phòng thủ của người dùng.',
  scorching_sands: 'Có thể làm mục tiêu bị bỏng.',
  searing_sunraze_smash: 'Chiêu Z độc quyền của Solgaleo.',
  secret_power: 'Hiệu ứng của đòn đánh thay đổi tùy theo địa điểm.',
  secret_sword: 'Gây sát thương dựa trên Phòng thủ của mục tiêu thay vì Phòng thủ đặc biệt.',
  seismic_toss: 'Gây sát thương bằng cấp độ của người dùng.',
  shadow_force:
    'Biến mất ở lượt đầu và tấn công ở lượt thứ hai. Có thể đánh xuyên Protect và Detect.',
  shadow_punch: 'Bỏ qua Độ chính xác và Né tránh.',
  shattered_psyche: 'Chiêu Z hệ Tâm linh.',
  sheer_cold: 'Nếu đánh trúng, hạ gục đối thủ ngay lập tức.',
  shell_side_arm: 'Có thể đầu độc đối thủ. Gây sát thương Vật lý hoặc Đặc biệt tùy loại mạnh hơn.',
  shell_smash:
    'Tăng mạnh Tấn công, Công đặc biệt và Tốc độ nhưng hạ Phòng thủ và Phòng thủ đặc biệt.',
  shell_trap: 'Gây nhiều sát thương hơn nếu đối thủ đánh trúng người dùng bằng đòn Vật lý.',
  shift_gear: 'Tăng Tấn công và tăng mạnh Tốc độ của người dùng.',
  shock_wave: 'Bỏ qua Độ chính xác và Né tránh.',
  shore_up: 'Hồi tối đa một nửa HP. Hồi nhiều hơn trong bão cát.',
  silk_trap: 'Bảo vệ người dùng và hạ Tốc độ của đối thủ khi đối thủ tiếp xúc.',
  silver_wind: 'Có thể tăng tất cả chỉ số của người dùng cùng lúc.',
  simple_beam: 'Đổi Ability của mục tiêu thành Simple.',
  sinister_arrow_raid: 'Chiêu Z độc quyền của Decidueye.',
  sizzly_slide: 'Làm đối thủ bị bỏng.',
  sketch: 'Sao chép vĩnh viễn chiêu cuối của đối thủ.',
  skill_swap: 'Hoán đổi Ability của người dùng với đối thủ.',
  skull_bash: 'Tăng Phòng thủ ở lượt đầu và tấn công ở lượt thứ hai.',
  sky_drop: 'Đưa đối thủ lên không trung ở lượt đầu rồi thả xuống ở lượt thứ hai.',
  sky_uppercut: 'Đánh trúng đối thủ ngay cả khi đối thủ đang dùng Fly.',
  slack_off: 'Người dùng hồi một nửa HP tối đa.',
  sleep_talk: 'Khi đang ngủ, người dùng ngẫu nhiên sử dụng một trong các chiêu của mình.',
  smack_down: 'Khiến Pokémon hệ Bay có thể bị các chiêu hệ Đất đánh trúng.',
  smart_strike: 'Đâm mục tiêu bằng chiếc sừng sắc nhọn. Đòn đánh này không bao giờ trượt.',
  smelling_salts: 'Uy lực tăng gấp đôi nếu đối thủ bị tê liệt nhưng sẽ chữa tê liệt cho đối thủ.',
  smokescreen: 'Hạ Độ chính xác của đối thủ.',
  snap_trap: 'Giam giữ đối thủ và gây sát thương trong 4–5 lượt.',
  snatch: 'Đánh cắp hiệu ứng của chiêu tiếp theo mà đối thủ sử dụng.',
  snowscape: 'Tăng Phòng thủ của Pokémon hệ Băng trong 5 lượt.',
  soak: 'Đổi hệ của mục tiêu thành hệ Nước.',
  sonic_boom: 'Luôn gây 20 HP sát thương.',
  soul_stealing_7_star_strike: 'Chiêu Z độc quyền của Marshadow.',
  sparkling_aria: 'Chữa bỏng cho mục tiêu.',
  sparkly_swirl: 'Chữa mọi trạng thái bất lợi cho Pokémon trong đội.',
  spectral_thief: 'Ẩn trong bóng của mục tiêu, đánh cắp các chỉ số đã tăng rồi tấn công.',
  speed_swap: 'Hoán đổi chỉ số Tốc độ của người dùng với mục tiêu.',
  spicy_extract: 'Hạ mạnh Phòng thủ của đối thủ và tăng mạnh Tấn công của đối thủ.',
  spider_web: 'Đối thủ không thể bỏ chạy hoặc đổi Pokémon.',
  spikes: 'Gây sát thương cho đối thủ khi chúng vào sân.',
  spiky_shield: 'Bảo vệ người dùng và gây sát thương khi đối thủ tiếp xúc.',
  spin_out: 'Hạ mạnh Tốc độ của người dùng.',
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
