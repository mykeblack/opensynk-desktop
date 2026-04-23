import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import './AppShell.css';

interface AppShellProps {
  children: React.ReactNode;
  username?: string;
  mode?: 'demo' | 'live';
  onLogout?: () => void;
}

export function AppShell({ children, username, mode, onLogout }: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar
        username={username}
        mode={mode}
        onLogout={onLogout}
      />
      <div className="app-shell__content">
        {children}
      </div>
    </div>
  );
}