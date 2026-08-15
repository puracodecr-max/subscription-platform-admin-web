import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Applications from './pages/Applications';
import Plans from './pages/Plans';
import Subscriptions from './pages/Subscriptions';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Penalties from './pages/Penalties';
import Extensions from './pages/Extensions';
import Entitlements from './pages/Entitlements';
import ServiceTokens from './pages/ServiceTokens';
import Login from './pages/Login';

function RequireAuth() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Layout /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="applications" element={<Applications />} />
          <Route path="plans" element={<Plans />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="payments" element={<Payments />} />
          <Route path="penalties" element={<Penalties />} />
          <Route path="extensions" element={<Extensions />} />
          <Route path="entitlements" element={<Entitlements />} />
          <Route path="service-tokens" element={<ServiceTokens />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
