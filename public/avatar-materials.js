import { AVATAR_PALETTES, normalizeAvatarProfile } from './avatar-profile.js';
const materialMap={Skin:'skin',Hair:'hair',Outfit:'outfit',Pants:'pants',Shoes:'shoes'};
export function applyAvatarAppearance(model, rawProfile, THREE) {
  const profile=normalizeAvatarProfile(rawProfile);
  // Each clone owns its materials; do not mutate the cached GLB's original materials.
  model.traverse(obj=>{
    if(!obj.isMesh) return;
    if(!obj.userData.avatarMaterialCloned){
      obj.material=obj.material.clone();obj.userData.avatarMaterialCloned=true;
    }
    const key=materialMap[obj.material.name];
    if(key)obj.material.color.setHex(AVATAR_PALETTES[key][profile[key]]);
    if(obj.name==='HairLong')obj.visible=profile.hairStyle==='long';
    if(obj.name==='HairBangs')obj.visible=profile.hairStyle==='bangs';
    if(obj.name.startsWith('Glasses'))obj.visible=profile.accessory==='glasses';
  });
  const width={slim:.86,regular:1,broad:1.15}[profile.build];
  model.scale.set(width,1,1);
  const mic=model.getObjectByName('Mic');
  if(mic)mic.visible=false;
  // Headphones are geometry built from the same licensed-free primitives as the scene.
  let phones=model.getObjectByName('AvatarHeadphones');
  if(!phones){
    phones=new THREE.Group();phones.name='AvatarHeadphones';
    const head=model.getObjectByName('Head');
    if(head){
      const mat=new THREE.MeshStandardMaterial({color:0xbcb3ff,metalness:.25,roughness:.35});
      const band=new THREE.Mesh(new THREE.TorusGeometry(.34,.042,7,20,Math.PI),mat);
      band.position.set(0,.1,0);phones.add(band);
      for(const sx of [-1,1]){
        const ear=new THREE.Mesh(new THREE.BoxGeometry(.09,.20,.18),mat);
        ear.position.set(sx*.35,0,0);phones.add(ear);
      }
      head.add(phones);
    }
  }
  phones.visible=profile.accessory==='headphones';
  return profile;
}
