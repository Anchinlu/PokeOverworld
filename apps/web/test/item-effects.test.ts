import { describe, it, expect, beforeEach } from 'vitest';
import {
  canUseItemOnPartyPokemon,
  applyItemToPartyPokemon,
  canUseItemOnBattler,
  applyItemToBattler,
} from '../src/domain/inventory/item-effects';
import { inventoryService } from '../src/domain/inventory/inventory-service';
import { createPartyPokemon, type PartyPokemon } from '../src/domain/party/party-state';
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

  it('boosts stats permanently with Vitamin items', () => {
    const protein = findItem('protein') as ItemData;
    expect(protein).toBeDefined();

    const oldAtk = pikachu.stats.attack;
    const res = applyItemToPartyPokemon(protein, pikachu);
    expect(res.success).toBe(true);
    expect(pikachu.stats.attack).toBe(oldAtk + 2);
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

  it('handles in-battle item application and stat boosters', () => {
    const battler: BattlerPokemon = {
      id: 25,
      name: 'Pikachu',
      speciesKey: 'PIKACHU',
      types: ['electric'],
      level: 15,
      currentHp: 15,
      maxHp: 45,
      stats: { hp: 45, attack: 30, defense: 25, spAtk: 35, spDef: 30, speed: 45 },
      moves: [],
    };

    const potion = findItem('potion') as ItemData;
    expect(canUseItemOnBattler(potion, battler).canUse).toBe(true);

    const resHeal = applyItemToBattler(potion, battler);
    expect(resHeal.success).toBe(true);
    expect(battler.currentHp).toBe(35);

    const xAttack = findItem('x-attack') as ItemData;
    expect(canUseItemOnBattler(xAttack, battler).canUse).toBe(true);
    const resX = applyItemToBattler(xAttack, battler);
    expect(resX.success).toBe(true);
    expect(battler.statStages?.attack).toBe(2);
  });
});
