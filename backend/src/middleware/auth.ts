import { Request, Response, NextFunction } from 'express';
import { pool } from '../db.js';

export const validateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const apiKey = req.header('X-API-Key');

  if (!apiKey) {
    res.status(401).json({ error: 'Missing X-API-Key header' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT id FROM projects WHERE api_key = $1',
      [apiKey]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid API Key' });
      return;
    }

    req.projectId = result.rows[0].id;
    next();
  } catch (error) {
    console.error('Authentication Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};