import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const slides = [
  {
    title: "The Vision",
    description: "Eliminating the wait. Elevating your comfort. Reclaiming your time through a seamless grooming experience.",
    image: "/assets/image1.webp",
    accent: "#276EF1"
  },
  {
    title: "Precision Waiting",
    description: "Live queues and high-accuracy timer estimates for total clarity.",
    image: "/assets/pitch/dashboard.png",
    accent: "#05A357"
  },
  {
    title: "Best Barbers and Saloons",
    description: "Browse master profiles and choose the specialist that fits your style.",
    image: "/assets/salman.jpeg",
    accent: "#EE4035"
  },
  {
    title: "Fair Lines & Flexible",
    description: "Zero VIP bias. Enjoy a 30-minute grace period for late arrivals.",
    image: "/assets/image4.jpg",
    accent: "#8E44AD"
  },
  {
    title: "We Style You In Time",
    description: "Our Promise: Absolute precision, total transparency, and a grooming experience that values every second of your journey. Let's redefine your time.",
    image: "/assets/sparkle.jpeg",
    accent: "#34495E"
  }
];

const Onboarding = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const completeOnboarding = () => {
    if (onComplete) {
      onComplete();
    } else {
      localStorage.setItem('onboarding_complete', 'true');
    }
    navigate('/', { replace: true });
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection) => {
    if (newDirection === 1) handleNext();
    else handlePrev();
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: '#000000',
      color: '#FFFFFF',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.5 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);
            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-currentSlide > 0 ? -1 : 0);
            }
          }}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '40px',
            textAlign: 'center',
            position: 'relative'
          }}
        >
          <div style={{
            width: '280px',
            height: '280px',
            borderRadius: '40px',
            overflow: 'hidden',
            marginBottom: '40px',
            boxShadow: `0 20px 40px ${slides[currentSlide].accent}33`,
            border: `1px solid ${slides[currentSlide].accent}44`
          }}>
            <img
              src={slides[currentSlide].image}
              alt={slides[currentSlide].title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              fontFamily: "'Bodoni Moda', serif",
              marginBottom: '20px',
              color: slides[currentSlide].accent
            }}
          >
            {slides[currentSlide].title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: '1.1rem',
              lineHeight: '1.6',
              color: 'rgba(255,255,255,0.7)',
              maxWidth: '400px',
              fontFamily: "'Inter', sans-serif"
            }}
          >
            {slides[currentSlide].description}
          </motion.p>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls */}
      <div style={{
        padding: '40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'linear-gradient(to top, #000 0%, transparent 100%)'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {slides.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === currentSlide ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: i === currentSlide ? slides[currentSlide].accent : 'rgba(255,255,255,0.2)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          {currentSlide > 0 && (
            <button
              onClick={handlePrev}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#FFF',
                padding: '16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '1.2rem'
              }}
            >
              ←
            </button>
          )}

          <button
            onClick={handleNext}
            style={{
              background: slides[currentSlide].accent,
              border: 'none',
              color: '#FFF',
              padding: '16px 32px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease'
            }}
          >
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'} ➜
          </button>
        </div>
      </div>

      {/* Skip Button */}
      <button
        onClick={completeOnboarding}
        style={{
          position: 'absolute',
          top: '40px',
          right: '40px',
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.4)',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        Skip
      </button>
    </div>
  );
};

export default Onboarding;
