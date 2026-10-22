export type ClimateBand = 'arctic' | 'cold' | 'temperate' | 'warm' | 'hot';

export interface ClimateSample {
  /** Stable baseline temperature derived from seed and world coordinates. */
  temperature: number;
  /** Stable surface moisture derived from seed and world coordinates. */
  moisture: number;
  /** Stable atmospheric humidity derived from seed and world coordinates. */
  humidity: number;
  /** Elevation influence supplied by the terrain field. */
  elevation: number;
  climateBand: ClimateBand;
}
