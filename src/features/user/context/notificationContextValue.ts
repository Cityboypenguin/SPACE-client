import { createContext } from 'react';
import type { TermsOfService } from '../api/terms';

export type NotificationContextValue = {
  unreadCount: number;
  lastSseAt: number;
  pendingTerms: TermsOfService | null;
  consentChecking: boolean;
  clearPendingTerms: () => void;
  resetUnread: () => void;
  decrementUnread: () => void;
};

export const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  lastSseAt: 0,
  pendingTerms: null,
  consentChecking: false,
  clearPendingTerms: () => {},
  resetUnread: () => {},
  decrementUnread: () => {},
});
