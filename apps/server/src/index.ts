import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { ClientToServerEvents, ServerToClientEvents } from '@campus-mafia/types';
import { setupSocketHandlers } from './socket.js';
import { recoverActiveGames } from './gameEngine.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-for-dev';

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

const httpServer = createServer(app);

// Extend socket object with user metadata
export interface AuthenticatedSocket extends Socket<ClientToServerEvents, ServerToClientEvents> {
  user?: {
    id: string;
    name: string;
    avatar: string | null;
  };
  eventTimestamps?: number[];
}

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// JWT authentication middleware
io.use((socket: AuthenticatedSocket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token || typeof token !== 'string') {
    return next(new Error('Authentication error: Token is required'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      name: string;
      avatar: string | null;
    };
    socket.user = decoded;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid or expired token'));
  }
});

// Rate limiting middleware: 10 events/sec per socket
io.on('connection', (socket: AuthenticatedSocket) => {
  socket.eventTimestamps = [];
  
  socket.use((packet, next) => {
    const now = Date.now();
    const RATE_LIMIT_WINDOW_MS = 1000;
    const MAX_EVENTS_PER_WINDOW = 10;

    socket.eventTimestamps = (socket.eventTimestamps || []).filter(
      (t) => now - t < RATE_LIMIT_WINDOW_MS
    );

    if (socket.eventTimestamps.length >= MAX_EVENTS_PER_WINDOW) {
      socket.emit('error', { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded: max 10 events per second' });
      return next(new Error('Rate limit exceeded'));
    }

    socket.eventTimestamps.push(now);
    next();
  });

  console.log(`User connected: ${socket.user?.name} (ID: ${socket.user?.id})`);
  
  // Set up game handlers
  setupSocketHandlers(io, socket);
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user?.name} (ID: ${socket.user?.id})`);
  });
});

httpServer.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await recoverActiveGames(io);
});
