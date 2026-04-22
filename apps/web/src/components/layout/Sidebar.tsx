import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'History', path: '/history' },
  { label: 'Battery', path: '/battery' },
  { label: 'Tariffs', path: '/tariffs' },
  { label: 'Alerts', path: '/alerts' },
  { label: 'Settings', path: '/settings' },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">⚡</div>
        <div>
          <div className="sidebar__title">OpenSynk</div>
          <div className="sidebar__subtitle">Desktop</div>
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
    </aside>
  );
}