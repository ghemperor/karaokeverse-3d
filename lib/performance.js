// Pure server-side stage rotation; each change produces a fresh snapshot.
export function createPerformance(){return {singerId:null,queue:[]};}
export function requestPerformance(perf,userId,limit=8){
  if(perf.singerId===userId || perf.queue.includes(userId))
    return {ok:false,error:'Bạn đã có trong danh sách hát.'};
  if(perf.queue.length>=limit)
    return {ok:false,error:'Hàng chờ đã đầy.'};
  if(!perf.singerId)return {ok:true,singing:true,performance:{singerId:userId,queue:[...perf.queue]}};
  return {ok:true,singing:false,performance:{singerId:perf.singerId,queue:[...perf.queue,userId]}};
}
export function leavePerformance(perf,userId){
  const queue=perf.queue.filter(id=>id!==userId);
  if(perf.singerId!==userId)return {singerId:perf.singerId,queue};
  return {singerId:queue[0]||null,queue:queue.slice(1)};
}
export function nextPerformance(perf){
  return {singerId:perf.queue[0]||null,queue:perf.queue.slice(1)};
}
