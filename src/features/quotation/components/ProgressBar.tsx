'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  steps: Array<{
    number: number;
    title: string;
  }>;
}

export function ProgressBar({ currentStep, steps }: ProgressBarProps) {
  return (
    <div className="w-full py-8">
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-card-border" />
        <motion.div
          className="absolute top-5 left-0 h-0.5 bg-pirelli-yellow"
          initial={{ width: '0%' }}
          animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
        
        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center">
              <motion.div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                  transition-all duration-300 relative z-10
                  ${currentStep > step.number
                    ? 'bg-pirelli-yellow text-black'
                    : currentStep === step.number
                    ? 'bg-pirelli-yellow text-black scale-110 shadow-lg shadow-pirelli-yellow/30'
                    : 'bg-card-bg border-2 border-card-border text-muted'
                  }
                `}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {currentStep > step.number ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </motion.div>
              <span className={`
                mt-2 text-xs font-medium text-center max-w-[80px]
                ${currentStep >= step.number ? 'text-foreground' : 'text-muted'}
              `}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}