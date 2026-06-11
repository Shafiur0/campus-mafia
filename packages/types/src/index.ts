export type Role =
  | 'STUDENT'
  | 'ASSIGNMENT_MAFIA'
  | 'TEACHER'
  | 'ATTENDANCE_POLICE'
  | 'CR'
  | 'CANTEEN_SPY'
  | 'CHATGPT_HELPER';

export type RoomStatus = 'LOBBY' | 'NIGHT' | 'DAY' | 'VOTING' | 'ENDED';

export type Side = 'STUDENTS' | 'MAFIA';

export interface RoomSettings {
  maxPlayers: number;
  rolesConfig: Record<Role, number>;
  votingMode: 'majority' | 'plurality';
  timeouts: {
    lobby: number;
    night: number;
    day: number;
    voting: number;
  };
}

export interface User {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  isGuest: boolean;
  createdAt: Date;
}

export interface RoomPlayer {
  id: string;
  roomId: string;
  userId: string;
  role: Role | null;
  isAlive: boolean;
  isReady: boolean;
  user: User;
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  status: RoomStatus;
  settings: RoomSettings;
  createdAt: Date;
  players: RoomPlayer[];
}

export interface MatchPlayer {
  id: string;
  matchId: string;
  userId: string;
  role: Role;
  isAlive: boolean;
  won: boolean;
  user: User;
}

export interface Match {
  id: string;
  roomId: string;
  winningSide: Side;
  summary: string | null;
  startedAt: Date;
  endedAt: Date | null;
  players: MatchPlayer[];
}

// Socket Events Payload Types
export interface ClientToServerEvents {
  'room:create': (payload: { settings: RoomSettings; userId: string; userName: string; avatar: string | null }) => void;
  'room:join': (payload: { code: string; userId: string; userName: string; avatar: string | null }) => void;
  'room:ready': (payload: { roomId: string; userId: string }) => void;
  'game:start': (payload: { roomId: string; userId: string }) => void;
  'night:action': (payload: { roomId: string; userId: string; actionType: Role; targetId: string }) => void;
  'day:chat': (payload: { roomId: string; userId: string; message: string }) => void;
  'vote:cast': (payload: { roomId: string; userId: string; targetId: string }) => void;
  'vote:confirm': (payload: { roomId: string; userId: string }) => void;
  'meeting:emergency': (payload: { roomId: string; userId: string }) => void;
  'hint:send': (payload: { roomId: string; userId: string; hint: string }) => void;
}

export interface ServerToClientEvents {
  'room:updated': (payload: { players: RoomPlayer[]; settings: RoomSettings; status: RoomStatus; code: string; hostId: string; roomId: string }) => void;
  'game:started': (payload: { phase: RoomStatus; round: number }) => void;
  'role:assigned': (payload: { role: Role; abilities: string[] }) => void;
  'phase:change': (payload: { phase: RoomStatus; duration: number; roundNumber: number }) => void;
  'night:result': (payload: { eliminatedId: string | null; savedId: string | null }) => void;
  'day:message': (payload: { senderId: string; senderName: string; avatar: string | null; message: string; timestamp: string }) => void;
  'vote:update': (payload: { votes: Record<string, number> }) => void;
  'vote:result': (payload: { eliminatedId: string | null; voteBreakdown: Record<string, string[]> }) => void;
  'game:ended': (payload: { winningSide: Side; mvp: string; stats: Record<string, number>; summary: string | null }) => void;
  'mafia:chat': (payload: { senderId: string; senderName: string; avatar: string | null; message: string }) => void;
  'player:status': (payload: { playerId: string; isAlive: boolean }) => void;
  'error': (payload: { code: string; message: string }) => void;
}
