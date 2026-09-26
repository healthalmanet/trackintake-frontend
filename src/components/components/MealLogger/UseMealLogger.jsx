// src/components/dashboard/UseMealLogger.js

import { useEffect, useState, useCallback } from "react";
import { getMeals, createMeal, deleteMeal, getMealsByDate, patchMeal, searchFoods, getRecentMeals } from "../../../api/mealLog";
import { toast } from "react-hot-toast";
import { CheckCircle, AlertTriangle, CircleHelp } from "lucide-react";
import React from "react";

// Helper functions are correctly defined outside the hook
const getLocalDateString = (date) => {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};



const useMealLogger = () => {
  // --- All useState hooks are called unconditionally at the top level ---
  // === Changes made by Ananya (Start) ===
  // Auto-select meal type based on current time
  const getMealTypeByTime = () => {
    const h = new Date().getHours();
    if (h >= 5  && h < 9)  return 'Early-Morning';
    if (h >= 9  && h < 11) return 'Breakfast';
    if (h >= 11 && h < 12) return 'Mid-Morning Snack';
    if (h >= 12 && h < 15) return 'Lunch';
    if (h >= 15 && h < 18) return 'Afternoon Snack';
    if (h >= 18 && h < 21) return 'Dinner';
    return 'Bedtime';
  };

  const getInitialFoodInput = (customDate = null, customTime = null, customMealType = null) => {
    const now = new Date();
    const currentDate = customDate || getLocalDateString(now);
    const currentTime = customTime || now.toTimeString().slice(0, 5);
    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
      foodId: "",
      name: "",
      unit: "Bowl",
      quantity: "1",
      remark: "",
      portionSize: "Medium",
      logDate: currentDate,
      logTime: currentTime,
      mealType: customMealType || getMealTypeByTime(),
      // New exact override fields
      exact_grams: '',
      exact_ml: '',
      showExactOverride: false,
      // Serving hint from search (for live preview)
      gramEquivalent: null,
      caloriesPerServing: null,
      defaultUnit: null,
    };
  };

  const [foodInputs, setFoodInputs] = useState([getInitialFoodInput()]);
  const [loggedMeals, setLoggedMeals] = useState([]);
  const [dailySummary, setDailySummary] = useState({ calories: 0, carbs: 0, protein: 0, fat: 0 });
  const [searchDate, setSearchDate] = useState(() => getLocalDateString(new Date()));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [editingMeal, setEditingMeal] = useState(null);

  // Search/autocomplete state (keep these near the top so callbacks can reference them)
  const [foodSearchResults, setFoodSearchResults] = useState({}); // { [index]: [{id,name,has_attributes}] }
  const [foodSearchLoading, setFoodSearchLoading] = useState({});
  const [foodSearchQuery, setFoodSearchQuery] = useState({});

  const [recentMeals, setRecentMeals] = useState([]);

  const unitOptions = [
    // --- Exact ---
    "Gram", "Kilogram", "Milliliter", "Liter",
    // --- Bowl ---
    "Small Bowl", "Bowl", "Big Bowl",
    // --- Plate ---
    "Small Plate", "Plate", "Big Plate",
    // --- Glass ---
    "Small Glass", "Glass", "Large Glass",
    // --- Cup ---
    "Small Cup", "Cup",
    // --- Piece ---
    "Small Piece", "Piece", "Large Piece",
    // --- Slice & Spoon ---
    "Slice", "Tbsp", "Tsp",
    // --- Indian ---
    "Katori", "Vati", "Karchi", "Muthhi", "Handful", "Thali",
    // --- Misc ---
    "Pinch", "Other",
  ];
  const mealTypeOptions = ["Early-Morning", "Breakfast", "Mid-Morning Snack", "Lunch", "Afternoon Snack", "Dinner", "Bedtime"];

  // Fetch recent meals for quick re-log chips
  const fetchRecentMeals = useCallback(async () => {
    try {
      const data = await getRecentMeals();
      setRecentMeals(data?.recent || []);
    } catch (e) {
      // silently fail — recent meals are a convenience feature
    }
  }, []);

  useEffect(() => { fetchRecentMeals(); }, [fetchRecentMeals]);

  // --- All useEffect and useCallback hooks are also called unconditionally ---
  useEffect(() => {
    const updateDateAtMidnight = () => {
      const currentDateString = getLocalDateString(new Date());
      setSearchDate(currentDateString);
    };
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    const timeoutId = setTimeout(updateDateAtMidnight, msUntilMidnight + 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  const fetchMeals = useCallback(async (dateOverride) => {
    const effectiveDate = dateOverride ?? searchDate;
    console.log("[MealLogger] fetchMeals() start", { searchDate, effectiveDate });
    setIsFetching(true);
    let allResults = [];
    let page = 1;

    try {
      // 1. START the fetch using the function designed for date filtering.
      // NOTE: Backend paginated response is expected to have { results, next }.
      // Some implementations may return a plain array. Support both.
      const rawResponse = await getMealsByDate(effectiveDate);
      console.log("[MealLogger] fetchMeals() raw getMealsByDate response", {
        searchDate,
        rawResponse,
      });
      allResults = Array.isArray(rawResponse) ? rawResponse : (rawResponse?.results || []);
      console.log("[MealLogger] fetchMeals() allResults length (pre-pagination)", { length: allResults.length });

      // 2. Get the 'next' URL, which will correctly contain the date filter.
      let nextUrl = rawResponse?.next;
      console.log("[MealLogger] fetchMeals() nextUrl", { nextUrl });


      // 3. For all SUBSEQUENT pages, use the generic paginated fetcher.
      let response = null;
      while (nextUrl) {
        // Pass the full nextUrl to the generic getMeals function.
        response = await getMeals(nextUrl);
        const pageResults = Array.isArray(response)
          ? response
          : (response?.results || []);
        allResults.push(...pageResults);
        nextUrl = response?.next;
      }

      console.log("[MealLogger] fetchMeals() setting loggedMeals", { allResultsLength: allResults.length });
      setLoggedMeals(allResults);

    } catch (error) {
      toast.error("Could not fetch meals.", { icon: <AlertTriangle className="text-[var(--color-danger-text)]" /> });
      setLoggedMeals([]);
    } finally {
      setIsFetching(false);
    }
  }, [searchDate]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  const searchByDate = useCallback((date) => {
    const newDate = date || getLocalDateString(new Date());
    setSearchDate(newDate);
  }, []);

  const addItem = (idx) => {
    setFoodInputs(prev => {
      const current = prev[idx]; // जिस index पे click हुआ
      const newItem = {
        id: Date.now(),
        name: "",             // खाली
        quantity: "",         // खाली
        unit: "",             // खाली
        remark: "",           // खाली
        portionSize: "",
        logDate: current.logDate, // copy
        logTime: current.logTime, // copy
        mealType: current.mealType, // copy
      };
      return [...prev, newItem];
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const token = localStorage.getItem("token");

    const allInputs = foodInputs.filter(input => input.name && input.quantity && input.unit && input.logDate && input.logTime);
    if (allInputs.length === 0) {
      toast.error("Please fill at least one complete food item including date and time.");
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("[MealLogger] handleSubmit(): start", {
        editingMeal: editingMeal ? editingMeal.id : null,
        allInputsCount: foodInputs.length,
        searchDate,
      });

      const getMealPayload = (input, consumedAt) => {
        let finalQty = parseFloat(input.quantity) || 1;
        let finalUnit = input.unit || "Bowl";
        let finalRemarks = input.remark || "";

        if (input.exact_grams && parseFloat(input.exact_grams) > 0) {
          finalQty = parseFloat(input.exact_grams);
          finalUnit = "Gram";
        } else if (input.exact_ml && parseFloat(input.exact_ml) > 0) {
          finalQty = parseFloat(input.exact_ml);
          finalUnit = "Milliliters";
        }

        return {
          food_name: input.name,
          quantity: finalQty,
          unit: finalUnit,
          meal_type: input.mealType,
          remarks: finalRemarks,
          ...(input.portionSize && { portion_size: input.portionSize }),
          date: input.logDate,
          consumed_at: consumedAt,
        };
      };

      if (editingMeal) {
        const input = allInputs[0];
        const consumedAt = new Date(`${input.logDate}T${input.logTime}:00`).toISOString();
        await patchMeal(editingMeal.id, getMealPayload(input, consumedAt), token);
        toast.success("Meal updated successfully!", { icon: <CheckCircle className="text-[var(--color-success-text)]" /> });
        setEditingMeal(null);
      } else {
        const payloads = allInputs.map((input) => {
          const consumedAt = new Date(`${input.logDate}T${input.logTime}:00`).toISOString();
          return getMealPayload(input, consumedAt);
        });

        await createMeal(payloads.length === 1 ? payloads[0] : payloads, token);
        toast.success(`${allInputs.length} Meal(s) logged successfully!`, { icon: <CheckCircle className="text-[var(--color-success-text)]" /> });
      }

      // Refresh using the date that was actually logged (not necessarily the current searchDate UI value).
      const refreshDate = allInputs?.[0]?.logDate;
      console.log("[MealLogger] POST completed successfully");
      console.log("[MealLogger] Refreshing for logged date", { refreshDate, searchDate });

      if (refreshDate) {
        setSearchDate(refreshDate);
        await fetchMeals(refreshDate);
      } else {
        // Fallback to current searchDate
        await fetchMeals();
      }
      setFoodInputs([getInitialFoodInput()]);
    } catch (err) {
      toast.error("Failed to save meal(s).", { icon: <AlertTriangle className="text-[var(--color-danger-text)]" /> });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMeal = (meal) => {
    setEditingMeal(meal);
    const isGram = (meal?.unit || "").toLowerCase() === "gram" || (meal?.unit || "").toLowerCase() === "g";
    const isMl = ["milliliters", "milliliter", "ml"].includes((meal?.unit || "").toLowerCase());

    const safeDate = meal?.date || (meal?.consumed_at ? new Date(meal.consumed_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    let safeTime = "12:00";
    try {
      if (meal?.consumed_at) {
        safeTime = new Date(meal.consumed_at).toTimeString().slice(0, 5);
      } else {
        safeTime = new Date().toTimeString().slice(0, 5);
      }
    } catch {
      safeTime = new Date().toTimeString().slice(0, 5);
    }

    setFoodInputs([{
      id: meal.id,
      name: meal.food_name_display || meal.food_name || "",
      foodId: meal.food_item ? String(meal.food_item) : (meal.food_item_id ? String(meal.food_item_id) : ""),
      quantity: meal.quantity || 1,
      unit: meal.unit || "Bowl",
      exact_grams: isGram ? String(meal.quantity) : "",
      exact_ml: isMl ? String(meal.quantity) : "",
      showExactOverride: isGram || isMl,
      remark: meal.remarks || "",
      portionSize: meal.selected_size || meal.portion_size || "",
      logDate: safeDate,
      logTime: safeTime,
      mealType: meal.meal_type || "Lunch",
      gramEquivalent: meal.gram_equivalent ?? null,
      caloriesPerServing: meal.calories ?? null,
    }]);
  };

  const cancelEdit = () => {
    setEditingMeal(null);
    setFoodInputs([getInitialFoodInput()]);
  };

  const handleFoodChange = (idx, field, value) => {
    setFoodInputs(prev => prev.map((input, i) => {
      if (i !== idx) return input;
      const nextInput = { ...input, [field]: value };
      if (field === "name") {
        nextInput.foodId = "";
      }
      return nextInput;
    }));
  };

  const handleSelectFood = useCallback((inputIndex, selected) => {
    const selectedId   = selected?.id   != null ? String(selected.id) : "";
    const selectedName = selected?.name || "";

    const foodDefaultUnit = selected?.default_unit ? (
      selected.default_unit.charAt(0).toUpperCase() + selected.default_unit.slice(1)
    ) : null;
    const foodDefaultQty = (selected?.default_quantity != null && Number(selected.default_quantity) > 0)
      ? String(selected.default_quantity)
      : null;

    // Store selected foodId + name + food metadata for live preview
    setFoodInputs(prev =>
      prev.map((inp, i) =>
        i === inputIndex
          ? {
            ...inp,
            foodId:             selectedId,
            name:               selectedName,
            // Auto-fill unit from food's default (e.g. Glass for Lassi) or preserve current
            unit:               foodDefaultUnit || inp.unit || "Bowl",
            quantity:           inp.quantity && inp.quantity !== "1" ? inp.quantity : (foodDefaultQty || inp.quantity || "1"),
            // Store food metadata for live nutrition preview
            gramEquivalent:     selected?.gram_equivalent     ?? null,
            caloriesPerServing: selected?.calories_per_serving ?? null,
            defaultUnit:        selected?.default_unit         ?? null,
          }
          : inp
      )
    );

    // Hide dropdown immediately.
    setFoodSearchResults(prev => ({ ...prev, [inputIndex]: [] }));
    setFoodSearchLoading(prev => ({ ...prev, [inputIndex]: false }));
  }, []);

  // Quick re-log: pre-fill form from a recent meal entry
  const handleQuickReLog = useCallback((recent) => {
    setFoodInputs(prev => {
      const updated = [...prev];
      updated[0] = {
        ...updated[0],
        name:               recent.food_name || "",
        foodId:             String(recent.food_item_id || ""),
        quantity:           String(recent.last_quantity || "1"),
        unit:               recent.last_unit  || "Bowl",
        exact_grams:        recent.last_exact_grams != null ? String(recent.last_exact_grams) : "",
        exact_ml:           recent.last_exact_ml    != null ? String(recent.last_exact_ml)    : "",
        showExactOverride:  !!(recent.last_exact_grams || recent.last_exact_ml),
        gramEquivalent:     recent.gram_equivalent ?? null,
        caloriesPerServing: recent.last_calories   ?? null,
      };
      return updated;
    });
  }, []);

  const handleFoodBlur = useCallback((inputIndex, foodName) => {
    const trimmedName = String(foodName ?? "").trim();
    if (!trimmedName) {
      return;
    }

    const currentInput = foodInputs?.[inputIndex];
    if (currentInput?.foodId) {
      return;
    }

    const results = foodSearchResults?.[inputIndex] || [];
    const exactMatch = results.find(
      (result) => String(result.name).trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (exactMatch) {
      handleSelectFood(inputIndex, exactMatch);
    }
  }, [foodInputs, foodSearchResults, handleSelectFood]);

  // Debounce timers per inputIndex so we can cancel previous requests.
  const searchTimersRef = React.useRef({});

  const debouncedSearch = useCallback((inputIndex, query) => {
    const q = String(query ?? "").trim();
    setFoodSearchQuery(prev => ({ ...prev, [inputIndex]: q }));

    // Cancel previous timer for this input.
    if (searchTimersRef.current[inputIndex]) {
      window.clearTimeout(searchTimersRef.current[inputIndex]);
      delete searchTimersRef.current[inputIndex];
    }

    // IMPORTANT: while typing, ONLY call /foods/search/.
    // Do NOT call /foods/by-name/ during typing.
    if (!q) {
      setFoodSearchResults(prev => ({ ...prev, [inputIndex]: [] }));
      setFoodSearchLoading(prev => ({ ...prev, [inputIndex]: false }));
      return;
    }

    setFoodSearchLoading(prev => ({ ...prev, [inputIndex]: true }));

    const timerId = window.setTimeout(async () => {
      try {
        const data = await searchFoods(q, 10);
        const results = Array.isArray(data?.results) ? data.results : [];
        setFoodSearchResults(prev => ({ ...prev, [inputIndex]: results }));
      } catch (e) {
        setFoodSearchResults(prev => ({ ...prev, [inputIndex]: [] }));
      } finally {
        setFoodSearchLoading(prev => ({ ...prev, [inputIndex]: false }));
      }
    }, 300);

    searchTimersRef.current[inputIndex] = timerId;
  }, []);
  // === Changes made by Ananya (End) ===


  const addFoodField = () => {
    setFoodInputs(prev => {
      const lastInput = prev[prev.length - 1];
      const inheritedDate = lastInput?.logDate || null;
      const inheritedTime = lastInput?.logTime || null;
      const inheritedMealType = lastInput?.mealType || null;
      return [...prev, getInitialFoodInput(inheritedDate, inheritedTime, inheritedMealType)];
    });
  };

  const removeFoodField = (index) => {
    setFoodInputs(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteMeal = async (id) => {
    if (!id) return toast.error("Invalid meal ID.");
    try {
      const token = localStorage.getItem("token");
      await deleteMeal(id, token);
      toast("Meal removed.", { icon: <CircleHelp className="text-[var(--color-text-default)]" /> });
      await fetchMeals();
    } catch (error) {
      toast.error("Failed to delete meal.", { icon: <AlertTriangle className="text-[var(--color-danger-text)]" /> });
    }
  };

  return {
    foodInputs, handleFoodChange, addFoodField, removeFoodField,
    mealTypeOptions, handleSubmit, unitOptions,
    loggedMeals, addItem,
    handleDeleteMeal, dailySummary, searchDate,
    setSearchDate, searchByDate, isSubmitting, isFetching,
    editingMeal, handleEditMeal, cancelEdit,
    foodSearchResults,
    foodSearchLoading,
    foodSearchQuery,
    debouncedSearch,
    handleSelectFood,
    handleFoodBlur,
    // Recent meals for quick re-log
    recentMeals,
    handleQuickReLog,
    getMealTypeByTime,
  };
};

export default useMealLogger;