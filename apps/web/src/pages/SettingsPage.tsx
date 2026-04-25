import { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Cpu,
  Gauge,
  Lock,
  LogOut,
  MonitorSmartphone,
  PanelTop,
  Save,
  ShieldCheck,
  Sun,
  UserRound,
  Zap,
} from 'lucide-react';
import { getSettings, saveSettings } from '../api/settings';
import { getInverters } from '../api/inverters';
import { PageTitle } from '../components/PageTitle';
import './SettingsPage.css';

type SettingsPayload = {
  api_base_url: string;
  username: string;
  poll_interval_seconds: number;
  selected_site: string;
  verify_ssl: boolean;
  solar_capacity_kwp: string;
};

type Inverter = {
  id: number;
  sn: string;
  alias: string;
  plant?: {
    name?: string;
  };
};

function inverterLabel(inv: Inverter): string {
  const plantName = inv.plant?.name ? ` - ${inv.plant.name}` : '';
  return `${inv.alias || inv.sn} (${inv.sn})${plantName}`;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [inverters, setInverters] = useState<Inverter[]>([]);
  const [consoleMode, setConsoleMode] = useState(
    localStorage.getItem('opensynk_console_mode') === 'true',
  );

  const [settings, setSettings] = useState<SettingsPayload>({
    api_base_url: '',
    username: '',
    poll_interval_seconds: 60,
    selected_site: '',
    verify_ssl: false,
    solar_capacity_kwp: '2.37',
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [settingsData, inverterData] = await Promise.all([
          getSettings(),
          getInverters().catch(() => []),
        ]);

        const typedSettings = settingsData as Partial<SettingsPayload>;

        setSettings({
          api_base_url: settingsData.api_base_url,
          username: settingsData.username,
          poll_interval_seconds: settingsData.poll_interval_seconds,
          selected_site: settingsData.selected_site || '',
          verify_ssl: settingsData.verify_ssl,
          solar_capacity_kwp: typedSettings.solar_capacity_kwp || '2.37',
        });

        setInverters(inverterData || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function update<K extends keyof SettingsPayload>(
    key: K,
    value: SettingsPayload[K],
  ) {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleConsoleModeChange(enabled: boolean) {
    setConsoleMode(enabled);
    localStorage.setItem('opensynk_console_mode', enabled ? 'true' : 'false');
    document.body.classList.toggle('console-mode', enabled);
  }

  function handleLogout() {
    localStorage.removeItem('opensynk_logged_in');
    localStorage.removeItem('opensynk_username');
    localStorage.removeItem('opensynk_mode');
    localStorage.removeItem('opensynk_session_token');
    sessionStorage.removeItem('opensynk_session_token');
    window.location.href = '/login';
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = await saveSettings(settings);

      if (result.success) {
        setSuccess('Settings saved successfully');
      } else {
        setError(result.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  const selectedInverter = inverters.find((inv) => inv.sn === settings.selected_site);

  return (
    <main className="settings-page">
      <PageTitle />

      <section className="page-hero-card">
        <div>
          <span className="page-kicker"><Gauge size={16} /> System settings</span>
          <h1>Settings</h1>
          <p>Configure your inverter, solar array and display behaviour.</p>
        </div>
        <div className="page-hero-action">
          <button
            className="settings-save-button"
            onClick={handleSave}
            disabled={saving || loading}
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </section>

      {loading && (
        <div className="settings-state settings-state--loading">
          Loading settings...
        </div>
      )}

      {error && (
        <div className="settings-state settings-state--error">
          {error}
        </div>
      )}

      {success && (
        <div className="settings-state settings-state--success">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {!loading && (
        <section className="settings-layout-modern">
          <section className="settings-card settings-card--account">
            <div className="settings-card__header">
              <span className="settings-card__icon settings-card__icon--blue">
                <UserRound size={22} />
              </span>
              <div>
                <h2>Account</h2>
                <p>Your logged-in Sunsynk account</p>
              </div>
            </div>

            <div className="settings-key-value">
              <span>Email</span>
              <strong>{settings.username || 'Not available'}</strong>
            </div>

            <button className="settings-logout-button" onClick={handleLogout}>
              <LogOut size={16} />
              Sign out
            </button>
          </section>

          <section className="settings-card settings-card--inverter">
            <div className="settings-card__header">
              <span className="settings-card__icon settings-card__icon--purple">
                <Cpu size={22} />
              </span>
              <div>
                <h2>Inverter</h2>
                <p>Select the inverter this dashboard should monitor</p>
              </div>
            </div>

            <div className="settings-form-grid">
              <label className="settings-field settings-field--wide">
                <span>Select inverter</span>
                <select
                  value={settings.selected_site}
                  onChange={(e) => update('selected_site', e.target.value)}
                >
                  <option value="">Select inverter...</option>
                  {inverters.map((inv) => (
                    <option key={inv.id} value={inv.sn}>
                      {inverterLabel(inv)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="settings-mini-summary">
              <div>
                <span>Selected serial</span>
                <strong>{settings.selected_site || 'None selected'}</strong>
              </div>
              <div>
                <span>Plant</span>
                <strong>{selectedInverter?.plant?.name || 'Unknown'}</strong>
              </div>
            </div>
          </section>

          <section className="settings-card settings-card--solar">
            <div className="settings-card__header">
              <span className="settings-card__icon settings-card__icon--solar">
                <Sun size={22} />
              </span>
              <div>
                <h2>Solar array</h2>
                <p>Used to calculate the solar efficiency gauge</p>
              </div>
            </div>

            <div className="settings-form-grid">
              <label className="settings-field">
                <span>Solar panel capacity</span>
                <div className="settings-input-with-unit">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.solar_capacity_kwp}
                    onChange={(e) => update('solar_capacity_kwp', e.target.value)}
                  />
                  <em>kWp</em>
                </div>
              </label>
            </div>

            <div className="settings-help-card">
              <Zap size={18} />
              <p>
                Your current array is <strong>{settings.solar_capacity_kwp || '0'} kWp</strong>.
                The dashboard uses this to calculate solar efficiency as live solar output divided
                by this maximum capacity.
              </p>
            </div>
          </section>

          <section className="settings-card settings-card--system">
            <div className="settings-card__header">
              <span className="settings-card__icon settings-card__icon--green">
                <Activity size={22} />
              </span>
              <div>
                <h2>System</h2>
                <p>Polling and connection behaviour</p>
              </div>
            </div>

            <div className="settings-form-grid">
              <label className="settings-field">
                <span>Poll interval</span>
                <div className="settings-input-with-unit">
                  <input
                    type="number"
                    min="5"
                    value={settings.poll_interval_seconds}
                    onChange={(e) =>
                      update('poll_interval_seconds', Number(e.target.value))
                    }
                  />
                  <em>seconds</em>
                </div>
              </label>

              <label className="settings-toggle-row">
                <span className="settings-toggle-row__icon">
                  <ShieldCheck size={20} />
                </span>
                <span>
                  <strong>Verify SSL certificates</strong>
                  <small>Recommended for secure API connections</small>
                </span>
                <input
                  type="checkbox"
                  checked={settings.verify_ssl}
                  onChange={(e) => update('verify_ssl', e.target.checked)}
                />
              </label>
            </div>
          </section>

          <section className="settings-card settings-card--display">
            <div className="settings-card__header">
              <span className="settings-card__icon settings-card__icon--cyan">
                <MonitorSmartphone size={22} />
              </span>
              <div>
                <h2>Display</h2>
                <p>Optimise OpenSynk for wall-mounted or touchscreen use</p>
              </div>
            </div>

            <label className="settings-toggle-row settings-toggle-row--large">
              <span className="settings-toggle-row__icon">
                <PanelTop size={20} />
              </span>
              <span>
                <strong>Console mode</strong>
                <small>Streamlined layout for Raspberry Pi touchscreens</small>
              </span>
              <input
                type="checkbox"
                checked={consoleMode}
                onChange={(e) => handleConsoleModeChange(e.target.checked)}
              />
            </label>
          </section>

          <section className="settings-card settings-card--security">
            <div className="settings-card__header">
              <span className="settings-card__icon settings-card__icon--muted">
                <Lock size={22} />
              </span>
              <div>
                <h2>Security</h2>
                <p>Credential storage and session behaviour</p>
              </div>
            </div>

            <div className="settings-help-card settings-help-card--muted">
              <Lock size={18} />
              <p>
                Sunsynk passwords are not stored in the database. OpenSynk stores your account
                identity and session tokens only.
              </p>
            </div>
          </section>
        </section>
      )}
    </main>
  );
}