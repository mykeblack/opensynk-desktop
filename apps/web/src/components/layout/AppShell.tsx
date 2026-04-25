import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BatteryCharging,
  Bell,
  Clock3,
  Home,
  LogOut,
  PoundSterling,
  Settings,
} from 'lucide-react';
import './AppShell.css';

type Props = {
  children: ReactNode;
  username: string;
  mode: string;
  consoleMode?: boolean;
  onConsoleModeChange?: (enabled: boolean) => void;
  onLogout: () => void;
};

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/history', label: 'History', icon: Clock3 },
  { to: '/battery', label: 'Battery', icon: BatteryCharging },
  { to: '/tariffs', label: 'Tariffs', icon: PoundSterling },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell({
  children,
  consoleMode = false,
  onConsoleModeChange,
}: Props) {
  const location = useLocation();

  function exitConsoleMode() {
    localStorage.setItem('opensynk_console_mode', 'false');
    document.body.classList.remove('console-mode');
    onConsoleModeChange?.(false);
  }

  return (
    <div className="app-shell">
      <main className="app-shell__content">{children}</main>

      <nav className="bottom-nav" aria-label="Main navigation">
        <div className="bottom-nav__inner">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.to ||
              (item.to === '/dashboard' && location.pathname === '/');

            return (
              <Link
                key={item.to}
                to={item.to}
                className={isActive ? 'bottom-nav__item active' : 'bottom-nav__item'}
                aria-label={item.label}
                title={item.label}
              >
                <Icon className="bottom-nav__icon" size={28} strokeWidth={2.15} />
                <span className="bottom-nav__label">{item.label}</span>
              </Link>
            );
          })}

          {consoleMode && (
            <button
              type="button"
              className="bottom-nav__item bottom-nav__item--exit-console"
              onClick={exitConsoleMode}
              aria-label="Exit console mode"
              title="Exit console mode"
            >
              <LogOut className="bottom-nav__icon" size={28} strokeWidth={2.15} />
              <span className="bottom-nav__label">Exit</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
