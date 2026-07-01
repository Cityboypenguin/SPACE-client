import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/organisms/ToastContainer';
import { OfflineBanner } from './components/organisms/OfflineBanner';
import { MaintenancePage } from './components/pages/MaintenancePage';
import { NotificationProvider } from './features/user/context/NotificationContext';
import { userRoutes } from './features/user/routes/UserRoutes';
import { initSessionTracker, trackPageEnter } from './lib/sessionTracker';

const AdminRoutes = lazy(() =>
  import('./features/admin/routes/AdminRoutes').then((m) => ({ default: m.AdminRoutes })),
);

function SessionTracker() {
  const location = useLocation();

  useEffect(() => {
    initSessionTracker();
    trackPageEnter(location.pathname);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
