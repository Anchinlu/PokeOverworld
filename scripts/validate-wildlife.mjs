#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../');

const pokemonDbPath = path.join(rootDir, 'packages/game-data/pokemon-db.json');
const speciesSpawnPath = path.join(rootDir, 'packages/game-data/wildlife/species-spawn.json');
const spawnConfigPath = path.join(rootDir, 'packages/game-data/wildlife/spawn-config.json');

const pokemonDb = JSON.parse(fs.readFileSync(pokemonDbPath, 'utf8'));
const speciesSpawn = JSON.parse(fs.readFileSync(speciesSpawnPath, 'utf8'));
const spawnConfig = JSON.parse(fs.readFileSync(spawnConfigPath, 'utf8'));

const errors = [];

// 1. Check tierProbability sum = 1.0 (with floating tolerance)
const sumProb = spawnConfig.tierProbability.reduce((acc, p) => acc + p, 0);
if (Math.abs(sumProb - 1.0) > 0.0001) {
  errors.push(`tierProbability does not sum to 1.0 (current: ${sumProb})`);
}

// 2. Validate valid biomes and contexts
const VALID_BIOMES = new Set(['dense_forest', 'light_forest', 'meadow', 'dryland', 'wetland', 'coast', 'hill_edge', 'dark_land']);
const VALID_CONTEXTS = new Set(['tall_grass', 'forest_floor', 'water_surface', 'shore', 'rock', 'sand', 'walkable_ground']);
const VALID_FLAGS = new Set(['legendary', 'mythical', 'starter', 'fossil', 'static', 'no_wild']);

// 3. Check every Gen 1 species exists
const allSpeciesKeys = new Set();
for (let id = 1; id <= 151; id++) {
  const pk = pokemonDb.pokemon[id.toString()];
  if (pk) {
    allSpeciesKeys.add(pk.speciesKey);
  }
}

for (const key of allSpeciesKeys) {
  const entry = speciesSpawn[key];
  if (!entry) {
    errors.push(`Species ${key} missing from species-spawn.json`);
    continue;
  }

  // Must have habitats or at least one special flag
  const hasSpecialFlag = entry.flags && entry.flags.some((f) => VALID_FLAGS.has(f));
  const hasHabitats = Array.isArray(entry.habitats) && entry.habitats.length > 0;
  if (!hasHabitats && !hasSpecialFlag) {
    errors.push(`Species ${key} has no habitats and no special exemption flags`);
  }

  // Validate habitats
  if (entry.habitats) {
    for (const h of entry.habitats) {
      if (!VALID_BIOMES.has(h.biome)) {
        errors.push(`Species ${key} has invalid biome '${h.biome}'`);
      }
      if (!VALID_CONTEXTS.has(h.context)) {
        errors.push(`Species ${key} has invalid context '${h.context}'`);
      }
      if (typeof h.affinity !== 'number' || h.affinity <= 0 || h.affinity > 1.0) {
        errors.push(`Species ${key} has invalid affinity ${h.affinity}`);
      }
    }
  }

  // Validate apexSpecies
  if (entry.apexSpecies) {
    if (!allSpeciesKeys.has(entry.apexSpecies)) {
      errors.push(`Species ${key} references non-existent apex species '${entry.apexSpecies}'`);
    }
  }
}

// 4. Check coverage: Each biome should have common species
const habitatCoverage = new Map(); // biome -> Set of species
for (const [key, entry] of Object.entries(speciesSpawn)) {
  if (entry.flags && entry.flags.length > 0) continue;
  if (!entry.habitats) continue;
  for (const h of entry.habitats) {
    if (!habitatCoverage.has(h.biome)) {
      habitatCoverage.set(h.biome, new Set());
    }
    habitatCoverage.get(h.biome).add(key);
  }
}

for (const biome of VALID_BIOMES) {
  const covered = habitatCoverage.get(biome);
  if (!covered || covered.size === 0) {
    errors.push(`Biome '${biome}' has 0 wild species assigned!`);
  }
}

if (errors.length > 0) {
  console.error(`❌ Wildlife validation failed with ${errors.length} errors:`);
  for (const err of errors) {
    console.error(`  - ${err}`);
  }
  process.exit(1);
} else {
  console.log(`✅ Wildlife data validation passed cleanly! 151 Gen 1 species verified against ecology rules.`);
}
