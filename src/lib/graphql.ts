const fallbackApiUrl = '/query';

export const API_URL = import.meta.env.VITE_API_URL || fallbackApiUrl;

export const SSE_URL = (import.meta.env.VITE_API_URL as string | undefined ?? '/query').replace(/\/query$/, '/events');

const USER_TOKEN_KEY = 'space_user_token';
const USER_REFRESH_TOKEN_KEY = 'space_user_refresh_token';
const ADMIN_TOKEN_KEY = 'space_admin_token';
const ADMIN_REFRESH_TOKEN_KEY = 'space_admin_refresh_token';

let _onUnauthorized: (() => void) | null = null;
let _onTokenRefreshed: ((token: string, refreshToken: string) => void) | null = null;
let _onMaintenance: (() => void) | null = null;

export const registerUnauthorizedHandler = (fn: () => void) => {
  _onUnauthorized = fn;
};

export const registerTokenRefreshedHandler = (fn: (token: string, refreshToken: string) => void) => {
  _onTokenRefreshed = fn;
};

export const registerMaintenanceHandler = (fn: () => void) => {
  _onMaintenance = fn;
};

const handleMaintenance = () => {
  if (_onMaintenance) {
    _onMaintenance();
  } else {
    window.location.href = '/maintenance';
  }
};

const handleUnauthorized = () => {
  if (_onUnauthorized) {
    _onUnauthorized();
  } else {
    window.location.href = '/login';
  }
};

const REFRESH_USER_MUTATION = `
  mutation RefreshUserToken($refreshToken: String!) {
    refreshUserToken(refreshToken: $refreshToken) {
      token
      refreshToken
    }
  }
`;

const REFRESH_ADMIN_MUTATION = `
  mutation RefreshAdministratorToken($refreshToken: String!) {
    refreshAdministratorToken(refreshToken: $refreshToken) {
      token
      refreshToken
    }
  }
`;

let _refreshPromise: Promise<string | null> | null = null;

const tryRefreshAccessToken = (): Promise<string | null> => {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const isAdmin = window.location.pathname.startsWith('/admin');
      const refreshKey = isAdmin ? ADMIN_REFRESH_TOKEN_KEY : USER_REFRESH_TOKEN_KEY;
      const tokenKey = isAdmin ? ADMIN_TOKEN_KEY : USER_TOKEN_KEY;
      const mutation = isAdmin ? REFRESH_ADMIN_MUTATION : REFRESH_USER_MUTATION;
      const fieldName = isAdmin ? 'refreshAdministratorToken' : 'refreshUserToken';

      const refreshToken = localStorage.getItem(refreshKey);
      if (!refreshToken) return null;

      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query: mutation, variables: { refreshToken } }),
      });

      if (!resp.ok) return null;

      const json = await resp.json();
      if (json.errors || !json.data?.[fieldName]) return null;

      const newToken: string = json.data[fieldName].token;
      const newRefreshToken: string = json.data[fieldName].refreshToken;

      localStorage.setItem(tokenKey, newToken);
      localStorage.setItem(refreshKey, newRefreshToken);

      _onTokenRefreshed?.(newToken, newRefreshToken);

      return newToken;
    } catch {
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
};

const isAuthError = (message: string): boolean =>
  message.includes('invalid token') ||
  message.includes('token has been revoked') ||
  message.includes('token is expired') ||
  message.includes('unauthorized');

export const request = async <T>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string,
  _retrying = false,
): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 503) {
    localStorage.setItem('space_maintenance', 'true');
    handleMaintenance();
    return Promise.reject(new Error('server_maintenance'));
  }

  if (response.status === 401) {
    if (!_retrying) {
      const newToken = await tryRefreshAccessToken();
      if (newToken) {
        return request<T>(query, variables, newToken, true);
      }
    }
    handleUnauthorized();
    return Promise.reject(new Error('Unauthorized'));
  }

  if (!response.ok) {
    let detail = '';
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const errorJson = await response.json();
        if (Array.isArray(errorJson?.errors) && errorJson.errors.length > 0) {
          detail = errorJson.errors.map((e: { message?: string }) => e.message || '').filter(Boolean).join(', ');
        } else if (typeof errorJson?.message === 'string') {
          detail = errorJson.message;
        }
      } else {
        detail = (await response.text()).trim();
      }
    } catch { /* ignore */ }
    const suffix = detail ? `: ${detail}` : '';
    throw new Error(`Network response was not ok (${response.status} ${response.statusText})${suffix}`);
  }

  const json = await response.json();

  if (json.errors) {
    const message = json.errors.map((e: { message: string }) => e.message).join(', ');

    if (!_retrying && isAuthError(message)) {
      const newToken = await tryRefreshAccessToken();
      if (newToken) {
        return request<T>(query, variables, newToken, true);
      }
      handleUnauthorized();
      return Promise.reject(new Error('Unauthorized'));
    }

    if (isAuthError(message)) {
      handleUnauthorized();
      return Promise.reject(new Error('Unauthorized'));
    }

    throw new Error(message);
  }

  return json.data;
};
