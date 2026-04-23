import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { AlertsPage } from './pages/AlertsPage';
import { BatteryPage } from './pages/BatteryPage';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import { TariffsPage } from './pages/TariffsPage';

type AppMode = 'demo' | 'live';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem('opensynk_logged_in') === 'true'
  );

  const [appMode, setAppMode] = useState<AppMode>(
    (localStorage.getItem('opensynk_mode') as AppMode) || 'demo'
  );

  const [username, setUsername] = useState(
    localStorage.getItem('opensynk_username') || ''
  );

  async function handleLogin(name: string, mode: AppMode) {
    setUsername(name);
    setAppMode(mode);
    setIsLoggedIn(true);

    localStorage.setItem('opensynk_username', name);
    localStorage.setItem('opensynk_mode', mode);
    localStorage.setItem('opensynk_logged_in', 'true');

    await fetch('http://127.0.0.1:8000/api/settings/set-mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
  }

  function handleLogout() {
    setIsLoggedIn(false);
    localStorage.removeItem('opensynk_logged_in');
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <AppShell
          username={username}
          mode={appMode}
          onLogout={handleLogout}
        >
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/battery" element={<BatteryPage />} />
          <Route path="/tariffs" element={<TariffsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>

        <div
          style={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            background: '#111827',
            color: '#e5e7eb',
            border: '1px solid #374151',
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: '0.9rem',
            boxShadow: '0 10px 24px rgba(0, 0, 0, 0.2)',
          }}
        >
          Signed in as <strong>{username}</strong> • Mode:{' '}
          <strong>{appMode === 'demo' ? 'Demo' : 'Live'}</strong>
        </div>
      </AppShell>
    </BrowserRouter>
  );
}