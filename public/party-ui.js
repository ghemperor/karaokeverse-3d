import { CHALLENGES } from './party-data.js';
import { paintWheel, endRotationDegrees } from './party-wheel.js';

const byId = id => document.getElementById(id);
const CHALLENGE_BY_ID = new Map(CHALLENGES.map(c => [c.id, c]));
const escapeName = (users, id) => users.find(u => u.id === id)?.name || 'Người chơi đã rời phòng';

export function createPartyUI({ getRoom, getMyId, isHost, emitAck, toast, celebrate }) {
  const canvas = byId('party-wheel');
  let previousSpinId = null;
  let previousClosedPollId = null;
  let lastWheelNames = '';
  let spinToastTimer = null;
  let currentRoomCode = null;

  function button(id, enabled) { byId(id).disabled = !enabled; }
  async function send(event, payload={}) {
    const response = await emitAck(event, payload);
    if (!response?.ok) toast(response?.error || 'Không thể thực hiện hoạt động này.');
  }
  byId('party-spin').addEventListener('click', () => send('party:spin', { category: byId('party-category').value }));
  byId('party-pass-mic').addEventListener('click', () => {
    const toId = byId('party-mic-target').value;
    if (toId) send('party:pass', { toId });
  });
  byId('party-pass-winner').addEventListener('click', () => {
    const toId = getRoom()?.partyGames?.spin?.winnerId;
    if (toId) send('party:pass', { toId });
  });
  byId('party-vote-start').addEventListener('click', () => send('party:poll:start'));
  byId('party-vote-close').addEventListener('click', () => send('party:poll:close'));

  function clearSpinToast() {
    if (spinToastTimer != null) clearTimeout(spinToastTimer);
    spinToastTimer = null;
  }
  function reset() {
    clearSpinToast();previousSpinId=null;previousClosedPollId=null;lastWheelNames='';currentRoomCode=null;
    canvas.style.transition='none';canvas.style.transform='rotate(0deg)';
    render();
  }
  function animateSpin(spin, users) {
    const names = spin.people.map(id => escapeName(users,id));
    const final = endRotationDegrees(spin.winnerIndex, spin.people.length);
    paintWheel(canvas,names,final);
    lastWheelNames=JSON.stringify(names);
    const remaining = Math.max(0,spin.endsAt-Date.now());
    canvas.style.transition='none';canvas.style.transform='rotate(0deg)';
    if (remaining < 120) {
      canvas.style.transform=`rotate(${final}deg)`;
      return;
    }
    // Two animation frames force a paint between reset and the transform transition.
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if (previousSpinId !== spin.id) return;
      canvas.style.transition=`transform ${remaining}ms cubic-bezier(.15,.8,.14,1)`;
      canvas.style.transform=`rotate(${final}deg)`;
    }));
    clearSpinToast();
    spinToastTimer = setTimeout(()=>{
      if (getRoom()?.partyGames?.spin?.id !== spin.id) return;
      const challenge=CHALLENGE_BY_ID.get(spin.challengeId);
      toast(`🎡 ${escapeName(getRoom()?.users||[],spin.winnerId)} được chọn! ${challenge?.title || ''}`,4500);
      celebrate?.('🎉');
      render();
    },remaining+60);
  }
  function renderWheel(room, party) {
    const users=room?.users||[];
    const spin=party?.spin;
    const names=spin?.people?.map(id=>escapeName(users,id)) || users.map(u=>u.name);
    const signature=JSON.stringify(names);
    if(signature!==lastWheelNames) {
      lastWheelNames=signature;
      paintWheel(canvas,names,spin ? endRotationDegrees(spin.winnerIndex,spin.people.length) : 0);
    }
    if (spin && previousSpinId !== spin.id) {
      previousSpinId=spin.id;
      animateSpin(spin,users);
    }
    if (!spin && previousSpinId !== null) {
      previousSpinId=null;canvas.style.transition='none';canvas.style.transform='rotate(0deg)';
    }
    const remaining=spin ? Math.max(0,spin.endsAt-Date.now()) : 0;
    button('party-spin',Boolean(room && isHost() && remaining===0));
    byId('party-category').disabled=!room||!isHost()||remaining>0;
    byId('party-round-count').textContent=!spin?'CHƯA QUAY':remaining>0?`ĐANG QUAY • ${Math.ceil(remaining/1000)}s`:'ĐÃ CHỌN';
    byId('party-game-badge').textContent=remaining>0?'🎡 ĐANG QUAY':room?'🎉 SẴN SÀNG':'CHỜ CHỦ PHÒNG';
    const challenge=CHALLENGE_BY_ID.get(spin?.challengeId);
    const winName=spin?escapeName(users,spin.winnerId):null;
    byId('party-challenge-icon').textContent=remaining>0?'🎡':challenge?.icon||'🎲';
    byId('party-challenge-label').textContent=remaining>0?'Đang chọn người chơi':winName?`Được chọn: ${winName}`:'Vòng quay sẵn sàng';
    byId('party-challenge-title').textContent=remaining>0?'Vòng quay đang chạy...':challenge?.title||'Ai sẽ là người tiếp theo?';
    byId('party-challenge-detail').textContent=remaining>0?'Cùng chờ kết quả trên tất cả thiết bị!':challenge?.detail||'Quay để chọn người hát và nhận thử thách vui.';
    button('party-pass-winner',Boolean(room && spin && remaining===0 && users.some(u=>u.id===spin.winnerId) && (isHost() || room.performance?.singerId===getMyId()) && room.performance?.singerId!==spin.winnerId));
  }
  function renderPass(room) {
    const dropdown=byId('party-mic-target');
    const old=dropdown.value;
    const users=room?.users||[];
    const eligible=users.filter(u=>u.id!==room?.performance?.singerId);
    const signature=JSON.stringify(eligible.map(u=>[u.id,u.name]));
    if(dropdown.dataset.signature!==signature) {
      dropdown.replaceChildren(new Option('Chọn người chơi', ''));
      for (const user of eligible) dropdown.add(new Option(user.name,user.id));
      dropdown.value=eligible.some(u=>u.id===old)?old:'';
      dropdown.dataset.signature=signature;
    }
    const authorized=Boolean(room && (isHost()||room.performance?.singerId===getMyId()));
    dropdown.disabled=!authorized;
    button('party-pass-mic',authorized && !!dropdown.value);
  }
  byId('party-mic-target').addEventListener('change',()=>renderPass(getRoom()));
  function renderVote(room, party) {
    const users=room?.users||[];
    const poll=party?.poll;
    const open=poll?.status==='open';
    const me=getMyId();
    const voted=Boolean(poll?.votedIds?.includes(me));
    const remaining=open?Math.max(0,poll.endsAt-Date.now()):0;
    button('party-vote-start',Boolean(room&&isHost()&&(!open||remaining===0)&&users.length>=2));
    button('party-vote-close',Boolean(room&&isHost()&&open));
    const status=byId('party-vote-status');
    status.textContent=open?`ĐANG BẦU • ${Math.ceil(remaining/1000)}s`:poll?.status==='closed'?'ĐÃ KẾT THÚC':'CHƯA MỞ';
    const results=byId('party-vote-results');
    results.replaceChildren();
    if (!poll?.id) {
      const p=document.createElement('p');p.className='pg-help';p.textContent='Chủ phòng mở bình chọn để mọi người chọn giọng hát yêu thích.';results.appendChild(p);
    } else {
      for (const userId of poll.choices) {
        const row=document.createElement('div');row.className='pg-vote-row';
        const name=document.createElement('b');name.textContent=escapeName(users,userId);row.appendChild(name);
        const right=document.createElement('div');
        if(open && remaining > 0 && !voted && userId!==me && users.some(u=>u.id===userId)) {
          const btn=document.createElement('button');btn.type='button';btn.textContent='Bình chọn';
          btn.addEventListener('click',()=>send('party:poll:vote',{targetId:userId}));right.appendChild(btn);
        } else {
          const count=document.createElement('small');count.textContent=`${poll.counts?.[userId]||0} phiếu`;right.appendChild(count);
        }
        row.appendChild(right);
        const track=document.createElement('div');track.className='pg-vote-bar';
        const bar=document.createElement('span');bar.style.width=`${poll.totalVotes?Math.round(100*(poll.counts?.[userId]||0)/poll.totalVotes):0}%`;
        track.appendChild(bar);row.appendChild(track);results.appendChild(row);
      }
    }
    const winners=byId('party-vote-winners');
    if(open)winners.textContent=voted?'✅ Đã ghi nhận phiếu của bạn. Cùng chờ kết quả nhé!':'Chọn một người bạn yêu thích nhất.';
    else if(poll?.status==='closed') {
      winners.textContent=poll.winners?.length?`🏆 Giọng hát được yêu thích: ${poll.winners.map(id=>escapeName(users,id)).join(' & ')}!`:'Chưa có phiếu bình chọn hợp lệ.';
      if(poll.id!==previousClosedPollId) {
        previousClosedPollId=poll.id;
        if(poll.winners?.length)celebrate?.('🏆');
      }
    } else winners.textContent='';
  }
  function render() {
    const room=getRoom();
    if((room?.code||null)!==currentRoomCode){
      clearSpinToast();currentRoomCode=room?.code||null;previousSpinId=null;previousClosedPollId=null;lastWheelNames='';
      canvas.style.transition='none';canvas.style.transform='rotate(0deg)';
    }
    const party=room?.partyGames;
    renderWheel(room,party);
    renderPass(room);
    renderVote(room,party);
  }
  const tick=setInterval(()=>{
    if (getRoom()) {
      const party=getRoom().partyGames;
      const spin=party?.spin;
      if(spin && spin.endsAt>Date.now()){
        byId('party-round-count').textContent=`ĐANG QUAY • ${Math.ceil((spin.endsAt-Date.now())/1000)}s`;
      }
      const poll=party?.poll;
      if(poll?.status==='open'){
        byId('party-vote-status').textContent=`ĐANG BẦU • ${Math.max(0,Math.ceil((poll.endsAt-Date.now())/1000))}s`;
        if(poll.endsAt<Date.now())render();
      }
    }
  },1000);
  render();
  return { render, reset, dispose:()=>{clearSpinToast();clearInterval(tick);} };
}
