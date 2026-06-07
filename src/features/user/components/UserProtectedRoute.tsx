import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { TermsConsentModal } from './organisms/TermsConsentModal';

interface Props {
  children: React.ReactNode;
}

export const UserProtectedRoute = ({ children }: Props) => {
  const { token } = useAuth();
  const { pendingTerms, consentChecking, clearPendingTerms } = useNotification();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (consentChecking) {
    return <p style={{ textAlign: 'center', marginTop: '4rem', color: '#94a3b8' }}>読み込み中...</p>;
  }

  return (
    <>
      {pendingTerms && (
        <TermsConsentModal
          terms={pendingTerms}
          onConsented={clearPendingTerms}
        />
      )}
      {children}
    </>
  );
};
