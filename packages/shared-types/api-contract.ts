/** Shared API and runtime contracts. Planning foundation; not wired to an API yet. */

export type TerrainId = 0 | 1 | 2 | 3 | 4 | 5;
export type Direction = 0 | 1 | 2 | 3;

export interface Point {
  gx: number;
  gy: number;
}

export interface Collider {
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
  [key: string]: unknown;
}

export interface PlayerState {
  gx: number;
  gy: number;
  x: number;
  y: number;
  direction: Direction;
  frame: number;
  moving: boolean;
  targetGX?: number;
  targetGY?: number;
  stepProgress?: number;
}

export interface WildPokemonState extends Point {
  speciesKey: string;
  level: number;
  direction?: Direction;
}

export interface MapChunk {
  version: number;
  cx: number;
  cy: number;
  size: 16;
  seed: number;
  terrainGrid: TerrainId[][];
  tileIdGrid: number[][];
  colliders: Collider[];
  plants: Array<Point & { x?: number; y?: number; type: string }>;
  tallGrass: Array<Point & { x?: number; y?: number }>;
  berryBushes: Array<Point & { x?: number; y?: number; type: string; stage: 0 | 1 | 2 | 3 }>;
  wildPokemon: Array<WildPokemonState & { x?: number; y?: number }>;
}

export interface ApiError {
  code: string;
  message: string;
  requestId?: string;
}
export interface PlayerProfileResponse {
  playerId: string;
  displayName: string;
  state: PlayerState;
}
export interface ChunkResponse {
  chunk: MapChunk;
}

export interface ApiContract {
  'GET /player/profile': { response: PlayerProfileResponse; error: ApiError };
  'GET /maps/:mapId/chunks/:cx/:cy': { response: ChunkResponse; error: ApiError };
}
