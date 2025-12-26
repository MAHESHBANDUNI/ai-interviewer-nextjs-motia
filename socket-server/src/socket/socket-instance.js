import { Server } from 'socket.io';
import http from 'http';
import jwt from 'jsonwebtoken';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config(); // Load .env file

let io = null;
let socketServer = null;

const SOCKET_JWT_SECRET = process.env.SOCKET_JWT_SECRET;

const ALLOWED_ORIGINS =
  process.env.SOCKET_SERVER_ENV === 'production'
    ? [process.env.CLIENT_SERVER_URL]
    : '*';

export async function initializeSocket(port = process.env.PORT || 8080) {
  return new Promise(async (resolve, reject) => {
    if (io) {
      console.warn('⚠️ Socket.IO already initialized');
      return resolve(io);
    }

    const requestHandler = (req, res) => {
      if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Socket.IO server is alive');
      } else {
        res.writeHead(404);
        res.end();
      }
    };

    socketServer = http.createServer(requestHandler);

    io = new Server(socketServer, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
          callback(new Error('CORS not allowed'));
        },
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket'],
      allowEIO3: false,
    });

    /* ================================
       🔐 JWT AUTH (connection-level)
    ================================= */
    io.use((socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) return next(new Error('Auth token missing'));

        const payload = jwt.verify(token, SOCKET_JWT_SECRET);

        socket.data.user = {
          userId: payload.userId,
          role: payload.role,            // 'candidate' | 'admin'
          interviewId: payload.interviewId,
        };

        next();
      } catch {
        next(new Error('Invalid or expired token'));
      }
    });

    /* ================================
       🔁 REDIS ADAPTER (SCALING)
    ================================= */

    const pubClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: retries => Math.min(retries * 50, 2000),
      },
    });

    const subClient = pubClient.duplicate();

    await pubClient.connect();
    await subClient.connect();

    io.adapter(createAdapter(pubClient, subClient));
    console.log('✅ Redis adapter attached');

    socketServer.listen(port, '0.0.0.0', () => {
      console.log(`✅ Socket.IO server running on port ${port}`);
      resolve(io);
    });

    socketServer.on('error', (err) => {
      console.error('❌ Failed to start Socket.IO server:', err);
      reject(err);
    });
  });
}

export function getSocketInstance() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}
