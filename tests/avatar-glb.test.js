import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const file=new URL('../public/models/karaoke-avatar.glb',import.meta.url);
const bytes=fs.readFileSync(file);
function parseGLB(buffer){
 assert.equal(buffer.toString('ascii',0,4),'glTF');assert.equal(buffer.readUInt32LE(4),2);
 assert.equal(buffer.readUInt32LE(8),buffer.length);
 const jsonLen=buffer.readUInt32LE(12);
 assert.equal(buffer.toString('ascii',16,20),'JSON');
 const gltf=JSON.parse(buffer.toString('utf8',20,20+jsonLen));
 const binOffset=20+jsonLen;
 assert.equal(buffer.toString('ascii',binOffset+4,binOffset+8),'BIN\0');
 return {gltf,bytes:buffer.readUInt32LE(binOffset)};
}
const parsed=parseGLB(bytes),gltf=parsed.gltf;
test('Bundled GLB is complete, parseable and genuinely embedded',()=>{
 assert.ok(parsed.bytes>3000);assert.ok(gltf.nodes.length>=25);assert.ok(gltf.meshes.length>3);
 assert.ok(bytes.length<1_000_000);assert.equal(gltf.buffers[0].uri,undefined);
 assert.ok(gltf.buffers[0].byteLength<=parsed.bytes);
});
test('Animated avatar includes 10 named actions and actual node keyframes',()=>{
 const clips=new Set(gltf.animations.map(a=>a.name));
 for(const action of ['idle','walk','sit','sing','dance','wave','clap','cheer','bow','heart'])assert.ok(clips.has(action));
 for(const animation of gltf.animations){
  assert.ok(animation.samplers.length>0&&animation.channels.length>0,`${animation.name} missing keyframes`);
  for(const chan of animation.channels){
   const sampler=animation.samplers[chan.sampler];
   assert.ok(gltf.accessors[sampler.input]?.count>=2);
   assert.ok(gltf.nodes[chan.target.node]);
   assert.ok(['rotation','translation'].includes(chan.target.path));
  }
 }
});
test('Semantic rig nodes are available for karaoke poses and accessories',()=>{
 const names=new Set(gltf.nodes.map(n=>n.name));
 for(const n of ['AvatarRoot','Hips','Torso','Head','ArmL','ArmR','LegL','LegR','Mic','HairBangs','HairLong','GlassesBridge'])assert.ok(names.has(n),n);
});
test('Assets are self-contained and do not request external images',()=>{
 assert.ok(!gltf.images?.length);assert.ok(!gltf.extensionsRequired?.length);
});
test('Avatar multiplayer and camera control are connected end to end',()=>{
 const root=path.dirname(new URL(file).pathname).replace(/\/public\/models$/, '');
 const server=fs.readFileSync(path.join(root,'server.js'),'utf8');
 const app=fs.readFileSync(path.join(root,'public/app.js'),'utf8');
 const scene=fs.readFileSync(path.join(root,'public/scene.js'),'utf8');
 const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
 for(const phrase of ["socket.on('avatar:update'", "io.to(room.code).emit('user:avatar'",'normalizeAvatarProfile(details.avatarProfile)'])assert.ok(server.includes(phrase),phrase);
 for(const phrase of ["socket.on('user:avatar'", "emitAck('avatar:update'",'createAvatarStudio'])assert.ok(app.includes(phrase),phrase);
 for(const phrase of ['avatarLibrary.instantiate','modelHandle.update','selectedView===\'cinematic\''])assert.ok(scene.includes(phrase),phrase);
 for(const id of ['avatar-studio-modal','avatar-edit-room','avatar-edit-welcome','avatar-studio-preview','data-view="cinematic"'])assert.ok(html.includes(id),id);
});
