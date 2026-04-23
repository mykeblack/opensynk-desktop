import { useEffect, useMemo, useState } from 'react';
import { getLiveSummary, getRealLiveSummary } from '../api/energy';
import { getSettings } from '../api/settings';
import { PowerFlowPanel } from '../components/PowerFlowPanel';
import { SummaryCard } from '../components/SummaryCard';
import type { LiveSummary, RealLiveSummary } from '../types/energy';
import './DashboardPage.css';

type DataMode = 'demo' | 'live';

function formatWatts(value?: number): string {
  if (value == null || Number.isNaN(value)) return '0 W';
  return `${Math.abs(value).toLocaleString()} W`;
}

function formatPercent(value?: number): string {
  if (value == null || Number.isNaN(value)) return '0%';
  return `${value}%`;
}

function getGridLabel(gridWatts: number): string {
  if (gridWatts > 0) return 'Importing from grid';
  if (gridWatts < 0) return 'Exporting to grid';
  return 'Balanced';
}

function getStatusLabel(secondsSinceUpdate: number | null, loading: boolean): {
  text: string;
  className: string;
} {
  if (loading) {
    return { text: 'Loading', className: 'dashboard-badge dashboard-badge--loading' };
  }

  if (secondsSinceUpdate == null) {
    return { text: 'No Data', className: 'dashboard-badge dashboard-badge--stale' };
  }

  if (secondsSinceUpdate > 15) {
    return { text: 'Stale', className: 'dashboard-badge dashboard-badge--stale' };
  }

  return { text: 'Fresh', className: 'dashboard-badge dashboard-badge--fresh' };
}

function formatSecondsAgo(secondsSinceUpdate: number | null): string {
  if (secondsSinceUpdate == null) return 'Waiting for data';
  if (secondsSinceUpdate === 0) return 'Last updated just now';
  if (secondsSinceUpdate === 1) return 'Last updated 1s ago';
  return `Last updated ${secondsSinceUpdate}s ago`;
}

export function DashboardPage() {
  const [data, setData] = useState<LiveSummary | null>(null);
  const [realData, setRealData] = useState<RealLiveSummary | null>(null);
  const [dataMode, setDataMode] = useState<DataMode>('demo');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [now, setNow] = useState(new Date());

  const displayData: LiveSummary | null = useMemo(() => {
    if (realData) {
      return {
        solar_w: Number(realData.solar_w ?? 0),
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

  const secondsSinceUpdate =
    lastUpdated != null ? Math.max(0, Math.floor((now.getTime() - lastUpdated.getTime()) / 1000)) : null;

  const status = getStatusLabel(secondsSinceUpdate, loading);

  async function loadData() {
    try {
      setError(null);

      const [settingsResult, summaryResult, realSummaryResult] = await Promise.allSettled([
        getSettings(),
        getLiveSummary(),
        getRealLiveSummary(),
      ]);

      if (settingsResult.status === 'fulfilled') {
        setDataMode((settingsResult.value.data_mode as DataMode) || 'demo');
      }

      if (summaryResult.status === 'fulfilled') {
        setData(summaryResult.value);

        if (summaryResult.value.timestamp) {
          setLastUpdated(new Date(summaryResult.value.timestamp));
        }
      }

      if (realSummaryResult.status === 'fulfilled') {
        setRealData(realSummaryResult.value);

        if (realSummaryResult.value.last_update) {
          setLastUpdated(new Date(realSummaryResult.value.last_update));
        }
      } else {
        setRealData(null);
      }

      if (summaryResult.status === 'rejected' && realSummaryResult.status === 'rejected') {
        const realError =
          realSummaryResult.reason instanceof Error
            ? realSummaryResult.reason.message
            : 'Failed to load dashboard data';

        throw new Error(realError);
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

    const refreshInterval = window.setInterval(() => {
      loadData();
    }, 5000);

    return () => {
      window.clearInterval(refreshInterval);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <main className="dashboard-page">
      <header className="dashboard-page__header">
        <div className="dashboard-header__content">
          <div>
            <h1>Dashboard</h1>
            <p>Solar, battery, load and grid overview</p>
          </div>

          <div className="dashboard-header__meta">
            <span className={status.className}>{status.text}</span>

            <span
              className={`dashboard-badge ${
                dataMode === 'demo'
                  ? 'dashboard-badge--demo'
                  : 'dashboard-badge--live'
              }`}
            >
              {dataMode === 'demo' ? 'Demo Mode' : 'Live Mode'}
            </span>

            <span className="dashboard-header__timer">
              {formatSecondsAgo(secondsSinceUpdate)}
            </span>
          </div>
        </div>

        <button className="refresh-button" onClick={loadData}>
          Refresh
        </button>
      </header>

      {realData && (
        <div className="dashboard-header__subline">
          Inverter: {realData.sn} • {realData.plant_name}
        </div>
      )}

      {loading && <div className="dashboard-state">Loading dashboard...</div>}

      {error && !loading && (
        <div className="dashboard-state dashboard-state--error">
          Failed to load dashboard: {error}
        </div>
      )}

      {!loading && displayData && (
        <>
          {realData && (
            <section className="summary-grid" style={{ marginBottom: 18 }}>
              <SummaryCard
                title="Selected Inverter Power"
                value={formatWatts(realData.power_w)}
                subtitle={`Today ${realData.today_kwh} kWh`}
              />
              <SummaryCard
                title="Lifetime Energy"
                value={`${realData.total_kwh} kWh`}
                subtitle={new Date(realData.last_update).toLocaleString()}
              />
            </section>
          )}

          <section className="summary-grid">
            <SummaryCard
              title="Solar"
              value={formatWatts(displayData.solar_w)}
              subtitle="Current PV generation"
            />
            <SummaryCard
              title="Load"
              value={formatWatts(displayData.load_w)}
              subtitle="Current house demand"
            />
            <SummaryCard
              title="Battery"
              value={formatPercent(displayData.battery_soc)}
              subtitle="Battery state of charge"
            />
            <SummaryCard
              title="Grid"
              value={formatWatts(Math.abs(displayData.grid_w))}
              subtitle={getGridLabel(displayData.grid_w)}
            />
          </section>

          <PowerFlowPanel data={displayData} />
        </>
      )}
    </main>
  );
}