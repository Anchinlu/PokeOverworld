import { TILE_IDS } from '@pokemon/game-data';
import { createTerrainField, type TerrainField } from './terrain-field';
import { seededHash } from './noise';

export interface AutotileResult {
  key: string;
  tileId: number;
}

function toField(seedOrField: number | TerrainField = 101): TerrainField {
  return typeof seedOrField === 'number' ? createTerrainField(1, seedOrField) : seedOrField;
}

/**
 * Resolves 3x3 autotile connectivity for Beach Sand (300 series).
 */
export function getSandTileKey(
  gx: number,
  gy: number,
  seedOrField: number | TerrainField = 101,
  hasBeach = true
): AutotileResult {
  const field = toField(seedOrField);
  // A neighbor tile is considered connected (does NOT require meadow grass fringe)
  // if it is Beach Sand, Ocean, Water, Desert, Dark Land, Snow, or Rocky Highland.
  // Rocky Highland is intentionally included here as well as in
  // getRockyGroundTileKey: otherwise the sand side of a rocky coastline falls
  // back to sand_* fringe tiles and exposes a strip of meadow-green grass
  // between the beach and the stone terrain.
  const isConnected = (x: number, y: number) => {
    if (field.isSand(x, y, hasBeach) || field.isOcean(x, y, hasBeach)) return true;
    if (field.isWater && field.isWater(x, y)) return true;
    if (field.isWaterOrBridge && field.isWaterOrBridge(x, y)) return true;
    if (field.isDesert && field.isDesert(x, y)) return true;
    if (field.isDarkLand && field.isDarkLand(x, y)) return true;
    if (field.isSnow && field.isSnow(x, y)) return true;
    if (field.isRockyHighland && field.isRockyHighland(x, y)) return true;
    return false;
  };

  const n = isConnected(gx, gy - 1);
  const s = isConnected(gx, gy + 1);
  const w = isConnected(gx - 1, gy);
  const e = isConnected(gx + 1, gy);
  const nw = isConnected(gx - 1, gy - 1);
  const ne = isConnected(gx + 1, gy - 1);
  const sw = isConnected(gx - 1, gy + 1);
  const se = isConnected(gx + 1, gy + 1);

  let key = 'pure';
  let tileId: number = TILE_IDS.sand_pure;

  if (!n && !w) {
    key = 'tl';
    tileId = TILE_IDS.sand_tl;
  } else if (!n && !e) {
    key = 'tr';
    tileId = TILE_IDS.sand_tr;
  } else if (!s && !w) {
    key = 'bl';
    tileId = TILE_IDS.sand_bl;
  } else if (!s && !e) {
    key = 'br';
    tileId = TILE_IDS.sand_br;
  } else if (!n) {
    key = 'top';
    tileId = TILE_IDS.sand_top;
  } else if (!s) {
    key = 'bot';
    tileId = TILE_IDS.sand_bot;
  } else if (!w) {
    key = 'left';
    tileId = TILE_IDS.sand_left;
  } else if (!e) {
    key = 'right';
    tileId = TILE_IDS.sand_right;
  } else if (n && s && w && e) {
    if (!nw) {
      key = 'in_tl';
      tileId = TILE_IDS.sand_in_tl;
    } else if (!ne) {
      key = 'in_tr';
      tileId = TILE_IDS.sand_in_tr;
    } else if (!sw) {
      key = 'in_bl';
      tileId = TILE_IDS.sand_in_bl;
    } else if (!se) {
      key = 'in_br';
      tileId = TILE_IDS.sand_in_br;
    } else {
      key = 'pure';
      tileId = TILE_IDS.sand_pure;
    }
  }

  return { key, tileId };
}

/**
 * Resolves autotile connectivity for Flat Desert Ground (350 series).
 * Ground is pure, smooth sand. When bordering grass, it creates a soft,
 * seamless flat transition without borrowing coastal sand tiles.
 * When bordering Ocean, Beach Sand, or Dark Land, it does NOT borrow grass boundaries.
 */
export function getDesertTileKey(
  gx: number,
  gy: number,
  seedOrField: number | TerrainField = 101
): AutotileResult {
  const field = toField(seedOrField);

  // A neighbor tile is considered connected (does NOT require meadow grass fringe)
  // if it is Desert, Autumn, or if it is Ocean, Water, Beach Sand, or Dark Land.
  // Autumn and Desert currently have no dedicated pair-transition atlas, so
  // treating them as connected prevents the generic meadow-green fringe from
  // appearing between two non-meadow biomes.
  const isConnected = (x: number, y: number) => {
    if (field.isDesert && field.isDesert(x, y)) return true;
    if (field.isAutumn && field.isAutumn(x, y)) return true;
    if (field.isOcean && field.isOcean(x, y)) return true;
    if (field.isWater && field.isWater(x, y)) return true;
    if (field.isWaterOrBridge && field.isWaterOrBridge(x, y)) return true;
    if (field.isSand && field.isSand(x, y)) return true;
    if (field.isDarkLand && field.isDarkLand(x, y)) return true;
    if (field.isSnow && field.isSnow(x, y)) return true;
    return false;
  };

  const n = isConnected(gx, gy - 1);
  const s = isConnected(gx, gy + 1);
  const w = isConnected(gx - 1, gy);
  const e = isConnected(gx + 1, gy);
  const nw = isConnected(gx - 1, gy - 1);
  const ne = isConnected(gx + 1, gy - 1);
  const sw = isConnected(gx - 1, gy + 1);
  const se = isConnected(gx + 1, gy + 1);

  let key = 'pure';
  let tileId: number = TILE_IDS.desert_pure;

  if (!n && !w) {
    key = 'tl';
    tileId = TILE_IDS.desert_tl;
  } else if (!n && !e) {
    key = 'tr';
    tileId = TILE_IDS.desert_tr;
  } else if (!s && !w) {
    key = 'bl';
    tileId = TILE_IDS.desert_bl;
  } else if (!s && !e) {
    key = 'br';
    tileId = TILE_IDS.desert_br;
  } else if (!n) {
    key = 'top';
    tileId = TILE_IDS.desert_top;
  } else if (!s) {
    key = 'bot';
    tileId = TILE_IDS.desert_bot;
  } else if (!w) {
    key = 'left';
    tileId = TILE_IDS.desert_left;
  } else if (!e) {
    key = 'right';
    tileId = TILE_IDS.desert_right;
  } else if (n && s && w && e) {
    if (!nw) {
      key = 'in_tl';
      tileId = TILE_IDS.desert_in_tl;
    } else if (!ne) {
      key = 'in_tr';
      tileId = TILE_IDS.desert_in_tr;
    } else if (!sw) {
      key = 'in_bl';
      tileId = TILE_IDS.desert_in_bl;
    } else if (!se) {
      key = 'in_br';
      tileId = TILE_IDS.desert_in_br;
    } else {
      key = 'pure';
      const r = seededHash(gx, gy, field.seed + 555);
      if (r < 0.12) tileId = TILE_IDS.desert_pure_var1;
      else if (r < 0.24) tileId = TILE_IDS.desert_pure_var2;
      else tileId = TILE_IDS.desert_pure;
    }
  }

  return { key, tileId };
}

/**
 * Resolves 3x3 autotile connectivity for Desert Dune Cliffs (420 series).
 * Sliced from the desert cliff tileset (đất xa mạc & đất xa mạc bổ sung).
 * Used exclusively for elevated sand dunes / hills (đồi cát cao với vách đá) in the desert.
 */
export function getDuneCliffTileKey(
  gx: number,
  gy: number,
  seedOrField: number | TerrainField = 101,
  hasHills = true,
  hasRoad = true,
  hasBeach = true
): AutotileResult {
  const field = toField(seedOrField);
  const n = field.isHill(gx, gy - 1, hasHills, hasRoad, hasBeach);
  const s = field.isHill(gx, gy + 1, hasHills, hasRoad, hasBeach);
  const w = field.isHill(gx - 1, gy, hasHills, hasRoad, hasBeach);
  const e = field.isHill(gx + 1, gy, hasHills, hasRoad, hasBeach);
  const nw = field.isHill(gx - 1, gy - 1, hasHills, hasRoad, hasBeach);
  const ne = field.isHill(gx + 1, gy - 1, hasHills, hasRoad, hasBeach);
  const sw = field.isHill(gx - 1, gy + 1, hasHills, hasRoad, hasBeach);
  const se = field.isHill(gx + 1, gy + 1, hasHills, hasRoad, hasBeach);

  let key = 'pure';
  let tileId: number = TILE_IDS.dune_cliff_pure;

  if (!n && !w) {
    key = 'tl';
    tileId = TILE_IDS.dune_cliff_tl;
  } else if (!n && !e) {
    key = 'tr';
    tileId = TILE_IDS.dune_cliff_tr;
  } else if (!s && !w) {
    key = 'bl';
    tileId = TILE_IDS.dune_cliff_bl;
  } else if (!s && !e) {
    key = 'br';
    tileId = TILE_IDS.dune_cliff_br;
  } else if (!n) {
    key = 'top';
    tileId = TILE_IDS.dune_cliff_top;
  } else if (!s) {
    key = 'bot';
    tileId = TILE_IDS.dune_cliff_bot;
  } else if (!w) {
    key = 'left';
    tileId = TILE_IDS.dune_cliff_left;
  } else if (!e) {
    key = 'right';
    tileId = TILE_IDS.dune_cliff_right;
  } else if (n && s && w && e) {
    if (!nw) {
      key = 'in_bl';
      tileId = TILE_IDS.dune_cliff_in_bl;
    } else if (!ne) {
      key = 'in_br';
      tileId = TILE_IDS.dune_cliff_in_br;
    } else if (!sw) {
      key = 'in_tr';
      tileId = TILE_IDS.dune_cliff_in_tr;
    } else if (!se) {
      key = 'in_tl';
      tileId = TILE_IDS.dune_cliff_in_tl;
    } else {
      const res = getDesertTileKey(gx, gy, field);
      if (res.key === 'pure') {
        return { key: 'pure', tileId: TILE_IDS.dune_cliff_pure };
      }
      return res;
    }
  }

  return { key, tileId };
}

/**
 * Resolves 3x3 autotile connectivity for Cursed Dark Ground (440 series).
 * When bordering Ocean, Beach Sand, or Desert, it does NOT borrow grass boundaries.
 */
export function getDarkGroundTileKey(
  gx: number,
  gy: number,
  seedOrField: number | TerrainField = 101
): AutotileResult {
  const field = toField(seedOrField);

  // A neighbor tile is considered connected (does NOT require meadow grass fringe)
  // if it is Dark Land, or if it is Ocean, Water, Beach Sand, or Desert.
  const isConnected = (x: number, y: number) => {
    if (field.isDarkLand && field.isDarkLand(x, y)) return true;
    if (field.isOcean && field.isOcean(x, y)) return true;
    if (field.isWater && field.isWater(x, y)) return true;
    if (field.isWaterOrBridge && field.isWaterOrBridge(x, y)) return true;
    if (field.isSand && field.isSand(x, y)) return true;
    if (field.isDesert && field.isDesert(x, y)) return true;
    return false;
  };

  const n = isConnected(gx, gy - 1);
  const s = isConnected(gx, gy + 1);
  const w = isConnected(gx - 1, gy);
  const e = isConnected(gx + 1, gy);
  const nw = isConnected(gx - 1, gy - 1);
  const ne = isConnected(gx + 1, gy - 1);
  const sw = isConnected(gx - 1, gy + 1);
  const se = isConnected(gx + 1, gy + 1);

  let key = 'pure';
  let tileId: number = TILE_IDS.dark_ground_pure;

  if (!n && !w) {
    key = 'tl';
    tileId = TILE_IDS.dark_ground_tl;
  } else if (!n && !e) {
    key = 'tr';
    tileId = TILE_IDS.dark_ground_tr;
  } else if (!s && !w) {
    key = 'bl';
    tileId = TILE_IDS.dark_ground_bl;
  } else if (!s && !e) {
    key = 'br';
    tileId = TILE_IDS.dark_ground_br;
  } else if (!n) {
    key = 'top';
    tileId = TILE_IDS.dark_ground_top;
  } else if (!s) {
    key = 'bot';
    tileId = TILE_IDS.dark_ground_bot;
  } else if (!w) {
    key = 'left';
    tileId = TILE_IDS.dark_ground_left;
  } else if (!e) {
    key = 'right';
    tileId = TILE_IDS.dark_ground_right;
  } else if (n && s && w && e) {
    if (!nw) {
      key = 'in_tl';
      tileId = TILE_IDS.dark_ground_in_tl;
    } else if (!ne) {
      key = 'in_tr';
      tileId = TILE_IDS.dark_ground_in_tr;
    } else if (!sw) {
      key = 'in_bl';
      tileId = TILE_IDS.dark_ground_in_bl;
    } else if (!se) {
      key = 'in_br';
      tileId = TILE_IDS.dark_ground_in_br;
    } else {
      key = 'pure';
      const r = seededHash(gx, gy, field.seed + 777);
      if (r < 0.15) tileId = TILE_IDS.dark_ground_var1;
      else if (r < 0.28) tileId = TILE_IDS.dark_ground_var2;
      else if (r < 0.4) tileId = TILE_IDS.dark_ground_var3;
      else tileId = TILE_IDS.dark_ground_pure;
    }
  }

  return { key, tileId };
}

/**
 * Resolves 3x3 autotile connectivity for Golden Autumn Ground (480 series).
 * Creates a natural serrated grass boundary fringe when bordering meadow grass,
 * sand, or other terrain types.
 */
export function getAutumnGroundTileKey(
  gx: number,
  gy: number,
  seedOrField: number | TerrainField = 101
): AutotileResult {
  const field = toField(seedOrField);

  // A neighbor tile is considered connected if it is in the Autumn Forest biome,
  // Desert, or water. Autumn and Desert share a hard natural boundary until a
  // dedicated autumn-desert transition atlas is available; this prevents a
  // meadow-green fringe from being inserted between them.
  const isConnected = (x: number, y: number) => {
    if (field.isWater && field.isWater(x, y)) return true;
    if (field.isAutumn && field.isAutumn(x, y)) return true;
    if (field.isDesert && field.isDesert(x, y)) return true;
    return false;
  };

  const n = isConnected(gx, gy - 1);
  const s = isConnected(gx, gy + 1);
  const w = isConnected(gx - 1, gy);
  const e = isConnected(gx + 1, gy);
  const nw = isConnected(gx - 1, gy - 1);
  const ne = isConnected(gx + 1, gy - 1);
  const sw = isConnected(gx - 1, gy + 1);
  const se = isConnected(gx + 1, gy + 1);

  let key = 'pure';
  let tileId: number = TILE_IDS.ground_autumn_pure;

  if (!n && !w) {
    key = 'tl';
    tileId = TILE_IDS.ground_autumn_tl;
  } else if (!n && !e) {
    key = 'tr';
    tileId = TILE_IDS.ground_autumn_tr;
  } else if (!s && !w) {
    key = 'bl';
    tileId = TILE_IDS.ground_autumn_bl;
  } else if (!s && !e) {
    key = 'br';
    tileId = TILE_IDS.ground_autumn_br;
  } else if (!n) {
    key = 'top';
    tileId = TILE_IDS.ground_autumn_top;
  } else if (!s) {
    key = 'bot';
    tileId = TILE_IDS.ground_autumn_bot;
  } else if (!w) {
    key = 'left';
    tileId = TILE_IDS.ground_autumn_left;
  } else if (!e) {
    key = 'right';
    tileId = TILE_IDS.ground_autumn_right;
  } else if (n && s && w && e) {
    if (!nw) {
      key = 'in_tl';
      tileId = TILE_IDS.ground_autumn_in_tl;
    } else if (!ne) {
      key = 'in_tr';
      tileId = TILE_IDS.ground_autumn_in_tr;
    } else if (!sw) {
      key = 'in_bl';
      tileId = TILE_IDS.ground_autumn_in_bl;
    } else if (!se) {
      key = 'in_br';
      tileId = TILE_IDS.ground_autumn_in_br;
    } else {
      key = 'pure';
      tileId = TILE_IDS.ground_autumn_pure;
    }
  }

  return { key, tileId };
}

/**
 * Resolves 3x3 autotile connectivity for Snow Ground (510 series).
 * Creates natural serrated snow fringe boundary when bordering meadow grass, sand, etc.
 */
export function getSnowGroundTileKey(
  gx: number,
  gy: number,
  seedOrField: number | TerrainField = 101
): AutotileResult {
  const field = toField(seedOrField);

  // A neighbor tile is considered connected if it is in the Snow biome,
  // water, or ocean. Bordering any other land biome uses the snow boundary
  // grass fringe (`ground_snow_top..br`) over the base grass layer.
  const isConnected = (x: number, y: number) => {
    if (field.isSnow && field.isSnow(x, y)) return true;
    if (field.isWater && field.isWater(x, y)) return true;
    if (field.isWaterOrBridge && field.isWaterOrBridge(x, y)) return true;
    if (field.isOcean && field.isOcean(x, y)) return true;
    return false;
  };

  const n = isConnected(gx, gy - 1);
  const s = isConnected(gx, gy + 1);
  const w = isConnected(gx - 1, gy);
  const e = isConnected(gx + 1, gy);
  const nw = isConnected(gx - 1, gy - 1);
  const ne = isConnected(gx + 1, gy - 1);
  const sw = isConnected(gx - 1, gy + 1);
  const se = isConnected(gx + 1, gy + 1);

  let key = 'pure';
  let tileId: number = TILE_IDS.ground_snow_pure;

  if (!n && !w) {
    key = 'tl';
    tileId = TILE_IDS.ground_snow_tl;
  } else if (!n && !e) {
    key = 'tr';
    tileId = TILE_IDS.ground_snow_tr;
  } else if (!s && !w) {
    key = 'bl';
    tileId = TILE_IDS.ground_snow_bl;
  } else if (!s && !e) {
    key = 'br';
    tileId = TILE_IDS.ground_snow_br;
  } else if (!n) {
    key = 'top';
    tileId = TILE_IDS.ground_snow_top;
  } else if (!s) {
    key = 'bot';
    tileId = TILE_IDS.ground_snow_bot;
  } else if (!w) {
    key = 'left';
    tileId = TILE_IDS.ground_snow_left;
  } else if (!e) {
    key = 'right';
    tileId = TILE_IDS.ground_snow_right;
  } else if (n && s && w && e) {
    if (!nw) {
      key = 'in_tl';
      tileId = TILE_IDS.ground_snow_in_tl;
    } else if (!ne) {
      key = 'in_tr';
      tileId = TILE_IDS.ground_snow_in_tr;
    } else if (!sw) {
      key = 'in_bl';
      tileId = TILE_IDS.ground_snow_in_bl;
    } else if (!se) {
      key = 'in_br';
      tileId = TILE_IDS.ground_snow_in_br;
    } else {
      key = 'pure';
      tileId = TILE_IDS.ground_snow_pure;
    }
  }

  return { key, tileId };
}

/**
 * Resolves 3x3 autotile connectivity for Snow Hills / Cliffs (530 series).
 * Sliced from đồi cao vùng băng tuyết.
 * When on snow terrain, elevated hills render as snow-capped cliffs.
 */
export function getSnowCliffTileKey(
  gx: number,
  gy: number,
  seedOrField: number | TerrainField = 101,
  hasHills = true,
  hasRoad = true,
  hasBeach = true
): AutotileResult {
  const field = toField(seedOrField);
  const n = field.isHill(gx, gy - 1, hasHills, hasRoad, hasBeach);
  const s = field.isHill(gx, gy + 1, hasHills, hasRoad, hasBeach);
  const w = field.isHill(gx - 1, gy, hasHills, hasRoad, hasBeach);
  const e = field.isHill(gx + 1, gy, hasHills, hasRoad, hasBeach);
  const nw = field.isHill(gx - 1, gy - 1, hasHills, hasRoad, hasBeach);
  const ne = field.isHill(gx + 1, gy - 1, hasHills, hasRoad, hasBeach);
  const sw = field.isHill(gx - 1, gy + 1, hasHills, hasRoad, hasBeach);
  const se = field.isHill(gx + 1, gy + 1, hasHills, hasRoad, hasBeach);

  let key = 'pure';
  let tileId: number = TILE_IDS.cliff_snow_pure;

  if (!n && !w) {
    key = 'tl';
    tileId = TILE_IDS.cliff_snow_tl;
  } else if (!n && !e) {
    key = 'tr';
    tileId = TILE_IDS.cliff_snow_tr;
  } else if (!s && !w) {
    key = 'bl';
    tileId = TILE_IDS.cliff_snow_bl;
  } else if (!s && !e) {
    key = 'br';
    tileId = TILE_IDS.cliff_snow_br;
  } else if (!n) {
    key = 'top';
    tileId = TILE_IDS.cliff_snow_top;
  } else if (!s) {
    key = 'bot';
    tileId = TILE_IDS.cliff_snow_bot;
  } else if (!w) {
    key = 'left';
    tileId = TILE_IDS.cliff_snow_left;
  } else if (!e) {
    key = 'right';
    tileId = TILE_IDS.cliff_snow_right;
  } else if (n && s && w && e) {
    if (!nw) {
      key = 'in_bl';
      tileId = TILE_IDS.cliff_snow_in_bl;
    } else if (!ne) {
      key = 'in_br';
      tileId = TILE_IDS.cliff_snow_in_br;
    } else if (!sw) {
      key = 'in_tr';
      tileId = TILE_IDS.cliff_snow_in_tr;
    } else if (!se) {
      key = 'in_tl';
      tileId = TILE_IDS.cliff_snow_in_tl;
    } else {
      key = 'pure';
      tileId = TILE_IDS.cliff_snow_pure;
    }
  }

  return { key, tileId };
}

/**
 * Resolves 3x3 autotile connectivity for Rocky Highland ground (570 series).
 * Outer boundary tiles (tl, top, tr, left, right, bl, bot, br, in_tl..br)
 * have alpha=0 outer margins so underlying meadow grass renders underneath.
 */
export function getRockyGroundTileKey(
  gx: number,
  gy: number,
  seedOrField: number | TerrainField = 101
): AutotileResult {
  const field = toField(seedOrField);
  // A neighbor tile is considered connected if it is Rocky Highland,
  // or freshwater bodies within the rocky terrain. Beach Sand is intentionally
  // NOT connected so Rocky Highland autotiles its boundary fringes (ground_rock_*)
  // against the beach instead of hard-cutting as a raw ground_rock_pure block.
  const isConnected = (x: number, y: number) => {
    if (field.isRockyHighland && field.isRockyHighland(x, y)) return true;
    if (field.isOcean && field.isOcean(x, y)) return true;
    if (field.isWater && field.isWater(x, y)) return true;
    if (field.isWaterOrBridge && field.isWaterOrBridge(x, y)) return true;
    return false;
  };

  const n = isConnected(gx, gy - 1);
  const s = isConnected(gx, gy + 1);
  const w = isConnected(gx - 1, gy);
  const e = isConnected(gx + 1, gy);
  const nw = isConnected(gx - 1, gy - 1);
  const ne = isConnected(gx + 1, gy - 1);
  const sw = isConnected(gx - 1, gy + 1);
  const se = isConnected(gx + 1, gy + 1);

  let key = 'pure';
  let tileId: number = TILE_IDS.ground_rock_pure;

  if (!n && !w) {
    key = 'tl';
    tileId = TILE_IDS.ground_rock_tl;
  } else if (!n && !e) {
    key = 'tr';
    tileId = TILE_IDS.ground_rock_tr;
  } else if (!s && !w) {
    key = 'bl';
    tileId = TILE_IDS.ground_rock_bl;
  } else if (!s && !e) {
    key = 'br';
    tileId = TILE_IDS.ground_rock_br;
  } else if (!n) {
    key = 'top';
    tileId = TILE_IDS.ground_rock_top;
  } else if (!s) {
    key = 'bot';
    tileId = TILE_IDS.ground_rock_bot;
  } else if (!w) {
    key = 'left';
    tileId = TILE_IDS.ground_rock_left;
  } else if (!e) {
    key = 'right';
    tileId = TILE_IDS.ground_rock_right;
  } else if (n && s && w && e) {
    if (!nw) {
      key = 'in_tl';
      tileId = TILE_IDS.ground_rock_in_tl;
    } else if (!ne) {
      key = 'in_tr';
      tileId = TILE_IDS.ground_rock_in_tr;
    } else if (!sw) {
      key = 'in_bl';
      tileId = TILE_IDS.ground_rock_in_bl;
    } else if (!se) {
      key = 'in_br';
      tileId = TILE_IDS.ground_rock_in_br;
    } else {
      key = 'pure';
      tileId = TILE_IDS.ground_rock_pure;
    }
  }

  return { key, tileId };
}

/**
 * Resolves 3x3 autotile connectivity for 1-tier Rocky Hills (585 series, đồi đá.png).
 * Players CAN jump onto these 1-tier rocky hills using the Space key.
 */
export function getRockyCliffTileKey(
  gx: number,
  gy: number,
  seedOrField: number | TerrainField = 101,
  hasHills = true,
  hasRoad = true,
  hasBeach = true
): AutotileResult {
  const field = toField(seedOrField);
  const isRH = (x: number, y: number) =>
    field.isHill(x, y, hasHills, hasRoad, hasBeach) &&
    Boolean(field.isRockyHighland && field.isRockyHighland(x, y)) &&
    !(field.isHighCliff && field.isHighCliff(x, y));

  const n = isRH(gx, gy - 1);
  const s = isRH(gx, gy + 1);
  const w = isRH(gx - 1, gy);
  const e = isRH(gx + 1, gy);
  const nw = isRH(gx - 1, gy - 1);
  const ne = isRH(gx + 1, gy - 1);
  const sw = isRH(gx - 1, gy + 1);
  const se = isRH(gx + 1, gy + 1);

  let key = 'pure';
  let tileId: number = TILE_IDS.cliff_rock_pure;

  if (!n && !w) {
    key = 'tl';
    tileId = TILE_IDS.cliff_rock_tl;
  } else if (!n && !e) {
    key = 'tr';
    tileId = TILE_IDS.cliff_rock_tr;
  } else if (!s && !w) {
    key = 'bl';
    tileId = TILE_IDS.cliff_rock_bl;
  } else if (!s && !e) {
    key = 'br';
    tileId = TILE_IDS.cliff_rock_br;
  } else if (!n) {
    key = 'top';
    tileId = TILE_IDS.cliff_rock_top;
  } else if (!s) {
    key = 'bot';
    tileId = TILE_IDS.cliff_rock_bot;
  } else if (!w) {
    key = 'left';
    tileId = TILE_IDS.cliff_rock_left;
  } else if (!e) {
    key = 'right';
    tileId = TILE_IDS.cliff_rock_right;
  } else if (n && s && w && e) {
    if (!nw) {
      key = 'in_bl';
      tileId = TILE_IDS.cliff_rock_in_bl;
    } else if (!ne) {
      key = 'in_br';
      tileId = TILE_IDS.cliff_rock_in_br;
    } else if (!sw) {
      key = 'in_tr';
      tileId = TILE_IDS.cliff_rock_in_tr;
    } else if (!se) {
      key = 'in_tl';
      tileId = TILE_IDS.cliff_rock_in_tl;
    } else {
      key = 'pure';
      tileId = TILE_IDS.cliff_rock_pure;
    }
  }

  return { key, tileId };
}

/**
 * Resolves 3x4 autotile connectivity for 2-tier High Cliffs (620 series, vách đá cao.png).
 * Features a 2-tile tall southern cliff wall (upper row + lower base row) and a flat
 * plateau on top where wild Pokémon and rocks spawn, while blocking player climbing/jumping
 * until Flying Pokémon mount is unlocked.
 */
export function getHighCliffRockTileKey(
  gx: number,
  gy: number,
  seedOrField: number | TerrainField = 101
): AutotileResult {
  const field = toField(seedOrField);
  const isHC = (x: number, y: number) =>
    Boolean(field.isHighCliff ? field.isHighCliff(x, y) : field.isHill(x, y));

  const n = isHC(gx, gy - 1);
  const s = isHC(gx, gy + 1);
  const ss = isHC(gx, gy + 2);
  const w = isHC(gx - 1, gy);
  const e = isHC(gx + 1, gy);
  const nw = isHC(gx - 1, gy - 1);
  const ne = isHC(gx + 1, gy - 1);
  const sw = isHC(gx - 1, gy + 1);
  const se = isHC(gx + 1, gy + 1);

  // 1. Northern Rim (Row 0)
  if (!n) {
    if (!w) return { key: 'tl', tileId: TILE_IDS.high_cliff_rock_tl };
    if (!e) return { key: 'tr', tileId: TILE_IDS.high_cliff_rock_tr };
    return { key: 'top', tileId: TILE_IDS.high_cliff_rock_top };
  }

  // 2. Lower Wall Base (Row 3, where south is ground !s)
  if (!s) {
    if (!w) return { key: 'bl', tileId: TILE_IDS.high_cliff_rock_bl };
    if (!e) return { key: 'br', tileId: TILE_IDS.high_cliff_rock_br };
    if (!nw) return { key: 'in_bl', tileId: TILE_IDS.high_cliff_rock_in_bl };
    if (!ne) return { key: 'in_br', tileId: TILE_IDS.high_cliff_rock_in_br };
    return { key: 'bot', tileId: TILE_IDS.high_cliff_rock_bot };
  }

  // 3. Upper Wall Face (Row 2, where south is lower wall and 2 south is ground: s && !ss)
  if (s && !ss) {
    if (!w) return { key: 'bl_upper', tileId: TILE_IDS.high_cliff_rock_bl_upper };
    if (!e) return { key: 'br_upper', tileId: TILE_IDS.high_cliff_rock_br_upper };
    if (!sw) return { key: 'in_bl_upper', tileId: TILE_IDS.high_cliff_rock_in_bl_upper };
    if (!se) return { key: 'in_br_upper', tileId: TILE_IDS.high_cliff_rock_in_br_upper };
    return { key: 'bot_upper', tileId: TILE_IDS.high_cliff_rock_bot_upper };
  }

  // 4. Plateau Edges (Row 1, where n && s && ss are all cliff)
  if (!w) return { key: 'left', tileId: TILE_IDS.high_cliff_rock_left };
  if (!e) return { key: 'right', tileId: TILE_IDS.high_cliff_rock_right };

  // 5. Plateau Interior & Inner Corners
  if (!nw) return { key: 'in_bl', tileId: TILE_IDS.high_cliff_rock_in_bl };
  if (!ne) return { key: 'in_br', tileId: TILE_IDS.high_cliff_rock_in_br };
  if (!sw) return { key: 'in_tr', tileId: TILE_IDS.high_cliff_rock_in_tr };
  if (!se) return { key: 'in_tl', tileId: TILE_IDS.high_cliff_rock_in_tl };

  return { key: 'pure', tileId: TILE_IDS.high_cliff_rock_pure };
}

/**
 * Resolves 3x3 autotile connectivity for Cursed Dark Cliffs (460 series).
 * Used exclusively for elevated hills / plateaus in the dark land biome.
 */
export function getDarkCliffTileKey(
  gx: number,
  gy: number,
  seedOrField: number | TerrainField = 101,
  hasHills = true,
  hasRoad = true,
  hasBeach = true
): AutotileResult {
  const field = toField(seedOrField);
  const n = field.isHill(gx, gy - 1, hasHills, hasRoad, hasBeach);
  const s = field.isHill(gx, gy + 1, hasHills, hasRoad, hasBeach);
  const w = field.isHill(gx - 1, gy, hasHills, hasRoad, hasBeach);
  const e = field.isHill(gx + 1, gy, hasHills, hasRoad, hasBeach);
  const nw = field.isHill(gx - 1, gy - 1, hasHills, hasRoad, hasBeach);
  const ne = field.isHill(gx + 1, gy - 1, hasHills, hasRoad, hasBeach);
  const sw = field.isHill(gx - 1, gy + 1, hasHills, hasRoad, hasBeach);
  const se = field.isHill(gx + 1, gy + 1, hasHills, hasRoad, hasBeach);

  let key = 'pure';
  let tileId: number = TILE_IDS.dark_cliff_pure;

  if (!n && !w) {
    key = 'tl';
    tileId = TILE_IDS.dark_cliff_tl;
  } else if (!n && !e) {
    key = 'tr';
    tileId = TILE_IDS.dark_cliff_tr;
  } else if (!s && !w) {
    key = 'bl';
    tileId = TILE_IDS.dark_cliff_bl;
  } else if (!s && !e) {
    key = 'br';
    tileId = TILE_IDS.dark_cliff_br;
  } else if (!n) {
    key = 'top';
    tileId = TILE_IDS.dark_cliff_top;
  } else if (!s) {
    key = 'bot';
    tileId = TILE_IDS.dark_cliff_bot;
  } else if (!w) {
    key = 'left';
    tileId = TILE_IDS.dark_cliff_left;
  } else if (!e) {
    key = 'right';
    tileId = TILE_IDS.dark_cliff_right;
  } else if (n && s && w && e) {
    if (!nw) {
      key = 'in_bl';
      tileId = TILE_IDS.dark_cliff_in_bl;
    } else if (!ne) {
      key = 'in_br';
      tileId = TILE_IDS.dark_cliff_in_br;
    } else if (!sw) {
      key = 'in_tr';
      tileId = TILE_IDS.dark_cliff_in_tr;
    } else if (!se) {
      key = 'in_tl';
      tileId = TILE_IDS.dark_cliff_in_tl;
    } else {
      const res = getDarkGroundTileKey(gx, gy, field);
      if (res.key === 'pure') {
        return { key: 'pure', tileId: TILE_IDS.dark_cliff_pure };
      }
      return res;
    }
  }

  return { key, tileId };
}

/**
 * Resolves 3x3 autotile connectivity for Dirt Road / Path (200 series).
 */
export function getRoadTileKey(
  gx: number,
  gy: number,
  seedOrField: number | TerrainField = 101,
  hasRoad = true,
  hasBeach = true
): AutotileResult {
  const field = toField(seedOrField);
  const n = field.isRoad(gx, gy - 1, hasRoad, hasBeach);
  const s = field.isRoad(gx, gy + 1, hasRoad, hasBeach);
  const w = field.isRoad(gx - 1, gy, hasRoad, hasBeach);
  const e = field.isRoad(gx + 1, gy, hasRoad, hasBeach);
  const nw = field.isRoad(gx - 1, gy - 1, hasRoad, hasBeach);
  const ne = field.isRoad(gx + 1, gy - 1, hasRoad, hasBeach);
  const sw = field.isRoad(gx - 1, gy + 1, hasRoad, hasBeach);
  const se = field.isRoad(gx + 1, gy + 1, hasRoad, hasBeach);

  let key = 'pure';
  let tileId: number = TILE_IDS.dirt_pure;

  if (!n && !w) {
    key = 'tl';
    tileId = TILE_IDS.path_tl;
  } else if (!n && !e) {
    key = 'tr';
    tileId = TILE_IDS.path_tr;
  } else if (!s && !w) {
    key = 'bl';
    tileId = TILE_IDS.path_bl;
  } else if (!s && !e) {
    key = 'br';
    tileId = TILE_IDS.path_br;
  } else if (!n) {
    key = 'top';
    tileId = TILE_IDS.path_top;
  } else if (!s) {
    key = 'bot';
    tileId = TILE_IDS.path_bot;
  } else if (!w) {
    key = 'left';
    tileId = TILE_IDS.path_left;
  } else if (!e) {
    key = 'right';
    tileId = TILE_IDS.path_right;
  } else if (n && s && w && e) {
    if (!nw) {
      key = 'in_tl';
      tileId = TILE_IDS.path_in_tl;
    } else if (!ne) {
      key = 'in_tr';
      tileId = TILE_IDS.path_in_tr;
    } else if (!sw) {
      key = 'in_bl';
      tileId = TILE_IDS.path_in_bl;
    } else if (!se) {
      key = 'in_br';
      tileId = TILE_IDS.path_in_br;
    } else {
      key = 'pure';
      tileId = TILE_IDS.dirt_pure;
    }
  }

  return { key, tileId };
}

/**
 * Resolves 3x3 autotile connectivity for Cliff / Hill Plateau (400 series).
 * Note: Inner corner diagonal mappings match the 180° geometric rotation fix:
 * !nw -> in_bl (411), !ne -> in_br (412), !sw -> in_tr (410), !se -> in_tl (409)
 */
export function getCliffTileKey(
  gx: number,
  gy: number,
  seedOrField: number | TerrainField = 101,
  hasHills = true,
  hasRoad = true,
  hasBeach = true
): AutotileResult {
  const field = toField(seedOrField);
  const n = field.isHill(gx, gy - 1, hasHills, hasRoad, hasBeach);
  const s = field.isHill(gx, gy + 1, hasHills, hasRoad, hasBeach);
  const w = field.isHill(gx - 1, gy, hasHills, hasRoad, hasBeach);
  const e = field.isHill(gx + 1, gy, hasHills, hasRoad, hasBeach);
  const nw = field.isHill(gx - 1, gy - 1, hasHills, hasRoad, hasBeach);
  const ne = field.isHill(gx + 1, gy - 1, hasHills, hasRoad, hasBeach);
  const sw = field.isHill(gx - 1, gy + 1, hasHills, hasRoad, hasBeach);
  const se = field.isHill(gx + 1, gy + 1, hasHills, hasRoad, hasBeach);

  let key = 'pure';
  let tileId: number = TILE_IDS.cliff_pure;

  if (!n && !w) {
    key = 'tl';
    tileId = TILE_IDS.cliff_tl;
  } else if (!n && !e) {
    key = 'tr';
    tileId = TILE_IDS.cliff_tr;
  } else if (!s && !w) {
    key = 'bl';
    tileId = TILE_IDS.cliff_bl;
  } else if (!s && !e) {
    key = 'br';
    tileId = TILE_IDS.cliff_br;
  } else if (!n) {
    key = 'top';
    tileId = TILE_IDS.cliff_top;
  } else if (!s) {
    key = 'bot';
    tileId = TILE_IDS.cliff_bot;
  } else if (!w) {
    key = 'left';
    tileId = TILE_IDS.cliff_left;
  } else if (!e) {
    key = 'right';
    tileId = TILE_IDS.cliff_right;
  } else if (n && s && w && e) {
    if (!nw) {
      key = 'in_bl';
      tileId = TILE_IDS.cliff_in_bl;
    } else if (!ne) {
      key = 'in_br';
      tileId = TILE_IDS.cliff_in_br;
    } else if (!sw) {
      key = 'in_tr';
      tileId = TILE_IDS.cliff_in_tr;
    } else if (!se) {
      key = 'in_tl';
      tileId = TILE_IDS.cliff_in_tl;
    } else {
      key = 'pure';
      tileId = TILE_IDS.cliff_pure;
    }
  }

  return { key, tileId };
}

/**
 * Resolves natural grass tile variants (101..104, plus rare 105 flower tuft).
 */
export function getGrassTileId(gx: number, gy: number, seed: number): number {
  const hash = seededHash(gx, gy, seed);
  if (hash < 0.08) {
    return TILE_IDS.grass_variant;
  }
  const variant = Math.floor(hash * 4) % 4;
  const grassTiles = [TILE_IDS.grass_01, TILE_IDS.grass_02, TILE_IDS.grass_03, TILE_IDS.grass_04];
  return grassTiles[variant];
}

/**
 * Resolves 3x3 autotile connectivity for Water bodies (700 series).
 */
export function getWaterTileKey(
  gx: number,
  gy: number,
  seedOrField: number | TerrainField = 101,
  hasWater = true,
  hasRoad = true,
  hasBeach = true,
  hasHills = true
): AutotileResult {
  const field = toField(seedOrField);
  const n = field.isWaterOrBridge(gx, gy - 1, hasWater, hasRoad, hasBeach, hasHills);
  const s = field.isWaterOrBridge(gx, gy + 1, hasWater, hasRoad, hasBeach, hasHills);
  const w = field.isWaterOrBridge(gx - 1, gy, hasWater, hasRoad, hasBeach, hasHills);
  const e = field.isWaterOrBridge(gx + 1, gy, hasWater, hasRoad, hasBeach, hasHills);
  const nw = field.isWaterOrBridge(gx - 1, gy - 1, hasWater, hasRoad, hasBeach, hasHills);
  const ne = field.isWaterOrBridge(gx + 1, gy - 1, hasWater, hasRoad, hasBeach, hasHills);
  const sw = field.isWaterOrBridge(gx - 1, gy + 1, hasWater, hasRoad, hasBeach, hasHills);
  const se = field.isWaterOrBridge(gx + 1, gy + 1, hasWater, hasRoad, hasBeach, hasHills);

  const isAutumnBankSafe =
    (!n ? Boolean(field.isAutumn && field.isAutumn(gx, gy - 1)) : true) &&
    (!s ? Boolean(field.isAutumn && field.isAutumn(gx, gy + 1)) : true) &&
    (!w ? Boolean(field.isAutumn && field.isAutumn(gx - 1, gy)) : true) &&
    (!e ? Boolean(field.isAutumn && field.isAutumn(gx + 1, gy)) : true);
  const isAutumn = Boolean(field.isAutumn && field.isAutumn(gx, gy) && isAutumnBankSafe);

  const isSnowBankSafe =
    (!n ? Boolean(field.isSnow && field.isSnow(gx, gy - 1)) : true) &&
    (!s ? Boolean(field.isSnow && field.isSnow(gx, gy + 1)) : true) &&
    (!w ? Boolean(field.isSnow && field.isSnow(gx - 1, gy)) : true) &&
    (!e ? Boolean(field.isSnow && field.isSnow(gx + 1, gy)) : true);
  const isSnow = Boolean(field.isSnow && field.isSnow(gx, gy) && isSnowBankSafe);

  const isRockyWater = Boolean(
    field.isRockyWater?.(gx, gy) ?? (field.isRockyHighland?.(gx, gy) && field.isWater(gx, gy))
  );
  const isRockyBankSafe =
    (!n ? Boolean(field.isRockyHighland && field.isRockyHighland(gx, gy - 1)) : true) &&
    (!s ? Boolean(field.isRockyHighland && field.isRockyHighland(gx, gy + 1)) : true) &&
    (!w ? Boolean(field.isRockyHighland && field.isRockyHighland(gx - 1, gy)) : true) &&
    (!e ? Boolean(field.isRockyHighland && field.isRockyHighland(gx + 1, gy)) : true);
  const isRocky = Boolean(isRockyWater && isRockyBankSafe);

  let key = 'pure';
  let tileId: number = isSnow
    ? TILE_IDS.water_snow_pure
    : isRocky
      ? TILE_IDS.water_rock_pure
      : isAutumn
        ? TILE_IDS.water_autumn_pure
        : TILE_IDS.water_pure;

  if (!n && !w) {
    key = 'tl';
    tileId = isSnow
      ? TILE_IDS.water_snow_tl
      : isRocky
        ? TILE_IDS.water_rock_tl
        : isAutumn
          ? TILE_IDS.water_autumn_tl
          : TILE_IDS.water_tl;
  } else if (!n && !e) {
    key = 'tr';
    tileId = isSnow
      ? TILE_IDS.water_snow_tr
      : isRocky
        ? TILE_IDS.water_rock_tr
        : isAutumn
          ? TILE_IDS.water_autumn_tr
          : TILE_IDS.water_tr;
  } else if (!s && !w) {
    key = 'bl';
    tileId = isSnow
      ? TILE_IDS.water_snow_bl
      : isRocky
        ? TILE_IDS.water_rock_bl
        : isAutumn
          ? TILE_IDS.water_autumn_bl
          : TILE_IDS.water_bl;
  } else if (!s && !e) {
    key = 'br';
    tileId = isSnow
      ? TILE_IDS.water_snow_br
      : isRocky
        ? TILE_IDS.water_rock_br
        : isAutumn
          ? TILE_IDS.water_autumn_br
          : TILE_IDS.water_br;
  } else if (!n) {
    key = 'top';
    tileId = isSnow
      ? TILE_IDS.water_snow_top
      : isRocky
        ? TILE_IDS.water_rock_top
        : isAutumn
          ? TILE_IDS.water_autumn_top
          : TILE_IDS.water_top;
  } else if (!s) {
    key = 'bot';
    tileId = isSnow
      ? TILE_IDS.water_snow_bot
      : isRocky
        ? TILE_IDS.water_rock_bot
        : isAutumn
          ? TILE_IDS.water_autumn_bot
          : TILE_IDS.water_bot;
  } else if (!w) {
    key = 'left';
    tileId = isSnow
      ? TILE_IDS.water_snow_left
      : isRocky
        ? TILE_IDS.water_rock_left
        : isAutumn
          ? TILE_IDS.water_autumn_left
          : TILE_IDS.water_left;
  } else if (!e) {
    key = 'right';
    tileId = isSnow
      ? TILE_IDS.water_snow_right
      : isRocky
        ? TILE_IDS.water_rock_right
        : isAutumn
          ? TILE_IDS.water_autumn_right
          : TILE_IDS.water_right;
  } else if (n && s && w && e) {
    if (!nw) {
      key = 'in_tl';
      tileId = isSnow
        ? TILE_IDS.water_snow_in_tl
        : isRocky
          ? TILE_IDS.water_rock_in_tl
          : isAutumn
            ? TILE_IDS.water_autumn_in_tl
            : TILE_IDS.water_in_tl;
    } else if (!ne) {
      key = 'in_tr';
      tileId = isSnow
        ? TILE_IDS.water_snow_in_tr
        : isRocky
          ? TILE_IDS.water_rock_in_tr
          : isAutumn
            ? TILE_IDS.water_autumn_in_tr
            : TILE_IDS.water_in_tr;
    } else if (!sw) {
      key = 'in_bl';
      tileId = isSnow
        ? TILE_IDS.water_snow_in_bl
        : isRocky
          ? TILE_IDS.water_rock_in_bl
          : isAutumn
            ? TILE_IDS.water_autumn_in_bl
            : TILE_IDS.water_in_bl;
    } else if (!se) {
      key = 'in_br';
      tileId = isSnow
        ? TILE_IDS.water_snow_in_br
        : isRocky
          ? TILE_IDS.water_rock_in_br
          : isAutumn
            ? TILE_IDS.water_autumn_in_br
            : TILE_IDS.water_in_br;
    } else {
      key = 'pure';
      tileId = isSnow
        ? TILE_IDS.water_snow_pure
        : isRocky
          ? TILE_IDS.water_rock_pure
          : isAutumn
            ? TILE_IDS.water_autumn_pure
            : TILE_IDS.water_pure;
    }
  }

  return {
    key: isSnow ? `snow_${key}` : isRocky ? `rock_${key}` : isAutumn ? `autumn_${key}` : key,
    tileId,
  };
}
