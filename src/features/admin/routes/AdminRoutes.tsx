import { Route, Routes, Navigate } from 'react-router-dom';
import { AdminLoginForm } from '../components/AdminLoginForm';
import { AdminDashboard } from '../pages/AdminDashboard';
import { AdminRegisterPage } from '../pages/AdminRegisterPage';
import { AdminUserListPage } from '../pages/AdminUserListPage';
import { AdminUserDetailPage } from '../pages/AdminUserDetailPage';
import { AdminProtectedRoute } from '../components/AdminProtectedRoute';

export const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginForm />} />
      <Route path="register" element={<AdminRegisterPage />} />
      <Route
        index
        element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="users"
        element={
          <AdminProtectedRoute>
            <AdminUserListPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="users/:id"
        element={
          <AdminProtectedRoute>
            <AdminUserDetailPage />
          </AdminProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
};
