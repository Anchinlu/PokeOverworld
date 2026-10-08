# 04. Kế hoạch frontend (giao diện và game)

## Trạng thái

**ĐÃ TRIỂN KHAI VÀ TIẾP TỤC HOÀN THIỆN.** Xem [DEV_ARCHITECTURE_GUIDE.md](../DEV_ARCHITECTURE_GUIDE.md).

## Công nghệ thực tế

- **Ngôn ngữ:** TypeScript thuần (strict, không dùng `any`).
- **Render:** HTML5 Canvas 2D (địa hình, chunk, bóng đổ, sprite) kết hợp DOM overlay độ nét cao (hội thoại, Pokédex, PC Storage, Party).
- **Kiến trúc:** domain-driven; luật chơi và nghiệp vụ tách khỏi hiển thị; phiên chơi qua `SessionPort`.
- **Công cụ:** Vite, Vitest, ESLint (typescript-eslint), Prettier.
- **Đóng gói:** **Tauri v2, chỉ phát hành bản desktop.** `apps/web` chạy trong webview; chạy bằng trình duyệt chỉ để phát triển.
- Dự án **không dùng Phaser hay React**.

## Các tầng module chính (`apps/web/src`)

- `core/`: time loop, camera, math, rng.
- `world/` (hiện là `maps/`): sinh địa hình, chunk, va chạm, entities, ai.
- `rendering/`: ground, object, character renderer.
- `domain/`: mô hình và service (party, pc, inventory, save).
- `battle/`: rules (Gen 7), state, controller, renderer, animation.
- `session/` *(đề xuất)*: `SessionPort`, `LocalSession`, `HostSession`, `RemoteSession`.
- `net/protocol/` *(đề xuất)*: message và schema.
- `ui/`: pokedex, storage, party, bag, dialog, lobby *(đề xuất)*.
- `platform/`: audio, file save, net transport, shell.

## Màn hình mới cần có khi làm mạng

- **Lobby:** "Mở thế giới cho người khác" (hiện mã mời, danh sách người đang vào, nút đuổi) và "Vào thế giới" (dán mã mời).
- Hiển thị người chơi khác trong thế giới (sprite, tên, Pokémon theo sau) và khung chat.
