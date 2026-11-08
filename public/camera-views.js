// One source of truth for every camera shown in the room header and the fullscreen HUD.
export const CAMERA_VIEW_ORDER = Object.freeze([
  'front', 'wide', 'orbit', 'walk', 'follow', 'tv', 'cinematic'
]);

export const CAMERA_VIEW_LABELS = Object.freeze({
  front: 'Sân khấu',
  wide: 'Toàn phòng',
  orbit: 'Xoay 360°',
  walk: 'Góc mắt',
  follow: 'Theo nhân vật',
  tv: 'Xem TV',
  cinematic: 'Cinematic'
});

export function nextCameraView(current, direction = 1) {
  const index = CAMERA_VIEW_ORDER.indexOf(current);
  if (index === -1) return CAMERA_VIEW_ORDER[0];
  const step = direction < 0 ? -1 : 1;
  return CAMERA_VIEW_ORDER[(index + step + CAMERA_VIEW_ORDER.length) % CAMERA_VIEW_ORDER.length];
}

// Avoid stealing keyboard input (e.g. typing "v" in chat or Ctrl+V to paste).
export function isCameraViewShortcut(event, blocked = false) {
  if (blocked || event.code !== 'KeyV' || event.repeat || event.ctrlKey || event.altKey || event.metaKey) return false;
  const target = event.target;
  if (target?.isContentEditable) return false;
  if (target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"]')) return false;
  return true;
}
