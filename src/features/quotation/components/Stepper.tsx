'use client';

import { motion } from 'framer-motion';
import { Check, Car, Package, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: string;
  label: string;
  icon?: React.ElementType;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (index: number) => void;
}

const defaultIcons = [Car, Package, Package, FileText];

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <div className="w-full bg-black border-b border-light-gray">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between relative">
          {/* Progress line background */}
          <div className="absolute top-8 left-0 right-0 h-[2px] bg-light-gray" />
          
          {/* Animated progress line */}
          <motion.div
            className="absolute top-8 left-0 h-[2px] bg-pirelli-yellow z-10"
            initial={{ width: '0%' }}
            animate={{ 
              width: `${(currentStep / (steps.length - 1)) * 100}%` 
            }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />

          {/* Steps */}
          <div className="flex items-center justify-between w-full relative z-20">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              const isClickable = index <= currentStep;
              const Icon = step.icon || defaultIcons[index];

              return (
                <button
                  key={step.id}
                  onClick={() => isClickable && onStepClick?.(index)}
                  disabled={!isClickable}
                  className={cn(
                    "flex flex-col items-center gap-2 transition-all duration-300",
                    isClickable && "cursor-pointer",
                    !isClickable && "cursor-not-allowed opacity-50"
                  )}
                >
                  {/* Step circle */}
                  <motion.div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                      "bg-black",
                      isActive && "border-pirelli-yellow scale-110",
                      isCompleted && "border-pirelli-yellow bg-pirelli-yellow",
                      !isActive && !isCompleted && "border-light-gray"
                    )}
                    whileHover={isClickable ? { scale: 1.05 } : {}}
                    whileTap={isClickable ? { scale: 0.95 } : {}}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-black" />
                    ) : (
                      <Icon className={cn(
                        "w-5 h-5",
                        isActive ? "text-pirelli-yellow" : "text-muted"
                      )} />
                    )}
                  </motion.div>

                  {/* Step label */}
                  <span className={cn(
                    "text-xs font-medium transition-colors duration-300 whitespace-nowrap",
                    isActive && "text-pirelli-yellow",
                    isCompleted && "text-white",
                    !isActive && !isCompleted && "text-muted"
                  )}>
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}