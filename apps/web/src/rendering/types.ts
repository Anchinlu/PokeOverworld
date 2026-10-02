import { TILE_IDS } from '@pokemon/game-data';

export interface RenderItem {
  ySort: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

export interface RenderOptions {
  showHills: boolean;
  showRoad: boolean;
  showBeach: boolean;
  showTrees: boolean;
  showChunkGrid: boolean;
  showCollision: boolean;
  showHitbox: boolean;
  showGrid: boolean;
  showTallGrass: boolean;
  showPlants: boolean;
  showBerries: boolean;
  showHeatmap: boolean;
  showWater: boolean;
  showEcologyMoisture: boolean;
  showEcologyFertility: boolean;
  showEcologyDensity: boolean;
  showEcologyZone: boolean;
}

export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  showHills: true,
  showRoad: true,
  showBeach: true,
  showTrees: true,
  showChunkGrid: true,
  showCollision: true,
  showHitbox: false,
  showGrid: false,
  showTallGrass: true,
  showPlants: true,
  showBerries: true,
  showHeatmap: false,
  showWater: true,
  showEcologyMoisture: false,
  showEcologyFertility: false,
  showEcologyDensity: false,
  showEcologyZone: false,
};

export const TILE_KEY_BY_ID: Record<number, string> = {
  // Grass
  [TILE_IDS.grass_01]: 'grass_1',
  [TILE_IDS.grass_02]: 'grass_2',
  [TILE_IDS.grass_03]: 'grass_3',
  [TILE_IDS.grass_04]: 'grass_4',
  [TILE_IDS.grass_variant]: 'grass_variant',
  // Road
  [TILE_IDS.dirt_pure]: 'path_pure',
  [TILE_IDS.path_top]: 'path_top',
  [TILE_IDS.path_bot]: 'path_bot',
  [TILE_IDS.path_left]: 'path_left',
  [TILE_IDS.path_right]: 'path_right',
  [TILE_IDS.path_tl]: 'path_tl',
  [TILE_IDS.path_tr]: 'path_tr',
  [TILE_IDS.path_bl]: 'path_bl',
  [TILE_IDS.path_br]: 'path_br',
  [TILE_IDS.path_in_tl]: 'path_in_tl',
  [TILE_IDS.path_in_tr]: 'path_in_tr',
  [TILE_IDS.path_in_bl]: 'path_in_bl',
  [TILE_IDS.path_in_br]: 'path_in_br',
  // Sand
  [TILE_IDS.sand_pure]: 'sand_pure',
  [TILE_IDS.sand_top]: 'sand_top',
  [TILE_IDS.sand_bot]: 'sand_bot',
  [TILE_IDS.sand_left]: 'sand_left',
  [TILE_IDS.sand_right]: 'sand_right',
  [TILE_IDS.sand_tl]: 'sand_tl',
  [TILE_IDS.sand_tr]: 'sand_tr',
  [TILE_IDS.sand_bl]: 'sand_bl',
  [TILE_IDS.sand_br]: 'sand_br',
  [TILE_IDS.sand_in_tl]: 'sand_in_tl',
  [TILE_IDS.sand_in_tr]: 'sand_in_tr',
  [TILE_IDS.sand_in_bl]: 'sand_in_bl',
  [TILE_IDS.sand_in_br]: 'sand_in_br',
  // Cliff
  [TILE_IDS.cliff_pure]: 'cliff_pure',
  [TILE_IDS.cliff_top]: 'cliff_top',
  [TILE_IDS.cliff_bot]: 'cliff_bot',
  [TILE_IDS.cliff_left]: 'cliff_left',
  [TILE_IDS.cliff_right]: 'cliff_right',
  [TILE_IDS.cliff_tl]: 'cliff_tl',
  [TILE_IDS.cliff_tr]: 'cliff_tr',
  [TILE_IDS.cliff_bl]: 'cliff_bl',
  [TILE_IDS.cliff_br]: 'cliff_br',
  [TILE_IDS.cliff_in_tl]: 'cliff_in_tl',
  [TILE_IDS.cliff_in_tr]: 'cliff_in_tr',
  [TILE_IDS.cliff_in_bl]: 'cliff_in_bl',
  [TILE_IDS.cliff_in_br]: 'cliff_in_br',
  // Tall Grass
  [TILE_IDS.tall_grass]: 'tall_grass',
  // Water autotile & bridges
  [TILE_IDS.water_pure]: 'water_pure',
  [TILE_IDS.water_top]: 'water_top',
  [TILE_IDS.water_bot]: 'water_bot',
  [TILE_IDS.water_left]: 'water_left',
  [TILE_IDS.water_right]: 'water_right',
  [TILE_IDS.water_tl]: 'water_tl',
  [TILE_IDS.water_tr]: 'water_tr',
  [TILE_IDS.water_bl]: 'water_bl',
  [TILE_IDS.water_br]: 'water_br',
  [TILE_IDS.water_in_tl]: 'water_in_tl',
  [TILE_IDS.water_in_tr]: 'water_in_tr',
  [TILE_IDS.water_in_bl]: 'water_in_bl',
  [TILE_IDS.water_in_br]: 'water_in_br',
  [TILE_IDS.bridge_wood_h]: 'bridge_wood_h',
  [TILE_IDS.bridge_wood_v]: 'bridge_wood_v',
};
