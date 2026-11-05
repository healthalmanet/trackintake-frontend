import React, { useEffect, useState, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "../../../api/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, User, XCircle, CheckCircle, AlertCircle,
  CalendarDays, Video, Copy, ExternalLink,
  WifiOff, Star, Sparkles, MessageSquarePlus, Building2,
  MapPin, Search, X, RefreshCw, Filter, Layers, FileText, Info, ChevronRight
} from "lucide-react";
import AppointmentDetailModal from "./AppointmentDetailModal";
import RescheduleModal from "./RescheduleModal";
import CancelModal from "./CancelModal";

/* ─── Helpers ───────────────────────────────────────────────── */
const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
  });
};

const fmtDateTime = (v) => {
  if (!v) return "";
  return new Date(v).toLocaleString(undefined, {
    weekday: "short", day: "2-digit", month: "short",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const canCancel = (date, time) => {
  if (!date || !time) return false;
  return new Date() < new Date(`${date}T${time}`);
};

/* ─── Status Badge ──────────────────────────────────────────── */
const STATUS_CONFIG = {
  CONFIRMED:        { color: "#000000", bg: "#dcfce7", border: "#86efac", label: "Confirmed", icon: <CheckCircle size={13} className="text-emerald-700" /> },
  PENDING:          { color: "#000000", bg: "#ffedd5", border: "#fdba74", label: "Pending", icon: <AlertCircle  size={13} className="text-[#F26722]" /> },
  PENDING_REVIEW:   { color: "#000000", bg: "#ffedd5", border: "#fdba74", label: "Under Doctor Review", icon: <Clock size={13} className="text-[#F26722]" /> },
  AWAITING_PAYMENT: { color: "#ffffff", bg: "#F26722", border: "#ea580c", label: "Quote Ready - Pay Now", icon: <AlertCircle size={13} className="text-white" /> },
  DECLINED:         { color: "#000000", bg: "#f1f5f9", border: "#94a3b8", label: "Declined", icon: <XCircle size={13} className="text-neutral-700" /> },
  CANCELLED:        { color: "#000000", bg: "#fee2e2", border: "#fca5a5", label: "Cancelled", icon: <XCircle size={13} className="text-rose-700" /> },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      {cfg.icon} <span>{cfg.label || status}</span>
    </span>
  );
};

/* ─── Zoom Meeting Block ─────────────────────────────────────── */
const ZoomBlock = ({ link }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Zoom meeting link copied!", {
      icon: "📋",
      style: { fontFamily: "var(--font-secondary)" },
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 rounded-2xl bg-white border-2 border-orange-200 mb-3.5 shadow-xs relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#F26722] flex items-center justify-center shadow-xs text-white">
            <Video size={14} color="white" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-black block">
              Zoom Video Consultation
            </span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> Active Session
        </span>
      </div>

      {/* Link preview */}
      <div className="px-3 py-1.5 rounded-xl mb-3 text-xs font-mono break-all bg-neutral-50 text-black border border-neutral-300 shadow-2xs font-semibold">
        {link}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-[#F26722] hover:bg-[#d95616] shadow-xs transition-all cursor-pointer"
        >
          <ExternalLink size={13} /> Join Consultation
        </a>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-black bg-white border border-neutral-300 hover:border-[#F26722] hover:text-[#F26722] transition-all cursor-pointer"
        >
          <Copy size={13} /> {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>
    </div>
  );
};

/* ─── In-Clinic Practice Location Block ──────────────────────── */
const InClinicBlock = ({ location }) => (
  <div className="p-4 rounded-2xl bg-white border-2 border-neutral-200 mb-3.5 shadow-xs">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-7 h-7 rounded-lg bg-[#F26722] flex items-center justify-center shadow-xs text-white">
        <Building2 size={14} />
      </div>
      <div>
        <span className="text-xs font-black uppercase tracking-wider text-black block">
          In-Clinic Appointment
        </span>
      </div>
    </div>

    <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-black space-y-1">
      <div className="flex items-start gap-1.5">
        <MapPin size={14} className="text-[#F26722] shrink-0 mt-0.5" />
        <span className="font-bold text-black">
          {location || "Clinic address will be confirmed by your nutritionist before the visit."}
        </span>
      </div>
      <p className="text-[11px] text-neutral-600 pl-5 font-medium">
        Please arrive 5–10 minutes prior to your scheduled consultation.
      </p>
    </div>
  </div>
);

/* ─── No Meeting Placeholder ────────────────────────────────── */
const NoMeetingPlaceholder = () => (
  <div className="rounded-2xl p-3.5 mb-3.5 flex items-center gap-3 bg-white border-2 border-neutral-200 shadow-2xs">
    <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#F26722] shrink-0 border border-orange-200 flex items-center justify-center">
      <Video size={16} />
    </div>
    <div>
      <p className="text-xs font-black text-black">
        Virtual Consultation Link Generating
      </p>
      <p className="text-xs text-neutral-800 font-medium mt-0.5">
        Your Zoom video link will appear here prior to your consultation start.
      </p>
    </div>
  </div>
);

/* ─── Appointment Card ──────────────────────────────────────── */
const AppointmentCard = ({ a, onCancel, onFeedback, onViewDetails, idx }) => {
  const hasGivenFeedback = a.feedbacks?.some((fb) => fb.role === "PATIENT");
  const isConfirmed = a.status === "CONFIRMED";
  const ablToCancel = canCancel(a.slot?.date, a.slot?.start_time);
  const isVirtual = a.appointment_type === "VIRTUAL";
  const hasNotes = Boolean(a.notes || a.instructions);

  return (
    <motion.div
      key={a.id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04, duration: 0.25 }}
      className="rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 bg-white border-2 border-neutral-200 flex flex-col justify-between"
    >
      {/* Top accent bar */}
      <div className="h-1.5 w-full bg-[#F26722]" />

      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Nutritionist Header & Status */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-xs bg-[#F26722]">
                {(a.nutritionist_name || "N").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-[#F26722]">
                  {a.appointment_category === "EXPERT" ? "Specialist Expert" : "In-House Nutritionist"}
                </p>
                <h3 className="font-black text-base text-black font-[var(--font-primary)]">
                  {a.nutritionist_name || "Nutritionist"}
                </h3>
                {a.nutritionist_email && (
                  <p className="text-xs text-neutral-800 font-bold truncate max-w-[200px]">
                    {a.nutritionist_email}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge status={a.status} />
              {a.payment_status === "PENDING_REFUND" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full">
                  ⚠️ Pending Refund: ₹{a.refund_amount}
                </span>
              )}
              {a.payment_status === "REFUNDED" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                  ✓ Refunded: ₹{a.refund_amount}
                </span>
              )}
              {a.status === "CANCELLED" && a.payment_status === "NO_REFUND" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  No Refund
                </span>
              )}
              {a.reschedule_count > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-800 bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded-full">
                  Rescheduled {a.reschedule_count}/2
                </span>
              )}
              {hasNotes && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#F26722] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                  <FileText size={10} className="text-[#F26722]" /> Notes Attached
                </span>
              )}
            </div>
          </div>

          {/* Slot Date & Time Banner */}
          <div className="rounded-2xl p-3.5 mb-3.5 bg-neutral-50 border border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[#F26722]" />
              <span className="font-black text-sm text-black">
                {a.slot?.start_time} – {a.slot?.end_time}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-black" />
              <span className="text-xs font-black text-black">
                {fmtDate(a.slot?.date)}
              </span>
            </div>
          </div>

          {/* Consultation Mode & Booked Date */}
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <div className="rounded-xl p-2.5 bg-neutral-50 border border-neutral-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mb-1">
                Mode
              </p>
              {isVirtual ? (
                <span className="inline-flex items-center gap-1 text-xs font-black text-black">
                  <Video size={13} className="text-[#F26722]" /> Virtual Zoom
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-black text-black">
                  <Building2 size={13} className="text-[#F26722]" /> In-Clinic
                </span>
              )}
            </div>

            <div className="rounded-xl p-2.5 bg-neutral-50 border border-neutral-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mb-1">
                Booked On
              </p>
              <p className="text-xs font-black text-black truncate">
                {fmtDateTime(a.created_at)}
              </p>
            </div>
          </div>

          {/* Fee & Payment Type */}
          <div className="grid grid-cols-2 gap-2.5 mb-3.5">
            <div className="rounded-xl p-2.5 bg-neutral-50 border border-neutral-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mb-1">
                Fee
              </p>
              <p className="text-xs font-black text-[#F26722]">
                ₹{a.fee_amount || a.price || (isVirtual ? a.online_price : a.offline_price) || (a.slot?.price) || 0}
              </p>
            </div>

            <div className="rounded-xl p-2.5 bg-neutral-50 border border-neutral-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mb-1">
                Payment
              </p>
              {!isVirtual && a.offline_payment_required === false ? (
                <span className="inline-flex items-center text-[10px] font-black text-black bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded-lg">
                  {a.payment_status === "PAID" ? "Paid at Clinic" : "Pay at Clinic"}
                </span>
              ) : (
                <span className="inline-flex items-center text-[10px] font-black text-black bg-neutral-100 border border-neutral-300 px-2 py-0.5 rounded-lg">
                  {a.status === "AWAITING_PAYMENT" ? "Quote Ready (Unpaid)" : a.payment_status === "PAID" ? "Paid Online" : "Online Rate"}
                </span>
              )}
            </div>
          </div>

          {/* Variable Appointment Status Banners */}
          {a.status === "AWAITING_PAYMENT" && (
            <div className="p-4 rounded-2xl bg-white border-2 border-[#F26722] space-y-2.5 mb-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-black uppercase tracking-wider">
                  Specialist Quoted Fee:
                </span>
                <span className="text-base font-black text-[#F26722]">
                  ₹{a.fee_amount || a.price || 0}
                </span>
              </div>
              {a.nutritionist_quote_note && (
                <p className="text-xs text-black bg-orange-50/60 p-2.5 rounded-xl border border-orange-200 italic font-semibold leading-relaxed">
                  "{a.nutritionist_quote_note}"
                </p>
              )}
              <button
                type="button"
                onClick={() => onViewDetails(a.id)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-white bg-[#F26722] hover:bg-[#d95616] shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Review Case & Pay ₹{a.fee_amount || a.price || 0}</span>
                <ChevronRight size={15} />
              </button>
            </div>
          )}

          {a.status === "PENDING_REVIEW" && (
            <div className="p-4 rounded-2xl bg-white border-2 border-orange-300 text-xs text-black mb-3.5 space-y-1.5 shadow-xs">
              <div className="flex items-center gap-1.5 font-black text-black">
                <Clock size={14} className="text-[#F26722] shrink-0" />
                <span className="uppercase tracking-wider text-[11px]">Case Under Specialist Review</span>
              </div>
              <p className="text-xs text-neutral-800 font-medium leading-relaxed bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                Your medical notes have been sent to Dr. {a.nutritionist_name}. You will be notified as soon as your fee quote is ready.
              </p>
            </div>
          )}

          {/* Mode Details Block */}
          {isVirtual ? (
            a.meeting_link ? (
              <ZoomBlock link={a.meeting_link} />
            ) : (
              <NoMeetingPlaceholder />
            )
          ) : (
            <InClinicBlock location={a.offline_location} />
          )}

          {/* Feedbacks Display */}
          {a.feedbacks?.length > 0 && (
            <div className="mt-2 rounded-2xl p-3 bg-neutral-50 border border-neutral-200 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Feedback & Notes
              </p>
              {a.feedbacks.map((fb, i) => (
                <div key={i} className="text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-black">{fb.user_name}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className={s <= fb.rating ? "text-amber-500" : "text-neutral-300"}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {fb.comment && <p className="text-neutral-700 italic font-medium">"{fb.comment}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card Actions */}
        <div className="pt-3 border-t border-neutral-200 space-y-2 mt-2">
          <button
            onClick={() => onViewDetails(a.id)}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-black bg-white hover:bg-orange-50 hover:text-[#F26722] border-2 border-neutral-200 hover:border-[#F26722] transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Info size={14} className="text-[#F26722]" /> View Details & Clinical Notes
          </button>

          {isConfirmed && !hasGivenFeedback && (
            <button
              onClick={() => onFeedback(a.id)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-black text-white bg-[#F26722] hover:bg-[#d95616] transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <MessageSquarePlus size={14} /> Leave Consultation Feedback
            </button>
          )}

          {isConfirmed && (
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={!a.can_reschedule}
                onClick={() => onReschedule(a)}
                className="py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-neutral-300 bg-white text-black hover:border-blue-500 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                title={
                  !a.can_reschedule
                    ? "Rescheduling requires at least 24h advance notice and maximum 2 attempts per booking."
                    : `Reschedule session (${a.reschedule_remaining ?? 2} left)`
                }
              >
                <RefreshCw size={12} />
                <span className="truncate">
                  {a.can_reschedule ? `Reschedule (${a.reschedule_remaining ?? 2})` : "Reschedule (Locked)"}
                </span>
              </button>

              <button
                disabled={!ablToCancel}
                onClick={() => onCancel(a)}
                className="py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-rose-300 bg-white text-rose-700 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
              >
                <XCircle size={13} />
                <span>{ablToCancel ? "Cancel" : "Past"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Stats Bar ─────────────────────────────────────────────── */
const StatsBar = ({ appointments }) => {
  const total = appointments.length;
  const confirmed = appointments.filter((a) => a.status === "CONFIRMED").length;
  const virtual = appointments.filter((a) => a.appointment_type === "VIRTUAL").length;
  const inClinic = appointments.filter((a) => a.appointment_type === "IN_PERSON").length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[
        { label: "Total Booked", val: total, icon: <CalendarDays size={18} /> },
        { label: "Confirmed", val: confirmed, icon: <CheckCircle size={18} /> },
        { label: "Virtual Zoom", val: virtual, icon: <Video size={18} /> },
        { label: "In-Clinic Visits", val: inClinic, icon: <Building2 size={18} /> },
      ].map(({ label, val, icon }) => (
        <div
          key={label}
          className="rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 bg-white border-2 border-neutral-200 shadow-xs"
        >
          <div className="p-2.5 rounded-xl bg-orange-50 text-[#F26722] border border-orange-200">{icon}</div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-black font-[var(--font-primary)] leading-none">
              {val}
            </p>
            <p className="text-[11px] font-bold text-neutral-600 mt-1 uppercase tracking-wider">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT: PATIENT APPOINTMENTS
═══════════════════════════════════════════════════════════════ */
const MyAppointments = ({ refresh } = {}) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [timeHorizon, setTimeHorizon] = useState("upcoming"); // upcoming | past | all
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | CONFIRMED | CANCELLED
  const [modeFilter, setModeFilter] = useState("ALL"); // ALL | VIRTUAL | IN_PERSON
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // Feedback Modal
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Appointment Detail & Notes Modal
  const [detailModalApptId, setDetailModalApptId] = useState(null);

  // Reschedule & Cancel Modals State
  const [rescheduleModalAppt, setRescheduleModalAppt] = useState(null);
  const [cancelModalAppt, setCancelModalAppt] = useState(null);

  const openFeedbackModal = (id) => {
    setSelectedAppointment(id);
    setRating(5);
    setComment("");
  };

  const submitFeedback = async () => {
    if (!selectedAppointment) return;
    setSubmittingFeedback(true);
    try {
      await axiosInstance.post(
        `/appointments/${selectedAppointment}/feedback/`,
        { rating, comment }
      );
      toast.success("Thank you for your consultation feedback! ✨");
      setSelectedAppointment(null);
      fetchAppointments();
    } catch {
      toast.error("Failed to submit feedback.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (timeHorizon && timeHorizon !== "all") params.time_horizon = timeHorizon;
      if (statusFilter && statusFilter !== "ALL") params.status = statusFilter;
      if (modeFilter && modeFilter !== "ALL") params.appointment_type = modeFilter;
      if (filterDate) params.date = filterDate;
      if (search) params.search = search;

      const res = await axiosInstance.get("/appointments/my/", { params });
      const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setAppointments(data);
    } catch {
      toast.error("Failed to load appointments");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [refresh, timeHorizon, statusFilter, modeFilter, filterDate]);

  useEffect(() => {
    const timer = setTimeout(fetchAppointments, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="min-h-screen pb-16 bg-[var(--color-bg-app)] font-[var(--font-secondary)] text-[var(--color-text-strong)]">
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: 14 } }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl flex items-center justify-center shadow-md bg-[var(--color-primary)] text-white">
              <CalendarDays size={26} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] text-[11px] font-bold tracking-wider uppercase mb-1 border border-[var(--color-border-hover)]">
                Consultation Hub
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
                My Appointments
              </h1>
            </div>
          </div>

          <button
            onClick={fetchAppointments}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-2xl border-2 border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-xs font-bold text-[var(--color-text-strong)] hover:bg-[var(--color-bg-surface-alt)] transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-[var(--color-primary)]" : ""} />
            <span>Refresh</span>
          </button>
        </div>

        {/* ── Stats Summary Bar ── */}
        <StatsBar appointments={appointments} />

        {/* ── Filter Toolbar ── */}
        <div className="p-4 rounded-3xl bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] shadow-xs space-y-3">
          
          {/* Main Filter Tabs Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Horizon Filter Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)]">
              {[
                { key: "upcoming", label: "Upcoming" },
                { key: "past", label: "Past" },
                { key: "all", label: "All Appointments" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setTimeHorizon(tab.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    timeHorizon === tab.key
                      ? "bg-[var(--color-primary)] text-white shadow-xs"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Mode Filter Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)]">
              {[
                { key: "ALL", label: "All Modes" },
                { key: "VIRTUAL", label: "Virtual (Zoom)", icon: <Video size={11} /> },
                { key: "IN_PERSON", label: "In-Clinic", icon: <Building2 size={11} /> },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setModeFilter(m.key)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    modeFilter === m.key
                      ? "bg-[var(--color-bg-surface)] text-[var(--color-primary)] shadow-xs font-black border border-[var(--color-border-hover)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
                  }`}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)] overflow-x-auto">
              {[
                { key: "ALL", label: "All Status" },
                { key: "CONFIRMED", label: "Confirmed" },
                { key: "PENDING_REVIEW", label: "Under Review" },
                { key: "AWAITING_PAYMENT", label: "Action Needed" },
                { key: "CANCELLED", label: "Cancelled" },
              ].map((st) => (
                <button
                  key={st.key}
                  onClick={() => setStatusFilter(st.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === st.key
                      ? "bg-[var(--color-bg-surface)] text-[var(--color-primary)] shadow-xs font-black"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search by Nutritionist & Date Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[var(--color-border-default)]">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
              />
              <input
                type="text"
                placeholder="Search nutritionist name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] focus:border-[var(--color-primary)] focus:outline-none text-xs text-[var(--color-text-strong)]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] focus:border-[var(--color-primary)] focus:outline-none text-xs text-[var(--color-text-strong)] font-semibold"
              />
            </div>

            <button
              onClick={() => {
                setTimeHorizon("upcoming");
                setStatusFilter("ALL");
                setModeFilter("ALL");
                setFilterDate("");
                setSearch("");
              }}
              className="w-full py-1.5 px-3 rounded-xl border border-[var(--color-border-default)] text-xs font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-alt)] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* ── Appointments List Grid ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw size={28} className="animate-spin text-[var(--color-primary)]" />
            <p className="text-xs sm:text-sm font-semibold text-[var(--color-text-muted)]">
              Loading your appointments...
            </p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-surface)] max-w-lg mx-auto">
            <CalendarDays size={40} className="mx-auto mb-3 text-[var(--color-primary)] opacity-70" />
            <h3 className="text-base font-bold text-[var(--color-text-strong)]">
              No Appointments Found
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {timeHorizon === "upcoming"
                ? "You have no upcoming consultations matching your selected filters."
                : "No past appointment records match your criteria."}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {appointments.map((a, i) => (
              <AppointmentCard
                key={a.id}
                a={a}
                idx={i}
                onCancel={(appt) => setCancelModalAppt(appt)}
                onReschedule={(appt) => setRescheduleModalAppt(appt)}
                onFeedback={openFeedbackModal}
                onViewDetails={(id) => setDetailModalApptId(id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Appointment Details & Clinical Notes Modal ── */}
      <AppointmentDetailModal
        appointmentId={detailModalApptId}
        isOpen={Boolean(detailModalApptId)}
        onClose={() => setDetailModalApptId(null)}
        userRole="patient"
        onNotesSaved={fetchAppointments}
      />

      {/* ── Reschedule Modal ── */}
      <RescheduleModal
        appointment={rescheduleModalAppt}
        isOpen={Boolean(rescheduleModalAppt)}
        onClose={() => setRescheduleModalAppt(null)}
        userRole="patient"
        onRescheduled={fetchAppointments}
      />

      {/* ── Cancel Modal with Policy Notice ── */}
      <CancelModal
        appointment={cancelModalAppt}
        isOpen={Boolean(cancelModalAppt)}
        onClose={() => setCancelModalAppt(null)}
        userRole="patient"
        onCancelled={fetchAppointments}
      />

      {/* ── Feedback Modal ── */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl p-6 shadow-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] space-y-4">
            <div>
              <h3 className="text-lg font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
                Consultation Feedback
              </h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                How was your session with the nutritionist?
              </p>
            </div>

            {/* Star Rating */}
            <div className="flex justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setRating(s)}
                  className="text-2xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                  style={{ color: s <= rating ? "#facc15" : "#d1d5db" }}
                >
                  ★
                </button>
              ))}
            </div>

            {/* Comment Box */}
            <textarea
              placeholder="Share your experience, diet plan takeaways, or recommendations..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 rounded-2xl text-xs outline-none border border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] focus:border-[var(--color-primary)] text-[var(--color-text-strong)] min-h-[90px]"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs border border-[var(--color-border-default)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-alt)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitFeedback}
                disabled={submittingFeedback}
                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {submittingFeedback ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
