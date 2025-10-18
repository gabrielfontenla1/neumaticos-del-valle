'use client';

import { motion } from 'framer-motion';
import { CheckCircle, RefreshCw } from 'lucide-react';

interface SuccessStateProps {
  quotationId: string;
  onNewQuote: () => void;
}

export function SuccessState({ quotationId, onNewQuote }: SuccessStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto text-center py-20"
    >
      {/* Pirelli Logo Animation */}
      <motion.div
        initial={{ rotate: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="inline-block mb-8"
      >
        <div className="text-6xl font-bold text-pirelli-yellow">PIRELLI</div>
      </motion.div>

      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.3 
        }}
        className="inline-flex items-center justify-center w-24 h-24 bg-green-500/20 rounded-full mb-8"
      >
        <CheckCircle className="w-12 h-12 text-green-500" />
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-3xl font-bold mb-4">Quotation Submitted Successfully!</h2>
        <p className="text-lg text-muted mb-2">
          Thank you for choosing Pirelli tires.
        </p>
        <p className="text-muted mb-8">
          Your quotation has been received and our sales team will contact you shortly.
        </p>
        
        {/* Quotation ID */}
        <div className="bg-card-bg border-2 border-card-border rounded-xl p-6 mb-8">
          <p className="text-sm text-muted mb-2">Your Quotation Reference:</p>
          <p className="text-2xl font-bold text-pirelli-yellow">{quotationId}</p>
          <p className="text-sm text-muted mt-2">
            Please save this reference for your records
          </p>
        </div>

        {/* What's Next */}
        <div className="bg-pirelli-yellow/10 border border-pirelli-yellow/30 rounded-xl p-6 mb-8 text-left">
          <h3 className="font-semibold mb-3">What happens next?</h3>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-start gap-2">
              <span className="text-pirelli-yellow mt-0.5">•</span>
              <span>Our sales team will review your quotation within 24 hours</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pirelli-yellow mt-0.5">•</span>
              <span>You'll receive a confirmation email with full details</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pirelli-yellow mt-0.5">•</span>
              <span>A specialist will contact you to finalize your order</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-pirelli-yellow mt-0.5">•</span>
              <span>Installation can be scheduled at your convenience</span>
            </li>
          </ul>
        </div>

        {/* New Quote Button */}
        <motion.button
          onClick={onNewQuote}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 px-8 py-4 bg-pirelli-yellow text-black font-semibold text-lg rounded-lg hover:bg-pirelli-yellow/90 shadow-lg shadow-pirelli-yellow/30 transition-all"
        >
          <RefreshCw className="w-5 h-5" />
          Create New Quotation
        </motion.button>
      </motion.div>
    </motion.div>
  );
}