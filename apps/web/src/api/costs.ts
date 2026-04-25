// src/api/costs.ts
import { apiGet } from './client';

export interface CostToday {
  cost_today: number;
  energy_kwh: number;
  day_kwh: number;
  night_kwh: number;
  daily_charge: number;
}

export async function getCostToday(): Promise<CostToday> {
  return apiGet('/api/costs/today');
}