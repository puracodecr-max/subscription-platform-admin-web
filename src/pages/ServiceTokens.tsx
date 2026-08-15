import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import type { Application, CreatedServiceToken, ServiceToken } from '../types';
import { emptyToUndefined } from '../utils/forms';

interface ServiceTokenForm {
  applicationId: string;
  name: string;
  scopesText: string;
  expiresAt: string;
}

const emptyForm: ServiceTokenForm = {
  applicationId: '',
  name: '',
  scopesText: 'entitlements.validate',
  expiresAt: '',
};

function scopesFromText(value: string) {
  return value
    .split(',')
    .map((scope) => scope.trim())
    .filter(Boolean);
}

function ServiceTokens() {
  const [serviceTokens, setServiceTokens] = useState<ServiceToken[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [form, setForm] = useState<ServiceTokenForm>(emptyForm);
  const [createdToken, setCreatedToken] = useState<CreatedServiceToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [tokensResult, applicationsResult] = await Promise.all([
        apiRequest<ServiceToken[]>({ url: '/service-tokens', params: { limit: 100 } }),
        apiRequest<Application[]>({ url: '/applications', params: { limit: 100, status: 'ACTIVE' } }),
      ]);
      setServiceTokens(tokensResult.data);
      setApplications(applicationsResult.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los tokens');
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
    setCreatedToken(null);

    try {
      const result = await apiRequest<CreatedServiceToken>({
        url: '/service-tokens',
        method: 'POST',
        data: {
          applicationId: emptyToUndefined(form.applicationId),
          name: form.name.trim(),
          scopes: scopesFromText(form.scopesText),
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        },
      });

      setCreatedToken(result.data);
      setMessage('Token creado correctamente. Copialo ahora; no podra recuperarse despues.');
      setForm(emptyForm);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el token');
    } finally {
      setSaving(false);
    }
  }

  async function revokeToken(serviceToken: ServiceToken) {
    const reason = window.prompt('Razon de revocacion');
    if (reason === null) return;

    setError('');
    setMessage('');
    try {
      await apiRequest<ServiceToken>({
        url: `/service-tokens/${serviceToken.id}/revoke`,
        method: 'POST',
        data: { reason: emptyToUndefined(reason) },
      });
      setMessage('Token revocado correctamente');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo revocar el token');
    }
  }

  async function copyCreatedToken() {
    if (!createdToken) return;
    await navigator.clipboard.writeText(createdToken.token);
    setMessage('Token copiado al portapapeles');
  }

  return (
    <div className="grid">
      <header className="page-header">
        <div>
          <p className="eyebrow">Seguridad</p>
          <h1>Service Tokens</h1>
          <p className="muted">Crea credenciales para que el CRM y otros backends validen acceso.</p>
        </div>
      </header>

      {error && <div className="alert error">{error}</div>}
      {message && <div className="alert success">{message}</div>}

      {createdToken && (
        <section className="card token-card">
          <h2>Token generado</h2>
          <p className="muted">Este valor solo aparece una vez. Guardalo en el `.env` del backend que lo usara.</p>
          <pre>{createdToken.token}</pre>
          <div className="actions">
            <button className="primary" onClick={() => void copyCreatedToken()} type="button">Copiar token</button>
            <button className="ghost" onClick={() => setCreatedToken(null)} type="button">Ocultar</button>
          </div>
        </section>
      )}

      <section className="card">
        <h2>Nuevo token</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Aplicacion
            <select value={form.applicationId} onChange={(event) => setForm({ ...form, applicationId: event.target.value })}>
              <option value="">Global</option>
              {applications.map((application) => (
                <option key={application.id} value={application.id}>{application.code} - {application.name}</option>
              ))}
            </select>
          </label>
          <label>
            Nombre
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="CRM production token" required />
          </label>
          <label>
            Scopes separados por coma
            <input value={form.scopesText} onChange={(event) => setForm({ ...form, scopesText: event.target.value })} required />
          </label>
          <label>
            Expira en
            <input value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} type="datetime-local" />
          </label>
          <div className="actions">
            <button className="primary" disabled={saving} type="submit">{saving ? 'Creando...' : 'Crear token'}</button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>Tokens existentes</h2>
        {loading ? <p>Cargando...</p> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Aplicacion</th>
                  <th>Prefix</th>
                  <th>Scopes</th>
                  <th>Estado</th>
                  <th>Ultimo uso</th>
                  <th>Expira</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {serviceTokens.map((serviceToken) => (
                  <tr key={serviceToken.id}>
                    <td>{serviceToken.name}</td>
                    <td>{serviceToken.applicationCode ?? 'Global'}</td>
                    <td>{serviceToken.tokenPrefix}</td>
                    <td>{serviceToken.scopes.join(', ')}</td>
                    <td><span className="badge">{serviceToken.status}</span></td>
                    <td>{serviceToken.lastUsedAt ?? '-'}</td>
                    <td>{serviceToken.expiresAt ?? '-'}</td>
                    <td>
                      {serviceToken.status === 'ACTIVE' ? (
                        <button className="danger" onClick={() => void revokeToken(serviceToken)} type="button">Revocar</button>
                      ) : '-'}
                    </td>
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

export default ServiceTokens;
