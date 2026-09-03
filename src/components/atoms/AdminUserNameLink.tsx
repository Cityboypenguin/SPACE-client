import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

type Props = {
  userId: string;
  className?: string;
  children: ReactNode;
};

export const AdminUserNameLink = ({ userId, className, children }: Props) => {
  const location = useLocation();

  return (
    <Link
      to={`/admin/users/${userId}`}
      state={{ from: location.pathname }}
      onClick={(e) => e.stopPropagation()}
      className={className}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      {children}
    </Link>
  );
};
