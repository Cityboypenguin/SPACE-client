import useSWR, { mutate } from 'swr';
import { request } from '../../../lib/graphql';
import { ADMIN_TOKEN_KEY, USER_TOKEN_KEY } from '../../../lib/authStorage';
import {
  setStampDefinitions,
  type ReactionStamp,
} from '../constants/reactionStamps';

export const STAMP_FIELDS =
  'id label imageUrl displaySize status allowMessage allowReaction messageOrder reactionOrder version';
export const refreshChatStamps = () =>
  mutate((key: unknown) => Array.isArray(key) && key[0] === 'chat-stamps');
export const useChatStampCatalog = () => {
  const token = localStorage.getItem(
    location.pathname.startsWith('/admin') ? ADMIN_TOKEN_KEY : USER_TOKEN_KEY,
  );
  const { data, error, isLoading } = useSWR(
    token ? ['chat-stamps', token] : null,
    async ([, authToken]: [string, string]) => {
      const result = await request<{ chatStamps: ReactionStamp[] }>(
        `query { chatStamps { ${STAMP_FIELDS} } }`,
        {},
        authToken,
      );
      setStampDefinitions(result.chatStamps);
      return result.chatStamps;
    },
    { refreshInterval: 60000, revalidateOnFocus: true, dedupingInterval: 1000 },
  );
  return { stamps: data ?? [], error, isLoading };
};
export const useChatStamps = () => useChatStampCatalog().stamps;
export const useMessageStampOptions = (enabled: boolean) =>
  useChatStamps()
    .filter((s) => enabled && s.status === 'active' && s.allowMessage)
    .sort((a, b) => a.messageOrder - b.messageOrder || a.id.localeCompare(b.id))
    .map((s) => s.id);
