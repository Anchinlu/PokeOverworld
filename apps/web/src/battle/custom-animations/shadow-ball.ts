import type { BattleState } from '../battle-state';
import { moveVfxCache } from '../move-vfx';
import { battleSePlayer } from '../../audio';
import type { CustomMoveAnimationInstance } from './ancient-power';

export interface ShadowBallAnimationConfig {
  attackerSide: 'player' | 'enemy';
  attackerCenter: { x: number; y: number };
  defenderCenter: { x: number; y: number };
  onImpact: () => void;
  onComplete?: () => void;
}

interface EnergySpiralParticle {
  angle: number;
  distance: number;
  speed: number;
  size: number;
  alpha: number;
}

interface DarkDroplet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

function isLoaded(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0;
}

/**
 * Custom Scripted Move Animation: Shadow Ball (Quả Cầu Bóng Tối)
 * Sử dụng sprite sheet 'Graphics/Animations/shadowball.png'.
 *
 * Kịch bản 3 giai đoạn:
 * 1. Tụ năng lượng (Ticks 1 -> 42 ~0.7s):
 *    - Thời gian tụ năng lượng 0.7 giây tạo cảm giác tích tụ ma lực bóng tối lâu và uy lực.
 *    - Các hạt bóng ma xoắn ốc tụ dần về tâm, phôi quả cầu lớn dần (F0 -> F7),
 *      xoay tít và nhấp nhô nhịp thở năng lượng (F8 -> F10) trước ngực Pokémon.
 * 2. Phóng quả cầu (Ticks 43 -> 58 ~0.26s):
 *    - Quả cầu bóng tối đậm đặc phóng vút sang Pokémon đối thủ kèm vệt bóng ma mị.
 * 3. Va chạm & Vỡ bung năng lượng (Ticks 59 -> 84 ~0.42s):
 *    - Trúng đích: Rung nhẹ camera, chớp tím ma mị và gọi onImpact().
 *    - MỞ RỘNG PHẠM VI KHUNG: Kết hợp frame nổ trung tâm (F14, F15, F16) được phóng to mở rộng,
 *      cùng hệ thống 16 giọt bóng ma (DarkDroplet) bay tỏa rộng 360 độ ra xa khắp khu vực
 *      quanh Pokémon đối thủ (không bị gò bó hay cắt mép), chậm dần và mờ tan tự nhiên.
 */
export class ShadowBallAnimation implements CustomMoveAnimationInstance {
  public id = 'shadow_ball';
  public tick = 0;
  public totalTicks = 84;
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

  // Điểm tụ đạn trước mặt Pokémon thi triển
  private chargeX: number;
  private chargeY: number;

  private onImpact: () => void;
  private onComplete?: () => void;

  // Hạt năng lượng bóng ma xoáy tụ lại
  private spiralParticles: EnergySpiralParticle[] = [];
  // Vệt bóng mờ sau quả cầu khi phóng bay
  private trailHistory: Array<{ x: number; y: number; alpha: number; scale: number }> = [];
  // Các giọt bóng tối lan tỏa tự do không giới hạn khung khi va chạm
  private droplets: DarkDroplet[] = [];

  constructor(config: ShadowBallAnimationConfig) {
    this.attackerSide = config.attackerSide;
    this.startX = config.attackerCenter.x;
    this.startY = config.attackerCenter.y;
    this.targetX = config.defenderCenter.x;
    this.targetY = config.defenderCenter.y;
    this.onImpact = config.onImpact;
    this.onComplete = config.onComplete;

    // Tọa độ tụ quả cầu ở phía trước Pokémon
    if (this.attackerSide === 'player') {
      this.chargeX = this.startX + 24;
      this.chargeY = this.startY - 16;
    } else {
      this.chargeX = this.startX - 24;
      this.chargeY = this.startY + 12;
    }

    this.image = moveVfxCache.getImage('Graphics/Animations/shadowball.png');

    // Khởi tạo các hạt năng lượng bóng tối tụ về tâm
    for (let i = 0; i < 18; i++) {
      this.spiralParticles.push({
        angle: (i / 18) * Math.PI * 2,
        distance: 42 + Math.random() * 32,
        speed: 1.2 + Math.random() * 1.2,
        size: 2.5 + Math.random() * 2.5,
        alpha: 0.75 + Math.random() * 0.25,
      });
    }

    // Âm thanh tụ năng lượng
    battleSePlayer.playSound('Audio/SE/Battle throw.ogg', 0.5);
  }

  public update(state: BattleState): void {
    if (this.isComplete) return;

    this.tick++;

    // --- Giai đoạn 1: Tụ năng lượng thành quả cầu (Ticks 1 -> 42 ~0.7s) ---
    if (this.tick < 43) {
      // Hút các hạt xoắn ốc về tâm quả cầu
      for (const p of this.spiralParticles) {
        p.angle += 0.09;
        p.distance = Math.max(2, p.distance - p.speed);
        p.alpha = Math.min(1.0, p.distance / 20.0);
      }

      // Tiếp tục sinh hạt tụ năng lượng liên tục trong 36 tick đầu
      if (this.tick % 4 === 0 && this.tick < 36) {
        this.spiralParticles.push({
          angle: Math.random() * Math.PI * 2,
          distance: 55 + Math.random() * 25,
          speed: 1.5 + Math.random() * 1.4,
          size: 2.0 + Math.random() * 3.0,
          alpha: 0.9,
        });
      }
    }

    // --- Giai đoạn 2: Phóng quả cầu sang Pokémon địch (Ticks 43 -> 58 ~0.26s) ---
    if (this.tick >= 43 && this.tick < 59) {
      const flightProgress = (this.tick - 43) / 15.0; // 0.0 -> 1.0
      // Gia tốc phóng (ease-in quad)
      const t = Math.min(1.0, Math.pow(flightProgress, 1.35));

      const curX = this.chargeX + (this.targetX - this.chargeX) * t;
      const wave = Math.sin(flightProgress * Math.PI * 2) * 5;
      const curY = this.chargeY + (this.targetY - this.chargeY) * t + wave;

      // Lưu lại vệt bóng mờ hắc ám (trails)
      this.trailHistory.unshift({ x: curX, y: curY, alpha: 0.55, scale: 1.0 });
      if (this.trailHistory.length > 5) {
        this.trailHistory.pop();
      }

      // Âm thanh khi bắt đầu phóng
      if (this.tick === 43) {
        battleSePlayer.playSound('Audio/SE/Battle throw.ogg', 0.7);
      }
    }

    // --- Giai đoạn 3: Va chạm & Vỡ bung năng lượng (Ticks 59 -> 84) ---
    if (this.tick === 59 && !this.impactTriggered) {
      this.impactTriggered = true;
      this.onImpact();

      // Âm thanh chấn động + RUNG NHẸ CAMERA + Chớp sáng tím huyền ảo
      battleSePlayer.playSound('Audio/SE/Battle ball hit.ogg', 0.9);
      state.triggerScreenShake(8, 2); // Rung nhẹ camera (amp 2, duration 8 ticks)
      state.triggerScreenFlash('rgba(110, 30, 160, 0.45)', 8);

      // Kích hoạt 16 giọt bóng ma lan tỏa tự do không giới hạn khung
      this.spawnExpandedDarkDroplets();
    }

    // Cập nhật chuyển động của các giọt bóng tối lan tỏa
    if (this.tick >= 59) {
      for (const d of this.droplets) {
        d.x += d.vx;
        d.y += d.vy;
        d.vx *= 0.92; // Ma sát không khí chậm dần
        d.vy *= 0.92;
        d.alpha = Math.max(0, d.alpha - 0.04);
      }
    }

    // Kết thúc hoạt ảnh
    if (this.tick >= this.totalTicks) {
      this.isComplete = true;
      if (this.onComplete) {
        this.onComplete();
      }
    }
  }

  private spawnExpandedDarkDroplets(): void {
    const count = 16;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const speed = 3.2 + Math.random() * 4.2;
      this.droplets.push({
        x: this.targetX,
        y: this.targetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.75,
        radius: 4.5 + Math.random() * 5.5,
        alpha: 0.95,
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D, _state: BattleState): void {
    if (!isLoaded(this.image)) return;

    ctx.save();

    // 1. Render các hạt năng lượng tụ lại (Phase 1: Ticks 1 -> 42 ~0.7s)
    if (this.tick < 43 && this.spiralParticles.length > 0) {
      for (const p of this.spiralParticles) {
        if (p.alpha <= 0.02) continue;
        const px = this.chargeX + Math.cos(p.angle) * p.distance;
        const py = this.chargeY + Math.sin(p.angle) * p.distance * 0.75;

        ctx.fillStyle = `rgba(185, 95, 230, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. Render quả cầu tích tụ & phóng bay (Phase 1 & Phase 2)
    if (this.tick < 59) {
      if (this.tick < 43) {
        // Phase 1 (0.7s): Các frame tụ lại thành quả cầu hoàn chỉnh
        // F0 -> F2: hạt bắt đầu tụ
        // F3 -> F6: phôi quả cầu hình thành
        // F7 -> F10: quả cầu xoay hoàn chỉnh rực sáng
        let frameIdx: number;
        let scale = 0.5 + (this.tick / 42.0) * 0.55;

        if (this.tick <= 6) frameIdx = 0;
        else if (this.tick <= 12) frameIdx = 1;
        else if (this.tick <= 18) frameIdx = 3;
        else if (this.tick <= 24) frameIdx = 5;
        else if (this.tick <= 30) frameIdx = 7;
        else {
          // Xoay tít các frame F8, F9, F10 khi đã hoàn thành quả cầu, kèm nhịp thở năng lượng
          frameIdx = 8 + ((this.tick - 30) % 3);
          scale = 1.05 + Math.sin(this.tick * 0.25) * 0.08;
        }

        this.drawCell(ctx, frameIdx, this.chargeX, this.chargeY, scale, this.tick * 0.08, 1.0);
      } else {
        // Phase 2: Đang bay tới Pokémon địch
        const flightProgress = (this.tick - 43) / 15.0;
        const t = Math.min(1.0, Math.pow(flightProgress, 1.35));
        const curX = this.chargeX + (this.targetX - this.chargeX) * t;
        const wave = Math.sin(flightProgress * Math.PI * 2) * 5;
        const curY = this.chargeY + (this.targetY - this.chargeY) * t + wave;

        // Vẽ vệt bóng mờ (trails)
        for (let i = 0; i < this.trailHistory.length; i++) {
          const h = this.trailHistory[i];
          const trailAlpha = h.alpha * (1 - (i + 1) / (this.trailHistory.length + 1)) * 0.5;
          this.drawCell(ctx, 10, h.x, h.y, 0.9, (this.tick - i) * 0.15, trailAlpha);
        }

        // Quả cầu chính xoay tít (luân phiên F9 -> F12)
        const flightFrame = 9 + ((this.tick - 43) % 4);
        this.drawCell(ctx, flightFrame, curX, curY, 1.05, this.tick * 0.2, 1.0);
      }
    }

    // 3. Render Va chạm & Vỡ bung năng lượng MỞ RỘNG (Phase 3: Ticks 59 -> 84)
    if (this.tick >= 59) {
      const impactTick = this.tick - 59; // 0 -> 24

      // 3.1. Các frame vỡ nổ trung tâm mở rộng (F14, F15, F16)
      if (impactTick < 18) {
        let burstFrame: number;
        let alpha: number;

        if (impactTick < 6) {
          burstFrame = 14; // Frame 14: Quả cầu bắt đầu nổ toác
          alpha = 1.0;
        } else if (impactTick < 12) {
          burstFrame = 15; // Frame 15: Nổ bùng ra các khối bóng tối lớn
          alpha = 0.95;
        } else {
          burstFrame = 16; // Frame 16: Các khối bóng tối phân tách
          alpha = Math.max(0, 1.0 - (impactTick - 12) / 6.0);
        }

        // Mở rộng quy mô khung hiển thị lên 1.35x
        this.drawCell(ctx, burstFrame, this.targetX, this.targetY, 1.35, 0, alpha);
      }

      // 3.2. Vẽ các giọt bóng tối phân tử lan tỏa rộng tự do không giới hạn khung
      for (const d of this.droplets) {
        if (d.alpha <= 0.02) continue;

        // Thân giọt bóng tối màu tím đen
        ctx.fillStyle = `rgba(35, 8, 48, ${d.alpha * 0.95})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fill();

        // Viền hào quang ma mị màu tím sáng
        ctx.strokeStyle = `rgba(185, 95, 230, ${d.alpha * 0.75})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
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

    // Sprite sheet 960x960, mỗi ô 192x192, 5 cột mỗi hàng
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
