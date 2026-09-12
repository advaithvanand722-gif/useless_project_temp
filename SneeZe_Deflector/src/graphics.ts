/* ==========================================================================
   PROJECT A.P.E.X. // MATRIX NEON GREEN CRT CANVAS GRAPHICS & TELEMETRY RENDERER
   ========================================================================== */

export interface WaveConfig {
  freq: number;
  amp: number;
  phase: number;
  color: string;
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animId: number | null = null;
  private width: number = 0;
  private height: number = 0;

  // Matrix Rain state
  private matrixColumns: number[] = [];
  private matrixChars = '0123456789ABCDEF01⚡VOID量子APEXΞΩΨMATRIX';

  // Radar sweep state
  private radarAngle: number = 0;

  // Particles state
  private particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number }> = [];

  // Glitch effect state
  private glitchIntensity: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initParticles();
    this.initMatrix();
  }

  private resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
    this.initMatrix();
  }

  private initMatrix() {
    const colWidth = 20;
    const cols = Math.floor(this.width / colWidth);
    this.matrixColumns = Array.from({ length: cols }, () => Math.random() * -100);
  }

  private initParticles() {
    this.particles = [];
    const count = 45;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.25
      });
    }
  }

  public setGlitch(intensity: number) {
    this.glitchIntensity = intensity;
  }

  public start() {
    if (this.animId) return;
    const loop = () => {
      this.render();
      this.animId = requestAnimationFrame(loop);
    };
    loop();
  }

  public stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  private render() {
    // Semi-transparent fade for trailing effect - Deep Matrix Pitch Dark
    this.ctx.fillStyle = 'rgba(2, 8, 4, 0.25)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.drawCyberGrid();
    this.drawMatrixRain();
    this.drawParticleNetwork();
    this.drawRadarSweep();

    if (this.glitchIntensity > 0) {
      this.drawGlitchOverlay();
      this.glitchIntensity = Math.max(0, this.glitchIntensity - 0.02);
    }
  }

  // --- CYBER GRID LINES ---
  private drawCyberGrid() {
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(0, 255, 102, 0.05)';
    this.ctx.lineWidth = 1;

    const gridSize = 40;
    for (let x = 0; x < this.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }

    for (let y = 0; y < this.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  // --- MATRIX CODE RAIN ---
  private drawMatrixRain() {
    this.ctx.save();
    this.ctx.font = '14px "Share Tech Mono"';

    const colWidth = 20;
    for (let i = 0; i < this.matrixColumns.length; i++) {
      const char = this.matrixChars[Math.floor(Math.random() * this.matrixChars.length)];
      const x = i * colWidth;
      const y = this.matrixColumns[i];

      // Glow head character - Neon Light Green
      this.ctx.fillStyle = '#00ff66';
      this.ctx.shadowColor = '#00ff66';
      this.ctx.shadowBlur = 10;
      this.ctx.fillText(char, x, y);

      // Trailing characters - Phosphor Matrix Green
      this.ctx.fillStyle = 'rgba(0, 255, 65, 0.4)';
      this.ctx.shadowBlur = 0;
      this.ctx.fillText(char, x, y - 18);

      if (y > this.height + Math.random() * 200) {
        this.matrixColumns[i] = 0;
      } else {
        this.matrixColumns[i] += 16;
      }
    }
    this.ctx.restore();
  }

  // --- PARTICLE ENERGY MATRIX ---
  private drawParticleNetwork() {
    this.ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > this.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.height) p.vy *= -1;

      this.ctx.fillStyle = `rgba(0, 255, 102, ${p.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();

      // Connect nearby particles
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 120) {
          this.ctx.strokeStyle = `rgba(0, 255, 102, ${0.18 * (1 - dist / 120)})`;
          this.ctx.lineWidth = 0.8;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }
    this.ctx.restore();
  }

  // --- RADAR SWEEP ---
  private drawRadarSweep() {
    this.ctx.save();
    const cx = this.width - 120;
    const cy = 120;
    const radius = 60;

    // Outer circle
    this.ctx.strokeStyle = 'rgba(0, 255, 102, 0.35)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.stroke();

    // Crosshairs
    this.ctx.beginPath();
    this.ctx.moveTo(cx - radius, cy);
    this.ctx.lineTo(cx + radius, cy);
    this.ctx.moveTo(cx, cy - radius);
    this.ctx.lineTo(cx, cy + radius);
    this.ctx.stroke();

    // Sweep line
    this.radarAngle += 0.03;
    const endX = cx + Math.cos(this.radarAngle) * radius;
    const endY = cy + Math.sin(this.radarAngle) * radius;

    this.ctx.strokeStyle = '#00ff66';
    this.ctx.shadowColor = '#00ff66';
    this.ctx.shadowBlur = 12;
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();

    this.ctx.restore();
  }

  // --- GLITCH OVERLAY SLICES ---
  private drawGlitchOverlay() {
    this.ctx.save();
    const numSlices = Math.floor(Math.random() * 5 + 3);
    for (let i = 0; i < numSlices; i++) {
      const sliceY = Math.random() * this.height;
      const sliceH = Math.random() * 30 + 10;
      const offsetX = (Math.random() - 0.5) * 40 * this.glitchIntensity;

      const imgData = this.ctx.getImageData(0, sliceY, this.width, sliceH);
      this.ctx.putImageData(imgData, offsetX, sliceY);
    }
    this.ctx.restore();
  }
}

// Standalone wave drawer helper for Stage 1 canvas
export function drawStage1Waves(
  canvas: HTMLCanvasElement,
  targetWave: WaveConfig,
  userWave: WaveConfig,
  aligned: boolean
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = (canvas.width = canvas.parentElement?.clientWidth || 800);
  const h = (canvas.height = canvas.parentElement?.clientHeight || 240);
  const cy = h / 2;

  ctx.fillStyle = '#020b05';
  ctx.fillRect(0, 0, w, h);

  // Grid line
  ctx.strokeStyle = 'rgba(0, 255, 102, 0.15)';
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(w, cy);
  ctx.stroke();

  const renderWave = (config: WaveConfig, isTarget: boolean) => {
    ctx.save();
    ctx.strokeStyle = config.color;
    ctx.shadowColor = config.color;
    ctx.shadowBlur = aligned ? 18 : 8;
    ctx.lineWidth = isTarget ? 3 : 2;
    if (isTarget) ctx.setLineDash([8, 4]);

    ctx.beginPath();
    for (let x = 0; x < w; x++) {
      const angle = (x * config.freq * 0.005) + (config.phase * Math.PI / 180);
      const y = cy + Math.sin(angle) * config.amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  };

  // Draw target signal
  renderWave(targetWave, true);
  // Draw user signal
  renderWave(userWave, false);
}
