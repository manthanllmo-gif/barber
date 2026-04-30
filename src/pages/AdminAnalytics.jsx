import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AdminAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        overall: { totalRevenue: 0, totalTokens: 0, avgServiceTime: 0 },
        shopMetrics: [],
        staffMetrics: []
    });

    const fetchAllAnalytics = async () => {
        setLoading(true);
        try {
            // 1. Fetch data from Supabase
            const [
                { data: completedTokens },
                { data: transactions },
                { data: shops },
                { data: staff }
            ] = await Promise.all([
                supabase.from('tokens').select('*').eq('status', 'completed'),
                supabase.from('transactions').select('*'),
                supabase.from('shops').select('id, name'),
                supabase.from('staff').select('id, name, shop_id')
            ]);

            // 2. Process Overall
            const totalRevenue = transactions?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
            const totalTokens = completedTokens?.length || 0;

            let totalDuration = 0;
            let durationCount = 0;
            completedTokens?.forEach(t => {
                if (t.called_at && t.completed_at) {
                    const dur = (new Date(t.completed_at) - new Date(t.called_at)) / (1000 * 60);
                    if (dur > 0 && dur < 300) {
                        totalDuration += dur;
                        durationCount += 1;
                    }
                }
            });

            // 3. Process Shop Metrics
            const shopMap = {};
            shops?.forEach(s => { shopMap[s.id] = { name: s.name, tokens: 0, revenue: 0 }; });
            
            transactions?.forEach(tx => {
                if (tx.shop_id && shopMap[tx.shop_id]) {
                    shopMap[tx.shop_id].revenue += tx.amount;
                }
            });
            completedTokens?.forEach(t => {
                if (t.shop_id && shopMap[t.shop_id]) {
                    shopMap[t.shop_id].tokens += 1;
                }
            });

            const shopMetrics = Object.values(shopMap).sort((a, b) => b.revenue - a.revenue);

            // 4. Process Staff Metrics
            const staffMap = {};
            staff?.forEach(s => { 
                const shopName = shopMap[s.shop_id]?.name || 'Unknown Shop';
                staffMap[s.id] = { name: s.name, shopName, tokens: 0, revenue: 0, totalDur: 0, durCount: 0 }; 
            });

            completedTokens?.forEach(t => {
                if (t.staff_id && staffMap[t.staff_id]) {
                    staffMap[t.staff_id].tokens += 1;
                    if (t.called_at && t.completed_at) {
                        const dur = (new Date(t.completed_at) - new Date(t.called_at)) / (1000 * 60);
                        if (dur > 0 && dur < 300) {
                            staffMap[t.staff_id].totalDur += dur;
                            staffMap[t.staff_id].durCount += 1;
                        }
                    }
                }
            });

            // For staff revenue, we need to link transactions to tokens
            // This is a bit expensive if we fetch all tokens + transactions separately, 
            // but for a small/medium app it's fine.
            const tokenToTxAmount = {};
            transactions?.forEach(tx => {
                if (tx.token_id) {
                    tokenToTxAmount[tx.token_id] = (tokenToTxAmount[tx.token_id] || 0) + tx.amount;
                }
            });

            completedTokens?.forEach(t => {
                if (t.staff_id && staffMap[t.staff_id]) {
                    staffMap[t.staff_id].revenue += (tokenToTxAmount[t.id] || 0);
                }
            });

            const staffMetrics = Object.values(staffMap)
                .map(s => ({
                    ...s,
                    avgTime: s.durCount > 0 ? Math.round(s.totalDur / s.durCount) : 0
                }))
                .filter(s => s.tokens > 0)
                .sort((a, b) => b.revenue - a.revenue);

            setData({
                overall: {
                    totalRevenue,
                    totalTokens,
                    avgServiceTime: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0
                },
                shopMetrics,
                staffMetrics
            });

        } catch (err) {
            console.error("Master Analytics error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllAnalytics();
    }, []);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#000000' }}>Loading global analytics...</div>;

    return (
        <div className="admin-page-container" style={{ padding: '24px' }}>
            <style>{`
                @media (max-width: 768px) {
                    .admin-page-container {
                        padding: 16px !important;
                    }
                    .overall-analytics-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .leaderboards-grid {
                        grid-template-columns: 1fr !important;
                        gap: 20px !important;
                    }
                }
            `}</style>
            <h2 style={{ marginBottom: '24px', color: '#1a1a2e' }}>📊 Global Performance Analytics</h2>

            {/* Overall Cards */}
            <div className="overall-analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '12px', border: '1px solid #c8e6c9', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#2e7d32', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Total Revenue</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#1b5e20' }}>₹{data.overall.totalRevenue.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '12px', border: '1px solid #bbdefb', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#1565c0', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Total Tokens</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#0d47a1' }}>{data.overall.totalTokens}</div>
                </div>
                <div style={{ padding: '20px', backgroundColor: '#f3e5f5', borderRadius: '12px', border: '1px solid #e1bee7', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#7b1fa2', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Avg Service Time</div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#4a148c' }}>{data.overall.avgServiceTime}m</div>
                </div>
            </div>

            <div className="leaderboards-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                {/* Shop Leaderboard */}
                <div>
                    <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#000000' }}>🏪 Shop Performance</h3>
                    <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f8f9fa' }}>
                                    <th style={{ padding: '12px 15px', textAlign: 'left', fontSize: '12px', color: '#000000', fontWeight: 'bold' }}>Shop</th>
                                    <th style={{ padding: '12px 15px', textAlign: 'right', fontSize: '12px', color: '#000000', fontWeight: 'bold' }}>Tokens</th>
                                    <th style={{ padding: '12px 15px', textAlign: 'right', fontSize: '12px', color: '#000000', fontWeight: 'bold' }}>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.shopMetrics.map(shop => (
                                    <tr key={shop.name} style={{ borderTop: '1px solid #eee' }}>
                                        <td style={{ padding: '12px 15px', fontSize: '14px', fontWeight: '600', color: '#000000' }}>{shop.name}</td>
                                        <td style={{ padding: '12px 15px', textAlign: 'right', fontSize: '14px', color: '#000000' }}>{shop.tokens}</td>
                                        <td style={{ padding: '12px 15px', textAlign: 'right', fontSize: '14px', color: '#1b5e20', fontWeight: 'bold' }}>₹{shop.revenue.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Staff Leaderboard */}
                <div>
                    <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#000000' }}>✂️ Top Barbers</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {data.staffMetrics.slice(0, 8).map((staff, idx) => (
                            <div key={staff.name + idx} style={{ padding: '12px 15px', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#000000' }}>{staff.name}</div>
                                    <div style={{ fontSize: '11px', color: '#333333' }}>{staff.shopName}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#673ab7' }}>₹{staff.revenue.toLocaleString('en-IN')}</div>
                                    <div style={{ fontSize: '11px', color: '#000000' }}>{staff.tokens} tokens • {staff.avgTime}m avg</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
