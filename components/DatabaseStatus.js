'use client';
import { useState, useEffect } from 'react';

export default function DatabaseStatus({ status, onRetry, errorMessage }) {
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (status !== 'disconnected') {
      setCountdown(15);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onRetry?.();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, onRetry]);

  if (status === 'connected') return null;

  // Checking / loading state
  if (status === 'checking') {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, rgba(108, 60, 225, 0.08) 0%, rgba(139, 92, 246, 0.12) 100%)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          className="flex flex-col items-center gap-5 p-10 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(108, 60, 225, 0.12)',
            boxShadow: '0 20px 60px rgba(108, 60, 225, 0.1), 0 4px 16px rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* Spinner */}
          <div className="relative w-12 h-12">
            <div
              className="absolute inset-0 rounded-full animate-spin"
              style={{
                border: '3px solid rgba(108, 60, 225, 0.15)',
                borderTopColor: '#6C3CE1',
              }}
            />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-slate-800">Memeriksa koneksi database...</p>
            <p className="text-sm text-slate-500 mt-1">Mohon tunggu sebentar</p>
          </div>
        </div>
      </div>
    );
  }

  // Disconnected state
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0F0F1A 0%, #1A1035 40%, #0F0F1A 100%)',
      }}
    >
      {/* Decorative gradient orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6C3CE1, transparent 70%)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #8B5CF6, transparent 70%)' }}
      />

      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(108, 60, 225, 0.2)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.4), 0 0 60px rgba(108, 60, 225, 0.08)',
        }}
      >
        <div className="p-8 sm:p-10">
          {/* Database Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(108, 60, 225, 0.2), rgba(139, 92, 246, 0.15))',
                border: '1px solid rgba(108, 60, 225, 0.25)',
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-white mb-2">
            Database Tidak Terhubung
          </h2>

          {/* Description */}
          <p className="text-center text-slate-400 text-sm leading-relaxed mb-6">
            Aplikasi tidak dapat terhubung ke database. Pastikan MySQL server sudah berjalan.
          </p>

          {/* Error Message */}
          {errorMessage && (
            <div
              className="mb-6 p-4 rounded-xl overflow-x-auto"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <code className="text-xs text-red-400 font-mono break-all leading-relaxed">
                {errorMessage}
              </code>
            </div>
          )}

          {/* Troubleshooting */}
          <div
            className="mb-6 p-5 rounded-xl"
            style={{
              background: 'rgba(108, 60, 225, 0.06)',
              border: '1px solid rgba(108, 60, 225, 0.12)',
            }}
          >
            <h3 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Troubleshooting
            </h3>
            <ul className="space-y-2.5">
              {[
                'Pastikan MAMP/MySQL sudah berjalan di port 8889',
                'Pastikan database \'designbaju\' sudah dibuat',
                'Periksa konfigurasi di file .env.local',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400">
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: '#8B5CF6' }}
                  />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Retry Button */}
          <button
            onClick={onRetry}
            className="w-full py-3 px-6 rounded-xl text-white font-semibold text-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #6C3CE1, #8B5CF6)',
              boxShadow: '0 4px 20px rgba(108, 60, 225, 0.35)',
            }}
          >
            Coba Lagi
          </button>

          {/* Auto-retry countdown */}
          <p className="text-center text-xs text-slate-500 mt-4">
            Mencoba ulang otomatis dalam{' '}
            <span className="text-purple-400 font-semibold">{countdown}</span>{' '}
            detik...
          </p>
        </div>
      </div>
    </div>
  );
}
