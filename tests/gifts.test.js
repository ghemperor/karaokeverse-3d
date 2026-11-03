import test from 'node:test';
import assert from 'node:assert/strict';
import { GIFTS, GIFT_BY_ID } from '../public/gift-data.js';
import { createGifts, sendGift, publicGifts, memberLeavesGifts, GIFT_COOLDOWN_MS, GIFT_HISTORY_LIMIT } from '../lib/gifts.js';
const users=new Map([['a',{id:'a',name:'Người gửi'}],['b',{id:'b',name:'Bạn hát'}],['c',{id:'c',name:'Bạn xem'}]]);
const id=()=>`gift-uuid`;
test('catalog has unique safe gift identifiers and icons',()=>{
  assert.equal(GIFTS.length,6);
  assert.equal(new Set(GIFTS.map(g=>g.id)).size,GIFTS.length);
  for(const g of GIFTS){assert.equal(GIFT_BY_ID.get(g.id),g);assert.match(g.id,/^[a-z]+$/)}
});
test('server populates sender and recipient names; public state excludes cooldown internals',()=>{
  const result=sendGift(createGifts(),users.get('a'),users.get('b'),'rose',users,10000,id);
  assert.equal(result.ok,true);assert.deepEqual(result.gift,{id:'gift-uuid',giftId:'rose',fromId:'a',fromName:'Người gửi',toId:'b',toName:'Bạn hát',at:10000});
  assert.equal(result.state.counts.b,1);
  assert.deepEqual(publicGifts(result.state),{recent:[result.gift],counts:{b:1}});
  assert.equal(publicGifts(result.state).lastSentAt,undefined);
});
test('cannot gift oneself, strangers, missing users, or invalid catalog item',()=>{
  const state=createGifts();
  for(const [recipient,gift] of [[users.get('a'),'rose'],[{id:'hack',name:'Intruder'},'rose'],[users.get('b'),'fake'],[undefined,'crown']]){
    assert.equal(sendGift(state,users.get('a'),recipient,gift,users,10000).ok,false);
  }
  assert.equal(sendGift(state,{id:'hack',name:'X'},users.get('b'),'rose',users,10000).ok,false);
  assert.deepEqual(state,createGifts());
});
test('rate limit is applied on server for each sender, and counts update only on success',()=>{
  let state=createGifts();
  const one=sendGift(state,users.get('a'),users.get('b'),'heart',users,5000);assert.ok(one.ok);state=one.state;
  assert.equal(sendGift(state,users.get('a'),users.get('b'),'crown',users,5000+GIFT_COOLDOWN_MS-1).ok,false);
  const two=sendGift(state,users.get('a'),users.get('c'),'crown',users,5000+GIFT_COOLDOWN_MS);assert.ok(two.ok);state=two.state;
  assert.equal(state.counts.b,1);assert.equal(state.counts.c,1);
  assert.ok(sendGift(state,users.get('b'),users.get('a'),'stars',users,5001).ok);
});
test('history remains bounded for long-running rooms',()=>{
  let state=createGifts();
  for(let i=0;i<GIFT_HISTORY_LIMIT+12;i++){
    const r=sendGift(state,users.get('a'),users.get('b'),'disco',users,10000+i*GIFT_COOLDOWN_MS,()=>String(i));
    assert.ok(r.ok);state=r.state;
  }
  assert.equal(state.recent.length,GIFT_HISTORY_LIMIT);
  assert.equal(state.recent[0].id,'12');
  assert.equal(state.counts.b,GIFT_HISTORY_LIMIT+12);
});
test('leaving a room removes the departing sender cooldown only',()=>{
  const r=sendGift(createGifts(),users.get('a'),users.get('b'),'confetti',users,3000);
  const cleaned=memberLeavesGifts(r.state,'a');
  assert.equal(cleaned.lastSentAt.a,undefined);
  assert.equal(cleaned.recent.length,1);
  assert.equal(cleaned.counts.b,1);
});
