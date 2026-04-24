import { apiGet } from './client';

export interface RoiSummary {
  investment_cost: number;
  estimated_savings: number;
  export_credit: number;
  total_benefit: number;
  solar_generated_kwh: number;
  self_consumed_solar_kwh: number;
  exported_kwh: number;
  roi_percent: number;
  today_savings: number;
  today_export_credit: number;
  today_total_benefit: number;
}

export async function getRoiSummary(): Promise<RoiSummary> {
  return apiGet<RoiSummary>('/api/roi/summary');
}