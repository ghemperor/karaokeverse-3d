import { GIFTS, GIFT_BY_ID } from './gift-data.js';
const byId=(id)=>document.getElementById(id);
const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
export function createGiftUI({getRoom,getMyId,emitAck,toast,scene}) {
  let selected='rose', roomCode=null, hideGift=null, hideVictory=null;
  let lastCelebrationId=null;
  const options=byId('gift-options');
  const overlay=byId('gift-stage-toast');
  const victory=byId('victory-overlay');
  const sendButton=byId('gift-send');
  const recipientSelect=byId('gift-recipient');
  for(const gift of GIFTS){
    const button=node('button','gift-option');button.type='button';button.dataset.gift=gift.id;
    button.style.setProperty('--gift-color',gift.color);
    button.appendChild(node('span','gift-option-icon',gift.icon));
    button.appendChild(node('b','',gift.label));
    button.appendChild(node('small','',gift.desc));
    button.addEventListener('click',()=>{selected=gift.id;renderChoices();});
    options.appendChild(button);
  }
  function renderChoices(){
    for(const button of options.querySelectorAll('button')){
      const active=button.dataset.gift===selected;
      button.classList.toggle('selected',active);
      button.setAttribute('aria-pressed',String(active));
    }
  }
  function render(){
    const room=getRoom();
    if((room?.code||null)!==roomCode){roomCode=room?.code||null;lastCelebrationId=null;}
    const users=room?.users||[];const me=getMyId();
    const targets=users.filter(u=>u.id!==me);
    const previous=recipientSelect.value;
    const signature=JSON.stringify(targets.map(u=>[u.id,u.name]));
    if(signature!==recipientSelect.dataset.signature){
      recipientSelect.replaceChildren(new Option('Chọn người nhận', ''));
      for(const user of targets)recipientSelect.add(new Option(user.name,user.id));
      recipientSelect.dataset.signature=signature;
    }
    const preferred=room?.performance?.singerId;
    const known=targets.some(u=>u.id===previous);
    if(known && recipientSelect.value!==previous)recipientSelect.value=previous;
    else if(!recipientSelect.value && targets.some(u=>u.id===preferred))recipientSelect.value=preferred;
    else if(!recipientSelect.value && targets.length)recipientSelect.value=targets[0].id;
    recipientSelect.disabled=!room||!targets.length;
    sendButton.disabled=!room||!targets.length||!recipientSelect.value;
    byId('gift-badge').textContent=targets.length?'QUÀ MIỄN PHÍ':'CẦN 2 NGƯỜI';
    byId('gift-counter').textContent=`${room?.gifts?.recent?.length||0} lượt quà gần đây`;
    const feed=byId('gift-feed');feed.replaceChildren();
    const recent=(room?.gifts?.recent||[]).slice(-6).reverse();
    if(!recent.length)feed.appendChild(node('p','gift-help','Chưa có món quà nào. Hãy gửi lời cổ vũ đầu tiên!'));
    for(const item of recent){
      const row=node('div','gift-feed-row');
      row.appendChild(node('span','gift-feed-icon',GIFT_BY_ID.get(item.giftId)?.icon || '🎁'));
      const txt=node('span','');
      const a=node('b','',item.fromName);const b=node('b','',item.toName);
      txt.append(a,document.createTextNode(' tặng '),b);
      row.appendChild(txt);feed.appendChild(row);
    }
    const scores=byId('gift-leaderboard');scores.replaceChildren();
    const board=targets.concat(users.filter(u=>u.id===me)).filter((u,i,a)=>a.findIndex(v=>v.id===u.id)===i)
      .map(u=>({name:u.name,n:room?.gifts?.counts?.[u.id]||0})).filter(s=>s.n>0).sort((a,b)=>b.n-a.n).slice(0,3);
    if(!board.length)scores.appendChild(node('span','gift-help','Bảng quà tặng sẽ xuất hiện tại đây.'));
    for(const [i,user] of board.entries())scores.appendChild(node('span','gift-score',`${['🥇','🥈','🥉'][i]} ${user.name}: ${user.n}`));
    renderChoices();
  }
  recipientSelect.addEventListener('change',render);
  sendButton.addEventListener('click',async()=>{
    const toId=recipientSelect.value;
    if(!toId)return toast('Chọn người nhận quà trước nhé.');
    sendButton.disabled=true;
    const result=await emitAck('gift:send',{giftId:selected,toId});
    if(!result?.ok)toast(result?.error||'Không gửi được quà.');
    render();
  });
  function showGift(gift){
    if(!getRoom()||!GIFT_BY_ID.has(gift?.giftId))return;
    const def=GIFT_BY_ID.get(gift.giftId);
    clearTimeout(hideGift);
    overlay.replaceChildren(node('span','gift-toast-icon',def.icon),node('strong','',`${gift.fromName} tặng ${def.label} cho ${gift.toName}`));
    overlay.classList.remove('visible');void overlay.offsetWidth;overlay.classList.add('visible');
    hideGift=setTimeout(()=>overlay.classList.remove('visible'),3700);
    scene()?.playGift(gift.giftId,gift.toId);
  }
  function showCelebration(payload){
    if(!getRoom()||!Array.isArray(payload?.winnerIds)||!payload.winnerIds.length)return;
    if(payload.id===lastCelebrationId)return;
    lastCelebrationId=payload.id;
    clearTimeout(hideVictory);
    const names=payload.names||[];
    byId('victory-names').textContent=names.join(' & ') || 'Quán quân KaraokeVerse';
    byId('victory-subtitle').textContent=`${payload.totalVotes||0} lượt bình chọn • Chúc mừng!`;
    victory.classList.remove('visible');void victory.offsetWidth;victory.classList.add('visible');
    hideVictory=setTimeout(()=>victory.classList.remove('visible'),6500);
    scene()?.playVictory(payload.winnerIds);
  }
  function reset(){
    clearTimeout(hideGift);clearTimeout(hideVictory);
    overlay.classList.remove('visible');victory.classList.remove('visible');
    roomCode=null;lastCelebrationId=null;recipientSelect.dataset.signature='';
    recipientSelect.replaceChildren(new Option('Chọn người nhận', ''));
    render();
  }
  render();
  return {render,showGift,showCelebration,reset};
}
