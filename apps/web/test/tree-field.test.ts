import { describe, expect, it } from 'vitest';
import { CHUNK_SIZE } from '@pokemon/game-data';
import { createTerrainField } from '../src/maps/terrain-field';
import { getForestTreeCandidates } from '../src/maps/ecology/tree-field';

describe('World-space tree candidate field', () => {
  it('is deterministic and keeps every candidate owned by its chunk', () => {
    const fieldA = createTerrainField(1, 20261019);
    const fieldB = createTerrainField(1, 20261019);
    const candidatesA = getForestTreeCandidates(2, -1, fieldA);
    const candidatesB = getForestTreeCandidates(2, -1, fieldB);

    expect(candidatesA).toEqual(candidatesB);
    for (const candidate of candidatesA) {
      expect(candidate.gx).toBeGreaterThanOrEqual(2 * CHUNK_SIZE);
      expect(candidate.gx).toBeLessThan(3 * CHUNK_SIZE);
      expect(candidate.gy).toBeGreaterThanOrEqual(-CHUNK_SIZE);
      expect(candidate.gy).toBeLessThan(0);
    }
  });

  it('allows a global forest pattern to place candidates on chunk edges', () => {
    let edgeCandidateCount = 0;

    for (let seed = 101; seed < 106; seed++) {
      const field = createTerrainField(1, seed);
      for (let cy = -2; cy <= 2; cy++) {
        for (let cx = -2; cx <= 2; cx++) {
          const candidates = getForestTreeCandidates(cx, cy, field);
          edgeCandidateCount += candidates.filter((candidate) => {
            const localX = ((candidate.gx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
            const localY = ((candidate.gy % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
            return (
              localX === 0 || localX === CHUNK_SIZE - 1 || localY === 0 || localY === CHUNK_SIZE - 1
            );
          }).length;
        }
      }
    }

    expect(edgeCandidateCount).toBeGreaterThan(0);
  }, 15000);
});
