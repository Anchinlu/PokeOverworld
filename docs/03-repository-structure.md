# 03. Cấu trúc repository

## Trạng thái

Đã cập nhật theo cấu trúc thực tế và định hướng desktop + LAN trong [DEV_ARCHITECTURE_GUIDE.md](../DEV_ARCHITECTURE_GUIDE.md). Các mục đánh dấu *(đề xuất)* chưa tồn tại trong code.

## Cấu trúc thư mục

```text
pokemon-monorepo/
├─ apps/
│  ├─ web/                      # Mã giao diện và game (Vite + TypeScript thuần), chạy trong Tauri
│  │  ├─ src/
│  │  │  ├─ core/               # time loop, camera, math, seeded rng
│  │  │  ├─ data/               # catalog loader, static catalogs
│  │  │  ├─ domain/             # party, pc, inventory, player, save
│  │  │  ├─ battle/             # rules (Gen 7), state, controller, renderer, animation
│  │  │  ├─ session/            # (đề xuất) SessionPort, Local/Host/RemoteSession
│  │  │  ├─ net/protocol/       # (đề xuất) message và schema
│  │  │  ├─ maps/ (world/)      # ChunkManager, sinh địa hình, ecology, entities, wild AI
│  │  │  ├─ rendering/          # Canvas 2D renderers
│  │  │  ├─ ui/                 # pokedex, storage, party, bag, lobby
│  │  │  ├─ platform/           # audio, file save, net transport, shell
│  │  │  ├─ assets/             # asset registry và path resolvers
│  │  │  ├─ game/               # GameSession, GameLoop
│  │  │  └─ main.ts             # entry point và composition root
│  │  ├─ test/                  # Vitest (16 file, 128 test)
│  │  └─ package.json
│  │
│  └─ desktop/                  # Vỏ Tauri v2 (Rust + webview)
│     └─ src-tauri/
│        ├─ src/                # lib.rs, main.rs
│        │  ├─ net/             # (đề xuất) máy chủ WebSocket cho host
│        │  └─ fs/              # (đề xuất) đọc ghi file save
│        └─ tauri.conf.json
│
├─ packages/
│  ├─ shared-types/             # kiểu TypeScript dùng chung
│  └─ game-data/                # moves-db, pokemon-db, items-db
│
├─ Graphics/  Audio/            # tài nguyên (về sau gom vào assets/)
├─ docs/                        # tài liệu thiết kế, hướng dẫn, tiến độ (kèm adr/ - đề xuất)
├─ scripts/                     # kiểm tra schema dữ liệu, build
└─ tools/ (map_generator)       # công cụ sinh bản đồ ngoại tuyến (Python)
```

Không có `apps/server`: online chạy theo kiểu host (xem [05-lan-multiplayer-plan.md](05-lan-multiplayer-plan.md)).

## Quy tắc tổ chức và ranh giới

1. **`apps/web`:**
   - Chứa toàn bộ game: render Canvas 2D, UI/HUD, luật chơi, domain, phiên chơi (solo, host, khách).
   - Không truy cập file hay mở cổng trực tiếp; mọi thao tác hệ thống đi qua `platform/` (adapter) và lớp Rust.
2. **`apps/desktop` (Tauri):**
   - Vỏ ứng dụng, đọc ghi file save, và (khi làm mạng) máy chủ WebSocket cho host.
   - Rust không chứa luật chơi; luật chơi nằm ở TypeScript.
3. **`packages/`:**
   - `shared-types`: kiểu dùng chung.
   - `game-data`: dữ liệu tĩnh không đổi trong runtime (Pokémon, chiêu thức, vật phẩm).
4. **`tools/`:** công cụ ngoại tuyến (sinh bản đồ, xử lý đồ hoạ), chạy bằng CLI; không dùng trong game lúc chạy.
