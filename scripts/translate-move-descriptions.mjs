import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'packages/game-data/moves-db.json');
const database = JSON.parse(await fs.readFile(file, 'utf8'));
const moves = Object.values(database.moves ?? {});
const englishKeywords =
  /\b(the|target|user|damage|raises|lowers|opponent|when|move|accuracy|power|type|turn|hits|status|ability|attack|defense|special|physical|fainted|heals|restores|prevents|causes|chance|doubles|halves)\b/i;
const hasVietnamese = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i;
const shouldTranslate = (move) => {
  if (move.descriptionVi) return false;
  if (!move.description) return false;
  if (move.description === move.descriptionEn) return true;
  return englishKeywords.test(move.description);
};

const requestedLimit = Number(
  process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1] ?? 100
);
const candidates = moves.filter(shouldTranslate).slice(0, requestedLimit);
const copyVietnamese = moves.filter(
  (move) =>
    !move.descriptionVi &&
    move.description &&
    hasVietnamese.test(move.description) &&
    !englishKeywords.test(move.description)
);

for (const move of copyVietnamese) move.descriptionVi = move.description;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let translated = 0;
let failed = 0;

async function translateOne(move) {
  const url = new URL('https://api.mymemory.translated.net/get');
  url.searchParams.set('q', move.description);
  url.searchParams.set('langpair', 'en|vi');
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const result = payload?.responseData?.translatedText?.trim();
    if (!result || result === move.description) throw new Error('Empty or untranslated result');
    move.descriptionVi = result;
    return true;
  } catch (error) {
    console.warn(`Could not translate ${move.id}: ${error.message}`);
    return false;
  }
}

const concurrency = Number(
  process.argv.find((arg) => arg.startsWith('--concurrency='))?.split('=')[1] ?? 2
);
for (let i = 0; i < candidates.length; i += concurrency) {
  const batch = candidates.slice(i, i + concurrency);
  const results = await Promise.all(batch.map(translateOne));
  translated += results.filter(Boolean).length;
  failed += results.filter((result) => !result).length;
  await fs.writeFile(file, `${JSON.stringify(database, null, 2)}\n`, 'utf8');
  await sleep(1500);
}

await fs.writeFile(file, `${JSON.stringify(database, null, 2)}\n`, 'utf8');
console.log(`Copied existing Vietnamese descriptions: ${copyVietnamese.length}`);
console.log(`Translated English/mixed descriptions: ${translated}`);
console.log(`Failed translations left for retry: ${failed}`);
