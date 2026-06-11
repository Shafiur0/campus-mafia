import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '@campus-mafia/types';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const getSocket = (token?: string): Socket<ServerToClientEvents, ClientToServerEvents> => {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

  if (!socket && token) {
    socket = io(socketUrl, {
      auth: { token },
      autoConnect: false,
    });
  }

  return socket!;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
