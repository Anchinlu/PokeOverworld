import { TILE_SIZE, TERRAIN } from '@pokemon/game-data';
import type { ChunkManager } from '../maps/chunk-manager';
import type { Player } from '../entities/player';
import type { Follower } from '../entities/follower';
import type { WildPokemonEntity } from '../maps/chunk';
import { isRoadTile, isSandTile, isHillTile } from '../maps/terrain-rules';
import { defaultRng } from '../core/rng';

const DX_MAP = [0, -1, 1, 0];
const DY_MAP = [1, 0, 0, -1];

export function updateWildPokemon(
  chunkManager: ChunkManager,
  player: Player,
  follower: Follower,
  dtScale = 1.0
): void {
  const now = performance.now();

  for (const chunk of chunkManager.activeChunks) {
    for (const wp of chunk.wildPokemon) {
      // 1. Update emote balloon timer
      if (wp.emote) {
        wp.emote.timer -= 16.6 * dtScale;
        if (wp.emote.timer <= 0) {
          wp.emote = null;
        }
      }

      // 2. Idle Pecking animation (Birds)
      if (!wp.isMoving) {
        if (wp.isPecking && wp.peckStartTime !== undefined) {
          const elapsed = now - wp.peckStartTime;
          if (elapsed < 350) {
            wp.bobY = Math.sin((elapsed / 350) * Math.PI * 4) * 2.5;
          } else {
            wp.isPecking = false;
            wp.bobY = 0;
          }
        } else {
          wp.bobY = 0;
        }
      }

      // 3. Grid Step Movement Interpolation
      if (wp.isMoving) {
        wp.stepProgress += wp.moveSpeed * dtScale;
        const totalDist = 32;
        const t = Math.min(wp.stepProgress / totalDist, 1.0);

        wp.x = wp.fromX + (wp.targetX - wp.fromX) * t;
        wp.y = wp.fromY + (wp.targetY - wp.fromY) * t;

        // Subtle natural step bounce
        wp.bobY = -Math.sin(t * Math.PI) * 2;
        wp.frame = Math.floor(t * 4) % 4;

        if (t >= 1.0) {
          wp.gx = wp.targetGX;
          wp.gy = wp.targetGY;
          wp.x = wp.targetX;
          wp.y = wp.targetY;
          wp.isMoving = false;
          wp.frame = 0;
          wp.stepProgress = 0;
          wp.bobY = 0;
          wp.lastMoveTime = now;

          if (wp.stepsRemaining > 0) {
            wp.stepsRemaining--;
            if (tryWildMove(wp, wp.currentDir, chunkManager, player, follower)) {
              startWildMove(wp, wp.currentDir);
            } else {
              wp.stepsRemaining = 0;
              wp.idleTimer = 600 + defaultRng.next() * 1200;
            }
          } else {
            if (wp.state === 'fleeing') {
              wp.state = 'idle';
              wp.idleTimer = 800 + defaultRng.next() * 1000;
            } else {
              wp.idleTimer = 1000 + defaultRng.next() * 2200;
            }
          }
        }
      } else {
        // === IDLE: SENSORY PERCEPTION & BEHAVIOR TREE ===
        const dxP = player.gx - wp.gx;
        const dyP = player.gy - wp.gy;
        const distManhattan = Math.abs(dxP) + Math.abs(dyP);

        // Vision Cone Detection (4 tiles depth, 1 tile width)
        let isInVisionCone = false;
        if (wp.dir === 0 && dyP > 0 && dyP <= 4 && Math.abs(dxP) <= 1) isInVisionCone = true;
        if (wp.dir === 3 && dyP < 0 && Math.abs(dyP) <= 4 && Math.abs(dxP) <= 1)
          isInVisionCone = true;
        if (wp.dir === 1 && dxP < 0 && Math.abs(dxP) <= 4 && Math.abs(dyP) <= 1)
          isInVisionCone = true;
        if (wp.dir === 2 && dxP > 0 && dxP <= 4 && Math.abs(dyP) <= 1) isInVisionCone = true;

        const isPlayerDetected = isInVisionCone || distManhattan <= 2;

        // A. Species-Specific Reaction to Player
        if (isPlayerDetected && wp.state !== 'fleeing') {
          // 1. Skittish Bird (Pidgey): Startles and flees
          if (wp.behavior === 'skittish_bird') {
            if (!wp.emote || wp.emote.type !== '!') {
              wp.emote = { type: '!', timer: 1200, maxTime: 1200 };
            }
            const fleeDir = getFleeDirection(wp, player);
            wp.state = 'fleeing';
            wp.stepsRemaining = 2;
            wp.currentDir = fleeDir;
            wp.dir = fleeDir;
            if (tryWildMove(wp, fleeDir, chunkManager, player, follower)) {
              startWildMove(wp, fleeDir);
              continue;
            }
          }
          // 2. Curious Rodent (Rattata): Inspects if at distance, flees if too close
          else if (wp.behavior === 'curious_rodent') {
            if (distManhattan <= 2) {
              if (!wp.emote || wp.emote.type !== '!') {
                wp.emote = { type: '!', timer: 1000, maxTime: 1000 };
              }
              const fleeDir = getFleeDirection(wp, player);
              wp.state = 'fleeing';
              wp.stepsRemaining = 2;
              wp.currentDir = fleeDir;
              wp.dir = fleeDir;
              if (tryWildMove(wp, fleeDir, chunkManager, player, follower)) {
                startWildMove(wp, fleeDir);
                continue;
              }
            } else if (wp.state !== 'curious') {
              wp.state = 'curious';
              wp.dir = getDirToward(wp, player);
              if (!wp.emote) {
                wp.emote = { type: '?', timer: 1400, maxTime: 1400 };
              }
              wp.lastMoveTime = now;
              wp.idleTimer = 1600;
              continue;
            }
          }
          // 3. Aggressive Bird (Spearow): Stares down, flees only if stepped on
          else if (wp.behavior === 'aggressive_bird') {
            if (distManhattan <= 2) {
              const fleeDir = getFleeDirection(wp, player);
              wp.state = 'fleeing';
              wp.stepsRemaining = 1;
              wp.currentDir = fleeDir;
              wp.dir = fleeDir;
              if (tryWildMove(wp, fleeDir, chunkManager, player, follower)) {
                startWildMove(wp, fleeDir);
                continue;
              }
            } else {
              wp.dir = getDirToward(wp, player);
              if (!wp.emote) {
                wp.emote = { type: '!', timer: 800, maxTime: 800 };
              }
              wp.lastMoveTime = now;
              wp.idleTimer = 1200;
              continue;
            }
          }
          // 4. Slow Bug (Caterpie): Sweats nervously
          else if (wp.behavior === 'slow_bug') {
            if (!wp.emote) {
              wp.emote = { type: 'sweat', timer: 1500, maxTime: 1500 };
            }
          }
          // 5. Dormant Cocoon (Kakuna): Unfazed
          else if (wp.behavior === 'dormant_cocoon') {
            if (!wp.emote && defaultRng.next() < 0.3) {
              wp.emote = { type: 'dots', timer: 1200, maxTime: 1200 };
            }
          }
        }

        // B. Natural Idle Behaviors When Timer Expires
        if (now - wp.lastMoveTime > wp.idleTimer) {
          // Dormant Cocoon: 95% still
          if (wp.behavior === 'dormant_cocoon') {
            wp.lastMoveTime = now;
            wp.idleTimer = 4000 + defaultRng.next() * 6000;
            if (defaultRng.next() < 0.15) {
              wp.dir = defaultRng.nextInt(0, 3);
            }
            continue;
          }

          // Birds: 35% chance to peck ground
          if (
            (wp.behavior === 'skittish_bird' || wp.behavior === 'aggressive_bird') &&
            !wp.isPecking
          ) {
            if (defaultRng.next() < 0.35) {
              wp.isPecking = true;
              wp.peckStartTime = now;
              wp.lastMoveTime = now;
              wp.idleTimer = 800 + defaultRng.next() * 800;
              continue;
            }
          }

          // Look Around (25% chance)
          if (defaultRng.next() < 0.25) {
            wp.dir = defaultRng.nextInt(0, 3);
            wp.lastMoveTime = now;
            wp.idleTimer = 600 + defaultRng.next() * 1200;
            continue;
          }

          // Choose Natural Movement
          const chosenDir = chooseNaturalDirection(wp, chunkManager, player, follower);
          if (chosenDir !== null) {
            const multiRoll = defaultRng.next();
            const totalSteps =
              wp.behavior === 'curious_rodent' && multiRoll < 0.5
                ? 2
                : wp.behavior === 'skittish_bird' && multiRoll < 0.4
                  ? 2
                  : 1;

            wp.stepsRemaining = totalSteps - 1;
            wp.currentDir = chosenDir;
            wp.dir = chosenDir;
            startWildMove(wp, chosenDir);
          } else {
            wp.dir = defaultRng.nextInt(0, 3);
            wp.lastMoveTime = now;
            wp.idleTimer = 500 + defaultRng.next() * 1000;
          }
        }
      }
    }
  }
}

function chooseNaturalDirection(
  wp: WildPokemonEntity,
  chunkManager: ChunkManager,
  player: Player,
  follower: Follower
): number | null {
  const distFromHome = Math.abs(wp.gx - wp.homeGX) + Math.abs(wp.gy - wp.homeGY);

  // Return home if strayed too far (75% bias)
  if (distFromHome >= wp.wanderRadius && defaultRng.next() < 0.75) {
    const homeDir = getDirToward(wp, { gx: wp.homeGX, gy: wp.homeGY });
    if (tryWildMove(wp, homeDir, chunkManager, player, follower)) {
      return homeDir;
    }
  }

  const validDirs: number[] = [];
  const weights: number[] = [];

  for (let dir = 0; dir < 4; dir++) {
    if (tryWildMove(wp, dir, chunkManager, player, follower)) {
      validDirs.push(dir);

      const destGX = wp.gx + DX_MAP[dir];
      const destGY = wp.gy + DY_MAP[dir];
      const tile = chunkManager.getTileData(destGX, destGY);

      // 4x affinity for Tall Grass
      let weight = 1.0;
      if (tile && tile.tallGrass) {
        weight = 4.0;
      }
      // Prefer continuing forward
      if (dir === wp.dir) {
        weight += 1.5;
      }
      weights.push(weight);
    }
  }

  if (validDirs.length === 0) return null;

  const totalWeight = weights.reduce((s, w) => s + w, 0);
  let roll = defaultRng.next() * totalWeight;
  for (let i = 0; i < validDirs.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return validDirs[i];
  }
  return validDirs[0];
}

function getDirToward(
  from: { gx: number; gy: number },
  target: { gx: number; gy: number }
): number {
  const dx = target.gx - from.gx;
  const dy = target.gy - from.gy;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 2 : 1; // RIGHT : LEFT
  } else {
    return dy > 0 ? 0 : 3; // DOWN : UP
  }
}

function getFleeDirection(
  from: { gx: number; gy: number },
  target: { gx: number; gy: number }
): number {
  const dx = from.gx - target.gx;
  const dy = from.gy - target.gy;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0 ? 2 : 1; // flee right / left
  } else {
    return dy > 0 ? 0 : 3; // flee down / up
  }
}

function tryWildMove(
  wp: WildPokemonEntity,
  dir: number,
  chunkManager: ChunkManager,
  player: Player,
  follower: Follower
): boolean {
  const newGX = wp.gx + DX_MAP[dir];
  const newGY = wp.gy + DY_MAP[dir];

  // Do not collide with Player or Follower
  if (newGX === player.gx && newGY === player.gy) return false;
  if (player.isMoving && newGX === player.targetGX && newGY === player.targetGY) return false;
  if (newGX === follower.gx && newGY === follower.gy) return false;
  if (follower.isMoving && newGX === follower.targetGX && newGY === follower.targetGY) return false;

  // Limit wander radius
  const distFromHome = Math.abs(newGX - wp.homeGX) + Math.abs(newGY - wp.homeGY);
  if (distFromHome > wp.wanderRadius + 1) return false;

  const chunk = chunkManager.getChunk(wp.chunkCx, wp.chunkCy);
  if (!chunk) return false;

  const startGX = wp.chunkCx * 16;
  const startGY = wp.chunkCy * 16;
  const localX = newGX - startGX;
  const localY = newGY - startGY;

  if (localX < 0 || localX >= 16 || localY < 0 || localY >= 16) return false;
  if (!chunk.terrainGrid[localY] || chunk.terrainGrid[localY][localX] !== TERRAIN.GRASS)
    return false;
  if (isRoadTile(newGX, newGY, wp.seed)) return false;
  if (isSandTile(newGX, newGY, wp.seed)) return false;
  if (isHillTile(newGX, newGY, wp.seed)) return false;

  // Check colliders (trees, obstacles)
  const px = newGX * TILE_SIZE;
  const py = newGY * TILE_SIZE;
  for (const c of chunk.colliders) {
    if (px + 26 > c.x && px + 6 < c.x + c.w && py + 30 > c.y && py + 10 < c.y + c.h) {
      return false;
    }
  }

  return true;
}

function startWildMove(wp: WildPokemonEntity, dir: number): void {
  wp.isMoving = true;
  wp.fromX = wp.x;
  wp.fromY = wp.y;
  wp.targetGX = wp.gx + DX_MAP[dir];
  wp.targetGY = wp.gy + DY_MAP[dir];
  wp.targetX = wp.targetGX * TILE_SIZE - 16;
  wp.targetY = wp.targetGY * TILE_SIZE - 32;
  wp.stepProgress = 0;
  wp.dir = dir;
}
