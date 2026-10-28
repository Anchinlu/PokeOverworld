/**
 * Canonical Generation 1 Pokémon Evolution Rules & Engine
 * Single Source of Truth for level requirements, stone triggers, and evolution mutations.
 */

import type { PartyPokemon } from '../party/party-state';
import { recalculatePartyPokemonStats } from '../party/party-state';
import { pokemonCatalog } from '../../data';

/**
 * Normalizes an item key/id for consistent comparison (e.g. 'thunder_stone' -> 'thunder-stone')
 */
export function normalizeItemKey(key?: string | null): string {
  return (key || '')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .trim();
}

/**
 * Checks if a Pokémon is currently holding the required evolution item/stone.
 */
export function isPokemonHoldingItem(pokemon: PartyPokemon, requiredItem?: string): boolean {
  if (!pokemon.heldItem || !requiredItem) return false;
  return normalizeItemKey(pokemon.heldItem) === normalizeItemKey(requiredItem);
}

export interface EvolutionRequirement {
  targetSpeciesKey: string;
  targetSpeciesNameVi?: string;
  method: 'level' | 'stone' | 'trade' | 'item';
  requiredLevel?: number;
  requiredItem?: string;
  requiredItemNameVi?: string;
  descriptionVi: string;
}

export const GEN1_EVOLUTIONS: Record<string, EvolutionRequirement[]> = {
  BULBASAUR: [
    {
      targetSpeciesKey: 'IVYSAUR',
      method: 'level',
      requiredLevel: 16,
      descriptionVi: 'Đạt Cấp độ 16',
    },
  ],
  IVYSAUR: [
    {
      targetSpeciesKey: 'VENUSAUR',
      method: 'level',
      requiredLevel: 32,
      descriptionVi: 'Đạt Cấp độ 32',
    },
  ],
  CHARMANDER: [
    {
      targetSpeciesKey: 'CHARMELEON',
      method: 'level',
      requiredLevel: 16,
      descriptionVi: 'Đạt Cấp độ 16',
    },
  ],
  CHARMELEON: [
    {
      targetSpeciesKey: 'CHARIZARD',
      method: 'level',
      requiredLevel: 36,
      descriptionVi: 'Đạt Cấp độ 36',
    },
  ],
  SQUIRTLE: [
    {
      targetSpeciesKey: 'WARTORTLE',
      method: 'level',
      requiredLevel: 16,
      descriptionVi: 'Đạt Cấp độ 16',
    },
  ],
  WARTORTLE: [
    {
      targetSpeciesKey: 'BLASTOISE',
      method: 'level',
      requiredLevel: 36,
      descriptionVi: 'Đạt Cấp độ 36',
    },
  ],
  CATERPIE: [
    {
      targetSpeciesKey: 'METAPOD',
      method: 'level',
      requiredLevel: 7,
      descriptionVi: 'Đạt Cấp độ 7',
    },
  ],
  METAPOD: [
    {
      targetSpeciesKey: 'BUTTERFREE',
      method: 'level',
      requiredLevel: 10,
      descriptionVi: 'Đạt Cấp độ 10',
    },
  ],
  WEEDLE: [
    {
      targetSpeciesKey: 'KAKUNA',
      method: 'level',
      requiredLevel: 7,
      descriptionVi: 'Đạt Cấp độ 7',
    },
  ],
  KAKUNA: [
    {
      targetSpeciesKey: 'BEEDRILL',
      method: 'level',
      requiredLevel: 10,
      descriptionVi: 'Đạt Cấp độ 10',
    },
  ],
  PIDGEY: [
    {
      targetSpeciesKey: 'PIDGEOTTO',
      method: 'level',
      requiredLevel: 18,
      descriptionVi: 'Đạt Cấp độ 18',
    },
  ],
  PIDGEOTTO: [
    {
      targetSpeciesKey: 'PIDGEOT',
      method: 'level',
      requiredLevel: 36,
      descriptionVi: 'Đạt Cấp độ 36',
    },
  ],
  RATTATA: [
    {
      targetSpeciesKey: 'RATICATE',
      method: 'level',
      requiredLevel: 20,
      descriptionVi: 'Đạt Cấp độ 20',
    },
  ],
  SPEAROW: [
    {
      targetSpeciesKey: 'FEAROW',
      method: 'level',
      requiredLevel: 20,
      descriptionVi: 'Đạt Cấp độ 20',
    },
  ],
  EKANS: [
    {
      targetSpeciesKey: 'ARBOK',
      method: 'level',
      requiredLevel: 22,
      descriptionVi: 'Đạt Cấp độ 22',
    },
  ],
  PIKACHU: [
    {
      targetSpeciesKey: 'RAICHU',
      method: 'stone',
      requiredItem: 'thunder-stone',
      requiredItemNameVi: 'Đá Sét (Thunder Stone)',
      descriptionVi: 'Dùng Đá Sét',
    },
    {
      targetSpeciesKey: 'RAICHU_ALOLAN',
      method: 'stone',
      requiredItem: 'shiny-stone',
      requiredItemNameVi: 'Đá Ánh Sáng (Shiny Stone)',
      descriptionVi: 'Dùng Đá Ánh Sáng (Alolan Form)',
    },
  ],
  SANDSHREW: [
    {
      targetSpeciesKey: 'SANDSLASH',
      method: 'level',
      requiredLevel: 22,
      descriptionVi: 'Đạt Cấp độ 22',
    },
  ],
  NIDORANfE: [
    {
      targetSpeciesKey: 'NIDORINA',
      method: 'level',
      requiredLevel: 16,
      descriptionVi: 'Đạt Cấp độ 16',
    },
  ],
  NIDORINA: [
    {
      targetSpeciesKey: 'NIDOQUEEN',
      method: 'stone',
      requiredItem: 'moon-stone',
      requiredItemNameVi: 'Đá Mặt Trăng (Moon Stone)',
      descriptionVi: 'Dùng Đá Mặt Trăng',
    },
  ],
  NIDORANmA: [
    {
      targetSpeciesKey: 'NIDORINO',
      method: 'level',
      requiredLevel: 16,
      descriptionVi: 'Đạt Cấp độ 16',
    },
  ],
  NIDORINO: [
    {
      targetSpeciesKey: 'NIDOKING',
      method: 'stone',
      requiredItem: 'moon-stone',
      requiredItemNameVi: 'Đá Mặt Trăng (Moon Stone)',
      descriptionVi: 'Dùng Đá Mặt Trăng',
    },
  ],
  CLEFAIRY: [
    {
      targetSpeciesKey: 'CLEFABLE',
      method: 'stone',
      requiredItem: 'moon-stone',
      requiredItemNameVi: 'Đá Mặt Trăng (Moon Stone)',
      descriptionVi: 'Dùng Đá Mặt Trăng',
    },
  ],
  VULPIX: [
    {
      targetSpeciesKey: 'NINETALES',
      method: 'stone',
      requiredItem: 'fire-stone',
      requiredItemNameVi: 'Đá Lửa (Fire Stone)',
      descriptionVi: 'Dùng Đá Lửa',
    },
  ],
  JIGGLYPUFF: [
    {
      targetSpeciesKey: 'WIGGLYTUFF',
      method: 'stone',
      requiredItem: 'moon-stone',
      requiredItemNameVi: 'Đá Mặt Trăng (Moon Stone)',
      descriptionVi: 'Dùng Đá Mặt Trăng',
    },
  ],
  ZUBAT: [
    {
      targetSpeciesKey: 'GOLBAT',
      method: 'level',
      requiredLevel: 22,
      descriptionVi: 'Đạt Cấp độ 22',
    },
  ],
  GOLBAT: [
    {
      targetSpeciesKey: 'CROBAT',
      method: 'item',
      requiredItem: 'soothe-bell',
      requiredItemNameVi: 'Chuông Tịnh Tâm (Soothe Bell)',
      descriptionVi: 'Giữ Chuông Tịnh Tâm (Soothe Bell) để tiến hóa',
    },
  ],
  ODDISH: [
    {
      targetSpeciesKey: 'GLOOM',
      method: 'level',
      requiredLevel: 21,
      descriptionVi: 'Đạt Cấp độ 21',
    },
  ],
  GLOOM: [
    {
      targetSpeciesKey: 'VILEPLUME',
      method: 'stone',
      requiredItem: 'leaf-stone',
      requiredItemNameVi: 'Đá Lá (Leaf Stone)',
      descriptionVi: 'Dùng Đá Lá',
    },
    {
      targetSpeciesKey: 'VILEPLUME',
      method: 'stone',
      requiredItem: 'sun-stone',
      requiredItemNameVi: 'Đá Mặt Trời (Sun Stone)',
      descriptionVi: 'Dùng Đá Mặt Trời',
    },
  ],
  PARAS: [
    {
      targetSpeciesKey: 'PARASECT',
      method: 'level',
      requiredLevel: 24,
      descriptionVi: 'Đạt Cấp độ 24',
    },
  ],
  VENONAT: [
    {
      targetSpeciesKey: 'VENOMOTH',
      method: 'level',
      requiredLevel: 31,
      descriptionVi: 'Đạt Cấp độ 31',
    },
  ],
  DIGLETT: [
    {
      targetSpeciesKey: 'DUGTRIO',
      method: 'level',
      requiredLevel: 26,
      descriptionVi: 'Đạt Cấp độ 26',
    },
  ],
  MEOWTH: [
    {
      targetSpeciesKey: 'PERSIAN',
      method: 'level',
      requiredLevel: 28,
      descriptionVi: 'Đạt Cấp độ 28',
    },
  ],
  PSYDUCK: [
    {
      targetSpeciesKey: 'GOLDUCK',
      method: 'level',
      requiredLevel: 33,
      descriptionVi: 'Đạt Cấp độ 33',
    },
  ],
  MANKEY: [
    {
      targetSpeciesKey: 'PRIMEAPE',
      method: 'level',
      requiredLevel: 28,
      descriptionVi: 'Đạt Cấp độ 28',
    },
  ],
  PRIMEAPE: [
    {
      targetSpeciesKey: 'ANNIHILAPE',
      method: 'level',
      requiredLevel: 35,
      descriptionVi: 'Đạt Cấp độ 35',
    },
  ],
  GROWLITHE: [
    {
      targetSpeciesKey: 'ARCANINE',
      method: 'stone',
      requiredItem: 'fire-stone',
      requiredItemNameVi: 'Đá Lửa (Fire Stone)',
      descriptionVi: 'Dùng Đá Lửa',
    },
  ],
  POLIWAG: [
    {
      targetSpeciesKey: 'POLIWHIRL',
      method: 'level',
      requiredLevel: 25,
      descriptionVi: 'Đạt Cấp độ 25',
    },
  ],
  POLIWHIRL: [
    {
      targetSpeciesKey: 'POLIWRATH',
      method: 'stone',
      requiredItem: 'water-stone',
      requiredItemNameVi: 'Đá Nước (Water Stone)',
      descriptionVi: 'Dùng Đá Nước',
    },
    {
      targetSpeciesKey: 'POLITOED',
      method: 'item',
      requiredItem: 'kings-rock',
      requiredItemNameVi: "Đá Vương Giả (King's Rock)",
      descriptionVi: "Giữ King's Rock để tiến hóa",
    },
  ],
  ABRA: [
    {
      targetSpeciesKey: 'KADABRA',
      method: 'level',
      requiredLevel: 16,
      descriptionVi: 'Đạt Cấp độ 16',
    },
  ],
  KADABRA: [
    {
      targetSpeciesKey: 'ALAKAZAM',
      method: 'level',
      requiredLevel: 36,
      descriptionVi: 'Đạt Cấp độ 36',
    },
  ],
  MACHOP: [
    {
      targetSpeciesKey: 'MACHOKE',
      method: 'level',
      requiredLevel: 28,
      descriptionVi: 'Đạt Cấp độ 28',
    },
  ],
  MACHOKE: [
    {
      targetSpeciesKey: 'MACHAMP',
      method: 'level',
      requiredLevel: 36,
      descriptionVi: 'Đạt Cấp độ 36',
    },
  ],
  BELLSPROUT: [
    {
      targetSpeciesKey: 'WEEPINBELL',
      method: 'level',
      requiredLevel: 21,
      descriptionVi: 'Đạt Cấp độ 21',
    },
  ],
  WEEPINBELL: [
    {
      targetSpeciesKey: 'VICTREEBEL',
      method: 'stone',
      requiredItem: 'leaf-stone',
      requiredItemNameVi: 'Đá Lá (Leaf Stone)',
      descriptionVi: 'Dùng Đá Lá',
    },
  ],
  TENTACOOL: [
    {
      targetSpeciesKey: 'TENTACRUEL',
      method: 'level',
      requiredLevel: 30,
      descriptionVi: 'Đạt Cấp độ 30',
    },
  ],
  GEODUDE: [
    {
      targetSpeciesKey: 'GRAVELER',
      method: 'level',
      requiredLevel: 25,
      descriptionVi: 'Đạt Cấp độ 25',
    },
  ],
  GRAVELER: [
    {
      targetSpeciesKey: 'GOLEM',
      method: 'level',
      requiredLevel: 36,
      descriptionVi: 'Đạt Cấp độ 36',
    },
  ],
  PONYTA: [
    {
      targetSpeciesKey: 'RAPIDASH',
      method: 'level',
      requiredLevel: 40,
      descriptionVi: 'Đạt Cấp độ 40',
    },
  ],
  SLOWPOKE: [
    {
      targetSpeciesKey: 'SLOWBRO',
      method: 'level',
      requiredLevel: 37,
      descriptionVi: 'Đạt Cấp độ 37',
    },
    {
      targetSpeciesKey: 'SLOWKING',
      method: 'item',
      requiredItem: 'kings-rock',
      requiredItemNameVi: "Đá Vương Giả (King's Rock)",
      descriptionVi: "Giữ King's Rock để tiến hóa",
    },
  ],
  MAGNEMITE: [
    {
      targetSpeciesKey: 'MAGNETON',
      method: 'level',
      requiredLevel: 30,
      descriptionVi: 'Đạt Cấp độ 30',
    },
  ],
  DODUO: [
    {
      targetSpeciesKey: 'DODRIO',
      method: 'level',
      requiredLevel: 31,
      descriptionVi: 'Đạt Cấp độ 31',
    },
  ],
  SEEL: [
    {
      targetSpeciesKey: 'DEWGONG',
      method: 'level',
      requiredLevel: 34,
      descriptionVi: 'Đạt Cấp độ 34',
    },
  ],
  GRIMER: [
    { targetSpeciesKey: 'MUK', method: 'level', requiredLevel: 38, descriptionVi: 'Đạt Cấp độ 38' },
  ],
  SHELLDER: [
    {
      targetSpeciesKey: 'CLOYSTER',
      method: 'stone',
      requiredItem: 'water-stone',
      requiredItemNameVi: 'Đá Nước (Water Stone)',
      descriptionVi: 'Dùng Đá Nước',
    },
  ],
  GASTLY: [
    {
      targetSpeciesKey: 'HAUNTER',
      method: 'level',
      requiredLevel: 25,
      descriptionVi: 'Đạt Cấp độ 25',
    },
  ],
  HAUNTER: [
    {
      targetSpeciesKey: 'GENGAR',
      method: 'level',
      requiredLevel: 36,
      descriptionVi: 'Đạt Cấp độ 36',
    },
  ],
  DROWZEE: [
    {
      targetSpeciesKey: 'HYPNO',
      method: 'level',
      requiredLevel: 26,
      descriptionVi: 'Đạt Cấp độ 26',
    },
  ],
  KRABBY: [
    {
      targetSpeciesKey: 'KINGLER',
      method: 'level',
      requiredLevel: 28,
      descriptionVi: 'Đạt Cấp độ 28',
    },
  ],
  VOLTORB: [
    {
      targetSpeciesKey: 'ELECTRODE',
      method: 'level',
      requiredLevel: 30,
      descriptionVi: 'Đạt Cấp độ 30',
    },
  ],
  EXEGGCUTE: [
    {
      targetSpeciesKey: 'EXEGGUTOR',
      method: 'stone',
      requiredItem: 'leaf-stone',
      requiredItemNameVi: 'Đá Lá (Leaf Stone)',
      descriptionVi: 'Dùng Đá Lá',
    },
    {
      targetSpeciesKey: 'EXEGGUTOR_ALOLAN',
      method: 'stone',
      requiredItem: 'sun-stone',
      requiredItemNameVi: 'Đá Mặt Trời (Sun Stone)',
      descriptionVi: 'Dùng Đá Mặt Trời (Alolan Form)',
    },
  ],
  CUBONE: [
    {
      targetSpeciesKey: 'MAROWAK',
      method: 'level',
      requiredLevel: 28,
      descriptionVi: 'Đạt Cấp độ 28',
    },
    {
      targetSpeciesKey: 'MAROWAK_ALOLAN',
      method: 'stone',
      requiredItem: 'dusk-stone',
      requiredItemNameVi: 'Đá Bóng Tối (Dusk Stone)',
      descriptionVi: 'Dùng Đá Bóng Tối (Alolan Form)',
    },
  ],
  KOFFING: [
    {
      targetSpeciesKey: 'WEEZING',
      method: 'level',
      requiredLevel: 35,
      descriptionVi: 'Đạt Cấp độ 35',
    },
    {
      targetSpeciesKey: 'WEEZING_GALARIAN',
      method: 'stone',
      requiredItem: 'dusk-stone',
      requiredItemNameVi: 'Đá Bóng Tối (Dusk Stone)',
      descriptionVi: 'Dùng Đá Bóng Tối (Galarian Form)',
    },
  ],
  RHYHORN: [
    {
      targetSpeciesKey: 'RHYDON',
      method: 'level',
      requiredLevel: 42,
      descriptionVi: 'Đạt Cấp độ 42',
    },
  ],
  RHYDON: [
    {
      targetSpeciesKey: 'RHYPERIOR',
      method: 'item',
      requiredItem: 'protector',
      requiredItemNameVi: 'Giáp Bảo Hộ (Protector)',
      descriptionVi: 'Giữ Giáp Bảo Hộ (Protector) để tiến hóa',
    },
  ],
  HORSEA: [
    {
      targetSpeciesKey: 'SEADRA',
      method: 'level',
      requiredLevel: 32,
      descriptionVi: 'Đạt Cấp độ 32',
    },
  ],
  SEADRA: [
    {
      targetSpeciesKey: 'KINGDRA',
      method: 'item',
      requiredItem: 'dragon-scale',
      requiredItemNameVi: 'Vảy Rồng (Dragon Scale)',
      descriptionVi: 'Giữ Vảy Rồng (Dragon Scale) để tiến hóa',
    },
  ],
  GOLDEEN: [
    {
      targetSpeciesKey: 'SEAKING',
      method: 'level',
      requiredLevel: 33,
      descriptionVi: 'Đạt Cấp độ 33',
    },
  ],
  STARYU: [
    {
      targetSpeciesKey: 'STARMIE',
      method: 'stone',
      requiredItem: 'water-stone',
      requiredItemNameVi: 'Đá Nước (Water Stone)',
      descriptionVi: 'Dùng Đá Nước',
    },
  ],
  MAGIKARP: [
    {
      targetSpeciesKey: 'GYARADOS',
      method: 'level',
      requiredLevel: 20,
      descriptionVi: 'Đạt Cấp độ 20',
    },
  ],
  EEVEE: [
    {
      targetSpeciesKey: 'VAPOREON',
      method: 'stone',
      requiredItem: 'water-stone',
      requiredItemNameVi: 'Đá Nước (Water Stone)',
      descriptionVi: 'Dùng Đá Nước',
    },
    {
      targetSpeciesKey: 'JOLTEON',
      method: 'stone',
      requiredItem: 'thunder-stone',
      requiredItemNameVi: 'Đá Sét (Thunder Stone)',
      descriptionVi: 'Dùng Đá Sét',
    },
    {
      targetSpeciesKey: 'FLAREON',
      method: 'stone',
      requiredItem: 'fire-stone',
      requiredItemNameVi: 'Đá Lửa (Fire Stone)',
      descriptionVi: 'Dùng Đá Lửa',
    },
    {
      targetSpeciesKey: 'ESPEON',
      method: 'stone',
      requiredItem: 'sun-stone',
      requiredItemNameVi: 'Đá Mặt Trời (Sun Stone)',
      descriptionVi: 'Dùng Đá Mặt Trời',
    },
    {
      targetSpeciesKey: 'UMBREON',
      method: 'stone',
      requiredItem: 'moon-stone',
      requiredItemNameVi: 'Đá Mặt Trăng (Moon Stone)',
      descriptionVi: 'Dùng Đá Mặt Trăng',
    },
    {
      targetSpeciesKey: 'LEAFEON',
      method: 'stone',
      requiredItem: 'leaf-stone',
      requiredItemNameVi: 'Đá Lá (Leaf Stone)',
      descriptionVi: 'Dùng Đá Lá',
    },
    {
      targetSpeciesKey: 'GLACEON',
      method: 'stone',
      requiredItem: 'ice-stone',
      requiredItemNameVi: 'Đá Băng (Ice Stone)',
      descriptionVi: 'Dùng Đá Băng',
    },
    {
      targetSpeciesKey: 'SYLVEON',
      method: 'stone',
      requiredItem: 'shiny-stone',
      requiredItemNameVi: 'Đá Ánh Sáng (Shiny Stone)',
      descriptionVi: 'Dùng Đá Ánh Sáng',
    },
  ],
  OMANYTE: [
    {
      targetSpeciesKey: 'OMASTAR',
      method: 'level',
      requiredLevel: 40,
      descriptionVi: 'Đạt Cấp độ 40',
    },
  ],
  KABUTO: [
    {
      targetSpeciesKey: 'KABUTOPS',
      method: 'level',
      requiredLevel: 40,
      descriptionVi: 'Đạt Cấp độ 40',
    },
  ],
  DRATINI: [
    {
      targetSpeciesKey: 'DRAGONAIR',
      method: 'level',
      requiredLevel: 30,
      descriptionVi: 'Đạt Cấp độ 30',
    },
  ],
  DRAGONAIR: [
    {
      targetSpeciesKey: 'DRAGONITE',
      method: 'level',
      requiredLevel: 55,
      descriptionVi: 'Đạt Cấp độ 55',
    },
  ],
  CHANSEY: [
    {
      targetSpeciesKey: 'BLISSEY',
      method: 'item',
      requiredItem: 'soothe-bell',
      requiredItemNameVi: 'Chuông Tịnh Tâm (Soothe Bell)',
      descriptionVi: 'Giữ Chuông Tịnh Tâm (Soothe Bell) để tiến hóa',
    },
  ],
  ONIX: [
    {
      targetSpeciesKey: 'STEELIX',
      method: 'item',
      requiredItem: 'metal-coat',
      requiredItemNameVi: 'Áo Giáp Kim Loại (Metal Coat)',
      descriptionVi: 'Giữ Áo Giáp Kim Loại (Metal Coat) để tiến hóa',
    },
  ],
  SCYTHER: [
    {
      targetSpeciesKey: 'SCIZOR',
      method: 'item',
      requiredItem: 'metal-coat',
      requiredItemNameVi: 'Áo Giáp Kim Loại (Metal Coat)',
      descriptionVi: 'Giữ Áo Giáp Kim Loại (Metal Coat) để tiến hóa',
    },
    {
      targetSpeciesKey: 'KLEAVOR',
      method: 'item',
      requiredItem: 'black-augurite',
      requiredItemNameVi: 'Quặng Đen (Black Augurite)',
      descriptionVi: 'Giữ Quặng Đen (Black Augurite) để tiến hóa',
    },
  ],
  LICKITUNG: [
    {
      targetSpeciesKey: 'LICKILICKY',
      method: 'level',
      requiredLevel: 33,
      descriptionVi: 'Đạt Cấp độ 33',
    },
  ],
  TANGELA: [
    {
      targetSpeciesKey: 'TANGROWTH',
      method: 'level',
      requiredLevel: 36,
      descriptionVi: 'Đạt Cấp độ 36',
    },
  ],
  ELECTABUZZ: [
    {
      targetSpeciesKey: 'ELECTIVIRE',
      method: 'item',
      requiredItem: 'electirizer',
      requiredItemNameVi: 'Lõi Tụ Điện (Electirizer)',
      descriptionVi: 'Giữ Lõi Tụ Điện (Electirizer) để tiến hóa',
    },
  ],
  MAGMAR: [
    {
      targetSpeciesKey: 'MAGMORTAR',
      method: 'item',
      requiredItem: 'magmarizer',
      requiredItemNameVi: 'Lõi Nhiệt Hỏa (Magmarizer)',
      descriptionVi: 'Giữ Lõi Nhiệt Hỏa (Magmarizer) để tiến hóa',
    },
  ],
  PORYGON: [
    {
      targetSpeciesKey: 'PORYGON2',
      method: 'item',
      requiredItem: 'upgrade',
      requiredItemNameVi: 'Bản Nâng Cấp (Up-Grade)',
      descriptionVi: 'Giữ Bản Nâng Cấp (Up-Grade) để tiến hóa',
    },
  ],
  PORYGON2: [
    {
      targetSpeciesKey: 'PORYGONZ',
      method: 'item',
      requiredItem: 'dubious-disc',
      requiredItemNameVi: 'Đĩa Kỳ Lạ (Dubious Disc)',
      descriptionVi: 'Giữ Đĩa Kỳ Lạ (Dubious Disc) để tiến hóa',
    },
  ],
  // Regional Forms evolutions
  MEOWTH_2: [
    { targetSpeciesKey: 'PERRSERKER', method: 'level', requiredLevel: 28, descriptionVi: 'Đạt Cấp độ 28' },
  ],
  MEOWTH_GALARIAN: [
    { targetSpeciesKey: 'PERRSERKER', method: 'level', requiredLevel: 28, descriptionVi: 'Đạt Cấp độ 28' },
  ],
  FARFETCHD_1: [
    { targetSpeciesKey: 'SIRFETCHD', method: 'level', requiredLevel: 28, descriptionVi: 'Đạt Cấp độ 28' },
  ],
  FARFETCHD_GALARIAN: [
    { targetSpeciesKey: 'SIRFETCHD', method: 'level', requiredLevel: 28, descriptionVi: 'Đạt Cấp độ 28' },
  ],
  MRMIME_1: [
    { targetSpeciesKey: 'MRRIME', method: 'level', requiredLevel: 42, descriptionVi: 'Đạt Cấp độ 42' },
  ],
  MRMIME_GALARIAN: [
    { targetSpeciesKey: 'MRRIME', method: 'level', requiredLevel: 42, descriptionVi: 'Đạt Cấp độ 42' },
  ],
  SLOWPOKE_1: [
    { targetSpeciesKey: 'SLOWBRO_GALARIAN', method: 'level', requiredLevel: 37, descriptionVi: 'Đạt Cấp độ 37' },
    { targetSpeciesKey: 'SLOWKING_GALARIAN', method: 'item', requiredItem: 'kings-rock', requiredItemNameVi: "Đá Vương Giả (King's Rock)", descriptionVi: "Giữ King's Rock để tiến hóa" },
  ],
  SLOWPOKE_GALARIAN: [
    { targetSpeciesKey: 'SLOWBRO_GALARIAN', method: 'level', requiredLevel: 37, descriptionVi: 'Đạt Cấp độ 37' },
    { targetSpeciesKey: 'SLOWKING_GALARIAN', method: 'item', requiredItem: 'kings-rock', requiredItemNameVi: "Đá Vương Giả (King's Rock)", descriptionVi: "Giữ King's Rock để tiến hóa" },
  ],
  PONYTA_1: [
    { targetSpeciesKey: 'RAPIDASH_GALARIAN', method: 'level', requiredLevel: 40, descriptionVi: 'Đạt Cấp độ 40' },
  ],
  PONYTA_GALARIAN: [
    { targetSpeciesKey: 'RAPIDASH_GALARIAN', method: 'level', requiredLevel: 40, descriptionVi: 'Đạt Cấp độ 40' },
  ],
  RATTATA_1: [
    { targetSpeciesKey: 'RATICATE_ALOLAN', method: 'level', requiredLevel: 20, descriptionVi: 'Đạt Cấp độ 20' },
  ],
  RATTATA_ALOLAN: [
    { targetSpeciesKey: 'RATICATE_ALOLAN', method: 'level', requiredLevel: 20, descriptionVi: 'Đạt Cấp độ 20' },
  ],
  SANDSHREW_1: [
    { targetSpeciesKey: 'SANDSLASH_ALOLAN', method: 'stone', requiredItem: 'ice-stone', requiredItemNameVi: 'Đá Băng (Ice Stone)', descriptionVi: 'Dùng Đá Băng' },
  ],
  SANDSHREW_ALOLAN: [
    { targetSpeciesKey: 'SANDSLASH_ALOLAN', method: 'stone', requiredItem: 'ice-stone', requiredItemNameVi: 'Đá Băng (Ice Stone)', descriptionVi: 'Dùng Đá Băng' },
  ],
  VULPIX_1: [
    { targetSpeciesKey: 'NINETALES_ALOLAN', method: 'stone', requiredItem: 'ice-stone', requiredItemNameVi: 'Đá Băng (Ice Stone)', descriptionVi: 'Dùng Đá Băng' },
  ],
  VULPIX_ALOLAN: [
    { targetSpeciesKey: 'NINETALES_ALOLAN', method: 'stone', requiredItem: 'ice-stone', requiredItemNameVi: 'Đá Băng (Ice Stone)', descriptionVi: 'Dùng Đá Băng' },
  ],
  DIGLETT_1: [
    { targetSpeciesKey: 'DUGTRIO_ALOLAN', method: 'level', requiredLevel: 26, descriptionVi: 'Đạt Cấp độ 26' },
  ],
  DIGLETT_ALOLAN: [
    { targetSpeciesKey: 'DUGTRIO_ALOLAN', method: 'level', requiredLevel: 26, descriptionVi: 'Đạt Cấp độ 26' },
  ],
  MEOWTH_1: [
    { targetSpeciesKey: 'PERSIAN_ALOLAN', method: 'level', requiredLevel: 28, descriptionVi: 'Đạt Cấp độ 28' },
  ],
  MEOWTH_ALOLAN: [
    { targetSpeciesKey: 'PERSIAN_ALOLAN', method: 'level', requiredLevel: 28, descriptionVi: 'Đạt Cấp độ 28' },
  ],
  GEODUDE_1: [
    { targetSpeciesKey: 'GRAVELER_ALOLAN', method: 'level', requiredLevel: 25, descriptionVi: 'Đạt Cấp độ 25' },
  ],
  GEODUDE_ALOLAN: [
    { targetSpeciesKey: 'GRAVELER_ALOLAN', method: 'level', requiredLevel: 25, descriptionVi: 'Đạt Cấp độ 25' },
  ],
  GRAVELER_1: [
    { targetSpeciesKey: 'GOLEM_ALOLAN', method: 'level', requiredLevel: 36, descriptionVi: 'Đạt Cấp độ 36' },
  ],
  GRAVELER_ALOLAN: [
    { targetSpeciesKey: 'GOLEM_ALOLAN', method: 'level', requiredLevel: 36, descriptionVi: 'Đạt Cấp độ 36' },
  ],
  GRIMER_1: [
    { targetSpeciesKey: 'MUK_ALOLAN', method: 'level', requiredLevel: 38, descriptionVi: 'Đạt Cấp độ 38' },
  ],
  GRIMER_ALOLAN: [
    { targetSpeciesKey: 'MUK_ALOLAN', method: 'level', requiredLevel: 38, descriptionVi: 'Đạt Cấp độ 38' },
  ],
  GROWLITHE_1: [
    { targetSpeciesKey: 'ARCANINE_HISUIAN', method: 'stone', requiredItem: 'fire-stone', requiredItemNameVi: 'Đá Lửa (Fire Stone)', descriptionVi: 'Dùng Đá Lửa' },
  ],
  GROWLITHE_HISUIAN: [
    { targetSpeciesKey: 'ARCANINE_HISUIAN', method: 'stone', requiredItem: 'fire-stone', requiredItemNameVi: 'Đá Lửa (Fire Stone)', descriptionVi: 'Dùng Đá Lửa' },
  ],
  VOLTORB_1: [
    { targetSpeciesKey: 'ELECTRODE_HISUIAN', method: 'stone', requiredItem: 'leaf-stone', requiredItemNameVi: 'Đá Lá (Leaf Stone)', descriptionVi: 'Dùng Đá Lá' },
  ],
  VOLTORB_HISUIAN: [
    { targetSpeciesKey: 'ELECTRODE_HISUIAN', method: 'stone', requiredItem: 'leaf-stone', requiredItemNameVi: 'Đá Lá (Leaf Stone)', descriptionVi: 'Dùng Đá Lá' },
  ],
};

/**
 * Gets all possible evolution paths for a Pokémon species.
 */
export function getEvolutionRequirements(speciesKey: string): EvolutionRequirement[] {
  const normalizedKey = speciesKey.toUpperCase();
  const list = GEN1_EVOLUTIONS[normalizedKey] ?? [];
  return list.map((item) => {
    const targetSpecies = pokemonCatalog.getBySpeciesKey(item.targetSpeciesKey);
    return {
      ...item,
      targetSpeciesNameVi: targetSpecies?.name || item.targetSpeciesKey,
    };
  });
}

/**
 * Evaluates whether a Pokémon currently meets requirements to evolve.
 * Returns the highest priority ready evolution, or null if requirements not met.
 */
export function canPokemonEvolve(pokemon: PartyPokemon): {
  canEvolve: boolean;
  evolution?: EvolutionRequirement;
  reason?: string;
} {
  const reqs = getEvolutionRequirements(pokemon.speciesKey);
  if (reqs.length === 0) {
    return { canEvolve: false, reason: 'Pokémon này không thể tiến hóa thêm.' };
  }

  // 1. Check level-based evolutions first
  for (const req of reqs) {
    if (req.method === 'level' && req.requiredLevel !== undefined) {
      if (pokemon.level >= req.requiredLevel) {
        return { canEvolve: true, evolution: req };
      }
    }
  }

  // 2. Check item/stone evolutions: Pokémon must be HOLDING the required stone/item!
  for (const req of reqs) {
    if ((req.method === 'stone' || req.method === 'item') && req.requiredItem) {
      if (isPokemonHoldingItem(pokemon, req.requiredItem)) {
        return { canEvolve: true, evolution: req };
      }
    }
  }

  // Not ready yet: return first requirement with reason
  const primaryReq = reqs[0];
  if (primaryReq.method === 'level') {
    return {
      canEvolve: false,
      evolution: primaryReq,
      reason: `Cần đạt Cấp độ ${primaryReq.requiredLevel} (Hiện tại: Lv.${pokemon.level})`,
    };
  }
  return {
    canEvolve: false,
    evolution: primaryReq,
    reason: `Cần cho Pokémon giữ ${primaryReq.requiredItemNameVi || primaryReq.requiredItem} để tiến hóa`,
  };
}

/**
 * Gets all currently eligible evolutions for a Pokémon (useful if multiple branches are ready).
 */
export function getAvailableEvolutions(pokemon: PartyPokemon): EvolutionRequirement[] {
  const reqs = getEvolutionRequirements(pokemon.speciesKey);
  return reqs.filter((req) => {
    if (req.method === 'level' && req.requiredLevel !== undefined) {
      return pokemon.level >= req.requiredLevel;
    }
    if ((req.method === 'stone' || req.method === 'item') && req.requiredItem) {
      return isPokemonHoldingItem(pokemon, req.requiredItem);
    }
    return false;
  });
}

/**
 * Mutates a PartyPokemon into its evolved form, recalculates canonical stats, and updates HP.
 * Consumes any held evolution stone/item used during evolution.
 */
export function applyEvolution(
  pokemon: PartyPokemon,
  targetSpeciesKey: string
): {
  oldName: string;
  newName: string;
  targetSpecies: NonNullable<ReturnType<typeof pokemonCatalog.getBySpeciesKey>>;
  hpGained: number;
} {
  const targetSpecies = pokemonCatalog.getBySpeciesKey(targetSpeciesKey);
  if (!targetSpecies) {
    throw new Error(`Target species key "${targetSpeciesKey}" not found in catalog.`);
  }

  const oldSpeciesName = pokemon.nickname || pokemon.name;
  const hasNickname = !!pokemon.nickname;

  // Consume held evolution stone / item upon successful evolution
  const reqs = getEvolutionRequirements(pokemon.speciesKey);
  const matchedReq = reqs.find(
    (r) => r.targetSpeciesKey.toUpperCase() === targetSpeciesKey.toUpperCase()
  );
  if (
    matchedReq &&
    (matchedReq.method === 'stone' || matchedReq.method === 'item') &&
    matchedReq.requiredItem
  ) {
    pokemon.heldItem = null;
  }

  pokemon.speciesId = targetSpecies.id;
  pokemon.speciesKey = targetSpecies.speciesKey;
  if (!hasNickname) {
    pokemon.name = targetSpecies.name;
  } else {
    pokemon.name = pokemon.nickname!;
  }
  pokemon.types = [...targetSpecies.types];
  if (targetSpecies.abilities) {
    const slot = pokemon.abilitySlot ?? 'primary';
    pokemon.ability = targetSpecies.abilities[slot] ?? targetSpecies.abilities.primary;
  } else if (targetSpecies.ability) {
    pokemon.ability = targetSpecies.ability;
  }

  const { hpGained } = recalculatePartyPokemonStats(pokemon, pokemon.level);

  return {
    oldName: oldSpeciesName,
    newName: pokemon.name,
    targetSpecies,
    hpGained,
  };
}
