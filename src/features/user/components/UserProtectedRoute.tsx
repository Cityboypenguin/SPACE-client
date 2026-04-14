import { Navigate } from 'react-router-dom';
import { USER_TOKEN_KEY } from '../api/auth';

interface Props {
  children: React.ReactNode;
}

export const UserProtectedRoute = ({ children }: Props) => {
  const token = localStorage.getItem(USER_TOKEN_KEY);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};
