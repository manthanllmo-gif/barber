import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingOrder, setUpdatingOrder] = useState(null);

    useEffect(() => {
        fetchOrders();

        const channel = supabase
            .channel('admin-orders-tracking')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchOrders())
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id, user_id, customer_name, customer_phone, delivery_address, total_amount, status, created_at, shop_id,
                    order_items (
                        *,
                        products (*)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setOrders(data || []);
        } catch (err) {
            console.error('Error fetching global orders:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            setUpdatingOrder(orderId);
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;
            fetchOrders();
        } catch (err) {
            console.error('Error updating global order status:', err.message);
            alert('Failed to update order status');
        } finally {
            setUpdatingOrder(null);
        }
    };

    if (loading && orders.length === 0) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Loading global orders...</div>;
    }

    return (
        <div className="admin-page-container" style={{ padding: '28px' }}>
            <style>{`
                @media (max-width: 768px) {
                    .admin-page-container {
                        padding: 16px !important;
                    }
                    .responsive-table-container {
                        padding: 16px !important;
                    }
                    .order-header {
                        flex-direction: column;
                        align-items: flex-start !important;
                        gap: 12px;
                    }
                    .order-card-header {
                        flex-direction: column;
                        gap: 16px;
                    }
                    .order-card-header-right {
                        text-align: left !important;
                    }
                    .order-details-grid {
                        grid-template-columns: 1fr !important;
                        gap: 16px !important;
                    }
                    .order-actions {
                        flex-direction: column;
                        width: 100%;
                    }
                    .order-actions button {
                        width: 100%;
                    }
                }
            `}</style>
            <div className="order-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#1a1a2e' }}>Global Product Orders</h2>
                <button 
                    onClick={fetchOrders}
                    style={{ 
                        padding: '8px 16px', 
                        borderRadius: '8px', 
                        border: '1px solid #ddd', 
                        background: '#fff', 
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600
                    }}
                >
                    🔄 Refresh
                </button>
            </div>

            {orders.length === 0 ? (
                <div style={{ padding: '80px', textAlign: 'center', background: '#fff', borderRadius: '16px', border: '1px solid #eee' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                    <p style={{ color: '#666', margin: 0 }}>No orders received across the platform.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {orders.map(order => (
                        <div key={order.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <div className="order-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontWeight: '800', fontSize: '18px', color: '#1a1a2e' }}>Order #{order.id.slice(0, 8)}</span>
                                        <span style={{ 
                                            fontSize: '11px', 
                                            fontWeight: '800', 
                                            padding: '4px 10px', 
                                            borderRadius: '8px',
                                            textTransform: 'uppercase',
                                            background: order.status === 'delivered' ? '#e8f5e9' : 
                                                       order.status === 'shipped' ? '#e8eaf6' : 
                                                       '#fff3e0',
                                            color: order.status === 'delivered' ? '#2e7d32' : 
                                                   order.status === 'shipped' ? '#3f51b5' : 
                                                   '#ef6c00'
                                        }}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#000000', marginTop: '4px' }}>
                                        {new Date(order.created_at).toLocaleString()}
                                    </div>
                                </div>
                                <div className="order-card-header-right" style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '12px', color: '#888' }}>Total Amount</div>
                                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#2e7d32' }}>₹{order.total_amount.toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="order-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' }}>
                                <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '16px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#000000', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Customer</div>
                                    <div style={{ fontWeight: '600', color: '#000000' }}>{order.customer_name}</div>
                                    <div style={{ fontSize: '13px', color: '#333333', marginTop: '2px' }}>{order.customer_phone}</div>
                                    <div style={{ marginTop: '12px', fontSize: '13px', color: '#000000', lineHeight: '1.4' }}>{order.delivery_address}</div>
                                </div>

                                <div style={{ background: '#f8f9fa', borderRadius: '12px', padding: '16px' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#000000', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Order Items</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {order.order_items?.map(item => (
                                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                                                <span style={{ color: '#000000' }}>{item.products?.name} (x{item.quantity})</span>
                                                <span style={{ fontWeight: '600', color: '#000000' }}>₹{item.price_at_time * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="order-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                {order.status === 'pending' && (
                                    <button 
                                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                                        disabled={updatingOrder === order.id}
                                        style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3f51b5', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        {updatingOrder === order.id ? '...' : 'Confirm'}
                                    </button>
                                )}
                                {order.status === 'confirmed' && (
                                    <button 
                                        onClick={() => updateOrderStatus(order.id, 'shipped')}
                                        disabled={updatingOrder === order.id}
                                        style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#673ab7', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        {updatingOrder === order.id ? '...' : 'Ship'}
                                    </button>
                                )}
                                {order.status === 'shipped' && (
                                    <button 
                                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                                        disabled={updatingOrder === order.id}
                                        style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#2e7d32', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        {updatingOrder === order.id ? '...' : 'Deliver'}
                                    </button>
                                )}
                                <button style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', color: '#666', fontWeight: 600, cursor: 'pointer' }}>Details</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
