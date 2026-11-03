// Small dependency-free 2D party wheel, drawn on canvas above the Three.js room.
export function endRotationDegrees(winnerIndex, numberOfPeople, turns = 6) {
  const count = Math.max(1, numberOfPeople | 0);
  const selected = Math.max(0, Math.min(count - 1, winnerIndex | 0));
  return turns * 360 - (selected + 0.5) * (360 / count);
}
export function paintWheel(canvas, names, finishAngleDegrees = 0) {
  if (!canvas) return;
  const dpr = Math.min(2, typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1);
  const size = 280;
  canvas.width = size * dpr; canvas.height = size * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  const people = names.length ? names : ['Vào phòng để chơi'];
  const count = people.length;
  const center = size / 2, r = 128, slice = Math.PI * 2 / count;
  const colors = ['#7c4af4', '#d751b2', '#2e94d5', '#31a8a4', '#f49c4b', '#705ddd', '#dd647b', '#4676c0'];
  for (let i = 0; i < count; i++) {
    const a = -Math.PI / 2 + i * slice;
    const b = a + slice;
    ctx.beginPath(); ctx.moveTo(center,center); ctx.arc(center,center,r,a,b); ctx.closePath();
    ctx.fillStyle = colors[i % colors.length]; ctx.fill();
    ctx.strokeStyle = '#ffffff4a'; ctx.lineWidth = 1.6; ctx.stroke();
    const mid = (a+b)/2;
    ctx.save();ctx.translate(center + Math.cos(mid)*r*0.64,center + Math.sin(mid)*r*0.64);
    ctx.rotate(-finishAngleDegrees * Math.PI / 180);
    // Keep names upright even as the wheel itself spins.
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='800 12px system-ui, sans-serif';
    ctx.shadowColor='#1e1037'; ctx.shadowBlur=3;ctx.fillStyle='#fff';
    const name = String(people[i] || '?');
    ctx.fillText(name.length > 13 ? name.slice(0,12)+'…' : name,0,0,80);
    ctx.restore();
  }
  ctx.beginPath();ctx.arc(center,center,26,0,Math.PI*2);ctx.fillStyle='#1a1235';ctx.fill();
  ctx.strokeStyle='#fff9';ctx.lineWidth=4;ctx.stroke();
  ctx.font='24px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🎤',center,center+1);
}
