# 07. Kế hoạch hệ thống gameplay

## Trạng thái

Kế hoạch בלבד. Chưa triển khai.

## Hệ thống dự kiến

1. Movement và collision.
2. Map transition.
3. NPC và dialog.
4. Interaction.
5. Wild encounter.
6. Battle.
7. Catch Pokemon.
8. Experience và level.
9. Inventory.
10. Quest.
11. Save/load.

## Quy tắc thiết kế

- Mỗi hệ thống có interface rõ ràng.
- Battle không phụ thuộc trực tiếp vào renderer.
- Inventory không biết chi tiết UI.
- Collision dùng dữ liệu map, không tự đọc asset hình ảnh.
- Kết quả gameplay quan trọng phải kiểm chứng được.
