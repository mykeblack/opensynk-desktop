export interface PowerHistoryPoint {
  time: string | null;
  solar_w: number;
  load_w: number;
  battery_soc: number;
  battery_w: number;
  grid_w: number;
}

export interface PowerHistoryResponse {
  points: PowerHistoryPoint[];
}