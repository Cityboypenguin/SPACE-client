import useSWR from 'swr';
import { getProfileByUserID } from '../api/profile';
import { toUserMessage } from '../../../lib/errorMessages';

export const useProfile = (userId: string | null | undefined) => {
  const { data, isLoading, error } = useSWR(
    userId ? ['profile', userId] : null,
    ([, id]: [string, string]) => getProfileByUserID(id).then((d) => d.getProfileByUserID),
  );

  return {
    profile: data ?? null,
    loading: isLoading,
    error: error ? toUserMessage(error, 'プロフィールの読み込みに失敗しました。時間をおいてから再度お試しください。') : '',
  };
};
