import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [shopId, setShopId] = useState(null);
    const [loading, setLoading] = useState(true);
    const isSyncingRef = useRef(false);

    useEffect(() => {
        // onAuthStateChange fires immediately with INITIAL_SESSION event
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[Auth] event:', event, '| user:', session?.user?.email || 'none');

            const authUser = session?.user;
            
            if (!authUser) {
                // Clear state if no user
                setUser(null);
                setRole(null);
                setShopId(null);
                setLoading(false);
                return;
            }

            // Check if we already have this user to prevent redundant re-renders
            // This is key to stopping the "auto refresh" on tab focus
            const isSameUser = user?.id === authUser.id;
            
            // FAST PATH: Use metadata first
            const metaRole = authUser.user_metadata?.role;
            const metaShopId = authUser.user_metadata?.shopId || authUser.user_metadata?.shop_id;

            // Only update if something actually changed
            if (!isSameUser || role !== metaRole) {
                setUser(authUser);
                if (metaRole) {
                    setRole(metaRole);
                    setShopId(metaShopId);
                    setLoading(false);
                    // Background sync
                    loadUserDetails(authUser, false);
                } else {
                    // No metadata, must wait for DB
                    await loadUserDetails(authUser, true);
                }
            } else {
                // Same user/role, just do a silent background sync if not already syncing
                loadUserDetails(authUser, false);
            }
        });

        return () => {
            if (authListener?.subscription) {
                authListener.subscription.unsubscribe();
            }
        };
    }, [user, role]); // Add dependencies to properly check against current state

    const loadUserDetails = async (authUser, blockUI = true) => {
        if (!authUser || isSyncingRef.current) return;
        
        isSyncingRef.current = true;
        // Only block UI if we don't have a role yet or if explicitly requested
        const shouldBlock = blockUI && !role;
        if (shouldBlock) setLoading(true);

        try {
            console.log('[Auth] Syncing from DB for id:', authUser.id);

            const { data: userDetails, error } = await supabase
                .from('users')
                .select('role, shop_id, name, phone')
                .eq('id', authUser.id)
                .maybeSingle();

            if (error) {
                console.error('[Auth] DB Sync failed:', error.message);
                if (shouldBlock) setRole('error');
            } else if (userDetails) {
                // Only update if DB values differ from current state to minimize re-renders
                if (userDetails.role !== role) setRole(userDetails.role);
                if (userDetails.shop_id !== shopId) setShopId(userDetails.shop_id);
            } else {
                // Fallback to customer if no DB record yet
                const fallbackRole = authUser.user_metadata?.role || 'customer';
                if (fallbackRole !== role) setRole(fallbackRole);
            }
        } catch (err) {
            console.error('[Auth] loadUserDetails unexpected error:', err.message);
            if (shouldBlock) setRole('error');
        } finally {
            isSyncingRef.current = false;
            setLoading(false);
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
                .insert([{ 
                    id: authData.user.id, 
                    role: 'customer',
                    name: name,
                    phone: phone
                }]);
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
            {loading && !role ? (
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

