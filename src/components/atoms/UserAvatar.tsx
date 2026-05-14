import { Link } from 'react-router-dom';
import { storageUrl } from '../../lib/storage';
import { Avatar } from './Avatar';

type Props = {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  size?: number;
};

export const UserAvatar = ({ userId, name, avatarUrl, size = 40 }: Props) => {
  const content = avatarUrl ? (
    <img
      src={storageUrl(avatarUrl) ?? undefined}
      alt={name}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        objectFit: 'cover',
        display: 'block',
        flexShrink: 0,
      }}
    />
  ) : (
    <Avatar name={name} size={size} />
  );

  return (
    <Link
      to={`/users/${userId}`}
      onClick={(e) => e.stopPropagation()}
      style={{ textDecoration: 'none', flexShrink: 0, display: 'inline-flex' }}
    >
      {content}
    </Link>
  );
};
