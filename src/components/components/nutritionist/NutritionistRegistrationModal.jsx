import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  Award,
  FileText,
  Building,
  Globe,
  Upload,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  X,
  ArrowRight,
  ArrowLeft,
  Video,
  MapPin,
  DollarSign,
  ShieldCheck,
  Sparkles,
  Check,
  FileUp,
  Image as ImageIcon
} from "lucide-react";
import { toast } from "react-hot-toast";
import { sendOtp, verifyOtp, registerUser } from "../../../api/auth";

const SPECIALIZATION_OPTIONS = [
  "Weight Management",
  "Clinical Nutrition",
  "Diabetes Management",
  "PCOS",
  "Sports Nutrition",
  "Pediatric Nutrition",
  "Pregnancy Nutrition",
  "Cardiovascular Nutrition",
  "Renal Nutrition",
  "Gastrointestinal Nutrition",
  "Vegetarian/Vegan Nutrition",
  "Therapeutic Diets",
];

const NutritionistRegistrationModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);

  // Step 1: Basic Info
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2: Professional Info (All Optional / Supporting Credentials)
  const [professionalTitle, setProfessionalTitle] = useState("Clinical Nutritionist");
  const [qualification, setQualification] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [currentOrganization, setCurrentOrganization] = useState("");
  const [professionalBio, setProfessionalBio] = useState("");
  const [languagesSpoken, setLanguagesSpoken] = useState("English, Hindi");

  // Step 3: Specializations & Pricing
  const [selectedSpecializations, setSelectedSpecializations] = useState([]);
  const [isOnlineAvailable, setIsOnlineAvailable] = useState(true);
  const [isOfflineAvailable, setIsOfflineAvailable] = useState(false);
  const [offlineLocation, setOfflineLocation] = useState("");
  const [onlinePrice, setOnlinePrice] = useState("");
  const [offlinePrice, setOfflinePrice] = useState("");
  const [offlinePaymentRequired, setOfflinePaymentRequired] = useState(true);

  // Step 4: Documents & OTP (All Documents Optional)
  const [qualificationCert, setQualificationCert] = useState(null);
  const [registrationCert, setRegistrationCert] = useState(null);
  const [governmentId, setGovernmentId] = useState(null);
  const [experienceCert, setExperienceCert] = useState(null);
  const [additionalCerts, setAdditionalCerts] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);

  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Helper to clear error when user types into field
  const clearError = (field) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  // OTP Timer countdown
  useEffect(() => {
    let timer;
    if (otpSent && otpTimer > 0) {
      timer = setTimeout(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpSent, otpTimer]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const toggleSpecialization = (spec) => {
    clearError("specializations");
    setSelectedSpecializations((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const handleNextStep = () => {
    const errors = {};
    if (step === 1) {
      if (!fullName.trim()) {
        errors.fullName = "Please fill in your full name.";
      } else if (fullName.trim().length < 2) {
        errors.fullName = "Full name must be at least 2 characters long.";
      }

      const cleanPhone = phoneNumber.replace(/\D/g, "");
      if (!phoneNumber.trim()) {
        errors.phoneNumber = "Please enter your phone number.";
      } else if (cleanPhone.length < 10) {
        errors.phoneNumber = "Please enter a valid 10-digit mobile number.";
      }

      if (!email.trim()) {
        errors.email = "Please enter your email address.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = "Please enter a valid email address (e.g. doctor@clinic.com).";
      }

      if (!password) {
        errors.password = "Please enter a password.";
      } else if (password.length < 8) {
        errors.password = "Password must be at least 8 characters long.";
      }

      if (!confirmPassword) {
        errors.confirmPassword = "Please confirm your password.";
      } else if (password !== confirmPassword) {
        errors.confirmPassword = "Passwords do not match. Please re-check.";
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        toast.error("Please fill in all mandatory fields highlighted in red.");
        return;
      }
      setFieldErrors({});
      toast.success("Basic details saved.");
    } else if (step === 2) {
      // Step 2 has optional fields, validate numbers if provided
      if (yearsOfExperience !== "" && (isNaN(parseInt(yearsOfExperience)) || parseInt(yearsOfExperience) < 0)) {
        errors.yearsOfExperience = "Years of experience cannot be a negative number.";
        setFieldErrors(errors);
        toast.error("Please correct the highlighted field.");
        return;
      }
      setFieldErrors({});
      toast.success("Professional details saved.");
    } else if (step === 3) {
      if (selectedSpecializations.length === 0) {
        errors.specializations = "Please select at least 1 area of clinical specialization.";
        setFieldErrors(errors);
        toast.error("Please select at least one clinical specialization badge.");
        return;
      }
      setFieldErrors({});
      toast.success("Specializations saved.");
    } else if (step === 4) {
      if (!isOnlineAvailable && !isOfflineAvailable) {
        errors.appointmentMode = "Please enable at least one consultation mode (Online or Offline).";
      }

      if (isOnlineAvailable) {
        if (!onlinePrice || isNaN(parseFloat(onlinePrice)) || parseFloat(onlinePrice) <= 0) {
          errors.onlinePrice = "Please enter a valid online consultation fee (greater than ₹0).";
        }
      }

      if (isOfflineAvailable) {
        if (!offlineLocation.trim()) {
          errors.offlineLocation = "Please enter the physical clinic/practice address for offline appointments.";
        } else if (offlineLocation.trim().length < 5) {
          errors.offlineLocation = "Please enter a detailed clinic address (at least 5 characters).";
        }

        if (!offlinePrice || isNaN(parseFloat(offlinePrice)) || parseFloat(offlinePrice) <= 0) {
          errors.offlinePrice = "Please enter a valid offline consultation fee (greater than ₹0).";
        }
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        toast.error("Please complete the appointment and pricing configuration.");
        return;
      }
      setFieldErrors({});
      toast.success("Appointment & Pricing configured.");
    }
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // Trigger OTP Request on Step 5
  const handleRequestOtp = async () => {
    if (!email.trim()) {
      setFieldErrors({ email: "Email address is missing. Please enter your email." });
      setStep(1);
      return toast.error("Please enter email address in Step 1.");
    }
    const normalizedEmail = email.trim().toLowerCase();
    setSendingOtp(true);
    setVerificationToken("");
    clearError("otp");
    try {
      await sendOtp(normalizedEmail);
      toast.success(`OTP sent to ${normalizedEmail}. Valid for 10 minutes.`);
      setOtpSent(true);
      setOtpTimer(600);
    } catch (error) {
      const errMsg = error?.response?.data?.email?.[0] || error?.response?.data?.message || "Failed to send OTP.";
      setFieldErrors((prev) => ({ ...prev, otp: errMsg }));
      toast.error(errMsg);
    } finally {
      setSendingOtp(false);
    }
  };

  // Final Registration Submit
  const handleFinalRegistration = async (e) => {
    e.preventDefault();
    if (!otpSent) {
      await handleRequestOtp();
      return;
    }
    if (!otp.trim()) {
      setFieldErrors((prev) => ({ ...prev, otp: "Please enter the 6-digit OTP verification code." }));
      toast.error("Please enter the 6-digit OTP code.");
      return;
    }

    setSubmitting(true);
    clearError("otp");
    try {
      let token = verificationToken;
      if (!token) {
        try {
          const verifyRes = await verifyOtp(email.trim().toLowerCase(), otp.trim());
          token = verifyRes?.data?.verification_token || verifyRes?.verification_token;
          if (token) {
            setVerificationToken(token);
          }
        } catch (otpErr) {
          const otpMsg = otpErr?.response?.data?.error || otpErr?.response?.data?.otp?.[0] || otpErr?.response?.data?.message || "Invalid or expired OTP code. Please check your email.";
          setFieldErrors((prev) => ({ ...prev, otp: otpMsg }));
          toast.error(`❌ ${otpMsg}`, { duration: 6000 });
          setSubmitting(false);
          return;
        }
      }

      if (!token) {
        setFieldErrors((prev) => ({ ...prev, otp: "Verification token missing or expired. Please re-verify." }));
        toast.error("Verification token missing or invalid.");
        setSubmitting(false);
        return;
      }

      // Use FormData to support document file attachments
      const formData = new FormData();
      formData.append("full_name", fullName.trim());
      formData.append("email", email.trim().toLowerCase());
      formData.append("phone_number", phoneNumber.trim());
      formData.append("password", password);
      formData.append("verification_token", token);
      formData.append("role", "nutritionist");

      if (gender) formData.append("gender", gender);
      if (dateOfBirth) formData.append("date_of_birth", dateOfBirth);
      if (professionalTitle) formData.append("professional_title", professionalTitle);
      if (qualification) formData.append("qualification", qualification);
      if (registrationNumber) formData.append("registration_number", registrationNumber);
      if (issuingAuthority) formData.append("issuing_authority", issuingAuthority);
      if (yearsOfExperience) formData.append("years_of_experience", parseInt(yearsOfExperience) || 0);
      if (currentOrganization) formData.append("current_organization", currentOrganization);
      if (professionalBio) formData.append("professional_bio", professionalBio);

      // JSON stringified fields
      const langs = languagesSpoken.split(",").map((l) => l.trim()).filter(Boolean);
      formData.append("languages_spoken", JSON.stringify(langs));
      formData.append("specializations", JSON.stringify(selectedSpecializations));

      // Appointment Config
      formData.append("is_online_available", isOnlineAvailable);
      formData.append("is_offline_available", isOfflineAvailable);
      formData.append("offline_location", offlineLocation || "");
      formData.append("online_price", onlinePrice ? parseFloat(onlinePrice) : 0);
      formData.append("offline_price", offlinePrice ? parseFloat(offlinePrice) : 0);
      formData.append("offline_payment_required", offlinePaymentRequired);

      // Files
      if (qualificationCert) formData.append("qualification_certificate", qualificationCert);
      if (registrationCert) formData.append("registration_certificate", registrationCert);
      if (governmentId) formData.append("government_id", governmentId);
      if (experienceCert) formData.append("experience_certificate", experienceCert);
      if (additionalCerts) formData.append("additional_certifications", additionalCerts);
      if (profilePhoto) formData.append("profile_photo", profilePhoto);

      await registerUser(formData);
      toast.success("🎉 Registration complete! You can now log into your practitioner portal.");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      let msg = "Registration failed. Please check your details.";
      const resData = err?.response?.data;

      if (resData) {
        if (typeof resData === "string") {
          msg = resData;
        } else if (resData.message) {
          msg = resData.message;
        } else if (resData.error) {
          msg = resData.error;
        } else if (typeof resData === "object") {
          const fieldMsgs = [];
          const newFieldErrors = {};

          for (const [key, val] of Object.entries(resData)) {
            const valStr = Array.isArray(val) ? val.join(" ") : String(val);
            if (key === "email") {
              newFieldErrors.email = valStr;
              setStep(1); // Jump back to Step 1 so user sees the email error field!
            } else if (key === "phone_number" || key === "phoneNumber") {
              newFieldErrors.phoneNumber = valStr;
              setStep(1);
            } else if (key === "token") {
              msg = `OTP Verification Error: ${valStr}`;
            }
            const fieldLabel = key.replace(/_/g, " ").toUpperCase();
            fieldMsgs.push(`${fieldLabel}: ${valStr}`);
          }

          if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors((prev) => ({ ...prev, ...newFieldErrors }));
          }

          if (fieldMsgs.length > 0 && !msg.startsWith("OTP Verification Error:")) {
            msg = fieldMsgs.join("\n");
          }
        }
      } else if (err.message) {
        msg = err.message;
      }

      toast.error(msg, { duration: 6000 });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/70 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        className="relative w-full max-w-3xl lg:max-w-4xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-3xl shadow-2xl overflow-hidden my-auto font-[var(--font-secondary)]"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-7 bg-[var(--color-bg-surface)] border-b border-[var(--color-border-default)] flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black font-[var(--font-primary)] text-[var(--color-text-strong)] flex items-center gap-2.5">
              <Sparkles size={24} className="text-[var(--color-primary)] shrink-0" />
              <span>Practitioner Portal Registration</span>
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1 font-medium">
              Step {step} of 5: {
                step === 1 ? "Basic Credentials" :
                step === 2 ? "Professional Qualifications" :
                step === 3 ? "Clinical Specializations" :
                step === 4 ? "Appointment & Pricing Controls" :
                "Verification Documents & Final OTP"
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-[var(--color-bg-interactive-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stepper Progress Bar (5 Steps) */}
        <div className="px-4 sm:px-8 pt-4 pb-3 bg-[var(--color-bg-surface)] border-b border-[var(--color-border-default)]">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { num: 1, label: "Basic Info" },
              { num: 2, label: "Professional" },
              { num: 3, label: "Specializations" },
              { num: 4, label: "Appointment & Pricing" },
              { num: 5, label: "Documents & OTP" },
            ].map((s) => (
              <div key={s.num} className="flex flex-col gap-1.5">
                <div
                  className={`h-2 w-full rounded-full transition-all duration-300 ${
                    step >= s.num ? "bg-[var(--color-primary)]" : "bg-[var(--color-border-default)]"
                  }`}
                />
                <span className={`text-[11px] font-bold truncate ${step >= s.num ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"}`}>
                  {s.num}. {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleFinalRegistration} className="p-5 sm:p-8 space-y-6 max-h-[75vh] sm:max-h-[78vh] overflow-y-auto bg-[var(--color-bg-surface)]">
          {/* ──────────────── PAGE 1: BASIC INFORMATION ──────────────── */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-default)]">
                <p className="text-xs sm:text-sm font-bold text-[var(--color-primary)] uppercase tracking-wider">
                  Page 1: Personal Credentials & Contact Details
                </p>
                <span className="text-xs text-[var(--color-text-muted)]">* Required fields</span>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[var(--color-text-strong)] mb-1.5">
                  Full Name <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Priya Sharma"
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); clearError("fullName"); }}
                    className={`w-full pl-11 pr-4 py-3 bg-[var(--color-bg-app)] border text-xs sm:text-sm text-[var(--color-text-strong)] rounded-xl outline-none transition-all ${
                      fieldErrors.fullName ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5" : "border-[var(--color-border-default)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-bg-subtle)]"
                    }`}
                  />
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                </div>
                {fieldErrors.fullName && (
                  <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 mt-1.5 animate-pulse bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                    <AlertCircle size={14} className="shrink-0 text-rose-500" />
                    <span>{fieldErrors.fullName}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[var(--color-text-strong)] mb-1.5">
                    Gender <span className="text-xs text-[var(--color-text-muted)] font-normal ml-1">(Optional)</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => { setGender(e.target.value); clearError("gender"); }}
                    className="w-full px-4 py-3 bg-[var(--color-bg-app)] border border-[var(--color-border-default)] text-xs sm:text-sm text-[var(--color-text-strong)] rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-bg-subtle)]"
                  >
                    <option value="">Select Gender</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[var(--color-text-strong)] mb-1.5">
                    Date of Birth <span className="text-xs text-[var(--color-text-muted)] font-normal ml-1">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => { setDateOfBirth(e.target.value); clearError("dateOfBirth"); }}
                    className="w-full px-4 py-3 bg-[var(--color-bg-app)] border border-[var(--color-border-default)] text-xs sm:text-sm text-[var(--color-text-strong)] rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-bg-subtle)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[var(--color-text-strong)] mb-1.5">
                    Phone Number <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phoneNumber}
                      onChange={(e) => { setPhoneNumber(e.target.value); clearError("phoneNumber"); }}
                      className={`w-full pl-11 pr-4 py-3 bg-[var(--color-bg-app)] border text-xs sm:text-sm text-[var(--color-text-strong)] rounded-xl outline-none transition-all ${
                        fieldErrors.phoneNumber ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5" : "border-[var(--color-border-default)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-bg-subtle)]"
                      }`}
                    />
                    <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  </div>
                  {fieldErrors.phoneNumber && (
                    <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 mt-1.5 animate-pulse bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                      <AlertCircle size={14} className="shrink-0 text-rose-500" />
                      <span>{fieldErrors.phoneNumber}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[var(--color-text-strong)] mb-1.5">
                    Email Address <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="nutritionist@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
                      className={`w-full pl-11 pr-4 py-3 bg-[var(--color-bg-app)] border text-xs sm:text-sm text-[var(--color-text-strong)] rounded-xl outline-none transition-all ${
                        fieldErrors.email ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5" : "border-[var(--color-border-default)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-bg-subtle)]"
                      }`}
                    />
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 mt-1.5 animate-pulse bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                      <AlertCircle size={14} className="shrink-0 text-rose-500" />
                      <span>{fieldErrors.email}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[var(--color-text-strong)] mb-1.5">
                    Password <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
                      className={`w-full pl-11 pr-4 py-3 bg-[var(--color-bg-app)] border text-xs sm:text-sm text-[var(--color-text-strong)] rounded-xl outline-none transition-all ${
                        fieldErrors.password ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5" : "border-[var(--color-border-default)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-bg-subtle)]"
                      }`}
                    />
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 mt-1.5 animate-pulse bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                      <AlertCircle size={14} className="shrink-0 text-rose-500" />
                      <span>{fieldErrors.password}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[var(--color-text-strong)] mb-1.5">
                    Confirm Password <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); clearError("confirmPassword"); }}
                      className={`w-full pl-11 pr-4 py-3 bg-[var(--color-bg-app)] border text-xs sm:text-sm text-[var(--color-text-strong)] rounded-xl outline-none transition-all ${
                        fieldErrors.confirmPassword ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5" : "border-[var(--color-border-default)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-bg-subtle)]"
                      }`}
                    />
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 mt-1.5 animate-pulse bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                      <AlertCircle size={14} className="shrink-0 text-rose-500" />
                      <span>{fieldErrors.confirmPassword}</span>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ──────────────── PAGE 2: PROFESSIONAL INFORMATION ──────────────── */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-default)]">
                <p className="text-xs sm:text-sm font-bold text-[var(--color-primary)] uppercase tracking-wider">
                  Page 2: Clinical Qualifications & Practice Credentials
                </p>
                <span className="text-xs text-[var(--color-text-muted)] font-medium">All fields on this step are optional</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[var(--color-text-strong)] mb-1.5">
                    Professional Title <span className="text-xs text-[var(--color-text-muted)] font-normal ml-1">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Clinical Nutritionist / Dietitian"
                    value={professionalTitle}
                    onChange={(e) => { setProfessionalTitle(e.target.value); clearError("professionalTitle"); }}
                    className="w-full px-4 py-3 bg-[var(--color-bg-app)] border border-[var(--color-border-default)] text-xs sm:text-sm text-[var(--color-text-strong)] rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-bg-subtle)]"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[var(--color-text-strong)] mb-1.5">
                    Highest Qualification <span className="text-xs text-[var(--color-text-muted)] font-normal ml-1">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MSc Nutrition & Dietetics"
                    value={qualification}
                    onChange={(e) => { setQualification(e.target.value); clearError("qualification"); }}
                    className="w-full px-4 py-3 bg-[var(--color-bg-app)] border border-[var(--color-border-default)] text-xs sm:text-sm text-[var(--color-text-strong)] rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-bg-subtle)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[var(--color-text-strong)] mb-1.5">
                    Registration / License Number <span className="text-xs text-[var(--color-text-muted)] font-normal ml-1">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NIN/State Reg. No. 98451"
                    value={registrationNumber}
                    onChange={(e) => { setRegistrationNumber(e.target.value); clearError("registrationNumber"); }}
                    className="w-full px-4 py-3 bg-[var(--color-bg-app)] border border-[var(--color-border-default)] text-xs sm:text-sm text-[var(--color-text-strong)] rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-bg-subtle)]"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[var(--color-text-strong)] mb-1.5">
                    Issuing Authority <span className="text-xs text-[var(--color-text-muted)] font-normal ml-1">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Indian Dietetic Association"
                    value={issuingAuthority}
                    onChange={(e) => { setIssuingAuthority(e.target.value); clearError("issuingAuthority"); }}
                    className="w-full px-4 py-3 bg-[var(--color-bg-app)] border border-[var(--color-border-default)] text-xs sm:text-sm text-[var(--color-text-strong)] rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-bg-subtle)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[var(--color-text-strong)] mb-1.5">
                    Years of Experience <span className="text-xs text-[var(--color-text-muted)] font-normal ml-1">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                    value={yearsOfExperience}
                    onChange={(e) => { setYearsOfExperience(e.target.value); clearError("yearsOfExperience"); }}
                    className={`w-full px-4 py-3 bg-[var(--color-bg-app)] border text-xs sm:text-sm text-[var(--color-text-strong)] rounded-xl outline-none transition-all ${
                      fieldErrors.yearsOfExperience ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5" : "border-[var(--color-border-default)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-bg-subtle)]"
                    }`}
                  />
                  {fieldErrors.yearsOfExperience && (
                    <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 mt-1.5 animate-pulse bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                      <AlertCircle size={14} className="shrink-0 text-rose-500" />
                      <span>{fieldErrors.yearsOfExperience}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-[var(--color-text-strong)] mb-1.5">
                    Current Organization / Clinic <span className="text-xs text-[var(--color-text-muted)] font-normal ml-1">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ABC Wellness Clinic"
                    value={currentOrganization}
                    onChange={(e) => { setCurrentOrganization(e.target.value); clearError("currentOrganization"); }}
                    className="w-full px-4 py-3 bg-[var(--color-bg-app)] border border-[var(--color-border-default)] text-xs sm:text-sm text-[var(--color-text-strong)] rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-bg-subtle)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[var(--color-text-strong)] mb-1.5">
                  Languages Spoken <span className="text-xs text-[var(--color-text-muted)] font-normal ml-1">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. English, Hindi, Marathi"
                  value={languagesSpoken}
                  onChange={(e) => { setLanguagesSpoken(e.target.value); clearError("languagesSpoken"); }}
                  className="w-full px-4 py-3 bg-[var(--color-bg-app)] border border-[var(--color-border-default)] text-xs sm:text-sm text-[var(--color-text-strong)] rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-bg-subtle)]"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[var(--color-text-strong)] mb-1.5">
                  Professional Bio <span className="text-xs text-[var(--color-text-muted)] font-normal ml-1">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief introduction summarizing your clinical background and practice philosophy..."
                  value={professionalBio}
                  onChange={(e) => { setProfessionalBio(e.target.value); clearError("professionalBio"); }}
                  className="w-full p-4 bg-[var(--color-bg-app)] border border-[var(--color-border-default)] text-xs sm:text-sm text-[var(--color-text-strong)] rounded-xl outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-bg-subtle)]"
                />
              </div>
            </motion.div>
          )}

          {/* ──────────────── PAGE 3: CLINICAL SPECIALIZATIONS ──────────────── */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="pb-2 border-b border-[var(--color-border-default)] flex items-center justify-between">
                <p className="text-xs sm:text-sm font-bold text-[var(--color-primary)] uppercase tracking-wider">
                  Page 3: Clinical Specializations Setup
                </p>
                <span className="text-rose-500 font-bold text-xs">* Required (Select at least 1)</span>
              </div>

              {/* Specializations Badges */}
              <div className="space-y-3">
                <label className="block text-xs sm:text-sm font-bold text-[var(--color-text-strong)]">
                  Select Your Clinical Specializations <span className="text-rose-500 font-bold">*</span>
                </label>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Select all dietary & clinical focus areas relevant to your practice.
                </p>
                <div className={`flex flex-wrap gap-2.5 p-4 rounded-2xl border transition-all ${
                  fieldErrors.specializations ? "border-rose-500 bg-rose-500/5 ring-2 ring-rose-500/20" : "border-[var(--color-border-default)] bg-[var(--color-bg-app)]"
                }`}>
                  {SPECIALIZATION_OPTIONS.map((spec) => {
                    const isSelected = selectedSpecializations.includes(spec);
                    return (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpecialization(spec)}
                        className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer border ${
                          isSelected
                            ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm scale-102"
                            : "bg-[var(--color-bg-surface)] text-[var(--color-text-strong)] border-[var(--color-border-default)] hover:border-[var(--color-border-hover)]"
                        }`}
                      >
                        {isSelected && <Check size={15} />}
                        <span>{spec}</span>
                      </button>
                    );
                  })}
                </div>
                {fieldErrors.specializations && (
                  <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 mt-1.5 animate-pulse bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                    <AlertCircle size={14} className="shrink-0 text-rose-500" />
                    <span>{fieldErrors.specializations}</span>
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* ──────────────── PAGE 4: APPOINTMENT & PRICING CONTROLS (4 SEPARATE SECTIONS) ──────────────── */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="pb-2 border-b border-[var(--color-border-default)] flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-[var(--color-text-strong)] flex items-center gap-2">
                    <Sparkles size={18} className="text-[var(--color-primary)]" />
                    <span>Page 4: Appointment & Practice Availability Setup</span>
                  </h4>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    Configure your modes, pricing rates, clinic location, and settlement policies across 4 distinct sections
                  </p>
                </div>
              </div>

              {/* ── SECTION 1: Practice Consultation Modes ── */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-primary)] flex items-center gap-2">
                    <Video size={16} /> Section 1: Practice Consultation Modes
                  </span>
                  <span className="text-rose-500 font-bold text-xs">* Required</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Select your operational channels for patient consultation.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOnlineAvailable(true);
                      setIsOfflineAvailable(false);
                      clearError("appointmentMode");
                    }}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isOnlineAvailable && !isOfflineAvailable
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-bg-subtle)] shadow-xs"
                        : "border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:border-[var(--color-border-hover)]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className={`p-2 rounded-lg ${isOnlineAvailable && !isOfflineAvailable ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-bg-app)] text-[var(--color-text-muted)]"}`}>
                        <Video size={16} />
                      </div>
                      {isOnlineAvailable && !isOfflineAvailable && <Check size={16} className="text-[var(--color-primary)]" />}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[var(--color-text-strong)]">Online Appointments</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOnlineAvailable(false);
                      setIsOfflineAvailable(true);
                      clearError("appointmentMode");
                    }}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                      !isOnlineAvailable && isOfflineAvailable
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-bg-subtle)] shadow-xs"
                        : "border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:border-[var(--color-border-hover)]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className={`p-2 rounded-lg ${!isOnlineAvailable && isOfflineAvailable ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-bg-app)] text-[var(--color-text-muted)]"}`}>
                        <MapPin size={16} />
                      </div>
                      {!isOnlineAvailable && isOfflineAvailable && <Check size={16} className="text-[var(--color-primary)]" />}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[var(--color-text-strong)]">Offline Appointments</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOnlineAvailable(true);
                      setIsOfflineAvailable(true);
                      clearError("appointmentMode");
                    }}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isOnlineAvailable && isOfflineAvailable
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-bg-subtle)] shadow-xs"
                        : "border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:border-[var(--color-border-hover)]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className={`p-2 rounded-lg ${isOnlineAvailable && isOfflineAvailable ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-bg-app)] text-[var(--color-text-muted)]"}`}>
                        <Sparkles size={16} />
                      </div>
                      {isOnlineAvailable && isOfflineAvailable && <Check size={16} className="text-[var(--color-primary)]" />}
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-[var(--color-text-strong)]">Yes, Both Modes</span>
                  </button>
                </div>
                {fieldErrors.appointmentMode && (
                  <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 mt-2 animate-pulse bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                    <AlertCircle size={14} className="shrink-0 text-rose-500" />
                    <span>{fieldErrors.appointmentMode}</span>
                  </p>
                )}
              </div>

              {/* ── SECTION 2: Consultation Fee Structure ── */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-primary)] flex items-center gap-2">
                    <DollarSign size={16} /> Section 2: Consultation Fee Structure (₹)
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Define consultation charges per appointment type.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isOnlineAvailable && (
                    <div className="p-3.5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] space-y-2">
                      <label className="block text-xs font-bold text-[var(--color-text-strong)] flex items-center gap-1.5">
                        <Video size={14} className="text-[var(--color-primary)]" />
                        <span>Online Price (₹)</span>
                        <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 500"
                          value={onlinePrice}
                          onChange={(e) => { setOnlinePrice(e.target.value); clearError("onlinePrice"); }}
                          className={`w-full pl-9 pr-4 py-2.5 bg-[var(--color-bg-app)] border text-xs text-[var(--color-text-strong)] rounded-xl outline-none transition-all ${
                            fieldErrors.onlinePrice ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5" : "border-[var(--color-border-default)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-bg-subtle)]"
                          }`}
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-text-muted)]">₹</span>
                      </div>
                      {fieldErrors.onlinePrice && (
                        <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 mt-1.5 animate-pulse bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                          <AlertCircle size={14} className="shrink-0 text-rose-500" />
                          <span>{fieldErrors.onlinePrice}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {isOfflineAvailable && (
                    <div className="p-3.5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] space-y-2">
                      <label className="block text-xs font-bold text-[var(--color-text-strong)] flex items-center gap-1.5">
                        <MapPin size={14} className="text-[var(--color-primary)]" />
                        <span>Offline Price (₹)</span>
                        <span className="text-rose-500 font-bold ml-0.5">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 800"
                          value={offlinePrice}
                          onChange={(e) => { setOfflinePrice(e.target.value); clearError("offlinePrice"); }}
                          className={`w-full pl-9 pr-4 py-2.5 bg-[var(--color-bg-app)] border text-xs text-[var(--color-text-strong)] rounded-xl outline-none transition-all ${
                            fieldErrors.offlinePrice ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5" : "border-[var(--color-border-default)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-bg-subtle)]"
                          }`}
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--color-text-muted)]">₹</span>
                      </div>
                      {fieldErrors.offlinePrice && (
                        <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 mt-1.5 animate-pulse bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                          <AlertCircle size={14} className="shrink-0 text-rose-500" />
                          <span>{fieldErrors.offlinePrice}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* ── SECTION 3: Practice / Clinic Address Location ── */}
              {isOfflineAvailable && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-primary)] flex items-center gap-2">
                      <Building size={16} /> Section 3: Practice / Clinic Location
                    </span>
                    <span className="text-rose-500 font-bold text-xs">* Required for Offline</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Provide full clinic address details where patients visit for in-person appointments.
                  </p>
                  <textarea
                    rows={2}
                    placeholder="e.g. Suite 402, Care Wellness Clinic, MG Road, Mumbai"
                    value={offlineLocation}
                    onChange={(e) => { setOfflineLocation(e.target.value); clearError("offlineLocation"); }}
                    className={`w-full p-3 bg-[var(--color-bg-surface)] border text-xs text-[var(--color-text-strong)] rounded-xl outline-none transition-all ${
                      fieldErrors.offlineLocation ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5" : "border-[var(--color-border-default)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-bg-subtle)]"
                    }`}
                  />
                  {fieldErrors.offlineLocation && (
                    <p className="text-xs text-rose-500 font-semibold flex items-center gap-1.5 mt-1.5 animate-pulse bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                      <AlertCircle size={14} className="shrink-0 text-rose-500" />
                      <span>{fieldErrors.offlineLocation}</span>
                    </p>
                  )}
                </div>
              )}

              {/* ── SECTION 4: Settlement & Pay-at-Clinic Policy ── */}
              {isOfflineAvailable && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--color-primary)] flex items-center gap-2">
                      <ShieldCheck size={16} /> Section 4: Settlement & Pay-at-Clinic Policy
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)] font-normal">(Optional Setting)</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Configure offline slot booking payment requirements for patients.
                  </p>
                  <div className="p-3.5 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]">
                    <label className="inline-flex items-start gap-3 text-xs sm:text-sm text-[var(--color-text-strong)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!offlinePaymentRequired}
                        onChange={(e) => setOfflinePaymentRequired(!e.target.checked)}
                        className="accent-[var(--color-primary)] w-4 h-4 rounded mt-0.5 shrink-0"
                      />
                      <div>
                        <span className="font-bold block">
                          Allow offline appointment booking without immediate online payment
                        </span>
                        <span className="text-[11px] sm:text-xs text-[var(--color-text-muted)] block mt-0.5">
                          Patient settles payment directly at the clinic location with cash upon arrival.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ──────────────── PAGE 5: VERIFICATION DOCUMENTS & FINAL OTP ──────────────── */}
          {step === 5 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
              <div className="pb-2 border-b border-[var(--color-border-default)] flex items-center justify-between">
                <p className="text-xs sm:text-sm font-bold text-[var(--color-primary)] uppercase tracking-wider">
                  Page 5: Verification Documents & Final OTP Authorization
                </p>
                <span className="text-xs text-[var(--color-text-muted)] font-medium">All documents are optional</span>
              </div>

              {/* Document Attachments Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileInputField label="Qualification Certificate (Optional)" file={qualificationCert} setFile={setQualificationCert} />
                <FileInputField label="Registration Certificate (Optional)" file={registrationCert} setFile={setRegistrationCert} />
                <FileInputField label="Government ID Proof (Optional)" file={governmentId} setFile={setGovernmentId} />
                <FileInputField label="Experience Certificate (Optional)" file={experienceCert} setFile={setExperienceCert} />
                <FileInputField label="Additional Certifications (Optional)" file={additionalCerts} setFile={setAdditionalCerts} />
                <FileInputField label="Profile Photo (Optional)" file={profilePhoto} setFile={setProfilePhoto} isImage />
              </div>

              {/* Final OTP Verification Section */}
              <div className="p-5 rounded-2xl bg-[var(--color-primary-bg-subtle)] border border-[var(--color-border-hover)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[var(--color-text-strong)] flex items-center gap-1.5">
                      <span>Verify Email & Finalize Registration</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </h4>
                    <p className="text-xs text-[var(--color-text-muted)]">OTP code sent to {email || "your registered email"}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={sendingOtp || (otpSent && otpTimer > 540)}
                    className="px-4 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs sm:text-sm font-bold transition-all disabled:opacity-50 cursor-pointer shrink-0 shadow-xs"
                  >
                    {sendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP Code"}
                  </button>
                </div>

                {otpSent && (
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="font-semibold text-[var(--color-text-strong)]">
                        Enter 6-Digit OTP <span className="text-rose-500 font-bold">*</span>
                      </span>
                      <span className="text-[var(--color-primary)] font-bold">Valid for {formatTimer(otpTimer)}</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value.replace(/\D/g, ""));
                          setVerificationToken("");
                          clearError("otp");
                        }}
                        placeholder="123456"
                        className={`w-full pl-11 pr-4 py-3 bg-[var(--color-bg-surface)] border-2 tracking-widest text-lg font-bold text-[var(--color-text-strong)] rounded-xl outline-none transition-all ${
                          fieldErrors.otp
                            ? "border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/5 text-rose-600"
                            : "border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                        }`}
                      />
                      <KeyRound size={20} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${fieldErrors.otp ? "text-rose-500" : "text-[var(--color-primary)]"}`} />
                    </div>
                    {fieldErrors.otp && (
                      <p className="text-xs text-rose-500 font-bold flex items-center gap-1.5 mt-2 animate-pulse bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/30">
                        <AlertCircle size={15} className="shrink-0 text-rose-500" />
                        <span>{fieldErrors.otp}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-[var(--color-border-default)] flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-5 py-2.5 sm:py-3 rounded-xl border border-[var(--color-border-default)] text-xs sm:text-sm font-bold text-[var(--color-text-strong)] hover:bg-[var(--color-bg-interactive-subtle)] transition-all flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft size={16} /> Back
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 sm:py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-98 ml-auto"
              >
                <span>Next Step</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting || !otpSent}
                className="px-7 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-xs sm:text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98 ml-auto"
              >
                <CheckCircle2 size={18} />
                <span>{submitting ? "Creating Account..." : "Complete Registration"}</span>
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const FileInputField = ({ label, file, setFile, isImage = false }) => (
  <div className="p-3.5 sm:p-4 rounded-2xl bg-[var(--color-bg-app)] border border-[var(--color-border-default)] flex items-center justify-between gap-3">
    <div className="truncate min-w-0 flex-1">
      <p className="text-xs sm:text-sm font-bold text-[var(--color-text-strong)] truncate">{label}</p>
      <p className="text-[11px] sm:text-xs text-[var(--color-text-muted)] truncate mt-0.5">
        {file ? file.name : isImage ? "Optional photo - JPG, PNG, JPEG, WEBP" : "Optional attachment - PDF, JPG, JPEG, PNG, WEBP, DOC"}
      </p>
    </div>
    <label className="px-3.5 py-2 rounded-xl bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-interactive-subtle)] border border-[var(--color-border-default)] text-xs font-bold text-[var(--color-primary)] cursor-pointer shrink-0 flex items-center gap-1.5 transition-all">
      {isImage ? <ImageIcon size={14} /> : <Upload size={14} />}
      <span>{file ? "Change" : "Browse"}</span>
      <input
        type="file"
        accept={isImage ? "image/jpeg,image/png,image/jpg,image/webp,image/*" : ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,application/pdf,image/*"}
        onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
        className="hidden"
      />
    </label>
  </div>
);

export default NutritionistRegistrationModal;
