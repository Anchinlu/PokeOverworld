import fs from 'node:fs';
const file = 'packages/game-data/moves-db.json';
const database = JSON.parse(fs.readFileSync(file, 'utf8'));
const translations = {
  light_of_ruin: 'Người dùng chịu sát thương phản lực.',
  light_screen: 'Giảm một nửa sát thương Đặc biệt trong 5 lượt.',
  light_that_burns_the_sky:
    'Chiêu Z độc quyền của Ultra Necrozma. Bỏ qua Ability của mục tiêu và dùng chỉ số Tấn công cao nhất.',
  lock_on: 'Đòn tấn công tiếp theo của người dùng chắc chắn đánh trúng.',
  low_kick: 'Đối thủ càng nặng thì đòn đánh càng mạnh.',
  lucky_chant: 'Đối thủ không thể ra đòn chí mạng trong 5 lượt.',
  lumina_crash: 'Hạ mạnh Phòng thủ đặc biệt của mục tiêu.',
  lunar_blessing: 'Chữa trạng thái bất lợi và hồi HP cho người dùng.',
  lunar_dance: 'Người dùng bị ngất nhưng Pokémon tiếp theo được đưa ra sẽ hồi phục hoàn toàn.',
  lunge: 'Lao mạnh vào mục tiêu và đồng thời hạ chỉ số Tấn công của mục tiêu.',
  magic_coat: 'Phản lại các chiêu gây trạng thái bất lợi về phía người tấn công.',
  magic_powder: 'Đổi hệ của mục tiêu thành hệ Tâm linh.',
  magic_room: 'Vô hiệu hiệu ứng vật phẩm cầm tay trong 5 lượt.',
  magical_leaf: 'Bỏ qua Độ chính xác và Né tránh.',
  magical_torque: 'Có thể khiến đối thủ bối rối.',
  magma_storm: 'Giam giữ đối thủ và gây sát thương trong 4–5 lượt.',
  magnet_bomb: 'Bỏ qua Độ chính xác và Né tránh.',
  magnet_rise: 'Miễn nhiễm với các chiêu hệ Đất trong 5 lượt.',
  magnetic_flux: 'Tăng Phòng thủ và Phòng thủ đặc biệt của Pokémon có Ability Plus hoặc Minus.',
  magnitude: 'Tấn công với uy lực ngẫu nhiên.',
  make_it_rain: 'Hạ Công đặc biệt của người dùng. Nhận thêm tiền sau trận đấu.',
  malicious_moonsault: 'Chiêu Z độc quyền của Incineroar.',
  malignant_chain: 'Có thể đầu độc đối thủ.',
  mat_block: 'Bảo vệ đồng đội khỏi các chiêu gây sát thương.',
  matcha_gotcha: 'Gây sát thương, hồi HP và có thể làm đối thủ bị bỏng.',
  max_airstream: 'Chiêu Dynamax hệ Bay. Tăng Tốc độ cho cả đội.',
  max_darkness: 'Chiêu Dynamax hệ Bóng tối. Hạ Phòng thủ đặc biệt của mục tiêu.',
  max_flare: 'Chiêu Dynamax hệ Lửa. Tạo nắng gắt.',
  max_flutterby: 'Chiêu Dynamax hệ Bọ. Hạ Công đặc biệt của mục tiêu.',
  max_geyser: 'Chiêu Dynamax hệ Nước. Gọi mưa lớn.',
  max_guard: 'Chiêu Dynamax nhóm Trạng thái. Bảo vệ người dùng.',
  max_hailstorm: 'Chiêu Dynamax hệ Băng. Gọi mưa đá.',
  max_knuckle: 'Chiêu Dynamax hệ Giác đấu. Tăng Tấn công cho cả đội.',
  max_lightning: 'Chiêu Dynamax hệ Điện. Tạo Địa hình Điện.',
  max_mindstorm: 'Chiêu Dynamax hệ Tâm linh. Tạo Địa hình Tâm linh.',
  max_ooze: 'Chiêu Dynamax hệ Độc. Tăng Công đặc biệt cho cả đội.',
  max_overgrowth: 'Chiêu Dynamax hệ Cỏ. Tạo Địa hình Thảm Cỏ.',
  max_phantasm: 'Chiêu Dynamax hệ Ma. Hạ Phòng thủ của mục tiêu.',
  max_quake: 'Chiêu Dynamax hệ Đất. Tăng Phòng thủ đặc biệt cho cả đội.',
  max_rockfall: 'Chiêu Dynamax hệ Đá. Gọi bão cát.',
  max_starfall: 'Chiêu Dynamax hệ Tiên. Tạo Địa hình Sương Mù.',
  max_steelspike: 'Chiêu Dynamax hệ Thép. Tăng Phòng thủ cho cả đội.',
  max_strike: 'Chiêu Dynamax hệ Thường. Hạ Tốc độ của mục tiêu.',
  max_wyrmwind: 'Chiêu Dynamax hệ Rồng. Hạ Tấn công của mục tiêu.',
  me_first: 'Sao chép đòn tấn công của đối thủ với uy lực gấp 1,5 lần.',
  mean_look: 'Đối thủ không thể bỏ chạy hoặc đổi Pokémon.',
  memento: 'Người dùng bị ngất, đồng thời hạ mạnh Tấn công và Công đặc biệt của đối thủ.',
  menacing_moonraze_maelstrom: 'Chiêu Z độc quyền của Lunala.',
  metal_burst: 'Gây sát thương bằng 1,5 lần sát thương đối thủ vừa gây ra.',
  meteor_assault: 'Người dùng phải nạp lại năng lượng ở lượt tiếp theo.',
  meteor_beam: 'Tập trung năng lượng vũ trụ để tăng Công đặc biệt, rồi tấn công ở lượt tiếp theo.',
  metronome: 'Ngẫu nhiên sử dụng gần như bất kỳ chiêu nào trong game.',
  milk_drink: 'Người dùng hồi một nửa HP tối đa.',
  mimic: 'Sao chép chiêu cuối mà đối thủ đã sử dụng.',
  mind_blown: 'Người dùng chịu sát thương phản lực.',
  mind_reader: 'Đòn tấn công tiếp theo của người dùng chắc chắn đánh trúng.',
  miracle_eye: 'Đặt lại Né tránh của đối thủ và loại bỏ miễn nhiễm Tâm linh của hệ Bóng tối.',
  mirror_coat: 'Khi bị đòn Đặc biệt đánh trúng, phản công với uy lực gấp đôi.',
  mirror_move: 'Người dùng sử dụng chiêu cuối mà đối thủ đã dùng.',
  mirror_shot: 'Có thể hạ Độ chính xác của đối thủ.',
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
