export interface AlertItem {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface AlertsResponse {
  alerts: AlertItem[];
}