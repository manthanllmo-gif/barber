import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { fetchAllStaff, deleteStaff, toggleStaffVisibility } from '../../lib/api';
import { uploadImage } from '../../lib/upload';

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
    table: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
    th: { textAlign: 'left', padding: '10px 12px', backgroundColor: '#f4f4f8', fontSize: '11px', fontWeight: 700, color: '#000000', borderBottom: '1px solid #eee', textTransform: 'uppercase', letterSpacing: '.4px' },
    td: { padding: '10px 12px', fontSize: '13px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle', color: '#000000' },
    avatar: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' },
    badge: (status) => ({
        padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
        backgroundColor: status ? '#e8f5e9' : '#fce4ec',
        color: status ? '#2e7d32' : '#c62828',
    }),
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
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 },
    modal: { position: 'relative', backgroundColor: '#fff', borderRadius: '14px', padding: '32px', width: '90%', maxWidth: '500px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' },
    closeX: {
        position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'none', fontSize: '22px', cursor: 'pointer', color: '#000000', opacity: 0.5,
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s', padding: '5px'
    },
    modalTitle: { margin: '0 0 22px 0', fontSize: '20px', fontWeight: 700, color: '#1a1a2e' },
    formGroup: { marginBottom: '16px' },
    label: { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: 600, color: '#000000' },
    input: { width: '100%', padding: '10px 12px', borderRadius: '7px', border: '1px solid #999', fontSize: '14px', boxSizing: 'border-box', outline: 'none', color: '#000000' },
    select: { width: '100%', padding: '10px 12px', borderRadius: '7px', border: '1px solid #999', fontSize: '14px', boxSizing: 'border-box', outline: 'none', color: '#000000', backgroundColor: '#fff' },
    btnRow: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '22px' },
    cancelBtn: { padding: '10px 22px', background: 'transparent', border: '1px solid #000000', color: '#000000', borderRadius: '7px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 },
    submitBtn: (loading) => ({
        padding: '10px 22px', backgroundColor: loading ? '#9e9e9e' : '#673ab7',
        color: '#fff', border: 'none', borderRadius: '7px', cursor: loading ? 'not-allowed' : 'pointer',
        fontWeight: 600, fontSize: '14px', minWidth: '120px',
    }),
    errorBox: { backgroundColor: '#fdecea', border: '1px solid #f5c6cb', borderRadius: '7px', padding: '10px 14px', color: '#b71c1c', fontSize: '13px', marginBottom: '14px' },
    successBox: { backgroundColor: '#e8f5e9', border: '1px solid #c8e6c9', borderRadius: '7px', padding: '10px 14px', color: '#1b5e20', fontSize: '13px', marginBottom: '14px' },
};

const EMPTY_FORM = {
    shop_id: '',
    name: '',
    role: '',
    rating: 5.0,
    experience_years: 0,
    skills: '',
    past_saloons: '',
    certificates: '',
    certificate_urls: [],
    gallery_urls: [],
    image_url: ''
};

const AdminStaff = () => {
    const [staff, setStaff] = useState([]);
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const staffData = await fetchAllStaff();
            setStaff(staffData);

            const { data: shopsData } = await supabase.from('shops').select('id, name').order('name');
            if (shopsData) setShops(shopsData);
        } catch (err) {
            console.error("Failed to load staff data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImage(true);
        setError('');
        try {
            const url = await uploadImage(file, 'images', 'staff');
            setForm(prev => ({ ...prev, image_url: url }));
            setSuccess('Image uploaded successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleMultiImageUpload = async (e, field) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploadingImage(true);
        setError('');
        try {
            const uploadedUrls = [];
            for (const file of files) {
                const url = await uploadImage(file, 'images', `staff_${field}`);
                uploadedUrls.push(url);
            }
            setForm(prev => ({ 
                ...prev, 
                [field]: [...(prev[field] || []), ...uploadedUrls] 
            }));
            setSuccess('Images added successfully!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploadingImage(false);
            e.target.value = null;
        }
    };

    const removeMultiImage = (field, indexToRemove) => {
        setForm(prev => ({
            ...prev,
            [field]: prev[field].filter((_, idx) => idx !== indexToRemove)
        }));
    };

    const openModal = () => {
        setEditingStaff(null);
        setForm({ ...EMPTY_FORM, shop_id: shops.length > 0 ? shops[0].id : '' });
        setError('');
        setSuccess('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingStaff(null);
        setError('');
        setSuccess('');
    };

    const openEditModal = (member) => {
        setEditingStaff(member);
        setForm({
            shop_id: member.shop_id,
            name: member.name || '',
            role: member.role || '',
            rating: member.rating || 5.0,
            experience_years: member.experience_years || 0,
            skills: Array.isArray(member.skills) ? member.skills.join(', ') : '',
            past_saloons: Array.isArray(member.past_saloons) ? member.past_saloons.join(', ') : '',
            certificates: Array.isArray(member.certificates) ? member.certificates.join(', ') : '',
            certificate_urls: member.certificate_urls || [],
            gallery_urls: member.gallery_urls || [],
            image_url: member.image_url || ''
        });
        setError('');
        setSuccess('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            const payload = {
                shop_id: form.shop_id,
                name: form.name.trim(),
                role: form.role.trim(),
                rating: parseFloat(form.rating) || 5.0,
                experience_years: parseInt(form.experience_years) || 0,
                skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
                past_saloons: form.past_saloons ? form.past_saloons.split(',').map(s => s.trim()).filter(Boolean) : [],
                certificates: form.certificates ? form.certificates.split(',').map(s => s.trim()).filter(Boolean) : [],
                certificate_urls: form.certificate_urls || [],
                gallery_urls: form.gallery_urls || [],
                image_url: form.image_url.trim() || null
            };

            if (editingStaff) {
                const { error: err } = await supabase.from('staff').update(payload).eq('id', editingStaff.id);
                if (err) throw err;
                setSuccess('Staff updated successfully!');
            } else {
                const { error: err } = await supabase.from('staff').insert([payload]);
                if (err) throw err;
                setSuccess('Staff created successfully!');
            }

            await loadData();
            setTimeout(() => { setShowModal(false); setSuccess(''); }, 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this staff member?')) return;
        try {
            await deleteStaff(id);
            await loadData();
        } catch (err) {
            alert('Failed to delete staff: ' + err.message);
        }
    };

    const handleToggle = async (id, currentStatus) => {
        try {
            await toggleStaffVisibility(id, currentStatus);
            await loadData();
        } catch (err) {
            alert('Failed to toggle visibility: ' + err.message);
        }
    };

    return (
        <div style={S.page}>
            <div style={S.header}>
                <h1 style={S.title}>💈 Staff Management</h1>
                <button style={S.addBtn} onClick={openModal}>+ Add Barber</button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading staff...</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={S.table}>
                        <thead>
                            <tr>
                                <th style={S.th}>Barber</th>
                                <th style={S.th}>Shop</th>
                                <th style={S.th}>Role / Rating</th>
                                <th style={S.th}>Status</th>
                                <th style={S.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staff.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>No staff found.</td></tr>
                            ) : (
                                staff.map(s => (
                                    <tr key={s.id}>
                                        <td style={S.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {s.image_url ? (
                                                    <img src={s.image_url} alt={s.name} style={S.avatar} />
                                                ) : (
                                                    <div style={{ ...S.avatar, backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                                        🧑
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={{ fontWeight: 600, color: '#1a1a2e' }}>{s.name}</div>
                                                    <div style={{ fontSize: '11px', color: '#666' }}>{s.experience_years} years exp.</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={S.td}>{s.shops?.name || 'Unknown Shop'}</td>
                                        <td style={S.td}>
                                            <div>{s.role}</div>
                                            <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 'bold' }}>⭐ {s.rating}</div>
                                        </td>
                                        <td style={S.td}>
                                            <span style={S.badge(s.is_active)}>{s.is_active ? 'Active' : 'Hidden'}</span>
                                        </td>
                                        <td style={S.td}>
                                            <button style={S.editBtn} onClick={() => openEditModal(s)}>Edit</button>
                                            <button style={S.hideBtn(s.is_active)} onClick={() => handleToggle(s.id, s.is_active)}>
                                                {s.is_active ? 'Hide' : 'Show'}
                                            </button>
                                            <button style={S.deleteBtn} onClick={() => handleDelete(s.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div style={S.overlay} onClick={closeModal}>
                    <div style={S.modal} onClick={e => e.stopPropagation()}>
                        <button style={S.closeX} onClick={closeModal}>&times;</button>
                        <h2 style={S.modalTitle}>{editingStaff ? 'Edit Barber' : 'Add New Barber'}</h2>

                        {error && <div style={S.errorBox}>{error}</div>}
                        {success && <div style={S.successBox}>{success}</div>}

                        <form onSubmit={handleSubmit}>
                            <div style={S.formGroup}>
                                <label style={S.label}>Assigned Shop</label>
                                <select style={S.select} value={form.shop_id} onChange={handleChange('shop_id')} required>
                                    <option value="" disabled>Select a shop...</option>
                                    {shops.map(shop => (
                                        <option key={shop.id} value={shop.id}>{shop.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={S.label}>Name</label>
                                    <input style={S.input} value={form.name} onChange={handleChange('name')} required placeholder="John Doe" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={S.label}>Role</label>
                                    <input style={S.input} value={form.role} onChange={handleChange('role')} required placeholder="Master Barber" />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={S.label}>Rating (0.0 - 5.0)</label>
                                    <input style={S.input} type="number" step="0.1" min="0" max="5" value={form.rating} onChange={handleChange('rating')} required />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={S.label}>Experience (Years)</label>
                                    <input style={S.input} type="number" value={form.experience_years} onChange={handleChange('experience_years')} required />
                                </div>
                            </div>

                            <div style={S.formGroup}>
                                <label style={S.label}>Skills (Comma separated)</label>
                                <input style={S.input} value={form.skills} onChange={handleChange('skills')} placeholder="Fade, Scissor Cut, Beard Trim" />
                            </div>

                            <div style={S.formGroup}>
                                <label style={S.label}>Certificates (Comma separated)</label>
                                <input style={S.input} value={form.certificates} onChange={handleChange('certificates')} placeholder="Master Barber 2023, Color Specialist" />
                            </div>
                            
                            <div style={S.formGroup}>
                                <label style={S.label}>Certificate Photos</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input type="file" multiple accept="image/*" onChange={(e) => handleMultiImageUpload(e, 'certificate_urls')} style={{ fontSize: '13px' }} disabled={uploadingImage} />
                                    {uploadingImage && <span style={{ fontSize: '12px', color: '#666' }}>Uploading...</span>}
                                </div>
                                {form.certificate_urls && form.certificate_urls.length > 0 && (
                                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        {form.certificate_urls.map((url, idx) => (
                                            <div key={idx} style={{ position: 'relative' }}>
                                                <img src={url} alt={`Cert ${idx}`} style={{ height: '60px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                                <button type="button" onClick={() => removeMultiImage('certificate_urls', idx)} style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={S.formGroup}>
                                <label style={S.label}>Past Saloons (Comma separated)</label>
                                <input style={S.input} value={form.past_saloons} onChange={handleChange('past_saloons')} placeholder="The Vintage Barbershop, Elite Cutz" />
                            </div>

                            <div style={S.formGroup}>
                                <label style={S.label}>Styling Portfolio (Gallery Photos)</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input type="file" multiple accept="image/*" onChange={(e) => handleMultiImageUpload(e, 'gallery_urls')} style={{ fontSize: '13px' }} disabled={uploadingImage} />
                                    {uploadingImage && <span style={{ fontSize: '12px', color: '#666' }}>Uploading...</span>}
                                </div>
                                {form.gallery_urls && form.gallery_urls.length > 0 && (
                                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        {form.gallery_urls.map((url, idx) => (
                                            <div key={idx} style={{ position: 'relative' }}>
                                                <img src={url} alt={`Gallery ${idx}`} style={{ height: '60px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                                <button type="button" onClick={() => removeMultiImage('gallery_urls', idx)} style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={S.formGroup}>
                                <label style={S.label}>Profile Image</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ fontSize: '13px' }} disabled={uploadingImage} />
                                    {uploadingImage && <span style={{ fontSize: '12px', color: '#666' }}>Uploading...</span>}
                                </div>
                                {form.image_url && (
                                    <div style={{ marginTop: '10px' }}>
                                        <img src={form.image_url} alt="Preview" style={{ height: '60px', borderRadius: '8px', border: '1px solid #ddd' }} />
                                    </div>
                                )}
                            </div>

                            <div style={S.btnRow}>
                                <button type="button" style={S.cancelBtn} onClick={closeModal}>Cancel</button>
                                <button type="submit" style={S.submitBtn(submitting || uploadingImage)} disabled={submitting || uploadingImage}>
                                    {submitting ? 'Saving...' : 'Save Barber'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStaff;
