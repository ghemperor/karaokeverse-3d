import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CAMERA_VIEW_ORDER, CAMERA_VIEW_LABELS, nextCameraView, isCameraViewShortcut} from '../public/camera-views.js';

test('V steps through all seven existing camera views and wraps',()=>{
  assert.deepEqual(CAMERA_VIEW_ORDER,['front','wide','orbit','walk','follow','tv','cinematic']);
  for(let i=0;i<CAMERA_VIEW_ORDER.length;i++){
    assert.equal(nextCameraView(CAMERA_VIEW_ORDER[i]), CAMERA_VIEW_ORDER[(i+1)%CAMERA_VIEW_ORDER.length]);
    assert.ok(CAMERA_VIEW_LABELS[CAMERA_VIEW_ORDER[i]]);
  }
  assert.equal(nextCameraView('unknown'),'front');
});
test('Shift+V walks backwards and wraps',()=>{
  assert.equal(nextCameraView('front',-1),'cinematic');
  assert.equal(nextCameraView('follow',-1),'walk');
});
test('V shortcut only fires once and does not interrupt typing/pasting/modals',()=>{
  const basic={code:'KeyV',repeat:false,ctrlKey:false,altKey:false,metaKey:false,target:{closest:()=>null,isContentEditable:false}};
  assert.equal(isCameraViewShortcut(basic),true);
  assert.equal(isCameraViewShortcut({...basic,shiftKey:true}),true);
  assert.equal(isCameraViewShortcut(basic,true),false);
  assert.equal(isCameraViewShortcut({...basic,repeat:true}),false);
  assert.equal(isCameraViewShortcut({...basic,ctrlKey:true}),false);
  assert.equal(isCameraViewShortcut({...basic,metaKey:true}),false);
  assert.equal(isCameraViewShortcut({...basic,altKey:true}),false);
  assert.equal(isCameraViewShortcut({...basic,code:'KeyF'}),false);
  assert.equal(isCameraViewShortcut({...basic,target:{closest:()=>({tagName:'INPUT'})}}),false);
  assert.equal(isCameraViewShortcut({...basic,target:{isContentEditable:true,closest:()=>null}}),false);
});
test('camera hotkey uses same scene.setView as buttons and lives inside fullscreen element',()=>{
  const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
  const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  const stage=html.match(/<div class="stage-scene" id="stage-scene">([\s\S]*?)<\/div>\s*<div class="player-bar">/)?.[1];
  assert.ok(stage,'stage found');
  assert.match(stage,/id="scene-next-view"/);
  assert.match(app,/state\.scene\.setView\(nextCameraView\(state\.scene\.getView\(\),direction\)\)/);
  assert.match(app,/document\.addEventListener\('keydown',event=>\{[\s\S]*?isCameraViewShortcut\(event,overlayIsOpen\)/);
  assert.match(app,/scene-view-label/);
});
