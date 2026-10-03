import { describe, it, expect } from 'vitest';
import {
  createBattler,
  getBattleEnvironment,
  getTypeEffectiveness,
  BattleEngine,
  SeededBattleRng,
  TYPE_ICO_INDICES,
} from '../src/battle';

describe('Wild Pokémon Battle System', () => {
  it('creates valid BattlerPokemon instances with scaled stats and movesets', () => {
    const pika = createBattler('PIKACHU', 5, true);
    expect(pika.name).toBe('Pikachu');
    expect(pika.level).toBe(5);
    expect(pika.currentHp).toBeGreaterThan(15);
    expect(pika.maxHp).toBe(pika.currentHp);
    expect(pika.types).toContain('Electric');
    expect(pika.moves.length).toBeGreaterThan(0);
    expect(pika.backSprite).toContain('PIKACHU.png');

    const pidgey = createBattler('PIDGEY', 3, false);
    expect(pidgey.name).toBe('Pidgey');
    expect(pidgey.level).toBe(3);
    expect(pidgey.frontSprite).toContain('PIDGEY.png');
    expect(pidgey.moves.some((m) => m.name.includes('Gust') || m.name.includes('Tackle'))).toBe(
      true
    );
  });

  it('correctly maps all 18 types and ??? to indices in types_ico.png (24x28 per icon)', () => {
    const types = [
      'Normal',
      'Fighting',
      'Flying',
      'Poison',
      'Ground',
      'Rock',
      'Bug',
      'Ghost',
      'Steel',
      '???',
      'Fire',
      'Water',
      'Grass',
      'Electric',
      'Psychic',
      'Ice',
      'Dragon',
      'Dark',
      'Fairy',
    ];

    for (const t of types) {
      const idx = TYPE_ICO_INDICES[t];
      expect(idx).toBeDefined();
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThanOrEqual(18);
    }
  });

  it('calculates authentic type effectiveness multipliers', () => {
    // Electric vs Water: 2x
    expect(getTypeEffectiveness('Electric', ['Water'])).toBe(2);
    // Electric vs Ground: 0x (immune)
    expect(getTypeEffectiveness('Electric', ['Ground'])).toBe(0);
    // Water vs Fire: 2x
    expect(getTypeEffectiveness('Water', ['Fire'])).toBe(2);
    // Fire vs Water: 0.5x
    expect(getTypeEffectiveness('Fire', ['Water'])).toBe(0.5);
    // Electric vs Water/Flying (dual type): 4x
    expect(getTypeEffectiveness('Electric', ['Water', 'Flying'])).toBe(4);
  });

  it('executes battle turns and deducts defender HP', () => {
    const player = createBattler('PIKACHU', 10, true);
    const wild = createBattler('PIDGEY', 3, false);
    const env = getBattleEnvironment('meadow', false);

    const engine = new BattleEngine(player, wild, env);
    const thunderbolt = player.moves.find((m) => m.id === 'thunderbolt') ?? player.moves[0];

    const initialHp = wild.currentHp;
    const turn = engine.executeAttack(player, wild, thunderbolt);

    expect(turn.damage).toBeGreaterThan(0);
    expect(wild.currentHp).toBeLessThan(initialHp);
  });

  it('replays battle randomness deterministically with the same seed', () => {
    const firstPlayer = createBattler('PIKACHU', 10, true);
    const firstWild = createBattler('PIDGEY', 3, true);
    const secondPlayer = createBattler('PIKACHU', 10, true);
    const secondWild = createBattler('PIDGEY', 3, true);
    const moveA =
      firstPlayer.moves.find((move) => move.id === 'thunderbolt') ?? firstPlayer.moves[0];
    const moveB =
      secondPlayer.moves.find((move) => move.id === 'thunderbolt') ?? secondPlayer.moves[0];
    const first = new BattleEngine(
      firstPlayer,
      firstWild,
      getBattleEnvironment('meadow'),
      new SeededBattleRng(12345)
    );
    const second = new BattleEngine(
      secondPlayer,
      secondWild,
      getBattleEnvironment('meadow'),
      new SeededBattleRng(12345)
    );

    expect(first.executeAttack(firstPlayer, firstWild, moveA)).toEqual(
      second.executeAttack(secondPlayer, secondWild, moveB)
    );
  });

  it('supports catching wild Pokémon with Poké Balls', () => {
    const player = createBattler('PIKACHU', 15, true);
    const wild = createBattler('CATERPIE', 2, false);
    wild.currentHp = 1; // 1 HP left for easy catch
    const env = getBattleEnvironment('dense_forest', false);

    const engine = new BattleEngine(player, wild, env);
    expect(engine.ballsCount).toBe(5);

    const catchRes = engine.tryCatchPokemon();
    expect(engine.ballsCount).toBe(4);
    expect(catchRes.shakes).toBeGreaterThanOrEqual(0);
  });

  it('selects suitable battle background and base platforms based on ecology zone', () => {
    const forestEnv = getBattleEnvironment('dense_forest', false);
    expect(forestEnv.background).toBe('Forest.png');
    expect(forestEnv.playerBase).toBe('ForestGrass.png');

    const waterEnv = getBattleEnvironment('wetland', true);
    expect(waterEnv.background).toBe('Water.png');
    expect(waterEnv.playerBase).toBe('Water.png');

    const mountainEnv = getBattleEnvironment('hill_edge', false);
    expect(mountainEnv.background).toBe('Mountain.png');
  });

  it('loads comprehensive moves database with Vietnamese descriptions and accurate move effects', async () => {
    const { MOVES_DB } = await import('../src/battle/moves-db');
    expect(Object.keys(MOVES_DB).length).toBeGreaterThan(900);

    const tackle = MOVES_DB['tackle'];
    expect(tackle.name).toBe('Tackle (Va Chạm)');
    expect(tackle.nameEn).toBe('Tackle');
    expect(tackle.nameVi).toBe('Va Chạm');
    expect(tackle.description).toContain('Lao toàn bộ cơ thể');

    const thunderWave = MOVES_DB['thunder_wave'];
    expect(thunderWave.statusEffect?.condition).toBe('paralysis');

    const swordsDance = MOVES_DB['swords_dance'];
    expect(swordsDance.statChanges?.[0]?.stat).toBe('attack');
    expect(swordsDance.statChanges?.[0]?.stages).toBe(2);
  });

  it('correctly executes stat-changing moves, healing, and priority ordering in BattleEngine', async () => {
    const { MOVES_DB } = await import('../src/battle/moves-db');
    const player = createBattler('PIKACHU', 20, true);
    const enemy = createBattler('BULBASAUR', 20, false);
    const env = getBattleEnvironment('meadow', false);
    const engine = new BattleEngine(player, enemy, env);

    // 1. Stat modification: Swords Dance (+2 Attack)
    const sd = MOVES_DB['swords_dance'];
    engine.executeAttack(player, enemy, sd);
    expect(player.statStages?.attack).toBe(2);

    // 2. Stat modification on opponent: Growl (-1 Attack)
    const growl = MOVES_DB['growl'];
    engine.executeAttack(player, enemy, growl);
    expect(enemy.statStages?.attack).toBe(-1);

    // 3. Status effect: Thunder Wave
    const tw = MOVES_DB['thunder_wave'];
    engine.executeAttack(player, enemy, tw);
    expect(enemy.status).toBe('paralysis');

    // 4. Healing move: Recover
    player.currentHp = 10;
    const recover = MOVES_DB['recover'];
    engine.executeAttack(player, enemy, recover);
    expect(player.currentHp).toBeGreaterThan(10);

    // 5. Priority ordering: Quick Attack (+1 Priority) vs normal move
    const qa = MOVES_DB['quick_attack'];
    const tackle = MOVES_DB['tackle'];
    expect(engine.getFirstAttacker(qa, tackle)).toBe('player');
    expect(engine.getFirstAttacker(tackle, qa)).toBe('enemy');
  });
});
