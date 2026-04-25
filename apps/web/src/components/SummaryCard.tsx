import './SummaryCard.css';

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
}

export function SummaryCard({ title, value, subtitle }: SummaryCardProps) {
  return (
    <div className="summary-card">
      <div className="summary-card__title">{title}</div>
      <div className="summary-card__value">{value}</div>
      {subtitle ? <div className="summary-card__subtitle">{subtitle}</div> : null}
    </div>
  );
}