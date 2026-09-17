import React, { useState } from "react";
import { Bot, Salad, Zap, X, MessageSquare } from "lucide-react"; // MessageSquare icon added
import { motion, AnimatePresence } from "framer-motion";

// The component now accepts an `onOpenChat` prop
const QuickTools = ({ onOpenAssistant, onOpenNutrition, onOpenChat, userRole }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Animation variants for the container to stagger the children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  // Animation variants for each individual tool item
  const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 20 },
    },
    exit: {
      opacity: 0,
      y: 15,
      scale: 0.9,
    }
  };

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-50 font-[var(--font-secondary)]">
      <div className="relative group flex items-center">
        {/* Tooltip that appears on hover */}
        <div className="hidden sm:block absolute right-full mr-3 px-3 py-1.5 bg-[var(--color-bg-surface)] text-[var(--color-text-strong)] text-xs font-semibold rounded-xl shadow-lg border border-[var(--color-border-default)] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-300">
          Quick Toolbox
        </div>

        <div className="relative">
          {/* Options Panel that appears on click */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 bottom-full mb-3 space-y-2.5 min-w-[200px]"
              >
                {/* Smart Assistant Button */}
                <motion.button
                  variants={itemVariants}
                  onClick={() => {
                    onOpenAssistant();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 w-full p-3 bg-[var(--color-bg-surface)] rounded-2xl shadow-xl border-2 border-[var(--color-border-default)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-bg-subtle)] text-[var(--color-text-strong)] font-semibold transition-all duration-200 transform hover:-translate-x-1"
                >
                  <span className="p-2 rounded-xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)]">
                    <Bot size={18} />
                  </span>
                  <span className="text-sm font-[var(--font-primary)]">Smart Assistant</span>
                </motion.button>

                {/* Nutrition Search Button */}
                <motion.button
                  variants={itemVariants}
                  onClick={() => {
                    onOpenNutrition();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 w-full p-3 bg-[var(--color-bg-surface)] rounded-2xl shadow-xl border-2 border-[var(--color-border-default)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-bg-subtle)] text-[var(--color-text-strong)] font-semibold transition-all duration-200 transform hover:-translate-x-1"
                >
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                    <Salad size={18} />
                  </span>
                  <span className="text-sm font-[var(--font-primary)]">Nutrition Search</span>
                </motion.button>

                {/* Quick Messages / Chat Button */}
                <motion.button
                  variants={itemVariants}
                  onClick={() => {
                    onOpenChat();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 w-full p-3 bg-[var(--color-bg-surface)] rounded-2xl shadow-xl border-2 border-[var(--color-border-default)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-bg-subtle)] text-[var(--color-text-strong)] font-semibold transition-all duration-200 transform hover:-translate-x-1"
                >
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                    <MessageSquare size={18} />
                  </span>
                  <span className="text-sm font-[var(--font-primary)]">
                    {userRole === "nutritionist" ? "Quick Patient Messages" : "Chat with Nutritionist"}
                  </span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Quick Tools Button */}
          <motion.button
            onClick={() => setIsOpen((prev) => !prev)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-on-primary)] w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-2xl flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/30 transition-colors"
            aria-label="Toggle Quick Tools"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={isOpen ? "close" : "open"}
                initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {isOpen ? <X size={26} /> : <Zap size={26} />}
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default QuickTools;