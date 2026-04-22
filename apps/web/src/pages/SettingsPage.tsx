import { useState } from 'react';
import './SettingsPage.css';

export function SettingsPage() {
  const [apiBaseUrl, setApiBaseUrl] = useState('https://openapi.sunsynk.net');
  const [accessToken, setAccessToken] = useState('');
  const [pollInterval, setPollInterval] = useState(60);
  const [selectedSite, setSelectedSite] = useState('Home');

  function handleSave() {
    console.log('Saving settings', {
      apiBaseUrl,
      accessToken,
      pollInterval,
      selectedSite,
    });
  }

  function handleTestConnection() {
    console.log('Testing connection...');
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-page__header">
        <div>
          <h1>Settings</h1>
          <p>Configure Sunsynk API access and application preferences</p>
        </div>
      </header>

      <div className="settings-layout">
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
            <p>Test and save your configuration.</p>
          </div>

          <div className="settings-actions">
            <button
              className="settings-button settings-button--secondary"
              onClick={handleTestConnection}
            >
              Test Connection
            </button>

            <button
              className="settings-button settings-button--primary"
              onClick={handleSave}
            >
              Save Settings
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}