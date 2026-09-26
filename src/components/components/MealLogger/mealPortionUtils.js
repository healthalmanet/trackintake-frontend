// src/components/components/MealLogger/mealPortionUtils.js

export const UNIT_HINTS = {
  // Mass & Volume
  "gram": "exact g", "grams": "exact g", "g": "exact g", "gm": "exact g", "gms": "exact g",
  "milliliter": "exact ml", "milliliters": "exact ml", "ml": "exact ml", "mls": "exact ml",
  "millilitre": "exact ml", "millilitres": "exact ml",
  "kilogram": "1000g", "kilograms": "1000g", "kg": "1000g", "kgs": "1000g",
  "liter": "1000ml", "liters": "1000ml", "l": "1000ml", "litre": "1000ml", "litres": "1000ml",
  // Bowls
  "small bowl": "~100g", "small bowls": "~100g",
  "bowl": "~150g", "bowls": "~150g",
  "big bowl": "~250g", "big bowls": "~250g",
  // Plates
  "small plate": "~200g", "small plates": "~200g",
  "plate": "~350g", "plates": "~350g",
  "big plate": "~500g", "big plates": "~500g",
  // Glasses (liquids)
  "small glass": "~150ml", "small glasses": "~150ml",
  "glass": "~250ml", "glasses": "~250ml",
  "large glass": "~350ml", "large glasses": "~350ml",
  // Cups (liquids)
  "small cup": "~120ml", "small cups": "~120ml",
  "cup": "~240ml", "cups": "~240ml",
  // Pieces & Slices
  "small piece": "~60g", "small pieces": "~60g",
  "piece": "~100g", "pieces": "~100g", "pc": "~100g", "pcs": "~100g",
  "large piece": "~150g", "large pieces": "~150g",
  "slice": "~30g", "slices": "~30g",
  // Spoons
  "tbsp": "~15g", "tablespoon": "~15g", "tablespoons": "~15g", "table spoon": "~15g",
  "tsp": "~5g", "teaspoon": "~5g", "teaspoons": "~5g", "tea spoon": "~5g",
  // Indian Traditional
  "katori": "~150g", "katoris": "~150g",
  "vati": "~100g", "vatis": "~100g",
  "thali": "~400g", "thalis": "~400g",
  "karchi": "~50g", "karchis": "~50g",
  "muthhi": "~30g", "handful": "~30g", "handfuls": "~30g",
  "roti": "~40g", "rotis": "~40g", "chapati": "~40g", "chapatis": "~40g",
  "paratha": "~80g", "parathas": "~80g", "idli": "~50g", "idlis": "~50g",
  "dosa": "~100g", "dosas": "~100g",
  // Generic Servings
  "serving": "~100g", "servings": "~100g",
  "portion": "~150g", "portions": "~150g",
  "medium": "~100g", "small": "~60g", "large": "~150g",
  "scoop": "~50g", "scoops": "~50g",
  "ounce": "~28g", "ounces": "~28g", "oz": "~28g",
  "pound": "~454g", "pounds": "~454g", "lb": "~454g", "lbs": "~454g",
  "pinch": "~0.5g",
  "other": "",
};

export const UNIT_GROUPS = [
  {
    label: "Exact Weight / Volume",
    units: [
      { name: "Gram", hint: "exact g" },
      { name: "Milliliter", hint: "exact ml" },
      { name: "Kilogram", hint: "1000g" },
      { name: "Liter", hint: "1000ml" },
    ],
  },
  {
    label: "Bowls",
    units: [
      { name: "Small Bowl", hint: "~100g" },
      { name: "Bowl", hint: "~150g" },
      { name: "Big Bowl", hint: "~250g" },
    ],
  },
  {
    label: "Plates",
    units: [
      { name: "Small Plate", hint: "~200g" },
      { name: "Plate", hint: "~350g" },
      { name: "Big Plate", hint: "~500g" },
    ],
  },
  {
    label: "Glasses (Drinks & Dairy)",
    units: [
      { name: "Small Glass", hint: "~150ml" },
      { name: "Glass", hint: "~250ml" },
      { name: "Large Glass", hint: "~350ml" },
    ],
  },
  {
    label: "Cups (Tea & Coffee)",
    units: [
      { name: "Small Cup", hint: "~120ml" },
      { name: "Cup", hint: "~240ml" },
    ],
  },
  {
    label: "Pieces & Slices",
    units: [
      { name: "Small Piece", hint: "~60g" },
      { name: "Piece", hint: "~100g" },
      { name: "Large Piece", hint: "~150g" },
      { name: "Slice", hint: "~30g" },
    ],
  },
  {
    label: "Spoons",
    units: [
      { name: "Tbsp", hint: "~15g" },
      { name: "Tsp", hint: "~5g" },
    ],
  },
  {
    label: "Indian Traditional",
    units: [
      { name: "Katori", hint: "~150g" },
      { name: "Vati", hint: "~100g" },
      { name: "Thali", hint: "~400g" },
      { name: "Karchi", hint: "~50g" },
      { name: "Muthhi", hint: "~30g" },
      { name: "Handful", hint: "~30g" },
    ],
  },
  {
    label: "Misc",
    units: [
      { name: "Serving", hint: "~100g" },
      { name: "Pinch", hint: "~0.5g" },
      { name: "Other", hint: "" },
    ],
  },
];

export const SERVING_GRAMS = {
  // Bowls
  "small bowl": 100, "bowl": 150, "big bowl": 250,
  "bowls": 150, "small bowls": 100, "big bowls": 250,
  // Plates
  "small plate": 200, "plate": 350, "big plate": 500,
  "plates": 350, "small plates": 200, "big plates": 500,
  // Glasses (liquids)
  "small glass": 150, "glass": 250, "large glass": 350,
  "glasses": 250, "small glasses": 150, "large glasses": 350,
  // Cups (liquids)
  "small cup": 120, "cup": 240,
  "cups": 240, "small cups": 120,
  // Pieces & Slices
  "small piece": 60, "piece": 100, "large piece": 150,
  "pieces": 100, "small pieces": 60, "large pieces": 150, "pc": 100, "pcs": 100,
  "slice": 30, "slices": 30,
  "item": 100, "items": 100,
  // Spoons
  "tbsp": 15, "tablespoon": 15, "tablespoons": 15, "table spoon": 15,
  "tsp": 5, "teaspoon": 5, "teaspoons": 5, "tea spoon": 5,
  // Indian Traditional
  "katori": 150, "katoris": 150,
  "vati": 100, "vatis": 100,
  "karchi": 50, "karchis": 50,
  "muthhi": 30, "handful": 30, "handfuls": 30,
  "thali": 400, "thalis": 400,
  "roti": 40, "rotis": 40, "chapati": 40, "chapatis": 40,
  "paratha": 80, "parathas": 80,
  "idli": 50, "idlis": 50,
  "dosa": 100, "dosas": 100,
  // Generic Servings
  "serving": 100, "servings": 100,
  "portion": 150, "portions": 150,
  "medium": 100, "small": 60, "large": 150,
  "scoop": 50, "scoops": 50,
  "ounce": 28, "ounces": 28, "oz": 28,
  "pound": 454, "pounds": 454, "lb": 454, "lbs": 454,
  "pinch": 0.5, "pinches": 0.5,
  "dash": 1, "can": 330, "cans": 330, "bottle": 500, "bottles": 500,
};

export const MASS_UNITS = {
  "gram": 1, "grams": 1, "g": 1, "gm": 1, "gms": 1,
  "milliliter": 1, "milliliters": 1, "ml": 1, "mls": 1, "millilitre": 1, "millilitres": 1,
  "kilogram": 1000, "kilograms": 1000, "kg": 1000, "kgs": 1000,
  "liter": 1000, "liters": 1000, "l": 1000, "litre": 1000, "litres": 1000,
};

export const LIQUID_UNITS = new Set([
  "milliliter", "milliliters", "ml", "mls", "millilitre", "millilitres",
  "liter", "liters", "l", "litre", "litres",
  "glass", "glasses", "small glass", "small glasses", "large glass", "large glasses",
  "cup", "cups", "small cup", "small cups",
  "bottle", "bottles", "can", "cans",
]);

/**
 * Returns a human-friendly portion weight / volume hint for a given unit string.
 * e.g. "Bowl" -> "~150g", "Glass" -> "~250ml", "Gram" -> "exact g"
 */
export const getUnitHint = (unit) => {
  if (!unit) return "";
  const key = unit.trim().toLowerCase();
  if (UNIT_HINTS[key]) return UNIT_HINTS[key];
  if (SERVING_GRAMS[key] != null) {
    const isLiquid = LIQUID_UNITS.has(key);
    return `~${SERVING_GRAMS[key]}${isLiquid ? "ml" : "g"}`;
  }
  return "";
};

/**
 * Formats a logged meal portion with clear gram / ml representation.
 * Examples:
 *   { quantity: 1, unit: "Bowl" } -> "1 Bowl (~150g)"
 *   { quantity: 2, unit: "Bowl" } -> "2 Bowl (~300g)"
 *   { quantity: 1, unit: "Glass" } -> "1 Glass (~250ml)"
 *   { quantity: 150, unit: "Gram" } -> "150g"
 *   { quantity: 250, unit: "Milliliters" } -> "250ml"
 */
export const formatMealPortion = (meal) => {
  if (!meal) return "";
  const qty = Number(meal.quantity != null ? meal.quantity : 1);
  const rawUnit = (meal.unit || "Bowl").trim();
  const unitLower = rawUnit.toLowerCase();

  // If already pure mass unit
  if (["gram", "grams", "g", "gm", "gms"].includes(unitLower)) {
    return `${qty}g`;
  }
  // If already pure volume unit
  if (["milliliter", "milliliters", "ml", "mls", "millilitre", "millilitres"].includes(unitLower)) {
    return `${qty}ml`;
  }
  if (["kilogram", "kilograms", "kg", "kgs"].includes(unitLower)) {
    return `${qty}kg`;
  }
  if (["liter", "liters", "l", "litre", "litres"].includes(unitLower)) {
    return `${qty}L`;
  }

  // Determine whether it's liquid or solid
  const isLiquid = LIQUID_UNITS.has(unitLower);
  const metricSuffix = isLiquid ? "ml" : "g";

  let weightVal = null;
  if (meal.effective_grams != null && Number(meal.effective_grams) > 0) {
    weightVal = Math.round(Number(meal.effective_grams));
  } else if (meal.exact_grams != null && Number(meal.exact_grams) > 0) {
    weightVal = Math.round(Number(meal.exact_grams));
  } else if (meal.exact_ml != null && Number(meal.exact_ml) > 0) {
    weightVal = Math.round(Number(meal.exact_ml));
  } else if (SERVING_GRAMS[unitLower] != null) {
    weightVal = Math.round(qty * SERVING_GRAMS[unitLower]);
  } else if (meal.gram_equivalent != null && Number(meal.gram_equivalent) > 0) {
    weightVal = Math.round(qty * Number(meal.gram_equivalent));
  } else if (meal.food_item?.gram_equivalent != null && Number(meal.food_item.gram_equivalent) > 0) {
    weightVal = Math.round(qty * Number(meal.food_item.gram_equivalent));
  }

  if (weightVal != null && weightVal > 0) {
    return `${qty} ${rawUnit} (~${weightVal}${metricSuffix})`;
  }

  return `${qty} ${rawUnit}`;
};

/**
 * Computes live estimate calories and effective grams for an input before logging.
 * Returns { effectiveG, metricUnit, kcal, display } so the UI can ALWAYS show
 * grams/ml even when calories are pending resolution.
 */
export const computeEstimate = (item) => {
  if (!item) return null;
  const { gramEquivalent, caloriesPerServing, quantity, unit, exact_grams, exact_ml } = item;

  const qty = parseFloat(quantity) > 0 ? parseFloat(quantity) : 1;
  const unitKey = (unit || "Bowl").toLowerCase().trim();
  const isLiquid = LIQUID_UNITS.has(unitKey);
  const metricUnit = isLiquid ? "ml" : "g";

  let effectiveG = null;
  if (exact_grams && parseFloat(exact_grams) > 0) {
    effectiveG = parseFloat(exact_grams);
  } else if (exact_ml && parseFloat(exact_ml) > 0) {
    effectiveG = parseFloat(exact_ml);
  } else if (MASS_UNITS[unitKey] != null) {
    effectiveG = qty * MASS_UNITS[unitKey];
  } else if (SERVING_GRAMS[unitKey] != null) {
    effectiveG = qty * SERVING_GRAMS[unitKey];
  } else if (gramEquivalent && parseFloat(gramEquivalent) > 0) {
    effectiveG = qty * parseFloat(gramEquivalent);
  }

  if (effectiveG == null || effectiveG <= 0) {
    return null;
  }

  const roundedG = Math.round(effectiveG);
  let kcal = null;
  let factor = 1;

  if (caloriesPerServing && gramEquivalent && parseFloat(gramEquivalent) > 0) {
    factor = effectiveG / parseFloat(gramEquivalent);
    kcal = Math.round(parseFloat(caloriesPerServing) * factor);
  }

  return {
    kcal,
    effectiveG: roundedG,
    factor,
    metricUnit,
    display: `${roundedG}${metricUnit}`,
  };
};
