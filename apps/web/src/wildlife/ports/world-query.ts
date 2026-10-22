import type { RuntimeBiomeId } from '../../maps/ecology';

export type TileContext =
  'tall_grass' | 'forest_floor' | 'water_surface' | 'shore' | 'rock' | 'sand' | 'walkable_ground';

export type TimeBand = 'dawn' | 'day' | 'dusk' | 'night';
export type WeatherType =
  'clear' | 'sun' | 'rain' | 'heavy_rain' | 'sand' | 'snow' | 'fog' | 'thunderstorm' | string;

export interface WorldQuery {
  isWalkable(
    gx: number,
    gy: number,
    fromGX?: number,
    fromGY?: number,
    canJumpHills?: boolean
  ): boolean;
  isElevated?(gx: number, gy: number): boolean;
  contextAt(gx: number, gy: number): TileContext;
  biomeAt(gx: number, gy: number): RuntimeBiomeId;
  difficultyAt(gx: number, gy: number): number;
  timeBand(): TimeBand;
  weather(): WeatherType;
}
