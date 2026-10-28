import type { PokemonSpeciesData } from '@pokemon/shared-types';
import encountersRaw from '@pokemon/game-data/encounters.json';
import pokemonDbRaw from '@pokemon/game-data/pokemon-db.json';
import regionalFormsRaw from '@pokemon/game-data/regional-forms.json';

export interface EncounterDefinition {
  speciesKey: string;
  rate: number;
  behavior: string;
  minLevel: number;
  maxLevel: number;
}

interface EncounterRegion {
  name: string;
  roster: EncounterDefinition[];
}

const database = Object.values(pokemonDbRaw.pokemon) as PokemonSpeciesData[];
const byId = new Map(database.map((pokemon) => [pokemon.id, pokemon]));
const bySpeciesKey = new Map(database.map((pokemon) => [pokemon.speciesKey, pokemon]));

const regionalFormsList = Object.values(
  (regionalFormsRaw as any).forms || {}
) as PokemonSpeciesData[];
for (const form of regionalFormsList) {
  const formKey = (form as any).formKey?.toUpperCase();
  const assetKey = (form as any).assetKey?.toUpperCase();
  if (formKey) bySpeciesKey.set(formKey, form);
  if (assetKey) bySpeciesKey.set(assetKey, form);
  if (form.id) byId.set(form.id, form);
}

const regions = encountersRaw.regions as Record<string, EncounterRegion>;

function normalizeSpeciesKey(speciesKey: string): string {
  return speciesKey.replace(/^wild_/i, '');
}

export class PokemonCatalog {
  public getAll(): readonly PokemonSpeciesData[] {
    return database;
  }

  public getById(id: number): PokemonSpeciesData | undefined {
    return byId.get(id);
  }

  public getBySpeciesKey(speciesKey: string): PokemonSpeciesData | undefined {
    const norm = normalizeSpeciesKey(speciesKey);
    return bySpeciesKey.get(norm) ?? bySpeciesKey.get(norm.toUpperCase());
  }

  public search(query: string): PokemonSpeciesData[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [...database];

    return database.filter((pokemon) => {
      const paddedId = String(pokemon.id).padStart(3, '0');
      return (
        String(pokemon.id) === normalized ||
        paddedId.includes(normalized) ||
        pokemon.name.toLowerCase().includes(normalized) ||
        pokemon.speciesKey.toLowerCase().includes(normalized) ||
        pokemon.types.some((type) => type.toLowerCase().includes(normalized))
      );
    });
  }

  public getEncounterRoster(regionId: string): readonly EncounterDefinition[] {
    return regions[regionId]?.roster ?? [];
  }

  public getRegionalForms(): readonly PokemonSpeciesData[] {
    return regionalFormsList;
  }

  public getRegionalFormsForSpecies(speciesKey: string): PokemonSpeciesData[] {
    const norm = speciesKey.toUpperCase();
    return regionalFormsList.filter((f) => (f as any).baseSpeciesKey?.toUpperCase() === norm);
  }
}

export const pokemonCatalog = new PokemonCatalog();
