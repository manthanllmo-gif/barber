import { motion } from 'framer-motion';

const Preloader = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#000000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px'
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 1.2, 
          ease: "backOut",
          repeat: Infinity,
          repeatType: "reverse"
        }}
        style={{ width: '150px', height: '150px' }}
      >
        <img 
          src="/logo-black.png" 
          alt="TrimTimes Logo" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
      </motion.div>
      
      <div style={{ textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          style={{
            fontSize: '2.2rem',
            fontWeight: '600',
            color: '#FFFFFF',
            fontFamily: "'Bodoni Moda', serif",
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}
        >
          TrimTimes<span style={{ color: '#276EF1' }}>.</span>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.8, duration: 1 }}
          style={{
            fontSize: '0.8rem',
            fontWeight: '500',
            color: '#FFFFFF',
            fontFamily: "'Inter', sans-serif",
            letterSpacing: '4px',
            marginTop: '8px',
            textTransform: 'uppercase'
          }}
        >
          Style In Time
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Preloader;
