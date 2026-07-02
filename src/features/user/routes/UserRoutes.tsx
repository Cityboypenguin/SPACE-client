import { lazy } from 'react';
import type { ReactNode } from 'react';
import { Route } from 'react-router-dom';
import { NotFoundPage } from '../../../components/pages/NotFoundPage';
import { MaintenanceGuardLayout } from '../../../components/MaintenanceGuardLayout';
import { UserProtectedRoute } from '../components/UserProtectedRoute';

const UserLoginForm = lazy(() =>
  import('../components/organisms/UserLoginForm').then((m) => ({ default: m.UserLoginForm })),
);
const UserRegisterPage = lazy(() =>
  import('../pages/UserRegisterPage').then((m) => ({ default: m.UserRegisterPage })),
);
const UserDashboard = lazy(() =>
  import('../pages/UserDashboard').then((m) => ({ default: m.UserDashboard })),
);
const UserSettingsPage = lazy(() =>
  import('../pages/UserSettingsPage').then((m) => ({ default: m.UserSettingsPage })),
);
const UserSearchPage = lazy(() =>
  import('../pages/UserSearchPage').then((m) => ({ default: m.UserSearchPage })),
);
const UserPublicProfilePage = lazy(() =>
  import('../pages/UserPublicProfilePage').then((m) => ({ default: m.UserPublicProfilePage })),
);
const DMListPage = lazy(() =>
  import('../pages/DMListPage').then((m) => ({ default: m.DMListPage })),
);
const DMPage = lazy(() =>
  import('../pages/DMPage').then((m) => ({ default: m.DMPage })),
);
const CommunityListPage = lazy(() =>
  import('../pages/CommunityListPage').then((m) => ({ default: m.CommunityListPage })),
);
const CommunityBoardListPage = lazy(() =>
  import('../pages/CommunityBoardListPage').then((m) => ({ default: m.CommunityBoardListPage })),
);
const CommunityCreatePage = lazy(() =>
  import('../pages/CommunityCreatePage').then((m) => ({ default: m.CommunityCreatePage })),
);
const CommunityRoomPage = lazy(() =>
  import('../pages/CommunityRoomPage').then((m) => ({ default: m.CommunityRoomPage })),
);
const CommunityEditPage = lazy(() =>
  import('../pages/CommunityEditPage').then((m) => ({ default: m.CommunityEditPage })),
);
const CommunityMembersPage = lazy(() =>
  import('../pages/CommunityMembersPage').then((m) => ({ default: m.CommunityMembersPage })),
);
const UserProfileEditPage = lazy(() =>
  import('../pages/UserProfileEditPage').then((m) => ({ default: m.UserProfileEditPage })),
);
const UserInfoEditPage = lazy(() =>
  import('../pages/UserInfoEditPage').then((m) => ({ default: m.UserInfoEditPage })),
);
const PostListPage = lazy(() =>
  import('../pages/PostListPage').then((m) => ({ default: m.PostListPage })),
);
const PostDetailPage = lazy(() =>
  import('../pages/PostDetailPage').then((m) => ({ default: m.PostDetailPage })),
);
const InquiryPage = lazy(() =>
  import('../pages/InquiryPage').then((m) => ({ default: m.InquiryPage })),
);
const FavoriteUsersPage = lazy(() =>
  import('../pages/FavoriteUsersPage').then((m) => ({ default: m.FavoriteUsersPage })),
);
const BlockedUsersPage = lazy(() =>
  import('../pages/BlockedUsersPage').then((m) => ({ default: m.BlockedUsersPage })),
);
const NotificationListPage = lazy(() =>
  import('../pages/NotificationListPage').then((m) => ({ default: m.NotificationListPage })),
);
const NotificationDetailPage = lazy(() =>
  import('../pages/NotificationDetailPage').then((m) => ({ default: m.NotificationDetailPage })),
);
const AnnouncementDetailPage = lazy(() =>
  import('../pages/AnnouncementDetailPage').then((m) => ({ default: m.AnnouncementDetailPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('../pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);

const protectedElement = (element: ReactNode) => (
  <UserProtectedRoute>{element}</UserProtectedRoute>
);

export const userRoutes = (
  <Route element={<MaintenanceGuardLayout />}>
    <Route path="/" element={<UserLoginForm />} />
    <Route path="/login" element={<UserLoginForm />} />
    <Route path="/register" element={<UserRegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/inquiry" element={<InquiryPage />} />
    <Route path="/mypage" element={protectedElement(<UserDashboard />)} />
    <Route path="/mypage/settings" element={protectedElement(<UserSettingsPage />)} />
    <Route path="/mypage/profile-edit" element={protectedElement(<UserProfileEditPage />)} />
    <Route path="/mypage/user-info-edit" element={protectedElement(<UserInfoEditPage />)} />
    <Route path="/mypage/favorites" element={protectedElement(<FavoriteUsersPage />)} />
    <Route path="/mypage/followers" element={protectedElement(<FavoriteUsersPage mode="followers" />)} />
    <Route path="/mypage/blocks" element={protectedElement(<BlockedUsersPage />)} />
    <Route path="/search" element={protectedElement(<UserSearchPage />)} />
    <Route path="/users/:id" element={protectedElement(<UserPublicProfilePage />)} />
    <Route path="/dm" element={protectedElement(<DMListPage />)} />
    <Route path="/dm/:roomId" element={protectedElement(<DMPage />)} />
    <Route path="/community" element={protectedElement(<CommunityListPage />)} />
    <Route path="/community/browse" element={protectedElement(<CommunityBoardListPage />)} />
    <Route path="/community/create" element={protectedElement(<CommunityCreatePage />)} />
    <Route path="/community/chat/:roomId" element={protectedElement(<CommunityRoomPage />)} />
    <Route path="/community/edit/:communityID" element={protectedElement(<CommunityEditPage />)} />
    <Route path="/community/members/:communityID" element={protectedElement(<CommunityMembersPage />)} />
    <Route path="/home" element={protectedElement(<PostListPage />)} />
    <Route path="/posts/:id" element={protectedElement(<PostDetailPage />)} />
    <Route path="/notifications" element={protectedElement(<NotificationListPage />)} />
    <Route path="/notifications/:id" element={protectedElement(<NotificationDetailPage />)} />
    <Route path="/announcements/:id" element={protectedElement(<AnnouncementDetailPage />)} />
    <Route path="*" element={<NotFoundPage />} />
  </Route>
);
