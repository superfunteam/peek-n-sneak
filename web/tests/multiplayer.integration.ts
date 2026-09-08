import assert from 'node:assert/strict';
const base = process.env.TEST_ORIGIN ?? 'http://localhost:3000';
const post = async (path: string, body: unknown, token?: string) => {
  const response = await fetch(base + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: response.status, data: (await response.json()) as any };
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const created = await post('/api/rooms', { level: 'merrimac', expert: false });
assert.equal(created.status, 200, created.data.error);
const host = created.data;
assert.ok(host.token);
assert.equal(host.game.players[1].room, 'hidden');
const path = '/api/rooms/' + host.code;
const joined = await post(path, { action: 'join' });
assert.equal(joined.status, 200, joined.data.error);
const guest = joined.data;
assert.ok(guest.token);
assert.equal(guest.player, 1);
assert.equal((await post(path, { action: 'join' })).status, 409);
assert.equal((await post(path, { action: 'tick' }, 'invalid')).status, 403);
assert.equal((await post('/api/rooms', { level: 'moon' })).status, 400);
assert.equal((await post('/api/rooms', null)).status, 400);
let seq = 0;
let h = host,
  g = guest;
const tick = async (input = { x: 0, y: 0, action: false }, who = 1) => {
  const results = await Promise.all([
    post(
      path,
      {
        action: 'tick',
        sequence: ++seq,
        input: who === 0 ? input : { x: 0, y: 0, action: false },
      },
      host.token,
    ),
    post(
      path,
      {
        action: 'tick',
        sequence: ++seq,
        input: who === 1 ? input : { x: 0, y: 0, action: false },
      },
      guest.token,
    ),
  ]);
  assert.equal(results[0].status, 200);
  assert.equal(results[1].status, 200);
  h = results[0].data;
  g = results[1].data;
  await wait(130);
};
const approach = async (who: number, x: number, y: number) => {
  for (let i = 0; i < 80; i++) {
    const s = who === 0 ? h : g;
    const p = s.game.players[who];
    const d = Math.hypot(x - p.x, y - p.y);
    if (d < 6) {
      // Allow previously submitted movement to settle before judging arrival.
      await tick({ x: 0, y: 0, action: false }, who);
      await tick({ x: 0, y: 0, action: false }, who);
      const stopped = (who === 0 ? h : g).game.players[who];
      if (Math.hypot(x - stopped.x, y - stopped.y) < 15) return;
      continue;
    }
    // Ease off near the target so this real-network test tolerates round-trip
    // latency instead of oscillating at full speed around a hiding place.
    const speed = Math.max(0.2, Math.min(1, d / 60));
    await tick(
      { x: ((x - p.x) / d) * speed, y: ((y - p.y) / d) * speed, action: false },
      who,
    );
  }
  assert.fail(
    `Player ${who} did not reach hiding place: ${JSON.stringify((who === 0 ? h : g).game.players[who])}`,
  );
};
await tick();
assert.equal(h.started, true);
assert.equal(h.game.players[1].room, 'hidden');
await approach(1, 202, 142);
for (let i = 0; i < 25 && g.game.phase === 'hide'; i++) {
  await tick({ x: 0, y: 0, action: true }, 1);
  assert.equal(h.game.hidden, null);
  assert.equal(h.game.checking, null);
}
assert.equal(g.game.phase, 'seek');
assert.equal(g.game.hidden.spot, 'sofa-under');
assert.equal(h.game.hidden, null);
await approach(0, 202, 142);
for (let i = 0; i < 25 && h.game.phase === 'seek'; i++)
  await tick({ x: 0, y: 0, action: true }, 0);
await tick();
assert.equal(h.game.phase, 'result');
assert.equal(h.game.scores[0], 1);
assert.equal(g.game.scores[0], 1);
const reconnect = await post(
  path,
  { action: 'tick', sequence: ++seq, input: { x: 0, y: 0, action: false } },
  host.token,
);
assert.equal(reconnect.status, 200);
assert.equal(reconnect.data.game.scores[0], 1);
const left = await post(
  path,
  { action: 'leave', sequence: ++seq },
  guest.token,
);
assert.equal(left.data.game.phase, 'finished');
const survivor = await post(
  path,
  { action: 'tick', sequence: ++seq },
  host.token,
);
assert.equal(survivor.data.left, 1);
assert.equal(survivor.data.game.winner, 0);
console.log(
  'PASS: create, join, full-room rejection, authentication, malformed requests, concurrent live inputs, private hiding, finding/scoring, reconnect, and leaving.',
);
