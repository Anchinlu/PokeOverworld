/**
 * Regional Forms Registry & Resolution Engine
 * Handles canonical variants for Alola, Galar, Hisui, and Paldea forms.
 * Maps asset suffixes (_1, _2, _3) to standardized form definitions.
 */

import type {
  PokemonType,
  PokemonStats,
  PokemonSprites,
  PokemonAbilities,
  PokemonLearnMove,
} from '@pokemon/shared-types';
import regionalFormsRaw from '@pokemon/game-data/regional-forms.json';

export type RegionKey = 'alola' | 'galar' | 'hisui' | 'paldea';

export interface RegionalFormSpeciesData {
  id: number;
  name: string;
  formKey: string;
  formId: string;
  baseSpeciesKey: string;
  region: RegionKey;
  suffix: string;
  assetKey: string;
  types: PokemonType[];
  stats: PokemonStats;
  sprites: PokemonSprites;
  species?: string;
  height?: number;
  weight?: number;
  ability?: string;
  abilities?: PokemonAbilities;
  teraType?: PokemonType;
  moves?: PokemonLearnMove[];
  tmMoves?: string[];
}

const rawForms = (regionalFormsRaw.forms || {}) as Record<string, RegionalFormSpeciesData>;
const formList = Object.values(rawForms);

const byFormKey = new Map<string, RegionalFormSpeciesData>();
const byAssetKey = new Map<string, RegionalFormSpeciesData>();
const bySpeciesKey = new Map<string, RegionalFormSpeciesData[]>();

for (const form of formList) {
  const normFormKey = form.formKey.toUpperCase();
  const normAssetKey = form.assetKey.toUpperCase();
  const normBase = form.baseSpeciesKey.toUpperCase();

  byFormKey.set(normFormKey, form);
  byAssetKey.set(normAssetKey, form);

  if (!bySpeciesKey.has(normBase)) {
    bySpeciesKey.set(normBase, []);
  }
  bySpeciesKey.get(normBase)!.push(form);
}

export class RegionalFormsRegistry {
  /**
   * Retrieves all 37 registered regional forms.
   */
  public getAll(): readonly RegionalFormSpeciesData[] {
    return formList;
  }

  /**
   * Retrieves a regional form by its unique formKey (e.g. 'RAICHU_ALOLAN', 'MEOWTH_GALARIAN').
   */
  public getByFormKey(formKey: string): RegionalFormSpeciesData | undefined {
    return byFormKey.get(formKey.toUpperCase());
  }

  /**
   * Retrieves a regional form by its assetKey (e.g. 'RAICHU_1', 'MEOWTH_2').
   */
  public getByAssetKey(assetKey: string): RegionalFormSpeciesData | undefined {
    return byAssetKey.get(assetKey.toUpperCase());
  }

  /**
   * Retrieves all regional forms available for a given base species (e.g. 'MEOWTH' -> [Alolan, Galarian]).
   */
  public getFormsForSpecies(speciesKey: string): readonly RegionalFormSpeciesData[] {
    return bySpeciesKey.get(speciesKey.toUpperCase()) ?? [];
  }

  /**
   * Resolves a form by either formKey, assetKey, or suffix (e.g. ('MEOWTH', '2') or ('MEOWTH', 'alolan') or ('RATTATA_ALOLAN')).
   */
  public resolveForm(
    speciesKey: string,
    formOrSuffix?: string | null
  ): RegionalFormSpeciesData | undefined {
    const normSpecies = speciesKey.replace(/^wild_/i, '').toUpperCase().trim();
    if (!formOrSuffix) {
      return byFormKey.get(normSpecies) ?? byAssetKey.get(normSpecies);
    }
    const clean = formOrSuffix.toUpperCase().trim();

    // 1. Exact formKey match (e.g. 'MEOWTH_GALARIAN')
    if (byFormKey.has(clean)) {
      return byFormKey.get(clean);
    }

    // 2. Exact assetKey match (e.g. 'MEOWTH_2')
    if (byAssetKey.has(clean)) {
      return byAssetKey.get(clean);
    }

    // 3. Combined species_suffix match (e.g. speciesKey='MEOWTH', formOrSuffix='2' -> 'MEOWTH_2')
    const combined = `${normSpecies}_${clean}`;
    if (byAssetKey.has(combined)) {
      return byAssetKey.get(combined);
    }

    // 4. Combined species_region match (e.g. speciesKey='MEOWTH', formOrSuffix='GALARIAN' -> 'MEOWTH_GALARIAN')
    const combinedKey = `${normSpecies}_${clean}`;
    if (byFormKey.has(combinedKey)) {
      return byFormKey.get(combinedKey);
    }

    // 5. Check against regional forms of this species by formId or region
    const candidates = this.getFormsForSpecies(normSpecies);
    return candidates.find(
      (c) =>
        c.formId.toUpperCase() === clean ||
        c.region.toUpperCase() === clean ||
        c.suffix === clean
    );
  }

  /**
   * Resolves overworld follower sprite for a species and optional form.
   */
  public resolveFollowerSprite(
    speciesKey: string,
    formOrSuffix?: string | null,
    isShiny = false,
    isSwimming = false
  ): string {
    const form = this.resolveForm(speciesKey, formOrSuffix);
    if (form) {
      if (isSwimming) {
        return (
          (isShiny ? form.sprites.swimmingShiny : form.sprites.swimming) ||
          (isShiny
            ? `Graphics/Characters/Followers shiny/${form.assetKey}.png`
            : form.sprites.follower)
        );
      }
      return isShiny
        ? `Graphics/Characters/Followers shiny/${form.assetKey}.png`
        : form.sprites.follower;
    }

    const normKey = speciesKey.replace(/^wild_/i, '').toUpperCase();
    if (isSwimming) {
      const swimPath = `Graphics/Characters/Swimming Overworld Sprites/Swimming/${normKey}.png`;
      const swimShinyPath = `Graphics/Characters/Swimming Overworld Sprites/Swimming Shiny/${normKey}.png`;
      return isShiny ? swimShinyPath : swimPath;
    }
    return isShiny
      ? `Graphics/Characters/Followers shiny/${normKey}.png`
      : `Graphics/Characters/Followers/${normKey}.png`;
  }

  /**
   * Resolves battle sprite (front or back, regular or shiny).
   */
  public resolveBattleSprite(
    speciesKey: string,
    formOrSuffix?: string | null,
    isBack = false,
    isShiny = false
  ): string {
    const form = this.resolveForm(speciesKey, formOrSuffix);
    if (form) {
      if (isBack) {
        return (isShiny ? form.sprites.backShiny : form.sprites.back) || form.sprites.back;
      }
      return (isShiny ? form.sprites.frontShiny : form.sprites.front) || form.sprites.front;
    }

    const normKey = speciesKey.toUpperCase();
    if (isBack) {
      return isShiny
        ? `Graphics/Pokemon/Back shiny/${normKey}.png`
        : `Graphics/Pokemon/Back/${normKey}.png`;
    }
    return isShiny
      ? `Graphics/Pokemon/Front shiny/${normKey}.png`
      : `Graphics/Pokemon/Front/${normKey}.png`;
  }

  /**
   * Resolves menu / UI icon sprite (regular or shiny).
   */
  public resolveIconSprite(
    speciesKey: string,
    formOrSuffix?: string | null,
    isShiny = false
  ): string {
    const form = this.resolveForm(speciesKey, formOrSuffix);
    if (form) {
      return (isShiny ? form.sprites.iconShiny : form.sprites.icon) || form.sprites.icon;
    }

    const normKey = speciesKey.toUpperCase();
    return isShiny
      ? `Graphics/Pokemon/Icons shiny/${normKey}.png`
      : `Graphics/Pokemon/Icons/${normKey}.png`;
  }

  /**
   * Resolves audio cry file (with canonical fallback to base species).
   */
  public resolveCry(speciesKey: string, formOrSuffix?: string | null): string {
    const form = this.resolveForm(speciesKey, formOrSuffix);
    if (form && form.sprites.cry) {
      return form.sprites.cry;
    }
    return `Audio/Cries/${speciesKey.toUpperCase()}.ogg`;
  }

  /**
   * Resolves footprint sprite (with canonical fallback to base species).
   */
  public resolveFootprint(speciesKey: string, formOrSuffix?: string | null): string {
    const form = this.resolveForm(speciesKey, formOrSuffix);
    if (form && form.sprites.footprint) {
      return form.sprites.footprint;
    }
    return `Graphics/Pokemon/Footprints/${speciesKey.toUpperCase()}.png`;
  }
}

export const regionalFormsRegistry = new RegionalFormsRegistry();
