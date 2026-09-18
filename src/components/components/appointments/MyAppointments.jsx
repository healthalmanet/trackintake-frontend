import React, { useEffect, useState, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "../../../api/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, User, XCircle, CheckCircle, AlertCircle,
  CalendarDays, Video, Copy, ExternalLink,
  WifiOff, Star, Sparkles, MessageSquarePlus, Building2,
  MapPin, Search, X, RefreshCw, Filter, Layers, FileText, Info
} from "lucide-react";
import AppointmentDetailModal from "./AppointmentDetailModal";

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
  CONFIRMED: { color: "#16a34a", bg: "#f0fdf4", border: "#86efac", icon: <CheckCircle size={13} /> },
  PENDING:   { color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: <AlertCircle  size={13} /> },
  CANCELLED: { color: "#dc2626", bg: "#fff1f2", border: "#fecdd3", icon: <XCircle      size={13} /> },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      {cfg.icon} <span>{status}</span>
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
    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 via-blue-50/80 to-indigo-50 border border-blue-200 mb-3.5 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-xs">
            <Video size={14} color="white" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">
              Zoom Video Consultation
            </span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Session
        </span>
      </div>

      {/* Link preview */}
      <div className="px-3 py-1.5 rounded-xl mb-3 text-xs font-mono break-all bg-white/90 text-blue-800 border border-blue-200 shadow-2xs">
        {link}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs hover:shadow transition-all cursor-pointer"
        >
          <ExternalLink size={13} /> Join Consultation
        </a>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-blue-700 bg-white border border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
        >
          <Copy size={13} /> {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>
    </div>
  );
};

/* ─── In-Clinic Practice Location Block ──────────────────────── */
const InClinicBlock = ({ location }) => (
  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/70 to-emerald-50 border border-emerald-200 mb-3.5">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center shadow-xs text-white">
        <Building2 size={14} />
      </div>
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
          In-Clinic Appointment
        </span>
      </div>
    </div>

    <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200 text-xs text-emerald-900 space-y-1">
      <div className="flex items-start gap-1.5">
        <MapPin size={14} className="text-emerald-700 shrink-0 mt-0.5" />
        <span className="font-semibold">
          {location || "Clinic address will be confirmed by your nutritionist before the visit."}
        </span>
      </div>
      <p className="text-[11px] text-emerald-700 pl-5">
        Please arrive 5–10 minutes prior to your scheduled consultation.
      </p>
    </div>
  </div>
);

/* ─── No Meeting Placeholder ────────────────────────────────── */
const NoMeetingPlaceholder = () => (
  <div className="rounded-2xl p-3.5 mb-3.5 flex items-center gap-3 bg-[var(--color-bg-surface-alt)] border border-dashed border-[var(--color-border-default)]">
    <WifiOff size={18} className="text-[var(--color-text-muted)] shrink-0" />
    <div>
      <p className="text-xs font-bold text-[var(--color-text-strong)]">
        Virtual Consultation Link Generating
      </p>
      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
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
      className="rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] flex flex-col justify-between"
    >
      {/* Top accent bar */}
      <div
        className={`h-1.5 w-full ${
          isVirtual
            ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-400"
            : "bg-gradient-to-r from-emerald-500 via-teal-500 to-green-400"
        }`}
      />

      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Nutritionist Header & Status */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-xs ${
                  isVirtual
                    ? "bg-gradient-to-br from-blue-600 to-indigo-600"
                    : "bg-gradient-to-br from-emerald-600 to-teal-600"
                }`}
              >
                {(a.nutritionist_name || "N").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {a.appointment_category === "EXPERT" ? "Specialist Expert" : "In-House Nutritionist"}
                </p>
                <h3 className="font-extrabold text-base text-[var(--color-text-strong)] font-[var(--font-primary)]">
                  {a.nutritionist_name || "Nutritionist"}
                </h3>
                {a.nutritionist_email && (
                  <p className="text-[11px] text-[var(--color-text-muted)] truncate max-w-[200px]">
                    {a.nutritionist_email}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge status={a.status} />
              {hasNotes && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary-bg-subtle)] border border-[var(--color-border-hover)] px-2 py-0.5 rounded-full">
                  <FileText size={10} /> Notes Attached
                </span>
              )}
            </div>
          </div>

          {/* Slot Date & Time Banner */}
          <div className="rounded-2xl p-3.5 mb-3.5 bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[var(--color-primary)]" />
              <span className="font-black text-sm text-[var(--color-text-strong)] font-[var(--font-primary)]">
                {a.slot?.start_time} – {a.slot?.end_time}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-[var(--color-text-muted)]" />
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                {fmtDate(a.slot?.date)}
              </span>
            </div>
          </div>

          {/* Consultation Mode & Booked Date */}
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <div className="rounded-xl p-2.5 bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
                Mode
              </p>
              {isVirtual ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700">
                  <Video size={13} className="text-blue-600" /> Virtual Zoom
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <Building2 size={13} className="text-emerald-600" /> In-Clinic
                </span>
              )}
            </div>

            <div className="rounded-xl p-2.5 bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
                Booked On
              </p>
              <p className="text-xs font-semibold text-[var(--color-text-strong)] truncate">
                {fmtDateTime(a.created_at)}
              </p>
            </div>
          </div>

          {/* Fee & Payment Type */}
          <div className="grid grid-cols-2 gap-2.5 mb-3.5">
            <div className="rounded-xl p-2.5 bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
                Fee
              </p>
              <p className="text-xs font-black text-[var(--color-text-strong)]">
                ₹{a.price || (isVirtual ? a.online_price : a.offline_price) || (a.slot?.price) || 0}
              </p>
            </div>

            <div className="rounded-xl p-2.5 bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
                Payment
              </p>
              {!isVirtual && a.offline_payment_required === false ? (
                <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                  Pay at Clinic
                </span>
              ) : (
                <span className="inline-flex items-center text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                  Paid Online / Quota
                </span>
              )}
            </div>
          </div>

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
            <div className="mt-2 rounded-2xl p-3 bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)] space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                Feedback & Notes
              </p>
              {a.feedbacks.map((fb, i) => (
                <div key={i} className="text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--color-text-strong)]">{fb.user_name}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className={s <= fb.rating ? "text-amber-400" : "text-gray-300"}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {fb.comment && <p className="text-gray-600 dark:text-gray-400">{fb.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card Actions */}
        <div className="pt-3 border-t border-[var(--color-border-default)] space-y-2 mt-2">
          <button
            onClick={() => onViewDetails(a.id)}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-[var(--color-text-strong)] bg-[var(--color-bg-surface-alt)] hover:bg-[var(--color-primary-bg-subtle)] hover:text-[var(--color-primary)] border border-[var(--color-border-default)] hover:border-[var(--color-border-hover)] transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Info size={14} /> View Details & Clinical Notes
          </button>

          {isConfirmed && !hasGivenFeedback && (
            <button
              onClick={() => onFeedback(a.id)}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <MessageSquarePlus size={14} /> Leave Consultation Feedback
            </button>
          )}

          {isConfirmed && (
            <button
              disabled={!ablToCancel}
              onClick={() => onCancel(a.id)}
              className="w-full py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <XCircle size={14} />
              {ablToCancel ? "Cancel Appointment" : "Cannot Cancel (Past Appointment)"}
            </button>
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
        { label: "Total Booked", val: total, icon: <CalendarDays size={18} />, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
        { label: "Confirmed", val: confirmed, icon: <CheckCircle size={18} />, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
        { label: "Virtual Zoom", val: virtual, icon: <Video size={18} />, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
        { label: "In-Clinic Visits", val: inClinic, icon: <Building2 size={18} />, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-900/20" },
      ].map(({ label, val, icon, color, bg }) => (
        <div
          key={label}
          className="rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] shadow-xs"
        >
          <div className={`p-2.5 rounded-xl ${bg} ${color}`}>{icon}</div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)] leading-none">
              {val}
            </p>
            <p className="text-[11px] font-semibold text-[var(--color-text-muted)] mt-1">{label}</p>
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

  const cancelAppointment = async (id) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await axiosInstance.post(`/appointments/appointments/${id}/cancel/`);
      toast.success("Appointment cancelled");
      fetchAppointments();
    } catch {
      toast.error("Failed to cancel appointment");
    }
  };

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
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)]">
              {[
                { key: "ALL", label: "All Status" },
                { key: "CONFIRMED", label: "Confirmed" },
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
                onCancel={cancelAppointment}
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
