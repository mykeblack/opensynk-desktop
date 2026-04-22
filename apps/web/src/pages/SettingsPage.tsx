import { useEffect, useState } from 'react';
import { getSettings, saveSettings, testConnection } from '../api/settings';
import './SettingsPage.css';

export function SettingsPage() {
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [pollInterval, setPollInterval] = useState(60);
  const [selectedSite, setSelectedSite] = useState('Home');
  const [verifySsl, setVerifySsl] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [appKey, setAppKey] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tokenType, setTokenType] = useState('');
  const [tokenExpiresIn, setTokenExpiresIn] = useState<number | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setErrorMessage(null);
        setTestDetails(null);
        setTokenType(settings.token_type);
        setTokenExpiresIn(settings.token_expires_in);

        const settings = await getSettings();

        setApiBaseUrl(settings.api_base_url);
        setAccessToken(settings.access_token);
        setPollInterval(settings.poll_interval_seconds);
        setSelectedSite(settings.selected_site);
        setVerifySsl(settings.verify_ssl);
        setAppKey(settings.app_key);
        setAppSecret(settings.app_secret);
        setUsername(settings.username);
        setPassword(settings.password);
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
      setTestDetails(null);

      const response = await saveSettings({
        api_base_url: apiBaseUrl,
        access_token: accessToken,
        poll_interval_seconds: pollInterval,
        selected_site: selectedSite,
        verify_ssl: verifySsl,
        app_key: appKey,
        app_secret: appSecret,
        username: username,
        password: password,
      });

      setSuccessMessage(response.message);
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
        username: username,
        password: password,
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
                <label htmlFor="accessToken">Access Token</label>
                <input
                  id="accessToken"
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Enter Sunsynk access token"
                />

                <div className="settings-field">
                  <label htmlFor="appKey">App Key</label>
                  <input
                    id="appKey"
                    type="text"
                    value={appKey}
                    onChange={(e) => setAppKey(e.target.value)}
                    placeholder="Enter Sunsynk app key"
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="appSecret">App Secret</label>
                  <input
                    id="appSecret"
                    type="password"
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                    placeholder="Enter Sunsynk app secret"
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="username">Sunsynk Username</label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter Sunsynk username"
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="password">Sunsynk Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Sunsynk password"
                  />
                </div>
              </div>

              <div className="settings-field">
                <label htmlFor="pollInterval">Poll Interval (seconds)</label>
                <input
                  id="pollInterval"
                  type="number"
                  min={10}
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
            <div className="settings-panel__header">
              <h2>Site Configuration</h2>
              <p>Select the site or inverter to monitor.</p>
            </div>

            <div className="settings-form">
              <div className="settings-field">
                <label htmlFor="selectedSite">Selected Site</label>
                <select
                  id="selectedSite"
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                >
                  <option value="Home">Home</option>
                  <option value="Office">Office</option>
                  <option value="Garage">Garage</option>
                </select>
              </div>
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
                onClick={handleTestConnection}
                disabled={testingConnection}
              >
                {testingConnection ? 'Testing...' : 'Get Access Token'}
              </button>

              <button
                className="settings-button settings-button--primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}