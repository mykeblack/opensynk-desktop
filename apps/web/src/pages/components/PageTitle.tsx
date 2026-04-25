import type { ReactNode } from 'react';
import { AppBrand } from './AppBrand';
import './PageTitle.css';

type PageTitleProps = {
  children?: ReactNode;
  actions?: ReactNode;
};

export function PageTitle({ children, actions }: PageTitleProps) {
  return (
    <header className="app-page-title">
      <div className="app-page-title__main">
        <AppBrand size="compact" />
        {children ? <div className="app-page-title__meta">{children}</div> : null}
      </div>
      {actions ? <div className="app-page-title__actions">{actions}</div> : null}
    </header>
  );
}
