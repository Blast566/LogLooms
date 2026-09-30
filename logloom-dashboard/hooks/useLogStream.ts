'use client';

import { useEffect, useMemo, useState } from 'react';

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

const MAX_LOGS = 5000;

export function useLogStream(streamUrl: string) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<'ALL' | LogEntry['level']>('ALL');
  const [filterEnv, setFilterEnv] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (event) => {
      try {
        const incomingLogs: LogEntry | LogEntry[] = JSON.parse(event.data);
        const newEntries = Array.isArray(incomingLogs) ? incomingLogs : [incomingLogs];

        setLogs((prev) => {
          const seen = new Set(prev.map((l) => l.id));
          const unique = newEntries.filter((l) => !seen.has(l.id));
          return [...unique, ...prev].slice(0, MAX_LOGS);
        });
      } catch (err) {
        console.error('Failed to parse SSE event data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
    };

    return () => {
      eventSource.close();
    };
  }, [streamUrl]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesLevel = filterLevel === 'ALL' || log.level === filterLevel;
      const matchesEnv = filterEnv === 'ALL' || log.environment === filterEnv;
      const matchesSearch =
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.stack_trace?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      return matchesLevel && matchesEnv && matchesSearch;
    });
  }, [logs, filterLevel, filterEnv, searchQuery]);

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