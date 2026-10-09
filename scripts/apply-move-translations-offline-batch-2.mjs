import fs from 'node:fs';

const file = 'packages/game-data/moves-db.json';
const database = JSON.parse(fs.readFileSync(file, 'utf8'));
const translations = {
  eruption: 'Uy lực càng lớn khi HP của người dùng càng cao.',
  eternabeam: 'Người dùng không thể hành động ở lượt tiếp theo.',
  extreme_evoboost: 'Chiêu Z độc quyền của Eevee. Tăng mạnh tất cả chỉ số.',
  facade: 'Uy lực tăng gấp đôi nếu người dùng bị bỏng, độc hoặc tê liệt.',
  fake_out:
    'Người dùng tấn công trước và khiến đối thủ nao núng. Chỉ dùng được trong lượt đầu tiên.',
  false_surrender: 'Bỏ qua Độ chính xác và Né tránh.',
  false_swipe: 'Luôn để lại cho đối thủ ít nhất 1 HP.',
  feint: 'Chỉ đánh trúng nếu đối thủ dùng Protect hoặc Detect trong cùng lượt.',
  feint_attack: 'Bỏ qua Độ chính xác và Né tránh.',
  fell_stinger: 'Tăng mạnh Tấn công của người dùng nếu mục tiêu bị hạ gục.',
  fickle_beam: 'Có thể gây sát thương gấp đôi.',
  fillet_away: 'Giảm HP nhưng tăng mạnh Tấn công, Công đặc biệt và Tốc độ.',
  final_gambit: 'Gây sát thương bằng HP còn lại của người dùng. Người dùng bị ngất.',
  fire_fang: 'Có thể khiến đối thủ nao núng và/hoặc bị bỏng.',
  fire_lash: 'Đánh mục tiêu bằng một roi lửa, đồng thời hạ chỉ số Phòng thủ của mục tiêu.',
  fire_pledge: 'Có hiệu ứng bổ sung nếu kết hợp với Grass Pledge hoặc Water Pledge.',
  fire_spin: 'Giam giữ đối thủ và gây sát thương trong 4–5 lượt.',
  first_impression:
    'Dù có uy lực lớn, chiêu này chỉ hoạt động trong lượt đầu tiên người dùng vào trận.',
  fishious_rend: 'Nếu người dùng tấn công trước mục tiêu, uy lực chiêu thức tăng gấp đôi.',
  fissure: 'Nếu đánh trúng, sẽ hạ gục đối thủ ngay lập tức.',
  flail: 'HP của người dùng càng thấp thì uy lực càng cao.',
  flare_blitz: 'Người dùng chịu sát thương phản lực và có thể làm đối thủ bị bỏng.',
  flash: 'Hạ chỉ số Độ chính xác của đối thủ.',
  flatter: 'Khiến đối thủ bối rối nhưng tăng Công đặc biệt của đối thủ.',
  fleur_cannon: 'Hạ mạnh Công đặc biệt của người dùng.',
  fling: 'Uy lực phụ thuộc vào vật phẩm người dùng đang cầm.',
  flip_turn: 'Sau khi tấn công, người dùng quay về và đổi chỗ với một Pokémon đang chờ trong đội.',
  floral_healing: 'Hồi tối đa một nửa HP của mục tiêu. Hồi nhiều hơn khi địa hình là Thảm Cỏ.',
  flower_shield: 'Tăng mạnh Phòng thủ của tất cả Pokémon hệ Cỏ trên sân.',
  fly: 'Bay lên ở lượt đầu và tấn công ở lượt thứ hai.',
  flying_press: 'Gây sát thương đồng thời mang tính chất của hệ Giác đấu và hệ Bay.',
  focus_energy: 'Tăng tỷ lệ ra đòn chí mạng.',
  focus_punch: 'Nếu bị đánh trúng trước khi tấn công, người dùng sẽ nao núng thay vì ra đòn.',
  follow_me: 'Trong Double Battle, người dùng thu hút toàn bộ đòn tấn công về mình.',
  foresight:
    'Đặt lại Né tránh của đối thủ và cho phép đòn hệ Thường, Giác đấu đánh trúng Pokémon hệ Ma.',
  forests_curse: 'Thêm hệ Cỏ cho đối thủ.',
  foul_play: 'Sử dụng chỉ số Tấn công của đối thủ để tính sát thương.',
  freezy_frost: 'Đặt lại mọi thay đổi chỉ số.',
  frenzy_plant: 'Người dùng phải nạp lại năng lượng ở lượt tiếp theo.',
  frustration: 'Uy lực giảm khi Độ thân thiết tăng.',
  fury_cutter: 'Uy lực tăng sau mỗi lượt sử dụng liên tiếp.',
  fusion_bolt: 'Uy lực tăng nếu Fusion Flare được sử dụng trong cùng lượt.',
  fusion_flare: 'Uy lực tăng nếu Fusion Bolt được sử dụng trong cùng lượt.',
  future_sight: 'Sát thương được tung ra sau 2 lượt.',
  g_max_befuddle:
    'Chiêu G-Max độc quyền của Butterfree. Có thể đầu độc, gây tê liệt hoặc ru ngủ đối thủ.',
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
