# Peek 'n Sneak

An independent browser tribute to the wonderfully weird 1982 Atari hide-and-seek game. Built from five-second samples of the supplied [gameplay video](https://www.youtube.com/watch?v=WZsCDIfyh6A).

The application lives in **web/**. It includes Phaser’s flat Canvas renderer, phone-first touch controls, keyboard and tap-to-walk movement, solo matches against an honest bot, live invitation-based two-player games, three neighborhoods, original-style timers, expert directional hiding, synthesized square-wave sounds, optional CRT scanlines, a favicon, and an Open Graph share card.

## Play and deploy

Play at **https://peek-n-sneak.superfun.games**. The Netlify project is `peek-n-sneak`, linked to `superfunteam/peek-n-sneak` on GitHub. Pushes to `main` automatically build and publish the site. `netlify.toml` defines the build, functions, cache headers, and client routing.

From the repository root:

```sh
npm --prefix web ci
npx netlify-cli@27.5.0 link --id e0577f41-7603-4b30-912d-5b663dc1d8e7
npx netlify-cli@27.5.0 dev
```

The complete game opens at http://localhost:8888. Solo play runs entirely in the browser. The production multiplayer service uses Netlify Blobs with no database credentials or migration. The current Netlify Dev Blobs emulator does not return the ETags required by atomic room updates, so test live multiplayer on a Netlify draft deploy or use the original local D1 server below.

To publish manually from the root:

```sh
npx netlify-cli@27.5.0 deploy --build --prod
```

## Verify

```sh
cd web
npm run typecheck
npm test
TEST_ORIGIN=https://your-draft-url.netlify.app npm run test:multiplayer
npm run build:netlify
```

Engine tests exercise every hiding spot, graph reachability, both roles, timers, expert mode, bot fairness, and seeker privacy. Multiplayer integration tests create two real sessions and exercise simultaneous input, finding/scoring, reconnect, authorization, and leaving. Set `TEST_ORIGIN=https://peek-n-sneak.superfun.games` to test production.

For full local multiplayer through the original Sites/Cloudflare D1 adapter, run `npm run db:local` and then `npm run dev` from `web/`. In another terminal run `npm run test:multiplayer` (port 3000). `npm run build` verifies that deployment target as well.

## Layout

- `web/game/world.ts`: scene graph, doors, hiding places, and neighborhoods.
- `web/game/engine.ts`: deterministic game rules, bot AI, movement, timing, scoring, and safe player projections.
- `web/game/render.ts`: original-style flat room geometry and animated player sprites.
- `web/game/room-service.ts`: shared authoritative multiplayer matches, expiring sessions, and optimistic concurrency.
- `web/netlify/`: static client entry, room API functions, and Netlify Blobs storage with strong reads and atomic version checks.
- `web/game/rooms.ts` and `web/db/room-store.ts`: original Cloudflare D1 storage adapter.
- `web/components/game/`: Phaser/React bridge, player controller, and multitouch controls.
- `web/app/api/rooms/`: create, join, synchronize, rematch, and leave endpoints.
- `web/db/` and `web/drizzle/`: durable room schema and migrations.
- `docs/reference-study.md`: video observations and deliberate browser adaptations.

Online room input/state updates run approximately every 120 ms plus network latency. Session secrets are private per tab; invitations contain only a random room ID. Expired inputs stop movement after 650 ms. Rooms expire after 24 hours; a scheduled Netlify function removes expired records hourly. The server removes secret hider data before responding to the seeker. Platform access must permit both players to open the site.

The OG artwork was generated with the built-in image generation tool. Its exact prompt is recorded in `web/public/og-prompt.txt`. The game graphics and favicon are native, deterministic drawing code.

The app is an independent fan recreation, not an Atari ROM emulator or an official Atari product. No video, ROM, or original game assets are distributed.
