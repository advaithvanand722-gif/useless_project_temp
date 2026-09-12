/* ==========================================================================
   FINAL COMEDIC REVEAL MODULE - GERALD THE PIGEON ANTI-CLIMAX
   ========================================================================== */

import { audio } from './audio';

export class RevealModule {
  private container: HTMLElement;
  private onRestart: () => void;

  constructor(container: HTMLElement, onRestart: () => void) {
    this.container = container;
    this.onRestart = onRestart;
  }

  public render() {
    // 1. Instant Visual & Audio Drop: Stop all alarms & risers, play anti-climax
    audio.playAnticlimax();

    // Kill CRT scanlines, matrix canvas glow, and animations
    const crtWrapper = document.querySelector('#crt-wrapper') as HTMLElement;
    if (crtWrapper) {
      crtWrapper.classList.add('no-crt');
      crtWrapper.style.background = '#f4eedb'; // Flat, bland, depressing beige
    }

    const bgCanvas = document.querySelector('#bg-canvas') as HTMLElement;
    if (bgCanvas) bgCanvas.style.display = 'none';

    // Update header to bland plain state
    const defconText = document.querySelector('#defcon-text');
    if (defconText) {
      defconText.textContent = 'STATUS: GERALD DETECTED';
      defconText.style.color = '#555';
    }

    const integrityBar = document.querySelector('#integrity-bar') as HTMLElement;
    const integrityVal = document.querySelector('#integrity-val');
    if (integrityBar) {
      integrityBar.style.width = '0%';
      integrityBar.style.background = '#888';
    }
    if (integrityVal) {
      integrityVal.textContent = '0.00% (REVEALED)';
      integrityVal.style.color = '#555';
    }

    // 2. Content Render - Comic Sans MS, Gerald the pigeon SVG, Stats table
    this.container.innerHTML = `
      <div style="font-family: 'Comic Sans MS', 'Comic Neue', cursive, sans-serif; background: #f4eedb; color: #333; width: 100%; max-width: 780px; margin: 0 auto; padding: 24px; border: 4px solid #8b8577; text-align: center; box-shadow: none;">
        
        <h1 style="font-size: 2.2rem; color: #4a4539; margin-bottom: 6px; font-weight: bold;">
          CLASSIFIED PAYLOAD REVEALED
        </h1>

        <div style="font-size: 1.25rem; color: #6b6353; font-style: italic; margin-bottom: 20px;">
          "It is a pigeon named Gerald. He cannot fly backwards."
        </div>

        <!-- Low-effort SVG Drawing of Gerald the Cross-Eyed Pigeon staring at a French Fry -->
        <div style="background: #e6dfcb; border: 2px dashed #9c9380; padding: 20px; margin: 16px 0; border-radius: 12px; display: flex; flex-direction: column; align-items: center;">
          <svg width="280" height="200" viewBox="0 0 280 200" xmlns="http://www.w3.org/2000/svg">
            <!-- Background Floor -->
            <line x1="10" y1="170" x2="270" y2="170" stroke="#b0a794" stroke-width="3" stroke-dasharray="6,6" />

            <!-- Gerald's Pigeon Body -->
            <ellipse cx="110" cy="130" rx="45" ry="32" fill="#888c94" stroke="#444" stroke-width="3" />
            
            <!-- Wing -->
            <path d="M 90 120 Q 120 145 75 145 Z" fill="#666a73" stroke="#333" stroke-width="2" />
            
            <!-- Tail -->
            <path d="M 65 130 L 40 120 L 45 140 Z" fill="#50545c" stroke="#333" stroke-width="2" />

            <!-- Pigeon Head -->
            <circle cx="145" cy="95" r="24" fill="#999ea8" stroke="#444" stroke-width="3" />
            
            <!-- Iridescent Neck Patch -->
            <path d="M 125 110 Q 140 120 155 110" fill="none" stroke="#8a5da8" stroke-width="4" />

            <!-- Beak -->
            <polygon points="167,93 185,98 167,105" fill="#e8a838" stroke="#333" stroke-width="2" />

            <!-- Left Eye (Cross-Eyed pupil shifted right) -->
            <circle cx="140" cy="88" r="7" fill="#fff" stroke="#000" stroke-width="1.5" />
            <circle cx="144" cy="88" r="3" fill="#000" />

            <!-- Right Eye (Cross-Eyed pupil shifted left) -->
            <circle cx="156" cy="88" r="7" fill="#fff" stroke="#000" stroke-width="1.5" />
            <circle cx="153" cy="88" r="3" fill="#000" />

            <!-- Pigeon Stick Legs -->
            <line x1="100" y1="160" x2="95" y2="170" stroke="#d47040" stroke-width="3" />
            <line x1="95" y1="170" x2="88" y2="170" stroke="#d47040" stroke-width="3" />
            <line x1="95" y1="170" x2="102" y2="170" stroke="#d47040" stroke-width="3" />

            <line x1="120" y1="160" x2="125" y2="170" stroke="#d47040" stroke-width="3" />
            <line x1="125" y1="170" x2="118" y2="170" stroke="#d47040" stroke-width="3" />
            <line x1="125" y1="170" x2="132" y2="170" stroke="#d47040" stroke-width="3" />

            <!-- Half-Eaten French Fry -->
            <path d="M 205 168 L 245 160 L 250 168 L 210 172 Z" fill="#f5c242" stroke="#b88914" stroke-width="2" />
            <!-- Bite mark on fry -->
            <circle cx="247" cy="164" r="5" fill="#e6dfcb" />
            
            <!-- Question mark / Blank Thought Bubble -->
            <text x="145" y="55" font-family="'Comic Sans MS', cursive" font-size="22" font-weight="bold" fill="#666">?</text>
          </svg>

          <div style="font-size: 0.95rem; color: #777; margin-top: 4px;">
            Fig 1.0: Gerald staring blankly at a soggy French fry.
          </div>
        </div>

        <!-- Detailed Statistical Summary Table -->
        <table style="width: 100%; border-collapse: collapse; margin: 18px 0; background: #ebdcb9; border: 2px solid #8b8577; text-align: left; font-size: 1rem;">
          <thead>
            <tr style="background: #d8c7a1; border-bottom: 2px solid #8b8577;">
              <th style="padding: 10px; color: #333;">Metric</th>
              <th style="padding: 10px; color: #333;">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #c9b993;">
              <td style="padding: 8px 10px;">Total CPU cycles wasted:</td>
              <td style="padding: 8px 10px; font-weight: bold; font-family: monospace;">48,204,119</td>
            </tr>
            <tr style="border-bottom: 1px solid #c9b993;">
              <td style="padding: 8px 10px;">Heart rate elevated by:</td>
              <td style="padding: 8px 10px; font-weight: bold; color: #a82424;">+42 BPM</td>
            </tr>
            <tr style="border-bottom: 1px solid #c9b993;">
              <td style="padding: 8px 10px;">Intellectual gain:</td>
              <td style="padding: 8px 10px; font-weight: bold; color: #666;">0.000%</td>
            </tr>
            <tr>
              <td style="padding: 8px 10px;">World saved:</td>
              <td style="padding: 8px 10px; font-weight: bold; color: #a82424;">No</td>
            </tr>
          </tbody>
        </table>

        <!-- Interactive Buttons -->
        <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; margin-top: 20px;">
          <button id="btn-return-home" style="font-family: 'Comic Sans MS', cursive, sans-serif; font-size: 1.1rem; font-weight: bold; padding: 14px 24px; background: #b8ccb8; color: #1b3d1b; border: 3px solid #4a754a; cursor: pointer; border-radius: 8px; box-shadow: 2px 2px 0px #335533;">
            RETURN TO HOME SCREEN TO RE-EVALUATE LIFE
          </button>

          <button id="btn-acknowledge" style="font-family: 'Comic Sans MS', cursive, sans-serif; font-size: 1rem; padding: 12px 18px; background: #d0c6b0; color: #333; border: 2px solid #777; cursor: pointer; border-radius: 6px;">
            Acknowledge Disappointment
          </button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents() {
    const returnHomeBtn = this.container.querySelector('#btn-return-home');
    returnHomeBtn?.addEventListener('click', () => {
      audio.playTick(); // Squeak sound

      // Restore CRT and canvas background
      const crtWrapper = document.querySelector('#crt-wrapper') as HTMLElement;
      if (crtWrapper) {
        crtWrapper.classList.remove('no-crt');
        crtWrapper.style.background = '';
      }
      const bgCanvas = document.querySelector('#bg-canvas') as HTMLElement;
      if (bgCanvas) bgCanvas.style.display = 'block';

      this.onRestart();
    });

    const ackBtn = this.container.querySelector('#btn-acknowledge');
    ackBtn?.addEventListener('click', () => {
      audio.playTick();
      alert('Alert: Gerald has noted your compliance.');
    });
  }
}
