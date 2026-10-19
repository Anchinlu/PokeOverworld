import type { PartyPokemon } from '../party/party-state';
import type { PcBox } from '../pc/pc-storage-service';

interface LevelRecord {
  level: number;
}

/**
 * Returns the highest level in the player's complete owned roster.
 * The roster includes both the active Party and every occupied PC slot.
 */
export function getHighestOwnedPokemonLevel(
  party: ReadonlyArray<Pick<PartyPokemon, 'level'>>,
  boxes: ReadonlyArray<Pick<PcBox, 'slots'>>
): number {
  let highestLevel = 1;

  for (const pokemon of party) {
    highestLevel = Math.max(highestLevel, normalizeLevel(pokemon));
  }

  for (const box of boxes) {
    for (const pokemon of box.slots) {
      if (pokemon) highestLevel = Math.max(highestLevel, normalizeLevel(pokemon));
    }
  }

  return highestLevel;
}

function normalizeLevel(record: LevelRecord): number {
  return Math.max(1, Math.min(100, Math.floor(record.level)));
}
