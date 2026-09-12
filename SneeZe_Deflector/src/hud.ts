/* ==========================================================================
   PROJECT A.P.E.X. // UNIVERSAL IN-GAME HUD & STAGE CONTROL MANAGER
   ========================================================================== */

import { audio } from './audio';

export interface AppControllerInterface {
  restartCurrentStage: () => void;
  abortToHome: () => void;
  getCurrentView: () => string;
}

export class HUDManager {
  private controller: AppControllerInterface | null = null;
  private isBound: boolean = false;

  constructor() {}

  public init(controller: AppControllerInterface) {
    this.controller = controller;
    if (!this.isBound) {
      this.bindKeyboardShortcuts();
      this.bindButtonEvents();
      this.isBound = true;
    }
  }

  public updateVisibility(currentView: string) {
    const stageQuickControls = document.querySelector('#stage-quick-controls') as HTMLElement;
    const isStageView = ['STAGE_1', 'STAGE_2', 'STAGE_3', 'STAGE_4', 'STAGE_5'].includes(currentView);

    if (stageQuickControls) {
      stageQuickControls.style.display = isStageView ? 'flex' : 'none';
    }
  }

  private bindButtonEvents() {
    const btnRestart = document.querySelector('#btn-restart-stage');
    const btnAbort = document.querySelector('#btn-abort-home');

    btnRestart?.addEventListener('click', () => {
      this.triggerRestart();
    });

    btnAbort?.addEventListener('click', () => {
      this.triggerAbort();
    });
  }

  private bindKeyboardShortcuts() {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input element
      const activeElem = document.activeElement;
      if (activeElem && (activeElem.tagName === 'INPUT' || activeElem.tagName === 'TEXTAREA')) {
        return;
      }

      const currentView = this.controller?.getCurrentView();
      const isStageView = currentView && ['STAGE_1', 'STAGE_2', 'STAGE_3', 'STAGE_4', 'STAGE_5'].includes(currentView);

      if (!isStageView) return;

      // 'R' key for fast stage restart
      if (e.code === 'KeyR' || e.key.toLowerCase() === 'r') {
        e.preventDefault();
        this.triggerRestart();
      }

      // 'Escape' key for Home Page modal / confirmation
      if (e.code === 'Escape' || e.key === 'Escape') {
        e.preventDefault();
        this.triggerAbort();
      }
    });
  }

  public triggerRestart() {
    audio.playTick();
    const crt = document.querySelector('#crt-wrapper');

    // Screen glitch flash transition (100ms)
    crt?.classList.add('screen-glitch-flash');
    setTimeout(() => {
      crt?.classList.remove('screen-glitch-flash');
      if (this.controller) {
        this.controller.restartCurrentStage();
      }
    }, 100);
  }

  public triggerAbort() {
    audio.playClick();

    // 1-Click Confirmation Dialog
    const confirmed = confirm('⚠️ ABORT SESSION PROTOCOL:\nAre you sure you want to abort the current mission and return to the Home Splash Page?');
    if (confirmed) {
      audio.stopAll();
      if (this.controller) {
        this.controller.abortToHome();
      }
    }
  }
}

export const hud = new HUDManager();
