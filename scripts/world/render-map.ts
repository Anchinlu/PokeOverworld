/**
 * High-Performance World Map PNG Renderer (v0 Dev Tooling - Step S3)
 *
 * Exports 2D world map renders from any seed and coordinate window directly to PNG
 * using zero external heavy dependencies (Node.js built-in zlib).
 *
 * Usage:
 *   npx --prefix apps/web tsx scripts/world/render-map.ts --seed 101 --size 1024 --version 1 --out docs/maps/world_legacy_101.png
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createTerrainField } from '../../apps/web/src/maps/terrain-field';

// ---------------------------------------------------------------------------
// CLI Argument Parsing
// ---------------------------------------------------------------------------
function getArg(flag: string, fallback: string): string {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && idx + 1 < process.argv.length ? process.argv[idx + 1] : fallback;
}

const seed = parseInt(getArg('--seed', '101'), 10);
const size = parseInt(getArg('--size', '1024'), 10);
const scale = parseInt(getArg('--scale', '1'), 10);
const version = parseInt(getArg('--version', '1'), 10);
const x0 = parseInt(getArg('--x0', String(-Math.floor(size / 2))), 10);
const y0 = parseInt(getArg('--y0', String(-Math.floor(size / 2))), 10);
const outPath = getArg(
  '--out',
  path.join(process.cwd(), `docs/maps/world_v${version}_seed${seed}_${size}x${size}.png`)
);

// ---------------------------------------------------------------------------
// Pure Node.js PNG Encoder (zero dependencies, fast zlib compression)
// ---------------------------------------------------------------------------
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([len, toCrc, crcBuf]);
}

function encodeRGBAtoPNG(pixels: Uint8Array, width: number, height: number): Buffer {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA color type
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Non-interlaced

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Scanlines with filter byte 0 (None)
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  let srcOffset = 0;
  let dstOffset = 0;

  for (let y = 0; y < height; y++) {
    rawData[dstOffset++] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      rawData[dstOffset++] = pixels[srcOffset++];
      rawData[dstOffset++] = pixels[srcOffset++];
      rawData[dstOffset++] = pixels[srcOffset++];
      rawData[dstOffset++] = pixels[srcOffset++];
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 6 });
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// ---------------------------------------------------------------------------
// Render Core Execution
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n======================================================`);
  console.log(`  World Map PNG Exporter (v0 Tooling)`);
  console.log(`======================================================`);
  console.log(`Version : ${version}`);
  console.log(`Seed    : ${seed}`);
  console.log(`Bounds  : [${x0}, ${y0}] -> [${x0 + size}, ${y0 + size}] (${size}x${size} tiles)`);
  console.log(`Scale   : ${scale}x (${size * scale}x${size * scale} px output)`);
  console.log(`Output  : ${outPath}\n`);

  const startTime = Date.now();
  const field = createTerrainField(version, seed);
  const spawn = field.getSpawn();

  const outWidth = size * scale;
  const outHeight = size * scale;
  const pixels = new Uint8Array(outWidth * outHeight * 4);

  // Statistics counters
  let totalTiles = 0;
  let oceanTiles = 0;
  let sandTiles = 0;
  let hillTiles = 0;
  let roadTiles = 0;
  let desertTiles = 0;
  let darkLandTiles = 0;
  let autumnTiles = 0;
  let freshwaterTiles = 0;
  let grassTiles = 0;

  // Color Palette [R, G, B, A]
  const C_OCEAN = [29, 78, 216, 255]; // Deep Blue
  const C_SAND = [250, 204, 21, 255]; // Warm Gold
  const C_HILL = [120, 113, 108, 255]; // Stone Gray
  const C_ROAD = [180, 83, 9, 255]; // Earthy Clay Path
  const C_DESERT = [224, 166, 72, 255]; // Dryland Amber
  const C_DARK_LAND = [72, 46, 82, 255]; // Dark Land Plum
  const C_AUTUMN = [217, 119, 6, 255]; // Autumn Ochre Orange
  const C_FRESHWATER = [42, 160, 210, 255]; // River/Lake Blue
  const C_GRASS = [132, 204, 22, 255]; // Meadow Green
  const C_SPAWN = [255, 255, 255, 255]; // Pure White Marker

  for (let ty = 0; ty < size; ty++) {
    const gy = y0 + ty;
    for (let tx = 0; tx < size; tx++) {
      const gx = x0 + tx;
      totalTiles++;

      let col = C_GRASS;
      if (field.isHill(gx, gy)) {
        col = C_HILL;
        hillTiles++;
      } else if (field.isDesert?.(gx, gy)) {
        col = C_DESERT;
        desertTiles++;
      } else if (field.isDarkLand?.(gx, gy)) {
        col = C_DARK_LAND;
        darkLandTiles++;
      } else if (field.isAutumn?.(gx, gy)) {
        col = C_AUTUMN;
        autumnTiles++;
      } else if (field.isSand(gx, gy)) {
        col = C_SAND;
        sandTiles++;
      } else if (field.isOcean(gx, gy)) {
        col = C_OCEAN;
        oceanTiles++;
      } else if (field.isBridge(gx, gy) || field.isRoad(gx, gy)) {
        col = C_ROAD;
        roadTiles++;
      } else if (field.isWater(gx, gy)) {
        col = C_FRESHWATER;
        freshwaterTiles++;
      } else {
        grassTiles++;
      }

      // Check if near spawn point (draw 3x3 white crosshair)
      if (Math.abs(gx - spawn.gx) <= 1 && Math.abs(gy - spawn.gy) <= 1) {
        col = C_SPAWN;
      }

      // Fill pixels for this tile based on scale
      for (let sy = 0; sy < scale; sy++) {
        const py = ty * scale + sy;
        for (let sx = 0; sx < scale; sx++) {
          const px = tx * scale + sx;
          const idx = (py * outWidth + px) * 4;
          pixels[idx + 0] = col[0];
          pixels[idx + 1] = col[1];
          pixels[idx + 2] = col[2];
          pixels[idx + 3] = col[3];
        }
      }
    }
  }

  const pngBuf = encodeRGBAtoPNG(pixels, outWidth, outHeight);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, pngBuf);

  const durationMs = Date.now() - startTime;
  const landTiles = totalTiles - oceanTiles;
  const landPct = ((landTiles / totalTiles) * 100).toFixed(1);
  const oceanPct = ((oceanTiles / totalTiles) * 100).toFixed(1);
  const hillOfLandPct = landTiles > 0 ? ((hillTiles / landTiles) * 100).toFixed(1) : '0';
  const sandPct = ((sandTiles / totalTiles) * 100).toFixed(1);

  console.log(`Render completed in ${durationMs}ms!`);
  console.log(`------------------------------------------------------`);
  console.log(`Terrain Statistics:`);
  console.log(`  Total Tiles: ${totalTiles.toLocaleString()}`);
  console.log(`  Land Tiles : ${landTiles.toLocaleString()} (${landPct}%)`);
  console.log(`  Ocean Tiles: ${oceanTiles.toLocaleString()} (${oceanPct}%)`);
  console.log(`  Hill Tiles : ${hillTiles.toLocaleString()} (${hillOfLandPct}% of land)`);
  console.log(`  Desert Tiles: ${desertTiles.toLocaleString()}`);
  console.log(`  Dark Land  : ${darkLandTiles.toLocaleString()}`);
  console.log(`  Autumn Forest: ${autumnTiles.toLocaleString()}`);
  console.log(`  Sand Tiles : ${sandTiles.toLocaleString()} (${sandPct}%)`);
  console.log(`  Freshwater : ${freshwaterTiles.toLocaleString()}`);
  console.log(`  Road Tiles : ${roadTiles.toLocaleString()}`);
  console.log(`  Grass Tiles: ${grassTiles.toLocaleString()}`);
  console.log(`  Spawn Point: (${spawn.gx}, ${spawn.gy}) marked in white`);
  console.log(`------------------------------------------------------\n`);
}

main().catch((err) => {
  console.error('Render failed:', err);
  process.exit(1);
});
