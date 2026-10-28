import { describe, it, expect } from 'vitest';
import { regionalFormsRegistry } from '../src/domain/pokemon/regional-forms';

describe('Regional Forms Registry (37 Canonical Forms)', () => {
  it('registers all 37 regional forms', () => {
    const all = regionalFormsRegistry.getAll();
    expect(all.length).toBe(37);
  });

  it('correctly maps by formKey and assetKey', () => {
    const alolanRaichu = regionalFormsRegistry.getByFormKey('RAICHU_ALOLAN');
    expect(alolanRaichu).toBeDefined();
    expect(alolanRaichu?.assetKey).toBe('RAICHU_1');
    expect(alolanRaichu?.types).toEqual(['Electric', 'Psychic']);
    expect(alolanRaichu?.region).toBe('alola');

    const byAsset = regionalFormsRegistry.getByAssetKey('RAICHU_1');
    expect(byAsset).toBe(alolanRaichu);
  });

  it('correctly separates multiple regional forms of the same species (Meowth)', () => {
    const meowthForms = regionalFormsRegistry.getFormsForSpecies('MEOWTH');
    expect(meowthForms.length).toBe(2);

    const alolan = meowthForms.find((f) => f.region === 'alola');
    const galarian = meowthForms.find((f) => f.region === 'galar');

    expect(alolan?.assetKey).toBe('MEOWTH_1');
    expect(alolan?.types).toEqual(['Dark']);

    expect(galarian?.assetKey).toBe('MEOWTH_2');
    expect(galarian?.types).toEqual(['Steel']);
  });

  it('resolves Paldean Tauros 3 distinct breeds', () => {
    const combat = regionalFormsRegistry.getByFormKey('TAUROS_PALDEAN_COMBAT');
    const blaze = regionalFormsRegistry.getByFormKey('TAUROS_PALDEAN_BLAZE');
    const aqua = regionalFormsRegistry.getByFormKey('TAUROS_PALDEAN_AQUA');

    expect(combat?.suffix).toBe('1');
    expect(combat?.types).toEqual(['Fighting']);

    expect(blaze?.suffix).toBe('2');
    expect(blaze?.types).toEqual(['Fighting', 'Fire']);

    expect(aqua?.suffix).toBe('3');
    expect(aqua?.types).toEqual(['Fighting', 'Water']);
  });

  it('resolves Levitates vs Swimming locomotion categories correctly', () => {
    // Alolan Diglett & Galarian Weezing levitate
    const diglettSprite = regionalFormsRegistry.resolveFollowerSprite(
      'DIGLETT',
      'ALOLAN',
      false,
      true
    );
    expect(diglettSprite).toContain('Levitates');

    const weezingSprite = regionalFormsRegistry.resolveFollowerSprite(
      'WEEZING',
      'GALARIAN',
      false,
      true
    );
    expect(weezingSprite).toContain('Levitates');

    // Alolan Raichu swims (surfing on tail)
    const raichuSprite = regionalFormsRegistry.resolveFollowerSprite(
      'RAICHU',
      'ALOLAN',
      false,
      true
    );
    expect(raichuSprite).toContain('Swimming');
  });

  it('resolves dedicated audio cry when available and falls back to base cry otherwise', () => {
    // Galarian Slowbro has dedicated SLOWBRO_1.ogg
    const slowbroCry = regionalFormsRegistry.resolveCry('SLOWBRO', 'GALARIAN');
    expect(slowbroCry).toBe('Audio/Cries/SLOWBRO_1.ogg');

    // Alolan Vulpix falls back to VULPIX.ogg
    const vulpixCry = regionalFormsRegistry.resolveCry('VULPIX', 'ALOLAN');
    expect(vulpixCry).toBe('Audio/Cries/VULPIX.ogg');
  });

  it('resolves dedicated footprint when available and falls back to base footprint otherwise', () => {
    // Galarian Zapdos has dedicated ZAPDOS_1.png footprint
    const zapdosFp = regionalFormsRegistry.resolveFootprint('ZAPDOS', 'GALARIAN');
    expect(zapdosFp).toBe('Graphics/Pokemon/Footprints/ZAPDOS_1.png');

    // Alolan Rattata falls back to RATTATA.png footprint
    const rattataFp = regionalFormsRegistry.resolveFootprint('RATTATA', 'ALOLAN');
    expect(rattataFp).toBe('Graphics/Pokemon/Footprints/RATTATA.png');
  });
});
