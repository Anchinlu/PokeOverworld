export const EVOLUTION_CHAINS: number[][] = [
  [1, 2, 3], // Bulbasaur -> Ivysaur -> Venusaur
  [4, 5, 6], // Charmander -> Charmeleon -> Charizard
  [7, 8, 9], // Squirtle -> Wartortle -> Blastoise
  [10, 11, 12], // Caterpie -> Metapod -> Butterfree
  [13, 14, 15], // Weedle -> Kakuna -> Beedrill
  [16, 17, 18], // Pidgey -> Pidgeotto -> Pidgeot
  [19, 20], // Rattata -> Raticate
  [21, 22], // Spearow -> Fearow
  [23, 24], // Ekans -> Arbok
  [25, 26], // Pikachu -> Raichu
  [27, 28], // Sandshrew -> Sandslash
  [29, 30, 31], // Nidoran♀ -> Nidorina -> Nidoqueen
  [32, 33, 34], // Nidoran♂ -> Nidorino -> Nidoking
  [35, 36], // Clefairy -> Clefable
  [37, 38], // Vulpix -> Ninetales
  [39, 40], // Jigglypuff -> Wigglytuff
  [41, 42, 169], // Zubat -> Golbat -> Crobat
  [43, 44, 45], // Oddish -> Gloom -> Vileplume
  [46, 47], // Paras -> Parasect
  [48, 49], // Venonat -> Venomoth
  [50, 51], // Diglett -> Dugtrio
  [52, 53], // Meowth -> Persian
  [54, 55], // Psyduck -> Golduck
  [56, 57, 979], // Mankey -> Primeape -> Annihilape
  [58, 59], // Growlithe -> Arcanine
  // 60, 61, 62, 186: Poliwag branch handled in getEvolutionChain
  [63, 64, 65], // Abra -> Kadabra -> Alakazam
  [66, 67, 68], // Machop -> Machoke -> Machamp
  [69, 70, 71], // Bellsprout -> Weepinbell -> Victreebel
  [72, 73], // Tentacool -> Tentacruel
  [74, 75, 76], // Geodude -> Graveler -> Golem
  [77, 78], // Ponyta -> Rapidash
  // 79, 80, 199: Slowpoke branch handled in getEvolutionChain
  [81, 82], // Magnemite -> Magneton
  [83], // Farfetch'd (Kanto)
  [84, 85], // Doduo -> Dodrio
  [86, 87], // Seel -> Dewgong
  [88, 89], // Grimer -> Muk
  [90, 91], // Shellder -> Cloyster
  [92, 93, 94], // Gastly -> Haunter -> Gengar
  [95, 208], // Onix -> Steelix
  [96, 97], // Drowzee -> Hypno
  [98, 99], // Krabby -> Kingler
  [100, 101], // Voltorb -> Electrode
  [102, 103], // Exeggcute -> Exeggutor
  [104, 105], // Cubone -> Marowak
  [106], // Hitmonlee
  [107], // Hitmonchan
  [108, 463], // Lickitung -> Lickilicky
  [109, 110], // Koffing -> Weezing
  [111, 112, 464], // Rhyhorn -> Rhydon -> Rhyperior
  [113, 242], // Chansey -> Blissey
  [114, 465], // Tangela -> Tangrowth
  [115], // Kangaskhan
  [116, 117, 230], // Horsea -> Seadra -> Kingdra
  [118, 119], // Goldeen -> Seaking
  [120, 121], // Staryu -> Starmie
  [122], // Mr. Mime (Kanto)
  // 123, 212, 900: Scyther branch handled in getEvolutionChain
  [124], // Jynx
  [125, 466], // Electabuzz -> Electivire
  [126, 467], // Magmar -> Magmortar
  [127], // Pinsir
  [128], // Tauros
  [129, 130], // Magikarp -> Gyarados
  [131], // Lapras
  [132], // Ditto
  // 133: Eevee handled specially in getEvolutionChain
  [137, 233, 474], // Porygon -> Porygon2 -> Porygon-Z
  [138, 139], // Omanyte -> Omastar
  [140, 141], // Kabuto -> Kabutops
  [142], // Aerodactyl
  [143], // Snorlax
  [144], // Articuno
  [145], // Zapdos
  [146], // Moltres
  [147, 148, 149], // Dratini -> Dragonair -> Dragonite
  [150], // Mewtwo
  [151], // Mew
  // Regional Form Evolution Chains
  [10091, 10092], // Alolan Rattata -> Alolan Raticate
  [25, 10100], // Pikachu -> Alolan Raichu
  [10101, 10102], // Alolan Sandshrew -> Alolan Sandslash
  [10103, 10104], // Alolan Vulpix -> Alolan Ninetales
  [10105, 10106], // Alolan Diglett -> Alolan Dugtrio
  [10107, 10108], // Alolan Meowth -> Alolan Persian
  [10109, 10110, 10111], // Alolan Geodude -> Alolan Graveler -> Alolan Golem
  [10112, 10113], // Alolan Grimer -> Alolan Muk
  [102, 10114], // Exeggcute -> Alolan Exeggutor
  [104, 10115], // Cubone -> Alolan Marowak
  [10161, 863], // Galarian Meowth -> Perrserker
  [10162, 10163], // Galarian Ponyta -> Galarian Rapidash
  [10166, 865], // Galarian Farfetch'd -> Sirfetch'd
  [109, 10167], // Koffing -> Galarian Weezing
  [10168, 866], // Galarian Mr. Mime -> Mr. Rime
  [10169], // Galarian Articuno
  [10170], // Galarian Zapdos
  [10171], // Galarian Moltres
  [10229, 10230], // Hisuian Growlithe -> Hisuian Arcanine
  [10231, 10232], // Hisuian Voltorb -> Hisuian Electrode
  [10250], // Paldean Tauros (Combat)
  [10251], // Paldean Tauros (Blaze)
  [10252], // Paldean Tauros (Aqua)
];

const EEVEELUTION_IDS = [134, 135, 136, 196, 197, 470, 471, 700];

export function getEvolutionChain(pokemonId: number): number[] {
  // Eevee & 8 Eeveelutions
  if (pokemonId === 133) {
    return [133, ...EEVEELUTION_IDS];
  }
  if (EEVEELUTION_IDS.includes(pokemonId)) {
    return [133, pokemonId];
  }

  // Poliwag / Poliwhirl -> Poliwrath (62) or Politoed (186)
  if (pokemonId === 60 || pokemonId === 61) {
    return [60, 61, 62, 186];
  }
  if (pokemonId === 62) {
    return [60, 61, 62];
  }
  if (pokemonId === 186) {
    return [60, 61, 186];
  }

  // Slowpoke (79) -> Slowbro (80) or Slowking (199)
  if (pokemonId === 79) {
    return [79, 80, 199];
  }
  if (pokemonId === 80) {
    return [79, 80];
  }
  if (pokemonId === 199) {
    return [79, 199];
  }

  // Galarian Slowpoke (10164) -> Galarian Slowbro (10165) or Galarian Slowking (10172)
  if (pokemonId === 10164) {
    return [10164, 10165, 10172];
  }
  if (pokemonId === 10165) {
    return [10164, 10165];
  }
  if (pokemonId === 10172) {
    return [10164, 10172];
  }

  // Scyther (123) -> Scizor (212) or Kleavor (900)
  if (pokemonId === 123) {
    return [123, 212, 900];
  }
  if (pokemonId === 212) {
    return [123, 212];
  }
  if (pokemonId === 900) {
    return [123, 900];
  }

  const match = EVOLUTION_CHAINS.find((chain) => chain.includes(pokemonId));
  return match ?? [pokemonId];
}
