import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "../../../api/axiosInstance";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, User, XCircle, CheckCircle, AlertCircle, CalendarDays, Video, Building2, MapPin, Calendar as CalendarIcon } from "lucide-react";

const MyAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      const res = await axiosInstance.get("/appointments/my/");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];
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
  }, []);

  useEffect(() => {
    const onFocus = () => fetchAppointments();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const cancelAppointment = async (appointmentId) => {
    if (!confirm("Cancel this appointment?")) return;
    try {
      await axiosInstance.post(
        `/appointments/appointments/${appointmentId}/cancel/`
      );
      toast.success("Appointment cancelled");
      fetchAppointments();
    } catch {
      toast.error("Failed to cancel appointment");
    }
  };

  const canCancelAppointment = (date, startTime) => {
    const slotDateTime = new Date(`${date}T${startTime}`);
    return new Date() < slotDateTime;
  };

  const formatSlotDate = (date) =>
    new Date(date).toLocaleDateString(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatDateTime = (value) =>
    new Date(value).toLocaleString(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusColor = (status) => {
    switch(status) {
      case "CONFIRMED":
        return "text-green-600 bg-green-50 border-green-200";
      case "PENDING":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "CANCELLED":
        return "text-red-600 bg-red-50 border-red-200";
      case "COMPLETED":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "CONFIRMED":
        return <CheckCircle size={16} />;
      case "PENDING":
        return <AlertCircle size={16} />;
      case "CANCELLED":
        return <XCircle size={16} />;
      case "COMPLETED":
        return <CalendarCheck size={16} />;
      default:
        return <Calendar size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)] p-6">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--color-bg-surface)',
            color: 'var(--color-text-strong)',
            border: '2px solid var(--color-border-default)',
          },
        }}
      />
      
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="p-4 bg-[var(--color-primary-bg-subtle)] rounded-2xl">
            <CalendarDays className="w-8 h-8 text-[var(--color-primary)]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text-strong)]">My Appointments</h1>
            <p className="text-[var(--color-text-muted)] mt-1">Manage your scheduled consultations</p>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full"
            />
          </div>
        ) : appointments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="bg-[var(--color-bg-surface-alt)] rounded-2xl p-12 max-w-md mx-auto border-2 border-[var(--color-border-default)]">
              <Calendar className="w-16 h-16 text-[var(--color-text-muted)] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[var(--color-text-strong)] mb-2">No Appointments Found</h3>
              <p className="text-[var(--color-text-muted)]">You haven't scheduled any appointments yet.</p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            className="grid md:grid-cols-2 gap-6"
          >
            {appointments.map((a) => (
              <motion.div
                key={a.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ y: -4 }}
                className="bg-[var(--color-bg-surface)] rounded-2xl border-2 border-[var(--color-border-default)] p-6 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {/* Header with Nutritionist */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-[var(--color-primary-bg-subtle)] rounded-xl">
                      <User className="w-5 h-5 text-[var(--color-primary)]" />
                    </div>
                    <div>
                      <p className="text-sm text-[var(--color-text-muted)]">Nutritionist</p>
                      <p className="font-semibold text-[var(--color-text-strong)]">{a.nutritionist_name}</p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(a.status)} flex items-center gap-1`}>
                    {getStatusIcon(a.status)}
                    {a.status}
                  </div>
                </div>

                {/* Slot Time */}
                <div className="bg-[var(--color-bg-surface-alt)] rounded-xl p-4 mb-4 border-2 border-[var(--color-border-default)]">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-4 h-4 text-[var(--color-primary)]" />
                    <p className="font-semibold text-[var(--color-text-strong)]">
                      {a.slot.start_time} – {a.slot.end_time}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
                    <p className="text-sm text-[var(--color-text-default)]">
                      {formatSlotDate(a.slot.date)}
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Appointment Type */}
                  <div className="bg-[var(--color-bg-surface-alt)] rounded-xl p-3 border-2 border-[var(--color-border-default)]">
                    <div className="flex items-center gap-2 mb-1">
                      {a.appointment_type === "IN_PERSON" ? (
                        <Building2 size={14} className="text-[var(--color-primary)]" />
                      ) : (
                        <Video size={14} className="text-[var(--color-primary)]" />
                      )}
                      <p className="text-xs text-[var(--color-text-muted)]">Type</p>
                    </div>
                    <p className="text-sm font-medium text-[var(--color-text-strong)]">
                      {a.appointment_type === "IN_PERSON" ? "In Person" : "Virtual"}
                    </p>
                  </div>

                  {/* Booking Date */}
                  <div className="bg-[var(--color-bg-surface-alt)] rounded-xl p-3 border-2 border-[var(--color-border-default)]">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarIcon size={14} className="text-[var(--color-primary)]" />
                      <p className="text-xs text-[var(--color-text-muted)]">Booked On</p>
                    </div>
                    <p className="text-xs font-medium text-[var(--color-text-strong)]">
                      {formatDateTime(a.created_at)}
                    </p>
                  </div>
                </div>

                {/* Cancel Button */}
                {a.status === "CONFIRMED" && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    disabled={
                      !canCancelAppointment(
                        a.slot.date,
                        a.slot.start_time
                      )
                    }
                    onClick={() => cancelAppointment(a.id)}
                    className={`w-full mt-2 px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
                      canCancelAppointment(
                        a.slot.date,
                        a.slot.start_time
                      )
                        ? "bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100 hover:border-red-300 active:scale-95"
                        : "bg-gray-50 text-gray-400 border-2 border-gray-200 cursor-not-allowed"
                    }`}
                    whileHover={canCancelAppointment(a.slot.date, a.slot.start_time) ? { scale: 1.02 } : {}}
                    whileTap={canCancelAppointment(a.slot.date, a.slot.start_time) ? { scale: 0.98 } : {}}
                  >
                    <XCircle size={18} />
                    <span>Cancel Appointment</span>
                  </motion.button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Add this missing icon component at the bottom
const CalendarCheck = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
    <path d="m9 16 2 2 4-4"></path>
  </svg>
);

export default MyAppointments;

















