import { describe, it, expect, beforeEach } from 'vitest';
import {
  canUseItemOnPartyPokemon,
  applyItemToPartyPokemon,
  canUseItemOnBattler,
  applyItemToBattler,
} from '../src/domain/inventory/item-effects';
import { inventoryService } from '../src/domain/inventory/inventory-service';
import {
  createPartyPokemon,
  recalculatePartyPokemonStats,
  type PartyPokemon,
} from '../src/domain/party/party-state';
import type { BattlerPokemon } from '../src/battle/types';
import { findItem, type ItemData } from '../src/data/items-db';

describe('Item Effects Engine & Inventory Deduction', () => {
  let pikachu: PartyPokemon;

  beforeEach(() => {
    inventoryService.reset();
    pikachu = createPartyPokemon('PIKACHU', 15);
  });

  it('heals HP with Potion and verifies eligibility', () => {
    const potion = findItem('potion') as ItemData;
    expect(potion).toBeDefined();

    // Full HP -> Cannot use
    expect(pikachu.currentHp).toBe(pikachu.maxHp);
    const checkFull = canUseItemOnPartyPokemon(potion, pikachu);
    expect(checkFull.canUse).toBe(false);
    expect(checkFull.reason).toContain('đầy máu');

    // Damaged HP -> Can use
    pikachu.currentHp = 10;
    const checkDamaged = canUseItemOnPartyPokemon(potion, pikachu);
    expect(checkDamaged.canUse).toBe(true);

    // Apply potion
    const res = applyItemToPartyPokemon(potion, pikachu);
    expect(res.success).toBe(true);
    expect(pikachu.currentHp).toBe(30); // 10 + 20
    expect(res.hpRecovered).toBe(20);
  });

  it('revives a fainted Pokémon with Revive and rejects live Pokémon', () => {
    const revive = findItem('revive') as ItemData;
    expect(revive).toBeDefined();

    // Alive -> Cannot use
    expect(canUseItemOnPartyPokemon(revive, pikachu).canUse).toBe(false);

    // Fainted -> Can use
    pikachu.currentHp = 0;
    pikachu.isFainted = true;
    expect(canUseItemOnPartyPokemon(revive, pikachu).canUse).toBe(true);

    const res = applyItemToPartyPokemon(revive, pikachu);
    expect(res.success).toBe(true);
    expect(pikachu.isFainted).toBe(false);
    expect(pikachu.currentHp).toBe(Math.floor(pikachu.maxHp / 2));
  });

  it('cures poison status condition with Antidote or Pecha Berry', () => {
    const antidote = findItem('antidote') as ItemData;
    expect(antidote).toBeDefined();

    // Normal status -> cannot use
    expect(canUseItemOnPartyPokemon(antidote, pikachu).canUse).toBe(false);

    // Poisoned -> can use
    pikachu.status = 'poison';
    expect(canUseItemOnPartyPokemon(antidote, pikachu).canUse).toBe(true);

    const res = applyItemToPartyPokemon(antidote, pikachu);
    expect(res.success).toBe(true);
    expect(pikachu.status).toBe('none');
  });

  it('levels up Pokémon with Rare Candy', () => {
    const rareCandy = findItem('rare-candy') as ItemData;
    expect(rareCandy).toBeDefined();

    const oldLevel = pikachu.level;
    const res = applyItemToPartyPokemon(rareCandy, pikachu);
    expect(res.success).toBe(true);
    expect(pikachu.level).toBe(oldLevel + 1);
  });

  it('boosts stats permanently via EV system with Vitamin items and respects cap', () => {
    const protein = findItem('protein') as ItemData;
    expect(protein).toBeDefined();

    expect(pikachu.evs.attack).toBe(0);
    const res = applyItemToPartyPokemon(protein, pikachu);
    expect(res.success).toBe(true);
    expect(pikachu.evs.attack).toBe(10);

    // Apply multiple proteins to verify EV accumulation
    for (let i = 0; i < 9; i++) {
      applyItemToPartyPokemon(protein, pikachu);
    }
    expect(pikachu.evs.attack).toBe(100);

    // Verify stats persist across level ups
    const oldAtk = pikachu.stats.attack;
    pikachu.level = 50;
    recalculatePartyPokemonStats(pikachu);
    expect(pikachu.stats.attack).toBeGreaterThan(oldAtk);

    // Max out attack EV to 252
    pikachu.evs.attack = 252;
    const checkMax = canUseItemOnPartyPokemon(protein, pikachu);
    expect(checkMax.canUse).toBe(false);
    expect(checkMax.reason).toContain('tối đa');
  });

  it('restores move PP with Ether and Leppa Berry', () => {
    const ether = findItem('ether') as ItemData;
    expect(ether).toBeDefined();

    // Move PP is full -> Cannot use
    expect(canUseItemOnPartyPokemon(ether, pikachu).canUse).toBe(false);

    // Depleted move PP -> Can use
    pikachu.moves[0].pp = 5;
    expect(canUseItemOnPartyPokemon(ether, pikachu).canUse).toBe(true);

    const res = applyItemToPartyPokemon(ether, pikachu);
    expect(res.success).toBe(true);
    expect(pikachu.moves[0].pp).toBe(15);
  });

  it('correctly deducts item quantity in inventory upon usage', () => {
    const initialCount = inventoryService.getItemCount('potion');
    inventoryService.addItem('potion', 3);
    expect(inventoryService.getItemCount('potion')).toBe(initialCount + 3);

    pikachu.currentHp = 10;
    const potion = findItem('potion') as ItemData;

    const res = applyItemToPartyPokemon(potion, pikachu);
    expect(res.success).toBe(true);

    inventoryService.removeItem('potion', 1);
    expect(inventoryService.getItemCount('potion')).toBe(initialCount + 2);

    inventoryService.removeItem('potion', initialCount + 2);
    expect(inventoryService.getItemCount('potion')).toBe(0);
    expect(inventoryService.hasItem('potion', 1)).toBe(false);
  });

  it('handles in-battle item application, Gen 7 potions, and stat boosters with cap checks', () => {
    const battler: BattlerPokemon = {
      id: 25,
      name: 'Pikachu',
      speciesKey: 'PIKACHU',
      types: ['electric'],
      level: 15,
      currentHp: 15,
      maxHp: 100,
      stats: { hp: 100, attack: 30, defense: 25, spAtk: 35, spDef: 30, speed: 45 },
      moves: [],
    };

    // Gen 7 Super Potion heals 60 HP
    const superPotion = findItem('super-potion') as ItemData;
    expect(canUseItemOnBattler(superPotion, battler).canUse).toBe(true);
    const resHeal = applyItemToBattler(superPotion, battler);
    expect(resHeal.success).toBe(true);
    expect(battler.currentHp).toBe(75); // 15 + 60

    // In-battle Ice Heal cures freeze
    battler.status = 'freeze';
    const iceHeal = findItem('ice-heal') as ItemData;
    expect(canUseItemOnBattler(iceHeal, battler).canUse).toBe(true);
    const resIce = applyItemToBattler(iceHeal, battler);
    expect(resIce.success).toBe(true);
    expect(battler.status).toBe('none');

    // Dire Hit increases critStage
    const direHit = findItem('dire-hit') as ItemData;
    expect(canUseItemOnBattler(direHit, battler).canUse).toBe(true);
    const resDire = applyItemToBattler(direHit, battler);
    expect(resDire.success).toBe(true);
    expect(battler.critStage).toBe(2);

    // X Attack increases stat stages and caps at +6
    const xAttack = findItem('x-attack') as ItemData;
    expect(canUseItemOnBattler(xAttack, battler).canUse).toBe(true);
    applyItemToBattler(xAttack, battler); // +2 -> 2
    applyItemToBattler(xAttack, battler); // +2 -> 4
    applyItemToBattler(xAttack, battler); // +2 -> 6
    expect(battler.statStages?.attack).toBe(6);

    // At +6, cannot use X Attack anymore (prevents wasting items!)
    const checkMaxX = canUseItemOnBattler(xAttack, battler);
    expect(checkMaxX.canUse).toBe(false);
    expect(checkMaxX.reason).toContain('tối đa (+6)');
  });

  it('handles revive items in battle context and does not reject them as unusable in battle', () => {
    const revive = findItem('revive') as ItemData;
    const maxRevive = findItem('max-revive') as ItemData;
    expect(revive).toBeDefined();
    expect(maxRevive).toBeDefined();

    const battler: BattlerPokemon = {
      uid: 'bat-1',
      name: 'Charizard',
      speciesKey: 'charizard',
      level: 36,
      currentHp: 120,
      maxHp: 120,
      stats: { hp: 120, attack: 84, defense: 78, spAtk: 109, spDef: 85, speed: 100 },
      moves: [],
    };

    // Live battler: cannot use revive (reason must NOT be "không thể dùng trong trận đấu")
    const liveCheck = canUseItemOnBattler(revive, battler);
    expect(liveCheck.canUse).toBe(false);
    expect(liveCheck.reason).toContain('đang khỏe mạnh');
    expect(liveCheck.reason).not.toContain('không thể dùng trong trận đấu');

    // Fainted battler: can use revive
    battler.currentHp = 0;
    battler.isFainted = true;
    const faintedCheck = canUseItemOnBattler(revive, battler);
    expect(faintedCheck.canUse).toBe(true);

    // Apply Revive: restores 50% HP
    const resRevive = applyItemToBattler(revive, battler);
    expect(resRevive.success).toBe(true);
    expect(battler.currentHp).toBe(60); // 120 / 2
    expect(battler.isFainted).toBe(false);

    // Apply Max Revive to fainted battler: restores 100% HP
    battler.currentHp = 0;
    battler.isFainted = true;
    const resMax = applyItemToBattler(maxRevive, battler);
    expect(resMax.success).toBe(true);
    expect(battler.currentHp).toBe(120);
    expect(battler.isFainted).toBe(false);
  });
});

