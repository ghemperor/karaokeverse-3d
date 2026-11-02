import test from 'node:test';
import assert from 'node:assert/strict';
import { MIXER_DEFAULTS, MIXER_PRESETS, normalizeMixer, presetMixer, dbToGain, makeImpulse, createKaraokeMixer } from '../public/audio-mixer.js';

test('mixer defaults are safe and preset is natural',()=>{
  assert.equal(normalizeMixer().preset,'natural');
  assert.equal(normalizeMixer().monitor,false);
  assert.ok(MIXER_DEFAULTS.echoFeedback<40);
});

test('clamps input and rejects invalid values',()=>{
  const s=normalizeMixer({inputGain:999,bass:-999,echoTime:-50,echoFeedback:200,echoMix:999,reverbMix:999,micOutput:500,
    musicVolume:-2,voiceVolume:'not-a-number',reverbRoom:'../../../',monitor:'yes'});
  assert.equal(s.inputGain,12);
  assert.equal(s.bass,-12);
  assert.equal(s.echoTime,70);
  assert.equal(s.echoFeedback,55);
  assert.equal(s.echoMix,60);
  assert.equal(s.reverbMix,60);
  assert.equal(s.micOutput,100);
  assert.equal(s.musicVolume,0);
  assert.equal(s.voiceVolume,85);
  assert.equal(s.reverbRoom,'small');
  assert.equal(s.monitor,false);
});

test('presets keep user playback/voice volumes and monitor state',()=>{
  const previous=normalizeMixer({...MIXER_DEFAULTS,musicVolume:36,voiceVolume:50,monitor:true});
  const b=presetMixer('ballad',previous);
  assert.equal(b.preset,'ballad');
  assert.equal(b.musicVolume,36);
  assert.equal(b.voiceVolume,50);
  assert.equal(b.monitor,true);
  assert.ok(b.echoMix>MIXER_PRESETS.natural.echoMix);
  assert.equal(presetMixer('unknown',previous).preset,'natural');
});

test('gain conversion and impulse buffers are deterministic',()=>{
  assert.ok(Math.abs(dbToGain(0)-1)<1e-12);
  assert.ok(Math.abs(dbToGain(6)-1.995)<0.01);
  const context={sampleRate:1000,createBuffer(channels,len,rate){
    assert.equal(channels,2);assert.equal(rate,1000);
    const arrays=[new Float32Array(len),new Float32Array(len)];
    return {length:len,getChannelData(i){return arrays[i]}};
  }};
  const small=makeImpulse(context,'small');const large=makeImpulse(context,'large');
  assert.equal(small.length,620);
  assert.equal(large.length,2100);
  assert.equal(small.getChannelData(0)[0],makeImpulse(context,'small').getChannelData(0)[0]);
  assert.ok(small.getChannelData(0).every(Number.isFinite));
});

function mockAudioContext(){
  class Param{
    constructor(v=0){this.value=v;this.history=[]}
    setTargetAtTime(v){if(!Number.isFinite(v))throw Error('Invalid AudioParam');this.value=v;this.history.push(v)}
  }
  class Node{
    constructor(kind){this.kind=kind;this.connections=[];this.gain=new Param(1);this.frequency=new Param(0);
      this.Q=new Param(1);this.threshold=new Param(0);this.ratio=new Param(1);
      this.knee=new Param(0);this.attack=new Param(0);this.release=new Param(0);
      this.delayTime=new Param(0);this.buffer=null;}
    connect(other){this.connections.push(other);return other}
  }
  const nodes=[];
  const create=(kind)=>{const node=new Node(kind);nodes.push(node);return node};
  const ctx={currentTime:0,sampleRate:48000,destination:create('speakers'),
    createGain:()=>create('gain'),createBiquadFilter:()=>create('filter'),
    createDynamicsCompressor:()=>create('compressor'),createDelay:()=>create('delay'),
    createConvolver:()=>create('convolver'),
    createMediaStreamDestination:()=>Object.assign(create('media-stream-dest'),{stream:{getAudioTracks:()=>[{kind:'audio'}]}}),
    createBuffer(ch,length){const data=Array.from({length:ch},()=>new Float32Array(length));return {getChannelData:i=>data[i]}}};
  return {ctx,create,nodes};
}

test('audio graph routes microphone through EQ, compressor, echo, reverb to outgoing stream',()=>{
  const {ctx,create,nodes}=mockAudioContext();
  const source=create('microphone');
  const mix=createKaraokeMixer(ctx,source,normalizeMixer({echoMix:35,echoFeedback:30,reverbMix:25,monitor:false}));
  assert.equal(mix.stream.getAudioTracks().length,1);
  assert.ok(source.connections.length>0);
  assert.equal(mix.nodes.feedback.gain.value,.30);
  assert.equal(mix.nodes.echoWet.gain.value,.35);
  assert.equal(mix.nodes.reverbWet.gain.value,.25);
  assert.equal(mix.nodes.monitorGain.gain.value,0,'local monitor must be muted by default');
  // Echo feedback must feed ONLY the delay, never directly into speakers.
  assert.equal(mix.nodes.feedback.connections[0],mix.nodes.delay);
  assert.ok(nodes.some(n=>n.kind==='media-stream-dest'));
  mix.applySettings(normalizeMixer({echoMix:60,echoFeedback:55,reverbMix:60,monitor:true}));
  assert.equal(mix.nodes.echoWet.gain.value,.60);
  assert.equal(mix.nodes.feedback.gain.value,.55);
  assert.equal(mix.nodes.monitorGain.gain.value,.35);
});
