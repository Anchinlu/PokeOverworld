/**
 * Battle Atmosphere & Environmental Dimming Manager.
 * Replicates Elite Battle: DX (EBDX v1.4.7.1) fp["bg"] atmosphere coloring and defocus vignette.
 *
 * In EBDX:
 * - Move animations create an fp["bg"] viewport overlay behind battlers and particles.
 * - Colors match the elemental theme (e.g. Color.new(66, 60, 81) for Dark/Bite, Color.new(130, 52, 42) for Fire).
 * - Fades in smoothly during initial frames, sustains during attack impact, and fades out cleanly.
 * - Adds a subtle edge vignette (defocus) to focus the eye onto battlers and particle choreography.
 *
 * NOTE: Strictly rendered on the canvas layer beneath the UI — preserves 100% of custom UI.
 */

export interface AtmosphereTheme {
  r: number;
  g: number;
  b: number;
  maxAlpha: number;
}

/**
 * Authentic EBDX-matched elemental atmosphere color presets.
 */
export const TYPE_ATMOSPHERE_THEMES: Record<string, AtmosphereTheme> = {
  // EBDX signature move tints (Reunion 4.2 Move Animations)
  dark: { r: 66, g: 60, b: 81, maxAlpha: 0.62 }, // Exact EBDX Color.new(66, 60, 81) from Bite, Crunch, Dark Pulse
  ghost: { r: 55, g: 45, b: 78, maxAlpha: 0.60 }, // EBDX astral twilight
  fire: { r: 130, g: 52, b: 42, maxAlpha: 0.58 }, // Exact EBDX Color.new(130, 52, 42) from Fire Blast, Ember
  electric: { r: 25, g: 28, b: 58, maxAlpha: 0.60 }, // Thunderstorm midnight
  water: { r: 20, g: 55, b: 95, maxAlpha: 0.56 }, // Abyssal deep blue
  ice: { r: 30, g: 70, b: 105, maxAlpha: 0.56 }, // Glacial frozen cyan-navy
  grass: { r: 25, g: 60, b: 32, maxAlpha: 0.54 }, // Canopy forest shade
  poison: { r: 65, g: 28, b: 70, maxAlpha: 0.60 }, // Toxic miasma dark violet
  ground: { r: 75, g: 55, b: 35, maxAlpha: 0.56 }, // Earth tremor amber-brown
  rock: { r: 70, g: 55, b: 40, maxAlpha: 0.54 }, // Granite quarry
  psychic: { r: 85, g: 30, b: 80, maxAlpha: 0.58 }, // Cosmic psionic magenta
  fairy: { r: 80, g: 35, b: 75, maxAlpha: 0.54 }, // Pixie astral violet
  dragon: { r: 40, g: 25, b: 70, maxAlpha: 0.60 }, // Wyrm astral navy
  steel: { r: 40, g: 45, b: 52, maxAlpha: 0.54 }, // Metallic slate
  fighting: { r: 55, g: 32, b: 28, maxAlpha: 0.58 }, // Dojo crimson-graphite
  flying: { r: 35, g: 45, b: 60, maxAlpha: 0.52 }, // Gale sky navy
  bug: { r: 38, g: 58, b: 25, maxAlpha: 0.52 }, // Swarm moss
  normal: { r: 35, g: 35, b: 38, maxAlpha: 0.50 }, // Neutral cinematic dim
};

const DEFAULT_THEME: AtmosphereTheme = { r: 25, g: 25, b: 30, maxAlpha: 0.50 };

export class BattleAtmosphereManager {
  private currentAlpha = 0;
  private targetAlpha = 0;
  private currentTheme: AtmosphereTheme = DEFAULT_THEME;

  /**
   * Resets atmosphere state to neutral.
   */
  public reset(): void {
    this.currentAlpha = 0;
    this.targetAlpha = 0;
    this.currentTheme = DEFAULT_THEME;
  }

  /**
   * Resolves the theme for a given move type.
   */
  public getTheme(moveType?: string): AtmosphereTheme {
    if (!moveType) return DEFAULT_THEME;
    const cleanType = moveType.toLowerCase().trim();
    return TYPE_ATMOSPHERE_THEMES[cleanType] ?? DEFAULT_THEME;
  }

  /**
   * Computes the current atmosphere alpha based on animation duration progress (0.0 to 1.0).
   * Follows EBDX envelope: smooth fade-in (16%), sustain (60%), smooth fade-out (24%).
   */
  public computeAlphaFromProgress(progress: number, maxAlpha: number): number {
    const p = Math.max(0, Math.min(1, progress));
    if (p < 0.16) {
      // Fade in smoothly with quadratic ease-out
      const t = p / 0.16;
      return t * (2 - t) * maxAlpha;
    } else if (p < 0.76) {
      // Sustain peak atmosphere
      return maxAlpha;
    } else {
      // Fade out smoothly with quadratic ease-in
      const t = (p - 0.76) / 0.24;
      return (1 - t * t) * maxAlpha;
    }
  }

  /**
   * Updates atmosphere state per frame.
   */
  public update(isPlaying: boolean, moveType?: string, progress = 0): void {
    if (isPlaying) {
      this.currentTheme = this.getTheme(moveType);
      this.targetAlpha = this.computeAlphaFromProgress(progress, this.currentTheme.maxAlpha);
    } else {
      this.targetAlpha = 0;
    }

    // Smooth lerp transition
    this.currentAlpha += (this.targetAlpha - this.currentAlpha) * 0.25;
    if (this.currentAlpha < 0.005) {
      this.currentAlpha = 0;
    }
  }

  /**
   * Renders the atmospheric dimming layer and defocus vignette behind battlers.
   * This sits immediately above the environment background/bases and behind the Pokémon.
   */
  public renderBehind(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    isPlaying: boolean,
    moveType?: string,
    progress = 0
  ): void {
    this.update(isPlaying, moveType, progress);

    if (this.currentAlpha <= 0.005) return;

    ctx.save();

    // 1. Full-screen atmospheric color tint (EBDX fp["bg"])
    const { r, g, b } = this.currentTheme;
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.currentAlpha.toFixed(3)})`;
    ctx.fillRect(0, 0, width, height);

    // 2. Defocus Vignette (EBDX @sprites["battlebg"].defocus)
    // Soft radial dark vignette framing the arena to focus eye on the center
    const cx = width / 2;
    const cy = height / 2;
    const innerRadius = width * 0.25;
    const outerRadius = width * 0.65;
    const vignetteGrad = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
    vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignetteGrad.addColorStop(1, `rgba(0, 0, 0, ${(this.currentAlpha * 0.45).toFixed(3)})`);

    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }

  public getCurrentAlpha(): number {
    return this.currentAlpha;
  }

  public getCurrentTheme(): AtmosphereTheme {
    return this.currentTheme;
  }
}

export const battleAtmosphereManager = new BattleAtmosphereManager();
