import type { InteriorRoomConfig } from './interior-types';

/**
 * Cấu hình Nội Thất Nhà Player (1F & 2F)
 * Sử dụng chính xác 100% bộ 23 tài nguyên do người dùng cung cấp từ:
 * C:\Users\lctan\Downloads\Thanh phan the gioi\làng khởi đầu\Nhà player
 *
 * 1. sàn nhà.png (house_floor, 32x32, 1x1 ô)
 * 2. tường.png (house_wall, 32x64, 1x2 ô)
 * 3. cửa sổ.png (house_window, 64x64, 2x2 ô)
 * 4. bức tranh.png (house_painting_sea, 64x64, 2x2 ô)
 * 5. tranh treo tường.png (house_wall_cert, 64x64, 2x2 ô)
 * 6. chậu cây trong nhà.png (house_plant, 32x64, 1x2 ô)
 * 7. nồi súp.png (house_soup_pot, 32x64, 1x2 ô)
 * 8. thảm sanf.png (house_rug_orange, 32x64, 1x2 ô)
 * 9. bồn rửa.png (house_sink, 64x64, 2x2 ô)
 * 10. cầu thang đi lên.png (house_stairs_up, 64x64, 2x2 ô)
 * 11. cầu thang đi xuống.png (house_stairs_down, 64x64, 2x2 ô)
 * 12. bàn.png (house_table, 64x64, 2x2 ô)
 * 13. thảm duói bàn.png (house_rug_green, 96x96, 3x3 ô)
 * 14. thùng hàng.png (house_box, 32x32, 1x1 ô)
 * 15. tivi.png (house_tv, 32x96, 1x3 ô)
 * 16. tủ lạnh.png (house_fridge, 32x96, 1x3 ô)
 * 17. tủ trang trí.png (house_dresser_phone, 64x96, 2x3 ô)
 * 18. kệ sách.png (house_drawer_small, 64x96, 2x3 ô)
 * 19. máy vi tính.png (house_pc, 64x96, 2x3 ô)
 * 20. bàn trang trí.png (house_dresser_vase, 96x96, 3x3 ô)
 * 21. tủ sách.png (house_bookshelf, 64x128, 2x4 ô)
 * 22. giường.png (house_bed, 128x128, 4x4 ô)
 * 23. ghế  trái và phải.png (house_chair_pair, 64x96, 2x3 ô)
 */

export const PLAYER_HOUSE_1F_CONFIG: InteriorRoomConfig = {
  id: 'player_house_1f',
  name: 'Nhà của Player - Tầng 1 (Phòng Khách & Bếp)',
  widthTiles: 16,
  heightTiles: 11,
  floorAssetKey: 'house_floor',
  wallAssetKey: 'house_wall',
  wallHeightTiles: 2,
  spawnGX: 3,
  spawnGY: 9,
  spawnDirection: 3, // Nhìn hướng Bắc (vào trong nhà)
  exitWarp: {
    gx: 3,
    gy: 10,
    label: 'Cửa ra sân Làng Khởi Đầu',
  },
  stairsWarps: [
    {
      gx: 14,
      gy: 2,
      targetRoomId: 'player_house_2f',
      targetGX: 3,
      targetGY: 2,
      targetDir: 0,
      label: 'Lên Tầng 2 (Phòng ngủ)',
    },
    {
      gx: 15,
      gy: 2,
      targetRoomId: 'player_house_2f',
      targetGX: 3,
      targetGY: 2,
      targetDir: 0,
      label: 'Lên Tầng 2 (Phòng ngủ)',
    },
  ],
  props: [
    // --- Lớp Nền Sàn (Floor Layer - render dưới chân bàn ghế) ---
    // 1. Thảm cam đón tiếp ở cửa ra vào (thảm sanf.png, 1x2 ô)
    {
      id: 'house_1f_door_mat',
      assetKey: 'house_rug_orange',
      gx: 3,
      gy: 9,
      widthTiles: 1,
      heightTiles: 2,
      isSolid: false,
      layer: 'floor',
    },
    // 2. Thảm cam chân cầu thang đi lên (thảm sanf.png, 1x2 ô - đặt ở gx: 13 trước lối vào cầu thang)
    {
      id: 'house_1f_stair_mat',
      assetKey: 'house_rug_orange',
      gx: 13,
      gy: 2,
      widthTiles: 1,
      heightTiles: 2,
      isSolid: false,
      layer: 'floor',
    },
    // 3. Thảm xanh chấm bi dưới bàn ăn (thảm duói bàn.png, 3x3 ô = 96x96 px)
    {
      id: 'house_1f_rug_green',
      assetKey: 'house_rug_green',
      gx: 6,
      gy: 4,
      widthTiles: 3,
      heightTiles: 3,
      isSolid: false,
      layer: 'floor',
    },

    // --- Dãy Nội Thất Tường Bắc (Hàng 0 - 2) ---
    // 4. Tủ lạnh 3 ngăn (tủ lạnh.png, 1x3 ô)
    {
      id: 'house_1f_fridge',
      assetKey: 'house_fridge',
      gx: 1,
      gy: 0,
      widthTiles: 1,
      heightTiles: 3,
      isSolid: true,
      solidOffsetX: 0,
      solidOffsetY: 1,
      solidWidthTiles: 1,
      solidHeightTiles: 2,
      interactText: 'Tủ lạnh đầy ắp thức ăn tươi ngon và nước hoa quả ngọt lành do Mẹ chuẩn bị.',
    },
    // 5. Bồn rửa bát và bếp ga (bồn rửa.png, 2x2 ô - đặt ở gy: 1 để chân tủ tiếp đất trên sàn hàng 2)
    {
      id: 'house_1f_sink',
      assetKey: 'house_sink',
      gx: 2,
      gy: 1,
      widthTiles: 2,
      heightTiles: 2,
      isSolid: true,
      solidOffsetX: 0,
      solidOffsetY: 0,
      solidWidthTiles: 2,
      solidHeightTiles: 2,
      interactText: 'Bồn rửa bát sạch bóng và bếp ga ấm cúng trong căn bếp của Mẹ.',
    },
    // 6. Nồi súp đang sôi liu riu (nồi súp.png, 1x2 ô - đặt ở gy: 1 trên mặt bếp)
    {
      id: 'house_1f_soup_pot',
      assetKey: 'house_soup_pot',
      gx: 4,
      gy: 1,
      widthTiles: 1,
      heightTiles: 2,
      isSolid: true,
      solidOffsetX: 0,
      solidOffsetY: 0,
      solidWidthTiles: 1,
      solidHeightTiles: 2,
      interactText: 'Nồi súp rau củ nóng hổi đang sôi sùng sục trên bếp, tỏa hương thơm nức cả phòng!',
    },
    // 7. Cửa sổ rèm vàng đón nắng (cửa sổ.png, 2x2 ô)
    {
      id: 'house_1f_window',
      assetKey: 'house_window',
      gx: 6,
      gy: 0,
      widthTiles: 2,
      heightTiles: 2,
      isSolid: false,
      interactText: 'Cửa sổ đón những tia nắng ban mai ấm áp chiếu rọi vào phòng khách.',
    },
    // 8. Bức tranh phong cảnh biển (bức tranh.png, 2x2 ô)
    {
      id: 'house_1f_painting_sea',
      assetKey: 'house_painting_sea',
      gx: 8,
      gy: 0,
      widthTiles: 2,
      heightTiles: 2,
      isSolid: false,
      interactText: 'Bức tranh bờ biển xanh cát trắng tuyệt đẹp được lồng khung gỗ treo cẩn thận.',
    },
    // 9. Tivi phòng khách (tivi.png, 1x3 ô)
    {
      id: 'house_1f_tv',
      assetKey: 'house_tv',
      gx: 10,
      gy: 0,
      widthTiles: 1,
      heightTiles: 3,
      isSolid: true,
      solidOffsetX: 0,
      solidOffsetY: 1,
      solidWidthTiles: 1,
      solidHeightTiles: 2,
      interactText: 'Trên tivi đang chiếu bộ phim: "Bốn cậu bé đang đi bộ dọc theo đường ray xe lửa..." Mình cũng nên sẵn sàng lên đường thôi!',
    },
    // 10. Tủ trang trí kèm điện thoại bàn (tủ trang trí.png, 2x3 ô - đặt ở gx: 11 để dành gx: 13 cho lối vào cầu thang)
    {
      id: 'house_1f_dresser_phone',
      assetKey: 'house_dresser_phone',
      gx: 11,
      gy: 0,
      widthTiles: 2,
      heightTiles: 3,
      isSolid: true,
      solidOffsetX: 0,
      solidOffsetY: 1,
      solidWidthTiles: 2,
      solidHeightTiles: 2,
      interactText: 'Chiếc tủ đựng đồ cổ điển với điện thoại bàn quay số. Hiện không có tin nhắn thoại mới.',
    },
    // 11. Cầu thang gỗ đi lên tầng 2 (cầu thang đi lên.png, 2x2 ô - ySortOffset: -70 để đảm bảo nhân vật luôn đứng TRÊN cầu thang chứ không bị cầu thang đè lên người)
    {
      id: 'house_1f_stairs_up',
      assetKey: 'house_stairs_up',
      gx: 14,
      gy: 1,
      widthTiles: 2,
      heightTiles: 2,
      isSolid: false,
      ySortOffset: -70,
      interactText: 'Cầu thang gỗ dẫn lên Tầng 2 (Phòng ngủ của Red).',
    },

    // --- Khu Vực Bàn Ăn Trung Tâm (Hàng 4 - 6) ---
    // 12. Ghế bên trái bàn ăn (ghế  trái và phải.png - nửa trái: x=0..31, y=0..95 - hitbox 2 ô ở hàng 5 và 6, chừa hàng 4 đi sau ghế)
    {
      id: 'house_1f_chair_left',
      assetKey: 'house_chair_pair',
      gx: 5,
      gy: 4,
      widthTiles: 1,
      heightTiles: 3,
      sourceX: 0,
      sourceY: 0,
      sourceWidth: 32,
      sourceHeight: 96,
      isSolid: true,
      solidOffsetX: 0,
      solidOffsetY: 1,
      solidWidthTiles: 1,
      solidHeightTiles: 2,
      interactText: 'Chiếc ghế đệm màu xanh thoải mái bên bàn ăn.',
    },
    // 13. Bàn ăn khăn trải ca-rô xanh (bàn.png, 2x2 ô = 64x64 px - đặt tại tâm thảm xanh gx: 6.5, gy: 4.5, phủ kín hitbox hàng 5 và 6)
    {
      id: 'house_1f_table',
      assetKey: 'house_table',
      gx: 6.5,
      gy: 4.5,
      widthTiles: 2,
      heightTiles: 2,
      isSolid: true,
      solidOffsetX: -0.5,
      solidOffsetY: 0.5,
      solidWidthTiles: 3,
      solidHeightTiles: 2,
      interactText: 'Chiếc bàn ăn gia đình với khăn trải bàn ca-rô xanh sạch sẽ.',
    },
    // 14. Ghế bên phải bàn ăn (ghế  trái và phải.png - nửa phải: x=32..63, y=0..95 - đặt ở gx: 9 đối xứng mép phải thảm, hitbox 2 ô ở hàng 5 và 6)
    {
      id: 'house_1f_chair_right',
      assetKey: 'house_chair_pair',
      gx: 9,
      gy: 4,
      widthTiles: 1,
      heightTiles: 3,
      sourceX: 32,
      sourceY: 0,
      sourceWidth: 32,
      sourceHeight: 96,
      isSolid: true,
      solidOffsetX: 0,
      solidOffsetY: 1,
      solidWidthTiles: 1,
      solidHeightTiles: 2,
      interactText: 'Chiếc ghế đệm màu xanh thoải mái bên bàn ăn.',
    },

    // --- Chậu Cây Cảnh Góc Phòng (chậu cây trong nhà.png, 1x2 ô) ---
    // 15. Chậu cây góc dưới bên trái
    {
      id: 'house_1f_plant_left',
      assetKey: 'house_plant',
      gx: 1,
      gy: 8,
      widthTiles: 1,
      heightTiles: 2,
      isSolid: true,
      solidOffsetX: 0,
      solidOffsetY: 0,
      solidWidthTiles: 1,
      solidHeightTiles: 2,
      interactText: 'Chậu cây phong thủy xanh tốt được Mẹ chăm sóc chu đáo mỗi ngày.',
    },
    // 16. Chậu cây góc dưới bên phải
    {
      id: 'house_1f_plant_right',
      assetKey: 'house_plant',
      gx: 14,
      gy: 8,
      widthTiles: 1,
      heightTiles: 2,
      isSolid: true,
      solidOffsetX: 0,
      solidOffsetY: 0,
      solidWidthTiles: 1,
      solidHeightTiles: 2,
      interactText: 'Chậu cây xanh mướt đặt cạnh góc phòng khách mang lại không khí trong lành.',
    },
  ],
  npcs: [
    {
      id: 'char_mom',
      name: 'Mẹ',
      spriteKey: 'char_mom',
      gx: 4,
      gy: 5,
      direction: 2, // Hướng mặt sang phải về phía bàn ăn và con yêu
      dialogue: [
        'Mẹ: Chào con yêu! Hôm nay con đã sẵn sàng cho chuyến phiêu lưu lớn chưa?',
        'Giáo sư Oak vừa ghé qua và tìm con đấy. Bác ấy đang ở Viện Nghiên Cứu Oak phía nam làng.',
        'Mỗi khi mệt mỏi hay các bạn Pokémon cần nghỉ ngơi, con hãy về nhà nhé. Mẹ luôn nấu những bữa ăn ngon lành chờ con!',
        'Đội hình Pokémon của con đã được Mẹ chăm sóc và hồi phục đầy đủ năng lượng!',
      ],
      idleBehavior: 'turn_random',
      turnIntervalMs: 4000,
      lookAtPlayerRadius: 2.5,
      ambientEmotePool: ['heart', 'music', 'sparkle'],
      actionsOnComplete: [{ type: 'HEAL_PARTY' }],
    },
  ],
};

/**
 * Cấu hình Tầng 2 (2F - Phòng ngủ & Góc PC của Red)
 */
export const PLAYER_HOUSE_2F_CONFIG: InteriorRoomConfig = {
  id: 'player_house_2f',
  name: 'Nhà của Player - Tầng 2 (Phòng Ngủ của Red)',
  widthTiles: 14,
  heightTiles: 11,
  floorAssetKey: 'house_floor',
  wallAssetKey: 'house_wall',
  wallHeightTiles: 2,
  spawnGX: 3,
  spawnGY: 2,
  spawnDirection: 0, // Nhìn hướng Nam (vừa từ cầu thang lên bước ra thảm)
  stairsWarps: [
    {
      gx: 1,
      gy: 2,
      targetRoomId: 'player_house_1f',
      targetGX: 13,
      targetGY: 2,
      targetDir: 0,
      label: 'Xuống Tầng 1 (Phòng khách)',
    },
    {
      gx: 2,
      gy: 2,
      targetRoomId: 'player_house_1f',
      targetGX: 13,
      targetGY: 2,
      targetDir: 0,
      label: 'Xuống Tầng 1 (Phòng khách)',
    },
  ],
  props: [
    // --- Lớp Nền Sàn (Floor Layer) ---
    // 1. Thảm cam chân cầu thang đi xuống (thảm sanf.png, 1x2 ô - đặt ở gx: 3 trên sàn thoáng đãng)
    {
      id: 'house_2f_stair_mat',
      assetKey: 'house_rug_orange',
      gx: 3,
      gy: 2,
      widthTiles: 1,
      heightTiles: 2,
      isSolid: false,
      layer: 'floor',
    },
    // 2. Thảm xanh chấm bi thư giãn giữa phòng ngủ (thảm duói bàn.png, 3x3 ô = 96x96 px)
    {
      id: 'house_2f_rug_green',
      assetKey: 'house_rug_green',
      gx: 6,
      gy: 5,
      widthTiles: 3,
      heightTiles: 3,
      isSolid: false,
      layer: 'floor',
    },

    // --- Dãy Nội Thất Tường Bắc (Hàng 0 - 2) ---
    // 3. Cầu thang đi xuống tầng 1 kèm lan can bảo vệ (cầu thang đi xuống.png, 2x2 ô - ySortOffset: -70 để đảm bảo nhân vật luôn đứng TRÊN cầu thang)
    {
      id: 'house_2f_stairs_down',
      assetKey: 'house_stairs_down',
      gx: 1,
      gy: 1,
      widthTiles: 2,
      heightTiles: 2,
      isSolid: false,
      ySortOffset: -70,
      interactText: 'Cầu thang đi xuống Tầng 1 (Phòng khách & Bếp).',
    },
    // 4. Tủ sách lớn bằng gỗ sồi (tủ sách.png, 2x4 ô - dời sang gx: 4 để dành gx: 3 cho thảm và lối đi cầu thang)
    {
      id: 'house_2f_bookshelf',
      assetKey: 'house_bookshelf',
      gx: 4,
      gy: 0,
      widthTiles: 2,
      heightTiles: 4,
      isSolid: true,
      solidOffsetX: 0,
      solidOffsetY: 1,
      solidWidthTiles: 2,
      solidHeightTiles: 3,
      interactText: 'Tủ sách lớn đầy ắp sách hướng dẫn bắt Pokémon, bản đồ vùng Kanto và bách khoa toàn thư.',
    },
    // 5. Kệ tủ nhỏ màu xanh (kệ sách.png, 2x3 ô - đặt ở gx: 6)
    {
      id: 'house_2f_drawer_small',
      assetKey: 'house_drawer_small',
      gx: 6,
      gy: 0,
      widthTiles: 2,
      heightTiles: 3,
      isSolid: true,
      solidOffsetX: 0,
      solidOffsetY: 1,
      solidWidthTiles: 2,
      solidHeightTiles: 2,
      interactText: 'Kệ tủ nhỏ chứa đồ dùng học tập và các món kỉ niệm thời thơ ấu của Red.',
    },
    // 6. Cửa sổ phòng ngủ (cửa sổ.png, 2x2 ô - treo tường ở gx: 8)
    {
      id: 'house_2f_window',
      assetKey: 'house_window',
      gx: 8,
      gy: 0,
      widthTiles: 2,
      heightTiles: 2,
      isSolid: false,
      interactText: 'Cửa sổ nhìn ra những hàng cây xanh mướt và những mái nhà ngói đỏ của Làng Khởi Đầu.',
    },
    // 7. Bằng khen / Tranh treo tường (tranh treo tường.png, 1x2 ô - treo tường ở gx: 10)
    {
      id: 'house_2f_wall_cert',
      assetKey: 'house_wall_cert',
      gx: 10,
      gy: 0,
      widthTiles: 1,
      heightTiles: 2,
      isSolid: false,
      interactText: 'Bằng khen danh dự Huấn Luyện Viên Pokémon Tập Sự treo ngay ngắn trên tường!',
    },
    // 8. Bàn máy tính cá nhân của Red (máy vi tính.png, 2x3 ô - đặt ở gx: 11)
    {
      id: 'house_2f_pc',
      assetKey: 'house_pc',
      gx: 11,
      gy: 0,
      widthTiles: 2,
      heightTiles: 3,
      isSolid: true,
      solidOffsetX: 0,
      solidOffsetY: 1,
      solidWidthTiles: 2,
      solidHeightTiles: 2,
      interactText: 'Máy tính cá nhân của Red đã kết nối Hệ thống Lưu trữ Pokémon của Bill. Hiện trong hòm đồ có 1 x Potion!',
    },

    // --- Khu Vực Nghỉ Ngơi & Giải Trí (Hàng 4 - 8) ---
    // 9. Giường ngủ đôi bằng gỗ của Red (giường.png, 4x4 ô = 128x128 px - toàn bộ 4x4 ô đều rắn)
    {
      id: 'house_2f_bed',
      assetKey: 'house_bed',
      gx: 1,
      gy: 5,
      widthTiles: 4,
      heightTiles: 4,
      isSolid: true,
      solidOffsetX: 0,
      solidOffsetY: 0,
      solidWidthTiles: 4,
      solidHeightTiles: 4,
      interactText: 'Chiếc giường êm ái với chiếc chăn họa tiết xanh quen thuộc của Red. Nằm xuống đánh một giấc thật ngon nào!',
    },
    // 10. Thùng các-tông đựng đồ chuyển nhà (thùng hàng.png, 1x1 ô)
    {
      id: 'house_2f_box',
      assetKey: 'house_box',
      gx: 5,
      gy: 8,
      widthTiles: 1,
      heightTiles: 1,
      isSolid: true,
      interactText: 'Thùng các-tông đựng đồ đạc đã được đóng gói cẩn thận cho chuyến hành trình sắp tới.',
    },
    // 11. Tivi phòng ngủ (tivi.png, 1x3 ô)
    {
      id: 'house_2f_tv',
      assetKey: 'house_tv',
      gx: 7,
      gy: 4,
      widthTiles: 1,
      heightTiles: 3,
      isSolid: true,
      solidOffsetX: 0,
      solidOffsetY: 1,
      solidWidthTiles: 1,
      solidHeightTiles: 2,
      interactText: 'Chiếc tivi kết nối với máy chơi game NES / Famicom!',
    },
    // 12. Máy chơi game console (house_console, 1x1 ô)
    {
      id: 'house_2f_console',
      assetKey: 'house_console',
      gx: 7,
      gy: 7,
      widthTiles: 1,
      heightTiles: 1,
      isSolid: true,
      interactText: 'Máy chơi game Famicom cổ điển! Trò chơi đang chạy ở màn 1-1.',
    },
    // 13. Bàn trang trí có bình hoa cẩm tú cầu (bàn trang trí.png, 3x3 ô - toàn bộ 3x3 ô đều rắn)
    {
      id: 'house_2f_dresser_vase',
      assetKey: 'house_dresser_vase',
      gx: 10,
      gy: 5,
      widthTiles: 3,
      heightTiles: 3,
      isSolid: true,
      solidOffsetX: 0,
      solidOffsetY: 0,
      solidWidthTiles: 3,
      solidHeightTiles: 3,
      interactText: 'Chiếc bàn gỗ trang nhã với bình hoa cẩm tú cầu xanh tươi và khung ảnh lưu niệm gia đình.',
    },
  ],
  npcs: [],
};
