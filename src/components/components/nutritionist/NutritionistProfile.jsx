import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Shield,
  Key,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  Utensils,
  CreditCard,
  Calendar,
  Award,
  RotateCw,
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
      <div className="w-3 h-3 rounded-full bg-[var(--color-primary)] animate-bounce [animation-delay:-0.3s]" />
      <div className="w-3 h-3 rounded-full bg-[var(--color-primary)] animate-bounce [animation-delay:-0.15s]" />
      <div className="w-3 h-3 rounded-full bg-[var(--color-primary)] animate-bounce" />
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
    if (!pwd) return { score: 0, label: "None", color: "bg-gray-200" };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: "Weak", color: "bg-red-500", text: "text-red-500" };
      case 2:
        return { score: 50, label: "Fair", color: "bg-amber-500", text: "text-amber-500" };
      case 3:
        return { score: 75, label: "Good", color: "bg-blue-500", text: "text-blue-500" };
      case 4:
        return { score: 100, label: "Strong", color: "bg-green-500", text: "text-green-500" };
      default:
        return { score: 0, label: "Too Short", color: "bg-gray-300", text: "text-gray-400" };
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-[var(--font-secondary)]">
      {/* 🌟 HERO PRACTITIONER BANNER */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-primary)] via-emerald-600 to-teal-800 text-white p-6 sm:p-8 shadow-xl shadow-emerald-950/10"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none transform translate-x-20 -translate-y-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-white font-extrabold text-2xl sm:text-3xl shadow-lg flex-shrink-0">
              {initials}
            </div>

            {/* Practitioner Header */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold font-[var(--font-primary)] tracking-tight">
                  {fullName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm border border-white/30 text-white">
                  <Award size={13} className="text-amber-300" />
                  {nutriProfile.nutritionist_type === "expert" ? "Expert Specialist" : "In-House Nutritionist"}
                </span>
                {nutriProfile.is_verified !== false && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-100 border border-emerald-300/40">
                    <CheckCircle2 size={12} className="text-emerald-300" /> Verified
                  </span>
                )}
              </div>

              <p className="text-emerald-100 text-sm flex items-center gap-2 flex-wrap">
                <span>{email}</span>
                <span>•</span>
                <span>Practicing since {memberSince}</span>
              </p>
            </div>
          </div>

          <button
            onClick={fetchProfile}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-xs font-semibold backdrop-blur-sm border border-white/20 self-end md:self-auto"
            title="Refresh profile data"
          >
            <RotateCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Sync Details</span>
          </button>
        </div>
      </motion.div>

      {/* 📄 SECTION 1: PREFILLED NUTRITIONIST DETAILS (READ-ONLY) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-[var(--color-bg-surface)] p-6 sm:p-8 rounded-3xl border border-[var(--color-border-default)] shadow-sm space-y-6"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border-default)]">
          <div>
            <h2 className="text-lg font-bold font-[var(--font-primary)] text-[var(--color-text-strong)] flex items-center gap-2">
              <User size={20} className="text-[var(--color-primary)]" />
              Practitioner Profile
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Verified account and clinical practitioner credentials.
            </p>
          </div>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[var(--color-bg-interactive-subtle)] text-[var(--color-text-muted)] border border-[var(--color-border-default)]">
            Verified Record
          </span>
        </div>

        {/* Read-Only Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Full Name */}
          <div className="p-4 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] flex items-center gap-1.5">
              <User size={13} className="text-[var(--color-primary)]" />
              Full Name
            </span>
            <p className="text-sm font-bold text-[var(--color-text-strong)] truncate">
              {fullName}
            </p>
          </div>

          {/* Email Address */}
          <div className="p-4 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] flex items-center gap-1.5">
              <Mail size={13} className="text-[var(--color-primary)]" />
              Registered Email
            </span>
            <p className="text-sm font-bold text-[var(--color-text-strong)] truncate">
              {email}
            </p>
          </div>

          {/* Role / Designation */}
          <div className="p-4 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] flex items-center gap-1.5">
              <Award size={13} className="text-[var(--color-primary)]" />
              Role & Designation
            </span>
            <p className="text-sm font-bold text-[var(--color-text-strong)] capitalize">
              {role}
            </p>
          </div>

          {/* Member Since / Registration Date */}
          <div className="p-4 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] flex items-center gap-1.5">
              <Calendar size={13} className="text-[var(--color-primary)]" />
              Account Created On
            </span>
            <p className="text-sm font-bold text-[var(--color-text-strong)]">
              {memberSince}
            </p>
          </div>

          {/* Practitioner Type */}
          <div className="p-4 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] flex items-center gap-1.5">
              <Shield size={13} className="text-[var(--color-primary)]" />
              Practitioner Tier
            </span>
            <p className="text-sm font-bold text-[var(--color-text-strong)]">
              {nutriProfile.nutritionist_type === "expert" ? "Expert Specialist" : "In-House Nutritionist"}
            </p>
          </div>

          {/* Account & Verification Status */}
          <div className="p-4 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-1">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-500" />
              Account Status
            </span>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {isActive ? "Active & Authorized" : "Inactive"}
            </p>
          </div>
        </div>

        {/* Practice Overview Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-3.5">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/50 text-[var(--color-primary)] rounded-xl">
              <Users size={20} />
            </div>
            <div>
              <span className="text-xs text-[var(--color-text-muted)] font-medium">Assigned Patients</span>
              <p className="text-lg font-bold text-[var(--color-text-strong)]">{metrics.assigned_patients_count || 0}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex items-center gap-3.5">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 rounded-xl">
              <Utensils size={20} />
            </div>
            <div>
              <span className="text-xs text-[var(--color-text-muted)] font-medium">Diet Plans Formulated</span>
              <p className="text-lg font-bold text-[var(--color-text-strong)]">{metrics.total_diet_plans || 0}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 flex items-center gap-3.5">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-900/50 text-purple-600 rounded-xl">
              <CreditCard size={20} />
            </div>
            <div>
              <span className="text-xs text-[var(--color-text-muted)] font-medium">Current Subscription</span>
              <p className="text-sm font-bold text-[var(--color-text-strong)] truncate">
                {sub.has_plan ? sub.plan_name : "Active Plan"}
              </p>
              {sub.has_plan && (
                <p className="text-[11px] font-semibold text-[var(--color-primary)]">
                  {sub.remaining_days} days remaining
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 🔒 SECTION 2: CHANGE PASSWORD SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Password Form (2 Cols) */}
        <div className="lg:col-span-2 bg-[var(--color-bg-surface)] p-6 sm:p-8 rounded-3xl border border-[var(--color-border-default)] shadow-sm space-y-6">
          <div className="pb-4 border-b border-[var(--color-border-default)]">
            <h2 className="text-lg font-bold font-[var(--font-primary)] text-[var(--color-text-strong)] flex items-center gap-2">
              <Key size={20} className="text-[var(--color-primary)]" />
              Change Password
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Update your account password to maintain practitioner login security.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
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
                  placeholder="Enter your current password"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-sm text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors p-1"
                >
                  {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
                  placeholder="Enter a new password (min. 8 characters)"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-sm text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors p-1"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {passwordData.new_password && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--color-text-muted)]">Password Strength</span>
                    <span className={`font-bold ${strength.text}`}>{strength.label}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
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
                  placeholder="Confirm your new password"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-app)] text-sm text-[var(--color-text-strong)] focus:ring-2 focus:ring-[var(--color-primary)]/40 focus:border-[var(--color-primary)] outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors p-1"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordData.confirm_password && passwordData.new_password !== passwordData.confirm_password && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle size={12} /> Passwords do not match
                </p>
              )}
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={changingPassword}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-[var(--color-text-on-primary)] font-bold text-sm hover:bg-[var(--color-primary-hover)] transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <Key size={16} />
                {changingPassword ? "Updating..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>

        {/* Security Info Card (1 Col) */}
        <div className="bg-[var(--color-bg-surface)] p-6 rounded-3xl border border-[var(--color-border-default)] shadow-sm space-y-5 h-fit">
          <div className="flex items-center gap-2 text-[var(--color-primary)]">
            <Shield size={20} />
            <h3 className="font-bold text-base font-[var(--font-primary)] text-[var(--color-text-strong)]">
              Security Guidelines
            </h3>
          </div>

          <div className="space-y-4 text-xs text-[var(--color-text-muted)] leading-relaxed">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Use at least 8 characters with numbers, symbols, and mixed-case letters.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Never share your practitioner credentials with unassigned clinic staff.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>Your session and patient records are guarded under secure end-to-end encryption.</span>
            </div>
          </div>

          <div className="p-4 bg-[var(--color-bg-interactive-subtle)] rounded-2xl border border-[var(--color-border-default)]">
            <p className="text-xs font-semibold text-[var(--color-text-strong)]">Need Account Help?</p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
              Contact TrackIntake practitioner support at <strong>support@trackintake.co.in</strong>.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NutritionistProfile;
