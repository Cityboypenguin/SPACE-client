import { ErrorIcon, type ErrorIconType } from '../atoms/ErrorIcon';

type Action = {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
};

type Props = {
  iconType: ErrorIconType;
  title: string;
  description: string;
  actions?: Action[];
  compact?: boolean;
};

export const ErrorCard = ({ iconType, title, description, actions, compact = false }: Props) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      padding: compact ? '1.5rem' : '3rem 2rem',
      gap: '0.75rem',
    }}
  >
    <ErrorIcon type={iconType} size={compact ? 40 : 64} />
    <h2 style={{ margin: 0, fontSize: compact ? '1rem' : '1.25rem', fontWeight: 700 }}>
      {title}
    </h2>
    <p
      style={{
        margin: 0,
        color: '#94a3b8',
        fontSize: compact ? '0.85rem' : '0.95rem',
        maxWidth: 400,
        lineHeight: 1.6,
      }}
    >
      {description}
    </p>
    {actions && actions.length > 0 && (
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginTop: '0.5rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            style={{
              background: action.variant === 'secondary' ? 'none' : '#646cff',
              color: action.variant === 'secondary' ? '#94a3b8' : '#fff',
              border: action.variant === 'secondary' ? '1px solid #374151' : 'none',
              borderRadius: 8,
              padding: '0.5rem 1.25rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'opacity 0.15s',
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    )}
  </div>
);
