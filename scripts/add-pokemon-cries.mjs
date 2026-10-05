#!/usr/bin/env node
/**
 * Script to add Pokemon cry audio paths to pokemon-db.json
 * Scans Audio/Cries directory and maps .ogg files to Pokemon by speciesKey
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Paths
const POKEMON_DB_PATH = join(rootDir, 'packages/game-data/pokemon-db.json');
const CRIES_DIR = join(rootDir, 'Audio/Cries');

console.log('🎵 Adding Pokemon cries to database...\n');

// Read pokemon database
const pokemonDb = JSON.parse(readFileSync(POKEMON_DB_PATH, 'utf-8'));

// Scan cry files
const cryFiles = readdirSync(CRIES_DIR)
  .filter((file) => file.endsWith('.ogg'))
  .map((file) => file.replace('.ogg', ''));

console.log(`Found ${cryFiles.length} cry files in Audio/Cries/`);

// Create a map of cry files by base name (without _1, _2 suffixes)
const cryMap = new Map();
cryFiles.forEach((fileName) => {
  // Remove variant suffixes like _1, _2, _3 to get base name
  const baseName = fileName.replace(/_\d+$/, '');

  if (!cryMap.has(baseName)) {
    cryMap.set(baseName, []);
  }
  cryMap.get(baseName).push(fileName);
});

console.log(`Mapped to ${cryMap.size} unique Pokemon species\n`);

// Update Pokemon database
let matched = 0;
let notFound = 0;
const notFoundList = [];

Object.values(pokemonDb.pokemon).forEach((pokemon) => {
  const speciesKey = pokemon.speciesKey;

  if (cryMap.has(speciesKey)) {
    const variants = cryMap.get(speciesKey);
    // Use the first variant (base cry without suffix, or _1 if base doesn't exist)
    const cryFile = variants[0];
    pokemon.sprites.cry = `Audio/Cries/${cryFile}.ogg`;
    matched++;
    console.log(
      `✓ ${pokemon.id.toString().padStart(3, '0')}. ${pokemon.name.padEnd(12)} -> ${cryFile}.ogg`
    );
  } else {
    notFound++;
    notFoundList.push(`${pokemon.id}. ${pokemon.name} (${speciesKey})`);
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`✓ Matched: ${matched} / ${pokemonDb.count}`);
console.log(`✗ Not found: ${notFound} / ${pokemonDb.count}`);

if (notFoundList.length > 0) {
  console.log(`\n⚠️  Pokemon without cry files:`);
  notFoundList.forEach((item) => console.log(`   ${item}`));
}

// Write updated database
writeFileSync(POKEMON_DB_PATH, JSON.stringify(pokemonDb, null, 2) + '\n', 'utf-8');

console.log(`\n✅ Updated ${POKEMON_DB_PATH}`);
console.log(`🎵 Added cry paths for ${matched} Pokemon!\n`);
