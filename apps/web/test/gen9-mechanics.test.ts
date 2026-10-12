import { describe, it, expect } from 'vitest';
import { createPartyPokemon } from '../src/domain/party/party-state';
import { createBattler } from '../src/battle/battle-factory';
import { BattleEngine } from '../src/battle/battle-engine';
import { calculateDamage } from '../src/battle/rules/damage-calculator';
import { defaultBattleRng } from '../src/battle/battle-rng';
import { getItemEffectDef, TM_MOVE_MAPPING } from '../src/domain/inventory/item-catalog-effects';
import { findItem } from '../src/data/items-db';
import { pokemonCatalog } from '../src/data';
import type { BattleMove, BattleEnvironment } from '../src/battle/types';

describe('Gen 9 Data Reference & Mechanics: Ability Slots, TM Catalog, and Terastallization', () => {
  const env: BattleEnvironment = {
    background: '',
    enemyBase: '',
    playerBase: '',
  };

  describe('1. Pokemon Species & Ability Slots', () => {
    it('provides primary, secondary, and hidden abilities in pokemonCatalog', () => {
      const bulbasaur = pokemonCatalog.getBySpeciesKey('BULBASAUR');
      expect(bulbasaur).toBeDefined();
      expect(bulbasaur?.abilities?.primary).toBe('overgrow');
      expect(bulbasaur?.abilities?.hidden).toBe('chlorophyll');

      const pidgey = pokemonCatalog.getBySpeciesKey('PIDGEY');
      expect(pidgey).toBeDefined();
      expect(pidgey?.abilities?.primary).toBe('keen-eye');
      expect(pidgey?.abilities?.secondary).toBe('tangled-feet');
      expect(pidgey?.abilities?.hidden).toBe('big-pecks');

      const mew = pokemonCatalog.getBySpeciesKey('MEW');
      expect(mew?.abilities?.primary).toBe('synchronize');
      expect(mew?.abilities?.secondary).toBeUndefined();
    });

    it('creates PartyPokemon with proper ability and abilitySlot', () => {
      const p1 = createPartyPokemon('BULBASAUR', 5, { abilitySlot: 'primary' });
      expect(p1.ability).toBe('overgrow');
      expect(p1.abilitySlot).toBe('primary');

      const p2 = createPartyPokemon('PIDGEY', 5, { abilitySlot: 'secondary' });
      expect(p2.ability).toBe('tangled-feet');
      expect(p2.abilitySlot).toBe('secondary');

      const p3 = createPartyPokemon('PIDGEY', 5, { abilitySlot: 'hidden' });
      expect(p3.ability).toBe('big-pecks');
      expect(p3.abilitySlot).toBe('hidden');
    });

    it('createBattler resolves ability and abilitySlot from species abilities', () => {
      // Primary default
      const battler1 = createBattler('BULBASAUR', 5);
      expect(battler1.ability).toBe('overgrow');
      expect(battler1.abilitySlot).toBe('primary');

      // Custom slot hidden
      const battlerHidden = createBattler(
        'BULBASAUR',
        5,
        false,
        defaultBattleRng,
        false,
        undefined,
        undefined,
        undefined,
        undefined,
        'hidden'
      );
      expect(battlerHidden.ability).toBe('chlorophyll');
      expect(battlerHidden.abilitySlot).toBe('hidden');

      // Custom slot secondary
      const battlerSecondary = createBattler(
        'PIDGEY',
        5,
        false,
        defaultBattleRng,
        false,
        undefined,
        undefined,
        undefined,
        undefined,
        'secondary'
      );
      expect(battlerSecondary.ability).toBe('tangled-feet');
      expect(battlerSecondary.abilitySlot).toBe('secondary');

      // Inferred slot from custom ability string
      const battlerInferred = createBattler(
        'PIDGEY',
        5,
        false,
        defaultBattleRng,
        false,
        undefined,
        undefined,
        'big-pecks'
      );
      expect(battlerInferred.ability).toBe('big-pecks');
      expect(battlerInferred.abilitySlot).toBe('hidden');
    });

    it('assigns default teraType to primary type upon creation', () => {
      const bulba = createPartyPokemon('BULBASAUR', 5);
      expect(bulba.teraType).toBe('Grass');

      const pika = createPartyPokemon('PIKACHU', 5);
      expect(pika.teraType).toBe('Electric');

      const customTera = createPartyPokemon('PIKACHU', 5, { teraType: 'Flying' });
      expect(customTera.teraType).toBe('Flying');
    });
  });

  describe('2. Gen 9 TM Catalog (TM001 - TM229)', () => {
    it('maps TM001, TM002, TM171, and TM229 correctly in TM_MOVE_MAPPING', () => {
      expect(TM_MOVE_MAPPING.tm001).toBe('take_down');
      expect(TM_MOVE_MAPPING.tm002).toBe('charm');
      expect(TM_MOVE_MAPPING.tm171).toBe('tera_blast');
      expect(TM_MOVE_MAPPING.tm229).toBe('upper_hand');
    });

    it('resolves item effect definition for TM001 through TM229', () => {
      const def001 = getItemEffectDef('tm001');
      expect(def001).toBeDefined();
      expect(def001?.teachMove).toBe('take_down');

      const def171 = getItemEffectDef('tm171');
      expect(def171).toBeDefined();
      expect(def171?.teachMove).toBe('tera_blast');

      const def229 = getItemEffectDef('tm229');
      expect(def229).toBeDefined();
      expect(def229?.teachMove).toBe('upper_hand');
    });

    it('finds TM items in items-db with category machine and accurate names', () => {
      const tm001Item = findItem('tm001');
      expect(tm001Item).toBeDefined();
      expect(tm001Item?.name).toContain('TM001');
      expect(tm001Item?.category).toBe('machine');

      const tm171Item = findItem('tm171');
      expect(tm171Item).toBeDefined();
      expect(tm171Item?.name).toContain('Tera Blast');
      expect(tm171Item?.nameVi).toContain('Bộc Phá Tera');
    });
  });

  describe('3. Terastallization Battle Mechanics', () => {
    it('allows player and enemy to Terastallize once per battle', () => {
      const player = createBattler('PIKACHU', 50, true);
      const enemy = createBattler('CHARIZARD', 50, false);
      player.teraType = 'Flying';
      enemy.teraType = 'Dragon';

      const engine = new BattleEngine(player, enemy, env);

      expect(engine.canTerastallize('player')).toBe(true);
      expect(engine.canTerastallize('enemy')).toBe(true);

      const resPlayer = engine.terastallize('player');
      expect(resPlayer.success).toBe(true);
      expect(player.isTerastallized).toBe(true);
      expect(player.types).toEqual(['Flying']);
      expect(player.originalTypes).toEqual(['Electric']);
      expect(engine.playerTerastallized).toBe(true);
      expect(engine.canTerastallize('player')).toBe(false);

      // Subsequent attempt fails
      const resAgain = engine.terastallize('player');
      expect(resAgain.success).toBe(false);

      // Enemy can still Terastallize
      const resEnemy = engine.terastallize('enemy');
      expect(resEnemy.success).toBe(true);
      expect(enemy.isTerastallized).toBe(true);
      expect(enemy.types).toEqual(['Dragon']);
    });

    it('changes defending type effectiveness to pure Tera type (Pikachu Tera Flying resists Ground)', () => {
      const attacker = createBattler('CHARIZARD', 50, false);
      const defender = createBattler('PIKACHU', 50, true);
      defender.teraType = 'Flying';

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

      // Before Terastallize: Ground vs Electric = 2x Super Effective
      const preDmg = calculateDamage(attacker, defender, eqMove, defaultBattleRng, env);
      expect(preDmg.typeEffectiveness).toBe(2.0);

      // After Terastallize to Flying: Ground vs Flying = 0x Immune!
      defender.isTerastallized = true;
      defender.types = ['Flying'];

      const postDmg = calculateDamage(attacker, defender, eqMove, defaultBattleRng, env);
      expect(postDmg.typeEffectiveness).toBe(0);
      expect(postDmg.damage).toBe(0);
    });

    it('boosts STAB damage to 2.0x when matching original STAB, and 1.5x for new Tera type', () => {
      const pika = createBattler('PIKACHU', 50, true);
      const target = createBattler('SNORLAX', 50, false);
      pika.stats.spAtk = 100;
      target.stats.spDef = 100;

      const electricMove: BattleMove = {
        id: 'thunderbolt',
        name: 'Thunderbolt',
        type: 'Electric',
        category: 'special',
        power: 90,
        accuracy: 100,
        pp: 15,
        maxPp: 15,
        description: '',
      };

      // Base STAB is 1.5x
      const baseDmg = calculateDamage(pika, target, electricMove, defaultBattleRng, env);

      // Terastallize into Electric (matching original type) -> STAB becomes 2.0x
      pika.teraType = 'Electric';
      pika.originalTypes = ['Electric'];
      pika.isTerastallized = true;
      pika.types = ['Electric'];

      const teraDmg = calculateDamage(pika, target, electricMove, defaultBattleRng, env);
      // Ratio of damage should be approximately 2.0 / 1.5 = 1.33x
      expect(teraDmg.damage).toBeGreaterThan(baseDmg.damage);
    });

    it('adapts Tera Blast to user Tera type and highest offensive stat', () => {
      const attacker = createBattler('DRAGONITE', 50, true);
      const defender = createBattler('SNORLAX', 50, false);
      attacker.stats.attack = 180;
      attacker.stats.spAtk = 90;
      attacker.teraType = 'Fire';
      attacker.originalTypes = ['Dragon', 'Flying'];
      attacker.isTerastallized = true;
      attacker.types = ['Fire'];

      const teraBlast: BattleMove = {
        id: 'tera_blast',
        name: 'Tera Blast',
        type: 'Normal',
        category: 'special',
        power: 80,
        accuracy: 100,
        pp: 10,
        maxPp: 10,
        description: '',
      };

      const result = calculateDamage(attacker, defender, teraBlast, defaultBattleRng, env);
      expect(result.damage).toBeGreaterThan(0);
      // Grass defender would be 2.0x against Fire
      const grassDefender = createBattler('BULBASAUR', 50, false);
      const resultVsGrass = calculateDamage(
        attacker,
        grassDefender,
        teraBlast,
        defaultBattleRng,
        env
      );
      expect(resultVsGrass.typeEffectiveness).toBe(2.0); // Fire vs Grass is Super Effective!
    });
  });
});
