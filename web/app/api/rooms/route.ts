import { createRoom, errorResponse, requestBody } from '@/game/rooms';
export async function POST(request: Request) {
  try {
    const body = await requestBody(request);
    return Response.json(await createRoom(body.level, body.expert === true), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
