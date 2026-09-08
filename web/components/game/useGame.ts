'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createGame,
  stepGame,
  EMPTY_INPUT,
  activePlayer,
  type GameState,
  type Input,
} from '@/game/engine';
import { type LevelId, distance } from '@/game/world';
import { beep } from '@/game/sound';
export interface Session {
  code: string;
  token: string;
  player: number;
}
export interface OnlineSnapshot {
  code: string;
  player: number;
  started: boolean;
  game: GameState;
  opponentConnected: boolean;
  ready: [boolean, boolean];
  left: number | null;
  revision: number;
}
export function useGame(sound: boolean) {
  const [state, setState] = useState(() => createGame());
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [network, setNetwork] = useState<OnlineSnapshot | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const current = useRef(state);
  const input = useRef<Input>({ ...EMPTY_INPUT });
  const target = useRef<{ x: number; y: number } | null>(null);
  const soundRef = useRef(sound);
  soundRef.current = sound;
  const sequence = useRef(0);
  const previous = useRef('');
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const install = useCallback((s: GameState) => {
    current.current = s;
    setState(structuredClone(s));
  }, []);
  const start = useCallback(
    (level: LevelId, expert: boolean) => {
      input.current = { ...EMPTY_INPUT };
      target.current = null;
      install(createGame(level, expert));
      setSession(null);
      setNetwork(null);
      setError('');
      setPaused(false);
      setPlaying(true);
      beep('start', soundRef.current);
    },
    [install],
  );
  const adopt = useCallback(
    (data: OnlineSnapshot & { token?: string }, token?: string) => {
      const next = {
        code: data.code,
        token: data.token ?? token!,
        player: data.player,
      };
      sessionStorage.setItem(`peek-room-${next.code}`, JSON.stringify(next));
      history.replaceState(null, '', `?room=${next.code}`);
      setSession(next);
      setNetwork(data);
      install(data.game);
      setPlaying(true);
      setPaused(false);
      setError('');
      sequence.current = Date.now();
    },
    [install],
  );
  const api = async (url: string, body: unknown, token?: string) => {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    const data = (await r.json()) as OnlineSnapshot & {
      token?: string;
      error?: string;
    };
    if (!r.ok)
      throw new Error(data.error ?? 'Could not reach your friend. Try again.');
    return data;
  };
  const create = async (level: LevelId, expert: boolean) => {
    setBusy(true);
    setError('');
    try {
      const data = await api('/api/rooms', { level, expert });
      adopt(data);
      beep('start', soundRef.current);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const join = async (code: string) => {
    setBusy(true);
    setError('');
    try {
      const saved = sessionStorage.getItem(`peek-room-${code}`);
      if (saved) {
        const s: Session = JSON.parse(saved);
        const data = await api(
          `/api/rooms/${code}`,
          { action: 'tick', sequence: Date.now(), input: EMPTY_INPUT },
          s.token,
        );
        adopt(data, s.token);
      } else {
        adopt(await api(`/api/rooms/${code}`, { action: 'join' }));
      }
      beep('start', soundRef.current);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    const keys = new Set<string>();
    const refresh = () => {
      input.current = {
        x:
          Number(keys.has('ArrowRight') || keys.has('d')) -
          Number(keys.has('ArrowLeft') || keys.has('a')),
        y:
          Number(keys.has('ArrowDown') || keys.has('s')) -
          Number(keys.has('ArrowUp') || keys.has('w')),
        action: keys.has(' ') || keys.has('e'),
      };
    };
    const down = (e: KeyboardEvent) => {
      if (
        !playingRef.current ||
        /INPUT|TEXTAREA/.test((e.target as HTMLElement)?.tagName)
      )
        return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (
        [
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'w',
          'a',
          's',
          'd',
          ' ',
          'e',
        ].includes(key)
      ) {
        e.preventDefault();
        keys.add(key);
        target.current = null;
        refresh();
      }
    };
    const up = (e: KeyboardEvent) => {
      keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
      refresh();
    };
    const clear = () => {
      keys.clear();
      input.current = { ...EMPTY_INPUT };
      target.current = null;
    };
    addEventListener('keydown', down);
    addEventListener('keyup', up);
    addEventListener('blur', clear);
    document.addEventListener('visibilitychange', clear);
    return () => {
      removeEventListener('keydown', down);
      removeEventListener('keyup', up);
      removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', clear);
    };
  }, []);
  useEffect(() => {
    if (!playing || paused || session) return;
    let frame = 0,
      last = performance.now(),
      lastPublish = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const s = current.current;
      if (target.current && activePlayer(s) === 0) {
        const p = s.players[0];
        const d = distance(p, target.current);
        if (d > 3) {
          input.current.x = (target.current.x - p.x) / d;
          input.current.y = (target.current.y - p.y) / d;
        } else {
          input.current.x = 0;
          input.current.y = 0;
          target.current = null;
        }
      }
      const beforeRoom = s.players[0].room,
        beforePhase = s.phase;
      stepGame(s, [input.current, EMPTY_INPUT], dt, 1);
      if (
        target.current &&
        (s.players[0].room !== beforeRoom || s.phase !== beforePhase)
      ) {
        target.current = null;
        input.current.x = 0;
        input.current.y = 0;
      }
      if (now - lastPublish > 32) {
        setState(structuredClone(s));
        lastPublish = now;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, paused, session]);
  useEffect(() => {
    if (!session || !playing) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        if (target.current) {
          const p = current.current.players[session.player];
          const d = distance(p, target.current);
          const speed = Math.max(0.2, Math.min(1, d / 60));
          input.current.x = d > 6 ? ((target.current.x - p.x) / d) * speed : 0;
          input.current.y = d > 6 ? ((target.current.y - p.y) / d) * speed : 0;
          if (d <= 6) target.current = null;
        }
        const data = await api(
          `/api/rooms/${session.code}`,
          {
            action: 'tick',
            input: input.current,
            sequence: ++sequence.current,
          },
          session.token,
        );
        if (!stopped) {
          if (
            target.current &&
            (current.current.players[session.player].room !==
              data.game.players[session.player].room ||
              current.current.phase !== data.game.phase)
          ) {
            target.current = null;
            input.current.x = 0;
            input.current.y = 0;
          }
          setNetwork(data);
          install(data.game);
          setError('');
        }
      } catch (e) {
        if (!stopped) setError((e as Error).message);
      } finally {
        if (!stopped) timer = setTimeout(poll, 120);
      }
    };
    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [session, playing, install]);
  useEffect(() => {
    if (!playing) return;
    const signature = `${state.round}-${state.phase}-${state.checked.length}`;
    if (previous.current !== signature) {
      if (state.phase === 'result') beep('found', soundRef.current);
      else if (state.phase === 'seek')
        beep(state.checked.length ? 'peek' : 'hide', soundRef.current);
      previous.current = signature;
    }
  }, [state.phase, state.round, state.checked.length, playing]);
  const leave = async () => {
    if (session) {
      void api(
        `/api/rooms/${session.code}`,
        { action: 'leave', sequence: ++sequence.current, input: EMPTY_INPUT },
        session.token,
      ).catch(() => {});
      sessionStorage.removeItem(`peek-room-${session.code}`);
    }
    setPlaying(false);
    setSession(null);
    setNetwork(null);
    setPaused(false);
    setError('');
    input.current = { ...EMPTY_INPUT };
    target.current = null;
    history.replaceState(null, '', location.pathname);
  };
  const rematch = async () => {
    if (!session) {
      start(state.level, state.expert);
      return;
    }
    try {
      const data = await api(
        `/api/rooms/${session.code}`,
        { action: 'rematch', sequence: ++sequence.current, input: EMPTY_INPUT },
        session.token,
      );
      setNetwork(data);
      install(data.game);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  const pause = () => {
    if (session) return;
    setPaused((v) => !v);
    input.current = { ...EMPTY_INPUT };
    target.current = null;
  };
  const move = (x: number, y: number) => {
    target.current = null;
    input.current.x = x;
    input.current.y = y;
  };
  const action = (pressed: boolean) => {
    input.current.action = pressed;
  };
  const goTo = (x: number, y: number) => {
    target.current = { x, y: Math.max(129, Math.min(196, y)) };
  };
  return {
    state,
    playing,
    paused,
    session,
    network,
    error,
    busy,
    start,
    create,
    join,
    leave,
    rematch,
    pause,
    move,
    action,
    goTo,
    viewer: session?.player ?? 0,
  };
}
