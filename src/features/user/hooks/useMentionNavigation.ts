import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

/**
 * メンションの描画に必要なもの（自分宛かの判定用ID と タップ時の遷移）をまとめて返す。
 * renderTextWithLinks に currentUserID / onMentionClick として渡す。
 * 自分自身へのメンションは UserAvatar と同じくマイページへ飛ばす。
 */
export function useMentionNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId: currentUserID } = useAuth();

  const onMentionClick = (userID: string) => {
    navigate(userID === currentUserID ? '/mypage' : `/users/${userID}`, {
      state: { from: location.pathname },
    });
  };

  return { currentUserID, onMentionClick };
}
