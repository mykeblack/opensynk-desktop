export interface SettingsResponse {
  api_base_url: string;
  access_token: string;
  poll_interval_seconds: number;
  selected_site: string;
  verify_ssl: boolean;
}

export interface SaveSettingsResponse {
  success: boolean;
  message: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  site_count?: number;
}