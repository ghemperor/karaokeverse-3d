// KaraokeVerse v1.4.3.3 - resolution budgeting and adaptive rendering.
// Pure functions: safe to test with Node.js, independent of DOM and Three.js.
export function renderPixelRatio({width, height, devicePixelRatio = 1, fullscreen = false, mobile = false, scale = 1, mode = 'auto'} = {}) {
  const w = Math.max(1, Number(width) || 1);
  const h = Math.max(1, Number(height) || 1);
  const dpr = Math.max(0.5, Math.min(4, Number(devicePixelRatio) || 1));
  const budget = mode === 'sharp'
    ? (mobile ? 1500000 : 2900000)
    : fullscreen ? (mobile ? 1050000 : 1900000) : (mobile ? 1250000 : 2100000);
  const maxRatio = mode === 'sharp' ? (mobile ? 1.45 : 1.8)
    : fullscreen ? (mobile ? 1.05 : 1.25) : (mobile ? 1.25 : 1.55);
  const desired = Math.min(dpr, maxRatio, Math.sqrt(budget / (w * h)));
  const ratio = Math.max(0.45, Math.min(dpr, desired * Math.max(0.5, Math.min(1, scale))));
  return Math.round(ratio * 100) / 100;
}

export function createAdaptiveQuality({minScale = 0.55, maxScale = 1, sampleMs = 1750} = {}) {
  let scale = maxScale, since = null, last = null, frames = 0;
  let slowWindows = 0, fastWindows = 0;
  function reset({restoreScale = false} = {}) {
    since = null; last = null; frames = 0; slowWindows = 0; fastWindows = 0;
    if (restoreScale) scale = maxScale;
  }
  return {
    get scale() { return scale; },
    reset,
    sample(now) {
      if (!Number.isFinite(now)) return null;
      if (since === null) { since = now; last = now; return null; }
      // Ignore background tab / minimized browser or unrelated long pauses.
      if (now < last || now - last > 350) { reset(); since = now; last = now; return null; }
      last = now; frames++;
      const elapsed = now - since;
      if (elapsed < sampleMs) return null;
      const fps = Math.round(frames * 1000 / elapsed);
      since = now; frames = 0;
      if (fps < 47) { slowWindows++; fastWindows = 0; }
      else if (fps > 57) { fastWindows++; slowWindows = 0; }
      else { slowWindows = 0; fastWindows = 0; }
      let changed = false;
      if (slowWindows >= 2) { const next = Math.max(minScale, Math.round((scale - 0.12) * 100) / 100); changed = next !== scale; scale = next; slowWindows = 0; }
      if (fastWindows >= 4) { const next = Math.min(maxScale, Math.round((scale + 0.06) * 100) / 100); changed = next !== scale; scale = next; fastWindows = 0; }
      return {fps, scale, changed};
    }
  };
}
