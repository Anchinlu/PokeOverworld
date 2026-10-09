import fs from 'node:fs';
const file = 'packages/game-data/moves-db.json';
const database = JSON.parse(fs.readFileSync(file, 'utf8'));
const translations = {
  geomancy:
    'Tập trung năng lượng ở lượt đầu, rồi tăng mạnh Tấn công, Công đặc biệt, Phòng thủ đặc biệt và Tốc độ ở lượt thứ hai.',
  giga_impact: 'Người dùng phải nạp lại năng lượng ở lượt tiếp theo.',
  gigaton_hammer: 'Không thể sử dụng hai lượt liên tiếp.',
  gigavolt_havoc: 'Chiêu Z hệ Điện.',
  glacial_lance: 'Ném một ngọn thương băng phủ đầy bão tuyết vào đối thủ.',
  glaive_rush:
    'Các đòn tấn công của đối thủ trong lượt tiếp theo không thể trượt và gây sát thương gấp đôi.',
  glitzy_glow: 'Giảm sát thương từ các đòn Đặc biệt.',
  grass_knot: 'Đối thủ càng nặng thì đòn đánh càng mạnh.',
  grass_pledge: 'Có hiệu ứng bổ sung nếu được dùng sau Water Pledge hoặc trước Fire Pledge.',
  grassy_glide: 'Có độ ưu tiên cao khi Địa hình Thảm Cỏ đang hoạt động.',
  grassy_terrain: 'Hồi một lượng nhỏ HP cho mọi Pokémon trong 5 lượt.',
  grav_apple: 'Hạ chỉ số Phòng thủ của đối thủ.',
  gravity: 'Ngăn các chiêu như Fly và Bounce, đồng thời vô hiệu Levitate trong 5 lượt.',
  growth: 'Tăng Tấn công và Công đặc biệt của người dùng.',
  grudge:
    'Nếu người dùng bị ngất sau khi dùng chiêu, PP của chiêu cuối mà đối thủ sử dụng sẽ bị giảm hết.',
  guard_split: 'Lấy trung bình chỉ số Phòng thủ và Phòng thủ đặc biệt của người dùng và mục tiêu.',
  guard_swap: 'Hoán đổi Phòng thủ và Phòng thủ đặc biệt của người dùng với đối thủ.',
  guardian_of_alola: 'Chiêu Z độc quyền của Tapu. Giảm 75% HP của đối thủ.',
  guillotine: 'Nếu đánh trúng, hạ gục đối thủ ngay lập tức.',
  gust: 'Đánh Pokémon đang dùng Fly, Bounce hoặc Sky Drop với uy lực gấp đôi.',
  gyro_ball: 'Người dùng càng chậm thì đòn đánh càng mạnh.',
  hail: 'Gây sát thương cho các hệ không phải Băng trong 5 lượt.',
  hammer_arm: 'Hạ Tốc độ của người dùng.',
  happy_hour: 'Tăng gấp đôi tiền thưởng từ các trận đấu với Huấn luyện viên.',
  haze: 'Đặt lại mọi thay đổi chỉ số.',
  head_charge: 'Người dùng chịu sát thương phản lực.',
  head_smash: 'Người dùng chịu sát thương phản lực.',
  headlong_rush: 'Hạ Phòng thủ của người dùng.',
  heal_bell: 'Chữa trạng thái bất lợi cho cả đội của người dùng.',
  heal_block: 'Ngăn đối thủ hồi HP trong 5 lượt.',
  heal_order: 'Người dùng hồi một nửa HP tối đa.',
  heal_pulse: 'Hồi một nửa HP tối đa của mục tiêu.',
  healing_wish: 'Người dùng bị ngất và Pokémon tiếp theo được đưa ra sẽ được hồi phục hoàn toàn.',
  heart_swap: 'Hoán đổi các thay đổi chỉ số với đối thủ.',
  heat_crash: 'Người dùng càng nặng thì đòn đánh càng mạnh.',
  heavy_slam: 'Người dùng càng nặng thì đòn đánh càng mạnh.',
  helping_hand: 'Trong Double Battle, tăng uy lực chiêu thức của đồng đội.',
  hex: 'Gây nhiều sát thương hơn nếu mục tiêu đang mắc trạng thái bất lợi.',
  hidden_power: 'Hệ và uy lực phụ thuộc vào IV của người dùng.',
  high_horsepower: 'Dùng toàn bộ cơ thể để tấn công mục tiêu thật mạnh.',
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
