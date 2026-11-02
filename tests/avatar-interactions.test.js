import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getSofaSeat, SOFA_SEATS, SINGING_ARM, isWalkingPositionBlocked, standFromSofa} from '../public/avatar-interactions.js';

test('standing up from any sofa stays by the same sofa, without collision or spawn teleport',()=>{
  assert.equal(SOFA_SEATS.length,4);
  const exits=[];
  for(let i=0;i<SOFA_SEATS.length;i++){
    const seat=getSofaSeat(i);
    const stand=standFromSofa(i,seat.seat);
    assert.deepEqual(stand,seat.stand);
    assert.equal(stand[1],1.68);
    assert.equal(isWalkingPositionBlocked(stand[0],stand[2]),false,`exit for sofa ${i} blocked`);
    assert.ok(Math.hypot(stand[0]-seat.seat[0],stand[2]-seat.seat[2])<2,`sofa ${i} exit too far away`);
    assert.notDeepEqual(stand,[0,1.68,4.75]);
    exits.push(stand.join(','));
  }
  assert.ok(Math.sin(SOFA_SEATS[0].yaw)>0,'left sofa should look toward the room centre');
  assert.ok(Math.sin(SOFA_SEATS[1].yaw)<0,'right sofa should look toward the room centre');
  assert.equal(new Set(exits).size,4,'each sofa must have its own stand point');
});

test('invalid seat never teleports to another seat or spawn',()=>{
  assert.equal(getSofaSeat(99),null);
  assert.equal(getSofaSeat('0'),null);
  assert.deepEqual(standFromSofa(null,[2.2,1.27,-1.3]),[2.2,1.68,-1.3]);
});

test('microphone grip keeps a bent elbow and its grille near the mouth',()=>{
  const {shoulder,elbow,wrist,micGrilleHeight}=SINGING_ARM;
  const dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
  assert.ok(Math.abs(dist(shoulder,elbow)-.25)<.015);
  assert.ok(Math.abs(dist(elbow,wrist)-.28)<.015);
  assert.ok(wrist[2] < shoulder[2] -.22, 'hand should be in front of chest');
  const grille=[wrist[0],wrist[1]+micGrilleHeight,wrist[2]];
  const mouth=[0, .94-.12-.18, -.315]; // mouth in torso coordinates (head is a hips child)
  assert.ok(dist(grille,mouth)<.29,'microphone grille must be next to lips');
});
