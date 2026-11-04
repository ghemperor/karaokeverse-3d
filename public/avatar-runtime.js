import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {applyAvatarAppearance} from './avatar-materials.js';
import {AVATAR_PALETTES,normalizeAvatarProfile} from './avatar-profile.js';
import {validateAvatarCatalog,matchAnimationName,DEFAULT_AVATAR_SRC,AVATAR_ROLES} from './avatar-catalog.js';

const DEFAULT_CATALOG={models:Object.fromEntries(AVATAR_ROLES.map(role=>[role,{src:DEFAULT_AVATAR_SRC,originalRig:true, height:1.85,yawDegrees:0}]))};

export function createAvatarLibrary({onWarning=console.warn}={}){
  const loader=new GLTFLoader();
  const assets=new Map();
  let readyCatalog=null;
  async function catalog(){
    if(!readyCatalog){
      readyCatalog=fetch('/models/avatar-catalog.json',{cache:'no-store'})
        .then(r=>{if(!r.ok)throw Error(`catalog HTTP ${r.status}`);return r.json();})
        .then(validateAvatarCatalog)
        .catch(err=>{onWarning('Catalog unavailable, using original GLB',err);return validateAvatarCatalog(DEFAULT_CATALOG);});
    }
    return readyCatalog;
  }
  function assetFor(src){
    if(!assets.has(src)){
      assets.set(src,loader.loadAsync(src).catch(error=>{assets.delete(src);throw error;}));
    }
    return assets.get(src);
  }
  async function instantiate(role='player',profile={}){
    const cfg=await catalog();
    const spec=cfg.models[role]||cfg.models.player;
    let asset,usedFallback=false;
    try{asset=await assetFor(spec.src);}
    catch(error){
      if(spec.src===DEFAULT_AVATAR_SRC)throw error;
      onWarning(`Cannot load ${spec.src}; using original avatar`,error);
      asset=await assetFor(DEFAULT_AVATAR_SRC);usedFallback=true;
    }
    // SkeletonUtils preserves bone-to-SkinnedMesh bindings; Object3D.clone() does not.
    const model=cloneSkeleton(asset.scene);
    const original=usedFallback||spec.originalRig||spec.src===DEFAULT_AVATAR_SRC;
    const contents=new THREE.Group();contents.name=`AvatarContent_${role}`;
    contents.add(model);
    const direction=usedFallback?0:spec.yawDegrees;
    model.rotation.y=THREE.MathUtils.degToRad(direction);
    model.updateMatrixWorld(true);
    const bounding=new THREE.Box3().setFromObject(model);
    const dimensions=bounding.getSize(new THREE.Vector3());
    // Standardize arbitrary authoring units to ~1.8m tall; preserve the built-in rig as before.
    const height=original?1:Math.min(10,Math.max(.03,spec.height/Math.max(.01,dimensions.y)));
    model.scale.multiplyScalar(height);
    model.updateMatrixWorld(true);
    const groundBox=new THREE.Box3().setFromObject(model);
    // Ground alignment is applied to the imported mesh, NOT the character position/multiplayer root.
    if(!original)model.position.y-=groundBox.min.y;
    model.updateMatrixWorld(true);
    if(original&&role!=='player')contents.scale.setScalar(.91);
    contents.userData.isAvatarContent=true;
    contents.userData.externalAvatar=!original;
    model.userData.externalAvatar=!original;
    model.traverse(obj=>{
      if(!obj.isMesh)return;
      obj.castShadow=true;obj.receiveShadow=true;
      obj.userData.sharedAvatarGeometry=true;
      // Own the material per instance; never mutate a material shared by other players.
      obj.material=(Array.isArray(obj.material)?obj.material.map(m=>m.clone()):obj.material.clone());
      obj.userData.ownedMaterial=true;
      obj.userData.avatarMaterialCloned=true;
    });
    const mixer=new THREE.AnimationMixer(model);
    const clipNames=asset.animations.map(c=>c.name);
    const actions=new Map(asset.animations.map(c=>[c.name,mixer.clipAction(c)]));
    let currentName=null,currentAction=null,requested='idle',elapsed=0;
    const bones={};
    model.traverse(o=>{
      if(!o.isBone)return;
      const n=o.name.toLowerCase().replace(/[^a-z]/g,'');
      const names={
        leftArm:['leftupperarm','leftarm','leftshoulder'],rightArm:['rightupperarm','rightarm','rightshoulder'],
        leftLeg:['leftupperleg','leftupleg','leftthigh'],rightLeg:['rightupperleg','rightupleg','rightthigh'],
        head:['head'],spine:['spine','chest']
      };
      for(const [type,patterns] of Object.entries(names)){
        if(!bones[type]&&patterns.some(x=>n.endsWith(x)))bones[type]={bone:o,rest:o.quaternion.clone()};
      }
    });
    // Optional microphone prop follows a licensed model's right-hand bone.
    // If the file has a built-in 'Mic' object, we use it without creating duplicates.
    if(!original&&!model.getObjectByName('Mic')){
      const hand=[];
      model.traverse(o=>{if(o.isBone&&/(?:right(hand|wrist)|handr|righthand|mixamorigrighthand|j_bip_r_hand)/i.test(o.name))hand.push(o);});
      if(hand.length){
        const mic=new THREE.Group();mic.name='Mic';
        const grip=new THREE.Mesh(new THREE.CylinderGeometry(.022,.025,.20,12),new THREE.MeshStandardMaterial({color:0x29263b,metalness:.65,roughness:.3}));
        grip.position.y=.09;mic.add(grip);
        const cap=new THREE.Mesh(new THREE.SphereGeometry(.040,12,8),new THREE.MeshStandardMaterial({color:0xc6bde4,metalness:.58,roughness:.27}));
        cap.position.y=.205;mic.add(cap);
        // Counteract imported file's unit scale so the prop remains life-size.
        mic.scale.setScalar(1/Math.max(.001,height));
        mic.rotation.set(-Math.PI*.5,0,0);
        hand[0].add(mic);mic.visible=false;
      }
    }
    // For custom rigs, only clips contained in the licensed asset are played. A model with
    // no clips stays in its bind pose; incompatible rigs aren't falsely "retargeted".
    function play(action){
      // A rig's first embedded clip is NOT automatically an idle animation.
      // Select an animation only when its name (or a catalog alias) matches the game action.
      const matched=matchAnimationName(clipNames,action,cfg.animationAliases);
      requested=action;
      if(!matched){
        // Fade out a previous action so a Dance/Walk clip cannot keep looping
        // after the player stops moving or changes to an unmapped action.
        if(currentAction)currentAction.fadeOut(.18);
        currentAction=null;
        currentName=null;
        return {requested:action,matched:null};
      }
      if(currentName===matched)return {requested:action,matched};
      const next=actions.get(matched);
      if(!next)return {requested:action,matched:null};
      next.reset().setLoop(THREE.LoopRepeat,Infinity).fadeIn(.24).play();
      if(currentAction&&currentAction!==next)currentAction.fadeOut(.24);
      currentAction=next;
      currentName=matched;
      return {requested:action,matched};
    }
    // When a rig contains bones but no usable animation, approximate basic movements.
    // This is NOT motion retargeting for arbitrary skeletons; use native clips for best results.
    function update(dt){
      elapsed+=dt;
      mixer.update(dt);
      if(clipNames.length||!Object.keys(bones).length)return;
      const t=elapsed,walking=requested==='walk'||requested==='run',singing=requested==='sing';
      const values={
        leftArm:walking?Math.sin(t*7)*.42:requested==='clap'?-0.8:requested==='wave'?-0.4:0,
        rightArm:walking?-Math.sin(t*7)*.42:singing?-1.15:requested==='wave'?-2:requested==='clap'?-0.8:0,
        leftLeg:walking?-Math.sin(t*7)*.45:requested==='sit'?1.0:0,
        rightLeg:walking?Math.sin(t*7)*.45:requested==='sit'?1.0:0,
        head:requested==='dance'?Math.sin(t*3)*.12:0,
        spine:requested==='bow'?.32:requested==='dance'?Math.sin(t*3)*.15:0
      };
      for(const [key,entry] of Object.entries(bones)){
        const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),values[key]||0);
        entry.bone.quaternion.copy(entry.rest).multiply(q);
      }
    }
    function apply(nextProfile){
      if(original){applyAvatarAppearance(model,nextProfile,THREE);return;}
      const safe=normalizeAvatarProfile(nextProfile);
      model.traverse(obj=>{
        if(!obj.isMesh)return;
        const mats=Array.isArray(obj.material)?obj.material:[obj.material];
        for(const mat of mats){
          for(const [key,names] of Object.entries(spec.materialBindings)){
            if(names.some(n=>n.toLowerCase()===mat?.name?.toLowerCase())&&mat?.color){
              mat.color.setHex(AVATAR_PALETTES[key][safe[key]]);mat.needsUpdate=true;
            }
          }
        }
      });
    }
    apply(profile);
    function dispose(){
      mixer.stopAllAction();mixer.uncacheRoot(model);
      model.traverse(obj=>{
        if(!obj.isMesh)return;
        const mats=Array.isArray(obj.material)?obj.material:[obj.material];
        for(const m of mats)m?.dispose?.();
      });
      // Geometry/textures belong to the asset cache and must not be disposed per player.
    }
    play('idle');
    return {group:contents,model,mixer,play,update,apply,dispose,external:!original,usedFallback,
      source:usedFallback?DEFAULT_AVATAR_SRC:spec.src,clips:clipNames,
      resolvedActions:Object.fromEntries(['idle','walk','run','sit','sing','dance','wave','clap','cheer','bow','heart','pose'].map(action=>[action,matchAnimationName(clipNames,action,cfg.animationAliases)]))};
  }
  return {catalog,instantiate};
}
