import { createClient } from 'redis';

let client;

export default function redisClient() {
  if (!client) {
    client = createClient({
      url: process.env.UPSTASH_REDIS_URL,
    });

    client.on('error', (err) => {
      console.error('Redis error:', err);
    });
  }

  return client;
}
