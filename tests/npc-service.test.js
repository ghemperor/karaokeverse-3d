import test from 'node:test';
import assert from 'node:assert/strict';
import {createNPCState, performNPCAction, publicNPCs, npcMemberLeaves, cleanNPCName} from '../lib/npc-service.js';
const a={id:'a',name:'An'},b={id:'b',name:'Bình'};
function apply(state,npcId,action,actor=a,host=false,extra={}) {
 return performNPCAction(state,{npcId,action,...extra},actor,host,1700000000000);
}
test('NPCs have named adult staff and resident DJ without using player slots',()=>{
 const s=createNPCState();assert.deepEqual(s.staff.map(x=>x.name),['Linh','Mai','Vy']);
 assert.equal(s.dj.name,'DJ Luna');assert.equal(s.staff.length,3);
});
test('staff can be called and serve virtual drinks, cheers and dismissed',()=>{
 let s=createNPCState();const call=apply(s,'linh','call');assert.equal(call.ok,true);
 s=call.state;assert.equal(s.staff[0].calledBy,'a');
 const served=apply(s,'linh','serve',a,false,{drink:'beer'});assert.equal(served.ok,true);
 assert.equal(served.state.staff[0].drink,'beer');
 assert.match(apply(served.state,'linh','cheers').message,/cụng ly/);
 const done=apply(served.state,'linh','thanks');assert.equal(done.ok,true);
 assert.equal(done.state.staff[0].status,'idle');
});
test('member cannot hijack another member staff or order drinks without calling',()=>{
 let s=createNPCState();assert.equal(apply(s,'mai','serve').ok,false);
 s=apply(s,'mai','call').state;
 assert.equal(apply(s,'mai','call',b).ok,false);
 assert.equal(apply(s,'mai','dismiss',b).ok,false);
 assert.equal(apply(s,'mai','serve',b,false,{drink:'soda'}).ok,false);
 assert.equal(apply(s,'mai','serve',a,false,{drink:'wine'}).ok,false);
});
test('host naming is validated; script injection and untrusted names are rejected',()=>{
 const s=createNPCState();assert.equal(apply(s,'dj','rename',a,false,{name:'DJ Hoa'}).ok,false);
 assert.equal(apply(s,'dj','rename',a,true,{name:'<script>'}).ok,false);
 const result=apply(s,'dj','rename',a,true,{name:'DJ Nắng'});
 assert.equal(result.ok,true);assert.equal(result.state.dj.name,'DJ Nắng');
 assert.equal(cleanNPCName('  Bảo  Châu  '),'Bảo Châu');
 assert.equal(cleanNPCName('A'),null);
});
test('DJ responds and only host toggles visual DJ performance',()=>{
 const s=createNPCState();assert.match(apply(s,'dj','greet').message,/Chào/);
 assert.equal(apply(s,'dj','dj-toggle').ok,false);
 assert.equal(apply(s,'dj','dj-toggle',a,true).state.dj.active,false);
});
test('NPC state is isolated and actors return to home on caller leave',()=>{
 let s=createNPCState();s=apply(s,'vy','call').state;
 const left=npcMemberLeaves(s,'a');assert.equal(left.staff[2].status,'idle');
 assert.equal(s.staff[2].status,'serving');
 const p=publicNPCs(left);p.staff[2].name='Bad';assert.equal(left.staff[2].name,'Vy');
});
test('room events and UI IDs and scene interactions are wired',async()=>{
 const fs=await import('node:fs');
 const server=fs.readFileSync(new URL('../server.js',import.meta.url),'utf8');
 const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 const scene=fs.readFileSync(new URL('../public/scene.js',import.meta.url),'utf8');
 const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 for(const fragment of ["socket.on('npc:action'", "emit('npc:state'",'npcMemberLeaves'])assert.ok(server.includes(fragment),fragment);
 for(const fragment of ['createNPCUI','npcUI.render()','onNPCInteract','mobile-feature-sheet'])assert.ok(app.includes(fragment),fragment);
 for(const fragment of ['setNPCState','createNPCActor','callbacks.onNPCInteract'])assert.ok(scene.includes(fragment),fragment);
 for(const id of ['npc-panel','npc-select','npc-name','npc-drink','npc-feed','mobile-dock','mobile-feature-sheet','mixer-panel','autotune-panel','battle-panel','party-games-panel','social-panel'])assert.ok(html.includes(`id="${id}"`),id);
});
