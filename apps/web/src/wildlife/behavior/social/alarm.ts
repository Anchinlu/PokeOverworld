export interface PendingAlarm {
  senderId: string;
  targetId: string;
  delayTicks: number;
}

/**
 * Calculates propagation latency (3..8 ticks) proportional to distance between individuals.
 * Section 6.4: Báo động lan truyền có độ trễ tỉ lệ khoảng cách (3–8 nhịp).
 */
export function calculateAlarmLatency(distanceTiles: number): number {
  return Math.min(8, Math.max(3, Math.round(distanceTiles * 1.5)));
}

export class AlarmNetwork {
  private pending: PendingAlarm[] = [];

  public broadcastAlarm(
    senderId: string,
    senderPos: { gx: number; gy: number },
    members: Array<{ id: string; gx: number; gy: number }>
  ): void {
    for (const m of members) {
      if (m.id === senderId) continue;
      const dist = Math.hypot(m.gx - senderPos.gx, m.gy - senderPos.gy);
      const delayTicks = calculateAlarmLatency(dist);
      this.pending.push({
        senderId,
        targetId: m.id,
        delayTicks,
      });
    }
  }

  public tick(): string[] {
    const triggeredIds: string[] = [];
    const remaining: PendingAlarm[] = [];

    for (const item of this.pending) {
      item.delayTicks--;
      if (item.delayTicks <= 0) {
        triggeredIds.push(item.targetId);
      } else {
        remaining.push(item);
      }
    }

    this.pending = remaining;
    return triggeredIds;
  }

  public clear(): void {
    this.pending = [];
  }
}
