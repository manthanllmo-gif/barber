import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
    fetchStaff, 
    fetchCompletedTokenCount, 
    deleteStaff, 
    toggleStaffVisibility,
    deleteService,
    toggleServiceVisibility,
    deleteProduct,
    toggleProductVisibility
} from '../lib/api';
import { uploadImage } from '../lib/upload';
import { useShop } from '../contexts/ShopContext';
import { useAuth } from '../contexts/AuthContext';
import CountdownTimer from '../components/common/CountdownTimer';

const Dashboard = () => {
    const { user, role, logout } = useAuth();
    const { shops, currentShopId, dbCategories = [], serviceTypes = [] } = useShop();
    const shopData = shops.find(s => s.id === currentShopId);
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'queue';
    
    const setActiveTab = (tab) => {
        setSearchParams({ tab });
    };
    const [analyticsData, setAnalyticsData] = useState({
        staffMetrics: [],
        serviceMetrics: [],
        overall: { avgServiceTime: 0, totalRevenue: 0, totalTokens: 0 }
    });
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    const [tokens, setTokens] = useState([]);
    const [orders, setOrders] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [servicesList, setServicesList] = useState([]);
    const [productsList, setProductsList] = useState([]);

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [updatingOrder, setUpdatingOrder] = useState(null);


    const [todayRevenue, setTodayRevenue] = useState(0);
    const [monthlyRevenue, setMonthlyRevenue] = useState(0);
    const [tokensServedTotal, setTokensServedTotal] = useState(0);

    // Queue feature states
    const [isWalkinModalOpen, setIsWalkinModalOpen] = useState(false);
    const [walkinName, setWalkinName] = useState('');
    const [walkinPhone, setWalkinPhone] = useState('');
    const [walkinStaffId, setWalkinStaffId] = useState(null);
    const [addingWalkin, setAddingWalkin] = useState(false);

    // Billing / Completion States
    const [completingToken, setCompletingToken] = useState(null);
    const [selectedProductsForBilling, setSelectedProductsForBilling] = useState([]);
    const [selectedAdditionalServicesForBilling, setSelectedAdditionalServicesForBilling] = useState([]);
    const [manualAmount, setManualAmount] = useState(0);
    const [paymentMode, setPaymentMode] = useState('cash'); // 'cash' or 'online'

    // Add Form states
    const [serviceForm, setServiceForm] = useState({ name: '', price: '', avg_time: 15, service_type_id: '', image_url: '' });
    const [productForm, setProductForm] = useState({ name: '', price: '', stock: '', category_id: '' });
    const EMPTY_STAFF_FORM = useMemo(() => ({
        name: '', 
        role: '',
        rating: 5.0,
        experience_years: 0,
        skills: '',
        certificates: '',
        certificate_urls: [],
        past_saloons: '',
        trainings: '',
        features: '',
        gallery_urls: [],
        image_url: ''
    }), []);

    const [staffForm, setStaffForm] = useState(EMPTY_STAFF_FORM);
    const [shopProfileForm, setShopProfileForm] = useState({
        about_text: '',
        amenities: '',
        gallery_urls: []
    });
    const [uploadingImage, setUploadingImage] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [editingService, setEditingService] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);

    const fetchAnalytics = async () => {
        if (!currentShopId) return;
        try {
            setLoadingAnalytics(true);
            // 1. Fetch all completed tokens and their transactions
            const { data: completedTokens, error: tokensError } = await supabase
                .from('tokens')
                .select('*, transactions(amount)')
                .eq('shop_id', currentShopId)
                .eq('status', 'completed');
            
            if (tokensError) throw tokensError;

            // 2. Group by staff
            const staffMap = {};
            const serviceMap = {};
            let totalDuration = 0;
            let durationCount = 0;

            completedTokens.forEach(token => {
                // Staff Metrics
                if (token.staff_id) {
                    if (!staffMap[token.staff_id]) {
                        const staffMember = staffList.find(s => s.id === token.staff_id);
                        staffMap[token.staff_id] = {
                            name: staffMember ? staffMember.name : 'Unknown',
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
                        if (duration > 0 && duration < 300) { // Filter out anomalies
                            staffMap[token.staff_id].totalDuration += duration;
                            staffMap[token.staff_id].durationCount += 1;
                            totalDuration += duration;
                            durationCount += 1;
                        }
                    }
                }

                // Service Metrics
                if (token.services_selected && Array.isArray(token.services_selected)) {
                    token.services_selected.forEach(sId => {
                        const service = servicesList.find(s => s.id === sId || s.name === sId);
                        let sName = service ? service.name : sId;
                        
                        // If the name looks like a UUID/GUID, it means the service was likely deleted
                        const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sName);
                        if (isGuid) {
                            sName = "Other / Deleted Service";
                        }
                        
                        serviceMap[sName] = (serviceMap[sName] || 0) + 1;
                    });
                }
            });

            const staffMetrics = Object.values(staffMap).map(s => ({
                ...s,
                avgTime: s.durationCount > 0 ? Math.round(s.totalDuration / s.durationCount) : 0
            }));

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
            console.error("Analytics error:", err);
        } finally {
            setLoadingAnalytics(false);
        }
    };

    const fetchRevenue = async () => {
        try {
            const { data, error } = await supabase.from('transactions').select('*').eq('shop_id', currentShopId);
            if (error) throw error;
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            let today = 0, month = 0;
            if (data) {
                data.forEach(t => {
                    const tDate = new Date(t.created_at);
                    if (tDate >= startOfDay) today += t.amount;
                    if (tDate >= startOfMonth) month += t.amount;
                });
            }
            setTodayRevenue(today);
            setMonthlyRevenue(month);
        } catch (err) {
            console.error("Error fetching revenue:", err.message);
        }
    };

    const fetchOrders = async () => {
        if (!currentShopId) return;
        try {
            const { data, error } = await supabase
                .from('orders')
                .select(`
                    id, user_id, customer_name, customer_phone, delivery_address, total_amount, status, created_at, shop_id,
                    order_items (
                        *,
                        products (*)
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Filter orders that have items from this shop
            const shopOrders = (data || []).filter(order => 
                order.order_items?.some(item => item.products?.shop_id === currentShopId)
            );

            setOrders(shopOrders);
        } catch (err) {
            console.error('Error fetching orders:', err.message);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            setUpdatingOrder(orderId);
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;
            fetchOrders();
        } catch (err) {
            console.error('Error updating order status:', err.message);
            alert('Failed to update order status');
        } finally {
            setUpdatingOrder(null);
        }
    };

    const fetchTokensServedTotal = async () => {
        try {
            const count = await fetchCompletedTokenCount(currentShopId);
            setTokensServedTotal(count);
        } catch (err) {
            console.error("Error fetching tokens served:", err.message);
        }
    };

    const loadStaff = async () => {
        try {
            const staff = await fetchStaff(currentShopId, false); // Fetch all staff
            setStaffList(staff);
        } catch (err) { console.error(err); }
    };

    const loadShopProfile = async () => {
        if (!currentShopId) return;
        try {
            const { data, error } = await supabase.from('shops').select('*').eq('id', currentShopId).single();
            if (error) throw error;
            if (data) {
                setShopProfileForm({
                    about_text: data.about_text || '',
                    amenities: Array.isArray(data.amenities) ? data.amenities.join(', ') : '',
                    gallery_urls: data.gallery_urls || []
                });
            }
        } catch (err) {
            console.error("Error loading shop profile:", err);
        }
    };

    const fetchActiveQueue = async () => {
        try {
            const { data, error } = await supabase
                .from('tokens')
                .select('*')
                .eq('shop_id', currentShopId)
                .in('status', ['pending', 'called', 'skipped'])
                .order('token_number', { ascending: true });
            if (error) throw error;
            setTokens(data || []);
        } catch (err) { console.error(err); }
    };

    const loadServices = async () => {
        try {
            const { data, error } = await supabase.from('services').select('*').eq('shop_id', currentShopId).order('name', { ascending: true });
            if (error) throw error;
            setServicesList(data || []);
        } catch (err) { console.error(err); }
    };

    const loadProducts = async () => {
        if (!currentShopId) {
            // For superadmin or if shop not yet selected, only fetch system products
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .is('shop_id', null)
                    .order('name', { ascending: true });
                if (error) throw error;
                setProductsList(data || []);
            } catch (err) { console.error('[Dashboard] loadProducts error:', err); }
            return;
        }

        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .or(`shop_id.eq.${currentShopId},shop_id.is.null`)
                .order('name', { ascending: true });
            if (error) throw error;
            setProductsList(data || []);
        } catch (err) { console.error('[Dashboard] loadProducts error:', err); }
    };

    useEffect(() => {
        if (!currentShopId) return;

        const fetchInitialData = async () => {
            setFetching(true);
            await Promise.all([
                fetchRevenue(),
                loadStaff(),
                fetchActiveQueue(),
                loadServices(),
                loadProducts(),
                fetchOrders(),
                fetchTokensServedTotal(),
                loadShopProfile()
            ]);
            setFetching(false);
        };

        fetchInitialData();

        const channel = supabase
            .channel(`dashboard-tracking-${currentShopId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens', filter: `shop_id=eq.${currentShopId}` }, () => fetchActiveQueue())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'staff', filter: `shop_id=eq.${currentShopId}` }, () => loadStaff())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'services', filter: `shop_id=eq.${currentShopId}` }, () => loadServices())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => loadProducts())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => fetchOrders())
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [currentShopId]);

    useEffect(() => {
        if (activeTab === 'analytics' && currentShopId) {
            fetchAnalytics();
        }
    }, [activeTab, currentShopId, staffList, servicesList]);

    const busyTokens = tokens.filter(t => t.status === 'called');
    const pendingTokens = tokens.filter(t => t.status === 'pending');
    const skippedTokens = tokens.filter(t => t.status === 'skipped');
    const availableStaff = staffList.filter(s => s.is_active !== false && !busyTokens.some(t => t.staff_id === s.id));

    // --- Actions ---

    const handleStartNext = async () => {
        if (pendingTokens.length === 0) return;
        if (availableStaff.length === 0) {
            alert("All staff are currently busy! Please complete or skip an active session first.");
            return;
        }
        const targetStaff = availableStaff[0];
        const nextToken = pendingTokens[0];

        setLoading(true);
        try {
            const { error: callError } = await supabase
                .from('tokens')
                .update({ 
                    status: 'called', 
                    staff_id: targetStaff.id,
                    called_at: new Date().toISOString() 
                })
                .eq('id', nextToken.id);
            if (callError) throw callError;
            await fetchActiveQueue();
        } catch (err) {
            console.error(err); alert("Error: " + err.message);
        } finally { setLoading(false); }
    };

    const handleCallForStaff = async (staffId) => {
        // 1. Find oldest token requesting THIS staff member
        let nextToken = pendingTokens.find(t => t.preferred_staff_id === staffId);
        
        // 2. If no specific requests, find oldest "Anyone/First Available" token
        if (!nextToken) {
            nextToken = pendingTokens.find(t => !t.preferred_staff_id);
        }

        if (!nextToken) {
            alert("No clients are currently waiting for you or for anyone.");
            return;
        }

        setLoading(true);
        try {
            const { error: callError } = await supabase
                .from('tokens')
                .update({ 
                    status: 'called', 
                    staff_id: staffId,
                    called_at: new Date().toISOString() 
                })
                .eq('id', nextToken.id);
            if (callError) throw callError;
            await fetchActiveQueue();
        } catch (err) {
            console.error(err); alert("Error: " + err.message);
        } finally { setLoading(false); }
    };

    const openCompletionModal = (token) => {
        setCompletingToken(token);
        setSelectedProductsForBilling([]);
        setSelectedAdditionalServicesForBilling([]);
        setManualAmount(0);
        setPaymentMode('cash');
    };

    const handleUpdateShopProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            const amenitiesArray = shopProfileForm.amenities.split(',').map(s => s.trim()).filter(s => s);
            const { error } = await supabase.from('shops').update({
                about_text: shopProfileForm.about_text,
                amenities: amenitiesArray,
                gallery_urls: shopProfileForm.gallery_urls
            }).eq('id', currentShopId);
            
            if (error) throw error;
            alert("Shop profile updated successfully!");
        } catch (err) {
            console.error("Error updating shop profile:", err);
            alert("Failed to update shop profile");
        } finally {
            setSavingProfile(false);
        }
    };

    const handleGalleryUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingImage(true);
        try {
            const url = await uploadImage(file, 'images', `gallery/${currentShopId}`);
            if (url) {
                setShopProfileForm(prev => ({
                    ...prev,
                    gallery_urls: [...(prev.gallery_urls || []), url]
                }));
            }
        } catch (err) {
            console.error("Upload error:", err);
            alert("Failed to upload image");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleStaffImageUpload = async (e, isEditing) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingImage(true);
        try {
            const url = await uploadImage(file, 'images', 'staff');
            if (isEditing) {
                setEditingStaff(prev => ({ ...prev, image_url: url }));
            } else {
                setStaffForm(prev => ({ ...prev, image_url: url }));
            }
        } catch (err) {
            alert("Failed to upload image");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleStaffMultiImageUpload = async (e, field, isEditing) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploadingImage(true);
        try {
            const uploadedUrls = [];
            for (const file of files) {
                const url = await uploadImage(file, 'images', `staff_${field}`);
                uploadedUrls.push(url);
            }

            if (isEditing) {
                setEditingStaff(prev => ({ 
                    ...prev, 
                    [field]: [...(prev[field] || []), ...uploadedUrls] 
                }));
            } else {
                setStaffForm(prev => ({ 
                    ...prev, 
                    [field]: [...(prev[field] || []), ...uploadedUrls] 
                }));
            }
        } catch (err) {
            alert("Failed to upload images: " + err.message);
        } finally {
            setUploadingImage(false);
            e.target.value = null; // Reset input to allow re-uploading same files if needed
        }
    };

    const removeStaffMultiImage = (field, indexToRemove, isEditing) => {
        if (isEditing) {
            setEditingStaff(prev => ({ ...prev, [field]: prev[field].filter((_, idx) => idx !== indexToRemove) }));
        } else {
            setStaffForm(prev => ({ ...prev, [field]: prev[field].filter((_, idx) => idx !== indexToRemove) }));
        }
    };

    const removeGalleryImage = (indexToRemove) => {
        setShopProfileForm(prev => ({
            ...prev,
            gallery_urls: prev.gallery_urls.filter((_, idx) => idx !== indexToRemove)
        }));
    };

    const handleCompleteFinal = async (finalAmount) => {
        setLoading(true);
        try {
            const mergedServices = completingToken.services_selected ? [...completingToken.services_selected] : [];
            mergedServices.push(...selectedAdditionalServicesForBilling);

            const { error: tokenError } = await supabase
                .from('tokens')
                .update({ 
                    status: 'completed', 
                    services_selected: mergedServices,
                    completed_at: new Date().toISOString()
                })
                .eq('id', completingToken.id);
            if (tokenError) throw tokenError;

            const { error: txError } = await supabase.from('transactions').insert([{
                token_id: completingToken.id,
                amount: finalAmount,
                payment_status: 'paid',
                payment_method: paymentMode,
                shop_id: currentShopId
            }]);
            if (txError) throw txError;

            // Reduce stock for products sold
            for (let pid of selectedProductsForBilling) {
                const product = productsList.find(p => p.id === pid);
                if (product && product.stock > 0) {
                    await supabase.from('products').update({ stock: product.stock - 1 }).eq('id', product.id);
                }
            }

            setCompletingToken(null);
            await fetchActiveQueue();
            await fetchRevenue();
            await fetchTokensServedTotal();
            await loadProducts(); // Refresh stock
        } catch (err) {
            console.error("Error completing:", err); alert("Error: " + err.message);
        } finally { setLoading(false); }
    };

    const handleSkip = async (assignedToken) => {
        if (!assignedToken) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('tokens')
                .update({ 
                    status: 'skipped',
                    skipped_at: new Date().toISOString() 
                })
                .eq('id', assignedToken.id);
            if (error) throw error;
            await fetchActiveQueue();
        } catch (err) { 
            console.error(err); 
            // If skipped_at is missing, we still set status to skipped
            if (err.message.includes('skipped_at')) {
                await supabase.from('tokens').update({ status: 'skipped' }).eq('id', assignedToken.id);
                await fetchActiveQueue();
            } else {
                alert("Error skipping: " + err.message);
            }
        } finally { setLoading(false); }
    };

    const handleCustomerArrived = async (token) => {
        setLoading(true);
        try {
            const skipTime = token.skipped_at ? new Date(token.skipped_at) : new Date();
            const now = new Date();
            const diffMins = (now - skipTime) / (1000 * 60);

            let updateData = { status: 'pending' };
            
            if (diffMins > 30) {
                // More than 30 mins: Move to end of line
                const { data: maxTokens } = await supabase
                    .from('tokens')
                    .select('token_number')
                    .order('token_number', { ascending: false })
                    .limit(1);
                const nextNo = (maxTokens && maxTokens.length > 0) ? maxTokens[0].token_number + 1 : token.token_number;
                
                updateData.created_at = now.toISOString();
                updateData.token_number = nextNo;
            }

            const { error } = await supabase
                .from('tokens')
                .update(updateData)
                .eq('id', token.id);
            
            if (error) throw error;
            await fetchActiveQueue();
        } catch (err) {
            console.error(err);
            alert("Error updating arrival: " + err.message);
        } finally { setLoading(false); }
    };

    const handleAddWalkin = async (e) => {
        e.preventDefault();
        setAddingWalkin(true);
        try {
            const { data: lastTokens, error: lastError } = await supabase.from('tokens').select('token_number').order('token_number', { ascending: false }).limit(1);
            if (lastError) throw lastError;

            const nextQueueNo = lastTokens && lastTokens.length > 0 ? lastTokens[0].token_number + 1 : 1;
            const { error: insertError } = await supabase.from('tokens').insert([{
                token_number: nextQueueNo, 
                status: 'pending', 
                source: 'walk-in',
                customer_name: walkinName || null, 
                customer_phone: walkinPhone || null, 
                shop_id: currentShopId,
                preferred_staff_id: walkinStaffId
            }]);

            if (insertError) throw insertError;
            setIsWalkinModalOpen(false); setWalkinName(''); setWalkinPhone(''); setWalkinStaffId(null);
            await fetchActiveQueue();
        } catch (err) { console.error(err); alert("Error: " + err.message); } finally { setAddingWalkin(false); }
    };

    // Service + Product + Staff form handlers

    const createStaff = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: (staffForm.name || '').trim(),
                role: (staffForm.role || '').trim() || 'general',
                rating: parseFloat(staffForm.rating) || 5.0,
                experience_years: parseInt(staffForm.experience_years) || 0,
                skills: staffForm.skills ? String(staffForm.skills).split(',').map(s => s.trim()).filter(Boolean) : [],
                certificates: staffForm.certificates ? String(staffForm.certificates).split(',').map(s => s.trim()).filter(Boolean) : [],
                certificate_urls: staffForm.certificate_urls || [],
                past_saloons: staffForm.past_saloons ? String(staffForm.past_saloons).split(',').map(s => s.trim()).filter(Boolean) : [],
                trainings: staffForm.trainings ? String(staffForm.trainings).split(',').map(s => s.trim()).filter(Boolean) : [],
                features: staffForm.features ? String(staffForm.features).split(',').map(s => s.trim()).filter(Boolean) : [],
                gallery_urls: staffForm.gallery_urls || [],
                image_url: (staffForm.image_url || '').trim() || null,
                shop_id: currentShopId
            };
            const { error } = await supabase.from('staff').insert([payload]);
            if (error) throw error;
            setStaffForm(EMPTY_STAFF_FORM);
            setShowStaffModal(false);
            await loadStaff();
        } catch (err) { alert(err.message); }
    };

    const createService = async (e) => {
        e.preventDefault();
        try {
            await supabase.from('services').insert([{
                name: serviceForm.name,
                price: parseInt(serviceForm.price) || 0,
                avg_time: parseInt(serviceForm.avg_time) || 15,
                service_type_id: serviceForm.service_type_id || null,
                image_url: serviceForm.image_url || null,
                shop_id: currentShopId
            }]);
            setServiceForm({ name: '', price: '', avg_time: 15, service_type_id: '', image_url: '' });
            await loadServices();
        } catch (err) { alert(err.message); }
    };

    const createProduct = async (e) => {
        e.preventDefault();
        try {
            await supabase.from('products').insert([{
                name: productForm.name,
                price: parseInt(productForm.price) || 0,
                stock: parseInt(productForm.stock) || 0,
                category_id: productForm.category_id || null,
                image_url: productForm.image_url || null,
                shop_id: currentShopId
            }]);
            setProductForm({ name: '', price: '', stock: '', category_id: '', image_url: '' });
            await loadProducts();
        } catch (err) { alert(err.message); }
    };

    // --- Management Handlers ---

    // Staff
    const handleToggleStaffVisibility = async (id, currentStatus) => {
        try {
            await toggleStaffVisibility(id, currentStatus);
            await loadStaff();
        } catch (err) { alert(err.message); }
    };

    const handleDeleteStaff = async (id) => {
        if (!window.confirm("Are you sure you want to delete this staff member? This cannot be undone.")) return;
        try {
            await deleteStaff(id);
            await loadStaff();
        } catch (err) { alert(err.message); }
    };

    const handleUpdateStaff = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name: (editingStaff.name || '').trim(),
                role: (editingStaff.role || '').trim(),
                rating: parseFloat(editingStaff.rating) || 5.0,
                experience_years: parseInt(editingStaff.experience_years) || 0,
                skills: Array.isArray(editingStaff.skills) ? editingStaff.skills : (editingStaff.skills ? String(editingStaff.skills).split(',').map(s => s.trim()).filter(Boolean) : []),
                certificates: Array.isArray(editingStaff.certificates) ? editingStaff.certificates : (editingStaff.certificates ? String(editingStaff.certificates).split(',').map(s => s.trim()).filter(Boolean) : []),
                certificate_urls: editingStaff.certificate_urls || [],
                past_saloons: Array.isArray(editingStaff.past_saloons) ? editingStaff.past_saloons : (editingStaff.past_saloons ? String(editingStaff.past_saloons).split(',').map(s => s.trim()).filter(Boolean) : []),
                trainings: Array.isArray(editingStaff.trainings) ? editingStaff.trainings : (editingStaff.trainings ? String(editingStaff.trainings).split(',').map(s => s.trim()).filter(Boolean) : []),
                features: Array.isArray(editingStaff.features) ? editingStaff.features : (editingStaff.features ? String(editingStaff.features).split(',').map(s => s.trim()).filter(Boolean) : []),
                gallery_urls: editingStaff.gallery_urls || [],
                image_url: (editingStaff.image_url || '').trim() || null
            };
            const { error } = await supabase.from('staff').update(payload).eq('id', editingStaff.id);
            if (error) throw error;
            setEditingStaff(null);
            setShowStaffModal(false);
            await loadStaff();
        } catch (err) { alert(err.message); }
    };

    // Services
    const handleToggleServiceVisibility = async (id, currentStatus) => {
        try {
            await toggleServiceVisibility(id, currentStatus);
            await loadServices();
        } catch (err) { alert(err.message); }
    };

    const handleDeleteService = async (id) => {
        if (!window.confirm("Are you sure you want to delete this service? This cannot be undone.")) return;
        try {
            await deleteService(id);
            await loadServices();
        } catch (err) { alert(err.message); }
    };

    const handleUpdateService = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('services').update({
                name: editingService.name,
                price: parseInt(editingService.price),
                avg_time: parseInt(editingService.avg_time),
                service_type_id: editingService.service_type_id || null,
                image_url: editingService.image_url || null
            }).eq('id', editingService.id);
            if (error) throw error;
            setEditingService(null);
            await loadServices();
        } catch (err) { alert(err.message); }
    };

    // Products
    const handleToggleProductVisibility = async (id, currentStatus) => {
        try {
            await toggleProductVisibility(id, currentStatus);
            await loadProducts();
        } catch (err) { alert(err.message); }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product? This cannot be undone.")) return;
        try {
            await deleteProduct(id);
            await loadProducts();
        } catch (err) { alert(err.message); }
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('products').update({
                name: editingProduct.name,
                price: parseInt(editingProduct.price),
                stock: parseInt(editingProduct.stock),
                category_id: editingProduct.category_id || null,
                image_url: editingProduct.image_url || null
            }).eq('id', editingProduct.id);
            if (error) throw error;
            setEditingProduct(null);
            await loadProducts();
        } catch (err) { alert(err.message); }
    };

    // Computed billing totals
    const servicesSubtotal = useMemo(() => {
        if (!completingToken) return 0;
        let sum = 0;
        if (completingToken.services_selected && Array.isArray(completingToken.services_selected)) {
            completingToken.services_selected.forEach(id => {
                const s = servicesList.find(service => service.id === id || service.name === id); // Name fallback for legacy string array tokens
                if (s) sum += s.price;
            });
        }
        selectedAdditionalServicesForBilling.forEach(id => {
            const s = servicesList.find(service => service.id === id);
            if (s) sum += s.price;
        });
        return sum;
    }, [completingToken, servicesList, selectedAdditionalServicesForBilling]);

    const productsSubtotal = useMemo(() => {
        return selectedProductsForBilling.reduce((sum, pid) => {
            const p = productsList.find(prod => prod.id === pid);
            return sum + (p ? p.price : 0);
        }, 0);
    }, [selectedProductsForBilling, productsList]);

    const getEstimatedWait = (token, idx) => {
        const AVG_TIME_MINS = 15;
        
        // 1. If a specific staff is requested
        if (token.preferred_staff_id) {
            // Find who this staff is currently serving (actual assignment via staff_id)
            const currentlyServing = tokens.find(t => t.status === 'called' && t.staff_id === token.preferred_staff_id);
            
            let baseTarget;
            if (currentlyServing) {
                // Base is when the current person finishes
                baseTarget = new Date(getRemainingServiceTime(currentlyServing));
            } else {
                // If staff is free, they start now
                baseTarget = new Date();
            }
            
            // Safety check: if target is in the past, set to now + 1 min
            if (baseTarget < new Date()) {
                baseTarget = new Date(Date.now() + 60000);
            }
            
            // How many people are ahead of this token FOR THE SAME STAFF?
            const peopleAheadForStaff = tokens.filter(t => 
                t.status === 'pending' && 
                t.preferred_staff_id === token.preferred_staff_id &&
                t.token_number < token.token_number
            ).length;
            
            const totalWaitMins = peopleAheadForStaff * AVG_TIME_MINS;
            return new Date(baseTarget.getTime() + totalWaitMins * 60000).toISOString();
        }
        
        // 2. General queue logic
        const availableStaffCount = staffList.filter(s => s.is_active !== false).length || 1;
        
        // Find all tokens that are 'called' (currently being served)
        const currentlyServingTokens = tokens.filter(t => t.status === 'called');
        
        // The "next available slot" is the earliest finish time among currently serving staff
        let earliestFinish = new Date();
        if (currentlyServingTokens.length > 0) {
            const finishTimes = currentlyServingTokens.map(t => new Date(getRemainingServiceTime(t)).getTime());
            // If we have fewer people being served than staff, someone is free NOW
            if (currentlyServingTokens.length < availableStaffCount) {
                earliestFinish = new Date();
            } else {
                earliestFinish = new Date(Math.min(...finishTimes));
            }
        }
        
        // Safety check
        if (earliestFinish < new Date()) {
            earliestFinish = new Date(Date.now() + 60000);
        }
        
        const peopleAhead = idx; // idx is position in the 'pending' list
        const waitMins = Math.ceil((peopleAhead * AVG_TIME_MINS) / availableStaffCount);
        
        return new Date(earliestFinish.getTime() + waitMins * 60000).toISOString();
    };

    const getRemainingServiceTime = (token) => {
        if (!token.called_at) return new Date(Date.now() + 15 * 60000).toISOString();
        
        // Calculate expected duration based on services selected
        let expectedMins = 15;
        if (token.services_selected && Array.isArray(token.services_selected)) {
            const serviceTimes = token.services_selected.map(sid => {
                const s = servicesList.find(serv => serv.id === sid || serv.name === sid);
                return s ? s.avg_time : 15;
            });
            if (serviceTimes.length > 0) {
                expectedMins = serviceTimes.reduce((a, b) => a + b, 0);
            }
        }

        const calledAt = new Date(token.called_at);
        // Target is called_at + expected duration
        let targetDate = new Date(calledAt.getTime() + expectedMins * 60000);
        
        // Safety: if finish time is in the past but token is still "called", 
        // give it at least 1 min remaining
        if (targetDate < new Date()) {
            targetDate = new Date(Date.now() + 60000);
        }
        
        return targetDate.toISOString();
    };

    const isOwner = role === 'shop_owner' || role === 'owner';
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    // Renders
    return (
        <div className={`dashboard-container ${isOwner ? 'owner-layout' : ''}`}>
            {isOwner && (
                <>
                    <div 
                        className={`sidebar-overlay ${mobileSidebarOpen ? 'visible' : ''}`}
                        onClick={() => setMobileSidebarOpen(false)}
                    />
                    <aside className={`dashboard-sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
                        <div className="sidebar-brand">
                            <div className="brand-logo">💈</div>
                            <div className="brand-text">
                                <div style={{ fontWeight: '900', color: '#000', fontSize: '20px', letterSpacing: '-0.5px' }}>TrimTime</div>
                                <div style={{ fontSize: '12px', color: '#666', fontWeight: '600', marginTop: '2px' }}>{shopData?.name || 'Shop Admin'}</div>
                            </div>
                        </div>

                        <nav className="sidebar-nav">
                            {[
                                { id: 'queue', label: 'Queue', icon: '⚡' },
                                { id: 'orders', label: 'Orders', icon: '📦' },
                                { id: 'services', label: 'Services', icon: '✂️' },
                                { id: 'products', label: 'Products', icon: '🧴' },
                                { id: 'staff', label: 'Staff', icon: '👤' },
                                { id: 'analytics', label: 'Analytics', icon: '📊' },
                                { id: 'profile', label: 'Shop Settings', icon: '⚙️' },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        setMobileSidebarOpen(false);
                                    }}
                                    className={`sidebar-btn ${activeTab === item.id ? 'active' : ''}`}
                                >
                                    <span className="btn-icon">{item.icon}</span>
                                    <span className="btn-label">{item.label}</span>
                                </button>
                            ))}
                        </nav>

                        <div className="sidebar-footer">
                            <button 
                                onClick={logout}
                                style={{ 
                                    width: '100%', 
                                    padding: '12px', 
                                    background: 'rgba(0,0,0,0.05)', 
                                    border: 'none', 
                                    borderRadius: '12px', 
                                    color: '#000', 
                                    fontSize: '13px', 
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                            >
                                🚪 Logout
                            </button>
                        </div>
                    </aside>
                </>
            )}

            <div className="dashboard-inner">
                {/* Mobile Menu Trigger - Minimalist Fixed Header */}
                {isOwner && (
                    <div className="mobile-dashboard-header">
                        <div className="mobile-header-brand" style={{ 
                            fontSize: '1rem', 
                            fontWeight: '950', 
                            color: '#000000', 
                            letterSpacing: '-0.8px' 
                        }}>
                            TRIMTIME<span style={{ color: '#276EF1' }}>.</span>
                        </div>
                        <button 
                            className="mobile-only-btn"
                            onClick={() => setMobileSidebarOpen(true)}
                        >
                            ⋮
                        </button>
                    </div>
                )}
                {!isOwner && (
                    <header className="premium-header">
                        <div>
                            <h1 className="premium-title" style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em' }}>Shop Dashboard</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }}></span>
                                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '13px', fontWeight: '500' }}>Live • Real-time Monitoring</p>
                            </div>
                        </div>
                        <nav className="tab-nav">
                            {['queue', 'services', 'products', 'orders', 'staff', 'profile', 'analytics'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                                    style={{ 
                                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                        background: activeTab === tab ? 'var(--premium-gradient)' : 'transparent',
                                        color: activeTab === tab ? 'white' : 'var(--text-muted)',
                                        boxShadow: activeTab === tab ? '0 8px 16px -4px rgba(99, 102, 241, 0.4)' : 'none'
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </nav>
                    </header>
                )}

                {/* OWNER QUICK CONTROL INTERFACE */}
                {isOwner && (
                    <div className="owner-quick-controls" style={{ 
                        background: '#000000', 
                        padding: '40px', 
                        borderRadius: '32px', 
                        marginBottom: '40px',
                        color: '#FFF',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '32px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                    }}>
                        <div className="quick-controls-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '950', letterSpacing: '-1.5px', color: '#FFF' }}>Queue Control</h2>
                                <p style={{ color: 'rgba(255,255,255,0.5)', margin: '8px 0 0', fontSize: '14px' }}>Managing {pendingTokens.length} waiting customers</p>
                            </div>
                            <div className="quick-controls-actions" style={{ 
                                display: 'flex', 
                                gap: '12px', 
                                alignItems: 'center', 
                                flexWrap: 'wrap',
                                justifyContent: 'flex-end',
                                maxWidth: '100%'
                            }}>
                                <button 
                                    onClick={() => setIsWalkinModalOpen(true)}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#FFF',
                                        padding: '10px 18px',
                                        borderRadius: '14px',
                                        fontSize: '13px',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                >
                                    <span style={{ fontSize: '16px' }}>➕</span> New Walk-in
                                </button>
                                <button 
                                    onClick={() => window.open(`/display/${currentShopId}`, '_blank')}
                                    style={{
                                        background: 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: '#FFF',
                                        padding: '10px 18px',
                                        borderRadius: '14px',
                                        fontSize: '13px',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        whiteSpace: 'nowrap',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <span style={{ fontSize: '16px' }}>📺</span> Open TV Display
                                </button>
                                <div className="staff-counter" style={{ 
                                    textAlign: 'right', 
                                    whiteSpace: 'nowrap', 
                                    paddingLeft: '16px',
                                    borderLeft: '1px solid rgba(255,255,255,0.1)',
                                    marginLeft: '4px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center'
                                }}>
                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '2px', fontWeight: '700' }}>Active Staff</div>
                                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#FFF', lineHeight: '1' }}>{busyTokens.length} / {staffList.length}</div>
                                </div>
                            </div>
                        </div>

                        <div className="quick-controls-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px', alignItems: 'center' }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px', fontWeight: '600' }}>NEXT IN LINE</div>
                                {pendingTokens.length > 0 ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <div style={{ width: '60px', height: '60px', background: '#FFF', color: '#000', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '900' }}>
                                            Q{pendingTokens[0].token_number}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '20px', fontWeight: '800' }}>{pendingTokens[0].customer_name || 'Guest User'}</div>
                                            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                                                {pendingTokens[0].services_selected?.length || 0} services • Waiting {Math.floor((new Date() - new Date(pendingTokens[0].created_at)) / 60000)}m
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No customers waiting</div>
                                )}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '100%' }}>
                                <button 
                                    onClick={() => handleSkip(pendingTokens[0])}
                                    disabled={loading || pendingTokens.length === 0}
                                    style={{ 
                                        background: 'rgba(255,255,255,0.08)', 
                                        color: '#FFFFFF', 
                                        border: '1px solid rgba(255,255,255,0.1)', 
                                        padding: '24px', 
                                        borderRadius: '24px', 
                                        fontSize: '18px', 
                                        fontWeight: '800', 
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        opacity: (loading || pendingTokens.length === 0) ? 0.3 : 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                                    onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                >
                                    <span style={{ fontSize: '20px' }}>⏭️</span>
                                    <span>SKIP</span>
                                </button>

                                <button 
                                    onClick={handleStartNext}
                                    disabled={loading || pendingTokens.length === 0 || availableStaff.length === 0}
                                    style={{ 
                                        background: '#FFFFFF', 
                                        color: '#000000', 
                                        border: 'none', 
                                        padding: '24px', 
                                        borderRadius: '24px', 
                                        fontSize: '18px', 
                                        fontWeight: '950', 
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        opacity: (loading || pendingTokens.length === 0 || availableStaff.length === 0) ? 0.3 : 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    <span style={{ fontSize: '20px' }}>▶️</span>
                                    <span>CALL NEXT</span>
                                </button>
                            </div>

                        </div>
                    </div>
                )}

                <div className="stats-grid">
                    <div className="stat-card premium-card" style={{ background: 'rgba(16, 185, 129, 0.03)', borderColor: 'rgba(16, 185, 129, 0.1)' }}>
                        <div className="stat-label">💰 Today's Revenue</div>
                        <div className="stat-value" style={{ color: 'var(--success)', textShadow: '0 0 20px rgba(16, 185, 129, 0.2)' }}>₹{todayRevenue.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="stat-card premium-card" style={{ background: 'rgba(99, 102, 241, 0.03)', borderColor: 'rgba(99, 102, 241, 0.1)' }}>
                        <div className="stat-label">📅 This Month</div>
                        <div className="stat-value" style={{ color: 'var(--primary)', textShadow: '0 0 20px rgba(99, 102, 241, 0.2)' }}>₹{monthlyRevenue.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="stat-card premium-card" style={{ background: 'rgba(168, 85, 247, 0.03)', borderColor: 'rgba(168, 85, 247, 0.1)' }}>
                        <div className="stat-label">🎟️ Tokens Served</div>
                        <div className="stat-value" style={{ color: 'var(--accent)', textShadow: '0 0 20px rgba(168, 85, 247, 0.2)' }}>{tokensServedTotal}</div>
                    </div>
                </div>

                <main className="content-card glass-panel">
                    {/* QUEUE TAB */}
                    {activeTab === 'queue' && (
                        <div>
                            <div className="section-header-flex">
                                <div>
                                    <h2 className="section-title" style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Queue Flow</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Monitor live tokens and staff availability</p>
                                </div>
                                {!isOwner && (
                                    <div className="staff-actions">
                                        <button 
                                            onClick={() => window.open(`/display/${currentShopId}`, '_blank')} 
                                            className="premium-btn btn-outline"
                                        >
                                            📺 Display Mode
                                        </button>
                                        <button 
                                            onClick={() => setIsWalkinModalOpen(true)} 
                                            className="premium-btn btn-primary"
                                        >
                                            ➕ New Walk-in
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: '48px' }}>
                                <div className="section-header-flex" style={{ marginBottom: '24px' }}>
                                    <h3 className="section-title" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>Active Staff & Serving</h3>
                                    <button
                                        onClick={handleStartNext}
                                        disabled={loading || pendingTokens.length === 0 || availableStaff.length === 0}
                                        className="premium-btn btn-primary"
                                        style={{ 
                                            opacity: (loading || pendingTokens.length === 0 || availableStaff.length === 0) ? 0.4 : 1
                                        }}
                                    >
                                        ▶️ Start Next Token
                                    </button>
                                </div>

                                <div className="staff-grid">
                                    {staffList.filter(s => s.is_active !== false || busyTokens.some(t => t.staff_id === s.id)).map(staff => {
                                        const assignedToken = busyTokens.find(t => t.staff_id === staff.id);
                                        return (
                                            <div key={staff.id} className="staff-item premium-card" style={{ border: assignedToken ? '1px solid var(--primary-glow)' : '1px solid rgba(255,255,255,0.06)' }}>
                                                <div className="staff-info">
                                                    <div className="avatar" style={{ 
                                                        background: assignedToken ? 'var(--premium-gradient)' : 'rgba(255,255,255,0.03)',
                                                        boxShadow: assignedToken ? '0 10px 20px -5px rgba(99, 102, 241, 0.4)' : 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        {assignedToken ? '⚡' : '👤'}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--text-main)' }}>{staff.name}</div>
                                                        {assignedToken ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                                                <div style={{ fontSize: '11px', fontWeight: '800', background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '8px', color: 'var(--primary)' }}>
                                                                    Q{assignedToken.token_number}
                                                                </div>
                                                                <div className="separator" style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></div>
                                                                <CountdownTimer 
                                                                    targetDate={getRemainingServiceTime(assignedToken)} 
                                                                    size="sm" 
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '700', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span className="pulse-success" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></span>
                                                                Online • Ready
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="staff-actions">
                                                    {assignedToken ? (
                                                        <>
                                                            <button onClick={() => handleSkip(assignedToken)} disabled={loading} className="premium-btn btn-outline">Skip</button>
                                                            <button onClick={() => openCompletionModal(assignedToken)} disabled={loading} className="premium-btn btn-primary">Checkout</button>
                                                        </>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleCallForStaff(staff.id)}
                                                            disabled={loading || pendingTokens.length === 0}
                                                            className="premium-btn btn-outline"
                                                            style={{ 
                                                                opacity: (loading || pendingTokens.length === 0) ? 0.4 : 1,
                                                                fontWeight: '700'
                                                            }}
                                                        >
                                                            Call Next
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="dashboard-layout-grid">
                                <div>
                                    <h3 className="section-title" style={{ fontSize: '18px', marginBottom: '24px', color: 'var(--text-muted)' }}>Waiting Line ({pendingTokens.length})</h3>
                                    {pendingTokens.length === 0 ? (
                                        <div style={{ padding: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px dashed var(--glass-border)' }}>
                                            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>No clients in the waiting line.</p>
                                        </div>
                                    ) : (
                                        <div className="pending-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {pendingTokens.map((token, idx) => (
                                                <div key={token.id} className="token-row premium-card">
                                                    <div className="token-info-main">
                                                        <div className="token-number">
                                                            {token.token_number}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '800', fontSize: '17px', letterSpacing: '-0.01em' }}>{token.customer_name || 'Guest Client'}</div>
                                                            {token.preferred_staff_id && (
                                                                <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '800', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <span style={{ opacity: 0.5 }}>REQUESTED:</span> 
                                                                    <span style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                                                                        {staffList.find(s => s.id === token.preferred_staff_id)?.name}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="token-meta">
                                                        <div className="wait-info">
                                                            <div className="wait-label">Est. Wait</div>
                                                            <CountdownTimer 
                                                                targetDate={getEstimatedWait(token, idx)} 
                                                                size="sm" 
                                                            />
                                                        </div>
                                                        <div className="token-source-badge">
                                                            {token.source}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {skippedTokens.length > 0 && (
                                    <div>
                                        <h3 className="section-title" style={{ fontSize: '18px', marginBottom: '20px', color: 'var(--warning)' }}>No-Show / Skipped</h3>
                                        <div className="pending-list">
                                            {skippedTokens.map(token => {
                                                const skipTime = token.skipped_at ? new Date(token.skipped_at) : new Date();
                                                const waitMins = Math.floor((new Date() - skipTime) / (1000 * 60));
                                                return (
                                                    <div key={token.id} className="token-row" style={{ borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <span style={{ fontWeight: '700', color: 'var(--warning)' }}>Q{token.token_number}</span>
                                                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{waitMins}m ago</span>
                                                            </div>
                                                            <div style={{ fontSize: '14px', marginTop: '4px' }}>{token.customer_name || 'Guest'}</div>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleCustomerArrived(token)}
                                                            disabled={loading}
                                                            className="premium-btn"
                                                            style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.2)' }}
                                                        >
                                                            Arrived
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* STAFF TAB */}
                    {activeTab === 'staff' && (
                        <div>
                            <div className="section-header">
                                <h2 className="section-title">Staff Management</h2>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                                <button onClick={() => { setStaffForm(EMPTY_STAFF_FORM); setEditingStaff(null); setShowStaffModal(true); }} className="premium-btn btn-primary">
                                    ➕ Add New Staff
                                </button>
                            </div>

                            <div className="staff-grid">
                                {staffList.map(s => (
                                    <div key={s.id} className="staff-item" style={{ opacity: s.is_active === false ? 0.6 : 1 }}>
                                        <div className="staff-info">
                                            <div className="avatar">👤</div>
                                            <div>
                                                <div style={{ fontWeight: '600' }}>{s.name} {s.is_active === false && '(Hidden)'}</div>
                                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{s.role || 'Staff'}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => { setEditingStaff(s); setShowStaffModal(true); }} className="premium-btn btn-outline" style={{ padding: '6px', minWidth: '36px' }}>✏️</button>
                                            <button onClick={() => handleToggleStaffVisibility(s.id, s.is_active !== false)} className="premium-btn btn-outline" style={{ padding: '6px', minWidth: '36px' }}>
                                                {s.is_active !== false ? '👁️' : '🫥'}
                                            </button>
                                            <button onClick={() => handleDeleteStaff(s.id)} className="premium-btn btn-outline" style={{ padding: '6px', minWidth: '36px', color: 'var(--danger)' }}>🗑️</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div>
                            <div className="section-header">
                                <h2 className="section-title">Shop Profile</h2>
                            </div>
                            
                            <form onSubmit={handleUpdateShopProfile} className="content-card" style={{ marginBottom: '40px', background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label className="form-label" style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>About the Shop</label>
                                    <textarea 
                                        className="form-input" 
                                        rows="4" 
                                        placeholder="Describe your shop..."
                                        value={shopProfileForm.about_text}
                                        onChange={(e) => setShopProfileForm({...shopProfileForm, about_text: e.target.value})}
                                        style={{ width: '100%', resize: 'vertical' }}
                                    ></textarea>
                                </div>
                                
                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label className="form-label" style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Amenities (comma separated)</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        placeholder="e.g. WiFi, AC, Free Parking, Coffee"
                                        value={shopProfileForm.amenities}
                                        onChange={(e) => setShopProfileForm({...shopProfileForm, amenities: e.target.value})}
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div className="form-group" style={{ marginBottom: '24px' }}>
                                    <label className="form-label" style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px', display: 'block' }}>Gallery Images</label>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                                        {shopProfileForm.gallery_urls?.map((url, idx) => (
                                            <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                                                <img src={url} alt={`Gallery ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button 
                                                    type="button"
                                                    onClick={() => removeGalleryImage(idx)}
                                                    style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                        
                                        <div style={{ aspectRatio: '1', borderRadius: '12px', border: '1px dashed var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', position: 'relative', cursor: 'pointer', overflow: 'hidden' }}>
                                            {uploadingImage ? (
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Uploading...</span>
                                            ) : (
                                                <>
                                                    <span style={{ fontSize: '24px', color: 'var(--text-muted)' }}>+</span>
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        onChange={handleGalleryUpload}
                                                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    className="premium-btn btn-primary" 
                                    disabled={savingProfile}
                                    style={{ width: '100%', height: '48px' }}
                                >
                                    {savingProfile ? 'Saving...' : 'Save Profile'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* SERVICES TAB */}
                    {activeTab === 'services' && (
                        <div>
                            <div className="section-header">
                                <h2 className="section-title">Services</h2>
                            </div>

                             <form onSubmit={createService} className="content-card" style={{ marginBottom: '40px', background: '#F9F9F9', padding: '24px', borderRadius: '20px', border: '1px solid #EEEEEE' }}>
                                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: 'var(--text-muted)' }}>➕ Add New Service</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div className="responsive-form">
                                        <input type="text" placeholder="Service Name" required value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} className="form-input" style={{ flex: 2 }} />
                                        <input type="number" placeholder="Price (₹)" required value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })} className="form-input" style={{ flex: 1 }} />
                                        <input type="number" placeholder="Mins" required value={serviceForm.avg_time} onChange={(e) => setServiceForm({ ...serviceForm, avg_time: e.target.value })} className="form-input" style={{ flex: 1 }} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <select 
                                            value={serviceForm.service_type_id} 
                                            onChange={(e) => setServiceForm({ ...serviceForm, service_type_id: e.target.value })} 
                                            className="form-input" 
                                            style={{ flex: 1 }}
                                        >
                                            <option value="">Link to Global Service Type (Optional)</option>
                                            {serviceTypes.map(type => (
                                                <option key={type.id} value={type.id}>{type.name}</option>
                                            ))}
                                        </select>
                                        <div style={{ position: 'relative', flex: 1 }}>
                                            <input 
                                                type="text" 
                                                placeholder="Service Image URL" 
                                                value={serviceForm.image_url} 
                                                onChange={(e) => setServiceForm({ ...serviceForm, image_url: e.target.value })} 
                                                className="form-input"
                                                style={{ width: '100%', paddingRight: '40px' }}
                                            />
                                            <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}>
                                                📷
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (!file) return;
                                                        setUploadingImage(true);
                                                        const url = await uploadImage(file, 'images', `services/${currentShopId}`);
                                                        setServiceForm(prev => ({ ...prev, image_url: url }));
                                                        setUploadingImage(false);
                                                    }}
                                                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                                />
                                            </div>
                                        </div>
                                        <button type="submit" className="premium-btn btn-primary" style={{ height: '48px', padding: '0 32px' }}>Add Service</button>
                                    </div>
                                </div>
                            </form>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                                {servicesList.map(s => (
                                    <div key={s.id} className="token-row" style={{ opacity: s.is_active === false ? 0.6 : 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                                            <div style={{ fontWeight: '600' }}>{s.name} {s.is_active === false && '(Hidden)'}</div>
                                            <div style={{ display: 'flex', gap: '15px' }}>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>⏱️ {s.avg_time}m</span>
                                                <span style={{ color: 'var(--success)', fontWeight: '700' }}>₹{s.price}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => setEditingService(s)} className="premium-btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>Edit</button>
                                            <button onClick={() => handleToggleServiceVisibility(s.id, s.is_active !== false)} className="premium-btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>
                                                {s.is_active !== false ? 'Hide' : 'Show'}
                                            </button>
                                            <button onClick={() => handleDeleteService(s.id)} className="premium-btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', color: 'var(--danger)' }}>Del</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PRODUCTS TAB */}
                    {activeTab === 'products' && (
                        <div>
                            <div className="section-header">
                                <h2 className="section-title">Products</h2>
                            </div>

                             <form onSubmit={createProduct} className="content-card" style={{ marginBottom: '40px', background: '#F9F9F9', padding: '24px', borderRadius: '20px', border: '1px solid #EEEEEE' }}>
                                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: 'var(--text-muted)' }}>➕ Add New Product</h3>
                                <div className="responsive-form">
                                    <input type="text" placeholder="Product Name" required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="form-input" style={{ flex: 2 }} />
                                    <input type="number" placeholder="Price (₹)" required value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="form-input" style={{ flex: 1 }} />
                                    <input type="number" placeholder="Stock" required value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} className="form-input" style={{ flex: 1 }} />
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                                        <select 
                                            required 
                                            value={productForm.category_id} 
                                            onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })} 
                                            className="form-input" 
                                            style={{ flex: 1 }}
                                        >
                                            <option value="">Select Category</option>
                                            {dbCategories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <div style={{ position: 'relative', flex: 1 }}>
                                            <input 
                                                type="text" 
                                                placeholder="Product Image URL" 
                                                value={productForm.image_url} 
                                                onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })} 
                                                className="form-input"
                                                style={{ width: '100%', paddingRight: '40px' }}
                                            />
                                            <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}>
                                                📷
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (!file) return;
                                                        setUploadingImage(true);
                                                        const url = await uploadImage(file, 'images', `products/${currentShopId}`);
                                                        setProductForm(prev => ({ ...prev, image_url: url }));
                                                        setUploadingImage(false);
                                                    }}
                                                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                                />
                                            </div>
                                        </div>
                                        <button type="submit" className="premium-btn btn-primary" style={{ height: '48px', padding: '0 32px' }}>Add Product</button>
                                    </div>
                                </div>
                            </form>

                            <div className="staff-grid">
                                {productsList.map(p => (
                                    <div key={p.id} className="staff-item" style={{ flexDirection: 'column', alignItems: 'stretch', opacity: p.is_active === false ? 0.6 : 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                            <div style={{ fontWeight: '600' }}>{p.name} {!p.shop_id && '🏛️'}</div>
                                            <div style={{ color: 'var(--success)', fontWeight: '700' }}>₹{p.price}</div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '13px', color: p.stock > 5 ? 'var(--text-muted)' : 'var(--danger)' }}>
                                                📦 {p.stock} in stock
                                            </span>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => setEditingProduct(p)} className="premium-btn btn-outline" style={{ padding: '4px 10px', fontSize: '11px' }}>Edit</button>
                                                {p.shop_id && (
                                                    <button onClick={() => handleDeleteProduct(p.id)} className="premium-btn btn-outline" style={{ padding: '4px 10px', fontSize: '11px', color: 'var(--danger)' }}>Del</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ORDERS TAB */}
                    {activeTab === 'orders' && (
                        <div>
                            <div className="section-header">
                                <h2 className="section-title">Product Orders</h2>
                                <button 
                                    onClick={fetchOrders} 
                                    className="premium-btn btn-outline"
                                    style={{ fontSize: '12px' }}
                                >
                                    🔄 Refresh
                                </button>
                            </div>

                            {orders.length === 0 ? (
                                <div style={{ padding: '80px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px dashed var(--glass-border)' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>No orders received yet.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {orders.map(order => (
                                        <div key={order.id} className="premium-card" style={{ padding: '24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <span style={{ fontWeight: '800', fontSize: '18px' }}>Order #{order.id.slice(0, 8)}</span>
                                                        <span style={{ 
                                                            fontSize: '11px', 
                                                            fontWeight: '800', 
                                                            padding: '4px 10px', 
                                                            borderRadius: '8px',
                                                            textTransform: 'uppercase',
                                                            background: order.status === 'delivered' ? 'rgba(16, 185, 129, 0.1)' : 
                                                                       order.status === 'shipped' ? 'rgba(99, 102, 241, 0.1)' : 
                                                                       'rgba(245, 158, 11, 0.1)',
                                                            color: order.status === 'delivered' ? 'var(--success)' : 
                                                                   order.status === 'shipped' ? 'var(--primary)' : 
                                                                   'var(--warning)'
                                                        }}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                        {new Date(order.created_at).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Amount</div>
                                                    <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--success)' }}>₹{order.total_amount.toLocaleString()}</div>
                                                </div>
                                            </div>

                                            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                                                <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Customer Details</div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                                                    <div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Name</div>
                                                        <div style={{ fontWeight: '600' }}>{order.customer_name}</div>
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Phone</div>
                                                        <div style={{ fontWeight: '600' }}>{order.customer_phone}</div>
                                                    </div>
                                                    <div style={{ gridColumn: '1 / -1' }}>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Delivery Address</div>
                                                        <div style={{ fontWeight: '500', fontSize: '14px', lineHeight: '1.5' }}>{order.delivery_address}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ marginBottom: '24px' }}>
                                                <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Order Items</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {order.order_items?.map(item => (
                                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🛒</div>
                                                                <div>
                                                                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{item.products?.name}</div>
                                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>₹{item.price_at_time} × {item.quantity}</div>
                                                                </div>
                                                            </div>
                                                            <div style={{ fontWeight: '700' }}>₹{item.price_at_time * item.quantity}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                {order.status === 'pending' && (
                                                    <button 
                                                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                                                        disabled={updatingOrder === order.id}
                                                        className="premium-btn btn-primary"
                                                        style={{ flex: 1 }}
                                                    >
                                                        {updatingOrder === order.id ? 'Updating...' : 'Confirm Order'}
                                                    </button>
                                                )}
                                                {order.status === 'confirmed' && (
                                                    <button 
                                                        onClick={() => updateOrderStatus(order.id, 'shipped')}
                                                        disabled={updatingOrder === order.id}
                                                        className="premium-btn btn-primary"
                                                        style={{ flex: 1, background: 'var(--secondary)' }}
                                                    >
                                                        {updatingOrder === order.id ? 'Updating...' : 'Mark as Shipped'}
                                                    </button>
                                                )}
                                                {order.status === 'shipped' && (
                                                    <button 
                                                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                                                        disabled={updatingOrder === order.id}
                                                        className="premium-btn btn-primary"
                                                        style={{ flex: 1, background: 'var(--success)' }}
                                                    >
                                                        {updatingOrder === order.id ? 'Updating...' : 'Mark as Delivered'}
                                                    </button>
                                                )}
                                                <button className="premium-btn btn-outline" style={{ flex: 1 }}>Print Invoice</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ANALYTICS TAB */}
                    {activeTab === 'analytics' && (
                        <div>
                            <div className="section-header">
                                <h2 className="section-title">Shop Performance</h2>
                                <button 
                                    onClick={fetchAnalytics} 
                                    disabled={loadingAnalytics}
                                    className="premium-btn btn-outline"
                                    style={{ fontSize: '12px' }}
                                >
                                    {loadingAnalytics ? '⌛ Updating...' : '🔄 Refresh'}
                                </button>
                            </div>

                            {loadingAnalytics ? (
                                <div style={{ padding: '100px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '20px', animation: 'spin 2s linear infinite' }}>📊</div>
                                    <p>Gathering performance insights...</p>
                                </div>
                            ) : (
                                <>
                                     <div className="metric-grid" style={{ marginBottom: '40px' }}>
                                        <div className="metric-box">
                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Avg Service Time</div>
                                            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary)' }}>{analyticsData.overall.avgServiceTime}m</div>
                                        </div>
                                        <div className="metric-box">
                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Total Clients</div>
                                            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--success)' }}>{analyticsData.overall.totalTokens}</div>
                                        </div>
                                        <div className="metric-box">
                                            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>Gross Revenue</div>
                                            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent)' }}>₹{analyticsData.overall.totalRevenue.toLocaleString('en-IN')}</div>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '40px' }}>
                                        <h3 className="section-title" style={{ fontSize: '18px', marginBottom: '20px' }}>Staff Efficiency</h3>
                                        <div className="pending-list">
                                            {analyticsData.staffMetrics.map(s => (
                                                <div key={s.name} className="token-row" style={{ padding: '20px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                        <div className="avatar">👤</div>
                                                        <div>
                                                            <div style={{ fontWeight: '600' }}>{s.name}</div>
                                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.tokensServed} clients • {s.avgTime}m avg</div>
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Revenue Share</div>
                                                        <div style={{ fontWeight: '700', color: 'var(--success)' }}>₹{s.revenue.toLocaleString('en-IN')}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="section-title" style={{ fontSize: '18px', marginBottom: '20px' }}>Service Popularity</h3>
                                        <div className="popularity-grid">
                                            {analyticsData.serviceMetrics.map(sm => {
                                                const maxCount = analyticsData.serviceMetrics.length > 0 ? Math.max(...analyticsData.serviceMetrics.map(s => s.count)) : 1;
                                                const percentage = (sm.count / maxCount) * 100;
                                                return (
                                                    <div key={sm.name} className="popularity-card">
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: '600' }}>{sm.name}</span>
                                                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: '20px' }}>
                                                                {sm.count} uses
                                                            </span>
                                                        </div>
                                                        <div className="progress-bg">
                                                            <div className="progress-fill" style={{ width: `${percentage}%` }}></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* COMPLETION MODAL */}
            {completingToken && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <div className="avatar" style={{ 
                                background: 'var(--premium-gradient)', 
                                boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)',
                                margin: '0 auto 16px' 
                            }}>🧾</div>
                            <h2 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 4px 0', letterSpacing: '-0.03em' }}>Final Settlement</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500', margin: 0 }}>Token #Q{completingToken.token_number} • {completingToken.customer_name || 'Guest'}</p>
                        </div>

                        <div className="receipt-bg" style={{ marginBottom: '24px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Service Summary</span>
                                <span>Amount</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {completingToken.services_selected?.map((sid, idx) => {
                                    const service = servicesList.find(s => s.id === sid || s.name === sid);
                                    return (
                                        <div key={`pre-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '500' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.9)' }}>{service ? service.name : sid}</span>
                                            <span style={{ fontWeight: '700', fontFamily: 'var(--font-heading)' }}>₹{service ? service.price : 0}</span>
                                        </div>
                                    );
                                })}
                                {selectedAdditionalServicesForBilling.map((sid, idx) => {
                                    const service = servicesList.find(s => s.id === sid);
                                    return (
                                        <div key={`add-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '500' }}>
                                            <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ opacity: 0.6 }}>+</span> {service?.name}
                                                <button onClick={() => setSelectedAdditionalServicesForBilling(prev => prev.filter((_, i) => i !== idx))} style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', fontSize: '10px' }}>✕</button>
                                            </span>
                                            <span style={{ fontWeight: '700', fontFamily: 'var(--font-heading)' }}>₹{service?.price}</span>
                                        </div>
                                    );
                                })}
                                {selectedProductsForBilling.map((pid, idx) => {
                                    const product = productsList.find(p => p.id === pid);
                                    return (
                                        <div key={`prod-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '500' }}>
                                            <span style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ opacity: 0.6 }}>🛒</span> {product?.name}
                                                <button onClick={() => setSelectedProductsForBilling(prev => prev.filter((_, i) => i !== idx))} style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '6px', fontSize: '10px' }}>✕</button>
                                            </span>
                                            <span style={{ fontWeight: '700', fontFamily: 'var(--font-heading)' }}>₹{product?.price}</span>
                                        </div>
                                    );
                                })}
                                
                                <div className="responsive-form" style={{ marginTop: '10px' }}>
                                    <select 
                                        className="form-input" 
                                        style={{ fontSize: '11px', padding: '8px 12px', borderRadius: '10px' }}
                                        onChange={(e) => { if(e.target.value) { setSelectedAdditionalServicesForBilling([...selectedAdditionalServicesForBilling, e.target.value]); e.target.value = ''; } }}
                                    >
                                        <option value="">+ Service</option>
                                        {servicesList.filter(s => s.is_active !== false).map(s => <option key={s.id} value={s.id}>{s.name} (₹{s.price})</option>)}
                                    </select>
                                    <select 
                                        className="form-input" 
                                        style={{ fontSize: '11px', padding: '8px 12px', borderRadius: '10px' }}
                                        onChange={(e) => { if(e.target.value) { setSelectedProductsForBilling([...selectedProductsForBilling, e.target.value]); e.target.value = ''; } }}
                                    >
                                        <option value="">+ Product</option>
                                        {productsList.filter(p => p.stock > 0 && p.is_active !== false).map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', margin: '16px 0', paddingTop: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>Extra Adjustments</span>
                                    <div style={{ position: 'relative', width: '100px' }}>
                                        <span style={{ position: 'absolute', left: '10px', top: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>₹</span>
                                        <input type="number" value={manualAmount || ''} onChange={(e) => setManualAmount(e.target.value ? parseInt(e.target.value) : 0)} className="form-input" style={{ padding: '8px 10px 8px 20px', fontSize: '13px', borderRadius: '10px', textAlign: 'right', fontWeight: '700' }} placeholder="0" />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.02em' }}>Grand Total</span>
                                    <span style={{ fontSize: '26px', fontWeight: '900', color: 'var(--success)', textShadow: '0 0 20px rgba(16, 185, 129, 0.3)', fontFamily: 'var(--font-heading)' }}>₹{(servicesSubtotal + productsSubtotal + (Number(manualAmount) || 0)).toLocaleString('en-IN')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label className="form-label" style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', display: 'block' }}>Payment Method</label>
                            <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.02)', padding: '4px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <button onClick={() => setPaymentMode('cash')} style={{ 
                                    flex: 1, 
                                    borderRadius: '16px', 
                                    padding: '12px', 
                                    background: paymentMode === 'cash' ? 'var(--premium-gradient)' : 'transparent', 
                                    color: paymentMode === 'cash' ? 'white' : 'var(--text-muted)', 
                                    border: 'none', 
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: paymentMode === 'cash' ? '0 8px 16px -4px rgba(99, 102, 241, 0.4)' : 'none'
                                }}>💵 Cash</button>
                                <button onClick={() => setPaymentMode('online')} style={{ 
                                    flex: 1, 
                                    borderRadius: '16px', 
                                    padding: '12px', 
                                    background: paymentMode === 'online' ? 'var(--premium-gradient)' : 'transparent', 
                                    color: paymentMode === 'online' ? 'white' : 'var(--text-muted)', 
                                    border: 'none', 
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: paymentMode === 'online' ? '0 8px 16px -4px rgba(99, 102, 241, 0.4)' : 'none'
                                }}>📱 Online</button>
                            </div>
                        </div>

                        <div className="responsive-form">
                            <button onClick={() => setCompletingToken(null)} className="premium-btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                            <button 
                                onClick={() => handleCompleteFinal(servicesSubtotal + productsSubtotal + (Number(manualAmount) || 0))}
                                disabled={loading}
                                className="premium-btn btn-primary" 
                                style={{ flex: 2 }}
                            >
                                {loading ? 'Finalizing...' : 'Complete & Close'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* WALK-IN MODAL */}
            {isWalkinModalOpen && (
                <div className="modal-overlay">
                    <form onSubmit={handleAddWalkin} className="modal-content">
                        <h2 className="section-title" style={{ fontSize: '24px', marginBottom: '24px' }}>Add Walk-in</h2>
                        <div className="form-group">
                            <label className="form-label">Customer Name</label>
                            <input type="text" value={walkinName} onChange={(e) => setWalkinName(e.target.value)} className="form-input" placeholder="e.g. John Doe" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input type="text" value={walkinPhone} onChange={(e) => setWalkinPhone(e.target.value)} className="form-input" placeholder="e.g. 9876543210" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Preferred Staff</label>
                            <select value={walkinStaffId || ''} onChange={(e) => setWalkinStaffId(e.target.value || null)} className="form-input">
                                <option value="">Any Available</option>
                                {staffList.filter(s => s.is_active !== false).map(staff => (
                                    <option key={staff.id} value={staff.id}>{staff.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="responsive-form" style={{ marginTop: '32px' }}>
                            <button type="button" onClick={() => setIsWalkinModalOpen(false)} className="premium-btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                            <button type="submit" disabled={addingWalkin} className="premium-btn btn-primary" style={{ flex: 2 }}>
                                {addingWalkin ? 'Adding...' : 'Confirm Entry'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* STAFF MODAL (Add/Edit) */}
            {showStaffModal && (
                <div className="modal-overlay">
                    <form onSubmit={editingStaff ? handleUpdateStaff : createStaff} className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 className="section-title" style={{ fontSize: '24px', marginBottom: '24px' }}>
                            {editingStaff ? 'Edit Barber Profile' : 'Add New Barber'}
                        </h2>
                        
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Name</label>
                                <input type="text" value={editingStaff ? editingStaff.name : staffForm.name} onChange={(e) => editingStaff ? setEditingStaff({...editingStaff, name: e.target.value}) : setStaffForm({...staffForm, name: e.target.value})} className="form-input" required />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Role</label>
                                <input type="text" value={editingStaff ? editingStaff.role : staffForm.role} onChange={(e) => editingStaff ? setEditingStaff({...editingStaff, role: e.target.value}) : setStaffForm({...staffForm, role: e.target.value})} className="form-input" placeholder="e.g. Master Barber" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Rating (0-5)</label>
                                <input type="number" step="0.1" min="0" max="5" value={editingStaff ? editingStaff.rating : staffForm.rating} onChange={(e) => editingStaff ? setEditingStaff({...editingStaff, rating: e.target.value}) : setStaffForm({...staffForm, rating: e.target.value})} className="form-input" />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Experience (Years)</label>
                                <input type="number" value={editingStaff ? editingStaff.experience_years : staffForm.experience_years} onChange={(e) => editingStaff ? setEditingStaff({...editingStaff, experience_years: e.target.value}) : setStaffForm({...staffForm, experience_years: e.target.value})} className="form-input" />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label">Skills (Comma separated)</label>
                            <input type="text" value={editingStaff ? (Array.isArray(editingStaff.skills) ? editingStaff.skills.join(', ') : editingStaff.skills) : staffForm.skills} onChange={(e) => editingStaff ? setEditingStaff({...editingStaff, skills: e.target.value}) : setStaffForm({...staffForm, skills: e.target.value})} className="form-input" placeholder="Fade, Scissor Cut, Beard Trim" />
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label">Certificates (Text, comma separated)</label>
                            <input type="text" value={editingStaff ? (Array.isArray(editingStaff.certificates) ? editingStaff.certificates.join(', ') : editingStaff.certificates) : staffForm.certificates} onChange={(e) => editingStaff ? setEditingStaff({...editingStaff, certificates: e.target.value}) : setStaffForm({...staffForm, certificates: e.target.value})} className="form-input" placeholder="Master Barber 2023, Color Specialist" />
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label">Certificate Photos</label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input type="file" multiple accept="image/*" onChange={(e) => handleStaffMultiImageUpload(e, 'certificate_urls', !!editingStaff)} style={{ fontSize: '13px' }} disabled={uploadingImage} />
                                {uploadingImage && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Uploading...</span>}
                            </div>
                            {(editingStaff ? editingStaff.certificate_urls : staffForm.certificate_urls)?.length > 0 && (
                                <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {(editingStaff ? editingStaff.certificate_urls : staffForm.certificate_urls).map((url, idx) => (
                                        <div key={idx} style={{ position: 'relative' }}>
                                            <img src={url} alt={`Cert ${idx}`} style={{ height: '60px', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
                                            <button type="button" onClick={() => removeStaffMultiImage('certificate_urls', idx, !!editingStaff)} style={{ position: 'absolute', top: -5, right: -5, background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label">Styling Portfolio (Gallery Photos)</label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input type="file" multiple accept="image/*" onChange={(e) => handleStaffMultiImageUpload(e, 'gallery_urls', !!editingStaff)} style={{ fontSize: '13px' }} disabled={uploadingImage} />
                                {uploadingImage && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Uploading...</span>}
                            </div>
                            {(editingStaff ? editingStaff.gallery_urls : staffForm.gallery_urls)?.length > 0 && (
                                <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {(editingStaff ? editingStaff.gallery_urls : staffForm.gallery_urls).map((url, idx) => (
                                        <div key={idx} style={{ position: 'relative' }}>
                                            <img src={url} alt={`Gallery ${idx}`} style={{ height: '60px', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
                                            <button type="button" onClick={() => removeStaffMultiImage('gallery_urls', idx, !!editingStaff)} style={{ position: 'absolute', top: -5, right: -5, background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label">Past Saloons (Comma separated)</label>
                            <input type="text" value={editingStaff ? (Array.isArray(editingStaff.past_saloons) ? editingStaff.past_saloons.join(', ') : editingStaff.past_saloons) : staffForm.past_saloons} onChange={(e) => editingStaff ? setEditingStaff({...editingStaff, past_saloons: e.target.value}) : setStaffForm({...staffForm, past_saloons: e.target.value})} className="form-input" placeholder="The Vintage Barbershop, Elite Cutz" />
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label">Profile Image</label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input type="file" accept="image/*" onChange={(e) => handleStaffImageUpload(e, !!editingStaff)} style={{ fontSize: '13px' }} disabled={uploadingImage} />
                                {uploadingImage && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Uploading...</span>}
                            </div>
                            {(editingStaff ? editingStaff.image_url : staffForm.image_url) && (
                                <div style={{ marginTop: '10px' }}>
                                    <img src={editingStaff ? editingStaff.image_url : staffForm.image_url} alt="Preview" style={{ height: '60px', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
                                </div>
                            )}
                        </div>

                        <div className="responsive-form" style={{ marginTop: '32px' }}>
                            <button type="button" onClick={() => { setShowStaffModal(false); setEditingStaff(null); }} className="premium-btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                            <button type="submit" disabled={uploadingImage} className="premium-btn btn-primary" style={{ flex: 2 }}>
                                {editingStaff ? 'Save Changes' : 'Create Barber'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* EDIT SERVICE MODAL */}
            {editingService && (
                <div className="modal-overlay">
                    <form onSubmit={handleUpdateService} className="modal-content">
                        <h2 className="section-title" style={{ fontSize: '24px', marginBottom: '24px' }}>Edit Service</h2>
                        <div className="form-group">
                            <label className="form-label">Name</label>
                            <input type="text" value={editingService.name} onChange={(e) => setEditingService({...editingService, name: e.target.value})} className="form-input" required />
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Price (₹)</label>
                                <input type="number" value={editingService.price} onChange={(e) => setEditingService({...editingService, price: e.target.value})} className="form-input" required />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Avg Time (mins)</label>
                                <input type="number" value={editingService.avg_time} onChange={(e) => setEditingService({...editingService, avg_time: e.target.value})} className="form-input" required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Global Type</label>
                            <select 
                                value={editingService.service_type_id || ''} 
                                onChange={(e) => setEditingService({...editingService, service_type_id: e.target.value})} 
                                className="form-input"
                                style={{ background: '#FFF', color: '#000' }}
                            >
                                <option value="">None (Generic)</option>
                                {serviceTypes.map(type => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Service Image URL</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input type="text" value={editingService.image_url || ''} onChange={(e) => setEditingService({...editingService, image_url: e.target.value})} className="form-input" placeholder="https://..." style={{ flex: 1 }} />
                                <div style={{ position: 'relative', width: '48px', height: '48px', background: 'var(--glass-bg)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    📷
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            setUploadingImage(true);
                                            const url = await uploadImage(file, 'images', `services/${currentShopId}`);
                                            setEditingService(prev => ({ ...prev, image_url: url }));
                                            setUploadingImage(false);
                                        }}
                                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="responsive-form" style={{ marginTop: '32px' }}>
                            <button type="button" onClick={() => setEditingService(null)} className="premium-btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                            <button type="submit" className="premium-btn btn-primary" style={{ flex: 2 }}>Save Changes</button>
                        </div>
                    </form>
                </div>
            )}

            {/* EDIT PRODUCT MODAL */}
            {editingProduct && (
                <div className="modal-overlay">
                    <form onSubmit={handleUpdateProduct} className="modal-content">
                        <h2 className="section-title" style={{ fontSize: '24px', marginBottom: '24px' }}>Edit Product</h2>
                        <div className="form-group">
                            <label className="form-label">Name</label>
                            <input type="text" value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Price (₹)</label>
                            <input type="number" value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})} className="form-input" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Stock</label>
                            <input type="number" value={editingProduct.stock} onChange={(e) => setEditingProduct({...editingProduct, stock: e.target.value})} className="form-input" required />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <select 
                                value={editingProduct.category_id || ''} 
                                onChange={(e) => setEditingProduct({...editingProduct, category_id: e.target.value})} 
                                className="form-input"
                                style={{ background: '#FFF', color: '#000' }}
                            >
                                <option value="">Select Category</option>
                                {dbCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Product Image URL</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input type="text" value={editingProduct.image_url || ''} onChange={(e) => setEditingProduct({...editingProduct, image_url: e.target.value})} className="form-input" placeholder="https://..." style={{ flex: 1 }} />
                                <div style={{ position: 'relative', width: '48px', height: '48px', background: 'var(--glass-bg)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    📷
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            setUploadingImage(true);
                                            const url = await uploadImage(file, 'images', `products/${currentShopId}`);
                                            setEditingProduct(prev => ({ ...prev, image_url: url }));
                                            setUploadingImage(false);
                                        }}
                                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="responsive-form" style={{ marginTop: '32px' }}>
                            <button type="button" onClick={() => setEditingProduct(null)} className="premium-btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                            <button type="submit" className="premium-btn btn-primary" style={{ flex: 2 }}>Save Changes</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
