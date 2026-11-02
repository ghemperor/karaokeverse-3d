import test from 'node:test';
import assert from 'node:assert/strict';
import {createPerformance,requestPerformance,leavePerformance,nextPerformance} from '../lib/performance.js';

test('stage rotates in FIFO order and rejects duplicates',()=>{
  let performance=createPerformance();
  const first=requestPerformance(performance,'a');
  assert.equal(first.singing,true);
  performance=first.performance;
  const second=requestPerformance(performance,'b');
  assert.equal(second.singing,false);
  performance=second.performance;
  performance=requestPerformance(performance,'c').performance;
  assert.equal(requestPerformance(performance,'b').ok,false);
  assert.deepEqual(performance,{singerId:'a',queue:['b','c']});
  performance=nextPerformance(performance);
  assert.deepEqual(performance,{singerId:'b',queue:['c']});
  performance=leavePerformance(performance,'b');
  assert.deepEqual(performance,{singerId:'c',queue:[]});
  assert.deepEqual(leavePerformance(performance,'c'),createPerformance());
});
test('abandoned slots and queue limits are handled',()=>{
  const perf={singerId:'a',queue:['b','c']};
  assert.deepEqual(leavePerformance(perf,'c'),{singerId:'a',queue:['b']});
  assert.equal(requestPerformance(perf,'d',2).ok,false);
  assert.equal(perf.queue.length,2);
});
