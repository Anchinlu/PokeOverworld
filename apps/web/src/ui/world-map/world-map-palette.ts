/**
 * Visual tokens for the overview map.
 *
 * The overworld uses the source pixel-art assets as its primary source of
 * colour. These tokens are deliberately muted and are only used for the map
 * background, fallback pixels, fog and lightweight depth overlays.
 */
export const WORLD_MAP_PALETTE = {
  background: '#172333',
  grassFallback: '#769f6b',
  grassShadow: '#527b58',
  sandFallback: '#d8c38d',
  waterDeep: '#3e7895',
  waterShallow: '#78b5c2',
  hillFallback: '#77796f',
  hillHighlight: '#a49f8b',
  roadFallback: '#b28b68',
  bridgeFallback: '#8b684e',
  darkFallback: '#2d2538',
  edgeShadow: 'rgba(25, 42, 42, 0.18)',
  detailLight: 'rgba(255, 255, 255, 0.08)',
  detailDark: 'rgba(25, 42, 42, 0.12)',
  fog: 'rgba(10, 17, 29, 0.94)',
  fogEdge: 'rgba(148, 163, 184, 0.08)',
} as const;

export type WorldMapTerrainClass = 'grass' | 'sand' | 'water' | 'hill' | 'road' | 'dark_land';
