import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useShop } from '../contexts/ShopContext';
import CountdownTimer from '../components/common/CountdownTimer';
import { calculateDistance, formatDistance } from '../utils/geoUtils';

const AVG_TIME_MINS = 15;

const S = {
    container: {
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '80px 24px 60px',
        minHeight: '100vh',
        background: '#FFFFFF',
    },
    header: {
        background: '#F6F6F6',
        border: '1px solid #EEEEEE',
        borderRadius: '28px',
        padding: '32px',
        marginBottom: '40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
    },
    userName: {
        fontSize: '1.2rem',
        fontWeight: '950',
        letterSpacing: '-0.5px',
        margin: 0,
        color: '#000000',
    },
    userPhone: {
        fontSize: '0.8rem',
        color: 'rgba(0, 0, 0, 0.4)',
        fontWeight: '900',
        letterSpacing: '1px',
        textTransform: 'uppercase',
    },
    logoutBtn: {
        padding: '14px 28px',
        background: '#000000',
        border: 'none',
        borderRadius: '16px',
        color: '#FFFFFF',
        fontWeight: '950',
        fontSize: '0.8rem',
        cursor: 'pointer',
        textTransform: 'uppercase',
        letterSpacing: '2px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: 'none',
    },
    sectionTitle: {
        fontSize: '0.75rem',
        fontWeight: '950',
        textTransform: 'uppercase',
        letterSpacing: '2px',
        color: '#000000',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    tokenGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        marginBottom: '60px',
    },
    tokenCard: {
        background: '#FFFFFF',
        borderRadius: '24px',
        border: '1px solid #EEEEEE',
        padding: '20px 24px',
        position: 'relative',
        transition: 'all 0.3s ease',
    },
    tokenHeader: {
        marginBottom: '24px',
        paddingBottom: '24px',
        textAlign: 'center',
    },
    shopName: {
        fontSize: '1.1rem',
        fontWeight: '950',
        color: '#000000',
        margin: '0 0 6px 0',
        letterSpacing: '-0.5px',
    },
    shopAddress: {
        fontSize: '0.75rem',
        color: 'rgba(0,0,0,0.4)',
        margin: 0,
        fontWeight: '950',
        textTransform: 'uppercase',
        letterSpacing: '1px',
    },
    tokenBody: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
    },
    tokenNumber: {
        fontSize: '3rem',
        fontWeight: '950',
        color: '#000000',
        letterSpacing: '-2px',
        lineHeight: 1,
        margin: '8px 0',
    },
    historyBox: {
        background: '#FFFFFF',
        borderRadius: '28px',
        border: '1px solid #EEEEEE',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
    },
    table: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '0',
    },
    th: {
        padding: '24px',
        textAlign: 'left',
        fontSize: '0.7rem',
        fontWeight: '950',
        textTransform: 'uppercase',
        letterSpacing: '2.5px',
        color: 'rgba(0,0,0,0.3)',
        borderBottom: '1px solid #F6F6F6',
    },
    td: {
        padding: '24px',
        color: '#000000',
        fontSize: '0.9rem',
        fontWeight: '900',
        borderBottom: '1px solid #F6F6F6',
        whiteSpace: 'nowrap',
    }
};

const TokenWaitTimer = ({ token }) => {
    const [waitMins, setWaitMins] = useState(0);
    const [targetDate, setTargetDate] = useState(null);
    const [nowServing, setNowServing] = useState([]);
    const [preferredStaff, setPreferredStaff] = useState(null);
    const [isStaffServing, setIsStaffServing] = useState(false);
    const [position, setPosition] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWaitTime = async () => {
            const sId = token.shop_id || (token.shops?.id) || (Array.isArray(token.shops) ? token.shops[0]?.id : null);
            if (!sId) {
                console.warn('[TokenWaitTimer] Missing shop_id for token:', token.id);
                setLoading(false);
                return;
            }

            try {
                // 1. Fetch queue data AND services for accurate timing
                const [queueRes, servicesRes] = await Promise.all([
                    supabase
                        .from('tokens')
                        .select('id, token_number, status, called_at, preferred_staff_id, staff_id, services_selected')
                        .eq('shop_id', sId)
                        .in('status', ['pending', 'called'])
                        .order('token_number', { ascending: true }),
                    supabase
                        .from('services')
                        .select('id, name, avg_time')
                        .eq('shop_id', sId)
                ]);

                const queueData = queueRes.data || [];
                const servicesList = servicesRes.data || [];

                const pendingTokens = queueData.filter(t => t.status === 'pending');
                const calledTokens = queueData.filter(t => t.status === 'called');
                
                setNowServing(calledTokens.map(t => t.token_number));

                const currentPos = pendingTokens.findIndex(t => t.id === token.id);
                setPosition(currentPos);
                
                if (currentPos === -1 && token.status !== 'called') {
                    setWaitMins(0);
                    setTargetDate(null);
                    return;
                }

                // Fetch preferred staff name if not already set
                if (token.preferred_staff_id && !preferredStaff) {
                    const { data: sData } = await supabase
                        .from('staff')
                        .select('name')
                        .eq('id', token.preferred_staff_id)
                        .single();
                    setPreferredStaff(sData);
                }

                // Check if requested staff is actually serving someone
                const servingToken = token.preferred_staff_id ? 
                    calledTokens.find(t => t.staff_id === token.preferred_staff_id) : null;
                setIsStaffServing(!!servingToken);

                // Wait Calculation Logic
                const { count: staffCount } = await supabase
                    .from('staff')
                    .select('*', { count: 'exact', head: true })
                    .eq('shop_id', sId)
                    .eq('is_active', true);

                const effectiveStaff = staffCount || 1;
                const AVG_TIME_MINS = 15;

                const getRemainingTime = (t) => {
                    if (!t.called_at) return new Date().getTime() + AVG_TIME_MINS * 60000;
                    
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
                    // Start with the time the barber will be free
                    let baseTargetTime = Date.now();
                    if (servingToken) {
                        baseTargetTime = getRemainingTime(servingToken);
                    }
                    
                    // How many people ahead FOR THIS BARBER?
                    const peopleAhead = pendingTokens.filter(t => 
                        t.preferred_staff_id === token.preferred_staff_id &&
                        t.token_number < token.token_number
                    ).length;
                    
                    calculatedTarget = new Date(baseTargetTime + (peopleAhead * AVG_TIME_MINS) * 60000);
                } else {
                    // General queue: Find the earliest any barber will be free
                    let earliestFree = Date.now();
                    if (calledTokens.length >= effectiveStaff) {
                        const finishTimes = calledTokens.map(t => getRemainingTime(t));
                        earliestFree = Math.min(...finishTimes);
                    }
                    
                    const estimatedPos = Math.ceil((currentPos + 1) / effectiveStaff);
                    calculatedTarget = new Date(earliestFree + (estimatedPos * AVG_TIME_MINS) * 60000);
                }

                    // Stability check: if we already have a target for this token, only update if significant change
                    let finalTarget = calculatedTarget;
                    const persistedMap = localStorage.getItem('trimtime_tokens_map');
                    if (persistedMap) {
                        try {
                            const map = JSON.parse(persistedMap);
                            const existingData = map[token.id];
                            if (existingData?.target) {
                                const existingDate = new Date(existingData.target);
                                const diff = Math.abs(calculatedTarget.getTime() - existingDate.getTime());
                                // If difference is less than 5 minutes, keep the existing target to avoid jitter
                                if (diff < 300000) {
                                    finalTarget = existingDate;
                                }
                            }
                        } catch (e) {}
                    }

                    if (finalTarget < new Date()) {
                        finalTarget = new Date(Date.now() + 60000);
                    }

                    const diffMins = Math.max(1, Math.ceil((finalTarget - new Date()) / 60000));
                    setWaitMins(diffMins);
                    const targetISO = finalTarget.toISOString();
                    setTargetDate(targetISO);

                    // Update persistence map
                    try {
                        const map = persistedMap ? JSON.parse(persistedMap) : {};
                        map[token.id] = { target: targetISO, wait: diffMins };
                        localStorage.setItem('trimtime_tokens_map', JSON.stringify(map));
                    } catch (e) {}

            } catch (err) {
                console.error('Error calculating wait time:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchWaitTime();

        const sId = token.shop_id || (token.shops?.id) || (Array.isArray(token.shops) ? token.shops[0]?.id : null);
        if (sId) {
            const channel = supabase
                .channel(`shop_queue_${sId}_${token.id}`)
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'tokens', filter: `shop_id=eq.${sId}` }, 
                    () => fetchWaitTime()
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [token.id, token.shop_id, token.preferred_staff_id]);

    if (loading) return (
        <div style={{ 
            fontSize: '0.65rem', 
            color: 'rgba(0,0,0,0.4)', 
            letterSpacing: '1.5px', 
            fontWeight: '950',
            textAlign: 'center',
            padding: '20px'
        }}>
            SYNCING LIVE DATA
        </div>
    );

    if (token.status === 'called') {
        return (
            <div style={{ 
                width: '100%', 
                marginTop: '15px', 
                padding: '32px', 
                background: '#000000', 
                borderRadius: '28px', 
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            }}>
                <div style={{ marginBottom: '16px' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: '950', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '8px' }}>It's Trim Time!</div>
                {preferredStaff && (
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: '950', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                        Barber: {preferredStaff.name}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ width: '100%', marginTop: '15px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div style={{ padding: '20px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #EEEEEE', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', fontWeight: '950', letterSpacing: '2px', marginBottom: '4px' }}>Wait Estimate</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '950', color: '#000000' }}>{waitMins} MINS</div>
                </div>
                <div style={{ padding: '16px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #EEEEEE', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <div style={{ transform: 'scale(0.8)', transformOrigin: 'center center' }}>
                        <CountdownTimer 
                            targetDate={targetDate} 
                            totalSeconds={token.created_at ? (new Date(targetDate).getTime() - new Date(token.created_at).getTime()) / 1000 : 1800}
                            size="sm"
                            color="#000000"
                            strokeColor="rgba(0,0,0,0.1)"
                        />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ padding: '20px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #EEEEEE', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', fontWeight: '950', letterSpacing: '2px', marginBottom: '4px' }}>Now Serving</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '950', color: '#000000' }}>
                        {nowServing.length > 0 ? `Q${nowServing[0]}` : '---'}
                    </div>
                </div>
                <div style={{ padding: '20px', background: '#FFFFFF', borderRadius: '20px', border: '1px solid #EEEEEE', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', fontWeight: '950', letterSpacing: '2px', marginBottom: '4px' }}>Queue Rank</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '950', color: '#276EF1' }}>
                        #{Math.max(1, position + 1)}
                    </div>
                </div>
            </div>

            {preferredStaff && (
                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: '950', color: 'rgba(0,0,0,0.2)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                        Barber: {preferredStaff.name}
                    </span>
                </div>
            )}
        </div>
    );
};

const Profile = () => {
    const { user, logout } = useAuth();
    const { location } = useShop();
    const navigate = useNavigate();
    const [tokens, setTokens] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({ name: '', phone: '' });
    
    const [rebookingLoading, setRebookingLoading] = useState(false);
    
    // Collapsible State
    const [showAllActive, setShowAllActive] = useState(false);
    const [showAllPast, setShowAllPast] = useState(false);
    
    // Rebook State
    const [rebookModalOpen, setRebookModalOpen] = useState(false);
    const [rebookShop, setRebookShop] = useState(null);
    const [shopServices, setShopServices] = useState([]);
    const [selectedServiceIds, setSelectedServiceIds] = useState([]);

    useEffect(() => {
        if (!user) return;

        const fetchProfile = async () => {
            // Try metadata first
            let name = user.user_metadata?.name;
            let phone = user.user_metadata?.phone;

            if (!name) {
                // Fallback to DB
                const { data, error } = await supabase
                    .from('users')
                    .select('name, phone')
                    .eq('id', user.id)
                    .maybeSingle();
                
                if (data) {
                    name = data.name;
                    phone = data.phone;
                }
            }
            setProfile({ name: name || 'Guest User', phone: phone || '' });
        };

        fetchProfile();
        fetchUserTokens();
        fetchUserOrders();
    }, [user]);

    const fetchUserTokens = async () => {
        try {
            const phone = user?.user_metadata?.phone;
            if (!phone) return;

            const { data, error } = await supabase
                .from('tokens')
                .select('*, shops!shop_id(id, name, address, latitude, longitude)')
                .eq('customer_phone', phone)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTokens(data || []);
        } catch (err) {
            console.error('Error fetching tokens:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserOrders = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id, user_id, customer_name, customer_phone, delivery_address, total_amount, status, created_at, shop_id,
                    order_items (
                        *,
                        products (name)
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error('Error fetching orders:', err.message);
        }
    };

    const initiateRebook = async (token) => {
        const shopId = token.shop_id || (Array.isArray(token.shops) ? token.shops[0]?.id : token.shops?.id);
        const shopData = Array.isArray(token.shops) ? token.shops[0] : token.shops;
        setRebookShop({ ...shopData, id: shopId });
        setSelectedServiceIds([]);
        setRebookModalOpen(true);
        
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('shop_id', token.shop_id)
            .neq('is_active', false);
        
        if (data) setShopServices(data);
    };

    const handleConfirmRebook = async () => {
        if (selectedServiceIds.length === 0 || !rebookShop) return;
        setRebookingLoading(true);
        try {
            // Get next token number
            const { data: lastTokens } = await supabase
                .from('tokens')
                .select('token_number')
                .order('token_number', { ascending: false })
                .limit(1);

            const nextQueueNo = (lastTokens && lastTokens.length > 0) ? lastTokens[0].token_number + 1 : 1;

            const { error } = await supabase
                .from('tokens')
                .insert([
                    {
                        token_number: nextQueueNo,
                        status: 'pending',
                        services_selected: selectedServiceIds,
                        source: 'online',
                        shop_id: rebookShop.id,
                        customer_name: profile.name,
                        customer_phone: profile.phone,
                        user_id: user.id
                    }
                ]);

            if (error) throw error;
            
            setRebookModalOpen(false);
            fetchUserTokens(); // Refresh list
        } catch (error) {
            console.error('Error rebooking:', error.message);
            alert('Failed to rebook. Please try again.');
        } finally {
            setRebookingLoading(false);
        }
    };

    if (!user) return <Navigate to="/" />;

    const activeTokens = tokens.filter(t => ['pending', 'called'].includes(t.status));
    const pastTokens = tokens.filter(t => !['pending', 'called'].includes(t.status));

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ ...S.container, padding: '80px 20px' }}
            className="profile-container"
        >
            <style>{`
                    .empty-state-box {
                        padding: 60px;
                    }
                    @media (max-width: 768px) {
                        .responsive-table th, 
                        .responsive-table td {
                            padding: 12px 16px !important;
                            font-size: 0.8rem !important;
                        }
                        .profile-header {
                            padding: 24px !important;
                            flex-direction: column !important;
                            align-items: flex-start !important;
                            gap: 20px !important;
                            margin-bottom: 30px !important;
                        }
                        .profile-container {
                            padding: 80px 16px 100px !important;
                        }
                        .empty-state-box {
                            padding: 40px 20px !important;
                        }
                    }
                `}</style>
            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={S.header}
            >
                <div style={S.titleGroup}>
                    <h1 style={S.userName}>{profile.name}</h1>
                    {profile.phone && <span style={S.userPhone}>+91 {profile.phone}</span>}
                </div>
                <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                        await logout();
                        navigate('/');
                    }}
                    style={S.logoutBtn}
                >
                    Logout
                </motion.button>
            </motion.div>

            {/* Active Tokens Section */}
            <div style={{ marginBottom: '40px' }}>
                <h2 style={S.sectionTitle}>
                    <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '10px', 
                        background: '#F6F6F6', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                    </div>
                    Live Tokens
                </h2>
                
                <div style={S.tokenGrid}>
                    <AnimatePresence mode="popLayout">
                        {activeTokens.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="empty-state-box"
                                style={{ 
                                    gridColumn: '1/-1', 
                                    textAlign: 'center', 
                                    background: '#F6F6F6', 
                                    borderRadius: '28px', 
                                    border: '1px solid #EEEEEE',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '60px'
                                }}
                            >
                                <p style={{ color: 'rgba(0,0,0,0.2)', fontWeight: '950', letterSpacing: '2px', fontSize: '0.7rem', textTransform: 'uppercase' }}>No Active Sessions</p>
                            </motion.div>
                        ) : (
                            <div style={S.tokenGrid}>
                                {(showAllActive ? activeTokens : activeTokens.slice(0, 2)).map((token, index) => (
                                    <motion.div 
                                        key={token.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        style={{
                                            ...S.tokenCard,
                                            marginBottom: '12px',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                                            {/* Shop Identity */}
                                            <div style={{ flex: '1.5', minWidth: '200px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                                    <div style={{ 
                                                        padding: '3px 8px', 
                                                        background: '#F6F6F6', 
                                                        borderRadius: '6px', 
                                                        fontSize: '0.55rem', 
                                                        fontWeight: '950', 
                                                        color: '#000', 
                                                        letterSpacing: '1px',
                                                        textTransform: 'uppercase'
                                                    }}>Live Session</div>
                                                    <h3 style={{ ...S.shopName, fontSize: '0.95rem', margin: 0 }}>
                                                        {token.shops?.name || "TrimTime Salon"}
                                                    </h3>
                                                </div>
                                                <p style={{ ...S.shopAddress, fontSize: '0.65rem', color: 'rgba(0,0,0,0.4)' }}>{token.shops?.address}</p>
                                                
                                                {location && token.shops?.latitude && (
                                                    <div style={{
                                                        fontSize: '0.6rem',
                                                        color: '#276EF1',
                                                        fontWeight: '950',
                                                        marginTop: '6px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <polyline points="12 6 12 12 16 14" />
                                                        </svg>
                                                        {formatDistance(calculateDistance(
                                                            location.latitude, 
                                                            location.longitude, 
                                                            token.shops.latitude, 
                                                            token.shops.longitude
                                                        ))} away
                                                    </div>
                                                )}
                                            </div>

                                            {/* Token Number - More Minimal */}
                                            <div style={{ textAlign: 'center', padding: '0 24px', borderLeft: '1px solid #F6F6F6', borderRight: '1px solid #F6F6F6' }}>
                                                <div style={{ fontSize: '0.55rem', color: 'rgba(0,0,0,0.3)', fontWeight: '950', letterSpacing: '1.5px', marginBottom: '2px', textTransform: 'uppercase' }}>Position</div>
                                                <div style={{ fontWeight: '950', fontSize: '1.8rem', color: '#000', lineHeight: '1.1' }}>Q{token.token_number}</div>
                                            </div>

                                            {/* Status / Quick Action */}
                                            <div style={{ flex: '1', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                {token.status === 'called' ? (
                                                    <motion.div 
                                                        animate={{ scale: [1, 1.05, 1] }}
                                                        transition={{ repeat: Infinity, duration: 2 }}
                                                        style={{ 
                                                            padding: '10px 20px', 
                                                            background: '#000', 
                                                            color: '#FFF', 
                                                            borderRadius: '12px', 
                                                            fontWeight: '950', 
                                                            fontSize: '0.65rem', 
                                                            letterSpacing: '1.5px', 
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            textTransform: 'uppercase'
                                                        }}
                                                    >
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFF', boxShadow: '0 0 10px #FFF' }} />
                                                        Ready Now
                                                    </motion.div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10B981' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                                                        <span style={{ fontWeight: '950', fontSize: '0.7rem', letterSpacing: '1px', textTransform: 'uppercase' }}>In Queue</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Timer Section - Only if pending */}
                                        {token.status === 'pending' && (
                                            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #F6F6F6' }}>
                                                <TokenWaitTimer token={token} />
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                                
                                {activeTokens.length > 2 && (
                                    <motion.button
                                        whileHover={{ background: '#F0F0F0' }}
                                        onClick={() => setShowAllActive(!showAllActive)}
                                        style={{
                                            width: '100%',
                                            padding: '16px',
                                            background: '#F6F6F6',
                                            border: '1px dashed #EEEEEE',
                                            borderRadius: '20px',
                                            color: 'rgba(0,0,0,0.4)',
                                            fontWeight: '950',
                                            fontSize: '0.7rem',
                                            letterSpacing: '2px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        {showAllActive ? 'Show Less' : `View More (${activeTokens.length - 2} more)`}
                                        <motion.div animate={{ rotate: showAllActive ? 180 : 0 }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </motion.div>
                                    </motion.button>
                                )}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* History Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ marginBottom: '60px' }}
            >
                <h2 style={S.sectionTitle}>
                    <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '10px', 
                        background: '#F6F6F6', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    Past Tokens
                </h2>
                <div style={S.historyBox}>
                    {pastTokens.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(0,0,0,0.2)', fontWeight: '950', fontSize: '0.7rem', letterSpacing: '3px' }}>NO PAST SESSIONS RECORDED</div>
                    ) : (
                        <>
                            <table style={S.table} className="responsive-table">
                                <thead>
                                    <tr>
                                        <th style={S.th}>Token</th>
                                        <th style={S.th}>Establishment</th>
                                        <th style={S.th}>Outcome</th>
                                        <th style={S.th}>Timestamp</th>
                                        <th style={S.th}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(showAllPast ? pastTokens : pastTokens.slice(0, 2)).map((token, index) => (
                                        <motion.tr 
                                            key={token.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <td style={{ ...S.td, fontWeight: '900', color: 'var(--primary)' }}>Q{token.token_number}</td>
                                            <td style={S.td}>
                                                {token.shops?.name || (Array.isArray(token.shops) && token.shops[0]?.name) || "TrimTime Partner"}
                                            </td>
                                            <td style={S.td}>
                                                <span style={{ 
                                                    padding: '6px 14px', 
                                                    borderRadius: '10px', 
                                                    fontSize: '0.65rem', 
                                                    fontWeight: '950',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1.5px',
                                                    background: token.status === 'completed' ? '#ECFDF5' : '#F6F6F6', 
                                                    color: token.status === 'completed' ? '#059669' : 'rgba(0,0,0,0.4)',
                                                    border: token.status === 'completed' ? '1px solid #D1FAE5' : '1px solid #EEEEEE'
                                                }}>
                                                    {token.status}
                                                </span>
                                            </td>
                                            <td style={{ ...S.td, fontSize: '0.8rem', color: 'rgba(0,0,0,0.4)' }}>
                                                {new Date(token.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td style={S.td}>
                                                <button 
                                                    onClick={() => initiateRebook(token)}
                                                    style={{ 
                                                        background: '#000000', 
                                                        color: '#FFFFFF', 
                                                        border: 'none', 
                                                        padding: '8px 16px', 
                                                        borderRadius: '12px', 
                                                        fontSize: '0.7rem', 
                                                        fontWeight: '950', 
                                                        cursor: 'pointer',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '1px'
                                                    }}
                                                >
                                                    Rebook
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                            {pastTokens.length > 2 && (
                                <button
                                    onClick={() => setShowAllPast(!showAllPast)}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        background: '#F9F9F9',
                                        border: 'none',
                                        borderTop: '1px solid #EEEEEE',
                                        color: 'rgba(0,0,0,0.4)',
                                        fontWeight: '950',
                                        fontSize: '0.7rem',
                                        letterSpacing: '2px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    {showAllPast ? 'Show Less' : `View All History (${pastTokens.length} sessions)`}
                                    <motion.div animate={{ rotate: showAllPast ? 180 : 0 }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </motion.div>
                                </button>
                            )}
                        </>
                    )}
                </div>
            </motion.div>

            {/* Order History Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <h2 style={S.sectionTitle}>
                    <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '10px', 
                        background: '#F6F6F6', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    Order History
                </h2>
                <div style={S.historyBox}>
                    {orders.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(0,0,0,0.2)', fontWeight: '950', fontSize: '0.7rem', letterSpacing: '3px' }}>NO ORDERS PLACED YET</div>
                    ) : (
                        <table style={S.table} className="responsive-table">
                            <thead>
                                <tr>
                                    <th style={S.th}>Order ID</th>
                                    <th style={S.th}>Items</th>
                                    <th style={S.th}>Total</th>
                                    <th style={S.th}>Status</th>
                                    <th style={S.th}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order, index) => (
                                    <motion.tr 
                                        key={order.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.6 + (index * 0.05) }}
                                    >
                                        <td style={{ ...S.td, fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600' }}>
                                            #{order.id.slice(0, 8)}
                                        </td>
                                        <td style={S.td}>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                {order.order_items.map(item => (
                                                    <div key={item.id}>
                                                        {item.quantity}x {item.products?.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ ...S.td, fontWeight: '700' }}>₹{order.total_amount}</td>
                                        <td style={S.td}>
                                            <span style={{ 
                                                padding: '6px 14px', 
                                                borderRadius: '10px', 
                                                fontSize: '0.65rem', 
                                                fontWeight: '950',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1.5px',
                                                background: order.status === 'confirmed' ? '#ECFDF5' : '#F6F6F6', 
                                                color: order.status === 'confirmed' ? '#059669' : 'rgba(0,0,0,0.4)',
                                                border: order.status === 'confirmed' ? '1px solid #D1FAE5' : '1px solid #EEEEEE'
                                            }}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td style={{ ...S.td, fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
                                            {new Date(order.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>

            {/* Rebook Modal */}
            <AnimatePresence>
                {rebookModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 3000,
                            padding: '20px'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            style={{
                                background: '#FFFFFF',
                                borderRadius: '28px',
                                padding: '40px',
                                width: '100%',
                                maxWidth: '500px',
                                boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
                                maxHeight: '80vh',
                                overflowY: 'auto'
                            }}
                        >
                            <h3 style={{ fontSize: '1.8rem', fontWeight: '950', marginBottom: '8px', letterSpacing: '-1px' }}>Rebook Session</h3>
                            <p style={{ color: 'rgba(0,0,0,0.4)', fontWeight: '900', marginBottom: '32px', fontSize: '0.9rem' }}>At {rebookShop?.name}</p>

                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '2px', color: 'rgba(0,0,0,0.3)', display: 'block', marginBottom: '16px' }}>Select Services</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                                    {shopServices.length === 0 ? (
                                        <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(0,0,0,0.2)', fontWeight: '950', fontSize: '0.7rem', letterSpacing: '2px' }}>FETCHING SERVICES...</div>
                                    ) : (
                                        shopServices.map(service => (
                                            <button
                                                key={service.id}
                                                onClick={() => {
                                                    if (selectedServiceIds.includes(service.id)) {
                                                        setSelectedServiceIds(selectedServiceIds.filter(id => id !== service.id));
                                                    } else {
                                                        setSelectedServiceIds([...selectedServiceIds, service.id]);
                                                    }
                                                }}
                                                style={{
                                                    padding: '20px',
                                                    borderRadius: '16px',
                                                    border: '2px solid',
                                                    borderColor: selectedServiceIds.includes(service.id) ? '#000000' : '#EEEEEE',
                                                    background: selectedServiceIds.includes(service.id) ? '#F6F6F6' : '#FFFFFF',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease',
                                                    outline: 'none'
                                                }}
                                            >
                                                <div style={{ textAlign: 'left' }}>
                                                    <div style={{ fontWeight: '950', fontSize: '0.9rem' }}>{service.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.4)', fontWeight: '900' }}>{service.avg_time} mins</div>
                                                </div>
                                                {selectedServiceIds.includes(service.id) && (
                                                    <div style={{ width: '24px', height: '24px', background: '#000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setRebookModalOpen(false)}
                                    style={{ flex: 1, padding: '20px', borderRadius: '16px', border: '1px solid #EEEEEE', background: 'none', fontWeight: '950', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmRebook}
                                    disabled={rebookingLoading || selectedServiceIds.length === 0}
                                    style={{ 
                                        flex: 2, 
                                        padding: '20px', 
                                        borderRadius: '16px', 
                                        border: 'none', 
                                        background: '#000000', 
                                        color: '#FFFFFF', 
                                        fontWeight: '950', 
                                        cursor: 'pointer',
                                        opacity: (rebookingLoading || selectedServiceIds.length === 0) ? 0.5 : 1
                                    }}
                                >
                                    {rebookingLoading ? 'Booking...' : 'Confirm Rebook'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Profile;

