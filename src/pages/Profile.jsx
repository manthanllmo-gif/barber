import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CountdownTimer from '../components/common/CountdownTimer';

const AVG_TIME_MINS = 15;

const S = {
    container: {
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '120px 24px 60px',
        minHeight: '100vh',
    },
    header: {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '32px',
        padding: '40px',
        marginBottom: '60px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },
    userName: {
        fontSize: '2rem',
        fontWeight: '900',
        letterSpacing: '-0.5px',
        margin: 0,
        color: 'white',
        fontFamily: 'var(--font-heading)',
    },
    userPhone: {
        fontSize: '0.9rem',
        color: 'rgba(255, 255, 255, 0.4)',
        fontWeight: '600',
        letterSpacing: '0.5px',
    },
    logoutBtn: {
        padding: '12px 24px',
        background: 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        color: '#ff4d4d',
        fontWeight: '700',
        fontSize: '0.9rem',
        cursor: 'pointer',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        transition: 'all 0.3s ease',
    },
    sectionTitle: {
        fontSize: '1.2rem',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '3px',
        color: 'white',
        marginBottom: '30px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    tokenGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '20px',
        marginBottom: '60px',
    },
    tokenCard: {
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
    },
    tokenHeader: {
        marginBottom: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        paddingBottom: '20px',
        textAlign: 'center',
    },
    shopName: {
        fontSize: '1.5rem',
        fontWeight: '900',
        color: 'white',
        margin: '0 0 4px 0',
    },
    shopAddress: {
        fontSize: '0.9rem',
        color: 'rgba(255,255,255,0.4)',
        margin: 0,
    },
    tokenBody: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
    },
    tokenNumber: {
        fontSize: '2.5rem',
        fontWeight: '950',
        color: 'var(--primary)',
        letterSpacing: '-1px',
        lineHeight: 1,
        margin: '4px 0',
    },
    historyBox: {
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '32px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
    },
    table: {
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: '0',
    },
    th: {
        padding: '20px 24px',
        textAlign: 'left',
        fontSize: '0.75rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '2px',
        color: 'rgba(255,255,255,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    td: {
        padding: '20px 24px',
        color: 'white',
        fontSize: '0.95rem',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
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
            try {
                // 1. Fetch queue data AND services for accurate timing
                const [queueRes, servicesRes] = await Promise.all([
                    supabase
                        .from('tokens')
                        .select('id, token_number, status, called_at, preferred_staff_id, staff_id, services_selected')
                        .eq('shop_id', token.shop_id)
                        .in('status', ['pending', 'called'])
                        .order('token_number', { ascending: true }),
                    supabase
                        .from('services')
                        .select('id, name, avg_time')
                        .eq('shop_id', token.shop_id)
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
                    .eq('shop_id', token.shop_id)
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

                // If target is in the past (e.g. service took longer than expected), 
                // set it to now + 1 min to avoid zero display
                if (calculatedTarget < new Date()) {
                    calculatedTarget = new Date(Date.now() + 60000);
                }

                const diffMins = Math.max(1, Math.ceil((calculatedTarget - new Date()) / 60000));
                setWaitMins(diffMins);
                setTargetDate(calculatedTarget.toISOString());

            } catch (err) {
                console.error('Error calculating wait time:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchWaitTime();

        const channel = supabase
            .channel(`shop_queue_${token.shop_id}_${token.id}`)
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'tokens', filter: `shop_id=eq.${token.shop_id}` }, 
                () => fetchWaitTime()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [token.id, token.shop_id, token.preferred_staff_id]);

    if (loading) return <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>SYNCING LIVE DATA...</div>;

    if (token.status === 'called') {
        return (
            <div style={{ 
                width: '100%', 
                marginTop: '15px', 
                padding: '20px', 
                background: 'linear-gradient(135deg, var(--primary), #4f46e5)', 
                borderRadius: '24px', 
                textAlign: 'center',
                boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)',
                animation: 'pulse 2s infinite'
            }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⚡</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '900', color: 'white', textTransform: 'uppercase', letterSpacing: '2px' }}>It's Trim Time!</div>
                {preferredStaff && (
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', marginTop: '8px', fontWeight: '800' }}>
                        Requested Barber: {preferredStaff.name}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ width: '100%', marginTop: '15px' }}>
            {/* Top Grid: Estimate & Timer */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', textAlign: 'center', height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '1px', marginBottom: '2px' }}>Arrival Estimate</div>
                    <div style={{ fontSize: '1rem', fontWeight: '900', color: 'white' }}>{waitMins} MINS</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', overflow: 'hidden' }}>
                    <div style={{ transform: 'scale(0.6)', transformOrigin: 'center center' }}>
                        <CountdownTimer targetDate={targetDate} />
                    </div>
                </div>
            </div>

            {/* Bottom Grid: Now Serving & Rank */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', textAlign: 'center', height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '1px', marginBottom: '2px' }}>Now Serving</div>
                    <div style={{ fontSize: '1rem', fontWeight: '900', color: 'white' }}>
                        {nowServing.length > 0 ? `Q${nowServing[0]}` : '---'}
                    </div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', textAlign: 'center', height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '1px', marginBottom: '2px' }}>Queue Rank</div>
                    <div style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--primary)' }}>
                        #{Math.max(1, position + 1)}
                    </div>
                </div>
            </div>

            {preferredStaff && (
                <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: '800', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Barber: {preferredStaff.name}
                    </span>
                </div>
            )}
        </div>
    );
};

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [tokens, setTokens] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({ name: '', phone: '' });

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
                .select('*, shops(name, address)')
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

    if (!user) return <Navigate to="/" />;

    const activeTokens = tokens.filter(t => ['pending', 'called'].includes(t.status));
    const pastTokens = tokens.filter(t => !['pending', 'called'].includes(t.status));

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={S.container}
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
                            padding: 100px 16px 100px !important;
                        }
                        .empty-state-box {
                            padding: 40px 20px !important;
                        }
                    }
                `}</style>
            {/* Header Section */}
            <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={S.header}
                className="profile-header"
            >
                <div style={S.titleGroup}>
                    <h1 style={S.userName}>{profile.name}</h1>
                    {profile.phone && <span style={S.userPhone}>+91 {profile.phone}</span>}
                </div>
                <motion.button 
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 77, 77, 0.1)' }}
                    whileTap={{ scale: 0.95 }}
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
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }}></span>
                    Live Tokens
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '-25px', marginBottom: '25px', fontWeight: '600' }}>Your current active TrimTime sessions</p>
                
                <div style={S.tokenGrid}>
                    <AnimatePresence mode="popLayout">
                        {activeTokens.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="empty-state-box"
                                style={{ gridColumn: '1/-1', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '32px', border: '1px dashed rgba(255,255,255,0.1)' }}
                            >
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontWeight: '600', letterSpacing: '1px' }}>NO ACTIVE QUEUE TOKENS FOUND</p>
                            </motion.div>
                        ) : (
                            activeTokens.map((token, index) => (
                                <motion.div 
                                    key={token.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    style={S.tokenCard}
                                >
                                    <div style={S.tokenHeader}>
                                        <h3 style={S.shopName}>{token.shops?.name}</h3>
                                        <p style={S.shopAddress}>{token.shops?.address}</p>
                                    </div>

                                        <div style={S.tokenBody}>
                                            <div style={{ textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ 
                                                    padding: '6px 16px', 
                                                    background: 'rgba(255,255,255,0.08)', 
                                                    borderRadius: '12px', 
                                                    fontSize: '1rem', 
                                                    fontWeight: '900', 
                                                    color: 'var(--primary)', 
                                                    letterSpacing: '2px',
                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                    marginBottom: '4px'
                                                }}>TRIMTIME</div>
                                                <div style={S.tokenNumber}>Q{token.token_number}</div>
                                            </div>
                                        
                                        {token.status === 'pending' && <TokenWaitTimer token={token} />}
                                        
                                        {token.status === 'called' && (
                                            <motion.div 
                                                animate={{ scale: [1, 1.02, 1] }}
                                                transition={{ repeat: Infinity, duration: 2 }}
                                                style={{ padding: '16px 32px', background: 'var(--primary)', color: 'white', borderRadius: '20px', fontWeight: '900', letterSpacing: '1px', fontSize: '0.9rem', boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)', textAlign: 'center' }}
                                            >
                                                ⚡ IT'S TRIM TIME!
                                            </motion.div>
                                        )}


                                    </div>
                                </motion.div>
                            ))
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
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'inline-block' }}></span>
                    Past Tokens
                </h2>
                <div style={S.historyBox}>
                    {pastTokens.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontWeight: '600' }}>NO PAST SESSIONS RECORDED</div>
                    ) : (
                        <table style={S.table} className="responsive-table">
                            <thead>
                                <tr>
                                    <th style={S.th}>Token</th>
                                    <th style={S.th}>Establishment</th>
                                    <th style={S.th}>Outcome</th>
                                    <th style={S.th}>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pastTokens.map((token, index) => (
                                    <motion.tr 
                                        key={token.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 + (index * 0.05) }}
                                    >
                                        <td style={{ ...S.td, fontWeight: '900', color: 'var(--primary)' }}>Q{token.token_number}</td>
                                        <td style={S.td}>{token.shops?.name}</td>
                                        <td style={S.td}>
                                            <span style={{ 
                                                padding: '4px 12px', 
                                                borderRadius: '8px', 
                                                fontSize: '0.7rem', 
                                                fontWeight: '800',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                                background: token.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)', 
                                                color: token.status === 'completed' ? '#10b981' : 'rgba(255,255,255,0.4)' 
                                            }}>
                                                {token.status}
                                            </span>
                                        </td>
                                        <td style={{ ...S.td, fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
                                            {new Date(token.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
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
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }}></span>
                    Order History
                </h2>
                <div style={S.historyBox}>
                    {orders.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontWeight: '600' }}>NO ORDERS PLACED YET</div>
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
                                                padding: '4px 12px', 
                                                borderRadius: '8px', 
                                                fontSize: '0.7rem', 
                                                fontWeight: '800',
                                                textTransform: 'uppercase',
                                                letterSpacing: '1px',
                                                background: order.status === 'confirmed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)', 
                                                color: order.status === 'confirmed' ? '#10b981' : 'rgba(255,255,255,0.4)' 
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
        </motion.div>
    );
};

export default Profile;

