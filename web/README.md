# Peek 'n Sneak

An independent browser tribute to the wonderfully weird 1982 Atari hide-and-seek game. Built from five-second samples of the supplied [gameplay video](https://www.youtube.com/watch?v=WZsCDIfyh6A).

The application lives in **web/**. It includes Phaser’s flat Canvas renderer, phone-first touch controls, keyboard and tap-to-walk movement, solo matches against an honest bot, live invitation-based two-player games, three neighborhoods, original-style timers, expert directional hiding, synthesized square-wave sounds, optional CRT scanlines, a favicon, and an Open Graph share card.

## Run

```sh
cd web
npm install
npm run dev -- --host 0.0.0.0
```

The game opens at the address printed by the server. Solo play runs without a database request. Live multiplayer uses the local Cloudflare D1 binding; initialize it with the included migration:

```sh
npm run db:local
```

## Verify

```sh
npm run typecheck
npm test
npm run test:multiplayer # development server must be running
npm run build
```

Engine tests exercise every hiding spot, graph reachability, both roles, timers, expert mode, bot fairness, and seeker privacy. Multiplayer integration tests create two real sessions and exercise simultaneous input, finding/scoring, reconnect, authorization, and leaving.

## Layout

- `web/game/world.ts`: scene graph, doors, hiding places, and neighborhoods.
- `web/game/engine.ts`: deterministic game rules, bot AI, movement, timing, scoring, and safe player projections.
- `web/game/render.ts`: original-style flat room geometry and animated player sprites.
- `web/game/rooms.ts`: authoritative multiplayer matches, expiring sessions, and optimistic concurrency.
- `web/components/game/`: Phaser/React bridge, player controller, and multitouch controls.
- `web/app/api/rooms/`: create, join, synchronize, rematch, and leave endpoints.
- `web/db/` and `web/drizzle/`: durable room schema and migrations.
- `docs/reference-study.md`: video observations and deliberate browser adaptations.

Online room input/state updates run approximately every 120 ms plus network latency. Session secrets are private per tab; invitations contain only a random room ID. Expired inputs stop movement after 650 ms. Rooms expire after 24 hours. The server removes secret hider data before responding to the seeker. Platform access must permit both players to open the site.

The OG artwork was generated with the built-in image generation tool. Its exact prompt is recorded in `web/public/og-prompt.txt`. The game graphics and favicon are native, deterministic drawing code.

The app is an independent fan recreation, not an Atari ROM emulator or an official Atari product. No video, ROM, or original game assets are distributed.
