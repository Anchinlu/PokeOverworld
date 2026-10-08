# Hướng dẫn phát triển: Kiến trúc, tổ chức file, tối ưu và định hướng

- **Phạm vi:** PokeOverworld (`apps/web`, `apps/desktop`, `packages/*`)
- **Cơ sở:** mã nguồn tại commit `a24a12d4` (07/10/2026)
- **Định hướng đã chốt:** ứng dụng **desktop (Tauri)**; chơi online theo kiểu **mạng LAN/VPN**: một người mở thế giới (host), người khác nhập địa chỉ để vào. **Không có máy chủ riêng, tài khoản hay cơ sở dữ liệu**
- **Trạng thái tài liệu:** đề xuất. Mục cần chủ dự án quyết định được đánh dấu **[QUYẾT ĐỊNH]**
- **Thay thế:** bản hướng dẫn trước (client-only, rồi client–server). Các phần đã làm xong được ghi ở mục 7

---

## 1. Định hướng dự án

### 1.1 Hiện trạng thực tế

| Hạng mục | Thực tế trong code |
|---|---|
| Phát hành | Tauri v2, đóng gói `nsis` (chỉ Windows). `apps/web` là mã giao diện chạy trong webview |
| Backend | Không có `apps/server`, không có CSDL |
| Mạng | Chỉ một `fetch` nạp manifest asset. Chưa có WebSocket |
| Lớp Rust (`src-tauri`) | 31 dòng (`lib.rs`, `main.rs`), không có lệnh nào, quyền `core:default` |
| CSP trong `tauri.conf.json` | `default-src 'self'; media-src ...; style-src ...; script-src ...`, **không có `connect-src`** |
| Lưu game | `localStorage` qua `domain/save` |
| Kiểm thử | 128 test (16 file) pass; ESLint cho TypeScript đã bật (0 lỗi, 9 cảnh báo); `npm ci` chạy được |
| Chiến đấu | Đã áp dụng luật Gen 7: thứ tự lượt theo tốc độ/ưu tiên, sát thương cố định và OHKO, recoil/drain theo sát thương thực, Struggle, chỉ trừ PP khi ra đòn, lên cấp tính lại chỉ số |

### 1.2 Quyết định định hướng

| Mã | Quyết định đề xuất | Lý do |
|---|---|---|
| D1 | **Chỉ phát hành bản desktop (Tauri v2).** `apps/web` chỉ là mã giao diện chạy trong Tauri; chạy bằng trình duyệt chỉ để phát triển | Theo yêu cầu |
| D2 | **Online kiểu host (listen server):** người chơi mở thế giới của mình, người khác vào bằng IP trong cùng mạng LAN hoặc qua mạng ảo (Radmin VPN, Hamachi...). Không có máy chủ chuyên dụng, tài khoản, CSDL | Theo yêu cầu; đơn giản, không tốn chi phí vận hành |
| D3 | **Chuẩn luật chiến đấu: Gen 7** (đã áp dụng ở commit `7b1b4c63`) | Thống nhất một đời game |
| D4 | **Toàn bộ logic game, kể cả phiên host, viết bằng TypeScript** chạy trong webview. **Rust chỉ làm tầng truyền tải (mở cổng, WebSocket) và truy cập file.** Không dùng Node sidecar | Một ngôn ngữ cho luật chơi; tránh đóng gói thêm runtime |
| D5 | **Thứ tự ưu tiên:** (1) hoàn thiện chiến đấu cơ bản (sự kiện có cấu trúc, đường cong EXP chuẩn), (2) bước B (ranh giới lớp) và `SessionPort`, (3) lưu bằng file, (4) hiệu năng còn lại (H3–H5), (5) mạng N0–N3, (6) overworld v2 | Mạng phải xây trên nền luật và phiên đã sạch |
| D6 | **Mọi thay đổi trạng thái thế giới chung đi qua `SessionPort`**, kể cả chơi một mình (`LocalSession`) | Một đường code cho solo và nhiều người |
| D7 | **Mô hình tin cậy: chơi với bạn bè.** Host là nguồn sự thật của thế giới chung. Kiểm tra hợp lệ ở mức đủ dùng, không nhắm chống gian lận ở quy mô máy chủ công khai | Phù hợp LAN/VPN |
| D8 | **Nhân vật [QUYẾT ĐỊNH]:** mang nhân vật của mình vào (v1, đơn giản) hay gắn với thế giới trên máy host (chống sửa file, mục 2.5.5) | Ảnh hưởng thiết kế lưu trữ và giao dịch |
| D9 | **Kết nối bằng `IP:cổng` + mã mời.** Tự dò máy trong LAN chỉ là tùy chọn sau này | Broadcast thường không đi qua mạng ảo |
| D10 | **Lưu bằng file** trong thư mục dữ liệu ứng dụng (Tauri fs) cho thế giới và nhân vật, thay cho `localStorage` | Dễ sao lưu, chia sẻ thế giới, không bị xoá cùng cache webview |
| D11 | **Tất định sinh thế giới:** hiện chỉ phát hành Windows (WebView2/V8), rủi ro thấp. Nếu thêm macOS/Linux thì sinh thế giới mới **không dùng** `Math.sin/cos/...` và phải có test golden-file | Hai máy phải ra cùng một bản đồ từ cùng một seed |

> Không còn kế hoạch FastAPI/PostgreSQL/Redis. Hai tài liệu `05-backend-plan.md` và `09-api-contract.md` được thay bằng `05-lan-multiplayer-plan.md` và `09-network-protocol.md`.

---

## 2. Kiến trúc

### 2.1 Các tầng và hướng phụ thuộc

```
L5  ui · game · bootstrap (composition root)
L4  battle/session · session (SessionPort, LocalSession, HostSession, RemoteSession) · rendering
L3  world (maps, chunks, entities, ai) · battle/rules (hàm thuần)
L2  domain (mô hình + service: party, pc, inventory, player, save)
L1  data (catalog, JSON) · packages/shared-types · packages/game-data · net/protocol (schema message)
L0  core (rng, camera, time)

platform/  audio · file save (Tauri fs) · net transport · shell (Tauri): adapter, chỉ được tạo ở L5 và truyền xuống
```

### 2.2 Quy tắc bắt buộc

1. **Chỉ import xuống dưới** (hoặc cùng tầng, cùng module). Cấm import ngược lên.
2. **Cấm vòng import.** Mọi vòng phải bị CI chặn.
3. `domain/`, `battle/rules/`, `world/` và `net/protocol` **không import** `ui/`, `rendering/`, không dùng trực tiếp `window`, `document`, `localStorage`, WebSocket. Lưu trữ và mạng đi qua interface, bản triển khai nằm ở `platform/`.
4. **Singleton chỉ khởi tạo ở composition root** (`bootstrap.ts`) rồi truyền xuống bằng constructor. Singleton hiện có (`partyService`, `*.getInstance()`) giữ tạm; **code mới không import trực tiếp**.
5. **Mọi ngẫu nhiên đi qua RNG được tiêm vào.** Không `Math.random()` hay `Date.now()` trong luật chơi.
6. **Luật chơi là hàm thuần:** nhận trạng thái và đầu vào, trả kết quả. Hoạt ảnh, âm thanh, hộp thoại thuộc session hoặc view.
7. **Mô hình dữ liệu dùng chung** (`BattleMove`, `StatusCondition`, `BattlerPokemon`, `PartyPokemon`) nằm ở `domain/model/` hoặc `packages/shared-types`, không nằm trong `battle/`.
8. **Không toạ độ pixel gắn cứng trong controller.** Hit-test thuộc về view (bảng vùng bấm khai báo bằng dữ liệu).
9. **Thay đổi trạng thái thế giới chung (vị trí, gặp Pokémon, giao dịch, PvP) đi qua `SessionPort`**, không gọi thẳng service từ UI.
10. **Không tin dữ liệu từ mạng:** mọi message nhận về đi qua schema, kiểm tra kích thước, tần suất và giá trị hợp lệ.

### 2.3 Các vi phạm hiện có (kiểm tra lại ở `a24a12d4`)

| # | Vi phạm | Hiện trạng | Cách sửa |
|---|---|---|---|
| V1 | `domain` ↔ `battle` phụ thuộc hai chiều | **Còn** (`domain → battle`: 4 import) | Chuyển mô hình dùng chung vào `domain/model/` |
| V2 | Mô hình domain nằm trong `battle/types.ts` | **Còn** (fan-in 18, cao nhất repo) | Như V1; để `battle/types.ts` re-export tạm |
| V3 | `battle` import `ui` | **Còn** (3 import) | Tiêm cổng `openPartySelect`, `openBag`, `playCry` |
| V4 | `assets` import `rendering` | **Còn** | Đặt `AssetLoader` ở `assets/` hoặc `platform/` |
| V5 | Vòng import `terrain-rules` ↔ `village-rules` | **Còn** (vòng duy nhất) | Tách `terrain-primitives.ts` |
| V6 | Singleton toàn cục | **Còn** | Khởi tạo ở composition root |
| V7 | Hit-test pixel gắn cứng trong `battle-controller` | Chưa kiểm tra lại | Bảng vùng bấm trong view |

### 2.4 Cổng mẫu cho battle

```ts
// battle/session/ports.ts
export interface BattleUiPort {
  selectParty(opts: { currentUid?: string }): Promise<PartyPokemon | null>;
  openBag(): Promise<ItemChoice | null>;
  playCry(speciesKey: string): void;
}

export interface BattlePartyPort {
  getParty(): readonly PartyPokemon[];
  syncResult(battler: BattlerPokemon, expGained: number): SyncResult;
}

// Tiêm khi khởi tạo (composition root):
new BattleController({ ui: uiPort, party: partyService, rng: new SeededBattleRng(seed) });
```

### 2.5 Mô hình online kiểu host (LAN/VPN)

#### 2.5.1 Tổng quan

Người chơi nào cũng chạy cùng một ứng dụng. Khi bấm **"Mở thế giới cho người khác"**, máy đó trở thành host: lớp Rust mở một cổng WebSocket, còn luật và trạng thái thế giới chung chạy trong webview của host bằng TypeScript. Máy khách mở WebSocket thẳng từ webview tới `IP:cổng` của host.

```
Máy host (Tauri)                                      Máy khách (Tauri)
┌─────────────────────────────────┐                  ┌──────────────────────────┐
│ webview: game + HostSession     │                  │ webview: game            │
│        ▲  sự kiện / lệnh        │                  │        RemoteSession     │
│        ▼                        │                  │             │            │
│ Rust: WebSocket server  ◄───────┼── LAN / Radmin ──┼─► WebSocket client       │
└─────────────────────────────────┘                  └──────────────────────────┘
```

Chơi một mình dùng `LocalSession` (xử lý tại chỗ, không có mạng). Người chơi của chính host nói chuyện với `HostSession` trực tiếp trong tiến trình, không qua socket.

#### 2.5.2 `SessionPort`

```ts
// session/session-port.ts
export interface SessionPort {
  readonly role: 'solo' | 'host' | 'guest';
  getWorldInfo(): WorldInfo;                              // seed, worldGenVersion, tên thế giới
  sendIntent(intent: PlayerIntent): void;                 // bước đi, vào trận, hành động chiến đấu...
  onEvent(handler: (e: SessionEvent) => void): () => void;
}
```

| Bản triển khai | Dùng khi | Nhiệm vụ |
|---|---|---|
| `LocalSession` | Chơi một mình | Xử lý intent tại chỗ, phát sự kiện |
| `HostSession` | Đang mở thế giới | Bọc `LocalSession`, nhận intent của khách qua Rust, kiểm tra và phát sự kiện cho mọi người |
| `RemoteSession` | Đang vào thế giới người khác | Gửi intent qua WebSocket, nhận sự kiện, không tự quyết trạng thái chung |

UI và renderer chỉ biết `SessionPort`, nên thêm mạng không buộc viết lại giao diện.

#### 2.5.3 Cách kết nối và truyền tải **[QUYẾT ĐỊNH]**

| Phương án | Ưu | Nhược |
|---|---|---|
| **A. Máy chủ WebSocket viết bằng Rust trong `src-tauri`** (đề xuất) | Webview không thể tự lắng nghe cổng nên đây là cách trực tiếp; khách chỉ cần WebSocket có sẵn trong webview | Cần viết và kiểm thử code Rust mạng; chưa chọn thư viện |
| B. WebRTC data channel, trao đổi mã kết nối bằng tay (dán mã) | Không cần mở cổng thủ công | Quy trình dán mã bất tiện; phụ thuộc cấu hình ICE; vẫn có thể vướng firewall |
| C. Node sidecar đóng gói cùng ứng dụng | Viết server bằng TypeScript | Phải đóng gói runtime, tăng dung lượng, thêm tiến trình cần quản lý |

Chi tiết cần có ở phương án A:
- Host chọn cổng (cổng mặc định chọn khi triển khai, cho phép đổi). Rust ghép nối với webview của host bằng sự kiện và lệnh Tauri.
- **Mã mời:** gói `IP:cổng` (+ mật khẩu phòng nếu có) thành một chuỗi ngắn để gửi qua chat; khách dán vào ô "Vào thế giới".
- Windows Defender Firewall sẽ hỏi quyền khi ứng dụng bắt đầu lắng nghe. Cần cho phép đúng loại mạng; adapter của Radmin VPN có thể bị Windows xếp vào hồ sơ mạng khác với LAN thường.
- Khám phá tự động (UDP broadcast/mDNS) chỉ là tính năng bổ sung; không dựa vào nó vì mạng ảo có thể không chuyển broadcast.

#### 2.5.4 Giao thức

`net/protocol` định nghĩa mọi message, có `protocolVersion`, và schema dùng để kiểm tra ở cả hai phía. Khi vào phòng, khách và host trao đổi `hello` gồm phiên bản giao thức, phiên bản ứng dụng và mã băm dữ liệu game (`game-data`); khác nhau thì từ chối kèm lý do rõ ràng.

Game dùng lưới ô nên chỉ cần gửi **bước đi từng ô**, không cần gửi vị trí mỗi khung hình:

```ts
type Side = 'player' | 'enemy';

// khách -> host
type PlayerIntent =
  | { k: 'hello'; protocolVersion: number; appVersion: string; dataHash: string; name: string; playerKey: string }
  | { k: 'step'; seq: number; from: [number, number]; to: [number, number]; dir: 'up' | 'down' | 'left' | 'right' }
  | { k: 'follower'; speciesKey: string | null }
  | { k: 'chat'; text: string };

// host -> khách
type SessionEvent =
  | { k: 'welcome'; seed: number; worldGenVersion: number; worldName: string; players: PlayerInfo[] }
  | { k: 'reject'; reason: 'version' | 'data' | 'full' | 'password' | 'banned' }
  | { k: 'player_joined'; id: string; name: string; at: [number, number] }
  | { k: 'player_left'; id: string }
  | { k: 'player_step'; id: string; to: [number, number]; dir: string }
  | { k: 'correction'; at: [number, number] }       // host từ chối bước đi, đặt lại vị trí
  | { k: 'chat'; id: string; text: string };
```

Quy tắc:
- Host kiểm tra bước đi: ô liền kề, đi được (dùng cùng hàm địa hình), tốc độ không vượt giới hạn; sai thì gửi `correction`.
- Tần suất và kích thước message có giới hạn (con số chọn khi triển khai). Gói lại các cập nhật nhỏ.
- Về sau thêm theo chunk (interest management): chỉ gửi cho người ở gần.
- Sự kiện chiến đấu (PvP) dùng danh sách sự kiện có cấu trúc thay cho chuỗi thông báo hiện tại (`TurnResult.message`); client tự dịch sang chữ và hoạt ảnh.

#### 2.5.5 Lưu trữ và nhân vật

Lưu bằng file trong thư mục dữ liệu ứng dụng, ghi nguyên tử (ghi file tạm rồi đổi tên) và có bản sao lưu gần nhất:

```
<thư mục dữ liệu ứng dụng>/
  worlds/<worldId>/
    world.json              seed, worldGenVersion, tên, thời gian
    players/<playerKey>.json  đội hình, PC, túi đồ, vị trí (nếu nhân vật gắn thế giới)
  profile/
    character.json          nhân vật của bạn (nếu mang nhân vật vào thế giới người khác)
```

Mỗi file có `schemaVersion` và `worldGenVersion`. Khi mở save cũ, kiểm tra vị trí còn an toàn (không rơi xuống biển hay vào núi) trước khi đặt người chơi vào.

| | Mang nhân vật của mình (v1) | Nhân vật gắn với thế giới trên máy host |
|---|---|---|
| Cách hoạt động | Khách giữ file nhân vật ở máy mình, host chỉ biết tên, vị trí, Pokémon theo sau | Host giữ dữ liệu nhân vật theo `playerKey`; khách xin phép từng thay đổi |
| Độ phức tạp | Thấp | Cao hơn (host phải kiểm tra mọi thay đổi) |
| Chống sửa file | Không | Có (với người khác ngoài host) |
| Dùng tiến trình sẵn có | Có | Phải tạo nhân vật mới trong từng thế giới |
| Giao dịch Pokémon | Cần hai bên cùng xác nhận, nguy cơ mất đồng bộ nếu một máy sập giữa chừng | Host cập nhật cả hai bên trong một thao tác |

Đề xuất v1: **mang nhân vật của mình**, vì bạn bè tin nhau và dễ làm; chuyển sang gắn với thế giới (N3) khi cần.

#### 2.5.6 Pokémon hoang dã, chiến đấu, giao dịch

- **Sprite hoang dã ngoài thế giới** là hiệu ứng riêng của từng máy (không đồng bộ qua mạng); mỗi người thấy bản của mình.
- **Chiến đấu với Pokémon hoang dã** giữ chạy trên máy từng người chơi ở v1. Khi nhân vật gắn thế giới (N3), host tự quyết loài, cấp, IV và chạy luật.
- **PvP:** host làm trọng tài. Cả hai bên gửi hành động, host chạy `battle/rules` bằng RNG có seed và phát danh sách sự kiện. Nhờ luật là hàm thuần và RNG có seed, trận có thể phát lại để gỡ lỗi.
- **Giao dịch:** host điều phối theo hai bước (đề nghị → hai bên xác nhận → host phát lệnh hoàn tất). Cần xử lý trường hợp mất kết nối giữa chừng để không nhân đôi hay làm mất Pokémon.

#### 2.5.7 Tin cậy và an toàn

- Đối tượng sử dụng là bạn bè; mục tiêu là tránh lỗi và lạm dụng nhẹ, không phải chống kẻ tấn công chuyên nghiệp.
- Mật khẩu phòng (tùy chọn), giới hạn số người, host có quyền đuổi và chặn.
- Mọi message qua schema; giới hạn kích thước và tần suất theo từng khách; ngắt kết nối khi vi phạm.
- **Không khuyến khích mở cổng ra internet công khai** (chuyển tiếp cổng trên router). Mạng ảo như Radmin VPN vẫn là mạng chung với những người đã được mời vào, nên host chỉ nên mời người quen.
- Chat hiển thị dưới dạng văn bản thuần, không diễn giải HTML.

#### 2.5.8 Rủi ro kỹ thuật cần thử nghiệm sớm (spike 1–2 ngày)

| # | Rủi ro | Cần kiểm tra |
|---|---|---|
| R1 | **CSP hiện chưa có `connect-src`**, nên `default-src 'self'` sẽ chặn kết nối WebSocket tới IP khác | Thêm `connect-src` cho `ws:` tới địa chỉ cần thiết và kiểm tra trên bản đóng gói |
| R2 | Webview của host có thể bị giảm tốc khi cửa sổ thu nhỏ hoặc bị che, làm trễ phiên host | Đo; nếu có vấn đề thì xử lý theo hướng message-driven hoặc cấu hình tham số trình duyệt WebView2 (cần đối chiếu tài liệu Tauri) |
| R3 | Firewall và hồ sơ mạng của adapter VPN | Thử thật với Radmin VPN trên hai máy |
| R4 | Độ trễ và mất kết nối | Thiết kế kết nối lại có thời gian chờ; giữ chỗ người chơi một lúc |
| R5 | Tauri chạy trang ở `http://tauri.localhost` hay `https` (cấu hình `useHttpsScheme`), ảnh hưởng việc dùng `ws://` | Xác nhận khi triển khai |
| R6 | Sinh thế giới cho ra cùng kết quả ở cả hai máy | Test golden-file (D11) |
| R7 | Khác phiên bản ứng dụng/dữ liệu giữa host và khách | Bắt tay `hello` có kiểm tra (mục 2.5.4) |

---

## 3. Tổ chức file

### 3.1 Cây thư mục đích (`apps/web/src`)

```
core/        rng, camera, time
data/        catalog Pokémon, moves, items
domain/
  model/     PartyPokemon, BattleMove, StatusCondition, ... (mô hình dùng chung)
  party/  pc/  inventory/  player/  save/
battle/
  rules/     engine (hàm thuần), type-chart, catch, exp, level-up
  session/   controller (luồng lượt), ports
  view/      renderer, text-overlay, animation state, bảng vùng bấm
session/     session-port, local-session, host-session, remote-session
net/
  protocol/  kiểu và schema message, protocolVersion
world/       maps (sinh thế giới thuần), chunks, entities, ai
rendering/   ground, object, character, debug
ui/<tính năng>/   view + controller + css riêng (pokedex, storage, party, bag, hud, lobby)
platform/    audio, file-save (Tauri fs), net-transport (WebSocket client), shell (Tauri)
bootstrap.ts, main.ts   composition root
```

### 3.1b Cấu trúc monorepo

```
apps/
  web/            mã giao diện và game (chạy trong Tauri)
  desktop/        vỏ Tauri
    src-tauri/
      src/
        net/      máy chủ WebSocket cho host, cầu nối sự kiện/lệnh với webview
        fs/       đọc ghi file save
packages/
  game-data/      dữ liệu tĩnh
  shared-types/   kiểu dùng chung
tools/            map-generator (Python, ngoại tuyến), asset pipeline
assets/           graphics, audio
docs/             kèm adr/
```

Không có `apps/server`. Nếu sau này cần chạy host không cửa sổ (headless) để test hoặc vận hành, có thể tách `packages/game-core`; hiện chưa cần.

### 3.2 Quy ước đặt tên và kích thước

- File dùng `kebab-case.ts`. Hậu tố nêu vai trò: `-state`, `-service`, `-rules`, `-view`, `-controller`, `-renderer`, `-db`, `-session`.
- **Giới hạn kích thước:** cảnh báo ở 400 dòng, lỗi ở 600 dòng; ngoại lệ phải có comment lý do. (ESLint hiện **chưa** cấu hình `max-lines`.)
- Một file một trách nhiệm. Hàm quá 60 dòng nên được tách.
- Test đặt theo khu vực: `apps/web/test/<khu-vực>/*.test.ts` (hiện phẳng 16 file).
- CSS đi cùng tính năng, không dồn vào một `style.css`.

### 3.3 Các file cần tách (kích thước hiện tại)

| File | Dòng | Tách thành |
|---|---|---|
| `ui/storage-screen.ts` | 1732 | state, box-view, party-panel, summary-modal, customize-modal, drag-and-drop |
| `battle/battle-renderer.ts` | 1693 | background, sprites, databox, capture-anim, effects |
| `ui/party-screen.ts` | 1359 | list, detail, action-menu, summary, battle-select |
| `maps/chunk-objects.ts` | 1114 | trees, flowers, berries, tall-grass, plants, exclusion |
| `ui/pokedex/pokedex-view.ts` | 947 | theo từng tab |
| `battle/battle-engine.ts` | 777 | damage, status, accuracy/crit, fixed-damage/OHKO |
| `maps/village-rules.ts` | 763 | placement, layout, collision |
| `battle/battle-state.ts` | 746 | animation state tách khỏi state luật |
| `battle/battle-controller.ts` | 689 | tách input/hit-test khỏi luồng lượt |
| `maps/terrain-rules.ts` | 661 | coast/sand, hills, lakes, rivers |
| `style.css` | 5989 | `pokedex.css`, `storage.css`, `party.css`, `battle.css`, `bag.css`, `base.css` |

### 3.4 Thư mục gốc và asset

- Đã xoá `map_viewer.html` và `tiles_data.js` (bước A).
- Gom công cụ Python vào `tools/`; gom `Graphics/` và `Audio/` vào `assets/`.
- **Tên asset:** không dấu cách, không lỗi chính tả (ví dụ "backgound"), không tiền tố trùng nội dung (`GEN8- ...`). Đã tìm thấy 302 nhóm file trùng nội dung (~12,8MB); giữ một bản và tham chiếu qua manifest.
- `docs/`: giữ `PROGRESS.md` ở dạng changelog ngắn; ghi quyết định thiết kế vào `docs/adr/NNNN-tên.md`; dùng liên kết tương đối, không dùng đường dẫn tuyệt đối của máy cá nhân.

---

## 4. Quy ước code

1. **TypeScript strict**: giữ `noUnusedLocals`, `noUnusedParameters`; không `any`, `@ts-ignore`.
2. **Luật chơi tách khỏi hiển thị.** Kết quả lượt là danh sách sự kiện có cấu trúc; hoạt ảnh và thông báo suy ra từ đó.
3. **Mỗi lỗi sửa đi kèm một test tái hiện.**
4. **Dữ liệu tĩnh trong `packages/game-data`**; hằng số công thức Gen 7 nằm ở một file hằng số có comment nguồn.
5. **UI:** một màn hình gồm `view`, `controller`, `css` riêng. View không tự tính luật chơi.
6. **Cache có vòng đời**: gắn với chunk hoặc `reset(seed)`.
7. **Mạng:** mọi message định nghĩa trong `net/protocol`; đổi giao thức phải tăng `protocolVersion`.
8. **Không dùng `Date.now()`/`Math.random()` trong luật chơi và sinh thế giới.**

---

## 5. Tối ưu

### 5.1 Build và asset (bản cài đặt)

Vì chỉ phát hành desktop, kích thước ảnh hưởng tới bộ cài và thời gian khởi động hơn là tải về từ web.

| Vấn đề | Số liệu đo | Việc làm |
|---|---|---|
| Plugin `emitLegacyGraphicsPlugin` sao chép nguyên thư mục | `dist` ≈ 56MB (Graphics 49MB) | Build theo manifest: chỉ phát hành asset được tham chiếu |
| Asset trùng nội dung | 302 nhóm, ~12,8MB | Loại bản trùng |
| Sprite sheet hoạt ảnh chiêu thức nặng | tới ~1,8MB một file | Nạp lười theo chiêu khi dùng lần đầu; thử nén lossless và kiểm tra bằng mắt |
| Dữ liệu JSON đóng thành JS | ~880KB (~140KB gzip) | Kiểm tra nạp lười; chỉ nạp khi vào màn hình cần |
| CSS một khối | ~145KB trước đó, nay ~6.000 dòng | Tách theo màn hình |

### 5.2 Hiệu năng lúc chạy

| Mã | Điểm nóng | Trạng thái |
|---|---|---|
| H1 | `renderWaterTiles` duyệt 25 chunk × 256 ô mỗi khung hình | **Đã làm** (commit `973f05dd`) |
| H2 | `renderTallGrassPatches` O(cỏ × Pokémon) | **Đã làm** |
| H3 | Khoá chuỗi `` `${cx},${cy}` `` và cache module không bao giờ xoá | Còn: dùng khoá số `cx * 1048576 + cy`, gắn cache với vòng đời chunk |
| H4 | `getTileData` dùng 3 `.find` tuyến tính (~3µs/lần) | Còn: lập chỉ mục theo ô khi mật độ thực thể tăng |
| H5 | Sinh chunk đồng bộ trên luồng chính (trung bình ~6,7ms, p95 19ms, tối đa 134ms đo trong Node; qua biên chunk cần sinh 5 chunk) | Còn: tải trước vòng chunk kế tiếp với ngân sách ≤ 3ms mỗi khung hình; Web Worker khi overworld v2 làm sinh chunk nặng hơn |
| H6 | `GameLoop.getStats()` sai | **Đã làm** |

### 5.3 Ngân sách hiệu năng đề xuất

| Chỉ số | Mục tiêu đề xuất |
|---|---|
| Thời gian một khung hình | ≤ 16,6ms (60 FPS) |
| Sinh chunk trong một khung hình | ≤ 3ms |
| Khởi động đến màn hình chính | đo rồi đặt mục tiêu |
| Dung lượng bộ cài | giảm dần bằng build theo manifest |

Mục tiêu là **đề xuất**, cần đo lại trên máy thật rồi chỉnh.

### 5.4 Cách đo

- Dùng `performance.mark/measure` quanh `onUpdate`, `onRender`, vẽ nước, vẽ cỏ cao, sinh chunk.
- Mở rộng HUD debug để hiện thời gian trung bình và p95 theo từng giai đoạn.
- Ghi số đo trước/sau vào PR hiệu năng, cùng seed và cùng vị trí.
- Chỉ tối ưu điểm đã đo được.

### 5.5 Tối ưu mạng LAN

- Gửi **bước đi từng ô**, không gửi vị trí theo khung hình.
- Gộp các cập nhật nhỏ vào cùng một gói theo nhịp cố định (chọn tần số khi đo thực tế).
- Chỉ gửi thay đổi (delta); gửi trạng thái đầy đủ chỉ khi vào phòng hoặc kết nối lại.
- Nội suy chuyển động của người chơi khác ở phía khách để mượt dù gói đến không đều.
- Về sau đăng ký theo chunk để chỉ nhận cập nhật của người ở gần.
- Phiên host chạy theo message, không phụ thuộc vòng lặp vẽ (xem R2).

---

## 6. Công cụ và CI

### 6.1 Đã làm (bước A)

- `package-lock.json` đã đồng bộ, `npm ci` chạy được.
- ESLint đã lint file TypeScript (`typescript-eslint`): 0 lỗi, 9 cảnh báo.
- Đã xoá file di sản `map_viewer.html`, `tiles_data.js`.

### 6.2 Còn thiếu

- **Giới hạn kích thước file:** thêm `max-lines` (cảnh báo 400):

```js
// eslint.config.js (trích)
{
  files: ['apps/web/src/**/*.ts'],
  rules: {
    'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }],
  },
},
```

- **Khoá ranh giới giữa các lớp và cấm vòng import** bằng `dependency-cruiser` (chưa có `.dependency-cruiser.cjs`):

```js
// .dependency-cruiser.cjs (trích)
module.exports = {
  forbidden: [
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
    {
      name: 'domain-no-ui',
      severity: 'error',
      from: { path: '^apps/web/src/domain' },
      to: { path: '^apps/web/src/(ui|rendering)' },
    },
    {
      name: 'rules-and-protocol-pure',
      severity: 'error',
      from: { path: '^apps/web/src/(battle/rules|world|net/protocol)' },
      to: { path: '^apps/web/src/(ui|rendering|platform)' },
    },
  ],
};
```

Thêm vào `package.json`: `"deps:check": "depcruise apps/web/src --config .dependency-cruiser.cjs"`.

- **Kiểm tra Rust** cho `src-tauri`: `cargo check`, `cargo clippy`, `cargo test`.
- **Test mạng:** một test chạy hai phiên (host giả và khách giả) để kiểm tra bắt tay, bước đi, correction và ngắt kết nối.

### 6.3 Thứ tự bước CI đề xuất

`validate:schemas` → `lint` → `deps:check` → `format:check` → `typecheck:web` → `test:web` → `build:web` → `cargo check/clippy/test` (src-tauri).

---

## 7. Lộ trình

| Bước | Nội dung | Trạng thái / tiêu chí hoàn thành |
|---|---|---|
| **P0 – Chiến đấu** | Thứ tự lượt, sát thương cố định/OHKO, recoil/drain theo sát thương thực, Struggle, PP chỉ trừ khi ra đòn, lên cấp tính lại chỉ số, khớp `uid` khi đồng bộ, thống nhất EXP yield | **Phần lớn đã làm** (commit `7b1b4c63`). Còn: kết quả lượt là sự kiện có cấu trúc; đường cong EXP chuẩn (hiện `level² × 10`) |
| **A** | Lockfile, ESLint TS, dọn file di sản | **Đã làm** (commit `973f05dd`). Còn `max-lines` và `dependency-cruiser` (mục 6.2) |
| **B** | Chuyển mô hình dùng chung ra khỏi `battle/`; bỏ `battle → ui` bằng cổng; phá vòng `terrain ↔ village` | Chưa làm. Tiêu chí: `deps:check` không còn V1–V5 |
| **C** | Tách `style.css` và các file ở mục 3.3 | Chưa làm. Tiêu chí: không file nào vượt 600 dòng |
| **D** | H3, H4, H5 (khoá số, chỉ mục ô, tải trước chunk) | Chưa làm. Có số đo trước/sau trong PR |
| **E** | Build theo manifest, nạp lười hoạt ảnh chiêu thức, nén asset | Chưa làm. Dung lượng bộ cài giảm, không thiếu asset |
| **S – Session và file save** | `SessionPort`, `LocalSession`; chuyển lưu từ `localStorage` sang file (Tauri fs) với `schemaVersion` và `worldGenVersion`; chơi một mình chạy qua `LocalSession` | Tiêu chí: game một người chạy như cũ, save cũ được chuyển đổi |
| **N0 – Spike mạng** | Rust mở cổng WebSocket; hai máy (thử với Radmin VPN) trao đổi tin nhắn; kiểm tra R1–R5 | Biết chắc kết nối hoạt động trên bản đóng gói và firewall cần gì |
| **N1 – Vào thế giới** | `HostSession`, `RemoteSession`, `hello`/`welcome`, mã mời, thấy người chơi khác di chuyển, chat | Hai đến bốn người đi lại trong cùng một thế giới |
| **N2 – Chơi chung** | PvP với host làm trọng tài; giao dịch Pokémon hai bước | Trận PvP phát lại được bằng seed; giao dịch không nhân đôi/mất Pokémon |
| **N3 – Nhân vật gắn thế giới (tùy chọn)** | Host giữ dữ liệu nhân vật, quyết định gặp Pokémon, EXP, túi đồ | Khách không sửa được dữ liệu của mình bằng cách chỉnh file |
| **N4 – Tiện ích (tùy chọn)** | Tự dò máy trong LAN, danh sách người chơi, đuổi/chặn | — |
| **Sau đó** | Overworld v2 theo kế hoạch đã soạn (lục địa, độ cao, khí hậu, biome, thủy văn, thị trấn) | Theo giai đoạn P0–P7 của kế hoạch overworld; áp D11 |

Bước B và S nên xong **trước** N1. Bước N0 có thể làm sớm (độc lập), vì kết quả của nó quyết định phương án truyền tải ở mục 2.5.3.

---

## 8. Checklist cho mỗi PR

- [ ] Không thêm import ngược tầng; `npm run deps:check` xanh (khi đã có).
- [ ] Không có vòng import mới.
- [ ] Không file nào vượt 400 dòng (hoặc có comment lý do).
- [ ] Luật chơi mới là hàm thuần, ngẫu nhiên đi qua RNG được tiêm vào.
- [ ] Có test cho hành vi mới hoặc lỗi vừa sửa.
- [ ] Không dùng singleton trực tiếp trong code mới.
- [ ] Thay đổi hiệu năng có số đo trước/sau.
- [ ] Asset mới đặt tên không dấu cách, không trùng nội dung asset cũ, đã khai báo trong manifest.
- [ ] Thay đổi trạng thái thế giới chung đi qua `SessionPort`.
- [ ] Thay đổi giao thức có tăng `protocolVersion`; message nhận về đi qua schema.
- [ ] Code Rust mới qua `cargo clippy`.
- [ ] `npm run ci` chạy qua cục bộ.

---

## 9. Phụ lục

### 9.1 Số liệu tham chiếu

| Số liệu | Giá trị | Điều kiện |
|---|---|---|
| Test web | 128/128 pass (16 file) | `vitest` tại `a24a12d4` |
| ESLint | 0 lỗi, 9 cảnh báo | `eslint apps/web/src` |
| Lớp Rust | 31 dòng, không có lệnh Tauri | `src-tauri/src` |
| Sinh chunk | trung bình 6,7ms, p95 19ms, tối đa 134ms (120 chunk) | Node, không canvas, JIT lạnh |
| `getTileData` | ~3µs/lần | Node |
| Fan-in cao nhất | `battle/types.ts` = 18 | đồ thị import tĩnh |
| File lớn nhất | `ui/storage-screen.ts` 1732 dòng; `style.css` 5989 dòng | — |

### 9.2 Chưa kiểm chứng

- Chưa chạy thử mạng thật; toàn bộ mục 2.5 là thiết kế, chưa có mã. Các rủi ro R1–R7 cần spike N0.
- Chưa chọn thư viện Rust cho máy chủ WebSocket.
- Chưa profile trong WebView2 thật (GPU, bộ nhớ ảnh giải mã, vẽ canvas).
- Chưa kiểm tra các chunk dữ liệu JSON có nạp lười hay không.
- Chưa phân tích asset nào không được tham chiếu (chỉ phát hiện file trùng).
- Chưa chạy test Python, build Tauri đầy đủ và `npm run ci`.
- Chưa kiểm tra lại V7 (hit-test pixel gắn cứng) sau các commit gần đây.

### 9.3 Tài liệu cần cập nhật theo định hướng này

Các file kèm theo bản này (thay thế bản trong `docs/`):
- `docs/DEV_ARCHITECTURE_GUIDE.md` (file này)
- `docs/plans/02-architecture.md`
- `docs/plans/03-repository-structure.md`
- `docs/plans/04-frontend-plan.md`
- `docs/plans/05-lan-multiplayer-plan.md` (thay `05-backend-plan.md`, xoá file cũ)
- `docs/plans/09-network-protocol.md` (thay `09-api-contract.md`, xoá file cũ)

Còn phải sửa tay:
- `docs/plans/01-project-vision.md`, dòng 13 và 15: bỏ "Tách frontend, backend" và "Logic quan trọng nằm ở backend khi game có tính năng online"; dòng 24 ("Chưa quyết định mô hình multiplayer cuối cùng") đổi thành "Multiplayer theo kiểu host qua LAN/VPN".
- `docs/plans/10-testing-and-quality.md`, dòng 11 và 22: bỏ "Contract test giữa frontend và backend" và "Build frontend và backend"; thay bằng test giao thức giữa host và khách, build ứng dụng Tauri.
- `docs/plans/11-roadmap-and-deployment.md`, dòng 23–27 và 48–52: thay "M3 – Backend" bằng mốc mạng LAN (N0–N3), bỏ môi trường `production` có backend/database/cache; chỉ giữ phát hành bộ cài desktop.
- `docs/PROGRESS.md`: rút gọn, dùng liên kết tương đối; ghi quyết định thiết kế vào `docs/adr/`.
