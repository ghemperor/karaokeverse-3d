import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAutotune, nearestScaleMidi, frequencyToMidi, midiToFrequency, correctionForFrequency, noteLabel } from '../public/autotune-math.js';

test('pitch conversion and note labels are reversible', () => {
  assert.ok(Math.abs(frequencyToMidi(440) - 69) < 1e-7);
  assert.ok(Math.abs(midiToFrequency(69) - 440) < 1e-7);
  assert.equal(noteLabel(60), 'C4');
  assert.equal(noteLabel(69), 'A4');
});
test('scale quantization respects key and scale', () => {
  assert.equal(nearestScaleMidi(61.2, 0, 'major'), 62);
  assert.equal(nearestScaleMidi(61.2, 0, 'minor'), 62);
  assert.equal(nearestScaleMidi(61.2, 0, 'chromatic'), 61);
  assert.equal(nearestScaleMidi(63.7, 0, 'major'), 64);
  assert.equal(nearestScaleMidi(63.7, 0, 'minor'), 63);
});
test('normalized settings bound untrusted values', () => {
  const actual = normalizeAutotune({ enabled:'yes', key:60, scale:'unknown', strength:900, retuneMs:-4, mix:NaN });
  assert.deepEqual(actual, { enabled:false, key:11, scale:'chromatic', strength:100, retuneMs:15, mix:100 });
});
test('strength changes correct ratio and disabled voice has no pitch', () => {
  const original = midiToFrequency(60.35);
  const full = correctionForFrequency(original,{key:0, scale:'major',strength:100});
  const half = correctionForFrequency(original,{key:0, scale:'major',strength:50});
  assert.equal(full.targetMidi,60);
  assert.ok(full.ratio < half.ratio && half.ratio < 1);
  assert.equal(correctionForFrequency(0,{}),null);
});

test('worklet detects voiced signal and passes normal micro audio without autotune', async () => {
  const captured=[];
  globalThis.sampleRate = 48000;
  globalThis.AudioWorkletProcessor = class {
    constructor() { this.port = { onmessage:null, postMessage: message => captured.push(message) }; }
  };
  globalThis.registerProcessor = (name, klass) => { globalThis.workletName = name; globalThis.workletClass = klass; };
  const { KaraokeAutotuneProcessor } = await import('../public/autotune-processor.js');
  const processor = new KaraokeAutotuneProcessor({processorOptions:{settings:{enabled:true, scale:'major', key:0, strength:100}}});
  assert.equal(globalThis.workletName,'karaokeverse-autotune');
  let energy=0;
  for (let block=0; block<220; block++) {
    const input=new Float32Array(128), output=new Float32Array(128);
    for (let i=0;i<128;i++) input[i]=0.26*Math.sin(2*Math.PI*233.08188*(block*128+i)/sampleRate);
    assert.equal(processor.process([[input]],[[output]]),true);
    assert.ok(output.every(Number.isFinite));
    if(block>50)energy+=output.reduce((sum,x)=>sum+x*x,0);
  }
  assert.ok(energy>1);
  assert.ok(captured.some(message=>message.type==='pitch'&&message.detected),'Should report recognized note');
  processor.port.onmessage({data:{type:'configure',settings:{enabled:false}}});
  const dry=new Float32Array(128).fill(0.2), out=new Float32Array(128);
  // Effect crossfades off over several frames to prevent audible clicks.
  for (let block=0; block<25; block++) processor.process([[dry]],[[out]]);
  assert.ok(out[127]>0.19 && out[127]<0.21);
});

test('AudioWorklet actually shifts a steady voice tone toward a musical note', async () => {
  globalThis.sampleRate = 48000;
  globalThis.AudioWorkletProcessor = class {
    constructor() { this.port = {onmessage:null,postMessage() {}}; }
  };
  globalThis.registerProcessor = () => {};
  const { KaraokeAutotuneProcessor } = await import('../public/autotune-processor.js');
  const processor = new KaraokeAutotuneProcessor({processorOptions:{
    settings:{enabled:true,key:0,scale:'major',strength:100,retuneMs:20,mix:100},
  }});
  const target = [];
  for (let block=0; block<750; block++) {
    const input=new Float32Array(128),output=new Float32Array(128);
    for (let i=0;i<128;i++) input[i]=0.3*Math.sin(2*Math.PI*237*(block*128+i)/sampleRate);
    processor.process([[input]],[[output]]);
    if (block >= 500) target.push(...output);
  }
  let crossings=0;
  for(let i=1;i<target.length;i++)if(target[i-1]<=0 && target[i]>0)crossings++;
  const estimatedHz=crossings*sampleRate/target.length;
  // 237 Hz is closer to B3 (246.94 Hz) than A3 (220 Hz) in C major.
  assert.ok(estimatedHz>242 && estimatedHz<253,`Shifted pitch should be near B3, got ${estimatedHz.toFixed(1)} Hz`);
});
