import fs from 'node:fs';
const file = 'packages/game-data/moves-db.json';
const database = JSON.parse(fs.readFileSync(file, 'utf8'));
const translations = {
  spirit_shackle: 'Ngăn đối thủ đổi Pokémon.',
  spit_up: 'Uy lực phụ thuộc vào số lần người dùng đã dùng Stockpile.',
  spite: 'Chiêu cuối của đối thủ mất từ 2 đến 5 PP.',
  splash: 'Không có tác dụng gì.',
  splintered_stormshards: 'Chiêu Z độc quyền của Lycanroc.',
  spotlight: 'Chiếu đèn vào mục tiêu để mọi đòn đánh trong lượt chỉ nhắm vào mục tiêu đó.',
  springtide_storm: 'Tăng chỉ số của dạng Incarnate hoặc hạ chỉ số của đối thủ ở dạng Therian.',
  stealth_rock: 'Gây sát thương cho đối thủ khi vào sân.',
  steel_beam: 'Người dùng mất 50% HP.',
  steel_roller: 'Thất bại nếu không có Địa hình nào đang hoạt động.',
  sticky_web: 'Hạ Tốc độ của đối thủ khi chúng vào sân.',
  stockpile: 'Tích trữ năng lượng để dùng với Spit Up và Swallow.',
  stoked_sparksurfer: 'Chiêu Z hệ Điện độc quyền của Alolan Raichu.',
  stomping_tantrum:
    'Tấn công mục tiêu vì tức giận. Nếu chiêu trước đó của người dùng thất bại, uy lực tăng gấp đôi.',
  stone_axe: 'Thiết lập bẫy Stealth Rock.',
  stored_power: 'Uy lực tăng khi các chỉ số của người dùng đã được tăng.',
  strength_sap: 'Hồi HP bằng chỉ số Tấn công của mục tiêu, đồng thời hạ Tấn công của mục tiêu.',
  struggle: 'Chỉ dùng được khi tất cả PP đã hết. Gây sát thương cho người dùng.',
  stuff_cheeks: 'Ăn Berry đang cầm rồi tăng mạnh Phòng thủ.',
  submission: 'Người dùng chịu sát thương phản lực.',
  subzero_slammer: 'Chiêu Z hệ Băng.',
  sucker_punch: 'Tấn công trước nhưng chỉ hiệu quả nếu đối thủ đang chuẩn bị tấn công.',
  sunny_day: 'Tạo nắng trong 5 lượt.',
  sunsteel_strike: 'Bỏ qua Ability của mục tiêu.',
  super_fang: 'Luôn lấy đi một nửa HP của đối thủ.',
  superpower: 'Hạ Tấn công và Phòng thủ của người dùng.',
  supersonic_skystrike: 'Chiêu Z hệ Bay.',
  surf: 'Tấn công tất cả Pokémon ở gần.',
  surging_strikes: 'Luôn là đòn chí mạng và bỏ qua thay đổi chỉ số.',
  swagger: 'Khiến đối thủ bối rối nhưng tăng mạnh Tấn công của đối thủ.',
  swallow: 'Người dùng càng dùng Stockpile nhiều lần thì càng hồi nhiều HP.',
  swift: 'Bỏ qua Độ chính xác và Né tránh.',
  switcheroo: 'Hoán đổi vật phẩm cầm tay với đối thủ.',
  synchronoise: 'Đánh trúng mọi Pokémon cùng hệ với người dùng.',
  synthesis: 'Hồi HP cho người dùng. Lượng hồi thay đổi tùy thời tiết.',
  syrup_bomb: 'Hạ Tốc độ của đối thủ mỗi lượt trong 3 lượt.',
  tachyon_cutter: 'Chắc chắn đánh trúng hai lần liên tiếp.',
  tail_glow: 'Tăng mạnh Công đặc biệt của người dùng.',
  tailwind: 'Tăng gấp đôi Tốc độ trong 4 lượt.',
  take_down: 'Người dùng chịu sát thương phản lực.',
  take_heart: 'Chữa trạng thái bất lợi và tăng các chỉ số của người dùng.',
  tar_shot: 'Hạ Tốc độ của đối thủ và khiến đối thủ yếu hơn trước các chiêu hệ Lửa.',
  taunt: 'Đối thủ chỉ có thể dùng các chiêu gây sát thương.',
  tearful_look: 'Làm mục tiêu mất ý chí chiến đấu, hạ Tấn công và Công đặc biệt của mục tiêu.',
  teatime: 'Buộc tất cả Pokémon trên sân ăn Berry của chúng.',
  techno_blast: 'Hệ phụ thuộc vào Drive mà người dùng đang cầm.',
  tectonic_rage: 'Chiêu Z hệ Đất.',
  telekinesis: 'Bỏ qua Né tránh của đối thủ trong 3 lượt và tạo miễn nhiễm hệ Đất.',
  teleport:
    'Cho phép người dùng bỏ chạy khỏi trận hoang dã và đưa người chơi về PokéCenter gần nhất.',
  tera_blast: 'Đổi hệ khi người dùng đã Terastallize.',
  terrain_pulse: 'Hệ và uy lực thay đổi tùy Địa hình đang hoạt động.',
  thief: 'Đồng thời lấy vật phẩm mà đối thủ đang cầm.',
  thousand_arrows: 'Khiến Pokémon hệ Bay có thể bị chiêu hệ Đất đánh trúng.',
  thousand_waves: 'Đối thủ không thể bỏ chạy hoặc đổi Pokémon.',
  thrash: 'Tấn công trong 2–3 lượt rồi khiến người dùng bối rối.',
  throat_chop: 'Ngăn sử dụng các chiêu âm thanh trong 2 lượt.',
  thunder_cage: 'Gây sát thương và giam giữ đối thủ trong 4–5 lượt.',
  thunder_fang: 'Có thể khiến đối thủ nao núng và/hoặc bị tê liệt.',
  thunderclap: 'Đánh trước chiêu thức của mục tiêu.',
  tidy_up: 'Loại bỏ bẫy sân và Substitute, đồng thời tăng Tấn công và Tốc độ của người dùng.',
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
