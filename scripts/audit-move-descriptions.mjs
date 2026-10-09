import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'packages/game-data/moves-db.json');
const database = JSON.parse(fs.readFileSync(file, 'utf8'));
const moves = Object.values(database.moves ?? {});

const untranslated = moves.filter(
  (move) =>
    !move.descriptionVi &&
    move.description &&
    move.descriptionEn &&
    move.description === move.descriptionEn
);
const missingVietnamese = moves.filter((move) => !move.descriptionVi);
const mixedLanguage = moves.filter(
  (move) =>
    move.descriptionVi &&
    /\b(the|target|user|damage|raises|lowers|opponent|when|move|accuracy|power)\b/i.test(
      move.descriptionVi
    )
);

console.log(`Total moves: ${moves.length}`);
console.log(`Missing descriptionVi: ${missingVietnamese.length}`);
console.log(`Untranslated English descriptions: ${untranslated.length}`);
console.log(`Vietnamese descriptions with English keywords: ${mixedLanguage.length}`);

if (process.argv.includes('--list') && untranslated.length > 0) {
  console.log('\nUntranslated move IDs:');
  for (const move of untranslated) console.log(`- ${move.id}`);
}
