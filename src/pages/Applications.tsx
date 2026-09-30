import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import type { Application } from '../types';
import { emptyToUndefined } from '../utils/forms';

interface ApplicationForm {
  code: string;
  name: string;
  description: string;
  modulesText: string;
  status: string;
}

const emptyForm: ApplicationForm = { code: '', name: '', description: '', modulesText: '', status: 'ACTIVE' };

function modulesFromText(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((code) => code.toLowerCase())
    .map((code) => ({ code, name: code }));
}

function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [form, setForm] = useState<ApplicationForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadApplications() {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest<Application[]>({ url: '/applications', params: { limit: 100 } });
      setApplications(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las aplicaciones');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadApplications();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function editApplication(application: Application) {
    setEditingId(application.id);
    setForm({
      code: application.code,
      name: application.name,
      description: application.description ?? '',
      modulesText: application.modules.map((module) => String(module.code ?? module.name ?? '')).filter(Boolean).join(', '),
      status: application.status,
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: emptyToUndefined(form.description),
      modules: modulesFromText(form.modulesText),
      status: form.status,
    };

    try {
      if (editingId) {
        await apiRequest<Application>({ url: `/applications/${editingId}`, method: 'PATCH', data: payload });
        setMessage('Aplicacion actualizada correctamente');
      } else {
        await apiRequest<Application>({ url: '/applications', method: 'POST', data: payload });
        setMessage('Aplicacion creada correctamente');
      }
      resetForm();
      await loadApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la aplicacion');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid">
      <header className="page-header"><div><p className="eyebrow">Catalogo</p><h1>Aplicaciones</h1><p className="muted">Define los productos que se controlan por suscripcion.</p></div></header>
      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <section className="card">
        <h2>{editingId ? 'Editar aplicacion' : 'Nueva aplicacion'}</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>Codigo<input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="CRM" required /></label>
          <label>Nombre<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
          <label>Estado<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>ACTIVE</option><option>INACTIVE</option></select></label>
          <label>Descripcion<input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <label>Modulos separados por coma<input value={form.modulesText} onChange={(event) => setForm({ ...form, modulesText: event.target.value })} placeholder="dashboard, invoices, payments" /></label>
          <div className="actions"><button className="primary" disabled={saving} type="submit">{saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear aplicacion'}</button>{editingId && <button className="ghost" onClick={resetForm} type="button">Cancelar</button>}</div>
        </form>
      </section>

      <section className="card">
        <h2>Listado</h2>
        {loading ? <p>Cargando...</p> : <div className="table-wrap"><table><thead><tr><th>Codigo</th><th>Nombre</th><th>Modulos</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{applications.map((application) => <tr key={application.id}><td>{application.code}</td><td>{application.name}</td><td>{application.modules.length}</td><td><span className="badge">{application.status}</span></td><td><button className="secondary" onClick={() => editApplication(application)} type="button">Editar</button></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  );
}

export default Applications;
