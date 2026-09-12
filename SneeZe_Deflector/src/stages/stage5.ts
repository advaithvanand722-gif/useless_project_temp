/* ==========================================================================
   STAGE 5: VOLATILE REACTOR GOVERNOR
   ========================================================================== */

import { audio } from '../audio';

export class Stage5Module {
  private container: HTMLElement;
  private onComplete: () => void;
  private animFrame: number | null = null;

  private pressure: number = 40.0; // Current pressure (0% to 100%)
  private holdTimer: number = 0; // Target: 7 continuous seconds in 88%-94% band
  private isCompleted: boolean = false;

  private lastKey: string = '';

  constructor(container: HTMLElement, onComplete: () => void) {
    this.container = container;
    this.onComplete = onComplete;
  }

  public render() {
    this.container.innerHTML = `
      <div class="stage-card stage-hype-card">
        <div class="stage-header">
          <div class="stage-title-wrap">
            <h2 style="color: var(--alert-red); text-shadow: 0 0 15px var(--alert-red);">
              STAGE 5 // VOLATILE REACTOR GOVERNOR
            </h2>
            <div class="stage-subtitle" style="color: var(--amber);">
              CRITICAL EMERGENCY // HOLD PRESSURE IN NARROW EQUILIBRIUM BAND (88% - 94%) FOR 7 SECONDS
            </div>
          </div>
          <div class="stage-badge" style="background: rgba(255,0,85,0.3); border-color: var(--alert-red); color: #fff;">
            FINAL GOVERNOR
          </div>
        </div>

        <div class="stage-instruction" style="border-left-color: var(--alert-red); background: rgba(255,0,85,0.1);">
          🚨 <strong>THERMAL SINGULARITY IMMINENT:</strong> Core pressure decays constantly and spikes randomly! <strong>SPAM ALTERNATING 'J' / 'K' KEYS OR TAP THE GOVERNOR BUTTONS</strong> to hold core pressure inside the narrow <strong>88% - 94% EQUILIBRIUM BAND</strong> for 7 continuous seconds!
        </div>

        <!-- Reactor Gauge HUD -->
        <div style="display: flex; flex-direction: column; align-items: center; gap: 16px; margin: 10px 0;">
          <!-- Big Pressure Number -->
          <div style="font-family: var(--font-title); font-size: 3.5rem; font-weight: 900;" id="s5-pressure-num">
            40.0%
          </div>

          <!-- Pressure Meter with 88-94% Target Band Highlight -->
          <div style="width: 100%; height: 36px; background: #000; border: 2px solid var(--alert-red); position: relative; overflow: hidden;">
            <!-- Target Band Highlight -->
            <div style="position: absolute; left: 88%; width: 6%; height: 100%; background: rgba(0, 255, 102, 0.4); border-left: 2px solid var(--green); border-right: 2px solid var(--green); z-index: 2;"></div>

            <!-- Current Level Bar -->
            <div id="s5-pressure-bar" style="height: 100%; width: 40%; background: linear-gradient(90deg, var(--cyan), var(--amber), var(--alert-red)); transition: width 0.05s linear;"></div>

            <!-- Text Overlay -->
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; font-family: var(--font-hud); font-weight: bold; color: #fff; text-shadow: 0 0 4px #000; z-index: 3;">
              EQUILIBRIUM TARGET BAND [ 88.0% --- 94.0% ]
            </div>
          </div>

          <!-- Alternating Combo Keys Display -->
          <div style="display: flex; gap: 16px;">
            <button id="btn-press-j" class="cyber-btn btn-danger" style="font-size: 1.2rem; padding: 12px 24px;">
              <span>KEY 'J' / LEFT ⬅️</span>
            </button>
            <button id="btn-press-k" class="cyber-btn btn-success" style="font-size: 1.2rem; padding: 12px 24px;">
              <span>KEY 'K' / RIGHT ➡️</span>
            </button>
          </div>
        </div>

        <!-- Meter Hold Progress -->
        <div class="meter-box">
          <div class="meter-label-row">
            <span>CRITICAL EQUILIBRIUM STABILITY HOLD TIMER:</span>
            <span id="s5-hold-text" style="color: var(--amber);">0.0s / 7.0s</span>
          </div>
          <div class="meter-bar-outer">
            <div class="meter-bar-inner" id="s5-hold-bar" style="width: 0%;"></div>
          </div>
        </div>
      </div>
    `;

    audio.startSiren();
    audio.startEpicRiser(20);

    const crt = document.querySelector('#crt-wrapper');
    crt?.classList.add('screen-shake');

    this.bindEvents();
    this.startGovernorLoop();
  }

  private bindEvents() {
    const btnJ = this.container.querySelector('#btn-press-j');
    const btnK = this.container.querySelector('#btn-press-k');

    btnJ?.addEventListener('click', () => this.applyBoost('j'));
    btnK?.addEventListener('click', () => this.applyBoost('k'));

    window.addEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (key === 'j' || e.code === 'ArrowLeft') {
      e.preventDefault();
      this.applyBoost('j');
    } else if (key === 'k' || e.code === 'ArrowRight') {
      e.preventDefault();
      this.applyBoost('k');
    }
  };

  private applyBoost(key: string) {
    if (this.isCompleted) return;

    // Alternating key bonus
    let amount = 3.5;
    if (this.lastKey !== '' && this.lastKey !== key) {
      amount = 5.2; // Bonus boost for alternating J and K
    }
    this.lastKey = key;

    this.pressure = Math.min(100, this.pressure + amount);
    audio.playTick();

    // Visual button flash
    const btn = key === 'j' ? this.container.querySelector('#btn-press-j') : this.container.querySelector('#btn-press-k');
    btn?.classList.add('pulse-dot');
    setTimeout(() => btn?.classList.remove('pulse-dot'), 100);
  }

  private startGovernorLoop() {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (!this.isCompleted) {
        // Continuous decay towards 0%
        this.pressure = Math.max(0, this.pressure - delta * 18.0);

        // Random surge spikes towards 100%
        if (Math.random() < 0.08) {
          this.pressure = Math.min(100, this.pressure + (Math.random() * 12.0));
        }

        // Check if inside 88% - 94% equilibrium band
        const inBand = this.pressure >= 88.0 && this.pressure <= 94.0;

        if (inBand) {
          this.holdTimer += delta;
        } else {
          this.holdTimer = Math.max(0, this.holdTimer - delta * 1.5);
        }

        // Update DOM
        const numElem = this.container.querySelector('#s5-pressure-num') as HTMLElement;
        const barElem = this.container.querySelector('#s5-pressure-bar') as HTMLElement;
        const holdBar = this.container.querySelector('#s5-hold-bar') as HTMLElement;
        const holdText = this.container.querySelector('#s5-hold-text');

        if (numElem) {
          numElem.textContent = `${this.pressure.toFixed(1)}%`;
          numElem.style.color = inBand ? 'var(--green)' : (this.pressure > 94 ? 'var(--alert-red)' : 'var(--cyan)');
        }
        if (barElem) barElem.style.width = `${this.pressure}%`;

        const pct = Math.min(100, (this.holdTimer / 7.0) * 100);
        if (holdBar) holdBar.style.width = `${pct}%`;
        if (holdText) {
          holdText.textContent = inBand ? `HOLDING EQUILIBRIUM: ${(this.holdTimer).toFixed(1)}s / 7.0s` : `${this.holdTimer.toFixed(1)}s / 7.0s`;
          holdText.style.color = inBand ? 'var(--green)' : 'var(--amber)';
        }

        if (this.holdTimer >= 7.0) {
          this.isCompleted = true;
          this.triggerFinalDischarge();
          return;
        }
      }

      this.animFrame = requestAnimationFrame(loop);
    };

    this.animFrame = requestAnimationFrame(loop);
  }

  private triggerFinalDischarge() {
    this.destroy();

    // Blinding white flash before reveal
    const flashOverlay = document.createElement('div');
    flashOverlay.style.position = 'fixed';
    flashOverlay.style.top = '0';
    flashOverlay.style.left = '0';
    flashOverlay.style.width = '100vw';
    flashOverlay.style.height = '100vh';
    flashOverlay.style.background = '#ffffff';
    flashOverlay.style.zIndex = '99999';
    flashOverlay.style.transition = 'opacity 1s ease-out';
    document.body.appendChild(flashOverlay);

    setTimeout(() => {
      flashOverlay.style.opacity = '0';
      setTimeout(() => flashOverlay.remove(), 1000);
      this.onComplete();
    }, 400);
  }

  public destroy() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    audio.stopSiren();
    audio.stopAll();
    window.removeEventListener('keydown', this.handleKeyDown);
    const crt = document.querySelector('#crt-wrapper');
    crt?.classList.remove('screen-shake');
  }
}
