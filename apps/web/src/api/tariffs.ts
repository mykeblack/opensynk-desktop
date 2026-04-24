import { apiGet, apiPost } from './client';

export type Tariffs = {
  tariff_daily_rate: string;
  tariff_unit_rate: string;
  tariff_export_rate: string;
  tariff_has_night_rate: boolean;
  tariff_night_rate: string;
  tariff_night_start: string;
  tariff_night_end: string;
  tariff_investment_cost: string;
};

export async function getTariffs(): Promise<Tariffs> {
  return apiGet<Tariffs>('/api/tariffs');
}

export async function saveTariffs(payload: Tariffs) {
  return apiPost<{ success: boolean }>('/api/tariffs', payload);
}