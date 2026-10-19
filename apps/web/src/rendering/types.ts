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
  showVillages: boolean;
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
  showVillages: true,
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
  // Desert
  [TILE_IDS.desert_pure]: 'desert_pure',
  [TILE_IDS.desert_top]: 'desert_top',
  [TILE_IDS.desert_bot]: 'desert_bot',
  [TILE_IDS.desert_left]: 'desert_left',
  [TILE_IDS.desert_right]: 'desert_right',
  [TILE_IDS.desert_tl]: 'desert_tl',
  [TILE_IDS.desert_tr]: 'desert_tr',
  [TILE_IDS.desert_bl]: 'desert_bl',
  [TILE_IDS.desert_br]: 'desert_br',
  [TILE_IDS.desert_in_tl]: 'desert_in_tl',
  [TILE_IDS.desert_in_tr]: 'desert_in_tr',
  [TILE_IDS.desert_in_bl]: 'desert_in_bl',
  [TILE_IDS.desert_in_br]: 'desert_in_br',
  [TILE_IDS.desert_pure_var1]: 'desert_pure_var1',
  [TILE_IDS.desert_pure_var2]: 'desert_pure_var2',
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
  // Desert Dune Cliff
  [TILE_IDS.dune_cliff_pure]: 'dune_cliff_pure',
  [TILE_IDS.dune_cliff_top]: 'dune_cliff_top',
  [TILE_IDS.dune_cliff_bot]: 'dune_cliff_bot',
  [TILE_IDS.dune_cliff_left]: 'dune_cliff_left',
  [TILE_IDS.dune_cliff_right]: 'dune_cliff_right',
  [TILE_IDS.dune_cliff_tl]: 'dune_cliff_tl',
  [TILE_IDS.dune_cliff_tr]: 'dune_cliff_tr',
  [TILE_IDS.dune_cliff_bl]: 'dune_cliff_bl',
  [TILE_IDS.dune_cliff_br]: 'dune_cliff_br',
  [TILE_IDS.dune_cliff_in_tl]: 'dune_cliff_in_tl',
  [TILE_IDS.dune_cliff_in_tr]: 'dune_cliff_in_tr',
  [TILE_IDS.dune_cliff_in_bl]: 'dune_cliff_in_bl',
  [TILE_IDS.dune_cliff_in_br]: 'dune_cliff_in_br',
  // Dark Land Ground
  [TILE_IDS.dark_ground_pure]: 'dark_ground_pure',
  [TILE_IDS.dark_ground_top]: 'dark_ground_top',
  [TILE_IDS.dark_ground_bot]: 'dark_ground_bot',
  [TILE_IDS.dark_ground_left]: 'dark_ground_left',
  [TILE_IDS.dark_ground_right]: 'dark_ground_right',
  [TILE_IDS.dark_ground_tl]: 'dark_ground_tl',
  [TILE_IDS.dark_ground_tr]: 'dark_ground_tr',
  [TILE_IDS.dark_ground_bl]: 'dark_ground_bl',
  [TILE_IDS.dark_ground_br]: 'dark_ground_br',
  [TILE_IDS.dark_ground_in_tl]: 'dark_ground_in_tl',
  [TILE_IDS.dark_ground_in_tr]: 'dark_ground_in_tr',
  [TILE_IDS.dark_ground_in_bl]: 'dark_ground_in_bl',
  [TILE_IDS.dark_ground_in_br]: 'dark_ground_in_br',
  [TILE_IDS.dark_ground_var1]: 'dark_ground_var1',
  [TILE_IDS.dark_ground_var2]: 'dark_ground_var2',
  [TILE_IDS.dark_ground_var3]: 'dark_ground_var3',
  // Dark Land Cliff
  [TILE_IDS.dark_cliff_pure]: 'dark_cliff_pure',
  [TILE_IDS.dark_cliff_top]: 'dark_cliff_top',
  [TILE_IDS.dark_cliff_bot]: 'dark_cliff_bot',
  [TILE_IDS.dark_cliff_left]: 'dark_cliff_left',
  [TILE_IDS.dark_cliff_right]: 'dark_cliff_right',
  [TILE_IDS.dark_cliff_tl]: 'dark_cliff_tl',
  [TILE_IDS.dark_cliff_tr]: 'dark_cliff_tr',
  [TILE_IDS.dark_cliff_bl]: 'dark_cliff_bl',
  [TILE_IDS.dark_cliff_br]: 'dark_cliff_br',
  [TILE_IDS.dark_cliff_in_tl]: 'dark_cliff_in_tl',
  [TILE_IDS.dark_cliff_in_tr]: 'dark_cliff_in_tr',
  [TILE_IDS.dark_cliff_in_bl]: 'dark_cliff_in_bl',
  [TILE_IDS.dark_cliff_in_br]: 'dark_cliff_in_br',
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
  // Ocean & Shoreline
  [TILE_IDS.ocean_water]: 'ocean_anim_strip',
  [TILE_IDS.shore_v]: 'shore_anim_vertical',
  [TILE_IDS.shore_corner_in]: 'shore_anim_corner_in',
  [TILE_IDS.shore_corner_out]: 'shore_anim_corner_out',
  [TILE_IDS.shore_corner_in_flip]: 'shore_anim_corner_in_flip',
  [TILE_IDS.shore_corner_out_flip]: 'shore_anim_corner_out_flip',
  [TILE_IDS.shore_h]: 'shore_anim_vertical',
  [TILE_IDS.shore_h_top]: 'shore_anim_vertical',
  [TILE_IDS.shore_v_right]: 'shore_anim_vertical',
  [TILE_IDS.shore_corner_in_es]: 'shore_anim_corner_in',
  [TILE_IDS.shore_corner_in_en]: 'shore_anim_corner_in',
  [TILE_IDS.shore_corner_out_se]: 'shore_anim_corner_out',
  [TILE_IDS.shore_corner_out_ne]: 'shore_anim_corner_out',
};

