import { lazy } from 'react';
import { Route } from 'react-router-dom';
import { NotFoundPage } from '../../../components/pages/NotFoundPage';
import { MaintenanceGuardLayout } from '../../../components/MaintenanceGuardLayout';
import { UserProtectedRoute } from './UserProtectedRoute';

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

export const userRoutes = (
  <Route element={<MaintenanceGuardLayout />}>
    <Route path="/" element={<UserLoginForm />} />
    <Route path="/login" element={<UserLoginForm />} />
    <Route path="/register" element={<UserRegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/inquiry" element={<InquiryPage />} />
    <Route element={<UserProtectedRoute />}>
      <Route path="/mypage" element={<UserDashboard />} />
      <Route path="/mypage/settings" element={<UserSettingsPage />} />
      <Route path="/mypage/profile-edit" element={<UserProfileEditPage />} />
      <Route path="/mypage/user-info-edit" element={<UserInfoEditPage />} />
      <Route path="/mypage/favorites" element={<FavoriteUsersPage />} />
      <Route path="/mypage/followers" element={<FavoriteUsersPage mode="followers" />} />
      <Route path="/mypage/blocks" element={<BlockedUsersPage />} />
      <Route path="/search" element={<UserSearchPage />} />
      <Route path="/users/:id" element={<UserPublicProfilePage />} />
      <Route path="/dm" element={<DMListPage />} />
      <Route path="/dm/:roomId" element={<DMPage />} />
      <Route path="/community" element={<CommunityListPage />} />
      <Route path="/community/browse" element={<CommunityBoardListPage />} />
      <Route path="/community/create" element={<CommunityCreatePage />} />
      <Route path="/community/chat/:roomId" element={<CommunityRoomPage />} />
      <Route path="/community/edit/:communityID" element={<CommunityEditPage />} />
      <Route path="/community/members/:communityID" element={<CommunityMembersPage />} />
      <Route path="/home" element={<PostListPage />} />
      <Route path="/posts/:id" element={<PostDetailPage />} />
      <Route path="/notifications" element={<NotificationListPage />} />
      <Route path="/notifications/:id" element={<NotificationDetailPage />} />
      <Route path="/announcements/:id" element={<AnnouncementDetailPage />} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Route>
);
