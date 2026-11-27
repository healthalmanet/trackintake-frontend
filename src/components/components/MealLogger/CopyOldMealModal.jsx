import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  X,
  Copy,
  Calendar,
  Check,
  CheckSquare,
  Square,
  Loader2,
  UtensilsCrossed,
  Flame,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getMealsByDate, getMeals } from "../../../api/mealLog";
import { formatMealPortion } from "./mealPortionUtils";

const MEAL_ORDER = [
  "Early-Morning",
  "Breakfast",
  "Mid-Morning Snack",
  "Lunch",
  "Afternoon Snack",
  "Dinner",
  "Bedtime",
];

const getLocalDateString = (date) => {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const getOffsetDateString = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return getLocalDateString(d);
};

const formatHumanDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const CopyOldMealModal = ({ isOpen, onClose, targetDate, onCopyMeals }) => {
  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const yesterdayStr = useMemo(() => getOffsetDateString(1), []);
  const twoDaysAgoStr = useMemo(() => getOffsetDateString(2), []);
  const lastWeekStr = useMemo(() => getOffsetDateString(7), []);

  const [sourceDate, setSourceDate] = useState(yesterdayStr);
  const [copyToDate, setCopyToDate] = useState(targetDate || todayStr);
  const [sourceMeals, setSourceMeals] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Sync default copyToDate when modal opens
  useEffect(() => {
    if (isOpen) {
      setCopyToDate(targetDate || todayStr);
    }
  }, [isOpen, targetDate, todayStr]);

  const fetchMealsForSourceDate = useCallback(async (dateStr) => {
    if (!dateStr) return;
    setLoading(true);
    setFetchError(null);
    setSelectedIds(new Set());

    try {
      const rawResponse = await getMealsByDate(dateStr);
      let allResults = Array.isArray(rawResponse)
        ? rawResponse
        : rawResponse?.results || [];

      let nextUrl = rawResponse?.next;
      const seenUrls = new Set();
      let pageCount = 0;
      while (nextUrl && !seenUrls.has(nextUrl) && pageCount < 25) {
        seenUrls.add(nextUrl);
        pageCount += 1;
        const pageRes = await getMeals(nextUrl);
        const pageItems = Array.isArray(pageRes)
          ? pageRes
          : pageRes?.results || [];
        allResults = [...allResults, ...pageItems];
        nextUrl = pageRes?.next;
      }

      setSourceMeals(allResults);
    } catch (err) {
      console.error("Failed to fetch old meals:", err);
      setFetchError("Could not load meals for the selected date.");
      setSourceMeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchMealsForSourceDate(sourceDate);
    }
  }, [isOpen, sourceDate, fetchMealsForSourceDate]);

  // Group meals by meal_type in chronological meal order
  const groupedMeals = useMemo(() => {
    const map = {};
    sourceMeals.forEach((m) => {
      const type = m.meal_type || "Other";
      if (!map[type]) map[type] = [];
      map[type].push(m);
    });

    const ordered = [];
    MEAL_ORDER.forEach((type) => {
      if (map[type]?.length) {
        ordered.push({ type, items: map[type] });
        delete map[type];
      }
    });
    Object.entries(map).forEach(([type, items]) => {
      if (items.length) ordered.push({ type, items });
    });
    return ordered;
  }, [sourceMeals]);

  const allSelected =
    sourceMeals.length > 0 && selectedIds.size === sourceMeals.length;

  const toggleEntireDay = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sourceMeals.map((m) => m.id)));
    }
  };

  const toggleMealTypeGroup = (items) => {
    const groupIds = items.map((m) => m.id);
    const isGroupAllSelected = groupIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isGroupAllSelected) {
        groupIds.forEach((id) => next.delete(id));
      } else {
        groupIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSingleItem = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedMealsList = useMemo(() => {
    return sourceMeals.filter((m) => selectedIds.has(m.id));
  }, [sourceMeals, selectedIds]);

  const selectedCalories = useMemo(() => {
    return selectedMealsList.reduce(
      (sum, m) => sum + Number(m.calories || 0),
      0
    );
  }, [selectedMealsList]);

  const handleConfirmCopy = () => {
    if (selectedMealsList.length === 0) return;
    onCopyMeals(selectedMealsList, copyToDate);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 16, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 16, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-[var(--color-border-default)] flex items-center justify-between gap-3 bg-[var(--color-bg-surface)]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[var(--color-primary-subtle)] text-[var(--color-primary)]">
                <Copy size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--color-text-strong)]">
                  Copy Old Meals
                </h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Select a past day and pick specific meals or the entire day to fill into your log.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] hover:bg-[var(--color-bg-app)] transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Date Controls */}
          <div className="px-5 py-3.5 bg-[var(--color-bg-app)] border-b border-[var(--color-border-default)] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mr-1">
                  Copy From:
                </span>
                {[
                  { label: "Yesterday", val: yesterdayStr },
                  { label: "2 Days Ago", val: twoDaysAgoStr },
                  { label: "Last Week", val: lastWeekStr },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setSourceDate(preset.val)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      sourceDate === preset.val
                        ? "bg-[var(--color-primary)] text-white shadow-xs"
                        : "bg-[var(--color-bg-surface)] text-[var(--color-text-default)] border border-[var(--color-border-default)] hover:border-[var(--color-primary)]"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-[var(--color-primary)]" />
                <input
                  type="date"
                  value={sourceDate}
                  max={todayStr}
                  onChange={(e) => setSourceDate(e.target.value)}
                  className="px-2.5 py-1 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-xs font-semibold text-[var(--color-text-strong)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>

            {/* Quick Select Bar (Entire Day + Meal-Type Chips) */}
            {!loading && sourceMeals.length > 0 && (
              <div className="pt-2 border-t border-[var(--color-border-default)]/60 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleEntireDay}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    allSelected
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                      : "bg-[var(--color-bg-surface)] text-[var(--color-text-strong)] border-[var(--color-border-default)] hover:border-[var(--color-primary)]"
                  }`}
                >
                  {allSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                  <span>{allSelected ? "Deselect Entire Day" : "Select Entire Day"}</span>
                </button>

                {groupedMeals.map(({ type, items }) => {
                  const isGroupSelected = items.every((m) =>
                    selectedIds.has(m.id)
                  );
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleMealTypeGroup(items)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isGroupSelected
                          ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)] border-[var(--color-primary)]"
                          : "bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] border-[var(--color-border-default)] hover:text-[var(--color-text-strong)]"
                      }`}
                    >
                      {isGroupSelected && <Check size={12} />}
                      <span>
                        {type} ({items.length})
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Meals List Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {loading ? (
              <div className="py-14 flex flex-col items-center justify-center gap-2 text-[var(--color-text-muted)]">
                <Loader2 className="w-7 h-7 animate-spin text-[var(--color-primary)]" />
                <p className="text-xs font-semibold">
                  Loading meals from {formatHumanDate(sourceDate)}...
                </p>
              </div>
            ) : fetchError ? (
              <div className="py-12 text-center text-xs text-rose-500 font-semibold">
                {fetchError}
              </div>
            ) : sourceMeals.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <UtensilsCrossed className="w-10 h-10 mx-auto text-[var(--color-text-muted)] opacity-50" />
                <p className="text-sm font-bold text-[var(--color-text-strong)]">
                  No Meals Logged on {formatHumanDate(sourceDate)}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Try picking another date above to copy meals from.
                </p>
              </div>
            ) : (
              groupedMeals.map(({ type, items }) => {
                const isGroupSelected = items.every((m) =>
                  selectedIds.has(m.id)
                );
                const groupCalories = items.reduce(
                  (sum, m) => sum + Number(m.calories || 0),
                  0
                );
                return (
                  <div
                    key={type}
                    className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] overflow-hidden"
                  >
                    {/* Group Header */}
                    <button
                      type="button"
                      onClick={() => toggleMealTypeGroup(items)}
                      className="w-full px-4 py-2.5 bg-[var(--color-bg-surface)] border-b border-[var(--color-border-default)] flex items-center justify-between gap-2 text-left hover:bg-[var(--color-bg-interactive-subtle)] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isGroupSelected
                              ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                              : "border-[var(--color-border-default)] bg-[var(--color-bg-app)]"
                          }`}
                        >
                          {isGroupSelected && <Check size={12} strokeWidth={3} />}
                        </span>
                        <span className="font-bold text-sm text-[var(--color-text-strong)]">
                          {type}
                        </span>
                        <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">
                          ({items.length} item{items.length > 1 ? "s" : ""})
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[var(--color-primary)] flex items-center gap-1">
                        <Flame size={12} />
                        {Math.round(groupCalories)} kcal
                      </span>
                    </button>

                    {/* Group Items */}
                    <div className="divide-y divide-[var(--color-border-default)]/50">
                      {items.map((meal) => {
                        const isChecked = selectedIds.has(meal.id);
                        const portionLabel = formatMealPortion(meal);
                        const mealTime = meal.consumed_at
                          ? new Date(meal.consumed_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "";
                        return (
                          <div
                            key={meal.id}
                            onClick={() => toggleSingleItem(meal.id)}
                            className={`px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                              isChecked
                                ? "bg-[var(--color-primary-subtle)]/40"
                                : "hover:bg-[var(--color-bg-surface)]/60"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                                  isChecked
                                    ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                                    : "border-[var(--color-border-default)] bg-[var(--color-bg-surface)]"
                                }`}
                              >
                                {isChecked && <Check size={12} strokeWidth={3} />}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-[var(--color-text-strong)] truncate">
                                  {meal.food_name_display || meal.food_name || "Food Item"}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
                                  {portionLabel && <span>{portionLabel}</span>}
                                  {mealTime && (
                                    <span className="inline-flex items-center gap-0.5">
                                      <Clock size={10} />
                                      {mealTime}
                                    </span>
                                  )}
                                  {meal.remarks && (
                                    <span className="italic truncate max-w-[200px]">
                                      • {meal.remarks}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span className="text-xs font-bold text-[var(--color-text-default)] shrink-0">
                              {Math.round(meal.calories || 0)} kcal
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 border-t border-[var(--color-border-default)] bg-[var(--color-bg-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-[var(--color-text-muted)]">
                  Fill for Date:
                </span>
                <input
                  type="date"
                  value={copyToDate}
                  onChange={(e) => setCopyToDate(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-[var(--color-bg-app)] border border-[var(--color-border-default)] text-xs font-semibold text-[var(--color-text-strong)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
              {selectedMealsList.length > 0 && (
                <span className="text-xs font-bold text-[var(--color-primary)]">
                  {selectedMealsList.length} selected ({Math.round(selectedCalories)} kcal)
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[var(--color-border-default)] text-xs font-bold text-[var(--color-text-default)] hover:bg-[var(--color-bg-app)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedMealsList.length === 0}
                onClick={handleConfirmCopy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                <Copy size={14} />
                <span>
                  Copy {selectedMealsList.length > 0 ? `(${selectedMealsList.length}) ` : ""}to Log Form
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CopyOldMealModal;

