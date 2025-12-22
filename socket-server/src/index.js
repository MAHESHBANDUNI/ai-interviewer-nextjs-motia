import { initializeSocket } from './socket/socket-instance.js';
import redisClient from './utils/redisClient.js';

const SOCKET_PORT = process.env.SOCKET_PORT || 8000;

initializeSocket(SOCKET_PORT)
  .then((io) => {
    console.log('✅ Socket.IO server running on port', SOCKET_PORT);
  io.on('connection', (socket) => {

    // =============================
    // Candidate joins interview
    // =============================
    socket.on('join_candidate', ({ interviewId, candidateId }) => {
      if (!interviewId || !candidateId) return;

      socket.join(`interview:${interviewId}:candidate`);
      socket.data.role = 'candidate';
      socket.data.interviewId = interviewId;

      console.log(`Candidate ${candidateId} joined interview ${interviewId}`);
    });

    // =============================
    // Admin joins interview
    // =============================
    socket.on('join_admin', async ({ interviewId, adminId }) => {
      if (!interviewId || !adminId) return;

      socket.join(`interview:${interviewId}:admins`);
      socket.data.role = 'admin';
      socket.data.interviewId = interviewId;

      // 🔹 Send snapshot
      const raw = await redisClient.hgetall(
        `interview:${interviewId}:messages`
      );

      const messages = Object.values(raw)
        .map(JSON.parse)
        .sort((a, b) => a.timestamp - b.timestamp);

      socket.emit('interview_snapshot', { messages });

      console.log(`Admin ${adminId} joined interview ${interviewId}`);
    });

    // =============================
    // Transcript ingestion
    // =============================
    socket.on('transcript_event', async (data) => {
      // if (socket.data.role !== 'candidate') return;
      console.log('socket.data: ',socket.data);

      const {
        interviewId,
        id,
        role,
        text,
        timestamp,
      } = data;

      if (!interviewId || !id || !text) return;

      const key = `interview:${interviewId}:messages`;

      const existing = await redisClient.hget(key, id);
      if (existing) return;

      const message = {
        id,
        role: role,
        text,
        timestamp: timestamp,
      };

      await redisClient.hset(key, id, JSON.stringify(message));

      // LIVE to admins
      io.to(`interview:${interviewId}:admins`).emit(
        'live_transcript',
        message
      );

      // await redisClient.publish(
      //   `interview:${interviewId}:live`,
      //   JSON.stringify(message)
      // );
    });
  });

  })
  .catch((err) => {
    console.error('❌ Failed to initialize socket server:', err.message);
  });
