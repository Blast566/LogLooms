'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type Level = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface DemoDrawerProps {
  apiUrl: string;
}

const DEMO_API_KEY = process.env.NEXT_PUBLIC_DEMO_API_KEY || 'demo_api_key_123';

export default function DemoDrawer({ apiUrl }: DemoDrawerProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  const [customLevel, setCustomLevel] = useState<Level>('INFO');
  const [customMessage, setCustomMessage] = useState('User completed checkout flow');
  const [customEnv, setCustomEnv] = useState('production');
  const [customMetadata, setCustomMetadata] = useState(
    JSON.stringify({ userId: 'usr_9912', cartTotal: 149.99, currency: 'USD' }, null, 2)
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!statusMessage) return;
    const t = setTimeout(() => setStatusMessage(null), 4000);
    return () => clearTimeout(t);
  }, [statusMessage]);

  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const sendTestLog = async (
    level: Level,
    message: string,
    metadata: Record<string, unknown> = {},
    environment = 'production'
  ) => {
    const response = await fetch(`${apiUrl}/api/v1/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': DEMO_API_KEY,
      },
      body: JSON.stringify([
        {
          level,
          message,
          environment,
          timestamp: new Date().toISOString(),
          metadata: { ...metadata, triggeredBy: 'Recruiter Demo Simulator' },
        },
      ]),
    });

    if (!response.ok) {
      throw new Error(`Failed to ingest ${level} log: ${response.status}`);
    }
  };

  const handleSingleLog = async (
    level: Level,
    message: string,
    metadata: Record<string, unknown>
  ) => {
    setLoading(true);
    setStatusMessage(null);
    try {
      await sendTestLog(level, message, metadata, 'production');
      setStatusMessage(`Successfully dispatched [${level}] event!`);
    } catch {
      setStatusMessage('Error posting event to API');
    } finally {
      setLoading(false);
    }
  };

  const sendAllTestLogs = async () => {
    setLoading(true);
    setStatusMessage(null);

    const presets: { level: Level; message: string; metadata: Record<string, unknown> }[] = [
      {
        level: 'INFO',
        message: 'Recruiter verified live user login flow',
        metadata: { userId: 'recruiter_99', action: 'auth_success' },
      },
      {
        level: 'WARN',
        message: 'High memory usage threshold exceeded (88%)',
        metadata: { service: 'logloom-backend', memoryMb: 462 },
      },
      {
        level: 'ERROR',
        message: 'Uncaught Exception in Payment Gateway',
        metadata: {
          orderId: 'ORD-8821',
          stackTrace:
            'Error: Connection timeout at AWS.RDS.postgres:5432\n    at Pool.connect (/app/db.js:42:11)',
        },
      },
    ];

    try {
      const results = await Promise.allSettled(
        presets.map((log) => sendTestLog(log.level, log.message, log.metadata, 'production'))
      );

      const failed = results.filter((r) => r.status === 'rejected').length;

      if (failed === 0) {
        setStatusMessage('Successfully dispatched INFO, WARN, and ERROR events!');
      } else if (failed === presets.length) {
        setStatusMessage('Error: all event requests failed');
      } else {
        setStatusMessage(`Partial success: ${failed} of ${presets.length} failed`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async () => {
    setLoading(true);
    setStatusMessage(null);

    let parsedMetadata: Record<string, unknown> = {};
    if (customMetadata.trim()) {
      try {
        parsedMetadata = JSON.parse(customMetadata);
      } catch {
        setStatusMessage('Error: Invalid JSON in metadata field');
        setLoading(false);
        return;
      }
    }

    try {
      await sendTestLog(customLevel, customMessage, parsedMetadata, customEnv);
      setStatusMessage(`Successfully dispatched custom [${customLevel}] payload!`);
    } catch {
      setStatusMessage('Error posting custom event to API');
    } finally {
      setLoading(false);
    }
  };

  const drawerContent = isOpen ? (
    <div
      data-test="fullscreen-drawer"
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ backgroundColor: '#09090b' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b border-zinc-800 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-semibold text-white">Interactive Simulator</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Trigger live events through the SSE pipeline · Press{' '}
            <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs">
              Esc
            </kbd>{' '}
            to close
          </p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-zinc-400 hover:text-white text-2xl font-mono p-2 rounded hover:bg-zinc-800 transition"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-6 mt-5 p-1 bg-zinc-900 border border-zinc-800 rounded-lg flex-shrink-0">
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition ${
            activeTab === 'presets'
              ? 'bg-purple-950/80 text-purple-300 border border-purple-700/50'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Preset Actions
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-md transition ${
            activeTab === 'custom'
              ? 'bg-purple-950/80 text-purple-300 border border-purple-700/50'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Custom Payload
        </button>
      </div>

      {/* Status Banner */}
      {statusMessage && (
        <div className="mx-6 mt-4 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 flex items-center justify-between flex-shrink-0">
          <span>{statusMessage}</span>
          <span className="text-xs text-zinc-500">Just now</span>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 p-6 min-h-0 overflow-hidden">
        {activeTab === 'presets' ? (
          <div className="h-full grid grid-cols-3 grid-rows-[auto_1fr] gap-4">
            <button
              onClick={sendAllTestLogs}
              disabled={loading}
              className="col-span-3 p-5 rounded-xl bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-lg disabled:opacity-50 transition shadow-lg"
            >
              🚀 Send All Event Types (INFO, WARN, ERROR)
            </button>

            <button
              onClick={() =>
                handleSingleLog('INFO', 'Recruiter verified live user login flow', {
                  userId: 'recruiter_99',
                  action: 'auth_success',
                })
              }
              disabled={loading}
              className="text-left p-6 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 hover:border-blue-500/50 transition disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-lg text-blue-400">INFO Event</span>
                <span className="text-xs text-zinc-500">HTTP 200</span>
              </div>
              <p className="text-sm text-zinc-400">User login authentication success</p>
            </button>

            <button
              onClick={() =>
                handleSingleLog('WARN', 'High memory usage threshold exceeded (88%)', {
                  service: 'logloom-backend',
                  memoryMb: 462,
                })
              }
              disabled={loading}
              className="text-left p-6 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 hover:border-amber-500/50 transition disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-lg text-amber-400">WARN Event</span>
                <span className="text-xs text-zinc-500">Memory Warning</span>
              </div>
              <p className="text-sm text-zinc-400">High memory consumption spike</p>
            </button>

            <button
              onClick={() =>
                handleSingleLog('ERROR', 'Uncaught Exception in Payment Gateway', {
                  orderId: 'ORD-8821',
                  stackTrace:
                    'Error: Connection timeout at AWS.RDS.postgres:5432\n    at Pool.connect (/app/db.js:42:11)',
                })
              }
              disabled={loading}
              className="text-left p-6 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 hover:border-rose-500/50 transition disabled:opacity-50"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-lg text-rose-400">ERROR Event</span>
                <span className="text-xs text-zinc-500">Stack Trace</span>
              </div>
              <p className="text-sm text-zinc-400">Database payment timeout error</p>
            </button>
          </div>
        ) : (
          <div className="h-full grid grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2">
                  Log Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['INFO', 'WARN', 'ERROR', 'DEBUG'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setCustomLevel(lvl)}
                      className={`py-2.5 font-mono text-sm font-bold rounded border transition ${
                        customLevel === lvl
                          ? lvl === 'INFO'
                            ? 'bg-blue-950 text-blue-400 border-blue-600'
                            : lvl === 'WARN'
                              ? 'bg-amber-950 text-amber-400 border-amber-600'
                              : lvl === 'ERROR'
                                ? 'bg-rose-950 text-rose-400 border-rose-600'
                                : 'bg-zinc-800 text-zinc-200 border-zinc-600'
                          : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2">
                  Message
                </label>
                <input
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Describe the event..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 focus:outline-none focus:border-purple-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-400 mb-2">
                  Environment
                </label>
                <select
                  value={customEnv}
                  onChange={(e) => setCustomEnv(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-200 focus:outline-none focus:border-purple-500 text-sm"
                >
                  <option value="development">development</option>
                  <option value="staging">staging</option>
                  <option value="production">production</option>
                </select>
              </div>

              <button
                disabled={loading}
                onClick={handleCustomSubmit}
                className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-base rounded-lg shadow transition disabled:opacity-50"
              >
                {loading ? 'Ingesting Payload...' : '🚀 Dispatch Custom Payload'}
              </button>
            </div>

            <div className="flex flex-col min-h-0">
              <label className="block text-sm font-semibold text-zinc-400 mb-2">
                Metadata (JSON Object)
              </label>
              <textarea
                value={customMetadata}
                onChange={(e) => setCustomMetadata(e.target.value)}
                className="flex-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-zinc-300 font-mono text-sm leading-relaxed focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 text-sm font-semibold text-purple-300 bg-purple-950/80 border border-purple-700/50 hover:bg-purple-900 rounded-md transition flex items-center gap-2 shadow-sm"
      >
        Demo Simulator
      </button>

      {mounted && drawerContent ? createPortal(drawerContent, document.body) : null}
    </>
  );
}