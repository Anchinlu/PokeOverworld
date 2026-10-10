/**
 * Pixel Evolution Notification Toast
 * Displays a retro pixel-styled notification banner when a Pokémon in the party
 * qualifies for evolution, featuring:
 * - Pokémon mini-icon frame with shiny indicator
 * - Pokémon name and target species
 * - Smooth depleting timer bar that auto-dismisses upon timeout
 * - Interactive [TIẾN HÓA ➔] button to launch evolution directly
 */

import type { PartyPokemon } from '../domain/party/party-state';
import { POKEMON_ASSETS } from '../assets';
import { battleSePlayer } from '../audio';
import {
  canPokemonEvolve,
  getAvailableEvolutions,
  type EvolutionRequirement,
} from '../domain/pokemon/evolution-rules';
import { partyService } from '../domain/party/party-service';
import { inventoryService } from '../domain/inventory/inventory-service';
import { pokemonCatalog } from '../data';
import { EvolutionScreen } from './evolution-screen';

export interface QueuedEvolutionNotification {
  pokemon: PartyPokemon;
  evolution: EvolutionRequirement;
  durationMs: number;
}

export class EvolutionNotificationManager {
  private static instance: EvolutionNotificationManager | null = null;
  private currentToastEl: HTMLElement | null = null;
  private queue: QueuedEvolutionNotification[] = [];
  private notifiedSignatures: Set<string> = new Set();
  private partyUnsub?: () => void;
  private inventoryUnsub?: () => void;

  // Timer state
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private remainingTime = 0;
  private totalDuration = 0;
  private lastTickTime = 0;
  private keyListener: ((e: KeyboardEvent) => void) | null = null;

  public static getInstance(): EvolutionNotificationManager {
    if (!EvolutionNotificationManager.instance) {
      EvolutionNotificationManager.instance = new EvolutionNotificationManager();
    }
    return EvolutionNotificationManager.instance;
  }

  /**
   * Initializes automatic listeners on partyService and inventoryService
   */
  public init(): void {
    if (this.partyUnsub) return;

    this.partyUnsub = partyService.subscribe(() => {
      this.checkParty();
    });

    this.inventoryUnsub = inventoryService.subscribe(() => {
      this.checkParty();
    });

    // Initial check
    this.checkParty();
  }

  /**
   * Scans current party and enqueues notification for any Pokémon meeting evolution criteria
   */
  public checkParty(): void {
    if (typeof document === 'undefined') return;

    // Avoid popping up during full-screen evolution animation or active battle
    if (document.querySelector('.evolution-screen-overlay[style*="flex"]')) return;
    if (document.querySelector('.battle-screen-overlay')) return;

    const party = partyService.getParty();
    for (const pk of party) {
      if (!pk) continue;
      const check = canPokemonEvolve(pk);
      if (check.canEvolve && check.evolution) {
        const evos = getAvailableEvolutions(pk);
        const targetEvo = evos[0] || check.evolution;
        const sig = `${pk.uid}_lv${pk.level}_${targetEvo.targetSpeciesKey}`;
        if (!this.notifiedSignatures.has(sig)) {
          this.notifiedSignatures.add(sig);
          this.enqueue(pk, targetEvo);
        }
      }
    }
  }

  /**
   * Enqueues a notification to be displayed
   */
  public enqueue(
    pokemon: PartyPokemon,
    evolution?: EvolutionRequirement,
    durationMs = 7000
  ): void {
    const evo = evolution || getAvailableEvolutions(pokemon)[0];
    if (!evo) return;

    // Check if already active or queued for this exact pokemon
    if (
      this.currentToastEl &&
      this.currentToastEl.dataset.pokemonUid === pokemon.uid
    ) {
      return;
    }
    const alreadyQueued = this.queue.some((q) => q.pokemon.uid === pokemon.uid);
    if (alreadyQueued) return;

    this.queue.push({ pokemon, evolution: evo, durationMs });
    if (!this.currentToastEl) {
      this.showNext();
    }
  }

  /**
   * Immediately displays the notification, bypassing queue
   */
  public showNotification(
    pokemon: PartyPokemon,
    evolution?: EvolutionRequirement,
    durationMs = 7000
  ): void {
    const evo = evolution || getAvailableEvolutions(pokemon)[0];
    if (!evo) return;

    const sig = `${pokemon.uid}_lv${pokemon.level}_${evo.targetSpeciesKey}`;
    this.notifiedSignatures.add(sig);

    this.dismissCurrent(false);
    this.renderToast(pokemon, evo, durationMs);
  }

  private showNext(): void {
    if (this.queue.length === 0) return;
    const next = this.queue.shift();
    if (!next) return;
    this.renderToast(next.pokemon, next.evolution, next.durationMs);
  }

  private renderToast(
    pokemon: PartyPokemon,
    evolution: EvolutionRequirement,
    durationMs: number
  ): void {
    if (typeof document === 'undefined') return;

    this.dismissCurrent(false);

    const targetSpecies = pokemonCatalog.getBySpeciesKey(evolution.targetSpeciesKey);
    const targetName = targetSpecies?.name || evolution.targetSpeciesKey;
    const pkName = pokemon.nickname || pokemon.name;
    const iconUrl = POKEMON_ASSETS.getIconSprite(pokemon.speciesKey, pokemon.isShiny);

    const toast = document.createElement('div');
    toast.id = 'evolutionNotificationToast';
    toast.className = 'evolution-notify-toast';
    toast.dataset.pokemonUid = pokemon.uid;

    toast.innerHTML = `
      <button class="evo-notify-btn-close" id="btnEvoNotifyClose" title="Bỏ qua thông báo">
        ✕
      </button>
      <div class="evo-notify-body">
        <div class="evo-notify-icon-frame">
          <img class="evo-notify-pk-icon" src="${iconUrl}" alt="${pkName}" />
          ${pokemon.isShiny ? '<span class="evo-notify-shiny-star" title="Shiny">✦</span>' : ''}
        </div>
        <div class="evo-notify-info">
          <div class="evo-notify-title">
            <span>TIẾN HÓA KHẢ DỤNG</span>
          </div>
          <div class="evo-notify-msg" title="${pkName} có thể tiến hóa thành ${targetName}!">
            <span class="evo-notify-pk-name">${pkName}</span> có thể tiến hóa thành <span class="evo-notify-target-name">${targetName}</span>!
          </div>
        </div>
        <div class="evo-notify-actions">
          <button class="evo-notify-btn-evolve" id="btnEvoNotifyAction" title="Tiến hóa ngay bây giờ! (Nhấn phím R)">
            TIẾN HÓA <span class="evo-key-hint">R</span>
          </button>
        </div>
      </div>
      <div class="evo-notify-timer-track">
        <div class="evo-notify-timer-bar" id="evoNotifyTimerBar" style="width: 100%;"></div>
      </div>
    `;

    document.body.appendChild(toast);
    this.currentToastEl = toast;

    // Play retro evolution notification sound effect
    battleSePlayer.playSound('Audio/SE/Evolution start.ogg', 0.85);

    // Setup action buttons
    const btnEvolve = toast.querySelector<HTMLButtonElement>('#btnEvoNotifyAction');
    const btnClose = toast.querySelector<HTMLButtonElement>('#btnEvoNotifyClose');
    const timerBar = toast.querySelector<HTMLElement>('#evoNotifyTimerBar');

    const triggerEvolution = () => {
      this.dismissCurrent(true);
      EvolutionScreen.getInstance().open(pokemon, evolution);
    };

    if (btnEvolve) {
      btnEvolve.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerEvolution();
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dismissCurrent(true);
      });
    }

    // Optional click on toast body directly opens evolution
    toast.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('#btnEvoNotifyClose')) return;
      triggerEvolution();
    });

    // Invisible keyboard shortcut 'R' to evolve without displaying any prompt
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        triggerEvolution();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', onKeydown);
      this.keyListener = onKeydown;
    }

    // Start timer countdown (continues running steadily even when hovered as requested)
    this.totalDuration = Math.max(1000, durationMs);
    this.remainingTime = this.totalDuration;
    this.lastTickTime = performance.now();

    this.timerInterval = setInterval(() => {
      if (!this.currentToastEl) {
        this.clearTimer();
        return;
      }
      const now = performance.now();
      const delta = now - this.lastTickTime;
      this.lastTickTime = now;

      this.remainingTime = Math.max(0, this.remainingTime - delta);
      const pct = Math.max(0, Math.min(100, (this.remainingTime / this.totalDuration) * 100));
      if (timerBar) {
        timerBar.style.width = `${pct}%`;
      }

      if (this.remainingTime <= 0) {
        this.dismissCurrent(true);
      }
    }, 40);
  }

  private clearTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.keyListener) {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', this.keyListener);
      }
      this.keyListener = null;
    }
  }

  /**
   * Dismisses the currently displayed notification toast
   */
  public dismissCurrent(animate = true): void {
    this.clearTimer();
    const toast = this.currentToastEl;
    this.currentToastEl = null;

    if (!toast) {
      if (animate && this.queue.length > 0) {
        setTimeout(() => this.showNext(), 200);
      }
      return;
    }

    if (animate) {
      toast.classList.add('dismissing');
      setTimeout(() => {
        if (toast.parentElement) {
          toast.parentElement.removeChild(toast);
        }
        if (this.queue.length > 0) {
          this.showNext();
        }
      }, 250);
    } else {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }
  }

  /**
   * Resets internal notification state (for testing or debugging)
   */
  public resetNotified(): void {
    this.notifiedSignatures.clear();
  }

  /**
   * Cleanup all listeners and active elements
   */
  public destroy(): void {
    this.clearTimer();
    if (this.currentToastEl?.parentElement) {
      this.currentToastEl.parentElement.removeChild(this.currentToastEl);
    }
    this.currentToastEl = null;
    this.queue = [];
    this.notifiedSignatures.clear();

    if (this.partyUnsub) {
      this.partyUnsub();
      this.partyUnsub = undefined;
    }
    if (this.inventoryUnsub) {
      this.inventoryUnsub();
      this.inventoryUnsub = undefined;
    }
    EvolutionNotificationManager.instance = null;
  }
}

export function initEvolutionNotification(): EvolutionNotificationManager {
  const instance = EvolutionNotificationManager.getInstance();
  instance.init();
  return instance;
}

export function checkPartyEvolutionNotifications(): void {
  EvolutionNotificationManager.getInstance().checkParty();
}

export function showEvolutionNotification(
  pokemon: PartyPokemon,
  evolution?: EvolutionRequirement,
  durationMs?: number
): void {
  EvolutionNotificationManager.getInstance().showNotification(pokemon, evolution, durationMs);
}
