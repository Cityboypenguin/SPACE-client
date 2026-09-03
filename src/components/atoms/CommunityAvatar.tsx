import { storageUrl } from '../../lib/storage';

type Props = {
  name: string;
  src?: string | null;
  directSrc?: string | null;
  size?: number;
};

export const CommunityAvatar = ({ name, src, directSrc, size = 40 }: Props) => {
  const isNone = !src || src.includes('none') || src === '';
  const resolvedSrc = directSrc ?? (!isNone ? storageUrl(src) : null);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        background: '#e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <span style={{ fontSize: size * 0.4, fontWeight: 700, color: '#64748b', userSelect: 'none' }}>
          {name.charAt(0) || '?'}
        </span>
      )}
    </div>
  );
};