'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

interface SuccessAnimationProps {
  onComplete?: () => void;
}

export function SuccessAnimation({ onComplete }: SuccessAnimationProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(true);
    }, 500);

    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Generate confetti particles
  const confettiParticles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100 - 50,
    y: Math.random() * -100 - 50,
    rotation: Math.random() * 360,
    scale: Math.random() * 0.5 + 0.5,
    color: i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#00ff88' : '#ffffff'
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      {/* Success Circle */}
      <motion.div
        className="relative"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 10, stiffness: 100 }}
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-pirelli-yellow to-success"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.2, 0.5]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        
        {/* Main circle */}
        <motion.div
          className="relative w-32 h-32 rounded-full bg-gradient-to-br from-pirelli-yellow to-yellow-600 shadow-2xl shadow-pirelli-yellow/50 flex items-center justify-center"
          animate={{ 
            rotate: [0, 360],
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: 'spring', damping: 10 }}
          >
            <Check className="w-16 h-16 text-black" strokeWidth={3} />
          </motion.div>
        </motion.div>

        {/* Sparkles */}
        <motion.div
          className="absolute -top-6 -right-6"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <Sparkles className="w-8 h-8 text-pirelli-yellow" />
        </motion.div>
      </motion.div>

      {/* Success Text */}
      <motion.div
        className="absolute bottom-1/3 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-3xl font-bold text-white mb-2">¡Cotización Enviada!</h2>
        <p className="text-text-secondary">Te contactaremos en las próximas 24 horas</p>
      </motion.div>

      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confettiParticles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute top-1/2 left-1/2 w-2 h-2"
              style={{
                backgroundColor: particle.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '0%'
              }}
              initial={{ 
                x: 0,
                y: 0,
                opacity: 1,
                scale: 0
              }}
              animate={{ 
                x: particle.x * 5,
                y: particle.y * 5,
                opacity: 0,
                scale: particle.scale,
                rotate: particle.rotation
              }}
              transition={{ 
                duration: 2,
                ease: 'easeOut'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}