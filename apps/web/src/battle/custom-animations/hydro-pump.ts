import type { BattleState } from '../battle-state';
import { moveVfxCache } from '../move-vfx';
import { battleSePlayer } from '../../audio';
import type { CustomMoveAnimationInstance } from './ancient-power';

export interface HydroPumpAnimationConfig {
  attackerSide: 'player' | 'enemy';
  attackerCenter: { x: number; y: number };
  defenderCenter: { x: number; y: number };
  onImpact: () => void;
  onComplete?: () => void;
}

interface HydroMistParticle {
  angle: number;
  distance: number;
  speed: number;
  radius: number;
  alpha: number;
}

interface WaterDroplet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  radius: number;
  alpha: number;
}

function isLoaded(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0;
}

/**
 * Custom Scripted Move Animation: Hydro Pump (Đại Bác Nước Áp Lực Cao)
 * Sử dụng sprite sheet:
 * - 'Graphics/Animations/water3.png' (Lốc xoáy đại bác nước phóng bay)
 * - 'Graphics/Animations/icewater.png' (Cột thủy áp phun trào geyser bùng nổ)
 *
 * Kịch bản 3 giai đoạn:
 * 1. Tụ áp suất thủy lực (Ticks 1 -> 39 ~0.65s):
 *    - Bong bóng & dòng xoáy nước hội tụ cực mạnh trước họng pháo/miệng Pokémon.
 *    - Khối cầu nước áp suất cao nén lại xoay tít và nhấp nhô nhịp thở áp lực.
 * 2. Phóng đại bác nước thủy áp (Ticks 40 -> 54 ~0.25s):
 *    - Bắn luồng đại bác vòi rồng nước lốc xoáy khổng lồ găm thẳng vào đối thủ.
 * 3. Va chạm & Cột nước phun trào mở rộng (Ticks 55 -> 84 ~0.5s):
 *    - Cột thủy áp nổ bùng phun trào cực mạnh từ mặt đất lên trời (F7..F12, scale 1.45x).
 *    - Rung mạnh camera, chớp xanh lam thủy triều, gọi onImpact().
 *    - 22 giọt nước & bọt sóng (WaterDroplet) bắn tung tóe 360 độ ra xa khắp đấu trường.
 */
export class HydroPumpAnimation implements CustomMoveAnimationInstance {
  public id = 'hydro-pump';
  public tick = 0;
  public totalTicks = 84;
  public isComplete = false;

  private vortexImage: HTMLImageElement;
  private geyserImage: HTMLImageElement;
  private cellW = 192;
  private cellH = 192;
  private impactTriggered = false;

  public attackerSide: 'player' | 'enemy';
  private startX: number;
  private startY: number;
  private targetX: number;
  private targetY: number;

  private chargeX: number;
  private chargeY: number;

  private onImpact: () => void;
  private onComplete?: () => void;

  private mistParticles: HydroMistParticle[] = [];
  private droplets: WaterDroplet[] = [];

  constructor(config: HydroPumpAnimationConfig) {
    this.attackerSide = config.attackerSide;
    this.startX = config.attackerCenter.x;
    this.startY = config.attackerCenter.y;
    this.targetX = config.defenderCenter.x;
    this.targetY = config.defenderCenter.y;
    this.onImpact = config.onImpact;
    this.onComplete = config.onComplete;

    if (this.attackerSide === 'player') {
      this.chargeX = this.startX + 26;
      this.chargeY = this.startY - 16;
    } else {
      this.chargeX = this.startX - 26;
      this.chargeY = this.startY + 12;
    }

    this.vortexImage = moveVfxCache.getImage('Graphics/Animations/water3.png');
    this.geyserImage = moveVfxCache.getImage('Graphics/Animations/icewater.png');

    // Khởi tạo các bong bóng nước tụ về họng súng
    for (let i = 0; i < 18; i++) {
      this.mistParticles.push({
        angle: (i / 18) * Math.PI * 2,
        distance: 35 + Math.random() * 30,
        speed: 1.4 + Math.random() * 1.6,
        radius: 3.0 + Math.random() * 3.0,
        alpha: 0.8,
      });
    }

    battleSePlayer.playSound('Audio/SE/Battle throw.ogg', 0.5);
  }

  public update(state: BattleState): void {
    if (this.isComplete) return;

    this.tick++;

    // --- Phase 1: Tụ áp suất thủy lực (Ticks 1 -> 39 ~0.65s) ---
    if (this.tick < 40) {
      for (const m of this.mistParticles) {
        m.angle += 0.16;
        m.distance = Math.max(3, m.distance - m.speed);
        m.alpha = Math.min(1.0, m.distance / 15.0);
      }

      if (this.tick % 4 === 0 && this.tick < 30) {
        this.mistParticles.push({
          angle: Math.random() * Math.PI * 2,
          distance: 42 + Math.random() * 24,
          speed: 1.6 + Math.random() * 1.4,
          radius: 2.5 + Math.random() * 3.0,
          alpha: 0.85,
        });
      }
    }

    // --- Phase 2: Phóng đại bác nước thủy áp (Ticks 40 -> 54 ~0.25s) ---
    if (this.tick >= 40 && this.tick < 55) {
      if (this.tick === 40) {
        battleSePlayer.playSound('Audio/SE/Battle throw.ogg', 0.85);
      }
    }

    // --- Phase 3: Va chạm & Cột nước phun trào mở rộng (Ticks 55 -> 84 ~0.5s) ---
    if (this.tick === 55 && !this.impactTriggered) {
      this.impactTriggered = true;
      this.onImpact();

      battleSePlayer.playSound('Audio/SE/Battle ball hit.ogg', 0.95);
      state.triggerScreenShake(10, 3);
      state.triggerScreenFlash('rgba(40, 140, 255, 0.45)', 8);

      this.spawnExpandedWaterDroplets();
    }

    if (this.tick >= 55) {
      for (const d of this.droplets) {
        d.x += d.vx;
        d.y += d.vy;
        d.vy += d.gravity;
        d.vx *= 0.94;
        d.alpha = Math.max(0, d.alpha - 0.035);
      }
    }

    if (this.tick >= this.totalTicks) {
      this.isComplete = true;
      if (this.onComplete) {
        this.onComplete();
      }
    }
  }

  private spawnExpandedWaterDroplets(): void {
    const count = 22;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const speed = 4.0 + Math.random() * 5.0;
      this.droplets.push({
        x: this.targetX,
        y: this.targetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.7 - 2.5, // Bắn tung lên trên
        gravity: 0.28,
        radius: 3.5 + Math.random() * 4.5,
        alpha: 0.95,
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D, _state: BattleState): void {
    ctx.save();

    // 1. Bong bóng nước xoáy tụ (Phase 1)
    if (this.tick < 40) {
      for (const m of this.mistParticles) {
        if (m.alpha <= 0.02) continue;
        const px = this.chargeX + Math.cos(m.angle) * m.distance;
        const py = this.chargeY + Math.sin(m.angle) * m.distance * 0.7;

        ctx.fillStyle = `rgba(120, 210, 255, ${m.alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(px, py, m.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 255, 255, ${m.alpha * 0.9})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Khối cầu nước nén áp suất xoay tít
      if (isLoaded(this.vortexImage)) {
        const scale = 0.5 + (this.tick / 39.0) * 0.6;
        const frameIdx = 1 + (Math.floor(this.tick / 3) % 4);
        this.drawCell(
          ctx,
          this.vortexImage,
          frameIdx,
          this.chargeX,
          this.chargeY,
          scale,
          this.tick * 0.15,
          0.95
        );
      }
    }

    // 2. Đại bác vòi rồng nước phóng bay (Phase 2: Ticks 40 -> 54)
    if (this.tick >= 40 && this.tick < 55) {
      if (isLoaded(this.vortexImage)) {
        const flightProgress = (this.tick - 40) / 14.0;
        const t = Math.min(1.0, Math.pow(flightProgress, 1.25));

        const curX = this.chargeX + (this.targetX - this.chargeX) * t;
        const curY = this.chargeY + (this.targetY - this.chargeY) * t;

        const dx = this.targetX - this.chargeX;
        const dy = this.targetY - this.chargeY;
        const angle = Math.atan2(dy, dx) - Math.PI / 2;

        const vortexFrame = 1 + (this.tick % 4);
        this.drawCell(ctx, this.vortexImage, vortexFrame, curX, curY, 1.35, angle, 1.0);
      }
    }

    // 3. Cột thủy áp phun trào & Giọt nước mở rộng (Phase 3: Ticks 55 -> 84)
    if (this.tick >= 55) {
      const impactTick = this.tick - 55;

      // Cột nước phun trào khổng lồ từ đất lên trời (icewater.png F7..F12)
      if (isLoaded(this.geyserImage) && impactTick < 22) {
        let geyserFrame: number;
        let alpha = 1.0;

        if (impactTick < 4) geyserFrame = 7;
        else if (impactTick < 8) geyserFrame = 8;
        else if (impactTick < 12) geyserFrame = 9;
        else if (impactTick < 16) geyserFrame = 10;
        else if (impactTick < 20) geyserFrame = 11;
        else {
          geyserFrame = 12;
          alpha = Math.max(0, 1.0 - (impactTick - 20) / 2.0);
        }

        // Vẽ cột nước phun trào che phủ mục tiêu
        this.drawCell(
          ctx,
          this.geyserImage,
          geyserFrame,
          this.targetX,
          this.targetY - 20,
          1.45,
          0,
          alpha
        );
      }

      // Vẽ 22 giọt nước bắn tung tóe 360 độ không giới hạn khung
      for (const d of this.droplets) {
        if (d.alpha <= 0.02) continue;

        ctx.fillStyle = `rgba(80, 190, 255, ${d.alpha * 0.85})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(230, 245, 255, ${d.alpha * 0.95})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private drawCell(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    frameIndex: number,
    centerX: number,
    centerY: number,
    scale: number,
    rotation: number,
    alpha: number
  ): void {
    if (alpha <= 0.01) return;

    const cols = 5;
    const col = frameIndex % cols;
    const row = Math.floor(frameIndex / cols);

    const sx = col * this.cellW;
    const sy = row * this.cellH;
    const dw = this.cellW * scale;
    const dh = this.cellH * scale;

    ctx.save();
    ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
    ctx.translate(centerX, centerY);
    if (rotation !== 0) {
      ctx.rotate(rotation);
    }
    ctx.drawImage(image, sx, sy, this.cellW, this.cellH, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }
}
