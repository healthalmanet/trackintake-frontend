// src/components/dashboard/QuickMealLogger.jsx

import React, { useState, useMemo, useEffect, useRef } from "react";
import { FaUtensils } from "react-icons/fa";
import useMealLogger from "./UseMealLogger";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Plus,
  Loader,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  FilePenLine,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Candy,
  Leaf,
  X,
  ChevronDown,
  ExternalLink,
  Camera,
  Sparkles,
  Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import FoodAutocompleteInput from "./FoodAutocompleteInput";
import MealPhotoScannerModal from "./MealPhotoScannerModal";

import {
  UNIT_GROUPS,
  UNIT_HINTS,
  getUnitHint,
  formatMealPortion,
  computeEstimate,
} from "./mealPortionUtils";

const UnitDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentHint = getUnitHint(value);

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center justify-between gap-1.5 bg-[var(--color-bg-app)] border-2 rounded-lg px-2.5 py-2 text-sm focus:outline-none transition-colors ${
          open ? "border-[var(--color-primary)]" : "border-[var(--color-border-default)]"
        }`}
        style={{ minWidth: "150px" }}
      >
        {value ? (
          <span className="flex items-center justify-between gap-1.5 min-w-0 flex-1">
            <span className="text-[var(--color-text-strong)] font-semibold truncate text-sm">
              {value}
            </span>
            {currentHint && (
              <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-[var(--color-primary-subtle)] text-[var(--color-primary)] shrink-0 whitespace-nowrap">
                {currentHint}
              </span>
            )}
          </span>
        ) : (
          <span className="text-[var(--color-text-muted)] text-sm truncate">
            Select Unit
          </span>
        )}
        <svg className={`w-3.5 h-3.5 ml-1 shrink-0 transition-transform text-[var(--color-text-muted)] ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute z-50 right-0 mt-1.5 w-max min-w-full max-w-[calc(100vw-2rem)] sm:min-w-[240px] bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-xl shadow-2xl overflow-hidden"
          style={{ maxHeight: "300px", overflowY: "auto" }}
        >
          {UNIT_GROUPS.map(({ label, units }) => (
            <div key={label}>
              <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] bg-[var(--color-bg-app)] sticky top-0 border-b border-[var(--color-border-default)]/40 z-10">
                {label}
              </div>
              {units.map((u) => {
                const isSelected = value === u.name;
                const hint = getUnitHint(u.name) || u.hint;
                return (
                  <button
                    key={u.name}
                    type="button"
                    onClick={() => { onChange(u.name); setOpen(false); }}
                    className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 text-xs transition-colors ${
                      isSelected
                        ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-semibold"
                        : "text-[var(--color-text-default)] hover:bg-[var(--color-bg-app)]"
                    }`}
                  >
                    <span className="font-medium text-left truncate">{u.name}</span>
                    {hint && (
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                        isSelected
                          ? "bg-[var(--color-primary)] text-[var(--color-text-on-primary)]"
                          : "bg-[var(--color-bg-app)] text-[var(--color-primary)] border border-[var(--color-primary)]/20"
                      }`}>
                        {hint}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const NutrientDetail = ({ icon: Icon, label, value, unit, colorClass }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, x: -10 },
      visible: { opacity: 1, x: 0 },
    }}
    className="flex items-center justify-between text-sm"
  >
    <div className={`flex items-center gap-2 text-sm text-[var(--color-text-muted)] ${colorClass}`}>
      <Icon size={16} className="opacity-80" />
      <span>{label}</span>
    </div>
    <span className="font-bold text-base text-[var(--color-text-strong)]">
      {parseFloat(value).toFixed(1) || "0.0"}
      <span className="text-xs font-normal text-[var(--color-text-muted)] ml-1">{unit}</span>
    </span>
  </motion.div>
);

const QuickMealLogger = ({ onMealLogged }) => {
  const {
    foodInputs,
    handleFoodChange,
    addFoodField,
    removeFoodField,
    unitOptions,
    handleSubmit,
    loggedMeals,
    handleDeleteMeal,
    searchDate,
    setSearchDate,
    searchByDate,
    isSubmitting,
    isFetching,
    addItem,
    editingMeal,
    handleEditMeal,
    cancelEdit,
    foodSearchResults,
    foodSearchLoading,
    debouncedSearch,
    handleSelectFood,
    handleFoodBlur,
    recentMeals,
    handleQuickReLog,
    setFoodInputs,
    fetchMeals,
  } = useMealLogger();

  const [scannerOpen, setScannerOpen] = useState(false);

  const handleApplyPhotoToInputs = (data) => {
    if (!data.items || data.items.length === 0) return;
    const newInputs = data.items.map((item, idx) => ({
      id: Date.now() + idx,
      name: item.food_name,
      quantity: item.quantity,
      unit: item.unit,
      portionSize: item.portion_size || "Medium",
      mealType: data.mealType || "Lunch",
      logDate: data.date,
      logTime: data.time,
      remark: data.remarks || item.description || "",
      selectedFood: null,
      exact_grams: item.gram_equivalent || null,
      exact_ml: null,
    }));
    setFoodInputs(newInputs);
  };

  const mealTypeMap = {
    "Early-Morning": "Early-Morning",
    Breakfast: "Breakfast",
    "Mid-Morning Snack": "Mid-Morning Snack",
    Lunch: "Lunch",
    "Afternoon Snack": "Afternoon Snack",
    Dinner: "Dinner",
    Bedtime: "Bedtime",
  };
  const navigate = useNavigate();

  const handleNavigateToDetailedLog = () => {
    navigate('/dashboard/tools/meal-log');
  };

  const mealTypeStyles = {
    "early-morning": { border: "border-[var(--color-accent-1-text)]", bg: "bg-[var(--color-accent-1-bg-subtle)]", iconColor: "text-[var(--color-accent-1-text)]" },
    breakfast: { border: "border-[var(--color-success-text)]", bg: "bg-[var(--color-success-bg-subtle)]", iconColor: "text-[var(--color-success-text)]" },
    "mid-morning snack": { border: "border-[var(--color-accent-2-text)]", bg: "bg-[var(--color-accent-2-bg-subtle)]", iconColor: "text-[var(--color-accent-2-text)]" },
    lunch: { border: "border-[var(--color-warning-text)]", bg: "bg-[var(--color-warning-bg-subtle)]", iconColor: "text-[var(--color-warning-text)]" },
    "afternoon snack": { border: "border-[var(--color-accent-3-text)]", bg: "bg-[var(--color-accent-3-bg-subtle)]", iconColor: "text-[var(--color-accent-3-text)]" },
    dinner: { border: "border-[var(--color-danger-text)]", bg: "bg-[var(--color-danger-bg-subtle)]", iconColor: "text-[var(--color-danger-text)]" },
    bedtime: { border: "border-[var(--color-info-text)]", bg: "bg-[var(--color-info-bg-subtle)]", iconColor: "text-[var(--color-info-text)]" },
  };

  const getLocalDateInputFormat = (date) => {
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  };

  const getCanonicalMealType = (type) => {
    if (!type) return "Uncategorized";
    const cleanedType = type.trim();
    if (cleanedType === "Early Morning Snack" || cleanedType === "Early-Morning ") {
      return "Early-Morning";
    }
    return cleanedType;
  };

  const groupedMeals = useMemo(() => {
    if (!loggedMeals) return {};
    return loggedMeals.reduce((acc, meal) => {
      const type = getCanonicalMealType(meal.meal_type);
      if (!acc[type]) acc[type] = [];
      acc[type].push(meal);
      return acc;
    }, {});
  }, [loggedMeals]);

  const mealOrder = ["Early-Morning", "Breakfast", "Mid-Morning Snack", "Lunch", "Afternoon Snack", "Dinner", "Bedtime"];

  const [activeMealType, setActiveMealType] = useState("All");
  const [categoryCurrentPage, setCategoryCurrentPage] = useState(1);

  const [openMeals, setOpenMeals] = useState({});
  const [expandedMealIds, setExpandedMealIds] = useState({});

  const toggleMeal = (type) => {
    setOpenMeals(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const toggleMealDetail = (id) => {
    setExpandedMealIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    setCategoryCurrentPage(1);
  }, [activeMealType, searchDate]);

  const currentViewData = useMemo(() => {
    const itemsPerPage = 5;
    const sourceArrayUnsorted = activeMealType === "All" ? loggedMeals : groupedMeals[activeMealType] || [];
    const sourceArray = [...sourceArrayUnsorted].sort((a, b) => new Date(b.consumed_at) - new Date(a.consumed_at));
    const totalItems = sourceArray.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (categoryCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = sourceArray.slice(startIndex, endIndex);
    return { pageItems, currentPage: categoryCurrentPage, totalPages, totalItems };
  }, [activeMealType, loggedMeals, groupedMeals, categoryCurrentPage]);

  const renderMealItem = (meal, style) => {
    const isDetailOpen = Boolean(expandedMealIds[meal.id]);
    return (
      <motion.li
        key={meal.id}
        layout
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
        className={`flex flex-col p-3 rounded-xl border-2 shadow-sm transition-all duration-300 ease-in-out hover:shadow-md ${style.border || "border-[var(--color-border-default)]"} bg-[var(--color-bg-surface)]`}
      >
        <div className="flex items-center gap-3 w-full">
          <div className={`p-2.5 rounded-full text-lg shrink-0 ${style.bg || "bg-[var(--color-primary-subtle)]"} ${style.iconColor || "text-[var(--color-primary)]"}`}>
            <FaUtensils />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <p className="font-semibold text-[var(--color-text-strong)] text-sm sm:text-base truncate">
                {meal.food_name_display}
              </p>
              {formatMealPortion(meal) && (
                <span className="text-[11px] font-semibold text-[var(--color-primary)] bg-[var(--color-primary-subtle)] px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap">
                  {formatMealPortion(meal)}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span className="capitalize font-medium text-[var(--color-text-default)]">{meal.meal_type || "Meal"}</span>
              {meal.consumed_at && (
                <>
                  <span>•</span>
                  <span>{new Date(meal.consumed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </>
              )}
              {meal.calories != null && (
                <>
                  <span>•</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{Math.round(meal.calories)} kcal</span>
                </>
              )}
            </p>
            {meal.remarks && (
              <p className="text-xs italic text-[var(--color-primary)] mt-1 truncate">
                "{meal.remarks}"
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={() => toggleMealDetail(meal.id)}
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                isDetailOpen
                  ? "bg-[var(--color-primary)] text-[var(--color-text-on-primary)] border-[var(--color-primary)] shadow-sm"
                  : "text-[var(--color-primary)] bg-[var(--color-primary-subtle)] border-[var(--color-primary)]/20 hover:border-[var(--color-primary)]"
              }`}
              title={isDetailOpen ? "Hide Details" : "View in Detail"}
            >
              <Eye size={13} />
              <span>{isDetailOpen ? "Hide" : "Details"}</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${isDetailOpen ? "rotate-180" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => handleEditMeal(meal)}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-[var(--color-info-text)] bg-[var(--color-info-bg-subtle)] hover:bg-[var(--color-info-bg)]/20 border border-[var(--color-info-text)]/20 transition-all shadow-sm"
              title="Edit Meal"
            >
              <FilePenLine size={13} />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => handleDeleteMeal(meal.id)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-danger-text)] transition-colors p-1.5 rounded-lg hover:bg-[var(--color-danger-bg-subtle)]"
              title="Remove Meal"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Dropdown details accordion */}
        <AnimatePresence>
          {isDetailOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="w-full mt-3 pt-3 border-t border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-app)]/80 p-3 rounded-xl space-y-2.5 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-default)]/60">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                    <Flame size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block">Total Calories</span>
                    <span className="text-base font-extrabold text-[var(--color-text-strong)]">
                      {Math.round(meal.calories || 0)} <span className="text-xs font-normal text-[var(--color-text-muted)]">kcal</span>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block">Portion / Weight</span>
                  <span className="font-semibold text-xs text-[var(--color-primary)] bg-[var(--color-primary-subtle)] px-2 py-0.5 rounded-md inline-block">
                    {formatMealPortion(meal)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-center text-xs">
                <div className="bg-[var(--color-bg-surface)] p-1.5 rounded-lg border border-[var(--color-border-default)]">
                  <span className="text-[10px] text-[var(--color-text-muted)] block font-medium">Protein</span>
                  <span className="font-bold text-[var(--color-info-text)]">{meal.protein ?? 0}g</span>
                </div>
                <div className="bg-[var(--color-bg-surface)] p-1.5 rounded-lg border border-[var(--color-border-default)]">
                  <span className="text-[10px] text-[var(--color-text-muted)] block font-medium">Carbs</span>
                  <span className="font-bold text-[var(--color-success-text)]">{meal.carbs ?? 0}g</span>
                </div>
                <div className="bg-[var(--color-bg-surface)] p-1.5 rounded-lg border border-[var(--color-border-default)]">
                  <span className="text-[10px] text-[var(--color-text-muted)] block font-medium">Fats</span>
                  <span className="font-bold text-[var(--color-accent-3-text)]">{meal.fats ?? 0}g</span>
                </div>
                <div className="bg-[var(--color-bg-surface)] p-1.5 rounded-lg border border-[var(--color-border-default)]">
                  <span className="text-[10px] text-[var(--color-text-muted)] block font-medium">Sugar</span>
                  <span className="font-bold text-[var(--color-text-strong)]">{meal.sugar ?? 0}g</span>
                </div>
                <div className="bg-[var(--color-bg-surface)] p-1.5 rounded-lg border border-[var(--color-border-default)]">
                  <span className="text-[10px] text-[var(--color-text-muted)] block font-medium">Fiber</span>
                  <span className="font-bold text-[var(--color-text-strong)]">{meal.fiber ?? 0}g</span>
                </div>
              </div>

              {meal.remarks && (
                <div className="text-xs text-[var(--color-text-default)] bg-[var(--color-bg-surface)] p-2 rounded-lg border-l-2 border-[var(--color-primary)] italic">
                  <span className="font-semibold text-[var(--color-text-strong)] not-italic">Remarks: </span>
                  {meal.remarks}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.li>
    );
  };

  return (
    <section id="quick-meal-logger-section" className="w-full bg-[var(--color-bg-app)] px-6 sm:px-12 py-16 font-[var(--font-secondary)]">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
          <h2 className="text-center text-2xl sm:text-3xl font-[var(--font-primary)] font-bold text-[var(--color-text-strong)]">Quick Meal Logger</h2>
          <p className="text-lg text-[var(--color-text-default)] mt-2">Track your nutrition smartly & simply</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:items-stretch">
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onSubmit={async (e) => {
              e.preventDefault();
              await handleSubmit(e);
              if (onMealLogged) onMealLogged();
            }}
            className="bg-[var(--color-bg-surface)] rounded-2xl p-6 shadow-xl border-2 border-[var(--color-border-default)]"
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <FaUtensils size={24} className="text-[var(--color-primary)]" />
                <h3 className="text-xl font-semibold text-[var(--color-text-strong)]">{editingMeal ? "Edit Meal" : "Add Meals"}</h3>
              </div>
              {!editingMeal && (
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  className="group flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[#e05d32] text-white text-xs font-bold shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                  title="Snap or upload meal photo for instant AI analysis"
                >
                  <Camera className="w-4 h-4 transition-transform group-hover:rotate-12" />
                  <span>Snap / Photo AI</span>
                  <Sparkles className="w-3.5 h-3.5 text-yellow-200 animate-pulse" />
                </button>
              )}
            </div>

            {/* Editing Meal Alert Banner */}
            {editingMeal && (
              <div className="mb-4 p-3.5 rounded-xl bg-[var(--color-primary-subtle)] border border-[var(--color-primary)]/30 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-[var(--color-primary)] font-semibold min-w-0">
                  <FilePenLine size={16} className="shrink-0" />
                  <span className="truncate">Editing Meal: <strong className="text-[var(--color-text-strong)]">{editingMeal.food_name_display || editingMeal.food_name || "Selected Item"}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-danger-text)] font-semibold flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] transition-colors"
                >
                  <X size={12} /> Cancel
                </button>
              </div>
            )}

            {/* Quick Re-log chips from recent meals */}
            {!editingMeal && recentMeals && recentMeals.length > 0 && (
              <div className="mb-5 p-3 rounded-xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)]">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)] mb-2">
                  <span className="text-amber-500">⚡</span> Quick Re-log Recent:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recentMeals.slice(0, 6).map((recent, i) => (
                    <button
                      key={`${recent.food_name}-${i}`}
                      type="button"
                      onClick={() => handleQuickReLog(recent)}
                      className="text-xs bg-[var(--color-bg-surface)] hover:bg-[var(--color-primary-subtle)] hover:text-[var(--color-primary)] border border-[var(--color-border-default)] hover:border-[var(--color-primary)] rounded-full px-3 py-1 text-[var(--color-text-default)] transition-colors flex items-center gap-1.5 shadow-sm"
                      title={`Click to fill ${recent.food_name}`}
                    >
                      <span className="font-medium">{recent.food_name}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        ({formatMealPortion({ quantity: recent.last_quantity, unit: recent.last_unit, effective_grams: recent.effective_grams, gram_equivalent: recent.gram_equivalent })})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {foodInputs.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 space-y-3 border-t-2 border-dashed border-[var(--color-border-default)] pt-4 overflow-hidden"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <FoodAutocompleteInput
                      value={item.name}
                      onChange={(e) => {
                        handleFoodChange(index, "name", e.target.value);
                        debouncedSearch(index, e.target.value);
                      }}
                      onBlur={() => handleFoodBlur(index, item.name)}
                      onFocus={() => debouncedSearch(index, item.name)}
                      onSelect={(selected) => handleSelectFood(index, selected)}
                      onConfirm={() => handleFoodBlur(index, item.name)}
                      results={foodSearchResults?.[index] || []}
                      loading={Boolean(foodSearchLoading?.[index])}
                      placeholder={`Food ${index + 1}`}
                      inputClassName="w-full bg-[var(--color-bg-app)] text-[var(--color-text-strong)] border-2 border-[var(--color-border-default)] rounded-lg px-3 py-2 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition"
                      className="flex-1"
                      inputId={`quick-food-${item.id}`}
                    />

                    <input type="number" value={item.quantity} onChange={(e) => handleFoodChange(index, "quantity", e.target.value)} placeholder="Qty" className="w-20 bg-[var(--color-bg-app)] text-[var(--color-text-strong)] border-2 border-[var(--color-border-default)] rounded-lg px-2 py-2 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition" />

                    <UnitDropdown value={item.unit} onChange={(val) => { handleFoodChange(index, "unit", val); handleFoodChange(index, "portionSize", ""); }} />
                  </div>

                  {/* Exact override toggle & live estimate badge */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleFoodChange(index, "showExactOverride", !item.showExactOverride)}
                      className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>{item.showExactOverride ? "▾ Hide exact weight" : "▸ Enter exact grams / ml (optional)"}</span>
                    </button>
                    {(() => {
                      const est = computeEstimate(item);
                      if (!est || !est.effectiveG) return null;
                      return (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-primary-subtle)] text-[var(--color-primary)] border border-[var(--color-primary)]/20 shadow-sm shrink-0 whitespace-nowrap">
                          <span>{est.display || `${est.isExact ? "" : "~"}${est.effectiveG}${est.metricUnit}`}</span>
                        </span>
                      );
                    })()}
                  </div>

                  {item.showExactOverride && (
                    <div className="flex items-center gap-3 bg-[var(--color-bg-app)] p-2.5 rounded-xl border border-[var(--color-border-default)]">
                      <div className="flex-1">
                        <label className="text-[11px] font-medium text-[var(--color-text-muted)] block mb-1">Exact Grams (g)</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="e.g. 150"
                          value={item.exact_grams || ""}
                          onChange={(e) => {
                            handleFoodChange(index, "exact_grams", e.target.value);
                            if (e.target.value) handleFoodChange(index, "exact_ml", "");
                          }}
                          className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-[var(--color-text-strong)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                        />
                      </div>
                      <span className="text-xs text-[var(--color-text-muted)] pt-3 font-semibold">or</span>
                      <div className="flex-1">
                        <label className="text-[11px] font-medium text-[var(--color-text-muted)] block mb-1">Exact Milliliters (ml)</label>
                        <input
                          type="number"
                          step="any"
                          placeholder="e.g. 200"
                          value={item.exact_ml || ""}
                          onChange={(e) => {
                            handleFoodChange(index, "exact_ml", e.target.value);
                            if (e.target.value) handleFoodChange(index, "exact_grams", "");
                          }}
                          className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-[var(--color-text-strong)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                        />
                      </div>
                    </div>
                  )}

                  <input type="text" value={item.remark} onChange={(e) => handleFoodChange(index, "remark", e.target.value)} placeholder="Remark (optional)" className="w-full bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] text-[var(--color-text-strong)] rounded-lg px-3 py-2 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition" />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input type="date" value={item.logDate || ""} max={getLocalDateInputFormat(new Date())} onChange={(e) => handleFoodChange(index, "logDate", e.target.value)} className="flex-1 bg-[var(--color-bg-app)] text-[var(--color-text-strong)] border-2 border-[var(--color-border-default)] rounded-lg px-3 py-2 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition" required />
                    <div className="flex-1"> {/* Wrapper div is needed for flex layout to work correctly */}
                      <DatePicker
                        selected={
                          // The library needs a Date object. We create one from your time string.
                          item.logTime ? new Date(`1970-01-01T${item.logTime}`) : null
                        }
                        onChange={(date) => {
                          // The library gives a Date object, so we format it back to the "HH:mm" string your state expects.
                          const timeString = date ? date.toTimeString().slice(0, 5) : "";
                          handleFoodChange(index, "logTime", timeString);
                        }}
                        // These props create the time-picker UI you want
                        showTimeSelect
                        showTimeSelectOnly
                        timeIntervals={15}
                        timeCaption="Time"
                        dateFormat="h:mm aa" // Displays in a friendly format like "2:30 PM"

                        // Use your existing styles for a consistent look
                        className="w-full bg-[var(--color-bg-app)] text-[var(--color-text-strong)] border-2 border-[var(--color-border-default)] rounded-lg px-3 py-2 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition"
                        placeholderText="Select time"
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="block text-sm mb-2 font-medium text-[var(--color-text-default)]">Meal Type</label>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(mealTypeMap).map(([label, value]) => (
                        <label key={value} className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border-2 transition-all duration-200 ${item.mealType === value ? "bg-[var(--color-primary)] text-[var(--color-text-on-primary)] border-[var(--color-primary)]" : "border-[var(--color-border-default)] text-[var(--color-text-default)] bg-[var(--color-bg-app)] hover:border-[var(--color-primary)] hover:text-[var(--color-text-strong)]"}`}>
                          <input type="radio" name={`mealType-${item.id}`} value={value} checked={item.mealType === value} onChange={() => handleFoodChange(index, "mealType", value)} className="hidden" />
                          {label}
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => addItem(index)}
                      className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] bg-transparent px-4 py-2 rounded-lg border-2 border-transparent hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-bg-subtle)] transition-all"
                    >
                      <Plus size={16} className="text-[var(--color-primary)]" /> Add Item
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {!editingMeal && (
              <div className="flex gap-4 mb-6">
                <button type="button" onClick={addFoodField} className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] bg-transparent px-4 py-2 rounded-lg border-2 border-transparent hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-bg-subtle)] transition-all">
                  <Plus size={16} /> Add Another Meal
                </button>
                {foodInputs.length > 1 && (
                  <button type="button" onClick={() => removeFoodField(foodInputs.length - 1)} className="flex items-center gap-2 text-sm font-semibold text-[var(--color-danger-text)] bg-transparent px-4 py-2 rounded-lg border-2 border-transparent hover:border-[var(--color-danger-border)] hover:bg-[var(--color-danger-bg-subtle)] transition-all">
                    <Trash2 size={16} /> Remove Last
                  </button>
                )}
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              {editingMeal && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="w-full sm:w-1/3 bg-[var(--color-bg-app)] hover:bg-[var(--color-bg-interactive-subtle)] border-2 border-[var(--color-border-default)] text-[var(--color-text-default)] px-5 py-3 rounded-xl text-base font-semibold font-[var(--font-primary)] transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <X size={18} /> Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full ${editingMeal ? "sm:flex-1 bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25" : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-on-primary)] shadow-[var(--color-primary)]/25"} px-6 py-3 rounded-xl text-base font-bold font-[var(--font-primary)] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2`}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="animate-spin" size={18} />
                    <span>{editingMeal ? "Updating Meal..." : "Logging Meal..."}</span>
                  </>
                ) : (
                  <>
                    {editingMeal ? <FilePenLine size={18} /> : <Plus size={18} />}
                    <span>{editingMeal ? "Update Meal" : "Log Meal(s)"}</span>
                  </>
                )}
              </button>
            </div>
          </motion.form>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-[var(--color-bg-surface)] rounded-2xl p-6 shadow-xl border-2 border-[var(--color-border-default)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                Logged Meals
              </h3>
              <motion.button
                onClick={handleNavigateToDetailedLog}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] bg-transparent px-3 py-2 rounded-lg border-2 border-transparent hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-bg-subtle)] transition-all"
                title="View the detailed meal log page"
              >
                <ExternalLink size={16} />
                <span>View Full Log</span>
              </motion.button>
            </div>
            <div className="mb-6 bg-[var(--color-bg-interactive-subtle)] p-4 rounded-lg">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
                <input type="date" value={searchDate} max={getLocalDateInputFormat(new Date())} onChange={(e) => { const newDate = e.target.value; setSearchDate(newDate); searchByDate(newDate); }} className="w-full bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] rounded-lg pl-10 pr-4 py-2 text-[var(--color-text-default)] focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
              </div>
            </div>
            {isFetching ? (<div className="flex items-center justify-center p-6 text-center text-[var(--color-text-muted)] gap-2"><Loader className="animate-spin" />Loading meals...</div>) : (
              <div>
                <div className="flex gap-2 flex-wrap pb-4 mb-4 border-b-2 border-[var(--color-border-default)]">
                  <button onClick={() => setActiveMealType("All")} className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${activeMealType === "All" ? "bg-[var(--color-primary)] text-[var(--color-text-on-primary)] border-[var(--color-primary)]" : "bg-[var(--color-bg-interactive-subtle)] text-[var(--color-text-default)] border-transparent hover:border-[var(--color-primary)] hover:text-[var(--color-text-strong)]"}`}>
                    All ({loggedMeals.length})
                  </button>
                  {mealOrder.map((type) => {
                    const mealsInGroup = groupedMeals[type] || [];

                    const displayName = Object.keys(mealTypeMap).find((key) => mealTypeMap[key] === type) || type;
                    return (<button key={type} onClick={() => setActiveMealType(type)} className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${activeMealType === type ? "bg-[var(--color-primary)] text-[var(--color-text-on-primary)] border-[var(--color-primary)]" : "bg-[var(--color-bg-interactive-subtle)] text-[var(--color-text-default)] border-transparent hover:border-[var(--color-primary)] hover:text-[var(--color-text-strong)]"}`}>{displayName} ({mealsInGroup.length})</button>);
                  })}
                </div>

                {loggedMeals.length === 0 ? (
                  <div className="text-[var(--color-text-default)] p-6 bg-[var(--color-bg-app)] rounded-xl border-2 border-dashed border-[var(--color-border-default)] text-center">
                    <p className="font-semibold">No meals logged for this date.</p>
                    <p className="text-sm">Use the form above to add a meal!</p>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div key={activeMealType} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                      {currentViewData.pageItems.length > 0 ? (
                        activeMealType === "All" ? (
                          <div className="space-y-3">
                            {mealOrder.map((type) => {
                              const mealsInGroup = groupedMeals[type] || [];
                              if (mealsInGroup.length === 0) return null;
                              const isOpen = openMeals[type] || false;
                              const style = mealTypeStyles[type?.toLowerCase().trim()] || {};

                              return (
                                <div key={type} className="border-2 border-[var(--color-border-default)] rounded-xl shadow-sm overflow-hidden">
                                  <button
                                    onClick={() => toggleMeal(type)}
                                    className={`w-full flex justify-between items-center px-4 py-2 text-[var(--color-text-strong)] font-semibold bg-[var(--color-bg-interactive-subtle)] hover:bg-[var(--color-bg-surface)] transition-all`}
                                  >
                                    <span>{type} ({mealsInGroup.length})</span>
                                    <ChevronDown size={18} className={`transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`} />
                                  </button>

                                  <AnimatePresence>
                                    {isOpen && (
                                      <motion.ul
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-2 space-y-2"
                                      >
                                        {mealsInGroup.map((meal) => renderMealItem(meal, style))}
                                      </motion.ul>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        ) : (


                          <ul className="space-y-3">
                            {currentViewData.pageItems.map((meal) => {
                              const style = mealTypeStyles[meal.meal_type?.toLowerCase().trim()] || {};
                              return renderMealItem(meal, style);
                            })}
                          </ul>)
                      ) : (
                        <div className="text-[var(--color-text-default)] p-6 text-center">
                          <p className="font-semibold">No meals logged for this category.</p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}

                {currentViewData.totalPages > 1 && (
                  <div className="flex justify-center items-center mt-6 space-x-2">
                    <button onClick={() => setCategoryCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentViewData.currentPage === 1} className="p-2 rounded-full border-2 border-[var(--color-border-default)] transition-all duration-300 enabled:hover:bg-[var(--color-bg-interactive-subtle)] enabled:hover:border-[var(--color-primary)] disabled:opacity-50"><ChevronLeft size={18} /></button>
                    <span className="text-sm text-[var(--color-text-default)] font-semibold">Page {currentViewData.currentPage} of {currentViewData.totalPages}</span>
                    <button onClick={() => setCategoryCurrentPage((prev) => Math.min(prev + 1, currentViewData.totalPages))} disabled={currentViewData.currentPage === currentViewData.totalPages} className="p-2 rounded-full border-2 border-[var(--color-border-default)] transition-all duration-300 enabled:hover:bg-[var(--color-bg-interactive-subtle)] enabled:hover:border-[var(--color-primary)] disabled:opacity-50"><ChevronRight size={18} /></button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <MealPhotoScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onMealLogged={async (loggedDate) => {
          if (loggedDate) setSearchDate(loggedDate);
          if (fetchMeals) await fetchMeals(loggedDate || searchDate);
          if (onMealLogged) onMealLogged();
        }}
        onApplyToInputs={handleApplyPhotoToInputs}
      />
    </section>
  );
};

export default QuickMealLogger;