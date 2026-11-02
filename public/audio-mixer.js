// KaraokeVerse DSP settings and Web Audio mixer. Only local microphone audio is
// routed into this graph. YouTube stays inside the official iframe player.
export const MIXER_DEFAULTS = Object.freeze({
  preset: 'natural', inputGain: 0, bass: 0, mid: 0, treble: 1,
  compression: 45, echoTime: 230, echoFeedback: 16, echoMix: 9,
  reverbMix: 12, reverbRoom: 'small', micOutput: 85,
  musicVolume: 75, voiceVolume: 85, monitor: false,
});

export const MIXER_RANGES = Object.freeze({
  inputGain: [-12, 12], bass: [-12, 12], mid: [-12, 12], treble: [-12, 12],
  compression: [0, 100], echoTime: [70, 600], echoFeedback: [0, 55],
  echoMix: [0, 60], reverbMix: [0, 60], micOutput: [0, 100],
  musicVolume: [0, 100], voiceVolume: [0, 100],
});

export const MIXER_PRESETS = Object.freeze({
  natural: { inputGain:0, bass:0, mid:0, treble:1, compression:45, echoTime:230, echoFeedback:16, echoMix:9, reverbMix:12, reverbRoom:'small', micOutput:85 },
  ballad:  { inputGain:2, bass:1, mid:0, treble:2, compression:55, echoTime:325, echoFeedback:25, echoMix:25, reverbMix:25, reverbRoom:'medium', micOutput:80 },
  bolero:  { inputGain:2, bass:2, mid:-1,treble:1, compression:55, echoTime:280, echoFeedback:27, echoMix:28, reverbMix:30, reverbRoom:'large', micOutput:80 },
  pop:     { inputGain:1, bass:-1,mid:2, treble:2, compression:65, echoTime:190, echoFeedback:20, echoMix:18, reverbMix:16, reverbRoom:'medium', micOutput:80 },
  speech:  { inputGain:0, bass:-1,mid:2, treble:0, compression:40, echoTime:200, echoFeedback:0, echoMix:0, reverbMix:0, reverbRoom:'small', micOutput:90 },
});

export function normalizeMixer(value = {}) {
  const src = value && typeof value === 'object' ? value : {};
  const result = { ...MIXER_DEFAULTS };
  for (const [key, [min, max]] of Object.entries(MIXER_RANGES)) {
    const v = Number(src[key]);
    if (src[key] !== undefined && src[key] !== null && src[key] !== '' && Number.isFinite(v)) {
      result[key] = Math.max(min, Math.min(max, Math.round(v)));
    }
  }
  result.reverbRoom = ['small', 'medium', 'large'].includes(src.reverbRoom) ? src.reverbRoom : MIXER_DEFAULTS.reverbRoom;
  result.preset = src.preset === undefined ? 'natural' : (Object.hasOwn(MIXER_PRESETS, src.preset) ? src.preset : 'custom');
  result.monitor = src.monitor === true;
  return result;
}

export function presetMixer(name, previous = MIXER_DEFAULTS) {
  const preset = MIXER_PRESETS[name];
  if (!preset) return normalizeMixer(previous);
  // Preserve local speaker and playback settings when changing vocal presets.
  return normalizeMixer({ ...previous, ...preset, preset:name });
}

export function dbToGain(db) { return Math.pow(10, db / 20); }

// A synthetic stereo impulse response: reverb does not require audio samples
// from a third-party recording or access to the YouTube player's soundtrack.
export function makeImpulse(context, room = 'small') {
  const spec = { small:[0.62,2.7], medium:[1.2,2.25], large:[2.1,2.05] }[room] || [0.62,2.7];
  const count = Math.ceil(spec[0] * context.sampleRate);
  const buffer = context.createBuffer(2, count, context.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let seed = channel ? 35731 : 19477;
    for(let i = 0; i < count; i++) {
      // Deterministic noise, exponentially decaying (not an infinite feedback loop).
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const noise = (seed / 4294967295) * 2 - 1;
      const t = i / count;
      data[i] = noise * Math.pow(1 - t, spec[1]) * 0.65;
    }
  }
  return buffer;
}

function filter(context, type, frequency, q=0.707) {
  const f=context.createBiquadFilter(); f.type=type; f.frequency.value=frequency; f.Q.value=q; return f;
}

export function createKaraokeMixer(context, input, firstSettings = MIXER_DEFAULTS) {
  const preamp=context.createGain();
  const highpass=filter(context, 'highpass', 80);
  const bass=filter(context, 'lowshelf', 180);
  const mid=filter(context, 'peaking', 1250, 0.85);
  const treble=filter(context, 'highshelf', 4300);
  const compressor=context.createDynamicsCompressor();
  compressor.knee.value=12; compressor.attack.value=0.006; compressor.release.value=0.17;
  const postEQ=context.createGain();
  const dry=context.createGain();
  const delay=context.createDelay(0.7);
  const feedback=context.createGain();
  const echoWet=context.createGain();
  const convolver=context.createConvolver();
  const reverbWet=context.createGain();
  const sum=context.createGain();
  const limiter=context.createDynamicsCompressor();
  limiter.threshold.value=-3; limiter.knee.value=0; limiter.ratio.value=20;
  limiter.attack.value=0.003; limiter.release.value=0.14;
  const output=context.createMediaStreamDestination();
  const monitorGain=context.createGain();
  monitorGain.gain.value=0;

  input.connect(preamp);
  preamp.connect(highpass);highpass.connect(bass);bass.connect(mid);
  mid.connect(treble);treble.connect(compressor);compressor.connect(postEQ);
  postEQ.connect(dry);dry.connect(sum);
  postEQ.connect(delay);delay.connect(echoWet);echoWet.connect(sum);
  delay.connect(feedback);feedback.connect(delay);
  postEQ.connect(convolver);convolver.connect(reverbWet);reverbWet.connect(sum);
  sum.connect(limiter);limiter.connect(output);
  limiter.connect(monitorGain);monitorGain.connect(context.destination);
  let lastRoom;
  const smooth=(param,value)=>{
    const now=context.currentTime;
    param.setTargetAtTime(value,now,0.018);
  };
  const applySettings=(settings)=>{
    const s=normalizeMixer(settings);
    smooth(preamp.gain,dbToGain(s.inputGain));
    smooth(bass.gain,s.bass);smooth(mid.gain,s.mid);smooth(treble.gain,s.treble);
    // 0 => compressor effectively bypassed; 100 => pronounced vocal compression.
    smooth(compressor.threshold,-6 - s.compression * 0.34);
    smooth(compressor.ratio,1 + s.compression * 0.065);
    smooth(delay.delayTime,s.echoTime/1000);
    smooth(feedback.gain,s.echoFeedback/100);
    smooth(dry.gain,1);
    smooth(echoWet.gain,s.echoMix/100);
    if(lastRoom!==s.reverbRoom){convolver.buffer=makeImpulse(context,s.reverbRoom);lastRoom=s.reverbRoom;}
    smooth(reverbWet.gain,s.reverbMix/100);
    smooth(sum.gain,(s.micOutput/100)*0.8);
    // Very low level headset-only monitoring, OFF by default to prevent feedback.
    smooth(monitorGain.gain,s.monitor?0.35:0);
  };
  applySettings(firstSettings);
  return { stream:output.stream, applySettings, nodes:{preamp,bass,mid,treble,compressor,delay,feedback,echoWet,reverbWet,limiter,monitorGain} };
}
