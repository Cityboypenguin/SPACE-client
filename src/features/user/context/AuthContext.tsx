import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../api/auth';
import { registerUnauthorizedHandler } from '../../../lib/graphql';

const USER_TOKEN_KEY = 'space_user_token';
const USER_REFRESH_TOKEN_KEY = 'space_user_refresh_token';
const USER_ID_KEY = 'space_user_id';
const ADMIN_TOKEN_KEY = 'space_admin_token';
const ADMIN_REFRESH_TOKEN_KEY = 'space_admin_refresh_token';

type AuthContextValue = {
  token: string | null;
  userId: string | null;
  login: (token: string, refreshToken: string, userId: string) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  token: null,
  userId: null,
  login: () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(USER_TOKEN_KEY));
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem(USER_ID_KEY));
  const navigate = useNavigate();

  const clearAuth = useCallback(() => {
    localStorage.removeItem(USER_TOKEN_KEY);
    localStorage.removeItem(USER_REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    setToken(null);
    setUserId(null);
  }, []);

  const login = useCallback((newToken: string, refreshToken: string, newUserId: string) => {
    localStorage.setItem(USER_TOKEN_KEY, newToken);
    localStorage.setItem(USER_REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_ID_KEY, newUserId);
    setToken(newToken);
    setUserId(newUserId);
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await logoutUser(token);
      } catch { /* ignore */ }
    }
    clearAuth();
    navigate('/login');
  }, [token, clearAuth, navigate]);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      clearAuth();
      const isAdmin = window.location.pathname.startsWith('/admin');
      if (isAdmin) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
        navigate('/admin/login');
      } else {
        navigate('/login');
      }
    });
  }, [clearAuth, navigate]);

  return (
    <AuthContext.Provider value={{ token, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
