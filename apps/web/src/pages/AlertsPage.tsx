import { useEffect, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, Clock3, Info, ShieldAlert } from 'lucide-react';
import { getAlerts } from '../api/alerts';
import type { AlertItem } from '../types/alerts';
import './AlertsPage.css';

function SunLogoMark({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className="brand-logo__mark-svg">
      <g stroke="#facc15" strokeWidth="3.5" strokeLinecap="round">
        <line x1="32" y1="3" x2="32" y2="11" /><line x1="32" y1="53" x2="32" y2="61" /><line x1="3" y1="32" x2="11" y2="32" /><line x1="53" y1="32" x2="61" y2="32" /><line x1="11.5" y1="11.5" x2="17" y2="17" /><line x1="47" y1="47" x2="52.5" y2="52.5" /><line x1="52.5" y1="11.5" x2="47" y2="17" /><line x1="17" y1="47" x2="11.5" y2="52.5" />
      </g><circle cx="32" cy="32" r="13" fill="#facc15" />
    </svg>
  );
}

function PageBrand({ secondsSinceUpdate }: { secondsSinceUpdate: number | null }) {
  return (
    <header className="page-brand-header">
      <a className="brand-logo" href="/dashboard" aria-label="OpenSynk dashboard">
        <SunLogoMark />
        <span className="brand-logo__text"><strong>Open<span>Synk</span></strong><em>Energy intelligence</em></span>
      </a>
      <div className="page-header-pills">
        <span className="status-pill status-pill--fresh"><span />Auto refresh</span>
        <span className="status-pill status-pill--muted"><Clock3 size={15} />{secondsSinceUpdate !== null ? `${secondsSinceUpdate}s ago` : 'Waiting'}</span>
      </div>
    </header>
  );
}

function alertIcon(severity: AlertItem['severity']) {
  if (severity === 'critical') return <ShieldAlert size={24} />;
  if (severity === 'warning') return <AlertTriangle size={24} />;
  return <Info size={24} />;
}

export function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastLoaded, setLastLoaded] = useState<Date | null>(null);
  const [now, setNow] = useState(new Date());

  async function loadAlerts() {
    try {
      setError(null);
      const result = await getAlerts();
      setAlerts(result.alerts ?? []);
      setLastLoaded(new Date());
    } catch (err) {
      console.error('Alerts load failed', err);
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();
    const intervalId = window.setInterval(loadAlerts, 5000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const secondsSinceUpdate = lastLoaded ? Math.max(0, Math.floor((now.getTime() - lastLoaded.getTime()) / 1000)) : null;

  return (
    <main className="modern-subpage alerts-page">
      <PageBrand secondsSinceUpdate={secondsSinceUpdate} />

      <section className="page-hero-card">
        <div>
          <span className="page-kicker"><Bell size={16} /> Alerts</span>
          <h1>System notices</h1>
          <p>Live warnings and system status checks for your energy setup.</p>
        </div>
        <div className="page-hero-stat"><strong>{alerts.length}</strong><span>active</span></div>
      </section>

      {loading && <div className="page-state">Loading alerts...</div>}
      {error && !loading && <div className="page-state page-state--error">Failed to load alerts: {error}</div>}

      {!loading && !error && (
        <section className="alerts-layout-modern">
          {alerts.length === 0 ? (
            <article className="alerts-empty-modern">
              <CheckCircle2 size={46} />
              <h2>No active alerts</h2>
              <p>Everything looks normal. We’ll show warnings here if something needs attention.</p>
            </article>
          ) : (
            alerts.map((alert) => (
              <article key={alert.id} className={`alert-card-modern alert-card-modern--${alert.severity}`}>
                <div className="alert-card-modern__icon">{alertIcon(alert.severity)}</div>
                <div className="alert-card-modern__body">
                  <div className="alert-card-modern__header">
                    <h2>{alert.title}</h2>
                    <span className={`alert-badge alert-badge--${alert.severity}`}>{alert.severity}</span>
                  </div>
                  <p>{alert.message}</p>
                </div>
              </article>
            ))
          )}
        </section>
      )}
    </main>
  );
}
