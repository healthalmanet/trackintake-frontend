import React, { useEffect, useState } from "react";
import { getAvailableSlots, bookAppointment, getMyInHouseNutritionist, getExpertNutritionists } from "../../../api/appointmentApi";
import SlotPicker from "./SlotPicker";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, User, ChevronRight, CalendarDays, Video, Users, Building2, Heart, X, MapPin, Sparkles, CheckCircle2, DollarSign } from "lucide-react";
import { payConsultationFee, verifyPayment } from "../../../api/subscriptionService";
import { toast } from "react-toastify";
// Import advertisement image
import bpMonitorAd from "../../../assets/download.jpg";

const getTodayStr = () => new Date().toISOString().split("T")[0];
const getTomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

const BookAppointment = ({ onBooked }) => {
  const { user } = useAuth();

  const [appointmentCategory, setAppointmentCategory] = useState("IN_HOUSE"); // IN_HOUSE | EXPERT
  const [appointmentType, setAppointmentType] = useState("VIRTUAL"); // VIRTUAL | IN_PERSON

  const [experts, setExperts] = useState([]);
  const [expertId, setExpertId] = useState("");

  const [nutritionistId, setNutritionistId] = useState(null);
  const [nutritionistInfo, setNutritionistInfo] = useState(null);

  const [date, setDate] = useState(getTodayStr());
  const [slots, setSlots] = useState([]);

  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [showAd, setShowAd] = useState(true);
  const [showConsultPayment, setShowConsultPayment] = useState(false);
  const [consultType, setConsultType] = useState(null);
  const [pendingSlotId, setPendingSlotId] = useState(null);

  // -------------------------------
  // IN-HOUSE: fetch assigned nutritionist
  // -------------------------------
  useEffect(() => {
    if (!user) return;

    if (appointmentCategory === "IN_HOUSE") {
      setExperts([]);
      setExpertId("");
      setSlots([]);
      setNutritionistId(null);
      setNutritionistInfo(null);

      getMyInHouseNutritionist()
        .then((res) => {
          setNutritionistId(res.data.nutritionist_id);
          setNutritionistInfo(res.data);
        })
        .catch(() => {
          setNutritionistId(null);
          setNutritionistInfo(null);
        });
    }
  }, [appointmentCategory, user]);

  // -------------------------------
  // EXPERT: fetch expert list
  // -------------------------------
  useEffect(() => {
    if (appointmentCategory === "EXPERT") {
      setNutritionistId(null);
      setNutritionistInfo(null);
      setExpertId("");
      setSlots([]);

      getExpertNutritionists()
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : [];
          setExperts(list);
        })
        .catch(() => {
          setExperts([]);
        });
    }
  }, [appointmentCategory]);

  // Update nutritionist info when expert is selected
  const handleSelectExpert = (id) => {
    setExpertId(id);
    setNutritionistId(id);
    setSlots([]);
    const found = experts.find((e) => String(e.id) === String(id));
    setNutritionistInfo(found || null);
  };

  // -------------------------------
  // Fetch slots
  // -------------------------------
  const fetchSlots = async () => {
    if (!nutritionistId || !date) return;

    setFetchingSlots(true);
    try {
      const res = await getAvailableSlots(nutritionistId, date, appointmentType);
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.results || [];

      setSlots(data);
    } catch {
      setSlots([]);
      toast.error("Could not load slots for this selection.");
    } finally {
      setFetchingSlots(false);
    }
  };

  // Auto fetch when nutritionist, date, or appointment type changes
  useEffect(() => {
    if (nutritionistId && date) {
      fetchSlots();
    }
  }, [nutritionistId, date, appointmentType]);

  const [consultPaymentDetails, setConsultPaymentDetails] = useState(null);

  // -------------------------------
  // Book appointment
  // -------------------------------
  const handleBook = async (slotId) => {
    try {
      setLoading(true);
      setPendingSlotId(slotId);

      await bookAppointment({
        slot_id: slotId,
        appointment_category: appointmentCategory,
        appointment_type: appointmentType,
        expert_id: appointmentCategory === "EXPERT" ? expertId : null,
      });

      toast.success("Appointment booked successfully!");
      await fetchSlots();
      onBooked?.();

    } catch (error) {
      const errData = error.response?.data;

      if (errData?.consultation_required) {
        const activeSlot = slots.find((s) => s.id === slotId);
        const resolvedPrice = errData.price ?? (appointmentType === "IN_PERSON" ? activeSlot?.offline_price : activeSlot?.online_price) ?? 0;

        setConsultPaymentDetails({
          consultType: errData.consult_type || (appointmentCategory === "EXPERT" ? "expert" : "inhouse"),
          price: resolvedPrice,
          appointmentType: errData.appointment_type || appointmentType,
          slotId: slotId,
          nutritionistName: nutritionistInfo?.nutritionist_name || nutritionistInfo?.name || "Assigned Nutritionist",
          message: errData.message,
        });
        setConsultType(errData.consult_type);
        setShowConsultPayment(true);
      } else {
        toast.error(
          errData?.message || errData?.detail || "Booking failed. Try again."
        );
      }
    } finally {
      setLoading(false);
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
            await bookAppointment({
              slot_id: pendingSlotId || consultPaymentDetails?.slotId,
              appointment_category: appointmentCategory,
              appointment_type: appointmentType,
              expert_id: appointmentCategory === "EXPERT" ? expertId : null,
            });

            toast.success("Payment successful! Appointment confirmed.");
            setShowConsultPayment(false);
            setPendingSlotId(null);
            setConsultPaymentDetails(null);
            await fetchSlots();
            onBooked?.();
          } catch (err) {
            console.error("Post-payment booking error:", err);
            const msg = err.response?.data?.message || err.response?.data?.detail || "Payment verified, but booking failed. Please refresh or contact support.";
            toast.error(msg);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        },
        theme: { color: "#2563eb" }
      });

      rzp.on("payment.failed", (res) => {
        toast.error(res.error?.description || "Payment failed. Please try again.");
        setLoading(false);
      });

      rzp.open();

    } catch (err) {
      console.error("Consultation fee order creation failed:", err);
      toast.error(msg);
      setLoading(false);
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
      {/* Consultation Payment Popup */}
      {showConsultPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-bg-surface)] rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-[var(--color-border-default)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
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

      {/* Mobile View - Stacked Layout */}
      <div className="block lg:hidden">
        {showAd && (
          <div className="mb-6">
            <AdvertisementCard />
          </div>
        )}
        
        <BookingForm 
          {...{
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
          }}
        />
      </div>

      {/* Desktop View - Side by Side */}
      <div className="hidden lg:block">
        <div className="flex gap-6">
          {/* Left Column - Booking Form */}
          <div className="w-[70%]">
            <BookingForm 
              {...{
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
              }}
            />
          </div>

          {/* Right Column - Advertisement */}
          <div className="w-[30%]">
            <div className="sticky top-24">
              <AdvertisementCard />
            </div>
          </div>
        </div>
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
}) => {
  const isOnline = appointmentType === "VIRTUAL";
  const onlinePrice = nutritionistInfo?.online_price;
  const offlinePrice = nutritionistInfo?.offline_price;
  const offlineLocation = nutritionistInfo?.offline_location;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[var(--color-bg-surface)] rounded-3xl border-2 border-[var(--color-border-default)] p-5 sm:p-7 shadow-lg space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] rounded-2xl border border-[var(--color-border-hover)] shadow-xs">
          <CalendarDays className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
            Book Appointment
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">
            Schedule a 1-on-1 virtual Zoom or in-clinic consultation
          </p>
        </div>
      </div>

      {/* Appointment Category Tabs (In-House vs Expert) */}
      <div className="flex gap-2 bg-[var(--color-bg-surface-alt)] p-1 rounded-2xl border border-[var(--color-border-default)]">
        <button
          type="button"
          onClick={() => setAppointmentCategory("IN_HOUSE")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            appointmentCategory === "IN_HOUSE" 
              ? "bg-[var(--color-primary)] text-white shadow-md" 
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
          }`}
        >
          <Building2 size={16} />
          <span>In-House Nutritionist</span>
        </button>
        <button
          type="button"
          onClick={() => setAppointmentCategory("EXPERT")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            appointmentCategory === "EXPERT" 
              ? "bg-[var(--color-primary)] text-white shadow-md" 
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
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
          {/* Expert Selector */}
          {appointmentCategory === "EXPERT" && (
            <div className="space-y-1.5">
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
            </div>
          )}

          {/* Consultation Mode Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Choose Consultation Mode
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Virtual Option */}
              <button
                type="button"
                onClick={() => setAppointmentType("VIRTUAL")}
                className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isOnline
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-bg-subtle)] shadow-xs ring-2 ring-[var(--color-primary)]/20"
                    : "border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] hover:border-[var(--color-border-hover)]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`p-1.5 rounded-xl ${isOnline ? "bg-[var(--color-primary)] text-white" : "bg-blue-100 text-blue-700"}`}>
                    <Video size={15} />
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                    Online Zoom
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[var(--color-text-strong)]">Virtual Video Consultation</h4>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    {onlinePrice !== undefined && Number(onlinePrice) > 0 ? `Rate: ₹${onlinePrice}` : "Included in plan / Quota"}
                  </p>
                </div>
              </button>

              {/* In-Person Option */}
              <button
                type="button"
                onClick={() => setAppointmentType("IN_PERSON")}
                className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                  !isOnline
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-bg-subtle)] shadow-xs ring-2 ring-[var(--color-primary)]/20"
                    : "border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] hover:border-[var(--color-border-hover)]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`p-1.5 rounded-xl ${!isOnline ? "bg-[var(--color-primary)] text-white" : "bg-emerald-100 text-emerald-700"}`}>
                    <Building2 size={15} />
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Clinic Visit
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[var(--color-text-strong)]">In-Clinic Consultation</h4>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    {offlinePrice !== undefined && Number(offlinePrice) > 0 ? `Rate: ₹${offlinePrice}` : "Included in plan / Quota"}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* In-Clinic Location Banner (if selected & available) */}
          {!isOnline && offlineLocation && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
              <MapPin size={16} className="text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Clinic Practice Location:</p>
                <p className="text-emerald-800">{offlineLocation}</p>
              </div>
            </div>
          )}

          {/* Date Selector with Quick Chips */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Select Appointment Date
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {["Today", "Tomorrow"].map((d, i) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDate(i === 0 ? getTodayStr() : getTomorrowStr())}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                    date === (i === 0 ? getTodayStr() : getTomorrowStr())
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs"
                      : "border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] text-[var(--color-text-strong)]"
                  }`}
                >
                  {d}
                </button>
              ))}

              <div className="relative flex-1 min-w-[160px]">
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
          <div className={`flex items-center gap-2.5 p-3 rounded-2xl border text-xs ${
            isOnline
              ? "bg-blue-50/90 border-blue-200 text-blue-900"
              : "bg-emerald-50/90 border-emerald-200 text-emerald-900"
          }`}>
            <div className={`p-1.5 rounded-xl text-white ${isOnline ? "bg-blue-600" : "bg-emerald-600"}`}>
              {isOnline ? <Video size={14} /> : <Building2 size={14} />}
            </div>
            <div>
              <p className="font-bold">
                {isOnline ? "Virtual Zoom Video Consultation" : "In-Person Clinic Appointment"}
              </p>
              <p className="text-[11px] opacity-90">
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
          appointmentType={appointmentType}
        />
      </div>
    </motion.div>
  );
};

export default BookAppointment;
