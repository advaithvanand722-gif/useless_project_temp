/* ==========================================================================
   PROJECT A.P.E.X. // CYBER AUDIO ENGINE (PROCEDURAL WEB AUDIO SYNTHESIZER)
   ========================================================================== */

export class CyberAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted: boolean = false;
  private initialized: boolean = false;

  // Active long-running nodes
  private subDroneOsc: OscillatorNode | null = null;
  private subDroneLfo: OscillatorNode | null = null;
  private subDroneGain: GainNode | null = null;

  private sirenOsc: OscillatorNode | null = null;
  private sirenLfo: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenFilter: BiquadFilterNode | null = null;

  private activeNodes: Array<{ stop: (t?: number) => void }> = [];
  private riserTimeouts: number[] = [];

  constructor() {
    // AudioContext lazily initialized on first user interaction
  }

  public init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.35; // Master output volume
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  private ensureContext() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(
        this.muted ? 0 : 0.35,
        this.ctx.currentTime + 0.1
      );
    }
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * Immediately stops all active sound generators & oscillators.
   */
  public stopAll() {
    if (this.subDroneOsc) {
      try { this.subDroneOsc.stop(); this.subDroneLfo?.stop(); } catch (_) {}
      this.subDroneOsc = null;
      this.subDroneLfo = null;
      this.subDroneGain = null;
    }

    this.stopSiren();

    this.activeNodes.forEach(node => {
      try { node.stop(); } catch (_) {}
    });
    this.activeNodes = [];

    this.riserTimeouts.forEach(id => clearTimeout(id));
    this.riserTimeouts = [];
  }

  // --------------------------------------------------------------------------
  // 1. playSubDrone()
  // Deep, resonant 40Hz - 55Hz pulsing sine wave oscillator with an LFO
  // --------------------------------------------------------------------------
  public playSubDrone() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.subDroneOsc || this.muted) return;

    const now = this.ctx.currentTime;
    this.subDroneOsc = this.ctx.createOscillator();
    this.subDroneLfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    this.subDroneGain = this.ctx.createGain();

    this.subDroneOsc.type = 'sine';
    this.subDroneOsc.frequency.setValueAtTime(47.5, now); // Center frequency between 40Hz and 55Hz

    // LFO for pulsing background tension
    this.subDroneLfo.type = 'sine';
    this.subDroneLfo.frequency.setValueAtTime(0.8, now); // 0.8 Hz pulse speed
    lfoGain.gain.setValueAtTime(7.5, now); // Modulates 47.5 ± 7.5 Hz (40Hz to 55Hz)

    this.subDroneGain.gain.setValueAtTime(0.18, now);

    this.subDroneLfo.connect(lfoGain);
    lfoGain.connect(this.subDroneOsc.frequency);

    this.subDroneOsc.connect(this.subDroneGain);
    this.subDroneGain.connect(this.masterGain);

    this.subDroneLfo.start(now);
    this.subDroneOsc.start(now);
  }

  // --------------------------------------------------------------------------
  // 2. playSiren()
  // Sweeping sawtooth horn alternating rapidly between 400Hz and 880Hz through a resonant bandpass filter
  // --------------------------------------------------------------------------
  public playSiren() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.sirenOsc || this.muted) return;

    const now = this.ctx.currentTime;
    this.sirenOsc = this.ctx.createOscillator();
    this.sirenLfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    this.sirenGain = this.ctx.createGain();
    this.sirenFilter = this.ctx.createBiquadFilter();

    this.sirenOsc.type = 'sawtooth';
    this.sirenOsc.frequency.setValueAtTime(640, now); // Center 640 Hz

    // LFO alternating between 400Hz and 880Hz
    this.sirenLfo.type = 'square';
    this.sirenLfo.frequency.setValueAtTime(4, now); // 4 Hz rapid alternation
    lfoGain.gain.setValueAtTime(240, now); // 640 ± 240 Hz = 400Hz to 880Hz

    // Resonant bandpass filter
    this.sirenFilter.type = 'bandpass';
    this.sirenFilter.frequency.setValueAtTime(640, now);
    this.sirenFilter.Q.setValueAtTime(4.0, now); // High resonance

    this.sirenGain.gain.setValueAtTime(0.16, now);

    this.sirenLfo.connect(lfoGain);
    lfoGain.connect(this.sirenOsc.frequency);

    this.sirenOsc.connect(this.sirenFilter);
    this.sirenFilter.connect(this.sirenGain);
    this.sirenGain.connect(this.masterGain);

    this.sirenLfo.start(now);
    this.sirenOsc.start(now);
  }

  public stopSiren() {
    if (this.sirenOsc && this.ctx) {
      try {
        this.sirenOsc.stop();
        this.sirenLfo?.stop();
      } catch (_) {}
      this.sirenOsc = null;
      this.sirenLfo = null;
      this.sirenGain = null;
      this.sirenFilter = null;
    }
  }

  // --------------------------------------------------------------------------
  // 3. playTick()
  // Crisp white noise burst (10ms) with exponential decay
  // --------------------------------------------------------------------------
  public playTick() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.muted) return;

    const now = this.ctx.currentTime;
    const duration = 0.01; // 10ms
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // White noise
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSource.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start(now);
    this.activeNodes.push(noiseSource);
  }

  // --------------------------------------------------------------------------
  // 4. playErrorBuzz()
  // Low harsh square wave (80Hz) with dissonant tritone overtones
  // --------------------------------------------------------------------------
  public playErrorBuzz() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.muted) return;

    const now = this.ctx.currentTime;
    const duration = 0.25;

    // Fundamental low square wave at 80Hz
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(80, now);

    // Dissonant tritone overtone: 80 * sqrt(2) ≈ 113.14 Hz
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(113.14, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);

    this.activeNodes.push(osc1);
    this.activeNodes.push(osc2);
  }

  // --------------------------------------------------------------------------
  // 5. startEpicRiser(durationSec = 20)
  // - Escalating Shepard-tone style riser climbing in frequency
  // - Heartbeat accelerating from 80 BPM to 180 BPM
  // - Pink noise rush swelling toward second 19.5
  // --------------------------------------------------------------------------
  public startEpicRiser(durationSec: number = 20) {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.muted) return;

    const startTime = this.ctx.currentTime;
    const endTime = startTime + durationSec;

    // A. Shepard-tone style riser climbing continuously in frequency
    const numLayers = 3;
    for (let i = 0; i < numLayers; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const baseFreq = 80 * Math.pow(2, i);
      const targetFreq = baseFreq * Math.pow(2, 3); // 3 octaves up over 20s

      osc.frequency.setValueAtTime(baseFreq, startTime);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, endTime);

      gain.gain.setValueAtTime(0.04, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + durationSec * 0.85);
      gain.gain.exponentialRampToValueAtTime(0.001, endTime);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(endTime);
      this.activeNodes.push(osc);
    }

    // B. Accelerated Heartbeat Layer (80 BPM -> 180 BPM)
    const scheduleHeartbeat = () => {
      if (!this.ctx || !this.masterGain) return;
      const elapsed = this.ctx.currentTime - startTime;
      if (elapsed >= durationSec) return;

      const progress = Math.min(1, elapsed / durationSec);
      const currentBpm = 80 + (180 - 80) * progress; // 80 to 180 BPM
      const intervalSec = 60 / currentBpm;

      const now = this.ctx.currentTime;

      // Lub pulse
      const lubOsc = this.ctx.createOscillator();
      const lubGain = this.ctx.createGain();
      lubOsc.type = 'sine';
      lubOsc.frequency.setValueAtTime(65, now);
      lubOsc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

      lubGain.gain.setValueAtTime(0.35 + progress * 0.2, now);
      lubGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      lubOsc.connect(lubGain);
      lubGain.connect(this.masterGain);
      lubOsc.start(now);
      lubOsc.stop(now + 0.08);

      // Dub pulse
      const dubTime = now + 0.11;
      const dubOsc = this.ctx.createOscillator();
      const dubGain = this.ctx.createGain();
      dubOsc.type = 'sine';
      dubOsc.frequency.setValueAtTime(55, dubTime);
      dubOsc.frequency.exponentialRampToValueAtTime(25, dubTime + 0.06);

      dubGain.gain.setValueAtTime(0.25 + progress * 0.15, dubTime);
      dubGain.gain.exponentialRampToValueAtTime(0.001, dubTime + 0.06);

      dubOsc.connect(dubGain);
      dubGain.connect(this.masterGain);
      dubOsc.start(dubTime);
      dubOsc.stop(dubTime + 0.06);

      const timeoutId = window.setTimeout(scheduleHeartbeat, intervalSec * 1000);
      this.riserTimeouts.push(timeoutId);
    };

    scheduleHeartbeat();

    // C. Pink noise rush swelling in amplitude toward second 19.5
    const pinkBufferSize = Math.floor(this.ctx.sampleRate * durationSec);
    const pinkBuffer = this.ctx.createBuffer(1, pinkBufferSize, this.ctx.sampleRate);
    const data = pinkBuffer.getChannelData(0);

    // Paul Kellet Pink Noise approximation filter
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < pinkBufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = pinkBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(300, startTime);
    noiseFilter.frequency.exponentialRampToValueAtTime(4000, startTime + 19.5);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, startTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.35, startTime + 19.5);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, endTime);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noiseSource.start(startTime);
    noiseSource.stop(endTime);
    this.activeNodes.push(noiseSource);
  }

  // --------------------------------------------------------------------------
  // 6. playAnticlimax()
  // - Cut all active oscillators abruptly into dead silence for 1.5 seconds.
  // - Downward sliding sine wave (900Hz -> 150Hz over 800ms).
  // - Followed immediately with a goofy "honk" (185Hz & 196Hz square waves for 300ms).
  // --------------------------------------------------------------------------
  public playAnticlimax() {
    this.stopAll();
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const silenceSec = 1.5; // 1.5 seconds dead silence

    // A. Downward sliding sine wave slide whistle (900Hz to 150Hz over 800ms)
    const whistleStart = now + silenceSec;
    const slide = this.ctx.createOscillator();
    const slideGain = this.ctx.createGain();

    slide.type = 'sine';
    slide.frequency.setValueAtTime(900, whistleStart);
    slide.frequency.exponentialRampToValueAtTime(150, whistleStart + 0.8);

    slideGain.gain.setValueAtTime(0.35, whistleStart);
    slideGain.gain.exponentialRampToValueAtTime(0.001, whistleStart + 0.8);

    slide.connect(slideGain);
    slideGain.connect(this.masterGain);

    slide.start(whistleStart);
    slide.stop(whistleStart + 0.8);

    // B. Goofy "honk" (two dissonant square waves at 185Hz and 196Hz for 300ms)
    const honkStart = whistleStart + 0.8;
    const honk1 = this.ctx.createOscillator();
    const honk2 = this.ctx.createOscillator();
    const honkGain = this.ctx.createGain();

    honk1.type = 'square';
    honk1.frequency.setValueAtTime(185, honkStart);

    honk2.type = 'square';
    honk2.frequency.setValueAtTime(196, honkStart);

    honkGain.gain.setValueAtTime(0.3, honkStart);
    honkGain.gain.exponentialRampToValueAtTime(0.001, honkStart + 0.3);

    honk1.connect(honkGain);
    honk2.connect(honkGain);
    honkGain.connect(this.masterGain);

    honk1.start(honkStart);
    honk2.start(honkStart);
    honk1.stop(honkStart + 0.3);
    honk2.stop(honkStart + 0.3);
  }

  // --------------------------------------------------------------------------
  // Application Compatibility Wrappers
  // --------------------------------------------------------------------------
  public playClick() { this.playTick(); }
  public playError() { this.playErrorBuzz(); }
  public startAlarm() { this.playSiren(); }
  public stopAlarm() { this.stopSiren(); }
  public playComedicReveal() { this.playAnticlimax(); }

  public playBeep(freq: number = 600, duration: number = 0.08, type: OscillatorType = 'square') {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.muted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public playSuccess() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.muted) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, index) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = this.ctx.currentTime + index * 0.06;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(startTime);
      osc.stop(startTime + 0.16);
    });
  }

  public playHypeArp(freq: number) {
    this.ensureContext();
    if (!this.ctx || !this.masterGain || this.muted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }
}

export const audio = new CyberAudioEngine();
