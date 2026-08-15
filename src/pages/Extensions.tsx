import { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import type { Invoice, Subscription, SubscriptionExtension } from '../types';
import { addDays, emptyToUndefined, today } from '../utils/forms';

interface ExtensionForm {
  subscriptionId: string;
  invoiceId: string;
  originalDueDate: string;
  extendedDueDate: string;
  reason: string;
  reactivateIfEligible: boolean;
}

const currentDate = today();
const emptyForm: ExtensionForm = { subscriptionId: '', invoiceId: '', originalDueDate: currentDate, extendedDueDate: addDays(currentDate, 7), reason: '', reactivateIfEligible: false };

function Extensions() {
  const [extensions, setExtensions] = useState<SubscriptionExtension[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [form, setForm] = useState<ExtensionForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [extensionsResult, subscriptionsResult, invoicesResult] = await Promise.all([
        apiRequest<SubscriptionExtension[]>({ url: '/extensions', params: { limit: 100 } }),
        apiRequest<Subscription[]>({ url: '/subscriptions', params: { limit: 100 } }),
        apiRequest<Invoice[]>({ url: '/invoices', params: { limit: 100 } }),
      ]);
      setExtensions(extensionsResult.data);
      setSubscriptions(subscriptionsResult.data);
      setInvoices(invoicesResult.data);
      setForm((current) => ({ ...current, subscriptionId: current.subscriptionId || subscriptionsResult.data[0]?.id || '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las prorrogas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function handleInvoiceChange(invoiceId: string) {
    const invoice = invoices.find((item) => item.id === invoiceId);
    setForm({
      ...form,
      invoiceId,
      subscriptionId: invoice?.subscriptionId ?? form.subscriptionId,
      originalDueDate: invoice?.dueDate ?? form.originalDueDate,
      extendedDueDate: invoice ? addDays(invoice.dueDate, 7) : form.extendedDueDate,
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await apiRequest<SubscriptionExtension>({
        url: '/extensions',
        method: 'POST',
        data: {
          subscriptionId: form.subscriptionId,
          invoiceId: emptyToUndefined(form.invoiceId),
          originalDueDate: emptyToUndefined(form.invoiceId) ? undefined : form.originalDueDate,
          extendedDueDate: form.extendedDueDate,
          reason: form.reason,
          reactivateIfEligible: form.reactivateIfEligible,
        },
      });
      setMessage('Prorroga creada correctamente');
      setForm({ ...emptyForm, subscriptionId: subscriptions[0]?.id ?? '' });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la prorroga');
    } finally {
      setSaving(false);
    }
  }

  async function cancelExtension(extension: SubscriptionExtension) {
    const reason = window.prompt('Razon de cancelacion');
    if (!reason) return;
    try {
      await apiRequest<SubscriptionExtension>({ url: `/extensions/${extension.id}/cancel`, method: 'POST', data: { reason } });
      setMessage('Prorroga cancelada correctamente');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar la prorroga');
    }
  }

  return (
    <div className="grid">
      <header className="page-header"><div><p className="eyebrow">Operaciones</p><h1>Prorrogas</h1><p className="muted">Extiende vencimientos sin modificar la fecha original.</p></div></header>
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <section className="card">
        <h2>Nueva prorroga</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>Factura opcional<select value={form.invoiceId} onChange={(event) => handleInvoiceChange(event.target.value)}><option value="">Sin factura</option>{invoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber} - vence {invoice.dueDate}</option>)}</select></label>
          <label>Suscripcion<select value={form.subscriptionId} onChange={(event) => setForm({ ...form, subscriptionId: event.target.value })} required>{subscriptions.map((subscription) => <option key={subscription.id} value={subscription.id}>{subscription.customerName} - {subscription.planName}</option>)}</select></label>
          <label>Fecha original<input value={form.originalDueDate} onChange={(event) => setForm({ ...form, originalDueDate: event.target.value })} type="date" required={!form.invoiceId} /></label>
          <label>Nueva fecha<input value={form.extendedDueDate} onChange={(event) => setForm({ ...form, extendedDueDate: event.target.value })} type="date" required /></label>
          <label>Razon<input value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} required /></label>
          <label>Reactivar si aplica<select value={String(form.reactivateIfEligible)} onChange={(event) => setForm({ ...form, reactivateIfEligible: event.target.value === 'true' })}><option value="false">No</option><option value="true">Si</option></select></label>
          <div className="actions"><button className="primary" disabled={saving || loading} type="submit">{saving ? 'Guardando...' : 'Crear prorroga'}</button></div>
        </form>
      </section>

      <section className="card">
        <h2>Listado</h2>
        {loading ? <p>Cargando...</p> : <div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Factura</th><th>Original</th><th>Extendida</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{extensions.map((extension) => <tr key={extension.id}><td>{extension.customerName}</td><td>{extension.invoiceNumber ?? '-'}</td><td>{extension.originalDueDate}</td><td>{extension.extendedDueDate}</td><td><span className="badge">{extension.status}</span></td><td><button className="danger" onClick={() => void cancelExtension(extension)} type="button">Cancelar</button></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}

export default Extensions;
