import { useEffect, useState } from 'react';
import { getLiveSummary } from '../api/energy';
import { SummaryCard } from '../components/SummaryCard';
import type { LiveSummary } from '../types/energy';
import './DashboardPage.css';

function formatWatts(value: number): string {
  return `${value.toLocaleString()} W`;
}

function formatPercent(value: number): string {
  return `${value}%`;
}

function getGridLabel(gridWatts: number): string {
  if (gridWatts > 0) return 'Importing from grid';
  if (gridWatts < 0) return 'Exporting to grid';
  return 'Balanced';
}

export function DashboardPage() {
  const [data, setData] = useState<LiveSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    try {
      setError(null);
      const result = await getLiveSummary();
      setData(result);
    } catch (err) {
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
          {data && (
            <small style={{ color: '#94a3b8' }}>
              Last updated: {new Date().toLocaleTimeString()}
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

      {data && !loading && (
        <section className="summary-grid">
          <SummaryCard
            title="Solar"
            value={formatWatts(data.solar_w)}
            subtitle="Current PV generation"
          />
          <SummaryCard
            title="Load"
            value={formatWatts(data.load_w)}
            subtitle="Current house demand"
          />
          <SummaryCard
            title="Battery"
            value={formatPercent(data.battery_soc)}
            subtitle="Battery state of charge"
          />
          <SummaryCard
            title="Grid"
            value={formatWatts(Math.abs(data.grid_w))}
            subtitle={getGridLabel(data.grid_w)}
          />
        </section>
      )}
    </main>
  );
}