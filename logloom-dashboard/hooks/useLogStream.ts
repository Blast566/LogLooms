'use client';

import { useEffect, useState } from 'react';

export interface LogEntry {
  id: string;
  project_id: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  stack_trace?: string | null;
  environment: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export function useLogStream(streamUrl: string) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<'ALL' | LogEntry['level']>('ALL');
  const [filterEnv, setFilterEnv] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const eventSource = new EventSource(streamUrl);

    eventSource.onopen = () => {
      console.log('Connected to SSE log stream');
    };

    eventSource.onmessage = (event) => {
      try {
        const incomingLogs: LogEntry | LogEntry[] = JSON.parse(event.data);
        const newEntries = Array.isArray(incomingLogs) ? incomingLogs : [incomingLogs];

        // Prepend new logs so freshest logs appear at the top
        setLogs((prev) => [...newEntries, ...prev]);
      } catch (err) {
        console.error('Failed to parse SSE event data:', err);
      }
    };

    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) {
        console.error('SSE connection permanently closed');
      } else {
        console.warn('SSE connection interrupted, reconnecting...');
      }
    };

    return () => {
      eventSource.close();
    };
  }, [streamUrl]);

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = filterLevel === 'ALL' || log.level === filterLevel;
    const matchesEnv = filterEnv === 'ALL' || log.environment === filterEnv;
    const matchesSearch =
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.stack_trace && log.stack_trace.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesLevel && matchesEnv && matchesSearch;
  });

  return {
    logs: filteredLogs,
    totalCount: logs.length,
    filterLevel,
    setFilterLevel,
    filterEnv,
    setFilterEnv,
    searchQuery,
    setSearchQuery,
  };
}