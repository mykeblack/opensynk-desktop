import { useEffect, useState } from 'react';
import { getSettings, saveSettings, testConnection } from '../api/settings';
import { getInverters, type InverterInfo } from '../api/inverters';
import './SettingsPage.css';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [saving, setSaving] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [apiBaseUrl, setApiBaseUrl] = useState('https://openapi.sunsynk.net');
  const [accessToken, setAccessToken] = useState('');
  const [appKey, setAppKey] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pollInterval, setPollInterval] = useState(60);
  const [selectedSite, setSelectedSite] = useState('');
  const [verifySsl, setVerifySsl] = useState(true);

  const [tokenType, setTokenType] = useState('');
  const [tokenExpiresIn, setTokenExpiresIn] = useState<number | null>(null);

  const [inverters, setInverters] = useState<InverterInfo[]>([]);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const settings = await getSettings();

        setApiBaseUrl(settings.api_base_url || 'https://openapi.sunsynk.net');
        setAccessToken(settings.access_token || '');
        setAppKey(settings.app_key || '');
        setAppSecret(settings.app_secret || '');
        setUsername(settings.username || '');
        setPassword(settings.password || '');
        setPollInterval(settings.poll_interval_seconds || 60);
        setSelectedSite(settings.selected_site || '');
        setVerifySsl(settings.verify_ssl ?? true);
        setTokenType(settings.token_type || '');
        setTokenExpiresIn(settings.token_expires_in ?? null);

        try {
          const loadedInverters = await getInverters();
          setInverters(loadedInverters);

          if (
            loadedInverters.length > 0 &&
            !loadedInverters.find((inv) => inv.sn === selectedSite)
          ) {
            setSelectedSite(loadedInverters[0].sn);
          }
        } catch (err) {
          console.error('Failed to load inverters', err);
          setErrorMessage(err instanceof Error ? err.message : 'Failed to load inverters');
          setInverters([]);
        }
      } catch (err) {
        console.error('Failed to load settings', err);
        setErrorMessage('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  async function handleSave() {
    try {
      setSaving(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      const response = await saveSettings({
        api_base_url: apiBaseUrl,
        access_token: accessToken,
        app_key: appKey,
        app_secret: appSecret,
        username,
        password,
        poll_interval_seconds: pollInterval,
        selected_site: selectedSite,
        verify_ssl: verifySsl,
      });

      if (response.success) {
        setSuccessMessage(response.message || 'Settings saved successfully');
      } else {
        setErrorMessage(response.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Failed to save settings', err);
      setErrorMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    try {
      setTestingConnection(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      const response = await testConnection({
        api_base_url: apiBaseUrl,
        access_token: accessToken,
        app_key: appKey,
        app_secret: appSecret,
        username,
        password,
        verify_ssl: verifySsl,
      });

      if (response.success) {
        setSuccessMessage(
          response.expires_in
            ? `Access token refreshed successfully. Expires in ${response.expires_in} seconds.`
            : 'Access token refreshed successfully.',
        );

        if (response.token_type) {
          setTokenType(response.token_type);
        }

        if (response.expires_in !== undefined) {
          setTokenExpiresIn(response.expires_in);
        }

        try {
          const loadedInverters = await getInverters();
          setInverters(loadedInverters);

          if (
            loadedInverters.length > 0 &&
            !loadedInverters.find((inv) => inv.sn === selectedSite)
          ) {
            setSelectedSite(loadedInverters[0].sn);
          }
        } catch (err) {
          console.error('Failed to load inverters', err);
          setErrorMessage(err instanceof Error ? err.message : 'Failed to load inverters after refresh');
          setInverters([]);
        }
      } else {
        setErrorMessage(
          response.status_code
            ? `Token request failed with status ${response.status_code}`
            : response.message || 'Failed to retrieve access token',
        );
      }
    } catch (err) {
      console.error('Failed to get access token', err);
      setErrorMessage('Failed to retrieve access token');
    } finally {
      setTestingConnection(false);
    }
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-page__header">
        <div>
          <h1>Settings</h1>
          <p>Configure Sunsynk API access and application preferences</p>
        </div>
      </header>

      {loading && <div className="dashboard-state">Loading settings...</div>}

      {!loading && (
        <div className="settings-layout">
          {successMessage && (
            <div className="settings-status settings-status--success">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="settings-status settings-status--error">
              {errorMessage}
            </div>
          )}

          {tokenType && (
            <div className="settings-status settings-status--success">
              Token type: {tokenType}
              {tokenExpiresIn ? ` • Expires in ${tokenExpiresIn} seconds` : ''}
            </div>
          )}

          <section className="settings-panel">
            <div className="settings-panel__header">
              <h2>API Configuration</h2>
              <p>Manage your Sunsynk API connection settings.</p>
            </div>

            <div className="settings-form">
              <div className="settings-field">
                <label htmlFor="apiBaseUrl">API Base URL</label>
                <input
                  id="apiBaseUrl"
                  type="text"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label htmlFor="appKey">App Key</label>
                <input
                  id="appKey"
                  type="text"
                  value={appKey}
                  onChange={(e) => setAppKey(e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label htmlFor="appSecret">App Secret</label>
                <input
                  id="appSecret"
                  type="password"
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label htmlFor="pollInterval">Poll Interval (seconds)</label>
                <input
                  id="pollInterval"
                  type="number"
                  min={5}
                  max={3600}
                  value={pollInterval}
                  onChange={(e) => setPollInterval(Number(e.target.value))}
                />
              </div>

              <div className="settings-checkbox">
                <label className="settings-checkbox__label">
                  <input
                    type="checkbox"
                    checked={verifySsl}
                    onChange={(e) => setVerifySsl(e.target.checked)}
                  />
                  Verify SSL certificates
                </label>

                {!verifySsl && (
                  <div className="settings-warning">
                    Warning: certificate validation is disabled. This is insecure
                    and should only be used temporarily for local testing.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="settings-panel">
            <div className="settings-field">
              <label htmlFor="selectedSite">Selected Inverter</label>
              <select
                id="selectedSite"
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
              >
                {inverters.length === 0 && (
                  <option value="">No inverters loaded</option>
                )}

                {inverters.map((inv) => (
                  <option key={inv.sn} value={inv.sn}>
                    {inv.alias || inv.sn} — {inv.plant?.name || 'Unknown Plant'}
                  </option>
                ))}
              </select>
              {selectedSite && (
                <div className="settings-status settings-status--success">
                  {(() => {
                    const selected = inverters.find((inv) => inv.sn === selectedSite);
                    if (!selected) return 'Selected inverter loaded';

                    return `SN: ${selected.sn} • Power: ${selected.pac}W • Today: ${selected.etoday}kWh`;
                  })()}
                </div>
              )}
            </div>

          </section>

          <section className="settings-panel">
            <div className="settings-panel__header">
              <h2>Actions</h2>
              <p>Retrieve and store a valid Sunsynk access token, then save your configuration.</p>
            </div>

            <div className="settings-actions">
              <button
                className="settings-button settings-button--secondary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>

              <button
                className="settings-button settings-button--primary"
                onClick={handleTestConnection}
                disabled={testingConnection}
              >
                {testingConnection
                  ? 'Refreshing Token...'
                  : 'Get / Refresh Access Token'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}