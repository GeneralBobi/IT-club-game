// Adapted from Boran's GeneralBobi/color-cascade-game, feat/color-cascade-game.
// The unmodified upstream frontend and provenance are retained in vendor/color-cascade/.
export type ColorIndex = 0 | 1 | 2 | 3;
export type CascadeTile = {
  id: number;
  lane: number;
  color: ColorIndex;
  y: number;
  required: boolean;
};
export type CascadeState = {
  score: number;
  combo: number;
  lives: number;
  sequence: ColorIndex[];
  cursor: number;
  lanes: number;
  completed: number;
  speed: number;
  spawnElapsed: number;
  tiles: CascadeTile[];
  nextId: number;
};
export const CASCADE_COLORS = [
  "#ff5252",
  "#448aff",
  "#4caf50",
  "#ffeb3b",
] as const;
export const CASCADE_HEIGHT = 600;
export const CASCADE_TILE_HEIGHT = 120;
type Random = () => number;
const sequence = (length: number, random: Random): ColorIndex[] =>
  Array.from({ length }, () => Math.floor(random() * 4) as ColorIndex);
function spawn(
  state: CascadeState,
  color: ColorIndex,
  required: boolean,
  random: Random,
) {
  const start = Math.floor(random() * state.lanes);
  let lane = start;
  for (let i = 0; i < state.lanes; i++) {
    const candidate = (start + i) % state.lanes;
    if (
      !state.tiles.some(
        (tile) => tile.lane === candidate && tile.y < CASCADE_TILE_HEIGHT,
      )
    ) {
      lane = candidate;
      break;
    }
  }
  state.tiles.push({
    id: state.nextId++,
    lane,
    color,
    y: -CASCADE_TILE_HEIGHT,
    required,
  });
}
const required = (state: CascadeState, random: Random) =>
  spawn(state, state.sequence[state.cursor], true, random);
export function createCascade(random: Random = Math.random): CascadeState {
  const state: CascadeState = {
    score: 0,
    combo: 1,
    lives: 3,
    sequence: sequence(3, random),
    cursor: 0,
    lanes: 3,
    completed: 0,
    speed: 180,
    spawnElapsed: 0,
    tiles: [],
    nextId: 1,
  };
  required(state, random);
  return state;
}
function advance(state: CascadeState, random: Random, completed: boolean) {
  state.cursor++;
  if (state.cursor >= state.sequence.length) {
    state.cursor = 0;
    if (completed) state.completed++;
    const lanes = state.completed >= 7 ? 5 : state.completed >= 3 ? 4 : 3;
    if (lanes !== state.lanes) {
      state.lanes = lanes;
      state.tiles = [];
      state.speed = 180 + 30 * (lanes - 3);
      state.sequence = sequence(3, random);
    } else {
      state.sequence = sequence(state.sequence.length + 1, random);
      if (completed) state.speed += 18;
    }
  }
  if (state.lives > 0) required(state, random);
}
export function selectCascadeTile(
  state: CascadeState,
  id: number,
  random: Random = Math.random,
): CascadeState {
  if (state.lives <= 0) return state;
  const tile = state.tiles.find((tile) => tile.id === id);
  if (!tile) return state;
  const next = {
    ...state,
    tiles: state.tiles
      .filter((tile) => tile.id !== id)
      .map((tile) => ({ ...tile })),
  };
  if (tile.color === state.sequence[state.cursor]) {
    next.score += 10 * next.combo;
    next.combo++;
    if (next.lives < 3 && next.combo > 1 && next.combo % 5 === 0) next.lives++;
    for (const other of next.tiles)
      if (other.color === tile.color) other.required = false;
    advance(next, random, true);
  } else {
    next.lives--;
    next.combo = 1;
  }
  return next;
}
export function stepCascade(
  state: CascadeState,
  elapsedMs: number,
  random: Random = Math.random,
): CascadeState {
  if (state.lives <= 0 || elapsedMs <= 0) return state;
  const dt = Math.min(100, elapsedMs);
  const next = {
    ...state,
    tiles: state.tiles.map((tile) => ({
      ...tile,
      y: tile.y + (state.speed * dt) / 1000,
    })),
    spawnElapsed: state.spawnElapsed + dt,
  };
  const expired = next.tiles.filter((tile) => tile.y > CASCADE_HEIGHT);
  next.tiles = next.tiles.filter((tile) => tile.y <= CASCADE_HEIGHT);
  for (const tile of expired)
    if (tile.required && next.lives > 0) {
      next.lives--;
      next.combo = 1;
      advance(next, random, false);
    }
  const interval = Math.max(200, 800 - next.completed * 20);
  if (next.spawnElapsed >= interval && next.lives > 0) {
    next.spawnElapsed %= interval;
    const distractors = ([0, 1, 2, 3] as ColorIndex[]).filter(
      (color) => color !== next.sequence[next.cursor],
    );
    spawn(
      next,
      distractors[Math.floor(random() * distractors.length)],
      false,
      random,
    );
  }
  return next;
}
