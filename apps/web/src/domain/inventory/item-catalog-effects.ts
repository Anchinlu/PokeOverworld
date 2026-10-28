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
    GROWLITHE_1: 'ARCANINE_HISUIAN',
    GROWLITHE_HISUIAN: 'ARCANINE_HISUIAN',
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
    VOLTORB_1: 'ELECTRODE_HISUIAN',
    VOLTORB_HISUIAN: 'ELECTRODE_HISUIAN',
    EEVEE: 'LEAFEON',
  },
  'moon-stone': {
    NIDORINA: 'NIDOQUEEN',
    NIDORINO: 'NIDOKING',
    CLEFAIRY: 'CLEFABLE',
    JIGGLYPUFF: 'WIGGLYTUFF',
    EEVEE: 'UMBREON',
  },
  'sun-stone': {
    GLOOM: 'VILEPLUME',
    EXEGGCUTE: 'EXEGGUTOR_ALOLAN',
    EEVEE: 'ESPEON',
  },
  'ice-stone': {
    VULPIX: 'NINETALES',
    VULPIX_1: 'NINETALES_ALOLAN',
    VULPIX_ALOLAN: 'NINETALES_ALOLAN',
    SANDSHREW: 'SANDSLASH',
    SANDSHREW_1: 'SANDSLASH_ALOLAN',
    SANDSHREW_ALOLAN: 'SANDSLASH_ALOLAN',
    EEVEE: 'GLACEON',
  },
  'shiny-stone': {
    PIKACHU: 'RAICHU_ALOLAN',
    EEVEE: 'SYLVEON',
  },
  'dusk-stone': {
    SHELLDER: 'CLOYSTER',
    CUBONE: 'MAROWAK_ALOLAN',
    KOFFING: 'WEEZING_GALARIAN',
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
 * Gen 9 Technical Machines (TM001 - TM229) and Hidden Machines (HM01 - HM08)
 * mapped to their respective move IDs in MOVES_DB.
 */
export const TM_MOVE_MAPPING: Record<string, string> = {
  tm001: 'take_down',
  tm002: 'charm',
  tm003: 'fake_tears',
  tm004: 'agility',
  tm005: 'mud_slap',
  tm006: 'scary_face',
  tm007: 'protect',
  tm008: 'fire_fang',
  tm009: 'thunder_fang',
  tm010: 'ice_fang',
  tm011: 'water_pulse',
  tm012: 'low_kick',
  tm013: 'acid_spray',
  tm014: 'acrobatics',
  tm015: 'struggle_bug',
  tm016: 'psybeam',
  tm017: 'confuse_ray',
  tm018: 'thief',
  tm019: 'disarming_voice',
  tm020: 'trailblaze',
  tm021: 'pounce',
  tm022: 'chilling_water',
  tm023: 'charge_beam',
  tm024: 'fire_spin',
  tm025: 'facade',
  tm026: 'poison_tail',
  tm027: 'aerial_ace',
  tm028: 'bulldoze',
  tm029: 'hex',
  tm030: 'snarl',
  tm031: 'metal_claw',
  tm032: 'swift',
  tm033: 'magical_leaf',
  tm034: 'icy_wind',
  tm035: 'mud_shot',
  tm036: 'rock_tomb',
  tm037: 'draining_kiss',
  tm038: 'flame_charge',
  tm039: 'low_sweep',
  tm040: 'air_cutter',
  tm041: 'stored_power',
  tm042: 'night_shade',
  tm043: 'fling',
  tm044: 'dragon_tail',
  tm045: 'venoshock',
  tm046: 'avalanche',
  tm047: 'endure',
  tm048: 'volt_switch',
  tm049: 'sunny_day',
  tm050: 'rain_dance',
  tm051: 'sandstorm',
  tm052: 'snowscape',
  tm053: 'smart_strike',
  tm054: 'psyshock',
  tm055: 'dig',
  tm056: 'bullet_seed',
  tm057: 'false_swipe',
  tm058: 'brick_break',
  tm059: 'zen_headbutt',
  tm060: 'u_turn',
  tm061: 'shadow_claw',
  tm062: 'foul_play',
  tm063: 'psychic_fangs',
  tm064: 'bulk_up',
  tm065: 'air_slash',
  tm066: 'body_slam',
  tm067: 'fire_punch',
  tm068: 'thunder_punch',
  tm069: 'ice_punch',
  tm070: 'sleep_talk',
  tm071: 'seed_bomb',
  tm072: 'electro_ball',
  tm073: 'drain_punch',
  tm074: 'reflect',
  tm075: 'light_screen',
  tm076: 'rock_blast',
  tm077: 'waterfall',
  tm078: 'dragon_claw',
  tm079: 'dazzling_gleam',
  tm080: 'metronome',
  tm081: 'grass_knot',
  tm082: 'thunder_wave',
  tm083: 'poison_jab',
  tm084: 'stomping_tantrum',
  tm085: 'rest',
  tm086: 'rock_slide',
  tm087: 'taunt',
  tm088: 'swords_dance',
  tm089: 'body_press',
  tm090: 'spikes',
  tm091: 'toxic_spikes',
  tm092: 'imprison',
  tm093: 'flash_cannon',
  tm094: 'dark_pulse',
  tm095: 'leech_life',
  tm096: 'eerie_impulse',
  tm097: 'fly',
  tm098: 'skill_swap',
  tm099: 'iron_head',
  tm100: 'dragon_dance',
  tm101: 'power_gem',
  tm102: 'gunk_shot',
  tm103: 'substitute',
  tm104: 'iron_defense',
  tm105: 'x_scissor',
  tm106: 'drill_run',
  tm107: 'will_o_wisp',
  tm108: 'crunch',
  tm109: 'trick',
  tm110: 'liquidation',
  tm111: 'giga_drain',
  tm112: 'aura_sphere',
  tm113: 'tailwind',
  tm114: 'shadow_ball',
  tm115: 'dragon_pulse',
  tm116: 'stealth_rock',
  tm117: 'hyper_voice',
  tm118: 'heat_wave',
  tm119: 'energy_ball',
  tm120: 'psychic',
  tm121: 'heavy_slam',
  tm122: 'encore',
  tm123: 'surf',
  tm124: 'ice_spinner',
  tm125: 'flamethrower',
  tm126: 'thunderbolt',
  tm127: 'play_rough',
  tm128: 'amnesia',
  tm129: 'calm_mind',
  tm130: 'helping_hand',
  tm131: 'pollen_puff',
  tm132: 'baton_pass',
  tm133: 'earth_power',
  tm134: 'reversal',
  tm135: 'ice_beam',
  tm136: 'electric_terrain',
  tm137: 'grassy_terrain',
  tm138: 'psychic_terrain',
  tm139: 'misty_terrain',
  tm140: 'nasty_plot',
  tm141: 'fire_blast',
  tm142: 'hydro_pump',
  tm143: 'blizzard',
  tm144: 'fire_pledge',
  tm145: 'water_pledge',
  tm146: 'grass_pledge',
  tm147: 'wild_charge',
  tm148: 'sludge_bomb',
  tm149: 'earthquake',
  tm150: 'stone_edge',
  tm151: 'phantom_force',
  tm152: 'giga_impact',
  tm153: 'blast_burn',
  tm154: 'hydro_cannon',
  tm155: 'frenzy_plant',
  tm156: 'outrage',
  tm157: 'overheat',
  tm158: 'focus_blast',
  tm159: 'leaf_storm',
  tm160: 'hurricane',
  tm161: 'trick_room',
  tm162: 'bug_buzz',
  tm163: 'hyper_beam',
  tm164: 'brave_bird',
  tm165: 'flare_blitz',
  tm166: 'thunder',
  tm167: 'close_combat',
  tm168: 'solar_beam',
  tm169: 'draco_meteor',
  tm170: 'steel_beam',
  tm171: 'tera_blast',
  tm172: 'roar',
  tm173: 'charge',
  tm174: 'haze',
  tm175: 'toxic',
  tm176: 'sand_tomb',
  tm177: 'spite',
  tm178: 'gravity',
  tm179: 'smack_down',
  tm180: 'gyro_ball',
  tm181: 'knock_off',
  tm182: 'bug_bite',
  tm183: 'super_fang',
  tm184: 'vacuum_wave',
  tm185: 'lunge',
  tm186: 'high_horsepower',
  tm187: 'icicle_spear',
  tm188: 'scald',
  tm189: 'heat_crash',
  tm190: 'solar_blade',
  tm191: 'uproar',
  tm192: 'focus_punch',
  tm193: 'weather_ball',
  tm194: 'grassy_glide',
  tm195: 'burning_jealousy',
  tm196: 'flip_turn',
  tm197: 'dual_wingbeat',
  tm198: 'poltergeist',
  tm199: 'lash_out',
  tm200: 'scale_shot',
  tm201: 'misty_explosion',
  tm202: 'pain_split',
  tm203: 'psych_up',
  tm204: 'double_edge',
  tm205: 'endeavor',
  tm206: 'petal_blizzard',
  tm207: 'temper_flare',
  tm208: 'whirlpool',
  tm209: 'muddy_water',
  tm210: 'supercell_slam',
  tm211: 'electroweb',
  tm212: 'triple_axel',
  tm213: 'coaching',
  tm214: 'sludge_wave',
  tm215: 'scorching_sands',
  tm216: 'feather_dance',
  tm217: 'future_sight',
  tm218: 'expanding_force',
  tm219: 'skitter_smack',
  tm220: 'meteor_beam',
  tm221: 'throat_chop',
  tm222: 'breaking_swipe',
  tm223: 'metal_sound',
  tm224: 'curse',
  tm225: 'hard_press',
  tm226: 'dragon_cheer',
  tm227: 'alluring_voice',
  tm228: 'psychic_noise',
  tm229: 'upper_hand',
  // Hidden Machines (HM01 - HM08)
  hm01: 'cut',
  hm02: 'fly',
  hm03: 'surf',
  hm04: 'strength',
  hm05: 'waterfall',
  hm06: 'rock_smash',
  hm07: 'dive',
  hm08: 'rock_climb',
  // Legacy TM01 - TM100 aliases
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
 * (e.g., Ether, Max Ether, Leppa Berry for single move PP restoration, PP Up/PP Max, or TM/HM move teaching).
 */
export function isMoveTargetItem(idOrSlug: string): boolean {
  const def = getItemEffectDef(idOrSlug);
  if (!def) return false;
  return (
    def.restorePp?.target === 'single' || def.boostMaxPp !== undefined || Boolean(def.teachMove)
  );
}

/**
 * Checks whether an item is a Technical Machine (TM) or Hidden Machine (HM) that teaches a move.
 */
export function isTmItem(idOrSlug: string): boolean {
  const def = getItemEffectDef(idOrSlug);
  return Boolean(def?.teachMove);
}
