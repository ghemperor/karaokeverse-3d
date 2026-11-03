// Shared immutable gift catalog. These are free, cosmetic, in-room effects.
export const GIFTS = Object.freeze([
  Object.freeze({ id:'rose', icon:'🌹', label:'Hoa hồng', desc:'Gửi một đóa hoa ngọt ngào', color:'#ff699f' }),
  Object.freeze({ id:'heart', icon:'💖', label:'Tim lấp lánh', desc:'Thả tim cho giọng hát', color:'#fb69c8' }),
  Object.freeze({ id:'stars', icon:'🌟', label:'Mưa sao', desc:'Tỏa sáng trên sân khấu', color:'#fcd775' }),
  Object.freeze({ id:'confetti', icon:'🎉', label:'Pháo giấy', desc:'Khuấy động cả phòng', color:'#8dd2ff' }),
  Object.freeze({ id:'crown', icon:'👑', label:'Vương miện', desc:'Tôn vinh màn biểu diễn', color:'#ffce67' }),
  Object.freeze({ id:'disco', icon:'🪩', label:'Disco', desc:'Bật không khí party', color:'#a993ff' }),
]);
export const GIFT_BY_ID = new Map(GIFTS.map(gift => [gift.id, gift]));
