// src/components/components/TrackMartPromo.jsx
import React from "react";
import { ExternalLink, Leaf, ShoppingBag, Sparkles, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

export const TRACKMART_URL = "https://trackmart-frontend-1erg.onrender.com/";

/**
 * Minimal & elegant TrackMart Organic Food Delivery ecosystem promo component.
 * Supports variants:
 * - "banner": Full-width sleek banner, ideal for /dashboard/meals
 * - "card": Compact card, ideal for /dashboard home feed
 * - "pill": Minimal inline chip/button for header or subtext
 */
const TrackMartPromo = ({ variant = "banner", className = "" }) => {
  if (variant === "card") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`relative overflow-hidden rounded-2xl border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-50/70 via-[var(--color-bg-surface)] to-emerald-100/30 p-5 shadow-sm hover:border-emerald-500/40 hover:shadow-md transition-all duration-300 ${className}`}
      >
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
            <Leaf size={12} className="text-emerald-600 animate-pulse" />
            <span>Organic Grocery Partner</span>
          </div>
          <span className="text-[10px] text-[var(--color-text-muted)] font-medium">TrackIntake Ecosystem</span>
        </div>

        <h3 className="text-base sm:text-lg font-bold font-[var(--font-primary)] text-[var(--color-text-strong)] flex items-center gap-2 mb-1">
          <span>TrackMart Fresh Organics</span>
          <Sparkles size={14} className="text-amber-500" />
        </h3>

        <p className="text-xs sm:text-sm text-[var(--color-text-default)] mb-4 leading-relaxed">
          Order 100% farm-fresh, chemical-free organic vegetables, fruits, whole grains, and healthy pantry staples delivered to your door.
        </p>

        <a
          href={TRACKMART_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          <ShoppingBag size={14} />
          <span>Shop Organic on TrackMart</span>
          <ArrowUpRight size={14} />
        </a>
      </motion.div>
    );
  }

  if (variant === "pill") {
    return (
      <a
        href={TRACKMART_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all duration-200 hover:scale-105 ${className}`}
      >
        <Leaf size={12} />
        <span>TrackMart Organics</span>
        <ExternalLink size={11} />
      </a>
    );
  }

  // Default "banner" variant - sleek, wide, high-conversion for Meals page
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative overflow-hidden rounded-2xl border-2 border-emerald-500/25 bg-gradient-to-r from-emerald-50/80 via-[var(--color-bg-surface)] to-emerald-100/40 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Leaf size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md">
                Ecosystem Partner
              </span>
              <span className="text-xs text-[var(--color-text-muted)] font-medium hidden sm:inline">
                TrackMart Delivery
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-bold font-[var(--font-primary)] text-[var(--color-text-strong)]">
              Need fresh ingredients for this meal plan?
            </h4>
            <p className="text-xs text-[var(--color-text-default)] mt-0.5 max-w-xl">
              Get 100% certified farm-to-table organic vegetables, ancient grains, and pantry staples delivered directly to you.
            </p>
          </div>
        </div>

        <a
          href={TRACKMART_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shrink-0 cursor-pointer self-start sm:self-auto"
        >
          <ShoppingBag size={15} />
          <span>Order on TrackMart</span>
          <ArrowUpRight size={14} />
        </a>
      </div>
    </motion.div>
  );
};

export default TrackMartPromo;
