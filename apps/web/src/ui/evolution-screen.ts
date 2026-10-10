/**
 * Evolution Screen & Sequence Controller
 * Renders the dramatic retro evolution sequence based on canonical Pokémon mechanics:
 * 1. Pre-evolved Pokémon appears in the lower section.
 * 2. Body glows and transforms into a radiant sphere of light, floating up to the screen center.
 * 3. Alternating morphing: Pre-evolution and Evolved form rapidly alternate back and forth with increasing tempo.
 * 4. Supernova burst: The sphere opens up with a radiant flash of light.
 * 5. Restoration: Evolved form revealed in full color, plays species cry and victory fanfare!
 */

import type { PartyPokemon } from '../domain/party/party-state';
import { POKEMON_ASSETS } from '../assets';
import { battleSePlayer } from '../audio';
import { applyEvolution, type EvolutionRequirement } from '../domain/pokemon/evolution-rules';
import { partyService } from '../domain/party/party-service';
import { showBerryToast } from './toast';

export type EvolutionPhase =
  | 'intro'
  | 'glowing_ascending'
  | 'morphing'
  | 'burst'
  | 'revealed'
  | 'done';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export class EvolutionScreen {
  private static instance: EvolutionScreen | null = null;
  private overlayEl: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private messageTextEl: HTMLElement | null = null;
  private actionBtnEl: HTMLButtonElement | null = null;

  private isRunning = false;
  private animFrameId: number | null = null;
  private startTime = 0;
  private phaseStartTime = 0;
  private phase: EvolutionPhase = 'intro';

  private currentPokemon: PartyPokemon | null = null;
  private evolutionReq: EvolutionRequirement | null = null;
  private onCompleteCallback?: () => void;

  // Preloaded sprite images
  private preEvoImg: HTMLImageElement | null = null;
  private evoImg: HTMLImageElement | null = null;

  // Animation coordinates
  private posX = 256;
  private posY = 255;
  private startY = 255;
  private targetY = 160;
  private hasLanded = false;

  // Particle pool
  private particles: Particle[] = [];

  // Web Audio Synth for dramatic chimes
  private audioCtx: AudioContext | null = null;
  private evolutionAudio: HTMLAudioElement | null = null;

  private constructor() {
    this.createDom();
  }

  public static getInstance(): EvolutionScreen {
    if (!EvolutionScreen.instance) {
      EvolutionScreen.instance = new EvolutionScreen();
    }
    return EvolutionScreen.instance;
  }

  private createDom(): void {
    if (document.getElementById('evolutionScreenOverlay')) return;

    this.overlayEl = document.createElement('div');
    this.overlayEl.id = 'evolutionScreenOverlay';
    this.overlayEl.className = 'evolution-screen-overlay';
    this.overlayEl.style.display = 'none';

    this.overlayEl.innerHTML = `
      <div class="evolution-screen-frame">
        <!-- Authentic Background GIF -->
        <img class="evolution-bg-img" src="/Graphics/Evolution/evolution_bg.gif" alt="Evolution Background" />

        <!-- Canvas for sprites, light spheres, morphing and particle vfx -->
        <canvas id="evolutionCanvas" class="evolution-canvas" width="512" height="384"></canvas>

        <!-- Retro Bottom Dialogue Message Box -->
        <div class="evolution-message-box" id="evolutionMessageBox">
          <div class="evolution-message-content">
            <span class="evolution-prompt-arrow">▶</span>
            <span class="evolution-message-text" id="evolutionMessageText">Đang chuẩn bị tiến hóa...</span>
          </div>
          <button class="evolution-action-btn" id="btnEvolutionAction" style="display: none;">
            TIẾP TỤC
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlayEl);

    this.canvas = this.overlayEl.querySelector<HTMLCanvasElement>('#evolutionCanvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }
    this.messageTextEl = this.overlayEl.querySelector<HTMLElement>('#evolutionMessageText');
    this.actionBtnEl = this.overlayEl.querySelector<HTMLButtonElement>('#btnEvolutionAction');

    this.actionBtnEl?.addEventListener('click', () => {
      this.finishAndClose();
    });

    // Also clicking dialogue box when revealed finishes evolution
    this.overlayEl.querySelector('#evolutionMessageBox')?.addEventListener('click', () => {
      if (this.phase === 'revealed') {
        this.finishAndClose();
      }
    });
  }

  /**
   * Launches the full Evolution sequence.
   */
  public open(
    pokemon: PartyPokemon,
    evolution: EvolutionRequirement,
    onComplete?: () => void
  ): void {
    this.currentPokemon = pokemon;
    this.evolutionReq = evolution;
    this.onCompleteCallback = onComplete;
    this.isRunning = true;
    this.phase = 'intro';
    this.particles = [];
    this.hasLanded = false;

    const preEvoSpeciesKey = pokemon.speciesKey;
    const evoSpeciesKey = evolution.targetSpeciesKey;

    // Preload sprites
    this.preEvoImg = new Image();
    this.preEvoImg.src = POKEMON_ASSETS.getFrontSprite(preEvoSpeciesKey, pokemon.isShiny);

    this.evoImg = new Image();
    this.evoImg.src = POKEMON_ASSETS.getFrontSprite(evoSpeciesKey, pokemon.isShiny);

    // Initial position
    this.posX = 256;
    this.posY = this.startY;

    if (this.overlayEl) {
      this.overlayEl.style.display = 'flex';
    }
    if (this.actionBtnEl) {
      this.actionBtnEl.style.display = 'none';
    }

    const pokemonName = pokemon.nickname || pokemon.name;
    this.setMessage(`Ồ? ${pokemonName} đang có điều gì đó kỳ lạ xảy ra...`);

    // Play authentic evolution background soundtrack
    this.stopEvolutionAudio();
    this.evolutionAudio = battleSePlayer.playSound('Audio/SE/Evolution.ogg', 0.85);

    this.startTime = performance.now();
    this.phaseStartTime = this.startTime;

    this.startLoop();
  }

  private setMessage(text: string): void {
    if (this.messageTextEl) {
      this.messageTextEl.textContent = text;
    }
  }

  private startLoop(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }

    const loop = (timestamp: number) => {
      if (!this.isRunning) return;
      this.update(timestamp);
      this.render(timestamp);
      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  private playTone(freq: number, type: OscillatorType = 'sine', duration = 0.15, gainVal = 0.08): void {
    try {
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          this.audioCtx = new AudioCtxClass();
        }
      }
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch {
      // Audio autoplay fail-safe
    }
  }

  private update(timestamp: number): void {
    const elapsedPhase = timestamp - this.phaseStartTime;

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // Phase State Machine
    if (this.phase === 'intro') {
      if (elapsedPhase > 1600) {
        this.phase = 'glowing_ascending';
        this.phaseStartTime = timestamp;
        battleSePlayer.playSound('Audio/SE/Shiny sparkle.ogg', 0.6);
      }
    } else if (this.phase === 'glowing_ascending') {
      // Ascends smoothly from startY (275) to targetY (165) over 3200ms
      const duration = 3200;
      const progress = Math.min(1, elapsedPhase / duration);
      // Ease in-out quad
      const eased =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      this.posY = this.startY - (this.startY - this.targetY) * eased;

      // Spawn sparkling ascent particles
      if (Math.random() < 0.45) {
        this.spawnGlowParticle(this.posX, this.posY);
      }

      // Play rising audio chimes
      if (Math.floor(elapsedPhase / 300) !== Math.floor((elapsedPhase - 16) / 300)) {
        const step = Math.floor(elapsedPhase / 300);
        this.playTone(320 + step * 40, 'triangle', 0.2, 0.05);
      }

      if (elapsedPhase >= duration) {
        this.posY = this.targetY;
        this.phase = 'morphing';
        this.phaseStartTime = timestamp;
      }
    } else if (this.phase === 'morphing') {
      // Morphing alternates between pre-evolution and evolved sprite over 4200ms
      const duration = 4200;

      // Emit radial swirling motes
      if (Math.random() < 0.6) {
        this.spawnMorphParticle(this.posX, this.posY);
      }

      // Check alternating click tone
      const progress = Math.min(1, elapsedPhase / duration);
      const currentPeriod = Math.max(60, 320 - progress * 260); // 320ms down to 60ms
      const cycleIndex = Math.floor(elapsedPhase / currentPeriod);
      const prevCycleIndex = Math.floor((elapsedPhase - 16) / currentPeriod);

      if (cycleIndex !== prevCycleIndex) {
        const isPreEvo = cycleIndex % 2 === 0;
        this.playTone(isPreEvo ? 440 : 660, 'sine', 0.1, 0.06);
      }

      if (elapsedPhase >= duration) {
        this.phase = 'burst';
        this.phaseStartTime = timestamp;
        battleSePlayer.playSound('Audio/SE/Shiny sparkle.ogg', 0.8);
        this.playTone(880, 'square', 0.6, 0.12);
        // Spawn supernova burst particles
        for (let i = 0; i < 40; i++) {
          this.spawnBurstParticle(this.posX, this.posY);
        }
      }
    } else if (this.phase === 'burst') {
      // Supernova explosion opens up over 1100ms
      const duration = 1100;
      if (elapsedPhase >= duration) {
        this.phase = 'revealed';
        this.phaseStartTime = timestamp;
        this.hasLanded = false;
        this.onEvolutionRevealed();
      }
    } else if (this.phase === 'revealed') {
      // Evolved Pokémon descends / drops smoothly from targetY (160) back down to startY (255)
      const dropDuration = 950;
      if (elapsedPhase < dropDuration) {
        const dropProgress = Math.min(1, elapsedPhase / dropDuration);
        // Smooth cubic ease out
        const eased = 1 - Math.pow(1 - dropProgress, 3);
        this.posY = this.targetY + (this.startY - this.targetY) * eased;
      } else {
        this.posY = this.startY;
        if (!this.hasLanded) {
          this.hasLanded = true;
          this.spawnLandingDust(this.posX, this.startY + 35);
        }
      }

      // Celebratory gentle floating sparkles
      if (Math.random() < 0.25) {
        this.spawnVictorySparkle();
      }
    }
  }

  private onEvolutionRevealed(): void {
    if (!this.currentPokemon || !this.evolutionReq) return;

    // Apply the permanent mutation to the Pokémon entity
    const evoResult = applyEvolution(this.currentPokemon, this.evolutionReq.targetSpeciesKey);
    partyService.notify();

    // Stop the evolution melody so the new cry and fanfare sound clear
    this.stopEvolutionAudio();

    // Play new species cry
    if (evoResult.targetSpecies.sprites?.cry) {
      battleSePlayer.playSound(evoResult.targetSpecies.sprites.cry, 0.85);
    }

    // Play triumphant victory celebration fanfare
    setTimeout(() => {
      const victorySe = battleSePlayer.playSound('Audio/SE/Evolution success.ogg', 0.85);
      if (!victorySe) {
        battleSePlayer.playSound('Audio/SE/Battle capture success.ogg', 0.75);
      }
    }, 450);

    // Show celebratory dialogue message
    this.setMessage(`🎉 Chúc mừng! ${evoResult.oldName} đã tiến hóa thành công thành ${evoResult.newName}!`);

    // Show the "TIẾP TỤC" button
    if (this.actionBtnEl) {
      this.actionBtnEl.style.display = 'block';
    }

    showBerryToast(`✨ ${evoResult.oldName} đã tiến hóa thành ${evoResult.newName}!`, '#38bdf8');
  }

  private render(timestamp: number): void {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 512, 384);

    const elapsedPhase = timestamp - this.phaseStartTime;

    // 1. Draw Sprite / Light Sphere based on active phase
    if (this.phase === 'intro') {
      this.drawPokemonSprite(ctx, this.preEvoImg, this.posX, this.posY, 1.0, 0);
    } else if (this.phase === 'glowing_ascending') {
      const progress = Math.min(1, elapsedPhase / 3200);
      const glowFactor = Math.min(1, progress * 1.3);

      // Draw base sprite turning increasingly white
      this.drawPokemonSprite(ctx, this.preEvoImg, this.posX, this.posY, 1.0, glowFactor);

      // Draw glowing sphere of pure radiant light expanding over the sprite
      this.drawRadiantLightSphere(ctx, this.posX, this.posY, 46 + progress * 24, glowFactor, timestamp);
    } else if (this.phase === 'morphing') {
      const progress = Math.min(1, elapsedPhase / 4200);
      const currentPeriod = Math.max(60, 320 - progress * 260);
      const isPreEvo = Math.floor(elapsedPhase / currentPeriod) % 2 === 0;
      const targetImg = isPreEvo ? this.preEvoImg : this.evoImg;

      // Pulsing scale for morphing excitement
      const pulseScale = 1.0 + Math.sin(timestamp * 0.02) * 0.08;

      // Alternating sprite silhouette with radiant glow
      this.drawPokemonSprite(ctx, targetImg, this.posX, this.posY, pulseScale, 0.7);

      // Glowing sphere enclosing the morphing center
      this.drawRadiantLightSphere(ctx, this.posX, this.posY, 68 + Math.sin(timestamp * 0.03) * 6, 1.0, timestamp);
    } else if (this.phase === 'burst') {
      // Supernova Burst expanding
      const progress = Math.min(1, elapsedPhase / 1100);
      const flashAlpha = Math.max(0, 1.0 - progress * 1.1);

      // Reveal the new evolved form fading in
      this.drawPokemonSprite(ctx, this.evoImg, this.posX, this.posY, 1.0, 0);

      // Expanding blinding flash wave
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.85})`;
      ctx.fillRect(0, 0, 512, 384);

      // Concentric expanding shockwave rings
      const ringRadius = progress * 280;
      ctx.strokeStyle = `rgba(224, 242, 254, ${flashAlpha})`;
      ctx.lineWidth = 8 * (1 - progress);
      ctx.beginPath();
      ctx.arc(this.posX, this.posY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(254, 240, 138, ${flashAlpha * 0.8})`;
      ctx.lineWidth = 4 * (1 - progress);
      ctx.beginPath();
      ctx.arc(this.posX, this.posY, ringRadius * 0.65, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (this.phase === 'revealed' || this.phase === 'done') {
      // Fully restored evolved Pokémon in full pixel art glory (no glow)
      const bounce = this.hasLanded ? Math.sin(timestamp * 0.005) * 2 : 0;
      this.drawPokemonSprite(ctx, this.evoImg, this.posX, this.posY + bounce, 1.0, 0);
    }

    // 2. Render all particles
    this.renderParticles(ctx);
  }

  private drawPokemonSprite(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement | null,
    x: number,
    y: number,
    scale: number,
    glowAmount: number
  ): void {
    if (!img || !img.complete || img.naturalWidth === 0) return;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Calculate frame dimensions (if animated strip, width = height)
    const frameH = img.height;
    const frameW = frameH;
    const totalFrames = Math.max(1, Math.floor(img.width / frameH));
    const frameIdx = Math.floor(performance.now() / 120) % totalFrames;
    const sx = frameIdx * frameW;

    const baseSpriteScale = 2.4;
    const destW = Math.round(frameW * baseSpriteScale * scale);
    const destH = Math.round(frameH * baseSpriteScale * scale);
    const dx = Math.round(x - destW / 2);
    const dy = Math.round(y - destH / 2);

    // Draw normal sprite
    ctx.drawImage(img, sx, 0, frameW, frameH, dx, dy, destW, destH);

    // Apply bright white glowing luminance overlay if glowing
    if (glowAmount > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, glowAmount * 0.95)})`;
      ctx.fillRect(dx, dy, destW, destH);
      ctx.restore();

      // Additional radial aura around sprite
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const aura = ctx.createRadialGradient(x, y, 10, x, y, destW * 0.65);
      aura.addColorStop(0, `rgba(255, 255, 255, ${glowAmount * 0.6})`);
      aura.addColorStop(0.5, `rgba(186, 230, 253, ${glowAmount * 0.35})`);
      aura.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(x, y, destW * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  private drawRadiantLightSphere(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    baseRadius: number,
    intensity: number,
    timestamp: number
  ): void {
    if (intensity <= 0) return;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    const pulse = Math.sin(timestamp * 0.012) * 4;
    const radius = Math.max(10, baseRadius + pulse);

    // 1. Outer corona
    const outerGrad = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.5);
    outerGrad.addColorStop(0, `rgba(255, 255, 255, ${0.9 * intensity})`);
    outerGrad.addColorStop(0.35, `rgba(186, 230, 253, ${0.7 * intensity})`);
    outerGrad.addColorStop(0.7, `rgba(125, 211, 252, ${0.35 * intensity})`);
    outerGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 2. Pure radiant white energy core
    const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.6);
    coreGrad.addColorStop(0, `rgba(255, 255, 255, ${1.0 * intensity})`);
    coreGrad.addColorStop(0.7, `rgba(254, 249, 195, ${0.85 * intensity})`);
    coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // 3. Subtle rotating light spikes
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 * intensity})`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const angle = (timestamp * 0.002) + (i * Math.PI) / 4;
      const len = radius * 1.25;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(angle) * len, y - Math.sin(angle) * len);
      ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      ctx.stroke();
    }

    ctx.restore();
  }

  private spawnGlowParticle(cx: number, cy: number): void {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 32 + 5;
    this.particles.push({
      x: cx + Math.cos(angle) * dist,
      y: cy + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -Math.random() * 1.8 - 0.5, // Float gently upwards
      radius: Math.random() * 2.5 + 1.2,
      color: Math.random() > 0.4 ? '#ffffff' : '#7dd3fc',
      alpha: 1.0,
      life: 0,
      maxLife: Math.floor(Math.random() * 30 + 25),
    });
  }

  private spawnMorphParticle(cx: number, cy: number): void {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2.2 + 1.0;
    this.particles.push({
      x: cx + Math.cos(angle) * 15,
      y: cy + Math.sin(angle) * 15,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: Math.random() * 3.0 + 1.5,
      color: Math.random() > 0.5 ? '#fef08a' : '#bae6fd',
      alpha: 1.0,
      life: 0,
      maxLife: Math.floor(Math.random() * 25 + 20),
    });
  }

  private spawnBurstParticle(cx: number, cy: number): void {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 6.0 + 2.5;
    this.particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: Math.random() * 4.0 + 2.0,
      color: Math.random() > 0.3 ? '#ffffff' : '#fef08a',
      alpha: 1.0,
      life: 0,
      maxLife: Math.floor(Math.random() * 40 + 30),
    });
  }

  private spawnVictorySparkle(): void {
    this.particles.push({
      x: Math.random() * 512,
      y: Math.random() * 40 + 40,
      vx: (Math.random() - 0.5) * 0.6,
      vy: Math.random() * 1.2 + 0.6,
      radius: Math.random() * 2.5 + 1.5,
      color: ['#fef08a', '#67e8f9', '#a7f3d0', '#f472b6'][Math.floor(Math.random() * 4)],
      alpha: 1.0,
      life: 0,
      maxLife: Math.floor(Math.random() * 50 + 40),
    });
  }

  private renderParticles(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private spawnLandingDust(cx: number, cy: number): void {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.random() > 0.5 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.6;
      const speed = Math.random() * 2.6 + 1.0;
      this.particles.push({
        x: cx + (Math.random() - 0.5) * 24,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: -Math.random() * 0.8 - 0.2,
        radius: Math.random() * 2.5 + 1.5,
        color: Math.random() > 0.4 ? '#ffffff' : '#fef08a',
        alpha: 0.85,
        life: 0,
        maxLife: Math.floor(Math.random() * 20 + 15),
      });
    }
  }

  private stopEvolutionAudio(): void {
    if (this.evolutionAudio) {
      try {
        this.evolutionAudio.pause();
        this.evolutionAudio.currentTime = 0;
      } catch {
        // audio cleanup
      }
      this.evolutionAudio = null;
    }
  }

  private finishAndClose(): void {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    this.stopEvolutionAudio();

    if (this.overlayEl) {
      this.overlayEl.style.display = 'none';
    }

    // Ensure all party & overworld listeners (such as follower) are fully updated
    partyService.notify();

    const cb = this.onCompleteCallback;
    this.onCompleteCallback = undefined;
    cb?.();
  }
}
