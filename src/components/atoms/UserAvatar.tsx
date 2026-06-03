import { Link, useLocation } from 'react-router-dom';
import { storageUrl } from '../../lib/storage';
import { Avatar } from './Avatar';
import { useAuth } from '../../features/user/context/AuthContext';

type Props = {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  size?: number;
};

export const UserAvatar = ({ userId, name, avatarUrl, size = 40 }: Props) => {
  const location = useLocation();
  const { userId: currentUserId } = useAuth();
  const isMe = currentUserId === userId;
  const targetPath = isMe ? '/mypage' : `/users/${userId}`;
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
      to={targetPath}
      state={{ from: location.pathname }}
      onClick={(e) => e.stopPropagation()}
      style={{ textDecoration: 'none', flexShrink: 0, display: 'inline-flex' }}
    >
      {content}
    </Link>
  );
};
