import { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import type { Customer } from '../types';
import { emptyToUndefined } from '../utils/forms';

interface CustomerForm {
  externalCode: string;
  legalName: string;
  displayName: string;
  taxId: string;
  email: string;
  phone: string;
  status: string;
  globalSuspension: boolean;
  globalSuspensionReason: string;
}

const emptyForm: CustomerForm = {
  externalCode: '',
  legalName: '',
  displayName: '',
  taxId: '',
  email: '',
  phone: '',
  status: 'ACTIVE',
  globalSuspension: false,
  globalSuspensionReason: '',
};

function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadCustomers() {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest<Customer[]>({ url: '/customers', params: { limit: 100 } });
      setCustomers(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los clientes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCustomers();
  }, []);

  function updateField<K extends keyof CustomerForm>(key: K, value: CustomerForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function editCustomer(customer: Customer) {
    setEditingId(customer.id);
    setForm({
      externalCode: customer.externalCode ?? '',
      legalName: customer.legalName,
      displayName: customer.displayName,
      taxId: customer.taxId ?? '',
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      status: customer.status,
      globalSuspension: customer.globalSuspension,
      globalSuspensionReason: customer.globalSuspensionReason ?? '',
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    const payload = {
      externalCode: emptyToUndefined(form.externalCode),
      legalName: form.legalName.trim(),
      displayName: form.displayName.trim(),
      taxId: emptyToUndefined(form.taxId),
      email: emptyToUndefined(form.email),
      phone: emptyToUndefined(form.phone),
      status: form.status,
      globalSuspension: form.globalSuspension,
      globalSuspensionReason: emptyToUndefined(form.globalSuspensionReason),
    };

    try {
      if (editingId) {
        await apiRequest<Customer>({ url: `/customers/${editingId}`, method: 'PATCH', data: payload });
        setMessage('Cliente actualizado correctamente');
      } else {
        await apiRequest<Customer>({ url: '/customers', method: 'POST', data: payload });
        setMessage('Cliente creado correctamente');
      }
      resetForm();
      await loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el cliente');
    } finally {
      setSaving(false);
    }
  }


  return (
    <div className="grid">
      <header className="page-header">
        <div>
          <p className="eyebrow">Comercial</p>
          <h1>Clientes</h1>
          <p className="muted">Crea clientes y controla suspension global.</p>
        </div>
      </header>

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <section className="card">
        <h2>{editingId ? 'Editar cliente' : 'Nuevo cliente'}</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>Codigo externo<input value={form.externalCode} onChange={(event) => updateField('externalCode', event.target.value)} /></label>
          <label>Razon social<input value={form.legalName} onChange={(event) => updateField('legalName', event.target.value)} required /></label>
          <label>Nombre visible<input value={form.displayName} onChange={(event) => updateField('displayName', event.target.value)} required /></label>
          <label>Identificacion fiscal<input value={form.taxId} onChange={(event) => updateField('taxId', event.target.value)} /></label>
          <label>Email<input value={form.email} onChange={(event) => updateField('email', event.target.value)} type="email" /></label>
          <label>Telefono<input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} /></label>
          <label>Estado<select value={form.status} onChange={(event) => updateField('status', event.target.value)}><option>ACTIVE</option><option>INACTIVE</option></select></label>
          <label>Suspension global<select value={String(form.globalSuspension)} onChange={(event) => updateField('globalSuspension', event.target.value === 'true')}><option value="false">No</option><option value="true">Si</option></select></label>
          <label>Razon suspension<input value={form.globalSuspensionReason} onChange={(event) => updateField('globalSuspensionReason', event.target.value)} /></label>
          <div className="actions">
            <button className="primary" disabled={saving} type="submit">{saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear cliente'}</button>
            {editingId && <button className="ghost" onClick={resetForm} type="button">Cancelar</button>}
          </div>
        </form>
      </section>

      <section className="card">
        <h2>Listado</h2>
        {loading ? <p>Cargando...</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Cliente</th><th>Email</th><th>Estado</th><th>Suspension</th><th>Creado</th><th>Acciones</th></tr></thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td><strong>{customer.displayName}</strong><br /><span className="muted">{customer.legalName}</span></td>
                    <td>{customer.email ?? '-'}</td>
                    <td><span className="badge">{customer.status}</span></td>
                    <td>{customer.globalSuspension ? customer.globalSuspensionReason ?? 'Suspendido' : 'No'}</td>
                    <td>{customer.createdAt}</td>
                    <td><button className="secondary" onClick={() => editCustomer(customer)} type="button">Editar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default Customers;
