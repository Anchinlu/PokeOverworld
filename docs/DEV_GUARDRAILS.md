# Developer Guardrails — PokeOverworld

**Trạng thái:** Hướng dẫn bắt buộc cho mọi thay đổi mới  
**Phạm vi:** Frontend game runtime, world generation, battle prototype, Python parity, assets, tests và CI  
**Mục tiêu:** Giảm regression, tránh phá deterministic world, giữ kiến trúc module rõ ràng và bảo đảm mọi thay đổi có thể kiểm chứng.

---

## 1. Quy tắc vàng

Trước khi sửa code, dev phải trả lời được 5 câu hỏi:

1. Thay đổi này thuộc domain nào?
2. Module nào là nơi duy nhất được phép chứa logic đó?
3. Thay đổi có ảnh hưởng đến seed, chunk boundary, asset key, schema hoặc API không?
4. Test nào chứng minh thay đổi đúng?
5. Nếu thay đổi thất bại, rollback theo commit nào?

Không đưa logic vào file đang tiện tay mở. Đúng trách nhiệm module quan trọng hơn việc sửa nhanh.

---

## 2. Quy tắc kiến trúc

### 2.1. Một module — một trách nhiệm chính

Không để một file đồng thời:

- Sinh dữ liệu world.
- Quyết định gameplay rule.
- Render canvas.
- Điều khiển DOM.
- Quản lý input.
- Gọi database/API.
- Chứa cấu hình cân bằng.

| Trách nhiệm | Vị trí đề xuất |
|---|---|
| Ecology noise và sample vùng | apps/web/src/maps/ecology/ |
| Sinh cây/hoa/Berry/cỏ | apps/web/src/maps/chunk-objects.ts |
| Chọn encounter | apps/web/src/maps/chunk-encounters.ts |
| Cập nhật hành vi Pokémon | apps/web/src/ai/wild-pokemon.ts |
| Render entity | apps/web/src/rendering/ |
| UI state | apps/web/src/ui/ |
| Dữ liệu Pokémon | packages/game-data/ và PokemonCatalog |
| Battle rules | apps/web/src/battle/ |
| Backend authoritative | apps/server/ khi được khởi tạo |

Nếu file vượt khoảng 300–400 dòng hoặc có hơn một nhóm trách nhiệm lớn, phải xem xét tách module trước khi thêm feature.

### 2.2. Không tạo God File mới

Không thêm code vào các file lớn chỉ vì chúng đã có sẵn:

- pokedex-screen.ts
- chunk-objects.ts
- game-session.ts
- battle-engine.ts

Nếu cần thay đổi, ưu tiên tạo service/helper/module mới rồi kết nối qua interface nhỏ.

### 2.3. Dependency direction

Quy tắc hướng phụ thuộc:

    game-data / shared-types
            ↓
    maps / entities / battle rules
            ↓
    game session / systems
            ↓
    rendering / UI
            ↓
    bootstrap

Không cho phép:

- Renderer tự sinh world data.
- UI import file JSON thô nếu đã có service catalog.
- Map generator gọi DOM.
- Data layer phụ thuộc canvas hoặc browser event.
- Battle engine phụ thuộc UI element.
- AI sửa trực tiếp state của UI.

---

## 3. Deterministic World Generation

### 3.1. Cấm random không kiểm soát

Không dùng Math.random() trong:

- Sinh terrain.
- Sinh tree, flower, Berry, tall grass.
- Sinh encounter.
- Sinh level.
- Tạo world snapshot.
- Test cần replay hoặc parity.

Dùng:

- seededHash(gx, gy, seed + SALT) cho giá trị độc lập theo tọa độ.
- Rng hoặc injected RNG cho logic runtime.
- Salt riêng cho từng domain.

Khi thêm salt mới, đặt tên rõ và thêm test.

### 3.2. Luôn dùng tọa độ toàn cầu

World generation phải dùng gx/gy, không dùng riêng lx/ly.

Local coordinate có thể tạo seam tại ranh giới chunk.

### 3.3. Không thay đổi seed contract tùy ý

Thay đổi seed salt, frequency, threshold zone, công thức nội suy, thứ tự candidate hoặc data roster có thể làm thay đổi toàn bộ world.

Nếu bắt buộc thay đổi:

1. Ghi rõ breaking world-generation change.
2. Cập nhật snapshot/parity test.
3. Tăng version world generation nếu save game phụ thuộc kết quả cũ.
4. Không âm thầm thay đổi trong một bugfix nhỏ.

### 3.4. Không dùng thời gian runtime để sinh world

Không dùng Date.now(), performance.now(), FPS hoặc thứ tự load chunk để quyết định vị trí, species, loại cây, level hoặc stage ban đầu.

---

## 4. Chunk Boundary và Spatial Rules

Mọi object có kích thước lớn hơn một tile phải được kiểm tra với chunk lân cận.

Bắt buộc kiểm tra:

- Tree với tree.
- Tree với Berry.
- Berry với Berry.
- Building với building.
- Collider tại mép chunk.
- Tall grass với object cấm spawn.
- Encounter tại vùng giáp chunk.

Khi sửa placement:

- Giữ hoặc cập nhật test 9 chunk lân cận.
- Không đổi kích thước sprite/collider mà không cập nhật collision test.
- Tách candidate selection khỏi validation/placement.
- Không bỏ qua object chỉ vì chunk chưa active; dùng deterministic lookup.

---

## 5. Ecology và Procedural Distribution

### 5.1. Single source of truth

Cây, hoa, Berry, cỏ cao và encounter phải đọc ecology từ apps/web/src/maps/ecology/.

Không tự tạo moisture/density/fertility riêng trong từng generator.

### 5.2. Data-driven thay vì hardcode

Species, Berry, palette, habitat và encounter rate phải nằm trong data/config.

Không hardcode roster Pokémon trong generator, danh sách Berry ở nhiều module, tree type ở renderer hoặc type mapping ở nhiều UI component.

Mọi field trong biomes.json, encounters.json hoặc manifest phải được runtime đọc và có test, hoặc được ghi rõ là reserved/future field.

### 5.3. Statistical validation

Khi đổi tỉ lệ spawn, kiểm tra nhiều seed. Không kết luận từ một chunk.

Tối thiểu kiểm tra:

- Dense forest nhiều tree hơn dryland.
- Wetland có palette hoa phù hợp.
- Rare Berry thấp hơn common Berry.
- Encounter phụ thuộc tall grass/context.
- Không có vùng nào bằng 0 tuyệt đối nếu không phải chủ ý thiết kế.

---

## 6. Pokémon Catalog và Data Contract

Mọi truy xuất Pokémon runtime phải đi qua apps/web/src/data/pokemon-catalog.ts.

API chuẩn:

- getAll()
- getById()
- getBySpeciesKey()
- search()
- getEncounterRoster()

Không import trực tiếp pokemon-db.json trong UI, encounter generator, battle screen hoặc renderer.

Khi thêm field Pokémon:

1. Cập nhật shared type.
2. Cập nhật JSON schema nếu có.
3. Cập nhật data validation.
4. Cập nhật catalog mapping.
5. Thêm test.

Không đổi speciesKey hoặc ID public nếu chưa có migration plan.

---

## 7. Asset và Manifest

Không thêm path trực tiếp như /Graphics/Pokedex/xxx.png.

Dùng asset key và resolver, ví dụ assetLoader.getImage('pokedex_bg_info').

Mọi asset production phải:

1. Có file vật lý.
2. Có entry trong manifest.
3. Có key ổn định.
4. Được kiểm tra bởi validate:schemas.
5. Không phụ thuộc dev middleware riêng.

Khi thêm asset mới, production build không được có warning “didn't resolve”.

---

## 8. Battle Rules

Battle engine phải là pure/domain logic càng nhiều càng tốt.

Không để battle engine đọc DOM, thay đổi trực tiếp UI, gọi Math.random() không kiểm soát, phụ thuộc animation timing hoặc tự đọc asset.

Thiết kế RNG có thể inject:

    interface BattleRng {
      next(): number;
      nextInt(min: number, max: number): number;
    }

Battle result nên là dữ liệu gồm events và nextState. Điều này hỗ trợ test deterministic, replay và server authoritative.

Mọi thay đổi damage, crit, accuracy, random factor hoặc move selection phải có test riêng.

---

## 9. UI và Pokédex

UI không được tự làm data access, world generation hoặc battle calculation.

Mục tiêu phân tách:

    ui/pokedex/
    ├── pokedex-controller.ts
    ├── pokedex-view.ts
    ├── pokedex-state.ts
    ├── pokedex-filter.ts
    ├── pokedex-sprite.ts
    └── pokedex-data.ts

- Controller xử lý input và điều phối.
- View tạo DOM/render display.
- State chỉ giữ state.
- Filter là pure function.
- Sprite animator chỉ xử lý canvas/sprite.
- Data module gọi PokemonCatalog.

---

## 10. Python và TypeScript Parity

Nếu cùng một thuật toán tồn tại ở Python và TypeScript:

- Chia sẻ formula, salt, frequency và threshold.
- Viết parity test cho tọa độ/seed cố định.
- Không làm tròn tùy ý chỉ để pass test.
- Thay đổi công thức phải cập nhật cả hai implementation trong cùng commit.
- Ghi version hoặc migration note nếu output world thay đổi.

---

## 11. Testing Checklist

Trước Pull Request, chạy:

    npm run validate:schemas
    npm run lint
    npm run format:check
    npm run typecheck:web
    npm run test:web
    npm run test:python
    npm run build:web

Hoặc npm run ci.

Khi feature thay đổi world generation, bắt buộc có:

- Deterministic test.
- Multi-seed test.
- Chunk boundary test.
- Collision/overlap test.
- Statistical distribution test.
- Python parity test nếu có bản Python tương ứng.

Không xóa test hoặc nới tolerance để che bug.

---

## 12. Git và Commit

Kiểm tra trước khi sửa:

    git status --short
    git diff --stat

Không format hàng loạt file ngoài phạm vi feature nếu chưa xác định phạm vi.

Commit nên nhỏ và theo domain:

    feat(ecology): add moisture-based flower clustering
    test(ecology): add multi-seed distribution checks
    fix(assets): resolve Pokedex sprites through manifest
    refactor(pokedex): extract sprite animator

Không trộn feature gameplay, format toàn repository, asset binary và refactor backend vào một commit.

Trước khi kết luận hoàn tất:

    git status --short
    git diff --check

---

## 13. Quy trình review bắt buộc

Reviewer phải kiểm tra:

1. Logic có nằm đúng module không?
2. Có Math.random() hoặc runtime time trong world generation không?
3. Có dùng global coordinate không?
4. Có xử lý chunk lân cận không?
5. Có hardcode data đã tồn tại trong catalog/config không?
6. Asset có đi qua manifest không?
7. Có test deterministic và multi-seed không?
8. Có phá Python parity không?
9. Có thay đổi public ID/schema không?
10. CI thực tế có pass không?

Nếu chưa trả lời được một câu, PR chưa đủ điều kiện merge.

---

## 14. Definition of Done

Một thay đổi chỉ hoàn tất khi:

- Code nằm đúng module.
- Không tạo God File mới.
- Không phá deterministic contract.
- Không có direct asset path mới.
- Không có data duplication mới.
- Có test phù hợp rủi ro.
- Typecheck, lint, format, tests, schema validation và build đều đạt.
- Tài liệu tiến độ phản ánh đúng trạng thái thực tế.
- Working tree và commit scope rõ ràng.
- Không ghi tính năng là “đã hoàn thành” nếu mới chỉ có prototype hoặc test cục bộ.

---

## 15. Các lỗi hiện tại cần tránh lặp lại

- Để pokedex-screen.ts phình to thêm.
- Thêm asset bằng đường dẫn /Graphics/... trực tiếp.
- Dùng Math.random() trong battle nếu muốn authoritative runtime.
- Bỏ qua Prettier rồi vẫn ghi CI đã đạt.
- Thêm roster Pokémon trong chunk-encounters.ts thay vì data file.
- Sửa ecology ở một phía mà không chạy Python parity.
- Sửa collider/placement mà không kiểm tra 9 chunk lân cận.
- Gộp feature mới với thay đổi format không liên quan.
- Cập nhật docs/PROGRESS.md trước khi kiểm chứng bằng lệnh thực tế.

---

## 16. Tài liệu liên quan

- plans/02-architecture.md
- plans/03-repository-structure.md
- plans/04-frontend-plan.md
- plans/05-backend-plan.md
- plans/10-testing-and-quality.md
- plans/BIOME_DISTRIBUTION_DEV_SPEC.md
- PROGRESS.md

