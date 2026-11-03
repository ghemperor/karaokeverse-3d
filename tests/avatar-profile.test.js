import test from 'node:test';
import assert from 'node:assert/strict';
import {AVATAR_PALETTES, AVATAR_CHOICES, DEFAULT_AVATAR_PROFILE, normalizeAvatarProfile,profilesEqual,AVATAR_EMOTES} from '../public/avatar-profile.js';
test('Avatar defaults are safe and stable',()=>{
 assert.deepEqual(normalizeAvatarProfile(),DEFAULT_AVATAR_PROFILE);
 assert.deepEqual(normalizeAvatarProfile(null),DEFAULT_AVATAR_PROFILE);
 assert.deepEqual(normalizeAvatarProfile([]),DEFAULT_AVATAR_PROFILE);
});
test('Avatar palettes accept known colors and reject code/injection',()=>{
 const p=normalizeAvatarProfile({skin:'deep',hair:'pink',outfit:'rose',hairStyle:'long',accessory:'glasses',build:'broad',__proto__:{isAdmin:true}});
 assert.equal(p.skin,'deep');assert.equal(p.hairStyle,'long');assert.equal(p.outfit,'rose');
 assert.equal(p.isAdmin,undefined);assert.equal(normalizeAvatarProfile({outfit:'<script>'}).outfit,'violet');
 assert.deepEqual(Object.keys(p).sort(),Object.keys(DEFAULT_AVATAR_PROFILE).sort(), 'profile must contain only defined settings');
});
test('Avatar models offer at least three hair options, 3 body types and 3 accessories',()=>{
 assert.ok(AVATAR_CHOICES.hairStyle.length>=3);assert.ok(AVATAR_CHOICES.build.length>=3);assert.ok(AVATAR_CHOICES.accessory.length>=3);
 assert.ok(Object.keys(AVATAR_PALETTES.outfit).length>=6);
});
test('Avatar profile comparison matches normalized profile state',()=>{
 assert.equal(profilesEqual(DEFAULT_AVATAR_PROFILE,normalizeAvatarProfile({})),true);
 assert.equal(profilesEqual(DEFAULT_AVATAR_PROFILE,normalizeAvatarProfile({hair:'pink'})),false);
});
test('Multiplayer emotes are explicit and do not include arbitrary strings',()=>{
 for(const e of ['stand','dance','clap','wave','cheer','bow','heart'])assert.ok(AVATAR_EMOTES.includes(e));
 assert.ok(!AVATAR_EMOTES.includes('arbitrary'));
});
