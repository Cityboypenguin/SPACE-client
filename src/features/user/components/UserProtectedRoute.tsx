import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyTermsConsentStatus, type TermsOfService } from '../api/terms';
import { TermsConsentModal } from './organisms/TermsConsentModal';

interface Props {
  children: React.ReactNode;
}

export const UserProtectedRoute = ({ children }: Props) => {
  const { token } = useAuth();
  const [checking, setChecking] = useState(true);
  const [pendingTerms, setPendingTerms] = useState<TermsOfService | null>(null);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }
    getMyTermsConsentStatus()
      .then((status) => {
        if (!status.isConsented && status.currentTerms) {
          setPendingTerms(status.currentTerms);
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (checking) {
    return <p style={{ textAlign: 'center', marginTop: '4rem', color: '#94a3b8' }}>読み込み中...</p>;
  }

  return (
    <>
      {pendingTerms && (
        <TermsConsentModal
          terms={pendingTerms}
          onConsented={() => setPendingTerms(null)}
        />
      )}
      {children}
    </>
  );
};
