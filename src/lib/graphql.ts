const fallbackApiUrl = `${window.location.protocol}//${window.location.hostname}:8080/query`;

export const API_URL = import.meta.env.VITE_API_URL || fallbackApiUrl;

let _onUnauthorized: (() => void) | null = null;

export const registerUnauthorizedHandler = (fn: () => void) => {
  _onUnauthorized = fn;
};

const handleUnauthorized = () => {
  if (_onUnauthorized) {
    _onUnauthorized();
  } else {
    window.location.href = '/login';
  }
};

export const request = async <T>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string,
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

  if (response.status === 401) {
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

    if (
      message.includes('invalid token') ||
      message.includes('token has been revoked') ||
      message.includes('token is expired') ||
      message.includes('unauthorized')
    ) {
      handleUnauthorized();
      return Promise.reject(new Error('Unauthorized'));
    }

    throw new Error(message);
  }

  return json.data;
};
