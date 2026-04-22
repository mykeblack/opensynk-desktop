import { apiGet } from './client';
import type {
  SaveSettingsResponse,
  SettingsResponse,
  TestConnectionResponse,
} from '../types/settings';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export async function getSettings(): Promise<SettingsResponse> {
  return apiGet<SettingsResponse>('/api/settings');
}

export async function saveSettings(
  payload: SettingsResponse,
): Promise<SaveSettingsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to save settings: ${response.status}`);
  }

  return response.json() as Promise<SaveSettingsResponse>;
}

export async function testConnection(payload: {
  api_base_url: string;
  access_token: string;
  app_key: string;
  app_secret: string;
  username: string;
  password: string;
  verify_ssl: boolean;
}): Promise<TestConnectionResponse> {
  const response = await fetch(`${API_BASE_URL}/api/settings/test-connection`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to test connection: ${response.status}`);
  }

  return response.json() as Promise<TestConnectionResponse>;
}