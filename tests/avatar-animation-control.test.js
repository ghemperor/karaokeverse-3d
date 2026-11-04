import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {matchAnimationName,validateAvatarCatalog} from '../public/avatar-catalog.js';

test('does not auto-play first arbitrary imported GLB animation as Idle',()=>{
  assert.equal(matchAnimationName(['Dance','Walk'],'idle',{idle:['Idle']}),null);
  assert.equal(matchAnimationName(['Take 001'],'idle',{idle:['Idle']}),null);
  assert.equal(matchAnimationName(['Dance','Walk'],'walk',{walk:['Walk']}),'Walk');
});
test('correct aliases bind imported named animations to the intended game actions',()=>{
  const aliases=validateAvatarCatalog({animationAliases:{idle:['Breathing'],walk:['Character|Walking'],sing:['Take 001'],dance:['Armature|Action (Dancing)']}}).animationAliases;
  const available=['Breathing','Character|Walking','Take 001','Armature|Action (Dancing)'];
  assert.equal(matchAnimationName(available,'idle',aliases),'Breathing');
  assert.equal(matchAnimationName(available,'walk',aliases),'Character|Walking');
  assert.equal(matchAnimationName(available,'sing',aliases),'Take 001');
  assert.equal(matchAnimationName(available,'dance',aliases),'Armature|Action (Dancing)');
});
test('runtime fades out unmatched action and shows animation mapping diagnostics',()=>{
  const runtime=fs.readFileSync(new URL('../public/avatar-runtime.js',import.meta.url),'utf8');
  const studio=fs.readFileSync(new URL('../public/avatar-studio.js',import.meta.url),'utf8');
  assert.match(runtime,/if\(!matched\)\{[\s\S]*?currentAction\.fadeOut/);
  assert.match(runtime,/resolvedActions:/);
  assert.match(studio,/Game action mapping/);
  assert.match(studio,/Chưa có clip/);
});
