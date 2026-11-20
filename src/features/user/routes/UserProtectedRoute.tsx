import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useNotification } from '../context/useNotification';
import { TermsConsentModal } from '../components/organisms/TermsConsentModal';
import { WeeklyNoticeModal } from '../components/organisms/WeeklyNoticeModal';
import { useWeeklyNotice } from '../hooks/useWeeklyNotice';
import { UnreadRoomCountsProvider } from '../context/UnreadRoomCountsContext';
import { invitationLoginReturn } from '../lib/communityInvitationLinks';
import styles from './UserProtectedRoute.module.css';

export const UserProtectedRoute = () => {
  const location = useLocation();
  const { token, userId } = useAuth();
  const weeklyNotice = useWeeklyNotice(userId);
  const { pendingTerms, consentChecking, clearPendingTerms } = useNotification();

  if (!token) {
    const returnTo = invitationLoginReturn(location.pathname + location.search + location.hash);
    return <Navigate to="/login" state={returnTo ? { returnTo } : undefined} replace />;
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
      {!pendingTerms && weeklyNotice.open && (
        <WeeklyNoticeModal onClose={weeklyNotice.close} />
      )}
      <Outlet />
    </UnreadRoomCountsProvider>
  );
};
