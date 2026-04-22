import { apiGet } from './client';
import type { LiveSummary } from '../types/energy';

export async function getLiveSummary(): Promise<LiveSummary> {
  return apiGet<LiveSummary>('/api/live/summary');
}