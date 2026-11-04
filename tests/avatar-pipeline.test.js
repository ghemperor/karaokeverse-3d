import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {safeModelPath,validateAvatarCatalog,matchAnimationName,AVATAR_ROLES,DEFAULT_AVATAR_SRC} from '../public/avatar-catalog.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const code=p=>fs.readFileSync(path.join(root,p),'utf8');

test('allows only same-origin, /models/-rooted GLB GLTF VRM files',()=>{
  for(const valid of ['/models/people/player.glb','/models/DJ.vrm','/models/crew/staff-1.gltf'])assert.equal(safeModelPath(valid),valid);
  for(const invalid of ['https://evil.com/track.vrm','/config','/models/../private.glb','//server/models/a.glb','/models/x.js','/models/%2e%2e/a.glb','/models/x.glb?token=secret','/models/a b.glb',null])assert.equal(safeModelPath(invalid),null);
});

test('different roles have independent local model configuration and safe fallback',()=>{
  const cfg=validateAvatarCatalog({models:{
    player:{src:'/models/people/player.glb',height:1.9,yawDegrees:180,materialBindings:{hair:['Hair','hair_black']}},
    dj:{src:'/models/people/dj.vrm',height:1.74,yawDegrees:-90},
    linh:{src:'https://foreign.invalid/l.gltf',height:999},
  }});
  assert.deepEqual(AVATAR_ROLES,['player','dj','linh','mai','vy']);
  assert.equal(cfg.models.player.src,'/models/people/player.glb');
  assert.equal(cfg.models.dj.src,'/models/people/dj.vrm');
  assert.equal(cfg.models.linh.src,DEFAULT_AVATAR_SRC);
  assert.equal(cfg.models.linh.height,2.3);
  assert.deepEqual(cfg.models.player.materialBindings.hair,['Hair','hair_black']);
});

test('invalid material selectors and dangerous paths are not accepted',()=>{
  const m=validateAvatarCatalog({models:{player:{src:'/models/p.glb',materialBindings:{skin:['Skin','<img onerror=alert(1)>',27]}}}}).models.player;
  assert.deepEqual(m.materialBindings.skin,['Skin']);
});

test('animation clip aliases work across common naming conventions',()=>{
  const names=['Armature|Idle','Mixamo_Walk','Dance','Song.Sing'];
  const aliases={walk:['Mixamo_Walk'],idle:['Idle'],sing:['Sing']};
  assert.equal(matchAnimationName(names,'walk',aliases),'Mixamo_Walk');
  assert.equal(matchAnimationName(names,'idle',aliases),'Armature|Idle');
  assert.equal(matchAnimationName(names,'sing',aliases),'Song.Sing');
  assert.equal(matchAnimationName([], 'dance',aliases),null);
});

test('shipped catalog is valid JSON and all 5 roles resolve',()=>{
  const cfg=validateAvatarCatalog(JSON.parse(code('public/models/avatar-catalog.json')));
  for(const role of AVATAR_ROLES){
    assert.ok(cfg.models[role]);assert.ok(safeModelPath(cfg.models[role].src));
  }
});

test('runtime uses skeleton-safe clones, automatic height fit, and clean fallback',()=>{
  const runtime=code('public/avatar-runtime.js');
  for(const fragment of ['cloneSkeleton(asset.scene)','Box3','spec.height','height/Math.max','loadAsync','DEFAULT_AVATAR_SRC','fadeIn','model.traverse','dispose()'])assert.ok(runtime.includes(fragment),fragment);
  assert.ok(code('public/scene.js').includes("avatarLibrary.instantiate('player'"));
  assert.ok(code('public/scene.js').includes('avatarLibrary.instantiate(d.id'));
  assert.ok(code('public/avatar-studio.js').includes("avatarLibrary.instantiate('player'"));
});
