import { useChatStamps } from './useChatStamps';
export const useMessageReactionEmojis = (enabled: boolean): string[] =>
  useChatStamps()
    .filter((s) => enabled && s.status === 'active' && s.allowReaction)
    .sort(
      (a, b) => a.reactionOrder - b.reactionOrder || a.id.localeCompare(b.id),
    )
    .map((s) => s.id);
