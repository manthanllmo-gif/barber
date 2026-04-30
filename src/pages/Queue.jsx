import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useShop } from '../contexts/ShopContext';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import CountdownTimer from '../components/common/CountdownTimer';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistance } from '../utils/geoUtils';

const AVG_TIME_MINS = 15;

const Queue = () => {
    const { currentShopId, shops } = useShop();
    const { user, signup, login } = useAuth();
    const navigate = useNavigate();

    if (!currentShopId) {
        return <Navigate to="/" />;
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
        if (user) {
            setCustomerName(user.user_metadata?.name || '');
            setCustomerPhone(user.user_metadata?.phone || '');
        }

        const fetchInitialData = async () => {
            const { data: queueData } = await supabase
                .from('tokens')
                .select('*')
                .eq('shop_id', currentShopId)
                .in('status', ['pending', 'called', 'skipped'])
                .order('token_number', { ascending: true });
            if (queueData) setActiveTokens(queueData);

            const { data: serviceData } = await supabase
                .from('services')
                .select('*')
                .eq('shop_id', currentShopId)
                .neq('is_active', false);
            if (serviceData) setServices(serviceData);

            const { data: staffData } = await supabase
                .from('staff')
                .select('*')
                .eq('shop_id', currentShopId)
                .eq('is_active', true);
            if (staffData) setActiveStaff(staffData);
        };

        fetchInitialData();

        const channel = supabase
            .channel('queue_changes')
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'tokens', filter: `shop_id=eq.${currentShopId}` }, 
                () => fetchInitialData()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, currentShopId]);

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

    // UI Styles
    const S = {
        container: {
            minHeight: '100vh',
            background: 'var(--background)',
            color: 'var(--text-main)',
            paddingBottom: '100px'
        },
        hero: {
            height: '25vh',
            width: '100%',
            position: 'relative',
            background: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(15,15,20,1)), url(${shop.image_url || '/assets/salman.jpeg'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '0 5% 20px 5%'
        },
        badge: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 10px',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '50px',
            fontSize: '0.65rem',
            fontWeight: '600',
            color: 'white',
            marginBottom: '8px',
            border: '1px solid rgba(255,255,255,0.1)'
        },
        title: {
            fontSize: '1.6rem',
            fontWeight: '800',
            color: 'white',
            margin: '0 0 6px 0',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
        },
        infoRow: {
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            marginTop: '10px'
        },
        infoItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.75rem'
        },
        section: {
            padding: '20px 5%',
            maxWidth: '1200px',
            margin: '0 auto'
        },
        card: {
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '16px',
            backdropFilter: 'blur(20px)'
        },
        featureTag: {
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            fontWeight: '500',
            color: 'var(--text-muted)'
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '12px',
            marginTop: '15px'
        },
        staffItem: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.05)',
            transition: 'all 0.2s',
            marginBottom: '8px'
        }
    };

    // Dynamic features and gallery
    const facilities = (shop.features && shop.features.length > 0) 
        ? shop.features 
        : ['Premium Service', 'Professional Staff', 'Clean Environment'];
    const rating = shop.rating || 5.0;
    const gallery = (shop.gallery_urls && shop.gallery_urls.length > 0) 
        ? shop.gallery_urls 
        : ['/assets/salman.jpeg', '/assets/product.jpg', '/assets/hero-bg.jpg'];

    return (
        <div style={S.container}>
            {/* Hero Section */}
            <div style={S.hero}>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div style={S.badge}>
                        <span style={{ color: '#4ade80' }}>●</span> Open Now
                    </div>
                    <h1 style={S.title}>{shop.name}</h1>
                    <div style={S.infoRow}>
                        <div style={S.infoItem}>
                            <span style={{ color: '#fbbf24' }}>★</span> {rating}
                        </div>
                        <div style={S.infoItem}>
                            <span>📍</span> {shop.address || 'Location'}
                        </div>
                        {shop.distance !== undefined && shop.distance !== null && (
                            <div style={{...S.infoItem, color: '#60a5fa', fontWeight: '700'}}>
                                <span>🚀</span> {formatDistance(shop.distance)}
                            </div>
                        )}
                        <div style={S.infoItem}>
                            <span>⏰</span> 09:00 - 21:00
                        </div>
                    </div>
                </motion.div>
            </div>

            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 5%' }}>
                {/* 1. Live Queue Hub (Integrated Control Center) */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginTop: '30px', position: 'relative', zIndex: 10, width: '100%' }}
                >
                    <div style={{ 
                        ...S.card, 
                        background: 'rgba(15, 15, 20, 0.98)', 
                        border: '1px solid rgba(255,255,255,0.08)', 
                        boxShadow: '0 30px 60px rgba(0,0,0,0.6)', 
                        backdropFilter: 'blur(40px)',
                        padding: '8px 12px',
                        borderRadius: '16px'
                    }}>
                        {/* Status Header */}
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            marginBottom: '12px',
                            paddingBottom: '10px',
                            borderBottom: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 10px #4ade80' }} />
                                <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: '900', letterSpacing: '1.5px' }}>Live Hub</span>
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>
                                {activeTokens.length} Active
                            </div>
                        </div>

                        {bookingStage === 'idle' && (
                            <div style={{ width: '100%' }}>
                                {/* Active Ticket - Ultra Compact Pill */}
                                {myActiveToken && (
                                    <motion.div 
                                        initial={{ scale: 0.98, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        whileTap={{ scale: 0.99 }}
                                        style={{ 
                                            background: 'linear-gradient(90deg, rgba(74, 222, 128, 0.15), rgba(34, 197, 94, 0.05))', 
                                            border: '1px solid rgba(74, 222, 128, 0.2)',
                                            borderRadius: '12px',
                                            padding: '8px 12px',
                                            marginBottom: '12px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => {
                                            setGeneratedToken(myActiveToken);
                                            setBookingStage('generated');
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', color: '#4ade80', fontWeight: '900', background: 'rgba(74, 222, 128, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>Active</div>
                                            <div style={{ fontSize: '0.9rem', fontWeight: '900', color: 'white' }}>Q{myActiveToken.token_number}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
                                                {myActiveToken.status === 'called' ? 'Serving' : `Pos: #${getPosition(myActiveToken) + 1}`}
                                            </span>
                                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>→</span>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Unified Staff Selection & Status Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                                    {/* Fastest Option */}
                                    <motion.div 
                                        whileHover={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            setSelectedStaffId(null);
                                            if (!user) setShowAuthModal(true);
                                            else setBookingStage('details');
                                        }}
                                        style={{ 
                                            padding: '10px', 
                                            background: 'rgba(99, 102, 241, 0.08)', 
                                            border: '1px solid rgba(99, 102, 241, 0.2)',
                                            borderRadius: '14px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            minHeight: '70px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <div style={{ fontSize: '1rem' }}>⚡</div>
                                            <div style={{ fontWeight: '800', fontSize: '0.8rem', color: 'white' }}>Fastest</div>
                                        </div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: '900', letterSpacing: '0.5px' }}>
                                            {getStaffWait(null).mins}m WAIT
                                        </div>
                                    </motion.div>

                                    {/* Staff Cards */}
                                    {activeStaff.map(s => {
                                        const sWait = getStaffWait(s.id);
                                        const currentlyServing = activeTokens.find(t => (t.status === 'called' || t.status === 'serving') && t.staff_id === s.id);
                                        return (
                                            <motion.div 
                                                key={s.id}
                                                whileHover={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.15)' }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => {
                                                    setSelectedStaffId(s.id);
                                                    if (!user) setShowAuthModal(true);
                                                    else setBookingStage('details');
                                                }}
                                                style={{ 
                                                    padding: '10px',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    borderRadius: '14px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '6px',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ 
                                                        width: '28px', 
                                                        height: '28px', 
                                                        borderRadius: '8px', 
                                                        background: `url(${s.image_url || '/assets/salman.jpeg'})`,
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center',
                                                        border: `1.5px solid ${currentlyServing ? '#4ade80' : 'rgba(255,255,255,0.1)'}`
                                                    }} />
                                                    <div style={{ overflow: 'hidden' }}>
                                                        <div style={{ fontWeight: '700', fontSize: '0.8rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                                                        <div style={{ fontSize: '0.6rem', color: currentlyServing ? '#4ade80' : 'rgba(255,255,255,0.4)', fontWeight: '800' }}>
                                                            {currentlyServing ? `Q${currentlyServing.token_number}` : 'FREE'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ 
                                                    fontSize: '0.55rem', 
                                                    color: 'rgba(255,255,255,0.3)', 
                                                    fontWeight: '700',
                                                    borderTop: '1px solid rgba(255,255,255,0.03)',
                                                    paddingTop: '5px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between'
                                                }}>
                                                    <span>WAIT</span>
                                                    <span style={{ color: 'white' }}>{sWait.mins}m</span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {bookingStage !== 'idle' && (
                            <div style={{ maxWidth: '240px', margin: '0 auto', padding: '5px 0' }}>
                                {/* Booking Flow Content (Details, Services, Generated) */}
                                {bookingStage === 'details' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800', marginBottom: '2px' }}>Booking with</div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: '900', color: 'white' }}>
                                                {selectedStaffId ? activeStaff.find(s => s.id === selectedStaffId)?.name : 'Fastest Barber'}
                                            </div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--primary)', marginTop: '2px', fontWeight: '800' }}>Wait: {waitInfo.mins} mins</div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ textAlign: 'left' }}>
                                                <label style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: '800', marginLeft: '5px', marginBottom: '3px', display: 'block' }}>Your Full Name</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="e.g. John Doe" 
                                                    value={customerName}
                                                    onChange={e => setCustomerName(e.target.value)}
                                                    style={{ width: '100%', padding: '6px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'white', fontSize: '0.75rem', outline: 'none' }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => setBookingStage('services')}
                                                disabled={!customerName}
                                                style={{ width: '100%', padding: '8px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)', opacity: !customerName ? 0.5 : 1 }}
                                            >
                                                Next: Select Services
                                            </button>
                                            <button
                                                onClick={() => setBookingStage('idle')}
                                                style={{ width: '100%', padding: '4px', background: 'transparent', color: 'rgba(255,255,255,0.4)', border: 'none', fontSize: '0.6rem', cursor: 'pointer', fontWeight: '600' }}
                                            >
                                                ← Cancel & Change
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {bookingStage === 'services' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '900', marginBottom: '12px', color: 'white', textAlign: 'center' }}>Select Services</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px', marginBottom: '12px' }}>
                                            {services.map(s => (
                                                <motion.button 
                                                    key={s.id}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setSelectedServiceIds(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                                                    style={{
                                                        padding: '6px 10px',
                                                        borderRadius: '10px',
                                                        border: '1px solid',
                                                        borderColor: selectedServiceIds.includes(s.id) ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                                                        background: selectedServiceIds.includes(s.id) ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.03)',
                                                        color: 'white',
                                                        fontSize: '0.65rem',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1.2px solid', borderColor: selectedServiceIds.includes(s.id) ? 'var(--primary)' : 'rgba(255,255,255,0.2)', background: selectedServiceIds.includes(s.id) ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            {selectedServiceIds.includes(s.id) && <span style={{ color: 'white', fontSize: '0.5rem' }}>✓</span>}
                                                        </div>
                                                        <span style={{ fontWeight: '600' }}>{s.name}</span>
                                                    </div>
                                                    <span style={{ fontWeight: '800', color: selectedServiceIds.includes(s.id) ? 'var(--primary)' : 'rgba(255,255,255,0.3)', fontSize: '0.6rem' }}>₹{s.price || '200'}</span>
                                                </motion.button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={generateToken}
                                            disabled={loading || selectedServiceIds.length === 0}
                                            style={{ width: '100%', padding: '8px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', opacity: (loading || selectedServiceIds.length === 0) ? 0.6 : 1, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' }}
                                        >
                                            {loading ? 'Processing...' : 'Complete Booking'}
                                        </button>
                                        <button
                                            onClick={() => setBookingStage('details')}
                                            style={{ width: '100%', padding: '4px', background: 'transparent', color: 'rgba(255,255,255,0.4)', border: 'none', fontSize: '0.6rem', cursor: 'pointer', fontWeight: '600' }}
                                        >
                                            ← Go Back
                                        </button>
                                    </motion.div>
                                )}

                                {bookingStage === 'generated' && generatedToken && (
                                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', padding: '5px 0' }}>
                                        <div style={{ fontSize: '0.55rem', color: '#4ade80', fontWeight: '800', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#4ade80' }} />
                                            TrimTime Slot Reserved
                                        </div>
                                        
                                         <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', padding: '12px', marginBottom: '10px' }}>
                                             <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '800', marginBottom: '2px' }}>Your Ticket</div>
                                             <div style={{ fontSize: '1.2rem', fontWeight: '950', color: 'white', lineHeight: 1, marginBottom: '8px' }}>Q{generatedToken.token_number}</div>
                                             
                                             {generatedToken.preferred_staff_id && (
                                                 <div style={{ 
                                                     marginBottom: '10px', 
                                                     padding: '8px', 
                                                     background: 'rgba(255,255,255,0.03)', 
                                                     borderRadius: '8px',
                                                     display: 'flex',
                                                     alignItems: 'center',
                                                     gap: '8px',
                                                     justifyContent: 'center'
                                                 }}>
                                                     <div style={{ 
                                                         width: '24px', 
                                                         height: '24px', 
                                                         borderRadius: '50%', 
                                                         background: `url(${activeStaff.find(s => s.id === generatedToken.preferred_staff_id)?.image_url || '/assets/salman.jpeg'})`,
                                                         backgroundSize: 'cover',
                                                         border: '1px solid rgba(255,255,255,0.1)'
                                                     }} />
                                                     <div style={{ textAlign: 'left' }}>
                                                         <div style={{ fontSize: '0.55rem', fontWeight: '800', color: 'white' }}>
                                                             {activeStaff.find(s => s.id === generatedToken.preferred_staff_id)?.name}
                                                         </div>
                                                         <div style={{ fontSize: '0.45rem', color: getStaffWait(generatedToken.preferred_staff_id, generatedToken).isBusy ? '#fbbf24' : '#4ade80', fontWeight: '700' }}>
                                                             {getStaffWait(generatedToken.preferred_staff_id, generatedToken).isBusy ? `Serving Q${getStaffWait(generatedToken.preferred_staff_id, generatedToken).servingToken}` : 'Available Now'}
                                                         </div>
                                                     </div>
                                                 </div>
                                             )}

                                             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                 <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.4)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Est. Arrival</div>
                                                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                     <CountdownTimer 
                                                         targetDate={new Date(Date.now() + getEstimatedWait(generatedToken).mins * 60000).toISOString()} 
                                                         size="sm" 
                                                     />
                                                     <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#60a5fa' }}>{getEstimatedWait(generatedToken).mins}m</span>
                                                 </div>
                                             </div>
                                         </div>

                                        <button 
                                            onClick={() => {
                                                setBookingStage('idle');
                                                setSelectedServiceIds([]);
                                                setSelectedStaffId(null);
                                                navigate('/profile');
                                            }}
                                            style={{ width: '100%', padding: '8px', background: 'var(--primary)', border: 'none', borderRadius: '10px', color: 'white', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}
                                        >
                                            View My Tokens
                                        </button>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* 2. Shop Details Sections */}
                <div style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', gap: '50px' }}>
                    {/* Amenities Section */}
                    <section>
                        <div style={{ marginBottom: '20px', paddingLeft: '8px', borderLeft: '2px solid var(--primary)' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '900', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'white' }}>Amenities</h2>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: '500' }}>Curated facilities for you.</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                            {facilities.map((f, i) => (
                                <motion.div 
                                    key={i} 
                                    whileHover={{ y: -3, background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)' }}
                                    style={{ 
                                        background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', 
                                        border: '1px solid rgba(255,255,255,0.06)', 
                                        borderRadius: '16px', 
                                        padding: '12px 16px', 
                                        display: 'flex', 
                                        gap: '12px', 
                                        alignItems: 'center',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    <div style={{ 
                                        width: '32px', 
                                        height: '32px', 
                                        borderRadius: '10px', 
                                        background: 'rgba(99, 102, 241, 0.1)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        fontSize: '1rem',
                                        border: '1px solid rgba(99, 102, 241, 0.2)'
                                    }}>✨</div>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '0.85rem', color: 'white' }}>{f}</div>
                                        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Exclusive</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* Gallery Section */}
                    <section style={{ paddingBottom: '50px' }}>
                        <div style={{ marginBottom: '20px', paddingLeft: '8px', borderLeft: '2px solid #f43f5e' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '900', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'white' }}>The Space</h2>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: '500' }}>Our aesthetic workspace.</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                            {gallery.map((url, i) => (
                                <motion.div 
                                    key={i} 
                                    whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
                                    style={{ 
                                        height: '160px', 
                                        borderRadius: '16px', 
                                        background: `url(${url})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        cursor: 'zoom-in',
                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                />
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* Auth Modal Overlay */}
            <AnimatePresence>
                {showAuthModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAuthModal(false)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ position: 'relative', width: '90%', maxWidth: '400px', background: 'var(--background)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '40px' }}
                        >
                            <button 
                                onClick={() => setShowAuthModal(false)}
                                style={{ 
                                    position: 'absolute', 
                                    top: '20px', 
                                    right: '20px', 
                                    background: 'rgba(255,255,255,0.05)', 
                                    border: '1px solid rgba(255,255,255,0.1)', 
                                    borderRadius: '50%', 
                                    width: '32px', 
                                    height: '32px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    color: 'white', 
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                ×
                            </button>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '10px', textAlign: 'center' }}>{authMode === 'signup' ? 'Create Account' : 'Welcome Back'}</h2>
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '30px' }}>Join the queue instantly with your phone.</p>
                                   <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                                                padding: '16px 16px 16px 45px', 
                                                background: 'rgba(255,255,255,0.03)', 
                                                border: '1px solid rgba(255,255,255,0.1)', 
                                                borderRadius: '16px', 
                                                color: 'white',
                                                fontSize: '0.95rem',
                                                outline: 'none',
                                                transition: 'all 0.3s ease'
                                            }} 
                                        />
                                        <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>👤</span>
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
                                            padding: '16px 16px 16px 45px', 
                                            background: 'rgba(255,255,255,0.03)', 
                                            border: '1px solid rgba(255,255,255,0.1)', 
                                            borderRadius: '16px', 
                                            color: 'white',
                                            fontSize: '0.95rem',
                                            outline: 'none'
                                        }} 
                                    />
                                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>📱</span>
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
                                            padding: '16px 16px 16px 45px', 
                                            background: 'rgba(255,255,255,0.03)', 
                                            border: '1px solid rgba(255,255,255,0.1)', 
                                            borderRadius: '16px', 
                                            color: 'white',
                                            fontSize: '0.95rem',
                                            outline: 'none'
                                        }} 
                                    />
                                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔒</span>
                                </div>

                                {authError && (
                                    <div style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '8px', fontWeight: '600' }}>
                                        {authError}
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    style={{ 
                                        width: '100%', 
                                        padding: '16px', 
                                        background: 'linear-gradient(135deg, var(--primary), #4f46e5)', 
                                        color: 'white', 
                                        border: 'none', 
                                        borderRadius: '16px', 
                                        fontWeight: '800', 
                                        marginTop: '10px',
                                        fontSize: '1rem',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {loading ? 'Securing Session...' : (authMode === 'signup' ? 'Create Account' : 'Sign In')}
                                </button>
                            </form>
                            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
                                <button onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer' }}>
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
