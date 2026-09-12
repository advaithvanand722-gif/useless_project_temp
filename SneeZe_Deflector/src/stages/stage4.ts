/* ==========================================================================
   STAGE 4: COGNITIVE SINGULARITY DECRYPTION (3D ICOSAHEDRON)
   ========================================================================== */

import { audio } from '../audio';

interface Point3D { x: number; y: number; z: number; }
interface Point2D { x: number; y: number; z: number; id: number; }

export class Stage4Module {
  private container: HTMLElement;
  private onComplete: () => void;
  private animFrame: number | null = null;

  // 3D Icosahedron Vertices
  private vertices: Point3D[] = [];
  private edges: [number, number][] = [];

  // Rotation angles
  private angleX: number = 0.5;
  private angleY: number = 0.5;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  // Event handler references for cleanup
  private boundMouseMove: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;

  // Game Rounds State
  private currentRound: number = 1; // 3 rounds total
  private roundTimeLeft: number = 12.0; // 12-second limit per round
  private anomalousVertexId: number = 0; // 0 to 11
  private isCompleted: boolean = false;

  constructor(container: HTMLElement, onComplete: () => void) {
    this.container = container;
    this.onComplete = onComplete;

    this.boundMouseMove = this.handleMouseMove.bind(this);
    this.boundMouseUp = this.handleMouseUp.bind(this);

    this.buildIcosahedron();
    this.selectRandomAnomaly();
  }

  private buildIcosahedron() {
    const phi = (1 + Math.sqrt(5)) / 2;
    const r = 110; // scale radius

    // 12 Vertices
    const rawVerts: [number, number, number][] = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ];

    this.vertices = rawVerts.map(([x, y, z]) => {
      const len = Math.hypot(x, y, z);
      return { x: (x / len) * r, y: (y / len) * r, z: (z / len) * r };
    });

    // Edges based on distance threshold
    this.edges = [];
    for (let i = 0; i < 12; i++) {
      for (let j = i + 1; j < 12; j++) {
        const dist = Math.hypot(
          this.vertices[i].x - this.vertices[j].x,
          this.vertices[i].y - this.vertices[j].y,
          this.vertices[i].z - this.vertices[j].z
        );
        if (dist < r * 1.25) {
          this.edges.push([i, j]);
        }
      }
    }
  }

  private selectRandomAnomaly() {
    let newId = Math.floor(Math.random() * 12);
    if (newId === this.anomalousVertexId) {
      newId = (newId + 1) % 12;
    }
    this.anomalousVertexId = newId;
    this.roundTimeLeft = 12.0;
  }

  public render() {
    this.container.innerHTML = `
      <div class="stage-card">
        <div class="stage-header">
          <div class="stage-title-wrap">
            <h2>STAGE 4 // COGNITIVE SINGULARITY DECRYPTION</h2>
            <div class="stage-subtitle">ROTATE 3D ICOSAHEDRON & NEUTRALISE ANOMALOUS QUANTUM VERTICES</div>
          </div>
          <div class="stage-badge">PROTOCOL 04/05</div>
        </div>

        <div class="stage-instruction">
          🎯 <strong>3D QUANTUM ANOMALY DETECTED:</strong> Click & drag to rotate the 3D wireframe icosahedron. Identify and <strong>CLICK THE FLASHING RED ANOMALY NODE</strong> before time runs out! (Round <span id="s4-round-num">1</span> / 3)
        </div>

        <!-- Timer HUD -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,255,102,0.06); border: 1px solid var(--cyan); padding: 8px 16px; margin-bottom: 12px;">
          <span style="font-family: var(--font-hud); color: var(--cyan); font-weight: bold; letter-spacing: 1px;">ROUND DECRYPTION TIMER:</span>
          <span id="s4-timer-text" style="font-family: var(--font-title); font-size: 1.5rem; color: var(--amber); text-shadow: 0 0 8px var(--amber);">12.00s</span>
        </div>

        <!-- 3D Canvas Viewport -->
        <div class="stage-canvas-viewport" style="height: 300px; cursor: grab; background: #020b05; border: 1px solid rgba(0,255,102,0.3); border-radius: 4px; position: relative;">
          <canvas id="3d-icosa-canvas" style="width: 100%; height: 100%; display: block;"></canvas>
          <div style="position: absolute; bottom: 8px; right: 12px; font-family: var(--font-hud); font-size: 0.75rem; color: var(--cyan); opacity: 0.7; pointer-events: none;">
            DRAG TO ROTATE 3D // CLICK RED ANOMALY TO NEUTRALISE
          </div>
        </div>

        <!-- Meter -->
        <div class="meter-box" style="margin-top: 14px;">
          <div class="meter-label-row">
            <span>COGNITIVE DECRYPTION CLEARANCE</span>
            <span id="s4-progress-text">ROUND 1 / 3</span>
          </div>
          <div class="meter-bar-outer">
            <div class="meter-bar-inner" id="s4-progress-bar" style="width: 33.3%;"></div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.startLoop();
  }

  private bindEvents() {
    const canvas = this.container.querySelector('#3d-icosa-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('mouseup', this.boundMouseUp);
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.isDragging) {
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.angleY += dx * 0.008;
      this.angleX += dy * 0.008;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    }
  }

  private handleMouseUp(e: MouseEvent) {
    if (!this.isDragging) return;

    const canvas = this.container.querySelector('#3d-icosa-canvas') as HTMLCanvasElement;
    this.isDragging = false;
    if (canvas) canvas.style.cursor = 'grab';

    // Distinguish click from drag rotation: click threshold is 8px
    const distMoved = Math.hypot(e.clientX - this.dragStartX, e.clientY - this.dragStartY);
    if (distMoved < 8 && canvas) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const projected = this.getProjectedVertices(canvas.width, canvas.height);
      // Sort front-to-back (smallest z first) for hit detection
      projected.sort((a, b) => a.z - b.z);

      // Hit check: within 25px radius
      const hit = projected.find(p => Math.hypot(p.x - mx, p.y - my) < 25);
      if (hit) {
        this.handleVertexClick(hit.id);
      }
    }
  }

  private handleVertexClick(vertexId: number) {
    if (this.isCompleted) return;

    if (vertexId === this.anomalousVertexId) {
      // Correct click!
      audio.playSuccess();
      this.currentRound++;

      if (this.currentRound > 3) {
        this.isCompleted = true;
        this.destroy();
        this.onComplete();
      } else {
        const rNum = this.container.querySelector('#s4-round-num');
        const pText = this.container.querySelector('#s4-progress-text');
        const pBar = this.container.querySelector('#s4-progress-bar') as HTMLElement;

        if (rNum) rNum.textContent = this.currentRound.toString();
        if (pText) pText.textContent = `ROUND ${this.currentRound} / 3`;
        if (pBar) pBar.style.width = `${(this.currentRound / 3) * 100}%`;

        this.selectRandomAnomaly();
      }
    } else {
      // Incorrect vertex clicked
      audio.playErrorBuzz();
      this.selectRandomAnomaly();
    }
  }

  private getProjectedVertices(w: number, h: number): Point2D[] {
    const cx = w / 2;
    const cy = h / 2;

    const cosX = Math.cos(this.angleX), sinX = Math.sin(this.angleX);
    const cosY = Math.cos(this.angleY), sinY = Math.sin(this.angleY);

    return this.vertices.map((v, idx) => {
      // Rotate Y
      const x1 = v.x * cosY + v.z * sinY;
      const y1 = v.y;
      const z1 = -v.x * sinY + v.z * cosY;

      // Rotate X
      const x2 = x1;
      const y2 = y1 * cosX - z1 * sinX;
      const z2 = y1 * sinX + z1 * cosX;

      // Perspective projection
      const fov = 350;
      const scale = fov / (fov + z2);

      return {
        x: cx + x2 * scale,
        y: cy + y2 * scale,
        z: z2,
        id: idx
      };
    });
  }

  private startLoop() {
    const canvas = this.container.querySelector('#3d-icosa-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    let lastTime = performance.now();

    const updateCanvasSize = () => {
      if (!canvas.parentElement) return;
      const targetWidth = canvas.parentElement.clientWidth || 800;
      const targetHeight = canvas.parentElement.clientHeight || 300;
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
    };

    updateCanvasSize();

    const loop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (!canvas) return;
      updateCanvasSize();
      const w = canvas.width;
      const h = canvas.height;
      const ctx = canvas.getContext('2d');

      if (!this.isCompleted) {
        // Slow auto-spin when idle
        if (!this.isDragging) {
          this.angleY += delta * 0.35;
          this.angleX += delta * 0.15;
        }

        // Round timer update
        this.roundTimeLeft = Math.max(0, this.roundTimeLeft - delta);
        const timerText = this.container.querySelector('#s4-timer-text');
        if (timerText) {
          timerText.textContent = `${this.roundTimeLeft.toFixed(2)}s`;
          if (this.roundTimeLeft < 4.0) {
            (timerText as HTMLElement).style.color = 'var(--alert-red)';
            (timerText as HTMLElement).style.textShadow = '0 0 10px var(--alert-red)';
          } else {
            (timerText as HTMLElement).style.color = 'var(--amber)';
            (timerText as HTMLElement).style.textShadow = '0 0 8px var(--amber)';
          }
        }

        if (this.roundTimeLeft <= 0) {
          audio.playErrorBuzz();
          this.selectRandomAnomaly();
        }

        // 3D Render
        if (ctx) {
          ctx.fillStyle = '#020b05';
          ctx.fillRect(0, 0, w, h);

          const projected = this.getProjectedVertices(w, h);

          // Draw background grid lines / Matrix aesthetic
          ctx.strokeStyle = 'rgba(0, 255, 102, 0.05)';
          ctx.lineWidth = 1;
          for (let gy = 20; gy < h; gy += 40) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(w, gy);
            ctx.stroke();
          }

          // Render Edges
          this.edges.forEach(([i, j]) => {
            const p1 = projected[i];
            const p2 = projected[j];
            const avgZ = (p1.z + p2.z) / 2;
            const alpha = Math.max(0.1, 0.5 - avgZ / 300);

            ctx.strokeStyle = `rgba(0, 255, 102, ${alpha.toFixed(2)})`;
            ctx.lineWidth = avgZ < 0 ? 1.8 : 1.0;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          });

          // Sort vertices back-to-front (largest Z drawn first, smallest Z drawn last)
          const sortedVertices = projected.slice().sort((a, b) => b.z - a.z);

          sortedVertices.forEach(p => {
            const isAnomaly = p.id === this.anomalousVertexId;
            const isFront = p.z < 0;

            ctx.save();

            if (isAnomaly) {
              // Pulse animation for anomalous vertex
              const pulse = Math.sin(now * 0.01) * 3;
              const radius = 9 + pulse;

              ctx.fillStyle = '#ff0055';
              ctx.shadowColor = '#ff0055';
              ctx.shadowBlur = 18;

              ctx.beginPath();
              ctx.arc(p.x, p.y, Math.max(4, radius), 0, Math.PI * 2);
              ctx.fill();

              // Outer target ring
              ctx.strokeStyle = isFront ? '#ffffff' : 'rgba(255, 0, 85, 0.6)';
              ctx.lineWidth = isFront ? 2 : 1;
              ctx.setLineDash([3, 3]);
              ctx.beginPath();
              ctx.arc(p.x, p.y, radius + 8, 0, Math.PI * 2);
              ctx.stroke();

              // Label indicator
              ctx.setLineDash([]);
              ctx.fillStyle = '#ff0055';
              ctx.font = '10px "Share Tech Mono", monospace';
              ctx.fillText('ANOMALY', p.x + 16, p.y - 8);
            } else {
              // Normal nodes
              const radius = isFront ? 6 : 4;
              ctx.fillStyle = isFront ? '#00ff66' : '#007733';
              ctx.shadowColor = '#00ff66';
              ctx.shadowBlur = isFront ? 10 : 3;

              ctx.beginPath();
              ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.restore();
          });
        }
      }

      this.animFrame = requestAnimationFrame(loop);
    };

    this.animFrame = requestAnimationFrame(loop);
  }

  public destroy() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    window.removeEventListener('mousemove', this.boundMouseMove);
    window.removeEventListener('mouseup', this.boundMouseUp);
  }
}
