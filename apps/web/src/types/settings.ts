export interface SettingsResponse {
  api_base_url: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  token_expires_in: number | null;
  app_key: string;
  app_secret: string;
  username: string;
  password: string;
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
  message?: string;
  status_code?: number;
  url?: string;
  response_text?: string;
  token_type?: string;
  expires_in?: number;
}