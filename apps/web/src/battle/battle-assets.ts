/**
 * Battle screen asset preloader.
 * Centralizes all image loading and asset path constants.
 */

import type { BattleEnvironment } from './types';
import { BATTLE_ASSETS } from '../assets';

/** All preloaded images for the battle screen */
export interface BattleAssets {
  bg: HTMLImageElement;
  enemyBase: HTMLImageElement;
  playerBase: HTMLImageElement;
  enemySprite: HTMLImageElement;
  playerSprite: HTMLImageElement;
  databoxEnemy: HTMLImageElement;
  databoxPlayer: HTMLImageElement;
  messageBox: HTMLImageElement;
  fightOverlay: HTMLImageElement;
  cursorCommand: HTMLImageElement;
  overlayExp: HTMLImageElement;
  ball: HTMLImageElement;
}

export function createBattleAssets(
  env: BattleEnvironment,
  frontSprite: string,
  backSprite: string
): BattleAssets {
  const load = (src: string): HTMLImageElement => {
    const img = new Image();
    img.src = src;
    return img;
  };

  return {
    bg: load(BATTLE_ASSETS.getBackground(env.background)),
    enemyBase: load(BATTLE_ASSETS.getEnemyBase(env.enemyBase)),
    playerBase: load(BATTLE_ASSETS.getPlayerBase(env.playerBase)),
    enemySprite: load(frontSprite),
    playerSprite: load(backSprite),
    databoxEnemy: load(BATTLE_ASSETS.databoxEnemy),
    databoxPlayer: load(BATTLE_ASSETS.databoxPlayer),
    messageBox: load(BATTLE_ASSETS.messageBox),
    fightOverlay: load(BATTLE_ASSETS.fightOverlay),
    cursorCommand: load(BATTLE_ASSETS.cursorCommand),
    overlayExp: load(BATTLE_ASSETS.overlayExp),
    ball: load(BATTLE_ASSETS.ball),
  };
}

/** Check if an image is fully loaded and has valid dimensions */
export function isLoaded(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0;
}
