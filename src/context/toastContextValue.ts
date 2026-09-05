import { createContext } from 'react';

export type ToastType = 'info' | 'error' | 'warning' | 'success';

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  navigateTo?: string;
};

export type ToastContextValue = {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number, navigateTo?: string) => void;
  removeToast: (id: string) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
