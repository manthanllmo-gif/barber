import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../contexts/ShopContext';
import { useCart } from '../contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import CountdownTimer from '../components/common/CountdownTimer';
import CartDrawer from '../components/cart/CartDrawer';

const AVG_TIME_MINS = 15;

const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { shops, products, setCurrentShopId, loading: shopsLoading } = useShop();
    const { addToCart, getCartCount } = useCart();
    const [queueData, setQueueData] = useState({});
    const [staffCounts, setStaffCounts] = useState({});
    const [scrolled, setScrolled] = useState(false);
    const [activeToken, setActiveToken] = useState(null);
    const [waitMins, setWaitMins] = useState(0);
    const [targetDate, setTargetDate] = useState(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (shops.length > 0) {
            fetchQueueCounts();
            fetchStaffCounts();
        }
    }, [shops]);

    useEffect(() => {
        if (!user) {
            setActiveToken(null);
            return;
        }
        fetchActiveToken();

        const channel = supabase
            .channel('home_token_updates')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'tokens', filter: `customer_phone=eq.${user.user_metadata?.phone}` }, 
                () => fetchActiveToken()
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [user, shops]);

    const fetchActiveToken = async () => {
        const phone = user?.user_metadata?.phone;
        if (!phone) return;

        const { data: token } = await supabase
            .from('tokens')
            .select('*, shops(name)')
            .eq('customer_phone', phone)
            .in('status', ['pending', 'called'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (token) {
            setActiveToken(token);
            if (token.status === 'called') {
                setWaitMins(0);
                setTargetDate(null);
            } else {
                // Fetch full queue and services for accurate sync with Profile
                const [queueRes, servicesRes, staffRes] = await Promise.all([
                    supabase
                        .from('tokens')
                        .select('id, token_number, status, called_at, preferred_staff_id, staff_id, services_selected')
                        .eq('shop_id', token.shop_id)
                        .in('status', ['pending', 'called'])
                        .order('token_number', { ascending: true }),
                    supabase
                        .from('services')
                        .select('id, name, avg_time')
                        .eq('shop_id', token.shop_id),
                    supabase
                        .from('staff')
                        .select('id', { count: 'exact', head: true })
                        .eq('shop_id', token.shop_id)
                        .eq('is_active', true)
                ]);

                const queueData = queueRes.data || [];
                const servicesList = servicesRes.data || [];
                const staffCount = staffRes.count || 1;

                const pendingTokens = queueData.filter(t => t.status === 'pending');
                const calledTokens = queueData.filter(t => t.status === 'called');
                const currentPos = pendingTokens.findIndex(t => t.id === token.id);

                if (currentPos !== -1) {
                    const getRemainingTime = (t) => {
                        if (!t.called_at) return Date.now() + AVG_TIME_MINS * 60000;
                        let expectedMins = AVG_TIME_MINS;
                        if (t.services_selected && Array.isArray(t.services_selected)) {
                            const times = t.services_selected.map(sid => {
                                const s = servicesList.find(serv => serv.id === sid || serv.name === sid);
                                return s ? s.avg_time : AVG_TIME_MINS;
                            });
                            if (times.length > 0) expectedMins = times.reduce((a, b) => a + b, 0);
                        }
                        return new Date(t.called_at).getTime() + expectedMins * 60000;
                    };

                    let calculatedTarget;
                    if (token.preferred_staff_id) {
                        const servingToken = calledTokens.find(t => t.staff_id === token.preferred_staff_id);
                        let baseTargetTime = servingToken ? getRemainingTime(servingToken) : Date.now();
                        const peopleAhead = pendingTokens.filter(t => 
                            t.preferred_staff_id === token.preferred_staff_id &&
                            t.token_number < token.token_number
                        ).length;
                        calculatedTarget = new Date(baseTargetTime + (peopleAhead * AVG_TIME_MINS) * 60000);
                    } else {
                        let earliestFree = Date.now();
                        if (calledTokens.length >= staffCount) {
                            earliestFree = Math.min(...calledTokens.map(t => getRemainingTime(t)));
                        }
                        const estimatedPos = Math.ceil((currentPos + 1) / staffCount);
                        calculatedTarget = new Date(earliestFree + (estimatedPos * AVG_TIME_MINS) * 60000);
                    }

                    if (calculatedTarget < new Date()) calculatedTarget = new Date(Date.now() + 60000);
                    
                    const diffMins = Math.max(1, Math.ceil((calculatedTarget - new Date()) / 60000));
                    setWaitMins(diffMins);
                    setTargetDate(calculatedTarget.toISOString());
                }
            }
        } else {
            setActiveToken(null);
        }
    };

    const fetchQueueCounts = async () => {
        const { data } = await supabase
            .from('tokens')
            .select('shop_id, status')
            .in('status', ['pending', 'called']);
        
        if (data) {
            const counts = data.reduce((acc, token) => {
                acc[token.shop_id] = (acc[token.shop_id] || 0) + 1;
                return acc;
            }, {});
            setQueueData(counts);
        }
    };

    const fetchStaffCounts = async () => {
        const { data } = await supabase
            .from('staff')
            .select('shop_id')
            .eq('is_active', true);
        
        if (data) {
            const counts = data.reduce((acc, s) => {
                acc[s.shop_id] = (acc[s.shop_id] || 0) + 1;
                return acc;
            }, {});
            setStaffCounts(counts);
        }
    };

    const handleSelectShop = (shopId) => {
        setCurrentShopId(shopId);
        navigate('/queue');
    };

    if (shopsLoading) {
        return (
            <div className="loading-screen" style={{ 
                height: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'var(--background)'
            }}>
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ width: 40, height: 40, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}
                />
            </div>
        );
    }

    return (
        <div className="home-container" style={{ background: 'var(--background)', minHeight: '100vh' }}>
            {/* Hero Section */}
            <section style={{
                height: '90vh',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                overflow: 'hidden',
                background: 'linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url("/assets/image1.webp") center/cover no-repeat'
            }}>
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    style={{ maxWidth: '800px', padding: '0 20px', zIndex: 1 }}
                >
                    <h1 style={{ 
                        fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', 
                        fontWeight: '800', 
                        color: 'white', 
                        lineHeight: '1.1',
                        marginBottom: '20px'
                    }}>
                        Where Style Meets <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>Confidence</span>
                    </h1>
                    <p style={{ 
                        fontSize: 'clamp(1rem, 3vw, 1.25rem)', 
                        color: 'rgba(255,255,255,0.8)', 
                        marginBottom: '40px',
                        fontWeight: '400'
                    }}>
                        Experience the ultimate grooming journey with real-time queue tracking and premium products.
                    </p>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                        <a href="#shops" style={{ 
                            padding: '16px 32px', 
                            background: 'white', 
                            color: 'black', 
                            borderRadius: '50px', 
                            textDecoration: 'none', 
                            fontWeight: '700',
                            transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                        >
                            Book Now
                        </a>
                        <a href="#products" style={{ 
                            padding: '16px 32px', 
                            background: 'transparent', 
                            color: 'white', 
                            border: '1px solid white',
                            borderRadius: '50px', 
                            textDecoration: 'none', 
                            fontWeight: '700'
                        }}>
                            View Products
                        </a>
                    </div>

                    {/* Integrated Active Token Bar */}
                    <AnimatePresence>
                        {activeToken && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={() => navigate('/profile')}
                                style={{
                                    marginTop: '40px',
                                    marginLeft: 'auto',
                                    marginRight: 'auto',
                                    width: 'min(100%, 450px)',
                                    background: activeToken.status === 'called' 
                                        ? 'linear-gradient(135deg, #ef4444, #f87171)' 
                                        : 'rgba(255, 255, 255, 0.05)',
                                    backdropFilter: 'blur(12px)',
                                    padding: '16px 24px',
                                    borderRadius: '24px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <div style={{ 
                                        width: '50px', 
                                        height: '50px', 
                                        borderRadius: '16px', 
                                        background: 'rgba(255,255,255,0.1)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        fontSize: '1.2rem',
                                        fontWeight: '950',
                                        color: 'white'
                                    }}>
                                        Q{activeToken.token_number}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: '900', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>
                                            {activeToken.shops?.name}
                                        </span>
                                        <span style={{ fontSize: '1rem', fontWeight: '900', color: 'white' }}>
                                            {activeToken.status === 'called' ? "IT'S TRIM TIME! ⚡" : `${waitMins} MINS EST.`}
                                        </span>
                                    </div>
                                </div>
                                
                                {activeToken.status === 'pending' && targetDate && (
                                    <div style={{ transform: 'scale(0.6)', transformOrigin: 'right center' }}>
                                        <CountdownTimer targetDate={targetDate} />
                                    </div>
                                )}
                                
                                {activeToken.status === 'called' && (
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                        style={{ fontSize: '1.5rem' }}
                                    >
                                        📍
                                    </motion.div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
                
                {/* Scroll Indicator */}
                <motion.div 
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ position: 'absolute', bottom: '30px', color: 'white', fontSize: '1rem', opacity: 0.5 }}
                >
                    Scroll
                </motion.div>
            </section>

            {/* Trust Ticker Section */}
            <section style={{ 
                padding: '40px 0', 
                background: '#0a0a0f', 
                borderTop: '1px solid rgba(255,255,255,0.05)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
            }}>
                <motion.div 
                    initial={{ x: 0 }}
                    animate={{ x: "-50%" }}
                    transition={{ 
                        duration: 30, 
                        repeat: Infinity, 
                        ease: "linear" 
                    }}
                    style={{ 
                        display: 'inline-flex', 
                        gap: '100px',
                        paddingLeft: '50px'
                    }}
                >
                    {[...Array(2)].map((_, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '100px', alignItems: 'center' }}>
                            {[
                                { label: 'Locations', value: shops.length + '+' },
                                { label: 'Staff Members', value: '24+' },
                                { label: 'Happy Clients', value: '15k+' },
                                { label: 'Avg Wait Time', value: '15m' }
                            ].map((stat, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)' }}>{stat.value}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '600' }}>{stat.label}</div>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', marginLeft: '40px' }}></div>
                                </div>
                            ))}
                        </div>
                    ))}
                </motion.div>
            </section>


            {/* Shops Section */}
            <section id="shops" style={{ padding: '100px 5%' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white', marginBottom: '15px' }}>Our Locations</h2>
                    <div style={{ width: '60px', height: '4px', background: 'var(--primary)', margin: '0 auto' }}></div>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
                    gap: '30px',
                    maxWidth: '1400px',
                    margin: '0 auto'
                }}>
                    {shops.map((shop, i) => (
                        <motion.div
                            key={shop.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            whileHover={{ y: -5 }}
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            onClick={() => handleSelectShop(shop.id)}
                            style={{
                                position: 'relative',
                                borderRadius: '32px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                height: '450px',
                                background: '#1a1a24',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                            }}
                        >
                            <img 
                                src={shop.image_url || `/assets/${['salman.jpeg', 'sparkle.jpeg', 'sunny.jpg'][i % 3]}`} 
                                alt={shop.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                            />
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-end',
                                padding: '40px'
                            }}>
                                <h3 style={{ fontSize: '2rem', fontWeight: '800', color: 'white', marginBottom: '10px' }}>{shop.name}</h3>
                                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '20px' }}>
                                    {shop.address || 'Location Details'}
                                </p>
                                
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ 
                                        padding: '8px 16px', 
                                        background: 'rgba(255,255,255,0.1)', 
                                        backdropFilter: 'blur(5px)',
                                        borderRadius: '12px',
                                        fontSize: '0.85rem',
                                        color: 'white',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        {queueData[shop.id] || 0} Waiting
                                    </div>
                                    <div style={{ 
                                        padding: '8px 16px', 
                                        background: 'rgba(99, 102, 241, 0.2)', 
                                        backdropFilter: 'blur(5px)',
                                        borderRadius: '12px',
                                        fontSize: '0.85rem',
                                        color: 'var(--primary)',
                                        fontWeight: '700',
                                        border: '1px solid rgba(99, 102, 241, 0.3)'
                                    }}>
                                        {(queueData[shop.id] || 0) * AVG_TIME_MINS}m wait
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Products Section */}
            <section id="products" style={{ padding: '100px 5%', background: '#0a0a0f' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '60px', maxWidth: '1400px', margin: '0 auto' }}>
                    <div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white', marginBottom: '15px' }}>Premium Care</h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Professional products for your daily routine.</p>
                    </div>
                    <button style={{ color: 'var(--primary)', background: 'none', border: 'none', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.8rem' }}>View All</button>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                    gap: '30px',
                    maxWidth: '1400px',
                    margin: '0 auto'
                }}>
                    {products.map((product, i) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -10, scale: 1.02 }}
                            viewport={{ once: true }}
                            style={{
                                background: '#0f0f14',
                                borderRadius: '32px',
                                padding: '20px',
                                border: '1px solid rgba(255,255,255,0.03)',
                                transition: 'all 0.3s ease',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{ 
                                height: '240px', 
                                borderRadius: '18px', 
                                overflow: 'hidden', 
                                marginBottom: '20px',
                                background: '#21212e'
                            }}>
                                <img 
                                    src={product.image_url || `/assets/${['hair gel.webp', 'roller comb.jpg', 'shampo.jpg'][i % 3]}`} 
                                    alt={product.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                            <div style={{ padding: '0 10px 10px' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'white', marginBottom: '5px' }}>{product.name}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'white' }}>₹{product.price}</div>
                                    <div style={{ 
                                        fontSize: '0.7rem', 
                                        color: product.stock > 0 ? 'var(--primary)' : '#f44336',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        fontWeight: '700'
                                    }}>
                                        {product.stock > 0 ? 'Available' : 'Sold Out'}
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                                style={{
                                    width: '100%',
                                    marginTop: '20px',
                                    padding: '16px',
                                    background: 'white',
                                    color: 'black',
                                    border: 'none',
                                    borderRadius: '16px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
                                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                            >
                                Add to Cart
                            </button>
                        </motion.div>
                    ))}
                </div>
            </section>


            {/* Footer */}
            <footer style={{ padding: '80px 5%', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '20px' }}>
                    TRIMTIME<span style={{ color: 'var(--primary)' }}>.</span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '400px', margin: '0 auto 40px' }}>
                    Premium grooming and queue management system for modern establishments.
                </p>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '40px' }}>
                    {/* Social icons placeholders */}
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>f</div>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>t</div>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>i</div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.2)' }}>
                    © 2026 TrimTime Queue Systems. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default Home;
