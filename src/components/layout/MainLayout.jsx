import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShopProvider, useShop } from '../../contexts/ShopContext';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const { user, role, logout } = useAuth();
  const { shops, currentShopId } = useShop();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isOwner = role === 'shop_owner';
  const isAdmin = role === 'super_admin';
  const isHome = location.pathname === '/';

  const headerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: scrolled ? '12px 5%' : '20px 5%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    background: scrolled ? 'rgba(15, 15, 20, 0.85)' : (isHome ? 'transparent' : 'rgba(15, 15, 20, 0.4)'),
    backdropFilter: scrolled ? 'blur(12px)' : 'none',
    borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
  };

  const linkStyle = {
    color: 'white',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: '500',
    transition: 'color 0.2s',
    opacity: 0.8
  };

  const buttonStyle = {
    padding: '10px 24px',
    background: 'var(--primary)',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontWeight: '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.2s'
  };

  return (
    <header style={headerStyle}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white', letterSpacing: '1px' }}>
          VELOURA<span style={{ color: 'var(--primary)' }}>.</span>
        </div>
      </Link>

      <nav style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
        <Link to="/" style={linkStyle}>Home</Link>
        
        {user && !isOwner && !isAdmin && (
          <Link to="/profile" style={linkStyle}>My Tokens</Link>
        )}

        {(isOwner || isAdmin) && (
          <Link to="/dashboard" style={{ ...linkStyle, color: 'var(--primary)', fontWeight: '700', opacity: 1 }}>
            Admin Center
          </Link>
        )}

        {isHome && (
          <>
            <a href="#shops" style={linkStyle}>Locations</a>
            <a href="#products" style={linkStyle}>Shop</a>
          </>
        )}

        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 5px' }}></div>

        {!user ? (
          <button 
            onClick={() => navigate('/login')}
            style={buttonStyle}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            Login
          </button>
        ) : (
          <button 
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            style={{ ...buttonStyle, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Logout
          </button>
        )}
      </nav>
    </header>
  );
};

const MainLayout = ({ children }) => {
  const location = useLocation();
  const isDisplayPage = location.pathname.startsWith('/display');
  const isHome = location.pathname === '/';

  if (isDisplayPage) {
    return (
      <ShopProvider>
        <div style={{ height: '100vh', width: '100vw' }}>
          {children}
        </div>
      </ShopProvider>
    );
  }

  return (
    <ShopProvider>
      <div className="main-layout" style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        background: 'var(--background)'
      }}>
        <Header />

        <main style={{ 
          flex: 1, 
          paddingTop: isHome ? 0 : '80px', // No padding on Home so Hero can be full height
          width: '100%'
        }}>
          {isHome ? (
            children
          ) : (
            <div style={{ 
              maxWidth: '1400px', 
              margin: '0 auto', 
              padding: '2rem 5%',
              width: '100%'
            }}>
              {children}
            </div>
          )}
        </main>
      </div>
    </ShopProvider>
  );
};

export default MainLayout;
