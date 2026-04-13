import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminRoutes } from './features/admin/routes/AdminRoutes'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
