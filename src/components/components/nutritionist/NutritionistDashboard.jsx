import React, { useState, useEffect, useCallback } from "react";
import Select from "react-select";
import {
  createUserPatient,
  getAssignedPatients,
  // searchUsersByName is deprecated in favor of a unified fetch
  getPatientProfile,
  downloadPatientTemplate,
  bulkUploadPatients,
} from "../../../api/nutritionistApi";
import { useNavigate } from "react-router-dom";
import {
  Search,
  UserPlus,
  X,
  ArrowRight,
  Info,
  TrendingDown,
  TrendingUp,
  Anchor,
  ClipboardList,
  HeartPulse,
  User,
  TestTube2,
  Upload, // <-- Import Upload icon
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileUp,
  FileText,
  HelpCircle,
  Sparkles,
  Layers,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Trash2,
  KeyRound,
  Copy,
  CheckCheck,
  ShieldCheck,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import NutriNavbar from "./NutriNavbar.jsx";

import { CalendarDays } from "lucide-react";

// --- Custom Hook for Smoother Search Interaction ---
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

// --- Enhanced Reusable Loader Components ---
const VibrantLoader = ({ size = "md", text = "Loading..." }) => {
  const sizeClasses = { sm: "w-5 h-5", md: "w-8 h-8", lg: "w-16 h-16" };
  const dotClasses = { sm: "w-1.5 h-1.5", md: "w-2 h-2", lg: "w-3 h-3" };
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`relative flex items-center justify-center ${sizeClasses[size]}`}
      >
        <div
          className={`${dotClasses[size]} bg-[var(--color-primary)] rounded-full absolute animate-bounce`}
        ></div>
        <div
          className={`${dotClasses[size]} bg-[var(--color-accent-2-text)] rounded-full absolute animate-bounce [animation-delay:-0.3s]`}
        ></div>
        <div
          className={`${dotClasses[size]} bg-[var(--color-accent-3-text)] rounded-full absolute animate-bounce [animation-delay:-0.5s]`}
        ></div>
      </div>
      {text && (
        <p className="text-lg text-[var(--color-text-default)] font-[var(--font-secondary)]">
          {text}
        </p>
      )}
    </div>
  );
};

const ButtonSpinner = () => (
  <div className="flex items-center justify-center gap-1">
    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
  </div>
);

// --- Redesigned Creative Goal Display Component ---
const GoalDisplay = ({ goal }) => {
  let Icon, text, colorClass;
  // Normalize goal string to handle variations like "maintain" vs "maintain_weight"
  const normalizedGoal = goal
    ?.toLowerCase()
    .replace(/ /g, "_")
    .replace(/_weight/g, "");

  switch (normalizedGoal) {
    case "lose":
      Icon = TrendingDown;
      text = "Weight Loss";
      colorClass =
        "text-[var(--color-warning-text)] bg-[var(--color-warning-bg-subtle)]";
      break;
    case "gain":
      Icon = TrendingUp;
      text = "Weight Gain";
      colorClass =
        "text-[var(--color-success-text)] bg-[var(--color-success-bg-subtle)]";
      break;
    case "maintain":
      Icon = Anchor;
      text = "Maintenance";
      colorClass =
        "text-[var(--color-info-text)] bg-[var(--color-info-bg-subtle)]";
      break;
    default:
      Icon = Info;
      text = "Not Set";
      colorClass =
        "text-[var(--color-text-muted)] bg-[var(--color-bg-interactive-subtle)]";
      break;
  }
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${colorClass} font-[var(--font-secondary)]`}
    >
      <Icon size={16} />
      <span>{text}</span>
    </div>
  );
};

const NutritionistDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [addPatientMode, setAddPatientMode] = useState("single"); // "single" or "bulk"
  const [bulkFile, setBulkFile] = useState(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkUploadResult, setBulkUploadResult] = useState(null);
  const [resultsTab, setResultsTab] = useState("errors"); // "errors" or "created"
  const [isDragOver, setIsDragOver] = useState(false);
  const [showFieldGuide, setShowFieldGuide] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [newPatient, setNewPatient] = useState({ lab_report: {} });
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const perPage = 8;
  const navigate = useNavigate();

  // State for enhanced search UX, consistent with Chat component
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useDebounce(search, 500);

  const AVATAR_COLORS = [
    "#FF7043",
    "#8E24AA",
    "#1E88E5",
    "#43A047",
    "#5E35B1",
    "#00897B",
  ];
  const countryOptions = [
  { value: "India", label: "India" },
  { value: "United States", label: "United States" },
  { value: "Canada", label: "Canada" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Australia", label: "Australia" },
  { value: "Germany", label: "Germany" },
  { value: "France", label: "France" },
  { value: "Japan", label: "Japan" },
  { value: "China", label: "China" },
  { value: "Brazil", label: "Brazil" },
  { value: "South Africa", label: "South Africa" },
  { value: "Singapore", label: "Singapore" },
  { value: "United Arab Emirates", label: "United Arab Emirates" },
  { value: "New Zealand", label: "New Zealand" },
];

  const activityLevels = [
  { value: "sedentary", label: "Sedentary (little or no exercise)" },
  { value: "lightly_active", label: "Lightly Active (light exercise/sports 1-3 days/week)" },
  { value: "moderately_active", label: "Moderately Active (moderate exercise/sports 3-5 days/week)" },
  { value: "very_active", label: "Very Active (hard exercise/sports 6-7 days a week)" },
  { value: "extra_active", label: "Extra Active (very hard exercise/physical job)" },
];


  const allergyOptions = [
    { value: "Peanut", label: "Peanut" },
    { value: "Soy", label: "Soy" },
    { value: "Gluten", label: "Gluten" },
    { value: "Milk", label: "Milk" },
    { value: "Shellfish", label: "Shellfish" },
    { value: "Eggs", label: "Eggs" },
    { value: "Wheat", label: "Wheat" },
    { value: "Sesame", label: "Sesame" },
    { value: "Fish", label: "Fish" },
    { value: "None", label: "None" },
    
  ];

  const goals = [
    { value: "lose_weight", label: "Lose Weight" },
    { value: "maintain", label: "Maintain Weight" },
    { value: "gain_weight", label: "Gain Weight" },
  ];
 const dietTypeOptions = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "non_vegetarian", label: "Non-Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "eggetarian", label: "Eggetarian" },
  { value: "keto", label: "Keto" },
  { value: "other", label: "Other" },
];
  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ];
 
    const getLocalDateString = (date) => {
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  };

  // --- [UPDATED] Use the new helper for the 'today' constant ---
  const today = getLocalDateString(new Date());

  const customSelectStyles = {
    control: (p, s) => ({
      ...p,
      backgroundColor: "var(--color-bg-app)",
      borderColor: s.isFocused
        ? "var(--color-primary)"
        : "var(--color-border-default)",
      borderWidth: "2px",
      boxShadow: "none",
      "&:hover": { borderColor: "var(--color-primary)" },
      borderRadius: "0.75rem",
      padding: "0.2rem 0.4rem",
      minHeight: "50px",
    }),
    option: (p, s) => ({
      ...p,
      backgroundColor: s.isSelected
        ? "var(--color-primary)"
        : s.isFocused
        ? "var(--color-bg-interactive-subtle)"
        : "var(--color-bg-surface)",
      color: s.isSelected
        ? "var(--color-text-on-primary)"
        : "var(--color-text-strong)",
      "&:active": { backgroundColor: "var(--color-primary-hover)" },
      cursor: "pointer",
      padding: "12px",
    }),
    menu: (p) => ({
      ...p,
      backgroundColor: "var(--color-bg-surface)",
      border: "2px solid var(--color-border-default)",
      borderRadius: "12px",
      zIndex: 100,
    }),
    placeholder: (p) => ({
      ...p,
      color: "var(--color-text-muted)",
      fontFamily: "var(--font-secondary)",
    }),
    singleValue: (p) => ({
      ...p,
      color: "var(--color-text-strong)",
      fontFamily: "var(--font-secondary)",
    }),
    input: (p) => ({ ...p, color: "var(--color-text-strong)" }),
  };

  // --- [UPDATED] Patient Fetching Logic to match Chat.jsx ---
  // --- [REPLACE THIS ENTIRE FUNCTION] ---
  const fetchPatients = useCallback(async () => {
    // Only show the big page loader on the very first load
    if (patients.length === 0) {
      setIsLoading(true);
    } else {
      // For subsequent searches, use the smaller spinner
      setIsSearching(true);
    }
    setError(null);
    setCurrentPage(1);

    try {
      let query = "";
      if (debouncedSearch) {
        const isEmail =
          debouncedSearch.includes("@") && debouncedSearch.includes(".");
        query = isEmail
          ? `?email=${encodeURIComponent(debouncedSearch)}`
          : `?search=${encodeURIComponent(debouncedSearch)}`;
      }

      const res = await getAssignedPatients(query);
      const users = res.data.results || res.data || [];

      const enhancedUsers = await Promise.all(
        users.map(async (user) => {
          try {
            const profileRes = await getPatientProfile(user.id);
            const profile = profileRes.data.profile || {};
            return {
              ...user,
              goal: profile.goal || "Not Set",
              date_of_birth: profile.date_of_birth || "",
              updated_at: profile.updated_at || user.updated_at,
              created_at: user.created_at,
              id: user.id, // Explicitly ensure ID is present for sorting
            };
          } catch (error) {
            console.error("Failed to get profile for user:", user.id);
            return user;
          }
        })
      );
      
      // --- BULLETPROOF SORTING LOGIC ---
      // This is the most reliable way to sort. It prioritizes the creation
      // date but falls back to the ID (higher ID = newer) if the date is missing.
      enhancedUsers.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at) : null;
        const dateB = b.created_at ? new Date(b.created_at) : null;

        if (dateA && dateB && !isNaN(dateA) && !isNaN(dateB)) {
          return dateB - dateA;
        }
        // Fallback to sorting by ID is the key to reliability
        return (b.id || 0) - (a.id || 0);
      });
      
      setPatients(enhancedUsers);

      if (debouncedSearch && users.length > 0) {
        toast.success(`${users.length} patient(s) found.`);
      }

    } catch (err) {
      setError("Failed to load patient data. Please try again later.");
      toast.error("Could not fetch patient data.");
      setPatients([]);
    } finally {
      // Ensure all loading states are turned off
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [debouncedSearch, patients.length]); // Add patients.length dependency

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // --- [UNCHANGED] Patient Creation Logic ---
 // --- [REPLACE THIS ENTIRE FUNCTION] ---
  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("Creating new patient...");

    const formData = new FormData();

    // Your FormData creation is correct, no changes needed here.
    for (const key in newPatient) {
        const value = newPatient[key];
        if (value === null || value === undefined) continue;
        if (key === 'lab_report') {
            for (const nestedKey in value) {
                const nestedValue = value[nestedKey];
                if (nestedValue !== null && nestedValue !== undefined && nestedValue !== '') {
                    formData.append(`lab_report.${nestedKey}`, nestedValue);
                }
            }
        } else if (key === 'report_file') {
            if (value instanceof File) {
                formData.append('lab_report.report_file', value, value.name);
            }
        } else {
            formData.append(key, value);
        }
    }

    try {
      const createdRes = await createUserPatient(formData);
      // Assume the API response contains the full new patient object
      const newlyCreatedPatient = createdRes.data;

      toast.success("Patient added successfully!", { id: toastId });
      setShowForm(false);
      setNewPatient({ lab_report: {} });

      // --- THE INSTANT UPDATE LOGIC ---
      // This is the most important part for a fast UI.
      // We manually prepend the new patient to our existing list.
      setPatients(prevPatients => {
        // Construct a complete patient object that matches the data structure of the others
        const enhancedNewPatient = {
          ...newlyCreatedPatient,
          goal: newlyCreatedPatient.profile?.goal || newPatient.goal || "Not Set",
          date_of_birth: newlyCreatedPatient.profile?.date_of_birth || newPatient.date_of_birth || "",
          created_at: newlyCreatedPatient.created_at || new Date().toISOString(), // Ensure a valid date
          id: newlyCreatedPatient.id,
        };
        // Return a new array with the new patient at the beginning
        return [enhancedNewPatient, ...prevPatients];
      });

    } catch (err) {
      console.error("Error creating patient:", err.response?.data || err.message);
      const errorData = err.response?.data;
      let errorMessage = "Failed to create patient.";

      if (typeof errorData === 'object' && errorData !== null) {
        const messages = Object.entries(errorData).map(([field, errors]) => {
          const errorList = Array.isArray(errors) ? errors.join(' ') : JSON.stringify(errors);
          return `${field}: ${errorList}`;
        });
        errorMessage = messages.join('; ') || errorMessage;
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }
      
      toast.error(errorMessage, { id: toastId, duration: 6000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Download Excel Template ---
  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    const toastId = toast.loading("Generating patient template with 10 examples...");
    try {
      const response = await downloadPatientTemplate();
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "trackintake_patient_import_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Excel template downloaded successfully!", { id: toastId });
    } catch (err) {
      console.error("Error downloading template:", err);
      toast.error("Failed to download template. Please try again.", { id: toastId });
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // --- Handle Bulk File Upload ---
  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) {
      toast.error("Please select an Excel (.xlsx/.xls) file to upload.");
      return;
    }

    setIsBulkUploading(true);
    const toastId = toast.loading("Processing bulk patient file (validating & creating accounts)...");
    const formData = new FormData();
    formData.append("file", bulkFile);

    try {
      const res = await bulkUploadPatients(formData);
      const data = res.data;
      setBulkUploadResult(data);

      if (data.created_count > 0) {
        toast.success(`Successfully imported ${data.created_count} patient(s)!`, {
          id: toastId,
          duration: 5000,
        });

        // Prepend created patients to state & trigger background refresh
        if (data.created_patients && data.created_patients.length > 0) {
          setPatients((prev) => {
            const newPatientsFormatted = data.created_patients.map((p) => ({
              ...p,
              profile: {
                goal: p.goal,
                date_of_birth: p.date_of_birth,
              },
            }));
            return [...newPatientsFormatted, ...prev];
          });
        }
        fetchPatients();
      } else {
        toast.error("No patients were created. Please check the error summary below.", {
          id: toastId,
        });
      }
    } catch (err) {
      console.error("Error in bulk upload:", err.response?.data || err);
      const errDetail =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to process bulk upload. Please check file format and try again.";
      toast.error(errDetail, { id: toastId, duration: 6000 });
      if (err.response?.data?.errors) {
        setBulkUploadResult(err.response.data);
      }
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleFileChange = (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext !== "xlsx" && ext !== "xls") {
      toast.error("Invalid file format! Please upload an Excel (.xlsx or .xls) file.");
      return;
    }
    setBulkFile(file);
    setBulkUploadResult(null);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText("Default@123");
    setCopiedPassword(true);
    toast.success("Default password 'Default@123' copied to clipboard!");
    setTimeout(() => setCopiedPassword(false), 2500);
  };


  // --- [UNCHANGED] Helper Functions ---
  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const handleFormChange = (e, section = null) => {
    const { name, type, checked } = e.target;

    if (type === "file") {
      const file = e.target.files[0];
      setNewPatient((prev) => ({ ...prev, [name]: file || null }));
      return;
    }

    const value = type === "checkbox" ? checked : e.target.value;

    if (section) {
      setNewPatient((prev) => ({
        ...prev,
        [section]: { ...(prev[section] || {}), [name]: value },
      }));
    } else {
      setNewPatient((prev) => ({ ...prev, [name]: value }));
    }
  };

  const FormSectionHeader = ({ icon, title }) => (
    <div className="flex items-center gap-3 border-b-2 border-dashed border-[var(--color-border-default)] pb-3 mb-6">
      {" "}
      {icon}{" "}
      <h3 className="font-semibold text-xl text-[var(--color-text-strong)] font-[var(--font-secondary)]">
        {title}
      </h3>{" "}
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)] font-[var(--font-primary)]">
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            "font-[var(--font-secondary)] !bg-[var(--color-bg-surface)] !text-[var(--color-text-default)] !border-2 !border-[var(--color-border-default)] !shadow-lg",
        }}
      />
      <div className="sticky top-0 z-40 bg-[var(--color-bg-surface-glass)] backdrop-blur-md shadow-sm">
        <NutriNavbar />
      </div>

      <main className="text-[var(--color-text-default)] p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 p-6 bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] rounded-2xl shadow-lg"
        >
          <h1 className="text-4xl font-extrabold text-[var(--color-text-strong)] font-[var(--font-primary)] tracking-tight">
            Nutritionist Dashboard
          </h1>
          <p className="text-[var(--color-text-default)] mt-2 text-lg font-[var(--font-secondary)]">
            Manage, search, and onboard your patients with ease.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:flex-grow">
              <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-[var(--color-text-muted)] z-10" />
              {isSearching && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-primary)]"
                >
                  <div className="w-full h-full rounded-full border-2 border-current border-r-transparent animate-spin"></div>
                </motion.div>
              )}
              <input
                type="text"
                placeholder="Search patients by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-12 py-3 border-2 bg-[var(--color-bg-app)] border-[var(--color-border-default)] rounded-xl text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:ring-2 focus:ring-[var(--color-border-hover)] focus:border-[var(--color-border-focus)] outline-none transition-all duration-300 shadow-inner"
              />
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
  {/* Manage Availability */}
  <button
    onClick={() => navigate("/nutritionist/availability")}
    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold
      bg-[var(--color-bg-surface)]
      border-2 border-[var(--color-border-default)]
      text-[var(--color-text-strong)]
      hover:border-[var(--color-primary)]
      hover:text-[var(--color-primary)]
      hover:shadow-lg
      transition-all duration-300"
  >
    <CalendarDays size={20} />
    <span>Manage Availability</span>
  </button>

  {/* Add New Patient */}
  <button
    onClick={() => setShowForm(true)}
    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold
      bg-[var(--color-primary)]
      text-[var(--color-text-on-primary)]
      hover:bg-[var(--color-primary-hover)]
      hover:shadow-xl
      transition-all duration-300"
  >
    <UserPlus size={20} />
    <span>Add New Patient</span>
  </button>
</div>

            
          </div>
        </motion.header>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[var(--color-bg-backdrop)] backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowForm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="bg-[var(--color-bg-surface)] p-6 sm:p-8 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl border-2 border-[var(--color-border-default)] custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-4 bg-[var(--color-bg-surface)] py-4 z-10 -mx-8 px-8 -mt-6 pt-6 border-b border-[var(--color-border-default)]">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-strong)] font-[var(--font-primary)] flex items-center gap-3">
                      {addPatientMode === "single" ? (
                        <>
                          <UserPlus className="text-[var(--color-primary)]" size={28} />
                          <span>Add New Patient</span>
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="text-emerald-500" size={28} />
                          <span>Bulk Patient Onboarding</span>
                        </>
                      )}
                    </h2>
                    <p className="text-[var(--color-text-muted)] font-[var(--font-secondary)] mt-1 text-sm sm:text-base">
                      {addPatientMode === "single"
                        ? "Fill in the details below to onboard a single patient."
                        : "Upload an Excel spreadsheet (.xlsx) to onboard up to 1,000+ patients at once."}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setBulkFile(null);
                      setBulkUploadResult(null);
                    }}
                    className="p-2 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg-interactive-subtle)] hover:text-[var(--color-primary)] transition-colors"
                    aria-label="Close"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Tab Switcher */}
                <div className="flex p-1.5 bg-[var(--color-bg-app)] rounded-2xl border border-[var(--color-border-default)] mb-6">
                  <button
                    type="button"
                    onClick={() => setAddPatientMode("single")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      addPatientMode === "single"
                        ? "bg-[var(--color-bg-surface)] text-[var(--color-text-strong)] shadow-sm border border-[var(--color-border-default)]"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
                    }`}
                  >
                    <User size={18} className={addPatientMode === "single" ? "text-[var(--color-primary)]" : ""} />
                    <span>Single Patient</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddPatientMode("bulk")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 relative ${
                      addPatientMode === "bulk"
                        ? "bg-[var(--color-bg-surface)] text-[var(--color-text-strong)] shadow-sm border border-[var(--color-border-default)]"
                        : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
                    }`}
                  >
                    <FileSpreadsheet size={18} className="text-emerald-500" />
                    <span>Bulk Upload (.xlsx)</span>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full">
                      <Sparkles size={11} /> 1000s at once
                    </span>
                  </button>
                </div>

                {addPatientMode === "bulk" ? (
                  <div className="space-y-6 font-[var(--font-secondary)]">
                    {/* Step 1: Download Template */}
                    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-2 border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="p-3.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/30 flex-shrink-0 shadow-inner">
                          <FileSpreadsheet size={34} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-0.5 rounded-md shadow-sm">
                              Step 1
                            </span>
                            <h3 className="text-lg font-bold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                              Download Official Excel Template
                            </h3>
                          </div>
                          <p className="text-sm text-[var(--color-text-muted)] mt-1.5 max-w-xl leading-relaxed">
                            Pre-configured with all backend columns & includes <strong>10 realistic example patients</strong>. Open in Excel or Google Sheets, remove the sample rows, enter your patients (10, 100, or 1000s), and upload!
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-[var(--color-text-default)] font-medium">
                            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                              <Check size={14} className="text-emerald-600 dark:text-emerald-400" /> 10 Sample Rows Included
                            </span>
                            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                              <Check size={14} className="text-emerald-600 dark:text-emerald-400" /> Required Fields Marked (*)
                            </span>
                            <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                              <Check size={14} className="text-emerald-600 dark:text-emerald-400" /> Field Guide Sheet
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        disabled={isDownloadingTemplate}
                        className="w-full md:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        {isDownloadingTemplate ? (
                          <ButtonSpinner />
                        ) : (
                          <Download size={18} />
                        )}
                        <span>{isDownloadingTemplate ? "Downloading..." : "Download Template (.xlsx)"}</span>
                      </button>
                    </div>

                    {/* Default Account Password Banner */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-2 border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                      <div className="flex items-start gap-3.5">
                        <div className="p-2.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl flex-shrink-0 mt-0.5 sm:mt-0">
                          <KeyRound size={22} />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h4 className="font-bold text-sm sm:text-base text-[var(--color-text-strong)]">
                              Default Patient Login Password:
                            </h4>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[var(--color-bg-surface)] border border-amber-500/40 text-[var(--color-text-strong)] font-mono font-bold text-sm shadow-sm">
                              <span>Default@123</span>
                              <button
                                type="button"
                                onClick={handleCopyPassword}
                                className="text-amber-600 dark:text-amber-400 hover:text-amber-700 p-0.5 rounded transition-colors"
                                title="Copy default password"
                              >
                                {copiedPassword ? <CheckCheck size={16} className="text-emerald-500" /> : <Copy size={16} />}
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-[var(--color-text-muted)] mt-1.5 leading-relaxed">
                            Patients can log in to TrackIntake using their registered <strong>Email</strong> and <code className="font-bold text-amber-700 dark:text-amber-300">Default@123</code> (unless specified in the Excel sheet). They can change their password anytime after logging in.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 font-semibold bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 flex-shrink-0 self-end sm:self-center">
                        <ShieldCheck size={16} />
                        <span>Pre-configured</span>
                      </div>
                    </div>

                    {/* Quick Guide & Required Fields Accordion */}
                    <div className="p-4 rounded-xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)]">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setShowFieldGuide(!showFieldGuide)}
                      >
                        <div className="flex items-center gap-2.5">
                          <HelpCircle size={18} className="text-[var(--color-primary)]" />
                          <span className="font-semibold text-sm text-[var(--color-text-strong)]">
                            Required vs Optional Columns Guide
                          </span>
                          <span className="text-xs bg-red-500/10 text-red-600 dark:text-red-400 font-bold px-2 py-0.5 rounded-full border border-red-500/20">
                            Full Name * & Email * Mandatory
                          </span>
                        </div>
                        <button type="button" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]">
                          {showFieldGuide ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>

                      {showFieldGuide && (
                        <div className="mt-4 pt-4 border-t border-[var(--color-border-default)] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[var(--color-text-default)]">
                          <div className="p-3 bg-[var(--color-bg-surface)] rounded-lg border border-[var(--color-border-default)] space-y-1.5">
                            <h4 className="font-bold text-red-600 dark:text-red-400 uppercase tracking-wide flex items-center gap-1.5">
                              <AlertCircle size={14} /> Mandatory Columns
                            </h4>
                            <p><strong>Full Name *</strong>: Patient's name (e.g. Aarav Sharma)</p>
                            <p><strong>Email *</strong>: Unique email for each patient account</p>
                          </div>
                          <div className="p-3 bg-[var(--color-bg-surface)] rounded-lg border border-[var(--color-border-default)] space-y-1.5">
                            <h4 className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                              <CheckCircle2 size={14} /> Optional Columns & Choices
                            </h4>
                            <p><strong>Gender</strong>: male, female, or other</p>
                            <p><strong>Activity Level</strong>: sedentary, lightly_active, moderately_active, very_active, extra_active</p>
                            <p><strong>Primary Goal</strong>: lose_weight, maintain, gain_weight</p>
                            <p><strong>Diet Type</strong>: vegetarian, non_vegetarian, vegan, eggetarian, keto, other</p>
                            <p><strong>Medical Conditions</strong>: Yes / No (Diabetic, Hypertensive, Heart, Thyroid, Arthritis, Gastric)</p>
                            <p><strong>Lab Report Biomarkers</strong>: Fasting Sugar, Postprandial, HbA1c, BP, Cholesterol, Vitamins, etc.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step 2: Drag and Drop Upload Area */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-md">
                          Step 2
                        </span>
                        <h3 className="text-lg font-bold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                          Upload Filled Spreadsheet (.xlsx / .xls)
                        </h3>
                      </div>

                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragOver(true);
                        }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragOver(false);
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            handleFileChange(e.dataTransfer.files[0]);
                          }
                        }}
                        className={`relative p-8 rounded-2xl border-2 border-dashed transition-all duration-300 text-center flex flex-col items-center justify-center gap-3 cursor-pointer ${
                          isDragOver
                            ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] scale-[0.99]"
                            : bulkFile
                            ? "border-emerald-500/50 bg-emerald-500/5"
                            : "border-[var(--color-border-default)] hover:border-[var(--color-primary)] bg-[var(--color-bg-app)]"
                        }`}
                        onClick={() => document.getElementById("bulk-file-input")?.click()}
                      >
                        <input
                          id="bulk-file-input"
                          type="file"
                          accept=".xlsx,.xls"
                          className="sr-only"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleFileChange(e.target.files[0]);
                            }
                          }}
                        />

                        {bulkFile ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="p-3.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                              <FileSpreadsheet size={36} />
                            </div>
                            <p className="font-bold text-base text-[var(--color-text-strong)]">{bulkFile.name}</p>
                            <span className="text-xs text-[var(--color-text-muted)]">
                              {(bulkFile.size / 1024).toFixed(1)} KB • Ready to upload
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setBulkFile(null);
                                setBulkUploadResult(null);
                              }}
                              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 size={14} /> Remove File
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <div className="p-3.5 bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] rounded-2xl border border-[var(--color-border-default)]">
                              <FileUp size={36} className="text-[var(--color-primary)]" />
                            </div>
                            <p className="font-bold text-base text-[var(--color-text-strong)]">
                              Click to browse or drag & drop your Excel file here
                            </p>
                            <span className="text-xs text-[var(--color-text-muted)]">
                              Supports .xlsx and .xls (supports 10 to 1,000+ patients in one batch)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Upload Submit Button */}
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowForm(false);
                            setBulkFile(null);
                            setBulkUploadResult(null);
                          }}
                          className="px-6 py-3 rounded-xl border-2 border-[var(--color-border-default)] font-semibold text-[var(--color-text-default)] hover:bg-[var(--color-bg-interactive-subtle)] transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleBulkUpload}
                          disabled={!bulkFile || isBulkUploading}
                          className="flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-text-on-primary)] font-bold transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform-gpu"
                        >
                          {isBulkUploading ? (
                            <>
                              <ButtonSpinner />
                              <span>Processing & Creating Patients...</span>
                            </>
                          ) : (
                            <>
                              <Upload size={18} />
                              <span>Upload & Create Patients</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Step 3: Results Display */}
                    {bulkUploadResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 rounded-2xl bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] space-y-5 mt-6 shadow-md"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-border-default)] pb-4">
                          <h4 className="text-lg font-bold text-[var(--color-text-strong)] font-[var(--font-primary)] flex items-center gap-2">
                            <ClipboardList size={22} className="text-[var(--color-primary)]" />
                            <span>Bulk Import Results Breakdown</span>
                          </h4>
                          <span className="text-xs font-semibold text-[var(--color-text-muted)] bg-[var(--color-bg-app)] px-3 py-1 rounded-full border border-[var(--color-border-default)]">
                            File: {bulkFile?.name || "Uploaded Spreadsheet"}
                          </span>
                        </div>

                        {/* 3 Metric Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-center">
                          <div className="p-4 rounded-xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] flex flex-col justify-center">
                            <span className="text-3xl font-extrabold text-[var(--color-text-strong)]">{bulkUploadResult.total_rows || 0}</span>
                            <p className="text-xs text-[var(--color-text-muted)] font-semibold mt-1 uppercase tracking-wide">Total Rows Analyzed</p>
                          </div>
                          <div className="p-4 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/30 flex flex-col justify-center">
                            <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 size={20} />
                              <span className="text-3xl font-extrabold">{bulkUploadResult.created_count || 0}</span>
                            </div>
                            <p className="text-xs text-emerald-800 dark:text-emerald-300 font-bold mt-1 uppercase tracking-wide">Successfully Created</p>
                          </div>
                          <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col justify-center">
                            <div className="flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400">
                              <AlertTriangle size={20} />
                              <span className="text-3xl font-extrabold">{bulkUploadResult.failed_count || 0}</span>
                            </div>
                            <p className="text-xs text-amber-800 dark:text-amber-300 font-bold mt-1 uppercase tracking-wide">Errors / Skipped Rows</p>
                          </div>
                        </div>

                        {/* Result Sub-tabs */}
                        <div className="flex p-1 bg-[var(--color-bg-app)] rounded-xl border border-[var(--color-border-default)]">
                          {bulkUploadResult.failed_count > 0 && (
                            <button
                              type="button"
                              onClick={() => setResultsTab("errors")}
                              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                                resultsTab === "errors"
                                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-sm"
                                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
                              }`}
                            >
                              ⚠️ View {bulkUploadResult.failed_count} Failed / Skipped Rows & Reasons
                            </button>
                          )}
                          {bulkUploadResult.created_count > 0 && (
                            <button
                              type="button"
                              onClick={() => setResultsTab("created")}
                              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                                resultsTab === "created"
                                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm"
                                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
                              }`}
                            >
                              ✓ View {bulkUploadResult.created_count} Created Patients
                            </button>
                          )}
                        </div>

                        {/* Errors Tab Content */}
                        {resultsTab === "errors" && bulkUploadResult.errors && bulkUploadResult.errors.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] px-1">
                              <span className="font-semibold uppercase tracking-wider">Excel Row # & Details</span>
                              <span className="font-semibold uppercase tracking-wider">Exact Failure Reason</span>
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-2 p-3 rounded-xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] custom-scrollbar">
                              {bulkUploadResult.errors.map((err, i) => (
                                <div key={i} className="text-xs p-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
                                  <div className="flex items-center gap-2.5">
                                    <span className="px-2 py-1 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono font-bold text-xs whitespace-nowrap border border-amber-500/30">
                                      Row {err.row}
                                    </span>
                                    <div>
                                      <p className="font-bold text-[var(--color-text-strong)]">
                                        {err.name && err.name !== "N/A" ? err.name : "Missing Name"}
                                      </p>
                                      <p className="text-[var(--color-text-muted)] text-[11px]">
                                        {err.email || "Missing Email"}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 font-medium text-xs border border-red-500/20 sm:max-w-md">
                                    <AlertCircle size={14} className="flex-shrink-0" />
                                    <span>{err.error}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Created Tab Content */}
                        {resultsTab === "created" && bulkUploadResult.created_patients && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] px-1">
                              <span className="font-semibold uppercase tracking-wider">Patient Name & Email</span>
                              <span className="font-semibold uppercase tracking-wider">Goal & Status</span>
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-2 p-3 rounded-xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] custom-scrollbar">
                              {bulkUploadResult.created_patients.map((p, i) => (
                                <div key={i} className="text-xs p-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] flex items-center justify-between gap-2 shadow-sm">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                                      {p.full_name?.charAt(0) || "P"}
                                    </div>
                                    <div>
                                      <p className="font-bold text-[var(--color-text-strong)]">{p.full_name}</p>
                                      <p className="text-[var(--color-text-muted)] text-[11px]">{p.email}</p>
                                    </div>
                                  </div>
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-500/20">
                                    ✓ Active & Assigned
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Bottom Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--color-border-default)]">
                          <button
                            type="button"
                            onClick={() => {
                              setBulkFile(null);
                              setBulkUploadResult(null);
                            }}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[var(--color-border-default)] text-xs font-semibold text-[var(--color-text-default)] hover:bg-[var(--color-bg-interactive-subtle)] transition-colors"
                          >
                            Upload Another File
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowForm(false);
                              setBulkFile(null);
                              setBulkUploadResult(null);
                            }}
                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all duration-200"
                          >
                            Done & View Patients Roster
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                <form
                  onSubmit={handleCreatePatient}
                  className="font-[var(--font-secondary)]"
                >
                  <div className="space-y-8">
                    <section>
                      <FormSectionHeader
                        icon={<User size={20} className="text-primary" />}
                        title="Basic & Contact Info"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        {[
                          "full_name",
                          "email",
                          "password",
                          "mobile_number",
                        ].map((field) => (
                          <input
                            key={field}
                            name={field}
                            required
                            placeholder={field
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (c) => c.toUpperCase())}
                            onChange={(e) => handleFormChange(e)}
                            className="p-3 bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-border-hover)] focus:border-[var(--color-border-focus)] transition-colors text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)]"
                            type={field === "password" ? "password" : "text"}
                          />
                        ))}
                        <input
                          name="date_of_birth"
                          onChange={(e) => handleFormChange(e)}
                          
                          className="p-3 bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-border-hover)] focus:border-[var(--color-border-focus)] transition-colors text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)]"
                          type="date"
                        
                          max={today}
                          onFocus={(e) => (e.target.type = "date")}
                          onBlur={(e) => (e.target.type = "text")}
                          placeholder="Date of Birth"
                          
                        />
                        <Select
                          styles={customSelectStyles}
                          options={countryOptions}
                          required
                          onChange={(selected) =>
                            setNewPatient({
                              ...newPatient,
                              country: selected.value,
                            })
                          }
                          placeholder="Select Country..."
                        />
                      </div>
                    </section>
                    <section>
                      <FormSectionHeader
                        icon={
                          <ClipboardList size={20} className="text-primary" />
                        }
                        title="Physical & Lifestyle"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                        {["height_cm", "weight_kg", "occupation"].map(
                          (field) => (
                            <input
                              key={field}
                              name={field}
                              required
                              placeholder={field
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (c) => c.toUpperCase())}
                              onChange={(e) => handleFormChange(e)}
                              className="p-3 bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-border-hover)] focus:border-[var(--color-border-focus)] transition-colors text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)]"
                            />
                          )
                        )}
                        <Select
                          styles={customSelectStyles}
                          options={genderOptions}
                          required
                          onChange={(selected) =>
                            setNewPatient({
                              ...newPatient,
                              gender: selected.value,
                            })
                          }
                          placeholder="Select Gender..."
                        />
                        <Select
                          styles={customSelectStyles}
                          options={activityLevels}
                          required
                          onChange={(selected) =>
                            setNewPatient({
                              ...newPatient,
                              activity_level: selected.value,
                            })
                          }
                          placeholder="Activity Level..."
                        />
                        <Select
                          styles={customSelectStyles}
                          options={goals}
                          required
                          onChange={(selected) =>
                            setNewPatient({
                              ...newPatient,
                              goal: selected.value,
                            })
                          }
                          placeholder="Primary Goal..."
                        />
                        <Select
                          styles={customSelectStyles}
                          options={dietTypeOptions}
                          required
                          onChange={(selected) =>
                            setNewPatient({
                              ...newPatient,
                              diet_type: selected.value,
                            })
                          }
                          placeholder="Dietary Preference..."
                        />
                      </div>
                    </section>
                    <section>
                      <FormSectionHeader
                        icon={<HeartPulse size={20} className="text-primary" />}
                        title="Medical History"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                           <Select
                            isMulti
                            name="allergies"
                            options={allergyOptions}
                            styles={customSelectStyles}
                            placeholder="Select Allergies..."
                            // This makes it a controlled component
                            value={
                              allergyOptions.filter(opt => 
                                (newPatient.allergies || '').split(',').includes(opt.value)
                              )
                            }
                            onChange={(selectedOptions, actionMeta) => {
                              let finalSelection = selectedOptions || [];

                              // If "None" was the last option selected, make it the only one.
                              if (actionMeta.option?.value === 'none' && actionMeta.action === 'select-option') {
                                finalSelection = [{ value: "none", label: "None" }];
                              } else {
                                // Otherwise, if any other option is selected, remove "None" from the list.
                                finalSelection = finalSelection.filter(opt => opt.value !== 'none');
                              }
                              
                              setNewPatient(prev => ({
                                  ...prev,
                                  allergies: finalSelection.map(opt => opt.value).join(',')
                              }));
                            }}
                          />
                          <input
                            name="family_history"
                            placeholder="Family Medical History"
                            onChange={(e) => handleFormChange(e)}
                            className="p-3 bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-border-hover)] focus:border-[var(--color-border-focus)] transition-colors text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)]"
                          />
                        </div>
                        <div className="p-4 bg-[var(--color-bg-surface-alt)] rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-4 md:col-span-2">
                          {[
                            { key: "is_diabetic", label: "Diabetic" },
                            { key: "is_hypertensive", label: "Hypertensive" },
                            {
                              key: "has_gastric_issues",
                              label: "Gastric Issues",
                            },
                            {
                              key: "has_heart_condition",
                              label: "Heart Condition",
                            },
                            { key: "has_thyroid_disorder", label: "Thyroid" },
                            { key: "has_arthritis", label: "Arthritis" },
                          ].map(({ key, label }) => (
                            <label
                              key={key}
                              className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-text-default)]"
                            >
                              <input
                                type="checkbox"
                                name={key}
                                onChange={(e) => handleFormChange(e)}
                                className="h-5 w-5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                              />
                              {label}
                            </label>
                          ))}
                        </div>
                        <input
                          name="other_chronic_condition"
                          placeholder="Other Chronic Conditions"
                          onChange={(e) => handleFormChange(e)}
                          className="md:col-span-2 p-3 bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-border-hover)] focus:border-[var(--color-border-focus)] transition-colors text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)]"
                        />
                      </div>
                    </section>
                    <section>
                      <FormSectionHeader
                        icon={<TestTube2 size={20} className="text-primary" />}
                        title="Lab Report (Optional)"
                      />
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                        <input
                          name="report_date"
                          onChange={(e) => handleFormChange(e, "lab_report")}
                          className="p-3 col-span-2 bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-border-hover)] focus:border-[var(--color-border-focus)] transition-colors text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)]"
                          type="date"
                          max={today}
                          onFocus={(e) => (e.target.type = "date")}
                          onBlur={(e) => (e.target.type = "text")}
                          placeholder="Report Date"
                        />
                        
                        <div className="col-span-2 md:col-span-4 p-4 bg-[var(--color-bg-surface-alt)] rounded-lg border border-[var(--color-border-default)]">
                          <label
                            htmlFor="lab-report-upload"
                            className="block text-sm font-medium text-[var(--color-text-strong)] mb-2"
                          >
                            Upload Lab Report (PDF)
                          </label>
                          <div className="flex items-center gap-x-3">
                            <label
                              htmlFor="lab-report-upload"
                              className="cursor-pointer inline-flex items-center gap-2 bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-semibold px-4 py-2 rounded-lg transition-colors hover:bg-[var(--color-primary-hover-subtle)]"
                            >
                              <Upload size={16} />
                              <span>{newPatient.report_file ? 'Change File' : 'Select File'}</span>
                              <input
                                id="lab-report-upload"
                                name="report_file"
                                type="file"
                                className="sr-only"
                                accept="application/pdf"
                                onChange={handleFormChange}
                              />
                            </label>
                            <span className="text-sm text-[var(--color-text-muted)] truncate">
                              {newPatient.report_file?.name || 'No file chosen'}
                            </span>
                          </div>
                        </div>

                        {[
                          "weight_kg",
                          "height_cm",
                          "waist_circumference_cm",
                          "blood_pressure_systolic",
                          "blood_pressure_diastolic",
                          "fasting_blood_sugar",
                          "postprandial_sugar",
                          "hba1c",
                          "ldl_cholesterol",
                          "hdl_cholesterol",
                          "triglycerides",
                          "esr",
                          "creatinine",
                          "urea",
                          "alt",
                          "ast",
                          "vitamin_d3",
                          "vitamin_b12",
                          "tsh",
                          "crp",
                          "uric_acid",
                        ].map((field) => (
                          <input
                            key={field}
                            name={field}
                            placeholder={field
                              .replace(/_/g, " ")
                              .toLowerCase()
                              .replace(/^\w/, (c) => c.toUpperCase())}
                            onChange={(e) => handleFormChange(e, "lab_report")}
                            className="p-3 bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-border-hover)] focus:border-[var(--color-border-focus)] transition-colors text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)]"
                          />
                        ))}
                      </div>
                    </section>
                  </div>
                  <div className="flex justify-end mt-8">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center justify-center gap-3 w-full sm:w-auto bg-[var(--color-primary)] text-[var(--color-text-on-primary)] px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 hover:bg-[var(--color-primary-hover)] hover:shadow-lg hover:-translate-y-1 disabled:bg-opacity-70 disabled:cursor-not-allowed disabled:transform-none transform-gpu"
                    >
                      {isSubmitting ? (
                        <ButtonSpinner />
                      ) : (
                        <UserPlus size={18} />
                      )}{" "}
                      <span>
                        {isSubmitting
                          ? "Creating Patient..."
                          : "Create Patient"}
                      </span>
                    </button>
                  </div>
                </form>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.2 } }}
        >
          <div className="flex justify-between items-baseline mb-6">
            <h2 className="text-3xl font-bold text-[var(--color-text-strong)] font-[var(--font-primary)]">
              Your Patients
            </h2>
            <span className="font-semibold text-[var(--color-text-default)] font-[var(--font-secondary)]">
              {patients.length} Total
            </span>
          </div>
          {isLoading ? (
            <div className="py-20">
              <VibrantLoader size="lg" text="Fetching patient records..." />
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-[var(--color-danger-bg-subtle)] text-[var(--color-danger-text)] border-2 border-[var(--color-danger-text)]/20 rounded-2xl flex flex-col items-center gap-4">
              <Info size={40} />
              <p className="font-semibold text-lg">{error}</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-20 bg-[var(--color-bg-surface)] rounded-2xl border-2 border-dashed border-[var(--color-border-default)] flex flex-col items-center gap-4">
              <p className="text-2xl font-bold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                No Patients Found
              </p>
              <p className="text-[var(--color-text-default)] mt-2 font-[var(--font-secondary)]">
                {search ? "Try adjusting your search terms." : "You have no assigned patients yet."}
              </p>
            </div>
          ) : (
            <motion.div
              variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
              initial="hidden"
              animate="visible"
              className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {patients
                .slice((currentPage - 1) * perPage, currentPage * perPage)
                .map((patient, index) => {
                  const avatarColor =
                    AVATAR_COLORS[patient.id % AVATAR_COLORS.length];
                  const patientInitial = patient.full_name
                    ? patient.full_name.charAt(0).toUpperCase()
                    : "?";
                  return (

                    // new code
       <motion.div
        key={patient.id}
        variants={{
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
  }}
  onClick={() => navigate(`/nutritionist/patient/${patient.id}`)}
  className="group cursor-pointer p-6 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-md hover:shadow-xl hover:border-[var(--color-primary)] hover:-translate-y-2 transition-all duration-300 ease-in-out transform-gpu"
>
  {/* Avatar and ID */}
  <div className="flex items-start justify-between mb-5">
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl text-[var(--color-text-on-primary)] shadow-xl group-hover:scale-110 transition-transform duration-300"
      style={{ backgroundColor: avatarColor }}
    >
      {patientInitial}
    </div>
    <span className="text-xs font-semibold text-[var(--color-text-muted)]">
      ID: {patient.id}
    </span>
  </div>

  {/* Patient Info */}
  <div className="mb-4">
    <h3 className="text-2xl font-extrabold text-[var(--color-text-strong)] font-[var(--font-primary)] capitalize leading-snug truncate">
      {patient.full_name || "No Name"}
    </h3>
    <p className="text-sm text-[var(--color-text-muted)] font-[var(--font-secondary)] mt-1">
      {calculateAge(patient.date_of_birth)} years old
    </p>
  </div>

  {/* Divider & Footer */}
  <div className="mt-5 pt-5 border-t border-dashed border-[var(--color-border-default)] flex justify-between items-center">
    <GoalDisplay goal={patient.goal} />
    <div className="text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
      <ArrowRight size={22} />
    </div>
  </div>
</motion.div>

                  );
                })}
            </motion.div>
          )}
        </motion.section>

        {patients.length > perPage && (
          <div className="flex justify-center items-center mt-12 gap-2 sm:gap-4 font-[var(--font-secondary)]">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-lg bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] text-[var(--color-text-default)] font-semibold transition-all hover:bg-[var(--color-bg-interactive-subtle)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="text-sm font-semibold text-[var(--color-text-strong)] px-2">
              Page {currentPage} of {Math.ceil(patients.length / perPage)}
            </span>
            <button
              onClick={() =>
                setCurrentPage((p) =>
                  p * perPage < patients.length ? p + 1 : p
                )
              }
              className="px-4 py-2 rounded-lg bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] text-[var(--color-text-default)] font-semibold transition-all hover:bg-[var(--color-bg-interactive-subtle)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage * perPage >= patients.length}
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};
export default NutritionistDashboard;