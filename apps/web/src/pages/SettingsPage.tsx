import { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../api/settings';
import { getInverters } from '../api/inverters';
import { Cpu, PlugZap, Settings2, ShieldCheck } from 'lucide-react';
import './SettingsPage.css';

type SettingsPayload = { api_base_url: string; username: string; poll_interval_seconds: number; selected_site: string; verify_ssl: boolean; };
type Inverter = { id: number; sn: string; alias: string; plant?: { name?: string } };

function SunLogoMark({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className="brand-logo__mark-svg">
      <g stroke="#facc15" strokeWidth="3.5" strokeLinecap="round"><line x1="32" y1="3" x2="32" y2="11" /><line x1="32" y1="53" x2="32" y2="61" /><line x1="3" y1="32" x2="11" y2="32" /><line x1="53" y1="32" x2="61" y2="32" /><line x1="11.5" y1="11.5" x2="17" y2="17" /><line x1="47" y1="47" x2="52.5" y2="52.5" /><line x1="52.5" y1="11.5" x2="47" y2="17" /><line x1="17" y1="47" x2="11.5" y2="52.5" /></g><circle cx="32" cy="32" r="13" fill="#facc15" />
    </svg>
  );
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [inverters, setInverters] = useState<Inverter[]>([]);
  const [settings, setSettings] = useState<SettingsPayload>({ api_base_url: '', username: '', poll_interval_seconds: 60, selected_site: '', verify_ssl: false });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true); setError(null);
        const [settingsData, inverterData] = await Promise.all([getSettings(), getInverters().catch(() => [])]);
        setSettings({ api_base_url: settingsData.api_base_url, username: settingsData.username, poll_interval_seconds: settingsData.poll_interval_seconds, selected_site: settingsData.selected_site || '', verify_ssl: settingsData.verify_ssl });
        setInverters(inverterData || []);
      } catch (err) { console.error(err); setError('Failed to load settings'); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  function update<K extends keyof SettingsPayload>(key: K, value: SettingsPayload[K]) { setSettings((prev) => ({ ...prev, [key]: value })); }

  async function handleSave() {
    try {
      setSaving(true); setError(null); setSuccess(null);
      const result = await saveSettings(settings);
      if (result.success) setSuccess('Settings saved'); else setError(result.message || 'Failed to save settings');
    } catch (err) { console.error(err); setError('Failed to save settings'); }
    finally { setSaving(false); }
  }

  return (
    <main className="modern-subpage settings-page">
      <header className="page-brand-header">
        <a className="brand-logo" href="/dashboard" aria-label="OpenSynk dashboard"><SunLogoMark /><span className="brand-logo__text"><strong>Open<span>Synk</span></strong><em>Energy intelligence</em></span></a>
        <button className="primary-action" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
      </header>

      <section className="page-hero-card">
        <div><span className="page-kicker"><Settings2 size={16} /> Settings</span><h1>System setup</h1><p>Configure your inverter selection, polling and connection behaviour.</p></div>
      </section>

      {loading && <div className="page-state">Loading settings...</div>}
      {error && <div className="page-state page-state--error">{error}</div>}
      {success && <div className="page-state page-state--success">{success}</div>}

      {!loading && (
        <section className="settings-layout-modern">
          <article className="modern-panel">
            <div className="modern-panel__header"><div><h2>Account</h2><p>Your logged-in Sunsynk account</p></div><ShieldCheck className="panel-icon" size={24} /></div>
            <div className="settings-summary"><div><span>Email</span><strong>{settings.username}</strong></div></div>
          </article>

          <article className="modern-panel">
            <div className="modern-panel__header"><div><h2>Inverter</h2><p>Select which inverter to monitor</p></div><Cpu className="panel-icon" size={24} /></div>
            <label className="settings-field"><span>Select Inverter</span><select value={settings.selected_site} onChange={(e) => update('selected_site', e.target.value)}><option value="">-- Select inverter --</option>{inverters.map((inv) => (<option key={inv.id} value={inv.sn}>{inv.alias} ({inv.sn}){inv.plant?.name ? ` - ${inv.plant.name}` : ''}</option>))}</select></label>
          </article>

          <article className="modern-panel">
            <div className="modern-panel__header"><div><h2>Connection</h2><p>Polling and API behaviour</p></div><PlugZap className="panel-icon" size={24} /></div>
            <div className="settings-form">
              <label className="settings-field"><span>API Base URL</span><input type="text" value={settings.api_base_url} onChange={(e) => update('api_base_url', e.target.value)} /></label>
              <label className="settings-field"><span>Poll Interval (seconds)</span><input type="number" min="5" value={settings.poll_interval_seconds} onChange={(e) => update('poll_interval_seconds', Number(e.target.value))} /></label>
              <label className="settings-switch"><input type="checkbox" checked={settings.verify_ssl} onChange={(e) => update('verify_ssl', e.target.checked)} /><span>Verify SSL certificates</span></label>
            </div>
          </article>
        </section>
      )}
    </main>
  );
}
