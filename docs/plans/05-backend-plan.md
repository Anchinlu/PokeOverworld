# 05. Kế hoạch backend

## Trạng thái

Kế hoạch בלבד. Chưa triển khai.

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
