import express from 'express';
import http from 'node:http';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import { youtubeId, cleanName, cleanText, cleanRoomCode, cleanAvatar } from './lib/validation.js';
import { cleanPosition } from './lib/position.js';
import { createWorld, updateWorld, cleanEmote } from './lib/world.js';
import { createPerformance, requestPerformance, leavePerformance, nextPerformance } from './lib/performance.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 40_000,
  cors: { origin: false },
});
const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const rooms = new Map();
const MAX_PEOPLE = 8;
const MAX_QUEUE = 40;

app.disable('x-powered-by');
app.use(express.static(join(ROOT, 'public'), {
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) res.set('Cache-Control', 'no-store');
  },
}));
app.get('/health', (req, res) => res.json({ ok: true, rooms: rooms.size, uptimeSeconds: Math.round(process.uptime()) }));
app.get('/config', (req, res) => {
  const iceServers = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
  if (process.env.TURN_URL && process.env.TURN_USERNAME && process.env.TURN_PASSWORD) {
    iceServers.push({ urls: process.env.TURN_URL.split(',').map(s => s.trim()), username: process.env.TURN_USERNAME, credential: process.env.TURN_PASSWORD });
  }
  res.set('Cache-Control', 'no-store').json({ iceServers, maxPeople: MAX_PEOPLE });
});
app.get('*', (req, res) => res.sendFile(join(ROOT, 'public/index.html')));


function codeNew() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let tries = 0; tries < 100; tries++) {
    let code = '';
    for (let i = 0; i < 6; i++) code += alphabet[crypto.randomInt(0, alphabet.length)];
    if (!rooms.has(code)) return code;
  }
  throw new Error('Không thể tạo phòng mới');
}
function serialize(room) {
  return {
    code: room.code, hostId: room.hostId,
    users: [...room.users.values()],
    queue: room.queue, player: room.player,
    chat: room.chat.slice(-25),
    world: room.world, performance: room.performance,
    createdAt: room.createdAt,
  };
}
function broadcastRoom(room) { io.to(room.code).emit('room:state', serialize(room)); }
function leave(socket) {
  const code = socket.data.room;
  if (!code) return;
  socket.leave(code);
  socket.data.room = null;
  const room = rooms.get(code);
  if (!room) return;
  room.users.delete(socket.id);
  room.performance = leavePerformance(room.performance, socket.id);
  socket.to(code).emit('user:left', { id: socket.id });
  if (!room.users.size) { rooms.delete(code); return; }
  if (room.hostId === socket.id) room.hostId = room.users.keys().next().value;
  broadcastRoom(room);
}
function getRoom(socket) {
  const room = rooms.get(socket.data.room);
  return room?.users.has(socket.id) ? room : null;
}
function joinRoom(socket, room, details = {}) {
  if (!details || typeof details !== 'object') details = {};
  leave(socket);
  if (room.users.size >= MAX_PEOPLE) return { ok: false, error: 'Phòng đã đủ 8 người.' };
  const user = {
    id: socket.id, name: cleanName(details.name), avatar: cleanAvatar(details.avatar),
    muted: true, joinedAt: Date.now(), pos:null,
  };
  room.users.set(socket.id, user);
  socket.data.room = room.code;
  socket.data.lastChatAt = 0;
  socket.data.lastMoveAt = 0;
  socket.join(room.code);
  socket.to(room.code).emit('user:joined', user);
  broadcastRoom(room);
  return { ok: true, room: serialize(room), myId: socket.id };
}

io.on('connection', (socket) => {
  socket.on('room:create', (details, ack) => {
    if (typeof ack !== 'function') return;
    try {
      const code = codeNew();
      const room = {
        code, hostId: socket.id, users: new Map(), queue: [], chat: [],
        world: createWorld(), performance: createPerformance(),
        player: { videoId: null, playing: false, position: 0, updatedAt: Date.now() },
        createdAt: Date.now(),
      };
      rooms.set(code, room);
      ack(joinRoom(socket, room, details));
    } catch { ack({ ok: false, error: 'Không thể tạo phòng. Thử lại nhé.' }); }
  });
  socket.on('room:join', (details, ack) => {
    if (typeof ack !== 'function') return;
    const room = rooms.get(cleanRoomCode(details?.code));
    if (!room) return ack({ ok: false, error: 'Không tìm thấy phòng. Kiểm tra lại mã phòng nhé.' });
    if (room.users.size >= MAX_PEOPLE) return ack({ ok: false, error: 'Phòng đã đủ 8 người.' });
    ack(joinRoom(socket, room, details));
  });
  socket.on('room:leave', () => leave(socket));
  socket.on('user:mic', (payload) => {
    const room = getRoom(socket); if (!room) return;
    const user = room.users.get(socket.id);
    user.muted = !(payload?.enabled === true);
    io.to(room.code).emit('user:updated', user);
  });
  socket.on('user:move', (payload) => {
    const room=getRoom(socket);if(!room)return;
    const now=Date.now();if(now-(socket.data.lastMoveAt||0)<90)return;
    const pos=cleanPosition(payload);if(!pos)return;
    socket.data.lastMoveAt=now;
    room.users.get(socket.id).pos=pos;
    socket.to(room.code).emit('user:moved',{id:socket.id,pos});
  });
  socket.on('world:action', (payload, ack) => {
    const room = getRoom(socket);
    if (!room) return ack?.({ ok: false, error: 'Bạn chưa tham gia phòng.' });
    const now = Date.now();
    if (now - (socket.data.lastWorldAt || 0) < 260) return ack?.({ ok: false, error: 'Thao tác quá nhanh.' });
    const updated = updateWorld(room.world, payload?.action);
    if (!updated) return ack?.({ ok: false, error: 'Vật thể không hỗ trợ tương tác.' });
    socket.data.lastWorldAt = now;
    room.world = updated;
    io.to(room.code).emit('world:state', { world: updated, by: socket.id });
    ack?.({ ok: true, world: updated });
  });
  socket.on('user:emote', (payload, ack) => {
    const room = getRoom(socket);
    if (!room) return ack?.({ ok: false, error: 'Bạn chưa tham gia phòng.' });
    const pose = cleanEmote(payload?.pose);
    if (!pose) return ack?.({ ok: false, error: 'Hoạt ảnh không hợp lệ.' });
    const now = Date.now();
    if (now - (socket.data.lastEmoteAt || 0) < 320) return;
    socket.data.lastEmoteAt = now;
    const user = room.users.get(socket.id);
    const old = user.pos || { x: 0, z: 4.95, yaw: 0, pose: 'stand' };
    user.pos = { ...old, pose };
    io.to(room.code).emit('user:moved', { id: socket.id, pos: user.pos });
    ack?.({ ok: true });
  });
  socket.on('performance:request', (_, ack) => {
    const room = getRoom(socket);
    if (!room) return ack?.({ ok: false, error: 'Bạn chưa vào phòng.' });
    const result = requestPerformance(room.performance,socket.id,MAX_PEOPLE);
    if(!result.ok)return ack?.({ok:false,error:result.error});
    room.performance=result.performance;
    broadcastRoom(room);
    ack?.({ok:true,singing:result.singing});
  });
  socket.on('performance:leave', (_, ack) => {
    const room = getRoom(socket);
    if (!room) return ack?.({ ok: false });
    room.performance=leavePerformance(room.performance,socket.id);
    broadcastRoom(room);
    ack?.({ ok: true });
  });
  socket.on('performance:next', (_, ack) => {
    const room = getRoom(socket);
    if (!room || room.hostId !== socket.id)
      return ack?.({ ok: false, error: 'Chỉ chủ phòng được chuyển lượt.' });
    room.performance=nextPerformance(room.performance);
    broadcastRoom(room);
    ack?.({ ok: true });
  });
  socket.on('reaction:send', (payload) => {
    const room = getRoom(socket); if (!room) return;
    const emoji = payload?.emoji;
    if (!['👏','❤️','🔥','🎉','🎤'].includes(emoji)) return;
    const now = Date.now();
    if (now - (socket.data.lastReactionAt || 0) < 500) return;
    socket.data.lastReactionAt = now;
    io.to(room.code).emit('reaction:show', { id: socket.id, emoji });
  });
  socket.on('chat:send', (message, ack) => {
    const room = getRoom(socket); if (!room) return;
    const now = Date.now();
    if (now - socket.data.lastChatAt < 600) return ack?.({ ok: false, error: 'Gửi tin nhắn chậm lại một chút.' });
    const text = cleanText(message); if (!text) return;
    socket.data.lastChatAt = now;
    const msg = { id: crypto.randomUUID(), userId: socket.id, name: room.users.get(socket.id).name, text, at: now };
    room.chat.push(msg);
    room.chat = room.chat.slice(-50);
    io.to(room.code).emit('chat:new', msg);
    ack?.({ ok: true });
  });
  socket.on('queue:add', (payload, ack) => {
    const room = getRoom(socket);
    if (!room) return ack?.({ ok: false, error: 'Bạn chưa vào phòng.' });
    const id = youtubeId(payload?.url);
    if (!id) return ack?.({ ok: false, error: 'Link YouTube không hợp lệ.' });
    if (room.queue.length >= MAX_QUEUE) return ack?.({ ok: false, error: 'Danh sách đã đủ 40 bài.' });
    const song = {
      id: crypto.randomUUID(), videoId: id,
      title: cleanText(payload?.title).slice(0, 90) || `Video YouTube • ${id}`,
      addedBy: room.users.get(socket.id).name,
      addedById: socket.id,
    };
    room.queue.push(song);
    if (!room.player.videoId) {
      room.player = { videoId: id, playing: false, position: 0, updatedAt: Date.now() };
    }
    broadcastRoom(room);
    ack?.({ ok: true });
  });
  socket.on('queue:remove', (payload, ack) => {
    const songId = payload?.songId;
    const room = getRoom(socket); if (!room) return;
    const song = room.queue.find(s => s.id === songId);
    if (!song || (room.hostId !== socket.id && song.addedById !== socket.id))
      return ack?.({ ok: false, error: 'Bạn không thể xóa bài hát này.' });
    room.queue = room.queue.filter(s => s.id !== songId);
    if (room.player.videoId === song.videoId && !room.queue.some(s => s.videoId === song.videoId)) {
      const first = room.queue[0];
      room.player = { videoId: first?.videoId || null, playing: false, position: 0, updatedAt: Date.now() };
    }
    broadcastRoom(room); ack?.({ ok: true });
  });
  socket.on('player:command', (payload, ack) => {
    const { type, position, videoId } = payload || {};
    const room = getRoom(socket);
    if (!room) return;
    if (room.hostId !== socket.id) return ack?.({ ok: false, error: 'Chỉ chủ phòng được điều khiển nhạc.' });
    if (!['play', 'pause', 'seek', 'next', 'select'].includes(type)) return;
    const p = room.player;
    const now = Date.now();
    const effective = Math.max(0, p.position + (p.playing ? (now - p.updatedAt) / 1000 : 0));
    if (type === 'play' && p.videoId) room.player = { ...p, playing: true, position: effective, updatedAt: now };
    if (type === 'pause') room.player = { ...p, playing: false, position: effective, updatedAt: now };
    if (type === 'seek') room.player = { ...p, position: Math.max(0, Math.min(60_000, Number(position) || 0)), updatedAt: now };
    if (type === 'next') {
      if (room.queue.length && room.queue[0].videoId === p.videoId) room.queue.shift();
      const next = room.queue[0];
      room.player = { videoId: next?.videoId || null, playing: Boolean(next), position: 0, updatedAt: now };
    }
    if (type === 'select') {
      const requested = room.queue.find((s) => s.videoId === videoId);
      if (!requested) return ack?.({ ok: false, error: 'Bài hát không có trong danh sách.' });
      room.queue = [requested, ...room.queue.filter((s) => s.id !== requested.id)];
      room.player = { videoId: requested.videoId, playing: true, position: 0, updatedAt: now };
    }
    broadcastRoom(room); ack?.({ ok: true });
  });
  socket.on('player:heartbeat', (payload) => {
    const { position, playing, videoId } = payload || {};
    const room = getRoom(socket);
    if (!room || room.hostId !== socket.id || videoId !== room.player.videoId) return;
    const value = Number(position);
    if (!Number.isFinite(value) || value < 0 || value > 60_000) return;
    room.player = { ...room.player, position: value, playing: playing === true, updatedAt: Date.now() };
    io.to(room.code).emit('player:sync', room.player);
  });
  socket.on('signal:webrtc', (payload) => {
    const { to, description, candidate } = payload || {};
    const room = getRoom(socket);
    if (!room || typeof to !== 'string' || !room.users.has(to) || to === socket.id) return;
    if (description && (!['offer', 'answer'].includes(description.type) || typeof description.sdp !== 'string' || description.sdp.length > 50000)) return;
    if (candidate && (typeof candidate.candidate !== 'string' || candidate.candidate.length > 3000)) return;
    io.to(to).emit('signal:webrtc', { from: socket.id, description, candidate });
  });
  socket.on('disconnect', () => leave(socket));
});

if (process.env.NODE_ENV !== 'test') server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎤 KaraokeVerse is running at http://localhost:${PORT}`);
});

export { app, server, rooms };
