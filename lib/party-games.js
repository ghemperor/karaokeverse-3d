// Server-authoritative party mini-games. Pure functions allow deterministic tests.
import crypto from 'node:crypto';

import { CHALLENGES } from '../public/party-data.js';
export { CHALLENGES };
export const CATEGORIES = Object.freeze(['all', 'fun', 'duet', 'sing']);
export const MAX_VOTE_MS = 60_000;
export const WHEEL_MS = 5_200;

export function createPartyGames() {
  return { spin: null, poll: { id: null, status: 'idle', startedAt: null, endsAt: null, closedAt: null, choices: [], votes: {} }, lastPass: null };
}
export function startSpin(party, userIds, category = 'all', now = Date.now(), randInt = crypto.randomInt) {
  if (!CATEGORIES.includes(category)) return { ok: false, error: 'Chủ đề thử thách không hợp lệ.' };
  const people = [...new Set(userIds)].filter(id => typeof id === 'string' && id.length);
  if (people.length === 0) return { ok: false, error: 'Chưa có người chơi để quay.' };
  if (party.spin && now < party.spin.endsAt) return { ok: false, error: 'Vòng quay đang chạy.' };
  const deck = CHALLENGES.filter(c => category === 'all' || c.category === category);
  const winnerIndex = randInt(0, people.length);
  const challenge = deck[randInt(0, deck.length)];
  const spin = {
    id: crypto.randomUUID(), startedAt: now, endsAt: now + WHEEL_MS, people,
    winnerId: people[winnerIndex], winnerIndex, challengeId: challenge.id, category,
  };
  return { ok: true, party: { ...party, spin } };
}
export function passStage(performance, fromId, toId, isHost, userIds) {
  if (!userIds.includes(toId)) return { ok: false, error: 'Thành viên này không còn trong phòng.' };
  if (!isHost && performance.singerId !== fromId)
    return { ok: false, error: 'Chỉ chủ phòng hoặc người đang hát được truyền micro.' };
  if (toId === performance.singerId) return { ok: false, error: 'Người này đang giữ lượt hát.' };
  return { ok: true, performance: { singerId: toId, queue: performance.queue.filter(id => id !== toId) } };
}
export function openPoll(party, userIds, now = Date.now()) {
  const choices = [...new Set(userIds)].filter(Boolean);
  if (choices.length < 2) return { ok: false, error: 'Cần ít nhất 2 người để bình chọn.' };
  if (party.poll?.status === 'open' && now < party.poll.endsAt)
    return { ok: false, error: 'Đang có lượt bình chọn.' };
  return { ok: true, party: { ...party, poll: {
    id: crypto.randomUUID(), status: 'open', startedAt: now, endsAt: now + MAX_VOTE_MS,
    closedAt: null, choices, votes: {},
  } } };
}
export function castVote(party, voterId, targetId, userIds, now = Date.now()) {
  const poll = party.poll;
  if (!poll || poll.status !== 'open' || now >= poll.endsAt)
    return { ok: false, error: 'Lượt bình chọn đã kết thúc.' };
  if (!userIds.includes(voterId) || !userIds.includes(targetId) || !poll.choices.includes(targetId))
    return { ok: false, error: 'Người chơi không hợp lệ.' };
  if (voterId === targetId) return { ok: false, error: 'Bạn không thể bình chọn chính mình.' };
  if (Object.hasOwn(poll.votes, voterId)) return { ok: false, error: 'Bạn đã bình chọn rồi.' };
  return { ok: true, party: { ...party, poll: { ...poll, votes: { ...poll.votes, [voterId]: targetId } } } };
}
export function closePoll(party, now = Date.now()) {
  if (party.poll?.status !== 'open') return { ok: false, error: 'Không có lượt bình chọn đang mở.' };
  return { ok: true, party: { ...party, poll: { ...party.poll, status: 'closed', closedAt: now } } };
}
export function publicParty(party) {
  const poll = party.poll || createPartyGames().poll;
  const counts = Object.fromEntries(poll.choices.map(id => [id, 0]));
  for (const targetId of Object.values(poll.votes)) if (Object.hasOwn(counts, targetId)) counts[targetId] += 1;
  const mostVotes = Math.max(0, ...Object.values(counts));
  return {
    spin: party.spin, lastPass: party.lastPass,
    poll: {
      id: poll.id, status: poll.status, startedAt: poll.startedAt, endsAt: poll.endsAt,
      closedAt: poll.closedAt, choices: poll.choices, counts, totalVotes: Object.keys(poll.votes).length,
      votedIds: Object.keys(poll.votes),
      winners: poll.status === 'closed' && mostVotes > 0 ? Object.keys(counts).filter(id => counts[id] === mostVotes) : [],
    },
  };
}
export function memberLeavesParty(party, userId) {
  const poll = party.poll;
  if (!poll || poll.status !== 'open') return party;
  const votes = Object.fromEntries(Object.entries(poll.votes).filter(([voter, target]) => voter !== userId && target !== userId));
  return { ...party, poll: { ...poll, choices: poll.choices.filter(id => id !== userId), votes } };
}
export function getChallenge(id) { return CHALLENGES.find(c => c.id === id) || null; }
