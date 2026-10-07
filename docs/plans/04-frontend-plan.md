# 04. Kế hoạch frontend

## Trạng thái

**ĐÃ TRIỂN KHAI & TIẾP TỤC HOÀN THIỆN** (Xem chi tiết tại [DEV_ARCHITECTURE_GUIDE.md](file:///e:/Pokemon/docs/DEV_ARCHITECTURE_GUIDE.md)).

## Công nghệ thực tế

- **Ngôn ngữ:** TypeScript thuần (strict mode, không dùng `any`).
- **Render Engine:** HTML5 Canvas 2D render loop (vẽ địa hình, chunk, bóng đổ, sprite sinh vật) kết hợp High-DPI DOM overlay (cho hộp thoại chữ sắc nét, bảng tin, Pokédex, PC Storage, Party UI).
- **Kiến trúc:** Client-only, offline-first. Domain-driven design tách rời logic nghiệp vụ khỏi tầng hiển thị.
- **Bundler & Tooling:** Vite 6, Vitest, ESLint (TypeScript-ESLint), Prettier.
- **Desktop Wrapper:** Tauri v2 (Rust shell).
- *Lưu ý:* Dự án **không sử dụng Phaser hay React** nhằm tối ưu hóa hiệu năng, giảm bundle size và kiểm soát 100% vòng đời bộ nhớ và render loop.

## Các tầng module chính (`apps/web/src`)

- `core/`: time loop, camera, math, rng.
- `world/`: maps, chunks, procedural generation, collisions, entities, ai.
- `rendering/`: ground renderer, object renderer, character renderer.
- `domain/`: models & services (party, pc storage, inventory, save game).
- `battle/`: rules (hàm thuần Gen 7), state, controller, renderer, animation.
- `ui/`: pokedex, storage-screen, party-screen, bag-screen, dialog overlay.
- `platform/`: audio player, local storage persistence, desktop shell.
