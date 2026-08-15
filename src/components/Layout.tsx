import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/customers', label: 'Clientes' },
  { to: '/applications', label: 'Aplicaciones' },
  { to: '/plans', label: 'Planes' },
  { to: '/subscriptions', label: 'Suscripciones' },
  { to: '/invoices', label: 'Facturas' },
  { to: '/payments', label: 'Pagos' },
  { to: '/penalties', label: 'Multas' },
  { to: '/extensions', label: 'Prorrogas' },
  { to: '/entitlements', label: 'Accesos' },
  { to: '/service-tokens', label: 'Service Tokens' },
];

function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>Suscripciones</h2>
        </div>
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span>{user?.fullName ?? user?.email}</span>
          <button className="ghost" onClick={logout} type="button">Salir</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
