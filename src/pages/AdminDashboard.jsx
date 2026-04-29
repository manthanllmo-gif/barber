import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ShopsManagement from './ShopsManagement';
import AdminAnalytics from './AdminAnalytics';
import AdminOrders from '../components/admin/AdminOrders';

/* ─── Sidebar / tab navigation style ─── */
const NAV_ITEMS = [
    { id: 'shops', label: '🏪 Shops', component: ShopsManagement },
    { id: 'orders', label: '📦 Orders', component: AdminOrders },
    { id: 'analytics', label: '📊 Analytics', component: () => <AdminAnalytics /> },
];

const S = {
    shell: { display: 'flex', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#f7f7fb' },
    sidebar: {
        width: '220px', backgroundColor: '#1a1a2e', color: '#ccc', padding: '24px 0',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
    },
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
        width: '100%', padding: '10px 0', backgroundColor: '#b71c1c', color: '#fff',
        border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
    },
    content: { flex: 1, overflow: 'auto' },
    topBar: {
        backgroundColor: '#fff', borderBottom: '1px solid #eee', padding: '14px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    },
    topBarTitle: { fontSize: '16px', fontWeight: 600, color: '#000000', margin: 0 },
    topBarUser: { fontSize: '13px', color: '#000000' },
};

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('shops');

    const ActiveComponent = NAV_ITEMS.find(n => n.id === activeTab)?.component;

    return (
        <div style={S.shell}>
            {/* ── Sidebar ── */}
            <aside style={S.sidebar}>
                <div style={S.sidebarBrand}>
                    🛎️ TokenQ Admin
                    <span style={S.sidebarBrandSub}>Super Admin Panel</span>
                </div>

                <nav style={{ marginTop: '12px' }}>
                    {NAV_ITEMS.map(item => (
                        <div
                            key={item.id}
                            style={S.navItem(activeTab === item.id)}
                            onClick={() => setActiveTab(item.id)}
                        >
                            {item.label}
                        </div>
                    ))}
                </nav>

                <div style={S.sidebarFooter}>
                    <button style={S.logoutBtn} onClick={logout}>
                        ⬅ Logout
                    </button>
                </div>
            </aside>

            {/* ── Main content ── */}
            <main style={S.content}>
                <header style={S.topBar}>
                    <p style={S.topBarTitle}>
                        {NAV_ITEMS.find(n => n.id === activeTab)?.label ?? 'Dashboard'}
                    </p>
                    <span style={S.topBarUser}>Logged in as: {user?.email}</span>
                </header>

                {ActiveComponent ? <ActiveComponent /> : (
                    <div style={{ padding: '40px', color: '#000000', textAlign: 'center' }}>
                        🚧 This section is coming soon.
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
