import { Navigate } from 'react-router-dom';
import { ADMIN_TOKEN_KEY } from '../api/auth';

interface Props {
  children: React.ReactNode;
}

export const AdminProtectedRoute = ({ children }: Props) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};
