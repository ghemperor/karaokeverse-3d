const $ = (id) => document.getElementById(id);
const AVATARS = ['😎','🤩','🥳','🦊','🐱','🐼','👽','🐻'];
const socket = window.io({ reconnection: true, reconnectionAttempts: 10 });
const state = {
  myId: null,
  room: null,
  name: localStorage.getItem('karaokeverse-name') || '',
  avatar: Number(localStorage.getItem('karaokeverse-avatar') || '0'),
  isMicOn: false,
  pushToTalk: false,
  transmitting: false,
  localStream: null,
  peers: new Map(),
  pendingSignals: [],
  scene: null,
  youtube: null,
  youtubeReady: false,
  currentVideoId: null,
  videoSyncTimer: null,
  connected: false,
  lastSingerId: null,
  iceServers: [{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']}],
};
const qsRoom = new URLSearchParams(window.location.search).get('room');
const requestedRoom = qsRoom?.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0,8) || '';

$('name-input').value = state.name;
$('join-code').value = requestedRoom;
if (requestedRoom) $('create-room').textContent = '✦ Tạo phòng mới';
for (let i=0;i<AVATARS.length;i++) {
  const btn=document.createElement('button');btn.type='button';btn.className='avatar-choice'+(state.avatar===i?' selected':'');
  btn.textContent=AVATARS[i];btn.title=`Avatar ${i+1}`;btn.addEventListener('click',()=>{
    state.avatar=i;
    for(const c of $('avatar-picker').children)c.classList.remove('selected');
    btn.classList.add('selected');
  });$('avatar-picker').appendChild(btn);
}

function toast(message, duration=3200) {
  const item=document.createElement('div');item.className='toast';item.textContent=message;
  $('toast-stack').appendChild(item);
  setTimeout(()=>item.remove(),duration);
}
function displayClock(timestamp) {
  return new Date(timestamp||Date.now()).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
}
function secondsFormat(sec) {
  if (!Number.isFinite(sec)||sec<0)return '00:00';
  const x=Math.floor(sec);return `${String(Math.floor(x/60)).padStart(2,'0')}:${String(x%60).padStart(2,'0')}`;
}
function songTitle(id) {
  return state.room?.queue?.find(s=>s.videoId===id)?.title || `YouTube • ${id}`;
}
function roomHost() { return !!state.room && state.room.hostId===state.myId; }
function ensureRoom(){ if(!state.room){toast('Hãy tạo hoặc tham gia phòng trước.');return false;} return true; }
function emitAck(event,payload){return new Promise((resolve)=>{
  if(!socket.connected){resolve({ok:false,error:'Mất kết nối với máy chủ.'});return;}
  socket.timeout(8000).emit(event,payload,(err,result)=>resolve(err?{ok:false,error:'Máy chủ không phản hồi.'}:result));
});}
function setControlsEnabled(enabled){
  for(const id of ['copy-invite','leave-room','copy-room-bottom','song-url','add-song','chat-input','send-chat','mic-button','ptt-button'])$(id).disabled=!enabled;
  for(const btn of document.querySelectorAll('[data-reaction], [data-emote]'))btn.disabled=!enabled;
  for(const id of ['stage-request','stage-leave','stage-next','party-light','party-mode'])$(id).disabled=!enabled;
}
function validateName(){
  const name=$('name-input').value.trim().slice(0,26);
  if(!name){toast('Hãy nhập biệt danh để mọi người nhận ra bạn nhé.');$('name-input').focus();return null;}
  state.name=name;localStorage.setItem('karaokeverse-name',name);
  localStorage.setItem('karaokeverse-avatar',String(state.avatar));
  return {name,avatar:state.avatar};
}
async function createRoom(){
  const details=validateName();if(!details)return;
  $('create-room').disabled=$('join-room').disabled=true;
  const result=await emitAck('room:create',details);
  $('create-room').disabled=$('join-room').disabled=false;
  if(!result?.ok)return toast(result?.error||'Không thể tạo phòng.');
  joinSuccess(result);
}
async function joinRoom(){
  const details=validateName();if(!details)return;
  const code=$('join-code').value.toUpperCase().trim();
  if(code.length<5)return toast('Mã phòng chưa đúng.');
  $('create-room').disabled=$('join-room').disabled=true;
  const result=await emitAck('room:join',{...details,code});
  $('create-room').disabled=$('join-room').disabled=false;
  if(!result?.ok)return toast(result?.error||'Không vào được phòng.');
  joinSuccess(result);
}
function joinSuccess(result){
  state.myId=result.myId;
  state.room=result.room;
  state.scene?.setLocalUser(result.myId);
  $('welcome-screen').classList.add('hidden');
  const link=new URL(window.location.href);link.searchParams.set('room',result.room.code);
  window.history.replaceState(null,'',link.pathname+link.search);
  setControlsEnabled(true);
  $('room-badge').innerHTML=`ROOM <b>${result.room.code}</b>`;
  const signals=state.pendingSignals.splice(0);
  for(const signal of signals)receiveSignal(signal);
  toast(`🎤 Đã vào phòng ${result.room.code}!`);
  renderRoom();
  ensureYoutube();
}
function resetAndLeave(showToast=true){
  if(state.room)socket.emit('room:leave');
  for(const peer of state.peers.values())peer.pc.close();
  state.peers.clear();
  for(const el of document.querySelectorAll('audio[data-peer]'))el.remove();
  state.localStream?.getTracks().forEach(t=>t.stop());
  state.localStream=null;state.isMicOn=false;state.transmitting=false;
  state.myId=null;state.room=null;state.lastSingerId=null;state.currentVideoId=null;state.pendingSignals=[];
  state.scene?.setLocalUser(null);state.scene?.setMembers([]);state.scene?.setPerformance(null);state.scene?.setView('front');
  if(state.youtubeReady) {try{state.youtube.stopVideo()}catch{}}
  state.scene?.tvPlaceholder?.style.setProperty('display','flex');
  $('welcome-screen').classList.remove('hidden');
  $('room-badge').innerHTML='ROOM <b>------</b>';
  const link=new URL(window.location.href);link.searchParams.delete('room');window.history.replaceState(null,'',link.pathname+link.search);
  setControlsEnabled(false);renderRoom();updateMicUI();
  if(showToast)toast('Đã rời phòng karaoke.');
}
async function copyInvite(){
  if(!ensureRoom())return;
  const url=`${location.origin}${location.pathname}?room=${encodeURIComponent(state.room.code)}`;
  try{await navigator.clipboard.writeText(url);toast('🔗 Đã sao chép link mời!');}
  catch{window.prompt('Sao chép liên kết để mời bạn bè:',url)}
}
function element(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
function renderMembers(){
  const list=$('member-list');list.replaceChildren();
  const users=state.room?.users||[];
  $('members-count').textContent=`(${users.length})`;
  $('scene-people').textContent=`${users.length}/8 người`;
  if(!users.length){list.appendChild(element('div','member-empty','Tạo hoặc vào phòng để gặp mọi người.'));}
  for(const user of users){
    const row=element('div','member');
    row.appendChild(element('div','member-avatar',AVATARS[user.avatar%AVATARS.length]));
    const copy=element('div','member-copy');
    copy.appendChild(element('b','',user.name+(user.id===state.myId?' (bạn)':'')));
    copy.appendChild(element('small','',user.id===state.room.hostId?'♛ Chủ phòng':'♪ Thành viên'));
    row.appendChild(copy);
    row.appendChild(element('span','mic-indicator'+(!user.muted?' active':''),user.muted?'♩':'🎙'));
    list.appendChild(row);
  }
  state.scene?.setMembers(users);
}

function renderQueue(){
  const queue=state.room?.queue||[];const code=state.room?.player?.videoId;
  $('queue-count').textContent=`${queue.length} bài`;
  const list=$('song-list');list.replaceChildren();
  if(!queue.length){
    const box=element('div','empty-state');box.appendChild(element('span','empty-icon','♫'));
    box.appendChild(element('b','','Chưa có bài hát'));
    box.appendChild(element('p','','Dán link YouTube để bắt đầu bữa tiệc âm nhạc.'));
    list.appendChild(box);return;
  }
  for(const [i,song] of queue.entries()){
    const row=element('div','song-item'+(song.videoId===code?' current':''));
    row.appendChild(element('span','song-index',song.videoId===code?'♫':String(i+1).padStart(2,'0')));
    const thumb=element('div','song-thumb');const image=document.createElement('img');
    image.src=`https://i.ytimg.com/vi/${encodeURIComponent(song.videoId)}/mqdefault.jpg`;
    image.loading='lazy';image.alt='';thumb.appendChild(image);
    if(song.videoId===code)thumb.appendChild(element('span','playing-symbol','▶'));
    row.appendChild(thumb);
    const content=element('div','song-copy');content.appendChild(element('b','',song.title));content.appendChild(element('small','',`Thêm bởi ${song.addedBy}`));row.appendChild(content);
    if(roomHost()&&song.videoId!==code){
      const play=element('button','song-action','▶');play.title='Phát bài này';
      play.addEventListener('click',()=>runPlayerCommand('select',{videoId:song.videoId}));row.appendChild(play);
    }else if(roomHost()||song.addedById===state.myId){
      const remove=element('button','song-action','×');remove.title='Xóa khỏi hàng chờ';
      remove.addEventListener('click',async()=>{
        const res=await emitAck('queue:remove',{songId:song.id});if(!res?.ok)toast(res?.error||'Không thể xóa bài.');
      });row.appendChild(remove);
    }
    list.appendChild(row);
  }
}
function renderChat(){
  const list=$('chat-messages');list.replaceChildren();
  if(!state.room?.chat?.length){list.appendChild(element('div','chat-welcome','👋 Đây là phòng karaoke của bạn. Cùng chọn bài hát và hát thôi!'));return;}
  for(const message of state.room.chat){
    const row=element('div','chat-line'+(message.userId===state.myId?' own':''));
    const head=element('div','chat-line-head',message.name);
    head.appendChild(element('small','',displayClock(message.at)));
    row.appendChild(head);row.appendChild(element('p','',message.text));list.appendChild(row);
  }
  list.scrollTop=list.scrollHeight;
}
function renderPerformance(){
  const perf=state.room?.performance||{singerId:null,queue:[]};
  const users=state.room?.users||[];
  const singer=users.find(u=>u.id===perf.singerId);
  $('singer-label').textContent=singer?`Đang hát: ${singer.name}`:'Chưa có người biểu diễn';
  $('singer-queue').textContent=`Hàng chờ: ${perf.queue.length}`;
  const amSinger=perf.singerId===state.myId;
  const queued=perf.queue.includes(state.myId);
  $('stage-request').disabled=!state.room||amSinger||queued;
  $('stage-request').textContent=queued?'✓ Đang chờ':amSinger?'🎤 Đang hát':'🎤 Đăng ký hát';
  $('stage-leave').disabled=!state.room||(!amSinger&&!queued);
  $('stage-next').disabled=!(roomHost()&&perf.singerId);
  $('party-mode').classList.toggle('active',!!state.room?.world?.party);
  state.scene?.setPerformance(perf.singerId);
  state.scene?.setWorldState(state.room?.world);
  if(perf.singerId!==state.lastSingerId){
    if(state.lastSingerId===state.myId && perf.singerId!==state.myId)state.scene?.setEmote('stand');
    if(perf.singerId===state.myId) {
      state.scene?.goStage();
      toast('🎤 Đến lượt bạn! Hãy bật micro và bắt đầu hát.');
    }
    state.lastSingerId=perf.singerId;
  }
}
function renderRoom(){
  renderMembers();renderQueue();renderChat();renderPerformance();
  $('status-label').textContent=state.room?`Phòng ${state.room.code} • ${state.room.users.length} người`:'Chưa tham gia phòng';
  $('scene-status').textContent=state.room?'Đang trực tuyến':'Đang chờ';
  const active=state.room?.player?.videoId;
  const hasVideo=!!active;
  $('now-title').textContent=hasVideo?songTitle(active):'Sân khấu đang chờ bạn...';
  $('now-subtitle').textContent=hasVideo?`Video ${active}`:'Thêm bài hát YouTube để bắt đầu';
  $('player-title').textContent=hasVideo?songTitle(active):'Chưa phát bài hát';
  $('player-caption').textContent=roomHost()?'Bạn đang là chủ phòng • điều khiển nhạc':'Chủ phòng điều khiển bài hát';
  $('control-play').disabled=!(roomHost()&&hasVideo);
  $('control-next').disabled=!(roomHost()&&hasVideo);
  $('video-seek').disabled=!(roomHost()&&hasVideo);
  $('control-play').textContent=state.room?.player?.playing?'Ⅱ':'▶';
  $('unlock-video').classList.toggle('show',!!(hasVideo&&state.youtubeReady));
  if(state.room)syncYoutube();
}
async function addSong(event){
  event.preventDefault();if(!ensureRoom())return;
  const raw=$('song-url').value.trim();if(!raw)return;
  const result=await emitAck('queue:add',{url:raw});
  if(result?.ok){$('song-url').value='';toast('♫ Đã thêm bài hát vào danh sách!');}
  else toast(result?.error||'Không thể thêm bài hát.');
}
async function sendChat(event){
  event.preventDefault();if(!ensureRoom())return;
  const input=$('chat-input');const msg=input.value.trim();if(!msg)return;
  const result=await emitAck('chat:send',msg);
  if(result?.ok)input.value='';else toast(result?.error||'Không thể gửi tin nhắn.');
}
function createReaction(emoji){
  const el=element('div','flying-reaction',emoji);
  el.style.left=`${20+Math.random()*62}%`;
  $('reaction-layer').appendChild(el);
  setTimeout(()=>el.remove(),2600);
}
async function runPlayerCommand(type,extra={}){
  if(!ensureRoom())return;
  const result=await emitAck('player:command',{type,...extra});
  if(!result?.ok)toast(result?.error||'Không thể điều khiển video.');
}
function playerPosition(p){return Math.max(0,p.position+(p.playing?(Date.now()-p.updatedAt)/1000:0));}
function syncYoutube(){
  if(!state.youtubeReady||!state.room)return;
  const active=state.room.player;
  if(!active.videoId){
    if(state.currentVideoId){try{state.youtube.stopVideo()}catch{}}
    state.currentVideoId=null;state.scene?.tvPlaceholder?.style.setProperty('display','flex');
    $('unlock-video').classList.remove('show');return;
  }
  state.scene?.tvPlaceholder?.style.setProperty('display','none');
  const isNew=state.currentVideoId!==active.videoId;
  const desired=playerPosition(active);
  try{
    if(isNew){
      state.currentVideoId=active.videoId;
      if(active.playing)state.youtube.loadVideoById({videoId:active.videoId,startSeconds:Math.max(0,desired)});
      else state.youtube.cueVideoById({videoId:active.videoId,startSeconds:Math.max(0,desired)});
    }else{
      const actual=state.youtube.getCurrentTime?.()||0;
      if(Math.abs(actual-desired)>2.5)state.youtube.seekTo(desired,true);
      const status=state.youtube.getPlayerState?.();
      if(active.playing && status!==1&&status!==3)state.youtube.playVideo();
      else if(!active.playing&&status===1)state.youtube.pauseVideo();
    }
  }catch(err){console.warn('YouTube sync failed',err)}
  $('control-play').textContent=active.playing?'Ⅱ':'▶';
}
function ensureYoutube(){
  if(state.youtube||!state.scene)return;
  if(window.YT?.Player){createYoutubePlayer();return;}
  if(document.getElementById('youtube-iframe-api'))return;
  const script=document.createElement('script');script.id='youtube-iframe-api';script.src='https://www.youtube.com/iframe_api';
  script.onerror=()=>toast('Không tải được YouTube IFrame API. Kiểm tra kết nối Internet.',4500);
  document.head.appendChild(script);
}
window.onYouTubeIframeAPIReady=()=>{if(state.scene)createYoutubePlayer();};
function createYoutubePlayer(){
  if(state.youtube || !state.scene || !window.YT?.Player)return;
  state.youtube=new YT.Player('youtube-player',{
    width:'640',height:'360',
    playerVars:{playsinline:1,controls:1,rel:0,origin:location.origin},
    events:{
      onReady:()=>{state.youtubeReady=true;syncYoutube();toast('▶ Trình phát YouTube đã sẵn sàng.');},
      onError:(event)=>{const codes={2:'Link video không hợp lệ',5:'Trình duyệt không phát được video',100:'Video không tồn tại',101:'Chủ video không cho phép nhúng',150:'Chủ video không cho phép nhúng'};toast('YouTube: '+(codes[event.data]||`Lỗi ${event.data}`),5000);},
      onStateChange:(event)=>{
        if(event.data===0 && roomHost() && state.room?.player?.videoId)runPlayerCommand('next');
        // IFrame playback state is shared by server heartbeats, not direct audio retransmission.
      },
    },
  });
}
function updateProgress(){
  if(!state.room)return;
  const p=state.room.player;
  const seconds=playerPosition(p);
  let duration=0;
  try{if(state.youtubeReady)duration=state.youtube.getDuration()||0;}catch{}
  $('time-current').textContent=secondsFormat(seconds);
  $('time-total').textContent=duration?secondsFormat(duration):'--:--';
  if(document.activeElement!==$('video-seek')){
    $('video-seek').max=String(Math.max(100,Math.ceil(duration)||100));
    $('video-seek').value=String(Math.min(Number($('video-seek').max),seconds));
  }
}
// Browser WebRTC mesh. Each room member connects directly to every other member.
// Works on common NATs via STUN; restrictive networks require production TURN.
function getPeer(remoteId){
  let p=state.peers.get(remoteId);if(p)return p;
  const pc=new RTCPeerConnection({iceServers:state.iceServers,iceCandidatePoolSize:2});
  p={pc,id:remoteId,makingOffer:false,ignoreOffer:false,isSettingRemoteAnswerPending:false,tracksAttached:false,pendingCandidates:[]};
  state.peers.set(remoteId,p);
  pc.onicecandidate=({candidate})=>{if(candidate)socket.emit('signal:webrtc',{to:remoteId,candidate:candidate.toJSON()})};
  pc.ontrack=({track,streams})=>{
    let audio=document.querySelector(`audio[data-peer="${CSS.escape(remoteId)}"]`);
    if(!audio){audio=document.createElement('audio');audio.autoplay=true;audio.playsInline=true;audio.dataset.peer=remoteId;document.body.appendChild(audio);}
    if(streams[0])audio.srcObject=streams[0];
    else{
      if(!(audio.srcObject instanceof MediaStream))audio.srcObject=new MediaStream();
      audio.srcObject.addTrack(track);
    }
    audio.volume=Number($('voice-volume').value)/100;
    audio.play().catch(()=>toast('Nhấn Bật micro hoặc tương tác với trang để nghe giọng nói.',4600));
  };
  pc.onnegotiationneeded=async()=>{
    try{
      p.makingOffer=true;
      await pc.setLocalDescription();
      if(pc.localDescription)socket.emit('signal:webrtc',{to:remoteId,description:pc.localDescription.toJSON()});
    }catch(err){console.warn('WebRTC negotiation',err)}finally{p.makingOffer=false;}
  };
  pc.onconnectionstatechange=()=>{
    if(pc.connectionState==='failed'){
      try{pc.restartIce()}catch{}
      toast('Kết nối micro với một thành viên đang gặp sự cố. Có thể cần máy chủ TURN.');
    }
  };
  attachLocalTracks(p);
  return p;
}
function attachLocalTracks(peer){
  if(!state.localStream||peer.tracksAttached)return;
  for(const track of state.localStream.getTracks())peer.pc.addTrack(track,state.localStream);
  peer.tracksAttached=true;
}
async function receiveSignal({from,description,candidate}={}){
  if(!from)return;
  if(!state.room){if(state.pendingSignals.length<30)state.pendingSignals.push({from,description,candidate});return;}
  if(!state.room.users.some(u=>u.id===from))return;
  const peer=getPeer(from);const pc=peer.pc;
  try{
    if(description){
      const readyForOffer=!peer.makingOffer&&(pc.signalingState==='stable'||peer.isSettingRemoteAnswerPending);
      const collision=description.type==='offer'&&!readyForOffer;
      const polite=String(state.myId)>String(from);
      peer.ignoreOffer=!polite&&collision;
      if(peer.ignoreOffer)return;
      peer.isSettingRemoteAnswerPending=description.type==='answer';
      await pc.setRemoteDescription(description);
      peer.isSettingRemoteAnswerPending=false;
      for(const queuedCandidate of peer.pendingCandidates.splice(0)){
        try{await pc.addIceCandidate(queuedCandidate)}catch(err){if(!peer.ignoreOffer)console.warn('ICE candidate rejected',err)}
      }
      if(description.type==='offer'){
        await pc.setLocalDescription();
        socket.emit('signal:webrtc',{to:from,description:pc.localDescription.toJSON()});
      }
    }else if(candidate){
      if(!pc.remoteDescription){peer.pendingCandidates.push(candidate);return;}
      try{await pc.addIceCandidate(candidate)}catch(err){if(!peer.ignoreOffer)throw err}
    }
  }catch(err){console.warn('WebRTC signal error',err)}
}
function setTransmitting(enabled){
  state.transmitting=Boolean(enabled && state.isMicOn);
  state.localStream?.getAudioTracks().forEach(t=>t.enabled=state.transmitting);
  if(state.room)socket.emit('user:mic',{enabled:state.transmitting});
  updateMicUI();
}
function updateMicUI(){
  const mic=$('mic-button');
  mic.classList.toggle('active',state.transmitting);
  mic.classList.toggle('danger',state.isMicOn&&!state.transmitting);
  $('mic-label').textContent=state.isMicOn?'Tắt micro':'Bật micro';
  $('ptt-button').classList.toggle('active',state.pushToTalk);
  $('ptt-label').textContent=state.pushToTalk?'Nhấn Space để nói':'Open mic';
}
async function toggleMic(){
  if(!ensureRoom())return;
  if(state.isMicOn){state.isMicOn=false;setTransmitting(false);return;}
  if(!navigator.mediaDevices?.getUserMedia){toast('Micro cần HTTPS hoặc localhost và trình duyệt hỗ trợ.');return;}
  if(!state.localStream){
    try{
      state.localStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
    }catch(err){toast(err.name==='NotAllowedError'?'Bạn chưa cấp quyền sử dụng micro.':'Không thể truy cập micro. Kiểm tra thiết bị và quyền truy cập.');return;}
    for(const user of state.room.users)if(user.id!==state.myId)getPeer(user.id);
  }
  state.isMicOn=true;
  setTransmitting(!state.pushToTalk);
  for(const peer of state.peers.values())attachLocalTracks(peer);
  // Most mobile browsers only allow remote audio to start after a user gesture.
  for(const audio of document.querySelectorAll('audio[data-peer]'))audio.play().catch(()=>{});
  toast('🎤 Micro đã kết nối. Nên dùng tai nghe để tránh vọng âm.');
}
function togglePtt(){state.pushToTalk=!state.pushToTalk;if(state.isMicOn)setTransmitting(!state.pushToTalk);updateMicUI()}
function pttKey(event,enabled){
  if(!state.pushToTalk||!state.isMicOn||!state.room)return;
  if(event.code!=='Space'||event.target.closest('input,textarea,button'))return;
  event.preventDefault();
  if(state.transmitting!==enabled)setTransmitting(enabled);
}
function disconnectPeer(id){
  const peer=state.peers.get(id);if(peer){peer.pc.close();state.peers.delete(id)}
  document.querySelectorAll('audio[data-peer]').forEach(el=>{if(el.dataset.peer===id)el.remove()});
}
function applyRoom(updated){
  if(!state.myId||!state.room||state.room.code!==updated?.code)return;
  const oldIds=new Set(state.room.users.map(u=>u.id));
  const newIds=new Set(updated.users.map(u=>u.id));
  for(const id of oldIds)if(!newIds.has(id))disconnectPeer(id);
  state.room=updated;renderRoom();
}
socket.on('connect',()=>{
  state.connected=true;
  if(state.room){toast('Đã kết nối lại. Vui lòng tham gia phòng một lần nữa.');resetAndLeave(false);}
});
socket.on('disconnect',()=>{state.connected=false;if(state.room)toast('Mất kết nối máy chủ. Đang thử kết nối lại...',5000)});
socket.on('room:state',updated=>applyRoom(updated));
socket.on('user:joined',user=>{if(state.room){toast(`👋 ${user.name} vừa tham gia!`);if(state.localStream)getPeer(user.id);}});
socket.on('user:left',({id})=>{if(state.room){disconnectPeer(id);toast('Một thành viên vừa rời phòng.');}});
socket.on('user:updated',user=>{
  if(!state.room)return;
  const existing=state.room.users.find(u=>u.id===user.id);
  if(existing){Object.assign(existing,user);renderMembers();}
});
socket.on('chat:new',message=>{
  if(!state.room)return;
  if(state.room.chat.some(c=>c.id===message.id))return;
  state.room.chat.push(message);state.room.chat=state.room.chat.slice(-50);
  renderChat();
  if(['👏','❤️','🔥','🎉','🎤'].includes(message.text))createReaction(message.text);
});
socket.on('player:sync',p=>{if(!state.room)return;state.room.player=p;$('control-play').textContent=p.playing?'Ⅱ':'▶';syncYoutube();});
socket.on('signal:webrtc',receiveSignal);
socket.on('world:state',({world}={})=>{
  if(!state.room || !world)return;
  state.room.world=world;
  state.scene?.setWorldState(world);
  $('party-mode').classList.toggle('active',world.party);
});
socket.on('reaction:show',({emoji}={})=>{
  if(!['👏','❤️','🔥','🎉','🎤'].includes(emoji))return;
  createReaction(emoji);
  state.scene?.playReaction(emoji);
});
socket.on('user:moved',({id,pos}={})=>{
  if(!state.room||!id||!pos)return;
  const user=state.room.users.find(u=>u.id===id);
  if(user)user.pos=pos;
  state.scene?.applyMemberMove({id,pos});
});

async function requestStage(){
  if(!ensureRoom())return;
  const result=await emitAck('performance:request',{});
  if(!result?.ok)toast(result?.error||'Không thể đăng ký hát.');
  else if(!result.singing)toast('🎤 Đã vào hàng chờ biểu diễn.');
}
async function leaveStage(){
  if(!ensureRoom())return;
  const result=await emitAck('performance:leave',{});
  if(result?.ok){state.scene?.setEmote('stand');toast('Đã rời danh sách biểu diễn.');}
}
async function changeWorld(action){
  if(!ensureRoom())return;
  const result=await emitAck('world:action',{action});
  if(!result?.ok)toast(result?.error||'Không thể thay đổi phòng.');
}
$('stage-request').addEventListener('click',requestStage);
$('stage-leave').addEventListener('click',leaveStage);
$('stage-next').addEventListener('click',async()=>{
  if(!ensureRoom())return;
  const result=await emitAck('performance:next',{});
  if(!result?.ok)toast(result?.error||'Không thể chuyển lượt.');
});
$('party-light').addEventListener('click',()=>changeWorld('lights'));
$('party-mode').addEventListener('click',()=>changeWorld('party'));
for(const btn of document.querySelectorAll('[data-emote]'))btn.addEventListener('click',()=>{
  if(!ensureRoom())return;
  const pose=btn.dataset.emote;
  state.scene?.setEmote(pose);
  socket.emit('user:emote',{pose});
  toast(({wave:'👋 Bạn đang vẫy tay!',clap:'👏 Bạn đang vỗ tay!',dance:'💃 Bạn đang nhảy!',stand:'🧍 Đã trở về trạng thái đứng.'})[pose]);
});
$('create-room').addEventListener('click',createRoom);
$('join-room').addEventListener('click',joinRoom);
$('join-code').addEventListener('keydown',e=>{if(e.key==='Enter')joinRoom()});
$('name-input').addEventListener('keydown',e=>{if(e.key==='Enter'){if($('join-code').value)joinRoom();else createRoom()}});
$('leave-room').addEventListener('click',()=>resetAndLeave());
$('copy-invite').addEventListener('click',copyInvite);
$('copy-room-bottom').addEventListener('click',copyInvite);
$('add-song-form').addEventListener('submit',addSong);
$('chat-form').addEventListener('submit',sendChat);
$('mic-button').addEventListener('click',toggleMic);
$('ptt-button').addEventListener('click',togglePtt);
$('control-play').addEventListener('click',()=>runPlayerCommand(state.room?.player?.playing?'pause':'play'));
$('control-next').addEventListener('click',()=>runPlayerCommand('next'));
$('video-seek').addEventListener('change',e=>runPlayerCommand('seek',{position:Number(e.target.value)}));
async function toggleStageFullscreen(){
  const stage=$('stage-scene');
  try{
    if(document.fullscreenElement===stage)await document.exitFullscreen();
    else await stage.requestFullscreen();
  }catch{toast('Trình duyệt không hỗ trợ hoặc chưa cho phép toàn màn hình.');}
}
$('scene-fullscreen').addEventListener('click',toggleStageFullscreen);
document.addEventListener('fullscreenchange',()=>{
  $('scene-fullscreen').innerHTML=document.fullscreenElement?'⛶ <span>Thu nhỏ</span>':'⛶ <span>Toàn màn hình</span>';
});
document.addEventListener('keydown',e=>{
  if(e.code!=='KeyF'||e.repeat||e.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;
  toggleStageFullscreen();
});
$('unlock-video').addEventListener('click',()=>{
  if(!state.youtubeReady)return;
  try{state.youtube.playVideo();$('unlock-video').classList.remove('show');toast('▶ Đã gửi yêu cầu phát video đến YouTube.');}
  catch{toast('Không thể phát. Hãy thử nhấn Play trên video.');}
});
$('sound-button').addEventListener('click',()=>{const value=Number($('voice-volume').value);$('voice-volume').value=value===0?'85':'0';$('voice-volume').dispatchEvent(new Event('input'))});
$('voice-volume').addEventListener('input',e=>{const vol=Number(e.target.value)/100;for(const audio of document.querySelectorAll('audio[data-peer]'))audio.volume=vol});
for(const btn of document.querySelectorAll('[data-reaction]'))btn.addEventListener('click',()=>{
  const emoji=btn.dataset.reaction;
  if(state.room)socket.emit('reaction:send',{emoji});
});
document.addEventListener('keydown',e=>pttKey(e,true));
document.addEventListener('keyup',e=>pttKey(e,false));
window.addEventListener('blur',()=>{if(state.pushToTalk)setTransmitting(false)});
window.addEventListener('beforeunload',()=>state.localStream?.getTracks().forEach(t=>t.stop()));
for(const btn of document.querySelectorAll('[data-view]'))btn.addEventListener('click',()=>{
  state.scene?.setView(btn.dataset.view);
});
setInterval(updateProgress,250);
setInterval(()=>{
  if(roomHost() && state.youtubeReady && state.room?.player?.videoId){
    try{
      const ytState=state.youtube.getPlayerState();
      // Don't advertise that playback succeeded when browser autoplay is blocked.
      if(ytState===1||ytState===2||ytState===3){
        socket.emit('player:heartbeat',{
          videoId:state.room.player.videoId,
          position:state.youtube.getCurrentTime(),playing:ytState===1,
        });
      }
    }catch{}
  }
},6000);

(async()=>{
  try{
    const config=await fetch('/config').then(r=>r.ok?r.json():null);
    if(config?.iceServers?.length)state.iceServers=config.iceServers;
  }catch{}
  try{
    const {initScene}=await import('/scene.js');
    state.scene=initScene($('scene-webgl'),$('scene-css3d'),{
      onMove:(pos)=>{if(state.room&&socket.connected)socket.emit('user:move',pos);},
      onViewChange:(view)=>{
        for(const btn of document.querySelectorAll('[data-view]'))btn.classList.toggle('active',btn.dataset.view===view);
        $('stage-scene').classList.toggle('is-walking',view==='walk');
        $('stage-scene').classList.toggle('is-following',view==='follow');
        $('stage-scene').classList.toggle('is-exploring',view==='orbit');
        if(!['walk','follow'].includes(view)){$('scene-target-hint').textContent='';$('scene-action').classList.remove('show');}
      },
      onHint:(hint)=>{$('scene-guide').textContent=hint;},
      onTarget:(label,view)=>{
        $('scene-target-hint').textContent=label||'';
        $('scene-action').classList.toggle('show',Boolean(label)&&['walk','follow'].includes(view));
      },
      onWorldAction:(action)=>changeWorld(action),
      onInteract:(type,details={})=>{
        const messages={
          microphone:'🎤 Đã gửi yêu cầu đăng ký hát. Nếu đến lượt, bạn sẽ lên sân khấu.',
          sofa:'🛋️ Bạn đã ngồi xuống sofa. Nhấn WASD hoặc nút Đứng để đứng dậy ngay cạnh ghế.',
          tv:'📺 Đây là TV YouTube. Hãy dán link ở cột Playlist.',
          lights:`💡 Đã đổi chế độ ánh sáng ${Number(details.lightMode||0)+1}.`,
          disco:details.isOn?'🪩 Đã bật disco!':'🪩 Đã tắt hiệu ứng disco.',
          speaker:details.isOn?'🔊 Đã bật hiệu ứng ánh sáng loa.':'🔇 Đã tắt hiệu ứng ánh sáng loa.',
          door:details.isOpen?'🚪 Đã mở cửa.':'🚪 Đã đóng cửa.',
          drink:'🥤 Cụng ly nào!',table:'🥤 Góc chill cùng hội bạn.'
        };
        if(type==='microphone'&&state.room){requestStage();if(!state.isMicOn)toggleMic();}
        if(type==='tv'&&state.room&&!matchMedia('(max-width: 690px)').matches)$('song-url').focus();
        toast(messages[type]||'Đã tương tác với đồ vật.');
      },
    });
    if(state.myId)state.scene.setLocalUser(state.myId);
    if(state.room){state.scene.setMembers(state.room.users);state.scene.setWorldState(state.room.world);state.scene.setPerformance(state.room.performance?.singerId);}
    if(state.room)ensureYoutube();
  }catch(err){
    console.error('3D scene unavailable',err);
    $('scene-fallback').classList.remove('hidden');
    toast('Không thể tải môi trường 3D. Hãy kết nối Internet và tải lại trang.',5000);
  }
})();
