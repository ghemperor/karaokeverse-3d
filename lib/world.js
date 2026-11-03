export function createWorld() {
  return { lightMode: 0, disco: true, speaker: true, door: false, party: false, revision: 0 };
}
const ACTIONS = Object.freeze(['lights', 'disco', 'speaker', 'door', 'party']);
export function updateWorld(previous, action) {
  if (!ACTIONS.includes(action)) return null;
  const next = { ...previous, revision: previous.revision + 1 };
  if (action === 'lights') next.lightMode = (previous.lightMode + 1) % 4;
  else next[action] = !previous[action];
  return next;
}
const EMOTES = Object.freeze(['stand', 'dance', 'clap', 'wave', 'cheer', 'bow', 'heart']);
export function cleanEmote(value) { return EMOTES.includes(value) ? value : null; }
