import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { TermsConsentModal } from '../components/organisms/TermsConsentModal';
import { UnreadRoomCountsProvider } from '../context/UnreadRoomCountsContext';

export const UserProtectedRoute = () => {
  const { token } = useAuth();
  const { pendingTerms, consentChecking, clearPendingTerms } = useNotification();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (consentChecking) {
    return <p style={{ textAlign: 'center', marginTop: '4rem', color: '#94a3b8' }}>読み込み中...</p>;
  }

  return (
    <UnreadRoomCountsProvider>
      {pendingTerms && (
        <TermsConsentModal
          terms={pendingTerms}
          onConsented={clearPendingTerms}
        />
      )}
      <Outlet />
    </UnreadRoomCountsProvider>
  );
};
