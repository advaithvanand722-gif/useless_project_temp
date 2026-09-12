/* ==========================================================================
   PROJECT A.P.E.X. // CENTRALIZED SESSION STATE MACHINE & WATCHDOG ENGINE
   ========================================================================== */

import { audio } from './audio';
import { hud } from './hud';
import { CanvasRenderer } from './graphics';
import { Stage1Module } from './stages/stage1';
import { Stage2Module } from './stages/stage2';
import { Stage3Module } from './stages/stage3';
import { Stage4Module } from './stages/stage4';
import { Stage5Module } from './stages/stage5';
import { StageLoadingModule } from './stages/stageLoading';
import { RevealModule } from './reveal';

export type AppView =
  | 'HOME'
  | 'STAGE_1'
  | 'STAGE_2'
  | 'STAGE_3'
  | 'STAGE_4'
  | 'STAGE_5'
  | 'LOADING_20S'
  | 'REVEAL';

export class AppController {
  private currentView: AppView = 'HOME';
  private currentModuleInstance: { destroy?: () => void } | null = null;
  private canvasRenderer: CanvasRenderer | null = null;
  private isCrtEnabled: boolean = true;

  // Global 10-Minute Watchdog Timer Engine (600 Seconds)
  private globalTimeLeftSec: number = 600.0;
  private watchdogAnimFrame: number | null = null;
  private isWatchdogActive: boolean = false;

  constructor() {
    this.initCanvas();
    this.initClock();
    this.bindHeaderControls();
    hud.init(this);
    this.renderView('HOME');
  }

  public getCurrentView(): AppView {
    return this.currentView;
  }

  public deductGlobalTime(sec: number) {
    this.globalTimeLeftSec = Math.max(0, this.globalTimeLeftSec - sec);
  }

  private initCanvas() {
    const canvas = document.querySelector('#bg-canvas') as HTMLCanvasElement;
    if (canvas) {
      this.canvasRenderer = new CanvasRenderer(canvas);
      this.canvasRenderer.start();
    }
  }

  private initClock() {
    const clockElem = document.querySelector('#sys-clock');
    const updateClock = () => {
      if (clockElem) {
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');
        const ms = String(now.getMilliseconds()).padStart(3, '0');
        clockElem.textContent = `${hrs}:${mins}:${secs}.${ms}`;
      }
      requestAnimationFrame(updateClock);
    };
    requestAnimationFrame(updateClock);
  }

  private bindHeaderControls() {
    const audioBtn = document.querySelector('#btn-audio-toggle');
    const audioText = document.querySelector('#audio-status-text');

    audioBtn?.addEventListener('click', () => {
      audio.init();
      const isMuted = audio.toggleMute();
      if (audioText) {
        audioText.textContent = isMuted ? 'AUDIO: OFF' : 'AUDIO: ON';
      }
    });

    const crtBtn = document.querySelector('#btn-crt-toggle');
    const crtText = document.querySelector('#crt-status-text');
    const crtWrapper = document.querySelector('#crt-wrapper');

    crtBtn?.addEventListener('click', () => {
      audio.playClick();
      this.isCrtEnabled = !this.isCrtEnabled;
      if (crtWrapper) {
        if (this.isCrtEnabled) {
          crtWrapper.classList.remove('no-crt');
          if (crtText) crtText.textContent = 'CRT: FX ON';
        } else {
          crtWrapper.classList.add('no-crt');
          if (crtText) crtText.textContent = 'CRT: FX OFF';
        }
      }
    });

    // Lazy init audio on first touch
    const initOnFirstTouch = () => {
      audio.init();
      window.removeEventListener('click', initOnFirstTouch);
      window.removeEventListener('keydown', initOnFirstTouch);
    };
    window.addEventListener('click', initOnFirstTouch);
    window.addEventListener('keydown', initOnFirstTouch);
  }

  // --------------------------------------------------------------------------
  // GLOBAL 10-MINUTE WATCHDOG TIMEOUT ENGINE
  // --------------------------------------------------------------------------
  private startGlobalSessionTimer() {
    this.stopGlobalSessionTimer();
    this.globalTimeLeftSec = 600.0; // 10 minutes total (600s)
    this.isWatchdogActive = true;

    const hudBox = document.querySelector('#watchdog-hud-box') as HTMLElement;
    if (hudBox) hudBox.style.display = 'flex';

    let lastTime = performance.now();

    const loop = (now: number) => {
      if (!this.isWatchdogActive) return;

      const delta = (now - lastTime) / 1000;
      lastTime = now;

      this.globalTimeLeftSec = Math.max(0, this.globalTimeLeftSec - delta);

      // Format MM:SS.ms
      const mins = Math.floor(this.globalTimeLeftSec / 60);
      const secs = Math.floor(this.globalTimeLeftSec % 60);
      const ms = Math.floor((this.globalTimeLeftSec % 1) * 100);

      const strMins = String(mins).padStart(2, '0');
      const strSecs = String(secs).padStart(2, '0');
      const strMs = String(ms).padStart(2, '0');

      const clockElem = document.querySelector('#global-watchdog-clock') as HTMLElement;
      if (clockElem) {
        clockElem.textContent = `${strMins}:${strSecs}.${strMs}`;
        if (this.globalTimeLeftSec < 60) {
          clockElem.style.color = 'var(--alert-red)';
          clockElem.classList.add('pulse-dot');
        } else {
          clockElem.style.color = 'var(--amber)';
          clockElem.classList.remove('pulse-dot');
        }
      }

      if (this.globalTimeLeftSec <= 0) {
        this.triggerWatchdogTimeout();
        return;
      }

      this.watchdogAnimFrame = requestAnimationFrame(loop);
    };

    this.watchdogAnimFrame = requestAnimationFrame(loop);
  }

  private stopGlobalSessionTimer() {
    this.isWatchdogActive = false;
    if (this.watchdogAnimFrame) {
      cancelAnimationFrame(this.watchdogAnimFrame);
      this.watchdogAnimFrame = null;
    }
    const hudBox = document.querySelector('#watchdog-hud-box') as HTMLElement;
    if (hudBox) hudBox.style.display = 'none';
  }

  private triggerWatchdogTimeout() {
    audio.playErrorBuzz();
    audio.stopAll();

    // Fullscreen purge alert
    const alertOverlay = document.createElement('div');
    alertOverlay.style.position = 'fixed';
    alertOverlay.style.top = '0';
    alertOverlay.style.left = '0';
    alertOverlay.style.width = '100vw';
    alertOverlay.style.height = '100vh';
    alertOverlay.style.background = 'rgba(255, 0, 85, 0.95)';
    alertOverlay.style.color = '#ffffff';
    alertOverlay.style.zIndex = '999999';
    alertOverlay.style.display = 'flex';
    alertOverlay.style.flexDirection = 'column';
    alertOverlay.style.justifyContent = 'center';
    alertOverlay.style.alignItems = 'center';
    alertOverlay.style.fontFamily = "'Orbitron', sans-serif";
    alertOverlay.style.textAlign = 'center';
    alertOverlay.style.padding = '20px';

    alertOverlay.innerHTML = `
      <h1 style="font-size: 3rem; margin-bottom: 12px; text-shadow: 0 0 20px #000;">⚠️ SESSION TERMINATED</h1>
      <h2 style="font-size: 1.5rem; letter-spacing: 2px;">RUNTIME EXCEEDED MAXIMUM 10 MINUTES SAFETY LIMIT</h2>
      <p style="margin-top: 20px; font-family: 'Share Tech Mono', monospace;">SYSTEM PURGED // RETURNING TO HOME CLEARANCE</p>
    `;

    document.body.appendChild(alertOverlay);

    setTimeout(() => {
      alertOverlay.remove();
      this.abortToHome();
    }, 3500);
  }

  // --------------------------------------------------------------------------
  // CENTRALIZED VIEW MANAGEMENT & STAGE ROUTING
  // --------------------------------------------------------------------------
  public renderView(view: AppView) {
    if (this.currentModuleInstance?.destroy) {
      this.currentModuleInstance.destroy();
      this.currentModuleInstance = null;
    }

    this.currentView = view;
    hud.updateVisibility(view);

    const container = document.querySelector('#stage-container') as HTMLElement;
    if (!container) return;

    const stepIndicator = document.querySelector('#stage-step-indicator');
    const statusMsg = document.querySelector('#footer-status');

    // Restore canvas and CRT background state
    const crtWrapper = document.querySelector('#crt-wrapper') as HTMLElement;
    if (crtWrapper && view !== 'REVEAL') {
      crtWrapper.classList.remove('no-crt');
      crtWrapper.style.background = '';
    }
    const bgCanvas = document.querySelector('#bg-canvas') as HTMLElement;
    if (bgCanvas && view !== 'REVEAL') {
      bgCanvas.style.display = 'block';
    }

    switch (view) {
      case 'HOME':
        this.stopGlobalSessionTimer();
        if (stepIndicator) stepIndicator.textContent = 'MAINFRAME HOME';
        if (statusMsg) statusMsg.textContent = 'CLASSIFIED ACCESS // READY FOR OPERATOR INITIALIZATION';
        this.renderHome(container);
        break;

      case 'STAGE_1':
        if (stepIndicator) stepIndicator.textContent = 'STAGE [ 1 / 5 ]';
        if (statusMsg) statusMsg.textContent = 'PROTOCOL 01: LISSAJOUS RESONANCE LOCK';
        this.currentModuleInstance = new Stage1Module(container, () => this.nextStage());
        (this.currentModuleInstance as Stage1Module).render();
        break;

      case 'STAGE_2':
        if (stepIndicator) stepIndicator.textContent = 'STAGE [ 2 / 5 ]';
        if (statusMsg) statusMsg.textContent = 'PROTOCOL 02: REVERSE CRYPTOGRAPHIC HEX-MATRIX';
        this.canvasRenderer?.setGlitch(0.5);
        this.currentModuleInstance = new Stage2Module(
          container,
          () => this.nextStage(),
          (sec) => this.deductGlobalTime(sec)
        );
        (this.currentModuleInstance as Stage2Module).render();
        break;

      case 'STAGE_3':
        if (stepIndicator) stepIndicator.textContent = 'STAGE [ 3 / 5 ]';
        if (statusMsg) statusMsg.textContent = 'PROTOCOL 03: KINETIC SUB-ATOMIC PATCHBAY';
        this.canvasRenderer?.setGlitch(0.6);
        this.currentModuleInstance = new Stage3Module(container, () => this.nextStage());
        (this.currentModuleInstance as Stage3Module).render();
        break;

      case 'STAGE_4':
        if (stepIndicator) stepIndicator.textContent = 'STAGE [ 4 / 5 ]';
        if (statusMsg) statusMsg.textContent = 'PROTOCOL 04: COGNITIVE SINGULARITY DECRYPTION (3D ICOSAHEDRON)';
        this.canvasRenderer?.setGlitch(0.8);
        this.currentModuleInstance = new Stage4Module(container, () => this.nextStage());
        (this.currentModuleInstance as Stage4Module).render();
        break;

      case 'STAGE_5':
        if (stepIndicator) stepIndicator.textContent = 'STAGE [ 5 / 5 ]';
        if (statusMsg) statusMsg.textContent = 'PROTOCOL 05: VOLATILE REACTOR GOVERNOR';
        this.canvasRenderer?.setGlitch(1.2);
        this.currentModuleInstance = new Stage5Module(container, () => this.nextStage());
        (this.currentModuleInstance as Stage5Module).render();
        break;

      case 'LOADING_20S':
        if (stepIndicator) stepIndicator.textContent = 'PAYLOAD EXTRACTION';
        if (statusMsg) statusMsg.textContent = 'PAYLOAD EXTRACTION: SYNTHESIZING RETINAL REVELATION';
        this.canvasRenderer?.setGlitch(1.5);
        this.currentModuleInstance = new StageLoadingModule(container, () => this.nextStage());
        (this.currentModuleInstance as StageLoadingModule).render();
        break;

      case 'REVEAL':
        this.stopGlobalSessionTimer();
        if (stepIndicator) stepIndicator.textContent = 'PAYLOAD REVEALED';
        if (statusMsg) statusMsg.textContent = 'SYSTEM DISCHARGE COMPLETE // PAYLOAD UNLOCKED';
        this.currentModuleInstance = new RevealModule(container, () => this.abortToHome());
        (this.currentModuleInstance as RevealModule).render();
        break;
    }
  }

  // --------------------------------------------------------------------------
  // HOME PAGE RENDERER
  // --------------------------------------------------------------------------
  private renderHome(container: HTMLElement) {
    container.innerHTML = `
      <div class="stage-card" style="max-width: 860px; text-align: center; padding: 36px; animation: fadeIn 0.5s ease-out;">
        <div style="display: flex; justify-content: center; align-items: center; gap: 12px; margin-bottom: 12px;">
          <span class="pulse-dot" style="width: 14px; height: 14px;"></span>
          <span class="stage-badge" style="background: rgba(255,0,85,0.2); border-color: var(--alert-red); color: var(--alert-red);">
            CLASSIFIED LEVEL 5 CLEARANCE
          </span>
        </div>

        <h1 style="font-family: var(--font-title); font-size: 2.2rem; color: #fff; text-shadow: 0 0 15px var(--cyan); letter-spacing: 3px; margin-bottom: 8px;">
          PROJECT A.P.E.X. // CLASSIFIED MAINFRAME ACCESS
        </h1>

        <div style="font-family: var(--font-hud); font-size: 1.1rem; color: var(--amber); letter-spacing: 2px; margin-bottom: 24px; font-weight: bold;">
          ⚠️ SECURITY PROTOCOL ACTIVE. MAXIMUM RUNTIME: 10:00 MINUTES.
        </div>

        <div style="background: rgba(0,0,0,0.6); border: 1px solid var(--cyan); padding: 20px; text-align: left; font-size: 0.95rem; line-height: 1.6; margin-bottom: 28px; clip-path: polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px);">
          <div style="font-family: var(--font-title); font-size: 1rem; color: var(--cyan); margin-bottom: 8px; font-weight: bold;">
            📋 MISSION BRIEFING PROTOCOLS:
          </div>
          <ul style="padding-left: 20px; color: var(--text-main);">
            <li style="margin-bottom: 6px;"><strong>Protocol 01:</strong> Lock chaotic 3D Lissajous waveforms into a Golden Circle.</li>
            <li style="margin-bottom: 6px;"><strong>Protocol 02:</strong> Decode encrypted hex matrix sequence in <u>REVERSE</u> order.</li>
            <li style="margin-bottom: 6px;"><strong>Protocol 03:</strong> Connect 3 kinetic power hubs to orbiting targets without line collisions.</li>
            <li style="margin-bottom: 6px;"><strong>Protocol 04:</strong> Rotate 3D icosahedron to locate and neutralise anomalous vertices.</li>
            <li style="margin-bottom: 6px;"><strong>Protocol 05:</strong> Spam 'J'/'K' combo to govern volatile reactor pressure in 88%-94% band.</li>
            <li style="margin-top: 10px; color: var(--alert-red);"><strong>Watchdog Rule:</strong> Complete all 5 protocols before the persistent 10-minute global purge timer expires!</li>
          </ul>
        </div>

        <button id="btn-enter-apex" class="charge-btn-mega" style="font-size: 1.3rem; padding: 18px 36px;">
          ⚡ INITIALIZE QUANTUM TERMINAL & ENTER ⚡
        </button>
      </div>
    `;

    const btnEnter = container.querySelector('#btn-enter-apex');
    btnEnter?.addEventListener('click', () => {
      audio.init();
      audio.playSuccess();
      this.startGlobalSessionTimer();
      this.renderView('STAGE_1');
    });
  }

  // --------------------------------------------------------------------------
  // ROUTING HELPER FUNCTIONS
  // --------------------------------------------------------------------------
  public restartCurrentStage() {
    this.renderView(this.currentView);
  }

  public nextStage() {
    switch (this.currentView) {
      case 'STAGE_1': this.renderView('STAGE_2'); break;
      case 'STAGE_2': this.renderView('STAGE_3'); break;
      case 'STAGE_3': this.renderView('STAGE_4'); break;
      case 'STAGE_4': this.renderView('STAGE_5'); break;
      case 'STAGE_5': this.renderView('LOADING_20S'); break;
      case 'LOADING_20S': this.renderView('REVEAL'); break;
      default: this.renderView('HOME'); break;
    }
  }

  public abortToHome() {
    audio.stopAll();
    this.stopGlobalSessionTimer();
    this.renderView('HOME');
  }
}

// Bootstrap application on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  new AppController();
});
