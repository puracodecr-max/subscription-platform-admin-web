import { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

interface Stats {
  totalCustomers: number;
  totalApplications: number;
  totalPlans: number;
  activeSubscriptions: number;
  totalInvoices: number;
  pendingPayments: number;
}

function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      setError('');
      try {
        const [customers, applications, plans, subscriptions, invoices, payments] = await Promise.all([
          apiRequest<unknown[]>({ url: '/customers', params: { limit: 1 } }),
          apiRequest<unknown[]>({ url: '/applications', params: { limit: 1 } }),
          apiRequest<unknown[]>({ url: '/plans', params: { limit: 1 } }),
          apiRequest<{ status: string }[]>({ url: '/subscriptions', params: { limit: 100 } }),
          apiRequest<unknown[]>({ url: '/invoices', params: { limit: 1 } }),
          apiRequest<{ status: string }[]>({ url: '/payments', params: { limit: 100 } }),
        ]);

        setStats({
          totalCustomers: customers.pagination?.total ?? customers.data.length,
          totalApplications: applications.pagination?.total ?? applications.data.length,
          totalPlans: plans.pagination?.total ?? plans.data.length,
          activeSubscriptions: subscriptions.data.filter((subscription) => subscription.status === 'ACTIVE').length,
          totalInvoices: invoices.pagination?.total ?? invoices.data.length,
          pendingPayments: payments.data.filter((payment) => payment.status === 'PENDING').length,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el dashboard');
      } finally {
        setLoading(false);
      }
    }

    void loadStats();
  }, []);

  return (
    <div>
      <header className="page-header">
        <div>
          <p className="eyebrow">Resumen</p>
          <h1>Dashboard</h1>
          <p className="muted">Estado general de la plataforma de suscripciones.</p>
        </div>
      </header>

      {error && <div className="alert error">{error}</div>}
      {loading && <div className="card">Cargando...</div>}

      {!loading && stats && (
        <div className="stats-grid">
          <div className="card">
            <h3>Clientes</h3>
            <p className="stat-value">{stats.totalCustomers}</p>
          </div>
          <div className="card">
            <h3>Aplicaciones</h3>
            <p className="stat-value">{stats.totalApplications}</p>
          </div>
          <div className="card">
            <h3>Planes</h3>
            <p className="stat-value">{stats.totalPlans}</p>
          </div>
          <div className="card">
            <h3>Suscripciones activas</h3>
            <p className="stat-value">{stats.activeSubscriptions}</p>
          </div>
          <div className="card">
            <h3>Facturas</h3>
            <p className="stat-value">{stats.totalInvoices}</p>
          </div>
          <div className="card">
            <h3>Pagos pendientes</h3>
            <p className="stat-value">{stats.pendingPayments}</p>
          </div>
        </div>
      )}
      </div>
  );
}

export default Dashboard;
