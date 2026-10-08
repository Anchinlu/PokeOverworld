/**
 * Pokémon Stat Radar / Spider Web Chart Renderer
 * Visualizes authentic 6-axis stat distribution, IVs (0-31), EVs (0-252),
 * and Nature modifiers (+10% / -10%) on an interactive Canvas.
 */

import type { StatKey } from '@pokemon/shared-types';
import { NATURES_TABLE } from '@pokemon/shared-types';
import type { PartyPokemon } from '../domain/party/party-state';

export type RadarChartMode = 'stats' | 'ivs' | 'evs';

export interface RadarStatAxis {
  key: StatKey;
  nameVi: string;
  nameEn: string;
  angle: number; // in radians
}

export const RADAR_AXES: RadarStatAxis[] = [
  { key: 'hp', nameVi: 'HP', nameEn: 'HP', angle: -Math.PI / 2 },
  { key: 'attack', nameVi: 'CÔNG', nameEn: 'ATK', angle: -Math.PI / 6 },
  { key: 'defense', nameVi: 'THỦ', nameEn: 'DEF', angle: Math.PI / 6 },
  { key: 'speed', nameVi: 'TỐC ĐỘ', nameEn: 'SPD', angle: Math.PI / 2 },
  { key: 'spDef', nameVi: 'THỦ ĐB', nameEn: 'SPD', angle: (5 * Math.PI) / 6 },
  { key: 'spAtk', nameVi: 'CÔNG ĐB', nameEn: 'SPA', angle: (-5 * Math.PI) / 6 },
];

export interface RadarChartOptions {
  mode?: RadarChartMode;
  showLabels?: boolean;
}

/**
 * Draws the 6-axis Spider / Radar Chart for a given Pokémon.
 */
export function drawPokemonRadarChart(
  canvas: HTMLCanvasElement,
  pokemon: PartyPokemon,
  options: RadarChartOptions = {}
): void {
  const mode = options.mode ?? 'stats';
  const showLabels = options.showLabels !== false;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height / 2 + (showLabels ? 2 : 0);
  const maxRadius = Math.min(width, height) * 0.36;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  const natureData = NATURES_TABLE[pokemon.nature] ?? NATURES_TABLE.Hardy;

  // 1. Draw Background Concentric Hexagonal Rings (4 levels: 25%, 50%, 75%, 100%)
  const ringLevels = [0.25, 0.5, 0.75, 1.0];
  ctx.lineWidth = 1;

  for (const level of ringLevels) {
    const r = maxRadius * level;
    ctx.beginPath();
    for (let i = 0; i < RADAR_AXES.length; i++) {
      const ax = RADAR_AXES[i];
      const x = cx + r * Math.cos(ax.angle);
      const y = cy + r * Math.sin(ax.angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    if (level === 1.0) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    } else {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
    }
    ctx.stroke();
  }

  // 2. Draw 6 Radial Spokes (Axes)
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.lineWidth = 1;
  for (const ax of RADAR_AXES) {
    const x = cx + maxRadius * Math.cos(ax.angle);
    const y = cy + maxRadius * Math.sin(ax.angle);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  // 3. Calculate Polygon Vertices based on selected mode
  const points: { x: number; y: number; val: number; ratio: number; ax: RadarStatAxis }[] = [];

  // Determine max scale for stats mode
  let maxStatScale = 160;
  if (mode === 'stats') {
    const maxVal = Math.max(
      pokemon.stats.hp,
      pokemon.stats.attack,
      pokemon.stats.defense,
      pokemon.stats.spAtk,
      pokemon.stats.spDef,
      pokemon.stats.speed
    );
    maxStatScale = Math.max(140, Math.ceil(maxVal / 20) * 20);
  }

  for (const ax of RADAR_AXES) {
    let val = 0;
    let ratio = 0;

    if (mode === 'stats') {
      val = pokemon.stats[ax.key] ?? 50;
      ratio = Math.min(1.0, Math.max(0.1, val / maxStatScale));
    } else if (mode === 'ivs') {
      val = pokemon.ivs ? (pokemon.ivs[ax.key] ?? 31) : 31;
      ratio = Math.min(1.0, Math.max(0.1, val / 31));
    } else if (mode === 'evs') {
      val = pokemon.evs ? (pokemon.evs[ax.key] ?? 0) : 0;
      ratio = Math.min(1.0, Math.max(0.06, val / 252));
    }

    const r = maxRadius * ratio;
    const x = cx + r * Math.cos(ax.angle);
    const y = cy + r * Math.sin(ax.angle);
    points.push({ x, y, val, ratio, ax });
  }

  // 4. Fill and Stroke the Data Polygon
  if (points.length > 0) {
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      if (i === 0) ctx.moveTo(points[i].x, points[i].y);
      else ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();

    // Palette based on mode
    let fillColor = 'rgba(56, 189, 248, 0.35)';
    let strokeColor = '#38bdf8';

    if (mode === 'ivs') {
      fillColor = 'rgba(250, 204, 21, 0.35)'; // Amber gold for IVs
      strokeColor = '#facc15';
    } else if (mode === 'evs') {
      fillColor = 'rgba(34, 197, 94, 0.35)'; // Vibrant green for EVs
      strokeColor = '#22c55e';
    }

    ctx.fillStyle = fillColor;
    ctx.fill();

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw vertex dots
    for (const pt of points) {
      const isBuffed = natureData.increasedStat === pt.ax.key;
      const isNerfed = natureData.decreasedStat === pt.ax.key;

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);

      if (isBuffed) {
        ctx.fillStyle = '#ef4444'; // Red vertex for +10%
      } else if (isNerfed) {
        ctx.fillStyle = '#38bdf8'; // Cyan vertex for -10%
      } else {
        ctx.fillStyle = strokeColor;
      }

      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // 5. Draw Axis Labels and Nature Indicators
  if (showLabels) {
    ctx.font = 'bold 13px "VT323", monospace';
    ctx.textBaseline = 'middle';

    for (const pt of points) {
      const ax = pt.ax;
      const isBuffed = natureData.increasedStat === ax.key;
      const isNerfed = natureData.decreasedStat === ax.key;

      // Label offset slightly outward from outer ring
      const labelDist = maxRadius + 18;
      let lx = cx + labelDist * Math.cos(ax.angle);
      let ly = cy + labelDist * Math.sin(ax.angle);

      // Alignment adjustments based on horizontal position
      if (Math.abs(Math.cos(ax.angle)) < 0.2) {
        ctx.textAlign = 'center';
      } else if (Math.cos(ax.angle) > 0) {
        ctx.textAlign = 'left';
        lx += 2;
      } else {
        ctx.textAlign = 'right';
        lx -= 2;
      }

      // Vertical adjustments for top/bottom
      if (Math.sin(ax.angle) < -0.8) {
        ly -= 3;
      } else if (Math.sin(ax.angle) > 0.8) {
        ly += 4;
      }

      // Determine label text
      let natureTag = '';
      if (isBuffed) natureTag = ' ▲';
      else if (isNerfed) natureTag = ' ▼';

      let valueText = `${pt.val}`;
      if (mode === 'ivs') {
        valueText = `${pt.val}`;
      } else if (mode === 'evs') {
        valueText = `${pt.val}`;
      }

      const labelTitle = `${ax.nameVi}${natureTag}`;
      const labelSubtitle = `${valueText}`;

      // Pick text color
      if (isBuffed) {
        ctx.fillStyle = '#f87171'; // Red-orange for nature buff
      } else if (isNerfed) {
        ctx.fillStyle = '#67e8f9'; // Cyan for nature nerf
      } else {
        ctx.fillStyle = '#e2e8f0'; // Clean white
      }

      // Drop shadow for crisp readability
      ctx.shadowColor = '#000000';
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.shadowBlur = 0;

      // Draw title and value stacked
      ctx.fillText(labelTitle, lx, ly - 6);

      ctx.fillStyle = mode === 'ivs' && pt.val === 31 ? '#facc15' : '#cbd5e1';
      ctx.fillText(labelSubtitle, lx, ly + 6);
    }
  }
}
