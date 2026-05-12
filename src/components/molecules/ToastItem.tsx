import type { Toast } from '../../context/ToastContext';

const TYPE_STYLES: Record<
  Toast['type'],
  { bg: string; color: string; borderColor: string; icon: string }
> = {
  info: { bg: '#1e293b', color: '#93c5fd', borderColor: '#3b82f6', icon: 'ℹ' },
  error: { bg: '#1e293b', color: '#fca5a5', borderColor: '#f43f5e', icon: '✕' },
  warning: { bg: '#1e293b', color: '#fde68a', borderColor: '#f59e0b', icon: '⚠' },
  success: { bg: '#1e293b', color: '#86efac', borderColor: '#22c55e', icon: '✓' },
};

type Props = {
  toast: Toast;
  onDismiss: (id: string) => void;
};

export const ToastItem = ({ toast, onDismiss }: Props) => {
  const s = TYPE_STYLES[toast.type];
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        borderRadius: 10,
        background: s.bg,
        color: s.color,
        borderLeft: `4px solid ${s.borderColor}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
        minWidth: 280,
        maxWidth: 400,
        fontSize: '0.875rem',
        fontWeight: 500,
        animation: 'slideIn 0.2s ease',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span aria-hidden="true" style={{ fontWeight: 700 }}>
          {s.icon}
        </span>
        {toast.message}
      </span>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="閉じる"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
          fontSize: '1rem',
          padding: 0,
          opacity: 0.6,
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
};
