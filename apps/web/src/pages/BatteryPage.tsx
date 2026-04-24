import { useEffect, useState } from 'react';
import { getBatterySummary } from '../api/battery';
import type { BatterySummary } from '../types/battery';
import './BatteryPage.css';

function formatWatts(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return '0 W';
  return `${Math.abs(value).toLocaleString()} W`;
}

function getPowerLabel(power?: number | null): string {
  if (power == null || Number.isNaN(power)) return 'Idle';
  if (power < 0) return 'Discharging';
  if (power > 0) return 'Charging';
  return 'Idle';
}

function formatNumber(value?: number | null, digits = 1): string {
  if (value == null || Number.isNaN(value)) return '0.0';
  return value.toFixed(digits);
}

function getStatusLabel(status: number): string {
  switch (status) {
    case 1:
      return 'Online';
    case 0:
      return 'Offline';
    default:
      return `Status ${status}`;
  }
}

export function BatteryPage() {
  const [data, setData] = useState<BatterySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadBattery() {
    try {
      setError(null);
      const result = await getBatterySummary();
      setData(result);
    } catch (err) {
      console.error('Battery load failed', err);
      setError(err instanceof Error ? err.message : 'Failed to load battery data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBattery();

    const intervalId = window.setInterval(() => {
      loadBattery();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <main className="dashboard-page">
      <header className="dashboard-page__header">
        <div>
          <h1>Battery</h1>
          <p>Live battery health, charging, and BMS values</p>
        </div>

        <button className="refresh-button" onClick={loadBattery}>
          Refresh
        </button>
      </header>

      {loading && <div className="dashboard-state">Loading battery...</div>}

      {error && !loading && (
        <div className="dashboard-state dashboard-state--error">
          Failed to load battery: {error}
        </div>
      )}

      {!loading && data && (
        <section className="battery-layout">
          <div className="battery-hero">
            <div className="battery-hero__soc">
              <div className="battery-hero__label">State of Charge</div>
              <div className="battery-hero__value">{data?.soc ?? 0}%</div>
              <div className="battery-hero__subvalue">
                {getPowerLabel(data?.power_w)} • {formatWatts(data?.power_w)}
              </div>
            </div>

            <div className="battery-meter">
              <div className="battery-meter__shell">
                <div
                  className="battery-meter__fill"
                  style={{ width: `${Math.max(0, Math.min(100, data?.soc ?? 0))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="battery-grid">
            <div className="battery-card">
              <div className="battery-card__label">Voltage</div>
              <div className="battery-card__value">{formatNumber(data.voltage_v)} V</div>
            </div>

            <div className="battery-card">
              <div className="battery-card__label">Current</div>
              <div className="battery-card__value">{formatNumber(data.current_a)} A</div>
            </div>

            <div className="battery-card">
              <div className="battery-card__label">Temperature</div>
              <div className="battery-card__value">{formatNumber(data.temperature_c)} °C</div>
            </div>

            <div className="battery-card">
              <div className="battery-card__label">Status</div>
              <div className="battery-card__value">{getStatusLabel(data.status)}</div>
            </div>

            <div className="battery-card">
              <div className="battery-card__label">Today Charge</div>
              <div className="battery-card__value">{formatNumber(data.today_charge_kwh)} kWh</div>
            </div>

            <div className="battery-card">
              <div className="battery-card__label">Today Discharge</div>
              <div className="battery-card__value">{formatNumber(data.today_discharge_kwh)} kWh</div>
            </div>

            <div className="battery-card">
              <div className="battery-card__label">Lifetime Charge</div>
              <div className="battery-card__value">{formatNumber(data.total_charge_kwh)} kWh</div>
            </div>

            <div className="battery-card">
              <div className="battery-card__label">Lifetime Discharge</div>
              <div className="battery-card__value">{formatNumber(data.total_discharge_kwh)} kWh</div>
            </div>
          </div>

          <div className="battery-detail-grid">
            <section className="battery-panel">
              <div className="battery-panel__header">
                <h2>Battery Metrics</h2>
              </div>

              <div className="battery-stats">
                <div><span>Capacity</span><strong>{formatNumber(data.capacity_percent)}%</strong></div>
                <div><span>Charge Voltage</span><strong>{formatNumber(data.charge_voltage_v)} V</strong></div>
                <div><span>Discharge Voltage</span><strong>{formatNumber(data.discharge_voltage_v)} V</strong></div>
                <div><span>Charge Current Limit</span><strong>{formatNumber(data.charge_current_limit_a)} A</strong></div>
                <div><span>Discharge Current Limit</span><strong>{formatNumber(data.discharge_current_limit_a)} A</strong></div>
              </div>
            </section>

            <section className="battery-panel">
              <div className="battery-panel__header">
                <h2>BMS Metrics</h2>
              </div>

              <div className="battery-stats">
                <div><span>BMS SOC</span><strong>{formatNumber(data.bms_soc)}%</strong></div>
                <div><span>BMS Voltage</span><strong>{formatNumber(data.bms_voltage_v)} V</strong></div>
                <div><span>BMS Current</span><strong>{formatNumber(data.bms_current_a)} A</strong></div>
                <div><span>BMS Temp</span><strong>{formatNumber(data.bms_temp_c)} °C</strong></div>
              </div>
            </section>
          </div>
        </section>
      )}
    </main>
  );
}