/**
 * Battle screen asset preloader.
 * Centralizes all image loading and asset path constants.
 */

import type { BattleEnvironment } from './types';
import { BATTLE_ASSETS, MOVE_ASSETS } from '../assets';

/** All preloaded images for the battle screen */
export interface BattleAssets {
  bg: HTMLImageElement;
  enemyBase: HTMLImageElement;
  playerBase: HTMLImageElement;
  foregroundOverlay?: HTMLImageElement;
  overlayKey?: string;
  enemySprite: HTMLImageElement;
  playerSprite: HTMLImageElement;
  databoxEnemy: HTMLImageElement;
  databoxPlayer: HTMLImageElement;
  messageBox: HTMLImageElement;
  fightButtons: HTMLImageElement;
  categoryIcon: HTMLImageElement;
  commandButtons: HTMLImageElement;
  cursorCommand: HTMLImageElement;
  overlayExp: HTMLImageElement;
  ball: HTMLImageElement;
  ballOpen: HTMLImageElement;
  ballBurstRay: HTMLImageElement;
  ballBurstParticle: HTMLImageElement;
  ballBurstRing: HTMLImageElement;
}

export function createBattleAssets(
  env: BattleEnvironment,
  frontSprite: string,
  backSprite: string,
  ballType: string = 'POKEBALL'
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
    foregroundOverlay: env.foregroundOverlay
      ? load(BATTLE_ASSETS.getForegroundOverlay(env.foregroundOverlay))
      : undefined,
    overlayKey: env.foregroundOverlay,
    enemySprite: load(frontSprite),
    playerSprite: load(backSprite),
    databoxEnemy: load(BATTLE_ASSETS.databoxEnemy),
    databoxPlayer: load(BATTLE_ASSETS.databoxPlayer),
    messageBox: load(BATTLE_ASSETS.messageBox),
    fightButtons: load(BATTLE_ASSETS.fightButtons),
    categoryIcon: load(MOVE_ASSETS.categoryIcon),
    commandButtons: load(BATTLE_ASSETS.commandButtons),
    cursorCommand: load(BATTLE_ASSETS.commandButtons),
    overlayExp: load(BATTLE_ASSETS.overlayExp),
    ball: load(BATTLE_ASSETS.getBall(ballType)),
    ballOpen: load(BATTLE_ASSETS.getBallOpen(ballType)),
    ballBurstRay: load(BATTLE_ASSETS.ballBurstRay),
    ballBurstParticle: load(BATTLE_ASSETS.ballBurstParticle),
    ballBurstRing: load(BATTLE_ASSETS.ballBurstRing),
  };
}

/** Check if an image is fully loaded and has valid dimensions */
export function isLoaded(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0;
}
