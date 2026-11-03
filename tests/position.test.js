import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanPosition } from '../lib/position.js';

test('normalizes valid movement and sitting state',()=>{
  const pos=cleanPosition({x:1.2,z:2.25,yaw:Math.PI*3,pose:'sit'});
  assert.equal(pos.x,1.2);assert.equal(pos.z,2.25);assert.equal(pos.pose,'sit');
  assert.ok(Math.abs(pos.yaw-Math.PI)<1e-8);
});
test('rejects invalid movement and clamps to room bounds',()=>{
  assert.equal(cleanPosition({x:'bad',z:0,yaw:0}),null);
  assert.equal(cleanPosition({x:Infinity,z:0,yaw:0}),null);
  assert.equal(cleanPosition(null),null);
  assert.deepEqual(cleanPosition({x:1000,z:-1000,yaw:0,pose:'unknown'}),{x:6.73,z:-4.35,yaw:0,pose:'stand'});
});

test('new v1.4 emotes survive sanitized multiplayer position',()=>{
 for(const pose of ['cheer','bow','heart'])assert.equal(cleanPosition({x:0,z:0,yaw:0,pose}).pose,pose);
});
