import { useEffect, useState } from 'react';
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

  const [inverters, setInverters] = useState<Inverter[]>([]);

  const [settings, setSettings] = useState<SettingsPayload>({
    api_base_url: '',
    username: '',
    poll_interval_seconds: 60,
    selected_site: '',
    verify_ssl: false,
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

  function update<K extends keyof SettingsPayload>(
    key: K,
    value: SettingsPayload[K]
  ) {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = await saveSettings(settings);

      if (result.success) {
        setSuccess('Settings saved');
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

  return (
    <main className="dashboard-page">
      <PageTitle actions={<button className="settings-button settings-button--primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>}>
          <span className="badge badge--live">System Settings</span>
        </PageTitle>

      {loading && (
        <div className="dashboard-state">Loading settings...</div>
      )}

      {error && (
        <div className="dashboard-state dashboard-state--error">
          {error}
        </div>
      )}

      {success && (
        <div className="dashboard-state" style={{ color: '#86efac' }}>
          {success}
        </div>
      )}

      {!loading && (
        <section className="tariffs-layout">
          {/* ACCOUNT */}
          <section className="tariff-panel">
            <div className="tariff-panel__header">
              <h2>Account</h2>
              <p>Your logged-in Sunsynk account</p>
            </div>

            <div className="tariff-summary">
              <div>
                <span>Email</span>
                <strong>{settings.username}</strong>
              </div>
            </div>
          </section>

          {/* INVERTER */}
          <section className="tariff-panel">
            <div className="tariff-panel__header">
              <h2>Inverter</h2>
              <p>Select which inverter to monitor</p>
            </div>

            <div className="tariff-form">
              <div className="tariff-field">
                <label>Select Inverter</label>

                <select
                  value={settings.selected_site}
                  onChange={(e) =>
                    update('selected_site', e.target.value)
                  }
                >
                  <option value="">-- Select inverter --</option>

                  {inverters.map((inv) => (
                    <option key={inv.id} value={inv.sn}>
                      {inv.alias} ({inv.sn})
                      {inv.plant?.name ? ` - ${inv.plant.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* SYSTEM */}
          <section className="tariff-panel">
            <div className="tariff-panel__header">
              <h2>System</h2>
              <p>Polling and connection settings</p>
            </div>

            <div className="tariff-form">
              <div className="tariff-field">
                <label>Poll Interval (seconds)</label>
                <input
                  type="number"
                  min="5"
                  value={settings.poll_interval_seconds}
                  onChange={(e) =>
                    update(
                      'poll_interval_seconds',
                      Number(e.target.value)
                    )
                  }
                />
              </div>

              <div className="tariff-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.verify_ssl}
                    onChange={(e) =>
                      update('verify_ssl', e.target.checked)
                    }
                  />
                  Verify SSL certificates
                </label>
              </div>
            </div>
          </section>
        </section>
      )}
    </main>
  );
}