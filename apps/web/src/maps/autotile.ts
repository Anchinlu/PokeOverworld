import { TILE_IDS } from '@pokemon/game-data';
import { isSandTile, isOceanTile, isRoadTile, isHillTile, isWaterOrBridge } from './terrain-rules';
import { seededHash } from './noise';

export interface AutotileResult {
  key: string;
  tileId: number;
}

/**
 * Resolves 3x3 autotile connectivity for Beach Sand (300 series).
 */
export function getSandTileKey(
  gx: number,
  gy: number,
  seed: number,
  hasBeach = true
): AutotileResult {
  const isSandOrOcean = (x: number, y: number) =>
    isSandTile(x, y, seed, hasBeach) || isOceanTile(x, y, seed, hasBeach);

  const n = isSandOrOcean(gx, gy - 1);
  const s = isSandOrOcean(gx, gy + 1);
  const w = isSandOrOcean(gx - 1, gy);
  const e = isSandOrOcean(gx + 1, gy);
  const nw = isSandOrOcean(gx - 1, gy - 1);
  const ne = isSandOrOcean(gx + 1, gy - 1);
  const sw = isSandOrOcean(gx - 1, gy + 1);
  const se = isSandOrOcean(gx + 1, gy + 1);

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
 * Resolves 3x3 autotile connectivity for Dirt Road / Path (200 series).
 */
export function getRoadTileKey(
  gx: number,
  gy: number,
  seed: number,
  hasRoad = true,
  hasBeach = true
): AutotileResult {
  const n = isRoadTile(gx, gy - 1, seed, hasRoad, hasBeach);
  const s = isRoadTile(gx, gy + 1, seed, hasRoad, hasBeach);
  const w = isRoadTile(gx - 1, gy, seed, hasRoad, hasBeach);
  const e = isRoadTile(gx + 1, gy, seed, hasRoad, hasBeach);
  const nw = isRoadTile(gx - 1, gy - 1, seed, hasRoad, hasBeach);
  const ne = isRoadTile(gx + 1, gy - 1, seed, hasRoad, hasBeach);
  const sw = isRoadTile(gx - 1, gy + 1, seed, hasRoad, hasBeach);
  const se = isRoadTile(gx + 1, gy + 1, seed, hasRoad, hasBeach);

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
  seed: number,
  hasHills = true,
  hasRoad = true,
  hasBeach = true
): AutotileResult {
  const n = isHillTile(gx, gy - 1, seed, hasHills, hasRoad, hasBeach);
  const s = isHillTile(gx, gy + 1, seed, hasHills, hasRoad, hasBeach);
  const w = isHillTile(gx - 1, gy, seed, hasHills, hasRoad, hasBeach);
  const e = isHillTile(gx + 1, gy, seed, hasHills, hasRoad, hasBeach);
  const nw = isHillTile(gx - 1, gy - 1, seed, hasHills, hasRoad, hasBeach);
  const ne = isHillTile(gx + 1, gy - 1, seed, hasHills, hasRoad, hasBeach);
  const sw = isHillTile(gx - 1, gy + 1, seed, hasHills, hasRoad, hasBeach);
  const se = isHillTile(gx + 1, gy + 1, seed, hasHills, hasRoad, hasBeach);

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
  seed: number,
  hasWater = true,
  hasRoad = true,
  hasBeach = true,
  hasHills = true
): AutotileResult {
  const n = isWaterOrBridge(gx, gy - 1, seed, hasWater, hasRoad, hasBeach, hasHills);
  const s = isWaterOrBridge(gx, gy + 1, seed, hasWater, hasRoad, hasBeach, hasHills);
  const w = isWaterOrBridge(gx - 1, gy, seed, hasWater, hasRoad, hasBeach, hasHills);
  const e = isWaterOrBridge(gx + 1, gy, seed, hasWater, hasRoad, hasBeach, hasHills);
  const nw = isWaterOrBridge(gx - 1, gy - 1, seed, hasWater, hasRoad, hasBeach, hasHills);
  const ne = isWaterOrBridge(gx + 1, gy - 1, seed, hasWater, hasRoad, hasBeach, hasHills);
  const sw = isWaterOrBridge(gx - 1, gy + 1, seed, hasWater, hasRoad, hasBeach, hasHills);
  const se = isWaterOrBridge(gx + 1, gy + 1, seed, hasWater, hasRoad, hasBeach, hasHills);

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
