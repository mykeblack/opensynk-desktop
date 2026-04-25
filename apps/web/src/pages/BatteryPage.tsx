import { useEffect, useState } from 'react';
import { BatteryCharging, BatteryFull, BatteryLow, BatteryMedium, Clock3, Gauge, HeartPulse, Thermometer, Zap } from 'lucide-react';
import { getBatterySummary } from '../api/battery';
import type { BatterySummary } from '../types/battery';
import './BatteryPage.css';

function SunLogoMark({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className="brand-logo__mark-svg">
      <g stroke="#facc15" strokeWidth="3.5" strokeLinecap="round">
        <line x1="32" y1="3" x2="32" y2="11" /><line x1="32" y1="53" x2="32" y2="61" /><line x1="3" y1="32" x2="11" y2="32" /><line x1="53" y1="32" x2="61" y2="32" /><line x1="11.5" y1="11.5" x2="17" y2="17" /><line x1="47" y1="47" x2="52.5" y2="52.5" /><line x1="52.5" y1="11.5" x2="47" y2="17" /><line x1="17" y1="47" x2="11.5" y2="52.5" />
      </g>
      <circle cx="32" cy="32" r="13" fill="#facc15" />
    </svg>
  );
}

function PageBrand({ secondsSinceUpdate }: { secondsSinceUpdate: number | null }) {
  const isStale = secondsSinceUpdate !== null && secondsSinceUpdate > 180;
  return (
    <header className="page-brand-header">
      <a className="brand-logo" href="/dashboard" aria-label="OpenSynk dashboard">
        <SunLogoMark />
        <span className="brand-logo__text"><strong>Open<span>Synk</span></strong><em>Energy intelligence</em></span>
      </a>
      <div className="page-header-pills">
        <span className={`status-pill ${isStale ? 'status-pill--stale' : 'status-pill--fresh'}`}><span />{isStale ? 'Stale' : 'Auto refresh'}</span>
        <span className="status-pill status-pill--muted"><Clock3 size={15} />{secondsSinceUpdate !== null ? `${secondsSinceUpdate}s ago` : 'Waiting'}</span>
      </div>
    </header>
  );
}

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

function getStatusLabel(status?: number | null): string {
  switch (status) {
    case 1: return 'Online';
    case 2: return 'Charging';
    case 0: return 'Offline';
    default: return status == null ? 'Unknown' : `Status ${status}`;
  }
}

function batteryIcon(soc: number) {
  if (soc >= 75) return <BatteryFull size={44} />;
  if (soc >= 40) return <BatteryMedium size={44} />;
  if (soc >= 15) return <BatteryLow size={44} />;
  return <BatteryCharging size={44} />;
}

export function BatteryPage() {
  const [data, setData] = useState<BatterySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastLoaded, setLastLoaded] = useState<Date | null>(null);
  const [now, setNow] = useState(new Date());

  async function loadBattery() {
    try {
      setError(null);
      const result = await getBatterySummary();
      setData(result);
      setLastLoaded(new Date());
    } catch (err) {
      console.error('Battery load failed', err);
      setError(err instanceof Error ? err.message : 'Failed to load battery data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBattery();
    const refreshId = window.setInterval(loadBattery, 5000);
    return () => window.clearInterval(refreshId);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const soc = Math.max(0, Math.min(100, data?.soc ?? 0));
  const secondsSinceUpdate = lastLoaded ? Math.max(0, Math.floor((now.getTime() - lastLoaded.getTime()) / 1000)) : null;

  return (
    <main className="modern-subpage battery-page">
      <PageBrand secondsSinceUpdate={secondsSinceUpdate} />

      <section className="page-hero-card battery-hero-card">
        <div>
          <span className="page-kicker"><BatteryCharging size={16} /> Battery System</span>
          <h1>{soc}%</h1>
          <p>{getPowerLabel(data?.power_w)} • {formatWatts(data?.power_w)}</p>
        </div>
        <div className="battery-visual" style={{ ['--battery-level' as string]: `${soc}%` }}>
          <div className="battery-visual__terminal" />
          <div className="battery-visual__body">
            <div className="battery-visual__fill" />
            <div className="battery-visual__icon">{batteryIcon(soc)}</div>
          </div>
        </div>
      </section>

      {loading && <div className="page-state">Loading battery...</div>}
      {error && !loading && <div className="page-state page-state--error">Failed to load battery: {error}</div>}

      {!loading && data && (
        <>
          <section className="battery-kpi-grid">
            <article className="modern-kpi"><Zap size={22} /><span>Voltage</span><strong>{formatNumber(data.voltage_v)} V</strong></article>
            <article className="modern-kpi"><Gauge size={22} /><span>Current</span><strong>{formatNumber(data.current_a)} A</strong></article>
            <article className="modern-kpi"><Thermometer size={22} /><span>Temperature</span><strong>{formatNumber(data.temperature_c)} °C</strong></article>
            <article className="modern-kpi"><HeartPulse size={22} /><span>Status</span><strong>{getStatusLabel(data.status)}</strong></article>
          </section>

          <section className="battery-detail-grid">
            <article className="modern-panel">
              <div className="modern-panel__header"><div><h2>Energy today</h2><p>Charge and discharge totals</p></div></div>
              <div className="battery-stats">
                <div><span>Today Charge</span><strong>{formatNumber(data.today_charge_kwh)} kWh</strong></div>
                <div><span>Today Discharge</span><strong>{formatNumber(data.today_discharge_kwh)} kWh</strong></div>
                <div><span>Lifetime Charge</span><strong>{formatNumber(data.total_charge_kwh)} kWh</strong></div>
                <div><span>Lifetime Discharge</span><strong>{formatNumber(data.total_discharge_kwh)} kWh</strong></div>
              </div>
            </article>

            <article className="modern-panel">
              <div className="modern-panel__header"><div><h2>Battery limits</h2><p>Configured voltage and current limits</p></div></div>
              <div className="battery-stats">
                <div><span>Capacity</span><strong>{formatNumber(data.capacity_percent)}%</strong></div>
                <div><span>Charge Voltage</span><strong>{formatNumber(data.charge_voltage_v)} V</strong></div>
                <div><span>Discharge Voltage</span><strong>{formatNumber(data.discharge_voltage_v)} V</strong></div>
                <div><span>Charge Current Limit</span><strong>{formatNumber(data.charge_current_limit_a)} A</strong></div>
                <div><span>Discharge Current Limit</span><strong>{formatNumber(data.discharge_current_limit_a)} A</strong></div>
              </div>
            </article>

            <article className="modern-panel">
              <div className="modern-panel__header"><div><h2>BMS metrics</h2><p>Battery management system values</p></div></div>
              <div className="battery-stats">
                <div><span>BMS SOC</span><strong>{formatNumber(data.bms_soc)}%</strong></div>
                <div><span>BMS Voltage</span><strong>{formatNumber(data.bms_voltage_v)} V</strong></div>
                <div><span>BMS Current</span><strong>{formatNumber(data.bms_current_a)} A</strong></div>
                <div><span>BMS Temp</span><strong>{formatNumber(data.bms_temp_c)} °C</strong></div>
              </div>
            </article>
          </section>
        </>
      )}
    </main>
  );
}
