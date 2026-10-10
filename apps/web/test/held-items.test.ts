import { describe, it, expect, beforeEach } from 'vitest';
import { HeldItemEngine } from '../src/battle/rules/held-item-engine';
import { calculateEffectiveSpeed } from '../src/battle/rules/turn-order';
import { calculateDamage } from '../src/battle/rules/damage-calculator';
import { checkPreTurnStatus, processEndTurnEffects } from '../src/battle/rules/status-engine';
import { defaultBattleRng } from '../src/battle/battle-rng';
import { createPartyPokemon, partyPokemonToBattler } from '../src/domain/party/party-state';
import { partyService } from '../src/domain/party/party-service';
import { inventoryService } from '../src/domain/inventory/inventory-service';
import type { BattlerPokemon, BattleMove } from '../src/battle/types';

describe('Held Item System (Trang bị & Vận hành vật phẩm Pokémon)', () => {
  beforeEach(() => {
    partyService.reset();
    inventoryService.reset();
  });

  describe('1. Equipping, Taking & Syncing Held Items', () => {
    it('transmits heldItem from PartyPokemon to BattlerPokemon and syncs back after battle', () => {
      const pk = createPartyPokemon('PIKACHU', 25, { heldItem: 'oran-berry' });
      expect(pk.heldItem).toBe('oran-berry');

      const battler = partyPokemonToBattler(pk);
      expect(battler.heldItem).toBe('oran-berry');

      // Simulate consuming the berry in battle
      battler.heldItem = null;

      // Sync battle result back
      partyService.addPokemon(pk);
      partyService.syncBattleResult(battler, 0);

      const updatedPk = partyService.getParty()[1]; // index 0 is starter, index 1 is added
      expect(updatedPk.heldItem).toBeNull();
    });

    it('correctly adds and returns held items to and from player inventory', () => {
      inventoryService.addItem('leftovers', 1);
      expect(inventoryService.getItemCount('leftovers')).toBe(1);

      const pk = partyService.getParty()[0];
      // Give item
      inventoryService.removeItem('leftovers', 1);
      pk.heldItem = 'leftovers';
      expect(pk.heldItem).toBe('leftovers');
      expect(inventoryService.getItemCount('leftovers')).toBe(0);

      // Take item back
      inventoryService.addItem(pk.heldItem, 1);
      pk.heldItem = null;
      expect(pk.heldItem).toBeNull();
      expect(inventoryService.getItemCount('leftovers')).toBe(1);
    });
  });

  describe('2. Pinch Berries (HP Triggered at <= 50% max HP)', () => {
    const makeBattler = (hp: number, maxHp: number, heldItem: string): BattlerPokemon => ({
      id: 25,
      name: 'Pikachu',
      speciesKey: 'PIKACHU',
      types: ['Electric'],
      level: 20,
      currentHp: hp,
      maxHp,
      stats: {
        hp: maxHp,
        attack: 50,
        defense: 40,
        spAtk: 50,
        spDef: 50,
        speed: 90,
        total: maxHp + 280,
      },
      moves: [],
      frontSprite: '',
      backSprite: '',
      iconSprite: '',
      gender: 'male',
      isFainted: false,
      catchRate: 190,
      exp: 100,
      maxExp: 200,
      heldItem,
    });

    it('consumes Oran Berry when HP drops to <= 50% and heals 10 HP', () => {
      const battler = makeBattler(20, 50, 'oran-berry');
      const events = HeldItemEngine.checkHpTriggeredBerry(battler, 'player');

      expect(events.length).toBe(1);
      expect(events[0].type).toBe('hp_restored');
      expect(battler.currentHp).toBe(30); // 20 + 10
      expect(battler.heldItem).toBeNull(); // Consumed!
    });

    it('consumes Sitrus Berry when HP drops to <= 50% and heals 25% max HP', () => {
      const battler = makeBattler(40, 100, 'sitrus-berry');
      const events = HeldItemEngine.checkHpTriggeredBerry(battler, 'player');

      expect(events.length).toBe(1);
      expect(battler.currentHp).toBe(65); // 40 + 25
      expect(battler.heldItem).toBeNull();
    });

    it('does not trigger berry when HP > 50%', () => {
      const battler = makeBattler(45, 50, 'oran-berry');
      const events = HeldItemEngine.checkHpTriggeredBerry(battler, 'player');

      expect(events.length).toBe(0);
      expect(battler.currentHp).toBe(45);
      expect(battler.heldItem).toBe('oran-berry'); // Untouched
    });
  });

  describe('3. Status Curing Berries', () => {
    const makeStatusBattler = (status: any, heldItem: string): BattlerPokemon => ({
      id: 25,
      name: 'Pikachu',
      speciesKey: 'PIKACHU',
      types: ['Electric'],
      level: 20,
      currentHp: 50,
      maxHp: 50,
      stats: { hp: 50, attack: 50, defense: 40, spAtk: 50, spDef: 50, speed: 90, total: 330 },
      moves: [],
      frontSprite: '',
      backSprite: '',
      iconSprite: '',
      gender: 'male',
      isFainted: false,
      catchRate: 190,
      exp: 100,
      maxExp: 200,
      status,
      heldItem,
    });

    it('Cheri Berry cures paralysis', () => {
      const battler = makeStatusBattler('paralysis', 'cheri-berry');
      const result = checkPreTurnStatus(battler, 'player', defaultBattleRng);

      expect(battler.status).toBe('none');
      expect(battler.heldItem).toBeNull();
      expect(result.events.some((e) => e.type === 'status_cured')).toBe(true);
      expect(result.canAct).toBe(true);
    });

    it('Lum Berry cures any status condition (e.g. sleep)', () => {
      const battler = makeStatusBattler('sleep', 'lum-berry');
      const result = checkPreTurnStatus(battler, 'player', defaultBattleRng);

      expect(battler.status).toBe('none');
      expect(battler.heldItem).toBeNull();
      expect(result.canAct).toBe(true);
    });
  });

  describe('4. End-of-Turn Held Items', () => {
    it('Leftovers heals 1/16 max HP every turn without being consumed', () => {
      const battler: BattlerPokemon = {
        id: 143,
        name: 'Snorlax',
        speciesKey: 'SNORLAX',
        types: ['Normal'],
        level: 50,
        currentHp: 100,
        maxHp: 160,
        stats: { hp: 160, attack: 110, defense: 65, spAtk: 65, spDef: 110, speed: 30, total: 540 },
        moves: [],
        frontSprite: '',
        backSprite: '',
        iconSprite: '',
        gender: 'male',
        isFainted: false,
        catchRate: 25,
        exp: 100,
        maxExp: 200,
        heldItem: 'leftovers',
      };

      const result = processEndTurnEffects(battler, 'player');
      expect(result).not.toBeNull();
      expect(battler.currentHp).toBe(110); // 100 + 160/16
      expect(battler.heldItem).toBe('leftovers'); // NOT consumed!
    });

    it('Black Sludge heals Poison-types but damages non-Poison types', () => {
      // Poison-type
      const gengar: BattlerPokemon = {
        id: 94,
        name: 'Gengar',
        speciesKey: 'GENGAR',
        types: ['Ghost', 'Poison'],
        level: 50,
        currentHp: 100,
        maxHp: 160,
        stats: { hp: 160, attack: 65, defense: 60, spAtk: 130, spDef: 75, speed: 110, total: 600 },
        moves: [],
        frontSprite: '',
        backSprite: '',
        iconSprite: '',
        gender: 'male',
        isFainted: false,
        catchRate: 45,
        exp: 100,
        maxExp: 200,
        heldItem: 'black-sludge',
      };
      processEndTurnEffects(gengar, 'player');
      expect(gengar.currentHp).toBe(110);

      // Non-Poison type
      const pikachu: BattlerPokemon = {
        id: 25,
        name: 'Pikachu',
        speciesKey: 'PIKACHU',
        types: ['Electric'],
        level: 50,
        currentHp: 100,
        maxHp: 160,
        stats: { hp: 160, attack: 55, defense: 40, spAtk: 50, spDef: 50, speed: 90, total: 445 },
        moves: [],
        frontSprite: '',
        backSprite: '',
        iconSprite: '',
        gender: 'male',
        isFainted: false,
        catchRate: 190,
        exp: 100,
        maxExp: 200,
        heldItem: 'black-sludge',
      };
      processEndTurnEffects(pikachu, 'player');
      expect(pikachu.currentHp).toBe(80); // 100 - 160/8
    });
  });

  describe('5. Stat & Damage Modifiers', () => {
    it('Choice Scarf multiplies speed by 1.5 in calculateEffectiveSpeed', () => {
      const normalBattler: BattlerPokemon = {
        id: 25,
        name: 'Pikachu',
        speciesKey: 'PIKACHU',
        types: ['Electric'],
        level: 50,
        currentHp: 100,
        maxHp: 100,
        stats: { hp: 100, attack: 55, defense: 40, spAtk: 50, spDef: 50, speed: 100, total: 395 },
        moves: [],
        frontSprite: '',
        backSprite: '',
        iconSprite: '',
        gender: 'male',
        isFainted: false,
        catchRate: 190,
        exp: 100,
        maxExp: 200,
      };

      const scarfBattler = { ...normalBattler, heldItem: 'choice-scarf' };

      expect(calculateEffectiveSpeed(normalBattler)).toBe(100);
      expect(calculateEffectiveSpeed(scarfBattler)).toBe(150);
    });

    it('Charcoal increases Fire-type move damage by 20%', () => {
      const attacker: BattlerPokemon = {
        id: 6,
        name: 'Charizard',
        speciesKey: 'CHARIZARD',
        types: ['Fire', 'Flying'],
        level: 50,
        currentHp: 150,
        maxHp: 150,
        stats: { hp: 150, attack: 84, defense: 78, spAtk: 109, spDef: 85, speed: 100, total: 606 },
        moves: [],
        frontSprite: '',
        backSprite: '',
        iconSprite: '',
        gender: 'male',
        isFainted: false,
        catchRate: 45,
        exp: 100,
        maxExp: 200,
      };

      const defender: BattlerPokemon = {
        id: 1,
        name: 'Bulbasaur',
        speciesKey: 'BULBASAUR',
        types: ['Grass', 'Poison'],
        level: 50,
        currentHp: 200,
        maxHp: 200,
        stats: { hp: 200, attack: 49, defense: 49, spAtk: 65, spDef: 65, speed: 45, total: 473 },
        moves: [],
        frontSprite: '',
        backSprite: '',
        iconSprite: '',
        gender: 'male',
        isFainted: false,
        catchRate: 45,
        exp: 100,
        maxExp: 200,
      };

      const fireMove: BattleMove = {
        id: 'flamethrower',
        name: 'Flamethrower',
        type: 'Fire',
        category: 'special',
        power: 90,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
        description: '',
      };

      const normalDmg = calculateDamage(attacker, defender, fireMove, defaultBattleRng).damage;
      attacker.heldItem = 'charcoal';
      const boostedDmg = calculateDamage(attacker, defender, fireMove, defaultBattleRng).damage;

      expect(boostedDmg).toBeGreaterThan(normalDmg);
      expect(HeldItemEngine.getDamageMultiplier(attacker, defender, fireMove, 2.0)).toBe(1.2);
    });

    it('Life Orb boosts damage by 1.3x', () => {
      const attacker: BattlerPokemon = {
        id: 25,
        name: 'Pikachu',
        speciesKey: 'PIKACHU',
        types: ['Electric'],
        level: 50,
        currentHp: 100,
        maxHp: 100,
        stats: { hp: 100, attack: 55, defense: 40, spAtk: 50, spDef: 50, speed: 90, total: 385 },
        moves: [],
        frontSprite: '',
        backSprite: '',
        iconSprite: '',
        gender: 'male',
        isFainted: false,
        catchRate: 190,
        exp: 100,
        maxExp: 200,
        heldItem: 'life-orb',
      };
      const dummyMove: BattleMove = {
        id: 'tackle',
        name: 'Tackle',
        type: 'Normal',
        category: 'physical',
        power: 40,
        accuracy: 100,
        pp: 35,
        maxPp: 35,
        description: '',
      };

      expect(HeldItemEngine.getDamageMultiplier(attacker, attacker, dummyMove, 1.0)).toBe(1.3);
    });
  });

  describe('6. Defensive & Counter Items', () => {
    it('Focus Sash survives lethal blow with 1 HP when at 100% max HP and is consumed', () => {
      const defender: BattlerPokemon = {
        id: 25,
        name: 'Pikachu',
        speciesKey: 'PIKACHU',
        types: ['Electric'],
        level: 50,
        currentHp: 100,
        maxHp: 100,
        stats: { hp: 100, attack: 55, defense: 40, spAtk: 50, spDef: 50, speed: 90, total: 385 },
        moves: [],
        frontSprite: '',
        backSprite: '',
        iconSprite: '',
        gender: 'male',
        isFainted: false,
        catchRate: 190,
        exp: 100,
        maxExp: 200,
        heldItem: 'focus-sash',
      };

      const lethalDamage = 350;
      const sashCheck = HeldItemEngine.checkFocusSash(defender, lethalDamage);

      expect(sashCheck.triggered).toBe(true);
      expect(sashCheck.damage).toBe(99); // Leaves with 1 HP (100 - 99 = 1)
      expect(defender.heldItem).toBeNull(); // Consumed!
    });

    it('Focus Sash does NOT trigger if defender is not at full HP', () => {
      const defender: BattlerPokemon = {
        id: 25,
        name: 'Pikachu',
        speciesKey: 'PIKACHU',
        types: ['Electric'],
        level: 50,
        currentHp: 90, // Not full!
        maxHp: 100,
        stats: { hp: 100, attack: 55, defense: 40, spAtk: 50, spDef: 50, speed: 90, total: 385 },
        moves: [],
        frontSprite: '',
        backSprite: '',
        iconSprite: '',
        gender: 'male',
        isFainted: false,
        catchRate: 190,
        exp: 100,
        maxExp: 200,
        heldItem: 'focus-sash',
      };

      const sashCheck = HeldItemEngine.checkFocusSash(defender, 120);
      expect(sashCheck.triggered).toBe(false);
      expect(sashCheck.damage).toBe(120);
      expect(defender.heldItem).toBe('focus-sash');
    });

    it('Rocky Helmet deals 1/6 max HP damage to physical attacker', () => {
      const attacker: BattlerPokemon = {
        id: 25,
        name: 'Pikachu',
        speciesKey: 'PIKACHU',
        types: ['Electric'],
        level: 50,
        currentHp: 120,
        maxHp: 120,
        stats: { hp: 120, attack: 55, defense: 40, spAtk: 50, spDef: 50, speed: 90, total: 405 },
        moves: [],
        frontSprite: '',
        backSprite: '',
        iconSprite: '',
        gender: 'male',
        isFainted: false,
        catchRate: 190,
        exp: 100,
        maxExp: 200,
      };

      const defender: BattlerPokemon = {
        id: 91,
        name: 'Cloyster',
        speciesKey: 'CLOYSTER',
        types: ['Water', 'Ice'],
        level: 50,
        currentHp: 120,
        maxHp: 120,
        stats: { hp: 120, attack: 95, defense: 180, spAtk: 85, spDef: 45, speed: 70, total: 595 },
        moves: [],
        frontSprite: '',
        backSprite: '',
        iconSprite: '',
        gender: 'male',
        isFainted: false,
        catchRate: 60,
        exp: 100,
        maxExp: 200,
        heldItem: 'rocky-helmet',
      };

      const physicalMove: BattleMove = {
        id: 'slam',
        name: 'Slam',
        type: 'Normal',
        category: 'physical',
        power: 80,
        accuracy: 75,
        pp: 20,
        maxPp: 20,
        description: '',
      };

      const events = HeldItemEngine.checkPostAttackEffects(
        attacker,
        'player',
        defender,
        'enemy',
        physicalMove,
        30
      );

      expect(events.length).toBe(1);
      expect(events[0].type).toBe('recoil_damage');
      expect(attacker.currentHp).toBe(100); // 120 - 120/6 = 100
    });
  });

  describe('7. Experience Boost (Lucky Egg)', () => {
    it('Lucky Egg provides 1.5x EXP multiplier', () => {
      const normalBattler = { heldItem: null } as unknown as BattlerPokemon;
      const eggBattler = { heldItem: 'lucky-egg' } as unknown as BattlerPokemon;

      expect(HeldItemEngine.getExpMultiplier(normalBattler)).toBe(1.0);
      expect(HeldItemEngine.getExpMultiplier(eggBattler)).toBe(1.5);
    });
  });

  describe('8. PartyService giveHeldItem and removeHeldItem with notifications', () => {
    it('gives held item, notifies subscribers, and returns old held item', () => {
      let notified = false;
      const unsubscribe = partyService.subscribe(() => {
        notified = true;
      });

      const firstPk = partyService.getPokemon(0);
      expect(firstPk).not.toBeNull();

      // Give Oran berry
      const res1 = partyService.giveHeldItem(0, 'oran-berry');
      expect(res1.success).toBe(true);
      expect(res1.returnedItem).toBeNull();
      expect(partyService.getPokemon(0)?.heldItem).toBe('oran-berry');
      expect(notified).toBe(true);

      // Give Sitrus berry (should return oran-berry)
      notified = false;
      const res2 = partyService.giveHeldItem(0, 'sitrus-berry');
      expect(res2.success).toBe(true);
      expect(res2.returnedItem).toBe('oran-berry');
      expect(partyService.getPokemon(0)?.heldItem).toBe('sitrus-berry');
      expect(notified).toBe(true);

      // Remove held item
      notified = false;
      const removed = partyService.removeHeldItem(0);
      expect(removed).toBe('sitrus-berry');
      expect(partyService.getPokemon(0)?.heldItem).toBeNull();
      expect(notified).toBe(true);

      unsubscribe();
    });
  });

  describe('9. Item Classification: Holdable vs Usable Items (Lọc & Phân loại vật phẩm)', () => {
    it('accurately identifies holdable items (equipment, berries, trade items)', async () => {
      const { findItem, isHoldableItem } = await import('../src/data/items-db');

      // Hold items
      expect(isHoldableItem(findItem('leftovers'))).toBe(true);
      expect(isHoldableItem(findItem('choice-band'))).toBe(true);
      expect(isHoldableItem(findItem('focus-sash'))).toBe(true);
      expect(isHoldableItem(findItem('rocky-helmet'))).toBe(true);
      expect(isHoldableItem(findItem('lucky-egg'))).toBe(true);
      expect(isHoldableItem(findItem('charcoal'))).toBe(true);

      // Berries
      expect(isHoldableItem(findItem('oran-berry'))).toBe(true);
      expect(isHoldableItem(findItem('sitrus-berry'))).toBe(true);
      expect(isHoldableItem(findItem('lum-berry'))).toBe(true);

      // Trade held items
      expect(isHoldableItem(findItem('dragon-scale'))).toBe(true);
      expect(isHoldableItem(findItem('electirizer'))).toBe(true);

      // Non-holdable: Medicine
      expect(isHoldableItem(findItem('potion'))).toBe(false);
      expect(isHoldableItem(findItem('super-potion'))).toBe(false);
      expect(isHoldableItem(findItem('revive'))).toBe(false);
      expect(isHoldableItem(findItem('rare-candy'))).toBe(false);

      // Non-holdable: Poké Balls
      expect(isHoldableItem(findItem('poke-ball'))).toBe(false);
      expect(isHoldableItem(findItem('ultra-ball'))).toBe(false);

      // Non-holdable: Key Items
      expect(isHoldableItem(findItem('bicycle'))).toBe(false);
      expect(isHoldableItem(findItem('town-map'))).toBe(false);

      // Non-holdable: Battle items
      expect(isHoldableItem(findItem('x-attack'))).toBe(false);
      expect(isHoldableItem(findItem('dire-hit'))).toBe(false);
    });

    it('accurately identifies usable items and distinguishes them from pure equipment', async () => {
      const { findItem, isUsableItem, getItemUsageType } = await import('../src/data/items-db');

      // Usable: Medicine
      expect(isUsableItem(findItem('potion'))).toBe(true);
      expect(isUsableItem(findItem('revive'))).toBe(true);
      expect(isUsableItem(findItem('rare-candy'))).toBe(true);

      // Usable: Berries
      expect(isUsableItem(findItem('oran-berry'))).toBe(true);

      // Usable: Battle & Balls
      expect(isUsableItem(findItem('poke-ball'))).toBe(true);
      expect(isUsableItem(findItem('x-attack'))).toBe(true);

      // NOT usable directly: pure equipment
      expect(isUsableItem(findItem('leftovers'))).toBe(false);
      expect(isUsableItem(findItem('choice-band'))).toBe(false);
      expect(isUsableItem(findItem('focus-sash'))).toBe(false);
      expect(isUsableItem(findItem('rocky-helmet'))).toBe(false);
      expect(isUsableItem(findItem('lucky-egg'))).toBe(false);

      // Usage type classification
      expect(getItemUsageType(findItem('oran-berry'))).toBe('both');
      expect(getItemUsageType(findItem('leftovers'))).toBe('hold_only');
      expect(getItemUsageType(findItem('potion'))).toBe('use_only');
      expect(getItemUsageType(findItem('poke-ball'))).toBe('use_only');
      expect(getItemUsageType(findItem('nugget'))).toBe('none');
    });
  });

  describe('10. Held Item Activation Dialogues & Messages (Thoại & Thông điệp vật phẩm khi kích hoạt)', () => {
    const makeBattler = (
      name: string,
      speciesKey: string,
      types: any[],
      hp: number,
      maxHp: number,
      heldItem?: string | null
    ): BattlerPokemon => ({
      id: 1,
      name,
      speciesKey,
      types,
      level: 50,
      currentHp: hp,
      maxHp,
      stats: {
        hp: maxHp,
        attack: 100,
        defense: 100,
        spAtk: 100,
        spDef: 100,
        speed: 100,
        total: maxHp + 500,
      },
      moves: [],
      frontSprite: '',
      backSprite: '',
      iconSprite: '',
      gender: 'male',
      isFainted: false,
      catchRate: 45,
      exp: 100,
      maxExp: 200,
      heldItem: heldItem ?? null,
    });

    it('emits precise healing dialogue for Leftovers with exact HP number', () => {
      const snorlax = makeBattler('Snorlax', 'SNORLAX', ['Normal'], 140, 160, 'leftovers');
      const res = processEndTurnEffects(snorlax, 'player');

      expect(res).not.toBeNull();
      expect(res?.message).toContain('Snorlax hồi phục 10 HP nhờ [Thức Ăn Thừa]!');
      expect(res?.events.some((e) => e.message?.includes('10 HP'))).toBe(true);
    });

    it('emits precise dialogues for Black Sludge (heal for Poison, damage for non-Poison)', () => {
      const gengar = makeBattler('Gengar', 'GENGAR', ['Ghost', 'Poison'], 100, 160, 'black-sludge');
      const resGengar = processEndTurnEffects(gengar, 'player');
      expect(resGengar?.message).toContain('Gengar hồi phục 10 HP nhờ [Bùn Đen]!');

      const pikachu = makeBattler('Pikachu', 'PIKACHU', ['Electric'], 100, 160, 'black-sludge');
      const resPikachu = processEndTurnEffects(pikachu, 'player');
      expect(resPikachu?.message).toContain('Pikachu bị tổn thương 20 HP bởi [Bùn Đen]!');
    });

    it('emits end-of-turn affliction dialogues for Flame Orb and Toxic Orb', () => {
      const ursaring = makeBattler('Ursaring', 'URSARING', ['Normal'], 100, 100, 'flame-orb');
      ursaring.status = 'none';
      const resFlame = processEndTurnEffects(ursaring, 'player');
      expect(resFlame?.message).toContain('Ursaring bị bỏng bởi [Quả Cầu Lửa]!');
      expect(ursaring.status).toBe('burn');

      const gliscor = makeBattler(
        'Gliscor',
        'GLISCOR',
        ['Ground', 'Flying'],
        100,
        100,
        'toxic-orb'
      );
      gliscor.status = 'none';
      const resToxic = processEndTurnEffects(gliscor, 'player');
      expect(resToxic?.message).toContain('Gliscor bị trúng độc nặng bởi [Quả Cầu Độc]!');
      expect(gliscor.status).toBe('toxic');
    });

    it('emits dialogues with exact HP for Pinch Berries when triggered', () => {
      const pikachu = makeBattler('Pikachu', 'PIKACHU', ['Electric'], 20, 50, 'oran-berry');
      const oranEvents = HeldItemEngine.checkHpTriggeredBerry(pikachu, 'player');
      expect(oranEvents.length).toBe(1);
      expect(oranEvents[0].message).toBe('Pikachu đã ăn [Quả Oran] và hồi phục 10 HP!');

      const snorlax = makeBattler('Snorlax', 'SNORLAX', ['Normal'], 40, 100, 'sitrus-berry');
      const sitrusEvents = HeldItemEngine.checkHpTriggeredBerry(snorlax, 'player');
      expect(sitrusEvents.length).toBe(1);
      expect(sitrusEvents[0].message).toBe('Snorlax đã ăn [Quả Sitrus] và hồi phục 25 HP!');
    });

    it('emits stat boost dialogue for pinch Stat Berries (<= 25% HP)', () => {
      const pikachu = makeBattler('Pikachu', 'PIKACHU', ['Electric'], 20, 100, 'salac-berry');
      const events = HeldItemEngine.checkHpTriggeredBerry(pikachu, 'player');
      expect(events.length).toBe(1);
      expect(events[0].message).toBe('Pikachu đã ăn [Quả Salac], Tốc độ tăng lên!');
    });

    it('emits status curing dialogues for Cheri, Lum, and Persim berries', () => {
      const pikaPara = makeBattler('Pikachu', 'PIKACHU', ['Electric'], 50, 50, 'cheri-berry');
      pikaPara.status = 'paralysis';
      const cheriRes = checkPreTurnStatus(pikaPara, 'player', defaultBattleRng);
      expect(
        cheriRes.events.some((e) =>
          e.message?.includes('Pikachu đã ăn [Quả Cheri] và chữa khỏi tê liệt!')
        )
      ).toBe(true);

      const pikaLum = makeBattler('Pikachu', 'PIKACHU', ['Electric'], 50, 50, 'lum-berry');
      pikaLum.status = 'sleep';
      pikaLum.confusionTurns = 2;
      const lumRes = checkPreTurnStatus(pikaLum, 'player', defaultBattleRng);
      expect(
        lumRes.events.some((e) =>
          e.message?.includes('Pikachu đã ăn [Quả Lum] và chữa khỏi toàn bộ trạng thái bất thường!')
        )
      ).toBe(true);

      const pikaPersim = makeBattler('Pikachu', 'PIKACHU', ['Electric'], 50, 50, 'persim-berry');
      pikaPersim.status = 'none';
      pikaPersim.confusionTurns = 3;
      const persimRes = checkPreTurnStatus(pikaPersim, 'player', defaultBattleRng);
      expect(
        persimRes.events.some((e) =>
          e.message?.includes('Pikachu đã ăn [Quả Persim] và chữa khỏi trạng thái bối rối!')
        )
      ).toBe(true);
    });

    it('emits Focus Sash survival dialogue when surviving lethal blow', () => {
      const alakazam = makeBattler('Alakazam', 'ALAKAZAM', ['Psychic'], 100, 100, 'focus-sash');
      const sashCheck = HeldItemEngine.checkFocusSash(alakazam, 250);
      expect(sashCheck.triggered).toBe(true);
      expect(sashCheck.message).toBe('Alakazam trụ vững với 1 HP nhờ [Dải Băng Tập Trung]!');
    });

    it('emits Rocky Helmet and Life Orb dialogues with exact HP in post-attack checks', () => {
      const attacker = makeBattler('Pikachu', 'PIKACHU', ['Electric'], 120, 120, 'life-orb');
      const defender = makeBattler(
        'Cloyster',
        'CLOYSTER',
        ['Water', 'Ice'],
        120,
        120,
        'rocky-helmet'
      );
      const move: BattleMove = {
        id: 'slam',
        name: 'Slam',
        type: 'Normal',
        category: 'physical',
        power: 80,
        accuracy: 100,
        pp: 20,
        maxPp: 20,
        description: '',
      };

      const events = HeldItemEngine.checkPostAttackEffects(
        attacker,
        'player',
        defender,
        'enemy',
        move,
        30
      );
      expect(events.length).toBe(2);

      // 1. Rocky Helmet counter message: 1/6 of 120 = 20 HP
      expect(events[0].message).toBe('Pikachu bị tổn thương 20 HP bởi [Mũ Gai] của Cloyster!');

      // 2. Life Orb recoil message: 1/10 of 120 = 12 HP
      expect(events[1].message).toBe('Pikachu bị tiêu hao 12 HP bởi [Quả Cầu Sinh Mệnh]!');
    });

    it('emits Air Balloon immunity and pop dialogues', () => {
      const heatran = makeBattler('Heatran', 'HEATRAN', ['Fire', 'Steel'], 100, 100, 'air-balloon');
      const eqMove: BattleMove = {
        id: 'earthquake',
        name: 'Earthquake',
        type: 'Ground',
        category: 'physical',
        power: 100,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        description: '',
      };

      // Type immunity check
      const immunity = HeldItemEngine.checkTypeImmunity(heatran, 'enemy', eqMove, []);
      expect(immunity.isImmune).toBe(true);
      expect(immunity.message).toBe(
        'Heatran né tránh hoàn toàn đòn Earthquake nhờ bay trên [Khinh Khí Cầu]!'
      );

      // Damage calculator check
      const dmgCalc = calculateDamage(heatran, heatran, eqMove, defaultBattleRng);
      expect(dmgCalc.damage).toBe(0);
      expect(dmgCalc.secMsg).toContain('[Khinh Khí Cầu]');

      // Popping upon taking damage from another move
      const waterMove: BattleMove = {
        id: 'surf',
        name: 'Surf',
        type: 'Water',
        category: 'special',
        power: 90,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
        description: '',
      };
      const events = HeldItemEngine.checkPostAttackEffects(
        heatran,
        'player',
        heatran,
        'enemy',
        waterMove,
        40
      );
      expect(
        events.some((e) =>
          e.message?.includes('Khinh khí cầu [Khinh Khí Cầu] của Heatran đã bị nổ!')
        )
      ).toBe(true);
      expect(heatran.heldItem).toBeNull();
    });
  });

  describe('10. Weather & Terrain Duration Extending Held Items', () => {
    it('extends weather and terrain duration from 5 to 8 turns when holding respective items', () => {
      // Direct engine calculations
      expect(HeldItemEngine.getWeatherDuration('rain', 'damp-rock')).toBe(8);
      expect(HeldItemEngine.getWeatherDuration('rain', null)).toBe(5);
      expect(HeldItemEngine.getWeatherDuration('rain', 'leftovers')).toBe(5);

      expect(HeldItemEngine.getWeatherDuration('sun', 'heat-rock')).toBe(8);
      expect(HeldItemEngine.getWeatherDuration('sun', null)).toBe(5);

      expect(HeldItemEngine.getWeatherDuration('sandstorm', 'smooth-rock')).toBe(8);
      expect(HeldItemEngine.getWeatherDuration('sandstorm', null)).toBe(5);

      expect(HeldItemEngine.getWeatherDuration('hail', 'icy-rock')).toBe(8);
      expect(HeldItemEngine.getWeatherDuration('hail', null)).toBe(5);

      expect(HeldItemEngine.getTerrainDuration('terrain-extender')).toBe(8);
      expect(HeldItemEngine.getTerrainDuration(null)).toBe(5);
    });

    it('sets 8 weather turns in battle when Rain Dance is used with Damp Rock', async () => {
      const { applyStatusCategoryMove } = await import(
        '../src/battle/rules/move-effect-engine'
      );
      const rainMove: BattleMove = {
        id: 'rain_dance',
        name: 'Rain Dance',
        type: 'Water',
        category: 'status',
        power: 0,
        accuracy: 100,
        pp: 5,
        maxPp: 5,
        description: '',
      };

      const pelipper = partyPokemonToBattler(
        createPartyPokemon('PIKACHU', 50, { heldItem: 'damp-rock' })
      );
      const opponent = partyPokemonToBattler(createPartyPokemon('PIDGEY', 50));
      const env: any = { weather: { type: 'none', turnsLeft: 0 } };

      const res = applyStatusCategoryMove(
        pelipper,
        opponent,
        'player',
        'enemy',
        rainMove,
        defaultBattleRng,
        [],
        env
      );

      expect(env.weather.type).toBe('rain');
      expect(env.weather.turnsLeft).toBe(8);
      expect(res.extraMsg).toContain('Đá Ẩm Ướt');
    });

    it('sets 8 weather turns when Drizzle ability triggers with Damp Rock', async () => {
      const { AbilityEngine } = await import('../src/battle/rules/ability-engine');
      const kyogre = partyPokemonToBattler(
        createPartyPokemon('PIKACHU', 50, { heldItem: 'damp-rock' })
      );
      kyogre.ability = 'drizzle';
      const opponent = partyPokemonToBattler(createPartyPokemon('PIDGEY', 50));
      const env: any = { weather: { type: 'none', turnsLeft: 0 } };

      const msgs = AbilityEngine.onSwitchIn(
        kyogre,
        'player',
        opponent,
        'enemy',
        defaultBattleRng,
        [],
        env
      );
      expect(env.weather.type).toBe('rain');
      expect(env.weather.turnsLeft).toBe(8);
      expect(msgs.some((m) => m.includes('Đá Ẩm Ướt'))).toBe(true);
    });
  });

  describe('9. Exp. Share System (Chia Sẻ Kinh Nghiệm)', () => {
    it('distributes 50% EXP to non-battling party member holding exp-share', () => {
      partyService.reset();
      const leadPk = createPartyPokemon('PIKACHU', 20);
      const benchedPk = createPartyPokemon('CHARMANDER', 15, { heldItem: 'exp-share' });
      (partyService as any).setParty([leadPk, benchedPk]);

      const leadBattler = partyPokemonToBattler(leadPk);
      const initialBenchExp = benchedPk.exp;

      // Primary battler receives 200 EXP
      const syncResult = partyService.syncBattleResult(leadBattler, 200);

      expect(syncResult.expShares.length).toBe(1);
      expect(syncResult.expShares[0].pokemon.uid).toBe(benchedPk.uid);
      expect(syncResult.expShares[0].expGained).toBe(100); // 50% of 200 = 100
      expect(benchedPk.exp).toBe(initialBenchExp + 100);
    });

    it('distributes 50% EXP to all living party members when Exp. Share is in player bag', () => {
      partyService.reset();
      inventoryService.reset();
      inventoryService.addItem('exp-share', 1);

      const leadPk = createPartyPokemon('PIKACHU', 20);
      const member2 = createPartyPokemon('BULBASAUR', 15);
      const member3 = createPartyPokemon('SQUIRTLE', 15);
      const faintedMember = createPartyPokemon('PIDGEY', 10);
      faintedMember.currentHp = 0;
      faintedMember.isFainted = true;

      (partyService as any).setParty([leadPk, member2, member3, faintedMember]);

      const leadBattler = partyPokemonToBattler(leadPk);
      const syncResult = partyService.syncBattleResult(leadBattler, 400);

      // Only member2 and member3 receive Exp Share (faintedMember excluded)
      expect(syncResult.expShares.length).toBe(2);
      expect(syncResult.expShares.map((s) => s.pokemon.name)).toEqual(['Bulbasaur', 'Squirtle']);
      expect(syncResult.expShares[0].expGained).toBe(200); // 50% of 400
      expect(syncResult.expShares[1].expGained).toBe(200);
      expect(faintedMember.exp).toBe(0);
    });

    it('multiplies shared EXP by 1.5x when benched Pokémon holds Lucky Egg', () => {
      partyService.reset();
      inventoryService.reset();
      inventoryService.addItem('exp-share', 1);

      const leadPk = createPartyPokemon('PIKACHU', 20);
      const luckyPk = createPartyPokemon('EEVEE', 12, { heldItem: 'lucky-egg' });
      (partyService as any).setParty([leadPk, luckyPk]);

      const leadBattler = partyPokemonToBattler(leadPk);
      const syncResult = partyService.syncBattleResult(leadBattler, 200);

      expect(syncResult.expShares.length).toBe(1);
      // 50% of 200 = 100, then x1.5 from Lucky Egg = 150
      expect(syncResult.expShares[0].expGained).toBe(150);
    });
  });

  describe('10. Leppa Berry In-Battle Auto Trigger', () => {
    it('automatically consumes Leppa Berry and restores 10 PP when a move drops to 0 PP', () => {
      const battler = partyPokemonToBattler(
        createPartyPokemon('PIKACHU', 25, { heldItem: 'leppa-berry' })
      );
      expect(battler.heldItem).toBe('leppa-berry');
      expect(battler.moves.length).toBeGreaterThan(0);

      // Set Move 0 to 0 PP
      battler.moves[0].pp = 0;
      battler.moves[0].maxPp = 15;

      const events = HeldItemEngine.checkPpTriggeredBerry(battler, 'player', battler.moves[0]);

      expect(events.length).toBe(1);
      expect(battler.heldItem).toBeNull();
      expect(battler.lastConsumedItem).toBe('leppa-berry');
      expect(battler.moves[0].pp).toBe(10); // Restored 10 PP!
      expect(events[0].message).toMatch(/Leppa/i);
      expect(events[0].message).toContain('10 PP');
    });
  });
});
