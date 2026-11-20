import React, { useEffect, useState, useMemo, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  CalendarDays, Trash2, Plus, Lock,
  Search, X, User, Video, Copy, ExternalLink,
  Clock, Calendar, Sparkles, Zap, ArrowRight, Check,
  RefreshCw, ShieldCheck, Sun, Sunrise, Sunset,
  SlidersHorizontal, CheckCircle2, ChevronLeft, ChevronRight,
  Building2, MapPin, Layers, Info, CheckSquare, Square, DollarSign, FileText,
  Loader2, CalendarClock, History, AlertCircle, List, Phone, Mail
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday
} from "date-fns";
import { useNavigate, useLocation } from "react-router-dom";
import { getMySlots, addAvailability, deleteAvailability } from "../../../api/availabilityApi";
import { getNutritionistProfile } from "../../../api/nutritionistApi";
import AppointmentDetailModal from "../appointments/AppointmentDetailModal";
import BackButton from "./BackButton";

/* ─── Helpers ──────────────────────────────────────────────── */
const formatLocalDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayStr = () => formatLocalDate(new Date());

const getTomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatLocalDate(d);
};

const getFutureDateStr = (daysAhead) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return formatLocalDate(d);
};

const getEndOfWeekStr = () => {
  const d = new Date();
  const day = d.getDay(); // 0 is Sunday, 5 is Friday
  const distance = (5 - day + 7) % 7;
  d.setDate(d.getDate() + (distance === 0 ? 7 : distance));
  return formatLocalDate(d);
};

const fmtDate = (d) => {
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  const dateObj = new Date(y, m - 1, day, 12, 0, 0);
  return dateObj.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getRelativeDateLabel = (dateStr) => {
  if (!dateStr) return null;
  const today = getTodayStr();
  if (dateStr === today) return "Today";

  const [tY, tM, tD] = today.split("-").map(Number);
  const [dY, dM, dD] = dateStr.split("-").map(Number);
  const t = new Date(tY, tM - 1, tD, 12, 0, 0);
  const d = new Date(dY, dM - 1, dD, 12, 0, 0);
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
  const [sY, sM, sD] = startDate.split("-").map(Number);
  const [eY, eM, eD] = endDate.split("-").map(Number);
  const cur = new Date(sY, sM - 1, sD, 12, 0, 0);
  const end = new Date(eY, eM - 1, eD, 12, 0, 0);

  while (cur <= end) {
    const day = cur.getDay(); // 0 = Sun, 6 = Sat
    if (!skipWeekends || (day !== 0 && day !== 6)) {
      dates.push(formatLocalDate(cur));
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
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Consultation Fee</span>
            <span className="text-sm font-black text-slate-900">
              {appt.status === "PENDING_REVIEW" ? (
                <span className="text-orange-700 font-bold">Quote Required</span>
              ) : appt.status === "AWAITING_PAYMENT" ? (
                <span className="text-orange-600 font-bold">₹{appt.fee_amount || price} (Quoted)</span>
              ) : (
                <>₹{price} <span className="text-[10px] text-emerald-600 font-semibold">{isInPerson && !slot.offline_payment_required ? "(Pay at Clinic)" : "(Paid Online)"}</span></>
              )}
            </span>
          </div>

          {/* Consultation Reason & Focus Areas */}
          {(appt.patient_case_summary || (Array.isArray(appt.patient_medical_conditions) && appt.patient_medical_conditions.length > 0)) && (
            <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200 space-y-2 text-xs">
              <span className="font-extrabold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <FileText size={13} className="text-orange-600" /> Consultation Reason & Focus Areas
              </span>
              {appt.patient_case_summary && (
                <p className="text-slate-800 italic leading-relaxed bg-white p-2.5 rounded-xl border border-orange-200">
                  "{appt.patient_case_summary}"
                </p>
              )}
              {Array.isArray(appt.patient_medical_conditions) && appt.patient_medical_conditions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[11px] font-bold text-slate-600">Focus Areas:</span>
                  {appt.patient_medical_conditions.map((c, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-orange-200 text-[10px] font-bold text-orange-800">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pending Review Alert Banner */}
          {appt.status === "PENDING_REVIEW" && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                <Sparkles size={14} className="text-amber-600" />
                <span>Case Review & Fee Quote Required</span>
              </div>
              <p className="text-[11px] text-amber-800 font-medium">
                Patient is waiting for your fee quote. Review the clinical dossier and set your consultation fee to confirm the slot.
              </p>
            </div>
          )}

          {/* Zoom Meeting Link Section (If Virtual) */}
          {isVirtual ? (
            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Video size={15} className="text-orange-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Zoom Video Consultation
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Active Session
                </span>
              </div>

              {link ? (
                <div>
                  <p className="text-xs font-mono break-all mb-3 px-3 py-2 rounded-xl bg-white text-slate-900 border border-slate-200 shadow-xs">
                    {link}
                  </p>
                  <div className="flex gap-2">
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-sm transition-colors cursor-pointer text-center"
                    >
                      <ExternalLink size={13} /> Open Zoom Meeting
                    </a>
                    <button
                      onClick={copyLink}
                      className="inline-flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {copied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-orange-600 italic">
                  Zoom link will be generated and sent prior to the session start.
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200">
              <div className="flex items-center gap-1.5 mb-1 text-slate-800 font-bold">
                <Building2 size={16} />
                <span className="text-xs uppercase tracking-wider">In-Clinic Appointment</span>
              </div>
              <p className="text-xs text-slate-600">
                The patient will visit your clinic for this session.
              </p>
              {slot.offline_location && (
                <p className="text-xs font-semibold text-slate-900 mt-2 flex items-start gap-1">
                  <MapPin size={13} className="shrink-0 mt-0.5 text-orange-600" />
                  <span>{slot.offline_location}</span>
                </p>
              )}
            </div>
          )}

          {/* Patient Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
              <User size={12} /> Patient Information
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block mb-0.5">Email</span>
                <span className="font-semibold text-slate-900 break-all">{p.email || "—"}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block mb-0.5">Phone</span>
                <span className="font-semibold text-slate-900">{p.phone || p.phone_number || "—"}</span>
              </div>
              {p.gender && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block mb-0.5">Gender</span>
                  <span className="font-semibold text-slate-900 capitalize">{p.gender}</span>
                </div>
              )}
              {p.goal && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block mb-0.5">Health Goal</span>
                  <span className="font-semibold text-orange-950 truncate block">🎯 {p.goal}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            {appt.id && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDetail?.(appt.id);
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer bg-orange-500 hover:bg-orange-600"
              >
                {appt.status === "PENDING_REVIEW" ? (
                  <>
                    <Sparkles size={14} /> Review Case & Set Quote Fee →
                  </>
                ) : (
                  <>
                    <FileText size={14} /> View Session Details & Clinical Notes
                  </>
                )}
              </button>
            )}

            {p.id && navigate && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/nutritionist/patient/${p.id}`);
                }}
                className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer text-center"
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
const CreateSlotsModal = ({ isOpen, onClose, onCreated, initialDate = null }) => {
  // Mode selection
  const [slotType, setSlotType] = useState("VIRTUAL"); // VIRTUAL | IN_PERSON | BOTH
  const [pricingMode, setPricingMode] = useState("FIXED"); // FIXED | VARIABLE

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
  const [saveError, setSaveError] = useState(null);
  const abortControllerRef = useRef(null);

  // Fetch nutritionist profile pricing settings
  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        setSingleDate(initialDate);
        setStartDate(initialDate);
        setEndDate(initialDate);
        setDateMode("SINGLE");
      }
      setLoadingProfile(true);
      setSaveError(null);
      getNutritionistProfile()
        .then((res) => {
          if (res.data?.nutritionist_profile) {
            setProfileData(res.data.nutritionist_profile);
          }
        })
        .catch((err) => console.error("Error fetching pricing settings:", err))
        .finally(() => setLoadingProfile(false));
    }
  }, [isOpen, initialDate]);

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
    const now = new Date();
    const todayStr = getTodayStr();

    dates.forEach((d) => {
      if (d < todayStr) return; // Skip past dates

      let cur = new Date(`${d}T${startTime}`);
      const end = new Date(`${d}T${endTime}`);
      while (cur < end) {
        const next = new Date(cur.getTime() + duration * 60000);
        if (next > end) break;
        if (d === todayStr && cur <= now) {
          cur = next;
          continue;
        }
        temp.push({
          date: d,
          start_time: cur.toTimeString().slice(0, 5),
          end_time: next.toTimeString().slice(0, 5),
          slot_type: slotType,
          pricing_mode: profileData?.nutritionist_type === "expert" ? pricingMode : "FIXED",
        });
        cur = next;
      }
    });

    setGeneratedSlots(temp);
    setSelectedIdxs(new Set(temp.map((_, i) => i)));
  }, [dateMode, singleDate, startDate, endDate, skipWeekends, startTime, endTime, duration, slotType, pricingMode, profileData]);

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
    const todayStr = getTodayStr();
    const nowStr = new Date().toTimeString().slice(0, 5);
    const hasPastSlot = slotsToSave.some((s) => s.date < todayStr || (s.date === todayStr && s.start_time <= nowStr));
    if (hasPastSlot) {
      toast.error("Cannot create availability slots in the past. Please select future time slots.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    abortControllerRef.current = new AbortController();
    try {
      const res = await addAvailability(slotsToSave, { signal: abortControllerRef.current.signal });
      const count = res.data?.created_count ?? slotsToSave.length;
      toast.success(`Successfully created ${count} availability slot${count > 1 ? "s" : ""}!`);
      onCreated();
      onClose();
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        toast.info("Slot generation cancelled.");
      } else {
        const errorMsg = err.response?.data?.detail || err.response?.data?.errors?.[0] || "Could not create slots. Please try again.";
        setSaveError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setSaving(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelSave = () => {
    if (saving && abortControllerRef.current) {
      abortControllerRef.current.abort();
      setSaving(false);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  const onlineFee = profileData?.online_price !== undefined ? profileData.online_price : "—";
  const offlineFee = profileData?.offline_price !== undefined ? profileData.offline_price : "—";
  const offlinePaymentRequired = profileData?.offline_payment_required ?? true;
  const offlineLocation = profileData?.offline_location || "No clinic address set in profile";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn" onClick={onClose}>
      <div
        className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "94vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center shadow-xs">
              <CalendarDays size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 font-[var(--font-primary)]">
                Create Availability Slots
              </h2>
              <p className="text-xs text-slate-500">
                Choose consultation mode, custom date range, and generate bookable slots.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">

          {/* ── STEP 1: Consultation Mode Selection ── */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Select Consultation Mode
              </label>
              <span className="text-[11px] text-orange-600 font-semibold">
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
                      ? "border-orange-500 bg-orange-50/70 shadow-xs ring-2 ring-orange-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`p-1.5 rounded-xl ${slotType === m.key ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-700"}`}>
                      {m.icon}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${slotType === m.key ? "bg-orange-100 text-orange-800" : "bg-slate-100 text-slate-600"}`}>
                      {m.tag}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{m.label}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{m.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── EXPERT PRICING MODE: Fixed vs Variable Slots ── */}
          {profileData?.nutritionist_type === "expert" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-orange-600">
                  Slot Booking & Pricing Mode
                </label>
                <span className="text-[11px] font-semibold text-slate-500">
                  {pricingMode === "FIXED" ? "⚡ Instant Booking" : "📋 Two-Step Case Review"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPricingMode("FIXED")}
                  className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    pricingMode === "FIXED"
                      ? "border-orange-500 bg-orange-50/70 shadow-xs ring-2 ring-orange-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`p-1.5 rounded-xl ${pricingMode === "FIXED" ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-700"}`}>
                      <Zap size={16} />
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                      Instant
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Fixed Price Slot</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Patient pays your standard rate upfront at booking</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPricingMode("VARIABLE")}
                  className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                    pricingMode === "VARIABLE"
                      ? "border-orange-500 bg-orange-50/70 shadow-xs ring-2 ring-orange-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`p-1.5 rounded-xl ${pricingMode === "VARIABLE" ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-700"}`}>
                      <FileText size={16} />
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                      2-Step Quote
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Variable Case Slot</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Patient submits case details first; you set price based on complexity</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── PRICING PREVIEW: Grayed-out Configured Settings ── */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Lock size={13} className="text-slate-500" />
                <span>
                  {profileData?.nutritionist_type === "expert"
                    ? "Your Practice Consultation Rates"
                    : "Standard Platform Consultation Rates"}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                {profileData?.nutritionist_type === "expert" ? "Specialist Tier" : "In-House Tier"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                  Virtual / Online Rate
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900">
                    ₹{onlineFee} <span className="text-[10px] font-normal text-slate-500">/ session</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200 font-bold">
                    {profileData?.is_online_available ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                  In-Clinic / Physical Rate
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900">
                    ₹{offlineFee} <span className="text-[10px] font-normal text-slate-500">/ session</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-bold">
                    {offlinePaymentRequired ? "Pay Online" : "Pay at Clinic"}
                  </span>
                </div>
              </div>
            </div>

            {profileData?.offline_location && (
              <div className="flex items-start gap-1.5 text-[11px] text-slate-700 pt-0.5">
                <MapPin size={12} className="text-orange-600 shrink-0 mt-0.5" />
                <span className="truncate"><strong>Practice Clinic:</strong> {profileData.offline_location}</span>
              </div>
            )}

            <div className="flex items-center gap-1 text-[10px] text-slate-500 italic pt-0.5">
              <Info size={11} className="shrink-0" />
              <span>
                These rates are automatically applied to appointments. {offlinePaymentRequired ? "Online payment is required for offline visits." : "Patients can pay upon arrival for offline visits."}
              </span>
            </div>
          </div>

          {/* ── STEP 2: Custom Date Range / Single Date ── */}
          <div className="space-y-3 pt-1 border-t border-slate-200">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Select Date or Custom Date Range
              </label>

              {/* Mode Toggle: Single Date vs Date Range */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setDateMode("RANGE")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    dateMode === "RANGE"
                      ? "bg-orange-500 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Custom Date Range
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode("SINGLE")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    dateMode === "SINGLE"
                      ? "bg-orange-500 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
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
                        ? "bg-orange-500 text-white border-orange-500 shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
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
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
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
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-slate-200 bg-white hover:border-orange-500 hover:text-orange-600 text-slate-700 transition-all cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Date Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                      From Date (Start)
                    </span>
                    <input
                      type="date"
                      min={getTodayStr()}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                      To Date (End)
                    </span>
                    <input
                      type="date"
                      min={startDate || getTodayStr()}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Exclude Weekends Checkbox */}
                <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={skipWeekends}
                    onChange={(e) => setSkipWeekends(e.target.checked)}
                    className="rounded text-orange-500 focus:ring-orange-500 cursor-pointer"
                  />
                  <span>Exclude weekends (Saturday & Sunday) from slot generation</span>
                </label>
              </div>
            )}
          </div>

          {/* ── STEP 3: Working Hours & Slot Duration ── */}
          <div className="space-y-3 pt-1 border-t border-slate-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
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
                      ? "border-orange-500 bg-orange-50 text-slate-900 shadow-xs ring-1 ring-orange-500"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    {p.icon} <span>{p.label}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">{p.sub}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              {[
                { l: "Start Time", v: startTime, s: setStartTime },
                { l: "End Time", v: endTime, s: setEndTime },
              ].map((f) => (
                <div key={f.l}>
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    {f.l}
                  </span>
                  <input
                    type="time"
                    value={f.v}
                    onChange={(e) => {
                      f.s(e.target.value);
                      setActivePreset("CUSTOM");
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              ))}

              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Duration
                </span>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-orange-500"
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
          <div className="space-y-3 pt-1 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  4. Generated Slots Preview ({selectedIdxs.size}/{generatedSlots.length})
                </label>
                <p className="text-[11px] text-slate-500">
                  {dateMode === "RANGE"
                    ? `Generated across date range with ${slotType} mode`
                    : `Generated for ${singleDate} with ${slotType} mode`}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
              >
                {selectedIdxs.size === generatedSlots.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            {generatedSlots.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs text-center font-medium">
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
                        ? "border-orange-500 bg-orange-50 font-black shadow-2xs text-slate-900"
                        : "border-dashed border-slate-300 bg-slate-50 opacity-60 text-slate-400"
                    }`}
                  >
                    <span className="text-[10px] text-slate-500 font-medium">
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

        {/* Saving / Progress feedback */}
        {saving && (
          <div className="mx-5 mb-2 p-3 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-between text-xs text-orange-800">
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin text-sm text-orange-600" size={16} />
              <span className="font-semibold">
                Generating and saving {selectedIdxs.size} availability slots...
              </span>
            </div>
            <button
              type="button"
              onClick={handleCancelSave}
              className="text-xs font-bold underline hover:opacity-80 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Retry on failure feedback */}
        {saveError && !saving && (
          <div className="mx-5 mb-2 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between text-xs text-red-700">
            <span className="font-medium truncate mr-2">
              {saveError}
            </span>
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shrink-0 shadow-xs cursor-pointer flex items-center gap-1"
            >
              <RefreshCw size={12} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCancelSave}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {saving ? "Cancel Generation" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || selectedIdxs.size === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-md disabled:opacity-50 transition-all cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                <span>Saving {selectedIdxs.size} Slots...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Save {selectedIdxs.size} Slots</span>
              </>
            )}
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
  const location = useLocation();

  // Slots State
  const [unbookedSlots, setUnbookedSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [summary, setSummary] = useState({
    total_available: 0,
    total_booked: 0,
    upcoming_count: 0,
    past_count: 0,
    total_count: 0,
  });
  const [fetching, setFetching] = useState(false);

  // Modals & Drawers
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalInitialDate, setCreateModalInitialDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [detailModalApptId, setDetailModalApptId] = useState(null);

  // View Mode: Calendar vs List
  const [viewMode, setViewMode] = useState("calendar"); // "calendar" | "list"
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(getTodayStr());

  // Filters State
  const [timeHorizon, setTimeHorizon] = useState("upcoming"); // upcoming | past | all
  const [modeFilter, setModeFilter] = useState("ALL"); // ALL | VIRTUAL | IN_PERSON | BOTH
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | AVAILABLE | BOOKED | PENDING_REVIEW
  const [filterDate, setFilterDate] = useState("");
  const [search, setSearch] = useState("");

  /* ─── Fetch Slots ──────────────────────────────────────────── */
  const fetchSlots = async () => {
    setFetching(true);
    try {
      const params = {};
      if (viewMode === "list") {
        if (timeHorizon && timeHorizon !== "all") params.time_horizon = timeHorizon;
        if (filterDate) params.date = filterDate;
      } else {
        // In calendar mode, load all slots so month indicators are populated
        params.time_horizon = "all";
      }
      if (modeFilter && modeFilter !== "ALL") params.slot_type = modeFilter;
      if (statusFilter === "AVAILABLE") params.status = "unbooked";
      if (statusFilter === "BOOKED" || statusFilter === "PENDING_REVIEW") params.status = "booked";
      if (search) params.search = search;

      const res = await getMySlots(params);
      setUnbookedSlots(res.data?.unbooked_slots || []);
      setBookedSlots(res.data?.booked_slots || []);
      if (res.data?.summary) {
        setSummary(res.data.summary);
      }
    } catch {
      toast.error("Failed to fetch slots. Please try again.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [timeHorizon, modeFilter, statusFilter, filterDate, location.key, viewMode]);

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
    let combined = [];
    if (statusFilter === "PENDING_REVIEW") {
      combined = bookedSlots
        .filter((s) => s.appointment?.status === "PENDING_REVIEW")
        .map((s) => ({ ...s, is_booked: true }));
    } else {
      combined = [
        ...unbookedSlots.map((s) => ({ ...s, is_booked: false })),
        ...bookedSlots.map((s) => ({ ...s, is_booked: true })),
      ];
    }

    return combined.sort((a, b) => {
      if (a.date !== b.date) {
        return timeHorizon === "past" && viewMode === "list"
          ? b.date.localeCompare(a.date)
          : a.date.localeCompare(b.date);
      }
      return a.start_time.localeCompare(b.start_time);
    });
  }, [unbookedSlots, bookedSlots, timeHorizon, statusFilter, viewMode]);

  const pendingReviewCount = useMemo(() => {
    return bookedSlots.filter((s) => s.appointment?.status === "PENDING_REVIEW").length;
  }, [bookedSlots]);

  // Group by date for List View
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

  // Fast hashmap by date for Calendar View
  const slotsByDate = useMemo(() => {
    const map = {};
    for (const slot of allSlots) {
      if (!map[slot.date]) {
        map[slot.date] = { open: [], booked: [], pendingReview: [], all: [] };
      }
      map[slot.date].all.push(slot);
      if (slot.is_booked) {
        map[slot.date].booked.push(slot);
        if (slot.appointment?.status === "PENDING_REVIEW") {
          map[slot.date].pendingReview.push(slot);
        }
      } else {
        map[slot.date].open.push(slot);
      }
    }
    return map;
  }, [allSlots]);

  // Slots for the currently clicked date in Calendar
  const selectedDaySlots = useMemo(() => {
    return slotsByDate[selectedCalendarDate]?.all || [];
  }, [slotsByDate, selectedCalendarDate]);

  // Calendar dates matrix in current viewed month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(monthStart);
    const calendarStartDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
    const calendarEndDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = [];
    let day = calendarStartDate;
    while (day <= calendarEndDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [calendarMonth]);

  const totalCount = allSlots.length;
  const availableCount = unbookedSlots.length;
  const bookedCount = bookedSlots.length;

  const handleOpenAddModal = (date = null) => {
    if (date) {
      setCreateModalInitialDate(date);
    } else {
      setCreateModalInitialDate(null);
    }
    setCreateModalOpen(true);
  };

  /* ─── Render Single Slot Card ──────────────────────────────── */
  const renderSlotCard = (slot) => {
    const isBooked = slot.is_booked;
    const mode = slot.slot_type || "VIRTUAL";
    const price = slot.price || (mode === "IN_PERSON" ? slot.offline_price : slot.online_price) || 0;
    const isPendingReview = slot.appointment?.status === "PENDING_REVIEW";
    const isAwaitingPayment = slot.appointment?.status === "AWAITING_PAYMENT";

    return (
      <div
        key={slot.id}
        onClick={() => {
          if (isBooked) setSelectedSlot(slot);
        }}
        className={`rounded-2xl border-2 transition-all p-4 bg-white flex flex-col justify-between shadow-xs ${
          isBooked
            ? "cursor-pointer hover:shadow-md hover:border-orange-500 border-orange-200"
            : "hover:border-orange-400 border-slate-200"
        }`}
      >
        <div>
          {/* Slot Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="text-sm font-black text-slate-900 font-[var(--font-primary)]">
                {slot.start_time} – {slot.end_time}
              </span>

              {/* Mode Badge & Pricing Mode Badge */}
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {mode === "VIRTUAL" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                    <Video size={10} /> Virtual
                  </span>
                )}
                {mode === "IN_PERSON" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    <Building2 size={10} /> In-Clinic
                  </span>
                )}
                {mode === "BOTH" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    <Layers size={10} /> Online / Clinic
                  </span>
                )}
                {slot.pricing_mode === "VARIABLE" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-800 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                    <FileText size={10} /> Variable Quote
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    <Zap size={10} /> Fixed
                  </span>
                )}
              </div>
            </div>

            <div>
              {isBooked ? (
                isPendingReview ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 border border-orange-300 animate-pulse">
                    <Sparkles size={10} /> Review Case
                  </span>
                ) : isAwaitingPayment ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200">
                    <Clock size={10} /> Quoted
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                    <Lock size={10} /> Booked
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Open
                </span>
              )}
            </div>
          </div>

          {/* Price Display */}
          <div className="flex items-center justify-between text-xs py-1.5 border-t border-slate-200">
            <span className="text-[11px] font-medium text-slate-600">
              {slot.pricing_mode === "VARIABLE" ? (
                <span className="text-orange-700 font-bold">Quote upon case review</span>
              ) : (
                <>Fee: <strong className="text-slate-900">₹{price}</strong></>
              )}
            </span>
            {mode === "IN_PERSON" && (
              <span className="text-[10px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                {slot.offline_payment_required ? "Pay Online" : "Pay at Clinic"}
              </span>
            )}
          </div>

          {/* Patient Snippet for Booked Slots */}
          {isBooked && slot.patient && (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 my-2 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {(slot.patient.name || "P").charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {slot.patient.name || "Patient"}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {slot.patient.email || "No email"}
                  </p>
                </div>
              </div>
              {slot.patient.phone && (
                <p className="text-[10px] text-slate-600 flex items-center gap-1 truncate">
                  <Phone size={10} className="text-slate-400 shrink-0" />
                  <span>{slot.patient.phone}</span>
                </p>
              )}
              {slot.patient.goal && (
                <p className="text-[10px] text-orange-950 font-medium truncate">
                  🎯 {slot.patient.goal}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Slot Footer Actions */}
        <div className="pt-2 mt-1 border-t border-slate-200 flex items-center justify-between">
          {isBooked ? (
            <div className="flex items-center justify-between w-full text-xs font-bold text-orange-600">
              <span className={isPendingReview ? "text-orange-700 font-black flex items-center gap-1" : ""}>
                {isPendingReview ? (
                  <>
                    <Sparkles size={12} /> Review Case Request
                  </>
                ) : (
                  "Patient Details & Session"
                )}
              </span>
              <ArrowRight size={13} className={isPendingReview ? "text-orange-700" : ""} />
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] text-slate-500">
                Available for booking
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSlot(slot.id);
                }}
                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Delete Slot"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-20 bg-[var(--color-bg-app)] text-slate-900 font-[var(--font-secondary)]">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: "14px",
            fontFamily: "var(--font-secondary)",
            background: "#ffffff",
            color: "#0f172a",
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
        onClose={() => {
          setCreateModalOpen(false);
          setCreateModalInitialDate(null);
        }}
        onCreated={() => {
          fetchSlots();
          setCreateModalInitialDate(null);
        }}
        initialDate={createModalInitialDate}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">

        {/* ── Header & Primary Controls ── */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="mb-3">
              <BackButton label="Back to Dashboard" to="/nutritionist" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 text-[11px] font-bold tracking-wider uppercase mb-1.5 border border-orange-200">
              <CalendarDays size={12} /> Appointments & Consultation Schedule
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-[var(--font-primary)]">
              Appointments & Availability
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Interactive calendar scheduling, consultation slots, patient reviews, and session management.
            </p>
          </div>

          {/* Quick Metrics Chips & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <div className="px-3.5 py-2 rounded-2xl bg-white border-2 border-slate-200 shadow-2xs flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-600 block leading-tight">
                  {summary.total_available ?? availableCount}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Open Slots
                </span>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-white border-2 border-slate-200 shadow-2xs flex items-center gap-2.5">
              <Lock size={14} className="text-orange-600" />
              <div>
                <span className="text-base sm:text-lg font-black text-orange-600 block leading-tight">
                  {summary.total_booked ?? bookedCount}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Booked
                </span>
              </div>
            </div>

            {pendingReviewCount > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter("PENDING_REVIEW")}
                className="px-3.5 py-2 rounded-2xl bg-orange-50 border-2 border-orange-300 shadow-2xs flex items-center gap-2.5 cursor-pointer hover:bg-orange-100 transition-all text-left"
              >
                <Sparkles size={16} className="text-orange-600 animate-pulse shrink-0" />
                <div>
                  <span className="text-base sm:text-lg font-black text-orange-700 block leading-tight">
                    {pendingReviewCount}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-900">
                    Quotes Due
                  </span>
                </div>
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={fetchSlots}
                disabled={fetching}
                className="p-2.5 rounded-2xl border-2 border-slate-200 bg-white hover:border-orange-500 text-slate-500 hover:text-orange-600 transition-colors cursor-pointer shadow-2xs"
                title="Refresh Slots"
              >
                <RefreshCw size={16} className={fetching ? "animate-spin text-orange-600" : ""} />
              </button>

              <button
                onClick={() => handleOpenAddModal()}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-md active:scale-98 transition-all cursor-pointer"
              >
                <Plus size={16} /> Add Slots
              </button>
            </div>
          </div>
        </div>

        {/* ── Case Review Alert Banner (if any pending) ── */}
        {pendingReviewCount > 0 && (
          <div className="p-4 rounded-3xl bg-orange-50 border-2 border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  You have {pendingReviewCount} case consultation {pendingReviewCount === 1 ? "request" : "requests"} awaiting your fee quotation!
                </p>
                <p className="text-xs text-slate-600">
                  Review the patient's medical condition notes and provide your custom quote so they can pay and confirm.
                </p>
              </div>
            </div>
            <button
              onClick={() => setStatusFilter("PENDING_REVIEW")}
              className="self-start sm:self-auto px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              View Requests ({pendingReviewCount}) →
            </button>
          </div>
        )}

        {/* ── Clean Consolidated Control Toolbar ── */}
        <div className="p-3.5 sm:p-4 rounded-3xl bg-white border-2 border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left: View Mode Switcher + Horizon Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Calendar vs List Segmented Switcher */}
              <div className="flex items-center p-1 rounded-2xl bg-slate-100 border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode("calendar")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "calendar"
                      ? "bg-orange-500 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Calendar size={13} />
                  <span>Calendar View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "list"
                      ? "bg-orange-500 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <List size={13} />
                  <span>List View</span>
                </button>
              </div>

              {/* In List View: Horizon Filters (Upcoming / Past / All) */}
              {viewMode === "list" && (
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
                  {[
                    { key: "upcoming", label: "Upcoming", count: summary.upcoming_count },
                    { key: "past", label: "Past", count: summary.past_count },
                    { key: "all", label: "All Slots", count: summary.total_count },
                  ].map((tab) => {
                    const isActive = timeHorizon === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setTimeHorizon(tab.key)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          isActive
                            ? "bg-white text-orange-600 shadow-2xs font-black border border-slate-200"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <span>{tab.label}</span>
                        {tab.count !== undefined && (
                          <span className="text-[10px] opacity-75">({tab.count})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Search + Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search Patient */}
              <div className="relative min-w-[180px] sm:min-w-[220px]">
                {fetching && search ? (
                  <Loader2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-600 animate-spin" />
                ) : (
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                )}
                <input
                  type="text"
                  placeholder="Search patient or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 bg-white focus:border-orange-500 focus:outline-none text-xs text-slate-900 font-medium"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
                {[
                  { key: "ALL", label: "All" },
                  { key: "AVAILABLE", label: "Open" },
                  { key: "BOOKED", label: "Booked" },
                  ...(pendingReviewCount > 0
                    ? [{ key: "PENDING_REVIEW", label: "Quotes ⚡" }]
                    : []),
                ].map((st) => (
                  <button
                    key={st.key}
                    onClick={() => setStatusFilter(st.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === st.key
                        ? "bg-white text-orange-600 shadow-2xs font-black border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Mode Filter */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
                {[
                  { key: "ALL", label: "All Modes" },
                  { key: "VIRTUAL", label: "Virtual" },
                  { key: "IN_PERSON", label: "In-Clinic" },
                ].map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setModeFilter(m.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      modeFilter === m.key
                        ? "bg-white text-orange-600 shadow-2xs font-black border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Reset if filtered */}
              {(search || filterDate || modeFilter !== "ALL" || statusFilter !== "ALL") && (
                <button
                  onClick={() => {
                    setModeFilter("ALL");
                    setStatusFilter("ALL");
                    setFilterDate("");
                    setSearch("");
                  }}
                  className="py-1 px-2 rounded-lg text-xs font-bold text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
                  title="Reset Filters"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════
            VIEW 1: INTERACTIVE CALENDAR UI (DEFAULT)
        ═══════════════════════════════════════════════════════════ */}
        {viewMode === "calendar" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Columns: Interactive Month Grid */}
            <div className="lg:col-span-7 xl:col-span-7 bg-white rounded-3xl border-2 border-slate-200 shadow-xs overflow-hidden">
              {/* Calendar Month Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                    className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
                    title="Previous Month"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 font-[var(--font-primary)] min-w-[150px] text-center">
                    {format(calendarMonth, "MMMM yyyy")}
                  </h2>
                  <button
                    onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                    className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
                    title="Next Month"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      const today = new Date();
                      setCalendarMonth(today);
                      setSelectedCalendarDate(getTodayStr());
                    }}
                    className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:border-orange-500 hover:text-orange-600 transition-colors shadow-2xs cursor-pointer"
                  >
                    Today
                  </button>

                  <div className="hidden sm:flex items-center gap-2.5 text-[11px] font-semibold text-slate-500 pl-1 border-l border-slate-200">
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Open</span>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Booked</span>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Quote Due</span>
                  </div>
                </div>
              </div>

              {/* Day of Week Labels */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50 py-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
                  <div key={dayName} className="text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {dayName}
                  </div>
                ))}
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 border-b border-slate-200">
                {calendarDays.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const isCurrMonth = isSameMonth(day, calendarMonth);
                  const isTodayDay = isToday(day);
                  const isSelected = selectedCalendarDate === dateStr;
                  const dayData = slotsByDate[dateStr] || { open: [], booked: [], pendingReview: [], all: [] };
                  const hasOpen = dayData.open.length > 0;
                  const hasBooked = dayData.booked.length > 0;
                  const hasQuote = dayData.pendingReview.length > 0;

                  return (
                    <div
                      key={dateStr}
                      onClick={() => {
                        setSelectedCalendarDate(dateStr);
                        if (!isCurrMonth) {
                          setCalendarMonth(day);
                        }
                      }}
                      className={`min-h-[76px] sm:min-h-[88px] p-1.5 sm:p-2 transition-all flex flex-col justify-between cursor-pointer select-none relative ${
                        isSelected
                          ? "bg-orange-50/60 ring-2 ring-orange-500 z-10 shadow-2xs"
                          : isCurrMonth
                          ? "bg-white hover:bg-slate-50"
                          : "bg-slate-50/40 text-slate-400 hover:bg-slate-100/50"
                      }`}
                    >
                      {/* Top: Day Number + Today Marker */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold flex items-center justify-center w-6 h-6 rounded-full ${
                            isTodayDay
                              ? "bg-orange-500 text-white font-black shadow-2xs"
                              : isSelected
                              ? "text-orange-600 font-black"
                              : isCurrMonth
                              ? "text-slate-800"
                              : "text-slate-400"
                          }`}
                        >
                          {format(day, "d")}
                        </span>

                        {/* Dot indicator on small screens */}
                        <div className="flex sm:hidden items-center gap-0.5">
                          {hasQuote && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                          {hasBooked && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                          {hasOpen && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        </div>
                      </div>

                      {/* Bottom Badges on Tablet/Desktop */}
                      <div className="hidden sm:flex flex-col gap-1 mt-1">
                        {hasQuote && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md font-extrabold bg-amber-100 text-amber-900 border border-amber-300 truncate block animate-pulse">
                            ⚡ {dayData.pendingReview.length} Quote Due
                          </span>
                        )}
                        {hasBooked && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md font-bold bg-orange-100 text-orange-800 truncate block">
                            {dayData.booked.length} booked
                          </span>
                        )}
                        {hasOpen && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md font-bold bg-emerald-100 text-emerald-800 truncate block">
                            {dayData.open.length} open
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Calendar Summary Footnote */}
              <div className="p-3 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
                <span>Click any day to manage its consultation schedule</span>
                <span className="font-semibold text-slate-700">
                  {format(calendarMonth, "MMMM")}: {summary.total_count || totalCount} Total Slots
                </span>
              </div>
            </div>

            {/* Right 5 Columns: Selected Day Agenda & Details */}
            <div className="lg:col-span-5 xl:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xs p-5">
                {/* Day Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Day Schedule
                      </span>
                      {getRelativeDateLabel(selectedCalendarDate) && (
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            getRelativeDateLabel(selectedCalendarDate) === "Today"
                              ? "bg-emerald-100 text-emerald-800"
                              : getRelativeDateLabel(selectedCalendarDate) === "Tomorrow"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {getRelativeDateLabel(selectedCalendarDate)}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 font-[var(--font-primary)]">
                      {fmtDate(selectedCalendarDate)}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenAddModal(selectedCalendarDate)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-2xs shrink-0 cursor-pointer"
                  >
                    <Plus size={14} /> Add Slots
                  </button>
                </div>

                {/* Day Slots List */}
                <div className="pt-3">
                  {fetching ? (
                    <div className="py-12 text-center text-slate-500 space-y-2">
                      <Loader2 size={24} className="animate-spin text-orange-600 mx-auto" />
                      <p className="text-xs font-semibold">Loading day slots...</p>
                    </div>
                  ) : selectedDaySlots.length === 0 ? (
                    <div className="py-12 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                      <CalendarClock size={32} className="text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-800">
                        No slots for {fmtDate(selectedCalendarDate)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 mb-4">
                        You have not scheduled any consultation slots for this date.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal(selectedCalendarDate)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 transition-all shadow-xs cursor-pointer"
                      >
                        <Plus size={14} /> Add Availability for this Date
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
                        <span>{selectedDaySlots.length} slot{selectedDaySlots.length > 1 ? "s" : ""} scheduled</span>
                        <span>
                          {selectedDaySlots.filter(s => s.is_booked).length} booked • {selectedDaySlots.filter(s => !s.is_booked).length} open
                        </span>
                      </div>
                      {selectedDaySlots.map((slot) => renderSlotCard(slot))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ═════════════════════════════════════════════════════════
              VIEW 2: TRADITIONAL LIST VIEW (FILTERABLE CARDS)
          ═══════════════════════════════════════════════════════════ */
          <div className="space-y-6">
            {fetching ? (
              <div className="p-10 rounded-3xl border-2 border-slate-200 bg-white text-center shadow-xs">
                <Loader2 size={32} className="animate-spin text-orange-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">Loading Availability Slots...</h3>
                <p className="text-xs text-slate-500 mt-1">Fetching your consultation schedule...</p>
              </div>
            ) : groupedSlots.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-slate-200 bg-white">
                <CalendarDays size={32} className="text-orange-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">No availability slots found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  {search
                    ? `No consultation slots match your search "${search}".`
                    : "No consultation slots match your current filter settings."}
                </p>
                <button
                  onClick={() => handleOpenAddModal()}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-md cursor-pointer"
                >
                  <Plus size={15} /> Add Availability Slots
                </button>
              </div>
            ) : (
              groupedSlots.map(({ date, slots, relative }) => (
                <div key={date} className="space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-orange-600" />
                      <h2 className="text-sm font-bold text-slate-900 font-[var(--font-primary)]">
                        {fmtDate(date)}
                      </h2>
                      {relative && (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            relative === "Today"
                              ? "bg-emerald-100 text-emerald-800"
                              : relative === "Tomorrow"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {relative}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-semibold">
                      {slots.length} slot{slots.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {slots.map((slot) => renderSlotCard(slot))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddAvailability;