import fs from 'node:fs';
const file = 'packages/game-data/moves-db.json';
const database = JSON.parse(fs.readFileSync(file, 'utf8'));
const translations = {
  mist: 'Ngăn chỉ số của người dùng bị thay đổi trong một khoảng thời gian.',
  misty_explosion: 'Uy lực tăng trên Địa hình Sương Mù.',
  misty_terrain: 'Bảo vệ sân khỏi trạng thái bất lợi trong 5 lượt.',
  moongeist_beam: 'Bỏ qua Ability của mục tiêu.',
  moonlight: 'Hồi HP cho người dùng. Lượng hồi thay đổi tùy thời tiết.',
  morning_sun: 'Hồi HP cho người dùng. Lượng hồi thay đổi tùy thời tiết.',
  mortal_spin: 'Loại bỏ bẫy sân và hiệu ứng chiêu trói, đồng thời đầu độc các Pokémon đối phương.',
  mountain_gale: 'Hạ Tốc độ của người dùng.',
  mud_bomb: 'Có thể hạ Độ chính xác của đối thủ.',
  mud_sport: 'Làm giảm uy lực của các chiêu hệ Điện.',
  mud_slap: 'Hạ Độ chính xác của đối thủ.',
  muddy_water: 'Có thể hạ Độ chính xác của đối thủ.',
  multi_attack: 'Hệ trùng với Memory mà người dùng đang cầm.',
  natural_gift: 'Uy lực và hệ phụ thuộc vào Berry mà người dùng đang cầm.',
  nature_power: 'Sử dụng một chiêu nhất định tùy theo Địa hình hiện tại.',
  natures_madness: 'Giảm một nửa HP của đối thủ.',
  never_ending_nightmare: 'Chiêu Z hệ Ma.',
  night_daze: 'Có thể hạ Độ chính xác của đối thủ.',
  night_shade: 'Gây sát thương bằng cấp độ của người dùng.',
  nightmare: 'Đối thủ đang ngủ mất 25% HP tối đa mỗi lượt.',
  no_retreat: 'Tăng tất cả chỉ số nhưng người dùng không thể đổi Pokémon.',
  noble_roar: 'Hạ Tấn công và Công đặc biệt của đối thủ.',
  noxious_torque: 'Có thể đầu độc đối thủ.',
  oblivion_wing: 'Người dùng hồi phần lớn HP đã gây sát thương cho đối thủ.',
  obstruct: 'Bảo vệ người dùng và hạ mạnh Phòng thủ của đối thủ khi tiếp xúc.',
  oceanic_operetta: 'Chiêu Z độc quyền của Primarina.',
  octazooka: 'Có thể hạ Độ chính xác của đối thủ.',
  octolock:
    'Hạ Phòng thủ và Phòng thủ đặc biệt của đối thủ mỗi lượt, đồng thời ngăn đối thủ bỏ chạy hoặc đổi Pokémon.',
  odor_sleuth:
    'Đặt lại Né tránh của đối thủ và cho phép đòn hệ Thường, Giác đấu đánh trúng Pokémon hệ Ma.',
  origin_pulse: 'Tấn công tất cả đối thủ ở gần.',
  outrage: 'Tấn công trong 2–3 lượt rồi khiến người dùng bối rối.',
  overdrive: 'Tấn công tất cả đối thủ ở gần.',
  overheat: 'Hạ mạnh Công đặc biệt của người dùng.',
  pain_split: 'HP của người dùng và đối thủ trở thành giá trị trung bình của cả hai.',
  parting_shot: 'Hạ Tấn công và Công đặc biệt của đối thủ rồi rút người dùng khỏi trận.',
  pay_day: 'Nhận tiền sau trận đấu.',
  payback: 'Uy lực tăng gấp đôi nếu người dùng bị tấn công trước.',
  perish_song: 'Mọi Pokémon đang có mặt khi chiêu được dùng sẽ bị ngất sau 3 lượt.',
  petal_blizzard: 'Tấn công tất cả Pokémon ở gần.',
  petal_dance: 'Tấn công trong 2–3 lượt rồi khiến người dùng bối rối.',
  phantom_force:
    'Biến mất ở lượt đầu và tấn công ở lượt thứ hai. Có thể đánh xuyên Protect và Detect.',
  photon_geyser: 'Dùng chỉ số Tấn công hoặc Công đặc biệt cao hơn để tính sát thương.',
  pika_papow: 'Uy lực tăng khi mối liên kết với người chơi mạnh hơn.',
  plasma_fists: 'Biến các chiêu hệ Thường thành chiêu hệ Điện.',
  play_nice: 'Hạ Tấn công của đối thủ. Luôn đánh trúng.',
  pluck: 'Nếu đối thủ đang cầm Berry, người dùng lấy và nhận hiệu ứng của Berry đó.',
  poison_fang: 'Có thể khiến đối thủ bị nhiễm độc nặng.',
  poison_jab: 'Có thể đầu độc đối thủ.',
  poison_sting: 'Có thể đầu độc đối thủ.',
  pollen_puff: 'Gây sát thương cho đối thủ hoặc hồi HP cho đồng đội.',
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
