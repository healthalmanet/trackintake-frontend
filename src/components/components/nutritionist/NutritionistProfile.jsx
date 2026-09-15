import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  MessageSquare
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import {
  getNutritionistProfile,
  changeNutritionistPassword,
} from "../../../api/nutritionistApi";

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
      }
    } catch (err) {
      console.error("Failed to load profile from backend:", err);
      if (authUser) {
        setProfileData((prev) => prev || {
          user: authUser,
          nutritionist_profile: { nutritionist_type: "inhouse", is_verified: true, is_virtual_enabled: true },
          practice_metrics: { assigned_patients_count: 0, total_diet_plans: 0, active_diet_plans: 0 },
          subscription: { has_plan: true, plan_name: "Active Plan", is_active: true }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [authUser]);

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
      const errMsg = err.response?.data?.error || "Failed to update password.";
      toast.error(errMsg);
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
            <div className="relative">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-3xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border-2 border-[var(--color-border-hover)] font-extrabold text-2xl sm:text-3xl flex items-center justify-center font-[var(--font-primary)] flex-shrink-0 shadow-xs">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 bg-[var(--color-bg-surface)] rounded-full shadow-xs">
                <div className="w-4 h-4 rounded-full bg-[var(--color-primary)] border-2 border-[var(--color-bg-surface)]" title="Authorized Practitioner" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black font-[var(--font-primary)] text-[var(--color-text-strong)] tracking-tight">
                  {fullName}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)]">
                  <Award size={13} />
                  {nutriProfile.nutritionist_type === "expert" ? "Expert Consultant" : "Clinical Nutritionist"}
                </span>
                {nutriProfile.is_verified !== false && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-bg-interactive-subtle)] text-[var(--color-text-strong)] border border-[var(--color-border-default)]">
                    <BadgeCheck size={13} className="text-[var(--color-primary)]" /> Verified Practitioner
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

      {/* ── Key Practice Metrics Grid (Harmonized Matching Cards) ── */}
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

        {/* Metric 3: Virtual Consultations */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.25 }}
          className="p-5 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs hover:border-[var(--color-border-hover)] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Consultation Mode
            </span>
            <div className="p-2.5 rounded-2xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)]">
              <Video size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-lg font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
              Virtual Ready
            </span>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Zoom integration enabled</p>
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

      {/* ── Main Profile Content (2 Columns) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Left Column: Practitioner Details & Specialization (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card 1: Official Practitioner Record */}
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
                  Clinical Practitioner Record
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Verified system credentials and practice authorization.
                </p>
              </div>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)]">
                Authorized
              </span>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <User size={12} className="text-[var(--color-primary)]" /> Full Name
                </span>
                <p className="text-sm font-bold text-[var(--color-text-strong)]">{fullName}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <Mail size={12} className="text-[var(--color-primary)]" /> Email Address
                </span>
                <p className="text-sm font-bold text-[var(--color-text-strong)] truncate">{email}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <Phone size={12} className="text-[var(--color-primary)]" /> Phone Number
                </span>
                <p className="text-sm font-bold text-[var(--color-text-strong)]">{user.phone_number || "N/A"}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <Award size={12} className="text-[var(--color-primary)]" /> Designation
                </span>
                <p className="text-sm font-bold text-[var(--color-text-strong)] capitalize">{role}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-[var(--color-primary)]" /> Practice Scope
                </span>
                <p className="text-sm font-bold text-[var(--color-text-strong)]">
                  {nutriProfile.nutritionist_type === "expert" ? "Expert Consultant" : "Clinical Nutritionist"}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <Calendar size={12} className="text-[var(--color-primary)]" /> Registration Date
                </span>
                <p className="text-sm font-bold text-[var(--color-text-strong)]">{memberSince}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                  <BadgeCheck size={12} className="text-[var(--color-primary)]" /> Account Status
                </span>
                <p className="text-sm font-bold text-[var(--color-text-strong)]">
                  {isActive ? "Active & Authorized" : "Inactive"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Practitioner Capabilities & Tool Access */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.25 }}
            className="p-6 sm:p-7 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs space-y-4"
          >
            <div className="pb-3 border-b border-[var(--color-border-default)]">
              <h3 className="text-base font-bold font-[var(--font-primary)] text-[var(--color-text-strong)] flex items-center gap-2">
                <Sparkles size={18} className="text-[var(--color-primary)]" />
                Enabled Clinical Capabilities
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Full-suite practitioner features activated on your TrackIntake license.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {[
                { title: "Virtual Consultations", desc: "Zoom video appointments & slot scheduling", icon: <Video size={16} className="text-[var(--color-primary)]" /> },
                { title: "Diet Plan Generator", desc: "Target macros, micronutrients & recipe builder", icon: <Utensils size={16} className="text-[var(--color-primary)]" /> },
                { title: "Patient Biomarkers", desc: "Lab report review & vitals tracking", icon: <Activity size={16} className="text-[var(--color-primary)]" /> },
                { title: "Real-time Patient Chat", desc: "Encrypted direct messaging with voice note support", icon: <MessageSquare size={16} className="text-[var(--color-primary)]" /> },
              ].map((feat, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[var(--color-primary-bg-subtle)] border border-[var(--color-border-hover)] flex-shrink-0 mt-0.5">
                    {feat.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--color-text-strong)] font-[var(--font-primary)]">{feat.title}</h4>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 leading-snug">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Security & Password Update (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card 3: Change Password Form */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.25 }}
            className="p-6 sm:p-7 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs space-y-5"
          >
            <div className="pb-4 border-b border-[var(--color-border-default)]">
              <h2 className="text-lg font-bold font-[var(--font-primary)] text-[var(--color-text-strong)] flex items-center gap-2">
                <Key size={18} className="text-[var(--color-primary)]" />
                Change Password
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Keep your practitioner account secure by regularly updating your credentials.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text-strong)]">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    value={passwordData.old_password}
                    onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-xs sm:text-sm text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors p-1 cursor-pointer"
                  >
                    {showOldPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text-strong)]">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    placeholder="Enter new password (min. 8 chars)"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-xs sm:text-sm text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors p-1 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {/* Live Password Strength Meter */}
                {passwordData.new_password && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[var(--color-text-muted)]">Strength</span>
                      <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--color-bg-app)] border border-[var(--color-border-default)] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300`}
                        style={{ width: `${strength.score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--color-text-strong)]">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-xs sm:text-sm text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)] outline-none transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors p-1 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {passwordData.confirm_password && passwordData.new_password !== passwordData.confirm_password && (
                  <p className="text-xs text-rose-500 flex items-center gap-1 mt-1 font-medium">
                    <AlertCircle size={12} /> Passwords do not match
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-xs sm:text-sm transition-all shadow-sm hover:shadow-[var(--color-primary)]/20 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  <Lock size={15} />
                  <span>{changingPassword ? "Updating Password..." : "Update Password"}</span>
                </button>
              </div>
            </form>
          </motion.div>

          {/* Card 4: Security Checklist & Support Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.25 }}
            className="p-5 sm:p-6 rounded-3xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs space-y-4"
          >
            <div className="flex items-center gap-2 text-[var(--color-primary)]">
              <ShieldCheck size={18} />
              <h3 className="font-bold text-sm font-[var(--font-primary)] text-[var(--color-text-strong)]">
                Security & Compliance
              </h3>
            </div>

            <div className="space-y-2.5 text-xs text-[var(--color-text-muted)] leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                <span>Minimum 8 characters with letters, numbers, and symbols.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                <span>Encrypted HIPAA/GDPR clinical patient data protection.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                <span>Confidential zoom video and chat consultations.</span>
              </div>
            </div>

            <div className="p-3.5 bg-[var(--color-bg-app)] rounded-2xl border border-[var(--color-border-default)]">
              <p className="text-xs font-bold text-[var(--color-text-strong)]">Need Account Assistance?</p>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                Contact practitioner support at <span className="font-semibold text-[var(--color-primary)]">support@trackintake.co.in</span>
              </p>
            </div>
          </motion.div>

        </div>

      </div>

    </div>
  );
};

export default NutritionistProfile;
