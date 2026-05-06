import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

const PolicyModal = ({ activePolicy, onClose }) => {
    if (!activePolicy) return null;

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        inset: 0,
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
                        maxWidth: '600px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '32px',
                        padding: '40px',
                        boxShadow: 'var(--shadow-premium)',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        color: 'var(--text-main)'
                    }}
                >
                    <button 
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '24px',
                            right: '24px',
                            border: 'none',
                            background: 'var(--surface-elevated)',
                            color: 'var(--text-main)',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >✕</button>

                    <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '24px', color: 'var(--text-main)', fontFamily: "'Bodoni Moda', serif" }}>
                        {activePolicy === 'about' && 'About Us'}
                        {activePolicy === 'contact' && 'Contact Us'}
                        {activePolicy === 'privacy' && 'Privacy Policy'}
                        {activePolicy === 'refund' && 'Return & Refund'}
                    </h2>

                    <div style={{ color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '1rem' }}>
                        {activePolicy === 'about' && (
                            <>
                                <p>TrimTimes is the world's most sophisticated barber queue management platform. We bridge the gap between premium grooming services and busy individuals who value their time.</p>
                                <p style={{ marginTop: '16px' }}>Our mission is to eliminate wait times and revolutionize the grooming industry through real-time synchronization and a seamless user experience.</p>
                            </>
                        )}
                        {activePolicy === 'contact' && (
                            <>
                                <p>We're here to help you with any questions about your booking, token, or our platform.</p>
                                <div style={{ marginTop: '24px', background: 'var(--surface-elevated)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)' }}>
                                    <p style={{ marginBottom: '12px' }}><strong>Email:</strong> support@trimtimes.com</p>
                                    <p style={{ marginBottom: '12px' }}><strong>WhatsApp:</strong> +91 99812 84141</p>
                                    <p><strong>Support Hours:</strong> 10:00 AM - 8:00 PM (Mon-Sat)</p>
                                </div>
                            </>
                        )}
                        {activePolicy === 'privacy' && (
                            <>
                                <p>Your privacy is our top priority. We only collect the data necessary to provide you with the best booking experience.</p>
                                <ul style={{ marginTop: '16px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <li>We do not sell your personal information.</li>
                                    <li>Your location is used only to show nearby shops.</li>
                                    <li>Payment data is processed through secure, encrypted gateways.</li>
                                </ul>
                            </>
                        )}
                        {activePolicy === 'refund' && (
                            <>
                                <p style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '16px' }}>IMPORTANT: EXCHANGE ONLY POLICY</p>
                                <p>Due to the nature of our digital services and premium products, we maintain a strict <strong>No Return</strong> policy. However, we offer an <strong>Exchange Only</strong> option under the following conditions:</p>
                                <ul style={{ marginTop: '16px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <li>Product defects or shipping damage.</li>
                                    <li>Incorrect item received.</li>
                                    <li>Service credit exchange if a shop is unable to fulfill a confirmed booking.</li>
                                </ul>
                                <p style={{ marginTop: '16px' }}>All exchange requests must be initiated within 24 hours of the service or product delivery.</p>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const Footer = () => {
    const navigate = useNavigate();
    const { isDarkMode } = useTheme();
    const [activePolicy, setActivePolicy] = useState(null);

    const whatsappLink = `https://wa.me/919981284141?text=${encodeURIComponent("Hello! I'm interested in onboarding my shop with TrimTimes. Please provide more details.")}`;

    return (
        <footer style={{ 
            background: 'var(--background)', 
            padding: '100px 5% 40px',
            borderTop: '1px solid var(--border)',
            color: 'var(--text-main)'
        }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '60px', flexWrap: 'wrap', marginBottom: '80px' }}>
                    <div style={{ flex: '1', minWidth: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <img 
                                src={isDarkMode ? "/assets/logo_black.png" : "/assets/logo_white.png"} 
                                alt="TrimTimes" 
                                style={{ 
                                    height: '32px'
                                }} 
                            />
                            <div style={{ fontWeight: '950', color: 'var(--text-main)', fontSize: '1.8rem', letterSpacing: '-1px', fontFamily: "'Bodoni Moda', serif" }}>TRIMTIMES<span style={{ color: '#276EF1' }}>.</span></div>
                        </div>
                        <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', maxWidth: '360px', fontSize: '1rem' }}>
                            The world's most sophisticated barber queue management platform. Bridging the gap between premium grooming and your time.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                            {['📸', '✖️', '📘'].map((icon, i) => (
                                <div key={i} style={{ 
                                    width: '44px', height: '44px', borderRadius: '14px', background: 'var(--surface)', 
                                    border: '1px solid var(--border)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                    transition: 'all 0.2s ease', fontSize: '1.2rem'
                                }}>
                                    {icon}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '80px', flexWrap: 'wrap' }}>
                        <div>
                            <h4 style={{ fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '32px', color: 'var(--text-muted)', opacity: 0.5 }}>Platform</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} className="footer-link" onClick={() => setActivePolicy('about')}>About Us</span>
                                <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} className="footer-link" onClick={() => navigate('/salons')}>Explore Shops</span>
                                <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} className="footer-link" onClick={() => navigate('/shop')}>Grooming Shop</span>
                                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>Join as Owner</a>
                            </div>
                        </div>
                        <div>
                            <h4 style={{ fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '32px', color: 'var(--text-muted)', opacity: 0.5 }}>Support</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                                <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} className="footer-link" onClick={() => setActivePolicy('contact')}>Help Center</span>
                                <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} className="footer-link" onClick={() => setActivePolicy('contact')}>Contact Us</span>
                                <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} className="footer-link" onClick={() => setActivePolicy('privacy')}>Privacy Policy</span>
                                <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} className="footer-link" onClick={() => setActivePolicy('refund')}>Return & Refund</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>© 2026 TrimTimes Global. Excellence in Grooming.</div>
                    <div style={{ display: 'flex', gap: '32px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <span style={{ cursor: 'pointer' }}>Terms</span>
                        <span style={{ cursor: 'pointer' }}>Cookies</span>
                    </div>
                </div>
            </div>

            <PolicyModal activePolicy={activePolicy} onClose={() => setActivePolicy(null)} />

            <style>{`
                .footer-link:hover { color: var(--text-main) !important; }
            `}</style>
        </footer>
    );
};

export default Footer;
