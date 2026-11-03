import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createBattle,configureBattle,advanceBattle,castBattleVote,finishBattleVote,
 cancelBattle,memberLeavesBattle,publicBattle,isBattleActive,currentBattleSinger,BATTLE_VOTE_MS,
} from '../lib/battle.js';
const people=['a','b','c','d','e','f','g','h'];
const start=(cfg={mode:'solo',rounds:2,teamA:['a'],teamB:['b']},now=1_000)=>configureBattle(createBattle(),cfg,people,now).battle;

test('solo requires distinct members and exactly one per side',()=>{
 assert.equal(configureBattle(createBattle(),{mode:'solo',rounds:1,teamA:['a','c'],teamB:['b']},people).ok,false);
 assert.equal(configureBattle(createBattle(),{mode:'solo',rounds:1,teamA:['a'],teamB:['a']},people).ok,false);
 assert.equal(configureBattle(createBattle(),{mode:'solo',rounds:1,teamA:['a'],teamB:['intruder']},people).ok,false);
 assert.equal(configureBattle(createBattle(),{mode:'solo',rounds:1,teamA:['a'],teamB:['b']},people).ok,true);
});
test('team validates max size, rounds, identity, duplicates',()=>{
 const cfg={mode:'team',rounds:3,teamA:['a','c'],teamB:['b','d']};
 assert.equal(configureBattle(createBattle(),cfg,people).ok,true);
 assert.equal(configureBattle(createBattle(),{...cfg,rounds:6},people).ok,false);
 assert.equal(configureBattle(createBattle(),{...cfg,teamA:['a','a']},people).ok,false);
 assert.equal(configureBattle(createBattle(),{...cfg,teamA:['a','c','e','f','g']},people).ok,false);
});
test('full solo lifecycle A -> B -> vote -> result -> next round -> finish',()=>{
 let b=start();assert.equal(b.status,'performing');assert.equal(b.stage,'A');
 b=advanceBattle(b,2_000).battle;assert.equal(b.stage,'B');
 b=advanceBattle(b,3_000).battle;assert.equal(b.status,'voting');assert.equal(b.votingEndsAt,3_000+BATTLE_VOTE_MS);
 assert.equal(castBattleVote(b,'a','A',people,4_000).ok,false);
 assert.equal(castBattleVote(b,'b','A',people,4_000).ok,false);
 b=castBattleVote(b,'c','A',people,4_000).battle;
 assert.equal(castBattleVote(b,'c','B',people,4_100).ok,false);
 b=castBattleVote(b,'d','A',people,4_100).battle;
 b=castBattleVote(b,'e','B',people,4_200).battle;
 const view=publicBattle(b);assert.deepEqual(view.counts,{A:2,B:1});assert.ok(!('votes' in view));
 b=advanceBattle(b,5_000).battle;assert.equal(b.status,'result');assert.deepEqual(b.score,{A:1,B:0});
 b=advanceBattle(b,6_000).battle;assert.equal(b.roundIndex,1);assert.equal(b.stage,'A');
 b=advanceBattle(b,7_000).battle;b=advanceBattle(b,8_000).battle;
 b=castBattleVote(b,'c','B',people,9_000).battle;
 b=advanceBattle(b,10_000).battle;
 assert.deepEqual(b.score,{A:1,B:1});
 b=advanceBattle(b,11_000).battle;assert.equal(b.status,'finished');assert.equal(publicBattle(b).winnerSide,null);
 assert.equal(isBattleActive(b),false);
});
test('team mode rotates performers per round',()=>{
 let b=start({mode:'team',rounds:3,teamA:['a','c'],teamB:['b','d']});
 assert.equal(currentBattleSinger(b),'a');
 b=advanceBattle(b).battle;assert.equal(currentBattleSinger(b),'b');
 b=advanceBattle(b).battle;b=finishBattleVote(b).battle;b=advanceBattle(b).battle;
 assert.deepEqual(b.singers,{A:'c',B:'d'});
 b=advanceBattle(b).battle;b=advanceBattle(b).battle;b=finishBattleVote(b).battle;b=advanceBattle(b).battle;
 assert.deepEqual(b.singers,{A:'a',B:'b'});
});
test('vote expiration, self voters and invalid sides rejected',()=>{
 let b=start();b=advanceBattle(b,1_100).battle;b=advanceBattle(b,1_200).battle;
 assert.equal(castBattleVote(b,'c','C',people,1_300).ok,false);
 assert.equal(castBattleVote(b,'c','A',people,1_200+BATTLE_VOTE_MS).ok,false);
 assert.equal(castBattleVote(b,'outsider','A',people,1_300).ok,false);
});
test('tied votes produce half point to both sides; zero votes gives zero',()=>{
 let b=start();b=advanceBattle(b).battle;b=advanceBattle(b).battle;
 b=finishBattleVote(b).battle;assert.deepEqual(b.score,{A:0,B:0});
 b=advanceBattle(b).battle;b=advanceBattle(b).battle;b=advanceBattle(b).battle;
 b=castBattleVote(b,'c','A',people).battle;b=castBattleVote(b,'d','B',people).battle;
 b=finishBattleVote(b).battle;assert.deepEqual(b.score,{A:.5,B:.5});
});
test('prevent configuring during match, allow after cancel',()=>{
 let b=start();const cfg={mode:'solo',rounds:1,teamA:['a'],teamB:['b']};
 assert.equal(configureBattle(b,cfg,people).ok,false);
 b=cancelBattle(b).battle;assert.equal(b.status,'cancelled');
 assert.equal(configureBattle(b,cfg,people).ok,true);
});
test('disconnect rotates team singer, cancels empty team and removes votes',()=>{
 let b=start({mode:'team',rounds:2,teamA:['a','c'],teamB:['b','d']});
 b=memberLeavesBattle(b,'a');assert.equal(b.singers.A,'c');assert.equal(b.status,'performing');
 b=advanceBattle(b).battle;b=advanceBattle(b).battle;
 b=castBattleVote(b,'e','A',people).battle;
 b=memberLeavesBattle(b,'e');assert.deepEqual(publicBattle(b).counts,{A:0,B:0});
 b=memberLeavesBattle(b,'c');assert.equal(b.status,'cancelled');
});
test('public state never exposes individual vote choices',()=>{
 const b=start();assert.equal('votes' in publicBattle(b),false);
 assert.deepEqual(publicBattle(createBattle()).counts,{A:0,B:0});
});
