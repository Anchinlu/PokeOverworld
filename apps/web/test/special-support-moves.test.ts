import { describe, it, expect } from 'vitest';
import { BattleEngine } from '../src/battle/battle-engine';
import { FixedSequenceRng } from '../src/battle/battle-rng';
import type {
  BattlerPokemon,
  BattleMove,
  BattleEnvironment,
  StatStages,
} from '../src/battle/types';

interface MockBattlerPokemon extends BattlerPokemon {
  statStages: StatStages;
}

function createMockBattler(overrides: Partial<MockBattlerPokemon> = {}): MockBattlerPokemon {
  return {
    id: 1,
    name: 'Bulbasaur',
    speciesKey: 'BULBASAUR',
    level: 50,
    types: ['Grass', 'Poison'],
    stats: {
      hp: 200,
      attack: 100,
      defense: 100,
      spAtk: 100,
      spDef: 100,
      speed: 100,
      total: 700,
    },
    currentHp: 200,
    maxHp: 200,
    moves: [],
    frontSprite: '',
    backSprite: '',
    iconSprite: '',
    gender: 'male',
    isFainted: false,
    catchRate: 45,
    exp: 100,
    maxExp: 200,
    status: 'none',
    statStages: {
      attack: 0,
      defense: 0,
      spAtk: 0,
      spDef: 0,
      speed: 0,
      accuracy: 0,
      evasion: 0,
    },
    ...overrides,
  };
}

function createMockEnvironment(overrides: Partial<BattleEnvironment> = {}): BattleEnvironment {
  return {
    background: 'field',
    enemyBase: 'grass',
    playerBase: 'grass',
    weather: { type: 'none', turnsLeft: 0 },
    terrain: { type: 'none', turnsLeft: 0 },
    ...overrides,
  };
}

function createMove(overrides: Partial<BattleMove>): BattleMove {
  return {
    id: 'tackle',
    name: 'Tackle',
    type: 'Normal',
    category: 'physical',
    power: 50,
    accuracy: 100,
    pp: 35,
    maxPp: 35,
    description: '',
    ...overrides,
  };
}

describe('Special Support Moves', () => {
  it('Heal Bell and Aromatherapy cure party status conditions', () => {
    const healBell = createMove({
      id: 'heal_bell',
      name: 'Heal Bell',
      type: 'Normal',
      category: 'status',
      power: 0,
    });
    const aromatherapy = createMove({
      id: 'aromatherapy',
      name: 'Aromatherapy',
      type: 'Grass',
      category: 'status',
      power: 0,
    });
    const env = createMockEnvironment();
    const rng = new FixedSequenceRng([0.5]);

    const player = createMockBattler({ name: 'Chansey', status: 'paralysis' });
    const enemy = createMockBattler({ name: 'Gengar' });
    const engine = new BattleEngine(player, enemy, env, rng);

    const res1 = engine.executeAttack(player, enemy, healBell);
    expect(player.status).toBe('none');
    expect(res1.events.some((e) => e.type === 'status_cured')).toBe(true);

    player.status = 'burn';
    const res2 = engine.executeAttack(player, enemy, aromatherapy);
    expect(player.status).toBe('none');
    expect(res2.events.some((e) => e.type === 'status_cured')).toBe(true);
  });

  it('Refresh cures burn, poison, and paralysis on self, fails on healthy or sleep', () => {
    const refresh = createMove({
      id: 'refresh',
      name: 'Refresh',
      type: 'Normal',
      category: 'status',
      power: 0,
    });
    const env = createMockEnvironment();
    const rng = new FixedSequenceRng([0.5]);

    const player = createMockBattler({ name: 'Milotic', status: 'poison' });
    const enemy = createMockBattler({ name: 'Snorlax' });
    const engine = new BattleEngine(player, enemy, env, rng);

    const res1 = engine.executeAttack(player, enemy, refresh);
    expect(player.status).toBe('none');
    expect(res1.events.some((e) => e.type === 'status_cured')).toBe(true);

    // Fails when healthy
    const res2 = engine.executeAttack(player, enemy, refresh);
    expect(res2.message).toContain('chiêu thức thất bại');
  });

  it('Safeguard establishes protection against statuses for 5 turns and ticks down', () => {
    const safeguard = createMove({
      id: 'safeguard',
      name: 'Safeguard',
      type: 'Normal',
      category: 'status',
      power: 0,
    });
    const thunderWave = createMove({
      id: 'thunder_wave',
      name: 'Thunder Wave',
      type: 'Electric',
      category: 'status',
      statusEffect: { condition: 'paralysis', chance: 1, target: 'opponent' },
    });
    const env = createMockEnvironment();
    const rng = new FixedSequenceRng([0.5]);

    const player = createMockBattler({ name: 'Dragonite' });
    const enemy = createMockBattler({ name: 'Pikachu' });
    const engine = new BattleEngine(player, enemy, env, rng);

    engine.executeAttack(player, enemy, safeguard);
    expect(player.safeguardTurns).toBe(5);

    // Enemy tries to paralyze protected player
    const waveRes = engine.executeAttack(enemy, player, thunderWave);
    expect(player.status).toBe('none');
    expect(waveRes.message).toContain('Màn Hộ Thể');

    // End turn ticks down
    engine.applyEndTurnEffects(player, enemy);
    expect(player.safeguardTurns).toBe(4);
  });

  it('Taunt prevents target from using status moves for 3 turns', () => {
    const taunt = createMove({
      id: 'taunt',
      name: 'Taunt',
      type: 'Dark',
      category: 'status',
      power: 0,
    });
    const swordsDance = createMove({
      id: 'swords_dance',
      name: 'Swords Dance',
      type: 'Normal',
      category: 'status',
      power: 0,
    });
    const env = createMockEnvironment();
    const rng = new FixedSequenceRng([0.5]);

    const player = createMockBattler({ name: 'Sneasel' });
    const enemy = createMockBattler({ name: 'Scizor' });
    const engine = new BattleEngine(player, enemy, env, rng);

    engine.executeAttack(player, enemy, taunt);
    expect(enemy.tauntTurns).toBe(3);

    // Enemy tries to use Swords Dance while taunted
    const statusRes = engine.executeAttack(enemy, player, swordsDance);
    expect(statusRes.message).toContain('bị khiêu khích');
    expect(enemy.statStages.attack).toBe(0);

    // Enemy AI filters status moves under Taunt
    enemy.moves = [swordsDance, createMove({ id: 'slash', category: 'physical', power: 70 })];
    const enemyAction = engine.getEnemyAction();
    expect(enemyAction.id).toBe('slash');
  });

  it('Torment prevents using the same move twice consecutively', () => {
    const torment = createMove({
      id: 'torment',
      name: 'Torment',
      type: 'Dark',
      category: 'status',
      power: 0,
    });
    const tackle = createMove({ id: 'tackle', name: 'Tackle', category: 'physical', power: 40 });
    const scratch = createMove({ id: 'scratch', name: 'Scratch', category: 'physical', power: 40 });
    const env = createMockEnvironment();
    const rng = new FixedSequenceRng([0.5]);

    const player = createMockBattler({ name: 'Houndoom' });
    const enemy = createMockBattler({ name: 'Rattata', moves: [tackle, scratch] });
    const engine = new BattleEngine(player, enemy, env, rng);

    engine.executeAttack(player, enemy, torment);
    expect(enemy.isTormented).toBe(true);

    // First use of tackle succeeds
    engine.executeAttack(enemy, player, tackle);
    expect(enemy.lastUsedMoveId).toBe('tackle');

    // Second consecutive use of tackle fails due to torment
    const secondTackle = engine.executeAttack(enemy, player, tackle);
    expect(secondTackle.message).toContain('Dằn Vặt');

    // AI filters out the last used move under Torment
    const enemyAction = engine.getEnemyAction();
    expect(enemyAction.id).toBe('scratch');
  });

  it('Disable disables the target last used move for 4 turns', () => {
    const disable = createMove({
      id: 'disable',
      name: 'Disable',
      type: 'Normal',
      category: 'status',
      power: 0,
    });
    const flamethrower = createMove({
      id: 'flamethrower',
      name: 'Flamethrower',
      type: 'Fire',
      category: 'special',
      power: 90,
    });
    const env = createMockEnvironment();
    const rng = new FixedSequenceRng([0.5]);

    const player = createMockBattler({ name: 'Dusclops' });
    const enemy = createMockBattler({ name: 'Charizard', moves: [flamethrower] });
    const engine = new BattleEngine(player, enemy, env, rng);

    // Enemy uses flamethrower
    engine.executeAttack(enemy, player, flamethrower);
    expect(enemy.lastUsedMoveId).toBe('flamethrower');

    // Player disables flamethrower
    engine.executeAttack(player, enemy, disable);
    expect(enemy.disabledMove?.moveId).toBe('flamethrower');
    expect(enemy.disabledMove?.turnsLeft).toBe(4);

    // Enemy tries to reuse disabled move
    const reuseRes = engine.executeAttack(enemy, player, flamethrower);
    expect(reuseRes.message).toContain('vô hiệu hóa');
  });

  it('Encore forces target to repeat its last move for 3 turns', () => {
    const encore = createMove({
      id: 'encore',
      name: 'Encore',
      type: 'Normal',
      category: 'status',
      power: 0,
    });
    const splash = createMove({ id: 'splash', name: 'Splash', category: 'status', power: 0 });
    const tackle = createMove({ id: 'tackle', name: 'Tackle', category: 'physical', power: 40 });
    const env = createMockEnvironment();
    const rng = new FixedSequenceRng([0.5]);

    const player = createMockBattler({ name: 'Whimsicott' });
    const enemy = createMockBattler({ name: 'Magikarp', moves: [splash, tackle] });
    const engine = new BattleEngine(player, enemy, env, rng);

    // Enemy used splash
    engine.executeAttack(enemy, player, splash);

    // Player uses encore
    engine.executeAttack(player, enemy, encore);
    expect(enemy.encore?.moveId).toBe('splash');

    // Enemy tries to use tackle instead of splash
    const tackled = engine.executeAttack(enemy, player, tackle);
    expect(tackled.message).toContain('tán dương');

    // Enemy AI is forced to select splash
    const forcedAction = engine.getEnemyAction();
    expect(forcedAction.id).toBe('splash');
  });

  it('Throat Chop damages and blocks sound-based moves for 2 turns', () => {
    const throatChop = createMove({
      id: 'throat_chop',
      name: 'Throat Chop',
      type: 'Dark',
      category: 'physical',
      power: 80,
    });
    const hyperVoice = createMove({
      id: 'hyper_voice',
      name: 'Hyper Voice',
      type: 'Normal',
      category: 'special',
      power: 90,
    });
    const env = createMockEnvironment();
    const rng = new FixedSequenceRng([0.99, 1.0]);

    const player = createMockBattler({ name: 'Weavile' });
    const enemy = createMockBattler({ name: 'Sylveon' });
    const engine = new BattleEngine(player, enemy, env, rng);

    const tcRes = engine.executeAttack(player, enemy, throatChop);
    expect(tcRes.damage).toBeGreaterThan(0);
    expect(enemy.throatChopTurns).toBe(2);

    // Enemy tries to use Hyper Voice
    const voiceRes = engine.executeAttack(enemy, player, hyperVoice);
    expect(voiceRes.message).toContain('chẹt họng');
  });

  it('Uproar wakes sleepers and prevents sleep while active', () => {
    const uproar = createMove({
      id: 'uproar',
      name: 'Uproar',
      type: 'Normal',
      category: 'special',
      power: 90,
    });
    const sleepPowder = createMove({
      id: 'sleep_powder',
      name: 'Sleep Powder',
      type: 'Grass',
      category: 'status',
      statusEffect: { condition: 'sleep', chance: 1, target: 'opponent' },
    });
    const env = createMockEnvironment();
    const rng = new FixedSequenceRng([0.99, 1.0]);

    const player = createMockBattler({ name: 'Exploud' });
    const enemy = createMockBattler({ name: 'Butterfree', status: 'sleep', sleepTurns: 3 });
    const engine = new BattleEngine(player, enemy, env, rng);

    // Uproar wakes sleeping enemy
    engine.executeAttack(player, enemy, uproar);
    expect(player.uproarTurns).toBe(3);
    expect(enemy.status).toBe('none');

    // Sleep Powder cannot put target to sleep during Uproar
    const sleepRes = engine.executeAttack(enemy, player, sleepPowder);
    expect(sleepRes.message).toContain('náo loạn');
    expect(player.status).toBe('none');
  });

  it('Snore and Sleep Talk can only be used while asleep and execute correctly', () => {
    const snore = createMove({
      id: 'snore',
      name: 'Snore',
      type: 'Normal',
      category: 'special',
      power: 50,
    });
    const sleepTalk = createMove({
      id: 'sleep_talk',
      name: 'Sleep Talk',
      type: 'Normal',
      category: 'status',
      power: 0,
    });
    const flamethrower = createMove({
      id: 'flamethrower',
      name: 'Flamethrower',
      type: 'Fire',
      category: 'special',
      power: 90,
    });
    const env = createMockEnvironment();
    const rng = new FixedSequenceRng([0.99, 1.0, 0]);

    const awakePlayer = createMockBattler({ name: 'Snorlax', status: 'none', moves: [snore, sleepTalk] });
    const enemy = createMockBattler({ name: 'Machamp' });
    const engine = new BattleEngine(awakePlayer, enemy, env, rng);

    // Fails while awake
    const awakeSnore = engine.executeAttack(awakePlayer, enemy, snore);
    expect(awakeSnore.message).toContain('chỉ có thể dùng khi đang ngủ');

    // Succeeds while asleep
    const asleepPlayer = createMockBattler({
      name: 'Snorlax',
      status: 'sleep',
      sleepTurns: 3,
      moves: [snore, sleepTalk, flamethrower],
    });
    const asleepEngine = new BattleEngine(asleepPlayer, enemy, env, rng);

    const asleepSnore = asleepEngine.executeAttack(asleepPlayer, enemy, snore);
    expect(asleepSnore.damage).toBeGreaterThan(0);

    const asleepTalk = asleepEngine.executeAttack(asleepPlayer, enemy, sleepTalk);
    expect(asleepTalk.message).toContain('nói mớ và sử dụng Flamethrower');
    expect(asleepTalk.damage).toBeGreaterThan(0);
  });

  it('Baton Pass passes stat stages and states on switch', () => {
    const batonPass = createMove({
      id: 'baton_pass',
      name: 'Baton Pass',
      type: 'Normal',
      category: 'status',
      power: 0,
    });
    const env = createMockEnvironment();
    const rng = new FixedSequenceRng([0.5]);

    const player = createMockBattler({
      name: 'Ninjask',
      statStages: { attack: 2, defense: 0, spAtk: 0, spDef: 0, speed: 4, accuracy: 0, evasion: 0 },
      hasAquaRing: true,
      confusionTurns: 2,
    });
    const enemy = createMockBattler({ name: 'Golem' });
    const engine = new BattleEngine(player, enemy, env, rng);

    const bpRes = engine.executeAttack(player, enemy, batonPass);
    expect(bpRes.mustSwitch).toBe(true);
    expect(bpRes.batonPassData?.statStages?.speed).toBe(4);
    expect(bpRes.batonPassData?.hasAquaRing).toBe(true);

    // Switch to new pokemon with baton pass data
    const replacement = createMockBattler({ name: 'Marowak' });
    engine.switchPlayerPokemon(replacement, bpRes.batonPassData);
    expect(engine.playerPokemon.statStages?.speed).toBe(4);
    expect(engine.playerPokemon.statStages?.attack).toBe(2);
    expect(engine.playerPokemon.hasAquaRing).toBe(true);
  });

  it('Roar and Whirlwind force end wild battles, blocked by Suction Cups or Ingrain', () => {
    const roar = createMove({
      id: 'roar',
      name: 'Roar',
      type: 'Normal',
      category: 'status',
      power: 0,
    });
    const env = createMockEnvironment();
    const rng = new FixedSequenceRng([0.5]);

    const player = createMockBattler({ name: 'Arcanine' });
    const wildEnemy = createMockBattler({ name: 'Pidgey' });
    const engine = new BattleEngine(player, wildEnemy, env, rng);

    const roarRes = engine.executeAttack(player, wildEnemy, roar);
    expect(roarRes.battleEnded).toBe(true);
    expect(roarRes.battleEndReason).toBe('roar');

    // Blocked by Suction Cups
    const suctionEnemy = createMockBattler({ name: 'Octillery', ability: 'Suction Cups' });
    const suctionEngine = new BattleEngine(player, suctionEnemy, env, rng);
    const suctionRes = suctionEngine.executeAttack(player, suctionEnemy, roar);
    expect(suctionRes.battleEnded).toBeUndefined();
    expect(suctionRes.message).toContain('bám chặt vào mặt đất');
  });

  it('U-turn and Volt Switch deal damage and trigger switch request', () => {
    const uTurn = createMove({
      id: 'u_turn',
      name: 'U-turn',
      type: 'Bug',
      category: 'physical',
      power: 70,
    });
    const voltSwitch = createMove({
      id: 'volt_switch',
      name: 'Volt Switch',
      type: 'Electric',
      category: 'special',
      power: 70,
    });
    const env = createMockEnvironment();
    const rng = new FixedSequenceRng([0.99, 1.0]);

    const player = createMockBattler({ name: 'Scizor' });
    const enemy = createMockBattler({ name: 'Alakazam' });
    const engine = new BattleEngine(player, enemy, env, rng);

    const utRes = engine.executeAttack(player, enemy, uTurn);
    expect(utRes.damage).toBeGreaterThan(0);
    expect(utRes.mustSwitch).toBe(true);
    expect(utRes.switchSide).toBe('player');

    const vsRes = engine.executeAttack(player, enemy, voltSwitch);
    expect(vsRes.damage).toBeGreaterThan(0);
    expect(vsRes.mustSwitch).toBe(true);
  });
});
