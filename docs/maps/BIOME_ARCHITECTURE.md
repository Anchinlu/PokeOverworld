# Biome Architecture

## Canonical model

The overworld uses three separate concepts:

- `RuntimeBiomeId`: the ecological identity used by wildlife spawning.
- `TerrainFeature`: physical map features such as hill, river, lake, ocean and
  sand.
- `RegionId`: a large-scale continent region used for macro layout and map
  presentation.

Highland plains are a `TerrainFeature` (`hill`), not a biome. A hill keeps the
underlying biome of its surrounding plain, forest, wetland or dryland. The
legacy `hill_edge` habitat remains accepted for old data, but V4 no longer
returns it from the runtime biome resolver.

## Runtime biome IDs

The V4 resolver may return only:

```text
meadow, wetland, coast, dryland,
light_forest, dense_forest, dark_land, autumn
```

`desert` terrain resolves to the wildlife biome `dryland`. Visual biome names
in `packages/game-data/biomes.json` are metadata and must not be treated as a
replacement for the runtime resolver.

## Resolution flow

```text
V4 terrain masks
  -> resolveWorldBiome()     -> RuntimeBiomeId
  -> resolveWorldTileContext() -> TileContext
  -> wildlife spawn and AI
```

`resolveWorldTileContext()` is the single source of truth for wildlife tile
contexts. Spawn placement and the unified runtime AI must use this resolver;
do not add another local `contextAt()` implementation.

The current precedence is intentional:

1. Autumn encounter context
2. Tall grass
3. Ocean shore / ocean water
4. River or lake water
5. Sand / desert
6. Dark Land ground
7. Ordinary ecology (`forest_floor` or `walkable_ground`)

If Autumn water needs to use the wetland encounter pool in the future, change
this precedence in the shared resolver and update its tests rather than adding
an exception to one runtime caller.

## Data validation

`validate-wildlife.mjs` validates both species habitat coverage and explicit
`groupsPerChunk` ranges for every runtime biome. Adding a runtime biome
requires updating all of the following together:

1. `biome-types.ts`
2. `biome-resolver.ts`
3. `spawn-config.json`
4. `species-spawn.json`
5. relevant assets and renderer metadata
6. biome integration tests
