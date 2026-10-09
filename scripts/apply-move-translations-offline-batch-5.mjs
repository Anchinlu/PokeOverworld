import fs from 'node:fs';
const file = 'packages/game-data/moves-db.json';
const database = JSON.parse(fs.readFileSync(file, 'utf8'));
const translations = {
  high_jump_kick: 'Nếu trượt, người dùng mất một nửa HP.',
  hold_back: 'Luôn để lại cho đối thủ ít nhất 1 HP.',
  hold_hands: 'Khiến người dùng và một đồng đội rất vui vẻ.',
  hone_claws: 'Tăng Tấn công và Độ chính xác của người dùng.',
  horn_drill: 'Nếu đánh trúng, hạ gục đối thủ ngay lập tức.',
  howl: 'Tăng Tấn công cho các đồng đội.',
  hydro_cannon: 'Người dùng phải nạp lại năng lượng ở lượt tiếp theo.',
  hydro_steam: 'Uy lực tăng khi ánh nắng gay gắt.',
  hydro_vortex: 'Chiêu Z hệ Nước.',
  hyper_beam: 'Người dùng phải nạp lại năng lượng ở lượt tiếp theo.',
  hyper_drill: 'Có thể đánh xuyên Protect và Detect.',
  hyperspace_fury: 'Hạ Phòng thủ của người dùng. Có thể đánh xuyên Protect và Detect.',
  hyperspace_hole: 'Có thể đánh xuyên Protect và Detect.',
  ice_ball: 'Uy lực tăng gấp đôi sau mỗi lượt trong 5 lượt.',
  ice_fang: 'Có thể khiến đối thủ nao núng và/hoặc bị đóng băng.',
  ice_hammer: 'Vung nắm đấm nặng để đánh mục tiêu, nhưng hạ Tốc độ của người dùng.',
  ice_spinner: 'Loại bỏ hiệu ứng của Địa hình.',
  imprison: 'Đối thủ không thể dùng những chiêu mà người dùng cũng biết.',
  incinerate: 'Thiêu hủy Berry mà mục tiêu đang cầm.',
  infernal_parade: 'Gây sát thương gấp đôi nếu mục tiêu đang mắc trạng thái bất lợi.',
  inferno_overdrive: 'Chiêu Z hệ Lửa.',
  infestation: 'Giam giữ đối thủ và gây sát thương trong 4–5 lượt.',
  ingrain: 'Người dùng hồi HP mỗi lượt nhưng không thể bỏ chạy hoặc đổi Pokémon.',
  instruct: 'Cho phép một đồng đội sử dụng chiêu thức thay mình.',
  ion_deluge: 'Biến các chiêu hệ Thường thành chiêu hệ Điện.',
  ivy_cudgel: 'Tỷ lệ ra đòn chí mạng rất cao. Hệ thay đổi tùy theo hình dạng.',
  jaw_lock: 'Ngăn cả người dùng và đối thủ đổi Pokémon.',
  jet_punch: 'Luôn đi trước.',
  judgment: 'Hệ phụ thuộc vào Plate mà Arceus đang cầm.',
  jump_kick: 'Nếu trượt, người dùng mất một nửa HP.',
  jungle_healing: 'Hồi HP và chữa trạng thái bất lợi cho cả đội.',
  kinesis: 'Hạ Độ chính xác của đối thủ.',
  kings_shield: 'Bảo vệ người dùng và hạ Tấn công của đối thủ khi đối thủ tiếp xúc.',
  knock_off: 'Loại bỏ vật phẩm đối thủ đang cầm trong phần còn lại của trận đấu.',
  kowtow_cleave: 'Luôn đánh trúng.',
  laser_focus: 'Đòn tấn công tiếp theo của người dùng chắc chắn là đòn chí mạng.',
  lash_out: 'Uy lực tăng gấp đôi nếu chỉ số của người dùng bị hạ trong lượt này.',
  last_resort: 'Chỉ có thể dùng sau khi đã sử dụng tất cả các chiêu khác.',
  last_respects: 'Sát thương tăng theo số Pokémon trong đội đã bị hạ gục.',
  leaf_storm: 'Hạ mạnh Công đặc biệt của người dùng.',
  leaf_tornado: 'Có thể hạ Độ chính xác của đối thủ.',
  leafage: 'Tấn công đối thủ bằng lá cây.',
  leech_seed: 'Hút HP của đối thủ vào cuối mỗi lượt.',
  lets_snuggle_forever: 'Chiêu Z độc quyền của Mimikyu.',
  life_dew: 'Hồi HP cho người dùng và đồng đội.',
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
