import { describe, it, expect, beforeEach } from 'vitest';
import {
  canUseItemOnPartyPokemon,
  applyItemToPartyPokemon,
  canUseItemOnBattler,
  applyItemToBattler,
  isMoveTargetItem,
} from '../src/domain/inventory/item-effects';
import { inventoryService } from '../src/domain/inventory/inventory-service';
import {
  createPartyPokemon,
  recalculatePartyPokemonStats,
  type PartyPokemon,
} from '../src/domain/party/party-state';
import type { BattlerPokemon } from '../src/battle/types';
import { findItem, type ItemData } from '../src/data/items-db';
import { getAvailableMovesForPokemon } from '../src/battle/moves-db';

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
    const battler = {
      id: 25,
      name: 'Pikachu',
      speciesKey: 'PIKACHU',
      types: ['Electric'],
      level: 15,
      currentHp: 15,
      maxHp: 100,
      stats: { hp: 100, attack: 30, defense: 25, spAtk: 35, spDef: 30, speed: 45, total: 265 },
      moves: [],
    } as unknown as BattlerPokemon;

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

    const battler = {
      uid: 'bat-1',
      name: 'Charizard',
      speciesKey: 'charizard',
      level: 36,
      currentHp: 120,
      maxHp: 120,
      stats: { hp: 120, attack: 84, defense: 78, spAtk: 109, spDef: 85, speed: 100, total: 576 },
      moves: [],
    } as unknown as BattlerPokemon;

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

  it('adds full items (x1 each) to inventory across all categories', () => {
    // Clear inventory
    inventoryService.loadState({});
    expect(Object.keys(inventoryService.getAllItems()).length).toBe(0);

    // Call addFullItems(1)
    const count = inventoryService.addFullItems(1);
    expect(count).toBeGreaterThan(500);

    const items = inventoryService.getAllItems();
    expect(Object.keys(items).length).toBe(count);

    // Verify sample items across different pockets have quantity 1
    expect(items['poke-ball']).toBe(1);
    expect(items['potion']).toBe(1);
    expect(items['master-ball']).toBe(1);
    expect(items['rare-candy']).toBe(1);
    expect(items['oran-berry']).toBe(1);

    // Calling addFullItems(1) again keeps x1 without inflating counts
    inventoryService.addFullItems(1);
    expect(inventoryService.getItemCount('poke-ball')).toBe(1);
  });

  it('changes Pokémon Nature with Nature Mints and recalculates stats', () => {
    // Set Pikachu to Modest (+SpAtk, -Atk)
    pikachu.nature = 'Modest';
    recalculatePartyPokemonStats(pikachu);
    const modestAtk = pikachu.stats.attack;
    const modestSpAtk = pikachu.stats.spAtk;

    const adamantMint = findItem('adamant-mint') as ItemData;
    expect(adamantMint).toBeDefined();

    // Can use Adamant Mint on Modest Pikachu
    expect(canUseItemOnPartyPokemon(adamantMint, pikachu).canUse).toBe(true);

    // Apply Adamant Mint (+Atk, -SpAtk)
    const res = applyItemToPartyPokemon(adamantMint, pikachu);
    expect(res.success).toBe(true);
    expect(pikachu.nature).toBe('Adamant');
    expect(pikachu.stats.attack).toBeGreaterThan(modestAtk);
    expect(pikachu.stats.spAtk).toBeLessThan(modestSpAtk);

    // Cannot use Adamant Mint again when already Adamant
    const recheck = canUseItemOnPartyPokemon(adamantMint, pikachu);
    expect(recheck.canUse).toBe(false);
    expect(recheck.code).toBe('ERR_NO_EFFECT');
    expect(recheck.reason).toContain('Cương quyết');
  });

  it('awards EXP and levels up with Exp Candies (XS, S, M, L, XL)', () => {
    const expCandyS = findItem('exp-candy-s') as ItemData;
    expect(expCandyS).toBeDefined();

    const oldLevel = pikachu.level;
    const oldExp = pikachu.exp;
    const res = applyItemToPartyPokemon(expCandyS, pikachu);
    expect(res.success).toBe(true);
    expect(pikachu.level).toBeGreaterThanOrEqual(oldLevel);
    if (pikachu.level === oldLevel) {
      expect(pikachu.exp).toBe(oldExp + 800);
    }

    // Exp Candy on Lv 100 is rejected
    pikachu.level = 100;
    const maxCheck = canUseItemOnPartyPokemon(expCandyS, pikachu);
    expect(maxCheck.canUse).toBe(false);
    expect(maxCheck.code).toBe('ERR_MAX_LEVEL');
  });

  it('evolves Pokémon with Evolution Stones when compatible and rejects incompatible species', () => {
    const eevee = createPartyPokemon('EEVEE', 10);
    const waterStone = findItem('water-stone') as ItemData;
    const leafStone = findItem('leaf-stone') as ItemData;
    expect(waterStone).toBeDefined();

    // Eevee + Leaf Stone -> Incompatible
    expect(canUseItemOnPartyPokemon(leafStone, eevee).canUse).toBe(false);

    // Eevee + Water Stone -> Evolves into Vaporeon (#134)
    expect(canUseItemOnPartyPokemon(waterStone, eevee).canUse).toBe(true);
    const evoRes = applyItemToPartyPokemon(waterStone, eevee);
    expect(evoRes.success).toBe(true);
    expect(eevee.speciesKey).toBe('VAPOREON');
    expect(eevee.speciesId).toBe(134);
    expect(eevee.name).toBe('Vaporeon');
    expect(eevee.types).toEqual(['Water']);

    // Pikachu + Thunder Stone -> Evolves into Raichu (#26)
    const thunderStone = findItem('thunder-stone') as ItemData;
    expect(canUseItemOnPartyPokemon(thunderStone, pikachu).canUse).toBe(true);
    const pikaRes = applyItemToPartyPokemon(thunderStone, pikachu);
    expect(pikaRes.success).toBe(true);
    expect(pikachu.speciesKey).toBe('RAICHU');
    expect(pikachu.speciesId).toBe(26);
  });

  it('trains IVs to maximum (31) with Bottle Cap and Gold Bottle Cap', () => {
    pikachu.ivs = { hp: 10, attack: 15, defense: 20, spAtk: 25, spDef: 30, speed: 5 };
    recalculatePartyPokemonStats(pikachu);

    const goldCap = findItem('gold-bottle-cap') as ItemData;
    expect(goldCap).toBeDefined();

    expect(canUseItemOnPartyPokemon(goldCap, pikachu).canUse).toBe(true);
    const res = applyItemToPartyPokemon(goldCap, pikachu);
    expect(res.success).toBe(true);
    expect(pikachu.ivs.hp).toBe(31);
    expect(pikachu.ivs.attack).toBe(31);
    expect(pikachu.ivs.defense).toBe(31);
    expect(pikachu.ivs.spAtk).toBe(31);
    expect(pikachu.ivs.spDef).toBe(31);
    expect(pikachu.ivs.speed).toBe(31);

    // All max IV -> cannot use anymore
    expect(canUseItemOnPartyPokemon(goldCap, pikachu).canUse).toBe(false);
  });

  it('reduces EVs with EV-reducing berries (Pomeg, Kelpsy, etc.)', () => {
    pikachu.evs.attack = 30;
    const kelpsyBerry = findItem('kelpsy-berry') as ItemData;
    expect(kelpsyBerry).toBeDefined();

    expect(canUseItemOnPartyPokemon(kelpsyBerry, pikachu).canUse).toBe(true);
    const res = applyItemToPartyPokemon(kelpsyBerry, pikachu);
    expect(res.success).toBe(true);
    expect(pikachu.evs.attack).toBe(20); // 30 - 10

    // When EV is 0, cannot reduce further
    pikachu.evs.attack = 0;
    expect(canUseItemOnPartyPokemon(kelpsyBerry, pikachu).canUse).toBe(false);
  });

  it('cures all status conditions with regional sweets (Rage Candy Bar)', () => {
    const rageCandy = findItem('rage-candy-bar') as ItemData;
    expect(rageCandy).toBeDefined();

    pikachu.status = 'paralysis';
    expect(canUseItemOnPartyPokemon(rageCandy, pikachu).canUse).toBe(true);
    const res = applyItemToPartyPokemon(rageCandy, pikachu);
    expect(res.success).toBe(true);
    expect(pikachu.status).toBe('none');
  });

  it('adds all 108 TM/HM machines into pocket 3 with addAllMachines', () => {
    const count = inventoryService.addAllMachines(1);
    expect(count).toBe(108);

    // Verify pocket 3 (machines) has all 108 items
    const machinePocketItems = inventoryService.getPocketItems(3);
    expect(machinePocketItems.length).toBe(108);

    // Verify TM24 (Thunderbolt) and HM03 (Surf) are in pocket
    const tm24Item = machinePocketItems.find((entry) => entry.item.id.toLowerCase() === 'tm24');
    expect(tm24Item).toBeDefined();
    expect(tm24Item?.count).toBe(1);

    const hm03Item = machinePocketItems.find((entry) => entry.item.id.toLowerCase() === 'hm03');
    expect(hm03Item).toBeDefined();
  });

  it('teaches move to Pokemon using TM disc and prevents re-learning if already known', () => {
    // Pikachu starting moves
    pikachu.moves = [
      { id: 'tackle', name: 'Tackle', description: '', type: 'Normal', category: 'physical', power: 40, accuracy: 100, pp: 35, maxPp: 35 },
      { id: 'quick_attack', name: 'Quick Attack', description: '', type: 'Normal', category: 'physical', power: 40, accuracy: 100, pp: 30, maxPp: 30 },
    ];

    const tm24 = findItem('tm24') as ItemData; // Thunderbolt
    expect(tm24).toBeDefined();

    // Check can use
    const checkBefore = canUseItemOnPartyPokemon(tm24, pikachu);
    expect(checkBefore.canUse).toBe(true);

    // Apply TM24
    const res = applyItemToPartyPokemon(tm24, pikachu);
    expect(res.success).toBe(true);
    expect(pikachu.moves.length).toBe(3);
    expect(pikachu.moves[2].id).toBe('thunderbolt');
    expect(pikachu.moves[2].pp).toBeGreaterThan(0);

    // Re-check can use: should now reject because Thunderbolt is already known
    const checkAfter = canUseItemOnPartyPokemon(tm24, pikachu);
    expect(checkAfter.canUse).toBe(false);
    expect(checkAfter.reason).toContain('thành thạo chiêu thức');

    // Attempting to apply again fails
    const resFail = applyItemToPartyPokemon(tm24, pikachu);
    expect(resFail.success).toBe(false);
  });

  it('replaces 4th move when teaching TM to a Pokemon with full 4 moves', () => {
    pikachu.moves = [
      { id: 'tackle', name: 'Tackle', description: '', type: 'Normal', category: 'physical', power: 40, accuracy: 100, pp: 35, maxPp: 35 },
      { id: 'quick_attack', name: 'Quick Attack', description: '', type: 'Normal', category: 'physical', power: 40, accuracy: 100, pp: 30, maxPp: 30 },
      { id: 'thunder_shock', name: 'Thunder Shock', description: '', type: 'Electric', category: 'special', power: 40, accuracy: 100, pp: 30, maxPp: 30 },
      { id: 'growl', name: 'Growl', description: '', type: 'Normal', category: 'status', power: 0, accuracy: 100, pp: 40, maxPp: 40 },
    ];

    const tm25 = findItem('tm25') as ItemData; // Thunder
    expect(tm25).toBeDefined();

    const check = canUseItemOnPartyPokemon(tm25, pikachu);
    expect(check.canUse).toBe(true);

    const res = applyItemToPartyPokemon(tm25, pikachu);
    expect(res.success).toBe(true);
    expect(pikachu.moves.length).toBe(4);
    // Replaced 4th move
    expect(pikachu.moves[3].id).toBe('thunder');
    expect(res.message).toContain('đã quên');
  });

  it('rejects teaching TM moves if Pokemon species is incompatible per Pokédex learnset', () => {
    const tm26 = findItem('tm26') as ItemData; // Earthquake
    const tm35 = findItem('tm35') as ItemData; // Flamethrower
    const tm24 = findItem('tm24') as ItemData; // Thunderbolt

    // 1. Pikachu cannot learn Earthquake or Flamethrower
    const checkPikaEq = canUseItemOnPartyPokemon(tm26, pikachu);
    expect(checkPikaEq.canUse).toBe(false);
    expect(checkPikaEq.code).toBe('ERR_INCOMPATIBLE');
    expect(checkPikaEq.reason).toContain('không thể học chiêu thức');

    const checkPikaFlame = canUseItemOnPartyPokemon(tm35, pikachu);
    expect(checkPikaFlame.canUse).toBe(false);
    expect(checkPikaFlame.code).toBe('ERR_INCOMPATIBLE');

    // 2. Caterpie cannot learn any TM
    const caterpie = createPartyPokemon('CATERPIE', 10);
    const checkCat = canUseItemOnPartyPokemon(tm24, caterpie);
    expect(checkCat.canUse).toBe(false);
    expect(checkCat.code).toBe('ERR_INCOMPATIBLE');

    // 3. Magikarp cannot learn Thunderbolt or Earthquake
    const magikarp = createPartyPokemon('MAGIKARP', 10);
    const checkKarp = canUseItemOnPartyPokemon(tm24, magikarp);
    expect(checkKarp.canUse).toBe(false);
    expect(checkKarp.code).toBe('ERR_INCOMPATIBLE');

    // 4. Snorlax can learn Earthquake
    const snorlax = createPartyPokemon('SNORLAX', 30);
    const checkSnorlaxEq = canUseItemOnPartyPokemon(tm26, snorlax);
    expect(checkSnorlaxEq.canUse).toBe(true);

    // 5. Charizard can learn Fire Blast (TM38)
    const tm38 = findItem('tm38') as ItemData; // Fire Blast
    const charizard = createPartyPokemon('CHARIZARD', 36);
    const checkZardFireBlast = canUseItemOnPartyPokemon(tm38, charizard);
    expect(checkZardFireBlast.canUse).toBe(true);
  });

  it('permanently records taught TM moves into taughtTmMoves and includes them in move pool', () => {
    // 1. Pikachu Lv.15 has < 4 moves
    expect(pikachu.taughtTmMoves).toBeDefined();
    expect(pikachu.taughtTmMoves?.length).toBe(0);

    const tm25 = findItem('tm25') as ItemData; // Thunder
    const teachRes = applyItemToPartyPokemon(tm25, pikachu);
    expect(teachRes.success).toBe(true);

    // Verify 'thunder' is recorded into taughtTmMoves
    expect(pikachu.taughtTmMoves).toContain('thunder');

    // Verify it is included in getAvailableMovesForPokemon
    const pool = getAvailableMovesForPokemon(pikachu);
    const thunderEntry = pool.find((entry) => entry.move.id.toLowerCase() === 'thunder');
    expect(thunderEntry).toBeDefined();
    expect(thunderEntry?.source).toBe('tm');

    // 2. Teach a 2nd TM move: TM86 Grass Knot (or HM03 Surf)
    const hm03 = findItem('hm03') as ItemData; // Surf
    const surfTeachRes = applyItemToPartyPokemon(hm03, pikachu);
    expect(surfTeachRes.success).toBe(true);
    expect(pikachu.taughtTmMoves).toContain('surf');

    // 3. Prevent duplicate TM usage if already equipped
    const dupCheck = canUseItemOnPartyPokemon(hm03, pikachu);
    expect(dupCheck.canUse).toBe(false);
    expect(dupCheck.reason).toContain('đã thành thạo chiêu thức');

    // 4. Unequip Surf by replacing it in active moves
    // Active moves has Surf. Replace slot 3 with another move
    pikachu.moves = pikachu.moves.filter((m) => m.id.toLowerCase() !== 'surf');
    expect(pikachu.moves.some((m) => m.id.toLowerCase() === 'surf')).toBe(false);

    // Even though unequipped, Surf is still in taughtTmMoves!
    expect(pikachu.taughtTmMoves).toContain('surf');

    // And still in the Move Pool ready for free re-equipping!
    const updatedPool = getAvailableMovesForPokemon(pikachu);
    const surfInPool = updatedPool.find((entry) => entry.move.id.toLowerCase() === 'surf');
    expect(surfInPool).toBeDefined();
    expect(surfInPool?.source).toBe('tm');

    // 5. If player tries to use HM03 / TM on unequipped Pokémon, prevent wasting resource
    const unequippedCheck = canUseItemOnPartyPokemon(hm03, pikachu);
    expect(unequippedCheck.canUse).toBe(false);
    expect(unequippedCheck.code).toBe('ERR_NO_EFFECT');
    expect(unequippedCheck.reason).toContain('đã được dạy chiêu');
    expect(unequippedCheck.reason).toContain('Chi Tiết Pokémon');
    expect(unequippedCheck.reason).toContain('mà không cần tốn');
  });

  describe('Move Selection for PP Restorers & Enhancers', () => {
    it('accurately identifies move-targeted items via isMoveTargetItem', () => {
      expect(isMoveTargetItem('ether')).toBe(true);
      expect(isMoveTargetItem('max-ether')).toBe(true);
      expect(isMoveTargetItem('leppa-berry')).toBe(true);
      expect(isMoveTargetItem('pp-up')).toBe(true);
      expect(isMoveTargetItem('pp-max')).toBe(true);

      expect(isMoveTargetItem('elixir')).toBe(false);
      expect(isMoveTargetItem('max-elixir')).toBe(false);
      expect(isMoveTargetItem('potion')).toBe(false);
      expect(isMoveTargetItem('rare-candy')).toBe(false);
      expect(isMoveTargetItem('protein')).toBe(false);
    });

    it('allows player to select a specific move for Ether, Max Ether, and Leppa Berry', () => {
      const ether = findItem('ether') as ItemData;
      const maxEther = findItem('max-ether') as ItemData;
      const leppaBerry = findItem('leppa-berry') as ItemData;

      expect(pikachu.moves.length).toBeGreaterThanOrEqual(2);

      // Set Move 0: full PP, Move 1: partial PP (5/20), Move 2: empty PP (0/15)
      pikachu.moves[0].pp = pikachu.moves[0].maxPp;
      pikachu.moves[1].pp = 5;
      pikachu.moves[1].maxPp = 20;
      if (pikachu.moves[2]) {
        pikachu.moves[2].pp = 0;
        pikachu.moves[2].maxPp = 15;
      }

      // 1. Selecting Move 0 (Full PP) -> Rejected
      const checkMove0 = canUseItemOnPartyPokemon(ether, pikachu, undefined, 0);
      expect(checkMove0.canUse).toBe(false);
      expect(checkMove0.code).toBe('ERR_PP_FULL');
      expect(checkMove0.reason).toContain('đã đầy PP');

      // 2. Selecting Move 1 -> Allowed and restores only Move 1
      const checkMove1 = canUseItemOnPartyPokemon(ether, pikachu, undefined, 1);
      expect(checkMove1.canUse).toBe(true);

      const applyMove1 = applyItemToPartyPokemon(ether, pikachu, undefined, 1);
      expect(applyMove1.success).toBe(true);
      expect(pikachu.moves[1].pp).toBe(15); // 5 + 10 = 15
      expect(applyMove1.message).toContain(pikachu.moves[1].nameVi || pikachu.moves[1].name);
      if (pikachu.moves[2]) {
        expect(pikachu.moves[2].pp).toBe(0); // Move 2 untouched!
      }

      // 3. Selecting Move 2 with Max Ether -> Restores Move 2 fully to maxPp
      if (pikachu.moves[2]) {
        const applyMove2 = applyItemToPartyPokemon(maxEther, pikachu, undefined, 2);
        expect(applyMove2.success).toBe(true);
        expect(pikachu.moves[2].pp).toBe(15);
      }

      // 4. Leppa Berry restores single move PP by 10
      pikachu.moves[1].pp = 2;
      const applyLeppa = applyItemToPartyPokemon(leppaBerry, pikachu, undefined, 1);
      expect(applyLeppa.success).toBe(true);
      expect(pikachu.moves[1].pp).toBe(12); // 2 + 10 = 12
    });

    it('allows player to select a specific move for PP Up and PP Max up to 3 times', () => {
      const ppUp = findItem('pp-up') as ItemData;
      const ppMax = findItem('pp-max') as ItemData;

      const targetMove = pikachu.moves[1] || pikachu.moves[0];
      targetMove.maxPp = 20;
      targetMove.pp = 20;
      (targetMove as any).ppUpCount = 0;
      (targetMove as any).baseMaxPp = 20;

      // 1st PP Up (+20% of baseMaxPp = +4)
      const res1 = applyItemToPartyPokemon(ppUp, pikachu, undefined, 1);
      expect(res1.success).toBe(true);
      expect(targetMove.maxPp).toBe(24);
      expect((targetMove as any).ppUpCount).toBe(1);

      // PP Max on a move with 1 step used -> jumps to max 3 steps (+2 steps = +8)
      const resMax = applyItemToPartyPokemon(ppMax, pikachu, undefined, 1);
      expect(resMax.success).toBe(true);
      expect(targetMove.maxPp).toBe(32); // 20 + (4 * 3) = 32
      expect((targetMove as any).ppUpCount).toBe(3);

      // Attempting to boost Move 1 again -> Rejected with ERR_PP_FULL
      const checkFull = canUseItemOnPartyPokemon(ppUp, pikachu, undefined, 1);
      expect(checkFull.canUse).toBe(false);
      expect(checkFull.code).toBe('ERR_PP_FULL');
      expect(checkFull.reason).toContain('tối đa');
    });
  });
});

