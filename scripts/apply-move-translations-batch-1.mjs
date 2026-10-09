import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'packages/game-data/moves-db.json');
const database = JSON.parse(fs.readFileSync(file, 'utf8'));

const translations = {
  acid_downpour: 'Chiêu Z hệ Độc.',
  acrobatics: 'Mạnh hơn khi người dùng không cầm vật phẩm.',
  acupressure: 'Tăng mạnh một chỉ số ngẫu nhiên.',
  aerial_ace: 'Bỏ qua Độ chính xác và Né tránh.',
  after_you: 'Khiến mục tiêu được ưu tiên hành động ở lượt tiếp theo.',
  all_out_pummeling: 'Chiêu Z hệ Giác đấu.',
  ally_switch: 'Đổi chỗ với đồng đội ở phía đối diện.',
  anchor_shot: 'Dùng xích neo trói mục tiêu khi tấn công, khiến mục tiêu không thể bỏ chạy.',
  aqua_ring: 'Hồi một lượng nhỏ HP vào cuối mỗi lượt.',
  aromatherapy: 'Chữa mọi trạng thái bất lợi cho cả đội.',
  assist: 'Người dùng ngẫu nhiên sử dụng một chiêu mà đồng đội biết.',
  assurance: 'Uy lực tăng gấp đôi nếu đối thủ đã chịu sát thương trong cùng lượt.',
  astral_barrage: 'Tấn công bằng cách phóng một lượng lớn những hồn ma đáng sợ vào đối thủ.',
  attract: 'Nếu đối thủ khác giới, đối thủ sẽ khó tấn công hơn.',
  aura_sphere: 'Bỏ qua Độ chính xác và Né tránh.',
  aura_wheel: 'Thay đổi hệ tùy theo hình thái của Morpeko.',
  aurora_veil: 'Giảm một nửa sát thương Vật lý và Đặc biệt trong năm lượt.',
  avalanche: 'Uy lực tăng gấp đôi nếu người dùng đã chịu sát thương trước đó.',
  baby_doll_eyes: 'Luôn đi trước. Hạ chỉ số Tấn công của mục tiêu.',
  baddy_bad: 'Giảm sát thương từ các đòn Vật lý.',
  baneful_bunker: 'Bảo vệ người dùng và đầu độc đối thủ khi đối thủ tiếp xúc.',
  barb_barrage: 'Có thể đầu độc đối thủ; gây sát thương gấp đôi nếu mục tiêu đã bị độc.',
  baton_pass: 'Rút người dùng khỏi trận và chuyển các thay đổi chỉ số cho Pokémon vào sân.',
  beak_blast:
    'Người dùng làm nóng mỏ trước rồi tấn công mục tiêu. Pokémon tiếp xúc trực tiếp khi mỏ đang nóng sẽ bị bỏng.',
  beat_up: 'Mỗi Pokémon trong đội của người dùng lần lượt tấn công.',
  behemoth_bash: 'Sát thương tăng gấp đôi nếu mục tiêu đang Dynamax.',
  behemoth_blade: 'Sát thương tăng gấp đôi nếu mục tiêu đang Dynamax.',
  belch: 'Người dùng phải từng ăn một Berry.',
  bestow: 'Trao vật phẩm đang cầm cho mục tiêu.',
  bide: 'Chịu sát thương trong hai lượt rồi phản công với sát thương gấp đôi.',
  bind: 'Trói đối thủ và gây sát thương trong 4–5 lượt.',
  black_hole_eclipse: 'Chiêu Z hệ Bóng tối.',
  blast_burn: 'Người dùng phải nạp lại năng lượng ở lượt tiếp theo.',
  blazing_torque: 'Có thể làm đối thủ bị bỏng.',
  block: 'Đối thủ không thể bỏ chạy hoặc đổi Pokémon.',
  blood_moon: 'Không thể sử dụng hai lượt liên tiếp.',
  bloom_doom: 'Chiêu Z hệ Cỏ.',
  bolt_beak: 'Nếu người dùng tấn công trước mục tiêu, uy lực chiêu thức tăng gấp đôi.',
  boomburst: 'Tấn công tất cả Pokémon ở gần.',
  brave_bird: 'Người dùng chịu sát thương phản lực.',
  breaking_swipe: 'Tấn công nhiều đối thủ và hạ chỉ số Tấn công của chúng.',
  breakneck_blitz: 'Chiêu Z hệ Thường.',
  brick_break: 'Phá vỡ các màn chắn Reflect và Light Screen.',
  brine: 'Uy lực tăng gấp đôi nếu HP của đối thủ dưới 50%.',
  brutal_swing: 'Xoay cơ thể dữ dội để gây sát thương cho mọi Pokémon xung quanh.',
  bug_bite: 'Nhận hiệu ứng từ Berry mà đối thủ đang cầm.',
  burn_up:
    'Người dùng thiêu đốt chính mình để gây sát thương lớn. Sau khi dùng, người dùng không còn là hệ Lửa.',
  burning_jealousy: 'Tấn công tất cả đối thủ và làm bỏng những mục tiêu đã được tăng chỉ số.',
  buzzy_buzz: 'Làm đối thủ bị tê liệt.',
  camouflage: 'Thay đổi hệ của người dùng tùy theo địa điểm.',
  catastropika: 'Chiêu Z độc quyền của Pikachu.',
  ceaseless_edge: 'Thiết lập bẫy Spikes.',
  celebrate: 'Pokémon chúc mừng bạn trong ngày đặc biệt. Không có hiệu ứng chiến đấu.',
  chilly_reception: 'Rút người dùng khỏi trận và tạo bão tuyết kéo dài năm lượt.',
  chloroblast: 'Người dùng chịu sát thương phản lực.',
  circle_throw: 'Trong trận, đối thủ bị buộc phải đổi Pokémon. Ngoài tự nhiên, Pokémon sẽ bỏ chạy.',
  clamp: 'Trói đối thủ và gây sát thương trong 4–5 lượt.',
  clangorous_soul: 'Tăng tất cả chỉ số của người dùng nhưng làm mất HP.',
  clangorous_soulblaze: 'Chiêu Z độc quyền của Kommo-o.',
  clear_smog: 'Xóa mọi thay đổi chỉ số của mục tiêu.',
};

let updated = 0;
for (const [id, descriptionVi] of Object.entries(translations)) {
  const move = database.moves?.[id];
  if (!move) continue;
  if (move.descriptionVi !== descriptionVi) {
    move.descriptionVi = descriptionVi;
    updated++;
  }
}

fs.writeFileSync(file, `${JSON.stringify(database, null, 2)}\n`, 'utf8');
console.log(`Updated Vietnamese descriptions: ${updated}`);
