import { LogEntry, LogLoomOptions, LogLevel } from './types.js';

export class LogLoom {
  private apiKey: string;
  private endpointUrl: string;
  private batchSize: number;
  private flushIntervalMs: number;
  private environment: string;

  private buffer: LogEntry[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(options: LogLoomOptions) {
    if (!options.apiKey) {
      throw new Error('[LogLoom] API key is required to initialize the logger.');
    }
    this.apiKey = options.apiKey;
    this.endpointUrl = options.endpointUrl || 'http://localhost:3000/api/v1/logs';
    this.batchSize = options.batchSize || 50;
    this.flushIntervalMs = options.flushIntervalMs || 5000;
    this.environment = options.environment || process.env.NODE_ENV || 'development';

    this.startFlushTimer();
    this.registerProcessHandlers();
  }

  private registerProcessHandlers(): void {
    process.on('unhandledRejection', (reason: unknown) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      this.error(`Unhandled Promise Rejection: ${error.message}`, error);
      this.flush();
    });

    process.on('uncaughtException', async (error: Error) => {
      this.error(`Uncaught Exception: ${error.message}`, error);
      await this.flush();
      process.exit(1);
    });

    process.on('beforeExit', async () => {
      await this.flush();
    });
  }

  public log(level: LogLevel, message: string, metadata?: Record<string, unknown>, error?: Error): void {
    const entry: LogEntry = {
      level,
      message,
      environment: this.environment,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
      stack_trace: error?.stack || undefined,
    };

    this.buffer.push(entry);

    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }

  public info(message: string, metadata?: Record<string, unknown>): void {
    this.log('INFO', message, metadata);
  }

  public warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('WARN', message, metadata);
  }

  public error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.log('ERROR', message, metadata, error);
  }

  public debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('DEBUG', message, metadata);
  }

  private startFlushTimer(): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush();
      }
    }, this.flushIntervalMs);

    if (this.timer && typeof this.timer.unref === 'function') {
      this.timer.unref();
    }
  }

  public async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const batch = [...this.buffer];
    this.buffer = [];

    try {
      const response = await fetch(this.endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        console.error(`[LogLoom] Failed to send logs: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('[LogLoom] Failed to transmit log batch', error);
    }
  }
}