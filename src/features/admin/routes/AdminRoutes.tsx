import { Route, Routes, Navigate } from 'react-router-dom';
import { AdminLoginForm } from '../components/organisms/AdminLoginForm';
import { AdminDashboard } from '../pages/AdminDashboard';
import { AdminRegisterPage } from '../pages/AdminRegisterPage';
import { AdminUserListPage } from '../pages/AdminUserListPage';
import { AdminUserDetailPage } from '../pages/AdminUserDetailPage';
import { AdminUserEditPage } from '../pages/AdminUserEditPage';
import { AdminUserProfilePage } from '../pages/AdminUserProfilePage';
import { AdminProtectedRoute } from '../components/AdminProtectedRoute';
import { AdminAdministratorListPage } from '../pages/AdminAdministratorsListPage';
import { AdminCommunityListPage } from '../pages/AdminCommunityListPage';
import { AdminCommunityDetailPage } from '../pages/AdminCommunityDetailPage';
import { AdminPostListPage } from '../pages/AdminPostListPage';

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
      <Route
        path="users/:id/edit"
        element={
          <AdminProtectedRoute>
            <AdminUserEditPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="users/:id/profile"
        element={
          <AdminProtectedRoute>
            <AdminUserProfilePage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="administrators"
        element={
          <AdminProtectedRoute>
            <AdminAdministratorListPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="communities"
        element={
          <AdminProtectedRoute>
            <AdminCommunityListPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="communities/:id"
        element={
          <AdminProtectedRoute>
            <AdminCommunityDetailPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="posts"
        element={
          <AdminProtectedRoute>
            <AdminPostListPage />
          </AdminProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
};
