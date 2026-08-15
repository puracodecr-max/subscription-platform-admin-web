import { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import type { Invoice, Subscription } from '../types';
import { addDays, today } from '../utils/forms';

interface InvoiceForm {
  subscriptionId: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  issueDate: string;
  dueDate: string;
}

const currentDate = today();
const emptyForm: InvoiceForm = {
  subscriptionId: '',
  billingPeriodStart: currentDate,
  billingPeriodEnd: addDays(currentDate, 30),
  issueDate: currentDate,
  dueDate: addDays(currentDate, 7),
};

function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [form, setForm] = useState<InvoiceForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [invoicesResult, subscriptionsResult] = await Promise.all([
        apiRequest<Invoice[]>({ url: '/invoices', params: { limit: 100 } }),
        apiRequest<Subscription[]>({ url: '/subscriptions', params: { limit: 100 } }),
      ]);
      setInvoices(invoicesResult.data);
      setSubscriptions(subscriptionsResult.data);
      setForm((current) => ({ ...current, subscriptionId: current.subscriptionId || subscriptionsResult.data[0]?.id || '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las facturas');
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
      await apiRequest<Invoice>({ url: '/invoices/generate', method: 'POST', data: form });
      setMessage('Factura generada correctamente');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar la factura');
    } finally {
      setSaving(false);
    }
  }

  async function cancelInvoice(invoice: Invoice) {
    const reason = window.prompt('Razon de cancelacion');
    if (!reason) return;
    try {
      await apiRequest<Invoice>({ url: `/invoices/${invoice.id}/cancel`, method: 'POST', data: { reason } });
      setMessage('Factura cancelada correctamente');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar la factura');
    }
  }

  async function addAdjustment(invoice: Invoice) {
    const type = window.prompt('Tipo de ajuste: CHARGE o CREDIT', 'CHARGE');
    const description = window.prompt('Descripcion del ajuste');
    const amount = window.prompt('Monto del ajuste');
    if (!type || !description || !amount) return;
    try {
      await apiRequest<Invoice>({ url: `/invoices/${invoice.id}/adjustments`, method: 'POST', data: { type: type.toUpperCase(), description, amount } });
      setMessage('Ajuste aplicado correctamente');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo aplicar el ajuste');
    }
  }

  return (
    <div className="grid">
      <header className="page-header"><div><p className="eyebrow">Finanzas</p><h1>Facturas</h1><p className="muted">Genera facturas, ajustes y cancelaciones.</p></div></header>
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <section className="card">
        <h2>Generar factura</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>Suscripcion<select value={form.subscriptionId} onChange={(event) => setForm({ ...form, subscriptionId: event.target.value })} required>{subscriptions.map((subscription) => <option key={subscription.id} value={subscription.id}>{subscription.customerName} - {subscription.planName}</option>)}</select></label>
          <label>Periodo inicio<input value={form.billingPeriodStart} onChange={(event) => setForm({ ...form, billingPeriodStart: event.target.value })} type="date" required /></label>
          <label>Periodo fin<input value={form.billingPeriodEnd} onChange={(event) => setForm({ ...form, billingPeriodEnd: event.target.value })} type="date" required /></label>
          <label>Emision<input value={form.issueDate} onChange={(event) => setForm({ ...form, issueDate: event.target.value })} type="date" required /></label>
          <label>Vencimiento<input value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} type="date" required /></label>
          <div className="actions"><button className="primary" disabled={saving || loading} type="submit">{saving ? 'Generando...' : 'Generar factura'}</button></div>
        </form>
      </section>

      <section className="card">
        <h2>Listado</h2>
        {loading ? <p>Cargando...</p> : <div className="table-wrap"><table><thead><tr><th>Factura</th><th>Cliente</th><th>Total</th><th>Balance</th><th>Estado</th><th>Vence</th><th>Acciones</th></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.id}><td>{invoice.invoiceNumber}</td><td>{invoice.customerName}</td><td>{invoice.currencyCode} {invoice.totalAmount}</td><td>{invoice.balanceAmount}</td><td><span className="badge">{invoice.status}</span></td><td>{invoice.dueDate}</td><td><div className="actions"><button className="secondary" onClick={() => void addAdjustment(invoice)} type="button">Ajuste</button><button className="danger" onClick={() => void cancelInvoice(invoice)} type="button">Cancelar</button></div></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}

export default Invoices;
