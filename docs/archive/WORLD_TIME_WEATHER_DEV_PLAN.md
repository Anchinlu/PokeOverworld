# Kế hoạch triển khai thời gian, ánh sáng và thời tiết thế giới

**Trạng thái:** Phần WorldClock, DayPhase, AmbientLight và wildlife day/night đã triển khai; Weather overworld vẫn là kế hoạch
**Đối tượng:** Frontend game runtime, world simulation, renderer và QA
**Phạm vi:** Chu kỳ ngày/đêm, bình minh, hoàng hôn, lớp ánh sáng môi trường và thời tiết overworld
**Không thuộc phạm vi:** Thay đổi terrain generation, thay đổi công thức battle weather hiện có, multiplayer hoặc backend authoritative

## 1. Mục tiêu

- Tạo đồng hồ thế giới duy nhất cho toàn bộ overworld.
- Hiển thị tự nhiên bốn giai đoạn: bình minh, ban ngày, hoàng hôn và ban đêm.
- Dùng một lớp overlay ánh sáng trong suốt thay vì đổi màu từng tile hoặc sprite.
- Tạo nền tảng thời tiết có thể mở rộng sang mưa, tuyết, bão cát, sương mù và sấm sét.
- Giữ gameplay deterministic theo `seed` và thời gian thế giới.
- Không để timer, animation hoặc weather effect tiếp tục chạy khi world loop bị pause, Battle mở hoặc World Map mở.

## 2. Nguyên tắc bắt buộc

### 2.1. Single Source of Truth

Không để renderer tự đọc `Date.now()` để quyết định ngày/đêm. Mọi hệ thống phải đọc từ `WorldClock`:

```ts
export interface WorldClockState {
  minutes: number; // 0..1439
  day: number;
  isPaused: boolean;
}
```

`WorldClock` chỉ quản lý thời gian. Nó không được chứa logic render, spawn Pokémon hoặc battle damage.

### 2.2. Tách state và presentation

- `WorldClock`: thời gian game.
- `DayPhaseResolver`: ánh xạ thời gian thành phase và lighting profile.
- `WorldWeatherService`: trạng thái thời tiết và thời lượng.
- `AmbientOverlayRenderer`: chỉ vẽ lớp ánh sáng.
- `WeatherRenderer`: chỉ vẽ hiệu ứng hình ảnh thời tiết.

Không đặt các nhánh xử lý thời tiết vào `GameRenderer`, `chunk-objects.ts` hoặc `battle-engine.ts`.

### 2.3. Deterministic

- Thời điểm bắt đầu world phải được lưu trong save state.
- Random thời tiết phải dùng seeded RNG hoặc một weather seed riêng.
- Không dùng `Math.random()` cho việc chọn thời tiết, cường độ hoặc hướng hạt.
- Animation mưa/tuyết có thể dùng `dtMs` để chuyển động, nhưng không được làm thay đổi state gameplay ngoài service.

## 3. Cấu trúc module đề xuất

```text
apps/web/src/
├── core/
│   └── world-clock.ts
├── world/
│   ├── day-phase.ts
│   ├── ambient-light.ts
│   └── world-weather-service.ts
├── rendering/
│   ├── ambient-overlay-renderer.ts
│   └── weather-renderer.ts
└── game/
    └── game-session.ts

packages/shared-types/
└── world-time.ts

packages/game-data/
└── weather-config.json
```

Tên file có thể điều chỉnh theo cấu trúc thực tế, nhưng trách nhiệm module phải giữ nguyên.

## 4. Giai đoạn 1 — World Clock

### 4.1. Quy tắc thời gian

Đề xuất mặc định:

```text
1 phút game = 1 giây thật
1 ngày game = 24 phút thật
```

Tốc độ phải nằm trong config, không hardcode trong renderer.

```ts
export interface WorldClockConfig {
  minutesPerRealSecond: number;
  startMinutes: number;
  pauseDuringBattle: boolean;
  pauseDuringWorldMap: boolean;
}
```

### 4.2. API tối thiểu

```ts
getState(): WorldClockState;
getMinutes(): number;
setMinutes(minutes: number): void;
advance(dtMs: number): void;
pause(reason: string): void;
resume(reason: string): void;
```

`advance()` chỉ được gọi từ world update loop, không gọi từ render loop.

## 5. Giai đoạn 2 — Day Phase và ánh sáng

### 5.1. Các phase

| Khoảng thời gian | Phase | Mục đích |
|---|---|---|
| 05:00–07:00 | `dawn` | Chuyển từ tối sang sáng, màu cam/hồng nhẹ |
| 07:00–17:00 | `day` | Không phủ hoặc phủ rất nhẹ |
| 17:00–19:00 | `dusk` | Màu cam/tím, giảm độ sáng dần |
| 19:00–05:00 | `night` | Phủ xanh đậm/tím, giảm độ sáng |

Không chuyển phase bằng điều kiện rời rạc làm ánh sáng giật. Phải nội suy màu và alpha giữa hai profile gần nhất.

### 5.2. Lighting profile

```ts
export interface AmbientLightProfile {
  color: string;
  alpha: number;
  blendMode: GlobalCompositeOperation;
}
```

Profile ban đầu:

```text
dawn:  rgba(255, 150, 105, 0.16)
day:   rgba(255, 255, 255, 0.00)
dusk:  rgba(170, 90,  190, 0.20)
night: rgba(24,  35,   90, 0.38)
```


### 5.3. Thứ tự render

```text
Ground
Tall Grass
Objects
Wild Pokémon
Player / Follower
Ambient Overlay
Weather Visual Effects
HUD / Menu
```

Overlay phải phủ toàn canvas một lần mỗi frame, không phủ từng entity.

## 6. Giai đoạn 3 — Weather State

### 6.1. Model

```ts
export type OverworldWeather = 'clear' | 'rain' | 'snow' | 'sandstorm' | 'fog';

export interface WorldWeatherState {
  type: OverworldWeather;
  intensity: number; // 0..1
  remainingMinutes: number;
  source: 'natural' | 'event' | 'debug';
}
```

### 6.2. Quy tắc

- Weather state thuộc world, không thuộc chunk.
- Một thời điểm chỉ có một weather chính.
- Weather phải được lưu trong save state nếu có thời lượng còn lại.
- Khi thời lượng về 0, chuyển về `clear` bằng transition nhẹ.
- Debug có thể ép weather nhưng phải ghi `source: 'debug'`.

### 6.3. Data config

Đưa tỉ lệ, thời lượng và cường độ vào `weather-config.json`:

```json
{
  "rain": { "minMinutes": 4, "maxMinutes": 12, "defaultIntensity": 0.65 },
  "snow": { "minMinutes": 4, "maxMinutes": 10, "defaultIntensity": 0.55 },
  "sandstorm": { "minMinutes": 3, "maxMinutes": 8, "defaultIntensity": 0.7 },
  "fog": { "minMinutes": 2, "maxMinutes": 6, "defaultIntensity": 0.4 }
}
```

## 7. Giai đoạn 4 — Weather Renderer

### 7.1. Hiệu năng

- Không tạo object hạt mới mỗi frame; dùng pool hoặc typed arrays.
- Giới hạn số lượng hạt theo kích thước canvas và quality setting.
- Mưa/tuyết cập nhật ở 30 FPS, không bắt buộc 60 FPS.
- Chỉ chạy weather animation khi world đang visible và không bị pause.
- Sấm chớp dùng timer ngắn, phải được cleanup khi đổi màn hình hoặc thoát world.

### 7.2. Layer

- `fog`: giữa world và entity hoặc phủ nhẹ sau entity tùy preset.
- `rain`: sau entity để tạo cảm giác mưa ở phía trước.
- `snow`: nhiều lớp, một lớp sau và một lớp trước entity nếu cần.
- `sandstorm`: overlay màu vàng nâu kèm hạt chuyển động ngang.

## 8. Giai đoạn 5 — Tích hợp hệ thống khác

Sau khi ánh sáng và renderer ổn định mới kết nối:

- Wildlife encounter theo `day/night`.
- Pokémon đặc thù chỉ xuất hiện khi mưa, tuyết hoặc ban đêm.
- Battle environment lấy weather từ overworld khi bắt đầu trận.
- Ability như Swift Swim, Chlorophyll, Sand Rush sử dụng weather battle đã chuẩn hóa.
- Âm thanh môi trường theo phase/weather.

Không đưa các thay đổi này vào cùng commit với phase ánh sáng đầu tiên.

## 9. Save và vòng đời

Mở rộng world save:

```ts
worldTimeMinutes: number;
worldDay: number;
weather?: WorldWeatherState;
lastWorldTimestamp?: number;
```

Khi thoát game:

1. Dừng world loop.
2. Lưu clock và weather.
3. Cleanup weather renderer, timers và event listeners.

Khi mở lại game, cần chốt một trong hai chính sách:

- **Pause policy:** thời gian không trôi khi game đóng.
- **Real-time policy:** thời gian trôi theo `lastWorldTimestamp`.

Khuyến nghị giai đoạn đầu dùng `Pause policy` để dễ kiểm thử và tránh sai lệch gameplay.

## 10. Kiểm thử bắt buộc

### Unit test

- Wrap phút `1439 → 0` tăng đúng ngày.
- `advance()` không chạy khi clock pause.
- Phase đúng tại các mốc 05:00, 07:00, 17:00, 19:00.
- Nội suy ánh sáng không tạo alpha ngoài `0..1`.
- Cùng state và cùng `dt` cho kết quả weather deterministic.
- Weather tự hết hạn đúng thời lượng.

### Integration test

- Battle pause clock và weather animation.
- World Map pause world loop.
- Thoát world cleanup toàn bộ timer/RAF.
- Load save khôi phục đúng phase và weather.
- Đổi phase không ảnh hưởng terrain, collision hoặc spawn deterministic.

### Visual QA

- Chụp kiểm tra bình minh, ban ngày, hoàng hôn, ban đêm.
- Kiểm tra màu overlay không che HUD/menu.
- Kiểm tra sprite Pokémon vẫn đọc rõ trong ban đêm.
- Kiểm tra mưa/tuyết không bị lệch khi camera di chuyển.
- Kiểm tra không có animation chạy khi World Map hoặc Battle đang mở.

## 11. Tiêu chí nghiệm thu

- Không có `Date.now()` trực tiếp trong renderer để quyết định phase.
- Không có logic weather rải trong nhiều renderer.
- World loop được pause thật khi World Map mở.
- Tất cả timer/RAF weather đều có cleanup.
- `npm run typecheck:web`, lint, format và nhóm test thời gian/thời tiết đạt.
- Ánh sáng được vẽ bằng một overlay layer, không nhân số lần vẽ theo số entity.
- Weather chưa được kết nối vào encounter/battle cho tới khi state và persistence hoàn tất.

## 12. Chưa triển khai

- World Clock.
- Day phase resolver.
- Ambient light overlay.
- Weather state và persistence.
- Rain/snow/sandstorm/fog visual effects.
- Weather-dependent encounter.
- Đồng bộ weather overworld với battle.
