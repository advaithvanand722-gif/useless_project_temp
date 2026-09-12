/* ==========================================================================
   STAGE 1: LISSAJOUS RESONANCE LOCK
   ========================================================================== */

import { audio } from '../audio';

export class Stage1Module {
  private container: HTMLElement;
  private onComplete: () => void;
  private animFrame: number | null = null;

  // Lissajous parameters
  private freqX: number = 2.45;
  private freqY: number = 1.15;
  private phaseDeg: number = 210;

  // Target parameters for golden circle
  // Circle when freqX == freqY and phaseDeg == 90 or 270
  private targetRatio: number = 1.0;
  private targetPhase: number = 90;

  private timeLeft: number = 30.0; // 30-second reactor vent timer
  private lockTimer: number = 0;
  private isCompleted: boolean = false;

  constructor(container: HTMLElement, onComplete: () => void) {
    this.container = container;
    this.onComplete = onComplete;
  }

  public render() {
    audio.playSubDrone();

    this.container.innerHTML = `
      <div class="stage-card">
        <div class="stage-header">
          <div class="stage-title-wrap">
            <h2>STAGE 1 // LISSAJOUS RESONANCE LOCK</h2>
            <div class="stage-subtitle">COLLAPSE CHAOTIC 3D LISSAJOUS KNOT INTO A GOLDEN CIRCLE BEFORE VENT EXPIRES</div>
          </div>
          <div class="stage-badge">PROTOCOL 01/05</div>
        </div>

        <div class="stage-instruction">
          ⚠️ <strong>REACTOR VENT TIMING CRITICAL:</strong> Manipulate Frequency, Harmonic Multiplier, and Phase Offset to form a perfectly symmetrical <strong>GOLDEN CIRCLE</strong> (±1.5% tolerance) for 2 continuous seconds!
        </div>

        <!-- Timer HUD -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,0,85,0.1); border: 1px solid var(--alert-red); padding: 8px 16px;">
          <span style="font-family: var(--font-hud); color: var(--alert-red); font-weight: bold;">REACTOR VENT COUNTDOWN:</span>
          <span id="s1-timer-text" style="font-family: var(--font-title); font-size: 1.5rem; color: var(--alert-red);">30.00s</span>
        </div>

        <!-- Oscilloscope Viewport -->
        <div class="stage-canvas-viewport">
          <canvas id="lissajous-canvas"></canvas>
        </div>

        <!-- Controls Grid -->
        <div class="control-grid">
          <div class="control-item">
            <label>
              <span>FREQUENCY FREQ-X [Q / A]</span>
              <span id="lbl-freqx">2.45</span>
            </label>
            <input type="range" id="slider-freqx" class="cyber-slider" min="0.50" max="3.00" step="0.01" value="2.45" />
          </div>

          <div class="control-item">
            <label>
              <span>HARMONIC FREQ-Y [W / S]</span>
              <span id="lbl-freqy">1.15</span>
            </label>
            <input type="range" id="slider-freqy" class="cyber-slider" min="0.50" max="3.00" step="0.01" value="1.15" />
          </div>

          <div class="control-item">
            <label>
              <span>PHASE OFFSET (°) [E / D]</span>
              <span id="lbl-phase">210°</span>
            </label>
            <input type="range" id="slider-phase" class="cyber-slider" min="0" max="360" step="1" value="210" />
          </div>
        </div>

        <!-- Meter Progress -->
        <div class="meter-box">
          <div class="meter-label-row">
            <span>GOLDEN CIRCLE LOCK RESONANCE MATCH</span>
            <span id="s1-match-text" style="color: var(--amber);">0.0%</span>
          </div>
          <div class="meter-bar-outer">
            <div class="meter-bar-inner" id="s1-match-bar" style="width: 0%;"></div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.startLoop();
  }

  private bindEvents() {
    const sFreqX = this.container.querySelector('#slider-freqx') as HTMLInputElement;
    const sFreqY = this.container.querySelector('#slider-freqy') as HTMLInputElement;
    const sPhase = this.container.querySelector('#slider-phase') as HTMLInputElement;

    sFreqX?.addEventListener('input', () => {
      this.freqX = parseFloat(sFreqX.value);
      this.container.querySelector('#lbl-freqx')!.textContent = this.freqX.toFixed(2);
      audio.playTick();
    });

    sFreqY?.addEventListener('input', () => {
      this.freqY = parseFloat(sFreqY.value);
      this.container.querySelector('#lbl-freqy')!.textContent = this.freqY.toFixed(2);
      audio.playTick();
    });

    sPhase?.addEventListener('input', () => {
      this.phaseDeg = parseFloat(sPhase.value);
      this.container.querySelector('#lbl-phase')!.textContent = `${this.phaseDeg.toFixed(0)}°`;
      audio.playTick();
    });
  }

  private startLoop() {
    const canvas = this.container.querySelector('#lissajous-canvas') as HTMLCanvasElement;
    let lastTime = performance.now();
    let timeAcc = 0;

    const loop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      timeAcc += delta;

      if (!this.isCompleted) {
        // Countdown timer
        this.timeLeft = Math.max(0, this.timeLeft - delta);
        const timerText = this.container.querySelector('#s1-timer-text');
        if (timerText) timerText.textContent = `${this.timeLeft.toFixed(2)}s`;

        if (this.timeLeft <= 0) {
          // Vent blown!
          audio.playErrorBuzz();
          this.timeLeft = 30.0;
          this.lockTimer = 0;
          const crt = document.querySelector('#crt-wrapper');
          crt?.classList.add('screen-shake');
          setTimeout(() => crt?.classList.remove('screen-shake'), 300);
        }

        // Calculate precision match
        const ratio = this.freqX / this.freqY;
        const ratioErr = Math.abs(ratio - this.targetRatio);

        // Phase error relative to 90deg or 270deg
        const phaseErr90 = Math.abs(this.phaseDeg - 90);
        const phaseErr270 = Math.abs(this.phaseDeg - 270);
        const phaseErr = Math.min(phaseErr90, phaseErr270) / 180;

        const totalErr = (ratioErr * 0.7) + (phaseErr * 0.3);
        const matchPct = Math.max(0, Math.min(100, (1 - totalErr * 2.5) * 100));

        // Tolerance check: ±1.5% means matchPct >= 96.2%
        const isLocked = matchPct >= 96.2;

        if (isLocked) {
          this.lockTimer += delta;
        } else {
          this.lockTimer = Math.max(0, this.lockTimer - delta * 2);
        }

        // Update meter DOM
        const matchBar = this.container.querySelector('#s1-match-bar') as HTMLElement;
        const matchText = this.container.querySelector('#s1-match-text');

        if (matchBar) matchBar.style.width = `${Math.min(100, (this.lockTimer / 2.0) * 100)}%`;
        if (matchText) {
          matchText.textContent = isLocked ? `LOCKING IN: ${(this.lockTimer).toFixed(1)}s / 2.0s` : `${matchPct.toFixed(1)}%`;
        }

        // Render Canvas
        if (canvas) {
          this.drawLissajous(canvas, timeAcc, isLocked);
        }

        if (this.lockTimer >= 2.0) {
          this.isCompleted = true;
          this.destroy();
          audio.playSuccess();
          this.onComplete();
          return;
        }
      }

      this.animFrame = requestAnimationFrame(loop);
    };

    this.animFrame = requestAnimationFrame(loop);
  }

  private drawLissajous(canvas: HTMLCanvasElement, t: number, isGolden: boolean) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = (canvas.width = canvas.parentElement?.clientWidth || 800);
    const h = (canvas.height = canvas.parentElement?.clientHeight || 240);
    const cx = w / 2;
    const cy = h / 2;

    ctx.fillStyle = '#02050e';
    ctx.fillRect(0, 0, w, h);

    // Oscilloscope grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
    ctx.moveTo(0, cy); ctx.lineTo(w, cy);
    ctx.stroke();

    const radPhase = (this.phaseDeg * Math.PI) / 180;
    const amp = Math.min(w, h) * 0.38;

    ctx.save();
    ctx.strokeStyle = isGolden ? '#ffaa00' : '#00f0ff';
    ctx.shadowColor = isGolden ? '#ffaa00' : '#00f0ff';
    ctx.shadowBlur = isGolden ? 20 : 10;
    ctx.lineWidth = isGolden ? 4 : 2;

    ctx.beginPath();
    const steps = 600;
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * Math.PI * 4;
      const x = cx + Math.sin(this.freqX * theta + radPhase + t * 0.5) * amp;
      const y = cy + Math.sin(this.freqY * theta + t * 0.5) * amp;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  public destroy() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }
}
