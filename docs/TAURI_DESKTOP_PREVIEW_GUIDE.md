# Hướng dẫn Dev — Desktop Preview bằng Tauri

**Trạng thái:** Kế hoạch triển khai preview, chưa thực hiện  
**Mục tiêu:** Chạy PokeOverworld như ứng dụng desktop độc lập, không cần mở Chrome/Google, để kiểm tra fullscreen và trải nghiệm game trên Windows.

Tài liệu này chỉ dành cho bản preview desktop. Không xem đây là bước hoàn tất backend hoặc bản phát hành production.

## 1. Kết quả cần đạt

Dev phải tạo được:

- Một cửa sổ desktop tên PokeOverworld.
- Chạy frontend hiện tại bên trong Tauri.
- Có thể bật/tắt fullscreen.
- Chạy development bằng Tauri window, không cần mở trình duyệt.
- Build được bản Windows preview.
- Không làm thay đổi logic gameplay hiện tại.
- Không đưa code Tauri vào các module domain/map/battle.

## 2. Môi trường đã kiểm tra

Môi trường hiện tại đã có:

- Node.js 24.x
- npm 11.x
- Rust 1.98.x
- Cargo 1.98.x

Tauri CLI chưa được cài và thư mục desktop chưa tồn tại.

## 3. Kiến trúc thư mục

Không di chuyển frontend hiện tại. Thêm lớp desktop riêng:

    E:/Pokemon/
    ├── apps/
    │   ├── web/
    │   └── desktop/
    │       └── src-tauri/
    ├── packages/
    └── docs/

Tauri chỉ là shell. Frontend vẫn nằm trong apps/web.

Không đặt battle engine, map generator hoặc game session vào src-tauri.

## 4. Cách khởi tạo

Có thể dùng Tauri CLI để khởi tạo backend cho frontend hiện có. Thực hiện từ root repository:

    npm install --save-dev @tauri-apps/cli
    npx tauri init

Khi CLI hỏi:

- App name: PokeOverworld
- Window title: PokeOverworld
- Web assets location: apps/web/dist
- Dev server URL: http://localhost:5173
- Frontend build command: npm run build:web
- Frontend dev command: npm run dev:web

Nếu cấu trúc monorepo làm CLI tạo src-tauri sai vị trí, phải di chuyển shell vào apps/desktop/src-tauri và cập nhật đường dẫn cấu hình. Không tạo thêm một frontend Vite thứ hai.

## 5. Cấu hình Vite

Vite phải bỏ qua thư mục Rust để tránh watch loop:

    server: {
      watch: {
        ignored: ['**/src-tauri/**'],
      },
    }

Không thêm middleware đặc biệt chỉ phục vụ dev mà không có phương án production tương ứng.

## 6. Cấu hình Tauri

Cấu hình Tauri phải dùng:

- Dev URL: http://localhost:5173
- Frontend dist: đường dẫn tới apps/web/dist
- Kích thước khởi đầu phù hợp game canvas.
- Resizable bật trong preview.
- Decorations bật ở bản preview đầu tiên để dễ debug.
- Fullscreen không bật cứng ngay từ lần đầu nếu cần quan sát lỗi khởi động.

Ví dụ định hướng:

    {
      "productName": "PokeOverworld",
      "version": "0.1.0",
      "build": {
        "beforeDevCommand": "npm run dev:web",
        "beforeBuildCommand": "npm run build:web",
        "devUrl": "http://localhost:5173",
        "frontendDist": "../../web/dist"
      }
    }

Đường dẫn thực tế phải được kiểm tra từ vị trí src-tauri/tauri.conf.json. Không sao chép máy móc nếu đặt src-tauri ở vị trí khác.

## 7. Fullscreen

Fullscreen phải là khả năng của desktop shell, không trộn vào battle/map logic.

Yêu cầu:

- Có phím hoặc nút bật/tắt fullscreen.
- Có thể thoát fullscreen bằng phím Esc.
- Canvas giữ đúng tỉ lệ, không méo pixel.
- UI scale theo viewport.
- Không cắt HUD hoặc canvas ở màn hình 16:9.
- Kiểm tra tối thiểu 1280×720 và 1920×1080.

Có thể dùng API cửa sổ của Tauri cho thao tác fullscreen. Nếu cần lưu trạng thái cửa sổ, chỉ thêm window-state plugin sau khi preview cơ bản chạy ổn.

## 8. Asset bắt buộc kiểm tra

Bản build hiện tại vẫn còn cảnh báo các path:

    /Graphics/Fonts/...
    /Graphics/Pokedex/...

Dev phải phân loại:

1. Asset đã có manifest và có thể resolve production.
2. Asset legacy chỉ chạy nhờ Vite dev middleware.
3. Asset cần chuyển/copy vào public/assets.
4. Asset cần resolver theo asset key.

Không kết luận desktop preview production-ready nếu còn asset chỉ chạy qua serveGraphicsPlugin.

Trong phase preview, nếu cần workaround tạm thời:

- Ghi rõ trong tài liệu.
- Không sửa ngầm đường dẫn gameplay.
- Tạo issue/task cho asset resolver.
- Đảm bảo bản build vẫn báo rõ asset nào chưa resolve.

## 9. Script cần thêm

Đề xuất root package.json:

    "desktop:dev": "npx tauri dev",
    "desktop:build": "npx tauri build"

Nếu Tauri nằm trong apps/desktop thì dùng workspace command tương ứng. Không hardcode đường dẫn theo ổ đĩa cá nhân.

## 10. Quy trình chạy preview

Từ root:

    npm run desktop:dev

Kiểm tra:

- Tauri tự khởi động Vite.
- Cửa sổ desktop mở.
- Game map render.
- Player movement hoạt động.
- Ecology overlay hoạt động.
- Battle preview mở được.
- Pokedex mở được.
- Font và sprite không bị mất.
- Resize/fullscreen không làm hỏng layout.

Không mở Chrome như một bước bắt buộc của quy trình nghiệm thu.

## 11. Quy trình build Windows

Trước build:

    npm run validate:schemas
    npm run typecheck:web
    npm run test:web
    npm run build:web

Sau đó:

    npm run desktop:build

Kiểm tra output bundle trong thư mục target/release/bundle hoặc đường dẫn tương ứng do Tauri tạo.

Bản preview phải được chạy trên máy Windows sạch hoặc môi trường không có dev server để xác nhận app không phụ thuộc localhost.

## 12. Quy tắc không được vi phạm

- Không thêm logic gameplay vào Rust shell.
- Không đưa API Tauri vào ecology, battle domain hoặc renderer nếu chưa có lý do rõ ràng.
- Không dùng đường dẫn tuyệt đối như E:/Pokemon trong config.
- Không dùng Chrome automation để giả lập desktop preview.
- Không coi Tauri shell là backend authoritative.
- Không thêm database vào phase fullscreen preview.
- Không đổi seed/world generation chỉ để sửa vấn đề hiển thị desktop.
- Không commit thư mục target, dist hoặc binary preview nếu repository chưa quy định.

## 13. Kiểm thử nghiệm thu

### Desktop shell

- App mở khi không chạy Chrome.
- App mở khi không chạy Vite thủ công.
- App đóng không để process treo.
- Fullscreen bật/tắt được.
- Resize không làm crash.
- Esc thoát fullscreen hoặc đóng modal đúng hành vi.

### Game

- Map chunk load đúng.
- Player movement đúng.
- Collision đúng.
- Water animation chạy.
- Village render đúng.
- Battle preview chạy.
- Pokedex mở và đóng được.
- Asset không bị 404 trong production bundle.

### CI

Tauri preview không được làm hỏng:

    npm run lint
    npm run format:check
    npm run typecheck:web
    npm run test:web
    npm run test:python
    npm run validate:schemas
    npm run build:web

## 14. Definition of Done

Desktop Preview chỉ được xem là hoàn tất khi:

- Có cấu trúc src-tauri rõ ràng.
- Có script desktop:dev và desktop:build.
- Chạy được game trong cửa sổ desktop độc lập.
- Fullscreen hoạt động.
- Build Windows thành công.
- Có biên bản asset warning còn tồn tại.
- Không làm thay đổi gameplay ngoài phạm vi.
- Tài liệu tiến độ ghi đúng trạng thái preview, không ghi là production release.
- Có hướng xử lý riêng cho asset resolver và backend sau phase preview.

## 15. Tài liệu tham khảo

- Tauri Create Project: https://v2.tauri.app/start/create-project/
- Tauri Vite integration: https://tauri.app/start/frontend/vite/
- Tauri Window Customization: https://v2.tauri.app/learn/window-customization/
- Tauri Window State plugin: https://v2.tauri.app/plugin/window-state/

