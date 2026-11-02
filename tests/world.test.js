import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorld, updateWorld, cleanEmote } from '../lib/world.js';
import { cleanPosition } from '../lib/position.js';

test('synchronized room world actions are constrained', () => {
  const initial = createWorld();
  assert.equal(initial.lightMode, 0);
  assert.equal(initial.party, false);
  assert.equal(updateWorld(initial, '__proto__'), null);
  assert.equal(updateWorld(initial, 'microphone'), null);
  const changed = updateWorld(initial, 'lights');
  assert.equal(changed.lightMode, 1);
  assert.equal(initial.lightMode, 0);
  assert.equal(updateWorld(changed, 'party').party, true);
  assert.equal(updateWorld(changed, 'party').revision, 2);
});
test('validates emotes, singer and avatar pose', () => {
  assert.equal(cleanEmote('dance'), 'dance');
  assert.equal(cleanEmote('sing'), null);
  assert.equal(cleanPosition({x:0,z:0,yaw:0,pose:'clap'}).pose,'clap');
  assert.equal(cleanPosition({x:0,z:0,yaw:0,pose:'unknown'}).pose,'stand');
});
