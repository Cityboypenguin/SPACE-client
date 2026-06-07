import { useEffect, useState } from 'react';
import { getProfileByUserID, type Profile } from '../api/profile';
import { toUserMessage } from '../../../lib/errorMessages';

type State = {
  profile: Profile | null;
  loading: boolean;
  error: string;
};

export const useProfile = (userId: string | null | undefined) => {
  const [state, setState] = useState<State>({ profile: null, loading: true, error: '' });

  useEffect(() => {
    if (!userId) {
      setState({ profile: null, loading: false, error: '' });
      return;
    }

    let active = true;
    setState({ profile: null, loading: true, error: '' });

    getProfileByUserID(userId)
      .then((data) => {
        if (!active) return;
        if (data.getProfileByUserID) {
          setState({ profile: data.getProfileByUserID, loading: false, error: '' });
        } else {
          setState({ profile: null, loading: false, error: 'プロフィールが見つかりませんでした' });
        }
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message = toUserMessage(err, 'プロフィールの読み込みに失敗しました。時間をおいてから再度お試しください。');
        setState({ profile: null, loading: false, error: message });
      });

    return () => { active = false; };
  }, [userId]);

  return state;
};
