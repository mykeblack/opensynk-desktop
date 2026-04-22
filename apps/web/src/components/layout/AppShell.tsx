import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import './AppShell.css';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-shell__content">
        {children}
      </div>
    </div>
  );
}