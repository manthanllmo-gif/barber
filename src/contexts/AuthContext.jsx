import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [shopId, setShopId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // onAuthStateChange fires immediately with INITIAL_SESSION event
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[Auth] event:', event, '| user:', session?.user?.email || 'none');

            const authUser = session?.user;
            if (authUser) {
                // FAST PATH: Use metadata first to unblock UI
                const metaRole = authUser.user_metadata?.role;
                const metaShopId = authUser.user_metadata?.shopId || authUser.user_metadata?.shop_id;

                setUser(authUser);

                if (metaRole) {
                    console.log('[Auth] Using metadata: role=', metaRole);
                    setRole(metaRole);
                    setShopId(metaShopId);
                    setLoading(false);

                    // SYNC PATH: Update from DB in background without blocking
                    loadUserDetails(authUser, false);
                } else {
                    // SLOW PATH: Wait for DB if no metadata (blocks UI)
                    await loadUserDetails(authUser, true);
                }
            } else {
                setUser(null);
                setRole(null);
                setShopId(null);
                setLoading(false);
            }
        });

        return () => {
            if (authListener?.subscription) {
                authListener.subscription.unsubscribe();
            }
        };
    }, []);

    const loadUserDetails = async (authUser, blockUI = true) => {
        if (blockUI) setLoading(true);

        try {
            console.log('[Auth] Fetching from DB for id:', authUser.id);

            const { data: userDetails, error } = await supabase
                .from('users')
                .select('role, shop_id')
                .eq('id', authUser.id)
                .maybeSingle();

            if (error) {
                console.error('[Auth] DB Sync failed:', error.message);
                if (blockUI) {
                    setRole('error');
                    setLoading(false);
                }
            } else if (!userDetails) {
                // No DB row yet (e.g. new customer) — use auth metadata as fallback
                const metaRole = authUser.user_metadata?.role || 'customer';
                console.log('[Auth] No DB row found, using metadata role:', metaRole);
                setRole(metaRole);
                setShopId(null);
                setLoading(false);
            } else {
                console.log('[Auth] DB Sync success: role=', userDetails.role);
                setRole(userDetails.role);
                setShopId(userDetails.shop_id);
                setLoading(false);

                // SELF-HEALING: If metadata is missing or outdated, update it for the next session
                if (userDetails.role !== authUser.user_metadata?.role ||
                    userDetails.shop_id !== (authUser.user_metadata?.shopId || authUser.user_metadata?.shop_id)) {
                    console.log('[Auth] Self-healing metadata...');
                    supabase.auth.updateUser({
                        data: {
                            role: userDetails.role,
                            shopId: userDetails.shop_id
                        }
                    });
                }
            }
        } catch (err) {
            console.error('[Auth] loadUserDetails unexpected error:', err.message);
            if (blockUI) {
                setRole('error');
                setLoading(false);
            }
        }
    };

    const login = async (identifier, password) => {
        console.log('[Auth] Attempting login for:', identifier);
        
        let email = identifier;
        if (!identifier.includes('@')) {
            email = `${identifier}@customer.app`;
        }

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (!error) return data;
            
            // If failed and it was the master admin number, try specific domains
            if (!identifier.includes('@')) {
                const staffDomains = ['@admin.com', '@shopowner.app'];
                for (const domain of staffDomains) {
                    console.log('[Auth] Trying domain fallback:', domain);
                    const { data: staffData, error: staffErr } = await supabase.auth.signInWithPassword({ 
                        email: `${identifier}${domain}`, 
                        password 
                    });
                    if (!staffErr) return staffData;
                }
            }

            if (error) throw error;
        } catch (err) {
            console.error('[Auth] Login error:', err.message);
            throw err;
        }
    };

    const signup = async (phone, password, name) => {
        const email = `${phone}@customer.app`;
        
        // 1. Auth Signup
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    phone,
                    role: 'customer'
                }
            }
        });

        if (authError) throw authError;

        // 2. Add to users table (only columns that exist: id, role)
        // name & phone are stored in auth metadata above
        if (authData.user) {
            const { error: dbError } = await supabase
                .from('users')
                .insert([{ id: authData.user.id, role: 'customer' }]);
            if (dbError) console.error('Error creating user profile:', dbError.message);
        }

        return authData;
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{ user, role, shopId, loading, login, signup, logout }}>
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#fafafa' }}>
                    <div style={{ textAlign: 'center', color: '#495057' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⏳</div>
                        <p style={{ fontSize: '1rem' }}>Loading...</p>
                    </div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};

