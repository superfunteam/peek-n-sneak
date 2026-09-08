import type { Config, Context } from '@netlify/functions';
import {
  createRoomService,
  errorResponse,
  RoomError,
  requestBody,
  parseInput,
} from '../../game/room-service';
import { netlifyRoomStore } from '../room-store';
const rooms = createRoomService(netlifyRoomStore);
export default async function handler(request: Request, context: Context) {
  if (request.method !== 'POST')
    return Response.json(
      { error: 'Use POST.' },
      { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } },
    );
  try {
    const body = await requestBody(request);
    const pathname = new URL(request.url).pathname;
    if (pathname === '/api/rooms')
      return Response.json(
        await rooms.createRoom(body.level, body.expert === true),
        { headers: { 'Cache-Control': 'no-store' } },
      );
    const code = context.params.code ?? pathname.split('/').at(-1)!;
    if (body.action === 'join')
      return Response.json(await rooms.joinRoom(code), {
        headers: { 'Cache-Control': 'no-store' },
      });
    const token = request.headers.get('Authorization')?.replace(/^Bearer /, '');
    if (!token) throw new RoomError('A player session is required.', 403);
    const sequence =
      typeof body.sequence === 'number' && Number.isSafeInteger(body.sequence)
        ? body.sequence
        : 0;
    return Response.json(
      await rooms.updateRoom(
        code,
        token,
        body.action ?? 'tick',
        parseInput(body.input),
        sequence,
      ),
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
export const config: Config = { path: ['/api/rooms', '/api/rooms/:code'] };
