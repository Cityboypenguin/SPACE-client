import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useNotification } from '../context/useNotification';
import { TermsConsentModal } from '../components/organisms/TermsConsentModal';
import { UnreadRoomCountsProvider } from '../context/UnreadRoomCountsContext';
import styles from './UserProtectedRoute.module.css';

export const UserProtectedRoute = () => {
  const { token } = useAuth();
  const { pendingTerms, consentChecking, clearPendingTerms } = useNotification();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (consentChecking) {
    return <p className={styles.loadingText}>読み込み中...</p>;
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
