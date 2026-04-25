import { useEffect, useState } from 'react';
import { getCostToday, type CostToday } from '../api/costs';
import { getTariffs, saveTariffs, type Tariffs } from '../api/tariffs';
import { PageTitle } from '../components/PageTitle';
import './TariffsPage.css';

function money(value?: number | null): string {
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
    tariff_daily_rate: '0.00',
    tariff_unit_rate: '0.00',
    tariff_export_rate: '0.00',
    tariff_has_night_rate: false,
    tariff_night_rate: '0.00',
    tariff_night_start: '00:30',
    tariff_night_end: '04:30',
    tariff_investment_cost: '0.00',
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErrorMessage(null);

        const [tariffData, costs] = await Promise.all([
          getTariffs(),
          getCostToday().catch(() => null),
        ]);

        setTariffs(tariffData);
        setCostData(costs);
      } catch (err) {
        console.error('Failed to load tariffs', err);
        setErrorMessage('Failed to load tariff settings');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function update<K extends keyof Tariffs>(key: K, value: Tariffs[K]) {
    setTariffs((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      const result = await saveTariffs(tariffs);

      if (result.success) {
        setSuccessMessage('Tariff settings saved successfully');

        try {
          const costs = await getCostToday();
          setCostData(costs);
        } catch {
          setCostData(null);
        }
      } else {
        setErrorMessage('Failed to save tariff settings');
      }
    } catch (err) {
      console.error('Failed to save tariffs', err);
      setErrorMessage('Failed to save tariff settings');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="dashboard-page">
      <PageTitle actions={<button className="refresh-button" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Tariffs'}</button>}>
          <span className="badge badge--live">Finance Settings</span>
        </PageTitle>

      {loading && <div className="dashboard-state">Loading tariff settings...</div>}

      {successMessage && (
        <div className="dashboard-state" style={{ color: '#86efac' }}>
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="dashboard-state dashboard-state--error">
          {errorMessage}
        </div>
      )}

      {!loading && (
        <section className="tariffs-layout">
          {/* STANDARD */}
          <section className="tariff-panel">
            <div className="tariff-panel__header">
              <h2>Standard Tariff</h2>
              <p>Your base electricity pricing</p>
            </div>

            <div className="tariff-form">
              <div className="tariff-field">
                <label>Daily Standing Charge (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={tariffs.tariff_daily_rate}
                  onChange={(e) => update('tariff_daily_rate', e.target.value)}
                />
              </div>

              <div className="tariff-field">
                <label>Unit Rate (£ per kWh)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={tariffs.tariff_unit_rate}
                  onChange={(e) => update('tariff_unit_rate', e.target.value)}
                />
              </div>

              <div className="tariff-field">
                <label>Export Rate (£ per kWh)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={tariffs.tariff_export_rate}
                  onChange={(e) => update('tariff_export_rate', e.target.value)}
                />
              </div>

              <div className="tariff-field">
                <label>Solar Installation Cost (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={tariffs.tariff_investment_cost}
                  onChange={(e) =>
                    update('tariff_investment_cost', e.target.value)
                  }
                />
              </div>
            </div>
          </section>

          {/* NIGHT */}
          <section className="tariff-panel">
            <div className="tariff-panel__header">
              <h2>Night Rate</h2>
              <p>Optional off-peak pricing</p>
            </div>

            <div className="tariff-form">
              <div className="tariff-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={tariffs.tariff_has_night_rate}
                    onChange={(e) =>
                      update('tariff_has_night_rate', e.target.checked)
                    }
                  />
                  Enable night rate
                </label>
              </div>

              {tariffs.tariff_has_night_rate && (
                <>
                  <div className="tariff-field">
                    <label>Night Rate (£ per kWh)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={tariffs.tariff_night_rate}
                      onChange={(e) =>
                        update('tariff_night_rate', e.target.value)
                      }
                    />
                  </div>

                  <div className="tariff-time-grid">
                    <div className="tariff-field">
                      <label>Start</label>
                      <input
                        type="time"
                        value={tariffs.tariff_night_start}
                        onChange={(e) =>
                          update('tariff_night_start', e.target.value)
                        }
                      />
                    </div>

                    <div className="tariff-field">
                      <label>End</label>
                      <input
                        type="time"
                        value={tariffs.tariff_night_end}
                        onChange={(e) =>
                          update('tariff_night_end', e.target.value)
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* SUMMARY */}
          <section className="tariff-panel">
            <div className="tariff-panel__header">
              <h2>Summary</h2>
            </div>

            <div className="tariff-summary">
              <div>
                <span>Standing Charge</span>
                <strong>£{tariffs.tariff_daily_rate}</strong>
              </div>

              <div>
                <span>Unit Rate</span>
                <strong>£{tariffs.tariff_unit_rate}</strong>
              </div>

              <div>
                <span>Export Rate</span>
                <strong>£{tariffs.tariff_export_rate}</strong>
              </div>

              <div>
                <span>Installation Cost</span>
                <strong>£{tariffs.tariff_investment_cost}</strong>
              </div>
            </div>
          </section>

          {/* COST TODAY */}
          <section className="tariff-panel">
            <div className="tariff-panel__header">
              <h2>Today's Cost</h2>
            </div>

            {costData ? (
              <div className="tariff-summary">
                <div>
                  <span>Total Cost</span>
                  <strong>{money(costData.cost_today)}</strong>
                </div>

                <div>
                  <span>Energy Used</span>
                  <strong>{kwh(costData.energy_kwh)}</strong>
                </div>

                <div>
                  <span>Day Usage</span>
                  <strong>{kwh(costData.day_kwh)}</strong>
                </div>

                <div>
                  <span>Night Usage</span>
                  <strong>{kwh(costData.night_kwh)}</strong>
                </div>

                <div>
                  <span>Standing Charge</span>
                  <strong>{money(costData.daily_charge)}</strong>
                </div>
              </div>
            ) : (
              <div className="dashboard-state">No cost data available yet.</div>
            )}
          </section>
        </section>
      )}
    </main>
  );
}