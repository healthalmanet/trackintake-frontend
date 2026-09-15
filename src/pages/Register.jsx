import React, { useEffect, useState } from "react";
import { registerUser, sendOtp, verifyOtp } from "../api/auth";
import { User, Mail, Lock, CircleCheck, CircleX, User2, KeyRound } from "lucide-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// ─── Main Component ───────────────────────────────────────────────────────────
const Register = ({ onSwitchToLogin }) => {
  const [role, setRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0); // 600s = 10 minutes
  const [showChecklist, setShowChecklist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const navigate = useNavigate();

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
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // ── Request OTP ───────────────────────────────────────────────────────────
  const handleRequestOtp = async () => {
    if (!role) return toast.error("Please select a role.");
    if (!fullName.trim()) return toast.warn("Please enter your full name.");
    if (!email) return toast.warn("Please enter your email address.");
    if (!isFormValid) return toast.warn("Please complete all required fields and ensure password criteria are met.");

    const normalizedEmail = email.trim().toLowerCase();
    setEmail(normalizedEmail);
    setOtpLoading(true);
    try {
      await sendOtp(normalizedEmail);
      toast.success(`OTP sent to ${normalizedEmail}. Valid for 10 minutes.`);
      setOtpSent(true);
      setOtpTimer(600); // 10 minutes
    } catch (error) {
      const errMsg = error?.response?.data?.email?.[0] || error?.response?.data?.message || "Failed to send OTP.";
      toast.error(errMsg);
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Final Registration Submit ─────────────────────────────────────────────
  const handleSubmitRegistration = async (e) => {
    e.preventDefault();

    if (!otpSent) {
      // If user clicks Register before OTP is sent, trigger OTP request
      await handleRequestOtp();
      return;
    }

    if (!otp || otp.trim().length === 0) {
      return toast.warn("Please enter the 6-digit OTP sent to your email.");
    }

    setLoading(true);
    try {
      // Step 1: Verify OTP & get verification token
      const verifyRes = await verifyOtp(email, otp.trim());
      const token = verifyRes?.verification_token || verifyRes?.data?.verification_token;

      if (!token) {
        throw new Error("Verification failed. No token received.");
      }

      // Step 2: Create account with backend
      await registerUser({
        full_name: fullName,
        email,
        password,
        password2: confirmPassword,
        verification_token: token,
        role,
      });

      toast.success("🎉 Account created successfully! Please log in.");
      if (onSwitchToLogin) {
        onSwitchToLogin();
      } else {
        navigate("/login");
      }
    } catch (error) {
      const errData = error?.response?.data;
      const message =
        errData?.otp?.[0] ||
        errData?.token?.[0] ||
        errData?.message ||
        errData?.error ||
        error.message ||
        "Registration failed. Please check your OTP and try again.";
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
    <div className="text-left w-full max-w-sm mx-auto p-4 font-[var(--font-secondary)]">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-[var(--font-primary)] text-center mb-6 text-[var(--color-text-strong)] font-bold"
      >
        Create Account
      </motion.h2>

      <motion.form
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        onSubmit={handleSubmitRegistration}
        className="space-y-4"
      >
        {/* ── Role Selection ── */}
        <motion.div variants={itemVariants}>
          <label className="block mb-1 text-sm font-semibold text-[var(--color-text-strong)]">Role</label>
          <div className="relative">
            <select
              className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] text-[var(--color-text-strong)] rounded-lg appearance-none focus:border-[var(--color-primary)] outline-none"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={otpSent || loading}
              required
            >
              <option value="">Select Role</option>
              <option value="nutritionist">Nutritionist</option>
              <option value="user">User / Client</option>
            </select>
            <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-muted)]" />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </motion.div>

        {/* ── Full Name ── */}
        <motion.div variants={itemVariants}>
          <label className="block mb-1 text-sm font-semibold text-[var(--color-text-strong)]">Full Name</label>
          <div className="relative">
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] text-[var(--color-text-strong)] rounded-lg focus:border-[var(--color-primary)] outline-none"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={otpSent || loading}
              required
            />
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-muted)]" />
          </div>
        </motion.div>

        {/* ── Email ── */}
        <motion.div variants={itemVariants}>
          <label className="block mb-1 text-sm font-semibold text-[var(--color-text-strong)]">Email Address</label>
          <div className="relative">
            <input
              type="email"
              className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] text-[var(--color-text-strong)] rounded-lg focus:border-[var(--color-primary)] outline-none"
              placeholder="email@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim().toLowerCase())}
              disabled={otpSent || loading}
              required
            />
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-muted)]" />
          </div>
        </motion.div>

        {/* ── Password ── */}
        <motion.div variants={itemVariants}>
          <label className="block mb-1 text-sm font-semibold text-[var(--color-text-strong)]">Password</label>
          <div className="relative">
            <input
              type="password"
              className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] text-[var(--color-text-strong)] rounded-lg focus:border-[var(--color-primary)] outline-none"
              placeholder="Min 8 chars + 1 symbol"
              value={password}
              onFocus={() => setShowChecklist(true)}
              onChange={(e) => setPassword(e.target.value)}
              disabled={otpSent || loading}
              required
            />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-muted)]" />
          </div>
        </motion.div>

        {/* ── Confirm Password ── */}
        <motion.div variants={itemVariants}>
          <label className="block mb-1 text-sm font-semibold text-[var(--color-text-strong)]">Confirm Password</label>
          <div className="relative">
            <input
              type="password"
              className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-app)] border-2 border-[var(--color-border-default)] text-[var(--color-text-strong)] rounded-lg focus:border-[var(--color-primary)] outline-none"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={otpSent || loading}
              required
            />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-text-muted)]" />
          </div>
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
                  className="w-full pl-10 pr-4 py-3 bg-[var(--color-bg-app)] border-2 border-[var(--color-primary)] text-[var(--color-text-strong)] tracking-widest text-lg font-bold rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  autoFocus
                  required
                />
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-primary)]" />
              </div>
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