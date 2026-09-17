import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Calendar, Clock, Video, Building2, User, Mail, Phone,
  FileText, CheckCircle2, AlertCircle, XCircle, ExternalLink,
  Copy, Check, Edit3, Save, Sparkles, Heart, Activity,
  MapPin, ChevronRight, ShieldCheck, MessageSquare, Award, Star
} from "lucide-react";
import { toast } from "react-toastify";
import { getAppointmentDetails, updateAppointmentNotes } from "../../../api/appointmentApi";

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

  // Editable fields for nutritionist
  const [notes, setNotes] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!isOpen || !appointmentId) {
      setAppointment(null);
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

  const isNutritionist = userRole === "nutritionist";
  const isVirtual = appointment?.appointment_type === "VIRTUAL";
  const isConfirmed = appointment?.status === "CONFIRMED";
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/40 backdrop-blur-xs font-[var(--font-secondary)]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[var(--color-bg-surface)] rounded-3xl shadow-2xl border-2 border-[var(--color-border-default)] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header Ribbon */}
        <div
          className={`p-5 sm:p-6 text-white relative overflow-hidden flex-shrink-0 ${
            isVirtual
              ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600"
              : "bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700"
          }`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer z-10"
          >
            <X size={18} />
          </button>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wider uppercase">
                  {isVirtual ? <Video size={12} /> : <Building2 size={12} />}
                  {isVirtual ? "Virtual Consultation" : "In-Clinic Consultation"}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isConfirmed ? "bg-emerald-400/30 text-white border border-emerald-300/40" : "bg-rose-400/30 text-white"
                  }`}
                >
                  {isConfirmed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  {appointment?.status || "CONFIRMED"}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-[var(--font-primary)]">
                Appointment Details
              </h2>
              <p className="text-white/85 text-xs sm:text-sm">
                Session ID: #{appointmentId} • Booked {appointment?.created_at ? fmtDateTime(appointment.created_at) : "recently"}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[var(--color-text-muted)] font-semibold">
                Loading appointment summary...
              </p>
            </div>
          ) : (
            <>
              {/* Date & Time Highlight Banner */}
              <div className="p-4 rounded-2xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)]">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block">
                      Scheduled Date
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                      {fmtDate(slot.date)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)]">
                    <Clock size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block">
                      Session Time
                    </span>
                    <span className="text-sm sm:text-base font-extrabold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                      {slot.start_time} – {slot.end_time}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] min-w-[120px] text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block">
                    Consultation Fee
                  </span>
                  <span className="text-sm font-black text-[var(--color-text-strong)]">
                    ₹{price}{" "}
                    <span className="text-[10px] font-bold text-emerald-600 block">
                      {isPayAtClinic ? "Pay at Clinic" : "Paid Online / Plan"}
                    </span>
                  </span>
                </div>
              </div>

              {/* Counterparty Information Card */}
              {!isNutritionist ? (
                /* Patient sees Nutritionist Details */
                <div className="p-4 rounded-2xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                      <User size={13} className="text-[var(--color-primary)]" />
                      Nutritionist Information
                    </h3>
                    <span className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary-bg-subtle)] px-2 py-0.5 rounded-full border border-[var(--color-border-hover)]">
                      {appointment.appointment_category === "EXPERT" ? "Specialist Expert" : "In-House Nutritionist"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      {(n.name || "N").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-[var(--color-text-strong)]">
                        {n.name || "Nutritionist"}
                      </h4>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {n.professional_title || "Clinical Nutritionist"} {n.qualification ? `• ${n.qualification}` : ""}
                      </p>
                      {n.email && (
                        <p className="text-xs text-[var(--color-primary)] flex items-center gap-1 mt-0.5">
                          <Mail size={12} /> {n.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Nutritionist sees Patient Details */
                <div className="p-4 rounded-2xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
                      <User size={13} className="text-[var(--color-primary)]" />
                      Patient Profile Summary
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Patient #{p.id}
                    </span>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                      {(p.name || "P").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm sm:text-base font-bold text-[var(--color-text-strong)]">
                        {p.name || "Patient"}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-muted)] mt-1">
                        {p.email && <span className="flex items-center gap-1"><Mail size={11} /> {p.email}</span>}
                        {p.phone && <span className="flex items-center gap-1"><Phone size={11} /> {p.phone}</span>}
                        {p.gender && <span>Gender: <strong className="text-[var(--color-text-strong)]">{p.gender}</strong></span>}
                        {p.age && <span>Age: <strong className="text-[var(--color-text-strong)]">{p.age}</strong></span>}
                      </div>

                      {p.goal && (
                        <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-2 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg border border-indigo-200 inline-block font-medium">
                          🎯 Health Goal: {p.goal}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Meeting Link or Clinic Address Details */}
              {isVirtual ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                        <Video size={14} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                        Virtual Video Consultation (Zoom)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Active Link
                    </span>
                  </div>

                  {appointment.meeting_link ? (
                    <div>
                      <p className="text-xs font-mono break-all p-2.5 rounded-xl bg-white/95 text-blue-900 border border-blue-200 shadow-2xs mb-2.5">
                        {appointment.meeting_link}
                      </p>
                      <div className="flex gap-2">
                        <a
                          href={appointment.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
                        >
                          <ExternalLink size={13} /> Open Zoom Consultation
                        </a>
                        <button
                          onClick={handleCopyLink}
                          className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-bold text-blue-700 bg-white border border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          {copiedLink ? <Check size={13} /> : <Copy size={13} />}
                          <span>{copiedLink ? "Copied" : "Copy Link"}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-blue-700 italic">
                      Zoom meeting link will be generated prior to consultation start.
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                      <Building2 size={14} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                      In-Clinic Practice Location
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/95 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                    <p className="font-bold flex items-start gap-1.5">
                      <MapPin size={14} className="text-emerald-700 shrink-0 mt-0.5" />
                      <span>{n.offline_location || "Clinic address will be confirmed by nutritionist."}</span>
                    </p>
                    <p className="text-[11px] text-emerald-700 pl-5">
                      Please arrive 5–10 minutes before your scheduled appointment time.
                    </p>
                  </div>
                </div>
              )}

              {/* Clinical Notes & Dietary Instructions Section */}
              <div className="p-4 rounded-2xl bg-[var(--color-bg-surface-alt)] border-2 border-[var(--color-border-default)] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[var(--color-primary)]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-strong)]">
                      Clinical Notes & Dietary Instructions
                    </h3>
                  </div>

                  {isNutritionist && !isEditingNotes && (
                    <button
                      onClick={() => setIsEditingNotes(true)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold text-[var(--color-primary)] bg-[var(--color-bg-surface)] border border-[var(--color-border-hover)] hover:bg-[var(--color-primary-bg-subtle)] transition-colors cursor-pointer shadow-2xs"
                    >
                      <Edit3 size={12} /> Edit Notes
                    </button>
                  )}
                </div>

                {isNutritionist && isEditingNotes ? (
                  /* Nutritionist Edit Mode */
                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text-strong)] mb-1">
                        Clinical Assessment & Observations
                      </label>
                      <textarea
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Write clinical findings, progress remarks, or nutritional observations..."
                        className="w-full p-3 bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] rounded-xl text-xs sm:text-sm text-[var(--color-text-strong)] focus:border-[var(--color-primary)] focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--color-text-strong)] mb-1">
                        Dietary Advice & Action Plan for Patient
                      </label>
                      <textarea
                        rows={3}
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="Enter meal modifications, water goals, supplements, or specific action items..."
                        className="w-full p-3 bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] rounded-xl text-xs sm:text-sm text-[var(--color-text-strong)] focus:border-[var(--color-primary)] focus:outline-none transition-all"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEditingNotes(false)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface)] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={savingNotes}
                        onClick={handleSaveNotes}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Save size={13} />
                        {savingNotes ? "Saving Notes..." : "Save Notes & Instructions"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Read Mode for Patient & Nutritionist */
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block mb-1">
                        Clinical Notes & Observations
                      </span>
                      {notes ? (
                        <p className="text-xs sm:text-sm text-[var(--color-text-strong)] whitespace-pre-line leading-relaxed">
                          {notes}
                        </p>
                      ) : (
                        <p className="text-xs text-[var(--color-text-subtle)] italic">
                          No clinical notes added yet.
                        </p>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                        Dietary Instructions & Action Plan
                      </span>
                      {instructions ? (
                        <p className="text-xs sm:text-sm text-[var(--color-text-strong)] whitespace-pre-line leading-relaxed font-medium">
                          {instructions}
                        </p>
                      ) : (
                        <p className="text-xs text-[var(--color-text-subtle)] italic">
                          No specific dietary instructions recorded.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Consultation Feedback & Ratings Section */}
              {appointment?.feedbacks?.length > 0 && (
                <div className="p-4 rounded-2xl bg-[var(--color-bg-surface-alt)] border-2 border-[var(--color-border-default)] space-y-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-strong)]">
                      Patient Consultation Feedback & Review
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {appointment.feedbacks.map((fb, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[var(--color-text-strong)]">
                            {fb.user_name || "Patient"}
                          </span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-sm ${
                                  star <= fb.rating ? "text-amber-400" : "text-gray-300"
                                }`}
                              >
                                ★
                              </span>
                            ))}
                            <span className="text-xs font-black text-[var(--color-text-strong)] ml-1">
                              {fb.rating}.0
                            </span>
                          </div>
                        </div>

                        {fb.comment && (
                          <p className="text-xs text-[var(--color-text-muted)] italic">
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
        <div className="p-4 border-t border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-[var(--color-text-strong)] bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] hover:border-[var(--color-border-hover)] transition-all cursor-pointer shadow-2xs"
          >
            Close Details
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AppointmentDetailModal;
