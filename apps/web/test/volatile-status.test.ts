import { describe, it, expect } from 'vitest';
import {
  BattleEngine,
  createBattler,
  getBattleEnvironment,
  SeededBattleRng,
} from '../src/battle';
import {
  checkPreTurnStatus,
  calculateConfusionSelfDamage,
} from '../src/battle/rules/status-engine';
import {
  FLINCH_MOVE_CHANCES,
  CONFUSION_MOVE_CHANCES,
} from '../src/battle/rules/move-effect-engine';

describe('Volatile Status Mechanics: Flinch and Confusion', () => {
  const env = getBattleEnvironment();

  describe('Flinch Mechanics', () => {
    it('has accurate move chance mappings for flinch moves', () => {
      expect(FLINCH_MOVE_CHANCES['bite']).toBe(0.3);
      expect(FLINCH_MOVE_CHANCES['air_slash']).toBe(0.3);
      expect(FLINCH_MOVE_CHANCES['iron_head']).toBe(0.3);
      expect(FLINCH_MOVE_CHANCES['fake_out']).toBe(1.0);
      expect(FLINCH_MOVE_CHANCES['waterfall']).toBe(0.2);
    });

    it('inflicts flinch when attacker moves before defender', () => {
      const rng = new SeededBattleRng(42);
      const player = createBattler('PIKACHU', 50, true);
      const enemy = createBattler('SNORLAX', 50, false);
      const engine = new BattleEngine(player, enemy, env, rng);

      const fakeOutMove = {
        id: 'fake_out',
        name: 'Fake Out',
        type: 'Normal' as const,
        category: 'physical' as const,
        power: 40,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        priority: 3,
        description: '100% flinch',
      };

      // Player acts first (enemy has not acted this round yet)
      expect(enemy.hasActedThisRound).toBeFalsy();
      const res = engine.executeAttack(player, enemy, fakeOutMove);

      expect(res.damage).toBeGreaterThan(0);
      expect(enemy.isFlinched).toBe(true);

      // Now when enemy tries to act, checkPreTurnStatus prevents them from moving
      const preTurn = checkPreTurnStatus(enemy, 'enemy', rng);
      expect(preTurn.canAct).toBe(false);
      expect(preTurn.hinderedMessage).toContain('bị nao núng và không thể cử động');
      // Flinch flag should be consumed
      expect(enemy.isFlinched).toBe(false);
    });

    it('does not flinch if target has Inner Focus ability', () => {
      const rng = new SeededBattleRng(42);
      const player = createBattler('PIKACHU', 50, true);
      const enemy = createBattler('SNORLAX', 50, false);
      enemy.ability = 'Inner Focus';
      const engine = new BattleEngine(player, enemy, env, rng);

      const fakeOutMove = {
        id: 'fake_out',
        name: 'Fake Out',
        type: 'Normal' as const,
        category: 'physical' as const,
        power: 40,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        priority: 3,
        description: '100% flinch',
      };

      const res = engine.executeAttack(player, enemy, fakeOutMove);
      expect(enemy.isFlinched).toBe(false);
      expect(res.message).toContain('Tinh Thần Bất Khuất');
    });

    it('triggers Steadfast ability to boost Speed when flinched', () => {
      const rng = new SeededBattleRng(42);
      const enemy = createBattler('RIOLU', 20, false);
      enemy.ability = 'Steadfast';
      enemy.isFlinched = true;

      const preTurn = checkPreTurnStatus(enemy, 'enemy', rng);
      expect(preTurn.canAct).toBe(false);
      expect(preTurn.hinderedMessage).toContain('Ý Chí Kiên Định');
      expect(enemy.statStages?.speed).toBe(1);
    });

    it('does not flinch if defender has already acted this round', () => {
      const rng = new SeededBattleRng(42);
      const player = createBattler('PIKACHU', 50, true);
      const enemy = createBattler('PIDGEY', 10, false);
      enemy.hasActedThisRound = true; // Defender moved first!
      const engine = new BattleEngine(player, enemy, env, rng);

      const biteMove = {
        id: 'bite',
        name: 'Bite',
        type: 'Dark' as const,
        category: 'physical' as const,
        power: 60,
        accuracy: 100,
        pp: 25,
        maxPp: 25,
        description: 'May cause flinch',
      };

      engine.executeAttack(player, enemy, biteMove);
      expect(enemy.isFlinched).toBe(false);
    });
  });

  describe('Confusion Mechanics', () => {
    it('has accurate move chance mappings for confusion moves', () => {
      expect(CONFUSION_MOVE_CHANCES['confuse_ray']).toBe(1.0);
      expect(CONFUSION_MOVE_CHANCES['sweet_kiss']).toBe(1.0);
      expect(CONFUSION_MOVE_CHANCES['swagger']).toBe(1.0);
      expect(CONFUSION_MOVE_CHANCES['dynamic_punch']).toBe(1.0);
      expect(CONFUSION_MOVE_CHANCES['water_pulse']).toBe(0.2);
      expect(CONFUSION_MOVE_CHANCES['confusion']).toBe(0.1);
    });

    it('inflicts confusion via status moves (Confuse Ray, Sweet Kiss)', () => {
      const rng = new SeededBattleRng(10);
      const player = createBattler('GENGAR', 40, true);
      const enemy = createBattler('PIKACHU', 40, false);
      const engine = new BattleEngine(player, enemy, env, rng);

      const confuseRay = {
        id: 'confuse_ray',
        name: 'Confuse Ray',
        type: 'Ghost' as const,
        category: 'status' as const,
        power: 0,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        description: 'Confuses opponent',
      };

      const res = engine.executeAttack(player, enemy, confuseRay);
      expect(res.message).toContain('bối rối');
      expect(enemy.confusionTurns).toBeGreaterThan(0);
    });

    it('inflicts confusion via secondary damage moves (Dynamic Punch, Water Pulse)', () => {
      const rng = new SeededBattleRng(15);
      const player = createBattler('MACHAMP', 40, true);
      const enemy = createBattler('SNORLAX', 40, false);
      const engine = new BattleEngine(player, enemy, env, rng);

      const dynamicPunch = {
        id: 'dynamic_punch',
        name: 'Dynamic Punch',
        type: 'Fighting' as const,
        category: 'physical' as const,
        power: 100,
        accuracy: 100,
        pp: 5,
        maxPp: 5,
        description: '100% confusion',
      };

      const res = engine.executeAttack(player, enemy, dynamicPunch);
      expect(res.damage).toBeGreaterThan(0);
      expect(enemy.confusionTurns).toBeGreaterThan(0);
      expect(res.message).toContain('bối rối');
    });

    it('does not confuse a target with Own Tempo ability', () => {
      const rng = new SeededBattleRng(10);
      const player = createBattler('GENGAR', 40, true);
      const enemy = createBattler('SLOWPOKE', 40, false);
      enemy.ability = 'Own Tempo';
      const engine = new BattleEngine(player, enemy, env, rng);

      const confuseRay = {
        id: 'confuse_ray',
        name: 'Confuse Ray',
        type: 'Ghost' as const,
        category: 'status' as const,
        power: 0,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        description: 'Confuses opponent',
      };

      const res = engine.executeAttack(player, enemy, confuseRay);
      expect(enemy.confusionTurns).toBe(0);
      expect(res.message).toContain('Nhịp Điệu Riêng');
    });

    it('calculates self-inflicted confusion damage and stops movement when self-hit', () => {
      const battler = createBattler('CHARIZARD', 50, true);
      battler.confusionTurns = 3;

      // Mock RNG returning < 0.33 to trigger self-hit
      const riggedRng: any = {
        next: () => 0.1, // Forces confusion self-hit
        nextInt: (min: number, _max: number) => min,
      };

      const expectedDamage = calculateConfusionSelfDamage(battler, riggedRng);
      expect(expectedDamage).toBeGreaterThan(0);

      const initialHp = battler.currentHp;
      const res = checkPreTurnStatus(battler, 'player', riggedRng);

      expect(res.canAct).toBe(false);
      expect(res.hinderedMessage).toContain('Tự làm tổn thương chính mình trong cơn bối rối');
      expect(battler.currentHp).toBeLessThan(initialHp);
      expect(battler.confusionTurns).toBe(2);
    });

    it('heals confusion when confusion turns expire', () => {
      const rng = new SeededBattleRng(100);
      const battler = createBattler('CHARIZARD', 50, true);
      battler.confusionTurns = 1; // Last turn

      const res = checkPreTurnStatus(battler, 'player', rng);
      expect(battler.confusionTurns).toBe(0);
      expect(res.statusPrefix).toContain('đã hết bối rối');
      expect(res.canAct).toBe(true);
    });

    it('persim-berry cures confusion before attacking', () => {
      const rng = new SeededBattleRng(100);
      const battler = createBattler('CHARIZARD', 50, true);
      battler.heldItem = 'persim-berry';
      battler.confusionTurns = 3;

      const res = checkPreTurnStatus(battler, 'player', rng);
      expect(battler.heldItem).toBeNull();
      expect(battler.confusionTurns).toBe(0);
      expect(res.statusPrefix).toContain('chữa khỏi trạng thái bối rối');
      expect(res.canAct).toBe(true);
    });

    it('handles Swagger: boosts target attack +2 and confuses target', () => {
      const rng = new SeededBattleRng(10);
      const player = createBattler('MEOWTH', 40, true);
      const enemy = createBattler('SNORLAX', 40, false);
      const engine = new BattleEngine(player, enemy, env, rng);

      const swaggerMove = {
        id: 'swagger',
        name: 'Swagger',
        type: 'Normal' as const,
        category: 'status' as const,
        power: 0,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
        description: 'Raises Atk by 2 and confuses',
      };

      const res = engine.executeAttack(player, enemy, swaggerMove);
      expect(enemy.statStages?.attack).toBe(2);
      expect(enemy.confusionTurns).toBeGreaterThan(0);
      expect(res.message).toContain('tăng mạnh');
      expect(res.message).toContain('bối rối');
    });
  });

  describe('Volatile Recovery Moves: Aqua Ring & Ingrain', () => {
    const aquaRingMove = {
      id: 'aqua_ring',
      name: 'Aqua Ring (Vòng Nước)',
      type: 'Water' as const,
      category: 'status' as const,
      power: 0,
      accuracy: 100,
      pp: 20,
      maxPp: 20,
      description: 'Restores a little HP each turn.',
    };

    const ingrainMove = {
      id: 'ingrain',
      name: 'Ingrain (Cắm Rễ)',
      type: 'Grass' as const,
      category: 'status' as const,
      power: 0,
      accuracy: 100,
      pp: 20,
      maxPp: 20,
      description: 'User restores HP each turn.',
    };

    it('sets hasAquaRing flag and heals 1/16 max HP at end of each turn', () => {
      const rng = new SeededBattleRng(42);
      const player = createBattler('VAPOREON', 50, true);
      const enemy = createBattler('SNORLAX', 50, false);
      const engine = new BattleEngine(player, enemy, env, rng);

      // Cast Aqua Ring
      const res = engine.executeAttack(player, enemy, aquaRingMove);
      expect(player.hasAquaRing).toBe(true);
      expect(res.message).toContain('bao bọc bản thân trong một vòng nước');

      // Casting again should fail/warn
      const repeatRes = engine.executeAttack(player, enemy, aquaRingMove);
      expect(repeatRes.message).toContain('đã được bao bọc bởi Vòng Nước rồi');

      // Reduce HP to test end turn healing
      player.currentHp = player.maxHp - 50;
      const expectedHeal = Math.max(1, Math.floor(player.maxHp / 16));
      const startingHp = player.currentHp;

      const endTurnRes = engine.applyEndTurnEffects(player, enemy);
      expect(endTurnRes).not.toBeNull();
      expect(player.currentHp).toBe(startingHp + expectedHeal);
      expect(endTurnRes?.message).toContain('Vòng Nước giúp');
      expect(
        endTurnRes?.events.some(
          (e) => e.type === 'hp_restored' && e.message.includes('Vòng Nước')
        )
      ).toBe(true);
    });

    it('sets isIngrained flag and heals 1/16 max HP at end of each turn', () => {
      const rng = new SeededBattleRng(42);
      const player = createBattler('VENUSAUR', 50, true);
      const enemy = createBattler('SNORLAX', 50, false);
      const engine = new BattleEngine(player, enemy, env, rng);

      // Cast Ingrain
      const res = engine.executeAttack(player, enemy, ingrainMove);
      expect(player.isIngrained).toBe(true);
      expect(res.message).toContain('cắm rễ vào lòng đất');

      // Reduce HP to test healing
      player.currentHp = player.maxHp - 40;
      const expectedHeal = Math.max(1, Math.floor(player.maxHp / 16));
      const startingHp = player.currentHp;

      const endTurnRes = engine.applyEndTurnEffects(player, enemy);
      expect(endTurnRes).not.toBeNull();
      expect(player.currentHp).toBe(startingHp + expectedHeal);
      expect(endTurnRes?.message).toContain('hấp thụ chất dinh dưỡng từ rễ cây');
    });

    it('resets hasAquaRing and isIngrained when switching Pokémon', () => {
      const rng = new SeededBattleRng(42);
      const player = createBattler('VAPOREON', 50, true);
      const enemy = createBattler('SNORLAX', 50, false);
      const bench = createBattler('PIKACHU', 50, true);
      const engine = new BattleEngine(player, enemy, env, rng);

      engine.executeAttack(player, enemy, aquaRingMove);
      expect(engine.playerPokemon.hasAquaRing).toBe(true);

      engine.switchPlayerPokemon(bench);
      expect(engine.playerPokemon.hasAquaRing).toBe(false);
      expect(engine.playerPokemon.isIngrained).toBe(false);
    });
  });

  describe('Protect 1-Turn Expiration and Safeguard Mechanics', () => {
    const protectMove = {
      id: 'protect',
      name: 'Protect (Bảo Vệ)',
      type: 'Normal' as const,
      category: 'status' as const,
      power: 0,
      accuracy: 100,
      pp: 10,
      maxPp: 10,
      priority: 4,
      description: 'Protects user from all attacks this turn.',
    };

    const tackleMove = {
      id: 'tackle',
      name: 'Tackle',
      type: 'Normal' as const,
      category: 'physical' as const,
      power: 40,
      accuracy: 100,
      pp: 35,
      maxPp: 35,
      description: 'Physical attack',
    };

    const safeguardMove = {
      id: 'safeguard',
      name: 'Safeguard (Hộ Thể)',
      type: 'Normal' as const,
      category: 'status' as const,
      power: 0,
      accuracy: 100,
      pp: 25,
      maxPp: 25,
      description: "User's party is protected from status conditions.",
    };

    const toxicMove = {
      id: 'toxic',
      name: 'Toxic (Độc Dược)',
      type: 'Poison' as const,
      category: 'status' as const,
      power: 0,
      accuracy: 90,
      pp: 10,
      maxPp: 10,
      description: 'Badly poisons target',
      statusEffect: { condition: 'toxic' as const, chance: 1.0, target: 'target' as const },
    };

    const confuseRayMove = {
      id: 'confuse_ray',
      name: 'Confuse Ray',
      type: 'Ghost' as const,
      category: 'status' as const,
      power: 0,
      accuracy: 100,
      pp: 10,
      maxPp: 10,
      description: 'Confuses target',
    };

    it('ensures Protect only protects for the current round and resets at round end', () => {
      const rng = new SeededBattleRng(42);
      const player = createBattler('PIKACHU', 50, true);
      const enemy = createBattler('SNORLAX', 50, false);
      const engine = new BattleEngine(player, enemy, env, rng);

      // Round 1: Player uses Protect
      const protRes = engine.executeAttack(player, enemy, protectMove);
      expect(player.isProtected).toBe(true);
      expect(protRes.message).toContain('dựng lá chắn tự bảo vệ mình');

      // Round 1: Enemy attacks player -> blocked!
      const enemyAttack1 = engine.executeAttack(enemy, player, tackleMove);
      expect(enemyAttack1.damage).toBe(0);
      expect(enemyAttack1.message).toContain('đã được bảo vệ hoàn toàn');

      // Round ends!
      engine.resetRound();
      expect(player.isProtected).toBe(false);
      expect(enemy.isProtected).toBe(false);

      // Round 2: Enemy attacks FIRST -> must NOT be blocked anymore!
      const enemyAttack2 = engine.executeAttack(enemy, player, tackleMove);
      expect(enemyAttack2.damage).toBeGreaterThan(0);
      expect(enemyAttack2.message).not.toContain('đã được bảo vệ hoàn toàn');
    });

    it('activates Safeguard and protects user from status conditions and confusion', () => {
      const rng = new SeededBattleRng(42);
      const player = createBattler('VAPOREON', 50, true);
      const ghostEnemy = createBattler('GENGAR', 50, false); // Ghost type target
      const engine = new BattleEngine(player, ghostEnemy, env, rng);

      // Player casts Safeguard against a Ghost enemy (should NOT say immune!)
      const sgRes = engine.executeAttack(player, ghostEnemy, safeguardMove);
      expect(player.safeguardTurns).toBe(5);
      expect(sgRes.message).toContain('Màn Hộ Thể huyền bí bao bọc');
      expect(sgRes.message).not.toContain('Không có tác dụng lên');

      // Enemy tries to poison with Toxic -> blocked by Safeguard!
      const toxicRes = engine.executeAttack(ghostEnemy, player, toxicMove);
      expect(player.status).toBe('none');
      expect(toxicRes.message).toContain('Màn Hộ Thể bảo vệ');

      // Enemy tries to confuse with Confuse Ray -> blocked by Safeguard!
      const confuseRes = engine.executeAttack(ghostEnemy, player, confuseRayMove);
      expect(player.confusionTurns ?? 0).toBe(0);
      expect(confuseRes.message).toContain('Màn Hộ Thể bảo vệ');

      // Switch Pokemon -> Safeguard is inherited by party member
      const bench = createBattler('PIKACHU', 50, true);
      engine.switchPlayerPokemon(bench);
      expect(engine.playerPokemon.safeguardTurns).toBe(5);

      // Turn countdown reduces safeguardTurns
      engine.applyEndTurnEffects(engine.playerPokemon, ghostEnemy);
      expect(engine.playerPokemon.safeguardTurns).toBe(4);
    });
  });
});


