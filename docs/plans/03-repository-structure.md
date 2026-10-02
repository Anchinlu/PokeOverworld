# 03. Cấu trúc repository

## Trạng thái

Đã thống nhất sơ đồ Monorepo chuẩn hoá theo kiến trúc mở rộng.

## Cấu trúc thư mục Monorepo

```text
pokemon-game/
├─ apps/
│  ├─ web/                    # Frontend game
│  │  ├─ src/
│  │  │  ├─ game/             # Phaser game engine
│  │  │  │  ├─ scenes/        # OverworldScene, BattleScene, MenuScene...
│  │  │  │  ├─ entities/      # Player, NPC, WildPokemon...
│  │  │  │  ├─ systems/       # Movement, Collision, Interaction, DayNight...
│  │  │  │  ├─ maps/          # Chunk loader, autotile streaming
│  │  │  │  └─ rendering/     # Camera, viewport, tile rendering
│  │  │  ├─ ui/               # Menu, inventory, dialog, HUD (DOM/React/Vanilla)
│  │  │  ├─ api/              # HTTP client, WebSocket client gọi backend
│  │  │  ├─ stores/           # State management (Player state, UI state)
│  │  │  ├─ assets/           # Spritesheets, tilesets, audio, windowskin
│  │  │  └─ main.ts           # Entry point của client
│  │  └─ package.json
│  │
│  └─ server/                 # Backend API (Python/FastAPI)
│     ├─ app/
│     │  ├─ api/              # REST & WebSocket endpoints
│     │  ├─ core/             # Config, security/auth, logging, database session
│     │  ├─ domain/           # Business logic theo Domain-Driven Design (DDD)
│     │  │  ├─ player/        # Quản lý người chơi, chỉ số, tọa độ
│     │  │  ├─ pokemon/       # Stats, tiến hóa, moveset, EXP
│     │  │  ├─ map/           # Server-side validation vị trí & chunk
│     │  │  ├─ inventory/     # Túi đồ, vật phẩm, sử dụng item
│     │  │  └─ battle/        # Engine tính toán sát thương, lượt đấu đối kháng
│     │  ├─ models/           # SQLAlchemy / SQLModel database models
│     │  ├─ repositories/     # Lớp truy cập database (Repository pattern)
│     │  ├─ schemas/          # Pydantic Request/Response DTOs
│     │  └─ main.py           # Entry point FastAPI application
│     └─ tests/               # Unit & integration tests server
│
├─ packages/
│  ├─ shared-types/           # TypeScript types, API contracts, JSON schemas dùng chung
│  ├─ game-data/              # Dữ liệu Pokémon, moves, items, bảng thuộc tính type-chart
│  └─ config/                 # Hằng số cấu hình toàn dự án (tile size, chunk size...)
│
├─ tools/
│  ├─ map-generator/          # Bộ sinh bản đồ thủ tục (tách từ map_generator.py & chunk.py)
│  ├─ asset-pipeline/         # Xử lý sprite, cắt tileset, nén base64, atlas generator
│  └─ validators/             # Tool kiểm tra tính hợp lệ dữ liệu và ranh giới map
│
├─ infra/
│  ├─ docker-compose.yml      # Khởi chạy PostgreSQL, Redis, Server, Web
│  ├─ migrations/             # Alembic database migrations
│  └─ nginx/                  # Nginx reverse proxy configuration
│
└─ docs/                      # Tài liệu thiết kế, tiến độ (PROGRESS.md) và kế hoạch
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

