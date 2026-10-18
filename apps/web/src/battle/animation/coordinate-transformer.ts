import type { AnimationFocus, AnimationViewport } from './types';

export interface Point2D {
  x: number;
  y: number;
}

export interface BattlerGeometry {
  baseX: number;
  baseY: number;
  spriteHeight: number;
}

export { type AnimationViewport };

/** Standard player battler geometry (base anchor at 130, 280; sprite height 130; center at 130, 215) */
export const DEFAULT_PLAYER_GEOMETRY: BattlerGeometry = {
  baseX: 130,
  baseY: 280,
  spriteHeight: 130,
};

/** Standard enemy battler geometry (base anchor at 380, 175; sprite height 120; center at 380, 115) */
export const DEFAULT_ENEMY_GEOMETRY: BattlerGeometry = {
  baseX: 380,
  baseY: 175,
  spriteHeight: 120,
};

/** Standard battle animation viewport matching battle screen render bounds */
export const DEFAULT_ANIMATION_VIEWPORT: AnimationViewport = {
  x: 0,
  y: 0,
  width: 512,
  height: 288,
};

/** Calculates the vertical center point of a battler sprite from its geometry */
export function getBattlerCenter(geom: BattlerGeometry): Point2D {
  return {
    x: geom.baseX,
    y: Math.round(geom.baseY - geom.spriteHeight / 2),
  };
}

/**
 * Determines whether flight direction between actual battlers is reversed
 * relative to the source authored trajectory (srcUser → srcTarget).
 *
 * Rules:
 * 1. Source direction is true if sourceUser.x < sourceTarget.x (left-to-right).
 * 2. Actual direction is true if actualUser.x < actualTarget.x.
 * 3. Returns true if directions differ (flight path is reversed, e.g. enemy attacking player).
 */
export function isDirectionReversed(
  sourceUser: Point2D,
  sourceTarget: Point2D,
  actualUser: Point2D,
  actualTarget: Point2D
): boolean {
  const sourceDir = sourceUser.x < sourceTarget.x;
  const actualDir = actualUser.x < actualTarget.x;
  return sourceDir !== actualDir;
}

/**
 * Whitelist of imported OppMove timelines whose focus="both" cels are authored
 * along the regular Player -> Enemy source trajectory and must be mirrored (512 - x)
 * so that when cast by Enemy they travel from the Enemy to the Player.
 */
export const OPP_MOVE_TRAJECTORY_REVERSED_IDS = new Set<string>([
  '686', // Disarming Voice
  '6401', // Boomburst
  '6815', // Dragon Breath
  '666', // Dark Pulse
  '566', // Dragon Pulse
  '1260', // Dragon Darts
  '1201', // Devastating Drake
  '574', // Drain Punch
  '892', // Dream Eater
  '6817', // Dragon Claw OppMove
  '860', // Feint OppMove
  '1364', // Eerie Impulse OppMove
  '804', // Egg Bomb OppMove
  '776', // Electrify OppMove
  '648', // Electro Ball OppMove
  '6824', // Energy Ball OppMove
  '6826', // Eruption OppMove
  '6833', // Fire Blast OppMove
  '387', // Flame Burst OppMove
  '6840', // Flame Charge OppMove
  '6842', // Flame Wheel OppMove
  '1025', // Fell Stinger OppMove
  '741', // Fling OppMove
  '1309', // Flip Turn OppMove
  '6847', // Frenzy Plant OppMove
  '568', // Frost Breath OppMove
  '1368', // Fusion Bolt OppMove
  '6831', // Fiery Dance OppMove
  '1035', // Gear Grind OppMove
  '1349', // Glacial Lance OppMove
  '6849', // Giga Drain OppMove
  '6853', // Grass Whistle OppMove
  '6857', // Grav Apple OppMove
  '670', // Gunk Shot OppMove
  '394', // Leaf Blade OppMove
  '729', // Leaf Storm OppMove
  '438', // Magical Leaf OppMove
  '426', // Moonblast OppMove
  '6893', // Mega Drain OppMove
  '650', // Metal Sound OppMove
  '598', // Mirror Shot OppMove
  '1383', // Moongeist Beam OppMove
  '673', // Mud Bomb OppMove
  '715', // Mud Shot OppMove
  '479', // Mystical Fire OppMove
  '6923', // Oceanic Operetta OppZMove
  '6925', // Octazooka OppMove (projectile)
  '6932', // Outrage OppMove
  '334', // Pay Day OppMove
  '6941', // Pay Day OppMove
  '1117', // Photon Geyser OppMove
  '6951', // Photon Geyser OppMove
  '415', // Pin Missile OppMove
  '6953', // Pin Missile OppMove
  '6965', // Poison Sting OppMove
  '6984', // Present OppMove
  '6989', // Psybeam OppMove
  '1076', // Psycho Boost OppMove
  '6995', // Psycho Boost OppMove
  '324', // Psycho Cut OppMove
  '6997', // Psycho Cut OppMove
  '717', // Psywave OppMove
  '7002', // Psywave OppMove
  '984', // Purify OppMove
  '7006', // Purify OppMove
  '578', // Pursuit OppMove
  '7008', // Pursuit OppMove
  '1288', // Pyro Ball OppMove
  '7010', // Pyro Ball OppMove
  '7260', // Tar Shot OppMove
  '7268', // Techno Blast OppMove
  '7276', // Terrain Pulse OppMove
  '7282', // Thousand Waves OppMove
  '7318', // Tri Attack OppMove
  '7322', // Trick-or-Treat OppMove
  '7328', // Triple Kick OppMove
  '7336', // Twinkle Tackle OppMove
]);

export function isOppMoveTrajectoryReversed(id: string | number | undefined | null): boolean {
  if (id === undefined || id === null) return false;
  return OPP_MOVE_TRAJECTORY_REVERSED_IDS.has(String(id));
}

export class CoordinateTransformer {
  /**
   * Standard Pokémon Essentials virtual reference positions on the 512×384 canvas.
   * User (player) focal point is bottom-left (128, 224); Target (enemy) is top-right (384, 96).
   * All cel x/y coordinates in source rxdata/JSON are authored relative to these anchors.
   */
  public static readonly SRC_USER: Point2D = { x: 128, y: 224 };
  public static readonly SRC_TARGET: Point2D = { x: 384, y: 96 };
  public static readonly SRC_WIDTH = 512;
  public static readonly SRC_HEIGHT = 384;
  public static readonly DEFAULT_CANVAS_WIDTH = 512;
  public static readonly DEFAULT_CANVAS_HEIGHT = 288;
  public static readonly DEFAULT_VIEWPORT: AnimationViewport = DEFAULT_ANIMATION_VIEWPORT;

  /**
   * Determines if flight trajectory is reversed between actual battlers.
   */
  public static isDirectionReversed(
    sourceUser: Point2D,
    sourceTarget: Point2D,
    actualUser: Point2D,
    actualTarget: Point2D
  ): boolean {
    return isDirectionReversed(sourceUser, sourceTarget, actualUser, actualTarget);
  }

  public static isOppMoveTrajectoryReversed(id: string | number | undefined | null): boolean {
    return isOppMoveTrajectoryReversed(id);
  }

  /**
   * Linearly maps a point (px, py) from the virtual source line (src1→src2)
   * to actual canvas coordinates using progress along the destination line (dst1→dst2).
   *
   * In Essentials:
   * Source progress is derived along X (px - src1.x) / sourceDx.
   * Both destination X and Y interpolate along dst1→dst2 via this progress.
   */
  public static transformPoint(
    src1: Point2D,
    src2: Point2D,
    dst1: Point2D,
    dst2: Point2D,
    px: number,
    py?: number,
    preserveCurve = false
  ): Point2D {
    const sourceDx = src2.x - src1.x;
    const progress = sourceDx === 0 ? 0 : (px - src1.x) / sourceDx;
    const linearSourceY = src1.y + progress * (src2.y - src1.y);
    const curveOffset = preserveCurve && py !== undefined ? py - linearSourceY : 0;

    return {
      x: dst1.x + progress * (dst2.x - dst1.x),
      y: dst1.y + progress * (dst2.y - dst1.y) + curveOffset,
    };
  }

  /**
   * Calculates actual canvas (x, y) for an animation cel based on its focus mode:
   *
   *   focus='user'   → Anchored to user battler. Offset: (celX - SRC_USER.x, celY - SRC_USER.y)
   *   focus='target' → Anchored to target battler. Offset: (celX - SRC_TARGET.x, celY - SRC_TARGET.y)
   *   focus='both'   → Trajectory interpolating between user and target along the virtual flight line
   *   focus='screen' → Scaled from 512×384 virtual space into battle viewport
   */
  public static resolveCelPosition(
    celX: number,
    celY: number,
    focus: AnimationFocus,
    userPos: Point2D,
    targetPos: Point2D,
    viewportOrWidth: AnimationViewport | number = DEFAULT_ANIMATION_VIEWPORT,
    canvasHeightOrEnemy?: number | boolean,
    isEnemyOrSelfTarget = false,
    selfTargetParam = false,
    preserveCurve = false,
    _isOppMove = false,
    definitionId?: string | number,
    pattern?: number
  ): Point2D {
    let viewport: AnimationViewport;
    let selfTarget: boolean;
    let isEnemy = false;

    if (typeof viewportOrWidth === 'object' && viewportOrWidth !== null) {
      viewport = viewportOrWidth;
      isEnemy = typeof canvasHeightOrEnemy === 'boolean' ? canvasHeightOrEnemy : false;
      selfTarget =
        selfTargetParam || (typeof isEnemyOrSelfTarget === 'boolean' && isEnemyOrSelfTarget);
    } else {
      const width =
        typeof viewportOrWidth === 'number' ? viewportOrWidth : this.DEFAULT_CANVAS_WIDTH;
      const height =
        typeof canvasHeightOrEnemy === 'number' ? canvasHeightOrEnemy : this.DEFAULT_CANVAS_HEIGHT;
      viewport = { x: 0, y: 0, width, height };
      selfTarget = selfTargetParam;
    }

    // Handle imported Essentials omitted / nil cels (0, 0)
    if (celX === 0 && celY === 0) {
      if (focus === 'target') return selfTarget ? { ...userPos } : { ...targetPos };
      if (focus === 'user') return { ...userPos };
      if (focus === 'both') return { ...userPos };
    }

    // Horn Leech's OppMove drain particles (patterns 5 and 6) are labeled
    // `target` in the imported timeline, although they represent the energy
    // returning from the struck Player to the attacking Enemy. Re-anchor only
    // those particles to the real attacker; the target-focused impact cels
    // remain on the Pokémon being hit.
    if (
      _isOppMove &&
      String(definitionId) === '927' &&
      focus === 'target' &&
      (pattern === 5 || pattern === 6)
    ) {
      return {
        x: userPos.x + (celX - this.SRC_USER.x),
        y: userPos.y + (celY - this.SRC_USER.y),
      };
    }

    // Icicle Spear (351) and Psybeam (6989 / 628) OppMove timelines are authored from the mirrored
    // source target anchor toward the source user anchor. Use the reversed
    // source pair so the beam/projectiles start at the Enemy and travel to the
    // Player without false horizontal mirroring or distorted curve offsets.
    if (
      _isOppMove &&
      (String(definitionId) === '351' ||
        String(definitionId) === '6989' ||
        String(definitionId) === '628') &&
      focus === 'both'
    ) {
      return this.transformPoint(
        this.SRC_TARGET,
        this.SRC_USER,
        userPos,
        targetPos,
        celX,
        celY,
        false
      );
    }

    // Hypnosis' regular Player timeline (ID 575) is exported with the horizontal
    // trajectory reversed: its visible cels run from x=190 down to x=126 even
    // though the Player attacks toward the target on the right. The OppMove
    // timeline (ID 576) is already authored in the mirrored direction. Reflect
    // only the regular timeline before resolving it around the real target so the
    // sleep-wave remains on-screen and travels toward the defender.
    if (
      String(definitionId) === '575' &&
      focus === 'target' &&
      celX > 0 &&
      celX < this.SRC_USER.x
    ) {
      celX = this.SRC_WIDTH - celX;
    }

    // Crush Claw (6806), False Surrender (1271), Focus Punch (590),
    // Giga Impact (1049), Giga Drain (6849), Headbutt (396), and Lock-On (6884) OppMove timelines contain their
    // impact/reticle sequences with coordinates authored around the source USER
    // anchor (128, 224), although the effect must remain on the real target (the player).
    // Re-anchor these known timelines to targetPos.
    if (
      _isOppMove &&
      (String(definitionId) === '6806' ||
        String(definitionId) === '1271' ||
        String(definitionId) === '590' ||
        String(definitionId) === '1049' ||
        String(definitionId) === '6849' ||
        String(definitionId) === '396' ||
        String(definitionId) === '6884' ||
        String(definitionId) === '7139' ||
        String(definitionId) === '268' ||
        String(definitionId) === '7125' ||
        String(definitionId) === '1219' ||
        String(definitionId) === '7130' ||
        String(definitionId) === '1327' ||
        String(definitionId) === '7200' ||
        String(definitionId) === '7286' ||
        String(definitionId) === '1107' ||
        String(definitionId) === '641') &&
      focus === 'user' &&
      celX <= 256 &&
      celY >= 100
    ) {
      return {
        x: targetPos.x + (celX - this.SRC_USER.x),
        y: targetPos.y + (celY - this.SRC_USER.y),
      };
    }

    // Fell Stinger's (1025) and Shadow Bone's (7101 / 1080) OppMove opening frames are mislabeled as `target`, but
    // their authored coordinates (x=344..461) are around the source attacker
    // anchor. If resolved as target-focused, an enemy cast starts on the
    // player's side. Re-anchor only these opening cels to the actual attacker;
    // the later `both` trajectory and low-x impact cel remain target-bound.
    if (
      _isOppMove &&
      (String(definitionId) === '1025' ||
        String(definitionId) === '7101' ||
        String(definitionId) === '1080') &&
      focus === 'target' &&
      celX >= 300
    ) {
      return {
        x: userPos.x + (celX - this.SRC_TARGET.x),
        y: userPos.y + (celY - this.SRC_TARGET.y),
      };
    }

    // Fell Stinger's OppMove impact frames (18+) are labeled `user`, but
    // their authored anchor (128, 224) is the source target position. Keep
    // the slash/impact on the Pokémon being hit, not on the enemy attacker.
    if (
      _isOppMove &&
      String(definitionId) === '1025' &&
      focus === 'user' &&
      celX === this.SRC_USER.x &&
      celY === this.SRC_USER.y
    ) {
      return {
        x: targetPos.x,
        y: targetPos.y,
      };
    }

    // Fiery Dance's and Iron Head's OppMove finishing effect is authored at the mirrored
    // target anchor (128, 224) with focus `both`. Without this correction it
    // resolves to the enemy attacker, so the final impact appears on the
    // wrong Pokémon.
    if (
      _isOppMove &&
      (String(definitionId) === '6831' || String(definitionId) === '6870') &&
      focus === 'both' &&
      celX === this.SRC_USER.x &&
      celY === this.SRC_USER.y
    ) {
      return {
        x: targetPos.x,
        y: targetPos.y,
      };
    }

    // Fiery Dance OppMove opening flames are authored as screen-space cels,
    // but they represent the dance around the attacking Pokémon. Resolve
    // them relative to the actual enemy attacker instead of leaving them at
    // fixed screen coordinates far from the battler.
    if (_isOppMove && String(definitionId) === '6831' && focus === 'screen') {
      const openingScale = 0.6;
      return {
        x: userPos.x + (celX - this.SRC_TARGET.x) * openingScale,
        y: userPos.y + (celY - this.SRC_TARGET.y) * openingScale,
      };
    }

    // Specific imported OppMove timelines authored in regular Player -> Enemy source direction
    // or authored with source trajectory needing mirroring so an Enemy cast starts at
    // the Enemy battler and travels toward the Player instead of spawning at the target side.
    if (_isOppMove && focus === 'both' && isOppMoveTrajectoryReversed(definitionId)) {
      celX = this.SRC_WIDTH - celX;
    }

    // Blue Flare's screen-space flame trail is authored only in the regular
    // Player -> Enemy direction. Mirror those fixed screen coordinates when
    // the Enemy is the attacker so the trail begins on the Enemy side.
    if (isEnemy && String(definitionId) === '50' && focus === 'screen') {
      celX = this.SRC_WIDTH - celX;
    }

    // Fiery Dance's OppMove screen cels are authored in the Player-side
    // screen layout and need horizontal mirroring when the Enemy attacks.
    if (isEnemy && String(definitionId) === '6831' && focus === 'screen') {
      celX = this.SRC_WIDTH - celX;
    }

    // Fiery Dance uses 192px screen cels. The source places one cel at the
    // extreme edge (x=498), which makes half of the flame disappear; after
    // OppMove mirroring it lands at x=14 and is clipped on the other side.
    // Keep the authored direction, but constrain the cel center so the full
    // effect remains visible in the battle viewport.
    if (
      focus === 'screen' &&
      (String(definitionId) === '6830' || String(definitionId) === '6831')
    ) {
      celX = Math.max(96, Math.min(this.SRC_WIDTH - 96, celX));
      celY = Math.max(96, Math.min(this.SRC_HEIGHT - 96, celY));
    }

    // Fly's Player timeline uses x=384 for a vertical take-off sequence, but
    // that coordinate is not a target anchor. Keep the flying sprite attached
    // to the acting battler and preserve only its authored vertical offset.
    if (String(definitionId) === '309' && focus === 'both') {
      return {
        x: userPos.x,
        y: userPos.y + (celY - this.SRC_USER.y),
      };
    }

    // Fusion Flare's OppMove timeline labels its cels as user-focused, but
    // the authored coordinates are centered on the source TARGET anchor.
    // Re-anchor them to the actual Enemy battler so the fire sequence starts
    // there and travels toward the Player instead of leaving the viewport.
    if (_isOppMove && String(definitionId) === '1047' && focus === 'user') {
      return {
        x: userPos.x + (celX - this.SRC_TARGET.x),
        y: userPos.y + (celY - this.SRC_TARGET.y),
      };
    }

    // Gigavolt Havoc's OppMove timeline authored charging lightning around the Enemy (SRC_TARGET 384, 96)
    // with focus `user`, and thunder crash on the Player (SRC_USER 128, 224) with focus `target`.
    // Re-anchor user cels to userPos and target cels to targetPos using their respective authored anchors.
    if (_isOppMove && String(definitionId) === '1195') {
      if (focus === 'user') {
        return {
          x: userPos.x + (celX - this.SRC_TARGET.x),
          y: userPos.y + (celY - this.SRC_TARGET.y),
        };
      }
      if (focus === 'target') {
        return {
          x: targetPos.x + (celX - this.SRC_USER.x),
          y: targetPos.y + (celY - this.SRC_USER.y),
        };
      }
    }

    // Last Resort (1051), Multi-Attack (1134), and Twineedle (7334) OppMove timelines authored charging aura around the Enemy (SRC_TARGET 384, 96)
    // with focus `target`, and the massive blast / multiple strikes around the Player (SRC_USER 128, 224) with focus `user`.
    // Re-anchor target cels to userPos and user cels to targetPos so the enemy charges and strikes the player.
    if (
      _isOppMove &&
      (String(definitionId) === '1051' ||
        String(definitionId) === '1134' ||
        String(definitionId) === '7334' ||
        String(definitionId) === '212')
    ) {
      if (focus === 'target') {
        return {
          x: userPos.x + (celX - this.SRC_TARGET.x),
          y: userPos.y + (celY - this.SRC_TARGET.y),
        };
      }
      if (focus === 'user') {
        return {
          x: targetPos.x + (celX - this.SRC_USER.x),
          y: targetPos.y + (celY - this.SRC_USER.y),
        };
      }
    }

    // Leer's OppMove timeline (345) authored glaring eyes in front of the Enemy (SRC_TARGET 384, 96)
    // but labeled with focus `both`. Re-anchor to userPos so the glaring eyes appear directly on the Enemy.
    if (_isOppMove && String(definitionId) === '345') {
      return {
        x: userPos.x + (celX - this.SRC_TARGET.x),
        y: userPos.y + (celY - this.SRC_TARGET.y),
      };
    }

    // Low Kick's OppMove timeline (6886) authored sweep effect around Player (SRC_USER 128, 224)
    // using mixed `both` and `screen` focus. Re-anchor to targetPos so the kick sweeps under the defending Player.
    if (_isOppMove && String(definitionId) === '6886') {
      return {
        x: targetPos.x + (celX - this.SRC_USER.x),
        y: targetPos.y + (celY - this.SRC_USER.y),
      };
    }

    // Night Daze OppMove (6911) authored charging dark energy around the Enemy (SRC_TARGET 384, 96)
    // and expanding shockwave pillars around the Player (SRC_USER 128, 224), both labeled with focus `both`.
    // Re-anchor celX > 256 to userPos (Enemy) and celX <= 256 to targetPos (Player).
    if (_isOppMove && String(definitionId) === '6911' && focus === 'both') {
      if (celX > 256) {
        return {
          x: userPos.x + (celX - this.SRC_TARGET.x),
          y: userPos.y + (celY - this.SRC_TARGET.y),
        };
      }
      return {
        x: targetPos.x + (celX - this.SRC_USER.x),
        y: targetPos.y + (celY - this.SRC_USER.y),
      };
    }

    // Noble Roar OppMove (6914) authored roar sound waves around the Enemy (SRC_TARGET 384, 96)
    // but labeled with focus `user`. Re-anchor using SRC_TARGET to userPos so sound waves emit from the Enemy.
    if (_isOppMove && String(definitionId) === '6914' && focus === 'user') {
      return {
        x: userPos.x + (celX - this.SRC_TARGET.x),
        y: userPos.y + (celY - this.SRC_TARGET.y),
      };
    }

    // Cross Poison / Noxious Torque OppMove (6917) authored poison slashes around the Player (SRC_USER 128, 224)
    // with focus `both`. Re-anchor using SRC_USER to targetPos so cross slashes strike the defending Player.
    if (_isOppMove && String(definitionId) === '6917' && focus === 'both') {
      return {
        x: targetPos.x + (celX - this.SRC_USER.x),
        y: targetPos.y + (celY - this.SRC_USER.y),
      };
    }

    // Poison Tail OppMove (6967) authored poison tail whip slashes and bubbles around Player (SRC_USER 128, 224)
    // with focus `target`. Re-anchor using SRC_USER to targetPos so all splash cels strike the defending Player.
    if (_isOppMove && String(definitionId) === '6967' && focus === 'target') {
      return {
        x: targetPos.x + (celX - this.SRC_USER.x),
        y: targetPos.y + (celY - this.SRC_USER.y),
      };
    }

    // Oblivion Wing OppMove (6919): the authored attacker flight (pat -1 / `user`) is data-only
    // because battler cels are not applied to the sprites, so the beam must connect the REAL
    // battlers. Interpolate the `both` beam cels along userPos (Enemy) -> targetPos (Player);
    // the cel angle in 6919.json matches that up-right diagonal.
    if (_isOppMove && String(definitionId) === '6919' && focus === 'both') {
      return this.transformPoint(
        this.SRC_USER,
        this.SRC_TARGET,
        userPos,
        targetPos,
        celX,
        celY,
        false
      );
    }

    // Leech Seed's OppMove timeline (6878) authored seed throw from Enemy (SRC_TARGET 384, 96)
    // to Player (SRC_USER 128, 224) but labeled with focus `user`. Transform points along
    // SRC_TARGET -> SRC_USER into userPos -> targetPos so the seed launches from the Enemy,
    // arcs across the field, and sprouts on the defending Player.
    if (_isOppMove && String(definitionId) === '6878') {
      // Add arc to seed trajectory to avoid straight diagonal line
      const startX = this.SRC_TARGET.x;
      const endX = this.SRC_USER.x;
      const progress = Math.max(0, Math.min(1, (startX - celX) / (startX - endX)));
      
      // Add upward arc to seed flight path (peak at 50% progress)
      const arcOffset = Math.sin(progress * Math.PI) * 30;
      
      const transformed = this.transformPoint(
        this.SRC_TARGET,
        this.SRC_USER,
        userPos,
        targetPos,
        celX,
        celY - arcOffset, // Apply arc offset
        true
      );
      
      return transformed;
    }

    // Octazooka OppMove (6925) authored ink splat cels around the defending Player (SRC_USER 128, 224)
    // with focus `user`. Re-anchor them using SRC_USER to targetPos so ink splatters on the Player.
    if (_isOppMove && String(definitionId) === '6925' && focus === 'user') {
      return {
        x: targetPos.x + (celX - this.SRC_USER.x),
        y: targetPos.y + (celY - this.SRC_USER.y),
      };
    }

    // Psycho Boost OppMove (6995) impact swirls (frames 32+) authored around Player (SRC_USER 128, 224)
    // with focus `user`. Re-anchor using SRC_USER to targetPos so swirls engulf the defending Player.
    if (_isOppMove && String(definitionId) === '6995' && focus === 'user') {
      return {
        x: targetPos.x + (celX - this.SRC_USER.x),
        y: targetPos.y + (celY - this.SRC_USER.y),
      };
    }

    // Throat Chop OppMove (7286 / 917) authored chop slashes around the Player (SRC_USER 128, 224)
    // with focus `user`. Re-anchor using SRC_USER to targetPos so slashes strike the defending Player.
    if (_isOppMove && (String(definitionId) === '7286' || String(definitionId) === '917') && focus === 'user' && celX <= 256) {
      return {
        x: targetPos.x + (celX - this.SRC_USER.x),
        y: targetPos.y + (celY - this.SRC_USER.y),
      };
    }

    // Twineedle OppMove (7334 / 212) has inverse focus tags in source:
    // frames 0..10 needles swirl around Enemy (SRC_TARGET 384, 96) labeled `target` -> re-anchor to userPos;
    // frames 11..22 needles strike Player (SRC_USER 128, 224) labeled `user` -> re-anchor to targetPos.
    if (_isOppMove && (String(definitionId) === '7334' || String(definitionId) === '212')) {
      if (focus === 'target') {
        return {
          x: userPos.x + (celX - this.SRC_TARGET.x),
          y: userPos.y + (celY - this.SRC_TARGET.y),
        };
      }
      if (focus === 'user') {
        return {
          x: targetPos.x + (celX - this.SRC_USER.x),
          y: targetPos.y + (celY - this.SRC_USER.y),
        };
      }
    }

    // Vacuum Wave OppMove (7346 / 615) authored vacuum swirls around the Enemy (SRC_TARGET 384, 96)
    // with focus `user`. Re-anchor relative to userPos using SRC_TARGET so ripples swirl around the Enemy user.
    if (_isOppMove && (String(definitionId) === '7346' || String(definitionId) === '615') && focus === 'user') {
      return {
        x: userPos.x + (celX - this.SRC_TARGET.x),
        y: userPos.y + (celY - this.SRC_TARGET.y),
      };
    }

    // Overheat OppMove (6935) authored expanding flame explosion around the Enemy (SRC_TARGET 384, 96)
    // with focus `both`. Re-anchor relative to userPos so the radial blast stays centered on the Enemy.
    if (_isOppMove && String(definitionId) === '6935' && focus === 'both') {
      return {
        x: userPos.x + (celX - this.SRC_TARGET.x),
        y: userPos.y + (celY - this.SRC_TARGET.y),
      };
    }

    // Overheat (6934 / 206) authored expanding flame explosion around the User (SRC_USER 128, 224)
    // with focus `both`. Re-anchor relative to userPos so the full 360-degree circular blast stays intact
    // and is not collapsed onto the 1D line between user and target.
    if ((String(definitionId) === '6934' || String(definitionId) === '206') && focus === 'both') {
      return {
        x: userPos.x + (celX - this.SRC_USER.x),
        y: userPos.y + (celY - this.SRC_USER.y),
      };
    }

    // Glare (6851), Heal Bell (435), Magic Coat (6890), Magnetic Flux (955), Mat Block (855),
    // Metal Burst (960), Metronome (6900), Mirror Coat (931), Mirror Move (1381), Obstruct (6921),
    // Quick Guard (7015 / 810), and Reflect (7029 / 109)
    // OppMove cels are authored around the enemy anchor (SRC_TARGET 384, 96)
    // but mislabeled with focus `target`. Re-anchor them to the actual enemy
    // attacker (`userPos`) so the self/shield effect appears on the enemy instead of the target.
    if (
      _isOppMove &&
      (String(definitionId) === '6851' ||
        String(definitionId) === '435' ||
        String(definitionId) === '6890' ||
        String(definitionId) === '955' ||
        String(definitionId) === '855' ||
        String(definitionId) === '960' ||
        String(definitionId) === '6900' ||
        String(definitionId) === '931' ||
        String(definitionId) === '1381' ||
        String(definitionId) === '6921' ||
        String(definitionId) === '7015' ||
        String(definitionId) === '810' ||
        String(definitionId) === '7029' ||
        String(definitionId) === '109' ||
        String(definitionId) === '7137' ||
        String(definitionId) === '681' ||
        String(definitionId) === '7112' ||
        String(definitionId) === '1088' ||
        String(definitionId) === '7170' ||
        String(definitionId) === '894' ||
        String(definitionId) === '7180' ||
        String(definitionId) === '113' ||
        String(definitionId) === '318' ||
        String(definitionId) === '7217' ||
        String(definitionId) === '1296' ||
        String(definitionId) === '7221' ||
        String(definitionId) === '498' ||
        String(definitionId) === '7237' ||
        String(definitionId) === '962' ||
        String(definitionId) === '7250' ||
        String(definitionId) === '486' ||
        String(definitionId) === '7262' ||
        String(definitionId) === '215') &&
      focus === 'target'
    ) {
      return {
        x: userPos.x + (celX - this.SRC_TARGET.x),
        y: userPos.y + (celY - this.SRC_TARGET.y),
      };
    }

    // Heart Stamp (466), Mega Kick (6895), Megahorn (339), Nuzzle (6915), and Take Down (7258) OppMove projectile/impact cels
    // are authored around the source USER anchor (SRC_USER 128, 224) with focus `target`.
    // Re-anchor them using SRC_USER so the attack cleanly strikes the real target (player).
    if (
      _isOppMove &&
      (String(definitionId) === '466' ||
        String(definitionId) === '6895' ||
        String(definitionId) === '339' ||
        String(definitionId) === '6915' ||
        String(definitionId) === '7258' ||
        String(definitionId) === '184') &&
      focus === 'target'
    ) {
      return {
        x: targetPos.x + (celX - this.SRC_USER.x),
        y: targetPos.y + (celY - this.SRC_USER.y),
      };
    }

    // Gear Up (1103) and Rapid Spin (7021 / 493) are self-centered spinning/orbiting moves whose cels
    // are authored around the user anchor (128, 224) with focus `both`. Re-anchor them directly
    // to userPos so the horizontal expansion / orbit stays centered on the acting Pokémon.
    if (
      (String(definitionId) === '1103' ||
        String(definitionId) === '7021' ||
        String(definitionId) === '493') &&
      focus === 'both'
    ) {
      return {
        x: userPos.x + (celX - this.SRC_USER.x),
        y: userPos.y + (celY - this.SRC_USER.y),
      };
    }

    // Fell Stinger OppMove contains a stray impact cel outside the source
    // stage. Re-anchor that cel to the real target while leaving the normal
    // target-focused strike cels untouched.
    if (
      String(definitionId) === '1025' &&
      focus === 'target' &&
      celX > this.SRC_WIDTH
    ) {
      celX = this.SRC_TARGET.x;
      celY = this.SRC_TARGET.y;
    }

    // Dragon Claw uses three 192px atlas cells for the claw slashes, but the
    // imported source places their anchors only 16-64px apart. Spread the
    // authored offsets around the middle slash so the three effects remain
    // visually distinct instead of covering one another.
    if (String(definitionId) === '6816' || String(definitionId) === '6817') {
      const anchor = String(definitionId) === '6816' ? { x: 416, y: 88 } : { x: 416, y: 216 };
      const spread = 1.35;
      celX = anchor.x + (celX - anchor.x) * spread;
      celY = anchor.y + (celY - anchor.y) * spread;
    }

    // Eruption contains oversized flame cells whose imported source
    // coordinates leave the 512x384 stage. Keep the frame sequence intact,
    // but constrain only this move to a safe source area.
    if (
      focus === 'both' &&
      (String(definitionId) === '6825' || String(definitionId) === '6826')
    ) {
      celX = Math.max(64, Math.min(this.SRC_WIDTH - 64, celX));
      celY = Math.max(32, Math.min(this.SRC_HEIGHT - 32, celY));
    }

    // Flame Burst's imported embers are authored on a perfectly straight
    // diagonal. Add a shared arc plus a small deterministic lane offset so
    // the individual flames travel as a loose burst instead of a rigid line.
    if (
      focus === 'both' &&
      (String(definitionId) === '386' || String(definitionId) === '387')
    ) {
      // The OppMove source continues past the target after its impact frames
      // (x=480..500 after mirroring). Clamp the virtual flight path so the
      // rendered burst finishes on the real target instead of overshooting
      // the Player's battler.
      celX = Math.max(this.SRC_USER.x, Math.min(this.SRC_TARGET.x, celX));
      const progress = Math.max(0, Math.min(1, (celX - this.SRC_USER.x) / 256));
      const arcOffset = Math.sin(progress * Math.PI) * 34;
      const laneOffset = ((Math.abs(Math.round(celX * 3 + celY * 7)) % 3) - 1) * 14;
      celY -= arcOffset + laneOffset;
    }

    // Leech Seed (6877 / 179), Magical Leaf (437 / 438), Petal Dance (6947 / 6948 / 144 / 145),
    // Powder Snow (6973), Power Swap (6976 / 6977), Precipice Blades (6982),
    // Psycho Boost (6994 / 6995 / 1075 / 1076), Psycho Cut (6996 / 6997 / 323 / 324), Psywave (7001 / 7002 / 716 / 717),
    // Purify (7005 / 7006 / 983 / 984), Pursuit (7007 / 7008 / 577 / 578), Pyro Ball (7009 / 7010 / 1287 / 1288),
    // and Shattered Psyche (7011 / 1196)
    // have authored particles flying in curved arcs and clusters. Always preserve vertical curve offsets
    // so they do not collapse onto a rigid diagonal line.
    if (
      (String(definitionId) === '6877' ||
        String(definitionId) === '179' ||
        String(definitionId) === '437' ||
        String(definitionId) === '438' ||
        String(definitionId) === '6947' ||
        String(definitionId) === '6948' ||
        String(definitionId) === '144' ||
        String(definitionId) === '145' ||
        String(definitionId) === '6973' ||
        String(definitionId) === '6976' ||
        String(definitionId) === '6977' ||
        String(definitionId) === '6982' ||
        String(definitionId) === '1075' ||
        String(definitionId) === '1076' ||
        String(definitionId) === '6994' ||
        String(definitionId) === '6995' ||
        String(definitionId) === '323' ||
        String(definitionId) === '324' ||
        String(definitionId) === '6996' ||
        String(definitionId) === '6997' ||
        String(definitionId) === '716' ||
        String(definitionId) === '717' ||
        String(definitionId) === '7001' ||
        String(definitionId) === '7002' ||
        String(definitionId) === '983' ||
        String(definitionId) === '984' ||
        String(definitionId) === '7005' ||
        String(definitionId) === '7006' ||
        String(definitionId) === '577' ||
        String(definitionId) === '578' ||
        String(definitionId) === '7007' ||
        String(definitionId) === '7008' ||
        String(definitionId) === '1287' ||
        String(definitionId) === '1288' ||
        String(definitionId) === '7009' ||
        String(definitionId) === '7010' ||
        String(definitionId) === '1196' ||
        String(definitionId) === '7011' ||
        String(definitionId) === '1389' ||
        String(definitionId) === '7025' ||
        String(definitionId) === '205' ||
        String(definitionId) === '206' ||
        String(definitionId) === '7055' ||
        String(definitionId) === '7056' ||
        String(definitionId) === '482' ||
        String(definitionId) === '483' ||
        String(definitionId) === '7092' ||
        String(definitionId) === '7093' ||
        String(definitionId) === '192' ||
        String(definitionId) === '193' ||
        String(definitionId) === '7145' ||
        String(definitionId) === '7146' ||
        String(definitionId) === '7211' ||
        String(definitionId) === '7212' ||
        String(definitionId) === '904' ||
        String(definitionId) === '905' ||
        String(definitionId) === '7240' ||
        String(definitionId) === '7241' ||
        String(definitionId) === '326' ||
        String(definitionId) === '327' ||
        String(definitionId) === '7192' ||
        String(definitionId) === '7193' ||
        String(definitionId) === '7259' ||
        String(definitionId) === '7260') &&
      focus === 'both'
    ) {
      preserveCurve = true;
    }

    // A few source timelines (notably Swords Dance, Bulk Up, and Dragon Dance) were authored
    // with target-focused cels even though the move targets its user. Resolve
    // only that focus against the user at runtime.
    if ((selfTarget || String(definitionId) === '330') && focus === 'target') {
      const selfAuthoredAtUser = ['494', '585', '6704'].includes(String(definitionId));
      const selfAnchor = selfAuthoredAtUser ? this.SRC_USER : this.SRC_TARGET;

      // Howl's legacy timeline (585) is authored left-to-right for the Player.
      // When the Enemy uses the same timeline, reverse only its horizontal
      // offset so the self-buff remains attached to the Enemy and does not
      // move off the right edge of the battle viewport.
      if (isEnemy && String(definitionId) === '585' && selfAuthoredAtUser) {
        return {
          x: userPos.x - (celX - selfAnchor.x),
          y: userPos.y + (celY - selfAnchor.y),
        };
      }

      return {
        x: userPos.x + (celX - selfAnchor.x),
        y: userPos.y + (celY - selfAnchor.y),
      };
    }

    switch (focus) {
      case 'user': {
        const authoredUserAnchor =
          _isOppMove &&
          (String(definitionId) === '7069' ||
            String(definitionId) === '534' ||
            String(definitionId) === '7158' ||
            String(definitionId) === '942' ||
            String(definitionId) === '7195' ||
            String(definitionId) === '948' ||
            String(definitionId) === '7193')
            ? this.SRC_TARGET
            : this.SRC_USER;
        return {
          x: userPos.x + (celX - authoredUserAnchor.x),
          y: userPos.y + (celY - authoredUserAnchor.y),
        };
      }
      case 'target': {
        // A subset of imported OppMove timelines (for example
        // All-Out Pummeling) labels the target cel but stores its source
        // coordinates around the player anchor (128, 224). Keep the cel
        // attached to the real target while using the authored anchor.
        const authoredTargetAnchor =
          _isOppMove &&
          ((celX <= 256 && celY >= 140) ||
            String(definitionId) === '7083' ||
            String(definitionId) === '226')
            ? this.SRC_USER
            : this.SRC_TARGET;
        return {
          x: targetPos.x + (celX - authoredTargetAnchor.x),
          y: targetPos.y + (celY - authoredTargetAnchor.y),
        };
      }
      case 'both': {
        // OppMove timelines authored from SRC_TARGET (384, 96) down to SRC_USER (128, 224):
        // Psybeam (6989 / rx 628), Quick Attack (7013 / rx 220), Razor Leaf (7023 / rx 390),
        // Reflect Type (7031 / rx 1041), Reversal (7042 / rx 675), Roar (7045 / rx 372),
        // Rock Blast (7048 / rx 450), Rock Smash (7054 / rx 305), Rock Throw (7056 / rx 206),
        // Rock Wrecker (7059 / rx 753), Rollout (7065 / rx 570),
        // Sacred Fire (7071 / rx 862), Sacred Sword (7073 / rx 457), Sand Attack (7076 / rx 392),
        // Scald (7080 / rx 613), Screech (7087 / rx 332), Secret Sword (7091 / rx 1043),
        // Seed Bomb (7093 / rx 483), Seismic Toss (7096 / rx 620), Shadow Ball (7099 / rx 105),
        // Shadow Bone (7101 / rx 1080), and Shadow Sneak (7106 / rx 507).
        // For enemy casting, the trajectory starts at SRC_TARGET and ends at SRC_USER.
        if (
          _isOppMove &&
          (String(definitionId) === '6989' ||
            String(definitionId) === '628' ||
            String(definitionId) === '7013' ||
            String(definitionId) === '220' ||
            String(definitionId) === '7023' ||
            String(definitionId) === '390' ||
            String(definitionId) === '7031' ||
            String(definitionId) === '1041' ||
            String(definitionId) === '7042' ||
            String(definitionId) === '675' ||
            String(definitionId) === '7045' ||
            String(definitionId) === '372' ||
            String(definitionId) === '7048' ||
            String(definitionId) === '450' ||
            String(definitionId) === '7054' ||
            String(definitionId) === '305' ||
            String(definitionId) === '7056' ||
            String(definitionId) === '206' ||
            String(definitionId) === '7059' ||
            String(definitionId) === '753' ||
            String(definitionId) === '7065' ||
            String(definitionId) === '570' ||
            String(definitionId) === '7071' ||
            String(definitionId) === '862' ||
            String(definitionId) === '7073' ||
            String(definitionId) === '457' ||
            String(definitionId) === '7076' ||
            String(definitionId) === '392' ||
            String(definitionId) === '7080' ||
            String(definitionId) === '613' ||
            String(definitionId) === '7087' ||
            String(definitionId) === '332' ||
            String(definitionId) === '7091' ||
            String(definitionId) === '1043' ||
            String(definitionId) === '7093' ||
            String(definitionId) === '483' ||
            String(definitionId) === '7096' ||
            String(definitionId) === '620' ||
            String(definitionId) === '7099' ||
            String(definitionId) === '105' ||
            String(definitionId) === '7101' ||
            String(definitionId) === '1080' ||
            String(definitionId) === '7106' ||
            String(definitionId) === '507' ||
            String(definitionId) === '7118' ||
            String(definitionId) === '147' ||
            String(definitionId) === '7121' ||
            String(definitionId) === '796' ||
            String(definitionId) === '7123' ||
            String(definitionId) === '177' ||
            String(definitionId) === '7133' ||
            String(definitionId) === '967' ||
            String(definitionId) === '7144' ||
            String(definitionId) === '308' ||
            String(definitionId) === '7146' ||
            String(definitionId) === '193' ||
            String(definitionId) === '7150' ||
            String(definitionId) === '527' ||
            String(definitionId) === '7152' ||
            String(definitionId) === '986' ||
            String(definitionId) === '7168' ||
            String(definitionId) === '988' ||
            String(definitionId) === '7174' ||
            String(definitionId) === '1112' ||
            String(definitionId) === '7178' ||
            String(definitionId) === '402' ||
            String(definitionId) === '7184' ||
            String(definitionId) === '1091' ||
            String(definitionId) === '7186' ||
            String(definitionId) === '880' ||
            String(definitionId) === '7212' ||
            String(definitionId) === '905' ||
            String(definitionId) === '7229' ||
            String(definitionId) === '254' ||
            String(definitionId) === '7235' ||
            String(definitionId) === '151' ||
            String(definitionId) === '7241' ||
            String(definitionId) === '327' ||
            String(definitionId) === '7193' ||
            String(definitionId) === '7340' ||
            String(definitionId) === '7344' ||
            String(definitionId) === '7358' ||
            String(definitionId) === '617' ||
            String(definitionId) === '7360')
        ) {
          return this.transformPoint(
            this.SRC_TARGET,
            this.SRC_USER,
            userPos,
            targetPos,
            celX,
            celY,
            preserveCurve
          );
        }

        return this.transformPoint(
          this.SRC_USER,
          this.SRC_TARGET,
          userPos,
          targetPos,
          celX,
          celY,
          preserveCurve
        );
      }
      case 'screen':
      default: {
        // Fissure (1072), Heat Wave (6860 / 6861), Relic Song (7033), Retaliate (7035 / 7036), and Roar of Time (7046)
        // are authored as full-stage battle backdrops/overlays designed to cover the entire field above the message box.
        // In our 512×288 widescreen viewport, scaling y by 288/384 (0.75) compresses the backdrop into
        // the top 216px, leaving the bottom 72px uncovered. Map them directly against 512×288 viewport
        // so they seamlessly cover the entire battle screen from top to bottom.
        if (
          String(definitionId) === '1072' ||
          String(definitionId) === '6860' ||
          String(definitionId) === '6861' ||
          String(definitionId) === '7033' ||
          String(definitionId) === '7035' ||
          String(definitionId) === '7036' ||
          String(definitionId) === '7046'
        ) {
          const scaleX = viewport.width / this.DEFAULT_CANVAS_WIDTH;
          const scaleY = viewport.height / this.DEFAULT_CANVAS_HEIGHT;
          return {
            x: viewport.x + celX * scaleX,
            y: viewport.y + celY * scaleY,
          };
        }

        const scaleX = viewport.width / this.SRC_WIDTH;
        const scaleY = viewport.height / this.SRC_HEIGHT;
        return {
          x: viewport.x + celX * scaleX,
          y: viewport.y + celY * scaleY,
        };
      }
    }
  }
}
