# 09. Giao thức mạng host–khách (thay cho API contract)

## Trạng thái

**Kế hoạch, chưa triển khai.** Thay thế `09-api-contract.md` (REST/server). Chi tiết thiết kế ở mục 2.5.4 của [DEV_ARCHITECTURE_GUIDE.md](../DEV_ARCHITECTURE_GUIDE.md).

## Truyền tải

- WebSocket, khung văn bản JSON ở giai đoạn đầu.
- Khách kết nối tới `ws://<IP host>:<cổng>`; cổng do host chọn.
- Mã mời gói `IP:cổng` (+ mật khẩu phòng nếu có).

## Bắt tay

Khách gửi `hello` gồm `protocolVersion`, `appVersion`, mã băm dữ liệu game, tên, `playerKey`. Host trả `welcome` (seed, `worldGenVersion`, tên thế giới, danh sách người chơi) hoặc `reject` kèm lý do (`version`, `data`, `full`, `password`, `banned`).

## Message dự kiến (giai đoạn N1)

| Hướng | Message | Ý nghĩa |
|---|---|---|
| khách → host | `hello` | Xin vào phòng |
| khách → host | `step` | Bước đi một ô (có `seq`, `from`, `to`, `dir`) |
| khách → host | `follower` | Pokémon đang theo sau |
| khách → host | `chat` | Tin nhắn |
| host → khách | `welcome` / `reject` | Kết quả bắt tay |
| host → khách | `player_joined` / `player_left` | Người vào/rời |
| host → khách | `player_step` | Người chơi khác đi một ô |
| host → khách | `correction` | Host từ chối bước đi, đặt lại vị trí |
| host → khách | `chat` | Tin nhắn kèm người gửi |

Giai đoạn N2 thêm message cho PvP (hành động chiến đấu, danh sách sự kiện) và giao dịch (đề nghị, xác nhận, hoàn tất).

## Quy tắc

- Mọi message có schema; kiểm tra ở cả hai phía.
- Giới hạn kích thước và tần suất theo từng khách; vi phạm thì ngắt kết nối.
- Đổi giao thức phải tăng `protocolVersion`; khác phiên bản thì từ chối vào phòng.
- Host kiểm tra bước đi: ô liền kề, đi được (dùng chung hàm địa hình), tốc độ hợp lệ.
- Không gửi dữ liệu nội bộ của host (đường dẫn file, thông tin máy).
- Kết quả chiến đấu là danh sách sự kiện có cấu trúc, không phải chuỗi thông báo.
