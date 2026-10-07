/**
 * Overworld Shiny Pokemon Spatial Audio Player
 * Handles looped proximity audio (Audio/SE/shiny-pokemon-sound_XMc2yU61.mp3)
 * when a wild Shiny Pokemon is present within a 3x3 chunk range of the player.
 * Volume dynamically scales with distance (closer = louder, edge of 3x3 = quiet).
 * Immediately pauses/stops when the shiny Pokemon despawns, is caught, or during battle.
 */

import type { WorldChunk } from '../maps/chunk';

export class OverworldShinyAudio {
  private static instance: OverworldShinyAudio;
  private audio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private masterVolume = 0.85;
  private currentVolume = 0;

  private constructor() {}

  public static getInstance(): OverworldShinyAudio {
    if (!OverworldShinyAudio.instance) {
      OverworldShinyAudio.instance = new OverworldShinyAudio();
    }
    return OverworldShinyAudio.instance;
  }

  public setMasterVolume(vol: number): void {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.audio && this.isPlaying) {
      this.audio.volume = this.currentVolume * this.masterVolume;
    }
  }

  public isAudioPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentVolume(): number {
    return this.currentVolume;
  }

  /**
   * Evaluates active chunks for wild Shiny Pokemon within 3x3 chunk range of the player.
   * Dynamically adjusts audio volume based on Euclidean distance.
   */
  public update(
    playerGX: number,
    playerGY: number,
    playerChunkX: number,
    playerChunkY: number,
    activeChunks: WorldChunk[],
    isBattling: boolean
  ): void {
    // Stop immediately if player is in a battle
    if (isBattling) {
      this.stop();
      return;
    }

    // Find nearest shiny wild pokemon within a 3x3 chunk range (cdx <= 1 && cdy <= 1)
    let minDistance = Infinity;
    let foundShinyInRange = false;

    for (const chunk of activeChunks) {
      if (!chunk.wildPokemon || chunk.wildPokemon.length === 0) continue;

      for (const wp of chunk.wildPokemon) {
        if (!wp.isShiny) continue;

        // Chunk coordinate distance
        const shinyCx = wp.chunkCx !== undefined ? wp.chunkCx : chunk.cx;
        const shinyCy = wp.chunkCy !== undefined ? wp.chunkCy : chunk.cy;
        const cdx = Math.abs(shinyCx - playerChunkX);
        const cdy = Math.abs(shinyCy - playerChunkY);

        if (cdx <= 1 && cdy <= 1) {
          foundShinyInRange = true;
          const dist = Math.hypot(playerGX - wp.gx, playerGY - wp.gy);
          if (dist < minDistance) {
            minDistance = dist;
          }
        }
      }
    }

    if (!foundShinyInRange) {
      this.stop();
      return;
    }

    // 3x3 chunk maximum reach: center to border is ~24 tiles
    const maxAudibleDistance = 26; // tiles
    const closenessRatio = Math.max(0, Math.min(1, 1 - minDistance / maxAudibleDistance));

    // Non-linear cubic curve: distinct presence at edge (0.08), swelling to full volume (1.0) near the Pokemon
    const targetVol = 0.08 + Math.pow(closenessRatio, 1.3) * 0.92;
    this.play(targetVol);
  }

  private initAudio(): HTMLAudioElement | null {
    if (typeof Audio === 'undefined') return null;
    if (!this.audio) {
      const baseUrl =
        typeof window !== 'undefined' && window.location?.href
          ? window.location.href
          : 'http://localhost/';
      const audioUrl = new URL('Audio/SE/shiny-pokemon-sound_XMc2yU61.mp3', baseUrl).href;
      this.audio = new Audio(audioUrl);
      this.audio.loop = true;
      this.audio.preload = 'auto';
    }
    return this.audio;
  }

  private play(relativeVolume: number): void {
    const audio = this.initAudio();
    if (!audio) return;

    // Smooth volume interpolation
    this.currentVolume = this.currentVolume * 0.8 + relativeVolume * 0.2;
    const finalVol = Math.max(0, Math.min(1, this.currentVolume * this.masterVolume));
    audio.volume = finalVol;

    if (!this.isPlaying) {
      this.isPlaying = true;
      audio.play().catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        // Autoplay policy may block initial play before user interaction
      });
    }
  }

  public stop(): void {
    if (this.audio && this.isPlaying) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.isPlaying = false;
      this.currentVolume = 0;
    }
  }
}

export const overworldShinyAudio = OverworldShinyAudio.getInstance();
