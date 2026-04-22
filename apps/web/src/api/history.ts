import { apiGet } from './client';
import type { PowerHistoryResponse } from '../types/history';

export async function getPowerHistory(range = '24h'): Promise<PowerHistoryResponse> {
  return apiGet<PowerHistoryResponse>(`/api/history/power?range=${encodeURIComponent(range)}`);
}