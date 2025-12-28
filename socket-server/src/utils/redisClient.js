import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

let client;

export default async function redisClient() {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL
    });

    client.on("error", (err) => {
      console.error("Redis error:", err);
    });

    await client.connect();
  }

  return client;
}
