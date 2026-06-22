// src/components/dashboard/UseMealLogger.js

import { useEffect, useState, useCallback } from "react";
import { getMeals, createMeal, deleteMeal, getMealsByDate, patchMeal, getFoodWithAttributes, createMealWithAttributes } from "../../../api/mealLog";
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
    foodId: "",
    name: "",
    unit: "",
    quantity: "",
    remark: "",
    portionSize: "",
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
  // NEW: Attributes state for food attributes system
  const [foodAttributes, setFoodAttributes] = useState({});
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [attributeLoading, setAttributeLoading] = useState({});

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

      // NEW: Validate attributes for all inputs
      for (let idx = 0; idx < foodInputs.length; idx++) {

        if (foodInputs[idx].name && foodInputs[idx].quantity && foodInputs[idx].unit) {
          const attrValidation = validateAttributes(idx);
          if (!attrValidation.valid) {
            toast.error(attrValidation.message, { icon: <AlertTriangle className="text-[var(--color-danger-text)]" /> });
            setIsSubmitting(false);
            return;
          }
        }
      }

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
          ...(input.portionSize && { portion_size: input.portionSize }),
          date: input.logDate,
          consumed_at: consumedAt,
        }, token);
        toast.success("Meal updated successfully!", { icon: <CheckCircle className="text-[var(--color-success-text)]" /> });
        setEditingMeal(null);
      } else {
        for (let idx = 0; idx < allInputs.length; idx++) {
          const input = allInputs[idx];
          const consumedAt = new Date(`${input.logDate}T${input.logTime}:00`).toISOString();

          // NEW: Check if this food has attributes
          const attrs = foodAttributes[idx] || [];
          if (attrs.length > 0) {
            // Use new endpoint that includes attributes
            const attributesArray = Object.entries(selectedAttributes[idx] || {}).map(([attributeId, optionId]) => ({
              attribute_id: parseInt(attributeId),
              option_id: optionId
            }));

            console.log("[MealLogger] About to createMealWithAttributes", { idx, input: { name: input.name, logDate: input.logDate, logTime: input.logTime } });
            await createMealWithAttributes({
              food_name: input.name,

              quantity: parseFloat(input.quantity),
              unit: input.unit,
              meal_type: input.mealType,
              remarks: input.remark,
              ...(input.portionSize && { portion_size: input.portionSize }),
              date: input.logDate,
              consumed_at: consumedAt,
              attributes: attributesArray
            });
          } else {
            // Fall back to basic meal logging for foods without attributes
            await createMeal({
              food_name: input.name,
              quantity: parseFloat(input.quantity),
              unit: input.unit,
              meal_type: input.mealType,
              remarks: input.remark,
              ...(input.portionSize && { portion_size: input.portionSize }),
              date: input.logDate,
              consumed_at: consumedAt,
            }, token);
          }
        }
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
      // NEW: Clear attributes after successful submission
      setFoodAttributes({});
      setSelectedAttributes({});
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
portionSize: meal.selected_size || meal.portion_size || "",
      logDate: meal.date,
      logTime: new Date(meal.consumed_at).toTimeString().slice(0, 5),
      mealType: meal.meal_type,
    }]);
  };

  const cancelEdit = () => {
    setEditingMeal(null);
    setFoodInputs([getInitialFoodInput()]);
  };

  // NEW: Fetch attributes ONLY when a valid numeric foodId is available
  const fetchFoodAttributes = useCallback(async (foodIdentifier, inputIndex) => {
    if (!foodIdentifier || foodIdentifier.trim() === "") {
      console.log(`[Attributes] Clearing attributes for index ${inputIndex}`);
      setFoodAttributes(prev => ({ ...prev, [inputIndex]: [] }));
      setSelectedAttributes(prev => ({ ...prev, [inputIndex]: {} }));
      setAttributeLoading(prev => ({ ...prev, [inputIndex]: false }));
      return;
    }

    console.log(`[Attributes] Fetching attributes for: "${foodIdentifier}" (index: ${inputIndex})`);
    setAttributeLoading(prev => ({ ...prev, [inputIndex]: true }));
    
    try {
      const food = await getFoodWithAttributes(foodIdentifier);
      console.log(`[Attributes] API Response:`, food);
      
      if (food && Array.isArray(food.attributes) && food.attributes.length > 0) {
        console.log(`[Attributes] ✅ Found ${food.attributes.length} attributes`);
        setFoodAttributes(prev => ({ ...prev, [inputIndex]: food.attributes }));
        setSelectedAttributes(prev => ({ ...prev, [inputIndex]: {} }));
        toast.success(`Found ${food.attributes.length} attribute(s) for ${food.name || foodIdentifier}`, {
          duration: 2,
          position: "bottom-right"
        });
      } else {
        console.log(`[Attributes] ℹ️ No attributes for this food (this is ok - you can still log it)`);
        setFoodAttributes(prev => ({ ...prev, [inputIndex]: [] }));
        setSelectedAttributes(prev => ({ ...prev, [inputIndex]: {} }));
        // Don't show a toast for missing attributes - it's normal for many foods
      }
    } catch (error) {
      console.error(`[Attributes] ❌ Error fetching attributes for "${foodIdentifier}":`, error);
      setFoodAttributes(prev => ({ ...prev, [inputIndex]: [] }));
      setSelectedAttributes(prev => ({ ...prev, [inputIndex]: {} }));
      // Show helpful message if attributes lookup fails
      toast.error(`Could not load attributes for "${foodIdentifier}" - you can still log this meal`, {
        duration: 3,
        position: "bottom-right"
      });
    } finally {
      setAttributeLoading(prev => ({ ...prev, [inputIndex]: false }));
    }
  }, []);




  // NEW: Validate required attributes
  const validateAttributes = useCallback((inputIndex) => {
    const attributes = foodAttributes[inputIndex] || [];
    const selected = selectedAttributes[inputIndex] || {};

    for (const attr of attributes) {
      if (attr.is_required && !selected[attr.attribute.id]) {
        return { valid: false, message: `Please select ${attr.attribute.name}` };
      }
    }
    return { valid: true };
  }, [foodAttributes, selectedAttributes]);

  // NEW: Handle attribute selection
  const handleAttributeSelect = useCallback((inputIndex, attributeId, optionId) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [inputIndex]: { ...prev[inputIndex], [attributeId]: optionId }
    }));
  }, []);

  const handleFoodChange = (idx, field, value) => {
    // Only update state. Attribute fetching should happen onBlur.
    setFoodInputs(prev => prev.map((input, i) => (i === idx ? { ...input, [field]: value } : input)));
  };

  // NEW: Exportable handler to fetch attributes onBlur.
  const fetchFoodAttributesOnBlur = useCallback(
    async (foodNameOrId, inputIndex) => {
      await fetchFoodAttributes(foodNameOrId, inputIndex);
    },
    [fetchFoodAttributes]
  );


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
    // NEW: Export attributes-related state and functions
    foodAttributes, selectedAttributes, attributeLoading,
    handleAttributeSelect, validateAttributes,
    fetchFoodAttributesOnBlur
  };
};

export default useMealLogger;