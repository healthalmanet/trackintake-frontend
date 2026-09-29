import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Calendar, Clock, AlertTriangle, CheckCircle2,
  RefreshCw, ChevronRight, Video, Building2, ShieldAlert,
  ArrowRight, Info
} from "lucide-react";
import toast from "react-hot-toast";
import { getAvailableSlots, rescheduleAppointment } from "../../../api/appointmentApi";

const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getTodayStr = () => new Date().toISOString().split("T")[0];

const RescheduleModal = ({
  isOpen,
  onClose,
  appointment,
  userRole = "patient", // "patient" | "nutritionist"
  onRescheduled,
}) => {
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isNutritionist = userRole === "nutritionist";
  const slotDate = appointment?.slot_date || appointment?.slot?.date;
  const slotStartTime = appointment?.slot_start_time || appointment?.slot?.start_time;
  const slotEndTime = appointment?.slot_end_time || appointment?.slot?.end_time;
  const currentSlotId = appointment?.slot?.id;
  const rescheduleCount = appointment?.reschedule_count || 0;
  const remainingReschedules = Math.max(0, 2 - rescheduleCount);

  // Calculate 24-hour cutoff for patient
  const isWithin24Hours = React.useMemo(() => {
    if (!slotDate || !slotStartTime) return false;
    const apptStart = new Date(`${slotDate}T${slotStartTime}`);
    const now = new Date();
    const diffMs = apptStart.getTime() - now.getTime();
    return diffMs < 24 * 60 * 60 * 1000;
  }, [slotDate, slotStartTime]);

  const hasExceededLimit = !isNutritionist && rescheduleCount >= 2;
  const isPatientBlocked = !isNutritionist && (isWithin24Hours || hasExceededLimit);

  // Set default selected date to current slot date or today
  useEffect(() => {
    if (isOpen && appointment) {
      const nextDate = slotDate && slotDate >= getTodayStr() ? slotDate : getTodayStr();
      setSelectedDate(nextDate);
      setSelectedSlotId(null);
    }
  }, [isOpen, appointment]);

  // Fetch available slots when selected date changes
  useEffect(() => {
    if (!isOpen || !appointment) return;
    const nutriId = appointment?.nutritionist?.id || appointment?.slot?.nutritionist;
    if (!nutriId && !appointment?.patient_details) {
      // In appointment list, nutritionist info is present
    }

    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const nutriIdToUse = appointment?.nutritionist?.id || appointment?.nutritionist_id || appointment?.slot?.nutritionist;
        if (!nutriIdToUse) {
          setAvailableSlots([]);
          return;
        }
        const res = await getAvailableSlots(
          nutriIdToUse,
          selectedDate,
          appointment.appointment_type
        );
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        // Filter out slots that are already booked (unless it's the current appointment's slot)
        const openSlots = data.filter((s) => !s.is_booked && s.id !== currentSlotId);
        setAvailableSlots(openSlots);
      } catch (err) {
        console.error("Failed to fetch slots for rescheduling:", err);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [isOpen, appointment, selectedDate]);

  if (!isOpen || !appointment) return null;

  const handleConfirmReschedule = async () => {
    if (!selectedSlotId) {
      toast.error("Please select an available future time slot.");
      return;
    }

    if (isPatientBlocked) {
      if (hasExceededLimit) {
        toast.error("You have already used your 2 allowed reschedules for this session.");
      } else if (isWithin24Hours) {
        toast.error("Rescheduling is only allowed at least 24 hours prior to appointment time.");
      }
      return;
    }

    setSubmitting(true);
    try {
      const res = await rescheduleAppointment(appointment.id, selectedSlotId);
      toast.success(res.data?.detail || "Appointment rescheduled successfully! 🗓️");
      onRescheduled?.(res.data?.appointment);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to reschedule appointment. Please try again.";
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
          className="relative w-full max-w-lg rounded-3xl bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] shadow-2xl overflow-hidden font-[var(--font-secondary)]"
          style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <RefreshCw size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
                  Reschedule Appointment
                </h2>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Choose a new future available slot
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)] hover:bg-[var(--color-bg-interactive-subtle)] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
            {/* Current Appointment Banner */}
            <div className="p-4 rounded-2xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--color-text-muted)] uppercase tracking-wider text-[10px]">
                  Current Schedule
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-[var(--color-primary)]">
                  {appointment.appointment_type === "VIRTUAL" ? <Video size={12} /> : <Building2 size={12} />}
                  {appointment.appointment_type === "VIRTUAL" ? "Virtual Video" : "In-Clinic"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-[var(--color-primary)]" />
                  <span className="text-xs sm:text-sm font-bold text-[var(--color-text-strong)]">
                    {fmtDate(slotDate)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)]">
                  <Clock size={13} />
                  <span>{slotStartTime} – {slotEndTime}</span>
                </div>
              </div>
            </div>

            {/* Policy & Attempt Status Notice */}
            {!isNutritionist ? (
              <div className="p-3.5 rounded-2xl border text-xs space-y-1.5 bg-amber-50/70 border-amber-200 text-amber-900 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-200">
                <div className="flex items-center gap-2 font-bold">
                  <Info size={15} className="shrink-0 text-amber-600" />
                  <span>Patient Rescheduling Policy:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800 dark:text-amber-300">
                  <li>Rescheduling is allowed up to <strong>2 times maximum</strong> per appointment.</li>
                  <li>Must be requested at least <strong>24 hours prior</strong> to the scheduled time.</li>
                  <li>Reschedules used for this session: <strong>{rescheduleCount} of 2</strong> ({remainingReschedules} remaining).</li>
                </ul>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl border text-xs bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>
                  <strong>Practitioner Access:</strong> You have unlimited rescheduling permissions for this appointment.
                </span>
              </div>
            )}

            {/* Error banner if patient is blocked */}
            {isPatientBlocked && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs text-rose-900 dark:text-rose-100">
                  <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                  <span>Rescheduling Unavailable</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {hasExceededLimit
                    ? "You have already reached the maximum limit of 2 reschedules for this appointment."
                    : "This appointment is scheduled in less than 24 hours. As per platform policy, rescheduling is only available at least 24 hours before the appointment."}
                </p>
              </div>
            )}

            {/* Date Selection */}
            {!isPatientBlocked && (
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Select Date for New Slot:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    min={getTodayStr()}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] text-xs font-bold text-[var(--color-text-strong)] focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>

                {/* Available Slots List */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Available Time Slots on {fmtDate(selectedDate)}:
                  </label>

                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-8 gap-2 text-xs text-[var(--color-text-muted)]">
                      <RefreshCw size={16} className="animate-spin text-[var(--color-primary)]" />
                      <span>Checking availability...</span>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl border-2 border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)]">
                      <Clock size={28} className="mx-auto mb-2 text-[var(--color-text-muted)] opacity-60" />
                      <p className="text-xs font-bold text-[var(--color-text-strong)]">
                        No Open Slots Found
                      </p>
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                        The practitioner has no open slots on this date. Please pick another date above.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availableSlots.map((s) => {
                        const isSelected = selectedSlotId === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSelectedSlotId(s.id)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? "border-[var(--color-primary)] bg-[var(--color-primary-bg-subtle)] ring-2 ring-[var(--color-primary)]"
                                : "border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:border-[var(--color-border-hover)]"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                                {s.start_time}
                              </span>
                              {isSelected && (
                                <CheckCircle2 size={14} className="text-[var(--color-primary)]" />
                              )}
                            </div>
                            <span className="text-[10px] text-[var(--color-text-muted)] block mt-0.5">
                              to {s.end_time}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold border border-[var(--color-border-default)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPatientBlocked || !selectedSlotId || submitting}
              onClick={handleConfirmReschedule}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-all cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Rescheduling...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  <span>Confirm Reschedule</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RescheduleModal;
