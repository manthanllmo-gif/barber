import { supabase } from './supabase';

export const fetchStaff = async (shopId, onlyActive = true) => {
    if (!shopId) return [];
    try {
        let query = supabase
            .from('staff')
            .select('*')
            .eq('shop_id', shopId);
        
        if (onlyActive) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error("Error fetching staff:", err.message);
        throw err;
    }
};

export const fetchCompletedTokenCount = async (shopId) => {
    if (!shopId) return 0;
    try {
        const { count, error } = await supabase
            .from('tokens')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shopId)
            .eq('status', 'completed');

        if (error) throw error;
        return count || 0;
    } catch (err) {
        console.error("Error fetching completed tokens:", err.message);
        return 0;
    }
};

export const fetchAllProducts = async () => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*, shops(name)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error("Error fetching all products:", err.message);
        return [];
    }
};

export const deleteProduct = async (id) => {
    if (!id) return false;
    try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (err) {
        console.error("Error deleting product:", err.message);
        throw err;
    }
};

// Staff Management
export const fetchAllStaff = async () => {
    try {
        const { data, error } = await supabase
            .from('staff')
            .select('*, shops(name)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error("Error fetching all staff:", err.message);
        return [];
    }
};

export const deleteStaff = async (id) => {
    try {
        const { error } = await supabase.from('staff').delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (err) {
        console.error("Error deleting staff:", err.message);
        throw err;
    }
};

export const toggleStaffVisibility = async (id, currentStatus) => {
    try {
        const { error } = await supabase.from('staff').update({ is_active: !currentStatus }).eq('id', id);
        if (error) throw error;
        return true;
    } catch (err) {
        console.error("Error toggling staff visibility:", err.message);
        throw err;
    }
};

// Services Management
export const deleteService = async (id) => {
    try {
        const { error } = await supabase.from('services').delete().eq('id', id);
        if (error) throw error;
        return true;
    } catch (err) {
        console.error("Error deleting service:", err.message);
        throw err;
    }
};

export const toggleServiceVisibility = async (id, currentStatus) => {
    try {
        const { error } = await supabase.from('services').update({ is_active: !currentStatus }).eq('id', id);
        if (error) throw error;
        return true;
    } catch (err) {
        console.error("Error toggling service visibility:", err.message);
        throw err;
    }
};

// Products Management
export const toggleProductVisibility = async (id, currentStatus) => {
    try {
        const { error } = await supabase.from('products').update({ is_active: !currentStatus }).eq('id', id);
        if (error) throw error;
        return true;
    } catch (err) {
        console.error("Error toggling product visibility:", err.message);
        throw err;
    }
};

// Shops Management
export const fetchShops = async () => {
    try {
        const { data, error } = await supabase
            .from('shops')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error("Error fetching shops:", err.message);
        return [];
    }
};

export const createShopAndOwner = async (form) => {
    const { shopName, shopAddress, shopPhone, ownerPhone, password, image_url, latitude, longitude } = form;
    
    try {
        // 1. Create Auth User
        const email = `${ownerPhone}@shopowner.app`;
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: shopName,
                    phone: ownerPhone,
                    role: 'shop_owner'
                }
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Failed to create auth user");

        // 2. Create Shop
        const { data: shopData, error: shopError } = await supabase
            .from('shops')
            .insert([{
                name: shopName,
                address: shopAddress,
                phone: shopPhone,
                image_url,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null
            }])
            .select()
            .single();

        if (shopError) throw shopError;

        // 3. Update User Profile in users table
        const { error: userError } = await supabase
            .from('users')
            .insert([{
                id: authData.user.id,
                name: shopName,
                phone: ownerPhone,
                role: 'shop_owner',
                shop_id: shopData.id
            }]);

        if (userError) throw userError;

        return { shop: shopData, user: authData.user };
    } catch (err) {
        console.error("Error creating shop and owner:", err.message);
        throw err;
    }
};

export const updateShopAndOwner = async (shopId, form) => {
    const { shopName, shopAddress, shopPhone, image_url, latitude, longitude } = form;
    
    try {
        const { data, error } = await supabase
            .from('shops')
            .update({
                name: shopName,
                address: shopAddress,
                phone: shopPhone,
                image_url,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                updated_at: new Date().toISOString()
            })
            .eq('id', shopId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.error("Error updating shop:", err.message);
        throw err;
    }
};
