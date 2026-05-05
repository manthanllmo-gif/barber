import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: '', description: '', image_url: '' });
    const [editingId, setEditingId] = useState(null);

    const fetchCategories = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('product_categories').select('*').order('name');
        if (data) setCategories(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingId) {
            const { error } = await supabase.from('product_categories').update(form).eq('id', editingId);
            if (!error) {
                setEditingId(null);
                setForm({ name: '', description: '', image_url: '' });
                fetchCategories();
            }
        } else {
            const { error } = await supabase.from('product_categories').insert([form]);
            if (!error) {
                setForm({ name: '', description: '', image_url: '' });
                fetchCategories();
            }
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return;
        const { error } = await supabase.from('product_categories').delete().eq('id', id);
        if (!error) fetchCategories();
    };

    return (
        <div style={{ padding: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>Product Categories</h1>

            <form onSubmit={handleSubmit} style={{ background: '#fff', padding: '24px', borderRadius: '12px', marginBottom: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>{editingId ? 'Edit' : 'Add New'} Category</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div>
                        <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Category Name</label>
                        <input 
                            type="text" placeholder="e.g. Hair Care" required 
                            value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Category Image</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                                type="text" placeholder="Image URL" 
                                value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})}
                                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                            <div style={{ position: 'relative' }}>
                                <button type="button" style={{ padding: '12px', background: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>📁</button>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        const fileExt = file.name.split('.').pop();
                                        const fileName = `${Math.random()}.${fileExt}`;
                                        const filePath = `categories/${fileName}`;
                                        const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
                                        if (uploadError) {
                                            alert('Upload failed');
                                            return;
                                        }
                                        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
                                        setForm({ ...form, image_url: publicUrl });
                                    }}
                                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <textarea 
                    placeholder="Description" 
                    value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '16px', minHeight: '80px' }}
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="submit" style={{ padding: '10px 24px', background: '#673ab7', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                        {editingId ? 'Update' : 'Create'} Category
                    </button>
                    {editingId && (
                        <button type="button" onClick={() => { setEditingId(null); setForm({name: '', description: '', image_url: ''}); }} style={{ padding: '10px 24px', background: '#eee', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                {categories.map(cat => (
                    <div key={cat.id} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ height: '120px', background: '#eee' }}>
                            {cat.image_url && <img src={cat.image_url} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <div style={{ padding: '16px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{cat.name}</h3>
                            <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px', minHeight: '36px' }}>{cat.description || 'No description'}</p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => { setEditingId(cat.id); setForm({name: cat.name, description: cat.description || '', image_url: cat.image_url || ''}); }} style={{ flex: 1, padding: '8px', background: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Edit</button>
                                <button onClick={() => handleDelete(cat.id)} style={{ flex: 1, padding: '8px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminCategories;
