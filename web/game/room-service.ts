import {
  advanceGame,
  createGame,
  EMPTY_INPUT,
  publicState,
  type GameState,
  type Input,
} from './engine';
import { LEVELS, type LevelId } from './world';
export interface RoomRecord {
  code: string;
  storageVersion?: string;
  state: string;
  host_token: string;
  guest_token: string | null;
  revision: number;
  updated_at: number;
  expires_at: number;
}
export interface Match {
  game: GameState;
  inputs: [Input, Input];
  seen: [number, number];
  sequence: [number, number];
  started: boolean;
  ready: [boolean, boolean];
  lastTick: number;
  left: number | null;
}
const DAY = 86400000;
const token = () => crypto.randomUUID() + crypto.randomUUID();
export class RoomError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function serialize(row: RoomRecord, match: Match, player: number) {
  return {
    code: row.code,
    player,
    started: match.started,
    game: publicState(match.game, player),
    opponentConnected: Date.now() - match.seen[1 - player] < 8000,
    ready: match.ready,
    left: match.left,
    revision: row.revision,
  };
}
export interface RoomStore {
  get(code: string): Promise<RoomRecord | null>;
  create(room: RoomRecord): Promise<boolean>;
  save(room: RoomRecord, previous: RoomRecord): Promise<boolean>;
  pruneExpired?(now: number): Promise<void>;
}
export function createRoomService(store: RoomStore) {
  async function createRoom(level: LevelId, expert: boolean) {
    if (!LEVELS.some((l) => l.id === level))
      throw new RoomError('Choose a neighborhood.');
    const now = Date.now();
    const code = crypto
      .randomUUID()
      .replaceAll('-', '')
      .slice(0, 12)
      .toUpperCase();
    const hostToken = token();
    const match: Match = {
      game: createGame(level, expert),
      inputs: [{ ...EMPTY_INPUT }, { ...EMPTY_INPUT }],
      seen: [now, 0],
      sequence: [-1, -1],
      started: false,
      ready: [false, false],
      lastTick: now,
      left: null,
    };
    await store.pruneExpired?.(now);
    const created = await store.create({
      code,
      state: JSON.stringify(match),
      host_token: hostToken,
      guest_token: null,
      revision: 0,
      updated_at: now,
      expires_at: now + DAY,
    });
    if (!created) throw new RoomError('Please try making a room again.', 503);
    return {
      token: hostToken,
      ...serialize({ code, revision: 0 } as RoomRecord, match, 0),
    };
  }
  async function getRoom(code: string) {
    if (!/^[A-Z0-9]{12}$/.test(code))
      throw new RoomError('That invite link does not look right.', 404);
    const row = await store.get(code);
    if (!row || row.expires_at < Date.now())
      throw new RoomError(
        'This room expired. Start a new game and share a fresh link.',
        404,
      );
    return row;
  }
  async function joinRoom(code: string) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const row = await getRoom(code);
      if (row.guest_token)
        throw new RoomError(
          'Both spots are taken. Ask your friend for a new invite.',
          409,
        );
      const guestToken = token();
      const match: Match = JSON.parse(row.state);
      match.started = true;
      match.lastTick = Date.now();
      match.seen[1] = Date.now();
      const result = await store.save(
        {
          ...row,
          guest_token: guestToken,
          state: JSON.stringify(match),
          revision: row.revision + 1,
        },
        row,
      );
      if (!result) continue;
      return {
        ...serialize({ ...row, revision: row.revision + 1 }, match, 1),
        token: guestToken,
      };
    }
    throw new RoomError('The room is busy. Please join again.', 503);
  }
  async function updateRoom(
    code: string,
    secret: string,
    action: string,
    input: Input,
    sequence: number,
  ) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const row = await getRoom(code);
      const player =
        row.host_token === secret
          ? 0
          : row.guest_token && row.guest_token === secret
            ? 1
            : null;
      if (player === null)
        throw new RoomError(
          'This player session is no longer valid. Open your invitation again.',
          403,
        );
      const match: Match = JSON.parse(row.state);
      const now = Date.now();
      if (match.started && match.left === null) {
        const total = Math.min(5, (now - match.lastTick) / 1000);
        let used = 0;
        while (used < total) {
          const dt = Math.min(0.1, total - used);
          const at = match.lastTick + (used + dt) * 1000;
          const controls = match.inputs.map((i, p) =>
            at - match.seen[p] < 650 ? i : { ...EMPTY_INPUT },
          ) as [Input, Input];
          advanceGame(match.game, controls, dt);
          used += dt;
        }
      }
      match.lastTick = now;
      match.seen[player] = now;
      if (sequence > match.sequence[player]) {
        match.inputs[player] = input;
        match.sequence[player] = sequence;
      }
      if (action === 'leave') {
        match.left = player;
        match.game.phase = 'finished';
        match.game.winner = 1 - player;
        match.game.message = 'Your friend left the game.';
      }
      if (
        action === 'rematch' &&
        match.game.phase === 'finished' &&
        match.left === null
      ) {
        match.ready[player] = true;
        if (match.ready.every(Boolean)) {
          match.game = createGame(match.game.level, match.game.expert);
          match.ready = [false, false];
          match.inputs = [{ ...EMPTY_INPUT }, { ...EMPTY_INPUT }];
          match.lastTick = now;
        }
      }
      const saved = await store.save(
        {
          ...row,
          state: JSON.stringify(match),
          revision: row.revision + 1,
          updated_at: now,
        },
        row,
      );
      if (saved)
        return serialize({ ...row, revision: row.revision + 1 }, match, player);
    }
    throw new RoomError('The room is busy. Reconnecting…', 503);
  }
  return { createRoom, joinRoom, updateRoom };
}
export function parseInput(value: unknown): Input {
  if (!value || typeof value !== 'object') return { ...EMPTY_INPUT };
  const v = value as Record<string, unknown>;
  const axis = (x: unknown) =>
    typeof x === 'number' && Number.isFinite(x)
      ? Math.max(-1, Math.min(1, x))
      : 0;
  return { x: axis(v.x), y: axis(v.y), action: v.action === true };
}
export async function requestBody(request: Request) {
  if (Number(request.headers.get('content-length')) > 2048)
    throw new RoomError('Request is too large.', 413);
  const content = await request.text();
  if (content.length > 2048) throw new RoomError('Request is too large.', 413);
  try {
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      throw new Error();
    return parsed;
  } catch {
    throw new RoomError('Invalid request.');
  }
}
export function errorResponse(error: unknown) {
  const status = error instanceof RoomError ? error.status : 500;
  if (status === 500) console.error('Room operation failed', error);
  return Response.json(
    {
      error:
        error instanceof RoomError
          ? error.message
          : 'Multiplayer had a hiccup. Please try again.',
    },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}
