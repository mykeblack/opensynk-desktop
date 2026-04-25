import { apiGet } from './client';
import type { PowerHistoryResponse } from '../types/history';

export async function getPowerHistory(): Promise<PowerHistoryResponse> {
  return apiGet<PowerHistoryResponse>('/api/history/power');
}