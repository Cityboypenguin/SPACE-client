import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getThemePreference, setThemePreference as setThemePreferenceAPI } from '../features/user/api/theme';
import { getUserToken } from '../features/user/api/auth';

export type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const THEME_STORAGE_KEY = 'theme';

// index.html のブートストラップスクリプトと同じ解決順序（直近の明示的な選択 >
// OS 設定 > light）。ここでの初期値は data-theme 属性としてすでに塗られている
// 値と必ず一致させる必要がある（そうしないと React マウント時にちらつく）。
const resolveInitialTheme = (): Theme => {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(resolveInitialTheme);

  const applyTheme = useCallback((next: Theme) => {
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    setThemeState(next);
  }, []);

  // ログイン中は、サーバー側に保存済みの明示的な選択があればそちらを優先する
  // （別端末での変更を反映するため）。未ログイン時は問い合わせない。
  useEffect(() => {
    if (!getUserToken()) return;
    getThemePreference()
      .then((preference) => {
        if (!preference) return;
        const serverTheme: Theme = preference === 'DARK' ? 'dark' : 'light';
        if (serverTheme !== theme) applyTheme(serverTheme);
      })
      .catch(() => {
        // オフライン等で取得できなくても、直前まで表示していたローカルの値で動き続ける。
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = useCallback(
    (next: Theme) => {
      applyTheme(next);
      if (!getUserToken()) return;
      setThemePreferenceAPI(next === 'dark' ? 'DARK' : 'LIGHT').catch((err) => {
        console.error('failed to persist theme preference', err);
      });
    },
    [applyTheme],
  );

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
