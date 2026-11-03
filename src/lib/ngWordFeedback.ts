import { GraphQLRequestError } from './graphql';
import { AppSwal } from './swal';

const BLOCKED_MESSAGE = '使えない言葉が含まれているため';

export const isNGWordBlocked = (error: unknown): boolean =>
  (error instanceof GraphQLRequestError && error.errors.some((item) => item.extensions?.code === 'NG_WORD_BLOCKED')) ||
  (error instanceof Error && error.message.includes(BLOCKED_MESSAGE));

// Apply only to the submitted draft: do not overwrite edits made while waiting.
export const maskNGWordDraft = (error: unknown, current: string): string => {
  if (!(error instanceof GraphQLRequestError) || !isNGWordBlocked(error)) return current;
  for (const item of error.errors) {
    const texts = item.extensions?.maskedTexts;
    if (!Array.isArray(texts)) continue;
    for (const text of texts) {
      if (typeof text?.original !== 'string' || typeof text?.masked !== 'string') continue;
      if (current.trim() === text.original && text.original !== '') {
        const start = current.indexOf(text.original);
        return current.slice(0, start) + text.masked + current.slice(start + text.original.length);
      }
    }
  }
  return current;
};

export const showNGWordFeedback = (error: unknown): boolean => {
  if (!isNGWordBlocked(error)) return false;
  void AppSwal.fire({
    icon: 'warning',
    title: '投稿できません',
    text: '使えない言葉が含まれています。内容を確認して、修正してください。',
    confirmButtonText: '閉じる',
  });
  return true;
};
