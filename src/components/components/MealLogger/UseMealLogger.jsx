// src/components/dashboard/UseMealLogger.js

import { useEffect, useState, useCallback } from "react";
import { getMeals, createMeal, deleteMeal, getMealsByDate, patchMeal } from "../../../api/mealLog";
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
  const getInitialFoodInput = () => ({
    id: Date.now(),
    name: "",
    unit: "",
    quantity: "",
    remark: "",
    logDate: '',
    logTime: '',
    mealType: 'Breakfast',
  });

  const [foodInputs, setFoodInputs] = useState([getInitialFoodInput()]);
  const [loggedMeals, setLoggedMeals] = useState([]);
  const [dailySummary, setDailySummary] = useState({ calories: 0, carbs: 0, protein: 0, fat: 0 });
  const [searchDate, setSearchDate] = useState(() => getLocalDateString(new Date()));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [editingMeal, setEditingMeal] = useState(null);

  const unitOptions = [//ananya
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
    "Other"
  ];
  const mealTypeOptions = ["Early-Morning", "Breakfast", "Mid-Morning Snack", "Lunch", "Afternoon Snack", "Dinner", "Bedtime"];

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

  const fetchMeals = useCallback(async () => {
    setIsFetching(true);
    let allResults = [];
    try {
      // 1. START the fetch using the function designed for date filtering.
      let response = await getMealsByDate(searchDate);
      allResults = response.results || [];

      // 2. Get the 'next' URL, which will correctly contain the date filter.
      let nextUrl = response.next;

      // 3. For all SUBSEQUENT pages, use the generic paginated fetcher.
      while (nextUrl) {
        // Pass the full nextUrl to the generic getMeals function.
        response = await getMeals(nextUrl);
        const newMeals = response.results || [];
        allResults.push(...newMeals);
        nextUrl = response.next;
      }

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
      // Logic using `editingMeal` happens AFTER all hooks are defined
      if (editingMeal) {
        const input = allInputs[0];
        const consumedAt = new Date(`${input.logDate}T${input.logTime}:00`).toISOString();
        await patchMeal(editingMeal.id, {
          food_name: input.name,
          quantity: parseFloat(input.quantity),
          unit: input.unit,
          meal_type: input.mealType,
          remarks: input.remark,
          date: input.logDate,
          consumed_at: consumedAt,
        }, token);
        toast.success("Meal updated successfully!", { icon: <CheckCircle className="text-[var(--color-success-text)]" /> });
        setEditingMeal(null);
      } else {
        for (const input of allInputs) {
          const consumedAt = new Date(`${input.logDate}T${input.logTime}:00`).toISOString();
          await createMeal({
            food_name: input.name,
            quantity: parseFloat(input.quantity),
            unit: input.unit,
            meal_type: input.mealType,
            remarks: input.remark,
            date: input.logDate,
            consumed_at: consumedAt,
          }, token);
        }
        toast.success(`${allInputs.length} Meal(s) logged successfully!`, { icon: <CheckCircle className="text-[var(--color-success-text)]" /> });
      }

      await fetchMeals();
      setFoodInputs([getInitialFoodInput()]);
    } catch (err) {
      toast.error("Failed to save meal(s).", { icon: <AlertTriangle className="text-[var(--color-danger-text)]" /> });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMeal = (meal) => {
    setEditingMeal(meal);
    setFoodInputs([{
      id: meal.id,
      name: meal.food_name_display || meal.food_name || "",
      quantity: meal.quantity,
      unit: meal.unit,
      remark: meal.remarks,
      logDate: meal.date,
      logTime: new Date(meal.consumed_at).toTimeString().slice(0, 5),
      mealType: meal.meal_type,
    }]);
  };

  const cancelEdit = () => {
    setEditingMeal(null);
    setFoodInputs([getInitialFoodInput()]);
  };

  const handleFoodChange = (idx, field, value) => {
    setFoodInputs(prev => prev.map((input, i) => (i === idx ? { ...input, [field]: value } : input)));
  };

  const addFoodField = () => {
    setFoodInputs(prev => [...prev, getInitialFoodInput()]);
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
  };
};

export default useMealLogger;