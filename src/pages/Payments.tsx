import { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import type { Currency, Customer, Payment, PaymentMethod } from '../types';
import { emptyToUndefined } from '../utils/forms';

interface PaymentForm {
  customerId: string;
  currencyId: string;
  paymentMethodId: string;
  amount: string;
  externalReference: string;
  paidAt: string;
  notes: string;
}

const emptyForm: PaymentForm = { customerId: '', currencyId: '', paymentMethodId: '', amount: '', externalReference: '', paidAt: '', notes: '' };

function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [form, setForm] = useState<PaymentForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [paymentsResult, customersResult, currenciesResult, methodsResult] = await Promise.all([
        apiRequest<Payment[]>({ url: '/payments', params: { limit: 100 } }),
        apiRequest<Customer[]>({ url: '/customers', params: { limit: 100, status: 'ACTIVE' } }),
        apiRequest<Currency[]>({ url: '/catalogs/currencies' }),
        apiRequest<PaymentMethod[]>({ url: '/catalogs/payment-methods' }),
      ]);
      setPayments(paymentsResult.data);
      setCustomers(customersResult.data);
      setCurrencies(currenciesResult.data);
      setMethods(methodsResult.data);
      setForm((current) => ({
        ...current,
        customerId: current.customerId || customersResult.data[0]?.id || '',
        currencyId: current.currencyId || currenciesResult.data[0]?.id || '',
        paymentMethodId: current.paymentMethodId || methodsResult.data[0]?.id || '',
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los pagos');
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
      await apiRequest<Payment>({
        url: '/payments',
        method: 'POST',
        data: {
          customerId: form.customerId,
          currencyId: form.currencyId,
          paymentMethodId: emptyToUndefined(form.paymentMethodId),
          amount: form.amount,
          externalReference: emptyToUndefined(form.externalReference),
          paidAt: form.paidAt ? new Date(form.paidAt).toISOString() : undefined,
          notes: emptyToUndefined(form.notes),
        },
      });
      setMessage('Pago registrado como pendiente');
      setForm({ ...emptyForm, customerId: customers[0]?.id ?? '', currencyId: currencies[0]?.id ?? '', paymentMethodId: methods[0]?.id ?? '' });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el pago');
    } finally {
      setSaving(false);
    }
  }

  async function runPaymentAction(payment: Payment, action: 'confirm' | 'reject' | 'reverse') {
    const reason = action === 'confirm' ? '' : window.prompt('Razon de la accion');
    if (reason === null) return;

    try {
      const body = action === 'confirm' ? {} : { reason };
      await apiRequest<Payment>({ url: `/payments/${payment.id}/${action}`, method: 'POST', data: body });
      setMessage(`Pago actualizado: ${action}`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el pago');
    }
  }

  return (
    <div className="grid">
      <header className="page-header"><div><p className="eyebrow">Finanzas</p><h1>Pagos</h1><p className="muted">Registra pagos y confirma aplicacion contra facturas.</p></div></header>
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <section className="card">
        <h2>Registrar pago</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>Cliente<select value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value })} required>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.displayName}</option>)}</select></label>
          <label>Monto<input value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="100.00" required /></label>
          <label>Moneda<select value={form.currencyId} onChange={(event) => setForm({ ...form, currencyId: event.target.value })} required>{currencies.map((currency) => <option key={currency.id} value={currency.id}>{currency.code}</option>)}</select></label>
          <label>Metodo<select value={form.paymentMethodId} onChange={(event) => setForm({ ...form, paymentMethodId: event.target.value })}><option value="">Sin metodo</option>{methods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}</select></label>
          <label>Referencia externa<input value={form.externalReference} onChange={(event) => setForm({ ...form, externalReference: event.target.value })} /></label>
          <label>Fecha pago<input value={form.paidAt} onChange={(event) => setForm({ ...form, paidAt: event.target.value })} type="datetime-local" /></label>
          <label>Notas<input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
          <div className="actions"><button className="primary" disabled={saving || loading} type="submit">{saving ? 'Guardando...' : 'Registrar pago'}</button></div>
        </form>
      </section>

      <section className="card">
        <h2>Listado</h2>
        {loading ? <p>Cargando...</p> : <div className="table-wrap"><table><thead><tr><th>Cliente</th><th>Monto</th><th>Metodo</th><th>Estado</th><th>Recibido</th><th>Acciones</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id}><td>{payment.customerName}</td><td>{payment.currencyCode} {payment.amount}</td><td>{payment.paymentMethodName ?? '-'}</td><td><span className="badge">{payment.status}</span></td><td>{payment.receivedAt}</td><td><div className="actions"><button className="secondary" onClick={() => void runPaymentAction(payment, 'confirm')} type="button">Confirmar</button><button className="danger" onClick={() => void runPaymentAction(payment, 'reject')} type="button">Rechazar</button><button className="ghost" onClick={() => void runPaymentAction(payment, 'reverse')} type="button">Reversar</button></div></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}

export default Payments;
