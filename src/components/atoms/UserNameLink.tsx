import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/user/context/AuthContext';

type Props = {
  userId: string;
  className?: string;
  children: ReactNode;
};

export const UserNameLink = ({ userId, className, children }: Props) => {
  const location = useLocation();
  const { userId: currentUserId } = useAuth();
  const isMe = currentUserId === userId;
  const targetPath = isMe ? '/mypage' : `/users/${userId}`;

  return (
    <Link
      to={targetPath}
      state={{ from: location.pathname }}
      onClick={(e) => e.stopPropagation()}
      className={className}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      {children}
    </Link>
  );
};
