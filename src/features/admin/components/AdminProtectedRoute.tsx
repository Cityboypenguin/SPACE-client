import { Navigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
}

export const AdminProtectedRoute = ({ children }: Props) => {
  const token = localStorage.getItem('space_admin_token');
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};
