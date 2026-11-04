import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/organisms/ToastContainer';
import { OfflineBanner } from './components/organisms/OfflineBanner';
import { MaintenancePage } from './components/pages/MaintenancePage';
import { NotificationProvider } from './features/user/context/NotificationContext';
import { userRoutes } from './features/user/routes/UserRoutes';
import { initSessionTracker, trackPageEnter } from './lib/sessionTracker';
import { DesktopIntegration } from './components/DesktopIntegration';

const AdminRoutes = lazy(() =>
  import('./features/admin/routes/AdminRoutes').then((m) => ({ default: m.AdminRoutes })),
);

function SessionTracker() {
  const location = useLocation();

  useEffect(() => {
    initSessionTracker();
  }, []);

  useEffect(() => {
    trackPageEnter(location.pathname);
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <ToastProvider>
      <NotificationProvider>
        <DesktopIntegration />
        <SessionTracker />
        <OfflineBanner />
        <ToastContainer />
        <Suspense fallback={<p>読み込み中...</p>}>
          <Routes>
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/admin/*" element={<AdminRoutes />} />
            {userRoutes}
          </Routes>
        </Suspense>
      </NotificationProvider>
    </ToastProvider >
  );
}

export default App;
