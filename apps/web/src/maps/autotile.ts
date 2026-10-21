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
  // if it is Beach Sand, Ocean, Water, Desert, or Dark Land.
  const isConnected = (x: number, y: number) => {
    if (field.isSand(x, y, hasBeach) || field.isOcean(x, y, hasBeach)) return true;
    if (field.isWater && field.isWater(x, y)) return true;
    if (field.isWaterOrBridge && field.isWaterOrBridge(x, y)) return true;
    if (field.isDesert && field.isDesert(x, y)) return true;
    if (field.isDarkLand && field.isDarkLand(x, y)) return true;
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
  // if it is Desert, or if it is Ocean, Water, Beach Sand, or Dark Land.
  const isConnected = (x: number, y: number) => {
    if (field.isDesert && field.isDesert(x, y)) return true;
    if (field.isOcean && field.isOcean(x, y)) return true;
    if (field.isWater && field.isWater(x, y)) return true;
    if (field.isWaterOrBridge && field.isWaterOrBridge(x, y)) return true;
    if (field.isSand && field.isSand(x, y)) return true;
    if (field.isDarkLand && field.isDarkLand(x, y)) return true;
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
      else if (r < 0.40) tileId = TILE_IDS.dark_ground_var3;
      else tileId = TILE_IDS.dark_ground_pure;
    }
  }

  return { key, tileId };
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

  let key = 'pure';
  let tileId: number = TILE_IDS.water_pure;

  if (!n && !w) {
    key = 'tl';
    tileId = TILE_IDS.water_tl;
  } else if (!n && !e) {
    key = 'tr';
    tileId = TILE_IDS.water_tr;
  } else if (!s && !w) {
    key = 'bl';
    tileId = TILE_IDS.water_bl;
  } else if (!s && !e) {
    key = 'br';
    tileId = TILE_IDS.water_br;
  } else if (!n) {
    key = 'top';
    tileId = TILE_IDS.water_top;
  } else if (!s) {
    key = 'bot';
    tileId = TILE_IDS.water_bot;
  } else if (!w) {
    key = 'left';
    tileId = TILE_IDS.water_left;
  } else if (!e) {
    key = 'right';
    tileId = TILE_IDS.water_right;
  } else if (n && s && w && e) {
    if (!nw) {
      key = 'in_tl';
      tileId = TILE_IDS.water_in_tl;
    } else if (!ne) {
      key = 'in_tr';
      tileId = TILE_IDS.water_in_tr;
    } else if (!sw) {
      key = 'in_bl';
      tileId = TILE_IDS.water_in_bl;
    } else if (!se) {
      key = 'in_br';
      tileId = TILE_IDS.water_in_br;
    } else {
      key = 'pure';
      tileId = TILE_IDS.water_pure;
    }
  }

  return { key, tileId };
}
