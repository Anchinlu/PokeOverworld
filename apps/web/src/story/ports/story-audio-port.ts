/**
 * Story Audio Port Interface
 */

export interface StoryAudioPort {
  playSound(sfxPath: string, volumeScale?: number): void;
  playCry(cryPath: string, volumeScale?: number): void;
  stopAll(): void;
}
