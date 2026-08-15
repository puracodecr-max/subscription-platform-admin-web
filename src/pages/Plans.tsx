import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import type { Application, Currency, Plan } from '../types';
import { emptyToUndefined, optionalNumber } from '../utils/forms';

interface PlanForm {
  applicationId: string;
  code: string;
  name: string;
  description: string;
  price: string;
  currencyId: string;
  frequency: string;
  gracePeriodDays: string;
  suspensionAfterDueDays: string;
  penaltyType: string;
  penaltyValue: string;
  status: string;
}

const emptyForm: PlanForm = {
  applicationId: '',
  code: '',
  name: '',
  description: '',
  price: '',
  currencyId: '',
  frequency: 'MONTHLY',
  gracePeriodDays: '5',
  suspensionAfterDueDays: '10',
  penaltyType: 'PERCENTAGE',
  penaltyValue: '5',
  status: 'ACTIVE',
};

function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [form, setForm] = useState<PlanForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [plansResult, applicationsResult, currenciesResult] = await Promise.all([
        apiRequest<Plan[]>({ url: '/plans', params: { limit: 100 } }),
        apiRequest<Application[]>({ url: '/applications', params: { limit: 100, status: 'ACTIVE' } }),
        apiRequest<Currency[]>({ url: '/catalogs/currencies' }),
      ]);
      setPlans(plansResult.data);
      setApplications(applicationsResult.data);
      setCurrencies(currenciesResult.data);
      setForm((current) => ({
        ...current,
        applicationId: current.applicationId || applicationsResult.data[0]?.id || '',
        currencyId: current.currencyId || currenciesResult.data[0]?.id || '',
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los planes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function resetForm() {
    setForm({ ...emptyForm, applicationId: applications[0]?.id ?? '', currencyId: currencies[0]?.id ?? '' });
    setEditingId(null);
  }

  function editPlan(plan: Plan) {
    setEditingId(plan.id);
    setForm({
      applicationId: plan.applicationId,
      code: plan.code,
      name: plan.name,
      description: plan.description ?? '',
      price: plan.price,
      currencyId: plan.currencyId,
      frequency: plan.frequency,
      gracePeriodDays: String(plan.gracePeriodDays),
      suspensionAfterDueDays: String(plan.suspensionAfterDueDays),
      penaltyType: plan.penaltyType,
      penaltyValue: plan.penaltyValue,
      status: plan.status,
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    const payload = {
      applicationId: form.applicationId,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: emptyToUndefined(form.description),
      price: form.price,
      currencyId: form.currencyId,
      frequency: form.frequency,
      gracePeriodDays: optionalNumber(form.gracePeriodDays),
      suspensionAfterDueDays: optionalNumber(form.suspensionAfterDueDays),
      penaltyType: form.penaltyType,
      penaltyValue: emptyToUndefined(form.penaltyValue),
      status: form.status,
    };

    try {
      if (editingId) {
        await apiRequest<Plan>({ url: `/plans/${editingId}`, method: 'PATCH', data: payload });
        setMessage('Plan actualizado correctamente');
      } else {
        await apiRequest<Plan>({ url: '/plans', method: 'POST', data: payload });
        setMessage('Plan creado correctamente');
      }
      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el plan');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid">
      <header className="page-header"><div><p className="eyebrow">Catalogo</p><h1>Planes</h1><p className="muted">Precios, ciclos de facturacion y reglas de bloqueo.</p></div></header>
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <section className="card">
        <h2>{editingId ? 'Editar plan' : 'Nuevo plan'}</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>Aplicacion<select value={form.applicationId} onChange={(event) => setForm({ ...form, applicationId: event.target.value })} required>{applications.map((application) => <option key={application.id} value={application.id}>{application.code} - {application.name}</option>)}</select></label>
          <label>Codigo<input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required /></label>
          <label>Nombre<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
          <label>Precio<input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="100.00" required /></label>
          <label>Moneda<select value={form.currencyId} onChange={(event) => setForm({ ...form, currencyId: event.target.value })} required>{currencies.map((currency) => <option key={currency.id} value={currency.id}>{currency.code} - {currency.name}</option>)}</select></label>
          <label>Frecuencia<select value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value })}><option>MONTHLY</option><option>QUARTERLY</option><option>YEARLY</option></select></label>
          <label>Dias de gracia<input value={form.gracePeriodDays} onChange={(event) => setForm({ ...form, gracePeriodDays: event.target.value })} type="number" min="0" /></label>
          <label>Suspender tras dias vencidos<input value={form.suspensionAfterDueDays} onChange={(event) => setForm({ ...form, suspensionAfterDueDays: event.target.value })} type="number" min="0" /></label>
          <label>Tipo multa<select value={form.penaltyType} onChange={(event) => setForm({ ...form, penaltyType: event.target.value })}><option>PERCENTAGE</option><option>FIXED</option></select></label>
          <label>Valor multa<input value={form.penaltyValue} onChange={(event) => setForm({ ...form, penaltyValue: event.target.value })} /></label>
          <label>Estado<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>ACTIVE</option><option>INACTIVE</option></select></label>
          <label>Descripcion<input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <div className="actions"><button className="primary" disabled={saving || loading} type="submit">{saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear plan'}</button>{editingId && <button className="ghost" onClick={resetForm} type="button">Cancelar</button>}</div>
        </form>
      </section>

      <section className="card">
        <h2>Listado</h2>
        {loading ? <p>Cargando...</p> : <div className="table-wrap"><table><thead><tr><th>Plan</th><th>Aplicacion</th><th>Precio</th><th>Frecuencia</th><th>Bloqueo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{plans.map((plan) => <tr key={plan.id}><td><strong>{plan.name}</strong><br /><span className="muted">{plan.code}</span></td><td>{applications.find((application) => application.id === plan.applicationId)?.code ?? plan.applicationId}</td><td>{plan.currencyCode} {plan.price}</td><td>{plan.frequency}</td><td>{plan.gracePeriodDays} dias gracia / {plan.suspensionAfterDueDays} susp.</td><td><span className="badge">{plan.status}</span></td><td><button className="secondary" onClick={() => editPlan(plan)} type="button">Editar</button></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}

export default Plans;
