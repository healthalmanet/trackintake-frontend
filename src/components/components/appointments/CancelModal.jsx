import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, AlertTriangle, Calendar, Clock, XCircle,
  RefreshCw, Info, DollarSign, CheckCircle2
} from "lucide-react";
import toast from "react-hot-toast";
import { cancelAppointment } from "../../../api/appointmentApi";

const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const CancelModal = ({
  isOpen,
  onClose,
  appointment,
  userRole = "patient", // "patient" | "nutritionist"
  onCancelled,
}) => {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !appointment) return null;

  const isNutritionist = userRole === "nutritionist";
  const slotDate = appointment.slot_date || appointment.slot?.date;
  const slotStartTime = appointment.slot_start_time || appointment.slot?.start_time;
  const slotEndTime = appointment.slot_end_time || appointment.slot?.end_time;
  const price = appointment.fee_amount || appointment.price || 0;

  // Check if within 24 hours
  const isWithin24Hours = (() => {
    if (!slotDate || !slotStartTime) return false;
    const apptStart = new Date(`${slotDate}T${slotStartTime}`);
    const now = new Date();
    const diffMs = apptStart.getTime() - now.getTime();
    return diffMs < 24 * 60 * 60 * 1000;
  })();

  const handleConfirmCancel = async () => {
    setSubmitting(true);
    try {
      const res = await cancelAppointment(appointment.id, reason);
      toast.success(res.data?.detail || "Appointment cancelled successfully.");
      if (res.data?.policy_notice) {
        toast(res.data.policy_notice, { icon: "ℹ️", duration: 5000 });
      }
      onCancelled?.(res.data?.appointment);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to cancel appointment. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md rounded-3xl bg-[var(--color-bg-surface)] border-2 border-rose-200 dark:border-rose-900 shadow-2xl overflow-hidden font-[var(--font-secondary)]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-rose-50/70 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/40 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                <XCircle size={24} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-rose-900 dark:text-rose-200 font-[var(--font-primary)]">
                  Cancel Consultation
                </h2>
                <p className="text-xs text-rose-700/80 dark:text-rose-400 mt-0.5">
                  Confirm cancellation and review refund terms
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-rose-700/60 hover:text-rose-900 hover:bg-rose-100/50 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-4 text-xs">
            {/* Slot Info Card */}
            <div className="p-3.5 rounded-2xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar size={15} className="text-[var(--color-primary)]" />
                <span className="font-bold text-[var(--color-text-strong)]">
                  {fmtDate(slotDate)}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[var(--color-text-muted)] font-semibold">
                <Clock size={13} />
                <span>{slotStartTime} – {slotEndTime}</span>
              </div>
            </div>

            {/* Comprehensive Refund & Cancellation Policy Notice */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300">
                <Info size={15} className="text-amber-600 shrink-0" />
                <span>Cancellation & Refund Policy</span>
              </div>
              <div className="space-y-1 text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
                <p>
                  • <strong>Nutritionist cancellation:</strong> Full refund is eligible for the patient (Status: <em>Pending Refund</em> for Admin processing).
                </p>
                <p>
                  • <strong>Patient cancellation within 24 hours:</strong> No refund applies ({isWithin24Hours ? "Applicable to this session" : "Not applicable"}).
                </p>
                <p>
                  • <strong>Patient cancellation &gt; 24 hours in advance:</strong> Eligible for refund (Status: <em>Pending Refund</em> for Admin processing).
                </p>
                <p className="pt-1 text-emerald-800 dark:text-emerald-300 font-semibold">
                  ✓ The appointment time slot will be reopened immediately and made available again for others to book.
                </p>
              </div>
            </div>

            {/* Reason Input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Reason for cancellation (optional):
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please tell us why you need to cancel this appointment..."
                className="w-full p-3 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] focus:border-rose-400 focus:outline-none text-xs text-[var(--color-text-strong)] min-h-[75px]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border border-[var(--color-border-default)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface)] transition-colors cursor-pointer"
            >
              Keep Appointment
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirmCancel}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <>
                  <XCircle size={14} />
                  <span>Confirm Cancellation</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CancelModal;
