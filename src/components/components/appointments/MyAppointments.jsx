import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "../../../api/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, User, XCircle, CheckCircle, AlertCircle,
  CalendarDays, Video, Copy, ExternalLink,
  WifiOff, Star, Sparkles, MessageSquarePlus
} from "lucide-react";

/* ─── Scoped styles ─────────────────────────────────────────── */
const STYLES = `
  .ma-root { font-family: var(--font-secondary); }
  .ma-heading { font-family: var(--font-primary); font-weight: 700; }
  .ma-subheading { font-family: var(--font-primary); font-weight: 600; }

  @keyframes ma-fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ma-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes ma-pulse-ring {
    0%   { transform: scale(1);   opacity: 0.8; }
    100% { transform: scale(1.6); opacity: 0; }
  }
  @keyframes ma-shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  @keyframes ma-zoom-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.25); }
    50%       { box-shadow: 0 0 0 8px rgba(59,130,246,0); }
  }

  .ma-spinner {
    width: 44px; height: 44px;
    border: 3px solid var(--color-border-default);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: ma-spin 0.9s linear infinite;
  }

  .ma-card {
    transition: transform 0.28s cubic-bezier(.34,1.56,.64,1), box-shadow 0.28s ease;
  }
  .ma-card:hover {
    transform: translateY(-4px) scale(1.008);
    box-shadow: 0 20px 40px -12px rgba(0,0,0,0.1);
  }

  /* Zoom link block */
  .ma-zoom-block {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 60%, #e0f2fe 100%);
    border: 1.5px solid #93c5fd;
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 14px;
    position: relative;
    overflow: hidden;
    animation: ma-zoom-glow 3s ease-in-out infinite;
  }
  .ma-zoom-block::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
    background-size: 600px 100%;
    animation: ma-shimmer 3s infinite;
    pointer-events: none;
  }

  .ma-join-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    font-family: var(--font-secondary);
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    color: white;
    border: none;
    cursor: pointer;
    transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s;
    text-decoration: none;
  }
  .ma-join-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px -4px rgba(37,99,235,0.45);
  }
  .ma-join-btn:active { transform: scale(0.96); }

  .ma-copy-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    font-family: var(--font-secondary);
    background: white;
    color: #2563eb;
    border: 1.5px solid #93c5fd;
    cursor: pointer;
    transition: transform 0.18s, background 0.18s;
  }
  .ma-copy-btn:hover {
    background: #eff6ff;
    transform: translateY(-1px);
  }
  .ma-copy-btn:active { transform: scale(0.96); }

  /* Status badge */
  .ma-status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.3px;
    font-family: var(--font-secondary);
    border: 1.5px solid;
  }

  /* Live dot */
  .ma-live-dot {
    position: relative;
    display: inline-block;
    width: 8px; height: 8px;
  }
  .ma-live-dot span {
    display: block;
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #22c55e;
  }

  /* Cancel button */
  .ma-cancel-btn {
    width: 100%;
    margin-top: 12px;
    padding: 10px 16px;
    border-radius: 14px;
    font-size: 13px;
    font-weight: 600;
    font-family: var(--font-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 1.5px solid #fecdd3;
    background: #fff1f2;
    color: #e11d48;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s, transform 0.15s;
  }
  .ma-cancel-btn:hover:not(:disabled) {
    background: #ffe4e6;
    border-color: #fda4af;
    transform: translateY(-1px);
  }
  .ma-cancel-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--color-bg-surface-alt);
    border-color: var(--color-border-default);
    color: var(--color-text-muted);
  }

  /* Empty state */
  .ma-empty {
    text-align: center;
    padding: 60px 20px;
    border-radius: 24px;
    border: 2px dashed var(--color-border-default);
    background: var(--color-bg-surface);
    max-width: 420px;
    margin: 0 auto;
  }
`;

/* ─── Helpers ───────────────────────────────────────────────── */
const fmtDate = (d) =>
  new Date(d).toLocaleDateString(undefined, {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
  });

const fmtDateTime = (v) =>
  new Date(v).toLocaleString(undefined, {
    weekday: "short", day: "2-digit", month: "short",
    year: "numeric", hour: "2-digit", minute: "2-digit",
  });

const canCancel = (date, time) =>
  new Date() < new Date(`${date}T${time}`);

/* ─── Status config ─────────────────────────────────────────── */
const STATUS_CONFIG = {
  CONFIRMED: { color: "#16a34a", bg: "#f0fdf4", border: "#86efac", icon: <CheckCircle size={13} /> },
  PENDING:   { color: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: <AlertCircle  size={13} /> },
  CANCELLED: { color: "#dc2626", bg: "#fff1f2", border: "#fecdd3", icon: <XCircle      size={13} /> },
};

/* ─── Status Badge ──────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return (
    <span
      className="ma-status"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      {cfg.icon} {status}
    </span>
  );
};

/* ─── Zoom Meeting Block ─────────────────────────────────────── */
const ZoomBlock = ({ link }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    toast.success("Zoom meeting link copied!", {
      icon: "📋",
      style: { fontFamily: "var(--font-secondary)" },
    });
  };

  return (
    <div className="ma-zoom-block">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm"
            style={{ background: "#2563eb" }}>
            <Video size={14} color="white" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block"
              style={{ color: "#1d4ed8", fontFamily: "var(--font-secondary)" }}>
              Zoom Video Consultation
            </span>
          </div>
        </div>
        <div className="ma-live-dot"><span /></div>
      </div>

      {/* Link preview */}
      <div className="px-3 py-2 rounded-xl mb-3 text-xs font-mono break-all"
        style={{ background: "rgba(255,255,255,0.85)", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
        {link}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <a href={link} target="_blank" rel="noopener noreferrer" className="ma-join-btn">
          <ExternalLink size={13} /> Join Consultation
        </a>
        <button onClick={handleCopy} className="ma-copy-btn">
          <Copy size={13} /> Copy Link
        </button>
      </div>
    </div>
  );
};

/* ─── No Meeting Placeholder ────────────────────────────────── */
const NoMeetingPlaceholder = () => (
  <div className="rounded-2xl p-4 mb-4 flex items-center gap-3"
    style={{
      background: "var(--color-bg-surface-alt)",
      border: "1.5px dashed var(--color-border-default)",
    }}>
    <WifiOff size={18} style={{ color: "var(--color-text-subtle)" }} />
    <div>
      <p className="text-sm font-semibold" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-secondary)" }}>
        Virtual Consultation Link Generating
      </p>
      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-subtle)", fontFamily: "var(--font-secondary)" }}>
        Your Zoom link will appear here before your scheduled consultation.
      </p>
    </div>
  </div>
);

/* ─── Appointment Card ──────────────────────────────────────── */
const AppointmentCard = ({ a, onCancel, onFeedback, idx }) => {
  const hasGivenFeedback = a.feedbacks?.some(fb => fb.role === "PATIENT");
  const isConfirmed = a.status === "CONFIRMED";
  const ablToCancel = canCancel(a.slot.date, a.slot.start_time);

  return (
    <motion.div
      key={a.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05, type: "spring", stiffness: 160, damping: 18 }}
      className="ma-card rounded-3xl overflow-hidden shadow-sm"
      style={{
        background: "var(--color-bg-surface)",
        border: "1.5px solid var(--color-border-default)",
      }}
    >
      {/* Top accent bar */}
      <div style={{
        height: 4,
        background: "linear-gradient(90deg, #3b82f6, #06b6d4, #8b5cf6)",
      }} />

      <div className="p-6">
        {/* ── Nutritionist + Status ── */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-md"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                color: "white",
                fontFamily: "var(--font-primary)",
              }}>
              {(a.nutritionist_name || "N").charAt(0)}
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5"
                style={{ color: "var(--color-text-subtle)", fontFamily: "var(--font-secondary)" }}>
                Nutritionist
              </p>
              <p className="font-bold text-base"
                style={{ color: "var(--color-text-strong)", fontFamily: "var(--font-primary)" }}>
                {a.nutritionist_name}
              </p>
            </div>
          </div>
          <StatusBadge status={a.status} />
        </div>

        {/* ── Slot Time ── */}
        <div className="rounded-2xl p-4 mb-4"
          style={{
            background: "var(--color-bg-surface-alt)",
            border: "1.5px solid var(--color-border-default)",
          }}>
          <div className="flex items-center gap-2.5 mb-2">
            <Clock size={15} style={{ color: "var(--color-primary)" }} />
            <p className="font-bold text-base"
              style={{ color: "var(--color-text-strong)", fontFamily: "var(--font-primary)" }}>
              {a.slot.start_time} – {a.slot.end_time}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Calendar size={14} style={{ color: "var(--color-text-muted)" }} />
            <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-secondary)" }}>
              {fmtDate(a.slot.date)}
            </p>
          </div>
        </div>

        {/* ── Type + Booked On ── */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl p-3"
            style={{
              background: "var(--color-bg-surface-alt)",
              border: "1.5px solid var(--color-border-default)",
            }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
              style={{ color: "var(--color-text-subtle)", fontFamily: "var(--font-secondary)" }}>
              Consultation Mode
            </p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200">
              <Video size={12} className="text-blue-600" />
              Virtual (Zoom)
            </span>
          </div>

          <div className="rounded-xl p-3"
            style={{
              background: "var(--color-bg-surface-alt)",
              border: "1.5px solid var(--color-border-default)",
            }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
              style={{ color: "var(--color-text-subtle)", fontFamily: "var(--font-secondary)" }}>
              Booked On
            </p>
            <p className="text-xs font-semibold"
              style={{ color: "var(--color-text-strong)", fontFamily: "var(--font-secondary)" }}>
              {fmtDateTime(a.created_at)}
            </p>
          </div>
        </div>

        {/* ── ZOOM MEETING LINK ── */}
        {a.meeting_link ? (
          <ZoomBlock link={a.meeting_link} />
        ) : (
          <NoMeetingPlaceholder />
        )}

        {/* ── FEEDBACK DISPLAY ── */}
        {a.feedbacks?.length > 0 && (
          <div className="mt-4 rounded-2xl p-4"
            style={{
              background: "var(--color-bg-surface-alt)",
              border: "1px solid var(--color-border-default)"
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2"
              style={{ color: "var(--color-text-subtle)" }}>
              Nutritionist Feedback & Notes
            </p>

            {a.feedbacks.map((fb, i) => (
              <div key={i} className="mb-2.5 last:mb-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold" style={{ color: "var(--color-text-strong)" }}>
                    {fb.user_name}
                  </p>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s}
                        style={{
                          color: s <= fb.rating ? "#facc15" : "#d1d5db",
                          fontSize: 13
                        }}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                {fb.comment && (
                  <p className="text-xs mt-1 leading-relaxed"
                    style={{ color: "var(--color-text-muted)" }}>
                    {fb.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── WRITE FEEDBACK BUTTON ── */}
        {isConfirmed && !hasGivenFeedback && (
          <button
            onClick={() => onFeedback(a.id)}
            className="w-full mt-3 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
            style={{
              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              color: "white"
            }}
          >
            <MessageSquarePlus size={14} /> Leave Consultation Feedback
          </button>
        )}

        {/* ── Cancel ── */}
        {isConfirmed && (
          <button
            disabled={!ablToCancel}
            onClick={() => onCancel(a.id)}
            className="ma-cancel-btn"
          >
            <XCircle size={15} />
            {ablToCancel ? "Cancel Appointment" : "Cannot Cancel (Past Appointment)"}
          </button>
        )}
      </div>
    </motion.div>
  );
};

/* ─── Stats Bar ─────────────────────────────────────────────── */
const StatsBar = ({ appointments }) => {
  const total     = appointments.length;
  const confirmed = appointments.filter((a) => a.status === "CONFIRMED").length;
  const virtual   = appointments.length; // 100% Virtual

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {[
        { label: "Total Booked",  val: total,     emoji: "📅", color: "var(--color-info-text)",    bg: "var(--color-info-bg-subtle)"    },
        { label: "Confirmed",     val: confirmed, emoji: "✅", color: "var(--color-success-text)", bg: "var(--color-success-bg-subtle)" },
        { label: "Virtual Zoom",  val: virtual,   emoji: "🎥", color: "#2563eb",                   bg: "#dbeafe"                        },
      ].map(({ label, val, emoji, color, bg }) => (
        <div key={label} className="rounded-2xl p-4 flex items-center gap-3 shadow-xs"
          style={{ background: bg, border: "1.5px solid var(--color-border-default)" }}>
          <span className="text-2xl">{emoji}</span>
          <div>
            <p className="ma-heading text-2xl font-black" style={{ color, lineHeight: 1 }}>{val}</p>
            <p className="text-xs font-medium mt-0.5"
              style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-secondary)" }}>
              {label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
const MyAppointments = ({ refresh } = {}) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const openFeedbackModal = (id) => {
    setSelectedAppointment(id);
    setRating(5);
    setComment("");
  };

  const submitFeedback = async () => {
    try {
      await axiosInstance.post(
        `/appointments/${selectedAppointment}/feedback/`,
        { rating, comment }
      );

      toast.success("Thank you for your feedback! ✨");
      setSelectedAppointment(null);
      fetchAppointments();
    } catch {
      toast.error("Failed to submit feedback");
    }
  };

  /* Inject styles */
  useEffect(() => {
    if (!document.getElementById("ma-styles")) {
      const el = document.createElement("style");
      el.id = "ma-styles";
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  const fetchAppointments = async () => {
    try {
      const res  = await axiosInstance.get("/appointments/my/");
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
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
  }, [refresh]);

  /* Re-fetch when tab regains focus */
  useEffect(() => {
    window.addEventListener("focus", fetchAppointments);
    return () => window.removeEventListener("focus", fetchAppointments);
  }, []);

  const cancelAppointment = async (id) => {
    if (!confirm("Are you sure you want to cancel this virtual appointment?")) return;
    try {
      await axiosInstance.post(`/appointments/appointments/${id}/cancel/`);
      toast.success("Appointment cancelled");
      fetchAppointments();
    } catch {
      toast.error("Failed to cancel appointment");
    }
  };

  /* ── Render ── */
  return (
    <div className="min-h-screen ma-root pb-16" style={{ background: "var(--color-bg-app)" }}>
      <Toaster position="top-right"
        toastOptions={{ style: { fontFamily: "var(--font-secondary)", borderRadius: 14 } }} />

      <div className="max-w-7xl mx-auto px-4 pt-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 16 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
            style={{ background: "linear-gradient(135deg, #2563eb, #38bdf8)" }}>
            <CalendarDays size={26} color="white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                100% Virtual Consultations
              </span>
            </div>
            <h1 className="ma-heading text-2xl sm:text-3xl font-bold" style={{ color: "var(--color-text-strong)" }}>
              My Virtual Appointments
            </h1>
          </div>
        </motion.div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="ma-spinner" />
            <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-secondary)" }}>
              Loading your appointments…
            </p>
          </div>

        /* Empty */
        ) : appointments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 160, damping: 20 }}
            className="ma-empty"
          >
            <Video size={48} className="mx-auto mb-4 text-blue-300" />
            <h3 className="ma-subheading text-lg mb-1"
              style={{ color: "var(--color-text-strong)" }}>
              No Virtual Appointments Yet
            </h3>
            <p className="text-sm" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-secondary)" }}>
              Schedule a 1-on-1 virtual video consultation with our certified nutritionists.
            </p>
          </motion.div>

        /* List */
        ) : (
          <>
            <StatsBar appointments={appointments} />
            <div className="grid md:grid-cols-2 gap-6">
              {appointments.map((a, i) => (
                <AppointmentCard
                  key={a.id}
                  a={a}
                  idx={i}
                  onCancel={cancelAppointment}
                  onFeedback={openFeedbackModal}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Feedback Modal */}
      {selectedAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)"
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-3xl p-6 shadow-2xl"
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border-default)"
            }}
          >
            <h3 className="text-lg font-bold mb-1" style={{ color: "var(--color-text-strong)" }}>
              Consultation Feedback
            </h3>
            <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
              How was your virtual consultation session?
            </p>

            {/* ⭐ STAR RATING */}
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setRating(s)}
                  className="transition-transform hover:scale-125 focus:outline-none"
                  style={{
                    fontSize: 28,
                    cursor: "pointer",
                    color: s <= rating ? "#facc15" : "#e5e7eb"
                  }}
                >
                  ★
                </button>
              ))}
            </div>

            {/* COMMENT BOX */}
            <textarea
              placeholder="Share your experience, diet takeaways, or recommendations..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 rounded-xl text-sm mb-4 outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                border: "1.5px solid var(--color-border-default)",
                background: "var(--color-bg-surface-alt)",
                color: "var(--color-text-strong)",
                minHeight: 100
              }}
            />

            {/* ACTION BUTTONS */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-xs transition-colors"
                style={{
                  background: "var(--color-bg-surface-alt)",
                  color: "var(--color-text-muted)",
                  border: "1px solid var(--color-border-default)"
                }}
              >
                Cancel
              </button>

              <button
                onClick={submitFeedback}
                className="flex-1 py-2.5 rounded-xl font-semibold text-xs text-white transition-opacity hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                }}
              >
                Submit Feedback
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MyAppointments;
