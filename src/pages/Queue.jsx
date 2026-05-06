import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useShop } from '../contexts/ShopContext';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import CountdownTimer from '../components/common/CountdownTimer';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistance } from '../utils/geoUtils';

const AVG_TIME_MINS = 15;

const Queue = () => {
    const { currentShopId, setCurrentShopId, shops } = useShop();
    const { user, signup, login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    // Check URL first to prevent premature redirect
    const urlShopId = searchParams.get('shopId');
    const effectiveShopId = urlShopId || currentShopId;

    // Use an effect for redirection instead of a guard clause in render
    // This gives the ShopContext time to update from the URL
    useEffect(() => {
        if (!effectiveShopId && shops.length > 0) {
            // Only redirect if we have no shop ID and shops have finished loading
            const timer = setTimeout(() => {
                if (!searchParams.get('shopId') && !currentShopId) {
                    navigate('/');
                }
            }, 1000); // Give it a full second to settle
            return () => clearTimeout(timer);
        }
    }, [effectiveShopId, shops, currentShopId, searchParams, navigate]);

    // Don't render full page if we definitely don't have a shop ID yet
    if (!effectiveShopId && shops.length === 0) {
        return (
            <div style={{ 
                minHeight: '100vh', 
                background: 'var(--background)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--text-muted)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="loader" style={{ marginBottom: '20px', borderTopColor: 'var(--primary)' }}></div>
                    <p style={{ fontSize: '0.9rem', fontWeight: '500', letterSpacing: '0.05em' }}>PREPARING YOUR QUEUE...</p>
                </div>
            </div>
        );
    }

    const shop = shops.find(s => s.id === currentShopId) || {};
    
    const [services, setServices] = useState([]);
    const [activeStaff, setActiveStaff] = useState([]);
    const [selectedServiceIds, setSelectedServiceIds] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState(null);

    // Booking Flow State
    const [bookingStage, setBookingStage] = useState('idle'); 
    const [customerName, setCustomerName] = useState(user?.user_metadata?.name || '');
    const [customerPhone, setCustomerPhone] = useState(user?.user_metadata?.phone || '');

    // Auth Modal states
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('signup');
    const [authPassword, setAuthPassword] = useState('');
    const [authError, setAuthError] = useState('');

    const [generatedToken, setGeneratedToken] = useState(null);
    const [activeTokens, setActiveTokens] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const urlShopId = searchParams.get('shopId');
        const urlStaffId = searchParams.get('staffId');
        const urlService = searchParams.get('service');

        if (urlShopId && urlShopId !== currentShopId) {
            setCurrentShopId(urlShopId);
        }

        if (user) {
            setCustomerName(user.user_metadata?.name || '');
            setCustomerPhone(user.user_metadata?.phone || '');
        } else {
            setCustomerName('');
            setCustomerPhone('');
        }

        const fetchInitialData = async () => {
            const activeShopId = urlShopId || currentShopId;
            if (!activeShopId) return;

            const { data: queueData } = await supabase
                .from('tokens')
                .select('*')
                .eq('shop_id', activeShopId)
                .in('status', ['pending', 'called', 'skipped'])
                .order('token_number', { ascending: true });
            if (queueData) setActiveTokens(queueData);

            const { data: serviceData } = await supabase
                .from('services')
                .select('*')
                .eq('shop_id', activeShopId)
                .neq('is_active', false);
            
            if (serviceData) {
                setServices(serviceData);
                if (urlService) {
                    const matched = serviceData.find(s => s.name === urlService);
                    if (matched) {
                        setSelectedServiceIds([matched.id]);
                        setBookingStage('details'); // Move to details if service is pre-selected
                    }
                }
            }

            const { data: staffData } = await supabase
                .from('staff')
                .select('*')
                .eq('shop_id', activeShopId)
                .eq('is_active', true);
            
            if (staffData) {
                setActiveStaff(staffData);
                if (urlStaffId) {
                    setSelectedStaffId(urlStaffId);
                }
            }
        };

        fetchInitialData();

        const activeShopId = urlShopId || currentShopId;
        if (activeShopId) {
            const channel = supabase
                .channel('queue_changes')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'tokens', filter: `shop_id=eq.${activeShopId}` }, 
                    () => fetchInitialData()
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user, currentShopId, searchParams]);

    const nowServing = activeTokens.filter(t => t.status === 'called').map(t => t.token_number);

    const getStaffWait = (staffId, tokenToInclude = null) => {
        const DEFAULT_AVG_TIME = 15;
        
        // Helper to get duration of a token based on selected services
        const getTokenDuration = (token) => {
            if (!token.services_selected || !Array.isArray(token.services_selected) || token.services_selected.length === 0) {
                return DEFAULT_AVG_TIME;
            }
            const serviceTimes = token.services_selected.map(sid => {
                const s = services.find(serv => serv.id === sid || serv.name === sid);
                return s ? s.avg_time : DEFAULT_AVG_TIME;
            });
            return serviceTimes.reduce((a, b) => a + b, 0);
        };

        if (staffId) {
            // Find who this staff is currently serving
            const currentlyServing = activeTokens.find(t => 
                (t.status === 'called' || t.status === 'serving') && t.staff_id === staffId
            );
            
            let baseMins = 0;
            if (currentlyServing) {
                const expectedDuration = getTokenDuration(currentlyServing);
                const calledAt = new Date(currentlyServing.called_at || currentlyServing.created_at);
                const elapsedMins = (Date.now() - calledAt.getTime()) / 60000;
                // Minimum 1 min buffer for active services
                baseMins = Math.max(1, Math.ceil(expectedDuration - elapsedMins));
            }

            // Get pending tokens for this staff
            let pendingForStaff = activeTokens.filter(t => 
                t.status === 'pending' && t.preferred_staff_id === staffId
            );

            // Ensure the specific token we're estimating for is accounted for
            if (tokenToInclude && tokenToInclude.preferred_staff_id === staffId) {
                const exists = pendingForStaff.some(t => t.id === tokenToInclude.id || t.token_number === tokenToInclude.token_number);
                if (!exists) {
                    pendingForStaff = [...pendingForStaff, tokenToInclude].sort((a, b) => a.token_number - b.token_number);
                }
            }
            
            let totalWait = baseMins;
            const targetTokenNum = tokenToInclude?.token_number || Infinity;
            
            // Sum durations of everyone ahead of the target token
            const ahead = pendingForStaff.filter(t => t.token_number < targetTokenNum);
            ahead.forEach(t => {
                totalWait += getTokenDuration(t);
            });

            // If it's a general check (not for a specific token), include everyone
            if (!tokenToInclude) {
                // totalWait already has baseMins and ahead. If no tokenToInclude, ahead is everyone.
                pendingForStaff.forEach(t => {
                    // This part is for the "Fastest" or "Staff Card" display
                    // It should show total wait for the NEXT person joining.
                });
                // Wait, let's simplify:
                const totalMins = baseMins + pendingForStaff.reduce((acc, t) => acc + getTokenDuration(t), 0);
                return { 
                    count: pendingForStaff.length, 
                    mins: totalMins,
                    isBusy: !!currentlyServing,
                    servingToken: currentlyServing ? currentlyServing.token_number : null
                };
            }

            return { 
                count: pendingForStaff.length, 
                mins: totalWait,
                isBusy: !!currentlyServing,
                servingToken: currentlyServing ? currentlyServing.token_number : null
            };
        } else {
            // General queue estimation (Fastest Option)
            let anyPending = activeTokens.filter(t => t.status === 'pending' && !t.preferred_staff_id);
            
            if (tokenToInclude && !tokenToInclude.preferred_staff_id) {
                const exists = anyPending.some(t => t.id === tokenToInclude.id || t.token_number === tokenToInclude.token_number);
                if (!exists) {
                    anyPending = [...anyPending, tokenToInclude].sort((a, b) => a.token_number - b.token_number);
                }
            }

            const staffCount = activeStaff.length || 1;
            let totalPendingMins = anyPending.reduce((acc, t) => acc + getTokenDuration(t), 0);
            
            // For general queue, we divide total work by available staff
            const avgMins = Math.ceil(totalPendingMins / staffCount);
            
            return { 
                count: anyPending.length, 
                mins: Math.max(DEFAULT_AVG_TIME, avgMins),
                isBusy: false,
                servingToken: null
            };
        }
    };

    const getEstimatedWait = (tokenObj) => {
        const targetStaffId = tokenObj?.preferred_staff_id || selectedStaffId;
        return getStaffWait(targetStaffId, tokenObj);
    };

    const waitInfo = getEstimatedWait();

    // Check if the current user has an active token
    const myActiveToken = activeTokens.find(t => 
        t.customer_phone === customerPhone && 
        (t.status === 'pending' || t.status === 'called')
    );

    // Get who is currently being served and who is next for each staff
    const servingOverview = activeStaff.map(s => {
        const serving = activeTokens.find(t => t.status === 'called' && t.staff_id === s.id);
        const next = activeTokens.find(t => t.status === 'pending' && t.preferred_staff_id === s.id);
        return { staff: s, serving, next };
    });

    const anyServing = activeTokens.find(t => t.status === 'called' && !t.preferred_staff_id);

    const getPosition = (token) => {
        if (!token || token.status !== 'pending') return 0;
        return activeTokens.filter(t => 
            t.status === 'pending' && 
            t.preferred_staff_id === token.preferred_staff_id &&
            t.token_number < token.token_number
        ).length;
    };

    const generateToken = async () => {
        if (!customerName || !customerPhone) {
            alert('Please provide name and phone number');
            setBookingStage('details');
            return;
        }

        setLoading(true);
        try {
            const { data: lastTokens, error: lastError } = await supabase
                .from('tokens')
                .select('token_number')
                .order('token_number', { ascending: false })
                .limit(1);

            if (lastError) throw lastError;

            const nextQueueNo = (lastTokens && lastTokens.length > 0) ? lastTokens[0].token_number + 1 : 1;

            const { data, error } = await supabase
                .from('tokens')
                .insert([
                    {
                        token_number: nextQueueNo,
                        status: 'pending',
                        services_selected: selectedServiceIds,
                        preferred_staff_id: selectedStaffId,
                        source: 'online',
                        shop_id: currentShopId,
                        customer_name: customerName,
                        customer_phone: customerPhone,
                        user_id: user?.id
                    }
                ])
                .select()
                .single();

            if (error) throw error;
            setGeneratedToken(data);
            setBookingStage('generated');

        } catch (error) {
            console.error('Error generating token:', error.message);
            alert('Failed to generate token. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setAuthError('');
        setLoading(true);
        try {
            if (authMode === 'signup') {
                await signup(customerPhone, authPassword, customerName);
            } else {
                await login(customerPhone, authPassword);
            }
            setShowAuthModal(false);
            setBookingStage('details');
        } catch (err) {
            setAuthError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const S = {
        container: {
            minHeight: '100vh',
            background: 'var(--background)',
            color: 'var(--text-main)',
            paddingTop: '80px',
            marginTop: '0px',
            paddingBottom: '120px',
            transition: 'all 0.4s ease'
        },
        hero: {
            height: '180px',
            width: '100%',
            position: 'relative',
            backgroundImage: `url(${shop.image_url || '/assets/salman.jpeg'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '16px 24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
            marginBottom: '32px'
        },
        badge: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '5px 10px',
            background: 'var(--background)',
            borderRadius: '10px',
            fontSize: '0.65rem',
            fontWeight: '900',
            color: 'var(--text-main)',
            marginBottom: '8px',
            boxShadow: 'var(--shadow-premium)',
            width: 'fit-content',
            border: '1px solid var(--border)'
        },
        title: {
            fontSize: '1.25rem',
            fontWeight: '950',
            color: 'var(--text-main)',
            margin: '0 0 6px 0',
            letterSpacing: '-0.5px',
            lineHeight: 1
        },
        infoRow: {
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            marginTop: '4px'
        },
        infoItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            fontWeight: '800'
        },
        section: {
            padding: '20px 0',
            maxWidth: '1200px',
            margin: '0 auto'
        },
        card: {
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '20px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        },
        featureTag: {
            padding: '8px 16px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            fontWeight: '800',
            color: 'var(--text-main)'
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '16px',
            marginTop: '12px'
        },
        staffItem: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'var(--surface)',
            borderRadius: '12px',
            cursor: 'pointer',
            border: '1px solid var(--border)',
            transition: 'all 0.3s ease',
            marginBottom: '8px'
        }
    };

    // Dynamic features and gallery
    const facilities = (shop.amenities && shop.amenities.length > 0) 
        ? shop.amenities 
        : ['Premium Service', 'Professional Staff', 'Clean Environment'];
    const rating = shop.rating || 5.0;
    const gallery = (shop.gallery_urls && shop.gallery_urls.length > 0) 
        ? shop.gallery_urls 
        : ['/assets/salman.jpeg', '/assets/product.jpg', '/assets/hero-bg.jpg'];
    const aboutText = shop.about_text || 'Experience the best grooming service in town. Our expert staff is here to make you look and feel your best.';

    return (
        <div style={S.container}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
                {/* Minimal Amenities Grid at Top */}
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: '24px', marginTop: '12px' }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {facilities.slice(0, 4).map((f, i) => (
                            <div key={i} style={{ 
                                background: 'var(--surface)', 
                                border: '1px solid var(--border)', 
                                borderRadius: '14px', 
                                padding: '8px 12px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px',
                            }}>
                                <div style={{ 
                                    width: '18px', 
                                    height: '18px', 
                                    borderRadius: '50%', 
                                    background: 'var(--text-main)', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--background)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <span style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Hero Section (Light Mode) - Sleeker */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: '32px' }}
                >
                    <div style={{ position: 'relative' }}>
                        <div style={S.hero} />
                        
                        {/* Header Back Button - Integrated into Banner */}
                        <motion.button 
                            whileHover={{ scale: 1.05, background: 'var(--primary-dark)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/salons')}
                            style={{ 
                                position: 'absolute',
                                top: '16px',
                                left: '16px',
                                background: 'var(--primary)', 
                                border: 'none', 
                                width: '38px', 
                                height: '38px', 
                                borderRadius: '12px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                cursor: 'pointer',
                                color: '#FFF',
                                boxShadow: '0 4px 15px rgba(39, 110, 241, 0.3)',
                                zIndex: 10
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                            </svg>
                        </motion.button>

                        {/* Overlay Content */}
                        <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px' }}>
                            <div style={S.badge}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '2px' }}>
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                                {shop.address || 'Location'}
                            </div>
                            <h1 style={{ ...S.title, color: '#FFF', textShadow: '0 2px 15px rgba(0,0,0,0.4)' }}>{shop.name}</h1>
                            <div style={S.infoRow}>
                                <div style={{ ...S.infoItem, color: '#FFF', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#fbbf24">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                    {rating}
                                </div>
                                {shop.distance !== undefined && shop.distance !== null && (
                                    <div style={{...S.infoItem, color: '#FFF', fontWeight: '900', background: 'rgba(0,0,0,0.2)', padding: '3px 10px', borderRadius: '8px', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem'}}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        {formatDistance(shop.distance)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 5%' }}>

                {/* 1. Live Queue Hub (Integrated Control Center) */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ position: 'relative', zIndex: 10, width: '100%' }}
                >
                    <div style={S.card}>
                        {/* Status Header */}
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            marginBottom: '20px',
                            paddingBottom: '16px',
                            borderBottom: '1px solid var(--border)'
                        }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ 
                                    background: 'var(--surface)', 
                                    padding: '6px 12px', 
                                    borderRadius: '10px', 
                                    fontSize: '0.7rem', 
                                    fontWeight: '900', 
                                    color: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                    </svg>
                                    Live
                                </div>
                                <div style={{ 
                                    background: 'var(--surface)', 
                                    padding: '6px 12px', 
                                    borderRadius: '10px', 
                                    fontSize: '0.7rem', 
                                    fontWeight: '900', 
                                    color: 'var(--text-main)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
                                    </svg>
                                    Premium
                                </div>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '900' }}>
                                {activeTokens.length} Active
                            </div>
                        </div>

                        {bookingStage === 'idle' && (
                            <div style={{ width: '100%' }}>
                                {/* Active Ticket - Premium Pill */}
                                {user && myActiveToken && (
                                    <motion.div 
                                        initial={{ scale: 0.98, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        whileTap={{ scale: 0.99 }}
                                         style={{ 
                                            background: 'var(--surface)', 
                                            border: '1px solid var(--border)',
                                            borderRadius: '24px',
                                            padding: '16px 20px',
                                            marginBottom: '24px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            boxShadow: '0 10px 20px rgba(0,0,0,0.02)'
                                        }}
                                        onClick={() => {
                                            setGeneratedToken(myActiveToken);
                                            setBookingStage('generated');
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#FFF', fontWeight: '950', background: 'var(--success)', padding: '4px 10px', borderRadius: '12px' }}>Active</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: '950', color: 'var(--text-main)' }}>Q{myActiveToken.token_number}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '900' }}>
                                                {myActiveToken.status === 'called' ? 'Serving' : `Pos: #${getPosition(myActiveToken) + 1}`}
                                            </span>
                                            <span style={{ color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: '900' }}>→</span>
                                        </div>v>
                                    </motion.div>
                                )}

                                {/* Unified Staff Selection & Status Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
                                    {/* Fastest Option */}
                                    <motion.div 
                                        whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.06)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            setSelectedStaffId(null);
                                            if (!user) setShowAuthModal(true);
                                            else setBookingStage('details');
                                        }}                                         style={{ 
                                            padding: '16px', 
                                            background: 'var(--surface)', 
                                            border: '1px solid var(--border)',
                                            borderRadius: '24px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            minHeight: '100px',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                                            <div style={{ fontWeight: '950', fontSize: '1rem', color: 'var(--text-main)' }}>Fastest</div>
                                        </div>v>
                                        <div style={{ 
                                            fontSize: '0.6rem', 
                                            color: 'var(--accent)', 
                                            fontWeight: '900', 
                                            textTransform: 'uppercase', 
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '2px'
                                        }}>
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                            </svg>
                                            Top Rated
                                        </div>
                                    </motion.div>

                                    {/* Staff Cards */}
                                    {activeStaff.map(s => {
                                        const sWait = getStaffWait(s.id);
                                        const currentlyServing = activeTokens.find(t => (t.status === 'called' || t.status === 'serving') && t.staff_id === s.id);
                                        return (
                                            <motion.div 
                                                key={s.id}
                                                whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.06)' }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => {
                                                    setSelectedStaffId(s.id);
                                                    if (!user) setShowAuthModal(true);
                                                    else setBookingStage('details');
                                                }}                                                 style={{ 
                                                    padding: '16px',
                                                    background: 'var(--card-bg)',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '24px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '10px',
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            > >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '0.8rem', fontWeight: '800' }}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                    Verified
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ 
                                                        width: '36px', 
                                                        height: '36px', 
                                                        borderRadius: '12px', 
                                                        backgroundImage: `url(${s.image_url || '/assets/salman.jpeg'})`,
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center',
                                                        border: `2px solid ${currentlyServing ? 'var(--success)' : 'var(--border)'}`
                                                    }} />
                                                    <div style={{ overflow: 'hidden' }}>
                                                        <div style={{ fontWeight: '950', fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                                                        <div style={{ fontSize: '0.65rem', color: currentlyServing ? 'var(--success)' : 'var(--text-muted)', fontWeight: '900' }}>
                                                            {currentlyServing ? `Q${currentlyServing.token_number}` : 'AVAILABLE'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ 
                                                    fontSize: '0.7rem', 
                                                    color: 'var(--text-muted)', 
                                                    fontWeight: '900',
                                                    borderTop: '1px solid var(--border)',
                                                    paddingTop: '8px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between'
                                                }}>
                                                    <span>WAIT</span>
                                                    <span style={{ color: 'var(--text-main)' }}>{sWait.mins}m</span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {bookingStage !== 'idle' && (
                            <div style={{ maxWidth: '320px', margin: '0 auto', padding: '10px 0' }}>
                                {/* Booking Flow Content (Details, Services, Generated) */}
                                {bookingStage === 'details' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '950', marginBottom: '4px' }}>Booking with</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: '950', color: 'var(--text-main)' }}>
                                                {selectedStaffId ? activeStaff.find(s => s.id === selectedStaffId)?.name : 'Fastest Barber'}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '4px', fontWeight: '950' }}>Wait: {waitInfo.mins} mins</div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ textAlign: 'left' }}>
                                                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '950', marginLeft: '8px', marginBottom: '6px', display: 'block', letterSpacing: '1px' }}>Full Name</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="e.g. John Doe" 
                                                    value={customerName}
                                                    onChange={e => setCustomerName(e.target.value)}
                                                    style={{ width: '100%', padding: '14px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', fontWeight: '800' }}
                                                />
                                            </div>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setBookingStage('services')}
                                                disabled={!customerName}
                                                style={{ width: '100%', padding: '16px', background: 'var(--text-main)', color: 'var(--background)', border: 'none', borderRadius: '16px', fontWeight: '950', fontSize: '1rem', cursor: 'pointer', boxShadow: 'var(--shadow-premium)', opacity: !customerName ? 0.5 : 1 }}
                                            >
                                                Select Services
                                            </motion.button>
                                            <button
                                                onClick={() => setBookingStage('idle')}
                                                style={{ width: '100%', padding: '8px', background: 'transparent', color: 'rgba(0,0,0,0.4)', border: 'none', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '900' }}
                                            >
                                                ← Change Barber
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {bookingStage === 'services' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: '950', marginBottom: '20px', color: 'var(--text-main)', textAlign: 'center' }}>Select Services</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: '24px' }}>
                                            {services.map(s => (
                                                <motion.button 
                                                    key={s.id}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setSelectedServiceIds(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                                                    style={{
                                                        padding: '14px 20px',
                                                        borderRadius: '16px',
                                                        border: '1px solid',
                                                        borderColor: selectedServiceIds.includes(s.id) ? 'var(--text-main)' : 'var(--border)',
                                                        background: selectedServiceIds.includes(s.id) ? 'var(--text-main)' : 'var(--surface)',
                                                        color: selectedServiceIds.includes(s.id) ? 'var(--background)' : 'var(--text-main)',
                                                        fontSize: '0.9rem',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid', borderColor: selectedServiceIds.includes(s.id) ? 'var(--background)' : 'var(--text-main)', background: selectedServiceIds.includes(s.id) ? 'var(--background)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {selectedServiceIds.includes(s.id) && <span style={{ color: 'var(--text-main)', fontSize: '0.7rem', fontWeight: '950' }}>✓</span>}
                                                        </div>
                                                        <span style={{ fontWeight: '900' }}>{s.name}</span>
                                                    </div>
                                                    <span style={{ fontWeight: '950', opacity: selectedServiceIds.includes(s.id) ? 1 : 0.4 }}>₹{s.price || '200'}</span>
                                                </motion.button>
                                            ))}
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={generateToken}
                                            disabled={loading || selectedServiceIds.length === 0}
                                            style={{ width: '100%', padding: '16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '950', fontSize: '1rem', cursor: 'pointer', opacity: (loading || selectedServiceIds.length === 0) ? 0.6 : 1, boxShadow: '0 10px 20px rgba(39, 110, 241, 0.2)' }}
                                        >
                                            {loading ? 'Processing...' : 'Complete Booking'}
                                        </motion.button>
                                        <button
                                            onClick={() => setBookingStage('details')}
                                            style={{ width: '100%', padding: '8px', background: 'transparent', color: 'rgba(0,0,0,0.4)', border: 'none', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '900' }}
                                        >
                                            ← Go Back
                                        </button>
                                    </motion.div>
                                )}

                                {bookingStage === 'generated' && generatedToken && (
                                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', padding: '10px 0' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '950', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
                                            Slot Reserved
                                        </div>
                                        
                                         <div style={{ background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border)', padding: '24px', marginBottom: '20px', boxShadow: 'var(--shadow-premium)' }}>
                                             <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '950', marginBottom: '8px' }}>Your Ticket</div>
                                             <div style={{ fontSize: '3rem', fontWeight: '950', color: 'var(--text-main)', lineHeight: 1, marginBottom: '16px', letterSpacing: '-2px' }}>Q{generatedToken.token_number}</div>
                                             
                                             {generatedToken.preferred_staff_id && (
                                                 <div style={{ 
                                                     marginBottom: '20px', 
                                                     padding: '16px', 
                                                     background: 'var(--background)', 
                                                     borderRadius: '16px',
                                                     display: 'flex',
                                                     alignItems: 'center',
                                                     gap: '12px',
                                                     justifyContent: 'center',
                                                     border: '1px solid var(--border)'
                                                 }}>
                                                     <div style={{ 
                                                         width: '40px', 
                                                         height: '40px', 
                                                         borderRadius: '50%', 
                                                         backgroundImage: `url(${activeStaff.find(s => s.id === generatedToken.preferred_staff_id)?.image_url || '/assets/salman.jpeg'})`,
                                                         backgroundSize: 'cover',
                                                         border: '2px solid var(--border)'
                                                     }} />
                                                     <div style={{ textAlign: 'left' }}>
                                                         <div style={{ fontSize: '0.9rem', fontWeight: '950', color: 'var(--text-main)' }}>
                                                             {activeStaff.find(s => s.id === generatedToken.preferred_staff_id)?.name}
                                                         </div>
                                                         <div style={{ fontSize: '0.7rem', color: getStaffWait(generatedToken.preferred_staff_id, generatedToken).isBusy ? 'var(--accent)' : 'var(--success)', fontWeight: '900' }}>
                                                             {getStaffWait(generatedToken.preferred_staff_id, generatedToken).isBusy ? `Serving Q${getStaffWait(generatedToken.preferred_staff_id, generatedToken).servingToken}` : 'Ready for you'}
                                                         </div>
                                                     </div>
                                                 </div>
                                             )}

                                             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                                                 <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '1px' }}>Est. Wait Time</div>
                                                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                     <CountdownTimer 
                                                         targetDate={new Date(Date.now() + getEstimatedWait(generatedToken).mins * 60000).toISOString()} 
                                                         size="sm" 
                                                         color="var(--text-main)"
                                                         strokeColor="var(--border)"
                                                     />
                                                     <span style={{ fontSize: '1.2rem', fontWeight: '950', color: 'var(--primary)' }}>{getEstimatedWait(generatedToken).mins}m</span>
                                                 </div>
                                             </div>
                                         </div>

                                        <motion.button 
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => {
                                                setBookingStage('idle');
                                                setSelectedServiceIds([]);
                                                setSelectedStaffId(null);
                                                navigate('/profile');
                                            }}
                                            style={{ width: '100%', padding: '16px', background: 'var(--text-main)', border: 'none', borderRadius: '16px', color: 'var(--background)', fontWeight: '950', fontSize: '1rem', cursor: 'pointer', boxShadow: 'var(--shadow-premium)' }}
                                        >
                                            Track in Profile
                                        </motion.button>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* 2. Shop Details Sections */}
                <div style={{ marginTop: '60px', display: 'flex', flexDirection: 'column', gap: '60px' }}>
                    {/* About Section */}
                    <section>
                        <div style={{ marginBottom: '24px', borderLeft: '4px solid var(--text-main)', paddingLeft: '16px' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '950', marginBottom: '4px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>About</h2>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.8', fontWeight: '800' }}>
                            {aboutText}
                        </p>
                    </section>


                    {/* Gallery Section */}
                    <section style={{ paddingBottom: '80px' }}>
                        <div style={{ marginBottom: '24px', borderLeft: '4px solid var(--accent)', paddingLeft: '16px' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '950', marginBottom: '4px', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>The Space</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '900' }}>Our aesthetic workspace.</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                            {gallery.map((url, i) => (
                                <motion.div 
                                    key={i} 
                                    whileHover={{ scale: 1.02, filter: 'brightness(1.05)' }}
                                    style={{ 
                                        height: '200px', 
                                        borderRadius: '32px', 
                                        backgroundImage: `url(${url})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        border: '1px solid var(--border)',
                                        cursor: 'zoom-in',
                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: 'var(--shadow-premium)'
                                    }}
                                />
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* Auth Modal Overlay (Light Mode) */}
            <AnimatePresence>
                {showAuthModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAuthModal(false)}
                        style={{ position: 'fixed', inset: 0, background: 'var(--modal-overlay)', backdropFilter: 'blur(20px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                                position: 'relative', 
                                width: '90%', 
                                maxWidth: '420px', 
                                background: 'var(--card-bg)', 
                                border: '1px solid var(--border)', 
                                borderRadius: '40px', 
                                padding: '50px 40px',
                                boxShadow: '0 40px 100px rgba(0,0,0,0.2), 0 0 0 1px var(--border)'
                            }}
                        >
                            <button 
                                onClick={() => setShowAuthModal(false)}
                                style={{ 
                                    position: 'absolute', 
                                    top: '30px', 
                                    right: '30px', 
                                    background: 'var(--surface)', 
                                    border: '1px solid var(--border)', 
                                    borderRadius: '50%', 
                                    width: '40px', 
                                    height: '40px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    color: 'var(--text-main)', 
                                    cursor: 'pointer',
                                    fontSize: '1.5rem',
                                    fontWeight: '300',
                                    transition: 'all 0.2s'
                                }}
                            >
                                ×
                            </button>
                            <h2 style={{ fontSize: '2rem', fontWeight: '950', marginBottom: '8px', textAlign: 'center', color: 'var(--text-main)', letterSpacing: '-1px' }}>
                                {authMode === 'signup' ? 'Create Account' : 'Welcome Back'}
                            </h2>
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '40px', fontWeight: '900' }}>
                                Join the queue instantly with your phone.
                            </p>
                            
                            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {authMode === 'signup' && (
                                    <div style={{ position: 'relative' }}>
                                            <input 
                                                type="text" 
                                                placeholder="Full Name" 
                                                value={customerName} 
                                                onChange={e => setCustomerName(e.target.value)} 
                                                required
                                                style={{ 
                                                    width: '100%', 
                                                    padding: '18px 18px 18px 50px', 
                                                    background: 'var(--background)', 
                                                    border: '1px solid var(--border)', 
                                                    borderRadius: '20px', 
                                                    color: 'var(--text-main)',
                                                    fontSize: '1rem',
                                                    outline: 'none',
                                                    fontWeight: '800',
                                                    transition: 'all 0.3s ease'
                                                }} 
                                            />
                                        <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                        </span>
                                    </div>
                                )}
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type="tel" 
                                        placeholder="Phone Number" 
                                        value={customerPhone} 
                                        onChange={e => setCustomerPhone(e.target.value)} 
                                        required
                                        style={{ 
                                            width: '100%', 
                                            padding: '18px 18px 18px 50px', 
                                            background: 'var(--background)', 
                                            border: '1px solid var(--border)', 
                                            borderRadius: '20px', 
                                            color: 'var(--text-main)',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            fontWeight: '800'
                                        }} 
                                    />
                                    <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                                            <line x1="12" y1="18" x2="12.01" y2="18" />
                                        </svg>
                                    </span>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type="password" 
                                        placeholder="Password" 
                                        value={authPassword} 
                                        onChange={e => setAuthPassword(e.target.value)} 
                                        required
                                        style={{ 
                                            width: '100%', 
                                            padding: '18px 18px 18px 50px', 
                                            background: 'var(--background)', 
                                            border: '1px solid var(--border)', 
                                            borderRadius: '20px', 
                                            color: 'var(--text-main)',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            fontWeight: '800'
                                        }} 
                                    />
                                    <span style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', opacity: 0.5 }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-4-4" />
                                        </svg>
                                    </span>
                                </div>

                                {authError && (
                                    <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.05)', padding: '12px', borderRadius: '12px', fontWeight: '900' }}>
                                        {authError}
                                    </div>
                                )}

                                <motion.button 
                                    type="submit" 
                                    disabled={loading}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    style={{ 
                                        width: '100%', 
                                        padding: '20px', 
                                        background: 'var(--text-main)', 
                                        color: 'var(--background)', 
                                        border: 'none', 
                                        borderRadius: '20px', 
                                        fontWeight: '950', 
                                        marginTop: '10px',
                                        fontSize: '1.1rem',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        boxShadow: 'var(--shadow-premium)',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {loading ? 'Processing...' : (authMode === 'signup' ? 'Create Account' : 'Sign In')}
                                </motion.button>
                            </form>
                            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                                <button onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '950', cursor: 'pointer', fontSize: '0.95rem' }}>
                                    {authMode === 'signup' ? 'Already have an account? Login' : 'New here? Create account'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Queue;
