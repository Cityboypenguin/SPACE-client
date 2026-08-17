import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../api/auth';
import { getMyProfile } from '../api/profile';
import { registerUnauthorizedHandler, registerTokenRefreshedHandler, registerMaintenanceHandler } from '../../../lib/graphql';
import {
  ADMIN_REFRESH_TOKEN_KEY,
  ADMIN_TOKEN_KEY,
  USER_ID_KEY,
  USER_REFRESH_TOKEN_KEY,
  USER_TOKEN_KEY,
} from '../../../lib/authStorage';

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

  // token はあるのに userId が欠落している不整合状態を自己修復する。
  // この状態だと本人判定に失敗し、DM が全て相手側に表示されたり、投稿カードの自分アイコンが
  // ✍️ になったりする。userId は opaque な値でクライアント側からは算出できないため、
  // token から本人を特定できる me クエリで取得して復元する（正常時は発火しない no-op）。
  useEffect(() => {
    if (!token || userId) return;
    let active = true;
    getMyProfile()
      .then((data) => {
        const id = data.me?.ID;
        if (active && id) {
          localStorage.setItem(USER_ID_KEY, id);
          setUserId(id);
        }
      })
      .catch(() => { /* 復元失敗時は既存の挙動のまま */ });
    return () => { active = false; };
  }, [token, userId]);

  useEffect(() => {
    registerTokenRefreshedHandler((newToken, newRefreshToken) => {
      localStorage.setItem(USER_TOKEN_KEY, newToken);
      localStorage.setItem(USER_REFRESH_TOKEN_KEY, newRefreshToken);
      setToken(newToken);
    });
  }, []);

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

  useEffect(() => {
    registerMaintenanceHandler(() => {
      if (!window.location.pathname.startsWith('/admin')) {
        clearAuth();
        navigate('/maintenance');
      }
    });
  }, [clearAuth, navigate]);

  return (
    <AuthContext.Provider value={{ token, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
