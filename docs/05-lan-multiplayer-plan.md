# 05. Kế hoạch chơi online qua LAN/VPN (thay cho kế hoạch backend)

## Trạng thái

**CHƯA TRIỂN KHAI.** Thay thế `05-backend-plan.md` (đã bỏ hướng FastAPI/PostgreSQL/Redis). Căn cứ: [DEV_ARCHITECTURE_GUIDE.md](../DEV_ARCHITECTURE_GUIDE.md), mục 1.2 (D2, D4, D7–D9) và mục 2.5.

## Mục tiêu

Một người mở thế giới của mình (host); người khác trong cùng mạng LAN, hoặc cùng mạng ảo như Radmin VPN, nhập địa chỉ để vào chơi chung. Không có máy chủ riêng, tài khoản hay cơ sở dữ liệu.

## Kiến trúc

- Host: lớp Rust mở cổng WebSocket; `HostSession` (TypeScript, trong webview) giữ trạng thái thế giới chung.
- Khách: `RemoteSession` mở WebSocket từ webview tới `IP:cổng` của host.
- Chơi một mình: `LocalSession`, không dùng mạng.
- Mọi thay đổi trạng thái thế giới chung đi qua `SessionPort`.

## Phạm vi theo giai đoạn

| Giai đoạn | Nội dung |
|---|---|
| S | `SessionPort`, `LocalSession`; lưu bằng file (Tauri fs) |
| N0 | Spike: Rust mở cổng, hai máy trao đổi tin nhắn, kiểm tra CSP, firewall, Radmin VPN |
| N1 | Host/khách, `hello`/`welcome`, mã mời, thấy người chơi khác di chuyển, chat |
| N2 | PvP (host làm trọng tài), giao dịch Pokémon hai bước |
| N3 | Tùy chọn: nhân vật gắn thế giới, host quyết định gặp Pokémon/EXP/túi đồ |
| N4 | Tùy chọn: tự dò máy trong LAN, đuổi/chặn, danh sách người chơi |

## Quyết định còn mở

- Phương án truyền tải (Rust WebSocket, WebRTC, hay sidecar): đề xuất Rust WebSocket, chốt sau spike N0.
- Nhân vật mang theo hay gắn thế giới (D8): đề xuất mang theo cho v1.
- Có mật khẩu phòng hay không, và số người tối đa.

## Rủi ro cần kiểm tra sớm

CSP chưa có `connect-src`; host bị giảm tốc khi thu nhỏ cửa sổ; firewall và hồ sơ mạng của adapter VPN; độ trễ và kết nối lại; khác phiên bản ứng dụng/dữ liệu; sinh thế giới phải cho cùng kết quả ở hai máy. Chi tiết ở mục 2.5.8 của hướng dẫn kiến trúc.

## Quy tắc

- Không tin dữ liệu từ mạng: schema, giới hạn kích thước và tần suất.
- Rust chỉ làm truyền tải và truy cập file; luật chơi ở TypeScript.
- Không khuyến khích mở cổng ra internet công khai.
