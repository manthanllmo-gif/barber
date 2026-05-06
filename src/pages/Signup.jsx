import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Signup = () => {
    const { user, role, signup } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && role) {
            navigate('/');
        }
    }, [user, role, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (phone.length < 10) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);
        try {
            await signup(phone, password, name);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 80px)', 
            padding: '20px',
            boxSizing: 'border-box'
        }}>
            <div style={{ 
                padding: '40px', 
                width: '100%',
                maxWidth: '400px', 
                backgroundColor: '#161621', 
                borderRadius: '32px', 
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                position: 'relative',
                border: '1px solid rgba(255,255,255,0.08)'
            }}>
                <button 
                    onClick={() => navigate('/')}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: '14px',
                        color: 'rgba(255,255,255,0.4)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                        e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
                        e.target.style.color = '#fff';
                    }}
                    onMouseOut={(e) => {
                        e.target.style.backgroundColor = 'rgba(255,255,255,0.05)';
                        e.target.style.color = 'rgba(255,255,255,0.4)';
                    }}
                >
                    ✕
                </button>

                <h1 style={{ textAlign: 'center', marginBottom: '8px', color: 'white', fontSize: '1.8rem', fontWeight: '800' }}>Create Account</h1>
                <p style={{ textAlign: 'center', marginBottom: '32px', color: 'rgba(255,255,255,0.5)', fontSize: '0.95rem' }}>Join the TrimTimes community</p>

                {error && (
                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            style={{ 
                                width: '100%', 
                                padding: '14px', 
                                backgroundColor: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)', 
                                borderRadius: '16px', 
                                boxSizing: 'border-box', 
                                color: 'white',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Phone Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            style={{ 
                                width: '100%', 
                                padding: '14px', 
                                backgroundColor: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)', 
                                borderRadius: '16px', 
                                boxSizing: 'border-box', 
                                color: 'white',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                            placeholder="10-digit mobile number"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Create Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ 
                                width: '100%', 
                                padding: '14px', 
                                backgroundColor: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)', 
                                borderRadius: '16px', 
                                boxSizing: 'border-box', 
                                color: 'white',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '16px',
                            backgroundColor: '#2ecc71',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '16px',
                            fontSize: '1rem',
                            fontWeight: '700',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            marginTop: '10px',
                            transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => !loading && (e.target.style.transform = 'scale(1.02)')}
                        onMouseOut={(e) => !loading && (e.target.style.transform = 'scale(1)')}
                    >
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>
                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
                    Already have an account? <span onClick={() => navigate('/login')} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '700' }}>Sign In</span>
                </div>
            </div>
        </div>
    );
};

export default Signup;
