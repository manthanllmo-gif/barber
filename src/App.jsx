import { useState, useEffect } from 'react';
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
import Pitch from './pages/Pitch.jsx';
import Salons from './pages/Salons.jsx';
import ShopProducts from './pages/ShopProducts.jsx';
import Barbers from './pages/Barbers.jsx';
import BarberProfile from './pages/BarberProfile.jsx';
import Onboarding from './pages/Onboarding.jsx';
import { useAuth } from './contexts/AuthContext';
import Checkout from './pages/Checkout';
import ScrollToTop from './components/common/ScrollToTop';
import Preloader from './components/common/Preloader.jsx';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';

const AdminRoute = ({ children }) => {
  const { user, role, loading } = useAuth();
  if (loading && !role) return null;
  
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
  if (loading && !role) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  
  if (role === 'error') return <div style={{ padding: '20px', color: 'red' }}>⚠️ Connection error. Please refresh.</div>;
  if (!user || role !== 'shop_owner') return <Navigate to="/login" />;
  return children;
};

const FallbackRoute = () => {
  const { user, role, loading } = useAuth();
  if (loading && !role) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>;
  
  if (!user) return <Navigate to="/login" />;
  if (role === 'super_admin') return <Navigate to="/admin" />;
  if (role === 'shop_owner') return <Navigate to="/app" />;
  return <Navigate to="/" />;
};

function App() {
  const { loading, role } = useAuth();
  const [minLoadingDone, setMinLoadingDone] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(localStorage.getItem('onboarding_complete'));

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingDone(true);
    }, 2500); // 2.5 seconds minimum
    return () => clearTimeout(timer);
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('onboarding_complete', 'true');
    setOnboardingComplete('true');
  };

  const showLoader = loading || !minLoadingDone;

  return (
    <>
    <ThemeProvider>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        {showLoader && !role && <Preloader key="preloader" />}
      </AnimatePresence>
      
      <Routes>
        <Route path="/onboarding" element={<Onboarding onComplete={handleOnboardingComplete} />} />
        <Route path="/*" element={
          <MainLayout>
            <Routes>
              <Route path="/" element={!onboardingComplete ? <Navigate to="/onboarding" /> : <Home />} />
              <Route path="/salons" element={<Salons />} />
              <Route path="/shop" element={<ShopProducts />} />
              <Route path="/barbers" element={<Barbers />} />
              <Route path="/barbers/:id" element={<BarberProfile />} />
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
              <Route path="/pitch" element={<Pitch />} />
              <Route path="/dashboard" element={<Navigate to="/app" />} />
              <Route path="*" element={<FallbackRoute />} />
            </Routes>
          </MainLayout>
        } />
      </Routes>
    </ThemeProvider>
    </>
  );
}

export default App;
