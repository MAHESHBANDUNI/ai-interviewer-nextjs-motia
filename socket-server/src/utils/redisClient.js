import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: true,
    rejectUnauthorized: false
  }
});

redisClient.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

await redisClient.connect();

console.log('✅ Redis connected');

export default redisClient;
