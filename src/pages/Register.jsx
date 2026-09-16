import React, { useEffect, useState } from "react";
import { registerUser, sendOtp, verifyOtp } from "../api/auth";
import { User, Mail, Lock, CircleCheck, CircleX, User2, KeyRound, Phone, Sparkles } from "lucide-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import NutritionistRegistrationModal from "../components/components/nutritionist/NutritionistRegistrationModal";

// ─── Main Component ───────────────────────────────────────────────────────────
const Register = ({ onSwitchToLogin }) => {
  const [role, setRole] = useState("");
  const [isNutritionistModalOpen, setIsNutritionistModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState("");

  // Nutritionist Additional Registration Fields
  const [isOnlineAvailable, setIsOnlineAvailable] = useState(true);
  const [isOfflineAvailable, setIsOfflineAvailable] = useState(false);
  const [offlineLocation, setOfflineLocation] = useState("");
  const [onlinePrice, setOnlinePrice] = useState("");
  const [offlinePrice, setOfflinePrice] = useState("");
  const [offlinePaymentRequired, setOfflinePaymentRequired] = useState(true);

  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0); // 600s = 10 minutes
  const [otpError, setOtpError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showChecklist, setShowChecklist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const navigate = useNavigate();

  const clearError = (field) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  // ── Password validation ───────────────────────────────────────────────────
  const isLengthValid = password.length >= 8;
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isMatch = confirmPassword !== "" && password === confirmPassword;
  const isFormValid = isLengthValid && hasSymbol && isMatch && fullName.trim() !== "" && role !== "" && email.trim() !== "";

  // ── OTP timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let timer;
    if (otpSent && otpTimer > 0) {
      timer = setTimeout(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpSent, otpTimer]);

  // Format timer as mm:ss
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // ── Validate Form Fields ──
  const validateForm = () => {
    const errs = {};
    if (!role) {
      errs.role = "Please select whether you want to register as a User or Nutritionist.";
    }
    if (!fullName.trim()) {
      errs.fullName = "Please enter your full name.";
    } else if (fullName.trim().length < 2) {
      errs.fullName = "Full name must be at least 2 characters long.";
    }

    if (!email.trim()) {
      errs.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Please enter a valid email address (e.g. name@domain.com).";
    }

    if (!password) {
      errs.password = "Please enter a password.";
    } else if (password.length < 8) {
      errs.password = "Password must be at least 8 characters long.";
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errs.password = "Password must contain at least 1 special character (!@#$%^&*).";
    }

    if (!confirmPassword) {
      errs.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match. Please re-check.";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return false;
    }
    setFieldErrors({});
    return true;
  };

  // ── Request OTP ───────────────────────────────────────────────────────────
  const handleRequestOtp = async () => {
    if (!validateForm()) {
      return toast.warn("Please correct the highlighted fields before requesting OTP.");
    }
    const normalizedEmail = email.trim().toLowerCase();
    setOtpLoading(true);
    setOtpError("");
    setVerificationToken("");
    try {
      await sendOtp(normalizedEmail);
      toast.success(`OTP sent to ${normalizedEmail}. Valid for 10 minutes.`);
      setOtpSent(true);
      setOtpTimer(600); // 10 minutes
    } catch (error) {
      const errMsg = error?.response?.data?.email?.[0] || error?.response?.data?.message || "Failed to send OTP.";
      setOtpError(errMsg);
      setFieldErrors((prev) => ({ ...prev, email: errMsg }));
      toast.error(errMsg);
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Final Registration Submit ─────────────────────────────────────────────
  const handleSubmitRegistration = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!otpSent) {
      // If user clicks Register before OTP is sent, trigger OTP request
      await handleRequestOtp();
      return;
    }

    if (!otp || otp.trim().length === 0) {
      setOtpError("Please enter the 6-digit OTP sent to your email.");
      return toast.warn("Please enter the 6-digit OTP sent to your email.");
    }

    setLoading(true);
    setOtpError("");
    try {
      // Step 1: Verify OTP & get verification token
      let token = verificationToken;
      if (!token) {
        try {
          const verifyRes = await verifyOtp(email.trim().toLowerCase(), otp.trim());
          token = verifyRes?.data?.verification_token || verifyRes?.verification_token;
          if (token) {
            setVerificationToken(token);
          }
        } catch (otpErr) {
          const msg = otpErr?.response?.data?.error || otpErr?.response?.data?.otp?.[0] || otpErr?.response?.data?.message || "Invalid or expired OTP code. Please check your email.";
          setOtpError(msg);
          toast.error(`❌ ${msg}`);
          setLoading(false);
          return;
        }
      }

      if (!token) {
        setOtpError("Verification token missing or expired. Please re-verify.");
        toast.error("Verification failed. Invalid OTP token.");
        setLoading(false);
        return;
      }

      // Step 2: Create account with backend
      const payload = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone_number: phoneNumber.trim(),
        password,
        password2: confirmPassword,
        verification_token: token,
        role,
      };

      if (role === "nutritionist") {
        payload.is_online_available = isOnlineAvailable;
        payload.is_offline_available = isOfflineAvailable;
        payload.offline_location = offlineLocation;
        payload.online_price = onlinePrice ? parseFloat(onlinePrice) : 0;
        payload.offline_price = offlinePrice ? parseFloat(offlinePrice) : 0;
        payload.offline_payment_required = offlinePaymentRequired;
      }

      await registerUser(payload);

      toast.success("🎉 Account created successfully! Please log in.");
      if (onSwitchToLogin) {
        onSwitchToLogin();
      } else {
        navigate("/login");
      }
    } catch (error) {
      const errData = error?.response?.data;
      let message = "Registration failed. Please check your details and try again.";

      if (errData) {
        if (typeof errData === "string") {
          message = errData;
        } else if (errData.message) {
          message = errData.message;
        } else if (errData.error) {
          message = errData.error;
        } else if (typeof errData === "object") {
          const msgs = [];
          const newErrors = {};
          for (const [key, val] of Object.entries(errData)) {
            const detail = Array.isArray(val) ? val.join(" ") : String(val);
            if (key === "email") newErrors.email = detail;
            else if (key === "phone_number" || key === "phoneNumber") newErrors.phoneNumber = detail;
            else if (key === "password") newErrors.password = detail;
            else if (key === "full_name" || key === "fullName") newErrors.fullName = detail;
            const fieldLabel = key.replace(/_/g, " ").toUpperCase();
            msgs.push(`${fieldLabel}: ${detail}`);
          }
          if (Object.keys(newErrors).length > 0) {
            setFieldErrors((prev) => ({ ...prev, ...newErrors }));
          }
          if (msgs.length > 0) {
            message = msgs.join("\n");
          }
        }
      } else if (error.message) {
        message = error.message;
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Animation variants ─────────────────────────────────────────────────────
  const itemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 },
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-lg mx-auto font-[var(--font-secondary)]">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl sm:text-3xl font-[var(--font-primary)] text-center mb-1.5 text-[var(--color-text-strong)] font-black"
      >
        Create Account
      </motion.h2>
      <p className="text-xs sm:text-sm text-[var(--color-text-muted)] text-center mb-6">
        Sign up to access your health portal or nutritionist workspace
      </p>

      <motion.form
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        onSubmit={handleSubmitRegistration}
        className="space-y-4"
      >
        {/* ── Interactive Role Cards ── */}
        <motion.div variants={itemVariants} className="space-y-2">
          <label className="block text-xs sm:text-sm font-bold text-[var(--color-text-strong)]">
            I want to register as a <span className="text-rose-500 font-bold">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* User / Patient Card */}
            <button
              type="button"
              disabled={otpSent || loading}
              onClick={() => {
                setRole("user");
                clearError("role");
              }}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                role === "user"
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-bg-subtle)] shadow-sm"
                  : fieldErrors.role
                  ? "border-rose-500/50 bg-rose-500/5"
                  : "border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:border-[var(--color-border-hover)]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${role === "user" ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-bg-app)] text-[var(--color-text-muted)]"}`}>
                  <User size={18} />
                </div>
                {role === "user" && <CircleCheck size={18} className="text-[var(--color-primary)]" />}
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[var(--color-text-strong)]">User / Patient</h4>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 leading-tight">
                  Track intake, log weight & book health consultations
                </p>
              </div>
            </button>

            {/* Nutritionist Card */}
            <button
              type="button"
              disabled={otpSent || loading}
              onClick={() => {
                setRole("nutritionist");
                clearError("role");
                setIsNutritionistModalOpen(true);
              }}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                role === "nutritionist"
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-bg-subtle)] shadow-sm"
                  : fieldErrors.role
                  ? "border-rose-500/50 bg-rose-500/5"
                  : "border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:border-[var(--color-border-hover)]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-xl ${role === "nutritionist" ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-bg-app)] text-[var(--color-text-muted)]"}`}>
                  <Sparkles size={18} />
                </div>
                {role === "nutritionist" && <CircleCheck size={18} className="text-[var(--color-primary)]" />}
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[var(--color-text-strong)] flex items-center gap-1">
                  <span>Nutritionist</span>
                </h4>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 leading-tight">
                  5-Step Practitioner wizard & clinical portal setup
                </p>
              </div>
            </button>
          </div>
          {fieldErrors.role && (
            <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 mt-1.5 animate-pulse bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              <CircleX className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{fieldErrors.role}</span>
            </p>
          )}
        </motion.div>

        {/* ── Full Name ── */}
        <motion.div variants={itemVariants}>
          <label className="block mb-1 text-xs sm:text-sm font-semibold text-[var(--color-text-strong)]">
            Full Name <span className="text-rose-500 font-bold">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              className={`w-full pl-10 pr-4 py-3 bg-[var(--color-bg-app)] border-2 text-[var(--color-text-strong)] text-xs sm:text-sm rounded-lg outline-none transition-all ${
                fieldErrors.fullName
                  ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5"
                  : "border-[var(--color-border-default)] focus:border-[var(--color-primary)]"
              }`}
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearError("fullName");
              }}
              disabled={otpSent || loading}
              required
            />
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-muted)]" />
          </div>
          {fieldErrors.fullName && (
            <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 mt-1.5 animate-pulse bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              <CircleX className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{fieldErrors.fullName}</span>
            </p>
          )}
        </motion.div>

        {/* ── Phone Number ── */}
        <motion.div variants={itemVariants}>
          <label className="block mb-1 text-xs sm:text-sm font-semibold text-[var(--color-text-strong)]">
            Phone Number <span className="text-xs text-[var(--color-text-muted)] font-normal ml-1">(Optional)</span>
          </label>
          <div className="relative">
            <input
              type="tel"
              className={`w-full pl-10 pr-4 py-3 bg-[var(--color-bg-app)] border-2 text-[var(--color-text-strong)] text-xs sm:text-sm rounded-lg outline-none transition-all ${
                fieldErrors.phoneNumber
                  ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5"
                  : "border-[var(--color-border-default)] focus:border-[var(--color-primary)]"
              }`}
              placeholder="+91 9876543210"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                clearError("phoneNumber");
              }}
              disabled={otpSent || loading}
            />
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-muted)]" />
          </div>
          {fieldErrors.phoneNumber && (
            <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 mt-1.5 animate-pulse bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              <CircleX className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{fieldErrors.phoneNumber}</span>
            </p>
          )}
        </motion.div>

        {/* ── Email ── */}
        <motion.div variants={itemVariants}>
          <label className="block mb-1 text-xs sm:text-sm font-semibold text-[var(--color-text-strong)]">
            Email Address <span className="text-rose-500 font-bold">*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              className={`w-full pl-10 pr-4 py-3 bg-[var(--color-bg-app)] border-2 text-[var(--color-text-strong)] text-xs sm:text-sm rounded-lg outline-none transition-all ${
                fieldErrors.email
                  ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5"
                  : "border-[var(--color-border-default)] focus:border-[var(--color-primary)]"
              }`}
              placeholder="email@domain.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value.trim().toLowerCase());
                clearError("email");
              }}
              disabled={otpSent || loading}
              required
            />
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-muted)]" />
          </div>
          {fieldErrors.email && (
            <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 mt-1.5 animate-pulse bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              <CircleX className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{fieldErrors.email}</span>
            </p>
          )}
        </motion.div>

        {/* ── Password ── */}
        <motion.div variants={itemVariants}>
          <label className="block mb-1 text-xs sm:text-sm font-semibold text-[var(--color-text-strong)]">
            Password <span className="text-rose-500 font-bold">*</span>
          </label>
          <div className="relative">
            <input
              type="password"
              className={`w-full pl-10 pr-4 py-3 bg-[var(--color-bg-app)] border-2 text-[var(--color-text-strong)] text-xs sm:text-sm rounded-lg outline-none transition-all ${
                fieldErrors.password
                  ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5"
                  : "border-[var(--color-border-default)] focus:border-[var(--color-primary)]"
              }`}
              placeholder="Min 8 chars + 1 symbol"
              value={password}
              onFocus={() => setShowChecklist(true)}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
              }}
              disabled={otpSent || loading}
              required
            />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-muted)]" />
          </div>
          {fieldErrors.password && (
            <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 mt-1.5 animate-pulse bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              <CircleX className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{fieldErrors.password}</span>
            </p>
          )}
        </motion.div>

        {/* ── Confirm Password ── */}
        <motion.div variants={itemVariants}>
          <label className="block mb-1 text-xs sm:text-sm font-semibold text-[var(--color-text-strong)]">
            Confirm Password <span className="text-rose-500 font-bold">*</span>
          </label>
          <div className="relative">
            <input
              type="password"
              className={`w-full pl-10 pr-4 py-3 bg-[var(--color-bg-app)] border-2 text-[var(--color-text-strong)] text-xs sm:text-sm rounded-lg outline-none transition-all ${
                fieldErrors.confirmPassword
                  ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5"
                  : "border-[var(--color-border-default)] focus:border-[var(--color-primary)]"
              }`}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearError("confirmPassword");
              }}
              disabled={otpSent || loading}
              required
            />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-muted)]" />
          </div>
          {fieldErrors.confirmPassword && (
            <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 mt-1.5 animate-pulse bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              <CircleX className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{fieldErrors.confirmPassword}</span>
            </p>
          )}
        </motion.div>

        {/* Password checklist */}
        {(showChecklist || password || confirmPassword) && !otpSent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="text-sm text-[var(--color-text-strong)] bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] p-3 rounded-md space-y-1"
          >
            <ChecklistItem isValid={isLengthValid} text="At least 8 characters" />
            <ChecklistItem isValid={hasSymbol} text="At least 1 special symbol" />
            <ChecklistItem isValid={isMatch} text="Passwords match" />
          </motion.div>
        )}

        {/* ── OTP Field (Appears automatically when OTP is sent) ── */}
        <AnimatePresence>
          {otpSent && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="pt-2 border-t border-dashed border-[var(--color-border-default)] space-y-2"
            >
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-[var(--color-text-strong)]">Enter OTP</label>
                <span className="text-xs font-medium text-[var(--color-primary)]">
                  OTP valid for {formatTimer(otpTimer)}
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  className={`w-full pl-10 pr-4 py-3 bg-[var(--color-bg-app)] border-2 tracking-widest text-lg font-bold rounded-lg outline-none transition-all ${
                    otpError
                      ? "border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/5 text-rose-600"
                      : "border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]"
                  }`}
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ""));
                    setVerificationToken("");
                    setOtpError("");
                  }}
                  autoFocus
                  required
                />
                <KeyRound className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${otpError ? "text-rose-500" : "text-[var(--color-primary)]"}`} />
              </div>
              {otpError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 animate-pulse mt-1">
                  <CircleX className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>{otpError}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[var(--color-text-muted)]">Didn't receive OTP?</span>
                <button
                  type="button"
                  disabled={otpTimer > 540 || otpLoading} // allow resend after 1 min or if timer expired
                  onClick={handleRequestOtp}
                  className="text-[var(--color-primary)] font-semibold hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {otpLoading ? "Sending..." : "Resend OTP"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Action Button ── */}
        <motion.button
          variants={itemVariants}
          type="submit"
          disabled={!isFormValid || loading || otpLoading}
          className="w-full mt-4 bg-[var(--color-primary)] text-[var(--color-text-on-primary)] px-5 py-3 rounded-lg font-semibold shadow-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors"
        >
          {loading ? (
            "Creating Account..."
          ) : otpLoading ? (
            "Sending OTP..."
          ) : otpSent ? (
            "Submit & Create Account"
          ) : (
            "Register →"
          )}
        </motion.button>
      </motion.form>

      {/* Footer Link to Login */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
        className="mt-6 text-center text-sm"
      >
        <span className="text-[var(--color-text-default)] font-medium">Already have an account? </span>
        <button
          type="button"
          onClick={onSwitchToLogin || (() => navigate("/login"))}
          className="text-[var(--color-primary)] font-semibold underline hover:text-[var(--color-primary-hover)] transition-colors"
        >
          Login here
        </button>
      </motion.div>

      {/* ── Multi-step Nutritionist Registration Modal ── */}
      <NutritionistRegistrationModal
        isOpen={isNutritionistModalOpen}
        onClose={() => {
          setIsNutritionistModalOpen(false);
          if (role === "nutritionist") setRole("");
        }}
        onSuccess={() => {
          setIsNutritionistModalOpen(false);
          toast.success("🎉 Nutritionist registered! Please log in.");
          if (onSwitchToLogin) {
            onSwitchToLogin();
          } else {
            navigate("/login");
          }
        }}
      />
    </div>
  );
};

// ─── Reusable Sub-components ──────────────────────────────────────────────────
const ChecklistItem = ({ isValid, text }) => (
  <div className={`flex items-center gap-2 ${isValid ? "text-emerald-600" : "text-rose-500"}`}>
    {isValid ? <CircleCheck className="w-4 h-4 shrink-0" /> : <CircleX className="w-4 h-4 shrink-0" />}
    <span>{text}</span>
  </div>
);

export default Register;