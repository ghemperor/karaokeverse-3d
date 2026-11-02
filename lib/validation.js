export function youtubeId(raw) {
  if (typeof raw !== 'string' || raw.length > 1000) return null;
  try {
    const url = new URL(raw.trim());
    const host = url.hostname.toLowerCase();
    let id = null;
    if (host === 'youtu.be' || host === 'www.youtu.be') id = url.pathname.split('/')[1];
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'www.youtube-nocookie.com', 'youtube-nocookie.com'].includes(host)) {
      if (url.pathname === '/watch') id = url.searchParams.get('v');
      else if (/^\/(shorts|embed|live)\//.test(url.pathname)) id = url.pathname.split('/')[2];
    }
    return /^[\w-]{11}$/.test(id || '') ? id : null;
  } catch { return null; }
}

export const cleanName = (name) => String(name ?? 'Khách')
  .normalize('NFKC').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 26) || 'Khách';
export const cleanText = (message) => String(message ?? '')
  .normalize('NFKC').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, 320);
export const cleanRoomCode = (code) => String(code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
export const cleanAvatar = (avatar) => Math.max(0, Math.min(7, Number(avatar) || 0));


