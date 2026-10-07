# 03. Cấu trúc repository

## Trạng thái

Đã cập nhật theo cấu trúc Monorepo thực tế và định hướng tổ chức file trong [DEV_ARCHITECTURE_GUIDE.md](file:///e:/Pokemon/docs/DEV_ARCHITECTURE_GUIDE.md).

## Cấu trúc thư mục Monorepo thực tế

```text
pokemon-monorepo/
├─ apps/
│  ├─ web/                    # Ứng dụng web game client chính (Vite + TypeScript thuần)
│  │  ├─ src/
│  │  │  ├─ core/             # time loop, camera, math, seeded rng
│  │  │  ├─ data/             # catalog loader, static catalogs
│  │  │  ├─ domain/           # Nghiệp vụ: party, pc, inventory, player, save
│  │  │  ├─ battle/           # Rules (hàm thuần Gen 7), state, controller, renderer, animation
│  │  │  ├─ maps/ (world/)    # ChunkManager, sinh địa hình, ecology, entities, wild AI
│  │  │  ├─ rendering/        # Canvas 2D renderers (ground, object, character)
│  │  │  ├─ ui/               # Màn hình UI: pokedex, storage-screen, party-screen, bag-screen
│  │  │  ├─ platform/         # Audio/BGM player, local storage persistence
│  │  │  ├─ assets/           # Asset registry & path resolvers
│  │  │  ├─ game/             # GameSession, GameLoop
│  │  │  └─ main.ts           # Entry point & Composition Root
│  │  ├─ test/                # Test suite Vitest (14 files, 119 tests)
│  │  └─ package.json
│  │
│  └─ desktop/                # Ứng dụng desktop vỏ Tauri (Rust + Webview)
│     ├─ src-tauri/           # Cấu hình & wrapper Tauri
│     └─ package.json
│
├─ packages/
│  ├─ shared-types/           # TypeScript interfaces dùng chung
│  └─ game-data/              # Database tĩnh: moves-db.json (956 chiêu), pokemon-db, items-db
│
├─ Graphics/                  # Tài nguyên hình ảnh (Pokemon, Battle, Pokedex, Storage, Tilesets)
├─ Audio/                     # Nhạc nền BGM và hiệu ứng âm thanh SFX
├─ docs/                      # Tài liệu thiết kế, hướng dẫn kiến trúc và tiến độ (PROGRESS.md)
├─ scripts/                   # Script kiểm tra dữ liệu schema & build
└─ tools/ (map_generator)     # Bộ công cụ sinh bản đồ ngoại tuyến Python
```

## Quy tắc tổ chức & Ranh giới trách nhiệm

1. **`apps/web` (Client):**
   - Đảm nhận toàn bộ phần render đồ hoạ (Phaser Engine), hoạt ảnh nhân vật, UI/HUD, nhận input phím.
   - Không được can thiệp trực tiếp vào database; mọi tương tác dữ liệu phải thông qua `apps/web/src/api/`.

2. **`apps/server` (Server):**
   - Đảm bảo tính toàn vẹn (Authoritative Server): kiểm tra hợp lệ bước đi, tính toán kết quả trận đấu, lưu trạng thái túi đồ và Pokémon.
   - Domain logic được phân chia rõ ràng theo từng phân hệ (`player`, `pokemon`, `map`, `inventory`, `battle`).

3. **`packages/` (Shared):**
   - `shared-types`: Giữ cho frontend và backend luôn đồng bộ về kiểu dữ liệu (DTOs, WebSocket packet formats).
   - `game-data`: Định nghĩa tĩnh không đổi trong runtime gameplay (danh sách Pokémon Gen 1-3, base stats, learnsets).

4. **`tools/` (Tooling & Pipelines):**
   - Tách riêng toàn bộ mã nguồn sinh bản đồ thuật toán (`map_generator/`) và xử lý đồ hoạ thành các công cụ độc lập, có thể chạy CLI hoặc xuất file JSON/Tiled cho game engine.

