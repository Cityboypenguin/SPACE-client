import { Route, Routes, Navigate } from 'react-router-dom';
import { AdminLoginForm } from '../components/AdminLoginForm';
import { AdminDashboard } from '../pages/AdminDashboard';
import { AdminProtectedRoute } from '../components/AdminProtectedRoute';

export const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginForm />} />
      <Route
        path="dashboard"
        element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
};
