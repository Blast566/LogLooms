import rateLimit from 'express-rate-limit';


export const ingestionRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 100, 
  standardHeaders: true,
  legacyHeaders: false, 
  keyGenerator: (req) => {
    return req.header('X-API-Key') || req.ip || 'anonymous';
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Maximum 100 ingestion requests allowed per minute.',
    });
  },
});