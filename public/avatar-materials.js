import {AVATAR_PALETTES,normalizeAvatarProfile} from './avatar-profile.js';
const materialMap={Skin:'skin',Hair:'hair',Outfit:'outfit',Pants:'pants',Shoes:'shoes'};
const HAIR_GROUPS={
  short:['HairQuiff','HairShortL','HairShortR'],
  bangs:['HairBangs','HairBangsLeft','HairBangsRight'],
  long:['HairLong','HairLongL','HairLongR','HairBangsLeft','HairBangsRight'],
  ponytail:['HairPonytail','HairPonytie','HairQuiff'],
  curly:['HairCurly0','HairCurly1','HairCurly2','HairCurly3','HairCurly4','HairCurly5'],
};
const ACCESSORIES={glasses:['GlassesBridge','GlassesL','GlassesR'],cap:['CapBrim','CapCrown'],necklace:['NecklaceChain','NecklaceCharm']};
const OUTFITS={jacket:'StyleJacket',hoodie:'StyleHoodie',formal:'StyleFormal'};
const EXPRESSIONS={smile:['SmileMouth'],cool:['CoolMouth'],joy:['JoyMouth','Teeth']};
const named=(dictionary,key)=>dictionary[key]??[];
export function isAvatarPartVisible(name,profile){
  if(name==='HairCap')return profile.accessory!=='cap';
  if(name.startsWith('Hair')&&!['HairCap'].includes(name)){
    return profile.accessory!=='cap'&&named(HAIR_GROUPS,profile.hairStyle).includes(name);
  }
  if(name.startsWith('Glasses')||name==='CapBrim'||name==='CapCrown'||name.startsWith('Necklace')){
    return named(ACCESSORIES,profile.accessory).includes(name);
  }
  if(name.startsWith('Style')){
    return !!OUTFITS[profile.outfitStyle]&&name.startsWith(OUTFITS[profile.outfitStyle]);
  }
  if(['SmileMouth','CoolMouth','JoyMouth','Teeth'].includes(name)){
    return named(EXPRESSIONS,profile.expression).includes(name);
  }
  return true;
}
export function applyAvatarAppearance(model,rawProfile,THREE){
  const profile=normalizeAvatarProfile(rawProfile);
  model.traverse(obj=>{
    if(!obj.isMesh)return;
    if(!obj.userData.avatarMaterialCloned){obj.material=obj.material.clone();obj.userData.avatarMaterialCloned=true;}
    const key=materialMap[obj.material.name];
    if(key)obj.material.color.setHex(AVATAR_PALETTES[key][profile[key]]);
    obj.visible=isAvatarPartVisible(obj.name,profile);
  });
  const width={slim:.89,regular:1,broad:1.12}[profile.build];
  model.scale.set(width,1,1);
  const mic=model.getObjectByName('Mic');if(mic)mic.visible=false;
  let phones=model.getObjectByName('AvatarHeadphones');
  if(!phones){
    const head=model.getObjectByName('Head');
    if(head){
      phones=new THREE.Group();phones.name='AvatarHeadphones';
      const mat=new THREE.MeshStandardMaterial({color:0xd3c4ff,metalness:.48,roughness:.28});
      const band=new THREE.Mesh(new THREE.TorusGeometry(.35,.036,10,32,Math.PI),mat);
      band.position.set(0,.10,.01);phones.add(band);
      for(const x of [-1,1]){
        const ear=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),mat);
        ear.position.set(x*.37,.005,.02);ear.scale.set(.085,.18,.16);phones.add(ear);
      }
      head.add(phones);
    }
  }
  if(phones)phones.visible=profile.accessory==='headphones';
  return profile;
}
