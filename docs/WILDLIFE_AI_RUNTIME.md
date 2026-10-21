# Wildlife AI Runtime

## Trạng thái

Đã triển khai pipeline AI thống nhất cho Pokémon hoang dã overworld.

```text
WorldChunk -> UnifiedWildlifeRuntime -> WildlifeSystem
          -> WildlifeSimulator -> Utility Brain
          -> species profile + weather modifier + LOD movement
```

## Nguồn sự thật

- `packages/game-data/wildlife/species-behavior.json`: mapping đủ 151 loài vào nhóm hành vi, tag sinh thái và độ nhạy thời tiết.
- `packages/game-data/wildlife/behavior-archetypes.json`: trọng số và cấu hình archetype dùng chung.
- `apps/web/src/wildlife/behavior/profiles/profile-registry.ts`: hợp nhất archetype với override theo loài.
- `apps/web/src/wildlife/behavior/wildlife-simulator.ts`: vòng lặp Utility AI duy nhất.
- `apps/web/src/world/overworld-weather.ts`: thời tiết deterministic theo seed/ngày/khung sáu giờ.

## Luồng runtime

1. `GameSession` cập nhật thời gian và weather.
2. `ChunkManager` truyền weather vào `WorldChunk` và refresh wildlife gần người chơi khi weather đổi.
3. `UnifiedWildlifeRuntime` gom entity trong `simulationChunks` và gọi `WildlifeSystem`.
4. Simulator áp dụng active time, weather modifier, perception, threat, herd cohesion, LOD và grid movement.
5. Entity xa hơn 24 ô bị đóng băng; entity trong vùng 16–24 ô chỉ cập nhật thưa.

`apps/web/src/ai/wild-pokemon.ts` chỉ còn là adapter tương thích cho test/API cũ; gameplay chính không gọi legacy state machine.

## Quy tắc mở rộng

- Thêm hành vi mới vào JSON/profile, không thêm chuỗi `if/else` theo loài trong simulator.
- Weather chỉ điều chỉnh utility, tốc độ và mục tiêu trú ẩn; không ép state trực tiếp nếu không phải trạng thái khẩn cấp.
- Mọi random trong AI phải deterministic theo entity seed hoặc world seed.
- Khi thêm loài mới, chạy `npm run validate:wildlife` và test coverage species behavior.
