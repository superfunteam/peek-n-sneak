import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame,
  stepGame,
  advanceGame,
  hideAt,
  nextRound,
  publicState,
  EMPTY_INPUT,
  activePlayer,
} from '../game/engine';
import { makeWorld, routeTo, LEVELS } from '../game/world';
const idle = [EMPTY_INPUT, EMPTY_INPUT] as [
  typeof EMPTY_INPUT,
  typeof EMPTY_INPUT,
];
for (const level of LEVELS) {
  test(`${level.name}: every scene and hiding spot is reachable`, () => {
    const world = makeWorld(level.id);
    assert.equal(world.length, level.id === 'merrimac' ? 7 : 4);
    for (const room of world) {
      assert.equal(room.spots.length, 5);
      for (const spot of room.spots) {
        assert.ok(spot.x >= 4 && spot.x <= 316);
        assert.ok(spot.y >= 129 && spot.y <= 196);
      }
      for (const other of world)
        if (room.id !== other.id)
          assert.ok(
            routeTo(world, room.id, other.id),
            `${room.id} → ${other.id}`,
          );
    }
  });
  test(`${level.name}: every hiding spot can be hidden in and found`, () => {
    for (const room of makeWorld(level.id, 1))
      for (const spot of room.spots) {
        const game = createGame(level.id);
        Object.assign(game.players[1], {
          room: room.id,
          x: spot.x,
          y: spot.y,
          facing: spot.direction,
        });
        advanceGame(game, [EMPTY_INPUT, { x: 0, y: 0, action: true }], 0.8);
        assert.equal(game.phase, 'seek', `${room.id}/${spot.id}`);
        assert.equal(game.hidden?.spot, spot.id);
        Object.assign(game.players[0], {
          room: room.id,
          x: spot.x,
          y: spot.y,
          facing: spot.direction,
        });
        advanceGame(game, [{ x: 0, y: 0, action: true }, EMPTY_INPUT], 0.8);
        assert.equal(game.phase, 'result', `${room.id}/${spot.id}`);
        assert.equal(game.scores[0], 1);
      }
  });
  test(`${level.name}: honest bot can traverse and complete search`, () => {
    const s = createGame(level.id, false, 123);
    s.seeker = 1;
    hideAt(s, 'living-a', 'sofa-under');
    for (let t = 0; t < 2010 && s.phase === 'seek'; t++)
      stepGame(s, idle, 0.1, 1);
    assert.equal(s.phase, 'result');
    assert.ok(s.checked.length > 0);
    assert.equal(s.scores[1], 1, 'Bot should eventually search this spot');
  });
}
test('Merrimac has exactly two playable houses sharing one street', () => {
  const w = makeWorld('merrimac');
  assert.equal(w.filter((r) => r.kind === 'living').length, 2);
  assert.deepEqual(
    w.find((r) => r.id === 'yard')!.doors.map((d) => d.to),
    ['living-a', 'living-b'],
  );
});
test('Dallas variable hiding spots change across rounds', () => {
  assert.notDeepEqual(
    makeWorld('dallas', 1)[0].spots,
    makeWorld('dallas', 2)[0].spots,
  );
  assert.deepEqual(makeWorld('houston', 1), makeWorld('houston', 2));
});
test('seek timer runs 4× slower and expires at 200 seconds', () => {
  const s = createGame();
  hideAt(s, 'pink-a', 'closet');
  for (let i = 0; i < 1990; i++) stepGame(s, idle, 0.1);
  assert.equal(s.phase, 'seek');
  for (let i = 0; i < 11; i++) stepGame(s, idle, 0.1);
  assert.equal(s.phase, 'result');
  assert.equal(s.scores[1], 1);
});
test('hide automatically completes within 50 seconds', () => {
  const s = createGame();
  for (let i = 0; i < 501; i++) stepGame(s, idle, 0.1);
  assert.equal(s.phase, 'seek');
  assert.ok(s.hidden);
});
test('seeker never receives hidden spot, hider coordinates, or hide progress', () => {
  const s = createGame();
  s.checking = 'pink-a/closet';
  s.progress = 0.4;
  const view = publicState(s, 0);
  assert.equal(view.hidden, null);
  assert.equal(view.players[1].room, 'hidden');
  assert.equal(view.checking, null);
  assert.equal(view.progress, 0);
  hideAt(s, 'pink-a', 'closet');
  assert.equal(publicState(s, 0).hidden, null);
  assert.equal(publicState(s, 1).hidden?.spot, 'closet');
  assert.equal(
    s.players[1].room,
    'living-a',
    'Projection must not mutate the game',
  );
});
test('roles alternate and match ends after four rounds', () => {
  const s = createGame();
  for (let r = 1; r <= 4; r++) {
    assert.equal(s.round, r);
    assert.equal(s.seeker, (r - 1) % 2);
    s.phase = 'result';
    nextRound(s);
  }
  assert.equal(s.phase, 'finished');
});
test('inactive seeker cannot move while hider is hiding', () => {
  const s = createGame();
  const x = s.players[0].x;
  advanceGame(s, [{ x: 1, y: 0, action: true }, EMPTY_INPUT], 1);
  assert.equal(s.players[0].x, x);
});
test('diagonal movement is normalized and bounded', () => {
  const a = createGame(),
    b = createGame();
  a.seeker = b.seeker = 1;
  advanceGame(a, [{ x: 1, y: 0, action: false }, EMPTY_INPUT], 0.3);
  advanceGame(b, [{ x: 1, y: 1, action: false }, EMPTY_INPUT], 0.3);
  assert.ok(
    Math.abs(
      Math.hypot(a.players[0].x - 73, a.players[0].y - 160) -
        Math.hypot(b.players[0].x - 73, b.players[0].y - 160),
    ) < 0.01,
  );
});
test('expert spots require the correct entry direction', () => {
  const s = createGame('houston', true);
  s.seeker = 1;
  Object.assign(s.players[0], { x: 202, y: 142, facing: 'down' });
  advanceGame(s, [{ x: 0, y: 0, action: true }, EMPTY_INPUT], 1);
  assert.equal(s.phase, 'hide');
  s.players[0].facing = 'up';
  advanceGame(s, [{ x: 0, y: 0, action: true }, EMPTY_INPUT], 1);
  assert.equal(s.phase, 'seek');
});
test('bot search decisions do not depend on secret hiding location', () => {
  const a = createGame('dallas', false, 777);
  a.seeker = 1;
  hideAt(a, 'pink-a', 'closet');
  const b = structuredClone(a);
  b.hidden = { room: 'yard', spot: 'yard-edge' };
  for (let i = 0; i < 30; i++) {
    stepGame(a, idle, 0.1, 1);
    stepGame(b, idle, 0.1, 1);
  }
  assert.deepEqual(a.players, b.players);
  assert.deepEqual(a.botOrder, b.botOrder);
});
test('movement through a doorway changes room and does not bounce back', () => {
  const s = createGame();
  s.seeker = 1;
  Object.assign(s.players[0], { x: 16, y: 154 });
  stepGame(s, [{ x: -1, y: 0, action: false }, EMPTY_INPUT], 0.1);
  assert.equal(s.players[0].room, 'blue-a');
  for (let i = 0; i < 3; i++)
    stepGame(s, [{ x: -1, y: 0, action: false }, EMPTY_INPUT], 0.1);
  assert.equal(s.players[0].room, 'blue-a');
});

// Expert movement should pull into the spot, as in the original cartridge.
test('holding the correct direction enters an expert hiding spot', () => {
  const s = createGame('houston', true);
  s.seeker = 1;
  Object.assign(s.players[0], { x: 202, y: 155, facing: 'up' });
  advanceGame(s, [{ x: 0, y: -1, action: false }, EMPTY_INPUT], 1);
  assert.equal(s.phase, 'seek');
  assert.equal(s.hidden?.spot, 'sofa-under');
});
