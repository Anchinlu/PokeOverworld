# Overworld UI Architecture

## Scope

The overworld UI is divided into two categories:

- **HUD**: persistent elements rendered above the world, such as the top
  menu, party HUD, toast layer, time/weather widgets and the mini-map.
- **Screens**: exclusive interfaces opened over the overworld, such as the
  Pokédex, Party, Bag, PC Storage, World Map and Settings.

The game canvas and gameplay domain remain outside this UI layer.

## UI modes

```text
overworld -> screen -> modal
                 \\-> battle / transition
```

Only the highest-priority active layer should receive keyboard input. The
future `UiManager` and `UiInputRouter` contracts live in
`apps/web/src/ui/shell/ui-types.ts`.

## Mini-map contract

The mini-map is a HUD component, not a replacement for the fullscreen World
Map. Its initial contract is defined in
`apps/web/src/ui/overworld/minimap/minimap-types.ts`.

The contract supports:

- chunk-based discovery;
- loaded versus remembered chunks;
- biome and terrain-feature samples;
- player and follower markers;
- event-driven updates instead of a full render every frame.

The mini-map is implemented as a DOM-mounted canvas HUD. It uses a cached
static terrain layer plus a dynamic marker layer; it has no independent
animation loop and is hidden while higher-priority screens are active.

## Rules for the future implementation

1. Reuse `TerrainField`, `ChunkManager` discovery data and the existing world
   map palette/renderer where practical.
2. Never create gameplay entities while rendering the mini-map.
3. Update static terrain only after a chunk/discovery change.
4. Keep player marker animation separate from terrain rendering.
5. Do not pause the overworld when the mini-map is visible.
6. The fullscreen World Map remains a separate screen with its own pan/zoom
   controls.
