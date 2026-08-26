import { useMemo } from 'react';

type Props = {
  currentCreatedAt?: string;
  prevCreatedAt?: string;
};

export const ChatDateSeparator = ({ currentCreatedAt, prevCreatedAt }: Props) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };
  const shouldShow = useMemo(() => {
    const currentStr = formatDate(currentCreatedAt);
    const prevStr = formatDate(prevCreatedAt);
    return currentStr && currentStr !== prevStr ? currentStr : null;
  }, [currentCreatedAt, prevCreatedAt]);
  if (!shouldShow) return null;

  return (
    <div 
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        margin: '1.5rem 0 1rem', 
        width: '100%',
        userSelect: 'none'
      }}
    >
      <span 
        style={{
          fontSize: '0.78rem',
          color: 'var(--color-text-muted)',
          background: 'var(--color-surface)',
          padding: '4px 14px',
          borderRadius: 20,
          fontWeight: 500,
          letterSpacing: '0.05em'
        }}
      >
        {shouldShow}
      </span>
    </div>
  );
};