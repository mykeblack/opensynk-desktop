import { apiGet } from './client';
import type { LiveSummary, RealLiveSummary } from '../types/energy';

export async function getLiveSummary(): Promise<LiveSummary> {
  return apiGet<LiveSummary>('/api/live/summary');
}

export async function getRealLiveSummary(): Promise<RealLiveSummary> {
  return apiGet<RealLiveSummary>('/api/live/summary-real');
}