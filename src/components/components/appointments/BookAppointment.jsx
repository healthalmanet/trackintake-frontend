import React, { useEffect, useState, useCallback } from "react";
import { getAvailableSlots, bookAppointment, getMyInHouseNutritionist, getExpertNutritionists } from "../../../api/appointmentApi";
import SlotPicker from "./SlotPicker";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, User, ChevronRight, CalendarDays, Video, Users, Building2, Heart, X, MapPin, Sparkles, CheckCircle2, DollarSign, Award, ShieldCheck, FileText, Check, Star, Info } from "lucide-react";
import { payConsultationFee, verifyPayment } from "../../../api/subscriptionService";
import { toast } from "react-toastify";
// Import advertisement image
import bpMonitorAd from "../../../assets/download.jpg";

// In-memory module caches to eliminate repeat network waterfalls
let inHouseNutritionistCache = null;
let expertNutritionistsCache = null;

const CLINICAL_CONDITION_OPTIONS = [
  "Weight Management",
  "Diabetes / Blood Sugar",
  "PCOS / PCOD",
  "Thyroid Disorder",
  "Hypertension / High BP",
  "Fatty Liver / Cholesterol",
  "Renal / Kidney Health",
  "Gastrointestinal / Gut Health",
  "Sports Performance",
  "Post-Surgical / Clinical",
];

const formatLocalDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayStr = () => formatLocalDate(new Date());
const getTomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatLocalDate(d);
};

export const extractErrorMessage = (error, fallback = "Booking failed. Try again.") => {
  if (!error) return fallback;
  const data = error.response?.data || error.data || error;
  if (typeof data === "string") return data;
  if (Array.isArray(data)) {
    return typeof data[0] === "string" ? data[0] : extractErrorMessage(data[0], fallback);
  }
  if (typeof data === "object") {
    if (data.detail && typeof data.detail === "string") return data.detail;
    if (data.message && typeof data.message === "string") return data.message;
    if (data.error && typeof data.error === "string") return data.error;
    if (data.non_field_errors) {
      return Array.isArray(data.non_field_errors)
        ? data.non_field_errors[0]
        : String(data.non_field_errors);
    }
    const firstVal = Object.values(data)[0];
    if (firstVal) {
      if (typeof firstVal === "string") return firstVal;
      if (Array.isArray(firstVal) && typeof firstVal[0] === "string") return firstVal[0];
      if (typeof firstVal === "object") return extractErrorMessage(firstVal, fallback);
    }
  }
  return error.message || fallback;
};

const BookAppointment = ({ onBooked }) => {
  const { user } = useAuth();

  const [appointmentCategory, setAppointmentCategory] = useState("IN_HOUSE"); // IN_HOUSE | EXPERT
  const [appointmentType, setAppointmentType] = useState("VIRTUAL"); // VIRTUAL | IN_PERSON

  const [experts, setExperts] = useState(() => expertNutritionistsCache || []);
  const [expertId, setExpertId] = useState("");

  const [nutritionistId, setNutritionistId] = useState(() => inHouseNutritionistCache?.nutritionist_id || null);
  const [nutritionistInfo, setNutritionistInfo] = useState(() => inHouseNutritionistCache || null);

  const [date, setDate] = useState(getTodayStr());
  const [slots, setSlots] = useState([]);

  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [showAd, setShowAd] = useState(true);
  const [showConsultPayment, setShowConsultPayment] = useState(false);
  const [consultType, setConsultType] = useState(null);
  const [pendingSlotId, setPendingSlotId] = useState(null);
  const [consultPaymentDetails, setConsultPaymentDetails] = useState(null);

  // Variable Case Submission Modal State (Two-step flow for variable slots)
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [caseSlot, setCaseSlot] = useState(null);
  const [caseSummary, setCaseSummary] = useState("");
  const [caseConditions, setCaseConditions] = useState([]);
  const [submittingCase, setSubmittingCase] = useState(false);

  // In-House & Fixed slot Instant Confirmation Modal State (Captures reason & details seamlessly)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmSlot, setConfirmSlot] = useState(null);
  const [bookingReason, setBookingReason] = useState("");
  const [bookingConditions, setBookingConditions] = useState([]);
  const [confirmingBooking, setConfirmingBooking] = useState(false);

  // Profile modal state (for inspecting full practitioner credentials)
  const [profileModalNutri, setProfileModalNutri] = useState(null);

  // Helper to directly load slots for a specific nutritionist without waiting for render cycle
  const loadSlotsFor = useCallback(async (nutriId, targetDate, targetType) => {
    if (!nutriId || !targetDate) return;

    setFetchingSlots(true);
    try {
      const res = await getAvailableSlots(nutriId, targetDate, targetType);
      let data = Array.isArray(res.data)
        ? res.data
        : res.data?.results || [];

      const todayStr = getTodayStr();
      if (targetDate === todayStr) {
        const nowStr = new Date().toTimeString().slice(0, 5);
        data = data.filter((s) => s.start_time > nowStr);
      } else if (targetDate < todayStr) {
        data = [];
      }

      setSlots(data);
    } catch {
      setSlots([]);
      toast.error("Could not load slots for this selection.");
    } finally {
      setFetchingSlots(false);
    }
  }, []);

  // -------------------------------
  // IN-HOUSE: fetch assigned nutritionist & slots immediately
  // -------------------------------
  useEffect(() => {
    if (!user) return;

    if (appointmentCategory === "IN_HOUSE") {
      setExperts([]);
      setExpertId("");

      // If cached, display instantly and kick off slot fetch right away
      if (inHouseNutritionistCache) {
        const cachedId = inHouseNutritionistCache.nutritionist_id;
        setNutritionistId(cachedId);
        setNutritionistInfo(inHouseNutritionistCache);
        loadSlotsFor(cachedId, date, appointmentType);
        return;
      }

      setSlots([]);
      setNutritionistId(null);
      setNutritionistInfo(null);

      getMyInHouseNutritionist()
        .then((res) => {
          inHouseNutritionistCache = res.data;
          const nId = res.data.nutritionist_id;
          setNutritionistId(nId);
          setNutritionistInfo(res.data);
          // Directly load slots without waiting for react state tick
          if (nId && date) {
            loadSlotsFor(nId, date, appointmentType);
          }
        })
        .catch(() => {
          setNutritionistId(null);
          setNutritionistInfo(null);
        });
    }
  }, [appointmentCategory, user, date, appointmentType, loadSlotsFor]);

  // -------------------------------
  // EXPERT: fetch expert list with instant cache
  // -------------------------------
  useEffect(() => {
    if (appointmentCategory === "EXPERT") {
      setNutritionistId(null);
      setNutritionistInfo(null);
      setExpertId("");
      setSlots([]);

      if (expertNutritionistsCache) {
        setExperts(expertNutritionistsCache);
        return;
      }

      getExpertNutritionists()
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : [];
          expertNutritionistsCache = list;
          setExperts(list);
        })
        .catch(() => {
          setExperts([]);
        });
    }
  }, [appointmentCategory]);

  // Background prefetch experts for instant category switching
  useEffect(() => {
    if (!expertNutritionistsCache) {
      getExpertNutritionists()
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : [];
          expertNutritionistsCache = list;
        })
        .catch(() => {});
    }
  }, []);

  // Update nutritionist info when expert is selected
  const handleSelectExpert = (id) => {
    setExpertId(id);
    setNutritionistId(id);
    setSlots([]);
    const found = experts.find((e) => String(e.id) === String(id));
    setNutritionistInfo(found || null);
    if (id && date) {
      loadSlotsFor(id, date, appointmentType);
    }
  };

  const handleCategoryChange = (cat) => {
    setAppointmentCategory(cat);
    setSlots([]);
  };

  const handleTypeChange = (type) => {
    setAppointmentType(type);
    if (nutritionistId && date) {
      loadSlotsFor(nutritionistId, date, type);
    }
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
    if (nutritionistId && newDate) {
      loadSlotsFor(nutritionistId, newDate, appointmentType);
    }
  };

  // Re-fetch slots for current selection
  const fetchSlots = () => loadSlotsFor(nutritionistId, date, appointmentType);

  const toggleCaseCondition = (cond) => {
    setCaseConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
    );
  };

  const handleCaseSubmit = async (e) => {
    e?.preventDefault();
    if (!caseSummary.trim()) {
      toast.warn("Please briefly describe your primary health concern or goal.");
      return;
    }
    if (!caseSlot) return;

    setSubmittingCase(true);
    try {
      const resolvedAppointmentType = (caseSlot.slot_type && caseSlot.slot_type !== "BOTH")
        ? caseSlot.slot_type
        : appointmentType;

      await bookAppointment({
        slot_id: caseSlot.id,
        appointment_category: "EXPERT",
        appointment_type: resolvedAppointmentType,
        expert_id: expertId,
        patient_case_summary: caseSummary.trim(),
        patient_medical_conditions: caseConditions,
      });

      const expertName = nutritionistInfo?.name || "The Specialist";
      toast.success(`🎉 Case submitted! ${expertName} will review your details and set the consultation fee. You'll be notified when your quote is ready.`);
      setShowCaseModal(false);
      setCaseSummary("");
      setCaseConditions([]);
      setCaseSlot(null);
      await fetchSlots();
      onBooked?.();
    } catch (err) {
      const msg = extractErrorMessage(err, "Failed to submit case request. Please try again.");
      toast.error(msg);
    } finally {
      setSubmittingCase(false);
    }
  };

  const toggleBookingCondition = (cond) => {
    setBookingConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
    );
  };

  // -------------------------------
  // Book appointment handler (Opens Reason & Details confirmation modal for In-House & Fixed slots)
  // -------------------------------
  const handleBook = (slotId) => {
    const activeSlot = slots.find((s) => s.id === slotId);
    if (!activeSlot) return;

    // If this is a variable slot on an Expert, open the 2-step Case Intake Modal
    if (activeSlot.pricing_mode === "VARIABLE" && appointmentCategory === "EXPERT") {
      setCaseSlot(activeSlot);
      setShowCaseModal(true);
      return;
    }

    // For In-House consultation and Fixed slots, open the Instant Booking Confirmation Modal with Reason & Details
    setConfirmSlot(activeSlot);
    setBookingReason("");
    setBookingConditions([]);
    setShowConfirmModal(true);
  };

  // -------------------------------
  // Instant Confirmation with Consultation Reason & Health Details
  // -------------------------------
  const handleConfirmBooking = async (e) => {
    e?.preventDefault();
    if (!confirmSlot) return;

    try {
      setConfirmingBooking(true);
      setPendingSlotId(confirmSlot.id);

      const resolvedAppointmentType = (confirmSlot.slot_type && confirmSlot.slot_type !== "BOTH")
        ? confirmSlot.slot_type
        : appointmentType;

      await bookAppointment({
        slot_id: confirmSlot.id,
        appointment_category: appointmentCategory,
        appointment_type: resolvedAppointmentType,
        expert_id: appointmentCategory === "EXPERT" ? expertId : null,
        patient_case_summary: bookingReason.trim(),
        patient_medical_conditions: bookingConditions,
      });

      const nutriTitle = nutritionistInfo?.nutritionist_name || nutritionistInfo?.name || "your nutritionist";
      toast.success(`🎉 Appointment booked and confirmed with ${nutriTitle}!`);
      setShowConfirmModal(false);
      setConfirmSlot(null);
      setBookingReason("");
      setBookingConditions([]);
      await fetchSlots();
      onBooked?.();

    } catch (error) {
      const errData = error.response?.data;

      if (errData?.consultation_required) {
        setShowConfirmModal(false);
        const resolvedPrice = errData.price ?? (appointmentType === "IN_PERSON" ? confirmSlot?.offline_price : confirmSlot?.online_price) ?? 0;

        setConsultPaymentDetails({
          consultType: errData.consult_type || (appointmentCategory === "EXPERT" ? "expert" : "inhouse"),
          price: resolvedPrice,
          appointmentType: errData.appointment_type || appointmentType,
          slotId: confirmSlot.id,
          nutritionistName: nutritionistInfo?.nutritionist_name || nutritionistInfo?.name || "Assigned Nutritionist",
          message: errData.message,
          reason: bookingReason,
          conditions: bookingConditions,
        });
        setConsultType(errData.consult_type);
        setShowConsultPayment(true);
      } else {
        const friendlyError = extractErrorMessage(error, "Booking failed. Try again.");
        toast.error(friendlyError);
      }
    } finally {
      setConfirmingBooking(false);
      setPendingSlotId(null);
    }
  };

  const handleConsultPayment = async () => {
    try {
      setLoading(true);
      const orderData = await payConsultationFee({
        consultType: consultPaymentDetails?.consultType || consultType || "inhouse",
        slotId: consultPaymentDetails?.slotId || pendingSlotId,
        price: consultPaymentDetails?.price,
        appointmentType: consultPaymentDetails?.appointmentType || appointmentType,
      });

      if (!window.Razorpay) {
        toast.error("Payment gateway is loading. Please try again in a moment.");
        setLoading(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: orderData.key,
        amount: orderData.amount,
        order_id: orderData.order_id,
        name: "TrackIntake",
        description: `${appointmentType === "IN_PERSON" ? "In-Clinic" : "Virtual"} Consultation Fee (₹${(orderData.amount / 100).toFixed(0)})`,
        handler: async (response) => {
          try {
            setLoading(true);
            await verifyPayment(response);

            // Complete slot booking
            const bookingSlotId = pendingSlotId || consultPaymentDetails?.slotId;
            const activeSlot = slots.find((s) => s.id === bookingSlotId);
            const resolvedBookingType = (activeSlot?.slot_type && activeSlot.slot_type !== "BOTH")
              ? activeSlot.slot_type
              : (consultPaymentDetails?.appointmentType || appointmentType);

            await bookAppointment({
              slot_id: bookingSlotId,
              appointment_category: appointmentCategory,
              appointment_type: resolvedBookingType,
              expert_id: appointmentCategory === "EXPERT" ? expertId : null,
              patient_case_summary: consultPaymentDetails?.reason || "",
              patient_medical_conditions: consultPaymentDetails?.conditions || [],
            });

            toast.success("Payment successful! Appointment confirmed.");
            setShowConsultPayment(false);
            setPendingSlotId(null);
            setConsultPaymentDetails(null);
            await fetchSlots();
            onBooked?.();
          } catch (err) {
            console.error("Post-payment booking error:", err);
            const msg = extractErrorMessage(err, "Payment verified, but booking failed. Please refresh or contact support.");
            toast.error(msg);
          } finally {
            setLoading(false);
            setPendingSlotId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setPendingSlotId(null);
          }
        },
        theme: { color: "#2563eb" }
      });

      rzp.on("payment.failed", (res) => {
        toast.error(res.error?.description || "Payment failed. Please try again.");
        setLoading(false);
        setPendingSlotId(null);
      });

      rzp.open();

    } catch (err) {
      console.error("Consultation fee order creation failed:", err);
      const msg = extractErrorMessage(err, "Could not initialize consultation payment. Please try again.");
      toast.error(msg);
      setLoading(false);
      setPendingSlotId(null);
    }
  };

  // ===============================
  // Ad Component - Simple with content only
  // ===============================
  const AdvertisementCard = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="relative rounded-3xl overflow-hidden shadow-xl sticky top-24 bg-white border border-[var(--color-border-default)]"
    >
      {/* Close button for mobile */}
      <button 
        onClick={() => setShowAd(false)}
        className="lg:hidden absolute top-3 right-3 z-10 p-1.5 bg-gray-200 rounded-full text-gray-600 hover:bg-gray-300 transition-colors"
      >
        <X size={16} />
      </button>

      {/* Image */}
      <img 
        src={bpMonitorAd} 
        alt="BP Monitor" 
        className="w-full h-auto object-cover"
      />

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-1 mb-2">
          <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          <span className="text-xs font-semibold text-gray-500 uppercase">Sponsored Health Device</span>
        </div>

        <h3 className="text-lg font-bold text-gray-800 mb-1">
          Smart BP & Vitals Monitor
        </h3>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-gray-400 line-through text-sm">₹3,999</span>
          <span className="text-xl font-bold text-gray-900">₹2,799</span>
          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">30% OFF</span>
        </div>

        <div className="flex gap-2 mb-3">
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">±2 mmHg Accuracy</span>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">Bluetooth Sync</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-[var(--color-primary)] text-white px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md"
          onClick={() => window.open("https://example.com/bp-monitor", "_blank")}
        >
          <span>Explore Now</span>
          <ChevronRight size={18} />
        </motion.button>
      </div>
    </motion.div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Variable Case Submission Modal */}
      {showCaseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-[var(--font-secondary)]">
          <div className="bg-white text-black rounded-3xl p-6 max-w-lg w-full shadow-2xl border-2 border-neutral-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-orange-50 border border-orange-200 text-[#F26722] shrink-0">
                  <Sparkles size={20} className="text-[#F26722]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-black font-[var(--font-primary)]">
                    Case Details & Appointment Request
                  </h2>
                  <p className="text-xs text-neutral-600 font-medium">
                    Step 1 of 2: Submit case for practitioner fee quote
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCaseModal(false);
                  setCaseSlot(null);
                }}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-black transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-orange-50/70 border-2 border-orange-200 text-xs text-black mb-4 space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F26722] text-white flex items-center justify-center font-black text-sm shrink-0 overflow-hidden shadow-xs">
                    {nutritionistInfo?.profile_photo ? (
                      <img src={nutritionistInfo.profile_photo} alt={nutritionistInfo.name} className="w-full h-full object-cover" />
                    ) : (
                      (nutritionistInfo?.name || "S").charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-black text-sm">
                      Dr. {nutritionistInfo?.name || "Specialist Nutritionist"}
                    </h3>
                    <p className="text-xs text-[#F26722] font-semibold">
                      {nutritionistInfo?.professional_title || "Clinical Specialist"} {nutritionistInfo?.qualification ? `• ${nutritionistInfo.qualification}` : ""}
                    </p>
                  </div>
                </div>
                {nutritionistInfo && (
                  <button
                    type="button"
                    onClick={() => setProfileModalNutri(nutritionistInfo)}
                    className="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-bold border border-neutral-300 hover:border-[#F26722] hover:text-[#F26722] hover:bg-white transition-all cursor-pointer shrink-0 shadow-xs"
                  >
                    View Profile
                  </button>
                )}
              </div>
              <p className="text-xs leading-relaxed text-neutral-700 pt-2 border-t border-orange-200 font-medium">
                <strong className="text-black">Variable Case-Based Slot:</strong> Dr. {nutritionistInfo?.name || "Specialist"} reviews your medical background and health concerns first, then sets an exact tailored consultation fee. You will review and pay the quoted fee before the session is confirmed.
              </p>
            </div>

            <form onSubmit={handleCaseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  Selected Slot Timing
                </label>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black font-semibold">
                  <Calendar size={14} className="text-[#F26722]" />
                  <span>{date}</span>
                  <span className="text-neutral-300">|</span>
                  <Clock size={14} className="text-[#F26722]" />
                  <span>{caseSlot?.start_time} – {caseSlot?.end_time}</span>
                  <span className="text-neutral-300">|</span>
                  <span>{appointmentType === "IN_PERSON" ? "In-Clinic Visit" : "Virtual Zoom"}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  Primary Health Concern / Consultation Goal <span className="text-[#F26722] font-bold">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your current symptoms, dietary habits, or health goals..."
                  value={caseSummary}
                  onChange={(e) => setCaseSummary(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white border border-neutral-300 text-xs sm:text-sm text-black placeholder-neutral-400 outline-none focus:border-[#F26722] focus:ring-1 focus:ring-[#F26722] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  Diagnosed Medical Conditions <span className="text-xs text-neutral-500 font-normal">(Select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CLINICAL_CONDITION_OPTIONS.map((cond) => {
                    const isSel = caseConditions.includes(cond);
                    return (
                      <button
                        type="button"
                        key={cond}
                        onClick={() => toggleCaseCondition(cond)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          isSel
                            ? "bg-[#F26722] text-white border-[#F26722] shadow-xs"
                            : "bg-white text-black border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50"
                        }`}
                      >
                        {cond}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowCaseModal(false);
                    setCaseSlot(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCase}
                  className="px-5 py-2.5 rounded-xl bg-[#F26722] hover:bg-[#d95616] text-white text-xs font-black transition shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {submittingCase ? (
                    "Submitting..."
                  ) : (
                    <>
                      <span>Submit Case for Review</span>
                      <ChevronRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-House & Fixed Slot Instant Confirmation Modal with Reason & Details */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-[var(--font-secondary)]">
          <div className="bg-white text-black rounded-3xl p-6 max-w-lg w-full shadow-2xl border-2 border-neutral-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-orange-50 border border-orange-200 text-[#F26722] shrink-0">
                  <CalendarDays size={20} className="text-[#F26722]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-black font-[var(--font-primary)]">
                    {appointmentCategory === "IN_HOUSE" ? "Confirm In-House Consultation" : "Confirm Appointment Booking"}
                  </h2>
                  <p className="text-xs text-neutral-600 font-medium">
                    {appointmentCategory === "IN_HOUSE" ? "Instant confirmation with your dedicated wellness practitioner" : "Review details and confirm appointment"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmSlot(null);
                }}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-black transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Practitioner Summary Banner */}
            <div className="p-3.5 rounded-2xl border-2 border-orange-200 bg-orange-50/70 text-black text-xs mb-4 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shrink-0 overflow-hidden bg-[#F26722] shadow-xs">
                  {nutritionistInfo?.profile_photo ? (
                    <img src={nutritionistInfo.profile_photo} alt={nutritionistInfo.nutritionist_name || nutritionistInfo.name} className="w-full h-full object-cover" />
                  ) : (
                    (nutritionistInfo?.nutritionist_name || nutritionistInfo?.name || "N").charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-black text-sm">
                    {nutritionistInfo?.nutritionist_name || nutritionistInfo?.name || "Assigned Nutritionist"}
                  </h4>
                  <p className="text-xs text-neutral-600 font-semibold">
                    {nutritionistInfo?.professional_title || "Clinical Nutritionist"}
                  </p>
                </div>
              </div>

              {nutritionistInfo && (
                <button
                  type="button"
                  onClick={() => setProfileModalNutri(nutritionistInfo)}
                  className="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-bold border border-neutral-300 hover:border-[#F26722] hover:text-[#F26722] hover:bg-white transition-all cursor-pointer shrink-0 shadow-xs"
                >
                  View Profile
                </button>
              )}
            </div>

            <form onSubmit={handleConfirmBooking} className="space-y-4">
              {/* Scheduled Timing & Mode */}
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  Session Date & Time
                </label>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black font-semibold">
                  <Calendar size={14} className="text-[#F26722]" />
                  <span>{date}</span>
                  <span className="text-neutral-300">|</span>
                  <Clock size={14} className="text-[#F26722]" />
                  <span>{confirmSlot?.start_time} – {confirmSlot?.end_time}</span>
                  <span className="text-neutral-300">|</span>
                  <span>{appointmentType === "IN_PERSON" ? "In-Clinic Visit" : "Virtual Zoom"}</span>
                </div>
              </div>

              {/* Consultation Fee Status */}
              <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-200 flex items-center justify-between text-xs">
                <span className="text-neutral-700 font-bold">Consultation Rate:</span>
                <span className="font-black text-sm text-[#F26722] bg-white px-2.5 py-1 rounded-lg border border-orange-200 shadow-xs">
                  ₹{appointmentType === "IN_PERSON" 
                    ? (confirmSlot?.offline_price ?? confirmSlot?.price ?? nutritionistInfo?.offline_price ?? 0) 
                    : (confirmSlot?.online_price ?? confirmSlot?.price ?? nutritionistInfo?.online_price ?? 0)}
                </span>
              </div>

              {/* Reason for Consultation */}
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  Reason for Consultation / Health Notes <span className="text-xs text-neutral-500 font-normal">(Optional context for your coach)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Share your current questions, dietary concerns, or what you would like to discuss..."
                  value={bookingReason}
                  onChange={(e) => setBookingReason(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white border border-neutral-300 text-xs sm:text-sm text-black placeholder-neutral-400 outline-none focus:border-[#F26722] focus:ring-1 focus:ring-[#F26722] transition-colors"
                />
              </div>

              {/* Health Focus Area Chips */}
              <div>
                <label className="block text-xs font-bold text-black mb-1.5">
                  Primary Focus Areas <span className="text-xs text-neutral-500 font-normal">(Select all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CLINICAL_CONDITION_OPTIONS.map((cond) => {
                    const isSel = bookingConditions.includes(cond);
                    return (
                      <button
                        type="button"
                        key={cond}
                        onClick={() => toggleBookingCondition(cond)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          isSel
                            ? "bg-[#F26722] text-white border-[#F26722] shadow-xs"
                            : "bg-white text-black border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50"
                        }`}
                      >
                        {cond}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmSlot(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={confirmingBooking}
                  className="px-6 py-2.5 rounded-xl text-white text-xs font-black transition shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-1.5 bg-[#F26722] hover:bg-[#d95616] active:scale-95"
                >
                  {confirmingBooking ? (
                    "Confirming Booking..."
                  ) : (
                    <>
                      <span>Confirm Booking</span>
                      <CheckCircle2 size={15} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Practitioner Profile Modal */}
      {profileModalNutri && (
        <ExpertProfileModal
          nutritionist={profileModalNutri}
          onClose={() => setProfileModalNutri(null)}
          onSelect={appointmentCategory === "EXPERT" ? handleSelectExpert : null}
        />
      )}

      {/* Consultation Payment Popup */}
      {showConsultPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-bg-surface)] rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-[var(--color-border-default)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  <DollarSign size={20} />
                </div>
                <h2 className="text-lg font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
                  Consultation Fee Required
                </h2>
              </div>
              <button
                onClick={() => setShowConsultPayment(false)}
                className="p-1.5 rounded-full hover:bg-[var(--color-bg-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-[var(--color-text-muted)] text-xs mb-4">
              Your plan consultation quota has been utilized or this specialist requires an upfront booking fee.
            </p>

            {/* Price Breakdown Card */}
            <div className="p-4 rounded-2xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)] space-y-3 mb-5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-muted)]">Nutritionist</span>
                <span className="font-bold text-[var(--color-text-strong)]">
                  {consultPaymentDetails?.nutritionistName || "Nutritionist"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-text-muted)]">Session Type</span>
                <span className="font-bold text-[var(--color-text-strong)] inline-flex items-center gap-1">
                  {consultPaymentDetails?.appointmentType === "IN_PERSON" ? (
                    <>
                      <Building2 size={13} className="text-emerald-600" /> In-Clinic Visit
                    </>
                  ) : (
                    <>
                      <Video size={13} className="text-blue-600" /> Virtual Zoom Meeting
                    </>
                  )}
                </span>
              </div>

              <div className="pt-2 border-t border-[var(--color-border-default)] flex items-center justify-between">
                <span className="font-extrabold text-sm text-[var(--color-text-strong)]">Total Fee</span>
                <span className="font-black text-lg text-[var(--color-primary)]">
                  ₹{consultPaymentDetails?.price || 0}
                </span>
              </div>
            </div>

            <button
              onClick={handleConsultPayment}
              disabled={loading}
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white py-3.5 rounded-2xl font-black text-sm transition shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  <span>Pay ₹{consultPaymentDetails?.price || 0} & Confirm Booking</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>

            <button
              onClick={() => setShowConsultPayment(false)}
              className="w-full mt-2 text-[var(--color-text-muted)] text-xs font-semibold py-2 hover:text-[var(--color-text-strong)] cursor-pointer text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Responsive Unified Layout (Single BookingForm in DOM to avoid duplicate input IDs) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left / Main Column - Booking Form */}
        <div className="w-full lg:w-[70%] order-2 lg:order-1">
          <BookingForm 
            appointmentCategory={appointmentCategory}
            setAppointmentCategory={handleCategoryChange}
            appointmentType={appointmentType}
            setAppointmentType={handleTypeChange}
            experts={experts}
            expertId={expertId}
            handleSelectExpert={handleSelectExpert}
            date={date}
            setDate={handleDateChange}
            nutritionistId={nutritionistId}
            nutritionistInfo={nutritionistInfo}
            fetchSlots={fetchSlots}
            fetchingSlots={fetchingSlots}
            slots={slots}
            handleBook={handleBook}
            loading={loading}
            pendingSlotId={pendingSlotId}
            onViewProfile={(nutri) => setProfileModalNutri(nutri)}
          />
        </div>

        {/* Right / Top Column - Advertisement */}
        {showAd && (
          <div className="w-full lg:w-[30%] order-1 lg:order-2">
            <div className="sticky top-24">
              <AdvertisementCard />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ===============================
// Booking Form Component
// ===============================
const BookingForm = ({
  appointmentCategory,
  setAppointmentCategory,
  appointmentType,
  setAppointmentType,
  experts,
  expertId,
  handleSelectExpert,
  date,
  setDate,
  nutritionistId,
  nutritionistInfo,
  fetchSlots,
  fetchingSlots,
  slots,
  handleBook,
  loading,
  pendingSlotId,
  onViewProfile,
}) => {
  const isOnline = appointmentType === "VIRTUAL";
  const onlinePrice = nutritionistInfo?.online_price;
  const offlinePrice = nutritionistInfo?.offline_price;
  const offlineLocation = nutritionistInfo?.offline_location;
  const selectedExpert = experts.find((e) => String(e.id) === String(expertId));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[var(--color-bg-surface)] rounded-3xl border-2 border-[var(--color-border-default)] p-4 sm:p-7 shadow-lg space-y-5 sm:space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-orange-50 text-[#F26722] rounded-2xl border border-orange-200 shadow-xs">
          <CalendarDays className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-black font-[var(--font-primary)]">
            Book Appointment
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 font-medium">
            Schedule a 1-on-1 virtual Zoom or in-clinic consultation
          </p>
        </div>
      </div>

      {/* Appointment Category Tabs (In-House vs Expert) */}
      <div className="flex flex-col xs:flex-row gap-1.5 sm:gap-2 bg-neutral-100 p-1.5 rounded-2xl border border-neutral-200">
        <button
          type="button"
          onClick={() => setAppointmentCategory("IN_HOUSE")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            appointmentCategory === "IN_HOUSE" 
              ? "bg-[#F26722] text-white shadow-md" 
              : "text-neutral-600 hover:text-black"
          }`}
        >
          <Building2 size={16} />
          <span>In-House Nutritionist</span>
        </button>
        <button
          type="button"
          onClick={() => setAppointmentCategory("EXPERT")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            appointmentCategory === "EXPERT" 
              ? "bg-[#F26722] text-white shadow-md" 
              : "text-neutral-600 hover:text-black"
          }`}
        >
          <Users size={16} />
          <span>Specialist Expert</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={appointmentCategory}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {/* In-House Assigned Practitioner Card */}
          {appointmentCategory === "IN_HOUSE" && (
            <div className="p-4 rounded-2xl bg-white border-2 border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-[#F26722] text-white flex items-center justify-center font-black text-lg shadow-xs shrink-0 overflow-hidden">
                  {nutritionistInfo?.profile_photo ? (
                    <img src={nutritionistInfo.profile_photo} alt={nutritionistInfo.nutritionist_name || nutritionistInfo.name} className="w-full h-full object-cover" />
                  ) : (
                    (nutritionistInfo?.nutritionist_name || nutritionistInfo?.name || "V").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-sm font-black text-black truncate">
                      {nutritionistInfo?.nutritionist_name || nutritionistInfo?.name || "Assigned In-House Nutritionist"}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-[#F26722] border border-orange-200">
                      <Building2 size={10} className="text-[#F26722]" /> In-House Care Team
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 font-semibold truncate mt-0.5">
                    {nutritionistInfo?.professional_title || "Clinical Nutritionist"} {nutritionistInfo?.qualification ? `• ${nutritionistInfo.qualification}` : ""}
                  </p>
                  <p className="text-[11px] text-black font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-[#F26722]" /> Rate: <span className="font-black text-[#F26722]">₹{appointmentType === "IN_PERSON" ? (nutritionistInfo?.offline_price ?? 0) : (nutritionistInfo?.online_price ?? 0)}</span> • Dedicated platform care
                  </p>
                </div>
              </div>

              {nutritionistInfo && (
                <button
                  type="button"
                  onClick={() => onViewProfile?.(nutritionistInfo)}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-neutral-300 hover:border-[#F26722] text-black hover:text-[#F26722] text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
                >
                  <User size={13} />
                  <span>View Full Profile</span>
                </button>
              )}
            </div>
          )}

          {/* Expert Selector & Profile Preview Card */}
          {appointmentCategory === "EXPERT" && (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Select Specialist
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={17} />
                <select
                  value={expertId}
                  onChange={(e) => handleSelectExpert(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-bg-surface-alt)] border-2 border-[var(--color-border-default)] rounded-2xl focus:border-[var(--color-primary)] focus:outline-none transition-all text-xs sm:text-sm text-[var(--color-text-strong)] appearance-none cursor-pointer font-semibold"
                >
                  <option value="">-- Choose Expert Nutritionist --</option>
                  {experts.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.name} {exp.professional_title ? `(${exp.professional_title})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Expert Profile Preview Card */}
              {selectedExpert && (
                <div className="p-4 rounded-2xl bg-white border-2 border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#F26722] text-white flex items-center justify-center font-black text-lg shadow-xs shrink-0 overflow-hidden">
                      {selectedExpert.profile_photo ? (
                        <img src={selectedExpert.profile_photo} alt={selectedExpert.name} className="w-full h-full object-cover" />
                      ) : (
                        (selectedExpert.name || "E").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-black text-black truncate">
                          {selectedExpert.name}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-[#F26722] border border-orange-200">
                          <Sparkles size={10} className="text-[#F26722]" /> Specialist Expert
                        </span>
                        {selectedExpert.years_of_experience > 0 && (
                          <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
                            {selectedExpert.years_of_experience}+ yrs exp
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-600 font-semibold truncate mt-0.5">
                        {selectedExpert.professional_title || "Clinical Specialist"} {selectedExpert.qualification ? `• ${selectedExpert.qualification}` : ""}
                      </p>
                      {selectedExpert.specializations?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {selectedExpert.specializations.slice(0, 3).map((spec, i) => (
                            <span key={i} className="text-[10px] font-bold bg-orange-50 text-[#F26722] border border-orange-200 px-2 py-0.5 rounded-md">
                              {spec}
                            </span>
                          ))}
                          {selectedExpert.specializations.length > 3 && (
                            <span className="text-[10px] font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md">
                              +{selectedExpert.specializations.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onViewProfile?.(selectedExpert)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-neutral-300 hover:border-[#F26722] text-black hover:text-[#F26722] text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
                  >
                    <User size={13} />
                    <span>View Complete Profile & Credentials</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Consultation Mode Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Choose Consultation Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Virtual Option */}
              <button
                type="button"
                onClick={() => setAppointmentType("VIRTUAL")}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isOnline
                    ? "border-[#F26722] bg-orange-50/60 shadow-xs ring-1 ring-[#F26722]"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`p-2 rounded-xl ${isOnline ? "bg-[#F26722] text-white" : "bg-neutral-100 text-neutral-700"}`}>
                    <Video size={15} />
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${isOnline ? "text-[#F26722] bg-white border border-orange-200" : "text-neutral-600 bg-neutral-100"}`}>
                    Online Zoom
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-black">Virtual Video Consultation</h4>
                  <p className="text-[11px] text-neutral-600 font-semibold mt-0.5">
                    Rate: <span className="font-black text-[#F26722]">₹{onlinePrice ?? 0}</span>
                  </p>
                </div>
              </button>

              {/* In-Person Option */}
              <button
                type="button"
                onClick={() => setAppointmentType("IN_PERSON")}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  !isOnline
                    ? "border-[#F26722] bg-orange-50/60 shadow-xs ring-1 ring-[#F26722]"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`p-2 rounded-xl ${!isOnline ? "bg-[#F26722] text-white" : "bg-neutral-100 text-neutral-700"}`}>
                    <Building2 size={15} />
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${!isOnline ? "text-[#F26722] bg-white border border-orange-200" : "text-neutral-600 bg-neutral-100"}`}>
                    Clinic Visit
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-black">In-Clinic Consultation</h4>
                  <p className="text-[11px] text-neutral-600 font-semibold mt-0.5">
                    Rate: <span className="font-black text-[#F26722]">₹{offlinePrice ?? 0}</span>
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* In-Clinic Location Banner (if selected & available) */}
          {!isOnline && offlineLocation && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-orange-50/60 border border-orange-200 text-black text-xs">
              <MapPin size={16} className="text-[#F26722] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-black">Clinic Practice Location:</p>
                <p className="text-neutral-700">{offlineLocation}</p>
              </div>
            </div>
          )}

          {/* Date Selector with Quick Chips */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Select Appointment Date
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-2">
                {["Today", "Tomorrow"].map((d, i) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setDate(i === 0 ? getTodayStr() : getTomorrowStr())}
                    className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer text-center ${
                      date === (i === 0 ? getTodayStr() : getTomorrowStr())
                        ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs"
                        : "border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] text-[var(--color-text-strong)]"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 w-full min-w-0">
                <input
                  type="date"
                  min={getTodayStr()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[var(--color-bg-surface-alt)] border-2 border-[var(--color-border-default)] rounded-xl focus:border-[var(--color-primary)] focus:outline-none transition-all text-xs sm:text-sm text-[var(--color-text-strong)] font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Active Mode Notice */}
          <div className="flex items-center gap-2.5 p-3 rounded-2xl border border-orange-200 bg-orange-50/60 text-black text-xs">
            <div className="p-1.5 rounded-xl text-white bg-[#F26722]">
              {isOnline ? <Video size={14} /> : <Building2 size={14} />}
            </div>
            <div>
              <p className="font-bold text-black">
                {isOnline ? "Virtual Zoom Video Consultation" : "In-Person Clinic Appointment"}
              </p>
              <p className="text-[11px] text-neutral-600">
                {isOnline
                  ? "Conducted online. Instant Zoom link generated upon confirmation."
                  : "Visit the clinic at the scheduled time. Address details sent to your account."}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slots Section */}
      <div className="pt-4 border-t-2 border-[var(--color-border-default)]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm sm:text-base font-bold text-[var(--color-text-strong)] flex items-center gap-2 font-[var(--font-primary)]">
            <Clock className="text-[var(--color-primary)]" size={17} />
            Available Consultation Slots
          </h3>
          {fetchingSlots && (
            <span className="text-xs text-[var(--color-primary)] font-semibold animate-pulse">
              Finding slots...
            </span>
          )}
        </div>

        <SlotPicker
          slots={slots}
          onBook={handleBook}
          loading={loading}
          pendingSlotId={pendingSlotId}
          appointmentType={appointmentType}
          fetchingSlots={fetchingSlots}
        />
      </div>
    </motion.div>
  );
};

// ===============================
// Complete Practitioner Profile Modal
// ===============================
const ExpertProfileModal = ({ nutritionist, onClose, onSelect }) => {
  if (!nutritionist) return null;
  const isExpert = nutritionist.nutritionist_type === "expert" || !nutritionist.nutritionist_name;
  const name = nutritionist.name || nutritionist.nutritionist_name || "Nutritionist";
  const title = nutritionist.professional_title || "Clinical Nutritionist & Dietitian";
  const qual = nutritionist.qualification || "";
  const exp = nutritionist.years_of_experience || 0;
  const org = nutritionist.current_organization || "";
  const bio = nutritionist.professional_bio || "";
  const specs = nutritionist.specializations || [];
  const langs = nutritionist.languages_spoken || [];
  const loc = nutritionist.offline_location || "";
  const photo = nutritionist.profile_photo;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-[var(--font-secondary)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white text-black rounded-3xl max-w-xl w-full shadow-2xl border-2 border-neutral-200 overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header Ribbon */}
        <div className="p-5 text-white relative bg-gradient-to-r from-orange-500 via-[#F26722] to-amber-600">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center text-xl font-black border border-white/30 overflow-hidden shrink-0">
              {photo ? (
                <img src={photo} alt={name} className="w-full h-full object-cover" />
              ) : (
                name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/25">
                  {isExpert ? "Specialist Expert" : "In-House Nutritionist"}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-white bg-black/20 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={11} className="text-white" /> Verified Practitioner
                </span>
              </div>
              <h3 className="text-lg font-black font-[var(--font-primary)] text-white">{name}</h3>
              <p className="text-xs text-white/90 font-medium">{title} {qual ? `• ${qual}` : ""}</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs bg-white text-black">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
              <span className="text-[10px] font-bold text-neutral-500 block uppercase">Experience</span>
              <span className="font-extrabold text-black text-sm">{exp > 0 ? `${exp}+ Years` : "Clinical Practice"}</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200">
              <span className="text-[10px] font-bold text-neutral-500 block uppercase">Hospital / Clinic</span>
              <span className="font-extrabold text-black text-xs truncate block">{org || "TrackIntake Clinical Network"}</span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-neutral-500 block uppercase">Consultation Modes</span>
              <span className="font-extrabold text-black text-xs">Virtual & Clinic</span>
            </div>
          </div>

          {/* Bio */}
          {bio && (
            <div>
              <h4 className="font-bold text-black mb-1 uppercase tracking-wider text-[11px]">About Practitioner</h4>
              <p className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-black leading-relaxed italic">
                "{bio}"
              </p>
            </div>
          )}

          {/* Specializations */}
          {specs.length > 0 && (
            <div>
              <h4 className="font-bold text-black mb-1.5 uppercase tracking-wider text-[11px]">Clinical Specializations</h4>
              <div className="flex flex-wrap gap-1.5">
                {specs.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-orange-50 text-[#F26722] border border-orange-200 text-xs font-semibold">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {langs.length > 0 && (
            <div>
              <h4 className="font-bold text-black mb-1 uppercase tracking-wider text-[11px]">Languages Spoken</h4>
              <div className="flex flex-wrap gap-1.5">
                {langs.map((l, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-md bg-neutral-100 text-black border border-neutral-200 text-xs font-medium">
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Clinic Address */}
          {loc && (
            <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200 text-black text-xs">
              <span className="font-bold block mb-0.5 flex items-center gap-1 text-black">
                <MapPin size={12} className="text-[#F26722]" /> Clinic Address:
              </span>
              <span>{loc}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 flex items-center justify-end gap-2 bg-neutral-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:text-black hover:bg-neutral-100 transition cursor-pointer"
          >
            Close
          </button>
          {onSelect && (
            <button
              onClick={() => {
                onSelect(nutritionist.id);
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-[#F26722] hover:bg-[#d95616] text-white text-xs font-black shadow-md cursor-pointer transition active:scale-95"
            >
              Select & View Slots
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BookAppointment;
