export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/query';
export const STORAGE_KEY_TOKEN = 'space_token';

export const request = async <T>(query: string, variables?: Record<string, any>): Promise<T> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // ローカルストレージからトークンを取得してAuthorizationヘッダーに設定
  const token = localStorage.getItem(STORAGE_KEY_TOKEN);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const json = await response.json();

    if (json.errors) {
      const message = json.errors.map((e: any) => e.message).join(', ');
      throw new Error(message);
    }

    return json.data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};