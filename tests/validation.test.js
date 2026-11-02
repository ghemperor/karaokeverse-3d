import { test } from 'node:test';
import assert from 'node:assert/strict';
import { youtubeId, cleanName, cleanText, cleanRoomCode, cleanAvatar } from '../lib/validation.js';

test('accepts safe YouTube URLs and known URL shapes', () => {
  const id = 'dQw4w9WgXcQ';
  assert.equal(youtubeId(`https://www.youtube.com/watch?v=${id}&t=20`),id);
  assert.equal(youtubeId(`https://youtu.be/${id}?si=abc`),id);
  assert.equal(youtubeId(`https://www.youtube.com/embed/${id}`),id);
  assert.equal(youtubeId(`https://m.youtube.com/shorts/${id}`),id);
  assert.equal(youtubeId(`https://youtube.com/live/${id}`),id);
  assert.equal(youtubeId(`https://music.youtube.com/watch?v=${id}`),id);
});
test('rejects suspicious and unsupported URLs', () => {
  for (const link of [
    'not-a-url', 'https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=invalid', 'https://example.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com/redirect?v=dQw4w9WgXcQ', '',
  ]) assert.equal(youtubeId(link),null);
});
test('sanitizes user input', () => {
  assert.equal(cleanName('  An\u0000   '),'An');
  assert.equal(cleanName(''),'Khách');
  assert.equal(cleanText('Hello\u0000 there'), 'Hello there');
  assert.equal(cleanRoomCode(' ab- 3c#z9! '),'AB3CZ9');
  assert.equal(cleanAvatar(-7),0);
  assert.equal(cleanAvatar(19),7);
});
