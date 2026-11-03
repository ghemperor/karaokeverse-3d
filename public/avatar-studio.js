import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { AVATAR_PALETTES, AVATAR_CHOICES, DEFAULT_AVATAR_PROFILE, normalizeAvatarProfile } from './avatar-profile.js';
import { applyAvatarAppearance } from './avatar-materials.js';

const LABELS={skin:'Màu da',hair:'Màu tóc',outfit:'Áo',pants:'Quần',shoes:'Giày',hairStyle:'Kiểu tóc',accessory:'Phụ kiện',build:'Dáng người'};
const CHOICE_LABELS={short:'Tóc ngắn',bangs:'Mái bằng',long:'Tóc dài',none:'Không',glasses:'Kính',headphones:'Tai nghe',regular:'Tiêu chuẩn',slim:'Thanh mảnh',broad:'Rộng vai'};
const COLOR_LABELS={porcelain:'Sáng',warm:'Tự nhiên',bronze:'Nâu ấm',deep:'Nâu đậm',ink:'Đen',chocolate:'Nâu',blonde:'Vàng',pink:'Hồng',blue:'Xanh',violet:'Tím',rose:'Hồng',sky:'Xanh dương',mint:'Xanh mint',amber:'Cam',black:'Đen',charcoal:'Xám đậm',navy:'Navy',cream:'Kem',denim:'Denim',white:'Trắng'};
export function createAvatarStudio({ getProfile, onChange, toast }) {
  const modal=document.getElementById('avatar-studio-modal');
  const colors=document.getElementById('avatar-studio-options');
  const status=document.getElementById('avatar-studio-status');
  let profile=normalizeAvatarProfile(getProfile());
  let mounted=null;
  let live=false;
  const controls=[];
  const addOption=(parent,key,value,hex)=>{
    const btn=document.createElement('button');btn.type='button';btn.className='av-option';btn.dataset.key=key;btn.dataset.value=value;
    btn.title=(COLOR_LABELS[value]||CHOICE_LABELS[value]||value);
    if(hex!=null){btn.classList.add('av-swatch');btn.style.setProperty('--swatch',`#${hex.toString(16).padStart(6,'0')}`);}
    else btn.textContent=CHOICE_LABELS[value]||value;
    btn.addEventListener('click',()=>{
      profile=normalizeAvatarProfile({...profile,[key]:value});
      try{localStorage.setItem('karaokeverse-avatar-profile',JSON.stringify(profile));}catch{}
      renderSelection();mounted?.apply(profile);onChange(profile);
    });
    parent.appendChild(btn);controls.push(btn);
  };
  for(const [key,palette] of Object.entries(AVATAR_PALETTES)){
    const div=document.createElement('div');div.className='av-setting';
    const label=document.createElement('strong');label.textContent=LABELS[key];div.appendChild(label);
    const row=document.createElement('div');row.className='av-options-row';div.appendChild(row);
    for(const [value,hex] of Object.entries(palette))addOption(row,key,value,hex);
    colors.appendChild(div);
  }
  for(const [key,values] of Object.entries(AVATAR_CHOICES)){
    const div=document.createElement('div');div.className='av-setting';
    const label=document.createElement('strong');label.textContent=LABELS[key];div.appendChild(label);
    const row=document.createElement('div');row.className='av-options-row';div.appendChild(row);
    for(const value of values)addOption(row,key,value,null);
    colors.appendChild(div);
  }
  function renderSelection(){
    for(const b of controls){
      const selected=profile[b.dataset.key]===b.dataset.value;
      b.classList.toggle('selected',selected);
      b.setAttribute('aria-pressed',String(selected));
    }
  }
  renderSelection();
  const close=()=>{modal.classList.add('hidden');modal.setAttribute('aria-hidden','true');live=false;mounted?.pause();};
  document.getElementById('avatar-studio-close').addEventListener('click',close);
  document.getElementById('avatar-studio-done').addEventListener('click',()=>{close();toast?.('✨ Avatar đã được lưu trên thiết bị và cập nhật trong phòng.');});
  document.getElementById('avatar-studio-reset').addEventListener('click',()=>{
    profile={...DEFAULT_AVATAR_PROFILE};
    try{localStorage.setItem('karaokeverse-avatar-profile',JSON.stringify(profile));}catch{}
    renderSelection();mounted?.apply(profile);onChange(profile);
  });
  modal.addEventListener('click',e=>{if(e.target===modal)close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.classList.contains('hidden'))close();});
  document.getElementById('avatar-studio-preview-pose').addEventListener('click',()=>mounted?.togglePose());
  async function mountPreview(){
    const host=document.getElementById('avatar-studio-preview');
    if(mounted)return mounted;
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x18112c);
    const width=()=>Math.max(150,host.clientWidth),height=()=>Math.max(190,host.clientHeight);
    const camera=new THREE.PerspectiveCamera(37,width()/height(),.1,30);camera.position.set(2.6,1.75,4.25);
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.4));renderer.setSize(width(),height());
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.7;
    host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xcebbff,0x21102a,2.3));
    const p=new THREE.SpotLight(0xe7a9ff,35);p.position.set(-2,4,3);scene.add(p,p.target);
    const floor=new THREE.Mesh(new THREE.CylinderGeometry(.9,.98,.1,40),new THREE.MeshStandardMaterial({color:0x50306d,metalness:.45,roughness:.43}));
    floor.position.y=-.08;scene.add(floor);
    const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,1.0,0);orbit.minDistance=2.4;orbit.maxDistance=7;orbit.enablePan=false;orbit.enableDamping=true;orbit.update();
    let model=null,mixer=null,pose='idle',actions=new Map();
    let ready=false,last=performance.now(),raf=0;
    try{
      const gltf=await new GLTFLoader().loadAsync('/models/karaoke-avatar.glb');
      model=gltf.scene;scene.add(model);
      mixer=new THREE.AnimationMixer(model);
      actions=new Map(gltf.animations.map(clip=>[clip.name,mixer.clipAction(clip)]));
      actions.get('idle')?.play();
      applyAvatarAppearance(model,profile,THREE);
      ready=true;host.querySelector('.av-preview-loading')?.remove();status.textContent='GLB • 10 hoạt ảnh • Kéo để xoay 360°';
    }catch(err){status.textContent='Không tải được GLB preview. Màu sắc vẫn được lưu.';console.warn(err);}
    function tick(){
      if(!live){raf=0;return;}
      raf=requestAnimationFrame(tick);
      const now=performance.now(),dt=Math.min(.05,(now-last)/1000);last=now;
      if(ready)mixer.update(dt);
      orbit.update();renderer.render(scene,camera);
    }
    function resume(){if(raf)return;live=true;last=performance.now();tick();}
    function pause(){live=false;if(raf)cancelAnimationFrame(raf);raf=0;}
    const resize=()=>{camera.aspect=width()/height();camera.updateProjectionMatrix();renderer.setSize(width(),height());};
    const observer=new ResizeObserver(resize);observer.observe(host);
    mounted={apply(p){if(model)applyAvatarAppearance(model,p,THREE);},resume,pause,togglePose(){if(!ready)return;
      const next=pose==='idle'?'dance':'idle';const prev=actions.get(pose),act=actions.get(next);
      if(!act)return;act.reset().fadeIn(.2).play();prev?.fadeOut(.2);pose=next;
      document.getElementById('avatar-studio-preview-pose').textContent=pose==='idle'?'▶ Thử nhảy':'■ Về đứng yên';
    }};
    return mounted;
  }
  async function open(){
    profile=normalizeAvatarProfile(getProfile());renderSelection();
    modal.classList.remove('hidden');modal.setAttribute('aria-hidden','false');live=true;
    if(!mounted){
      status.textContent='Đang tải mô hình GLB...';
      try{await mountPreview();}catch(e){console.warn('Avatar preview not available',e);status.textContent='Không mở được xem trước 3D.';}
    }
    if(live)mounted?.resume();
  }
  return {open,close,getProfile:()=>({...profile}),setProfile(next){profile=normalizeAvatarProfile(next);renderSelection();mounted?.apply(profile);}};
}
