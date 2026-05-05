import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useShop } from '../contexts/ShopContext';
import { useCart } from '../contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import CountdownTimer from '../components/common/CountdownTimer';
import CartDrawer from '../components/cart/CartDrawer';
import { formatDistance, calculateETA, formatETA } from '../utils/geoUtils';

const AVG_TIME_MINS = 15;

const ServiceIcons = {
    Male: () => (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
            <path d="M12 21a8 8 0 0 1 8 -8a8 8 0 0 1 -8 8z" />
            <path d="M12 2v2M12 7v2" />
        </svg>
    ),
    Female: () => (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="9" r="4" />
            <path d="M12 13c-4 0-7 3-7 7v1h14v-1c0-4-3-7-7-7z" />
            <path d="M12 13v8M9 16h6" />
        </svg>
    )
};

const getServiceIcon = (name) => {
    const n = name.toLowerCase();
    const femaleKeywords = ['women', 'female', 'girl', 'lady', 'ladies', 'waxing', 'facial', 'color', 'dye'];
    const maleKeywords = ['men', 'male', 'boy', 'guy', 'beard', 'shave', 'trim', 'gentleman'];

    if (femaleKeywords.some(kw => n.includes(kw))) return <ServiceIcons.Female />;
    if (maleKeywords.some(kw => n.includes(kw))) return <ServiceIcons.Male />;
    
    return <ServiceIcons.Male />;
};

const CircleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8" />
    </svg>
);

const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { 
        shops, 
        products, 
        setCurrentShopId, 
        loading: shopsLoading,
        getLocation,
        geoLoading,
        geoError,
        userLocation,
        availableServices,
        queueData,
        staffCounts,
        productCategories,
        serviceTypes,
        staff
    } = useShop();
    const [searchParams] = useSearchParams();
    const { addToCart, getCartCount } = useCart();
    const [currentBanner, setCurrentBanner] = useState(0);
    const [isServicesExpanded, setIsServicesExpanded] = useState(false);
    const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [currentVision, setCurrentVision] = useState(0);
    const [currentFeature, setCurrentFeature] = useState(0);

    const banners = useMemo(() => {
        const serviceConfigs = {
            'Haircut': { color: '#FFC043', image: '/assets/image1.webp', title: 'Professional\nHAIRCUT' },
            'Beard': { color: '#276EF1', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80', title: 'Precision\nBEARD TRIM' },
            'Facial': { color: '#05A357', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&q=80', title: 'Refreshing\nFACIAL' },
            'Color': { color: '#EE4035', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80', title: 'Premium\nHAIR COLOR' },
            'Shave': { color: '#FFC043', image: 'https://images.unsplash.com/photo-1621605815841-28d6444e7bf1?auto=format&fit=crop&q=80', title: 'Classic\nSHAVE' },
            'Massage': { color: '#276EF1', image: 'https://images.unsplash.com/photo-1544161515-4ae6ce6e8450?auto=format&fit=crop&q=80', title: 'Relaxing\nMASSAGE' }
        };

        // Take top 5 services from system
        const source = serviceTypes.length > 0 ? serviceTypes : availableServices;
        return source.slice(0, 5).map((service, index) => {
            const name = typeof service === 'string' ? service : (service?.name || 'Service');
            
            const config = Object.entries(serviceConfigs).find(([key]) => 
                name.toLowerCase().includes(key.toLowerCase())
            )?.[1] || { 
                color: '#000', 
                image: typeof service === 'object' && service.image_url ? service.image_url : 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80',
                title: name.toUpperCase().split(' ').join('\n')
            };

            return {
                id: index,
                title: config.title,
                subtitle: 'SYSTEM FAVORITE',
                image: config.image,
                link: `/saloons?service=${encodeURIComponent(name)}`,
                color: config.color
            };
        });
    }, [availableServices, serviceTypes]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentBanner(prev => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [banners.length]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentVision(prev => (prev + 1) % 3);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentFeature(prev => (prev + 1) % 3);
        }, 7000);
        return () => clearInterval(timer);
    }, []);
    const [scrolled, setScrolled] = useState(false);
    const [activeToken, setActiveToken] = useState(null);
    const [waitMins, setWaitMins] = useState(0);
    const [targetDate, setTargetDate] = useState(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Load persisted token on mount
    useEffect(() => {
        const persisted = localStorage.getItem('trimtime_active_token');
        if (persisted) {
            try {
                const { token, wait, target } = JSON.parse(persisted);
                // Only load if the target date hasn't passed by more than 30 mins
                if (target && new Date(target).getTime() + 1800000 > Date.now()) {
                    setActiveToken(token);
                    setWaitMins(wait);
                    setTargetDate(target);
                } else if (!target && token) { // Handle "called" state where targetDate is null
                    setActiveToken(token);
                    setWaitMins(0);
                    setTargetDate(null);
                }
            } catch (e) {
                localStorage.removeItem('trimtime_active_token');
            }
        }
    }, []);

    // Update persistence whenever state changes
    useEffect(() => {
        if (activeToken) {
            localStorage.setItem('trimtime_active_token', JSON.stringify({
                token: activeToken,
                wait: waitMins,
                target: targetDate
            }));
        }
    }, [activeToken, targetDate, waitMins]);

    useEffect(() => {
        if (user) {
            fetchActiveToken();

            const channel = supabase
                .channel('home_token_updates')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'tokens', filter: `customer_phone=eq.${user.user_metadata?.phone}` }, 
                    () => fetchActiveToken()
                )
                .subscribe();

            return () => supabase.removeChannel(channel);
        }
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

                    // Stability check: if we already have a target for this token, only update if significant change
                    let finalTarget = calculatedTarget;
                    const persistedData = localStorage.getItem('trimtime_active_token');
                    if (persistedData) {
                        try {
                            const { token: pToken, target: pTarget } = JSON.parse(persistedData);
                            if (pToken?.id === token.id && pTarget) {
                                const existingDate = new Date(pTarget);
                                const diff = Math.abs(calculatedTarget.getTime() - existingDate.getTime());
                                // If difference is less than 5 minutes, keep the existing target to avoid jitter
                                if (diff < 300000) {
                                    finalTarget = existingDate;
                                }
                            }
                        } catch (e) {}
                    }

                    if (finalTarget < new Date()) finalTarget = new Date(Date.now() + 60000);
                    
                    const diffMins = Math.max(1, Math.ceil((finalTarget - new Date()) / 60000));
                    setWaitMins(diffMins);
                    setTargetDate(finalTarget.toISOString());
                }
            }
        } else {
            setActiveToken(null);
            localStorage.removeItem('trimtime_active_token');
        }
    };

    const handleSelectShop = (shopId) => {
        setCurrentShopId(shopId);
        navigate('/queue');
    };

    const searchQuery = searchParams.get('q') || '';

    const filteredShops = shops.filter(shop => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
            shop.name?.toLowerCase().includes(query) ||
            shop.address?.toLowerCase().includes(query);
        
        const matchesService = shop.services?.some(s => 
            s.name?.toLowerCase().includes(query)
        );

        return matchesSearch || matchesService;
    });

    const filteredProducts = products.filter(product =>
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
        <div className="home-container" style={{ 
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F9F9F9 100%)', 
            minHeight: '100vh', 
            color: '#000000', 
            fontFamily: 'Inter, sans-serif' 
        }}>
            <style>{`
                @media (max-width: 768px) {
                    .services-grid {
                        display: grid !important;
                        grid-template-columns: repeat(4, 1fr) !important;
                        gap: 12px !important;
                        overflow-x: visible !important;
                        padding-bottom: 0 !important;
                    }
                    .grid-card {
                        min-width: 0 !important;
                        height: auto !important;
                        width: 100% !important;
                        aspect-ratio: 1/1 !important;
                        flex-shrink: 1 !important;
                    }
                    .uber-style-card {
                        border-radius: 24px !important;
                        padding: 14px 8px !important;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: center !important;
                        text-align: center !important;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important;
                    }
                    .service-icon-container {
                        width: 42px !important;
                        height: 42px !important;
                        margin-bottom: 8px !important;
                        border-radius: 50% !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                    }
                    .service-label {
                        font-size: 0.75rem !important;
                        font-weight: 900 !important;
                        text-transform: uppercase !important;
                        line-height: 1.1 !important;
                    }
                    }
                    .service-arrow { display: none !important; }
                }
            `}</style>
            <main style={{ padding: '100px 5% 24px' }}>
                <header style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '4px', letterSpacing: '-0.5px', color: '#000000' }}>
                        Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.user_metadata?.name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'Guest'}
                    </h1>
                    <p style={{ color: '#000000', fontSize: '1rem', fontWeight: '500', opacity: 0.7 }}>Where would you like to get your trim today?</p>
                </header>

                {/* Promotional Carousel Banner */}
                {banners.length > 0 && (
                    <section style={{ marginBottom: '40px', position: 'relative' }}>
                        <div style={{
                            position: 'relative',
                            height: '240px',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            background: '#000',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
                        }}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentBanner}
                                    drag="x"
                                    dragConstraints={{ left: 0, right: 0 }}
                                    onDragEnd={(e, { offset, velocity }) => {
                                        const swipe = offset.x;
                                        if (swipe < -50) {
                                            setCurrentBanner((currentBanner + 1) % banners.length);
                                        } else if (swipe > 50) {
                                            setCurrentBanner((currentBanner - 1 + banners.length) % banners.length);
                                        }
                                    }}
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                    style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
                                >
                                    <img 
                                        src={banners[currentBanner].image} 
                                        alt={banners[currentBanner].title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        padding: '32px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        background: 'linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 100%)'
                                    }}>
                                        <h2 className="banner-title" style={{ color: '#FFF', fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: '900', margin: 0, lineHeight: '1', whiteSpace: 'pre-line' }}>
                                            {banners[currentBanner].title}
                                        </h2>
                                        <div style={{ 
                                            display: 'inline-block',
                                            background: banners[currentBanner].color, 
                                            color: '#FFF', 
                                            padding: '4px 12px', 
                                            borderRadius: '4px', 
                                            fontWeight: '900',
                                            fontSize: '0.8rem',
                                            marginTop: '12px',
                                            width: 'fit-content'
                                        }}>
                                            {banners[currentBanner].subtitle}
                                        </div>
                                        <button 
                                            onClick={() => navigate(banners[currentBanner].link)}
                                            style={{
                                                marginTop: '20px',
                                                padding: '12px 28px',
                                                background: '#FFFFFF',
                                                color: '#000',
                                                border: 'none',
                                                borderRadius: '12px',
                                                fontWeight: '900',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                width: 'fit-content',
                                                boxShadow: '0 4px 15px rgba(255,255,255,0.2)'
                                            }}
                                        >
                                            Get this service
                                        </button>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            gap: '8px', 
                            marginTop: '16px' 
                        }}>
                            {banners.map((_, i) => (
                                <div 
                                    key={i}
                                    onClick={() => setCurrentBanner(i)}
                                    style={{
                                        width: i === currentBanner ? '24px' : '8px',
                                        height: '8px',
                                        borderRadius: '4px',
                                        background: i === currentBanner ? '#000' : '#DDD',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer'
                                    }}
                                />
                            ))}
                        </div>
                    </section>
                )}

                <AnimatePresence>
                    {activeToken && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            onClick={() => navigate('/profile')}
                            style={{
                                background: 'linear-gradient(135deg, #276EF1 0%, #0052D4 100%)',
                                padding: '22px 32px',
                                borderRadius: '32px',
                                color: '#FFFFFF',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '40px',
                                cursor: 'pointer',
                                boxShadow: '0 10px 30px rgba(39, 110, 241, 0.3)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                <div style={{ fontSize: '1.35rem', fontWeight: '950', opacity: 1 }}>
                                    Q{activeToken.token_number}
                                </div>
                                <div style={{ width: '1.5px', height: '32px', background: 'rgba(255,255,255,0.2)' }} />
                                <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: '800', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4px' }}>{activeToken.shops?.name}</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '950', lineHeight: 1.2 }}>
                                        {activeToken.status === 'called' ? "It's TrimTime! Move to counter" : `${waitMins}m estimated wait`}
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                {activeToken.status !== 'called' && targetDate && (
                                    <div style={{ transform: 'scale(1.1)' }}>
                                        <CountdownTimer 
                                            targetDate={targetDate} 
                                            totalSeconds={activeToken?.created_at ? (new Date(targetDate).getTime() - new Date(activeToken.created_at).getTime()) / 1000 : 1800}
                                            size="sm" 
                                            color="#FFFFFF"
                                            strokeColor="rgba(255,255,255,0.2)"
                                        />
                                    </div>
                                )}
                                <div style={{ opacity: 0.6, fontSize: '1.5rem', fontWeight: '300' }}>
                                    ➜
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Primary Action Cards - Vertical Pill Stack */}
                <section style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '12px',
                    marginBottom: '40px',
                    marginTop: '8px'
                }}>
                    <motion.div 
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/saloons')}
                        style={{
                            position: 'relative',
                            height: '100px',
                            borderRadius: '32px',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 12px 30px rgba(255, 75, 110, 0.15)',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <img 
                            src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1000" 
                            alt=""
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                        />
                        <div style={{ 
                            position: 'absolute', 
                            inset: 0, 
                            background: 'linear-gradient(90deg, rgba(255, 75, 110, 0.9) 0%, rgba(255, 143, 30, 0.4) 100%)',
                            padding: '24px 32px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            zIndex: 2
                        }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: '950', color: '#FFF' }}>Join a Queue</div>
                            <div style={{ fontSize: '0.85rem', color: '#FFF', fontWeight: '800', opacity: 0.9, letterSpacing: '0.5px', background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>VIEW NEARBY ➜</div>
                        </div>
                    </motion.div>

                    <motion.div 
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/shop')}
                        style={{
                            position: 'relative',
                            height: '100px',
                            borderRadius: '32px',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 12px 30px rgba(39, 110, 241, 0.15)',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <img 
                            src="https://images.unsplash.com/photo-1512690196252-75ca49372cc6?auto=format&fit=crop&q=80&w=1000" 
                            alt=""
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                        />
                        <div style={{ 
                            position: 'absolute', 
                            inset: 0, 
                            background: 'linear-gradient(90deg, rgba(39, 110, 241, 0.9) 0%, rgba(88, 86, 214, 0.4) 100%)',
                            padding: '24px 32px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            zIndex: 2
                        }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: '950', color: '#FFF' }}>Shop Products</div>
                            <div style={{ fontSize: '0.85rem', color: '#FFF', fontWeight: '800', opacity: 0.9, letterSpacing: '0.5px', background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>GO SHOP ➜</div>
                        </div>
                    </motion.div>
                </section>

                {/* Features / What we do - Auto Scrolling Split Banner */}
                <section style={{ marginBottom: '56px' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '950', color: '#000' }}>What we do</h2>
                        <p style={{ color: '#666', fontSize: '0.9rem', fontWeight: '500' }}>Your grooming, digitally reimagined</p>
                    </div>

                    <div style={{
                        position: 'relative',
                        height: '280px',
                        borderRadius: '32px',
                        overflow: 'hidden',
                        background: '#111',
                        border: '1px solid rgba(255,255,255,0.05)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                    }}>
                        {[
                            {
                                title: "Digital Queue",
                                desc: "Join any queue from home. No physical waiting, just seamless entry.",
                                image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1200",
                                accent: "#FF4B6E",
                                link: "/saloons"
                            },
                            {
                                title: "Live Tracking",
                                desc: "Real-time position updates. Know exactly when it's your turn for a cut.",
                                image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=1200",
                                accent: "#276EF1",
                                link: "/saloons"
                            },
                            {
                                title: "Smart Discovery",
                                desc: "Find elite shops nearby. Discover specialists based on your style.",
                                image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1200",
                                accent: "#05A357",
                                link: "/saloons"
                            }
                        ].map((item, i) => i === currentFeature && (
                            <motion.div
                                key={i}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                onDragEnd={(e, { offset, velocity }) => {
                                    const swipe = offset.x;
                                    if (swipe < -50) {
                                        setCurrentFeature((currentFeature + 1) % 3);
                                    } else if (swipe > 50) {
                                        setCurrentFeature((currentFeature - 1 + 3) % 3);
                                    }
                                }}
                                initial={{ opacity: 1 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 1 }}
                                transition={{ duration: 0 }}
                                style={{ 
                                    position: 'absolute', 
                                    inset: 0, 
                                    display: 'flex',
                                    cursor: 'pointer',
                                    touchAction: 'none'
                                }}
                                onClick={() => navigate(item.link)}
                            >
                                    {/* Text Content */}
                                    <div style={{ 
                                        flex: 1.2, 
                                        padding: '40px', 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        justifyContent: 'center',
                                        zIndex: 2,
                                        background: 'linear-gradient(135deg, #222 0%, #111 100%)'
                                    }}>
                                        <div style={{ 
                                            width: '40px', 
                                            height: '4px', 
                                            background: item.accent, 
                                            borderRadius: '2px', 
                                            marginBottom: '20px' 
                                        }} />
                                        <h3 style={{ fontSize: '2rem', fontWeight: '950', color: '#FFF', marginBottom: '12px', lineHeight: '1' }}>
                                            {item.title}
                                        </h3>
                                        <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6', fontWeight: '500', margin: 0 }}>
                                            {item.desc}
                                        </p>
                                        <div style={{ marginTop: '24px', color: '#FFF', fontSize: '0.8rem', fontWeight: '900', letterSpacing: '1px', opacity: 0.9 }}>
                                            EXPLORE NOW ➜
                                        </div>
                                    </div>

                                    {/* Image Content */}
                                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                                        <img 
                                            src={item.image} 
                                            alt={item.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <div style={{ 
                                            position: 'absolute', 
                                            inset: 0, 
                                            background: `linear-gradient(90deg, #111 0%, transparent 100%)` 
                                        }} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>


                {/* Top Saloons Section */}
                <section id="shops" style={{ marginBottom: '48px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#000000' }}>
                            Top Saloons Nearby
                        </h2>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                onClick={() => navigate('/saloons')}
                                style={{ color: '#276EF1', background: 'none', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>
                                View all
                            </button>
                            <button 
                                onClick={getLocation}
                                style={{ color: '#000', opacity: 0.6, background: 'none', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>
                                {geoLoading ? 'Finding...' : 'Update Location 📍'}
                            </button>
                        </div>
                    </div>
                    <div style={{ 
                        display: 'flex', 
                        gap: '20px', 
                        overflowX: 'auto', 
                        paddingBottom: '20px',
                        scrollbarWidth: 'none'
                    }}>
                        {filteredShops.map((shop, i) => (
                            <motion.div
                                key={shop.id || `shop-${i}`}
                                onClick={() => handleSelectShop(shop.id)}
                                style={{
                                    width: '200px',
                                    flexShrink: 0,
                                    borderRadius: '20px',
                                    overflow: 'hidden',
                                    background: '#FFFFFF',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                                    cursor: 'pointer',
                                    border: '1px solid rgba(0,0,0,0.03)'
                                }}
                            >
                                <div style={{ aspectRatio: '1/1', background: '#EEE', position: 'relative', overflow: 'hidden' }}>
                                    <img 
                                        src={shop.image_url || `/assets/${['salman.jpeg', 'sparkle.jpeg', 'sunny.jpg'][i % 3]}`} 
                                        alt={shop.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    {shop.distance && (
                                        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '800' }}>
                                            {formatDistance(shop.distance)}
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: '16px' }}>
                                    <div style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '4px' }}>{shop.name}</div>
                                    <div style={{ color: '#545454', fontSize: '0.85rem', marginBottom: '12px' }}>{shop.address || 'Premium Grooming Studio'}</div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <div style={{ background: '#F3F3F3', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>
                                            {queueData[shop.id] || 0} in queue
                                        </div>
                                        <div style={{ background: '#E7F0FE', color: '#276EF1', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>
                                            {(queueData[shop.id] || 0) * AVG_TIME_MINS}m wait
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
                
                {/* Brand Mission Section - Auto Scrolling Banner */}
                <section style={{ marginBottom: '56px' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#000' }}>Our Vision</h2>
                        <p style={{ color: '#666', fontSize: '0.9rem', fontWeight: '500' }}>What we are building together</p>
                    </div>

                    <div style={{
                        position: 'relative',
                        height: '320px',
                        borderRadius: '32px',
                        overflow: 'hidden',
                        background: '#000',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                    }}>
                        <AnimatePresence mode="wait">
                            {[
                                {
                                    title: "Zero Wait Culture",
                                    statement: "Redefining grooming by valuing your time. No physical queues, just seamless digital entry.",
                                    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1200",
                                    icon: "⏳",
                                    link: "/saloons",
                                    label: "EXPLORE SERVICES"
                                },
                                {
                                    title: "Master Craftsmanship",
                                    statement: "Connecting you with elite specialists who treat every cut as a masterpiece.",
                                    image: "https://images.unsplash.com/photo-1599351474290-288d8481d863?auto=format&fit=crop&q=80&w=1200",
                                    icon: "✂️",
                                    link: "/saloons",
                                    label: "FIND BARBERS"
                                },
                                {
                                    title: "Style Innovation",
                                    statement: "Leveraging technology to make premium grooming accessible. The future is here.",
                                    image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=1200",
                                    icon: "⚡",
                                    link: "/shop",
                                    label: "SHOP PRODUCTS"
                                }
                            ].map((brand, i) => i === currentVision && (
                                <motion.div
                                    key={i}
                                    drag="x"
                                    dragConstraints={{ left: 0, right: 0 }}
                                    onDragEnd={(e, { offset, velocity }) => {
                                        const swipe = offset.x;
                                        if (swipe < -50) {
                                            setCurrentVision((currentVision + 1) % 3);
                                        } else if (swipe > 50) {
                                            setCurrentVision((currentVision - 1 + 3) % 3);
                                        }
                                    }}
                                    initial={{ opacity: 0, scale: 1.05 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                    style={{ position: 'absolute', inset: 0, cursor: 'pointer', touchAction: 'none' }}
                                    onClick={() => navigate(brand.link)}
                                >
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1 }} />
                                    <img 
                                        src={brand.image} 
                                        alt={brand.title}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        zIndex: 2,
                                        padding: '40px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        maxWidth: '500px'
                                    }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>{brand.icon}</div>
                                        <h3 style={{ color: '#FFF', fontSize: '2.5rem', fontWeight: '950', marginBottom: '16px', lineHeight: '1' }}>
                                            {brand.title}
                                        </h3>
                                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', fontWeight: '500', marginBottom: '32px', lineHeight: '1.6' }}>
                                            {brand.statement}
                                        </p>
                                        <div style={{ 
                                            background: '#276EF1', 
                                            color: '#FFF', 
                                            padding: '12px 24px', 
                                            borderRadius: '12px', 
                                            fontWeight: '900',
                                            fontSize: '0.8rem',
                                            width: 'fit-content',
                                            letterSpacing: '1px'
                                        }}>
                                            {brand.label} ➜
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Slide Indicators */}
                        <div style={{ 
                            position: 'absolute', 
                            bottom: '24px', 
                            right: '40px', 
                            display: 'flex', 
                            gap: '8px',
                            zIndex: 10
                        }}>
                            {[0, 1, 2].map(i => (
                                <div 
                                    key={i}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentVision(i);
                                    }}
                                    style={{
                                        width: i === currentVision ? '32px' : '8px',
                                        height: '8px',
                                        borderRadius: '4px',
                                        background: i === currentVision ? '#FFF' : 'rgba(255,255,255,0.3)',
                                        transition: 'all 0.4s ease',
                                        cursor: 'pointer'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                <section style={{ marginBottom: '56px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div>
                            <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#000000', marginBottom: '4px' }}>Explore Services</h2>
                            <p style={{ color: '#666', fontSize: '0.85rem', fontWeight: '500' }}>Curated grooming experiences for you</p>
                        </div>
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsServicesExpanded(!isServicesExpanded)}
                            style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#f5f5f5',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '12px',
                                color: '#000',
                                fontWeight: '700', 
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            {isServicesExpanded ? 'View Less' : 'View All'}
                            <motion.svg 
                                animate={{ rotate: isServicesExpanded ? 180 : 0 }}
                                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </motion.svg>
                        </motion.button>
                    </div>
                    <motion.div 
                        layout
                        className="services-grid" 
                        style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '20px',
                            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        {(isServicesExpanded ? availableServices : availableServices.slice(0, 8)).map((service, i) => {
                                const serviceName = service.name;
                                const serviceId = service.id;
                                const serviceImg = service.image_url;

                                return (
                                    <motion.div
                                        layout
                                        key={serviceId || serviceName || `service-${i}`}
                                        whileHover={{ y: -5, background: 'linear-gradient(145deg, #2A2A2A 0%, #1A1A1A 100%)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => navigate(`/saloons?service=${encodeURIComponent(serviceName)}`)}
                                        className="grid-card uber-style-card"
                                        style={{
                                            width: '100%',
                                            aspectRatio: '1/1',
                                            borderRadius: '28px',
                                            background: 'linear-gradient(145deg, #888888 0%, #111111 60%, #000000 100%)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            textAlign: 'center',
                                            padding: '24px',
                                            cursor: 'pointer',
                                            color: '#FFF',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            border: '1px solid rgba(255,255,255,0.03)',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
                                        }}
                                    >
                                        <div className="service-icon-container" style={{
                                            width: '40px',
                                            height: '40px',
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '16px',
                                            color: '#FFFFFF'
                                        }}>
                                            <CircleIcon />
                                        </div>
                                        <div className="service-label" style={{ position: 'relative', zIndex: 2 }}>
                                            <div style={{ 
                                                fontWeight: '300', 
                                                fontSize: '0.75rem', 
                                                lineHeight: '1.2',
                                                letterSpacing: '1.5px',
                                                color: '#FFFFFF',
                                                textTransform: 'uppercase',
                                                opacity: 0.9
                                            }}>
                                                {serviceName}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </section>

                {/* Brand Promise Banner with Image */}
                <section style={{ marginBottom: '48px' }}>
                    <div style={{
                        position: 'relative',
                        background: '#FFFFFF',
                        borderRadius: '24px',
                        border: '1px solid #EEEEEE',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        minHeight: '200px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                    }}>
                        <div style={{ flex: 1, padding: '40px', zIndex: 2 }}>
                            <div style={{ color: '#276EF1', fontWeight: '800', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>Our Promise</div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#000', marginBottom: '8px' }}>Your Time. Your Style. No Waiting.</h2>
                            <p style={{ color: '#545454', fontSize: '1rem', maxWidth: '400px', fontWeight: '500' }}>TrimTime connects you with the best grooming professionals, ensuring you never waste a minute in a queue again.</p>
                        </div>
                        <div style={{ width: '40%', height: '100%', position: 'absolute', right: 0, top: 0 }}>
                            <img 
                                src="/assets/sparkle.jpeg" 
                                alt="Grooming" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15, maskImage: 'linear-gradient(to left, black, transparent)' }} 
                            />
                        </div>
                    </div>
                </section>
                
                {/* Shop Categories - Now Uber-style Grid */}
                {productCategories.length > 0 && (
                    <section style={{ marginBottom: '56px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#000000', marginBottom: '4px' }}>Explore Categories</h2>
                                <p style={{ color: '#666', fontSize: '0.85rem', fontWeight: '500' }}>Premium products for your routine</p>
                            </div>
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                                style={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: '#f5f5f5',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '12px',
                                    color: '#000',
                                    fontWeight: '700', 
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                {isCategoriesExpanded ? 'View Less' : 'View All'}
                                <motion.svg 
                                    animate={{ rotate: isCategoriesExpanded ? 180 : 0 }}
                                    width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                >
                                    <polyline points="6 9 12 15 18 9" />
                                </motion.svg>
                            </motion.button>
                        </div>
                        <motion.div 
                            layout
                            className="services-grid" 
                            style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '20px',
                                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            {(isCategoriesExpanded ? productCategories : productCategories.slice(0, 8)).map((cat, i) => {
                                const catName = typeof cat === 'string' ? cat : cat.name;
                                const catId = typeof cat === 'string' ? cat : cat.id;
                                const catImg = typeof cat === 'object' ? cat.image_url : null;

                                return (
                                    <motion.div
                                        layout
                                        key={catId || `cat-${i}`}
                                        whileHover={{ y: -5, background: 'linear-gradient(135deg, #2A2A2A 0%, #1A1A1A 100%)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => navigate(`/shop?category=${encodeURIComponent(catName)}`)}
                                        className="grid-card uber-style-card"
                                        style={{
                                            width: '100%',
                                            aspectRatio: '1/1',
                                            borderRadius: '28px',
                                            background: catImg 
                                                ? `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.7)), url(${catImg})` 
                                                : 'linear-gradient(145deg, #888888 0%, #111111 60%, #000000 100%)',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            textAlign: 'center',
                                            padding: '24px',
                                            cursor: 'pointer',
                                            color: '#FFF',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            border: '1px solid rgba(255,255,255,0.03)',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
                                        }}
                                    >
                                        <div className="service-icon-container" style={{ 
                                            display: 'flex',
                                            width: '40px',
                                            height: '40px',
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '12px',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '16px'
                                        }}>
                                            {catImg ? (
                                                <img src={catImg} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain', opacity: 0.8 }} />
                                            ) : (
                                                <CircleIcon />
                                            )}
                                        </div>
                                        <div className="service-label" style={{ 
                                            fontWeight: '300', 
                                            fontSize: '0.7rem', 
                                            lineHeight: '1.2',
                                            letterSpacing: '1.2px', 
                                            zIndex: 1,
                                            textAlign: 'center',
                                            textTransform: 'uppercase',
                                            color: '#FFF',
                                            opacity: 0.9
                                        }}>
                                            {catName}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </section>
                )}

                {/* Book by Barber Section */}


                {/* Trending Stylists Slider */}
                {staff.length > 0 && (
                    <section style={{ marginBottom: '56px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#000', marginBottom: '4px' }}>Trending Specialists</h2>
                                <p style={{ color: '#666', fontSize: '0.9rem', fontWeight: '500' }}>Most requested stylists this week</p>
                            </div>
                            <button 
                                onClick={() => navigate('/barbers')}
                                style={{ color: '#276EF1', background: 'none', border: 'none', fontWeight: '700', cursor: 'pointer' }}
                            >
                                View all
                            </button>
                        </div>
                        <div style={{ 
                            display: 'flex', 
                            gap: '24px', 
                            overflowX: 'auto', 
                            paddingBottom: '24px',
                            scrollbarWidth: 'none',
                            paddingRight: '20px'
                        }}>
                            {[...staff].reverse().slice(0, 6).map((barber, i) => (
                                <motion.div
                                    key={`trending-${barber.id || i}`}
                                    whileHover={{ y: -10 }}
                                    onClick={() => navigate(`/barbers/${barber.id}`)}
                                    style={{
                                        minWidth: '240px',
                                        height: '320px',
                                        borderRadius: '24px',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        background: '#000',
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <img 
                                        src={barber.image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${barber.id}`} 
                                        alt={barber.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        padding: '24px',
                                        background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px'
                                    }}>
                                        <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                                            {[1,2,3,4,5].map(s => (
                                                <span key={s} style={{ color: '#FFD700', fontSize: '0.7rem' }}>★</span>
                                            ))}
                                        </div>
                                        <h3 style={{ color: '#FFF', fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>{barber.name}</h3>
                                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: '600', margin: 0 }}>{barber.shops?.name}</p>
                                        <div style={{
                                            marginTop: '12px',
                                            background: '#276EF1',
                                            color: '#FFF',
                                            padding: '8px 16px',
                                            borderRadius: '10px',
                                            fontSize: '0.8rem',
                                            fontWeight: '800',
                                            textAlign: 'center'
                                        }}>
                                            Book Specialist
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}


                {/* Products Showcase */}
                <section id="products" style={{ marginBottom: '56px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div>
                            <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#000', marginBottom: '4px' }}>Shop Products</h2>
                            <p style={{ color: '#666', fontSize: '0.9rem', fontWeight: '500' }}>Premium grooming essentials delivered</p>
                        </div>
                        <button 
                            onClick={() => navigate('/shop')}
                            style={{ color: '#276EF1', background: 'none', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            View all ➜
                        </button>
                    </div>
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateRows: 'repeat(2, auto)',
                        gridAutoFlow: 'column',
                        gap: '16px',
                        overflowX: 'auto',
                        paddingBottom: '24px',
                        scrollbarWidth: 'none',
                        paddingRight: '20px'
                    }}>
                        {filteredProducts.slice(0, 12).map((product, i) => (
                            <motion.div
                                key={product.id || `product-${i}`}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedProduct(product)}
                                style={{
                                    width: '180px',
                                    borderRadius: '24px',
                                    background: '#FFFFFF',
                                    border: '1px solid #F0F0F0',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '12px'
                                }}
                            >
                                <div style={{ 
                                    aspectRatio: '1/1', 
                                    borderRadius: '16px', 
                                    overflow: 'hidden', 
                                    background: '#F9F9F9',
                                    marginBottom: '12px'
                                }}>
                                    <img 
                                        src={product.image_url || `/assets/${['hair gel.webp', 'roller comb.jpg', 'shampo.jpg'][i % 3]}`} 
                                        alt={product.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#000', marginBottom: '8px', lineHeight: '1.2' }}>
                                        {product.name}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: '900', fontSize: '1.1rem', color: '#000' }}>₹{product.price}</div>
                                        <motion.button 
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                                            style={{ 
                                                background: '#000000', 
                                                color: '#FFFFFF', 
                                                border: 'none', 
                                                width: '32px', 
                                                height: '32px', 
                                                borderRadius: '10px', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                cursor: 'pointer' 
                                            }}>
                                            <span style={{ fontSize: '1.2rem', marginTop: '-2px' }}>+</span>
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
                {/* Onboarding CTA for Shop Owners & Barbers */}
                <section style={{ padding: '60px 5%', background: '#000000', margin: '40px 0', borderRadius: '40px 40px 0 0', position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                        position: 'absolute',
                        top: '-50%',
                        right: '-20%',
                        width: '500px',
                        height: '500px',
                        background: 'radial-gradient(circle, rgba(39, 110, 241, 0.15) 0%, transparent 70%)',
                        pointerEvents: 'none'
                    }} />
                    
                    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px', position: 'relative', zIndex: 1 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#276EF1', fontWeight: '800', letterSpacing: '2px', fontSize: '0.9rem', marginBottom: '16px' }}>PARTNER WITH US</div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#FFFFFF', lineHeight: '1.1', marginBottom: '20px' }}>
                                Scale your shop to <br/>the next level.
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                                Join the elite network of premium salons and barbers using TrimTime to manage queues and boost revenue.
                            </p>
                        </div>

                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                            gap: '20px',
                            marginTop: '20px'
                        }}>
                            {/* Contact Details Card */}
                            <div style={{ 
                                background: 'rgba(255,255,255,0.05)', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                borderRadius: '32px', 
                                padding: '32px',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(39, 110, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#276EF1', fontSize: '1.2rem' }}>📧</div>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Email Us</div>
                                            <div style={{ color: '#FFFFFF', fontWeight: '700' }}>trimtimes@gmail.com</div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(5, 163, 87, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#05A357', fontSize: '1.2rem' }}>📞</div>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Call / WhatsApp</div>
                                            <div style={{ color: '#FFFFFF', fontWeight: '700' }}>+91 9981284141</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(255, 192, 67, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFC043', fontSize: '1.2rem' }}>📍</div>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Our Office</div>
                                            <div style={{ color: '#FFFFFF', fontWeight: '700' }}>Bansal One, Bhopal</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CTA Form/Button Area */}
                            <div style={{ 
                                background: '#276EF1', 
                                borderRadius: '32px', 
                                padding: '32px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                textAlign: 'center',
                                color: '#FFFFFF'
                            }}>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '12px' }}>Become a Partner</h3>
                                <p style={{ opacity: 0.9, marginBottom: '24px', fontSize: '0.95rem' }}>
                                    Ready to automate your queue? <br/>Get started with our premium tools today.
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => window.open(`https://wa.me/919981284141?text=${encodeURIComponent("Hello! I'm interested in onboarding my shop with TrimTime. Please provide more details.")}`, '_blank')}
                                    style={{
                                        background: '#FFFFFF',
                                        color: '#276EF1',
                                        border: 'none',
                                        padding: '16px 40px',
                                        borderRadius: '50px',
                                        fontWeight: '900',
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    Get Onboarded Now
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </section>
                {/* Product Detail Modal */}
                <AnimatePresence>
                    {selectedProduct && (
                        <div style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px'
                        }}>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedProduct(null)}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'rgba(0,0,0,0.8)',
                                    backdropFilter: 'blur(10px)'
                                }}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                style={{
                                    position: 'relative',
                                    width: '100%',
                                    maxWidth: '900px',
                                    background: '#FFFFFF',
                                    borderRadius: '32px',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                                    boxShadow: '0 30px 60px rgba(0,0,0,0.3)'
                                }}
                            >
                                <button 
                                    onClick={() => setSelectedProduct(null)}
                                    style={{
                                        position: 'absolute',
                                        top: '20px',
                                        right: '20px',
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'rgba(0,0,0,0.05)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        zIndex: 10,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.2rem',
                                        fontWeight: '800'
                                    }}
                                >✕</button>

                                <div style={{ 
                                    flex: 1, 
                                    background: '#F9F9F9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '40px'
                                }}>
                                    <img 
                                        src={selectedProduct.image_url || '/assets/hair gel.webp'} 
                                        alt={selectedProduct.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '16px' }}
                                    />
                                </div>

                                <div style={{ 
                                    flex: 1, 
                                    padding: '40px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center'
                                }}>
                                    <div style={{ color: '#276EF1', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>
                                        {selectedProduct.category_name || 'Premium Essential'}
                                    </div>
                                    <h2 style={{ fontSize: '2rem', fontWeight: '900', color: '#000', marginBottom: '16px', lineHeight: '1.1' }}>
                                        {selectedProduct.name}
                                    </h2>
                                    <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#000', marginBottom: '24px' }}>
                                        ₹{selectedProduct.price}
                                    </div>
                                    <p style={{ color: '#666', fontSize: '1rem', lineHeight: '1.6', marginBottom: '32px', fontWeight: '500' }}>
                                        {selectedProduct.description || 'Elevate your grooming routine with this professional-grade essential. Designed for precision and lasting results.'}
                                    </p>

                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                addToCart(selectedProduct);
                                                // Optional: show some feedback
                                            }}
                                            style={{
                                                flex: 1,
                                                background: '#f5f5f5',
                                                color: '#000',
                                                border: 'none',
                                                padding: '18px',
                                                borderRadius: '16px',
                                                fontWeight: '800',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            ADD TO CART
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                addToCart(selectedProduct, false);
                                                navigate('/checkout');
                                            }}
                                            style={{
                                                flex: 1.5,
                                                background: '#000',
                                                color: '#FFF',
                                                border: 'none',
                                                padding: '18px',
                                                borderRadius: '16px',
                                                fontWeight: '800',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            BUY NOW
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>

            {/* Simple Footer */}
            <footer style={{ padding: '48px 5%', borderTop: '1px solid #EEEEEE', marginTop: '48px', color: '#545454', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ fontWeight: '900', color: '#000000' }}>TRIMTIME.</div>
                    <div style={{ display: 'flex', gap: '24px' }}>
                        <span>© 2026 TrimTime</span>
                        <span>Privacy</span>
                        <span>Terms</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
