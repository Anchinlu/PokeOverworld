/**
 * Declarative Data-Driven Item Effects Catalog
 * Single Source of Truth for item properties, target scopes, and effects.
 * Eliminates duplicate if-else chains and standardizes Gen 7/8 items.
 */

import type { StatusCondition, StatStages } from '../../battle/types';
import type { StatKey, NatureName } from '@pokemon/shared-types';

export type ItemTargetScope = 'party' | 'battler' | 'both';

export interface ItemEffectDef {
  targetScope: ItemTargetScope;
  healHp?: number;
  healRatio?: number;
  cureStatus?: StatusCondition[] | 'all';
  reviveRatio?: number;
  reviveAllParty?: boolean;
  addEv?: { stat: StatKey; amount: number };
  subEv?: { stat: StatKey; amount: number };
  statStageBuff?: { stat: keyof StatStages; stages: number };
  critStageBuff?: number;
  restorePp?: { amount: number | 'max'; target: 'single' | 'all' };
  boostMaxPp?: 'boost' | 'max';
  levelUp?: number;
  addExp?: number;
  natureMint?: NatureName;
  evolutionStone?: string;
  ivHyperTraining?: 'single' | 'all';
  abilityModifier?: 'switch' | 'hidden';
  teachMove?: string;
}

/**
 * Canonical Stone Evolution Mapping
 */
export const STONE_EVOLUTIONS: Record<string, Record<string, string>> = {
  'fire-stone': {
    VULPIX: 'NINETALES',
    GROWLITHE: 'ARCANINE',
    EEVEE: 'FLAREON',
  },
  'water-stone': {
    POLIWHIRL: 'POLIWRATH',
    SHELLDER: 'CLOYSTER',
    STARYU: 'STARMIE',
    EEVEE: 'VAPOREON',
  },
  'thunder-stone': {
    PIKACHU: 'RAICHU',
    EEVEE: 'JOLTEON',
  },
  'leaf-stone': {
    GLOOM: 'VILEPLUME',
    WEEPINBELL: 'VICTREEBEL',
    EXEGGCUTE: 'EXEGGUTOR',
  },
  'moon-stone': {
    NIDORINA: 'NIDOQUEEN',
    NIDORINO: 'NIDOKING',
    CLEFAIRY: 'CLEFABLE',
    JIGGLYPUFF: 'WIGGLYTUFF',
  },
  'sun-stone': {
    GLOOM: 'VILEPLUME',
  },
  'ice-stone': {
    VULPIX: 'NINETALES',
    SANDSHREW: 'SANDSLASH',
  },
  'shiny-stone': {
    PIKACHU: 'RAICHU',
  },
  'dusk-stone': {
    SHELLDER: 'CLOYSTER',
  },
  'dawn-stone': {
    POLIWHIRL: 'POLIWRATH',
  },
};

/**
 * Declarative Registry of all usable items in overworld and battle.
 * Keys are normalized lower-case kebab slugs.
 */
export const ITEM_EFFECTS_REGISTRY: Record<string, ItemEffectDef> = {
  // --- Potions & Drinks (Gen 7 standard) ---
  potion: { targetScope: 'both', healHp: 20 },
  'super-potion': { targetScope: 'both', healHp: 60 },
  'hyper-potion': { targetScope: 'both', healHp: 120 },
  'max-potion': { targetScope: 'both', healRatio: 1.0 },
  'full-restore': { targetScope: 'both', healRatio: 1.0, cureStatus: 'all' },
  'fresh-water': { targetScope: 'both', healHp: 30 },
  'soda-pop': { targetScope: 'both', healHp: 50 },
  lemonade: { targetScope: 'both', healHp: 70 },
  'moomoo-milk': { targetScope: 'both', healHp: 100 },
  'sweet-heart': { targetScope: 'both', healHp: 20 },
  'berry-juice': { targetScope: 'both', healHp: 20 },
  'energy-powder': { targetScope: 'both', healHp: 60 },
  'energy-root': { targetScope: 'both', healHp: 120 },

  // --- Berries (HP, Pinch & Status) ---
  'oran-berry': { targetScope: 'both', healHp: 10 },
  'sitrus-berry': { targetScope: 'both', healRatio: 0.25 },
  'figy-berry': { targetScope: 'both', healRatio: 0.33 },
  'wiki-berry': { targetScope: 'both', healRatio: 0.33 },
  'mago-berry': { targetScope: 'both', healRatio: 0.33 },
  'aguav-berry': { targetScope: 'both', healRatio: 0.33 },
  'iapapa-berry': { targetScope: 'both', healRatio: 0.33 },

  // --- EV-Reducing Berries ---
  'pomeg-berry': { targetScope: 'party', subEv: { stat: 'hp', amount: 10 } },
  'kelpsy-berry': { targetScope: 'party', subEv: { stat: 'attack', amount: 10 } },
  'qualot-berry': { targetScope: 'party', subEv: { stat: 'defense', amount: 10 } },
  'hondew-berry': { targetScope: 'party', subEv: { stat: 'spAtk', amount: 10 } },
  'grepa-berry': { targetScope: 'party', subEv: { stat: 'spDef', amount: 10 } },
  'tamato-berry': { targetScope: 'party', subEv: { stat: 'speed', amount: 10 } },

  // --- Revives ---
  revive: { targetScope: 'both', reviveRatio: 0.5 },
  'max-revive': { targetScope: 'both', reviveRatio: 1.0 },
  'revival-herb': { targetScope: 'both', reviveRatio: 1.0 },
  'sacred-ash': { targetScope: 'both', reviveRatio: 1.0, reviveAllParty: true },

  // --- Status Curing Items ---
  antidote: { targetScope: 'both', cureStatus: ['poison', 'toxic'] },
  'pecha-berry': { targetScope: 'both', cureStatus: ['poison', 'toxic'] },
  awakening: { targetScope: 'both', cureStatus: ['sleep'] },
  'chesto-berry': { targetScope: 'both', cureStatus: ['sleep'] },
  'blue-flute': { targetScope: 'both', cureStatus: ['sleep'] },
  'parlyz-heal': { targetScope: 'both', cureStatus: ['paralysis'] },
  'paralyze-heal': { targetScope: 'both', cureStatus: ['paralysis'] },
  'cheri-berry': { targetScope: 'both', cureStatus: ['paralysis'] },
  'burn-heal': { targetScope: 'both', cureStatus: ['burn'] },
  'rawst-berry': { targetScope: 'both', cureStatus: ['burn'] },
  'ice-heal': { targetScope: 'both', cureStatus: ['freeze'] },
  'aspear-berry': { targetScope: 'both', cureStatus: ['freeze'] },
  'full-heal': { targetScope: 'both', cureStatus: 'all' },
  'lum-berry': { targetScope: 'both', cureStatus: 'all' },
  'lava-cookie': { targetScope: 'both', cureStatus: 'all' },
  'old-gateau': { targetScope: 'both', cureStatus: 'all' },
  casteliacone: { targetScope: 'both', cureStatus: 'all' },
  'heal-powder': { targetScope: 'both', cureStatus: 'all' },
  'big-malasada': { targetScope: 'both', cureStatus: 'all' },
  'rage-candy-bar': { targetScope: 'both', cureStatus: 'all' },
  'lumiose-galette': { targetScope: 'both', cureStatus: 'all' },
  'shalour-sable': { targetScope: 'both', cureStatus: 'all' },
  'pewter-crunchies': { targetScope: 'both', cureStatus: 'all' },
  'yellow-flute': { targetScope: 'both', cureStatus: 'all' },
  'red-flute': { targetScope: 'both', cureStatus: 'all' },
  'persim-berry': { targetScope: 'both', cureStatus: 'all' },

  // --- Candies (Rare Candy & Exp Candies) ---
  'rare-candy': { targetScope: 'party', levelUp: 1 },
  rarecandy: { targetScope: 'party', levelUp: 1 },
  'exp-candy-xs': { targetScope: 'party', addExp: 100 },
  'exp-candy-s': { targetScope: 'party', addExp: 800 },
  'exp-candy-m': { targetScope: 'party', addExp: 3000 },
  'exp-candy-l': { targetScope: 'party', addExp: 10000 },
  'exp-candy-xl': { targetScope: 'party', addExp: 30000 },

  // --- Nature Mints (Thay đổi tính cách) ---
  'adamant-mint': { targetScope: 'party', natureMint: 'Adamant' },
  'bold-mint': { targetScope: 'party', natureMint: 'Bold' },
  'brave-mint': { targetScope: 'party', natureMint: 'Brave' },
  'calm-mint': { targetScope: 'party', natureMint: 'Calm' },
  'careful-mint': { targetScope: 'party', natureMint: 'Careful' },
  'gentle-mint': { targetScope: 'party', natureMint: 'Gentle' },
  'hasty-mint': { targetScope: 'party', natureMint: 'Hasty' },
  'impish-mint': { targetScope: 'party', natureMint: 'Impish' },
  'jolly-mint': { targetScope: 'party', natureMint: 'Jolly' },
  'lax-mint': { targetScope: 'party', natureMint: 'Lax' },
  'lonely-mint': { targetScope: 'party', natureMint: 'Lonely' },
  'mild-mint': { targetScope: 'party', natureMint: 'Mild' },
  'modest-mint': { targetScope: 'party', natureMint: 'Modest' },
  'naive-mint': { targetScope: 'party', natureMint: 'Naive' },
  'naughty-mint': { targetScope: 'party', natureMint: 'Naughty' },
  'quiet-mint': { targetScope: 'party', natureMint: 'Quiet' },
  'rash-mint': { targetScope: 'party', natureMint: 'Rash' },
  'relaxed-mint': { targetScope: 'party', natureMint: 'Relaxed' },
  'sassy-mint': { targetScope: 'party', natureMint: 'Sassy' },
  'serious-mint': { targetScope: 'party', natureMint: 'Serious' },
  'timid-mint': { targetScope: 'party', natureMint: 'Timid' },

  // --- Stat Boost Vitamins (+10 EV) ---
  'hp-up': { targetScope: 'party', addEv: { stat: 'hp', amount: 10 } },
  protein: { targetScope: 'party', addEv: { stat: 'attack', amount: 10 } },
  iron: { targetScope: 'party', addEv: { stat: 'defense', amount: 10 } },
  calcium: { targetScope: 'party', addEv: { stat: 'spAtk', amount: 10 } },
  zinc: { targetScope: 'party', addEv: { stat: 'spDef', amount: 10 } },
  carbos: { targetScope: 'party', addEv: { stat: 'speed', amount: 10 } },

  // --- PP Restorers & PP Enhancers ---
  ether: { targetScope: 'both', restorePp: { amount: 10, target: 'single' } },
  'max-ether': { targetScope: 'both', restorePp: { amount: 'max', target: 'single' } },
  elixir: { targetScope: 'both', restorePp: { amount: 10, target: 'all' } },
  'max-elixir': { targetScope: 'both', restorePp: { amount: 'max', target: 'all' } },
  'leppa-berry': { targetScope: 'both', restorePp: { amount: 10, target: 'single' } },
  'pp-up': { targetScope: 'party', boostMaxPp: 'boost' },
  'pp-max': { targetScope: 'party', boostMaxPp: 'max' },

  // --- Evolution Stones (Đá tiến hóa) ---
  'fire-stone': { targetScope: 'party', evolutionStone: 'fire-stone' },
  'water-stone': { targetScope: 'party', evolutionStone: 'water-stone' },
  'thunder-stone': { targetScope: 'party', evolutionStone: 'thunder-stone' },
  'leaf-stone': { targetScope: 'party', evolutionStone: 'leaf-stone' },
  'moon-stone': { targetScope: 'party', evolutionStone: 'moon-stone' },
  'sun-stone': { targetScope: 'party', evolutionStone: 'sun-stone' },
  'shiny-stone': { targetScope: 'party', evolutionStone: 'shiny-stone' },
  'dusk-stone': { targetScope: 'party', evolutionStone: 'dusk-stone' },
  'dawn-stone': { targetScope: 'party', evolutionStone: 'dawn-stone' },
  'ice-stone': { targetScope: 'party', evolutionStone: 'ice-stone' },

  // --- IV Training (Bottle Caps) & Ability ---
  'bottle-cap': { targetScope: 'party', ivHyperTraining: 'single' },
  'gold-bottle-cap': { targetScope: 'party', ivHyperTraining: 'all' },
  'ability-capsule': { targetScope: 'party', abilityModifier: 'switch' },
  'ability-patch': { targetScope: 'party', abilityModifier: 'hidden' },

  // --- Battle Stat Boosters (Active Battler) ---
  'x-attack': { targetScope: 'battler', statStageBuff: { stat: 'attack', stages: 2 } },
  'x-attack-2': { targetScope: 'battler', statStageBuff: { stat: 'attack', stages: 2 } },
  'x-attack-3': { targetScope: 'battler', statStageBuff: { stat: 'attack', stages: 3 } },
  'x-attack-6': { targetScope: 'battler', statStageBuff: { stat: 'attack', stages: 6 } },

  'x-defense': { targetScope: 'battler', statStageBuff: { stat: 'defense', stages: 2 } },
  'x-defense-2': { targetScope: 'battler', statStageBuff: { stat: 'defense', stages: 2 } },
  'x-defense-3': { targetScope: 'battler', statStageBuff: { stat: 'defense', stages: 3 } },
  'x-defense-6': { targetScope: 'battler', statStageBuff: { stat: 'defense', stages: 6 } },

  'x-speed': { targetScope: 'battler', statStageBuff: { stat: 'speed', stages: 2 } },
  'x-speed-2': { targetScope: 'battler', statStageBuff: { stat: 'speed', stages: 2 } },
  'x-speed-3': { targetScope: 'battler', statStageBuff: { stat: 'speed', stages: 3 } },
  'x-speed-6': { targetScope: 'battler', statStageBuff: { stat: 'speed', stages: 6 } },

  'x-sp-atk': { targetScope: 'battler', statStageBuff: { stat: 'spAtk', stages: 2 } },
  'x-sp-atk-2': { targetScope: 'battler', statStageBuff: { stat: 'spAtk', stages: 2 } },
  'x-sp-atk-3': { targetScope: 'battler', statStageBuff: { stat: 'spAtk', stages: 3 } },
  'x-sp-atk-6': { targetScope: 'battler', statStageBuff: { stat: 'spAtk', stages: 6 } },

  'x-sp-def': { targetScope: 'battler', statStageBuff: { stat: 'spDef', stages: 2 } },
  'x-sp-def-2': { targetScope: 'battler', statStageBuff: { stat: 'spDef', stages: 2 } },
  'x-sp-def-3': { targetScope: 'battler', statStageBuff: { stat: 'spDef', stages: 3 } },
  'x-sp-def-6': { targetScope: 'battler', statStageBuff: { stat: 'spDef', stages: 6 } },

  'x-accuracy': { targetScope: 'battler', statStageBuff: { stat: 'accuracy', stages: 2 } },
  'x-accuracy-2': { targetScope: 'battler', statStageBuff: { stat: 'accuracy', stages: 2 } },
  'x-accuracy-3': { targetScope: 'battler', statStageBuff: { stat: 'accuracy', stages: 3 } },
  'x-accuracy-6': { targetScope: 'battler', statStageBuff: { stat: 'accuracy', stages: 6 } },

  'dire-hit': { targetScope: 'battler', critStageBuff: 2 },
  'dire-hit-2': { targetScope: 'battler', critStageBuff: 2 },
  'dire-hit-3': { targetScope: 'battler', critStageBuff: 3 },
  'guard-specs': { targetScope: 'battler' },
  'guard-spec': { targetScope: 'battler' },
};

/**
 * Standard mapping of 100 Technical Machines (TM01 - TM100) and 8 Hidden Machines (HM01 - HM08)
 * to their respective move IDs in MOVES_DB.
 */
export const TM_MOVE_MAPPING: Record<string, string> = {
  tm01: 'work_up',
  tm02: 'dragon_claw',
  tm03: 'psyshock',
  tm04: 'calm_mind',
  tm05: 'roar',
  tm06: 'toxic',
  tm07: 'hail',
  tm08: 'bulk_up',
  tm09: 'venoshock',
  tm10: 'hidden_power',
  tm11: 'sunny_day',
  tm12: 'taunt',
  tm13: 'ice_beam',
  tm14: 'blizzard',
  tm15: 'hyper_beam',
  tm16: 'light_screen',
  tm17: 'protect',
  tm18: 'rain_dance',
  tm19: 'roost',
  tm20: 'safeguard',
  tm21: 'frustration',
  tm22: 'solar_beam',
  tm23: 'smack_down',
  tm24: 'thunderbolt',
  tm25: 'thunder',
  tm26: 'earthquake',
  tm27: 'return',
  tm28: 'leech_life',
  tm29: 'psychic',
  tm30: 'shadow_ball',
  tm31: 'brick_break',
  tm32: 'double_team',
  tm33: 'reflect',
  tm34: 'sludge_wave',
  tm35: 'flamethrower',
  tm36: 'sludge_bomb',
  tm37: 'sandstorm',
  tm38: 'fire_blast',
  tm39: 'rock_tomb',
  tm40: 'aerial_ace',
  tm41: 'torment',
  tm42: 'facade',
  tm43: 'flame_charge',
  tm44: 'rest',
  tm45: 'attract',
  tm46: 'thief',
  tm47: 'low_sweep',
  tm48: 'round',
  tm49: 'echoed_voice',
  tm50: 'overheat',
  tm51: 'steel_wing',
  tm52: 'focus_blast',
  tm53: 'energy_ball',
  tm54: 'false_swipe',
  tm55: 'scald',
  tm56: 'fling',
  tm57: 'charge_beam',
  tm58: 'sky_drop',
  tm59: 'brutal_swing',
  tm60: 'quash',
  tm61: 'will_o_wisp',
  tm62: 'acrobatics',
  tm63: 'embargo',
  tm64: 'explosion',
  tm65: 'shadow_claw',
  tm66: 'payback',
  tm67: 'smart_strike',
  tm68: 'giga_impact',
  tm69: 'rock_polish',
  tm70: 'aurora_veil',
  tm71: 'stone_edge',
  tm72: 'volt_switch',
  tm73: 'thunder_wave',
  tm74: 'gyro_ball',
  tm75: 'swords_dance',
  tm76: 'fly',
  tm77: 'psych_up',
  tm78: 'bulldoze',
  tm79: 'frost_breath',
  tm80: 'rock_slide',
  tm81: 'x_scissor',
  tm82: 'dragon_tail',
  tm83: 'infestation',
  tm84: 'poison_jab',
  tm85: 'dream_eater',
  tm86: 'grass_knot',
  tm87: 'swagger',
  tm88: 'sleep_talk',
  tm89: 'u_turn',
  tm90: 'substitute',
  tm91: 'flash_cannon',
  tm92: 'trick_room',
  tm93: 'wild_charge',
  tm94: 'surf',
  tm95: 'snarl',
  tm96: 'nature_power',
  tm97: 'dark_pulse',
  tm98: 'waterfall',
  tm99: 'dazzling_gleam',
  tm100: 'confide',
  hm01: 'cut',
  hm02: 'fly',
  hm03: 'surf',
  hm04: 'strength',
  hm05: 'waterfall',
  hm06: 'rock_smash',
  hm07: 'dive',
  hm08: 'rock_climb',
};

/**
 * Retrieves the effect definition for an item by slug/id.
 */
export function getItemEffectDef(idOrSlug: string): ItemEffectDef | undefined {
  if (!idOrSlug) return undefined;
  const key = idOrSlug.toLowerCase().replace(/_/g, '-');
  if (ITEM_EFFECTS_REGISTRY[key]) {
    return ITEM_EFFECTS_REGISTRY[key];
  }
  const clean = key.replace(/-/g, '');
  const moveId = TM_MOVE_MAPPING[clean] || TM_MOVE_MAPPING[key];
  if (moveId) {
    return {
      targetScope: 'party',
      teachMove: moveId,
    };
  }
  return undefined;
}

/**
 * Checks whether an item requires selecting a specific move from a Pokémon
 * (e.g., Ether, Max Ether, Leppa Berry for single move PP restoration, or PP Up/PP Max).
 */
export function isMoveTargetItem(idOrSlug: string): boolean {
  const def = getItemEffectDef(idOrSlug);
  if (!def) return false;
  return (def.restorePp?.target === 'single') || (def.boostMaxPp !== undefined);
}

