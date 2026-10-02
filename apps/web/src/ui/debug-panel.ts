import { TERRAIN } from '@pokemon/game-data';
import type { GameRenderer } from '../rendering';
import type { ChunkManager, BerryBushEntity } from '../maps';
import { BERRY_STAGES } from '../maps/berry-data';

export interface DebugPanelBindings {
  chkHills: HTMLInputElement;
  chkRoad: HTMLInputElement;
  chkBeach: HTMLInputElement;
  chkTrees: HTMLInputElement;
  chkChunkGrid: HTMLInputElement;
  chkCollision: HTMLInputElement;
  chkHitbox: HTMLInputElement;
  chkGrid: HTMLInputElement;
  chkTallGrass: HTMLInputElement;
  chkPlants: HTMLInputElement;
  chkBerries: HTMLInputElement;
  chkHeatmap: HTMLInputElement;
  inputSeed: HTMLInputElement;
  btnRandomSeed: HTMLButtonElement;
  btnRegenerate: HTMLButtonElement;
  btnResetPlayer: HTMLButtonElement;
  lblPlayerPos: HTMLElement;
  lblChunkPos: HTMLElement;
  lblActiveChunks: HTMLElement;
  insCoords: HTMLElement;
  insTerrain: HTMLElement;
  insTileId: HTMLElement;
  rowBerryInfo: HTMLElement | null;
  insBerryVal: HTMLElement | null;
  lblFps: HTMLElement;
}

export function getDebugPanelBindings(): DebugPanelBindings {
  return {
    chkHills: document.querySelector<HTMLInputElement>('#chkHills')!,
    chkRoad: document.querySelector<HTMLInputElement>('#chkRoad')!,
    chkBeach: document.querySelector<HTMLInputElement>('#chkBeach')!,
    chkTrees: document.querySelector<HTMLInputElement>('#chkTrees')!,
    chkChunkGrid: document.querySelector<HTMLInputElement>('#chkChunkGrid')!,
    chkCollision: document.querySelector<HTMLInputElement>('#chkCollision')!,
    chkHitbox: document.querySelector<HTMLInputElement>('#chkHitbox')!,
    chkGrid: document.querySelector<HTMLInputElement>('#chkGrid')!,
    chkTallGrass: document.querySelector<HTMLInputElement>('#chkTallGrass')!,
    chkPlants: document.querySelector<HTMLInputElement>('#chkPlants')!,
    chkBerries: document.querySelector<HTMLInputElement>('#chkBerries')!,
    chkHeatmap: document.querySelector<HTMLInputElement>('#chkHeatmap')!,
    inputSeed: document.querySelector<HTMLInputElement>('#inputSeed')!,
    btnRandomSeed: document.querySelector<HTMLButtonElement>('#btnRandomSeed')!,
    btnRegenerate: document.querySelector<HTMLButtonElement>('#btnRegenerate')!,
    btnResetPlayer: document.querySelector<HTMLButtonElement>('#btnResetPlayer')!,
    lblPlayerPos: document.querySelector<HTMLElement>('#lblPlayerPos')!,
    lblChunkPos: document.querySelector<HTMLElement>('#lblChunkPos')!,
    lblActiveChunks: document.querySelector<HTMLElement>('#lblActiveChunks')!,
    insCoords: document.querySelector<HTMLElement>('#insCoords')!,
    insTerrain: document.querySelector<HTMLElement>('#insTerrain')!,
    insTileId: document.querySelector<HTMLElement>('#insTileId')!,
    rowBerryInfo: document.querySelector<HTMLElement>('#rowBerryInfo'),
    insBerryVal: document.querySelector<HTMLElement>('#insBerryVal'),
    lblFps: document.querySelector<HTMLElement>('#lblFps')!,
  };
}

export function bindRenderOptions(renderer: GameRenderer, bindings: DebugPanelBindings): void {
  function sync(): void {
    renderer.setOptions({
      showHills: bindings.chkHills.checked,
      showRoad: bindings.chkRoad.checked,
      showBeach: bindings.chkBeach.checked,
      showTrees: bindings.chkTrees.checked,
      showChunkGrid: bindings.chkChunkGrid.checked,
      showCollision: bindings.chkCollision.checked,
      showHitbox: bindings.chkHitbox.checked,
      showGrid: bindings.chkGrid.checked,
      showTallGrass: bindings.chkTallGrass.checked,
      showPlants: bindings.chkPlants.checked,
      showBerries: bindings.chkBerries.checked,
      showHeatmap: bindings.chkHeatmap.checked,
    });
  }

  [
    bindings.chkHills,
    bindings.chkRoad,
    bindings.chkBeach,
    bindings.chkTrees,
    bindings.chkChunkGrid,
    bindings.chkCollision,
    bindings.chkHitbox,
    bindings.chkGrid,
    bindings.chkTallGrass,
    bindings.chkPlants,
    bindings.chkBerries,
    bindings.chkHeatmap,
  ].forEach((chk) => chk?.addEventListener('change', sync));
}

const TERRAIN_NAMES: Record<number, string> = {
  [TERRAIN.GRASS]: 'Đồng cỏ',
  [TERRAIN.ROAD]: 'Đường mòn đất',
  [TERRAIN.BEACH_SAND]: 'Bãi cát biển',
  [TERRAIN.HILL]: 'Vách núi / Đồi',
  [TERRAIN.OCEAN_WATER]: 'Sông hồ / Nước',
};

export function updateMouseInspector(
  gx: number,
  gy: number,
  chunkManager: ChunkManager,
  renderer: GameRenderer,
  bindings: DebugPanelBindings
): void {
  const tile = chunkManager.getTileData(gx, gy);
  bindings.insCoords.innerText = `[${gx}, ${gy}]`;
  bindings.insTerrain.innerText = tile.tallGrass
    ? 'Bụi cỏ cao GBA'
    : TERRAIN_NAMES[tile.terrain] || 'Chưa rõ';
  bindings.insTileId.innerText = `#${tile.tileId}`;

  // Find hovered berry bush
  let hoveredBush: BerryBushEntity | null = null;
  for (const chunk of chunkManager.activeChunks) {
    if (!chunk.berryBushes) continue;
    for (const b of chunk.berryBushes) {
      if ((b.gx === gx && b.gy === gy) || (b.gx === gx && b.gy - 1 === gy)) {
        hoveredBush = b;
        break;
      }
    }
    if (hoveredBush) break;
  }

  if (hoveredBush && bindings.rowBerryInfo && bindings.insBerryVal) {
    const now = Date.now();
    const cycleSec = renderer.getBerryCycle();
    const cycleMs = cycleSec * 1000;
    const elapsedMs = (((now - hoveredBush.plantedAt) % cycleMs) + cycleMs) % cycleMs;
    const progress = elapsedMs / cycleMs;
    const override = renderer.getBerryStageOverride();
    const stage =
      override !== null ? override : (Math.min(3, Math.floor(progress * 4)) as 0 | 1 | 2 | 3);
    const stageInfo = BERRY_STAGES[stage];
    const elapsedSec = Math.floor(elapsedMs / 1000);

    bindings.rowBerryInfo.style.display = 'flex';
    bindings.insBerryVal.innerText = `${hoveredBush.viName} [${stageInfo.icon} ${stageInfo.name}] (${elapsedSec}s/${cycleSec}s)`;
    bindings.insBerryVal.style.color = hoveredBush.color;
  } else if (bindings.rowBerryInfo) {
    bindings.rowBerryInfo.style.display = 'none';
  }
}
