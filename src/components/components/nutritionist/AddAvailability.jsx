import React, { useEffect, useState, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  CalendarDays, Trash2, Plus, Lock,
  Search, X, User, Video, Copy, ExternalLink,
  Clock, Calendar, Sparkles, Zap, ArrowRight, Check,
  RefreshCw, ShieldCheck, Sun, Sunrise, Sunset,
  SlidersHorizontal, CheckCircle2, ChevronLeft,
  Building2, MapPin, Layers, Info, CheckSquare, Square, DollarSign, FileText
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMySlots, addAvailability, deleteAvailability } from "../../../api/availabilityApi";
import { getNutritionistProfile } from "../../../api/nutritionistApi";
import AppointmentDetailModal from "../appointments/AppointmentDetailModal";

/* ─── Helpers ──────────────────────────────────────────────── */
const getTodayStr = () => new Date().toISOString().split("T")[0];

const getTomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
};

const getFutureDateStr = (daysAhead) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split("T")[0];
};

const getEndOfWeekStr = () => {
  const d = new Date();
  const day = d.getDay(); // 0 is Sunday, 5 is Friday
  const distance = (5 - day + 7) % 7;
  d.setDate(d.getDate() + (distance === 0 ? 7 : distance));
  return d.toISOString().split("T")[0];
};

const fmtDate = (d) => {
  if (!d) return "";
  const dateObj = new Date(d + "T00:00:00");
  return dateObj.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getRelativeDateLabel = (dateStr) => {
  const today = getTodayStr();
  const d = new Date(dateStr + "T00:00:00");
  const t = new Date(today + "T00:00:00");
  const diffDays = Math.round((d - t) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays < -1) return "Past Date";
  return null;
};

// Generate list of ISO date strings between start and end inclusive
const getDatesInRange = (startDate, endDate, skipWeekends = false) => {
  if (!startDate || !endDate || startDate > endDate) return [];
  const dates = [];
  let cur = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");

  while (cur <= end) {
    const day = cur.getDay(); // 0 = Sun, 6 = Sat
    if (!skipWeekends || (day !== 0 && day !== 6)) {
      dates.push(cur.toISOString().split("T")[0]);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
};

/* ─── Patient Details Modal ─────────────────────────────────── */
const PatientModal = ({ slot, onClose, onOpenDetail, navigate }) => {
  if (!slot) return null;

  const p = slot.patient || {};
  const appt = slot.appointment || {};
  const link = appt.meeting_link || null;
  const isVirtual = slot.slot_type === "VIRTUAL" || appt.type === "VIRTUAL";
  const isInPerson = slot.slot_type === "IN_PERSON" || appt.type === "IN_PERSON";
  const price = slot.price || (isVirtual ? slot.online_price : slot.offline_price) || 0;

  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Zoom meeting link copied to clipboard!", { icon: "📋" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-[var(--color-bg-surface)] shadow-2xl overflow-hidden border border-[var(--color-border-default)]"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header Ribbon */}
        <div className="p-6 text-white relative overflow-hidden bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-primary-hover)] to-[#E64A19]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-bold shadow-inner">
              {(p.name || "P").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider mb-1">
                {isVirtual ? (
                  <>
                    <Video size={11} /> Virtual Consultation
                  </>
                ) : (
                  <>
                    <Building2 size={11} /> In-Clinic Consultation
                  </>
                )}
              </div>
              <h2 className="text-xl font-bold font-[var(--font-primary)]">{p.name || "Patient"}</h2>
              <p className="text-white/85 text-xs">{p.email || "No email available"}</p>
            </div>
          </div>
        </div>

        {/* Time Banner */}
        <div className="mx-5 -mt-3 bg-[var(--color-bg-surface)] rounded-2xl p-3.5 shadow-md border-2 border-[var(--color-border-default)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-[var(--color-primary)]" />
            <span className="font-bold text-[var(--color-text-strong)] text-sm font-[var(--font-primary)]">
              {slot.start_time} – {slot.end_time}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-[var(--color-text-muted)]" />
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">
              {fmtDate(slot.date)}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Price & Payment Summary */}
          <div className="p-3 rounded-2xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)] flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--color-text-muted)]">Consultation Fee</span>
            <span className="text-sm font-black text-[var(--color-text-strong)]">
              ₹{price} <span className="text-[10px] text-emerald-600 font-semibold">{isInPerson && !slot.offline_payment_required ? "(Pay at Clinic)" : "(Paid Online)"}</span>
            </span>
          </div>

          {/* Zoom Meeting Link Section (If Virtual) */}
          {isVirtual ? (
            <div className="p-4 rounded-2xl bg-[var(--color-bg-surface-alt)] border-2 border-[var(--color-border-default)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Video size={15} className="text-[var(--color-primary)]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-strong)]">
                    Zoom Video Consultation
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Active Session
                </span>
              </div>

              {link ? (
                <div>
                  <p className="text-xs font-mono break-all mb-3 px-3 py-2 rounded-xl bg-[var(--color-bg-surface)] text-[var(--color-text-strong)] border border-[var(--color-border-default)] shadow-xs">
                    {link}
                  </p>
                  <div className="flex gap-2">
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-sm transition-colors cursor-pointer text-center"
                    >
                      <ExternalLink size={13} /> Open Zoom Meeting
                    </a>
                    <button
                      onClick={copyLink}
                      className="inline-flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl text-xs font-bold text-[var(--color-primary)] bg-[var(--color-bg-surface)] border border-[var(--color-border-hover)] hover:bg-[var(--color-primary-bg-subtle)] transition-colors cursor-pointer"
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[var(--color-primary)] italic">
                  Zoom link will be generated and sent prior to the session start.
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[var(--color-bg-surface-alt)] border-2 border-[var(--color-border-default)]">
              <div className="flex items-center gap-1.5 mb-1 text-emerald-700">
                <Building2 size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">In-Clinic Appointment</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                The patient will visit your clinic for this session.
              </p>
              {slot.offline_location && (
                <p className="text-xs font-semibold text-emerald-800 mt-2 flex items-start gap-1">
                  <MapPin size={13} className="shrink-0 mt-0.5" />
                  <span>{slot.offline_location}</span>
                </p>
              )}
            </div>
          )}

          {/* Patient Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5 mb-2">
              <User size={12} /> Patient Information
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[var(--color-bg-surface-alt)]">
                <span className="text-[10px] text-[var(--color-text-muted)] block mb-0.5">Email</span>
                <span className="font-semibold text-[var(--color-text-strong)] break-all">{p.email || "—"}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--color-bg-surface-alt)]">
                <span className="text-[10px] text-[var(--color-text-muted)] block mb-0.5">Phone</span>
                <span className="font-semibold text-[var(--color-text-strong)]">{p.phone || p.phone_number || "—"}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-[var(--color-border-default)]">
            {appt.id && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDetail?.(appt.id);
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <FileText size={14} /> View Session Details & Clinical Notes
              </button>
            )}

            {p.id && navigate && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/nutritionist/patient/${p.id}`);
                }}
                className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-[var(--color-text-strong)] bg-[var(--color-bg-surface-alt)] hover:bg-[var(--color-border-default)] border border-[var(--color-border-default)] transition-colors cursor-pointer text-center"
              >
                Go to Patient Profile & Diet Plan →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Create Slots Modal (Custom Range + Mode + Grayed Pricing) ──── */
const CreateSlotsModal = ({ isOpen, onClose, onCreated }) => {
  // Mode selection
  const [slotType, setSlotType] = useState("VIRTUAL"); // VIRTUAL | IN_PERSON | BOTH

  // Date mode selection: SINGLE vs RANGE
  const [dateMode, setDateMode] = useState("RANGE"); // SINGLE | RANGE
  const [singleDate, setSingleDate] = useState(getTodayStr());
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getFutureDateStr(6)); // Default next 7 days
  const [skipWeekends, setSkipWeekends] = useState(false);

  // Time & Duration
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [duration, setDuration] = useState(30);
  const [activePreset, setActivePreset] = useState("FULL_DAY");

  // Nutritionist Profile Pricing Info
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Generated slots & Selection
  const [generatedSlots, setGeneratedSlots] = useState([]);
  const [selectedIdxs, setSelectedIdxs] = useState(new Set());
  const [saving, setSaving] = useState(false);

  // Fetch nutritionist profile pricing settings
  useEffect(() => {
    if (isOpen) {
      setLoadingProfile(true);
      getNutritionistProfile()
        .then((res) => {
          if (res.data?.nutritionist_profile) {
            setProfileData(res.data.nutritionist_profile);
          }
        })
        .catch((err) => console.error("Error fetching pricing settings:", err))
        .finally(() => setLoadingProfile(false));
    }
  }, [isOpen]);

  const applyPreset = (preset) => {
    setActivePreset(preset);
    if (preset === "MORNING") { setStartTime("09:00"); setEndTime("13:00"); }
    else if (preset === "AFTERNOON") { setStartTime("14:00"); setEndTime("18:00"); }
    else if (preset === "FULL_DAY") { setStartTime("09:00"); setEndTime("17:00"); }
  };

  const applyRangePreset = (presetKey) => {
    const today = getTodayStr();
    if (presetKey === "TODAY") {
      setStartDate(today);
      setEndDate(today);
    } else if (presetKey === "NEXT_3") {
      setStartDate(today);
      setEndDate(getFutureDateStr(2));
    } else if (presetKey === "THIS_WEEK") {
      setStartDate(today);
      setEndDate(getEndOfWeekStr());
    } else if (presetKey === "NEXT_7") {
      setStartDate(today);
      setEndDate(getFutureDateStr(6));
    } else if (presetKey === "NEXT_14") {
      setStartDate(today);
      setEndDate(getFutureDateStr(13));
    }
  };

  // Re-calculate generated slots whenever dates, hours, duration, or slotType change
  useEffect(() => {
    const dates = dateMode === "SINGLE"
      ? (singleDate ? [singleDate] : [])
      : getDatesInRange(startDate, endDate, skipWeekends);

    if (dates.length === 0 || !startTime || !endTime || startTime >= endTime) {
      setGeneratedSlots([]);
      setSelectedIdxs(new Set());
      return;
    }

    const temp = [];
    dates.forEach((d) => {
      let cur = new Date(`${d}T${startTime}`);
      const end = new Date(`${d}T${endTime}`);
      while (cur < end) {
        const next = new Date(cur.getTime() + duration * 60000);
        if (next > end) break;
        temp.push({
          date: d,
          start_time: cur.toTimeString().slice(0, 5),
          end_time: next.toTimeString().slice(0, 5),
          slot_type: slotType,
        });
        cur = next;
      }
    });

    setGeneratedSlots(temp);
    setSelectedIdxs(new Set(temp.map((_, i) => i)));
  }, [dateMode, singleDate, startDate, endDate, skipWeekends, startTime, endTime, duration, slotType]);

  const toggleSlot = (idx) => {
    const next = new Set(selectedIdxs);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    setSelectedIdxs(next);
  };

  const toggleAll = () => {
    if (selectedIdxs.size === generatedSlots.length) setSelectedIdxs(new Set());
    else setSelectedIdxs(new Set(generatedSlots.map((_, i) => i)));
  };

  const handleSave = async () => {
    const slotsToSave = generatedSlots.filter((_, i) => selectedIdxs.has(i));
    if (slotsToSave.length === 0) {
      toast.error("Please select at least 1 slot to create.");
      return;
    }
    setSaving(true);
    try {
      const res = await addAvailability(slotsToSave);
      const count = res.data?.created_count ?? slotsToSave.length;
      toast.success(`Successfully created ${count} availability slot${count > 1 ? "s" : ""}!`);
      onCreated();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.errors?.[0] || "Could not create slots.";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const onlineFee = profileData?.online_price !== undefined ? profileData.online_price : "—";
  const offlineFee = profileData?.offline_price !== undefined ? profileData.offline_price : "—";
  const offlinePaymentRequired = profileData?.offline_payment_required ?? true;
  const offlineLocation = profileData?.offline_location || "No clinic address set in profile";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div
        className="relative w-full max-w-3xl rounded-3xl bg-[var(--color-bg-surface)] shadow-2xl overflow-hidden border border-[var(--color-border-default)]"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "94vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] border border-[var(--color-border-hover)] flex items-center justify-center shadow-md">
              <CalendarDays size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                Create Availability Slots
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Choose consultation mode, custom date range, and generate bookable slots.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--color-bg-interactive-subtle)] text-[var(--color-text-muted)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">

          {/* ── STEP 1: Consultation Mode Selection ── */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                1. Select Consultation Mode
              </label>
              <span className="text-[11px] text-[var(--color-primary)] font-semibold">
                Applies to generated slots
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  key: "VIRTUAL",
                  label: "Virtual (Online)",
                  sub: "Zoom video consultation",
                  icon: <Video size={16} />,
                  tag: "Online Meeting"
                },
                {
                  key: "IN_PERSON",
                  label: "In-Clinic (Offline)",
                  sub: "In-person at physical clinic",
                  icon: <Building2 size={16} />,
                  tag: "Clinic Visit"
                },
                {
                  key: "BOTH",
                  label: "Both (Flexible)",
                  sub: "Patient chooses Online or Clinic",
                  icon: <Layers size={16} />,
                  tag: "Flexible"
                },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setSlotType(m.key)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    slotType === m.key
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-bg-subtle)] shadow-xs ring-2 ring-[var(--color-primary)]/20"
                      : "border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] hover:border-[var(--color-border-hover)]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`p-1.5 rounded-xl ${slotType === m.key ? "bg-[var(--color-primary)] text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>
                      {m.icon}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-200/70 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {m.tag}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[var(--color-text-strong)]">{m.label}</h4>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{m.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── PRICING PREVIEW: Grayed-out Configured Settings ── */}
          <div className="p-4 rounded-2xl bg-gray-50/90 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                <Lock size={13} className="text-gray-500" />
                <span>Your Configured Profile Pricing & Settings (Read-Only)</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                Automatic Rates
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-400 block mb-0.5">
                  Virtual / Online Rate
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-gray-800 dark:text-gray-100">
                    ₹{onlineFee} <span className="text-[10px] font-normal text-gray-500">/ session</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold">
                    {profileData?.is_online_available ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-400 block mb-0.5">
                  In-Clinic / Physical Rate
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-gray-800 dark:text-gray-100">
                    ₹{offlineFee} <span className="text-[10px] font-normal text-gray-500">/ session</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold">
                    {offlinePaymentRequired ? "Pay Online" : "Pay at Clinic"}
                  </span>
                </div>
              </div>
            </div>

            {profileData?.offline_location && (
              <div className="flex items-start gap-1.5 text-[11px] text-gray-600 dark:text-gray-400 pt-0.5">
                <MapPin size={12} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
                <span className="truncate"><strong>Practice Clinic:</strong> {profileData.offline_location}</span>
              </div>
            )}

            <div className="flex items-center gap-1 text-[10px] text-gray-500 italic pt-0.5">
              <Info size={11} className="shrink-0" />
              <span>
                These rates are automatically applied to appointments. {offlinePaymentRequired ? "Online payment is required for offline visits." : "Patients can pay upon arrival for offline visits."}
              </span>
            </div>
          </div>

          {/* ── STEP 2: Custom Date Range / Single Date ── */}
          <div className="space-y-3 pt-1 border-t border-[var(--color-border-default)]">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                2. Select Date or Custom Date Range
              </label>

              {/* Mode Toggle: Single Date vs Date Range */}
              <div className="flex items-center p-1 rounded-xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)]">
                <button
                  type="button"
                  onClick={() => setDateMode("RANGE")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    dateMode === "RANGE"
                      ? "bg-[var(--color-primary)] text-white shadow-xs"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
                  }`}
                >
                  Custom Date Range
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode("SINGLE")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    dateMode === "SINGLE"
                      ? "bg-[var(--color-primary)] text-white shadow-xs"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
                  }`}
                >
                  Single Day
                </button>
              </div>
            </div>

            {dateMode === "SINGLE" ? (
              <div className="flex flex-wrap items-center gap-2">
                {["Today", "Tomorrow"].map((d, i) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setSingleDate(i === 0 ? getTodayStr() : getTomorrowStr())}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border-2 transition-all cursor-pointer ${
                      singleDate === (i === 0 ? getTodayStr() : getTomorrowStr())
                        ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-xs"
                        : "border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)]"
                    }`}
                  >
                    {d}
                  </button>
                ))}
                <input
                  type="date"
                  min={getTodayStr()}
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border-2 border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] text-xs font-semibold text-[var(--color-text-strong)] focus:outline-none focus:border-[var(--color-primary)]"
                />
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Quick Range Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { key: "TODAY", label: "Today" },
                    { key: "NEXT_3", label: "Next 3 Days" },
                    { key: "THIS_WEEK", label: "This Week (Mon-Fri)" },
                    { key: "NEXT_7", label: "Next 7 Days" },
                    { key: "NEXT_14", label: "Next 14 Days" },
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => applyRangePreset(p.key)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Date Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">
                      From Date (Start)
                    </span>
                    <input
                      type="date"
                      min={getTodayStr()}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] text-xs font-semibold text-[var(--color-text-strong)] focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">
                      To Date (End)
                    </span>
                    <input
                      type="date"
                      min={startDate || getTodayStr()}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] text-xs font-semibold text-[var(--color-text-strong)] focus:outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>

                {/* Exclude Weekends Checkbox */}
                <label className="inline-flex items-center gap-2 text-xs text-[var(--color-text-muted)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={skipWeekends}
                    onChange={(e) => setSkipWeekends(e.target.checked)}
                    className="rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                  />
                  <span>Exclude weekends (Saturday & Sunday) from slot generation</span>
                </label>
              </div>
            )}
          </div>

          {/* ── STEP 3: Working Hours & Slot Duration ── */}
          <div className="space-y-3 pt-1 border-t border-[var(--color-border-default)]">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              3. Working Hours & Duration
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: "MORNING", label: "Morning", sub: "09:00 - 13:00", icon: <Sunrise size={14} /> },
                { key: "AFTERNOON", label: "Afternoon", sub: "14:00 - 18:00", icon: <Sunset size={14} /> },
                { key: "FULL_DAY", label: "Full Day", sub: "09:00 - 17:00", icon: <Sun size={14} /> },
                { key: "CUSTOM", label: "Custom", sub: "Set manually", icon: <Clock size={14} /> },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => applyPreset(p.key)}
                  className={`p-2.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                    activePreset === p.key
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-bg-subtle)] shadow-xs ring-1 ring-[var(--color-primary)]"
                      : "border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)]"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    {p.icon} <span>{p.label}</span>
                  </div>
                  <span className="text-[11px] opacity-75 block mt-0.5">{p.sub}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              {[
                { l: "Start Time", v: startTime, s: setStartTime },
                { l: "End Time", v: endTime, s: setEndTime },
              ].map((f) => (
                <div key={f.l}>
                  <span className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">
                    {f.l}
                  </span>
                  <input
                    type="time"
                    value={f.v}
                    onChange={(e) => {
                      f.s(e.target.value);
                      setActivePreset("CUSTOM");
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] text-xs font-semibold focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>
              ))}

              <div>
                <span className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">
                  Duration
                </span>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] text-xs font-semibold focus:outline-none focus:border-[var(--color-primary)]"
                >
                  <option value={15}>15 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── STEP 4: Review & Toggle Slots ── */}
          <div className="space-y-3 pt-1 border-t border-[var(--color-border-default)]">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  4. Generated Slots Preview ({selectedIdxs.size}/{generatedSlots.length})
                </label>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  {dateMode === "RANGE"
                    ? `Generated across date range with ${slotType} mode`
                    : `Generated for ${singleDate} with ${slotType} mode`}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs font-bold text-[var(--color-primary)] hover:underline cursor-pointer"
              >
                {selectedIdxs.size === generatedSlots.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            {generatedSlots.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center">
                No slots generated. Please ensure your dates and time range are valid.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-52 overflow-y-auto p-1 custom-scrollbar">
                {generatedSlots.map((s, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => toggleSlot(idx)}
                    className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      selectedIdxs.has(idx)
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-bg-subtle)] font-bold shadow-2xs text-[var(--color-text-strong)]"
                        : "border-dashed border-gray-300 bg-gray-50 dark:bg-gray-800/40 opacity-60 text-gray-500"
                    }`}
                  >
                    <span className="text-[10px] text-[var(--color-text-muted)] font-medium">
                      {fmtDate(s.date)}
                    </span>
                    <span className="text-xs font-bold">
                      {s.start_time} - {s.end_time}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-[var(--color-border-default)] text-xs font-bold text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || selectedIdxs.size === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-md disabled:opacity-50 transition-all cursor-pointer"
          >
            <Check size={16} /> Save {selectedIdxs.size} Slots
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT: NUTRITIONIST SCHEDULE DASHBOARD
═══════════════════════════════════════════════════════════════ */
const AddAvailability = () => {
  const navigate = useNavigate();

  // Slots State
  const [unbookedSlots, setUnbookedSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [fetching, setFetching] = useState(false);

  // Modals & Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [detailModalApptId, setDetailModalApptId] = useState(null);

  // Filters State
  const [timeHorizon, setTimeHorizon] = useState("upcoming"); // upcoming | past | all
  const [modeFilter, setModeFilter] = useState("ALL"); // ALL | VIRTUAL | IN_PERSON | BOTH
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | AVAILABLE | BOOKED
  const [filterDate, setFilterDate] = useState("");
  const [search, setSearch] = useState("");

  /* ─── Fetch Slots ──────────────────────────────────────────── */
  const fetchSlots = async () => {
    setFetching(true);
    try {
      const params = {};
      if (timeHorizon && timeHorizon !== "all") params.time_horizon = timeHorizon;
      if (modeFilter && modeFilter !== "ALL") params.slot_type = modeFilter;
      if (statusFilter === "AVAILABLE") params.status = "unbooked";
      if (statusFilter === "BOOKED") params.status = "booked";
      if (filterDate) params.date = filterDate;
      if (search) params.search = search;

      const res = await getMySlots(params);
      setUnbookedSlots(res.data?.unbooked_slots || []);
      setBookedSlots(res.data?.booked_slots || []);
    } catch {
      toast.error("Failed to fetch slots. Please try again.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [timeHorizon, modeFilter, statusFilter, filterDate]);

  useEffect(() => {
    const timer = setTimeout(fetchSlots, 300);
    return () => clearTimeout(timer);
  }, [search]);

  /* ─── Delete Available Slot ────────────────────────────────── */
  const handleDeleteSlot = async (id) => {
    if (!window.confirm("Remove this open availability slot?")) return;

    try {
      await deleteAvailability(id);
      toast.success("Slot removed");
      fetchSlots();
    } catch {
      toast.error("Cannot delete a booked slot.");
    }
  };

  /* ─── Combine & Group Slots for Clean Presentation ─────────── */
  const allSlots = useMemo(() => {
    const combined = [
      ...unbookedSlots.map((s) => ({ ...s, is_booked: false })),
      ...bookedSlots.map((s) => ({ ...s, is_booked: true })),
    ];
    return combined.sort((a, b) => {
      if (a.date !== b.date) {
        return timeHorizon === "past"
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date);
      }
      return timeHorizon === "past"
        ? b.start_time.localeCompare(a.start_time)
        : a.start_time.localeCompare(b.start_time);
    });
  }, [unbookedSlots, bookedSlots, timeHorizon]);

  // Group by date
  const groupedSlots = useMemo(() => {
    const map = {};
    for (const slot of allSlots) {
      if (!map[slot.date]) {
        map[slot.date] = [];
      }
      map[slot.date].push(slot);
    }
    return Object.entries(map).map(([date, slots]) => ({
      date,
      slots,
      relative: getRelativeDateLabel(date),
    }));
  }, [allSlots]);

  const totalCount = allSlots.length;
  const availableCount = unbookedSlots.length;
  const bookedCount = bookedSlots.length;

  return (
    <div className="min-h-screen pb-20 bg-[var(--color-bg-app)] text-[var(--color-text-strong)] font-[var(--font-secondary)]">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "14px",
            fontFamily: "var(--font-secondary)",
            background: "var(--color-bg-surface)",
            color: "var(--color-text-strong)",
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.15)",
          },
        }}
      />

      {/* Patient Consultation Modal */}
      {selectedSlot && (
        <PatientModal
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onOpenDetail={(apptId) => setDetailModalApptId(apptId)}
          navigate={navigate}
        />
      )}

      {/* Appointment Details & Clinical Notes Modal */}
      <AppointmentDetailModal
        appointmentId={detailModalApptId}
        isOpen={Boolean(detailModalApptId)}
        onClose={() => setDetailModalApptId(null)}
        userRole="nutritionist"
        onNotesSaved={fetchSlots}
      />

      {/* Add Slots Modal */}
      <CreateSlotsModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={fetchSlots}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8 space-y-6">

        {/* ── Clean Header & Actions ── */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)] text-[11px] font-bold tracking-wider uppercase mb-1.5 border border-[var(--color-border-hover)]">
              <CalendarDays size={12} /> Flexible Virtual & In-Clinic Availability
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
              Consultation Schedule
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-0.5">
              Manage online Zoom & clinic appointment slots, select custom date ranges, and review booked sessions.
            </p>
          </div>

          {/* Quick Metrics Chips & Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] shadow-xs flex items-center gap-2.5 sm:gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-600 block leading-tight">
                  {availableCount}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Available Slots
                </span>
              </div>
            </div>

            <div className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] shadow-xs flex items-center gap-2.5 sm:gap-3">
              <Lock size={14} className="text-[var(--color-primary)]" />
              <div>
                <span className="text-base sm:text-lg font-black text-[var(--color-primary)] block leading-tight">
                  {bookedCount}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Booked Sessions
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchSlots}
                disabled={fetching}
                className="p-2.5 rounded-2xl border-2 border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors cursor-pointer shadow-xs"
                title="Refresh Slots"
              >
                <RefreshCw size={16} className={fetching ? "animate-spin text-[var(--color-primary)]" : ""} />
              </button>

              <button
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-md hover:shadow-[var(--color-primary)]/20 active:scale-98 transition-all cursor-pointer"
              >
                <Plus size={16} /> Add Slots
              </button>
            </div>
          </div>
        </div>

        {/* ── Streamlined Filter Toolbar (Horizon + Mode + Status + Search) ── */}
        <div className="p-4 rounded-3xl bg-[var(--color-bg-surface)] border-2 border-[var(--color-border-default)] shadow-xs space-y-3">
          
          {/* Main Horizon & Mode & Status Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Horizon Filter Tabs (Upcoming / Past / All) */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)]">
              {[
                { key: "upcoming", label: "Upcoming Slots" },
                { key: "past", label: "Past Slots" },
                { key: "all", label: "All Slots" },
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

            {/* Mode Filter Tabs (All / Virtual / In-Clinic / Both) */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)]">
              {[
                { key: "ALL", label: "All Modes" },
                { key: "VIRTUAL", label: "Virtual", icon: <Video size={11} /> },
                { key: "IN_PERSON", label: "In-Clinic", icon: <Building2 size={11} /> },
                { key: "BOTH", label: "Both", icon: <Layers size={11} /> },
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

            {/* Status Tabs (All / Open / Booked) */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)]">
              {[
                { key: "ALL", label: "All" },
                { key: "AVAILABLE", label: `Open (${availableCount})` },
                { key: "BOOKED", label: `Booked (${bookedCount})` },
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

          {/* Search & Specific Date Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[var(--color-border-default)]">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)]"
              />
              <input
                type="text"
                placeholder="Search patient name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] focus:border-[var(--color-primary)] focus:outline-none text-xs text-[var(--color-text-strong)]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setTimeHorizon("upcoming");
                  setModeFilter("ALL");
                  setStatusFilter("ALL");
                  setFilterDate("");
                  setSearch("");
                }}
                className="w-full py-1.5 px-3 rounded-xl border border-[var(--color-border-default)] text-xs font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-alt)] transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* ── Slot Groups by Date ── */}
        {groupedSlots.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-surface)]">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3 text-blue-600">
              <CalendarDays size={28} />
            </div>
            <h3 className="text-base font-bold text-[var(--color-text-strong)]">
              No {timeHorizon} slots found
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] max-w-sm mx-auto mt-1 mb-4">
              {timeHorizon === "upcoming"
                ? "You don't have any upcoming availability slots matching your filter."
                : "No consultation slots match your current filter settings."}
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] shadow-md cursor-pointer"
            >
              <Plus size={15} /> Add Availability Slots
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedSlots.map(({ date, slots, relative }) => (
              <div key={date} className="space-y-3">
                {/* Date Group Header */}
                <div className="flex items-center justify-between pb-1.5 border-b border-[var(--color-border-default)]">
                  <div className="flex items-center gap-2">
                    <Calendar size={15} className="text-[var(--color-primary)]" />
                    <h2 className="text-sm font-bold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                      {fmtDate(date)}
                    </h2>
                    {relative && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        relative === "Today"
                          ? "bg-emerald-100 text-emerald-800"
                          : relative === "Tomorrow"
                          ? "bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)]"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {relative}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)] font-semibold">
                    {slots.length} slot{slots.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Slots Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {slots.map((slot) => {
                    const isBooked = slot.is_booked;
                    const mode = slot.slot_type || "VIRTUAL";
                    const price = slot.price || (mode === "IN_PERSON" ? slot.offline_price : slot.online_price) || 0;

                    return (
                      <div
                        key={slot.id}
                        onClick={() => {
                          if (isBooked) setSelectedSlot(slot);
                        }}
                        className={`rounded-2xl border-2 transition-all p-4 bg-[var(--color-bg-surface)] flex flex-col justify-between shadow-xs ${
                          isBooked
                            ? "cursor-pointer hover:shadow-md hover:border-[var(--color-primary)] border-[var(--color-border-hover)]"
                            : "hover:border-[var(--color-primary)] border-[var(--color-border-default)]"
                        }`}
                      >
                        <div>
                          {/* Slot Header */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="text-sm font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
                                {slot.start_time} – {slot.end_time}
                              </span>

                              {/* Mode Badge */}
                              <div className="mt-1 flex items-center gap-1.5">
                                {mode === "VIRTUAL" && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md border border-blue-200">
                                    <Video size={10} /> Virtual
                                  </span>
                                )}
                                {mode === "IN_PERSON" && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md border border-emerald-200">
                                    <Building2 size={10} /> In-Clinic
                                  </span>
                                )}
                                {mode === "BOTH" && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded-md border border-purple-200">
                                    <Layers size={10} /> Online / Clinic
                                  </span>
                                )}
                              </div>
                            </div>

                            <div>
                              {isBooked ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-primary-bg-subtle)] text-[var(--color-primary)]">
                                  <Lock size={10} /> Booked
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Open
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Price Display */}
                          <div className="flex items-center justify-between text-xs py-1.5 border-t border-[var(--color-border-default)]">
                            <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
                              Fee: <strong className="text-[var(--color-text-strong)]">₹{price}</strong>
                            </span>
                            {mode === "IN_PERSON" && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                {slot.offline_payment_required ? "Pay Online" : "Pay at Clinic"}
                              </span>
                            )}
                          </div>

                          {/* Patient Snippet for Booked Slots */}
                          {isBooked && slot.patient && (
                            <div className="p-2.5 rounded-xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)] my-2">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  {(slot.patient.name || "P").charAt(0).toUpperCase()}
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-xs font-bold text-[var(--color-text-strong)] truncate">
                                    {slot.patient.name || "Patient"}
                                  </p>
                                  <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                                    {slot.patient.email || "No email"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Slot Footer Actions */}
                        <div className="pt-2 mt-1 border-t border-[var(--color-border-default)] flex items-center justify-between">
                          {isBooked ? (
                            <div className="flex items-center justify-between w-full text-xs font-bold text-[var(--color-primary)]">
                              <span>Patient Details</span>
                              <ArrowRight size={13} />
                            </div>
                          ) : (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[10px] text-[var(--color-text-muted)]">
                                Available for booking
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSlot(slot.id);
                                }}
                                className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Slot"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddAvailability;