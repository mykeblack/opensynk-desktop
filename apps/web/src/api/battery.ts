import { apiGet } from './client';
import type { BatterySummary } from '../types/battery';

export async function getBatterySummary(): Promise<BatterySummary> {
  return apiGet<BatterySummary>('/api/battery/summary');
}