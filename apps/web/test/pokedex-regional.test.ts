import { describe, it, expect } from 'vitest';
import { getPokedexEntries, getPokemonById } from '../src/ui/pokedex/pokedex-data';
import { filterPokemon } from '../src/ui/pokedex/pokedex-filter';
import { formatPokedexNumber } from '../src/ui/pokedex/pokedex-view';

describe('Pokédex System with Regional Forms', () => {
  it('includes all 175 standard + 37 regional forms (total 212 entries)', () => {
    const entries = getPokedexEntries();
    expect(entries.length).toBe(212);
  });

  it('contains Alolan Vulpix (Ice-type) positioned immediately after standard Vulpix', () => {
    const entries = getPokedexEntries();
    const vulpixIdx = entries.findIndex((p) => p.speciesKey === 'VULPIX');
    expect(vulpixIdx).toBeGreaterThanOrEqual(0);

    const alolanVulpix = entries[vulpixIdx + 1];
    expect(alolanVulpix).toBeDefined();
    expect(alolanVulpix.name).toBe('Alolan Vulpix');
    expect(alolanVulpix.types).toEqual(['Ice']);
    expect(alolanVulpix.sprites.front).toContain('VULPIX_1.png');
    expect(alolanVulpix.sprites.follower).toContain('VULPIX_1.png');
    expect(alolanVulpix.ability).toContain('Snow Cloak');
  });

  it('formats Pokédex numbers cleanly with regional tags (e.g. No. 037-A)', () => {
    const entries = getPokedexEntries();
    const vulpix = entries.find((p) => p.speciesKey === 'VULPIX')!;
    const alolanVulpix = entries.find((p) => (p as any).formKey === 'VULPIX_ALOLAN')!;

    expect(formatPokedexNumber(vulpix)).toBe('037');
    expect(formatPokedexNumber(alolanVulpix)).toBe('037-A');
  });

  it('filters by name "vulpix" and returns both Fire and Ice variants', () => {
    const entries = getPokedexEntries();
    const results = filterPokemon(entries, 'vulpix');
    expect(results.length).toBe(2);

    const names = results.map((r) => r.name);
    expect(names).toContain('Vulpix');
    expect(names).toContain('Alolan Vulpix');
  });

  it('filters by region "alola" and returns all 18 Alolan forms', () => {
    const entries = getPokedexEntries();
    const alolanResults = filterPokemon(entries, 'alola');
    expect(alolanResults.length).toBe(18);

    const hasIceVulpix = alolanResults.some((p) => p.name === 'Alolan Vulpix');
    expect(hasIceVulpix).toBe(true);
  });

  it('allows retrieval of Alolan Vulpix by its unique ID', () => {
    const alolanVulpix = getPokemonById(10103);
    expect(alolanVulpix).toBeDefined();
    expect(alolanVulpix?.name).toBe('Alolan Vulpix');
    expect(alolanVulpix?.types).toEqual(['Ice']);
  });
});
