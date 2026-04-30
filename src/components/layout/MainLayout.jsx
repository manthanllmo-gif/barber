import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ShopProvider, useShop } from '../../contexts/ShopContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import CartDrawer from '../cart/CartDrawer';

const Header = ({ onOpenCart }) => {
  const { user, role, logout } = useAuth();
  const { shops, currentShopId } = useShop();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const activeDashboardTab = searchParams.get('tab') || 'queue';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isOwner = role === 'shop_owner';
  const isAdmin = role === 'super_admin';
  const isHome = location.pathname === '/';
  const isDashboard = location.pathname === '/dashboard';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

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

  const mobileLinkStyle = {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1.1rem',
    fontWeight: '600',
    padding: '12px 16px',
    borderRadius: '12px',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'all 0.3s ease'
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

  const dashboardTabs = [
    { id: 'queue', label: 'Queue', icon: '📋' },
    { id: 'services', label: 'Services', icon: '🛠️' },
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'orders', label: 'Orders', icon: '🛒' },
    { id: 'staff', label: 'Staff', icon: '👥' },
    { id: 'analytics', label: 'Analytics', icon: '📊' }
  ];

  const navLinks = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {!isOwner && !isAdmin && (
        <Link 
          to="/" 
          style={{ ...mobileLinkStyle, background: location.pathname === '/' ? 'rgba(255,255,255,0.05)' : 'transparent' }} 
          onClick={() => setIsMenuOpen(false)}
        >
          Public Home
        </Link>
      )}
      
      {user && !isOwner && !isAdmin && (
        <Link 
          to="/profile" 
          style={{ ...mobileLinkStyle, background: location.pathname === '/profile' ? 'rgba(255,255,255,0.05)' : 'transparent' }} 
          onClick={() => setIsMenuOpen(false)}
        >
          My Tokens
        </Link>
      )}

      {(isOwner || isAdmin) && (
        <Link 
          to="/dashboard" 
          style={{ 
            ...mobileLinkStyle, 
            color: 'var(--primary)', 
            background: isDashboard ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
            fontWeight: '700'
          }} 
          onClick={() => setIsMenuOpen(false)}
        >
          Admin Center
        </Link>
      )}

      {isDashboard && (
        <div style={{ marginTop: '10px', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', padding: '0 16px 10px', letterSpacing: '1px' }}>Dashboard</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {dashboardTabs.map(tab => (
              <Link 
                key={tab.id} 
                to={`/dashboard?tab=${tab.id}`} 
                onClick={() => setIsMenuOpen(false)}
                style={{ 
                  ...mobileLinkStyle, 
                  fontSize: '0.95rem',
                  padding: '10px 16px',
                  color: activeDashboardTab === tab.id ? 'var(--primary)' : 'rgba(255,255,255,0.7)',
                  background: activeDashboardTab === tab.id ? 'rgba(255,255,255,0.03)' : 'transparent',
                  fontWeight: activeDashboardTab === tab.id ? '600' : '500'
                }}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {isHome && (
        <>
          <a href="#shops" style={mobileLinkStyle} onClick={() => setIsMenuOpen(false)}>Locations</a>
          <a href="#products" style={mobileLinkStyle} onClick={() => setIsMenuOpen(false)}>Shop</a>
        </>
      )}
    </div>
  );

  return (
    <>
      <header style={headerStyle}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: scrolled ? '1.2rem' : '1.4rem', fontWeight: '800', color: 'white', letterSpacing: '1px', transition: 'all 0.4s' }}>
            TRIMTIME<span style={{ color: 'var(--primary)' }}>.</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
          {!isOwner && !isAdmin && <Link to="/" style={linkStyle}>Public Home</Link>}
          {user && !isOwner && !isAdmin && <Link to="/profile" style={linkStyle}>My Tokens</Link>}
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
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {/* Cart Button */}
            {!isOwner && !isAdmin && (
              <button 
                onClick={onOpenCart}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  width: '45px',
                  height: '45px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative',
                  fontSize: '1.2rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
                onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {getCartCount() > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: 'var(--primary)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    border: '2px solid #0f0f14'
                  }}>
                    {getCartCount()}
                  </div>
                )}
              </button>
            )}

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
          </div>
        </nav>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{ 
            background: isMenuOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', 
            border: 'none', 
            color: 'white', 
            fontSize: '1.2rem', 
            cursor: 'pointer',
            zIndex: 1001,
            width: '45px',
            height: '45px',
            borderRadius: '12px',
            display: 'none', // Set to none, overriden by media query
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                zIndex: 998
              }}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '300px',
                background: '#0f0f14',
                zIndex: 999,
                padding: '90px 20px 40px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
                borderLeft: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              {navLinks}
              <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {!user ? (
                  <button 
                    onClick={() => { navigate('/login'); setIsMenuOpen(false); }}
                    style={{ ...buttonStyle, width: '100%', padding: '14px' }}
                  >
                    Login
                  </button>
                ) : (
                  <button 
                    onClick={async () => {
                      await logout();
                      setIsMenuOpen(false);
                      navigate('/');
                    }}
                    style={{ ...buttonStyle, width: '100%', padding: '14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Logout
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-toggle {
            display: block !important;
          }
          .bottom-nav-container {
            display: flex !important;
          }
          .main-content-mobile {
            padding-bottom: ${isAuthPage ? '0' : '100px'} !important;
          }
        }
      `}</style>
    </>
  );
};


const BottomNav = ({ onShowAuth }) => {
  const { user, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isOwner = role === 'shop_owner';
  const isAdmin = role === 'super_admin';

  if (isOwner || isAdmin) return null;

  const navItems = [
    { id: 'home', label: 'Home', path: '/' },
    { id: 'shops', label: 'Locations', path: '/#shops', isAnchor: true },
    { id: 'products', label: 'Shop', path: '/#products', isAnchor: true },
    { id: 'profile', label: 'Tokens', path: '/profile' }
  ];

  const containerStyle = {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'fit-content',
    background: 'rgba(10, 10, 15, 0.6)',
    backdropFilter: 'blur(30px)',
    WebkitBackdropFilter: 'blur(30px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '100px',
    padding: '6px 12px',
    gap: '4px',
    alignItems: 'center',
    zIndex: 2000,
    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    display: 'none' // Hidden by default, shown via media query
  };

  const itemStyle = (isActive) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    color: isActive ? 'white' : 'rgba(255, 255, 255, 0.4)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    padding: '10px 18px',
    borderRadius: '100px',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    position: 'relative',
    background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
    cursor: 'pointer'
  });

  const handleNavClick = (item, e, onShowAuth) => {
    if (item.id === 'profile' && !user) {
      e.preventDefault();
      onShowAuth();
      return;
    }
  };

  return (
    <div className="bottom-nav-container" style={containerStyle}>
      {navItems.map((item) => {
        const isActive = item.isAnchor 
          ? (location.hash === item.path.split('#')[1])
          : (location.pathname === item.path);
          
        if (item.isAnchor) {
          return (
            <a 
              key={item.id} 
              href={item.path} 
              style={itemStyle(isActive)}
            >
              {item.label}
            </a>
          );
        }

        return (
          <Link 
            key={item.id} 
            to={item.path} 
            style={itemStyle(isActive)}
            onClick={(e) => handleNavClick(item, e, onShowAuth)}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
};


const AuthPromptModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(10px)',
              zIndex: 3000
            }}
          />
          <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3001,
            padding: '20px',
            pointerEvents: 'none'
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{
                width: '100%',
                maxWidth: '400px',
                background: '#161621',
                borderRadius: '32px',
                padding: '40px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                pointerEvents: 'auto'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎫</div>
              <h2 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px' }}>Your Tokens</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '32px', lineHeight: '1.6' }}>
                Please login or create an account to view your active tokens and queue status.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  onClick={() => { onClose(); navigate('/login'); }}
                  style={{
                    padding: '16px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '16px',
                    fontWeight: '700',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
                  onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                >
                  Login to Continue
                </button>
                <button 
                  onClick={() => { onClose(); navigate('/signup'); }}
                  style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    fontWeight: '600',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  Create Account
                </button>
                <button 
                  onClick={onClose}
                  style={{
                    padding: '12px',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    marginTop: '10px'
                  }}
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};


const MainLayout = ({ children }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const location = useLocation();
  const isDisplayPage = location.pathname.startsWith('/display');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isFullPage = location.pathname === '/' || location.pathname === '/queue' || isAuthPage;

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
        <Header onOpenCart={() => setIsCartOpen(true)} />
        <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        <AuthPromptModal isOpen={isAuthPromptOpen} onClose={() => setIsAuthPromptOpen(false)} />

        <main 
          className="main-content-mobile"
          style={{ 
            flex: 1, 
            paddingTop: isFullPage ? 0 : '80px', 
            paddingBottom: isAuthPage ? '0' : '80px',
            width: '100%'
          }}
        >
          {isFullPage ? (
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
        <BottomNav onShowAuth={() => setIsAuthPromptOpen(true)} />
      </div>
    </ShopProvider>
  );
};

export default MainLayout;
