LogLoom — Real-Time Log Observability Platform
LogLoom is a full-stack, end-to-end log observability platform built from scratch. It consists of a custom TypeScript SDK for batching and transmitting logs, a high-performance Express/PostgreSQL ingestion backend, and a live React dashboard that streams logs in real time via Server-Sent Events (SSE) and Redis Pub/Sub.

This project was built to demonstrate real-time distributed architecture, custom SDK development, and modern full-stack engineering.

Architecture
text
[ Client App ] 
      │ 
      ▼ (uses)
[ logloom-node SDK ] ──(HTTP POST)──▶ [ Express Backend ] 
                                            │
                                      ┌─────┴─────┐
                                      ▼           ▼
                               [ PostgreSQL ]  [ Redis Pub/Sub ]
                                      │           │
                                      ▼           ▼ (SSE Stream)
                               [ React Dashboard ]
✨ Key Features
Custom TypeScript SDK (logloom-node): Features automatic batching, timer-based auto-flushing, and Node.js process hooks to capture unhandled exceptions before crashing.

High-Throughput Ingestion: Express backend equipped with Zod validation, rate limiting, and bulk PostgreSQL inserts using pg-format.

Real-Time Streaming: Uses Redis Pub/Sub and Server-Sent Events (SSE) to push new logs to the dashboard in sub-second time.

Interactive Demo Simulator: A built-in UI tool that lets users trigger synthetic INFO, WARN, and ERROR events to watch the full pipeline execute live.

Advanced Filtering: Real-time client-side filtering by log level, environment, and search text.

Strict Type Safety: Completely written in TypeScript with strict configurations across all packages.

Repository Structure
This is a monorepo containing the full stack:

backend/: The Express ingestion API and SSE streaming server.

logloom-node/: The custom TypeScript SDK for client applications to send logs.

frontend/: The Next.js / React live observability dashboard.

Tech Stack
Layer	Technology
Frontend	Next.js, React, Tailwind CSS, TypeScript
Backend	Node.js, Express, TypeScript, Zod, pg
Database	PostgreSQL
Messaging	Redis Pub/Sub
SDK	TypeScript, fetch, Node.js Event Hooks
Local Development Setup
Prerequisites
Node.js (v20+ recommended)

PostgreSQL running locally

Redis running locally

1. Clone the repository
bash
git clone https://github.com/Blast566/LogLooms.git
cd LogLooms
2. Setup the Backend
bash
cd backend
npm install
Create a .env file in the backend/ directory:

env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/logloom
REDIS_URL=redis://localhost:6379
API_KEY=demo_api_key_123
FRONTEND_URL=http://localhost:3001
Note: Ensure you have run the SQL in schema.sql to create the logs and projects tables in your database.

Start the server:

bash
npm run dev
3. Setup the Frontend
In a new terminal window:

bash
cd frontend
npm install
Create a .env.local file in the frontend/ directory:

env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_API_KEY=demo_api_key_123
Start the frontend:

bash
npm run dev
Open http://localhost:3001 in your browser.

How to Test the Pipeline
Open the dashboard at http://localhost:3001.

Click the "Demo Simulator" button in the top right.

Click "Send All Event Types".

Watch as the INFO, WARN, and ERROR logs instantly travel through the Express backend, hit PostgreSQL, broadcast via Redis, and render on the screen via SSE.

Design Decisions & Engineering Challenges
Redis Subscriber Locking: In Redis, a connection in subscriber mode can only receive messages. The backend uses .duplicate() to spawn dedicated Redis connections for each SSE client, ensuring the main publisher connection remains unblocked.

Atomic Buffer Draining: The SDK uses a swap-based array drain (const batch = [...this.buffer]; this.buffer = [];) to ensure that logs generated while an HTTP request is in flight are not lost.

Graceful Shutdowns: The SDK hooks into Node's uncaughtException and beforeExit events to perform a final flush before the host process dies, ensuring critical crash logs are never lost.

End-to-End Type Safety: Interfaces like LogEntry are shared conceptually between the SDK, backend, and frontend to ensure data integrity from transmission to rendering.
