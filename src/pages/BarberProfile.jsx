import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { useShop } from '../contexts/ShopContext';

const BarberProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setCurrentShopId } = useShop();
    const [barber, setBarber] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBarber = async () => {
            try {
                const { data, error } = await supabase
                    .from('staff')
                    .select('*, shops(name)')
                    .eq('id', id)
                    .single();
                
                if (error) throw error;
                setBarber(data);
            } catch (err) {
                console.error('Error fetching barber:', err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBarber();
    }, [id]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--background)', color: 'var(--text-main)' }}>
                <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!barber) {
        return (
            <div style={{ padding: '100px 20px', textAlign: 'center', color: 'var(--text-main)', background: 'var(--background)', minHeight: '100vh' }}>
                <h2>Specialist not found</h2>
                <button onClick={() => navigate(-1)} style={{ marginTop: '20px', padding: '10px 20px', background: 'var(--text-main)', color: 'var(--background)', borderRadius: '8px', border: 'none', fontWeight: 'bold' }}>Go Back</button>
            </div>
        );
    }

    const handleBook = () => {
        if (barber.shop_id) {
            setCurrentShopId(barber.shop_id);
            navigate(`/queue?shopId=${barber.shop_id}&staffId=${barber.id}`);
        }
    };

    const S = {
        container: {
            background: 'var(--background)',
            minHeight: '100vh',
            color: 'var(--text-main)',
            fontFamily: 'var(--font-main)',
            paddingBottom: '120px'
        },
        header: {
            position: 'relative',
            height: '380px',
            margin: '12px',
            borderRadius: '32px',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-premium)'
        },
        headerImg: {
            width: '100%',
            height: '100%',
            objectFit: 'cover'
        },
        headerGradient: {
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, var(--background) 0%, transparent 40%)'
        },
        backBtn: {
            position: 'absolute',
            top: '20px',
            left: '20px',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--background)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-main)',
            border: '1px solid var(--border)',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        },
        content: {
            padding: '0 24px',
            marginTop: '12px',
            position: 'relative',
            zIndex: 5
        },
        title: {
            fontSize: '2.4rem',
            fontWeight: '950',
            margin: '0 0 4px 0',
            letterSpacing: '-1.2px',
            color: 'var(--text-main)',
            lineHeight: 1
        },
        subtitle: {
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            fontWeight: '700',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
        },
        statsRow: {
            display: 'flex',
            gap: '24px',
            marginTop: '32px',
            paddingBottom: '24px',
            borderBottom: '1px solid var(--border)'
        },
        statItem: {
            display: 'flex',
            flexDirection: 'column'
        },
        statValue: {
            fontSize: '1.4rem',
            fontWeight: '950',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
        },
        statLabel: {
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            fontWeight: '900',
            marginTop: '4px'
        },
        section: {
            marginTop: '40px'
        },
        sectionTitle: {
            fontSize: '0.75rem',
            fontWeight: '900',
            marginBottom: '20px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: 'var(--text-muted)'
        },
        pillContainer: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px'
        },
        pill: {
            padding: '10px 18px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            fontSize: '0.8rem',
            fontWeight: '800',
            color: 'var(--text-main)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.01)'
        },
        list: {
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        },
        listItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '20px',
            background: 'var(--surface)',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-premium)'
        },
        listIcon: {
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            border: '1px solid var(--border)'
        },
        floatingBtnContainer: {
            position: 'fixed',
            bottom: '90px', // Raised to clear bottom nav
            left: 0,
            right: 0,
            padding: '0 24px',
            zIndex: 100
        },
        bookBtn: {
            width: '100%',
            padding: '20px',
            background: 'var(--text-main)',
            color: 'var(--background)',
            border: 'none',
            borderRadius: '20px',
            fontSize: '1rem',
            fontWeight: '900',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-premium)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
        }
    };

    const imageUrl = barber.image_url || '/assets/image2.webp';
    const rating = barber.rating || 5.0;
    const experience = barber.experience_years || 0;
    const skills = barber.skills || [];
    const certificates = barber.certificates || [];
    const certificateUrls = barber.certificate_urls || [];
    const galleryUrls = barber.gallery_urls || [];
    const pastSalons = barber.past_salons || [];
    const shopName = barber.shops?.name || 'Independent';

    return (
        <div style={S.container}>
            {/* Header / Hero */}
            <div style={S.header}>
                <div style={S.backBtn} onClick={() => navigate(-1)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                    </svg>
                </div>
                <img src={imageUrl} alt={barber.name} style={S.headerImg} />
                <div style={S.headerGradient} />
            </div>

            {/* Main Content */}
            <div style={S.content}>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <h1 style={S.title}>{barber.name}</h1>
                    <p style={S.subtitle}>
                        <span style={{ color: '#00C853', fontSize: '1.2rem', lineHeight: 0 }}>●</span>
                        Available at {shopName}
                    </p>

                    <div style={S.statsRow}>
                        <div style={S.statItem}>
                            <div style={S.statValue}><span style={{ color: '#FFD600' }}>★</span> {rating}</div>
                            <div style={S.statLabel}>Rating</div>
                        </div>
                        <div style={S.statItem}>
                            <div style={S.statValue}>{experience}+ <span style={{ fontSize: '0.9rem', color: '#AAA', marginLeft: '4px' }}>Yrs</span></div>
                            <div style={S.statLabel}>Exp.</div>
                        </div>
                        <div style={S.statItem}>
                            <div style={S.statValue}>100+</div>
                            <div style={S.statLabel}>Reviews</div>
                        </div>
                    </div>
                </motion.div>

                {/* Skills Section */}
                {skills.length > 0 && (
                    <motion.div style={S.section} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                        <h3 style={S.sectionTitle}>Expertise</h3>
                        <div style={S.pillContainer}>
                            {skills.map((skill, i) => (
                                <div key={i} style={S.pill}>{skill}</div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Credentials */}
                {(certificates.length > 0 || certificateUrls.length > 0) && (
                    <motion.div style={S.section} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                        <h3 style={S.sectionTitle}>Certificates & Awards</h3>
                        
                        {certificates.length > 0 && (
                            <ul style={S.list}>
                                {certificates.map((cert, i) => (
                                    <li key={i} style={S.listItem}>
                                        <div style={S.listIcon}>🏅</div>
                                        <span style={{ fontWeight: '600' }}>{cert}</span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {certificateUrls.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', marginTop: certificates.length > 0 ? '16px' : '0' }}>
                                {certificateUrls.map((url, i) => (
                                    <div key={i} style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', aspectRatio: '3/2' }}>
                                        <img src={url} alt={`Certificate ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Styling Portfolio */}
                {galleryUrls.length > 0 && (
                    <motion.div style={S.section} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
                        <h3 style={S.sectionTitle}>Styling Portfolio</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                            {galleryUrls.map((url, i) => (
                                <div key={i} style={{ borderRadius: '12px', overflow: 'hidden', aspectRatio: '1/1' }}>
                                    <img src={url} alt={`Style ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Past Experience */}
                {pastSalons.length > 0 && (
                    <motion.div style={S.section} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                        <h3 style={S.sectionTitle}>Previous Experience</h3>
                        <ul style={S.list}>
                            {pastSalons.map((salon, i) => (
                                <li key={i} style={S.listItem}>
                                    <div style={S.listIcon}>✂️</div>
                                    <span style={{ fontWeight: '600' }}>{salon}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </div>

            {/* Floating Action Button */}
            <div style={S.floatingBtnContainer}>
                <motion.button 
                    whileTap={{ scale: 0.98 }}
                    style={S.bookBtn}
                    onClick={handleBook}
                >
                    Book Specialist Now
                </motion.button>
            </div>
        </div>
    );
};

export default BarberProfile;
