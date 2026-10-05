import React, { useState, useRef, useEffect } from "react";
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  X,
  RefreshCw,
  Trash2,
  Plus,
  AlertCircle,
  Layers,
  ChevronRight,
  ChevronDown,
  Calendar,
  Clock,
  Check
} from "lucide-react";
import { toast } from "react-hot-toast";
import { scanMealPhoto, createMeal } from "../../../api/mealLog";
import {
  UNIT_GROUPS,
  UNIT_HINTS,
  getUnitHint,
  formatMealPortion,
} from "./mealPortionUtils";

const MEAL_TYPES = [
  "Early-Morning",
  "Breakfast",
  "Mid-Morning Snack",
  "Lunch",
  "Afternoon Snack",
  "Dinner",
  "Bedtime",
];

const UnitSelectDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentHint = getUnitHint(value);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-1.5 bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] hover:border-[var(--color-primary)] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--color-text-strong)] focus:outline-none transition-colors"
      >
        <span className="truncate">
          {value || "Select Unit"}
          {currentHint && (
            <span className="ml-1 text-[10px] font-normal text-[var(--color-text-muted)]">
              ({currentHint})
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className="absolute z-50 left-0 right-0 mt-1 bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] rounded-xl shadow-2xl overflow-y-auto max-h-56 py-1"
          style={{ minWidth: "180px" }}
        >
          {UNIT_GROUPS.map(({ label, units }) => (
            <div key={label}>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] bg-[var(--color-bg-app)] border-b border-[var(--color-border-default)]">
                {label}
              </div>
              {units.map((u) => {
                const isSelected = value === u.name;
                const hint = getUnitHint(u.name) || u.hint;
                return (
                  <button
                    key={u.name}
                    type="button"
                    onClick={() => {
                      onChange(u.name);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                      isSelected
                        ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold"
                        : "text-[var(--color-text-default)] hover:bg-[var(--color-bg-app)]"
                    }`}
                  >
                    <span>{u.name}</span>
                    {hint && (
                      <span className="text-[10px] text-[var(--color-text-muted)]">
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

const getCurrentTimeStr = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};

const getTodayDateStr = () => {
  return new Date().toISOString().split("T")[0];
};

const MealPhotoScannerModal = ({ isOpen, onClose, onMealLogged, onApplyToInputs }) => {
  const [mode, setMode] = useState("choose"); // "choose" | "camera" | "preview" | "review"
  const [imageSrc, setImageSrc] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Review step data
  const [isThali, setIsThali] = useState(false);
  const [overallDescription, setOverallDescription] = useState("");
  const [suggestedMealType, setSuggestedMealType] = useState("Lunch");
  const [logDate, setLogDate] = useState(getTodayDateStr());
  const [logTime, setLogTime] = useState(getCurrentTimeStr());
  const [detectedItems, setDetectedItems] = useState([]);
  const [remarks, setRemarks] = useState("");

  // Camera stream refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [cameraFacing, setCameraFacing] = useState("environment");

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setImageSrc(null);
    setImageFile(null);
    setAnalyzing(false);
    setSubmitting(false);
    setMode("choose");
    setIsThali(false);
    setOverallDescription("");
    setDetectedItems([]);
    setRemarks("");
  };

  const startCamera = async (facing = "environment") => {
    stopCameraStream();
    setMode("camera");
    try {
      const constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera access failed:", err);
      toast.error("Could not access camera. Please select a photo from your device.");
      setMode("choose");
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    stopCameraStream();

    setImageSrc(dataUrl);
    setMode("preview");
    handleAnalyze(dataUrl);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPEG, PNG, WEBP).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error("Image file is too large (maximum 15MB).");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
      setMode("preview");
      handleAnalyze(reader.result, file);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async (base64OrDataUrl, fileObj = null) => {
    setAnalyzing(true);
    try {
      let payload;
      if (fileObj) {
        payload = new FormData();
        payload.append("image", fileObj);
      } else {
        payload = { image_base64: base64OrDataUrl };
      }

      const res = await scanMealPhoto(payload);
      if (res && res.items && res.items.length > 0) {
        setIsThali(Boolean(res.is_thali));
        setOverallDescription(res.overall_description || "Detected meal items.");
        if (res.suggested_meal_type && MEAL_TYPES.includes(res.suggested_meal_type)) {
          setSuggestedMealType(res.suggested_meal_type);
        }
        setDetectedItems(
          res.items.map((item, idx) => ({
            id: `item_${Date.now()}_${idx}`,
            food_item_id: item.food_item_id || null,
            food_name: item.food_name || "Food Item",
            quantity: item.quantity || 1,
            unit: item.unit || "Bowl",
            portion_size: item.portion_size || "Medium",
            exact_grams: item.gram_equivalent || "",
            exact_ml: "",
            showExactOverride: false,
            calories: item.calories || 0,
            protein: item.protein || 0,
            carbs: item.carbs || 0,
            fats: item.fats || 0,
            fiber: item.fiber || 0,
            description: item.description || "",
            is_thali_component: Boolean(res.is_thali),
          }))
        );
        setMode("review");
        toast.success(
          res.is_thali
            ? `🍱 Detected Thali with ${res.items.length} items! Verified & saved to catalog.`
            : `✨ Recognized ${res.items.length} dish(es) with complete nutrition!`,
          { icon: "✨" }
        );
      } else {
        toast.error("No food items recognized. Please provide a clearer photo of your plate.");
        setMode("preview");
      }
    } catch (err) {
      console.error("Gemini Vision analysis error:", err);
      toast.error(
        err.response?.data?.error || "Gemini could not process this image. Please try again."
      );
      setMode("preview");
    } finally {
      setAnalyzing(false);
    }
  };

  const updateItem = (id, field, value) => {
    setDetectedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeItem = (id) => {
    if (detectedItems.length === 1) {
      toast.error("At least one food item is required to log.");
      return;
    }
    setDetectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addItem = () => {
    setDetectedItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}_${prev.length}`,
        food_item_id: null,
        food_name: "",
        quantity: 1,
        unit: "Bowl",
        portion_size: "Medium",
        exact_grams: "",
        exact_ml: "",
        showExactOverride: false,
        calories: 100,
        protein: 3,
        carbs: 15,
        fats: 2,
        fiber: 1,
        description: "",
      },
    ]);
  };

  const handleConfirmAndLog = async () => {
    const validItems = detectedItems.filter(
      (item) => item.food_name.trim() && parseFloat(item.quantity) > 0
    );

    if (validItems.length === 0) {
      toast.error("Please enter a valid food name and quantity for at least one item.");
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const consumedAt = new Date(`${logDate}T${logTime}:00`).toISOString();
      const payloads = validItems.map((item) => {
        let finalQty = parseFloat(item.quantity) || 1;
        let finalUnit = item.unit || "Bowl";

        if (item.exact_grams && parseFloat(item.exact_grams) > 0) {
          finalQty = parseFloat(item.exact_grams);
          finalUnit = "Gram";
        } else if (item.exact_ml && parseFloat(item.exact_ml) > 0) {
          finalQty = parseFloat(item.exact_ml);
          finalUnit = "Milliliters";
        }

        return {
          food_name: item.food_name.trim(),
          quantity: finalQty,
          unit: finalUnit,
          portion_size: item.portion_size || "Medium",
          meal_type: suggestedMealType,
          remarks:
            remarks ||
            item.description ||
            (isThali ? `Thali item: ${item.food_name}` : "Logged via photo capture"),
          date: logDate,
          consumed_at: consumedAt,
        };
      });

      await createMeal(payloads.length === 1 ? payloads[0] : payloads, token);
      toast.success(
        `Successfully logged ${payloads.length} item(s) for ${suggestedMealType}!`,
        { icon: <CheckCircle2 className="text-[var(--color-success-text)]" /> }
      );

      if (onMealLogged) {
        onMealLogged(logDate);
      }
      onClose();
    } catch (err) {
      console.error("Error creating meals from photo:", err);
      toast.error(err.response?.data?.error || "Failed to log meal. Please check inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyToForm = () => {
    if (onApplyToInputs) {
      onApplyToInputs({
        items: detectedItems,
        mealType: suggestedMealType,
        date: logDate,
        time: logTime,
        remarks: remarks || overallDescription,
        isThali: isThali,
      });
      toast.success("Filled detected items into your meal form!");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 overflow-y-auto">
      <div
        className="relative w-full max-w-3xl bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[var(--color-border-default)] bg-[var(--color-bg-app)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--color-text-strong)]">
                  Log Meal from Photo
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[var(--color-primary-subtle)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                  Gemini 2.5 Flash
                </span>
                {isThali && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    🍱 Multi-Dish Thali
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Take a live photo or upload an image to identify dishes, portions & calculate nutrition
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] hover:bg-[var(--color-bg-surface)] border border-transparent hover:border-[var(--color-border-default)] transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-[var(--color-bg-surface)]">
          {/* STEP 1: CHOOSE LIVE CAMERA OR UPLOAD */}
          {mode === "choose" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-8">
              {/* Option A: Live Camera */}
              <button
                type="button"
                onClick={() => startCamera("environment")}
                className="group p-6 border-2 border-dashed border-[var(--color-border-default)] hover:border-[var(--color-primary)] rounded-2xl bg-[var(--color-bg-app)] hover:bg-[var(--color-primary-subtle)]/30 transition-all text-center flex flex-col items-center justify-center gap-3 cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--color-text-strong)] group-hover:text-[var(--color-primary)] transition-colors">
                    Take Live Photo
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Open device camera to snap your plate or thali
                  </p>
                </div>
                <span className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-1 mt-1">
                  Start Camera <ChevronRight className="w-4 h-4" />
                </span>
              </button>

              {/* Option B: Upload File */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group p-6 border-2 border-dashed border-[var(--color-border-default)] hover:border-[var(--color-primary)] rounded-2xl bg-[var(--color-bg-app)] hover:bg-[var(--color-primary-subtle)]/30 transition-all text-center flex flex-col items-center justify-center gap-3 cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center group-hover:scale-105 transition-transform shadow-inner">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[var(--color-text-strong)] group-hover:text-[var(--color-primary)] transition-colors">
                    Upload from Device
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Select an existing food photo from your gallery
                  </p>
                </div>
                <span className="text-xs font-semibold text-[var(--color-primary)] flex items-center gap-1 mt-1">
                  Choose Photo <ChevronRight className="w-4 h-4" />
                </span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* STEP 1.B: LIVE CAMERA VIEW */}
          {mode === "camera" && (
            <div className="space-y-4">
              <div className="relative w-full aspect-video sm:aspect-[4/3] bg-zinc-950 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-[var(--color-border-default)] shadow-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-8 border-2 border-white/50 border-dashed rounded-xl pointer-events-none flex items-center justify-center">
                  <span className="bg-black/75 px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow-md">
                    Position your plate or thali here
                  </span>
                </div>

                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="absolute top-4 right-4 p-2.5 rounded-xl bg-black/70 hover:bg-black text-white transition-colors"
                  title="Switch camera"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 py-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCameraStream();
                    setMode("choose");
                  }}
                  className="px-5 py-2.5 rounded-xl border-2 border-[var(--color-border-default)] text-sm font-semibold text-[var(--color-text-default)] hover:bg-[var(--color-bg-app)] transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" /> Capture Photo
                </button>
              </div>
            </div>
          )}

          {/* STEP 1.C: PREVIEW & PROCESSING */}
          {mode === "preview" && (
            <div className="space-y-5 text-center py-4">
              <div className="relative max-w-md mx-auto aspect-video rounded-xl overflow-hidden border-2 border-[var(--color-border-default)] bg-zinc-950 shadow-md">
                {imageSrc && (
                  <img
                    src={imageSrc}
                    alt="Meal preview"
                    className="w-full h-full object-cover"
                  />
                )}

                {analyzing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-6 space-y-3">
                    <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin"></div>
                    <h4 className="font-bold text-base">Gemini 2.5 Flash is Analyzing...</h4>
                    <p className="text-xs text-white/80 max-w-sm">
                      Detecting dishes, estimating portions, and synchronizing with your clinical food database
                    </p>
                  </div>
                )}
              </div>

              {!analyzing && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setImageSrc(null);
                      setImageFile(null);
                      setMode("choose");
                    }}
                    className="px-4 py-2 rounded-xl border-2 border-[var(--color-border-default)] text-xs font-semibold text-[var(--color-text-default)] hover:bg-[var(--color-bg-app)] transition-colors"
                  >
                    Retake Photo
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAnalyze(imageSrc, imageFile)}
                    className="px-5 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" /> Retry Analysis
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PROFESSIONAL REVIEW & LOGGING SCREEN */}
          {mode === "review" && (
            <div className="space-y-5">
              {/* Review Callout Box */}
              <div className="p-4 rounded-xl bg-[var(--color-primary-subtle)] border-2 border-[var(--color-primary)]/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <p className="font-bold text-[var(--color-text-strong)]">
                    Do you want to log this meal?
                  </p>
                  <p className="text-[var(--color-text-default)] mt-0.5">
                    Please check the details of your photo below. We have automatically detected the
                    items, saved any new dishes to your food database, and pre-filled the meal
                    information. If correct, confirm and enter it!
                  </p>
                </div>
              </div>

              {/* Photo & Macro Summary Header */}
              <div className="p-4 rounded-xl bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] flex flex-col sm:flex-row gap-4 items-center">
                {imageSrc && (
                  <img
                    src={imageSrc}
                    alt="Captured meal"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border-2 border-[var(--color-border-default)] shrink-0 shadow-sm"
                  />
                )}
                <div className="flex-1 w-full space-y-2 text-center sm:text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      AI Observation:
                    </span>
                    <button
                      type="button"
                      onClick={() => setMode("choose")}
                      className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw className="w-3 h-3" /> Change Photo
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-[var(--color-text-strong)]">
                    {overallDescription}
                  </p>
                </div>
              </div>

              {/* Shared Meal Settings: Meal Type, Date, Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)]">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-text-muted)] mb-1">
                    Meal Slot
                  </label>
                  <select
                    value={suggestedMealType}
                    onChange={(e) => setSuggestedMealType(e.target.value)}
                    className="w-full bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--color-text-strong)] focus:outline-none focus:border-[var(--color-primary)]"
                  >
                    {MEAL_TYPES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-text-muted)] mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={logDate}
                    max={getTodayDateStr()}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--color-text-strong)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--color-text-muted)] mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={logTime}
                    onChange={(e) => setLogTime(e.target.value)}
                    className="w-full bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--color-text-strong)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              </div>

              {/* Food Items List (Exact Log Meal Form Format) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--color-text-strong)] flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[var(--color-primary)]" />
                    {isThali ? "Thali Dishes to Log" : "Dishes to Log"} ({detectedItems.length})
                  </h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add Food Item
                  </button>
                </div>

                <div className="space-y-3">
                  {detectedItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] space-y-3 shadow-sm"
                    >
                      {/* Main Input Row: Food Name, Qty, Unit, Delete */}
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] text-xs font-extrabold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>

                        {/* Food Name */}
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.food_name}
                            onChange={(e) => updateItem(item.id, "food_name", e.target.value)}
                            placeholder={`Food ${idx + 1}`}
                            className="w-full bg-[var(--color-bg-surface)] text-[var(--color-text-strong)] border-2 border-[var(--color-border-default)] rounded-lg px-3 py-2 text-sm font-semibold placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                          />
                        </div>

                        {/* Quantity */}
                        <div className="w-20">
                          <input
                            type="number"
                            step="any"
                            min="0.1"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                            placeholder="Qty"
                            className="w-full bg-[var(--color-bg-surface)] text-[var(--color-text-strong)] border-2 border-[var(--color-border-default)] rounded-lg px-2.5 py-2 text-sm font-bold text-center focus:outline-none focus:border-[var(--color-primary)]"
                          />
                        </div>

                        {/* Unit Dropdown */}
                        <div className="w-40 sm:w-48">
                          <UnitSelectDropdown
                            value={item.unit}
                            onChange={(val) => updateItem(item.id, "unit", val)}
                          />
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Exact Weight Override Toggle & Computed Estimate Pill */}
                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            updateItem(item.id, "showExactOverride", !item.showExactOverride)
                          }
                          className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 font-medium"
                        >
                          <span>
                            {item.showExactOverride
                              ? "▾ Hide exact weight"
                              : "▸ Enter exact grams / ml (optional)"}
                          </span>
                        </button>
                      </div>

                      {/* Exact Weight Override Fields (when opened) */}
                      {item.showExactOverride && (
                        <div className="flex items-center gap-3 bg-[var(--color-bg-surface)] p-2.5 rounded-lg border border-[var(--color-border-default)]">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-[var(--color-text-muted)] block mb-0.5">
                              Exact Grams (g)
                            </label>
                            <input
                              type="number"
                              step="any"
                              placeholder="e.g. 150"
                              value={item.exact_grams || ""}
                              onChange={(e) => updateItem(item.id, "exact_grams", e.target.value)}
                              className="w-full bg-[var(--color-bg-app)] border border-[var(--color-border-default)] text-[var(--color-text-strong)] rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                            />
                          </div>
                          <span className="text-xs text-[var(--color-text-muted)] pt-3 font-bold">
                            or
                          </span>
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-[var(--color-text-muted)] block mb-0.5">
                              Exact Milliliters (ml)
                            </label>
                            <input
                              type="number"
                              step="any"
                              placeholder="e.g. 200"
                              value={item.exact_ml || ""}
                              onChange={(e) => updateItem(item.id, "exact_ml", e.target.value)}
                              className="w-full bg-[var(--color-bg-app)] border border-[var(--color-border-default)] text-[var(--color-text-strong)] rounded px-2.5 py-1 text-xs focus:outline-none focus:border-[var(--color-primary)]"
                            />
                          </div>
                        </div>
                      )}

                      {/* Remark Field (exact same as log meal) */}
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        placeholder="Remark (optional)"
                        className="w-full bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] text-[var(--color-text-strong)] rounded-lg px-3 py-1.5 text-xs placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* General Remarks */}
              <div>
                <label className="block text-[11px] font-bold text-[var(--color-text-muted)] mb-1">
                  Remarks / Notes (Optional)
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Home-cooked thali, less oil"
                  className="w-full bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] text-[var(--color-text-strong)] rounded-lg px-3 py-2 text-xs font-medium placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        {mode === "review" && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t-2 border-[var(--color-border-default)] bg-[var(--color-bg-app)]">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl border-2 border-[var(--color-border-default)] text-xs font-bold text-[var(--color-text-default)] hover:bg-[var(--color-bg-surface)] transition-colors"
              >
                Retake Photo
              </button>
              {onApplyToInputs && (
                <button
                  type="button"
                  onClick={handleApplyToForm}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl border-2 border-[var(--color-primary)]/40 text-[var(--color-primary)] text-xs font-bold hover:bg-[var(--color-primary-subtle)] transition-colors"
                >
                  Auto-fill into Page Form
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">

              <button
                type="button"
                disabled={submitting || detectedItems.length === 0}
                onClick={handleConfirmAndLog}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-extrabold text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving Meal...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Confirm & Log Meal
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealPhotoScannerModal;
