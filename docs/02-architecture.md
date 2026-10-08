# 02. Kiến trúc tổng thể

## Trạng thái

Đã cập nhật theo định hướng trong [DEV_ARCHITECTURE_GUIDE.md](../DEV_ARCHITECTURE_GUIDE.md): **ứng dụng desktop (Tauri)**, phân tầng theo domain, chơi online theo kiểu **host qua LAN/VPN** (không có máy chủ riêng).

## Sơ đồ phân tầng

```text
┌────────────────────────────────────────────────────────────────────────┐
│ L5: UI · Game · Bootstrap (Composition Root)                           │
│     - main.ts, bootstrap.ts, GameSession                               │
│     - UI: Pokédex, PC Storage, Party, Bag, Dialog, Lobby (vào/mở thế giới) │
└───────────────────────────────────┬────────────────────────────────────┘
┌───────────────────────────────────▼────────────────────────────────────┐
│ L4: Battle Session · Session (SessionPort) · Rendering                 │
│     - BattleController (luồng lượt, qua cổng)                          │
│     - LocalSession / HostSession / RemoteSession                       │
│     - Canvas 2D: GroundRenderer, ObjectRenderer, CharacterRenderer     │
└───────────────────────────────────┬────────────────────────────────────┘
┌───────────────────────────────────▼────────────────────────────────────┐
│ L3: World & Pure Battle Rules                                          │
│     - ChunkManager, TerrainRules, VillageRules, Entities, Wild AI      │
│     - BattleEngine: hàm thuần, chuẩn Gen 7                             │
└───────────────────────────────────┬────────────────────────────────────┘
┌───────────────────────────────────▼────────────────────────────────────┐
│ L2: Domain Models & Services                                           │
│     - Party, PcStorage, Inventory, Player, Save                        │
│     - Mô hình dùng chung: PartyPokemon, BattlerPokemon, BoxPokemon     │
└───────────────────────────────────┬────────────────────────────────────┘
┌───────────────────────────────────▼────────────────────────────────────┐
│ L1: Dữ liệu & giao thức                                                │
│     - packages/game-data, packages/shared-types                        │
│     - net/protocol: message và schema client–host                      │
└───────────────────────────────────┬────────────────────────────────────┘
┌───────────────────────────────────▼────────────────────────────────────┐
│ L0: Core                                                               │
│     - SeededRandom / RNG, Camera, GameTime                             │
└────────────────────────────────────────────────────────────────────────┘

platform/ (adapter, chỉ tạo ở L5): audio, file save (Tauri fs),
          net transport (WebSocket client), Tauri shell
src-tauri/ (Rust): máy chủ WebSocket cho host, cầu nối với webview, đọc ghi file
```

## Mô hình chạy

- **Chơi một mình:** `LocalSession` xử lý tại chỗ.
- **Mở thế giới:** `HostSession` chạy trong webview của host; lớp Rust mở cổng và chuyển message.
- **Vào thế giới người khác:** `RemoteSession` mở WebSocket từ webview tới `IP:cổng` của host.

Chi tiết xem mục 2.5 của [DEV_ARCHITECTURE_GUIDE.md](../DEV_ARCHITECTURE_GUIDE.md) và [05-lan-multiplayer-plan.md](05-lan-multiplayer-plan.md).

## Ranh giới trách nhiệm

1. **Giao diện và điều khiển (L5, L4):** DOM UI độ nét cao (hội thoại, menu, Pokédex, PC Storage), Canvas 2D cho thế giới; nhận input và điều phối qua các cổng (ports).
2. **Luật chơi thuần (L3):** sát thương, trạng thái, tương khắc hệ (Gen 7) là hàm thuần, không phụ thuộc UI/DOM/Canvas/mạng.
3. **Nghiệp vụ domain (L2):** đội hình, PC, túi đồ, save; đảm bảo toàn vẹn dữ liệu, không import UI hay Canvas.
4. **Dữ liệu và core (L1, L0):** `packages/game-data` là nguồn dữ liệu tĩnh duy nhất; `core/` chứa RNG theo hạt giống, vòng lặp thời gian, camera.

## Quy tắc thiết kế cốt lõi

- Chỉ import một chiều từ trên xuống; không vòng phụ thuộc.
- Luật chơi là hàm thuần; ngẫu nhiên đi qua RNG được tiêm vào.
- Thay đổi trạng thái thế giới chung đi qua `SessionPort`.
- Mọi message mạng đi qua schema và bị giới hạn kích thước, tần suất.
- Dữ liệu game tĩnh định nghĩa tập trung tại `packages/game-data`.
