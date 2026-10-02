export * from './api-contract';
export * from './pokemon';

/** Schema files are distributed beside this package for validators and tooling. */
export const SCHEMA_FILES = {
  terrain: 'terrain.schema.json',
  tile: 'tile.schema.json',
  map: 'map.schema.json',
  player: 'player.schema.json',
  pokemon: 'pokemon.schema.json',
} as const;
