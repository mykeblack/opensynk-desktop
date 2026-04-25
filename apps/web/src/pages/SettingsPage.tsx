import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  HardDrive,
  MonitorSmartphone,
  PlugZap,
  Save,
  Settings2,
  ShieldCheck,
  UserCircle2,
  XCircle,
} from 'lucide-react';
import { getSettings, saveSettings } from '../api/settings';
import { PageTitle } from '../components/PageTitle';
import { getInverters } from '../api/inverters';
import './SettingsPage.css';

type SettingsPayload = {
  api_base_url: string;
  username: string;
  poll_interval_seconds: number;
  selected_site: string;
  verify_ssl: boolean;
};

type Inverter = {
  id: number;
  sn: string;
  alias: string;
  plant?: {
    name?: string;
  };
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [consoleMode, setConsoleMode] = useState(false);

  const [inverters, setInverters] = useState<Inverter[]>([]);

  const [settings, setSettings] = useState<SettingsPayload>({
    api_base_url: '',
    username: '',
    poll_interval_seconds: 60,
    selected_site: '',
    verify_ssl: false,
  });

  useEffect(() => {
    const storedConsoleMode = localStorage.getItem('opensynk_console_mode') === 'true';
    setConsoleMode(storedConsoleMode);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [settingsData, inverterData] = await Promise.all([
          getSettings(),
          getInverters().catch(() => []),
        ]);

        setSettings({
          api_base_url: settingsData.api_base_url,
          username: settingsData.username,
          poll_interval_seconds: settingsData.poll_interval_seconds,
          selected_site: settingsData.selected_site || '',
          verify_ssl: settingsData.verify_ssl,
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

  function update<K extends keyof SettingsPayload>(key: K, value: SettingsPayload[K]) {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updateConsoleMode(enabled: boolean) {
    setConsoleMode(enabled);
    localStorage.setItem('opensynk_console_mode', enabled ? 'true' : 'false');
    document.documentElement.classList.toggle('console-mode', enabled);
    document.body.classList.toggle('console-mode', enabled);
    window.dispatchEvent(new CustomEvent('opensynk:console-mode-changed', {
      detail: { enabled },
    }));
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
      <PageTitle actions={(
        <button
          className="settings-save-button"
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      )} />

      {loading && <div className="settings-state">Loading settings...</div>}

      {error && (
        <div className="settings-state settings-state--error">
          <XCircle size={18} />
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
        <section className="settings-grid">
          <section className="settings-card settings-card--account">
            <div className="settings-card__icon settings-card__icon--account">
              <UserCircle2 size={26} />
            </div>

            <div className="settings-card__body">
              <div className="settings-card__heading">
                <h2>Account</h2>
                <p>Your active Sunsynk login</p>
              </div>

              <div className="settings-readonly-row">
                <span>Email</span>
                <strong>{settings.username || 'Not signed in'}</strong>
              </div>
            </div>
          </section>

          <section className="settings-card settings-card--wide">
            <div className="settings-card__icon settings-card__icon--inverter">
              <HardDrive size={26} />
            </div>

            <div className="settings-card__body">
              <div className="settings-card__heading">
                <h2>Inverter</h2>
                <p>Select the inverter this dashboard should monitor</p>
              </div>

              <label className="settings-control">
                <span>Select inverter</span>
                <div className="settings-select-wrap">
                  <select
                    value={settings.selected_site}
                    onChange={(e) => update('selected_site', e.target.value)}
                  >
                    <option value="">Select inverter...</option>

                    {inverters.map((inv) => (
                      <option key={inv.id} value={inv.sn}>
                        {inv.alias} ({inv.sn})
                        {inv.plant?.name ? ` - ${inv.plant.name}` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} />
                </div>
              </label>

              {selectedInverter && (
                <div className="settings-inverter-summary">
                  <div>
                    <span>Serial</span>
                    <strong>{selectedInverter.sn}</strong>
                  </div>
                  <div>
                    <span>Site</span>
                    <strong>{selectedInverter.plant?.name || 'Unnamed site'}</strong>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card__icon settings-card__icon--system">
              <Settings2 size={26} />
            </div>

            <div className="settings-card__body">
              <div className="settings-card__heading">
                <h2>System</h2>
                <p>Polling and connection behaviour</p>
              </div>

              <div className="settings-form-grid">
                <label className="settings-control">
                  <span>Poll interval</span>
                  <div className="settings-input-addon">
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
                  <input
                    type="checkbox"
                    checked={settings.verify_ssl}
                    onChange={(e) => update('verify_ssl', e.target.checked)}
                  />
                  <span className="settings-toggle-row__switch" />
                  <span className="settings-toggle-row__content">
                    <strong>
                      <ShieldCheck size={17} />
                      Verify SSL certificates
                    </strong>
                    <small>Recommended unless your local machine has certificate issues.</small>
                  </span>
                </label>
              </div>
            </div>
          </section>

          <section className="settings-card settings-card--console">
            <div className="settings-card__icon settings-card__icon--console">
              <MonitorSmartphone size={26} />
            </div>

            <div className="settings-card__body">
              <div className="settings-card__heading">
                <h2>Console Mode</h2>
                <p>Optimise the interface for a small Raspberry Pi touch display</p>
              </div>

              <label className="settings-toggle-row settings-toggle-row--console">
                <input
                  type="checkbox"
                  checked={consoleMode}
                  onChange={(e) => updateConsoleMode(e.target.checked)}
                />
                <span className="settings-toggle-row__switch" />
                <span className="settings-toggle-row__content">
                  <strong>
                    <PlugZap size={17} />
                    Enable console mode
                  </strong>
                  <small>Hide desktop navigation and focus the dashboard on live power flow.</small>
                </span>
              </label>
            </div>
          </section>
        </section>
      )}
    </main>
  );
}
