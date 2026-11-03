// Shared browser/server schema. Choices are palette IDs, never user-provided URLs or shader code.
export const AVATAR_PALETTES = Object.freeze({
  skin: Object.freeze({porcelain:0xffddc2,warm:0xf2bf99,bronze:0xc88b69,deep:0x8b5944}),
  hair: Object.freeze({ink:0x242138,chocolate:0x654537,blonde:0xe3ad61,pink:0xec83d5,blue:0x76bfea}),
  outfit: Object.freeze({violet:0x9556ef,rose:0xe75f9c,sky:0x47a6e1,mint:0x4fd4ac,amber:0xf2ae5a,black:0x30334e}),
  pants: Object.freeze({charcoal:0x232638,navy:0x273b69,cream:0xd5c5a8,denim:0x5e83a8}),
  shoes: Object.freeze({white:0xf2edfd,black:0x262437,pink:0xffa5cf}),
});
export const AVATAR_CHOICES = Object.freeze({
  hairStyle: Object.freeze(['short','bangs','long']),
  accessory: Object.freeze(['none','glasses','headphones']),
  build: Object.freeze(['regular','slim','broad']),
});
export const DEFAULT_AVATAR_PROFILE = Object.freeze({
  skin:'warm',hair:'ink',outfit:'violet',pants:'charcoal',shoes:'white',
  hairStyle:'short',accessory:'none',build:'regular',
});
export const AVATAR_EMOTES = Object.freeze(['stand','dance','clap','wave','cheer','bow','heart']);
export function normalizeAvatarProfile(input) {
  if (!input || typeof input!=='object'||Array.isArray(input)) input={};
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
