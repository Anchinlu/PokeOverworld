# 02. Kiến trúc tổng thể

## Trạng thái

Đã phê duyệt kiến trúc tổng thể Monorepo & phân tầng Domain-Driven Design (DDD).

## Sơ đồ luồng dữ liệu & Thành phần hệ thống

```text
┌────────────────────────────────────────────────────────┐
│               apps/web (Frontend Client)               │
│  Phaser 3 Game Engine  │  React / Vanilla DOM UI / HUD │
│  - Overworld Scenes    │  - Dialog Box (WindowSkin)    │
│  - Tile Autotiling     │  - Inventory Bag & Party      │
│  - Player Controller   │  - Battle Command Interface   │
└──────────────────────────┬─────────────────────────────┘
                           │
             REST API (Auth, State) / WebSockets (Realtime)
                           │
┌──────────────────────────▼─────────────────────────────┐
│              apps/server (Backend Game Server)         │
│               FastAPI + Pydantic + SQLAlchemy          │
│                                                        │
│  Domain Layers (DDD):                                  │
│  ├─ player/    : Quản lý nhân vật, tọa độ, party       │
│  ├─ pokemon/   : Chỉ số, moveset, EXP, tiến hóa        │
│  ├─ map/       : Server validation vị trí & chunk      │
│  ├─ inventory/ : Quản lý túi đồ & vật phẩm             │
│  └─ battle/    : Đấu trận theo lượt, công thức damage  │
└────────────┬─────────────────────────────┬─────────────┘
             │                             │
    PostgreSQL Database              Redis Cache
    (Persistent Player Data)         (Session, Map States)
```

## Ranh giới trách nhiệm (Separation of Concerns)

1. **Frontend (`apps/web`):**
   - **Game Engine (Phaser 3):** Quản lý camera, nạp chunk streaming từ map generator, render sprite nhân vật, animation đi bộ/chạy, nhạc nền và SFX.
   - **Giao diện (UI/HUD):** Render khung thoại WindowSkin, bảng chọn lệnh battle, menu túi đồ Pokémon, thanh máu HP và thông báo quest.
   - **Client Store:** Quản lý state cục bộ để UI phản hồi tức thì (optimistic update khi thích hợp).

2. **Backend (`apps/server`):**
   - **Authoritative Server:** Client chỉ gửi input/hành động; server chịu trách nhiệm kiểm tra tính hợp lệ (vd: không thể đi xuyên vách núi, không thể dùng vật phẩm không có trong túi).
   - **Battle Engine:** Tính toán lượt đấu, tốc độ (Speed priority), công thức sát thương thế hệ 3, tỉ lệ bắt trúng (catch rate) trên server.

3. **Shared Packages (`packages/`):**
   - `shared-types`: Type definitions và interface đồng bộ giữa TypeScript (Web) và Pydantic (Server).
   - `game-data`: Bảng dữ liệu tĩnh về 151+ Pokémon, hiệu ứng chiêu thức (Moves), độ tương khắc thuộc tính (Type Chart), tỉ lệ bắt Pokémon theo từng vùng bụi cỏ.

4. **Tools & Pipelines (`tools/`):**
   - `map-generator`: Độc lập hóa công cụ sinh bản đồ thủ tục thành module có thể chạy batch render ra ảnh hoặc JSON metadata cho client.
   - `asset-pipeline`: Tự động cắt sprite, ghép atlas tileset, nạp WindowSkin và nén tối ưu.

## Quy tắc thiết kế

- **No God Objects:** Tuyệt đối không dồn code xử lý vào một file đơn lẻ. Tách biệt rõ ràng Scene, Entity, System, Domain Service và Repository.
- **Single Source of Truth:** Game data tĩnh (chỉ số Pokémon, moves) được định nghĩa tại `packages/game-data`.
- **Stateless Server Nodes:** Trạng thái phiên người chơi lưu tại Redis và PostgreSQL, giúp dễ dàng scale ngang khi cần.
