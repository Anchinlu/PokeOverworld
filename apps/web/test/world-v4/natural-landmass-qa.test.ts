import fs from 'node:fs';
import path from 'node:path';
import { deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { createTerrainField, V4Field } from '../../src/maps/terrain-field';
import {
  V4_CONFIG,
  V4_LANDMASS_PROFILES,
  sampleV4ContinentalValue,
} from '../../src/maps/terrain-field/v4-config';
import { fbm2 } from '../../src/maps/terrain-field/noise';

const OUTPUT_SIZE = 512;
const WORLD_SIZE = 2048;
const SAMPLE_STEP = WORLD_SIZE / OUTPUT_SIZE;
const OUTPUT_PATH = path.resolve(
  process.cwd(),
  '../../docs/maps/qa-v5/world_v5_natural_seed777_2048.png'
);

const COLORS = {
  ocean: [30, 86, 170, 255],
  sand: [235, 202, 121, 255],
  grass: [106, 174, 83, 255],
  hill: [105, 112, 105, 255],
  desert: [213, 161, 75, 255],
  darkLand: [67, 48, 84, 255],
  autumn: [196, 132, 55, 255],
  freshwater: [52, 151, 194, 255],
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

function isNaturalPreviewLand(field: V4Field, gx: number, gy: number): boolean {
  const macroX = Math.floor(gx / V4_CONFIG.CELL_SIZE);
  const macroY = Math.floor(gy / V4_CONFIG.CELL_SIZE);
  if (!field.macroPlan.isNearNaturalLandCell(macroX, macroY)) return false;

  const source = field.macroPlan.getSourceCoordinates(gx, gy);
  const profile = V4_LANDMASS_PROFILES['natural-landmass'];
  const coastWarp =
    (fbm2(
      gx / profile.coastEdgeScale,
      gy / profile.coastEdgeScale,
      field.seed,
      V4_CONFIG.MACRO_SALT + 19,
      3
    ) -
      0.5) *
    profile.coastEdgeWeight;
  return sampleV4ContinentalValue(source.gx, source.gy, field.seed) >= profile.seaLevel + coastWarp;
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

  it('exports a medium macro preview map for visual inspection', () => {
    const field = createTerrainField(5, 777) as V4Field;
    const rgba = new Uint8Array(OUTPUT_SIZE * OUTPUT_SIZE * 4);
    const x0 = -WORLD_SIZE / 2;
    const y0 = -WORLD_SIZE / 2;

    for (let py = 0; py < OUTPUT_SIZE; py++) {
      for (let px = 0; px < OUTPUT_SIZE; px++) {
        const gx = x0 + px * SAMPLE_STEP + SAMPLE_STEP / 2;
        const gy = y0 + py * SAMPLE_STEP + SAMPLE_STEP / 2;
        const land = isNaturalPreviewLand(field, gx, gy);
        const nearCoast =
          land &&
          [
            [gx - SAMPLE_STEP, gy],
            [gx + SAMPLE_STEP, gy],
            [gx, gy - SAMPLE_STEP],
            [gx, gy + SAMPLE_STEP],
          ].some(([sampleGX, sampleGY]) => !isNaturalPreviewLand(field, sampleGX, sampleGY));
        const color = nearCoast ? COLORS.sand : land ? COLORS.grass : COLORS.ocean;
        const offset = (py * OUTPUT_SIZE + px) * 4;
        rgba.set(color, offset);
      }
    }

    const png = encodePng(rgba, OUTPUT_SIZE, OUTPUT_SIZE);

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, png);
    expect(fs.statSync(OUTPUT_PATH).size).toBeGreaterThan(1024);
  }, 120000);
});
