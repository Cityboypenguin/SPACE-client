import { storageUrl } from '../../lib/storage';
import styles from './CommunityAvatar.module.css';

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
      className={styles.wrap}
      style={{
        width: size,
        height: size,
      }}
    >
      {resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <span className={styles.initial} style={{ fontSize: size * 0.4 }}>
          {name.charAt(0) || '?'}
        </span>
      )}
    </div>
  );
};