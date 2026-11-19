import { VehicleType, WeatherMode } from './types';

class OpenWorldAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private ambientGain: GainNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private enabled = true;
  private volume = 0.7;

  private ensureCtx(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
      this.noiseBuffer = this.buildNoiseBuffer(this.ctx);
      this.startAmbient();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private buildNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  public unlock() {
    this.ensureCtx();
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(enabled ? this.volume : 0, this.ctx.currentTime, 0.05);
    }
    if (!enabled) this.setVehicleEngine(false, 'car', 0);
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && this.enabled) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  private startAmbient() {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    this.ambientFilter = this.ctx.createBiquadFilter();
    this.ambientFilter.type = 'lowpass';
    this.ambientFilter.frequency.value = 320;

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.03;

    src.connect(this.ambientFilter);
    this.ambientFilter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);
    src.start();
  }

  public updateAtmosphereAudio(weather: WeatherMode, nearCoast: boolean) {
    if (!this.ctx || !this.ambientGain || !this.ambientFilter) return;
    const isRain = weather === 'rain' || weather === 'thunderstorm';
    const targetVol = isRain ? 0.14 : nearCoast ? 0.075 : 0.028;
    const targetFreq = isRain ? 1350 : nearCoast ? 520 : 280;
    this.ambientGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.4);
    this.ambientFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.4);
  }

  public playFootstep(sprinting: boolean, swimming: boolean) {
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = swimming ? 'bandpass' : 'lowpass';
    filter.frequency.value = swimming ? 650 : sprinting ? 340 : 220;

    const g = ctx.createGain();
    g.gain.setValueAtTime(swimming ? 0.09 : sprinting ? 0.065 : 0.04, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + (swimming ? 0.16 : 0.07));

    src.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    src.start(now);
    src.stop(now + 0.18);
  }

  public playHorn(type: VehicleType) {
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    const freqs =
      type === 'bus' || type === 'tractor'
        ? [185, 232]
        : type === 'auto'
          ? [420, 520]
          : [360, 450];

    for (const f of freqs) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.11, now);
      g.gain.setValueAtTime(0.11, now + 0.18);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  }

  public playThunder() {
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain || !this.noiseBuffer) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, now);
    filter.frequency.exponentialRampToValueAtTime(65, now + 1.4);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.4, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    src.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    src.start(now);
    src.stop(now + 1.55);
  }

  public playMissionChime() {
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.12, now + idx * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.32);
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.35);
    });
  }

  public playInteract() {
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.09, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public setVehicleEngine(active: boolean, type: VehicleType, speedRatio: number) {
    if (!active || !this.enabled) {
      if (this.engineGain && this.ctx) {
        this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      }
      return;
    }
    const ctx = this.ensureCtx();
    if (!ctx || !this.masterGain) return;

    if (!this.engineOsc || !this.engineGain) {
      this.engineOsc = ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 260;

      this.engineGain = ctx.createGain();
      this.engineGain.gain.value = 0;

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);
      this.engineOsc.start();
    }

    const baseFreq = type === 'bus' || type === 'tractor' ? 38 : type === 'auto' ? 68 : 54;
    const targetFreq = baseFreq + Math.min(1.4, Math.abs(speedRatio)) * 75;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.06);
    this.engineGain.gain.setTargetAtTime(0.085, ctx.currentTime, 0.06);
  }
}

export const worldAudio = new OpenWorldAudio();
