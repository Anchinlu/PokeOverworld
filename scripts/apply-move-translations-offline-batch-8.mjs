import fs from 'node:fs';
const file = 'packages/game-data/moves-db.json';
const database = JSON.parse(fs.readFileSync(file, 'utf8'));
const translations = {
  poltergeist: 'Thất bại nếu mục tiêu không cầm vật phẩm.',
  population_bomb: 'Đánh liên tiếp từ 1 đến 10 lần.',
  powder: 'Gây sát thương cho Pokémon sử dụng chiêu hệ Lửa.',
  power_split: 'Lấy trung bình Tấn công và Công đặc biệt của người dùng và mục tiêu.',
  power_swap: 'Hoán đổi Tấn công và Công đặc biệt của người dùng với đối thủ.',
  power_trick: 'Hoán đổi Tấn công và Phòng thủ của người dùng.',
  power_trip: 'Uy lực tăng theo số bậc chỉ số của người dùng đã được tăng.',
  power_up_punch: 'Tăng Tấn công.',
  precipice_blades: 'Tấn công tất cả đối thủ ở gần.',
  present: 'Có thể gây sát thương hoặc hồi HP.',
  prismatic_laser:
    'Bắn tia laser mạnh bằng năng lượng lăng kính. Người dùng không thể hành động ở lượt tiếp theo.',
  psyblade: 'Uy lực tăng trên Địa hình Điện.',
  psych_up: 'Sao chép các thay đổi chỉ số của đối thủ.',
  psychic_fangs:
    'Cắn mục tiêu bằng năng lực Tâm linh, đồng thời có thể phá Light Screen và Reflect.',
  psychic_noise: 'Gây sát thương và ngăn mục tiêu hồi HP.',
  psychic_terrain: 'Ngăn sử dụng các chiêu có độ ưu tiên trong 5 lượt.',
  psycho_boost: 'Hạ mạnh Công đặc biệt của người dùng.',
  psycho_shift: 'Chuyển trạng thái bất lợi của người dùng sang đối thủ.',
  psyshield_bash: 'Tăng Phòng thủ và Phòng thủ đặc biệt của người dùng.',
  psyshock: 'Gây sát thương dựa trên Phòng thủ của mục tiêu thay vì Phòng thủ đặc biệt.',
  psystrike: 'Gây sát thương dựa trên Phòng thủ của mục tiêu thay vì Phòng thủ đặc biệt.',
  psywave: 'Gây sát thương bằng 50–150% cấp độ của người dùng.',
  pulverizing_pancake: 'Chiêu Z hệ Thường độc quyền của Snorlax.',
  punishment: 'Uy lực tăng khi chỉ số của đối thủ đã được tăng.',
  purify: 'Chữa trạng thái bất lợi của mục tiêu. Nếu thành công, người dùng cũng hồi HP.',
  pursuit: 'Uy lực tăng gấp đôi nếu đối thủ đang đổi Pokémon.',
  quash: 'Buộc mục tiêu hành động cuối cùng trong lượt này.',
  quick_guard: 'Bảo vệ cả đội của người dùng khỏi các chiêu có độ ưu tiên cao.',
  rage: 'Tăng Tấn công của người dùng khi bị đánh trúng.',
  rage_fist: 'Người dùng càng bị đánh trúng nhiều lần thì chiêu càng mạnh.',
  rage_powder: 'Buộc các đòn tấn công nhắm vào người dùng thay vì đồng đội.',
  raging_bull: 'Hệ phụ thuộc vào hình dạng của người dùng. Phá vỡ Reflect và Light Screen.',
  raging_fury: 'Tấn công trong 2–3 lượt rồi khiến người dùng bối rối.',
  rain_dance: 'Tạo mưa trong 5 lượt.',
  rapid_spin: 'Tăng Tốc độ, đồng thời loại bỏ bẫy sân và hiệu ứng chiêu trói của người dùng.',
  recycle: 'Khôi phục vật phẩm mà người dùng đã sử dụng.',
  reflect: 'Giảm một nửa sát thương Vật lý trong 5 lượt.',
  reflect_type: 'Đổi hệ của người dùng thành hệ của mục tiêu.',
  refresh: 'Chữa tê liệt, độc và bỏng.',
  relic_song: 'Có thể khiến mục tiêu ngủ.',
  retaliate: 'Gây sát thương gấp đôi nếu đồng đội bị ngất ở lượt trước.',
  return: 'Uy lực tăng khi Độ thân thiết cao hơn.',
  revelation_dance: 'Hệ thay đổi tùy theo hình dạng của Oricorio.',
  revenge: 'Uy lực tăng nếu người dùng bị đánh trúng trước.',
  reversal: 'HP của người dùng càng thấp thì uy lực càng cao.',
  revival_blessing: 'Hồi sinh một Pokémon trong đội với một nửa HP.',
  rising_voltage: 'Uy lực tăng gấp đôi trên Địa hình Điện.',
  roar: 'Trong trận, buộc đối thủ đổi Pokémon. Ngoài tự nhiên, Pokémon sẽ bỏ chạy.',
  roar_of_time: 'Người dùng phải nạp lại năng lượng ở lượt tiếp theo.',
  rock_wrecker: 'Người dùng phải nạp lại năng lượng ở lượt tiếp theo.',
  role_play: 'Sao chép Ability của đối thủ.',
  rollout: 'Uy lực tăng gấp đôi sau mỗi lượt trong 5 lượt.',
  rototiller: 'Tăng Tấn công và Công đặc biệt của các Pokémon hệ Cỏ.',
  round: 'Uy lực tăng nếu đồng đội cũng sử dụng chiêu này trong cùng lượt.',
  ruination: 'Giảm một nửa HP của đối thủ.',
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
