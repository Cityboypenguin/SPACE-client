import { BrowserRouter, Routes, Route } from 'react-router'
import { AdminRoutes } from './features/admin/routes/AdminRoutes'
import { UserLoginForm } from './features/user/components/UserLoginForm'
import { UserRegisterPage } from './features/user/pages/UserRegisterPage'
import { UserDashboard } from './features/user/pages/UserDashboard'
import { UserProfileeditPage } from './features/user/pages/UserProfileEditPage'
import { UserSettingsPage } from './features/user/pages/UserSettingsPage'
import { UserSearchPage } from './features/user/pages/UserSearchPage'
import { UserPublicProfilePage } from './features/user/pages/UserPublicProfilePage'
import { UserProtectedRoute } from './features/user/components/UserProtectedRoute'
import { DMListPage } from './features/user/pages/DMListPage'
import { DMPage } from './features/user/pages/DMPage'
import { CommunityListPage } from './features/user/pages/CommunityListPage'
import { CommunityBoardListPage } from './features/user/pages/CommunityBoardListPage'
import { CommunityCreatePage } from './features/user/pages/CommunityCreatePage'
import { CommunityRoomPage } from './features/user/pages/CommunityRoomPage'

function App() {
  return (
    <BrowserRouter>
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
              <UserProfileeditPage />
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
      </Routes>
    </BrowserRouter>
  )
}

export default App
