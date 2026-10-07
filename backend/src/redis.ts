import Redis from 'ioredis';

function makeClient(): Redis {
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL);
  }

  return new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
  });
}

export const redisPublisher = makeClient();
export const redisSubscriber = makeClient();

for (const [name, client] of [
  ['Publisher', redisPublisher],
  ['Subscriber', redisSubscriber],
] as const) {
  client.on('ready', () => console.log(`[Redis] ${name} ready`));
  client.on('error', (err) => console.error(`[Redis] ${name} error:`, err.message));
}