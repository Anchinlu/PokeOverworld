import { describe, it, expect, beforeEach } from 'vitest';
import { BattleEngine } from '../src/battle/battle-engine';
import { BattlerPokemon, BattleMove } from '../src/battle/types';
import rawMovesData from '@pokemon/game-data/moves-db.json';

const movesDb = (rawMovesData as { moves: Record<string, BattleMove> }).moves;

function createDummyBattler(name: string, overrides?: Partial<BattlerPokemon>): BattlerPokemon {
  return {
    id: 1,
    name,
    speciesKey: name.toLowerCase(),
    types: ['Normal'],
    level: 50,
    currentHp: 200,
    maxHp: 200,
    stats: {
      hp: 200,
      attack: 100,
      defense: 100,
      spAtk: 100,
      spDef: 100,
      speed: 100,
      total: 700,
    },
    statStages: {
      attack: 0,
      defense: 0,
      spAtk: 0,
      spDef: 0,
      speed: 0,
      accuracy: 0,
      evasion: 0,
    },
    moves: [],
    frontSprite: '',
    backSprite: '',
    iconSprite: '',
    gender: 'male',
    isFainted: false,
    catchRate: 45,
    exp: 0,
    maxExp: 1000,
    ...overrides,
  };
}

describe('Move Logic Fixes & Enhancements Verification', () => {
  let engine: BattleEngine;
  let player: BattlerPokemon;
  let enemy: BattlerPokemon;

  beforeEach(() => {
    player = createDummyBattler('PlayerMon');
    enemy = createDummyBattler('EnemyMon');
    engine = new BattleEngine(player, enemy, {
      weather: { type: 'none', turnsLeft: 0 },
      terrain: { type: 'none', turnsLeft: 0 },
    });
  });

  it('verifies Calm Mind boosts both Sp. Atk and Sp. Def by 1 stage', () => {
    const calmMind = movesDb['calm_mind'];
    expect(calmMind).toBeDefined();
    expect(calmMind.statChanges).toHaveLength(2);

    engine.executeAttack(player, enemy, calmMind);
    expect(player.statStages?.spAtk).toBe(1);
    expect(player.statStages?.spDef).toBe(1);
  });

  it('verifies Dragon Dance boosts both Attack and Speed by 1 stage', () => {
    const dragonDance = movesDb['dragon_dance'];
    expect(dragonDance).toBeDefined();
    expect(dragonDance.statChanges).toHaveLength(2);

    engine.executeAttack(player, enemy, dragonDance);
    expect(player.statStages?.attack).toBe(1);
    expect(player.statStages?.speed).toBe(1);
  });

  it('verifies Shell Smash boosts Atk, SpAtk, Speed +2 and lowers Def, SpDef -1', () => {
    const shellSmash = movesDb['shell_smash'];
    expect(shellSmash).toBeDefined();
    expect(shellSmash.statChanges).toHaveLength(5);

    engine.executeAttack(player, enemy, shellSmash);
    expect(player.statStages?.attack).toBe(2);
    expect(player.statStages?.spAtk).toBe(2);
    expect(player.statStages?.speed).toBe(2);
    expect(player.statStages?.defense).toBe(-1);
    expect(player.statStages?.spDef).toBe(-1);
  });

  it('verifies Close Combat deals damage and reduces user Def and SpDef by 1', () => {
    const closeCombat = movesDb['close_combat'];
    expect(closeCombat).toBeDefined();
    expect(closeCombat.statChanges).toHaveLength(2);

    const prevEnemyHp = enemy.currentHp;
    engine.executeAttack(player, enemy, closeCombat);
    expect(enemy.currentHp).toBeLessThan(prevEnemyHp);
    expect(player.statStages?.defense).toBe(-1);
    expect(player.statStages?.spDef).toBe(-1);
  });

  it('verifies Beak Blast charges on turn 1, burns on physical contact, and attacks on turn 2', () => {
    const beakBlast = movesDb['beak_blast'];
    expect(beakBlast).toBeDefined();
    expect(beakBlast.twoTurn).toBe('charge');

    // Turn 1: Player charges Beak Blast
    engine.executeAttack(player, enemy, beakBlast);
    expect(player.isBeakBlastCharging).toBe(true);

    // Enemy hits Player with physical Tackle while Beak Blast is charging
    const tackle = movesDb['tackle'];
    engine.executeAttack(enemy, player, tackle);
    // Enemy hit player with physical contact move, so enemy should be Burned!
    expect(enemy.status).toBe('burn');

    // Turn 2: Player fires Beak Blast
    const prevEnemyHp = enemy.currentHp;
    engine.executeAttack(player, enemy, beakBlast);
    expect(player.isBeakBlastCharging).toBe(false);
    expect(enemy.currentHp).toBeLessThan(prevEnemyHp);
  });

  it('verifies Focus Punch loses focus when damaged during charge', () => {
    const focusPunch = movesDb['focus_punch'];
    expect(focusPunch).toBeDefined();

    // Turn 1: Player charges Focus Punch
    engine.executeAttack(player, enemy, focusPunch);
    expect(player.isFocusPunchCharging).toBe(true);

    // Enemy attacks Player with Tackle
    engine.executeAttack(enemy, player, movesDb['tackle']);
    // Since enemy used Tackle and dealt damage, Focus Punch should be canceled!
    expect(player.isFocusPunchCharging).toBe(false);
    expect(player.chargingMove).toBeUndefined();
  });

  it('verifies Multi-hit moves hit multiple times and update hitsCount', () => {
    const bulletSeed = movesDb['bullet_seed'];
    expect(bulletSeed.multiHit).toEqual([2, 5]);

    const result = engine.executeAttack(player, enemy, bulletSeed);
    expect(result.hitsCount).toBeGreaterThanOrEqual(2);
    expect(result.hitsCount).toBeLessThanOrEqual(5);
  });

  it('verifies Priority moves have correct priority values in database', () => {
    expect(movesDb['sucker_punch'].priority).toBe(1);
    expect(movesDb['first_impression'].priority).toBe(2);
    expect(movesDb['extreme_speed'].priority).toBe(2);
    expect(movesDb['protect'].priority).toBe(4);
    expect(movesDb['trick_room'].priority).toBe(-7);
  });
});
