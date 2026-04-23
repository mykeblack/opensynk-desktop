import { useEffect, useState } from 'react';
import { getLiveSummary, getRealLiveSummary } from '../api/energy';
import { PowerFlowPanel } from '../components/PowerFlowPanel';
import { SummaryCard } from '../components/SummaryCard';
import type { LiveSummary, RealLiveSummary } from '../types/energy';
import './DashboardPage.css';

function formatWatts(value?: number): string {
  if (value == null || isNaN(value)) return '0 W';
  return `${Math.abs(value).toLocaleString()} W`;
}

function formatPercent(value?: number): string {
  if (value == null || isNaN(value)) return '0%';
  return `${value}%`;
}

function getGridLabel(gridWatts: number): string {
  if (gridWatts > 0) return 'Importing from grid';
  if (gridWatts < 0) return 'Exporting to grid';
  return 'Balanced';
}

export function DashboardPage() {
  const [data, setData] = useState<LiveSummary | null>(null);
  const [realData, setRealData] = useState<RealLiveSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayData: LiveSummary | null = realData
    ? {
        solar_w: realData.solar_w,
        load_w: realData.load_w,
        battery_soc: realData.battery_soc,
        grid_w: realData.grid_w,
        battery_w: realData.battery_w,
      }
    : data;

  async function loadData() {
    try {
      setError(null);

      const [mockSummary, selectedInverter] = await Promise.allSettled([
        getLiveSummary(),
        getRealLiveSummary(),
      ]);

      if (mockSummary.status === 'fulfilled') {
        setData(mockSummary.value);
      }

      if (selectedInverter.status === 'fulfilled') {
        console.log('REAL DATA:', selectedInverter.value);
        setRealData(selectedInverter.value);
      } else {
        setRealData(null);
      }

      if (mockSummary.status === 'rejected' && selectedInverter.status === 'rejected') {
        throw new Error('Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Dashboard load failed', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    const intervalId = window.setInterval(() => {
      loadData();
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <main className="dashboard-page">
      <header className="dashboard-page__header">
        <div>
          <h1>OpenSynk Desktop</h1>
          <p>Solar, battery, load and grid overview</p>
          {realData && (
            <small style={{ color: '#94a3b8', display: 'block', marginTop: 8 }}>
              Inverter: {realData.sn} • {realData.plant_name}
            </small>
          )}
        </div>

        <button className="refresh-button" onClick={loadData}>
          Refresh
        </button>
      </header>

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