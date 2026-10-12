import type { BattleState } from '../battle-state';
import { moveVfxCache } from '../move-vfx';
import { battleSePlayer } from '../../audio';
import type { CustomMoveAnimationInstance } from './ancient-power';

export interface FlamethrowerAnimationConfig {
  attackerSide: 'player' | 'enemy';
  attackerCenter: { x: number; y: number };
  defenderCenter: { x: number; y: number };
  onImpact: () => void;
  onComplete?: () => void;
}

interface FireParticle {
  angle: number;
  distance: number;
  speed: number;
  size: number;
  alpha: number;
}

interface FireSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
}

function isLoaded(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0;
}

/**
 * Custom Scripted Move Animation: Flamethrower (Phun Lửa)
 * Sử dụng sprite sheet 'Graphics/Animations/015-Fire01.png' (960x384, cell 192x192, 5x2 = 10 ô).
 *
 * Kịch bản 3 giai đoạn:
 * 1. Tụ hỏa diễm (Ticks 1 -> 33 ~0.55s):
 *    - Các đóm than hồng & tia lửa xoáy tụ từ không gian vào trước miệng Pokémon.
 *    - Phôi cầu lửa bập bùng lớn dần (F5 -> F7) và nhấp nhô nhịp thở nhiệt lượng trước khi bắn.
 * 2. Phóng rồng lửa (Ticks 34 -> 50 ~0.28s):
 *    - Phóng luồng rồng lửa uốn lượn bay vút sang Pokémon đối thủ kèm vệt than hồng rực rỡ.
 * 3. Va chạm & Bùng cháy mở rộng (Ticks 51 -> 81 ~0.5s):
 *    - Va chạm kích hoạt onImpact(), rung nhẹ camera, chớp cam đỏ rực.
 *    - Nổ bùng lửa tròn mở rộng (F0 -> F3, scale 1.35x).
 *    - Kèm 18 tàn lửa phân tử (FireSpark) bắn văng tỏa rộng 360 độ ra xa khắp khu vực quanh đối thủ.
 */
export class FlamethrowerAnimation implements CustomMoveAnimationInstance {
  public id = 'flamethrower';
  public tick = 0;
  public totalTicks = 81;
  public isComplete = false;

  private image: HTMLImageElement;
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

  private spiralParticles: FireParticle[] = [];
  private trailHistory: Array<{ x: number; y: number; alpha: number; scale: number; rot: number }> =
    [];
  private sparks: FireSpark[] = [];

  constructor(config: FlamethrowerAnimationConfig) {
    this.attackerSide = config.attackerSide;
    this.startX = config.attackerCenter.x;
    this.startY = config.attackerCenter.y;
    this.targetX = config.defenderCenter.x;
    this.targetY = config.defenderCenter.y;
    this.onImpact = config.onImpact;
    this.onComplete = config.onComplete;

    if (this.attackerSide === 'player') {
      this.chargeX = this.startX + 26;
      this.chargeY = this.startY - 14;
    } else {
      this.chargeX = this.startX - 26;
      this.chargeY = this.startY + 10;
    }

    this.image = moveVfxCache.getImage('Graphics/Animations/015-Fire01.png');

    // Khởi tạo các tia lửa tụ về miệng
    for (let i = 0; i < 16; i++) {
      this.spiralParticles.push({
        angle: (i / 16) * Math.PI * 2,
        distance: 40 + Math.random() * 28,
        speed: 1.5 + Math.random() * 1.5,
        size: 2.5 + Math.random() * 2.5,
        alpha: 0.8 + Math.random() * 0.2,
      });
    }

    battleSePlayer.playSound('Audio/SE/Battle throw.ogg', 0.5);
  }

  public update(state: BattleState): void {
    if (this.isComplete) return;

    this.tick++;

    // --- Phase 1: Tụ hỏa diễm (Ticks 1 -> 33 ~0.55s) ---
    if (this.tick < 34) {
      for (const p of this.spiralParticles) {
        p.angle += 0.12;
        p.distance = Math.max(2, p.distance - p.speed);
        p.alpha = Math.min(1.0, p.distance / 18.0);
      }

      if (this.tick % 4 === 0 && this.tick < 26) {
        this.spiralParticles.push({
          angle: Math.random() * Math.PI * 2,
          distance: 48 + Math.random() * 20,
          speed: 1.8 + Math.random() * 1.4,
          size: 2.0 + Math.random() * 3.0,
          alpha: 0.9,
        });
      }
    }

    // --- Phase 2: Phóng luồng rồng lửa (Ticks 34 -> 50 ~0.28s) ---
    if (this.tick >= 34 && this.tick < 51) {
      const flightProgress = (this.tick - 34) / 16.0; // 0.0 -> 1.0
      const t = Math.min(1.0, Math.pow(flightProgress, 1.25));

      const curX = this.chargeX + (this.targetX - this.chargeX) * t;
      const wave = Math.sin(flightProgress * Math.PI * 3) * 7;
      const curY = this.chargeY + (this.targetY - this.chargeY) * t + wave;

      // Góc bay hướng thẳng tới mục tiêu
      const dx = this.targetX - this.chargeX;
      const dy = this.targetY - this.chargeY;
      const angle = Math.atan2(dy, dx);

      this.trailHistory.unshift({ x: curX, y: curY, alpha: 0.7, scale: 1.1, rot: angle });
      if (this.trailHistory.length > 7) {
        this.trailHistory.pop();
      }

      if (this.tick === 34) {
        battleSePlayer.playSound('Audio/SE/Battle throw.ogg', 0.8);
      }
    }

    // --- Phase 3: Va chạm & Bùng cháy mở rộng (Ticks 51 -> 81 ~0.5s) ---
    if (this.tick === 51 && !this.impactTriggered) {
      this.impactTriggered = true;
      this.onImpact();

      battleSePlayer.playSound('Audio/SE/Battle ball hit.ogg', 0.9);
      state.triggerScreenShake(8, 2);
      state.triggerScreenFlash('rgba(255, 90, 15, 0.45)', 8);

      this.spawnExpandedFireSparks();
    }

    if (this.tick >= 51) {
      for (const s of this.sparks) {
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.92;
        s.vy = s.vy * 0.92 - 0.2; // Nhẹ nhàng bốc lên trên
        s.alpha = Math.max(0, s.alpha - 0.035);
      }
    }

    if (this.tick >= this.totalTicks) {
      this.isComplete = true;
      if (this.onComplete) {
        this.onComplete();
      }
    }
  }

  private spawnExpandedFireSparks(): void {
    const colors = [
      'rgba(255, 60, 10, ',
      'rgba(255, 140, 20, ',
      'rgba(255, 210, 40, ',
      'rgba(255, 240, 120, ',
    ];
    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 3.5 + Math.random() * 4.5;
      this.sparks.push({
        x: this.targetX,
        y: this.targetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.7,
        radius: 3.5 + Math.random() * 4.5,
        alpha: 0.95,
        color: colors[i % colors.length],
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D, _state: BattleState): void {
    if (!isLoaded(this.image)) return;

    ctx.save();

    // 1. Tàn lửa xoáy tụ (Phase 1)
    if (this.tick < 34 && this.spiralParticles.length > 0) {
      for (const p of this.spiralParticles) {
        if (p.alpha <= 0.02) continue;
        const px = this.chargeX + Math.cos(p.angle) * p.distance;
        const py = this.chargeY + Math.sin(p.angle) * p.distance * 0.7;

        ctx.fillStyle = `rgba(255, 140, 20, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. Render quả cầu lửa tích tụ & Luồng rồng lửa phóng bay (Phase 1 & 2)
    if (this.tick < 51) {
      if (this.tick < 34) {
        // Quả cầu lửa lớn dần trước miệng
        let frameIdx: number;
        let scale = 0.5 + (this.tick / 33.0) * 0.55;

        if (this.tick <= 10) frameIdx = 5;
        else if (this.tick <= 20) frameIdx = 6;
        else {
          frameIdx = 7;
          scale = 1.05 + Math.sin(this.tick * 0.3) * 0.08;
        }

        this.drawCell(ctx, frameIdx, this.chargeX, this.chargeY, scale, 0, 1.0);
      } else {
        // Phóng luồng rồng lửa uốn lượn
        const flightProgress = (this.tick - 34) / 16.0;
        const t = Math.min(1.0, Math.pow(flightProgress, 1.25));
        const curX = this.chargeX + (this.targetX - this.chargeX) * t;
        const wave = Math.sin(flightProgress * Math.PI * 3) * 7;
        const curY = this.chargeY + (this.targetY - this.chargeY) * t + wave;

        const dx = this.targetX - this.chargeX;
        const dy = this.targetY - this.chargeY;
        const mainAngle = Math.atan2(dy, dx) - Math.PI / 2; // Căn chỉnh hướng phun

        // Vẽ thân luồng lửa nối dài từ các vệt cũ
        for (let i = 0; i < this.trailHistory.length; i++) {
          const h = this.trailHistory[i];
          const trailAlpha = h.alpha * (1 - (i + 1) / (this.trailHistory.length + 1));
          const trailFrame = i % 2 === 0 ? 6 : 5;
          this.drawCell(
            ctx,
            trailFrame,
            h.x,
            h.y,
            0.95 + i * 0.04,
            h.rot - Math.PI / 2,
            trailAlpha
          );
        }

        // Đầu rồng lửa rực sáng
        this.drawCell(ctx, 7, curX, curY, 1.25, mainAngle, 1.0);
      }
    }

    // 3. Render Va chạm & Bùng cháy mở rộng (Phase 3: Ticks 51 -> 81)
    if (this.tick >= 51) {
      const impactTick = this.tick - 51;

      // Nổ bùng lửa tròn mở rộng (Frames 0, 1, 2, 3)
      if (impactTick < 20) {
        let burstFrame: number;
        let alpha: number;

        if (impactTick < 5) {
          burstFrame = 0;
          alpha = 1.0;
        } else if (impactTick < 10) {
          burstFrame = 1;
          alpha = 0.95;
        } else if (impactTick < 15) {
          burstFrame = 2;
          alpha = 0.85;
        } else {
          burstFrame = 3;
          alpha = Math.max(0, 1.0 - (impactTick - 15) / 5.0);
        }

        this.drawCell(ctx, burstFrame, this.targetX, this.targetY, 1.35, 0, alpha);
      }

      // Vẽ 18 tàn lửa phân tử lan tỏa rộng tự do không giới hạn khung
      for (const s of this.sparks) {
        if (s.alpha <= 0.02) continue;

        ctx.fillStyle = `${s.color}${s.alpha * 0.95})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 255, 200, ${s.alpha * 0.8})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private drawCell(
    ctx: CanvasRenderingContext2D,
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
    ctx.drawImage(this.image, sx, sy, this.cellW, this.cellH, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }
}
