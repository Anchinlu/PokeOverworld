# Player System Plan

## Mục tiêu

Xây dựng hệ thống nhân vật Player có ranh giới rõ ràng giữa:

- dữ liệu hồ sơ người chơi;
- trạng thái runtime của nhân vật trong overworld;
- input, movement và collision;
- tương tác với thế giới;
- lưu trữ và đồng bộ về sau với backend authoritative.

Tài liệu này là kế hoạch kiến trúc. Các phần ghi `PLANNED` chưa được xem là đã triển khai.

## Hiện trạng

Đã có:

- `entities/player.ts`: di chuyển theo grid, nội suy vị trí, hướng nhìn, chạy và idle animation;
- `domain/player/player-service.ts`: profile, tiền, huy hiệu, Pokédex, inventory và vị trí;
- `game/game-session.ts`: điều phối input, collision, chunk, camera, follower, encounter và world clock;
- `domain/save/save-repository.ts`: lưu profile, party, inventory, PC và world position;
- `shared-types/api-contract.ts`: `PlayerState` cho movement snapshot cơ bản.

Giới hạn hiện tại:

- `GameSession` vẫn là coordinator lớn, chưa tách `PlayerController` và `MovementSystem`;
- runtime `Player` và profile domain chưa dùng chung một aggregate state;
- `PlayerState` chưa mô tả appearance, progression, interaction hoặc movement command;
- profile load từ JSON chưa có validation runtime đầy đủ;
- idle animation của Player còn dùng random trực tiếp, chưa hoàn toàn deterministic;
- backend chưa tồn tại, nên các port persistence/network hiện chỉ là contract.

## Contract dùng chung

Các kiểu nền tảng được định nghĩa tại:

`packages/shared-types/player-domain.ts`

Nhóm contract gồm:

- `PlayerIdentity`: ID, tên hiển thị, giới tính;
- `PlayerAppearance`: trainer sprite, palette, outfit và accessory;
- `PlayerProgression`: tiền, huy hiệu, Pokédex, story flags và quest flags;
- `PlayerRuntimeState`: vị trí, movement và animation runtime;
- `PlayerDomainState`: aggregate state có `schemaVersion`;
- `PlayerMovementPort`: boundary cho movement controller;
- `PlayerPersistencePort`: boundary cho local save hoặc backend;
- `PlayerInteractionPort`: boundary cho tương tác với world objects/NPC/items.

Các contract này chỉ định nghĩa giao tiếp. Chúng chưa thay thế class `Player`, `PlayerService` hoặc `SaveGameRepository` hiện tại.

## Nguyên tắc triển khai

1. Giữ nguyên behavior đang chạy trước khi refactor.
2. Tách từng vertical slice hoàn chỉnh, không tạo module rỗng hàng loạt.
3. Asset key, save format và API cũ phải được giữ tương thích trong giai đoạn chuyển tiếp.
4. Mọi dữ liệu load từ storage/network phải được validate trước khi đưa vào runtime.
5. Movement simulation và render animation không được trộn trong cùng một trách nhiệm.
6. Không đưa logic server vào client; client chỉ dùng adapter local cho tới khi backend được xây dựng.

## Lộ trình

### P0 — Ổn định lõi Player

Trạng thái: `PLANNED`

- tạo `PlayerRuntimeMapper` giữa `Player` và `PlayerRuntimeState`;
- chuyển idle random sang seeded/random service được inject;
- thêm validation cho `Direction`, tọa độ và `stepProgress`;
- bổ sung test movement: bước hợp lệ, bị chặn, chạy, snap và restore.

### P1 — Tách movement và input

Trạng thái: `PLANNED`

- `PlayerController`: nhận command từ input;
- `MovementSystem`: xử lý grid movement, speed và collision;
- `PlayerAnimationController`: quyết định frame, không tự thay đổi vị trí;
- `GameSession` chỉ điều phối các system.

### P2 — Tương tác overworld

Trạng thái: `PLANNED`

- chuẩn hóa `PlayerInteractionRequest`;
- adapter cho Pokémon hoang dã, berry, NPC, item, cửa và warp;
- xử lý lock input khi battle hoặc modal UI đang mở;
- test phạm vi tương tác và thứ tự ưu tiên target.

### P3 — Persistence và migration

Trạng thái: `PLANNED`

- map `PlayerDomainState` sang save V3 hiện tại;
- thêm schema validation và migration version;
- không lưu các trạng thái render tạm thời nếu không cần thiết;
- hỗ trợ local adapter trước, backend adapter sau.

### P4 — Trainer progression

Trạng thái: `PLANNED`

- story flags, quest flags, badges và unlocks;
- appearance/outfit/accessory;
- map transition, spawn point và checkpoint;
- achievements và statistics.

### P5 — Backend authoritative

Trạng thái: `PLANNED`

- triển khai `PlayerPersistencePort` bằng API server;
- server xác thực movement command, inventory, progression và save state;
- client prediction/interpolation chỉ được bổ sung sau khi contract server ổn định.

## Không triển khai trong giai đoạn contract

- chưa thay thế `Player` class;
- chưa tách `GameSession`;
- chưa tạo backend;
- chưa thay đổi save format hiện tại;
- chưa thêm appearance UI hoặc quest gameplay.

## Tiêu chí hoàn thành Player Core

- movement, collision và animation có test độc lập;
- không còn `Math.random()` trong Player runtime;
- runtime snapshot và save profile có mapper rõ ràng;
- mọi input được chuyển thành command có kiểu;
- GameSession không trực tiếp chứa toàn bộ movement logic;
- save/load giữ đúng vị trí, hướng và tiến trình qua migration;
- backend có thể thay local adapter mà không sửa gameplay domain.
