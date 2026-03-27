// import React, { useEffect, useState } from "react";
// import toast, { Toaster } from "react-hot-toast";
// import axiosInstance from "../../../api/axiosInstance";
// import { motion, AnimatePresence } from "framer-motion";
// import { Calendar, Clock, User, XCircle, CheckCircle, AlertCircle, CalendarDays, Video, Building2, MapPin, Calendar as CalendarIcon } from "lucide-react";

// const MyAppointments = () => {
//   const [appointments, setAppointments] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fetchAppointments = async () => {
//     try {
//       const res = await axiosInstance.get("/appointments/my/");
//       const data = Array.isArray(res.data)
//         ? res.data
//         : res.data.results || [];
//       setAppointments(data);
//     } catch {
//       toast.error("Failed to load appointments");
//       setAppointments([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchAppointments();
//   }, []);

//   useEffect(() => {
//     const onFocus = () => fetchAppointments();
//     window.addEventListener("focus", onFocus);
//     return () => window.removeEventListener("focus", onFocus);
//   }, []);

//   const cancelAppointment = async (appointmentId) => {
//     if (!confirm("Cancel this appointment?")) return;
//     try {
//       await axiosInstance.post(
//         `/appointments/appointments/${appointmentId}/cancel/`
//       );
//       toast.success("Appointment cancelled");
//       fetchAppointments();
//     } catch {
//       toast.error("Failed to cancel appointment");
//     }
//   };

//   const canCancelAppointment = (date, startTime) => {
//     const slotDateTime = new Date(`${date}T${startTime}`);
//     return new Date() < slotDateTime;
//   };

//   const formatSlotDate = (date) =>
//     new Date(date).toLocaleDateString(undefined, {
//       weekday: "short",
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//     });

//   const formatDateTime = (value) =>
//     new Date(value).toLocaleString(undefined, {
//       weekday: "short",
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });

//   const getStatusColor = (status) => {
//     switch(status) {
//       case "CONFIRMED":
//         return "text-green-600 bg-green-50 border-green-200";
//       case "PENDING":
//         return "text-yellow-600 bg-yellow-50 border-yellow-200";
//       case "CANCELLED":
//         return "text-red-600 bg-red-50 border-red-200";
//       case "COMPLETED":
//         return "text-blue-600 bg-blue-50 border-blue-200";
//       default:
//         return "text-gray-600 bg-gray-50 border-gray-200";
//     }
//   };

//   const getStatusIcon = (status) => {
//     switch(status) {
//       case "CONFIRMED":
//         return <CheckCircle size={16} />;
//       case "PENDING":
//         return <AlertCircle size={16} />;
//       case "CANCELLED":
//         return <XCircle size={16} />;
//       case "COMPLETED":
//         return <CalendarCheck size={16} />;
//       default:
//         return <Calendar size={16} />;
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[var(--color-bg-app)] p-6">
//       <Toaster 
//         position="top-right"
//         toastOptions={{
//           style: {
//             background: 'var(--color-bg-surface)',
//             color: 'var(--color-text-strong)',
//             border: '2px solid var(--color-border-default)',
//           },
//         }}
//       />
      
//       {/* Header */}
//       <motion.div 
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="max-w-7xl mx-auto mb-8"
//       >
//         <div className="flex items-center gap-4">
//           <div className="p-4 bg-[var(--color-primary-bg-subtle)] rounded-2xl">
//             <CalendarDays className="w-8 h-8 text-[var(--color-primary)]" />
//           </div>
//           <div>
//             <h1 className="text-3xl font-bold text-[var(--color-text-strong)]">My Appointments</h1>
//             <p className="text-[var(--color-text-muted)] mt-1">Manage your scheduled consultations</p>
//           </div>
//         </div>
//       </motion.div>

//       {/* Content */}
//       <div className="max-w-7xl mx-auto">
//         {loading ? (
//           <div className="flex justify-center items-center py-20">
//             <motion.div
//               animate={{ rotate: 360 }}
//               transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
//               className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full"
//             />
//           </div>
//         ) : appointments.length === 0 ? (
//           <motion.div
//             initial={{ opacity: 0, scale: 0.9 }}
//             animate={{ opacity: 1, scale: 1 }}
//             className="text-center py-20"
//           >
//             <div className="bg-[var(--color-bg-surface-alt)] rounded-2xl p-12 max-w-md mx-auto border-2 border-[var(--color-border-default)]">
//               <Calendar className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
//               <h3 className="text-xl font-semibold text-[var(--color-text-strong)] mb-2">No Appointments Found</h3>
//               <p className="text-[var(--color-text-muted)]">You haven't scheduled any appointments yet.</p>
//             </div>
//           </motion.div>
//         ) : (
//           <motion.div 
//             initial="hidden"
//             animate="visible"
//             variants={{
//               visible: {
//                 transition: {
//                   staggerChildren: 0.1
//                 }
//               }
//             }}
//             className="grid md:grid-cols-2 gap-6"
//           >
//             {appointments.map((a) => (
//               <motion.div
//                 key={a.id}
//                 variants={{
//                   hidden: { opacity: 0, y: 20 },
//                   visible: { opacity: 1, y: 0 }
//                 }}
//                 whileHover={{ y: -4 }}
//                 className="bg-[var(--color-bg-surface)] rounded-2xl border-2 border-[var(--color-border-default)] p-6 shadow-lg hover:shadow-xl transition-all duration-300"
//               >
//                 {/* Header with Nutritionist */}
//                 <div className="flex items-start justify-between mb-4">
//                   <div className="flex items-center gap-3">
//                     <div className="p-3 bg-[var(--color-primary-bg-subtle)] rounded-xl">
//                       <User className="w-5 h-5 text-[var(--color-primary)]" />
//                     </div>
//                     <div>
//                       <p className="text-sm text-[var(--color-text-muted)]">Nutritionist</p>
//                       <p className="font-semibold text-[var(--color-text-strong)]">{a.nutritionist_name}</p>
//                     </div>
//                   </div>
                  
//                   {/* Status Badge */}
//                   <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(a.status)} flex items-center gap-1`}>
//                     {getStatusIcon(a.status)}
//                     {a.status}
//                   </div>
//                 </div>

//                 {/* Slot Time */}
//                 <div className="bg-[var(--color-bg-surface-alt)] rounded-xl p-4 mb-4 border-2 border-[var(--color-border-default)]">
//                   <div className="flex items-center gap-3 mb-2">
//                     <Clock className="w-4 h-4 text-[var(--color-primary)]" />
//                     <p className="font-semibold text-[var(--color-text-strong)]">
//                       {a.slot.start_time} – {a.slot.end_time}
//                     </p>
//                   </div>
//                   <div className="flex items-center gap-3">
//                     <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
//                     <p className="text-sm text-[var(--color-text-default)]">
//                       {formatSlotDate(a.slot.date)}
//                     </p>
//                   </div>
//                 </div>

//                 {/* Details Grid */}
//                 <div className="grid grid-cols-2 gap-3 mb-4">
//                   {/* Appointment Type */}
//                   <div className="bg-[var(--color-bg-surface-alt)] rounded-xl p-3 border-2 border-[var(--color-border-default)]">
//                     <div className="flex items-center gap-2 mb-1">
//                       {a.appointment_type === "IN_PERSON" ? (
//                         <Building2 size={14} className="text-[var(--color-primary)]" />
//                       ) : (
//                         <Video size={14} className="text-[var(--color-primary)]" />
//                       )}
//                       <p className="text-xs text-[var(--color-text-muted)]">Type</p>
//                     </div>
//                     <p className="text-sm font-medium text-[var(--color-text-strong)]">
//                       {a.appointment_type === "IN_PERSON" ? "In Person" : "Virtual"}
//                     </p>
//                   </div>

//                   {/* Booking Date */}
//                   <div className="bg-[var(--color-bg-surface-alt)] rounded-xl p-3 border-2 border-[var(--color-border-default)]">
//                     <div className="flex items-center gap-2 mb-1">
//                       <CalendarIcon size={14} className="text-[var(--color-primary)]" />
//                       <p className="text-xs text-[var(--color-text-muted)]">Booked On</p>
//                     </div>
//                     <p className="text-xs font-medium text-[var(--color-text-strong)]">
//                       {formatDateTime(a.created_at)}
//                     </p>
//                   </div>
//                 </div>

//                 {/* Cancel Button */}
//                 {a.status === "CONFIRMED" && (
//                   <motion.button
//                     initial={{ opacity: 0 }}
//                     animate={{ opacity: 1 }}
//                     disabled={
//                       !canCancelAppointment(
//                         a.slot.date,
//                         a.slot.start_time
//                       )
//                     }
//                     onClick={() => cancelAppointment(a.id)}
//                     className={`w-full mt-2 px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
//                       canCancelAppointment(
//                         a.slot.date,
//                         a.slot.start_time
//                       )
//                         ? "bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100 hover:border-red-300 active:scale-95"
//                         : "bg-gray-50 text-gray-400 border-2 border-gray-200 cursor-not-allowed"
//                     }`}
//                     whileHover={canCancelAppointment(a.slot.date, a.slot.start_time) ? { scale: 1.02 } : {}}
//                     whileTap={canCancelAppointment(a.slot.date, a.slot.start_time) ? { scale: 0.98 } : {}}
//                   >
//                     <XCircle size={18} />
//                     <span>Cancel Appointment</span>
//                   </motion.button>
//                 )}
//               </motion.div>
//             ))}
//           </motion.div>
//         )}
//       </div>
//     </div>
//   );
// };

// // Add this missing icon component at the bottom
// const CalendarCheck = (props) => (
//   <svg
//     {...props}
//     xmlns="http://www.w3.org/2000/svg"
//     width="24"
//     height="24"
//     viewBox="0 0 24 24"
//     fill="none"
//     stroke="currentColor"
//     strokeWidth="2"
//     strokeLinecap="round"
//     strokeLinejoin="round"
//   >
//     <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
//     <line x1="16" y1="2" x2="16" y2="6"></line>
//     <line x1="8" y1="2" x2="8" y2="6"></line>
//     <line x1="3" y1="10" x2="21" y2="10"></line>
//     <path d="m9 16 2 2 4-4"></path>
//   </svg>
// );

// export default MyAppointments;









import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "../../../api/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, User, XCircle, CheckCircle, AlertCircle,
  CalendarDays, Video, Building2, Copy, ExternalLink,
  Calendar as CalendarIcon, Wifi, WifiOff,
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
    transform: translateY(-5px) scale(1.012);
    box-shadow: 0 24px 48px -12px rgba(0,0,0,0.12);
  }

  /* Zoom link block */
  .ma-zoom-block {
    background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 60%, #e0f2fe 100%);
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
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    border: none;
    cursor: pointer;
    transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s;
    text-decoration: none;
  }
  .ma-join-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px -4px rgba(59,130,246,0.45);
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
    color: #3b82f6;
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
  .ma-live-dot::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: #22c55e;
    animation: ma-pulse-ring 1.6s ease-out infinite;
  }

  /* Cancel btn */
  .ma-cancel-btn {
    width: 100%;
    padding: 11px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-family: var(--font-secondary);
    background: #fff1f2;
    color: #e11d48;
    border: 1.5px solid #fecdd3;
  }
  .ma-cancel-btn:hover:not(:disabled) {
    background: #ffe4e6;
    border-color: #fda4af;
    transform: translateY(-1px);
  }
  .ma-cancel-btn:disabled {
    background: var(--color-bg-surface-alt);
    color: var(--color-text-subtle);
    border-color: var(--color-border-default);
    cursor: not-allowed;
  }

  /* Type pill */
  .ma-type-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 600;
    font-family: var(--font-secondary);
  }

  /* Empty state */
  .ma-empty {
    text-align: center;
    padding: 60px 20px;
    border-radius: 24px;
    border: 2px dashed var(--color-border-default);
    background: var(--color-bg-surface);
    max-width: 400px;
    margin: 0 auto;
  }

  /* Scrollbar */
  .ma-scroll::-webkit-scrollbar { width: 4px; }
  .ma-scroll::-webkit-scrollbar-thumb {
    background: var(--color-primary);
    border-radius: 99px;
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
    <span className="ma-status"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
      {cfg.icon} {status}
    </span>
  );
};

/* ─── Zoom Meeting Block ─────────────────────────────────────── */
const ZoomBlock = ({ link }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    toast.success("Meeting link copied!", {
      icon: "📋",
      style: { fontFamily: "var(--font-secondary)" },
    });
  };

  return (
    <div className="ma-zoom-block">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "#2563eb" }}>
            <Video size={13} color="white" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "#1d4ed8", fontFamily: "var(--font-secondary)" }}>
            Virtual Meeting
          </span>
        </div>
        <div className="ma-live-dot"><span /></div>
      </div>

      {/* Link preview */}
      <div className="px-3 py-2 rounded-xl mb-3 text-xs font-mono break-all"
        style={{ background: "rgba(255,255,255,0.7)", color: "#3b82f6" }}>
        {link}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <a href={link} target="_blank" rel="noopener noreferrer" className="ma-join-btn">
          <ExternalLink size={12} /> Join Meeting
        </a>
        <button onClick={handleCopy} className="ma-copy-btn">
          <Copy size={12} /> Copy Link
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
        No meeting link yet
      </p>
      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-subtle)", fontFamily: "var(--font-secondary)" }}>
        Link will appear here once generated
      </p>
    </div>
  </div>
);

/* ─── Appointment Card ──────────────────────────────────────── */
const AppointmentCard = ({ a, onCancel, idx }) => {
  const isVirtual   = a.appointment_type === "VIRTUAL";
  const isConfirmed = a.status === "CONFIRMED";
  const ablToCancel = canCancel(a.slot.date, a.slot.start_time);

  return (
    <motion.div
      key={a.id}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07, type: "spring", stiffness: 160, damping: 18 }}
      className="ma-card rounded-3xl overflow-hidden"
      style={{
        background: "var(--color-bg-surface)",
        border: "1.5px solid var(--color-border-default)",
      }}
    >
      {/* Top accent bar */}
      <div style={{
        height: 4,
        background: isVirtual
          ? "linear-gradient(90deg, #3b82f6, #06b6d4, #8b5cf6)"
          : "linear-gradient(90deg, var(--color-primary), #ff9a6c, #fbbf24)",
      }} />

      <div className="p-6">

        {/* ── Nutritionist + Status ── */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-lg shadow-md"
              style={{
                background: isVirtual
                  ? "linear-gradient(135deg, #3b82f6, #06b6d4)"
                  : "linear-gradient(135deg, var(--color-primary), #ff9a6c)",
                color: "white",
                fontFamily: "var(--font-primary)",
              }}>
              {(a.nutritionist_name || "N").charAt(0)}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5"
                style={{ color: "var(--color-text-subtle)", fontFamily: "var(--font-secondary)" }}>
                Nutritionist
              </p>
              <p className="font-semibold text-sm"
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
            <Clock size={14} style={{ color: "var(--color-primary)" }} />
            <p className="font-bold text-base"
              style={{ color: "var(--color-text-strong)", fontFamily: "var(--font-primary)" }}>
              {a.slot.start_time} – {a.slot.end_time}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Calendar size={13} style={{ color: "var(--color-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-secondary)" }}>
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
              Type
            </p>
            <span className="ma-type-pill"
              style={
                isVirtual
                  ? { background: "#dbeafe", color: "#2563eb" }
                  : { background: "var(--color-warning-bg-subtle)", color: "var(--color-warning-text)" }
              }>
              {isVirtual ? <Video size={11} /> : <Building2 size={11} />}
              {isVirtual ? "Virtual" : "In Person"}
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
        {isVirtual && (
          a.meeting_link
            ? <ZoomBlock link={a.meeting_link} />
            : <NoMeetingPlaceholder />
        )}

        {/* ── Cancel ── */}
        {isConfirmed && (
          <button
            disabled={!ablToCancel}
            onClick={() => onCancel(a.id)}
            className="ma-cancel-btn"
          >
            <XCircle size={16} />
            {ablToCancel ? "Cancel Appointment" : "Cannot Cancel (Past)"}
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
  const virtual   = appointments.filter((a) => a.appointment_type === "VIRTUAL").length;

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {[
        { label: "Total",     val: total,     emoji: "📅", color: "var(--color-info-text)",    bg: "var(--color-info-bg-subtle)"    },
        { label: "Confirmed", val: confirmed, emoji: "✅", color: "var(--color-success-text)", bg: "var(--color-success-bg-subtle)" },
        { label: "Virtual",   val: virtual,   emoji: "🎥", color: "#2563eb",                   bg: "#dbeafe"                        },
      ].map(({ label, val, emoji, color, bg }) => (
        <div key={label} className="rounded-2xl p-4 flex items-center gap-3"
          style={{ background: bg, border: "1.5px solid var(--color-border-default)" }}>
          <span className="text-xl">{emoji}</span>
          <div>
            <p className="ma-heading text-3xl" style={{ color, lineHeight: 1 }}>{val}</p>
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
const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);

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

  useEffect(() => { fetchAppointments(); }, []);

  /* Re-fetch when tab regains focus */
  useEffect(() => {
    window.addEventListener("focus", fetchAppointments);
    return () => window.removeEventListener("focus", fetchAppointments);
  }, []);

  const cancelAppointment = async (id) => {
    if (!confirm("Cancel this appointment?")) return;
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
    <div className="min-h-screen ma-root" style={{ background: "var(--color-bg-app)" }}>
      <Toaster position="top-right"
        toastOptions={{ style: { fontFamily: "var(--font-secondary)", borderRadius: 14 } }} />

      <div className="max-w-7xl mx-auto  py-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 16 }}
          className="flex items-center gap-4 mb-10"
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, var(--color-primary), #ff9a6c)" }}>
            <CalendarDays size={24} color="white" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1"
              style={{ color: "var(--color-primary)", fontFamily: "var(--font-secondary)" }}>
              Patient Dashboard
            </p>
            <h1 className="ma-heading text-3xl" style={{ color: "var(--color-text-strong)" }}>
              My Appointments
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
            <Calendar size={48} className="mx-auto mb-4 opacity-20"
              style={{ color: "var(--color-text-muted)" }} />
            <h3 className="ma-subheading text-lg mb-1"
              style={{ color: "var(--color-text-strong)" }}>
              No Appointments Yet
            </h3>
            <p className="text-sm" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-secondary)" }}>
              Book a consultation to get started
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
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ─── CalendarCheck icon (lucide doesn't export it) ─────────── */
const CalendarCheck = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size} height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8"  y1="2" x2="8"  y2="6" />
    <line x1="3"  y1="10" x2="21" y2="10" />
    <path d="m9 16 2 2 4-4" />
  </svg>
);

export default MyAppointments;







