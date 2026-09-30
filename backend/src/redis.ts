import Redis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
};

export const redisPublisher = new Redis(redisConfig);
export const redisSubscriber = new Redis(redisConfig);

for (const [name, client] of [
  ['Publisher', redisPublisher],
  ['Subscriber', redisSubscriber],
] as const) {
  client.on('ready', () => console.log(`[Redis] ${name} ready`));
  client.on('error', (err) => console.error(`[Redis] ${name} error:`, err.message));
}