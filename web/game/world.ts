export type LevelId = 'houston' | 'dallas' | 'merrimac';
export type RoomKind = 'living' | 'blue' | 'pink' | 'yard';
export type Direction = 'up' | 'down' | 'left' | 'right';
export interface Spot {
  id: string;
  name: string;
  x: number;
  y: number;
  direction: Direction;
}
export interface Door {
  x: number;
  y: number;
  to: string;
  label: string;
  spawnX: number;
  spawnY: number;
}
export interface Room {
  id: string;
  name: string;
  kind: RoomKind;
  house: number;
  spots: Spot[];
  doors: Door[];
}
export const LEVELS = [
  {
    id: 'houston' as const,
    name: 'Houston',
    subtitle: 'The house you remember.',
    number: '01',
    detail: '4 rooms · 20 hiding spots',
    color: '#a5a0ff',
  },
  {
    id: 'dallas' as const,
    name: 'Dallas',
    subtitle: 'Same game. Sneakier corners.',
    number: '02',
    detail: '4 rooms · shifting hiding spots',
    color: '#f1a16e',
  },
  {
    id: 'merrimac' as const,
    name: 'Merrimac',
    subtitle: 'Corpus Christi. Two doors apart.',
    number: '03',
    detail: '2 houses · 1 neighbor between',
    color: '#b7ca66',
  },
];
const spot = (
  id: string,
  name: string,
  x: number,
  y: number,
  direction: Direction,
): Spot => ({ id, name, x, y, direction });
export function makeWorld(level: LevelId, round = 0): Room[] {
  const rooms: Room[] = [];
  for (let house = 0; house < (level === 'merrimac' ? 2 : 1); house++) {
    const suffix = house ? 'b' : 'a';
    const id = (kind: string) => `${kind}-${suffix}`;
    const shift = level === 'dallas' && round % 2 ? 28 : 0;
    rooms.push({
      id: id('living'),
      name: `${house ? 'House 2 · ' : ''}Living room`,
      kind: 'living',
      house,
      spots: [
        spot('sofa-under', 'Under the couch', 202, 142, 'up'),
        spot('sofa-back', 'Behind the couch', 247, 131, 'left'),
        spot('floor-left', 'The left floorboard', 30, 193, 'down'),
        spot('floor-right', 'The right floorboard', 281 - shift, 193, 'down'),
        spot('corner', 'That suspicious corner', 279 - shift, 130, 'up'),
      ],
      doors: [
        {
          x: 8,
          y: 154,
          to: id('blue'),
          label: 'Blue bedroom',
          spawnX: 292,
          spawnY: 155,
        },
        {
          x: 311,
          y: 154,
          to: 'yard',
          label: 'Outside',
          spawnX: level === 'merrimac' ? (house ? 265 : 55) : 159,
          spawnY: 170,
        },
      ],
    });
    rooms.push({
      id: id('blue'),
      name: `${house ? 'House 2 · ' : ''}Blue bedroom`,
      kind: 'blue',
      house,
      spots: [
        spot('bed-side', 'Under the side of the bed', 90, 147, 'up'),
        spot('bed-foot', 'Under the foot of the bed', 50, 163, 'up'),
        spot('closet', 'Inside the closet', 221, 131, 'right'),
        spot('floor-left', 'The loose floorboard', 25 + shift, 192, 'left'),
        spot(
          'wall-right',
          'Inside the right wall',
          297,
          170 + shift / 2,
          'right',
        ),
      ],
      doors: [
        {
          x: 8,
          y: 154,
          to: id('pink'),
          label: 'Pink bedroom',
          spawnX: 292,
          spawnY: 155,
        },
        {
          x: 311,
          y: 154,
          to: id('living'),
          label: 'Living room',
          spawnX: 28,
          spawnY: 155,
        },
      ],
    });
    rooms.push({
      id: id('pink'),
      name: `${house ? 'House 2 · ' : ''}Pink bedroom`,
      kind: 'pink',
      house,
      spots: [
        spot('bed-side', 'Under the side of the bed', 91, 147, 'up'),
        spot('bed-foot', 'Under the foot of the bed', 50, 163, 'up'),
        spot('closet', 'Behind the closet door', 201, 131, 'left'),
        spot('floor-left', 'The impossible floorboard', 139 + shift, 185, 'up'),
        spot(
          'floor-right',
          'Another impossible floorboard',
          265 - shift,
          182,
          'up',
        ),
      ],
      doors: [
        {
          x: 8,
          y: 154,
          to: 'yard',
          label: 'Outside',
          spawnX: level === 'merrimac' ? (house ? 265 : 55) : 159,
          spawnY: 170,
        },
        {
          x: 311,
          y: 154,
          to: id('blue'),
          label: 'Blue bedroom',
          spawnX: 28,
          spawnY: 155,
        },
      ],
    });
  }
  rooms.push({
    id: 'yard',
    name:
      level === 'merrimac'
        ? 'Merrimac Street · Corpus Christi'
        : 'The front yard',
    kind: 'yard',
    house: 0,
    spots:
      level === 'merrimac'
        ? [
            spot('left-house', 'Beside house one', 21, 160, 'right'),
            spot('right-house', 'Beside house two', 298, 160, 'left'),
            spot('walkway', 'Under the sidewalk', 82, 187, 'up'),
            spot('windows', 'Below the windows', 278, 158, 'up'),
            spot('yard-edge', 'The far end of the street', 301, 195, 'right'),
          ]
        : [
            spot('left-house', 'Left side of the house', 81, 152, 'right'),
            spot('right-house', 'Right side of the house', 241, 152, 'left'),
            spot('walkway', 'Under the walkway', 137, 179, 'up'),
            spot('windows', 'Below the windows', 203, 155, 'up'),
            spot('yard-edge', 'At the edge of the yard', 298, 185, 'right'),
          ],
    doors:
      level === 'merrimac'
        ? [
            {
              x: 55,
              y: 144,
              to: 'living-a',
              label: 'House 1',
              spawnX: 290,
              spawnY: 155,
            },
            {
              x: 265,
              y: 144,
              to: 'living-b',
              label: 'House 2',
              spawnX: 290,
              spawnY: 155,
            },
          ]
        : [
            {
              x: 159,
              y: 145,
              to: 'living-a',
              label: 'Living room',
              spawnX: 290,
              spawnY: 155,
            },
            {
              x: 8,
              y: 165,
              to: 'pink-a',
              label: 'Pink bedroom',
              spawnX: 28,
              spawnY: 155,
            },
          ],
  });
  return rooms;
}
export const distance = (
  a: { x: number; y: number },
  b: { x: number; y: number },
) => Math.hypot(a.x - b.x, a.y - b.y);
export function routeTo(
  rooms: Room[],
  from: string,
  to: string,
): Door | undefined {
  const queue: { id: string; first?: Door }[] = [{ id: from }];
  const seen = new Set([from]);
  while (queue.length) {
    const current = queue.shift()!;
    if (current.id === to) return current.first;
    for (const door of rooms.find((r) => r.id === current.id)!.doors)
      if (!seen.has(door.to)) {
        seen.add(door.to);
        queue.push({ id: door.to, first: current.first ?? door });
      }
  }
}
