import './PowerFlowPanel.css';
import type { LiveSummary } from '../types/energy';

interface PowerFlowPanelProps {
  data: LiveSummary;
}

function formatWatts(value: number): string {
  return `${Math.abs(value).toLocaleString()} W`;
}

function getBatteryStatus(data: LiveSummary): string {
  if (data.solar_w > data.load_w) return 'Charging';
  if (data.solar_w < data.load_w && data.battery_soc > 5) return 'Discharging';
  return 'Idle';
}

function getGridStatus(gridWatts: number): string {
  if (gridWatts > 0) return 'Importing';
  if (gridWatts < 0) return 'Exporting';
  return 'Balanced';
}

export function PowerFlowPanel({ data }: PowerFlowPanelProps) {
  const batteryStatus = getBatteryStatus(data);
  const gridStatus = getGridStatus(data.grid_w);

  return (
    <section className="power-flow-panel">
      <div className="power-flow-panel__header">
        <h2>Power Flow</h2>
        <p>Current movement of energy around your system</p>
      </div>

      <div className="power-flow-grid">
        <div className="power-node power-node--solar">
          <div className="power-node__label">Solar</div>
          <div className="power-node__value">{formatWatts(data.solar_w)}</div>
          <div className="power-node__meta">Generating</div>
        </div>

        <div className="power-flow-arrow power-flow-arrow--right">→</div>

        <div className="power-node power-node--load">
          <div className="power-node__label">Home Load</div>
          <div className="power-node__value">{formatWatts(data.load_w)}</div>
          <div className="power-node__meta">Consuming</div>
        </div>

        <div className="power-flow-arrow power-flow-arrow--down">↓</div>

        <div className="power-node power-node--battery">
          <div className="power-node__label">Battery</div>
          <div className="power-node__value">{data.battery_soc}%</div>
          <div className="power-node__meta">{batteryStatus}</div>
        </div>

        <div className="power-flow-arrow power-flow-arrow--left">←</div>

        <div className="power-node power-node--grid">
          <div className="power-node__label">Grid</div>
          <div className="power-node__value">{formatWatts(data.grid_w)}</div>
          <div className="power-node__meta">{gridStatus}</div>
        </div>
      </div>
    </section>
  );
}