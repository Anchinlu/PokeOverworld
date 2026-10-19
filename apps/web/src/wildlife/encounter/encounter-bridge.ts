import type { WildEntity, BattleOutcome } from '../model';
import { handleHerdPostBattle } from '../behavior/social/herd-controller';

/**
 * Encounter Bridge connecting wildlife simulation to combat resolution.
 * Section 6.4 & 8.2:
 * - Sau trận: bắt hoặc đánh bại thành viên -> phần còn lại bỏ chạy;
 * - Đầu đàn bị hạ -> bầy tan.
 */
export class EncounterBridge {
  private resolvedEntityIds = new Set<string>();

  public onBattleResolved(
    entityId: string,
    allEntities: WildEntity[],
    outcome: BattleOutcome
  ): { herdDissolved: boolean; fleeingIds: string[] } {
    if (outcome === 'caught' || outcome === 'defeated') {
      this.resolvedEntityIds.add(entityId);
    }

    const resolved = allEntities.find((x) => x.id === entityId);
    if (!resolved) {
      return { herdDissolved: false, fleeingIds: [] };
    }

    const herdMembers = resolved.herdId
      ? allEntities.filter((e) => e.herdId === resolved.herdId)
      : [resolved];

    const role = resolved.role ?? 'solo';
    return handleHerdPostBattle(entityId, role, herdMembers, outcome);
  }

  public isResolved(entityId: string): boolean {
    return this.resolvedEntityIds.has(entityId);
  }

  public clear(): void {
    this.resolvedEntityIds.clear();
  }
}
