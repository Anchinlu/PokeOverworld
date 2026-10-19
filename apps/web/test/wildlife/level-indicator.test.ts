import { describe, it, expect } from 'vitest';
import { getLevelIndicator } from '../../src/wildlife/indicators/level-indicator';

describe('Level Indicator (Section 5.1 & 11.7)', () => {
  const LP = 20;

  describe('Truth Table: 4 roles x 3 level relations', () => {
    // 1. Lower level: level < Lp (e.g. 15)
    describe('when wild level is lower than player (level 15 vs Lp 20)', () => {
      it('solo shows Lv.15', () => {
        const ind = getLevelIndicator({ level: 15, role: 'solo' }, LP);
        expect(ind).toEqual({ kind: 'level', text: 'Lv.15' });
      });

      it('member shows Lv.15', () => {
        const ind = getLevelIndicator({ level: 15, role: 'member' }, LP);
        expect(ind).toEqual({ kind: 'level', text: 'Lv.15' });
      });

      it('leader shows ??? (unknown_red)', () => {
        const ind = getLevelIndicator({ level: 15, role: 'leader' }, LP);
        expect(ind).toEqual({ kind: 'unknown_red', text: '???' });
      });

      it('apex shows ??? (unknown_red)', () => {
        const ind = getLevelIndicator({ level: 15, role: 'apex' }, LP);
        expect(ind).toEqual({ kind: 'unknown_red', text: '???' });
      });
    });

    // 2. Equal level: level === Lp (e.g. 20)
    describe('when wild level is equal to player (level 20 vs Lp 20)', () => {
      it('solo hides level (none)', () => {
        const ind = getLevelIndicator({ level: 20, role: 'solo' }, LP);
        expect(ind).toEqual({ kind: 'none' });
      });

      it('member hides level (none)', () => {
        const ind = getLevelIndicator({ level: 20, role: 'member' }, LP);
        expect(ind).toEqual({ kind: 'none' });
      });

      it('leader shows ??? (unknown_red)', () => {
        const ind = getLevelIndicator({ level: 20, role: 'leader' }, LP);
        expect(ind).toEqual({ kind: 'unknown_red', text: '???' });
      });

      it('apex shows ??? (unknown_red)', () => {
        const ind = getLevelIndicator({ level: 20, role: 'apex' }, LP);
        expect(ind).toEqual({ kind: 'unknown_red', text: '???' });
      });
    });

    // 3. Higher level: level > Lp (e.g. 25)
    describe('when wild level is higher than player (level 25 vs Lp 20)', () => {
      it('solo hides level (none)', () => {
        const ind = getLevelIndicator({ level: 25, role: 'solo' }, LP);
        expect(ind).toEqual({ kind: 'none' });
      });

      it('member hides level (none)', () => {
        const ind = getLevelIndicator({ level: 25, role: 'member' }, LP);
        expect(ind).toEqual({ kind: 'none' });
      });

      it('leader shows ??? (unknown_red)', () => {
        const ind = getLevelIndicator({ level: 25, role: 'leader' }, LP);
        expect(ind).toEqual({ kind: 'unknown_red', text: '???' });
      });

      it('apex shows ??? (unknown_red)', () => {
        const ind = getLevelIndicator({ level: 25, role: 'apex' }, LP);
        expect(ind).toEqual({ kind: 'unknown_red', text: '???' });
      });
    });
  });

  describe('Optional lowApexGap behavior (showLowApexAsLevel)', () => {
    it('reveals Lv.X for leader when level <= Lp - 10', () => {
      const ind = getLevelIndicator(
        { level: 10, role: 'leader' },
        LP,
        { showLowApexAsLevel: true, lowApexGap: 10 }
      );
      expect(ind).toEqual({ kind: 'level', text: 'Lv.10' });
    });

    it('reveals Lv.X for apex when level <= Lp - 10', () => {
      const ind = getLevelIndicator(
        { level: 8, role: 'apex' },
        LP,
        { showLowApexAsLevel: true, lowApexGap: 10 }
      );
      expect(ind).toEqual({ kind: 'level', text: 'Lv.8' });
    });

    it('keeps ??? if leader is not low enough (level 11 > 20 - 10)', () => {
      const ind = getLevelIndicator(
        { level: 11, role: 'leader' },
        LP,
        { showLowApexAsLevel: true, lowApexGap: 10 }
      );
      expect(ind).toEqual({ kind: 'unknown_red', text: '???' });
    });
  });

  describe('Default role handling', () => {
    it('defaults to solo role if role is undefined', () => {
      const indLower = getLevelIndicator({ level: 12 }, LP);
      expect(indLower).toEqual({ kind: 'level', text: 'Lv.12' });

      const indHigher = getLevelIndicator({ level: 25 }, LP);
      expect(indHigher).toEqual({ kind: 'none' });
    });
  });
});
