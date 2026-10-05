/**
 * Encounter Transition — Iris Pokéball & Screen Shake
 * Plays when player encounters a wild Pokémon in tall grass or initiates a battle:
 * 1. Screen Shake (0..350ms)
 * 2. Iris contracts into center, closing the overworld into black (0..850ms)
 * 3. Pokéball center button flashes (850..1150ms)
 * 4. Pokéball expands / zooms outward back to fullscreen with pure black inside (1150..1700ms)
 * 5. Handover seamlessly to BattleScreen without ever revealing the map.
 */

export interface EncounterTransitionOptions {
  onComplete: () => void;
  playerScreenPos?: { x: number; y: number };
}

export function playEncounterTransition(options: EncounterTransitionOptions): void {
  const { onComplete, playerScreenPos } = options;

  // 1. Screen Shake on canvas wrapper
  const canvasWrapper = document.querySelector<HTMLElement>('.canvas-wrapper') ?? document.body;
  canvasWrapper.classList.add('encounter-shaking');
  setTimeout(() => {
    canvasWrapper.classList.remove('encounter-shaking');
  }, 450);

  // 2. Create Fullscreen Overlay Canvas
  const overlayCanvas = document.createElement('canvas');
  overlayCanvas.id = 'encounterTransitionOverlay';
  overlayCanvas.style.position = 'fixed';
  overlayCanvas.style.inset = '0';
  overlayCanvas.style.width = '100vw';
  overlayCanvas.style.height = '100vh';
  overlayCanvas.style.zIndex = '9998';
  overlayCanvas.style.pointerEvents = 'none';

  const w = (overlayCanvas.width = window.innerWidth);
  const h = (overlayCanvas.height = window.innerHeight);
  document.body.appendChild(overlayCanvas);

  const ctx = overlayCanvas.getContext('2d');
  if (!ctx) {
    onComplete();
    overlayCanvas.remove();
    return;
  }

  // Center point for iris (defaults to screen center, or player's screen position)
  const cx = playerScreenPos?.x ?? Math.round(w / 2);
  const cy = playerScreenPos?.y ?? Math.round(h / 2);

  // Maximum radius to cover full screen from center
  const maxRadius = Math.sqrt(Math.max(cx, w - cx) ** 2 + Math.max(cy, h - cy) ** 2) + 40;
  const targetBallRadius = 70; // Final size of the centered Pokéball

  const startTime = performance.now();
  const closingDuration = 850; // ms for iris to close down to Pokéball
  const flashDuration = 280; // ms for central button glow flash
  const expandDuration = 550; // ms for Pokéball to zoom / expand outward into black
  const totalDuration = closingDuration + flashDuration + expandDuration;

  let completed = false;

  function render(now: number): void {
    const elapsed = now - startTime;

    ctx!.clearRect(0, 0, w, h);

    if (elapsed < closingDuration) {
      // Phase 1: Iris Closing (0 .. closingDuration)
      const t = Math.min(1.0, elapsed / closingDuration);
      // Smooth cubic easing
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      // Aperture shrinks all the way to 0 so the opening fully closes
      const apertureProgress = Math.min(1.0, ease * 1.12);
      const r = Math.max(0, maxRadius * (1 - apertureProgress));

      // 1. Draw outer 100% black mask
      ctx!.fillStyle = '#000000';
      ctx!.fillRect(0, 0, w, h);

      // 2. Cut out aperture showing game world while opening is still closing
      if (r > 0) {
        ctx!.save();
        ctx!.globalCompositeOperation = 'destination-out';
        ctx!.beginPath();
        ctx!.arc(cx, cy, r, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();

        // 3. Draw Pokéball borders around the shrinking iris circle
        drawPokeballIrisRing(ctx!, cx, cy, r);
      }

      // If aperture has closed before closingDuration ends, draw the solid Pokéball
      if (r <= 0) {
        drawSolidPokeball(ctx!, cx, cy, targetBallRadius);
      }

      requestAnimationFrame(render);
    } else if (elapsed < closingDuration + flashDuration) {
      // Phase 2: Closed Pokéball on 100% Solid Black with Glowing Button Flash
      const flashT = (elapsed - closingDuration) / flashDuration;

      // Solid 100% opaque black background — absolutely no map shows through
      ctx!.fillStyle = '#000000';
      ctx!.fillRect(0, 0, w, h);

      // Draw the solid Pokéball in the center
      drawSolidPokeball(ctx!, cx, cy, targetBallRadius);

      // Radiant Button Flash / Burst
      const btnR = targetBallRadius * 0.3;
      const flashIntensity = flashT < 0.4 ? (flashT / 0.4) * 1.0 : 1.0 - (flashT - 0.4) / 0.6;
      const glowR = btnR + flashIntensity * 120;

      ctx!.save();
      const radial = ctx!.createRadialGradient(cx, cy, 0, cx, cy, glowR);
      radial.addColorStop(0, `rgba(255, 255, 255, ${0.95 * flashIntensity})`);
      radial.addColorStop(0.3, `rgba(254, 240, 138, ${0.75 * flashIntensity})`);
      radial.addColorStop(0.7, `rgba(239, 68, 68, ${0.4 * flashIntensity})`);
      radial.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx!.fillStyle = radial;
      ctx!.beginPath();
      ctx!.arc(cx, cy, glowR, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.restore();

      requestAnimationFrame(render);
    } else if (elapsed < totalDuration) {
      // Phase 3: Pokéball zooms / expands outward back to fullscreen
      // Both inside and outside are 100% PURE BLACK (no map is ever revealed)
      const openT = (elapsed - (closingDuration + flashDuration)) / expandDuration;
      // Smooth cubic easing
      const ease = openT < 0.5 ? 4 * openT * openT * openT : 1 - Math.pow(-2 * openT + 2, 3) / 2;
      const r = targetBallRadius + ease * (maxRadius - targetBallRadius + 40);

      // Solid 100% opaque black background
      ctx!.fillStyle = '#000000';
      ctx!.fillRect(0, 0, w, h);

      // Draw the expanding Pokéball iris ring expanding outward across the black canvas
      drawPokeballIrisRing(ctx!, cx, cy, r);

      requestAnimationFrame(render);
    } else {
      // Phase 4: Seamless Handover to BattleScreen
      if (!completed) {
        completed = true;
        // Mount BattleScreen (it has z-index: 9999 and solid background: #000000)
        onComplete();

        // Remove overlay canvas cleanly once BattleScreen is active
        requestAnimationFrame(() => {
          overlayCanvas.remove();
        });
      }
    }
  }

  requestAnimationFrame(render);
}

function drawPokeballIrisRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number
): void {
  ctx.save();

  // Top Red half arc
  ctx.fillStyle = '#e11d48';
  ctx.beginPath();
  ctx.arc(cx, cy, r + 6, Math.PI, 0);
  ctx.arc(cx, cy, Math.max(0, r - 10), 0, Math.PI, true);
  ctx.closePath();
  ctx.fill();

  // Bottom White half arc
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, r + 6, 0, Math.PI);
  ctx.arc(cx, cy, Math.max(0, r - 10), Math.PI, 0, true);
  ctx.closePath();
  ctx.fill();

  // Black dividing band
  ctx.fillStyle = '#0f172a';
  const bandHeight = Math.max(6, r * 0.16);
  ctx.fillRect(cx - (r + 8), cy - bandHeight / 2, (r + 8) * 2, bandHeight);

  // Center button outer ring
  const btnRadius = Math.max(10, r * 0.28);
  ctx.beginPath();
  ctx.arc(cx, cy, btnRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  // Center button inner circle
  ctx.beginPath();
  ctx.arc(cx, cy, btnRadius * 0.65, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.restore();
}

function drawSolidPokeball(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.save();

  // Outer black border
  ctx.beginPath();
  ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  // Top red hemisphere
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0);
  ctx.fillStyle = '#e11d48';
  ctx.fill();

  // Bottom white hemisphere
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();

  // Black center belt
  const bandHeight = r * 0.18;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(cx - r, cy - bandHeight / 2, r * 2, bandHeight);

  // Center outer button ring
  const btnR = r * 0.3;
  ctx.beginPath();
  ctx.arc(cx, cy, btnR, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  // Center white button
  ctx.beginPath();
  ctx.arc(cx, cy, btnR * 0.65, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.restore();
}
