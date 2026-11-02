// Real-time mono pitch correction (beta): YIN-style f0 tracking + dual-head
// overlap-add delay line. All signal processing runs off the main UI thread.
// This is a lightweight browser effect, not a professional phase-vocoder/PSOLA.
import { AUTOTUNE_DEFAULTS, correctionForFrequency, normalizeAutotune, noteLabel } from './autotune-math.js';

const BUFFER_LENGTH = 16384; // power of two, large enough for 48 kHz delay
const BUFFER_MASK = BUFFER_LENGTH - 1;
const DETECT_WINDOW = 2048;
const DECIMATE = 2;
const TEST_LENGTH = 512;
const DETECT_INTERVAL = 2048;
const MIN_VOICE_HZ = 80;
const MAX_VOICE_HZ = 750;

export class KaraokeAutotuneProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.settings = normalizeAutotune(options?.processorOptions?.settings || AUTOTUNE_DEFAULTS);
    this.samples = new Float32Array(BUFFER_LENGTH);
    this.analysis = new Float32Array(DETECT_WINDOW / DECIMATE);
    this.yin = new Float32Array(512);
    this.writeIndex = 0;
    this.totalSamples = 0;
    this.countdown = DETECT_INTERVAL;
    this.ratioTarget = 1;
    this.ratioCurrent = 1;
    this.wetCurrent = 0;
    this.phase = 0;
    this.detectCount = 0;
    this.lastPitch = 0;
    this.port.onmessage = ({ data }) => {
      if (data?.type === 'configure') {
        this.settings = normalizeAutotune(data.settings);
        if (!this.settings.enabled) this.ratioTarget = 1;
      }
    };
  }

  readAt(delay) {
    // Read fractional sample delay from circular history.
    let pos = this.writeIndex - delay;
    pos = (pos % BUFFER_LENGTH + BUFFER_LENGTH) % BUFFER_LENGTH;
    const i = Math.floor(pos);
    const fraction = pos - i;
    return this.samples[i] * (1 - fraction) + this.samples[(i + 1) & BUFFER_MASK] * fraction;
  }

  detectPitch() {
    const halfRate = sampleRate / DECIMATE;
    const minTau = Math.max(2, Math.floor(halfRate / MAX_VOICE_HZ));
    const maxTau = Math.min(450, Math.ceil(halfRate / MIN_VOICE_HZ));
    // Copy most recent 2048 samples, downsampled by 2.
    let sumSq = 0;
    const start = (this.writeIndex - DETECT_WINDOW) & BUFFER_MASK;
    for (let i = 0; i < this.analysis.length; i++) {
      const sample = this.samples[(start + i * DECIMATE) & BUFFER_MASK];
      this.analysis[i] = sample;
      sumSq += sample * sample;
    }
    // Reject silence and background noise to avoid tuning consonants or noise.
    const rms = Math.sqrt(sumSq / this.analysis.length);
    if (rms < 0.013) return null;
    let running = 0;
    this.yin[0] = 1;
    let minimum = Infinity, bestTau = -1;
    for (let tau = 1; tau <= maxTau; tau++) {
      let difference = 0;
      for (let i = 0; i < TEST_LENGTH; i++) {
        const delta = this.analysis[i] - this.analysis[i + tau];
        difference += delta * delta;
      }
      running += difference;
      const normalized = running > 0 ? difference * tau / running : 1;
      this.yin[tau] = normalized;
      if (tau < minTau) continue;
      if (normalized < minimum) { minimum = normalized; bestTau = tau; }
    }
    // Select first significant trough, not its initial falling edge.
    // Picking the edge would misread a sustained note as too sharp.
    let candidate = -1;
    for (let t = minTau; t <= maxTau; t++) {
      if (this.yin[t] < 0.16) {
        while (t < maxTau && this.yin[t + 1] < this.yin[t]) t++;
        candidate = t;
        break;
      }
    }
    const tau = candidate > 0 ? candidate : (minimum < 0.24 ? bestTau : -1);
    if (tau < minTau) return null;
    const left = this.yin[Math.max(1, tau - 1)], center = this.yin[tau], right = this.yin[Math.min(maxTau, tau + 1)];
    const denominator = left - 2 * center + right;
    const adjust = Math.abs(denominator) > 1e-7 ? Math.max(-0.5, Math.min(0.5, 0.5 * (left - right) / denominator)) : 0;
    const hz = halfRate / (tau + adjust);
    if (!Number.isFinite(hz) || hz < MIN_VOICE_HZ || hz > MAX_VOICE_HZ) return null;
    return { hz, confidence: Math.max(0, Math.min(1, 1 - center)) };
  }

  updatePitch() {
    if (!this.settings.enabled) {
      this.ratioTarget = 1;
      this.lastPitch = 0;
      return;
    }
    const result = this.detectPitch();
    if (result && result.confidence >= 0.76) {
      const correction = correctionForFrequency(result.hz, this.settings);
      this.ratioTarget = correction.ratio;
      this.lastPitch = result.hz;
      if (++this.detectCount % 3 === 0) {
        this.port.postMessage({ type: 'pitch', detected: noteLabel(correction.midi), target: noteLabel(correction.targetMidi), cents: Math.round(correction.cents), hz: Math.round(result.hz), confidence: result.confidence });
      }
    } else {
      this.ratioTarget = 1;
      this.lastPitch = 0;
      if (++this.detectCount % 3 === 0) this.port.postMessage({ type: 'pitch', detected: null });
    }
  }

  process(inputs, outputs) {
    const input = inputs[0] || [];
    const output = outputs[0] || [];
    if (!output.length) return true;
    const inLeft = input[0];
    const inRight = input[1];
    const length = output[0].length;
    const settings = this.settings;
    const correctionAlpha = 1 - Math.exp(-1 / (sampleRate * (settings.retuneMs / 1000)));
    const mixAlpha = 1 - Math.exp(-1 / (sampleRate * 0.009));
    const baseDelay = 128;
    const sweep = Math.min(2048, Math.max(640, Math.round(sampleRate * 0.035)));
    for (let i = 0; i < length; i++) {
      let dry = inLeft ? (inLeft[i] || 0) : 0;
      if (inRight) dry = (dry + (inRight[i] || 0)) * 0.5;
      this.samples[this.writeIndex] = dry;
      this.writeIndex = (this.writeIndex + 1) & BUFFER_MASK;
      if (++this.totalSamples >= DETECT_WINDOW && --this.countdown <= 0) {
        this.countdown = DETECT_INTERVAL;
        this.updatePitch();
      }
      this.ratioCurrent += (this.ratioTarget - this.ratioCurrent) * correctionAlpha;
      this.phase += (this.ratioCurrent - 1) / sweep;
      this.phase -= Math.floor(this.phase);
      const a = this.phase;
      const b = (a + 0.5) % 1;
      const weightA = 0.5 - 0.5 * Math.cos(2 * Math.PI * a);
      const delayA = baseDelay + (1 - a) * sweep;
      const delayB = baseDelay + (1 - b) * sweep;
      const wet = this.readAt(delayA) * weightA + this.readAt(delayB) * (1 - weightA);
      // When pitch is already on a note or no voice is detected, pass dry to
      // avoid unnecessary comb filtering. Fade in the processed voice smoothly.
      const activity = Math.min(1, Math.abs(this.ratioCurrent - 1) / 0.015);
      const wantedWet = (settings.enabled ? 1 : 0) * (settings.mix / 100) * activity;
      this.wetCurrent += (wantedWet - this.wetCurrent) * mixAlpha;
      const sample = dry * (1 - this.wetCurrent) + wet * this.wetCurrent;
      for (const channel of output) channel[i] = Number.isFinite(sample) ? sample : 0;
    }
    return true;
  }
}
registerProcessor('karaokeverse-autotune', KaraokeAutotuneProcessor);
