import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { useShop } from '../../contexts/ShopContext';

/* ─────────────────────────────────────────────────────────────
   STYLES (Consistent with AdminStaff.jsx)
 ───────────────────────────────────────────────────────────── */
const S = {
    page: { padding: '28px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    title: { margin: 0, fontSize: '24px', fontWeight: 700, color: '#1a1a2e' },
    addBtn: {
        padding: '10px 20px', backgroundColor: '#673ab7', color: '#fff', border: 'none',
        borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
    },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
    card: { background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #eee' },
    cardContent: { padding: '16px' },
    imgContainer: { height: '160px', background: '#f4f4f8', position: 'relative' },
    serviceImg: { width: '100%', height: '100%', objectFit: 'cover' },
    editBtn: {
        padding: '6px 12px', backgroundColor: '#fff', color: '#673ab7', border: '1px solid #673ab7',
        borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '12px', flex: 1
    },
    deleteBtn: {
        padding: '6px 12px', backgroundColor: '#fff', color: '#d32f2f', border: '1px solid #d32f2f',
        borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '12px', flex: 1
    },
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 },
    modal: { position: 'relative', backgroundColor: '#fff', borderRadius: '14px', padding: '32px', width: '90%', maxWidth: '500px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' },
    closeX: {
        position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'none', fontSize: '22px', cursor: 'pointer', color: '#000', opacity: 0.5,
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s', padding: '5px'
    },
    modalTitle: { margin: '0 0 22px 0', fontSize: '20px', fontWeight: 700, color: '#1a1a2e' },
    formGroup: { marginBottom: '16px' },
    label: { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 600, color: '#000' },
    input: { width: '100%', padding: '10px 12px', borderRadius: '7px', border: '1px solid #999', fontSize: '14px', boxSizing: 'border-box', outline: 'none', color: '#000' },
    textarea: { width: '100%', padding: '10px 12px', borderRadius: '7px', border: '1px solid #999', fontSize: '14px', boxSizing: 'border-box', outline: 'none', color: '#000', minHeight: '80px' },
    btnRow: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '22px' },
    cancelBtn: { padding: '10px 22px', background: 'transparent', border: '1px solid #000', color: '#000', borderRadius: '7px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 },
    submitBtn: (loading) => ({
        padding: '10px 22px', backgroundColor: loading ? '#9e9e9e' : '#673ab7',
        color: '#fff', border: 'none', borderRadius: '7px', cursor: loading ? 'not-allowed' : 'pointer',
        fontWeight: 600, fontSize: '14px', minWidth: '120px',
    }),
    errorBox: { backgroundColor: '#fdecea', border: '1px solid #f5c6cb', borderRadius: '7px', padding: '10px 14px', color: '#b71c1c', fontSize: '13px', marginBottom: '14px' },
    successBox: { backgroundColor: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: '7px', padding: '10px 14px', color: '#1b5e20', fontSize: '13px', marginBottom: '14px' },
};

const EMPTY_FORM = { name: '', description: '', image_url: '' };

const AdminServices = () => {
    const { refreshShops, rawShops } = useShop();
    const [activeTab, setActiveTab] = useState('global'); // 'global' or 'shop'
    const [services, setServices] = useState([]);
    const [shopServices, setShopServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchGlobalServices = async () => {
        const { data, error: fetchError } = await supabase
            .from('service_types')
            .select('*')
            .order('name');
        if (!fetchError) setServices(data || []);
    };

    const fetchShopServices = async () => {
        const { data, error: fetchError } = await supabase
            .from('services')
            .select('*, shops(name), service_types(name)')
            .order('created_at', { ascending: false });
        if (!fetchError) setShopServices(data || []);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchGlobalServices(), fetchShopServices()]);
        } catch (err) {
            console.error('Fetch error:', err.message);
            setError('Failed to load services.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openModal = (item = null) => {
        if (item) {
            setEditingId(item.id);
            setForm({
                name: item.name || '',
                description: item.description || '',
                image_url: item.image_url || '',
                price: item.price || 0,
                avg_time: item.avg_time || 10,
                is_active: item.is_active !== undefined ? item.is_active : true,
                shop_id: item.shop_id || '',
                service_type_id: item.service_type_id || ''
            });
        } else {
            setEditingId(null);
            setForm({ 
                ...EMPTY_FORM, 
                price: 0, 
                avg_time: 10, 
                is_active: true, 
                shop_id: rawShops?.[0]?.id || '',
                service_type_id: services?.[0]?.id || ''
            });
        }
        setError('');
        setSuccess('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setError('');
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        const table = activeTab === 'global' ? 'service_types' : 'services';
        
        // Clean form data for Supabase
        const payload = { ...form };
        if (activeTab === 'global') {
            delete payload.shop_id;
            delete payload.service_type_id;
            delete payload.price;
            delete payload.avg_time;
            delete payload.is_active;
        }

        try {
            if (editingId) {
                const { error: updateError } = await supabase
                    .from(table)
                    .update(payload)
                    .eq('id', editingId);
                if (updateError) throw updateError;
                setSuccess(`${activeTab === 'global' ? 'Service Type' : 'Shop Service'} updated!`);
            } else {
                const { error: insertError } = await supabase
                    .from(table)
                    .insert([payload]);
                if (insertError) throw insertError;
                setSuccess(`${activeTab === 'global' ? 'Service Type' : 'Shop Service'} created!`);
            }

            await fetchData();
            if (refreshShops) refreshShops();
            setTimeout(() => {
                setShowModal(false);
                setSuccess('');
            }, 1500);
        } catch (err) {
            console.error('Submit error:', err.message);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, isShopService = false) => {
        const table = isShopService ? 'services' : 'service_types';
        if (!window.confirm(`Are you sure you want to delete this ${isShopService ? 'shop service' : 'global type'}?`)) return;
        
        try {
            const { error: deleteError } = await supabase
                .from(table)
                .delete()
                .eq('id', id);
            if (deleteError) throw deleteError;
            fetchData();
            if (refreshShops) refreshShops();
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        }
    };

    return (
        <div style={S.page}>
            <div style={S.header}>
                <div>
                    <h1 style={S.title}>💇 Services Management</h1>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
                        <button 
                            onClick={() => setActiveTab('global')}
                            style={{ 
                                background: 'none', border: 'none', borderBottom: activeTab === 'global' ? '2px solid #673ab7' : '2px solid transparent',
                                color: activeTab === 'global' ? '#673ab7' : '#666', fontWeight: 600, padding: '8px 4px', cursor: 'pointer'
                            }}
                        >
                            Global Service Types
                        </button>
                        <button 
                            onClick={() => setActiveTab('shop')}
                            style={{ 
                                background: 'none', border: 'none', borderBottom: activeTab === 'shop' ? '2px solid #673ab7' : '2px solid transparent',
                                color: activeTab === 'shop' ? '#673ab7' : '#666', fontWeight: 600, padding: '8px 4px', cursor: 'pointer'
                            }}
                        >
                            Shop Services List
                        </button>
                    </div>
                </div>
                <button style={S.addBtn} onClick={() => openModal()}>
                    + Add {activeTab === 'global' ? 'Type' : 'Service'}
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading...</div>
            ) : (
                <div style={S.grid}>
                    {(activeTab === 'global' ? services : shopServices).map(item => (
                        <motion.div layout key={item.id} style={S.card}>
                            <div style={S.imgContainer}>
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.name} style={S.serviceImg} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', color: '#ccc' }}>
                                        💇
                                    </div>
                                )}
                                {activeTab === 'shop' && item.shops && (
                                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                                        {item.shops.name}
                                    </div>
                                )}
                            </div>
                            <div style={S.cardContent}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                    <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: '#1a1a2e' }}>{item.name}</h3>
                                    {activeTab === 'shop' && (
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#2e7d32' }}>${item.price}</span>
                                    )}
                                </div>
                                
                                <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px', lineHeight: '1.5', minHeight: '3em' }}>
                                    {item.description || 'No description provided.'}
                                </p>

                                {activeTab === 'shop' && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#888', marginBottom: '16px' }}>
                                        <span>⏱️ {item.avg_time} min</span>
                                        <span>{item.is_active ? '🟢 Active' : '🔴 Inactive'}</span>
                                        {item.service_types && <span style={{ color: '#673ab7' }}>🏷️ {item.service_types.name}</span>}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => openModal(item)} style={S.editBtn}>Edit</button>
                                    
                                    {activeTab === 'global' && (
                                        <button 
                                            onClick={() => {
                                                setActiveTab('shop');
                                                setEditingId(null);
                                                setForm({
                                                    ...EMPTY_FORM,
                                                    name: item.name,
                                                    description: item.description,
                                                    image_url: item.image_url,
                                                    service_type_id: item.id,
                                                    price: 0,
                                                    avg_time: 10,
                                                    is_active: true,
                                                    shop_id: rawShops?.[0]?.id || ''
                                                });
                                                setShowModal(true);
                                            }} 
                                            style={{ ...S.editBtn, background: '#673ab7', color: '#fff' }}
                                        >
                                            Assign to Shop
                                        </button>
                                    )}

                                    <button onClick={() => handleDelete(item.id, activeTab === 'shop')} style={S.deleteBtn}>Delete</button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div style={S.overlay} onClick={closeModal}>
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={S.modal} onClick={e => e.stopPropagation()}>
                            <button style={S.closeX} onClick={closeModal}>&times;</button>
                            <h2 style={S.modalTitle}>{editingId ? 'Edit' : 'Add'} {activeTab === 'global' ? 'Service Type' : 'Shop Service'}</h2>

                            {error && <div style={S.errorBox}>{error}</div>}
                            {success && <div style={S.successBox}>{success}</div>}

                            <form onSubmit={handleSubmit}>
                                {activeTab === 'shop' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                        <div>
                                            <label style={S.label}>Assign to Shop</label>
                                            <select 
                                                style={S.input} 
                                                value={form.shop_id} 
                                                onChange={e => setForm({...form, shop_id: e.target.value})}
                                                required
                                            >
                                                <option value="">Select Shop...</option>
                                                {rawShops?.map(shop => (
                                                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={S.label}>Service Category</label>
                                            <select 
                                                style={S.input} 
                                                value={form.service_type_id} 
                                                onChange={e => setForm({...form, service_type_id: e.target.value})}
                                            >
                                                <option value="">None</option>
                                                {services.map(type => (
                                                    <option key={type.id} value={type.id}>{type.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div style={S.formGroup}>
                                    <label style={S.label}>Name</label>
                                    <input style={S.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                                </div>

                                <div style={S.formGroup}>
                                    <label style={S.label}>Image URL</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input style={S.input} value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} />
                                        <div style={{ position: 'relative' }}>
                                            <button type="button" style={{ padding: '10px', background: '#eee', border: 'none', borderRadius: '7px', cursor: 'pointer' }}>📁</button>
                                            <input type="file" accept="image/*" onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;
                                                setSubmitting(true);
                                                try {
                                                    const { data, error: uploadErr } = await supabase.storage.from('images').upload(`services/${Date.now()}-${file.name}`, file);
                                                    if (uploadErr) throw uploadErr;
                                                    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(data.path);
                                                    setForm({ ...form, image_url: publicUrl });
                                                } catch (err) { setError(err.message); } finally { setSubmitting(false); }
                                            }} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                        </div>
                                    </div>
                                </div>

                                {activeTab === 'shop' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                        <div>
                                            <label style={S.label}>Price ($)</label>
                                            <input type="number" style={S.input} value={form.price} onChange={e => setForm({...form, price: parseInt(e.target.value)})} />
                                        </div>
                                        <div>
                                            <label style={S.label}>Time (min)</label>
                                            <input type="number" style={S.input} value={form.avg_time} onChange={e => setForm({...form, avg_time: parseInt(e.target.value)})} />
                                        </div>
                                    </div>
                                )}

                                <div style={S.formGroup}>
                                    <label style={S.label}>Description</label>
                                    <textarea style={S.textarea} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                                </div>

                                <div style={S.btnRow}>
                                    <button type="button" style={S.cancelBtn} onClick={closeModal}>Cancel</button>
                                    <button type="submit" style={S.submitBtn(submitting)} disabled={submitting}>
                                        {submitting ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminServices;

