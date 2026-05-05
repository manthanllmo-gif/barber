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
  const { getCartCount, isCartOpen, setIsCartOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [placeholder, setPlaceholder] = useState("");
  
  // Typing animation for placeholder
  useEffect(() => {
    const suggestions = [
      "Search for a 'Fade'...",
      "Search for 'Beard Trim'...",
      "Search for 'Premium Salon'...",
      "Search for 'Hair Styling'...",
      "Search for 'Nearby Saloons'..."
    ];
    
    let currentIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let typingSpeed = 100;

    const type = () => {
      const fullText = suggestions[currentIdx];
      
      if (isDeleting) {
        setPlaceholder(fullText.substring(0, charIdx - 1));
        charIdx--;
        typingSpeed = 50;
      } else {
        setPlaceholder(fullText.substring(0, charIdx + 1));
        charIdx++;
        typingSpeed = 100;
      }

      if (!isDeleting && charIdx === fullText.length) {
        isDeleting = true;
        typingSpeed = 2000; // Pause at end
      } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        currentIdx = (currentIdx + 1) % suggestions.length;
        typingSpeed = 500;
      }

      setTimeout(type, typingSpeed);
    };

    const initialTimeout = setTimeout(type, 1000);
    return () => clearTimeout(initialTimeout);
  }, []);

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

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSearchParams(prev => {
      if (val) prev.set('q', val);
      else prev.delete('q');
      return prev;
    }, { replace: true });
  };

  const isLightHeader = isHome && !scrolled;

  const headerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: scrolled ? '10px 5%' : '18px 5%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
    background: scrolled ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(30px) saturate(180%)',
    WebkitBackdropFilter: 'blur(30px) saturate(180%)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: scrolled ? '0 20px 40px rgba(0, 0, 0, 0.4)' : 'none',
    borderRadius: '0 0 32px 32px'
  };

  const linkStyle = {
    color: '#FFFFFF',
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: '700',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 0.6,
    letterSpacing: '0.5px',
    textTransform: 'uppercase'
  };

  const mobileLinkStyle = {
    color: '#000000',
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
    background: '#FFFFFF',
    color: '#000000',
    border: 'none',
    borderRadius: '50px',
    fontWeight: '700',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
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
          style={{ ...mobileLinkStyle, background: location.pathname === '/' ? 'rgba(0,0,0,0.05)' : 'transparent' }} 
          onClick={() => setIsMenuOpen(false)}
        >
          Public Home
        </Link>
      )}
      
      {user && !isOwner && !isAdmin && (
        <Link 
          to="/profile" 
          style={{ ...mobileLinkStyle, background: location.pathname === '/profile' ? 'rgba(0,0,0,0.05)' : 'transparent' }} 
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
        <div style={{ marginTop: '10px', padding: '10px 0', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '0.7rem', color: 'rgba(0,0,0,0.4)', fontWeight: '800', textTransform: 'uppercase', padding: '0 16px 10px', letterSpacing: '1px' }}>Dashboard</p>
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
                  color: activeDashboardTab === tab.id ? 'var(--primary)' : 'rgba(0,0,0,0.7)',
                  background: activeDashboardTab === tab.id ? 'rgba(0,0,0,0.03)' : 'transparent',
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
          <Link to="/shop" style={mobileLinkStyle} onClick={() => setIsMenuOpen(false)}>Shop</Link>
        </>
      )}
    </div>
  );

  return (
    <>
      <header style={{
        ...headerStyle,
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        height: scrolled ? '64px' : '80px',
        zIndex: 2000
      }}>
        {/* Top Row: Logo & Actions */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <img 
              src="/assets/header_logo.png" 
              alt="TrimTime" 
              style={{ height: scrolled ? '28px' : '36px', transition: 'all 0.4s ease' }} 
            />
            <div style={{ 
              fontSize: '1.4rem', 
              fontWeight: '600', 
              color: '#FFFFFF', 
              fontFamily: "'Bodoni Moda', serif",
              letterSpacing: '-0.5px',
              display: scrolled ? 'none' : 'block'
            }}>
              TrimTimes<span style={{ color: '#276EF1' }}>.</span>
            </div>
          </Link>

          {/* Premium Integrated Search Bar */}
          <div className="header-search-container" style={{ 
            flex: 1,
            maxWidth: '440px', 
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            margin: '0 24px',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ 
              position: 'absolute', 
              left: '16px', 
              pointerEvents: 'none', 
              display: 'flex', 
              alignItems: 'center', 
              zIndex: 1,
              opacity: 0.5
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input 
              type="text" 
              placeholder={placeholder || "Search..."}
              value={searchQuery}
              onChange={handleSearch}
              style={{
                width: '100%',
                padding: '12px 20px 12px 44px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                fontWeight: '600',
                outline: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                letterSpacing: '0.2px'
              }}
              onFocus={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.07)';
                e.target.style.borderColor = 'rgba(255,255,255,0.4)';
                e.target.style.boxShadow = '0 0 0 4px rgba(255,255,255,0.05)';
              }}
              onBlur={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.03)';
                e.target.style.borderColor = 'rgba(255,255,255,0.15)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Desktop Navigation */}
            <nav className="desktop-nav" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              {!isOwner && !isAdmin && <Link to="/" style={linkStyle}>Public Home</Link>}
              {user && !isOwner && !isAdmin && <Link to="/profile" style={linkStyle}>My Tokens</Link>}
              {(isOwner || isAdmin) && (
                <Link to="/dashboard" style={{ ...linkStyle, color: 'var(--primary)', fontWeight: '700', opacity: 1 }}>
                  Admin Center
                </Link>
              )}
              
              {!isOwner && !isAdmin && (
                  <button 
                    onClick={onOpenCart}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#FFFFFF',
                      width: '38px',
                      height: '38px',
                      borderRadius: '50px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="21" r="1"></circle>
                      <circle cx="20" cy="21" r="1"></circle>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                  {getCartCount() > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      background: '#276EF1',
                      color: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: '800'
                    }}>
                      {getCartCount()}
                    </div>
                  )}
                </button>
              )}

              {!user ? (
                <button onClick={() => navigate('/login')} style={{ ...buttonStyle, padding: '8px 20px', fontSize: '0.85rem' }}>Login</button>
              ) : (
                <button 
                  onClick={async () => { await logout(); navigate('/'); }}
                  style={{ ...buttonStyle, borderRadius: '50px', padding: '8px 20px', fontSize: '0.85rem' }}
                >
                  Logout
                </button>
              )}
            </nav>

            {/* Mobile Actions */}
            <div className="mobile-actions" style={{ display: 'none', alignItems: 'center', gap: '8px' }}>
              {!isOwner && !isAdmin && (
                <button 
                  onClick={() => setIsCartOpen(true)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: '#FFFFFF',
                    width: '38px',
                    height: '38px',
                    borderRadius: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  {getCartCount() > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: '#276EF1',
                      color: 'white',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6rem',
                      fontWeight: '800'
                    }}>
                      {getCartCount()}
                    </div>
                  )}
                </button>
              )}

              <button 
                className="mobile-menu-toggle-btn"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{ 
                  background: 'rgba(255,255,255,0.1)', 
                  border: 'none', 
                  color: '#FFFFFF', 
                  width: '38px',
                  height: '38px',
                  borderRadius: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>

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
                zIndex: 3000
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
                background: '#FFFFFF',
                zIndex: 3001,
                padding: '90px 20px 40px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                boxShadow: '-10px 0 30px rgba(0,0,0,0.05)',
                borderLeft: '1px solid rgba(0,0,0,0.05)'
              }}
            >
              <button
                onClick={() => setIsMenuOpen(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(0,0,0,0.05)',
                  border: 'none',
                  color: '#000000',
                  fontSize: '24px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 3002
                }}
              >
                ×
              </button>
              
              {/* Close Dongle Handle */}
              <div
                onClick={() => setIsMenuOpen(false)}
                style={{
                  position: 'absolute',
                  left: '-30px',
                  top: '100px',
                  width: '30px',
                  height: '60px',
                  background: '#FFFFFF',
                  borderRadius: '12px 0 0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRight: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  boxShadow: '-5px 0 15px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ width: '2px', height: '20px', background: 'currentColor', borderRadius: '2px', opacity: 0.5 }} />
              </div>

              <div style={{ paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px' }}>
                {!user ? (
                  <button 
                    onClick={() => { navigate('/login'); setIsMenuOpen(false); }}
                    style={{ ...buttonStyle, width: '100%', padding: '12px' }}
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
                    style={{ ...buttonStyle, width: '100%', padding: '12px', background: '#000000', border: '1px solid #000000', color: '#FFFFFF' }}
                  >
                    Logout
                  </button>
                )}
              </div>
              {navLinks}
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
            display: none !important;
          }
          .mobile-actions {
            display: flex !important;
            align-items: center;
          }
          .header-search-container {
            margin: 0 10px !important;
            max-width: none !important;
          }
          .bottom-nav-container {
            display: flex !important;
          }
          .main-content-mobile {
            padding-bottom: ${isAuthPage ? '0' : '80px'} !important;
          }
        }
      `}</style>
    </>
  );
};


const NavIcons = {
  Home: ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.3s' }}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Explore: ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.3s' }}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  ),
  Shop: ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.3s' }}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  Tokens: ({ active }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.3s' }}>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <line x1="13" y1="5" x2="13" y2="7" />
      <line x1="13" y1="17" x2="13" y2="19" />
      <line x1="13" y1="11" x2="13" y2="13" />
    </svg>
  )
};

const BottomNav = ({ onShowAuth }) => {
  const { user, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isOwner = role === 'shop_owner';
  const isAdmin = role === 'super_admin';

  if (isOwner || isAdmin) return null;

  const navItems = [
    { id: 'home', label: 'Home', path: '/', Icon: NavIcons.Home },
    { id: 'explore', label: 'Explore', path: '/saloons', Icon: NavIcons.Explore },
    { id: 'products', label: 'Shop', path: '/shop', Icon: NavIcons.Shop },
    { id: 'profile', label: 'Tokens', path: '/profile', Icon: NavIcons.Tokens }
  ];

  const containerStyle = {
    position: 'fixed',
    bottom: '0',
    left: '0',
    right: '0',
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(30px) saturate(180%)',
    WebkitBackdropFilter: 'blur(30px) saturate(180%)',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'none', // Shown via media query
    justifyContent: 'space-around',
    padding: '12px 0 calc(12px + env(safe-area-inset-bottom))',
    zIndex: 2000,
    boxShadow: '0 -20px 40px rgba(0, 0, 0, 0.4)',
    borderRadius: '32px 32px 0 0'
  };

  const itemStyle = (isActive) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    flex: 1,
    gap: '6px',
    fontSize: '0.65rem',
    fontWeight: '800',
    position: 'relative',
    cursor: 'pointer',
    letterSpacing: '0.05em',
    textTransform: 'uppercase'
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
              <item.Icon active={isActive} />
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
            <item.Icon active={isActive} />
            {item.label}
            {isActive && (
              <motion.div 
                layoutId="bottomNavIndicator"
                style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '20px',
                  height: '2px',
                  background: '#FFFFFF',
                  borderRadius: '10px',
                  boxShadow: '0 0 15px rgba(255, 255, 255, 0.5)'
                }}
              />
            )}
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
              zIndex: 4000
            }}
          />
          <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 4001,
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
                pointerEvents: 'auto',
                position: 'relative'
              }}
            >
              <button
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '20px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  zIndex: 1
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                }}
              >
                ×
              </button>
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
  const { isCartOpen, setIsCartOpen } = useCart();
  const { role } = useAuth();
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const location = useLocation();
  const isDisplayPage = location.pathname.startsWith('/display') || location.pathname === '/pitch';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/app');
  const isOwner = role === 'shop_owner' || role === 'owner';
  const shouldHideHeader = isDashboard;
  const isFullPage = location.pathname === '/' || location.pathname === '/queue' || location.pathname === '/profile' || location.pathname === '/saloons' || location.pathname === '/shop' || isAuthPage || isDashboard;

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
        {!shouldHideHeader && !isDisplayPage && <Header onOpenCart={() => setIsCartOpen(true)} />}
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
