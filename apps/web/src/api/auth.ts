const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export interface LoginResponse {
  success: boolean;
  email?: string;
  mode?: 'demo' | 'live';
  session_token?: string;
  message?: string;
}

export async function login(
  email: string,
  password: string,
  keepSignedIn: boolean,
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      keep_signed_in: keepSignedIn,
      verify_ssl: false,
    }),
  });

  return response.json();
}