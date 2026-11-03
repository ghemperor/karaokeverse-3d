const clean = v => String(v ?? '');
const $ = id => document.getElementById(id);
export function createNPCUI({getRoom,getMyId,isHost,emitAck,toast,scene}) {
  let selected='linh';
  const select=$('npc-select'),name=$('npc-name'),status=$('npc-status'),feed=$('npc-feed');
  const labels={dj:'🎧 DJ',linh:'🍹',mai:'🍹',vy:'🍹'};
  function render(){
    const room=getRoom(), npcs=room?.npcs;
    if(!npcs){select.replaceChildren(new Option('Vào phòng để gọi NPC',''));select.disabled=true;name.disabled=true;
      status.textContent='Vào phòng karaoke để tương tác cùng DJ và nhân viên.';feed.textContent='Chưa có hoạt động.';
      for(const b of document.querySelectorAll('[data-npc-action]'))b.disabled=true;
      return;
    }
    const items=[npcs.dj,...npcs.staff];
    select.replaceChildren(...items.map(n=>new Option(`${labels[n.id]||'🍹'} ${n.name}`,n.id)));
    if(!items.some(x=>x.id===selected))selected='linh';select.value=selected;select.disabled=false;
    const chosen=items.find(x=>x.id===selected);
    const dj=selected==='dj';
    status.textContent=dj?`${chosen.name} • ${chosen.active?'Đang khuấy động':'Đang nghỉ'}`:
      `${chosen.name} • ${chosen.status==='serving'?`Đang phục vụ ${room.users.find(u=>u.id===chosen.calledBy)?.name||'một bạn'}${chosen.drink?' • Có đồ uống':''}`:'Sẵn sàng tại quầy'}`;
    name.value=chosen.name;name.disabled=!isHost();$('npc-rename').disabled=!isHost();
    $('npc-actions-staff').hidden=dj;$('npc-actions-dj').hidden=!dj;
    for(const b of document.querySelectorAll('[data-npc-action]')){
      const action=b.dataset.npcAction;
      const canServe=!dj&&chosen.status==='serving'&&chosen.calledBy===getMyId();
      b.disabled=(action==='dj-toggle'&&!isHost())||(['serve','cheers','thanks'].includes(action)&&!canServe)||
        (action==='dismiss'&&!(canServe||isHost()));
    }
    feed.replaceChildren(...(npcs.feed.length?npcs.feed.slice().reverse().map(f=>{
      const line=document.createElement('p');line.textContent=clean(f.text);return line;
    }):[Object.assign(document.createElement('p'),{textContent:'Chưa có tương tác NPC.'})]));
    scene()?.setNPCState(npcs);
  }
  select.addEventListener('change',()=>{selected=select.value;render();});
  async function send(action,extras={}){
    if(!getRoom())return toast('Hãy tham gia phòng trước.');
    const result=await emitAck('npc:action',{npcId:selected,action,...extras});
    if(!result?.ok)toast(result?.error||'Không thể tương tác với NPC.');
  }
  for(const b of document.querySelectorAll('[data-npc-action]'))b.addEventListener('click',()=>send(b.dataset.npcAction,b.dataset.npcAction==='serve'?{drink:$('npc-drink').value}:{}));
  $('npc-rename').addEventListener('click',()=>send('rename',{name:name.value.trim()}));
  function selectNPC(id){
    selected=id;
    $('npc-panel').open=true;
    render();
    $('npc-panel').scrollIntoView({behavior:'smooth',block:'start'});
  }
  return {render,selectNPC,reset(){selected='linh';render();}};
}
