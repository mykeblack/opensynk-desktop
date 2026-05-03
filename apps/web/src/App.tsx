import { useEffect, useState } from 'react';
import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import { AppShell } from './components/layout/AppShell';
import PageTransition from './components/PageTransition';

import { AlertsPage } from './pages/AlertsPage';
import { BatteryPage } from './pages/BatteryPage';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import { TariffsPage } from './pages/TariffsPage';

type AppMode = 'demo' | 'live';

function getStoredSessionToken(): string {
  return (
    localStorage.getItem('opensynk_session_token') ||
    sessionStorage.getItem('opensynk_session_token') ||
    ''
  );
}

export default function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(getStoredSessionToken()));
  const [appMode, setAppMode] = useState<AppMode>(
    (localStorage.getItem('opensynk_mode') as AppMode) || 'demo',
  );
  const [username, setUsername] = useState(
    localStorage.getItem('opensynk_username') || '',
  );
  const [consoleMode, setConsoleMode] = useState(
    localStorage.getItem('opensynk_console_mode') === 'true',
  );

  useEffect(() => {
    document.body.classList.toggle('console-mode', consoleMode);
  }, [consoleMode]);

  function handleLoginSuccess(
    email: string,
    mode: AppMode,
    sessionToken: string,
    keepSignedIn?: boolean,
  ) {
    setUsername(email);
    setAppMode(mode);
    setIsLoggedIn(true);

    localStorage.setItem('opensynk_username', email);
    localStorage.setItem('opensynk_mode', mode);

    if (keepSignedIn === false) {
      sessionStorage.setItem('opensynk_session_token', sessionToken);
      localStorage.removeItem('opensynk_session_token');
      localStorage.removeItem('opensynk_logged_in');
    } else {
      localStorage.setItem('opensynk_logged_in', 'true');
      localStorage.setItem('opensynk_session_token', sessionToken);
      sessionStorage.removeItem('opensynk_session_token');
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
    <AppShell
      username={username}
      mode={appMode}
      consoleMode={consoleMode}
      onConsoleModeChange={setConsoleMode}
      onLogout={handleLogout}
    >
      <div className="app-route-stage">
        <AnimatePresence mode="sync" initial={false}>
          <PageTransition key={location.pathname}>
            <Routes location={location}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/battery" element={<BatteryPage />} />
              <Route path="/tariffs" element={<TariffsPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </PageTransition>
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
