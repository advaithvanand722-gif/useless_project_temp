/* ==========================================================================
   STAGE LOADING: 20-SECOND CINEMATIC HYPE VORTEX LOADER
   ========================================================================== */

import { audio } from '../audio';

export class StageLoadingModule {
  private container: HTMLElement;
  private onComplete: () => void;
  private animFrame: number | null = null;

  private durationMs: number = 20000; // Exactly 20,000ms
  private elapsedMs: number = 0;
  private isFinished: boolean = false;

  // Particle Vortex state
  private particles: Array<{ angle: number; radius: number; speed: number; size: number; color: string }> = [];

  // Captions timeline
  private captions = [
    { timeSec: 0.0, text: 'BREACH CONFIRMED. YOU DID WHAT 10,000 SUPERCOMPUTERS COULD NOT.' },
    { timeSec: 3.5, text: 'EXCEPTIONAL NEURAL AGILITY DETECTED. BIOMETRIC SIGNATURE ARCHIVED TO THE OLYMPUS DATABASE.' },
    { timeSec: 7.0, text: 'DECRYPTING CIVILIZATION-ALTERING INTEL... ESTIMATED VALUE: PRICELESS.' },
    { timeSec: 11.0, text: 'WARNING: WHAT YOU ARE ABOUT TO SEE CANNOT BE UNSEEN. PREPARE YOUR CONSCIOUSNESS.' },
    { timeSec: 14.5, text: 'SYNTHESIZING THE FINAL QUANTUM DISCOVERY OF THE CENTURY...' },
    { timeSec: 17.5, text: 'INITIALIZING RETINAL REVELATION IN 3... 2... 1...' }
  ];

  constructor(container: HTMLElement, onComplete: () => void) {
    this.container = container;
    this.onComplete = onComplete;
    this.initVortexParticles();
  }

  private initVortexParticles() {
    this.particles = [];
    const count = 140;
    const colors = ['#00f0ff', '#ffaa00', '#ff0055', '#00ff66', '#ffffff'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 80 + Math.random() * 400,
        speed: 0.02 + Math.random() * 0.04,
        size: Math.random() * 2.5 + 1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  public render() {
    audio.stopAll();
    audio.startEpicRiser(20);

    const crt = document.querySelector('#crt-wrapper');
    crt?.classList.add('screen-shake');

    this.container.innerHTML = `
      <div class="stage-card" style="text-align: center; max-width: 900px; padding: 30px; position: relative;">
        <!-- Top Status Badges -->
        <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px;">
          <span class="stage-badge pulse-dot" style="background: rgba(255,0,85,0.25); border-color: var(--alert-red); color: #fff;">
            🔒 TOP SECRET // LEVEL 9 CLEARANCE GRANTED
          </span>
          <span class="stage-badge" style="background: rgba(0,255,102,0.2); border-color: var(--green); color: var(--green);">
            ✓ QUANTUM VOID COLLAPSED
          </span>
          <span class="stage-badge" style="background: rgba(255,170,0,0.2); border-color: var(--amber); color: var(--amber);">
            ⚡ EXTRACTING SINGULARITY PAYLOAD
          </span>
        </div>

        <!-- Vortex Canvas Viewport -->
        <div class="stage-canvas-viewport" style="height: 260px; margin: 10px 0; border-radius: 8px;">
          <canvas id="vortex-canvas"></canvas>
        </div>

        <!-- High-Tech Progress Clock & Bar -->
        <div style="margin: 16px 0;">
          <div style="display: flex; justify-content: space-between; font-family: var(--font-title); font-size: 1.6rem; color: var(--cyan); text-shadow: 0 0 10px var(--cyan); margin-bottom: 6px;">
            <span id="loading-pct-text">0.00%</span>
            <span id="loading-clock-text" style="color: var(--amber);">20.000s</span>
          </div>

          <div class="meter-bar-outer" style="height: 22px; border-color: var(--cyan);">
            <div class="meter-bar-inner" id="loading-progress-bar" style="width: 0%; background: linear-gradient(90deg, var(--cyan), var(--amber), var(--alert-red), #fff);"></div>
          </div>
        </div>

        <!-- Dynamic Timed Praise Caption Sequence Box -->
        <div style="background: rgba(0,0,0,0.7); border: 1px solid var(--cyan); padding: 18px; min-height: 80px; display: flex; align-items: center; justify-content: center; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);">
          <div id="loading-caption-text" style="font-family: var(--font-title); font-size: 1.1rem; color: #fff; letter-spacing: 1.5px; line-height: 1.5; text-shadow: 0 0 8px var(--cyan);">
            BREACH CONFIRMED. YOU DID WHAT 10,000 SUPERCOMPUTERS COULD NOT.
          </div>
        </div>
      </div>
    `;

    this.startLoop();
  }

  private startLoop() {
    const canvas = this.container.querySelector('#vortex-canvas') as HTMLCanvasElement;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const deltaMs = now - lastTime;
      lastTime = now;

      if (!this.isFinished) {
        this.elapsedMs = Math.min(this.durationMs, this.elapsedMs + deltaMs);
        const elapsedSec = this.elapsedMs / 1000;
        const remainingSec = Math.max(0, (this.durationMs - this.elapsedMs) / 1000);
        const pct = (this.elapsedMs / this.durationMs) * 100;

        // Update DOM Progress & Clock
        const pctText = this.container.querySelector('#loading-pct-text');
        const clockText = this.container.querySelector('#loading-clock-text');
        const progressBar = this.container.querySelector('#loading-progress-bar') as HTMLElement;
        const captionText = this.container.querySelector('#loading-caption-text');

        if (pctText) pctText.textContent = `${pct.toFixed(2)}%`;
        if (clockText) clockText.textContent = `${remainingSec.toFixed(3)}s`;
        if (progressBar) progressBar.style.width = `${pct}%`;

        // Update Captions Timeline
        for (let i = this.captions.length - 1; i >= 0; i--) {
          if (elapsedSec >= this.captions[i].timeSec) {
            if (captionText && captionText.textContent !== this.captions[i].text) {
              captionText.textContent = this.captions[i].text;
              audio.playTick();
            }
            break;
          }
        }

        // Render Particle Vortex Canvas
        if (canvas) {
          this.drawVortex(canvas, elapsedSec);
        }

        // Complete at 20,000ms
        if (this.elapsedMs >= this.durationMs) {
          this.isFinished = true;
          this.triggerCompletion();
          return;
        }
      }

      this.animFrame = requestAnimationFrame(loop);
    };

    this.animFrame = requestAnimationFrame(loop);
  }

  private drawVortex(canvas: HTMLCanvasElement, elapsedSec: number) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = (canvas.width = canvas.parentElement?.clientWidth || 800);
    const h = (canvas.height = canvas.parentElement?.clientHeight || 260);
    const cx = w / 2;
    const cy = h / 2;

    ctx.fillStyle = 'rgba(2, 5, 15, 0.2)';
    ctx.fillRect(0, 0, w, h);

    const speedMult = 1 + (elapsedSec / 20) * 2.5;

    this.particles.forEach(p => {
      p.angle += p.speed * speedMult;
      p.radius -= 0.6 * speedMult;

      if (p.radius < 5) {
        p.radius = 250 + Math.random() * 150;
        p.angle = Math.random() * Math.PI * 2;
      }

      const x = cx + Math.cos(p.angle) * p.radius;
      const y = cy + Math.sin(p.angle) * p.radius;

      ctx.save();
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Central Singularity Pulse
    ctx.save();
    const coreGlow = 15 + Math.sin(elapsedSec * 10) * 8 + (elapsedSec / 20) * 35;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = coreGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, 10 + (elapsedSec / 20) * 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private triggerCompletion() {
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
    audio.stopAll();
    const crt = document.querySelector('#crt-wrapper');
    crt?.classList.remove('screen-shake');
  }
}
