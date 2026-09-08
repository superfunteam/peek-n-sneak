import type { Config } from '@netlify/functions';
import { getRooms } from '../room-store';
export default async function cleanup() {
  const store = getRooms();
  const now = Date.now();
  let removed = 0;
  for await (const page of store.list({ paginate: true })) {
    for (const entry of page.blobs) {
      const info = await store.getMetadata(entry.key, {
        consistency: 'strong',
      });
      if (
        info &&
        typeof info.metadata.expiresAt === 'number' &&
        info.metadata.expiresAt < now
      ) {
        await store.delete(entry.key);
        removed++;
      }
    }
  }
  return Response.json({ removed });
}
export const config: Config = { schedule: '@hourly' };
