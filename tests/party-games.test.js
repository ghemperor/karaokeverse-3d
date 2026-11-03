import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPartyGames, startSpin, passStage, openPoll, castVote, closePoll,
  publicParty, memberLeavesParty, CHALLENGES,
} from '../lib/party-games.js';
import { endRotationDegrees } from '../public/party-wheel.js';

test('a game room starts without a result or active poll', () => {
  const game=createPartyGames();
  assert.equal(game.spin,null);
  assert.equal(game.poll.status,'idle');
  assert.equal(game.lastPass,null);
});
test('wheel choice comes from server-side random selector and respects deck', () => {
  const candidates=['a','b','c'];
  const picks=[2,0];
  const result=startSpin(createPartyGames(),candidates,'duet',1000,()=>picks.shift());
  assert.equal(result.ok,true);
  assert.equal(result.party.spin.winnerId,'c');
  assert.equal(result.party.spin.endsAt,6200);
  assert.equal(CHALLENGES.find(c=>c.id===result.party.spin.challengeId).category,'duet');
  assert.deepEqual(result.party.spin.people,candidates);
});
test('wheel rejects invalid category, empty room and active spin', () => {
  const state=createPartyGames();
  assert.equal(startSpin(state,['a'],'admin',1000).ok,false);
  assert.equal(startSpin(state,[],'all',1000).ok,false);
  const first=startSpin(state,['a'],'all',1000,()=>0).party;
  assert.equal(startSpin(first,['a'],'all',2000).ok,false);
  assert.equal(startSpin(first,['a'],'all',6200,()=>0).ok,true);
});
test('wheel uses a stable finish angle for selected segment', () => {
  for(let size=1;size<=8;size++)for(let index=0;index<size;index++){
    const angle=endRotationDegrees(index,size);
    const final=(angle+(index+.5)*360/size)%360;
    assert.ok(Math.abs(final)<0.00001||Math.abs(final-360)<0.00001);
  }
});
test('only host or actual singer can hand over a stage turn', () => {
  const perf={singerId:'a',queue:['b','c']};
  assert.equal(passStage(perf,'c','b',false,['a','b','c']).ok,false);
  assert.equal(passStage(perf,'a','ghost',false,['a','b','c']).ok,false);
  assert.equal(passStage(perf,'a','a',false,['a','b','c']).ok,false);
  const result=passStage(perf,'a','b',false,['a','b','c']);
  assert.deepEqual(result.performance,{singerId:'b',queue:['c']});
  assert.deepEqual(perf,{singerId:'a',queue:['b','c']});
  assert.equal(passStage(perf,'c','c',true,['a','b','c']).ok,true);
});
test('poll requires at least two users', () => {
  assert.equal(openPoll(createPartyGames(),['a']).ok,false);
  assert.equal(openPoll(createPartyGames(),['a','b']).ok,true);
});
test('one person has one ballot, cannot vote self or for outsider', () => {
  const game=openPoll(createPartyGames(),['a','b','c'],1000).party;
  assert.equal(castVote(game,'a','a',['a','b','c'],2000).ok,false);
  assert.equal(castVote(game,'a','ghost',['a','b','c'],2000).ok,false);
  const first=castVote(game,'a','b',['a','b','c'],2000);
  assert.equal(first.ok,true);
  assert.equal(castVote(first.party,'a','c',['a','b','c'],2000).ok,false);
  assert.equal(first.party.poll.votes.a,'b');
});
test('a closed poll ranks the eligible people and reports ties', () => {
  let game=openPoll(createPartyGames(),['a','b','c','d'],1000).party;
  game=castVote(game,'a','b',['a','b','c','d'],2000).party;
  game=castVote(game,'b','a',['a','b','c','d'],2000).party;
  game=castVote(game,'c','b',['a','b','c','d'],2000).party;
  assert.deepEqual(publicParty(game).poll.counts,{a:1,b:2,c:0,d:0});
  assert.equal(publicParty(game).poll.votes,undefined); // never leak ballot choices
  game=closePoll(game,3000).party;
  assert.deepEqual(publicParty(game).poll.winners,['b']);
  assert.equal(castVote(game,'d','b',['a','b','c','d'],4000).ok,false);
});
test('poll closes at deadline and cannot accept late votes', () => {
  const game=openPoll(createPartyGames(),['a','b'],1000).party;
  assert.equal(castVote(game,'a','b',['a','b'],61000).ok,false);
});
test('on disconnect remove ballots cast by and for that member', () => {
  let game=openPoll(createPartyGames(),['a','b','c'],1000).party;
  game=castVote(game,'a','b',['a','b','c'],2000).party;
  game=castVote(game,'b','c',['a','b','c'],2000).party;
  game=memberLeavesParty(game,'b');
  assert.deepEqual(game.poll.choices,['a','c']);
  assert.deepEqual(game.poll.votes,{});
  assert.deepEqual(publicParty(game).poll.counts,{a:0,c:0});
});
test('published state has no raw votes or secrets', () => {
  const data=publicParty(createPartyGames());
  assert.equal('votes' in data.poll,false);
  assert.equal(data.poll.totalVotes,0);
});
