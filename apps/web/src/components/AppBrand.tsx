import './AppBrand.css';

type AppBrandProps = {
  href?: string;
  size?: 'compact' | 'default';
  className?: string;
};

export function OpenSynkSunMark({ size = 56 }: { size?: number }) {
  return (
    <svg viewBox="0 0 72 72" width={size} height={size} aria-hidden="true" className="app-brand__sun">
      <defs>
        <radialGradient id="opensynkSunCore" cx="42%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#fff7a8" />
          <stop offset="38%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
        <filter id="opensynkSunGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g stroke="#facc15" strokeWidth="4.4" strokeLinecap="round" filter="url(#opensynkSunGlow)">
        <line x1="36" y1="4" x2="36" y2="13" />
        <line x1="36" y1="59" x2="36" y2="68" />
        <line x1="4" y1="36" x2="13" y2="36" />
        <line x1="59" y1="36" x2="68" y2="36" />
        <line x1="13.4" y1="13.4" x2="20" y2="20" />
        <line x1="52" y1="52" x2="58.6" y2="58.6" />
        <line x1="58.6" y1="13.4" x2="52" y2="20" />
        <line x1="20" y1="52" x2="13.4" y2="58.6" />
      </g>

      <circle cx="36" cy="36" r="15" fill="url(#opensynkSunCore)" filter="url(#opensynkSunGlow)" />
      <circle cx="31" cy="30" r="4.2" fill="rgba(255,255,255,0.45)" />
    </svg>
  );
}

export function AppBrand({ href = '/dashboard', size = 'default', className = '' }: AppBrandProps) {
  const content = (
    <>
      <OpenSynkSunMark size={size === 'compact' ? 42 : 56} />
      <span className="app-brand__text">
        <strong>
          Open<span>Synk</span>
        </strong>
        <em>Intelligent Energy Monitoring</em>
      </span>
    </>
  );

  if (href) {
    return (
      <a className={`app-brand app-brand--${size} ${className}`.trim()} href={href} aria-label="OpenSynk dashboard">
        {content}
      </a>
    );
  }

  return <div className={`app-brand app-brand--${size} ${className}`.trim()}>{content}</div>;
}
