import { describe, it, expect } from 'vitest';
import {
  createBattler,
  getBattleEnvironment,
  getTypeEffectiveness,
  BattleEngine,
  BattleState,
  SeededBattleRng,
  TYPE_ICO_INDICES,
  getBattleStatusIconFrame,
  moveAnimationManager,
  MoveAnimationManager,
  BattleController,
  POKEBALL_DB,
  getPokeballData,
} from '../src/battle';
import { normalizeBallKey, BATTLE_ASSETS } from '../src/assets/asset-registry';
import { partyService } from '../src/domain/party/party-service';
import { createPartyPokemon, partyPokemonToBattler } from '../src/domain/party/party-state';
import { BattleTextOverlay } from '../src/battle/battle-text-overlay';
import { battleSePlayer } from '../src/audio';

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

  it('maps battle environments and assigns correct foreground clutter overlays', () => {
    // Water
    const waterEnv = getBattleEnvironment('wetland', true);
    expect(waterEnv.foregroundOverlay).toBe('water_rough');

    // Dense Forest
    const forestEnv = getBattleEnvironment('dense_forest', false);
    expect(forestEnv.foregroundOverlay).toBe('grass_tall');

    // Meadow in tall grass vs short grass
    const meadowTall = getBattleEnvironment('meadow', false, true);
    expect(meadowTall.foregroundOverlay).toBe('grass_tall');

    const meadowShort = getBattleEnvironment('meadow', false, false);
    expect(meadowShort.foregroundOverlay).toBe('grass_field');

    // Dryland / Desert
    const dryEnv = getBattleEnvironment('dryland', false);
    expect(dryEnv.foregroundOverlay).toBe('sand_dunes');

    // Hill edge / Mountains
    const hillEnv = getBattleEnvironment('hill_edge', false);
    expect(hillEnv.foregroundOverlay).toBe('mountain_rocks');
  });

  it('updates screen shake deterministically with SeededBattleRng in BattleState', () => {
    const stateA = new BattleState(new SeededBattleRng(9999));
    const stateB = new BattleState(new SeededBattleRng(9999));

    stateA.screenShakeTimer = 5;
    stateA.screenShakeAmp = 4;
    stateB.screenShakeTimer = 5;
    stateB.screenShakeAmp = 4;

    stateA.updateTick();
    stateB.updateTick();

    expect(stateA.screenShakeX).toBe(stateB.screenShakeX);
    expect(stateA.screenShakeY).toBe(stateB.screenShakeY);
    expect(stateA.screenShakeAmp).toBe(stateB.screenShakeAmp);
  });

  it('maps battle statuses to the icon_statuses spritesheet frames', () => {
    expect(getBattleStatusIconFrame('sleep')).toEqual({ sx: 0, sy: 0, sw: 44, sh: 16 });
    expect(getBattleStatusIconFrame('poison')).toEqual({ sx: 0, sy: 16, sw: 44, sh: 16 });
    expect(getBattleStatusIconFrame('burn')).toEqual({ sx: 0, sy: 32, sw: 44, sh: 16 });
    expect(getBattleStatusIconFrame('paralysis')).toEqual({ sx: 0, sy: 48, sw: 44, sh: 16 });
    expect(getBattleStatusIconFrame('freeze')).toEqual({ sx: 0, sy: 64, sw: 44, sh: 16 });
    expect(getBattleStatusIconFrame('toxic')).toEqual({ sx: 0, sy: 80, sw: 44, sh: 16 });
    expect(getBattleStatusIconFrame('none')).toBeNull();
  });

  it('does not execute a move when its PP is exhausted', () => {
    const player = createBattler('PIKACHU', 10, true);
    const wild = createBattler('PIDGEY', 3, false);
    const engine = new BattleEngine(player, wild, getBattleEnvironment('meadow'));
    const move = { ...player.moves[0], pp: 0 };
    const initialHp = wild.currentHp;

    const result = engine.executeAttack(player, wild, move);

    expect(result.damage).toBe(0);
    expect(wild.currentHp).toBe(initialHp);
    expect(result.message).toContain('no PP left');
  });

  it('respects type immunities against status conditions', () => {
    const player = createBattler('PIKACHU', 20, true);
    const fireTarget = createBattler('CHARMANDER', 20, false);
    const electricTarget = createBattler('PIKACHU', 20, false);
    const poisonTarget = createBattler('BULBASAUR', 20, false); // Grass/Poison
    const engine = new BattleEngine(player, fireTarget, getBattleEnvironment('meadow'));

    // 1. Will-o-Wisp on Fire type
    const willOWisp: any = {
      id: 'will_o_wisp',
      name: 'Will-O-Wisp',
      type: 'Fire',
      category: 'status',
      power: 0,
      accuracy: 100,
      pp: 15,
      maxPp: 15,
      statusEffect: { condition: 'burn', target: 'opponent', chance: 1.0 },
    };
    const burnRes = engine.executeAttack(player, fireTarget, willOWisp);
    expect(fireTarget.status).toBe('none');
    expect(burnRes.message).toContain('Fire types cannot be burned');

    // 2. Thunder Wave on Electric type
    const thunderWave: any = {
      id: 'thunder_wave',
      name: 'Thunder Wave',
      type: 'Electric',
      category: 'status',
      power: 0,
      accuracy: 100,
      pp: 20,
      maxPp: 20,
      statusEffect: { condition: 'paralysis', target: 'opponent', chance: 1.0 },
    };
    const paraRes = engine.executeAttack(player, electricTarget, thunderWave);
    expect(electricTarget.status).toBe('none');
    expect(paraRes.message).toContain('Electric types cannot be paralyzed');

    // 3. Poison Powder on Poison type
    const poisonPowder: any = {
      id: 'poison_powder',
      name: 'Poison Powder',
      type: 'Poison',
      category: 'status',
      power: 0,
      accuracy: 100,
      pp: 35,
      maxPp: 35,
      statusEffect: { condition: 'poison', target: 'opponent', chance: 1.0 },
    };
    const psnRes = engine.executeAttack(player, poisonTarget, poisonPowder);
    expect(poisonTarget.status).toBe('none');
    expect(psnRes.message).toContain('does not affect this Pokémon');
  });

  it('correctly calculates end-turn damage for burn, poison, and toxic', () => {
    const battler = createBattler('BULBASAUR', 20, true);
    const dummy = createBattler('PIDGEY', 20, false);
    const engine = new BattleEngine(battler, dummy, getBattleEnvironment('meadow'));

    // 1. Burn damage (1/16 maxHp)
    battler.status = 'burn';
    const initialHp = battler.currentHp;
    const expectedBurnDmg = Math.max(1, Math.floor(battler.maxHp / 16));
    const burnResult = engine.applyEndTurnEffects(battler);
    expect(burnResult).not.toBeNull();
    expect(burnResult?.damage).toBe(expectedBurnDmg);
    expect(battler.currentHp).toBe(initialHp - expectedBurnDmg);

    // 2. Poison damage (1/8 maxHp)
    battler.status = 'poison';
    const hpBeforePsn = battler.currentHp;
    const expectedPsnDmg = Math.max(1, Math.floor(battler.maxHp / 8));
    const psnResult = engine.applyEndTurnEffects(battler);
    expect(psnResult?.damage).toBe(expectedPsnDmg);
    expect(battler.currentHp).toBe(hpBeforePsn - expectedPsnDmg);

    // 3. Toxic scaling damage (turn 1 = 1/16, turn 2 = 2/16)
    battler.status = 'toxic';
    battler.statusTurns = 0;
    const hpBeforeTox1 = battler.currentHp;
    const tox1Result = engine.applyEndTurnEffects(battler);
    const expectedTox1Dmg = Math.max(1, Math.floor((battler.maxHp * 1) / 16));
    expect(tox1Result?.damage).toBe(expectedTox1Dmg);
    expect(battler.statusTurns).toBe(1);

    const hpBeforeTox2 = battler.currentHp;
    const tox2Result = engine.applyEndTurnEffects(battler);
    const expectedTox2Dmg = Math.max(1, Math.floor((battler.maxHp * 2) / 16));
    expect(tox2Result?.damage).toBe(expectedTox2Dmg);
    expect(battler.statusTurns).toBe(2);
    expect(battler.currentHp).toBe(hpBeforeTox2 - expectedTox2Dmg);
  });

  it('applies secondary status effects on damaging moves', () => {
    const player = createBattler('CHARMANDER', 20, true);
    const wild = createBattler('PIDGEY', 20, false);
    const engine = new BattleEngine(
      player,
      wild,
      getBattleEnvironment('meadow'),
      new SeededBattleRng(42)
    );

    const flamethrower: any = {
      id: 'flamethrower',
      name: 'Flamethrower',
      type: 'Fire',
      category: 'special',
      power: 90,
      accuracy: 100,
      pp: 15,
      maxPp: 15,
      statusEffect: { condition: 'burn', target: 'opponent', chance: 1.0 }, // 100% chance test
    };

    const res = engine.executeAttack(player, wild, flamethrower);
    expect(wild.status).toBe('burn');
    expect(res.message).toContain('was inflicted with burn');
  });

  describe('Move Animation System & Category Differentiation', () => {
    it('differentiates physical, special, and status moves correctly', () => {
      const tackle: any = {
        id: 'TACKLE',
        name: 'Tackle',
        type: 'Normal',
        category: 'physical',
        power: 40,
        accuracy: 100,
        pp: 35,
        maxPp: 35,
      };

      const thunderbolt: any = {
        id: 'THUNDERBOLT',
        name: 'Thunderbolt',
        type: 'Electric',
        category: 'special',
        power: 90,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
      };

      const leer: any = {
        id: 'LEER',
        name: 'Leer',
        type: 'Normal',
        category: 'status',
        power: 0,
        accuracy: 100,
        pp: 30,
        maxPp: 30,
      };

      // 1. Physical: attacker lunges forward, defender reacts to hit
      const physPlan = moveAnimationManager.resolveAnimationPlan(tackle, true);
      expect(physPlan.category).toBe('physical');
      expect(physPlan.attackerLunges).toBe(true);
      expect(physPlan.defenderTakesHit).toBe(true);

      // 2. Special: attacker does NOT lunge forward, defender reacts to hit
      const specPlan = moveAnimationManager.resolveAnimationPlan(thunderbolt, true);
      expect(specPlan.category).toBe('special');
      expect(specPlan.attackerLunges).toBe(false);
      expect(specPlan.defenderTakesHit).toBe(true);

      // 3. Status: attacker does NOT lunge, defender does NOT take damage knockback
      const statPlan = moveAnimationManager.resolveAnimationPlan(leer, false);
      expect(statPlan.category).toBe('status');
      expect(statPlan.attackerLunges).toBe(false);
      expect(statPlan.defenderTakesHit).toBe(false);
    });

    it('supports extensible custom move animation overrides', () => {
      const customMgr = new MoveAnimationManager();

      const hyperBeam: any = {
        id: 'HYPERBEAM',
        name: 'Hyper Beam',
        type: 'Normal',
        category: 'special',
        power: 150,
        accuracy: 90,
        pp: 5,
        maxPp: 5,
      };

      // Register custom override for future custom animations
      customMgr.registerOverride('HYPERBEAM', {
        customAnimationId: 'BEAM_CHARGE_AND_BLAST',
        attackerLunges: false,
      });

      const plan = customMgr.resolveAnimationPlan(hyperBeam, true);
      expect(plan.customAnimationId).toBe('BEAM_CHARGE_AND_BLAST');
      expect(plan.attackerLunges).toBe(false);
      expect(plan.defenderTakesHit).toBe(true);
    });

    it('respects lunge toggle in BattleState update ticks', () => {
      const state = new BattleState(new SeededBattleRng(100));

      // Test 1: Physical lunge = true -> moves forward and back
      state.startPlayerAttack({ lunge: true });
      expect(state.playerLungeActive).toBe(true);
      for (let i = 0; i < 5; i++) state.updateTick();
      expect(state.playerLungeX).toBeGreaterThan(0);
      expect(state.playerLungeY).toBeLessThan(0);

      // Reset
      state.playerAttackTick = 0;
      state.playerLungeX = 0;
      state.playerLungeY = 0;

      // Test 2: Special/Status lunge = false -> stays strictly at (0, 0)
      let hitTriggered = false;
      state.startPlayerAttack({
        lunge: false,
        onHit: () => {
          hitTriggered = true;
        },
      });
      expect(state.playerLungeActive).toBe(false);
      for (let i = 0; i < 10; i++) {
        state.updateTick();
        expect(state.playerLungeX).toBe(0);
        expect(state.playerLungeY).toBe(0);
      }
      expect(hitTriggered).toBe(true);
    });

    it('accurately tracks stat stage boosts and debuffs on battlers', () => {
      const player = createBattler('CHARMANDER', 15, true);
      const enemy = createBattler('PIDGEY', 15, false);
      const engine = new BattleEngine(
        player,
        enemy,
        getBattleEnvironment('meadow'),
        new SeededBattleRng(99)
      );

      // 1. Move boosting self Attack (+2)
      const swordsDance: any = {
        id: 'SWORDSDANCE',
        name: 'Swords Dance',
        type: 'Normal',
        category: 'status',
        power: 0,
        accuracy: 100,
        pp: 20,
        maxPp: 20,
        statChanges: [{ stat: 'attack', stages: 2, target: 'self', chance: 1.0 }],
      };

      engine.executeAttack(player, enemy, swordsDance);
      expect(player.statStages?.attack).toBe(2);

      // 2. Move lowering opponent Defense (-1)
      const tailWhip: any = {
        id: 'TAILWHIP',
        name: 'Tail Whip',
        type: 'Normal',
        category: 'status',
        power: 0,
        accuracy: 100,
        pp: 30,
        maxPp: 30,
        statChanges: [{ stat: 'defense', stages: -1, target: 'opponent', chance: 1.0 }],
      };

      engine.executeAttack(player, enemy, tailWhip);
      expect(enemy.statStages?.defense).toBe(-1);

      // 3. Clamping test (-6 to +6)
      const maxBuff: any = {
        id: 'AGILITY',
        name: 'Agility',
        type: 'Psychic',
        category: 'status',
        power: 0,
        accuracy: 100,
        pp: 30,
        maxPp: 30,
        statChanges: [{ stat: 'speed', stages: 5, target: 'self', chance: 1.0 }],
      };
      engine.executeAttack(player, enemy, maxBuff);
      engine.executeAttack(player, enemy, maxBuff);
      expect(player.statStages?.speed).toBe(6); // clamped at 6
    });

    it('synchronizes battler HP and status in real-time with partyService', () => {
      const partyPk = createPartyPokemon('PIKACHU', 5);
      partyService.loadParty([partyPk]);

      const battler = partyPokemonToBattler(partyPk);
      const wild = createBattler('PIDGEY', 3, false);
      const engine = new BattleEngine(
        battler,
        wild,
        getBattleEnvironment('meadow'),
        new SeededBattleRng(1)
      );
      const state = new BattleState(engine.rng);
      const canvas: any = {
        addEventListener: () => {},
        removeEventListener: () => {},
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 512, height: 384 }),
      };

      const controller = new BattleController(state, engine, canvas, () => {});

      // 1. Simulate battler taking damage in battle -> syncs to party
      battler.currentHp = 10;
      (controller as any).syncActiveBattlerToParty();

      const updatedPartyPk = partyService.getPokemon(0);
      expect(updatedPartyPk?.currentHp).toBe(10);

      // 2. Simulate external heal in party screen -> syncs back to battle
      partyService.healPokemon(0, 5);
      expect(battler.currentHp).toBe(15);
      expect(state.targetPlayerHpPct).toBe(15 / battler.maxHp);

      controller.destroy();
    });

    it('correctly handles healing moves, full HP validation, and Rest mechanics', () => {
      const player = createBattler('PIKACHU', 10, true);
      const enemy = createBattler('PIDGEY', 10, false);
      const engine = new BattleEngine(player, enemy, getBattleEnvironment('meadow'));

      const recoverMove: any = {
        id: 'recover',
        name: 'Recover',
        type: 'Normal',
        category: 'status',
        power: 0,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        healPercent: 0.5,
      };

      // 1. Recover fails/notifies when already full HP
      player.currentHp = player.maxHp;
      const resFull = engine.executeAttack(player, enemy, recoverMove);
      expect(resFull.message).toContain('is already full');
      expect(player.currentHp).toBe(player.maxHp);

      // 2. Recover heals 50% HP when injured
      player.currentHp = 10;
      const resInjured = engine.executeAttack(player, enemy, recoverMove);
      expect(resInjured.message).toContain('restored its HP');
      expect(player.currentHp).toBe(10 + Math.floor(player.maxHp * 0.5));

      // 3. Rest move fails when full HP
      const restMove: any = {
        id: 'rest',
        name: 'Rest',
        type: 'Psychic',
        category: 'status',
        power: 0,
        accuracy: 100,
        pp: 5,
        maxPp: 5,
        healPercent: 1.0,
      };
      player.currentHp = player.maxHp;
      const resRestFull = engine.executeAttack(player, enemy, restMove);
      expect(resRestFull.message).toContain('is already full');

      // 4. Rest cures prior burn status, heals to max HP, and inflicts 2 turns sleep
      player.currentHp = 5;
      player.status = 'burn';
      player.statusTurns = 2;
      const resRestInjured = engine.executeAttack(player, enemy, restMove);
      expect(resRestInjured.message).toContain('slept and became healthy');
      expect(player.currentHp).toBe(player.maxHp);
      expect(player.status).toBe('sleep');
      expect(player.sleepTurns).toBe(2);
    });

    it('processes damaging drain moves and restores attacker HP based on damage dealt', () => {
      const player = createBattler('BULBASAUR', 15, true);
      const enemy = createBattler('GEODUDE', 10, false);
      const engine = new BattleEngine(player, enemy, getBattleEnvironment('meadow'));

      const gigaDrain: any = {
        id: 'giga_drain',
        name: 'Giga Drain',
        type: 'Grass',
        category: 'special',
        power: 75,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        drainPercent: 0.5,
      };

      player.currentHp = 10; // Injured attacker
      const initialHp = player.currentHp;
      const res = engine.executeAttack(player, enemy, gigaDrain);

      expect(res.damage).toBeGreaterThan(0);
      expect(res.message).toContain('had its energy drained');
      const expectedDrain = Math.max(1, Math.floor(res.damage * 0.5));
      expect(player.currentHp).toBe(Math.min(player.maxHp, initialHp + expectedDrain));
    });

    it('processes damaging recoil moves and deals recoil damage to attacker', () => {
      const player = createBattler('TAUROS', 20, true);
      const enemy = createBattler('SNORLAX', 20, false);
      const engine = new BattleEngine(player, enemy, getBattleEnvironment('meadow'));

      const takeDown: any = {
        id: 'take_down',
        name: 'Take Down',
        type: 'Normal',
        category: 'physical',
        power: 90,
        accuracy: 85,
        pp: 20,
        maxPp: 20,
        recoilPercent: 0.25,
      };

      player.currentHp = player.maxHp;
      const res = engine.executeAttack(player, enemy, takeDown);

      expect(res.damage).toBeGreaterThan(0);
      expect(res.message).toContain('is hit with recoil');
      const expectedRecoil = Math.max(1, Math.floor(res.damage * 0.25));
      expect(player.currentHp).toBe(player.maxHp - expectedRecoil);
    });

    it('triggers secondary status effects on damaging moves with type immunity checks', () => {
      // Flamethrower on Grass vs Flamethrower on Fire type
      const player = createBattler('CHARIZARD', 20, true);
      const grassEnemy = createBattler('BULBASAUR', 50, false);
      const fireEnemy = createBattler('CHARMANDER', 50, false);
      grassEnemy.currentHp = grassEnemy.maxHp = 500;
      fireEnemy.currentHp = fireEnemy.maxHp = 500;
      const engine = new BattleEngine(player, grassEnemy, getBattleEnvironment('meadow'));

      const flameMove: any = {
        id: 'flamethrower',
        name: 'Flamethrower',
        type: 'Fire',
        category: 'special',
        power: 90,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
        statusEffect: { condition: 'burn', target: 'opponent', chance: 1.0 },
      };

      // Grass enemy gets burned when surviving the hit
      const resBurn = engine.executeAttack(player, grassEnemy, flameMove);
      expect(resBurn.message).toContain('was inflicted with burn');
      expect(grassEnemy.status).toBe('burn');

      // Fire enemy is immune to burn
      const resImmune = engine.executeAttack(player, fireEnemy, flameMove);
      expect(fireEnemy.status).toBe('none');
      expect(resImmune.message).not.toContain('was inflicted with burn');
    });

    it('smoothly animates HP recovery upward and keeps ghost bar synchronized', () => {
      const state = new BattleState();
      // Simulate damaged state (HP at 20%)
      state.playerHpPct = 0.2;
      state.targetPlayerHpPct = 0.2;
      state.ghostPlayerHpPct = 0.2;

      // Now heal to 80% (target goes up)
      state.targetPlayerHpPct = 0.8;
      expect(state.playerHpPct).toBe(0.2);

      // Advance frames
      for (let i = 0; i < 20; i++) {
        state.update();
      }

      // playerHpPct must have increased smoothly towards target (not stuck at 0.2)
      expect(state.playerHpPct).toBeGreaterThan(0.2);
      expect(state.playerHpPct).toBeLessThanOrEqual(0.8);
      // ghost bar must stay at least equal to playerHpPct when healing
      expect(state.ghostPlayerHpPct).toBeGreaterThanOrEqual(state.playerHpPct);

      // Advance remaining frames until fully recovered
      for (let i = 0; i < 60; i++) {
        state.update();
      }
      expect(state.playerHpPct).toBeCloseTo(0.8, 2);
      expect(state.ghostPlayerHpPct).toBeCloseTo(0.8, 2);
    });

    it('verifies all 26 Pokéball definitions, normalization, and asset paths', () => {
      const allBallIds = Object.keys(POKEBALL_DB);
      expect(allBallIds.length).toBe(26);

      for (const ballId of allBallIds) {
        const data = getPokeballData(ballId);
        expect(data).toBeDefined();
        expect(data?.id).toBe(ballId);
        expect(data?.name).toBeTruthy();
        expect(data?.nameVi).toBeTruthy();
        expect(data?.catchRate).toBeGreaterThan(0);

        // Normalize checks
        const normalized = normalizeBallKey(ballId);
        expect(normalized).toBe(ballId);

        // Asset resolvers
        const flying = BATTLE_ASSETS.getBall(ballId);
        const open = BATTLE_ASSETS.getBallOpen(ballId);
        const closed = BATTLE_ASSETS.getBallClosed(ballId);

        expect(flying).toContain(`ball_${ballId}.png`);
        expect(open).toContain(`ball_${ballId}_open.png`);
        expect(closed).toContain(`ball_${ballId}_closed.png`);
      }
    });

    it('properly resets captureZooming and captureAlpha on failed capture and startBallThrow', () => {
      const state = new BattleState();

      // 1. Simulate state during capture zoom
      state.startBallThrow('POKEBALL');
      expect(state.isThrowingBall).toBe(true);
      expect(state.captureZooming).toBe(false);
      expect(state.captureZoomProgress).toBe(0);

      // Advance frames until ball reaches enemy and triggers zoom
      state.ballThrowTick = 26;
      state.update();
      expect(state.captureZooming).toBe(true);

      state.update();
      expect(state.captureZoomProgress).toBeGreaterThan(0);

      // Advance frames while zooming
      for (let i = 0; i < 20; i++) {
        state.update();
      }
      expect(state.captureZoomProgress).toBeGreaterThan(0.5);

      // Simulate failed capture: zooming becomes false and smoothly zooms out
      state.isThrowingBall = false;
      state.captureAlpha = 1.0;
      state.captureZooming = false;

      for (let i = 0; i < 30; i++) {
        state.update();
      }
      expect(state.captureZoomProgress).toBe(0);
      expect(state.captureAlpha).toBe(1.0);
      expect(state.isThrowingBall).toBe(false);

      // 2. Next throw starts cleanly with zoom reset
      state.startBallThrow('GREATBALL');
      expect(state.captureZooming).toBe(false);
      expect(state.captureZoomProgress).toBe(0);
    });

    it('slides both enemy and player HTML databoxes out to the edges during capture zoom and back in on reset', () => {
      const mockEl = () => ({
        style: {} as any,
        className: '',
        textContent: '',
        appendChild: () => {},
      });
      const originalDoc = (globalThis as any).document;
      (globalThis as any).document = {
        createElement: () => mockEl(),
      };

      try {
        const container: any = mockEl();
        const overlay = new BattleTextOverlay(container);
        const player = createBattler('PIKACHU', 10, true);
        const enemy = createBattler('PIDGEY', 10, false);
        const engine = new BattleEngine(player, enemy, getBattleEnvironment('meadow'));
        const state = new BattleState();

        // Normal state: databoxes fully slid in
        state.enemyDataboxProgress = 1.0;
        state.playerDataboxProgress = 1.0;
        state.captureZoomProgress = 0;
        overlay.update(state, engine);

        const enemyBox = (overlay as any).enemyBox;
        const playerBox = (overlay as any).playerBox;

        expect(enemyBox.style.transform).toBe('translateX(0.00%)');
        expect(playerBox.style.transform).toBe('translateX(0.00%)');

        // Zooming in: databoxes slide out to edges
        state.captureZoomProgress = 1.0;
        overlay.update(state, engine);

        expect(enemyBox.style.transform).toBe('translateX(-130.00%)');
        expect(playerBox.style.transform).toBe('translateX(130.00%)');

        // Zoom reset: databoxes slide back into view
        state.captureZoomProgress = 0;
        overlay.update(state, engine);

        expect(enemyBox.style.transform).toBe('translateX(0.00%)');
        expect(playerBox.style.transform).toBe('translateX(0.00%)');
      } finally {
        (globalThis as any).document = originalDoc;
      }
    });

    it('triggers onBallHit, onBallCapture, and onBallDrop callbacks during capture animation ticks', () => {
      const state = new BattleState();
      let hitTriggered = false;
      let captureTriggered = false;
      let dropTriggered = false;

      state.onBallHit = () => {
        hitTriggered = true;
      };
      state.onBallCapture = () => {
        captureTriggered = true;
      };
      state.onBallDrop = () => {
        dropTriggered = true;
      };

      state.startBallThrow('POKEBALL');
      expect(state.ballThrowPhase).toBe('throwing');

      // Tick 26 frames for throwing phase
      for (let i = 0; i < 26; i++) {
        state.updateTick();
      }
      expect(hitTriggered).toBe(true);
      expect(state.ballThrowPhase).toBe('opening');

      // Tick 8 frames for opening phase
      for (let i = 0; i < 8; i++) {
        state.updateTick();
      }
      expect(captureTriggered).toBe(true);
      expect(state.ballThrowPhase).toBe('capturing');

      // Tick 30 frames for capturing phase
      for (let i = 0; i < 30; i++) {
        state.updateTick();
      }
      expect(dropTriggered).toBe(true);
      expect(state.ballThrowPhase).toBe('falling');
    });

    it('handles battle sound effects safely in headless or non-browser test environment', () => {
      expect(() => {
        battleSePlayer.playBallThrow();
        battleSePlayer.playBallThrow(true);
        battleSePlayer.playBallHit();
        battleSePlayer.playJumpToBall();
        battleSePlayer.playBallDrop();
        battleSePlayer.playBallShake();
        battleSePlayer.playCatchSuccess();
        battleSePlayer.playBallBreak();
      }).not.toThrow();

      battleSePlayer.setVolume(0.5);
      expect(battleSePlayer.getVolume()).toBe(0.5);
    });
  });
});
