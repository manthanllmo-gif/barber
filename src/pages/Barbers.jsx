import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useShop } from '../contexts/ShopContext';

const Barbers = () => {
    const navigate = useNavigate();
    const { staff, queueData, shops } = useShop();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredStaff = useMemo(() => {
        return staff.filter(member => 
            member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.shops?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (member.specialty && member.specialty.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [staff, searchQuery]);

    return (
        <div style={{ padding: '24px', paddingBottom: '100px', minHeight: '100vh', background: '#FFFFFF' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button 
                    onClick={() => navigate('/')}
                    style={{ background: '#F6F6F6', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                    </svg>
                </button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#000' }}>Our Barbers</h1>
            </div>

            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: '32px' }}>
                <input 
                    type="text"
                    placeholder="Search by barber, shop or style..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '16px 20px',
                        paddingLeft: '52px',
                        borderRadius: '16px',
                        border: '1px solid #EEEEEE',
                        background: '#F9F9F9',
                        fontSize: '1rem',
                        fontWeight: '600',
                        outline: 'none',
                        color: '#000'
                    }}
                />
                <svg style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
            </div>

            {/* Barbers Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
                {filteredStaff.map((barber, i) => (
                    <motion.div
                        key={barber.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => navigate(`/barbers/${barber.id}`)}
                        style={{
                            background: '#FFFFFF',
                            borderRadius: '24px',
                            padding: '20px',
                            textAlign: 'center',
                            border: '1px solid #EEEEEE',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ 
                            width: '80px', 
                            height: '80px', 
                            borderRadius: '50%', 
                            margin: '0 auto 16px',
                            overflow: 'hidden',
                            background: '#F3F3F3',
                            border: '3px solid #FFF',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                        }}>
                            <img 
                                src={barber.image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${barber.name}`} 
                                alt={barber.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: '900', color: '#000', marginBottom: '4px' }}>{barber.name}</h3>
                        <p style={{ fontSize: '0.75rem', color: '#276EF1', fontWeight: '800', marginBottom: '8px', textTransform: 'uppercase' }}>
                            {barber.shops?.name || 'Pro Barber'}
                        </p>
                        {barber.specialty && (
                            <div style={{ background: '#F6F6F6', padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '700', color: '#545454', display: 'inline-block' }}>
                                {barber.specialty}
                            </div>
                        )}
                        <div style={{ marginTop: '12px', borderTop: '1px solid #F3F3F3', paddingTop: '12px' }}>
                            <div style={{ fontSize: '0.7rem', color: '#999', fontWeight: '700' }}>Active Now</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredStaff.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '20px' }}>💇‍♂️</div>
                    <h3 style={{ fontWeight: '900', marginBottom: '8px' }}>No barbers found</h3>
                    <p style={{ color: '#545454', fontWeight: '500' }}>Try searching for another name or shop.</p>
                </div>
            )}
        </div>
    );
};

export default Barbers;
