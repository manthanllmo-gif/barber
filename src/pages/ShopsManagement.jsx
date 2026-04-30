import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { fetchCompletedTokenCount, fetchAllProducts, deleteProduct, fetchStaff } from '../lib/api';

/* ─────────────────────────────────────────────────────────────
   STYLES
───────────────────────────────────────────────────────────── */
const S = {
    page: { padding: '28px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { margin: 0, fontSize: '24px', fontWeight: 700, color: '#1a1a2e' },
    addBtn: {
        padding: '10px 20px', backgroundColor: '#673ab7', color: '#fff', border: 'none',
        borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
    },
    editBtn: {
        padding: '5px 8px', backgroundColor: '#fff', color: '#673ab7', border: '1px solid #673ab7',
        borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '11px',
    },
    deleteBtn: {
        padding: '5px 8px', backgroundColor: '#fff', color: '#d32f2f', border: '1px solid #d32f2f',
        borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '11px',
        marginLeft: '4px',
    },
    hideBtn: (active) => ({
        padding: '5px 8px', backgroundColor: active ? '#fff' : '#f5f5f5',
        color: active ? '#2e7d32' : '#000000',
        border: active ? '1px solid #2e7d32' : '1px solid #000000',
        borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '11px',
        marginLeft: '4px',
    }),
    statusBadge: (active) => ({
        padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 700,
        backgroundColor: active ? '#e8f5e9' : '#eee',
        color: active ? '#1b5e20' : '#000000',
        textTransform: 'uppercase',
        marginLeft: '8px',
        verticalAlign: 'middle'
    }),
    // ── Table
    table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
    th: { textAlign: 'left', padding: '10px 12px', backgroundColor: '#f4f4f8', fontSize: '11px', fontWeight: 700, color: '#000000', borderBottom: '1px solid #eee', textTransform: 'uppercase', letterSpacing: '.4px' },
    td: { padding: '10px 12px', fontSize: '13px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle', color: '#000000' },
    tdMuted: { padding: '10px 12px', fontSize: '13px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle', color: '#000000' },
    clickRow: (expanded) => ({
        cursor: 'pointer',
        backgroundColor: expanded ? '#f8f5ff' : 'transparent',
        transition: 'background .15s',
    }),
    badge: (status) => ({
        padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
        backgroundColor: status === 'active' ? '#e8f5e9' : '#fce4ec',
        color: status === 'active' ? '#2e7d32' : '#c62828',
    }),
    emptyRow: { textAlign: 'center', padding: '40px', color: '#000000', fontSize: '15px' },
    // ── Detail panel (accordion)
    detailCell: { padding: 0, borderBottom: '2px solid #ede7f6', backgroundColor: '#faf7ff' },
    detailInner: { padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' },
    detailSection: { minWidth: 0 },
    detailHeading: { fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.6px', color: '#7c4dff', marginBottom: '8px' },
    detailItem: { fontSize: '13px', color: '#000000', padding: '5px 0', borderBottom: '1px solid #f0e6ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    detailMuted: { fontSize: '13px', color: '#000000', fontStyle: 'italic' },
    detailBadge: { fontSize: '11px', padding: '2px 7px', borderRadius: '8px', backgroundColor: '#ede7f6', color: '#5e35b1', fontWeight: 600 },
    // ── Modal
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 },
    modal: { position: 'relative', backgroundColor: '#fff', borderRadius: '14px', padding: '32px', width: '90%', maxWidth: '480px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' },
    closeX: {
        position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'none', fontSize: '22px', cursor: 'pointer', color: '#000000', opacity: 0.5,
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s', padding: '5px'
    },
    modalTitle: { margin: '0 0 22px 0', fontSize: '20px', fontWeight: 700, color: '#1a1a2e' },
    formGroup: { marginBottom: '16px' },
    label: { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 600, color: '#000000' },
    input: { width: '100%', padding: '10px 12px', borderRadius: '7px', border: '1px solid #999', fontSize: '14px', boxSizing: 'border-box', outline: 'none', color: '#000000' },
    divider: { borderTop: '1px dashed #cccccc', margin: '18px 0', fontSize: '11px', color: '#000000', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 },
    btnRow: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '22px' },
    cancelBtn: { padding: '10px 22px', background: 'transparent', border: '1px solid #000000', color: '#000000', borderRadius: '7px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 },
    submitBtn: (loading) => ({
        padding: '10px 22px', backgroundColor: loading ? '#9e9e9e' : '#673ab7',
        color: '#fff', border: 'none', borderRadius: '7px', cursor: loading ? 'not-allowed' : 'pointer',
        fontWeight: 600, fontSize: '14px', minWidth: '120px',
    }),
    errorBox: { backgroundColor: '#fdecea', border: '1px solid #f5c6cb', borderRadius: '7px', padding: '10px 14px', color: '#b71c1c', fontSize: '13px', marginBottom: '14px' },
    successBox: { backgroundColor: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: '7px', padding: '10px 14px', color: '#1b5e20', fontSize: '13px', marginBottom: '14px' },
    // ── Tabs
    tabBar: { display: 'flex', gap: '8px', marginBottom: '24px', backgroundColor: '#f0f0f5', padding: '5px', borderRadius: '12px', width: 'fit-content' },
    tab: (active) => ({
        padding: '8px 20px', borderRadius: '9px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
        backgroundColor: active ? '#fff' : 'transparent', color: active ? '#673ab7' : '#000000',
        boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', border: 'none'
    }),
    sourceBadge: (isSystem) => ({
        fontSize: '11px', padding: '3px 8px', borderRadius: '6px', fontWeight: 600,
        backgroundColor: isSystem ? '#f3e5f5' : '#e3f2fd', color: isSystem ? '#7b1fa2' : '#1565c0',
        border: `1px solid ${isSystem ? '#e1bee7' : '#bbdefb'}`
    }),
};

/* ─────────────────────────────────────────────────────────────
   DATA HELPERS (outside component — no hooks concerns)
───────────────────────────────────────────────────────────── */

// FIX: removed `status` from SELECT — it may not exist yet.
// We treat 'active' as the default in the UI until the column is confirmed.
async function fetchShops() {
    const { data, error } = await supabase
        .from('shops')
        .select('id, name, address, phone, created_at, is_active, image_url, features, rating, gallery_urls')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
}

async function fetchShopOwner(shopId) {
    if (!shopId) return null;
    const { data } = await supabase
        .from('users')
        .select('email, role, shop_id') // name is not in the users table
        .eq('shop_id', shopId)
        .eq('role', 'shop_owner')
        .maybeSingle();
    return data ?? null;
}

async function fetchShopServices(shopId) {
    const { data } = await supabase
        .from('services')
        .select('id, name, price, avg_time')
        .eq('shop_id', shopId)
        .order('name');
    return data ?? [];
}

async function fetchShopProducts(shopId) {
    const { data } = await supabase
        .from('products')
        .select('id, name, price, stock, image_url')
        .eq('shop_id', shopId)
        .order('name');
    return data ?? [];
}

// FIX: removed `status` from INSERT — the column may not exist yet.
// Once you add the column via SQL, this insert will still work (DB default = 'active').
async function createShopAndOwner({ shopName, address, phone, ownerPhone, password, image_url, rating, features, gallery_urls }) {
    const ownerEmail = `${ownerPhone}@shopowner.app`;

    // Process array fields
    const featuresArray = features ? features.split(',').map(f => f.trim()).filter(Boolean) : [];
    const galleryArray = gallery_urls ? gallery_urls.split(',').map(u => u.trim()).filter(Boolean) : [];
    const ratingValue = parseFloat(rating) || 5.0;

    // 1. Duplicate check
    const { data: existing, error: dupErr } = await supabase
        .from('users')
        .select('id')
        .eq('email', ownerEmail.toLowerCase());
    if (dupErr) throw dupErr;
    if (existing && existing.length > 0) throw new Error(`A user with phone "${ownerPhone}" already exists.`);

    // 2. Insert shop
    const { data: shop, error: shopErr } = await supabase
        .from('shops')
        .insert([{
            name: shopName.trim(),
            address: address.trim() || null,
            phone: phone.trim() || null,
            image_url: image_url?.trim() || null,
            rating: ratingValue,
            features: featuresArray,
            gallery_urls: galleryArray
        }])
        .select()
        .single();
    if (shopErr) throw shopErr;

    // 3. Supabase Auth signup (completely isolated client)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
            storageKey: 'supabase-signup-temp', // Use a unique key to avoid conflicts
            storage: {
                getItem: () => null,
                setItem: () => { },
                removeItem: () => { },
            }
        }
    });

    const { data: authResult, error: authErr } = await authClient.auth.signUp({
        email: ownerEmail,
        password: password,
        options: { data: { role: 'shop_owner' } },
    });

    if (authErr || !authResult?.user) {
        // Clean up the orphaned shop if auth fails
        await supabase.from('shops').delete().eq('id', shop.id);
        throw new Error(authErr?.message || 'Failed to create owner account (Unknown error)');
    }

    // 4. Insert public.users row
    const userPayload = {
        id: authResult.user.id, // Mandatory ID
        email: ownerEmail,
        role: 'shop_owner',
        shop_id: shop.id,
        phone: ownerPhone,
    };

    const { error: userErr } = await supabase.from('users').insert([userPayload]);
    if (userErr) {
        // If it's just 'phone' column missing, retry without it or ignore
        if (userErr.message.includes('phone')) {
            delete userPayload.phone;
            await supabase.from('users').insert([userPayload]);
        } else {
            await supabase.from('shops').delete().eq('id', shop.id);
            throw userErr;
        }
    }

    return { shop, authWarning: authErr?.message ?? null };
}

async function updateShopAndOwner(shopId, { shopName, address, phone, ownerPhone, password, image_url, rating, features, gallery_urls }) {
    // Process array fields
    const featuresArray = features ? (Array.isArray(features) ? features : features.split(',').map(f => f.trim()).filter(Boolean)) : [];
    const galleryArray = gallery_urls ? (Array.isArray(gallery_urls) ? gallery_urls : gallery_urls.split(',').map(u => u.trim()).filter(Boolean)) : [];
    const ratingValue = parseFloat(rating) || 5.0;

    // 1. Update shop details
    const { error: shopErr } = await supabase
        .from('shops')
        .update({
            name: shopName.trim(),
            address: address.trim() || null,
            phone: phone.trim() || null,
            image_url: image_url?.trim() || null,
            rating: ratingValue,
            features: featuresArray,
            gallery_urls: galleryArray
        })
        .eq('id', shopId);
    if (shopErr) throw shopErr;

    // 2. If owner credentials provided, create/link new owner
    if (ownerPhone?.trim() || password?.trim()) {
        if (!ownerPhone?.trim() || !password?.trim()) {
            throw new Error('Both New Owner Phone and Password are required to update credentials.');
        }

        const ownerEmail = `${ownerPhone}@shopowner.app`;

        // Create isolated client for signup
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const authClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, storageKey: 'supabase-signup-temp' }
        });

        const { data: authResult, error: authErr } = await authClient.auth.signUp({
            email: ownerEmail,
            password: password,
            options: { data: { role: 'shop_owner' } },
        });

        if (authErr || !authResult?.user) {
            throw new Error(`Credential update failed: ${authErr?.message || 'Unknown error'}`);
        }

        // Link new owner in public.users
        const userPayload = {
            id: authResult.user.id,
            email: ownerEmail,
            role: 'shop_owner',
            shop_id: shopId,
            phone: ownerPhone,
        };

        // Note: This replaces/adds users linked to the shop. 
        // In a real app we might delete the OLD user record from public.users here.
        const { error: userErr } = await supabase.from('users').upsert([userPayload]);
        if (userErr && userErr.message.includes('phone')) {
            delete userPayload.phone;
            await supabase.from('users').upsert([userPayload]);
        } else if (userErr) {
            throw userErr;
        }
    }

    return { success: true };
}

/* ─────────────────────────────────────────────────────────────
   SHOP DETAIL PANEL (accordion content)
───────────────────────────────────────────────────────────── */
const ShopDetailPanel = ({ shopId }) => {
    const [owner, setOwner] = useState(null);
    const [services, setServices] = useState([]);
    const [products, setProducts] = useState([]);
    const [staff, setStaff] = useState([]);
    const [tokensServed, setTokensServed] = useState(0);
    const [loading, setLoading] = useState(true);
    
    // Detailed Analytics States
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    const [analyticsData, setAnalyticsData] = useState({
        overall: { avgServiceTime: 0, totalTokens: 0, totalRevenue: 0 },
        staffMetrics: [],
        serviceMetrics: []
    });

    useEffect(() => {
        let live = true;
        Promise.all([
            fetchShopOwner(shopId),
            fetchShopServices(shopId),
            fetchShopProducts(shopId),
            fetchCompletedTokenCount(shopId),
            fetchStaff(shopId),
        ]).then(([o, sv, pr, tc, st]) => {
            if (!live) return;
            setOwner(o);
            setServices(sv);
            setProducts(pr);
            setTokensServed(tc);
            setStaff(st);
            setLoading(false);
        }).catch((e) => {
            console.error('[ShopDetail] fetch error:', e.message);
            if (live) setLoading(false);
        });
        return () => { live = false; };
    }, [shopId]);

    const fetchDetailedAnalytics = async () => {
        if (showAnalytics) {
            setShowAnalytics(false);
            return;
        }
        
        setLoadingAnalytics(true);
        setShowAnalytics(true);
        try {
            const { data: completedTokens, error: tokensError } = await supabase
                .from('tokens')
                .select('*, transactions(amount)')
                .eq('shop_id', shopId)
                .eq('status', 'completed');
            
            if (tokensError) throw tokensError;

            const staffMap = {};
            const serviceMap = {};
            let totalDuration = 0;
            let durationCount = 0;

            completedTokens.forEach(token => {
                if (token.staff_id) {
                    if (!staffMap[token.staff_id]) {
                        const sMember = staff.find(s => s.id === token.staff_id);
                        staffMap[token.staff_id] = {
                            name: sMember ? sMember.name : 'Unknown',
                            tokensServed: 0,
                            revenue: 0,
                            totalDuration: 0,
                            durationCount: 0
                        };
                    }
                    staffMap[token.staff_id].tokensServed += 1;
                    const txAmount = token.transactions?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
                    staffMap[token.staff_id].revenue += txAmount;

                    if (token.called_at && token.completed_at) {
                        const duration = (new Date(token.completed_at) - new Date(token.called_at)) / (1000 * 60);
                        if (duration > 0 && duration < 300) {
                            staffMap[token.staff_id].totalDuration += duration;
                            staffMap[token.staff_id].durationCount += 1;
                            totalDuration += duration;
                            durationCount += 1;
                        }
                    }
                }

                if (token.services_selected && Array.isArray(token.services_selected)) {
                    token.services_selected.forEach(sId => {
                        const service = services.find(s => s.id === sId || s.name === sId);
                        const sName = service ? service.name : sId;
                        serviceMap[sName] = (serviceMap[sName] || 0) + 1;
                    });
                }
            });

            const staffMetrics = Object.values(staffMap).map(s => ({
                ...s,
                avgTime: s.durationCount > 0 ? Math.round(s.totalDuration / s.durationCount) : 0
            })).sort((a, b) => b.revenue - a.revenue);

            const serviceMetrics = Object.entries(serviceMap).map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count);

            setAnalyticsData({
                staffMetrics,
                serviceMetrics,
                overall: {
                    avgServiceTime: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
                    totalRevenue: staffMetrics.reduce((sum, s) => sum + s.revenue, 0),
                    totalTokens: completedTokens.length
                }
            });
        } catch (err) {
            console.error('[Admin] Analytics fetch failed:', err);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    if (loading) return (
        <td colSpan={6} style={S.detailCell}>
            <div style={{ padding: '16px 24px', color: '#aaa', fontSize: '13px' }}>Loading details...</div>
        </td>
    );

    return (
        <td colSpan={6} style={S.detailCell}>
            <div className="shop-detail-inner" style={S.detailInner}>
                {/* Analytics Snapshot */}
                <div style={{ ...S.detailSection, backgroundColor: '#fdfbff', border: '1px solid #ede7f6', borderRadius: '10px', padding: '12px 18px' }}>
                    <div style={S.detailHeading}>🎟️ Activity Summary</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ fontSize: '24px', fontWeight: 800, color: '#673ab7' }}>{tokensServed}</span>
                            <span style={{ fontSize: '13px', color: '#666', fontWeight: 500, marginLeft: '8px' }}>Tokens Served</span>
                        </div>
                        <button 
                            onClick={fetchDetailedAnalytics}
                            style={{ padding: '6px 10px', backgroundColor: '#673ab7', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            {showAnalytics ? '✖ Close' : '📊 Analyze'}
                        </button>
                    </div>
                </div>

                {/* Owner */}
                <div style={S.detailSection}>
                    <div style={S.detailHeading}>👤 Owner</div>
                    {owner ? (
                        <>
                            <div style={{ ...S.detailItem, borderBottom: 'none' }}>
                                <span style={{ fontWeight: 600 }}>{owner.name || '—'}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>{owner.email}</div>
                        </>
                    ) : (
                        <span style={S.detailMuted}>No owner assigned</span>
                    )}
                </div>

                {/* Services */}
                <div style={S.detailSection}>
                    <div style={S.detailHeading}>✂️ Services ({services.length})</div>
                    {services.length === 0 ? (
                        <span style={S.detailMuted}>No services yet</span>
                    ) : (
                        services.map(sv => (
                            <div key={sv.id} style={S.detailItem}>
                                <span>{sv.name}</span>
                                <span style={S.detailBadge}>₹{sv.price}</span>
                            </div>
                        ))
                    )}
                </div>

                {/* Products */}
                <div style={S.detailSection}>
                    <div style={S.detailHeading}>📦 Products ({products.length})</div>
                    {products.length === 0 ? (
                        <span style={S.detailMuted}>No products yet</span>
                    ) : (
                        products.map(pr => (
                            <div key={pr.id} style={S.detailItem}>
                                <span>{pr.name}</span>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <span style={S.detailBadge}>₹{pr.price}</span>
                                    <span style={{ fontSize: '11px', color: pr.stock > 0 ? '#555' : '#e53935' }}>
                                        {pr.stock} in stock
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            
            {showAnalytics && (
                <div style={{ padding: '24px', borderTop: '1px solid #eee', backgroundColor: '#fff' }}>
                    {loadingAnalytics ? (
                        <div style={{ padding: '30px', textAlign: 'center', color: '#888' }}>
                            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⌛</div>
                            <p>Calculating performance metrics...</p>
                        </div>
                    ) : (
                        <div>
                            <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#1a1a2e' }}>📈 Detailed Performance Analysis</h4>
                            
                            <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '25px' }}>
                                <div style={{ padding: '15px', backgroundColor: '#f0f4f8', borderRadius: '10px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', marginBottom: '5px' }}>Avg Session</div>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2196f3' }}>{analyticsData.overall.avgServiceTime}m</div>
                                </div>
                                <div style={{ padding: '15px', backgroundColor: '#f0f4f8', borderRadius: '10px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', marginBottom: '5px' }}>Total Serviced</div>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4caf50' }}>{analyticsData.overall.totalTokens}</div>
                                </div>
                                <div style={{ padding: '15px', backgroundColor: '#f0f4f8', borderRadius: '10px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', marginBottom: '5px' }}>Est. Revenue</div>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#673ab7' }}>₹{analyticsData.overall.totalRevenue.toLocaleString('en-IN')}</div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <h5 style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', marginBottom: '10px' }}>Staff Performance</h5>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {analyticsData.staffMetrics.length === 0 ? <p style={{ fontSize: '13px', color: '#999' }}>No staff data available.</p> : analyticsData.staffMetrics.map(s => (
                                        <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px solid #eee' }}>
                                            <div style={{ fontSize: '13px', fontWeight: '600' }}>{s.name}</div>
                                            <div style={{ display: 'flex', gap: '15px', fontSize: '12px' }}>
                                                <span style={{ color: '#666' }}>{s.tokensServed} tokens</span>
                                                <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>₹{s.revenue.toLocaleString('en-IN')}</span>
                                                <span style={{ color: '#888' }}>{s.avgTime}m avg</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h5 style={{ fontSize: '12px', color: '#888', textTransform: 'uppercase', marginBottom: '10px' }}>Popular Services</h5>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {analyticsData.serviceMetrics.map(sm => (
                                        <div key={sm.name} style={{ fontSize: '11px', padding: '4px 10px', backgroundColor: '#f3e5f5', color: '#7b1fa2', borderRadius: '15px', fontWeight: 'bold' }}>
                                            {sm.name} ({sm.count})
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </td>
    );
};

/* ─────────────────────────────────────────────────────────────
   FORM DEFAULT STATE
───────────────────────────────────────────────────────────── */
const EMPTY_FORM = { 
    shopName: '', 
    address: '', 
    phone: '', 
    ownerPhone: '', 
    password: '', 
    image_url: '',
    rating: 5.0,
    features: '',
    gallery_urls: ''
};

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
const ShopsManagement = () => {
    const [shops, setShops] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [expandedId, setExpandedId] = useState(null); // which shop row is open
    const [showModal, setShowModal] = useState(false);
    const [editingShop, setEditingShop] = useState(null); // the shop object being edited
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [activeTab, setActiveTab] = useState('shops'); // 'shops' | 'products'
    const [allProducts, setAllProducts] = useState([]);
    const [fetchingProducts, setFetchingProducts] = useState(false);
    const [productModal, setProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState({ name: '', price: '', stock: '', image_url: '' });

    // loadShops — called from event handlers only (not directly in effect body)
    const loadShops = async () => {
        setFetching(true);
        try {
            const data = await fetchShops();
            setShops(data);
        } catch (e) {
            console.error('[ShopsManagement] load error:', e.message);
        } finally {
            setFetching(false);
        }
    };

    // Initial load — setState only in promise callbacks (satisfies strict lint rule)
    useEffect(() => {
        let live = true;
        setFetching(true);
        fetchShops()
            .then((data) => { if (live) { setShops(data); setFetching(false); } })
            .catch((e) => { 
                console.error('[ShopsManagement] init shops:', e.message); 
                if (live) { setLoadError(e.message); setFetching(false); } 
            });

        loadAllProductsData(live);
        return () => { live = false; };
    }, []);

    const loadAllProductsData = async (isLive = true) => {
        setFetchingProducts(true);
        try {
            const data = await fetchAllProducts();
            if (isLive) setAllProducts(data);
        } catch (e) {
            console.error('[ShopsManagement] products error:', e.message);
        } finally {
            if (isLive) setFetchingProducts(false);
        }
    };

    const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

    const openModal = () => { setEditingShop(null); setForm(EMPTY_FORM); setError(''); setSuccess(''); setShowModal(true); };
    const closeModal = () => setShowModal(false);

    const openEditModal = (e, shop) => {
        e.stopPropagation();
        setEditingShop(shop);
        setForm({
            shopName: shop.name || '',
            address: shop.address || '',
            phone: shop.phone || '',
            ownerPhone: '', // Admin enters only if they want to change owner phone
            password: '',   // Admin enters only if they want to reset password
            image_url: shop.image_url || '',
            rating: shop.rating || 5.0,
            features: Array.isArray(shop.features) ? shop.features.join(', ') : '',
            gallery_urls: Array.isArray(shop.gallery_urls) ? shop.gallery_urls.join(', ') : '',
        });
        setError(''); setSuccess(''); setShowModal(true);
    };

    const toggleRow = (id) => setExpandedId(prev => (prev === id ? null : id));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');

        if (editingShop) {
            return handleUpdate();
        }

        const { shopName, ownerPhone, password } = form;
        if (!shopName.trim() || !ownerPhone.trim() || !password.trim()) {
            setError('Shop Name, Owner Phone, and Password are required.');
            return;
        }
        setSubmitting(true);
        try {
            await createShopAndOwner(form);
            setSuccess(`✅ Shop created and owner phone ${form.ownerPhone} registered!`);
            setForm(EMPTY_FORM);
            await loadShops();
            setTimeout(() => { setShowModal(false); setSuccess(''); }, 2600);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        setSubmitting(true);
        try {
            await updateShopAndOwner(editingShop.id, form);
            setSuccess('✅ Shop updated successfully!');
            await loadShops();
            setTimeout(() => { setShowModal(false); setSuccess(''); }, 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteShop = async (e, shopId) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this shop? All related data (services, tokens, products) will be removed.')) return;
        
        try {
            const { error } = await supabase.from('shops').delete().eq('id', shopId);
            if (error) throw error;
            setSuccess('✅ Shop deleted successfully!');
            await loadShops();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleToggleVisibility = async (e, shop) => {
        e.stopPropagation();
        const newStatus = !shop.is_active;
        try {
            const { error } = await supabase
                .from('shops')
                .update({ is_active: newStatus })
                .eq('id', shop.id);
            if (error) throw error;
            await loadShops();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCreateGlobalProduct = async (e) => {
        e.preventDefault();
        setSubmitting(true); setError('');
        try {
            if (editingProduct) {
                const { error: err } = await supabase.from('products')
                    .update({
                        name: productForm.name,
                        price: parseInt(productForm.price) || 0,
                        stock: parseInt(productForm.stock) || 0,
                        image_url: productForm.image_url.trim() || null,
                    })
                    .eq('id', editingProduct.id);
                if (err) throw err;
                setSuccess('✅ Product updated!');
            } else {
                const { error: err } = await supabase.from('products').insert([{
                    name: productForm.name,
                    price: parseInt(productForm.price) || 0,
                    stock: parseInt(productForm.stock) || 0,
                    image_url: productForm.image_url.trim() || null,
                    shop_id: null // System product
                }]);
                if (err) throw err;
                setSuccess('✅ Global product added!');
            }
            setProductForm({ name: '', price: '', stock: '', image_url: '' });
            await loadAllProductsData();
            setTimeout(() => { setProductModal(false); setSuccess(''); setEditingProduct(null); }, 1500);
        } catch (err) { setError(err.message); }
        finally { setSubmitting(false); }
    };

    const openProductEditModal = (product) => {
        setEditingProduct(product);
        setProductForm({
            name: product.name,
            price: product.price,
            stock: product.stock,
            image_url: product.image_url || ''
        });
        setError('');
        setSuccess('');
        setProductModal(true);
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await deleteProduct(id);
            await loadAllProductsData();
        } catch (err) { alert(err.message); }
    };

    return (
        <div className="admin-page-container" style={S.page}>
            <style>{`
                @media (max-width: 768px) {
                    .admin-page-container {
                        padding: 16px !important;
                    }
                    .responsive-table-container {
                        overflow-x: auto;
                        -webkit-overflow-scrolling: touch;
                        margin-bottom: 20px;
                        border: 1px solid #eee;
                        border-radius: 8px;
                    }
                    .admin-modal {
                        width: 95% !important;
                        margin: 20px auto !important;
                        padding: 20px !important;
                    }
                    .shop-detail-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .shop-detail-panel {
                        margin-top: 20px !important;
                    }
                }
            `}</style>
            {/* ── Header ── */}
            <div style={S.header}>
                <h2 style={S.title}>🛡️ Admin Center</h2>
                {activeTab === 'shops' ? (
                    <button style={S.addBtn} onClick={openModal}>➕ Add Shop</button>
                ) : (
                    <button style={S.addBtn} onClick={() => { setEditingProduct(null); setProductForm({ name: '', price: '', stock: '', image_url: '' }); setError(''); setSuccess(''); setProductModal(true); }}>
                        ➕ Add Global Item
                    </button>
                )}
            </div>

            {/* ── Tabs ── */}
            <div style={S.tabBar}>
                <button style={S.tab(activeTab === 'shops')} onClick={() => setActiveTab('shops')}>🏪 Shops</button>
                <button style={S.tab(activeTab === 'products')} onClick={() => setActiveTab('products')}>📦 Products List</button>
            </div>

            {/* ── SHOPS TAB ── */}
            {activeTab === 'shops' && (
                loadError ? (
                    <div style={S.errorBox}>
                        <strong>Error loading shops:</strong> {loadError}
                        <button onClick={() => { setLoadError(null); loadShops(); }} style={{ marginLeft: '10px', padding: '4px 8px' }}>Retry</button>
                    </div>
                ) : fetching ? (
                    <p style={{ color: '#000000' }}>Loading shops...</p>
                ) : (
                    <div className="responsive-table-container">
                        <table style={S.table}>
                            <thead>
                                <tr>
                                    <th style={S.th}></th>
                                    <th style={S.th}>Shop Name</th>
                                    <th style={S.th}>Address</th>
                                    <th style={S.th}>Status</th>
                                    <th style={S.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shops.length === 0 ? (
                                    <tr><td colSpan={6} style={S.emptyRow}>No shops yet.</td></tr>
                                ) : (
                                    shops.map(shop => {
                                        const isExpanded = expandedId === shop.id;
                                        const createdDate = shop.created_at
                                            ? new Date(shop.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                            : '—';
                                        return (
                                            <React.Fragment key={shop.id}>
                                                <tr
                                                    style={S.clickRow(isExpanded)}
                                                    onClick={() => toggleRow(shop.id)}
                                                >
                                                    <td style={{ ...S.td, width: '36px', fontSize: '12px', color: '#9575cd' }}>
                                                        {isExpanded ? '▼' : '▶'}
                                                    </td>
                                                    <td style={{ ...S.td, fontWeight: 600, minWidth: '110px' }}>{shop.name}</td>
                                                    <td style={{ ...S.tdMuted, minWidth: '110px' }}>{shop.address || '—'}</td>
                                                    <td style={{ ...S.td, minWidth: '70px' }}>
                                                        <span style={S.statusBadge(shop.is_active)}>
                                                            {shop.is_active !== false ? 'Active' : 'Hidden'}
                                                        </span>
                                                    </td>
                                                    <td style={{ ...S.td, minWidth: '170px', textAlign: 'right' }}>
                                                        <button style={S.editBtn} onClick={(e) => openEditModal(e, shop)}>✏️ Edit</button>
                                                        <button style={S.hideBtn(shop.is_active !== false)} onClick={(e) => handleToggleVisibility(e, shop)}>
                                                            {shop.is_active !== false ? '👁️ Hide' : '🫥 Show'}
                                                        </button>
                                                        <button style={S.deleteBtn} onClick={(e) => handleDeleteShop(e, shop.id)}>🗑️ Delete</button>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr key={`detail-${shop.id}`}>
                                                        <ShopDetailPanel shopId={shop.id} />
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {/* ── PRODUCTS TAB ── */}
            {activeTab === 'products' && (
                fetchingProducts ? (
                    <p style={{ color: '#000000' }}>Loading inventory...</p>
                ) : (
                    <div className="responsive-table-container">
                        <table style={S.table}>
                            <thead>
                                <tr>
                                    <th style={S.th}>Product Name</th>
                                    <th style={S.th}>Price</th>
                                    <th style={S.th}>Stock</th>
                                    <th style={S.th}>Source</th>
                                    <th style={S.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allProducts.length === 0 ? (
                                    <tr><td colSpan={5} style={S.emptyRow}>No products found.</td></tr>
                                ) : (
                                    allProducts.map(p => (
                                        <tr key={p.id}>
                                             <td style={{ ...S.td, fontWeight: 600, minWidth: '120px' }}>{p.name}</td>
                                             <td style={{ ...S.td, minWidth: '60px' }}>₹{p.price}</td>
                                             <td style={{ ...S.td, color: p.stock > 0 ? '#333' : '#e53935', minWidth: '60px' }}>{p.stock}</td>
                                             <td style={{ ...S.td, minWidth: '120px' }}>
                                                 <span style={S.sourceBadge(!p.shop_id)}>
                                                     {p.shop_id ? `🏪 ${p.shops?.name || 'Shop'}` : '🏛️ System'}
                                                 </span>
                                             </td>
                                             <td style={{ ...S.td, minWidth: '70px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button
                                                        style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#673ab7' }}
                                                        onClick={() => openProductEditModal(p)}
                                                    >✏️</button>
                                                    <button
                                                        style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }}
                                                        onClick={() => handleDeleteProduct(p.id)}
                                                    >🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )
            )}      {/* ── Add Shop Modal ── */}
            {showModal && (
                <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="admin-modal" style={S.modal}>
                        <button style={S.closeX} onClick={closeModal} title="Close">✕</button>
                        <h3 style={S.modalTitle}>{editingShop ? '✏️ Edit Shop' : '➕ Add New Shop'}</h3>

                        {error && <div style={S.errorBox}>⚠️ {error}</div>}
                        {success && <div style={S.successBox}>{success}</div>}

                        <form onSubmit={handleSubmit} autoComplete="off">
                            <div style={S.formGroup}>
                                <label style={S.label} htmlFor="shopName">Shop Name *</label>
                                <input id="shopName" style={S.input} type="text" placeholder="e.g. BrightCuts Salon"
                                    value={form.shopName} onChange={handleChange('shopName')} required />
                            </div>
                            <div style={S.formGroup}>
                                <label style={S.label} htmlFor="shopAddress">Address</label>
                                <input id="shopAddress" style={S.input} type="text" placeholder="123 Main Street, City"
                                    value={form.address} onChange={handleChange('address')} />
                            </div>
                            <div style={S.formGroup}>
                                <label style={S.label} htmlFor="shopPhone">Shop Phone</label>
                                <input id="shopPhone" style={S.input} type="tel" placeholder="+91 99999 00000"
                                    value={form.phone} onChange={handleChange('phone')} />
                            </div>
                            <div style={S.formGroup}>
                                <label style={S.label} htmlFor="shopImage">Shop Hero Image URL</label>
                                <input id="shopImage" style={S.input} type="text" placeholder="e.g. /assets/salman.jpeg"
                                    value={form.image_url} onChange={handleChange('image_url')} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div style={S.formGroup}>
                                    <label style={S.label} htmlFor="rating">Rating (0-5)</label>
                                    <input id="rating" style={S.input} type="number" step="0.1" min="0" max="5"
                                        value={form.rating} onChange={handleChange('rating')} />
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label} htmlFor="features">Facilities (comma separated)</label>
                                    <input id="features" style={S.input} type="text" placeholder="WiFi, AC, Parking"
                                        value={form.features} onChange={handleChange('features')} />
                                </div>
                            </div>

                            <div style={S.formGroup}>
                                <label style={S.label} htmlFor="gallery">Gallery Image URLs (comma separated)</label>
                                <textarea id="gallery" style={{ ...S.input, height: '60px', resize: 'vertical' }} placeholder="url1, url2, url3"
                                    value={form.gallery_urls} onChange={handleChange('gallery_urls')} />
                            </div>

                            <div style={S.divider}>{editingShop ? 'Owner Auth (Optional)' : 'Owner Auth (Phone)'}</div>

                            <div style={S.formGroup}>
                                <label style={S.label} htmlFor="ownerPhone">
                                    {editingShop ? 'Change Owner Phone' : 'Owner Phone * (login)'}
                                </label>
                                <input id="ownerPhone" style={S.input} type="tel" placeholder="e.g. 9887766554"
                                    value={form.ownerPhone} onChange={handleChange('ownerPhone')}
                                    required={!editingShop} />
                            </div>
                            <div style={S.formGroup}>
                                <label style={S.label} htmlFor="password">
                                    {editingShop ? 'Set New Password' : 'Set Password *'}
                                </label>
                                <input id="password" style={S.input} type="password" placeholder="••••••••"
                                    value={form.password} onChange={handleChange('password')}
                                    required={!editingShop} />
                            </div>
                            <p style={{ fontSize: '11px', color: '#000000', margin: '0 0 10px' }}>
                                {editingShop
                                    ? 'ℹ️ Leave blank to keep current credentials.'
                                    : 'ℹ️ The owner will log in with this phone and password.'}
                            </p>

                            <div style={S.btnRow}>
                                <button type="button" style={S.cancelBtn} onClick={closeModal} disabled={submitting}>Cancel</button>
                                <button type="submit" style={S.submitBtn(submitting)} disabled={submitting}>
                                    {submitting ? 'Processing...' : (editingShop ? 'Save Changes' : 'Create Shop')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* ── Add Product Modal ── */}
            {productModal && (
                <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) setProductModal(false); }}>
                    <div className="admin-modal" style={S.modal}>
                        <button style={S.closeX} onClick={() => setProductModal(false)} title="Close">✕</button>
                        <h3 style={S.modalTitle}>{editingProduct ? '✏️ Edit Product' : '📦 Add Global Product'}</h3>
                        {error && <div style={S.errorBox}>⚠️ {error}</div>}
                        {success && <div style={S.successBox}>{success}</div>}

                        <form onSubmit={handleCreateGlobalProduct}>
                            <div style={S.formGroup}>
                                <label style={S.label}>Product Name *</label>
                                <input style={S.input} type="text" placeholder="e.g. Shampoo"
                                    value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required />
                            </div>
                            <div style={S.formGroup}>
                                <label style={S.label}>Price (₹) *</label>
                                <input style={S.input} type="number" placeholder="0"
                                    value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} required />
                            </div>
                            <div style={S.formGroup}>
                                <label style={S.label}>{editingProduct ? 'Update Stock' : 'Initial Stock'}</label>
                                <input style={S.input} type="number" placeholder="0"
                                    value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} />
                            </div>
                            <div style={S.formGroup}>
                                <label style={S.label}>Product Image URL</label>
                                <input style={S.input} type="text" placeholder="e.g. /assets/shampo.jpg"
                                    value={productForm.image_url} onChange={e => setProductForm({ ...productForm, image_url: e.target.value })} />
                            </div>
                            <div style={S.btnRow}>
                                <button type="button" style={S.cancelBtn} onClick={() => { setProductModal(false); setEditingProduct(null); }}>Cancel</button>
                                <button type="submit" style={S.submitBtn(submitting)} disabled={submitting}>
                                    {submitting ? 'Processing...' : (editingProduct ? 'Save Changes' : 'Add to Inventory')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShopsManagement;
