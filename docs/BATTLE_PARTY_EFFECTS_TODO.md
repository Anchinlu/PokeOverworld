# Battle Party Effects — Phần chưa triển khai

> Tài liệu kế hoạch. Các mục trong tài liệu này chưa được triển khai nếu không có yêu cầu mới.

## Phạm vi đã hoàn thành

Battle 1v1 hiện đã có:

- `BattlePartyEffects` làm cổng giữa Battle Engine và PartyService.
- Healing Wish: hi sinh, yêu cầu đổi Pokémon, hồi đầy HP và chữa trạng thái cho Pokémon mới.
- Revival Blessing: hồi sinh Pokémon đầu tiên đã ngất với 50% HP.
- Wish lưu theo phe, không mất khi đổi Pokémon.
- Heal Bell và Aromatherapy chữa trạng thái cho toàn bộ Party người chơi.
- Life Dew và Jungle Healing kết nối với PartyService.

## Phần chưa làm

### 1. Enemy Party thực sự

Battle Engine hiện chỉ có một `enemyPokemon`, chưa có đội hình đối thủ.

Khi triển khai Trainer Battle cần bổ sung:

- `EnemyPartyState` hoặc `BattlePartyState` dùng chung cho Player và Enemy.
- Danh sách tối đa 6 Pokémon đối thủ.
- `activeUid` cho Pokémon đang chiến đấu.
- Đồng bộ HP, PP, status và faint state về đội hình đối thủ.
- Chọn Pokémon tiếp theo khi Pokémon địch ngất.
- AI quyết định đổi Pokémon.

### 2. Battle Party State chuẩn hóa

Không để Battle Engine chỉ quản lý hai biến rời:

```ts
playerPokemon
enemyPokemon
```

Cần chuyển dần sang:

```ts
interface BattlePartyState {
  members: BattlerPokemon[];
  activeUid: string;
}
```

Battle Engine chỉ điều phối luật; Party adapter chịu trách nhiệm đồng bộ dữ liệu lâu dài.

### 3. Healing Wish trong Trainer Battle

Hiện Healing Wish đã hoạt động cho Party người chơi trong 1v1. Cần bổ sung:

- Áp dụng cho Enemy Party.
- Xử lý khi không còn Pokémon hợp lệ để đổi.
- Chặn việc dùng Healing Wish nếu không còn đồng đội phía sau.
- Hiệu ứng chuyển Pokémon rõ ràng giữa các lượt.
- Test khi người dùng bị hạ trong cùng lượt với Healing Wish.

### 4. Revival Blessing hoàn chỉnh

Cần bổ sung:

- Cho phép người chơi chọn Pokémon muốn hồi sinh thay vì luôn chọn thành viên đầu tiên.
- UI chọn mục tiêu hồi sinh.
- Hỗ trợ Enemy AI chọn mục tiêu.
- Kiểm tra giới hạn PP và trường hợp toàn bộ Party còn sống.
- Không cho hồi sinh Pokémon đang active.
- Test nhiều Pokémon đã ngất và thứ tự lựa chọn.

### 5. Hiệu ứng toàn đội nâng cao

Cần hoàn thiện thêm:

- Heal Bell/Aromatherapy hiển thị số thành viên thực sự được chữa.
- Life Dew/Jungle Healing hỗ trợ mục tiêu đồng đội khi có trận đôi.
- Các hiệu ứng hồi máu không chữa Pokémon đã ngất nếu luật chiêu không cho phép.
- Event riêng cho từng Pokémon được hồi HP hoặc chữa status.
- Animation/UI theo từng mục tiêu.

### 6. Trận đôi và nhiều mục tiêu

Các chiêu sau chỉ nên triển khai sau khi có Battle Party/Double Battle State:

- Quick Guard.
- Wide Guard.
- Crafty Shield.
- Mat Block.
- Life Dew theo phe.
- Jungle Healing theo phe.
- Các chiêu hồi máu hoặc status tác động lên nhiều mục tiêu.

## Kiến trúc dự kiến

```text
BattleController
  ├── BattlePartyCoordinator
  │     ├── PlayerPartyAdapter
  │     └── EnemyPartyAdapter
  ├── BattleEngine
  └── PartyScreen / Enemy AI

BattleEngine
  └── BattlePartyEffects port
```

### Trách nhiệm

- `BattleEngine`: luật chiến đấu, phát request đổi/hồi sinh.
- `BattlePartyCoordinator`: quản lý active member, switch và đồng bộ.
- `PartyService`: dữ liệu Party người chơi và persistence.
- `EnemyPartyAdapter`: đội hình và AI đối thủ.
- `BattleController`: UI, animation và luồng chọn Pokémon.

## Thứ tự triển khai đề xuất

1. Tạo `BattlePartyState` dùng chung cho hai phe.
2. Tách `BattlePartyCoordinator` khỏi `BattleController`.
3. Kết nối Enemy Party và Enemy Adapter.
4. Hoàn thiện Trainer Battle switch flow.
5. Cho Healing Wish và Revival Blessing dùng chung cả hai phe.
6. Mở rộng Battle Party cho Double Battle.
7. Triển khai các chiêu nhiều mục tiêu và UI chọn mục tiêu.

## Điều kiện nghiệm thu

- Không có logic Party trực tiếp trong `move-effect-engine.ts`.
- Không có thao tác ghi nhầm vào `party[0]` khi đổi Pokémon.
- Healing Wish hoạt động đúng khi đổi sang thành viên bất kỳ.
- Revival Blessing cho phép chọn đúng mục tiêu.
- Enemy Party có thể đổi Pokémon và nhận hiệu ứng tương đương.
- Có test cho HP, status, faint, switch, Wish và Revival Blessing.
- `npm run typecheck:web`, `npm run lint` và toàn bộ test đều PASS.

