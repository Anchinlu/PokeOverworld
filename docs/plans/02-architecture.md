# 02. Kiến trúc tổng thể

## Trạng thái

Đã cập nhật theo quyết định định hướng kiến trúc D1, D2 trong [DEV_ARCHITECTURE_GUIDE.md](file:///e:/Pokemon/docs/DEV_ARCHITECTURE_GUIDE.md): **Client-only, Offline-first, Phân tầng Domain-Driven Design (DDD)**.

## Sơ đồ phân tầng và luồng dữ liệu kiến trúc

```text
┌────────────────────────────────────────────────────────────────────────┐
│ L5: UI · Game · Bootstrap (Composition Root)                           │
│     - main.ts, bootstrap.ts, GameSession                               │
│     - UI Screens: Pokédex, PC Storage, Party, Bag, Dialog Box          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ L4: Battle Session / Controller · Rendering System                     │
│     - BattleController (quản lý luồng lượt và trạng thái tương tác)    │
│     - Canvas 2D: GroundRenderer, ObjectRenderer, CharacterRenderer    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ L3: World & Pure Battle Rules                                          │
│     - Procedural Maps (ChunkManager, TerrainRules, VillageRules)       │
│     - Entities & AI (Player, Follower, WildPokemon)                    │
│     - BattleEngine: Pure calculation rules (Gen 7 standard)            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ L2: Domain Models & Services                                           │
│     - PartyService, PcStorageService, InventoryService, SaveService    │
│     - Domain Models: PartyPokemon, BattlerPokemon, BoxPokemon          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ L1: Data Catalog & Shared Packages                                     │
│     - packages/game-data: moves-db.json, pokemon-db.json, items-db.json│
│     - packages/shared-types, PokemonCatalog, ItemCatalog               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│ L0: Core Infrastructure & Adapters (Platform)                          │
│     - Core: SeededRandom / RNG, Camera, GameTime loop                  │
│     - Platform: WebAudio / BGM Player, LocalStorage, Tauri Shell       │
└────────────────────────────────────────────────────────────────────────┘
```

## Ranh giới trách nhiệm (Separation of Concerns)

1. **Giao diện & Điều khiển (L5 & L4):**
   - High-DPI DOM UI: Render khung thoại WindowSkin, bảng chọn lệnh battle, menu túi đồ Pokémon, thanh máu HP, Pokédex và PC Storage.
   - Canvas 2D Render Engine: Render thế giới ô lưới (tiles), bóng đổ thực thể, mặt nước hoạt họa, cây cối, cỏ lay động theo gió.
   - Nhận input từ người chơi và điều phối sự kiện thông qua các cổng giao tiếp (ports).

2. **Luật chơi thuần (L3):**
   - Các thuật toán tính toán sát thương, hiệu ứng trạng thái, kiểm tra tương khắc hệ Gen 7 là các hàm thuần (pure functions), không phụ thuộc UI/DOM/Canvas.

3. **Nghiệp vụ Domain (L2):**
   - Quản lý trạng thái đội hình (Party), hộp lưu trữ (PC Boxes), túi đồ (Inventory) và dữ liệu lưu (Save Game).
   - Đảm bảo tính toàn vẹn dữ liệu, không import trực tiếp UI hay Canvas.

4. **Dữ liệu tĩnh & Core (L1 & L0):**
   - `packages/game-data`: Single Source of Truth cho toàn bộ 956 chiêu thức và danh mục Pokémon.
   - `core/`: Bộ sinh số ngẫu nhiên theo hạt giống (`SeededBattleRng`), vòng lặp thời gian delta-time, camera.

## Quy tắc thiết kế cốt lõi

- **Chỉ import 1 chiều từ trên xuống dưới:** Tuyệt đối không import ngược tầng và không có vòng lặp phụ thuộc (circular dependency).
- **Luật chơi là hàm thuần:** Nhận đầu vào và trả về kết quả; ngẫu nhiên phải đi qua RNG được tiêm vào (Dependency Injection).
- **Single Source of Truth:** Game data tĩnh được định nghĩa tập trung tại `packages/game-data`.
