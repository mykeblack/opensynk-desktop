import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, BarChart3, Bolt, Clock3, Home, RadioTower, Sun } from 'lucide-react';
import { getPowerHistory } from '../api/history';
import { getSettings } from '../api/settings';
import type { PowerHistoryPoint } from '../types/history';
import './HistoryPage.css';

function SunLogoMark({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className="brand-logo__mark-svg">
      <g stroke="#facc15" strokeWidth="3.5" strokeLinecap="round">
        <line x1="32" y1="3" x2="32" y2="11" />
        <line x1="32" y1="53" x2="32" y2="61" />
        <line x1="3" y1="32" x2="11" y2="32" />
        <line x1="53" y1="32" x2="61" y2="32" />
        <line x1="11.5" y1="11.5" x2="17" y2="17" />
        <line x1="47" y1="47" x2="52.5" y2="52.5" />
        <line x1="52.5" y1="11.5" x2="47" y2="17" />
        <line x1="17" y1="47" x2="11.5" y2="52.5" />
      </g>
      <circle cx="32" cy="32" r="13" fill="#facc15" />
    </svg>
  );
}

function PageBrand({ mode, secondsSinceUpdate }: { mode: 'demo' | 'live'; secondsSinceUpdate: number | null }) {
  const isStale = secondsSinceUpdate !== null && secondsSinceUpdate > 180;

  return (
    <header className="page-brand-header">
      <a className="brand-logo" href="/dashboard" aria-label="OpenSynk dashboard">
        <SunLogoMark />
        <span className="brand-logo__text">
          <strong>Open<span>Synk</span></strong>
          <em>Energy intelligence</em>
        </span>
      </a>

      <div className="page-header-pills">
        <span className={`status-pill ${isStale ? 'status-pill--stale' : 'status-pill--fresh'}`}>
          <span />{isStale ? 'Stale' : 'Live refresh'}
        </span>
        <span className={`status-pill ${mode === 'demo' ? 'status-pill--demo' : 'status-pill--live'}`}>
          {mode === 'demo' ? 'Demo Mode' : 'Live Mode'}
        </span>
        <span className="status-pill status-pill--muted">
          <Clock3 size={15} />
          {secondsSinceUpdate !== null ? `${secondsSinceUpdate}s ago` : 'Waiting'}
        </span>
      </div>
    </header>
  );
}

function formatWatts(value?: number | null): string {
  return `${Number(value ?? 0).toLocaleString()} W`;
}

function formatTimeLabel(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function HistoryPage() {
  const [points, setPoints] = useState<PowerHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataMode, setDataMode] = useState<'demo' | 'live'>('demo');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [now, setNow] = useState(new Date());

  async function loadHistory() {
    try {
      setError(null);
      const [historyResult, settingsResult] = await Promise.allSettled([
        getPowerHistory(),
        getSettings(),
      ]);

      if (historyResult.status === 'fulfilled') {
        const pts = historyResult.value.points ?? [];
        setPoints(pts);
        if (pts.length > 0 && pts[pts.length - 1].time) {
          setLastUpdated(new Date(pts[pts.length - 1].time));
        }
      } else {
        throw historyResult.reason;
      }

      if (settingsResult.status === 'fulfilled') {
        setDataMode(settingsResult.value.data_mode ?? 'demo');
      }
    } catch (err) {
      console.error('History load failed', err);
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
    const refreshId = window.setInterval(loadHistory, 5000);
    return () => window.clearInterval(refreshId);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const secondsSinceUpdate = lastUpdated
    ? Math.max(0, Math.floor((now.getTime() - lastUpdated.getTime()) / 1000))
    : null;

  const peakSolar = points.length > 0 ? Math.max(...points.map((p) => p.solar_w ?? 0)) : 0;
  const peakLoad = points.length > 0 ? Math.max(...points.map((p) => p.load_w ?? 0)) : 0;
  const maxImport = points.length > 0 ? Math.max(...points.map((p) => p.grid_w ?? 0)) : 0;
  const maxExport = points.length > 0 ? Math.abs(Math.min(...points.map((p) => p.grid_w ?? 0))) : 0;

  return (
    <main className="modern-subpage history-page">
      <PageBrand mode={dataMode} secondsSinceUpdate={secondsSinceUpdate} />

      <section className="page-hero-card">
        <div>
          <span className="page-kicker"><BarChart3 size={16} /> Power History</span>
          <h1>Energy trends</h1>
          <p>Auto-refreshing power samples for your selected inverter.</p>
        </div>
        <div className="page-hero-stat">
          <strong>{points.length}</strong>
          <span>samples</span>
        </div>
      </section>

      {loading && <div className="page-state">Loading history...</div>}
      {error && !loading && <div className="page-state page-state--error">Failed to load history: {error}</div>}

      {!loading && !error && (
        <>
          <section className="history-kpi-grid">
            <article className="modern-kpi modern-kpi--solar"><Sun size={22} /><span>Peak Solar</span><strong>{formatWatts(peakSolar)}</strong></article>
            <article className="modern-kpi modern-kpi--home"><Home size={22} /><span>Peak Load</span><strong>{formatWatts(peakLoad)}</strong></article>
            <article className="modern-kpi modern-kpi--grid"><Bolt size={22} /><span>Max Import</span><strong>{formatWatts(maxImport)}</strong></article>
            <article className="modern-kpi modern-kpi--export"><RadioTower size={22} /><span>Max Export</span><strong>{formatWatts(maxExport)}</strong></article>
          </section>

          <section className="modern-panel history-chart-panel">
            <div className="modern-panel__header">
              <div>
                <h2>Power Trends</h2>
                <p>Solar, home load, grid and battery power over time</p>
              </div>
              <Activity className="panel-icon" size={26} />
            </div>

            <div className="history-chart">
              <ResponsiveContainer width="100%" height={390}>
                <AreaChart data={points}>
                  <defs>
                    <linearGradient id="solarGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#facc15" stopOpacity={0.28} /><stop offset="100%" stopColor="#facc15" stopOpacity={0.02} /></linearGradient>
                    <linearGradient id="homeGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22a3ff" stopOpacity={0.22} /><stop offset="100%" stopColor="#22a3ff" stopOpacity={0.02} /></linearGradient>
                    <linearGradient id="gridGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a855f7" stopOpacity={0.18} /><stop offset="100%" stopColor="#a855f7" stopOpacity={0.01} /></linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                  <XAxis dataKey="time" tickFormatter={formatTimeLabel} minTickGap={24} tick={{ fill: '#a7b4c7', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#a7b4c7', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip labelFormatter={(label) => formatTimeLabel(label as string | null)} formatter={(value: number) => formatWatts(value)} contentStyle={{ background: '#081220', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12, color: '#f8fafc' }} />
                  <Area type="monotone" dataKey="solar_w" name="Solar" stroke="#facc15" fill="url(#solarGradient)" strokeWidth={2.6} dot={false} />
                  <Area type="monotone" dataKey="load_w" name="Load" stroke="#22a3ff" fill="url(#homeGradient)" strokeWidth={2.6} dot={false} />
                  <Area type="monotone" dataKey="grid_w" name="Grid" stroke="#a855f7" fill="url(#gridGradient)" strokeWidth={2.4} dot={false} />
                  <Area type="monotone" dataKey="battery_w" name="Battery" stroke="#2ee66b" fill="transparent" strokeWidth={2.2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
