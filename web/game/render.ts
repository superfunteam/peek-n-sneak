import type Phaser from 'phaser';
import { makeWorld, type Room, type LevelId } from './world';
import type { GameState, Player } from './engine';
export const W = 320,
  H = 208;
const N = { ink: 0x10100f, cream: 0xe6dfbd, lime: 0xd0ed67 };
export function drawRoom(
  g: Phaser.GameObjects.Graphics,
  room: Room,
  level: LevelId,
  time: number,
) {
  const r = (c: number, x: number, y: number, w: number, h: number) => {
    g.fillStyle(c);
    g.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const poly = (c: number, points: number[]) => {
    g.fillStyle(c);
    g.fillPoints(
      Array.from({ length: points.length / 2 }, (_, i) => ({
        x: points[i * 2],
        y: points[i * 2 + 1],
      })),
      true,
    );
  };
  r(N.ink, 0, 0, W, H);
  if (room.kind === 'yard') {
    r(level === 'dallas' ? 0x301361 : 0x161581, 0, 28, 320, 136);
    r(0x3d5b20, 0, 150, 320, 58);
    r(0xe0df9f, 26, 58, 7, 6);
    const house = (x: number, w: number, playable: boolean) => {
      const y = level === 'merrimac' ? 91 : 80;
      const h = level === 'merrimac' ? 65 : 78;
      r(playable ? 0x08090a : 0x343033, x, y, w, h);
      poly(0x090909, [
        x - 7,
        y + 14,
        x + w / 2,
        y - 23,
        x + w + 7,
        y + 14,
        x + w + 7,
        y - 10,
        x - 7,
        y - 10,
      ]);
      g.lineStyle(1, 0x535548);
      g.strokeTriangle(x - 7, y + 15, x + w / 2, y - 23, x + w + 7, y + 15);
      r(0x0b0d0b, x + w / 2 - 3, y - 30, 5, 9);
      for (let row = 0; row < 2; row++)
        for (let col = 0; col < 4; col++) {
          r(
            playable ? 0xdcda82 : 0x727057,
            x + 9 + (col * (w - 19)) / 3,
            y + 20 + row * 22,
            5,
            13,
          );
          r(0x151515, x + 9 + (col * (w - 19)) / 3, y + 26 + row * 22, 5, 2);
        }
      r(playable ? 0x717774 : 0x343033, x + w / 2 - 5, y + h - 19, 10, 19);
      if (playable) {
        poly(0x686b56, [
          x + w / 2 - 4,
          y + h,
          x + w / 2 + 5,
          y + h,
          x + w / 2 - 8,
          185,
          x + w / 2 - 37,
          208,
          x + w / 2 - 53,
          208,
          x + w / 2 - 17,
          182,
        ]);
      }
      for (let i = 0; i < 8; i++)
        r(
          0x6d7869,
          x + w / 2 - 8 - i * 7,
          y - 28 - i * 2 + ((Math.sin(time / 1500 + i) * 2) | 0),
          4,
          1,
        );
    };
    if (level === 'merrimac') {
      house(19, 72, true);
      house(123, 74, false);
      house(229, 72, true);
      r(0x56554b, 0, 186, 320, 12);
      for (let i = 0; i < 320; i += 24) r(0xa4a17c, i, 191, 12, 1);
    } else house(81, 158, true);
  } else {
    const pink = room.kind === 'pink';
    const blue = room.kind === 'blue';
    const wall = pink ? 0xac64d2 : blue ? 0xdc9757 : 0x8284ee;
    const side = pink ? 0xcd84ef : blue ? 0xf5bb78 : 0x686ada;
    r(pink ? 0x8c2009 : 0x6f7829, 0, 28, 320, 180);
    r(wall, 64, 28, 256, 103);
    poly(side, [0, 28, 64, 28, 64, 131, 0, 160]);
    r(0x070809, 0, 126, 14, 44);
    r(0x070809, 306, 134, 14, 38);
    if (room.kind === 'living') {
      for (const x of [128, 249]) {
        r(0x111185, x, 59, 23, 43);
        r(wall, x, 79, 23, 3);
      }
      r(0x69be57, 173, 114, 71, 23);
      r(0x80d967, 181, 108, 62, 12);
      r(0x7bd163, 162, 123, 80, 15);
      r(0x5cad47, 162, 135, 82, 5);
      r(0x76c75c, 226, 117, 19, 17);
    } else {
      r(0x73752b, 193, 79, 60, 52);
      r(0x73752b, 75, 111, 61, 17);
      poly(0xebecd5, [75, 127, 136, 127, 75, 159, 14, 159]);
      r(0xb2b735, 14, 159, 61, 5);
      r(0xf2f1df, 78, 130, 37, 4);
    }
  }
}
export function drawPerson(
  g: Phaser.GameObjects.Graphics,
  p: Player,
  color: number,
  time: number,
  eyes = false,
  sink = 0,
) {
  const x = Math.round(p.x),
    y = Math.round(p.y);
  const walk = p.moving ? Math.floor(time / 150) % 2 : 0;
  const face = p.facing === 'left' ? -1 : 1;
  g.fillStyle(color);
  const r = (a: number, b: number, w: number, h: number) =>
    g.fillRect(
      x + a,
      y + Math.round(b * (1 - sink)),
      w,
      Math.max(1, Math.round(h * (1 - sink))),
    );
  r(-4, -28, 8, 3);
  r(-6, -25, 13, 3);
  r(-3, -22, 6, 5);
  r(3 * face, -22, 4, 2);
  r(-2, -17, 4, 10);
  if (eyes) {
    r(-6, -22, 3, 11);
    r(4, -22, 3, 10);
    r(-6, -23, 12, 2);
  } else {
    r(-6, -15, 4, 3);
    r(3, -16, 4, 3);
    r(-7, -14, 2, 7);
    r(6, -16, 2, 6);
  }
  r(-3, -7, 3, walk ? 5 : 7);
  r(1, -7, 3, walk ? 7 : 5);
  r(walk ? -6 : -4, -2, 5, 2);
  r(walk ? 1 : 3, -1, 5, 2);
}
export function drawGame(
  g: Phaser.GameObjects.Graphics,
  s: GameState,
  viewer: number,
  time: number,
  attract = false,
) {
  g.clear();
  const blind = s.phase === 'hide' && viewer === s.seeker && !attract;
  const player = s.players[viewer];
  const room =
    makeWorld(s.level, s.round).find(
      (r) => r.id === (attract ? 'living-a' : player.room),
    ) ?? makeWorld(s.level)[0];
  drawRoom(g, room, s.level, time);
  if (attract) {
    drawPerson(
      g,
      { ...s.players[0], x: 91, y: 171, moving: true },
      N.cream,
      time,
    );
    drawPerson(
      g,
      { ...s.players[1], x: 239, y: 140, moving: false },
      0xb8b485,
      time,
    );
    return;
  }
  if (blind) {
    drawPerson(
      g,
      { ...player, x: 72, y: 142, moving: false },
      viewer === 0 ? N.cream : 0xc3bf96,
      time,
      true,
    );
    return;
  }
  const hiddenSelf = s.phase === 'seek' && viewer !== s.seeker;
  if (!hiddenSelf)
    drawPerson(
      g,
      player,
      viewer === 0 ? N.cream : 0xa8aa98,
      time,
      false,
      s.phase === 'hide' ? Math.min(0.88, s.progress / 0.65) : 0,
    );
  const opponent = s.players[1 - viewer];
  if (
    opponent.room === room.id &&
    (s.phase === 'result' ||
      s.phase === 'finished' ||
      (s.phase === 'seek' && viewer !== s.seeker))
  )
    drawPerson(g, opponent, viewer === 0 ? 0xa8aa98 : N.cream, time);
  if (!hiddenSelf && (s.phase === 'hide' || s.phase === 'seek'))
    for (const sp of room.spots) {
      const checked = s.checked.includes(`${room.id}/${sp.id}`);
      if (checked) {
        // A permanent, high-contrast pixel X records an empty search this round.
        // Expert mode reveals only places the seeker has already checked.
        g.fillStyle(N.ink, 0.9);
        g.fillRect(sp.x - 6, sp.y + 1, 12, 12);
        g.fillStyle(0xf5ac82);
        for (let i = 0; i < 5; i++) {
          g.fillRect(sp.x - 5 + i * 2, sp.y + 2 + i * 2, 2, 2);
          g.fillRect(sp.x + 3 - i * 2, sp.y + 2 + i * 2, 2, 2);
        }
      } else if (!s.expert) {
        g.fillStyle(0xdbdfab, 0.7);
        g.fillRect(sp.x - 1, sp.y + 2, 3, 2);
      }
    }
  if (s.checking && s.progress) {
    g.fillStyle(0x111111);
    g.fillRect(player.x - 10, player.y - 35, 20, 3);
    g.fillStyle(N.lime);
    g.fillRect(
      player.x - 10,
      player.y - 35,
      20 * Math.min(1, s.progress / 0.65),
      3,
    );
  }
}
