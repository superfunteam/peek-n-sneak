'use client';
import { useEffect, useState, useRef } from 'react';
import {
  ArrowUpRight,
  Volume2,
  VolumeX,
  CircleHelp,
  ArrowRight,
  Gamepad2,
  Users,
  Copy,
  Check,
  Pause,
  Play,
  LogOut,
  Link as LinkIcon,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react';
import Screen from '@/components/game/Screen';
import Controls from '@/components/game/Controls';
import { useGame } from '@/components/game/useGame';
import { activePlayer, createGame, nearestSpot } from '@/game/engine';
import { LEVELS, makeWorld, type LevelId } from '@/game/world';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
export default function Home() {
  const [level, setLevel] = useState<LevelId>('houston');
  const [mode, setMode] = useState('solo');
  const [expert, setExpert] = useState(false);
  const [sound, setSound] = useState(true);
  const [crt, setCrt] = useState(true);
  const [help, setHelp] = useState(false);
  const [invite, setInvite] = useState('');
  const [copied, setCopied] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const game = useGame(sound);
  const helpPaused = useRef(false);
  const openHelp = (open: boolean) => {
    if (open && game.playing && !game.session && !game.paused) {
      game.pause();
      helpPaused.current = true;
    }
    if (!open && helpPaused.current) {
      game.pause();
      helpPaused.current = false;
    }
    setHelp(open);
  };
  const { state, viewer } = game;
  const world = makeWorld(state.level, state.round);
  const room = world.find((r) => r.id === state.players[viewer].room);
  const waiting = !!game.session && !game.network?.started;
  const active =
    game.playing &&
    !game.paused &&
    !waiting &&
    activePlayer(state) === viewer &&
    ['hide', 'seek'].includes(state.phase);
  const blind = state.phase === 'hide' && state.seeker === viewer;
  const hidden = state.phase === 'seek' && state.seeker !== viewer;
  const nearby = active ? nearestSpot(state, viewer) : undefined;
  const nearbyEmpty =
    state.phase === 'seek' &&
    nearby &&
    state.checked.includes(`${room?.id}/${nearby.id}`);
  const info = LEVELS.find(
    (l) => l.id === (game.playing ? state.level : level),
  )!;
  useEffect(() => {
    setInvite(
      new URLSearchParams(location.search).get('room')?.toUpperCase() ?? '',
    );
    try {
      const prefs = JSON.parse(
        localStorage.getItem('peek-preferences') ?? '{}',
      );
      setSound(prefs.sound !== false);
      setCrt(prefs.crt !== false);
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem('peek-preferences', JSON.stringify({ sound, crt }));
  }, [sound, crt]);
  const share = async () => {
    if (!game.session) return;
    const url = `${location.origin}/?room=${game.session.code}`;
    try {
      if (navigator.share && /Android|iPhone|iPad/.test(navigator.userAgent))
        await navigator.share({
          title: "Peek 'n Sneak",
          text: 'No peeking. Come play hide & seek with me.',
          url,
        });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      setCopied(false);
    }
  };
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (tool: unknown, options: unknown) => void;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      context.registerTool(
        {
          name: 'start_solo_hide_and_seek',
          description:
            'Start a new solo hide-and-seek match against a bot in the selected neighborhood.',
          inputSchema: {
            type: 'object',
            properties: {
              level: {
                type: 'string',
                enum: ['houston', 'dallas', 'merrimac'],
              },
            },
            required: ['level'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false },
          execute: (input: unknown) => {
            const l = (input as { level?: string })?.level;
            if (!LEVELS.some((x) => x.id === l))
              throw new Error('Choose houston, dallas, or merrimac.');
            if (game.playing)
              throw new Error('Finish or leave the current match first.');
            setLevel(l as LevelId);
            game.start(l as LevelId, false);
            return { started: true, level: l };
          },
        },
        { signal: lifecycle.signal },
      );
    } catch {}
    return () => lifecycle.abort();
  }, [game.playing, game.start]);
  const countdown =
    state.phase === 'hide'
      ? String(Math.floor(state.phaseTime)).padStart(2, '0')
      : String(Math.max(0, 50 - Math.floor(state.phaseTime / 4))).padStart(
          2,
          '0',
        );
  return (
    <main className={`app-shell isolate ${game.playing ? 'is-playing' : ''}`}>
      <header className="site-header">
        <a
          href="/"
          className="brand"
          onClick={(e) => {
            if (game.playing) {
              e.preventDefault();
              setExitOpen(true);
            }
          }}
        >
          <span className="brand-eyes">▰▰</span> peek ’n sneak
          <span className="edition">EST. 1982 / REWOUND</span>
        </a>
        <div className="header-tools">
          <button
            aria-label={sound ? 'Mute sound' : 'Turn sound on'}
            aria-pressed={sound}
            onClick={() => setSound(!sound)}
          >
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button aria-label="How to play" onClick={() => openHelp(true)}>
            <CircleHelp size={18} />
          </button>
        </div>
      </header>
      <div className="game-layout">
        <section className="play-column">
          <div className="section-kicker">
            <span className="live-dot" />
            {game.playing
              ? `${info.name.toUpperCase()} / ${game.session ? 'WITH A FRIEND' : 'SOLO VS. BOT'}`
              : 'THE ORIGINAL LIVING-ROOM SPORT'}
            <span className="cartridge-id">
              CARTRIDGE № 00{info.number.slice(-1)}
            </span>
          </div>
          <div className="console">
            <div className="console-top">
              <span>PEEK ’N SNEAK</span>
              <span>
                <i /> COLOR / 60 HZ
              </span>
            </div>
            <div className={`screen-bezel ${crt ? '' : 'crt-off'}`}>
              <Screen
                state={game.playing ? state : createGame(level)}
                viewer={viewer}
                attract={!game.playing}
                onTarget={active ? game.goTo : undefined}
              />
              {!game.playing ? (
                <>
                  <div className="screen-title">
                    <p>NO PEEKING.</p>
                    <h1>
                      Peek <em>’n</em>
                      <br />
                      Sneak<span>™</span>
                    </h1>
                    <div className="insert-coin">
                      READY OR NOT, HERE I COME.
                    </div>
                  </div>
                  <div className="screen-bottom">
                    <span>1 OR 2 PLAYERS</span>
                    <span>© GOOD OLD TIMES</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="game-hud">
                    <span>
                      P{viewer + 1} <b>{state.scores[viewer]}</b>
                    </span>
                    <div>
                      <b>{countdown}</b>
                      <span>
                        {state.phase === 'hide'
                          ? 'COUNT. SNEAK!'
                          : state.phase === 'seek'
                            ? 'SEEK. SNEAK!'
                            : 'GOOD PEEKING.'}
                      </span>
                    </div>
                    <span>
                      RND <b>{state.round}/4</b>
                    </span>
                  </div>
                  <div className="room-label">
                    {room?.name ?? 'No peeking!'}
                  </div>
                  {(waiting ||
                    blind ||
                    hidden ||
                    game.paused ||
                    state.phase === 'result' ||
                    state.phase === 'finished') && (
                    <div
                      className={`game-overlay ${blind ? 'blind-overlay' : ''} ${hidden ? 'hidden-overlay' : ''}`}
                    >
                      {waiting ? (
                        <>
                          <Users size={28} />
                          <h3>Saving a spot.</h3>
                          <p>Send your friend the invite below.</p>
                          <span className="pixel-dots">● ● ●</span>
                        </>
                      ) : game.paused ? (
                        <>
                          <Pause size={28} />
                          <h3>Taking a peek?</h3>
                          <button onClick={game.pause}>
                            Resume game <Play size={13} />
                          </button>
                        </>
                      ) : state.phase === 'finished' ? (
                        <>
                          <h3>
                            {state.winner === null
                              ? 'A sneaky tie.'
                              : state.winner === viewer
                                ? 'You’re the sneakiest!'
                                : 'They got you.'}
                          </h3>
                          <p>
                            {state.scores[viewer]} — {state.scores[1 - viewer]}{' '}
                            · FOUR ROUNDS, WELL PLAYED
                          </p>
                          <button
                            onClick={() =>
                              game.network?.left !== null &&
                              game.network?.left !== undefined
                                ? void game.leave()
                                : void game.rematch()
                            }
                            disabled={!!game.network?.ready[viewer]}
                          >
                            <RotateCcw size={13} />
                            {game.network?.left !== null &&
                            game.network?.left !== undefined
                              ? 'Back to the neighborhood'
                              : game.network?.ready[viewer]
                                ? 'Waiting for your friend…'
                                : 'One more game'}
                          </button>
                        </>
                      ) : state.phase === 'result' ? (
                        <>
                          <h3>{state.message}</h3>
                          <p>
                            {state.winner === viewer
                              ? 'That round is yours.'
                              : 'A point for the other sneak.'}
                          </p>
                          <span>SWAPPING SIDES…</span>
                        </>
                      ) : blind ? (
                        <>
                          <EyeOff size={24} />
                          <h3>No peeking!</h3>
                          <p>
                            {game.session ? 'Your friend' : 'The bot'} is
                            finding a hiding place.
                          </p>
                          <span className="pixel-dots">● ● ●</span>
                        </>
                      ) : (
                        <>
                          <Eye size={24} />
                          <h3>Not a peep.</h3>
                          <p>
                            You’re{' '}
                            {state.hidden
                              ? world
                                  .find((r) => r.id === state.hidden?.room)
                                  ?.spots.find(
                                    (s) => s.id === state.hidden?.spot,
                                  )
                                  ?.name.toLowerCase()
                              : 'hidden'}
                            .
                          </p>
                          <span>THE SEEKER IS ON THE MOVE</span>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="console-bottom">
              <span>
                <i /> POWER
              </span>
              <div className="vent" />
              <span>HIDE. SEEK. REPEAT.</span>
            </div>
          </div>
          {game.playing ? (
            <>
              <div
                className="play-status"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                {game.error ? (
                  <span className="error-copy">{game.error}</span>
                ) : waiting ? (
                  'Your friend’s controller will light up when they join.'
                ) : state.phase === 'result' ? (
                  state.message
                ) : nearbyEmpty ? (
                  <span className="empty-spot-message">
                    <strong>
                      <span aria-hidden="true">×</span> Nobody here.
                    </strong>{' '}
                    {nearby.name} — already checked. Try another spot.
                  </span>
                ) : nearby ? (
                  <span>
                    <strong>{nearby.name}</strong> · Hold{' '}
                    {state.phase === 'hide' ? 'HIDE' : 'PEEK'}
                    {state.expert ? ` + ${nearby.direction}` : ''}
                  </span>
                ) : blind ? (
                  'Eyes covered. Your turn is coming.'
                ) : hidden ? (
                  'Stay quiet. The seeker is looking for you.'
                ) : state.phase === 'finished' ? (
                  'Same time, same couch?'
                ) : (
                  'Walk to a hiding spot. Hold to peek. Try the doorways, too.'
                )}
              </div>
              <Controls
                onMove={game.move}
                onAction={game.action}
                label={state.phase === 'hide' ? 'HIDE' : 'PEEK'}
                disabled={!active}
              />
              <div className="game-actions">
                {!game.session && (
                  <button onClick={game.pause}>
                    {game.paused ? <Play size={14} /> : <Pause size={14} />}{' '}
                    {game.paused ? 'Resume' : 'Pause'}
                  </button>
                )}
                <button onClick={() => setExitOpen(true)}>
                  <LogOut size={14} />
                  Leave game
                </button>
                <button onClick={() => openHelp(true)}>
                  <CircleHelp size={14} />
                  How to play
                </button>
              </div>
            </>
          ) : (
            <div className="under-screen">
              <span>A little weird. Just like you remember.</span>
              <span>✳ NO QUARTERS REQUIRED</span>
            </div>
          )}
        </section>
        <aside className="setup-panel">
          {game.playing ? (
            <>
              <div className="setup-heading">
                <p className="eyebrow">
                  {waiting
                    ? 'GOOD COMPANY, GREAT HIDING SPOTS'
                    : 'READY OR NOT'}
                </p>
                <h2>
                  {waiting ? (
                    <>
                      Better
                      <br />
                      together.
                    </>
                  ) : (
                    <>
                      Keep it
                      <br />
                      sneaky.
                    </>
                  )}
                </h2>
                <p>
                  {waiting
                    ? 'A familiar game. A friend, anywhere.'
                    : `${info.name}${state.level === 'merrimac' ? ' · Corpus Christi' : ''} · ${state.expert ? 'Expert' : 'Classic'} hiding spots`}
                </p>
              </div>
              {game.session && (
                <div className="invite-card">
                  <p className="field-label">
                    <LinkIcon size={14} /> YOUR PRIVATE GAME
                  </p>
                  <input
                    aria-label="Game invite link"
                    readOnly
                    value={
                      typeof location !== 'undefined'
                        ? `${location.origin}/?room=${game.session.code}`
                        : ''
                    }
                    onFocus={(e) => e.target.select()}
                  />
                  <button className="start-button" onClick={() => void share()}>
                    {copied ? 'Link copied!' : 'Invite your friend'}
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                  <p>
                    <span
                      className={`live-dot ${game.network?.opponentConnected ? '' : 'offline-dot'}`}
                    />
                    {game.network?.left !== null &&
                    game.network?.left !== undefined
                      ? 'Your friend left the game'
                      : game.network?.opponentConnected
                        ? 'Your friend is here'
                        : waiting
                          ? 'Waiting for player 2'
                          : 'Reconnecting to your friend…'}
                  </p>
                </div>
              )}
              <div className="scoreboard">
                <p className="field-label">THE SCORE SO FAR</p>
                <div>
                  <span>
                    You <small>P{viewer + 1}</small>
                  </span>
                  <strong>{state.scores[viewer]}</strong>
                </div>
                <div>
                  <span>
                    {game.session ? 'Your friend' : 'Sneaky bot'}{' '}
                    <small>P{2 - viewer}</small>
                  </span>
                  <strong>{state.scores[1 - viewer]}</strong>
                </div>
                <p>
                  Round {state.round} of 4 · Find them or outlast the clock.
                </p>
              </div>
              <div className="room-guide">
                <p className="field-label">KNOW YOUR WAY AROUND</p>
                <div className="room-chips">
                  {world.map((r) => (
                    <span
                      className={r.id === room?.id ? 'current' : ''}
                      key={r.id}
                    >
                      {r.kind === 'living'
                        ? 'Living'
                        : r.kind === 'blue'
                          ? 'Blue'
                          : r.kind === 'pink'
                            ? 'Pink'
                            : 'Yard'}
                      {r.house ? ' 2' : ''}
                    </span>
                  ))}
                </div>
                <p>
                  {state.level === 'merrimac'
                    ? 'Two houses on Merrimac Street, with one neighbor between them. Only the outside houses are yours to explore.'
                    : 'Doorways connect the living room, two bedrooms, and front yard. Yes, you really can hide in the floor.'}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="setup-heading">
                <p className="eyebrow">LET’S GET LOST</p>
                <h2>
                  Come out,
                  <br />
                  come out.
                </h2>
                <p>Your favorite hiding place is still here.</p>
              </div>
              {invite ? (
                <div className="invite-card">
                  <Users size={24} />
                  <h3>You’ve been invited.</h3>
                  <p>Your friend has a hiding place with your name on it.</p>
                  <button
                    className="start-button"
                    onClick={() => void game.join(invite)}
                    disabled={game.busy}
                  >
                    {game.busy ? 'Connecting…' : 'Join your friend'}
                    <ArrowRight size={20} />
                  </button>
                  <button
                    className="text-button"
                    onClick={() => {
                      setInvite('');
                      history.replaceState(null, '', location.pathname);
                    }}
                  >
                    Or start your own game
                  </button>
                </div>
              ) : (
                <>
                  <div className="setup-step">
                    <p className="field-label">
                      <span>01</span> PICK YOUR COMPANY
                    </p>
                    <Tabs
                      value={mode}
                      onValueChange={(v) => setMode(v as string)}
                    >
                      <TabsList className="mode-buttons">
                        <TabsTrigger value="solo">
                          <Gamepad2 size={18} />
                          Solo vs. bot
                        </TabsTrigger>
                        <TabsTrigger value="friend">
                          <Users size={18} />
                          With a friend
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="setup-step">
                    <p className="field-label">
                      <span>02</span> PICK YOUR NEIGHBORHOOD
                    </p>
                    <div
                      className="level-list"
                      role="group"
                      aria-label="Neighborhood"
                    >
                      {LEVELS.map((l) => (
                        <button
                          className={`level-option ${level === l.id ? 'selected' : ''}`}
                          aria-pressed={level === l.id}
                          key={l.id}
                          onClick={() => setLevel(l.id)}
                        >
                          <div
                            className={`level-icon ${l.id}`}
                            aria-hidden="true"
                          >
                            ⌂
                          </div>
                          <div>
                            <strong>
                              {l.name}
                              {l.id === 'merrimac' && <small> CORPUS</small>}
                            </strong>
                            <p>{l.subtitle}</p>
                          </div>
                          <span className="radio-dot" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="expert-toggle">
                    <div>
                      <label htmlFor="expert">Old-school expert</label>
                      <p>Tighter spots. Direction matters.</p>
                    </div>
                    <Switch
                      id="expert"
                      checked={expert}
                      onCheckedChange={setExpert}
                    />
                  </div>
                  <button
                    className="start-button"
                    disabled={game.busy}
                    onClick={() =>
                      mode === 'solo'
                        ? game.start(level, expert)
                        : void game.create(level, expert)
                    }
                  >
                    {game.busy
                      ? 'Getting the house ready…'
                      : mode === 'solo'
                        ? 'Let’s play'
                        : 'Make a room'}
                    <ArrowRight size={20} />
                  </button>
                  <p className="start-note">
                    {mode === 'solo'
                      ? 'One sneaky bot. Four rounds. Endless nostalgia.'
                      : 'Send a link. Take turns. No screen peeking.'}
                  </p>
                </>
              )}
              {game.error && (
                <p className="error-copy" role="alert">
                  {game.error}
                </p>
              )}
            </>
          )}
        </aside>
      </div>
      <footer className="site-footer">
        <span>BUILT FOR SMALL SCREENS & BIG MEMORIES.</span>
        <a
          href="https://www.youtube.com/watch?v=WZsCDIfyh6A"
          target="_blank"
          rel="noreferrer"
        >
          Inspired by the 1982 classic <ArrowUpRight size={13} />
        </a>
      </footer>
      <Dialog open={help} onOpenChange={openHelp}>
        <DialogContent className="manual-dialog">
          <DialogTitle className="manual-title">
            The art of not being found.
          </DialogTitle>
          <DialogDescription>
            A few things your 1982 self already knows.
          </DialogDescription>
          <div className="manual-body">
            <p>
              <strong>1. Hide.</strong> Explore with the D-pad, arrow keys, or
              WASD. You can also tap a place to walk there. Find a spot near the
              couch, bed, closet, yard — even the floor. Hold HIDE (Space / E)
              to disappear.
            </p>
            <p>
              <strong>2. Seek.</strong> Walk through the black doorways to
              change rooms. Visit hiding places and hold PEEK to check them. A
              peach X means nobody is there; it stays for this round. Tiny floor
              dots show unsearched spots on Classic difficulty. Expert needs the
              correct direction as you peek.
            </p>
            <p>
              <strong>3. Switch.</strong> Find the hider before the clock runs
              out and score a point. Run out of time and the hider scores. Trade
              roles for four rounds. A tie goes to the faster seeker.
            </p>
            <p>
              The hiding clock counts up to 50. The seeking clock counts down
              four times slower — just like the original. Solo play also lets
              you hide from a bot that searches without knowing your spot.
            </p>
            <label className="crt-setting">
              <span>CRT scanlines</span>
              <Switch checked={crt} onCheckedChange={setCrt} />
            </label>
            <a
              href="https://www.atariage.com/2600/manuals_old/sneak_n_peek.html"
              target="_blank"
              rel="noreferrer"
            >
              Read the original game manual ↗
            </a>
            <p className="tribute-note">
              An independent, lovingly rebuilt tribute to Sneak ’n Peek (1982).
              Not affiliated with Atari or the original publisher.
            </p>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={exitOpen} onOpenChange={setExitOpen}>
        <DialogContent className="manual-dialog">
          <DialogTitle>Leave this game?</DialogTitle>
          <DialogDescription>
            {game.session
              ? 'Your friend will see that you left.'
              : 'Your current match will end.'}
          </DialogDescription>
          <button
            className="start-button"
            onClick={() => {
              void game.leave();
              setExitOpen(false);
              setInvite('');
            }}
          >
            Back to the neighborhood <ArrowRight size={18} />
          </button>
          <button className="text-button" onClick={() => setExitOpen(false)}>
            Keep playing
          </button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
