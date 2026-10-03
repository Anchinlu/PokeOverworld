/**
 * Battle screen asset preloader.
 * Centralizes all image loading and asset path constants.
 */

import type { BattleEnvironment } from './types';

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

// Asset path constants — single source of truth for battle graphics
const BATTLE_GFX = '/Graphics/Battle';

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
    bg: load(`${BATTLE_GFX}/battlebg/${env.background}`),
    enemyBase: load(`${BATTLE_GFX}/enemybase/${env.enemyBase}`),
    playerBase: load(`${BATTLE_GFX}/playerbase/${env.playerBase}`),
    enemySprite: load(frontSprite),
    playerSprite: load(backSprite),
    databoxEnemy: load(`${BATTLE_GFX}/databox_enermy.png`),
    databoxPlayer: load(`${BATTLE_GFX}/databox_player.png`),
    messageBox: load(`${BATTLE_GFX}/battleMessage.png`),
    fightOverlay: load(`${BATTLE_GFX}/overlay_fight.png`),
    cursorCommand: load(`${BATTLE_GFX}/cursor_command.png`),
    overlayExp: load(`${BATTLE_GFX}/overlay_exp.png`),
    ball: load(`${BATTLE_GFX}/ball00.png`),
  };
}

/** Check if an image is fully loaded and has valid dimensions */
export function isLoaded(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0;
}
