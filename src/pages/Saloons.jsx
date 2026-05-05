import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useShop } from '../contexts/ShopContext';
import { formatDistance } from '../utils/geoUtils';

const ServiceIcons = {
    Haircut: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
            <line x1="20" y1="4" x2="8.12" y2="15.88" />
            <line x1="14.47" y1="14.48" x2="20" y2="20" />
            <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
    ),
    Beard: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 11c.5 1 1 2 2 3s2.5 1.5 4 1.5 3-.5 4-1.5 1.5-2 2-3" />
            <path d="M12 21c-4.5 0-8-3.5-8-8 0-1.5.5-3 1-4.5 1.5-4 5.5-6.5 7-6.5s5.5 2.5 7 6.5c.5 1.5 1 3 1 4.5 0 4.5-3.5 8-8 8Z" />
            <path d="M12 16v5" />
        </svg>
    ),
    Default: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3v18M10 3v18M14 3v18M18 3v18" />
        </svg>
    )
};

const getServiceIcon = (name) => {
    if (!name || typeof name !== 'string') return <ServiceIcons.Default />;
    const n = name.toLowerCase();
    if (n.includes('cut')) return <ServiceIcons.Haircut />;
    if (n.includes('beard') || n.includes('trim')) return <ServiceIcons.Beard />;
    return <ServiceIcons.Default />;
};

const Saloons = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { shops, queueData, availableServices, geoLoading, getLocation } = useShop();
    
    const [sortBy, setSortBy] = useState('distance'); // 'distance', 'wait', 'name'
    const serviceFilter = searchParams.get('service') || '';

    const filteredAndSortedShops = useMemo(() => {
        let result = [...shops];

        // Filter by service
        if (serviceFilter) {
            result = result.filter(shop => 
                shop.services?.some(s => s.name.toLowerCase().includes(serviceFilter.toLowerCase()))
            );
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'distance') {
                if (a.distance === null) return 1;
                if (b.distance === null) return -1;
                return a.distance - b.distance;
            }
            if (sortBy === 'wait') {
                const waitA = (queueData[a.id] || 0);
                const waitB = (queueData[b.id] || 0);
                return waitA - waitB;
            }
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            }
            return 0;
        });

        return result;
    }, [shops, serviceFilter, sortBy, queueData]);

    const handleServiceToggle = (service) => {
        if (serviceFilter === service) {
            searchParams.delete('service');
        } else {
            searchParams.set('service', service);
        }
        setSearchParams(searchParams);
    };

    return (
        <div style={{ 
            padding: '24px', 
            paddingTop: '80px',
            marginTop: '0px',
            paddingBottom: '120px', 
            minHeight: '100vh', 
            background: '#FFFFFF',
            color: '#000000'
        }}>
            {/* Premium Header */}
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: '#F6F6F6',
                    border: '1px solid #EEEEEE',
                    borderRadius: '28px',
                    padding: '32px',
                    marginBottom: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px'
                }}
            >
                <motion.button 
                    whileHover={{ scale: 1.05, background: '#000', color: '#FFF' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/')}
                    style={{ 
                        background: '#FFF', 
                        border: 'none', 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: 'pointer',
                        color: '#000',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                    </svg>
                </motion.button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h1 style={{ fontSize: '1.2rem', fontWeight: '950', letterSpacing: '-0.5px', margin: 0, color: '#000000' }}>Explore</h1>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(0, 0, 0, 0.4)', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>Find your studio</p>
                </div>
            </motion.div>

            {/* Sleek Service Bubbles */}
            <div style={{ 
                display: 'flex', 
                gap: '8px', 
                overflowX: 'auto', 
                marginBottom: '32px', 
                padding: '4px 0 12px',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch'
            }}>
                {availableServices.map(service => {
                    const name = typeof service === 'string' ? service : (service?.name || 'Service');
                    const isActive = serviceFilter === name;
                    return (
                        <motion.button
                            key={name}
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleServiceToggle(name)}
                            style={{
                                padding: '10px 18px',
                                borderRadius: '12px',
                                border: '1px solid',
                                borderColor: isActive ? '#000' : '#F0F0F0',
                                background: isActive ? '#000' : '#FFF',
                                color: isActive ? '#FFF' : '#000',
                                fontWeight: '800',
                                fontSize: '0.8rem',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: isActive ? '0 8px 16px rgba(0,0,0,0.08)' : '0 2px 6px rgba(0,0,0,0.01)'
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', opacity: isActive ? 1 : 0.4, transform: 'scale(0.85)' }}>
                                {getServiceIcon(name)}
                            </span>
                            {name}
                        </motion.button>
                    );
                })}
            </div>

            {/* Premium Brand Cards - More Compact */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '12px', 
                marginBottom: '40px' 
            }}>
                <motion.div
                    whileHover={{ y: -3 }}
                    style={{
                        padding: '24px 20px',
                        background: '#FFF',
                        borderRadius: '24px',
                        border: '1px solid #F0F0F0',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                    }}
                >
                    <div style={{ position: 'absolute', top: '10%', right: '-5%', fontSize: '4rem', opacity: 0.02, fontWeight: '900', color: '#000', transform: 'rotate(-15deg)' }}>★</div>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: '900', color: '#276EF1', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: '8px' }}>Standard</span>
                        <h3 style={{ fontSize: '1rem', fontWeight: '950', color: '#000', margin: 0, letterSpacing: '-0.3px' }}>
                            Elite <span style={{ color: '#276EF1' }}>Top 5%</span>
                        </h3>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -3 }}
                    style={{
                        padding: '24px 20px',
                        background: '#FFF',
                        borderRadius: '24px',
                        border: '1px solid #F0F0F0',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                    }}
                >
                    <div style={{ position: 'absolute', top: '10%', right: '-5%', fontSize: '4rem', opacity: 0.02, fontWeight: '900', color: '#000', transform: 'rotate(15deg)' }}>✂</div>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <span style={{ fontSize: '0.6rem', fontWeight: '900', color: '#AAA', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: '8px' }}>Artisan</span>
                        <h3 style={{ fontSize: '1rem', fontWeight: '950', color: '#000', margin: 0, letterSpacing: '-0.3px' }}>
                            Master Fades
                        </h3>
                    </div>
                </motion.div>
            </div>

            {/* Refined Sort & Filter Bar */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '32px',
                padding: '8px 16px',
                background: '#FFF',
                borderRadius: '16px',
                border: '1px solid #F0F0F0',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: '900', color: '#DDD', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sort:</span>
                    <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#000',
                            fontWeight: '800',
                            fontSize: '0.85rem',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="distance">Distance</option>
                        <option value="wait">Wait Time</option>
                        <option value="name">Name</option>
                    </select>
                </div>
                <motion.button 
                    whileHover={{ background: '#FAFAFA' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={getLocation}
                    style={{ 
                        background: '#FFF', 
                        border: '1px solid #F0F0F0', 
                        color: '#000', 
                        fontWeight: '800', 
                        fontSize: '0.75rem', 
                        cursor: 'pointer',
                        padding: '8px 14px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    {geoLoading ? '...' : '📍 Near Me'}
                </motion.button>
            </div>

            {/* Shop List - Sleeker Cards */}
            <div style={{ display: 'grid', gap: '20px' }}>
                {filteredAndSortedShops.map((shop, i) => (
                    <motion.div
                        key={shop.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.04)' }}
                        onClick={() => navigate(`/queue?shopId=${shop.id}`)}
                        style={{
                            background: '#FFFFFF',
                            borderRadius: '32px',
                            overflow: 'hidden',
                            border: '1px solid #F5F5F5',
                            cursor: 'pointer',
                            position: 'relative',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.015)',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ height: '160px', width: '100%', position: 'relative' }}>
                                <img 
                                    src={shop.image_url || `/assets/${['salman.jpeg', 'sparkle.jpeg', 'sunny.jpg'][i % 3]}`} 
                                    alt={shop.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)' }} />
                                {shop.distance && (
                                    <div style={{ 
                                        position: 'absolute', top: '16px', right: '16px', 
                                        background: 'rgba(0,0,0,0.8)', color: '#FFF', padding: '6px 12px', borderRadius: '50px', 
                                        fontSize: '0.7rem', fontWeight: '900', backdropFilter: 'blur(4px)'
                                    }}>
                                        {formatDistance(shop.distance)}
                                    </div>
                                )}
                            </div>
                            <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: '950', color: '#000', marginBottom: '4px', letterSpacing: '-0.3px' }}>{shop.name}</h3>
                                    <p style={{ fontSize: '0.8rem', color: '#999', fontWeight: '700', margin: 0 }}>
                                        {shop.address || 'Premium Grooming Studio'}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                    <div style={{ 
                                        background: '#F8F8F8', padding: '5px 12px', borderRadius: '10px', 
                                        fontSize: '0.7rem', fontWeight: '900', color: '#000', border: '1px solid #EEE'
                                    }}>
                                        {queueData[shop.id] || 0} Waiting
                                    </div>
                                    <div style={{ color: '#276EF1', fontSize: '0.9rem', fontWeight: '950', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ fontSize: '0.8rem', opacity: 0.4 }}>⏰</span>
                                        {(queueData[shop.id] || 0) * 15}m
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredAndSortedShops.length === 0 && (
                <div style={{ textAlign: 'center', padding: '120px 20px' }}>
                    <div style={{ fontSize: '5rem', marginBottom: '32px', opacity: 0.1 }}>🔭</div>
                    <h2 style={{ fontWeight: '950', color: '#000', marginBottom: '12px', fontSize: '2rem' }}>No matches</h2>
                    <p style={{ color: 'rgba(0,0,0,0.4)', fontWeight: '700' }}>Try adjusting your filters.</p>
                </div>
            )}
        </div>
    );
};

export default Saloons;
