import { describe, it, expect, beforeEach } from 'vitest';
import {
  InventoryService,
  createDefaultInventoryState,
  PlayerService,
  createDefaultPlayerProfile,
  PartyService,
  partyService,
  createDefaultParty,
  createPartyPokemon,
  SaveGameRepository,
  type SaveStorageAdapter,
  pcStorageService,
  TOTAL_BOXES,
  BOX_CAPACITY,
} from '../src/domain';

class MockStorageAdapter implements SaveStorageAdapter {
  public store = new Map<string, string>();
  public getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  public setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  public removeItem(key: string): void {
    this.store.delete(key);
  }
}

describe('Domain Layer: InventoryService', () => {
  let inventory: InventoryService;

  beforeEach(() => {
    inventory = new InventoryService(createDefaultInventoryState());
  });

  it('initializes with default starter items', () => {
    expect(inventory.getItemCount('POKEBALL')).toBe(20);
    expect(inventory.getItemCount('POTION')).toBe(10);
    expect(inventory.hasItem('BICYCLE', 1)).toBe(true);
    expect(inventory.hasItem('MASTERBALL', 1)).toBe(true);
  });

  it('normalizes item IDs case-insensitively and canonicalizes slugs', () => {
    expect(inventory.getItemCount('poke_ball')).toBe(20);
    expect(inventory.getItemCount('pokeball')).toBe(20);
    expect(inventory.getItemCount('potion')).toBe(10);
  });

  it('adds and removes items with event notifications', () => {
    let notifyCount = 0;
    const unsub = inventory.subscribe(() => {
      notifyCount++;
    });

    inventory.addItem('POKEBALL', 5);
    expect(inventory.getItemCount('POKEBALL')).toBe(25);
    expect(notifyCount).toBe(1);

    const removed = inventory.removeItem('POKEBALL', 10);
    expect(removed).toBe(true);
    expect(inventory.getItemCount('POKEBALL')).toBe(15);
    expect(notifyCount).toBe(2);

    const overRemoved = inventory.removeItem('POKEBALL', 999);
    expect(overRemoved).toBe(false);
    expect(inventory.getItemCount('POKEBALL')).toBe(15);

    unsub();
  });

  it('categorizes items into pockets correctly', () => {
    const entries = inventory.getInventoryEntries();
    expect(entries.length).toBeGreaterThan(0);

    const balls = inventory.getPocketItems(2); // Pocket 2 = Balls
    expect(balls.some((b) => b.item.id === 'poke-ball' || b.item.name === 'Poké Ball')).toBe(true);

    const medicine = inventory.getPocketItems(1); // Pocket 1 = Medicine
    expect(medicine.some((m) => m.item.id === 'potion' || m.item.name === 'Potion')).toBe(true);
  });
});

describe('Domain Layer: PlayerService & Delegation', () => {
  let player: PlayerService;

  beforeEach(() => {
    player = new PlayerService(createDefaultPlayerProfile('Ash', 'male'));
  });

  it('initializes with default profile and wallet', () => {
    const profile = player.getProfile();
    expect(profile.name).toBe('Ash');
    expect(profile.money).toBe(3000);
    expect(profile.badges).toEqual([]);
  });

  it('manages money with validations', () => {
    player.addMoney(500);
    expect(player.getProfile().money).toBe(3500);

    const spent = player.spendMoney(1000);
    expect(spent).toBe(true);
    expect(player.getProfile().money).toBe(2500);

    const overspent = player.spendMoney(99999);
    expect(overspent).toBe(false);
    expect(player.getProfile().money).toBe(2500);
  });

  it('delegates inventory operations to InventoryService', () => {
    player.addItem('ULTRABALL', 3);
    expect(player.getItemCount('ULTRABALL')).toBeGreaterThanOrEqual(3);

    const hasUltra = player.hasItem('ULTRABALL', 2);
    expect(hasUltra).toBe(true);
  });
});

describe('Domain Layer: PartyService', () => {
  let party: PartyService;

  beforeEach(() => {
    party = new PartyService(createDefaultParty());
  });

  it('initializes with default party and leader', () => {
    expect(party.getPartySize()).toBe(1);
    expect(party.getLeader()?.name).toBe('Pikachu');
    expect(party.isPartyFull()).toBe(false);
  });

  it('adds and swaps members up to maximum party size', () => {
    const charizard = createPartyPokemon('CHARIZARD', 36);
    party.addPokemon(charizard);

    expect(party.getPartySize()).toBe(2);
    expect(party.getPokemon(1)?.name).toBe('Charizard');

    party.setLeader(1);
    expect(party.getLeader()?.name).toBe('Charizard');
    expect(party.getPokemon(1)?.name).toBe('Pikachu');
  });

  it('heals pokemon and whole party', () => {
    const pk = party.getLeader()!;
    pk.currentHp = 5;
    party.healPokemon(0, 10);
    expect(pk.currentHp).toBe(15);

    party.healAll();
    expect(pk.currentHp).toBe(pk.maxHp);
    expect(pk.status).toBe('none');
  });
});

describe('Domain Layer: SaveGameRepository Unified Persistence', () => {
  let mockAdapter: MockStorageAdapter;
  let player: PlayerService;
  let party: PartyService;
  let inventory: InventoryService;
  let repo: SaveGameRepository;

  beforeEach(() => {
    mockAdapter = new MockStorageAdapter();
    player = new PlayerService(createDefaultPlayerProfile('Red'));
    party = new PartyService(createDefaultParty());
    inventory = new InventoryService(createDefaultInventoryState());
    repo = new SaveGameRepository({
      adapter: mockAdapter,
      player,
      party,
      inventory,
    });
  });

  it('captures full state snapshot on save and writes to storage', () => {
    player.addMoney(1500);
    inventory.addItem('MASTERBALL', 5);
    party.addPokemon(createPartyPokemon('SNORLAX', 30));

    const savedData = repo.save('slot_test', {
      position: { gx: 10, gy: 20, direction: 2 },
    });

    expect(savedData.metadata.slotId).toBe('slot_test');
    expect(savedData.metadata.money).toBe(4500);
    expect(savedData.metadata.partyCount).toBe(2);
    expect(savedData.world?.position.gx).toBe(10);
    expect(repo.hasSave('slot_test')).toBe(true);
  });

  it('restores all domain services when load is executed', () => {
    // 1. Setup and save
    player.addMoney(2000);
    inventory.addItem('RARECANDY', 12);
    party.addPokemon(createPartyPokemon('GENGAR', 45));
    repo.save('slot_active');

    // 2. Modify active services (mutate/reset)
    player.reset();
    party.reset();
    inventory.reset();

    expect(player.getProfile().money).toBe(3000);
    expect(party.getPartySize()).toBe(1);
    expect(inventory.getItemCount('RARECANDY')).toBe(3);

    // 3. Load back
    const loaded = repo.load('slot_active');
    expect(loaded).not.toBeNull();
    expect(player.getProfile().money).toBe(5000);
    expect(party.getPartySize()).toBe(2);
    expect(party.getPokemon(1)?.name).toBe('Gengar');
    expect(inventory.getItemCount('RARECANDY')).toBe(15);
  });

  it('lists save slots and handles deletion', () => {
    repo.save('slot_1');
    repo.save('slot_2');

    const slots = repo.listSaves();
    expect(slots.length).toBe(2);
    expect(slots.some((s) => s.slotId === 'slot_1')).toBe(true);
    expect(slots.some((s) => s.slotId === 'slot_2')).toBe(true);

    repo.deleteSave('slot_1');
    expect(repo.hasSave('slot_1')).toBe(false);
    expect(repo.listSaves().length).toBe(1);
  });
});

describe('Domain Layer: PcStorageService', () => {
  it('initializes with 24 boxes of 30 slots each', () => {
    const boxes = pcStorageService.getBoxes();
    expect(boxes.length).toBe(TOTAL_BOXES);
    expect(boxes[0].slots.length).toBe(BOX_CAPACITY);
    expect(boxes[0].name).toBe('Hộp 1');
  });

  it('deposits a Pokemon into the first available box slot', () => {
    const pika = createPartyPokemon('PIKACHU', 10);
    const res = pcStorageService.depositPokemon(pika);
    expect(res.success).toBe(true);
    expect(res.boxIndex).toBeGreaterThanOrEqual(0);
    expect(res.slotIndex).toBeGreaterThanOrEqual(0);

    const box = pcStorageService.getBox(res.boxIndex);
    expect(box.slots[res.slotIndex]?.name).toBe('Pikachu');
  });

  it('navigates between boxes and wraps around', () => {
    pcStorageService.setCurrentBoxIndex(0);
    expect(pcStorageService.getCurrentBoxIndex()).toBe(0);

    pcStorageService.nextBox();
    expect(pcStorageService.getCurrentBoxIndex()).toBe(1);

    pcStorageService.prevBox();
    expect(pcStorageService.getCurrentBoxIndex()).toBe(0);

    pcStorageService.prevBox();
    expect(pcStorageService.getCurrentBoxIndex()).toBe(TOTAL_BOXES - 1);
  });

  it('renames a box and updates its wallpaper', () => {
    pcStorageService.setBoxName(0, 'Kanto Stars');
    expect(pcStorageService.getBoxName(0)).toBe('Kanto Stars');

    pcStorageService.setBoxWallpaper(0, 15);
    expect(pcStorageService.getBox(0).wallpaperId).toBe(15);
  });

  it('withdraws and swaps Pokemon between party and box slots', () => {
    const mew = createPartyPokemon('MEW', 30);
    const depRes = pcStorageService.depositPokemon(mew, 2);
    expect(depRes.success).toBe(true);

    const box2 = pcStorageService.getBox(2);
    expect(box2.slots[depRes.slotIndex]?.name).toBe('Mew');

    // Withdraw Mew if party is not full
    const withRes = pcStorageService.withdrawPokemon(2, depRes.slotIndex);
    expect(withRes.success).toBe(true);
    expect(box2.slots[depRes.slotIndex]).toBeNull();
  });

  it('allows moving/dragging Pokemon from box into an empty party slot via moveOrSwap', () => {
    // Put a Pokemon in Box 0 Slot 5
    const eevee = createPartyPokemon('EEVEE', 15);
    const box0 = pcStorageService.getBox(0);
    box0.slots[5] = eevee;

    // Party currently has 1 or more Pokemon. Target party slot 3 (which is empty)
    const partySizeBefore = partyService.getParty().length;
    expect(partySizeBefore).toBeLessThan(6);

    const moveRes = pcStorageService.moveOrSwap(
      { location: 'box', slotIndex: 5, boxIndex: 0, pokemon: eevee },
      { location: 'party', slotIndex: 3 }
    );

    expect(moveRes.success).toBe(true);
    expect(box0.slots[5]).toBeNull();
    expect(partyService.getParty().length).toBe(partySizeBefore + 1);
    expect(partyService.getParty().some((p) => p.name === 'Eevee')).toBe(true);
  });

  it('allows moving/dragging Pokemon from party into an empty box slot via moveOrSwap', () => {
    // Add extra conscious Pokemon so we don't violate "cannot deposit last conscious" rule
    partyService.addPokemon(createPartyPokemon('SNORLAX', 30));
    const party = partyService.getParty();
    const lastIdx = party.length - 1;
    const toDeposit = party[lastIdx];
    const box0 = pcStorageService.getBox(0);
    box0.slots[12] = null; // ensure empty

    const moveRes = pcStorageService.moveOrSwap(
      { location: 'party', slotIndex: lastIdx, pokemon: toDeposit },
      { location: 'box', slotIndex: 12, boxIndex: 0 }
    );

    expect(moveRes.success).toBe(true);
    expect(box0.slots[12]?.name).toBe(toDeposit.name);
  });
});
