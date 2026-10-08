import { describe, it, expect, vi } from 'vitest';
import {
  RADAR_AXES,
  drawPokemonRadarChart,
  type RadarChartMode,
} from '../src/ui/pokemon-radar-chart';
import { createPartyPokemon } from '../src/domain/party/party-state';
import { NATURES_TABLE } from '@pokemon/shared-types';

describe('Pokemon Stat Radar / Spider Web Chart (UI)', () => {
  it('defines 6 authentic radar axes in standard hexagonal order', () => {
    expect(RADAR_AXES).toHaveLength(6);
    expect(RADAR_AXES.map((a) => a.key)).toEqual([
      'hp',
      'attack',
      'defense',
      'speed',
      'spDef',
      'spAtk',
    ]);
  });

  it('correctly maps Nature data and +/-10% stat modifiers', () => {
    // Adamant (+Atk, -SpA)
    const adamant = NATURES_TABLE.Adamant;
    expect(adamant.increasedStat).toBe('attack');
    expect(adamant.decreasedStat).toBe('spAtk');
    expect(adamant.nameVi).toBe('Cương quyết');

    // Modest (+SpA, -Atk)
    const modest = NATURES_TABLE.Modest;
    expect(modest.increasedStat).toBe('spAtk');
    expect(modest.decreasedStat).toBe('attack');
    expect(modest.nameVi).toBe('Khiêm tốn');

    // Jolly (+Speed, -SpA)
    const jolly = NATURES_TABLE.Jolly;
    expect(jolly.increasedStat).toBe('speed');
    expect(jolly.decreasedStat).toBe('spAtk');

    // Hardy (Neutral)
    const hardy = NATURES_TABLE.Hardy;
    expect(hardy.increasedStat).toBeNull();
    expect(hardy.decreasedStat).toBeNull();
  });

  it('draws spider web radar chart across all modes without error', () => {
    const pokemon = createPartyPokemon('CHARIZARD', 50, {
      nature: 'Adamant',
      ivs: 'perfect',
      evs: { attack: 252, speed: 252 },
    });

    const mockCtx = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      fillText: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textBaseline: 'alphabetic',
      textAlign: 'start',
      shadowColor: '',
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowBlur: 0,
    };

    const canvas = {
      width: 280,
      height: 120,
      getContext: vi.fn(() => mockCtx as unknown as CanvasRenderingContext2D),
    } as unknown as HTMLCanvasElement;

    const modes: RadarChartMode[] = ['stats', 'ivs', 'evs'];
    for (const mode of modes) {
      drawPokemonRadarChart(canvas, pokemon, { mode });
      expect(mockCtx.clearRect).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
      expect(mockCtx.fill).toHaveBeenCalled();
    }
  });

  it('supports hiding labels in radar chart options', () => {
    const pokemon = createPartyPokemon('PIKACHU', 25);
    const mockCtx = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      arc: vi.fn(),
      fillText: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textBaseline: 'alphabetic',
      textAlign: 'start',
      shadowColor: '',
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowBlur: 0,
    };

    const canvas = {
      width: 280,
      height: 120,
      getContext: vi.fn(() => mockCtx as unknown as CanvasRenderingContext2D),
    } as unknown as HTMLCanvasElement;

    drawPokemonRadarChart(canvas, pokemon, { showLabels: false });
    expect(mockCtx.fillText).not.toHaveBeenCalled();
  });
});
