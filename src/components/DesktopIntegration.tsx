import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/user/context/useAuth';
import { useNotification } from '../features/user/context/useNotification';
import { updateDesktopUnread } from '../lib/desktop';

// Web では副作用を起こさず、通知クリックの受信と未読数だけを橋渡しする。
export function DesktopIntegration() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { unreadCount } = useNotification();

  useEffect(() => window.spaceDesktop?.onNavigate((link) => { void navigate(link); }), [navigate]);
  useEffect(() => {
    updateDesktopUnread(token ? { notifications: unreadCount } : { notifications: 0, dm: 0 });
  }, [token, unreadCount]);
  return null;
}
