import {Pool} from 'pg';
import 'dotenv/config';

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

pool.on('connect', () =>{
    console.log('connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unxpected PostgreSQl client error:', err);
});