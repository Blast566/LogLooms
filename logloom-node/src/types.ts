export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogEntry{
    level: LogLevel;
    message: string;
    timestamp?:string;
    environment?: string;
    stack_trace?:string;
    metadata?:Record<string, unknown>; 
}

export interface LogLoomOptions{
    apiKey: string;
    endpointUrl?: string;
    batchSize?: number;
    flushIntervalMs?:number;
    environment?: string;
}