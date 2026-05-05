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
