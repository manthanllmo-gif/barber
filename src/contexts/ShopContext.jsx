import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from './AuthContext';

const publicClient = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
    const { user, role, shopId: authShopId } = useAuth();
    const [shops, setShops] = useState([]);
    const [products, setProducts] = useState([]);
    const [currentShopId, setCurrentShopId] = useState(() => localStorage.getItem('selectedShopId'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentShopId) {
            localStorage.setItem('selectedShopId', currentShopId);
        }
    }, [currentShopId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Shops
            let query = publicClient.from('shops').select('*').order('created_at', { ascending: true });
            
            // If not super_admin, only show active shops
            if (role !== 'super_admin') {
                query = query.eq('is_active', true);
            }

            const shopsRes = await query;
            if (shopsRes.error) throw shopsRes.error;
            setShops(shopsRes.data || []);

            // Fetch Products
            const productsRes = await publicClient.from('products').select('*, shops(name)').order('created_at', { ascending: false });
            if (productsRes.error) throw productsRes.error;
            setProducts(productsRes.data || []);

            // Auto-select logic for owner
            if (role === 'shop_owner' && authShopId) {
                setCurrentShopId(authShopId);
            }
        } catch (err) {
            console.error('Error fetching data:', err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (role !== 'error') {
            fetchData();
        }
    }, [user, role, authShopId]);

    const addShop = async (shopData) => {
        try {
            const { data, error } = await supabase.from('shops').insert([shopData]).select().single();
            if (error) throw error;
            setShops([...shops, data]);
            setCurrentShopId(data.id);
            return data;
        } catch (err) {
            console.error('Error adding shop:', err.message);
            throw err;
        }
    };

    return (
        <ShopContext.Provider value={{ shops, products, currentShopId, setCurrentShopId, addShop, loading, refreshShops: fetchData }}>
            {children}
        </ShopContext.Provider>
    );
};

export const useShop = () => useContext(ShopContext);
