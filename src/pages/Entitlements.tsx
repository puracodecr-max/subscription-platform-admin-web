import { useState } from 'react';
import { apiRequest } from '../services/api';
import type { EntitlementResult } from '../types';
import { emptyToUndefined } from '../utils/forms';

function Entitlements() {
  const [serviceToken, setServiceToken] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [applicationCode, setApplicationCode] = useState('');
  const [requestedModule, setRequestedModule] = useState('');
  const [result, setResult] = useState<EntitlementResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleValidate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await apiRequest<EntitlementResult>({
        url: '/entitlements/validate',
        method: 'POST',
        headers: { Authorization: `Bearer ${serviceToken}` },
        data: {
          customerId,
          applicationCode,
          requestedModule: emptyToUndefined(requestedModule),
        },
      });
      setResult(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al validar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid">
      <header className="page-header"><div><p className="eyebrow">Integracion</p><h1>Validacion de acceso</h1><p className="muted">Prueba el endpoint de entitlements usando un service token.</p></div></header>
      <section className="card">
        <div className="form-grid">
        <label>Service token
          <input
            placeholder="sat_..."
            value={serviceToken}
            onChange={(e) => setServiceToken(e.target.value)}
            type="password"
          />
        </label>
        <label>Customer ID
        <input
          placeholder="Customer ID"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
        />
        </label>
        <label>Application Code
        <input
          placeholder="Application Code"
          value={applicationCode}
          onChange={(e) => setApplicationCode(e.target.value)}
        />
        </label>
        <label>Modulo opcional
          <input placeholder="operations" value={requestedModule} onChange={(e) => setRequestedModule(e.target.value)} />
        </label>
        <div className="actions">
        <button className="primary" onClick={handleValidate} disabled={loading || !serviceToken || !customerId || !applicationCode} type="button">
          {loading ? 'Validando...' : 'Validar'}
        </button>
        </div>
      </div>
      </section>
      {error && <div className="alert error">{error}</div>}
      {result && (
        <section className="card">
          <h3>Resultado: {result.allowed ? 'Permitido' : 'Denegado'}</h3>
          <p><strong>Cliente:</strong> {result.customerId}</p>
          <p><strong>Aplicacion:</strong> {result.applicationCode}</p>
          <p><strong>Estado Suscripcion:</strong> {result.subscriptionStatus}</p>
          <p><strong>Razon:</strong> {result.reason ?? 'N/A'}</p>
          <p><strong>Dias Morosos:</strong> {result.daysOverdue}</p>
          <p><strong>Modulos Permitidos:</strong> {result.allowedModules.join(', ') || 'Ninguno'}</p>
          <p><strong>Modulos Bloqueados:</strong> {result.blockedModules.join(', ') || 'Ninguno'}</p>
        </section>
      )}
    </div>
  );
}

export default Entitlements;
