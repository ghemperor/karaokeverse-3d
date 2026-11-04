// Pure, server-testable model-catalog validation. Never let a remote player supply an asset URL.
export const AVATAR_ROLES = Object.freeze(['player','dj','linh','mai','vy']);
export const AVATAR_ACTIONS = Object.freeze(['idle','walk','run','sit','sing','dance','wave','clap','cheer','bow','heart','pose']);
export const DEFAULT_AVATAR_SRC = '/models/karaoke-avatar.glb';
const MODEL_PATH = /^\/models\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:glb|gltf|vrm)$/i;
const DEFAULT_ANIMATIONS = Object.fromEntries(AVATAR_ACTIONS.map(k=>[k,[k,k[0].toUpperCase()+k.slice(1)]]));
export function safeModelPath(value){return typeof value==='string'&&value.length<=220&&MODEL_PATH.test(value)?value:null;}
export function validateAvatarCatalog(input){
  const source=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
  const raw=source.models&&typeof source.models==='object'&&!Array.isArray(source.models)?source.models:{};
  const models={};
  for(const role of AVATAR_ROLES){
    const val=raw[role]&&typeof raw[role]==='object'?raw[role]:{};
    models[role]={
      src:safeModelPath(val.src)||DEFAULT_AVATAR_SRC,
      height:typeof val.height==='number'&&Number.isFinite(val.height)?Math.max(1.35,Math.min(2.3,val.height)):1.85,
      yawDegrees:typeof val.yawDegrees==='number'&&Number.isFinite(val.yawDegrees)?Math.max(-180,Math.min(180,val.yawDegrees)):0,
      originalRig:val.originalRig===true && val.src===DEFAULT_AVATAR_SRC,
      materialBindings:Object.fromEntries(['skin','hair','outfit','pants','shoes'].map(key=>[
        key,Array.isArray(val.materialBindings?.[key])
          ?val.materialBindings[key].filter(x=>typeof x==='string'&&x.length<=80&&/^[a-zA-Z0-9 _.:-]+$/.test(x)).slice(0,12)
          :[]
      ]))
    };
  }
  const aliases={};
  for(const k of AVATAR_ACTIONS){
    const a=source.animationAliases?.[k];
    aliases[k]=Array.isArray(a)?a.filter(n=>typeof n==='string'&&n.length<=70&&/^[\w .|:()\[\]-]+$/.test(n)).slice(0,12):DEFAULT_ANIMATIONS[k];
    if(!aliases[k].includes(k))aliases[k].unshift(k);
  }
  return {models, fallback:DEFAULT_AVATAR_SRC, animationAliases:aliases};
}
export function animationNamesFor(action,aliases={}){
  const wanted=AVATAR_ACTIONS.includes(action)?action:'idle';
  return [...new Set([wanted,...(aliases[wanted]||[]),...(wanted==='run'?[...aliases.walk||[]]:[])])];
}
export function matchAnimationName(clipNames,action,aliases){
  const names=[...clipNames];
  const variants=animationNamesFor(action,aliases);
  for(const wanted of variants){const found=names.find(n=>n.toLowerCase()===wanted.toLowerCase());if(found)return found;}
  // Some licensed assets use prefixes e.g. Armature|Idle.
  for(const wanted of variants){const found=names.find(n=>/(?:^|[|:._ -])([^|:._ -]+)$/i.exec(n)?.[1]?.toLowerCase()===wanted.toLowerCase());if(found)return found;}
  // Do not run the file's first clip as Idle: it may be Dance, Walk, or another unrelated action.
  return null;
}
