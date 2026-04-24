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
  const storedToken =
    localStorage.getItem('opensynk_session_token') ||
    sessionStorage.getItem('opensynk_session_token');

  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(storedToken));
  const [appMode, setAppMode] = useState<AppMode>(
    (localStorage.getItem('opensynk_mode') as AppMode) || 'demo',
  );
  const [username, setUsername] = useState(
    localStorage.getItem('opensynk_username') || '',
  );

  function handleLoginSuccess(
    email: string,
    mode: AppMode,
    sessionToken: string,
    keepSignedIn: boolean,
  ) {
    setUsername(email);
    setAppMode(mode);
    setIsLoggedIn(true);

    localStorage.setItem('opensynk_username', email);
    localStorage.setItem('opensynk_mode', mode);

    if (keepSignedIn) {
      localStorage.setItem('opensynk_logged_in', 'true');
      localStorage.setItem('opensynk_session_token', sessionToken);
      sessionStorage.removeItem('opensynk_session_token');
    } else {
      sessionStorage.setItem('opensynk_session_token', sessionToken);
      localStorage.removeItem('opensynk_logged_in');
      localStorage.removeItem('opensynk_session_token');
    }
  }

  function handleLogout() {
    setIsLoggedIn(false);
    setUsername('');
    setAppMode('demo');

    localStorage.removeItem('opensynk_logged_in');
    localStorage.removeItem('opensynk_username');
    localStorage.removeItem('opensynk_mode');
    localStorage.removeItem('opensynk_session_token');
    sessionStorage.removeItem('opensynk_session_token');
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLoginSuccess} />;
  }

  return (
    <BrowserRouter>
      <AppShell
        username={username}
        mode={appMode}
        onLogout={handleLogout}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/battery" element={<BatteryPage />} />
          <Route path="/tariffs" element={<TariffsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}