import type { WildEntity, BattleOutcome } from './model';
import type { WorldQuery } from './ports/world-query';
import type { PlayerQuery } from './ports/player-query';
import { populateChunkWildlife } from './spawn/spawn-director';
import { WildlifeSimulator } from './behavior/wildlife-simulator';
import { EncounterBridge } from './encounter/encounter-bridge';
import { getLevelIndicator, type LevelIndicator } from './indicators/level-indicator';

export * from './model';
export * from './indicators/level-indicator';
export * from './ports/world-query';
export * from './ports/player-query';

export interface OverlayModel {
  entityId: string;
  gx: number;
  gy: number;
  x: number;
  y: number;
  indicator: LevelIndicator;
  emote?: WildEntity['emote'];
}

export interface Rect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface WildlifeSystem {
  populateChunk(cx: number, cy: number): WildEntity[];
  update(dtMs: number): void;
  getOverlays(viewport: Rect): OverlayModel[];
  onBattleResolved(entityId: string, outcome: BattleOutcome): void;
  getEntities(): readonly WildEntity[];
  setEntities(entities: WildEntity[]): void;
}

export interface WildlifeSystemOptions {
  seed: number;
  world: WorldQuery;
  player: PlayerQuery;
  frameBudgetMs?: number;
}

export class DefaultWildlifeSystem implements WildlifeSystem {
  private seed: number;
  private world: WorldQuery;
  private player: PlayerQuery;
  private simulator: WildlifeSimulator;
  private bridge: EncounterBridge;

  constructor(opts: WildlifeSystemOptions) {
    this.seed = opts.seed;
    this.world = opts.world;
    this.player = opts.player;
    this.simulator = new WildlifeSimulator({ frameBudgetMs: opts.frameBudgetMs });
    this.bridge = new EncounterBridge();
  }

  public populateChunk(cx: number, cy: number): WildEntity[] {
    const list = populateChunkWildlife(cx, cy, this.world, { seed: this.seed });
    // Filter out entities already caught/defeated in current session
    return list.filter((e) => !this.bridge.isResolved(e.id ?? `${e.gx},${e.gy}`));
  }

  public update(dtMs: number): void {
    this.simulator.update(dtMs, this.world, this.player);
  }

  public getOverlays(viewport: Rect): OverlayModel[] {
    const pRef = this.player.referenceLevel();
    const overlays: OverlayModel[] = [];

    for (const ent of this.simulator.getEntities()) {
      if (ent.x >= viewport.minX && ent.x <= viewport.maxX && ent.y >= viewport.minY && ent.y <= viewport.maxY) {
        const indicator = getLevelIndicator(ent, pRef);
        overlays.push({
          entityId: ent.id ?? `${ent.gx},${ent.gy}`,
          gx: ent.gx,
          gy: ent.gy,
          x: ent.x,
          y: ent.y,
          indicator,
          emote: ent.emote,
        });
      }
    }

    return overlays;
  }

  public onBattleResolved(entityId: string, outcome: BattleOutcome): void {
    const all = [...this.simulator.getEntities()];
    this.bridge.onBattleResolved(entityId, all, outcome);
  }

  public getEntities(): readonly WildEntity[] {
    return this.simulator.getEntities();
  }

  public setEntities(entities: WildEntity[]): void {
    this.simulator.setEntities(entities);
  }
}

export function createWildlifeSystem(opts: WildlifeSystemOptions): WildlifeSystem {
  return new DefaultWildlifeSystem(opts);
}
