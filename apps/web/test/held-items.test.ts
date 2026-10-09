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
      stats: { hp: maxHp, attack: 50, defense: 40, spAtk: 50, spDef: 50, speed: 90 },
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
      stats: { hp: 50, attack: 50, defense: 40, spAtk: 50, spDef: 50, speed: 90 },
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
        stats: { hp: 160, attack: 110, defense: 65, spAtk: 65, spDef: 110, speed: 30 },
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
        stats: { hp: 160, attack: 65, defense: 60, spAtk: 130, spDef: 75, speed: 110 },
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
        stats: { hp: 160, attack: 55, defense: 40, spAtk: 50, spDef: 50, speed: 90 },
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
        stats: { hp: 100, attack: 55, defense: 40, spAtk: 50, spDef: 50, speed: 100 },
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
        stats: { hp: 150, attack: 84, defense: 78, spAtk: 109, spDef: 85, speed: 100 },
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
        stats: { hp: 200, attack: 49, defense: 49, spAtk: 65, spDef: 65, speed: 45 },
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
        stats: { hp: 100, attack: 55, defense: 40, spAtk: 50, spDef: 50, speed: 90 },
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
        stats: { hp: 100, attack: 55, defense: 40, spAtk: 50, spDef: 50, speed: 90 },
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
        stats: { hp: 100, attack: 55, defense: 40, spAtk: 50, spDef: 50, speed: 90 },
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
        stats: { hp: 120, attack: 55, defense: 40, spAtk: 50, spDef: 50, speed: 90 },
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
        stats: { hp: 120, attack: 95, defense: 180, spAtk: 85, spDef: 45, speed: 70 },
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
});
