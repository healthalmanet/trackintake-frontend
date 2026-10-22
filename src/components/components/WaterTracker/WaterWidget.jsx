import React, { useState, useEffect, useMemo } from "react";
// UPDATED: Import the new hook
import useWaterTracker from "./UseWaterTracker";
import { GlassWater, AlertTriangle, RotateCw, Loader2, X, Info } from "lucide-react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { targetApi } from "../../../api/reportsApi";

const getLocalDateString = (date) => {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

// --- Animated Number Helper ---
const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const controls = animate(displayValue, value, {
        type: "spring", mass: 0.8, stiffness: 100, damping: 20,
        onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [value]); 
  return <>{displayValue}</>;
};

const WaterIntakeWidget = ({ onWaterLogged }) => {
  // Destructure state and actions from hook including isLogging and logError fallback
  const {
    selectedDate,
    setSelectedDate,
    totalIntakeMl,
    logWater,
    isLogging,
    logError,
    clearLogError,
  } = useWaterTracker();
  
  // NEW: Derive `totalGlasses` from `totalIntakeMl` for the UI to use.
  const totalGlasses = useMemo(() => Math.floor(totalIntakeMl / 250), [totalIntakeMl]);

  const [goalGlasses, setGoalGlasses] = useState(10); 
  const glassSizeML = 250;

  useEffect(() => {
    const fetchWaterGoal = async () => {
      try {
        const goalData = await targetApi(selectedDate);
        const recommendedML = goalData.water?.recommended_ml;

        if (recommendedML) {
          const calculatedGlasses = Math.round(recommendedML / glassSizeML);
          setGoalGlasses(calculatedGlasses);
        } else {
          setGoalGlasses(10);
        }
      } catch (error) {
        console.error("Failed to fetch water goal:", error);
        setGoalGlasses(10);
      }
    };

    fetchWaterGoal();
  }, [selectedDate]);

  useEffect(() => {
    const updateDateAtMidnight = () => {
      const currentDateString = getLocalDateString(new Date());
      if (selectedDate !== currentDateString) {
        setSelectedDate(currentDateString);
      }
    };

    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    const timeoutId = setTimeout(() => {
      updateDateAtMidnight();
    }, msUntilMidnight + 1000);

    return () => clearTimeout(timeoutId);
  }, [selectedDate, setSelectedDate]); 

  // Calls `logWater` with a fixed amount (250ml)
  const handleAddGlass = async () => {
    if (isLogging) return;
    const success = await logWater(250);
    if (success && typeof onWaterLogged === "function") {
      onWaterLogged();
    }
  };

  const handleRetry = async () => {
    if (isLogging) return;
    if (logError?.retry) {
      const success = await logError.retry();
      if (success && typeof onWaterLogged === "function") {
        onWaterLogged();
      }
    } else {
      handleAddGlass();
    }
  };

  return (
    <div className="w-full bg-[var(--color-bg-surface-alt)] py-16 font-[var(--font-secondary)] text-[var(--color-text-strong)] px-4 sm:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-3xl mx-auto px-6 sm:px-12 py-10 bg-[var(--color-bg-surface)] rounded-2xl shadow-2xl border-2 border-[var(--color-border-default)] transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1"
      >
        <h2 className="text-center text-2xl sm:text-3xl font-[var(--font-primary)] font-bold mb-8 text-[var(--color-text-strong)] flex items-center justify-center gap-2">
          Water Intake Tracker <GlassWater className="h-8 w-8 text-[var(--color-primary)]" />
        </h2>

        <div className="flex justify-center mb-8">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              clearLogError?.();
              setSelectedDate(e.target.value);
            }}
            max={getLocalDateString(new Date())}
            className="bg-[var(--color-bg-app)] text-[var(--color-text-strong)] border-2 border-[var(--color-border-default)] px-4 py-2 rounded-lg shadow-sm focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
          />
        </div>

        <div className="flex justify-center flex-wrap gap-4 mb-6">
          <AnimatePresence>
            {/* The UI still works perfectly as it depends on the derived `totalGlasses` */}
            {Array.from({ length: Math.max(totalGlasses, goalGlasses) }).map((_, i) => {
              const isFilled = i < totalGlasses;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`w-5 h-10 sm:w-6 sm:h-12 rounded-full border-2 overflow-hidden relative group transition-all duration-300 ${
                    isFilled ? 'border-[var(--color-primary)]' : 'border-[var(--color-border-default)] bg-[var(--color-bg-app)] hover:border-[var(--color-primary)]'
                  }`}
                  title={`Glass ${i + 1}`}
                >
                  {isFilled && (
                    <motion.div
                      className="absolute bottom-0 left-0 w-full bg-[var(--color-primary)]"
                      initial={{ height: "0%" }}
                      animate={{ height: "100%" }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <p className="text-center font-semibold text-lg text-[var(--color-text-default)] mb-2">
          <AnimatedNumber value={totalGlasses} /> {totalGlasses >= goalGlasses ? "glasses logged" : `of ${goalGlasses} glasses completed`}
        </p>

        {totalGlasses > goalGlasses && (
          <p className="text-center text-[var(--color-success-text)] font-semibold mb-4">
            You've surpassed your goal by <AnimatedNumber value={totalGlasses - goalGlasses} /> glass
            {totalGlasses - goalGlasses > 1 ? "es" : ""}!
          </p>
        )}

        {/* Fallback & Recovery Banner for Failed or Delayed Logging */}
        <AnimatePresence>
          {logError && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              className="my-5 p-4 rounded-xl border-2 border-red-500/30 bg-red-500/10 text-[var(--color-text-strong)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left shadow-sm"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-500/20 text-red-600 rounded-lg shrink-0 mt-0.5">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-600 dark:text-red-400">
                    Failed to log water intake
                  </h4>
                  <p className="text-xs text-[var(--color-text-default)] mt-0.5">
                    {logError.message || "A network or server error occurred while logging your glass."}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1 flex items-center gap-1">
                    <Info size={12} className="shrink-0 text-[var(--color-primary)]" />
                    <span>Your existing records are safe. Verify your connection and click Retry to complete logging.</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={isLogging}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  <RotateCw size={13} className={isLogging ? "animate-spin" : ""} />
                  <span>Retry ({logError.amount || 250}ml)</span>
                </button>
                <button
                  type="button"
                  onClick={clearLogError}
                  className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] rounded-lg hover:bg-[var(--color-bg-app)] transition-colors cursor-pointer"
                  title="Dismiss alert"
                  aria-label="Dismiss alert"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pending / delayed logging notice */}
        {isLogging && !logError && (
          <div className="flex items-center justify-center gap-2 text-xs text-[var(--color-primary)] font-semibold my-3 animate-pulse">
            <Loader2 size={14} className="animate-spin" />
            <span>Connecting to server and recording your intake...</span>
          </div>
        )}

        <div className="flex justify-center mt-6">
          <motion.button
            onClick={handleAddGlass}
            disabled={isLogging}
            whileHover={!isLogging ? { scale: 1.05, y: -2 } : {}}
            whileTap={!isLogging ? { scale: 0.95 } : {}}
            className={`bg-[var(--color-primary)] text-[var(--color-text-on-primary)] px-8 py-3 rounded-full font-semibold transition-all duration-300 transform shadow-lg hover:shadow-xl flex items-center gap-2 ${
              isLogging ? "opacity-75 cursor-not-allowed" : "hover:bg-[var(--color-primary-hover)] cursor-pointer"
            }`}
          >
            {isLogging ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Logging Glass...</span>
              </>
            ) : (
              <>
                <GlassWater size={20} />
                <span>Add a Glass</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default WaterIntakeWidget;