import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const PublicDisplay = () => {
    const { shopId } = useParams();
    const [shop, setShop] = useState(null);
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchData = async () => {
        try {
            const [shopRes, tokensRes] = await Promise.all([
                supabase.from('shops').select('*').eq('id', shopId).single(),
                supabase.from('tokens')
                    .select('*, staff:staff_id(name)')
                    .eq('shop_id', shopId)
                    .in('status', ['pending', 'called', 'serving'])
                    .order('token_number', { ascending: true })
            ]);

            if (shopRes.data) setShop(shopRes.data);
            if (tokensRes.data) setTokens(tokensRes.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching display data:', err);
        }
    };

    useEffect(() => {
        if (!shopId) return;
        fetchData();
        const channel = supabase.channel(`public-${shopId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens', filter: `shop_id=eq.${shopId}` }, fetchData)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [shopId]);

    const nowServing = useMemo(() => tokens.filter(t => ['called', 'serving'].includes(t.status)), [tokens]);
    const upNext = useMemo(() => tokens.filter(t => t.status === 'pending'), [tokens]);

    // For the centerpiece, we take the first "now serving" token
    const mainToken = nowServing[0];

    if (loading) return (
        <div style={{ height: '100vh', background: '#0D0B14', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ width: 40, height: 40, border: '3px solid #FF4B6E', borderTopColor: 'transparent', borderRadius: '50%' }}
            />
        </div>
    );

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
            color: '#FFFFFF',
            fontFamily: "'Inter', sans-serif",
            display: 'flex',
            flexDirection: 'column',
            padding: '2vw 4vw',
            boxSizing: 'border-box',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Top Bar */}
            {/* Sleek Top Bar */}
            <header style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                zIndex: 10, 
                marginBottom: '4vh',
                background: 'rgba(255,255,255,0.03)',
                padding: '16px 28px',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(15px)',
                boxShadow: '0 15px 35px rgba(0,0,0,0.2)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ 
                        width: '54px', height: '54px', 
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))', 
                        borderRadius: '16px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '26px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                    }}>
                        🏛️
                    </div>
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: '900', color: '#FF4B6E', letterSpacing: '3px', marginBottom: '2px', textTransform: 'uppercase', opacity: 0.9 }}>PREMIUM PARTNER</div>
                        <h1 style={{ fontSize: '24px', fontWeight: '600', margin: 0, color: '#FFF', letterSpacing: '-0.5px' }}>{shop?.name || 'LaChak Salon'}</h1>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '32px', fontWeight: '950', color: '#FFF', lineHeight: '1', letterSpacing: '-1.5px', textShadow: '0 0 20px rgba(255,255,255,0.1)' }}>
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </div>
                    <div style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.4)', marginTop: '6px', letterSpacing: '2.5px', textTransform: 'uppercase' }}>
                        {currentTime.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                </div>
            </header>



            {/* Main Content Area */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0', overflow: 'hidden' }}>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: nowServing.length > 1 ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr',
                    gap: '30px',
                    width: '100%',
                    maxHeight: '65vh',
                    justifyItems: 'center',
                    alignItems: 'center'
                }}>
                    <AnimatePresence mode="popLayout">
                        {nowServing.length > 0 ? nowServing.map((token) => (
                            <motion.div
                                key={token.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
                            >
                                <div style={{ 
                                    background: '#FF4B6E', 
                                    padding: '4px 15px', 
                                    borderRadius: '100px', 
                                    fontSize: '10px', 
                                    fontWeight: '800',
                                    marginBottom: '10px',
                                    boxShadow: '0 0 20px rgba(255, 75, 110, 0.4)'
                                }}>
                                    NOW SERVING
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%', justifyContent: 'center' }}>
                                    {/* Visualizer Left */}
                                    <div className="visualizer" style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                                        {[1, 2, 3].map(i => (
                                            <motion.div 
                                                key={i}
                                                animate={{ height: [15, 30, 15] }}
                                                transition={{ duration: 1 + i*0.2, repeat: Infinity }}
                                                style={{ width: '3px', background: 'linear-gradient(to bottom, #FF4B6E, #8A2BE2)', borderRadius: '2px' }}
                                            />
                                        ))}
                                    </div>

                                    <div style={{ 
                                        fontSize: nowServing.length > 3 ? '40px' : nowServing.length > 2 ? '55px' : nowServing.length > 1 ? '75px' : '110px', 
                                        fontWeight: '950', 
                                        lineHeight: 1, 
                                        textShadow: '0 15px 40px rgba(0,0,0,0.6)',
                                        letterSpacing: '-2px'
                                    }}>
                                        Q{token.token_number}
                                    </div>

                                    {/* Visualizer Right */}
                                    <div className="visualizer" style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                                        {[1, 2, 3].map(i => (
                                            <motion.div 
                                                key={i}
                                                animate={{ height: [15, 30, 15] }}
                                                transition={{ duration: 1 + (3-i)*0.2, repeat: Infinity }}
                                                style={{ width: '3px', background: 'linear-gradient(to bottom, #8A2BE2, #FF4B6E)', borderRadius: '2px' }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                
                                {token.staff && (
                                    <div style={{ fontSize: '14px', fontWeight: '700', opacity: 0.5, marginTop: '5px' }}>
                                        {token.staff.name}
                                    </div>
                                )}
                            </motion.div>
                        )) : (
                            <div style={{ fontSize: '40px', opacity: 0.1, fontWeight: '900', gridColumn: '1/-1' }}>WELCOME</div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Next Section */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '4vh' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '800px' }}>
                    <div style={{ 
                        position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                        background: '#8A2BE2', padding: '4px 15px', borderRadius: '100px', 
                        fontSize: '10px', fontWeight: '800', zIndex: 5,
                        boxShadow: '0 4px 10px rgba(138, 43, 226, 0.3)'
                    }}>
                        NEXT
                    </div>
                    <div style={{ 
                        background: 'rgba(255,255,255,0.03)', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: '20px', 
                        padding: '30px 20px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '20px'
                    }}>
                        {upNext.length > 0 ? upNext.slice(0, 4).map((token, idx) => (
                            <div key={token.id} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ fontSize: '32px', fontWeight: '700', color: '#FFF' }}>Q{token.token_number}</div>
                                {idx < Math.min(upNext.length, 4) - 1 && (
                                    <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }} />
                                )}
                            </div>
                        )) : (
                            <div style={{ opacity: 0.3, fontWeight: '600' }}>NO UPCOMING TOKENS</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Announcement */}
            <footer style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', opacity: 0.7, fontSize: '14px', marginBottom: '2vh' }}>
                <span>🔊</span>
                <span>It's TrimTimes! Token Q{mainToken?.token_number || '---'} please move to the counter.</span>
            </footer>

            {/* Trust Ticker - Refined Bottom Bar */}
            <div style={{
                width: '100vw',
                marginLeft: '-4vw', 
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(15px)',
                padding: '18px 0',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                zIndex: 100
            }}>
                <motion.div
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    style={{ display: 'inline-flex', gap: '60px', alignItems: 'center' }}
                >
                    {[1, 2].map(i => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '60px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '10px', color: '#FF4B6E' }}>✦</span>
                                <span style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '3px', color: '#FFF' }}>PREMIUM GROOMING EXPERIENCE</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '10px', color: '#8A2BE2' }}>✦</span>
                                <span style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '3px', color: '#FFF' }}>ZERO WAIT GUARANTEE</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '10px', color: '#FF4B6E' }}>✦</span>
                                <span style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '3px', color: '#FFF' }}>YOUR TIME, RESPECTED</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ 
                                    fontSize: '15px', 
                                    fontWeight: '1000', 
                                    letterSpacing: '1px', 
                                    color: '#FFF', 
                                    background: 'linear-gradient(90deg, #FF4B6E, #8A2BE2)', 
                                    padding: '6px 16px', 
                                    borderRadius: '8px',
                                    boxShadow: '0 0 20px rgba(255, 75, 110, 0.2)'
                                }}>POWERED BY TRIMTIMES</span>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>



            <style>
                {`
                    @media (max-height: 600px) {
                        div[style*="bottom: 0"] { display: none !important; }
                    }
                    @media (max-height: 500px) {
                        header { padding: 5px 0 !important; }
                        h1 { font-size: 18px !important; }
                        main div[style*="fontSize: 110px"] { font-size: 70px !important; }
                        .visualizer { display: none !important; }
                        div[style*="padding: 30px 20px"] { padding: 15px !important; }
                        div[style*="fontSize: 32px"] { font-size: 24px !important; }
                        footer { font-size: 11px !important; margin-top: 10px !important; }
                    }
                `}
            </style>
        </div>
    );
};

export default PublicDisplay;
