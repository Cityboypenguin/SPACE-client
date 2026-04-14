import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AdminRoutes } from './features/admin/routes/AdminRoutes'
import { UserLoginForm } from './features/user/components/UserLoginForm'
import { UserRegisterPage } from './features/user/pages/UserRegisterPage'
import { UserDashboard } from './features/user/pages/UserDashboard'
import { UserProtectedRoute } from './features/user/components/UserProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/login" element={<UserLoginForm />} />
        <Route path="/register" element={<UserRegisterPage />} />
        <Route
          path="/home"
          element={
            <UserProtectedRoute>
              <UserDashboard />
            </UserProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
