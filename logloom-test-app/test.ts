import { LogLoom } from '../logloom-node/dist/index.js';

const logger = new LogLoom({
  apiKey: 'll_726734bbc3ddbaff0718572b864d39ababebda4066f53aca61afed1208d7',
  endpointUrl: 'http://localhost:3000/api/v1/logs',
  batchSize: 10,
  flushIntervalMs: 3000,
  environment: 'development',
});

console.log('--- Starting LogLoom SDK Test ---');

// Trigger 12 logs rapidly (10 will flush immediately via batch threshold, 2 will queue)
for (let i = 1; i <= 12; i++) {
  logger.info(`Test log iteration #${i}`, { index: i });
}

// Simulate an unexpected crash after 5 seconds
setTimeout(() => {
  console.log('--- Simulating Fatal Runtime Crash ---');
  // @ts-ignore
  nonExistentFunctionCall();
}, 5000);