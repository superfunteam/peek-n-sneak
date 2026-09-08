import { integer, sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
export const rooms = sqliteTable(
  'rooms',
  {
    code: text('code').primaryKey(),
    state: text('state').notNull(),
    hostToken: text('host_token').notNull(),
    guestToken: text('guest_token'),
    revision: integer('revision').notNull().default(0),
    updatedAt: integer('updated_at').notNull(),
    expiresAt: integer('expires_at').notNull(),
  },
  (t) => [index('rooms_expires_at_idx').on(t.expiresAt)],
);
