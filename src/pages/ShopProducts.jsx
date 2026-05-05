import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useShop } from '../contexts/ShopContext';
import { useCart } from '../contexts/CartContext';

const ShopProducts = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { products, productCategories, loading: productsLoading } = useShop();
    const { addToCart, getCartCount } = useCart();
    
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'price-low', 'price-high', 'name'
    const [selectedProduct, setSelectedProduct] = useState(null);
    const categoryFilter = searchParams.get('category') || '';

    const filteredAndSortedProducts = useMemo(() => {
        let result = [...products];

        // Filter by category
        if (categoryFilter) {
            result = result.filter(p => p.category_name === categoryFilter);
        }

        // Sort
        result.sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
            if (sortBy === 'price-low') return a.price - b.price;
            if (sortBy === 'price-high') return b.price - a.price;
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return 0;
        });

        return result;
    }, [products, categoryFilter, sortBy]);

    const handleCategoryToggle = (cat) => {
        if (categoryFilter === cat) {
            searchParams.delete('category');
        } else {
            searchParams.set('category', cat);
        }
        setSearchParams(searchParams);
    };

    return (
        <div style={{ padding: '24px', paddingTop: '80px', marginTop: '0px', paddingBottom: '100px', minHeight: '100vh', background: '#FFFFFF' }}>
            {/* Premium Header */}
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: '#F6F6F6',
                    border: '1px solid #EEEEEE',
                    borderRadius: '28px',
                    padding: '32px',
                    marginBottom: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px'
                }}
            >
                <motion.button 
                    whileHover={{ scale: 1.05, background: '#000', color: '#FFF' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/')}
                    style={{ 
                        background: '#FFF', 
                        border: 'none', 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: 'pointer',
                        color: '#000',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                    </svg>
                </motion.button>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h1 style={{ fontSize: '1.2rem', fontWeight: '950', letterSpacing: '-0.5px', margin: 0, color: '#000000' }}>Shop</h1>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(0, 0, 0, 0.4)', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', margin: 0 }}>Premium Gear</p>
                </div>
            </motion.div>

            {/* Category Filters (Sleeker Style) */}
            <div style={{ 
                display: 'flex', 
                gap: '8px', 
                overflowX: 'auto', 
                marginBottom: '32px', 
                paddingBottom: '8px',
                scrollbarWidth: 'none'
            }}>
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                        searchParams.delete('category');
                        setSearchParams(searchParams);
                    }}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '12px',
                        border: '1px solid',
                        borderColor: !categoryFilter ? '#000' : '#F0F0F0',
                        background: !categoryFilter ? '#000' : '#FFF',
                        color: !categoryFilter ? '#FFF' : '#000',
                        fontWeight: '800',
                        fontSize: '0.8rem',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: !categoryFilter ? '0 8px 16px rgba(0,0,0,0.08)' : '0 2px 6px rgba(0,0,0,0.01)'
                    }}
                >
                    All Items
                </motion.button>
                {productCategories.map(cat => {
                    const name = typeof cat === 'string' ? cat : cat.name;
                    const id = typeof cat === 'string' ? cat : cat.id;
                    const isActive = categoryFilter === name;
                    
                    return (
                        <motion.button
                            key={id}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleCategoryToggle(name)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '12px',
                                border: '1px solid',
                                borderColor: isActive ? '#000' : '#F0F0F0',
                                background: isActive ? '#000' : '#FFF',
                                color: isActive ? '#FFF' : '#000',
                                fontWeight: '800',
                                fontSize: '0.8rem',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: isActive ? '0 8px 16px rgba(0,0,0,0.08)' : '0 2px 6px rgba(0,0,0,0.01)'
                            }}
                        >
                            {name}
                        </motion.button>
                    );
                })}
            </div>

            {/* Brand Vision Cards - Compact */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '12px', 
                marginBottom: '32px' 
            }}>
                <motion.div
                    whileHover={{ y: -3 }}
                    style={{
                        padding: '20px',
                        background: '#FFF',
                        borderRadius: '24px',
                        border: '1px solid #F0F0F0',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                    }}
                >
                    <div style={{ position: 'absolute', top: '-5px', right: '-5px', fontSize: '2.5rem', opacity: 0.05, fontWeight: '900', color: '#000' }}>✦</div>
                    <span style={{ fontSize: '0.6rem', fontWeight: '900', color: '#AAA', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: '4px' }}>Selection</span>
                    <p style={{ fontSize: '0.9rem', fontWeight: '950', color: '#000', margin: 0, lineHeight: '1.1' }}>
                        Curated <span style={{ color: '#276EF1' }}>Elite</span> Gear
                    </p>
                </motion.div>

                <motion.div
                    whileHover={{ y: -3 }}
                    style={{
                        padding: '20px',
                        background: '#FFF',
                        borderRadius: '24px',
                        border: '1px solid #F0F0F0',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                    }}
                >
                    <div style={{ position: 'absolute', top: '-5px', right: '-5px', fontSize: '2.5rem', opacity: 0.05, fontWeight: '900', color: '#000' }}>🌿</div>
                    <span style={{ fontSize: '0.6rem', fontWeight: '900', color: '#AAA', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: '4px' }}>Ethics</span>
                    <p style={{ fontSize: '0.9rem', fontWeight: '950', color: '#000', margin: 0, lineHeight: '1.1' }}>
                        Clean & Organic
                    </p>
                </motion.div>
            </div>

            {/* Sorting - Minimal */}
            <div style={{ 
                marginBottom: '32px',
                background: '#FFF',
                padding: '8px 16px',
                borderRadius: '16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #F0F0F0',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}>
                <span style={{ fontSize: '0.65rem', fontWeight: '900', color: '#DDD', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sort:</span>
                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        fontWeight: '800',
                        fontSize: '0.85rem',
                        outline: 'none',
                        cursor: 'pointer',
                        color: '#000'
                    }}
                >
                    <option value="newest">Newest</option>
                    <option value="price-low">Price Low</option>
                    <option value="price-high">Price High</option>
                    <option value="name">Name</option>
                </select>
            </div>

            {/* Product Grid (Outline Shadow Cards) */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '24px' 
            }}>
                {filteredAndSortedProducts.map((product, i) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, type: 'spring', damping: 20 }}
                        whileHover={{ y: -8, boxShadow: '0 30px 60px rgba(0,0,0,0.06)' }}
                        style={{
                            background: '#FFFFFF',
                            borderRadius: '32px',
                            overflow: 'hidden',
                            border: '1px solid rgba(0,0,0,0.03)',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.02)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            cursor: 'pointer'
                        }}
                        onClick={() => setSelectedProduct(product)}
                    >
                        <div style={{ height: '180px', background: '#F9F9F9', position: 'relative', overflow: 'hidden' }}>
                            <img 
                                src={product.image_url || '/assets/sparkle.jpeg'} 
                                alt={product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{ 
                                position: 'absolute', 
                                top: '12px', 
                                right: '12px', 
                                background: '#FFFFFF', 
                                padding: '6px 12px', 
                                borderRadius: '12px',
                                fontWeight: '950',
                                fontSize: '0.85rem',
                                color: '#000',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                            }}>
                                ₹{product.price}
                            </div>
                        </div>
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '0.65rem', fontWeight: '900', color: '#276EF1', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>
                                {product.category_name}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                <h3 style={{ 
                                    fontSize: '0.95rem', 
                                    fontWeight: '950', 
                                    color: '#000', 
                                    margin: 0, 
                                    lineHeight: '1.2',
                                    flex: 1
                                }}>
                                    {product.name}
                                </h3>
                                <motion.button
                                    whileHover={{ scale: 1.1, background: '#000', color: '#FFF' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => addToCart(product)}
                                    style={{
                                        background: '#F6F6F6',
                                        border: 'none',
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        color: '#000',
                                        flexShrink: 0
                                    }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredAndSortedProducts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '24px' }}>✨</div>
                    <h3 style={{ fontWeight: '950', fontSize: '1.5rem', marginBottom: '12px' }}>Coming Soon</h3>
                    <p style={{ color: 'rgba(0,0,0,0.4)', fontWeight: '700' }}>We're curating the best products for you.</p>
                </div>
            )}
            {/* Product Detail Modal - Standardized with Home.jsx */}
            <AnimatePresence>
                {selectedProduct && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 3000,
                        display: 'flex',
                        alignItems: window.innerWidth < 768 ? 'flex-end' : 'center',
                        justifyContent: 'center',
                        padding: window.innerWidth < 768 ? '0' : '20px'
                    }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProduct(null)}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.8)',
                                backdropFilter: 'blur(10px)'
                            }}
                        />
                        <motion.div
                            initial={window.innerWidth < 768 ? { y: '100%' } : { opacity: 0, scale: 0.9, y: 20 }}
                            animate={window.innerWidth < 768 ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
                            exit={window.innerWidth < 768 ? { y: '100%' } : { opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            style={{
                                position: 'relative',
                                width: '100%',
                                maxWidth: window.innerWidth < 768 ? '100%' : '900px',
                                background: '#FFFFFF',
                                borderRadius: window.innerWidth < 768 ? '32px 32px 0 0' : '32px',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                                boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
                                maxHeight: window.innerWidth < 768 ? '90vh' : 'auto'
                            }}
                        >
                            <button 
                                onClick={() => setSelectedProduct(null)}
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.05)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    zIndex: 10,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.2rem',
                                    fontWeight: '800'
                                }}
                            >✕</button>

                            <div style={{ 
                                flex: 1, 
                                background: '#F9F9F9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: window.innerWidth < 768 ? '24px' : '40px',
                                position: 'relative',
                                height: window.innerWidth < 768 ? '300px' : 'auto'
                            }}>
                                <img 
                                    src={selectedProduct.image_url || '/assets/sparkle.jpeg'} 
                                    alt={selectedProduct.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '16px' }}
                                />
                            </div>

                            <div style={{ 
                                flex: 1, 
                                padding: window.innerWidth < 768 ? '24px 24px 40px' : '40px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}>
                                <div style={{ color: '#276EF1', fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>
                                    {selectedProduct.category_name || 'Premium Essential'}
                                </div>
                                <h2 style={{ fontSize: window.innerWidth < 768 ? '1.5rem' : '2rem', fontWeight: '900', color: '#000', marginBottom: '12px', lineHeight: '1.1' }}>
                                    {selectedProduct.name}
                                </h2>
                                <div style={{ fontSize: window.innerWidth < 768 ? '1.8rem' : '2.5rem', fontWeight: '900', color: '#000', marginBottom: '16px' }}>
                                    ₹{selectedProduct.price}
                                </div>
                                <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '24px', fontWeight: '500', opacity: 0.8 }}>
                                    {selectedProduct.description || 'Elevate your grooming routine with this professional-grade essential.'}
                                </p>

                                <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', gap: '12px' }}>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            addToCart(selectedProduct);
                                            setSelectedProduct(null);
                                        }}
                                        style={{
                                            flex: 1,
                                            background: '#f5f5f5',
                                            color: '#000',
                                            border: 'none',
                                            padding: '16px',
                                            borderRadius: '14px',
                                            fontWeight: '800',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            order: window.innerWidth < 768 ? 2 : 1
                                        }}
                                    >
                                        ADD TO CART
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            addToCart(selectedProduct, false);
                                            navigate('/checkout');
                                        }}
                                        style={{
                                            flex: 1,
                                            background: '#276EF1',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '16px',
                                            borderRadius: '14px',
                                            fontWeight: '800',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            order: window.innerWidth < 768 ? 1 : 2
                                        }}
                                    >
                                        BUY NOW
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ShopProducts;
