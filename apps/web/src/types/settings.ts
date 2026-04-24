export interface SettingsResponse {
  api_base_url: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  token_expires_in: number | null;
  username: string;
  poll_interval_seconds: number;
  selected_site: string;
  verify_ssl: boolean;
  data_mode: 'demo' | 'live';
  tariff_daily_rate: string;
  tariff_unit_rate: string;
  tariff_has_night_rate: boolean;
  tariff_night_rate: string;
  tariff_night_start: string;
  tariff_night_end: string;
  tariff_investment_cost: string;
  tariff_export_rate: string;
}

export interface SaveSettingsPayload {
  api_base_url: string;
  access_token: string;
  username: string;
  poll_interval_seconds: number;
  selected_site: string;
  verify_ssl: boolean;
  data_mode: 'demo' | 'live';
  tariff_daily_rate: string;
  tariff_unit_rate: string;
  tariff_has_night_rate: boolean;
  tariff_night_rate: string;
  tariff_night_start: string;
  tariff_night_end: string;
  tariff_investment_cost: string;
  tariff_export_rate: string;
}

export interface SaveSettingsResponse {
  success: boolean;
  message: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message?: string;
  status_code?: number;
  url?: string;
  response_text?: string;
  token_type?: string;
  expires_in?: number;
  access_token?: string;
}