/**
 * Visual tokens for the overview map.
 *
 * The overworld uses the source pixel-art assets as its primary source of
 * colour. These tokens are deliberately muted and are only used for the map
 * background, fallback pixels, fog and lightweight depth overlays.
 */
export const WORLD_MAP_PALETTE = {
  background: '#172333',
  grassPixels: ['#5b9f58', '#64a95c', '#559652'],
  grassFallback: '#769f6b',
  grassShadow: '#527b58',
  grassDetail: '#477852',
  sandPixels: ['#e5c773', '#edd17f', '#d9b85f'],
  sandFallback: '#d8c38d',
  sandDetail: '#aa8d58',
  waterPixels: ['#2b78a8', '#327fae', '#286f9b'],
  waterDeep: '#3e7895',
  waterShallow: '#78b5c2',
  hillPixels: ['#6c9852', '#75a25a', '#608947'],
  hillFallback: '#77796f',
  hillHighlight: '#b3d06b',
  roadPixels: ['#b98251', '#c58d59', '#ae7848'],
  roadFallback: '#b28b68',
  bridgeFallback: '#8b684e',
  darkPixels: ['#3a2d49', '#443453', '#30263d'],
  darkFallback: '#2d2538',
  autumnPixels: ['#d97706', '#ea580c', '#b45309'],
  autumnFallback: '#c2410c',
  snowPixels: ['#edf8f9', '#d3effa', '#a0d5e8'],
  snowFallback: '#e2f4f8',
  edgeShadow: 'rgba(25, 42, 42, 0.18)',
  detailLight: 'rgba(255, 255, 255, 0.08)',
  detailDark: 'rgba(25, 42, 42, 0.12)',
  fog: 'rgba(10, 17, 29, 0.94)',
  fogEdge: 'rgba(148, 163, 184, 0.08)',
} as const;

export type WorldMapTerrainClass = 'grass' | 'sand' | 'water' | 'hill' | 'road' | 'dark_land' | 'autumn' | 'snow';
