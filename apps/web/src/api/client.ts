const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

function getSessionToken(): string {
  return (
    localStorage.getItem('opensynk_session_token') ||
    sessionStorage.getItem('opensynk_session_token') ||
    ''
  );
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = getSessionToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem('opensynk_logged_in');
    localStorage.removeItem('opensynk_session_token');
    sessionStorage.removeItem('opensynk_session_token');
    window.location.href = '/';
    throw new Error('Session expired');
  }

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const token = getSessionToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (response.status === 401) {
    localStorage.removeItem('opensynk_logged_in');
    localStorage.removeItem('opensynk_session_token');
    sessionStorage.removeItem('opensynk_session_token');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}