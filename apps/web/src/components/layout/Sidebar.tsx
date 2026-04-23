import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  username?: string;
  mode?: 'demo' | 'live';
  onLogout?: () => void;
}

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'History', path: '/history' },
  { label: 'Battery', path: '/battery' },
  { label: 'Tariffs', path: '/tariffs' },
  { label: 'Alerts', path: '/alerts' },
  { label: 'Settings', path: '/settings' },
];

export function Sidebar({ username, mode, onLogout }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar__brand">
          <div className="sidebar__logo">⚡</div>
          <div>
            <div className="sidebar__title">OpenSynk</div>
            <div className="sidebar__subtitle">Desktop</div>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user__name">{username || 'User'}</div>
          <div className="sidebar-user__mode">
            {mode === 'demo' ? 'Demo Mode' : 'Live Mode'}
          </div>
        </div>

        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <button className="sidebar-logout" onClick={onLogout}>
        <LogOut size={16} />
        <span>Logout</span>
      </button>
    </aside>
  );
}