// Shared, pure avatar interaction coordinates; units are metres in the Three.js room.
// Every stand position is near the same sofa but outside the sofa/table collision zones.
// The seat positions and stand anchors must remain consistent with scene.js sofa geometry.
export const SOFA_SEATS = Object.freeze([
  Object.freeze({seat: Object.freeze([-4.7, 1.27, -0.10]), stand: Object.freeze([-4.04, 1.68, -0.10]), yaw: Math.PI / 2}),
  Object.freeze({seat: Object.freeze([ 4.7, 1.27, -0.10]), stand: Object.freeze([ 4.04, 1.68, -0.10]), yaw: -Math.PI / 2}),
  Object.freeze({seat: Object.freeze([-3.35,1.27, 3.48]), stand: Object.freeze([-3.35,1.68, 1.62]), yaw: 0}),
  Object.freeze({seat: Object.freeze([ 3.35,1.27, 3.48]), stand: Object.freeze([ 3.35,1.68, 1.62]), yaw: 0}),
]);

export function getSofaSeat(index) {
  return Number.isInteger(index) ? (SOFA_SEATS[index] ?? null) : null;
}

// Posed locally relative to torso. Forward is negative Z.
// This forms a genuinely bent right elbow: wrist is in front of and below the mouth,
// with the microphone grille lifted to the lips rather than pointing backwards.
export const SINGING_ARM = Object.freeze({
  shoulder: Object.freeze([0.37, 0.57, 0]),
  elbow: Object.freeze([0.42, 0.37, -0.14]),
  wrist: Object.freeze([0.24, 0.47, -0.33]),
  micGrilleHeight: 0.205,
});

// Collision footprint matches the primitive room furniture in scene.js.
// Keep this in one place so seat stand-up anchors can be regression-tested.
const OBSTACLES = Object.freeze([
  [-7, -4.55, -2.85, 2.5], [4.55, 7, -2.85, 2.5],
  [-6.15, -1.65, 2.45, 4.25], [1.65, 6.15, 2.45, 4.25],
  [-1.95, 1.95, 1.35, 3.22], [-4.95, -3.4, -5.45, -4.1],
  [3.4, 4.95, -5.45, -4.1],
]);
export function isWalkingPositionBlocked(x, z) {
  if(!Number.isFinite(x) || !Number.isFinite(z))return true;
  if(x < -6.73 || x > 6.73 || z < -4.35 || z > 6.15)return true;
  return OBSTACLES.some(([x0,x1,z0,z1])=>x>x0-.32&&x<x1+.32&&z>z0-.32&&z<z1+.32);
}

export function standFromSofa(index, position) {
  const sofa=getSofaSeat(index);
  if(sofa)return [...sofa.stand];
  // When the seat index is unknown, never teleport to a default spawn.
  return [position[0],1.68,position[2]];
}
