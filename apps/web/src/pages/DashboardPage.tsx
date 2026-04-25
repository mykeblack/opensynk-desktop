import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConsoleMode, useConsoleTransitionClass } from '../hooks/useConsoleMode';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  Settings as SettingsIcon,
  Home,
  Leaf,
  PoundSterling,
  Server,
  Sun,
  Thermometer,
  TrendingUp,
} from 'lucide-react';

/**
 * Portrait battery icon with a terminal and 3 horizontal level bars.
 * Bars fill from the bottom proportional to `soc` (0-100) in discrete steps.
 * Inherits colour via `currentColor`.
 */
function BatteryLevelIcon({ soc, size = 54 }: { soc: number; size?: number }) {
  const pct = Math.max(0, Math.min(100, soc));
  const BAR_COUNT = 3;
  // Pick filled bars so a small positive charge still lights one bar.
  const filled = pct <= 0 ? 0 : Math.max(1, Math.round((pct / 100) * BAR_COUNT));
  // viewBox is 36 x 60 (portrait), scale by height to keep aspect.
  const width = size * (36 / 60);

  const barHeight = 9;
  const gap = 3;
  const bottomY = 53; // inner bottom of body

  return (
    <svg
      viewBox="0 0 36 60"
      width={width}
      height={size}
      aria-hidden="true"
      style={{ color: 'currentColor' }}
    >
      {/* Terminal nub */}
      <rect x="12" y="1.5" width="12" height="4.5" rx="1.5" fill="currentColor" />
      {/* Body outline */}
      <rect
        x="3"
        y="7.5"
        width="30"
        height="49.5"
        rx="4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.75"
      />
      {/* Filled level bars, bottom up */}
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        if (i >= filled) return null;
        const y = bottomY - (i + 1) * barHeight - i * gap;
        return (
          <rect
            key={i}
            x="8"
            y={y}
            width="20"
            height={barHeight}
            rx="1.5"
            fill="currentColor"
          />
        );
      })}
    </svg>
  );
}


function PylonIcon({ size = 56, strokeWidth = 2.2 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ color: 'currentColor' }}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M32 6 L18 58" />
        <path d="M32 6 L46 58" />
        <path d="M24 30 L40 30" />
        <path d="M21 42 L43 42" />
        <path d="M28 18 L36 18" />
        <path d="M32 6 L32 18" />
        <path d="M16 24 L48 24" />
        <path d="M20 24 L28 18" />
        <path d="M44 24 L36 18" />
        <path d="M18 58 L32 42 L46 58" />
      </g>
    </svg>
  );
}

function SunLogoMark({ size = 56 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      className="brand-logo__mark-svg"
    >
      {/* 8 rays — 4 cardinal + 4 diagonal, rounded tips */}
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
      {/* Solid flat sun disc */}
      <circle cx="32" cy="32" r="13" fill="#facc15" />
    </svg>
  );
}
import { getLiveSummary, getRealLiveSummary } from '../api/energy';
import { getPowerHistory } from '../api/history';
import { getRoiSummary, type RoiSummary } from '../api/roi';
import { getSettings } from '../api/settings';
import type { LiveSummary, RealLiveSummary } from '../types/energy';
import type { PowerHistoryPoint } from '../types/history';
import './DashboardPage.css';

type DataMode = 'demo' | 'live';
type ChartRange = '24H' | '7D' | '30D';

function formatKw(value?: number | null): string {
  if (value == null || Number.isNaN(value)) return '0 kW';
  return `${(Math.abs(value) / 1000).toFixed(2)} kW`;
}

function money(value?: number | null): string {
  return `£${Number(value ?? 0).toFixed(2)}`;
}

function inferGridFlowWatts(
  gridWatts: number,
  solarWatts: number,
  loadWatts: number,
  batteryWatts: number,
): number {
  // Sunsynk APIs can report grid power with different sign conventions.
  // Prefer the physical balance when we have all live values:
  // +ve = importing from grid, -ve = exporting to grid.
  // Battery +ve means charging, -ve means discharging.
  const inferred = loadWatts - solarWatts + batteryWatts;

  if (Math.abs(inferred) > 75) {
    return inferred;
  }

  return gridWatts;
}

function getGridLabel(gridFlowWatts: number): string {
  if (gridFlowWatts > 75) return 'Importing';
  if (gridFlowWatts < -75) return 'Exporting';
  return 'Balanced';
}

function getGridTone(gridFlowWatts: number): 'import' | 'export' | 'balanced' {
  if (gridFlowWatts > 75) return 'import';
  if (gridFlowWatts < -75) return 'export';
  return 'balanced';
}

function getBatteryLabel(powerWatts: number): string {
  if (powerWatts > 0) return 'Charging';
  if (powerWatts < 0) return 'Discharging';
  return 'Idle';
}

function getBatteryIcon(soc: number, size = 54) {
  return <BatteryLevelIcon soc={soc} size={size} />;
}

function flowSpeed(value: number, max = 5000): string {
  const clamped = Math.max(0, Math.min(Math.abs(value), max));
  const ratio = clamped / max;
  const seconds = 1.65 - ratio * 1.05;
  return `${Math.max(0.42, seconds).toFixed(2)}s`;
}

function flowWidth(value: number, max = 5000): number {
  const clamped = Math.max(0, Math.min(Math.abs(value), max));
  const ratio = clamped / max;
  return 2.2 + ratio * 3.2;
}

function flowGlow(value: number, max = 5000): number {
  const clamped = Math.max(0, Math.min(Math.abs(value), max));
  const ratio = clamped / max;
  return 8 + ratio * 24;
}

function flowStyle(value: number): React.CSSProperties {
  return {
    '--flow-speed': flowSpeed(value),
    '--flow-width': `${flowWidth(value)}px`,
    '--flow-glow': `${flowGlow(value)}px`,
    '--flow-opacity': `${0.42 + (Math.min(Math.abs(value), 5000) / 5000) * 0.42}`,
  } as React.CSSProperties;
}

function getStatusText(secondsSinceUpdate: number | null, loading: boolean): string {
  if (loading) return 'Loading';
  if (secondsSinceUpdate == null) return 'No data';
  if (secondsSinceUpdate > 180) return 'Stale';
  return 'Live';
}

function percent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Deterministic pseudo-random so repeated renders don't jitter. */
function seededNoise(seed: number): number {
  const s = Math.sin(seed * 9301 + 49297) * 233280;
  return s - Math.floor(s);
}

/** Solar contribution for a given hour of the day (0..1). */
function solarShape(hour: number): number {
  return Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
}

/** Household load for a given hour (watts). */
function loadShape(hour: number): number {
  return (
    900 +
    Math.sin((hour / 24) * Math.PI * 2) * 250 +
    (hour >= 7 && hour <= 9 ? 600 : 0) +
    (hour >= 18 && hour <= 21 ? 900 : 0)
  );
}

function buildMockPoint(date: Date, hour: number, seed: number): PowerHistoryPoint {
  const solar = solarShape(hour);
  const solar_w = Math.max(0, Math.round(solar * 3000 + (seededNoise(seed) - 0.5) * 120));
  const load_w = Math.max(
    0,
    Math.round(loadShape(hour) + (seededNoise(seed + 1) - 0.5) * 120),
  );
  const battery_w = Math.round((solar_w - load_w) * 0.55 + (seededNoise(seed + 2) - 0.5) * 80);
  const grid_w = Math.round(load_w - solar_w - battery_w);
  const t = new Date(date);
  t.setHours(hour, 0, 0, 0);
  return {
    time: t.toISOString(),
    solar_w,
    load_w,
    battery_soc: percent(40 + solar * 40),
    battery_w,
    grid_w,
  };
}

/** 24 hourly points for today. */
function buildMockDay(): PowerHistoryPoint[] {
  const now = new Date();
  const points: PowerHistoryPoint[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    points.push(buildMockPoint(now, hour, hour));
  }
  return points;
}

/** Daily aggregates for the last N days (one point per day at midday). */
function buildMockDailySeries(days: number): PowerHistoryPoint[] {
  const points: PowerHistoryPoint[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let d = days - 1; d >= 0; d -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - d);
    // Average the day by summing shapes over its 24 hours
    let solar_w = 0;
    let load_w = 0;
    let battery_w = 0;
    let grid_w = 0;
    let socSum = 0;
    for (let hour = 0; hour < 24; hour += 1) {
      const p = buildMockPoint(day, hour, d * 31 + hour);
      solar_w += p.solar_w;
      load_w += p.load_w;
      battery_w += p.battery_w;
      grid_w += p.grid_w;
      socSum += p.battery_soc;
    }
    const t = new Date(day);
    t.setHours(12, 0, 0, 0);
    points.push({
      time: t.toISOString(),
      solar_w: Math.round(solar_w / 24),
      load_w: Math.round(load_w / 24),
      battery_w: Math.round(battery_w / 24),
      grid_w: Math.round(grid_w / 24),
      battery_soc: Math.round(socSum / 24),
    });
  }
  return points;
}

function formatHour(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:00`;
}

function formatDayShort(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

function formatDayNum(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function MetricTile({
  icon,
  title,
  value,
  subtitle,
  tone,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  tone: 'solar' | 'home' | 'battery' | 'grid' | 'money';
  action?: React.ReactNode;
}) {
  return (
    <article className={`hero-metric hero-metric--${tone}`}>
      <div className="hero-metric__icon">{icon}</div>
      <div>
        <div className="hero-metric__title">{title}</div>
        <div className="hero-metric__value">{value}</div>
        <div className="hero-metric__subtitle">{subtitle}</div>
        {action}
      </div>
    </article>
  );
}

function MiniTile({
  icon,
  tone,
  label,
  value,
  caption,
  captionTone,
}: {
  icon: React.ReactNode;
  tone: 'solar' | 'home' | 'battery' | 'grid' | 'temp';
  label: string;
  value: string;
  caption: string;
  captionTone?: 'ok' | 'warn' | 'mute' | 'accent';
}) {
  return (
    <article className={`mini-tile mini-tile--${tone}`}>
      <div className="mini-tile__icon">{icon}</div>
      <div className="mini-tile__label">{label}</div>
      <div className="mini-tile__value">{value}</div>
      <div className={`mini-tile__caption mini-tile__caption--${captionTone ?? 'mute'}`}>{caption}</div>
    </article>
  );
}

function FlowNode({
  className,
  circleClassName,
  icon,
  label,
  value,
  status,
  extra,
  onClick,
}: {
  className: string;
  circleClassName: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  status: string;
  extra?: React.ReactNode;
  onClick?: () => void;
}) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  }

  return (
    <div
      className={`flow-node ${className} ${onClick ? 'flow-node--clickable' : ''}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className={`flow-node__circle ${circleClassName}`}>{icon}{extra}</div>
      <div className="flow-node__info">
        <div className="flow-node__label">{label}</div>
        <div className="flow-node__value">{value}</div>
        <div className="flow-node__status">{status}</div>
      </div>
    </div>
  );
}

function FlowPath({
  id,
  className,
  d,
  power,
  caretCount = 4,
}: {
  id: string;
  className: string;
  d: string;
  power: number;
  caretCount?: number;
}) {
  if (Math.abs(power) <= 40) {
    return null;
  }

  return (
    <g className={`flow-path-group ${className}`} style={flowStyle(power)}>
      <path id={id} className="flow-path" d={d} />

      {Array.from({ length: caretCount }).map((_, index) => (
        <text key={index} className="flow-caret" aria-hidden="true">
          ›
          <animateMotion
            dur={flowSpeed(power)}
            begin={`${index * 0.28}s`}
            repeatCount="indefinite"
            rotate="auto"
          >
            <mpath href={`#${id}`} />
          </animateMotion>
        </text>
      ))}
    </g>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { consoleMode } = useConsoleMode();
  const consoleTransitionClass = useConsoleTransitionClass();
  const [data, setData] = useState<LiveSummary | null>(null);
  const [realData, setRealData] = useState<RealLiveSummary | null>(null);
  const [dataMode, setDataMode] = useState<DataMode>('demo');
  const [username, setUsername] = useState(localStorage.getItem('opensynk_username') || '');
  const [roi, setRoi] = useState<RoiSummary | null>(null);
  const [history, setHistory] = useState<PowerHistoryPoint[] | null>(null);
  const [chartRange, setChartRange] = useState<ChartRange>('24H');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [now, setNow] = useState(new Date());

  const displayData: LiveSummary | null = useMemo(() => {
    if (realData) {
      return {
        solar_w: Number(realData.solar_w ?? realData.power_w ?? 0),
        load_w: Number(realData.load_w ?? 0),
        battery_soc: Number(realData.battery_soc ?? 0),
        grid_w: Number(realData.grid_w ?? 0),
        battery_w: Number(realData.battery_w ?? 0),
        timestamp: realData.last_update ?? null,
      };
    }

    return data
      ? {
          solar_w: Number(data.solar_w ?? 0),
          load_w: Number(data.load_w ?? 0),
          battery_soc: Number(data.battery_soc ?? 0),
          grid_w: Number(data.grid_w ?? 0),
          battery_w: Number(data.battery_w ?? 0),
          timestamp: data.timestamp ?? null,
        }
      : null;
  }, [data, realData]);

  const solarEfficiency = useMemo(() => {
    // Temporary derived value until you store panel capacity in settings.
    const watts = displayData?.solar_w ?? 0;
    return percent(Math.min(100, (watts / 850) * 100));
  }, [displayData?.solar_w]);

  const batterySoc = percent(displayData?.battery_soc ?? 0);
  const batteryCharging = (displayData?.battery_w ?? 0) > 0;

  const secondsSinceUpdate =
    lastUpdated != null
      ? Math.max(0, Math.floor((now.getTime() - lastUpdated.getTime()) / 1000))
      : null;

  const chartData = useMemo(() => {
    // For now, mock each range deterministically. Real /api/history/power covers 24H.
    let source: PowerHistoryPoint[];
    if (chartRange === '24H') {
      source = history && history.length > 0 ? history : buildMockDay();
    } else if (chartRange === '7D') {
      source = buildMockDailySeries(7);
    } else {
      source = buildMockDailySeries(30);
    }

    const tickLabel =
      chartRange === '24H' ? formatHour : chartRange === '7D' ? formatDayShort : formatDayNum;

    return source.map((p) => ({
      time: tickLabel(p.time),
      Solar: Math.max(0, Math.round(p.solar_w)) / 1000,
      Consumption: Math.max(0, Math.round(p.load_w)) / 1000,
      Battery: Math.round(p.battery_w) / 1000,
      Grid: Math.round(p.grid_w) / 1000,
    }));
  }, [history, chartRange]);

  const xTickInterval =
    chartRange === '24H' ? 3 : chartRange === '7D' ? 0 : 4;

  async function loadData() {
    try {
      setError(null);

      const [settingsResult, summaryResult, realSummaryResult, roiResult, historyResult] = await Promise.allSettled([
        getSettings(),
        getLiveSummary(),
        getRealLiveSummary(),
        getRoiSummary(),
        getPowerHistory(),
      ]);

      if (settingsResult.status === 'fulfilled') {
        setDataMode((settingsResult.value.data_mode as DataMode) || 'demo');
        setUsername(settingsResult.value.username || localStorage.getItem('opensynk_username') || '');
      }

      if (summaryResult.status === 'fulfilled') {
        setData(summaryResult.value);
        if (summaryResult.value.timestamp) setLastUpdated(new Date(summaryResult.value.timestamp));
      }

      if (realSummaryResult.status === 'fulfilled') {
        setRealData(realSummaryResult.value);
        if (realSummaryResult.value.last_update) setLastUpdated(new Date(realSummaryResult.value.last_update));
      } else {
        setRealData(null);
      }

      if (roiResult.status === 'fulfilled') {
        setRoi(roiResult.value);
      } else {
        setRoi(null);
      }

      if (historyResult.status === 'fulfilled' && historyResult.value?.points?.length) {
        setHistory(historyResult.value.points);
      }

      if (summaryResult.status === 'rejected' && realSummaryResult.status === 'rejected') {
        throw new Error('Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Dashboard load failed', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const refreshInterval = window.setInterval(loadData, 5000);
    return () => window.clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (error && !displayData) {
    return (
      <main className={`modern-dashboard ${consoleMode ? `console-mode-page console-dashboard ${consoleTransitionClass}` : ''}`}>
        <section className="dashboard-error-card">
          <h1>Dashboard unavailable</h1>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  const solarW = displayData?.solar_w ?? 0;
  const loadW = displayData?.load_w ?? 0;
  const batteryW = displayData?.battery_w ?? 0;
  const rawGridW = displayData?.grid_w ?? 0;
  const gridFlowW = inferGridFlowWatts(rawGridW, solarW, loadW, batteryW);
  const gridW = gridFlowW;
  const gridLabel = getGridLabel(gridFlowW);
  const gridTone = getGridTone(gridFlowW);
  const gridImporting = gridTone === 'import';
  const batteryTempC = 21; // TODO: wire from telemetry once available
  const co2SavedKg = 6.2; // TODO: wire from ROI/telemetry
  const systemMode = 'On Grid';

  const initial = (username || 'U').slice(0, 1).toUpperCase();

  return (
    <main className={`modern-dashboard ${consoleMode ? `console-mode-page console-dashboard ${consoleTransitionClass}` : ''}`}>
      <section className="hero-overview">
        <div className="hero-overview__image" />
        <div className="hero-overview__shade" />

        <header className="brand-header">
          <a className="brand-logo" href="/dashboard" aria-label="OpenSynk dashboard">
            <SunLogoMark size={56} />
            <span className="brand-logo__text">
              <strong>Open<span>Synk</span></strong>
              <em>Powering your world.</em>
            </span>
          </a>

          <div className="header-actions">
            <div className={`live-pill ${dataMode === 'live' ? 'live-pill--live' : 'live-pill--demo'}`}>
              <span className="live-pill__dot" />
              <span className="live-pill__text">
                <strong>{getStatusText(secondsSinceUpdate, loading)}</strong>
                <small>Auto-refreshing every 5s</small>
              </span>
            </div>

            <div className="user-pill">
              <span className="user-pill__avatar">{initial}</span>
              <span className="user-pill__text">
                <strong>{username || 'Logged in'}</strong>
                <small>{dataMode === 'demo' ? 'Demo Mode' : 'Logged in'}</small>
              </span>
            </div>
          </div>
        </header>

        <div className="hero-metrics">
          <MetricTile
            icon={<Sun size={44} />}
            title="Solar Generation"
            value={formatKw(solarW)}
            subtitle="Generating now"
            tone="solar"
          />
          <MetricTile
            icon={<Home size={44} />}
            title="Home Consumption"
            value={formatKw(loadW)}
            subtitle="Using power"
            tone="home"
          />
          <MetricTile
            icon={getBatteryIcon(batterySoc, 44)}
            title="Battery"
            value={`${batterySoc}%`}
            subtitle={`${getBatteryLabel(batteryW)} • ${formatKw(batteryW)}`}
            tone="battery"
          />
          <MetricTile
            icon={<PylonIcon size={44} />}
            title="Grid"
            value={formatKw(gridW)}
            subtitle={gridLabel}
            tone="grid"
          />
          <MetricTile
            icon={<PoundSterling size={44} />}
            title="Today's Savings"
            value={money(roi?.today_total_benefit)}
            subtitle="View savings & finance →"
            tone="money"
            action={<a className="hero-metric__link" href="/tariffs">Open finance details</a>}
          />
        </div>
      </section>

      <section className="power-flow-card">
        <div className="section-title-row">
          <div>
            <h2>Power Flow</h2>
            <p>Live energy movement</p>
          </div>
          <button className="ghost-help" type="button" onClick={() => navigate('/settings')}>
            <SettingsIcon size={16} />
            Settings
          </button>
        </div>

        <div className="power-flow-visual">
          <FlowNode
            className="flow-node--solar"
            onClick={() => navigate('/history')}
            circleClassName="flow-node__circle--solar"
            icon={<Sun size={58} strokeWidth={2.15} />}
            label="Solar"
            value={formatKw(solarW)}
            status={`${solarEfficiency}% Efficiency`}
            extra={
              <>
                <svg className="solar-efficiency-ring" viewBox="0 0 120 120" aria-hidden="true">
                  <circle className="solar-efficiency-ring__track" cx="60" cy="60" r="54" />
                  <circle
                    className="solar-efficiency-ring__value"
                    cx="60"
                    cy="60"
                    r="54"
                    style={{ '--ring-progress': solarEfficiency } as React.CSSProperties}
                  />
                </svg>
                <div className="solar-percent" aria-label={`Solar ${solarEfficiency}% efficiency`}>
                  {solarEfficiency}%
                </div>
              </>
            }
          />
          <FlowNode
            className="flow-node--home"
            circleClassName="flow-node__circle--home"
            icon={<Home size={60} strokeWidth={2.15} />}
            label="Home"
            value={formatKw(loadW)}
            status=""
          />

          <FlowNode
            className="flow-node--battery"
            onClick={() => navigate('/battery')}
            circleClassName="flow-node__circle--battery"
            icon={getBatteryIcon(batterySoc, 50)}
            label="Battery"
            value={formatKw(batteryW)}
            status={getBatteryLabel(batteryW)}
            extra={
              <>
                <svg className="battery-soc-ring" viewBox="0 0 120 120" aria-hidden="true">
                  <circle className="battery-soc-ring__track" cx="60" cy="60" r="54" />
                  <circle
                    className="battery-soc-ring__value"
                    cx="60"
                    cy="60"
                    r="54"
                    style={{ '--ring-progress': batterySoc } as React.CSSProperties}
                  />
                </svg>
                <div className="battery-percent" aria-label={`Battery ${batterySoc}%`}>
                  {batterySoc}%
                </div>
              </>
            }
          />

          <FlowNode
            className="flow-node--grid"
            onClick={() => navigate('/tariffs')}
            circleClassName={gridImporting ? 'flow-node__circle--grid-import' : 'flow-node__circle--grid-export'}
            icon={<PylonIcon size={62} strokeWidth={2.05} />}
            label="Grid"
            value={formatKw(gridW)}
            status={gridLabel}
          />

          <FlowNode
            className="flow-node--inverter"
            onClick={() => navigate('/alerts')}
            circleClassName="flow-node__circle--inverter"
            icon={<Server size={50} strokeWidth={2.2} />}
            label="Inverter"
            value=""
            status=""
          />

          <svg
            className="flow-paths"
            viewBox="0 0 1000 360"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <FlowPath
              id="flow-solar-inverter"
              className="flow-path--solar"
              d="M318 80 H410 L500 180"
              power={solarW}
            />

            <FlowPath
              id="flow-grid-inverter"
              className={gridImporting ? 'flow-path--grid-import' : 'flow-path--grid-export'}
              d={gridImporting ? 'M682 80 H590 L500 180' : 'M500 180 L590 80 H682'}
              power={gridFlowW}
            />

            <FlowPath
              id="flow-battery-inverter"
              className={batteryW > 0 ? 'flow-path--battery-charge' : 'flow-path--battery-discharge'}
              d={batteryW > 0 ? 'M500 180 L410 280 H318' : 'M318 280 H410 L500 180'}
              power={batteryW}
            />

            <FlowPath
              id="flow-inverter-home"
              className="flow-path--home"
              d="M500 180 L590 280 H682"
              power={loadW}
            />
          </svg>
        </div>

        <div className="flow-legend">
          <span><i className="legend-dot legend-dot--solar" />Generating</span>
          <span><i className="legend-dot legend-dot--home" />Consuming</span>
          <span><i className="legend-dot legend-dot--battery" />Battery</span>
          <span><i className="legend-dot legend-dot--export" />Exporting</span>
          <span><i className="legend-dot legend-dot--import" />Importing</span>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="analytics-card analytics-card--wide">
          <div className="section-title-row">
            <div>
              <h2>Energy Overview</h2>
              <p>Last {chartRange === '24H' ? '24 hours' : chartRange === '7D' ? '7 days' : '30 days'}</p>
            </div>
            <div className="segmented-tabs" role="tablist">
              {(['24H', '7D', '30D'] as ChartRange[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={chartRange === r}
                  className={chartRange === r ? 'active' : ''}
                  onClick={() => setChartRange(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSolar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#facc15" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#facc15" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradConsumption" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22a3ff" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#22a3ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradBattery" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2ee66b" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#2ee66b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradGrid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="rgba(167,180,199,0.8)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  minTickGap={24}
                  interval={xTickInterval}
                />
                <YAxis
                  stroke="rgba(167,180,199,0.8)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  tickFormatter={(v) => `${v} kW`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(10,22,38,0.94)',
                    border: '1px solid rgba(148,163,184,0.2)',
                    borderRadius: 10,
                    color: '#f8fafc',
                    fontSize: 12,
                  }}
                  formatter={(value) => `${Number(value).toFixed(2)} kW`}
                />
                <Area type="monotone" dataKey="Solar" stroke="#facc15" strokeWidth={2} fill="url(#gradSolar)" />
                <Area type="monotone" dataKey="Consumption" stroke="#22a3ff" strokeWidth={2} fill="url(#gradConsumption)" />
                <Area type="monotone" dataKey="Battery" stroke="#2ee66b" strokeWidth={2} fill="url(#gradBattery)" />
                <Area type="monotone" dataKey="Grid" stroke="#a855f7" strokeWidth={2} fill="url(#gradGrid)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-legend">
            <span><i className="legend-dot legend-dot--solar" />Solar</span>
            <span><i className="legend-dot legend-dot--home" />Consumption</span>
            <span><i className="legend-dot legend-dot--battery" />Battery</span>
            <span><i className="legend-dot legend-dot--export" />Grid (Import/Export)</span>
          </div>
        </article>

        <article className="analytics-card status-card">
          <h2>System Status</h2>

          <dl className="status-list">
            <div><dt>Inverter</dt><dd className="status-online">Online <span /></dd></div>
            <div><dt>Battery</dt><dd className="status-online">Online <span /></dd></div>
            <div><dt>Grid Connection</dt><dd className="status-online">Online <span /></dd></div>
          </dl>

          <div className="status-facts">
            <div className="status-fact">
              <Leaf size={16} className="status-fact__icon status-fact__icon--battery" />
              <span className="status-fact__label">Battery Temp</span>
              <span className="status-fact__value">{batteryTempC}°C</span>
              <span className="status-fact__tag status-fact__tag--ok">Normal</span>
            </div>
            <div className="status-fact">
              <Leaf size={16} className="status-fact__icon status-fact__icon--home" />
              <span className="status-fact__label">System Mode</span>
              <span className="status-fact__value">{systemMode}</span>
            </div>
            <div className="status-fact">
              <Leaf size={16} className="status-fact__icon status-fact__icon--battery" />
              <span className="status-fact__label">CO₂ Saved Today</span>
              <span className="status-fact__value">{co2SavedKg} kg</span>
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-tiles">
        <MiniTile
          icon={<Sun size={26} />}
          tone="solar"
          label="Solar"
          value={formatKw(solarW)}
          caption="Generating"
          captionTone="mute"
        />
        <MiniTile
          icon={<Home size={26} />}
          tone="home"
          label="Load"
          value={formatKw(loadW)}
          caption="Consuming"
          captionTone="mute"
        />
        <MiniTile
          icon={getBatteryIcon(batterySoc, 26)}
          tone="battery"
          label="Battery"
          value={`${batterySoc}%`}
          caption={getBatteryLabel(batteryW)}
          captionTone="mute"
        />
        <MiniTile
          icon={<PylonIcon size={26} />}
          tone="grid"
          label="Grid"
          value={formatKw(gridW)}
          caption={gridLabel}
          captionTone="mute"
        />
        <MiniTile
          icon={<Thermometer size={26} />}
          tone="temp"
          label="Battery Temp"
          value={`${batteryTempC}°C`}
          caption="Normal"
          captionTone="ok"
        />

        <article className="savings-cta">
          <div className="savings-cta__body">
            <h3>Track your savings &amp; payback progress</h3>
            <p>See detailed finance insights and ROI</p>
            <a className="savings-cta__button" href="/tariffs">
              View Finance <ArrowRight size={16} />
            </a>
          </div>
          <div className="savings-cta__art" aria-hidden="true">
            <TrendingUp size={72} strokeWidth={2.1} />
          </div>
        </article>
      </section>

    </main>
  );
}
