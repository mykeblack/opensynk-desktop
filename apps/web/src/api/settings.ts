import { apiGet, apiPost } from './client';
import type { SaveSettingsPayload, SettingsResponse } from '../types/settings';

export async function getSettings(): Promise<SettingsResponse> {
  return apiGet<SettingsResponse>('/api/settings');
}

export async function saveSettings(
  payload: SaveSettingsPayload,
): Promise<{ success: boolean; message?: string }> {
  return apiPost('/api/settings', payload);
}