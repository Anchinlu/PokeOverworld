import type { GameRenderer } from '../rendering';
import { BERRY_STAGES } from '../maps/berry-data';
import type { BerryBushEntity } from '../maps/chunk';
import { showBerryToast } from './toast';

import { defaultRng } from '../core';

export function bindBerryPanel(renderer: GameRenderer): void {
  const selectBerryCycle = document.querySelector<HTMLSelectElement>('#selectBerryCycle');
  if (selectBerryCycle) {
    selectBerryCycle.addEventListener('change', (e) => {
      const sec = parseInt((e.target as HTMLSelectElement).value, 10) || 60;
      renderer.setBerryCycle(sec);
      showBerryToast(
        `⏱️ Đã đặt chu kỳ Berry: ${sec} giây (${(sec / 60).toFixed(1)} phút / vòng đời)`,
        '#c084fc'
      );
    });
  }

  const berryStageButtons = document.querySelectorAll<HTMLButtonElement>('.btn-berry-stage');
  berryStageButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      berryStageButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const st = btn.dataset.stage;
      if (st === 'auto') {
        renderer.setBerryStageOverride(null);
        showBerryToast('🔄 Chế độ Berry: Tự động phát triển theo thời gian thực', '#a855f7');
      } else {
        const stageNum = parseInt(st || '0', 10);
        renderer.setBerryStageOverride(stageNum);
        const stInfo = BERRY_STAGES[stageNum as 0 | 1 | 2 | 3];
        if (stInfo) {
          showBerryToast(
            `⚡ Ép xem giai đoạn: ${stInfo.icon} ${stInfo.name} (${stInfo.desc})`,
            '#38bdf8'
          );
        }
      }
    });
  });
}

export function interactWithBerryBush(bush: BerryBushEntity, renderer: GameRenderer): void {
  const now = Date.now();
  const cycleSec = renderer.getBerryCycle();
  const cycleMs = cycleSec * 1000;
  const elapsedMs = (((now - bush.plantedAt) % cycleMs) + cycleMs) % cycleMs;
  const progress = elapsedMs / cycleMs;
  const override = renderer.getBerryStageOverride();
  const stage =
    override !== null ? override : (Math.min(3, Math.floor(progress * 4)) as 0 | 1 | 2 | 3);

  if (stage === 3) {
    const count = defaultRng.nextInt(2, 4);
    showBerryToast(
      `🫐 Tuyệt vời! Bạn đã hái được ${count} quả ${bush.viName} (${bush.name})! [${bush.desc}]`,
      bush.color
    );
    bush.plantedAt = now;
  } else {
    const stageInfo = BERRY_STAGES[stage];
    const stageDurationMs = cycleMs / 4;
    const currentStageElapsedMs = elapsedMs % stageDurationMs;
    const remainingStageSec = Math.ceil((stageDurationMs - currentStageElapsedMs) / 1000);
    showBerryToast(
      `${stageInfo.icon} Bụi ${bush.viName} đang ở giai đoạn: ${stageInfo.name}. Còn ${remainingStageSec}s nữa sẽ lớn tiếp!`,
      '#38bdf8'
    );
  }
}
