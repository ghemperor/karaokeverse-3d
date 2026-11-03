// Room-local, fictional ADULT hospitality NPCs. No real-world alcohol sale or payment.
export const NPC_IDS = Object.freeze(['dj','linh','mai','vy']);
export const STAFF_IDS = Object.freeze(['linh','mai','vy']);
export const DEFAULT_NPCS = Object.freeze({dj:'DJ Luna',linh:'Linh',mai:'Mai',vy:'Vy'});
const DRINKS = Object.freeze({beer:'bia',soda:'nước ngọt',water:'nước lọc'});
export function cleanNPCName(value) {
  if(typeof value!=='string')return null;
  const cleaned=value.normalize('NFC').trim().replace(/\s+/g,' ');
  if(cleaned.length<2||cleaned.length>22||!/^[\p{L}\p{M}\p{N} .'-]+$/u.test(cleaned))return null;
  return cleaned;
}
export function createNPCState() {
  return { revision:0, dj:{id:'dj',name:DEFAULT_NPCS.dj,active:true}, staff:STAFF_IDS.map(id=>({id,name:DEFAULT_NPCS[id],status:'idle',calledBy:null,drink:null})), feed:[] };
}
export function publicNPCs(state) {
  return {revision:state.revision,dj:{...state.dj},staff:state.staff.map(s=>({...s})),feed:state.feed.slice(-8).map(x=>({...x}))};
}
export function performNPCAction(state, payload, actor, isHost=false, now=Date.now()) {
  if(!payload||typeof payload!=='object'||!actor||typeof actor.id!=='string')return {ok:false,error:'Yêu cầu không hợp lệ.'};
  const id=payload.npcId, action=payload.action;
  if(!NPC_IDS.includes(id))return {ok:false,error:'Không tìm thấy NPC.'};
  const next=publicNPCs(state);let line='';
  const npc=id==='dj'?next.dj:next.staff.find(s=>s.id===id);
  if(action==='rename'){
    if(!isHost)return {ok:false,error:'Chỉ chủ phòng có thể đặt tên NPC.'};
    const name=cleanNPCName(payload.name);
    if(!name)return {ok:false,error:'Tên dài 2–22 ký tự, không chứa ký tự đặc biệt.'};
    npc.name=name;line=`✏️ ${actor.name} đã đặt tên ${id==='dj'?'DJ':'nhân viên'} thành ${name}.`;
  }else if(id==='dj'){
    if(action==='dj-toggle'){
      if(!isHost)return {ok:false,error:'Chỉ chủ phòng điều khiển DJ.'};
      npc.active=!npc.active;
      line=`🎧 ${npc.name} ${npc.active?'bắt đầu khuấy động sân khấu!':'tạm nghỉ tại bàn DJ.'}`;
    }else if(action==='greet'){
      line=`🎧 ${npc.name}: Chào ${actor.name}! Chúc cả phòng hát thật vui!`;
    }else return {ok:false,error:'Hành động DJ không hợp lệ.'};
  }else if(action==='call'){
    if(npc.status==='serving'&&npc.calledBy!==actor.id)return {ok:false,error:`${npc.name} đang phục vụ một thành viên khác.`};
    npc.status='serving';npc.calledBy=actor.id; npc.drink=null;
    line=`🙋 ${actor.name} đã gọi ${npc.name} đến bàn.`;
  }else if(action==='serve'){
    if(npc.status!=='serving'||npc.calledBy!==actor.id)return {ok:false,error:'Bạn cần gọi nhân viên đến bàn trước.'};
    if(!Object.hasOwn(DRINKS,payload.drink))return {ok:false,error:'Đồ uống chưa được hỗ trợ.'};
    npc.drink=payload.drink;
    line=`🥤 ${npc.name} đã mang ${DRINKS[payload.drink]} (mô phỏng) đến cho ${actor.name}.`;
  }else if(action==='cheers'){
    if(npc.status!=='serving'||npc.calledBy!==actor.id)return {ok:false,error:'Bạn cần gọi nhân viên đến bàn trước.'};
    line=`🥂 ${npc.name} cụng ly cùng ${actor.name}! Chúc mọi người vui vẻ.`;
  }else if(action==='thanks'){
    if(npc.status!=='serving'||npc.calledBy!==actor.id)return {ok:false,error:'Nhân viên chưa đến bàn của bạn.'};
    line=`💜 ${actor.name} cảm ơn ${npc.name}. ${npc.name} chào và quay lại quầy.`;
    npc.status='idle';npc.calledBy=null;npc.drink=null;
  }else if(action==='dismiss'){
    if(!isHost&&npc.calledBy!==actor.id)return {ok:false,error:'Bạn không thể điều khiển nhân viên do người khác gọi.'};
    npc.status='idle';npc.calledBy=null;npc.drink=null;line=`👋 ${npc.name} trở lại vị trí phục vụ.`;
  }else return {ok:false,error:'Hành động không hợp lệ.'};
  next.revision++;
  next.feed=[...next.feed,{id:`${now}-${next.revision}`,text:line,at:now}].slice(-8);
  return {ok:true,state:next,message:line};
}
export function npcMemberLeaves(state, memberId){
  const next=publicNPCs(state);let changed=false;
  for(const staff of next.staff)if(staff.calledBy===memberId){staff.calledBy=null;staff.status='idle';staff.drink=null;changed=true;}
  if(changed)next.revision++;
  return next;
}
