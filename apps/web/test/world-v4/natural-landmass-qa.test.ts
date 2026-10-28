import fs from 'node:fs';
import path from 'node:path';
import { deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { createTerrainField, V4Field } from '../../src/maps/terrain-field';
import { sampleClimate } from '../../src/maps/climate';

const OUTPUT_SIZE = 512;
const WORLD_SIZE = 2048;
const SAMPLE_STEP = WORLD_SIZE / OUTPUT_SIZE;
const QA_SEEDS = [13579, 24680] as const;
const REPO_ROOT = (() => {
  let directory = process.cwd();
  while (directory !== path.dirname(directory)) {
    if (
      fs.existsSync(path.join(directory, 'apps')) &&
      fs.existsSync(path.join(directory, 'packages'))
    ) {
      return directory;
    }
    directory = path.dirname(directory);
  }
  return process.cwd();
})();
function getOutputPaths(seed: number): { biome: string; temperature: string } {
  return {
    biome: path.resolve(
      REPO_ROOT,
      `docs/maps/qa-v5/world_v5_natural_seed${seed}_2048_biomes.png`
    ),
    temperature: path.resolve(
      REPO_ROOT,
      `docs/maps/qa-v5/world_v5_natural_seed${seed}_2048_temperature.png`
    ),
  };
}

const COLORS = {
  ocean: [30, 86, 170, 255],
  sand: [235, 202, 121, 255],
  grass: [106, 174, 83, 255],
  hill: [105, 112, 105, 255],
  desert: [213, 161, 75, 255],
  darkLand: [67, 48, 84, 255],
  autumn: [196, 132, 55, 255],
  freshwater: [52, 151, 194, 255],
  snow: [218, 239, 249, 255],
  road: [139, 91, 53, 255],
} as const;

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBytes, Buffer.from(data)]);
  const result = Buffer.alloc(12 + data.length);
  result.writeUInt32BE(data.length, 0);
  body.copy(result, 4);
  result.writeUInt32BE(crc32(body), 8 + data.length);
  return result;
}

function encodePng(rgba: Uint8Array, width: number, height: number): Buffer {
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  let sourceOffset = 0;
  let destinationOffset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[destinationOffset++] = 0;
    const rowLength = width * 4;
    scanlines.set(rgba.subarray(sourceOffset, sourceOffset + rowLength), destinationOffset);
    sourceOffset += rowLength;
    destinationOffset += rowLength;
  }

  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  return Buffer.concat([
    header,
    Buffer.from(pngChunk('IHDR', ihdr)),
    Buffer.from(pngChunk('IDAT', new Uint8Array(deflateSync(scanlines)))),
    Buffer.from(pngChunk('IEND', new Uint8Array())),
  ]);
}

function getBiomeColor(field: V4Field, gx: number, gy: number): readonly number[] {
  if (field.isOcean(gx, gy)) return COLORS.ocean;
  if (field.isWater(gx, gy)) return COLORS.freshwater;
  if (field.isSand(gx, gy)) return COLORS.sand;
  if (field.isRoad(gx, gy)) return COLORS.road;
  if (field.isSnow(gx, gy)) return COLORS.snow;
  if (field.isDesert(gx, gy)) return COLORS.desert;
  if (field.isDarkLand(gx, gy)) return COLORS.darkLand;
  if (field.isAutumn(gx, gy)) return COLORS.autumn;
  if (field.isHill(gx, gy)) return COLORS.hill;
  return COLORS.grass;
}

function getTemperatureColor(temperature: number): readonly number[] {
  const stops = [
    [0, [45, 78, 170]],
    [0.25, [70, 166, 218]],
    [0.5, [102, 190, 104]],
    [0.75, [242, 195, 67]],
    [1, [202, 57, 52]],
  ] as const;
  const value = Math.max(0, Math.min(1, temperature));
  for (let index = 1; index < stops.length; index++) {
    const [upperStop, upperColor] = stops[index];
    if (value > upperStop) continue;
    const [lowerStop, lowerColor] = stops[index - 1];
    const ratio = (value - lowerStop) / (upperStop - lowerStop);
    return [
      Math.round(lowerColor[0] + (upperColor[0] - lowerColor[0]) * ratio),
      Math.round(lowerColor[1] + (upperColor[1] - lowerColor[1]) * ratio),
      Math.round(lowerColor[2] + (upperColor[2] - lowerColor[2]) * ratio),
      255,
    ];
  }
  return [...stops[stops.length - 1][1], 255];
}

describe('World Gen v5 natural-landmass QA', () => {
  it('keeps macro landmass output valid across deterministic seed samples', () => {
    for (let seed = 1000; seed < 1025; seed++) {
      const field = createTerrainField(5, seed);
      let landCells = 0;
      let waterCells = 0;
      for (let my = -24; my <= 24; my++) {
        for (let mx = -32; mx <= 32; mx++) {
          if ((field as V4Field).macroPlan.isNaturalLandCell(mx, my)) landCells++;
          else waterCells++;
        }
      }
      expect(landCells, `seed ${seed} has no natural land`).toBeGreaterThan(0);
      expect(waterCells, `seed ${seed} has no surrounding water`).toBeGreaterThan(0);
    }
  }, 120000);

  it('exports medium biome and temperature maps for visual inspection', () => {
    for (const seed of QA_SEEDS) {
      const field = createTerrainField(5, seed) as V4Field;
      const biomeRgba = new Uint8Array(OUTPUT_SIZE * OUTPUT_SIZE * 4);
      const temperatureRgba = new Uint8Array(OUTPUT_SIZE * OUTPUT_SIZE * 4);
      const x0 = -WORLD_SIZE / 2;
      const y0 = -WORLD_SIZE / 2;

      for (let py = 0; py < OUTPUT_SIZE; py++) {
        for (let px = 0; px < OUTPUT_SIZE; px++) {
          const gx = x0 + px * SAMPLE_STEP + SAMPLE_STEP / 2;
          const gy = y0 + py * SAMPLE_STEP + SAMPLE_STEP / 2;
          const tileGX = Math.floor(gx);
          const tileGY = Math.floor(gy);
          const offset = (py * OUTPUT_SIZE + px) * 4;
          biomeRgba.set(getBiomeColor(field, tileGX, tileGY), offset);

          const source = field.macroPlan.getSourceCoordinates(tileGX, tileGY);
          const temperature = sampleClimate(source.gx, source.gy, field.seed, {
            anchors: field.macroPlan.climateAnchors,
          }).temperature;
          temperatureRgba.set(getTemperatureColor(temperature), offset);
        }
      }

      const biomePng = encodePng(biomeRgba, OUTPUT_SIZE, OUTPUT_SIZE);
      const temperaturePng = encodePng(temperatureRgba, OUTPUT_SIZE, OUTPUT_SIZE);
      const outputPaths = getOutputPaths(seed);

      fs.mkdirSync(path.dirname(outputPaths.biome), { recursive: true });
      fs.writeFileSync(outputPaths.biome, biomePng);
      fs.writeFileSync(outputPaths.temperature, temperaturePng);
      expect(fs.statSync(outputPaths.biome).size).toBeGreaterThan(1024);
      expect(fs.statSync(outputPaths.temperature).size).toBeGreaterThan(1024);
    }
  }, 600000);
});
