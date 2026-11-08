import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPixelRatio, createAdaptiveQuality } from '../public/render-quality.js';

test('fullscreen caps rendered pixels even on high-DPI monitor', () => {
  const ratio = renderPixelRatio({width:2560,height:1440,devicePixelRatio:2,fullscreen:true});
  assert.ok(ratio * ratio * 2560 * 1440 <= 2000000);
  assert.ok(ratio < 1);
});

test('fullscreen at same viewport uses no higher ratio than window mode', () => {
  for (const dims of [[1920,1080],[1440,900],[390,844]]) {
    const [width,height] = dims;
    const common = {width,height,devicePixelRatio:2};
    assert.ok(renderPixelRatio({...common,fullscreen:true,mobile:width<700})
      <= renderPixelRatio({...common,fullscreen:false,mobile:width<700}));
  }
});

test('auto mode backs down after sustained low FPS and recovers slowly', () => {
  const q = createAdaptiveQuality({sampleMs:1000});
  let t=0; q.sample(t);
  for(let i=0;i<100;i++){ t+=25; q.sample(t); } // ~40 FPS
  assert.ok(q.scale<1);
  const dropped=q.scale;
  for(let i=0;i<420;i++){ t+=16.66; q.sample(t); } // ~60 FPS
  assert.ok(q.scale>dropped);
});

test('ignores long background pause and invalid viewport',()=>{
  const q=createAdaptiveQuality();q.sample(0);q.sample(1000);q.sample(4000);
  assert.equal(q.scale,1);
  const ratio=renderPixelRatio({width:0,height:0,devicePixelRatio:0});
  assert.ok(Number.isFinite(ratio) && ratio>0);
});
