type Props = {
  name: string;
  accountID: string;
  timestamp?: string;
  small?: boolean;
};

export const UserMeta = ({ name, accountID, timestamp, small }: Props) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: '0.4rem',
      marginBottom: small ? '0.2rem' : '0.25rem',
    }}
  >
    <span style={{ fontWeight: 700, color: '#1e293b', fontSize: small ? '0.9rem' : '0.95rem' }}>
      {name}
    </span>
    <span style={{ color: '#94a3b8', fontSize: small ? '0.82rem' : '0.85rem' }}>@{accountID}</span>
    {timestamp && (
      <span style={{ color: '#94a3b8', fontSize: small ? '0.82rem' : '0.85rem', marginLeft: 'auto' }}>
        {timestamp}
      </span>
    )}
  </div>
);
