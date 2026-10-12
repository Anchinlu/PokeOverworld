import type { BattleState } from '../battle-state';
import { moveVfxCache } from '../move-vfx';
import { battleSePlayer } from '../../audio';
import type { CustomMoveAnimationInstance } from './ancient-power';

export interface ThunderboltAnimationConfig {
  attackerSide: 'player' | 'enemy';
  attackerCenter: { x: number; y: number };
  defenderCenter: { x: number; y: number };
  onImpact: () => void;
  onComplete?: () => void;
}

interface StaticArcParticle {
  angle: number;
  distance: number;
  length: number;
  alpha: number;
}

interface GroundSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  alpha: number;
  angle: number;
}

function isLoaded(img: HTMLImageElement): boolean {
  return img.complete && img.naturalWidth > 0;
}

/**
 * Custom Scripted Move Animation: Thunderbolt (Tia Sét 10 Vạn Volt)
 * Sử dụng sprite sheet 'Graphics/Animations/017-Thunder01.png' (960x384, cell 192x192, 5x2 = 10 ô).
 *
 * Kịch bản 3 giai đoạn:
 * 1. Tụ lôi điện (Ticks 1 -> 33 ~0.55s):
 *    - Các tia hồ quang tĩnh điện màu vàng/trắng chớp giật liên tục quanh cơ thể Pokémon.
 *    - Khối cầu điện tích tụ rực sáng, nhấp nhô nhịp thở phát quang chói chang trước ngực.
 * 2. Phóng sét xé toạc không gian (Ticks 34 -> 48 ~0.25s):
 *    - Tia sét zigzag chớp giật phóng thẳng sang phía trên Pokémon đối thủ.
 * 3. Cột sét giáng xuống & Sấm sét mở rộng (Ticks 49 -> 78 ~0.5s):
 *    - Cột lôi điện khổng lồ giáng thẳng từ trời xuống mục tiêu (F4, F5, scale 1.45x).
 *    - Rung mạnh camera, chớp trắng vàng chói lòa và gọi onImpact().
 *    - 20 tia hồ quang phân tử (GroundSpark) tỏa rộng 360 độ khắp mặt đất xung quanh mục tiêu.
 */
export class ThunderboltAnimation implements CustomMoveAnimationInstance {
  public id = 'thunderbolt';
  public tick = 0;
  public totalTicks = 78;
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

  private staticArcs: StaticArcParticle[] = [];
  private groundSparks: GroundSpark[] = [];

  constructor(config: ThunderboltAnimationConfig) {
    this.attackerSide = config.attackerSide;
    this.startX = config.attackerCenter.x;
    this.startY = config.attackerCenter.y;
    this.targetX = config.defenderCenter.x;
    this.targetY = config.defenderCenter.y;
    this.onImpact = config.onImpact;
    this.onComplete = config.onComplete;

    if (this.attackerSide === 'player') {
      this.chargeX = this.startX + 22;
      this.chargeY = this.startY - 18;
    } else {
      this.chargeX = this.startX - 22;
      this.chargeY = this.startY + 12;
    }

    this.image = moveVfxCache.getImage('Graphics/Animations/017-Thunder01.png');

    // Khởi tạo các tia hồ quang điện quanh điểm tụ
    for (let i = 0; i < 12; i++) {
      this.staticArcs.push({
        angle: (i / 12) * Math.PI * 2,
        distance: 18 + Math.random() * 24,
        length: 10 + Math.random() * 14,
        alpha: 0.85,
      });
    }

    battleSePlayer.playSound('Audio/SE/Battle throw.ogg', 0.5);
  }

  public update(state: BattleState): void {
    if (this.isComplete) return;

    this.tick++;

    // --- Phase 1: Tụ lôi điện (Ticks 1 -> 33 ~0.55s) ---
    if (this.tick < 34) {
      for (const arc of this.staticArcs) {
        arc.angle += 0.25;
        arc.distance = Math.max(8, arc.distance - 0.7);
        arc.alpha = 0.5 + Math.random() * 0.5; // Chớp giật ngẫu nhiên
      }
    }

    // --- Phase 2: Phóng tia sét zigzag (Ticks 34 -> 48 ~0.25s) ---
    if (this.tick >= 34 && this.tick < 49) {
      if (this.tick === 34) {
        battleSePlayer.playSound('Audio/SE/Battle throw.ogg', 0.8);
      }
    }

    // --- Phase 3: Cột sét giáng xuống & Sấm sét mở rộng (Ticks 49 -> 78 ~0.5s) ---
    if (this.tick === 49 && !this.impactTriggered) {
      this.impactTriggered = true;
      this.onImpact();

      battleSePlayer.playSound('Audio/SE/Battle ball hit.ogg', 0.95);
      state.triggerScreenShake(9, 3); // Rung mạnh camera
      state.triggerScreenFlash('rgba(255, 255, 180, 0.65)', 9); // Chớp trắng vàng chói lòa

      this.spawnExpandedGroundSparks();
    }

    if (this.tick >= 49) {
      for (const gs of this.groundSparks) {
        gs.x += gs.vx;
        gs.y += gs.vy;
        gs.vx *= 0.9;
        gs.vy *= 0.9;
        gs.alpha = Math.max(0, gs.alpha - 0.04);
      }
    }

    if (this.tick >= this.totalTicks) {
      this.isComplete = true;
      if (this.onComplete) {
        this.onComplete();
      }
    }
  }

  private spawnExpandedGroundSparks(): void {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 4.0 + Math.random() * 5.0;
      this.groundSparks.push({
        x: this.targetX,
        y: this.targetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.65, // Chiếu dẹt theo phối cảnh mặt đất
        length: 8 + Math.random() * 12,
        alpha: 0.95,
        angle: angle + (Math.random() - 0.5) * 0.8,
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D, _state: BattleState): void {
    if (!isLoaded(this.image)) return;

    ctx.save();

    // 1. Hồ quang điện tụ quanh Pokémon (Phase 1: Ticks 1 -> 33)
    if (this.tick < 34) {
      // Vẽ các tia sét nhỏ giật quanh
      ctx.strokeStyle = 'rgba(255, 245, 120, 0.9)';
      ctx.lineWidth = 2.0;

      for (const arc of this.staticArcs) {
        if (arc.alpha <= 0.05) continue;
        const x1 = this.chargeX + Math.cos(arc.angle) * arc.distance;
        const y1 = this.chargeY + Math.sin(arc.angle) * arc.distance;
        const x2 = x1 + Math.cos(arc.angle + 0.6) * arc.length;
        const y2 = y1 + Math.sin(arc.angle + 0.6) * arc.length;

        ctx.strokeStyle = `rgba(255, 255, 140, ${arc.alpha})`;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Khối cầu điện tích nhấp nhô phát quang
      const scale = 0.55 + (this.tick / 33.0) * 0.55 + (Math.random() - 0.5) * 0.1;
      const frameIdx = this.tick % 4 < 2 ? 0 : 1;
      this.drawCell(ctx, frameIdx, this.chargeX, this.chargeY, scale, this.tick * 0.2, 0.9);
    }

    // 2. Tia sét zigzag phóng sang đối thủ (Phase 2: Ticks 34 -> 48)
    if (this.tick >= 34 && this.tick < 49) {
      const flightProgress = (this.tick - 34) / 14.0;
      const t = Math.min(1.0, flightProgress);

      const curX = this.chargeX + (this.targetX - this.chargeX) * t;
      const curY = this.chargeY + (this.targetY - 40 - this.chargeY) * t;

      // Góc phóng tới đỉnh đầu Pokémon đối thủ
      const dx = this.targetX - this.chargeX;
      const dy = this.targetY - 40 - this.chargeY;
      const angle = Math.atan2(dy, dx) - Math.PI / 2;

      const boltFrame = this.tick % 2 === 0 ? 2 : 3;
      this.drawCell(ctx, boltFrame, curX, curY, 1.2, angle, 1.0);

      // Tia hồ quang điện phụ vẽ bằng vector
      ctx.strokeStyle = 'rgba(255, 255, 200, 0.8)';
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      ctx.moveTo(this.chargeX, this.chargeY);
      const midX = (this.chargeX + curX) / 2 + (Math.random() - 0.5) * 20;
      const midY = (this.chargeY + curY) / 2 + (Math.random() - 0.5) * 20;
      ctx.lineTo(midX, midY);
      ctx.lineTo(curX, curY);
      ctx.stroke();
    }

    // 3. Cột sấm sét giáng xuống & Sét mở rộng (Phase 3: Ticks 49 -> 78)
    if (this.tick >= 49) {
      const impactTick = this.tick - 49;

      // Cột sét giáng thẳng từ trên trời xuống đối thủ (Frames 4, 5)
      if (impactTick < 20) {
        const pillarFrame = impactTick % 4 < 2 ? 4 : 5;
        const alpha = Math.max(0, 1.0 - impactTick / 20.0);
        // Vẽ cột sét cao từ phía trên rọi thẳng vào tâm đối thủ
        this.drawCell(ctx, pillarFrame, this.targetX, this.targetY - 30, 1.45, 0, alpha);
      }

      // Vẽ 20 tia hồ quang mặt đất tỏa rộng 360 độ không giới hạn khung
      for (const gs of this.groundSparks) {
        if (gs.alpha <= 0.02) continue;

        const x2 = gs.x + Math.cos(gs.angle) * gs.length;
        const y2 = gs.y + Math.sin(gs.angle) * gs.length;

        ctx.strokeStyle = `rgba(255, 255, 120, ${gs.alpha})`;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(gs.x, gs.y);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Đầu tia điện có đốm sáng
        ctx.fillStyle = `rgba(255, 255, 230, ${gs.alpha})`;
        ctx.beginPath();
        ctx.arc(x2, y2, 2.0, 0, Math.PI * 2);
        ctx.fill();
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
