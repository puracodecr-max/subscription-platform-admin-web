import { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import type { Application, Customer, Plan, Subscription } from '../types';
import { addDays, emptyToUndefined, today } from '../utils/forms';

interface SubscriptionForm {
  customerId: string;
  applicationId: string;
  planId: string;
  startDate: string;
  endDate: string;
  nextBillingDate: string;
  billingDay: string;
  status: string;
  autoRenew: boolean;
}

const start = today();
const emptyForm: SubscriptionForm = {
  customerId: '',
  applicationId: '',
  planId: '',
  startDate: start,
  endDate: '',
  nextBillingDate: addDays(start, 30),
  billingDay: String(new Date().getDate()),
  status: 'ACTIVE',
  autoRenew: true,
};

function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState<SubscriptionForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [subscriptionsResult, customersResult, applicationsResult, plansResult] = await Promise.all([
        apiRequest<Subscription[]>({ url: '/subscriptions', params: { limit: 100 } }),
        apiRequest<Customer[]>({ url: '/customers', params: { limit: 100, status: 'ACTIVE' } }),
        apiRequest<Application[]>({ url: '/applications', params: { limit: 100, status: 'ACTIVE' } }),
        apiRequest<Plan[]>({ url: '/plans', params: { limit: 100, status: 'ACTIVE' } }),
      ]);
      setSubscriptions(subscriptionsResult.data);
      setCustomers(customersResult.data);
      setApplications(applicationsResult.data);
      setPlans(plansResult.data);
      setForm((current) => ({
        ...current,
        customerId: current.customerId || customersResult.data[0]?.id || '',
        applicationId: current.applicationId || applicationsResult.data[0]?.id || '',
        planId:
          current.planId ||
          plansResult.data.find((plan) => plan.applicationId === (current.applicationId || applicationsResult.data[0]?.id))?.id ||
          '',
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las suscripciones');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      await apiRequest<Subscription>({
        url: '/subscriptions',
        method: 'POST',
        data: {
          customerId: form.customerId,
          applicationId: form.applicationId,
          planId: form.planId,
          startDate: form.startDate,
          endDate: emptyToUndefined(form.endDate),
          nextBillingDate: form.nextBillingDate,
          billingDay: Number(form.billingDay),
          status: form.status,
          autoRenew: form.autoRenew,
        },
      });
      setMessage('Suscripcion creada correctamente');
      const applicationId = applications[0]?.id ?? '';
      setForm({
        ...emptyForm,
        customerId: customers[0]?.id ?? '',
        applicationId,
        planId: plans.find((plan) => plan.applicationId === applicationId)?.id ?? '',
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la suscripcion');
    } finally {
      setSaving(false);
    }
  }

  async function runAction(subscription: Subscription, action: 'suspend' | 'reactivate' | 'cancel') {
    const reason = action === 'reactivate' ? window.prompt('Razon de reactivacion (opcional)') : window.prompt('Razon de la accion');
    if (reason === null || (action !== 'reactivate' && reason.trim().length === 0)) return;

    setError('');
    setMessage('');
    try {
      if (action === 'suspend') {
        await apiRequest<Subscription>({ url: `/subscriptions/${subscription.id}/suspend`, method: 'POST', data: { suspensionType: 'ADMINISTRATIVE', reason } });
        setMessage('Suscripcion suspendida. El acceso quedara bloqueado en la validacion.');
      }
      if (action === 'reactivate') {
        await apiRequest<Subscription>({ url: `/subscriptions/${subscription.id}/reactivate`, method: 'POST', data: { reason: emptyToUndefined(reason), forceAdministrative: true } });
        setMessage('Suscripcion reactivada correctamente');
      }
      if (action === 'cancel') {
        await apiRequest<Subscription>({ url: `/subscriptions/${subscription.id}/cancel`, method: 'POST', data: { reason } });
        setMessage('Suscripcion cancelada correctamente');
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo ejecutar la accion');
    }
  }

  const filteredPlans = plans.filter((plan) => !form.applicationId || plan.applicationId === form.applicationId);

  return (
    <div className="grid">
      <header className="page-header"><div><p className="eyebrow">Acceso</p><h1>Suscripciones</h1><p className="muted">Asigna planes y bloquea o reactiva clientes.</p></div></header>
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <section className="card">
        <h2>Nueva suscripcion</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>Cliente<select value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value })} required>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.displayName}</option>)}</select></label>
          <label>Aplicacion<select value={form.applicationId} onChange={(event) => setForm({ ...form, applicationId: event.target.value, planId: plans.find((plan) => plan.applicationId === event.target.value)?.id ?? '' })} required>{applications.map((application) => <option key={application.id} value={application.id}>{application.code} - {application.name}</option>)}</select></label>
          <label>Plan<select value={form.planId} onChange={(event) => setForm({ ...form, planId: event.target.value })} required>{filteredPlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} ({plan.currencyCode} {plan.price})</option>)}</select></label>
          <label>Fecha inicio<input value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} type="date" required /></label>
          <label>Proxima factura<input value={form.nextBillingDate} onChange={(event) => setForm({ ...form, nextBillingDate: event.target.value })} type="date" required /></label>
          <label>Dia facturacion<input value={form.billingDay} onChange={(event) => setForm({ ...form, billingDay: event.target.value })} type="number" min="1" max="31" required /></label>
          <label>Fecha fin<input value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} type="date" /></label>
          <label>Estado<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>ACTIVE</option><option>TRIAL</option></select></label>
          <label>Auto renovacion<select value={String(form.autoRenew)} onChange={(event) => setForm({ ...form, autoRenew: event.target.value === 'true' })}><option value="true">Si</option><option value="false">No</option></select></label>
          <div className="actions"><button className="primary" disabled={saving || loading} type="submit">{saving ? 'Guardando...' : 'Crear suscripcion'}</button></div>
        </form>
      </section>

      <section className="card">
        <h2>Listado</h2>
        {loading ? <p>Cargando...</p> : <div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Aplicacion</th><th>Plan</th><th>Estado</th><th>Proxima factura</th><th>Acciones</th></tr></thead><tbody>{subscriptions.map((subscription) => <tr key={subscription.id}><td>{subscription.customerName}</td><td>{subscription.applicationCode}</td><td>{subscription.planName}</td><td><span className="badge">{subscription.status}</span>{subscription.administrativeSuspension && <p className="muted">{subscription.administrativeSuspensionReason}</p>}</td><td>{subscription.nextBillingDate}</td><td><div className="actions"><button className="danger" onClick={() => void runAction(subscription, 'suspend')} type="button">Suspender</button><button className="secondary" onClick={() => void runAction(subscription, 'reactivate')} type="button">Reactivar</button><button className="ghost" onClick={() => void runAction(subscription, 'cancel')} type="button">Cancelar</button></div></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}

export default Subscriptions;
