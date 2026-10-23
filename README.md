# LogLoom — Real-Time Log Observability Platform

LogLoom is a full-stack, real-time log observability platform built with TypeScript, Node.js, Express, PostgreSQL, Redis, and React. It combines a custom Node.js logging SDK, a log ingestion API, and a live dashboard that streams incoming logs using Server-Sent Events (SSE).

The project demonstrates custom SDK development, log batching, backend validation, bulk database writes, event-driven architecture, and real-time full-stack data flow.

## Architecture

```text
                   ┌──────────────────────┐
                   │      Client App      │
                   └──────────┬───────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │   logloom-node SDK   │
                   │ Batching & Flushing  │
                   └──────────┬───────────┘
                              │ HTTP POST
                              ▼
                   ┌──────────────────────┐
                   │   Express Backend    │
                   │ Validation & Ingest  │
                   └──────────┬───────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
          ┌─────────────────┐  ┌─────────────────┐
          │   PostgreSQL    │  │  Redis Pub/Sub  │
          │ Persistent Logs │  │ Event Broadcast │
          └────────┬────────┘  └────────┬────────┘
                   │                    │
                   │                    ▼
                   │          ┌─────────────────┐
                   │          │   SSE Stream    │
                   │          └────────┬────────┘
                   │                   │
                   └──────────┬────────┘
                              ▼
                   ┌──────────────────────┐
                   │  React Dashboard     │
                   │ Live Logs & Filters  │
                   └──────────────────────┘
```

## Features

### Custom TypeScript SDK
- **Automatic batching:** Buffers log entries and sends them in batches to reduce HTTP request overhead.
- **Timer-based flushing:** Periodically transmits buffered logs.
- **Crash-aware logging:** Hooks into Node.js process events to attempt a final flush of buffered logs during exceptional shutdown scenarios.
- **Safe buffer draining:** Swaps the active buffer before transmission so new logs can be collected while a batch is in flight.

### Log Ingestion API
- **Bulk PostgreSQL inserts:** Uses `pg-format` to insert multiple log entries in a single database operation.
- **Runtime validation:** Validates incoming payloads with Zod.
- **Rate limiting:** Helps protect the ingestion endpoint from excessive requests.
- **API key authentication:** Supports API-key-based access to the logging pipeline.
- **Persistent storage:** Stores ingested logs in PostgreSQL.

### Real-Time Streaming
- **Redis Pub/Sub:** Distributes newly ingested log events to active subscribers.
- **Server-Sent Events (SSE):** Streams new logs to connected dashboards over persistent HTTP connections.
- **Dedicated subscriber connections:** Duplicates Redis connections for SSE clients so subscriber mode does not block the publisher connection.
- **Low-latency updates:** Updates the dashboard without requiring manual refreshes or repeated polling.

### Interactive Dashboard
- Live log viewer for incoming events.
- Demo simulator for generating synthetic `INFO`, `WARN`, and `ERROR` events.
- Client-side filtering by log level, environment, and search text.
- TypeScript used across the SDK, backend, and frontend.

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React, Tailwind CSS, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Validation | Zod |
| Database | PostgreSQL, `pg`, `pg-format` |
| Messaging | Redis Pub/Sub |
| Streaming | Server-Sent Events (SSE) |
| SDK | TypeScript, Fetch API, Node.js process events |

## Repository Structure

```text
LogLooms/
├── backend/       # Express ingestion API, PostgreSQL, Redis, and SSE
├── frontend/      # Next.js dashboard and log filtering
├── logloom-node/  # Custom TypeScript logging SDK
└── README.md
```

## Getting Started

### Prerequisites

- Node.js v20 or later recommended
- npm
- PostgreSQL running locally
- Redis running locally

### 1. Clone the repository

```bash
git clone https://github.com/Blast566/LogLooms.git
cd LogLooms
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/logloom
REDIS_URL=redis://localhost:6379
API_KEY=demo_api_key_123
FRONTEND_URL=http://localhost:3001
```

Replace the example database credentials with your local PostgreSQL credentials. Make sure the `logloom` database exists, then execute `schema.sql` to create the required tables.

Start the backend:

```bash
npm run dev
```

### 3. Configure the frontend

Open a new terminal from the repository root:

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_API_KEY=demo_api_key_123
```

Start the frontend:

```bash
npm run dev
```

Open `http://localhost:3001` in your browser. If the development server uses a different port by default, configure it to use port `3001` to match the backend's `FRONTEND_URL`.

### 4. Test the pipeline

1. Ensure PostgreSQL and Redis are running.
2. Start the backend and frontend.
3. Open `http://localhost:3001`.
4. Open the **Demo Simulator**.
5. Click **Send All Event Types**.
6. Observe the `INFO`, `WARN`, and `ERROR` events appear in the live log viewer.
7. Try the available log-level, environment, and text filters.

## Engineering Decisions

### Redis subscriber isolation
Redis connections in subscriber mode are dedicated to receiving messages. LogLoom duplicates the Redis client connection for SSE subscriptions, keeping subscriber activity separate from the main publisher connection.

### Buffer draining during transmission
The SDK swaps its active buffer before sending a batch:

```typescript
const batch = [...this.buffer];
this.buffer = [];
```

New log entries can accumulate in the active buffer while the previous batch is in flight, reducing the risk of losing entries generated during transmission.

### Crash-aware flushing
The SDK registers Node.js process event handlers to attempt to flush buffered entries during exceptional shutdown scenarios. This is a best-effort mechanism: process termination or network failures can prevent asynchronous requests from completing, so delivery of every crash log is not guaranteed.

### Bulk database writes
The backend writes multiple log entries in a single PostgreSQL operation rather than issuing one insert per event. This reduces database round trips and provides a foundation for handling higher log volumes.

### Event-driven delivery
Redis Pub/Sub separates ingestion from dashboard delivery. PostgreSQL provides persistent storage, while Redis distributes new events to active SSE clients. Redis Pub/Sub is not durable, so disconnected clients may miss events published while they are offline.

### Type safety and runtime validation
TypeScript helps keep data structures consistent across packages. Zod validates incoming payloads at runtime, complementing compile-time type checking.

## Potential Improvements

- Add retry logic with exponential backoff for failed SDK requests.
- Introduce durable buffering and configurable delivery guarantees.
- Add pagination and server-side filtering for large log volumes.
- Add trace IDs and request correlation for debugging distributed requests.
- Add dashboard authentication and project-level access controls.
- Implement log retention policies and automated cleanup.
- Add Docker Compose for one-command local development.
- Expand automated unit and integration test coverage.
- Add metrics for ingestion throughput, error rates, and active stream connections.
- Support event replay when clients reconnect to the SSE stream.

## What This Project Demonstrates

- Full-stack development with TypeScript and React.
- Backend API design, validation, and rate limiting.
- PostgreSQL integration and bulk data ingestion.
- Event-driven architecture with Redis Pub/Sub.
- Real-time streaming with Server-Sent Events.
- Custom SDK design, batching, and buffer management.
- Process lifecycle handling and failure-aware engineering.
- Separation of concerns across a multi-package repository.

## License

No license is specified yet. Add a `LICENSE` file if you intend to distribute the project or permit reuse under specific terms.
