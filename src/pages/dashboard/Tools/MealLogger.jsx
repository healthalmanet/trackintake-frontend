// src/pages/dashboard/tools/MealLogger.jsx

import React, { useEffect, useState, useMemo } from "react";
import useMealLogger from "../../../components/components/MealLogger/UseMealLogger";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
  Search,
  Loader,
  FilePenLine,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// Import the water API
import { getTotalWaterForDate } from "../../../api/WaterTracker";
// --- UPDATED: Import both target and progress APIs ---
import { targetApi, targetProgressApi } from "../../../api/reportsApi";
import {
  FaFireAlt,
  FaBreadSlice,
  FaDrumstickBite,
  FaTint,
  FaGlassWhiskey,
  FaCoffee,
  FaAppleAlt,
  FaHamburger,
  FaPizzaSlice,
  FaCookieBite,
  FaConciergeBell,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import FoodAutocompleteInput from "../../../components/components/MealLogger/FoodAutocompleteInput";
//ananya start

const UnitDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);
  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between bg-[var(--color-bg-app)] border-2 rounded-lg px-3 py-2.5 text-[var(--color-text-default)] focus:outline-none transition-colors text-sm font-medium ${open ? "border-[var(--color-primary)]" : "border-[var(--color-border-default)]"
          }`}
      >
        <span className={value ? "text-[var(--color-text-default)]" : "text-[var(--color-text-muted)]"}>
          {value || "Unit"}
        </span>
        <svg className={`w-4 h-4 ml-2 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          className="absolute z-50 w-full mt-1 bg-white border border-[var(--color-border-default)] rounded-lg shadow-xl"
          style={{ maxHeight: "200px", overflowY: "scroll" }}
        >
          {UNITS.map((unit) => (
            <li
              key={unit}
              onClick={() => { onChange(unit); setOpen(false); }}
              className={`px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors ${value === unit
                ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                : "text-[var(--color-text-default)] hover:bg-gray-50"
                }`}
            >
              {unit}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
//ananya end
const UNITS = [
  "Gram",
  "Kilogram",
  "Milliliters",
  "Liters",
  "Glass",
  "Cup",
  "Bowl",
  "Piece",
  "Tbsp",
  "Tsp",
  "Slice",
  "Plate",
  "Handful",
  "Pinch",
  "Dash",
  "Sprinkle",
  "Other",
];//added by ananya

const MealLogger = () => {
  // MODIFIED: Removed pagination handlers from destructuring
  const {
    foodInputs = [],
    handleFoodChange,
    addFoodField,
    removeFoodField,
    handleSubmit,
    unitOptions = [],
    loggedMeals = [],
    handleDeleteMeal,
    searchDate,
    setSearchDate,
    searchByDate,
    isSubmitting,
    isFetching,
    editingMeal,
    handleEditMeal,
    addItem,
    cancelEdit,
    mealTypeOptions = [],
    // NEW: attributes wiring
    foodAttributes,
    selectedAttributes,
    attributeLoading,
    handleAttributeSelect,
    fetchFoodAttributesOnBlur,
    // === Changes made by Ananya (Start) ===
    foodSearchResults,
    foodSearchLoading,
    handleSelectFood,
    debouncedSearch,
    handleFoodBlur,
    // === Changes made by Ananya (End) ===
  } = useMealLogger();

  // --- DESIGN UPDATE: Changed to normalized key 'all' ---
  const [activeCategory, setActiveCategory] = useState("all");

  // --- UNCHANGED: State and hooks for summary and goals ---
  const [dailySummary, setDailySummary] = useState({
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
    sugar: 0,
    fiber: 0,
  });
  const [waterLogged, setWaterLogged] = useState(0);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  // Start with a default fallback
  const todayDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  // --- DESIGN UPDATE: State for pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const MEALS_PER_PAGE = 5;

  useEffect(() => {
    const fetchDailySummary = async () => {
      if (!searchDate) return;
      try {
        const summaryData = await targetProgressApi(searchDate);
        setDailySummary({
          calories: summaryData.calories || 0,
          carbs: summaryData.carbs || 0,
          protein: summaryData.protein || 0,
          fat: summaryData.fats || 0,
          sugar: summaryData.sugar || 0,
          fiber: summaryData.fiber || 0,
        });
      } catch (error) {
        console.error("Failed to fetch daily summary:", error);
        setDailySummary({
          calories: 0,
          carbs: 0,
          protein: 0,
          fat: 0,
          sugar: 0,
          fiber: 0,
        });
      }
    };
    fetchDailySummary();
  }, [searchDate, loggedMeals]);

  useEffect(() => {
    const fetchWaterData = async () => {
      if (!searchDate) return;
      try {
        const data = await getTotalWaterForDate(searchDate);
        const totalMl = data?.total_water_ml || 0;
        setWaterLogged(totalMl);
      } catch (error) {
        console.error("Failed to fetch water data:", error);
        setWaterLogged(0);
      }
    };
    fetchWaterData();
  }, [searchDate, loggedMeals]);

  useEffect(() => {
    // --- MODIFIED: Fetch both calorie and macro goals ---
    const fetchGoals = async () => {
      try {
        const data = await targetApi(todayDate);
        if (data) {
          if (data.recommended_calories) {
            setCalorieGoal(data.recommended_calories);
          }
          if (data.macronutrients) {
            setMacroGoals(data.macronutrients);
          }
        }
      } catch (error) {
        console.error("Failed to fetch goals:", error);
      }
    };
    fetchGoals();
  }, [todayDate]);

  // --- UNCHANGED: Helper constants and functions ---
  const waterGlasses = Math.floor((waterLogged || 0) / 250);
  const [macroGoals, setMacroGoals] = useState({
    protein_g: 140,
    carbs_g: 125,
    fats_g: 65,
    sugar_g: 40,
    fiber_g: 25,
  });
  const mealTypeStyles = {
    breakfast: {
      bg: 'bg-amber-100/70', // Using amber for a warm breakfast feel, slightly more opaque
      border: 'border-amber-300',
      iconColor: 'text-amber-700',
      gradient: 'bg-gradient-to-br from-amber-50 to-amber-100', // Subtle gradient
    },
    lunch: {
      bg: 'bg-emerald-100/70',
      border: 'border-emerald-300',
      iconColor: 'text-emerald-700',
      gradient: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
    },
    dinner: {
      bg: 'bg-indigo-100/70',
      border: 'border-indigo-300',
      iconColor: 'text-indigo-700',
      gradient: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
    },
    snack: {
      bg: 'bg-purple-100/70',
      border: 'border-purple-300',
      iconColor: 'text-purple-700',
      gradient: 'bg-gradient-to-br from-purple-50 to-purple-100',
    },
    // Default style if meal_type doesn't match
    default: {
      bg: 'bg-gray-100/70',
      border: 'border-gray-300',
      iconColor: 'text-gray-700',
      gradient: 'bg-gradient-to-br from-gray-50 to-gray-100',
    }
  };

  const getMealIcon = (mealType) => {
    switch (mealType?.toLowerCase()) {
      case 'breakfast': return '🍳';
      case 'lunch': return '🍔';
      case 'dinner': return '🍝';
      case 'snack': return '🍎';
      default: return '🍽️';
    }
  };

  // Helper to get nutrient specific style
  const getNutrientStyle = (nutrientName) => {
    switch (nutrientName.toLowerCase()) {
      case 'calories': return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Using Tailwind direct classes, mapping to your var(--color-stat-1-bg) concept
      case 'protein': return 'bg-green-100 text-green-800 border-green-200';
      case 'carbs': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fats': return 'bg-red-100 text-red-800 border-red-200';
      case 'sugar': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'fiber': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getProgressPercent = (value, target) => {
    if (!target || target === 0) return 0;
    return Math.min((value / target) * 100, 100);
  };

  // --- DESIGN UPDATE & BUG FIX: Memoized data with consistent normalized keys ---
  const { mealsByCategory, mealCounts, sortedAllMeals } =
    useMemo(() => {
      const sorted = [...loggedMeals].sort(
        (a, b) => new Date(b.consumed_at) - new Date(a.consumed_at)
      );
      const byCategory = sorted.reduce((acc, meal) => {
        // --- THIS IS THE FIX: Ensure normalization is identical to the button key generation ---
        const type = meal.meal_type.toLowerCase().replace(/-/g, ' ');
        if (!acc[type]) acc[type] = [];
        acc[type].push(meal);
        return acc;
      }, {});
      const counts = Object.keys(byCategory).reduce((acc, key) => {
        acc[key] = byCategory[key].length;
        return acc;
      }, {});
      counts["all"] = sorted.length;
      return {
        mealsByCategory: byCategory,
        mealCounts: counts,
        sortedAllMeals: sorted,
      };
    }, [loggedMeals]);

  // --- DESIGN UPDATE: Static category order ---
  const categoryOrder = ["All", "Early-Morning", "Breakfast", "Mid-Morning Snack", "Lunch", "Afternoon Snack", "Dinner", "Bedtime"];

  // --- DESIGN UPDATE: MealList component with pagination ---
  const MealList = ({ meals, currentPage, setCurrentPage, mealsPerPage, activeCategory }) => {
    const [openIndividualMealItems, setOpenIndividualMealItems] = useState({});

    const toggleIndividualMealItem = (itemId) => {
      setOpenIndividualMealItems(prev => ({
        ...prev,
        [itemId]: !prev[itemId]
      }));
    };
    let itemsToDisplay = [];

    if (activeCategory === "all") {
      // For 'All' category, group meals by meal_type
      itemsToDisplay = Object.values(
        meals.reduce((acc, meal) => {
          const type = meal.meal_type.toLowerCase().replace(/-/g, " ");
          if (!acc[type]) {
            acc[type] = {
              id: type, // Unique ID for the group (e.g., "breakfast", "lunch")
              meal_type: meal.meal_type,
              items: []
            };
          }
          acc[type].items.push(meal);
          return acc;
        }, {})
      );
    } else {
      // For individual categories, each meal is a top-level item
      itemsToDisplay = meals.map(meal => ({ ...meal, isIndividual: true }));
    }

    // Pagination (update from groupedMeals to itemsToDisplay)
    const indexOfLastMeal = currentPage * mealsPerPage;
    const indexOfFirstMeal = indexOfLastMeal - mealsPerPage;
    const currentMeals = itemsToDisplay.slice(indexOfFirstMeal, indexOfLastMeal);

    const totalPages = Math.ceil(itemsToDisplay.length / mealsPerPage);

    return (
      <>
        <AnimatePresence mode="wait">
          {currentMeals.length > 0 ? (
            currentMeals.map(mealGroupOrItem => { // <--- CHANGED HERE
              const style = mealTypeStyles[mealGroupOrItem.meal_type?.toLowerCase().replace(/-/g, " ")] || mealTypeStyles.default;

              if (activeCategory === "all") {
                // RENDER GROUPED MEAL CARD FOR "ALL" CATEGORY
                // NOTE: openMealGroups needs to be passed down or managed in MealList as well if you want it to persist.
                // For simplicity, let's assume MealList will manage `openMealGroups` for its own `currentMeals`
                const [openMealGroupsLocal, setOpenMealGroupsLocal] = useState({}); // <--- NEW LOCAL STATE
                const toggleMealGroupLocal = (mealTypeId) => { // <--- NEW LOCAL TOGGLE
                  setOpenMealGroupsLocal(prev => ({
                    ...prev,
                    [mealTypeId]: !prev[mealTypeId]
                  }));
                };
                const isOpen = openMealGroupsLocal[mealGroupOrItem.id]; // <--- USE LOCAL STATE

                return (
                  <motion.div
                    key={mealGroupOrItem.id} // Use meal_type as key for grouped cards
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`group flex flex-col gap-2 p-4 rounded-2xl border-2 shadow-lg mb-6
                                ${style.border} bg-[var(--color-bg-surface-glass)] backdrop-blur-md
                                hover:shadow-xl transition-all duration-300 ease-in-out`}
                  >
                    {/* Meal Group Header (for 'All' category) */}
                    <div
                      className="flex items-center justify-between gap-3 p-2 cursor-pointer"
                      onClick={() => toggleMealGroupLocal(mealGroupOrItem.id)} // <--- USE LOCAL TOGGLE
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-full text-xl flex items-center justify-center
                                        ${style.gradient} ${style.iconColor} shadow-md`}>
                          {getMealIcon(mealGroupOrItem.meal_type)}
                        </div>
                        <h4 className="font-primary font-bold text-[var(--color-text-strong)] text-xl tracking-wide">
                          {mealGroupOrItem.meal_type}
                        </h4>
                      </div>
                      <motion.svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-6 h-6 text-[var(--color-text-muted)]"
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </motion.svg>
                    </div>

                    {/* Individual Meal Items (Collapsible inside group) */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.ul
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="space-y-3 pt-2"
                        >
                          {mealGroupOrItem.items.map(item => (
                            <motion.li
                              key={item.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2, ease: "easeOut" }}
                              className="flex flex-col gap-3 p-4 bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)]
                                         shadow-sm hover:shadow-md hover:border-[var(--color-primary-hover)]
                                         transition-all duration-300 ease-in-out"
                            >
                              {/* Food Name & Time */}
                              <div className="flex justify-between items-start">
                                <span className="font-semibold text-[var(--color-text-strong)] text-base md:text-lg">
                                  {item.food_name_display}
                                  <span className="ml-2 font-normal text-[var(--color-text-muted)] text-sm">
                                    • {item.quantity} {item.unit}{(item.selected_size || item.portion_size || "Medium") ? ` • ${item.selected_size || item.portion_size || "Medium"}` : ""}
                                  </span>
                                </span>
                                {item.consumed_at && (
                                  <span className="text-sm text-[var(--color-text-subtle)] whitespace-nowrap ml-4">
                                    {new Date(item.consumed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                )}
                              </div>

                              {/* Remarks (if any) */}
                              {item.remarks && (
                                <p className="text-sm text-[var(--color-text-default)] border-l-2 border-[var(--color-primary)] pl-3 italic">
                                  <span className="font-semibold text-[var(--color-text-strong)]">Remarks:</span> {item.remarks}
                                </p>
                              )}

                              {/* --- Enhanced Nutrient Chips Section --- */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 mt-2">
                                {item.calories != null && (
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getNutrientStyle('calories')} flex items-center justify-center`}>
                                    Calories: {item.calories} kcal
                                  </span>
                                )}
                                {item.protein != null && (
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getNutrientStyle('protein')} flex items-center justify-center`}>
                                    Protein: {item.protein} g
                                  </span>
                                )}
                                {item.carbs != null && (
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getNutrientStyle('carbs')} flex items-center justify-center`}>
                                    Carbs: {item.carbs} g
                                  </span>
                                )}
                                {item.fats != null && (
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getNutrientStyle('fats')} flex items-center justify-center`}>
                                    Fats: {item.fats} g
                                  </span>
                                )}
                                {item.sugar != null && (
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getNutrientStyle('sugar')} flex items-center justify-center`}>
                                    Sugar: {item.sugar} g
                                  </span>
                                )}
                                {item.fiber != null && (
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getNutrientStyle('fiber')} flex items-center justify-center`}>
                                    Fiber: {item.fiber} g
                                  </span>
                                )}
                              </div>
                              {/* Action Buttons */}
                              <div className="flex justify-end gap-2 mt-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEditMeal(item); }}
                                  className="p-2 rounded-full text-[var(--color-info-text)] hover:bg-[var(--color-info-bg-subtle)] transition-colors"
                                  title="Edit Meal"
                                >
                                  <FilePenLine size={18} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteMeal(item.id); }}
                                  className="p-2 rounded-full text-[var(--color-danger-text)] hover:bg-[var(--color-danger-bg-subtle)] transition-colors"
                                  title="Delete Meal"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </motion.li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              } else {
                // RENDER INDIVIDUAL MEAL CARD FOR SPECIFIC CATEGORIES
                const isItemOpen = openIndividualMealItems[mealGroupOrItem.id];
                return (
                  <motion.div
                    key={mealGroupOrItem.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`flex flex-col gap-2 p-4 rounded-2xl border-2 shadow-lg mb-6
                                ${style.border} bg-[var(--color-bg-surface-glass)] backdrop-blur-md
                                hover:shadow-xl transition-all duration-300 ease-in-out cursor-pointer`}
                    onClick={() => toggleIndividualMealItem(mealGroupOrItem.id)}
                  >
                    {/* Meal Item Header (Food Name and Time) */}
                    <div className="flex justify-between items-center px-2 py-1">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full text-lg flex items-center justify-center
                                            ${style.gradient} ${style.iconColor} shadow-sm`}>
                          {getMealIcon(mealGroupOrItem.meal_type)}
                        </div>
                        <span className="font-primary font-bold text-[var(--color-text-strong)] text-lg tracking-wide">
                          {mealGroupOrItem.food_name_display}
                        </span>
                      </div>
                      {mealGroupOrItem.consumed_at && (
                        <span className="text-sm text-[var(--color-text-subtle)] whitespace-nowrap ml-4">
                          {new Date(mealGroupOrItem.consumed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                      <motion.svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-5 h-5 text-[var(--color-text-muted)] ml-auto"
                        animate={{ rotate: isItemOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </motion.svg>
                    </div>

                    {/* Collapsible Details */}
                    <AnimatePresence>
                      {isItemOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="pt-2"
                        >
                          <div className="flex flex-col gap-3 p-4 bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] shadow-sm">
                            {/* Quantity and Unit */}
                            <p className="font-semibold text-[var(--color-text-strong)] text-base">
                              {mealGroupOrItem.quantity} {mealGroupOrItem.unit}{(mealGroupOrItem.selected_size || mealGroupOrItem.portion_size || "Medium") ? ` • ${mealGroupOrItem.selected_size || mealGroupOrItem.portion_size || "Medium"}` : ""}
                            </p>

                            {/* Remarks (if any) */}
                            {mealGroupOrItem.remarks && (
                              <p className="text-sm text-[var(--color-text-default)] border-l-2 border-[var(--color-primary)] pl-3 italic">
                                <span className="font-semibold text-[var(--color-text-strong)]">Remarks:</span> {mealGroupOrItem.remarks}
                              </p>
                            )}

                            {/* Nutrient Chips */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 mt-2">
                              {mealGroupOrItem.calories != null && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getNutrientStyle('calories')} flex items-center justify-center`}>
                                  Calories: {mealGroupOrItem.calories} kcal
                                </span>
                              )}
                              {mealGroupOrItem.protein != null && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getNutrientStyle('protein')} flex items-center justify-center`}>
                                  Protein: {mealGroupOrItem.protein} g
                                </span>
                              )}
                              {mealGroupOrItem.carbs != null && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getNutrientStyle('carbs')} flex items-center justify-center`}>
                                  Carbs: {mealGroupOrItem.carbs} g
                                </span>
                              )}
                              {mealGroupOrItem.fats != null && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getNutrientStyle('fats')} flex items-center justify-center`}>
                                  Fats: {mealGroupOrItem.fats} g
                                </span>
                              )}
                              {mealGroupOrItem.sugar != null && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getNutrientStyle('sugar')} flex items-center justify-center`}>
                                  Sugar: {mealGroupOrItem.sugar} g
                                </span>
                              )}
                              {mealGroupOrItem.fiber != null && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getNutrientStyle('fiber')} flex items-center justify-center`}>
                                  Fiber: {mealGroupOrItem.fiber} g
                                </span>
                              )}
                            </div>
                            {/* Action Buttons */}
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditMeal(mealGroupOrItem); }}
                                className="p-2 rounded-full text-[var(--color-info-text)] hover:bg-[var(--color-info-bg-subtle)] transition-colors"
                                title="Edit Meal"
                              >
                                <FilePenLine size={18} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteMeal(mealGroupOrItem.id); }}
                                className="p-2 rounded-full text-[var(--color-danger-text)] hover:bg-[var(--color-danger-bg-subtle)] transition-colors"
                                title="Delete Meal"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              }
            })
          ) : (
            // ... (no change to the "No meals logged" section)

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center text-[var(--color-text-muted)] p-8 bg-[var(--color-bg-surface-alt)] rounded-xl shadow-inner"
            >
              <p className="font-semibold text-lg mb-2 text-[var(--color-text-strong)]">No meals logged for this category.</p>
              <p className="text-[var(--color-text-default)]">Start by adding your first meal!</p>
            </motion.div>
          )}
        </AnimatePresence>



        {totalPages > 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center items-center gap-4 mt-6">
            <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-full bg-[var(--color-bg-interactive-subtle)] hover:bg-[var(--color-primary-subtle)] text-[var(--color-text-strong)] disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              <ChevronLeft size={20} />
            </button>
            <span className="font-semibold text-sm text-[var(--color-text-default)]">
              Page {currentPage} of {totalPages}
            </span>
            <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-full bg-[var(--color-bg-interactive-subtle)] hover:bg-[var(--color-primary-subtle)] text-[var(--color-text-strong)] disabled:opacity-50 disabled:cursor-not-allowed transition-all">
              <ChevronRight size={20} />
            </button>
          </motion.div>
        )}
      </>
    );
  };

  return (
    <div className="bg-[var(--color-bg-app)] min-h-screen text-[var(--color-text-default)] font-[var(--font-secondary)]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* --- UNCHANGED: Header --- */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-[var(--font-primary)] font-bold text-[var(--color-text-strong)]">
            Meal Logger
          </h1>
          <p className="text-lg mt-1">
            Log your daily meals to track calories, nutrients, and water intake.
          </p>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* --- UNCHANGED: Form --- */}
            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-xl font-[var(--font-primary)] font-semibold text-[var(--color-text-strong)] mb-1">
                {editingMeal ? "Editing Meal" : "Log a New Meal"}
              </h3>
              <p className="text-sm mb-6">
                Enter one or more food items below.
              </p>
              <AnimatePresence>
                {foodInputs.map((input, idx) => (
                  <motion.div
                    key={input.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t-2 border-dashed border-[var(--color-border-default)] pt-6 pb-2 mb-4 "
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-grow grid grid-cols-12 gap-4">
                        <div className="col-span-12 sm:col-span-6 relative">
                          <div className="relative">
                            <FoodAutocompleteInput
                              value={input.name}
                              onChange={(e) => {
                                const nextVal = e.target.value;
                                handleFoodChange(idx, "name", nextVal);
                                debouncedSearch(idx, nextVal);
                              }}
                              onBlur={() => handleFoodBlur(idx, input.name)}
                              onFocus={() => debouncedSearch(idx, input.name)}
                              onSelect={(selected) => handleSelectFood(idx, selected)}
                              results={foodSearchResults?.[idx] || []}
                              loading={Boolean(foodSearchLoading?.[idx])}
                              inputClassName="w-full bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] rounded-lg px-3 py-2.5 text-[var(--color-text-default)] focus:outline-none focus:border-[var(--color-primary)] transition-colors peer"
                              className="w-full"
                              inputId={`meal-logger-food-${input.id}`}
                            />
                          </div>
                          <label className="absolute left-3 -top-2.5 text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-surface)] px-1 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[var(--color-primary)] transition-all pointer-events-none">
                            Food Name
                          </label>
                        </div>
                        <div className="col-span-6 sm:col-span-3 relative">
                          <input
                            type="number"
                            value={input.quantity}
                            onChange={(e) =>
                              handleFoodChange(idx, "quantity", e.target.value)
                            }
                            className="w-full bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] rounded-lg px-3 py-2.5 text-[var(--color-text-default)] focus:outline-none focus:border-[var(--color-primary)] transition-colors peer"
                            placeholder=" "
                          />
                          <label className="absolute left-3 -top-2.5 text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-surface)] px-1 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[var(--color-primary)] transition-all pointer-events-none">
                            Quantity
                          </label>
                        </div>
                        <div className="col-span-6 sm:col-span-3 relative">

                          <UnitDropdown
                            value={input.unit}
                            onChange={(val) => {
                              handleFoodChange(idx, "unit", val);
                              handleFoodChange(idx, "portionSize", "");
                            }}
                          />
                        </div>
                        {["Glass", "Cup", "Bowl", "Plate"].includes(input.unit) && (
                          <div className="col-span-12 border-2 border-dashed border-[var(--color-primary-subtle)] bg-[var(--color-primary-subtle)]/30 rounded-xl p-3">
                            <p className="text-xs font-semibold text-[var(--color-primary)] mb-2">▲ Select portion size per {input.unit.toLowerCase()}</p>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { label: "Small", ml: input.unit === "Glass" ? "~150 ml" : input.unit === "Cup" ? "~120 ml" : input.unit === "Bowl" ? "~250 ml" : "~200 ml" },
                                { label: "Medium", ml: input.unit === "Glass" ? "~250 ml" : input.unit === "Cup" ? "~240 ml" : input.unit === "Bowl" ? "~400 ml" : "~350 ml" },
                                { label: "Large", ml: input.unit === "Glass" ? "~350 ml" : input.unit === "Cup" ? "~360 ml" : input.unit === "Bowl" ? "~600 ml" : "~500 ml" },
                              ].map(({ label, ml }) => (
                                <button
                                  key={label}
                                  type="button"
                                  onClick={() => handleFoodChange(idx, "portionSize", label)}
                                  className={`flex flex-col items-center py-2 px-1 rounded-lg border-2 text-sm font-semibold transition-all ${input.portionSize === label
                                    ? "bg-[var(--color-primary)] text-[var(--color-text-on-primary)] border-[var(--color-primary)]"
                                    : "bg-[var(--color-bg-surface)] text-[var(--color-text-strong)] border-[var(--color-border-default)] hover:border-[var(--color-primary)]"
                                    }`}
                                >
                                  <span>{label}</span>
                                  <span className={`text-xs font-normal mt-0.5 ${input.portionSize === label ? "text-white/80" : "text-[var(--color-text-muted)]"}`}>{ml}</span>
                                </button>
                              ))}
                            </div>
                            <p className="text-xs text-[var(--color-text-muted)] mt-2">
                              Prefer exact ml per {input.unit.toLowerCase()}?{" "}
                              <button type="button" onClick={() => { handleFoodChange(idx, "unit", "Milliliters"); handleFoodChange(idx, "portionSize", ""); }} className="text-[var(--color-primary)] font-semibold underline">Enter exact ml →</button>
                            </p>
                          </div>
                        )}
                        <div className="col-span-12 sm:col-span-4">
                          <select
                            value={input.mealType}
                            onChange={(e) =>
                              handleFoodChange(idx, "mealType", e.target.value)
                            }
                            className="w-full bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] rounded-lg px-3 py-2.5 text-[var(--color-text-default)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                          >
                            {mealTypeOptions.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-6 sm:col-span-4 relative">
                          <input
                            type="date"
                            id={`logDate-${input.id}`}
                            value={input.logDate}
                            max={new Date().toLocaleDateString("en-CA")}
                            onChange={(e) =>
                              handleFoodChange(idx, "logDate", e.target.value)
                            }
                            className="w-full bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] rounded-lg px-3 py-2.5 text-[var(--color-text-default)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                            required
                          />
                          <label
                            htmlFor={`logDate-${input.id}`}
                            className="absolute left-3 -top-2.5 text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-surface)] px-1 pointer-events-none"
                          >
                            Date
                          </label>
                        </div>
                        <div className="col-span-6 sm:col-span-4 relative">

                          <DatePicker
                            selected={
                              input.logTime ? new Date(`1970-01-01T${input.logTime}`) : null
                            }
                            onChange={(date) => {
                              const timeString = date ? date.toTimeString().slice(0, 5) : "";
                              handleFoodChange(idx, "logTime", timeString);
                            }}
                            showTimeSelect
                            showTimeSelectOnly
                            timeIntervals={15}
                            timeCaption="Time"
                            dateFormat="h:mm aa"
                            className="w-full bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] rounded-lg px-3 py-2.5 text-[var(--color-text-default)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                            placeholderText="Time" // This acts as our new, simpler placeholder/label
                            required
                          />

                          <label
                            htmlFor={`logTime-${input.id}`}
                            className="absolute left-3 -top-2.5 text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-surface)] px-1 pointer-events-none"
                          >
                            Time
                          </label>
                        </div>
                        {/* NEW: Attributes selector (flour type / size etc) */}
                        <div className="col-span-12">
                          {foodAttributes?.[idx]?.length > 0 && (
                            <div className="border-2 border-dashed border-[var(--color-success-text)] bg-[var(--color-success-bg-subtle)]/30 rounded-xl p-3 space-y-3">
                              <p className="text-xs font-semibold text-[var(--color-success-text)] mb-2">
                                ✓ Select attributes for <strong>{input.name}</strong>
                              </p>
                              {attributeLoading?.[idx] ? (
                                <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                                  <Loader size={16} className="animate-spin" />
                                  Fetching food details...
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {foodAttributes[idx].map((attr) => (
                                    <div key={attr.id} className="space-y-1">
                                      <label className="text-xs font-semibold text-[var(--color-text-strong)] flex items-center gap-1">
                                        {attr.attribute.name}
                                        {attr.is_required && <span className="text-[var(--color-danger-text)]">*</span>}
                                      </label>
                                      <select
                                        value={selectedAttributes?.[idx]?.[attr.attribute.id] || ""}
                                        onChange={(e) => handleAttributeSelect(idx, attr.attribute.id, parseInt(e.target.value))}
                                        className="w-full bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] text-[var(--color-text-strong)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-success-text)] transition"
                                      >
                                        <option value="">-- Select {attr.attribute.name} --</option>
                                        {attr.attribute.options.map((option) => (
                                          <option key={option.id} value={option.id}>
                                            {option.display_name || option.value}

                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="col-span-12 relative">
                          <input
                            type="text"
                            value={input.remark}
                            onChange={(e) =>
                              handleFoodChange(idx, "remark", e.target.value)
                            }
                            className="w-full bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] rounded-lg px-3 py-2.5 text-[var(--color-text-default)] focus:outline-none focus:border-[var(--color-primary)] transition-colors peer"
                            placeholder=" "
                          />
                          <label className="absolute left-3 -top-2.5 text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-surface)] px-1 peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[var(--color-primary)] transition-all pointer-events-none">
                            Remarks (Optional)
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => addItem(idx)}
                          className="flex items-center gap-2 whitespace-nowrap text-[var(--color-primary)] font-semibold py-2 px-4 rounded-lg hover:bg-[var(--color-primary-subtle)] transition-colors"
                        >
                          <Plus size={16} className="text-[var(--color-primary)]" /> Add Item
                        </button>


                      </div>
                      {foodInputs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFoodField(idx)}
                          className="mt-1.5 p-1 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-danger-text)] hover:bg-[var(--color-danger-bg-subtle)] transition-colors"
                          title={`Remove ${input.name || "item"}`}
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div className="flex items-center justify-between pt-6 mt-4 border-t-2 border-dashed border-[var(--color-border-default)]">
                <div className="flex gap-4">
                  {!editingMeal && (
                    <button
                      type="button"
                      onClick={addFoodField}
                      className="flex items-center gap-2 text-[var(--color-primary)] font-semibold py-2 px-4 rounded-lg hover:bg-[var(--color-primary-subtle)] transition-colors"
                    >
                      <Plus size={16} /> Add Another Meal
                    </button>
                  )}
                </div>
                <div className="flex gap-4 items-center">
                  {editingMeal ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="w-full sm:w-auto bg-transparent border-2 border-[var(--color-border-default)] hover:bg-[var(--color-bg-interactive-subtle)] text-[var(--color-text-strong)] py-2 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <X size={16} /> Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-40 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-on-primary)] py-2.5 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:transform-none disabled:shadow-md"
                      >
                        {isSubmitting ? (
                          <Loader className="animate-spin" />
                        ) : (
                          "Update Meal"
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-40 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-on-primary)] py-2.5 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-60 disabled:transform-none disabled:shadow-md"
                    >
                      {isSubmitting ? (
                        <Loader className="animate-spin" />
                      ) : (
                        "Log Meal"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.form>

            {/* --- DESIGN UPDATE: Recently Logged Section --- */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] rounded-2xl shadow-lg p-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <h3 className="text-xl font-[var(--font-primary)] font-semibold text-[var(--color-text-strong)] mb-4 sm:mb-0">
                  Recently Logged
                </h3>
                <div className="relative w-full sm:w-64">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                    size={18}
                  />
                  <input
                    type="date"
                    value={searchDate}
                    max={new Date().toLocaleDateString("en-CA")}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setSearchDate(newDate);
                      searchByDate(
                        newDate || new Date().toISOString().split("T")[0]
                      );
                    }}
                    className="w-full bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] rounded-lg pl-10 pr-4 py-2 text-[var(--color-text-default)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                  />
                </div>
              </div>

              {isFetching ? (
                <div className="flex items-center justify-center p-12 text-center text-[var(--color-text-muted)] gap-2">
                  <Loader className="animate-spin" />
                  Loading meals...
                </div>
              ) : loggedMeals.length === 0 && !isFetching ? (
                <div className="text-[var(--color-text-default)] p-8 bg-[var(--color-bg-app)] rounded-xl border-2 border-dashed border-[var(--color-border-default)] text-center">
                  <p className="font-semibold text-lg text-[var(--color-text-strong)]">
                    No meals logged for this date.
                  </p>
                  <p className="text-sm">
                    Use the form above to add your first meal!
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-3 mb-4">
                    {categoryOrder.map(categoryDisplayName => {
                      const categoryKey = categoryDisplayName === 'All' ? 'all' : categoryDisplayName.toLowerCase().replace(/-/g, ' ');
                      const count = mealCounts[categoryKey] || 0;
                      const isActive = activeCategory === categoryKey;
                      return (
                        <button key={categoryDisplayName} onClick={() => { setActiveCategory(categoryKey); setCurrentPage(1); }} className={`relative py-2 px-4 rounded-full text-sm font-semibold transition-all duration-300 flex-shrink-0 flex items-center gap-2 group hover:shadow-lg hover:-translate-y-px ${isActive ? 'bg-[var(--color-primary)] text-[var(--color-text-on-primary)] shadow-md' : 'bg-[var(--color-bg-app)] text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]'}`}>
                          {categoryDisplayName}
                          <span className={`flex items-center justify-center text-xs font-bold rounded-full w-5 h-5 transition-colors ${isActive ? 'bg-white/20 text-white' : 'bg-[var(--color-bg-interactive-subtle)] text-[var(--color-text-default)] group-hover:bg-[var(--color-primary-subtle)] group-hover:text-[var(--color-primary)]'}`}>
                            {count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <MealList
                    meals={activeCategory === 'all' ? sortedAllMeals : (mealsByCategory[activeCategory] || [])}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    mealsPerPage={MEALS_PER_PAGE}
                    activeCategory={activeCategory}
                  />

                </>
              )}
            </motion.div>
          </div>

          {/* --- UNCHANGED: Summary and Goals Panel --- */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col items-start space-y-8"
          >
            <div className="bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] rounded-2xl shadow-lg p-6 w-full">
              <h4 className="font-[var(--font-primary)] font-semibold text-xl text-[var(--color-text-strong)] mb-4">
                Today's Summary
              </h4>
              <div className="flex items-center gap-3 mb-4 border-b-2 border-dashed border-[var(--color-border-default)] pb-4">
                <span className="bg-[var(--color-warning-bg-subtle)] p-3 rounded-full text-[var(--color-warning-text)] text-2xl">
                  <FaFireAlt />
                </span>
                <div>
                  <p className="text-2xl font-bold text-[var(--color-text-strong)]">
                    {dailySummary.calories?.toFixed(0) || 0} kcal
                  </p>
                  <p className="text-sm text-[var(--color-text-default)]">
                    of {calorieGoal?.toFixed(0) || 2000} goal
                  </p>
                </div>
              </div>
              <div className="space-y-4 text-sm">
                {[
                  {
                    label: "Carbs",
                    value: dailySummary.carbs,
                    target: macroGoals.carbs_g,
                    color: "bg-[var(--color-accent-1-text)]",
                    icon: (
                      <FaBreadSlice className="text-[var(--color-accent-1-text)]" />
                    ),
                  },
                  {
                    label: "Protein",
                    value: dailySummary.protein,
                    target: macroGoals.protein_g,
                    color: "bg-[var(--color-primary)]",
                    icon: (
                      <FaDrumstickBite className="text-[var(--color-primary)]" />
                    ),
                  },
                  {
                    label: "Fat",
                    value: dailySummary.fat,
                    target: macroGoals.fats_g,
                    color: "bg-[var(--color-danger-text)]",
                    icon: (
                      <FaTint className="text-[var(--color-danger-text)]" />
                    ),
                  },
                  { label: "Sugar", value: dailySummary.sugar, target: macroGoals.sugar_g, color: "bg-[var(--color-info-text)]", icon: (<FaCookieBite className="text-[var(--color-info-text)]" />) },
                  { label: "Fiber", value: dailySummary.fiber, target: macroGoals.fiber_g, color: "bg-[var(--color-success-text)]", icon: (<FaAppleAlt className="text-[var(--color-success-text)]" />) }
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-[var(--color-text-strong)] flex items-center gap-2">
                        {item.icon} {item.label}
                      </span>
                      <span className="text-[var(--color-text-default)]">
                        {item.value?.toFixed(1) || "0.0"}g / {item.target}g
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[var(--color-bg-interactive-subtle)] rounded-full overflow-hidden">
                      <div
                        className={`${item.color} h-full rounded-full transition-all duration-500`}
                        style={{
                          width: `${getProgressPercent(
                            item.value,
                            item.target
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] rounded-2xl shadow-lg p-6 w-full">
              <h4 className="font-[var(--font-primary)] font-semibold text-xl text-[var(--color-text-strong)] mb-4">
                Other Goals
              </h4>
              <div className="text-base space-y-3 font-semibold text-[var(--color-text-default)]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FaGlassWhiskey className="text-[var(--color-info-text)]" />{" "}
                    Water Intake
                  </span>
                  <span>{waterGlasses} glasses</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MealLogger;