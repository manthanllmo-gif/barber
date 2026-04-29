import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Checkout = () => {
    const { cart, getCartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.user_metadata?.name || '',
        phone: user?.user_metadata?.phone || '',
        address: ''
    });

    if (cart.length === 0) {
        return <Navigate to="/" />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('Please login to place an order');
            navigate('/login');
            return;
        }

        setLoading(true);
        try {
            // 1. Create Order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    user_id: user.id,
                    customer_name: formData.name,
                    customer_phone: formData.phone,
                    delivery_address: formData.address,
                    total_amount: getCartTotal(),
                    status: 'pending',
                    shop_id: cart[0]?.shop_id
                }])
                .select('id, user_id, customer_name, customer_phone, delivery_address, total_amount, status, created_at, shop_id')
                .single();

            if (orderError) throw orderError;

            // 2. Create Order Items
            const orderItems = cart.map(item => ({
                order_id: order.id,
                product_id: item.id,
                quantity: item.quantity,
                price_at_time: item.price
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems);

            if (itemsError) throw itemsError;

            // 3. Success
            clearCart();
            alert('Order placed successfully!');
            navigate('/profile');
        } catch (err) {
            console.error('Error placing order:', err.message);
            alert('Failed to place order: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '120px auto 60px', padding: '0 20px' }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: '#1a1a24', padding: '40px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}
            >
                <h1 style={{ color: 'white', marginBottom: '30px', fontSize: '2rem', fontWeight: '800' }}>Checkout</h1>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '8px' }}>Full Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                            />
                        </div>
                        <div>
                            <label style={{ color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '8px' }}>Phone Number</label>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white' }}
                            />
                        </div>
                        <div>
                            <label style={{ color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '8px' }}>Delivery Address</label>
                            <textarea
                                required
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', minHeight: '100px' }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                marginTop: '10px'
                            }}
                        >
                            {loading ? 'Processing...' : `Place Order • ₹${getCartTotal()}`}
                        </button>
                    </form>

                    <div>
                        <h3 style={{ color: 'white', marginBottom: '20px' }}>Order Summary</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {cart.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.8)' }}>
                                    <span>{item.name} x {item.quantity}</span>
                                    <span>₹{item.price * item.quantity}</span>
                                </div>
                            ))}
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', color: 'white', fontWeight: '800', fontSize: '1.2rem' }}>
                                <span>Total</span>
                                <span style={{ color: 'var(--primary)' }}>₹{getCartTotal()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Checkout;
