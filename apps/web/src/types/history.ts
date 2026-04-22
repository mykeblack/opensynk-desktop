export interface PowerHistoryPoint {
  time: string;
  solar_w: number;
  load_w: number;
  grid_w: number;
  battery_w: number;
}

export interface PowerHistoryResponse {
  range: string;
  points: PowerHistoryPoint[];
}