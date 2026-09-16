import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Key,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Users,
  Utensils,
  CreditCard,
  Calendar,
  Award,
  RotateCw,
  Video,
  Sparkles,
  Activity,
  Check,
  BadgeCheck,
  MessageSquare,
  MapPin,
  DollarSign,
  Clock,
  Edit3,
  Save,
  AlertTriangle,
  Upload,
  FileText,
  ExternalLink,
  Briefcase,
  Globe,
  Camera,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import {
  getNutritionistProfile,
  updateNutritionistProfile,
  changeNutritionistPassword,
} from "../../../api/nutritionistApi";

const ALL_SPECIALIZATIONS = [
  "Weight Management (Loss/Gain)",
  "Diabetes & Blood Sugar Control",
  "PCOS / PCOD Management",
  "Thyroid & Hormonal Health",
  "Sports & Athletic Nutrition",
  "Kidney & Renal Health",
  "Cardiac & Heart Wellness",
  "Pediatric & Child Nutrition",
  "Gut Health, IBS & Digestion",
  "Post-Pregnancy Recovery",
  "Hypertension & Blood Pressure",
  "Ketogenic & Low Carb Diets",
];

const PulsingDotsLoader = ({ text = "Loading Profile Details..." }) => (
  <div className="flex flex-col items-center justify-center gap-3">
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] animate-bounce [animation-delay:-0.3s]" />
      <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] animate-bounce [animation-delay:-0.15s]" />
      <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] animate-bounce" />
    </div>
    <p className="text-xs font-semibold text-[var(--color-text-muted)] animate-pulse">{text}</p>
  </div>
);

const NutritionistProfile = () => {
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);

  // Profile data from backend
  const [profileData, setProfileData] = useState(null);

  // Edit Mode States
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [savingBasic, setSavingBasic] = useState(false);

  const [isEditingProfessional, setIsEditingProfessional] = useState(false);
  const [savingProfessional, setSavingProfessional] = useState(false);

  const [isEditingSpecializations, setIsEditingSpecializations] = useState(false);
  const [savingSpecializations, setSavingSpecializations] = useState(false);

  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [savingAppointment, setSavingAppointment] = useState(false);

  const [uploadingDoc, setUploadingDoc] = useState(null);

  // Form States
  const [basicForm, setBasicForm] = useState({
    full_name: "",
    phone_number: "",
    gender: "",
    date_of_birth: "",
    city: "",
    country: "",
  });

  const [professionalForm, setProfessionalForm] = useState({
    professional_title: "",
    qualification: "",
    registration_number: "",
    issuing_authority: "",
    years_of_experience: 0,
    current_organization: "",
    professional_bio: "",
    languages_spoken: "",
  });

  const [selectedSpecializations, setSelectedSpecializations] = useState([]);

  const [appointmentForm, setAppointmentForm] = useState({
    is_online_available: true,
    is_offline_available: false,
    offline_location: "",
    online_price: "",
    offline_price: "",
    offline_payment_required: true,
  });

  // Password Form state
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch nutritionist profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getNutritionistProfile();
      if (res.data) {
        setProfileData(res.data);
        const u = res.data.user || {};
        const nutri = res.data.nutritionist_profile || {};
        const contact = res.data.contact_details || {};

        setBasicForm({
          full_name: u.full_name || "",
          phone_number: contact.mobile_number || u.phone_number || "",
          gender: contact.gender || "",
          date_of_birth: contact.date_of_birth || "",
          city: contact.city || "",
          country: contact.country || "",
        });

        setProfessionalForm({
          professional_title: nutri.professional_title || "Clinical Nutritionist",
          qualification: nutri.qualification || "",
          registration_number: nutri.registration_number || "",
          issuing_authority: nutri.issuing_authority || "",
          years_of_experience: nutri.years_of_experience || 0,
          current_organization: nutri.current_organization || "",
          professional_bio: nutri.professional_bio || "",
          languages_spoken: Array.isArray(nutri.languages_spoken)
            ? nutri.languages_spoken.join(", ")
            : nutri.languages_spoken || "English, Hindi",
        });

        setSelectedSpecializations(
          Array.isArray(nutri.specializations) ? nutri.specializations : []
        );

        setAppointmentForm({
          is_online_available: nutri.is_online_available ?? true,
          is_offline_available: nutri.is_offline_available ?? false,
          offline_location: nutri.offline_location || "",
          online_price: nutri.pending_online_price ?? nutri.online_price ?? 0,
          offline_price: nutri.pending_offline_price ?? nutri.offline_price ?? 0,
          offline_payment_required:
            nutri.pending_offline_payment_required ?? nutri.offline_payment_required ?? true,
        });
      }
    } catch (err) {
      console.error("Failed to load profile from backend:", err);
      if (authUser) {
        setProfileData((prev) => prev || {
          user: authUser,
          nutritionist_profile: { nutritionist_type: "inhouse", is_verified: true, is_virtual_enabled: true },
          contact_details: {},
          practice_metrics: { assigned_patients_count: 0, total_diet_plans: 0, active_diet_plans: 0 },
          subscription: { has_plan: true, plan_name: "Active Plan", is_active: true },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [authUser]);

  // Handle Basic Info Save
  const handleBasicSubmit = async (e) => {
    e.preventDefault();
    setSavingBasic(true);
    try {
      const res = await updateNutritionistProfile({
        full_name: basicForm.full_name,
        phone_number: basicForm.phone_number,
        gender: basicForm.gender,
        date_of_birth: basicForm.date_of_birth || null,
        city: basicForm.city,
        country: basicForm.country,
      });
      toast.success(res.data?.message || "Basic information updated successfully!");
      setIsEditingBasic(false);
      fetchProfile();
    } catch (err) {
      console.error("Failed to update basic info:", err);
      toast.error(err.response?.data?.error || "Failed to update basic info.");
    } finally {
      setSavingBasic(false);
    }
  };

  // Handle Professional Info Save
  const handleProfessionalSubmit = async (e) => {
    e.preventDefault();
    setSavingProfessional(true);
    try {
      const langs = professionalForm.languages_spoken
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);

      const res = await updateNutritionistProfile({
        professional_title: professionalForm.professional_title,
        qualification: professionalForm.qualification,
        registration_number: professionalForm.registration_number,
        issuing_authority: professionalForm.issuing_authority,
        years_of_experience: parseInt(professionalForm.years_of_experience) || 0,
        current_organization: professionalForm.current_organization,
        professional_bio: professionalForm.professional_bio,
        languages_spoken: JSON.stringify(langs),
      });
      toast.success(res.data?.message || "Professional details updated successfully!");
      setIsEditingProfessional(false);
      fetchProfile();
    } catch (err) {
      console.error("Failed to update professional details:", err);
      toast.error(err.response?.data?.error || "Failed to update professional details.");
    } finally {
      setSavingProfessional(false);
    }
  };

  // Handle Specializations Save
  const handleSpecializationsSubmit = async (e) => {
    e.preventDefault();
    if (selectedSpecializations.length === 0) {
      toast.error("Please select at least 1 area of clinical specialization.");
      return;
    }
    setSavingSpecializations(true);
    try {
      const res = await updateNutritionistProfile({
        specializations: JSON.stringify(selectedSpecializations),
      });
      toast.success(res.data?.message || "Specializations updated successfully!");
      setIsEditingSpecializations(false);
      fetchProfile();
    } catch (err) {
      console.error("Failed to update specializations:", err);
      toast.error(err.response?.data?.error || "Failed to update specializations.");
    } finally {
      setSavingSpecializations(false);
    }
  };

  // Toggle Specialization Tag
  const toggleSpecialization = (spec) => {
    setSelectedSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  // Handle Appointment & Price Update
  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    setSavingAppointment(true);
    try {
      const res = await updateNutritionistProfile({
        is_online_available: appointmentForm.is_online_available,
        is_offline_available: appointmentForm.is_offline_available,
        offline_location: appointmentForm.offline_location,
        online_price: parseFloat(appointmentForm.online_price || 0),
        offline_price: parseFloat(appointmentForm.offline_price || 0),
        offline_payment_required: appointmentForm.offline_payment_required,
      });
      toast.success(res.data?.message || "Appointment settings updated!");
      setIsEditingAppointment(false);
      fetchProfile();
    } catch (err) {
      console.error("Failed to update appointment settings:", err);
      toast.error(err.response?.data?.error || "Failed to update appointment settings.");
    } finally {
      setSavingAppointment(false);
    }
  };

  // Handle Document File Upload Directly
  const handleFileUpload = async (fieldName, file) => {
    if (!file) return;
    setUploadingDoc(fieldName);
    const toastId = toast.loading(`Uploading ${fieldName.replace(/_/g, " ")}...`);

    const formData = new FormData();
    formData.append(fieldName, file);

    try {
      await updateNutritionistProfile(formData);
      toast.update(toastId, {
        render: "Document uploaded & saved successfully!",
        type: "success",
        isLoading: false,
        autoClose: 3500,
        closeButton: true,
      });
      fetchProfile();
    } catch (err) {
      console.error("Document upload failed:", err);
      toast.update(toastId, {
        render: err.response?.data?.error || "Failed to upload document.",
        type: "error",
        isLoading: false,
        autoClose: 4000,
        closeButton: true,
      });
    } finally {
      setUploadingDoc(null);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const { old_password, new_password, confirm_password } = passwordData;

    if (!old_password || !new_password || !confirm_password) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (new_password.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }

    if (new_password !== confirm_password) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    if (old_password === new_password) {
      toast.error("New password must be different from current password.");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await changeNutritionistPassword(passwordData);
      toast.success(res.data?.message || "Password changed successfully!");
      setPasswordData({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      console.error("Failed to change password:", err);
      toast.error(err.response?.data?.error || "Failed to update password.");
    } finally {
      setChangingPassword(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "None", color: "bg-[var(--color-border-default)]", text: "text-[var(--color-text-muted)]" };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: "Weak", color: "bg-rose-500", text: "text-rose-500" };
      case 2:
        return { score: 50, label: "Fair", color: "bg-amber-500", text: "text-amber-500" };
      case 3:
        return { score: 75, label: "Good", color: "bg-[var(--color-primary-light)]", text: "text-[var(--color-primary)]" };
      case 4:
        return { score: 100, label: "Strong", color: "bg-[var(--color-primary)]", text: "text-[var(--color-primary)]" };
      default:
        return { score: 0, label: "Too Short", color: "bg-[var(--color-border-default)]", text: "text-[var(--color-text-muted)]" };
    }
  };

  const strength = getPasswordStrength(passwordData.new_password);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <PulsingDotsLoader />
      </div>
    );
  }

  const user = profileData?.user || authUser || {};
  const nutriProfile = profileData?.nutritionist_profile || {};
  const contactDetails = profileData?.contact_details || {};
  const metrics = profileData?.practice_metrics || {};
  const sub = profileData?.subscription || {};

  const fullName = user.full_name || authUser?.full_name || "Nutritionist Practitioner";
  const email = user.email || authUser?.email || "nutritionist@trackintake.co.in";
  const role = user.role || authUser?.role || "Nutritionist";
  const dateJoined = user.date_joined || authUser?.date_joined;

  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "DR";

  const memberSince = dateJoined
    ? new Date(dateJoined).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Active Practitioner";

  const isActive = user.is_active !== undefined ? user.is_active : true;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 font-[var(--font-secondary)] text-[var(--color-text-strong)]">
      {/* ── Practitioner Profile Hero Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative overflow-hidden rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs p-6 sm:p-8"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Avatar & Practitioner Bio */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative group">
              {nutriProfile.profile_photo ? (
                <img
                  src={nutriProfile.profile_photo}
                  alt={fullName}
                  className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl object-cover border-2 border-[var(--color-primary)] shadow-md"
                />
              ) : (
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border-2 border-[var(--color-border-hover)] font-extrabold text-2xl sm:text-3xl flex items-center justify-center font-[var(--font-primary)] flex-shrink-0 shadow-xs">
                  {initials}
                </div>
              )}

              {/* Photo Upload Overlay Button */}
              <label
                className="absolute -bottom-1 -right-1 p-2 bg-[var(--color-primary)] text-white rounded-full shadow-md cursor-pointer hover:scale-110 transition-transform"
                title="Update Profile Photo"
              >
                <Camera size={14} />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload("profile_photo", e.target.files[0])}
                />
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black font-[var(--font-primary)] text-[var(--color-text-strong)] tracking-tight">
                  {fullName}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)]">
                  <Award size={13} />
                  {nutriProfile.professional_title || "Clinical Nutritionist"}
                </span>
                {nutriProfile.is_verified ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <BadgeCheck size={13} /> Verified Practitioner
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                    <Clock size={13} /> Pending Verification
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap text-xs sm:text-sm text-[var(--color-text-muted)] font-medium">
                <span className="flex items-center gap-1.5">
                  <Mail size={14} className="text-[var(--color-primary)]" />
                  {email}
                </span>
                <span className="hidden sm:inline opacity-30">•</span>
                <span className="flex items-center gap-1.5">
                  <Phone size={14} className="text-[var(--color-primary)]" />
                  {contactDetails.mobile_number || user.phone_number || "No phone added"}
                </span>
                <span className="hidden sm:inline opacity-30">•</span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-[var(--color-primary)]" />
                  Practicing since {memberSince}
                </span>
              </div>
            </div>
          </div>

          {/* Sync Button */}
          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
            <button
              onClick={fetchProfile}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] hover:bg-[var(--color-bg-interactive-subtle)] hover:text-[var(--color-primary)] transition-all text-xs font-bold cursor-pointer shadow-xs active:scale-98"
              title="Refresh profile details"
            >
              <RotateCw size={14} className={loading ? "animate-spin text-[var(--color-primary)]" : ""} />
              <span>Sync Details</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Key Practice Metrics Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Assigned Patients */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.25 }}
          className="p-5 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs hover:border-[var(--color-border-hover)] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Assigned Patients
            </span>
            <div className="p-2.5 rounded-2xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)]">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
              {metrics.assigned_patients_count || 0}
            </span>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Active under your care</p>
          </div>
        </motion.div>

        {/* Metric 2: Diet Plans Formulated */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.25 }}
          className="p-5 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs hover:border-[var(--color-border-hover)] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Diet Plans Created
            </span>
            <div className="p-2.5 rounded-2xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)]">
              <Utensils size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
              {metrics.total_diet_plans || 0}
            </span>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Custom clinical formulations</p>
          </div>
        </motion.div>

        {/* Metric 3: Consultation Modes */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.25 }}
          className="p-5 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs hover:border-[var(--color-border-hover)] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Practice Availability
            </span>
            <div className="p-2.5 rounded-2xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)]">
              <Video size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-base sm:text-lg font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
              {nutriProfile.is_online_available && nutriProfile.is_offline_available
                ? "Online & In-Clinic"
                : nutriProfile.is_online_available
                ? "Online Consultations"
                : nutriProfile.is_offline_available
                ? "In-Clinic Only"
                : "Unavailable"}
            </span>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Online: {nutriProfile.price_approval_status === "pending" && nutriProfile.pending_online_price
                ? `₹${nutriProfile.pending_online_price} (Pending Approval)`
                : `₹${nutriProfile.online_price || 0}`} | Offline: {nutriProfile.price_approval_status === "pending" && nutriProfile.pending_offline_price
                ? `₹${nutriProfile.pending_offline_price} (Pending Approval)`
                : `₹${nutriProfile.offline_price || 0}`}
            </p>
          </div>
        </motion.div>

        {/* Metric 4: Subscription Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.25 }}
          className="p-5 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs hover:border-[var(--color-border-hover)] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Practitioner Tier
            </span>
            <div className="p-2.5 rounded-2xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)]">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-lg font-black text-[var(--color-text-strong)] font-[var(--font-primary)] truncate block">
              {sub.has_plan ? sub.plan_name : "Active Plan"}
            </span>
            <p className="text-xs font-semibold text-[var(--color-primary)] mt-0.5">
              {sub.has_plan && sub.remaining_days ? `${sub.remaining_days} days remaining` : "Continuous Access"}
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Main Profile Content (2 Columns Layout) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Left Column: All Core Registration Information (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* ── CARD 1: Basic Info & Contact Details (Step 1) ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.25 }}
            className="p-6 sm:p-7 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-default)]">
              <div>
                <h2 className="text-lg font-bold font-[var(--font-primary)] text-[var(--color-text-strong)] flex items-center gap-2">
                  <User size={18} className="text-[var(--color-primary)]" />
                  1. Basic Information & Contact
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Personal identity credentials and contact information.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingBasic(!isEditingBasic)}
                className="px-3.5 py-1.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] hover:bg-[var(--color-bg-interactive-subtle)] text-xs font-bold text-[var(--color-text-strong)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 size={13} className="text-[var(--color-primary)]" />
                {isEditingBasic ? "Cancel" : "Edit Basic Info"}
              </button>
            </div>

            {!isEditingBasic ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Full Name
                  </span>
                  <p className="text-sm font-bold text-[var(--color-text-strong)]">{fullName}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Email Address (Verified)
                  </span>
                  <p className="text-sm font-bold text-[var(--color-text-strong)] truncate">{email}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Phone Number
                  </span>
                  <p className="text-sm font-bold text-[var(--color-text-strong)]">
                    {contactDetails.mobile_number || user.phone_number || "Not provided"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Gender
                  </span>
                  <p className="text-sm font-bold text-[var(--color-text-strong)] capitalize">
                    {contactDetails.gender || "Not specified"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Date of Birth
                  </span>
                  <p className="text-sm font-bold text-[var(--color-text-strong)]">
                    {contactDetails.date_of_birth || "Not specified"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    City / Country
                  </span>
                  <p className="text-sm font-bold text-[var(--color-text-strong)]">
                    {[contactDetails.city, contactDetails.country].filter(Boolean).join(", ") || "Not specified"}
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBasicSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--color-text-strong)]">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={basicForm.full_name}
                      onChange={(e) => setBasicForm({ ...basicForm, full_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-xs text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--color-text-strong)]">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={basicForm.phone_number}
                      onChange={(e) => setBasicForm({ ...basicForm, phone_number: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-xs text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--color-text-strong)]">Gender</label>
                    <select
                      value={basicForm.gender}
                      onChange={(e) => setBasicForm({ ...basicForm, gender: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-xs text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 outline-none"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--color-text-strong)]">Date of Birth</label>
                    <input
                      type="date"
                      value={basicForm.date_of_birth}
                      onChange={(e) => setBasicForm({ ...basicForm, date_of_birth: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-xs text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--color-text-strong)]">City</label>
                    <input
                      type="text"
                      value={basicForm.city}
                      onChange={(e) => setBasicForm({ ...basicForm, city: e.target.value })}
                      placeholder="e.g. Mumbai"
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-xs text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--color-text-strong)]">Country</label>
                    <input
                      type="text"
                      value={basicForm.country}
                      onChange={(e) => setBasicForm({ ...basicForm, country: e.target.value })}
                      placeholder="e.g. India"
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-xs text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingBasic(false)}
                    className="px-4 py-2 rounded-xl border border-[var(--color-border-default)] text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingBasic}
                    className="px-5 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-98 disabled:opacity-50"
                  >
                    <Save size={14} />
                    <span>{savingBasic ? "Saving..." : "Save Basic Info"}</span>
                  </button>
                </div>
              </form>
            )}
          </motion.div>

          {/* ── CARD 2: Professional Qualifications & Bio (Step 2) ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.25 }}
            className="p-6 sm:p-7 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-default)]">
              <div>
                <h2 className="text-lg font-bold font-[var(--font-primary)] text-[var(--color-text-strong)] flex items-center gap-2">
                  <Briefcase size={18} className="text-[var(--color-primary)]" />
                  2. Professional Qualifications & Practice
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Academic qualifications, registration license, and background.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingProfessional(!isEditingProfessional)}
                className="px-3.5 py-1.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] hover:bg-[var(--color-bg-interactive-subtle)] text-xs font-bold text-[var(--color-text-strong)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 size={13} className="text-[var(--color-primary)]" />
                {isEditingProfessional ? "Cancel" : "Edit Professional Details"}
              </button>
            </div>

            {!isEditingProfessional ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Professional Title
                  </span>
                  <p className="text-sm font-bold text-[var(--color-text-strong)]">
                    {nutriProfile.professional_title || "Clinical Nutritionist"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Highest Qualification
                  </span>
                  <p className="text-sm font-bold text-[var(--color-text-strong)]">
                    {nutriProfile.qualification || "Not specified"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Registration / License No.
                  </span>
                  <p className="text-sm font-bold text-[var(--color-text-strong)]">
                    {nutriProfile.registration_number || "Not specified"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Issuing Authority
                  </span>
                  <p className="text-sm font-bold text-[var(--color-text-strong)]">
                    {nutriProfile.issuing_authority || "Not specified"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Years of Experience
                  </span>
                  <p className="text-sm font-bold text-[var(--color-text-strong)]">
                    {nutriProfile.years_of_experience || 0} Years
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Current Organization
                  </span>
                  <p className="text-sm font-bold text-[var(--color-text-strong)]">
                    {nutriProfile.current_organization || "Independent Practice"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Languages Spoken
                  </span>
                  <p className="text-sm font-semibold text-[var(--color-text-strong)]">
                    {Array.isArray(nutriProfile.languages_spoken) && nutriProfile.languages_spoken.length > 0
                      ? nutriProfile.languages_spoken.join(", ")
                      : "English, Hindi"}
                  </p>
                </div>

                {nutriProfile.professional_bio && (
                  <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1 sm:col-span-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      Professional Bio
                    </span>
                    <p className="text-xs text-[var(--color-text-strong)] leading-relaxed">
                      {nutriProfile.professional_bio}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleProfessionalSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--color-text-strong)]">Professional Title *</label>
                    <input
                      type="text"
                      required
                      value={professionalForm.professional_title}
                      onChange={(e) => setProfessionalForm({ ...professionalForm, professional_title: e.target.value })}
                      placeholder="e.g. Clinical Nutritionist"
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-xs text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--color-text-strong)]">Highest Qualification *</label>
                    <input
                      type="text"
                      required
                      value={professionalForm.qualification}
                      onChange={(e) => setProfessionalForm({ ...professionalForm, qualification: e.target.value })}
                      placeholder="e.g. MSc Clinical Nutrition"
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-xs text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--color-text-strong)]">Registration / License No. *</label>
                    <input
                      type="text"
                      required
                      value={professionalForm.registration_number}
                      onChange={(e) => setProfessionalForm({ ...professionalForm, registration_number: e.target.value })}
                      placeholder="e.g. REG-12345"
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-xs text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--color-text-strong)]">Issuing Authority *</label>
                    <input
                      type="text"
                      required
                      value={professionalForm.issuing_authority}
                      onChange={(e) => setProfessionalForm({ ...professionalForm, issuing_authority: e.target.value })}
                      placeholder="e.g. Medical Council of India"
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-xs text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--color-text-strong)]">Years of Experience</label>
                    <input
                      type="number"
                      min="0"
                      value={professionalForm.years_of_experience}
                      onChange={(e) => setProfessionalForm({ ...professionalForm, years_of_experience: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-xs text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[var(--color-text-strong)]">Current Organization</label>
                    <input
                      type="text"
                      value={professionalForm.current_organization}
                      onChange={(e) => setProfessionalForm({ ...professionalForm, current_organization: e.target.value })}
                      placeholder="e.g. Apollo Hospital"
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-xs text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-[var(--color-text-strong)]">Languages Spoken (comma separated)</label>
                    <input
                      type="text"
                      value={professionalForm.languages_spoken}
                      onChange={(e) => setProfessionalForm({ ...professionalForm, languages_spoken: e.target.value })}
                      placeholder="English, Hindi, Marathi..."
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-xs text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-[var(--color-text-strong)]">Professional Bio / Summary</label>
                    <textarea
                      rows={3}
                      value={professionalForm.professional_bio}
                      onChange={(e) => setProfessionalForm({ ...professionalForm, professional_bio: e.target.value })}
                      placeholder="Write a brief professional overview..."
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-xs text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfessional(false)}
                    className="px-4 py-2 rounded-xl border border-[var(--color-border-default)] text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfessional}
                    className="px-5 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-98 disabled:opacity-50"
                  >
                    <Save size={14} />
                    <span>{savingProfessional ? "Saving..." : "Save Professional Info"}</span>
                  </button>
                </div>
              </form>
            )}
          </motion.div>

          {/* ── CARD 3: Clinical Specializations (Step 3) ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.25 }}
            className="p-6 sm:p-7 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border-default)]">
              <div>
                <h3 className="text-base font-bold font-[var(--font-primary)] text-[var(--color-text-strong)] flex items-center gap-2">
                  <Sparkles size={18} className="text-[var(--color-primary)]" />
                  3. Clinical Specializations
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Selected areas of dietary practice and clinical expertise.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingSpecializations(!isEditingSpecializations)}
                className="px-3.5 py-1.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] hover:bg-[var(--color-bg-interactive-subtle)] text-xs font-bold text-[var(--color-text-strong)] transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Edit3 size={13} className="text-[var(--color-primary)]" />
                {isEditingSpecializations ? "Cancel" : "Manage Specializations"}
              </button>
            </div>

            {!isEditingSpecializations ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {Array.isArray(nutriProfile.specializations) && nutriProfile.specializations.length > 0 ? (
                  nutriProfile.specializations.map((spec, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)] flex items-center gap-1.5"
                    >
                      <Check size={12} />
                      <span>{spec}</span>
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-[var(--color-text-muted)] italic">No specializations selected yet.</p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSpecializationsSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {ALL_SPECIALIZATIONS.map((spec, sIdx) => {
                    const isSelected = selectedSpecializations.includes(spec);
                    return (
                      <button
                        type="button"
                        key={sIdx}
                        onClick={() => toggleSpecialization(spec)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? "border-[var(--color-primary)] bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] font-bold shadow-xs"
                            : "border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-[var(--color-text-strong)] hover:border-[var(--color-border-hover)]"
                        }`}
                      >
                        <span>{spec}</span>
                        {isSelected ? (
                          <div className="w-4 h-4 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shrink-0">
                            <Check size={10} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-[var(--color-border-default)] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingSpecializations(false)}
                    className="px-4 py-2 rounded-xl border border-[var(--color-border-default)] text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingSpecializations}
                    className="px-5 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-98 disabled:opacity-50"
                  >
                    <Save size={14} />
                    <span>{savingSpecializations ? "Saving..." : "Save Specializations"}</span>
                  </button>
                </div>
              </form>
            )}
          </motion.div>

          {/* ── CARD 4: Appointment & Pricing Controls (Step 4) ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.25 }}
            className="p-6 sm:p-7 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-default)] flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-bold font-[var(--font-primary)] text-[var(--color-text-strong)] flex items-center gap-2">
                  <DollarSign size={18} className="text-[var(--color-primary)]" />
                  4. Appointment & Pricing Controls
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Manage availability modes, clinic locations, and set appointment rates.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {nutriProfile.price_approval_status === "pending" && (
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/30 flex items-center gap-1">
                    <Clock size={12} /> Pending Admin Approval
                  </span>
                )}
                {nutriProfile.price_approval_status === "approved" && (
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Pricing Approved
                  </span>
                )}
                {nutriProfile.price_approval_status === "rejected" && (
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/30 flex items-center gap-1">
                    <AlertTriangle size={12} /> Pricing Rejected
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setIsEditingAppointment(!isEditingAppointment)}
                  className="px-3.5 py-1.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] hover:bg-[var(--color-bg-interactive-subtle)] text-xs font-bold text-[var(--color-text-strong)] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 size={13} className="text-[var(--color-primary)]" />
                  {isEditingAppointment ? "Cancel" : "Edit Pricing"}
                </button>
              </div>
            </div>

            {/* Status Alert Banner if Pending or Rejected */}
            {nutriProfile.price_approval_status === "pending" && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
                <Clock size={16} className="shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <p className="font-bold">Requested Pricing Updates Pending Admin Review</p>
                  <p className="mt-0.5 opacity-90">
                    Requested Online Price: <strong>₹{nutriProfile.pending_online_price ?? nutriProfile.online_price}</strong> | Requested Offline Price: <strong>₹{nutriProfile.pending_offline_price ?? nutriProfile.offline_price}</strong>.
                    Your current active pricing will remain live until Admin approves changes.
                  </p>
                </div>
              </div>
            )}

            {nutriProfile.price_approval_status === "rejected" && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-800 dark:text-rose-300">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <p className="font-bold">Price Request Rejected by Admin</p>
                  <p className="mt-0.5 opacity-90">
                    Reason: {nutriProfile.price_rejection_reason || "Not specified."}. Please adjust your rates and resubmit.
                  </p>
                </div>
              </div>
            )}

            {/* Read-Only Display Mode */}
            {!isEditingAppointment ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                    <Video size={12} className="text-[var(--color-primary)]" /> Online Appointment
                  </span>
                  <div className="text-sm font-bold text-[var(--color-text-strong)]">
                    {!nutriProfile.is_online_available ? (
                      <span className="text-[var(--color-text-muted)] font-normal">Not Available / Disabled</span>
                    ) : Number(nutriProfile.online_price) > 0 ? (
                      <span>Available (₹{nutriProfile.online_price} / session)</span>
                    ) : nutriProfile.price_approval_status === "pending" && Number(nutriProfile.pending_online_price) > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        Available (₹{nutriProfile.pending_online_price} - Pending Admin Approval)
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Available (Free / ₹0)
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                    <MapPin size={12} className="text-[var(--color-primary)]" /> Offline Appointment
                  </span>
                  <div className="text-sm font-bold text-[var(--color-text-strong)]">
                    {!nutriProfile.is_offline_available ? (
                      <span className="text-[var(--color-text-muted)] font-normal">Not Available / Disabled</span>
                    ) : Number(nutriProfile.offline_price) > 0 ? (
                      <span>Available (₹{nutriProfile.offline_price} / session)</span>
                    ) : nutriProfile.price_approval_status === "pending" && Number(nutriProfile.pending_offline_price) > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        Available (₹{nutriProfile.pending_offline_price} - Pending Admin Approval)
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Available (Free / ₹0)
                      </span>
                    )}
                  </div>
                </div>

                {nutriProfile.is_offline_available && (
                  <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1 sm:col-span-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                      <MapPin size={12} className="text-[var(--color-primary)]" /> Clinic Practice Location
                    </span>
                    <p className="text-xs font-semibold text-[var(--color-text-strong)]">
                      {nutriProfile.offline_location || "No clinic address specified."}
                    </p>
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                    <CreditCard size={12} className="text-[var(--color-primary)]" /> Offline Payment Settlement Policy
                  </span>
                  <p className="text-xs font-semibold text-[var(--color-text-strong)]">
                    {nutriProfile.offline_payment_required
                      ? "Online upfront payment required to confirm offline slot."
                      : "Pay at Clinic Enabled (Patient can book without immediate payment & pay cash at clinic)."}
                  </p>
                </div>
              </div>
            ) : (
              /* Editable Form Mode */
              <form onSubmit={handleAppointmentSubmit} className="space-y-4">
                {/* Section 1: Practice Consultation Modes */}
                <div className="p-4 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] flex items-center gap-1.5">
                    <Video size={14} /> Section 1: Practice Consultation Modes
                  </span>
                  <div className="flex flex-col gap-2 text-xs pt-1">
                    <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-[var(--color-text-strong)]">
                      <input
                        type="checkbox"
                        checked={appointmentForm.is_online_available}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, is_online_available: e.target.checked })}
                        className="accent-[var(--color-primary)] w-4 h-4 rounded"
                      />
                      <span>Online Video Appointment</span>
                    </label>

                    <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-[var(--color-text-strong)]">
                      <input
                        type="checkbox"
                        checked={appointmentForm.is_offline_available}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, is_offline_available: e.target.checked })}
                        className="accent-[var(--color-primary)] w-4 h-4 rounded"
                      />
                      <span>Offline In-Person Appointment</span>
                    </label>

                    <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-[var(--color-primary)]">
                      <input
                        type="checkbox"
                        checked={appointmentForm.is_online_available && appointmentForm.is_offline_available}
                        onChange={(e) => setAppointmentForm({
                          ...appointmentForm,
                          is_online_available: e.target.checked,
                          is_offline_available: e.target.checked,
                        })}
                        className="accent-[var(--color-primary)] w-4 h-4 rounded"
                      />
                      <span>Yes, Both Online & Offline Modes</span>
                    </label>
                  </div>
                </div>

                {/* Section 2: Consultation Fee Structure */}
                <div className="p-4 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] flex items-center gap-1.5">
                    <DollarSign size={14} /> Section 2: Consultation Fee Structure (₹)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {appointmentForm.is_online_available && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[var(--color-text-strong)]">
                          Online Price (₹) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={appointmentForm.online_price}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, online_price: e.target.value })}
                          placeholder="e.g. 500"
                          className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-xs text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 outline-none"
                        />
                      </div>
                    )}

                    {appointmentForm.is_offline_available && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[var(--color-text-strong)]">
                          Offline Price (₹) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={appointmentForm.offline_price}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, offline_price: e.target.value })}
                          placeholder="e.g. 800"
                          className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-xs text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Practice / Clinic Location */}
                {appointmentForm.is_offline_available && (
                  <div className="p-4 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] flex items-center gap-1.5">
                      <MapPin size={14} /> Section 3: Practice / Clinic Location Address *
                    </span>
                    <textarea
                      rows={2}
                      value={appointmentForm.offline_location}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, offline_location: e.target.value })}
                      placeholder="Enter full clinic address, landmark, city..."
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-xs text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 outline-none"
                    />
                  </div>
                )}

                {/* Section 4: Settlement & Pay-at-Clinic Policy */}
                {appointmentForm.is_offline_available && (
                  <div className="p-4 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] flex items-center gap-1.5">
                      <ShieldCheck size={14} /> Section 4: Settlement & Pay-at-Clinic Policy
                    </span>
                    <label className="inline-flex items-start gap-2 text-xs font-medium text-[var(--color-text-strong)] cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={!appointmentForm.offline_payment_required}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, offline_payment_required: !e.target.checked })}
                        className="accent-[var(--color-primary)] w-4 h-4 rounded mt-0.5 shrink-0"
                      />
                      <span>
                        Allow patients to book offline slots without immediate payment (Pay at clinic with cash)
                      </span>
                    </label>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingAppointment(false)}
                    className="px-4 py-2 rounded-xl border border-[var(--color-border-default)] text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAppointment}
                    className="px-5 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-98 disabled:opacity-50"
                  >
                    <Save size={14} />
                    <span>{savingAppointment ? "Submitting Request..." : "Save & Submit for Approval"}</span>
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>

        {/* Right Column: Verification Documents & Security (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* ── CARD 5: Verification Documents (Step 5) ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.25 }}
            className="p-6 sm:p-7 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs space-y-4"
          >
            <div className="pb-3 border-b border-[var(--color-border-default)]">
              <h3 className="text-base font-bold font-[var(--font-primary)] text-[var(--color-text-strong)] flex items-center gap-2">
                <FileText size={18} className="text-[var(--color-primary)]" />
                5. Verification Documents
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Uploaded credentials and verified professional documentation.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { label: "Qualification Certificate", key: "qualification_certificate", url: nutriProfile.qualification_certificate },
                { label: "Registration Certificate", key: "registration_certificate", url: nutriProfile.registration_certificate },
                { label: "Government ID Proof", key: "government_id", url: nutriProfile.government_id },
                { label: "Experience Certificate", key: "experience_certificate", url: nutriProfile.experience_certificate },
                { label: "Additional Certifications", key: "additional_certifications", url: nutriProfile.additional_certifications },
              ].map((doc, dIdx) => (
                <div
                  key={dIdx}
                  className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-xs font-bold text-[var(--color-text-strong)] truncate">{doc.label}</p>
                    <div className="flex items-center gap-2 text-[11px]">
                      {doc.url ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Uploaded
                        </span>
                      ) : (
                        <span className="text-[var(--color-text-muted)]">Not uploaded</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:text-[var(--color-primary)] text-[var(--color-text-strong)] text-xs font-bold transition flex items-center gap-1"
                        title="View Document"
                      >
                        <ExternalLink size={13} />
                        <span className="hidden sm:inline">View</span>
                      </a>
                    )}

                    <label
                      className={`p-2 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-xs ${
                        uploadingDoc === doc.key
                          ? "bg-[var(--color-border-default)] text-[var(--color-text-muted)] cursor-not-allowed"
                          : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                      }`}
                    >
                      <Upload size={13} />
                      <span>{doc.url ? "Replace" : "Upload"}</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,application/pdf,image/*"
                        disabled={uploadingDoc === doc.key}
                        className="hidden"
                        onChange={(e) => handleFileUpload(doc.key, e.target.files[0])}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── CARD 6: Change Password Form ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.25 }}
            className="p-6 sm:p-7 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs space-y-4"
          >
            <div className="pb-3 border-b border-[var(--color-border-default)]">
              <h3 className="text-base font-bold font-[var(--font-primary)] text-[var(--color-text-strong)] flex items-center gap-2">
                <Key size={18} className="text-[var(--color-primary)]" />
                Account Security & Password
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Update your practitioner account password.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              {/* Old Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text-strong)]">Current Password</label>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    required
                    value={passwordData.old_password}
                    onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                    placeholder="Enter current password"
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-xs text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] cursor-pointer"
                  >
                    {showOldPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text-strong)]">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    placeholder="Min 8 chars, symbols & digits"
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-xs text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {passwordData.new_password && (
                  <div className="pt-1.5 space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-[var(--color-text-muted)]">Strength</span>
                      <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--color-border-default)] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--color-text-strong)]">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    placeholder="Re-enter new password"
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-xs text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98 disabled:opacity-50"
                >
                  <Lock size={14} />
                  <span>{changingPassword ? "Updating Password..." : "Update Password"}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default NutritionistProfile;
