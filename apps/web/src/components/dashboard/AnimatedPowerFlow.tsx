import './AnimatedPowerFlow.css';

export type PowerFlowData = {
  solar_w: number;
  load_w: number;
  battery_soc: number;
  battery_w: number;
  grid_w: number;
};

type Props = {
  data: PowerFlowData;
  solarEfficiency?: number;
};

function watts(value?: number): string {
  return `${Math.abs(Number(value ?? 0)).toLocaleString()} W`;
}

function flowSpeed(power: number): string {
  const abs = Math.abs(power);
  if (abs > 2500) return '0.7s';
  if (abs > 1500) return '1s';
  if (abs > 700) return '1.4s';
  return '2s';
}

function gaugeStyle(percent: number) {
  const safe = Math.max(0, Math.min(100, percent));
  return {
    '--gauge': `${safe * 3.6}deg`,
  } as React.CSSProperties;
}

export function AnimatedPowerFlow({ data, solarEfficiency = 78 }: Props) {
  const batteryCharging = data.battery_w > 0;
  const batteryDischarging = data.battery_w < 0;
  const gridImporting = data.grid_w > 0;
  const gridExporting = data.grid_w < 0;

  const solarPower = Math.max(data.solar_w, 0);
  const batteryPower = Math.abs(data.battery_w);
  const gridPower = Math.abs(data.grid_w);

  return (
    <section className="flow-shell">
      <div className="flow-shell__header">
        <div>
          <h2>Power Flow</h2>
          <p>Live energy movement</p>
        </div>
        <button className="flow-help" type="button">How it works</button>
      </div>

      <div className="flow-stage">
        <div className="flow-node flow-node--solar" style={gaugeStyle(solarEfficiency)}>
          <div className="node-ring node-ring--solar">
            <div className="node-icon">☀</div>
            <div className="node-gauge-label">{solarEfficiency}%</div>
          </div>
          <div className="node-copy">
            <strong>Solar</strong>
            <span>{watts(solarPower)}</span>
            <em>{solarEfficiency}% efficiency</em>
          </div>
        </div>

        <div className="flow-node flow-node--home">
          <div className="node-ring node-ring--home">
            <div className="node-icon">⌂</div>
          </div>
          <div className="node-copy node-copy--center">
            <strong>Home</strong>
            <span>{watts(data.load_w)}</span>
          </div>
        </div>

        <div className="flow-node flow-node--battery" style={gaugeStyle(data.battery_soc)}>
          <div className="node-ring node-ring--battery">
            <div className="node-icon">▣</div>
            <div className="node-gauge-label">{Math.round(data.battery_soc)}%</div>
          </div>
          <div className="node-copy node-copy--center">
            <strong>Battery</strong>
            <span>{watts(batteryPower)}</span>
            <em>{batteryCharging ? 'Charging' : batteryDischarging ? 'Discharging' : 'Idle'}</em>
          </div>
        </div>

        <div className={`flow-node flow-node--grid ${gridImporting ? 'is-importing' : 'is-exporting'}`}>
          <div className="node-ring node-ring--grid">
            <div className="node-icon">♜</div>
          </div>
          <div className="node-copy node-copy--center">
            <strong>Grid</strong>
            <span>{watts(gridPower)}</span>
            <em>{gridImporting ? 'Importing' : gridExporting ? 'Exporting' : 'Balanced'}</em>
          </div>
        </div>

        <div className="flow-line flow-line--solar" style={{ '--speed': flowSpeed(solarPower) } as React.CSSProperties}>
          <span /> <span /> <span /> <span />
        </div>

        {(batteryCharging || batteryDischarging) && (
          <div
            className={`flow-line flow-line--battery ${batteryCharging ? 'reverse' : ''}`}
            style={{ '--speed': flowSpeed(batteryPower) } as React.CSSProperties}
          >
            <span /> <span /> <span /> <span />
          </div>
        )}

        {(gridImporting || gridExporting) && (
          <div
            className={`flow-line flow-line--grid ${gridImporting ? 'reverse is-importing' : 'is-exporting'}`}
            style={{ '--speed': flowSpeed(gridPower) } as React.CSSProperties}
          >
            <span /> <span /> <span /> <span />
          </div>
        )}
      </div>

      <div className="flow-legend">
        <span><i className="dot solar" />Generating</span>
        <span><i className="dot home" />Consuming</span>
        <span><i className="dot battery" />Battery</span>
        <span><i className="dot export" />Exporting</span>
        <span><i className="dot import" />Importing</span>
      </div>
    </section>
  );
}
