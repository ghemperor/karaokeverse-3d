import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import {createAvatarLibrary} from './avatar-runtime.js';
import { normalizeAvatarProfile, profilesEqual, AVATAR_PALETTES, AVATAR_EMOTES } from './avatar-profile.js';
import { applyAvatarAppearance } from './avatar-materials.js';
import { getSofaSeat, isWalkingPositionBlocked, standFromSofa, SINGING_ARM } from './avatar-interactions.js';
import { GIFT_BY_ID } from './gift-data.js';

const COLORS = [0xc67afe, 0x70d4ff, 0xff78c8, 0xffd178, 0x83eabb, 0xff8484, 0xa4abff, 0xe9c3ff];
const VIEWS = {
  front: { position: [0, 3.15, 8.6], lookAt: [0, 2.25, -3.5] },
  wide: { position: [9.1, 6.1, 10.7], lookAt: [0, 1.7, -2.5] },
  orbit: { position: [3.3, 3.6, 4.8], lookAt: [0, 1.9, -0.15] },
  tv: { position: [0, 1.65, 1.0], lookAt: [0, 2.96, -5.0] },
};

export function initScene(webglContainer, cssContainer, callbacks = {}) {
  const width = () => Math.max(1, webglContainer.clientWidth);
  const height = () => Math.max(1, webglContainer.clientHeight);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x120e26);
  scene.fog = new THREE.FogExp2(0x120e26, 0.013);
  const camera = new THREE.PerspectiveCamera(48, width() / height(), 0.1, 80);
  camera.position.set(...VIEWS.front.position);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,Math.min(window.innerWidth,window.innerHeight)<700?1.3:1.7));
  renderer.setSize(width(), height());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.9;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  webglContainer.appendChild(renderer.domElement);

  const cssRenderer = new CSS3DRenderer();
  cssRenderer.setSize(width(), height());
  cssRenderer.domElement.style.position = 'absolute';
  cssRenderer.domElement.style.left = '0';
  cssRenderer.domElement.style.top = '0';
  cssRenderer.domElement.style.pointerEvents = 'none';
  cssContainer.appendChild(cssRenderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableRotate = false;
  controls.minDistance = 1.4;
  controls.maxDistance = 6.3;
  controls.maxPolarAngle = Math.PI / 2.03;
  controls.minPolarAngle = 0.16;
  controls.target.set(...VIEWS.front.lookAt);
  controls.update();

  const basicMat = (color, extra={}) => new THREE.MeshStandardMaterial({color, roughness: 0.72, metalness: .15, ...extra});
  const floorMat = basicMat(0x1a1830, {roughness:.34, metalness: .42});
  const wallMat = basicMat(0x221b36, {roughness:.7, side:THREE.DoubleSide});
  const gloss = basicMat(0x2d2043, {roughness:.28, metalness:.65});
  const velvet = basicMat(0x523269, {roughness:.96});
  const neonMat = (color) => new THREE.MeshBasicMaterial({color, toneMapped:false});
  function box(x,y,z,w,h,d,mat,cast=false){
    const obj = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
    obj.position.set(x,y,z);obj.castShadow=cast;obj.receiveShadow=true;scene.add(obj);return obj;
  }
  function tube(points, color, radius=.025){
    const path = new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, points.length * 6, radius, 7, false), neonMat(color));
    scene.add(mesh);return mesh;
  }
  function edge(x1,y1,z1,x2,y2,z2,col=0x8a54e8,thickness=.025){tube([[x1,y1,z1],[x2,y2,z2]],col,thickness)}

  scene.add(new THREE.HemisphereLight(0x9d8dff, 0x1c1430, 1.35));
  const ceilingLight=new THREE.PointLight(0xeb7dff,110,15,2);ceilingLight.position.set(-4,4,1);scene.add(ceilingLight);
  const cyanLight=new THREE.PointLight(0x54a6fc,95,14,2);cyanLight.position.set(4,4,0);scene.add(cyanLight);
  const rimLight=new THREE.SpotLight(0xff59bd,120,25,Math.PI/5,.7);rimLight.position.set(0,4.3,4);rimLight.target.position.set(0,.6,-2.2);scene.add(rimLight,rimLight.target);
  const screenLight = new THREE.PointLight(0x9a8cfb,50,12);screenLight.position.set(0,2,-2.5);scene.add(screenLight);

  box(0,-.27,.4,15,.44,13,floorMat);
  box(0,2.65,-5.59,15,6,.26,wallMat);
  box(-7.35,2.6,.35,.25,6,13,wallMat);
  box(7.35,2.6,.35,.25,6,13,wallMat);
  box(0,5.42,.4,15,.2,13,basicMat(0x110f22));
  // Floor's light borders
  edge(-6.9,-.01,-4.9,6.9,-.01,-4.9,0xab40d5,.035);
  edge(-6.9,-.01,6.7,6.9,-.01,6.7,0x8052ff,.035);
  for (let x=-6; x<=6;x+=1.4) edge(x,-.045,-5.1,x,-.045,6.4,0x3b315e,.009);
  for (let z=-4.4; z<=6;z+=1.4) edge(-6.8,-.045,z,6.8,-.045,z,0x40345e,.009);
  // Accent strips on walls
  for(const x of [-6.9,6.9]){
    edge(x,.25,-5.3,x,4.8,-5.3,0xc348f1,.035);
    for(let z=-4.2;z<=5;z+=2.6)edge(x,1.3,z,x,4.5,z, z<0?0x9354e7:0x427ada,.022);
    edge(x,4.7,-5.2,x,4.7,6.5,0x6a3ac7,.03);
  }
  edge(-7,5.15,-5.15,7,5.15,-5.15,0x9949fd,.04);
  // Television body and bezel
  box(0,2.96,-5.21,6.20,3.68,.30,basicMat(0x090913,{roughness:.25,metalness:.85}));
  box(0,2.96,-5.022,5.89,3.40,.025,basicMat(0x030308,{roughness:.05}));
  const tvLight=0xa46dff;
  edge(-3.04,1.17,-4.99,3.04,1.17,-4.99,tvLight,.025);
  edge(-3.04,4.74,-4.99,3.04,4.74,-4.99,tvLight,.025);
  edge(-3.04,1.17,-4.99,-3.04,4.74,-4.99,tvLight,.025);
  edge(3.04,1.17,-4.99,3.04,4.74,-4.99,tvLight,.025);
  // Welcome frame visible behind video before playback
  const backdrop = box(0,2.95,-4.98,5.76,3.2,.004, basicMat(0x15102b,{emissive:0x291447,emissiveIntensity:.7}));
  const interactables=[];
  const register=(mesh,type,label,data={})=>{mesh.material=mesh.material.clone();mesh.userData.interactive={type,label,...data};mesh.userData.baseEmissive=mesh.material.emissive?.getHex?.() ?? 0;interactables.push(mesh);return mesh;};
  register(backdrop,'tv','📺 Mở TV karaoke');
  const marquee=box(0,.75,-5.06,5.2,.45,.3,gloss);
  edge(-2.5,.97,-4.82,2.5,.97,-4.82,0xe664cd,.023);
  // Speakers: left and right
  const speakerMat=basicMat(0x0b0c18,{metalness:.4,roughness:.4});
  for(const sx of [-4.15,4.15]){
    register(box(sx,1.56,-4.92,1.13,2.55,.78,speakerMat,true),'speaker','🔊 Bật/tắt hiệu ứng loa');
    box(sx,1.56,-4.508,1.03,2.38,.022,basicMat(0x26223c));
    for(const [yy,rr] of [[.93,.35],[1.85,.42]]){
      const speaker = new THREE.Mesh(new THREE.CylinderGeometry(rr,rr,.06,30),speakerMat);
      speaker.rotation.x=Math.PI/2;speaker.position.set(sx,yy,-4.46);scene.add(speaker);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(rr-.055,.028,7,32),neonMat(0x965bed));
      ring.position.set(sx,yy,-4.417);scene.add(ring);
    }
  }
  // Floor stage and accents
  box(0,.015,-2.22,7.8,.18,2.35,basicMat(0x26203e,{metalness:.46,roughness:.36}),true);
  edge(-3.83,.13,-1.1,3.83,.13,-1.1,0xe066dc,.04);
  edge(-3.83,.13,-3.32,3.83,.13,-3.32,0x6058ed,.027);
  // Spotlights in ceiling
  // Stage gobos: visible translucent cones plus animated spotlights.
  const beams = [];
  for (let i = 0; i < 4; i++) {
    const x = [-3.2, -1.4, 1.4, 3.2][i];
    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(.05, .66, 4.2, 22, 1, true),
      new THREE.MeshBasicMaterial({color:i%2?0x87bfff:0xb679ff, transparent:true, opacity:.047, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide})
    );
    beam.position.set(x*.45,2.6,-1.95);beam.rotation.z=(x/4)*.12;
    scene.add(beam);beams.push(beam);
  }
  const movingLights=[];
  for(const sx of [-3.2,-1.4,1.4,3.2]){
    const bulb=new THREE.PointLight(sx>0?0x63b6ff:0xd054ff,40,6,2);bulb.position.set(sx,4.72,-1.4);scene.add(bulb);
    const fixture=new THREE.Mesh(new THREE.CylinderGeometry(.2,.24,.23,16),gloss);fixture.position.copy(bulb.position);scene.add(fixture);
    movingLights.push(bulb);
  }
  // v1.3 Battle Arena: two illuminated sides, spotlights and a 3D score ribbon.
  // All stage geometry is local to this scene and follows the server's battle phase.
  const battleRig=new THREE.Group();scene.add(battleRig);battleRig.visible=false;
  const battleRings=[],battleSpotlights=[];
  for(const [i,side] of ['A','B'].entries()){
    const x=side==='A'?-1.8:1.8;
    const color=side==='A'?0xff537f:0x54b6ff;
    const ring=new THREE.Mesh(new THREE.RingGeometry(.65,.82,36),
      new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide,transparent:true,opacity:.8,depthWrite:false,toneMapped:false}));
    ring.rotation.x=-Math.PI/2;ring.position.set(x,.17,-2.22);battleRig.add(ring);battleRings.push(ring);
    const disk=new THREE.Mesh(new THREE.CircleGeometry(.58,36),
      new THREE.MeshBasicMaterial({color,transparent:true,opacity:.10,side:THREE.DoubleSide,depthWrite:false}));
    disk.rotation.x=-Math.PI/2;disk.position.set(x,.165,-2.22);battleRig.add(disk);
    const lamp=new THREE.SpotLight(color,0,12,Math.PI/5,.65,1.5);
    lamp.position.set(x*1.2,4.85,.2);lamp.target.position.set(x,.2,-2.22);
    scene.add(lamp,lamp.target);battleSpotlights.push(lamp);
  }
  const battleBannerCanvas=document.createElement('canvas');battleBannerCanvas.width=1024;battleBannerCanvas.height=128;
  const battleBannerTexture=new THREE.CanvasTexture(battleBannerCanvas);
  battleBannerTexture.colorSpace=THREE.SRGBColorSpace;
  const battleBanner=new THREE.Mesh(new THREE.PlaneGeometry(4.5,.53),
    new THREE.MeshBasicMaterial({map:battleBannerTexture,transparent:true,depthWrite:false,toneMapped:false}));
  battleBanner.position.set(0,5.02,-5.10);battleRig.add(battleBanner);
  let battleSceneState=null,battleSceneSignature='',battleVictoryUntil=0;
  function redrawBattleBanner(battle){
    const signature=JSON.stringify([battle?.id,battle?.status,battle?.roundIndex,battle?.stage,battle?.score,battle?.counts]);
    if(signature===battleSceneSignature)return;
    battleSceneSignature=signature;
    const ctx=battleBannerCanvas.getContext('2d');
    ctx.clearRect(0,0,1024,128);ctx.fillStyle='#130b2df2';ctx.fillRect(0,8,1024,110);
    ctx.fillStyle='#ff779f';ctx.fillRect(0,8,12,110);ctx.fillStyle='#6dbdff';ctx.fillRect(1012,8,12,110);
    ctx.textAlign='center';ctx.font='bold 41px system-ui';ctx.fillStyle='#fff';
    const score=battle?.score||{A:0,B:0};
    const mark=n=>Number.isInteger(n)?String(n):n.toFixed(1);
    ctx.fillText(`⚔ BATTLE  •  RED ${mark(score.A)}  :  ${mark(score.B)} BLUE`,512,59);
    ctx.font='bold 23px system-ui';ctx.fillStyle='#c9bafa';
    ctx.fillText(`ROUND ${(battle?.roundIndex||0)+1}/${battle?.rounds||1}   •   ${battle?.status==='voting'?'LIVE VOTING':battle?.status==='performing'?'ON STAGE '+battle.stage:'BATTLE ARENA'}`,512,95);
    battleBannerTexture.needsUpdate=true;
  }
  function setBattleState(battle){
    battleSceneState=battle || null;
    const show=Boolean(battle?.id && ['performing','voting','result','finished'].includes(battle.status));
    battleRig.visible=show;
    if(show)redrawBattleBanner(battle);
    for(let i=0;i<2;i++){
      const selected=battle?.status==='performing'&&battle.stage===(i===0?'A':'B');
      battleSpotlights[i].intensity=show?(selected?140:battle.status==='voting'?90:34):0;
      battleRings[i].material.opacity=show?(selected?1:.55):0;
    }
  }
  function playBattleVictory(winnerIds=[],winnerSide=null){
    if(disposed)return;
    battleVictoryUntil=performance.now()+7000;
    playVictory(winnerIds);
    // Emphasize winning side for the duration of the ceremony; leave normal
    // stage lighting untouched after the animation ends.
    if(!winnerSide)playGift('confetti',null);
  }
  // Low sofas: sides and near camera, plush cushions
  const sofaSpecs=[[-5.8,1.0,-.1,2.0,1.35,4.8], [5.8,1.0,-.1,2.0,1.35,4.8], [-3.8,.9,3.35,3.7,1.25,1.5], [3.8,.9,3.35,3.7,1.25,1.5]];
  sofaSpecs.forEach(([x,y,z,w,h,d],idx)=>{
    register(box(x,.36,z,w,.52,d,velvet,true),'sofa','🛋️ Ngồi xuống sofa',{index:idx});
    if(idx<2){box(x+(x<0?-.68:.68),1.05,z,.4,1.45,d,velvet,true);}
    else box(x,1.04,z+0.47,w,1.35,.35,velvet,true);
    box(x,.64,z,w-.18,.15,d-.22,basicMat(0x78508a),true);
  });
  // Center table and drink silhouettes
  register(box(0,.67,2.35,3.15,.15,1.25,basicMat(0x403752,{metalness:.75,roughness:.15}),true),'table','🥤 Tương tác bàn nước');
  for(const x of [-1.25,1.25])box(x,.31,2.35,.12,.65,.83,gloss);
  for(let i=0;i<3;i++){
    const cylinder=new THREE.Mesh(new THREE.CylinderGeometry(.11,.095,.34,14),basicMat(i===1?0x65bff0:0xd65be9,{transparent:true,opacity:.55}));
    cylinder.position.set(-.6+i*.55,.94,2.18+(i%2)*.3);scene.add(cylinder);
    register(cylinder,'drink','🥤 Nâng ly');
  }
  // Disco sphere and glowing ring
  const disc=new THREE.Mesh(new THREE.IcosahedronGeometry(.33,2),basicMat(0xaad0ff,{roughness:.11,metalness:1}));disc.position.set(0,4.8,1.4);scene.add(disc);
  register(disc,'disco','🪩 Bật/tắt quả cầu disco');
  const discRing=new THREE.Mesh(new THREE.TorusGeometry(.55,.023,6,42),neonMat(0xb269ef));discRing.rotation.x=Math.PI/2;discRing.position.set(0,4.8,1.4);scene.add(discRing);
  // Beams and wall frames
  for(const x of [-5.75,5.75]){
    const sign=box(x,3.2,-5.28,.74,2.4,.06,basicMat(0x43284e,{emissive:0x8d248f,emissiveIntensity:.4}));
    sign.rotation.z=x<0?-.1:.1;
  }
  // Additional interactive props: microphone, wall light switch and an opening door.
  const micStand= new THREE.Group();
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,1.2,12),basicMat(0x7a809b,{metalness:.78,roughness:.27}));pole.position.y=.67;micStand.add(pole);
  const micHead=new THREE.Mesh(new THREE.CapsuleGeometry(.10,.16,5,12),basicMat(0xf3d9fb,{metalness:.6,roughness:.3}));micHead.position.set(0,1.35,-.03);micHead.rotation.z=-.28;micStand.add(micHead);
  const micBase=new THREE.Mesh(new THREE.CylinderGeometry(.26,.3,.07,20),gloss);micBase.position.y=.12;micStand.add(micBase);
  micStand.position.set(0,.1,-2.15);scene.add(micStand);
  register(micHead,'microphone','🎤 Cầm micro và hát');
  const lightSwitch=box(-6.98,1.55,3.72,.13,.65,.52,basicMat(0x5a486a,{emissive:0x5125a3,emissiveIntensity:.3}));
  register(lightSwitch,'lights','💡 Đổi màu đèn phòng');
  const doorPivot=new THREE.Group();doorPivot.position.set(7.08,0,3.55);scene.add(doorPivot);
  const door=new THREE.Mesh(new THREE.BoxGeometry(.13,3.35,1.9),basicMat(0x413153,{roughness:.5,metalness:.3}));door.position.set(0,1.66,-.92);doorPivot.add(door);
  const handle=new THREE.Mesh(new THREE.SphereGeometry(.1,12,12),basicMat(0xffd778,{roughness:.2,metalness:.75}));handle.position.set(-.11,1.6,-1.55);doorPivot.add(handle);
  register(door,'door','🚪 Mở/đóng cửa phòng');
  // Door frame deliberately stays static while the door swings.
  for(const z of [1.58,3.57])box(7.08,1.8,z,.22,3.6,.10,gloss);
  box(7.08,3.63,2.58,.22,.12,2.10,gloss);

  // Sculpted ambient pieces and a responsive stage floor.
  for(let i=0;i<9;i++){
    const x=(i%3-1)*2.1,z=-3.07+Math.floor(i/3)*.76;
    const panel=box(x,.115,z,1.98,.024,.69,
      basicMat(i%2?0x322649:0x283657,{emissive:i%2?0x3a166b:0x14365d,emissiveIntensity:.34,metalness:.42,roughness:.28}));
    panel.userData.stagePanel=i;
  }
  for(const side of [-1,1]){
    const shelf=box(side*6.9,2.8,-1.7,.20,2.2,1.55,gloss);
    const artwork=box(side*6.78,3.12,-1.8,.04,1.3,.96,basicMat(0x432956,{emissive:side<0?0x783ac9:0x1f6cb4,emissiveIntensity:.65}));
    edge(side*6.68,2.47,-2.26,side*6.68,3.77,-2.26,0xbd66ff,.015);
    void shelf;void artwork;
  }
  // v1.4.3: model selection lives in /models/avatar-catalog.json.
  // Load each licensed role model once, clone safe skinned skeletons per character.
  const avatarLibrary=createAvatarLibrary({onWarning:(...args)=>console.warn('[Avatar Pipeline]',...args)});
  const avatarAssetReady=avatarLibrary.catalog();
  async function installAvatarGLB(group){
    const d=group.userData;
    if(d.model||d.modelLoading||disposed)return;
    d.modelLoading=true;
    try{
      const handle=await avatarLibrary.instantiate('player',d.profile);
      if(disposed||!group.parent){handle.dispose();return;}
      group.add(handle.group);
      d.model=handle.model;
      d.modelHandle=handle;
      d.mixer=handle.mixer;
      d.currentAction=null;
      d.hips.visible=false;
      updateGLBAction(group,'idle');
    }catch(error){console.warn('Avatar model unavailable; keeping procedural character',error);}
    finally{d.modelLoading=false;}
  }
  function updateGLBAction(group,clipName){
    const d=group.userData;
    if(!d.modelHandle||d.currentAction===clipName)return;
    d.modelHandle.play(clipName);
    d.currentAction=clipName;
  }
  function applyAvatarProfile(id,profile){
    const group=userGroups.get(id);
    if(!group)return false;
    const d=group.userData;
    const safe=normalizeAvatarProfile(profile);
    if(profilesEqual(d.profile,safe))return true;
    d.profile=safe;
    if(d.modelHandle)d.modelHandle.apply(safe);
    else{
      d.cloth.color.setHex(AVATAR_PALETTES.outfit[safe.outfit]);
      d.skin.color.setHex(AVATAR_PALETTES.skin[safe.skin]);
      d.hairMaterial.color.setHex(AVATAR_PALETTES.hair[safe.hair]);
      d.dark.color.setHex(AVATAR_PALETTES.pants[safe.pants]);
    }
    return true;
  }
  const userGroups = new Map();
  const avatarPositions=[[-2.3,.4,.7],[2.3,.4,.7],[-4.75,.4,1.0],[4.75,.4,1.0],[-2.9,.4,3.0],[2.9,.4,3.0],[-.95,.4,4.0],[.95,.4,4.0]];
  let localUserId = null;
  let performerId = null;
  let currentPose = 'stand';
  let cinematicStartAt=performance.now();
  const cinematicLook=new THREE.Vector3(0,1.65,-2.2);
  let selectedView = 'front';
  let isSeated = false;
  let seatedSofaIndex = null;
  let lastMovementSent = 0;
  let raf = 0, disposed = false, isDiscoOn = true, speakerEffects = true;
  let doorOpened = false, doorAngle = 0, lightMode = 0;
  let highlighted = null, lastHoverAt = 0;
  const movement = {forward:false,back:false,left:false,right:false,run:false};
  const walk = {position:new THREE.Vector3(0,1.68,4.95),yaw:0,pitch:0,wasEntered:false};
  const movementClock=new THREE.Clock();
  const drag={active:false,moved:false,x:0,y:0,id:null};
  const raycaster=new THREE.Raycaster();
  const pointer=new THREE.Vector2();
  const worldState={lightMode:0,disco:true,speaker:true,door:false,party:false,revision:0};
  const ceilingColors=[0xeb7dff,0x70d4ff,0xffc565,0x75ffb4];
  const cyanColors=[0x54a6fc,0xdf75ff,0xff658f,0x75cfff];

  function textSprite(name){
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=64;
    const ctx=canvas.getContext('2d');ctx.fillStyle='rgba(19,12,37,.85)';
    ctx.beginPath();ctx.roundRect(6,7,244,49,13);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 21px system-ui';ctx.textAlign='center';ctx.fillText(name.slice(0,18),128,39);
    const tex=new THREE.CanvasTexture(canvas);const mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false});
    const sprite=new THREE.Sprite(mat);sprite.scale.set(1.6,.4,1);sprite.position.y=2.06;return sprite;
  }
  // v1.4.1: original stylized adult NPC characters; deliberately no external assets.
  // Their behaviors are room-local, synchronized by the server, not separate player slots.
  const npcActors=new Map();
  const npcHome={dj:[-5.15,-3.12],linh:[4.10,-3.2],mai:[4.15,.25],vy:[4.15,4.55]};
  function createNPCActor(id,name,palette){
    const root=new THREE.Group();root.name=`NPC_${id}`;root.position.set(...[npcHome[id][0],0,npcHome[id][1]]);scene.add(root);
    const skin=new THREE.MeshStandardMaterial({color:0xf1bb9b,roughness:.92});
    const hair=new THREE.MeshStandardMaterial({color:palette.hair,roughness:.75});
    const outfit=new THREE.MeshStandardMaterial({color:palette.outfit,roughness:.62,metalness:.06});
    const trim=new THREE.MeshStandardMaterial({color:0xf4ddff,roughness:.6});
    const ink=new THREE.MeshStandardMaterial({color:0x231b2d,roughness:.8});
    const put=(parent,geo,material,x,y,z)=>{const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
    const body=new THREE.Group();root.add(body);
    put(body,new THREE.CylinderGeometry(.19,.24,.50,16),outfit,0,1.05,0);
    const torso=put(body,new THREE.CapsuleGeometry(.235,.36,8,16),outfit,0,1.37,0);
    put(body,new THREE.CylinderGeometry(.32,.24,.47,20),outfit,0,.80,0);
    put(body,new THREE.SphereGeometry(.09,12,8),skin,0,1.72,0);
    const face=new THREE.Group();face.position.y=1.97;body.add(face);
    put(face,new THREE.SphereGeometry(.28,20,14),skin,0,0,0);
    put(face,new THREE.SphereGeometry(.30,20,12,0,Math.PI*2,0,Math.PI*.54),hair,0,.055,.01);
    put(face,new THREE.SphereGeometry(.21,16,12),hair,0,-.13,.21).scale.set(1.08,1.6,.6);
    for(const side of [-1,1]){
      put(face,new THREE.SphereGeometry(.037,10,8),ink,side*.105,-.015,-.265);
      put(face,new THREE.SphereGeometry(.052,12,8),skin,side*.265,-.065,0);
      const arm=new THREE.Group();arm.position.set(side*.25,1.55,0);body.add(arm);
      put(arm,new THREE.CapsuleGeometry(.092,.33,5,10),outfit,side*.02,-.29,0);
      put(arm,new THREE.SphereGeometry(.086,12,8),skin,side*.02,-.60,0);
      if(side===1)root.userData.rightArm=arm;
    }
    put(face,new THREE.SphereGeometry(.045,10,8),new THREE.MeshStandardMaterial({color:0xb45a73,roughness:.95}),0,-.15,-.275).scale.set(1.2,.42,.4);
    for(const side of [-1,1]){
      put(body,new THREE.CapsuleGeometry(.11,.46,6,12),new THREE.MeshStandardMaterial({color:0x332941,roughness:.78}),side*.13,.35,0);
      put(body,new THREE.BoxGeometry(.25,.15,.38),ink,side*.13,.08,-.065);
    }
    if(id==='dj'){
      const headphones=put(face,new THREE.TorusGeometry(.325,.04,7,23,Math.PI),trim,0,.10,0);
      headphones.rotation.z=Math.PI;
    }else{
      put(body,new THREE.BoxGeometry(.30,.40,.035),trim,0,1.10,-.241);
      put(body,new THREE.SphereGeometry(.08,10,8),trim,0,1.45,-.244);
    }
    const plate=textSprite(name);root.add(plate);plate.position.y=2.53;
    register(torso,'npc',`${id==='dj'?'🎧 DJ':'🍹 Nhân viên'} ${name}`,{npcId:id});
    root.userData={id,name,plate,hit:torso,body,rightArm:root.userData.rightArm,
      home:new THREE.Vector3(npcHome[id][0],0,npcHome[id][1]),target:new THREE.Vector3(npcHome[id][0],0,npcHome[id][1]),
      active:true,status:'idle',walkAmount:0};
    npcActors.set(id,root);
  }
  // NPCs use independently configured assets: dj / linh / mai / vy.
  // The legacy figures remain when a licensed model is not available.
  const NPC_FASHION={
    dj:{skin:'warm',hair:'plum',outfit:'violet',pants:'black',shoes:'white',hairStyle:'long',outfitStyle:'jacket',accessory:'headphones',expression:'joy'},
    linh:{skin:'golden',hair:'chocolate',outfit:'sky',pants:'navy',shoes:'white',hairStyle:'ponytail',outfitStyle:'formal',accessory:'none',expression:'smile'},
    mai:{skin:'porcelain',hair:'copper',outfit:'rose',pants:'charcoal',shoes:'white',hairStyle:'bangs',outfitStyle:'jacket',accessory:'necklace',expression:'smile'},
    vy:{skin:'bronze',hair:'ink',outfit:'mint',pants:'denim',shoes:'black',hairStyle:'curly',outfitStyle:'tee',accessory:'none',expression:'joy'},
  };
  async function installNPCGLB(group){
    if(!group?.userData||group.userData.npcModel||group.userData.npcLoading||disposed)return;
    const d=group.userData;
    d.npcLoading=true;
    try{
      const handle=await avatarLibrary.instantiate(d.id,NPC_FASHION[d.id]||{});
      if(disposed||!group.parent){handle.dispose();return;}
      group.add(handle.group);
      d.npcModel=handle.model;d.npcHandle=handle;d.npcMixer=handle.mixer;
      d.npcAction=null;
      d.body.visible=false;
      // An invisible physical interaction collider works for ANY imported mesh naming.
      const hit=new THREE.Mesh(new THREE.CylinderGeometry(.39,.39,1.72,12),
        new THREE.MeshBasicMaterial({transparent:true,opacity:.001,depthWrite:false}));
      hit.position.y=.89;group.add(hit);
      register(hit,'npc',`${d.id==='dj'?'🎧 DJ':'🍹 Nhân viên'} ${d.name}`,{npcId:d.id});
      d.hit=hit;
    }catch(error){console.warn(`NPC ${d.id} model not available`,error);}
    finally{d.npcLoading=false;}
  }
  function animateNPCGLB(group,name,dt){
    const d=group.userData;if(!d.npcHandle)return;
    if(d.npcAction!==name){d.npcHandle.play(name);d.npcAction=name;}
    d.npcHandle.update(dt);
  }
  // DJ workstation is separate from YouTube playback; it is a visual/party animation only.
  const djDesk=new THREE.Mesh(new THREE.BoxGeometry(1.75,.76,.66),basicMat(0x3d285b,{metalness:.65,roughness:.3}));
  djDesk.position.set(-5.18,.79,-2.35);scene.add(djDesk);
  const djTop=new THREE.Mesh(new THREE.BoxGeometry(1.86,.045,.78),basicMat(0x100f22,{metalness:.7,roughness:.2}));
  djTop.position.set(-5.18,1.18,-2.35);scene.add(djTop);
  for(let i=0;i<2;i++){
    const platter=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.04,32),basicMat(0x9c79ff,{metalness:.9,roughness:.25}));
    platter.position.set(-5.55+i*.74,1.22,-2.35);scene.add(platter);
  }
  createNPCActor('dj','DJ Luna',{outfit:0x7e49c6,hair:0x3d255c});
  createNPCActor('linh','Linh',{outfit:0x4a83b8,hair:0x362036});
  createNPCActor('mai','Mai',{outfit:0x9b4e83,hair:0x402b24});
  createNPCActor('vy','Vy',{outfit:0x538b81,hair:0x593a24});
  for(const npc of npcActors.values())installNPCGLB(npc);
  function setNPCState(state){
    if(!state)return;
    const members=[state.dj,...(state.staff||[])];
    members.forEach((npc,index)=>{
      const g=npcActors.get(npc.id);if(!g)return;
      const d=g.userData; d.active=npc.active!==false;d.status=npc.status||'idle';
      if(npc.name&&npc.name!==d.name){
        d.name=npc.name;d.plate.material.map.dispose();d.plate.material.dispose();g.remove(d.plate);
        d.plate=textSprite(npc.name);d.plate.position.y=2.53;g.add(d.plate);
        d.hit.userData.interactive.label=`${npc.id==='dj'?'🎧 DJ':'🍹 Nhân viên'} ${npc.name}`;
      }
      if(npc.id!=='dj'){
        const staffIndex=['linh','mai','vy'].indexOf(npc.id);
        const serving=npc.status==='serving';
        d.target.set(serving?2.35:d.home.x,0,serving?1.35+staffIndex*.58:d.home.z);
      }
    });
  }

  // Precompute a bent-elbow singing pose using two joint orientations.
  // The forearm quaternion is relative to the upper arm's current orientation.
  const shoulder=new THREE.Vector3(...SINGING_ARM.shoulder);
  const elbow=new THREE.Vector3(...SINGING_ARM.elbow);
  const wrist=new THREE.Vector3(...SINGING_ARM.wrist);
  const down=new THREE.Vector3(0,-1,0);
  const singingUpperQuat=new THREE.Quaternion().setFromUnitVectors(down,elbow.clone().sub(shoulder).normalize());
  const forearmWorldQuat=new THREE.Quaternion().setFromUnitVectors(down,wrist.clone().sub(elbow).normalize());
  const singingForearmQuat=singingUpperQuat.clone().invert().multiply(forearmWorldQuat);
  // Procedural, articulated low-poly character; no external model files required.
  function makeAvatar(user,index){
    const group=new THREE.Group();
    const profile=normalizeAvatarProfile(user.avatarProfile);
    const cloth=basicMat(AVATAR_PALETTES.outfit[profile.outfit],{roughness:.85});
    const skin=basicMat(AVATAR_PALETTES.skin[profile.skin],{roughness:.92});
    const dark=basicMat(AVATAR_PALETTES.pants[profile.pants],{roughness:.85});
    const hairMaterial=basicMat(AVATAR_PALETTES.hair[profile.hair]);
    const accent=basicMat(0xf5f0ff,{roughness:.68});
    function part(parent,geom,mat,x,y,z){
      const mesh=new THREE.Mesh(geom,mat);mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;
    }
    const hips=new THREE.Group();hips.position.y=.94;group.add(hips);
    part(hips,new THREE.BoxGeometry(.56,.32,.34),dark,0,0,0);
    const torso=new THREE.Group();torso.position.y=.18;hips.add(torso);
    part(torso,new THREE.CapsuleGeometry(.275,.39,5,11),cloth,0,.29,0);
    part(torso,new THREE.BoxGeometry(.38,.09,.035),accent,0,.37,-.285);
    const head=new THREE.Group();head.position.set(0,.94,0);hips.add(head);
    part(head,new THREE.SphereGeometry(.33,18,12),skin,0,0,0);
    const hair=part(head,new THREE.SphereGeometry(.34,18,12,0,Math.PI*2,0,Math.PI*.52),hairMaterial,0,.065,0);
    hair.scale.z=1.04;
    for(const ex of [-.125,.125]){
      part(head,new THREE.SphereGeometry(.029,8,8),dark,ex,.025,-.30);
      part(head,new THREE.BoxGeometry(.087,.018,.025),dark,ex,.118,-.318);
    }
    const mouth=part(head,new THREE.BoxGeometry(.085,.022,.022),basicMat(0x922e6d),0,-.12,-.315);
    // Two-segment arms: shoulder -> elbow -> wrist. This allows an actual
    // bent-elbow microphone grip instead of rotating the full straight arm.
    const upperArmLength = .25, forearmLength = .28;
    const arms=[],forearms=[];
    for(const side of [-1,1]){
      const arm=new THREE.Group();arm.position.set(side*.37,.57,0);torso.add(arm);
      part(arm,new THREE.CapsuleGeometry(.105,.055,5,9),cloth,0,-upperArmLength/2,0);
      const forearm=new THREE.Group();forearm.position.y=-upperArmLength;arm.add(forearm);
      part(forearm,new THREE.CapsuleGeometry(.092,.096,5,9),cloth,0,-forearmLength/2,0);
      part(forearm,new THREE.SphereGeometry(.102,10,8),skin,0,-forearmLength,0);
      arms.push(arm);forearms.push(forearm);
    }
    const legs=[];
    for(const side of [-1,1]){
      const leg=new THREE.Group();leg.position.set(side*.175,.0,0);hips.add(leg);
      part(leg,new THREE.CapsuleGeometry(.145,.31,5,9),dark,0,-.39,0);
      part(leg,new THREE.BoxGeometry(.29,.15,.43),accent,0,-.73,-.10);
      legs.push(leg);
    }
    // Microphone is attached to the right wrist, not to the upper arm.
    // During singing its quaternion cancels arm rotations so the grille stays upright.
    const mic=new THREE.Group();mic.position.set(0,-forearmLength,0);
    forearms[1].add(mic);
    part(mic,new THREE.CylinderGeometry(.032,.043,.20,12),basicMat(0xbab7d4,{metalness:.65,roughness:.28}),0,.10,0);
    part(mic,new THREE.CapsuleGeometry(.064,.045,5,12),basicMat(0xf4d5fb,{metalness:.4,roughness:.25}),0,SINGING_ARM.micGrilleHeight,0);
    part(mic,new THREE.CylinderGeometry(.049,.049,.018,12),basicMat(0x564363,{metalness:.5}),0,.18,0);
    mic.visible=false;
    const badge=textSprite(user.name);group.add(badge);
    const indicator=new THREE.Mesh(new THREE.TorusGeometry(.44,.029,7,26),neonMat(user.muted?0x574a6d:0x46efaf));
    indicator.rotation.x=Math.PI/2;indicator.position.y=.045;group.add(indicator);
    const [x,,z]=avatarPositions[index%avatarPositions.length];
    group.position.set(user.pos?.x ?? x,0,user.pos?.z ?? z);
    group.userData={indicator,hips,torso,head,arms,forearms,legs,mic,mouth,seed:index,profile,cloth,skin,dark,hairMaterial,
      target:new THREE.Vector3(group.position.x,0,group.position.z),
      yaw:user.pos?.yaw||0,pose:user.pos?.pose||'stand',muted:user.muted,
      lastX:group.position.x,lastZ:group.position.z,walkAmount:0};
    scene.add(group);installAvatarGLB(group);return group;
  }
  function setMembers(users){
    const usersById=new Map(users.map(u=>[u.id,u]));
    for(const [id,g] of userGroups){
      if(!usersById.has(id)){
        scene.remove(g);
        g.userData.modelHandle?.dispose();
        g.traverse(obj=>{if(obj.geometry&&!obj.userData.sharedAvatarGeometry)obj.geometry.dispose();if(obj.material){if(!obj.userData.sharedAvatarGeometry)obj.material.map?.dispose?.();obj.material.dispose?.()}});
        userGroups.delete(id);
      }
    }
    users.forEach((u,i)=>{
      if(!userGroups.has(u.id))userGroups.set(u.id,makeAvatar(u,i));
      const group=userGroups.get(u.id);const [x,,z]=avatarPositions[i%avatarPositions.length];
      applyAvatarProfile(u.id,u.avatarProfile);
      const pos=u.pos || {x,z,yaw:0,pose:'stand'};
      if(u.id!==localUserId || !['walk','follow'].includes(selectedView)){
        group.userData.target.set(pos.x,0,pos.z);
        group.userData.yaw=pos.yaw||0;
        group.userData.pose=pos.pose||'stand';
      }
      group.userData.indicator.material.color.setHex(u.muted?0x574a6d:0x46efaf);
      group.userData.muted=u.muted;
      group.visible=!(u.id===localUserId && selectedView==='walk');
    });
  }
  function setLocalUser(id){
    if(id!==localUserId){
      isSeated=false;seatedSofaIndex=null;currentPose='stand';walk.wasEntered=false;
    }
    localUserId=id;
    for(const [userId,g] of userGroups)g.visible=!(userId===id&&selectedView==='walk');
  }
  function applyMemberMove({id,pos}={}){
    const g=userGroups.get(id);
    if(!g||!pos||id===localUserId)return;
    g.userData.target.set(pos.x,0,pos.z);
    g.userData.yaw=pos.yaw;
    g.userData.pose=pos.pose;
  }
  function sendMovement(force=false){
    if(!localUserId)return;
    const now=performance.now();if(!force && now-lastMovementSent<115)return;
    lastMovementSent=now;
    const pos={x:Number(walk.position.x.toFixed(3)),z:Number(walk.position.z.toFixed(3)),yaw:Number(walk.yaw.toFixed(3)),pose:isSeated?'sit':currentPose};
    const own=userGroups.get(localUserId);
    if(own){own.userData.target.set(pos.x,0,pos.z);own.userData.yaw=pos.yaw;own.userData.pose=pos.pose;}
    callbacks.onMove?.(pos);
  }
  function applyWalkView(){
    if(selectedView==='follow'){
      const reach=2.8*Math.cos(walk.pitch*.65);
      camera.position.set(
        walk.position.x-Math.sin(walk.yaw)*reach,
        walk.position.y+.93+Math.sin(walk.pitch)*1.5,
        walk.position.z+Math.cos(walk.yaw)*reach
      );
      camera.lookAt(walk.position.x,walk.position.y-.15,walk.position.z);
      return;
    }
    camera.position.copy(walk.position);
    const cp=Math.cos(walk.pitch);
    const direction=new THREE.Vector3(Math.sin(walk.yaw)*cp,Math.sin(walk.pitch),-Math.cos(walk.yaw)*cp);
    camera.lookAt(walk.position.clone().add(direction));
  }
  function enterWalk(position=null){
    if(position){walk.position.set(position[0],position[1],position[2]);walk.wasEntered=true;}
    else if(!walk.wasEntered){
      const avatar=userGroups.get(localUserId);
      if(avatar&&!inCollision(avatar.position.x,avatar.position.z)){walk.position.set(avatar.position.x,1.68,avatar.position.z);}
      walk.wasEntered=true;
    }
    selectedView='walk';controls.enabled=false;
    camera.fov=63;camera.updateProjectionMatrix();
    for(const [id,g] of userGroups)g.visible=id!==localUserId;
    applyWalkView();
    callbacks.onViewChange?.('walk');
    callbacks.onHint?.('Kéo chuột để nhìn quanh • WASD để di chuyển • E để tương tác');
    sendMovement(true);
  }
  function enterFollow(){
    enterWalk();
    selectedView='follow';
    for(const g of userGroups.values())g.visible=true;
    applyWalkView();
    callbacks.onViewChange?.('follow');
    callbacks.onHint?.('Theo sau nhân vật • WASD di chuyển • Kéo để nhìn • E tương tác');
  }
  function setView(name){
    if(name==='walk'){enterWalk();return;}
    if(name==='follow'){enterFollow();return;}
    if(name==='cinematic'){
      selectedView='cinematic';cinematicStartAt=performance.now();
      controls.enabled=false;camera.fov=54;camera.updateProjectionMatrix();
      for(const g of userGroups.values())g.visible=true;
      callbacks.onViewChange?.('cinematic');
      callbacks.onHint?.('🎬 Camera tự chuyển cảnh theo người biểu diễn, khán giả và sân khấu');
      return;
    }
    const view=VIEWS[name]||VIEWS.front;
    // Changing cameras must not silently remove the seated state.
    selectedView=name;
    for(const g of userGroups.values())g.visible=true;
    camera.fov=48;camera.updateProjectionMatrix();
    controls.enabled=name==='orbit';
    controls.enableRotate=name==='orbit';
    controls.enableZoom=name==='orbit';
    controls.enablePan=false;
    camera.position.set(...view.position);controls.target.set(...view.lookAt);controls.update();
    callbacks.onViewChange?.(name);
    callbacks.onHint?.(name==='orbit'?'Kéo để xoay phòng 360° • Cuộn để phóng to • Nhấp vào đồ vật':'Chọn “Nhập vai” để tự đi quanh phòng');
    sendMovement(true);
  }
  const inCollision = isWalkingPositionBlocked;
  function standUp(){
    if(!isSeated)return false;
    // Step into the aisle beside THIS sofa, never back to the room spawn.
    walk.position.set(...standFromSofa(seatedSofaIndex,walk.position.toArray()));
    isSeated=false;seatedSofaIndex=null;currentPose='stand';
    applyWalkViewIfImmersive();
    return true;
  }
  function applyWalkViewIfImmersive(){
    if(['walk','follow'].includes(selectedView))applyWalkView();
  }
  function moveWalk(dt){
    if(!['walk','follow'].includes(selectedView))return;
    let forward=Number(movement.forward)-Number(movement.back);
    let sideways=Number(movement.right)-Number(movement.left);
    if(!forward&&!sideways)return;
    if(isSeated)standUp();
    else if(currentPose!=='stand')currentPose='stand';
    const length=Math.hypot(forward,sideways)||1;forward/=length;sideways/=length;
    const speed=(movement.run?4.1:2.45)*Math.min(dt,.07);
    const dx=(Math.sin(walk.yaw)*forward+Math.cos(walk.yaw)*sideways)*speed;
    const dz=(-Math.cos(walk.yaw)*forward+Math.sin(walk.yaw)*sideways)*speed;
    if(!inCollision(walk.position.x+dx,walk.position.z))walk.position.x+=dx;
    if(!inCollision(walk.position.x,walk.position.z+dz))walk.position.z+=dz;
    sendMovement();
  }
  function aim(dx,dy){
    walk.yaw+=dx*.0034;
    walk.pitch=Math.max(-1.32,Math.min(1.32,walk.pitch-dy*.0032));
    applyWalkView();sendMovement();
  }
  function hitAt(clientX,clientY,center=false){
    const rect=renderer.domElement.getBoundingClientRect();
    pointer.set(center?0:((clientX-rect.left)/rect.width)*2-1,center?0:-((clientY-rect.top)/rect.height)*2+1);
    raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects(interactables,false);
    for(const hit of hits){
      const action=hit.object.userData.interactive;
      if(!action)return null;
      if(['walk','follow'].includes(selectedView) && hit.distance>(action.type==='tv'?10:5.1))continue;
      return {mesh:hit.object,action};
    }
    return null;
  }
  function setHighlight(hit){
    const next=hit?.mesh||null;if(next===highlighted)return;
    if(highlighted){const material=highlighted.material;if(material?.emissive)material.emissive.setHex(highlighted.userData.baseEmissive||0);}
    highlighted=next;
    if(highlighted?.material?.emissive)highlighted.material.emissive.setHex(0x3c244f);
    renderer.domElement.style.cursor=hit?'pointer':['walk','follow'].includes(selectedView)?'grab':'auto';
    callbacks.onTarget?.(hit?.action?.label||null,selectedView);
  }
  function activate(hit){
    if(!hit)return;
    const {type,index}=hit.action;
    if(type==='sofa'){
      const seat=getSofaSeat(index);
      if(!seat)return;
      enterWalk(seat.seat);isSeated=true;seatedSofaIndex=index;currentPose='sit';
      walk.yaw=seat.yaw;walk.pitch=.02;applyWalkView();sendMovement(true);
      callbacks.onInteract?.('sofa',{index});
    }else if(type==='npc'){
      callbacks.onNPCInteract?.(hit.action.npcId);
    }else if(type==='microphone'){
      callbacks.onInteract?.('microphone');
    }else if(type==='tv'){
      setView('tv');callbacks.onInteract?.('tv');
    }else if(['lights','disco','speaker','door'].includes(type)){
      callbacks.onWorldAction?.(type);
    }else if(type==='drink'||type==='table'){
      if(type==='drink'){
        hit.mesh.userData.baseEmissive=0x8045e3;
      }
      callbacks.onInteract?.(type);
    }
    setHighlight(null);
  }
  function setWorldState(next){
    if(!next || typeof next!=='object')return;
    Object.assign(worldState,next);
    lightMode=worldState.lightMode;
    ceilingLight.color.setHex(ceilingColors[lightMode]||ceilingColors[0]);
    cyanLight.color.setHex(cyanColors[lightMode]||cyanColors[0]);
    screenLight.color.setHex(ceilingColors[lightMode]||ceilingColors[0]);
    isDiscoOn=worldState.disco;discRing.visible=isDiscoOn;
    speakerEffects=worldState.speaker;
    doorOpened=worldState.door;
  }
  function setPerformance(id){performerId=id||null;}
  function setEmote(pose){
    if(!AVATAR_EMOTES.includes(pose))return;
    if(isSeated)standUp();
    currentPose=pose;
    sendMovement(true);
  }
  function goStage(){
    currentPose='sing';isSeated=false;seatedSofaIndex=null;
    enterWalk([0,1.68,-2.16]);walk.yaw=0;walk.pitch=.07;
    applyWalkView();sendMovement(true);
  }
  function playReaction(emoji){
    if(!['👏','❤️','🔥','🎉','🎤'].includes(emoji))return;
    const count=emoji==='🎉'?44:22;
    const colors=[0xff68ce,0x7acaff,0xffe389,0x7cf5d0];
    const verts=new Float32Array(count*3);
    for(let i=0;i<count;i++){
      verts[i*3]=(Math.random()-.5)*4.2;
      verts[i*3+1]=1.8+Math.random()*2.3;
      verts[i*3+2]=-2.3+(Math.random()-.5)*2.5;
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(verts,3));
    const mat=new THREE.PointsMaterial({size:.085,color:colors[Math.floor(Math.random()*colors.length)],transparent:true,opacity:.9,sizeAttenuation:true,depthWrite:false});
    const particle=new THREE.Points(geo,mat);particle.userData.birth=performance.now();scene.add(particle);
    particles.push(particle);
  }
  const particles=[];
  // Animated world-space gift sprites, 3D rings and a stage celebration.
  // A shared texture per emoji avoids repeated CanvasTexture uploads and keeps mobile GPU cost bounded.
  const giftTextures=new Map();
  const giftEffects=[];
  const GIFT_TINTS={rose:0xff6798,heart:0xfa78c7,stars:0xffd677,confetti:0x8dc9ff,crown:0xffd26e,disco:0x9f8aff};
  let victoryUntil=0;
  function giftTexture(icon){
    if(giftTextures.has(icon))return giftTextures.get(icon);
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
    const ctx=canvas.getContext('2d');ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.font='96px "Segoe UI Emoji","Apple Color Emoji",sans-serif';ctx.fillText(icon,64,69);
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
    giftTextures.set(icon,tex);return tex;
  }
  function dropGiftEffect(fx){
    scene.remove(fx.object);
    // SpriteGeometry is shared by Three; only dispose per-instance materials.
    if(!fx.object.isSprite)fx.object.geometry.dispose();
    fx.object.material.dispose();
  }
  function playGift(giftId,toId){
    const gift=GIFT_BY_ID.get(giftId);if(!gift || disposed)return;
    const avatar=userGroups.get(toId);const x=avatar?.position.x??0;const z=avatar?.position.z??-2.2;
    const now=performance.now();
    const icons=giftId==='confetti'?['🎉','✨','🌟']:giftId==='rose'?['🌹','🌸','✨']:giftId==='disco'?['🪩','💜','✨']:[gift.icon,'✨'];
    const count=window.innerWidth<700?11:20;
    for(let i=0;i<count;i++){
      const material=new THREE.SpriteMaterial({map:giftTexture(icons[i%icons.length]),transparent:true,opacity:1,depthTest:false,depthWrite:false});
      const sprite=new THREE.Sprite(material);
      const angle=(i/count)*Math.PI*2+Math.random()*.28;
      const distance=.22+Math.random()*1.0;
      const baseY=.7+Math.random()*1.3;
      sprite.position.set(x+Math.cos(angle)*distance,baseY,z+Math.sin(angle)*distance);
      const size=.3+Math.random()*.28;sprite.scale.set(size,size,1);
      scene.add(sprite);
      giftEffects.push({object:sprite,kind:'float',born:now+i*18,life:2600+Math.random()*1700,
        x:sprite.position.x,y:baseY,z:sprite.position.z,vx:Math.cos(angle)*(.05+Math.random()*.2),vz:Math.sin(angle)*(.05+Math.random()*.2),vy:.25+Math.random()*.34,size});
    }
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.42,.035,6,48),new THREE.MeshBasicMaterial({color:GIFT_TINTS[giftId]||0xffd777,transparent:true,opacity:.95,depthWrite:false,side:THREE.DoubleSide}));
    ring.rotation.x=Math.PI/2;ring.position.set(x,.18,z);scene.add(ring);
    giftEffects.push({object:ring,kind:'ring',born:now,life:1900});
    while(giftEffects.length>145)dropGiftEffect(giftEffects.shift());
  }
  function playVictory(winnerIds=[]){
    if(disposed)return;
    victoryUntil=performance.now()+6500;
    for(const id of winnerIds.slice(0,3)){
      playGift('crown',id);
      playGift('stars',id);
    }
    if(!winnerIds.length)playGift('confetti',null);
  }
  function interactLooking(){
    const rect=renderer.domElement.getBoundingClientRect();
    activate(hitAt(rect.left+rect.width/2,rect.top+rect.height/2,true));
  }
  const onPointerDown=e=>{
    if(!['walk','follow'].includes(selectedView)||e.button!==0)return;
    drag.active=true;drag.moved=false;drag.x=e.clientX;drag.y=e.clientY;drag.id=e.pointerId;
    renderer.domElement.setPointerCapture(e.pointerId);
  };
  const onPointerMove=e=>{
    if(['walk','follow'].includes(selectedView)){
      if(drag.active&&e.pointerId===drag.id){
        const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
        if(Math.abs(dx)+Math.abs(dy)>3)drag.moved=true;
        aim(dx,dy);drag.x=e.clientX;drag.y=e.clientY;
      }
    }else if(selectedView!=='tv'&&selectedView!=='front'&&selectedView!=='wide'&&selectedView!=='orbit')return;
    else if(selectedView!=='orbit'){
      if(performance.now()-lastHoverAt>100){lastHoverAt=performance.now();setHighlight(hitAt(e.clientX,e.clientY));}
    }else if(performance.now()-lastHoverAt>100){lastHoverAt=performance.now();setHighlight(hitAt(e.clientX,e.clientY));}
  };
  const onPointerUp=e=>{
    if(['walk','follow'].includes(selectedView)&&drag.active&&e.pointerId===drag.id){
      const shouldInteract=!drag.moved;
      drag.active=false;
      if(shouldInteract)activate(hitAt(e.clientX,e.clientY));
    }else if(!['walk','follow'].includes(selectedView)){
      // Click without dragging: OrbitControls doesn't prevent pointerup.
      const moved=Math.abs(e.clientX-lastPointerX)+Math.abs(e.clientY-lastPointerY);
      if(moved<8)activate(hitAt(e.clientX,e.clientY));
    }
  };
  let lastPointerX=0,lastPointerY=0;
  const onAnyPointerDown=e=>{lastPointerX=e.clientX;lastPointerY=e.clientY;};
  const onPointerCancel=()=>{drag.active=false;};
  const activeInput=()=>{
    const node=document.activeElement;
    return !!node?.closest?.('input, textarea, select, [contenteditable="true"]');
  };
  const onKeyDown=e=>{
    if(!['walk','follow'].includes(selectedView)||activeInput()||!document.getElementById('avatar-studio-modal')?.classList.contains('hidden'))return;
    if(['KeyW','ArrowUp'].includes(e.code))movement.forward=true;
    else if(['KeyS','ArrowDown'].includes(e.code))movement.back=true;
    else if(['KeyA','ArrowLeft'].includes(e.code))movement.left=true;
    else if(['KeyD','ArrowRight'].includes(e.code))movement.right=true;
    else if(e.code==='ShiftLeft'||e.code==='ShiftRight')movement.run=true;
    else if(e.code==='KeyE'&&!e.repeat){e.preventDefault();interactLooking();return;}
    else if(e.code==='Escape'){setView('orbit');return;}
    else return;
    e.preventDefault();
  };
  const onKeyUp=e=>{
    if(['KeyW','ArrowUp'].includes(e.code))movement.forward=false;
    if(['KeyS','ArrowDown'].includes(e.code))movement.back=false;
    if(['KeyA','ArrowLeft'].includes(e.code))movement.left=false;
    if(['KeyD','ArrowRight'].includes(e.code))movement.right=false;
    if(e.code==='ShiftLeft'||e.code==='ShiftRight')movement.run=false;
  };
  const onBlur=()=>Object.keys(movement).forEach(key=>movement[key]=false);
  renderer.domElement.addEventListener('pointerdown',onAnyPointerDown);
  renderer.domElement.addEventListener('pointerdown',onPointerDown);
  renderer.domElement.addEventListener('pointermove',onPointerMove);
  renderer.domElement.addEventListener('pointerup',onPointerUp);
  renderer.domElement.addEventListener('pointercancel',onPointerCancel);
  window.addEventListener('keydown',onKeyDown);
  window.addEventListener('keyup',onKeyUp);
  window.addEventListener('blur',onBlur);
  const padBindings=[];
  for(const button of document.querySelectorAll('[data-move]')){
    const key=button.dataset.move;if(!(key in movement))continue;
    const down=e=>{e.preventDefault();movement[key]=true;button.setPointerCapture?.(e.pointerId);};
    const up=e=>{e.preventDefault();movement[key]=false;};
    button.addEventListener('pointerdown',down);button.addEventListener('pointerup',up);button.addEventListener('pointercancel',up);
    padBindings.push([button,down,up]);
  }
  const actionButton=document.getElementById('scene-action');
  const clickAction=()=>interactLooking();
  actionButton?.addEventListener('click',clickAction);

  // YouTube's official player stays in a CSS3D layer aligned with the 3D TV.
  const cssScene=new THREE.Scene();
  const playerShell=document.createElement('div');
  playerShell.id='tv-shell';playerShell.style.cssText='width:640px;height:360px;pointer-events:auto;background:#110f20;overflow:hidden;position:relative;border-radius:2px;';
  const playerElement=document.createElement('div');playerElement.id='youtube-player';playerElement.style.cssText='width:640px;height:360px;';
  playerShell.appendChild(playerElement);
  const tvPlaceholder=document.createElement('div');tvPlaceholder.id='tv-placeholder';
  tvPlaceholder.innerHTML='<div style="font-size:80px;opacity:.82;line-height:1">♫</div><strong style="font-size:30px;letter-spacing:4px">KARAOKEVERSE</strong><span style="margin-top:10px;letter-spacing:3px;font-size:14px;color:#be9ced">YOUR STAGE • YOUR PEOPLE</span>';
  tvPlaceholder.style.cssText='position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 38%,#5c237a,#170e2d 73%);color:white;font-family:system-ui;text-align:center;pointer-events:none;';
  playerShell.appendChild(tvPlaceholder);
  const tvObject=new CSS3DObject(playerShell);tvObject.position.set(0,2.955,-4.935);tvObject.scale.setScalar(.00875);cssScene.add(tvObject);

  function animate(){
    if(disposed)return;
    raf=requestAnimationFrame(animate);
    const dt=Math.min(movementClock.getDelta(),.05);
    const t=movementClock.elapsedTime;
    if(isDiscoOn){disc.rotation.y=t*.45;disc.rotation.z=t*.17;discRing.rotation.z=t*.11;}
    const victoryActive=performance.now()<victoryUntil;
    const showTime=Boolean(performerId)||worldState.party||victoryActive;
    rimLight.intensity=victoryActive?270:showTime?190:65;
    if(victoryActive)rimLight.color.setHSL((t*.12)%1,.8,.66);
    else rimLight.color.setHex(0xff59bd);
    beams.forEach((beam,i)=>{
      beam.visible=showTime&&speakerEffects;
      beam.rotation.z=Math.sin(t*(worldState.party?1.9:0.8)+i*1.2)*.15;
      beam.material.opacity=worldState.party?.085:.05;
    });
    for(let i=particles.length-1;i>=0;i--){
      const part=particles[i],age=(performance.now()-part.userData.birth)/1000;
      part.position.y+=dt*.35;
      part.material.opacity=Math.max(0,1-age/2.2);
      if(age>2.2){scene.remove(part);part.geometry.dispose();part.material.dispose();particles.splice(i,1);}
    }
    // Gift animations must not run indefinitely or retain GPU resources after the effect ends.
    const giftNow=performance.now();
    for(let i=giftEffects.length-1;i>=0;i--){
      const fx=giftEffects[i],age=giftNow-fx.born,progress=Math.max(0,Math.min(1,age/fx.life));
      if(age>fx.life){dropGiftEffect(fx);giftEffects.splice(i,1);continue;}
      if(fx.kind==='float'){
        fx.object.position.set(fx.x+fx.vx*(age/1000),fx.y+fx.vy*(age/1000),fx.z+fx.vz*(age/1000));
        const k=1+.36*progress;fx.object.scale.set(fx.size*k,fx.size*k,1);
        fx.object.material.opacity=progress<.15?progress/.15:Math.min(1,(1-progress)/.27);
      } else {
        fx.object.scale.setScalar(1+progress*3.3);
        fx.object.material.opacity=Math.max(0,1-progress);
      }
    }
    const battleVictory=performance.now()<battleVictoryUntil;
    if(battleSceneState?.id){
      battleSpotlights.forEach((lamp,i)=>{
        const side=i===0?'A':'B';
        const singerSide=battleSceneState.status==='performing'&&battleSceneState.stage===side;
        const ceremonySide=battleSceneState.status==='finished'&&battleSceneState.winnerSide===side;
        lamp.intensity=battleVictory?(ceremonySide?210:90):
          battleSceneState.status==='performing'?(singerSide?145:20):
          battleSceneState.status==='voting'?(85+15*Math.sin(t*3+i)):40;
      });
      battleRings.forEach((ring,i)=>{ring.rotation.z=t*.20*(i===0?1:-1);});
    }
    movingLights.forEach((light,i)=>{light.intensity=speakerEffects?((victoryActive?100:worldState.party?65:showTime?45:25)+12*Math.sin(t*(victoryActive?6:worldState.party?4:1.7)+i*.9)):0;});
    // Use a separate target to avoid accumulating spring error.
    const targetDoorAngle=doorOpened?-.88:0;
    doorAngle+=(targetDoorAngle-doorAngle)*Math.min(1,dt*6);
    doorPivot.rotation.y=doorAngle;
    moveWalk(dt);
    if(['walk','follow'].includes(selectedView)){
      applyWalkView();
      if(performance.now()-lastHoverAt>120){
        lastHoverAt=performance.now();
        const rect=renderer.domElement.getBoundingClientRect();
        setHighlight(hitAt(rect.left+rect.width/2,rect.top+rect.height/2,true));
      }
    } else if(selectedView==='cinematic'){
      // Three scene shots: singer close-up, audience reverse, wide-room reveal.
      const elapsed=(performance.now()-cinematicStartAt)/1000;
      const phase=Math.floor(elapsed/5.8)%3;
      const subject=userGroups.get(performerId);
      const focus=subject?.position||new THREE.Vector3(0,0,-2.22);
      let dest,look;
      if(phase===0){
        dest=new THREE.Vector3(focus.x+2.5,2.35,focus.z+3.6);
        look=new THREE.Vector3(focus.x,1.45,focus.z);
      }else if(phase===1){
        dest=new THREE.Vector3(-4.6,2.7,4.55);
        look=new THREE.Vector3(1.8,1.45,1.7);
      }else{
        dest=new THREE.Vector3(5.0,4.0,6.05);
        look=new THREE.Vector3(0,1.8,-2.45);
      }
      camera.position.lerp(dest,Math.min(1,dt*1.45));
      cinematicLook.lerp(look,Math.min(1,dt*1.5));
      camera.lookAt(cinematicLook);
    } else if(controls.enabled)controls.update();
    for(const [id,g] of userGroups){
      const d=g.userData;
      const delta=Math.hypot(d.target.x-g.position.x,d.target.z-g.position.z);
      const velocity=Math.min(1,delta/Math.max(dt,.001)*.25);
      d.walkAmount=THREE.MathUtils.damp(d.walkAmount,velocity,7,dt);
      g.position.x=THREE.MathUtils.damp(g.position.x,d.target.x,9,dt);
      g.position.z=THREE.MathUtils.damp(g.position.z,d.target.z,9,dt);
      // Avatar models face -Z, but walk.yaw turns +X for positive yaw.
      g.rotation.y=THREE.MathUtils.damp(g.rotation.y,-d.yaw,8,dt);
      const pose=id===performerId?'sing':d.pose;
      const seated=pose==='sit',dance=pose==='dance',clap=pose==='clap',wave=pose==='wave',sing=pose==='sing';
      if(d.model){
        const selected=sing?'sing':d.walkAmount>.18&&!seated?'walk':AVATAR_EMOTES.includes(pose)?(pose==='stand'?'idle':pose):seated?'sit':'idle';
        updateGLBAction(g,selected);
        const micNode=d.model.getObjectByName('Mic');
        if(micNode)micNode.visible=sing;
        d.modelHandle.update(dt);
        // Non-keyframed facial micro-animations; every avatar blinks on a different cycle.
        const blinkPhase=(t+d.seed*1.83)%4.7;
        const blink=blinkPhase<.13?Math.max(.13,Math.abs(blinkPhase-.065)/.065):1;
        for(const side of ['L','R']){
          const eye=d.model.getObjectByName('EyeWhite'+side);
          if(eye){eye.userData.atelierBaseY??=eye.scale.y;eye.scale.y=eye.userData.atelierBaseY*blink;}
          const iris=d.model.getObjectByName('Eye'+side);
          if(iris){iris.userData.atelierBaseY??=iris.scale.y;iris.scale.y=iris.userData.atelierBaseY*blink;}
        }
        const mouth=d.model.getObjectByName('SmileMouth')||d.model.getObjectByName('JoyMouth');
        if(mouth&&mouth.visible){mouth.userData.atelierBaseY??=mouth.scale.y;mouth.scale.y=mouth.userData.atelierBaseY*(sing&&!d.muted?1+Math.abs(Math.sin(t*8+d.seed))*.42:1);}
        if(!d.muted)d.indicator.scale.setScalar(1+Math.sin(t*5+d.seed)*.07);
        continue;
      }
      const gait=Math.sin(t*10+d.seed)*d.walkAmount;
      const bounce=dance?Math.abs(Math.sin(t*5))*.12:Math.abs(gait)*.038;
      d.hips.position.y=THREE.MathUtils.damp(d.hips.position.y,seated?.63:.94+bounce,10,dt);
      d.torso.rotation.z=THREE.MathUtils.damp(d.torso.rotation.z,dance?Math.sin(t*5)*.18:0,9,dt);
      d.head.rotation.y=THREE.MathUtils.damp(d.head.rotation.y,dance?Math.sin(t*3)*.18:0,9,dt);
      // Positive pitch puts seated legs forward, rather than through the sofa.
      d.legs[0].rotation.x=THREE.MathUtils.damp(d.legs[0].rotation.x,seated?1.42:dance?Math.sin(t*6)*.35:gait*.55,11,dt);
      d.legs[1].rotation.x=THREE.MathUtils.damp(d.legs[1].rotation.x,seated?1.42:dance?-Math.sin(t*6)*.35:-gait*.55,11,dt);
      const left=sing?.22:clap?-.8:wave?-.2:dance?Math.sin(t*6)*.8:-gait*.56;
      const right=wave?-2.7:clap?-.9:dance?-Math.sin(t*6)*.8:gait*.56;
      const blend=Math.min(1,dt*12);
      const normalLeft=new THREE.Quaternion().setFromEuler(new THREE.Euler(left,0,clap?-.9:0));
      d.arms[0].quaternion.slerp(normalLeft,blend);
      d.forearms[0].quaternion.slerp(new THREE.Quaternion(),blend);
      const normalRight=new THREE.Quaternion().setFromEuler(new THREE.Euler(right,0,clap?.9:wave?-.32:0));
      d.arms[1].quaternion.slerp(sing?singingUpperQuat:normalRight,blend);
      d.forearms[1].quaternion.slerp(sing?singingForearmQuat:new THREE.Quaternion(),blend);
      d.mic.visible=sing;
      if(sing){
        // Maintain an upright microphone in front of the lips even as the wrist bends.
        d.mic.quaternion.copy(d.arms[1].quaternion).multiply(d.forearms[1].quaternion).invert();
      }
      d.mouth.scale.y=sing&&!d.muted?1+Math.abs(Math.sin(t*9+d.seed))*3:1;
      if(!d.muted)d.indicator.scale.setScalar(1+Math.sin(t*5+d.seed)*.07);
    }
    // Animate service NPC approaches and the DJ's hands each frame.
    for(const g of npcActors.values()){
      const d=g.userData;
      const dx=d.target.x-g.position.x,dz=d.target.z-g.position.z;
      const distance=Math.hypot(dx,dz);
      const moving=distance>.06;
      if(moving){
        const step=Math.min(distance,dt*1.6);
        g.position.x+=dx/distance*step;g.position.z+=dz/distance*step;
        const yaw=Math.atan2(-dx,-dz);
        g.rotation.y+=Math.atan2(Math.sin(yaw-g.rotation.y),Math.cos(yaw-g.rotation.y))*Math.min(1,dt*6);
      } else if(d.id!=='dj')g.rotation.y=THREE.MathUtils.damp(g.rotation.y,d.status==='serving'?-Math.PI/2:0,5,dt);
      const dance=d.id==='dj'&&d.active;
      d.body.rotation.z=THREE.MathUtils.damp(d.body.rotation.z,dance?Math.sin(t*3.7)*.07:0,5,dt);
      if(d.rightArm)d.rightArm.rotation.x=THREE.MathUtils.damp(d.rightArm.rotation.x,dance?-1+Math.sin(t*4)*.28:moving?Math.sin(t*8)*.23:d.status==='serving'?-1.15:0,7,dt);
      d.body.position.y=(dance?Math.sin(t*5)*.035:moving?Math.abs(Math.sin(t*7))*.026:0);
      animateNPCGLB(g,dance?'dance':moving?'walk':d.status==='serving'?'pose':'idle',dt);
    }
    renderer.render(scene,camera);cssRenderer.render(cssScene,camera);
  }
  animate();
  function resize(){
    if(disposed)return;
    camera.aspect=width()/height();camera.updateProjectionMatrix();
    renderer.setSize(width(),height());cssRenderer.setSize(width(),height());
  }
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(webglContainer);
  window.addEventListener('resize',resize);
  function dispose(){
    disposed=true;cancelAnimationFrame(raf);resizeObserver.disconnect();window.removeEventListener('resize',resize);
    renderer.domElement.removeEventListener('pointerdown',onAnyPointerDown);
    renderer.domElement.removeEventListener('pointerdown',onPointerDown);
    renderer.domElement.removeEventListener('pointermove',onPointerMove);
    renderer.domElement.removeEventListener('pointerup',onPointerUp);
    renderer.domElement.removeEventListener('pointercancel',onPointerCancel);
    window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);window.removeEventListener('blur',onBlur);
    actionButton?.removeEventListener('click',clickAction);
    for(const [button,down,up] of padBindings){button.removeEventListener('pointerdown',down);button.removeEventListener('pointerup',up);button.removeEventListener('pointercancel',up);}
    for(const fx of giftEffects)dropGiftEffect(fx);giftEffects.length=0;
    for(const tex of giftTextures.values())tex.dispose();giftTextures.clear();
    for(const g of userGroups.values())g.userData.modelHandle?.dispose();
    for(const g of npcActors.values())g.userData.npcHandle?.dispose();
    controls.dispose();renderer.dispose();
    scene.traverse(obj=>{obj.geometry?.dispose();if(obj.material){obj.material.map?.dispose?.();obj.material.dispose?.()}});
    webglContainer.replaceChildren();cssContainer.replaceChildren();
  }
  return {playerElement,tvPlaceholder,setMembers,setLocalUser,applyMemberMove,applyAvatarProfile,setView,setEmote,setPerformance,setWorldState,setBattleState,setNPCState,goStage,playReaction,playGift,playVictory,playBattleVictory,interactLooking,getView:()=>selectedView,dispose};
}
