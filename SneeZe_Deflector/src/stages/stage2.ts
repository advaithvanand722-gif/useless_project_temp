/* ==========================================================================
   STAGE 2: REVERSE CRYPTOGRAPHIC HEX-MATRIX
   ========================================================================== */

import { audio } from '../audio';

export class Stage2Module {
  private container: HTMLElement;
  private onComplete: () => void;
  private onDeductGlobalTime?: (sec: number) => void;
  private animFrame: number | null = null;

  // 5x5 Matrix items (25 hex codes)
  private matrixHexes: string[] = [];
  private targetSequence: string[] = []; // 8-char original sequence
  private reverseTarget: string[] = []; // Target in REVERSE order
  private userSelections: string[] = [];

  private isFlashing: boolean = true;
  private flashTimeLeft: number = 20.0; // 20.0 seconds flash preview phase
  private isCompleted: boolean = false;

  constructor(
    container: HTMLElement,
    onComplete: () => void,
    onDeductGlobalTime?: (sec: number) => void
  ) {
    this.container = container;
    this.onComplete = onComplete;
    this.onDeductGlobalTime = onDeductGlobalTime;
    this.generateNewPuzzle();
  }

  private generateNewPuzzle() {
    // Generate 25 unique hex codes
    const hexSet = new Set<string>();
    while (hexSet.size < 25) {
      const hex = '0x' + Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0');
      hexSet.add(hex);
    }
    this.matrixHexes = Array.from(hexSet);

    // Select 8 random hexes as target sequence
    const shuffled = [...this.matrixHexes].sort(() => Math.random() - 0.5);
    this.targetSequence = shuffled.slice(0, 8);
    this.reverseTarget = [...this.targetSequence].reverse();
    this.userSelections = [];
    this.isFlashing = true;
    this.flashTimeLeft = 20.0;
  }

  public render() {
    this.container.innerHTML = `
      <div class="stage-card">
        <div class="stage-header">
          <div class="stage-title-wrap">
            <h2>STAGE 2 // REVERSE CRYPTOGRAPHIC HEX-MATRIX</h2>
            <div class="stage-subtitle">MEMORISE THE 8-HEX SEQUENCE AND ENTER IT IN EXACT REVERSE ORDER</div>
          </div>
          <div class="stage-badge">PROTOCOL 02/05</div>
        </div>

        <div class="stage-instruction">
          🚨 <strong>REVERSE CRYPTO FIREWALL:</strong> Memorise the 8-hex sequence flashing below. Once hidden, click the 5x5 hex matrix items in <strong>STRICT REVERSE ORDER</strong>! Wrong clicks scramble grid & deduct <strong>-5 SECONDS FROM GLOBAL SESSION TIMER</strong>!
        </div>

        <!-- Sequence Status HUD -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.6); border: 1px solid var(--amber); padding: 8px 16px;">
          <div>
            <span style="font-family: var(--font-hud); color: var(--amber);">REVERSE MATCH PROGRESS:</span>
            <span id="s2-progress-num" style="font-family: var(--font-title); font-size: 1.4rem; color: var(--amber); margin-left: 8px;">0 / 8</span>
          </div>
          <button id="btn-replay-flash" class="cyber-btn sm" style="display: none;">
            <span>🔄 REPLAY SEQUENCE</span>
          </button>
        </div>

        <!-- Flashing Sequence Display -->
        <div style="background: rgba(0,240,255,0.08); border: 1px solid var(--cyan); padding: 14px; min-height: 70px; display: flex; flex-direction: column; gap: 8px; align-items: center; justify-content: center;">
          <div id="flash-status-text" style="font-family: var(--font-hud); font-size: 0.85rem; color: var(--cyan); letter-spacing: 1px;">
            INITIALISING ENCRYPTED TELEMETRY STREAM... (20.0s)
          </div>
          <div id="flash-sequence-box" style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; font-family: var(--font-mono); font-size: 1.2rem; font-weight: bold;">
            ${this.targetSequence.map((hex, i) => `<span class="flash-item" style="color: var(--amber); border: 1px solid var(--amber); padding: 4px 8px;">${i + 1}:${hex}</span>`).join('')}
          </div>
        </div>

        <!-- 5x5 Hex Matrix -->
        <div class="s2-matrix-grid" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin: 10px 0;">
          ${this.matrixHexes.map(hex => `
            <button class="cyber-node hex-block-btn" data-hex="${hex}" disabled style="padding: 12px 6px; font-family: var(--font-mono); font-size: 1.05rem;">
              <span class="node-code">${hex}</span>
            </button>
          `).join('')}
        </div>

        <!-- Meter -->
        <div class="meter-box">
          <div class="meter-label-row">
            <span>REVERSE SEQUENCE INPUT MATCH</span>
            <span id="s2-progress-text">0 / 8</span>
          </div>
          <div class="meter-bar-outer">
            <div class="meter-bar-inner" id="s2-progress-bar" style="width: 0%;"></div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.startLoop();
  }

  private bindEvents() {
    const replayBtn = this.container.querySelector('#btn-replay-flash');
    replayBtn?.addEventListener('click', () => {
      audio.playClick();
      this.isFlashing = true;
      this.flashTimeLeft = 20.0;
      this.userSelections = [];
      const flashBox = this.container.querySelector('#flash-sequence-box');
      const statusText = this.container.querySelector('#flash-status-text');
      if (flashBox) {
        flashBox.innerHTML = this.targetSequence.map((hex, i) => `<span class="flash-item" style="color: var(--amber); border: 1px solid var(--amber); padding: 4px 8px;">${i + 1}:${hex}</span>`).join('');
      }
      if (statusText) statusText.textContent = 'MEMORISE SEQUENCE IN REVERSE ORDER! (20.0s)';
      this.setMatrixButtonsEnabled(false);
    });
  }

  private bindGridButtons() {
    const btns = this.container.querySelectorAll('.hex-block-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const hex = btn.getAttribute('data-hex');
        if (hex) this.handleHexClick(hex, btn as HTMLElement);
      });
    });
  }

  private setMatrixButtonsEnabled(enabled: boolean) {
    const btns = this.container.querySelectorAll('.hex-block-btn');
    btns.forEach(btn => {
      (btn as HTMLButtonElement).disabled = !enabled;
    });
  }

  private handleHexClick(hex: string, btnElem: HTMLElement) {
    if (this.isFlashing || this.isCompleted) return;

    const expectedHex = this.reverseTarget[this.userSelections.length];

    if (hex === expectedHex) {
      // Correct!
      this.userSelections.push(hex);
      btnElem.classList.add('cleared');
      audio.playTick();

      const progressText = this.container.querySelector('#s2-progress-text');
      const progressNum = this.container.querySelector('#s2-progress-num');
      const progressBar = this.container.querySelector('#s2-progress-bar') as HTMLElement;
      const pct = (this.userSelections.length / 8) * 100;

      if (progressText) progressText.textContent = `${this.userSelections.length} / 8`;
      if (progressNum) progressNum.textContent = `${this.userSelections.length} / 8`;
      if (progressBar) progressBar.style.width = `${pct}%`;

      if (this.userSelections.length === 8) {
        this.isCompleted = true;
        this.destroy();
        audio.playSuccess();
        this.onComplete();
      }
    } else {
      // Wrong click! Trigger static error buzz, violent screen shake, deduct 5s from global timer, scramble grid & force re-observe new sequence
      audio.playErrorBuzz();

      if (this.onDeductGlobalTime) {
        this.onDeductGlobalTime(5.0);
      }

      const crt = document.querySelector('#crt-wrapper');
      crt?.classList.add('screen-shake');
      setTimeout(() => crt?.classList.remove('screen-shake'), 350);

      // Re-generate new puzzle and force new 20.0s sequence observation
      this.generateNewPuzzle();

      const flashBox = this.container.querySelector('#flash-sequence-box');
      const statusText = this.container.querySelector('#flash-status-text');
      const progressText = this.container.querySelector('#s2-progress-text');
      const progressNum = this.container.querySelector('#s2-progress-num');
      const progressBar = this.container.querySelector('#s2-progress-bar') as HTMLElement;

      if (flashBox) {
        flashBox.innerHTML = this.targetSequence.map((hex, i) => `<span class="flash-item" style="color: var(--amber); border: 1px solid var(--amber); padding: 4px 8px;">${i + 1}:${hex}</span>`).join('');
      }
      if (statusText) statusText.textContent = 'ERROR! GRID SCRAMBLED (-5s)! MEMORISE NEW SEQUENCE IN REVERSE (20.0s)';
      if (progressText) progressText.textContent = '0 / 8 (ERROR: GRID SCRAMBLED!)';
      if (progressNum) progressNum.textContent = '0 / 8';
      if (progressBar) progressBar.style.width = '0%';

      // Re-render grid elements and disable until flash completes
      const gridElem = this.container.querySelector('.s2-matrix-grid');
      if (gridElem) {
        gridElem.innerHTML = this.matrixHexes.map(h => `
          <button class="cyber-node hex-block-btn" data-hex="${h}" disabled style="padding: 12px 6px; font-family: var(--font-mono); font-size: 1.05rem;">
            <span class="node-code">${h}</span>
          </button>
        `).join('');
      }
    }
  }

  private startLoop() {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (!this.isCompleted) {
        // Flashing sequence phase
        if (this.isFlashing) {
          this.flashTimeLeft -= delta;
          const statusText = this.container.querySelector('#flash-status-text');
          if (statusText && this.flashTimeLeft > 0) {
            statusText.textContent = `MEMORISE SEQUENCE IN REVERSE ORDER! (${Math.max(0, this.flashTimeLeft).toFixed(1)}s)`;
          }

          if (this.flashTimeLeft <= 0) {
            this.isFlashing = false;
            const flashBox = this.container.querySelector('#flash-sequence-box');
            const replayBtn = this.container.querySelector('#btn-replay-flash') as HTMLElement;

            if (flashBox) {
              flashBox.innerHTML = '<span style="color: var(--cyan); letter-spacing: 2px;">[ ENCRYPTED HASH SEQUENCE HIDDEN - ENTER REVERSE ORDER ]</span>';
            }
            if (statusText) statusText.textContent = 'ENTER THE 8-HEX CODES IN REVERSE ORDER ON THE GRID BELOW:';
            if (replayBtn) replayBtn.style.display = 'inline-block';

            this.setMatrixButtonsEnabled(true);
            this.bindGridButtons();
          }
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
