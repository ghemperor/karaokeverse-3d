// Versioned, allowlisted avatar profile shared by browser and Render backend.
// Visual choices are IDs only; never accept client URLs, shader code or arbitrary colors.
export const AVATAR_PALETTES = Object.freeze({
  skin: Object.freeze({porcelain:0xffe1d0,warm:0xf1bd9a,bronze:0xcc906e,deep:0x8d5945,golden:0xe8ab7f,olive:0xb98161,espresso:0x6a4137}),
  hair: Object.freeze({ink:0x252137,chocolate:0x654537,blonde:0xe4b976,pink:0xf292c9,blue:0x68bcf3,plum:0x6b3b69,silver:0xc6cfdb,copper:0xb86843,mint:0x6ed4bd}),
  outfit: Object.freeze({violet:0x995fe5,rose:0xe46d9a,sky:0x50ace5,mint:0x54cfb0,amber:0xf2b45f,black:0x313448,cream:0xe7d9bf,scarlet:0xb83c58,midnight:0x333e7a}),
  pants: Object.freeze({charcoal:0x2b2b3d,navy:0x293b69,cream:0xdad0bd,denim:0x6083ac,black:0x1c1c28,sand:0xa18b71}),
  shoes: Object.freeze({white:0xf3f1ff,black:0x292534,pink:0xffaccf,cream:0xe8d6c1,sky:0xa6d8f2}),
});
export const AVATAR_CHOICES = Object.freeze({
  hairStyle:Object.freeze(['short','bangs','long','ponytail','curly']),
  accessory:Object.freeze(['none','glasses','headphones','cap','necklace']),
  build:Object.freeze(['regular','slim','broad']),
  outfitStyle:Object.freeze(['jacket','hoodie','tee','formal']),
  expression:Object.freeze(['smile','cool','joy']),
});
export const DEFAULT_AVATAR_PROFILE = Object.freeze({
  skin:'warm',hair:'ink',outfit:'violet',pants:'charcoal',shoes:'white',
  hairStyle:'short',accessory:'none',build:'regular',outfitStyle:'jacket',expression:'smile',
});
export const AVATAR_EMOTES = Object.freeze(['stand','dance','clap','wave','cheer','bow','heart']);
export function normalizeAvatarProfile(input) {
  if(!input||typeof input!=='object'||Array.isArray(input))input={};
  const safe={};
  for(const key of Object.keys(AVATAR_PALETTES))
    safe[key]=Object.hasOwn(AVATAR_PALETTES[key],input[key])?input[key]:DEFAULT_AVATAR_PROFILE[key];
  for(const [key,values] of Object.entries(AVATAR_CHOICES))
    safe[key]=values.includes(input[key])?input[key]:DEFAULT_AVATAR_PROFILE[key];
  return safe;
}
export function profilesEqual(a,b){
  return Object.keys(DEFAULT_AVATAR_PROFILE).every(k=>a?.[k]===b?.[k]);
}
export const AVATAR_PRESETS=Object.freeze([
  {id:'popstar',label:'POP STAR',subtitle:'Neon • sân khấu',profile:{outfit:'violet',pants:'charcoal',shoes:'white',hair:'pink',hairStyle:'long',accessory:'headphones',outfitStyle:'jacket',expression:'joy'}},
  {id:'chill',label:'CHILL NIGHT',subtitle:'Tự nhiên • thoải mái',profile:{outfit:'mint',pants:'denim',shoes:'cream',hair:'chocolate',hairStyle:'short',accessory:'none',outfitStyle:'hoodie',expression:'smile'}},
  {id:'vip',label:'VIP LOUNGE',subtitle:'Thanh lịch • tinh tế',profile:{outfit:'black',pants:'black',shoes:'white',hair:'ink',hairStyle:'bangs',accessory:'glasses',outfitStyle:'formal',expression:'cool'}},
  {id:'retro',label:'RETRO BEAT',subtitle:'Nổi bật • cá tính',profile:{outfit:'amber',pants:'navy',shoes:'pink',hair:'copper',hairStyle:'curly',accessory:'cap',outfitStyle:'tee',expression:'joy'}},
]);
