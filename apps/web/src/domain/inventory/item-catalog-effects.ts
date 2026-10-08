/**
 * Declarative Data-Driven Item Effects Catalog
 * Single Source of Truth for item properties, target scopes, and effects.
 * Eliminates duplicate if-else chains and standardizes Gen 7 items.
 */

import type { StatusCondition, StatStages } from '../../battle/types';
import type { StatKey } from '@pokemon/shared-types';

export type ItemTargetScope = 'party' | 'battler' | 'both';

export interface ItemEffectDef {
  targetScope: ItemTargetScope;
  healHp?: number;
  healRatio?: number;
  cureStatus?: StatusCondition[] | 'all';
  reviveRatio?: number;
  reviveAllParty?: boolean;
  addEv?: { stat: StatKey; amount: number };
  statStageBuff?: { stat: keyof StatStages; stages: number };
  critStageBuff?: number;
  restorePp?: { amount: number | 'max'; target: 'single' | 'all' };
  levelUp?: number;
}

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

  // --- Berries (HP & Pinch) ---
  'oran-berry': { targetScope: 'both', healHp: 10 },
  'sitrus-berry': { targetScope: 'both', healRatio: 0.25 },
  'figy-berry': { targetScope: 'both', healRatio: 0.33 },
  'wiki-berry': { targetScope: 'both', healRatio: 0.33 },
  'mago-berry': { targetScope: 'both', healRatio: 0.33 },
  'aguav-berry': { targetScope: 'both', healRatio: 0.33 },
  'iapapa-berry': { targetScope: 'both', healRatio: 0.33 },

  // --- Revives ---
  revive: { targetScope: 'party', reviveRatio: 0.5 },
  'max-revive': { targetScope: 'party', reviveRatio: 1.0 },
  'revival-herb': { targetScope: 'party', reviveRatio: 1.0 },
  'sacred-ash': { targetScope: 'party', reviveRatio: 1.0, reviveAllParty: true },

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

  // --- Rare Candy ---
  'rare-candy': { targetScope: 'party', levelUp: 1 },
  rarecandy: { targetScope: 'party', levelUp: 1 },

  // --- Stat Boost Vitamins (+10 EV) ---
  'hp-up': { targetScope: 'party', addEv: { stat: 'hp', amount: 10 } },
  protein: { targetScope: 'party', addEv: { stat: 'attack', amount: 10 } },
  iron: { targetScope: 'party', addEv: { stat: 'defense', amount: 10 } },
  calcium: { targetScope: 'party', addEv: { stat: 'spAtk', amount: 10 } },
  zinc: { targetScope: 'party', addEv: { stat: 'spDef', amount: 10 } },
  carbos: { targetScope: 'party', addEv: { stat: 'speed', amount: 10 } },

  // --- PP Restorers ---
  ether: { targetScope: 'party', restorePp: { amount: 10, target: 'single' } },
  'max-ether': { targetScope: 'party', restorePp: { amount: 'max', target: 'single' } },
  elixir: { targetScope: 'party', restorePp: { amount: 10, target: 'all' } },
  'max-elixir': { targetScope: 'party', restorePp: { amount: 'max', target: 'all' } },
  'leppa-berry': { targetScope: 'party', restorePp: { amount: 10, target: 'all' } },

  // --- Battle Stat Boosters ---
  'x-attack': { targetScope: 'battler', statStageBuff: { stat: 'attack', stages: 2 } },
  'x-defense': { targetScope: 'battler', statStageBuff: { stat: 'defense', stages: 2 } },
  'x-speed': { targetScope: 'battler', statStageBuff: { stat: 'speed', stages: 2 } },
  'x-sp-atk': { targetScope: 'battler', statStageBuff: { stat: 'spAtk', stages: 2 } },
  'x-sp-def': { targetScope: 'battler', statStageBuff: { stat: 'spDef', stages: 2 } },
  'x-accuracy': { targetScope: 'battler', statStageBuff: { stat: 'accuracy', stages: 2 } },
  'dire-hit': { targetScope: 'battler', critStageBuff: 2 },
  'guard-specs': { targetScope: 'battler' },
};

/**
 * Retrieves the effect definition for an item by slug/id.
 */
export function getItemEffectDef(idOrSlug: string): ItemEffectDef | undefined {
  if (!idOrSlug) return undefined;
  const key = idOrSlug.toLowerCase().replace(/_/g, '-');
  return ITEM_EFFECTS_REGISTRY[key];
}
