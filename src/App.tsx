import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminLoginForm } from './features/admin/components/AdminLoginForm'
import { AdminDashboard } from './features/admin/pages/AdminDashboard'
import { AdminProtectedRoute } from './features/admin/components/AdminProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginForm />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
