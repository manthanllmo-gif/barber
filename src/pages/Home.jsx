import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../contexts/ShopContext';
import { useCart } from '../contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import CartDrawer from '../components/cart/CartDrawer';

const AVG_TIME_MINS = 15;

const Home = () => {
    const navigate = useNavigate();
    const { shops, products, setCurrentShopId, loading: shopsLoading } = useShop();
    const { addToCart, getCartCount } = useCart();
    const [queueData, setQueueData] = useState({});
    const [staffCounts, setStaffCounts] = useState({});
    const [scrolled, setScrolled] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

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
                </motion.div>
                
                {/* Scroll Indicator */}
                <motion.div 
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ position: 'absolute', bottom: '30px', color: 'white', fontSize: '1.5rem' }}
                >
                    ↓
                </motion.div>
            </section>

            {/* Stats Section */}
            <section style={{ padding: '80px 5%', background: '#0a0a0f' }}>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '40px',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    {[
                        { label: 'Locations', value: shops.length + '+' },
                        { label: 'Staff Members', value: '24+' },
                        { label: 'Happy Clients', value: '15k+' },
                        { label: 'Avg Wait Time', value: '15m' }
                    ].map((stat, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            style={{ textAlign: 'center' }}
                        >
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '5px' }}>{stat.value}</div>
                            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '2px' }}>{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
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
                            transition={{ delay: i * 0.1 }}
                            viewport={{ once: true }}
                            onClick={() => handleSelectShop(shop.id)}
                            style={{
                                position: 'relative',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                height: '450px',
                                background: '#1a1a24'
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
                                    📍 {shop.address || 'Location Details'}
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
                                        👥 {queueData[shop.id] || 0} Waiting
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
                                        ⏳ {(queueData[shop.id] || 0) * AVG_TIME_MINS}m wait
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
                    <button style={{ color: 'var(--primary)', background: 'none', border: 'none', fontWeight: '700', cursor: 'pointer' }}>View All →</button>
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
                            transition={{ delay: i * 0.05 }}
                            viewport={{ once: true }}
                            style={{
                                background: '#161621',
                                borderRadius: '24px',
                                padding: '15px',
                                border: '1px solid rgba(255,255,255,0.05)'
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
                                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)' }}>₹{product.price}</div>
                                    <div style={{ fontSize: '0.8rem', color: product.stock > 0 ? '#4caf50' : '#f44336' }}>
                                        {product.stock > 0 ? '● In Stock' : '○ Out of Stock'}
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => addToCart(product)}
                                style={{
                                    width: '100%',
                                    marginTop: '20px',
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.background = 'var(--primary)'}
                                onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                            >
                                Add to Cart
                            </button>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Floating Cart Button */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsCartOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    width: '60px',
                    height: '60px',
                    borderRadius: '30px',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px rgba(99, 102, 241, 0.4)',
                    zIndex: 100
                }}
            >
                <span style={{ fontSize: '1.5rem' }}>🛒</span>
                {getCartCount() > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: '#ff4d4d',
                        color: 'white',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: '800',
                        border: '2px solid var(--background)'
                    }}>
                        {getCartCount()}
                    </div>
                )}
            </motion.div>

            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

            {/* Footer */}
            <footer style={{ padding: '80px 5%', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '20px' }}>
                    VELOURA<span style={{ color: 'var(--primary)' }}>.</span>
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
                    © 2026 Veloura Queue Systems. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default Home;
