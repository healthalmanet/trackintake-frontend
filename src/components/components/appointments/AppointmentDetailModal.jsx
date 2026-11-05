import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Calendar, Clock, Video, Building2, User, Mail, Phone,
  FileText, CheckCircle2, AlertCircle, XCircle, ExternalLink,
  Copy, Check, Edit3, Save, Sparkles, Heart, Activity,
  MapPin, ChevronRight, ShieldCheck, MessageSquare, Award, Star
} from "lucide-react";
import { toast } from "react-toastify";
import {
  getAppointmentDetails,
  updateAppointmentNotes,
  markAppointmentPaidAtClinic,
  setAppointmentPrice,
  declineAppointmentCase,
  confirmQuotedPayment,
} from "../../../api/appointmentApi";
import { payConsultationFee, verifyPayment } from "../../../api/subscriptionService";
import { useAuth } from "../../context/AuthContext";
import RescheduleModal from "./RescheduleModal";
import CancelModal from "./CancelModal";

const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const fmtDateTime = (v) => {
  if (!v) return "";
  return new Date(v).toLocaleString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const AppointmentDetailModal = ({
  appointmentId,
  isOpen,
  onClose,
  userRole = "patient", // "patient" | "nutritionist"
  onNotesSaved,
}) => {
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  // Editable fields for nutritionist
  const [notes, setNotes] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Reschedule & Cancel sub-modals
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  // Variable Case Review & Quoting State
  const [quotePrice, setQuotePrice] = useState("");
  const [quoteNote, setQuoteNote] = useState("");
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [decliningCase, setDecliningCase] = useState(false);
  const [payingQuoted, setPayingQuoted] = useState(false);

  useEffect(() => {
    if (!isOpen || !appointmentId) {
      setAppointment(null);
      setLoading(true);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await getAppointmentDetails(appointmentId);
        setAppointment(res.data);
        setNotes(res.data.notes || "");
        setInstructions(res.data.instructions || "");
      } catch (err) {
        console.error("Failed to load appointment details:", err);
        toast.error("Could not load appointment details.");
        onClose?.();
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [appointmentId, isOpen]);

  if (!isOpen) return null;

  const { user: authUser } = useAuth();
  const isNutritionist = userRole === "nutritionist" || authUser?.role === "nutritionist";
  const isVirtual = appointment?.appointment_type === "VIRTUAL";
  const isConfirmed = appointment?.status === "CONFIRMED";
  const isCancelled = appointment?.status === "CANCELLED";
  const p = appointment?.patient_details || {};
  const n = appointment?.nutritionist_details || {};
  const slot = appointment?.slot || {};
  const price = appointment?.price || (isVirtual ? n.online_price : n.offline_price) || slot.price || 0;
  const isPayAtClinic = appointment?.appointment_type === "IN_PERSON" && appointment?.offline_payment_required === false;

  const handleCopyLink = () => {
    if (appointment?.meeting_link) {
      navigator.clipboard.writeText(appointment.meeting_link);
      setCopiedLink(true);
      toast.success("Zoom meeting link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSaveNotes = async () => {
    if (!appointmentId) return;
    setSavingNotes(true);
    try {
      const res = await updateAppointmentNotes(appointmentId, {
        notes: notes.trim(),
        instructions: instructions.trim(),
      });
      setAppointment(res.data);
      setIsEditingNotes(false);
      toast.success("Appointment notes & instructions saved successfully!");
      onNotesSaved?.(res.data);
    } catch (err) {
      console.error("Failed to save notes:", err);
      toast.error(err.response?.data?.detail || "Could not save notes. Please try again.");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!appointmentId) return;
    setMarkingPaid(true);
    try {
      const res = await markAppointmentPaidAtClinic(appointmentId);
      setAppointment(res.data?.appointment || { ...appointment, payment_status: "PAID" });
      toast.success(res.data?.detail || "Payment marked as collected at clinic!");
      onNotesSaved?.(res.data?.appointment);
    } catch (err) {
      console.error("Failed to mark appointment as paid:", err);
      toast.error(err.response?.data?.detail || "Could not update payment status.");
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleSetPrice = async (e) => {
    e?.preventDefault();
    if (!quotePrice || isNaN(parseFloat(quotePrice)) || parseFloat(quotePrice) < 0) {
      toast.error("Please enter a valid consultation fee (₹0 or more).");
      return;
    }
    setSubmittingQuote(true);
    try {
      const res = await setAppointmentPrice(appointmentId, {
        price: parseFloat(quotePrice),
        quote_note: quoteNote.trim(),
      });
      toast.success(`Fee quote of ₹${quotePrice} sent to patient!`);
      setAppointment(res.data?.appointment || res.data);
      onNotesSaved?.(res.data?.appointment || res.data);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to set price quote.");
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handleDeclineCase = async () => {
    if (!window.confirm("Are you sure you want to decline this case request?")) return;
    setDecliningCase(true);
    try {
      const res = await declineAppointmentCase(appointmentId, { reason: "Declined by practitioner" });
      toast.info("Case request declined.");
      setAppointment(res.data?.appointment || res.data);
      onNotesSaved?.(res.data?.appointment || res.data);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to decline case.");
    } finally {
      setDecliningCase(false);
    }
  };

  const handlePayAtClinic = async () => {
    setPayingQuoted(true);
    try {
      const res = await confirmQuotedPayment(appointment.id, { pay_at_clinic: true });
      toast.success("Appointment confirmed! You can pay at the clinic upon arrival.");
      setAppointment(res.data?.appointment || res.data);
      onNotesSaved?.(res.data?.appointment || res.data);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to confirm appointment.");
    } finally {
      setPayingQuoted(false);
    }
  };

  const handlePayQuotedFee = async () => {
    try {
      setPayingQuoted(true);
      const orderData = await payConsultationFee({
        appointment_id: appointment.id,
        price: appointment.fee_amount,
        consultType: "expert",
        appointmentType: appointment.appointment_type,
      });

      if (!window.Razorpay) {
        toast.error("Payment gateway is loading. Please try again in a moment.");
        setPayingQuoted(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: orderData.key,
        amount: orderData.amount,
        order_id: orderData.order_id,
        name: "TrackIntake",
        description: `Expert Consultation Fee (₹${appointment.fee_amount})`,
        handler: async (response) => {
          try {
            await verifyPayment(response);
            const res = await confirmQuotedPayment(appointment.id);
            toast.success("Payment verified! Appointment confirmed.");
            setAppointment(res.data?.appointment || res.data);
            onNotesSaved?.(res.data?.appointment || res.data);
          } catch (verErr) {
            toast.error("Payment verification failed. Please contact support.");
          } finally {
            setPayingQuoted(false);
          }
        },
        modal: {
          ondismiss: () => setPayingQuoted(false),
        },
        theme: { color: "#2563eb" },
      });

      rzp.on("payment.failed", (err) => {
        toast.error(err?.error?.description || "Payment failed.");
        setPayingQuoted(false);
      });

      rzp.open();
    } catch (err) {
      toast.error("Could not initiate payment. Please try again.");
      setPayingQuoted(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs font-[var(--font-secondary)]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-2 border-neutral-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header Ribbon */}
        <div className="p-5 sm:p-6 bg-white border-b-2 border-neutral-200 relative overflow-hidden flex-shrink-0">
          <div className="h-1.5 absolute top-0 left-0 right-0 bg-[#F26722]" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-300 transition-colors cursor-pointer z-10"
          >
            <X size={18} />
          </button>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-50 text-[#F26722] border border-orange-200 text-[11px] font-black tracking-wider uppercase">
                  {isVirtual ? <Video size={12} /> : <Building2 size={12} />}
                  {isVirtual ? "Virtual Consultation" : "In-Clinic Consultation"}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                    isConfirmed ? "bg-emerald-50 text-emerald-950 border-emerald-300" : "bg-orange-50 text-[#F26722] border-orange-200"
                  }`}
                >
                  {isConfirmed ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {appointment?.status || "CONFIRMED"}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-black font-[var(--font-primary)]">
                Appointment Details
              </h2>
              <p className="text-neutral-700 text-xs sm:text-sm font-bold">
                Session ID: #{appointmentId} • Booked {appointment?.created_at ? fmtDateTime(appointment.created_at) : "recently"}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#F26722] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-neutral-600 font-bold">
                Loading appointment summary...
              </p>
            </div>
          ) : !appointment ? (
            <div className="py-16 text-center space-y-3">
              <p className="text-xs text-neutral-600 font-bold">
                Could not load appointment details.
              </p>
            </div>
          ) : (
            <>
              {/* Cancellation & Refund Alert Banner (if cancelled) */}
              {isCancelled && (
                <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-950 space-y-1">
                  <div className="flex items-center gap-2 font-black text-xs">
                    <XCircle size={15} className="text-rose-600 shrink-0" />
                    <span>Appointment Cancelled {appointment?.cancelled_by ? `by ${appointment?.cancelled_by}` : ""}</span>
                  </div>
                  {appointment?.cancellation_reason && (
                    <p className="text-xs text-rose-900 font-semibold">
                      Reason: "{appointment?.cancellation_reason}"
                    </p>
                  )}
                  {appointment?.payment_status === "PENDING_REFUND" && (
                    <p className="text-xs font-black text-orange-950 pt-1">
                      ⚠️ Refund Status: ₹{appointment?.refund_amount} (Pending Admin Review)
                    </p>
                  )}
                  {appointment?.payment_status === "REFUNDED" && (
                    <p className="text-xs font-black text-emerald-950 pt-1">
                      ✓ Refund Status: ₹{appointment?.refund_amount} Refunded
                    </p>
                  )}
                  {appointment?.payment_status === "NO_REFUND" && (
                    <p className="text-xs text-neutral-800 font-bold pt-1">
                      Refund Policy: No refund applicable for this cancellation.
                    </p>
                  )}
                </div>
              )}

              {/* Reschedule tracking alert */}
              {appointment?.reschedule_count > 0 && (
                <div className="p-3.5 rounded-2xl bg-orange-50 border-2 border-orange-200 text-black flex items-center justify-between text-xs">
                  <span className="font-bold">Reschedule History:</span>
                  <span className="font-black text-[#F26722] bg-white border border-orange-200 px-2.5 py-0.5 rounded-full text-[11px]">
                    {appointment?.reschedule_count} / 2 used
                  </span>
                </div>
              )}

              {/* 📋 Consultation Reason & Patient Concern */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-neutral-200 text-xs space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black text-black flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <FileText size={15} className="text-[#F26722]" /> Consultation Reason & Patient Concern
                  </span>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-orange-50 text-[#F26722] border border-orange-200">
                    {appointment?.appointment_category === "EXPERT" ? "Specialist Consultation" : "In-House Consultation"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                  <p className="text-black leading-relaxed font-bold text-xs sm:text-sm">
                    {appointment?.patient_case_summary ? (
                      <span className="italic">"{appointment.patient_case_summary}"</span>
                    ) : (
                      <span className="text-neutral-800 font-medium">General wellness consultation, dietary evaluation, and personalized nutrition guidance.</span>
                    )}
                  </p>
                </div>

                {Array.isArray(appointment?.patient_medical_conditions) && appointment.patient_medical_conditions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-black text-black">Reported Focus Areas:</span>
                    {appointment.patient_medical_conditions.map((c, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-md bg-white border-2 border-neutral-200 text-[10px] font-black text-black shadow-2xs"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 🩺 Complete Patient Health Dossier & Clinical Intake (Visible to Nutritionist for All Consultations) */}
              {isNutritionist && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-neutral-200 text-xs space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
                    <span className="font-black text-black uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Activity size={15} className="text-[#F26722]" /> Patient Health Dossier & Vitals
                    </span>
                    <span className="text-[10px] font-black text-[#F26722] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                      Clinical Intake Record
                    </span>
                  </div>

                  {/* Vitals & Demographics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                      <span className="text-[10px] text-neutral-600 block font-black uppercase tracking-wider mb-0.5">Demographics</span>
                      <span className="font-black text-black text-xs capitalize">
                        {p.gender || "—"}{p.age ? `, ${p.age} yrs` : ""}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                      <span className="text-[10px] text-neutral-600 block font-black uppercase tracking-wider mb-0.5">Height / Weight</span>
                      <span className="font-black text-black text-xs">
                        {p.height_cm ? `${p.height_cm} cm` : "—"} / {p.weight_kg ? `${p.weight_kg} kg` : "—"}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                      <span className="text-[10px] text-neutral-600 block font-black uppercase tracking-wider mb-0.5">Calculated BMI</span>
                      <span className="font-black text-xs text-[#F26722]">
                        {p.bmi ? `${p.bmi}` : "—"} {p.bmi_status ? `(${p.bmi_status})` : ""}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200">
                      <span className="text-[10px] text-neutral-600 block font-black uppercase tracking-wider mb-0.5">Diet & Activity</span>
                      <span className="font-black text-black text-xs truncate block">
                        {p.diet_type || "Standard"} • {p.activity_level || "Sedentary"}
                      </span>
                    </div>
                  </div>

                  {/* Primary Goal */}
                  {p.goal && (
                    <div className="flex items-center gap-2 pt-0.5 text-xs">
                      <span className="font-bold text-black">Primary Health Goal:</span>
                      <span className="font-black text-black bg-orange-50 px-2.5 py-0.5 rounded-lg border border-orange-200">
                        🎯 {p.goal}
                      </span>
                    </div>
                  )}

                  {/* Known Allergies */}
                  {p.allergies && (
                    <div className="flex items-center gap-2 pt-0.5 text-xs">
                      <span className="font-bold text-rose-700">Known Allergies:</span>
                      <span className="text-rose-900 font-bold bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
                        ⚠️ {p.allergies}
                      </span>
                    </div>
                  )}

                  {/* Diagnosed Clinical Conditions */}
                  {Array.isArray(p.diagnosed_conditions) && p.diagnosed_conditions.length > 0 && (
                    <div className="pt-2 border-t border-neutral-200">
                      <span className="text-[10px] font-black text-neutral-600 block mb-1 uppercase tracking-wider">
                        Diagnosed Clinical Medical Conditions:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {p.diagnosed_conditions.map((cond, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-900 border border-rose-200 text-[10px] font-black"
                          >
                            {cond}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 📋 Variable Case-Based Quoting & Review Section */}
              {appointment?.pricing_mode === "VARIABLE" && (
                <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#F26722] space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                      <Sparkles size={14} className="text-[#F26722]" /> Case-Based Fee Assessment
                    </span>
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-orange-50 text-[#F26722] border border-orange-200">
                      {appointment?.status === "PENDING_REVIEW"
                        ? "Pending Practitioner Review"
                        : appointment?.status === "AWAITING_PAYMENT"
                        ? "Fee Quoted • Awaiting Payment"
                        : appointment?.status === "DECLINED"
                        ? "Case Declined"
                        : "Confirmed"}
                    </span>
                  </div>

                  {/* Doctor View: Step 2 - Setting the Price */}
                  {isNutritionist && appointment?.status === "PENDING_REVIEW" && (
                    <form onSubmit={handleSetPrice} className="pt-2 border-t border-neutral-200 space-y-3">
                      <p className="text-xs font-black text-black">
                        Review the patient clinical dossier above and set the consultation fee:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-black text-black mb-1">
                            Set Consultation Fee (₹) *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              required
                              placeholder="e.g. 1200"
                              value={quotePrice}
                              onChange={(e) => setQuotePrice(e.target.value)}
                              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white border-2 border-neutral-300 outline-none focus:border-[#F26722] font-black text-black"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-500">₹</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-black mb-1">
                            Practitioner Note to Patient (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Includes personalized renal chart"
                            value={quoteNote}
                            onChange={(e) => setQuoteNote(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-white border-2 border-neutral-300 outline-none focus:border-[#F26722] text-black font-bold"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          disabled={decliningCase}
                          onClick={handleDeclineCase}
                          className="px-3 py-2 rounded-xl text-xs font-black text-rose-700 hover:bg-rose-50 border-2 border-rose-300 transition-colors cursor-pointer"
                        >
                          {decliningCase ? "Declining..." : "Decline Case"}
                        </button>
                        <button
                          type="submit"
                          disabled={submittingQuote}
                          className="px-4 py-2 rounded-xl bg-[#F26722] hover:bg-[#d95616] text-white text-xs font-black transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <Sparkles size={13} />
                          <span>{submittingQuote ? "Sending Quote..." : "Send Fee Quote to Patient"}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Patient View: Complete Doctor Profile & Paying Quoted Fee */}
                  {!isNutritionist && appointment?.status === "AWAITING_PAYMENT" && (
                    <div className="pt-2 border-t border-neutral-200 space-y-3">
                      {/* Doctor Profile Card for Patient Review Before Paying */}
                      <div className="p-4 rounded-2xl bg-white border-2 border-neutral-200 text-xs space-y-3 shadow-xs">
                        <div className="flex items-center justify-between pb-1.5 border-b border-neutral-200">
                          <span className="font-black text-black uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <Award size={13} className="text-[#F26722]" /> Specialist Credentials & Profile
                          </span>
                          <span className="text-[10px] font-black text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                            Verified Practitioner
                          </span>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-[#F26722] text-white flex items-center justify-center font-black text-lg shadow-xs shrink-0 overflow-hidden">
                            {n.profile_photo ? (
                              <img src={n.profile_photo} alt={n.name} className="w-full h-full object-cover" />
                            ) : (
                              (n.name || "S").charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-black">
                              Dr. {n.name || "Specialist Nutritionist"}
                            </h4>
                            <p className="text-xs text-neutral-800 font-bold">
                              {n.professional_title || "Clinical Nutritionist"} {n.qualification ? `• ${n.qualification}` : ""}
                            </p>
                            {n.current_organization && (
                              <p className="text-[11px] text-neutral-700 font-semibold mt-0.5">
                                Practice: {n.current_organization}
                              </p>
                            )}
                            {n.years_of_experience > 0 && (
                              <span className="inline-block mt-1 text-[10px] font-black text-[#F26722] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                                {n.years_of_experience}+ Years Clinical Experience
                              </span>
                            )}
                          </div>
                        </div>

                        {n.professional_bio && (
                          <p className="text-xs text-black leading-relaxed bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 italic font-medium">
                            "{n.professional_bio}"
                          </p>
                        )}

                        {n.specializations?.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 pt-1">
                            <span className="text-[10px] font-black text-neutral-600 mr-1 uppercase">Focus Areas:</span>
                            {n.specializations.map((spec, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-orange-50 text-[#F26722] border border-orange-200 text-[10px] font-black">
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border-2 border-[#F26722] shadow-xs">
                        <div>
                          <p className="text-xs font-black text-black">
                            Dr. {n.name || "The Specialist"} quoted consultation fee:
                          </p>
                          <p className="text-lg font-black text-[#F26722]">
                            ₹{appointment.fee_amount}
                          </p>
                          {appointment.nutritionist_quote_note && (
                            <p className="text-[11px] text-neutral-800 font-semibold mt-0.5">
                              Note: "{appointment.nutritionist_quote_note}"
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {!isVirtual && !appointment?.offline_payment_required && (
                            <button
                              type="button"
                              disabled={payingQuoted}
                              onClick={handlePayAtClinic}
                              className="px-4 py-2.5 rounded-xl bg-white text-black hover:bg-neutral-50 border-2 border-neutral-300 text-xs font-black transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                            >
                              <Building2 size={13} className="text-[#F26722]" />
                              <span>Confirm & Pay at Clinic</span>
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={payingQuoted}
                            onClick={handlePayQuotedFee}
                            className="px-5 py-2.5 rounded-xl bg-[#F26722] hover:bg-[#d95616] text-white text-xs font-black transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <span>{payingQuoted ? "Processing..." : `Pay ₹${appointment.fee_amount} Online & Confirm`}</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Patient View: Waiting for quote */}
                  {!isNutritionist && appointment?.status === "PENDING_REVIEW" && (
                    <div className="pt-2 border-t border-neutral-200 text-xs text-black font-semibold">
                      ⏳ Dr. {n.name || "The Specialist"} is currently reviewing your medical intake notes. You will be notified as soon as your consultation quote is ready to review and pay.
                    </div>
                  )}

                  {/* Quoted state indicator for doctor */}
                  {isNutritionist && appointment?.status === "AWAITING_PAYMENT" && (
                    <div className="pt-2 border-t border-neutral-200 text-xs text-black font-semibold">
                      ✓ Fee of ₹{appointment.fee_amount} quoted to patient. Awaiting patient payment to confirm slot.
                    </div>
                  )}
                </div>
              )}

              {/* Date & Time Highlight Banner */}
              <div className="p-4 rounded-2xl bg-white border-2 border-neutral-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-orange-50 text-[#F26722] border border-orange-200">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600 block">
                      Scheduled Date
                    </span>
                    <span className="text-sm sm:text-base font-black text-black font-[var(--font-primary)]">
                      {fmtDate(slot.date)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-orange-50 text-[#F26722] border border-orange-200">
                    <Clock size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600 block">
                      Session Time
                    </span>
                    <span className="text-sm sm:text-base font-black text-black font-[var(--font-primary)]">
                      {slot.start_time} – {slot.end_time}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 w-full sm:w-auto sm:min-w-[140px] text-left sm:text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600 block">
                    Consultation Fee
                  </span>
                  <span className="text-sm font-black text-[#F26722]">
                    ₹{price}{" "}
                    <span className="text-[10px] font-bold text-neutral-800 block">
                      {isPayAtClinic
                        ? appointment?.payment_status === "PAID"
                          ? "Paid at Clinic"
                          : "Pay at Clinic (Unpaid)"
                        : "Paid Online"}
                    </span>
                  </span>
                  {isNutritionist && appointment?.appointment_type === "IN_PERSON" && appointment?.payment_status === "UNPAID" && (
                    <button
                      type="button"
                      disabled={markingPaid}
                      onClick={handleMarkPaid}
                      className="mt-2 w-full text-[10px] font-black px-2 py-1.5 rounded-lg bg-[#F26722] hover:bg-[#d95616] text-white flex items-center justify-center gap-1 shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      <ShieldCheck size={11} />
                      <span>{markingPaid ? "Updating..." : "Mark Paid at Clinic"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Counterparty Information Card */}
              {!isNutritionist ? (
                /* Patient sees Nutritionist Details */
                <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-neutral-200 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                      <User size={13} className="text-[#F26722]" />
                      Nutritionist Information
                    </h3>
                    <span className="text-[10px] font-black text-[#F26722] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                      {appointment?.appointment_category === "EXPERT" ? "Specialist Expert" : "In-House Nutritionist"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#F26722] text-white flex items-center justify-center font-black text-lg shadow-xs">
                      {(n.name || "N").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-black">
                        {n.name || "Nutritionist"}
                      </h4>
                      <p className="text-xs text-neutral-800 font-bold">
                        {n.professional_title || "Clinical Nutritionist"} {n.qualification ? `• ${n.qualification}` : ""}
                      </p>
                      {n.email && (
                        <p className="text-xs text-[#F26722] font-bold flex items-center gap-1 mt-0.5">
                          <Mail size={12} /> {n.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Nutritionist sees Patient Details */
                <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-neutral-200 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-neutral-600 flex items-center gap-1.5">
                      <User size={13} className="text-[#F26722]" />
                      Patient Demographics & Contact
                    </h3>
                    <span className="text-[10px] font-black text-[#F26722] bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                      Patient #{p.id}
                    </span>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#F26722] text-white flex items-center justify-center font-black text-lg shadow-xs shrink-0">
                      {(p.name || "P").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base font-black text-black">
                        {p.name || "Patient"}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-800 font-bold mt-1">
                        {p.email && <span className="flex items-center gap-1"><Mail size={11} className="text-[#F26722]" /> {p.email}</span>}
                        {p.phone && <span className="flex items-center gap-1"><Phone size={11} className="text-[#F26722]" /> {p.phone}</span>}
                        {p.gender && <span>Gender: <strong className="text-black capitalize">{p.gender}</strong></span>}
                        {p.age && <span>Age: <strong className="text-black">{p.age} yrs</strong></span>}
                      </div>

                      {p.goal && (
                        <p className="text-xs text-black mt-2 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200 inline-block font-black">
                          🎯 Health Goal: {p.goal}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Meeting Link or Clinic Address Details */}
              {isVirtual ? (
                <div className="p-4 rounded-2xl bg-white border-2 border-orange-200 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#F26722] text-white flex items-center justify-center">
                        <Video size={14} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-black">
                        Virtual Video Consultation (Zoom)
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-950 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
                      Active Link
                    </span>
                  </div>

                  {appointment?.meeting_link ? (
                    <div>
                      <p className="text-xs font-mono break-all p-2.5 rounded-xl bg-neutral-50 text-black border border-neutral-300 font-bold shadow-2xs mb-2.5">
                        {appointment.meeting_link}
                      </p>
                      <div className="flex gap-2">
                        <a
                          href={appointment.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black text-white bg-[#F26722] hover:bg-[#d95616] shadow-xs transition-colors cursor-pointer"
                        >
                          <ExternalLink size={13} /> Open Zoom Consultation
                        </a>
                        <button
                          onClick={handleCopyLink}
                          className="inline-flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl text-xs font-black text-black bg-white border-2 border-neutral-300 hover:border-[#F26722] hover:text-[#F26722] transition-colors cursor-pointer"
                        >
                          {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                          <span>{copiedLink ? "Copied" : "Copy Link"}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-800 italic font-semibold">
                      Zoom meeting link will be generated prior to consultation start.
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-white border-2 border-neutral-200 space-y-2 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#F26722] text-white flex items-center justify-center">
                      <Building2 size={14} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-black">
                      In-Clinic Practice Location
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black space-y-1">
                    <p className="font-black flex items-start gap-1.5">
                      <MapPin size={14} className="text-[#F26722] shrink-0 mt-0.5" />
                      <span>{n.offline_location || "Clinic address will be confirmed by nutritionist."}</span>
                    </p>
                    <p className="text-[11px] text-neutral-700 pl-5 font-bold">
                      Please arrive 5–10 minutes before your scheduled appointment time.
                    </p>
                  </div>
                </div>
              )}

              {/* Clinical Notes & Dietary Instructions Section */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-neutral-200 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#F26722]" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-black">
                      Clinical Notes & Dietary Instructions
                    </h3>
                  </div>

                  {isNutritionist && !isEditingNotes && (
                    <button
                      onClick={() => setIsEditingNotes(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black text-[#F26722] bg-white border-2 border-orange-200 hover:bg-orange-50 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Edit3 size={12} /> Edit Notes
                    </button>
                  )}
                </div>

                {isNutritionist && isEditingNotes ? (
                  /* Nutritionist Edit Mode */
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-black text-black mb-1">
                        Clinical Assessment & Observations
                      </label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Write clinical findings, progress remarks, or nutritional observations..."
                        className="w-full p-3 bg-white border-2 border-neutral-300 rounded-xl text-xs sm:text-sm text-black font-bold focus:border-[#F26722] focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-black mb-1">
                        Dietary Advice & Action Plan for Patient
                      </label>
                      <textarea
                        rows={3}
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="Enter meal modifications, water goals, supplements, or specific action items..."
                        className="w-full p-3 bg-white border-2 border-neutral-300 rounded-xl text-xs sm:text-sm text-black font-bold focus:border-[#F26722] focus:outline-none transition-all"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditingNotes(false)}
                        className="px-4 py-2 rounded-xl text-xs font-black text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={savingNotes}
                        onClick={handleSaveNotes}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black text-white bg-[#F26722] hover:bg-[#d95616] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Save size={13} />
                        {savingNotes ? "Saving Notes..." : "Save Notes & Instructions"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Read Mode for Patient & Nutritionist */
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                      <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600 block mb-1">
                        Clinical Notes & Observations
                      </span>
                      {notes ? (
                        <p className="text-xs sm:text-sm text-black whitespace-pre-line leading-relaxed font-bold">
                          {notes}
                        </p>
                      ) : (
                        <p className="text-xs text-neutral-600 italic font-semibold">
                          No clinical notes added yet.
                        </p>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#F26722] block mb-1">
                        Dietary Instructions & Action Plan
                      </span>
                      {instructions ? (
                        <p className="text-xs sm:text-sm text-black whitespace-pre-line leading-relaxed font-bold">
                          {instructions}
                        </p>
                      ) : (
                        <p className="text-xs text-neutral-600 italic font-semibold">
                          No specific dietary instructions recorded.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Consultation Feedback & Ratings Section */}
              {appointment?.feedbacks?.length > 0 && (
                <div className="p-4 rounded-2xl bg-white border-2 border-neutral-200 space-y-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-black">
                      Patient Consultation Feedback & Review
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {appointment?.feedbacks?.map((fb, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-black">
                            {fb.user_name || "Patient"}
                          </span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-sm ${
                                  star <= fb.rating ? "text-amber-500" : "text-neutral-300"
                                }`}
                              >
                                ★
                              </span>
                            ))}
                            <span className="text-xs font-black text-black ml-1">
                              {fb.rating}.0
                            </span>
                          </div>
                        </div>

                        {fb.comment && (
                          <p className="text-xs text-neutral-800 font-semibold italic">
                            "{fb.comment}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t-2 border-neutral-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {isConfirmed && (
              <>
                <button
                  type="button"
                  disabled={!appointment?.can_reschedule && !isNutritionist}
                  onClick={() => setIsRescheduleOpen(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black text-black bg-white border-2 border-neutral-300 hover:border-blue-500 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
                  title={
                    !appointment?.can_reschedule && !isNutritionist
                      ? "Rescheduling requires at least 24 hours advance notice and max 2 attempts."
                      : "Reschedule appointment to a new slot"
                  }
                >
                  <span>🔄 Reschedule</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCancelOpen(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black text-rose-700 bg-white border-2 border-rose-300 hover:bg-rose-50 transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
                >
                  <XCircle size={14} />
                  <span>Cancel Appointment</span>
                </button>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black text-black bg-white border-2 border-neutral-300 hover:border-[#F26722] hover:text-[#F26722] transition-all cursor-pointer shadow-2xs text-center"
          >
            Close Details
          </button>
        </div>

        {/* Reschedule Sub-Modal */}
        {appointment && (
          <RescheduleModal
            isOpen={isRescheduleOpen}
            onClose={() => setIsRescheduleOpen(false)}
            appointment={appointment}
            userRole={userRole}
            onRescheduled={(updated) => {
              setAppointment(updated);
              onNotesSaved?.(updated);
            }}
          />
        )}

        {/* Cancel Sub-Modal */}
        {appointment && (
          <CancelModal
            isOpen={isCancelOpen}
            onClose={() => setIsCancelOpen(false)}
            appointment={appointment}
            userRole={userRole}
            onCancelled={(updated) => {
              setAppointment(updated);
              onNotesSaved?.(updated);
            }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default AppointmentDetailModal;
