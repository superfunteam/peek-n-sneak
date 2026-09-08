import { database } from './index';
import type { RoomStore, RoomRecord } from '../game/room-service';
export const d1RoomStore: RoomStore = {
  async get(code) {
    return database()
      .prepare('SELECT * FROM rooms WHERE code = ?')
      .bind(code)
      .first<RoomRecord>();
  },
  async create(r) {
    const result = await database()
      .prepare(
        'INSERT OR IGNORE INTO rooms (code,state,host_token,guest_token,revision,updated_at,expires_at) VALUES (?,?,?,?,?,?,?)',
      )
      .bind(
        r.code,
        r.state,
        r.host_token,
        r.guest_token,
        r.revision,
        r.updated_at,
        r.expires_at,
      )
      .run();
    return !!result.meta.changes;
  },
  async save(r, previous) {
    const result = await database()
      .prepare(
        'UPDATE rooms SET state = ?, guest_token = ?, revision = ?, updated_at = ? WHERE code = ? AND revision = ?',
      )
      .bind(
        r.state,
        r.guest_token,
        r.revision,
        r.updated_at,
        r.code,
        previous.revision,
      )
      .run();
    return !!result.meta.changes;
  },
  async pruneExpired(now) {
    await database()
      .prepare('DELETE FROM rooms WHERE expires_at < ?')
      .bind(now)
      .run();
  },
};
