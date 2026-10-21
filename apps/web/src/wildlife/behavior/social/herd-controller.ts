import type { WildEntity, BattleOutcome } from '../../model';

export const R_COHESION = 3; // Section 6.4 cohesion radius (3 tiles)

export interface HerdSteeringVector {
  targetGX: number;
  targetGY: number;
  shouldPull: boolean;
  shouldPush: boolean;
}

/**
 * Calculates cohesion and separation steering for a herd member relative to leader.
 * Section 6.4:
 * - Kéo về nếu xa hơn R_COHESION (3 ô)
 * - Đẩy ra nếu sát hơn 1 ô
 * - Chọn hướng cùng với đầu đàn
 */
export function calculateHerdCohesion(member: WildEntity, leader: WildEntity): HerdSteeringVector {
  const dx = leader.gx - member.gx;
  const dy = leader.gy - member.gy;
  const dist = Math.hypot(dx, dy);

  if (dist > R_COHESION) {
    // Pull toward leader
    return {
      targetGX: leader.gx,
      targetGY: leader.gy,
      shouldPull: true,
      shouldPush: false,
    };
  }

  if (dist <= 1.0 && member.id !== leader.id) {
    // Push away from leader. Same-tile overlaps need a deterministic axis
    // because dx/dy are both zero in that case.
    const idHash = [...(member.id ?? 'member')].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const pushX = dx === 0 && dy === 0 ? (idHash % 2 === 0 ? 1 : -1) : -Math.sign(dx);
    const pushY = dx === 0 && dy === 0 ? 0 : -Math.sign(dy);
    return {
      targetGX: member.gx + pushX,
      targetGY: member.gy + pushY,
      shouldPull: false,
      shouldPush: true,
    };
  }

  return {
    targetGX: member.gx,
    targetGY: member.gy,
    shouldPull: false,
    shouldPush: false,
  };
}

/**
 * Handles herd response after a battle resolution.
 * Section 6.4:
 * Bắt hoặc đánh bại thành viên -> phần còn lại bỏ chạy;
 * Đầu đàn bị hạ -> bầy tan.
 */
export function handleHerdPostBattle(
  resolvedEntityId: string,
  resolvedRole: string,
  herdMembers: WildEntity[],
  outcome: BattleOutcome
): { herdDissolved: boolean; fleeingIds: string[] } {
  if (outcome === 'fled') {
    return { herdDissolved: false, fleeingIds: [] };
  }

  const isLeaderOrApex = resolvedRole === 'leader' || resolvedRole === 'apex';

  if (isLeaderOrApex) {
    // Leader defeated or caught -> Herd dissolves! All members disperse
    const fleeingIds = herdMembers
      .filter((m) => m.id !== resolvedEntityId)
      .map((m) => {
        m.role = 'solo';
        m.state = 'flee';
        m.herdId = undefined;
        return m.id || '';
      });

    return {
      herdDissolved: true,
      fleeingIds,
    };
  }

  // Member defeated or caught -> Remaining members flee
  const fleeingIds = herdMembers
    .filter((m) => m.id !== resolvedEntityId)
    .map((m) => {
      m.state = 'flee';
      return m.id || '';
    });

  return {
    herdDissolved: false,
    fleeingIds,
  };
}
