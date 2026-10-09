import fs from 'node:fs';

const file = 'packages/game-data/moves-db.json';
const database = JSON.parse(fs.readFileSync(file, 'utf8'));
const translations = {
  topsy_turvy: 'Đảo ngược mọi thay đổi chỉ số của đối thủ.',
  torment: 'Đối thủ không thể dùng cùng một chiêu liên tiếp.',
  toxic_spikes: 'Đầu độc Pokémon đối thủ khi chúng vào sân.',
  toxic_thread: 'Đầu độc đối thủ và hạ Tốc độ của đối thủ.',
  transform: 'Người dùng biến thành đối thủ và có hình dạng cùng các chiêu của đối thủ.',
  tri_attack: 'Có thể khiến đối thủ tê liệt, bỏng hoặc đóng băng.',
  trick: 'Hoán đổi vật phẩm đang cầm với đối thủ.',
  trick_room: 'Pokémon chậm hơn sẽ đi trước trong 5 lượt.',
  trick_or_treat: 'Thêm hệ Ma cho đối thủ.',
  triple_axel: 'Đánh ba lần, mỗi lần sau mạnh hơn.',
  triple_dive: 'Đánh liên tiếp 3 lần.',
  triple_kick: 'Đá ba lần trong một lượt với uy lực tăng dần.',
  trump_card: 'PP càng thấp thì uy lực càng cao.',
  twinkle_tackle: 'Chiêu Z hệ Tiên.',
  twister:
    'Có thể khiến đối thủ nao núng. Đánh Pokémon đang dùng Fly hoặc Bounce với uy lực gấp đôi.',
  u_turn: 'Người dùng đổi ra ngay sau khi tấn công.',
  upper_hand: 'Đánh trước chiêu có độ ưu tiên của mục tiêu.',
  uproar: 'Tấn công trong 3 lượt và ngăn Pokémon ngủ.',
  v_create: 'Hạ Phòng thủ, Phòng thủ đặc biệt và Tốc độ của người dùng.',
  veevee_volley: 'Uy lực tăng khi mối liên kết với người chơi mạnh hơn.',
  venom_drench: 'Hạ Công đặc biệt và Tốc độ của đối thủ đang bị độc.',
  venoshock: 'Gây sát thương gấp đôi nếu mục tiêu đang bị độc.',
  victory_dance: 'Tăng Tấn công và Phòng thủ của người dùng.',
  vital_throw: 'Người dùng luôn tấn công sau, nhưng bỏ qua Độ chính xác và Né tránh.',
  volt_switch: 'Người dùng phải đổi ra sau khi tấn công.',
  volt_tackle: 'Người dùng chịu sát thương phản lực. Có thể khiến đối thủ tê liệt.',
  wake_up_slap: 'Uy lực tăng gấp đôi nếu đối thủ đang ngủ, nhưng đánh thức đối thủ.',
  water_pledge: 'Có thêm hiệu ứng nếu dùng sau Fire Pledge hoặc trước Grass Pledge.',
  water_sport: 'Giảm uy lực của các chiêu hệ Lửa.',
  water_spout: 'HP của người dùng càng cao thì sát thương càng lớn.',
  wave_crash: 'Người dùng chịu sát thương phản lực.',
  weather_ball: 'Uy lực và hệ thay đổi theo thời tiết.',
  whirlpool: 'Giam giữ đối thủ và gây sát thương trong 4–5 lượt.',
  whirlwind: 'Trong trận đấu, buộc đối thủ đổi Pokémon. Ngoài tự nhiên, Pokémon sẽ bỏ chạy.',
  wicked_blow: 'Luôn là đòn chí mạng và bỏ qua thay đổi chỉ số.',
  wicked_torque: 'Có thể khiến đối thủ ngủ.',
  wide_guard: 'Bảo vệ đội của người dùng khỏi các đòn đánh nhiều mục tiêu.',
  wild_charge: 'Người dùng chịu sát thương phản lực.',
  wildbolt_storm: 'Có thể khiến mục tiêu tê liệt.',
  wish: 'Người dùng hồi HP vào lượt kế tiếp.',
  wonder_room: 'Hoán đổi Phòng thủ và Phòng thủ đặc biệt của mọi Pokémon trong 5 lượt.',
  wood_hammer: 'Người dùng chịu sát thương phản lực.',
  work_up: 'Tăng Tấn công và Công đặc biệt của người dùng.',
  worry_seed: 'Đổi Ability của đối thủ thành Insomnia.',
  wrap: 'Giam giữ đối thủ và gây sát thương trong 4–5 lượt.',
  wring_out: 'HP của đối thủ càng cao thì sát thương càng lớn.',
  yawn: 'Khiến đối thủ ngủ vào lượt kế tiếp.',
  sonicboom: 'Luôn gây đúng 20 HP sát thương.',
  highjumpkick: 'Nếu trượt, người dùng mất một nửa HP.',
  jumpkick: 'Nếu trượt, người dùng mất một nửa HP.',
  leechseed: 'Hút HP của đối thủ sau mỗi lượt.',
  mudslap: 'Hạ Độ chính xác của đối thủ.',
  sandattack: 'Hạ Độ chính xác của đối thủ.',
  smellingsalts: 'Uy lực tăng gấp đôi nếu đối thủ bị tê liệt, nhưng chữa tê liệt cho đối thủ.',
};

let updated = 0;
for (const [id, descriptionVi] of Object.entries(translations)) {
  const move = database.moves[id];
  if (move && !move.descriptionVi) {
    move.descriptionVi = descriptionVi;
    updated += 1;
  }
}
fs.writeFileSync(file, `${JSON.stringify(database, null, 2)}\n`);
console.log(`Updated offline Vietnamese descriptions: ${updated}`);
