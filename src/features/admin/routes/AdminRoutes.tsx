import { lazy } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { AdminLoginForm } from '../components/organisms/AdminLoginForm';
import { AdminProtectedRoute } from './AdminProtectedRoute';

const AdminDashboard = lazy(() => import('../pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminRegisterPage = lazy(() => import('../pages/AdminRegisterPage').then((m) => ({ default: m.AdminRegisterPage })));
const AdminUserListPage = lazy(() => import('../pages/AdminUserListPage').then((m) => ({ default: m.AdminUserListPage })));
const AdminUserDetailPage = lazy(() => import('../pages/AdminUserDetailPage').then((m) => ({ default: m.AdminUserDetailPage })));
const AdminUserEditPage = lazy(() => import('../pages/AdminUserEditPage').then((m) => ({ default: m.AdminUserEditPage })));
const AdminUserProfilePage = lazy(() => import('../pages/AdminUserProfilePage').then((m) => ({ default: m.AdminUserProfilePage })));
const AdminAdministratorListPage = lazy(() => import('../pages/AdminAdministratorsListPage').then((m) => ({ default: m.AdminAdministratorListPage })));
const AdminAdministratorEditPage = lazy(() => import('../pages/AdminAdministratorEditPage').then((m) => ({ default: m.AdminAdministratorEditPage })));
const AdminCommunityListPage = lazy(() => import('../pages/AdminCommunityListPage').then((m) => ({ default: m.AdminCommunityListPage })));
const AdminCommunityDetailPage = lazy(() => import('../pages/AdminCommunityDetailPage').then((m) => ({ default: m.AdminCommunityDetailPage })));
const AdminPostListPage = lazy(() => import('../pages/AdminPostListPage').then((m) => ({ default: m.AdminPostListPage })));
const AdminPostDetailPage = lazy(() => import('../pages/AdminPostDetailPage').then((m) => ({ default: m.AdminPostDetailPage })));
const ReportsPage = lazy(() => import('../pages/AdminReportListPage').then((m) => ({ default: m.ReportsPage })));
const AdminInquiryListPage = lazy(() => import('../pages/AdminInquiryListPage').then((m) => ({ default: m.AdminInquiryListPage })));
const AdminInquiryDetailPage = lazy(() => import('../pages/AdminInquiryDetailPage').then((m) => ({ default: m.AdminInquiryDetailPage })));
const AdminAnnouncementListPage = lazy(() => import('../pages/AdminAnnouncementListPage').then((m) => ({ default: m.AdminAnnouncementListPage })));
const AdminAnnouncementCreatePage = lazy(() => import('../pages/AdminAnnouncementCreatePage').then((m) => ({ default: m.AdminAnnouncementCreatePage })));
const AdminAnnouncementDetailPage = lazy(() => import('../pages/AdminAnnouncementDetailPage').then((m) => ({ default: m.AdminAnnouncementDetailPage })));
const AdminTermsCreatePage = lazy(() => import('../pages/AdminTermsCreatePage').then((m) => ({ default: m.AdminTermsCreatePage })));
const AdminTermsListPage = lazy(() => import('../pages/AdminTermsListPage').then((m) => ({ default: m.AdminTermsListPage })));
const AdminTermsDetailPage = lazy(() => import('../pages/AdminTermsDetailPage').then((m) => ({ default: m.AdminTermsDetailPage })));
const AdminMaintenancePage = lazy(() => import('../pages/AdminMaintenancePage').then((m) => ({ default: m.AdminMaintenancePage })));
const AdminAnalyticsPage = lazy(() => import('../pages/AdminAnalyticsPage').then((m) => ({ default: m.AdminAnalyticsPage })));
const AdminCourseManagementPage = lazy(() => import('../pages/AdminCourseManagementPage').then((m) => ({ default: m.AdminCourseManagementPage })));
const AdminCourseChatDetailPage = lazy(() => import('../pages/AdminCourseChatDetailPage').then((m) => ({ default: m.AdminCourseChatDetailPage })));

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
        path="administrators/:id"
        element={
          <AdminProtectedRoute>
            <AdminAdministratorEditPage />
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
      <Route
        path="posts/:id"
        element={
          <AdminProtectedRoute>
            <AdminPostDetailPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="reports"
        element={
          <AdminProtectedRoute>
            <ReportsPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="inquiries"
        element={
          <AdminProtectedRoute>
            <AdminInquiryListPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="inquiries/:id"
        element={
          <AdminProtectedRoute>
            <AdminInquiryDetailPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="announcements"
        element={
          <AdminProtectedRoute>
            <AdminAnnouncementListPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="announcements/new"
        element={
          <AdminProtectedRoute>
            <AdminAnnouncementCreatePage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="announcements/:id"
        element={
          <AdminProtectedRoute>
            <AdminAnnouncementDetailPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="terms"
        element={
          <AdminProtectedRoute>
            <AdminTermsListPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="terms/new"
        element={
          <AdminProtectedRoute>
            <AdminTermsCreatePage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="terms/:id"
        element={
          <AdminProtectedRoute>
            <AdminTermsDetailPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="maintenance"
        element={
          <AdminProtectedRoute>
            <AdminMaintenancePage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="analytics"
        element={
          <AdminProtectedRoute>
            <AdminAnalyticsPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="courses"
        element={
          <AdminProtectedRoute>
            <AdminCourseManagementPage />
          </AdminProtectedRoute>
        }
      />
      <Route
        path="courses/:id"
        element={
          <AdminProtectedRoute>
            <AdminCourseChatDetailPage />
          </AdminProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
};
