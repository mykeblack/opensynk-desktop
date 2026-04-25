export interface BatterySummary {
  soc: number;
  power_w: number;
  capacity_percent: number;
  voltage_v: number;
  current_a: number;
  temperature_c: number;
  bms_soc: number;
  bms_voltage_v: number;
  bms_current_a: number;
  bms_temp_c: number;
  charge_voltage_v: number;
  discharge_voltage_v: number;
  charge_current_limit_a: number;
  discharge_current_limit_a: number;
  status: number;
  today_charge_kwh: number;
  today_discharge_kwh: number;
  total_charge_kwh: number;
  total_discharge_kwh: number;
}