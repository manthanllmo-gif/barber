import React from 'react';
import { useCart } from '../../contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const CartDrawer = ({ isOpen, onClose }) => {
    const { cart, removeFromCart, updateQuantity, getCartTotal } = useCart();
    const navigate = useNavigate();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 3000
                        }}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            width: 'min(100%, 400px)',
                            background: '#161621',
                            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
                            zIndex: 3001,
                            padding: '30px',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <h2 style={{ color: 'white', margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>Your Cart</h2>
                            <button 
                                onClick={onClose}
                                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.5rem', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '30px' }}>
                            {cart.length === 0 ? (
                                <div style={{ textAlign: 'center', marginTop: '100px', color: 'rgba(255,255,255,0.3)' }}>
                                    Your cart is empty
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {cart.map(item => (
                                        <div key={item.id} style={{ display: 'flex', gap: '15px', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '16px' }}>
                                            <img 
                                                src={item.image_url || '/assets/image1.webp'} 
                                                alt={item.name}
                                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '10px' }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: 'white', fontWeight: '700', marginBottom: '4px' }}>{item.name}</div>
                                                <div style={{ color: 'var(--primary)', fontWeight: '800', marginBottom: '10px' }}>₹{item.price}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px 8px' }}>
                                                        <button 
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0 8px' }}
                                                        >-</button>
                                                        <span style={{ color: 'white', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                                        <button 
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0 8px' }}
                                                        >+</button>
                                                    </div>
                                                    <button 
                                                        onClick={() => removeFromCart(item.id)}
                                                        style={{ background: 'none', border: 'none', color: '#ff4d4d', fontSize: '0.8rem', cursor: 'pointer' }}
                                                    >Remove</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', marginBottom: '20px', fontSize: '1.2rem', fontWeight: '800' }}>
                                    <span>Total</span>
                                    <span style={{ color: 'var(--primary)' }}>₹{getCartTotal()}</span>
                                </div>
                                <button 
                                    onClick={() => {
                                        onClose();
                                        navigate('/checkout');
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '16px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)'
                                    }}
                                >
                                    Proceed to Checkout
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
