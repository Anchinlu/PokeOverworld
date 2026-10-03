/**
 * Schema, Constants & Asset Manifest Parity Validator
 * Validates consistency between TypeScript, Python, and JSON Schemas.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

let errors = 0;
function logPass(msg) {
  console.log(`\x1b[32m✔ PASS:\x1b[0m ${msg}`);
}
function logFail(msg) {
  console.error(`\x1b[31m✖ FAIL:\x1b[0m ${msg}`);
  errors++;
}

console.log('--- Starting Pokemon Schema & Asset Parity Validation ---');

// 1. Verify Terrain Constants (TS vs Python)
try {
  const tsConstants = fs.readFileSync(path.join(ROOT, 'packages/game-data/constants.ts'), 'utf8');
  const pyTerrain = fs.readFileSync(path.join(ROOT, 'map_generator/terrain.py'), 'utf8');

  const tsTerrainMatches = [...tsConstants.matchAll(/([A-Z_]+):\s*(\d+)/g)];
  const tsTerrain = {};
  for (const m of tsTerrainMatches) {
    if (['EMPTY', 'GRASS', 'ROAD', 'BEACH_SAND', 'OCEAN_WATER', 'HILL'].includes(m[1])) {
      tsTerrain[m[1]] = parseInt(m[2], 10);
    }
  }

  const pyTerrainMatches = [...pyTerrain.matchAll(/TERRAIN_([A-Z]+)\s*=\s*(\d+)/g)];
  const pyTerrainMap = {};
  for (const m of pyTerrainMatches) {
    pyTerrainMap[m[1]] = parseInt(m[2], 10);
  }

  // Cross check values
  const mapping = [
    { ts: 'EMPTY', py: 'EMPTY' },
    { ts: 'GRASS', py: 'GRASS' },
    { ts: 'ROAD', py: 'ROAD' },
    { ts: 'BEACH_SAND', py: 'BEACH' },
    { ts: 'OCEAN_WATER', py: 'OCEAN' },
    { ts: 'HILL', py: 'HILL' },
  ];

  let terrainOk = true;
  for (const pair of mapping) {
    if (tsTerrain[pair.ts] !== pyTerrainMap[pair.py]) {
      logFail(
        `Terrain mismatch: TS ${pair.ts} (${tsTerrain[pair.ts]}) != Python ${pair.py} (${pyTerrainMap[pair.py]})`
      );
      terrainOk = false;
    }
  }
  if (terrainOk) {
    logPass(
      `Terrain constants match perfectly across TypeScript and Python (${mapping.length} terrains)`
    );
  }
} catch (err) {
  logFail(`Terrain validation error: ${err.message}`);
}

// 2. Verify Tile IDs (TS vs Python)
try {
  const tsConstants = fs.readFileSync(path.join(ROOT, 'packages/game-data/constants.ts'), 'utf8');
  const pyTiles = fs.readFileSync(path.join(ROOT, 'map_generator/tiles.py'), 'utf8');

  // Parse TS TILE_IDS
  const tileStartIndex = tsConstants.indexOf('TILE_IDS = {');
  const tileEndIndex = tsConstants.indexOf('} as const;', tileStartIndex);
  const tsTilesSection = tsConstants.slice(tileStartIndex, tileEndIndex);
  const tsTileMatches = [...tsTilesSection.matchAll(/([a-z0-9_]+):\s*(\d+)/g)];
  const tsTiles = {};
  for (const m of tsTileMatches) {
    tsTiles[m[1]] = parseInt(m[2], 10);
  }

  // Parse Python TILE_IDS
  const pyTileStartIndex = pyTiles.indexOf('TILE_IDS = {');
  const pyTileEndIndex = pyTiles.indexOf('\n}\n', pyTileStartIndex);
  const pyTilesSection = pyTiles.slice(pyTileStartIndex, pyTileEndIndex);
  const pyTileMatches = [...pyTilesSection.matchAll(/"([a-z0-9_]+)":\s*(\d+)/g)];
  const pyTilesMap = {};
  for (const m of pyTileMatches) {
    pyTilesMap[m[1]] = parseInt(m[2], 10);
  }

  let tilesOk = true;
  const tsKeys = Object.keys(tsTiles);
  const pyKeys = Object.keys(pyTilesMap);

  if (tsKeys.length !== pyKeys.length) {
    logFail(
      `Tile ID count mismatch: TS has ${tsKeys.length} tiles, Python has ${pyKeys.length} tiles`
    );
    tilesOk = false;
  }

  for (const [key, id] of Object.entries(tsTiles)) {
    if (pyTilesMap[key] === undefined) {
      logFail(`Tile key '${key}' missing in Python TILE_IDS`);
      tilesOk = false;
    } else if (pyTilesMap[key] !== id) {
      logFail(`Tile ID mismatch for '${key}': TS=${id}, Python=${pyTilesMap[key]}`);
      tilesOk = false;
    }
  }

  if (tilesOk) {
    logPass(`All ${tsKeys.length} Tile IDs match identically between TypeScript and Python`);
  }
} catch (err) {
  logFail(`Tile IDs validation error: ${err.message}`);
}

// 3. Verify Asset Manifest & File Existence
try {
  const manifestPath = path.join(ROOT, 'apps/web/public/assets/manifest.json');
  if (!fs.existsSync(manifestPath)) {
    logFail(`Asset manifest not found at ${manifestPath}`);
  } else {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const manifestEntries = Object.entries(manifest);
    let missingAssets = 0;

    for (const [key, relPath] of manifestEntries) {
      // Clean leading slash for local fs path
      const cleanPath = relPath.startsWith('/') ? relPath.slice(1) : relPath;
      let fullPath = path.join(ROOT, 'apps/web/public', cleanPath);
      if (!fs.existsSync(fullPath) && cleanPath.startsWith('Graphics/')) {
        fullPath = path.join(ROOT, cleanPath);
      }
      if (!fs.existsSync(fullPath)) {
        logFail(`Asset '${key}' points to missing file: ${cleanPath}`);
        missingAssets++;
      }
    }

    if (missingAssets === 0) {
      logPass(
        `All ${manifestEntries.length} manifest assets exist on disk (public/assets & Graphics)`
      );
    }

    // Verify critical assets exist in manifest
    const requiredKeys = [
      'char_red_sheet',
      'char_pika_sheet',
      'tall_grass',
      'tree_vibrant',
      'tree_autumn',
      'tree_coastal',
      'tree_deep',
      'berry_ORANBERRY',
      'berry_CHERIBERRY',
      'berry_SITRUSBERRY',
      'berry_LUMBERRY',
      'pokedex_tab_pokemon',
      'pokedex_tab_moves',
      'pokedex_tab_items',
      'pokedex_icon_search',
      'pokedex_icon_own',
      'pokedex_icon_seen',
      'pokedex_bg_list',
      'pokedex_bg_info',
      'move_machine_FIRE',
      'move_machine_WATER',
      'move_machine_GRASS',
      'move_machine_ELECTRIC',
      'move_category',
      'pokemon_type_badges',
      'battle_databox_player',
      'battle_databox_enemy',
      'menu_icon_pokedex',
    ];
    let missingKeys = 0;
    for (const rk of requiredKeys) {
      if (!manifest[rk]) {
        logFail(`Critical key '${rk}' missing in asset manifest`);
        missingKeys++;
      }
    }
    if (missingKeys === 0) {
      logPass(
        `All critical game sprites, berry trees, Pokédex, Moves, and Battle UI are defined in manifest`
      );
    }
  }
} catch (err) {
  logFail(`Asset manifest validation error: ${err.message}`);
}

// 4. Validate JSON Data Files
try {
  const biomesPath = path.join(ROOT, 'packages/game-data/biomes.json');
  const encountersPath = path.join(ROOT, 'packages/game-data/encounters.json');

  const biomesData = JSON.parse(fs.readFileSync(biomesPath, 'utf8'));
  const encountersData = JSON.parse(fs.readFileSync(encountersPath, 'utf8'));

  if (!biomesData.biomes || Object.keys(biomesData.biomes).length === 0) {
    logFail('biomes.json contains invalid or empty biomes dictionary');
  } else {
    logPass(
      `biomes.json validated successfully (${Object.keys(biomesData.biomes).length} biomes defined)`
    );
  }

  if (!encountersData.regions || Object.keys(encountersData.regions).length === 0) {
    logFail('encounters.json contains invalid or empty regions dictionary');
  } else {
    logPass(
      `encounters.json validated successfully (${Object.keys(encountersData.regions).length} regions defined)`
    );
  }

  const pokemonDbPath = path.join(ROOT, 'packages/game-data/pokemon-db.json');
  const pokemonDbData = JSON.parse(fs.readFileSync(pokemonDbPath, 'utf8'));

  if (!pokemonDbData.pokemon || Object.keys(pokemonDbData.pokemon).length !== 151) {
    logFail(
      `pokemon-db.json must contain exactly 151 pokemons (found ${Object.keys(pokemonDbData.pokemon || {}).length})`
    );
  } else {
    logPass(`pokemon-db.json validated successfully (all 151 Gen 1 Pokemons present)`);
  }
} catch (err) {
  logFail(`JSON data files validation error: ${err.message}`);
}

console.log('---------------------------------------------------------');
if (errors > 0) {
  console.error(`\x1b[31mParity validation failed with ${errors} error(s).\x1b[0m`);
  process.exit(1);
} else {
  console.log(`\x1b[32mAll parity checks and validations passed successfully!\x1b[0m`);
  process.exit(0);
}
