import { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import type { Invoice, Penalty, PenaltyRule } from '../types';

interface PenaltyForm {
  invoiceId: string;
  penaltyRuleId: string;
  reason: string;
}

const emptyForm: PenaltyForm = { invoiceId: '', penaltyRuleId: '', reason: '' };

function Penalties() {
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [rules, setRules] = useState<PenaltyRule[]>([]);
  const [form, setForm] = useState<PenaltyForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [penaltiesResult, invoicesResult, rulesResult] = await Promise.all([
        apiRequest<Penalty[]>({ url: '/penalties', params: { limit: 100 } }),
        apiRequest<Invoice[]>({ url: '/invoices', params: { limit: 100 } }),
        apiRequest<PenaltyRule[]>({ url: '/penalties/rules', params: { limit: 100, status: 'ACTIVE' } }),
      ]);
      setPenalties(penaltiesResult.data);
      setInvoices(invoicesResult.data);
      setRules(rulesResult.data);
      setForm((current) => ({ ...current, invoiceId: current.invoiceId || invoicesResult.data[0]?.id || '', penaltyRuleId: current.penaltyRuleId || rulesResult.data[0]?.id || '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las multas');
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
      await apiRequest<Penalty>({ url: '/penalties/apply', method: 'POST', data: { invoiceId: form.invoiceId, penaltyRuleId: form.penaltyRuleId, reason: form.reason || undefined } });
      setMessage('Multa aplicada correctamente');
      setForm({ ...emptyForm, invoiceId: invoices[0]?.id ?? '', penaltyRuleId: rules[0]?.id ?? '' });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo aplicar la multa');
    } finally {
      setSaving(false);
    }
  }

  async function waivePenalty(penalty: Penalty) {
    const reason = window.prompt('Razon de condonacion');
    if (!reason) return;
    try {
      await apiRequest<Penalty>({ url: `/penalties/${penalty.id}/waive`, method: 'POST', data: { reason } });
      setMessage('Multa condonada correctamente');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo condonar la multa');
    }
  }

  return (
    <div className="grid">
      <header className="page-header"><div><p className="eyebrow">Finanzas</p><h1>Multas</h1><p className="muted">Aplica cargos por mora o condona multas autorizadas.</p></div></header>
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <section className="card">
        <h2>Aplicar multa</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>Factura<select value={form.invoiceId} onChange={(event) => setForm({ ...form, invoiceId: event.target.value })} required>{invoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.invoiceNumber} - {invoice.customerName} ({invoice.balanceAmount})</option>)}</select></label>
          <label>Regla<select value={form.penaltyRuleId} onChange={(event) => setForm({ ...form, penaltyRuleId: event.target.value })} required>{rules.map((rule) => <option key={rule.id} value={rule.id}>{rule.name} ({rule.penaltyType} {rule.penaltyValue})</option>)}</select></label>
          <label>Razon<input value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></label>
          <div className="actions"><button className="primary" disabled={saving || loading} type="submit">{saving ? 'Aplicando...' : 'Aplicar multa'}</button></div>
        </form>
      </section>

      <section className="card">
        <h2>Listado</h2>
        {loading ? <p>Cargando...</p> : <div className="table-wrap"><table><thead><tr><th>Factura</th><th>Cliente</th><th>Regla</th><th>Monto</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{penalties.map((penalty) => <tr key={penalty.id}><td>{penalty.invoiceNumber}</td><td>{penalty.customerName}</td><td>{penalty.penaltyRuleName}</td><td>{penalty.amount}</td><td><span className="badge">{penalty.status}</span></td><td><button className="secondary" onClick={() => void waivePenalty(penalty)} type="button">Condonar</button></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}

export default Penalties;
