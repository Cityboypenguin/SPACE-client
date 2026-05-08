import { UserAvatar } from '../../../../components/atoms/UserAvatar';
import { Avatar } from '../../../../components/atoms/Avatar';

type Props = {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  error?: string;
  placeholder?: string;
  rows?: number;
  submitLabel?: string;
  submittingLabel?: string;
  iconSize?: number;
  userId?: string | null;
  avatarUrl?: string | null;
  userName?: string;
};

export const PostComposer = ({
  value,
  onChange,
  onSubmit,
  submitting,
  error,
  placeholder = 'いまどうしてる？',
  rows = 3,
  submitLabel = '投稿する',
  submittingLabel = '投稿中...',
  iconSize = 44,
  userId,
  avatarUrl,
  userName = '',
}: Props) => (
  <div style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', display: 'flex', gap: '0.75rem' }}>
    {userId && userName ? (
      <UserAvatar userId={userId} name={userName} avatarUrl={avatarUrl} size={iconSize} />
    ) : userName ? (
      <Avatar name={userName} size={iconSize} />
    ) : (
      <div
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#646cff,#a78bfa)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: iconSize >= 40 ? '1.2rem' : '1rem',
          flexShrink: 0,
        }}
      >
        ✍️
      </div>
    )}
    <div style={{ flex: 1 }}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{
          width: '100%',
          border: 'none',
          borderBottom: '1px solid #e2e8f0',
          outline: 'none',
          resize: 'none',
          fontSize: rows >= 3 ? '1.05rem' : '0.95rem',
          color: '#1e293b',
          background: 'transparent',
          padding: '0.25rem 0',
          boxSizing: 'border-box',
        }}
      />
      {error && (
        <p style={{ color: 'red', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>{error}</p>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: rows >= 3 ? '0.5rem' : '0.4rem' }}>
        <button
          onClick={onSubmit}
          disabled={!value.trim() || submitting}
          style={{
            padding: rows >= 3 ? '0.45rem 1.2rem' : '0.4rem 1rem',
            borderRadius: '20px',
            background: value.trim() && !submitting ? '#646cff' : '#c7d2fe',
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            fontSize: rows >= 3 ? '0.9rem' : '0.85rem',
            cursor: value.trim() && !submitting ? 'pointer' : 'default',
            transition: 'background 0.1s',
          }}
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </div>
  </div>
);
