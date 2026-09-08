import { d1RoomStore } from '@/db/room-store';
import { createRoomService } from './room-service';
export * from './room-service';
export const { createRoom, joinRoom, updateRoom } =
  createRoomService(d1RoomStore);
