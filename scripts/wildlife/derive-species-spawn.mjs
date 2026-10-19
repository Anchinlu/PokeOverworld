#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const pokemonDbPath = path.join(rootDir, 'packages/game-data/pokemon-db.json');
const evolutionRulesPath = path.join(rootDir, 'apps/web/src/domain/pokemon/evolution-rules.ts');
const outputDir = path.join(rootDir, 'packages/game-data/wildlife');
const outputPath = path.join(outputDir, 'species-spawn.json');

const pokemonDb = JSON.parse(fs.readFileSync(pokemonDbPath, 'utf8'));
const evoContent = fs.readFileSync(evolutionRulesPath, 'utf8');

// Parse GEN1_EVOLUTIONS roughly to map evolution stages and targets
const evoMap = new Map(); // fromSpecies -> [{ target, method, requiredLevel }]
const evoRegex = /([A-Z0-9_]+):\s*\[\s*\{[\s\S]*?targetSpeciesKey:\s*'([A-Z0-9_]+)'[\s\S]*?method:\s*'([a-z]+)'(?:[\s\S]*?requiredLevel:\s*(\d+))?/g;
let match;
while ((match = evoRegex.exec(evoContent)) !== null) {
  const fromKey = match[1];
  const targetKey = match[2];
  const method = match[3];
  const requiredLevel = match[4] ? parseInt(match[4], 10) : undefined;
  if (!evoMap.has(fromKey)) {
    evoMap.set(fromKey, []);
  }
  evoMap.get(fromKey).push({ targetKey, method, requiredLevel });
}

// Inverted map to find predecessors
const evolvesFrom = new Map();
for (const [from, targets] of evoMap.entries()) {
  for (const t of targets) {
    evolvesFrom.set(t.targetKey, from);
  }
}

// Special species flags
const SPECIAL_FLAGS = {
  // Legendary birds & Mewtwo
  ARTICUNO: ['legendary'],
  ZAPDOS: ['legendary'],
  MOLTRES: ['legendary'],
  MEWTWO: ['legendary'],
  // Mythical
  MEW: ['mythical'],
  // Starters
  BULBASAUR: ['starter'],
  IVYSAUR: ['starter'],
  VENUSAUR: ['starter'],
  CHARMANDER: ['starter'],
  CHARMELEON: ['starter'],
  CHARIZARD: ['starter'],
  SQUIRTLE: ['starter'],
  WARTORTLE: ['starter'],
  BLASTOISE: ['starter'],
  // Fossils
  OMANYTE: ['fossil'],
  OMASTAR: ['fossil'],
  KABUTO: ['fossil'],
  KABUTOPS: ['fossil'],
  AERODACTYL: ['fossil'],
  // Static encounter
  SNORLAX: ['static'],
  // Stone & Trade evolutions (no wild spawns)
  RAICHU: ['no_wild'],
  NIDOQUEEN: ['no_wild'],
  NIDOKING: ['no_wild'],
  CLEFABLE: ['no_wild'],
  NINETALES: ['no_wild'],
  VILEPLUME: ['no_wild'],
  ARCANINE: ['no_wild'],
  POLIWRATH: ['no_wild'],
  ALAKAZAM: ['no_wild'],
  MACHAMP: ['no_wild'],
  VICTREEBEL: ['no_wild'],
  GOLEM: ['no_wild'],
  CLOYSTER: ['no_wild'],
  GENGAR: ['no_wild'],
  EXEGGUTOR: ['no_wild'],
  STARMIE: ['no_wild'],
  VAPOREON: ['no_wild'],
  JOLTEON: ['no_wild'],
  FLAREON: ['no_wild'],
};

// Social grouping mappings
const SOCIAL_MAPPING = {
  // Flocks (birds)
  PIDGEY: 'flock',
  PIDGEOTTO: 'flock',
  SPEAROW: 'flock',
  FEAROW: 'pair',
  DODUO: 'flock',
  DODRIO: 'pair',
  ZUBAT: 'flock',
  GOLBAT: 'flock',
  // Herds (grazers / pack rodents)
  RATTATA: 'herd',
  RATICATE: 'pair',
  NIDORANfE: 'herd',
  NIDORINA: 'pair',
  NIDORANmA: 'herd',
  NIDORINO: 'pair',
  MANKEY: 'herd',
  PRIMEAPE: 'pair',
  PONYTA: 'herd',
  RAPIDASH: 'pair',
  GEODUDE: 'herd',
  GRAVELER: 'pair',
  MAGIKARP: 'flock',
  TENTACOOL: 'flock',
  SEEL: 'herd',
  TAUROS: 'herd',
  // Pairs
  PIKACHU: 'pair',
  DROWZEE: 'pair',
  BELLSPROUT: 'pair',
  ODDISH: 'pair',
  POLIWAG: 'pair',
  KRABBY: 'pair',
  SHELLDER: 'pair',
  DIGLETT: 'pair',
  CUBONE: 'solitary',
  // Cocoon/slow bugs
  CATERPIE: 'herd',
  METAPOD: 'solitary',
  BUTTERFREE: 'pair',
  WEEDLE: 'herd',
  KAKUNA: 'solitary',
  BEEDRILL: 'flock',
};

// Apex species definitions (only level-based final forms that can lead a herd in nature)
const APEX_SPECIES = {
  PIDGEY: 'PIDGEOT',
  PIDGEOTTO: 'PIDGEOT',
  SPEAROW: 'FEAROW',
  RATTATA: 'RATICATE',
  ZUBAT: 'GOLBAT',
  EKANS: 'ARBOK',
  SANDSHREW: 'SANDSLASH',
  CATERPIE: 'BUTTERFREE',
  METAPOD: 'BUTTERFREE',
  WEEDLE: 'BEEDRILL',
  KAKUNA: 'BEEDRILL',
  GEODUDE: 'GRAVELER',
  MACHOP: 'MACHOKE',
  DODUO: 'DODRIO',
  PONYTA: 'RAPIDASH',
  MAGNEMITE: 'MAGNETON',
  GRIMER: 'MUK',
  KOFFING: 'WEEZING',
  RHYHORN: 'RHYDON',
  GOLDEEN: 'SEAKING',
  MAGIKARP: 'GYARADOS',
  DRATINI: 'DRAGONITE',
  DRAGONAIR: 'DRAGONITE',
};

// Curated habitats for Gen 1 species (Section 3)
const HABITAT_CONFIG = {
  // Dense / Light Forest
  CATERPIE: [{ biome: 'dense_forest', context: 'forest_floor', affinity: 1.0 }, { biome: 'light_forest', context: 'tall_grass', affinity: 0.8 }],
  METAPOD: [{ biome: 'dense_forest', context: 'forest_floor', affinity: 0.9 }, { biome: 'light_forest', context: 'tall_grass', affinity: 0.6 }],
  BUTTERFREE: [{ biome: 'dense_forest', context: 'forest_floor', affinity: 0.7 }, { biome: 'meadow', context: 'tall_grass', affinity: 0.5 }],
  WEEDLE: [{ biome: 'dense_forest', context: 'forest_floor', affinity: 1.0 }, { biome: 'light_forest', context: 'tall_grass', affinity: 0.8 }],
  KAKUNA: [{ biome: 'dense_forest', context: 'forest_floor', affinity: 0.9 }, { biome: 'light_forest', context: 'tall_grass', affinity: 0.6 }],
  BEEDRILL: [{ biome: 'dense_forest', context: 'forest_floor', affinity: 0.7 }, { biome: 'light_forest', context: 'tall_grass', affinity: 0.5 }],
  PIKACHU: [{ biome: 'dense_forest', context: 'forest_floor', affinity: 1.0 }, { biome: 'light_forest', context: 'tall_grass', affinity: 0.7 }],
  ODDISH: [{ biome: 'dense_forest', context: 'forest_floor', affinity: 0.9 }, { biome: 'meadow', context: 'tall_grass', affinity: 0.7 }],
  GLOOM: [{ biome: 'dense_forest', context: 'forest_floor', affinity: 0.8 }, { biome: 'wetland', context: 'tall_grass', affinity: 0.6 }],
  PARAS: [{ biome: 'dense_forest', context: 'forest_floor', affinity: 1.0 }, { biome: 'light_forest', context: 'forest_floor', affinity: 0.7 }],
  PARASECT: [{ biome: 'dense_forest', context: 'forest_floor', affinity: 0.8 }],
  VENONAT: [{ biome: 'dense_forest', context: 'forest_floor', affinity: 0.9 }, { biome: 'light_forest', context: 'tall_grass', affinity: 0.7 }],
  VENOMOTH: [{ biome: 'dense_forest', context: 'forest_floor', affinity: 0.6 }],
  BELLSPROUT: [{ biome: 'dense_forest', context: 'tall_grass', affinity: 0.9 }, { biome: 'meadow', context: 'tall_grass', affinity: 0.8 }],
  WEEPINBELL: [{ biome: 'dense_forest', context: 'tall_grass', affinity: 0.7 }],
  EXEGGCUTE: [{ biome: 'dense_forest', context: 'forest_floor', affinity: 0.8 }, { biome: 'light_forest', context: 'tall_grass', affinity: 0.6 }],
  SCYTHER: [{ biome: 'dense_forest', context: 'tall_grass', affinity: 0.7 }, { biome: 'light_forest', context: 'tall_grass', affinity: 0.5 }],
  PINSIR: [{ biome: 'dense_forest', context: 'forest_floor', affinity: 0.7 }, { biome: 'light_forest', context: 'forest_floor', affinity: 0.5 }],

  // Meadow & Plains
  PIDGEY: [{ biome: 'meadow', context: 'tall_grass', affinity: 1.0 }, { biome: 'light_forest', context: 'tall_grass', affinity: 0.8 }],
  PIDGEOTTO: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.8 }, { biome: 'light_forest', context: 'tall_grass', affinity: 0.6 }],
  PIDGEOT: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.4 }],
  RATTATA: [{ biome: 'meadow', context: 'tall_grass', affinity: 1.0 }, { biome: 'light_forest', context: 'tall_grass', affinity: 0.7 }],
  RATICATE: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.7 }],
  SPEAROW: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.9 }, { biome: 'dryland', context: 'walkable_ground', affinity: 0.6 }],
  FEAROW: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.6 }, { biome: 'dryland', context: 'walkable_ground', affinity: 0.5 }],
  NIDORANfE: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.9 }, { biome: 'light_forest', context: 'tall_grass', affinity: 0.6 }],
  NIDORINA: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.7 }],
  NIDORANmA: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.9 }, { biome: 'light_forest', context: 'tall_grass', affinity: 0.6 }],
  NIDORINO: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.7 }],
  VULPIX: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.7 }],
  JIGGLYPUFF: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.8 }],
  WIGGLYTUFF: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.4 }],
  MEOWTH: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.8 }, { biome: 'light_forest', context: 'tall_grass', affinity: 0.6 }],
  PERSIAN: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.5 }],
  MANKEY: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.8 }, { biome: 'hill_edge', context: 'walkable_ground', affinity: 0.7 }],
  PRIMEAPE: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.5 }, { biome: 'hill_edge', context: 'walkable_ground', affinity: 0.6 }],
  GROWLITHE: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.8 }],
  PONYTA: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.9 }, { biome: 'dryland', context: 'walkable_ground', affinity: 0.7 }],
  RAPIDASH: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.5 }],
  FARFETCHD: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.6 }],
  DODUO: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.9 }, { biome: 'dryland', context: 'walkable_ground', affinity: 0.6 }],
  DODRIO: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.5 }],
  CHANSEY: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.4 }],
  TANGELA: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.6 }, { biome: 'wetland', context: 'tall_grass', affinity: 0.7 }],
  KANGASKHAN: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.5 }],
  TAUROS: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.8 }],
  EEVEE: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.6 }],
  PORYGON: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.3 }],

  // Hills & Rocks
  GEODUDE: [{ biome: 'hill_edge', context: 'rock', affinity: 1.0 }, { biome: 'hill_edge', context: 'walkable_ground', affinity: 0.8 }],
  GRAVELER: [{ biome: 'hill_edge', context: 'rock', affinity: 0.8 }, { biome: 'hill_edge', context: 'walkable_ground', affinity: 0.6 }],
  MACHOP: [{ biome: 'hill_edge', context: 'walkable_ground', affinity: 0.9 }, { biome: 'hill_edge', context: 'rock', affinity: 0.7 }],
  MACHOKE: [{ biome: 'hill_edge', context: 'walkable_ground', affinity: 0.6 }],
  ONIX: [{ biome: 'hill_edge', context: 'rock', affinity: 0.8 }],
  RHYHORN: [{ biome: 'hill_edge', context: 'rock', affinity: 0.8 }, { biome: 'dryland', context: 'walkable_ground', affinity: 0.7 }],
  RHYDON: [{ biome: 'hill_edge', context: 'rock', affinity: 0.5 }],
  ZUBAT: [{ biome: 'hill_edge', context: 'rock', affinity: 1.0 }, { biome: 'dense_forest', context: 'forest_floor', affinity: 0.6 }],
  GOLBAT: [{ biome: 'hill_edge', context: 'rock', affinity: 0.7 }],
  CLEFAIRY: [{ biome: 'hill_edge', context: 'walkable_ground', affinity: 0.7 }],

  // Dryland
  SANDSHREW: [{ biome: 'dryland', context: 'sand', affinity: 1.0 }, { biome: 'dryland', context: 'walkable_ground', affinity: 0.8 }],
  SANDSLASH: [{ biome: 'dryland', context: 'sand', affinity: 0.7 }],
  EKANS: [{ biome: 'dryland', context: 'walkable_ground', affinity: 0.9 }, { biome: 'meadow', context: 'tall_grass', affinity: 0.6 }],
  ARBOK: [{ biome: 'dryland', context: 'walkable_ground', affinity: 0.6 }],
  DIGLETT: [{ biome: 'dryland', context: 'sand', affinity: 0.9 }, { biome: 'hill_edge', context: 'walkable_ground', affinity: 0.7 }],
  DUGTRIO: [{ biome: 'dryland', context: 'sand', affinity: 0.6 }],
  CUBONE: [{ biome: 'dryland', context: 'walkable_ground', affinity: 0.8 }],
  MAROWAK: [{ biome: 'dryland', context: 'walkable_ground', affinity: 0.5 }],

  // Wetland & Swamp
  POLIWAG: [{ biome: 'wetland', context: 'tall_grass', affinity: 1.0 }, { biome: 'wetland', context: 'water_surface', affinity: 0.8 }],
  POLIWHIRL: [{ biome: 'wetland', context: 'tall_grass', affinity: 0.7 }, { biome: 'wetland', context: 'water_surface', affinity: 0.7 }],
  PSYDUCK: [{ biome: 'wetland', context: 'water_surface', affinity: 0.9 }, { biome: 'wetland', context: 'tall_grass', affinity: 0.7 }],
  GOLDUCK: [{ biome: 'wetland', context: 'water_surface', affinity: 0.6 }],
  SLOWPOKE: [{ biome: 'wetland', context: 'water_surface', affinity: 0.8 }, { biome: 'coast', context: 'shore', affinity: 0.7 }],
  SLOWBRO: [{ biome: 'wetland', context: 'water_surface', affinity: 0.5 }, { biome: 'coast', context: 'shore', affinity: 0.5 }],
  GRIMER: [{ biome: 'wetland', context: 'tall_grass', affinity: 0.9 }],
  MUK: [{ biome: 'wetland', context: 'tall_grass', affinity: 0.6 }],
  KOFFING: [{ biome: 'wetland', context: 'tall_grass', affinity: 0.9 }],
  WEEZING: [{ biome: 'wetland', context: 'tall_grass', affinity: 0.6 }],
  GASTLY: [{ biome: 'wetland', context: 'tall_grass', affinity: 0.8 }, { biome: 'dense_forest', context: 'forest_floor', affinity: 0.7 }],
  HAUNTER: [{ biome: 'wetland', context: 'tall_grass', affinity: 0.6 }],
  DROWZEE: [{ biome: 'wetland', context: 'tall_grass', affinity: 0.8 }, { biome: 'meadow', context: 'tall_grass', affinity: 0.6 }],
  HYPNO: [{ biome: 'wetland', context: 'tall_grass', affinity: 0.5 }],
  MAGNEMITE: [{ biome: 'dryland', context: 'walkable_ground', affinity: 0.8 }, { biome: 'hill_edge', context: 'rock', affinity: 0.6 }],
  MAGNETON: [{ biome: 'dryland', context: 'walkable_ground', affinity: 0.5 }],
  VOLTORB: [{ biome: 'dryland', context: 'walkable_ground', affinity: 0.8 }],
  ELECTRODE: [{ biome: 'dryland', context: 'walkable_ground', affinity: 0.5 }],
  HITMONLEE: [{ biome: 'hill_edge', context: 'walkable_ground', affinity: 0.5 }],
  HITMONCHAN: [{ biome: 'hill_edge', context: 'walkable_ground', affinity: 0.5 }],
  LICKITUNG: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.6 }],
  MRMIME: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.5 }],
  JYNX: [{ biome: 'hill_edge', context: 'walkable_ground', affinity: 0.5 }],
  ELECTABUZZ: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.5 }],
  MAGMAR: [{ biome: 'hill_edge', context: 'rock', affinity: 0.5 }],
  DITTO: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.4 }],
  DRATINI: [{ biome: 'wetland', context: 'water_surface', affinity: 0.5 }, { biome: 'coast', context: 'water_surface', affinity: 0.4 }],
  DRAGONAIR: [{ biome: 'wetland', context: 'water_surface', affinity: 0.3 }],
  DRAGONITE: [{ biome: 'wetland', context: 'water_surface', affinity: 0.1 }],

  // Water & River
  MAGIKARP: [{ biome: 'wetland', context: 'water_surface', affinity: 1.0 }, { biome: 'coast', context: 'water_surface', affinity: 1.0 }],
  GYARADOS: [{ biome: 'wetland', context: 'water_surface', affinity: 0.3 }, { biome: 'coast', context: 'water_surface', affinity: 0.4 }],
  GOLDEEN: [{ biome: 'wetland', context: 'water_surface', affinity: 0.9 }],
  SEAKING: [{ biome: 'wetland', context: 'water_surface', affinity: 0.6 }],

  // Coast & Ocean
  TENTACOOL: [{ biome: 'coast', context: 'water_surface', affinity: 1.0 }, { biome: 'coast', context: 'shore', affinity: 0.7 }],
  TENTACRUEL: [{ biome: 'coast', context: 'water_surface', affinity: 0.6 }],
  SHELLDER: [{ biome: 'coast', context: 'shore', affinity: 0.9 }, { biome: 'coast', context: 'sand', affinity: 0.8 }],
  KRABBY: [{ biome: 'coast', context: 'shore', affinity: 1.0 }, { biome: 'coast', context: 'sand', affinity: 0.9 }],
  KINGLER: [{ biome: 'coast', context: 'shore', affinity: 0.6 }],
  HORSEA: [{ biome: 'coast', context: 'water_surface', affinity: 0.9 }],
  SEADRA: [{ biome: 'coast', context: 'water_surface', affinity: 0.6 }],
  STARYU: [{ biome: 'coast', context: 'shore', affinity: 0.9 }, { biome: 'coast', context: 'water_surface', affinity: 0.8 }],
  SEEL: [{ biome: 'coast', context: 'shore', affinity: 0.8 }, { biome: 'coast', context: 'water_surface', affinity: 0.8 }],
  DEWGONG: [{ biome: 'coast', context: 'water_surface', affinity: 0.5 }],
  LAPRAS: [{ biome: 'coast', context: 'water_surface', affinity: 0.4 }],
  ABRA: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.7 }],
  KADABRA: [{ biome: 'meadow', context: 'tall_grass', affinity: 0.4 }],
};

const result = {};

for (let id = 1; id <= 151; id++) {
  const pk = pokemonDb.pokemon[id.toString()];
  if (!pk) continue;

  const key = pk.speciesKey;

  // Determine stage
  let stage = 1;
  const parent1 = evolvesFrom.get(key);
  if (parent1) {
    stage = 2;
    const parent2 = evolvesFrom.get(parent1);
    if (parent2) {
      stage = 3;
    }
  }

  const flags = SPECIAL_FLAGS[key] || [];
  const rarityDelta = key === 'PIKACHU' ? 1 : 0;
  const social = SOCIAL_MAPPING[key] || 'solitary';
  const apex = APEX_SPECIES[key];
  const habitats = HABITAT_CONFIG[key] || [];

  const speciesEntry = {
    stage,
    flags,
    rarityDelta,
    social,
    habitats,
    activeTime: ['dawn', 'day', 'dusk', 'night'],
  };

  if (apex) {
    speciesEntry.apexSpecies = apex;
  }

  result[key] = speciesEntry;
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
console.log(`Successfully generated species spawn data for ${Object.keys(result).length} species -> ${outputPath}`);
