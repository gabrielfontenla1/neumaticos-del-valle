'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  number: number;
}

interface ModernStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (index: number) => void;
}

export function ModernStepper({ steps, currentStep, onStepClick }: ModernStepperProps) {
  return (
    <div className="w-full px-8 sm:px-20 lg:px-32 py-8">
      <div className="relative w-full max-w-4xl mx-auto">
        {/* Container for stepper */}
        <div className="relative">
          {/* Background line - positioned to connect center of circles */}
          <div 
            className="absolute h-1 bg-[#2a2a2a]"
            style={{
              top: '28px',
              left: '30px',
              right: '30px'
            }}
          />
          
          {/* Progress line - yellow line that fills as you progress */}
          <div 
            className="absolute h-1 bg-pirelli-yellow transition-all duration-700 ease-out"
            style={{ 
              top: '28px',
              left: '30px',
              width: currentStep === 0 ? '0%' : `calc((${currentStep} / ${steps.length - 1}) * (100% - 60px))`
            }}
          />
          
          {/* Steps container - Using Grid for perfect alignment */}
          <div className="relative grid grid-cols-4 gap-0">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              const isClickable = index <= currentStep && onStepClick;
              
              return (
                <div key={step.id} className="flex flex-col items-center justify-start">
                  {/* Step Circle - Larger size (60px on desktop, 50px on mobile) */}
                  <button
                    onClick={() => isClickable && onStepClick?.(index)}
                    disabled={!isClickable}
                    className={cn(
                      "relative z-10 flex items-center justify-center w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] rounded-full border-[3px] transition-all duration-300",
                      // Completed state - yellow background with check
                      isCompleted && "bg-pirelli-yellow border-pirelli-yellow",
                      // Active state - yellow border, black background
                      isActive && "bg-black border-pirelli-yellow shadow-xl shadow-pirelli-yellow/30",
                      // Inactive state - gray border, black background  
                      !isCompleted && !isActive && "bg-black border-[#3a3a3a]",
                      // Clickable state
                      isClickable && "cursor-pointer hover:scale-110"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-7 h-7 sm:w-8 sm:h-8 text-black" strokeWidth={4} />
                    ) : (
                      <span className={cn(
                        "text-xl sm:text-2xl font-bold",
                        isActive ? "text-pirelli-yellow" : "text-[#6a6a6a]"
                      )}>
                        {step.number}
                      </span>
                    )}
                  </button>
                  
                  {/* Step Label - Perfectly centered below circle */}
                  <div className="mt-5 text-center w-full">
                    <span className={cn(
                      "block text-xs sm:text-sm font-medium transition-colors duration-300 tracking-wide",
                      isCompleted ? "text-white" : 
                      isActive ? "text-white" : "text-[#6a6a6a]"
                    )}>
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}