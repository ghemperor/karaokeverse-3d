import * as THREE from 'three';
import {createAvatarLibrary} from './avatar-runtime.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {AVATAR_PALETTES,AVATAR_CHOICES,AVATAR_PRESETS,DEFAULT_AVATAR_PROFILE,normalizeAvatarProfile,profilesEqual} from './avatar-profile.js';


const $=id=>document.getElementById(id);
const LABELS={skin:'MÀU DA',hair:'MÀU TÓC',hairStyle:'KIỂU TÓC',expression:'BIỂU CẢM',outfit:'MÀU ÁO',outfitStyle:'KIỂU TRANG PHỤC',pants:'MÀU QUẦN',shoes:'MÀU GIÀY',accessory:'PHỤ KIỆN',build:'DÁNG NGƯỜI'};
const CHOICE_LABELS={short:'Tóc ngắn',bangs:'Mái bay',long:'Tóc dài',ponytail:'Tóc buộc',curly:'Tóc xoăn',none:'Không',glasses:'Kính',headphones:'Tai nghe',cap:'Mũ lưỡi trai',necklace:'Dây chuyền',regular:'Cân đối',slim:'Thon gọn',broad:'Vai rộng',jacket:'Áo khoác',hoodie:'Hoodie',tee:'Áo thun',formal:'Thanh lịch',smile:'Mỉm cười',cool:'Lạnh lùng',joy:'Vui vẻ'};
const COLOR_LABELS={porcelain:'Sáng',warm:'Tự nhiên',bronze:'Nâu ấm',deep:'Nâu đậm',golden:'Vàng ấm',olive:'Olive',espresso:'Nâu trầm',ink:'Đen',chocolate:'Nâu',blonde:'Vàng',pink:'Hồng',blue:'Xanh',plum:'Mận tím',silver:'Bạc',copper:'Đồng',mint:'Mint',violet:'Tím',rose:'Hồng',sky:'Xanh dương',amber:'Cam',black:'Đen',charcoal:'Xám đậm',navy:'Navy',cream:'Kem',denim:'Denim',white:'Trắng',scarlet:'Đỏ',midnight:'Xanh đêm',sand:'Cát'};
const TABS={face:['skin','hair','hairStyle','expression'],style:['outfitStyle','outfit','pants','shoes','build'],extra:['accessory']};
const P = 'karaokeverse-avatar-profile';

export function createAvatarStudio({getProfile,onChange,toast}){
  const modal=$('avatar-studio-modal'),colors=$('avatar-studio-options'),status=$('avatar-studio-status');
  const tabs=[...modal.querySelectorAll('[data-av-tab]')];
  const cameraButtons=[...modal.querySelectorAll('[data-avatar-view]')];
  const presetHost=$('avatar-studio-presets');
  let profile=normalizeAvatarProfile(getProfile()),activeTab='face',mounted=null,opening=false;
  const avatarLibrary=createAvatarLibrary();
  let history=[];
  const sections=new Map(),controlButtons=[],presetButtons=[];
  const persist=()=>{try{localStorage.setItem(P,JSON.stringify(profile));}catch{}onChange(profile);};
  function change(next,saveHistory=true){
    const normalized=normalizeAvatarProfile(next);
    if(profilesEqual(normalized,profile))return;
    if(saveHistory){history.push({...profile});if(history.length>25)history.shift();}
    profile=normalized;persist();renderSelection();mounted?.apply(profile);
  }
  function option(parent,key,value,hex){
    const button=document.createElement('button');button.type='button';button.className='av-option';
    button.dataset.key=key;button.dataset.value=value;
    const label=COLOR_LABELS[value]||CHOICE_LABELS[value]||value;
    button.setAttribute('aria-label',`${LABELS[key]}: ${label}`);
    button.title=label;
    if(hex!==null){
      button.classList.add('av-swatch');button.style.setProperty('--swatch','#'+hex.toString(16).padStart(6,'0'));
      button.innerHTML='<span class="av-swatch-check">✓</span>';
    }else{
      const symbol={short:'✂',bangs:'⌁',long:'〰',ponytail:'◌',curly:'◉',none:'—',glasses:'▣',headphones:'◒',cap:'◠',necklace:'♢',regular:'◇',slim:'◊',broad:'⬡',jacket:'▧',hoodie:'◙',tee:'▤',formal:'✦',smile:'☺',cool:'—',joy:'☻'}[value]||'✦';
      const icon=document.createElement('span');icon.className='av-option-icon';icon.textContent=symbol;
      const text=document.createElement('span');text.textContent=label;
      button.append(icon,text);
    }
    button.addEventListener('click',()=>change({...profile,[key]:value}));
    parent.appendChild(button);controlButtons.push(button);
  }
  for(const key of [...TABS.face,...TABS.style,...TABS.extra]){
    const section=document.createElement('section');section.className='av-setting';section.dataset.field=key;
    const heading=document.createElement('div');heading.className='av-setting-heading';
    const title=document.createElement('strong');title.textContent=LABELS[key];
    const info=document.createElement('span');info.className='av-current-choice';heading.append(title,info);section.appendChild(heading);
    const row=document.createElement('div');row.className='av-options-row';section.appendChild(row);
    const palette=AVATAR_PALETTES[key];
    if(palette){for(const [value,hex] of Object.entries(palette))option(row,key,value,hex);}
    else for(const value of AVATAR_CHOICES[key])option(row,key,value,null);
    colors.appendChild(section);sections.set(key,section);
  }
  for(const preset of AVATAR_PRESETS){
    const btn=document.createElement('button');btn.className='av-preset-card';btn.type='button';btn.dataset.preset=preset.id;
    const icon=document.createElement('span');icon.className='av-preset-icon';icon.textContent=({popstar:'✦',chill:'◕',vip:'♛',retro:'◈'})[preset.id];
    const info=document.createElement('span');info.className='av-preset-info';
    const title=document.createElement('strong');title.textContent=preset.label;
    const subtitle=document.createElement('small');subtitle.textContent=preset.subtitle;
    info.append(title,subtitle);btn.append(icon,info);
    btn.addEventListener('click',()=>change({...profile,...preset.profile}));
    presetHost.appendChild(btn);presetButtons.push(btn);
  }
  function setTab(tab){
    if(!TABS[tab])return;activeTab=tab;
    for(const key of sections.keys())sections.get(key).hidden=!TABS[tab].includes(key);
    for(const t of tabs){const active=t.dataset.avTab===tab;t.classList.toggle('active',active);t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;}
    colors.setAttribute('aria-labelledby',`av-tab-${tab}`);
  }
  function renderSelection(){
    for(const b of controlButtons){
      const selected=profile[b.dataset.key]===b.dataset.value;
      b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));
    }
    for(const [key,section] of sections){
      section.querySelector('.av-current-choice').textContent=COLOR_LABELS[profile[key]]||CHOICE_LABELS[profile[key]]||profile[key];
    }
    for(const btn of presetButtons){
      const preset=AVATAR_PRESETS.find(p=>p.id===btn.dataset.preset);
      const selected=Object.entries(preset.profile).every(([key,value])=>profile[key]===value);
      btn.classList.toggle('selected',selected);btn.setAttribute('aria-pressed',String(selected));
    }
    $('avatar-studio-undo').disabled=!history.length;
  }
  tabs.forEach((btn,index)=>{
    btn.addEventListener('click',()=>setTab(btn.dataset.avTab));
    btn.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const next=tabs[(index+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length];setTab(next.dataset.avTab);next.focus();});
  });
  $('avatar-studio-random').addEventListener('click',()=>{
    const next={...profile};
    for(const [key,values] of Object.entries(AVATAR_PALETTES)){const ids=Object.keys(values);next[key]=ids[Math.floor(Math.random()*ids.length)];}
    for(const [key,values] of Object.entries(AVATAR_CHOICES))next[key]=values[Math.floor(Math.random()*values.length)];
    change(next);
  });
  $('avatar-studio-reset').addEventListener('click',()=>change(DEFAULT_AVATAR_PROFILE));
  $('avatar-studio-undo').addEventListener('click',()=>{if(!history.length)return;const previous=history.pop();change(previous,false);renderSelection();});
  const close=()=>{modal.classList.add('hidden');modal.setAttribute('aria-hidden','true');opening=false;mounted?.pause();};
  $('avatar-studio-close').addEventListener('click',close);
  $('avatar-studio-done').addEventListener('click',()=>{close();toast?.('✨ Đã lưu nhân vật Avatar Atelier trên thiết bị và đồng bộ trong phòng.');});
  modal.addEventListener('click',e=>{if(e.target===modal)close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.classList.contains('hidden'))close();});
  cameraButtons.forEach(b=>b.addEventListener('click',()=>{
    for(const c of cameraButtons){const selected=c===b;c.classList.toggle('active',selected);c.setAttribute('aria-pressed',String(selected));}
    mounted?.setView(b.dataset.avatarView);
  }));
  $('avatar-studio-pose-select').addEventListener('change',e=>mounted?.setPose(e.target.value));
  $('avatar-studio-preview-pose').addEventListener('click',()=>{
    const select=$('avatar-studio-pose-select');select.value=select.value==='dance'?'idle':'dance';mounted?.setPose(select.value);
  });
  setTab('face');renderSelection();

  async function mountPreview(){
    if(mounted)return mounted;
    const host=$('avatar-studio-preview');
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x141127);
    scene.fog=new THREE.FogExp2(0x141127,.056);
    const width=()=>Math.max(160,host.clientWidth),height=()=>Math.max(160,host.clientHeight);
    const camera=new THREE.PerspectiveCamera(39,width()/height(),.1,45);camera.position.set(0,1.65,4.5);
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));renderer.setSize(width(),height());
    renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xf8ebff,0x241735,2.5));
    const key=new THREE.DirectionalLight(0xffe0f0,3.2);key.position.set(-3,5,4);key.castShadow=true;key.shadow.mapSize.set(512,512);scene.add(key);
    const rim=new THREE.PointLight(0x9a6aff,40,8);rim.position.set(2,2.7,-1.6);scene.add(rim);
    const fill=new THREE.PointLight(0x67dbff,15,6);fill.position.set(-3,1.3,1);scene.add(fill);
    const stage=new THREE.Group();scene.add(stage);
    const podium=new THREE.Mesh(new THREE.CylinderGeometry(.92,1,.14,64),new THREE.MeshStandardMaterial({color:0x302346,metalness:.45,roughness:.34}));
    podium.position.y=-.08;podium.receiveShadow=true;stage.add(podium);
    for(const [r,y,opacity] of [[.97,-.035,.88],[1.01,-.09,.45]]){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.015,7,64),new THREE.MeshBasicMaterial({color:0xc281ff,transparent:true,opacity}));
      ring.rotation.x=-Math.PI/2;ring.position.y=y;stage.add(ring);
    }
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshStandardMaterial({color:0x10101f,roughness:.9}));ground.rotation.x=-Math.PI/2;ground.position.y=-.17;ground.receiveShadow=true;scene.add(ground);
    const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,1.12,0);orbit.enableDamping=true;orbit.dampingFactor=.075;orbit.enablePan=false;orbit.minDistance=2.1;orbit.maxDistance=6.8;orbit.maxPolarAngle=Math.PI*.64;orbit.update();
    let model=null,pose='idle',live=false,raf=0,last=performance.now(),viewTween=null;
    let handle=null,assetReady=false;
    try{
      handle=await avatarLibrary.instantiate('player',profile);
      model=handle.model;
      handle.group.traverse(o=>{if(o.isMesh)o.castShadow=true;});
      scene.add(handle.group);
      assetReady=true;host.querySelector('.av-preview-loading')?.remove();
      status.textContent=`${handle.external?'Model tùy chỉnh':'GLB mặc định'} • ${handle.clips.length} hoạt ảnh • Kéo để xoay`;
      const source=document.getElementById('avatar-model-source');
      if(source)source.textContent=`Đang dùng: ${handle.source}${handle.usedFallback?' (model dự phòng)':''}`;
    }catch(error){
      console.warn('Professional avatar preview error',error);
      status.textContent='Không tải được avatar. Kiểm tra avatar-catalog.json và thư mục models.';
    }
    const clock=()=>performance.now();
    function tick(){
      if(!live){raf=0;return;}raf=requestAnimationFrame(tick);
      const now=clock(),dt=Math.min(.05,(now-last)/1000);last=now;
      if(assetReady)handle.update(dt);
      if(viewTween){
        const t=Math.min(1,(now-viewTween.start)/550),ease=1-Math.pow(1-t,3);
        camera.position.lerpVectors(viewTween.from,viewTween.to,ease);
        if(t>=1)viewTween=null;
      }
      orbit.update();renderer.render(scene,camera);
    }
    const resize=()=>{camera.aspect=width()/height();camera.updateProjectionMatrix();renderer.setSize(width(),height());};
    const observer=new ResizeObserver(resize);observer.observe(host);
    const setPose=next=>{
      if(!assetReady)return;
      pose=next;
      handle.play(next);
      const mic=model.getObjectByName('Mic');if(mic)mic.visible=pose==='sing';
      $('avatar-studio-preview-pose').textContent=pose==='dance'?'■ Đứng yên':'▶ Thử nhảy';
    };
    const setView=name=>{
      if(name==='free'){orbit.autoRotate=true;orbit.autoRotateSpeed=.75;viewTween=null;return;}
      orbit.autoRotate=false;
      const dist=camera.position.distanceTo(orbit.target);const d=Math.max(2.6,Math.min(5,dist));
      const point={front:new THREE.Vector3(0,1.65,d),side:new THREE.Vector3(d,1.65,0),back:new THREE.Vector3(0,1.65,-d)}[name];
      if(point)viewTween={from:camera.position.clone(),to:point,start:clock()};
    };
    mounted={apply:p=>{if(handle){handle.apply(p);const mic=model.getObjectByName('Mic');if(mic)mic.visible=pose==='sing';}},setPose,setView,
      resume(){if(live)return;live=true;last=clock();tick();},pause(){live=false;if(raf)cancelAnimationFrame(raf);raf=0;}};
    return mounted;
  }
  async function open(){
    profile=normalizeAvatarProfile(getProfile());renderSelection();modal.classList.remove('hidden');modal.setAttribute('aria-hidden','false');opening=true;
    $('avatar-studio-close').focus({preventScroll:true});
    if(!mounted){status.textContent='Đang chuẩn bị phòng trưng bày nhân vật 3D…';try{await mountPreview();}catch(error){console.warn(error);status.textContent='Không khởi tạo được WebGL trên thiết bị này.';}}
    if(opening)mounted?.resume();
  }
  return {open,close,getProfile:()=>({...profile}),setProfile(next){profile=normalizeAvatarProfile(next);renderSelection();mounted?.apply(profile);}};
}
