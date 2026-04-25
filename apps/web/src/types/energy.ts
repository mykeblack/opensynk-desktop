export interface LiveSummary {
  solar_w: number;
  load_w: number;
  battery_soc: number;
  grid_w: number;
  battery_w: number;
  timestamp?: string | null;
}

export interface RealLiveSummary {
  sn: string;
  plant_name: string;
  power_w: number;
  today_kwh: number;
  total_kwh: number;
  last_update: string;
  solar_w: number;
  load_w: number;
  battery_soc: number;
  battery_w: number;
  grid_w: number;
}
