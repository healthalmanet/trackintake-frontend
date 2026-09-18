// src/components/layout/ModalWrapper.jsx

import React, { useEffect, useState } from "react";
import { X } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";

const ModalWrapper = ({ isOpen, onClose, children, size = 'md' }) => {
  const [isClosing, setIsClosing] = useState(false);

  // This logic handles the Escape key press for accessibility
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // This handles the exit animation before unmounting
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300); // Duration should match the exit animation
  };

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } },
  };
  
  const modalVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 25 } },
    exit: { opacity: 0, y: 50, scale: 0.95, transition: { duration: 0.2, ease: 'easeIn' } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={handleClose}
        >
          <motion.div
            variants={modalVariants}
            className={`relative w-full ${sizeClasses[size] || 'max-w-xl'} bg-[var(--color-bg-surface)] text-[var(--color-text-strong)] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] p-6 sm:p-8 max-h-[90vh] overflow-y-auto my-auto border border-[var(--color-border-default)] custom-scrollbar font-[var(--font-secondary)]`}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.button
              onClick={handleClose}
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-4 right-4 text-[var(--color-text-muted)] p-2 rounded-full hover:bg-[var(--color-bg-interactive-subtle)] hover:text-[var(--color-text-strong)] transition-all duration-200 cursor-pointer z-10"
              aria-label="Close modal"
            >
              <X size={20} />
            </motion.button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ModalWrapper;