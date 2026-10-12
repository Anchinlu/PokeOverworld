import type { BattleState } from '../battle-state';
import { moveVfxCache } from '../move-vfx';
import { battleSePlayer } from '../../audio';
import { isLoaded } from '../battle-assets';

export interface CustomMoveAnimationInstance {
  id: string;
  tick: number;
  totalTicks: number;
  isComplete: boolean;
  update(state: BattleState): void;
  render(ctx: CanvasRenderingContext2D, state: BattleState): void;
}

export interface AncientPowerAnimationConfig {
  attackerSide: 'player' | 'enemy';
  attackerCenter: { x: number; y: number };
  defenderCenter: { x: number; y: number };
  onImpact: () => void;
  onComplete?: () => void;
}

interface BoulderActor {
  id: number;
  orbitAngle: number;
  orbitRadiusX: number;
  orbitRadiusY: number;
  orbitSpeed: number;
  arcOffset: number;
  scale: number;
  frameOffset: number;
  rotAngle: number;
  lastX: number;
  lastY: number;
  history: Array<{ x: number; y: number; alpha: number }>;
}

interface RockDebris {
  frameIdx: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  rotation: number;
  rotSpeed: number;
  alpha: number;
}

export class AncientPowerAnimation implements CustomMoveAnimationInstance {
  public id = 'ancient_power';
  public tick = 0;
  public totalTicks = 66;
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

  private onImpact: () => void;
  private onComplete?: () => void;

  private boulders: BoulderActor[] = [];
  private debrisList: RockDebris[] = [];
  private energySpecks: Array<{ x: number; y: number; vy: number; alpha: number; size: number }> =
    [];

  constructor(config: AncientPowerAnimationConfig) {
    this.attackerSide = config.attackerSide;
    this.startX = config.attackerCenter.x;
    this.startY = config.attackerCenter.y;
    this.targetX = config.defenderCenter.x;
    this.targetY = config.defenderCenter.y;
    this.onImpact = config.onImpact;
    this.onComplete = config.onComplete;

    this.image = moveVfxCache.getImage('Graphics/Animations/Ancient-PowerFilesheet.png');

    // Phân bố đều 3 tảng cự thạch theo vòng tròn (cách đều 120 độ quanh Pokémon)
    const baseAngles = [
      -Math.PI / 2, // 12 giờ (đỉnh trên)
      -Math.PI / 2 + (Math.PI * 2) / 3, // 4 giờ (bên phải dưới)
      -Math.PI / 2 + (Math.PI * 4) / 3, // 8 giờ (bên trái dưới)
    ];
    const arcOffsets = [-24, 24, -6];
    const scales = [0.65, 0.62, 0.68];

    this.boulders = baseAngles.map((angle, i) => ({
      id: i,
      orbitAngle: angle,
      orbitRadiusX: 46,
      orbitRadiusY: 26,
      orbitSpeed: 0.045,
      arcOffset: arcOffsets[i],
      scale: scales[i],
      frameOffset: i,
      rotAngle: i * 0.6,
      lastX: this.startX,
      lastY: this.startY + 50, // Khởi đầu từ bên dưới mặt đất
      history: [],
    }));

    // Phát âm thanh thức tỉnh năng lượng đất đá
    battleSePlayer.playSound('Audio/SE/Battle ball hit.ogg', 0.5);
  }

  public update(state: BattleState): void {
    if (this.isComplete) return;

    this.tick++;

    // Phase 1: Các cục đá từ bên dưới xuất hiện bay lên trên, phân bố đều vòng tròn & lơ lửng (Tick 1 -> 24)
    if (this.tick < 25) {
      if (this.tick % 4 === 0) {
        // Hạt năng lượng cổ đại bay lên từ mặt đất
        this.energySpecks.push({
          x: this.startX + (Math.random() - 0.5) * 60,
          y: this.startY + 20 + Math.random() * 10,
          vy: -(1.5 + Math.random() * 1.5),
          alpha: 0.85,
          size: 2 + Math.random() * 3,
        });
      }

      // Quá trình bay vút từ dưới lên trên quỹ đạo lơ lửng (ease-out cubic trong 14 tick đầu)
      const riseProgress = Math.min(1.0, this.tick / 14.0);
      const easeRise = 1 - Math.pow(1 - riseProgress, 3);

      for (const b of this.boulders) {
        b.orbitAngle += b.orbitSpeed;
        b.rotAngle += 0.03;

        // Tọa độ mục tiêu trên vòng tròn elip quanh Pokémon
        const targetHoverX = this.startX + Math.cos(b.orbitAngle) * b.orbitRadiusX;
        const targetHoverY = this.startY - 15 + Math.sin(b.orbitAngle) * b.orbitRadiusY;

        // Xuất phát từ bên dưới đất bay lên trên
        const startBelowY = targetHoverY + 52;
        // Hiệu ứng nhấp nhô bồng bềnh lơ lửng
        const bobbing = Math.sin(this.tick * 0.18 + b.id * 1.5) * 3.5;

        b.lastX = targetHoverX;
        b.lastY =
          startBelowY +
          (targetHoverY - startBelowY) * easeRise +
          (riseProgress >= 0.7 ? bobbing : 0);
      }
    }

    // Cập nhật các hạt năng lượng
    for (let i = this.energySpecks.length - 1; i >= 0; i--) {
      const s = this.energySpecks[i];
      s.y += s.vy;
      s.alpha -= 0.04;
      if (s.alpha <= 0) {
        this.energySpecks.splice(i, 1);
      }
    }

    // Phase 2: Ném cùng 1 lượt vào mục tiêu (Tick 25 -> 40)
    if (this.tick >= 25 && this.tick < 41) {
      const flightProgress = (this.tick - 25) / 15.0; // 0.0 -> 1.0

      for (const b of this.boulders) {
        b.rotAngle += 0.16; // Xoay tít khi bay

        const curPos = this.calculateFlightPosition(b, flightProgress);
        b.history.unshift({ x: curPos.x, y: curPos.y, alpha: 0.55 });
        if (b.history.length > 4) {
          b.history.pop();
        }
      }
    }

    // Phase 3: Va chạm, vỡ vụn & rung nhẹ camera (Tick 41 -> 65)
    if (this.tick === 41 && !this.impactTriggered) {
      this.impactTriggered = true;
      this.onImpact();

      // Âm thanh chấn động va đập + RUNG NHẸ CAMERA + chớp sáng tím
      battleSePlayer.playSound('Audio/SE/Battle ball hit.ogg', 0.85);
      state.triggerScreenShake(8, 2); // Rung nhẹ camera (amp: 2, duration: 8 tick)
      state.triggerScreenFlash('rgba(215, 160, 255, 0.40)', 6);

      // Kích hoạt văng các viên đá nhỏ ra xung quanh mục tiêu
      this.spawnScatteredDebris();
    }

    // Cập nhật các mảnh đá nhỏ văng ra
    if (this.tick >= 41) {
      for (const d of this.debrisList) {
        d.x += d.vx;
        d.y += d.vy;
        d.vy += 0.32; // Trọng lực rơi xuống
        d.rotation += d.rotSpeed;
        d.alpha = Math.max(0, d.alpha - 0.038);
      }
    }

    // Kết thúc animation
    if (this.tick >= this.totalTicks) {
      this.isComplete = true;
      if (this.onComplete) {
        this.onComplete();
      }
    }
  }

  private calculateFlightPosition(b: BoulderActor, p: number): { x: number; y: number } {
    // Gia tốc phóng (ease-in quad)
    const t = Math.min(1.0, Math.pow(p, 1.45));

    // Vị trí xuất phát từ điểm lơ lửng cuối Phase 1
    const startX = b.lastX;
    const startY = b.lastY;

    // Đường bay cong hình parabol nhẹ
    const linearX = startX + (this.targetX - startX) * t;
    const linearY = startY + (this.targetY - startY) * t;

    // Uốn cong cung bay: cao nhất ở giữa đường bay (p = 0.5)
    const arcHeight = Math.sin(p * Math.PI) * b.arcOffset;

    return {
      x: linearX,
      y: linearY + arcHeight,
    };
  }

  private spawnScatteredDebris(): void {
    const debrisFrames = [9, 10, 11, 12, 13];
    const debrisCount = 9; // 9 viên đá nhỏ bắn tung tóe

    for (let i = 0; i < debrisCount; i++) {
      const angle = (i / debrisCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 3.6 + Math.random() * 4.2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed * 0.7 - 2.8; // Bắn bổng lên một chút
      const frameIdx = debrisFrames[i % debrisFrames.length];

      this.debrisList.push({
        frameIdx,
        x: this.targetX + (Math.random() - 0.5) * 14,
        y: this.targetY + (Math.random() - 0.5) * 14,
        vx,
        vy,
        scale: 0.55 + Math.random() * 0.25,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.28,
        alpha: 1.0,
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D, _state: BattleState): void {
    if (!isLoaded(this.image)) return;

    ctx.save();

    // 1. Vẽ các hạt năng lượng cổ đại đang bay lên (Phase 1)
    if (this.energySpecks.length > 0) {
      for (const s of this.energySpecks) {
        ctx.fillStyle = `rgba(195, 140, 255, ${s.alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. Vẽ các tảng cự thạch (Phase 1 & 2)
    if (this.tick < 41) {
      const isSummoning = this.tick < 25;
      const summonProgress = Math.min(1.0, this.tick / 20.0);

      for (const b of this.boulders) {
        let posX = b.lastX;
        let posY = b.lastY;
        let scale = b.scale;
        let alpha = 1.0;

        if (isSummoning) {
          scale = b.scale * Math.min(1.0, 0.3 + summonProgress * 0.7);
          alpha = Math.min(1.0, summonProgress);
        } else {
          // Đang phóng bay tới mục tiêu
          const flightP = (this.tick - 25) / 15.0;
          const pos = this.calculateFlightPosition(b, flightP);
          posX = pos.x;
          posY = pos.y;

          // Vẽ vệt bay (trails / after-images)
          for (let hi = 0; hi < b.history.length; hi++) {
            const h = b.history[hi];
            const trailAlpha = h.alpha * (1 - (hi + 1) / (b.history.length + 1)) * 0.45;
            this.drawCell(
              ctx,
              b.frameOffset,
              h.x,
              h.y,
              scale * 0.9,
              b.rotAngle - hi * 0.1,
              trailAlpha
            );
          }
        }

        // Vẽ tảng đá chính
        const frameIdx = (b.frameOffset + Math.floor(this.tick / 5)) % 4;
        this.drawCell(ctx, frameIdx, posX, posY, scale, b.rotAngle, alpha);
      }
    }

    // 3. Vẽ hiệu ứng va chạm nổ vỡ vụn tại mục tiêu (Phase 3: Tick 41 -> 56)
    if (this.tick >= 41 && this.tick <= 56) {
      const impactTick = this.tick - 41;
      const crumbleFrame = 5 + Math.min(3, Math.floor(impactTick / 4)); // Frames 5, 6, 7, 8
      const impactAlpha = Math.max(0, 1.0 - impactTick / 16.0);
      this.drawCell(ctx, crumbleFrame, this.targetX, this.targetY, 0.95, 0, impactAlpha);
    }

    // 4. Vẽ các viên đá nhỏ văng ra xung quanh mục tiêu (Phase 3: Tick 41 -> 65)
    if (this.tick >= 41) {
      for (const d of this.debrisList) {
        if (d.alpha <= 0.02) continue;
        this.drawCell(ctx, d.frameIdx, d.x, d.y, d.scale, d.rotation, d.alpha);
      }
    }

    ctx.restore();
  }

  private drawCell(
    ctx: CanvasRenderingContext2D,
    cellIndex: number,
    x: number,
    y: number,
    scale: number,
    rotation: number,
    alpha: number
  ): void {
    if (cellIndex < 0 || cellIndex >= 14 || alpha <= 0.01) return;

    const cols = 5;
    const col = cellIndex % cols;
    const row = Math.floor(cellIndex / cols);

    const sx = col * this.cellW;
    const sy = row * this.cellH;

    const dw = Math.round(this.cellW * scale);
    const dh = Math.round(this.cellH * scale);

    ctx.save();
    ctx.globalAlpha = Math.min(1.0, Math.max(0, alpha));
    ctx.translate(Math.round(x), Math.round(y));
    if (rotation !== 0) {
      ctx.rotate(rotation);
    }
    ctx.drawImage(this.image, sx, sy, this.cellW, this.cellH, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }
}
