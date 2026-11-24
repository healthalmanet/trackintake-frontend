import React, { useState, useEffect, useCallback, useMemo } from 'react';
// --- RECHARTS IMPORTS ---
import {
  PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend, ReferenceLine
} from "recharts";
// --- ICONS ---
import { 
  FaAppleAlt, FaCoffee, FaHamburger, FaFireAlt, FaDrumstickBite, FaBreadSlice, FaTint, 
  FaCandyCane, FaSpa 
} from "react-icons/fa";
import { 
  Loader2, UtensilsCrossed, ExternalLink, Calendar, ChevronRight, 
  RefreshCw, Filter, Sparkles, AlertCircle, ArrowRight, CheckCircle2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- API imports ---
import { targetApi, targetProgressApi, weeklyTrack } from '../api/reportsApi';
import { getMealsByDateRange } from "../api/mealLog";

// --- THEME VALUES FOR CHARTS ---
const THEME_VALUES = {
  primary: '#FF7043',
  primaryHover: '#F4511E',
  accent1: '#b45309',    // Amber
  accent2: '#4338ca',    // Indigo
  textStrong: '#263238',
  textDefault: '#546E7A',
  borderDefault: '#ECEFF1',
  dangerText: '#be123c',
  teal: '#0D9488',
};

// Colors for the Pie Chart slices (5 nutrients)
const PIE_CHART_COLORS = [
  THEME_VALUES.primary, // Protein (Orange)
  THEME_VALUES.accent2, // Carbs (Indigo)
  THEME_VALUES.accent1, // Fats (Amber)
  '#EC4899',            // Sugar (Pink)
  '#10B981'             // Fiber (Green)
];

// Classes for Nutrient Cards
const NUTRIENT_CARD_CLASSES = [
  'bg-[var(--color-stat-1-bg)]', // Calories (Yellow)
  'bg-[var(--color-stat-2-bg)]', // Protein (Green)
  'bg-[var(--color-stat-3-bg)]', // Carbs (Blue)
  'bg-[var(--color-stat-4-bg)]', // Fats (Red/Orange)
  'bg-[var(--color-accent-3-bg-subtle)]', // Sugar
  'bg-[var(--color-accent-2-bg-subtle)]'  // Fiber
];

// Classes for Meal Log Icons
const MEAL_LOG_ICON_CLASSES = [
  { bg: 'bg-[var(--color-accent-1-bg-subtle)]', text: 'text-[var(--color-accent-1-text)]' },
  { bg: 'bg-[var(--color-accent-2-bg-subtle)]', text: 'text-[var(--color-accent-2-text)]' },
  { bg: 'bg-[var(--color-accent-3-bg-subtle)]', text: 'text-[var(--color-accent-3-text)]' },
  { bg: 'bg-[var(--color-info-bg-subtle)]', text: 'text-[var(--color-info-text)]' },
];

// Tabs for daily progression trend chart (Calories + each nutrient)
const METRIC_TABS = [
  { id: "calories", label: "Calories", unit: "kcal", color: THEME_VALUES.primary, goalKey: "calories" },
  { id: "protein", label: "Protein", unit: "g", color: "#FF7043", goalKey: "protein" },
  { id: "carbs", label: "Carbs", unit: "g", color: "#4338ca", goalKey: "carbs" },
  { id: "fats", label: "Fats", unit: "g", color: "#b45309", goalKey: "fats" },
  { id: "sugar", label: "Sugar", unit: "g", color: "#EC4899", goalKey: "sugar" },
  { id: "fiber", label: "Fiber", unit: "g", color: "#10B981", goalKey: "fiber" },
  { id: "all", label: "All Nutrients", unit: "g", color: null, goalKey: null },
];

// --- DATE HELPER FUNCTIONS ---
const getLocalDateString = (date) => {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

const parseDateStringAsLocal = (dateString) => {
  return new Date(`${dateString}T00:00:00`);
};

const formatDisplayDate = (dateString) => {
  if (!dateString) return "";
  const d = parseDateStringAsLocal(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const Reports = () => {
  const navigate = useNavigate();

  // Date range state — default is today
  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [activePreset, setActivePreset] = useState("today"); // "today" | "yesterday" | "7days" | "30days" | "month" | "custom"
  const [selectedMetric, setSelectedMetric] = useState("calories"); // "calories" | "protein" | "carbs" | "fats" | "sugar" | "fiber" | "all"

  // Custom inputs state
  const [customStart, setCustomStart] = useState(todayStr);
  const [customEnd, setCustomEnd] = useState(todayStr);

  // Data states
  const [recommendedTargets, setRecommendedTargets] = useState({
    calories: 2000,
    protein: 100,
    carbs: 250,
    fats: 65,
    sugar: 35,
    fiber: 30,
  });

  const [macroData, setMacroData] = useState([]);
  const [calorieProgress, setCalorieProgress] = useState([]);
  const [nutrientProgress, setNutrientProgress] = useState([]);
  const [mealData, setMealData] = useState([]);
  const [hasLoggedData, setHasLoggedData] = useState(false);
  const [daysCount, setDaysCount] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Calculate days in the active range
  const calculateDaysDiff = (start, end) => {
    try {
      const s = parseDateStringAsLocal(start);
      const e = parseDateStringAsLocal(end);
      const diffTime = Math.abs(e - s);
      return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    } catch {
      return 1;
    }
  };

  // Main data fetcher for the selected date range
  const fetchData = useCallback(async (start, end, isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Authentication token not found. Please log in.");

      const days = calculateDaysDiff(start, end);
      setDaysCount(days);

      // 1. Fetch recommended targets (using end date as anchor)
      // 2. Fetch aggregated summary for the range
      // 3. Fetch daily trend breakdown for the range
      // 4. Fetch actual logged meals for the range
      const [recommendedResponse, progressResponse, trendResponse, mealLogResponse] = await Promise.all([
        targetApi(end),
        targetProgressApi(start, end),
        weeklyTrack(end, start),
        getMealsByDateRange(start, end)
      ]);

      // Extract recommended targets (per day)
      const dailyRecCalories = recommendedResponse?.recommended_calories || 2000;
      const dailyRecProtein = recommendedResponse?.macronutrients?.protein_g || 100;
      const dailyRecCarbs = recommendedResponse?.macronutrients?.carbs_g || 250;
      const dailyRecFats = recommendedResponse?.macronutrients?.fats_g || 65;
      const dailyRecSugar = recommendedResponse?.macronutrients?.sugar_g || 35;
      const dailyRecFiber = recommendedResponse?.macronutrients?.fiber_g || 30;

      setRecommendedTargets({
        calories: dailyRecCalories,
        protein: dailyRecProtein,
        carbs: dailyRecCarbs,
        fats: dailyRecFats,
        sugar: dailyRecSugar,
        fiber: dailyRecFiber,
      });

      // Total consumed in range
      const prog_calories = progressResponse?.calories || 0;
      const prog_protein = progressResponse?.protein || 0;
      const prog_carbs = progressResponse?.carbs || 0;
      const prog_fats = progressResponse?.fats || 0;
      const prog_sugar = progressResponse?.sugar || 0;
      const prog_fiber = progressResponse?.fiber || 0;

      setHasLoggedData(prog_calories > 0);

      // Period goals (scaled by number of days)
      const periodGoalCalories = dailyRecCalories * days;
      const periodGoalProtein = dailyRecProtein * days;
      const periodGoalCarbs = dailyRecCarbs * days;
      const periodGoalFats = dailyRecFats * days;
      const periodGoalSugar = dailyRecSugar * days;
      const periodGoalFiber = dailyRecFiber * days;

      // 1. Macro Pie Chart data (5 nutrients)
      setMacroData([
        { name: "Protein", value: prog_protein },
        { name: "Carbs", value: prog_carbs },
        { name: "Fats", value: prog_fats },
        { name: "Sugar", value: prog_sugar },
        { name: "Fiber", value: prog_fiber }
      ]);

      // 2. Trend Line Chart (saves all nutrients so user can toggle any metric)
      if (Array.isArray(trendResponse)) {
        setCalorieProgress(trendResponse.map(day => ({
          name: parseDateStringAsLocal(day.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          calories: Math.round(day.calories || 0),
          protein: Number(Number(day.protein || 0).toFixed(1)),
          carbs: Number(Number(day.carbs || 0).toFixed(1)),
          fats: Number(Number(day.fats || 0).toFixed(1)),
          sugar: Number(Number(day.sugar || 0).toFixed(1)),
          fiber: Number(Number(day.fiber || 0).toFixed(1)),
          goal: dailyRecCalories,
        })));
      } else {
        setCalorieProgress([]);
      }

      // 3. Nutrient Cards
      const avgSuffix = days > 1 ? ` (Avg: ${(prog_calories / days).toFixed(0)}/d)` : "";
      setNutrientProgress([
        { 
          key: "calories",
          title: "Calories", 
          current: prog_calories, 
          goal: periodGoalCalories, 
          value: `${Math.round(prog_calories)} kcal`, 
          goalFormatted: `${Math.round(periodGoalCalories)} kcal`,
          subtext: avgSuffix,
          percentage: periodGoalCalories > 0 ? Math.round((prog_calories / periodGoalCalories) * 100) : 0, 
          icon: <FaFireAlt className="text-xl text-[var(--color-primary)]" /> 
        },
        { 
          key: "protein",
          title: "Protein", 
          current: prog_protein, 
          goal: periodGoalProtein, 
          value: `${prog_protein.toFixed(1)}g`, 
          goalFormatted: `${periodGoalProtein.toFixed(0)}g`,
          subtext: days > 1 ? ` (Avg: ${(prog_protein / days).toFixed(1)}g/d)` : "",
          percentage: periodGoalProtein > 0 ? Math.round((prog_protein / periodGoalProtein) * 100) : 0, 
          icon: <FaDrumstickBite className="text-xl text-[var(--color-primary)]" /> 
        },
        { 
          key: "carbs",
          title: "Carbs", 
          current: prog_carbs, 
          goal: periodGoalCarbs, 
          value: `${prog_carbs.toFixed(1)}g`, 
          goalFormatted: `${periodGoalCarbs.toFixed(0)}g`,
          subtext: days > 1 ? ` (Avg: ${(prog_carbs / days).toFixed(1)}g/d)` : "",
          percentage: periodGoalCarbs > 0 ? Math.round((prog_carbs / periodGoalCarbs) * 100) : 0, 
          icon: <FaBreadSlice className="text-xl text-[var(--color-primary)]" /> 
        },
        { 
          key: "fats",
          title: "Fats", 
          current: prog_fats, 
          goal: periodGoalFats, 
          value: `${prog_fats.toFixed(1)}g`, 
          goalFormatted: `${periodGoalFats.toFixed(0)}g`,
          subtext: days > 1 ? ` (Avg: ${(prog_fats / days).toFixed(1)}g/d)` : "",
          percentage: periodGoalFats > 0 ? Math.round((prog_fats / periodGoalFats) * 100) : 0, 
          icon: <FaTint className="text-xl text-[var(--color-primary)]" /> 
        },
        { 
          key: "sugar",
          title: "Sugar", 
          current: prog_sugar, 
          goal: periodGoalSugar, 
          value: `${prog_sugar.toFixed(1)}g`, 
          goalFormatted: `${periodGoalSugar.toFixed(0)}g`,
          subtext: days > 1 ? ` (Avg: ${(prog_sugar / days).toFixed(1)}g/d)` : "",
          percentage: periodGoalSugar > 0 ? Math.round((prog_sugar / periodGoalSugar) * 100) : 0, 
          icon: <FaCandyCane className="text-xl text-[var(--color-primary)]" /> 
        },
        { 
          key: "fiber",
          title: "Fiber", 
          current: prog_fiber, 
          goal: periodGoalFiber, 
          value: `${prog_fiber.toFixed(1)}g`, 
          goalFormatted: `${periodGoalFiber.toFixed(0)}g`,
          subtext: days > 1 ? ` (Avg: ${(prog_fiber / days).toFixed(1)}g/d)` : "",
          percentage: periodGoalFiber > 0 ? Math.round((prog_fiber / periodGoalFiber) * 100) : 0, 
          icon: <FaSpa className="text-xl text-[var(--color-primary)]" /> 
        }
      ]);

      // 4. Meal Log items
      const rawMeals = Array.isArray(mealLogResponse) 
        ? mealLogResponse 
        : (mealLogResponse?.results || []);

      setMealData(
        rawMeals
          .sort((a, b) => new Date(b.consumed_at || b.date) - new Date(a.consumed_at || a.date))
          .map(meal => {
            const mealTime = meal.consumed_at ? new Date(meal.consumed_at) : null;
            return {
              id: meal.id,
              title: (meal.meal_type || "Meal").charAt(0).toUpperCase() + (meal.meal_type || "Meal").slice(1),
              meal: meal.food_name || "Food Item",
              quantity: `${meal.quantity || 1} ${meal.unit || "serving"}`,
              calories: `${Math.round(meal.calories || 0)} kcal`,
              time: mealTime 
                ? mealTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) 
                : "—",
              date: meal.date ? formatDisplayDate(meal.date) : (mealTime ? formatDisplayDate(getLocalDateString(mealTime)) : "")
            };
          })
      );

    } catch (err) {
      console.error("Failed to load reports:", err);
      setError(err.message || "Failed to load report data. Please try again later.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load: Today by default
  useEffect(() => {
    fetchData(startDate, endDate);
  }, [fetchData, startDate, endDate]);

  // Handle Preset Clicks
  const handleSelectPreset = (preset) => {
    setActivePreset(preset);
    const today = new Date();
    const todayFormatted = getLocalDateString(today);

    if (preset === "today") {
      setStartDate(todayFormatted);
      setEndDate(todayFormatted);
      setCustomStart(todayFormatted);
      setCustomEnd(todayFormatted);
    } else if (preset === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yFormatted = getLocalDateString(y);
      setStartDate(yFormatted);
      setEndDate(yFormatted);
      setCustomStart(yFormatted);
      setCustomEnd(yFormatted);
    } else if (preset === "7days") {
      const d = new Date();
      d.setDate(d.getDate() - 6);
      const sFormatted = getLocalDateString(d);
      setStartDate(sFormatted);
      setEndDate(todayFormatted);
      setCustomStart(sFormatted);
      setCustomEnd(todayFormatted);
    } else if (preset === "30days") {
      const d = new Date();
      d.setDate(d.getDate() - 29);
      const sFormatted = getLocalDateString(d);
      setStartDate(sFormatted);
      setEndDate(todayFormatted);
      setCustomStart(sFormatted);
      setCustomEnd(todayFormatted);
    } else if (preset === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const sFormatted = getLocalDateString(firstDay);
      setStartDate(sFormatted);
      setEndDate(todayFormatted);
      setCustomStart(sFormatted);
      setCustomEnd(todayFormatted);
    } else if (preset === "custom") {
      // Keep existing custom inputs or open date pickers
    }
  };

  // Handle Custom Range Apply
  const handleApplyCustomRange = (e) => {
    e?.preventDefault();
    if (!customStart || !customEnd) return;
    let s = customStart;
    let eDate = customEnd;
    if (s > eDate) {
      // Swap if start is later than end
      const temp = s;
      s = eDate;
      eDate = temp;
      setCustomStart(s);
      setCustomEnd(eDate);
    }
    setStartDate(s);
    setEndDate(eDate);
    setActivePreset("custom");
  };

  const handleNavigateToFullLog = () => {
    navigate('/dashboard/tools/meal-log');
  };

  const getIcon = (title) => {
    const key = (title || "").toLowerCase();
    if (key.includes("breakfast") || key.includes("morning")) return <FaCoffee />;
    if (key.includes("snack")) return <FaAppleAlt />;
    if (key.includes("lunch")) return <FaHamburger />;
    if (key.includes("dinner")) return <FaDrumstickBite />;
    return <FaAppleAlt />;
  };

  // Bar chart comparison data (Macronutrients + Sugar + Fiber)
  const barChartData = nutrientProgress
    .filter(item => item.title !== "Calories")
    .map((item) => ({ 
      name: item.title, 
      "Consumed (g)": Number(item.current.toFixed(1)), 
      "Goal (g)": Number(item.goal.toFixed(1)) 
    }));

  // Dynamic Range Title
  const isSingleDay = startDate === endDate;
  const isTodayActive = isSingleDay && startDate === todayStr;

  const activeMetricTab = METRIC_TABS.find(t => t.id === selectedMetric) || METRIC_TABS[0];
  const currentTargetVal = activeMetricTab.goalKey ? Number(recommendedTargets[activeMetricTab.goalKey] || 0) : 0;
  const activeNutrientObj = nutrientProgress.find(n => n.key === selectedMetric);

  const rangeTitleText = isTodayActive 
    ? "Today's Progress"
    : isSingleDay 
    ? `Progress for ${formatDisplayDate(startDate)}`
    : `Progress Report: ${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`;

  const totalPeriodGoal = recommendedTargets.calories * daysCount;

  return (
    <div className="bg-[var(--color-bg-app)] min-h-screen">
      <main className="text-[var(--color-text-default)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto font-[var(--font-secondary)] space-y-6">
        
        {/* ── Top Header & Date Range Controller ── */}
        <div className="bg-[var(--color-bg-surface)] p-5 sm:p-6 rounded-3xl border border-[var(--color-border-default)] shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)]">
                  <Calendar size={13} />
                  <span>{isTodayActive ? "Today" : `${daysCount} Day${daysCount > 1 ? "s" : ""}`}</span>
                </span>
                <span className="text-xs font-bold text-[var(--color-text-muted)]">
                  {isSingleDay ? formatDisplayDate(startDate) : `${formatDisplayDate(startDate)} → ${formatDisplayDate(endDate)}`}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)] mt-1.5">
                {rangeTitleText}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-0.5">
                {isSingleDay ? (
                  <>Daily Calorie Goal: <strong className="text-[var(--color-primary)]">{recommendedTargets.calories} kcal</strong></>
                ) : (
                  <>
                    Period Calorie Goal: <strong className="text-[var(--color-primary)]">{totalPeriodGoal.toLocaleString()} kcal</strong> 
                    <span className="opacity-60 ml-2">({recommendedTargets.calories} kcal / day target)</span>
                  </>
                )}
              </p>
            </div>

            {/* Quick Refresh */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={() => fetchData(startDate, endDate, true)}
                disabled={isLoading || isRefreshing}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] hover:bg-[var(--color-bg-interactive-subtle)] hover:text-[var(--color-primary)] text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                title="Refresh Report Data"
              >
                <RefreshCw size={13} className={isRefreshing ? "animate-spin text-[var(--color-primary)]" : ""} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* ── Preset Buttons Filter Bar ── */}
          <div className="pt-2 border-t border-[var(--color-border-default)] flex flex-wrap items-center gap-2">
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "7days", label: "Last 7 Days" },
              { id: "30days", label: "Last 30 Days" },
              { id: "month", label: "This Month" },
              { id: "custom", label: "Custom Range" },
            ].map(preset => {
              const isActive = activePreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-[var(--color-primary)] text-white shadow-xs"
                      : "bg-[var(--color-bg-app)] text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] border border-[var(--color-border-default)]"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* ── Custom Date Pickers (Shown when custom preset is chosen) ── */}
          {activePreset === "custom" && (
            <form onSubmit={handleApplyCustomRange} className="p-4 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] flex flex-wrap items-end gap-3 animate-fade-in">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-[11px] font-bold text-[var(--color-text-muted)] uppercase mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={customStart}
                  max={todayStr}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-xs font-semibold text-[var(--color-text-strong)] focus:outline-none focus:border-[var(--color-primary)] shadow-xs"
                  required
                />
              </div>

              <div className="flex-1 min-w-[140px]">
                <label className="block text-[11px] font-bold text-[var(--color-text-muted)] uppercase mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={customEnd}
                  max={todayStr}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] text-xs font-semibold text-[var(--color-text-strong)] focus:outline-none focus:border-[var(--color-primary)] shadow-xs"
                  required
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <Filter size={13} />
                <span>Apply Range</span>
              </button>
            </form>
          )}
        </div>

        {/* ── Loading Spinner State ── */}
        {isLoading ? (
          <div className="p-20 text-center bg-[var(--color-bg-surface)] rounded-3xl border border-[var(--color-border-default)] shadow-xs">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)] mx-auto mb-3" />
            <p className="text-sm font-bold text-[var(--color-text-strong)] font-[var(--font-primary)]">
              Loading progress report...
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Calculating nutritional metrics for {isSingleDay ? formatDisplayDate(startDate) : `${formatDisplayDate(startDate)} to ${formatDisplayDate(endDate)}`}
            </p>
          </div>
        ) : error ? (
          <div className="p-12 text-center bg-[var(--color-bg-surface)] rounded-3xl border border-rose-200 shadow-xs space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-rose-700">{error}</p>
            <button
              onClick={() => fetchData(startDate, endDate)}
              className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold"
            >
              Retry
            </button>
          </div>
        ) : !hasLoggedData && mealData.length === 0 ? (
          /* ── Empty State for Range with Date Picker Kept Accessible ── */
          <div className="p-12 sm:p-16 text-center bg-[var(--color-bg-surface)] rounded-3xl border border-[var(--color-border-default)] shadow-xs space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] flex items-center justify-center mx-auto border border-[var(--color-border-hover)]">
              <UtensilsCrossed size={32} />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
              No Meals Logged {isTodayActive ? "Today" : "For This Period"}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
              {isTodayActive ? (
                <>Log your first meal for <strong className="text-[var(--color-text-strong)]">{formatDisplayDate(startDate)}</strong> to start seeing your progress, calories, and macros.</>
              ) : (
                <>No food intake was recorded between <strong className="text-[var(--color-text-strong)]">{formatDisplayDate(startDate)}</strong> and <strong className="text-[var(--color-text-strong)]">{formatDisplayDate(endDate)}</strong>. Use the filters above to check other dates or log meals.</>
              )}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleNavigateToFullLog}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Log a Meal</span>
              </button>
              {!isTodayActive && (
                <button
                  onClick={() => handleSelectPreset("today")}
                  className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-[var(--color-bg-app)] hover:bg-[var(--color-bg-interactive-subtle)] text-[var(--color-text-strong)] border border-[var(--color-border-default)] text-xs font-bold transition-all cursor-pointer"
                >
                  <span>Return to Today</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ── Main Dashboard Content When Data Exists ── */
          <>
            {/* Section 1: Grid Layout for 6 Nutrient Cards */}
            <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
              {nutrientProgress.map((item, idx) => {
                const isSelected = selectedMetric === item.key;
                return (
                  <button 
                    key={idx}
                    type="button"
                    onClick={() => setSelectedMetric(item.key)}
                    className={`group p-4 sm:p-5 rounded-3xl border text-left transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer relative overflow-hidden ${
                      isSelected 
                        ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] shadow-md" 
                        : "border-[var(--color-border-default)] hover:border-[var(--color-primary)]"
                    } ${NUTRIENT_CARD_CLASSES[idx % NUTRIENT_CARD_CLASSES.length]}`}
                    title={`Click to view ${item.title} progression trend`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-[var(--color-text-strong)] font-[var(--font-primary)] font-bold text-sm sm:text-base">
                          {item.title}
                        </h3>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                        )}
                      </div>
                      <span className="bg-white/80 dark:bg-black/20 p-2 rounded-xl shadow-xs transition-transform duration-300 group-hover:scale-110">
                        {item.icon}
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-[var(--color-text-strong)]">
                      {item.value}
                    </div>
                    <div className="text-[var(--color-text-default)] text-xs font-medium">
                      of {item.goalFormatted}
                    </div>
                    {item.subtext && (
                      <div className="text-[10px] text-[var(--color-text-muted)] font-semibold mt-0.5">
                        {item.subtext}
                      </div>
                    )}
                    
                    <div className="w-full h-2 mt-3 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[var(--color-primary)] transition-all duration-500 rounded-full" 
                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold mt-1.5">
                      <span className={isSelected ? "text-[var(--color-primary)] font-black" : "text-[var(--color-text-muted)] opacity-70"}>
                        {isSelected ? "Chart Active" : "View Trend"}
                      </span>
                      <span className="text-[var(--color-primary)]">{item.percentage}%</span>
                    </div>
                  </button>
                );
              })}
            </section>

            {/* Section 2: Progression Trend Line Chart (Standalone Full Width Div - No other card) */}
            <section className="w-full bg-[var(--color-bg-surface)] p-5 sm:p-7 rounded-3xl border border-[var(--color-border-default)] shadow-xs transition-all hover:border-[var(--color-primary)] space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--color-border-default)]">
                <div>
                  <h2 className="text-[var(--color-text-strong)] font-[var(--font-primary)] font-bold text-lg sm:text-xl flex items-center gap-2.5">
                    <span>{activeMetricTab.id === "all" ? "Macronutrient Intake Trend" : `${activeMetricTab.label} Intake Progression`}</span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)]">
                      {activeMetricTab.unit}
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-0.5">
                    {isSingleDay 
                      ? `Recorded ${activeMetricTab.label.toLowerCase()} intake vs daily target for ${formatDisplayDate(startDate)}` 
                      : `Daily intake trend vs recommended target line across ${daysCount} days (${formatDisplayDate(startDate)} → ${formatDisplayDate(endDate)})`}
                  </p>
                </div>

                {/* Metric Switcher Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 max-w-full shrink-0">
                  {METRIC_TABS.map(tab => {
                    const isTabActive = selectedMetric === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedMetric(tab.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          isTabActive
                            ? "bg-[var(--color-primary)] text-white shadow-xs"
                            : "bg-[var(--color-bg-app)] text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] border border-[var(--color-border-default)] hover:border-[var(--color-primary)]"
                        }`}
                      >
                        {tab.color && (
                          <span 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: isTabActive ? "#FFFFFF" : tab.color }} 
                          />
                        )}
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chart with Target Reference Line */}
              <div className="w-full pt-2">
                <ResponsiveContainer width="100%" height={320}>
                  {selectedMetric === "all" ? (
                    <LineChart data={calorieProgress} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME_VALUES.borderDefault} />
                      <XAxis dataKey="name" stroke={THEME_VALUES.textDefault} fontSize={11} />
                      <YAxis stroke={THEME_VALUES.textDefault} fontSize={11} />
                      <Tooltip formatter={(value) => `${value}g`} />
                      <Legend verticalAlign="top" height={36} />
                      <Line type="monotone" dataKey="protein" stroke="#FF7043" strokeWidth={2.5} name="Protein (g)" dot={{ r: 3.5 }} />
                      <Line type="monotone" dataKey="carbs" stroke="#4338ca" strokeWidth={2.5} name="Carbs (g)" dot={{ r: 3.5 }} />
                      <Line type="monotone" dataKey="fats" stroke="#b45309" strokeWidth={2.5} name="Fats (g)" dot={{ r: 3.5 }} />
                      <Line type="monotone" dataKey="sugar" stroke="#EC4899" strokeWidth={2} name="Sugar (g)" dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="fiber" stroke="#10B981" strokeWidth={2} name="Fiber (g)" dot={{ r: 3 }} />
                    </LineChart>
                  ) : (
                    <LineChart data={calorieProgress} margin={{ top: 20, right: 30, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME_VALUES.borderDefault} />
                      <XAxis dataKey="name" stroke={THEME_VALUES.textDefault} fontSize={11} />
                      <YAxis 
                        stroke={THEME_VALUES.textDefault} 
                        fontSize={11}
                        domain={currentTargetVal > 0 
                          ? [0, (dataMax) => Math.ceil(Math.max(Number(dataMax || 0), currentTargetVal, 10) * 1.18)]
                          : [0, 'auto']
                        }
                      />
                      <Tooltip formatter={(value) => `${value} ${activeMetricTab.unit}`} />
                      <Legend verticalAlign="top" height={36} />
                      <Line 
                        type="monotone" 
                        dataKey={activeMetricTab.id} 
                        stroke={activeMetricTab.color || THEME_VALUES.primary} 
                        strokeWidth={3} 
                        name={`${activeMetricTab.label} Intake (${activeMetricTab.unit})`} 
                        dot={{ r: 4.5, fill: activeMetricTab.color || THEME_VALUES.primary }} 
                        activeDot={{ r: 7, stroke: activeMetricTab.color || THEME_VALUES.primary, strokeWidth: 2, fill: '#FFFFFF' }} 
                      />
                      {currentTargetVal > 0 && (
                        <ReferenceLine 
                          y={currentTargetVal} 
                          stroke="#E11D48" 
                          strokeWidth={2.5}
                          strokeDasharray="6 6"
                          label={{ 
                            value: `Target Line: ${currentTargetVal} ${activeMetricTab.unit}`, 
                            position: 'insideTopRight', 
                            fill: '#E11D48', 
                            fontSize: 12,
                            fontWeight: 700,
                            offset: 10
                          }} 
                        />
                      )}
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Informative Target Footer inside Standalone Chart */}
              <div className="pt-3 border-t border-[var(--color-border-default)] flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 flex-wrap">
                  {currentTargetVal > 0 && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20">
                      <span className="w-5 h-0.5 border-t-2 border-dashed border-rose-500 inline-block" />
                      <span>Daily Target Line: <strong>{currentTargetVal} {activeMetricTab.unit}/day</strong></span>
                    </div>
                  )}
                  {activeNutrientObj && (
                    <span className="text-[var(--color-text-muted)] font-medium">
                      Period Total: <strong className="text-[var(--color-text-strong)]">{activeNutrientObj.value}</strong> of {activeNutrientObj.goalFormatted} ({activeNutrientObj.percentage}% met)
                    </span>
                  )}
                </div>

                {daysCount > 1 && currentTargetVal > 0 && (
                  <div className="text-[var(--color-text-muted)] font-medium text-[11px]">
                    Period Target: <strong className="text-[var(--color-text-strong)]">{(currentTargetVal * daysCount).toFixed(0)} {activeMetricTab.unit}</strong> across {daysCount} days
                  </div>
                )}
              </div>
            </section>

            {/* Section 3: Macronutrient Breakdown (Pie Chart) & Nutrient Comparison (Bar Chart) */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Macro Grams Breakdown Pie Chart */}
              <div className="bg-[var(--color-bg-surface)] p-5 sm:p-6 rounded-3xl border border-[var(--color-border-default)] shadow-xs transition-all hover:border-[var(--color-primary)] flex flex-col justify-between">
                <div>
                  <div className="mb-4 text-center sm:text-left">
                    <h2 className="text-[var(--color-text-strong)] font-[var(--font-primary)] font-bold text-lg">
                      Macronutrient Breakdown
                    </h2>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Proportional distribution for {isSingleDay ? "selected day" : `${daysCount} days`}
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie 
                        data={macroData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={95} 
                        paddingAngle={4} 
                        dataKey="value" 
                        labelLine={false} 
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => { 
                          if (percent === 0) return null; 
                          const radius = innerRadius + (outerRadius - innerRadius) * 1.25; 
                          const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180)); 
                          const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180)); 
                          return (
                            <text x={x} y={y} fill={THEME_VALUES.textDefault} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight={700}>
                              {`${(percent * 100).toFixed(0)}%`}
                            </text>
                          ); 
                        }}
                      >
                        {macroData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${parseFloat(value).toFixed(1)}g`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Nutrient Intake vs Goal Bar Chart */}
              <div className="bg-[var(--color-bg-surface)] p-5 sm:p-6 rounded-3xl border border-[var(--color-border-default)] shadow-xs transition-all hover:border-[var(--color-primary)] flex flex-col justify-between">
                <div>
                  <div className="mb-4">
                    <h2 className="text-[var(--color-text-strong)] font-[var(--font-primary)] font-bold text-lg">
                      Nutrient Intake: Consumed vs Target
                    </h2>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Grams comparison for the selected period ({daysCount} day{daysCount > 1 ? "s" : ""})
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={barChartData} margin={{ top: 10, right: 25, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={THEME_VALUES.borderDefault} />
                      <XAxis dataKey="name" stroke={THEME_VALUES.textDefault} fontSize={11} />
                      <YAxis stroke={THEME_VALUES.textDefault} fontSize={11} label={{ value: 'Grams (g)', angle: -90, position: 'insideLeft', fill: THEME_VALUES.textDefault, fontSize: 11 }} />
                      <Tooltip formatter={(value) => `${Number(value).toFixed(1)}g`} />
                      <Legend />
                      <Bar dataKey="Consumed (g)" fill={THEME_VALUES.primary} radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Goal (g)" fill={THEME_VALUES.teal} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* Section 4: Logged Meals for Selected Period */}
            <section className="bg-[var(--color-bg-surface)] p-5 sm:p-6 rounded-3xl border border-[var(--color-border-default)] shadow-xs space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-[var(--color-border-default)]">
                <div>
                  <h2 className="text-[var(--color-text-strong)] font-[var(--font-primary)] font-bold text-lg">
                    Logged Meals
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {mealData.length} meal{mealData.length === 1 ? "" : "s"} recorded {isTodayActive ? "today" : "in this period"}
                  </p>
                </div>
                <button
                  onClick={handleNavigateToFullLog}
                  className="group inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] hover:underline"
                  title="Go to full detailed Meal Log page"
                >
                  <span>View Full Meal Log</span>
                  <ExternalLink size={13} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              {mealData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
                  {mealData.map((meal, index) => {
                    const iconTheme = MEAL_LOG_ICON_CLASSES[index % MEAL_LOG_ICON_CLASSES.length];
                    return (
                      <div 
                        key={meal.id || index} 
                        className="group flex items-center justify-between p-3.5 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-surface)] transition-all shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2.5 rounded-xl text-base shrink-0 ${iconTheme.bg} ${iconTheme.text}`}>
                            {getIcon(meal.title)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-[var(--color-text-strong)] truncate">
                              {meal.title}
                            </p>
                            <p className="text-xs text-[var(--color-text-default)] truncate">
                              {meal.meal} <span className="opacity-60 text-[10px]">({meal.quantity})</span>
                            </p>
                            {daysCount > 1 && meal.date && (
                              <p className="text-[10px] text-[var(--color-text-muted)] font-medium">
                                {meal.date}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-[var(--color-primary)] font-black text-xs">
                            {meal.calories}
                          </p>
                          <p className="text-[10px] text-[var(--color-text-muted)]">
                            {meal.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[var(--color-text-muted)] p-8 bg-[var(--color-bg-app)] rounded-2xl border-2 border-dashed border-[var(--color-border-default)] text-center text-xs space-y-2">
                  <p>No meals recorded in this selected range.</p>
                  <button
                    onClick={handleNavigateToFullLog}
                    className="inline-flex items-center gap-1 text-[var(--color-primary)] font-bold hover:underline"
                  >
                    <span>Log a meal now</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Reports;
