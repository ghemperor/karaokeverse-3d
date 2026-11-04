import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {AVATAR_PALETTES,AVATAR_CHOICES,AVATAR_PRESETS,normalizeAvatarProfile,DEFAULT_AVATAR_PROFILE} from '../public/avatar-profile.js';
import {isAvatarPartVisible} from '../public/avatar-materials.js';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const read=(relative)=>fs.readFileSync(path.join(root,relative),'utf8');
const glb=fs.readFileSync(path.join(root,'public/models/karaoke-avatar.glb'));
const jsonLen=glb.readUInt32LE(12);
const gltf=JSON.parse(glb.toString('utf8',20,20+jsonLen));
const names=new Set(gltf.nodes.map(n=>n.name));
const clips=new Set(gltf.animations.map(a=>a.name));

test('Atelier GLB has enhanced face, wardrobe, hair and shoe details',()=>{
 assert.ok(gltf.nodes.length>=90,'expected detailed model');
 assert.ok(glb.length<400_000,'keep model lightweight for mobile');
 for(const name of ['EyeWhiteL','EyeHighlightR','PupilL','BlushR','SmileMouth','JoyMouth','StyleJacketL','StyleHoodieHood','StyleFormalTie','HairPonytail','HairCurly3','ShoeSoleL','ShoelaceR2','MicGrilleRing']){
   assert.ok(names.has(name),name);
 }
});
test('Atelier provides 12 named animation clips including compatible karaoke actions',()=>{
 for(const name of ['idle','walk','sit','sing','dance','wave','clap','cheer','bow','heart','pose','salute'])assert.ok(clips.has(name),name);
});
test('Avatar profiles allow every prescribed safe choice and reject untrusted values',()=>{
 for(const [key,colors] of Object.entries(AVATAR_PALETTES))for(const id of Object.keys(colors)){
   assert.equal(normalizeAvatarProfile({[key]:id})[key],id);
 }
 for(const [key,choices] of Object.entries(AVATAR_CHOICES))for(const id of choices){
   assert.equal(normalizeAvatarProfile({[key]:id})[key],id);
 }
 const normalized=normalizeAvatarProfile({outfitStyle:'<script>alert(1)</script>',expression:'invalid',__proto__:null});
 assert.equal(normalized.outfitStyle,DEFAULT_AVATAR_PROFILE.outfitStyle);
 assert.equal(normalized.expression,DEFAULT_AVATAR_PROFILE.expression);
});
test('Clothing, hair and facial expression visibility do not overlap',()=>{
 const profile=normalizeAvatarProfile({hairStyle:'ponytail',accessory:'none',outfitStyle:'formal',expression:'cool'});
 assert.equal(isAvatarPartVisible('HairPonytail',profile),true);
 assert.equal(isAvatarPartVisible('HairCurly1',profile),false);
 assert.equal(isAvatarPartVisible('StyleFormalTie',profile),true);
 assert.equal(isAvatarPartVisible('StyleHoodiePouch',profile),false);
 assert.equal(isAvatarPartVisible('SmileMouth',profile),false);
 assert.equal(isAvatarPartVisible('CoolMouth',profile),true);
 const hat={...profile,accessory:'cap'};
 assert.equal(isAvatarPartVisible('HairCap',hat),false);
 assert.equal(isAvatarPartVisible('CapCrown',hat),true);
 assert.equal(isAvatarPartVisible('HairPonytail',hat),false);
});
test('Presets are valid and never introduce unknown avatar fields',()=>{
 assert.ok(AVATAR_PRESETS.length>=4);
 for(const preset of AVATAR_PRESETS){
   const profile=normalizeAvatarProfile({...DEFAULT_AVATAR_PROFILE,...preset.profile});
   for(const [key,val] of Object.entries(preset.profile))assert.equal(profile[key],val);
 }
});
test('Atelier mobile UI exposes view controls, expressive preview, wardrobe tabs and undo',()=>{
 const html=read('public/index.html'),css=read('public/style.css'),js=read('public/avatar-studio.js');
 for(const id of ['avatar-studio-modal','avatar-studio-preview','avatar-studio-presets','avatar-studio-pose-select','avatar-studio-random','avatar-studio-undo','avatar-studio-done'])assert.ok(html.includes(`id="${id}"`),id);
 for(const view of ['front','side','back','free'])assert.ok(html.includes(`data-avatar-view="${view}"`));
 assert.ok(css.includes('height:100dvh'));
 assert.ok(js.includes('AVATAR_PRESETS')&&js.includes('history.push')&&js.includes('avatarLibrary.instantiate'));
});
test('NPC and player 3D actors use the upgraded model with procedural fallback',()=>{
 const scene=read('public/scene.js');
 assert.ok(scene.includes('installNPCGLB'));
 assert.ok(scene.includes('for(const npc of npcActors.values())installNPCGLB(npc)'));
 assert.ok(scene.includes('d.body.visible=false'));
 assert.ok(scene.includes('d.hips.visible=false'));
 assert.ok(scene.includes('keeping procedural character'));
});
