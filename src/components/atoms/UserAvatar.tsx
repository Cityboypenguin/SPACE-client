import { Link, useLocation } from 'react-router-dom';
import { storageUrl } from '../../lib/storage';
import { Avatar } from './Avatar';
import { useAuth } from '../../features/user/context/useAuth';
import styles from './UserAvatar.module.css';

type Props = {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  size?: number;
  basePath?: string;
  useMyPageForCurrentUser?: boolean;
};

export const UserAvatar = ({ userId, name, avatarUrl, size = 40, basePath = '/users', useMyPageForCurrentUser = true }: Props) => {
  const location = useLocation();
  const { userId: currentUserId } = useAuth();
  const isMe = useMyPageForCurrentUser && currentUserId === userId;
  const targetPath = isMe ? '/mypage' : `${basePath}/${userId}`;
  const content = avatarUrl ? (
    <img
      src={storageUrl(avatarUrl) ?? undefined}
      alt={name}
      className={styles.image}
      style={{
        width: size,
        height: size,
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
      className={styles.link}
    >
      {content}
    </Link>
  );
};
