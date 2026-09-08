import {
  errorResponse,
  joinRoom,
  updateRoom,
  parseInput,
  requestBody,
  RoomError,
} from '@/game/rooms';
export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const body = await requestBody(request);
    if (body.action === 'join')
      return Response.json(await joinRoom(code), {
        headers: { 'Cache-Control': 'no-store' },
      });
    const token = request.headers.get('Authorization')?.replace(/^Bearer /, '');
    if (!token) throw new RoomError('A player session is required.', 403);
    const sequence =
      typeof body.sequence === 'number' && Number.isSafeInteger(body.sequence)
        ? body.sequence
        : 0;
    return Response.json(
      await updateRoom(
        code,
        token,
        body.action ?? 'tick',
        parseInput(body.input),
        sequence,
      ),
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return errorResponse(e);
  }
}
