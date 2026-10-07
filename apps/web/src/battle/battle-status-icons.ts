import type { StatusCondition } from './types';

/** The battle status sheet is a 44x96 image made of 6 vertical 44x16 pixel frames. */
export const BATTLE_STATUS_ICON_WIDTH = 44;
export const BATTLE_STATUS_ICON_HEIGHT = 16;

export interface BattleStatusIconFrame {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/**
 * Frame order in Graphics/Battle/icon_statuses.png:
 * Row 0 (sy: 0):  SLP (grey)
 * Row 1 (sy: 16): PSN (regular pink poison)
 * Row 2 (sy: 32): BRN (red/orange burn)
 * Row 3 (sy: 48): PAR (yellow paralysis)
 * Row 4 (sy: 64): FRZ (cyan/blue freeze)
 * Row 5 (sy: 80): PSN (dark purple toxic / badly poisoned)
 * `none` intentionally has no frame and is not rendered.
 */
export const BATTLE_STATUS_ICON_FRAMES: Record<
  Exclude<StatusCondition, 'none'>,
  BattleStatusIconFrame
> = {
  sleep: { sx: 0, sy: 0, sw: BATTLE_STATUS_ICON_WIDTH, sh: BATTLE_STATUS_ICON_HEIGHT },
  poison: { sx: 0, sy: 16, sw: BATTLE_STATUS_ICON_WIDTH, sh: BATTLE_STATUS_ICON_HEIGHT },
  burn: { sx: 0, sy: 32, sw: BATTLE_STATUS_ICON_WIDTH, sh: BATTLE_STATUS_ICON_HEIGHT },
  paralysis: { sx: 0, sy: 48, sw: BATTLE_STATUS_ICON_WIDTH, sh: BATTLE_STATUS_ICON_HEIGHT },
  freeze: { sx: 0, sy: 64, sw: BATTLE_STATUS_ICON_WIDTH, sh: BATTLE_STATUS_ICON_HEIGHT },
  toxic: { sx: 0, sy: 80, sw: BATTLE_STATUS_ICON_WIDTH, sh: BATTLE_STATUS_ICON_HEIGHT },
};

export function getBattleStatusIconFrame(
  status: StatusCondition | undefined
): BattleStatusIconFrame | null {
  if (!status || status === 'none') return null;
  return BATTLE_STATUS_ICON_FRAMES[status];
}
