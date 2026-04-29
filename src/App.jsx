import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout.jsx';
import Home from './pages/Home.jsx';
import Queue from './pages/Queue.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Profile from './pages/Profile.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import PublicDisplay from './pages/PublicDisplay.jsx';
import TimerDemo from './pages/TimerDemo.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Checkout from './pages/Checkout';

const AdminRoute = ({ children }) => {
  const { user, role, loading } = useAuth();
  if (loading) return null;
  if (role === 'error') return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2 style={{ color: '#c62828' }}>⚠️ Connection issue</h2>
      <p>We're having trouble reaching the database. Please try refreshing.</p>
      <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', marginTop: '10px', cursor: 'pointer' }}>Refresh Now</button>
    </div>
  );
  if (!user || role !== 'super_admin') return <Navigate to="/login" />;
  return children;
};

const ShopRoute = ({ children }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (role === 'error') return <div style={{ padding: '20px', color: 'red' }}>⚠️ Connection error. Please refresh.</div>;
  if (!user || role !== 'shop_owner') return <Navigate to="/login" />;
  return children;
};

const FallbackRoute = () => {
  const { user, role, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role === 'super_admin') return <Navigate to="/admin" />;
  if (role === 'shop_owner') return <Navigate to="/app" />;
  return <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/app" element={
            <ShopRoute>
              <Dashboard />
            </ShopRoute>
          } />
          
          <Route path="/display/:shopId" element={<PublicDisplay />} />
          <Route path="/timer-demo" element={<TimerDemo />} />

          {/* Legacy path for back-compat or redirect mapping */}
          <Route path="/dashboard" element={<Navigate to="/app" />} />

          <Route path="*" element={<FallbackRoute />} />
        </Routes>
      </MainLayout>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
