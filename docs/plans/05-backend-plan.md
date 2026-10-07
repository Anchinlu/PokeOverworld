# 05. Kế hoạch backend

## Trạng thái

**TẠM HOÃN (Deferred)** theo quyết định kiến trúc D2 (xem [DEV_ARCHITECTURE_GUIDE.md](file:///e:/Pokemon/docs/DEV_ARCHITECTURE_GUIDE.md)).
Dự án định hướng Client-only, offline-first. Toàn bộ logic nghiệp vụ (save game, party, pc, inventory, battle rules) được viết thuần TypeScript ở lớp `domain/` phía client, bảo đảm có thể chuyển sang authoritative server khi có yêu cầu chế độ multiplayer.

## Công nghệ dự kiến

- FastAPI.
- PostgreSQL.
- SQLAlchemy hoặc SQLModel.
- Alembic.
- Redis.
- REST API và WebSocket.

## Tầng xử lý

```text
Router -> Service -> Repository -> Database
```

## Module dự kiến

- Authentication.
- Player profile.
- Save game.
- Pokemon.
- Inventory.
- Battle.
- Quest.
- Map state.

## Quy tắc

Router chỉ xử lý HTTP và validation đầu vào. Logic nghiệp vụ phải nằm trong service.
