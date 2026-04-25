import { useEffect, useState } from 'react';
import { Clock3, Coins, Moon, PiggyBank, PoundSterling, ReceiptText, SunMedium } from 'lucide-react';
import { getCostToday, type CostToday } from '../api/costs';
import { getTariffs, saveTariffs, type Tariffs } from '../api/tariffs';
import './TariffsPage.css';

function SunLogoMark({ size = 48 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" className="brand-logo__mark-svg">
      <g stroke="#facc15" strokeWidth="3.5" strokeLinecap="round">
        <line x1="32" y1="3" x2="32" y2="11" /><line x1="32" y1="53" x2="32" y2="61" /><line x1="3" y1="32" x2="11" y2="32" /><line x1="53" y1="32" x2="61" y2="32" /><line x1="11.5" y1="11.5" x2="17" y2="17" /><line x1="47" y1="47" x2="52.5" y2="52.5" /><line x1="52.5" y1="11.5" x2="47" y2="17" /><line x1="17" y1="47" x2="11.5" y2="52.5" />
      </g><circle cx="32" cy="32" r="13" fill="#facc15" />
    </svg>
  );
}

function PageBrand({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return (
    <header className="page-brand-header">
      <a className="brand-logo" href="/dashboard" aria-label="OpenSynk dashboard">
        <SunLogoMark />
        <span className="brand-logo__text"><strong>Open<span>Synk</span></strong><em>Energy intelligence</em></span>
      </a>
      <button className="primary-action" onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save Tariffs'}</button>
    </header>
  );
}

function money(value?: number | string | null): string {
  return `£${Number(value ?? 0).toFixed(2)}`;
}
function kwh(value?: number | null): string {
  return `${Number(value ?? 0).toFixed(2)} kWh`;
}

export function TariffsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [costData, setCostData] = useState<CostToday | null>(null);
  const [tariffs, setTariffs] = useState<Tariffs>({
    tariff_daily_rate: '0.00', tariff_unit_rate: '0.00', tariff_export_rate: '0.00', tariff_has_night_rate: false,
    tariff_night_rate: '0.00', tariff_night_start: '00:30', tariff_night_end: '04:30', tariff_investment_cost: '0.00',
  });

  async function loadTariffs() {
    try {
      setLoading(true); setErrorMessage(null);
      const [tariffData, costs] = await Promise.all([getTariffs(), getCostToday().catch(() => null)]);
      setTariffs(tariffData); setCostData(costs);
    } catch (err) {
      console.error('Failed to load tariffs', err); setErrorMessage('Failed to load tariff settings');
    } finally { setLoading(false); }
  }

  useEffect(() => { loadTariffs(); }, []);

  function update<K extends keyof Tariffs>(key: K, value: Tariffs[K]) { setTariffs((prev) => ({ ...prev, [key]: value })); }

  async function handleSave() {
    try {
      setSaving(true); setSuccessMessage(null); setErrorMessage(null);
      const result = await saveTariffs(tariffs);
      if (result.success) {
        setSuccessMessage('Tariff settings saved successfully');
        setCostData(await getCostToday().catch(() => null));
      } else setErrorMessage('Failed to save tariff settings');
    } catch (err) {
      console.error('Failed to save tariffs', err); setErrorMessage('Failed to save tariff settings');
    } finally { setSaving(false); }
  }

  return (
    <main className="modern-subpage tariffs-page">
      <PageBrand saving={saving} onSave={handleSave} />

      <section className="page-hero-card">
        <div>
          <span className="page-kicker"><PoundSterling size={16} /> Tariffs</span>
          <h1>Energy pricing</h1>
          <p>Set your import, export, off-peak and investment values.</p>
        </div>
        <div className="page-hero-stat"><strong>{money(costData?.cost_today)}</strong><span>today cost</span></div>
      </section>

      {loading && <div className="page-state">Loading tariff settings...</div>}
      {successMessage && <div className="page-state page-state--success">{successMessage}</div>}
      {errorMessage && <div className="page-state page-state--error">{errorMessage}</div>}

      {!loading && (
        <>
          <section className="tariff-kpi-grid">
            <article className="modern-kpi"><ReceiptText size={22} /><span>Standing Charge</span><strong>{money(tariffs.tariff_daily_rate)}</strong></article>
            <article className="modern-kpi"><SunMedium size={22} /><span>Unit Rate</span><strong>{money(tariffs.tariff_unit_rate)}</strong></article>
            <article className="modern-kpi"><Coins size={22} /><span>Export Rate</span><strong>{money(tariffs.tariff_export_rate)}</strong></article>
            <article className="modern-kpi"><PiggyBank size={22} /><span>Investment</span><strong>{money(tariffs.tariff_investment_cost)}</strong></article>
          </section>

          <section className="tariffs-layout-modern">
            <article className="modern-panel tariff-form-panel">
              <div className="modern-panel__header"><div><h2>Standard tariff</h2><p>Your base daily and per-kWh pricing</p></div></div>
              <div className="tariff-form">
                <label className="tariff-field"><span>Daily Standing Charge (£)</span><input type="number" step="0.01" value={tariffs.tariff_daily_rate} onChange={(e) => update('tariff_daily_rate', e.target.value)} /></label>
                <label className="tariff-field"><span>Unit Rate (£ per kWh)</span><input type="number" step="0.0001" value={tariffs.tariff_unit_rate} onChange={(e) => update('tariff_unit_rate', e.target.value)} /></label>
                <label className="tariff-field"><span>Export Rate (£ per kWh)</span><input type="number" step="0.0001" value={tariffs.tariff_export_rate} onChange={(e) => update('tariff_export_rate', e.target.value)} /></label>
                <label className="tariff-field"><span>Solar Installation Cost (£)</span><input type="number" step="0.01" value={tariffs.tariff_investment_cost} onChange={(e) => update('tariff_investment_cost', e.target.value)} /></label>
              </div>
            </article>

            <article className="modern-panel tariff-form-panel">
              <div className="modern-panel__header"><div><h2>Night rate</h2><p>Optional off-peak charging period</p></div><Moon className="panel-icon" size={25} /></div>
              <div className="tariff-form">
                <label className="tariff-switch"><input type="checkbox" checked={tariffs.tariff_has_night_rate} onChange={(e) => update('tariff_has_night_rate', e.target.checked)} /><span>Enable cheaper night rate</span></label>
                {tariffs.tariff_has_night_rate && (
                  <>
                    <label className="tariff-field"><span>Night Rate (£ per kWh)</span><input type="number" step="0.0001" value={tariffs.tariff_night_rate} onChange={(e) => update('tariff_night_rate', e.target.value)} /></label>
                    <div className="tariff-time-grid">
                      <label className="tariff-field"><span>Start</span><input type="time" value={tariffs.tariff_night_start} onChange={(e) => update('tariff_night_start', e.target.value)} /></label>
                      <label className="tariff-field"><span>End</span><input type="time" value={tariffs.tariff_night_end} onChange={(e) => update('tariff_night_end', e.target.value)} /></label>
                    </div>
                  </>
                )}
              </div>
            </article>

            <article className="modern-panel tariff-summary-panel">
              <div className="modern-panel__header"><div><h2>Today's estimate</h2><p>Based on your stored samples</p></div></div>
              <div className="tariff-summary">
                <div><span>Total Cost</span><strong>{money(costData?.cost_today)}</strong></div>
                <div><span>Energy Used</span><strong>{kwh(costData?.energy_kwh)}</strong></div>
                <div><span>Day Usage</span><strong>{kwh(costData?.day_kwh)}</strong></div>
                <div><span>Night Usage</span><strong>{kwh(costData?.night_kwh)}</strong></div>
                <div><span>Standing Charge</span><strong>{money(costData?.daily_charge)}</strong></div>
              </div>
            </article>
          </section>
        </>
      )}
    </main>
  );
}
