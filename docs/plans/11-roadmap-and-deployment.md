# 11. Roadmap và triển khai

## Trạng thái

Kế hoạch בלבד. Chưa triển khai.

## Milestone

### M1 - Nền tảng

- Chuẩn hóa repository.
- Tách generator.
- Frontend game shell.
- Test nền tảng.

### M2 - Offline vertical slice

- Một map.
- Player movement.
- NPC, dialog và quest đơn giản.
- Save local.

### M3 - Backend

- Authentication.
- Profile.
- Save/load server.
- Inventory.

### M4 - Gameplay chính

- Encounter.
- Battle.
- Catch Pokemon.
- Experience.

### M5 - Production

- Docker production.
- Database backup.
- Monitoring.
- CI/CD.

## Môi trường dự kiến

- `development`: chạy local bằng Docker Compose.
- `staging`: kiểm thử tích hợp.
- `production`: backend, database, cache và asset storage riêng.

## Quy tắc triển khai

Chưa tạo server, database, pipeline hoặc container production nếu chưa có yêu cầu triển khai tương ứng.
