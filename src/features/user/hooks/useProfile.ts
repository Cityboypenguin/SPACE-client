import useSWR from 'swr';
import { getProfileByUserID } from '../api/profile';
import { toUserMessage } from '../../../lib/errorMessages';
import { staticCacheOptions } from '../cache/swrOptions';

export const profileCacheKey = (userId: string) => ['profile', userId] as const;

export const profileCacheOptions = staticCacheOptions;

export const useProfile = (userId: string | null | undefined) => {
  const { data, isLoading, error } = useSWR(
    userId ? profileCacheKey(userId) : null,
    ([, id]: [string, string]) => getProfileByUserID(id).then((d) => d.getProfileByUserID),
    profileCacheOptions,
  );

  return {
    profile: data ?? null,
    loading: isLoading,
    error: error ? toUserMessage(error, 'プロフィールの読み込みに失敗しました。時間をおいてから再度お試しください。') : '',
  };
};
