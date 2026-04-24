import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getPowerHistory } from '../api/history';
import type { PowerHistoryPoint } from '../types/history';
import './HistoryPage.css';

function formatWatts(value: number): string {
  return `${value.toLocaleString()} W`;
}

function formatTimeLabel(value: string | null): string {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function HistoryPage() {
  const [points, setPoints] = useState<PowerHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadHistory() {
    try {
      setError(null);
      const result = await getPowerHistory();
      setPoints(result.points ?? []);
    } catch (err) {
      console.error('History load failed', err);
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const peakSolar = points.length > 0 ? Math.max(...points.map((p) => p.solar_w)) : 0;
  const peakLoad = points.length > 0 ? Math.max(...points.map((p) => p.load_w)) : 0;
  const maxImport = points.length > 0 ? Math.max(...points.map((p) => p.grid_w)) : 0;
  const maxExport =
    points.length > 0 ? Math.abs(Math.min(...points.map((p) => p.grid_w))) : 0;

  return (
    <main className="dashboard-page">
      <header className="dashboard-page__header">
        <div>
          <h1>History</h1>
          <p>Recorded power samples from the current data mode</p>
        </div>
      </header>

      {loading && <div className="dashboard-state">Loading history...</div>}

      {error && !loading && (
        <div className="dashboard-state dashboard-state--error">
          Failed to load history: {error}
        </div>
      )}

      {!loading && !error && (
        <section className="history-layout">
          <div className="history-panel">
            <div className="history-panel__header">
              <h2>Power Trends</h2>
              <span>{points.length} samples</span>
            </div>

            <div className="history-chart">
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={points}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    tickFormatter={formatTimeLabel}
                    minTickGap={24}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(label) => formatTimeLabel(label as string | null)}
                    formatter={(value) => formatWatts(Number(value))}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="solar_w" name="Solar" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="load_w" name="Load" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="grid_w" name="Grid" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="battery_w" name="Battery" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="history-summary-grid">
            <div className="history-summary-card">
              <div className="history-summary-card__label">Peak Solar</div>
              <div className="history-summary-card__value">{formatWatts(peakSolar)}</div>
            </div>

            <div className="history-summary-card">
              <div className="history-summary-card__label">Peak Load</div>
              <div className="history-summary-card__value">{formatWatts(peakLoad)}</div>
            </div>

            <div className="history-summary-card">
              <div className="history-summary-card__label">Max Import</div>
              <div className="history-summary-card__value">{formatWatts(maxImport)}</div>
            </div>

            <div className="history-summary-card">
              <div className="history-summary-card__label">Max Export</div>
              <div className="history-summary-card__value">{formatWatts(maxExport)}</div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}