// Pure gift state management. All sender IDs, names and timestamps originate at the server.
import crypto from 'node:crypto';
import { GIFT_BY_ID } from '../public/gift-data.js';

export const GIFT_COOLDOWN_MS = 1600;
export const GIFT_HISTORY_LIMIT = 24;

export function createGifts() {
  return { recent: [], counts: {}, lastSentAt: {} };
}
export function sendGift(state, sender, recipient, giftId, members, now = Date.now(), makeId = crypto.randomUUID) {
  if (!sender?.id || !recipient?.id || !members.has(sender.id) || !members.has(recipient.id))
    return {ok:false,error:'Người gửi hoặc người nhận không còn trong phòng.'};
  if (sender.id === recipient.id) return {ok:false,error:'Hãy gửi quà cho một người bạn khác nhé.'};
  if (!GIFT_BY_ID.has(giftId)) return {ok:false,error:'Món quà không hợp lệ.'};
  const previous = state.lastSentAt[sender.id];
  if (Number.isFinite(previous) && now - previous < GIFT_COOLDOWN_MS)
    return {ok:false,error:'Hãy đợi một chút rồi gửi món quà tiếp theo.'};
  const gift = {
    id: makeId(), giftId, fromId: sender.id, fromName: sender.name,
    toId: recipient.id, toName: recipient.name, at: now,
  };
  return {ok:true, gift, state: {
    recent:[...state.recent, gift].slice(-GIFT_HISTORY_LIMIT),
    counts:{...state.counts,[recipient.id]:(state.counts[recipient.id]||0)+1},
    lastSentAt:{...state.lastSentAt,[sender.id]:now},
  }};
}
export function publicGifts(state) {
  return {recent:state.recent, counts:state.counts};
}
export function memberLeavesGifts(state, userId) {
  const { [userId]: unused, ...remainingSent } = state.lastSentAt;
  // Keep recent messages and counts as in-room memories. They are bounded by GIFT_HISTORY_LIMIT.
  return {...state,lastSentAt:remainingSent};
}
