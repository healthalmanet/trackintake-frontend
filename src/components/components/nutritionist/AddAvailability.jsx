import React, { useEffect, useState, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  CalendarDays, Trash2, Plus, Lock, Home, ChevronRight,
  Search, X, User, Video, Copy, ExternalLink,
  Clock, Calendar, Sparkles, Zap, ArrowRight, Check,
  RefreshCw, ShieldCheck, Sun, Sunrise, Sunset,
  SlidersHorizontal, CheckCircle2, ChevronLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMySlots, addAvailability, deleteAvailability } from "../../../api/availabilityApi";

/* ─── Helpers ──────────────────────────────────────────────── */
const getTodayStr = () => new Date().toISOString().split("T")[0];

const getTomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
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

/* ─── Patient Details Modal ─────────────────────────────────── */
const PatientModal = ({ slot, onClose }) => {
  if (!slot) return null;

  const p = slot.patient || {};
  const appt = slot.appointment || {};
  const link = appt.meeting_link || null;

  const copy = () => {
    if (link) {
      navigator.clipboard.writeText(link);
      toast.success("Zoom meeting link copied to clipboard!", {
        icon: "📋",
      });
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
        <div className="p-6 text-white relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700">
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
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Video size={11} /> Virtual Consultation
              </div>
              <h2 className="text-xl font-bold">{p.name || "Patient"}</h2>
              <p className="text-white/80 text-xs">{p.email || "No email available"}</p>
            </div>
          </div>
        </div>

        {/* Time Banner */}
        <div className="mx-5 -mt-3 bg-[var(--color-bg-surface)] rounded-2xl p-3.5 shadow-md border border-[var(--color-border-default)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-blue-600" />
            <span className="font-bold text-[var(--color-text-strong)] text-sm">
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
          {/* Zoom Meeting Link Section */}
          <div className="p-4 rounded-2xl bg-blue-50/90 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Video size={15} className="text-blue-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  Zoom Video Consultation
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Active Session
              </span>
            </div>

            {link ? (
              <div>
                <p className="text-xs font-mono break-all mb-3 px-3 py-2 rounded-xl bg-white text-blue-900 border border-blue-200 shadow-2xs">
                  {link}
                </p>
                <div className="flex gap-2">
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors cursor-pointer text-center"
                  >
                    <ExternalLink size={13} /> Join Consultation
                  </a>
                  <button
                    onClick={copy}
                    className="inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-bold text-blue-700 bg-white border border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <Copy size={13} /> Copy Link
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-blue-600 italic">
                Zoom link will be generated automatically before session start.
              </p>
            )}
          </div>

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
              {p.age && (
                <div className="p-2.5 rounded-xl bg-[var(--color-bg-surface-alt)]">
                  <span className="text-[10px] text-[var(--color-text-muted)] block mb-0.5">Age</span>
                  <span className="font-semibold text-[var(--color-text-strong)]">{p.age} years</span>
                </div>
              )}
              {p.notes && (
                <div className="p-2.5 rounded-xl bg-[var(--color-bg-surface-alt)] col-span-2">
                  <span className="text-[10px] text-[var(--color-text-muted)] block mb-0.5">Health Notes</span>
                  <span className="font-medium text-[var(--color-text-strong)]">{p.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Create Slots Modal (Clean 2-Step Creator) ──────────────── */
const CreateSlotsModal = ({ isOpen, onClose, onCreated }) => {
  const [date, setDate] = useState(getTodayStr());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [duration, setDuration] = useState(30);
  const [activePreset, setActivePreset] = useState("FULL_DAY");
  const [generatedSlots, setGeneratedSlots] = useState([]);
  const [selectedIdxs, setSelectedIdxs] = useState(new Set());
  const [saving, setSaving] = useState(false);

  // Apply quick preset
  const applyPreset = (preset) => {
    setActivePreset(preset);
    if (preset === "MORNING") {
      setStartTime("09:00");
      setEndTime("13:00");
    } else if (preset === "AFTERNOON") {
      setStartTime("14:00");
      setEndTime("18:00");
    } else if (preset === "FULL_DAY") {
      setStartTime("09:00");
      setEndTime("17:00");
    }
  };

  // Generate slot previews whenever date, times, or duration change
  useEffect(() => {
    if (!date || !startTime || !endTime) {
      setGeneratedSlots([]);
      setSelectedIdxs(new Set());
      return;
    }
    if (startTime >= endTime) {
      setGeneratedSlots([]);
      setSelectedIdxs(new Set());
      return;
    }

    const temp = [];
    let cur = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    while (cur < end) {
      const next = new Date(cur.getTime() + duration * 60000);
      if (next > end) break;
      temp.push({
        date,
        start_time: cur.toTimeString().slice(0, 5),
        end_time: next.toTimeString().slice(0, 5),
        slot_type: "VIRTUAL",
      });
      cur = next;
    }

    setGeneratedSlots(temp);
    setSelectedIdxs(new Set(temp.map((_, i) => i)));
  }, [date, startTime, endTime, duration]);

  const toggleSlot = (idx) => {
    const next = new Set(selectedIdxs);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedIdxs(next);
  };

  const toggleAll = () => {
    if (selectedIdxs.size === generatedSlots.length) {
      setSelectedIdxs(new Set());
    } else {
      setSelectedIdxs(new Set(generatedSlots.map((_, i) => i)));
    }
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
      toast.success(`Created ${count} virtual consultation slot${count > 1 ? "s" : ""}!`);
      onCreated();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || "Could not create slots (some may overlap).";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-[var(--color-bg-surface)] shadow-2xl overflow-hidden border border-[var(--color-border-default)]"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "92vh", display: "flex", flexDirection: "column" }}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Video size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                Add Virtual Availability Slots
              </h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                Generate 100% online Zoom consultation slots for patient bookings.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--color-border-default)] text-[var(--color-text-muted)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Step 1: Date & Presets */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              1. Choose Date
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDate(getTodayStr())}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  date === getTodayStr()
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] text-[var(--color-text-strong)] hover:border-blue-400"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDate(getTomorrowStr())}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  date === getTomorrowStr()
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] text-[var(--color-text-strong)] hover:border-blue-400"
                }`}
              >
                Tomorrow
              </button>
              <input
                type="date"
                min={getTodayStr()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] text-xs font-semibold text-[var(--color-text-strong)] focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Step 2: Time Window & Presets */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              2. Working Hours Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: "MORNING", label: "Morning", sub: "09:00 - 13:00", icon: <Sunrise size={14} /> },
                { key: "AFTERNOON", label: "Afternoon", sub: "14:00 - 18:00", icon: <Sunset size={14} /> },
                { key: "FULL_DAY", label: "Full Day", sub: "09:00 - 17:00", icon: <Sun size={14} /> },
                { key: "CUSTOM", label: "Custom Time", sub: "Pick below", icon: <Clock size={14} /> },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => applyPreset(p.key)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    activePreset === p.key
                      ? "border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs ring-1 ring-blue-500"
                      : "border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] text-[var(--color-text-default)] hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    {p.icon}
                    <span>{p.label}</span>
                  </div>
                  <span className="text-[11px] opacity-75 block mt-0.5">{p.sub}</span>
                </button>
              ))}
            </div>

            {/* Custom Times Row */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div>
                <span className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">From</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setActivePreset("CUSTOM");
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] text-xs font-semibold text-[var(--color-text-strong)] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">To</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setActivePreset("CUSTOM");
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] text-xs font-semibold text-[var(--color-text-strong)] focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[var(--color-text-muted)] block mb-1">Duration</span>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] text-xs font-semibold text-[var(--color-text-strong)] focus:outline-none focus:border-blue-500"
                >
                  <option value={15}>15 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>60 mins</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 3: Slot Preview & Interactive Toggles */}
          <div className="space-y-3 pt-2 border-t border-[var(--color-border-default)]">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  3. Select Slots to Create ({selectedIdxs.size}/{generatedSlots.length})
                </label>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  Click any slot to exclude it (e.g. your lunch or personal break).
                </p>
              </div>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                {selectedIdxs.size === generatedSlots.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            {generatedSlots.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center">
                Invalid time range. Please ensure start time is earlier than end time.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                {generatedSlots.map((s, idx) => {
                  const isChecked = selectedIdxs.has(idx);
                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => toggleSlot(idx)}
                      className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        isChecked
                          ? "border-blue-500 bg-blue-50 text-blue-900 font-bold shadow-2xs"
                          : "border-dashed border-gray-300 bg-gray-50 text-gray-400 opacity-60"
                      }`}
                    >
                      <span className="text-xs">{s.start_time} - {s.end_time}</span>
                      <span className="text-[9px] mt-0.5 opacity-80 flex items-center gap-0.5">
                        <Video size={9} /> Virtual
                      </span>
                    </button>
                  );
                })}
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
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md disabled:opacity-50 transition-all cursor-pointer"
          >
            <Check size={16} /> Save {selectedIdxs.size} Virtual Slots
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT: NUTRITIONIST VIRTUAL SCHEDULE
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

  // Filters State
  const [timeHorizon, setTimeHorizon] = useState("upcoming"); // upcoming | past | all
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | AVAILABLE | BOOKED
  const [filterDate, setFilterDate] = useState("");
  const [search, setSearch] = useState("");

  /* ─── Fetch Slots ──────────────────────────────────────────── */
  const fetchSlots = async () => {
    setFetching(true);
    try {
      const params = {};
      if (timeHorizon && timeHorizon !== "all") params.time_horizon = timeHorizon;
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
  }, [timeHorizon, statusFilter, filterDate]);

  useEffect(() => {
    const timer = setTimeout(fetchSlots, 300);
    return () => clearTimeout(timer);
  }, [search]);

  /* ─── Delete Available Slot ────────────────────────────────── */
  const handleDeleteSlot = async (id) => {
    if (!window.confirm("Remove this open slot?")) return;

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
        <PatientModal slot={selectedSlot} onClose={() => setSelectedSlot(null)} />
      )}

      {/* Add Slots Modal */}
      <CreateSlotsModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={fetchSlots}
      />

      {/* ── Top Bar ── */}
      <div className="bg-[var(--color-bg-surface)] border-b border-[var(--color-border-default)] px-4 sm:px-8 py-3 sticky top-[57px] z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--color-text-muted)]">
            <button
              onClick={() => navigate("/nutritionist")}
              className="flex items-center gap-1 hover:text-[var(--color-primary)] font-semibold transition-colors cursor-pointer"
            >
              <Home size={14} /> Nutritionist Hub
            </button>
            <ChevronRight size={14} />
            <span className="font-bold text-[var(--color-text-strong)]">
              Schedule & Availability
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSlots}
              disabled={fetching}
              className="p-2 rounded-xl border border-[var(--color-border-default)] hover:bg-[var(--color-bg-surface-alt)] text-[var(--color-text-muted)] transition-colors cursor-pointer"
              title="Refresh Slots"
            >
              <RefreshCw size={15} className={fetching ? "animate-spin text-blue-600" : ""} />
            </button>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md active:scale-98 transition-all cursor-pointer"
            >
              <Plus size={16} /> Add Slots
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-6">

        {/* ── Clean Header & Summary Stats ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold tracking-wider uppercase mb-1.5 border border-blue-200">
              <Video size={12} /> 100% Virtual Consultation Platform
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
              Consultation Schedule
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-0.5">
              Manage your Zoom video availability slots and review booked patient sessions.
            </p>
          </div>

          {/* Quick Metrics Chips */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <span className="text-lg font-black text-emerald-600 block leading-tight">
                  {availableCount}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Available Slots
                </span>
              </div>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs flex items-center gap-3">
              <Lock size={14} className="text-blue-600" />
              <div>
                <span className="text-lg font-black text-blue-600 block leading-tight">
                  {bookedCount}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Booked Sessions
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Streamlined Filter Toolbar (Upcoming vs Past) ── */}
        <div className="p-4 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] shadow-xs space-y-3">
          
          {/* Main Horizon & Status Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Horizon Filter Tabs (Upcoming / Past / All) */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)]">
              {[
                { key: "upcoming", label: "Upcoming Slots" },
                { key: "past", label: "Past Slots" },
                { key: "all", label: "All Slots" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setTimeHorizon(tab.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timeHorizon === tab.key
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
                  }`}
                >
                  {tab.label}
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
                className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] focus:border-blue-500 focus:outline-none text-xs text-[var(--color-text-strong)]"
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
                className="w-full px-3 py-1.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)] focus:border-blue-500 focus:outline-none text-xs text-[var(--color-text-strong)] font-semibold"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setTimeHorizon("upcoming");
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
                ? "You don't have any upcoming availability slots set up yet."
                : "No consultation slots match your current filter settings."}
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md cursor-pointer"
            >
              <Plus size={15} /> Add Virtual Slots
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedSlots.map(({ date, slots, relative }) => (
              <div key={date} className="space-y-3">
                {/* Date Group Header */}
                <div className="flex items-center justify-between pb-1.5 border-b border-[var(--color-border-default)]">
                  <div className="flex items-center gap-2">
                    <Calendar size={15} className="text-blue-600" />
                    <h2 className="text-sm font-bold text-[var(--color-text-strong)] font-[var(--font-primary)]">
                      {fmtDate(date)}
                    </h2>
                    {relative && (
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        relative === "Today"
                          ? "bg-emerald-100 text-emerald-800"
                          : relative === "Tomorrow"
                          ? "bg-blue-100 text-blue-800"
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

                    return (
                      <div
                        key={slot.id}
                        onClick={() => {
                          if (isBooked) setSelectedSlot(slot);
                        }}
                        className={`rounded-2xl border transition-all p-3.5 bg-[var(--color-bg-surface)] flex flex-col justify-between shadow-2xs ${
                          isBooked
                            ? "cursor-pointer hover:shadow-md hover:border-blue-400 border-blue-200"
                            : "hover:border-emerald-300 border-[var(--color-border-default)]"
                        }`}
                      >
                        <div>
                          {/* Slot Header */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="text-sm font-black text-[var(--color-text-strong)] font-[var(--font-primary)]">
                                {slot.start_time} – {slot.end_time}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200 ml-2">
                                <Video size={10} /> Virtual
                              </span>
                            </div>

                            <div>
                              {isBooked ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                  <Lock size={10} /> Booked
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Open
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Patient Snippet for Booked Slots */}
                          {isBooked && slot.patient && (
                            <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-100 my-2">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                                  {(slot.patient.name || "P").charAt(0).toUpperCase()}
                                </div>
                                <div className="overflow-hidden">
                                  <p className="text-xs font-bold text-blue-950 truncate">
                                    {slot.patient.name || "Patient"}
                                  </p>
                                  <p className="text-[10px] text-blue-700 truncate">
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
                            <div className="flex items-center justify-between w-full text-xs font-bold text-blue-600">
                              <span>Join Zoom / Patient Details</span>
                              <ArrowRight size={13} />
                            </div>
                          ) : (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[10px] text-[var(--color-text-muted)]">
                                Open for patient booking
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