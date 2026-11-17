// src/components/components/MealLogger/MealSuccessModal.jsx

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Sparkles,
  X,
  Flame,
  Utensils,
  Plus,
  ArrowRight,
  TrendingUp,
  Award
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const MealSuccessModal = ({ isOpen, onClose, data, onLogAnother }) => {
  const navigate = useNavigate();

  if (!isOpen || !data) return null;

  const {
    items = [],
    totals = null,
    notifications = [],
    date = "",
    count = 1,
    isEdit = false,
  } = data;

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "Today";
    try {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleViewMealLog = () => {
    onClose();
    navigate("/dashboard/tools/meal-log");
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-lg bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* TOP ACCENT BAR */}
          <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-[var(--color-primary)] to-amber-500" />

          {/* HEADER */}
          <div className="px-6 pt-5 pb-3 flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-inner shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                    {isEdit ? "Meal Updated!" : "Meal Logged Successfully!"}
                  </h3>
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                </div>
                <p className="text-xs font-medium text-[var(--color-text-muted)] mt-0.5">
                  {count} {count === 1 ? "item" : "items"} recorded for {formatDateDisplay(date)}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] hover:bg-[var(--color-bg-app)] border border-transparent hover:border-[var(--color-border-default)] transition-all"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* NOTIFICATIONS BANNER (IF ANY TARGET MET) */}
          {notifications && notifications.length > 0 && (
            <div className="mx-6 my-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-emerald-800">
              <Award className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notifications.join(" • ")}</span>
            </div>
          )}

          {/* SCROLLABLE CONTENT */}
          <div className="px-6 py-2 overflow-y-auto space-y-4 max-h-[55vh]">
            {/* LOGGED MEAL ITEMS */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Logged Items
              </p>

              <div className="space-y-2.5">
                {items.map((item, idx) => {
                  const calories = item.calories ? Math.round(Number(item.calories)) : null;
                  const protein = item.protein ? Number(item.protein).toFixed(1) : null;
                  const carbs = item.carbs ? Number(item.carbs).toFixed(1) : null;
                  const fats = item.fats ? Number(item.fats).toFixed(1) : null;

                  return (
                    <div
                      key={item.id || idx}
                      className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] hover:border-[var(--color-primary)]/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm text-[var(--color-text-strong)] truncate">
                            {item.food_name || item.name || "Meal Item"}
                          </h4>
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                            {item.quantity} {item.unit || "Serving"}{" "}
                            {item.portion_size && item.portion_size !== "Medium" ? `(${item.portion_size})` : ""}
                          </p>
                        </div>

                        {item.meal_type && (
                          <span className="shrink-0 px-2 py-0.5 text-[11px] font-semibold rounded-lg bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary-dark)] border border-[var(--color-primary-light)]/30">
                            {item.meal_type}
                          </span>
                        )}
                      </div>

                      {/* NUTRITION MACROS CHIPS IF AVAILABLE */}
                      {(calories !== null || protein !== null || carbs !== null || fats !== null) && (
                        <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-2 border-t border-[var(--color-border-default)]/60 text-[11px]">
                          {calories !== null && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                              <Flame className="w-3 h-3 text-amber-500" />
                              {calories} kcal
                            </span>
                          )}
                          {carbs !== null && (
                            <span className="text-[var(--color-text-muted)] font-medium">
                              Carbs: <strong className="text-[var(--color-text-strong)]">{carbs}g</strong>
                            </span>
                          )}
                          {protein !== null && (
                            <span className="text-[var(--color-text-muted)] font-medium">
                              Protein: <strong className="text-[var(--color-text-strong)]">{protein}g</strong>
                            </span>
                          )}
                          {fats !== null && (
                            <span className="text-[var(--color-text-muted)] font-medium">
                              Fat: <strong className="text-[var(--color-text-strong)]">{fats}g</strong>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TODAY'S TOTALS SUMMARY (IF AVAILABLE) */}
            {totals && (totals.total_calories > 0 || totals.total_protein > 0) && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/60 to-orange-50/40 border border-amber-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                    Today's Cumulative Intake
                  </span>
                  <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                    {Math.round(totals.total_calories || 0)} kcal
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-white/80 p-2 rounded-xl border border-amber-100">
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">Protein</p>
                    <p className="font-bold text-[var(--color-text-strong)] mt-0.5">
                      {Math.round(totals.total_protein || 0)}g
                    </p>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl border border-amber-100">
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">Carbs</p>
                    <p className="font-bold text-[var(--color-text-strong)] mt-0.5">
                      {Math.round(totals.total_carbs || 0)}g
                    </p>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl border border-amber-100">
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-semibold">Fats</p>
                    <p className="font-bold text-[var(--color-text-strong)] mt-0.5">
                      {Math.round(totals.total_fats || 0)}g
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="px-6 py-4 border-t-2 border-[var(--color-border-default)] bg-[var(--color-bg-app)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleViewMealLog}
              className="w-full sm:w-auto text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] flex items-center justify-center gap-1.5 transition-colors"
            >
              View Full History <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <div className="w-full sm:w-auto flex items-center gap-2">
              {onLogAnother && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogAnother();
                  }}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-interactive-subtle)] text-xs font-semibold text-[var(--color-text-strong)] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Log Another
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-semibold flex items-center justify-center shadow-md transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MealSuccessModal;
