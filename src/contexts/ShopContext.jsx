import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from './AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { calculateDistance } from '../utils/geoUtils';

// Use the singleton client from lib/supabase to avoid multiple GoTrueClient warnings

const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
    const { user, role, shopId: authShopId } = useAuth();
    const { location, error: geoError, loading: geoLoading, getLocation } = useGeolocation();
    const [shops, setShops] = useState([]);
    const [products, setProducts] = useState([]);
    const [staff, setStaff] = useState([]);
    const [realCategories, setRealCategories] = useState([]);
    const [serviceTypes, setServiceTypes] = useState([]);
    const [queueData, setQueueData] = useState({});
    const [staffCounts, setStaffCounts] = useState({});
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
            // Fetch Shops with Services
            let query = supabase.from('shops').select('*').order('created_at', { ascending: true });
            
            // If not super_admin, only show active shops
            if (role !== 'super_admin') {
                query = query.eq('is_active', true);
            }

            const shopsRes = await query;
            if (shopsRes.error) throw shopsRes.error;
            
            // Fetch All Services to link with shops (avoiding complex joins that cause 500s)
            const { data: allServices, error: servicesErr } = await supabase
                .from('services')
                .select('id, name, image_url, shop_id, price');
            
            const shopsWithServices = (shopsRes.data || []).map(shop => ({
                ...shop,
                services: (allServices || []).filter(s => s.shop_id === shop.id)
            }));

            setShops(shopsWithServices);

            // Fetch Products
            const productsRes = await supabase
                .from('products')
                .select('*, shops(name), category:product_categories(name)')
                .order('created_at', { ascending: false });
            
            if (productsRes.error) throw productsRes.error;
            
            // Flatten category name for convenience
            const flattenedProducts = (productsRes.data || []).map(p => ({
                ...p,
                category_name: p.category?.name || p.category // fallback to old string column if it exists
            }));
            
            setProducts(flattenedProducts);

            // Fetch Product Categories
            const categoriesRes = await supabase.from('product_categories').select('*').order('name');
            if (categoriesRes.error) throw categoriesRes.error;
            setRealCategories(categoriesRes.data || []);

            // Fetch Global Service Types
            const serviceTypesRes = await supabase.from('service_types').select('*').order('name');
            if (!serviceTypesRes.error) {
                setServiceTypes(serviceTypesRes.data || []);
            }

            // Auto-select logic for owner
            if (role === 'shop_owner' && authShopId) {
                setCurrentShopId(authShopId);
            }

            // Fetch Queue Counts
            const { data: queueRes } = await supabase
                .from('tokens')
                .select('shop_id, status')
                .in('status', ['pending', 'called']);
            
            if (queueRes) {
                const counts = queueRes.reduce((acc, token) => {
                    acc[token.shop_id] = (acc[token.shop_id] || 0) + 1;
                    return acc;
                }, {});
                setQueueData(counts);
            }

            // Fetch Staff
            const { data: staffRes } = await supabase
                .from('staff')
                .select('*, shops(name)')
                .eq('is_active', true);
            
            if (staffRes) {
                setStaff(staffRes);
                const counts = staffRes.reduce((acc, s) => {
                    acc[s.shop_id] = (acc[s.shop_id] || 0) + 1;
                    return acc;
                }, {});
                setStaffCounts(counts);
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

    // Enhanced shops with distance calculation
    const enhancedShops = useMemo(() => {
        if (!location) return shops;

        return shops.map(shop => ({
            ...shop,
            distance: calculateDistance(
                location.latitude,
                location.longitude,
                shop.latitude,
                shop.longitude
            )
        }));
    }, [shops, location]);

    // Sorted shops by distance
    const sortedShops = useMemo(() => {
        if (!location) return enhancedShops;

        return [...enhancedShops].sort((a, b) => {
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
        });
    }, [enhancedShops, location]);

    // Derive unique services from all shops for the "Explore" section
    const availableServices = useMemo(() => {
        const servicesMap = new Map();
        
        shops.forEach(shop => {
            const seenInShop = new Set();
            shop.services?.forEach(s => {
                if (s.name) {
                    const normalized = s.name.trim();
                    if (seenInShop.has(normalized)) return;
                    seenInShop.add(normalized);

                    if (!servicesMap.has(normalized)) {
                        servicesMap.set(normalized, { 
                            name: normalized, 
                            count: 1,
                            // Store the first occurrence's image for the icon
                            image_url: s.image_url,
                            price: s.price,
                            id: s.id
                        });
                    } else {
                        const existing = servicesMap.get(normalized);
                        existing.count += 1;
                        // Prefer service with image
                        if (!existing.image_url && s.image_url) {
                            existing.image_url = s.image_url;
                        }
                    }
                }
            });
        });

        return Array.from(servicesMap.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 12);
    }, [shops]);

    const productCategories = useMemo(() => {
        const categories = new Set();
        products.forEach(p => {
            const catVal = p.category_name || (typeof p.category === 'string' ? p.category : p.category?.name);
            if (catVal) {
                categories.add(catVal.trim());
            }
        });
        return Array.from(categories).sort();
    }, [products]);

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
        <ShopContext.Provider value={{ 
            shops: sortedShops, 
            rawShops: shops,
            products, 
            currentShopId, 
            setCurrentShopId, 
            addShop, 
            loading, 
            refreshShops: fetchData,
            userLocation: location,
            getLocation,
            geoLoading,
            geoError,
            availableServices: availableServices,
            serviceTypes,
            queueData,
            staffCounts,
            productCategories: realCategories.length > 0 ? realCategories : productCategories,
            dbCategories: realCategories,
            staff
        }}>
            {children}
        </ShopContext.Provider>
    );
};

export const useShop = () => useContext(ShopContext);
