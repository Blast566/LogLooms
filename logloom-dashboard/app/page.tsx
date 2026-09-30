'use client';

import { useLogStream, LogEntry } from '@/hooks/useLogStream';
import DemoDrawer from '@/components/demo';

const BADGE_STYLES: Record<LogEntry['level'], string> = {
  ERROR: 'bg-red-900/50 text-red-400 border-red-700',
  WARN: 'bg-yellow-900/50 text-yellow-400 border-yellow-700',
  DEBUG: 'bg-purple-900/50 text-purple-400 border-purple-700',
  INFO: 'bg-blue-900/50 text-blue-400 border-blue-700',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function DashboardPage() {
  const {
    logs,
    totalCount,
    filterLevel,
    setFilterLevel,
    filterEnv,
    setFilterEnv,
    searchQuery,
    setSearchQuery,
  } = useLogStream(`${API_URL}/api/v1/logs/stream`);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-white">LogLoom</span>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Stream Active
            </span>
          </div>
          <DemoDrawer apiUrl={API_URL} />
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">LogLoom Live Observability</h1>
          <p className="text-sm text-slate-400">
            Real-time SSE Log Stream • {totalCount} total events captured
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search logs..."
            className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 flex-1"
          />

          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as 'ALL' | LogEntry['level'])}
            className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200"
          >
            <option value="ALL">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
            <option value="DEBUG">DEBUG</option>
          </select>

          <select
            value={filterEnv}
            onChange={(e) => setFilterEnv(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200"
          >
            <option value="ALL">All Environments</option>
            <option value="development">development</option>
            <option value="staging">staging</option>
            <option value="production">production</option>
          </select>
        </div>

        {/* Log Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg divide-y divide-slate-800">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Waiting for live log stream...
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-800/50">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded border ${BADGE_STYLES[log.level]}`}
                  >
                    {log.level}
                  </span>
                  <span className="text-xs text-slate-500">{log.environment}</span>
                </div>
                <div className="text-sm text-slate-200">{log.message}</div>
                {log.stack_trace && (
                  <pre className="mt-2 text-xs text-red-400 bg-red-950/30 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                    {log.stack_trace}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}