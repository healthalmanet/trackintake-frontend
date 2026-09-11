// src/components/NutritionPopup.jsx
import React from "react";
import { X, Salad } from "lucide-react"; // Added Salad for a nice touch
import NutritionSearch from "../../../pages/dashboard/Tools/NutritionSearch";
import { motion, AnimatePresence } from "framer-motion";

const NutritionPopup = ({ onClose, isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-[var(--color-bg-backdrop)] backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Popup Panel */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[90vw] sm:max-w-md h-[85vh] max-h-[620px] z-50 bg-[var(--color-bg-surface)] rounded-3xl border-2 border-[var(--color-border-default)] shadow-2xl flex flex-col overflow-hidden font-[var(--font-secondary)]"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3.5 border-b-2 border-[var(--color-border-default)] bg-[var(--color-bg-app)] flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[var(--color-primary)] bg-[var(--color-primary-bg-subtle)] p-2 rounded-xl">
                    <Salad className="w-5 h-5" />
                </span>
                <h2 className="font-bold font-[var(--font-primary)] text-[var(--color-text-strong)] text-base sm:text-lg">
                  Nutrition Search
                </h2>
              </div>
              <button 
                onClick={onClose} 
                className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg-interactive-subtle)] hover:text-[var(--color-text-strong)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body with Custom Scrollbar */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
              <NutritionSearch isPopup={true} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NutritionPopup;