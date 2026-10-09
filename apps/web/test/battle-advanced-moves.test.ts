import { describe, it, expect } from 'vitest';
import { createBattler, getBattleEnvironment, BattleEngine } from '../src/battle';
import type { BattleMove } from '../src/battle/types';

describe('Advanced Battle Mechanics & Move Engine (Step 5)', () => {
  const env = getBattleEnvironment('meadow');

  describe('2-Turn Moves (Solar Beam, Fly, Dig, Skull Bash)', () => {
    it('Solar Beam charges on turn 1 and strikes on turn 2', () => {
      const player = createBattler('BULBASAUR', 50, true);
      const enemy = createBattler('PIDGEY', 50, false);
      const engine = new BattleEngine(player, enemy, env);

      const solarBeam: BattleMove = {
        id: 'solar_beam',
        name: 'Solar Beam (Tia Sáng Mặt Trời)',
        nameVi: 'Tia Sáng Mặt Trời',
        type: 'Grass',
        category: 'special',
        power: 120,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        description: 'Lượt 1 nạp năng lượng mặt trời, lượt 2 phóng đòn.',
      };

      // Turn 1: Charge
      const res1 = engine.executeAttack(player, enemy, solarBeam);
      expect(res1.damage).toBe(0);
      expect(player.chargingMove).toBeDefined();
      expect(res1.message).toContain('đang hấp thụ ánh sáng mặt trời');

      // Turn 2: Strike
      const res2 = engine.executeAttack(player, enemy, solarBeam);
      expect(res2.damage).toBeGreaterThan(0);
      expect(player.chargingMove).toBeUndefined();
      expect(res2.message).toContain('sử dụng Tia Sáng Mặt Trời');
    });

    it('Skull Bash raises Defense on turn 1 and strikes on turn 2', () => {
      const player = createBattler('SQUIRTLE', 50, true);
      const enemy = createBattler('PIDGEY', 50, false);
      const engine = new BattleEngine(player, enemy, env);

      const skullBash: BattleMove = {
        id: 'skull_bash',
        name: 'Skull Bash (Đầu Chùy Tấn Công)',
        nameVi: 'Đầu Chùy Tấn Công',
        type: 'Normal',
        category: 'physical',
        power: 130,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        description: 'Lượt 1 thu đầu tăng phòng thủ, lượt 2 tấn công cực mạnh.',
      };

      const prevDefStage = player.statStages?.defense ?? 0;
      const res1 = engine.executeAttack(player, enemy, skullBash);
      expect(res1.damage).toBe(0);
      expect(player.statStages?.defense).toBe(prevDefStage + 1);
      expect(res1.message).toContain('thu đầu vào');

      const res2 = engine.executeAttack(player, enemy, skullBash);
      expect(res2.damage).toBeGreaterThan(0);
    });

    it('Fly grants semi-invulnerability on turn 1 dodging normal moves, and lands on turn 2', () => {
      const player = createBattler('PIDGEY', 50, true);
      const enemy = createBattler('RATTATA', 50, false);
      const engine = new BattleEngine(player, enemy, env);

      const flyMove: BattleMove = {
        id: 'fly',
        name: 'Fly (Bay Lên)',
        nameVi: 'Bay Lên',
        type: 'Flying',
        category: 'physical',
        power: 90,
        accuracy: 95,
        pp: 15,
        maxPp: 15,
        description: 'Bay lên trời trong lượt đầu và tấn công vào lượt kế.',
      };

      const tackleMove: BattleMove = {
        id: 'tackle',
        name: 'Tackle (Húc Đầu)',
        nameVi: 'Húc Đầu',
        type: 'Normal',
        category: 'physical',
        power: 40,
        accuracy: 100,
        pp: 35,
        maxPp: 35,
        description: 'Đòn tấn công thông thường.',
      };

      // Player flies up
      const res1 = engine.executeAttack(player, enemy, flyMove);
      expect(res1.damage).toBe(0);
      expect(player.semiInvulnerable).toBe('flying');

      // Enemy tries to tackle player while in air -> must miss / out of reach
      const enemyRes = engine.executeAttack(enemy, player, tackleMove);
      expect(enemyRes.damage).toBe(0);
      expect(enemyRes.isMiss).toBe(true);
      expect(enemyRes.message).toContain('đang ở ngoài tầm đánh');

      // Player lands attack
      const res2 = engine.executeAttack(player, enemy, flyMove);
      expect(res2.damage).toBeGreaterThan(0);
      expect(player.semiInvulnerable).toBeUndefined();
    });

    it('Dig burrows underground dodging surface attacks and lands on turn 2', () => {
      const player = createBattler('RATTATA', 50, true);
      const enemy = createBattler('PIKACHU', 50, false);
      const engine = new BattleEngine(player, enemy, env);

      const digMove: BattleMove = {
        id: 'dig',
        name: 'Dig (Độn Thổ)',
        nameVi: 'Độn Thổ',
        type: 'Ground',
        category: 'physical',
        power: 80,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        description: 'Đào xuống đất và tấn công ở lượt sau.',
      };

      const quickAttack: BattleMove = {
        id: 'quick_attack',
        name: 'Quick Attack',
        nameVi: 'Tấn Công Chớp Nhoáng',
        type: 'Normal',
        category: 'physical',
        power: 40,
        accuracy: 100,
        pp: 30,
        maxPp: 30,
        description: 'Tấn công nhanh.',
      };

      // Turn 1
      engine.executeAttack(player, enemy, digMove);
      expect(player.semiInvulnerable).toBe('underground');

      // Enemy quick attack misses underground target
      const enemyRes = engine.executeAttack(enemy, player, quickAttack);
      expect(enemyRes.damage).toBe(0);
      expect(enemyRes.message).toContain('đang ở sâu dưới lòng đất');

      // Turn 2
      const res2 = engine.executeAttack(player, enemy, digMove);
      expect(res2.damage).toBeGreaterThan(0);
      expect(player.semiInvulnerable).toBeUndefined();
    });
  });

  describe('Recharge Turn Moves (Hyper Beam, Giga Impact)', () => {
    it('requires a recharge turn following a successful Hyper Beam', () => {
      const player = createBattler('SNORLAX', 50, true);
      const enemy = createBattler('PIDGEY', 50, false);
      const engine = new BattleEngine(player, enemy, env);

      const hyperBeam: BattleMove = {
        id: 'hyper_beam',
        name: 'Hyper Beam (Tia Phá Hủy)',
        nameVi: 'Tia Phá Hủy',
        type: 'Normal',
        category: 'special',
        power: 150,
        accuracy: 90,
        pp: 5,
        maxPp: 5,
        description: 'Tấn công cực mạnh nhưng phải nạp năng lượng ở lượt tiếp theo.',
      };

      // Turn 1: Fires Hyper Beam
      const res1 = engine.executeAttack(player, enemy, hyperBeam);
      expect(res1.damage).toBeGreaterThan(0);
      expect(player.mustRecharge).toBe(true);

      // Turn 2: Recharging turn
      const res2 = engine.executeAttack(player, enemy, hyperBeam);
      expect(res2.damage).toBe(0);
      expect(player.mustRecharge).toBe(false);
      expect(res2.message).toContain('phải nạp lại năng lượng và không thể cử động');
    });
  });

  describe('Protect & Detect Mechanics', () => {
    it('protects user against incoming damage and priority +4', () => {
      const player = createBattler('PIKACHU', 50, true);
      const enemy = createBattler('CHARIZARD', 50, false);
      const engine = new BattleEngine(player, enemy, env);

      const protectMove: BattleMove = {
        id: 'protect',
        name: 'Protect (Bảo Vệ)',
        nameVi: 'Bảo Vệ',
        type: 'Normal',
        category: 'status',
        power: 0,
        accuracy: 0,
        pp: 10,
        maxPp: 10,
        description: 'Tránh mọi đòn tấn công trong lượt.',
      };

      const flamethrower: BattleMove = {
        id: 'flamethrower',
        name: 'Flamethrower',
        nameVi: 'Phun Lửa',
        type: 'Fire',
        category: 'special',
        power: 90,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
        description: 'Phun lửa cực mạnh.',
      };

      // Player protects
      const pRes = engine.executeAttack(player, enemy, protectMove);
      expect(player.isProtected).toBe(true);
      expect(pRes.message).toContain('đã dựng lá chắn tự bảo vệ mình');

      // Protect has priority 4, so it outspeeds normal attacks
      expect(engine.getFirstAttacker(protectMove, flamethrower)).toBe('player');

      // Enemy attacks protected player -> completely blocked!
      const eRes = engine.executeAttack(enemy, player, flamethrower);
      expect(eRes.damage).toBe(0);
      expect(eRes.message).toContain('đã được bảo vệ hoàn toàn');
    });
  });

  describe('Multi-hit Moves (Double Slap, Double Kick, Fury Swipes)', () => {
    it('Double Kick hits exactly 2 times with cumulative damage', () => {
      const player = createBattler('NIDORINO', 30, true);
      const enemy = createBattler('RATTATA', 30, false);
      const engine = new BattleEngine(player, enemy, env);

      const doubleKick: BattleMove = {
        id: 'double_kick',
        name: 'Double Kick (Song Cước)',
        nameVi: 'Song Cước',
        type: 'Fighting',
        category: 'physical',
        power: 30,
        accuracy: 100,
        pp: 30,
        maxPp: 30,
        description: 'Tấn công đá 2 lần liên tiếp.',
      };

      const res = engine.executeAttack(player, enemy, doubleKick);
      expect(res.hitsCount).toBe(2);
      expect(res.damage).toBeGreaterThan(0);
      expect(res.message).toContain('Đánh trúng 2 lần!');
    });

    it('Double Slap hits between 2 and 5 times', () => {
      const player = createBattler('CLEFAIRY', 30, true);
      const enemy = createBattler('PIDGEY', 30, false);
      const engine = new BattleEngine(player, enemy, env);

      const doubleSlap: BattleMove = {
        id: 'double_slap',
        name: 'Double Slap (Tát Liên Hoàn)',
        nameVi: 'Tát Liên Hoàn',
        type: 'Normal',
        category: 'physical',
        power: 15,
        accuracy: 85,
        pp: 10,
        maxPp: 10,
        description: 'Tát liên tiếp 2 đến 5 lần.',
      };

      const res = engine.executeAttack(player, enemy, doubleSlap);
      expect(res.hitsCount).toBeGreaterThanOrEqual(2);
      expect(res.hitsCount).toBeLessThanOrEqual(5);
      expect(res.message).toContain(`Đánh trúng ${res.hitsCount} lần!`);
    });
  });

  describe('Power = 0 & Special Mechanics Moves', () => {
    it('Seismic Toss deals damage strictly equal to user level', () => {
      const player = createBattler('MACHOP', 42, true);
      const enemy = createBattler('RATTATA', 40, false);
      const engine = new BattleEngine(player, enemy, env);

      const seismicToss: BattleMove = {
        id: 'seismic_toss',
        name: 'Seismic Toss (Ném Địa Chấn)',
        nameVi: 'Ném Địa Chấn',
        type: 'Fighting',
        category: 'physical',
        power: 0,
        accuracy: 100,
        pp: 20,
        maxPp: 20,
        description: 'Gây sát thương bằng đúng cấp độ người dùng.',
      };

      const res = engine.executeAttack(player, enemy, seismicToss);
      expect(res.damage).toBe(42);
    });

    it('Super Fang cuts target current HP by 50%', () => {
      const player = createBattler('RATTATA', 30, true);
      const enemy = createBattler('SNORLAX', 50, false);
      const engine = new BattleEngine(player, enemy, env);

      const curHp = enemy.currentHp;
      const superFang: BattleMove = {
        id: 'super_fang',
        name: 'Super Fang (Siêu Răng Nanh)',
        nameVi: 'Siêu Răng Nanh',
        type: 'Normal',
        category: 'physical',
        power: 0,
        accuracy: 90,
        pp: 10,
        maxPp: 10,
        description: 'Chém đứt 50% HP hiện tại của mục tiêu.',
      };

      const res = engine.executeAttack(player, enemy, superFang);
      expect(res.damage).toBe(Math.floor(curHp / 2));
    });

    it('Belly Drum sacrifices 50% HP to maximize Attack to +6 stages', () => {
      const player = createBattler('SNORLAX', 50, true);
      const enemy = createBattler('PIDGEY', 50, false);
      const engine = new BattleEngine(player, enemy, env);

      const initialHp = player.currentHp;
      const bellyDrum: BattleMove = {
        id: 'belly_drum',
        name: 'Belly Drum (Trống Bụng)',
        nameVi: 'Trống Bụng',
        type: 'Normal',
        category: 'status',
        power: 0,
        accuracy: 0,
        pp: 10,
        maxPp: 10,
        description: 'Hi sinh 50% HP để tăng tối đa Tấn công.',
      };

      const res = engine.executeAttack(player, enemy, bellyDrum);
      expect(player.currentHp).toBe(initialHp - Math.floor(player.maxHp / 2));
      expect(player.statStages?.attack).toBe(6);
      expect(res.message).toContain('tối đa hóa Tấn công');
    });

    it('Pain Split balances HP between attacker and defender', () => {
      const player = createBattler('GENGAR', 50, true);
      const enemy = createBattler('SNORLAX', 50, false);
      const engine = new BattleEngine(player, enemy, env);

      player.currentHp = 20;
      enemy.currentHp = 100;

      const painSplit: BattleMove = {
        id: 'pain_split',
        name: 'Pain Split (Chia Sẻ Nỗi Đau)',
        nameVi: 'Chia Sẻ Nỗi Đau',
        type: 'Normal',
        category: 'status',
        power: 0,
        accuracy: 0,
        pp: 20,
        maxPp: 20,
        description: 'Chia đôi tổng HP của cả 2.',
      };

      const res = engine.executeAttack(player, enemy, painSplit);
      expect(player.currentHp).toBe(60);
      expect(enemy.currentHp).toBe(60);
      expect(res.message).toContain('chia sẻ sinh lực');
    });

    it('Destiny Bond faints attacker if defender faints in that turn', () => {
      const player = createBattler('GENGAR', 30, true);
      const enemy = createBattler('CHARIZARD', 70, false);
      const engine = new BattleEngine(player, enemy, env);

      player.currentHp = 10;
      player.destinyBond = true;

      const strongAttack: BattleMove = {
        id: 'flamethrower',
        name: 'Flamethrower',
        nameVi: 'Phun Lửa',
        type: 'Fire',
        category: 'special',
        power: 90,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
        description: 'Tấn công lửa.',
      };

      // Enemy attacks and KOs player
      const res = engine.executeAttack(enemy, player, strongAttack);
      expect(player.isFainted).toBe(true);
      // Because player had destinyBond, enemy is dragged down!
      expect(enemy.isFainted).toBe(true);
      expect(res.attackerFainted).toBe(true);
      expect(res.message).toContain('đã kéo Charizard ngất xỉu theo');
    });
  });

  describe('Multi-Hit Moves (2-Hit and 3-Hit Categories)', () => {
    it('executes 2-hit moves accurately (Double Hit, Double Iron Bash, Twin Beam, Dual Wingbeat, Tachyon Cutter)', () => {
      const player = createBattler('MELMETAL', 60, true);
      const enemy = createBattler('SNORLAX', 60, false);
      enemy.currentHp = 999;
      enemy.stats.hp = 999;
      const engine = new BattleEngine(player, enemy, env);

      const twoHitMoves: BattleMove[] = [
        {
          id: 'double_hit',
          name: 'Double Hit',
          type: 'Normal',
          category: 'physical',
          power: 35,
          accuracy: 90,
          pp: 10,
          maxPp: 10,
          description: 'Strikes twice',
        },
        {
          id: 'double_iron_bash',
          name: 'Double Iron Bash',
          type: 'Steel',
          category: 'physical',
          power: 60,
          accuracy: 100,
          pp: 5,
          maxPp: 5,
          description: 'Strikes twice with iron nuts',
        },
        {
          id: 'twin_beam',
          name: 'Twin Beam',
          type: 'Psychic',
          category: 'special',
          power: 40,
          accuracy: 100,
          pp: 10,
          maxPp: 10,
          description: 'Fires two beams',
        },
        {
          id: 'dual_wingbeat',
          name: 'Dual Wingbeat',
          type: 'Flying',
          category: 'physical',
          power: 40,
          accuracy: 90,
          pp: 10,
          maxPp: 10,
          description: 'Flaps wings twice',
        },
        {
          id: 'tachyon_cutter',
          name: 'Tachyon Cutter',
          type: 'Steel',
          category: 'special',
          power: 50,
          accuracy: 100,
          pp: 10,
          maxPp: 10,
          description: 'Fires two tachyon blades',
        },
      ];

      for (const m of twoHitMoves) {
        const res = engine.executeAttack(player, enemy, m);
        expect(res.damage).toBeGreaterThan(0);
        expect(res.message).toContain('Đánh trúng 2 lần!');
        const ev = res.events.find((e) => e.type === 'multi_hit_completed');
        expect(ev).toBeDefined();
        if (ev && ev.type === 'multi_hit_completed') {
          expect(ev.hitsCount).toBe(2);
        }
      }
    });

    it('executes 3-hit moves accurately (Triple Kick, Triple Axel, Triple Dive)', () => {
      const player = createBattler('HITMONTOP', 60, true);
      const enemy = createBattler('BLISSEY', 60, false);
      enemy.currentHp = 999;
      enemy.stats.hp = 999;
      const engine = new BattleEngine(player, enemy, env);

      const threeHitMoves: BattleMove[] = [
        {
          id: 'triple_kick',
          name: 'Triple Kick',
          type: 'Fighting',
          category: 'physical',
          power: 10,
          accuracy: 90,
          pp: 10,
          maxPp: 10,
          description: 'Kicks 3 times',
        },
        {
          id: 'triple_axel',
          name: 'Triple Axel',
          type: 'Ice',
          category: 'physical',
          power: 20,
          accuracy: 90,
          pp: 10,
          maxPp: 10,
          description: 'Triple spinning kick',
        },
        {
          id: 'triple_dive',
          name: 'Triple Dive',
          type: 'Water',
          category: 'physical',
          power: 30,
          accuracy: 95,
          pp: 10,
          maxPp: 10,
          description: 'Hits target 3 times in rapid succession',
        },
      ];

      for (const m of threeHitMoves) {
        const res = engine.executeAttack(player, enemy, m);
        expect(res.damage).toBeGreaterThan(0);
        expect(res.message).toContain('Đánh trúng 3 lần!');
        const ev = res.events.find((e) => e.type === 'multi_hit_completed');
        expect(ev).toBeDefined();
        if (ev && ev.type === 'multi_hit_completed') {
          expect(ev.hitsCount).toBe(3);
        }
      }
    });
  });
});

