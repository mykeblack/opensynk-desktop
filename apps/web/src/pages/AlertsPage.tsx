import { useEffect, useState } from 'react';
import { getAlerts } from '../api/alerts';
import type { AlertItem } from '../types/alerts';
import { PageTitle } from '../components/PageTitle';
import './AlertsPage.css';

export function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadAlerts() {
    try {
      setError(null);
      const result = await getAlerts();
      setAlerts(result.alerts ?? []);
    } catch (err) {
      console.error('Alerts load failed', err);
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();

    const intervalId = window.setInterval(() => {
      loadAlerts();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <main className="dashboard-page">
      <PageTitle>
          <span className="badge badge--live">Auto-refreshing every 5s</span>
        </PageTitle>

      {loading && <div className="dashboard-state">Loading alerts...</div>}

      {error && !loading && (
        <div className="dashboard-state dashboard-state--error">
          Failed to load alerts: {error}
        </div>
      )}

      {!loading && !error && (
        <section className="alerts-layout">
          {alerts.length === 0 ? (
            <div className="alerts-empty">
              No active alerts. Everything looks normal.
            </div>
          ) : (
            alerts.map((alert) => (
              <article
                key={alert.id}
                className={`alert-card alert-card--${alert.severity}`}
              >
                <div className="alert-card__header">
                  <h2>{alert.title}</h2>
                  <span className={`alert-badge alert-badge--${alert.severity}`}>
                    {alert.severity}
                  </span>
                </div>
                <p>{alert.message}</p>
              </article>
            ))
          )}
        </section>
      )}
    </main>
  );
}