import React, { useState, useMemo } from "react";
import { Video, Clock, Building2, Layers, Sun, Sunrise, Sunset, Loader2 } from "lucide-react";

const SlotPicker = ({ slots, onBook, loading, pendingSlotId, appointmentType = "VIRTUAL" }) => {
  const [timeFilter, setTimeFilter] = useState("ALL"); // ALL | MORNING | AFTERNOON | EVENING

  // Only consider slots compatible with selected consultation mode (Virtual or In-Clinic)
  const compatibleSlots = useMemo(() => {
    if (!Array.isArray(slots)) return [];
    return slots.filter((slot) => {
      const mode = slot.slot_type || "BOTH";
      return mode === "BOTH" || mode === appointmentType;
    });
  }, [slots, appointmentType]);

  // Filter compatible slots by time of day
  const filteredSlots = useMemo(() => {
    return compatibleSlots.filter((slot) => {
      if (timeFilter === "ALL") return true;
      const hour = parseInt(slot.start_time.split(":")[0], 10);
      if (timeFilter === "MORNING") return hour < 12;
      if (timeFilter === "AFTERNOON") return hour >= 12 && hour < 17;
      if (timeFilter === "EVENING") return hour >= 17;
      return true;
    });
  }, [compatibleSlots, timeFilter]);

  if (!Array.isArray(slots) || compatibleSlots.length === 0) {
    return (
      <div className="text-center py-8 px-4 rounded-2xl border-2 border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)]">
        <Clock className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-subtle)] opacity-40" />
        <p className="text-[var(--color-text-strong)] text-sm font-bold">
          No open {appointmentType === "IN_PERSON" ? "In-Clinic" : "Virtual"} slots found for this date
        </p>
        <p className="text-[var(--color-text-muted)] text-xs mt-1 max-w-sm mx-auto">
          Please check {appointmentType === "IN_PERSON" ? "Virtual Video Consultation" : "In-Clinic Consultation"} or select another date on the calendar.
        </p>
      </div>
    );
  }

  const morningCount = compatibleSlots.filter((s) => parseInt(s.start_time.split(":")[0], 10) < 12).length;
  const afternoonCount = compatibleSlots.filter((s) => {
    const h = parseInt(s.start_time.split(":")[0], 10);
    return h >= 12 && h < 17;
  }).length;
  const eveningCount = compatibleSlots.filter((s) => parseInt(s.start_time.split(":")[0], 10) >= 17).length;

  return (
    <div className="space-y-3 mt-3">
      {/* Booking in progress feedback banner */}
      {loading && (
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-[var(--color-primary-bg-subtle)] border-2 border-[var(--color-primary)] text-[var(--color-text-strong)] text-xs font-bold animate-pulse shadow-sm">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)] shrink-0" />
          <span>Confirming your appointment booking... Please wait a moment.</span>
        </div>
      )}

      {/* Time of Day Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[var(--color-bg-surface-alt)] border border-[var(--color-border-default)]">
        {[
          { key: "ALL", label: `All Times (${compatibleSlots.length})`, icon: <Clock size={12} /> },
          { key: "MORNING", label: `Morning (${morningCount})`, icon: <Sunrise size={12} /> },
          { key: "AFTERNOON", label: `Afternoon (${afternoonCount})`, icon: <Sun size={12} /> },
          { key: "EVENING", label: `Evening (${eveningCount})`, icon: <Sunset size={12} /> },
        ].map((f) => (
          <button
            type="button"
            key={f.key}
            disabled={loading}
            onClick={() => setTimeFilter(f.key)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed ${
              timeFilter === f.key
                ? "bg-[var(--color-primary)] text-white shadow-xs"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-strong)]"
            }`}
          >
            {f.icon}
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      {filteredSlots.length === 0 ? (
        <div className="text-center py-6 px-3 rounded-xl border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-surface-alt)]">
          <p className="text-xs text-[var(--color-text-muted)]">
            No compatible slots in the {timeFilter.toLowerCase()} window. Try selecting "All Times".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filteredSlots.map((slot) => {
            const mode = slot.slot_type || "VIRTUAL";
            const isInPerson = mode === "IN_PERSON";
            const isBoth = mode === "BOTH";
            const isThisSlotBooking = loading && pendingSlotId === slot.id;

            // Compute the price based on active appointmentType or slot default
            const effectivePrice = appointmentType === "IN_PERSON"
              ? (slot.offline_price ?? slot.price ?? 0)
              : (slot.online_price ?? slot.price ?? 0);

            const isPayAtClinic = appointmentType === "IN_PERSON" && slot.offline_payment_required === false;

            return (
              <button
                key={slot.id}
                disabled={loading}
                onClick={() => onBook(slot.id)}
                className={`group relative flex flex-col p-3.5 rounded-2xl border-2 transition-all duration-200 text-left shadow-xs hover:shadow-md ${
                  isThisSlotBooking
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-bg-subtle)] ring-2 ring-[var(--color-primary)]/30 cursor-wait"
                    : "border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-surface-alt)] cursor-pointer"
                } ${loading && !isThisSlotBooking ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="text-xs sm:text-sm font-black text-[var(--color-text-strong)] group-hover:text-[var(--color-primary)] transition-colors">
                    {slot.start_time} – {slot.end_time}
                  </span>

                  {/* Mode Badge */}
                  {mode === "VIRTUAL" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      <Video size={10} /> Online
                    </span>
                  )}
                  {isInPerson && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Building2 size={10} /> In-Clinic
                    </span>
                  )}
                  {isBoth && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                      <Layers size={10} /> Online / Clinic
                    </span>
                  )}
                </div>

                {/* Price and Payment terms */}
                <div className="flex items-center justify-between w-full mt-1 pt-2 border-t border-[var(--color-border-default)]/60 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-[var(--color-text-strong)] text-xs sm:text-sm">
                      ₹{effectivePrice}
                    </span>
                    {isPayAtClinic ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                        Pay at Clinic
                      </span>
                    ) : effectivePrice > 0 ? (
                      <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">
                        Online / Quota
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded-md">
                        Plan Included
                      </span>
                    )}
                  </div>

                  {isThisSlotBooking ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[var(--color-primary)]">
                      <Loader2 size={13} className="animate-spin text-[var(--color-primary)]" />
                      Booking...
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-[var(--color-primary)] group-hover:underline">
                      Select Slot →
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SlotPicker;
