// v1.3 Battle Arena client UI: all scoring and winners originate on the server.
const $ = id => document.getElementById(id);
const elt = (tag, className='', content='') => {
  const el=document.createElement(tag);if(className)el.className=className;if(content!==undefined)el.textContent=content;return el;
};
const liveStatuses=new Set(['performing','voting','result']);
const scoreText=n=>Number.isInteger(n)?String(n):n.toFixed(1).replace('.',',');
const name=(room,id)=>room?.users?.find(u=>u.id===id)?.name||'Thành viên đã rời phòng';
export function createBattleUI({getRoom,getMyId,isHost,emitAck,toast,scene}) {
  let draft={mode:'solo',rounds:3,A:[],B:[]};
  let currentRoomCode=null, usersSignature='';
  let lastMatchId=null, hideChampionTimer=null;
  const overlay=$('battle-champion-overlay');
  const mode=$('battle-mode'),rounds=$('battle-rounds');
  mode.addEventListener('change',()=>{draft.mode=mode.value;renderRoster();});
  rounds.addEventListener('change',()=>{draft.rounds=Number(rounds.value)||3;});

  function resetDraft(room){
    const people=room?.users?.map(u=>u.id)||[];
    draft={mode:'solo',rounds:3,A:people[0]?[people[0]]:[],B:people[1]?[people[1]]:[]};
    mode.value=draft.mode;rounds.value=String(draft.rounds);
  }
  function renderRoster(){
    const room=getRoom(),users=room?.users||[];
    const battle=room?.battle;
    const active=liveStatuses.has(battle?.status);
    $('battle-setup').classList.toggle('is-locked',active);
    mode.disabled=rounds.disabled=active||!isHost();
    $('battle-roster-title').textContent=draft.mode==='solo'?'Chọn 2 người thi Solo':'Chọn thành viên cho hai đội (tối đa 4 mỗi đội)';
    for (const side of ['A','B']){
      const area=$(`battle-roster-${side}`);area.replaceChildren();
      for(const user of users){
        const label=elt('label','battle-roster-person');
        const check=document.createElement('input');check.type='checkbox';check.checked=draft[side].includes(user.id);
        check.disabled=active||!isHost();
        check.setAttribute('aria-label',`Đội ${side}: ${user.name}`);
        check.addEventListener('change',()=>{
          if(check.checked){
            if(draft.mode==='solo')draft[side]=[user.id];
            else if(!draft[side].includes(user.id))draft[side].push(user.id);
            draft[side==='A'?'B':'A']=draft[side==='A'?'B':'A'].filter(id=>id!==user.id);
          }else draft[side]=draft[side].filter(id=>id!==user.id);
          renderRoster();
        });
        label.append(check,elt('span','',user.name));area.append(label);
      }
      if(!users.length)area.append(elt('span','battle-muted','Chưa có thành viên'));
    }
    $('battle-start').disabled=!room||!isHost()||active;
  }
  async function send(event,payload={}){
    const result=await emitAck(event,payload);
    if(!result?.ok)toast(result?.error||'Không thể thực hiện thao tác Battle.');
  }
  $('battle-start').addEventListener('click',()=>{
    const room=getRoom();if(!room)return;
    if(draft.mode==='solo' && (draft.A.length!==1||draft.B.length!==1))
      return toast('Solo cần chọn chính xác 1 người mỗi bên.');
    if(!draft.A.length||!draft.B.length||draft.A.length>4||draft.B.length>4)
      return toast('Mỗi đội cần 1–4 thành viên.');
    send('battle:start',{mode:draft.mode,rounds:draft.rounds,teamA:draft.A,teamB:draft.B});
  });
  $('battle-advance').addEventListener('click',()=>send('battle:advance'));
  $('battle-cancel').addEventListener('click',()=>{
    if(window.confirm('Hủy trận Battle hiện tại? Kết quả chưa hoàn thành sẽ không được tính.'))send('battle:cancel');
  });
  $('battle-vote-A').addEventListener('click',()=>send('battle:vote',{side:'A'}));
  $('battle-vote-B').addEventListener('click',()=>send('battle:vote',{side:'B'}));

  function teamLabel(room,b,side){
    const prefix=b.mode==='team'?`Đội ${side}`:`Ca sĩ ${side}`;
    return `${prefix}: ${b.teams[side].map(id=>name(room,id)).join(' · ') || '—'}`;
  }
  function render(){
    const room=getRoom(),battle=room?.battle;
    const roomCode=room?.code||null;
    if(roomCode!==currentRoomCode){
      currentRoomCode=roomCode;lastMatchId=null;usersSignature='';resetDraft(room);
      clearTimeout(hideChampionTimer);overlay.classList.remove('is-visible');
    }
    const signature=JSON.stringify(room?.users?.map(u=>[u.id,u.name])||[]);
    if(signature!==usersSignature){
      usersSignature=signature;
      const available=new Set(room?.users?.map(u=>u.id)||[]);
      draft.A=draft.A.filter(id=>available.has(id));draft.B=draft.B.filter(id=>available.has(id));
      if(!draft.A.length && room?.users?.[0])draft.A=[room.users[0].id];
      if(!draft.B.length && room?.users?.find(u=>!draft.A.includes(u.id)))
        draft.B=[room.users.find(u=>!draft.A.includes(u.id)).id];
    }
    if(battle?.id && battle.id!==lastMatchId){
      lastMatchId=battle.id;
      draft.mode=battle.mode;draft.rounds=battle.rounds;
      draft.A=[...battle.teams.A];draft.B=[...battle.teams.B];
      mode.value=draft.mode;rounds.value=String(draft.rounds);
    }
    renderRoster();
    const status=battle?.status||'idle';
    const started=Boolean(battle?.id);
    const live=liveStatuses.has(status);
    const phaseLabel=({idle:'CHƯA BẮT ĐẦU',performing:'ĐANG BIỂU DIỄN',voting:'BÌNH CHỌN',result:'KẾT QUẢ VÒNG',finished:'ĐÃ TRAO GIẢI',cancelled:'ĐÃ HỦY'})[status]||status;
    $('battle-status').textContent=phaseLabel;
    $('battle-badge').textContent=started?`${battle.mode==='solo'?'SOLO':'TEAM'} • ${phaseLabel}`:'CHỜ CHỦ PHÒNG';
    $('battle-round').textContent=started?`VÒNG ${Math.min(battle.roundIndex+1,battle.rounds)}/${battle.rounds}`:'BATTLE ARENA';
    $('battle-score-A').textContent=started?scoreText(battle.score.A):'0';
    $('battle-score-B').textContent=started?scoreText(battle.score.B):'0';
    const roundsResults=$('battle-history');roundsResults.replaceChildren();
    for(const result of battle?.history||[]){
      const winner=result.winner?`Đội ${result.winner}`:'Hòa';
      roundsResults.append(elt('span','battle-history-item',`V${result.round}: ${result.counts.A} – ${result.counts.B} • ${winner}`));
    }
    if(!battle?.history?.length)roundsResults.append(elt('span','battle-muted','Điểm từng vòng xuất hiện sau bình chọn.'));
    for(const side of ['A','B']){
      const card=$(`battle-side-${side}`);
      const members=started?teamLabel(room,battle,side):`Chưa chọn ${side}`;
      $(`battle-names-${side}`).textContent=members;
      $(`battle-singer-${side}`).textContent=started?`🎤 ${name(room,battle.singers[side])}`:'🎤 Chưa có ca sĩ';
      $(`battle-live-${side}`).textContent=started?`${battle.counts[side]} phiếu`:'0 phiếu';
      card.classList.toggle('is-performing',status==='performing'&&battle.stage===side);
      card.classList.toggle('is-winner',status==='finished'&&battle.winnerSide===side);
    }
    const me=getMyId();
    const hasVoted=battle?.votedIds?.includes(me);
    const amSinger=Object.values(battle?.singers||{}).includes(me);
    const voting=status==='voting'&&battle.votingEndsAt>Date.now();
    const canVote=Boolean(room&&voting&&!hasVoted&&!amSinger);
    $('battle-vote-A').disabled=!canVote;
    $('battle-vote-B').disabled=!canVote;
    if(voting){
      const sec=Math.max(0,Math.ceil((battle.votingEndsAt-Date.now())/1000));
      $('battle-vote-info').textContent=amSinger?'Người vừa biểu diễn không bỏ phiếu vòng này.':hasVoted?'✅ Đã ghi nhận phiếu của bạn.':`Còn ${sec}s để bình chọn, mỗi người 1 phiếu.`;
    }else if(status==='result'){
      const r=battle.lastResult;
      $('battle-vote-info').textContent=r?`Vòng ${r.round}: ${r.counts.A}–${r.counts.B} phiếu • ${r.winner?`Đội ${r.winner} thắng`:'Hòa'}!`:'Đã kết thúc bình chọn.';
    }else if(status==='finished'){
      $('battle-vote-info').textContent=battle.winnerSide?`🏆 Đội ${battle.winnerSide} vô địch!`:'🤝 Hai đội hòa chung cuộc!';
    }else if(status==='cancelled')$('battle-vote-info').textContent='Trận đã bị hủy. Chủ phòng có thể bắt đầu trận mới.';
    else $('battle-vote-info').textContent='Hoàn tất lượt hát của A và B để mở bình chọn.';
    let nextLabel='Chuyển giai đoạn';
    if(status==='performing')nextLabel=battle.stage==='A'?'🎤 Lượt hát của B':'🗳 Mở bình chọn 45 giây';
    if(status==='voting')nextLabel='✅ Chốt phiếu & tính điểm';
    if(status==='result')nextLabel=battle.roundIndex+1<battle.rounds?'➡ Vòng tiếp theo':'🏆 Trao cúp chung cuộc';
    $('battle-advance').textContent=nextLabel;
    $('battle-advance').disabled=!room||!isHost()||!live;
    $('battle-cancel').disabled=!room||!isHost()||!live;
    $('battle-scene-score').hidden=!live;
    if(live){
      $('battle-scene-score').textContent=`⚔️ ${battle.mode==='solo'?'SOLO':'TEAM'} • V${battle.roundIndex+1}/${battle.rounds} • 🔴 ${scoreText(battle.score.A)} : ${scoreText(battle.score.B)} 🔵`;
    }
  }
  function showChampion(data){
    const room=getRoom();if(!room || !data || !data.battleId || data.battleId!==room.battle?.id)return;
    const headline=$('battle-champion-title');
    headline.textContent=data.winnerSide?`🏆 ĐỘI ${data.winnerSide} VÔ ĐỊCH`:'🤝 HÒA CHUNG CUỘC';
    $('battle-champion-names').textContent=data.winnerNames?.join(' • ')||'Hai đội xuất sắc';
    $('battle-champion-score').textContent=`ĐIỂM CHUNG CUỘC  ${scoreText(data.score.A)} : ${scoreText(data.score.B)}`;
    clearTimeout(hideChampionTimer);overlay.classList.remove('is-visible');void overlay.offsetWidth;
    overlay.classList.add('is-visible');hideChampionTimer=setTimeout(()=>overlay.classList.remove('is-visible'),7500);
    scene()?.playBattleVictory?.(data.winnerIds||[],data.winnerSide);
  }
  function reset(){currentRoomCode=null;usersSignature='';lastMatchId=null;clearTimeout(hideChampionTimer);overlay.classList.remove('is-visible');resetDraft(null);render();}
  const ticker=setInterval(()=>{
    const battle=getRoom()?.battle;
    if(battle?.status==='voting' && battle.votingEndsAt){
      const remaining=Math.max(0,Math.ceil((battle.votingEndsAt-Date.now())/1000));
      $('battle-vote-info').textContent=(Object.values(battle.singers).includes(getMyId()))?'Người vừa biểu diễn không bỏ phiếu vòng này.':battle.votedIds.includes(getMyId())?'✅ Đã ghi nhận phiếu của bạn.':`Còn ${remaining}s để bình chọn, mỗi người 1 phiếu.`;
      if(!remaining){$('battle-vote-A').disabled=true;$('battle-vote-B').disabled=true;}
    }
  },500);
  render();
  return {render,reset,showChampion,dispose:()=>{clearInterval(ticker);clearTimeout(hideChampionTimer);}};
}
