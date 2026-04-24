import { Link, useLocation } from 'react-router-dom';
import {
  Bell,
  BatteryMedium,
  Clock3,
  Home,
  LogOut,
  PoundSterling,
} from 'lucide-react';
import './AppShell.css';

type Props = {
  children: React.ReactNode;
  username: string;
  mode: 'demo' | 'live';
  onLogout: () => void;
};

const navItems = [
  { href: '/dashboard', label: 'Home', icon: <Home size={22} strokeWidth={2.1} /> },
  { href: '/history', label: 'History', icon: <Clock3 size={22} strokeWidth={2.1} /> },
  { href: '/battery', label: 'Battery', icon: <BatteryMedium size={22} strokeWidth={2.1} /> },
  { href: '/tariffs', label: 'Tariffs', icon: <PoundSterling size={22} strokeWidth={2.1} /> },
  { href: '/alerts', label: 'Alerts', icon: <Bell size={22} strokeWidth={2.1} /> },
];

export function AppShell({ children, username, mode, onLogout }: Props) {
  const location = useLocation();

  return (
    <div className="shell-with-bottom-nav">
      <div className="shell-content">{children}</div>

      <nav className="bottom-nav" aria-label="Main navigation">
        {navItems.map((item) => {
          const active =
            location.pathname === item.href ||
            (location.pathname === '/' && item.href === '/dashboard');
          return (
            <Link key={item.href} to={item.href} className={active ? 'active' : ''}>
              <span className="bottom-nav__icon">{item.icon}</span>
              <strong>{item.label}</strong>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onLogout}
          className="bottom-nav__logout"
          title={`${username} (${mode}) — Log out`}
          aria-label="Log out"
        >
          <LogOut size={20} strokeWidth={2.1} />
        </button>
      </nav>
    </div>
  );
}
