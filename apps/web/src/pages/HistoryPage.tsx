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
import type { PowerHistoryResponse } from '../types/history';
import './HistoryPage.css';

type RangeOption = '24h' | '7d' | '30d';

function formatWatts(value: number): string {
  return `${value.toLocaleString()} W`;
}

export function HistoryPage() {
  const [range, setRange] = useState<RangeOption>('24h');
  const [data, setData] = useState<PowerHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadHistory(selectedRange: RangeOption) {
    try {
      setLoading(true);
      setError(null);
      const result = await getPowerHistory(selectedRange);
      setData(result);
    } catch (err) {
      console.error('History load failed', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory(range);
  }, [range]);

  return (
    <main className="dashboard-page">
      <header className="dashboard-page__header">
        <div>
          <h1>History</h1>
          <p>Historical solar, battery, load and grid trends</p>
        </div>

        <div className="history-range-picker">
          {(['24h', '7d', '30d'] as RangeOption[]).map((option) => (
            <button
              key={option}
              className={
                option === range
                  ? 'history-range-picker__button history-range-picker__button--active'
                  : 'history-range-picker__button'
              }
              onClick={() => setRange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </header>

      {loading && <div className="dashboard-state">Loading history...</div>}

      {error && !loading && (
        <div className="dashboard-state dashboard-state--error">
          Failed to load history: {error}
        </div>
      )}

      {data && !loading && (
        <section className="history-layout">
          <div className="history-panel">
            <div className="history-panel__header">
              <h2>Power Trends</h2>
              <span>{data.range}</span>
            </div>

            <div className="history-chart">
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={data.points}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatWatts(value)} />
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
              <div className="history-summary-card__value">
                {formatWatts(Math.max(...data.points.map((p) => p.solar_w)))}
              </div>
            </div>

            <div className="history-summary-card">
              <div className="history-summary-card__label">Peak Load</div>
              <div className="history-summary-card__value">
                {formatWatts(Math.max(...data.points.map((p) => p.load_w)))}
              </div>
            </div>

            <div className="history-summary-card">
              <div className="history-summary-card__label">Max Export</div>
              <div className="history-summary-card__value">
                {formatWatts(Math.abs(Math.min(...data.points.map((p) => p.grid_w))))}
              </div>
            </div>

            <div className="history-summary-card">
              <div className="history-summary-card__label">Max Battery Charge</div>
              <div className="history-summary-card__value">
                {formatWatts(Math.max(...data.points.map((p) => p.battery_w)))}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}