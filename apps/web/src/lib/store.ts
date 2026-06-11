import { create } from 'zustand';
import { RoomPlayer, RoomSettings, RoomStatus } from '@campus-mafia/types';

interface UserState {
  id: string;
  name: string;
  avatar: string | null;
  isGuest: boolean;
}

interface GameState {
  user: UserState | null;
  roomCode: string | null;
  roomId: string | null;
  hostId: string | null;
  roomStatus: RoomStatus | null;
  settings: RoomSettings | null;
  players: RoomPlayer[];
  isConnected: boolean;
  socketId: string | null;
  
  // Setters
  setUser: (user: UserState | null) => void;
  setRoom: (payload: { roomId: string; code: string; hostId: string; status: RoomStatus; settings: RoomSettings; players: RoomPlayer[] } | null) => void;
  updatePlayers: (players: RoomPlayer[]) => void;
  setConnectionStatus: (isConnected: boolean, socketId: string | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  user: null,
  roomCode: null,
  roomId: null,
  hostId: null,
  roomStatus: null,
  settings: null,
  players: [],
  isConnected: false,
  socketId: null,

  setUser: (user) => set({ user }),
  setRoom: (payload) =>
    set({
      roomId: payload?.roomId || null,
      roomCode: payload?.code || null,
      hostId: payload?.hostId || null,
      roomStatus: payload?.status || null,
      settings: payload?.settings || null,
      players: payload?.players || [],
    }),
  updatePlayers: (players) => set({ players }),
  setConnectionStatus: (isConnected, socketId) => set({ isConnected, socketId }),
  reset: () =>
    set({
      roomCode: null,
      roomId: null,
      hostId: null,
      roomStatus: null,
      settings: null,
      players: [],
    }),
}));
