import {
  makeWorld,
  distance,
  routeTo,
  type LevelId,
  type Direction,
} from './world';
export type Phase = 'hide' | 'seek' | 'result' | 'finished';
export interface Input {
  x: number;
  y: number;
  action: boolean;
}
export interface Player {
  x: number;
  y: number;
  room: string;
  facing: Direction;
  moving: boolean;
}
export interface GameState {
  level: LevelId;
  expert: boolean;
  round: number;
  phase: Phase;
  players: [Player, Player];
  seeker: 0 | 1;
  hidden: { room: string; spot: string } | null;
  phaseTime: number;
  scores: [number, number];
  elapsed: [number, number];
  checked: string[];
  progress: number;
  checking: string | null;
  message: string;
  winner: number | null;
  random: number;
  botTarget: string | null;
  botOrder: string[];
  transition: number;
  lastDoor: [number, number];
}
export const EMPTY_INPUT: Input = { x: 0, y: 0, action: false };
const spawn = (): Player => ({
  x: 73,
  y: 160,
  room: 'living-a',
  facing: 'right',
  moving: false,
});
export function createGame(
  level: LevelId = 'houston',
  expert = false,
  seed = Math.floor(Math.random() * 2147483646) + 1,
): GameState {
  return {
    level,
    expert,
    round: 1,
    phase: 'hide',
    players: [spawn(), { ...spawn(), x: 220 }],
    seeker: 0,
    hidden: null,
    phaseTime: 0,
    scores: [0, 0],
    elapsed: [0, 0],
    checked: [],
    progress: 0,
    checking: null,
    message: 'Find a good hiding place.',
    winner: null,
    random: seed,
    botTarget: null,
    botOrder: [],
    transition: 0,
    lastDoor: [0, 0],
  };
}
function random(s: GameState) {
  s.random = (s.random * 16807) % 2147483647;
  return (s.random - 1) / 2147483646;
}
export function hideAt(s: GameState, room: string, spot: string) {
  s.hidden = { room, spot };
  s.phase = 'seek';
  s.phaseTime = 0;
  s.progress = 0;
  s.checking = null;
  s.message = 'Ready or not, here I come!';
  s.players[s.seeker] = spawn();
  s.botTarget = null;
}
function finishRound(s: GameState, found: boolean) {
  const winner = found ? s.seeker : 1 - s.seeker;
  s.scores[winner]++;
  s.elapsed[s.seeker] += Math.min(200, s.phaseTime);
  s.phase = 'result';
  s.phaseTime = 0;
  s.winner = winner;
  s.progress = 0;
  s.message = found ? 'Found you!' : 'Too sneaky!';
}
export function nextRound(s: GameState) {
  if (s.round >= 4) {
    s.phase = 'finished';
    s.winner =
      s.scores[0] === s.scores[1]
        ? s.elapsed[0] === s.elapsed[1]
          ? null
          : s.elapsed[0] < s.elapsed[1]
            ? 0
            : 1
        : s.scores[0] > s.scores[1]
          ? 0
          : 1;
    return;
  }
  s.round++;
  s.seeker = s.seeker === 0 ? 1 : 0;
  s.phase = 'hide';
  s.phaseTime = 0;
  s.players = [spawn(), { ...spawn(), x: 220 }];
  s.hidden = null;
  s.checked = [];
  s.progress = 0;
  s.checking = null;
  s.botTarget = null;
  s.botOrder = [];
  s.winner = null;
  s.message = 'Find a good hiding place.';
  s.lastDoor = [0, 0];
}
export function activePlayer(s: GameState) {
  return s.phase === 'hide' ? 1 - s.seeker : s.seeker;
}
export function nearestSpot(s: GameState, index: number) {
  const p = s.players[index];
  return makeWorld(s.level, s.round)
    .find((r) => r.id === p.room)!
    .spots.filter((spot) => distance(spot, p) < (s.expert ? 12 : 23))
    .sort((a, b) => distance(a, p) - distance(b, p))[0];
}
export function stepGame(
  s: GameState,
  inputs: [Input, Input],
  dt: number,
  bot: number | null = null,
) {
  dt = Math.max(0, Math.min(dt, 0.1));
  if (s.phase === 'finished') return;
  s.phaseTime += dt;
  s.lastDoor = s.lastDoor.map((x) => Math.max(0, x - dt)) as [number, number];
  if (s.phase === 'result') {
    if (s.phaseTime > 4) nextRound(s);
    return;
  }
  const world = makeWorld(s.level, s.round);
  const active = activePlayer(s);
  let input = inputs[active];
  const p = s.players[active];
  if (bot === active) {
    if (s.phase === 'hide') {
      if (s.phaseTime > 3) {
        const r = world[Math.floor(random(s) * world.length)];
        const sp = r.spots[Math.floor(random(s) * r.spots.length)];
        p.room = r.id;
        p.x = sp.x;
        p.y = sp.y;
        hideAt(s, r.id, sp.id);
      }
      return;
    }
    if (!s.botOrder.length) {
      const shuffled = [...world];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(random(s) * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      s.botOrder = shuffled.flatMap((r) => {
        const spots = [...r.spots];
        for (let i = spots.length - 1; i > 0; i--) {
          const j = Math.floor(random(s) * (i + 1));
          [spots[i], spots[j]] = [spots[j], spots[i]];
        }
        return spots.map((sp) => `${r.id}/${sp.id}`);
      });
    }
    if (!s.botTarget || s.checked.includes(s.botTarget))
      s.botTarget =
        s.botOrder.find((k) => !s.checked.includes(k)) ?? s.botOrder[0];
    const [roomId, spotId] = s.botTarget.split('/');
    const target =
      roomId === p.room
        ? world
            .find((r) => r.id === roomId)!
            .spots.find((x) => x.id === spotId)!
        : routeTo(world, p.room, roomId)!;
    const d = distance(p, target);
    input = {
      x: d > 3 ? (target.x - p.x) / d : 0,
      y: d > 3 ? (target.y - p.y) / d : 0,
      action: d < 12,
    };
    if (d < 4 && 'direction' in target) p.facing = target.direction;
  }
  const len = Math.hypot(input.x, input.y);
  p.moving = len > 0.15;
  if (p.moving) {
    p.facing =
      Math.abs(input.x) > Math.abs(input.y)
        ? input.x > 0
          ? 'right'
          : 'left'
        : input.y > 0
          ? 'down'
          : 'up';
    const entry = nearestSpot(s, active);
    // The original pulls the sprite into an aligned hiding place. Holding
    // that direction must not carry the player straight past the trigger.
    const captured =
      s.expert &&
      entry &&
      s.progress > 0 &&
      s.checking === `${p.room}/${entry.id}` &&
      entry.direction === p.facing;
    if (!captured) {
      const speed = bot === active ? 43 : 60;
      p.x = Math.max(
        4,
        Math.min(316, p.x + (input.x / Math.max(1, len)) * speed * dt),
      );
      p.y = Math.max(
        129,
        Math.min(196, p.y + (input.y / Math.max(1, len)) * speed * dt),
      );
    }
  }
  const room = world.find((r) => r.id === p.room)!;
  const door = room.doors.find(
    (d) => distance(d, p) < (d.x < 15 || d.x > 305 ? 11 : 14),
  );
  if (door && s.lastDoor[active] <= 0 && (p.moving || input.action)) {
    p.room = door.to;
    p.x = door.spawnX;
    p.y = door.spawnY;
    s.lastDoor[active] = 0.6;
    s.progress = 0;
    s.checking = null;
    s.transition++;
    return;
  }
  const spot = nearestSpot(s, active);
  const key = spot ? `${p.room}/${spot.id}` : null;
  const auto = s.expert && p.moving && spot?.direction === p.facing;
  if (
    spot &&
    (input.action || auto) &&
    (!s.expert || p.facing === spot.direction)
  ) {
    if (s.checking !== key) {
      s.checking = key;
      s.progress = 0;
    }
    s.progress += dt;
    if (s.progress >= 0.65) {
      s.progress = 0;
      s.checking = null;
      if (s.phase === 'hide') hideAt(s, p.room, spot.id);
      else if (s.hidden?.room === p.room && s.hidden.spot === spot.id)
        finishRound(s, true);
      else {
        if (!s.checked.includes(key!)) s.checked.push(key!);
        s.message = `Nobody ${spot.name.toLowerCase().replace(/^the /, 'at the ')}. Keep peeking!`;
      }
    }
  } else {
    s.progress = 0;
    s.checking = null;
  }
  if (s.phase === 'hide' && s.phaseTime >= 50) {
    const sp = room.spots.reduce((a, b) =>
      distance(a, p) < distance(b, p) ? a : b,
    );
    hideAt(s, room.id, sp.id);
  }
  if (s.phase === 'seek' && s.phaseTime >= 200) finishRound(s, false);
}
export function advanceGame(
  s: GameState,
  inputs: [Input, Input],
  seconds: number,
  bot: number | null = null,
) {
  let left = Math.min(5, Math.max(0, seconds));
  while (left > 0) {
    const dt = Math.min(0.05, left);
    stepGame(s, inputs, dt, bot);
    left -= dt;
  }
}
export function publicState(s: GameState, player: number): GameState {
  const copy = structuredClone(s);
  copy.random = 0;
  copy.botOrder = [];
  copy.botTarget = null;
  if ((s.phase === 'hide' || s.phase === 'seek') && player === s.seeker) {
    copy.hidden = null;
    if (s.phase === 'hide') {
      copy.checking = null;
      copy.progress = 0;
    }
    copy.players[1 - s.seeker] = {
      ...spawn(),
      room: 'hidden',
      x: 0,
      y: 0,
      moving: false,
    };
  }
  return copy;
}
