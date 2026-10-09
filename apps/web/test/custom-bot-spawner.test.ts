import { describe, it, expect, beforeEach } from 'vitest';
import { createBattler } from '../src/battle/battle-factory';
import { getMoveById, getAllMoves } from '../src/battle/moves-db';
import { inventoryService } from '../src/domain/inventory/inventory-service';
import { findItem, getItemById } from '../src/data/items-db';

describe('Custom Bot Battler & Overlay Cheat Tools', () => {
  beforeEach(() => {
    // Clean inventory for deterministic assertions
    const all = inventoryService.getAllItems();
    for (const [id, count] of Object.entries(all)) {
      inventoryService.removeItem(id, count);
    }
  });

  describe('Custom Bot Battler Spawner', () => {
    it('creates custom battler with specified species, level, shiny and custom ability', () => {
      const battler = createBattler(
        'GENGAR',
        60,
        false,
        undefined,
        true,
        undefined,
        undefined,
        'innerfocus'
      );

      expect(battler.speciesKey).toBe('GENGAR');
      expect(battler.level).toBe(60);
      expect(battler.isShiny).toBe(true);
      expect(battler.ability).toBe('innerfocus');
      expect(battler.currentHp).toBeGreaterThan(0);
      expect(battler.moves.length).toBeGreaterThan(0);
    });

    it('creates custom battler with specified 4 custom test moves', () => {
      const fakeOut = getMoveById('fake_out');
      const bite = getMoveById('bite');
      const airSlash = getMoveById('air_slash');
      const ironHead = getMoveById('iron_head');

      expect(fakeOut).toBeDefined();
      expect(bite).toBeDefined();
      expect(airSlash).toBeDefined();
      expect(ironHead).toBeDefined();

      const customMoves = [fakeOut!, bite!, airSlash!, ironHead!];
      const battler = createBattler(
        'MACHAMP',
        50,
        false,
        undefined,
        false,
        undefined,
        undefined,
        'steadfast',
        customMoves
      );

      expect(battler.speciesKey).toBe('MACHAMP');
      expect(battler.ability).toBe('steadfast');
      expect(battler.moves).toHaveLength(4);
      expect(battler.moves[0].id).toBe('fake_out');
      expect(battler.moves[1].id).toBe('bite');
      expect(battler.moves[2].id).toBe('air_slash');
      expect(battler.moves[3].id).toBe('iron_head');
    });

    it('creates custom battler with confusion moveset preset', () => {
      const confuseRay = getMoveById('confuse_ray');
      const sweetKiss = getMoveById('sweet_kiss');
      const swagger = getMoveById('swagger');
      const waterPulse = getMoveById('water_pulse');

      const customMoves = [confuseRay!, sweetKiss!, swagger!, waterPulse!];
      const battler = createBattler(
        'PIKACHU',
        45,
        false,
        undefined,
        false,
        undefined,
        undefined,
        'owntempo',
        customMoves
      );

      expect(battler.ability).toBe('owntempo');
      expect(battler.moves.map((m) => m.id)).toEqual([
        'confuse_ray',
        'sweet_kiss',
        'swagger',
        'water_pulse',
      ]);
    });

    it('getAllMoves returns full move roster', () => {
      const moves = getAllMoves();
      expect(moves.length).toBeGreaterThan(100);
      const tackle = moves.find((m) => m.id === 'tackle');
      expect(tackle).toBeDefined();
    });
  });

  describe('Inventory Cheat & Bag Add Items', () => {
    it('adds persim berry and lum berry to inventory correctly', () => {
      expect(inventoryService.getItemCount('persim-berry')).toBe(0);

      inventoryService.addItem('persim-berry', 10);
      expect(inventoryService.getItemCount('persim-berry')).toBe(10);
      expect(inventoryService.hasItem('persim-berry', 5)).toBe(true);

      inventoryService.addItem('lum-berry', 15);
      expect(inventoryService.getItemCount('lum-berry')).toBe(15);
    });

    it('adds medicine items (full restore, rare candy) by ID or slug', () => {
      inventoryService.addItem('full-restore', 10);
      expect(inventoryService.getItemCount('full-restore')).toBe(10);

      inventoryService.addItem('rare-candy', 20);
      expect(inventoryService.getItemCount('rare-candy')).toBe(20);
    });

    it('correctly maps findItem and getItemById from items-db', () => {
      const persim = getItemById('persim-berry');
      expect(persim).toBeDefined();
      expect(persim?.nameVi || persim?.name).toBeTruthy();

      const lum = findItem('lum-berry');
      expect(lum).toBeDefined();
      expect(lum?.id).toBe('lum-berry');
    });
  });

  describe('Decoupled Debug Overlay & Remote Bridge', () => {
    it('mounts to container, wires remote actions via bridge, and cleans up on destroy', async () => {
      class MockElement {
        public id: string = '';
        public className: string = '';
        public value: string = '';
        public innerText: string = '';
        public innerHTML: string = '';
        public style: Record<string, string> = {};
        public dataset: Record<string, string> = {};
        public children: MockElement[] = [];
        public listeners: Record<string, ((e: any) => void)[]> = {};

        constructor(public tagName: string = 'DIV') {}

        public get classList() {
          return {
            contains: (cls: string) => this.className.includes(cls),
            toggle: (cls: string) => {
              if (this.className.includes(cls)) {
                this.className = this.className.replace(cls, '').trim();
                return false;
              } else {
                this.className = (this.className + ' ' + cls).trim();
                return true;
              }
            },
            add: (cls: string) => {
              if (!this.className.includes(cls)) this.className += ' ' + cls;
            },
            remove: (cls: string) => {
              this.className = this.className.replace(cls, '').trim();
            },
          };
        }

        public addEventListener(evt: string, fn: (e: any) => void) {
          (this.listeners[evt] ??= []).push(fn);
        }

        public click() {
          this.listeners['click']?.forEach((fn) => fn({}));
        }

        public querySelector(sel: string): MockElement | null {
          const clean = sel.replace(/^[#.]/, '');
          if (this.id === clean || this.className.includes(clean)) return this;
          for (const child of this.children) {
            const res = child.querySelector(sel);
            if (res) return res;
          }
          return null;
        }

        public querySelectorAll(sel: string): MockElement[] {
          const list: MockElement[] = [];
          const clean = sel.replace(/^[#.]/, '');
          if (this.className.includes(clean)) list.push(this);
          for (const child of this.children) {
            list.push(...child.querySelectorAll(sel));
          }
          return list;
        }

        public insertAdjacentHTML(_pos: string, _html: string) {
          const overlay = new MockElement('ASIDE');
          overlay.id = 'testOverlay';
          overlay.className = 'test-overlay';

          const btnPresetFlinch = new MockElement('BUTTON');
          btnPresetFlinch.id = 'btnPresetFlinch';
          overlay.children.push(btnPresetFlinch);

          const btnStartBot = new MockElement('BUTTON');
          btnStartBot.id = 'btnStartBotBattle';
          overlay.children.push(btnStartBot);

          const btnQuickPersim = new MockElement('BUTTON');
          btnQuickPersim.id = 'btnQuickAddPersim';
          overlay.children.push(btnQuickPersim);

          const btnResetParty = new MockElement('BUTTON');
          btnResetParty.id = 'btnResetPartyPokemon';
          overlay.children.push(btnResetParty);

          const selectBotMove1 = new MockElement('SELECT');
          selectBotMove1.id = 'selectBotMove1';
          selectBotMove1.value = 'fake_out';
          overlay.children.push(selectBotMove1);

          const selectBotSpecies = new MockElement('SELECT');
          selectBotSpecies.id = 'selectBotSpecies';
          selectBotSpecies.value = 'GENGAR';
          overlay.children.push(selectBotSpecies);

          const inputBotLevel = new MockElement('INPUT');
          inputBotLevel.id = 'inputBotLevel';
          inputBotLevel.value = '50';
          overlay.children.push(inputBotLevel);

          const selectBotForm = new MockElement('SELECT');
          selectBotForm.id = 'selectBotForm';
          selectBotForm.value = 'normal';
          overlay.children.push(selectBotForm);

          const selectBotAbility = new MockElement('SELECT');
          selectBotAbility.id = 'selectBotAbility';
          selectBotAbility.value = 'auto';
          overlay.children.push(selectBotAbility);

          overlay.parentNode = this;
          this.children.push(overlay);
        }

        public parentNode: MockElement | null = null;
        public remove() {
          if (this.parentNode) {
            this.parentNode.children = this.parentNode.children.filter((c) => c !== this);
          }
        }
      }

      const container = new MockElement('DIV');

      let customBotConfigPassed: any = null;
      let addedItem: { id: string; count: number } | null = null;
      let resetPartyCalled = false;

      const mockBridge: any = {
        startTestBattle: () => {},
        startCustomBotBattle: (cfg: any) => {
          customBotConfigPassed = cfg;
        },
        addItemToBag: (itemId: string, count: number) => {
          addedItem = { id: itemId, count };
        },
        addStarterItems: () => {},
        addAllBalls: () => {},
        openBag: () => {},
        addPartyPokemon: () => {},
        addRandomPartyPokemon: () => {},
        fillPartyPokemon: () => {},
        resetPartyPokemon: () => {
          resetPartyCalled = true;
        },
        spawnShinyWild: () => {},
        getPartySize: () => 2,
        subscribePartyChange: () => () => {},
        regenerateMap: () => {},
        resetPlayerPosition: () => {},
        replayIntro: () => {},
        saveGame: () => {},
        loadGame: () => {},
        setRenderOption: () => {},
        setBerryCycle: () => {},
        setBerryStageOverride: () => {},
        isCollisionEnabled: () => true,
      };

      const { DebugOverlayController } = await import('../src/debug');
      const controller = new DebugOverlayController(mockBridge);
      controller.mount(container as any);

      const overlay = container.querySelector('#testOverlay');
      expect(overlay).not.toBeNull();

      // Test preset button click triggers select update
      const btnPresetFlinch = container.querySelector('#btnPresetFlinch');
      btnPresetFlinch?.click();
      const move1 = container.querySelector('#selectBotMove1');
      expect(move1?.value).toBe('fake_out');

      // Test start bot battle button calls bridge remotely
      const btnStartBot = container.querySelector('#btnStartBotBattle');
      btnStartBot?.click();
      expect(customBotConfigPassed).not.toBeNull();
      expect(customBotConfigPassed.moves).toContain('fake_out');

      // Test quick berry button calls bridge remotely
      const btnQuickPersim = container.querySelector('#btnQuickAddPersim');
      btnQuickPersim?.click();
      expect(addedItem).toEqual({ id: 'persim-berry', count: 10 });

      // Test reset party button calls bridge remotely
      const btnResetParty = container.querySelector('#btnResetPartyPokemon');
      btnResetParty?.click();
      expect(resetPartyCalled).toBe(true);

      // Test collapse toggle
      expect(controller.isCollapsed()).toBe(false);
      controller.toggleCollapse();
      expect(controller.isCollapsed()).toBe(true);

      // Test destroy cleanup
      controller.destroy();
      expect(container.querySelector('#testOverlay')).toBeNull();
    });
  });
});
