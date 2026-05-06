import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ShopsManagement from './ShopsManagement';
import AdminAnalytics from './AdminAnalytics';
import AdminOrders from '../components/admin/AdminOrders';
import AdminStaff from '../components/admin/AdminStaff';
import AdminCategories from '../components/admin/AdminCategories';
import AdminServices from '../components/admin/AdminServices';

/* ─── Sidebar / tab navigation style ─── */
const NAV_ITEMS = [
    { id: 'shops', label: '🏪 Shops', component: ShopsManagement },
    { id: 'staff', label: '💈 Staff/Barbers', component: AdminStaff },
    { id: 'services', label: '💇 Services', component: AdminServices },
    { id: 'orders', label: '📦 Orders', component: AdminOrders },
    { id: 'categories', label: '📂 Categories', component: AdminCategories },
    { id: 'analytics', label: '📊 Analytics', component: () => <AdminAnalytics /> },
];

const S = {
    shell: { display: 'flex', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: 'var(--background)' },
    sidebar: (isOpen) => ({
        width: '220px', backgroundColor: '#1a1a2e', color: '#ccc', padding: '24px 0',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        transition: 'all 0.3s ease',
        zIndex: 1000,
    }),
    sidebarBrand: { padding: '0 20px 24px', fontSize: '18px', fontWeight: 700, color: '#fff', borderBottom: '1px solid #2d2d4e' },
    sidebarBrandSub: { fontSize: '11px', color: '#999', fontWeight: 400, marginTop: '2px', display: 'block' },
    navItem: (active) => ({
        display: 'block', padding: '12px 22px', cursor: 'pointer', fontSize: '14px',
        fontWeight: active ? 600 : 400,
        backgroundColor: active ? '#673ab7' : 'transparent',
        color: active ? '#fff' : '#efefef',
        borderLeft: active ? '3px solid #b39ddb' : '3px solid transparent',
        transition: 'all 0.18s',
    }),
    sidebarFooter: { marginTop: 'auto', padding: '16px 22px' },
    logoutBtn: {
        width: '100%', padding: '10px 0', backgroundColor: 'var(--surface)', color: 'var(--text-main)',
        border: '1px solid var(--border)', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
    },
    content: { flex: 1, overflow: 'auto', minWidth: 0 },
    topBar: {
        backgroundColor: '#fff', borderBottom: '1px solid #eee', padding: '14px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        position: 'sticky', top: 0, zIndex: 900,
    },
    topBarTitle: { fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' },
    topBarUser: { fontSize: '13px', color: 'var(--text-main)' },
    hamburger: {
        background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: '4px',
        display: 'none', // Hidden on desktop
    }
};

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('shops');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const ActiveComponent = NAV_ITEMS.find(n => n.id === activeTab)?.component;

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div style={S.shell}>
            <style>{`
                @media (max-width: 768px) {
                    .admin-sidebar {
                        position: fixed !important;
                        left: -220px !important;
                        top: 0;
                        bottom: 0;
                    }
                    .admin-sidebar.open {
                        left: 0 !important;
                        box-shadow: 10px 0 20px rgba(0,0,0,0.2);
                    }
                    .admin-hamburger {
                        display: flex !important;
                    }
                    .admin-topbar {
                        padding: 14px 16px !important;
                    }
                    .admin-user-email {
                        display: none;
                    }
                    .admin-overlay {
                        position: fixed;
                        inset: 0;
                        background: rgba(0,0,0,0.4);
                        z-index: 950;
                    }
                }
            `}</style>

            {/* Sidebar Overlay (Mobile) */}
            {isSidebarOpen && (
                <div className="admin-overlay" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* ── Sidebar ── */}
            <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`} style={S.sidebar(isSidebarOpen)}>
                <div style={{ padding: '0 20px', marginBottom: '12px', marginTop: '12px' }}>
                    <button style={S.logoutBtn} onClick={logout}>
                        ⬅ Logout
                    </button>
                </div>

                <div style={S.sidebarBrand}>
                    🛎️ TrimTimes Admin
                    <span style={S.sidebarBrandSub}>Super Admin Panel</span>
                </div>

                <nav style={{ marginTop: '12px' }}>
                    {NAV_ITEMS.map(item => (
                        <div
                            key={item.id}
                            style={S.navItem(activeTab === item.id)}
                            onClick={() => {
                                setActiveTab(item.id);
                                setIsSidebarOpen(false); // Close on mobile after click
                            }}
                        >
                            {item.label}
                        </div>
                    ))}
                </nav>

                {/* Removed Footer Logout */}
            </aside>

            {/* ── Main content ── */}
            <main style={S.content}>
                {/* Mobile Hamburger Button (Floating since TopBar is removed) */}
                <button 
                    className="admin-hamburger" 
                    style={{
                        position: 'fixed',
                        top: '16px',
                        left: '16px',
                        zIndex: 900,
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: '#1a1a2e',
                        color: '#fff',
                        border: 'none',
                        fontSize: '24px',
                        display: 'none', // Controlled by CSS media query
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        cursor: 'pointer'
                    }}
                    onClick={toggleSidebar}
                >
                    ☰
                </button>

                <div style={{ position: 'relative' }}>
                    {ActiveComponent ? <ActiveComponent /> : (
                        <div style={{ padding: '40px', color: 'var(--text-muted)', textAlign: 'center' }}>
                            🚧 This section is coming soon.
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;

