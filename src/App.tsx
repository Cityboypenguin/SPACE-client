import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/organisms/ToastContainer';
import { OfflineBanner } from './components/organisms/OfflineBanner';
import { NotFoundPage } from './components/pages/NotFoundPage';
import { MaintenancePage } from './components/pages/MaintenancePage';
import { MaintenanceGuardLayout } from './components/MaintenanceGuardLayout';
import { UserProtectedRoute } from './features/user/components/UserProtectedRoute';
import { NotificationProvider } from './features/user/context/NotificationContext';

const AdminRoutes = lazy(() =>
  import('./features/admin/routes/AdminRoutes').then((m) => ({ default: m.AdminRoutes })),
);
const UserLoginForm = lazy(() =>
  import('./features/user/components/organisms/UserLoginForm').then((m) => ({ default: m.UserLoginForm })),
);
const UserRegisterPage = lazy(() =>
  import('./features/user/pages/UserRegisterPage').then((m) => ({ default: m.UserRegisterPage })),
);
const UserDashboard = lazy(() =>
  import('./features/user/pages/UserDashboard').then((m) => ({ default: m.UserDashboard })),
);
const UserSettingsPage = lazy(() =>
  import('./features/user/pages/UserSettingsPage').then((m) => ({ default: m.UserSettingsPage })),
);
const UserSearchPage = lazy(() =>
  import('./features/user/pages/UserSearchPage').then((m) => ({ default: m.UserSearchPage })),
);
const UserPublicProfilePage = lazy(() =>
  import('./features/user/pages/UserPublicProfilePage').then((m) => ({ default: m.UserPublicProfilePage })),
);
const DMListPage = lazy(() =>
  import('./features/user/pages/DMListPage').then((m) => ({ default: m.DMListPage })),
);
const DMPage = lazy(() =>
  import('./features/user/pages/DMPage').then((m) => ({ default: m.DMPage })),
);
const CommunityListPage = lazy(() =>
  import('./features/user/pages/CommunityListPage').then((m) => ({ default: m.CommunityListPage })),
);
const CommunityBoardListPage = lazy(() =>
  import('./features/user/pages/CommunityBoardListPage').then((m) => ({ default: m.CommunityBoardListPage })),
);
const CommunityCreatePage = lazy(() =>
  import('./features/user/pages/CommunityCreatePage').then((m) => ({ default: m.CommunityCreatePage })),
);
const CommunityRoomPage = lazy(() =>
  import('./features/user/pages/CommunityRoomPage').then((m) => ({ default: m.CommunityRoomPage })),
);
const CommunityEditPage = lazy(() =>
  import('./features/user/pages/CommunityEditPage').then((m) => ({ default: m.CommunityEditPage })),
);
const CommunityMembersPage = lazy(() =>
  import('./features/user/pages/CommunityMembersPage').then((m) => ({ default: m.CommunityMembersPage })),
);
const UserProfileEditPage = lazy(() =>
  import('./features/user/pages/UserProfileEditPage').then((m) => ({ default: m.UserProfileEditPage })),
);
const UserInfoEditPage = lazy(() =>
  import('./features/user/pages/UserInfoEditPage').then((m) => ({ default: m.UserInfoEditPage })),
);
const PostListPage = lazy(() =>
  import('./features/user/pages/PostListPage').then((m) => ({ default: m.PostListPage })),
);
const PostDetailPage = lazy(() =>
  import('./features/user/pages/PostDetailPage').then((m) => ({ default: m.PostDetailPage })),
);
const InquiryPage = lazy(() =>
  import('./features/user/pages/InquiryPage').then((m) => ({ default: m.InquiryPage })),
);
const FavoriteUsersPage = lazy(() =>
  import('./features/user/pages/FavoriteUsersPage').then((m) => ({ default: m.FavoriteUsersPage })),
);
const BlockedUsersPage = lazy(() =>
  import('./features/user/pages/BlockedUsersPage').then((m) => ({ default: m.BlockedUsersPage })),
);
const NotificationListPage = lazy(() =>
  import('./features/user/pages/NotificationListPage').then((m) => ({ default: m.NotificationListPage })),
);
const NotificationDetailPage = lazy(() =>
  import('./features/user/pages/NotificationDetailPage').then((m) => ({ default: m.NotificationDetailPage })),
);
const AnnouncementDetailPage = lazy(() =>
  import('./features/user/pages/AnnouncementDetailPage').then((m) => ({ default: m.AnnouncementDetailPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('./features/user/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);
function App() {
  return (
    <ToastProvider>
      <NotificationProvider>
        <OfflineBanner />
        <ToastContainer />
        <Suspense fallback={<p>読み込み中...</p>}>
          <Routes>
            {/* メンテナンスページと管理画面はガード対象外 */}
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/admin/*" element={<AdminRoutes />} />

            {/* ユーザー向けルートはすべてメンテナンスガードを通す */}
            <Route element={<MaintenanceGuardLayout />}>
              <Route path="/" element={<UserLoginForm />} />
              <Route path="/login" element={<UserLoginForm />} />
              <Route path="/register" element={<UserRegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/inquiry" element={<InquiryPage />} />
              <Route
                path="/mypage"
                element={
                  <UserProtectedRoute>
                    <UserDashboard />
                  </UserProtectedRoute>
                }
              />
              <Route
                path="/mypage/settings"
                element={
                  <UserProtectedRoute>
                    <UserSettingsPage />
                  </UserProtectedRoute>
                }
              />
              <Route
                path="/mypage/profile-edit"
                element={
                  <UserProtectedRoute>
                    <UserProfileEditPage />
                  </UserProtectedRoute>
                }
              />
              <Route
                path="/mypage/user-info-edit"
                element={
                  <UserProtectedRoute>
                    <UserInfoEditPage />
                  </UserProtectedRoute>
                }
              />
              <Route
                path="/mypage/favorites"
                element={
                  <UserProtectedRoute>
                    <FavoriteUsersPage />
                  </UserProtectedRoute>
                }
              />
              <Route
                path="/mypage/blocks"
                element={
                  <UserProtectedRoute>
                    <BlockedUsersPage />
                  </UserProtectedRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <UserProtectedRoute>
                    <UserSearchPage />
                  </UserProtectedRoute>
                }
              />
              <Route
                path="/users/:id"
                element={
                  <UserProtectedRoute>
                    <UserPublicProfilePage />
                  </UserProtectedRoute>
                }
              />
              <Route
                path="/dm"
                element={
                  <UserProtectedRoute>
                    <DMListPage />
                  </UserProtectedRoute>
                }
              />
              <Route
                path="/dm/:roomId"
                element={
                  <UserProtectedRoute>
                    <DMPage />
                  </UserProtectedRoute>
                }
              />
              <Route
                path="/community"
                element={
                  <UserProtectedRoute>
                    <CommunityListPage />
                  </UserProtectedRoute>
                }
              />
              <Route
                path="/community/browse"
                element={
                  <UserProtectedRoute>
                    <CommunityBoardListPage />
                  </UserProtectedRoute>
                }
              />
              <Route
                path="/community/create"
                element={
                  <UserProtectedRoute>
                    <CommunityCreatePage />
                  </UserProtectedRoute>
                }
              />
              <Route
                path="/community/chat/:roomId"
                element={
                  <UserProtectedRoute>
                    <CommunityRoomPage />
                  </UserProtectedRoute>
                }
              />
              <Route
                path="/community/edit/:communityID"
                element={
                  <UserProtectedRoute>
                    <CommunityEditPage />
                  </UserProtectedRoute>
                }
              />
              <Route
                path="/community/members/:communityID"
                element={
                  <UserProtectedRoute>
                    <CommunityMembersPage />
                  </UserProtectedRoute>
                }
              />
              <Route
                path="/home"
                element={
                  <UserProtectedRoute>
                    <PostListPage />
                  </UserProtectedRoute>
                }
              />
              <Route
                path="/posts/:id"
                element={
                  <UserProtectedRoute>
                    <PostDetailPage />
                  </UserProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <UserProtectedRoute>
                    <NotificationListPage />
                  </UserProtectedRoute>
                }
              />
              <Route
                path="/notifications/:id"
                element={
                  <UserProtectedRoute>
                    <NotificationDetailPage />
                  </UserProtectedRoute>
                }
              />
              <Route
                path="/announcements/:id"
                element={
                  <UserProtectedRoute>
                    <AnnouncementDetailPage />
                  </UserProtectedRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </NotificationProvider>
    </ToastProvider >
  );
}

export default App;
