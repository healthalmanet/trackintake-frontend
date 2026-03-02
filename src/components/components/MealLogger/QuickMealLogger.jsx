// src/components/dashboard/QuickMealLogger.jsx

import React, { useState, useMemo, useEffect } from "react";
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
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  } = useMealLogger();

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

  const mealOrder = [ "Early-Morning", "Breakfast", "Mid-Morning Snack", "Lunch", "Afternoon Snack", "Dinner", "Bedtime" ];
  
  const [activeMealType, setActiveMealType] = useState("All");
  const [categoryCurrentPage, setCategoryCurrentPage] = useState(1);

  const [openMeals, setOpenMeals] = useState({});

const toggleMeal = (type) => {
  setOpenMeals(prev => ({ ...prev, [type]: !prev[type] }));
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

  const tooltipVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut",
        staggerChildren: 0.04,
      },
    },
  };

  return (
    <section className="w-full bg-[var(--color-bg-app)] px-6 sm:px-12 py-16 font-[var(--font-secondary)]">
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
            <div className="flex items-center gap-3 mb-6">
              <FaUtensils size={24} className="text-[var(--color-primary)]" />
              <h3 className="text-xl font-semibold text-[var(--color-text-strong)]">{editingMeal ? "Edit Meal" : "Add Meals"}</h3>
            </div>

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
                    <input type="text" value={item.name} onChange={(e) => handleFoodChange(index, "name", e.target.value)} placeholder={`Food ${index + 1}`} className="flex-1 bg-[var(--color-bg-app)] text-[var(--color-text-strong)] border-2 border-[var(--color-border-default)] rounded-lg px-3 py-2 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition" required />
                    <input type="number" value={item.quantity} onChange={(e) => handleFoodChange(index, "quantity", e.target.value)} placeholder="Qty" className="w-20 bg-[var(--color-bg-app)] text-[var(--color-text-strong)] border-2 border-[var(--color-border-default)] rounded-lg px-2 py-2 text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition" />
                    <select value={item.unit} onChange={(e) => handleFoodChange(index, "unit", e.target.value)} className="bg-[var(--color-bg-app)] text-[var(--color-text-strong)] border-2 border-[var(--color-border-default)] rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition">
                      <option value="">Unit</option>
                      {unitOptions.map((unit) => (<option key={unit} value={unit}>{unit}</option>))}
                    </select>
                  </div>
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
                        <label key={value} className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border-2 transition-all duration-200 ${ item.mealType === value ? "bg-[var(--color-primary)] text-[var(--color-text-on-primary)] border-[var(--color-primary)]" : "border-[var(--color-border-default)] text-[var(--color-text-default)] bg-[var(--color-bg-app)] hover:border-[var(--color-primary)] hover:text-[var(--color-text-strong)]" }`}>
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
            <div className="flex justify-center gap-3 pt-4">
              {editingMeal && (
                <button type="button" onClick={cancelEdit} className="w-full sm:w-2/5 bg-transparent border-2 border-[var(--color-border-default)] text-[var(--color-text-strong)] hover:bg-[var(--color-bg-interactive-subtle)] px-6 py-3 rounded-full text-lg font-bold font-[var(--font-primary)] transition-all duration-300 flex items-center justify-center gap-2">
                  <X size={20} /> Cancel
                </button>
              )}
              <button type="submit" disabled={isSubmitting} className={`w-full ${ editingMeal ? "sm:w-3/5" : "" } ${ editingMeal ? "bg-[var(--color-success-bg)] text-[var(--color-success-text)] hover:bg-[var(--color-success-bg-hover)]" : "bg-[var(--color-primary)] text-[var(--color-text-on-primary)] hover:bg-[var(--color-primary-hover)]" } px-6 py-3 rounded-full text-lg font-bold font-[var(--font-primary)] transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}>
                {isSubmitting ? ( <span className="flex items-center justify-center gap-2"><Loader className="animate-spin" />{editingMeal ? "Updating..." : "Logging..."}</span> ) : ( <span className="flex items-center justify-center gap-2">{editingMeal ? <FilePenLine /> : <Plus />}{editingMeal ? "Update Meal" : "Log Meal(s)"}</span> )}
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
            {isFetching ? ( <div className="flex items-center justify-center p-6 text-center text-[var(--color-text-muted)] gap-2"><Loader className="animate-spin" />Loading meals...</div> ) : (
              <div>
                <div className="flex gap-2 flex-wrap pb-4 mb-4 border-b-2 border-[var(--color-border-default)]">
                  <button onClick={() => setActiveMealType("All")} className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${ activeMealType === "All" ? "bg-[var(--color-primary)] text-[var(--color-text-on-primary)] border-[var(--color-primary)]" : "bg-[var(--color-bg-interactive-subtle)] text-[var(--color-text-default)] border-transparent hover:border-[var(--color-primary)] hover:text-[var(--color-text-strong)]" }`}>
                    All ({loggedMeals.length})
                  </button>
                  {mealOrder.map((type) => {
                    const mealsInGroup = groupedMeals[type] || [];
                    
                    const displayName = Object.keys(mealTypeMap).find((key) => mealTypeMap[key] === type) || type;
                    return ( <button key={type} onClick={() => setActiveMealType(type)} className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${ activeMealType === type ? "bg-[var(--color-primary)] text-[var(--color-text-on-primary)] border-[var(--color-primary)]" : "bg-[var(--color-bg-interactive-subtle)] text-[var(--color-text-default)] border-transparent hover:border-[var(--color-primary)] hover:text-[var(--color-text-strong)]" }`}>{displayName} ({mealsInGroup.length})</button> );
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
                {mealsInGroup.map((meal) => (
                  <motion.li
  key={meal.id}
  initial="hidden"
  whileHover="visible"
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
  layout
  className={`group flex items-center gap-4 p-3 rounded-lg border-2 shadow-sm relative transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-px ${
    style.border || "border-[var(--color-border-default)]"
  }`}
  style={{ zIndex: 0 }}
  onMouseEnter={(e) => (e.currentTarget.style.zIndex = 10)}
  onMouseLeave={(e) => (e.currentTarget.style.zIndex = 0)}
>
                    <div className={`p-3 rounded-full text-xl transition-transform group-hover:scale-110 ${style.bg} ${style.iconColor}`}>
                      <FaUtensils />
                    </div>
                    <div className="flex-1 truncate">
                      <p className="font-semibold text-[var(--color-text-strong)] text-base truncate">{meal.food_name_display}</p>
                      <p className="text-sm text-[var(--color-text-default)] capitalize">
                        {meal.meal_type || "Meal"} • {meal.quantity} {meal.unit}
                        {meal.consumed_at && (
                          <span className="text-[var(--color-text-muted)]">
                            {' • '}{new Date(meal.consumed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </p>
                      {meal.remarks && (
                        <p className="text-sm italic text-[var(--color-primary)] mt-1 truncate">"{meal.remarks}"</p>
                      )}
                    </div>

                    <motion.div
                      variants={tooltipVariants}
                      className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 p-4 bg-[var(--color-warning-bg-subtle)] backdrop-blur-sm border border-[var(--color-border-default)] rounded-xl shadow-2xl z-20 pointer-events-none"
                    >
                      <motion.div variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
                        <div className="flex items-baseline justify-between pb-2 mb-2 border-b border-dashed border-[var(--color-border-default)]">
                          <div className="flex items-center gap-2">
                            <Flame size={18} className="text-[var(--color-warning-text)]" />
                            <h4 className="font-bold text-base text-[var(--color-text-strong)]">Calories</h4>
                          </div>
                          <p className="font-extrabold text-2xl text-[var(--color-warning-text)]">
                            {parseFloat(meal.calories).toFixed(0) || 0}
                            <span className="text-sm font-medium text-[var(--color-text-muted)] ml-1">kcal</span>
                          </p>
                        </div>
                        <NutrientDetail icon={Beef} label="Protein" value={meal.protein} unit="g" colorClass="text-[var(--color-info-text)]" />
                        <NutrientDetail icon={Wheat} label="Carbs" value={meal.carbs} unit="g" colorClass="text-[var(--color-success-text)]" />
                        <NutrientDetail icon={Droplet} label="Fats" value={meal.fats} unit="g" colorClass="text-[var(--color-accent-3-text)]" />
                        <hr className="my-1.5 border-dashed border-[var(--color-border-default)]/50" />
                        <NutrientDetail icon={Candy} label="Sugar" value={meal.sugar} unit="g" />
                        <NutrientDetail icon={Leaf} label="Fiber" value={meal.fiber} unit="g" />
                      </motion.div>
                    </motion.div>

                    <div className="text-right flex items-center gap-6">
                      <button onClick={() => handleEditMeal(meal)} className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors p-1 rounded-full hover:bg-[var(--color-primary-bg-subtle)]" title="Edit">
                        <FilePenLine size={16} />
                      </button>
                      <button onClick={() => handleDeleteMeal(meal.id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-danger-text)] transition-colors p-1 rounded-full hover:bg-[var(--color-danger-bg-subtle)]" title="Remove">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.li>
                ))}
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
                          return (
                            <motion.li
                              key={meal.id}
                              initial="hidden"
                              whileHover="visible"
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                              layout
                              className={`group flex items-center gap-4 p-3 rounded-lg border-2 shadow-sm relative transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-px ${
                                style.border || "border-[var(--color-border-default)]"
                              }`}
                            >
                              <div
                                className={`p-3 rounded-full text-xl transition-transform group-hover:scale-110 ${style.bg} ${style.iconColor}`}
                              >
                                <FaUtensils />
                              </div>
                              <div className="flex-1 truncate">
                                <p className="font-semibold text-[var(--color-text-strong)] text-base truncate">
                                  {meal.food_name_display}
                                </p>
                                <p className="text-sm text-[var(--color-text-default)] capitalize">
                                  {meal.meal_type || "Meal"} • {meal.quantity}{" "}
                                  {meal.unit}
                                  {/* --- MODIFICATION START --- */}
                                  {/* Add the consumed time */}
                                  {meal.consumed_at && (
                                    <span className="text-[var(--color-text-muted)]">
                                      {' • '}
                                      {new Date(meal.consumed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                  {/* --- MODIFICATION END --- */}
                                </p>
                                {/* --- MODIFICATION START --- */}
                                {/* Conditionally render the remarks if they exist */}
                                {meal.remarks && (
                                    <p className="text-sm italic text-[var(--color-primary)] mt-1 truncate">
                                        "{meal.remarks}"
                                    </p>
                                )}
                                {/* --- MODIFICATION END --- */}
                              </div>

                              <motion.div
                                variants={tooltipVariants}
                                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 p-4 bg-[var(--color-warning-bg-subtle)] backdrop-blur-sm border border-[var(--color-border-default)] rounded-xl shadow-2xl z-20 pointer-events-none"
                              >
                                <motion.div
                                  variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
                                >
                                  <div className="flex items-baseline justify-between pb-2 mb-2 border-b border-dashed border-[var(--color-border-default)]">
                                    <div className="flex items-center gap-2">
                                      <Flame size={18} className="text-[var(--color-warning-text)]" />
                                      <h4 className="font-bold text-base text-[var(--color-text-strong)]">
                                        Calories
                                      </h4>
                                    </div>
                                    <p className="font-extrabold text-2xl text-[var(--color-warning-text)]">
                                      {parseFloat(meal.calories).toFixed(0) || 0}
                                      <span className="text-sm font-medium text-[var(--color-text-muted)] ml-1">
                                        kcal
                                      </span>
                                    </p>
                                  </div>
                                  <NutrientDetail icon={Beef} label="Protein" value={meal.protein} unit="g" colorClass="text-[var(--color-info-text)]" />
                                  <NutrientDetail icon={Wheat} label="Carbs" value={meal.carbs} unit="g" colorClass="text-[var(--color-success-text)]" />
                                  <NutrientDetail icon={Droplet} label="Fats" value={meal.fats} unit="g" colorClass="text-[var(--color-accent-3-text)]" />
                                  <hr className="my-1.5 border-dashed border-[var(--color-border-default)]/50" />
                                  <NutrientDetail icon={Candy} label="Sugar" value={meal.sugar} unit="g" />
                                  <NutrientDetail icon={Leaf} label="Fiber" value={meal.fiber} unit="g" />
                                </motion.div>
                              </motion.div>
                              <div className="text-right flex items-center gap-6">
                                <button
                                  onClick={() => handleEditMeal(meal)}
                                  className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors p-1 rounded-full hover:bg-[var(--color-primary-bg-subtle)]"
                                  title="Edit"
                                >
                                  <FilePenLine size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteMeal(meal.id)}
                                  className="text-[var(--color-text-muted)] hover:text-[var(--color-danger-text)] transition-colors p-1 rounded-full hover:bg-[var(--color-danger-bg-subtle)]"
                                  title="Remove"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </motion.li>
                          );
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
    </section>
  );
};

export default QuickMealLogger;