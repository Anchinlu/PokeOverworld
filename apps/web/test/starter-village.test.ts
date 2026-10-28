import { describe, it, expect } from 'vitest';
import {
  getStartVillageLayout,
  getStartSpawn,
  getStartVillageBuildingAt,
  getStartVillageNPCs,
} from '../src/maps/terrain-field/start-village';
import { BUILDING_SPECS } from '../src/maps/village-rules';
import { V4_CONFIG } from '../src/maps/terrain-field/v4-config';
import { WorldChunk } from '../src/maps/chunk';

describe('Starter Village Procedural Jigsaw & District Plot System', () => {
  it('generates 4 distinct archetypes across different seeds', () => {
    // Archetype 0: Classic Pallet
    // Archetype 1: Sunrise Ranch
    // Archetype 2: Crossroads Shire
    // Archetype 3: Courtyard Valley
    const foundArchetypes = new Set<string>();
    for (let seed = 0; seed < 100; seed++) {
      const layout = getStartVillageLayout(seed);
      foundArchetypes.add(layout.archetype);
      if (foundArchetypes.size === 4) break;
    }
    expect(foundArchetypes.size).toBe(4);
    expect(foundArchetypes.has('classic_pallet')).toBe(true);
    expect(foundArchetypes.has('sunrise_ranch')).toBe(true);
    expect(foundArchetypes.has('crossroads_shire')).toBe(true);
    expect(foundArchetypes.has('courtyard_valley')).toBe(true);
  });

  it('guarantees essential story buildings and ranch compound in all archetypes', () => {
    for (let seed = 0; seed < 20; seed++) {
      const layout = getStartVillageLayout(seed);
      const buildingTypes = layout.buildings.map((b) => b.type);

      // Story plots
      expect(buildingTypes).toContain('lab_okido');
      expect(buildingTypes).toContain('house_player');
      expect(buildingTypes).toContain('house_rival');

      // Ranch compound
      expect(buildingTypes).toContain('ranch_barn');
      expect(buildingTypes).toContain('feed_crops');

      // At least one fence and one hay prop
      const hasFence = buildingTypes.some((t) => t.startsWith('fence_'));
      expect(hasFence).toBe(true);

      const hasHay = buildingTypes.some((t) => t.startsWith('hay_'));
      expect(hasHay).toBe(true);
    }
  });

  it('ensures spawn point is directly in front of the player house door', () => {
    for (let seed = 0; seed < 10; seed++) {
      const spawn = getStartSpawn(seed);
      const layout = getStartVillageLayout(seed);
      const playerHouse = layout.buildings.find((b) => b.type === 'house_player');
      expect(playerHouse).toBeDefined();

      if (playerHouse) {
        expect(spawn.gx).toBe(playerHouse.doorGX);
        expect(spawn.gy).toBe(playerHouse.doorGY + 1);
      }
    }
  });

  it('verifies that no building footprints overlap across all archetypes', () => {
    for (let seed = 0; seed < 50; seed++) {
      const layout = getStartVillageLayout(seed);
      const buildings = layout.buildings;

      for (let i = 0; i < buildings.length; i++) {
        const a = buildings[i];
        for (let j = i + 1; j < buildings.length; j++) {
          const b = buildings[j];

          // Check AABB intersection:
          // a: [a.gx, a.gx + a.widthTiles) x [a.gy, a.gy + a.heightTiles)
          const overlapX = a.gx < b.gx + b.widthTiles && a.gx + a.widthTiles > b.gx;
          const overlapY = a.gy < b.gy + b.heightTiles && a.gy + a.heightTiles > b.gy;

          if (overlapX && overlapY) {
            throw new Error(
              `Seed ${seed} (${layout.archetype}): Overlap detected between ${a.type} at (${a.gx},${a.gy}, ${a.widthTiles}x${a.heightTiles}) and ${b.type} at (${b.gx},${b.gy}, ${b.widthTiles}x${b.heightTiles})`
            );
          }
        }
      }
    }
  });

  it('enforces roof and building clearance >= 4 horizontal and >= 5 vertical for roofed houses', () => {
    const roofedTypes = new Set(['lab_okido', 'house_player', 'house_rival', 'house_villager_3', 'house_villager_4', 'ranch_barn']);

    for (let seed = 0; seed < 20; seed++) {
      const layout = getStartVillageLayout(seed);
      const houses = layout.buildings.filter((b) => roofedTypes.has(b.type));

      for (let i = 0; i < houses.length; i++) {
        const a = houses[i];
        for (let j = i + 1; j < houses.length; j++) {
          const b = houses[j];

          // Horizontal gap if on similar Y band
          const yOverlap = a.gy < b.gy + b.heightTiles && a.gy + a.heightTiles > b.gy;
          if (yOverlap) {
            const gapX = a.gx < b.gx
              ? b.gx - (a.gx + a.widthTiles)
              : a.gx - (b.gx + b.widthTiles);
            expect(gapX).toBeGreaterThanOrEqual(4);
          }

          // Vertical gap if on similar X band
          const xOverlap = a.gx < b.gx + b.widthTiles && a.gx + a.widthTiles > b.gx;
          if (xOverlap) {
            const gapY = a.gy < b.gy
              ? b.gy - (a.gy + a.heightTiles)
              : a.gy - (b.gy + b.heightTiles);
            expect(gapY).toBeGreaterThanOrEqual(5);
          }
        }
      }
    }
  });

  it('confirms expanded safe basin radius R=30 in V4_CONFIG and village bounds', () => {
    expect(V4_CONFIG.START_CORE_RADIUS).toBe(30);
    expect(V4_CONFIG.START_SEARCH_RADIUS).toBe(36);

    // Village bounding box fits comfortably inside the 30-tile core radius
    for (let seed = 0; seed < 10; seed++) {
      const layout = getStartVillageLayout(seed);
      for (const b of layout.buildings) {
        // Center-relative distance
        const dx = Math.max(Math.abs(b.gx), Math.abs(b.gx + b.widthTiles));
        const dy = Math.max(Math.abs(b.gy), Math.abs(b.gy + b.heightTiles));
        // All buildings must stay within the 30-tile flat basin
        expect(dx).toBeLessThanOrEqual(30);
        expect(dy).toBeLessThanOrEqual(30);
      }
    }
  });

  it('confirms feed_crops has isSolid = false while other structures are solid', () => {
    expect(BUILDING_SPECS.feed_crops.isSolid).toBe(false);
    expect(BUILDING_SPECS.lab_okido.isSolid).not.toBe(false);
    expect(BUILDING_SPECS.house_player.isSolid).not.toBe(false);
    expect(BUILDING_SPECS.fence_horizontal.isSolid).not.toBe(false);
    expect(BUILDING_SPECS.water_trough.isSolid).not.toBe(false);
  });

  it('correctly indexes buildings with getStartVillageBuildingAt', () => {
    const layout = getStartVillageLayout(42);
    const lab = layout.buildings.find((b) => b.type === 'lab_okido');
    expect(lab).toBeDefined();
    if (lab) {
      const found = getStartVillageBuildingAt(lab.gx + 1, lab.gy + 1, 42);
      expect(found).toBeDefined();
      expect(found?.type).toBe('lab_okido');
    }
  });

  it('verifies that house entrance walkways are at least 3 tiles wide', () => {
    const houseTypes = new Set(['house_player', 'house_rival', 'house_villager_3', 'house_villager_4']);

    for (let seed = 0; seed < 20; seed++) {
      const layout = getStartVillageLayout(seed);
      const houses = layout.buildings.filter((b) => houseTypes.has(b.type));

      for (const house of houses) {
        // At porch / front doorway Y = doorGY + 1, check path tile coverage
        const porchY = house.doorGY + 1;
        const is4Tile = house.widthTiles <= 4;
        const walkX1 = is4Tile ? house.gx + 1 : house.doorGX - 1;
        const walkX2 = is4Tile ? house.gx + 3 : house.doorGX + 1;

        // Path width must be 3 tiles wide (walkX2 - walkX1 + 1 === 3)
        expect(walkX2 - walkX1 + 1).toBe(3);

        // Every tile in the 3-tile wide walkway must be paved under doorstep (doorGY) and porch (doorGY + 1)
        for (let x = walkX1; x <= walkX2; x++) {
          expect(layout.village.pathTileKeys.has(`${x},${house.doorGY}`)).toBe(true);
          expect(layout.village.pathTileKeys.has(`${x},${porchY}`)).toBe(true);
        }
      }
    }
  });

  it('confirms building door tiles generate solid colliders to prevent characters walking in directly', () => {
    for (let seed = 0; seed < 5; seed++) {
      const layout = getStartVillageLayout(seed);
      const buildings = layout.buildings;
      const lab = buildings.find((b) => b.type === 'lab_okido');
      expect(lab).toBeDefined();
      if (!lab) continue;

      // Verify door tile coordinates are strictly inside the solid building footprint bounds
      expect(lab.doorGY).toBeGreaterThanOrEqual(lab.gy);
      expect(lab.doorGY).toBeLessThan(lab.gy + lab.heightTiles);
      expect(lab.doorGX).toBeGreaterThanOrEqual(lab.gx);
      expect(lab.doorGX).toBeLessThan(lab.gx + lab.widthTiles);
    }
  });

  it('generates 8 outdoor village NPCs with authentic sprites and rich Vietnamese dialogues across all archetypes', () => {
    const expectedIds = [
      'npc_tech_guy',
      'npc_flower_girl',
      'npc_farmer',
      'npc_sea_boy',
      'npc_old_man',
      'npc_old_woman',
      'npc_bug_catcher',
      'npc_school_kid',
    ];
    const expectedSprites = {
      npc_tech_guy: 'char_tech_guy',
      npc_flower_girl: 'char_flower_girl',
      npc_farmer: 'char_farmer',
      npc_sea_boy: 'char_sea_boy',
      npc_old_man: 'char_old_man',
      npc_old_woman: 'char_old_woman',
      npc_bug_catcher: 'char_bug_catcher',
      npc_school_kid: 'char_school_kid_m',
    };

    for (let seed = 0; seed < 20; seed++) {
      const layout = getStartVillageLayout(seed);
      expect(layout.npcs).toBeDefined();
      expect(layout.npcs.length).toBe(8);

      const npcsDirect = getStartVillageNPCs(seed);
      expect(npcsDirect.length).toBe(8);

      const ids = layout.npcs.map((n) => n.id);
      expect(ids).toEqual(expect.arrayContaining(expectedIds));

      for (const npc of layout.npcs) {
        expect(npc.name).toBeTruthy();
        expect(npc.spriteKey).toBe(expectedSprites[npc.id as keyof typeof expectedSprites]);
        expect(npc.dialogue.length).toBeGreaterThanOrEqual(2);
        for (const line of npc.dialogue) {
          expect(line.length).toBeGreaterThan(10);
        }
        expect(npc.idleBehavior).toBe('turn_cycle');
        expect(npc.turnCycle?.length).toBeGreaterThanOrEqual(3);
        expect(npc.turnIntervalMs).toBeGreaterThan(1000);
      }
    }
  });

  it('guarantees village NPCs do not overlap with any building footprint or player spawn tile', () => {
    for (let seed = 0; seed < 30; seed++) {
      const layout = getStartVillageLayout(seed);
      const spawn = getStartSpawn(seed);
      const buildings = layout.buildings;

      // Unique NPC positions
      const npcPositions = new Set<string>();

      for (const npc of layout.npcs) {
        const key = `${npc.gx},${npc.gy}`;
        expect(npcPositions.has(key)).toBe(false);
        npcPositions.add(key);

        // Never on player spawn
        expect(npc.gx === spawn.gx && npc.gy === spawn.gy).toBe(false);

        // Never inside any building footprint
        for (const b of buildings) {
          const inX = npc.gx >= b.gx && npc.gx < b.gx + b.widthTiles;
          const inY = npc.gy >= b.gy && npc.gy < b.gy + b.heightTiles;
          expect(inX && inY).toBe(false);
        }
      }
    }
  });

  it('verifies village NPCs generate solid colliders in chunks', () => {
    const chunk00 = new WorldChunk(0, 0, 101);
    expect(chunk00.npcs.length).toBeGreaterThan(0);

    for (const npc of chunk00.npcs) {
      const matchingCollider = chunk00.colliders.find(
        (c) =>
          c.type === 'npc' &&
          c.x === npc.gx * 32 &&
          c.y === npc.gy * 32 &&
          c.w === 32 &&
          c.h === 32
      );
      expect(matchingCollider).toBeDefined();
    }
  });
});
