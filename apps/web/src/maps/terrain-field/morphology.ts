/**
 * Binary Grid Morphology Engine (v0 World Architecture)
 *
 * Implements deterministic local neighborhood transformations (dilation, erosion,
 * opening, and closing) on 2D Uint8Array binary masks without global flood-fill.
 * STRICT INVARIANT I2: Chunk-order independent local operator with bounded dependency.
 * STRICT INVARIANT I6: Valid autotile geometry (eliminates thin ridges and 1-tile holes).
 */

/**
 * Dilates a 2D binary grid by Chebyshev radius r.
 * Output cell is 1 if ANY cell within [x - r .. x + r, y - r .. y + r] is 1.
 */
export function dilate(
  src: Uint8Array,
  width: number,
  height: number,
  radius = 1
): Uint8Array {
  const dst = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    const minY = Math.max(0, y - radius);
    const maxY = Math.min(height - 1, y + radius);

    for (let x = 0; x < width; x++) {
      const minX = Math.max(0, x - radius);
      const maxX = Math.min(width - 1, x + radius);

      let found = 0;
      for (let ny = minY; ny <= maxY; ny++) {
        const rowOffset = ny * width;
        for (let nx = minX; nx <= maxX; nx++) {
          if (src[rowOffset + nx] === 1) {
            found = 1;
            break;
          }
        }
        if (found) break;
      }
      dst[y * width + x] = found;
    }
  }

  return dst;
}

/**
 * Erodes a 2D binary grid by Chebyshev radius r.
 * Output cell is 1 ONLY if ALL cells within [x - r .. x + r, y - r .. y + r] are 1.
 */
export function erode(
  src: Uint8Array,
  width: number,
  height: number,
  radius = 1
): Uint8Array {
  const dst = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    const minY = Math.max(0, y - radius);
    const maxY = Math.min(height - 1, y + radius);

    for (let x = 0; x < width; x++) {
      const minX = Math.max(0, x - radius);
      const maxX = Math.min(width - 1, x + radius);

      let allSet = 1;
      for (let ny = minY; ny <= maxY; ny++) {
        const rowOffset = ny * width;
        for (let nx = minX; nx <= maxX; nx++) {
          if (src[rowOffset + nx] === 0) {
            allSet = 0;
            break;
          }
        }
        if (!allSet) break;
      }
      dst[y * width + x] = allSet;
    }
  }

  return dst;
}

/**
 * Morphological Opening: Erosion followed by Dilation.
 * Cleans isolated 1-tile noise, thin promontories, and peninsula necks thinner than (2r + 1).
 */
export function open(
  src: Uint8Array,
  width: number,
  height: number,
  radius = 1
): Uint8Array {
  const eroded = erode(src, width, height, radius);
  return dilate(eroded, width, height, radius);
}

/**
 * Morphological Closing: Dilation followed by Erosion.
 * Bridges small 1-tile gaps, closes interior pinholes and concave notches.
 */
export function close(
  src: Uint8Array,
  width: number,
  height: number,
  radius = 1
): Uint8Array {
  const dilated = dilate(src, width, height, radius);
  return erode(dilated, width, height, radius);
}
