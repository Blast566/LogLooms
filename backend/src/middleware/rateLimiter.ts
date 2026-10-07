import { Request, Response, NextFunction } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { redisPublisher } from '../redis';

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 1000;

export const ingestionRateLimiter = rateLimit({
  windowMs: WINDOW_SECONDS * 1000,
  max: MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req) => {
    const apiKey = req.header('X-API-Key') || req.header('x-api-key');
    if (apiKey) return apiKey;
    return ipKeyGenerator(req.ip ?? 'unknown');  // ✅ IPv6-safe
  },
  message: { error: 'Too many requests, please slow down.' },
});