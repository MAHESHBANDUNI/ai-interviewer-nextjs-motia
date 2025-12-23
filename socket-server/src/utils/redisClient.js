import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config(); // Load .env file

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
}); // This connects automatically

export default redisClient;