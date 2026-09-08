import { getStore } from '@netlify/blobs';
import type { RoomRecord, RoomStore } from '../game/room-service';
export const getRooms = () =>
  getStore({ name: 'peek-rooms', consistency: 'strong' });
export const netlifyRoomStore: RoomStore = {
  async get(code) {
    const result = await getRooms().getWithMetadata(code, {
      type: 'json',
      consistency: 'strong',
    });
    return result
      ? { ...(result.data as RoomRecord), storageVersion: result.etag }
      : null;
  },
  async create(room) {
    const result = await getRooms().setJSON(room.code, room, {
      onlyIfNew: true,
      metadata: { expiresAt: room.expires_at },
    });
    return result.modified;
  },
  async save(room, previous) {
    if (!previous.storageVersion) throw new Error('Missing room version');
    const { storageVersion, ...data } = room;
    const result = await getRooms().setJSON(room.code, data, {
      onlyIfMatch: previous.storageVersion,
      metadata: { expiresAt: room.expires_at },
    });
    return result.modified;
  },
};
