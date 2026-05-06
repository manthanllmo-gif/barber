import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ShopProvider, useShop } from '../../contexts/ShopContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import CartDrawer from '../cart/CartDrawer';
import Footer from './Footer';

const Header = ({ onOpenCart }) => {
  const { user, role, logout } = useAuth();
  const { currentShopId } = useShop();
  const { getCartCount, isCartOpen, setIsCartOpen } = useCart();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('gs') || '');
  const [placeholder, setPlaceholder] = useState("");
  
  // Typing animation for placeholder
  useEffect(() => {
    const suggestions = [
      "Search for a 'Fade'...",
      "Search for 'Beard Trim'...",
      "Search for 'Premium Salon'...",
      "Search for 'Hair Styling'...",
      "Search for 'Nearby Salons'..."
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

  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const activeDashboardTab = useSearchParams()[0].get('tab') || 'queue';

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Update scrolled state for style changes
      setScrolled(currentScrollY > 20);
      
      // Hide header on scroll down, show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isOwner = role === 'shop_owner';
  const isAdmin = role === 'super_admin';
  const isHome = location.pathname === '/';
  const isDashboard = location.pathname === '/dashboard';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  const { shops = [], products = [], staff = [] } = useShop();
  const [showResults, setShowResults] = useState(false);

  // Reactive search results based on data and query
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      return { shops: [], products: [], staff: [], services: [] };
    }

    const query = searchQuery.toLowerCase().trim();
    
    // 1. Filter Shops
    const filteredShops = shops.filter(s => 
      (s.name?.toLowerCase().includes(query)) || 
      (s.address?.toLowerCase().includes(query))
    ).slice(0, 5);

    // 2. Filter All Services (Scanning all shops)
    const allServicesMap = new Map();
    shops.forEach(shop => {
      shop.services?.forEach(service => {
        if (service.name?.toLowerCase().includes(query)) {
          const name = service.name.trim();
          if (!allServicesMap.has(name)) {
            allServicesMap.set(name, {
              ...service,
              shop_name: shop.name,
              shop_id: shop.id
            });
          }
        }
      });
    });
    const filteredServices = Array.from(allServicesMap.values()).slice(0, 5);

    // 3. Filter Products
    const filteredProducts = products.filter(p => 
      (p.name?.toLowerCase().includes(query)) || 
      (p.category_name?.toLowerCase().includes(query))
    ).slice(0, 5);

    // 4. Filter Staff
    const filteredStaff = staff.filter(s => {
      const nameMatch = s.name?.toLowerCase().includes(query);
      const skillsMatch = Array.isArray(s.skills) 
        ? s.skills.some(skill => typeof skill === 'string' && skill.toLowerCase().includes(query))
        : (typeof s.skills === 'string' && s.skills.toLowerCase().includes(query));
      return nameMatch || skillsMatch;
    }).slice(0, 5);

    return {
      shops: filteredShops,
      products: filteredProducts,
      staff: filteredStaff,
      services: filteredServices
    };
  }, [searchQuery, shops, products, staff]);

  // Handle showing results when query is present (e.g. on load or typing)
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  }, [searchQuery]);

  // Debounced URL update to keep UI smooth
  useEffect(() => {
    // Only update URL params on main list pages
    const isListPage = location.pathname === '/' || location.pathname === '/salons';
    if (!isListPage) return;

    const timer = setTimeout(() => {
      const currentGs = searchParams.get('gs') || '';
      if (searchQuery === currentGs) return;

      setSearchParams(prev => {
        if (searchQuery) prev.set('gs', searchQuery);
        else prev.delete('gs');
        return prev;
      }, { replace: true });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, location.pathname, searchParams]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const isLightHeader = false;

  const headerStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3000,
    padding: '0 5%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    background: 'var(--nav-bg)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderBottom: '1px solid var(--nav-border)',
    boxShadow: isDarkMode ? '0 10px 30px rgba(0, 0, 0, 0.5)' : '0 10px 30px rgba(0, 0, 0, 0.05)',
    transform: visible ? 'translateY(0)' : 'translateY(-100%)',
  };

  const linkStyle = {
    color: 'var(--nav-text)',
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
    background: isDarkMode ? '#FFFFFF' : '#000000',
    color: isDarkMode ? '#000000' : '#FFFFFF',
    border: 'none',
    borderRadius: '50px',
    fontWeight: '700',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.2)'
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
          Home
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
          <a 
            href={`https://wa.me/919981284141?text=${encodeURIComponent("Hello! I'm interested in onboarding my shop with TrimTimes. Please provide more details.")}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ ...mobileLinkStyle, color: '#276EF1' }} 
            onClick={() => setIsMenuOpen(false)}
          >
            Join as Owner
          </a>
        </>
      )}
    </div>
  );

  return (
    <>
      <motion.header 
        initial={false}
        animate={{ 
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          ...headerStyle,
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          height: '70px',
        }}
      >
        {/* Top Row: Logo & Actions */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <img 
              src={isDarkMode ? "/assets/logo_black.png" : "/assets/logo_white.png"} 
              alt="TrimTimes" 
              style={{ 
                height: '36px'
              }} 
            />
            <div className="logo-text" style={{ 
              fontSize: '1.4rem', 
              fontWeight: '600', 
              color: 'var(--nav-text)', 
              fontFamily: "'Bodoni Moda', serif",
              letterSpacing: '-0.5px'
            }}>
              TrimTimes<span style={{ color: '#276EF1' }}>.</span>
            </div>
          </Link>

          {/* Premium Integrated Search Bar */}
          <div ref={searchRef} className="header-search-container" style={{ 
            flex: 1,
            maxWidth: '440px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            margin: '0 24px',
            transition: 'all 0.3s ease',
            zIndex: 10001
          }}>
            <style>{`
              @media (max-width: 768px) {
                .header-search-container {
                  max-width: 180px !important;
                }
                .header-search-container input {
                  padding: 8px 12px 8px 36px !important;
                  font-size: 12px !important;
                }
                .search-results-dropdown {
                  width: 300px !important;
                  right: -60px !important;
                  left: auto !important;
                }
              }
            `}</style>
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
              onFocus={() => searchQuery.length > 1 && setShowResults(true)}
              style={{
                width: '100%',
                padding: '12px 20px 12px 44px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                color: 'var(--text-main)',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setShowResults(false); }}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            )}

            <AnimatePresence>
              {showResults && (
                <motion.div
                  key="global-search-results"
                  className="search-results-dropdown"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 12px)',
                    left: 0,
                    right: 0,
                    background: 'rgba(20, 20, 20, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '20px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                    padding: '8px',
                    zIndex: 10000,
                    maxHeight: '400px',
                    overflowY: 'auto',
                    backdropFilter: 'blur(30px)',
                    WebkitBackdropFilter: 'blur(30px)',
                    scrollbarWidth: 'none'
                  }}
                >

                  {/* Salons */}
                  {searchResults.shops.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: '800', textTransform: 'uppercase', padding: '0 12px 10px', letterSpacing: '2px' }}>Salons</p>
                      {searchResults.shops.map(shop => (
                        <Link 
                          key={shop.id}
                          to={`/queue?shopId=${shop.id}`}
                          onClick={() => {
                            setShowResults(false);
                            setSearchQuery('');
                          }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'all 0.2s ease',
                            textDecoration: 'none'
                          }}
                          className="search-result-item"
                        >
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', overflow: 'hidden', background: '#333' }}>
                            <img src={shop.image_url || '/assets/salman.jpeg'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div>
                            <div style={{ color: '#FFF', fontSize: '0.85rem', fontWeight: '700' }}>{shop.name}</div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>{shop.address}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Staff/Barbers */}
                  {searchResults.staff.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: '800', textTransform: 'uppercase', padding: '8px 12px', letterSpacing: '2px' }}>Barbers</p>
                      {searchResults.staff.map(barber => (
                        <Link 
                          key={barber.id}
                          to={`/barbers/${barber.id}`}
                          onClick={() => {
                            setShowResults(false);
                            setSearchQuery('');
                          }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'all 0.2s ease',
                            textDecoration: 'none'
                          }}
                          className="search-result-item"
                        >
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: '#333' }}>
                            <img src={barber.image_url || '/assets/sunny.jpg'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div>
                            <div style={{ color: '#FFF', fontSize: '0.85rem', fontWeight: '700' }}>{barber.name}</div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
                              {barber.shops?.name} • {Array.isArray(barber.skills) ? barber.skills.join(', ') : barber.skills}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Services */}
                  {searchResults.services.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: '800', textTransform: 'uppercase', padding: '8px 12px', letterSpacing: '2px' }}>Services</p>
                      {searchResults.services.map((service, index) => (
                        <Link 
                          key={index}
                          className="search-result-item"
                          to={`/salons?service=${encodeURIComponent(service.name)}`}
                          onClick={() => {
                            setShowResults(false);
                            setSearchQuery('');
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderRadius: '10px',
                            transition: 'all 0.2s ease',
                            textDecoration: 'none'
                          }}
                        >
                          <div style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '8px', 
                            background: 'rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden'
                          }}>
                            {service.image_url ? (
                              <img src={service.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: '1.1rem' }}>✂️</span>
                            )}
                          </div>
                          <div>
                            <div style={{ color: '#FFF', fontSize: '0.85rem', fontWeight: '700' }}>{service.name}</div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
                              {service.shop_name ? `Available at ${service.shop_name}` : 'Professional Service'}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Products */}
                  {searchResults.products.length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: '800', textTransform: 'uppercase', padding: '8px 12px', letterSpacing: '2px' }}>Products</p>
                      {searchResults.products.map(product => (
                        <Link 
                          key={product.id}
                          to={`/shop?productId=${product.id}`}
                          onClick={() => {
                            setShowResults(false);
                            setSearchQuery('');
                          }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'all 0.2s ease',
                            textDecoration: 'none'
                          }}
                          className="search-result-item"
                        >
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', overflow: 'hidden', background: '#333' }}>
                            <img src={product.image_url || '/assets/sparkle.jpeg'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div>
                            <div style={{ color: '#FFF', fontSize: '0.85rem', fontWeight: '700' }}>{product.name}</div>
                            <div style={{ color: '#276EF1', fontSize: '0.7rem', fontWeight: '800' }}>₹{product.price} • {product.category_name}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {Object.values(searchResults).every(arr => arr.length === 0) && (
                    <div style={{ padding: '24px 12px', textAlign: 'center' }}>
                      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: '600' }}>No matches found</div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Desktop Navigation */}
            <nav className="desktop-nav" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              {!isOwner && !isAdmin && <Link to="/" style={linkStyle}>Home</Link>}
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
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-main)',
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

              <button 
                onClick={toggleTheme}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                )}
              </button>

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
                    background: 'var(--surface)',
                    border: 'none',
                    color: 'var(--text-main)',
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
                onClick={toggleTheme}
                style={{
                  background: 'var(--surface)',
                  border: 'none',
                  color: 'var(--text-main)',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isDarkMode ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                )}
              </button>

              <button 
                className="mobile-menu-toggle-btn"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{ 
                  background: 'var(--surface)', 
                  border: 'none', 
                  color: 'var(--text-main)', 
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

      </motion.header>

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
          .logo-text {
            display: none !important;
          }
          .header-search-container {
            margin: 0 5px !important;
            max-width: none !important;
          }
           .search-results-dropdown {
            position: fixed !important;
            top: 60px !important;
            left: 15px !important;
            right: 15px !important;
            width: auto !important;
            max-height: 50vh !important;
            border-radius: 16px !important;
            padding: 6px !important;
            background: rgba(10, 10, 10, 0.85) !important;
            backdrop-filter: blur(25px) !important;
            -webkit-backdrop-filter: blur(25px) !important;
            box-shadow: 0 15px 35px rgba(0,0,0,0.4) !important;
            z-index: 10001 !important;
          }
          .search-results-dropdown::-webkit-scrollbar {
            display: none;
          }
          .search-result-item {
            padding: 6px 10px !important;
            gap: 10px !important;
          }
          .search-result-item div div:first-child {
            font-size: 0.8rem !important;
          }
          .search-result-item div div:last-child {
            font-size: 0.65rem !important;
          }
          .search-result-item img, .search-result-item div:first-child {
            width: 28px !important;
            height: 28px !important;
          }
          .search-results-dropdown p {
            font-size: 0.5rem !important;
            padding: 4px 10px !important;
            margin-bottom: 4px !important;
            letter-spacing: 1px !important;
          }
          .search-result-item:hover {
            background: rgba(255, 255, 255, 0.05) !important;
          }
          .bottom-nav-container {
            display: flex !important;
          }
          .main-content-mobile {
            padding-bottom: ${isAuthPage ? '0' : '70px'} !important;
          }
          footer {
            padding-bottom: 90px !important;
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
  Salons: ({ active }) => (
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
    { id: 'salons', label: 'Salons', path: '/salons', Icon: NavIcons.Salons },
    { id: 'products', label: 'Shop', path: '/shop', Icon: NavIcons.Shop },
    { id: 'profile', label: 'Tokens', path: '/profile', Icon: NavIcons.Tokens }
  ];

  const containerStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    maxWidth: 'none',
    background: 'var(--nav-bg)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderTop: '1px solid var(--nav-border)',
    display: 'none', // Shown via media query
    justifyContent: 'space-around',
    padding: '12px 12px calc(12px + env(safe-area-inset-bottom))',
    zIndex: 2000,
    boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.5)',
    borderTopLeftRadius: '24px',
    borderTopRightRadius: '24px'
  };

  const itemStyle = (isActive) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
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
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '16px',
                  height: '2px',
                  background: 'var(--primary)',
                  borderRadius: '10px',
                  boxShadow: '0 0 10px var(--primary-glow)'
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
                background: 'var(--surface)',
                borderRadius: '32px',
                padding: '40px',
                textAlign: 'center',
                border: '1px solid var(--border)',
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
                  background: 'var(--surface-elevated)',
                  border: 'none',
                  color: 'var(--text-muted)',
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
                  e.currentTarget.style.background = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-main)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = 'var(--surface-elevated)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                ×
              </button>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎫</div>
              <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px' }}>Your Tokens</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: '1.6' }}>
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
                    background: 'var(--surface-elevated)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border)',
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
                    color: 'var(--text-muted)',
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
  const isDisplayPage = location.pathname.startsWith('/display');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/app') || location.pathname.startsWith('/admin');
  const isOwner = role === 'shop_owner' || role === 'owner';
  const isAdmin = role === 'super_admin';
  const shouldHideHeader = isDashboard || isAdmin;
  const isFullPage = location.pathname === '/' || location.pathname === '/queue' || location.pathname === '/profile' || location.pathname === '/salons' || location.pathname === '/shop' || location.pathname === '/pitch' || isAuthPage || isDashboard;
  const showFooter = !isDashboard && !isDisplayPage && !isAdmin && !isAuthPage;

  if (isDisplayPage) {
    return (
      <ShopProvider>
        <div style={{ height: '100vh', width: '100%', overflow: 'hidden' }}>
          {children}
        </div>
      </ShopProvider>
    );
  }

  return (
    <ShopProvider>
      <div className="main-layout" style={{ 
        minHeight: '100vh', 
        width: '100%',
        display: 'flex', 
        flexDirection: 'column',
        background: 'var(--background)',
        overflowX: 'hidden',
        position: 'relative'
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
        {showFooter && <Footer />}
      </div>
    </ShopProvider>
  );
};

export default MainLayout;
