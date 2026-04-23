export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/query';

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

  // HTTPステータスコードでの401エラー（未認証）を検知した場合
  if (response.status === 401) {
    localStorage.clear();
    // 必要に応じてAdminとUserで遷移先を分ける処理を入れるとより安全です
    window.location.href = window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
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
    } catch {
      detail = '';
    }

    const suffix = detail ? `: ${detail}` : '';
    throw new Error(`Network response was not ok (${response.status} ${response.statusText})${suffix}`);
  }

  const json = await response.json();

  if (json.errors) {
    const message = json.errors.map((e: { message: string }) => e.message).join(', ');
    
    // GraphQLのレスポンス内でトークンエラーを検知した場合
    if (message.includes('invalid token') || message.includes('token has been revoked')) {
      localStorage.clear();
      window.location.href = window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
    }

    throw new Error(message);
  }

  return json.data;
};