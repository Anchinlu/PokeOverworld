import type { AnimationCel, BattleAnimationDefinition } from './types';

const SOURCE_USER = { x: 128, y: 224 };
const SOURCE_TARGET = { x: 384, y: 96 };

function createEnergyBallCel(
  pattern: number,
  x: number,
  y: number,
  zoom: number,
  focus: AnimationCel['focus']
): AnimationCel {
  return {
    pattern,
    x,
    y,
    zoomX: zoom,
    zoomY: zoom,
    angle: 0,
    mirror: false,
    opacity: 255,
    blendMode: 'additive',
    visible: true,
    priority: 1,
    focus,
  };
}

/**
 * The imported Energy Ball timeline only contained a target-side impact.
 * Keep the original atlas, but author the projectile path explicitly so the
 * same correction is used by the real battle and the visual QA gallery.
 */
export function createEnergyBallAnimationOverride(): BattleAnimationDefinition {
  const frameCount = 10;
  const frames = Array.from({ length: frameCount }, (_, index) => {
    const progress = index / (frameCount - 1);
    const x = SOURCE_USER.x + (SOURCE_TARGET.x - SOURCE_USER.x) * progress;
    const y = SOURCE_USER.y + (SOURCE_TARGET.y - SOURCE_USER.y) * progress;
    const zoom = 70 + 30 * progress;

    return {
      cels: [
        createEnergyBallCel(-1, SOURCE_USER.x, SOURCE_USER.y, 100, 'user'),
        createEnergyBallCel(-2, SOURCE_TARGET.x, SOURCE_TARGET.y, 100, 'target'),
        createEnergyBallCel(index, x, y, zoom, 'both'),
      ],
    };
  });

  return {
    id: '98',
    name: 'Move:ENERGYBALL',
    graphic: 'fly copy',
    hue: 0,
    position: 1,
    fps: 20,
    frames,
    timings: [],
  };
}

function createEruptionCel(
  pattern: number,
  x: number,
  y: number,
  focus: AnimationCel['focus'],
  zoom = 100,
  curve: AnimationCel['curve'] = undefined
): AnimationCel {
  return {
    pattern,
    x,
    y,
    zoomX: zoom,
    zoomY: zoom,
    angle: 0,
    mirror: false,
    opacity: 255,
    blendMode: 'normal',
    visible: true,
    priority: 1,
    focus,
    curve,
  };
}

/**
 * Rebuilds Eruption from the atlas' actual volcano fragments:
 * 1) eruption at the user, 2) rocks/lava travelling on an arc,
 * 3) flames and fragments falling onto the target.
 */
export function createEruptionAnimationOverride(id: string, name: string): BattleAnimationDefinition {
  const frames: BattleAnimationDefinition['frames'] = [];

  for (let frame = 0; frame < 4; frame += 1) {
    frames.push({
      cels: [
        createEruptionCel(9, SOURCE_USER.x, SOURCE_USER.y, 'user', 105 + frame * 8),
        createEruptionCel(5 + (frame % 4), SOURCE_USER.x - 24, SOURCE_USER.y + 12, 'user', 75),
      ],
    });
  }

  for (let frame = 0; frame < 14; frame += 1) {
    const progress = 0.08 + (frame / 13) * 0.72;
    const x = SOURCE_USER.x + (SOURCE_TARGET.x - SOURCE_USER.x) * progress;
    const lineY = SOURCE_USER.y + (SOURCE_TARGET.y - SOURCE_USER.y) * progress;
    const arcY = lineY - Math.sin(progress * Math.PI) * 112;
    frames.push({
      cels: [
        createEruptionCel(frame % 5, x, arcY, 'both', 78, 'arc'),
        createEruptionCel(5 + ((frame + 1) % 4), x - 20, arcY + 22, 'both', 62, 'arc'),
        createEruptionCel(9, x + 18, arcY + 34, 'both', 72, 'arc'),
      ],
    });
  }

  for (let frame = 0; frame < 8; frame += 1) {
    const impactScale = 80 + Math.min(frame, 4) * 10;
    frames.push({
      cels: [
        createEruptionCel(9, SOURCE_TARGET.x, SOURCE_TARGET.y, 'target', impactScale),
        createEruptionCel(frame % 5, SOURCE_TARGET.x - 34, SOURCE_TARGET.y + 22, 'target', 72),
        createEruptionCel(5 + ((frame + 2) % 4), SOURCE_TARGET.x + 30, SOURCE_TARGET.y + 18, 'target', 64),
      ],
    });
  }

  return {
    id,
    name,
    graphic: 'PRAS- Eruption.png',
    hue: 0,
    position: 1,
    fps: 20,
    frames,
    timings: [],
  };
}

export const ANIMATION_OVERRIDES: Readonly<Record<string, BattleAnimationDefinition>> = {
  '98': createEnergyBallAnimationOverride(),
  '6825': createEruptionAnimationOverride('6825', 'Move:ERUPTION'),
  '6826': createEruptionAnimationOverride('6826', 'OppMove:ERUPTION'),
};

/**
 * Removes a duplicated projectile stream imported in Astral Barrage.
 * The source timeline adds a second path around (268, 118) from frame 19,
 * producing the extra orb reported in the gallery.
 */
export function isKnownDuplicateAnimationCel(
  definitionId: string | number,
  cel: Pick<AnimationCel, 'focus' | 'x' | 'y' | 'pattern'>
): boolean {
  // The imported OppMove Fell Stinger timeline contains an invalid extra
  // cel (pattern 27) at x=663, outside the 512px source stage. Re-anchoring
  // that cel makes a large slash appear at the wrong moment, so omit it.
  if (String(definitionId) === '1025' && cel.pattern === 27) {
    return true;
  }

  // Hydro Cannon OppMove repeats its fixed source splash (pattern 8 at
  // 378,100) on every frame in addition to the travelling stream. The
  // travelling cels already contain the visible cannon effect.
  if (
    String(definitionId) === '1063' &&
    cel.pattern === 8 &&
    cel.x === 378 &&
    cel.y === 100
  ) {
    return true;
  }

  return (
    String(definitionId) === '1343' &&
    cel.focus === 'both' &&
    cel.x >= 260 &&
    cel.x <= 275 &&
    cel.y >= 115 &&
    cel.y <= 121
  );
}

/** Preserve the authored vertical offsets of Blast Burn's ground eruptions, Leech Seed's arc flight, etc. */
export function shouldPreserveAnimationCurve(
  definitionId: string | number,
  cel: Pick<AnimationCel, 'focus' | 'curve'>
): boolean {
  const idStr = String(definitionId);
  return (
    ((idStr === '66' ||
      idStr === '803' ||
      idStr === '804' ||
      idStr === '386' ||
      idStr === '387' ||
      idStr === '792' ||
      idStr === '6877' ||
      idStr === '179' ||
      idStr === '437' ||
      idStr === '438' ||
      idStr === '1386' ||
      idStr === '6937' || // Parabolic Charge (electric wave)
      idStr === '333' ||
      idStr === '6940' || // Pay Day PL (raining coins)
      idStr === '334' ||
      idStr === '6941' || // Pay Day OPP (raining coins)
      idStr === '145' ||
      idStr === '6948' || // Petal Dance OPP (swirling petals)
      idStr === '1118' ||
      idStr === '6954' || // Plasma Fists (spherical electric blast)
      idStr === '624' ||
      idStr === '6973' || // Powder Snow (wide snowfall)
      idStr === '826' ||
      idStr === '6976' || // Power Swap PL (dual energy streams)
      idStr === '827' ||
      idStr === '6977' || // Power Swap OPP (dual energy streams)
      idStr === '1388' ||
      idStr === '6982' || // Precipice Blades (earthen spike cluster)
      idStr === '1075' ||
      idStr === '1076' ||
      idStr === '6994' ||
      idStr === '6995' || // Psycho Boost
      idStr === '323' ||
      idStr === '324' ||
      idStr === '6996' ||
      idStr === '6997' || // Psycho Cut
      idStr === '716' ||
      idStr === '717' ||
      idStr === '7001' ||
      idStr === '7002' || // Psywave
      idStr === '983' ||
      idStr === '984' ||
      idStr === '7005' ||
      idStr === '7006' || // Purify
      idStr === '577' ||
      idStr === '578' ||
      idStr === '7007' ||
      idStr === '7008' || // Pursuit
      idStr === '1287' ||
      idStr === '1288' ||
      idStr === '7009' ||
      idStr === '7010' || // Pyro Ball
      idStr === '1196' ||
      idStr === '7011') && // Shattered Psyche
      cel.focus === 'both') ||
    cel.curve === 'arc'
  );
}

/** Removes identical layered cels from the imported Beak Blast projectile. */
export function deduplicateAnimationCels(
  definitionId: string | number,
  cels: readonly AnimationCel[]
): AnimationCel[] {
  if (String(definitionId) !== '1097') return [...cels];

  const seen = new Set<string>();
  return cels.filter((cel) => {
    if (cel.pattern !== 15 || cel.focus !== 'both') return true;
    const key = `${cel.pattern}:${cel.x}:${cel.y}:${cel.zoomX}:${cel.zoomY}:${cel.opacity}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
