import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { UserProtectedRoute } from './features/user/components/UserProtectedRoute';

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
const UserProfileEditPage = lazy(() =>
  import('./features/user/pages/UserProfileEditPage').then((m) => ({ default: m.UserProfileEditPage })),
);
const PostListPage = lazy(() =>
  import('./features/user/pages/PostListPage').then((m) => ({ default: m.PostListPage })),
);
const PostDetailPage = lazy(() =>
  import('./features/user/pages/PostDetailPage').then((m) => ({ default: m.PostDetailPage })),
);
function App() {
  return (
    <Suspense fallback={<p>読み込み中...</p>}>
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/login" element={<UserLoginForm />} />
        <Route path="/register" element={<UserRegisterPage />} />
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
          path="/posts"
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
      </Routes>
    </Suspense>
  );
}

export default App;
