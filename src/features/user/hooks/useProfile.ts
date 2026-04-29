import { useEffect, useState } from 'react';
import { getProfileByUserID, type Profile } from '../api/profile';

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
        const message = err instanceof Error ? err.message : '取得に失敗しました';
        setState({ profile: null, loading: false, error: message });
      });

    return () => { active = false; };
  }, [userId]);

  return state;
};
