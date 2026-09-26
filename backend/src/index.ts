import express from 'express';
import dotenv from 'dotenv';
import { pool } from './db.js'
import { validateApiKey} from './middleware/auth.js';
import crypto from 'crypto';
import {z} from 'zod';
import format from 'pg-format';
import {ingestionRateLimiter} from './middleware/rateLimiter.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000; 

app.use(express.json());

app.get('/health', async (req, res) => {
    try{
        const dbResult = await pool.query('SELECT NOW()');
        res.status(200).json({status: 'ok', db_time:dbResult.rows[0].now})
    } catch (error){
        res.status(500).json({status:'error', message: 'Database connection failed'})
    }
});

app.get('/api/v1/auth-test', validateApiKey, (req, res) =>{
    res.status(200).json({ message : 'Authentication successful', projectId : req.projectId})
} );


const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
});


app.post('/api/v1/projects', async (req, res) => {
  try {
    const parsedBody = createProjectSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error: parsedBody.error.issues[0]?.message ?? 'Invalid request body' });
      return;
    }

    const { name } = parsedBody.data;

    
    const apiKey = `ll_${crypto.randomBytes(30).toString('hex')}`;

   
    const result = await pool.query(
      'INSERT INTO projects (name, api_key) VALUES ($1, $2) RETURNING id, name, api_key, created_at',
      [name, apiKey]
    );

 
    res.status(201).json({
      message: 'Project created successfully',
      project: result.rows[0],
    });
  } catch (error) {
    console.error('Project Creation Error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});


const singleLogSchema = z.object({
    level: z.enum(['INFO', 'WARN', 'ERROR', 'DEBUG']),
    message: z.string().min(1, 'Log message cannot be empty'),
    stack_trace: z.string().optional(),
    environment: z.string().default('production'),
    metadata: z.record(z.string(), z.any()).default({}),
    timestamp: z.iso.datetime().optional(),
    
});

const logBatchSchema = z.array(singleLogSchema).min(1).max(500);


app.post('/api/v1/logs', ingestionRateLimiter, validateApiKey, async (req, res) => {
  try {
    const parsedBatch = logBatchSchema.safeParse(req.body);
    if (!parsedBatch.success) {
      res.status(400).json({ 
        error: 'Invalid log batch format', 
        details: parsedBatch.error.flatten().fieldErrors 
      });
      return;
    }

    const logs = parsedBatch.data;
    const projectId = req.projectId;

    // 1. Map log objects into nested arrays of primitive SQL values
    const values = logs.map((log) => [
      projectId,
      log.level,
      log.message,
      log.stack_trace || null,
      log.environment,
      JSON.stringify(log.metadata || {}), // Convert metadata object to JSON string
      log.timestamp || new Date().toISOString(),
    ]);

    // 2. Wrap the %L placeholder in parentheses inside the VALUES clause
    const query = format(
      `INSERT INTO logs (project_id, level, message, stack_trace, environment, metadata, timestamp) 
       VALUES %L RETURNING id`,
      values
    );

    // 3. Execute query
    const result = await pool.query(query);

    res.status(201).json({
      message: 'Logs ingested successfully',
      ingestedCount: result.rowCount ?? result.rows.length,
    });
  } catch (error) {
    console.error('Log Ingestion Error:', error);
    res.status(500).json({ error: 'Failed to ingest log batch' });
  }
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});