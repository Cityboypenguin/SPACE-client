import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/user/context/useAuth';
import styles from './UserNameLink.module.css';

type Props = {
  userId: string;
  className?: string;
  children: ReactNode;
  basePath?: string;
  useMyPageForCurrentUser?: boolean;
};

export const UserNameLink = ({ userId, className, children, basePath = '/users', useMyPageForCurrentUser = true }: Props) => {
  const location = useLocation();
  const { userId: currentUserId } = useAuth();
  const isMe = useMyPageForCurrentUser && currentUserId === userId;
  const targetPath = isMe ? '/mypage' : `${basePath}/${userId}`;

  return (
    <Link
      to={targetPath}
      state={{ from: location.pathname }}
      onClick={(e) => e.stopPropagation()}
      className={`${styles.link} ${className ?? ''}`}
    >
      {children}
    </Link>
  );
};
