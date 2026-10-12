/**
 * Battle screen asset preloader.
 * Centralizes all image loading and asset path constants.
 */

import type { BattleEnvironment } from './types';
import { BATTLE_ASSETS, MOVE_ASSETS, POKEMON_ASSETS } from '../assets';

import { detectPresetFromEnvironment } from './battle-environment-presets';

export interface BattleEnvironmentElementAssets {
  sun?: HTMLImageElement;
  cloud?: HTMLImageElement;
  cloud2?: HTMLImageElement;
  forestShade?: HTMLImageElement;
  treePine?: HTMLImageElement;
  tallGrass?: HTMLImageElement;
  lightC1?: HTMLImageElement;
  lightC2?: HTMLImageElement;
  lightC3?: HTMLImageElement;
  water0?: HTMLImageElement;
  water1?: HTMLImageElement;
  bubble?: HTMLImageElement;
  mountain?: HTMLImageElement;
  rocks?: HTMLImageElement;
  canopyGround?: HTMLImageElement;
  fog?: HTMLImageElement;
}

/** All preloaded images for the battle screen */
export interface BattleAssets {
  bg: HTMLImageElement;
  enemyBase: HTMLImageElement;
  playerBase: HTMLImageElement;
  foregroundOverlay?: HTMLImageElement;
  overlayKey?: string;
  envElements?: BattleEnvironmentElementAssets;
  enemySprite: HTMLImageElement;
  playerSprite: HTMLImageElement;
  databoxEnemy: HTMLImageElement;
  databoxPlayer: HTMLImageElement;
  abilityBar: HTMLImageElement;
  messageBox: HTMLImageElement;
  statusIcons: HTMLImageElement;
  fightButtons: HTMLImageElement;
  categoryIcon: HTMLImageElement;
  commandButtons: HTMLImageElement;
  cursorCommand: HTMLImageElement;
  overlayExp: HTMLImageElement;
  ball: HTMLImageElement;
  ballOpen: HTMLImageElement;
  thrownBall: HTMLImageElement; // Ball being thrown (can be different type)
  thrownBallOpen: HTMLImageElement;
  thrownBallClosed: HTMLImageElement; // Closed ball on ground (for shake)
  ballBurstRay: HTMLImageElement;
  ballBurstParticle: HTMLImageElement;
  ballBurstRing: HTMLImageElement;
  shinyIcon: HTMLImageElement;
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

  const preset = detectPresetFromEnvironment(env);
  const envElements: BattleEnvironmentElementAssets = {};

  if (preset.hasSun) {
    envElements.sun = load(BATTLE_ASSETS.getBattlebackElement('sun.png'));
  }
  if (preset.hasClouds) {
    envElements.cloud = load(BATTLE_ASSETS.getBattlebackElement('cloud1.png'));
    envElements.cloud2 = load(BATTLE_ASSETS.getBattlebackElement('cloud2.png'));
  }
  if (preset.hasPineTrees) {
    envElements.treePine = load(BATTLE_ASSETS.getBattlebackElement('treePine.png'));
    envElements.tallGrass = load(BATTLE_ASSETS.getBattlebackElement('tallGrass.png'));
    envElements.lightC1 = load(BATTLE_ASSETS.getBattlebackElement('lightC1.png'));
    envElements.lightC2 = load(BATTLE_ASSETS.getBattlebackElement('lightC2.png'));
    envElements.lightC3 = load(BATTLE_ASSETS.getBattlebackElement('lightC3.png'));
  }
  if (preset.hasWaterShimmer) {
    envElements.water0 = load(BATTLE_ASSETS.getBattlebackElement('water0.png'));
    envElements.water1 = load(BATTLE_ASSETS.getBattlebackElement('water1.png'));
  }
  if (preset.hasBubbles) {
    envElements.bubble = load(BATTLE_ASSETS.getBattlebackElement('bubble.png'));
  }
  if (preset.hasMountainRidge) {
    envElements.mountain = load(BATTLE_ASSETS.getBattlebackElement('mountain.png'));
    envElements.fog = load(BATTLE_ASSETS.getBattlebackElement('fog.png'));
    envElements.rocks = load(BATTLE_ASSETS.getBattlebackElement('rocks.png'));
  }

  return {
    bg: load(BATTLE_ASSETS.getBackground(env.background)),
    enemyBase: load(BATTLE_ASSETS.getEnemyBase(env.enemyBase)),
    playerBase: load(BATTLE_ASSETS.getPlayerBase(env.playerBase)),
    foregroundOverlay: env.foregroundOverlay
      ? load(BATTLE_ASSETS.getForegroundOverlay(env.foregroundOverlay))
      : undefined,
    overlayKey: env.foregroundOverlay,
    envElements,
    enemySprite: load(frontSprite),
    playerSprite: load(backSprite),
    databoxEnemy: load(BATTLE_ASSETS.databoxEnemy),
    databoxPlayer: load(BATTLE_ASSETS.databoxPlayer),
    abilityBar: load(BATTLE_ASSETS.abilityBar),
    messageBox: load(BATTLE_ASSETS.messageBox),
    statusIcons: load(BATTLE_ASSETS.statusIcons),
    fightButtons: load(BATTLE_ASSETS.fightButtons),
    categoryIcon: load(MOVE_ASSETS.categoryIcon),
    commandButtons: load(BATTLE_ASSETS.commandButtons),
    cursorCommand: load(BATTLE_ASSETS.commandButtons),
    overlayExp: load(BATTLE_ASSETS.overlayExp),
    ball: load(BATTLE_ASSETS.getBall(ballType)),
    ballOpen: load(BATTLE_ASSETS.getBallOpen(ballType)),
    thrownBall: load(BATTLE_ASSETS.getBall(ballType)), // Initially same as player ball
    thrownBallOpen: load(BATTLE_ASSETS.getBallOpen(ballType)),
    thrownBallClosed: load(BATTLE_ASSETS.getBallClosed(ballType)),
    ballBurstRay: load(BATTLE_ASSETS.ballBurstRay),
    ballBurstParticle: load(BATTLE_ASSETS.ballBurstParticle),
    ballBurstRing: load(BATTLE_ASSETS.ballBurstRing),
    shinyIcon: load(POKEMON_ASSETS.shinyIcon),
  };
}

/** Check if an image is fully loaded and has valid dimensions */
export function isLoaded(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0;
}
