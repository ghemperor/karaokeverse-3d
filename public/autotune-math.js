// Pure musical helpers shared by the user interface, AudioWorklet and tests.
export const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export const SCALES = Object.freeze({
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
});
export const AUTOTUNE_DEFAULTS = Object.freeze({
  enabled: false,
  key: 0,
  scale: 'chromatic',
  strength: 85,
  retuneMs: 85,
  mix: 100,
});
function within(value, min, max, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(min, Math.min(max, numeric)) : fallback;
}
export function normalizeAutotune(input = {}) {
  return {
    enabled: input.enabled === true,
    key: Math.round(within(input.key, 0, 11, 0)),
    scale: Object.hasOwn(SCALES, input.scale) ? input.scale : 'chromatic',
    strength: within(input.strength, 0, 100, 85),
    retuneMs: within(input.retuneMs, 15, 250, 85),
    mix: within(input.mix, 0, 100, 100),
  };
}
export function frequencyToMidi(hz) {
  return Number.isFinite(hz) && hz > 0 ? 69 + 12 * Math.log2(hz / 440) : null;
}
export function midiToFrequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}
export function noteLabel(midi) {
  if (!Number.isFinite(midi)) return '—';
  const rounded = Math.round(midi);
  return `${NOTE_NAMES[((rounded % 12) + 12) % 12]}${Math.floor(rounded / 12) - 1}`;
}
export function nearestScaleMidi(midi, key, scale) {
  if (!Number.isFinite(midi)) return null;
  const config = normalizeAutotune({ key, scale });
  const allowed = SCALES[config.scale];
  let selected = Math.round(midi), best = Infinity;
  // Search ± one octave. All allowed note classes have a candidate in this range.
  for (let candidate = Math.floor(midi) - 12; candidate <= Math.ceil(midi) + 12; candidate++) {
    const pitchClass = ((candidate - config.key) % 12 + 12) % 12;
    if (!allowed.includes(pitchClass)) continue;
    const distance = Math.abs(candidate - midi);
    if (distance < best) { best = distance; selected = candidate; }
  }
  return selected;
}
export function correctionForFrequency(hz, settings) {
  const midi = frequencyToMidi(hz);
  if (midi === null) return null;
  const config = normalizeAutotune(settings);
  const targetMidi = nearestScaleMidi(midi, config.key, config.scale);
  const delta = (targetMidi - midi) * config.strength / 100;
  const ratio = Math.max(0.85, Math.min(1.18, 2 ** (delta / 12)));
  return { midi, targetMidi, targetHz: midiToFrequency(targetMidi), ratio, cents: (targetMidi - midi) * 100 };
}
