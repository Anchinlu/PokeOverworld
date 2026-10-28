# Story Architecture Contract

## Mục tiêu

Tài liệu này là hợp đồng kiến trúc bắt buộc cho toàn bộ Story, Quest, Cutscene và
sự kiện đặc biệt trong overworld.

Mục tiêu chính:

- Một event chỉ có một bộ điều phối duy nhất.
- Event không được sửa trực tiếp hệ thống Battle, Wildlife, NPC, Camera hoặc UI.
- Event có thể bị hủy, tải lại và tiếp tục mà không làm hỏng world state.
- Các event mới có thể thêm độc lập mà không phải sửa `GameSession` ở nhiều nơi.
- Flag, quest, item, party và checkpoint chỉ được ghi tại điểm commit rõ ràng.

## Chính sách thế giới mở: topology trước, phương hướng sau

Thế giới của dự án là một thế giới mở. Không dùng Đông/Tây/Nam/Bắc làm điều
kiện bắt buộc để quyết định vị trí làng, hướng mở rộng, biome, khí hậu hoặc
đường đi. Phương hướng chỉ là thông tin tọa độ phục vụ hiển thị và debug.

Độ ổn định của địa hình phải đến từ các yếu tố có thể tái tạo:

1. `seed + worldGenerationVersion + profile` là định danh bất biến của thế
   giới.
2. Vị trí làng khởi đầu được chọn bằng điểm số địa hình: mặt đất liên tục,
   độ phẳng, khoảng trống xây dựng, khoảng cách với nước/vách đá và khả năng
   nối với vùng xung quanh.
3. Sau khi chọn vị trí, hệ thống khóa `StarterVillagePlan` và vùng đệm theo
   footprint thật của làng; không dùng một vòng tròn an toàn lớn để ép biome
   xung quanh thành đồng bằng.
4. Ngoài vùng đặt trước của làng, địa hình được sinh tự nhiên từ plan khí hậu,
   thủy văn và biome của seed; không tạo các dải ranh giới theo trục tọa độ.
5. Story chỉ tham chiếu anchor chức năng như
   `starter_village.player_house.door`, `starter_village.lab.front_door`,
   `starter_village.main_square` và `starter_village.exit_gate`. Không đặt tên
   anchor theo `north_gate`, `east_gate` hoặc hướng tương tự.

Layout có thể được xoay hoặc phản chiếu theo seed nếu cần đa dạng, nhưng story
không được phụ thuộc vào phép xoay đó. Đường liên vùng chỉ được tạo khi có
quan hệ kết nối trong road graph; không tự sinh đường chỉ vì hai địa điểm nằm
trên cùng một trục.

## Quy tắc bắt buộc

### 1. Một StoryDirector duy nhất

`StoryDirector` là nơi duy nhất được phép:

- đánh giá trigger;
- chọn event tiếp theo;
- khóa/mở input;
- chạy cutscene;
- quản lý event đang hoạt động;
- commit hoặc rollback event;
- khôi phục event sau khi tải save.

`GameSession` chỉ gọi:

```ts
storyDirector.update(dtMs, runtimeContext);
```

Không được gọi trực tiếp các hàm kiểu:

```ts
palletPrologueEventManager.update(...);
route1SpearowEventManager.update(...);
```

Các manager cũ phải được chuyển thành implementation nội bộ của
`StoryEventDefinition` hoặc `StoryActorController`.

### 2. Event không được tự render và không được tự thao tác DOM

Event chỉ được yêu cầu hiệu ứng thông qua port:

- `StoryDialoguePort`: thoại, lựa chọn, portrait.
- `StoryCameraPort`: pan, snap, shake, flash.
- `StoryAudioPort`: nhạc nền, âm thanh, cry.
- `StoryGamePort`: player, follower, actor, input.
- `StoryWorldPort`: chunk, anchor, weather, time, wildlife suppression.
- `StoryBattlePort`: bắt đầu battle và chờ kết quả.

Event không được gọi trực tiếp `document`, `canvas`, `setTimeout` hoặc
`requestAnimationFrame` để điều khiển gameplay. Những việc đó thuộc về adapter.

### 3. Event phải có lifecycle cố định

Mỗi event bắt buộc tuân theo:

```text
IDLE
  -> TRIGGERED
  -> PREPARING
  -> RUNNING
  -> COMMITTING
  -> COMPLETED
```

Khi có lỗi, đổi map, đóng game hoặc người chơi bỏ event:

```text
RUNNING -> ABORTING -> CLEANUP -> ABORTED
```

Mẫu event:

```ts
interface StoryEventDefinition {
  id: string;
  act: StoryAct;
  priority: number;
  trigger: StoryTriggerRule;
  prerequisites?: StoryCondition[];
  prepare(context: StoryContext): Promise<void>;
  run(context: StoryContext): Promise<void>;
  commit(context: StoryContext): Promise<void>;
  cleanup(context: StoryContext): Promise<void>;
  onAbort?(context: StoryContext): Promise<void>;
}
```

`prepare()` không được ghi phần thưởng. `run()` không được đánh dấu hoàn thành.
Chỉ `commit()` mới được ghi kết quả cuối cùng.

## Cơ chế cô lập tài nguyên

### StoryLockManager

Không dùng boolean toàn cục như `isInputLocked = true/false` trong event.

Dùng lock có ownership:

```ts
const inputLock = locks.acquire('input', eventId);
const cameraLock = locks.acquire('camera', eventId);

try {
  await runScene();
} finally {
  cameraLock.release();
  inputLock.release();
}
```

Các lock chuẩn:

- `input`: chặn điều khiển người chơi;
- `camera`: ngăn camera thường ghi đè camera cutscene;
- `wildlife`: tạm dừng hoặc ẩn wildlife trong khu vực event;
- `npc`: ngăn NPC thường đi xuyên qua actor story;
- `world_time`: giữ thời gian trong cảnh;
- `weather`: giữ thời tiết trong cảnh;
- `battle`: ngăn mở battle ngoài event.

Event chỉ được release lock do chính nó sở hữu. Event khác hoặc hệ thống khác
không được gọi `unlock` thay.

## Story state và tính nguyên tử

### Flag và quest

Flag phải đặt tên theo namespace:

```text
act1.pallet.prologue.completed
act1.pallet.pokedex.received
act2.route1.spearow.escaped
```

Các flag cũ như `pallet_lab_gate_event_done` được giữ alias trong giai đoạn
chuyển tiếp nhưng không được tạo thêm tên mới theo kiểu cũ.

### Commit transaction

Một event cần ghi trước các thay đổi dự kiến:

```ts
const tx = storyState.beginTransaction(eventId);
tx.setFlag('act1.pallet.pokedex.received', true);
tx.giveItem('poke_ball', 5);
tx.advanceQuest('quest_starter_journey', 2);
await tx.commit();
```

Nếu event bị hủy trước `commit()`, các phần thưởng và flag chưa được áp dụng.
Nếu commit đã thành công, event phải được coi là hoàn thành và không chạy lại.

## Trigger và thứ tự ưu tiên

Tất cả trigger đi qua `StoryEventRegistry` và `StoryTriggerEvaluator`.

Khi có nhiều event cùng đủ điều kiện:

1. event đang chạy được giữ nguyên;
2. event có `priority` cao hơn được chọn;
3. nếu bằng nhau, chọn event có act/scene nhỏ hơn;
4. event đã completed hoặc đang cooldown bị loại;
5. chỉ một event được start trong mỗi tick.

Trigger không dùng tọa độ hardcode nếu tọa độ có thể thay đổi theo seed. Dùng
anchor:

```ts
trigger: {
  type: 'anchor_proximity',
  anchorId: 'starter_village.exit_gate',
  radius: 2,
}
```

## World preparation trước khi chạy event

Mỗi event có thể yêu cầu vùng hoạt động:

```ts
prepareWorld: {
  anchors: ['oak_lab.front_door'],
  loadRadius: 1,
  suppressWildlife: true,
  freezeTime: false,
}
```

`StoryWorldPort.prepareArea()` phải hoàn thành trước khi camera hoặc actor xuất
hiện. Điều này tránh:

- cutscene chạy trên nền đen;
- camera ở chunk cũ;
- actor nằm ngoài vùng đã load;
- wildlife hoặc NPC xuất hiện giữa cutscene;
- event dùng tọa độ chưa được sinh.

## Actor story

Actor story không được lưu rải rác trong từng event manager.

Dùng `StoryActorRegistry`:

```ts
const actor = actors.spawn({
  id: 'act2.route1.solo_spearow',
  species: 'spearow',
  anchor: 'route1.spearow_marker',
});
```

Renderer chỉ render actor từ registry. Actor controller chỉ cập nhật khi event
đang sở hữu actor đó.

Khi cleanup:

```ts
actors.despawnOwnedBy(eventId);
```

Như vậy actor của Route 1 không thể bị nhầm với Pokémon hoang dã hoặc NPC bình
thường.

## Checkpoint và khôi phục

Checkpoint phải ghi theo event, scene và step:

```ts
interface StoryRuntimeCheckpoint {
  eventId: string;
  sceneId: string;
  stepIndex: number;
  status: 'preparing' | 'running' | 'committed' | 'aborted';
  actorState?: Record<string, unknown>;
  createdAt: number;
}
```

Quy tắc:

- Không ghi checkpoint `completed` trước khi commit.
- Khi tải lại ở trạng thái `running`, chạy cleanup trước rồi resume từ scene an
  toàn gần nhất.
- Không resume giữa một thao tác không nguyên tử như đang trao item hoặc đang
  bắt Pokémon.
- Nếu checkpoint hỏng, rollback về scene chưa bắt đầu gần nhất.

## Battle, Wildlife, NPC và Interior

### Battle

Event không gọi trực tiếp `startWildBattle`. Dùng:

```ts
const result = await battlePort.startStoryBattle(config);
```

Battle trả về kết quả rõ ràng: `victory`, `defeat`, `caught`, `escaped`,
`cancelled`. Story chỉ commit flag sau khi nhận kết quả hợp lệ.

### Wildlife

Event không sửa trực tiếp `chunk.wildPokemon`.

Dùng các API có ownership:

- `wildlife.acquireAreaLock(eventId, bounds)`;
- `wildlife.suppressArea(eventId, bounds)`;
- `wildlife.releaseAreaLock(eventId)`;
- `wildlife.restoreArea(eventId)`.

Không được xóa toàn bộ wildlife toàn map chỉ vì một event cục bộ.

### NPC

NPC thường phải nhận biết vùng story lock. Khi actor story chiếm ô, NPC không
được tự đi vào khu vực đó.

### Interior

Interior là một world context riêng. Event phải khai báo rõ chạy ở overworld hay
interior; không dùng flag ngầm để suy đoán camera và input.

## Quy tắc cho `GameSession`

`GameSession` chỉ giữ vai trò host:

```ts
storyDirector.update(dtMs, {
  player: this.player,
  camera: this.camera,
  chunkManager: this.chunkManager,
  worldClock: this.worldClock,
});
```

Không thêm các điều kiện story mới trực tiếp vào vòng lặp chính như:

```ts
if (someFlag) {
  someEventManager.update(...);
}
```

Mọi event mới phải được đăng ký qua Registry.

## Tiêu chuẩn kiểm thử bắt buộc

Mỗi event mới phải có các test sau:

1. Không trigger khi thiếu prerequisite.
2. Trigger đúng anchor/room/interaction.
3. Không trigger lần hai sau khi completed.
4. Không chạy song song với event khác.
5. Input/camera/world lock được release khi thành công.
6. Input/camera/world lock được release khi abort.
7. Không tạo actor trùng sau reload.
8. Không mất flag/item/party khi commit.
9. Không ghi phần thưởng khi event bị hủy trước commit.
10. Resume hoặc rollback đúng sau save/load.

## Lộ trình chuyển đổi

### Giai đoạn 1: Khóa kiến trúc

- Giữ `StoryManager` làm nền tảng của `StoryDirector`.
- Thêm priority, event status và lock ownership.
- Không thêm event manager mới kiểu singleton riêng.

### Giai đoạn 2: Chuyển Pallet

- Đưa các scene Pallet vào `StoryEventDefinition`.
- Giữ actor logic hiện tại nhưng gọi qua `StoryActorRegistry`.
- Xóa các nhánh trigger trực tiếp trong `GameSession` sau khi test tương đương.

### Giai đoạn 3: Chuyển Route 1

- Đưa Spearow solo và flock vào actor controller của Story.
- Bỏ `route1SpearowEventManager.update()` khỏi `GameSession`.
- Trigger dùng anchor động thay vì tọa độ cố định.

### Giai đoạn 4: Chuẩn hóa phần thưởng và save

- Thêm transaction cho item, party, quest và flag.
- Lưu checkpoint theo scene/step.
- Thêm test reload/abort/duplicate event.

### Giai đoạn 5: Dọn kiến trúc cũ

- Xóa `apps/web/src/npc/cutscene-runner.ts` nếu không còn caller.
- Xóa các DOM dialogue riêng của event manager.
- Chỉ giữ một `CutsceneRunner`, một dialogue port và một camera port.

## Tiêu chí hoàn thành

Kiến trúc được coi là ổn định khi:

- `GameSession` không biết tên từng event cụ thể.
- Mỗi event có đúng một owner và một lifecycle.
- Event bị abort không để lại lock, actor, dialogue hoặc weather override.
- Save/load giữa cutscene không tạo actor hoặc phần thưởng trùng.
- Wildlife, NPC, battle và interior chỉ bị ảnh hưởng trong phạm vi event đã khai
  báo.
- Toàn bộ event có thể kiểm thử bằng context giả mà không cần mở browser thật.
