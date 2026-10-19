const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../packages/game-data/pokemon-db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const baseDir = 'E:/Pokemon/Graphics/Characters/Swimming Overworld Sprites';
const swimDir = path.join(baseDir, 'Swimming');
const swimShinyDir = path.join(baseDir, 'Swimming Shiny');
const levDir = path.join(baseDir, 'Levitates');
const levShinyDir = path.join(baseDir, 'Levitates Shiny');

const swimFiles = new Map(fs.readdirSync(swimDir).map(f => [f.toUpperCase(), f]));
const swimShinyFiles = new Map(fs.readdirSync(swimShinyDir).map(f => [f.toUpperCase(), f]));
const levFiles = new Map(fs.readdirSync(levDir).map(f => [f.toUpperCase(), f]));
const levShinyFiles = new Map(fs.readdirSync(levShinyDir).map(f => [f.toUpperCase(), f]));

let updatedCount = 0;
let swimCount = 0;
let levCount = 0;
let missing = [];

for (const [id, mon] of Object.entries(db.pokemon)) {
  const key = mon.speciesKey.toUpperCase() + '.PNG';
  let category = null;
  let filename = null;
  let shinyFilename = null;

  if (swimFiles.has(key)) {
    category = 'Swimming';
    filename = swimFiles.get(key);
    shinyFilename = swimShinyFiles.get(key) || filename;
    swimCount++;
  } else if (levFiles.has(key)) {
    category = 'Levitates';
    filename = levFiles.get(key);
    shinyFilename = levShinyFiles.get(key) || filename;
    levCount++;
  } else {
    missing.push(mon.speciesKey);
    continue;
  }

  mon.sprites.swimming = 'Graphics/Characters/Swimming Overworld Sprites/' + category + '/' + filename;
  mon.sprites.swimmingShiny = 'Graphics/Characters/Swimming Overworld Sprites/' + category + ' Shiny/' + shinyFilename;
  mon.sprites.followerWater = mon.sprites.swimming;
  mon.sprites.followerWaterShiny = mon.sprites.swimmingShiny;
  updatedCount++;
}

console.log('Total in DB:', Object.keys(db.pokemon).length);
console.log('Updated:', updatedCount, '(Swimming:', swimCount, ', Levitates:', levCount, ')');
console.log('Missing:', missing);

if (missing.length === 0 && updatedCount === Object.keys(db.pokemon).length) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2) + '\n', 'utf8');
  console.log('Successfully written updated database to', dbPath);
}
