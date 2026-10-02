# 09. Kế hoạch API contract

## Trạng thái

Kế hoạch בלבד. Chưa triển khai.

## API dự kiến

```text
POST /auth/register
POST /auth/login
GET  /player/profile
GET  /player/save
PUT  /player/save
GET  /maps/{map_id}
GET  /pokemon/species
GET  /items
POST /encounters/start
POST /encounters/{id}/action
POST /pokemon/catch
GET  /inventory
POST /inventory/use
GET  /quests
POST /quests/{id}/progress
```

## Quy tắc contract

- Request và response có schema rõ ràng.
- Có mã lỗi ổn định.
- Có version API.
- Không gửi dữ liệu nội bộ hoặc thông tin nhạy cảm.
- Shared types được quản lý riêng với frontend và backend.
