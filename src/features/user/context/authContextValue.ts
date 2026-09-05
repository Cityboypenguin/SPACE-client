import { createContext } from 'react';

export type AuthContextValue = {
  token: string | null;
  userId: string | null;
  login: (token: string, refreshToken: string, userId: string) => void;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue>({
  token: null,
  userId: null,
  login: () => {},
  logout: async () => {},
});
