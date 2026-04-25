import { apiGet } from './client';
import type { AlertsResponse } from '../types/alerts';

export async function getAlerts(): Promise<AlertsResponse> {
  return apiGet<AlertsResponse>('/api/alerts');
}