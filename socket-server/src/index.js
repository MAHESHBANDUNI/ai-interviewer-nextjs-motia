import { initializeSocket } from './socket/socket-instance.js';
import redisClient from './utils/redisClient.js';
import dotenv from 'dotenv';
dotenv.config(); // Load .env file

const SOCKET_PORT = process.env.SOCKET_PORT || 8080;
const client = await redisClient();

initializeSocket(SOCKET_PORT).then((io) => {
  io.on('connection', (socket) => {
    const { role, interviewId, userId } = socket.data.user;
    console.log('User: ', socket.data.user);

    // Candidate joins interview
    socket.on('join_candidate', () => {
      if (role !== 'Candidate') return;

      socket.join(`interview:${interviewId}:candidate`);
      console.log(`Candidate ${userId} joined ${interviewId}`);
    });

    // Admin joins interview
    socket.on('join_admin', async () => {
      if (role !== 'Admin') return;

      socket.join(`interview:${interviewId}:admins`);

      const raw = await client.hGetAll(
        `interview:${interviewId}:messages`
      );

      const messages = Object.values(raw)
        .map(JSON.parse)
        .sort((a, b) => a.timestamp - b.timestamp);

      socket.emit('interview_snapshot', { messages });

      console.log(`Admin ${userId} joined ${interviewId}`);
    });

    // Transcript ingestion
    socket.on('transcript_event', async ({ id, text, role, timestamp, interviewDuration }) => {
      const key = `interview:${interviewId}:messages`;

      // TTL only once
      await client.expire(key, interviewDuration * 60, 'NX');

      const message = {
        id,
        role,
        text,
        timestamp,
      };

      console.log('Message: ',message);

      await client.hSet(key, id, JSON.stringify(message));

      io.to(`interview:${interviewId}:admins`).emit(
        'live_transcript',
        { payload: message }
      );
    });
  });
});
