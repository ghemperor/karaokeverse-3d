// KaraokeVerse Battle Arena v1.3: server-owned match lifecycle and ballots.
// Pure, serializable state for deterministic testing and predictable reconnects.
import crypto from 'node:crypto';

export const BATTLE_MODES = Object.freeze(['solo', 'team']);
export const BATTLE_VOTE_MS = 45_000;
export const MAX_BATTLE_ROUNDS = 5;
const LIVE_STATUSES = new Set(['performing', 'voting', 'result']);

export function createBattle() {
  return {
    id: null, mode: null, status: 'idle', rounds: 0, roundIndex: 0,
    stage: null, teams: { A: [], B: [] }, singers: { A: null, B: null },
    score: { A: 0, B: 0 }, history: [], votes: {}, votingStartedAt: null,
    votingEndsAt: null, lastResult: null, createdAt: null, updatedAt: null,
  };
}
export const isBattleActive = b => Boolean(b && LIVE_STATUSES.has(b.status));
export const currentBattleSinger = b => b?.status === 'performing' ? b.singers[b.stage] : null;

const unique = ids => Array.isArray(ids) && ids.every(id => typeof id === 'string' && id.length > 0) && new Set(ids).size === ids.length;
const selectedSinger = (roster, roundIndex) => roster[roundIndex % roster.length] ?? null;
const resultSide = ({A, B}) => A === B ? null : (A > B ? 'A' : 'B');

export function configureBattle(current, config, userIds, now = Date.now()) {
  if (isBattleActive(current)) return {ok:false,error:'Trận đấu trước chưa hoàn tất. Hãy kết thúc trận trước.'};
  const { mode, teamA, teamB } = config ?? {};
  const rounds = Number(config?.rounds);
  if (!BATTLE_MODES.includes(mode)) return {ok:false,error:'Chế độ Battle không hợp lệ.'};
  if (!Number.isInteger(rounds) || rounds < 1 || rounds > MAX_BATTLE_ROUNDS)
    return {ok:false,error:`Số vòng phải từ 1 đến ${MAX_BATTLE_ROUNDS}.`};
  if (!unique(teamA) || !unique(teamB) || !teamA.length || !teamB.length ||
      new Set([...teamA, ...teamB]).size !== teamA.length + teamB.length)
    return {ok:false,error:'Hai bên phải có người chơi khác nhau, không trùng lặp.'};
  if ([...teamA, ...teamB].some(id => !userIds.includes(id)))
    return {ok:false,error:'Có người chơi không còn ở trong phòng.'};
  if (mode === 'solo' && (teamA.length !== 1 || teamB.length !== 1))
    return {ok:false,error:'Solo Battle cần đúng một người ở mỗi bên.'};
  if (mode === 'team' && (teamA.length > 4 || teamB.length > 4))
    return {ok:false,error:'Mỗi đội có tối đa 4 người.'};
  const teams = { A: [...teamA], B: [...teamB] };
  return {ok:true,battle:{
    id:crypto.randomUUID(), mode, status:'performing', rounds, roundIndex:0,
    stage:'A',teams,singers:{A:teamA[0],B:teamB[0]},
    score:{A:0,B:0},history:[],votes:{},votingStartedAt:null,votingEndsAt:null,
    lastResult:null,createdAt:now,updatedAt:now,
  }};
}
export function finishBattleVote(battle, now = Date.now()) {
  if (battle?.status !== 'voting') return {ok:false,error:'Không có lượt bầu chọn Battle đang mở.'};
  const counts = {A:0,B:0};
  for (const side of Object.values(battle.votes)) if (side === 'A' || side === 'B') counts[side]++;
  const winner = counts.A + counts.B === 0 ? null : resultSide(counts);
  const score = {...battle.score};
  if (winner) score[winner] += 1;
  else if (counts.A + counts.B) {score.A += .5; score.B += .5;}
  const lastResult = {
    round: battle.roundIndex + 1, counts, winner, score:{...score},
    singers:{...battle.singers}, finishedAt:now,
  };
  return {ok:true,battle:{...battle,status:'result',stage:null,votingEndsAt:now,
    score,history:[...battle.history,lastResult],lastResult,updatedAt:now}};
}
export function advanceBattle(battle, now = Date.now()) {
  if (!isBattleActive(battle)) return {ok:false,error:'Không có trận đang diễn ra.'};
  if (battle.status === 'voting') return finishBattleVote(battle,now);
  if (battle.status === 'performing' && battle.stage === 'A')
    return {ok:true,battle:{...battle,stage:'B',updatedAt:now}};
  if (battle.status === 'performing' && battle.stage === 'B')
    return {ok:true,battle:{...battle,status:'voting',stage:null,votes:{},
      votingStartedAt:now,votingEndsAt:now+BATTLE_VOTE_MS,updatedAt:now}};
  if (battle.status === 'result') {
    if (battle.roundIndex + 1 >= battle.rounds)
      return {ok:true,battle:{...battle,status:'finished',stage:null,updatedAt:now}};
    const roundIndex = battle.roundIndex + 1;
    return {ok:true,battle:{...battle,status:'performing',stage:'A',roundIndex,
      singers:{A:selectedSinger(battle.teams.A,roundIndex), B:selectedSinger(battle.teams.B,roundIndex)},
      votes:{},votingStartedAt:null,votingEndsAt:null,lastResult:null,updatedAt:now}};
  }
  return {ok:false,error:'Trạng thái vòng đấu không hợp lệ.'};
}
export function castBattleVote(battle, voterId, side, userIds, now = Date.now()) {
  if (battle?.status !== 'voting' || now >= battle.votingEndsAt)
    return {ok:false,error:'Phiên bình chọn đã kết thúc.'};
  if (!['A','B'].includes(side)) return {ok:false,error:'Đội bình chọn không hợp lệ.'};
  if (!userIds.includes(voterId)) return {ok:false,error:'Bạn chưa vào phòng.'};
  // Active performers sit out this round. Teammates / spectators can vote once.
  if (Object.values(battle.singers).includes(voterId))
    return {ok:false,error:'Người vừa biểu diễn không thể bỏ phiếu ở vòng này.'};
  if (Object.hasOwn(battle.votes, voterId)) return {ok:false,error:'Bạn đã bình chọn ở vòng này.'};
  return {ok:true,battle:{...battle,votes:{...battle.votes,[voterId]:side},updatedAt:now}};
}
export function cancelBattle(battle, now = Date.now()) {
  if (!isBattleActive(battle)) return {ok:false,error:'Không có trận để hủy.'};
  return {ok:true,battle:{...battle,status:'cancelled',stage:null,updatedAt:now}};
}
export function memberLeavesBattle(battle, id, now = Date.now()) {
  if (!isBattleActive(battle)) return battle;
  const teams={A:battle.teams.A.filter(uid=>uid!==id),B:battle.teams.B.filter(uid=>uid!==id)};
  const votes=Object.fromEntries(Object.entries(battle.votes).filter(([voter])=>voter!==id));
  if (!teams.A.length || !teams.B.length)
    return {...battle,teams,votes,status:'cancelled',stage:null,updatedAt:now};
  const singers={
    A:teams.A.includes(battle.singers.A)?battle.singers.A:selectedSinger(teams.A,battle.roundIndex),
    B:teams.B.includes(battle.singers.B)?battle.singers.B:selectedSinger(teams.B,battle.roundIndex),
  };
  return {...battle,teams,singers,votes,updatedAt:now};
}
export function publicBattle(battle) {
  if (!battle) return createBattle();
  const counts={A:0,B:0};
  for (const side of Object.values(battle.votes)) if (side === 'A' || side === 'B') counts[side]++;
  return {
    id:battle.id,mode:battle.mode,status:battle.status,rounds:battle.rounds,
    roundIndex:battle.roundIndex,stage:battle.stage,teams:battle.teams,singers:battle.singers,
    score:battle.score,history:battle.history,counts,
    totalVotes:Object.keys(battle.votes).length,votedIds:Object.keys(battle.votes),
    votingStartedAt:battle.votingStartedAt,votingEndsAt:battle.votingEndsAt,
    lastResult:battle.lastResult,createdAt:battle.createdAt,updatedAt:battle.updatedAt,
    winnerSide:battle.status==='finished'?resultSide(battle.score):null,
  };
}
