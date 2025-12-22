import { Server } from 'socket.io';
import http from 'http';

let io = null;
let socketServer = null;

export function initializeSocket(port = process.env.PORT || 8000) {
  return new Promise((resolve, reject) => {
    if (io) {
      console.warn('⚠️ Socket.IO already initialized');
      return resolve(io);
    }

    // Dummy HTTP handler for health checks
    const requestHandler = (req, res) => {
      if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('✅ Socket.IO server is alive');
      } else {
        res.writeHead(404);
        res.end();
      }
    };

    socketServer = http.createServer(requestHandler);

    io = new Server(socketServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

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
    throw new Error(
      'Socket.IO not initialized. Make sure you only call getSocketInstance in the socket server process.'
    );
  }
  return io;
}
