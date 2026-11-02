// Shared, bounded player position and animation. Never trust coordinates from sockets.
export const POSES = Object.freeze(['stand', 'sit', 'dance', 'clap', 'wave', 'sing']);
export function cleanPosition(input) {
  if (!input || typeof input !== 'object') return null;
  const x = Number(input.x), z = Number(input.z), yaw = Number(input.yaw);
  if (![x,z,yaw].every(Number.isFinite)) return null;
  return {
    x: Math.max(-6.73, Math.min(6.73, x)),
    z: Math.max(-4.35, Math.min(6.15, z)),
    yaw: Math.atan2(Math.sin(yaw), Math.cos(yaw)),
    pose: POSES.includes(input.pose) ? input.pose : 'stand',
  };
}
