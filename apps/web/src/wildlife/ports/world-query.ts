export type TileContext =
  | 'tall_grass'
  | 'forest_floor'
  | 'water_surface'
  | 'shore'
  | 'rock'
  | 'sand'
  | 'walkable_ground';

export type TimeBand = 'dawn' | 'day' | 'dusk' | 'night';
export type WeatherType = 'clear' | 'rain' | 'sand' | 'snow' | string;

export interface WorldQuery {
  isWalkable(gx: number, gy: number): boolean;
  contextAt(gx: number, gy: number): TileContext;
  biomeAt(gx: number, gy: number): string;
  difficultyAt(gx: number, gy: number): number;
  timeBand(): TimeBand;
  weather(): WeatherType;
}
