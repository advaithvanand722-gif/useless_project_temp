/* ==========================================================================
   STAGE 3: KINETIC SUB-ATOMIC PATCHBAY
   ========================================================================== */

import { audio } from '../audio';

interface TargetNode {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface HubNode {
  id: number;
  name: string;
  x: number;
  y: number;
  targetId: number | null; // connected target ID
}

export class Stage3Module {
  private container: HTMLElement;
  private onComplete: () => void;
  private animFrame: number | null = null;

  private targets: TargetNode[] = [];
  private hubs: HubNode[] = [];

  // Dragging state
  private activeDragHubId: number | null = null;
  private dragMouseX: number = 0;
  private dragMouseY: number = 0;

  private holdTimer: number = 0;
  private isCompleted: boolean = false;
  private hasCollision: boolean = false;

  constructor(container: HTMLElement, onComplete: () => void) {
    this.container = container;
    this.onComplete = onComplete;
    this.initNodes();
  }

  private initNodes() {
    // 4 moving orbiting targets
    this.targets = [
      { id: 1, x: 150, y: 80, vx: 2.2, vy: 1.5, radius: 18, color: '#00f0ff' },
      { id: 2, x: 350, y: 120, vx: -1.8, vy: 2.1, radius: 18, color: '#ffaa00' },
      { id: 3, x: 550, y: 90, vx: 2.5, vy: -1.4, radius: 18, color: '#ff0055' },
      { id: 4, x: 700, y: 140, vx: -2.0, vy: -1.8, radius: 18, color: '#00ff66' }
    ];

    // 3 fixed hubs
    this.hubs = [
      { id: 1, name: 'HUB ALPHA', x: 160, y: 220, targetId: null },
      { id: 2, name: 'HUB BETA', x: 400, y: 220, targetId: null },
      { id: 3, name: 'HUB GAMMA', x: 640, y: 220, targetId: null }
    ];
  }

  public render() {
    this.container.innerHTML = `
      <div class="stage-card">
        <div class="stage-header">
          <div class="stage-title-wrap">
            <h2>STAGE 3 // KINETIC SUB-ATOMIC PATCHBAY</h2>
            <div class="stage-subtitle">CONNECT ALL 3 POWER HUBS TO MOVING TARGETS WITHOUT LINE INTERSECTIONS</div>
          </div>
          <div class="stage-badge">PROTOCOL 03/05</div>
        </div>

        <div class="stage-instruction">
          ⚡ <strong>KINETIC COILS ACTIVE:</strong> Click and drag power cables from the 3 bottom Hubs (Alpha, Beta, Gamma) to connect them to 3 orbiting data collectors. Maintain all 3 links intact for <strong>4 CONTINUOUS SECONDS</strong> without lines crossing each other!
        </div>

        <!-- Canvas Viewport -->
        <div class="stage-canvas-viewport" style="height: 280px; cursor: crosshair;">
          <canvas id="patchbay-canvas"></canvas>
        </div>

        <!-- Hold Progress Meter -->
        <div class="meter-box">
          <div class="meter-label-row">
            <span>STABLE ZERO-COLLISION LINK HOLD TIMER:</span>
            <span id="s3-hold-text" style="color: var(--amber);">0.0s / 4.0s</span>
          </div>
          <div class="meter-bar-outer">
            <div class="meter-bar-inner" id="s3-hold-bar" style="width: 0%;"></div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.startLoop();
  }

  private bindEvents() {
    const canvas = this.container.querySelector('#patchbay-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Check if clicking near a hub
      const hitHub = this.hubs.find(h => Math.hypot(h.x - mx, h.y - my) < 25);
      if (hitHub) {
        this.activeDragHubId = hitHub.id;
        hitHub.targetId = null; // disconnect existing
        this.dragMouseX = mx;
        this.dragMouseY = my;
        audio.playTick();
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if (this.activeDragHubId !== null) {
        const rect = canvas.getBoundingClientRect();
        this.dragMouseX = e.clientX - rect.left;
        this.dragMouseY = e.clientY - rect.top;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (this.activeDragHubId !== null && canvas) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Check if released over a target
        const hitTarget = this.targets.find(t => Math.hypot(t.x - mx, t.y - my) < 30);
        const hub = this.hubs.find(h => h.id === this.activeDragHubId);

        if (hitTarget && hub) {
          hub.targetId = hitTarget.id;
          audio.playBeep(700, 0.1);
        }

        this.activeDragHubId = null;
      }
    });
  }

  private updatePositions(w: number, h: number) {
    // Update target movement & wall bouncing
    this.targets.forEach(t => {
      t.x += t.vx;
      t.y += t.vy;

      if (t.x < t.radius || t.x > w - t.radius) t.vx *= -1;
      if (t.y < t.radius || t.y > h - 100) t.vy *= -1;

      // Random speed fluctuations
      if (Math.random() < 0.02) {
        t.vx += (Math.random() - 0.5) * 0.4;
        t.vy += (Math.random() - 0.5) * 0.4;
      }
    });

    // Reposition hubs horizontally relative to canvas width
    this.hubs[0].x = w * 0.2; this.hubs[0].y = h - 35;
    this.hubs[1].x = w * 0.5; this.hubs[1].y = h - 35;
    this.hubs[2].x = w * 0.8; this.hubs[2].y = h - 35;
  }

  private checkLineIntersection(
    p1: {x: number, y: number}, p2: {x: number, y: number},
    p3: {x: number, y: number}, p4: {x: number, y: number}
  ): boolean {
    const ccw = (a: {x: number, y: number}, b: {x: number, y: number}, c: {x: number, y: number}) => {
      return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
    };
    return (ccw(p1, p3, p4) !== ccw(p2, p3, p4)) && (ccw(p1, p2, p3) !== ccw(p1, p2, p4));
  }

  private startLoop() {
    const canvas = this.container.querySelector('#patchbay-canvas') as HTMLCanvasElement;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (!canvas) return;
      const w = (canvas.width = canvas.parentElement?.clientWidth || 800);
      const h = (canvas.height = canvas.parentElement?.clientHeight || 280);
      const ctx = canvas.getContext('2d');

      if (ctx) {
        this.updatePositions(w, h);

        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, w, h);

        // Check if all 3 hubs connected
        const connectedHubs = this.hubs.filter(h => h.targetId !== null);
        const all3Connected = connectedHubs.length === 3;

        // Check for line intersections
        this.hasCollision = false;
        if (all3Connected) {
          const lines = this.hubs.map(h => {
            const t = this.targets.find(t => t.id === h.targetId)!;
            return { p1: { x: h.x, y: h.y }, p2: { x: t.x, y: t.y } };
          });

          if (
            this.checkLineIntersection(lines[0].p1, lines[0].p2, lines[1].p1, lines[1].p2) ||
            this.checkLineIntersection(lines[0].p1, lines[0].p2, lines[2].p1, lines[2].p2) ||
            this.checkLineIntersection(lines[1].p1, lines[1].p2, lines[2].p1, lines[2].p2)
          ) {
            this.hasCollision = true;
          }
        }

        // Draw connections
        this.hubs.forEach(hub => {
          if (hub.targetId !== null) {
            const target = this.targets.find(t => t.id === hub.targetId);
            if (target) {
              ctx.save();
              ctx.strokeStyle = this.hasCollision ? '#ff0055' : '#00ff66';
              ctx.lineWidth = 3;
              ctx.shadowColor = this.hasCollision ? '#ff0055' : '#00ff66';
              ctx.shadowBlur = 10;

              ctx.beginPath();
              ctx.moveTo(hub.x, hub.y);
              const cpY = (hub.y + target.y) / 2;
              ctx.quadraticCurveTo(hub.x, cpY, target.x, target.y);
              ctx.stroke();
              ctx.restore();
            }
          }
        });

        // Draw active dragging cable
        if (this.activeDragHubId !== null) {
          const hub = this.hubs.find(h => h.id === this.activeDragHubId);
          if (hub) {
            ctx.save();
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(hub.x, hub.y);
            ctx.lineTo(this.dragMouseX, this.dragMouseY);
            ctx.stroke();
            ctx.restore();
          }
        }

        // Draw Target Nodes
        this.targets.forEach(t => {
          ctx.save();
          ctx.fillStyle = t.color;
          ctx.shadowColor = t.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#000';
          ctx.font = 'bold 12px "Share Tech Mono"';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`T${t.id}`, t.x, t.y);
          ctx.restore();
        });

        // Draw Hub Nodes
        this.hubs.forEach(h => {
          ctx.save();
          ctx.fillStyle = h.targetId ? 'var(--green)' : 'var(--cyan)';
          ctx.beginPath();
          ctx.arc(h.x, h.y, 16, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px "Rajdhani"';
          ctx.textAlign = 'center';
          ctx.fillText(h.name, h.x, h.y + 24);
          ctx.restore();
        });

        // Update hold timer
        if (all3Connected && !this.hasCollision) {
          this.holdTimer += delta;
        } else {
          this.holdTimer = Math.max(0, this.holdTimer - delta * 2);
        }

        const holdBar = this.container.querySelector('#s3-hold-bar') as HTMLElement;
        const holdText = this.container.querySelector('#s3-hold-text');

        const pct = Math.min(100, (this.holdTimer / 4.0) * 100);
        if (holdBar) holdBar.style.width = `${pct}%`;
        if (holdText) {
          if (this.hasCollision) {
            holdText.textContent = 'LINE COLLISION DETECTED! (-2s)';
            holdText.style.color = 'var(--alert-red)';
          } else {
            holdText.textContent = `${this.holdTimer.toFixed(1)}s / 4.0s`;
            holdText.style.color = 'var(--amber)';
          }
        }

        if (this.holdTimer >= 4.0 && !this.isCompleted) {
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

  public destroy() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }
}
