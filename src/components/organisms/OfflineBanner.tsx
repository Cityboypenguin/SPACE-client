import { useEffect, useState } from 'react';

export const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
      setShowRecovery(false);
    };
    const handleOnline = () => {
      setIsOnline(true);
      setShowRecovery(true);
      setTimeout(() => setShowRecovery(false), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (isOnline && !showRecovery) return null;

  const online = isOnline && showRecovery;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9998,
        padding: '0.6rem 1rem',
        background: online ? '#14532d' : '#7f1d1d',
        color: online ? '#86efac' : '#fca5a5',
        textAlign: 'center',
        fontSize: '0.875rem',
        fontWeight: 600,
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
      }}
    >
      <span aria-hidden="true">{online ? '✓' : '📡'}</span>
      {online
        ? 'ネットワーク接続が回復しました'
        : 'ネットワーク接続を確認してください'}
      {!online && (
        <button
          onClick={() => window.location.reload()}
          style={{
            marginLeft: '0.75rem',
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            borderRadius: 6,
            color: '#fca5a5',
            fontSize: '0.8rem',
            padding: '0.2rem 0.6rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          再試行
        </button>
      )}
    </div>
  );
};
